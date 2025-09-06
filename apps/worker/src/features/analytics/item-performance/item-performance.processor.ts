import { Injectable } from '@nestjs/common'
import { ItemPerformanceData, AllAnalyticsResult } from '@grofit/analytics'
import logger from '@grofit/logger'

const log = logger.child({ service: 'ItemPerformanceProcessor' })

/**
 * Service responsible for processing item performance analytics
 */
@Injectable()
export class ItemPerformanceProcessor {
  /**
   * Process item performance from pre-computed analytics results
   * @param unifiedResults - Pre-computed analytics results
   * @returns Item performance results
   */
  async processAllItemPerformance(
    unifiedResults: AllAnalyticsResult[],
  ): Promise<ItemPerformanceData[]> {
    log.info(
      { itemCount: unifiedResults.length },
      'Processing item performance from unified results',
    )

    const itemPerformances = unifiedResults.map((result) => result.itemPerformance)

    log.info(
      { totalPerformances: itemPerformances.length },
      'Item performance processing completed',
    )

    return itemPerformances
  }
}
