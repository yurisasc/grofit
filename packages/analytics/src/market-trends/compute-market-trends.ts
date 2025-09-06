import { DailyItemStats } from '../shared/types'
import { computeAggregatedMetrics } from '../shared/core'

export interface MarketTrendData {
  itemName: string
  modRank: number
  date: string
  window: '7d' | '14d' | '30d'
  trendDirection: 'bullish' | 'bearish' | 'sideways'
  trendStrength: number
  priceChange: number
  volumeChange: number
  sma: number | null
  ema: number | null
  volatility: number
}

/**
 * Compute market trends analytics for a single item across multiple time windows
 */
export function computeMarketTrends(
  itemName: string,
  modRank: number,
  history: DailyItemStats[],
  date: string,
): MarketTrendData[] {
  // Calculate aggregated metrics once
  const aggregatedMetrics = computeAggregatedMetrics(history)

  const marketTrends: MarketTrendData[] = []
  const windows: ('7d' | '14d' | '30d')[] = ['7d', '14d', '30d']

  for (const window of windows) {
    const windowData = aggregatedMetrics[window]
    const trendStrength = Math.min(
      (Math.abs(windowData.priceTrend) * (1 + Math.abs(windowData.volumeTrend))) / 2,
      1,
    )
    const trendDirection =
      windowData.priceTrend > 0.02
        ? 'bullish'
        : windowData.priceTrend < -0.02
          ? 'bearish'
          : 'sideways'

    marketTrends.push({
      itemName,
      modRank,
      date,
      window,
      trendDirection,
      trendStrength,
      priceChange: windowData.priceTrend,
      volumeChange: windowData.volumeTrend,
      sma: windowData.sma,
      ema: null, // TODO: Implement EMA calculation
      volatility: windowData.volatility,
    })
  }

  return marketTrends
}
