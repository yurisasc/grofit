import type { MarketSnapshot } from '@grofit/core'

export type PricingParams = { k1?: number; k2?: number; volumeFactor?: number }

export function recommend(snapshot: MarketSnapshot, params: PricingParams = {}) {
  const { p25, median, p75, p10, p90, volume } = snapshot
  const IQR = p75 - p25
  const k1 = params.k1 ?? 0.5
  const k2 = params.k2 ?? 0.5
  const volumeFactor = params.volumeFactor ?? 1
  const buy = Math.max(p25, Math.round(median - k1 * IQR), p10)
  const sell = Math.min(p75, Math.round(median + k2 * IQR), p90)
  const spread = sell - buy
  const spreadPct = median ? spread / median : 0
  const score = spreadPct * volume * volumeFactor
  return { buy, sell, spread, spreadPct, score }
}
