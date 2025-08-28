import { registerAs } from '@nestjs/config'

export default registerAs('worker', () => ({
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  wfmPlatform: process.env.WFM_PLATFORM || 'pc',
  liveRefreshTopN: Number.parseInt(process.env.LIVE_REFRESH_TOP_N || '50', 10),
  watchlistSlugs: (process.env.WATCHLIST_SLUGS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}))
