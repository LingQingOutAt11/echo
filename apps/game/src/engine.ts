import { DIMENSIONS, type Dimensions, type Dimension, type Card } from './data'

export const emptyDimensions = (): Dimensions => Object.fromEntries(DIMENSIONS.map(({ id }) => [id, 50])) as Dimensions

export function scoreAnswers(cards: Card[], answers: Record<string, string>) {
  const dimensions = emptyDimensions()
  const tags: string[] = []
  for (const item of cards) {
    const option = item.options.find((candidate) => candidate.label === answers[item.id])
    if (!option) continue
    for (const [key, value] of Object.entries(option.weights ?? {})) dimensions[key as Dimension] = Math.max(0, Math.min(100, dimensions[key as Dimension] + value))
    tags.push(...(option.tags ?? []))
  }
  return { dimensions, tags }
}

const ANIMALS: Record<string, Dimensions> = {
  海獭: { explore: 85, deep_talk: 55, initiative: 78, spontaneity: 75, emotion: 70, boundary: 40, planning: 35 },
  狐狸: { explore: 70, deep_talk: 88, initiative: 55, spontaneity: 70, emotion: 45, boundary: 82, planning: 50 },
  企鹅: { explore: 45, deep_talk: 65, initiative: 55, spontaneity: 30, emotion: 78, boundary: 72, planning: 88 },
  树懒: { explore: 35, deep_talk: 80, initiative: 35, spontaneity: 22, emotion: 55, boundary: 90, planning: 70 },
  狮子: { explore: 65, deep_talk: 50, initiative: 92, spontaneity: 58, emotion: 42, boundary: 72, planning: 78 },
  兔子: { explore: 65, deep_talk: 62, initiative: 70, spontaneity: 55, emotion: 92, boundary: 32, planning: 58 },
}

export function animalMix(dimensions: Dimensions) {
  const distance = (target: Dimensions) => Math.sqrt(DIMENSIONS.reduce((sum, { id }) => sum + (dimensions[id] - target[id]) ** 2, 0))
  const scores = Object.entries(ANIMALS).map(([name, target]) => ({ name, score: 1 / (1 + distance(target)) })).sort((a, b) => b.score - a.score)
  const total = scores.slice(0, 3).reduce((sum, item) => sum + item.score, 0)
  return scores.slice(0, 3).map((item) => ({ name: item.name, pct: Math.round((item.score / total) * 100) }))
}

export function chemistry(a: Dimensions, b: Dimensions, tagsA: string[] = [], tagsB: string[] = []) {
  const differences = DIMENSIONS.map(({ id, label }) => ({ id, label, diff: Math.abs(a[id] - b[id]) }))
  const similarity = (1 - differences.reduce((sum, item) => sum + item.diff, 0) / (DIMENSIONS.length * 100)) * 40
  const common = differences.filter((item) => item.diff < 15).slice(0, 3)
  const complements: string[] = []
  if ((a.planning > 70 && b.spontaneity > 70) || (b.planning > 70 && a.spontaneity > 70)) complements.push('你们一个擅长规划，一个擅长把计划变成意外。')
  if ((a.initiative > 70 && b.boundary > 70) || (b.initiative > 70 && a.boundary > 70)) complements.push('一个愿意推进，一个知道如何保留空间。')
  const friction: string[] = []
  if (a.emotion > 75 && b.boundary > 75 || b.emotion > 75 && a.boundary > 75) friction.push('回复节奏可能不同：一方需要回应，一方需要空间。')
  if (Math.abs(a.planning - b.planning) > 40 && Math.abs(a.spontaneity - b.spontaneity) > 40) friction.push('旅行计划方式可能需要提前说清楚。')
  const redLine = tagsA.some((tag) => tagsB.includes(tag))
  const total = Math.round(Math.max(0, Math.min(100, 50 + similarity + Math.min(20, complements.length * 8) - friction.length * 5)) * (redLine ? 0.5 : 1))
  return { total, common: common.map((item) => `你们在${item.label}上很接近。`), complements, friction, redLine, judgment: redLine ? '有火花，也有需要认真沟通的地方。' : '你们不是最像的两个人，但可能是很有火花的两个人。', firstMessage: `我看到你也在意${common[0]?.label ?? '有趣的相处方式'}。如果明天突然不用上班，你最想做什么？` }
}
