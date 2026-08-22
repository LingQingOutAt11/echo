export type Dimension = 'explore' | 'deep_talk' | 'initiative' | 'spontaneity' | 'emotion' | 'boundary' | 'planning'
export type Dimensions = Record<Dimension, number>
export type Option = { label: string; text: string; weights?: Partial<Record<Dimension, number>>; tags?: string[] }
export type Card = { id: string; category: string; title: string; description: string; options: Option[] }

export const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: 'explore', label: '探索欲' }, { id: 'deep_talk', label: '深聊倾向' }, { id: 'initiative', label: '主动程度' },
  { id: 'spontaneity', label: '随性程度' }, { id: 'emotion', label: '情绪敏感度' }, { id: 'boundary', label: '边界感' }, { id: 'planning', label: '计划性' },
]

const card = (id: string, category: string, title: string, description: string, options: Option[]): Card => ({ id, category, title, description, options })

export const CARDS: Card[] = [
  card('R01', '关系观', '对方变冷淡', '你们刚认识，对方连续三天晚上只回复你几句话。你会？', [
    { label: 'A', text: '理解 TA 最近很忙', weights: { emotion: -5, initiative: -10, boundary: 5 } }, { label: 'B', text: '主动问是不是发生了什么', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '开始怀疑 TA 对自己没兴趣', weights: { emotion: 15, boundary: -5 } }, { label: 'D', text: '自己也减少联系', weights: { boundary: 15, initiative: -10 } }, { label: 'E', text: '直接问：「你最近是不是变冷淡了？」', weights: { initiative: 20, deep_talk: 15 } },
  ]),
  card('R02', '关系观', '吵架后的冷静', '对方说：「我现在不想聊，等我冷静一下。」你觉得？', [
    { label: 'A', text: '给 TA 时间', weights: { boundary: 10, emotion: -5 } }, { label: 'B', text: '必须当天解决', weights: { initiative: 15, emotion: 10, boundary: -10 } }, { label: 'C', text: '有点难受，但会等', weights: { emotion: 10, boundary: 5 } }, { label: 'D', text: '觉得这是冷暴力', weights: { emotion: 20, boundary: -15, deep_talk: 10 }, tags: ['silent_treatment'] }, { label: 'E', text: '自己也不再说话', weights: { boundary: 15, initiative: -15 }, tags: ['silent_treatment'] },
  ]),
  card('R03', '关系观', '临时取消约会', '周五晚上 11 点，对方突然说：「明天别去了？有点累。」', [
    { label: 'A', text: '好啊，那下次再去', weights: { spontaneity: 5, emotion: -10 } }, { label: 'B', text: '问怎么突然不去了', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '行，那我自己去', weights: { explore: 15, spontaneity: 10, boundary: 10 } }, { label: 'D', text: '失望但不会说', weights: { emotion: 15, initiative: -10 } }, { label: 'E', text: '直接开始生气', weights: { emotion: 20, boundary: -10, initiative: 10 } },
  ]),
  card('R04', '关系观', '第一次迟到', '第一次约会，对方迟到了 30 分钟，并且刚刚才告诉你。', [
    { label: 'A', text: '没关系，来了就好', weights: { emotion: -10, spontaneity: 5 } }, { label: 'B', text: '直接问为什么不提前说', weights: { initiative: 15, boundary: 10 } }, { label: 'C', text: '开个玩笑缓解气氛', weights: { initiative: 10, deep_talk: 5 } }, { label: 'D', text: '觉得对方不尊重自己', weights: { boundary: 20, emotion: 10 }, tags: ['disrespect'] },
  ]),
  card('L01', '生活方式', '周末临时邀约', '周六早上 9 点，对方发来：「走，去爬山？」', [
    { label: 'A', text: '5 分钟收拾，走', weights: { explore: 15, spontaneity: 20, initiative: 10 } }, { label: 'B', text: '问路线、吃什么', weights: { planning: 20, spontaneity: -10 } }, { label: 'C', text: '下次吧，今天想休息', weights: { spontaneity: -15, boundary: 10 } }, { label: 'D', text: '看对方想去哪里再决定', weights: { initiative: 5, spontaneity: 10 } },
  ]),
  card('L02', '生活方式', '五天旅行', '你们有 5 天假期，预算 5000。你会选择？', [
    { label: 'A', text: '极限户外', weights: { explore: 25, spontaneity: 15 } }, { label: 'B', text: '城市探索', weights: { explore: 15, planning: 10 } }, { label: 'C', text: '酒店躺平', weights: { spontaneity: -15, boundary: 10 } }, { label: 'D', text: '随便走走，不做攻略', weights: { spontaneity: 25, planning: -15 } }, { label: 'E', text: '做一份详细攻略', weights: { planning: 25, explore: 5 } },
  ]),
  card('L03', '生活方式', '突然空出一天', '你和刚认识的人临时获得一天假期，你会？', [
    { label: 'A', text: '直接去机场，到了再说', weights: { explore: 25, spontaneity: 25 } }, { label: 'B', text: '提前做一份详细攻略', weights: { planning: 25, explore: 5 } }, { label: 'C', text: '找个舒服的地方躺一天', weights: { spontaneity: -10, boundary: 15 } }, { label: 'D', text: '问对方想干嘛，跟着 TA', weights: { initiative: 10, emotion: 5 } },
  ]),
  card('L04', '生活方式', '第一次约会', '第一次线下见面，你更倾向于？', [
    { label: 'A', text: '咖啡厅，方便聊', weights: { deep_talk: 15, spontaneity: -5 } }, { label: 'B', text: '一起做个活动', weights: { explore: 15, initiative: 10 } }, { label: 'C', text: '吃饭，轻松一点', weights: { spontaneity: 5 } }, { label: 'D', text: '对方定，我配合', weights: { initiative: -10, boundary: 5 } },
  ]),
  card('V01', '价值观', '人生排序', '如果未来 5 年只能优先选择 3 件事，你会选？', [
    { label: 'A', text: '财富', weights: { planning: 10 }, tags: ['value_wealth'] }, { label: 'B', text: '爱情', weights: { emotion: 15 }, tags: ['value_love'] }, { label: 'C', text: '家庭', weights: { planning: 10 }, tags: ['value_family'] }, { label: 'D', text: '自由', weights: { spontaneity: 15, explore: 10 }, tags: ['value_freedom'] }, { label: 'E', text: '事业成就', weights: { planning: 15, initiative: 10 }, tags: ['value_career'] }, { label: 'F', text: '稳定生活', weights: { planning: 15, spontaneity: -10 }, tags: ['value_stability'] }, { label: 'G', text: '探索世界', weights: { explore: 20 }, tags: ['value_explore'] },
  ]),
  card('V02', '价值观', '遇到分歧', '如果你的伴侣和你的选择完全不一样，你会？', [
    { label: 'A', text: '尊重差异，各过各的', weights: { boundary: 15, deep_talk: 5 } }, { label: 'B', text: '尝试说服对方', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '重新考虑这段关系', weights: { boundary: 20, emotion: 10 } }, { label: 'D', text: '找到平衡点', weights: { deep_talk: 15, planning: 10 } },
  ]),
  card('V03', '价值观', '突然获得 100 万', '如果突然获得 100 万，你第一反应？', [
    { label: 'A', text: '存起来', weights: { planning: 20 }, tags: ['money_save'] }, { label: 'B', text: '买房', weights: { planning: 15 }, tags: ['money_stable'] }, { label: 'C', text: '旅行', weights: { explore: 20, spontaneity: 15 } }, { label: 'D', text: '投资', weights: { planning: 10, initiative: 10 } }, { label: 'E', text: '辞职做想做的事', weights: { spontaneity: 20, explore: 15 } },
  ]),
  card('M01', '金钱观', '酒店预算', '你愿意花 3000 元住一晚好酒店，TA 认为 500 元足够。你会？', [
    { label: 'A', text: '各住各的标准', weights: { boundary: 15 }, tags: ['money_independent'] }, { label: 'B', text: '说服 TA', weights: { initiative: 15 } }, { label: 'C', text: '按平均预算', weights: { deep_talk: 10 }, tags: ['money_compromise'] }, { label: 'D', text: '谁更在意谁决定', weights: { spontaneity: 10 } }, { label: 'E', text: '觉得价值观不合', weights: { boundary: 10, deep_talk: 5 } },
  ]),
  card('M02', '金钱观', '第一次买单', '第一次约会，谁应该买单？', [
    { label: 'A', text: '主动邀请的人', tags: ['pay_inviter'] }, { label: 'B', text: 'AA', tags: ['pay_aa'] }, { label: 'C', text: '谁想请谁请', tags: ['pay_flexible'] }, { label: 'D', text: '轮流', tags: ['pay_alternate'] },
  ]),
  card('M03', '金钱观', '收入差距', '如果双方收入差距很大，消费应该怎么安排？', [
    { label: 'A', text: '各自承担各自的', weights: { boundary: 15 }, tags: ['money_separate'] }, { label: 'B', text: '收入高的人多承担', tags: ['money_proportional'] }, { label: 'C', text: '完全 AA', tags: ['pay_aa'] }, { label: 'D', text: '一起商量', weights: { deep_talk: 15 } },
  ]),
  card('B01', '社交边界', '异性朋友', '伴侣和异性朋友凌晨 1 点还在聊天。你？', [
    { label: 'A', text: '完全不介意', weights: { boundary: -20, emotion: -10 } }, { label: 'B', text: '会问一下是谁', weights: { initiative: 10, boundary: 5 } }, { label: 'C', text: '有点介意但不说', weights: { emotion: 15, boundary: 5, initiative: -5 } }, { label: 'D', text: '明确表达不舒服', weights: { initiative: 15, boundary: 15 } }, { label: 'E', text: '认为这是底线问题', weights: { boundary: 25 }, tags: ['boundary_strict'] },
  ]),
  card('B02', '社交边界', '查看手机', '伴侣说：「我能看看你的手机吗？」你会？', [
    { label: 'A', text: '可以啊', weights: { boundary: -15 } }, { label: 'B', text: '不舒服，但可以讨论', weights: { boundary: 10, deep_talk: 10 } }, { label: 'C', text: '不行，这是隐私', weights: { boundary: 25 } }, { label: 'D', text: '看情况', weights: { boundary: 5 } },
  ]),
  card('B03', '社交边界', '回复速度', '你发消息后，对方 3 小时才回。你会？', [
    { label: 'A', text: '无所谓', weights: { emotion: -10, boundary: 10 } }, { label: 'B', text: '有点在意但不说', weights: { emotion: 10 } }, { label: 'C', text: '会直接问', weights: { initiative: 15, deep_talk: 10 } }, { label: 'D', text: '自己也变慢', weights: { boundary: 10, initiative: -10 } },
  ]),
  card('B04', '社交边界', '独处时间', '周末你想独处，但对方想一直待在一起。你会？', [
    { label: 'A', text: '今天陪 TA', weights: { emotion: 10, boundary: -10 } }, { label: 'B', text: '直接说需要空间', weights: { boundary: 20, initiative: 10 } }, { label: 'C', text: '安排半天各自活动', weights: { boundary: 15, planning: 10 } }, { label: 'D', text: '看对方状态再说', weights: { emotion: 10, initiative: -5 } },
  ]),
  card('D01', '红线', '最无法接受', '以下行为你最无法接受哪个？', [
    { label: 'A', text: '长期冷处理', tags: ['silent_treatment'] }, { label: 'B', text: '说谎', tags: ['lying'] }, { label: 'C', text: '控制欲强', tags: ['control'] }, { label: 'D', text: '情绪暴力', tags: ['emotional_abuse'] }, { label: 'E', text: '没有边界', tags: ['no_boundary'] },
  ]),
  card('D02', '红线', '临时取消', '如果 TA 经常不提前说就取消约会，你能接受吗？', [
    { label: 'A', text: '完全不能接受', tags: ['cancel_no_notice'] }, { label: 'B', text: '偶尔可以', weights: { boundary: 5 } }, { label: 'C', text: '看原因', weights: { deep_talk: 10 } }, { label: 'D', text: '可以接受', weights: { spontaneity: 10, boundary: -5 } },
  ]),
  card('D03', '红线', '关系中的控制', '对方希望你每天报备行程，你会？', [
    { label: 'A', text: '觉得被在乎', weights: { boundary: -15, emotion: 10 } }, { label: 'B', text: '约定重要事项报备', weights: { boundary: 5, deep_talk: 10 } }, { label: 'C', text: '明确拒绝', weights: { boundary: 25 } }, { label: 'D', text: '慢慢观察', weights: { emotion: 5 } },
  ]),
  card('D04', '红线', '冲突方式', '当对方情绪很大时，你更希望 TA？', [
    { label: 'A', text: '先离开冷静', weights: { boundary: 15 } }, { label: 'B', text: '马上说清楚', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '先抱一下', weights: { emotion: 20, boundary: -5 } }, { label: 'D', text: '之后写下来聊', weights: { planning: 10, deep_talk: 15 } },
  ]),
  card('X01', '开放题', '陌生城市', '如果你在陌生城市迷路了，你会？', [{ label: 'A', text: '问路', weights: { initiative: 15 } }, { label: 'B', text: '自己研究地图', weights: { planning: 15 } }, { label: 'C', text: '随便走走', weights: { spontaneity: 20, explore: 15 } }, { label: 'D', text: '找熟人帮忙', weights: { emotion: 10, deep_talk: 5 } }]),
  card('X02', '开放题', '派对现场', '一个人都不认识的派对，你会？', [{ label: 'A', text: '主动找人聊', weights: { initiative: 20 } }, { label: 'B', text: '等别人来', weights: { boundary: 15 } }, { label: 'C', text: '先观察', weights: { emotion: 10, planning: 5 } }, { label: 'D', text: '直接离开', weights: { boundary: 20 } }]),
  card('X03', '开放题', '最后一班车', '旅行快结束时，你发现还有一个地方没去。', [{ label: 'A', text: '现在就去', weights: { explore: 20, spontaneity: 20 } }, { label: 'B', text: '下次再来', weights: { planning: 10, boundary: 10 } }, { label: 'C', text: '查好路线再去', weights: { planning: 20 } }, { label: 'D', text: '问同行者', weights: { deep_talk: 10, initiative: 5 } }]),
  card('X04', '开放题', '一小时空档', '突然多出一小时，你会？', [{ label: 'A', text: '找朋友', weights: { initiative: 10, emotion: 10 } }, { label: 'B', text: '一个人发呆', weights: { boundary: 15 } }, { label: 'C', text: '探索附近', weights: { explore: 15, spontaneity: 10 } }, { label: 'D', text: '完成待办', weights: { planning: 20 } }]),
]
