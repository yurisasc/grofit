import { Injectable } from '@nestjs/common'
import { db, schema } from '@grofit/db'
import { eq, gte, and } from 'drizzle-orm'
import { ANALYTICS_CONFIG, DailyItemStats } from '@grofit/analytics'
import logger from '@grofit/logger'

const log = logger.child({ service: 'AnalyticsDataFetcher' })

/**
 * Service responsible for fetching and preparing analytics data
 */
@Injectable()
export class AnalyticsDataFetcher {
  /**
   * Fetch price history data for analytics processing
   * @param date - The target date for analytics
   * @returns Grouped price history data by item
   */
  async fetchAnalyticsData(date: string): Promise<Record<string, DailyItemStats[]>> {
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - ANALYTICS_CONFIG.POPULAR_ITEMS_HISTORY_DAYS)

    log.info({ date, startDate: startDate.toISOString().split('T')[0] }, 'Fetching analytics data')

    // Fetch comprehensive price history
    const history = await db
      .select({
        itemName: schema.priceHistoryEntries.itemName,
        modRank: schema.priceHistoryEntries.modRank,
        date: schema.priceHistoryEntries.date,
        volume: schema.priceHistoryEntries.volume,
        minPrice: schema.priceHistoryEntries.minPrice,
        maxPrice: schema.priceHistoryEntries.maxPrice,
        avgPrice: schema.priceHistoryEntries.avgPrice,
        median: schema.priceHistoryEntries.median,
      })
      .from(schema.priceHistoryEntries)
      .where(
        and(
          gte(schema.priceHistoryEntries.date, startDate.toISOString().split('T')[0]),
          eq(schema.priceHistoryEntries.orderType, 'closed'),
        ),
      )

    // Group by item for analysis
    const byItem = history.reduce(
      (acc, row) => {
        const key = `${row.itemName}::${row.modRank}`
        if (!acc[key]) acc[key] = []
        acc[key].push(row)
        return acc
      },
      {} as Record<string, DailyItemStats[]>,
    )

    // Aggregate daily data per item+modrank to ensure uniqueness
    const aggregatedByItem: Record<string, DailyItemStats[]> = {}
    for (const [key, entries] of Object.entries(byItem)) {
      // Group entries by date to aggregate daily data
      const byDate = entries.reduce(
        (dateAcc, entry) => {
          if (!dateAcc[entry.date]) dateAcc[entry.date] = []
          dateAcc[entry.date].push(entry)
          return dateAcc
        },
        {} as Record<string, DailyItemStats[]>,
      )

      // Aggregate data for each date
      const aggregatedEntries: DailyItemStats[] = []
      for (const [dateKey, dateEntries] of Object.entries(byDate)) {
        // For each date, aggregate multiple entries into one
        const aggregated: DailyItemStats = {
          itemName: dateEntries[0].itemName,
          modRank: dateEntries[0].modRank,
          date: dateKey,
          volume: dateEntries.reduce((sum, e) => sum + (e.volume || 0), 0),
          minPrice: Math.min(...dateEntries.map((e) => e.minPrice || Infinity)),
          maxPrice: Math.max(...dateEntries.map((e) => e.maxPrice || -Infinity)),
          avgPrice: dateEntries.reduce((sum, e) => sum + (e.avgPrice || 0), 0) / dateEntries.length,
          median: dateEntries.reduce((sum, e) => sum + (e.median || 0), 0) / dateEntries.length,
        }
        aggregatedEntries.push(aggregated)
      }

      aggregatedByItem[key] = aggregatedEntries
    }

    log.info(
      { itemCount: Object.keys(aggregatedByItem).length, totalEntries: history.length },
      'Analytics data fetched and grouped',
    )

    return aggregatedByItem
  }
}
