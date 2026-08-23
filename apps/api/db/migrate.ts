import { SQL } from 'bun'
import { fileURLToPath } from 'node:url'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const database = new SQL(databaseUrl)
await database`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
const [applied] = await database`SELECT version FROM schema_migrations WHERE version = 'v1'`
if (!applied) {
  await database.file(fileURLToPath(new URL('./schema.sql', import.meta.url)))
  await database`INSERT INTO schema_migrations (version) VALUES ('v1')`
  console.log('Database schema applied (v1)')
}

const [appliedV2] = await database`SELECT version FROM schema_migrations WHERE version = 'v2'`
if (!appliedV2) {
  await database`ALTER TABLE dual_sessions ADD COLUMN IF NOT EXISTS destiny JSONB`
  await database`ALTER TABLE proximity_peers ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`
  await database`ALTER TABLE proximity_peers ADD COLUMN IF NOT EXISTS dual_session_id TEXT REFERENCES dual_sessions(id) ON DELETE SET NULL`
  await database`INSERT INTO schema_migrations (version) VALUES ('v2')`
  console.log('Database schema applied (v2)')
}

const [appliedV3] = await database`SELECT version FROM schema_migrations WHERE version = 'v3'`
if (!appliedV3) {
  await database`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'female' CHECK (gender IN ('male', 'female'))`
  await database`INSERT INTO schema_migrations (version) VALUES ('v3')`
  console.log('Database schema applied (v3)')
}
await database.close()
