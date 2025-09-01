import { Module } from '@nestjs/common'
import { EventBusModule } from '@grofit/event-bus'
import { HealthController } from './routes/health.controller'
import { SchedulerModule } from './scheduler/scheduler.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule, EventBusModule, SchedulerModule],
  controllers: [HealthController],
})
export class AppModule {}
