import {
  AggregatedMetrics,
  DailyItemStats,
  TrendFactors,
  PerformanceFactors,
  PatternFactors,
  MarketHealthFactors,
} from './types'

/**
 * Extracts trend factors from aggregated metrics.
 * @param aggregatedMetrics - The pre-computed aggregated metrics for an item.
 * @returns The calculated trend factors.
 */
export function calculateTrendFactors(aggregatedMetrics: AggregatedMetrics): TrendFactors {
  const { '30d': month30d } = aggregatedMetrics
  const trendStrength = (Math.abs(month30d.priceTrend) * (1 + Math.abs(month30d.volumeTrend))) / 2

  return {
    strength: Math.min(trendStrength, 1),
    direction:
      month30d.priceTrend > 0.02 ? 'bullish' : month30d.priceTrend < -0.02 ? 'bearish' : 'sideways',
    momentum: month30d.volumeTrend,
  }
}

/**
 * Calculates performance factors for flip scoring.
 * @param history - Daily item statistics for the item.
 * @param aggregatedMetrics - Pre-computed aggregated metrics.
 * @returns The calculated performance factors.
 */
export function calculatePerformanceFactors(
  history: DailyItemStats[],
  aggregatedMetrics: AggregatedMetrics,
): PerformanceFactors {
  const { '30d': month30d } = aggregatedMetrics
  const volumeRank = Math.min(month30d.volume / 1000, 1) // Normalize based on typical volume
  const stabilityScore = Math.max(0, 1 - month30d.volatility)
  const volatilityScore = Math.min(month30d.volatility, 1)
  const performanceRank = calculatePerformanceRank(history)

  return {
    rank: performanceRank,
    stability: stabilityScore,
    volumeRank,
    volatility: volatilityScore,
  }
}

/**
 * Calculate performance rank based on historical price changes
 * @param history - Daily item statistics
 * @returns Performance rank (1-100 scale, higher is better)
 */
