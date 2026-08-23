import { Elysia, t } from 'elysia'
import { cors } from '@elysia/cors'
import { SQL } from 'bun'
import { chemistry } from './matching'

type Dimensions = Record<string, number>
type ChemistryReport = { total: number; complements: string[] }
type Game = { id: 'constellation' | 'bridge' | 'relay' | 'treasure'; name: string; reason: string; mechanic: string; goal: string }
type StoredUser = { id: number; username?: string; nickname: string; age: number; birth_datetime?: string; zodiac?: string; mbti?: string; city: string; job: string; purpose: string; bio: string; dimensions?: Dimensions; animal?: { id?: string; emoji?: string; name?: string; title?: string; tagline?: string; image?: string }; tags: string[]; deal_breakers: string[] }
type StoredSession = { id: string; user_a: number; user_b: number; game: Game; rounds: unknown[]; result: unknown; status: string; created_at?: string }
type StoredCard = { id: string; title: string; content: string; owner_id: number | null; claimed_at: string | null; transferred_at: string | null; former_owner_ids: number[] }
type StoredAccount = { id: number; user_id: number; username: string; password_hash: string }
type StoredMessage = { id: number; sender_id: number; receiver_id: number; content: string; created_at: string }

const database = process.env.DATABASE_URL ? new SQL(process.env.DATABASE_URL) : null
const memoryUsers = new Map<number, StoredUser>()
const memoryAccounts = new Map<number, StoredAccount>()
const memoryTokens = new Map<string, { accountId: number; expiresAt: number }>()
const memorySessions = new Map<string, StoredSession>()
const memoryMessages = new Map<number, StoredMessage>()
type ProximityPeer = { deviceId: string; lastSeen: number; sessionId?: string }
type ProximitySession = { id: string; devices: string[]; game: Game; createdAt: string }
const memoryProximityPeers = new Map<string, ProximityPeer>()
const memoryProximitySessions = new Map<string, ProximitySession>()
const proximityGame: Game = { id: 'treasure', name: '隐藏卡寻宝', reason: '两台手机已经靠近，直接开始一场短合作。', mechanic: '双方在画布上协作找到三个宝箱。', goal: '找到 3 个宝箱后完成破冰。' }
let nextUserId = 1
let nextAccountId = 1
let nextMessageId = 1

const AUTH_TTL_MS = 30 * 24 * 60 * 60 * 1000

const tags: Record<string, { slug: string; title: string; content: string; roomSlug: string }> = { demo: { slug: 'demo', title: '初见破冰', content: '欢迎来到第一次相遇。', roomSlug: 'first-meet' } }
const ZODIACS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'] as const
const MBTIS = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] as const
const ageFromBirth = (birth: string) => {
  const date = new Date(birth)
  if (Number.isNaN(date.getTime())) return 25
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDay = (d: Date) => d.getMonth() * 100 + d.getDate()
  if (monthDay(now) < monthDay(date)) age -= 1
  return Math.max(18, Math.min(100, age))
}
const dimensionsSchema = t.Record(t.String(), t.Number({ minimum: 0, maximum: 100 }))
const profileSchema = t.Object({ nickname: t.String({ minLength: 1, maxLength: 40 }), birth_datetime: t.String({ minLength: 10, maxLength: 40 }), zodiac: t.Union(ZODIACS.map((item) => t.Literal(item))), mbti: t.Union(MBTIS.map((item) => t.Literal(item))), city: t.String({ minLength: 1, maxLength: 40 }), job: t.String({ minLength: 1, maxLength: 80 }), purpose: t.Union([t.Literal('恋爱'), t.Literal('朋友'), t.Literal('搭子')]), bio: t.Optional(t.String({ maxLength: 200 })), avatarUrl: t.Optional(t.String({ maxLength: 500 })) })
const credentialsSchema = t.Object({ username: t.String({ minLength: 2, maxLength: 40, pattern: '^\\S+$' }), password: t.String({ minLength: 6, maxLength: 100 }) })
const registerSchema = t.Intersect([credentialsSchema, profileSchema])


