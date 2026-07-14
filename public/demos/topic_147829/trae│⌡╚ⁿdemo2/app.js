const app = {
  data: {
    step: 1,
    emotions: [
      { id: 'happy', name: '开心', emoji: ['😊', '😄', '🤩'], color: '#FFD700', bg: 'rgba(255,215,0,0.2)' },
      { id: 'sad', name: '难过', emoji: ['🙁', '😢', '😭'], color: '#87CEEB', bg: 'rgba(135,206,235,0.2)' },
      { id: 'angry', name: '生气', emoji: ['😐', '😠', '🤬'], color: '#FF6347', bg: 'rgba(255,99,71,0.2)' },
      { id: 'anxious', name: '焦虑', emoji: ['😟', '😰', '😱'], color: '#DDA0DD', bg: 'rgba(221,160,221,0.2)' },
      { id: 'tired', name: '疲惫', emoji: ['😪', '😴', '😵'], color: '#A9A9A9', bg: 'rgba(169,169,169,0.2)' },
      { id: 'excited', name: '兴奋', emoji: ['😃', '😆', '🥳'], color: '#FF69B4', bg: 'rgba(255,105,180,0.2)' },
      { id: 'peaceful', name: '平静', emoji: ['😌', '☺️', '🧘'], color: '#98FB98', bg: 'rgba(152,251,152,0.2)' },
      { id: 'confused', name: '困惑', emoji: ['🤔', '😕', '😵‍💫'], color: '#F4A460', bg: 'rgba(244,164,96,0.2)' }
    ],
    records: [],
    eventText: '',
    selectedEmotion: null,
    autoThought: '',
    currentEmoji: '🌊',
    waterHeight: 0,
    waterColor: '#E8E8E8',
    isPressing: false,
    intensity: 0,
    intensityLevel: '—',
    isRecording: false,
    recordTime: '00:00',
    summaryText: '',
    summaryTime: '00:00',
    isSummaryRecording: false,
    seconds: 0,
    fillTimer: null,
    recordingTimer: null,
    recordMode: 'event',
    chatMessages: [],
    chatInput: '',
    aiThinking: false,
    aiGreeting: '',
    chatHistory: [],
    chatInputMode: 'voice',
    isChatRecording: false,
    chatRecordTime: '00:00',
    chatVoiceArmed: false,
    chatRecordSeconds: 0,
    chatRecordTimer: null,
    aiSummary: '',
    aiSummaryLoading: false,
    mediaRecorder: null,
    audioContext: null
  },

  init: function() {
    this.loadRecords()
    this.renderEmotions()
    this.bindEvents()
  },

  loadRecords: function() {
    const records = localStorage.getItem('emotion_records')
    if (records) {
      this.data.records = JSON.parse(records)
    }
  },

  saveRecords: function() {
    localStorage.setItem('emotion_records', JSON.stringify(this.data.records))
  },

  bindEvents: function() {
    document.getElementById('chatInput').addEventListener('input', (e) => {
      this.data.chatInput = e.target.value
      this.updateChatSendBtn()
    })
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendChat()
      }
    })
  },

  renderEmotions: function() {
    const grid = document.getElementById('emotionGrid')
    grid.innerHTML = this.data.emotions.map(e => `
      <div class="emotion-card" onclick="app.selectEmotion('${e.id}')">
        <span class="card-emoji">${e.emoji[0]}</span>
        <span class="card-name">${e.name}</span>
      </div>
    `).join('')
  },

  switchTab: function(tab) {
    const homePage = document.getElementById('home-page')
    const historyPage = document.getElementById('history-page')
    const tabs = document.querySelectorAll('.tab-item')
    
    if (tab === 'home') {
      homePage.style.display = 'flex'
      historyPage.style.display = 'none'
      tabs[0].classList.add('active')
      tabs[1].classList.remove('active')
    } else {
      homePage.style.display = 'none'
      historyPage.style.display = 'flex'
      tabs[0].classList.remove('active')
      tabs[1].classList.add('active')
      this.loadHistory()
    }
  },

  updateSteps: function(step) {
    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
      if (idx + 1 <= step) {
        dot.classList.add('active')
      } else {
        dot.classList.remove('active')
      }
    })
    document.querySelectorAll('.step-line').forEach((line, idx) => {
      if (idx + 1 < step) {
        line.classList.add('active')
      } else {
        line.classList.remove('active')
      }
    })
  },

  showScreen: function(step) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.style.display = 'none'
    })
    document.querySelector(`.screen[data-step="${step}"]`).style.display = 'flex'
    this.updateSteps(step)
    this.data.step = step
  },

  goStep1: function() {
    this.showScreen(1)
  },

  goStep2: function() {
    if (!this.data.eventText) return
    this.showScreen(2)
  },

  goStep3: function() {
    if (!this.data.selectedEmotion) return
    this.showScreen(3)
    this.initAIChat()
  },

  goStep4: function() {
    if (!this.data.autoThought) return
    this.showScreen(4)
    this.renderLevelBar()
  },

  goStep5: function() {
    if (this.data.waterHeight === 0) return
    this.showScreen(5)
    this.renderSummary()
  },

  toggleEventRecording: function() {
    this.showToast('语音输入暂不可用，请手动输入')
    this.editEventText()
  },

  startRecording: async function(mode) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showToast('当前环境不支持录音，请使用手动输入')
        if (mode === 'event') {
          this.editEventText()
        }
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.data.mediaRecorder = new MediaRecorder(stream)
      this.data.recordMode = mode
      this.data.seconds = 0
      this.data.recordTime = '00:00'
      
      if (mode === 'event') {
        this.data.isRecording = true
        document.getElementById('eventRecordBtn').classList.add('recording')
        document.querySelector('#eventRecordBtn .voice-icon-big').textContent = '■'
        document.getElementById('eventVoiceStatus').textContent = '正在录音 00:00'
        document.getElementById('eventVoiceStatus').classList.remove('event-text')
      } else if (mode === 'summary') {
        this.data.isSummaryRecording = true
        document.getElementById('summaryRecordDot').classList.add('recording')
        document.querySelector('#summaryRecordDot .v-icon').textContent = '■'
        document.getElementById('summaryText').textContent = '00:00'
      }

      this.startRecordingTimer()
      this.data.mediaRecorder.start()

      this.data.mediaRecorder.onstop = () => {
        this.stopRecordingTimer()
        stream.getTracks().forEach(track => track.stop())
        if (mode === 'event') {
          this.data.isRecording = false
          document.getElementById('eventRecordBtn').classList.remove('recording')
          document.querySelector('#eventRecordBtn .voice-icon-big').textContent = '●'
          this.showModal('录音完成', '', null, () => {
            this.data.eventText = '（语音记录）'
            this.updateEventTextUI()
          }, () => {
            this.editEventText()
          }, '直接用', '编辑')
        } else if (mode === 'summary') {
          this.data.isSummaryRecording = false
          document.getElementById('summaryRecordDot').classList.remove('recording')
          document.querySelector('#summaryRecordDot .v-icon').textContent = '●'
          if (!this.data.summaryText) {
            this.data.summaryText = '（语音记录）'
          }
          document.getElementById('summaryText').textContent = this.data.summaryText
          document.getElementById('summaryEdit').style.display = 'block'
        }
      }
    } catch (err) {
      console.error('录音失败:', err)
      this.showToast('需要麦克风权限')
    }
  },

  stopRecording: function() {
    if (this.data.mediaRecorder && this.data.mediaRecorder.state === 'recording') {
      this.data.mediaRecorder.stop()
    }
  },

  startRecordingTimer: function() {
    this.data.recordingTimer = setInterval(() => {
      this.data.seconds++
      const mins = Math.floor(this.data.seconds / 60).toString().padStart(2, '0')
      const secs = (this.data.seconds % 60).toString().padStart(2, '0')
      const timeStr = `${mins}:${secs}`
      
      if (this.data.recordMode === 'event') {
        document.getElementById('eventVoiceStatus').textContent = `正在录音 ${timeStr}`
      } else if (this.data.recordMode === 'summary') {
        document.getElementById('summaryText').textContent = timeStr
      }
    }, 1000)
  },

  stopRecordingTimer: function() {
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer)
      this.data.recordingTimer = null
    }
  },

  editEventText: function() {
    this.showModal('发生了什么', '', '简单描述一下发生的事情', (text) => {
      if (text) {
        this.data.eventText = text
        this.updateEventTextUI()
      }
    }, null, '确定', '取消', true)
  },

  updateEventTextUI: function() {
    document.getElementById('eventText').textContent = this.data.eventText
    document.getElementById('eventTextArea').style.display = 'block'
    document.getElementById('eventVoiceStatus').style.display = 'none'
    
    const btn = document.getElementById('step1NextBtn')
    if (this.data.eventText) {
      btn.classList.remove('disabled')
    } else {
      btn.classList.add('disabled')
    }
  },

  selectEmotion: function(id) {
    const emotion = this.data.emotions.find(item => item.id === id)
    this.data.selectedEmotion = emotion
    this.data.currentEmoji = emotion.emoji[0]
    this.data.waterHeight = 0
    this.data.waterColor = emotion.color
    this.data.intensity = 0
    this.data.intensityLevel = '—'

    document.querySelectorAll('.emotion-card').forEach(card => {
      card.classList.remove('selected')
    })
    event.currentTarget.classList.add('selected')

    document.getElementById('step2NextBtn').classList.remove('disabled')
  },

  initAIChat: function() {
    const emotion = this.data.selectedEmotion
    const event = this.data.eventText
    
    const greetings = {
      happy: [
        `听起来「${event}」让你挺开心的～ 能和我说说，在那个开心的瞬间，你心里在对自己说什么吗？`,
        `「${event}」，真好呀。你现在回想一下，那一刻你脑子里最先冒出来的想法是什么？`
      ],
      sad: [
        `我听到你说到「${event}」，换作是我，可能也会感到难过。在情绪最浓的那个瞬间，你心里是不是在对自己说着什么？`,
        `「${event}」，确实会让人不好受。那个时刻，你心里对自己说的第一句话是什么？`
      ],
      angry: [
        `「${event}」，听起来确实让人火大。在你最生气的那个瞬间，脑子里第一个冒出来的念头是什么？`,
        `我能感受到你的愤怒。那个时刻，如果给你的想法配一句台词，它会说什么？`
      ],
      anxious: [
        `「${event}」，换作是谁可能都会有点担心。你最焦虑的那一刻，心里是不是在想"万一……"？能具体说说吗？`,
        `我听到你的焦虑了。在那个瞬间，你脑子里最担心的是什么？`
      ],
      tired: [
        `「${event}」，听起来真的很累。在你最疲惫的那个瞬间，心里在对自己说什么？`,
        `能感到你的疲惫。那一刻，你脑子里冒出来的想法是什么？`
      ],
      excited: [
        `哇，「${event}」听起来好让人兴奋！在你最兴奋的那个瞬间，心里在想什么？`,
        `太棒了！你最开心的那一刻，脑子里第一个冒出来的念头是什么？`
      ],
      peaceful: [
        `「${event}」，听起来很平静呢。那个平静的瞬间，你心里在想什么？`,
        `真好，这种平静的感觉。那一刻，你脑子里在想些什么？`
      ],
      confused: [
        `「${event}」，确实会让人困惑。在你最迷茫的那个瞬间，心里在问自己什么？`,
        `我能理解那种困惑。那一刻，你脑子里最大的疑问是什么？`
      ]
    }
    
    const options = greetings[emotion.id] || greetings.sad
    this.data.aiGreeting = options[Math.floor(Math.random() * options.length)]

    document.getElementById('aiGreeting').textContent = this.data.aiGreeting
    document.getElementById('chatBox').innerHTML = `
      <div class="msg ai" id="msg-0">
        <span class="msg-text">${this.data.aiGreeting}</span>
      </div>
    `
    document.getElementById('chatTextInput').style.display = 'none'
    document.getElementById('chatVoiceArea').style.display = 'flex'
    document.getElementById('chatInput').value = ''
    
    this.data.chatMessages = []
    this.data.chatInput = ''
    this.data.chatHistory = []
    this.data.chatInputMode = 'voice'
    this.data.autoThought = ''
    
    document.getElementById('step3NextBtn').classList.add('disabled')
  },

  toggleChatInputMode: function() {
    this.data.chatInputMode = this.data.chatInputMode === 'voice' ? 'text' : 'voice'
    if (this.data.chatInputMode === 'text') {
      document.getElementById('chatTextInput').style.display = 'flex'
      document.getElementById('chatVoiceArea').style.display = 'none'
      document.getElementById('chatInput').focus()
    } else {
      document.getElementById('chatTextInput').style.display = 'none'
      document.getElementById('chatVoiceArea').style.display = 'flex'
    }
  },

  onChatVoiceStart: function() {
    this.showToast('语音输入暂不可用，请键盘输入')
    if (this.data.chatInputMode !== 'text') {
      this.toggleChatInputMode()
    }
  },

  onChatVoiceEnd: function() {
    if (!this.data.chatVoiceArmed) return
    
    if (this.data.isChatRecording) {
      this.stopChatRecording()
    } else {
      this.data.chatVoiceArmed = false
    }
  },

  startChatRecording: async function() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showToast('当前环境不支持录音')
        this.toggleChatInputMode()
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.data.mediaRecorder = new MediaRecorder(stream)
      this.data.isChatRecording = true
      this.data.chatRecordSeconds = 0
      this.data.chatRecordTime = '00:00'
      
      document.getElementById('chatVoiceBtn').classList.add('recording')
      document.querySelector('#chatVoiceBtn .voice-mic-icon').textContent = '🔴'
      document.getElementById('chatVoiceHint').textContent = '松开 结束 · 上滑 取消'
      document.getElementById('chatRecordTime').style.display = 'block'
      
      this.startChatRecordTimer()
      this.data.mediaRecorder.start()

      this.data.mediaRecorder.onstop = () => {
        this.stopChatRecordTimer()
        stream.getTracks().forEach(track => track.stop())
        
        if (this.data.chatRecordSeconds >= 1) {
          const placeholderText = `（语音消息 ${this.data.chatRecordTime}）`
          this.sendChatMessage(placeholderText)
        } else {
          this.showToast('说话太短了')
        }
        
        this.resetChatRecording()
      }
    } catch (err) {
      console.error('录音失败:', err)
      this.showToast('需要麦克风权限')
      this.resetChatRecording()
    }
  },

  stopChatRecording: function() {
    if (this.data.mediaRecorder && this.data.mediaRecorder.state === 'recording') {
      this.data.mediaRecorder.stop()
    }
  },

  startChatRecordTimer: function() {
    this.data.chatRecordTimer = setInterval(() => {
      this.data.chatRecordSeconds++
      const mm = Math.floor(this.data.chatRecordSeconds / 60).toString().padStart(2, '0')
      const ss = (this.data.chatRecordSeconds % 60).toString().padStart(2, '0')
      this.data.chatRecordTime = `${mm}:${ss}`
      document.getElementById('chatRecordTime').textContent = this.data.chatRecordTime
      
      if (this.data.chatRecordSeconds >= 60) {
        this.stopChatRecording()
      }
    }, 1000)
  },

  stopChatRecordTimer: function() {
    if (this.data.chatRecordTimer) {
      clearInterval(this.data.chatRecordTimer)
      this.data.chatRecordTimer = null
    }
  },

  resetChatRecording: function() {
    this.data.isChatRecording = false
    this.data.chatVoiceArmed = false
    this.data.chatRecordSeconds = 0
    this.data.chatRecordTime = '00:00'
    
    document.getElementById('chatVoiceBtn').classList.remove('recording')
    document.querySelector('#chatVoiceBtn .voice-mic-icon').textContent = '🎤'
    document.getElementById('chatVoiceHint').textContent = '长按说话，松开发送'
    document.getElementById('chatRecordTime').style.display = 'none'
  },

  sendChatMessage: function(text) {
    if (!text || !text.trim() || this.data.aiThinking) return
    
    const content = text.trim()
    const newMsg = { role: 'user', content: content, idx: this.data.chatMessages.length + 1 }
    this.data.chatMessages.push(newMsg)
    this.data.chatHistory.push({ role: 'user', content: content })
    this.data.autoThought = content
    
    this.appendChatMessage(newMsg)
    document.getElementById('chatInput').value = ''
    this.data.chatInput = ''
    this.updateChatSendBtn()
    
    document.getElementById('step3NextBtn').classList.remove('disabled')
    
    this.callAI()
  },

  sendChat: function() {
    const text = this.data.chatInput.trim()
    if (!text || this.data.aiThinking) return
    this.sendChatMessage(text)
  },

  updateChatSendBtn: function() {
    const btn = document.getElementById('chatSendBtn')
    if (this.data.chatInput.trim()) {
      btn.classList.remove('disabled')
    } else {
      btn.classList.add('disabled')
    }
  },

  appendChatMessage: function(msg) {
    const chatBox = document.getElementById('chatBox')
    const div = document.createElement('div')
    div.className = `msg ${msg.role === 'user' ? 'user' : 'ai'}`
    div.id = `msg-${msg.idx}`
    div.innerHTML = `<span class="msg-text">${msg.content}</span>`
    chatBox.appendChild(div)
    chatBox.scrollTop = chatBox.scrollHeight
  },

  callAI: async function() {
    this.data.aiThinking = true
    
    const chatBox = document.getElementById('chatBox')
    const typingDiv = document.createElement('div')
    typingDiv.className = 'msg ai typing-msg'
    typingDiv.innerHTML = '<span class="msg-text typing">正在倾听...</span>'
    chatBox.appendChild(typingDiv)
    chatBox.scrollTop = chatBox.scrollHeight

    try {
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800))
      
      const emotion = this.data.selectedEmotion
      const userMsg = this.data.chatMessages[this.data.chatMessages.length - 1]
      const userText = userMsg ? userMsg.content : ''
      
      let keyword = ''
      if (userText.length > 0) {
        const len = Math.min(userText.length, 8)
        keyword = userText.substring(0, len)
        if (userText.length > len) keyword += '…'
      }
      
      const round = Math.floor(this.data.chatMessages.length / 2)
      
      let responses = []
      
      if (round === 0) {
        responses = [
          `嗯，「${keyword}」——能再多说一点吗？在那个瞬间，你心里具体在想什么？`,
          `我听到了。如果把「${keyword}」这个念头放大一点，它完整的一句话会是什么？`,
          `「${keyword}」，我明白了。那时候你心里是不是还有别的声音在说？`
        ]
      } else if (round === 1) {
        responses = [
          `谢谢你愿意和我说这些。我想问问，有什么证据支持「${keyword}」这个想法吗？`,
          `嗯，我理解。反过来想，有没有什么证据说明「${keyword}」可能不完全是事实？`,
          `你觉得「${keyword}」——这个想法，是百分之百会发生的吗？还是说，有其他可能？`
        ]
      } else if (round === 2) {
        responses = [
          `如果此刻你最好的朋友遇到同样的事，也说着「${keyword}」，你会怎么对他说？`,
          `试着站在旁观者的角度看「${keyword}」——你觉得这个想法有多合理？`,
          `如果一年后再回头看「${keyword}」这件事，你觉得自己会怎么想？`
        ]
      } else {
        responses = [
          `你能把这些说出来，已经很了不起了。现在你感觉怎么样？`,
          `谢谢你愿意和我分享这些。说出来之后，心里有没有轻松一点点？`,
          `你已经做得很好了。现在的你，想对刚才的自己说点什么吗？`
        ]
      }
      
      const reply = responses[Math.floor(Math.random() * responses.length)]
      
      const aiMsg = { role: 'assistant', content: reply, idx: this.data.chatMessages.length + 1 }
      this.data.chatMessages.push(aiMsg)
      this.data.chatHistory.push({ role: 'assistant', content: reply })
      
      chatBox.removeChild(typingDiv)
      this.appendChatMessage(aiMsg)
    } catch (err) {
      chatBox.removeChild(typingDiv)
      this.showToast('AI连接失败')
    }
    
    this.data.aiThinking = false
  },

  onPressStart: function() {
    if (!this.data.selectedEmotion) return
    this.data.isPressing = true
    this.startFilling()
  },

  onPressEnd: function() {
    this.data.isPressing = false
    this.stopFilling()
  },

  resetWater: function() {
    this.stopFilling()
    const emotion = this.data.selectedEmotion
    this.data.waterHeight = 0
    this.data.intensity = 0
    this.data.intensityLevel = '—'
    this.data.currentEmoji = emotion.emoji[0]
    this.data.isPressing = false
    
    document.getElementById('water').style.height = '0%'
    document.getElementById('currentEmoji').textContent = emotion.emoji[0]
    document.getElementById('pressHint').textContent = '按住注水'
    document.getElementById('resetWaterBtn').style.display = 'none'
    document.getElementById('step4NextBtn').classList.add('disabled')
    
    this.updateLevelBar(0)
  },

  startFilling: function() {
    if (this.data.fillTimer) return
    this.data.fillTimer = setInterval(() => {
      let h = this.data.waterHeight + 2
      if (h > 100) h = 100
      this.setWaterLevel(h)
    }, 50)
  },

  stopFilling: function() {
    if (this.data.fillTimer) {
      clearInterval(this.data.fillTimer)
      this.data.fillTimer = null
    }
  },

  setWaterLevel: function(h) {
    const emotion = this.data.selectedEmotion
    if (!emotion) return
    
    let idx = 0
    let level = '—'
    if (h < 34) {
      idx = 0
      level = '一点点'
    } else if (h < 67) {
      idx = 1
      level = '中等'
    } else {
      idx = 2
      level = '非常'
    }
    
    this.data.waterHeight = h
    this.data.intensity = h
    this.data.intensityLevel = level
    this.data.currentEmoji = emotion.emoji[idx]
    
    document.getElementById('water').style.height = `${h}%`
    document.getElementById('water').style.background = emotion.color
    document.querySelector('.wave-top').style.borderColor = `${emotion.color} transparent transparent transparent`
    document.getElementById('currentEmoji').textContent = emotion.emoji[idx]
    
    if (this.data.isPressing) {
      document.getElementById('pressHint').textContent = level
    } else {
      document.getElementById('pressHint').textContent = level
    }
    
    document.getElementById('resetWaterBtn').style.display = h > 0 ? 'block' : 'none'
    document.getElementById('step4NextBtn').classList.toggle('disabled', h === 0)
    
    this.updateLevelBar(h)
  },

  renderLevelBar: function() {
    const emotion = this.data.selectedEmotion
    const levelBar = document.getElementById('levelBar')
    levelBar.innerHTML = `
      <div class="level-item">
        <span class="level-emoji">${emotion.emoji[0]}</span>
        <span class="level-text">一点点</span>
      </div>
      <div class="level-item">
        <span class="level-emoji">${emotion.emoji[1]}</span>
        <span class="level-text">中等</span>
      </div>
      <div class="level-item">
        <span class="level-emoji">${emotion.emoji[2]}</span>
        <span class="level-text">非常</span>
      </div>
    `
    document.getElementById('step4Title').textContent = `${emotion.name}到什么程度`
  },

  updateLevelBar: function(h) {
    const items = document.querySelectorAll('.level-item')
    items.forEach((item, idx) => {
      if ((idx === 0 && h >= 1) || (idx === 1 && h >= 34) || (idx === 2 && h >= 67)) {
        item.classList.add('on')
      } else {
        item.classList.remove('on')
      }
    })
  },

  renderSummary: function() {
    const emotion = this.data.selectedEmotion
    const idx = this.data.intensity < 34 ? 0 : this.data.intensity < 67 ? 1 : 2
    
    document.getElementById('finalEvent').textContent = this.data.eventText
    document.getElementById('finalEmoji').textContent = emotion.emoji[idx]
    document.getElementById('finalEmotion').textContent = `${emotion.name} · ${this.data.intensityLevel}`
    document.getElementById('finalThought').textContent = this.data.autoThought
    
    document.getElementById('aiSummaryLoading').style.display = 'none'
    document.getElementById('aiSummaryContent').style.display = 'none'
    document.getElementById('generateSummaryBtn').style.display = 'block'
    
    this.data.aiSummary = ''
  },

  toggleSummaryRecording: function() {
    this.showToast('语音输入暂不可用，请手动输入')
    this.editSummaryText()
  },

  editSummaryText: function() {
    this.showModal('说点什么', '', '记录一下现在的感受', (text) => {
      if (text) {
        this.data.summaryText = text
        document.getElementById('summaryText').textContent = text
        document.getElementById('summaryEdit').style.display = 'block'
      }
    }, null, '确定', '取消', true)
  },

  generateAISummary: async function() {
    if (this.data.aiSummaryLoading) return
    
    this.data.aiSummaryLoading = true
    document.getElementById('aiSummaryLoading').style.display = 'block'
    document.getElementById('aiSummaryContent').style.display = 'none'
    document.getElementById('generateSummaryBtn').style.display = 'none'
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const emotion = this.data.selectedEmotion.name
      const event = this.data.eventText
      const thought = this.data.autoThought
      const intensity = this.data.intensityLevel
      
      const summaries = [
        `你今天觉察到自己因为「${event}」而感到${emotion}，心里想着「${thought}」。能够注意到这个念头，就是改变的第一步。`,
        `记录一下：因为「${event}」，你感到了${emotion}，那个瞬间你在想「${thought}」。看见它，它就不再控制你了。`,
        `今天你勇敢地面对了自己的情绪——「${event}」带来的${emotion}，以及背后的想法「${thought}」。每一次觉察都是成长。`,
        `情绪笔记：事件是「${event}」，情绪是${emotion}，自动思维是「${thought}」。下次再遇到类似的情况，你已经更了解自己了。`,
        `你做得很好。「${event}」让你感到${emotion}，而你也看见了自己的想法「${thought}」。这份觉察，就是最珍贵的礼物。`
      ]
      const fallback = summaries[Math.floor(Math.random() * summaries.length)]
      this.data.aiSummary = fallback
      
      document.getElementById('aiSummaryText').textContent = fallback
      document.getElementById('aiSummaryLoading').style.display = 'none'
      document.getElementById('aiSummaryContent').style.display = 'block'
    } catch (err) {
      document.getElementById('aiSummaryLoading').style.display = 'none'
      document.getElementById('generateSummaryBtn').style.display = 'block'
      this.showToast('生成失败')
    }
    
    this.data.aiSummaryLoading = false
  },

  submitRecord: function() {
    const emotion = this.data.selectedEmotion
    const idx = this.data.intensity < 34 ? 0 : this.data.intensity < 67 ? 1 : 2
    const now = new Date()
    
    const record = {
      id: Date.now(),
      event: this.data.eventText,
      emotion: {
        id: emotion.id,
        name: emotion.name,
        emoji: emotion.emoji[idx],
        color: emotion.color
      },
      autoThought: this.data.autoThought,
      intensity: this.data.intensity,
      intensityLevel: this.data.intensityLevel,
      summary: this.data.summaryText,
      chatHistory: this.data.chatHistory,
      aiSummary: this.data.aiSummary || '',
      date: now.toISOString(),
      dateText: this.formatDate(now),
      dateKey: this.formatDateKey(now),
      checkedIn: true
    }
    
    this.data.records.unshift(record)
    this.saveRecords()
    
    this.showToast('已保存')
    
    setTimeout(() => {
      this.resetAll()
    }, 1500)
  },

  formatDateKey: function(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatDate: function(date) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    return `${month}月${day}日 ${weekDay}`
  },

  resetAll: function() {
    this.data.step = 1
    this.data.eventText = ''
    this.data.selectedEmotion = null
    this.data.autoThought = ''
    this.data.currentEmoji = '🌊'
    this.data.waterHeight = 0
    this.data.waterColor = '#E8E8E8'
    this.data.intensity = 0
    this.data.intensityLevel = '—'
    this.data.summaryText = ''
    this.data.isRecording = false
    this.data.isSummaryRecording = false
    this.data.chatMessages = []
    this.data.chatInput = ''
    this.data.chatHistory = []
    this.data.aiThinking = false
    this.data.chatInputMode = 'voice'
    this.data.isChatRecording = false
    this.data.chatVoiceArmed = false
    this.data.chatRecordSeconds = 0
    this.data.chatRecordTime = '00:00'
    this.data.aiSummary = ''
    this.data.aiSummaryLoading = false
    
    document.getElementById('eventTextArea').style.display = 'none'
    document.getElementById('eventVoiceStatus').style.display = 'block'
    document.getElementById('eventVoiceStatus').textContent = '点击开始录音'
    document.getElementById('eventVoiceStatus').classList.remove('event-text')
    document.getElementById('step1NextBtn').classList.add('disabled')
    
    document.querySelectorAll('.emotion-card').forEach(card => {
      card.classList.remove('selected')
    })
    
    document.getElementById('water').style.height = '0%'
    document.getElementById('water').style.background = '#E8E8E8'
    document.querySelector('.wave-top').style.borderColor = '#E8E8E8 transparent transparent transparent'
    document.getElementById('currentEmoji').textContent = '🌊'
    document.getElementById('pressHint').textContent = '按住注水'
    document.getElementById('resetWaterBtn').style.display = 'none'
    document.getElementById('step4NextBtn').classList.add('disabled')
    
    document.getElementById('summaryText').textContent = '点击录音'
    document.getElementById('summaryEdit').style.display = 'none'
    
    this.showScreen(1)
  },

  loadHistory: function() {
    this.renderStats()
    this.renderCalendar()
    this.renderRecordList()
  },

  renderStats: function() {
    const records = this.data.records
    const total = records.length
    
    let streak = 0
    if (total > 0) {
      const dates = []
      records.forEach(r => {
        const d = new Date(r.date)
        dates.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
      })
      
      const today = new Date()
      let checkDate = new Date(today)
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
        if (dates.includes(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }
    
    document.getElementById('totalRecords').textContent = total
    document.getElementById('streakDays').textContent = streak
    
    if (records.length === 0) {
      document.getElementById('mostEmoji').textContent = '—'
      return
    }
    
    const count = {}
    records.forEach(r => {
      const id = r.emotion.id
      count[id] = (count[id] || 0) + 1
    })
    
    let maxId = null
    let maxCount = 0
    for (const id in count) {
      if (count[id] > maxCount) {
        maxCount = count[id]
        maxId = id
      }
    }
    
    const emotion = this.data.emotions.find(e => e.id === maxId)
    document.getElementById('mostEmoji').textContent = emotion ? emotion.emoji[0] : '—'
  },

  renderCalendar: function() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    
    document.getElementById('currentMonth').textContent = monthNames[month]
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()
    
    const calendarData = []
    
    for (let i = 0; i < startDay; i++) {
      calendarData.push({ day: '', hasRecord: false })
    }
    
    const records = this.data.records
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const record = records.find(r => r.date.startsWith(dateStr))
      
      if (record) {
        calendarData.push({
          day,
          date: dateStr,
          hasRecord: true,
          color: record.emotion.color,
          emoji: record.emotion.emoji
        })
      } else {
        calendarData.push({
          day,
          date: dateStr,
          hasRecord: false
        })
      }
    }
    
    const calendar = document.getElementById('calendar')
    calendar.innerHTML = calendarData.map(item => {
      if (!item.day) {
        return '<div class="cal-day"></div>'
      }
      return `
        <div class="cal-day ${item.hasRecord ? 'has' : ''}" ${item.hasRecord ? `style="background: ${item.color}22;"` : ''}>
          <span class="cal-num">${item.day}</span>
          ${item.emoji ? `<span class="cal-emoji">${item.emoji}</span>` : ''}
        </div>
      `
    }).join('')
  },

  renderRecordList: function() {
    const records = this.data.records
    const emptyState = document.getElementById('emptyState')
    const recordList = document.getElementById('recordList')
    
    if (records.length === 0) {
      emptyState.style.display = 'flex'
      recordList.innerHTML = ''
      return
    }
    
    emptyState.style.display = 'none'
    
    recordList.innerHTML = records.map(r => `
      <div class="record-item">
        <div class="record-head">
          <div class="record-emoji-wrap" style="background: ${r.emotion.color}22;">
            <span class="record-emoji">${r.emotion.emoji}</span>
          </div>
          <div class="record-top">
            <span class="record-name">${r.emotion.name} · ${r.intensityLevel}</span>
            <span class="record-date">${r.dateText}</span>
          </div>
        </div>
        ${r.event ? `
          <div class="record-detail">
            <span class="detail-label">发生了什么</span>
            <span class="detail-text">${r.event}</span>
          </div>
        ` : ''}
        ${r.autoThought ? `
          <div class="record-detail">
            <span class="detail-label">当时的想法</span>
            <span class="detail-text">${r.autoThought}</span>
          </div>
        ` : ''}
        ${r.aiSummary ? `
          <div class="record-detail ai-detail">
            <span class="detail-label ai-label">✨ AI总结</span>
            <span class="detail-text">${r.aiSummary}</span>
          </div>
        ` : ''}
        ${r.summary ? `
          <div class="record-detail">
            <span class="detail-label">备注</span>
            <span class="detail-text">${r.summary}</span>
          </div>
        ` : ''}
      </div>
    `).join('')
  },

  showToast: function(text) {
    const toast = document.getElementById('toast')
    toast.textContent = text
    toast.classList.add('show')
    setTimeout(() => {
      toast.classList.remove('show')
    }, 2000)
  },

  showModal: function(title, content, placeholder, onConfirm, onCancel, confirmText = '确定', cancelText = '取消', hasInput = false) {
    const overlay = document.getElementById('modalOverlay')
    const modalTitle = document.getElementById('modalTitle')
    const modalContent = document.getElementById('modalContent')
    const modalInput = document.getElementById('modalInput')
    const confirmBtn = document.getElementById('modalConfirm')
    const cancelBtn = document.getElementById('modalCancel')
    
    modalTitle.textContent = title
    
    if (hasInput) {
      modalContent.style.display = 'none'
      modalInput.style.display = 'block'
      modalInput.placeholder = placeholder || ''
      modalInput.value = content || ''
      modalInput.focus()
    } else {
      modalContent.style.display = 'block'
      modalInput.style.display = 'none'
      modalContent.textContent = content
    }
    
    confirmBtn.textContent = confirmText
    cancelBtn.textContent = cancelText
    
    overlay.style.display = 'flex'
    
    const close = () => {
      overlay.style.display = 'none'
      confirmBtn.onclick = null
      cancelBtn.onclick = null
    }
    
    confirmBtn.onclick = () => {
      if (onConfirm) {
        if (hasInput) {
          onConfirm(modalInput.value)
        } else {
          onConfirm()
        }
      }
      close()
    }
    
    cancelBtn.onclick = () => {
      if (onCancel) onCancel()
      close()
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  app.init()
})