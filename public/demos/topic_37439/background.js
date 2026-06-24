// ============================================================
// background.js — Service Worker 核心逻辑与状态机
// ============================================================

// ---------- 常量配置 ----------
const DEFAULT_WORK_DURATION = 45 * 60 * 1000 // 默认工作时长：45 分钟
const DEFAULT_REST_DURATION = 3 * 60 * 1000 // 默认休息时长：3 分钟
const SNOOZE_DURATION = 10 * 60 * 1000 // 稍后提醒：10 分钟
const IDLE_THRESHOLD_MIN_SEC = 15 // Chrome idle API 最小有效值（秒）
const TICK_INTERVAL_SEC = 10 // Badge 心跳间隔：10 秒
const DEFAULT_IDLE_RECOVERY_THRESHOLD = 5 * 60 * 1000 // 空闲超 5 分钟视为已站立
const DEFAULT_LOCK_RECOVERY_THRESHOLD = 30 * 1000 // 锁屏超 30 秒视为已站立

const ALARM_REMINDER = 'reminder-alarm'
const ALARM_REST = 'rest-alarm'
const ALARM_TICK = 'tick-alarm'

// 获取今日日期字符串（YYYY-MM-DD），用于跨天重置统计
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 默认状态（首次安装 / 错误恢复时使用）
const DEFAULT_STATE = {
  currentState: 'working', // working | resting | paused | idle
  startTime: Date.now(), // 当前阶段开始时间戳
  timerDuration: DEFAULT_WORK_DURATION,
  remainingTime: DEFAULT_WORK_DURATION,
  isDismissed: false, // 忙时免打扰标记
  idleReason: null, // 离开原因：'idle' | 'locked'
  // 用户设置
  workDuration: DEFAULT_WORK_DURATION, // 用户自定义工作时长（毫秒）
  restDuration: DEFAULT_REST_DURATION, // 用户自定义休息时长（毫秒）
  idleRecoveryThreshold: DEFAULT_IDLE_RECOVERY_THRESHOLD, // 空闲视为站立的阈值（毫秒）
  lockRecoveryThreshold: DEFAULT_LOCK_RECOVERY_THRESHOLD, // 锁屏视为站立的阈值（毫秒）
  enableFullscreen: true, // 全屏提醒窗口
  enableNotification: true, // 系统通知
  // 今日统计
  restCount: 0, // 今日休息次数
  todayWorkTime: 0, // 今日工作累计时间（毫秒）
  lastResetDate: todayStr(), // 上次重置日期，用于跨天清零
}

// ---------- Storage 读写（绝不依赖全局变量） ----------
async function getState() {
  const data = await chrome.storage.local.get(DEFAULT_STATE)
  return data
}

async function setState(patch) {
  const current = await getState()
  const next = { ...current, ...patch }
  await chrome.storage.local.set(next)
  return next
}

// ---------- 跨天重置检测 ----------
async function checkDayRollover() {
  const s = await getState()
  const today = todayStr()
  if (s.lastResetDate !== today) {
    // 跨天：清零今日统计
    await setState({
      restCount: 0,
      todayWorkTime: 0,
      lastResetDate: today,
    })
  }
}

// ---------- 累加今日工作时间 ----------
// 在离开 working 状态时调用，把这段工作时间计入今日统计
async function accumulateWorkTime() {
  const s = await getState()
  if (s.currentState !== 'working') return
  const elapsed = Date.now() - s.startTime
  if (elapsed > 0) {
    await setState({ todayWorkTime: s.todayWorkTime + elapsed })
  }
}

// ---------- 闹钟辅助 ----------
async function createReminderAlarm(delayMs) {
  await chrome.alarms.create(ALARM_REMINDER, { when: Date.now() + delayMs })
}
async function createRestAlarm(delayMs) {
  await chrome.alarms.create(ALARM_REST, { when: Date.now() + delayMs })
}
async function clearReminderAlarm() {
  await chrome.alarms.clear(ALARM_REMINDER)
}
async function clearRestAlarm() {
  await chrome.alarms.clear(ALARM_REST)
}

