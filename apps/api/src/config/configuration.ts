import { registerAs } from '@nestjs/config'

export default registerAs('worker', () => ({
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
}))
