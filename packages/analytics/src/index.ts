// Configuration for analytics computations
export const ANALYTICS_CONFIG = {
  POPULAR_ITEMS_HISTORY_DAYS: 30,
  DEFAULT_WEIGHTS: {
    liquidity: 0.5,
    spread: 0.3,
    volatility: 0.2,
  },
  TOP_POPULAR_ITEMS: 5,
} as const

/**
 * Metrics for a specific time window (e.g., 7-day, 14-day, 30-day periods)
 * Contains aggregated statistics like volume, price volatility, and price ranges
 */
export interface TimeWindowMetrics {
  volume: number
  vwap: number
  volatility: number
  minPrice: number
  maxPrice: number
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
 * Parameters used for computing popularity scores
 * Weights determine how much each factor contributes to the final score
 */
export interface ScoreParams {
  weights: {
    liquidity: number
    spread: number
    volatility: number
  }
}

/**
 * Aggregated metrics across multiple time windows for comprehensive analysis
 * Used as input for computing popularity scores
 */
export interface AggregatedMetrics {
  '7d': TimeWindowMetrics
  '14d': TimeWindowMetrics
  '30d': TimeWindowMetrics
  latest: DailyItemStats
}

/**
 * Computes a popularity score for an item based on its trading metrics
 * @param metrics - Aggregated trading metrics across time windows
 * @param params - Scoring parameters with weights for different factors
 * @returns Object containing the computed score and detailed metrics
 */
export function computeScore(metrics: AggregatedMetrics, params: ScoreParams) {
  if (!metrics.latest) {
    return { score: 0, metricsJson: {} }
  }

  const { latest } = metrics
  const metrics30d = metrics['30d']

  // Handle null values by providing defaults
  const volume = latest.volume ?? 0
  const minPrice = latest.minPrice ?? 0
  const maxPrice = latest.maxPrice ?? 0
  const median = latest.median ?? 0

  // Simple spread calculation using available data (no percentiles)
  const spread = maxPrice - minPrice
  const spreadPct = median > 0 ? spread / median : 0

  const liquidityScore = Math.log(metrics30d.volume + 1)
  const spreadScore = spreadPct
  const volatilityScore = metrics30d.volatility

  const score =
    params.weights.liquidity * liquidityScore +
    params.weights.spread * spreadScore -
    params.weights.volatility * volatilityScore

  return {
    score,
    metricsJson: {
      liquidityScore,
      spreadScore,
      volatilityScore,
      volume,
      median,
      spreadPct,
      spread,
      minPrice,
      maxPrice,
      metrics,
    },
  }
}

// Analytics operation types

/**
 * Represents a computed score for a popular item
 * Contains the item name, modification rank, computed score, and associated metrics
 */
export interface PopularItemScore {
  itemName: string
  modRank: number
  score: number
  metricsJson: object
}

/**
 * Data structure for upserting popular item records to the database
 * Includes all necessary fields for storing daily popular item rankings
 */
export interface PopularItemUpsert {
  date: string
  itemName: string
  modRank: number
  score: string
  rank: number // 1-based rank
  metricsJson: object
}

/**
 * Represents a top-ranked item in the popularity results
 * Used for publishing top items in analytics events
 */
export interface TopItem {
  itemName: string
  modRank: number
  rank: number // 1-based rank
  score: number
  metrics: object
}

/**
 * Computes aggregated metrics across multiple time windows from daily item statistics
 * @param history - Array of daily item statistics
 * @returns Aggregated metrics for 7-day, 14-day, and 30-day windows
 */
export function computeAggregatedMetrics(history: DailyItemStats[]): AggregatedMetrics {
  const sorted = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const computeForWindow = (days: number): TimeWindowMetrics => {
    const windowData = sorted.slice(0, days)
    if (windowData.length === 0) {
      return { volume: 0, vwap: 0, volatility: 0, minPrice: 0, maxPrice: 0 }
    }

    const validData = windowData.filter(
      (d) => d.volume !== null && d.avgPrice !== null && d.minPrice !== null && d.maxPrice !== null,
    )

    if (validData.length === 0) {
      return { volume: 0, vwap: 0, volatility: 0, minPrice: 0, maxPrice: 0 }
    }

    const totalVolume = validData.reduce((sum, d) => sum + d.volume!, 0)
    const vwap = validData.reduce((sum, d) => sum + d.avgPrice! * d.volume!, 0) / totalVolume

    const validPrices = validData.map((d) => d.avgPrice!)
    const mean = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
    const variance =
      validPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / validPrices.length
    const stdev = Math.sqrt(variance)
    const volatility = stdev / mean // Coefficient of variation

    const minPrice = Math.min(...validData.map((d) => d.minPrice!))
    const maxPrice = Math.max(...validData.map((d) => d.maxPrice!))

    return { volume: totalVolume, vwap, volatility, minPrice, maxPrice }
  }

  return {
    '7d': computeForWindow(7),
    '14d': computeForWindow(14),
    '30d': computeForWindow(30),
    latest: sorted[0],
  }
}
