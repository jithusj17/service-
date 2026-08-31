import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';
import { configSchema } from './config/config.schema';
import { DatabaseModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // ─── Configuration ───────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),

    // ─── Logging ─────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),

    // ─── Infrastructure ──────────────────────────────
    AppConfigModule,
    DatabaseModule,

    // ─── Features ────────────────────────────────────
    HealthModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
