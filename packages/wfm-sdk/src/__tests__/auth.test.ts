import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { WarframeMarketAPI, BASE_URL } from '../client'

const mockConfig = {
  ingameName: 'TestUser',
  jwtToken: 'test-jwt',
}

// Mock global fetch
global.fetch = vi.fn()

const createMockResponse = (data: any, ok = true, headers = new Headers()) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    status: ok ? 200 : 401,
    statusText: ok ? 'OK' : 'Unauthorized',
    headers,
  } as Response)
}

describe('Auth Module', () => {
  let client: WarframeMarketAPI

  beforeEach(() => {
    client = new WarframeMarketAPI(mockConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should login and return credentials', async () => {
    const email = 'test@example.com'
    const password = 'password123'
    const expectedJwt = 'a-very-secret-jwt-token'
    const expectedIngameName = 'LoggedInUser'

    const headers = new Headers()
    headers.append('Set-Cookie', `JWT=${expectedJwt}; Path=/; HttpOnly`)
    const mockResponse = {
      payload: { user: { ingame_name: expectedIngameName } },
    }

    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse, true, headers))

    const { ingameName, jwtToken } = await client.auth.login(email, password)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/auth/signin`,
      expect.objectContaining({
        body: JSON.stringify({ email, password }),
      }),
    )
    expect(ingameName).toBe(expectedIngameName)
    expect(jwtToken).toBe(expectedJwt)
  })

  it('should throw an error if JWT is not in headers', async () => {
    const mockResponse = { payload: {} }
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse))

    await expect(client.auth.login('test@test.com', 'pw')).rejects.toThrow(
      'JWT not found in response headers.',
    )
  })

  it('should throw an error if in-game name is not in response', async () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'JWT=some-token')
    const mockResponse = { payload: { user: {} } } // Missing ingame_name
    ;(fetch as Mock).mockReturnValue(createMockResponse(mockResponse, true, headers))

    await expect(client.auth.login('test@test.com', 'pw')).rejects.toThrow(
      'Could not extract in-game name from response.',
    )
  })
})
