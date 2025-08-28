import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/grofit',
})

export const db = drizzle(pool, { schema })
export * as schema from './schema'
export { desc, inArray } from 'drizzle-orm'
