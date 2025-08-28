import { QueueEventsListener, OnQueueEvent, QueueEventsHost } from '@nestjs/bullmq'
import { MARKET_DATA_QUEUE } from '@grofit/contracts'
import logger from '@grofit/logger'

@QueueEventsListener(MARKET_DATA_QUEUE)
export class MarketDataEvents extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive({ jobId }: { jobId: string }) {
    logger.info({ job: { id: jobId } }, `[Worker] Job active`)
  }

  @OnQueueEvent('completed')
  onCompleted({ jobId }: { jobId: string }) {
    logger.info({ job: { id: jobId } }, `[Worker] Job completed`)
  }

  @OnQueueEvent('failed')
  onFailed({ jobId, failedReason }: { jobId: string; failedReason: string }) {
    logger.error({ job: { id: jobId }, error: failedReason }, `[Worker] Job failed`)
  }
}
