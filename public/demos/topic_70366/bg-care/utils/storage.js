const STORAGE_KEY = 'bp_records'
const USER_KEY = 'user_info'
const AI_CONFIG_KEY = 'ai_config'

function getRecords() {
  return wx.getStorageSync(STORAGE_KEY) || []
}

function saveRecords(records) {
  wx.setStorageSync(STORAGE_KEY, records)
}

function addRecord(record) {
  const records = getRecords()
  const newRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  records.unshift(newRecord)
  saveRecords(records)
  return newRecord
}

function deleteRecord(id) {
  const records = getRecords().filter(r => r.id !== id)
  saveRecords(records)
  return records
}

function clearAllRecords() {
  wx.removeStorageSync(STORAGE_KEY)
}

function getRecordsByDays(days) {
  const records = getRecords()
  const now = Date.now()
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return records.filter(r => new Date(r.createdAt).getTime() >= cutoff)
}

function getTodayRecords() {
  const records = getRecords()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return records.filter(r => new Date(r.createdAt).getTime() >= today.getTime())
}

function getLatestRecord() {
  const records = getRecords()
  return records.length > 0 ? records[0] : null
}

function evalBpStatus(systolic, diastolic) {
  if (systolic < 120 && diastolic < 80) return 'normal'
  if (systolic < 130 && diastolic < 80) return 'elevated'
  if (systolic < 140 || diastolic < 90) return 'high'
  return 'critical'
}

function getBpStatusText(status) {
  const map = { normal: '正常', elevated: '偏高', high: '高血压', critical: '危险' }
  return map[status] || '未知'
}

function getBpStatusColor(status) {
  const map = { normal: '#5B8C5A', elevated: '#C49B3F', high: '#CC6B3A', critical: '#B8453C' }
  return map[status] || '#8C8270'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  return m + '月' + day + '日'
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return h + ':' + m
}

function getPeriodLabel(hour) {
  if (hour < 9) return '清晨'
  if (hour < 12) return '上午'
  if (hour < 14) return '中午'
  if (hour < 18) return '下午'
  return '晚上'
}

function getLatest7DaysData() {
  const records = getRecords()
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)

    const dayRecords = records.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= d.getTime() && t < nextDay.getTime()
    })

    if (dayRecords.length > 0) {
      const avgSys = Math.round(dayRecords.reduce((s, r) => s + r.systolic, 0) / dayRecords.length)
      const avgDia = Math.round(dayRecords.reduce((s, r) => s + r.diastolic, 0) / dayRecords.length)
      const avgHr = Math.round(dayRecords.reduce((s, r) => s + (r.heartRate || 0), 0) / dayRecords.length)
      result.push({
        date: d,
        label: formatDate(d.toISOString()),
        shortLabel: (d.getMonth() + 1) + '/' + d.getDate(),
        systolic: avgSys,
        diastolic: avgDia,
        heartRate: avgHr,
        count: dayRecords.length,
        status: evalBpStatus(avgSys, avgDia)
      })
    } else {
      result.push({
        date: d,
        label: formatDate(d.toISOString()),
        shortLabel: (d.getMonth() + 1) + '/' + d.getDate(),
        systolic: null,
        diastolic: null,
        heartRate: null,
        count: 0,
        status: null
      })
    }
  }
  return result
}

function getStatsSummary(days) {
  const records = days ? getRecordsByDays(days) : getRecords()
  if (records.length === 0) return null

  const sysValues = records.map(r => r.systolic)
  const diaValues = records.map(r => r.diastolic)
  const hrValues = records.filter(r => r.heartRate).map(r => r.heartRate)

  return {
    totalCount: records.length,
    avgSystolic: Math.round(sysValues.reduce((s, v) => s + v, 0) / sysValues.length),
    avgDiastolic: Math.round(diaValues.reduce((s, v) => s + v, 0) / diaValues.length),
    avgHeartRate: hrValues.length > 0 ? Math.round(hrValues.reduce((s, v) => s + v, 0) / hrValues.length) : 0,
    minHeartRate: hrValues.length > 0 ? Math.min(...hrValues) : 0,
    maxHeartRate: hrValues.length > 0 ? Math.max(...hrValues) : 0,
    sysStatus: evalBpStatus(
      Math.round(sysValues.reduce((s, v) => s + v, 0) / sysValues.length),
      Math.round(diaValues.reduce((s, v) => s + v, 0) / diaValues.length)
    )
  }
}

module.exports = {
  getRecords,
  saveRecords,
  addRecord,
  deleteRecord,
  clearAllRecords,
  getRecordsByDays,
  getTodayRecords,
  getLatestRecord,
  evalBpStatus,
  getBpStatusText,
  getBpStatusColor,
  formatDate,
  formatTime,
  getPeriodLabel,
  getLatest7DaysData,
  getStatsSummary
}
