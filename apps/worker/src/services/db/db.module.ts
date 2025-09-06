import { Module } from '@nestjs/common'
import { ItemsService } from './items'
import { IngestionRunsService } from './ingestion-runs'
import { PriceHistoryEntriesService, PriceHistoryRawService } from './price-history'
import { PopularItemsService } from './popular-items'

@Module({
  providers: [
    IngestionRunsService,
    ItemsService,
    PriceHistoryEntriesService,
    PriceHistoryRawService,
    PopularItemsService,
  ],
  exports: [
    IngestionRunsService,
    ItemsService,
    PriceHistoryEntriesService,
    PriceHistoryRawService,
    PopularItemsService,
  ],
})
export class DbModule {}
