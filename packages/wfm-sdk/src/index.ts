import type { CreateOrderDTO, WfmOrdersPort, MarketSnapshot } from '@grofit/core'

export class WfmMockAdapter implements WfmOrdersPort {
  private store = new Map<string, CreateOrderDTO & { id: string }>()
  private seq = 1

  async createOrder(input: CreateOrderDTO): Promise<{ remoteId: string }> {
    const id = String(this.seq++)
    this.store.set(id, { ...input, id })
    return { remoteId: id }
  }
  async updateOrder(remoteId: string, patch: Partial<CreateOrderDTO>): Promise<void> {
    const cur = this.store.get(remoteId)
    if (!cur) throw new Error('not found')
    this.store.set(remoteId, { ...cur, ...patch })
  }
  async deleteOrder(remoteId: string): Promise<void> {
    this.store.delete(remoteId)
  }
  async markSold(_remoteId: string, _payload: { qty: number; price: number }): Promise<void> {
    // no-op for mock
  }
  async reconcile(_local: any): Promise<{ diff: string[] }> {
    return { diff: [] }
  }
}

export async function getItemStats(itemId: string): Promise<MarketSnapshot | null> {
  // stubbed data
  return {
    itemId,
    ts: new Date(),
    p10: 80,
    p25: 90,
    median: 100,
    p75: 112,
    p90: 125,
    volume: 50,
  }
}
