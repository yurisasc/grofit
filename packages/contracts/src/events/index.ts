export const ITEMS_UPSERTED_EVENT = 'events:items:upserted'

// Emitted by worker after daily relics.run history ingestion completes successfully
export const INGEST_PRICE_HISTORY_COMPLETED = 'events:ingestion:price-history:daily:completed'

// Emitted by analytics after popular_items materialization is updated
export const ANALYTICS_POPULAR_UPDATED = 'analytics:popular-updated'

// Event message types
export interface PriceHistoryIngestionMessage {
  source: string
  date: string
  itemsCount: number
  entriesCount: number
  sha256: string
}

export interface PriceHistoryIngestionCompletedMessage {
  source: string
  date: string
  itemsCount: number
  entriesCount: number
  sha256: string
}

export interface AnalyticsPopularUpdatedMessage {
  date: string
  count: number
  topItems: Array<{
    itemId: number
    modRank: number
    rank: number
    score: number
    metrics: object
  }>
}

// Event type mapping for type-safe event bus
export interface EventTypes {
  [INGEST_PRICE_HISTORY_COMPLETED]: PriceHistoryIngestionMessage
  [ANALYTICS_POPULAR_UPDATED]: AnalyticsPopularUpdatedMessage
}

// Utility type to extract message type for a given event
export type EventMessage<T extends keyof EventTypes> = EventTypes[T]
