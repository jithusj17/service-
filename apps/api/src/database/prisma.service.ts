import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { createTenantExtension } from './tenant.extension';

const mockCls = {} as ClsService;
const extendedPrismaClient = new PrismaClient().$extends(createTenantExtension(mockCls));
export type ExtendedPrismaClient = typeof extendedPrismaClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public readonly extended: ExtendedPrismaClient;

  constructor(private readonly cls: ClsService) {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });

    this.extended = this.$extends(createTenantExtension(this.cls)) as unknown as ExtendedPrismaClient;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
