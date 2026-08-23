import { Elysia, t } from 'elysia'
import { cors } from '@elysia/cors'
import { SQL } from 'bun'
import { chemistry } from './matching'
import { getCombo, makeDestinyReading, shuffledDestinyDeck, type ComboKey, type DestinyCardKey, type DestinyQuestionKey } from './destiny'

// 兜底日志:任何未捕获异常/拒绝都留痕,避免进程静默退出
process.on('uncaughtException', (err) => console.error('[echo-api] uncaughtException:', err))
process.on('unhandledRejection', (err) => console.error('[echo-api] unhandledRejection:', err))

type Dimensions = Record<string, number>
type ChemistryReport = { total: number; complements: string[] }
type Game = { id: 'constellation' | 'bridge' | 'relay' | 'treasure'; name: string; reason: string; mechanic: string; goal: string }
type DestinyState = { phase: 'question' | 'draw' | 'card_pending' | 'revealed'; questionKey?: DestinyQuestionKey; selectedBy?: number; confirmedBy?: number; selectedAt?: number; deck: DestinyCardKey[]; cardKey?: DestinyCardKey; selectedCardBy?: number; confirmedCardBy?: number; cardSelectedAt?: number; comboKey?: ComboKey; comboName?: string; reading?: { prophecy: string; quote: string; opener: string }; createdAt: number }
type StoredSession = { id: string; user_a: number; user_b: number; game: Game; rounds: unknown[]; result: unknown; status: string; destiny?: DestinyState; created_at?: string }
type StoredCard = { id: string; title: string; content: string; owner_id: number | null; claimed_at: string | null; transferred_at: string | null; former_owner_ids: number[] }
type StoredAccount = { id: number; user_id: number; username: string; password_hash: string }
type StoredMessage = { id: number; sender_id: number; receiver_id: number; content: string; created_at: string }

