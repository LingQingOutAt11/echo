<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { gsap } from 'gsap'
import QRCode from 'qrcode'
import { CARDS, DIMENSIONS, type Card, type Dimensions } from './data'
import { DESTINY_CARDS, DESTINY_QUESTIONS, destinyCard, destinyQuestion, shuffledDestinyDeck, type DestinyCardKey, type DestinyQuestionKey } from './destiny'
import { animalCombo, assignAnimal, chemistry, dimensionHighlights, insight, scoreAnswers, type Animal } from './engine'

const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`
const ZODIACS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
const MBTIS = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
type User = { id: number; nickname: string; age: number; birth_datetime?: string; zodiac?: string; mbti?: string; city: string; job: string; purpose: string; bio: string; dimensions?: Dimensions; tags: string[]; deal_breakers?: string[]; animal?: Animal }
type Report = ReturnType<typeof chemistry>
type Match = { user: User; report: Report }
type History = { sessions: Array<{ id: string; game?: { name?: string }; status: string; created_at?: string; partner_id?: number; partner_nickname?: string; partner_animal?: Animal }>; messages: Array<{ id: number; sender_id: number; receiver_id: number; content: string; created_at: string; sender_nickname?: string; receiver_nickname?: string }> }

const QUIZ_DRAW = 8
const POOL_SIZE = 200
const TAROT_BACK_IDS = ['r01', 'r02', 'l01', 'l02', 'v01', 'm01', 'b01', 'd01'] as const
const tarotBack = (card: Card) => {
  const hash = [...card.id].reduce((sum, character) => sum * 31 + character.charCodeAt(0), 0)
  return `/tarot-cards/${TAROT_BACK_IDS[Math.abs(hash) % TAROT_BACK_IDS.length]}.webp`
}
const preloadTarotBacks = () => TAROT_BACK_IDS.forEach((id) => {
  const image = new Image()
  image.src = `/tarot-cards/${id}.webp`
})
const answeredCardIds = ref<string[]>([])
const deck = ref<Card[]>([])
const sessionCards = ref<Card[]>([])
const answeredStorageKey = (id: number | null) => `ai-chemistry-answered-cards-${id}`
const persistAnsweredCards = () => localStorage.setItem(answeredStorageKey(userId.value), JSON.stringify(answeredCardIds.value))
function drawDeck() {
  let pool = CARDS.filter((card) => !answeredCardIds.value.includes(card.id))
  if (pool.length < QUIZ_DRAW) {
    answeredCardIds.value = []
    localStorage.removeItem(answeredStorageKey(userId.value))
    pool = CARDS
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  deck.value = shuffled.slice(0, QUIZ_DRAW)
  sessionCards.value = []
  answers.value = {}
  cardIndex.value = 0
  tarotFlipped.value = false
  rotationAngle.value = 0
}
const page = ref<'auth' | 'profile' | 'account' | 'cards' | 'dna' | 'matches' | 'detail' | 'connect' | 'duo' | 'destiny' | 'result' | 'chat' | 'dm'>('auth')
const profile = ref<{ nickname: string; birth_datetime: string; zodiac: string; mbti: string; city: string; job: string; purpose: '恋爱' | '朋友' | '搭子'; bio: string }>({ nickname: '', birth_datetime: '', zodiac: '', mbti: '', city: '上海', job: '', purpose: '朋友', bio: '' })
const authMode = ref<'login' | 'register'>('login')
const authBusy = ref(false)
const authToken = ref(localStorage.getItem('ai-chemistry-auth-token') ?? '')
const authForm = ref({ username: '', password: '', nickname: '', birth_datetime: '', zodiac: '', mbti: '', city: '上海', job: '', purpose: '朋友' as '恋爱' | '朋友' | '搭子', bio: '' })
const currentUser = ref<User | null>(null)
const history = ref<History>({ sessions: [], messages: [] })
const answers = ref<Record<string, string>>({})
const cardIndex = ref(0)
const tarotFlipped = ref(false)
let tarotTouchStartX = 0
function handleTarotTouchStart(event: TouchEvent) { tarotTouchStartX = event.touches[0]?.clientX ?? 0 }
function handleTarotTouchEnd(event: TouchEvent) {
  const endX = event.changedTouches[0]?.clientX ?? tarotTouchStartX
  const delta = endX - tarotTouchStartX
  if (Math.abs(delta) > 40) swipeTarot(delta < 0 ? 1 : -1)
}
const userId = ref<number | null>(Number(localStorage.getItem('ai-chemistry-user-id')) || null)
const matches = ref<Match[]>([])
const selectedMatchId = ref<number | null>(null)
const sessionId = ref<string | null>(null)
const connectMethod = ref<'nfc' | 'qr' | 'proximity'>('nfc')
const qrDataUrl = ref('')
const proximityId = ref(new URLSearchParams(window.location.search).get('proximity') ?? '')
const pendingProximity = ref(false)
const safeUUID = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)
const deviceId = ref(localStorage.getItem('ai-chemistry-device-id') ?? safeUUID())
const round = ref(0)
const roundChoice = ref('')
const roundScores = ref<number[]>([])
type DestinyState = { phase: 'question' | 'draw' | 'card_pending' | 'revealed'; questionKey?: DestinyQuestionKey; selectedBy?: number; confirmedBy?: number; deck: DestinyCardKey[]; cardKey?: DestinyCardKey; selectedCardBy?: number; confirmedCardBy?: number; comboKey?: string; comboName?: string; reading?: { prophecy: string; quote: string; opener: string } }
const destiny = ref<DestinyState | null>(null)
const destinyError = ref('')
let destinyTimer: ReturnType<typeof setInterval> | null = null
const stage = ref<HTMLElement | null>(null)
const error = ref('')

const dna = computed(() => scoreAnswers(sessionCards.value, answers.value))
const animal = computed(() => assignAnimal(dna.value.dimensions))
const highlights = computed(() => dimensionHighlights(dna.value.dimensions))
const answeredCount = computed(() => sessionCards.value.filter((card) => {
  const picked = answers.value[card.id]?.split(',').filter(Boolean).length ?? 0
  return card.multi ? picked >= 3 : picked > 0
}).length)
const currentCard = computed(() => deck.value[cardIndex.value])
const progress = computed(() => `${answeredCount.value}/${QUIZ_DRAW}`)
const rotationAngle = ref(0)
let autoRotateRaf: number | null = null

function startAutoRotate() {
  if (autoRotateRaf) return
  let lastTime = performance.now()
  const tick = (now: number) => {
    const delta = (now - lastTime) / 1000
    lastTime = now
    // 当未翻牌作答时，保持持续匀速旋转 (每秒约 18 度)
    if (!tarotFlipped.value) {
      rotationAngle.value = (rotationAngle.value + delta * 18) % 360
      // 根据当前旋转角度实时计算最近的正前方卡片索引
      const stepDeg = 360 / Math.max(1, deck.value.length)
      const normalized = (360 - (rotationAngle.value % 360)) % 360
      const nearestIndex = Math.round(normalized / stepDeg) % Math.max(1, deck.value.length)
      cardIndex.value = nearestIndex
    }
    autoRotateRaf = requestAnimationFrame(tick)
  }
  autoRotateRaf = requestAnimationFrame(tick)
}

function stopAutoRotate() {
  if (autoRotateRaf) {
    cancelAnimationFrame(autoRotateRaf)
    autoRotateRaf = null
  }
}

const tarotTransform = (index: number) => {
  const size = Math.max(1, deck.value.length)
  const stepDeg = 360 / size
  // 计算当前卡片在连续自转圆环中的角度
  const cardAngle = (index * stepDeg + rotationAngle.value) % 360
  // 标准化到 [-180, 180] 方便计算景深
  const normalizedAngle = cardAngle > 180 ? cardAngle - 360 : cardAngle
  
  const radius = 290
  const rad = (normalizedAngle * Math.PI) / 180
  const cosVal = Math.cos(rad)
  const isFocused = Math.abs(normalizedAngle) < stepDeg / 2
  
  return {
    transform: `translate(-50%, -50%) rotateY(${normalizedAngle}deg) translateZ(${radius}px) scale(${isFocused ? 1.05 : 0.72})`,
    zIndex: Math.round(100 + cosVal * 60),
    opacity: cosVal < -0.3 ? 0.2 : cosVal < 0.2 ? 0.6 : 1,
    filter: isFocused ? 'none' : 'brightness(0.82)',
    pointerEvents: 'auto',
  }
}
const selectedMatch = computed(() => matches.value.find((item) => Number(item.user.id) === Number(selectedMatchId.value)) ?? null)
const demoMatches = ref(false)
const selectedReport = computed(() => selectedMatch.value?.report ?? chemistry(dna.value.dimensions, dna.value.dimensions, dna.value.tags, dna.value.tags, dna.value.dealBreakers, dna.value.dealBreakers, animal.value, animal.value))
const selectedUser = computed(() => selectedMatch.value?.user ?? { id: 0, nickname: '等待匹配', age: 0, city: '', job: '', purpose: '', dimensions: dna.value.dimensions, tags: [] })
const selectedAnimalCombo = computed(() => selectedMatch.value?.report.combo ?? animalCombo(animal.value, selectedMatch.value?.user.animal))
const pageTitles: Record<string, { step: string; label: string }> = {
  auth: { step: '00', label: '登录 / 注册' }, profile: { step: '01', label: '回声档案' }, account: { step: '00', label: '个人中心' }, cards: { step: '02', label: '心智卡牌' }, dna: { step: '03', label: '社交基因' }, matches: { step: '04', label: '火花雷达' }, detail: { step: '04', label: '化学解析' }, dm: { step: '04', label: '在线聊天' }, connect: { step: '05', label: '线下接触' }, duo: { step: '06', label: '破冰对决' }, destiny: { step: '06', label: '回声牌' }, result: { step: '06', label: '回声结论' }, chat: { step: '04', label: '内在小孩对话' },
}
const destinyQuestionCurrent = computed(() => destinyQuestion(destiny.value?.questionKey))
const destinyCardCurrent = computed(() => destinyCard(destiny.value?.cardKey))
const destinySelectedByMe = computed(() => destiny.value?.selectedBy === userId.value)
const destinyCardSelectedByMe = computed(() => destiny.value?.selectedCardBy === userId.value)

const roundData = [
  { type: 'AI 预测', question: '旅行时，谁会主动做攻略？', options: ['我', 'TA'], tag: 'PREDICTION' },
  { type: '默契互猜', question: '如果明天突然放假，TA 会选择？', options: ['去探索新地方', '在家躺平', '找朋友见面', '做自己的事'], tag: 'GUESS' },
  { type: '分歧挑战', question: '30 秒内决定：第一次约会谁定餐厅？', options: ['我来定', 'TA 来定', '一起决定', '交给随机'], tag: 'CHALLENGE' },
]
const currentRound = computed(() => roundData[round.value])
const authHeaders = () => authToken.value ? { authorization: `Bearer ${authToken.value}` } : {}
const openPicker = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  try { input.showPicker?.() } catch { /* picker already open or unsupported */ }
}
const apiFetch = (path: string, options: RequestInit = {}) => fetch(`${API_URL}${path}`, { ...options, headers: { 'content-type': 'application/json', ...authHeaders(), ...(options.headers ?? {}) } })
const selectedMessages = computed(() => selectedMatch.value ? history.value.messages.filter((message) => Number(message.sender_id) === selectedMatch.value!.user.id || Number(message.receiver_id) === selectedMatch.value!.user.id).sort((a, b) => a.created_at.localeCompare(b.created_at)) : [])

async function syncAnswered(userId: number) {
  let local: string[] = []
  try { local = JSON.parse(localStorage.getItem(answeredStorageKey(userId)) ?? '[]') as string[] } catch { /* 缓存损坏时忽略 */ }
  const response = await apiFetch(`/users/${userId}/answers`)
  if (!response.ok) { answeredCardIds.value = local; return }
  const data = await response.json() as { answeredCardIds?: string[] }
  answeredCardIds.value = [...new Set([...local, ...(data.answeredCardIds ?? [])])]
  persistAnsweredCards()
}
async function loadHistory() {
  if (!userId.value || !authToken.value) return
  const response = await apiFetch(`/users/${userId.value}/history`)
  if (response.ok) history.value = await response.json() as History
}
async function loadAccount() {
  if (!authToken.value) return false
  try {
    const response = await apiFetch('/auth/me')
    if (!response.ok) { authToken.value = ''; userId.value = null; localStorage.removeItem('ai-chemistry-auth-token'); localStorage.removeItem('ai-chemistry-user-id'); return false }
    const data = await response.json() as { user: User }
    currentUser.value = data.user; userId.value = data.user.id
    profile.value = { nickname: data.user.nickname, birth_datetime: data.user.birth_datetime ?? '', zodiac: data.user.zodiac ?? '', mbti: data.user.mbti ?? '', city: data.user.city, job: data.user.job, purpose: data.user.purpose as '恋爱' | '朋友' | '搭子', bio: data.user.bio }
    await syncAnswered(data.user.id)
    await loadHistory()
    return true
  } catch {
    error.value = '网络连接异常，请检查服务是否可用后重试。'
    return false
  }
}
async function submitAuth() {
  error.value = ''
  if (authMode.value === 'register') {
    if (authForm.value.username.trim().length < 2 || /\s/.test(authForm.value.username)) { error.value = '用户名需 2-40 位且不能包含空格'; return }
    if (authForm.value.password.length < 6) { error.value = '密码至少 6 位'; return }
    if (!authForm.value.purpose) { error.value = '请选择来意'; return }
  }
  const body = authMode.value === 'register' ? { ...authForm.value } : { username: authForm.value.username, password: authForm.value.password }
  try {
    const response = await apiFetch(`/auth/${authMode.value}`, { method: 'POST', body: JSON.stringify(body) })
    const data = await response.json() as { token?: string; user?: User; error?: string }
    if (!response.ok || !data.token || !data.user) {
      error.value = authMode.value === 'register'
        ? data.error === 'username_taken' ? '用户名已存在' : data.error === 'VALIDATION' ? '注册信息有误：用户名 2-40 位（不含空格），密码至少 6 位' : '注册失败，请稍后重试'
        : data.error === 'invalid_credentials' ? '用户名或密码不正确' : '登录失败，请稍后重试'
      return
    }
    authToken.value = data.token; currentUser.value = data.user; userId.value = data.user.id
    localStorage.setItem('ai-chemistry-auth-token', data.token); localStorage.setItem('ai-chemistry-user-id', String(data.user.id))
    await syncAnswered(data.user.id)
    await loadHistory()
    if (pendingProximity.value) {
      // 扫码加入的用户登录完成后直接进入配对等待
      pendingProximity.value = false
      connectMethod.value = 'proximity'
      page.value = 'connect'
      startProximityPolling()
      return
    }
    if (data.user.animal) page.value = 'account'
    else { drawDeck(); page.value = 'cards' }
  } catch {
    error.value = '网络连接异常，请确认服务已启动后重试。'
  }
}
async function logout() { await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined); authToken.value = ''; currentUser.value = null; userId.value = null; localStorage.removeItem('ai-chemistry-auth-token'); localStorage.removeItem('ai-chemistry-user-id'); page.value = 'auth' }
let dmPollTimer: ReturnType<typeof setInterval> | null = null
const dmDraft = ref('')
const dmSending = ref(false)
const dmError = ref('')
function stopDmPolling() { if (dmPollTimer) { clearInterval(dmPollTimer); dmPollTimer = null } }
async function refreshDmHistory() { if (!userId.value || !authToken.value) return; const response = await apiFetch(`/users/${userId.value}/history`); if (response.ok) history.value = await response.json() as History }
function openDm() {
  if (!selectedMatch.value) return
  dmError.value = ''
  page.value = 'dm'
  void refreshDmHistory()
  stopDmPolling()
  dmPollTimer = setInterval(() => { void refreshDmHistory() }, 3000)
}
async function sendDm() {
  if (!selectedMatch.value || !dmDraft.value.trim() || dmSending.value) return
  dmSending.value = true
  dmError.value = ''
  try {
    const response = await apiFetch('/messages', { method: 'POST', body: JSON.stringify({ receiverId: Number(selectedMatch.value.user.id), content: dmDraft.value.trim() }) })
    if (response.ok) { dmDraft.value = ''; await refreshDmHistory() }
    else dmError.value = '消息发送失败，请重试。'
  } catch { dmError.value = '网络异常，消息未发送。' }
  finally { dmSending.value = false }
}
watch(page, (current) => { if (current !== 'dm') stopDmPolling() })
const chemistryResult = computed(() => ({
  rapport: Math.round((roundScores.value.reduce((sum, score) => sum + score, 0) / Math.max(1, roundScores.value.length)) || 82),
  spark: Math.min(100, selectedReport.value.total + 10),
  complement: Math.min(100, 72 + selectedReport.value.complements.length * 9),
}))

onMounted(() => { preloadTarotBacks(); if (!stage.value) return; const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; gsap.from('.shell', { autoAlpha: 0, y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 0.8, ease: 'power3.out' }) })
onMounted(async () => {
  localStorage.setItem('ai-chemistry-device-id', deviceId.value)
  if (proximityId.value) {
    // 扫码加入：未登录先去登录，登录成功后再进入配对等待
    if (!(await loadAccount())) { pendingProximity.value = true; page.value = 'auth'; return }
    connectMethod.value = 'proximity'
    page.value = 'connect'
    startProximityPolling()
    return
  }
  if (await loadAccount()) {
    if (currentUser.value?.animal) page.value = 'account'
    else { drawDeck(); page.value = 'cards' }
    return
  }
  page.value = 'auth'
})
watch(page, async () => { await nextTick(); gsap.fromTo('.page-content', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }) })
watch(page, (current) => { if (current === 'connect') startProximityPolling(); else stopProximityPolling() })
watch(connectMethod, async (method) => {
  if (method !== 'qr') return
  qrDataUrl.value = await QRCode.toDataURL(`${window.location.origin}/?proximity=join`, { width: 240, margin: 1, color: { dark: '#0b1426', light: '#f4efe3' } })
  // 出码方生成二维码后立即进入配对等待，对方扫码加入即自动开玩
  proximityError.value = ''
  startProximityPolling()
})
watch(page, (current) => {
  if (current === 'cards') startAutoRotate()
  else stopAutoRotate()
  if (current === 'connect') startProximityPolling()
  else stopProximityPolling()
})

function focusTarot(index: number) {
  // 计算让被点击卡片平滑对齐到正前方的角度
  const stepDeg = 360 / Math.max(1, deck.value.length)
  const targetAngle = (360 - (index * stepDeg)) % 360
  rotationAngle.value = targetAngle
  cardIndex.value = index
  tarotFlipped.value = true
}
function swipeTarot(direction: -1 | 1) {
  cardIndex.value = (cardIndex.value + direction + Math.max(1, deck.value.length)) % Math.max(1, deck.value.length)
  const stepDeg = 360 / Math.max(1, deck.value.length)
  rotationAngle.value = (360 - (cardIndex.value * stepDeg)) % 360
  tarotFlipped.value = false
}

async function answer(label: string) {
  const card = currentCard.value
  const selected = new Set(answers.value[card.id]?.split(',').filter(Boolean))
  if (card.multi) { selected.has(label) ? selected.delete(label) : selected.size < 3 && selected.add(label); answers.value[card.id] = [...selected].join(','); return }
  answers.value[card.id] = label
  await settleCard()
}

async function confirmMultiAnswer() {
  if ((answers.value[currentCard.value.id]?.split(',').filter(Boolean).length ?? 0) !== 3) return
  await settleCard()
}

async function settleCard() {
  const answeredCard = currentCard.value
  if (!answeredCard) return
  tarotFlipped.value = false
  sessionCards.value = [...sessionCards.value, answeredCard]
  answeredCardIds.value = [...new Set([...answeredCardIds.value, answeredCard.id])]
  persistAnsweredCards()
  if (answeredCount.value >= QUIZ_DRAW) { await submitAnswers(); return }

  const activeIds = new Set(deck.value.map((card) => card.id))
  activeIds.delete(answeredCard.id)
  let candidates = CARDS.filter((card) => !answeredCardIds.value.includes(card.id) && !activeIds.has(card.id))
  if (!candidates.length) {
    const sessionIds = new Set(sessionCards.value.map((card) => card.id))
    answeredCardIds.value = [...sessionIds]
    persistAnsweredCards()
    candidates = CARDS.filter((card) => !sessionIds.has(card.id) && !activeIds.has(card.id))
  }
  const replacement = candidates[Math.floor(Math.random() * candidates.length)]
  if (!replacement) return
  deck.value.splice(cardIndex.value, 1, replacement)
  rotationAngle.value = (rotationAngle.value + 120) % 360
}

async function submitAnswers() {
  if (!userId.value || !authToken.value) { page.value = 'auth'; return }
  error.value = ''
  const payload = { answers: Object.entries(answers.value).flatMap(([cardId, labels]) => labels.split(',').filter(Boolean).map((optionLabel) => ({ cardId, optionLabel }))), dimensions: dna.value.dimensions, animal: animal.value, tags: dna.value.tags, dealBreakers: dna.value.dealBreakers }
  try {
    const response = await apiFetch(`/users/${userId.value}/answers`, { method: 'POST', body: JSON.stringify(payload) })
    if (!response.ok) { error.value = '测评保存失败，请重新登录后重试。'; return }
    currentUser.value = { ...(currentUser.value as User), dimensions: dna.value.dimensions, animal: animal.value, tags: dna.value.tags, deal_breakers: dna.value.dealBreakers }
    const matchResponse = await apiFetch(`/users/${userId.value}/matches`)
    matches.value = matchResponse.ok ? await matchResponse.json() as Match[] : []
    await loadHistory()
    if (!matches.value.length) populateDemoMatches()
    page.value = 'dna'
  } catch {
    error.value = '网络连接异常，测评未能保存，请稍后重试。'
  }
}

function populateDemoMatches() {
  demoMatches.value = true
  const makeUser = (id: number, nickname: string, age: number, dimensions: Dimensions): User => ({ id, nickname, age, city: '上海', job: '现场参与者', purpose: profile.value.purpose, dimensions, tags: [], deal_breakers: [], animal: assignAnimal(dimensions) })
  const names = ['林澈', '安然', '肖野', '苏晚', '顾言', '程一', '许嘉', '周屿', '姜禾', '沈梨', '陆之', '温野', '秦墨', '夏栀', '韩旭', '叶青', '白露', '宋予', '穆川', '乔安']
  const users = ANIMALS.map((item, index) => makeUser(101 + index, names[index] ?? `伙伴${index + 1}`, 21 + (index % 12), item.vector))
  matches.value = users.map((user) => {
    const report = chemistry(dna.value.dimensions, user.dimensions, dna.value.tags, user.tags, dna.value.deal_breakers ?? [], animal.value, user.animal)
    // 推荐分随机分布在 80-98 之间
    report.total = Math.round((80 + Math.random() * 18) * 10) / 10
    return { user, report }
  })
}

function openMatch(id: number) {
  selectedMatchId.value = id
  page.value = 'detail'
}

function openDmFromCard(id: number) {
  selectedMatchId.value = id
  openDm()
}

async function openMatches() {
  if (!userId.value || !authToken.value) return
  error.value = ''
  try {
    const response = await apiFetch(`/users/${userId.value}/matches`)
    matches.value = response.ok ? await response.json() as Match[] : []
    if (!matches.value.length) populateDemoMatches()
    page.value = 'matches'
  } catch {
    error.value = '网络连接异常，无法加载匹配结果。'
  }
}

let proximityTimer: ReturnType<typeof setInterval> | null = null
let proximityDeadline = 0
const proximityError = ref('')
function stopProximityPolling() {
  if (proximityTimer) { clearInterval(proximityTimer); proximityTimer = null }
}
function leaveProximity() {
  stopProximityPolling()
  proximityError.value = ''
  page.value = authToken.value ? 'matches' : 'auth'
}
async function startProximityPolling() {
  stopProximityPolling()
  if (!deviceId.value) return
  proximityDeadline = Date.now() + 90_000
  proximityError.value = ''
  proximityTimer = setInterval(async () => {
    if (Date.now() > proximityDeadline) {
      stopProximityPolling()
      proximityError.value = '等待超时，未检测到附近的设备。请确认对方也已打开本页面后重试。'
      return
    }
    try {
      const response = await fetch(`${API_URL}/proximity/announce`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ deviceId: deviceId.value }) })
      if (!response.ok) { proximityError.value = response.status === 501 ? '当前服务未开启近场配对，请改用扫码加入。' : '近场服务暂时不可用，请稍后重试。'; return }
      const data = await response.json() as { nearby?: boolean; sessionId?: string }
      if (data.nearby && data.sessionId) {
        sessionId.value = data.sessionId
        stopProximityPolling()
        page.value = 'duo'; round.value = 0; roundChoice.value = ''; roundScores.value = []
      }
    } catch { /* 网络抖动时保持等待 */ }
  }, 2000)
}

function chooseRound(option: string) {
  if (roundChoice.value) return
  roundChoice.value = option
}
function enterDuo(id?: string) {
  sessionId.value = id ?? `mock-session-${Date.now()}`
  page.value = 'duo'
  round.value = 0
  roundChoice.value = ''
  roundScores.value = []
  startDestinyPolling()
}

async function connect() {
  connectMethod.value = 'proximity'
  page.value = 'connect'
  await announceProximity()
  startProximityPolling()
}

async function announceProximity(device = deviceId.value): Promise<{ sessionId?: string }> {
  try {
    const response = await fetch(`${API_URL}/proximity/announce`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify({ deviceId: device }) })
    if (!response.ok) return {}
    return await response.json() as { sessionId?: string }
  } catch { return {} }
}

function stopDestinyPolling() {
  if (destinyTimer) { clearInterval(destinyTimer); destinyTimer = null }
}
async function refreshDestiny() {
  if (!sessionId.value || sessionId.value.startsWith('mock-')) return
  const response = await apiFetch(`/dual-sessions/${sessionId.value}/destiny`)
  if (!response.ok) return
  destiny.value = await response.json() as DestinyState
  if (page.value === 'duo') page.value = 'destiny'
}
function startDestinyPolling() {
  stopDestinyPolling()
  void refreshDestiny()
  destinyTimer = setInterval(() => void refreshDestiny(), 1000)
}
async function startDestiny() {
  if (!sessionId.value || sessionId.value.startsWith('mock-')) { destinyError.value = '需要两台已完成画像的手机完成碰一碰后，才能开启回声牌。'; return }
  destinyError.value = ''
  const response = await apiFetch(`/dual-sessions/${sessionId.value}/destiny/start`, { method: 'POST' })
  if (!response.ok) { destinyError.value = '回声牌会话未准备好，请让双方重新碰一碰。'; return }
  destiny.value = await response.json() as DestinyState
  page.value = 'destiny'
  startDestinyPolling()
}
async function destinyAction(action: 'select_question' | 'confirm_question' | 'select_card' | 'confirm_card', key?: string) {
  if (!sessionId.value) return
  const response = await apiFetch(`/dual-sessions/${sessionId.value}/destiny/action`, { method: 'POST', body: JSON.stringify({ action, key }) })
  if (response.ok) destiny.value = await response.json() as DestinyState
  else destinyError.value = '等待对方操作，或刷新后再试。'
}
function continueDuo() {
  stopDestinyPolling()
  round.value = 2
  roundChoice.value = ''
  page.value = 'duo'
}
async function nextRound() {
  if (!roundChoice.value) return
  const optionIndex = currentRound.value.options.findIndex((option) => option.label === roundChoice.value)
  roundScores.value.push(75 + (optionIndex >= 0 ? optionIndex : 0) * 4)
  if (round.value === 0) {
    round.value = 1
    roundChoice.value = ''
    return
  }
  if (round.value === 1) {
    await startDestiny()
    return
  }
  if (sessionId.value && !sessionId.value.startsWith('mock-')) {
    try { await apiFetch(`/dual-sessions/${sessionId.value}`, { method: 'PATCH', body: JSON.stringify({ rounds: roundScores.value, result: chemistryResult.value }) }) } catch { /* keep local result visible */ }
  }
  await loadHistory()
  page.value = 'result'
}

function startCards() {
  error.value = ''
  if (!authToken.value || !userId.value) { page.value = 'auth'; return }
  drawDeck()
  page.value = 'cards'
}

function restart() {
  if (authToken.value) drawDeck()
  page.value = authToken.value ? 'cards' : 'profile'
  answers.value = {}
  cardIndex.value = 0
  round.value = 0
  roundChoice.value = ''
  roundScores.value = []
  matches.value = []
  selectedMatchId.value = null
  error.value = ''
}

// ---- 内在小孩陪伴对话 ----
type ChatMessage = { role: 'user' | 'bot'; text: string; thinking?: string }
const chatMessages = ref<ChatMessage[]>([])
const chatDraft = ref('')
const chatStreaming = ref(false)
const chatError = ref('')
const chatQueued = ref('')
const chatAnimal = computed(() => currentUser.value?.animal ?? animal.value)
let chatAbort: AbortController | null = null

const chatStorageKey = () => `ai-chemistry-chat-${userId.value ?? 'guest'}`
const chatPersona = () => {
  const top = highlights.value.slice(0, 2).map((item) => `${item.label} ${item.score}`).join('、')
  const profileText = [
    `姓名:${currentUser.value?.nickname ?? '用户'}`,
    `出生日期时间:${currentUser.value?.birth_datetime ? currentUser.value.birth_datetime.replace('T', ' ') : '未知'}`,
    `星座:${currentUser.value?.zodiac ?? '未知'}`,
    `MBTI:${currentUser.value?.mbti ?? '未知'}`,
  ].join('\n')
  return `【用户前置档案】(每次对话都必须基于这些信息,不可编造)
