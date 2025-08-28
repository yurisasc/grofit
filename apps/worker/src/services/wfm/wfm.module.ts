import { Module } from '@nestjs/common'
import { WfmApiService } from './wfm.service'

@Module({
  providers: [WfmApiService],
  exports: [WfmApiService],
})
export class WfmApiModule {}
