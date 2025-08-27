import { PluginCtx, FeedItem } from '@grofit/plugin-api'
import { registerSendTest } from './commands/sendTest'

export function register(ctx: PluginCtx) {
  ctx.logger.info('[notifier] plugin registered')

  // Register commands
  registerSendTest(ctx)

  // Listen to normalized feed items and forward to channels
  ctx.on('feed.item', async (item: FeedItem) => {
    // Simple gating: muted handled via future settings; for now always forward
    const title = item.title || `${item.type} from ${item.source}`
    const message = item.text || JSON.stringify(item.data || {})

    // Prefer using provided service if available; otherwise noop
    if (ctx.services.notifier) {
      // Desktop (if enabled in settings later)
      await ctx.services.notifier.notify('desktop', title, message)
      // Discord (if configured later)
      await ctx.services.notifier.notify('discord', title, message)
    } else {
      ctx.logger.info('[notifier] (no services.notifier) would send:', title)
    }
  })
}
