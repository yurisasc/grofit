import { createHash } from 'crypto'

export interface NormalizedPriceHistoryRow {
  date: string
  datetime: Date
  itemName: string
  orderType: 'buy' | 'sell' | 'closed'
  modRank: number
  volume: number | null
  minPrice: number | null
  maxPrice: number | null
  openPrice: number | null
  closedPrice: number | null
  avgPrice: number | null
  waPrice: number | null
  median: number | null
  movingAvg: number | null
  donchTop: number | null
  donchBot: number | null
  entryId: string | null
}

export function transformToRows(data: any, date: string): NormalizedPriceHistoryRow[] {
  const toIntOrNull = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
    if (typeof v === 'string') {
      const t = v.trim()
      if (t === '') return null
      const n = Number(t)
      return Number.isFinite(n) ? Math.trunc(n) : null
    }
    return null
  }

  const toFloatOrNull = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const t = v.trim()
      if (t === '') return null
      const n = Number(t)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid data: received ${data === null ? 'null' : typeof data}`)
  }

  const entries = Object.entries(data) as [string, any[]][]
  if (entries.length === 0) return []

  const rows: NormalizedPriceHistoryRow[] = []
  for (const [itemName, history] of entries) {
    if (!Array.isArray(history)) continue
    for (const h of history) {
      if (!h) continue
      const orderType = h.order_type as 'buy' | 'sell' | 'closed'
      if (!orderType || (orderType !== 'buy' && orderType !== 'sell' && orderType !== 'closed'))
        continue

      const dtRaw = h.datetime ?? `${date}T00:00:00.000Z`
      const dt = new Date(String(dtRaw))
      rows.push({
        date,
        datetime: isNaN(dt.getTime()) ? new Date(`${date}T00:00:00.000Z`) : dt,
        itemName,
        orderType,
        modRank: typeof h.mod_rank === 'number' ? h.mod_rank : (toIntOrNull(h.mod_rank) ?? -1),
        volume: toIntOrNull(h.volume),
        minPrice: toIntOrNull(h.min_price),
        maxPrice: toIntOrNull(h.max_price),
        openPrice: toIntOrNull(h.open_price),
        closedPrice: toIntOrNull(h.closed_price),
        avgPrice: toFloatOrNull(h.avg_price),
        waPrice: toFloatOrNull(h.wa_price),
        median: toFloatOrNull(h.median),
        movingAvg: toFloatOrNull(h.moving_avg),
        donchTop: toIntOrNull(h.donch_top),
        donchBot: toIntOrNull(h.donch_bot),
        entryId: h.id ? String(h.id) : null,
      })
    }
  }

  return rows
}

export function computeCanonicalSha256(data: Record<string, any[]>): string {
  const sideOrder = { buy: 0, sell: 1, closed: 2 } as const
  const flattened: Array<{
    itemName: string
    orderType: string
    modRank: number
    datetime: string
    volume: number | null
    min_price: number | null
    max_price: number | null
    open_price: number | null
    closed_price: number | null
    avg_price: number | null
    wa_price: number | null
    median: number | null
    moving_avg: number | null
    donch_top: number | null
    donch_bot: number | null
    entry_id: string | null
  }> = []

  for (const [itemName, arr] of Object.entries(data)) {
    if (!Array.isArray(arr)) continue
    for (const h of arr) {
      if (!h || !h.order_type) continue
      const orderType = String(h.order_type)
      if (!(orderType in sideOrder)) continue
      flattened.push({
        itemName,
        orderType,
        modRank: h.mod_rank ?? -1,
        datetime: String(h.datetime),
        volume: typeof h.volume === 'number' ? h.volume : null,
        min_price: typeof h.min_price === 'number' ? h.min_price : null,
        max_price: typeof h.max_price === 'number' ? h.max_price : null,
        open_price: typeof h.open_price === 'number' ? h.open_price : null,
        closed_price: typeof h.closed_price === 'number' ? h.closed_price : null,
        avg_price: typeof h.avg_price === 'number' ? h.avg_price : null,
        wa_price: typeof h.wa_price === 'number' ? h.wa_price : null,
        median: typeof h.median === 'number' ? h.median : null,
        moving_avg: typeof h.moving_avg === 'number' ? h.moving_avg : null,
        donch_top: typeof h.donch_top === 'number' ? h.donch_top : null,
        donch_bot: typeof h.donch_bot === 'number' ? h.donch_bot : null,
        entry_id: h.id ? String(h.id) : null,
      })
    }
  }

  flattened.sort((a, b) => {
    const an = a.itemName.toLowerCase()
    const bn = b.itemName.toLowerCase()
    if (an !== bn) return an < bn ? -1 : 1
    const sideOrderMap: Record<string, number> = { buy: 0, sell: 1, closed: 2 }
    const ao = sideOrderMap[a.orderType] ?? 99
    const bo = sideOrderMap[b.orderType] ?? 99
    if (ao !== bo) return ao - bo
    if (a.modRank !== b.modRank) return a.modRank - b.modRank
    if (a.datetime !== b.datetime) return a.datetime < b.datetime ? -1 : 1
    if (a.entry_id !== b.entry_id) return (a.entry_id ?? '') < (b.entry_id ?? '') ? -1 : 1
    return 0
  })

  const json = JSON.stringify(flattened)
  return createHash('sha256').update(json).digest('hex')
}
