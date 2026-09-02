import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { ClsService } from 'nestjs-cls';
import { NotificationChannel } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all in-app notifications for current user/tenant' })
  async getNotifications(@Req() req: any) {
    // Ideally this filters by user or just returns tenant-wide if admin
    // For now we'll just return the 20 most recent IN_APP notifications
    const notifications = await this.prisma.extended.notification.findMany({
      where: {
        tenantId: this.cls.get('tenantId'),
        channel: NotificationChannel.IN_APP,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { data: notifications };
  }
}
