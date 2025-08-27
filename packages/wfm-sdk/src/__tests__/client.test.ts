import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { WarframeMarketAPI, BASE_URL } from '../client'

const mockConfig = {
  ingameName: 'TestUser',
  jwtToken: 'initial-jwt',
}

global.fetch = vi.fn()

const createMockResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    status: ok ? 200 : 500,
  } as Response)
}

describe('WarframeMarketAPI Client', () => {
  let client: WarframeMarketAPI

  beforeEach(() => {
    client = new WarframeMarketAPI(mockConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update the auth token when setToken is called', async () => {
    const newToken = 'new-shiny-jwt'
    client.setToken(newToken)

    // Mock a request to see which headers are used
    const mockItems = { payload: { items: [] } }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockItems))

    await client.items.getAll()

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/items`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `JWT ${newToken}`,
        }),
      }),
    )
  })
})
