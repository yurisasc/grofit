import { Processor, WorkerHost } from '@nestjs/bullmq'
import {
  MARKET_DATA_QUEUE,
  REFRESH_LIVE_ORDERS_JOB,
  INGEST_PRICE_HISTORY_JOB,
} from '@grofit/contracts'
import { Job } from 'bullmq'
import logger from '@grofit/logger'
import { RefreshLiveOrdersHandler } from './handlers/refresh-live-orders.handler'
import { IngestPriceHistoryHandler } from './handlers/ingest-price-history.handler'

@Processor(MARKET_DATA_QUEUE)
export class MarketDataProcessor extends WorkerHost {
  constructor(
    private readonly refreshLiveOrdersHandler: RefreshLiveOrdersHandler,
    private readonly ingestPriceHistoryHandler: IngestPriceHistoryHandler,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const log = logger.child({ job: job.name, id: job.id })
    log.info('Processing job')
    switch (job.name) {
      case REFRESH_LIVE_ORDERS_JOB:
        return this.refreshLiveOrdersHandler.handle(job.data?.platform)
      case INGEST_PRICE_HISTORY_JOB:
        return this.ingestPriceHistoryHandler.handle()
      default:
        log.warn(`No handler for job ${job.name}`)
        break
    }
  }
}
