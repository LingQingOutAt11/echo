import { SQL } from 'bun'
import { fileURLToPath } from 'node:url'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const database = new SQL(databaseUrl)
await database`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
const [applied] = await database`SELECT version FROM schema_migrations WHERE version = 'v1'`
if (applied) {
  console.log('Database schema already applied (v1), skipping')
  await database.close()
  process.exit(0)
}
await database.file(fileURLToPath(new URL('./schema.sql', import.meta.url)))
await database`INSERT INTO schema_migrations (version) VALUES ('v1')`
console.log('Database schema applied (v1)')
await database.close()
