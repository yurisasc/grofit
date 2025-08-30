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
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const relicTier = pgEnum('relic_tier', ['lith', 'meso', 'neo', 'axi', 'requiem'])

export const orderSide = pgEnum('order_side', Object.values(OrderSide) as [string, ...string[]])
export const orderStatus = pgEnum('order_status', ['open', 'filled', 'cancelled'])

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    wfmId: varchar('wfm_id', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull().unique(),
    thumb: varchar('thumb', { length: 128 }).notNull(),
    gameRef: varchar('game_ref', { length: 128 }),
    rarity: varchar('rarity', { length: 32 }),
    bulkTradable: boolean('bulk_tradable'),
    vaulted: boolean('vaulted'),
    tradable: boolean('tradable'),
    tradingTax: integer('trading_tax'),
    reqMasteryRank: integer('req_mastery_rank'),
    maxRank: integer('max_rank'),
    maxCharges: integer('max_charges'),
    maxAmberStars: integer('max_amber_stars'),
    maxCyanStars: integer('max_cyan_stars'),
    baseEndo: integer('base_endo'),
    endoMultiplier: integer('endo_multiplier'),
    ducats: integer('ducats'),
    vosfor: integer('vosfor'),
    tags: jsonb('tags'), // string[]
    subtypes: jsonb('subtypes'), // string[]
    setRoot: boolean('set_root'),
    setParts: jsonb('set_parts'), // string[]
    quantityInSet: integer('quantity_in_set'),
  },
  (table) => [uniqueIndex('slug_idx').on(table.slug)],
)

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

export const itemI18n = pgTable('item_i18n', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id),
  lang: varchar('lang', { length: 16 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description'),
  wikiLink: varchar('wiki_link', { length: 256 }),
  icon: varchar('icon', { length: 128 }),
  thumb: varchar('thumb', { length: 128 }),
  subIcon: varchar('sub_icon', { length: 128 }),
})

export const ingestionRuns = pgTable('ingestion_runs', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 64 }).notNull(),
  identifier: varchar('identifier', { length: 128 }).notNull(), // e.g., date for daily, job ID for specific
  status: varchar('status', { length: 32 }).notNull(), // e.g., 'running', 'completed', 'failed'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata'),
})
