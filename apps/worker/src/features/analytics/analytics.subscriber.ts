import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventBusService } from '@grofit/event-bus'
import logger from '@grofit/logger'
import { db, schema } from '@grofit/db'
import { eq } from 'drizzle-orm'
import {
  INGEST_PRICE_HISTORY_COMPLETED,
  ANALYTICS_COMPLETE_UPDATED,
  PriceHistoryIngestionMessage,
} from '@grofit/contracts'
import {
  ANALYTICS_CONFIG,
  FlipResult,
  MarketTrendData,
  ItemPerformanceData,
} from '@grofit/analytics'
import { AnalyticsDataFetcher } from './shared'
import { UnifiedAnalyticsProcessor } from './shared/unified-analytics.processor'
import { FlipRecommendationsProcessor, FlipRecommendationsStorage } from './flip-recommendations'
import { MarketTrendsProcessor, MarketTrendsStorage } from './market-trends'
import { ItemPerformanceProcessor, ItemPerformanceStorage } from './item-performance'

const log = logger.child({ feature: 'FlipAnalyticsSubscriber' })

/**
 * Unified analytics subscriber for "Best to Flip" recommendations
 *
 * Delegates all work to specialized services for clean separation of concerns
 */
@Injectable()
export class AnalyticsSubscriber implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly dataFetcher: AnalyticsDataFetcher,
    private readonly unifiedProcessor: UnifiedAnalyticsProcessor,
    private readonly flipProcessor: FlipRecommendationsProcessor,
    private readonly flipStorage: FlipRecommendationsStorage,
    private readonly marketProcessor: MarketTrendsProcessor,
    private readonly marketStorage: MarketTrendsStorage,
    private readonly performanceProcessor: ItemPerformanceProcessor,
    private readonly performanceStorage: ItemPerformanceStorage,
  ) {}

  /**
   * Initialize the unified analytics subscriber
   */
  onModuleInit(): void {
    this.eventBus.subscribe(
      INGEST_PRICE_HISTORY_COMPLETED,
      async (msg: PriceHistoryIngestionMessage) => {
        try {
          const date = msg.date
          if (!date) return

          log.info({ date }, 'Received analytics processing request')

          // Check if analytics already exist for this date to prevent concurrent processing
          const [flipCount, marketCount, performanceCount] = await Promise.all([
            db.$count(schema.flipRecommendations, eq(schema.flipRecommendations.date, date)),
            db.$count(schema.marketTrends, eq(schema.marketTrends.date, date)),
            db.$count(schema.itemPerformance, eq(schema.itemPerformance.date, date)),
          ])

          log.info(
            {
              date,
              flipCount,
              marketCount,
              performanceCount,
            },
            'Checked for existing analytics',
          )

          if (flipCount > 0 || marketCount > 0 || performanceCount > 0) {
            log.info(
              {
                date,
                flipCount,
                marketCount,
                performanceCount,
              },
              'Analytics already exist for date, skipping processing',
            )
            return
          }

          log.info({ date }, 'Starting analytics processing')

          // ORCHESTRATION: Query → Process → Store → Publish

          // 1. Fetch analytics data
          const analyticsData = await this.dataFetcher.fetchAnalyticsData(date)

          // 2. Compute all analytics in a single pass
          const unifiedResults = await this.unifiedProcessor.processAllAnalyticsUnified(
            analyticsData,
            date,
          )

          // 3. Process each analytics type from unified results
          const [flipResults, marketTrends, itemPerformances] = await Promise.all([
            this.flipProcessor.processAllFlipRecommendations(unifiedResults.flipResults),
            this.marketProcessor.processAllMarketTrends(unifiedResults.marketTrends),
            this.performanceProcessor.processAllItemPerformance(unifiedResults.itemPerformances),
          ])

          log.info(
            {
              date,
              flipCount: flipResults.length,
              marketCount: marketTrends.length,
              performanceCount: itemPerformances.length,
            },
            'Processed analytics results',
          )

          // 3. Store all results SEQUENTIALLY to prevent race conditions
          log.info({ date }, 'Starting sequential storage of analytics')

          await this.flipStorage.storeFlipAnalytics(date, flipResults)
          log.info({ date }, 'Stored flip analytics')

          await this.marketStorage.storeMarketTrends(date, marketTrends)
          log.info({ date }, 'Stored market trends')

          await this.performanceStorage.storeItemPerformances(date, itemPerformances)
          log.info({ date }, 'Stored item performances')

          // 4. Publish flip recommendations event
          await this.publishFlipRecommendations(date, flipResults, marketTrends, itemPerformances)

          log.info({ date, count: flipResults.length }, 'Flip analytics computation completed.')
        } catch (error) {
          log.error({ err: error }, 'Failed to compute flip analytics.')
          throw error
        }
      },
    )
  }

  /**
   * Publish flip recommendations event with all analytics data
   */
  private async publishFlipRecommendations(
    date: string,
    flipResults: FlipResult[],
    marketTrends: MarketTrendData[],
    itemPerformances: ItemPerformanceData[],
  ): Promise<void> {
    const topRecommendations = flipResults.slice(0, ANALYTICS_CONFIG.TOP_FLIP_RECOMMENDATIONS_COUNT)

    await this.eventBus.publish(ANALYTICS_COMPLETE_UPDATED, {
      date,
      count: topRecommendations.length,
      topRecommendations: topRecommendations.map((result, idx) => ({
        itemName: result.itemName,
        modRank: result.modRank,
        rank: idx + 1,
        score: result.overallScore,
        recommendation: result.recommendation,
        confidence: result.confidence,
        factors: result.factors,
      })),
      marketTrends: marketTrends.map((trend) => ({
        itemName: trend.itemName,
        modRank: trend.modRank,
        window: trend.window,
        trendDirection: trend.trendDirection,
        trendStrength: trend.trendStrength,
        priceChange: trend.priceChange,
        volumeChange: trend.volumeChange,
      })),
      itemPerformances: itemPerformances.map((perf) => ({
        itemName: perf.itemName,
        modRank: perf.modRank,
        priceChangePercent: perf.priceChangePercent,
        volumeChangePercent: perf.volumeChangePercent,
        stabilityScore: perf.stabilityScore,
        performanceRank: perf.performanceRank,
        liquidityScore: perf.liquidityScore,
        volatilityScore: perf.volatilityScore,
      })),
      summary: {
        buyCount: flipResults.filter((r) => r.recommendation === 'BUY').length,
        holdCount: flipResults.filter((r) => r.recommendation === 'HOLD').length,
        avoidCount: flipResults.filter((r) => r.recommendation === 'AVOID').length,
        averageScore: flipResults.reduce((sum, r) => sum + r.overallScore, 0) / flipResults.length,
      },
    })
  }
}
