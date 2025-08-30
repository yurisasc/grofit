import type { WarframeMarketAPI } from '../client'
import type { UserOrdersPayload, OrderDetails, OrderWithUser, OrderType } from '../types/orders'

export class Orders {
  constructor(private readonly client: WarframeMarketAPI) {}

  /** Get all orders for a specific user. */
  async getUserOrders(ingameName: string): Promise<UserOrdersPayload> {
    const response = await this.client._makeRequest('GET', `/v1/profile/${ingameName}/orders`)
    const data = await response.json()
    return data.payload
  }

  /** Get all orders for the authenticated user. */
  async getMyOrders(): Promise<UserOrdersPayload> {
    this.client._debug(
      'Orders:GetMyOrders',
      `Fetching orders for authenticated user: ${this.client.ingameName}`,
    )
    return this.getUserOrders(this.client.ingameName)
  }

  /** Create a new order. */
  async create(payload: {
    item_id: string
    order_type: OrderType
    platinum: number
    quantity: number
    visible: boolean
    mod_rank?: number
  }): Promise<OrderDetails> {
    const response = await this.client._makeRequest('POST', '/v1/profile/orders', {
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return data.payload.order
  }

  /** Delete an existing order. */
  async delete(orderId: string): Promise<any> {
    const response = await this.client._makeRequest('DELETE', `/v1/profile/orders/${orderId}`)
    const data = await response.json()
    return data.payload
  }

  /** Update an existing order. */
  async update(
    orderId: string,
    payload: { platinum: number; quantity: number; visible: boolean },
  ): Promise<OrderDetails> {
    const response = await this.client._makeRequest('PUT', `/v1/profile/orders/${orderId}`, {
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    return data.payload.order
  }

  /** Get all orders for a specific item. */
  async getByItem(itemName: string): Promise<OrderWithUser[]> {
    const response = await this.client._makeRequest('GET', `/v1/items/${itemName}/orders`)
    const data = await response.json()
    let orders: OrderWithUser[] = data.payload.orders

    // Filter for in-game users
    if (orders) {
      orders = orders.filter((order) => order?.user?.status === 'ingame')
    }

    return orders
  }
}
