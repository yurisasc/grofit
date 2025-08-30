import type { WarframeMarketAPI } from '../client'

interface LoginResponse {
  ingameName: string
  jwtToken: string
}

export class Auth {
  constructor(private readonly client: WarframeMarketAPI) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client._makeRequest('POST', '/v1/auth/signin', {
      body: JSON.stringify({ email, password }),
    })

    const setCookieHeader = response.headers.get('Set-Cookie')
    if (!setCookieHeader) {
      throw new Error('JWT not found in response headers.')
    }

    const jwtMatch = setCookieHeader.match(/JWT=([^;]+)/)
    if (!jwtMatch || !jwtMatch[1]) {
      throw new Error('Could not parse JWT from Set-Cookie header.')
    }
    const jwtToken = jwtMatch[1]

    const data = await response.json()
    const ingameName = data?.payload?.user?.ingame_name

    if (!ingameName) {
      throw new Error('Could not extract in-game name from response.')
    }

    this.client.setIngameName(ingameName)
    this.client.setToken(jwtToken)

    this.client._debug('Auth:Login', `Successfully logged in as ${ingameName}. Client updated.`)
    return { ingameName, jwtToken }
  }
}
