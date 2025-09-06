import { Injectable } from '@nestjs/common'
import { db, schema } from '@grofit/db'
import { gte, and, eq, inArray } from 'drizzle-orm'
import {
  computeScore,
  computeAggregatedMetrics,
  ANALYTICS_CONFIG,
  PopularItemScore,
} from '@grofit/analytics'
import logger from '@grofit/logger'

/**
 * Service for computing popular items based on price history data
 *
 * This service analyzes trading data over a configurable period to calculate
 * popularity scores for items, taking into account factors like:
 * - Trading volume (liquidity)
 * - Price spread (volatility)
 * - Price stability
 *
 * The computed scores are used to rank items by popularity and identify
 * trending items in the marketplace.
 */
@Injectable()
export class PopularItemsComputeService {
  private readonly log = logger.child({ service: 'PopularItemsComputeService' })

  constructor() {}

  /**
   * Compute popularity scores for items based on the specified date
   *
   * Fetches configurable days of price history data ending on the given date,
   * groups data by item and modification rank, computes aggregated metrics
   * for each item, calculates popularity scores, and returns the results
   * sorted by score (highest first)
   *
   * @param date - The target date for computing popular items (YYYY-MM-DD format)
   * @returns Array of popular item scores sorted by popularity (highest first)
   */
  async computeForDate(date: string): Promise<PopularItemScore[]> {
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - ANALYTICS_CONFIG.POPULAR_ITEMS_HISTORY_DAYS)
    const startDateString = startDate.toISOString().split('T')[0]

    this.log.info(
      { date, startDate: startDateString },
      `Fetching ${ANALYTICS_CONFIG.POPULAR_ITEMS_HISTORY_DAYS} days of price history for analytics.`,
    )

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
          gte(schema.priceHistoryEntries.date, startDateString),
          eq(schema.priceHistoryEntries.orderType, 'closed'),
        ),
      )

    const items = await db.query.items.findMany({
      where: inArray(schema.items.name, Array.from(new Set(history.map((h) => h.itemName)))),
    })
    const itemMap = new Map(items.map((i) => [i.name, i]))

    const byItem = history.reduce(
      (acc, row) => {
        const key = `${row.itemName}::${row.modRank}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(row)
        return acc
      },
      {} as Record<string, typeof history>,
    )

    const scores = Object.entries(byItem)
      .map(([key, stats]) => {
        const [itemName, modRankStr] = key.split('::')
        const modRank = parseInt(modRankStr, 10)
        const item = itemMap.get(itemName)
        if (!item) return null

        const metrics = computeAggregatedMetrics(stats)
        const result = computeScore(metrics, {
          weights: { liquidity: 0.5, spread: 0.3, volatility: 0.2 },
        })

        return {
          itemName: item.name,
          modRank,
          score: result.score,
          metricsJson: result.metricsJson,
        }
      })
      .filter(Boolean) as {
      itemName: string
      modRank: number
      score: number
      metricsJson: object
    }[]

    scores.sort((a, b) => b.score - a.score)

    return scores
  }
}
