import { Injectable } from '@nestjs/common'
import { DailyItemStats, computeAllAnalyticsForItem, AllAnalyticsResult } from '@grofit/analytics'
import logger from '@grofit/logger'

const log = logger.child({ service: 'UnifiedAnalyticsProcessor' })

/**
 * Service responsible for computing all analytics in a single pass
 */
@Injectable()
export class UnifiedAnalyticsProcessor {
  /**
   * Process all analytics for all items in a single computation pass
   * @param byItem - Grouped price history data by item
   * @param date - The target date for analytics
   * @returns All analytics results for all items
   */
  async processAllAnalyticsUnified(
    byItem: Record<string, DailyItemStats[]>,
    date: string,
  ): Promise<{
    flipResults: AllAnalyticsResult[]
    marketTrends: AllAnalyticsResult[]
    itemPerformances: AllAnalyticsResult[]
  }> {
    const flipResults: AllAnalyticsResult[] = []
    const marketTrends: AllAnalyticsResult[] = []
    const itemPerformances: AllAnalyticsResult[] = []

    log.info(
      { itemCount: Object.keys(byItem).length },
      'Starting unified analytics processing for all items',
    )

    // Process each item once - compute ALL analytics simultaneously
    for (const [key, itemHistory] of Object.entries(byItem)) {
      if (itemHistory.length < 7) {
        log.debug({ key, entryCount: itemHistory.length }, 'Skipping item with insufficient data')
        continue // Need minimum data for analysis
      }

      const [itemName, modRankStr] = key.split('::')
      const modRank = parseInt(modRankStr, 10)

      try {
        // Process item once - compute ALL analytics simultaneously
        const itemAnalytics: AllAnalyticsResult = computeAllAnalyticsForItem(
          itemName,
          modRank,
          itemHistory,
          date,
        )

        // Collect results for each analytics type
        flipResults.push(itemAnalytics)
        marketTrends.push(itemAnalytics)
        itemPerformances.push(itemAnalytics)
      } catch (error) {
        log.error({ err: error, itemName, modRank }, 'Failed to process analytics for item')
        // Continue processing other items
      }
    }

    log.info(
      {
        processedItems: flipResults.length,
      },
      'Unified analytics processing completed',
    )

    return {
      flipResults,
      marketTrends,
      itemPerformances,
    }
  }
}
