import { OrderSide } from '@grofit/contracts'
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgEnum,
  decimal,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'

export const relicTier = pgEnum('relic_tier', ['lith', 'meso', 'neo', 'axi', 'requiem'])

export const orderSide = pgEnum('order_side', Object.values(OrderSide) as [string, ...string[]])
export const orderStatus = pgEnum('order_status', ['open', 'filled', 'cancelled'])

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  kind: varchar('kind', { length: 64 }).notNull(),
  variant: varchar('variant', { length: 64 }),
})

export const snapshotKind = pgEnum('snapshot_kind', ['live', '48h', '90d'])

export const marketSnapshots = pgTable('market_snapshots', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  kind: snapshotKind('kind').notNull(),
  volume: integer('volume').notNull(),
  minPrice: integer('min_price').notNull(),
  maxPrice: integer('max_price').notNull(),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).notNull(),
  medianPrice: integer('median_price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

// Provisional tables for ingestion pivot (subject to change)

export const dailyItemMetrics = pgTable('daily_item_metrics', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  volume: integer('volume').notNull(),
  minPrice: integer('min_price').notNull(),
  maxPrice: integer('max_price').notNull(),
  openPrice: integer('open_price').notNull(),
  closedPrice: integer('closed_price').notNull(),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).notNull(),
  waPrice: decimal('wa_price', { precision: 10, scale: 2 }).notNull(),
  median: decimal('median', { precision: 10, scale: 2 }).notNull(),
  movingAvg: decimal('moving_avg', { precision: 10, scale: 2 }).notNull(),
  donchTop: integer('donch_top').notNull(),
  donchBot: integer('donch_bot').notNull(),
  modRank: integer('mod_rank'),
})

export const popularItems = pgTable('popular_items', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  score: decimal('score', { precision: 10, scale: 4 }).notNull(),
  rank: integer('rank').notNull(),
  metricsJson: jsonb('metrics_json'),
})

export const relics = pgTable('relics', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  tier: relicTier('tier').notNull(),
  name: varchar('name', { length: 16 }).notNull(), // e.g., A1, B2, C3
  isVaulted: boolean('is_vaulted').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const liveOrderSnapshots = pgTable('live_order_snapshots', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  platform: varchar('platform', { length: 16 }).notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  bestBuy: integer('best_buy').notNull(),
  bestSell: integer('best_sell').notNull(),
  buyCount: integer('buy_count').notNull(),
  sellCount: integer('sell_count').notNull(),
  spreadPct: decimal('spread_pct', { precision: 6, scale: 2 }).notNull(),
})
