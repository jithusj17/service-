import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(name: string) {
    try {
      const tenant = await this.prisma.extended.tenant.create({
        data: { name },
      });
      return tenant;
    } catch (error) {
      throw new ConflictException('Failed to create tenant');
    }
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.extended.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }
}
