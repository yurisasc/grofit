import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { WarframeMarketAPI, BASE_URL } from '../client'

const mockConfig = {
  ingameName: 'TestUser',
  jwtToken: 'test-jwt',
}

global.fetch = vi.fn()

const createMockResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    status: ok ? 200 : 500,
  } as Response)
}

describe('Orders Module', () => {
  let client: WarframeMarketAPI

  beforeEach(() => {
    client = new WarframeMarketAPI(mockConfig)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should get orders for a specific item', async () => {
    const itemName = 'ash_prime_set'
    const mockOrders = {
      payload: {
        orders: [
          { id: '1', user: { status: 'ingame' } },
          { id: '2', user: { status: 'offline' } },
          { id: '3', user: { status: 'ingame' } },
        ],
      },
    }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockOrders))

    const orders = await client.orders.getByItem(itemName)

    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/items/${itemName}/orders`, expect.any(Object))
    // Should filter for 'ingame' users only
    expect(orders.length).toBe(2)
    expect(orders[0].id).toBe('1')
    expect(orders[1].id).toBe('3')
  })

  it('should get orders for a specific user', async () => {
    const ingameName = 'SomeOtherUser'
    const mockUserOrders = { payload: { sell_orders: [], buy_orders: [] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockUserOrders))

    const orders = await client.orders.getUserOrders(ingameName)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/profile/${ingameName}/orders`,
      expect.any(Object),
    )
    expect(orders).toEqual(mockUserOrders.payload)
  })

  it('should get orders for the authenticated user', async () => {
    const mockUserOrders = { payload: { sell_orders: [{ id: 'my-order-1' }], buy_orders: [] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockUserOrders))

    const orders = await client.orders.getMyOrders()

    // It should use the ingameName from the client's config
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/profile/${mockConfig.ingameName}/orders`,
      expect.any(Object),
    )
    expect(orders).toEqual(mockUserOrders.payload)
    expect(orders.sell_orders.length).toBe(1)
  })

  it('should create an order', async () => {
    const orderPayload = {
      item_id: 'item_123',
      order_type: 'sell' as const,
      platinum: 100,
      quantity: 1,
      visible: true,
    }
    const mockResponse = { payload: { order: { id: 'order_abc', ...orderPayload } } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse))

    const createdOrder = await client.orders.create(orderPayload)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/profile/orders`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(orderPayload),
      }),
    )
    expect(createdOrder.id).toBe('order_abc')
  })

  it('should delete an order', async () => {
    const orderId = 'order_xyz'
    const mockResponse = { payload: {} } // Empty payload on success
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse))

    await client.orders.delete(orderId)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/profile/orders/${orderId}`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    )
  })

  it('should update an order', async () => {
    const orderId = 'order_123'
    const updatePayload = { platinum: 150, quantity: 2, visible: false }
    const mockResponse = { payload: { order: { id: orderId, ...updatePayload } } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse))

    const updatedOrder = await client.orders.update(orderId, updatePayload)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/profile/orders/${orderId}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      }),
    )
    expect(updatedOrder.platinum).toBe(150)
  })

  it('should respect rate limiting', async () => {
    const mockOrders = { payload: { orders: [] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockOrders))

    const promise1 = client.orders.getByItem('item_123')
    const promise2 = client.orders.getByItem('item_123')

    // Manually advance timers to allow the rate-limiting `setTimeout` to resolve.
    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersToNextTimerAsync()

    await Promise.all([promise1, promise2])

    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
