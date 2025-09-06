import { OrderSide } from '@grofit/contracts'
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  date,
  pgEnum,
  decimal,
  jsonb,
  boolean,
  text,
  uniqueIndex,
  index,
  doublePrecision,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const relicTier = pgEnum('relic_tier', ['lith', 'meso', 'neo', 'axi', 'requiem'])

export const orderSide = pgEnum('order_side', Object.values(OrderSide) as [string, ...string[]])
export const orderStatus = pgEnum('order_status', ['open', 'filled', 'cancelled'])
export const priceOrderType = pgEnum('price_order_type', ['buy', 'sell', 'closed'])

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    wfmId: varchar('wfm_id', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull().unique(),
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
  (table) => [uniqueIndex('slug_idx').on(table.slug), uniqueIndex('name_idx').on(table.name)],
)

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

export const popularItems = pgTable(
  'popular_items',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    itemName: varchar('item_name', { length: 128 }).notNull(),
    modRank: integer('mod_rank').notNull().default(-1),
    score: decimal('score', { precision: 10, scale: 4 }).notNull(),
    rank: integer('rank').notNull(),
    metricsJson: jsonb('metrics_json'),
  },
  (table) => [
    uniqueIndex('popular_items_date_item_mod_rank_idx').on(
      table.date,
      table.itemName,
      table.modRank,
    ),
    index('popular_items_rank_idx').on(table.rank),
  ],
)

// Raw snapshot of the provider's daily price history (as-is JSON)
export const priceHistoryRaw = pgTable(
  'price_history_raw',
  {
    date: date('date').primaryKey().notNull(),
    sha256: varchar('sha256', { length: 128 }).notNull().unique(),
    payload: jsonb('payload').notNull(),
    itemsCount: integer('items_count'),
    entriesCount: integer('entries_count'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // Keep an additional index on date for scans (PK already covers it)
    index('price_history_raw_date_idx').on(table.date),
  ],
)

// Normalized per-entry rows for analytics-friendly querying
export const priceHistoryEntries = pgTable(
  'price_history_entries',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    datetime: timestamp('datetime', { withTimezone: true }).notNull(),
    itemName: varchar('item_name', { length: 128 }).notNull(),
    orderType: priceOrderType('order_type').notNull(),
    modRank: integer('mod_rank').notNull().default(-1),
    volume: integer('volume'),
    minPrice: integer('min_price'),
    maxPrice: integer('max_price'),
    openPrice: integer('open_price'),
    closedPrice: integer('closed_price'),
    avgPrice: doublePrecision('avg_price'),
    waPrice: doublePrecision('wa_price'),
    median: doublePrecision('median'),
    movingAvg: doublePrecision('moving_avg'),
    donchTop: integer('donch_top'),
    donchBot: integer('donch_bot'),

    entryId: text('entry_id'), // provider row id (as-is)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // Uniqueness per actual entry (includes datetime)
    uniqueIndex('price_history_entries_unique_idx').on(
      table.date,
      table.datetime,
      table.itemName,
      table.orderType,
      table.modRank,
    ),
    index('price_history_entries_date_idx').on(table.date),
    index('price_history_entries_item_date_idx').on(table.itemName, table.date),
    index('price_history_entries_order_type_date_idx').on(table.orderType, table.date),
    // Case-insensitive item lookups (lower(item_name))
    index('price_history_entries_lower_item_idx').on(sql`lower(${table.itemName})`),
  ],
)

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

export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: serial('id').primaryKey(),
    source: varchar('source', { length: 64 }).notNull(),
    identifier: varchar('identifier', { length: 128 }).notNull(), // e.g., date for daily, job ID for specific
    status: varchar('status', { length: 32 }).notNull(), // e.g., 'running', 'completed', 'failed'
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    metadata: jsonb('metadata'),
    sha256: varchar('sha256', { length: 128 }),
  },
  (table) => [
    uniqueIndex('ingestion_runs_source_identifier_idx').on(table.source, table.identifier),
    index('ingestion_runs_sha256_idx').on(table.sha256),
  ],
)
