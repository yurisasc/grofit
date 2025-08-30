export interface ItemI18NV2 {
  name: string
  description?: string
  wikiLink?: string
  icon: string
  thumb: string
  subIcon?: string
}

export interface ItemBasicV2 {
  id: string
  slug: string
  gameRef?: string
  tags?: string[]
  i18n: {
    [lang: string]: ItemI18NV2
  }
}

export interface ItemDetailV2 {
  id: string
  slug: string
  gameRef?: string
  tags?: string[]
  setRoot?: boolean
  setParts?: string[]
  quantityInSet?: number
  rarity?: string
  bulkTradable?: boolean
  subtypes?: string[]
  maxRank?: number
  maxCharges?: number
  maxAmberStars?: number
  maxCyanStars?: number
  baseEndo?: number
  endoMultiplier?: number
  ducats?: number
  vosfor?: number
  reqMasteryRank?: number
  vaulted?: boolean
  tradingTax?: number
  tradable?: boolean
  i18n: {
    [lang: string]: ItemI18NV2
  }
}

/** Response structure for the GET /v2/items endpoint. */
export interface ItemsV2Response {
  apiVersion: string
  data: ItemBasicV2[]
}

/** Response structure for the GET /v2/item/{slug} endpoint. */
export interface ItemV2Response {
  apiVersion: string
  data: ItemDetailV2
}

export interface ItemInSetV1 {
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
