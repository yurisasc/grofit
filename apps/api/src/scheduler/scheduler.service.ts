import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import logger from '@grofit/logger'
import {
  INGESTION_QUEUE,
  REFRESH_LIVE_ORDERS_JOB,
  INGEST_RELICS_HISTORY_JOB,
} from '@grofit/contracts'

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(@Inject(INGESTION_QUEUE) private readonly ingestionQueue: Queue) {}

  async onModuleInit() {
    logger.info('[Scheduler] Initializing repeatable jobs...')
    await this.scheduleLiveOrderRefresh()
    await this.scheduleRelicsHistoryIngestion()
  }

  private async scheduleLiveOrderRefresh() {
    const platform = process.env.WFM_PLATFORM || 'pc'
    const everyMs =
      Number.parseInt(process.env.LIVE_REFRESH_INTERVAL_MINUTES || '2', 10) * 60 * 1000
    const jobId = `${REFRESH_LIVE_ORDERS_JOB}:${platform}`

    await this.ingestionQueue.upsertJobScheduler(
      jobId,
      { every: everyMs },
      {
        name: REFRESH_LIVE_ORDERS_JOB,
        data: { platform },
      },
    )
    logger.info(
      { job: REFRESH_LIVE_ORDERS_JOB, every: `${everyMs / 1000}s`, platform },
      '[Scheduler] Scheduled job.',
    )
  }

  private async scheduleRelicsHistoryIngestion() {
    await this.ingestionQueue.add(
      INGEST_RELICS_HISTORY_JOB,
      {},
      {
        repeat: { pattern: '0 5 * * *', tz: 'UTC' },
        jobId: `${INGEST_RELICS_HISTORY_JOB}:daily`,
      },
    )
    logger.info({ job: INGEST_RELICS_HISTORY_JOB, cron: '0 5 * * *' }, '[Scheduler] Scheduled job.')
  }
}
