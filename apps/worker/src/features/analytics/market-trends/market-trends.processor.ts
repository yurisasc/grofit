import { Injectable } from '@nestjs/common'
import { MarketTrendData, AllAnalyticsResult } from '@grofit/analytics'
import logger from '@grofit/logger'

const log = logger.child({ service: 'MarketTrendsProcessor' })

/**
 * Service responsible for processing market trend analytics
 */
@Injectable()
export class MarketTrendsProcessor {
  /**
   * Process market trends from pre-computed analytics results
   * @param unifiedResults - Pre-computed analytics results
   * @returns Market trend results
   */
  async processAllMarketTrends(unifiedResults: AllAnalyticsResult[]): Promise<MarketTrendData[]> {
    log.info({ itemCount: unifiedResults.length }, 'Processing market trends from unified results')

    const marketTrends = unifiedResults.flatMap((result) => result.marketTrends)

    log.info({ totalTrends: marketTrends.length }, 'Market trends processing completed')

    return marketTrends
  }
}
