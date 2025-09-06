export const ITEMS_UPSERTED_EVENT = 'events:items:upserted'

// Emitted by worker after daily relics.run history ingestion completes successfully
export const INGEST_PRICE_HISTORY_COMPLETED = 'events:ingestion:price-history:daily:completed'

// Emitted by unified analytics after all analytics are computed and stored
export const ANALYTICS_COMPLETE_UPDATED = 'analytics:complete:updated'

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

export interface AnalyticsCompleteUpdatedMessage {
  date: string
  count: number
  topRecommendations: Array<{
    itemName: string
    modRank: number
    rank: number
    score: number
    recommendation: 'BUY' | 'HOLD' | 'AVOID'
    confidence: number
    factors: object
  }>
  marketTrends: Array<{
    itemName: string
    window: '7d' | '14d' | '30d'
    trendDirection: 'bullish' | 'bearish' | 'sideways'
    trendStrength: number
    priceChange: number
    volumeChange: number
  }>
  itemPerformances: Array<{
    itemName: string
    priceChangePercent: number | null
    volumeChangePercent: number
    stabilityScore: number
    performanceRank: number
    liquidityScore: number
    volatilityScore: number
  }>
  summary: {
    buyCount: number
    holdCount: number
    avoidCount: number
    averageScore: number
  }
}

// Event type mapping for type-safe event bus
export interface EventTypes {
  [INGEST_PRICE_HISTORY_COMPLETED]: PriceHistoryIngestionMessage
  [ANALYTICS_COMPLETE_UPDATED]: AnalyticsCompleteUpdatedMessage
}

// Utility type to extract message type for a given event
export type EventMessage<T extends keyof EventTypes> = EventTypes[T]
