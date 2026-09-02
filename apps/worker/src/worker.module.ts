import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import type { Logger } from 'pino';
import { QUEUE_NAMES } from '@service/shared';
import { createNotificationWorker } from './processors/notification.processor';

interface WorkerModule {
  start: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export function createWorkerModule(logger: Logger): WorkerModule {
  const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  const workers: Worker[] = [];
  const queues: Queue[] = [];

  return {
    async start() {
      // ─── Register Queues ─────────────────────────────
      // Queues are registered here but processors are added in Phase 2
      for (const queueName of Object.values(QUEUE_NAMES)) {
        const queue = new Queue(queueName, { connection: redisConnection });
        queues.push(queue);
        logger.info(`Queue registered: ${queueName}`);
      }

      // ─── Placeholder Worker ──────────────────────────
      // A health-check worker to verify BullMQ infrastructure works
      const healthWorker = new Worker(
        'health',
        async (job) => {
          logger.info(`Processing health job: ${job.id}`);
          return { status: 'ok', processedAt: new Date().toISOString() };
        },
        { connection: redisConnection },
      );

      healthWorker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed`);
      });

      healthWorker.on('failed', (job, error) => {
        logger.error(`Job ${job?.id} failed: ${error.message}`);
      });

      workers.push(healthWorker);
      logger.info('Health worker registered');

      // ─── Notification Worker ────────────────────────
      const notificationWorker = createNotificationWorker(redisConnection, logger);
      workers.push(notificationWorker);
      logger.info('Notification worker registered');
    },

    async shutdown() {
      logger.info('Closing workers...');
      await Promise.all(workers.map((w) => w.close()));

      logger.info('Closing queues...');
      await Promise.all(queues.map((q) => q.close()));

      logger.info('Closing Redis connection...');
      await redisConnection.quit();
    },
  };
}
