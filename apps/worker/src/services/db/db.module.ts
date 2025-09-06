import { Module } from '@nestjs/common'
import { ItemsService } from './items'
import { IngestionRunsService } from './ingestion-runs'
import { PriceHistoryEntriesService, PriceHistoryRawService } from './price-history'
import { MarketTrendsService } from './market-trends'
import { ItemPerformanceService } from './item-performance'
import { FlipRecommendationsService } from './flip-recommendations'

@Module({
  providers: [
    IngestionRunsService,
    ItemsService,
    PriceHistoryEntriesService,
    PriceHistoryRawService,
    FlipRecommendationsService,
    MarketTrendsService,
    ItemPerformanceService,
  ],
  exports: [
    IngestionRunsService,
    ItemsService,
    PriceHistoryEntriesService,
    PriceHistoryRawService,
    FlipRecommendationsService,
    MarketTrendsService,
    ItemPerformanceService,
  ],
})
export class DbModule {}
