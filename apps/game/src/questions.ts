import type { Card } from './data'

const card = (id: string, category: string, title: string, description: string, options: Card['options'], multi = false): Card => ({ id, category, title, description, options, multi })

export const EXTRA_CARDS: Card[] = [
  // ============ 关系观 R05-R25 ============
  card('R05', '关系观', '暧昧期', '暧昧了三周，对方突然说「我想静静」。你会？', [
    { label: 'A', text: '好，等你想聊了再说', weights: { boundary: 15, emotion: -10 } }, { label: 'B', text: '追问发生了什么', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '有点慌，开始想是不是自己说错话', weights: { emotion: 15, boundary: -5 } }, { label: 'D', text: '找朋友分析 TA 的心思', weights: { deep_talk: 10, emotion: 5 } },
  ]),
  card('R06', '关系观', '确认关系', '你们约会了五次，气氛很好，但没人先开口确认关系。你会？', [
    { label: 'A', text: '先开口问清楚', weights: { initiative: 20, deep_talk: 10 } }, { label: 'B', text: '继续享受当下', weights: { spontaneity: 10, boundary: 5 } }, { label: 'C', text: '暗示对方主动', weights: { initiative: -5, emotion: 10 } }, { label: 'D', text: '直接不问，等 TA 说', weights: { boundary: 10, initiative: -15 } },
  ]),
  card('R07', '关系观', '异地征兆', '对方要去另一个城市工作一年。你会？', [
    { label: 'A', text: '支持 TA 发展', weights: { boundary: 10, planning: 10 } }, { label: 'B', text: '考虑一起搬过去', weights: { initiative: 20, emotion: 15 } }, { label: 'C', text: '开始担心异地', weights: { emotion: 15, planning: -5 } }, { label: 'D', text: '认真聊一次未来计划', weights: { deep_talk: 20, planning: 15 } },
  ]),
  card('R08', '关系观', '前任话题', '聊到前任时，TA 说「我不想谈这个」。你会？', [
    { label: 'A', text: '尊重，不再问', weights: { boundary: 15 } }, { label: 'B', text: '解释自己只是好奇', weights: { deep_talk: 10, initiative: 5 } }, { label: 'C', text: '有点介意 TA 的反应', weights: { emotion: 15 } }, { label: 'D', text: '主动聊自己的前任经历', weights: { deep_talk: 15, initiative: 10 } },
  ]),
  card('R09', '关系观', '吃醋瞬间', '看到 TA 和同事有说有笑地吃饭，你会？', [
    { label: 'A', text: '完全不在意', weights: { boundary: -10, emotion: -15 } }, { label: 'B', text: '开玩笑问一句', weights: { initiative: 10, deep_talk: 5 } }, { label: 'C', text: '心里不舒服但不提', weights: { emotion: 15, initiative: -5 } }, { label: 'D', text: '认真表达自己的感受', weights: { initiative: 15, boundary: 10 } },
  ]),
  card('R10', '关系观', '公开关系', '在一起一个月，你希望怎么处理「公开」？', [
    { label: 'A', text: '马上官宣', weights: { spontaneity: 15, emotion: 10 } }, { label: 'B', text: '先跟好友圈说', weights: { planning: 10, boundary: 5 } }, { label: 'C', text: '不公开，顺其自然', weights: { boundary: 15, spontaneity: 5 } }, { label: 'D', text: '等关系稳定再说', weights: { planning: 15, emotion: -5 } },
  ]),
  card('R11', '关系观', '见家长', '对方提议这周末见 TA 爸妈。你会？', [
    { label: 'A', text: '有点紧张但愿意去', weights: { initiative: 15, emotion: 10 } }, { label: 'B', text: '觉得太早了', weights: { boundary: 15, planning: 10 } }, { label: 'C', text: '准备好礼物再去', weights: { planning: 20 } }, { label: 'D', text: '先问问爸妈是什么风格', weights: { deep_talk: 10, planning: 10 } },
  ]),
  card('R12', '关系观', '纪念日', '你们的一周年纪念日，对方完全忘了。你会？', [
    { label: 'A', text: '提醒 TA', weights: { initiative: 15, deep_talk: 5 } }, { label: 'B', text: '装作没事', weights: { emotion: 10, initiative: -10 } }, { label: 'C', text: '有点失落', weights: { emotion: 15 } }, { label: 'D', text: '自己安排庆祝', weights: { spontaneity: 10, initiative: 10 } },
  ]),
  card('R13', '关系观', '礼物取向', '你更希望收到什么样的礼物？', [
    { label: 'A', text: '实用主义', weights: { planning: 15 } }, { label: 'B', text: '心意手作', weights: { emotion: 15, deep_talk: 10 } }, { label: 'C', text: '惊喜大礼', weights: { spontaneity: 15, emotion: 10 } }, { label: 'D', text: '一起体验', weights: { explore: 15, spontaneity: 10 } },
  ]),
  card('R14', '关系观', '忙碌时刻', 'TA 最近连续加班两周。你会？', [
    { label: 'A', text: '默默准备吃的喝的', weights: { emotion: 15, planning: 5 } }, { label: 'B', text: '每天问问累不累', weights: { deep_talk: 10, emotion: 10 } }, { label: 'C', text: '让 TA 好好忙，不打扰', weights: { boundary: 15 } }, { label: 'D', text: '约周末好好放松', weights: { spontaneity: 10, explore: 5 } },
  ]),
  card('R15', '关系观', '生病照顾', '你感冒发烧了，TA 说「多喝热水」。你会？', [
    { label: 'A', text: '理解，自己照顾好自己', weights: { boundary: 10, planning: 10 } }, { label: 'B', text: '直接说想要陪伴', weights: { deep_talk: 15, emotion: 10 } }, { label: 'C', text: '有点委屈', weights: { emotion: 15 } }, { label: 'D', text: '下次 TA 生病也这样', weights: { boundary: 5, initiative: -10 } },
  ]),
  card('R16', '关系观', '低谷期', 'TA 最近事业受挫，情绪低落。你会？', [
    { label: 'A', text: '陪 TA 聊聊', weights: { deep_talk: 20, emotion: 10 } }, { label: 'B', text: '带 TA 出去散心', weights: { explore: 15, spontaneity: 10 } }, { label: 'C', text: '给 TA 空间自己消化', weights: { boundary: 15 } }, { label: 'D', text: '想办法帮 TA 解决问题', weights: { planning: 15, initiative: 10 } },
  ]),
  card('R17', '关系观', '习惯差异', '你早睡早起，TA 是夜猫子。你会？', [
    { label: 'A', text: '各睡各的', weights: { boundary: 15, planning: 5 } }, { label: 'B', text: '尝试调整作息', weights: { planning: 10, emotion: 5 } }, { label: 'C', text: '规定睡前互相说晚安', weights: { deep_talk: 10, planning: 10 } }, { label: 'D', text: '不太在意', weights: { spontaneity: 10, boundary: 5 } },
  ]),
  card('R18', '关系观', '朋友评价', '你的好朋友说不喜欢你的约会对象。你会？', [
    { label: 'A', text: '认真听 TA 的理由', weights: { deep_talk: 15, boundary: 5 } }, { label: 'B', text: '不太理会', weights: { boundary: 15, emotion: -5 } }, { label: 'C', text: '跟对方分享这件事', weights: { deep_talk: 15, initiative: 10 } }, { label: 'D', text: '重新评估这段关系', weights: { planning: 15, boundary: 10 } },
  ]),
  card('R19', '关系观', '前任点赞', 'TA 给前任的动态点了赞。你会？', [
    { label: 'A', text: '无所谓', weights: { boundary: -10, emotion: -15 } }, { label: 'B', text: '问一句怎么回事', weights: { initiative: 10, deep_talk: 10 } }, { label: 'C', text: '有点在意但不问', weights: { emotion: 15 } }, { label: 'D', text: '觉得越界了', weights: { boundary: 15, emotion: 10 } },
  ]),
  card('R20', '关系观', '信任重建', 'TA 之前瞒过你一件事，后来坦白了。你会？', [
    { label: 'A', text: '原谅并翻篇', weights: { deep_talk: 15, emotion: 10 } }, { label: 'B', text: '原谅但心里有刺', weights: { emotion: 15, boundary: 5 } }, { label: 'C', text: '需要时间观察', weights: { boundary: 15, planning: 10 } }, { label: 'D', text: '再给一次机会', weights: { deep_talk: 10, spontaneity: 5 } },
  ]),
  card('R21', '关系观', '空间需求', '你觉得关系中「个人空间」多重要？', [
    { label: 'A', text: '非常重要', weights: { boundary: 25 } }, { label: 'B', text: '重要，但可以商量', weights: { boundary: 15, deep_talk: 5 } }, { label: 'C', text: '黏在一起更好', weights: { cling: 20, emotion: 10 } }, { label: 'D', text: '看阶段', weights: { spontaneity: 10, planning: 5 } },
  ]),
  card('R22', '关系观', '依赖程度', '你希望和伴侣的相处节奏是？', [
    { label: 'A', text: '天天联系', weights: { cling: 20, emotion: 15 } }, { label: 'B', text: '每天有问候就行', weights: { planning: 10, boundary: 5 } }, { label: 'C', text: '想起来了才联系', weights: { spontaneity: 20, boundary: 10 } }, { label: 'D', text: '重要时刻一起', weights: { deep_talk: 15, boundary: 10 } },
  ]),
  card('R23', '关系观', '冷战之后', '你们冷战了两天，你会？', [
    { label: 'A', text: '主动破冰', weights: { initiative: 20, deep_talk: 10 } }, { label: 'B', text: '等 TA 先开口', weights: { boundary: 10, initiative: -10 } }, { label: 'C', text: '写个消息把事情说开', weights: { deep_talk: 20, planning: 10 } }, { label: 'D', text: '直接约出来见面聊', weights: { initiative: 15, spontaneity: 5 } },
  ]),
  card('R24', '关系观', '热恋消退', '热恋期过了，感觉没那么上头了。你会？', [
    { label: 'A', text: '觉得是正常的', weights: { planning: 10, emotion: -5 } }, { label: 'B', text: '主动制造新鲜感', weights: { spontaneity: 15, explore: 10 } }, { label: 'C', text: '有点失落', weights: { emotion: 15 } }, { label: 'D', text: '认真聊聊关系走向', weights: { deep_talk: 20, planning: 10 } },
  ]),
  card('R25', '关系观', '未来规划', '关于「未来的家」，你更想要？', [
    { label: 'A', text: '城市小公寓', weights: { planning: 15, social_battery: 10 } }, { label: 'B', text: '郊外带院子', weights: { boundary: 15, chill: 10 } }, { label: 'C', text: '随时搬家也 OK', weights: { spontaneity: 20, explore: 10 } }, { label: 'D', text: '跟着机会走', weights: { spontaneity: 15, initiative: 10 } },
  ]),
  // ============ 沟通 C01-C25 ============
  card('C01', '沟通', '表达需求', '你有需求时，更习惯怎么表达？', [
    { label: 'A', text: '直接说', weights: { initiative: 20, deep_talk: 10 } }, { label: 'B', text: '暗示', weights: { emotion: 10, initiative: -10 } }, { label: 'C', text: '等对方发现', weights: { emotion: 15, initiative: -15 } }, { label: 'D', text: '先自己消化', weights: { boundary: 15 } },
  ]),
  card('C02', '沟通', '道歉方式', '你觉得最好的道歉是？', [
    { label: 'A', text: '讲清楚自己错在哪', weights: { deep_talk: 20, planning: 5 } }, { label: 'B', text: '用行动弥补', weights: { initiative: 15, planning: 10 } }, { label: 'C', text: '真诚说对不起', weights: { emotion: 15, deep_talk: 5 } }, { label: 'D', text: '买礼物/做饭示好', weights: { emotion: 10, spontaneity: 10 } },
  ]),
  card('C03', '沟通', '倾听姿态', '对方跟你倾诉烦恼时，你会？', [
    { label: 'A', text: '认真听，不打断', weights: { deep_talk: 20, emotion: 10 } }, { label: 'B', text: '帮 TA 分析问题', weights: { planning: 15, initiative: 10 } }, { label: 'C', text: '讲自己的类似经历', weights: { deep_talk: 10, emotion: 10 } }, { label: 'D', text: '出主意解决问题', weights: { planning: 15, initiative: 15 } },
  ]),
  card('C04', '沟通', '争论升级', '争论快升级时，你会？', [
    { label: 'A', text: '先停下来冷静', weights: { boundary: 20, planning: 10 } }, { label: 'B', text: '提高音量讲道理', weights: { initiative: 15, emotion: 10 } }, { label: 'C', text: '转身离开', weights: { boundary: 15, emotion: -10 } }, { label: 'D', text: '努力压住情绪继续谈', weights: { emotion: 10, deep_talk: 10 } },
  ]),
  card('C05', '沟通', '情绪上头', '你情绪上来的时候，最像？', [
    { label: 'A', text: '直接爆发', weights: { emotion: 20, boundary: -10 } }, { label: 'B', text: '沉默不说话', weights: { boundary: 15, emotion: 10 } }, { label: 'C', text: '哭着说出来', weights: { emotion: 20, deep_talk: 5 } }, { label: 'D', text: '冷静分析', weights: { planning: 15, emotion: -10 } },
  ]),
  card('C06', '沟通', '翻旧账', '吵架时对方翻出三个月前的事。你会？', [
    { label: 'A', text: '认真回应每一件', weights: { deep_talk: 15, planning: 10 } }, { label: 'B', text: '只聊当下这一件事', weights: { boundary: 15, planning: 10 } }, { label: 'C', text: '觉得 TA 不讲理', weights: { boundary: 10, emotion: 10 } }, { label: 'D', text: '先听完再说', weights: { deep_talk: 15, emotion: 5 } },
  ]),
  card('C07', '沟通', '敷衍回应', 'TA 用「嗯嗯」「哦」回应你。你会？', [
    { label: 'A', text: '直接说想认真聊', weights: { initiative: 15, deep_talk: 10 } }, { label: 'B', text: '也冷淡下来', weights: { boundary: 10, initiative: -10 } }, { label: 'C', text: '找 TA 见面聊', weights: { initiative: 15, spontaneity: 5 } }, { label: 'D', text: '无所谓', weights: { emotion: -10, boundary: 5 } },
  ]),
  card('C08', '沟通', '承诺兑现', 'TA 答应的事没做到。你会？', [
    { label: 'A', text: '提醒并给机会', weights: { deep_talk: 10, initiative: 10 } }, { label: 'B', text: '默默记下', weights: { planning: 10, emotion: 10 } }, { label: 'C', text: '直接指出问题', weights: { initiative: 15, boundary: 10 } }, { label: 'D', text: '下次 TA 做不到也无所谓', weights: { spontaneity: 10, boundary: 5 } },
  ]),
  card('C09', '沟通', '感恩表达', 'TA 帮你做了件小事，你会？', [
    { label: 'A', text: '当面说谢谢', weights: { deep_talk: 10, emotion: 10 } }, { label: 'B', text: '记在心里', weights: { emotion: 10, boundary: 5 } }, { label: 'C', text: '回请 TA', weights: { initiative: 10, planning: 10 } }, { label: 'D', text: '夸 TA 一通', weights: { emotion: 10, wit: 10 } },
  ]),
  card('C10', '沟通', '接受道歉', '对方道歉了，但你还在气头上。你会？', [
    { label: 'A', text: '接受道歉', weights: { deep_talk: 10, emotion: 10 } }, { label: 'B', text: '说需要时间', weights: { boundary: 15, planning: 5 } }, { label: 'C', text: '继续生气', weights: { emotion: 15, boundary: -5 } }, { label: 'D', text: '提出具体要求', weights: { initiative: 15, deep_talk: 10 } },
  ]),
  card('C11', '沟通', '意见不合', '你俩对一件事看法完全相反。你会？', [
    { label: 'A', text: '求同存异', weights: { boundary: 15, deep_talk: 5 } }, { label: 'B', text: '说服 TA', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '让 TA 说完整再表态', weights: { deep_talk: 15, planning: 5 } }, { label: 'D', text: '交给时间', weights: { spontaneity: 10, boundary: 10 } },
  ]),
  card('C12', '沟通', '沉默时刻', '对方突然不说话了。你会？', [
    { label: 'A', text: '等 TA 自己开口', weights: { boundary: 10, planning: 5 } }, { label: 'B', text: '问是不是我哪里不对', weights: { initiative: 10, emotion: 10 } }, { label: 'C', text: '换个话题', weights: { spontaneity: 10, wit: 5 } }, { label: 'D', text: '直接问发生了什么', weights: { initiative: 15, deep_talk: 15 } },
  ]),
  card('C13', '沟通', '被吼之后', '对方情绪激动地吼了你。你会？', [
    { label: 'A', text: '也吼回去', weights: { emotion: 20, boundary: -10 } }, { label: 'B', text: '沉默离开', weights: { boundary: 15, emotion: -10 } }, { label: 'C', text: '等 TA 平静再谈', weights: { planning: 15, boundary: 10 } }, { label: 'D', text: '指出不该这样', weights: { boundary: 15, deep_talk: 10 } },
  ]),
  card('C14', '沟通', '讲道理时刻', '你更喜欢哪种沟通风格？', [
    { label: 'A', text: '摆事实讲道理', weights: { planning: 15, deep_talk: 10 } }, { label: 'B', text: '先共情再讲', weights: { emotion: 15, deep_talk: 10 } }, { label: 'C', text: '轻松一点别太严肃', weights: { wit: 15, spontaneity: 10 } }, { label: 'D', text: '直接说结论', weights: { initiative: 15, planning: 5 } },
  ]),
  card('C15', '沟通', '撒娇需求', '你想要对方哄你时，会？', [
    { label: 'A', text: '直接说「哄我」', weights: { initiative: 15, emotion: 10 } }, { label: 'B', text: '撒娇暗示', weights: { emotion: 15, wit: 5 } }, { label: 'C', text: '闷着不说', weights: { emotion: 10, boundary: 10 } }, { label: 'D', text: '自己消化', weights: { boundary: 15, planning: 5 } },
  ]),
  card('C16', '沟通', '直球表达', '对「直球」表达你的态度？', [
    { label: 'A', text: '喜欢直球', weights: { initiative: 20, deep_talk: 10 } }, { label: 'B', text: '太直接会吓到', weights: { emotion: 10, boundary: 5 } }, { label: 'C', text: '看熟悉程度', weights: { spontaneity: 10, boundary: 5 } }, { label: 'D', text: '绕弯子更舒服', weights: { boundary: 15, emotion: 5 } },
  ]),
  card('C17', '沟通', '分享欲', '你的分享欲有多强？', [
    { label: 'A', text: '事无巨细都想分享', weights: { cling: 20, emotion: 10 } }, { label: 'B', text: '分享重要的', weights: { planning: 10, deep_talk: 10 } }, { label: 'C', text: '分享想分享的', weights: { spontaneity: 15 } }, { label: 'D', text: '很少主动分享', weights: { boundary: 15, social_battery: -10 } },
  ]),
  card('C18', '沟通', '话题终结者', '聊天时你经常？', [
    { label: 'A', text: '抛出新话题', weights: { wit: 15, initiative: 10 } }, { label: 'B', text: '认真接话', weights: { deep_talk: 15 } }, { label: 'C', text: '回「哈哈」', weights: { boundary: 5, emotion: -5 } }, { label: 'D', text: '隔很久才回', weights: { spontaneity: 10, boundary: 10 } },
  ]),
  card('C19', '沟通', '倾听者', '朋友找你倾诉，你的角色是？', [
    { label: 'A', text: '树洞', weights: { deep_talk: 15, emotion: 10 } }, { label: 'B', text: '军师', weights: { planning: 15, initiative: 10 } }, { label: 'C', text: '气氛组', weights: { wit: 15, spontaneity: 10 } }, { label: 'D', text: '复读机式共情', weights: { emotion: 15, deep_talk: 5 } },
  ]),
  card('C20', '沟通', '回应速度', '你回消息的速度通常是？', [
    { label: 'A', text: '秒回', weights: { cling: 15, emotion: 10 } }, { label: 'B', text: '看到就回', weights: { spontaneity: 10, social_battery: 5 } }, { label: 'C', text: '忙完再回', weights: { planning: 10, boundary: 5 } }, { label: 'D', text: '想起来才回', weights: { spontaneity: 15, boundary: 10 } },
  ]),
  card('C21', '沟通', '表情包', '你聊天爱用？', [
    { label: 'A', text: '表情包轰炸', weights: { wit: 20, spontaneity: 10 } }, { label: 'B', text: 'emoji', weights: { emotion: 10 } }, { label: 'C', text: '文字为主', weights: { deep_talk: 10, planning: 5 } }, { label: 'D', text: '语音', weights: { initiative: 10, emotion: 10 } },
  ]),
  card('C22', '沟通', '晚安仪式', '关于「晚安」？', [
    { label: 'A', text: '必须说晚安', weights: { cling: 15, planning: 10 } }, { label: 'B', text: '经常忘了', weights: { spontaneity: 15 } }, { label: 'C', text: '看心情', weights: { spontaneity: 10, boundary: 5 } }, { label: 'D', text: '聊到困就直接睡', weights: { spontaneity: 15, wit: 5 } },
  ]),
  card('C23', '沟通', '重要日子', '你记得重要日子的能力？', [
    { label: 'A', text: '全都记得', weights: { planning: 20, emotion: 10 } }, { label: 'B', text: '靠手机提醒', weights: { planning: 10 } }, { label: 'C', text: '经常忘记', weights: { spontaneity: 15 } }, { label: 'D', text: '只记得自己的', weights: { boundary: 10, spontaneity: 5 } },
  ]),
  card('C24', '沟通', '情绪分享', '情绪低落时你会？', [
    { label: 'A', text: '找人倾诉', weights: { deep_talk: 15, emotion: 10 } }, { label: 'B', text: '写下来', weights: { planning: 10, boundary: 10 } }, { label: 'C', text: '吃顿好的', weights: { spontaneity: 10, emotion: 5 } }, { label: 'D', text: '自己消化', weights: { boundary: 15, emotion: -5 } },
  ]),
  card('C25', '沟通', '道歉接受度', '你认为「道歉」最重要的是？', [
    { label: 'A', text: '态度诚恳', weights: { emotion: 15, deep_talk: 10 } }, { label: 'B', text: '实际行动', weights: { planning: 15, initiative: 10 } }, { label: 'C', text: '以后不再犯', weights: { planning: 15, boundary: 10 } }, { label: 'D', text: '马上翻篇', weights: { spontaneity: 15, emotion: 5 } },
  ]),
  // ============ 生活方式 L05-L25 ============
  card('L05', '生活方式', '作息类型', '你的作息更像？', [
    { label: 'A', text: '早睡早起', weights: { planning: 20, social_battery: -5 } }, { label: 'B', text: '夜猫子', weights: { spontaneity: 15, wit: 5 } }, { label: 'C', text: '看状态', weights: { spontaneity: 10, boundary: 5 } }, { label: 'D', text: '弹性作息', weights: { spontaneity: 15, planning: -5 } },
  ]),
  card('L06', '生活方式', '运动习惯', '你的运动习惯是？', [
    { label: 'A', text: '规律健身', weights: { planning: 20, initiative: 10 } }, { label: 'B', text: '偶尔动动', weights: { spontaneity: 10 } }, { label: 'C', text: '几乎不动', weights: { chill: 10, boundary: 5 } }, { label: 'D', text: '户外运动', weights: { explore: 20, spontaneity: 10 } },
  ]),
  card('L07', '生活方式', '饮食偏好', '约饭时你更偏爱？', [
    { label: 'A', text: '火锅烤肉', weights: { spontaneity: 15, social_battery: 10 } }, { label: 'B', text: '清淡健康', weights: { planning: 15, chill: 10 } }, { label: 'C', text: '尝鲜新店', weights: { explore: 20, spontaneity: 10 } }, { label: 'D', text: '随便吃吃', weights: { spontaneity: 10, boundary: 5 } },
  ]),
  card('L08', '生活方式', '家务分工', '同居后家务怎么分？', [
    { label: 'A', text: '明确分工', weights: { planning: 20, boundary: 10 } }, { label: 'B', text: '谁有空谁做', weights: { spontaneity: 10, initiative: 5 } }, { label: 'C', text: '花钱请人', weights: { planning: 10 } }, { label: 'D', text: '一起做', weights: { deep_talk: 10, emotion: 10 } },
  ]),
  card('L09', '生活方式', '宠物态度', '你想养宠物吗？', [
    { label: 'A', text: '想养猫', weights: { emotion: 10, chill: 10 } }, { label: 'B', text: '想养狗', weights: { explore: 15, initiative: 10 } }, { label: 'C', text: '不想养', weights: { boundary: 15, planning: 10 } }, { label: 'D', text: '看情况', weights: { spontaneity: 10 } },
  ]),
  card('L10', '生活方式', '购物风格', '你买东西的风格是？', [
    { label: 'A', text: '看中就买', weights: { spontaneity: 20 } }, { label: 'B', text: '货比三家', weights: { planning: 20 } }, { label: 'C', text: '等打折', weights: { planning: 15 } }, { label: 'D', text: '让 TA 帮挑', weights: { deep_talk: 10, emotion: 5 } },
  ]),
  card('L11', '生活方式', '追剧方式', '你追剧的方式是？', [
    { label: 'A', text: '一口气看完', weights: { spontaneity: 15, boundary: 5 } }, { label: 'B', text: '每天一集', weights: { planning: 15 } }, { label: 'C', text: '边看边聊', weights: { deep_talk: 10, wit: 10 } }, { label: 'D', text: '不太追剧', weights: { explore: 5, planning: 5 } },
  ]),
  card('L12', '生活方式', '游戏习惯', '游戏在你的生活里？', [
    { label: 'A', text: '重度玩家', weights: { wit: 15, boundary: 5 } }, { label: 'B', text: '休闲玩家', weights: { spontaneity: 10, chill: 10 } }, { label: 'C', text: '几乎不玩', weights: { planning: 10, social_battery: 5 } }, { label: 'D', text: '喜欢桌游', weights: { wit: 15, social_battery: 15 } },
  ]),
  card('L13', '生活方式', '音乐口味', '你更常听？', [
    { label: 'A', text: '流行热歌', weights: { social_battery: 10, wit: 5 } }, { label: 'B', text: '独立小众', weights: { boundary: 10, deep_talk: 5 } }, { label: 'C', text: '老歌金曲', weights: { planning: 5, emotion: 10 } }, { label: 'D', text: '什么都听', weights: { explore: 15, spontaneity: 5 } },
  ]),
  card('L14', '生活方式', '阅读习惯', '你读书的频率？', [
    { label: 'A', text: '每周都读', weights: { planning: 15, deep_talk: 10 } }, { label: 'B', text: '想起来了读', weights: { spontaneity: 10 } }, { label: 'C', text: '听书', weights: { spontaneity: 5, planning: 5 } }, { label: 'D', text: '很少读', weights: { social_battery: 5, wit: 5 } },
  ]),
  card('L15', '生活方式', '断舍离', '你家里杂物的状态？', [
    { label: 'A', text: '极简主义', weights: { planning: 20, boundary: 10 } }, { label: 'B', text: '囤积爱好者', weights: { emotion: 10, spontaneity: 5 } }, { label: 'C', text: '定期清理', weights: { planning: 15 } }, { label: 'D', text: '乱中有序', weights: { spontaneity: 15, wit: 5 } },
  ]),
  card('L16', '生活方式', '周末安排', '理想周末是？', [
    { label: 'A', text: '宅家充电', weights: { chill: 20, boundary: 10 } }, { label: 'B', text: '出去浪', weights: { explore: 20, spontaneity: 15 } }, { label: 'C', text: '约朋友', weights: { social_battery: 20, wit: 10 } }, { label: 'D', text: '计划满满', weights: { planning: 20 } },
  ]),
  card('L17', '生活方式', '假期长度', '如果有一周假，你会？', [
    { label: 'A', text: '长途旅行', weights: { explore: 25, spontaneity: 10 } }, { label: 'B', text: '回家陪家人', weights: { emotion: 15, planning: 10 } }, { label: 'C', text: '深度休息', weights: { chill: 20 } }, { label: 'D', text: '学个新技能', weights: { explore: 15, planning: 10 } },
  ]),
  card('L18', '生活方式', '搬家', '搬家对你来说？', [
    { label: 'A', text: '小事一桩', weights: { spontaneity: 15, explore: 10 } }, { label: 'B', text: '大工程', weights: { planning: 15 } }, { label: 'C', text: '最怕的事', weights: { emotion: 10, planning: 10 } }, { label: 'D', text: '趁机断舍离', weights: { planning: 15, boundary: 10 } },
  ]),
  card('L19', '生活方式', '通勤', '你理想的通勤时间是？', [
    { label: 'A', text: '15 分钟内', weights: { planning: 15, chill: 10 } }, { label: 'B', text: '30 分钟可以', weights: { planning: 10 } }, { label: 'C', text: '无所谓', weights: { spontaneity: 10 } }, { label: 'D', text: '通勤时间用来听播客', weights: { deep_talk: 10, planning: 5 } },
  ]),
  card('L20', '生活方式', '做饭', '你做饭的能力？', [
    { label: 'A', text: '大厨级别', weights: { planning: 10, emotion: 10 } }, { label: 'B', text: '会几道拿手菜', weights: { planning: 5, initiative: 5 } }, { label: 'C', text: '泡面大师', weights: { spontaneity: 10, wit: 5 } }, { label: 'D', text: '喜欢一起做', weights: { deep_talk: 10, spontaneity: 10 } },
  ]),
  card('L21', '生活方式', '外卖频率', '你点外卖的频率？', [
    { label: 'A', text: '基本天天', weights: { spontaneity: 15 } }, { label: 'B', text: '一周几次', weights: { planning: 5 } }, { label: 'C', text: '自己做饭为主', weights: { planning: 15, chill: 5 } }, { label: 'D', text: '看心情', weights: { spontaneity: 10 } },
  ]),
  card('L22', '生活方式', '早睡挑战', '如果你决定早睡，结果？', [
    { label: 'A', text: '说到做到', weights: { planning: 20, initiative: 10 } }, { label: 'B', text: '坚持三天', weights: { spontaneity: 10, planning: 5 } }, { label: 'C', text: '手机太好玩了', weights: { spontaneity: 15, wit: 5 } }, { label: 'D', text: '看剧再说', weights: { spontaneity: 15 } },
  ]),
  card('L23', '生活方式', '社交能量', '参加完一场聚会后，你？', [
    { label: 'A', text: '电量满格', weights: { social_battery: 20, wit: 10 } }, { label: 'B', text: '需要独处回血', weights: { boundary: 20, chill: 10 } }, { label: 'C', text: '有点累但还好', weights: { social_battery: 5, boundary: 10 } }, { label: 'D', text: '后悔去了', weights: { boundary: 15, social_battery: -10 } },
  ]),
  card('L24', '生活方式', '计划 vs 随性', '出门旅行，你更偏向？', [
    { label: 'A', text: '详细计划', weights: { planning: 25 } }, { label: 'B', text: '大概框架', weights: { planning: 10, spontaneity: 10 } }, { label: 'C', text: '到了再说', weights: { spontaneity: 25, explore: 10 } }, { label: 'D', text: '跟 TA 的节奏', weights: { emotion: 10, deep_talk: 5 } },
  ]),
  card('L25', '生活方式', '房间风格', '你理想的房间是？', [
    { label: 'A', text: '极简白色', weights: { planning: 15, boundary: 10 } }, { label: 'B', text: '温馨杂乱', weights: { emotion: 15, chill: 10 } }, { label: 'C', text: '个性涂鸦', weights: { wit: 15, spontaneity: 10 } }, { label: 'D', text: '绿植环绕', weights: { chill: 15, planning: 5 } },
  ]),
  // ============ 价值观 V04-V25 ============
  card('V04', '价值观', '人生目标', '你更认同哪种人生？', [
    { label: 'A', text: '稳步上升', weights: { planning: 20 } }, { label: 'B', text: '自由折腾', weights: { spontaneity: 20, explore: 10 } }, { label: 'C', text: '平淡是真', weights: { chill: 20, boundary: 5 } }, { label: 'D', text: '体验优先', weights: { explore: 20, spontaneity: 15 } },
  ]),
  card('V05', '价值观', '婚姻观', '关于婚姻，你更接近？', [
    { label: 'A', text: '必须结婚', weights: { planning: 15, emotion: 10 } }, { label: 'B', text: '遇到对的人才结', weights: { deep_talk: 10, spontaneity: 5 } }, { label: 'C', text: '不婚主义', weights: { boundary: 20, spontaneity: 5 } }, { label: 'D', text: '顺其自然', weights: { spontaneity: 15, chill: 5 } },
  ]),
  card('V06', '价值观', '孩子问题', '关于生育，你的想法？', [
    { label: 'A', text: '想生', weights: { planning: 15, emotion: 10 } }, { label: 'B', text: '不想生', weights: { boundary: 20, spontaneity: 5 } }, { label: 'C', text: '顺其自然', weights: { spontaneity: 15 } }, { label: 'D', text: '看经济条件', weights: { planning: 15, boundary: 5 } },
  ]),
  card('V07', '价值观', '事业家庭', '事业和家庭冲突时？', [
    { label: 'A', text: '事业优先', weights: { planning: 20, initiative: 15 } }, { label: 'B', text: '家庭优先', weights: { emotion: 20, cling: 10 } }, { label: 'C', text: '尽量平衡', weights: { planning: 10, deep_talk: 10 } }, { label: 'D', text: '看阶段', weights: { spontaneity: 10 } },
  ]),
  card('V08', '价值观', '城市 vs 家乡', '你更愿意留在？', [
    { label: 'A', text: '大城市打拼', weights: { initiative: 15, explore: 10 } }, { label: 'B', text: '回老家发展', weights: { emotion: 15, planning: 10 } }, { label: 'C', text: '哪里有机会去哪', weights: { spontaneity: 15, explore: 10 } }, { label: 'D', text: '小城慢生活', weights: { chill: 20, boundary: 10 } },
  ]),
  card('V09', '价值观', '物质精神', '你更看重？', [
    { label: 'A', text: '物质保障', weights: { planning: 20 }, tags: ['value_material'] }, { label: 'B', text: '精神共鸣', weights: { deep_talk: 20, emotion: 10 }, tags: ['value_spirit'] }, { label: 'C', text: '两者都要', weights: { planning: 10, deep_talk: 10 } }, { label: 'D', text: '当下开心', weights: { spontaneity: 15, chill: 10 } },
  ]),
  card('V10', '价值观', '稳定 vs 冒险', '面对人生选择，你？', [
    { label: 'A', text: '求稳', weights: { planning: 20, boundary: 5 } }, { label: 'B', text: '敢冒险', weights: { spontaneity: 20, explore: 10 } }, { label: 'C', text: '看收益', weights: { planning: 10, initiative: 10 } }, { label: 'D', text: '跟着感觉', weights: { spontaneity: 15, emotion: 5 } },
  ]),
  card('V11', '价值观', '个体集体', '你更认同？', [
    { label: 'A', text: '个人优先', weights: { boundary: 20, spontaneity: 5 } }, { label: 'B', text: '集体优先', weights: { emotion: 15, planning: 5 } }, { label: 'C', text: '看场合', weights: { spontaneity: 10, boundary: 5 } }, { label: 'D', text: '折中', weights: { deep_talk: 10, planning: 10 } },
  ]),
  card('V12', '价值观', '信仰态度', '你对「玄学」的态度？', [
    { label: 'A', text: '很信', weights: { emotion: 10, spontaneity: 5 } }, { label: 'B', text: '宁可信其有', weights: { spontaneity: 10 } }, { label: 'C', text: '完全不信', weights: { planning: 15, boundary: 10 } }, { label: 'D', text: '当娱乐', weights: { wit: 15, spontaneity: 5 } },
  ]),
  card('V13', '价值观', '公益态度', '你会参与公益吗？', [
    { label: 'A', text: '经常参与', weights: { emotion: 15, planning: 10 } }, { label: 'B', text: '偶尔捐点', weights: { planning: 5, emotion: 5 } }, { label: 'C', text: '有心无力', weights: { emotion: 10, boundary: 5 } }, { label: 'D', text: '不太关注', weights: { boundary: 10 } },
  ]),
  card('V14', '价值观', '环保意识', '你的环保习惯？', [
    { label: 'A', text: '自带杯出门', weights: { planning: 15, boundary: 5 } }, { label: 'B', text: '垃圾分类', weights: { planning: 15 } }, { label: 'C', text: '偶尔注意', weights: { spontaneity: 10 } }, { label: 'D', text: '不太在意', weights: { spontaneity: 10, chill: 5 } },
  ]),
  card('V15', '价值观', '学习态度', '你学习新东西的态度？', [
    { label: 'A', text: '终身学习', weights: { explore: 20, planning: 10 } }, { label: 'B', text: '按需学', weights: { planning: 10 } }, { label: 'C', text: '三分钟热度', weights: { spontaneity: 15 } }, { label: 'D', text: '不学习', weights: { chill: 10, boundary: 5 } },
  ]),
  card('V16', '价值观', '健康观念', '关于健康，你？', [
    { label: 'A', text: '养生达人', weights: { planning: 20 } }, { label: 'B', text: '体检都懒得去', weights: { spontaneity: 10, chill: 5 } }, { label: 'C', text: '病了自己扛', weights: { boundary: 15 } }, { label: 'D', text: '重视但不卷', weights: { planning: 10, chill: 10 } },
  ]),
  card('V17', '价值观', '名声观念', '你在意别人怎么看你吗？', [
    { label: 'A', text: '很在意', weights: { emotion: 15, social_battery: 5 } }, { label: 'B', text: '看人', weights: { spontaneity: 10, boundary: 5 } }, { label: 'C', text: '不太在意', weights: { boundary: 15, chill: 5 } }, { label: 'D', text: '只在意在乎的人', weights: { deep_talk: 10, emotion: 5 } },
  ]),
  card('V18', '价值观', '隐私观念', '你愿意公开的生活范围？', [
    { label: 'A', text: '全公开', weights: { social_battery: 10, spontaneity: 5 } }, { label: 'B', text: '朋友圈可见', weights: { boundary: 5, planning: 5 } }, { label: 'C', text: '仅亲近的人', weights: { boundary: 15, deep_talk: 5 } }, { label: 'D', text: '几乎不公开', weights: { boundary: 20 } },
  ]),
  card('V19', '价值观', '忠诚理解', '你觉得「忠诚」最重要的是？', [
    { label: 'A', text: '身体忠诚', weights: { boundary: 15, planning: 5 } }, { label: 'B', text: '精神忠诚', weights: { deep_talk: 15, emotion: 10 } }, { label: 'C', text: '透明坦诚', weights: { deep_talk: 15, initiative: 10 } }, { label: 'D', text: '都有', weights: { planning: 10, boundary: 10 } },
  ]),
  card('V20', '价值观', '承诺分量', '你觉得「承诺」？', [
    { label: 'A', text: '说到就要做到', weights: { planning: 20, boundary: 10 } }, { label: 'B', text: '尽力而为', weights: { planning: 10, emotion: 5 } }, { label: 'C', text: '不轻易承诺', weights: { boundary: 15 } }, { label: 'D', text: '随口一说', weights: { spontaneity: 15 } },
  ]),
  card('V21', '价值观', '成长路径', '你觉得个人成长最重要的是？', [
    { label: 'A', text: '事业成就', weights: { initiative: 20, planning: 10 } }, { label: 'B', text: '内心平静', weights: { chill: 20, boundary: 5 } }, { label: 'C', text: '关系经营', weights: { emotion: 15, deep_talk: 10 } }, { label: 'D', text: '见识世界', weights: { explore: 20, spontaneity: 5 } },
  ]),
  card('V22', '价值观', '成功定义', '你觉得「成功」是？', [
    { label: 'A', text: '财务自由', weights: { planning: 20, initiative: 10 } }, { label: 'B', text: '做喜欢的事', weights: { spontaneity: 15, explore: 10 } }, { label: 'C', text: '家庭幸福', weights: { emotion: 20, cling: 10 } }, { label: 'D', text: '影响他人', weights: { initiative: 15, deep_talk: 10 } },
  ]),
  card('V23', '价值观', '平衡观', '你如何理解「平衡」？', [
    { label: 'A', text: '重要', weights: { planning: 15, chill: 5 } }, { label: 'B', text: '很难做到', weights: { emotion: 10, spontaneity: 5 } }, { label: 'C', text: '不太需要', weights: { spontaneity: 15, boundary: 5 } }, { label: 'D', text: '顺其自然', weights: { chill: 15 } },
  ]),
  card('V24', '价值观', '年龄观念', '你怎么看「年龄」？', [
    { label: 'A', text: '数字而已', weights: { spontaneity: 10, boundary: 5 } }, { label: 'B', text: '该做什么做什么', weights: { planning: 15 } }, { label: 'C', text: '有点焦虑', weights: { emotion: 15, planning: 5 } }, { label: 'D', text: '每个阶段都好', weights: { chill: 15, emotion: 5 } },
  ]),
  card('V25', '价值观', '时间观', '你更常用哪种方式规划时间？', [
    { label: 'A', text: '日历排满', weights: { planning: 20 } }, { label: 'B', text: '大事记一下', weights: { planning: 10 } }, { label: 'C', text: '随缘', weights: { spontaneity: 20 } }, { label: 'D', text: '靠记忆', weights: { spontaneity: 10, wit: 5 } },
  ]),
  // ============ 金钱观 M04-M25 ============
  card('M04', '金钱观', 'AA 态度', '你对约会 AA 制的态度？', [
    { label: 'A', text: '必须 AA', weights: { boundary: 15 }, tags: ['pay_aa'] }, { label: 'B', text: '轮流请', weights: { deep_talk: 5, planning: 5 }, tags: ['pay_alternate'] }, { label: 'C', text: '谁条件好谁多出', tags: ['money_proportional'] }, { label: 'D', text: '随意', tags: ['pay_flexible'] },
  ]),
  card('M05', '金钱观', '礼物金额', '送礼你觉得多少合适？', [
    { label: 'A', text: '心意为主', weights: { emotion: 15, spontaneity: 5 } }, { label: 'B', text: '量力而行', weights: { planning: 15, boundary: 5 } }, { label: 'C', text: '越贵越好', weights: { planning: 5, emotion: 10 } }, { label: 'D', text: '双方对等', weights: { planning: 10, boundary: 10 } },
  ]),
  card('M06', '金钱观', '彩礼看法', '关于彩礼/嫁妆，你觉得？', [
    { label: 'A', text: '传统要有', weights: { planning: 10, emotion: 5 } }, { label: 'B', text: '意思一下', weights: { planning: 10, boundary: 5 } }, { label: 'C', text: '不应该有', weights: { boundary: 20, spontaneity: 5 } }, { label: 'D', text: '双方商量', weights: { deep_talk: 15, planning: 10 } },
  ]),
  card('M07', '金钱观', '房车计划', '关于买房买车，你？', [
    { label: 'A', text: '必须买房', weights: { planning: 20, emotion: 5 } }, { label: 'B', text: '租房挺好', weights: { spontaneity: 15, boundary: 5 } }, { label: 'C', text: '看发展再定', weights: { planning: 10, spontaneity: 5 } }, { label: 'D', text: '一起存钱买', weights: { planning: 15, deep_talk: 10 } },
  ]),
  card('M08', '金钱观', '预算习惯', '你平时有预算吗？', [
    { label: 'A', text: '严格预算', weights: { planning: 25 } }, { label: 'B', text: '大概有数', weights: { planning: 10 } }, { label: 'C', text: '月光', weights: { spontaneity: 20 } }, { label: 'D', text: '看心情', weights: { spontaneity: 15 } },
  ]),
  card('M09', '金钱观', '投资风险', '面对投资风险，你？', [
    { label: 'A', text: '稳健为主', weights: { planning: 20, boundary: 5 } }, { label: 'B', text: '敢闯敢试', weights: { spontaneity: 20, initiative: 10 } }, { label: 'C', text: '不碰投资', weights: { planning: 15, chill: 5 } }, { label: 'D', text: '跟 TA 一起研究', weights: { deep_talk: 10, planning: 10 } },
  ]),
  card('M10', '金钱观', '借钱', '朋友向你借钱，你会？', [
    { label: 'A', text: '能帮就帮', weights: { emotion: 15, initiative: 5 } }, { label: 'B', text: '看关系', weights: { boundary: 10, deep_talk: 5 } }, { label: 'C', text: '一般不借', weights: { boundary: 20, planning: 5 } }, { label: 'D', text: '写借条', weights: { planning: 15, boundary: 10 } },
  ]),
  card('M11', '金钱观', '家庭负担', '对方要给家里打钱，你会？', [
    { label: 'A', text: '支持', weights: { emotion: 15, planning: 5 } }, { label: 'B', text: '商量金额', weights: { deep_talk: 15, planning: 10 } }, { label: 'C', text: '介意但不说', weights: { emotion: 10, boundary: 5 } }, { label: 'D', text: '反对', weights: { boundary: 15, planning: 10 } },
  ]),
  card('M12', '金钱观', '旅游预算', '旅行预算你偏向？', [
    { label: 'A', text: '穷游体验', weights: { explore: 15, spontaneity: 10 } }, { label: 'B', text: '舒适享受', weights: { chill: 15, planning: 5 } }, { label: 'C', text: '该花花', weights: { spontaneity: 15, emotion: 5 } }, { label: 'D', text: '看目的地', weights: { planning: 10, explore: 5 } },
  ]),
  card('M13', '金钱观', '婚礼预算', '婚礼你希望？', [
    { label: 'A', text: '隆重仪式', weights: { planning: 10, emotion: 10 } }, { label: 'B', text: '简单温馨', weights: { chill: 15, boundary: 5 } }, { label: 'C', text: '旅行结婚', weights: { explore: 20, spontaneity: 10 } }, { label: 'D', text: '家人定', weights: { emotion: 10, planning: 5 } },
  ]),
  card('M14', '金钱观', '婚后财政', '婚后财务怎么管？', [
    { label: 'A', text: '各自独立', weights: { boundary: 20 }, tags: ['money_separate'] }, { label: 'B', text: '共同账户', weights: { planning: 15, deep_talk: 5 } }, { label: 'C', text: '一方管', weights: { planning: 10 } }, { label: 'D', text: '都行', weights: { spontaneity: 10 } },
  ]),
  card('M15', '金钱观', '记账习惯', '你会记账吗？', [
    { label: 'A', text: '每天记', weights: { planning: 20 } }, { label: 'B', text: '记大额', weights: { planning: 10 } }, { label: 'C', text: '从不记', weights: { spontaneity: 15 } }, { label: 'D', text: '月底看余额', weights: { spontaneity: 5, planning: 5 } },
  ]),
  card('M16', '金钱观', '消费观差异', 'TA 觉得你花钱大手大脚。你会？', [
    { label: 'A', text: '觉得没错', weights: { boundary: 15, spontaneity: 10 } }, { label: 'B', text: '试着调整', weights: { planning: 10, emotion: 5 } }, { label: 'C', text: '认真聊消费观', weights: { deep_talk: 15, planning: 10 } }, { label: 'D', text: '各花各的', weights: { boundary: 15 } },
  ]),
  card('M17', '金钱观', '奢侈品', '你对奢侈品的态度？', [
    { label: 'A', text: '喜欢就买', weights: { spontaneity: 15, emotion: 5 } }, { label: 'B', text: '有闲钱才买', weights: { planning: 15 } }, { label: 'C', text: '没必要', weights: { planning: 15, boundary: 5 } }, { label: 'D', text: '买质感不买 logo', weights: { planning: 10, boundary: 10 } },
  ]),
  card('M18', '金钱观', '性价比', '买东西时你？', [
    { label: 'A', text: '只买对的', weights: { planning: 15 } }, { label: 'B', text: '只买贵的', weights: { planning: 5, spontaneity: 5 } }, { label: 'C', text: '看评价', weights: { planning: 15 } }, { label: 'D', text: '看眼缘', weights: { spontaneity: 15, emotion: 5 } },
  ]),
  card('M19', '金钱观', '小费文化', '你对给小费？', [
    { label: 'A', text: '大方给', weights: { emotion: 10, spontaneity: 5 } }, { label: 'B', text: '服务好才给', weights: { planning: 10, boundary: 5 } }, { label: 'C', text: '不给', weights: { planning: 15 } }, { label: 'D', text: '看场合', weights: { spontaneity: 10 } },
  ]),
  card('M20', '金钱观', '红包', '过年发红包，你？', [
    { label: 'A', text: '大方发', weights: { emotion: 15, spontaneity: 5 } }, { label: 'B', text: '量力而行', weights: { planning: 15 } }, { label: 'C', text: '意思一下', weights: { planning: 10, boundary: 5 } }, { label: 'D', text: '不发', weights: { boundary: 10 } },
  ]),
  card('M21', '金钱观', '分期消费', '你对待「分期」？', [
    { label: 'A', text: '能分期就分期', weights: { spontaneity: 10, planning: 5 } }, { label: 'B', text: '尽量避免', weights: { planning: 15 } }, { label: 'C', text: '只用免息', weights: { planning: 10 } }, { label: 'D', text: '从不分期', weights: { planning: 20, boundary: 5 } },
  ]),
  card('M22', '金钱观', '储蓄目标', '你的储蓄目标？', [
    { label: 'A', text: '存够就退休', weights: { planning: 20, boundary: 5 } }, { label: 'B', text: '应急金', weights: { planning: 15 } }, { label: 'C', text: '没目标', weights: { spontaneity: 15 } }, { label: 'D', text: '一起规划', weights: { planning: 15, deep_talk: 10 } },
  ]),
  card('M23', '金钱观', '应急金', '遇到突发大额支出，你？', [
    { label: 'A', text: '有存款不慌', weights: { planning: 20 } }, { label: 'B', text: '找家人借', weights: { emotion: 10, planning: 5 } }, { label: 'C', text: '信用卡周转', weights: { spontaneity: 10 } }, { label: 'D', text: '跟 TA 商量', weights: { deep_talk: 15, planning: 10 } },
  ]),
  card('M24', '金钱观', '养老规划', '关于养老，你？', [
    { label: 'A', text: '早做规划', weights: { planning: 20 } }, { label: 'B', text: '有社保就行', weights: { planning: 10, chill: 5 } }, { label: 'C', text: '不想那么远', weights: { spontaneity: 15 } }, { label: 'D', text: '以后再说', weights: { spontaneity: 10, chill: 5 } },
  ]),
  card('M25', '金钱观', '金钱安全感', '什么让你有金钱安全感？', [
    { label: 'A', text: '存款数字', weights: { planning: 20 } }, { label: 'B', text: '稳定收入', weights: { planning: 15 } }, { label: 'C', text: '家人支持', weights: { emotion: 15 } }, { label: 'D', text: '随时能赚', weights: { initiative: 15, spontaneity: 5 } },
  ]),
  // ============ 社交边界 B05-B25 ============
  card('B05', '社交边界', '异性聚会', 'TA 和一群异性朋友聚会到深夜。你会？', [
    { label: 'A', text: '完全放心', weights: { boundary: -10, emotion: -15 } }, { label: 'B', text: '问一句到家没', weights: { cling: 10, emotion: 5 } }, { label: 'C', text: '有点不安', weights: { emotion: 15, boundary: 5 } }, { label: 'D', text: '希望 TA 报备', weights: { boundary: 10, cling: 15 } },
  ]),
  card('B06', '社交边界', '前任聚餐', 'TA 要跟前任单独吃饭。你会？', [
    { label: 'A', text: 'OK 啊', weights: { boundary: -15, emotion: -10 } }, { label: 'B', text: '有点介意', weights: { emotion: 15 } }, { label: 'C', text: '直接说不舒服', weights: { initiative: 15, boundary: 10 } }, { label: 'D', text: '要求带自己', weights: { boundary: 10, initiative: 10 } },
  ]),
  card('B07', '社交边界', '闺蜜兄弟', 'TA 和闺蜜/兄弟约饭,你觉得？', [
    { label: 'A', text: '很正常', weights: { boundary: -5, emotion: -10 } }, { label: 'B', text: '希望介绍认识', weights: { deep_talk: 10, initiative: 5 } }, { label: 'C', text: '希望别太频繁', weights: { boundary: 10, cling: 5 } }, { label: 'D', text: '随便', weights: { spontaneity: 10 } },
  ]),
  card('B08', '社交边界', '手机壁纸', 'TA 的手机壁纸还是前任照片。你会？', [
    { label: 'A', text: '无所谓', weights: { emotion: -15, boundary: -5 } }, { label: 'B', text: '开玩笑问问', weights: { initiative: 10, wit: 5 } }, { label: 'C', text: '心里不舒服', weights: { emotion: 15 } }, { label: 'D', text: '直接说换掉', weights: { initiative: 15, boundary: 10 } },
  ]),
  card('B09', '社交边界', '社交平台', 'TA 在社交平台很活跃,你？', [
    { label: 'A', text: '一起玩', weights: { social_battery: 15, wit: 10 } }, { label: 'B', text: '不太用', weights: { boundary: 10 } }, { label: 'C', text: '希望少发', weights: { boundary: 10, emotion: 5 } }, { label: 'D', text: '互不干涉', weights: { boundary: 15 } },
  ]),
  card('B10', '社交边界', '异性同事', 'TA 经常和异性同事加班。你会？', [
    { label: 'A', text: '信任', weights: { boundary: -10, emotion: -10 } }, { label: 'B', text: '偶尔问问', weights: { cling: 10, emotion: 5 } }, { label: 'C', text: '心里犯嘀咕', weights: { emotion: 15 } }, { label: 'D', text: '希望多分享', weights: { deep_talk: 10, cling: 10 } },
  ]),
  card('B11', '社交边界', '出差应酬', 'TA 出差要应酬喝酒。你会？', [
    { label: 'A', text: '叮嘱少喝', weights: { cling: 10, emotion: 10 } }, { label: 'B', text: '相信 TA 有分寸', weights: { boundary: 10, emotion: -5 } }, { label: 'C', text: '要求视频确认', weights: { cling: 15, boundary: -10 } }, { label: 'D', text: '无所谓', weights: { spontaneity: 10, boundary: 5 } },
  ]),
  card('B12', '社交边界', '加班', 'TA 连续加班,你会？', [
    { label: 'A', text: '理解', weights: { boundary: 10, planning: 5 } }, { label: 'B', text: '心疼', weights: { emotion: 15, cling: 5 } }, { label: 'C', text: '抱怨没时间陪', weights: { cling: 15, emotion: 10 } }, { label: 'D', text: '送点吃的', weights: { emotion: 10, initiative: 10 } },
  ]),
  card('B13', '社交边界', '朋友圈互动', 'TA 频繁给异性点赞评论。你会？', [
    { label: 'A', text: '无所谓', weights: { emotion: -15, boundary: -5 } }, { label: 'B', text: '问一句', weights: { initiative: 10, deep_talk: 5 } }, { label: 'C', text: '心里不舒服', weights: { emotion: 15 } }, { label: 'D', text: '觉得不太合适', weights: { boundary: 15, emotion: 10 } },
  ]),
  card('B14', '社交边界', '合照', 'TA 和其他异性拍了亲密合照。你会？', [
    { label: 'A', text: '没什么', weights: { emotion: -15, boundary: -10 } }, { label: 'B', text: '问是什么场合', weights: { initiative: 10, deep_talk: 5 } }, { label: 'C', text: '不舒服但没说', weights: { emotion: 15, boundary: 5 } }, { label: 'D', text: '明确表达底线', weights: { boundary: 15, initiative: 10 } },
  ]),
  card('B15', '社交边界', '隐私界限', '你希望关系里保留的隐私？', [
    { label: 'A', text: '几乎没有', weights: { cling: 15, emotion: 10 } }, { label: 'B', text: '聊天记录', weights: { boundary: 15 } }, { label: 'C', text: '个人财务', weights: { boundary: 20, planning: 5 } }, { label: 'D', text: '全部公开', weights: { social_battery: 5, spontaneity: 5 } },
  ]),
  card('B16', '社交边界', '查岗', '你对「查岗」的态度？', [
    { label: 'A', text: '应该报备', weights: { cling: 15, boundary: -10 } }, { label: 'B', text: '偶尔可以', weights: { boundary: 5, deep_talk: 5 } }, { label: 'C', text: '反感', weights: { boundary: 20, spontaneity: -5 } }, { label: 'D', text: '无所谓', weights: { spontaneity: 10 } },
  ]),
  card('B17', '社交边界', '报备程度', '你觉得出门需要报备吗？', [
    { label: 'A', text: '大事报备', weights: { planning: 10, deep_talk: 5 } }, { label: 'B', text: '事事报备', weights: { cling: 15 } }, { label: 'C', text: '不用', weights: { boundary: 20 } }, { label: 'D', text: '看心情', weights: { spontaneity: 10 } },
  ]),
  card('B18', '社交边界', '朋友借钱', 'TA 的朋友向 TA 借钱,你？', [
    { label: 'A', text: '不干涉', weights: { boundary: 15 } }, { label: 'B', text: '帮忙分析', weights: { planning: 10, deep_talk: 5 } }, { label: 'C', text: '反对', weights: { boundary: 10, planning: 10 } }, { label: 'D', text: '一起商量', weights: { deep_talk: 15, planning: 10 } },
  ]),
  card('B19', '社交边界', '异性好友', '你接受伴侣有亲密异性好友吗？', [
    { label: 'A', text: '接受', weights: { boundary: -10, emotion: -15 } }, { label: 'B', text: '要看人', weights: { deep_talk: 10, boundary: 5 } }, { label: 'C', text: '不太接受', weights: { boundary: 15, emotion: 10 } }, { label: 'D', text: '绝不接受', weights: { boundary: 20, emotion: 15 } },
  ]),
  card('B20', '社交边界', '合租', '你能接受和异性合租吗？', [
    { label: 'A', text: '可以', weights: { boundary: -5, spontaneity: 5 } }, { label: 'B', text: '介意', weights: { boundary: 15, planning: 5 } }, { label: 'C', text: '看熟不熟', weights: { deep_talk: 5, boundary: 10 } }, { label: 'D', text: '无所谓', weights: { spontaneity: 10 } },
  ]),
  card('B21', '社交边界', '独居', '你更喜欢？', [
    { label: 'A', text: '独居', weights: { boundary: 20, chill: 10 } }, { label: 'B', text: '合租热闹', weights: { social_battery: 15, wit: 5 } }, { label: 'C', text: '和伴侣住', weights: { cling: 15, emotion: 10 } }, { label: 'D', text: '和家人住', weights: { emotion: 10, planning: 5 } },
  ]),
  card('B22', '社交边界', '边界表达', '你表达边界的方式？', [
    { label: 'A', text: '直接说', weights: { initiative: 20, boundary: 15 } }, { label: 'B', text: '委婉暗示', weights: { emotion: 10, boundary: 5 } }, { label: 'C', text: '行动表达', weights: { planning: 10, boundary: 5 } }, { label: 'D', text: '默默远离', weights: { boundary: 15, initiative: -10 } },
  ]),
  card('B23', '社交边界', '关系认定', '你对「确定关系」的态度？', [
    { label: 'A', text: '要明确说', weights: { initiative: 15, planning: 10 } }, { label: 'B', text: '自然发生', weights: { spontaneity: 15 } }, { label: 'C', text: '需要仪式感', weights: { emotion: 15, planning: 5 } }, { label: 'D', text: '无所谓', weights: { spontaneity: 10, boundary: 5 } },
  ]),
  card('B24', '社交边界', '朋友意见', '朋友都不看好 TA,你会？', [
    { label: 'A', text: '听朋友的', weights: { planning: 15, boundary: 5 } }, { label: 'B', text: '听自己的', weights: { boundary: 15, emotion: 5 } }, { label: 'C', text: '两边都听', weights: { deep_talk: 10, planning: 10 } }, { label: 'D', text: '让 TA 证明', weights: { planning: 10, deep_talk: 5 } },
  ]),
  card('B25', '社交边界', '节奏匹配', '你觉得关系推进的节奏应该？', [
    { label: 'A', text: '看 TA 的节奏', weights: { emotion: 10, deep_talk: 5 } }, { label: 'B', text: '按自己的节奏', weights: { boundary: 15, initiative: 10 } }, { label: 'C', text: '自然最好', weights: { spontaneity: 15 } }, { label: 'D', text: '越快越好', weights: { spontaneity: 10, initiative: 10 } },
  ]),
  // ============ 红线 D05-D25 ============
  card('D05', '红线', '翻手机', 'TA 趁你睡着翻你手机。你会？', [
    { label: 'A', text: '问清楚为什么', weights: { initiative: 15, deep_talk: 10 } }, { label: 'B', text: '觉得被冒犯', weights: { boundary: 20, emotion: 10 } }, { label: 'C', text: '无所谓', weights: { boundary: -15, emotion: -10 } }, { label: 'D', text: '马上分手', weights: { boundary: 20, emotion: 15 } },
  ]),
  card('D06', '红线', '言语侮辱', 'TA 生气时骂你「废物」。你会？', [
    { label: 'A', text: '忍了,TA 只是情绪上头', weights: { boundary: -10, emotion: 10 } }, { label: 'B', text: '要求道歉', weights: { boundary: 15, initiative: 10 } }, { label: 'C', text: '转身就走', weights: { boundary: 20 } }, { label: 'D', text: '明确这是底线', weights: { boundary: 20, deep_talk: 10 } },
  ]),
  card('D07', '红线', '情绪勒索', 'TA 说「你要走我就...」威胁你。你会？', [
    { label: 'A', text: '先安抚 TA', weights: { emotion: 15, boundary: -5 } }, { label: 'B', text: '表示不接受威胁', weights: { boundary: 20, deep_talk: 10 } }, { label: 'C', text: '害怕不敢走', weights: { emotion: 15, boundary: -10 } }, { label: 'D', text: '寻求帮助', weights: { initiative: 10, deep_talk: 10 } },
  ]),
  card('D08', '红线', 'PUA 打压', 'TA 总说你「离开 TA 没人要」。你会？', [
    { label: 'A', text: '当真了', weights: { emotion: 15, boundary: -10 } }, { label: 'B', text: '反驳 TA', weights: { initiative: 15, boundary: 10 } }, { label: 'C', text: '意识到不对', weights: { boundary: 15, deep_talk: 10 } }, { label: 'D', text: '离开 TA', weights: { boundary: 20, initiative: 10 } },
  ]),
  card('D09', '红线', '妈宝', 'TA 凡事都听妈妈的。你会？', [
    { label: 'A', text: '觉得孝顺', weights: { emotion: 10, boundary: -5 } }, { label: 'B', text: '有点担心', weights: { emotion: 10, boundary: 5 } }, { label: 'C', text: '明确自己的感受', weights: { boundary: 15, deep_talk: 10 } }, { label: 'D', text: '难以接受', weights: { boundary: 20 } },
  ]),
  card('D10', '红线', '撒谎成性', 'TA 总在小事上撒谎。你会？', [
    { label: 'A', text: '睁一只眼闭一只眼', weights: { emotion: 10, boundary: -10 } }, { label: 'B', text: '当面拆穿', weights: { initiative: 15, boundary: 10 } }, { label: 'C', text: '重新考虑信任', weights: { boundary: 15, deep_talk: 10 }, tags: ['lying'] }, { label: 'D', text: '分开', weights: { boundary: 20 }, tags: ['lying'] },
  ]),
  card('D11', '红线', '出轨迹象', '你发现 TA 有暧昧对象。你会？', [
    { label: 'A', text: '直接对质', weights: { initiative: 20, deep_talk: 10 } }, { label: 'B', text: '先观察', weights: { planning: 10, boundary: 5 } }, { label: 'C', text: '伤心但不说', weights: { emotion: 15, boundary: -5 } }, { label: 'D', text: '结束关系', weights: { boundary: 20, emotion: 10 } },
  ]),
  card('D12', '红线', '过度控制', 'TA 要求删掉所有异性好友。你会？', [
    { label: 'A', text: '照做', weights: { cling: 15, boundary: -15 } }, { label: 'B', text: '觉得越界', weights: { boundary: 20, emotion: 5 }, tags: ['control'] }, { label: 'C', text: '协商各退一步', weights: { deep_talk: 15, boundary: 5 } }, { label: 'D', text: '拒绝并警惕', weights: { boundary: 20, initiative: 10 }, tags: ['control'] },
  ]),
  card('D13', '红线', '突然消失', 'TA 突然失联三天。你会？', [
    { label: 'A', text: '疯狂找 TA', weights: { cling: 20, emotion: 15 } }, { label: 'B', text: '等 TA 出现', weights: { boundary: 10, planning: 5 } }, { label: 'C', text: '担心出事', weights: { emotion: 15, deep_talk: 5 } }, { label: 'D', text: '重新评估关系', weights: { boundary: 15, planning: 10 } },
  ]),
  card('D14', '红线', '借钱不还', 'TA 借钱一直不还,还再借。你会？', [
    { label: 'A', text: '再借一次', weights: { emotion: 10, boundary: -15 } }, { label: 'B', text: '拒绝并要账', weights: { boundary: 15, initiative: 10 } }, { label: 'C', text: '找 TA 认真谈', weights: { deep_talk: 15, planning: 10 } }, { label: 'D', text: '以后不再往来', weights: { boundary: 20 } },
  ]),
  card('D15', '红线', '精神控制', 'TA 说你必须听 TA 的,否则惩罚你。你会？', [
    { label: 'A', text: '服从', weights: { emotion: 10, boundary: -20 }, tags: ['control'] }, { label: 'B', text: '反抗', weights: { initiative: 20, boundary: 15 }, tags: ['control'] }, { label: 'C', text: '找朋友帮忙', weights: { deep_talk: 10, initiative: 10 } }, { label: 'D', text: '彻底离开', weights: { boundary: 25 }, tags: ['control'] },
  ]),
  card('D16', '红线', '肢体暴力', 'TA 动手推了你一下。你会？', [
    { label: 'A', text: '觉得是意外', weights: { emotion: 10, boundary: -15 } }, { label: 'B', text: '警告 TA', weights: { boundary: 20, initiative: 10 } }, { label: 'C', text: '马上离开', weights: { boundary: 25 }, tags: ['emotional_abuse'] }, { label: 'D', text: '报警/求助', weights: { initiative: 15, boundary: 20 }, tags: ['emotional_abuse'] },
  ]),
  card('D17', '红线', '不尊重父母', 'TA 当众嘲讽你父母。你会？', [
    { label: 'A', text: '忍了', weights: { emotion: 10, boundary: -10 } }, { label: 'B', text: '当场反驳', weights: { initiative: 15, boundary: 10 }, tags: ['disrespect_parents'] }, { label: 'C', text: '严肃谈一次', weights: { deep_talk: 15, boundary: 10 }, tags: ['disrespect_parents'] }, { label: 'D', text: '分手', weights: { boundary: 20 }, tags: ['disrespect_parents'] },
  ]),
  card('D18', '红线', '脚踏两船', '你发现 TA 同时和多人暧昧。你会？', [
    { label: 'A', text: '给 TA 机会解释', weights: { deep_talk: 10, emotion: 10 } }, { label: 'B', text: '直接结束', weights: { boundary: 25 }, tags: ['lying'] }, { label: 'C', text: '伤心欲绝', weights: { emotion: 20, boundary: -5 } }, { label: 'D', text: '报复 TA', weights: { emotion: 15, boundary: -10 } },
  ]),
  card('D19', '红线', '道德绑架', 'TA 说「我为你付出这么多」。你会？', [
    { label: 'A', text: '内疚', weights: { emotion: 15, boundary: -10 } }, { label: 'B', text: '觉得不舒服', weights: { boundary: 15, emotion: 5 } }, { label: 'C', text: '澄清付出是自愿的', weights: { boundary: 15, deep_talk: 10 } }, { label: 'D', text: '疏远 TA', weights: { boundary: 20 } },
  ]),
  card('D20', '红线', '嫌弃贬低', 'TA 总说你「不如别人」。你会？', [
    { label: 'A', text: '努力证明自己', weights: { initiative: 15, emotion: 10 } }, { label: 'B', text: '反问 TA 凭什么', weights: { boundary: 15, initiative: 10 } }, { label: 'C', text: '自我怀疑', weights: { emotion: 15, boundary: -10 } }, { label: 'D', text: '离开这种关系', weights: { boundary: 20, deep_talk: 10 } },
  ]),
  card('D21', '红线', '对比前任', 'TA 总拿你跟前任比。你会？', [
    { label: 'A', text: '有点难受', weights: { emotion: 15 } }, { label: 'B', text: '直接说不喜欢', weights: { initiative: 15, boundary: 10 } }, { label: 'C', text: '也提自己前任', weights: { emotion: 10, boundary: 5 } }, { label: 'D', text: '认真谈一次', weights: { deep_talk: 15, boundary: 10 } },
  ]),
  card('D22', '红线', '不耐烦', 'TA 开始对你很不耐烦。你会？', [
    { label: 'A', text: '小心翼翼', weights: { emotion: 15, boundary: -5 } }, { label: 'B', text: '问原因', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '也冷淡回去', weights: { boundary: 10, initiative: -5 } }, { label: 'D', text: '提出需要被尊重', weights: { boundary: 15, deep_talk: 10 } },
  ]),
  card('D23', '红线', '冷暴力循环', 'TA 每次吵架都冷暴力几天。你会？', [
    { label: 'A', text: '每次都等', weights: { emotion: 10, boundary: -10 }, tags: ['silent_treatment'] }, { label: 'B', text: '主动破冰', weights: { initiative: 15, deep_talk: 10 } }, { label: 'C', text: '告诉 TA 这不行', weights: { boundary: 15, deep_talk: 10 }, tags: ['silent_treatment'] }, { label: 'D', text: '离开这种模式', weights: { boundary: 20 }, tags: ['silent_treatment'] },
  ]),
  card('D24', '红线', '最反感行为', '以下哪些是你的绝对红线?请选择 3 项。', [
    { label: 'A', text: '欺骗', tags: ['lying'] }, { label: 'B', text: '暴力', tags: ['emotional_abuse'] }, { label: 'C', text: '冷暴力', tags: ['silent_treatment'] }, { label: 'D', text: '控制', tags: ['control'] }, { label: 'E', text: '背叛', tags: ['lying'] }, { label: 'F', text: '贬低', tags: ['emotional_abuse'] }, { label: 'G', text: '消失', tags: ['cancel_no_notice'] }, { label: 'H', text: '依赖', tags: ['over_dependence'] }, { label: 'I', text: '邋遢', tags: ['messy'] }, { label: 'J', text: '计较', tags: ['money_conflict'] },
  ], true),
  card('D25', '红线', '原则妥协', '为了一段关系,你能妥协什么？', [
    { label: 'A', text: '大部分都可以', weights: { emotion: 15, boundary: -15 } }, { label: 'B', text: '原则问题不行', weights: { boundary: 20, deep_talk: 10 } }, { label: 'C', text: '看对方是谁', weights: { spontaneity: 10, emotion: 10 } }, { label: 'D', text: '基本不妥协', weights: { boundary: 25, planning: 5 } },
  ]),
  // ============ 开放题 X05-X25 ============
  card('X05', '开放题', '理想一天', '你理想中的一天是？', [
    { label: 'A', text: '睡到自然醒', weights: { chill: 20, boundary: 5 } }, { label: 'B', text: '行程满满', weights: { planning: 15, initiative: 10 } }, { label: 'C', text: '和朋友在一起', weights: { social_battery: 20, wit: 10 } }, { label: 'D', text: '说走就走', weights: { spontaneity: 20, explore: 10 } },
  ]),
  card('X06', '开放题', '最后一年', '如果只剩一年生命,你会？', [
    { label: 'A', text: '陪家人', weights: { emotion: 20, cling: 10 } }, { label: 'B', text: '环游世界', weights: { explore: 25, spontaneity: 15 } }, { label: 'C', text: '做想做的事', weights: { spontaneity: 15, initiative: 15 } }, { label: 'D', text: '正常生活', weights: { planning: 10, chill: 10 } },
  ]),
  card('X07', '开放题', '穿越', '如果能穿越,你想去？', [
    { label: 'A', text: '古代', weights: { explore: 15, spontaneity: 5 } }, { label: 'B', text: '未来', weights: { explore: 20, wit: 5 } }, { label: 'C', text: '回到过去', weights: { emotion: 15, planning: 5 } }, { label: 'D', text: '哪都不去', weights: { chill: 10, boundary: 10 } },
  ]),
  card('X08', '开放题', '超能力', '最想要哪种超能力？', [
    { label: 'A', text: '读心术', weights: { deep_talk: 20, emotion: 10 } }, { label: 'B', text: '瞬间移动', weights: { explore: 20, spontaneity: 15 } }, { label: 'C', text: '时间停止', weights: { planning: 15, chill: 5 } }, { label: 'D', text: '隐身', weights: { boundary: 20, wit: 5 } },
  ]),
  card('X09', '开放题', '最怕什么', '你最害怕什么？', [
    { label: 'A', text: '孤独', weights: { cling: 20, emotion: 10 } }, { label: 'B', text: '失败', weights: { initiative: 10, planning: 10 } }, { label: 'C', text: '失去自由', weights: { boundary: 20, spontaneity: 5 } }, { label: 'D', text: '平庸', weights: { explore: 15, initiative: 15 } },
  ]),
  card('X10', '开放题', '最骄傲', '你最骄傲的事是？', [
    { label: 'A', text: '事业成就', weights: { initiative: 15, planning: 15 } }, { label: 'B', text: '学会新技能', weights: { explore: 20, spontaneity: 5 } }, { label: 'C', text: '维持友谊', weights: { deep_talk: 15, social_battery: 10 } }, { label: 'D', text: '做自己', weights: { boundary: 20, chill: 5 } },
  ]),
  card('X11', '开放题', '童年', '你的童年更像？', [
    { label: 'A', text: '调皮捣蛋', weights: { spontaneity: 20, wit: 10 } }, { label: 'B', text: '安静听话', weights: { planning: 10, boundary: 10 } }, { label: 'C', text: '独来独往', weights: { boundary: 15, deep_talk: 5 } }, { label: 'D', text: '朋友很多', weights: { social_battery: 20, wit: 10 } },
  ]),
  card('X12', '开放题', '梦想', '你的梦想是？', [
    { label: 'A', text: '环游世界', weights: { explore: 25 } }, { label: 'B', text: '事业有成', weights: { initiative: 20, planning: 10 } }, { label: 'C', text: '家庭美满', weights: { emotion: 20, cling: 10 } }, { label: 'D', text: '内心自由', weights: { boundary: 20, chill: 10 } },
  ]),
  card('X13', '开放题', '怪癖', '你有哪些奇怪的小习惯？', [
    { label: 'A', text: '整理强迫', weights: { planning: 20 } }, { label: 'B', text: '自言自语', weights: { boundary: 10, wit: 5 } }, { label: 'C', text: '睡前必须刷手机', weights: { spontaneity: 10 } }, { label: 'D', text: '没有怪癖', weights: { planning: 10, chill: 5 } },
  ]),
  card('X14', '开放题', '房间', '如果只能留一件家具,你选？', [
    { label: 'A', text: '大床', weights: { chill: 20 } }, { label: 'B', text: '书桌', weights: { planning: 15, deep_talk: 5 } }, { label: 'C', text: '沙发', weights: { social_battery: 10, wit: 10 } }, { label: 'D', text: '冰箱', weights: { spontaneity: 10, emotion: 5 } },
  ]),
  card('X15', '开放题', '节日', '最喜欢的节日是？', [
    { label: 'A', text: '春节', weights: { emotion: 15, planning: 10 } }, { label: 'B', text: '生日', weights: { emotion: 15, cling: 5 } }, { label: 'C', text: '圣诞', weights: { spontaneity: 15, emotion: 5 } }, { label: 'D', text: '无所谓', weights: { chill: 10 } },
  ]),
  card('X16', '开放题', '天气', '你更喜欢哪种天气？', [
    { label: 'A', text: '晴天', weights: { spontaneity: 15, explore: 10 } }, { label: 'B', text: '雨天', weights: { deep_talk: 15, chill: 10 } }, { label: 'C', text: '下雪', weights: { emotion: 10, wit: 10 } }, { label: 'D', text: '多云', weights: { chill: 10, boundary: 5 } },
  ]),
  card('X17', '开放题', '城市', '最想定居的城市是？', [
    { label: 'A', text: '一线都市', weights: { initiative: 15, explore: 10 } }, { label: 'B', text: '海边小城', weights: { chill: 20, emotion: 5 } }, { label: 'C', text: '古镇', weights: { chill: 15, deep_talk: 5 } }, { label: 'D', text: '山野乡村', weights: { boundary: 15, explore: 10 } },
  ]),
  card('X18', '开放题', '味道', '哪种味道最让你安心？', [
    { label: 'A', text: '饭菜香', weights: { emotion: 15, chill: 10 } }, { label: 'B', text: '青草味', weights: { explore: 15, chill: 10 } }, { label: 'C', text: '洗衣粉味', weights: { planning: 10, boundary: 5 } }, { label: 'D', text: 'TA 的味道', weights: { cling: 20, emotion: 15 } },
  ]),
  card('X19', '开放题', '声音', '最喜欢的声音是？', [
    { label: 'A', text: '雨声', weights: { chill: 20, deep_talk: 5 } }, { label: 'B', text: '音乐', weights: { emotion: 10, wit: 10 } }, { label: 'C', text: 'TA 的声音', weights: { cling: 20, emotion: 15 } }, { label: 'D', text: '安静', weights: { boundary: 20 } },
  ]),
  card('X20', '开放题', '颜色', '你的本命色是？', [
    { label: 'A', text: '蓝色', weights: { chill: 15, deep_talk: 5 } }, { label: 'B', text: '红色', weights: { initiative: 20, emotion: 10 } }, { label: 'C', text: '绿色', weights: { explore: 15, chill: 10 } }, { label: 'D', text: '黑色', weights: { boundary: 20, wit: 5 } },
  ]),
  card('X21', '开放题', '季节', '最喜欢的季节？', [
    { label: 'A', text: '春天', weights: { explore: 15, spontaneity: 10 } }, { label: 'B', text: '夏天', weights: { social_battery: 15, wit: 10 } }, { label: 'C', text: '秋天', weights: { deep_talk: 10, chill: 10 } }, { label: 'D', text: '冬天', weights: { emotion: 10, cling: 5 } },
  ]),
  card('X22', '开放题', '动物', '想成为哪种动物？', [
    { label: 'A', text: '猫', weights: { boundary: 20, chill: 10 } }, { label: 'B', text: '狗', weights: { social_battery: 20, emotion: 10 } }, { label: 'C', text: '鸟', weights: { explore: 20, spontaneity: 15 } }, { label: 'D', text: '鱼', weights: { chill: 15, boundary: 5 } },
  ]),
  card('X23', '开放题', '植物', '你更像哪种植物？', [
    { label: 'A', text: '向日葵', weights: { social_battery: 20, wit: 10 } }, { label: 'B', text: '仙人掌', weights: { boundary: 20, chill: 5 } }, { label: 'C', text: '竹子', weights: { planning: 15, boundary: 10 } }, { label: 'D', text: '蒲公英', weights: { spontaneity: 20, explore: 10 } },
  ]),
  card('X24', '开放题', '乐器', '想学哪种乐器？', [
    { label: 'A', text: '吉他', weights: { spontaneity: 15, wit: 10 } }, { label: 'B', text: '钢琴', weights: { planning: 15, deep_talk: 5 } }, { label: 'C', text: '架子鼓', weights: { emotion: 15, spontaneity: 10 } }, { label: 'D', text: '不感兴趣', weights: { chill: 10 } },
  ]),
  card('X25', '开放题', '冒险', '你敢尝试的冒险是？', [
    { label: 'A', text: '跳伞', weights: { spontaneity: 25, explore: 10 } }, { label: 'B', text: '潜水', weights: { explore: 20, chill: 5 } }, { label: 'C', text: '野外露营', weights: { explore: 15, planning: 5 } }, { label: 'D', text: '都不行', weights: { planning: 10, boundary: 10 } },
  ]),
]
