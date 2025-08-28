/** Basic item information returned by the API. */
export interface ItemBasic {
  id: string
  thumb: string
  item_name: string
  url_name: string
}

/** Payload containing items data. */
export interface ItemPayload {
  items: ItemBasic[]
}

/** Response structure for items endpoint. */
export interface ItemResponse {
  payload: ItemPayload
}

/** Each entry in items_in_set. */
export interface ItemInSet {
  mod_max_rank: number
  vaulted?: boolean
  id: string
  trading_tax: number
  thumb: string
  rarity: string
  url_name: string
  tags: string[]
  icon: string
  sub_icon: string | null
  en: Record<string, any>
  ru: Record<string, any>
  ko: Record<string, any>
  fr: Record<string, any>
  sv: Record<string, any>
  de: Record<string, any>
  zh_hant: Record<string, any>
  zh_hans: Record<string, any>
  pt: Record<string, any>
  es: Record<string, any>
  pl: Record<string, any>
  cs: Record<string, any>
  uk: Record<string, any>
  it: Record<string, any>
}

/** Detailed item information. */
export interface ItemDetail {
  id: string
  items_in_set: ItemInSet[]
}

/** Payload containing a single item's data. */
export interface ItemDetailPayload {
  item: ItemDetail
}

/** Response structure for item detail endpoint. */
export interface ItemDetailResponse {
  payload: ItemDetailPayload
}
