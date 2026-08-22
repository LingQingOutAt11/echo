<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import QRCode from 'qrcode'
import { CARDS, DIMENSIONS, type Dimensions } from './data'
import { ANIMALS, animalCombo, assignAnimal, chemistry, dimensionHighlights, insight, scoreAnswers, type Animal } from './engine'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000'
type Profile = { nickname: string; age: string; city: string; job: string; purpose: '恋爱' | '朋友' | '搭子'; bio: string }
type User = { id: number; nickname: string; age: number; city: string; job: string; purpose: string; dimensions: Dimensions; tags: string[]; deal_breakers?: string[]; animal?: Animal }
type Report = ReturnType<typeof chemistry>
type Match = { user: User; report: Report }

const demoCards = CARDS.filter((card) => ['R01', 'R02', 'L01', 'L02', 'V01', 'M01', 'B01', 'D01'].includes(card.id))
const page = ref<'profile' | 'cards' | 'dna' | 'matches' | 'detail' | 'connect' | 'duo' | 'result'>('profile')
const profile = ref<Profile>({ nickname: '', age: '', city: '上海', job: '', purpose: '朋友', bio: '' })
const answers = ref<Record<string, string>>({})
const cardIndex = ref(0)
const userId = ref<number | null>(Number(localStorage.getItem('ai-chemistry-user-id')) || null)
const matches = ref<Match[]>([])
const selectedMatchId = ref<number | null>(null)
const sessionId = ref<string | null>(null)
const connectMethod = ref<'nfc' | 'qr'>('nfc')
const qrDataUrl = ref('')
const round = ref(0)
const roundChoice = ref('')
const roundScores = ref<number[]>([])
const stage = ref<HTMLElement | null>(null)
const error = ref('')

const dna = computed(() => scoreAnswers(demoCards, answers.value))
const animal = computed(() => assignAnimal(dna.value.dimensions))
const highlights = computed(() => dimensionHighlights(dna.value.dimensions))
const currentCard = computed(() => demoCards[cardIndex.value])
const progress = computed(() => `${Math.min(cardIndex.value + 1, demoCards.length)}/${demoCards.length}`)
const selectedMatch = computed(() => matches.value.find((item) => item.user.id === selectedMatchId.value) ?? null)
const selectedReport = computed(() => selectedMatch.value?.report ?? chemistry(dna.value.dimensions, dna.value.dimensions, dna.value.tags, dna.value.tags))
const selectedUser = computed(() => selectedMatch.value?.user ?? { id: 0, nickname: '等待匹配', age: 0, city: '', job: '', purpose: '', dimensions: dna.value.dimensions, tags: [] })
const selectedAnimalCombo = computed(() => selectedMatch.value?.report.combo ?? animalCombo(animal.value, selectedMatch.value?.user.animal))

const animalAvatars = Object.fromEntries(ANIMALS.map((item) => [item.name, item])) as Record<string, Animal>

const pageTitles: Record<string, { step: string; label: string }> = {
  profile: { step: '01', label: '初见档案' },
  cards: { step: '02', label: '心智卡牌' },
  dna: { step: '03', label: '社交基因' },
  matches: { step: '04', label: '火花雷达' },
  detail: { step: '04', label: '化学解析' },
  connect: { step: '05', label: '线下接触' },
  duo: { step: '06', label: '破冰对决' },
  result: { step: '06', label: '初见结论' },
}

const roundData = [
  { type: 'AI 预测', question: '旅行时，谁会主动做攻略？', options: ['我', 'TA'], tag: 'PREDICTION' },
  { type: '默契互猜', question: '如果明天突然放假，TA 会选择？', options: ['去探索新地方', '在家躺平', '找朋友见面', '做自己的事'], tag: 'GUESS' },
  { type: '分歧挑战', question: '30 秒内决定：第一次约会谁定餐厅？', options: ['我来定', 'TA 来定', '一起决定', '交给随机'], tag: 'CHALLENGE' },
]
const currentRound = computed(() => roundData[round.value])
const chemistryResult = computed(() => ({
  rapport: Math.round((roundScores.value.reduce((sum, score) => sum + score, 0) / Math.max(1, roundScores.value.length)) || 82),
  spark: Math.min(100, selectedReport.value.total + 10),
  complement: Math.min(100, 72 + selectedReport.value.complements.length * 9),
}))

onMounted(() => {
  if (!stage.value) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  gsap.from('.shell', { autoAlpha: 0, y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 0.8, ease: 'power3.out' })
})

