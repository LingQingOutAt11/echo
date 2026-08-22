Page({
  openGame() {
    wx.navigateTo({ url: '/pages/game/game' })
  },
  scanCard() {
    wx.scanCode({
      onlyFromCamera: true,
      success: ({ result }) => wx.navigateTo({ url: `/pages/game/game?entry=${encodeURIComponent(result)}` }),
    })
  },
  onShareAppMessage() {
    return { title: '来玩一局双人合作破冰游戏', path: '/pages/index/index' }
  },
})
