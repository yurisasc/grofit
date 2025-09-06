import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventBusService } from '@grofit/event-bus'
import logger from '@grofit/logger'
import {
  INGEST_PRICE_HISTORY_COMPLETED,
  ANALYTICS_POPULAR_UPDATED,
  PriceHistoryIngestionMessage,
} from '@grofit/contracts'
import { PopularItemsService } from '../../services/db/popular-items'
import { PopularItemsComputeService } from './popular-items.compute'
import { PopularItemScore, PopularItemUpsert, TopItem, ANALYTICS_CONFIG } from '@grofit/analytics'

const log = logger.child({ feature: 'AnalyticsSubscriber' })

/**
 * Analytics subscriber that listens for price history ingestion events
 * and computes popular items analytics, then publishes the results
 *
 * This service is responsible for:
 * - Listening to successful price history ingestion events
 * - Computing popularity scores for items based on trading data
 * - Storing the computed popular items in the database
 * - Publishing top popular items for external consumption
 */
@Injectable()
export class AnalyticsSubscriber implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly compute: PopularItemsComputeService,
    private readonly popularItems: PopularItemsService,
  ) {}

  /**
   * Initialize the event subscriptions when the module starts
   * Sets up listeners for price history ingestion completion events
   */
  onModuleInit(): void {
    this.eventBus.subscribe(
      INGEST_PRICE_HISTORY_COMPLETED,
      async (msg: PriceHistoryIngestionMessage) => {
        try {
          const date = msg.date
          if (!date) return

          log.info({ date }, 'Received ingestion completed. Computing popular items...')
          const scores: PopularItemScore[] = await this.compute.computeForDate(date)
          const upserts: PopularItemUpsert[] = scores.map((s, idx) => ({
            date,
            itemName: s.itemName,
            modRank: s.modRank,
            score: s.score.toString(),
            rank: idx + 1,
            metricsJson: s.metricsJson,
          }))
          await this.popularItems.upsertDaily(upserts)
          log.info({ date, count: upserts.length }, 'Popular items updated.')

          const topItems: TopItem[] = scores
            .slice(0, ANALYTICS_CONFIG.TOP_POPULAR_ITEMS)
            .map((s, idx) => ({
              itemName: s.itemName,
              modRank: s.modRank,
              rank: idx + 1,
              score: s.score,
              metrics: s.metricsJson,
            }))

          await this.eventBus.publish(ANALYTICS_POPULAR_UPDATED, {
            date,
            count: upserts.length,
            topItems,
          })
        } catch (error) {
          log.error({ err: error }, 'Failed to compute popular items.')
        }
      },
    )
  }
}
