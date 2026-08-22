import { DIMENSIONS, type Dimensions, type Dimension, type Card } from './data'

export type Animal = { id: string; emoji: string; name: string; title: string; tagline: string; vector: Dimensions }

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)))

export const emptyDimensions = (): Dimensions => Object.fromEntries(DIMENSIONS.map(({ id }) => [id, 50])) as Dimensions

export function scoreAnswers(cards: Card[], answers: Record<string, string>) {
  const dimensions = emptyDimensions()
  const tags: string[] = []
  const dealBreakers: string[] = []
  for (const item of cards) {
    for (const label of answers[item.id]?.split(',').filter(Boolean) ?? []) {
      const option = item.options.find((candidate) => candidate.label === label)
      if (!option) continue
      for (const [key, value] of Object.entries(option.weights ?? {})) dimensions[key as Dimension] = clamp(dimensions[key as Dimension] + value)
      for (const tag of option.tags ?? []) {
        tags.push(tag)
        if (['silent_treatment', 'lying', 'control', 'emotional_abuse', 'no_boundary', 'over_dependence', 'irresponsible', 'money_conflict', 'disrespect_parents', 'cancel_no_notice'].includes(tag)) dealBreakers.push(tag)
      }
    }
  }
  dimensions.chill = clamp(.35 * (100 - dimensions.emotion) + .25 * dimensions.boundary + .25 * (100 - dimensions.initiative) + 7.5)
  dimensions.chaos = clamp(.3 * dimensions.spontaneity + .3 * dimensions.initiative + .25 * dimensions.social_battery + .15 * (100 - dimensions.planning))
  dimensions.cling = clamp(.35 * dimensions.emotion + .3 * dimensions.initiative + .2 * (100 - dimensions.boundary) + .15 * dimensions.deep_talk)
  dimensions.wit = clamp(.25 * dimensions.initiative + .25 * dimensions.social_battery + .25 * dimensions.spontaneity + .25 * dimensions.deep_talk)
  return { dimensions, tags: [...new Set(tags)], dealBreakers: [...new Set(dealBreakers)].slice(0, 3) }
}

const animal = (id: string, emoji: string, name: string, title: string, tagline: string, vector: number[]): Animal => ({ id, emoji, name, title, tagline, vector: Object.fromEntries(DIMENSIONS.map(({ id }, index) => [id, vector[index]])) as Dimensions })
export const ANIMALS: Animal[] = [
  animal('A01', '🦦', '海獭', '探索陪伴者', '什么都想试，但希望有人一起试', [85,70,75,80,75,40,35,80,55,70,80,75]), animal('A02', '🦊', '狐狸', '机敏独行者', '看起来随和，其实心里有数', [70,80,60,75,55,75,50,50,60,65,45,80]), animal('A03', '🐧', '企鹅', '忠诚守护者', '慢热但长情，认定了就很稳', [45,60,55,30,70,70,85,60,75,25,70,50]), animal('A04', '🦥', '树懒', '慢热观察家', '不是冷，是在加载中', [30,65,25,40,50,85,40,25,90,15,40,35]),
  animal('A05', '🦁', '狮子', '气场主导者', '习惯拿主意，但不一定爱控场', [65,55,90,50,45,80,75,70,40,55,55,60]), animal('A06', '🐰', '兔子', '敏感回应者', '需要被看见，也需要被回应', [50,70,70,45,90,35,45,55,50,40,85,55]), animal('A07', '🐺', '哈士奇', '社交悍匪', '见人就嗨，聊天从不冷场', [90,45,85,95,50,30,20,95,40,98,60,90]), animal('A08', '🦫', '卡皮巴拉', '松弛大师', '情绪稳定到像开了勿扰模式', [40,55,35,50,25,50,30,45,98,20,50,60]),
  animal('A09', '🐱', '猫', '高冷选择性亲密', '不是难接近，是要看对眼', [55,75,40,60,60,95,55,35,80,45,30,70]), animal('A10', '🐶', '金毛', '热情忠诚派', '对喜欢的人，尾巴摇到停不下来', [70,60,85,65,70,40,45,90,50,75,85,80]), animal('A11', '🦉', '猫头鹰', '深夜深聊家', '白天社恐，夜里能聊人生', [50,95,35,30,65,80,90,30,85,15,35,55]), animal('A12', '🐿️', '松鼠', '计划囤积者', '安全感来自「我都想好了」', [55,50,60,35,55,75,95,50,70,30,65,45]),
  animal('A13', '🦋', '蝴蝶', '新鲜浪漫家', '容易被新鲜感吸引，也容易心动', [95,65,70,90,75,45,30,75,45,80,50,85]), animal('A14', '🐻', '熊', '可靠保护者', '话不多，但会在关键时刻站出来', [45,60,65,40,55,70,60,55,75,35,75,50]), animal('A15', '🦜', '鹦鹉', '气氛组组长', '有 TA 在，场子就不会冷', [75,55,90,70,60,35,40,98,55,85,70,95]), animal('A16', '🐙', '章鱼', '多线程适应者', '能同时聊三个话题还不乱', [80,85,65,75,70,60,50,70,50,70,55,75]),
  animal('A17', '🦈', '鲨鱼', '目标效率派', '不喜欢无效社交，但认准了很高效', [60,45,95,55,30,85,80,60,35,50,30,45]), animal('A18', '🐼', '熊猫', '佛系可爱系', '能躺着绝不坐着，但意外治愈', [35,50,30,45,40,60,35,40,95,25,55,65]), animal('A19', '🦩', '火烈鸟', '仪式审美家', '约会要有氛围，细节不能输', [65,70,75,80,80,55,70,75,50,65,65,90]), animal('A20', '🐬', '海豚', '共情玩闹家', '既懂你的情绪，也能把你逗笑', [80,70,80,75,85,45,40,85,60,80,75,90]),
]

