import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'
import { REFRESH_LIVE_ORDERS_JOB } from '@grofit/contracts'

@Injectable()
export class RefreshLiveOrdersHandler {
  async handle(_: string) {
    const log = logger.child({ job: REFRESH_LIVE_ORDERS_JOB })
    log.info('Done')
  }
}
