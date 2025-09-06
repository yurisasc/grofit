import { Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import logger from '@grofit/logger'
import { RelicsRunApiService } from '../../../services/relics-run/relics-run.service'
import { IngestionRunsService } from '../../../services/db/ingestion-runs'
import {
  PriceHistoryEntriesService,
  PriceHistoryRawService,
} from '../../../services/db/price-history'
import { EventBusService } from '@grofit/event-bus'
import { INGEST_PRICE_HISTORY_COMPLETED } from '@grofit/contracts'
import { computeCanonicalSha256 } from '../lib/price-history-utils'

const SOURCE_NAME = 'price_history.daily'

/**
 * Handler for ingesting daily price history data from Relics Run
 *
 * This handler is responsible for:
 * - Fetching daily price history data from the Relics Run API
 * - Processing and normalizing the raw data
 * - Storing both raw snapshots and processed entries in the database
 * - Publishing completion events for downstream processing
 * - Managing ingestion runs and deduplication
 */
@Injectable()
export class IngestPriceHistoryHandler {
  constructor(
    private readonly api: RelicsRunApiService,
    private readonly ingestionRuns: IngestionRunsService,
    private readonly rawService: PriceHistoryRawService,
    private readonly entriesService: PriceHistoryEntriesService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Process a daily price history ingestion job
   *
   * Fetches price history data for the specified date, processes it,
   * stores it in the database, and publishes a completion event.
   * Includes deduplication logic to prevent reprocessing the same data.
   *
   * @param job - BullMQ job containing the ingestion parameters
   */
  async handle(job: Job): Promise<void> {
    const date = job.data?.date || this.getYesterdayDateString()
    const log = logger.child({ job: job.name, id: job.id, date })
    log.info('Starting daily price history ingestion.')

    const run = await this.ingestionRuns.startRun(SOURCE_NAME, date)

    try {
      const rawData = await this.api.getDailyHistory(date)
      const sha256 = computeCanonicalSha256(rawData)

      const existingRun = await this.ingestionRuns.findCompletedRunByHash(SOURCE_NAME, date, sha256)
      if (existingRun) {
        log.info(
          { existingRunId: existingRun.id, existingStatus: existingRun.status },
          'Duplicate content. Skipping.',
        )
        await this.ingestionRuns.updateRun(run.id, 'skipped', {
          sha256,
          metadata: { reason: 'duplicate' },
        })
        return
      }

      const itemsCount = Object.keys(rawData).length
      const entriesCount = Object.values(rawData).reduce(
        (acc, arr: unknown) => acc + (Array.isArray(arr) ? arr.length : 0),
        0,
      )

      // Store the raw snapshot for reproducibility
      await this.rawService.upsert({ date, sha256, payload: rawData, itemsCount, entriesCount })

      // Normalize and upsert all entries (buy/sell/closed)
      const entries = this.entriesService.transform(rawData, date)
      await this.entriesService.upsert(entries)
      log.info(
        { itemsCount, entriesCount, upserted: entries.length },
        'Price history upsert completed.',
      )

      await this.ingestionRuns.updateRun(run.id, 'completed', {
        sha256,
        metadata: { itemsCount, entriesCount, upserted: entries.length },
      })

      await this.eventBus.publish(INGEST_PRICE_HISTORY_COMPLETED, {
        source: SOURCE_NAME,
        date,
        itemsCount,
        entriesCount,
        sha256,
      })
      log.info('Ingestion run completed successfully.')
    } catch (error) {
      log.error({ err: error }, 'Price history ingestion failed.')
      await this.ingestionRuns.updateRun(run.id, 'failed', {
        metadata: { error: (error as Error).message },
      })
      throw error
    }
  }

  /**
   * Get yesterday's date string in YYYY-MM-DD format
   * Used as the default date when no specific date is provided in the job
   *
   * @returns Yesterday's date string
   * @private
   */
  private getYesterdayDateString(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0] // YYYY-MM-DD
  }
}
