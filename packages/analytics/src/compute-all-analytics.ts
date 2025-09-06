import { DailyItemStats, FlipResult } from './shared/types'
import { computeFlipAnalytics } from './flip-recommendations/compute-flip-analytics'
import { computeMarketTrends, MarketTrendData } from './market-trends/compute-market-trends'
import {
  computeItemPerformance,
  ItemPerformanceData,
} from './item-performance/compute-item-performance'

/**
 * Result of computing all analytics for a single item
 */
export interface AllAnalyticsResult {
  flipResult: FlipResult
  marketTrends: MarketTrendData[]
  itemPerformance: ItemPerformanceData
}

/**
 * Compute all analytics for a single item from its price history
 * This processes the data once and computes flip analytics, market trends, and performance metrics
 *
 * @param itemName - The item name
 * @param modRank - The item mod rank
 * @param history - The item's price history
 * @param date - The date for the analytics
 * @returns All analytics results for the item
 */
export function computeAllAnalyticsForItem(
  itemName: string,
  modRank: number,
  history: DailyItemStats[],
  date: string,
): AllAnalyticsResult {
  // Compute all analytics in parallel for better performance
  const flipResult = computeFlipAnalytics(itemName, modRank, history)
  const marketTrends = computeMarketTrends(itemName, modRank, history, date)
  const itemPerformance = computeItemPerformance(itemName, modRank, history, date)

  return {
    flipResult,
    marketTrends,
    itemPerformance,
  }
}
