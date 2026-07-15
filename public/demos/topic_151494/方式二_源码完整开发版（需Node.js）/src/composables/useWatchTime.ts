import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { StorageKeys, type WatchRecord } from '@/types'

const todayStr = () => new Date().toISOString().slice(0, 10)

function generateInitialRecords(): WatchRecord[] {
  const arr: WatchRecord[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    arr.push({
      date: dateStr,
      durationMinutes: i === 0 ? 0 : Math.floor(25 + Math.random() * 75)
    })
  }
  return arr
}

const sessionSeconds = ref(0)
export const showEyeReminder = ref(false)
export const showExerciseReminder = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let mountedCount = 0
let recordsReady = false
let records: any = null
let writeRecords: any = null

function ensureRecords() {
  if (recordsReady) return
  try {
    const ls = useLocalStorage<WatchRecord[]>(
      StorageKeys.WATCH_HISTORY,
      generateInitialRecords()
    )
    records = ls.state
    writeRecords = ls.write
  } catch {
    records = ref(generateInitialRecords())
    writeRecords = () => {}
  }
  recordsReady = true
}

function ensureToday() {
  ensureRecords()
  const today = todayStr()
  if (!records.value.find((r: WatchRecord) => r.date === today)) {
    records.value.push({ date: today, durationMinutes: 0 })
  }
}

function todayMinutes() {
  ensureToday()
  return records.value.find((r: WatchRecord) => r.date === todayStr())?.durationMinutes ?? 0
}

function weekData() {
  ensureRecords()
  const today = todayStr()
  const data: WatchRecord[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const s = d.toISOString().slice(0, 10)
    const rec = records.value.find((r: WatchRecord) => r.date === s)
    data.push({ date: s, durationMinutes: rec?.durationMinutes ?? 0 })
  }
  return data
}

function totalWeek() { return weekData().reduce((s: number, r: WatchRecord) => s + r.durationMinutes, 0) }

function tick() {
  sessionSeconds.value++
  if (sessionSeconds.value % 60 === 0) {
    ensureToday()
    const t = records.value.find((r: WatchRecord) => r.date === todayStr())!
    t.durationMinutes++
    try { writeRecords([...records.value]) } catch {}
  }
  if (sessionSeconds.value % 1800 === 0 && sessionSeconds.value > 0) {
    showEyeReminder.value = true
  }
  if (sessionSeconds.value % 3600 === 0 && sessionSeconds.value > 0) {
    showExerciseReminder.value = true
  }
}

function start() {
  if (timer) return
  ensureRecords()
  timer = setInterval(tick, 1000)
}

function stop() {
  if (timer) { clearInterval(timer); timer = null }
}

export function triggerEyeReminder() { showEyeReminder.value = true }
export function triggerExerciseReminder() { showExerciseReminder.value = true }
export function dismissAllReminders() {
  showEyeReminder.value = false
  showExerciseReminder.value = false
}

export function useWatchTime() {
  onMounted(() => {
    mountedCount++
    ensureRecords()
    start()
  })
  onUnmounted(() => {
    mountedCount = Math.max(0, mountedCount - 1)
    if (mountedCount === 0) stop()
  })
  return {
    get records() { ensureRecords(); return records },
    sessionSeconds,
    todayMinutes,
    weekData,
    totalWeek,
    showEyeReminder,
    showExerciseReminder,
    triggerEyeReminder,
    triggerExerciseReminder,
    dismissAllReminders,
    start,
    stop
  }
}
