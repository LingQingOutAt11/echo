import { SQL } from 'bun'
import { fileURLToPath } from 'node:url'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const database = new SQL(databaseUrl)
await database.file(fileURLToPath(new URL('./schema.sql', import.meta.url)))
console.log('Database schema applied')
await database.close()