// ---------- Badge 更新 ----------
function setBadge(text, color) {
  chrome.action.setBadgeText({ text })
  if (color) chrome.action.setBadgeBackgroundColor({ color })
}

async function updateBadge() {
  const s = await getState()
  if (s.currentState === 'resting') {
    const restDuration = s.restDuration || DEFAULT_REST_DURATION
    const restLeft = restDuration - (Date.now() - s.startTime)
    const mins = Math.max(0, Math.ceil(restLeft / 60000))
    setBadge(String(mins), '#5e6ad2')
    return
  }
  if (s.currentState === 'paused' || s.currentState === 'idle') {
    const mins = Math.max(0, Math.ceil(s.remainingTime / 60000))
    setBadge(String(mins), '#d4a72c')
    return
  }
  // working
  if (s.isDismissed) {
    setBadge('忙', '#62666d')
    return
  }
  const left = s.timerDuration - (Date.now() - s.startTime)
  if (left <= 0) {
    setBadge('0', '#e5484d')
  } else {
    setBadge(String(Math.ceil(left / 60000)), '#27a644')
  }
}

// ---------- 状态流转：开始新一轮工作计时 ----------
async function startWorkSession() {
  const now = Date.now()
  const s = await getState()
  const duration = s.workDuration || DEFAULT_WORK_DURATION
  await setState({
    currentState: 'working',
    startTime: now,
    timerDuration: duration,
    remainingTime: duration,
    isDismissed: false,
  })
  await clearRestAlarm()
  await createReminderAlarm(duration)
  await updateBadge()
}

// ---------- 状态流转：进入休息 ----------
async function startRest() {
  // 先累加本次工作时间到今日统计
  await accumulateWorkTime()

  const now = Date.now()
  const s = await getState()
  const restDuration = s.restDuration || DEFAULT_REST_DURATION
  await setState({
    currentState: 'resting',
    startTime: now,
    remainingTime: restDuration,
    restCount: (s.restCount || 0) + 1, // 休息次数 +1
  })
  await clearReminderAlarm()
  await createRestAlarm(restDuration)
  await updateBadge()
}

// ---------- 状态流转：暂停 ----------
async function pauseWork() {
  const s = await getState()
  if (s.currentState !== 'working') return
  // 累加工作时间
  await accumulateWorkTime()

  const remainingTime = s.timerDuration - (Date.now() - s.startTime)
  await setState({
    currentState: 'paused',
    remainingTime: Math.max(0, remainingTime),
    startTime: Date.now(), // 记录暂停时刻（工作时间已累加）
  })
  await clearReminderAlarm()
  await updateBadge()
}

// ---------- 状态流转：恢复 ----------
async function resumeWork() {
  const s = await getState()
  if (s.currentState !== 'paused' && s.currentState !== 'idle') return
  // 通过反推 startTime 让 remainingTime 保持不变
  const now = Date.now()
  const startTime = now - (s.timerDuration - s.remainingTime)
  await setState({
    currentState: 'working',
    startTime: startTime, // 新的工作起点，后续离开时再累加
  })
  await createReminderAlarm(s.remainingTime)
  await updateBadge()
}

// ---------- 状态流转：稍后提醒（Snooze 10 分钟） ----------
async function snooze() {
  // 累加本次工作时间
  await accumulateWorkTime()

  const now = Date.now()
  const s = await getState()
  const duration = s.workDuration || DEFAULT_WORK_DURATION
  await setState({
    currentState: 'working',
    startTime: now - (duration - SNOOZE_DURATION),
    timerDuration: duration,
    remainingTime: SNOOZE_DURATION,
    isDismissed: false,
  })
  await createReminderAlarm(SNOOZE_DURATION)
  await updateBadge()
}

// ---------- 状态流转：忙时免打扰 ----------
async function dismiss() {
  // 累加本次工作时间
  await accumulateWorkTime()

  const now = Date.now()
  const s = await getState()
  await setState({
    currentState: 'working',
    isDismissed: true,
    startTime: now, // 重置起点，后续工作时间从现在开始累加
  })
  await clearReminderAlarm()
  await updateBadge()
}