const selectGame = (a: Dimensions, b: Dimensions, report: ChemistryReport): Game => {
  const socialContrast = Math.abs((a.social_battery ?? 50) - (b.social_battery ?? 50))
  const planningContrast = Math.abs((a.planning ?? 50) - (b.planning ?? 50)) + Math.abs((a.spontaneity ?? 50) - (b.spontaneity ?? 50))
  if (socialContrast >= 30) return { id: 'constellation', name: '共同点亮星图', reason: '你们的社交节奏差异明显，适合用两颗星一起找到同一片天空。', mechanic: '双方分别移动自己的光标，合并触碰同色星点。', goal: '在 60 秒内共同点亮 8 颗星星。' }
  if (planningContrast >= 70) return { id: 'bridge', name: '搭桥回家', reason: '你们的计划与随性互补，适合一起搭出一条能走通的路。', mechanic: '双方轮流放置桥板，让小动物走到终点。', goal: '共同放置 6 块桥板并抵达终点。' }
  if (report.complements.length) return { id: 'relay', name: '默契接力', reason: '你们在主动与边界上有互补，适合用接力把节奏交给彼此。', mechanic: '一方收集光点，另一方负责开启下一段路线。', goal: '接力收集 10 个光点，不让能量归零。' }
  return { id: 'treasure', name: '隐藏卡寻宝', reason: '你们的匹配节奏轻松，适合用 NFC 隐藏卡开启一场短途寻宝。', mechanic: '读取隐藏卡后，双方在地图上协作找出三个宝箱。', goal: '找到 3 个宝箱并把隐藏卡送给对方。' }
}

const userRecord = (user: StoredUser) => ({ id: user.id, nickname: user.nickname, age: user.age, birth_datetime: user.birth_datetime, zodiac: user.zodiac, mbti: user.mbti, city: user.city, job: user.job, purpose: user.purpose, bio: user.bio, dimensions: user.dimensions, tags: user.tags, deal_breakers: user.deal_breakers, animal: user.animal })
const reportFor = (a: StoredUser, b: StoredUser) => chemistry(a.dimensions as Dimensions, b.dimensions as Dimensions, a.tags, b.tags, a.deal_breakers, b.deal_breakers, a.animal, b.animal)

