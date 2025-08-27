import { PluginCtx } from '@grofit/plugin-api'

export function registerSendTest(ctx: PluginCtx) {
  ctx.registerCommand({
    name: 'notifications.sendTest',
    schema: {
      type: 'object',
      properties: {
        channel: { type: 'string', enum: ['desktop', 'discord'] },
        title: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['channel', 'title', 'message'],
      additionalProperties: false,
    },
    async handler(input: { channel: 'desktop' | 'discord'; title: string; message: string }) {
      if (!ctx.services.notifier) {
        ctx.logger.warn('[notifications.sendTest] notifier service not available')
        return { ok: false }
      }
      await ctx.services.notifier.notify(input.channel, input.title, input.message)
      return { ok: true }
    },
  })
}
