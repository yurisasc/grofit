import { Injectable } from '@nestjs/common'
import logger from '@grofit/logger'
import { z } from 'zod'

const RELICS_RUN_BASE_URL = 'https://relics.run/history/price_history'

const PriceHistoryEntrySchema = z.object({
  datetime: z.string(),
  volume: z.number(),
  min_price: z.number(),
  max_price: z.number(),
  open_price: z.number().optional(),
  closed_price: z.number().optional(),
  avg_price: z.number(),
  wa_price: z.number(),
  median: z.number(),
  moving_avg: z.number().optional(),
  donch_top: z.number().optional(),
  donch_bot: z.number().optional(),
  id: z.string(),
  item_id: z.string(),
  order_type: z.string(),
  mod_rank: z.number().optional(),
  subtype: z.string().optional(),
})

const DailyHistoryDataSchema = z.record(z.string(), z.array(PriceHistoryEntrySchema))

export type PriceHistoryEntry = z.infer<typeof PriceHistoryEntrySchema>
export type DailyHistoryData = z.infer<typeof DailyHistoryDataSchema>

@Injectable()
export class RelicsRunApiService {
  private readonly log = logger.child({ service: 'RelicsRunApiService' })

  async getDailyHistory(date: string): Promise<DailyHistoryData> {
    const url = `${RELICS_RUN_BASE_URL}_${date}.json`
    this.log.info({ url }, `Fetching daily history from relics.run for date: ${date}`)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        this.log.error({ status: response.status, url }, 'Failed to fetch daily history')
        throw new Error(`Failed to fetch daily history: ${response.statusText}`)
      }
      const rawData = await response.json()
      const data = DailyHistoryDataSchema.parse(rawData)

      const totalEntries = Object.values(data).flat().length
      this.log.info({ url, totalEntries }, 'Successfully fetched daily history.')
      return data
    } catch (error) {
      this.log.error({ err: error, url }, 'Error fetching or parsing daily history')
      throw error
    }
  }
}
