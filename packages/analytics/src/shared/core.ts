import { AggregatedMetrics, DailyItemStats } from './types'

/**
 * Computes aggregated metrics across multiple time windows from daily item statistics,
 * including trend analysis indicators for each time window.
 * @param history - Array of daily item statistics, sorted descending by date.
 * @returns Aggregated metrics for 7-day, 14-day, and 30-day windows.
 */
export function computeAggregatedMetrics(history: DailyItemStats[]): AggregatedMetrics {
  const sorted = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const computeForWindow = (days: number) => {
    const windowData = sorted.slice(0, days)
    if (windowData.length === 0) {
      return {
        volume: 0,
        vwap: 0,
        volatility: 0,
        minPrice: 0,
        maxPrice: 0,
        priceTrend: 0,
        volumeTrend: 0,
        trendStrength: 0,
        sma: 0,
      }
    }

    const validData = windowData.filter(
      (d) => d.volume !== null && d.avgPrice !== null && d.minPrice !== null && d.maxPrice !== null,
    )

    if (validData.length === 0) {
      return {
        volume: 0,
        vwap: 0,
        volatility: 0,
        minPrice: 0,
        maxPrice: 0,
        priceTrend: 0,
        volumeTrend: 0,
        trendStrength: 0,
        sma: 0,
      }
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

    // Calculate trend indicators
    const firstHalf = validData.slice(0, Math.floor(validData.length / 2))
    const secondHalf = validData.slice(Math.floor(validData.length / 2))

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, d) => sum + d.avgPrice!, 0) / firstHalf.length
        : 0
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, d) => sum + d.avgPrice!, 0) / secondHalf.length
        : 0

    const priceTrend = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0

    const firstHalfVolume = firstHalf.reduce((sum, d) => sum + d.volume!, 0)
    const secondHalfVolume = secondHalf.reduce((sum, d) => sum + d.volume!, 0)
    const volumeTrend =
      firstHalfVolume > 0 ? (secondHalfVolume - firstHalfVolume) / firstHalfVolume : 0

    const trendStrength = (Math.abs(priceTrend) * (1 + Math.abs(volumeTrend))) / 2 // 0-1 scale
    const sma = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length

    return {
      volume: totalVolume,
      vwap,
      volatility,
      minPrice,
      maxPrice,
      priceTrend,
      volumeTrend,
      trendStrength: Math.min(trendStrength, 1), // Cap at 1
      sma,
    }
  }

  return {
    '7d': computeForWindow(7),
    '14d': computeForWindow(14),
    '30d': computeForWindow(30),
    latest: sorted[0],
  }
}

/**
 * Calculates simple moving average for an item over specified days
 * @param history - Array of daily item statistics
 * @param days - Number of days for moving average
 * @returns Simple moving average or null if insufficient data
 */
export function calculateSMA(history: DailyItemStats[], days: number): number | null {
  const recent = history.slice(0, days)
  if (recent.length < days) return null

  const validPrices = recent
    .map((d) => d.avgPrice)
    .filter((price) => price !== null && price !== undefined) as number[]

  if (validPrices.length === 0) return null

  return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
}

/**
 * Calculates exponential moving average for an item
 * @param history - Array of daily item statistics
 * @param days - Number of days for EMA calculation
 * @returns Exponential moving average or null if insufficient data
 */
export function calculateEMA(history: DailyItemStats[], days: number): number | null {
  const recent = history.slice(0, days)
  if (recent.length < days) return null

  const validPrices = recent
    .map((d) => d.avgPrice)
    .filter((price) => price !== null && price !== undefined) as number[]

  if (validPrices.length === 0) return null

  const multiplier = 2 / (days + 1)

  // Start with SMA for first value
  let ema = validPrices[0]

  // Calculate EMA for remaining values
  for (let i = 1; i < validPrices.length; i++) {
    ema = (validPrices[i] - ema) * multiplier + ema
  }

  return ema
}
