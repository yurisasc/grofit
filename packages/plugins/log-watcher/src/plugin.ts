import { PluginCtx, FeedItem } from '@grofit/plugin-api'

export function register(ctx: PluginCtx) {
  ctx.logger.info('[log-watcher] plugin registered')

  // MVP: emit a periodic heartbeat to the feed until real tailing is wired
  const intervalMs = 60_000
  const timer = setInterval(() => {
    const item: FeedItem = {
      id: `logwatcher-heartbeat-${Date.now()}`,
      ts: new Date().toISOString(),
      source: 'log-watcher',
      type: 'notice',
      title: 'Log watcher heartbeat',
      severity: 'info',
      tags: ['system'],
    }
    ctx.emit('feed.item', item)
  }, intervalMs)

  // Optionally return a cleanup when framework supports lifecycle hooks
  ctx.on('plugin.shutdown', () => clearInterval(timer) as any)
}
