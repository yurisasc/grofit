import { Provider } from '@nestjs/common'
import { Queue } from 'bullmq'
import logger from '@grofit/logger'
import { INGESTION_QUEUE } from './queues.constants'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const queuesProviders: Provider[] = [
  {
    provide: INGESTION_QUEUE,
    useFactory: () => {
      const queue = new Queue(INGESTION_QUEUE, {
        connection: { url: redisUrl, connectTimeout: 30000, commandTimeout: 30000 },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      })
      logger.info({ queue: INGESTION_QUEUE }, '[Queues] BullMQ queue initialized.')
      return queue
    },
  },
]
