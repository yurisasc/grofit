import { Controller, Post, Body, Query } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { MARKET_DATA_QUEUE, INGEST_PRICE_HISTORY_JOB, SYNC_WFM_ITEMS_JOB } from '@grofit/contracts'
import { Queue } from 'bullmq'

@Controller('scheduler/debug')
export class SchedulerDebugController {
  constructor(@InjectQueue(MARKET_DATA_QUEUE) private readonly marketDataQueue: Queue) {}

  private formatDateUTC(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private *datesInclusiveUTC(start: Date, end: Date): Generator<string> {
    // Truncate to UTC midnight
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
    const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
    while (cur <= stop) {
      yield this.formatDateUTC(cur)
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  }

  @Post('trigger-ingest-price-history')
  async triggerIngestPriceHistory(
    @Body('date') bodyDate?: string,
    @Query('date') queryDate?: string,
  ) {
    try {
      const date = bodyDate || queryDate
      const job = await this.marketDataQueue.add(INGEST_PRICE_HISTORY_JOB, date ? { date } : {}, {
        jobId: date
          ? `${INGEST_PRICE_HISTORY_JOB}:${date}`
          : `${INGEST_PRICE_HISTORY_JOB}:debug-${Date.now()}`,
        removeOnComplete: 10, // Keep completed jobs for debugging
        removeOnFail: 10, // Keep failed jobs for debugging
      })

      console.log(`✅ [Debug] Job added to queue:`, {
        id: job.id,
        name: job.name,
        data: job.data,
      })

      return {
        success: true,
        message: `Ingest price history job triggered${date ? ` for ${date}` : ''}`,
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
        },
      }
    } catch (error: any) {
      console.error(`❌ [Debug] Error triggering job:`, error.message)
      return {
        success: false,
        message: `Failed to trigger job: ${error.message}`,
        error: error.message,
      }
    }
  }

  @Post('trigger-sync-wfm-items')
  async triggerSyncWfmItems() {
    try {
      const job = await this.marketDataQueue.add(
        SYNC_WFM_ITEMS_JOB,
        {},
        {
          jobId: `${SYNC_WFM_ITEMS_JOB}:debug-${Date.now()}`,
          removeOnComplete: 10,
          removeOnFail: 10,
        },
      )
      return {
        success: true,
        message: `WFM items sync job triggered`,
        job: { id: job.id, name: job.name, data: job.data },
      }
    } catch (error: any) {
      console.error(`❌ [Debug] Error triggering WFM sync:`, error.message)
      return { success: false, message: `Failed: ${error.message}`, error: error.message }
    }
  }

  @Post('trigger-backfill')
  async triggerBackfill(
    @Body() body?: any,
    @Query() query?: { days?: string; startDate?: string; endDate?: string },
  ) {
    try {
      const daysParam = (query?.days ?? body?.days) as string | undefined
      const startParam = (query?.startDate ?? body?.startDate) as string | undefined
      const endParam = (query?.endDate ?? body?.endDate) as string | undefined

      let dates: string[] = []
      if (daysParam) {
        const days = Math.max(1, Math.min(90, Number.parseInt(daysParam, 10) || 0))
        // backfill last N days ending yesterday (UTC)
        const end = new Date()
        end.setUTCDate(end.getUTCDate() - 1)
        const start = new Date(end)
        start.setUTCDate(end.getUTCDate() - (days - 1))
        dates = Array.from(this.datesInclusiveUTC(start, end))
      } else if (startParam && endParam) {
        const start = new Date(`${startParam}T00:00:00Z`)
        const end = new Date(`${endParam}T00:00:00Z`)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
          return { success: false, message: 'Invalid startDate/endDate' }
        }
        dates = Array.from(this.datesInclusiveUTC(start, end))
      } else {
        return {
          success: false,
          message: 'Provide either ?days=N or startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
        }
      }

      const added = await Promise.all(
        dates.map((date) =>
          this.marketDataQueue.add(
            INGEST_PRICE_HISTORY_JOB,
            { date },
            {
              jobId: `${INGEST_PRICE_HISTORY_JOB}:${date}`,
              removeOnComplete: 100,
              removeOnFail: 100,
            },
          ),
        ),
      )

      return {
        success: true,
        message: `Backfill enqueued for ${dates.length} day(s).`,
        dates,
        jobs: added.map((j) => ({ id: j.id, name: j.name, data: j.data })),
      }
    } catch (error: any) {
      console.error(`❌ [Debug] Error triggering backfill:`, error.message)
      return { success: false, message: `Failed: ${error.message}`, error: error.message }
    }
  }
}
