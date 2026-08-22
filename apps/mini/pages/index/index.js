Page({
  openGame() {
    wx.navigateTo({ url: '/pages/game/game' })
  },
  onShareAppMessage() {
    return { title: '来玩一局破冰游戏', path: '/pages/index/index' }
  }
})