// ---------- 更新工作时长设置 ----------
async function updateWorkDuration(minutes) {
  const ms = minutes * 60 * 1000
  await setState({ workDuration: ms })
  // 设置生效后，重置当前工作计时
  await startWorkSession()
}

// ---------- 更新休息时长设置 ----------
async function updateRestDuration(minutes) {
  const ms = minutes * 60 * 1000
  const s = await getState()
  await setState({ restDuration: ms })
  // 若当前正处于休息中，按新时长重置休息计时
  if (s.currentState === 'resting') {
    const now = Date.now()
    await setState({
      startTime: now,
      remainingTime: ms,
    })
    await clearRestAlarm()
    await createRestAlarm(ms)
    await updateBadge()
  }
}

// ---------- 更新锁屏检测阈值设置 ----------
async function updateLockThreshold(seconds) {
  const ms = seconds * 1000
  await setState({ lockRecoveryThreshold: ms })
}

// ---------- 更新空闲检测阈值设置 ----------
async function updateIdleThreshold(minutes) {
  const ms = minutes * 60 * 1000
  await setState({ idleRecoveryThreshold: ms })
  // 同步更新 Chrome 空闲检测间隔，使设置即时生效（Chrome API 最小 15 秒）
  const sec = Math.max(IDLE_THRESHOLD_MIN_SEC, Math.round(ms / 1000))
  chrome.idle.setDetectionInterval(sec)
}

// ---------- 更新提醒方式设置 ----------
async function updateReminderMode(enableFullscreen, enableNotification) {
  const patch = {}
  if (typeof enableFullscreen === 'boolean') patch.enableFullscreen = enableFullscreen
  if (typeof enableNotification === 'boolean') patch.enableNotification = enableNotification
  await setState(patch)
}

// ---------- 打开全屏提醒弹窗 ----------
let reminderWindowId = null
let reminderFocusInterval = null

// 停止周期性聚焦心跳
function stopReminderFocus() {
  if (reminderFocusInterval) {
    clearInterval(reminderFocusInterval)
    reminderFocusInterval = null
  }
}

// 启动周期性聚焦心跳：持续将提醒窗口置顶，防止被 IDE 等应用遮挡
function startReminderFocus() {
  stopReminderFocus()
  reminderFocusInterval = setInterval(async () => {
    if (reminderWindowId === null) {
      stopReminderFocus()
      return
    }
    try {
      await chrome.windows.update(reminderWindowId, {
        focused: true,
        drawAttention: true,
      })
    } catch (e) {
      // 窗口已关闭，停止聚焦心跳
      stopReminderFocus()
    }
  }, 1500) // 每 1.5 秒聚焦一次，平衡置顶效果与系统干扰
}

async function openReminderWindow() {
  // 已存在则聚焦并置顶
  if (reminderWindowId !== null) {
    try {
      const win = await chrome.windows.get(reminderWindowId)
      if (win) {
        await chrome.windows.update(reminderWindowId, {
          focused: true,
          drawAttention: true,
          state: 'normal',
        })
        return
      }
    } catch (e) {
      // 窗口已关闭，继续创建
    }
  }

  const width = 460
  const height = 620
  let left = 100,
    top = 100

  try {
    const displays = await chrome.system.display.getInfo()
    const primary = displays.find((d) => d.isPrimary) || displays[0]
    if (primary) {
      left = Math.round(primary.workArea.left + (primary.workArea.width - width) / 2)
      top = Math.round(primary.workArea.top + (primary.workArea.height - height) / 2)
    }
  } catch (e) {
    // 读取屏幕信息失败时使用默认值
  }

  const win = await chrome.windows.create({
    url: 'reminder.html',
    type: 'popup',
    width,
    height,
    left,
    top,
    focused: true,
  })
  reminderWindowId = win.id

  // 多重聚焦策略：立即聚焦 + 延迟聚焦，确保窗口置顶
  const focusWindow = async () => {
    try {
      await chrome.windows.update(reminderWindowId, {
        focused: true,
        drawAttention: true,
      })
    } catch (e) {
      // 忽略
    }
  }

  await focusWindow()
  // 延迟 100ms 再次聚焦，应对系统窗口管理器的时序问题
  setTimeout(focusWindow, 100)
  // 延迟 300ms 最后一次聚焦，确保覆盖其他应用的抢占
  setTimeout(focusWindow, 300)

  // 启动周期性聚焦心跳，持续保持窗口置顶，防止被 IDE 等应用遮挡
  startReminderFocus()
}

