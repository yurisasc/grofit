import type { WarframeMarketAPI } from '../client'
import type { ItemBasic, ItemDetail } from '../types/items'

export class Items {
  constructor(private readonly client: WarframeMarketAPI) {}

  /** Get all items from Warframe Market. */
  async getAll(): Promise<ItemBasic[]> {
    const response = await this.client._makeRequest('GET', '/items')
    const data = await response.json()
    const items = data.payload.items
    this.client._debug('Item:GetAll', `Fetched ${items.length} items.`, { count: items.length })
    return items
  }

  /** Get details for a specific item. */
  async get(itemName: string): Promise<ItemDetail> {
    const response = await this.client._makeRequest('GET', `/items/${itemName}`)
    const data = await response.json()
    const item = data.payload.item
    this.client._debug('Item:Get', `Fetched item: ${itemName}`, { itemName })
    return item
  }
}
