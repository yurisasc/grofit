import { Controller, Post, Query, Body } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { MARKET_DATA_QUEUE, INGEST_PRICE_HISTORY_JOB } from '@grofit/contracts'
import { Queue } from 'bullmq'

@Controller('scheduler/debug')
export class SchedulerDebugController {
  constructor(@InjectQueue(MARKET_DATA_QUEUE) private readonly marketDataQueue: Queue) {}

  @Post('trigger-ingest-price-history')
  async triggerIngestPriceHistory(@Query('date') date?: string, @Body() body?: { date?: string }) {
    try {
      // Use query param, body param, or yesterday's date
      const targetDate = date || body?.date || this.getYesterdayDateString()

      const job = await this.marketDataQueue.add(
        INGEST_PRICE_HISTORY_JOB,
        { date: targetDate },
        {
          jobId: `${INGEST_PRICE_HISTORY_JOB}:debug-${Date.now()}`,
          removeOnComplete: 10, // Keep completed jobs for debugging
          removeOnFail: 10, // Keep failed jobs for debugging
        },
      )

      console.log(`✅ [Debug] Job added to queue:`, {
        id: job.id,
        name: job.name,
        data: job.data,
      })

      return {
        success: true,
        message: `Ingest price history job triggered for date: ${targetDate}`,
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

  private getYesterdayDateString(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0] // YYYY-MM-DD format
  }
}
