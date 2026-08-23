export type Dimensions = Record<string, number>
type Animal = { id?: string; emoji?: string; name?: string }
type Combo = { name: string; type: '互补' | '相似' | '摩擦型' }

const keys = ['explore', 'deep_talk', 'initiative', 'spontaneity', 'emotion', 'boundary', 'planning', 'social_battery', 'chill', 'chaos', 'cling', 'wit']
const labels: Record<string, string> = { explore: '探索欲', deep_talk: '深聊力', initiative: '主动值', spontaneity: '随性值', emotion: '情绪雷达', boundary: '边界力', planning: '计划值', social_battery: '社交电量', chill: '松弛感', chaos: '整活值', cling: '黏人度', wit: '玩梗力' }
const combos: Record<string, Combo> = { 'A07:A08': { name: '哈皮组合', type: '互补' }, 'A07:A09': { name: '猫狗危机', type: '摩擦型' }, 'A09:A10': { name: '猫狗组合', type: '互补' }, 'A11:A13': { name: '夜蝶组合', type: '互补' }, 'A05:A06': { name: '狮兔组合', type: '互补' }, 'A03:A14': { name: '稳如泰山', type: '相似' }, 'A17:A20': { name: '效率×共情', type: '互补' }, 'A08:A18': { name: '双倍松弛', type: '相似' }, 'A04:A15': { name: '话痨×树懒', type: '摩擦型' } }
const comboFor = (a?: Animal, b?: Animal) => a?.id && b?.id ? combos[[a.id, b.id].sort().join(':')] : undefined
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const matchScore = (value: number) => Math.min(98, Math.max(80.1, Math.round(value * 10) / 10))

// 基于答题相似度的匹配分：重合度越高分数越高，范围 80-98
// answersA/answersB: Array<{ card_id: string; option_label: string }>
export function answerMatchScore(answersA: Array<{ card_id: string; option_label: string }>, answersB: Array<{ card_id: string; option_label: string }>) {
  if (!answersA.length || !answersB.length) return matchScore(87 + Math.random() * 2)
  const mapA = new Map<string, Set<string>>()
  const mapB = new Map<string, Set<string>>()
  for (const item of answersA) {
    if (!mapA.has(item.card_id)) mapA.set(item.card_id, new Set())
    mapA.get(item.card_id)!.add(item.option_label)
  }
  for (const item of answersB) {
    if (!mapB.has(item.card_id)) mapB.set(item.card_id, new Set())
    mapB.get(item.card_id)!.add(item.option_label)
  }
  const commonCards = [...mapA.keys()].filter((cardId) => mapB.has(cardId))
  if (!commonCards.length) return matchScore(81 + Math.random() * 3)
  let hit = 0
  let total = 0
  for (const cardId of commonCards) {
    const optionsA = mapA.get(cardId)!
    const optionsB = mapB.get(cardId)!
    const union = new Set([...optionsA, ...optionsB])
    const intersect = [...optionsA].filter((option) => optionsB.has(option)).length
    // 单卡相似度 = 交集/并集（多选也适用）
    total += union.size
    hit += intersect
  }
  const ratio = total ? hit / total : 0
  // 以答题相似度为基准映射到 80-98，叠加随机扰动让推荐分自然分布在区间内
  const base = 81 + ratio * 16
  const jitter = (Math.random() - 0.5) * 2
  return matchScore(base + jitter)
}

export function chemistry(a: Dimensions, b: Dimensions, tagsA: string[] = [], tagsB: string[] = [], dealBreakersA: string[] = [], dealBreakersB: string[] = [], animalA?: Animal, animalB?: Animal) {
  const differences = keys.map((id) => ({ id, diff: Math.abs((a[id] ?? 50) - (b[id] ?? 50)) }))
  const similarity = (1 - differences.reduce((sum, item) => sum + item.diff, 0) / (keys.length * 100)) * 40
  const common = differences.filter((item) => item.diff < 15).sort((x, y) => x.diff - y.diff).slice(0, 3).map((item) => `你们在${labels[item.id]}上很接近。`)
  const complements: string[] = []
  if ((a.planning > 70 && b.spontaneity > 70) || (b.planning > 70 && a.spontaneity > 70)) complements.push('一个擅长规划，一个擅长把计划变成意外。')
  if ((a.initiative > 70 && b.boundary > 70) || (b.initiative > 70 && a.boundary > 70)) complements.push('一个愿意推进，一个知道如何保留空间。')
  if ((a.chaos > 75 && b.chill > 75) || (b.chaos > 75 && a.chill > 75)) complements.push('一个负责热场，一个负责稳住节奏。')
  if ((a.emotion > 75 && b.chill > 75) || (b.emotion > 75 && a.chill > 75)) complements.push('一个善于感受，一个提供安定的回应。')
  const combo = comboFor(animalA, animalB)
  if (animalA?.id === animalB?.id) complements.push(`你们都是${animalA?.emoji ?? ''}${animalA?.name ?? '同一种动物塑'}，一见如故的概率很高。`)
  if (combo?.type === '互补') complements.push(`${combo.name}：${combo.name === '哈皮组合' ? '一个负责热场，一个负责稳住。' : '差异会给彼此带来新鲜视角。'}`)
  const friction: string[] = []
  if ((a.emotion > 75 && b.boundary > 75) || (b.emotion > 75 && a.boundary > 75)) friction.push('回复节奏可能不同：一方需要回应，一方需要空间。')
  if (Math.abs((a.planning ?? 50) - (b.planning ?? 50)) > 40 && Math.abs((a.spontaneity ?? 50) - (b.spontaneity ?? 50)) > 40) friction.push('旅行计划方式可能需要提前说清楚。')
  if (Math.abs((a.chaos ?? 50) - (b.chaos ?? 50)) > 50 && Math.abs((a.chill ?? 50) - (b.chill ?? 50)) > 50) friction.push('一方想整活，一方想放空，活动节奏要先商量。')
  if (combo?.type === '摩擦型') friction.push(`${combo.name}：彼此风格差异很大，适合慢一点建立默契。`)
  const redLine = dealBreakersA.some((tag) => tagsB.includes(tag)) || dealBreakersB.some((tag) => tagsA.includes(tag))
  const complementScore = Math.min(20, complements.length * 5 + (combo?.type === '互补' ? 5 : 0))
  const total = clamp((similarity + complementScore - friction.length * 5) * (redLine ? .5 : 1))
  return { total, common, complements: complements.slice(0, 2), friction: friction.slice(0, 2), redLine, combo: combo?.name, judgment: redLine ? '存在价值观红线重叠，建议谨慎。' : '你们不是最像的两个人，但可能是很有火花的两个人。', firstMessage: `我看到你也在意${common[0]?.replace('你们在', '').replace('上很接近。', '') ?? '有趣的相处方式'}。如果明天突然不用上班，你最想做什么？` }
}
