import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventBusModule } from '@grofit/event-bus'
import { ProcessorsModule } from './features/processors.module'
import configuration from './config/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventBusModule,
    ProcessorsModule,
  ],
})
export class AppModule {}
