const app = getApp()
const API = 'http://192.168.124.11:3000/api'

Page({
  data: {
    memberLoad: [],
    members: [],
    currentGroup: null
  },

  onShow() {
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ currentGroup: app.globalData.currentGroup })
    this.loadData()
  },

  async loadData() {
    const groupId = app.globalData.currentGroup?.id
    if (!groupId) return

    const [loadData, members] = await Promise.all([
      this.request(`/tasks/dashboard/member-load?groupId=${groupId}`),
      this.request(`/groups/${groupId}/members`)
    ])

    const maxLoad = Math.max(...loadData.map(l => l.count), 1)
    const roleMap = {}
    members.forEach(m => { roleMap[m.userId] = m.role })

    const memberLoad = loadData.map(l => {
      const pct = (l.count / maxLoad) * 100
      const color = l.count >= 3 ? '#ff4d4f' : l.count >= 2 ? '#faad14' : '#52c41a'
      const role = roleMap[l.userId] || 'member'
      return {
        ...l,
        percent: pct,
        color,
        roleText: role === 'owner' ? '群主' : '成员'
      }
    })

    this.setData({ memberLoad, members })
  },

  request(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: API + url,
        header: {
          'Authorization': 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.statusCode === 401) {
            wx.redirectTo({ url: '/pages/login/login' })
            return
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: reject
      })
    })
  }
})