export function assignAnimal(dimensions: Dimensions): Animal {
  const norm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0))
  const input = DIMENSIONS.map(({ id }) => dimensions[id])
  return ANIMALS.map((candidate) => ({ candidate, score: input.reduce((sum, value, index) => sum + value * candidate.vector[DIMENSIONS[index].id], 0) / (norm(input) * norm(DIMENSIONS.map(({ id }) => candidate.vector[id]))) })).sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))[0].candidate
}

export function dimensionHighlights(dimensions: Dimensions) { return [...DIMENSIONS].sort((a, b) => dimensions[b.id] - dimensions[a.id]).slice(0, 4).map(({ id, label }) => ({ id, label, score: dimensions[id] })) }

export function insight(animal: Animal, dimensions: Dimensions) { const highlights = dimensionHighlights(dimensions).slice(0, 2).map((item) => `${item.label} ${item.score}`).join('、'); return `你是${animal.emoji}${animal.name}——${highlights}；${animal.tagline}。` }
const combos: Record<string, string> = { 'A07:A08': '哈皮组合', 'A07:A09': '猫狗危机', 'A09:A10': '猫狗组合', 'A11:A13': '夜蝶组合', 'A05:A06': '狮兔组合', 'A03:A14': '稳如泰山', 'A17:A20': '效率×共情', 'A08:A18': '双倍松弛', 'A04:A15': '话痨×树懒' }
export function animalCombo(a?: Animal, b?: Animal) { return a?.id && b?.id ? combos[[a.id, b.id].sort().join(':')] : undefined }

export function chemistry(a: Dimensions, b: Dimensions, tagsA: string[] = [], tagsB: string[] = []) {
  const differences = DIMENSIONS.map(({ id, label }) => ({ id, label, diff: Math.abs(a[id] - b[id]) }))
  const similarity = (1 - differences.reduce((sum, item) => sum + item.diff, 0) / (DIMENSIONS.length * 100)) * 40
  const common = differences.filter((item) => item.diff < 15).sort((x, y) => x.diff - y.diff).slice(0, 3).map((item) => `你们在${item.label}上很接近。`)
  const complements: string[] = []
  if ((a.planning > 70 && b.spontaneity > 70) || (b.planning > 70 && a.spontaneity > 70)) complements.push('一个擅长规划，一个擅长把计划变成意外。')
  if ((a.initiative > 70 && b.boundary > 70) || (b.initiative > 70 && a.boundary > 70)) complements.push('一个愿意推进，一个知道如何保留空间。')
  if ((a.chaos > 75 && b.chill > 75) || (b.chaos > 75 && a.chill > 75)) complements.push('一个负责热场，一个负责稳住节奏。')
  const friction: string[] = []
  if ((a.emotion > 75 && b.boundary > 75) || (b.emotion > 75 && a.boundary > 75)) friction.push('回复节奏可能不同：一方需要回应，一方需要空间。')
  if (Math.abs(a.planning - b.planning) > 40 && Math.abs(a.spontaneity - b.spontaneity) > 40) friction.push('旅行计划方式可能需要提前说清楚。')
  const redLine = tagsA.some((tag) => tagsB.includes(tag))
  const total = Math.round(Math.max(0, Math.min(100, similarity + Math.min(20, complements.length * 6) - friction.length * 5)) * (redLine ? .5 : 1))
  return { total, common, complements, friction, redLine, judgment: redLine ? '存在价值观红线重叠，建议谨慎。' : '你们不是最像的两个人，但可能是很有火花的两个人。', firstMessage: `我看到你也在意${common[0]?.replace('你们在', '').replace('上很接近。', '') ?? '有趣的相处方式'}。如果明天突然不用上班，你最想做什么？` }
}
