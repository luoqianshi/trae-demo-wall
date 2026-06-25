// ---------- 弹窗交互 ----------
const DEFAULT_WORK_DURATION = 45 * 60 * 1000 // 默认工作时长：45 分钟
const DEFAULT_REST_DURATION = 3 * 60 * 1000 // 默认休息时长：3 分钟

// ---------- 强制置顶：窗口失焦时尝试重新聚焦 ----------
// 配合 background.js 的周期性聚焦心跳，双保险防止被 IDE 等应用遮挡
let focusRetryCount = 0
const MAX_FOCUS_RETRY = 10 // 限制重试次数，避免无限循环干扰用户

window.addEventListener('blur', () => {
  if (focusRetryCount >= MAX_FOCUS_RETRY) return
  focusRetryCount++
  // 延迟重新聚焦，给系统窗口管理器时间处理切换
  setTimeout(() => {
    window.focus()
  }, 200)
})

// 页面加载时立即聚焦
window.focus()

const el = {
  icon: document.getElementById('icon'),
  eyebrow: document.getElementById('eyebrow'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  countdown: document.getElementById('countdown'),
  actionButtons: document.getElementById('actionButtons'),
  restingButtons: document.getElementById('restingButtons'),
  btnRest: document.getElementById('btnRest'),
  btnSnooze: document.getElementById('btnSnooze'),
  btnFalse: document.getElementById('btnFalse'),
  btnDismiss: document.getElementById('btnDismiss'),
  btnEndRest: document.getElementById('btnEndRest'),
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

// 把毫秒转为「X 分钟」或「X 小时 Y 分钟」中文描述
function fmtMinutes(ms) {
  const totalMin = Math.max(1, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`
  if (h > 0) return `${h} 小时`
  return `${m} 分钟`
}

// 休息倒计时显示
let restStart = null
let restTimer = null
let restDuration = DEFAULT_REST_DURATION

// 初始化：根据用户设置更新文案
async function initReminderText() {
  try {
    const state = await send('GET_STATE')
    const workMs = (state && state.workDuration) || DEFAULT_WORK_DURATION
    restDuration = (state && state.restDuration) || DEFAULT_REST_DURATION
    el.subtitle.textContent = `你已经连续工作 ${fmtMinutes(workMs)}，建议起身休息 ${fmtMinutes(restDuration)}。`
    el.btnRest.textContent = `开始休息 · ${fmtMinutes(restDuration)}`
  } catch (e) {
    // 读取失败时保留 HTML 默认文案
  }
}

initReminderText()

async function startRestCountdown() {
  restStart = Date.now()
  document.body.classList.add('resting')
  el.icon.textContent = '☕'
  el.eyebrow.textContent = 'Resting'
  el.title.textContent = '休息中…'
  el.subtitle.textContent = '放松一下眼睛和肩膀，倒计时结束后自动恢复工作。'
  el.countdown.classList.add('rest')
  el.actionButtons.classList.add('hidden')
  el.restingButtons.classList.remove('hidden')

  const tick = () => {
    const left = restDuration - (Date.now() - restStart)
    el.countdown.textContent = fmt(left)
    if (left <= 0) {
      clearInterval(restTimer)
      el.countdown.textContent = '休息结束'
    }
  }
  tick()
  restTimer = setInterval(tick, 1000)
}

// 按钮事件
el.btnRest.addEventListener('click', async () => {
  await send('START_REST')
  await startRestCountdown()
})

el.btnSnooze.addEventListener('click', async () => {
  await send('SNOOZE')
  window.close()
})

el.btnFalse.addEventListener('click', async () => {
  await send('FALSE_ALARM')
  window.close()
})

el.btnDismiss.addEventListener('click', async () => {
  await send('DISMISS')
  window.close()
})

el.btnEndRest.addEventListener('click', async () => {
  if (restTimer) clearInterval(restTimer)
  await send('FALSE_ALARM') // 复用：重置为新一轮工作计时
  window.close()
})
