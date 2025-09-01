import { Module, Global } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MARKET_DATA_QUEUE } from 'packages/contracts'

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('worker.redisHost'),
          port: configService.get<number>('worker.redisPort'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: MARKET_DATA_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
