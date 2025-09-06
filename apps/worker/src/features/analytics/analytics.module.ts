import { Module } from '@nestjs/common'
import { EventBusModule } from '@grofit/event-bus'
import { DbModule } from '../../services/db/db.module'
import { AnalyticsSubscriber } from './analytics.subscriber'
import { AnalyticsDataFetcher, UnifiedAnalyticsProcessor } from './shared'
import { FlipRecommendationsProcessor, FlipRecommendationsStorage } from './flip-recommendations'
import { MarketTrendsProcessor, MarketTrendsStorage } from './market-trends'
import { ItemPerformanceProcessor, ItemPerformanceStorage } from './item-performance'

@Module({
  imports: [EventBusModule, DbModule],
  providers: [
    AnalyticsSubscriber,
    AnalyticsDataFetcher,
    UnifiedAnalyticsProcessor,
    FlipRecommendationsProcessor,
    FlipRecommendationsStorage,
    MarketTrendsProcessor,
    MarketTrendsStorage,
    ItemPerformanceProcessor,
    ItemPerformanceStorage,
  ],
})
export class AnalyticsModule {}
