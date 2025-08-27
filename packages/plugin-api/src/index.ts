export type FeedItem = {
  id: string
  ts: string // ISO string
  source: string // plugin id, e.g. "log-watcher"
  type: string // e.g. "whisper", "notice", "trade"
  title: string
  text?: string
  severity?: 'info' | 'warn' | 'error'
  tags?: string[]
  links?: { href: string; label?: string }[]
  data?: Record<string, unknown>
}

export type EventTopic = 'feed.item' | string // allow other topics for now

export type PluginLogger = {
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

export type PluginServices = {
  // Optional services, granted by permissions at runtime
  notifier?: {
    notify: (channel: 'desktop' | 'discord', title: string, message: string) => Promise<void>
  }
  db?: unknown // readonly db handle (placeholder)
}

export type PluginCtx = {
  on: (event: EventTopic, handler: (payload: any) => void) => void
  emit: (event: EventTopic, payload: any) => void
  registerCommand: (def: {
    name: string
    schema?: any
    handler: (input: any) => Promise<any>
  }) => void
  services: PluginServices
  logger: PluginLogger
}

export type Plugin = {
  name: string
  register: (ctx: PluginCtx) => void
}
