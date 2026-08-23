export type DestinyQuestionKey = 'lost' | 'collab' | 'secret' | 'unspoken' | 'year_later'
export type DestinyCardKey = 'knock' | 'echo' | 'resonate' | 'arise' | 'ripple' | 'settle' | 'linger' | 'replay' | 'recall' | 'tune' | 'rhythm' | 'merge'
export type DestinyGroup = 'echoes' | 'ripples' | 'afterglow' | 'harmony'
export type Tribe = 'fire' | 'water' | 'wind' | 'earth' | 'star'
export type ComboKey = 'dual_engine' | 'hot_spring' | 'spark_bomb' | 'foundation' | 'party' | 'fire_ice' | 'adventurer' | 'chaos_fix' | 'explosion' | 'gentle_rebel' | 'chill' | 'warm_light' | 'surprise' | 'topic_machine' | 'reliable_fun'

export type DestinyReading = { prophecy: string; quote: string; opener: string }
export type AnimalIdentity = { id?: string; name?: string }

export const DESTINY_QUESTIONS: Array<{ key: DestinyQuestionKey; label: string; temperature: string; opener: string; scene: string }> = [
  { key: 'lost', label: '如果我们一起迷路了，会怎样？', temperature: '轻松 · 场景想象', opener: '你迷路时是看导航、问路，还是凭感觉继续走？', scene: '在一条没标名字的岔路口，你们会先停下来看看彼此，而不是急着找出口' },
  { key: 'collab', label: '如果我们共同完成一件事，谁会负责哪部分？', temperature: '好奇 · 信任试探', opener: '你配合别人时，喜欢被安排还是自己先找一件事做？', scene: '为了把一件小事做漂亮，你们会很快发现谁先动手、谁把细节收好' },
  { key: 'secret', label: '如果我们之间有一个秘密，它会是什么？', temperature: '亲密 · 专属感', opener: '你有没有一件只有两个人才懂的小事？', scene: '某句没有说完的话、某个同时注意到的瞬间，会慢慢长成只属于你们的暗号' },
  { key: 'unspoken', label: '我们之间会先出现哪句从没对别人说过的话？', temperature: '深度 · 独特性', opener: '你有没有一句一直想说、却还没遇到合适的人说的话？', scene: '在一段不需要填满的安静里，有人会先说出一句比预想更真的话' },
  { key: 'year_later', label: '一年后的我们，会怎么描述今天？', temperature: '温暖 · 叙事感', opener: '你回忆一个重要场景时，脑中最先浮现的是哪一个细节？', scene: '一年后回头看，你们记住的不会是主线，而是一个当时谁都没在意的小细节' },
]

export const DESTINY_CARDS: Array<{ key: DestinyCardKey; name: string; group: DestinyGroup; groupLabel: string; accent: string; lens: string; quote: string; glyph: string }> = [
  { key: 'knock', name: '叩', group: 'echoes', groupLabel: '回响组', accent: '#d3914e', lens: '最先击中你们的，会是一句谁也没准备好的话。', quote: '关系的开场，常常只是有人轻轻敲了一下。', glyph: '◌' },
  { key: 'echo', name: '应', group: 'echoes', groupLabel: '回响组', accent: '#d3914e', lens: '一个人递出的信号，会被另一个人刚好接住。', quote: '被接住的瞬间，回声就有了方向。', glyph: '◍' },
  { key: 'resonate', name: '鸣', group: 'echoes', groupLabel: '回响组', accent: '#d3914e', lens: '两个人同时笑出来的那一秒，能量会比原来更大。', quote: '同频不是一样，是一起变响。', glyph: '◎' },
  { key: 'arise', name: '起', group: 'ripples', groupLabel: '涟漪组', accent: '#6da8cf', lens: '故事会从一个看似无关的小动作里冒出来。', quote: '最值得记住的事，常常先像一颗小水珠。', glyph: '◔' },
  { key: 'ripple', name: '扩', group: 'ripples', groupLabel: '涟漪组', accent: '#6da8cf', lens: '一个临时起意会被你们越聊越大，最后变成真的。', quote: '有些默契，是越滚越大的。', glyph: '◉' },
  { key: 'settle', name: '落', group: 'ripples', groupLabel: '涟漪组', accent: '#6da8cf', lens: '热闹过去以后，留下来的会是一种很安心的安静。', quote: '最稳的靠近，不需要一直有声音。', glyph: '◒' },
  { key: 'linger', name: '留', group: 'afterglow', groupLabel: '余韵组', accent: '#a68ad1', lens: '有个小细节会被你们反复提起，每次都比上次更好笑。', quote: '留下来的从不是大事，是只有我们懂的小事。', glyph: '✦' },
  { key: 'replay', name: '忆', group: 'afterglow', groupLabel: '余韵组', accent: '#a68ad1', lens: '未来回放今天时，你们会各自记住完全不同的画面。', quote: '同一天有两份存档，拼起来才完整。', glyph: '◇' },
  { key: 'recall', name: '念', group: 'afterglow', groupLabel: '余韵组', accent: '#a68ad1', lens: '某个平常的瞬间会忽然让你们想起今天，像一盏远处亮起的灯。', quote: '想起一个人，有时只需要一束很像的光。', glyph: '·' },
  { key: 'tune', name: '调', group: 'harmony', groupLabel: '和声组', accent: '#67a77c', lens: '不用开会，你们会在一个小分歧里找到同一频道。', quote: '真正的合拍，是不必先说好。', glyph: '⌁' },
  { key: 'rhythm', name: '律', group: 'harmony', groupLabel: '和声组', accent: '#67a77c', lens: '一个快一点、一个慢一点，刚好把这段路走成自己的节奏。', quote: '好节奏不是同速，是刚好跟得上。', glyph: '≈' },
  { key: 'merge', name: '合', group: 'harmony', groupLabel: '和声组', accent: '#67a77c', lens: '做到后来会忘了是谁先开始，只记得这件事有“我们”的版本。', quote: '最好的配合，最后分不清哪一半是谁的。', glyph: '∞' },
]

