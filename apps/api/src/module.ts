import { Module } from '@nestjs/common'
import { EventBusModule } from '@grofit/event-bus'
import { HealthController } from './routes/health.controller'
import { QueuesModule } from './queues/queues.module'
import { SchedulerModule } from './scheduler/scheduler.module'

@Module({
  imports: [EventBusModule, QueuesModule, SchedulerModule],
  controllers: [HealthController],
})
export class AppModule {}
