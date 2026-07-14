// utils/constants.js - 常量定义

// 互助类型
const HELP_TYPES = [
  { value: '借物', label: '借物', icon: '🔧', color: '#1890FF', bg: '#E6F4FF' },
  { value: '拼车', label: '拼车', icon: '🚗', color: '#52C41A', bg: '#F6FFED' },
  { value: '代喂', label: '代喂', icon: '🐾', color: '#FAAD14', bg: '#FFF7E6' },
  { value: '帮忙', label: '帮忙', icon: '💪', color: '#FF6B6B', bg: '#FFF1F0' },
  { value: '其他', label: '其他', icon: '✨', color: '#722ED1', bg: '#F9F0FF' }
]

// 闲置物品分类
const IDLE_CATEGORIES = [
  { value: '家居用品', label: '家居用品', icon: '🛋️', color: '#1890FF', bg: '#E6F4FF' },
  { value: '电子产品', label: '电子产品', icon: '📱', color: '#52C41A', bg: '#F6FFED' },
  { value: '服装鞋帽', label: '服装鞋帽', icon: '👕', color: '#FAAD14', bg: '#FFF7E6' },
  { value: '书籍文具', label: '书籍文具', icon: '📚', color: '#FF6B6B', bg: '#FFF1F0' },
  { value: '儿童用品', label: '儿童用品', icon: '🧸', color: '#13C2C2', bg: '#E6FFFB' },
  { value: '其他', label: '其他', icon: '🎁', color: '#722ED1', bg: '#F9F0FF' }
]

// 信用等级
const CREDIT_LEVELS = [
  { level: '新邻居', min: 0, max: 50, color: '#A0AEC0', icon: '🌱', gradient: 'linear-gradient(135deg, #A0AEC0 0%, #CBD5E0 100%)' },
  { level: '热心邻居', min: 51, max: 100, color: '#52C41A', icon: '🌿', gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' },
  { level: '活跃邻居', min: 101, max: 200, color: '#1890FF', icon: '⭐', gradient: 'linear-gradient(135deg, #4FACFE 0%, #00C6FB 100%)' },
  { level: '邻里达人', min: 201, max: 500, color: '#722ED1', icon: '🏆', gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { level: '社区之星', min: 501, max: 99999, color: '#FAAD14', icon: '👑', gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' }
]

// 状态映射
const STATUS_MAP = {
  '待帮助': { label: '待帮助', tag: 'tag-warning' },
  '已完成': { label: '已完成', tag: 'tag-success' },
  '待出售': { label: '待出售', tag: 'tag-primary' },
  '已出售': { label: '已出售', tag: 'tag-default' }
}

// 积分规则
const CREDIT_RULES = {
  publishHelp: 2,
  completeHelpHelper: 10,
  completeHelpSeeker: 5,
  publishIdle: 2,
  completeTradeSeller: 10,
  completeTradeBuyer: 5
}

// 分页大小
const PAGE_SIZE = 10

// 距离相关
const MAX_DISTANCE_KM = 10 // 最大展示距离（公里）
const NEARBY_DISTANCE_KM = 3 // "附近"距离阈值（公里）

// 联系方式类型
function getContactType(contact) {
  if (!contact) return 'none'
  const phoneReg = /^1[3-9]\d{9}$/
  if (phoneReg.test(contact)) return 'phone'
  return 'wechat'
}

module.exports = {
  HELP_TYPES,
  IDLE_CATEGORIES,
  CREDIT_LEVELS,
  STATUS_MAP,
  CREDIT_RULES,
  PAGE_SIZE,
  MAX_DISTANCE_KM,
  NEARBY_DISTANCE_KM,
  getContactType
}
