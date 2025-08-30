import type { WarframeMarketAPI } from '../client'
import type { ItemBasicV2, ItemDetailV2, ItemsV2Response, ItemV2Response } from '../types/items'

export class Items {
  constructor(private readonly client: WarframeMarketAPI) {}

  /** Get all items from Warframe Market. */
  async getAll(): Promise<ItemBasicV2[]> {
    const response = await this.client._makeRequest('GET', '/v2/items')
    const data: ItemsV2Response = await response.json()
    const items = data.data
    this.client._debug('Item:GetAll', `Fetched ${items.length} items.`)
    return items
  }

  /** Get details for a specific item. */
  async get(itemSlug: string): Promise<ItemDetailV2> {
    const response = await this.client._makeRequest('GET', `/v2/item/${itemSlug}`)
    const data: ItemV2Response = await response.json()
    const item = data.data
    this.client._debug('Item:Get', `Fetched item: ${itemSlug}`)
    return item
  }
}
