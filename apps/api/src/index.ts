import { Elysia, t } from 'elysia'
import { cors } from '@elysia/cors'
import { SQL } from 'bun'
import { chemistry } from './matching'

const database = process.env.DATABASE_URL ? new SQL(process.env.DATABASE_URL) : null
const tags: Record<string, { slug: string; title: string; content: string; roomSlug: string }> = {
  demo: { slug: 'demo', title: '初见破冰', content: '欢迎来到第一次相遇。', roomSlug: 'first-meet' },
}
const dimensionsSchema = t.Record(t.String(), t.Number({ minimum: 0, maximum: 100 }))
const profileSchema = t.Object({ nickname: t.String({ minLength: 1, maxLength: 40 }), age: t.Number({ minimum: 18, maximum: 100 }), city: t.String({ minLength: 1, maxLength: 40 }), job: t.String({ minLength: 1, maxLength: 80 }), purpose: t.Union([t.Literal('恋爱'), t.Literal('朋友'), t.Literal('搭子')]), bio: t.Optional(t.String({ maxLength: 200 })), avatarUrl: t.Optional(t.String({ maxLength: 500 })) })

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
  .post('/users', async ({ body, status }) => {
    if (!database) return status(503, { error: 'database_required' })
    const [user] = await database`INSERT INTO users (nickname, age, city, job, purpose, bio, avatar_url) VALUES (${body.nickname}, ${body.age}, ${body.city}, ${body.job}, ${body.purpose}, ${body.bio ?? ''}, ${body.avatarUrl ?? ''}) RETURNING id, nickname, age, city, job, purpose, bio, avatar_url`
    return user
  }, { body: profileSchema })
  .post('/users/:id/answers', async ({ params, body, status }) => {
    if (!database) return status(503, { error: 'database_required' })
    const userId = Number(params.id)
    await database.begin(async (tx) => {
      await tx`DELETE FROM card_answers WHERE user_id = ${userId}`
      for (const answer of body.answers) await tx`INSERT INTO card_answers (user_id, card_id, option_label) VALUES (${userId}, ${answer.cardId}, ${answer.optionLabel})`
      await tx`UPDATE users SET dimensions = ${JSON.stringify(body.dimensions)}::jsonb, animal = ${JSON.stringify(body.animal)}::jsonb, tags = ${tx.array(body.tags)}::text[], deal_breakers = ${tx.array(body.dealBreakers)}::text[] WHERE id = ${userId}`
    })
    return { ok: true, userId }
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }), body: t.Object({ answers: t.Array(t.Object({ cardId: t.String(), optionLabel: t.String() })), dimensions: dimensionsSchema, animal: t.Unknown(), tags: t.Array(t.String()), dealBreakers: t.Array(t.String()) }) })
  .get('/users/:id/matches', async ({ params, status }) => {
    if (!database) return status(503, { error: 'database_required' })
    const [source] = await database`SELECT id, nickname, age, city, job, purpose, dimensions, animal, tags, deal_breakers FROM users WHERE id = ${Number(params.id)} AND dimensions IS NOT NULL`
    if (!source) return status(404, { error: 'user_not_ready' })
    const candidates = await database`SELECT id, nickname, age, city, job, purpose, dimensions, animal, tags, deal_breakers FROM users WHERE id <> ${source.id} AND purpose = ${source.purpose} AND dimensions IS NOT NULL`
    return candidates.map((candidate) => ({ user: candidate, report: chemistry(source.dimensions as Record<string, number>, candidate.dimensions as Record<string, number>, source.tags, candidate.tags) })).sort((a, b) => b.report.total - a.report.total).slice(0, 3)
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }) })
  .post('/dual-sessions', async ({ body, status }) => {
    if (!database) return status(503, { error: 'database_required' })
    const id = crypto.randomUUID()
    const [session] = await database`INSERT INTO dual_sessions (id, user_a, user_b) VALUES (${id}, ${body.userA}, ${body.userB}) RETURNING id, user_a, user_b, rounds, result`
    return session
  }, { body: t.Object({ userA: t.Number(), userB: t.Number() }) })
  .patch('/dual-sessions/:id', async ({ params, body, status }) => {
    if (!database) return status(503, { error: 'database_required' })
    const [session] = await database`UPDATE dual_sessions SET rounds = ${JSON.stringify(body.rounds)}::jsonb, result = ${JSON.stringify(body.result)}::jsonb WHERE id = ${params.id} RETURNING id, rounds, result`
    return session ?? status(404, { error: 'session_not_found' })
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ rounds: t.Array(t.Unknown()), result: t.Unknown() }) })
  .post('/ai/reading', async ({ body }) => ({ input: body.input, content: `这是玄学内容生成占位结果：${body.input}`, cached: false }), { body: t.Object({ input: t.String({ minLength: 1, maxLength: 2000 }) }) })
  .get('/rooms/:slug', ({ params, status }) => {
    const tag = Object.values(tags).find((item) => item.roomSlug === params.slug)
    return tag ? { slug: params.slug, title: tag.title, gameUrl: `${process.env.GAME_URL ?? 'http://127.0.0.1:5173'}?room=${params.slug}` } : status(404, { error: 'room_not_found' })
  }, { params: t.Object({ slug: t.String({ minLength: 1, maxLength: 100 }) }) })
  .ws('/ws', { open(ws) { ws.subscribe('lobby') }, message(ws, message) { ws.publish('lobby', JSON.stringify({ type: 'message', content: typeof message === 'string' ? message : JSON.stringify(message) })) } })
  .listen(Number(process.env.PORT ?? 3000))

console.log(`API running at ${app.server?.url}`)
