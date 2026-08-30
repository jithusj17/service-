import * as dotenv from 'dotenv';
import pino from 'pino';
import { createWorkerModule } from './worker.module';

dotenv.config();

const logger = pino({
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
});

async function bootstrap() {
  logger.info('🔧 Starting worker...');

  const workerModule = createWorkerModule(logger);

  // ─── Graceful Shutdown ───────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    await workerModule.shutdown();
    logger.info('Worker shut down successfully.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await workerModule.start();
  logger.info('✅ Worker started successfully');
}

bootstrap().catch((error) => {
  logger.error(error, 'Failed to start worker');
  process.exit(1);
});