const hashPassword = async (password: string) => Buffer.from(await Bun.password.hash(password, { algorithm: 'argon2id' })).toString('base64')
const verifyPassword = async (password: string, encoded: string) => Bun.password.verify(password, Buffer.from(encoded, 'base64').toString())
const tokenFor = (accountId: number) => crypto.randomUUID() + crypto.randomUUID().replaceAll('-', '')
const bearerToken = (headers: Record<string, string | undefined>) => headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
const memoryAccountForToken = (headers: Record<string, string | undefined>) => {
  const token = bearerToken(headers)
  const session = token ? memoryTokens.get(token) : undefined
  if (!session || session.expiresAt < Date.now()) return undefined
  return memoryAccounts.get(session.accountId)
}
const findUser = async (userId: number) => {
  if (database) {
    const [user] = await database`SELECT id, nickname, age, birth_datetime, zodiac, mbti, city, job, purpose, bio, dimensions, animal, tags, deal_breakers FROM users WHERE id = ${userId}`
    return user as StoredUser | undefined
  }
  return memoryUsers.get(userId)
}
const userIdFromAuth = async (headers: Record<string, string | undefined>) => {
  if (database) {
    const token = bearerToken(headers)
    if (!token) return undefined
    const [session] = await database`SELECT user_id FROM auth_sessions WHERE token = ${token} AND expires_at > NOW()`
    return session?.user_id as number | undefined
  }
  return memoryAccountForToken(headers)?.user_id
}
const requireOwner = async (headers: Record<string, string | undefined>, requestedId: number) => (await userIdFromAuth(headers)) === requestedId

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({ ok: true, service: 'echo-api', storage: database ? 'postgres' : 'memory' }))
  .post('/auth/register', async ({ body, status }) => {
    const username = body.username.trim().toLowerCase()
    const passwordHash = await hashPassword(body.password)
    const expiresAt = new Date(Date.now() + AUTH_TTL_MS)
    if (database) {
      const [existing] = await database`SELECT id FROM auth_accounts WHERE username = ${username}`
      if (existing) return status(409, { error: 'username_taken' })
      const created = await database.begin(async (tx) => {
        const [user] = await tx`INSERT INTO users (nickname, age, birth_datetime, zodiac, mbti, city, job, purpose, bio, avatar_url) VALUES (${body.nickname}, ${ageFromBirth(body.birth_datetime)}, ${body.birth_datetime}, ${body.zodiac}, ${body.mbti}, ${body.city}, ${body.job}, ${body.purpose}, ${body.bio ?? ''}, ${body.avatarUrl ?? ''}) RETURNING id, nickname, age, birth_datetime, zodiac, mbti, city, job, purpose, bio, dimensions, animal, tags, deal_breakers`
        const [account] = await tx`INSERT INTO auth_accounts (user_id, username, password_hash) VALUES (${user.id}, ${username}, ${passwordHash}) RETURNING id, username, user_id`
        const token = tokenFor(Number(account.id))
        await tx`INSERT INTO auth_sessions (token, user_id, account_id, expires_at) VALUES (${token}, ${user.id}, ${account.id}, ${expiresAt})`
        return { token, account, user }
      })
      return { token: created.token, username, user: userRecord(created.user as StoredUser) }
    }
    if ([...memoryAccounts.values()].some((account) => account.username === username)) return status(409, { error: 'username_taken' })
    const user: StoredUser = { id: nextUserId++, nickname: body.nickname, age: ageFromBirth(body.birth_datetime), birth_datetime: body.birth_datetime, zodiac: body.zodiac, mbti: body.mbti, city: body.city, job: body.job, purpose: body.purpose, bio: body.bio ?? '', tags: [], deal_breakers: [] }
    const account: StoredAccount = { id: nextAccountId++, user_id: user.id, username, password_hash: passwordHash }
    const token = tokenFor(account.id)
    memoryUsers.set(user.id, user)
    memoryAccounts.set(account.id, account)
    memoryTokens.set(token, { accountId: account.id, expiresAt: expiresAt.getTime() })
    return { token, username, user: userRecord(user) }
  }, { body: registerSchema })
  .post('/auth/login', async ({ body, status }) => {
    const username = body.username.trim().toLowerCase()
    const expiresAt = new Date(Date.now() + AUTH_TTL_MS)
    if (database) {
      const [account] = await database`SELECT a.id, a.user_id, a.username, a.password_hash, u.id AS uid, u.nickname, u.age, u.birth_datetime, u.zodiac, u.mbti, u.city, u.job, u.purpose, u.bio, u.dimensions, u.animal, u.tags, u.deal_breakers FROM auth_accounts a JOIN users u ON u.id = a.user_id WHERE a.username = ${username}`
      if (!account || !(await verifyPassword(body.password, account.password_hash))) return status(401, { error: 'invalid_credentials' })
      const token = tokenFor(Number(account.id))
      await database`INSERT INTO auth_sessions (token, user_id, account_id, expires_at) VALUES (${token}, ${account.user_id}, ${account.id}, ${expiresAt})`
      const user = { id: Number(account.uid), nickname: account.nickname, age: account.age, birth_datetime: account.birth_datetime, zodiac: account.zodiac, mbti: account.mbti, city: account.city, job: account.job, purpose: account.purpose, bio: account.bio, dimensions: account.dimensions, animal: account.animal, tags: account.tags ?? [], deal_breakers: account.deal_breakers ?? [] } as StoredUser
      return { token, username, user: userRecord(user) }
    }
    const account = [...memoryAccounts.values()].find((item) => item.username === username)
    if (!account || !(await verifyPassword(body.password, account.password_hash))) return status(401, { error: 'invalid_credentials' })
    const user = memoryUsers.get(account.user_id)
    if (!user) return status(401, { error: 'invalid_credentials' })
    const token = tokenFor(account.id)
    memoryTokens.set(token, { accountId: account.id, expiresAt: expiresAt.getTime() })
    return { token, username, user: userRecord(user) }
  }, { body: credentialsSchema })
  .get('/auth/me', async ({ headers, status }) => {
    const userId = await userIdFromAuth(headers)
    if (!userId) return status(401, { error: 'unauthorized' })
    const user = await findUser(userId)
    if (!user) return status(401, { error: 'unauthorized' })
    if (database) {
      const [account] = await database`SELECT username FROM auth_accounts WHERE user_id = ${userId}`
      return { username: account?.username ?? '', user: userRecord(user) }
    }
    const account = [...memoryAccounts.values()].find((item) => item.user_id === userId)
    return { username: account?.username ?? '', user: userRecord(user) }
  })
  .post('/auth/logout', async ({ headers }) => {
    const token = bearerToken(headers)
    if (token && database) await database`DELETE FROM auth_sessions WHERE token = ${token}`
    if (token) memoryTokens.delete(token)
    return { ok: true }
  })
  .get('/t/:slug', async ({ params, status }) => {
    if (database) {
      const rows = await database`SELECT slug, title, content FROM tags WHERE slug = ${params.slug} LIMIT 1`
      if (rows[0]) return rows[0]
    }
    const tag = tags[params.slug]
    return tag ?? status(404, { error: 'tag_not_found' })
  }, { params: t.Object({ slug: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/users', async ({ body, headers, status }) => {
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId) return status(401, { error: 'unauthorized' })
    if (database) {
      const [user] = await database`UPDATE users SET nickname = ${body.nickname}, age = ${ageFromBirth(body.birth_datetime)}, birth_datetime = ${body.birth_datetime}, zodiac = ${body.zodiac}, mbti = ${body.mbti}, city = ${body.city}, job = ${body.job}, purpose = ${body.purpose}, bio = ${body.bio ?? ''}, avatar_url = ${body.avatarUrl ?? ''} WHERE id = ${authUserId} RETURNING id, nickname, age, birth_datetime, zodiac, mbti, city, job, purpose, bio, dimensions, animal, tags, deal_breakers`
      return user ?? status(404, { error: 'user_not_found' })
    }
    const user = memoryUsers.get(authUserId)
    if (!user) return status(404, { error: 'user_not_found' })
    Object.assign(user, { nickname: body.nickname, age: ageFromBirth(body.birth_datetime), birth_datetime: body.birth_datetime, zodiac: body.zodiac, mbti: body.mbti, city: body.city, job: body.job, purpose: body.purpose, bio: body.bio ?? '' })
    return userRecord(user)
  }, { body: profileSchema })
  .post('/users/:id/answers', async ({ params, body, headers, status }) => {
    const userId = Number(params.id)
    if (!(await requireOwner(headers, userId))) return status(401, { error: 'unauthorized' })
    if (database) {
      await database.begin(async (tx) => {
        await tx`DELETE FROM card_answers WHERE user_id = ${userId}`
        for (const answer of body.answers) await tx`INSERT INTO card_answers (user_id, card_id, option_label) VALUES (${userId}, ${answer.cardId}, ${answer.optionLabel})`
        await tx`UPDATE users SET dimensions = ${JSON.stringify(body.dimensions)}::jsonb, animal = ${JSON.stringify(body.animal)}::jsonb, tags = ${tx.array(body.tags)}::text[], deal_breakers = ${tx.array(body.dealBreakers)}::text[] WHERE id = ${userId}`
      })
      return { ok: true, userId }
    }
    const user = memoryUsers.get(userId)
    if (!user) return status(404, { error: 'user_not_found' })
    user.dimensions = body.dimensions
    user.animal = body.animal
    user.tags = body.tags
    user.deal_breakers = body.dealBreakers
    return { ok: true, userId }
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }), body: t.Object({ answers: t.Array(t.Object({ cardId: t.String(), optionLabel: t.String() })), dimensions: dimensionsSchema, animal: t.Unknown(), tags: t.Array(t.String()), dealBreakers: t.Array(t.String()) }) })
  .get('/users/:id/history', async ({ params, headers, status }) => {
    const userId = Number(params.id)
    if (!(await requireOwner(headers, userId))) return status(401, { error: 'unauthorized' })
    if (database) {
      const sessions = await database`SELECT ds.id, ds.game, ds.rounds, ds.result, ds.status, ds.created_at, p.id AS partner_id, p.nickname AS partner_nickname, p.animal AS partner_animal FROM dual_sessions ds JOIN users p ON p.id = CASE WHEN ds.user_a = ${userId} THEN ds.user_b ELSE ds.user_a END WHERE ds.user_a = ${userId} OR ds.user_b = ${userId} ORDER BY ds.created_at DESC LIMIT 50`
      const messages = await database`SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, s.nickname AS sender_nickname, r.nickname AS receiver_nickname FROM messages m JOIN users s ON s.id = m.sender_id JOIN users r ON r.id = m.receiver_id WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId} ORDER BY m.created_at DESC LIMIT 100`
      return { sessions, messages }
    }
    const sessions = [...memorySessions.values()].filter((session) => session.user_a === userId || session.user_b === userId).sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).map((session) => {
      const partner = memoryUsers.get(session.user_a === userId ? session.user_b : session.user_a)
      return { ...session, partner_id: partner?.id, partner_nickname: partner?.nickname, partner_animal: partner?.animal }
    })
    const messages = [...memoryMessages.values()].filter((message) => message.sender_id === userId || message.receiver_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((message) => ({ ...message, sender_nickname: memoryUsers.get(message.sender_id)?.nickname, receiver_nickname: memoryUsers.get(message.receiver_id)?.nickname }))
    return { sessions, messages }
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }) })
  .post('/messages', async ({ body, headers, status }) => {
    const senderId = await userIdFromAuth(headers)
    if (!senderId) return status(401, { error: 'unauthorized' })
    const receiver = await findUser(body.receiverId)
    if (!receiver) return status(404, { error: 'receiver_not_found' })
    if (database) {
      const [message] = await database`INSERT INTO messages (sender_id, receiver_id, content) VALUES (${senderId}, ${body.receiverId}, ${body.content}) RETURNING id, sender_id, receiver_id, content, created_at`
      return message
    }
    const message: StoredMessage = { id: nextMessageId++, sender_id: senderId, receiver_id: body.receiverId, content: body.content, created_at: new Date().toISOString() }
    memoryMessages.set(message.id, message)
    return message
  }, { body: t.Object({ receiverId: t.Number(), content: t.String({ minLength: 1, maxLength: 1000 }) }) })
  .get('/users/:id/matches', async ({ params, headers, status }) => {
    const userId = Number(params.id)
    if (!(await requireOwner(headers, userId))) return status(401, { error: 'unauthorized' })
    if (database) {
      const [source] = await database`SELECT id, nickname, age, city, job, purpose, bio, dimensions, animal, tags, deal_breakers FROM users WHERE id = ${userId} AND dimensions IS NOT NULL`
      if (!source) return status(404, { error: 'user_not_ready' })
      const candidates = await database`SELECT id, nickname, age, city, job, purpose, bio, dimensions, animal, tags, deal_breakers FROM users WHERE id <> ${source.id} AND purpose = ${source.purpose} AND dimensions IS NOT NULL`
      return candidates.map((candidate) => ({ user: candidate, report: reportFor(source as StoredUser, candidate as StoredUser) })).sort((a, b) => b.report.total - a.report.total).slice(0, 3)
    }
    const source = memoryUsers.get(userId)
    if (!source?.dimensions) return status(404, { error: 'user_not_ready' })
    return [...memoryUsers.values()].filter((candidate) => candidate.id !== source.id && candidate.purpose === source.purpose && candidate.dimensions).map((candidate) => ({ user: userRecord(candidate), report: reportFor(source, candidate) })).sort((a, b) => b.report.total - a.report.total).slice(0, 3)
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }) })
  .post('/dual-sessions', async ({ body, headers, status }) => {
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId || (authUserId !== body.userA && authUserId !== body.userB)) return status(401, { error: 'unauthorized' })
    let userA: StoredUser | undefined
    let userB: StoredUser | undefined
    if (database) {
      const rows = await database`SELECT id, nickname, age, city, job, purpose, bio, dimensions, animal, tags, deal_breakers FROM users WHERE id IN (${body.userA}, ${body.userB}) AND dimensions IS NOT NULL`
      userA = rows.find((item) => item.id === body.userA) as StoredUser | undefined
      userB = rows.find((item) => item.id === body.userB) as StoredUser | undefined
    } else {
      userA = memoryUsers.get(body.userA)
      userB = memoryUsers.get(body.userB)
    }
    if (!userA?.dimensions || !userB?.dimensions) return status(409, { error: 'users_not_ready' })
    const report = reportFor(userA, userB)
    const session: StoredSession = { id: crypto.randomUUID(), user_a: body.userA, user_b: body.userB, game: selectGame(userA.dimensions, userB.dimensions, report), rounds: [], result: null, status: 'ready', created_at: new Date().toISOString() }
    if (database) {
      const [stored] = await database`INSERT INTO dual_sessions (id, user_a, user_b, game, status) VALUES (${session.id}, ${session.user_a}, ${session.user_b}, ${JSON.stringify(session.game)}::jsonb, ${session.status}) RETURNING id, user_a, user_b, game, rounds, result, status, created_at`
      return stored
    }
    memorySessions.set(session.id, session)
    return session
  }, { body: t.Object({ userA: t.Number(), userB: t.Number() }) })
  .get('/dual-sessions/:id', async ({ params, headers, status }) => {
    const session = database ? (await database`SELECT id, user_a, user_b, game, rounds, result, status, created_at FROM dual_sessions WHERE id = ${params.id}`)[0] : memorySessions.get(params.id)
    if (!session) return status(404, { error: 'session_not_found' })
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId || (authUserId !== session.user_a && authUserId !== session.user_b)) return status(401, { error: 'unauthorized' })
    return session
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .patch('/dual-sessions/:id', async ({ params, body, headers, status }) => {
    const session = database ? (await database`SELECT user_a, user_b FROM dual_sessions WHERE id = ${params.id}`)[0] : memorySessions.get(params.id)
    if (!session) return status(404, { error: 'session_not_found' })
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId || (authUserId !== session.user_a && authUserId !== session.user_b)) return status(401, { error: 'unauthorized' })
    if (database) {
      const [updated] = await database`UPDATE dual_sessions SET rounds = ${JSON.stringify(body.rounds)}::jsonb, result = ${JSON.stringify(body.result)}::jsonb, status = 'completed' WHERE id = ${params.id} RETURNING id, user_a, user_b, rounds, result, status, created_at`
      return updated
    }
    const memorySession = memorySessions.get(params.id)!
    memorySession.rounds = body.rounds
    memorySession.result = body.result
    memorySession.status = 'completed'
    return memorySession
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ rounds: t.Array(t.Unknown()), result: t.Unknown() }) })
  .post('/proximity/announce', async ({ body, status }) => {
    if (database) return status(501, { error: 'proximity_memory_mode_only' })
    const now = Date.now()
    const existing = [...memoryProximityPeers.values()].find((peer) => peer.deviceId !== body.deviceId && now - peer.lastSeen < 15_000)
    const peer: ProximityPeer = { deviceId: body.deviceId, lastSeen: now, sessionId: existing?.sessionId }
    if (existing) {
      const sessionId = existing.sessionId ?? crypto.randomUUID()
      existing.sessionId = sessionId
      peer.sessionId = sessionId
      if (!memoryProximitySessions.has(sessionId)) memoryProximitySessions.set(sessionId, { id: sessionId, devices: [existing.deviceId, peer.deviceId], game: proximityGame, createdAt: new Date().toISOString() })
    }
    memoryProximityPeers.set(body.deviceId, peer)
    return { nearby: Boolean(existing), sessionId: peer.sessionId, game: peer.sessionId ? proximityGame : undefined }
  }, { body: t.Object({ deviceId: t.String({ minLength: 8, maxLength: 100 }) }) })
  .get('/proximity/:id', ({ params, status }) => memoryProximitySessions.get(params.id) ?? status(404, { error: 'proximity_session_not_found' }), { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/companion/chat', async ({ body }) => {
    const upstream = await fetch('https://hackathon.starrytalk.com/v1/companion/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        authorization: `Bearer ${process.env.COMPANION_API_KEY ?? ''}`,
      },
      body: JSON.stringify(body),
    })
    return upstream
  }, { body: t.Object({ query: t.String({ minLength: 1, maxLength: 2000 }), user_id: t.Optional(t.String({ maxLength: 100 })), system_prompt: t.Optional(t.String({ maxLength: 4000 })) }) })
  .get('/nfc-cards/:id', async ({ params, headers, status }) => {
    const userId = await userIdFromAuth(headers)
    if (!userId) return status(401, { error: 'unauthorized' })
    if (database) {
      const [card] = await database`SELECT id, title, content, owner_id, claimed_at, transferred_at, former_owner_ids FROM nfc_cards WHERE id = ${params.id}`
      return card ?? status(404, { error: 'card_not_found' })
    }
    return memoryCards.get(params.id) ?? status(404, { error: 'card_not_found' })
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/nfc-cards/:id/claim', async ({ params, body, headers, status }) => {
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId || authUserId !== body.userId) return status(401, { error: 'unauthorized' })
    if (database) {
      const [card] = await database`UPDATE nfc_cards SET owner_id = ${body.userId}, claimed_at = NOW() WHERE id = ${params.id} AND owner_id IS NULL AND NOT (${body.userId} = ANY(former_owner_ids)) RETURNING id, title, content, owner_id, claimed_at, transferred_at, former_owner_ids`
      return card ?? status(409, { error: 'card_already_owned' })
    }
    const card = memoryCards.get(params.id)
    if (!card) return status(404, { error: 'card_not_found' })
    if (card.owner_id !== null || card.former_owner_ids.includes(body.userId)) return status(409, { error: 'card_already_owned' })
    card.owner_id = body.userId
    card.claimed_at = new Date().toISOString()
    return card
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ userId: t.Number() }) })
  .post('/nfc-cards/:id/transfer', async ({ params, body, headers, status }) => {
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId || authUserId !== body.fromUserId) return status(401, { error: 'unauthorized' })
    if (database) {
      const [card] = await database`UPDATE nfc_cards SET owner_id = ${body.toUserId}, transferred_at = NOW(), former_owner_ids = array_append(former_owner_ids, ${body.fromUserId}) WHERE id = ${params.id} AND owner_id = ${body.fromUserId} AND NOT (${body.toUserId} = ANY(former_owner_ids)) RETURNING id, title, content, owner_id, claimed_at, transferred_at, former_owner_ids`
      return card ?? status(409, { error: 'card_not_owned_by_sender' })
    }
    const card = memoryCards.get(params.id)
    if (!card) return status(404, { error: 'card_not_found' })
    if (card.owner_id !== body.fromUserId) return status(409, { error: 'card_not_owned_by_sender' })
    if (card.former_owner_ids.includes(body.toUserId)) return status(409, { error: 'recipient_already_received_card' })
    card.owner_id = body.toUserId
    card.former_owner_ids.push(body.fromUserId)
    card.transferred_at = new Date().toISOString()
    return card
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ fromUserId: t.Number(), toUserId: t.Number() }) })
  .ws('/ws', {
    open(ws) { ws.subscribe('lobby') },
    message(ws, message) {
      if (typeof message !== 'string') return
      try {
        const payload = JSON.parse(message) as { type?: string; sessionId?: string }
        if (payload.type === 'join' && payload.sessionId) {
          ws.subscribe(`session:${payload.sessionId}`)
          ws.send(JSON.stringify({ type: 'joined', sessionId: payload.sessionId }))
          return
        }
        if (payload.type === 'game-action' && payload.sessionId) ws.publish(`session:${payload.sessionId}`, message)
      } catch {
        ws.publish('lobby', JSON.stringify({ type: 'message', content: message }))
      }
    },
  })
  .listen(Number(process.env.PORT ?? 3000))

console.log(`API running at ${app.server?.url}`)
