// data.js - 内置 mock 数据与常量工具

export const ITEM_CATEGORIES = [
  { value: '食品', emoji: '🍞', bg: '#ffedd5' },
  { value: '药品', emoji: '💊', bg: '#fef3c7' },
  { value: '证件', emoji: '📄', bg: '#dbeafe' },
  { value: '数码', emoji: '💻', bg: '#ede9fe' },
  { value: '美妆', emoji: '💄', bg: '#fce7f3' },
  { value: '其他', emoji: '📦', bg: '#f1f5f9' },
];

export const SUB_CATEGORIES = ['支付宝', '微信', '信用卡', 'App Store', '其他'];

export const CYCLES = [
  { value: '月', label: '月付', months: 1, days: 30 },
  { value: '季', label: '季付', months: 3, days: 90 },
  { value: '年', label: '年付', months: 12, days: 365 },
];

export const CURRENCIES = [
  { value: '¥', label: '¥ CNY' },
  { value: '$', label: '$ USD' },
  { value: '€', label: '€ EUR' },
];

export const ALERT_DAYS = [
  { value: 1, label: '1 天前' },
  { value: 3, label: '3 天前' },
  { value: 7, label: '7 天前' },
  { value: 15, label: '15 天前' },
];

export const SUB_STATUS = [
  { value: '活跃', emoji: '🟢' },
  { value: '试用', emoji: '🟡' },
  { value: '已取消', emoji: '⚫' },
];

export function cycleToMonths(cycle) {
  const c = CYCLES.find((x) => x.value === cycle);
  return c ? c.months : 1;
}

export function cycleToDays(cycle) {
  const c = CYCLES.find((x) => x.value === cycle);
  return c ? c.days : 30;
}

export function monthlyAmount(amount, cycle) {
  return (Number(amount || 0) / cycleToMonths(cycle)).toFixed(0);
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function todayStr() {
  return addDays(new Date(), 0);
}

export function fmtMonthDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function daysBetween(dateStr, baseDate = new Date()) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const b = new Date(baseDate);
  b.setHours(0, 0, 0, 0);
  return Math.round((d - b) / 86400000);
}

let idCounter = 100;
export function newId() {
  idCounter += 1;
  return idCounter;
}

export function createMockItems() {
  const today = todayStr();
  return [
    { id: newId(), name: '维生素 C 泡腾片', category: '药品', quantity: 2, dueDate: addDays(today, -2), location: '客厅药箱', note: '每日一片' },
    { id: newId(), name: '全麦吐司', category: '食品', quantity: 1, dueDate: addDays(today, 1), location: '冰箱冷藏室', note: '' },
    { id: newId(), name: '护照', category: '证件', quantity: 1, dueDate: addDays(today, 180), location: '书房抽屉', note: '2026 年到期' },
    { id: newId(), name: '无线耳机', category: '数码', quantity: 1, dueDate: '', location: '玄关收纳盒', note: '购买于 2024 年' },
    { id: newId(), name: '防晒霜', category: '美妆', quantity: 1, dueDate: addDays(today, 12), location: '主卧梳妆台', note: '' },
    { id: newId(), name: '牛奶', category: '食品', quantity: 6, dueDate: addDays(today, 0), location: '冰箱', note: '今天到期' },
    { id: newId(), name: '身份证', category: '证件', quantity: 1, dueDate: addDays(today, 365), location: '钱包', note: '' },
    { id: newId(), name: '洗衣液', category: '其他', quantity: 2, dueDate: '', location: '阳台柜', note: '' },
  ];
}

export function createMockSubs() {
  const today = todayStr();
  return [
    { id: newId(), name: 'ChatGPT Plus', amount: 165, cycle: '月', currency: '$', renewDate: addDays(today, 3), alertDays: 3, paymentMethod: '信用卡', status: '活跃', note: '主力 AI 订阅' },
    { id: newId(), name: 'Netflix', amount: 198, cycle: '月', currency: '¥', renewDate: addDays(today, -1), alertDays: 3, paymentMethod: '支付宝', status: '活跃', note: '家庭共享' },
    { id: newId(), name: 'iCloud+', amount: 68, cycle: '月', currency: '¥', renewDate: addDays(today, 0), alertDays: 1, paymentMethod: 'App Store', status: '活跃', note: '200GB' },
    { id: newId(), name: 'Spotify', amount: 258, cycle: '年', currency: '$', renewDate: addDays(today, 45), alertDays: 7, paymentMethod: '信用卡', status: '活跃', note: '' },
    { id: newId(), name: 'Notion', amount: 96, cycle: '年', currency: '$', renewDate: addDays(today, 120), alertDays: 7, paymentMethod: '支付宝', status: '试用', note: '团队试用中' },
    { id: newId(), name: '某视频会员', amount: 25, cycle: '月', currency: '¥', renewDate: addDays(today, -15), alertDays: 3, paymentMethod: '微信', status: '已取消', note: '已不续费' },
  ];
}
