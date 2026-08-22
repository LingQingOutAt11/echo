export type Dimensions = Record<string, number>

export function chemistry(a: Dimensions, b: Dimensions, tagsA: string[] = [], tagsB: string[] = []) {
  const keys = ['explore', 'deep_talk', 'initiative', 'spontaneity', 'emotion', 'boundary', 'planning']
  const differences = keys.map((id) => ({ id, diff: Math.abs((a[id] ?? 50) - (b[id] ?? 50)) }))
  const similarity = (1 - differences.reduce((sum, item) => sum + item.diff, 0) / (keys.length * 100)) * 40
  const common = differences.filter((item) => item.diff < 15).slice(0, 3)
  const complements: string[] = []
  if ((a.planning > 70 && b.spontaneity > 70) || (b.planning > 70 && a.spontaneity > 70)) complements.push('一个擅长规划，一个擅长把计划变成意外。')
  if ((a.initiative > 70 && b.boundary > 70) || (b.initiative > 70 && a.boundary > 70)) complements.push('一个愿意推进，一个知道如何保留空间。')
  const friction: string[] = []
  if ((a.emotion > 75 && b.boundary > 75) || (b.emotion > 75 && a.boundary > 75)) friction.push('回复节奏可能不同：一方需要回应，一方需要空间。')
  if (Math.abs((a.planning ?? 50) - (b.planning ?? 50)) > 40 && Math.abs((a.spontaneity ?? 50) - (b.spontaneity ?? 50)) > 40) friction.push('旅行计划方式可能需要提前说清楚。')
  const redLine = tagsA.some((tag) => tagsB.includes(tag))
  const total = Math.round(Math.max(0, Math.min(100, 50 + similarity + Math.min(20, complements.length * 8) - friction.length * 5)) * (redLine ? 0.5 : 1))
  return {
    total,
    common: common.map((item) => `你们在${item.id}上很接近。`),
    complements,
    friction,
    redLine,
    judgment: redLine ? '有火花，也有需要认真沟通的地方。' : '你们不是最像的两个人，但可能是很有火花的两个人。',
    firstMessage: `我看到你也在意${common[0]?.id ?? '有趣的相处方式'}。如果明天突然不用上班，你最想做什么？`,
  }
}
