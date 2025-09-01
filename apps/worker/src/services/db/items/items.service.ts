import { Injectable } from '@nestjs/common'
import { db, schema } from '@grofit/db'
import { eq } from 'drizzle-orm'
import logger from '@grofit/logger'

const log = logger.child({ service: 'ItemsService' })

type ItemPayload = typeof schema.items.$inferInsert
type ItemI18nPayload = Omit<typeof schema.itemI18n.$inferInsert, 'itemId'>
type Item = typeof schema.items.$inferSelect

@Injectable()
export class ItemsService {
  async upsertItemWithI18n(
    itemPayload: ItemPayload,
    i18nPayloads: ItemI18nPayload[],
  ): Promise<Item> {
    return db.transaction(async (tx) => {
      const [upsertedItem] = await tx
        .insert(schema.items)
        .values(itemPayload)
        .onConflictDoUpdate({ target: schema.items.slug, set: itemPayload })
        .returning()

      log.info({ itemId: upsertedItem.id }, 'Upserted item.')

      await tx.delete(schema.itemI18n).where(eq(schema.itemI18n.itemId, upsertedItem.id))

      if (i18nPayloads.length > 0) {
        const fullI18nPayloads = i18nPayloads.map((p) => ({
          ...p,
          itemId: upsertedItem.id,
        }))
        await tx.insert(schema.itemI18n).values(fullI18nPayloads)
        log.info(`Inserted ${fullI18nPayloads.length} i18n entries.`)
      }

      return upsertedItem
    })
  }

  async getAllItemSlugs(): Promise<Set<string>> {
    const allItems = await db.select({ slug: schema.items.slug }).from(schema.items)
    return new Set(allItems.map((i) => i.slug))
  }
}
