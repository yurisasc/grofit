import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import logger from '@grofit/logger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  app.enableShutdownHooks()

  logger.info('[Worker] Standalone application started.')
}

bootstrap().catch((err) => {
  logger.error(err, '[Worker] Standalone application failed to start')
  process.exit(1)
})
