let recording = false
let mediaRecorder = null
let audioStream = null
let currentPlayEl = null
let audioCtx = null
let melodyInterval = null
let currentMelodyNote = 0

/* ===== 收藏管理 ===== */
const FAVORITES_KEY = 'dialect_rhyme_favorites'

function getFavorites() {
  try {
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch (e) {}
}

function addFavorite(dialect, name, songKey) {
  const favorites = getFavorites()
  const exists = favorites.find(f => f.songKey === songKey)
  if (exists) return false
  
  favorites.push({
    dialect,
    name,
    songKey: songKey || dialect,
    addedAt: Date.now()
  })
  saveFavorites(favorites)
  return true
}

function removeFavorite(songKey) {
  const favorites = getFavorites()
  const filtered = favorites.filter(f => f.songKey !== songKey)
  saveFavorites(filtered)
  return favorites.length !== filtered.length
}

function isFavorite(songKey) {
  const favorites = getFavorites()
  return favorites.some(f => f.songKey === songKey)
}

/* ===== 渲染收藏列表 ===== */
function renderFavorites() {
  const list = document.getElementById('favoritesList')
  const stats = document.getElementById('profileStats')
  const favorites = getFavorites()
  
  if (stats) {
    stats.textContent = '已收藏 ' + favorites.length + ' 首'
  }
  
  if (!list) return
  
  if (favorites.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.9rem">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📻</div>
        <div>还没有收藏的童谣</div>
        <div style="font-size:0.8rem;margin-top:0.3rem">去社区发现更多好童谣吧~</div>
      </div>
    `
    return
  }
  
  list.innerHTML = favorites.map(f => {
    const dialectKey = f.songKey.replace('-小白兔', '')
    return `
    <div class="mini-player" style="position:relative;cursor:pointer" onclick="goDetail('${dialectKey}')">
      <div class="mp-btn" onclick="event.stopPropagation();playProfile(this, '${f.songKey}', '${f.name}')">▶</div>
      <div class="mp-info">
        <div class="mp-title">${f.name} · ${f.dialect}</div>
        <div class="mp-time">点击查看详情</div>
      </div>
      <div style="cursor:pointer;color:var(--muted);font-size:1.1rem;padding:0 0.5rem" onclick="event.stopPropagation();removeFavoriteItem('${f.songKey}')" title="取消收藏">🗑️</div>
    </div>
  `}).join('')
}

function removeFavoriteItem(songKey, el) {
  removeFavorite(songKey)
  renderFavorites()
  showToast('已取消收藏')
}

/* ===== 用户菜单管理 ===== */
function toggleUserMenu() {
  const menu = document.getElementById('userMenu')
  if (menu) {
    menu.classList.toggle('show')
    updateLoginMenu()
  }
}

function hideUserMenu() {
  const menu = document.getElementById('userMenu')
  if (menu) {
    menu.classList.remove('show')
  }
}

function updateLoginMenu() {
  const loginItem = document.querySelector('.menu-item:nth-child(1)')
  const logoutItem = document.querySelector('.menu-item:nth-child(2)')
  const user = getUser()
  
  if (user && user.loggedIn) {
    if (loginItem) loginItem.textContent = '👤 个人中心'
    if (logoutItem) logoutItem.style.display = 'block'
  } else {
    if (loginItem) loginItem.textContent = '🔐 登录'
    if (logoutItem) logoutItem.style.display = 'none'
  }
}

function getUser() {
  try {
    const data = localStorage.getItem('dialect_rhyme_user')
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

function saveUser(user) {
  try {
    localStorage.setItem('dialect_rhyme_user', JSON.stringify(user))
  } catch (e) {}
}

function loadUserInfo() {
  const user = getUser()
  const avatarEl = document.getElementById('userAvatar')
  const nameEl = document.getElementById('userName')
  
  if (user) {
    if (avatarEl) avatarEl.textContent = user.avatar || '🎙️'
    if (nameEl) nameEl.textContent = user.nickname || '童谣收集者'
  }
}

/* ===== 登录功能 ===== */
function handleLogin() {
  hideUserMenu()
  const user = getUser()
  if (user && user.loggedIn) {
    showModal('个人中心', '当前用户：' + (user.nickname || '童谣收集者') + '<br><br>已登录状态')
    return
  }
  
  showModal('登录', `
    <div style="margin-bottom:1rem">
      <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:0.3rem">用户名</label>
      <input type="text" id="loginUsername" placeholder="请输入用户名" style="width:100%;padding:0.6rem;background:var(--card);border:1px solid var(--rule);border-radius:8px;color:var(--ink);font-size:0.9rem;outline:none;text-align:center">
    </div>
    <div style="margin-bottom:0.5rem">
      <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:0.3rem">密码</label>
      <input type="password" id="loginPassword" placeholder="请输入密码" style="width:100%;padding:0.6rem;background:var(--card);border:1px solid var(--rule);border-radius:8px;color:var(--ink);font-size:0.9rem;outline:none;text-align:center">
    </div>
    <div style="font-size:0.75rem;color:var(--accent);text-align:center;margin-bottom:0.5rem">演示账号：user / 123456</div>
  `, () => {
    const username = document.getElementById('loginUsername').value
    const password = document.getElementById('loginPassword').value
    
    if (username === 'user' && password === '123456') {
      saveUser({
        loggedIn: true,
        username: 'user',
        nickname: '童谣爱好者',
        avatar: '🎤'
      })
      loadUserInfo()
      showToast('登录成功！')
    } else {
      showToast('登录失败，演示账号：user / 123456')
    }
  })
  
  const btn = document.querySelector('.modal-btn')
  if (btn) btn.textContent = '登录'
}

/* ===== 退出登录 ===== */
function handleLogout() {
  hideUserMenu()
  showModal('确认退出', '确定要退出登录吗？', () => {
    saveUser({ loggedIn: false })
    loadUserInfo()
    showToast('已退出登录')
  })
  
  const btn = document.querySelector('.modal-btn')
  if (btn) btn.textContent = '退出'
}

/* ===== 更换头像 ===== */
const avatars = ['🎙️', '🎤', '🎧', '🎵', '🎶', '🎹', '🎸', '🎻', '🪕', '🥁', '🎺', '🎷', '👤', '👩', '👨', '🧓', '👵', '👴', '👩‍🦰', '👨‍🦱']

function changeAvatar() {
  hideUserMenu()
  const currentAvatar = document.getElementById('userAvatar')?.textContent || '🎙️'
  
  const avatarGrid = avatars.map(a => `
    <div style="width:48px;height:48px;border-radius:50%;background:${a === currentAvatar ? 'var(--accent)' : 'var(--card)'};border:2px solid ${a === currentAvatar ? 'var(--accent)' : 'var(--rule)'};display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;transition:all 0.2s" onclick="selectAvatar('${a}')">${a}</div>
  `).join('')
  
  showModal('选择头像', `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem">
      ${avatarGrid}
    </div>
  `)
}

function selectAvatar(avatar) {
  const user = getUser() || {}
  user.avatar = avatar
  user.loggedIn = true
  saveUser(user)
  loadUserInfo()
  closeModal()
  showToast('头像已更换')
}

/* ===== 更换昵称 ===== */
function changeNickname() {
  hideUserMenu()
  const user = getUser()
  const currentNickname = user?.nickname || '童谣收集者'
  
  showModal('更换昵称', `
    <div style="margin-bottom:0.5rem">
      <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:0.3rem">新昵称</label>
      <input type="text" id="newNickname" value="${currentNickname}" style="width:100%;padding:0.6rem;background:var(--card);border:1px solid var(--rule);border-radius:8px;color:var(--ink);font-size:0.9rem;outline:none;text-align:center">
    </div>
  `, () => {
    const newNickname = document.getElementById('newNickname').value.trim()
    if (newNickname) {
      const user = getUser() || {}
      user.nickname = newNickname
      user.loggedIn = true
      saveUser(user)
      loadUserInfo()
      showToast('昵称已更换')
    } else {
      showToast('请输入昵称')
    }
  })
  
  const btn = document.querySelector('.modal-btn')
  if (btn) btn.textContent = '确定'
}

/* ===== 童谣旋律数据（各方言不同音调） ===== */
const melodies = {
  '四川话': [523, 587, 659, 523, 523, 587, 659, 523, 659, 698, 784, 659, 698, 784],
  '东北话': [392, 440, 494, 523, 494, 440, 392, 330, 392, 440, 494, 523, 494, 392],
  '粤语': [523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 587, 523, 440, 523],
  '闽南语': [494, 523, 587, 659, 587, 523, 494, 440, 494, 587, 523, 494, 440, 494],
  '吴语': [523, 587, 523, 659, 523, 587, 523, 440, 523, 587, 659, 587, 523, 440],
  '客家话': [392, 440, 494, 440, 392, 440, 494, 523, 494, 440, 392, 440, 392, 330],
  '四川话-小白兔': [523, 587, 659, 523, 523, 587, 659, 523, 659, 698, 784, 659, 698, 784, 659, 587, 523]
}

/* ===== 播放旋律（带调试日志） ===== */
function playMelody(dialect, onEnd) {
  console.log('[PLAY] 开始播放', dialect)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    console.log('[PLAY] AudioContext 创建成功, state:', ctx.state)
    
    if (ctx.state === 'suspended') {
      console.log('[PLAY] 尝试 resume...')
      ctx.resume().then(() => {
        console.log('[PLAY] resume 成功')
        playNotes(ctx, dialect, onEnd)
      }).catch(err => {
        console.error('[PLAY] resume 失败:', err)
        onEnd && onEnd()
      })
    } else {
      playNotes(ctx, dialect, onEnd)
    }
  } catch(e) {
    console.error('[PLAY] AudioContext 创建失败:', e)
    onEnd && onEnd()
  }
}

function playNotes(ctx, dialect, onEnd) {
  const melody = melodies[dialect] || melodies['四川话']
  console.log('[PLAY] 播放旋律:', melody)
  
  let noteIndex = 0
  const noteDuration = 0.35

  const playNext = () => {
    if (noteIndex >= melody.length) {
      console.log('[PLAY] 播放完毕')
      setTimeout(() => {
        ctx.close()
        onEnd && onEnd()
      }, 100)
      return
    }

    const freq = melody[noteIndex]
    console.log('[PLAY] 播放音符', noteIndex + 1, freq + 'Hz')
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDuration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + noteDuration)

    noteIndex++
    setTimeout(playNext, noteDuration * 1000)
  }

  playNext()
}

function stopMelody() {
  clearInterval(melodyInterval)
  melodyInterval = null
  currentMelodyNote = 0
}

/* ===== 极简测试播放函数 ===== */
function testPlay(dialect) {
  console.log('[TEST] testPlay called with:', dialect)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    console.log('[TEST] AudioContext created:', ctx.state)
    
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playTestBeep(ctx))
    } else {
      playTestBeep(ctx)
    }
  } catch(e) {
    console.error('[TEST] Error:', e)
  }
}

function playTestBeep(ctx) {
  console.log('[TEST] Playing beep...')
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.5, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
  setTimeout(() => ctx.close(), 600)
}

const dialectSongs = {
  '四川话': {
    text: '月亮走，我也走，我给月亮提笆篓。一提提到老街口，老街口有坛酒，我跟月亮喝一口。月亮喝得红彤彤，我喝得醉醺醺，一觉睡到大天明。',
    voice: 'zh-CN',
    rate: 0.9,
    pitch: 1.1
  },
  '四川话-小白兔': {
    text: '小白兔，白又白，两只耳朵竖起来，爱吃萝卜爱吃菜，蹦蹦跳跳真可爱。小白兔，跑得快，一蹦一跳上山来，山上有个大花园，花儿朵朵向阳开。',
    voice: 'zh-CN',
    rate: 0.9,
    pitch: 1.1
  },
  '东北话': {
    text: '拉大锯，扯大锯，姥姥家，唱大戏。接闺女，请女婿，小外孙儿也得去。拉一把，扯一把，一下拉到姥姥家。姥姥给块糖，姥爷给块饼，乐得小外孙儿直蹦跶。',
    voice: 'zh-CN',
    rate: 1.0,
    pitch: 0.9
  },
  '粤语': {
    text: '月光光，照地堂，虾仔你乖乖瞓落床。听朝阿妈要赶插秧咯，阿爷睇牛要上山岗。月光光，照地堂，虾仔你乖乖瞓落床，快高长大咯，读书朗朗上口咯。',
    voice: 'zh-HK',
    rate: 0.85,
    pitch: 1.0
  },
  '闽南语': {
    text: '天黑黑，欲落雨，阿公仔举锄头欲掘芋。掘啊掘，掘啊掘，掘着一尾鰡鼓菇。咿呀嘿呀都真正趣味。阿公仔欲煮咸，阿嬷欲煮淡，两个相拍弄破鼎。',
    voice: 'zh-TW',
    rate: 0.8,
    pitch: 1.05
  },
  '吴语': {
    text: '摇啊摇，摇到外婆桥。外婆叫我好宝宝，糖一包，果一包，还有团子还有糕。摇啊摇，摇到外婆桥，外婆夸我好宝宝。',
    voice: 'zh-CN',
    rate: 0.85,
    pitch: 1.15
  },
  '客家话': {
    text: '月光光，照地堂，虾仔你乖乖睡落床。听朝阿爸要去耕田咯，阿妈织麻到天光。月光光，秀才郎，骑白马，过莲塘，莲塘背，种韭菜。',
    voice: 'zh-CN',
    rate: 0.9,
    pitch: 1.0
  }
}

/* ===== 童谣详情数据 ===== */
const songDetails = {
  '四川话': {
    name: '月亮走，我也走',
    collector: '李奶奶',
    location: '四川成都',
    era: '1950s',
    avatar: '👵',
    fullText: '月亮走，我也走，我给月亮提笆篓。一提提到老街口，老街口有坛酒，我跟月亮喝一口。月亮喝得红彤彤，我喝得醉醺醺，一觉睡到大天明。',
    story: '这首童谣流传于川西平原，是当地老人在月夜下哄孩子时即兴编唱的。"笆篓"是四川方言中竹编的背篓，"老街口"指的是成都老城区的街口酒坊。童谣把月亮拟人化，展现了川人豁达乐观的生活态度。2018年被收录进《四川民间童谣保护名录》。',
    likes: 24,
    comments: 5
  },
  '东北话': {
    name: '拉大锯，扯大锯',
    collector: '王大爷',
    location: '辽宁沈阳',
    era: '1960s',
    avatar: '👴',
    fullText: '拉大锯，扯大锯，姥姥家，唱大戏。接闺女，请女婿，小外孙儿也得去。拉一把，扯一把，一下拉到姥姥家。姥姥给块糖，姥爷给块饼，乐得小外孙儿直蹦跶。',
    story: '这是东北地区最广为流传的童谣之一，起源于辽河流域的农村。"拉大锯"是木匠拉锯锯木头的动作，被编成童谣后常用于亲子互动游戏——大人拉着孩子的双手一拉一推模仿锯木头。唱到"姥姥家"时孩子格外兴奋，因为去姥姥家意味着有好吃的。',
    likes: 31,
    comments: 8
  },
  '粤语': {
    name: '月光光，照地堂',
    collector: '阿梅',
    location: '广东广州',
    era: '1940s',
    avatar: '👩',
    fullText: '月光光，照地堂，虾仔你乖乖瞓落床。听朝阿妈要赶插秧咯，阿爷睇牛要上山岗。月光光，照地堂，虾仔你乖乖瞓落床，快高长大咯，读书朗朗上口咯。',
    story: '《月光光》是广府地区最经典的摇篮曲，已有近百年历史。"照地堂"指月光照在院子里的晒谷场上，"虾仔"是粤语对小宝宝的爱称，"瞓落床"意为乖乖睡觉。整首童谣充满了岭南水乡的生活气息，母亲一边哄睡一边诉说明天的农活，展现了勤劳温馨的家庭画面。',
    likes: 45,
    comments: 12
  },
  '闽南语': {
    name: '天黑黑，欲落雨',
    collector: '陈阿婆',
    location: '福建泉州',
    era: '1950s',
    avatar: '🧓',
    fullText: '天黑黑，欲落雨，阿公仔举锄头欲掘芋。掘啊掘，掘啊掘，掘着一尾鰡鼓菇。咿呀嘿呀都真正趣味。阿公仔欲煮咸，阿嬷欲煮淡，两个相拍弄破鼎。',
    story: '《天黑黑》是闽南语童谣中最具代表性的作品，流传于闽南及台湾地区。讲述的是天要下雨时，爷爷拿锄头去挖芋头，却挖到一条泥鳅。爷爷想煮咸的，奶奶想煮淡的，两人争执不下打翻了锅。这个故事幽默风趣，后来被改编为著名歌曲，成为闽南文化的标志之一。',
    likes: 18,
    comments: 3
  },
  '四川话-小白兔': {
    name: '小白兔白又白',
    collector: '张奶奶',
    location: '四川成都',
    era: '1980s',
    avatar: '👵',
    fullText: '小白兔，白又白，两只耳朵竖起来，爱吃萝卜爱吃菜，蹦蹦跳跳真可爱。小白兔，跑得快，一蹦一跳上山来，山上有个大花园，花儿朵朵向阳开。',
    story: '这首童谣起源于川西地区的民间口头文学，最早记录于上世纪八十年代。当地老人常用这首歌哄孩子入睡，"蹦蹦跳跳"一词在四川方言中有特别的俏皮韵味。2019年被收录进《四川民间童谣保护名录》。',
    likes: 56,
    comments: 12
  }
}

/* ===== 跳转到详情页 ===== */
function goDetail(songKey) {
  const detail = songDetails[songKey]
  const songData = dialectSongs[songKey]
  if (!detail || !songData) {
    const baseDialect = songKey.replace('-小白兔', '')
    const detail2 = songDetails[baseDialect]
    const songData2 = dialectSongs[baseDialect]
    if (detail2 && songData2) {
      renderDetail(baseDialect, detail2, songData2)
      return
    }
    return
  }
  renderDetail(songKey, detail, songData)
}

function renderDetail(songKey, detail, songData) {
  const container = document.getElementById('detail-content')
  const favorited = isFavorite(songKey)
  const dialectLabel = songKey.replace('-小白兔', '')
  
  container.innerHTML = `
    <div class="detail-hero">
      <div class="detail-avatar">${detail.avatar}</div>
      <div class="detail-name">${detail.collector}</div>
      <div class="detail-loc">📍 ${detail.location} · ${dialectLabel}</div>
    </div>
    <div class="result-card">
      <div class="r-dialect">🎯 方言：${dialectLabel}</div>
      <div class="r-song">《${detail.name}》</div>
      <div class="r-text">"${detail.fullText}"</div>
      <div class="r-origin">📍 收录地：${detail.location} · 传唱年代：${detail.era} · 采集人：${detail.collector}</div>
    </div>
    <div class="mini-player">
      <div class="mp-btn" onclick="playDetail(this, '${songKey}')">▶</div>
      <div class="mp-info"><div class="mp-title">${dialectLabel}版 · ${detail.name}</div><div class="mp-time" id="detailTime">0:00</div></div>
      <div class="mp-wave" id="detailWave"><span style="height:8px"></span><span style="height:14px"></span><span style="height:6px"></span><span style="height:18px"></span><span style="height:10px"></span></div>
    </div>
    <div class="section-title">童谣故事</div>
    <div class="detail-story">${detail.story}</div>
    <div class="detail-actions">
      <button class="btn-primary" id="detailFavoriteBtn" data-song-key="${songKey}" data-dialect="${dialectLabel}" data-name="${detail.name}" style="${favorited ? 'background:linear-gradient(135deg,#fb7185,#f472b6)' : ''}" onclick="toggleFavorite(this)">${favorited ? '❤️ 已收藏' : '🤍 收藏童谣'}</button>
      <button class="btn-primary" style="background:var(--bg3);color:var(--ink);border:1px solid var(--rule)" onclick="showModal('分享成功', '已分享到社区')">🌐 分享</button>
    </div>
  `
  goPage('page-detail')
}

/* ===== 详情页播放 ===== */
let detailTimer = null
let detailSeconds = 0

function playDetail(el, dialect) {
  const songData = dialectSongs[dialect]
  if (!songData) return
  const wave = document.getElementById('detailWave')
  const timeEl = document.getElementById('detailTime')

  const isPlaying = el.textContent === '⏸'

  if (isPlaying) {
    stopSpeak()
    el.textContent = '▶'
    if (wave) wave.classList.remove('playing')
    clearInterval(detailTimer)
    return
  }

  if (currentPlayEl && currentPlayEl !== el) {
    stopSpeak()
    currentPlayEl.textContent = '▶'
  }

  currentPlayEl = el
  el.textContent = '⏸'
  if (wave) wave.classList.add('playing')
  showToast('正在用' + dialect + '朗读：' + songDetails[dialect].name)

  detailSeconds = 0
  clearInterval(detailTimer)
  detailTimer = setInterval(() => {
    detailSeconds++
    const mins = Math.floor(detailSeconds / 60)
    const secs = detailSeconds % 60
    if (timeEl) timeEl.textContent = mins + ':' + (secs < 10 ? '0' + secs : secs)
  }, 1000)

  speakDialect(songData, dialect, () => {
    el.textContent = '▶'
    currentPlayEl = null
    if (wave) wave.classList.remove('playing')
    clearInterval(detailTimer)
    detailSeconds = 0
    if (timeEl) timeEl.textContent = '0:00'
  })
}
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'))
  const map = { 'page-home': 0, 'page-community': 1, 'page-profile': 2 }
  if (map[id] !== undefined) {
    document.querySelectorAll('.tab-item')[map[id]].classList.add('active')
  }
}

/* ===== 方言选择 ===== */
function selectDialect(el) {
  document.querySelectorAll('.dialect-card').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
}

/* ===== 录音切换（真实麦克风录音） ===== */
function toggleRecord() {
  const btn = document.getElementById('recordBtn')
  const hint = document.getElementById('recordHint')
  const wave = document.getElementById('waveArea')

  if (recording) {
    stopRecording(btn, hint, wave)
  } else {
    startRecording(btn, hint, wave)
  }
}

async function startRecording(btn, hint, wave) {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(audioStream)
    
    const audioChunks = []
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      console.log('录音完成，时长:', audioChunks.length, '块')
    }
    
    mediaRecorder.start()
    recording = true
    
    btn.classList.add('recording')
    btn.textContent = '⏹'
    hint.textContent = '正在录音... 点击停止'
    wave.style.display = 'flex'
    
    startWaveAnimation()
  } catch (err) {
    console.error('麦克风访问失败:', err)
    showModal('提示', '无法访问麦克风，请检查权限设置。<br><br>已进入演示模式...')
    btn.classList.add('recording')
    btn.textContent = '⏹'
    hint.textContent = '正在录音... 点击停止'
    wave.style.display = 'flex'
    recording = true
    startWaveAnimation()
  }
}

function stopRecording(btn, hint, wave) {
  recording = false
  stopWaveAnimation()
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop())
    audioStream = null
  }
  
  btn.classList.remove('recording')
  btn.textContent = '🎤'
  hint.textContent = '点击开始录制方言童谣'
  wave.style.display = 'none'
  
  showToast('录音完成，AI正在识别方言...')
  
  setTimeout(() => {
    goPage('page-result')
  }, 1500)
}

let waveAnimation = null
function startWaveAnimation() {
  const bars = document.querySelectorAll('.wave-bar')
  waveAnimation = setInterval(() => {
    bars.forEach((bar, i) => {
      const h = Math.random() * 30 + 5
      bar.style.height = h + 'px'
    })
  }, 100)
}

function stopWaveAnimation() {
  if (waveAnimation) {
    clearInterval(waveAnimation)
    waveAnimation = null
  }
}

/* ===== 播放切换 ===== */
function togglePlay(el) {
  el.textContent = el.textContent === '▶' ? '⏸' : '▶'
}

/* ===== 收藏童谣 ===== */
function toggleFavorite(el) {
  const songKey = el.getAttribute('data-song-key') || '四川话-小白兔'
  const dialect = el.getAttribute('data-dialect') || '四川话'
  const name = el.getAttribute('data-name') || '小白兔白又白'
  
  const favorited = isFavorite(songKey)
  
  if (favorited) {
    removeFavorite(songKey)
    el.classList.remove('favorited')
    el.textContent = '🤍 收藏童谣'
    el.style.background = ''
    showToast('已取消收藏')
  } else {
    addFavorite(dialect, name, songKey)
    el.classList.add('favorited')
    el.textContent = '❤️ 已收藏'
    el.style.background = 'linear-gradient(135deg, #fb7185, #f472b6)'
    showToast('已收藏到「我的童谣库」')
  }
  
  if (typeof renderFavorites === 'function') {
    renderFavorites()
  }
}

/* ===== 分享童谣 ===== */
function shareSong() {
  const shareData = {
    title: '方言童谣传声筒',
    text: '快来听这首四川话版《小白兔白又白》，充满了童年的回忆！',
    url: window.location.href
  }

  if (navigator.share) {
    navigator.share(shareData).then(() => {
      showToast('分享成功！')
    }).catch(() => {
      copyToClipboard(shareData.url)
    })
  } else {
    copyToClipboard(shareData.url)
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('链接已复制到剪贴板')
  }).catch(() => {
    showModal('提示', '链接已复制：' + text)
  })
}

/* ===== 社区点赞 ===== */
function toggleLike(el) {
  const liked = el.classList.toggle('liked')
  const match = el.textContent.match(/\d+/)
  if (match) {
    let num = parseInt(match[0])
    num = liked ? num + 1 : num - 1
    el.textContent = (liked ? '❤️' : '👍') + ' ' + num
  }
}

/* ===== 社区评论 ===== */
function showComments(el) {
  const item = el.closest('.comm-item')
  const name = item.querySelector('.comm-name').textContent
  showModal('评论 · ' + name, '💬 张老师：这首童谣让我想起了童年时光<br>💬 小李：方言韵味十足，已收藏！<br>💬 文化志愿者：感谢分享，已录入档案库')
}

/* ===== 社区播放（方言朗读） ===== */
function playCommunity(el) {
  const item = el.closest('.comm-item')
  const dialect = item.querySelector('.comm-dialect').textContent
  const name = item.querySelector('.comm-name').textContent
  const songData = dialectSongs[dialect]

  if (!songData) {
    showToast('暂不支持该方言朗读')
    return
  }

  const isPlaying = el.textContent.includes('暂停') || el.textContent.includes('⏸')

  if (isPlaying) {
    stopSpeak()
    resetPlayBtn(el)
    return
  }

  if (currentPlayEl && currentPlayEl !== el) {
    stopSpeak()
    resetPlayBtn(currentPlayEl)
  }

  currentPlayEl = el
  el.textContent = '⏸ 暂停'
  el.style.color = 'var(--accent)'
  showToast('正在用' + dialect + '朗读：' + name + ' 的童谣')

  speakDialect(songData, dialect, () => {
    resetPlayBtn(el)
    currentPlayEl = null
  })
}

function resetPlayBtn(el) {
  el.textContent = '▶ 播放'
  el.style.color = ''
}

/* ===== 方言朗读（WAV旋律 + 语音合成 + 歌词显示） ===== */
let lyricTimer = null

function speakDialect(songData, dialect, onEnd) {
  /* 1. 播放旋律（保证有声音） */
  playMelody(dialect, onEnd)

  /* 2. 尝试语音合成朗读歌词 */
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(songData.text)
      utter.lang = songData.voice || 'zh-CN'
      utter.rate = songData.rate || 0.9
      utter.pitch = songData.pitch || 1.0
      utter.volume = 1
      const voices = window.speechSynthesis.getVoices()
      const zhVoice = voices.find(v => v.lang.startsWith('zh'))
      if (zhVoice) utter.voice = zhVoice
      window.speechSynthesis.speak(utter)
    } catch (e) {}
  }

  /* 3. 屏幕显示歌词（逐句） */
  showLyrics(songData.text, dialect)
}

/* ===== 歌词逐句显示 ===== */
function showLyrics(text, dialect) {
  hideLyrics()
  const sentences = text.split(/[，。！？\n]/).filter(s => s.trim())
  const overlay = document.createElement('div')
  overlay.id = 'lyricOverlay'
  overlay.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);max-width:90%;background:rgba(10,10,26,0.95);color:var(--accent);padding:1rem 1.5rem;border-radius:16px;border:1px solid var(--accent);font-size:1.1rem;text-align:center;z-index:998;box-shadow:0 4px 24px rgba(251,191,36,0.2);backdrop-filter:blur(10px);line-height:1.6;white-space:normal'
  const label = document.createElement('div')
  label.style.cssText = 'font-size:0.75rem;color:var(--text2);margin-bottom:0.5rem;letter-spacing:2px'
  label.textContent = '🎤 ' + dialect + ' 朗读中'
  const content = document.createElement('div')
  content.id = 'lyricContent'
  content.textContent = sentences[0] || ''
  overlay.appendChild(label)
  overlay.appendChild(content)
  document.body.appendChild(overlay)

  let idx = 0
  const intervalMs = Math.max(1500, (sentences.join('').length * 200))
  lyricTimer = setInterval(() => {
    idx++
    if (idx >= sentences.length) {
      hideLyrics()
      return
    }
    const el = document.getElementById('lyricContent')
    if (el) el.textContent = sentences[idx]
  }, intervalMs)
}

function hideLyrics() {
  clearInterval(lyricTimer)
  lyricTimer = null
  const overlay = document.getElementById('lyricOverlay')
  if (overlay) overlay.remove()
}

function stopSpeak() {
  stopMelody()
  hideLyrics()
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch (e) {}
  }
}

/* ===== 结果页播放（方言朗读） ===== */
let resultTimer = null
let resultSeconds = 0

function playResult(el) {
  const songData = dialectSongs['四川话-小白兔']
  const wave = document.getElementById('resultWave')
  const timeEl = document.getElementById('resultTime')
  const totalSec = 45

  const isPlaying = el.textContent === '⏸'

  if (isPlaying) {
    stopSpeak()
    el.textContent = '▶'
    if (wave) wave.classList.remove('playing')
    clearInterval(resultTimer)
    return
  }

  if (currentPlayEl && currentPlayEl !== el) {
    stopSpeak()
    currentPlayEl.textContent = '▶'
  }

  currentPlayEl = el
  el.textContent = '⏸'
  if (wave) wave.classList.add('playing')
  showToast('正在用四川话朗读：小白兔白又白')

  resultSeconds = 0
  clearInterval(resultTimer)
  resultTimer = setInterval(() => {
    resultSeconds++
    const mins = Math.floor(resultSeconds / 60)
    const secs = resultSeconds % 60
    if (timeEl) {
      timeEl.textContent = mins + ':' + (secs < 10 ? '0' + secs : secs) + ' / 0:45'
    }
    if (resultSeconds >= totalSec) {
      clearInterval(resultTimer)
    }
  }, 1000)

  speakDialect(songData, '四川话-小白兔', () => {
    el.textContent = '▶'
    currentPlayEl = null
    if (wave) wave.classList.remove('playing')
    clearInterval(resultTimer)
    resultSeconds = 0
    if (timeEl) timeEl.textContent = '0:00 / 0:45'
  })
}

/* ===== 个人收录播放（方言朗读） ===== */
function playProfile(el, dialect, songName) {
  let songKey = dialect
  if (songName === '小白兔白又白') songKey = '四川话-小白兔'

  const songData = dialectSongs[songKey] || dialectSongs[dialect]
  if (!songData) {
    showToast('暂不支持该方言朗读')
    return
  }

  const isPlaying = el.textContent === '⏸'

  if (isPlaying) {
    stopSpeak()
    el.textContent = '▶'
    return
  }

  if (currentPlayEl && currentPlayEl !== el) {
    stopSpeak()
    currentPlayEl.textContent = '▶'
  }

  currentPlayEl = el
  el.textContent = '⏸'
  showToast('正在用' + dialect + '朗读：' + songName)

  speakDialect(songData, songKey, () => {
    el.textContent = '▶'
    currentPlayEl = null
  })
}

/* ===== 成就详情 ===== */
function showBadge(el) {
  const name = el.querySelector('div:last-child').textContent
  const icon = el.querySelector('div:first-child').textContent
  showModal('成就详情', icon + ' ' + name + '<br><br>恭喜获得此成就！<br>感谢你为方言童谣保护做出的贡献。')
}

/* ===== 自定义弹窗 ===== */
function showModal(title, content, onConfirm) {
  const overlay = document.getElementById('modalOverlay')
  const header = document.getElementById('modalHeader')
  const body = document.getElementById('modalBody')
  
  if (overlay && header && body) {
    header.textContent = title || '提示'
    body.innerHTML = content
    overlay.style.display = 'flex'
    overlay.classList.add('visible')
    
    if (onConfirm) {
      const btn = overlay.querySelector('.modal-btn')
      if (btn) {
        btn.onclick = function() {
          closeModal()
          onConfirm()
        }
      }
    }
  }
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay')
  if (overlay) {
    overlay.classList.remove('visible')
    setTimeout(() => {
      overlay.style.display = 'none'
    }, 200)
  }
}

/* ===== Toast 提示 ===== */
function showToast(msg) {
  let toast = document.getElementById('toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    toast.style.cssText = 'position:fixed;bottom:100px;left:16px;right:16px;max-width:calc(100% - 32px);background:var(--bg3);color:var(--ink);padding:0.7rem 1.2rem;border-radius:12px;border:1px solid var(--rule);font-size:0.85rem;z-index:999;opacity:0;transition:opacity 0.3s;text-align:center'
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.style.opacity = '1'
  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => { toast.style.opacity = '0' }, 2000)
}

/* ===== 页面初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {
  renderFavorites()
  loadUserInfo()
  
  const resultBtn = document.getElementById('btnFavorite')
  if (resultBtn) {
    const songKey = resultBtn.getAttribute('data-song-key') || '四川话-小白兔'
    if (isFavorite(songKey)) {
      resultBtn.classList.add('favorited')
      resultBtn.textContent = '❤️ 已收藏'
      resultBtn.style.background = 'linear-gradient(135deg, #fb7185, #f472b6)'
    }
  }
  
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu')
    const container = document.getElementById('userInfoContainer')
    if (menu && !menu.contains(e.target) && !container.contains(e.target)) {
      menu.classList.remove('show')
    }
  })
})
