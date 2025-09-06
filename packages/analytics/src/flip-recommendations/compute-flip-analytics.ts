import { DailyItemStats, FlipResult } from '../shared/types'
import { computeAggregatedMetrics } from '../shared/core'
import {
  calculateTrendFactors,
  calculatePerformanceFactors,
  calculatePatternFactors,
  calculateMarketHealthFactors,
} from '../shared/factors'
import {
  computeOverallFlipScore,
  generateRecommendation,
  calculateConfidence,
} from '../shared/scoring'

/**
 * Compute flip recommendation analytics for a single item
 */
export function computeFlipAnalytics(
  itemName: string,
  modRank: number,
  history: DailyItemStats[],
): FlipResult {
  // Calculate aggregated metrics once
  const aggregatedMetrics = computeAggregatedMetrics(history)

  // Calculate factor groups
  const trend = calculateTrendFactors(aggregatedMetrics)
  const performance = calculatePerformanceFactors(history, aggregatedMetrics)
  const pattern = calculatePatternFactors(history)
  const market = calculateMarketHealthFactors(history)

  // Compute flip analytics
  const overallScore = computeOverallFlipScore({ trend, performance, pattern, market })
  const recommendation = generateRecommendation(overallScore)
  const confidence = calculateConfidence({ trend, performance, pattern, market })

  return {
    itemName,
    modRank,
    overallScore,
    recommendation,
    confidence,
    factors: {
      trendStrength: trend.strength,
      performanceRank: performance.rank,
      stabilityScore: performance.stability,
      volumeRank: performance.volumeRank,
      volatilityScore: performance.volatility,
      seasonalMultiplier: pattern.seasonalStrength,
      marketHealth: market.overallScore,
      patternConfidence: pattern.confidence,
    },
  }
}
