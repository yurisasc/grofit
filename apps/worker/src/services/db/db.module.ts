import { Module } from '@nestjs/common'
import { IngestionRunsService } from './ingestion-runs'
import { PriceHistoryEntriesService, PriceHistoryRawService } from './price-history'

@Module({
  providers: [IngestionRunsService, PriceHistoryEntriesService, PriceHistoryRawService],
  exports: [IngestionRunsService, PriceHistoryEntriesService, PriceHistoryRawService],
})
export class DbModule {}