${profileText}

  你的化身是 ${chatAnimal.value.emoji}${chatAnimal.value.name}——${chatAnimal.value.title},「${chatAnimal.value.tagline}」。
请始终以「用户的内在小孩」的第一人称视角和 TA 对话:
- 你的第一句话永远是:「我也就是你呀。」——让 TA 一开始就明白,你就是 TA 自己;
- 称呼 TA 用名字或「你」;语气稚气、真诚、直接,可以撒娇、犯傻、有小脾气,但不越界;
- 不讲大道理、不说教、不居高临下;像小孩一样好奇、坦率,也懂得 TA 需要空间;
- 结合 TA 的性格光谱(突出:${top})、星座与 MBTI,聊 TA 真正在意的事;
- 用简体中文,回复 2~4 句,像日常对话,不要写成作文。`
}

function openChat() {
  try { chatMessages.value = JSON.parse(localStorage.getItem(chatStorageKey()) ?? '[]') as ChatMessage[] } catch { chatMessages.value = [] }
  if (!chatMessages.value.length) chatMessages.value = [{ role: 'bot', text: '我也就是你呀。' }]
  chatError.value = ''
  chatQueued.value = ''
  page.value = 'chat'
}

function persistChat() {
  try { localStorage.setItem(chatStorageKey(), JSON.stringify(chatMessages.value.slice(-40))) } catch { /* 存储不可用时忽略 */ }
}

async function sendChat() {
  const query = chatDraft.value.trim()
  if (!query || chatStreaming.value) return
  chatDraft.value = ''
  chatError.value = ''
  chatQueued.value = ''
  chatMessages.value.push({ role: 'user', text: query })
  const reply = reactive<ChatMessage>({ role: 'bot', text: '' })
  chatMessages.value.push(reply)
  chatStreaming.value = true
  chatAbort?.abort()
  chatAbort = new AbortController()
  try {
    const response = await apiFetch('/companion/chat', {
      method: 'POST',
      body: JSON.stringify({ query, user_id: String(userId.value ?? 'guest'), system_prompt: chatPersona() }),
      signal: chatAbort.signal,
    })
    if (!response.ok) throw new Error(`请求失败(HTTP ${response.status})`)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('服务端没有返回流式内容')
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const event = frame.match(/^event:(\S+)/m)?.[1] ?? ''
        const data = frame.match(/^data:(.+)$/m)?.[1] ?? ''
        if (!data) continue
        try {
          const payload = JSON.parse(data)
          const text = payload.content ?? payload.text ?? payload.message ?? (payload.delta && typeof payload.delta === 'string' ? payload.delta : undefined)
          if (event === 'delta' && text) {
            reply.text += String(text).replace(/<br\s*\/?>/g, '\n')
            chatQueued.value = ''
          } else if (event === 'message' && text) {
            reply.text += String(text).replace(/<br\s*\/?>/g, '\n')
            chatQueued.value = ''
          } else if (event === 'content' && text) {
            reply.text += String(text).replace(/<br\s*\/?>/g, '\n')
            chatQueued.value = ''
          } else if (event === 'reasoning' && payload.content) {
            reply.thinking = (reply.thinking ?? '') + payload.content
          } else if (event === 'queued') {
            chatQueued.value = `排队中:前面还有 ${payload.position ?? '?'} 个请求,约 ${Math.round((payload.est_wait_ms ?? 0) / 1000)} 秒`
          } else if (event === 'error') {
            throw new Error(payload.message || '模型请求失败')
          } else if (text) {
            // 兜底：未知事件但携带文本内容时直接追加
            reply.text += String(text).replace(/<br\s*\/?>/g, '\n')
            chatQueued.value = ''
          }
        } catch (err) {
          if (err instanceof SyntaxError) continue
          throw err
        }
      }
    }
    // 非 SSE 响应兜底：整体读取并尝试解析 JSON 中的文本
    if (!reply.text && buffer.trim()) {
      try {
        const whole = JSON.parse(buffer.trim())
        const text = whole.content ?? whole.text ?? whole.message ?? whole.reply ?? whole.data?.content ?? whole.choices?.[0]?.message?.content
        if (text) reply.text = String(text).replace(/<br\s*\/?>/g, '\n')
      } catch { /* 非 JSON 文本直接展示 */ if (buffer.trim()) reply.text = buffer.trim() }
    }
    if (!reply.text) reply.text = '(没有收到回复)'
  } catch (err) {
    if ((err as Error).name !== 'AbortError') chatError.value = (err as Error).message || '对话失败,请重试'
  } finally {
    chatStreaming.value = false
    chatAbort = null
    chatQueued.value = ''
    persistChat()
  }
}
</script>

<template>
  <main ref="stage" class="stage">
    <!-- Ambient Background Lighting -->
    <div class="glow-orb orb-top" />
    <div class="glow-orb orb-bottom" />
    <div class="grain" />

    <div class="shell">
      <!-- High-end Minimal Topbar -->
      <header class="topbar">
        <div class="brand-badge">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="9" stroke-width="1.75" />
            <path d="M12 7v10M7 12h10" stroke-width="1.75" stroke-linecap="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span class="brand-text">ECHO <em>/ 回声</em></span>
        </div>
        <div class="nav-tracker">
          <span class="nav-tag">{{ pageTitles[page]?.label }}</span>
          <div class="step-indicator">
            <span class="step-num">{{ pageTitles[page]?.step }}</span><span class="step-slash">/</span><span class="step-total">06</span>
          </div>
          <button v-if="authToken" class="account-nav-btn" @click="page = 'account'; loadHistory()">个人中心</button>
          <button v-if="authToken" class="account-nav-btn" @click="logout">退出</button>
        </div>
      </header>

      <section v-if="page === 'auth'" class="page-content auth-stage"><div class="stage-header text-center"><div class="pill-badge centered">SOCIAL DNA ACCESS</div><h1 class="section-title">先登录，<em>再认识真正的自己。</em></h1><p class="section-lead">注册后你的动物塑、性格光谱和沟通记录都会保存在个人中心。</p></div><div class="auth-mode-switch"><button type="button" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">登录</button><button type="button" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">注册</button></div><form class="glass-panel auth-card" @submit.prevent="submitAuth"><div class="input-group"><label><span class="label-txt">用户名 / USERNAME</span><input v-model.trim="authForm.username" minlength="2" maxlength="40" required /></label></div><div class="input-group"><label><span class="label-txt">密码 / PASSWORD</span><input v-model="authForm.password" type="password" minlength="6" required /></label></div><template v-if="authMode === 'register'"><div class="form-grid auth-register-grid"><div class="input-group"><label><span class="label-txt">昵称 / NAME</span><input v-model.trim="authForm.nickname" required /></label></div><div class="input-group"><label><span class="label-txt">出生日期时间 / BIRTH</span><input v-model="authForm.birth_datetime" type="datetime-local" required @click="openPicker" /></label></div><div class="input-group"><label><span class="label-txt">星座 / ZODIAC</span><select v-model="authForm.zodiac" required><option value="" disabled>选择星座</option><option v-for="item in ZODIACS" :key="item" :value="item">{{ item }}</option></select></label></div><div class="input-group"><label><span class="label-txt">MBTI</span><select v-model="authForm.mbti" required><option value="" disabled>选择 MBTI</option><option v-for="item in MBTIS" :key="item" :value="item">{{ item }}</option></select></label></div><div class="input-group"><label><span class="label-txt">城市 / CITY</span><input v-model.trim="authForm.city" required /></label></div><div class="input-group"><label><span class="label-txt">职业 / OCCUPATION</span><input v-model.trim="authForm.job" required /></label></div><div class="input-group"><label><span class="label-txt">来意 / PURPOSE</span><select v-model="authForm.purpose" required><option value="恋爱">恋爱</option><option value="朋友">朋友</option><option value="搭子">搭子</option></select></label></div></div></template><div v-if="error" class="error-banner"><span>{{ error }}</span></div><button class="primary-btn" type="submit"><span class="btn-text">{{ authMode === 'login' ? '登录个人中心' : '创建账号并开始' }}</span><span class="btn-arrow-box">→</span></button></form></section>
      <section v-else-if="page === 'account'" class="page-content account-stage"><div class="stage-header"><div class="pill-badge">MY CHEMISTRY PROFILE</div><h1 class="section-title">{{ currentUser?.nickname }} 的<em>动物塑档案。</em></h1><p class="section-lead">保存你的动物塑图片、12 维性格光谱和沟通记录。</p></div><article v-if="currentUser?.animal" class="account-animal-card"><img :src="currentUser.animal.image" :alt="currentUser.animal.name" class="account-animal-image" /><div class="account-animal-copy"><span class="totem-tag">YOUR SOCIAL DNA</span><h2>{{ currentUser.animal.name }} · {{ currentUser.animal.title }}</h2><p>{{ currentUser.animal.tagline }}</p></div><button class="primary-btn account-radar-btn" @click="openMatches"><span class="btn-text">进入火花雷达</span></button>
<button class="primary-btn account-chat-btn" @click="openChat"><span class="btn-text">和内在小孩聊聊 💬</span></button></article><article v-else class="glass-panel account-empty"><h2>还没有动物塑结果</h2><p>完成心智卡牌后生成专属卡片。</p><button class="primary-btn" @click="page = 'profile'"><span class="btn-text">开始测算</span><span class="btn-arrow-box">→</span></button></article><div v-if="currentUser?.dimensions" class="account-dimensions"><div v-for="item in DIMENSIONS" :key="item.id" class="dim-card"><div class="dim-info"><span class="dim-name">{{ item.group }} · {{ item.label }}</span><span class="dim-score">{{ currentUser.dimensions[item.id] }}</span></div><div class="dim-bar-track"><div class="dim-bar-fill" :style="{ width: `${currentUser.dimensions[item.id]}%` }" /></div></div></div><div class="account-columns"><article class="glass-panel history-card"><span class="panel-tag">COMMUNICATION LOG</span><p v-for="message in history.messages" :key="message.id" class="history-item">{{ message.content }}</p><p v-if="!history.messages.length" class="empty-history">还没有文字沟通记录。</p></article><article class="glass-panel history-card"><span class="panel-tag">ICEBREAKER HISTORY</span><p v-for="session in history.sessions" :key="session.id" class="history-item">{{ session.partner_nickname ?? '匹配伙伴' }} · {{ session.status }}</p><p v-if="!history.sessions.length" class="empty-history">还没有破冰会话记录。</p></article></div></section>
      <!-- PAGE 01: Profile Landing -->
      <section v-if="page === 'profile'" class="page-content hero-page">
        <div class="hero-header">
          <div class="pill-badge">
            <svg class="icon-sparkle" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/></svg>
            <span>SOCIAL DNA ARCHITECTURE</span>
          </div>
          <h1 class="hero-title">
            别用照片猜一个人。<br />
            <em>玩一局，见真容。</em>
          </h1>
          <p class="lead-text">
            AI 不替你社交，它只通过真实的本能抉择，为两位本该相遇的灵魂架起一座破冰桥。
          </p>
        </div>

        <div class="glass-panel profile-card-panel">
          <div class="panel-header-line">
            <span class="panel-tag">PERSONA MATRIX</span>
            <span class="panel-hint">填写基础维度，启动心智测算</span>
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label><span class="label-txt">昵称 / NAME</span><input v-model="profile.nickname" placeholder="例如：南星" maxlength="12" /></label>
            </div>
            <div class="input-group">
              <label><span class="label-txt">出生日期时间 / BIRTH</span><input v-model="profile.birth_datetime" type="datetime-local" @click="openPicker" /></label>
            </div>
            <div class="input-group">
              <label><span class="label-txt">星座 / ZODIAC</span><select v-model="profile.zodiac"><option value="" disabled>选择星座</option><option v-for="item in ZODIACS" :key="item" :value="item">{{ item }}</option></select></label>
            </div>
            <div class="input-group">
              <label><span class="label-txt">MBTI</span><select v-model="profile.mbti"><option value="" disabled>选择 MBTI</option><option v-for="item in MBTIS" :key="item" :value="item">{{ item }}</option></select></label>
            </div>
            <div class="input-group">
              <label><span class="label-txt">城市 / CITY</span><input v-model="profile.city" placeholder="上海" /></label>
            </div>
            <div class="input-group">
              <label><span class="label-txt">职业 / OCCUPATION</span><input v-model="profile.job" placeholder="产品设计师 / 建筑师" /></label>
            </div>
            <div class="input-group full-width">
              <label>
                <span class="label-txt">社交期望 / INTENTION</span>
                <div class="segmented-control">
                  <button type="button" :class="{ active: profile.purpose === '恋爱' }" @click="profile.purpose = '恋爱'">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>
                    恋爱关系
                  </button>
                  <button type="button" :class="{ active: profile.purpose === '朋友' }" @click="profile.purpose = '朋友'">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                    志趣相投
                  </button>
                  <button type="button" :class="{ active: profile.purpose === '搭子' }" @click="profile.purpose = '搭子'">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                    搭子同行
                  </button>
                </div>
              </label>
            </div>
            <div class="input-group full-width">
              <label>
                <div class="label-row">
                  <span class="label-txt">自述画像 / SELF PROMPT</span>
                  <span class="char-count">{{ profile.bio.length }}/200</span>
                </div>
                <textarea v-model="profile.bio" maxlength="200" placeholder="分享一句你的真实状态：最近在为什么事物着迷？或者周末最常出没的角落？" rows="3" />
              </label>
            </div>
          </div>

          <div v-if="error" class="error-banner">
            <svg viewBox="0 0 20 20" fill="currentColor" class="banner-icon"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            <span>{{ error }}</span>
          </div>

          <button class="primary-btn" @click="startCards">
            <span class="btn-text">让 AI 开始测算心智基因</span>
            <div class="btn-arrow-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </div>
          </button>
          <div class="footer-note">
            <span class="dot-pulse" />
            <span>只需 8 道沉浸情境选择，揭示深层性格与真实互动节奏</span>
          </div>
        </div>
      </section>

      <!-- PAGE 02: Cards Experience -->
      <section v-else-if="page === 'cards'" class="page-content cards-stage tarot-stage">
        <div v-if="error" class="error-banner">{{ error }}</div>
        <div class="quiz-nav"><div class="quiz-meta"><span class="badge-cat">TAROT DRAW</span><span class="quiz-id">题库 {{ POOL_SIZE }} · {{ progress }} 已答</span></div><div class="quiz-counter"><span class="current-step">{{ answeredCount }}</span><span class="slash">/</span><span class="max-step">{{ QUIZ_DRAW }}</span></div></div>
        <div class="quiz-progress-track"><div class="quiz-progress-bar" :style="{ width: `${(answeredCount / QUIZ_DRAW) * 100}%` }" /></div>
        <div class="tarot-intro"><span class="tarot-kicker">THE SOCIAL ARCANA</span><h1 class="tarot-title">抽一张牌，<em>看见你的第一反应。</em></h1><p>从 {{ POOL_SIZE }} 道题库中随机抽出 {{ QUIZ_DRAW }} 张。8 张全部作答后，自动进入社交基因解码。</p></div>
        <div class="tarot-carousel" aria-label="本轮八张塔罗情境牌" @touchstart="handleTarotTouchStart" @touchend="handleTarotTouchEnd">
          <button v-for="(card, index) in deck" :key="card.id" class="tarot-card" :class="{ flipped: tarotFlipped && index === cardIndex, answered: answers[card.id] }" :style="tarotTransform(index)" :aria-label="index === cardIndex && tarotFlipped ? `回答${card.title}` : '抽取这张塔罗牌'" @click="focusTarot(index)">
            <span class="tarot-card-inner"><span class="tarot-face tarot-back"><img :src="tarotBack(card)" :alt="`${card.category}塔罗牌背`" /></span><span class="tarot-face tarot-front"><span class="tarot-card-index">{{ String(index + 1).padStart(2, '0') }} · {{ card.category }}</span><strong>{{ card.title }}</strong><small>{{ card.description }}</small><span class="tarot-flip-hint">{{ card.multi ? '选择 3 项' : '选择你的答案' }}</span></span></span>
          </button>
        </div>
        <article v-if="tarotFlipped" class="tarot-answer-panel"><div class="tarot-answer-heading"><span>{{ currentCard.category }} · {{ currentCard.id }}</span><strong>{{ currentCard.title }}</strong><p>{{ currentCard.description }}</p></div><div class="options-container"><button v-for="option in currentCard.options" :key="option.label" class="option-item" :class="{ selected: answers[currentCard.id]?.split(',').includes(option.label) }" @click.stop="answer(option.label)"><span class="option-key">{{ option.label }}</span><span class="option-text">{{ option.text }}</span><span class="option-select-glow">✓</span></button></div><button v-if="currentCard.multi" class="primary-btn multi-confirm" :disabled="answers[currentCard.id]?.split(',').filter(Boolean).length !== 3" @click="confirmMultiAnswer"><span class="btn-text">确认 3 项红线</span><span>{{ answers[currentCard.id]?.split(',').filter(Boolean).length ?? 0 }}/3</span></button></article>
      </section>

      <section v-else-if="page === 'dna'" class="page-content dna-stage">
        <div v-if="error" class="error-banner">{{ error }}</div>
        <div class="stage-header text-center"><div class="pill-badge centered">SOCIAL DNA DECODED</div><h1 class="section-title">AI 眼中的你，<em>只会是一种动物。</em></h1><p class="section-lead">你的选择已经转化为 12 维性格光谱。</p></div>
        <div class="totem-hero-card"><div class="totem-pattern-grid" /><div class="totem-badge-top"><span class="totem-tag">YOUR ONE SOCIAL DNA</span><span class="totem-mix-badge">唯一动物塑</span></div><div class="totem-core"><img class="totem-animal-card" :src="animal.image" :alt="animal.name" /><div class="totem-details"><h3 class="totem-name">{{ animal.name }} · {{ animal.title }}</h3><p class="totem-desc">{{ animal.tagline }}</p></div></div></div>
        <div class="dimensions-block"><h4 class="block-title">✦ 你的性格光谱 <small>Top 4</small></h4><div class="dimension-bars-grid"><div v-for="item in highlights" :key="item.id" class="dim-card"><div class="dim-info"><span class="dim-name">{{ item.label }}</span><span class="dim-score">{{ item.score }}<small>/100</small></span></div><div class="dim-bar-track"><div class="dim-bar-fill" :style="{ width: `${item.score}%` }" /></div></div></div></div>
        <blockquote class="soul-quote"><div class="quote-symbol">“</div><p>{{ insight(animal, dna.dimensions) }}</p></blockquote>
        <details class="radar-details"><summary>查看完整 12 维雷达</summary><div class="dimension-bars-grid"><div v-for="item in DIMENSIONS" :key="item.id" class="dim-card"><div class="dim-info"><span class="dim-name">{{ item.group }} · {{ item.label }}</span><span class="dim-score">{{ dna.dimensions[item.id] }}</span></div><div class="dim-bar-track"><div class="dim-bar-fill" :style="{ width: `${dna.dimensions[item.id]}%` }" /></div></div></div></details>
        <button class="primary-btn" @click="page = 'matches'"><span class="btn-text">看看 AI 为你找到的人</span><div class="btn-arrow-box">→</div></button>
        <button class="chat-entry-btn" @click="openChat">💬 和内在小孩聊聊 →</button>
      </section>

      <section v-else-if="page === 'matches'" class="page-content matches-stage">
        <div class="stage-header"><div class="pill-badge">CHEMISTRY RADAR</div><h1 class="section-title">值得认识的，<em>从来不需要一百个。</em></h1><p class="section-lead">{{ demoMatches ? '当前为演示匹配，邀请真实同伴完成测算后自动替换。' : '每天为你筛出最多 20 位可能有火花的人。' }}</p></div>
        <div v-if="matches.length" class="matches-list-grid">
          <button
            v-for="(item, idx) in matches"
            :key="item.user.id"
            class="match-card-luxury"
            @click="openMatch(item.user.id)"
          >
            <div class="match-avatar-pill"><img v-if="item.user.animal?.image" :src="item.user.animal.image" :alt="item.user.animal.name" class="match-avatar-img" /><span v-else class="avatar-letter">{{ item.user.nickname.slice(0, 1) }}</span></div>
            <div class="match-center-info">
              <div class="match-name-row">
                <h3 class="match-user-name">{{ item.user.nickname }}</h3>
                <span class="match-age-tag">{{ item.user.age }} 岁</span>
                <span class="match-purpose-badge">{{ item.user.purpose }}</span>
              </div>
              <div class="match-job-city">
                <svg viewBox="0 0 20 20" fill="currentColor" class="meta-icon"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                <span>{{ item.user.job }} · {{ item.user.city }}</span>
              </div>
              <div class="match-spark-highlight">
                <span class="spark-dot">✦</span>
                <span class="spark-text">{{ item.report.common[0] ?? '心智共鸣强烈' }}</span>
              </div>
            </div>

            <div class="match-score-pill">
              <div class="score-number">{{ item.report.total }}</div>
              <div class="score-label">MATCH %</div>
            </div>

            <div class="match-card-actions">
              <button type="button" class="match-chat-btn" :aria-label="`和 ${item.user.nickname} 聊天`" @click.stop="openDmFromCard(item.user.id)"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg></button>
            </div>

            <div class="card-chevron">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </div>
          </button>
        </div>

        <div v-else class="empty-glass-state">
          <div class="empty-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <h3>正在等待同频信号入网...</h3>
          <p>当前空间内尚未形成足够心智聚类。建议邀请同场伙伴完成测算，火花雷达将实时点亮。</p>
        </div>
      </section>

      <!-- PAGE 05: Chemistry Detail -->
      <section v-else-if="page === 'detail'" class="page-content detail-stage">
        <button class="back-link-btn" @click="page = 'matches'">
          <svg viewBox="0 0 20 20" fill="currentColor" class="back-icon"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
          <span>返回雷达列表</span>
        </button>

        <div class="detail-header-card"><div class="avatar-large-box"><img v-if="selectedUser.animal?.image" :src="selectedUser.animal.image" :alt="selectedUser.animal.name" class="avatar-large-img" /><span v-else class="avatar-large-text">{{ selectedUser.nickname.slice(0, 1) }}</span><div class="online-indicator" /></div><div class="detail-user-main"><div class="user-badge-row"><span class="detail-pill">{{ selectedUser.purpose }}</span><span class="detail-loc">{{ selectedUser.city }}</span></div><h2 class="detail-nickname">{{ selectedUser.nickname }} · {{ selectedUser.animal?.name ?? '等待连接' }}</h2><p class="detail-job-text">{{ selectedUser.job }} · {{ selectedUser.animal?.title ?? '真实参与者' }}</p></div><div class="detail-chemistry-score"><span class="score-digit">{{ selectedReport.total }}</span><span class="score-tag">CHEMISTRY INDEX</span></div></div>
        <div class="animal-meet-card"><span>{{ animal.emoji }} {{ animal.name }}</span><strong>×</strong><span>{{ selectedUser.animal?.emoji ?? '🧪' }} {{ selectedUser.animal?.name ?? 'TA' }}</span><em>{{ selectedAnimalCombo ?? '相遇组合' }}</em></div>

        <div class="chemistry-cards-grid">
          <article class="chem-card chem-common">
            <div class="chem-card-head">
              <span class="chem-card-icon heart">♥</span>
              <h4>心智共振点</h4>
            </div>
            <div class="chem-card-body">
              <p v-for="text in selectedReport.common" :key="text" class="bullet-item">
                <span class="bullet-dot" />{{ text }}
              </p>
              <p v-if="!selectedReport.common.length" class="bullet-item">在生活步调上保持着相近的审美与节奏感。</p>
            </div>
          </article>

          <article class="chem-card chem-complement">
            <div class="chem-card-head">
              <span class="chem-card-icon star">✦</span>
              <h4>互补与惊喜</h4>
            </div>
            <div class="chem-card-body">
              <p v-for="text in selectedReport.complements" :key="text" class="bullet-item">
                <span class="bullet-dot" />{{ text }}
              </p>
              <p v-if="!selectedReport.complements.length" class="bullet-item">你们的节奏有充裕的留白空间，能互相提供新鲜视角。</p>
            </div>
          </article>

          <article class="chem-card chem-friction">
            <div class="chem-card-head">
              <span class="chem-card-icon warn">▲</span>
              <h4>相处盲区预警</h4>
            </div>
            <div class="chem-card-body">
              <p class="bullet-item">
                <span class="bullet-dot" />{{ selectedReport.friction[0] ?? '暂无明显心智摩擦，放心开启线下互动。' }}
              </p>
            </div>
          </article>
        </div>

        <blockquote class="detail-verdict-quote">
          <div class="verdict-label">AI 关系洞察结论</div>
          <p>「{{ selectedReport.judgment }}」</p>
        </blockquote>

        <div class="icebreaker-starter-box">
          <div class="starter-tag">
            <svg viewBox="0 0 20 20" fill="currentColor" class="starter-icon"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
            推荐破冰第一句话
          </div>
          <p class="starter-message">“{{ selectedReport.firstMessage }}”</p>
        </div>

        <div class="detail-action-row">
          <button class="primary-btn detail-chat-btn" @click="openDm">
            <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon-sm"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>
            <span class="btn-text">在线聊天</span>
          </button>
          <button class="primary-btn" @click="connectMethod = 'qr'; page = 'connect'">
            <span class="btn-text">生成二维码碰一碰</span>
            <div class="btn-arrow-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </div>
          </button>
        </div>
      </section>

      <!-- PAGE 06: Connect / NFC / QR -->
      <section v-else-if="page === 'connect'" class="page-content connect-stage">
        <div class="stage-header text-center">
          <div class="pill-badge centered">
            <svg class="icon-sparkle" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/></svg>
            <span>PHYSICAL HANDSHAKE</span>
          </div>
          <h1 class="section-title">
            让第一次相遇，<em>拥有真实的仪式感。</em>
          </h1>
          <p class="section-lead">
            当面碰一碰或扫码，双方手机将同步进入专属破冰交互空间。
          </p>
        </div>

        <div v-if="connectMethod !== 'proximity'" class="method-toggle-container">
          <button :class="{ active: connectMethod === 'nfc' }" class="toggle-btn" @click="connectMethod = 'nfc'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="t-icon"><path d="M6 8.5C7.5 7 9.5 6 12 6s4.5 1 6 2.5M4 6c2.5-2.5 5.5-3.5 8-3.5s5.5 1 8 3.5M8 11.5c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5M12 16a2 2 0 100-4 2 2 0 000 4z" stroke-width="1.75" stroke-linecap="round"/></svg>
            NFC 碰一碰 (推荐)
          </button>
          <button :class="{ active: connectMethod === 'qr' }" class="toggle-btn" @click="connectMethod = 'qr'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="t-icon"><rect x="3" y="3" width="7" height="7" stroke-width="1.75"/><rect x="14" y="3" width="7" height="7" stroke-width="1.75"/><rect x="3" y="14" width="7" height="7" stroke-width="1.75"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3zM18 14h3v3h-3z" fill="currentColor"/></svg>
            扫码快速加入
          </button>
        </div>

        <div class="interaction-terminal">
          <div class="terminal-corner tl" /><div class="terminal-corner tr" /><div class="terminal-corner bl" /><div class="terminal-corner br" />

          <template v-if="connectMethod === 'nfc'">
            <div class="nfc-animation-core">
              <div class="pulse-ring ring-1" />
              <div class="pulse-ring ring-2" />
              <div class="pulse-ring ring-3" />
              <div class="nfc-center-node">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="nfc-svg-icon">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 class="nfc-status-title">将两台手机背部靠近</h3>
            <p class="nfc-status-sub">或在 NFC 破冰装置上轻触，即可秒级建立同频会话</p>
          </template>

          <template v-else-if="connectMethod === 'proximity'">
            <div class="nfc-animation-core">
              <div class="pulse-ring ring-1" />
              <div class="pulse-ring ring-2" />
              <div class="pulse-ring ring-3" />
              <div class="nfc-center-node">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="nfc-svg-icon">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 class="nfc-status-title">已加入房间，等待对方设备连接…</h3>
            <p class="nfc-status-sub">两台设备同频后，将自动进入专属破冰对决</p>
            <p v-if="proximityError" class="proximity-error-text">{{ proximityError }}</p>
            <button class="primary-btn proximity-exit-btn" @click="leaveProximity"><span class="btn-text">退出等待</span></button>
          </template>

          <template v-else>
            <div class="qr-code-wrapper">
              <img v-if="qrDataUrl" :src="qrDataUrl" class="qr-image" alt="房间二维码" />
              <div v-else class="qr-placeholder-loading">生成安全令牌中...</div>
            </div>
            <h3 class="nfc-status-title">请对方扫码加入</h3>
            <p class="nfc-status-sub">对方扫码并登录后，将自动进入专属破冰对决，无需其他操作</p>
            <p v-if="proximityError" class="proximity-error-text">{{ proximityError }}</p>
            <button class="primary-btn proximity-exit-btn" @click="leaveProximity"><span class="btn-text">退出等待</span></button>
          </template>
        </div>

        <button v-if="connectMethod === 'nfc'" class="primary-btn" @click="connect">
          <span class="btn-text">NFC 碰触连接</span>
          <div class="btn-arrow-box">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </button>
      </section>

      <!-- PAGE 07: Duo Game (3 Rounds) -->
      <section v-else-if="page === 'duo'" class="page-content duo-stage">
        <div class="duo-topbar">
          <div class="duo-round-badge">
            <span class="round-prefix">ROUND 0{{ round + 1 }}</span>
            <span class="round-mode">{{ currentRound.type }}</span>
          </div>
          <div class="duo-step-dots">
            <span v-for="i in 3" :key="i" class="step-dot" :class="{ filled: round >= i - 1 }" />
          </div>
        </div>

        <div class="quiz-progress-track">
          <div class="quiz-progress-bar" :style="{ width: `${((round + 1) / 3) * 100}%` }" />
        </div>

        <article class="interactive-card duo-card">
          <div class="card-scenario-tag">{{ currentRound.tag }}</div>
          <h2 class="duo-question-title">{{ currentRound.question }}</h2>
          <p class="duo-prompt-hint">双方各自在手机上做出抉择，倒计时结束共同揭晓。</p>

          <div class="duo-options-grid">
            <button
              v-for="option in currentRound.options"
              :key="option"
              class="duo-option-btn"
              :class="{ selected: roundChoice === option }"
              @click="chooseRound(option)"
            >
              <span class="duo-opt-label">{{ option }}</span>
              <div class="duo-state-indicator">
                <span v-if="roundChoice === option" class="state-selected">已选定</span>
                <span v-else class="state-idle">选择</span>
              </div>
            </button>
          </div>
        </article>

        <button class="primary-btn" :disabled="!roundChoice" @click="nextRound">
          <span class="btn-text">{{ round === 0 ? '锁定答案 · 进入互猜' : round === 1 ? '锁定答案 · 抽一张回声牌' : '完成协作挑战 · 查看化学反应' }}</span>
          <div class="btn-arrow-box">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </button>
      </section>
      <section v-else-if="page === 'destiny'" class="page-content destiny-stage">
        <div class="destiny-heading">
          <span class="destiny-kicker">ECHO DECK · 双人命运牌</span>
          <h1>把手机放下前，<em>留一句只属于你们的话。</em></h1>
          <p>一人选择，另一人确认；手机只负责递出话题。</p>
        </div>
        <p v-if="destinyError" class="error-banner">{{ destinyError }}</p>

        <template v-if="destiny?.phase === 'question'">
          <div class="destiny-status">{{ destinyQuestionCurrent ? (destinySelectedByMe ? '已发送给对方确认' : '对方想问这一题，等你说“我也想知道”') : '从五个未来里，选一个你们都想知道的答案' }}</div>
          <div class="destiny-question-grid">
            <button v-for="question in DESTINY_QUESTIONS" :key="question.key" class="destiny-question" :class="{ selected: destiny?.questionKey === question.key }" :disabled="Boolean(destiny?.questionKey)" @click="destinyAction('select_question', question.key)">
              <span>{{ question.temperature }}</span><strong>{{ question.label }}</strong>
            </button>
          </div>
          <button v-if="destinyQuestionCurrent && !destinySelectedByMe" class="primary-btn" @click="destinyAction('confirm_question')"><span class="btn-text">我也想知道</span><span class="btn-arrow-box">→</span></button>
        </template>

        <template v-else-if="destiny?.phase === 'draw' || destiny?.phase === 'card_pending'">
          <p class="destiny-status">{{ destiny?.phase === 'card_pending' ? (destinyCardSelectedByMe ? '牌已选好，等对方确认翻开' : '对方选中了这张牌，点击确认一起翻开') : '从十二张回声牌里，凭边缘颜色抽一张写给你们的镜头' }}</p>
          <div class="destiny-deck">
            <button v-for="key in destiny?.deck" :key="key" class="destiny-card" :class="{ pending: destiny?.cardKey === key }" :style="{ '--destiny-accent': destinyCard(key)?.accent }" :disabled="destiny?.phase !== 'draw'" @click="destinyAction('select_card', key)">
              <span>回声牌</span><i>⌁</i><small>{{ destiny?.cardKey === key ? '已选择' : '抽取' }}</small>
            </button>
          </div>
          <button v-if="destiny?.phase === 'card_pending' && !destinyCardSelectedByMe" class="primary-btn" @click="destinyAction('confirm_card')"><span class="btn-text">一起翻开</span><span class="btn-arrow-box">→</span></button>
        </template>

        <template v-else-if="destiny?.phase === 'revealed' && destinyCardCurrent && destinyQuestionCurrent && destiny.reading">
          <article class="destiny-reveal" :style="{ '--destiny-accent': destinyCardCurrent.accent }">
            <div class="destiny-face"><span>{{ destinyCardCurrent.groupLabel }}</span><strong>{{ destinyCardCurrent.name }}</strong><i>{{ destinyCardCurrent.glyph }}</i></div>
            <div class="destiny-copy"><span>{{ destiny?.comboName }} · {{ destinyQuestionCurrent.label }}</span><p>{{ destiny.reading.prophecy }}</p><blockquote>{{ destiny.reading.quote }}</blockquote><div class="destiny-opener"><b>现在，问问对方：</b>{{ destiny.reading.opener }}</div></div>
          </article>
          <div class="destiny-actions"><button class="primary-btn" @click="continueDuo"><span class="btn-text">把话留给彼此，继续协作</span><span class="btn-arrow-box">→</span></button><button class="back-link-btn" @click="continueDuo">跳过，直接聊</button></div>
        </template>
      </section>

      <!-- PAGE 08: Result -->
      <section v-else-if="page === 'result'" class="page-content result-stage">
        <div class="stage-header text-center">
          <div class="pill-badge centered">
            <svg class="icon-sparkle" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/></svg>
            <span>FIRST CHEMISTRY REPORT</span>
          </div>
          <h1 class="section-title">
            你们的回声，<em>碰撞出了极佳的化学反应</em>
          </h1>
          <p class="section-lead">
            破冰考验已顺利通关，以下是双方在实时互动中显现的心智共振指标。
          </p>
        </div>

        <div class="metrics-triad-grid">
          <div class="metric-card">
            <div class="metric-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke-width="1.75"/><path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" stroke-width="1.75" stroke-linecap="round"/></svg>
            </div>
            <div class="metric-value">{{ chemistryResult.rapport }}<small>%</small></div>
            <div class="metric-name">即时默契度</div>
            <div class="metric-desc">对未言说情境的共识度</div>
          </div>

          <div class="metric-card featured">
            <div class="metric-icon-wrap featured-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="metric-value featured-value">{{ chemistryResult.spark }}<small>%</small></div>
            <div class="metric-name">火花碰撞率</div>
            <div class="metric-desc">话题探索与惊喜可能性</div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="1.75"/><path d="M12 3v18M3 12h18" stroke-width="1.75"/></svg>
            </div>
            <div class="metric-value">{{ chemistryResult.complement }}<small>%</small></div>
            <div class="metric-name">互补包容度</div>
            <div class="metric-desc">给彼此带来的增量视角</div>
          </div>
        </div>

        <blockquote class="soul-quote final-quote">
          <div class="quote-symbol">“</div>
          <p>「你们不一定需要在所有观念上完全一致，但显而易见，你们非常值得在今晚继续聊下去。」</p>
        </blockquote>

        <div class="final-actions-row">
          <button class="primary-btn" @click="restart">
            <span class="btn-text">重新测算 / 结识新伙伴</span>
            <div class="btn-arrow-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.047a1 1 0 011.885-.666A5.002 5.002 0 0018.001 13H15a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566l-.008-.008a1 1 0 01.617-1.379z" clip-rule="evenodd"/></svg>
            </div>
          </button>
        </div>
      </section>

      <!-- PAGE 09: Inner Child Chat -->
      <section v-else-if="page === 'chat'" class="page-content chat-stage">
        <div class="chat-header">
          <img :src="chatAnimal.image" class="chat-avatar" :alt="chatAnimal.name" />
          <div class="chat-header-copy">
            <h1 class="chat-title">{{ chatAnimal.emoji }} {{ chatAnimal.name }} · 你的内在小孩</h1>
            <p class="chat-subtitle">{{ chatAnimal.tagline }} —— TA 就是你心里那个还没长大的自己。</p>
          </div>
        </div>

        <div class="chat-window">
          <div v-if="!chatMessages.length" class="chat-empty">
            <p>TA 正等着你开口。<br />聊聊今天的心情、最近的烦恼，或者随便什么都行。</p>
          </div>
          <div v-for="(message, index) in chatMessages" :key="index" class="chat-msg" :class="message.role">
            <img v-if="message.role === 'bot'" :src="chatAnimal.image" class="chat-bubble-avatar" :alt="chatAnimal.name" />
            <div class="chat-bubble">
              <span class="chat-text">{{ message.text }}</span>
              <details v-if="message.thinking" class="chat-thinking"><summary>🤔 思考过程</summary><span>{{ message.thinking }}</span></details>
            </div>
          </div>
          <div v-if="chatQueued" class="chat-queued">{{ chatQueued }}</div>
          <div v-if="chatStreaming" class="chat-typing"><span class="chat-dots"><i /><i /><i /></span></div>
          <div v-if="chatError" class="chat-error">{{ chatError }}</div>
        </div>

        <div class="chat-input-row">
          <input v-model="chatDraft" class="chat-input" placeholder="和 TA 说点什么…" maxlength="500" :disabled="chatStreaming" @keyup.enter="sendChat" />
          <button class="primary-btn chat-send-btn" :disabled="chatStreaming || !chatDraft.trim()" @click="sendChat">
            <span class="btn-text">{{ chatStreaming ? '思考中…' : '发送' }}</span>
          </button>
        </div>
      </section>

      <!-- PAGE 10: Match Direct Message Chat -->
      <section v-else-if="page === 'dm'" class="page-content chat-stage dm-stage">
        <div class="chat-header">
          <img v-if="selectedUser.animal?.image" :src="selectedUser.animal.image" class="chat-avatar" :alt="selectedUser.animal.name" />
          <div v-else class="chat-avatar dm-avatar-fallback">{{ selectedUser.nickname.slice(0, 1) }}</div>
          <div class="chat-header-copy">
            <h1 class="chat-title">{{ selectedUser.nickname }} · {{ selectedUser.animal?.name ?? '匹配用户' }}</h1>
            <p class="chat-subtitle">{{ selectedUser.job }} · {{ selectedUser.city }} · 化学值 {{ selectedReport.total }}%</p>
          </div>
          <button class="back-link-btn dm-back-btn" @click="page = 'detail'"><span>返回</span></button>
        </div>

        <div class="chat-window">
          <div v-if="!selectedMessages.length" class="chat-empty">
            <p>你们还没有聊过天。<br />用推荐的第一句话开场：「{{ selectedReport.firstMessage }}」</p>
          </div>
          <div v-for="message in selectedMessages" :key="message.id" class="chat-msg" :class="Number(message.sender_id) === userId ? 'user' : 'peer'">
            <img v-if="Number(message.sender_id) !== userId && selectedUser.animal?.image" :src="selectedUser.animal.image" class="chat-bubble-avatar" :alt="selectedUser.animal.name" />
            <div class="chat-bubble">
              <span class="chat-text">{{ message.content }}</span>
              <span class="chat-time">{{ new Date(message.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
          </div>
          <div v-if="dmError" class="chat-error">{{ dmError }}</div>
        </div>

        <div class="chat-input-row">
          <input v-model="dmDraft" class="chat-input" :placeholder="`发消息给 ${selectedUser.nickname}…`" maxlength="1000" :disabled="dmSending" @keyup.enter="sendDm" />
          <button class="primary-btn chat-send-btn" :disabled="dmSending || !dmDraft.trim()" @click="sendDm">
            <span class="btn-text">{{ dmSending ? '发送中…' : '发送' }}</span>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style>
@import './style.css';
</style>
