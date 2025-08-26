import type { CreateOrderDTO } from '@grofit/core'

export class OrdersService {
  async createOrder(_input: CreateOrderDTO) {
    // TODO: persist via db.orders and enqueue sync job
    return { id: 'local-1' }
  }
}