const database = process.env.DATABASE_URL ? new SQL(process.env.DATABASE_URL) : null
const memoryUsers = new Map<number, StoredUser>()
const memoryAccounts = new Map<number, StoredAccount>()
const memoryTokens = new Map<string, { accountId: number; expiresAt: number }>()
const memorySessions = new Map<string, StoredSession>()
const memoryMessages = new Map<number, StoredMessage>()
type ProximityPeer = { deviceId: string; lastSeen: number; userId?: number; dualSessionId?: string }
type ProximitySession = { id: string; devices: string[]; game: Game; createdAt: string }
const memoryProximityPeers = new Map<string, ProximityPeer>()
const memoryProximitySessions = new Map<string, ProximitySession>()
const memoryCards = new Map<string, StoredCard>()
const seedMemoryCards = () => {
  if (memoryCards.size) return
  memoryCards.set('starter-01', { id: 'starter-01', title: '星光隐藏卡', content: '找到一颗只属于你们的星星。', owner_id: null, claimed_at: null, transferred_at: null, former_owner_ids: [] })
}
seedMemoryCards()
const proximityGame: Game = { id: 'treasure', name: '隐藏卡寻宝', reason: '两台手机已经靠近，直接开始一场短合作。', mechanic: '双方在画布上协作找到三个宝箱。', goal: '找到 3 个宝箱后完成破冰。' }
const chatRateBuckets = new Map<string, { count: number; resetAt: number }>()
const CHAT_RATE_LIMIT = 12
const CHAT_RATE_WINDOW_MS = 60_000
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
const registerSchema = t.Object({ username: t.String({ minLength: 2, maxLength: 40, pattern: '^\\S+$' }), password: t.String({ minLength: 6, maxLength: 100 }), nickname: t.String({ minLength: 1, maxLength: 40 }), birth_datetime: t.String({ minLength: 10, maxLength: 40 }), zodiac: t.Union(ZODIACS.map((item) => t.Literal(item))), mbti: t.Union(MBTIS.map((item) => t.Literal(item))), city: t.String({ minLength: 1, maxLength: 40 }), job: t.String({ minLength: 1, maxLength: 80 }), purpose: t.Union([t.Literal('恋爱'), t.Literal('朋友'), t.Literal('搭子')]), bio: t.Optional(t.String({ maxLength: 200 })), avatarUrl: t.Optional(t.String({ maxLength: 500 })) })


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
    const userId = Number(session?.user_id)
    return Number.isSafeInteger(userId) ? userId : undefined
  }
  return memoryAccountForToken(headers)?.user_id
}
const requireOwner = async (headers: Record<string, string | undefined>, requestedId: number) => (await userIdFromAuth(headers)) === requestedId
const readJson = <T>(value: unknown): T | undefined => {
  if (!value) return undefined
  if (typeof value !== 'string') return value as T
  try { return JSON.parse(value) as T } catch { return undefined }
}
const createDualSession = async (userAId: number, userBId: number) => {
  if (userAId === userBId) return undefined
  const userA = await findUser(userAId)
  const userB = await findUser(userBId)
  if (!userA?.dimensions || !userB?.dimensions) return undefined
  const session: StoredSession = { id: crypto.randomUUID(), user_a: userAId, user_b: userBId, game: selectGame(userA.dimensions, userB.dimensions, reportFor(userA, userB)), rounds: [], result: null, status: 'ready', created_at: new Date().toISOString() }
  if (database) {
    const [stored] = await database`INSERT INTO dual_sessions (id, user_a, user_b, game, status) VALUES (${session.id}, ${session.user_a}, ${session.user_b}, ${JSON.stringify(session.game)}::jsonb, ${session.status}) RETURNING id, user_a, user_b, game, rounds, result, status, destiny, created_at`
    return stored as StoredSession
  }
  memorySessions.set(session.id, session)
  return session
}
const readSession = async (id: string) => database
  ? (await database`SELECT id, user_a, user_b, game, rounds, result, status, destiny, created_at FROM dual_sessions WHERE id = ${id}`)[0] as StoredSession | undefined
  : memorySessions.get(id)
const saveDestiny = async (session: StoredSession, destiny: DestinyState) => {
  session.destiny = destiny
  if (database) await database`UPDATE dual_sessions SET destiny = ${JSON.stringify(destiny)}::jsonb WHERE id = ${session.id}`
  else memorySessions.set(session.id, session)
  return destiny
}
const sessionParticipant = async (session: StoredSession, headers: Record<string, string | undefined>) => {
  const userId = await userIdFromAuth(headers)
  return userId && (userId === session.user_a || userId === session.user_b) ? userId : undefined
}
const revealDestiny = async (session: StoredSession, destiny: DestinyState, confirmedBy: number) => {
  if (!destiny.questionKey || !destiny.cardKey) return destiny
  const [userA, userB] = await Promise.all([findUser(session.user_a), findUser(session.user_b)])
  const combo = getCombo(userA?.animal, userB?.animal)
  return saveDestiny(session, { ...destiny, phase: 'revealed', confirmedCardBy: confirmedBy, comboKey: combo.key, comboName: combo.name, reading: makeDestinyReading(destiny.questionKey, destiny.cardKey, combo.key) })
}
const advanceDestinyTimeout = async (session: StoredSession, destiny: DestinyState) => {
  const now = Date.now()
  if (destiny.phase === 'question' && !destiny.questionKey && now - destiny.createdAt >= 15_000) {
    return saveDestiny(session, { ...destiny, phase: 'draw', questionKey: 'lost', selectedBy: 0, confirmedBy: 0, selectedAt: now })
  }
  if (destiny.phase === 'card_pending' && destiny.cardSelectedAt && now - destiny.cardSelectedAt >= 10_000) return revealDestiny(session, destiny, 0)
  return destiny
}

