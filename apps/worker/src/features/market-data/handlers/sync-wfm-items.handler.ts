import { Injectable } from '@nestjs/common'
import { WarframeMarketAPI, ItemI18NV2 } from '@grofit/wfm-sdk'
import { WfmApiService } from '../../../services/wfm/wfm.service'
import logger from '@grofit/logger'
import { EventBusService } from '@grofit/event-bus'
import { ItemsService } from '../../../services/db/items'
import { ITEMS_UPSERTED_EVENT } from '@grofit/contracts'

@Injectable()
export class SyncWfmItemsHandler {
  private wfm: WarframeMarketAPI

  constructor(
    private readonly wfmService: WfmApiService,
    private readonly eventBus: EventBusService,
    private readonly itemsService: ItemsService,
  ) {
    this.wfm = this.wfmService.getInstance()
  }

  async handle() {
    const log = logger.child({ handler: 'SyncWfmItemsHandler' })
    log.info('Starting WFM items sync...')

    log.info('Fetching all items from WFM...')
    const allWfmItems = await this.wfm.items.getAll()
    log.info(`Fetched ${allWfmItems.length} items from WFM.`)

    const existingSlugSet = await this.itemsService.getAllItemSlugs()
    log.info(`Found ${existingSlugSet.size} existing items in DB.`)

    const newItems = allWfmItems.filter((item) => !existingSlugSet.has(item.slug))
    log.info(`Found ${newItems.length} new items to sync.`)

    for (const newItem of newItems) {
      try {
        const itemDetail = await this.wfm.items.get(newItem.slug)
        const { i18n, ...itemData } = itemDetail
        const defaultI18n = i18n['en']

        const itemPayload = {
          slug: itemData.slug,
          wfmId: itemData.id,
          name: defaultI18n.name,
          thumb: defaultI18n.thumb,
          maxRank: itemData.maxRank,
          rarity: itemData.rarity,
          tradingTax: itemData.tradingTax,
        }

        const i18nPayloads = Object.entries(i18n).map(([lang, i]: [string, ItemI18NV2]) => ({
          lang: lang,
          name: i.name,
          description: i.description,
          wikiLink: i.wikiLink,
          thumb: i.thumb,
          subIcon: i.subIcon,
          icon: i.icon,
        }))

        const upsertedItem = await this.itemsService.upsertItemWithI18n(itemPayload, i18nPayloads)

        await this.eventBus.publish(ITEMS_UPSERTED_EVENT, { item: upsertedItem })
      } catch (error) {
        log.error({ err: error, slug: newItem.slug }, 'Failed to sync item detail.')
      }
    }

    log.info('WFM items sync finished.')
  }
}