async function closeReminderWindow() {
  // 停止周期性聚焦心跳
  stopReminderFocus()
  if (reminderWindowId !== null) {
    try {
      await chrome.windows.remove(reminderWindowId)
    } catch (e) {
      // 窗口可能已关闭
    }
    reminderWindowId = null
  }
}

// ---------- 系统通知 ----------
async function sendReminderNotification() {
  try {
    const s = await getState()
    const minutes = Math.round(s.timerDuration / 60000)
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: '久坐提醒',
      message: `已工作 ${minutes} 分钟，起身活动一下`,
      priority: 2,
      requireInteraction: true,
      buttons: [{ title: '开始休息' }, { title: '稍后 10 分钟' }],
    })
  } catch (e) {
    // 通知失败不影响主流程
  }
}

// ---------- 通知交互处理 ----------
// 点击通知主体 → 打开完整提醒窗口（含全部 4 个选项）
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    await chrome.notifications.clear(notificationId)
  } catch (e) {
    // 忽略
  }
  await openReminderWindow()
})

// 点击通知按钮 → 直接执行对应操作
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  try {
    await chrome.notifications.clear(notificationId)
  } catch (e) {
    // 忽略
  }
  if (buttonIndex === 0) {
    // 开始休息
    await closeReminderWindow()
    await startRest()
  } else if (buttonIndex === 1) {
    // 稍后 10 分钟
    await closeReminderWindow()
    await snooze()
  }
})

// ---------- 闹钟触发处理 ----------
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const s = await getState()

  if (alarm.name === ALARM_REMINDER) {
    // 工作计时到点
    if (s.currentState !== 'working') return
    if (s.isDismissed) return // 忙时不再弹窗
    // 根据配置触发提醒
    if (s.enableNotification) {
      await sendReminderNotification()
    }
    if (s.enableFullscreen) {
      await openReminderWindow()
    }
    return
  }

  if (alarm.name === ALARM_REST) {
    // 休息结束，回到工作
    if (s.currentState !== 'resting') return
    await closeReminderWindow()
    await startWorkSession()
    return
  }

  if (alarm.name === ALARM_TICK) {
    // 心跳：跨天检测 + 时间错乱检测 + Badge 更新
    await checkDayRollover()
    await handleTimeDrift()
    await updateBadge()
    return
  }
})

// ---------- 锁屏唤醒 / 时间错乱检测 ----------
async function handleTimeDrift() {
  const s = await getState()
  if (s.currentState !== 'working') return

  const elapsed = Date.now() - s.startTime
  // 若已过去时间远大于工作时长（超出 2 倍），说明电脑休眠过，强制重置
  if (elapsed > s.timerDuration * 2) {
    await startWorkSession()
  }
}

// ---------- 系统空闲监听 ----------
chrome.idle.onStateChanged.addListener(async (newState) => {
  const s = await getState()

  // 用户回到活跃
  if (newState === 'active') {
    if (s.currentState === 'idle') {
      // 锁屏场景：进入锁屏时未立即计为休息，回到活跃时按时长判断是否计为一次休息
      if (s.idleReason === 'locked') {
        const lockDuration = Date.now() - s.startTime
        const threshold = s.lockRecoveryThreshold || DEFAULT_LOCK_RECOVERY_THRESHOLD
        if (lockDuration >= threshold) {
          await setState({ restCount: (s.restCount || 0) + 1 })
        }
      }
      // 空闲/锁屏达阈值已记录为一次休息，回到电脑自动重新开始工作计时
      await startWorkSession()
    }
    return
  }

  // 系统进入空闲（Chrome 已按用户阈值确认空闲，视为已站立休息）
  if (newState === 'idle') {
    if (s.currentState === 'working' && !s.isDismissed) {
      // 累加本次工作时间到今日统计
      await accumulateWorkTime()
      // 记录为一次休息，清零计时，等待用户活跃后自动重新开始
      await setState({
        currentState: 'idle',
        idleReason: 'idle',
        startTime: Date.now(),
        remainingTime: s.timerDuration,
        restCount: (s.restCount || 0) + 1,
      })
      await clearReminderAlarm()
      await updateBadge()
    }
    return
  }

  // 系统锁屏（即时事件，需记录时刻，回到活跃时按时长判断）
  if (newState === 'locked') {
    if (s.currentState === 'working' && !s.isDismissed) {
      await accumulateWorkTime()
      const remainingTime = s.timerDuration - (Date.now() - s.startTime)
      await setState({
        currentState: 'idle',
        idleReason: 'locked',
        startTime: Date.now(),
        remainingTime: Math.max(0, remainingTime),
      })
      await clearReminderAlarm()
      await updateBadge()
    }
    return
  }
})

