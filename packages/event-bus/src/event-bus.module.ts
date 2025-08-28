import { Module, Global } from '@nestjs/common'
import { EventBusService } from './event-bus.service'
import { redisProviders } from './event-bus.providers'

@Global()
@Module({
  providers: [EventBusService, ...redisProviders],
  exports: [EventBusService],
})
export class EventBusModule {}
