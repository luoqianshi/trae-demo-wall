// miniprogram/utils/format.js
// 通用格式化工具

// 日期格式化：2026-06-20 -> 2026-06-20
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return y + '-' + m + '-' + day + ' ' + hh + ':' + mm;
}

// 动物种类
function speciesLabel(key) {
  const map = { dog: '狗狗', cat: '猫猫', other: '其他' };
  return map[key] || key;
}

// 性别
function genderLabel(key) {
  return key === 'female' ? '母' : '公';
}

// 申请状态
function applicationStatusLabel(status) {
  const map = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
  return map[status] || status;
}
function applicationStatusColor(status) {
  const map = { pending: '#d9a23e', approved: '#5a8a3e', rejected: '#b5513f' };
  return map[status] || '#6b6458';
}

// 回访状态
function reviewStatusLabel(status) {
  const map = { pending: '待回访', done: '已完成', risk: '需关注', closed: '已归档' };
  return map[status] || status;
}
function reviewStatusColor(status) {
  const map = { pending: '#d9a23e', done: '#5a8a3e', risk: '#b5513f', closed: '#a8a094' };
  return map[status] || '#6b6458';
}

// 健康状态
function healthLabel(key) {
  const map = { good: '良好', normal: '一般', need_attention: '需关注' };
  return map[key] || key;
}

module.exports = {
  formatDate,
  formatDateTime,
  speciesLabel,
  genderLabel,
  applicationStatusLabel,
  applicationStatusColor,
  reviewStatusLabel,
  reviewStatusColor,
  healthLabel
};
