export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'open' | 'filled' | 'cancelled'

export interface Order {
  id: string
  itemId: string
  side: OrderSide
  price: number
  qty: number
  status: OrderStatus
}

export interface CreateOrderDTO {
  itemId: string
  side: OrderSide
  price: number
  qty: number
}

export interface WfmOrdersPort {
  createOrder(input: CreateOrderDTO): Promise<{ remoteId: string }>
  updateOrder(remoteId: string, patch: Partial<CreateOrderDTO>): Promise<void>
  deleteOrder(remoteId: string): Promise<void>
  markSold(remoteId: string, payload: { qty: number; price: number }): Promise<void>
  reconcile(local: Order): Promise<{ diff: string[] }>
}

export type MarketSnapshot = {
  itemId: string
  ts: Date
  p10: number
  p25: number
  median: number
  p75: number
  p90: number
  volume: number
}
