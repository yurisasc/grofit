import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MARKET_DATA_QUEUE } from '@grofit/contracts'
import { MarketDataProcessor } from './market-data/market-data.processor'
import { MarketDataEvents } from './market-data/market-data.events'
import { RefreshLiveOrdersHandler } from './market-data/handlers/refresh-live-orders.handler'
import { IngestPriceHistoryHandler } from './market-data/handlers/ingest-price-history.handler'
import { WfmApiModule } from '../services/wfm/wfm.module'

@Module({
  imports: [
    WfmApiModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('worker.redisUrl')!
        const { hostname, port, password } = new URL(redisUrl)
        return {
          connection: {
            host: hostname,
            port: port ? Number(port) : 6379,
            password: password || undefined,
          },
        }
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: MARKET_DATA_QUEUE,
    }),
  ],
  providers: [
    MarketDataProcessor,
    MarketDataEvents,
    RefreshLiveOrdersHandler,
    IngestPriceHistoryHandler,
  ],
})
export class ProcessorsModule {}
