import { pgTable, serial, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const orderSide = pgEnum('order_side', ['buy', 'sell'])
export const orderStatus = pgEnum('order_status', ['open', 'filled', 'cancelled'])

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  kind: varchar('kind', { length: 64 }).notNull(),
  variant: varchar('variant', { length: 64 }),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').notNull(),
  side: orderSide('side').notNull(),
  price: integer('price').notNull(),
  qty: integer('qty').notNull(),
  status: orderStatus('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
