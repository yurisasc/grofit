import { Module } from '@nestjs/common'
import { ItemsService } from './items'
import { IngestionRunsService } from './ingestion-runs'
import { PriceHistoryEntriesService, PriceHistoryRawService } from './price-history'

@Module({
  providers: [
    IngestionRunsService,
    ItemsService,
    PriceHistoryEntriesService,
    PriceHistoryRawService,
  ],
  exports: [IngestionRunsService, ItemsService, PriceHistoryEntriesService, PriceHistoryRawService],
})
export class DbModule {}
