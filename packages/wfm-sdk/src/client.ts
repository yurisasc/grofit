import logger from '@grofit/logger'
import type { ApiConfig } from './types/common'
import { Items } from './modules/items'
import { Orders } from './modules/orders'
import { Auth } from './modules/auth'

export const BASE_URL = 'https://api.warframe.market'

/**
 * A client for interacting with the Warframe Market API.
 * Implements rate limiting and proper request handling.
 */
export class WarframeMarketAPI {
  private _config: Required<ApiConfig>
  private _lastRequestTime = 0
  private _headers: Record<string, string>

  public readonly items: Items
  public readonly orders: Orders
  public readonly auth: Auth

  public get ingameName(): string {
    return this._config.ingameName
  }

  constructor(config: ApiConfig) {
    this._config = {
      ingameName: '',
      jwtToken: '',
      platform: config.platform || 'pc',
      language: config.language || 'en',
      userAgent: 'WFM API Client/0.1.0',
      minRequestInterval: 1000,
      ...config,
    }

    this._headers = {
      'Content-Type': 'application/json; utf-8',
      Accept: 'application/json',
      auth_type: 'header',
      platform: this._config.platform,
      language: this._config.language,
      'User-Agent': this._config.userAgent,
    }
    if (this._config.jwtToken) {
      this._headers.Authorization = `JWT ${this._config.jwtToken}`
    }

    this.items = new Items(this)
    this.orders = new Orders(this)
    this.auth = new Auth(this)
  }

  /**
   * Update the in-game name for the client instance.
   * @param name The new in-game name.
   */
  public setIngameName(name: string): void {
    this._config.ingameName = name
    this._debug('Client:SetIngameName', 'In-game name has been updated.')
  }

  /**
   * Update the JWT for the client instance.
   * @param token The new JWT.
   */
  public setToken(token: string): void {
    this._config.jwtToken = token
    if (token) {
      this._headers.Authorization = `JWT ${token}`
      this._debug('Client:SetToken', 'JWT has been updated.')
    } else {
      delete this._headers.Authorization
      this._debug('Client:SetToken', 'JWT has been cleared.')
    }
  }

  /**
   * Ensure we don't exceed rate limits by waiting if necessary.
   */
  private async _waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this._lastRequestTime

    if (this._config.minRequestInterval && timeSinceLastRequest < this._config.minRequestInterval) {
      const delay = this._config.minRequestInterval - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this._lastRequestTime = Date.now()
  }

  /**
   * Make a request to the Warframe Market API.
   * Handles rate limiting and common error cases.
   */
  public async _makeRequest(
    method: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    await this._waitForRateLimit()

    const url = `${BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        method,
        headers: this._headers,
        ...options,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            url,
            method,
          },
          'API request failed',
        )
        // In a real implementation, we'd throw a custom error with more details
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return response
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, `API request failed: ${e.message}`)
      } else {
        logger.error(e, `An unexpected error occurred`)
      }
      throw e
    }
  }

  /**
   * Log a debug message.
   */
  public _debug(operation: string, message: string, context: Record<string, any> = {}): void {
    logger.debug({ operation, ...context }, message)
  }
}
