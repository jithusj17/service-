import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(name: string) {
    try {
      const tenant = await this.prisma.tenant.create({
        data: { name },
      });
      return tenant;
    } catch (error) {
      throw new ConflictException('Failed to create tenant');
    }
  }

  async findTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }
}
