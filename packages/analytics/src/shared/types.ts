/**
 * Metrics for a specific time window (e.g., 7-day, 14-day, 30-day periods)
 * Contains aggregated statistics like volume, price volatility, and price ranges
 * Extended with trend analysis indicators
 */
export interface TimeWindowMetrics {
  volume: number
  vwap: number
  volatility: number
  minPrice: number
  maxPrice: number
  /** Price trend direction: positive for upward, negative for downward */
  priceTrend: number
  /** Volume trend as percentage change from previous period */
  volumeTrend: number
  /** Trend strength indicator (0-1 scale) */
  trendStrength: number
  /** Simple moving average over the time window */
  sma: number
}

/**
 * Daily statistics for a specific item, including trading data and price information
 * All price and volume fields can be null if no trading data exists for that day
 */
export interface DailyItemStats {
  date: string
  itemName: string
  modRank: number
  volume: number | null
  minPrice: number | null
  maxPrice: number | null
  avgPrice: number | null
  median: number | null
}

/**
 * Aggregated metrics across multiple time windows for comprehensive analysis.
 * Used as input for computing all analytics factors.
 */
export interface AggregatedMetrics {
  '7d': TimeWindowMetrics
  '14d': TimeWindowMetrics
  '30d': TimeWindowMetrics
  latest: DailyItemStats
}

/**
 * Trend direction enumeration for market analysis.
 */
export type TrendDirection = 'bullish' | 'bearish' | 'sideways'

// #region Factor Types

/**
 * Factors derived from trend analysis, used for scoring.
 */
export interface TrendFactors {
  strength: number // Overall trend strength (0-1)
  direction: TrendDirection
  momentum: number // Volume trend as percentage change
}

/**
 * Factors derived from performance analysis, used for scoring.
 */
export interface PerformanceFactors {
  rank: number // Performance rank (1-100)
  stability: number // Price stability score (0-1)
  volumeRank: number // Volume ranking (0-1)
  volatility: number // Volatility score (0-1)
}

/**
 * Factors derived from pattern analysis, used for scoring.
 */
export interface PatternFactors {
  seasonalStrength: number // Seasonal pattern strength (0-1)
  confidence: number // Pattern confidence (0-1)
}

/**
 * Factors derived from market health analysis, used for scoring.
 */
export interface MarketHealthFactors {
  overallScore: number // Overall market health (0-1)
}

// #endregion

// #region Flip Recommendation Types

/**
 * A composite object containing all factor groups for flip scoring.
 * This is the primary input for the final scoring algorithm.
 */
export interface FlipScoreInputs {
  trend: TrendFactors
  performance: PerformanceFactors
  pattern: PatternFactors
  market: MarketHealthFactors
}

/**
 * The final, comprehensive recommendation for a single item.
 */
export interface FlipRecommendation {
  itemName: string
  modRank: number
  overallScore: number
  recommendation: 'BUY' | 'HOLD' | 'AVOID'
  confidence: number
  factors: {
    trend: TrendFactors
    performance: PerformanceFactors
    pattern: PatternFactors
    market: MarketHealthFactors
  }
}

/**
 * A top-ranked flip recommendation, used for publishing events.
 */
export interface TopFlipRecommendation {
  itemName: string
  modRank: number
  rank: number // 1-based rank
  overallScore: number
  recommendation: 'BUY' | 'HOLD' | 'AVOID'
  confidence: number
  factors: FlipScoreInputs
}

/**
 * Types for flip analytics
 */
export interface FlipResult {
  itemName: string
  modRank: number
  overallScore: number
  recommendation: 'BUY' | 'HOLD' | 'AVOID'
  confidence: number
  factors: {
    trendStrength: number
    performanceRank: number
    stabilityScore: number
    volumeRank: number
    volatilityScore: number
    seasonalMultiplier: number
    marketHealth: number
    patternConfidence: number
  }
}
// #endregion
