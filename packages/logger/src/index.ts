import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

// In development, use pino-pretty for human-readable logs.
// In production, use structured JSON logs.
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
})

export default logger
