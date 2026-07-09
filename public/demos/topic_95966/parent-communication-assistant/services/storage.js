import { STORAGE_KEYS, MAX_HISTORY } from '../utils/constants';

/**
 * 保存历史记录
 * @param {Object} record - 记录对象
 */
export function saveHistory(record) {
  let history = wx.getStorageSync(STORAGE_KEYS.HISTORY) || [];
  
  const newRecord = {
    id: generateId(),
    timestamp: Date.now(),
    ...record
  };
  
  history.unshift(newRecord);
  
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
    wx.showToast({
      title: '历史记录已满，已自动清理旧记录',
      icon: 'none',
      duration: 2000
    });
  }
  
  wx.setStorageSync(STORAGE_KEYS.HISTORY, history);
  return newRecord;
}

/**
 * 获取历史记录
 * @param {Object} options - 查询选项
 * @param {string} options.keyword - 关键词搜索
 * @param {string} options.scene - 场景筛选
 * @returns {Array} 历史记录列表
 */
export function getHistory(options = {}) {
  let history = wx.getStorageSync(STORAGE_KEYS.HISTORY) || [];
  
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase();
    history = history.filter(item => 
      item.studentName && item.studentName.toLowerCase().includes(keyword)
    );
  }
  
  if (options.scene) {
    history = history.filter(item => item.scene === options.scene);
  }
  
  return history;
}

/**
 * 删除单条历史记录
 * @param {string} id - 记录ID
 */
export function deleteHistoryItem(id) {
  let history = wx.getStorageSync(STORAGE_KEYS.HISTORY) || [];
  history = history.filter(item => item.id !== id);
  wx.setStorageSync(STORAGE_KEYS.HISTORY, history);
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  wx.removeStorageSync(STORAGE_KEYS.HISTORY);
}

/**
 * 导出历史记录
 * @returns {string} 导出的文本内容
 */
export function exportHistory() {
  const history = wx.getStorageSync(STORAGE_KEYS.HISTORY) || [];
  
  if (history.length === 0) {
    return null;
  }
  
  let content = '家长沟通助手 - 沟通记录导出\n';
  content += `导出时间：${formatDateTime(new Date())}\n`;
  content += `记录总数：${history.length}\n\n`;
  content += '============================\n\n';
  
  history.forEach((record, index) => {
    content += `[${index + 1}] ${record.studentName || '未知'} - ${getSceneName(record.scene)}\n`;
    content += `时间：${formatDateTime(new Date(record.timestamp))}\n`;
    content += `风格：${getStyleName(record.style)} | 渠道：${getChannelName(record.channel)}\n`;
    content += `内容：\n${record.content || '无内容'}\n`;
    content += '\n----------------------------\n\n';
  });
  
  return content;
}

/**
 * 保存设置
 * @param {Object} settings - 设置对象
 */
export function saveSettings(settings) {
  const currentSettings = wx.getStorageSync(STORAGE_KEYS.SETTINGS) || {};
  const newSettings = { ...currentSettings, ...settings };
  wx.setStorageSync(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

/**
 * 获取设置
 * @returns {Object} 设置对象
 */
export function getSettings() {
  return wx.getStorageSync(STORAGE_KEYS.SETTINGS) || {
    teacherName: '',
    subject: '',
    grade: '',
    defaultStyle: 'gentle',
    defaultChannel: 'wechat'
  };
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 获取场景名称
 */
function getSceneName(sceneId) {
  const sceneMap = {
    'progress': '成绩进步',
    'regress': '成绩退步',
    'homework': '作业情况',
    'classroom': '课堂表现',
    'knowledge': '知识点',
    'cooperation': '家校配合'
  };
  return sceneMap[sceneId] || sceneId;
}

/**
 * 获取风格名称
 */
function getStyleName(styleId) {
  const styleMap = {
    'gentle': '温和鼓励型',
    'professional': '专业直接型',
    'constructive': '建设性建议型',
    'caring': '关怀提醒型'
  };
  return styleMap[styleId] || styleId;
}

/**
 * 获取渠道名称
 */
function getChannelName(channelId) {
  const channelMap = {
    'wechat': '微信',
    'sms': '短信',
    'email': '邮件',
    'phone': '电话要点'
  };
  return channelMap[channelId] || channelId;
}
