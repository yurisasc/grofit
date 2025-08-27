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
    statusText: ok ? 'OK' : 'Internal Server Error',
  } as Response)
}

describe('Items Module', () => {
  let client: WarframeMarketAPI

  beforeEach(() => {
    client = new WarframeMarketAPI(mockConfig)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should get all items', async () => {
    const mockItems = { payload: { items: [{ id: '1', item_name: 'Item 1' }] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockItems))

    const items = await client.items.getAll()

    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/items`, expect.any(Object))
    expect(items).toEqual(mockItems.payload.items)
    expect(items.length).toBe(1)
  })

  it('should get a specific item by name', async () => {
    const itemName = 'mirage_prime_systems'
    const mockItemDetail = { payload: { item: { id: '2', items_in_set: [] } } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockItemDetail))

    const item = await client.items.get(itemName)

    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/items/${itemName}`, expect.any(Object))
    expect(item).toEqual(mockItemDetail.payload.item)
  })

  it('should respect rate limiting', async () => {
    const mockItems = { payload: { items: [] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockItems))

    const promise1 = client.items.getAll()
    const promise2 = client.items.getAll()

    // Manually advance timers to allow the rate-limiting `setTimeout` to resolve.
    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersToNextTimerAsync()

    await Promise.all([promise1, promise2])

    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
