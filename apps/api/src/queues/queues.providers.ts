import { Provider } from '@nestjs/common'
import { Queue } from 'bullmq'
import logger from '@grofit/logger'
import { MARKET_DATA_QUEUE } from '@grofit/contracts'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const queuesProviders: Provider[] = [
  {
    provide: MARKET_DATA_QUEUE,
    useFactory: () => {
      const queue = new Queue(MARKET_DATA_QUEUE, {
        connection: { url: redisUrl, connectTimeout: 30000, commandTimeout: 30000 },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      })
      logger.info({ queue: MARKET_DATA_QUEUE }, '[Queues] BullMQ queue initialized.')
      return queue
    },
  },
]
