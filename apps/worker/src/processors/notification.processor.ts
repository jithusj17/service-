import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import type { Logger } from 'pino';
import { PrismaClient } from '@prisma/client';
import { QUEUE_NAMES } from '@service/shared';

const prisma = new PrismaClient();

async function mockSendEmail(to: string, subject: string, body: string, logger: Logger) {
  // Simulate latency
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Simulate occasional failure (e.g. 10% chance) to test retries
  if (Math.random() < 0.1) {
    throw new Error('Transient email provider failure');
  }

  logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
}

export function createNotificationWorker(redisConnection: Redis, logger: Logger) {
  const worker = new Worker(
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job) => {
      logger.info(`Processing notification job: ${job.name} (ID: ${job.id})`);
      
      const { tenantId, customerId, userId, channels } = job.data;
      
      // We will create a notification record for each channel requested
      for (const channel of channels) {
        let title = '';
        let message = '';
        
        // Format content based on job type
        switch (job.name) {
          case 'estimate.sent':
            title = 'Estimate Sent';
            message = `Estimate ${job.data.estimateId} has been sent for a total of $${job.data.total}.`;
            break;
          case 'estimate.approved':
            title = 'Estimate Approved';
            message = `Estimate ${job.data.estimateId} was approved!`;
            break;
          case 'repair.status_changed':
            title = 'Repair Status Update';
            message = `Work Order ${job.data.workOrderNumber} status changed to ${job.data.status}.`;
            break;
          case 'invoice.issued':
            title = 'Invoice Issued';
            message = `Invoice ${job.data.invoiceNumber} has been issued for $${job.data.total}.`;
            break;
          case 'payment.received':
            title = 'Payment Received';
            message = `A payment of $${job.data.amount} was received for invoice ${job.data.invoiceId}.`;
            break;
          default:
            title = 'System Notification';
            message = `You have a new notification for event: ${job.name}`;
        }

        // 1. Create PENDING notification in DB (or retrieve if retrying)
        // Since jobs might be retried, we use a unique key or just create it if it doesn't exist for this job+channel.
        // For simplicity in Phase 11, we'll store the BullMQ job ID in metadata to enable idempotency.
        
        let notification = await prisma.notification.findFirst({
          where: {
            metadata: {
              path: ['jobId'],
              equals: job.id
            },
            channel
          }
        });

        if (!notification) {
          notification = await prisma.notification.create({
            data: {
              tenantId,
              customerId,
              userId,
              channel,
              status: 'PENDING',
              title,
              message,
              metadata: { jobId: job.id, originalEvent: job.name, ...job.data },
            }
          });
        }

        if (notification.status === 'SENT') {
          logger.info(`Notification ${notification.id} already SENT. Skipping.`);
          continue;
        }

        try {
          // 2. Deliver Notification
          if (channel === 'EMAIL') {
            let email = 'customer@example.com';
            if (customerId) {
              const customer = await prisma.customer.findUnique({ where: { id: customerId }});
              if (customer && customer.email) email = customer.email;
            } else if (userId) {
              const user = await prisma.user.findUnique({ where: { id: userId }});
              if (user && user.email) email = user.email;
            }

            await mockSendEmail(email, title, message, logger);
          } else if (channel === 'IN_APP') {
            // In-app just stays in the DB for the frontend to query
            logger.info(`[IN APP NOTIFICATION] ${title}: ${message}`);
          }

          // 3. Mark as SENT
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'SENT' }
          });

        } catch (error: any) {
          logger.error(`Failed to deliver ${channel} notification: ${error.message}`);
          
          // Re-throw so BullMQ triggers the retry mechanism and exponential backoff
          throw error; 
        }
      }

      return { status: 'processed', processedAt: new Date().toISOString() };
    },
    { connection: redisConnection }
  );

  worker.on('completed', (job) => {
    logger.info(`Notification Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, error) => {
    logger.warn(`Notification Job ${job?.id} failed: ${error.message}`);
    
    // If we've exhausted all attempts, mark the DB records as FAILED
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      try {
        await prisma.notification.updateMany({
          where: {
            metadata: {
              path: ['jobId'],
              equals: job.id
            },
            status: 'PENDING'
          },
          data: {
            status: 'FAILED',
            error: error.message
          }
        });
        logger.info(`Marked notifications for job ${job.id} as FAILED in database.`);
      } catch (dbErr) {
        logger.error(dbErr, `Failed to update notification status to FAILED for job ${job.id}`);
      }
    }
  });

  return worker;
}
