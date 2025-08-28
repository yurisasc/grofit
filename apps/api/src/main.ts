import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import logger from '@grofit/logger'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())
  await app.listen(4000, '0.0.0.0')
  logger.info('API listening on http://localhost:4000')
}

bootstrap()
