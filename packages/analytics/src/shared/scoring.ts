import { FlipScoreInputs } from './types'

/**
 * Convenience wrapper for calculating complete flip scores
 *
 * @param trend - Calculated trend factors
 * @param performance - Calculated performance factors
 * @param pattern - Calculated pattern factors
 * @param market - Calculated market health factors
 * @returns Complete flip score result with overall score, recommendation, and confidence
 */
export function calculateFlipScore(
  trend: FlipScoreInputs['trend'],
  performance: FlipScoreInputs['performance'],
  pattern: FlipScoreInputs['pattern'],
  market: FlipScoreInputs['market'],
): {
  overallScore: number
  recommendation: 'BUY' | 'HOLD' | 'AVOID'
  confidence: number
} {
  const inputs: FlipScoreInputs = { trend, performance, pattern, market }

  const overallScore = computeOverallFlipScore(inputs)
  const recommendation = generateRecommendation(overallScore)
  const confidence = calculateConfidence(inputs)

  return {
    overallScore,
    recommendation,
    confidence,
  }
}

/**
 * Computes the overall flip score from all calculated factor groups.
 * @param inputs - A composite object containing all factor groups.
 * @returns The final, weighted flip score (0-1 scale).
 */
export function computeOverallFlipScore(inputs: FlipScoreInputs): number {
  const weights = {
    trend: 0.3, // Market momentum is most important
    performance: 0.35, // Historical performance is key
    pattern: 0.15, // Timing optimization
    market: 0.2, // Overall market conditions
  }

  const trendScore =
    inputs.trend.strength *
    (inputs.trend.direction === 'bullish' ? 1.0 : inputs.trend.direction === 'bearish' ? -0.5 : 0.0)

  const performanceScore =
    inputs.performance.stability * 0.4 +
    inputs.performance.volumeRank * 0.4 +
    (1 - inputs.performance.volatility) * 0.2

  const patternScore = inputs.pattern.seasonalStrength * inputs.pattern.confidence
  const marketScore = inputs.market.overallScore

  return (
    trendScore * weights.trend +
    performanceScore * weights.performance +
    patternScore * weights.pattern +
    marketScore * weights.market
  )
}

/**
 * Generates a recommendation based on the overall score.
 * @param score - The overall flip score (-1 to 1).
 * @returns The recommendation.
 */
export function generateRecommendation(score: number): 'BUY' | 'HOLD' | 'AVOID' {
  if (score > 0.7) return 'BUY'
  if (score > 0.3) return 'HOLD'
  return 'AVOID'
}

/**
 * Calculates confidence score based on factor consistency.
 * @param inputs - All factor groups for analysis.
 * @returns Confidence score (0-1 scale).
 */
export function calculateConfidence(inputs: FlipScoreInputs): number {
  // Calculate variance across factors to determine consistency
  const factors = [
    inputs.trend.strength,
    inputs.performance.rank / 100, // Normalize to 0-1
    inputs.performance.stability,
    inputs.performance.volumeRank,
    1 - inputs.performance.volatility, // Invert volatility
    inputs.pattern.seasonalStrength,
    inputs.pattern.confidence,
    inputs.market.overallScore,
  ]

  const mean = factors.reduce((sum, f) => sum + f, 0) / factors.length
  const variance = factors.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / factors.length
  const stdDev = Math.sqrt(variance)

  // Lower variance = more consistent factors = higher confidence
  return Math.max(0.1, Math.min(1.0, 1 - stdDev))
}