// ---------- 消息处理（来自 popup.js / reminder.html / settings.html） ----------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    switch (msg && msg.type) {
      case 'START_REST':
        await closeReminderWindow()
        await startRest()
        sendResponse({ ok: true })
        break
      case 'SNOOZE':
        await closeReminderWindow()
        await snooze()
        sendResponse({ ok: true })
        break
      case 'FALSE_ALARM':
        await closeReminderWindow()
        await startWorkSession()
        sendResponse({ ok: true })
        break
      case 'DISMISS':
        await closeReminderWindow()
        await dismiss()
        sendResponse({ ok: true })
        break
      case 'PAUSE':
        await pauseWork()
        sendResponse({ ok: true })
        break
      case 'RESUME':
        await resumeWork()
        sendResponse({ ok: true })
        break
      case 'RESET':
        await closeReminderWindow()
        await startWorkSession()
        sendResponse({ ok: true })
        break
      case 'GET_STATE':
        sendResponse(await getState())
        break
      case 'UPDATE_WORK_DURATION':
        await updateWorkDuration(msg.minutes)
        sendResponse({ ok: true })
        break
      case 'UPDATE_REST_DURATION':
        await updateRestDuration(msg.minutes)
        sendResponse({ ok: true })
        break
      case 'UPDATE_LOCK_THRESHOLD':
        await updateLockThreshold(msg.seconds)
        sendResponse({ ok: true })
        break
      case 'UPDATE_IDLE_THRESHOLD':
        await updateIdleThreshold(msg.minutes)
        sendResponse({ ok: true })
        break
      case 'UPDATE_REMINDER_MODE':
        await updateReminderMode(msg.enableFullscreen, msg.enableNotification)
        sendResponse({ ok: true })
        break
      default:
        sendResponse({ ok: false, error: 'unknown message' })
    }
  })()
  return true // 异步响应
})

// ---------- 提醒窗口关闭处理 ----------
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === reminderWindowId) {
    reminderWindowId = null
    stopReminderFocus()
  }
})

// ---------- 初始化 ----------
async function init() {
  // 跨天检测
  await checkDayRollover()

  // 读取用户设置，按用户空闲阈值设置 Chrome 空闲检测间隔（Chrome API 最小 15 秒）
  const s = await getState()
  const idleMs = s.idleRecoveryThreshold || DEFAULT_IDLE_RECOVERY_THRESHOLD
  const idleSec = Math.max(IDLE_THRESHOLD_MIN_SEC, Math.round(idleMs / 1000))
  chrome.idle.setDetectionInterval(idleSec)

  // 创建周期性心跳闹钟（Badge 更新 + 跨天检测）
  await chrome.alarms.create(ALARM_TICK, { periodInMinutes: TICK_INTERVAL_SEC / 60 })

  // 若状态不存在则初始化
  if (!s.currentState || s.currentState === 'working') {
    // 恢复或初始化工作闹钟
    const elapsed = Date.now() - s.startTime
    const left = s.timerDuration - elapsed
    if (s.isDismissed) {
      // 忙时状态，不重建闹钟
    } else if (left > 0 && s.currentState === 'working') {
      await createReminderAlarm(left)
    } else {
      await startWorkSession()
    }
  }

  await updateBadge()
}

chrome.runtime.onInstalled.addListener(init)
chrome.runtime.onStartup.addListener(init)
