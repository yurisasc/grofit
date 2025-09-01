import { db, schema } from '@grofit/db'
import { Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import logger from '@grofit/logger'
import { transformToRows } from '../../../features/market-data/lib/price-history-utils'

export type PriceHistoryEntryInsert = typeof schema.priceHistoryEntries.$inferInsert

@Injectable()
export class PriceHistoryEntriesService {
  private readonly log = logger.child({ service: 'PriceHistoryEntriesService' })

  transform(data: any, date: string): PriceHistoryEntryInsert[] {
    const rows = transformToRows(data, date)
    return rows as unknown as PriceHistoryEntryInsert[]
  }

  async upsert(entries: PriceHistoryEntryInsert[]) {
    if (entries.length === 0) return

    // Deduplicate by unique key: date|datetime|item|orderType|modRank
    const uniq = new Map<string, PriceHistoryEntryInsert>()
    for (const e of entries) {
      const dtIso =
        typeof (e as any).datetime === 'string'
          ? (e as any).datetime
          : ((e as any).datetime?.toISOString?.() ?? '')
      const key = `${(e as any).date}|${dtIso}|${(e as any).itemName}|${(e as any).orderType}|${(e as any).modRank}`
      uniq.set(key, e)
    }
    const rows = Array.from(uniq.values())

    const BATCH_SIZE = 500
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      this.log.info(
        { count: batch.length, from: i, to: i + batch.length },
        'Upserting price_history_entries batch.',
      )
      await db
        .insert(schema.priceHistoryEntries)
        .values(batch as any)
        .onConflictDoUpdate({
          target: [
            schema.priceHistoryEntries.date,
            schema.priceHistoryEntries.datetime,
            schema.priceHistoryEntries.itemName,
            schema.priceHistoryEntries.orderType,
            schema.priceHistoryEntries.modRank,
          ],
          set: {
            datetime: sql`excluded.datetime`,
            volume: sql`excluded.volume`,
            minPrice: sql`excluded.min_price`,
            maxPrice: sql`excluded.max_price`,
            openPrice: sql`excluded.open_price`,
            closedPrice: sql`excluded.closed_price`,
            avgPrice: sql`excluded.avg_price::double precision`,
            waPrice: sql`excluded.wa_price::double precision`,
            median: sql`excluded.median::double precision`,
            movingAvg: sql`excluded.moving_avg::double precision`,
            donchTop: sql`excluded.donch_top`,
            donchBot: sql`excluded.donch_bot`,
            entryId: sql`excluded.entry_id`,
          },
        })
    }
  }
}
