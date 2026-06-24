// ============================================================
// popup.js — Popup 控制面板交互与数据渲染
// ============================================================

const DEFAULT_REST_DURATION = 3 * 60 * 1000 // 默认休息时长（与 background 一致）

const el = {
  card: document.getElementById('card'),
  statusBadge: document.getElementById('statusBadge'),
  stateLabel: document.getElementById('stateLabel'),
  stateName: document.getElementById('stateName'),
  timeLabel: document.getElementById('timeLabel'),
  timeDisplay: document.getElementById('timeDisplay'),
  progressBar: document.getElementById('progressBar'),
  progressElapsed: document.getElementById('progressElapsed'),
  progressTotal: document.getElementById('progressTotal'),
  dismissedTip: document.getElementById('dismissedTip'),
  restCount: document.getElementById('restCount'),
  todayWorkTime: document.getElementById('todayWorkTime'),
  btnToggle: document.getElementById('btnToggle'),
  btnReset: document.getElementById('btnReset'),
  btnSettings: document.getElementById('btnSettings'),
}

const STATE_META = {
  working: { name: '工作中', label: '当前状态', cls: 'working', timeLabel: '久坐倒计时' },
  resting: { name: '休息中', label: '当前状态', cls: 'resting', timeLabel: '休息倒计时' },
  paused: { name: '已暂停', label: '当前状态', cls: 'paused', timeLabel: '剩余工作时长' },
  idle: { name: '已离开', label: '当前状态', cls: 'idle', timeLabel: '剩余工作时长' },
}

function send(type) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type }, resolve)
  })
}

function fmt(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 把毫秒格式化为「X小时Y分钟」或「Y分钟」
function fmtDuration(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) {
    return `${h}<span class="unit">小时</span>${m}<span class="unit">分</span>`
  }
  return `${m}<span class="unit">分钟</span>`
}

// 计算当前应显示的剩余时间与进度
function computeTime(s) {
  if (s.currentState === 'resting') {
    const restDuration = s.restDuration || DEFAULT_REST_DURATION
    const left = restDuration - (Date.now() - s.startTime)
    return { left: Math.max(0, left), progress: (restDuration - left) / restDuration, over: false, total: restDuration }
  }
  if (s.currentState === 'paused' || s.currentState === 'idle') {
    const progress = (s.timerDuration - s.remainingTime) / s.timerDuration
    return { left: s.remainingTime, progress, over: false, total: s.timerDuration }
  }
  // working
  const elapsed = Date.now() - s.startTime
  const left = s.timerDuration - elapsed
  const progress = elapsed / s.timerDuration
  return { left, progress, over: left < 0, total: s.timerDuration }
}

function render(s) {
  // 状态徽章 —— Linear status-badge
  const meta = STATE_META[s.currentState] || STATE_META.working
  el.statusBadge.className = 'status-badge ' + meta.cls
  el.stateLabel.textContent = meta.label
  el.stateName.textContent = meta.name
  el.timeLabel.textContent = meta.timeLabel

  const { left, progress, over, total } = computeTime(s)
  el.timeDisplay.textContent = fmt(left)

  const pct = Math.min(100, Math.max(0, progress * 100))
  el.progressBar.style.width = pct + '%'
  el.progressBar.classList.toggle('over', over)

  // 进度条下方 meta：已过 / 总时长
  const elapsed = Math.max(0, total - left)
  el.progressElapsed.textContent = fmt(elapsed)
  el.progressTotal.textContent = fmt(total)

  // 忙时免打扰提示
  el.dismissedTip.classList.toggle('hidden', !s.isDismissed)

  // 暂停 / 恢复按钮
  if (s.currentState === 'paused' || s.currentState === 'idle') {
    el.btnToggle.textContent = '恢复'
    el.btnToggle.disabled = s.currentState === 'idle' // 离开状态由系统自动恢复
  } else {
    el.btnToggle.textContent = '暂停'
    el.btnToggle.disabled = s.currentState === 'resting'
  }

  // 统计模块
  el.restCount.innerHTML = `${s.restCount || 0}<span class="unit">次</span>`

  // 今日工作时长：已累计 + 当前 working 段的进行中时间
  let totalWork = s.todayWorkTime || 0
  if (s.currentState === 'working') {
    totalWork += Date.now() - s.startTime
  }
  el.todayWorkTime.innerHTML = fmtDuration(totalWork)
}

let currentState = null
let tickTimer = null

async function refresh() {
  const s = await send('GET_STATE')
  currentState = s
  render(s)
}

function startTick() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(() => {
    if (currentState) render(currentState)
  }, 1000)
}

// 按钮事件
el.btnToggle.addEventListener('click', async () => {
  if (!currentState) return
  if (currentState.currentState === 'paused') {
    await send('RESUME')
  } else if (currentState.currentState === 'working') {
    await send('PAUSE')
  }
  await refresh()
})

el.btnReset.addEventListener('click', async () => {
  await send('RESET')
  await refresh()
})

// 设置页跳转：新开独立标签页打开 settings.html
el.btnSettings.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })
  window.close()
})

// 打开时立即刷新并启动心跳
refresh()
startTick()

// Popup 可见时持续刷新状态（每 2 秒拉取一次最新状态）
setInterval(refresh, 2000)