watch(page, async () => {
  await nextTick()
  gsap.fromTo('.page-content', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' })
})

watch(connectMethod, async (method) => {
  if (method !== 'qr' || !userId.value || !selectedMatch.value) return
  qrDataUrl.value = await QRCode.toDataURL(`${window.location.origin}/?join=${userId.value}&target=${selectedMatch.value.user.id}`, {
    width: 240,
    margin: 1,
    color: { dark: '#0b1426', light: '#f4efe3' },
  })
})

async function startCards() {
  error.value = ''
  if (!profile.value.nickname || !profile.value.age || !profile.value.job) {
    error.value = '请完善昵称、年龄和职业，AI 才能精准描摹你的心智画像。'
    return
  }
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...profile.value, age: Number(profile.value.age) }),
  })
  if (!response.ok) {
    error.value = '无法连接服务，已启用本地沉浸体验模式。'
    userId.value = Date.now()
    localStorage.setItem('ai-chemistry-user-id', String(userId.value))
    page.value = 'cards'
    return
  }
  const user = await response.json() as User
  userId.value = user.id
  localStorage.setItem('ai-chemistry-user-id', String(user.id))
  page.value = 'cards'
}

async function answer(label: string) {
  const card = currentCard.value
  const selected = new Set(answers.value[card.id]?.split(',').filter(Boolean))
  if (card.multi) {
    selected.has(label) ? selected.delete(label) : selected.size < 3 && selected.add(label)
    answers.value[card.id] = [...selected].join(',')
    return
  }
  answers.value[card.id] = label
  await advanceCards()
}

async function confirmMultiAnswer() {
  if ((answers.value[currentCard.value.id]?.split(',').filter(Boolean).length ?? 0) !== 3) return
  await advanceCards()
}

async function advanceCards() {
  if (cardIndex.value < demoCards.length - 1) { cardIndex.value += 1; return }
  if (!userId.value) userId.value = Date.now()
  const payload = { answers: Object.entries(answers.value).flatMap(([cardId, labels]) => labels.split(',').filter(Boolean).map((optionLabel) => ({ cardId, optionLabel }))), dimensions: dna.value.dimensions, animal: animal.value, tags: dna.value.tags, dealBreakers: dna.value.dealBreakers }
  try {
    const response = await fetch(`${API_URL}/users/${userId.value}/answers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) throw new Error('answers unavailable')
    const matchResponse = await fetch(`${API_URL}/users/${userId.value}/matches`)
    matches.value = matchResponse.ok ? await matchResponse.json() as Match[] : []
  } catch {
    populateDemoMatches()
  }
  page.value = 'dna'
}

function populateDemoMatches() {
  const makeUser = (id: number, nickname: string, age: number, dimensions: Dimensions): User => ({ id, nickname, age, city: '上海', job: '现场参与者', purpose: profile.value.purpose, dimensions, tags: [], animal: assignAnimal(dimensions) })
  const users = [makeUser(101, '林澈', 25, { ...dna.value.dimensions, planning: 76, boundary: 78 }), makeUser(102, '安然', 27, { ...dna.value.dimensions, deep_talk: 86, emotion: 80 }), makeUser(103, '肖野', 26, { ...dna.value.dimensions, explore: 88, spontaneity: 90 })]
  matches.value = users.map((user) => ({ user, report: chemistry(dna.value.dimensions, user.dimensions, dna.value.tags, user.tags) }))
}

function openMatch(id: number) {
  selectedMatchId.value = id
  page.value = 'detail'
}

async function connect() {
  if (!userId.value || !selectedMatch.value) return
  try {
    const response = await fetch(`${API_URL}/dual-sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userA: userId.value, userB: selectedMatch.value.user.id }),
    })
    if (response.ok) {
      sessionId.value = (await response.json() as { id: string }).id
    } else {
      sessionId.value = `mock-session-${Date.now()}`
    }
  } catch {
    sessionId.value = `mock-session-${Date.now()}`
  }
  page.value = 'duo'
  round.value = 0
  roundChoice.value = ''
  roundScores.value = []
}

function chooseRound(option: string) {
  roundChoice.value = option
  roundScores.value = [...roundScores.value, round.value === 2 ? 94 : option === 'TA' ? 82 : 88]
}

