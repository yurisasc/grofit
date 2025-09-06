/**
 * Configuration for analytics computations
 * Contains all configurable parameters used throughout the analytics system
 */
export const ANALYTICS_CONFIG = {
  POPULAR_ITEMS_HISTORY_DAYS: 30,
  DEFAULT_WEIGHTS: {
    liquidity: 0.5,
    spread: 0.3,
    volatility: 0.2,
  },
  TOP_FLIP_RECOMMENDATIONS_COUNT: 50,
} as const