function calculatePerformanceRank(history: DailyItemStats[]): number {
  if (history.length < 7) return 50 // Neutral rank for insufficient data

  // Calculate 30-day price change
  const recentPrices = history
    .filter((h) => h.avgPrice !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (recentPrices.length < 2) return 50

  const latestPrice = recentPrices[0].avgPrice!
  const monthAgoPrice = recentPrices[Math.min(29, recentPrices.length - 1)].avgPrice!

  const priceChangePercent = ((latestPrice - monthAgoPrice) / monthAgoPrice) * 100

  // Convert to 1-100 rank (50 = neutral, >50 = positive performance)
  return Math.max(1, Math.min(100, 50 + priceChangePercent * 2))
}

/**
 * Calculate pattern analysis factors for seasonal/timing optimization.
 * @param history - Daily item statistics.
 * @returns The calculated pattern factors.
 */
export function calculatePatternFactors(history: DailyItemStats[]): PatternFactors {
  return {
    seasonalStrength: calculateSeasonalStrength(history),
    confidence: calculatePatternConfidence(history),
  }
}

/**
 * Calculate market health indicators.
 * @param history - Daily item statistics for this item.
 * @param _marketHistory - Optional broader market data for context (future use).
 * @returns The calculated market health factors.
 */
export function calculateMarketHealthFactors(
  history: DailyItemStats[],
  _marketHistory?: DailyItemStats[],
): MarketHealthFactors {
  return {
    overallScore: calculateOverallMarketHealth(history),
  }
}

/**
 * Calculate overall market health score.
 * @param history - Item-specific history.
 * @returns Health score (0-1 scale).
 */
function calculateOverallMarketHealth(history: DailyItemStats[]): number {
  if (history.length < 7) return 0.5 // Neutral for insufficient data

  // Calculate liquidity score (based on trading volume consistency)
  const liquidityScore = calculateLiquidityScore(history)

  // Calculate participation score (based on active trading days)
  const participationScore = calculateParticipationScore(history)

  // Calculate stability score (based on price volatility trends)
  const stabilityScore = calculateMarketStabilityScore(history)

  return liquidityScore * 0.4 + participationScore * 0.3 + stabilityScore * 0.3
}

/**
 * Calculate liquidity score based on volume consistency.
 * @param history - Daily item statistics.
 * @returns Liquidity score (0-1 scale).
 */
function calculateLiquidityScore(history: DailyItemStats[]): number {
  const validVolumes = history
    .filter((h) => h.volume !== null && h.volume! > 0)
    .map((h) => h.volume!)

  if (validVolumes.length < 7) return 0.5

  const avgVolume = validVolumes.reduce((sum, v) => sum + v, 0) / validVolumes.length
  const volumeVariance =
    validVolumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / validVolumes.length
  const volumeStdDev = Math.sqrt(volumeVariance)

  // Lower coefficient of variation = more liquid
  const cv = avgVolume > 0 ? volumeStdDev / avgVolume : 1
  return Math.max(0, 1 - cv)
}

/**
 * Calculate participation score based on active trading days.
 * @param history - Daily item statistics.
 * @returns Participation score (0-1 scale).
 */
function calculateParticipationScore(history: DailyItemStats[]): number {
  const totalDays = history.length
  if (totalDays === 0) return 0

  const activeDays = history.filter(
    (h) => h.volume !== null && h.volume! > 0 && h.avgPrice !== null,
  ).length

  return activeDays / totalDays
}

/**
 * Calculate market stability score based on volatility trends.
 * @param history - Daily item statistics.
 * @returns Stability score (0-1 scale).
 */
function calculateMarketStabilityScore(history: DailyItemStats[]): number {
  if (history.length < 14) return 0.5

  // Calculate rolling 7-day volatilities
  const volatilities: number[] = []

  for (let i = 6; i < history.length; i++) {
    const window = history.slice(i - 6, i + 1)
    const prices = window.filter((h) => h.avgPrice !== null).map((h) => h.avgPrice!)

    if (prices.length < 3) continue

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    const volatility = Math.sqrt(variance) / mean // Coefficient of variation

    volatilities.push(volatility)
  }

  if (volatilities.length < 2) return 0.5

  // Check if volatility is trending up or down
  const recent = volatilities.slice(-7) // Last 7 volatilities
  const earlier = volatilities.slice(-14, -7) // Previous 7

  if (earlier.length === 0) return 0.5

  const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length

  const volatilityTrend = (recentAvg - earlierAvg) / earlierAvg

  // Decreasing volatility = more stable = higher score
  return Math.max(0, Math.min(1, 0.5 - volatilityTrend))
}

/**
 * Calculate seasonal strength based on day-of-week patterns.
 * @param history - Daily item statistics.
 * @returns Seasonal strength (0-1 scale).
 */
function calculateSeasonalStrength(history: DailyItemStats[]): number {
  if (history.length < 14) return 0.5 // Neutral for insufficient data

  // Group by day of week
  const dayOfWeekStats = new Map<number, { volume: number[]; price: number[] }>()

  history.forEach((day) => {
    if (day.volume === null || day.avgPrice === null) return

    const dayOfWeek = new Date(day.date).getDay()
    if (!dayOfWeekStats.has(dayOfWeek)) {
      dayOfWeekStats.set(dayOfWeek, { volume: [], price: [] })
    }

    const stats = dayOfWeekStats.get(dayOfWeek)!
    stats.volume.push(day.volume)
    stats.price.push(day.avgPrice)
  })

  // Calculate day-of-week strength
  const dayStrengths: number[] = []

  dayOfWeekStats.forEach((stats) => {
    if (stats.volume.length < 2) return

    const avgVolume = stats.volume.reduce((sum, v) => sum + v, 0) / stats.volume.length
    const volumeVariance =
      stats.volume.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / stats.volume.length
    const volumeStdDev = Math.sqrt(volumeVariance)

    // Lower variance = more predictable = stronger seasonal pattern
    const strength = Math.max(0, 1 - volumeStdDev / avgVolume)
    dayStrengths.push(strength)
  })

  return dayStrengths.length > 0
    ? dayStrengths.reduce((sum, s) => sum + s, 0) / dayStrengths.length
    : 0.5
}

/**
 * Calculate pattern confidence based on data consistency and sample size.
 * @param history - Daily item statistics.
 * @returns Confidence score (0-1 scale).
 */
function calculatePatternConfidence(history: DailyItemStats[]): number {
  const validDays = history.filter((h) => h.volume !== null && h.avgPrice !== null).length
  const totalDays = history.length

  if (totalDays === 0) return 0

  const dataCompleteness = validDays / totalDays
  const sampleSize = Math.min(totalDays / 30, 1) // Full confidence after 30 days

  return dataCompleteness * 0.7 + sampleSize * 0.3
}
