/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  // 判断是否今年
  if (d.getFullYear() === now.getFullYear()) {
    return month + '月' + day + '日';
  }
  return d.getFullYear() + '年' + month + '月' + day + '日';
}

function formatTime(timeStr) {
  return timeStr;
}

function getWeekday(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[d.getDay()];
}

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getNowTimeStr() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

function getConfidenceClass(confidence) {
  if (confidence >= 85) return 'green';
  if (confidence >= 65) return 'yellow';
  return 'red';
}

function getConfidenceEmoji(confidence) {
  if (confidence >= 85) return '🟢';
  if (confidence >= 65) return '🟡';
  return '🔴';
}

function getSafetyClass(level) {
  return level || 'green';
}

function getDaysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 根据置信度级别获取对应的 CSS 类名
function getConfidenceTagClass(confidence) {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  return 'red';
}