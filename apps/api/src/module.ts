import { Module } from '@nestjs/common'
import { EventBusModule } from '@grofit/event-bus'
import { HealthController } from './routes/health.controller'
import { SchedulerModule } from './scheduler/scheduler.module'
import { ConfigModule } from '@nestjs/config'
import workerConfiguration from './config/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [workerConfiguration] }),
    EventBusModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
