import Redis from 'ioredis'
import logger from '@grofit/logger'
import { Provider } from '@nestjs/common'
import { PUB_CLIENT, SUB_CLIENT } from './event-bus.constants'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redisProviders: Provider[] = [
  {
    provide: PUB_CLIENT,
    useFactory: () => {
      const client = new Redis(redisUrl, { maxRetriesPerRequest: null })
      logger.info('[EventBus] Publisher connected to Redis.')
      return client
    },
  },
  {
    provide: SUB_CLIENT,
    useFactory: () => {
      const client = new Redis(redisUrl, { maxRetriesPerRequest: null })
      logger.info('[EventBus] Subscriber connected to Redis.')
      return client
    },
  },
]
