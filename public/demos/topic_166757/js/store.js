const defaultUserData = {
  totalFocusMinutes: 0,
  coins: 0,
  consecutiveDays: 0,
  lastFocusDate: '',
  level: 1,
  totalSuccess: 0,
  totalFail: 0,
  deepestFocusMinutes: 0
}

class Store {
  constructor() {
    this.userData = { ...defaultUserData }
    this.records = []
    this.memoList = []
    this.roomData = null
    this.switchCount = 0
    this.switchDate = ''
    this.isLocked = false
    this.isTiming = false
    this.currentMode = ''
    this.timerStartTime = null
    this.isPlayingAudio = false
    this.startPhoto = ''
    this.endPhoto = ''
    this.isAppHidden = false
    this.loadAllData()
    this.initVisibilityChange()
  }

  loadAllData() {
    try {
      const userData = localStorage.getItem('userData')
      if (userData) this.userData = JSON.parse(userData)

      const records = localStorage.getItem('records')
      if (records) this.records = JSON.parse(records)

      const memoList = localStorage.getItem('memoList')
      if (memoList) this.memoList = JSON.parse(memoList)

      const roomData = localStorage.getItem('roomData')
      if (roomData) this.roomData = JSON.parse(roomData)

      const switchCount = localStorage.getItem('switchCount')
      const switchDate = localStorage.getItem('switchDate')
      const isLocked = localStorage.getItem('isLocked')

      const today = this.formatDate(new Date())
      if (switchDate !== today) {
        this.switchCount = 0
        this.switchDate = today
        this.isLocked = false
      } else {
        this.switchCount = switchCount ? parseInt(switchCount) : 0
        this.switchDate = switchDate || today
        this.isLocked = isLocked === 'true'
      }
    } catch (e) {
      console.error('加载数据失败', e)
    }
  }

  saveUserData() {
    try {
      localStorage.setItem('userData', JSON.stringify(this.userData))
    } catch (e) {
      console.error('保存用户数据失败', e)
    }
  }

  saveRecords() {
    try {
      localStorage.setItem('records', JSON.stringify(this.records))
    } catch (e) {
      console.error('保存记录失败', e)
    }
  }

  saveMemos() {
    try {
      localStorage.setItem('memoList', JSON.stringify(this.memoList))
    } catch (e) {
      console.error('保存备忘录失败', e)
    }
  }

  saveRoomData() {
    try {
      localStorage.setItem('roomData', JSON.stringify(this.roomData))
    } catch (e) {
      console.error('保存房间数据失败', e)
    }
  }

  handleSwitchPenalty() {
    const today = this.formatDate(new Date())
    if (this.switchDate !== today) {
      this.switchCount = 0
      this.switchDate = today
    }
    this.switchCount++
    localStorage.setItem('switchCount', this.switchCount.toString())
    localStorage.setItem('switchDate', this.switchDate)

    this.userData.coins = Math.max(0, this.userData.coins - 10)
    this.saveUserData()

    if (this.switchCount >= 3) {
      this.isLocked = true
      localStorage.setItem('isLocked', 'true')
      Util.showModal({
        title: '专注功能已锁定',
        content: `您今日已切出专注 ${this.switchCount} 次，专注功能已被锁定，请明天再来。`,
        confirmText: '知道了',
        showCancel: false
      })
    } else {
      Util.showToast(`切屏惩罚：-10专注币（第${this.switchCount}次）`)
    }
  }

  updateConsecutiveDays() {
    const today = this.formatDate(new Date())
    const lastDate = this.userData.lastFocusDate

    if (!lastDate) {
      this.userData.consecutiveDays = 1
    } else {
      const last = new Date(lastDate)
      const now = new Date(today)
      const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24))

      if (diff === 1) {
        this.userData.consecutiveDays++
      } else if (diff > 1) {
        this.userData.consecutiveDays = 1
      }
    }
    this.userData.lastFocusDate = today
    this.saveUserData()
  }

  formatDate(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  getWhiteNoiseList() {
    return [
      { id: 'rain', name: '雨声', icon: '🌧️', src: '/audio/rain.mp3' },
      { id: 'cafe', name: '咖啡馆', icon: '☕', src: '/audio/cafe.mp3' },
      { id: 'piano', name: '钢琴', icon: '🎹', src: '/audio/piano.mp3' }
    ]
  }

  initVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isAppHidden = true
      } else {
        if (this.isTiming && this.isAppHidden) {
          this.handleSwitchPenalty()
        }
        this.isAppHidden = false
      }
    })
  }

  addRecord(record) {
    this.records.push(record)
    this.saveRecords()
  }

  addMemo(memo) {
    this.memoList.push(memo)
    this.saveMemos()
  }

  deleteMemo(id) {
    this.memoList = this.memoList.filter(m => m.id !== id)
    this.saveMemos()
  }

  updateMemo(id, content) {
    const memo = this.memoList.find(m => m.id === id)
    if (memo) {
      memo.content = content
      this.saveMemos()
    }
  }

  clearMemos() {
    this.memoList = []
    this.saveMemos()
  }

  createRoom() {
    const roomId = Util.generateRoomCode()
    this.roomData = {
      roomId,
      roomName: '自习房间',
      members: [{
        id: 'user_' + Util.generateId(),
        nickName: '我',
        isOnline: true,
        distracted: false
      }],
      activityLog: [{
        type: 'join',
        message: `房间创建成功，房间号：${roomId}`
      }]
    }
    this.saveRoomData()
    return roomId
  }

  joinRoom(roomCode) {
    this.roomData = {
      roomId: roomCode,
      roomName: '自习房间',
      members: [{
        id: 'user_' + Util.generateId(),
        nickName: '我',
        isOnline: true,
        distracted: false
      }],
      activityLog: [{
        type: 'join',
        message: `已加入房间 ${roomCode}`
      }]
    }
    this.saveRoomData()
  }

  leaveRoom() {
    this.roomData = null
    this.saveRoomData()
  }

  toggleOnline(isOnline) {
    if (this.roomData) {
      const member = this.roomData.members.find(m => m.nickName === '我')
      if (member) {
        member.isOnline = isOnline
        this.roomData.activityLog.push({
          type: isOnline ? 'online' : 'offline',
          message: isOnline ? '开始专注' : '结束专注'
        })
        this.saveRoomData()
      }
    }
  }
}

const store = new Store()
