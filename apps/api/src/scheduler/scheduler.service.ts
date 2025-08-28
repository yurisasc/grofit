import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import logger from '@grofit/logger'
import {
  MARKET_DATA_QUEUE,
  REFRESH_LIVE_ORDERS_JOB,
  INGEST_PRICE_HISTORY_JOB,
} from '@grofit/contracts'

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(@Inject(MARKET_DATA_QUEUE) private readonly marketDataQueue: Queue) {}

  async onModuleInit() {
    logger.info('[Scheduler] Initializing repeatable jobs...')
    await this.schedulePriceHistoryIngestion()
    await this.scheduleLiveOrderRefresh()
  }

  /**
   * Schedules a job to fetch extensive price history data.
   * The data fetched is used to determine which items are popular,
   * based on the volume, spread, etc.
   *
   * With the popular items list, we can show the items that are most
   * likely to be profitable to trade, but this data will
   * still need to be supplemented by the live orders data for
   * accurate pricing signals.
   */
  private async schedulePriceHistoryIngestion() {
    await this.marketDataQueue.add(
      INGEST_PRICE_HISTORY_JOB,
      {},
      {
        repeat: { pattern: '0 5 * * *', tz: 'UTC' },
        jobId: `${INGEST_PRICE_HISTORY_JOB}:daily`,
      },
    )
    logger.info({ job: INGEST_PRICE_HISTORY_JOB, cron: '0 5 * * *' }, '[Scheduler] Scheduled job.')
  }

  /**
   * Schedules a job to fetch current buy/sell orders for items
   * in the popular items list or in the watchlist.
   *
   * The watchlist contains items defined in the `WATCHLIST_SLUGS`
   * environment variable and the user's active buy/sell orders.
   *
   * With the live orders data, we can always get the best buy/sell
   * prices and the spread of the items watched.
   */
  private async scheduleLiveOrderRefresh() {
    const platform = process.env.WFM_PLATFORM || 'pc'
    const everyMs =
      Number.parseInt(process.env.LIVE_REFRESH_INTERVAL_MINUTES || '2', 10) * 60 * 1000
    const jobId = `${REFRESH_LIVE_ORDERS_JOB}:${platform}`

    await this.marketDataQueue.upsertJobScheduler(
      jobId,
      { every: everyMs },
      {
        name: REFRESH_LIVE_ORDERS_JOB,
        data: { platform },
      },
    )
    logger.info(
      { job: REFRESH_LIVE_ORDERS_JOB, every: `${everyMs / 60 / 1000}m`, platform },
      '[Scheduler] Scheduled job.',
    )
  }
}
