import { db, schema } from '@grofit/db'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'

export type FlipRecommendationInsert = typeof schema.flipRecommendations.$inferInsert

@Injectable()
export class FlipRecommendationsService {
  private readonly log = logger.child({ service: 'FlipRecommendationsService' })

  async upsertDaily(items: FlipRecommendationInsert[]) {
    if (items.length === 0) return

    this.log.info({ count: items.length }, 'Upserting flip recommendations.')

    await db.transaction(async (tx) => {
      // Clear old items for the date to re-rank everything
      if (items[0]?.date) {
        await tx
          .delete(schema.flipRecommendations)
          .where(eq(schema.flipRecommendations.date, items[0].date))
      }

      // Deduplicate items by (date, itemName, modRank) to prevent unique constraint violations
      const uniqueItems = items.filter(
        (item, index, arr) =>
          arr.findIndex(
            (i) =>
              i.date === item.date && i.itemName === item.itemName && i.modRank === item.modRank,
          ) === index,
      )

      if (uniqueItems.length !== items.length) {
        this.log.warn(
          {
            date: items[0]?.date,
            originalCount: items.length,
            uniqueCount: uniqueItems.length,
            duplicatesRemoved: items.length - uniqueItems.length,
          },
          'Found and removed duplicate flip recommendations',
        )
      } else {
        this.log.debug(
          {
            date: items[0]?.date,
            count: items.length,
          },
          'No duplicate flip recommendations found',
        )
      }

      const BATCH_SIZE = 250
      for (let i = 0; i < uniqueItems.length; i += BATCH_SIZE) {
        const batch = uniqueItems.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.flipRecommendations).values(batch)
      }
    })
  }
}
