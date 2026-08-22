const API_URL = 'http://127.0.0.1:3000'

const request = (url, method, data) => new Promise((resolve, reject) => wx.request({ url, method, data, success: resolve, fail: reject }))

Page({
  data: {
    entry: '',
    cardId: '',
    targetId: 2,
    userId: 1,
    progress: 0,
    cardOwned: false,
    cardMessage: '读取到隐藏卡后，可以领取并在完成游戏后送给 TA。',
    stars: Array.from({ length: 8 }, () => ({ done: false })),
  },
  onLoad(options) {
    const entry = decodeURIComponent(options.entry || '')
    const card = entry.match(/[?&]card=([^&]+)/)
    const target = entry.match(/[?&]target=(\d+)/)
    const userId = wx.getStorageSync('ai-chemistry-user-id') || 1
    this.setData({ entry, cardId: card?.[1] || '', targetId: Number(target?.[1]) || 2, userId })
  },
  markStar(event) {
    const index = Number(event.currentTarget.dataset.index)
    const stars = this.data.stars.map((star, itemIndex) => itemIndex === index ? { done: true } : star)
    this.setData({ stars, progress: stars.filter((star) => star.done).length })
  },
  async claimCard() {
    if (!this.data.cardId) return
    const response = await request(`${API_URL}/nfc-cards/${this.data.cardId}/claim`, 'POST', { userId: this.data.userId })
    const ok = response.statusCode >= 200 && response.statusCode < 300
    this.setData({ cardOwned: ok, cardMessage: ok ? '隐藏卡已归你所有。' : '这张卡已经被领取，不能重复获取。' })
  },
  async transferCard() {
    if (!this.data.cardId) return
    const response = await request(`${API_URL}/nfc-cards/${this.data.cardId}/transfer`, 'POST', { fromUserId: this.data.userId, toUserId: this.data.targetId })
    const ok = response.statusCode >= 200 && response.statusCode < 300
    this.setData({ cardOwned: false, cardMessage: ok ? '隐藏卡已送给 TA。' : '隐藏卡转赠失败。' })
  },
  finish() {
    if (this.data.progress === 8) wx.showToast({ title: '合作完成', icon: 'success' })
  },
})
