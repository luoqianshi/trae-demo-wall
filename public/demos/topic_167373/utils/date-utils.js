// 获取今天 0 点的时间戳
function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getEndOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// 获取某月第一天 0 点
function getStartOfMonth(year, month) {
  return new Date(year, month, 1, 0, 0, 0, 0).getTime();
}

function getEndOfMonth(year, month) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
}

// 获取某天 0 点
function getStartOfDay(year, month, day) {
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

function getEndOfDay(year, month, day) {
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

// 格式化时间戳
function formatDate(timestamp, pattern = 'YYYY-MM-DD') {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return pattern
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

function formatTime(timestamp) {
  return formatDate(timestamp, 'HH:mm');
}

function formatDateTime(timestamp) {
  return formatDate(timestamp, 'YYYY-MM-DD HH:mm');
}

// 获取月份所有日期信息
function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0=周日
  const daysInMonth = lastDay.getDate();

  const days = [];
  // 上月占位
  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = new Date(year, month, -firstDayOfWeek + i + 1);
    days.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      isCurrentMonth: false
    });
  }
  // 当月
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ year, month, day: i, isCurrentMonth: true });
  }
  // 补齐 6 行 = 42 天
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      isCurrentMonth: false
    });
  }
  return days;
}

function isSameDay(t1, t2) {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(year, month, day) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay() || 7; // 周日为 0 时转为 7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getMonthStartTimestamp() {
  return getStartOfMonth(new Date().getFullYear(), new Date().getMonth());
}

module.exports = {
  getStartOfToday, getEndOfToday,
  getStartOfMonth, getEndOfMonth,
  getStartOfDay, getEndOfDay,
  formatDate, formatTime, formatDateTime,
  getMonthDays, isSameDay, isToday,
  getWeekStart, getMonthStartTimestamp
};
