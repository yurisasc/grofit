import { Injectable } from '@nestjs/common'
import { ItemPerformanceData } from '@grofit/analytics'
import { ItemPerformanceService } from '../../../services/db/item-performance'

/**
 * Service responsible for storing item performance analytics data
 */
@Injectable()
export class ItemPerformanceStorage {
  constructor(private readonly itemPerformanceService: ItemPerformanceService) {}

  /**
   * Store item performance data
   */
  async storeItemPerformances(
    date: string,
    itemPerformances: ItemPerformanceData[],
  ): Promise<void> {
    if (itemPerformances.length === 0) return

    // Convert to Drizzle-compatible format (strings for decimals)
    const drizzlePerformances = itemPerformances.map((perf) => ({
      ...perf,
      date, // Add the date to each performance record
      priceChangePercent: perf.priceChangePercent?.toString(),
      volumeChangePercent: perf.volumeChangePercent.toString(),
      stabilityScore: perf.stabilityScore.toString(),
      performanceRank: perf.performanceRank.toString(),
      liquidityScore: perf.liquidityScore.toString(),
      volatilityScore: perf.volatilityScore.toString(),
    }))

    await this.itemPerformanceService.upsertPerformanceForDate(drizzlePerformances)
  }
}