const TRIBES: Record<string, Tribe> = {
  A01: 'water', A02: 'fire', A03: 'water', A04: 'earth', A05: 'fire',
  A06: 'water', A07: 'fire', A08: 'water', A09: 'wind', A10: 'star',
  A11: 'wind', A12: 'star', A13: 'wind', A14: 'earth', A15: 'star',
  A16: 'wind', A17: 'fire', A18: 'earth', A19: 'star', A20: 'star',
  海獭: 'water', 狐狸: 'fire', 企鹅: 'water', 树懒: 'earth', 狮子: 'fire',
  兔子: 'water', 哈士奇: 'fire', 卡皮巴拉: 'water', 猫: 'wind', 金毛: 'star',
  猫头鹰: 'wind', 松鼠: 'star', 蝴蝶: 'wind', 熊: 'earth', 鹦鹉: 'star',
  章鱼: 'wind', 鲨鱼: 'fire', 熊猫: 'earth', 火烈鸟: 'star', 海豚: 'star',
}

const COMBOS: Record<string, { key: ComboKey; name: string; line: string }> = {
  fire_fire: { key: 'dual_engine', name: '双引擎', line: '两个人都踩油门，连停下来笑都像在赶路' },
  water_water: { key: 'hot_spring', name: '温泉', line: '两个人都舒服地待着，连沉默都有温度' },
  wind_wind: { key: 'spark_bomb', name: '灵感炸弹', line: '两个脑洞撞到一起，话题会自己长出岔路' },
  earth_earth: { key: 'foundation', name: '地基', line: '两个人都先看脚下，所以反而走得更远' },
  star_star: { key: 'party', name: '全场最嗨', line: '两个人靠近一点，周围就会自动变热闹' },
  fire_water: { key: 'fire_ice', name: '冰火搭档', line: '一个想立刻出发，一个让这趟出发刚好不慌' },
  fire_wind: { key: 'adventurer', name: '冒险家', line: '一个敢冲，一个知道风会把路吹向哪里' },
  earth_fire: { key: 'chaos_fix', name: '闯祸镇场', line: '一个负责把故事弄得很大，一个负责把它落回地面' },
  fire_star: { key: 'explosion', name: '炸场', line: '一个制造能量，一个让能量被所有人看见' },
  water_wind: { key: 'gentle_rebel', name: '温柔叛逆', line: '表面很乖的两个人，心里都有一条想偏离的路' },
  earth_water: { key: 'chill', name: '佛系双人', line: '你们不急着证明什么，却总能把事情过得很舒服' },
  star_water: { key: 'warm_light', name: '暖场', line: '一个给人温度，一个给人光，刚好照亮彼此' },
  earth_wind: { key: 'surprise', name: '计划外惊喜', line: '一个先把事情摆好，一个让它突然有了新玩法' },
  star_wind: { key: 'topic_machine', name: '话题永动机', line: '一个出点子，一个接得住，话题永远不会落地' },
  earth_star: { key: 'reliable_fun', name: '靠谱有趣', line: '一个靠得住，一个好玩，彼此都不会无聊' },
}

export const getTribe = (animal?: AnimalIdentity): Tribe => TRIBES[animal?.id ?? ''] ?? TRIBES[animal?.name ?? ''] ?? 'star'
export const getCombo = (a?: AnimalIdentity, b?: AnimalIdentity) => {
  const pair = [getTribe(a), getTribe(b)].sort().join('_')
  return COMBOS[pair] ?? COMBOS.star_star
}

export const destinyQuestion = (key?: string) => DESTINY_QUESTIONS.find((item) => item.key === key)
export const destinyCard = (key?: string) => DESTINY_CARDS.find((item) => item.key === key)
export const shuffledDestinyDeck = () => [...DESTINY_CARDS].sort(() => Math.random() - 0.5).map((item) => item.key)

export const makeDestinyReading = (questionKey: DestinyQuestionKey, cardKey: DestinyCardKey, comboKey: ComboKey): DestinyReading => {
  const question = destinyQuestion(questionKey) ?? DESTINY_QUESTIONS[0]
  const card = destinyCard(cardKey) ?? DESTINY_CARDS[0]
  const combo = Object.values(COMBOS).find((item) => item.key === comboKey) ?? COMBOS.star_star
  return {
    prophecy: `${combo.name}的你们会${question.scene}。${combo.line}；${card.lens}`,
    quote: `「${card.quote}」`,
    opener: question.opener,
  }
}
