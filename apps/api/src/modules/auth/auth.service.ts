import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { AuditService } from '../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { TokenPair } from '@service/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private auditService: AuditService,
    private config: AppConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string): Promise<TokenPair> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const tenant = await this.tenantsService.createTenant(dto.tenantName);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
      tenant: { connect: { id: tenant.id } },
      role: Role.OWNER,
    });

    await this.auditService.logEvent({
      action: 'USER_REGISTERED',
      userId: user.id,
      tenantId: tenant.id,
      ipAddress,
    });

    // Generate email verification token (mock sending email)
    const verifyToken = randomBytes(32).toString('hex');
    await this.prisma.extended.verificationToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        token: verifyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    // In Phase 3+, we would send this via BullMQ email queue
    console.log(
      `[MOCK EMAIL] Verification Link: http://localhost:3000/verify-email?token=${verifyToken}`,
    );

    return this.generateTokens(user.id, user.email, user.tenantId, [user.role], ipAddress);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status !== 'ACTIVE') {
      await this.auditService.logEvent({
        action: 'LOGIN_FAILED_INVALID_USER',
        details: { email: dto.email },
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.logEvent({
        action: 'LOGIN_FAILED_INVALID_PASSWORD',
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.logEvent({
      action: 'USER_LOGIN',
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress,
    });

    return this.generateTokens(
      user.id,
      user.email,
      user.tenantId,
      [user.role],
      ipAddress,
      userAgent,
    );
  }

  async logout(userId: string, refreshToken: string, ipAddress?: string): Promise<void> {
    await this.prisma.extended.session.updateMany({
      where: { userId, token: refreshToken },
      data: { revokedAt: new Date() },
    });
    await this.auditService.logEvent({ action: 'USER_LOGOUT', userId, ipAddress });
  }

  async refreshToken(token: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const session = await this.prisma.extended.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the old refresh token (token rotation)
    await this.prisma.extended.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = session.user;
    return this.generateTokens(
      user.id,
      user.email,
      user.tenantId,
      [user.role],
      ipAddress,
      userAgent,
    );
  }

  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Prevent user enumeration

    // Invalidate existing tokens
    await this.prisma.extended.verificationToken.updateMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
      data: { usedAt: new Date() }, // Mark as used/invalid
    });

    const resetToken = randomBytes(32).toString('hex');
    await this.prisma.extended.verificationToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        token: resetToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      },
    });

    await this.auditService.logEvent({
      action: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress,
    });

    // Mock sending email
    console.log(
      `[MOCK EMAIL] Reset Password Link: http://localhost:3000/reset-password?token=${resetToken}`,
    );
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string): Promise<void> {
    const record = await this.prisma.extended.verificationToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (
      !record ||
      record.type !== 'PASSWORD_RESET' ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.extended.$transaction([
      this.prisma.extended.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.extended.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing sessions so they have to log in again
      this.prisma.extended.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.logEvent({
      action: 'PASSWORD_RESET_COMPLETED',
      userId: record.userId,
      tenantId: record.user.tenantId,
      ipAddress,
    });
  }

  async verifyEmail(token: string, ipAddress?: string): Promise<void> {
    const record = await this.prisma.extended.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !record ||
      record.type !== 'EMAIL_VERIFICATION' ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.extended.$transaction([
      this.prisma.extended.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.extended.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.auditService.logEvent({
      action: 'EMAIL_VERIFIED',
      userId: record.userId,
      tenantId: record.user.tenantId,
      ipAddress,
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    roles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, email, tenantId, roles };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.jwtExpiration as any,
    });

    const refreshTokenString = randomBytes(64).toString('hex');

    // Calculate expiration date for DB storage based on JWT_REFRESH_EXPIRATION config (e.g., '7d')
    const daysMatch = this.config.jwtRefreshExpiration.match(/(\d+)d/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.extended.session.create({
      data: {
        userId,
        token: refreshTokenString,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
