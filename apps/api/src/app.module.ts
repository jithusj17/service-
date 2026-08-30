import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { configSchema } from './config/config.schema';
import { DatabaseModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { AppConfigModule } from './config/config.module';

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
  ],
})
export class AppModule {}
