import { db, schema } from '@grofit/db'
import { eq, and } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'

export type ItemPerformanceInsert = typeof schema.itemPerformance.$inferInsert
export type ItemPerformanceSelect = typeof schema.itemPerformance.$inferSelect

/**
 * Service for managing item performance data in the database
 *
 * Handles all database operations related to item performance analysis,
 * including bulk inserts, queries, and data management for performance
 * metrics and rankings.
 */
@Injectable()
export class ItemPerformanceService {
  private readonly log = logger.child({ service: 'ItemPerformanceService' })

  /**
   * Insert performance analysis results for a specific date
   *
   * Performs bulk insert of performance data for all items on a given date.
   * Uses transaction to ensure data consistency and batching for performance.
   *
   * @param performances - Array of performance analysis results to insert
   */
  async upsertPerformanceForDate(performances: ItemPerformanceInsert[]) {
    if (performances.length === 0) return

    this.log.info({ count: performances.length }, 'Upserting item performances.')

    await db.transaction(async (tx) => {
      // Clear old performance data for the date to re-compute everything
      if (performances[0]?.date) {
        await tx
          .delete(schema.itemPerformance)
          .where(eq(schema.itemPerformance.date, performances[0].date))
      }

      // Deduplicate performances by (itemName, date, modRank) to prevent unique constraint violations
      const uniquePerformances = performances.filter(
        (performance, index, arr) =>
          arr.findIndex(
            (p) =>
              p.itemName === performance.itemName &&
              p.date === performance.date &&
              p.modRank === performance.modRank,
          ) === index,
      )

      if (uniquePerformances.length !== performances.length) {
        this.log.warn(
          {
            date: performances[0]?.date,
            originalCount: performances.length,
            uniqueCount: uniquePerformances.length,
            duplicatesRemoved: performances.length - uniquePerformances.length,
          },
          'Found and removed duplicate item performances',
        )
      } else {
        this.log.debug(
          {
            date: performances[0]?.date,
            count: performances.length,
          },
          'No duplicate item performances found',
        )
      }

      const BATCH_SIZE = 250
      for (let i = 0; i < uniquePerformances.length; i += BATCH_SIZE) {
        const batch = uniquePerformances.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.itemPerformance).values(batch)
      }
    })

    this.log.info({ count: performances.length }, 'Item performances upserted successfully.')
  }

  /**
   * Get performance analysis for a specific item and date
   *
   * @param itemName - The item name to query
   * @param date - The date to query performance for
   * @returns Performance data for the specified item and date
   */
  async getPerformanceForItem(
    itemName: string,
    date: string,
  ): Promise<ItemPerformanceSelect | undefined> {
    const results = await db
      .select()
      .from(schema.itemPerformance)
      .where(
        and(eq(schema.itemPerformance.itemName, itemName), eq(schema.itemPerformance.date, date)),
      )
      .limit(1)

    return results[0]
  }

  /**
   * Get performance analysis for all items on a specific date
   *
   * @param date - The date to query performance for
   * @returns Array of performance data for the specified date
   */
  async getPerformanceForDate(date: string): Promise<ItemPerformanceSelect[]> {
    return await db
      .select()
      .from(schema.itemPerformance)
      .where(eq(schema.itemPerformance.date, date))
      .orderBy(schema.itemPerformance.performanceRank)
  }

  /**
   * Get top performing items by rank
   *
   * @param date - The date to query performance for
   * @param limit - Maximum number of results to return
   * @returns Array of top performing items
   */
  async getTopPerformers(date: string, limit: number = 50): Promise<ItemPerformanceSelect[]> {
    return await db
      .select()
      .from(schema.itemPerformance)
      .where(eq(schema.itemPerformance.date, date))
      .orderBy(schema.itemPerformance.performanceRank)
      .limit(limit)
  }

  /**
   * Delete old performance data
   *
   * Useful for cleanup operations to remove outdated performance analysis.
   *
   * @param beforeDate - Delete performance data before this date
   * @returns Number of deleted records
   */
  async deleteOldPerformance(beforeDate: string): Promise<number> {
    // TODO: Implement proper date comparison for cleanup operations
    // For now, return 0 as this requires additional date comparison logic
    this.log.info({ beforeDate }, 'Cleanup operation not yet implemented.')
    return 0
  }
}
