import { Injectable } from '@nestjs/common'
import { MarketTrendData } from '@grofit/analytics'
import { MarketTrendsService } from '../../../services/db/market-trends'

/**
 * Service responsible for storing market trends analytics data
 */
@Injectable()
export class MarketTrendsStorage {
  constructor(private readonly marketTrendsService: MarketTrendsService) {}

  /**
   * Store market trends data
   */
  async storeMarketTrends(date: string, marketTrends: MarketTrendData[]): Promise<void> {
    if (marketTrends.length === 0) return

    // Convert to Drizzle-compatible format (strings for decimals)
    const drizzleTrends = marketTrends.map((trend) => ({
      ...trend,
      date,
      trendStrength: trend.trendStrength.toString(),
      priceChange: trend.priceChange.toString(),
      volumeChange: trend.volumeChange.toString(),
      sma: trend.sma?.toString(),
      ema: trend.ema?.toString(),
      volatility: trend.volatility.toString(),
    }))

    await this.marketTrendsService.upsertTrendsForDate(drizzleTrends)
  }
}
