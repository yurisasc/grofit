import { db, schema } from '@grofit/db'
import { eq, and } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'

export type MarketTrendInsert = typeof schema.marketTrends.$inferInsert
export type MarketTrendSelect = typeof schema.marketTrends.$inferSelect

/**
 * Service for managing market trend data in the database
 *
 * Handles all database operations related to market trend analysis,
 * including bulk inserts, queries, and data management for trend
 * analysis results across different time windows.
 */
@Injectable()
export class MarketTrendsService {
  private readonly log = logger.child({ service: 'MarketTrendsService' })

  /**
   * Insert trend analysis results for a specific date
   *
   * Performs bulk insert of trend data for all items on a given date.
   * Uses transaction to ensure data consistency and batching for performance.
   *
   * @param trends - Array of trend analysis results to insert
   */
  async upsertTrendsForDate(trends: MarketTrendInsert[]) {
    if (trends.length === 0) return

    this.log.info({ count: trends.length }, 'Upserting market trends.')

    await db.transaction(async (tx) => {
      // Clear old trends for the date to re-compute everything
      if (trends[0]?.date) {
        await tx.delete(schema.marketTrends).where(eq(schema.marketTrends.date, trends[0].date))
      }

      const BATCH_SIZE = 250
      for (let i = 0; i < trends.length; i += BATCH_SIZE) {
        const batch = trends.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.marketTrends).values(batch)
      }
    })

    this.log.info({ count: trends.length }, 'Market trends upserted successfully.')
  }

  /**
   * Get trend analysis for a specific item and date
   *
   * @param itemName - The item name to query
   * @param date - The date to query trends for
   * @returns Array of trend data for all windows (7d, 14d, 30d)
   */
  async getTrendsForItem(itemName: string, date: string): Promise<MarketTrendSelect[]> {
    return await db
      .select()
      .from(schema.marketTrends)
      .where(and(eq(schema.marketTrends.itemName, itemName), eq(schema.marketTrends.date, date)))
      .orderBy(schema.marketTrends.window)
  }

  /**
   * Get trend analysis for all items on a specific date
   *
   * @param date - The date to query trends for
   * @param window - Optional window filter ('7d', '14d', '30d')
   * @returns Array of trend data for the specified date and window
   */
  async getTrendsForDate(date: string, window?: string): Promise<MarketTrendSelect[]> {
    const conditions = [eq(schema.marketTrends.date, date)]

    if (window) {
      conditions.push(eq(schema.marketTrends.window, window))
    }

    return await db
      .select()
      .from(schema.marketTrends)
      .where(and(...conditions))
      .orderBy(schema.marketTrends.itemName, schema.marketTrends.window)
  }

  /**
   * Get trending items by direction and strength
   *
   * Useful for finding items with strong bullish or bearish trends.
   *
   * @param direction - Trend direction to filter by
   * @param minStrength - Minimum trend strength (0-1)
   * @param date - The date to query trends for
   * @param limit - Maximum number of results to return
   * @returns Array of trending items matching criteria
   */
  async getStrongTrends(
    direction: 'bullish' | 'bearish',
    _minStrength: number = 0.7,
    date: string,
    limit: number = 50,
  ): Promise<MarketTrendSelect[]> {
    return await db
      .select()
      .from(schema.marketTrends)
      .where(
        and(
          eq(schema.marketTrends.date, date),
          eq(schema.marketTrends.trendDirection, direction),
          // TODO: Implement proper decimal comparison for trendStrength filtering
        ),
      )
      .orderBy(schema.marketTrends.trendStrength)
      .limit(limit)
  }

  /**
   * Delete old trend data
   *
   * Useful for cleanup operations to remove outdated trend analysis.
   *
   * @param beforeDate - Delete trends before this date
   * @returns Number of deleted records
   */
  async deleteOldTrends(beforeDate: string): Promise<number> {
    // TODO: Implement proper date comparison for cleanup operations
    // For now, return 0 as this requires additional date comparison logic
    this.log.info({ beforeDate }, 'Cleanup operation not yet implemented.')
    return 0
  }
}