const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [token, session] of memoryTokens) if (session.expiresAt < now) memoryTokens.delete(token)
  for (const [deviceId, peer] of memoryProximityPeers) if (now - peer.lastSeen > 60_000) memoryProximityPeers.delete(deviceId)
  for (const [id, session] of memoryProximitySessions) if (now - new Date(session.createdAt).getTime() > 3_600_000) memoryProximitySessions.delete(id)
  if (database) database`DELETE FROM auth_sessions WHERE expires_at < NOW()`.then(() => undefined).catch(() => undefined)
}, 600_000)
// 注意:不要 unref 此 timer —— Bun 在 Windows 上会把 unref 的 timer 误判为空事件循环,
// 导致进程在无请求时 ~5 秒内退出(实测 Bun 1.3.14 + Bun.serve 复现)。

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
    user.answers = body.answers
    return { ok: true, userId }
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }), body: t.Object({ answers: t.Array(t.Object({ cardId: t.String(), optionLabel: t.String() })), dimensions: dimensionsSchema, animal: t.Unknown(), tags: t.Array(t.String()), dealBreakers: t.Array(t.String()) }) })
  .get('/users/:id/answers', async ({ params, headers, status }) => {
    const userId = Number(params.id)
    if (!(await requireOwner(headers, userId))) return status(401, { error: 'unauthorized' })
    if (database) {
      const rows = await database`SELECT DISTINCT card_id FROM card_answers WHERE user_id = ${userId}`
      return { answeredCardIds: rows.map((row) => row.card_id) }
    }
    const user = memoryUsers.get(userId)
    return { answeredCardIds: [...new Set((user?.answers ?? []).map((item) => item.cardId))] }
  }, { params: t.Object({ id: t.String({ pattern: '^\\d+$' }) }) })
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
      return candidates.map((candidate) => ({ user: candidate, report: reportFor(source as StoredUser, candidate as StoredUser) })).sort((a, b) => b.report.total - a.report.total).slice(0, 20)
    }
    const source = memoryUsers.get(userId)
    if (!source?.dimensions) return status(404, { error: 'user_not_ready' })
    return [...memoryUsers.values()].filter((candidate) => candidate.id !== source.id && candidate.purpose === source.purpose && candidate.dimensions).map((candidate) => ({ user: userRecord(candidate), report: reportFor(source, candidate) })).sort((a, b) => b.report.total - a.report.total).slice(0, 20)
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
  .post('/dual-sessions/:id/destiny/start', async ({ params, headers, status }) => {
    const session = await readSession(params.id)
    if (!session) return status(404, { error: 'session_not_found' })
    if (!(await sessionParticipant(session, headers))) return status(401, { error: 'unauthorized' })
    const destiny = readJson<DestinyState>(session.destiny) ?? { phase: 'question' as const, deck: shuffledDestinyDeck(), createdAt: Date.now() }
    return saveDestiny(session, destiny)
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .get('/dual-sessions/:id/destiny', async ({ params, headers, status }) => {
    const session = await readSession(params.id)
    if (!session) return status(404, { error: 'session_not_found' })
    if (!(await sessionParticipant(session, headers))) return status(401, { error: 'unauthorized' })
    const destiny = readJson<DestinyState>(session.destiny)
    return destiny ? await advanceDestinyTimeout(session, destiny) : status(404, { error: 'destiny_not_started' })
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/dual-sessions/:id/destiny/action', async ({ params, body, headers, status }) => {
    const session = await readSession(params.id)
    if (!session) return status(404, { error: 'session_not_found' })
    const actor = await sessionParticipant(session, headers)
    if (!actor) return status(401, { error: 'unauthorized' })
    const destiny = readJson<DestinyState>(session.destiny)
    if (!destiny) return status(409, { error: 'destiny_not_started' })
    if (body.action === 'select_question' && destiny.phase === 'question' && typeof body.key === 'string') {
      if (!['lost', 'collab', 'secret', 'unspoken', 'year_later'].includes(body.key)) return status(422, { error: 'invalid_question' })
      return saveDestiny(session, { ...destiny, questionKey: body.key as DestinyQuestionKey, selectedBy: actor, selectedAt: Date.now() })
    }
    if (body.action === 'confirm_question' && destiny.phase === 'question' && destiny.questionKey && destiny.selectedBy !== actor) {
      return saveDestiny(session, { ...destiny, phase: 'draw', confirmedBy: actor })
    }
    if (body.action === 'select_card' && destiny.phase === 'draw' && typeof body.key === 'string' && destiny.deck.includes(body.key as DestinyCardKey)) {
      return saveDestiny(session, { ...destiny, phase: 'card_pending', cardKey: body.key as DestinyCardKey, selectedCardBy: actor, cardSelectedAt: Date.now() })
    }
    if (body.action === 'confirm_card' && destiny.phase === 'card_pending' && destiny.cardKey && destiny.selectedCardBy !== actor) return revealDestiny(session, destiny, actor)
    return status(409, { error: 'invalid_destiny_transition' })
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ action: t.Union([t.Literal('select_question'), t.Literal('confirm_question'), t.Literal('select_card'), t.Literal('confirm_card')]), key: t.Optional(t.String({ maxLength: 40 })) }) })
  .post('/proximity/announce', async ({ body, headers, status }) => {
    const now = Date.now()
    const userId = await userIdFromAuth(headers)
    if (!userId) return status(401, { error: 'unauthorized' })
    if (database) {
      await database`DELETE FROM proximity_peers WHERE last_seen < ${new Date(now - 15_000)}`
      const [existing] = await database`SELECT device_id, user_id, dual_session_id FROM proximity_peers WHERE device_id <> ${body.deviceId} AND last_seen > ${new Date(now - 15_000)} LIMIT 1`
      let dualSessionId = existing?.dual_session_id as string | undefined
      if (existing?.user_id && Number(existing.user_id) !== userId && !dualSessionId) dualSessionId = (await createDualSession(Number(existing.user_id), userId))?.id
      await database`INSERT INTO proximity_peers (device_id, user_id, dual_session_id, last_seen) VALUES (${body.deviceId}, ${userId}, ${dualSessionId ?? null}, ${new Date(now)}) ON CONFLICT (device_id) DO UPDATE SET user_id = EXCLUDED.user_id, dual_session_id = EXCLUDED.dual_session_id, last_seen = EXCLUDED.last_seen`
      if (existing?.device_id && dualSessionId) await database`UPDATE proximity_peers SET dual_session_id = ${dualSessionId} WHERE device_id = ${existing.device_id}`
      return { nearby: Boolean(existing?.user_id && Number(existing.user_id) !== userId), sessionId: dualSessionId, game: dualSessionId ? proximityGame : undefined }
    }
    const existing = [...memoryProximityPeers.values()].find((peer) => peer.deviceId !== body.deviceId && now - peer.lastSeen < 15_000)
    let dualSessionId = existing?.dualSessionId
    if (existing?.userId && existing.userId !== userId && !dualSessionId) dualSessionId = (await createDualSession(existing.userId, userId))?.id
    memoryProximityPeers.set(body.deviceId, { deviceId: body.deviceId, lastSeen: now, userId, dualSessionId })
    if (existing && dualSessionId) existing.dualSessionId = dualSessionId
    return { nearby: Boolean(existing?.userId && existing.userId !== userId), sessionId: dualSessionId, game: dualSessionId ? proximityGame : undefined }
  }, { body: t.Object({ deviceId: t.String({ minLength: 8, maxLength: 100 }) }) })
  .get('/proximity/:id', async ({ params, status }) => {
    if (database) {
      const [session] = await database`SELECT id, game, created_at FROM proximity_sessions WHERE id = ${params.id}`
      if (!session) return status(404, { error: 'proximity_session_not_found' })
      return { ...session, game: typeof session.game === 'string' ? JSON.parse(session.game) : session.game }
    }
    return memoryProximitySessions.get(params.id) ?? status(404, { error: 'proximity_session_not_found' })
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }) })
  .post('/companion/chat', async ({ body, headers, set }) => {
    const client = (headers['x-forwarded-for'] ?? headers['cf-connecting-ip'] ?? 'anonymous').toString().split(',')[0].trim()
    const now = Date.now()
    const bucket = chatRateBuckets.get(client)
    if (!bucket || bucket.resetAt < now) chatRateBuckets.set(client, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS })
    else if (++bucket.count > CHAT_RATE_LIMIT) {
      set.status = 429
      return { error: 'rate_limited', retry_after_ms: bucket.resetAt - now }
    }
    const authUserId = await userIdFromAuth(headers)
    if (!authUserId) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
    const upstreamKey = process.env.COMPANION_API_KEY
    if (!upstreamKey) return new Response(JSON.stringify({ error: 'companion_unconfigured' }), { status: 503, headers: { 'content-type': 'application/json' } })
    const user = await findUser(authUserId)
    const gender = body.gender ?? process.env.COMPANION_GENDER ?? 'female'
    const age = user ? ageFromBirth(user.birth_datetime) : 25
    const query = body.system_prompt ? `${body.system_prompt}\n\n用户问题:${body.query}` : body.query
    const upstream = await fetch(process.env.COMPANION_API_URL ?? 'https://hackathon.starrytalk.com/v1/tarot/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream', authorization: `Bearer ${upstreamKey}` },
      body: JSON.stringify({ spread: body.spread ?? 'one_card', query, gender, age }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' } })
    return upstream
  }, { body: t.Object({ query: t.String({ minLength: 1, maxLength: 2000 }), user_id: t.Optional(t.String({ maxLength: 100 })), system_prompt: t.Optional(t.String({ maxLength: 4000 })), gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female')])), spread: t.Optional(t.String({ minLength: 1, maxLength: 40 })) }) })
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
    memoryCards.set(card.id, { ...card, owner_id: body.userId, claimed_at: new Date().toISOString() })
    return memoryCards.get(card.id)
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
    memoryCards.set(card.id, { ...card, owner_id: body.toUserId, former_owner_ids: [...card.former_owner_ids, body.fromUserId], transferred_at: new Date().toISOString() })
    return memoryCards.get(card.id)
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 100 }) }), body: t.Object({ fromUserId: t.Number(), toUserId: t.Number() }) })
  .ws('/ws', {
    open() {
      // 匿名不再自动订阅全局频道;客户端必须显式 join
    },
    message(ws, message) {
      let parsed: { type?: string; sessionId?: string } | undefined
      try { parsed = typeof message === 'string' ? JSON.parse(message) : (message as { type?: string; sessionId?: string }) } catch { /* 纯文本 */ }
      if (parsed && typeof parsed === 'object') {
        if (parsed.type === 'join' && parsed.sessionId) {
          ws.subscribe(parsed.sessionId === 'lobby' ? 'lobby' : `session:${parsed.sessionId}`)
          ws.send(JSON.stringify({ type: 'joined', sessionId: parsed.sessionId }))
          return
        }
        if (parsed.type === 'game-action' && parsed.sessionId) {
          const room = `session:${parsed.sessionId}`
          if (ws.isSubscribed(room)) ws.publish(room, typeof message === 'string' ? message : JSON.stringify(message))
          return
        }
      }
      // 纯文本消息只发给显式加入 lobby 的客户端,不再全局广播
      if (ws.isSubscribed('lobby')) ws.publish('lobby', typeof message === 'string' ? JSON.stringify({ type: 'message', content: message }) : JSON.stringify(message))
    },
  })
  .listen(Number(process.env.PORT ?? 3000))

console.log(`API running at ${app.server?.url}`)
