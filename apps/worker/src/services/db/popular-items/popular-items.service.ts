import { db, schema } from '@grofit/db'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'

export type PopularItemInsert = typeof schema.popularItems.$inferInsert

@Injectable()
export class PopularItemsService {
  private readonly log = logger.child({ service: 'PopularItemsService' })

  async upsertDaily(items: PopularItemInsert[]) {
    if (items.length === 0) return

    this.log.info({ count: items.length }, 'Upserting popular items.')

    await db.transaction(async (tx) => {
      // Clear old items for the date to re-rank everything
      if (items[0]?.date) {
        await tx.delete(schema.popularItems).where(eq(schema.popularItems.date, items[0].date))
      }

      const BATCH_SIZE = 250
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.popularItems).values(batch)
      }
    })
  }
}
