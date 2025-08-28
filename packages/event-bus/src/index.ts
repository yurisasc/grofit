export * from './event-bus.module'
export * from './event-bus.service'
export * from './event-bus.constants'

export const channels = {
  ingestion: 'events:ingestion',
  pricing: 'events:pricing',
}
