import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  transformToRows,
  computeCanonicalSha256,
} from '../features/market-data/lib/price-history-utils'

function loadFixture(name: string) {
  // Resolve from local fixtures dir
  const p = join(__dirname, 'fixtures', name)
  const json = readFileSync(p, 'utf-8')
  return JSON.parse(json)
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

describe('transformToRows', () => {
  it('maps all entries across order types', () => {
    const data = loadFixture('price_history_2025-08-31.json')
    const total = Object.values(data).reduce(
      (acc: number, arr: unknown) => acc + (Array.isArray(arr) ? arr.length : 0),
      0,
    )
    const rows = transformToRows(data, '2025-08-31')
    expect(rows.length).toBe(total)

    const orderTypes = new Set(rows.map((r) => r.orderType))
    expect(orderTypes.has('buy')).toBe(true)
    expect(orderTypes.has('sell')).toBe(true)
    expect(orderTypes.has('closed')).toBe(true)

    // Validate uniqueness candidate columns exist
    for (const r of rows) {
      expect(r.date).toBe('2025-08-31')
      expect(typeof r.itemName).toBe('string')
      expect(['buy', 'sell', 'closed']).toContain(r.orderType)
      expect(typeof r.modRank).toBe('number')
    }
  })
})

describe('computeCanonicalSha256', () => {
  it('is deterministic across key order and array order', () => {
    const data = loadFixture('price_history_2025-08-30.json')

    // Shuffle arrays per item
    const shuffled: Record<string, any[]> = {}
    const keys = Object.keys(data)
    // Also shuffle keys by rebuilding object in different insertion order
    const shuffledKeys = shuffle(keys)
    for (const k of shuffledKeys) {
      const arr = Array.isArray(data[k]) ? data[k] : []
      shuffled[k] = shuffle(arr)
    }

    const h1 = computeCanonicalSha256(data)
    const h2 = computeCanonicalSha256(shuffled)
    expect(h1).toBe(h2)
  })

  it('changes when entries change', () => {
    const data = loadFixture('price_history_2025-08-30.json')
    const h1 = computeCanonicalSha256(data)

    // Remove one entry
    const mutated: Record<string, any[]> = {}
    for (const [k, arr] of Object.entries(data)) {
      if (!Array.isArray(arr)) continue
      mutated[k] = arr.slice(1) // drop first entry for each key
    }

    const h2 = computeCanonicalSha256(mutated)
    expect(h1).not.toBe(h2)
  })
})
