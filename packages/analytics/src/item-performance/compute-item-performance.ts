import { DailyItemStats } from '../shared/types'
import { computeAggregatedMetrics } from '../shared/core'
import { calculatePerformanceFactors } from '../shared/factors'

export interface ItemPerformanceData {
  itemName: string
  modRank: number
  date: string
  priceChangePercent: number | null
  volumeChangePercent: number
  stabilityScore: number
  performanceRank: number
  liquidityScore: number
  volatilityScore: number
}

/**
 * Compute item performance analytics for a single item
 */
export function computeItemPerformance(
  itemName: string,
  modRank: number,
  history: DailyItemStats[],
  date: string,
): ItemPerformanceData {
  // Calculate aggregated metrics once
  const aggregatedMetrics = computeAggregatedMetrics(history)

  // Calculate performance factors
  const performance = calculatePerformanceFactors(history, aggregatedMetrics)

  const priceChangePercent = calculatePriceChangePercent(history)
  const liquidityScore = calculateLiquidityScore(history)

  return {
    itemName,
    modRank,
    date,
    priceChangePercent,
    volumeChangePercent: aggregatedMetrics['30d'].volumeTrend,
    stabilityScore: 1 - aggregatedMetrics['30d'].volatility,
    performanceRank: performance.rank,
    liquidityScore,
    volatilityScore: aggregatedMetrics['30d'].volatility,
  }
}

/**
 * Calculate price change percentage over the analysis period
 */
function calculatePriceChangePercent(history: DailyItemStats[]): number | null {
  if (history.length < 2) return null

  const sortedHistory = history.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const firstPrice = sortedHistory[0].avgPrice
  const lastPrice = sortedHistory[sortedHistory.length - 1].avgPrice

  if (!firstPrice || !lastPrice || firstPrice === 0) return null

  return ((lastPrice - firstPrice) / firstPrice) * 100
}

/**
 * Calculate liquidity score based on volume consistency
 */
function calculateLiquidityScore(history: DailyItemStats[]): number {
  const volumes = history
    .map((h) => h.volume)
    .filter((v) => v !== null && v !== undefined) as number[]

  if (volumes.length < 7) return 0.5

  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length
  const stdDev = Math.sqrt(variance)

  // Higher liquidity = lower volume variance relative to average
  return Math.max(0, Math.min(1, 1 - stdDev / avgVolume))
}
