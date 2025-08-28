import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import logger from '@grofit/logger'
import { INGESTION_QUEUE } from '../queues/queues.constants'

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
    const refreshMinutes = Number.parseInt(process.env.LIVE_REFRESH_INTERVAL_MINUTES || '2', 10)
    const everyMs = Math.max(1, refreshMinutes) * 60 * 1000

    await this.ingestionQueue.add(
      'refresh:live-orders',
      { platform },
      {
        repeat: { every: everyMs },
        jobId: `refresh:live-orders:${platform}`,
      },
    )
    logger.info(
      { job: 'refresh:live-orders', every: `${refreshMinutes}m`, platform },
      '[Scheduler] Scheduled job.',
    )
  }

  private async scheduleRelicsHistoryIngestion() {
    await this.ingestionQueue.add(
      'ingest:relics-history',
      {},
      {
        repeat: { pattern: '0 5 * * *', tz: 'UTC' },
        jobId: 'ingest:relics-history:daily',
      },
    )
    logger.info({ job: 'ingest:relics-history', cron: '0 5 * * *' }, '[Scheduler] Scheduled job.')
  }
}
