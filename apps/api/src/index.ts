import { Elysia, t } from 'elysia'
import { cors } from '@elysia/cors'
import { SQL } from 'bun'

const database = process.env.DATABASE_URL ? new SQL(process.env.DATABASE_URL) : null
const tags: Record<string, { slug: string; title: string; content: string }> = {
  demo: { slug: 'demo', title: '初见破冰', content: '欢迎来到第一次相遇。' },
}

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({ ok: true, service: 'heikesong-api' }))
  .get('/t/:slug', async ({ params, status }) => {
    if (database) {
      const rows = await database`SELECT slug, title, content FROM tags WHERE slug = ${params.slug} LIMIT 1`
      if (rows[0]) return rows[0]
    }

    const tag = tags[params.slug]
    return tag ?? status(404, { error: 'tag_not_found' })
  }, { params: t.Object({ slug: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/ai/reading', async ({ body }) => ({
    input: body.input,
    content: `这是玄学内容生成占位结果：${body.input}`,
    cached: false,
  }), { body: t.Object({ input: t.String({ minLength: 1, maxLength: 2000 }) }) })
  .ws('/ws', {
    message(ws, message) {
      ws.send(JSON.stringify({ type: 'message', content: message }))
    },
  })
  .listen(Number(process.env.PORT ?? 3000))

console.log(`API running at ${app.server?.url}`)
