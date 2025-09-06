import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import logger from '@grofit/logger'
import { PUB_CLIENT, SUB_CLIENT } from './event-bus.constants'
import { EventTypes, EventMessage } from '@grofit/contracts'

@Injectable()
export class EventBusService implements OnModuleDestroy {
  constructor(
    @Inject(PUB_CLIENT) private readonly pubClient: Redis,
    @Inject(SUB_CLIENT) private readonly subClient: Redis,
  ) {}

  // Generic publish method for known events
  async publish<T extends keyof EventTypes>(channel: T, message: EventMessage<T>): Promise<void>
  // Fallback for unknown channels
  async publish(channel: string, message: Record<string, unknown>): Promise<void>
  async publish(channel: string, message: Record<string, unknown>): Promise<void> {
    const payload = JSON.stringify(message)
    logger.debug({ channel, payload }, '[EventBus] Publishing message')
    await this.pubClient.publish(channel, payload)
  }

  // Generic subscribe method for known events
  subscribe<T extends keyof EventTypes>(
    channel: T,
    handler: (message: EventMessage<T>) => void,
  ): void
  // Fallback for unknown channels
  subscribe(channel: string, handler: (message: Record<string, unknown>) => void): void
  subscribe(channel: string, handler: (message: Record<string, unknown>) => void): void {
    this.subClient.subscribe(channel, (err) => {
      if (err) {
        logger.error({ channel, err }, '[EventBus] Failed to subscribe')
        return
      }
      logger.info({ channel }, '[EventBus] Subscribed to channel')
    })

    this.subClient.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const parsedMessage = JSON.parse(message)
          handler(parsedMessage)
        } catch (e) {
          logger.error({ channel, message, error: e }, '[EventBus] Failed to parse message')
        }
      }
    })
  }

  onModuleDestroy() {
    this.pubClient.quit()
    this.subClient.quit()
    logger.info('[EventBus] Redis clients disconnected.')
  }
}
