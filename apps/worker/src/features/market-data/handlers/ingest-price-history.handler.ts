import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'
import { INGEST_PRICE_HISTORY_JOB } from '@grofit/contracts'

@Injectable()
export class IngestPriceHistoryHandler {
  async handle() {
    const log = logger.child({ job: INGEST_PRICE_HISTORY_JOB })
    log.info('Done')
  }
}
