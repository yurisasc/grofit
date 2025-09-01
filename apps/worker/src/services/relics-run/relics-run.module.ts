import { Module } from '@nestjs/common'
import { RelicsRunApiService } from './relics-run.service'

@Module({
  providers: [RelicsRunApiService],
  exports: [RelicsRunApiService],
})
export class RelicsRunApiModule {}
