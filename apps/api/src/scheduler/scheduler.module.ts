import { Module } from '@nestjs/common'
import { SchedulerService } from './scheduler.service'
import { QueuesModule } from '../queues/queues.module'
import { SchedulerDebugController } from './debug.controller'

@Module({
  imports: [QueuesModule],
  providers: [SchedulerService],
  controllers: [SchedulerDebugController],
})
export class SchedulerModule {}
