import { db, schema } from '@grofit/db'
import { Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'

export type PriceHistoryRawInsert = typeof schema.priceHistoryRaw.$inferInsert

@Injectable()
export class PriceHistoryRawService {
  async upsert(params: {
    date: string
    sha256: string
    payload: any
    itemsCount: number
    entriesCount: number
  }) {
    const { date, sha256, payload, itemsCount, entriesCount } = params
    await db
      .insert(schema.priceHistoryRaw)
      .values({
        date,
        sha256,
        payload,
        itemsCount,
        entriesCount,
      } as unknown as PriceHistoryRawInsert)
      .onConflictDoUpdate({
        target: schema.priceHistoryRaw.date,
        set: {
          sha256: sql`excluded.sha256`,
          payload: sql`excluded.payload`,
          itemsCount: sql`excluded.items_count`,
          entriesCount: sql`excluded.entries_count`,
        },
      })
  }
}
