/**
 * 前端工具函数
 */

// 学期选项
const SEMESTERS = [
  { value: 'grade7_1', label: '初一 上学期' },
  { value: 'grade7_2', label: '初一 下学期' },
  { value: 'grade8_1', label: '初二 上学期' },
  { value: 'grade8_2', label: '初二 下学期' },
  { value: 'grade9_1', label: '初三 上学期' },
  { value: 'grade9_2', label: '初三 下学期' },
];

function semesterLabel(value) {
  const s = SEMESTERS.find(s => s.value === value);
  return s ? s.label : value;
}

// 学科映射(从后端获取,这里做缓存)
let subjectsCache = null;
async function getSubjectMap() {
  if (subjectsCache) return subjectsCache;
  const api = require('./api');
  try {
    const list = await api.getSubjects();
    subjectsCache = {};
    list.forEach(s => subjectsCache[s.code] = s);
    return subjectsCache;
  } catch (e) {
    return {};
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

module.exports = {
  SEMESTERS,
  semesterLabel,
  getSubjectMap,
  formatDate,
};