async function nextRound() {
  if (!roundChoice.value) return
  if (round.value < roundData.length - 1) {
    round.value += 1
    roundChoice.value = ''
    return
  }
  if (sessionId.value) {
    try {
      await fetch(`${API_URL}/dual-sessions/${sessionId.value}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rounds: roundScores.value, result: chemistryResult.value }),
      })
    } catch { /* ignore in demo */ }
  }
  page.value = 'result'
}

function restart() {
  page.value = 'profile'
  answers.value = {}
  cardIndex.value = 0
  round.value = 0
  roundChoice.value = ''
  roundScores.value = []
  matches.value = []
  selectedMatchId.value = null
  error.value = ''
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
          <span class="brand-text">HEIKESONG <em>/ 初见</em></span>
        </div>
        <div class="nav-tracker">
          <span class="nav-tag">{{ pageTitles[page]?.label }}</span>
          <div class="step-indicator">
            <span class="step-num">{{ pageTitles[page]?.step }}</span>
            <span class="step-slash">/</span>
            <span class="step-total">06</span>
          </div>
        </div>
      </header>

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
              <label><span class="label-txt">年龄 / AGE</span><input v-model="profile.age" type="number" placeholder="25" min="18" max="99" /></label>
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
      <section v-else-if="page === 'cards'" class="page-content cards-stage">
        <div class="quiz-nav"><div class="quiz-meta"><span class="badge-cat">{{ currentCard.category }}</span><span class="quiz-id">{{ currentCard.id }}</span></div><div class="quiz-counter"><span class="current-step">{{ cardIndex + 1 }}</span><span class="slash">/</span><span class="max-step">{{ demoCards.length }}</span></div></div>
        <div class="quiz-progress-track"><div class="quiz-progress-bar" :style="{ width: `${((cardIndex + 1) / demoCards.length) * 100}%` }" /></div>
        <div class="quiz-card-wrapper"><div class="card-ambient-glow" /><article class="interactive-card"><header class="card-head"><span class="card-scenario-tag">{{ currentCard.multi ? 'CHOOSE THREE' : 'SCENARIO DILEMMA' }}</span><h2 class="card-headline">{{ currentCard.title }}</h2><p class="card-narrative">{{ currentCard.description }}</p></header><div class="options-container"><button v-for="option in currentCard.options" :key="option.label" class="option-item" :class="{ selected: currentCard.multi && answers[currentCard.id]?.split(',').includes(option.label) }" @click="answer(option.label)"><span class="option-key">{{ option.label }}</span><span class="option-text">{{ option.text }}</span><span class="option-select-glow">✓</span></button></div><button v-if="currentCard.multi" class="primary-btn multi-confirm" :disabled="answers[currentCard.id]?.split(',').filter(Boolean).length !== 3" @click="confirmMultiAnswer"><span class="btn-text">确认 3 项红线</span><span>{{ answers[currentCard.id]?.split(',').filter(Boolean).length ?? 0 }}/3</span></button></article></div>
        <div class="sub-hint-row"><span>跟随第一反应；没有标准答案。</span></div>
      </section>

      <section v-else-if="page === 'dna'" class="page-content dna-stage">
        <div class="stage-header text-center"><div class="pill-badge centered">SOCIAL DNA DECODED</div><h1 class="section-title">AI 眼中的你，<em>只会是一种动物。</em></h1><p class="section-lead">你的选择已经转化为 12 维性格光谱。</p></div>
        <div class="totem-hero-card"><div class="totem-pattern-grid" /><div class="totem-badge-top"><span class="totem-tag">YOUR ONE SOCIAL DNA</span><span class="totem-mix-badge">唯一动物塑</span></div><div class="totem-core"><div class="totem-avatar-box"><span class="totem-emoji">{{ animal.emoji }}</span><div class="avatar-ring-pulse" /></div><div class="totem-details"><h3 class="totem-name">{{ animal.name }} · {{ animal.title }}</h3><p class="totem-desc">{{ animal.tagline }}</p></div></div></div>
        <div class="dimensions-block"><h4 class="block-title">✦ 你的性格光谱 <small>Top 4</small></h4><div class="dimension-bars-grid"><div v-for="item in highlights" :key="item.id" class="dim-card"><div class="dim-info"><span class="dim-name">{{ item.label }}</span><span class="dim-score">{{ item.score }}<small>/100</small></span></div><div class="dim-bar-track"><div class="dim-bar-fill" :style="{ width: `${item.score}%` }" /></div></div></div></div>
        <blockquote class="soul-quote"><div class="quote-symbol">“</div><p>{{ insight(animal, dna.dimensions) }}</p></blockquote>
        <details class="radar-details"><summary>查看完整 12 维雷达</summary><div class="dimension-bars-grid"><div v-for="item in DIMENSIONS" :key="item.id" class="dim-card"><div class="dim-info"><span class="dim-name">{{ item.group }} · {{ item.label }}</span><span class="dim-score">{{ dna.dimensions[item.id] }}</span></div><div class="dim-bar-track"><div class="dim-bar-fill" :style="{ width: `${dna.dimensions[item.id]}%` }" /></div></div></div></details>
        <button class="primary-btn" @click="page = 'matches'"><span class="btn-text">看看 AI 为你找到的人</span><div class="btn-arrow-box">→</div></button>
      </section>

      <section v-else-if="page === 'matches'" class="page-content matches-stage">
        <div class="stage-header"><div class="pill-badge">CHEMISTRY RADAR</div><h1 class="section-title">值得认识的，<em>从来不需要一百个。</em></h1><p class="section-lead">只为你筛出 3 位可能有火花的人。</p></div>
        <div v-if="matches.length" class="matches-list-grid">
          <button
            v-for="(item, idx) in matches"
            :key="item.user.id"
            class="match-card-luxury"
            @click="openMatch(item.user.id)"
          >
            <div class="match-avatar-pill"><span class="avatar-letter">{{ item.user.animal?.emoji ?? item.user.nickname.slice(0, 1) }}</span></div>
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

        <div class="detail-header-card"><div class="avatar-large-box"><span class="avatar-large-text">{{ selectedUser.animal?.emoji ?? selectedUser.nickname.slice(0, 1) }}</span><div class="online-indicator" /></div><div class="detail-user-main"><div class="user-badge-row"><span class="detail-pill">{{ selectedUser.purpose }}</span><span class="detail-loc">{{ selectedUser.city }}</span></div><h2 class="detail-nickname">{{ selectedUser.nickname }} · {{ selectedUser.animal?.name ?? '等待连接' }}</h2><p class="detail-job-text">{{ selectedUser.job }} · {{ selectedUser.animal?.title ?? '真实参与者' }}</p></div><div class="detail-chemistry-score"><span class="score-digit">{{ selectedReport.total }}</span><span class="score-tag">CHEMISTRY INDEX</span></div></div>
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

        <button class="primary-btn" @click="page = 'connect'">
          <span class="btn-text">发起线下碰一碰破冰</span>
          <div class="btn-arrow-box">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </button>
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

        <div class="method-toggle-container">
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

          <template v-else>
            <div class="qr-code-wrapper">
              <img v-if="qrDataUrl" :src="qrDataUrl" class="qr-image" alt="房间二维码" />
              <div v-else class="qr-placeholder-loading">生成安全令牌中...</div>
            </div>
            <h3 class="nfc-status-title">使用对方微信或相机扫码</h3>
            <p class="nfc-status-sub">加入实时专属房间：first-meet-{{ selectedUser.id }}</p>
          </template>
        </div>

        <button class="primary-btn" @click="connect">
          <span class="btn-text">{{ connectMethod === 'nfc' ? '模拟 NFC 碰触连接' : '已完成扫码，进入游戏' }}</span>
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
          <span class="btn-text">{{ round < 2 ? '锁定答案 · 揭晓下一题' : '完成破冰挑战 · 查看化学反应' }}</span>
          <div class="btn-arrow-box">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </button>
      </section>

      <!-- PAGE 08: Result -->
      <section v-else class="page-content result-stage">
        <div class="stage-header text-center">
          <div class="pill-badge centered">
            <svg class="icon-sparkle" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/></svg>
            <span>FIRST CHEMISTRY REPORT</span>
          </div>
          <h1 class="section-title">
            你们的初见，<em>碰撞出了极佳的化学反应</em>
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
    </div>
  </main>
</template>

<style>
/* =========================================================
   DESIGN SYSTEM: Deep Midnight & Amber Gold (Heikesong Studio)
   ========================================================= */
:root {
  --bg-deep: #070c17;
  --bg-surface: #0e1b30;
  --bg-elevated: #142540;
  --bg-overlay: rgba(14, 27, 48, 0.75);

  --accent-gold: #f1c668;
  --accent-gold-hover: #ffd782;
  --accent-gold-subtle: rgba(241, 198, 104, 0.15);
  --accent-gold-glow: rgba(241, 198, 104, 0.35);

  --text-primary: #f4efe3;
  --text-secondary: #b6c2d3;
  --text-muted: #74839b;
  --text-gold: #f1c668;

  --border-subtle: rgba(185, 211, 255, 0.12);
  --border-active: rgba(241, 198, 104, 0.5);
  --border-focused: #f1c668;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  --font-sans: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

button, input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}

/* Base Stage */
.stage {
  position: relative;
  min-height: 100vh;
  padding: 24px 20px 80px;
  background: radial-gradient(circle at 50% 0%, #172d4c 0%, #0b1426 45%, #070c17 100%);
  display: flex;
  justify-content: center;
  overflow: hidden;
}

/* Ambient Glow Orbs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(100px);
  z-index: 0;
}
.orb-top {
  width: 500px;
  height: 350px;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(49, 92, 139, 0.35) 0%, rgba(241, 198, 104, 0.08) 50%, transparent 80%);
}
.orb-bottom {
  width: 400px;
  height: 400px;
  bottom: -150px;
  right: 10%;
  background: radial-gradient(circle, rgba(241, 198, 104, 0.12) 0%, rgba(20, 37, 64, 0.4) 60%, transparent 80%);
}

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.shell {
  position: relative;
  width: 100%;
  max-width: 820px;
  z-index: 2;
  margin: 0 auto;
}

/* Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 28px;
  border-bottom: 1px solid var(--border-subtle);
}
.brand-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-icon {
  width: 20px;
  height: 20px;
  color: var(--accent-gold);
}
.brand-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #fff;
}
.brand-text em {
  font-style: normal;
  color: var(--accent-gold);
  font-weight: 400;
}
.nav-tracker {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-tag {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.step-indicator {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}
.step-num { color: var(--accent-gold); }
.step-slash { color: var(--text-muted); margin: 0 2px; }
.step-total { color: var(--text-muted); }

/* Common Page Container */
.page-content {
  margin-top: 36px;
  animation: fadeIn 0.4s ease forwards;
}

/* Hero Elements */
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--accent-gold-subtle);
  border: 1px solid rgba(241, 198, 104, 0.3);
  border-radius: var(--radius-full);
  color: var(--accent-gold);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  margin-bottom: 20px;
}
.pill-badge.centered {
  margin-left: auto;
  margin-right: auto;
}
.icon-sparkle {
  width: 12px;
  height: 12px;
}
.hero-title, .section-title {
  font-size: clamp(32px, 5.5vw, 54px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.hero-title em, .section-title em {
  color: var(--accent-gold);
  font-style: normal;
  background: linear-gradient(135deg, #ffe082 0%, #f1c668 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.lead-text, .section-lead {
  font-size: 16px;
  line-height: 1.65;
  color: var(--text-secondary);
  max-width: 600px;
  margin-bottom: 36px;
}
.text-center {
  text-align: center;
}
.text-center .section-lead {
  margin-left: auto;
  margin-right: auto;
}

/* Glass Panels */
.glass-panel {
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
.panel-header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.panel-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--accent-gold);
  font-weight: 600;
}
.panel-hint {
  font-size: 12px;
  color: var(--text-muted);
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.full-width {
  grid-column: 1 / -1;
}
.input-group label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label-txt {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #c9d8ee;
}
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.char-count {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}
.input-group input, .input-group textarea {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid rgba(185, 211, 255, 0.16);
  border-radius: var(--radius-sm);
  padding: 13px 16px;
  color: var(--text-primary);
  outline: none;
  transition: all 0.2s ease;
}
.input-group input:focus, .input-group textarea:focus {
  border-color: var(--border-focused);
  background: #192d4c;
  box-shadow: 0 0 0 3px rgba(241, 198, 104, 0.15);
}
.input-group textarea {
  resize: vertical;
  line-height: 1.5;
}

/* Segmented Control */
.segmented-control {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: var(--bg-elevated);
  padding: 4px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(185, 211, 255, 0.12);
}
.segmented-control button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: all 0.2s ease;
}
.segmented-control button.active {
  background: var(--accent-gold);
  color: var(--bg-deep);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(241, 198, 104, 0.3);
}
.btn-icon {
  width: 15px;
  height: 15px;
}

/* Buttons */
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 30px;
  padding: 18px 24px;
  background: linear-gradient(135deg, #ffd782 0%, #f1c668 100%);
  color: var(--bg-deep);
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(241, 198, 104, 0.25);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(241, 198, 104, 0.4);
}
.primary-btn:active {
  transform: translateY(0);
}
.primary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-arrow-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(11, 20, 38, 0.15);
  border-radius: var(--radius-full);
}
.btn-arrow-box svg {
  width: 16px;
  height: 16px;
}

.footer-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--text-muted);
  justify-content: center;
}
.dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-gold);
  box-shadow: 0 0 8px var(--accent-gold);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: #fca5a5;
  font-size: 13px;
}
.banner-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* =========================================================
   PAGE 02: Cards Stage
   ========================================================= */
.quiz-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.quiz-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge-cat {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-gold);
  background: var(--accent-gold-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.quiz-id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}
.quiz-counter {
  font-family: var(--font-mono);
  font-size: 14px;
}
.current-step {
  font-weight: 700;
  color: var(--accent-gold);
}
.slash {
  color: var(--text-muted);
  margin: 0 3px;
}
.max-step {
  color: var(--text-muted);
}

.quiz-progress-track {
  height: 4px;
  background: rgba(185, 211, 255, 0.1);
  border-radius: var(--radius-full);
  margin-bottom: 28px;
  overflow: hidden;
}
.quiz-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f1c668, #ffd782);
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 0 10px rgba(241, 198, 104, 0.5);
}

.quiz-card-wrapper {
  position: relative;
}
.card-ambient-glow {
  position: absolute;
  inset: -1px;
  background: radial-gradient(circle at 50% 0%, rgba(241, 198, 104, 0.2) 0%, transparent 70%);
  border-radius: var(--radius-lg);
  pointer-events: none;
}
.interactive-card {
  position: relative;
  background: var(--bg-overlay);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 36px;
}
.card-scenario-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--accent-gold);
  font-weight: 600;
}
.card-headline {
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 12px 0;
  color: #fff;
}
.card-narrative {
  font-size: 16px;
  line-height: 1.65;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.options-container {
  display: grid;
  gap: 12px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-elevated);
  border: 1px solid rgba(185, 211, 255, 0.12);
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.option-item:hover {
  border-color: var(--accent-gold);
  background: #1a2f4e;
  transform: translateX(4px);
}
.option-key {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(241, 198, 104, 0.15);
  color: var(--accent-gold);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  border-radius: 6px;
  flex-shrink: 0;
}
.option-text {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.45;
}
.option-select-glow {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  color: var(--accent-gold);
}
.option-item:hover .option-select-glow {
  opacity: 1;
  transform: scale(1);
}
.opt-check {
  width: 18px;
  height: 18px;
}
.sub-hint-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
}
.hint-icon {
  width: 14px;
  height: 14px;
}

/* =========================================================
   PAGE 03: DNA Reveal
   ========================================================= */
.totem-hero-card {
  position: relative;
  background: linear-gradient(145deg, #162b48 0%, #0d192d 100%);
  border: 1px solid rgba(241, 198, 104, 0.35);
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(241, 198, 104, 0.1);
  overflow: hidden;
}
.totem-pattern-grid {
  position: absolute;
  inset: 0;
  background-size: 24px 24px;
  background-image: linear-gradient(to right, rgba(241, 198, 104, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(241, 198, 104, 0.03) 1px, transparent 1px);
  pointer-events: none;
}
.totem-badge-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.totem-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--accent-gold);
}
.totem-mix-badge {
  font-size: 12px;
  color: var(--accent-gold);
  background: rgba(241, 198, 104, 0.15);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.totem-core {
  display: flex;
  align-items: center;
  gap: 28px;
}
.totem-avatar-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108px;
  height: 108px;
  background: radial-gradient(circle, #25466d 0%, #0e1b30 80%);
  border: 2px solid var(--accent-gold);
  border-radius: var(--radius-full);
  flex-shrink: 0;
  box-shadow: 0 0 30px rgba(241, 198, 104, 0.3);
}
.totem-emoji {
  font-size: 54px;
}
.avatar-ring-pulse {
  position: absolute;
  inset: -6px;
  border: 1px dashed rgba(241, 198, 104, 0.4);
  border-radius: var(--radius-full);
  animation: rotateSlow 24s linear infinite;
}
@keyframes rotateSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.totem-details {
  flex: 1;
}
.totem-name {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.totem-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}
.totem-composition {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mix-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
}
.mix-label {
  color: var(--text-secondary);
}
.mix-value {
  color: var(--accent-gold);
  font-weight: 600;
  font-family: var(--font-mono);
}

.dimensions-block {
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px;
  margin-bottom: 32px;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
}
.block-icon {
  width: 18px;
  height: 18px;
  color: var(--accent-gold);
}
.dimension-bars-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.dim-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dim-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.dim-name {
  color: var(--text-secondary);
}
.dim-score {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--accent-gold);
}
.dim-score small {
  color: var(--text-muted);
  font-weight: 400;
}
.dim-bar-track {
  height: 6px;
  background: rgba(185, 211, 255, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.radar-details { margin: -12px 0 24px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0 20px 18px; background: rgba(14, 27, 48, .55); }
.radar-details summary { padding: 17px 0; color: var(--accent-gold); cursor: pointer; font-size: 14px; font-weight: 600; }
.multi-confirm { margin-top: 18px; }
.option-item.selected { border-color: var(--accent-gold); background: rgba(241, 198, 104, .13); }
@media (prefers-reduced-motion: reduce) { .avatar-ring-pulse { animation: none; } }
.dim-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #315c8b, #f1c668);
  border-radius: var(--radius-full);
}

.soul-quote {
  position: relative;
  background: rgba(241, 198, 104, 0.06);
  border-left: 3px solid var(--accent-gold);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 24px 28px;
  margin-bottom: 32px;
}
.quote-symbol {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 48px;
  color: rgba(241, 198, 104, 0.15);
  font-family: Georgia, serif;
  line-height: 1;
}
.soul-quote p {
  font-size: 16px;
  line-height: 1.6;
  color: #fff;
  font-weight: 400;
}

/* =========================================================
   PAGE 04: Matches Luxury Radar
   ========================================================= */
.matches-list-grid {
  display: grid;
  gap: 16px;
}
.match-card-luxury {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-overlay);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.match-card-luxury:hover {
  border-color: var(--accent-gold);
  background: #142540;
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35), 0 0 20px rgba(241, 198, 104, 0.15);
}
.match-rank-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-gold);
  opacity: 0.6;
}
.match-avatar-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #ffd782, #f1c668);
  color: var(--bg-deep);
  font-weight: 800;
  font-size: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(241, 198, 104, 0.3);
}
.match-center-info {
  flex: 1;
}
.match-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.match-user-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.match-age-tag {
  font-size: 12px;
  color: var(--text-secondary);
}
.match-purpose-badge {
  font-size: 11px;
  color: var(--accent-gold);
  background: var(--accent-gold-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.match-job-city {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.meta-icon {
  width: 14px;
  height: 14px;
}
.match-spark-highlight {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #c4d7f5;
}
.spark-dot {
  color: var(--accent-gold);
}
.match-score-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: rgba(241, 198, 104, 0.1);
  border: 1px solid rgba(241, 198, 104, 0.25);
  border-radius: var(--radius-md);
}
.score-number {
  font-size: 26px;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--accent-gold);
  line-height: 1;
}
.score-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin-top: 4px;
}
.card-chevron {
  color: var(--text-muted);
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}
.match-card-luxury:hover .card-chevron {
  transform: translateX(3px);
  color: var(--accent-gold);
}

.empty-glass-state {
  text-align: center;
  padding: 60px 30px;
  background: var(--bg-overlay);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
}
.empty-icon-wrap {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--accent-gold);
}
.empty-glass-state h3 {
  font-size: 18px;
  color: #fff;
  margin-bottom: 8px;
}
.empty-glass-state p {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 440px;
  margin: 0 auto;
  line-height: 1.6;
}

/* =========================================================
   PAGE 05: Detail Stage
   ========================================================= */
.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  transition: color 0.2s ease;
}
.back-link-btn:hover {
  color: var(--accent-gold);
}
.back-icon {
  width: 16px;
  height: 16px;
}

.detail-header-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px;
  margin-bottom: 28px;
}
.avatar-large-box {
  position: relative;
  width: 76px;
  height: 76px;
  background: linear-gradient(135deg, #ffd782, #f1c668);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(241, 198, 104, 0.35);
}
.avatar-large-text {
  font-size: 32px;
  font-weight: 800;
  color: var(--bg-deep);
}
.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 2px solid var(--bg-surface);
  border-radius: 50%;
}
.animal-meet-card { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: -8px 0 20px; padding: 13px 16px; color: var(--text-secondary); background: rgba(241, 198, 104, .08); border: 1px solid rgba(241, 198, 104, .24); border-radius: var(--radius-md); }
.animal-meet-card strong, .animal-meet-card em { color: var(--accent-gold); font-style: normal; }
.detail-user-main {
  flex: 1;
}
.user-badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}
.detail-pill {
  font-size: 11px;
  color: var(--accent-gold);
  background: var(--accent-gold-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.detail-loc {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 0;
}
.detail-nickname {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}
.detail-job-text {
  font-size: 14px;
  color: var(--text-secondary);
}
.detail-chemistry-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.score-digit {
  font-family: var(--font-mono);
  font-size: 42px;
  font-weight: 800;
  color: var(--accent-gold);
  line-height: 1;
}
.score-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-top: 4px;
}

.chemistry-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.chem-card {
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 22px;
}
.chem-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}
.chem-card-icon {
  font-size: 14px;
}
.chem-card-icon.heart { color: #f43f5e; }
.chem-card-icon.star { color: #f1c668; }
.chem-card-icon.warn { color: #f59e0b; }
.chem-card-head h4 {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.chem-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.bullet-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-gold);
  margin-top: 7px;
  flex-shrink: 0;
}

.detail-verdict-quote {
  background: rgba(241, 198, 104, 0.08);
  border: 1px solid rgba(241, 198, 104, 0.25);
  border-radius: var(--radius-md);
  padding: 22px 24px;
  margin-bottom: 24px;
}
.verdict-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent-gold);
  margin-bottom: 8px;
}
.detail-verdict-quote p {
  font-size: 15px;
  color: #fff;
  line-height: 1.6;
}

.icebreaker-starter-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  margin-bottom: 28px;
}
.starter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-gold);
  margin-bottom: 8px;
}
.starter-icon {
  width: 14px;
  height: 14px;
}
.starter-message {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
  font-style: italic;
}

/* =========================================================
   PAGE 06: Connect / Terminal
   ========================================================= */
.method-toggle-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}
.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}
.toggle-btn.active {
  background: var(--accent-gold);
  color: var(--bg-deep);
  border-color: var(--accent-gold);
  box-shadow: 0 4px 16px rgba(241, 198, 104, 0.3);
}
.t-icon {
  width: 16px;
  height: 16px;
}

.interaction-terminal {
  position: relative;
  background: var(--bg-overlay);
  border: 1px solid rgba(241, 198, 104, 0.3);
  border-radius: var(--radius-lg);
  padding: 48px 24px;
  text-align: center;
  margin-bottom: 30px;
  overflow: hidden;
}
.terminal-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--accent-gold);
}
.terminal-corner.tl { top: 8px; left: 8px; border-top: 2px solid; border-left: 2px solid; }
.terminal-corner.tr { top: 8px; right: 8px; border-top: 2px solid; border-right: 2px solid; }
.terminal-corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid; border-left: 2px solid; }
.terminal-corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid; border-right: 2px solid; }

.nfc-animation-core {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pulse-ring {
  position: absolute;
  border: 1px solid var(--accent-gold);
  border-radius: 50%;
  animation: pulseScale 3s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}
.ring-1 { width: 140px; height: 140px; opacity: 0.2; animation-delay: 0s; }
.ring-2 { width: 100px; height: 100px; opacity: 0.4; animation-delay: 0.5s; }
.ring-3 { width: 68px; height: 68px; opacity: 0.6; animation-delay: 1s; }
@keyframes pulseScale {
  0% { transform: scale(0.85); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 0.2; }
  100% { transform: scale(0.85); opacity: 0.8; }
}

.nfc-center-node {
  position: relative;
  width: 58px;
  height: 58px;
  background: var(--accent-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-deep);
  box-shadow: 0 0 30px var(--accent-gold);
}
.nfc-svg-icon {
  width: 26px;
  height: 26px;
}
.nfc-status-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.nfc-status-sub {
  font-size: 14px;
  color: var(--text-secondary);
}

.qr-code-wrapper {
  background: #fff;
  padding: 12px;
  border-radius: var(--radius-md);
  display: inline-block;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.qr-image {
  display: block;
  width: 200px;
  height: 200px;
}
.qr-placeholder-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-deep);
  font-size: 13px;
}

/* =========================================================
   PAGE 07: Duo Stage
   ========================================================= */
.duo-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.duo-round-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}
.round-prefix {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-gold);
}
.round-mode {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-surface);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.duo-step-dots {
  display: flex;
  gap: 6px;
}
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(185, 211, 255, 0.2);
  transition: all 0.3s ease;
}
.step-dot.filled {
  background: var(--accent-gold);
  box-shadow: 0 0 6px var(--accent-gold);
}

.duo-card {
  margin-bottom: 28px;
}
.duo-question-title {
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 700;
  color: #fff;
  margin: 12px 0 8px;
}
.duo-prompt-hint {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 28px;
}

.duo-options-grid {
  display: grid;
  gap: 12px;
}
.duo-option-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.duo-option-btn:hover {
  border-color: rgba(241, 198, 104, 0.5);
  background: #1a2f4e;
}
.duo-option-btn.selected {
  border-color: var(--accent-gold);
  background: rgba(241, 198, 104, 0.12);
  box-shadow: 0 0 0 1px var(--accent-gold);
}
.duo-opt-label {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.duo-state-indicator span {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.state-selected {
  color: var(--bg-deep);
  background: var(--accent-gold);
}
.state-idle {
  color: var(--text-muted);
  background: rgba(185, 211, 255, 0.08);
}

/* =========================================================
   PAGE 08: Result Stage
   ========================================================= */
.metrics-triad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.metric-card {
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  text-align: center;
  transition: transform 0.2s ease;
}
.metric-card.featured {
  background: linear-gradient(145deg, #182e4e 0%, #0e1c32 100%);
  border-color: rgba(241, 198, 104, 0.4);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(241, 198, 104, 0.15);
  transform: translateY(-4px);
}
.metric-icon-wrap {
  width: 38px;
  height: 38px;
  margin: 0 auto 12px;
  color: var(--text-secondary);
}
.metric-icon-wrap.featured-icon {
  color: var(--accent-gold);
}
.metric-value {
  font-family: var(--font-mono);
  font-size: 40px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin-bottom: 6px;
}
.metric-value.featured-value {
  color: var(--accent-gold);
}
.metric-value small {
  font-size: 18px;
  font-weight: 600;
}
.metric-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}
.metric-desc {
  font-size: 11px;
  color: var(--text-muted);
}
.final-quote {
  margin-bottom: 36px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =========================================================
   Responsive Breakpoints
   ========================================================= */
@media (max-width: 680px) {
  .stage {
    padding: 16px 14px 60px;
  }
  .form-grid, .dimension-bars-grid, .chemistry-cards-grid, .metrics-triad-grid {
    grid-template-columns: 1fr;
  }
  .totem-core {
    flex-direction: column;
    text-align: center;
  }
  .totem-composition {
    justify-content: center;
  }
  .detail-header-card {
    flex-direction: column;
    text-align: center;
  }
  .detail-chemistry-score {
    align-items: center;
  }
  .match-card-luxury {
    flex-direction: column;
    align-items: flex-start;
  }
  .match-score-pill {
    align-self: flex-start;
  }
}
</style>
