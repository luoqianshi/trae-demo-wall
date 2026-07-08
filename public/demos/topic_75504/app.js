const els = {
  voiceText: document.querySelector("#voiceText"),
  micBtn: document.querySelector("#micBtn"),
  speechStatus: document.querySelector("#speechStatus"),
  parseBtn: document.querySelector("#parseBtn"),
  clearInputBtn: document.querySelector("#clearInputBtn"),
  previewAmount: document.querySelector("#previewAmount"),
  previewCategory: document.querySelector("#previewCategory"),
  previewDate: document.querySelector("#previewDate"),
  amountInput: document.querySelector("#amountInput"),
  categoryInput: document.querySelector("#categoryInput"),
  dateInput: document.querySelector("#dateInput"),
  tagInput: document.querySelector("#tagInput"),
  noteInput: document.querySelector("#noteInput"),
  recordForm: document.querySelector("#recordForm"),
  batchPreview: document.querySelector("#batchPreview"),
  saveBtn: document.querySelector("#saveBtn"),
  todayTotal: document.querySelector("#todayTotal"),
  monthTotal: document.querySelector("#monthTotal"),
  recordCount: document.querySelector("#recordCount"),
  budgetCard: document.querySelector("#budgetCard"),
  budgetMonthLabel: document.querySelector("#budgetMonthLabel"),
  budgetStatusText: document.querySelector("#budgetStatusText"),
  budgetProgressBar: document.querySelector("#budgetProgressBar"),
  budgetUsed: document.querySelector("#budgetUsed"),
  budgetLimit: document.querySelector("#budgetLimit"),
  budgetRemaining: document.querySelector("#budgetRemaining"),
  budgetInput: document.querySelector("#budgetInput"),
  saveBudgetBtn: document.querySelector("#saveBudgetBtn"),
  clearBudgetBtn: document.querySelector("#clearBudgetBtn"),
  categoryBudgetSelect: document.querySelector("#categoryBudgetSelect"),
  categoryBudgetInput: document.querySelector("#categoryBudgetInput"),
  saveCategoryBudgetBtn: document.querySelector("#saveCategoryBudgetBtn"),
  categoryBudgetList: document.querySelector("#categoryBudgetList"),
  insightMonthLabel: document.querySelector("#insightMonthLabel"),
  monthlyReport: document.querySelector("#monthlyReport"),
  categoryChart: document.querySelector("#categoryChart"),
  trendChart: document.querySelector("#trendChart"),
  maxRecordInsight: document.querySelector("#maxRecordInsight"),
  tagInsightSummary: document.querySelector("#tagInsightSummary"),
  tagChart: document.querySelector("#tagChart"),
  learningCount: document.querySelector("#learningCount"),
  smartKeywordInput: document.querySelector("#smartKeywordInput"),
  smartCategoryInput: document.querySelector("#smartCategoryInput"),
  addSmartRuleBtn: document.querySelector("#addSmartRuleBtn"),
  learningList: document.querySelector("#learningList"),
  recurringCount: document.querySelector("#recurringCount"),
  recurringNameInput: document.querySelector("#recurringNameInput"),
  recurringAmountInput: document.querySelector("#recurringAmountInput"),
  recurringCategoryInput: document.querySelector("#recurringCategoryInput"),
  recurringTagInput: document.querySelector("#recurringTagInput"),
  recurringDayInput: document.querySelector("#recurringDayInput"),
  recurringNoteInput: document.querySelector("#recurringNoteInput"),
  addRecurringBtn: document.querySelector("#addRecurringBtn"),
  generateAllRecurringBtn: document.querySelector("#generateAllRecurringBtn"),
  recurringList: document.querySelector("#recurringList"),
  recordsCard: document.querySelector("#recordsCard"),
  recordList: document.querySelector("#recordList"),
  emptyState: document.querySelector("#emptyState"),
  clearRecordsBtn: document.querySelector("#clearRecordsBtn"),
  toggleBulkModeBtn: document.querySelector("#toggleBulkModeBtn"),
  bulkActionBar: document.querySelector("#bulkActionBar"),
  bulkSelectedCount: document.querySelector("#bulkSelectedCount"),
  selectFilteredBtn: document.querySelector("#selectFilteredBtn"),
  clearSelectionBtn: document.querySelector("#clearSelectionBtn"),
  bulkCategorySelect: document.querySelector("#bulkCategorySelect"),
  applyBulkCategoryBtn: document.querySelector("#applyBulkCategoryBtn"),
  bulkTagSelect: document.querySelector("#bulkTagSelect"),
  applyBulkTagBtn: document.querySelector("#applyBulkTagBtn"),
  bulkDeleteBtn: document.querySelector("#bulkDeleteBtn"),
  categoryFilter: document.querySelector("#categoryFilter"),
  periodFilter: document.querySelector("#periodFilter"),
  pageSizeSelect: document.querySelector("#pageSizeSelect"),
  tagFilter: document.querySelector("#tagFilter"),
  searchInput: document.querySelector("#searchInput"),
  resetFiltersBtn: document.querySelector("#resetFiltersBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  importCsvBtn: document.querySelector("#importCsvBtn"),
  importCsvInput: document.querySelector("#importCsvInput"),
  exportBackupBtn: document.querySelector("#exportBackupBtn"),
  importBackupBtn: document.querySelector("#importBackupBtn"),
  importBackupInput: document.querySelector("#importBackupInput"),
  csvPreviewPanel: document.querySelector("#csvPreviewPanel"),
  filteredSummary: document.querySelector("#filteredSummary"),
  pager: document.querySelector("#pager"),
  prevPageBtn: document.querySelector("#prevPageBtn"),
  nextPageBtn: document.querySelector("#nextPageBtn"),
  pageInfo: document.querySelector("#pageInfo"),
  toast: document.querySelector("#toast"),
  undoBar: document.querySelector("#undoBar"),
  undoText: document.querySelector("#undoText"),
  undoBtn: document.querySelector("#undoBtn"),
  customTagCount: document.querySelector("#customTagCount"),
  customTagInput: document.querySelector("#customTagInput"),
  addCustomTagBtn: document.querySelector("#addCustomTagBtn"),
  tagSuggestions: document.querySelector("#tagSuggestions"),
  customTagList: document.querySelector("#customTagList"),
  healthStatus: document.querySelector("#healthStatus"),
  runHealthCheckBtn: document.querySelector("#runHealthCheckBtn"),
  dismissHealthBtn: document.querySelector("#dismissHealthBtn"),
  healthSummary: document.querySelector("#healthSummary"),
  healthIssues: document.querySelector("#healthIssues"),
  healthEmpty: document.querySelector("#healthEmpty")
};

const STORAGE_KEY = "voice-bookkeeping-records-v1";
const USER_CATEGORY_KEY = "voice-bookkeeping-category-memory-v1";
const BUDGET_KEY = "voice-bookkeeping-monthly-budgets-v1";
const CATEGORY_BUDGET_KEY = "voice-bookkeeping-category-budgets-v1";
const RECURRING_KEY = "voice-bookkeeping-recurring-expenses-v1";
const CUSTOM_TAG_KEY = "voice-bookkeeping-custom-tags-v1";

const defaultTagOptions = ["普通支出", "必要支出", "可减少", "冲动消费", "可报销", "固定支出"];
const tagSuggestions = ["家庭支出", "孩子教育", "公司垫付", "旅行支出", "人情往来", "健康管理", "装修", "宠物", "父母家人", "约会聚餐", "运动健身", "长期资产", "节日礼物", "证件手续", "车辆养护", "电子数码"];
let records = loadRecords();
let userCategoryMemory = loadUserCategoryMemory();
let monthlyBudgets = loadMonthlyBudgets();
let categoryBudgets = loadCategoryBudgets();
let recurringExpenses = loadRecurringExpenses();
let customTags = loadCustomTags();
let recognition = null;
let isRecording = false;
let pendingExpenses = [];
let pendingUndo = null;
let undoTimer = null;
let currentPage = 1;
let editingRecordId = null;
let pendingCsvImport = null;
let isBulkMode = false;
let selectedRecordIds = new Set();

const categoryOptions = ["餐饮", "交通", "购物", "娱乐", "学习", "居家", "医疗", "其他"];
let tagOptions = buildTagOptions();
const categoryProfiles = {
  餐饮: {
    strong: ["早餐", "午饭", "晚饭", "宵夜", "外卖", "咖啡", "奶茶", "火锅", "烧烤", "面包", "水果", "豆浆", "包子", "馒头", "油条", "煎饼", "粥", "豆腐脑", "烧饼", "肯德基", "KFC", "kfc", "麦当劳", "汉堡王", "必胜客", "星巴克", "瑞幸", "蜜雪冰城", "喜茶", "奈雪", "汉堡", "披萨", "炸鸡", "薯条", "鸡翅", "套餐", "饮料", "小吃", "甜品", "蛋糕"],
    context: ["早上", "上午", "中午", "下午茶", "晚上", "吃", "喝", "点了", "点外卖", "一杯", "一碗", "一份", "一顿", "餐"]
  },
  交通: {
    strong: ["打车", "出租", "公交", "地铁", "高铁", "火车", "机票", "加油", "停车", "骑行", "单车", "滴滴", "顺风车"],
    context: ["去公司", "回家", "到机场", "到车站", "通勤", "路费"]
  },
  购物: {
    strong: ["衣服", "鞋", "裤子", "化妆", "护肤", "超市", "淘宝", "京东", "拼多多", "商品", "快递", "家电", "数码", "手机壳", "包包", "房子", "房产", "买房", "房款", "首付", "车子", "汽车", "买车", "车款"],
    context: ["下单", "网购", "逛街", "买了一个", "买了一件", "买了一双", "买了一台", "买了一套房", "一套房", "买了辆车", "买了一辆车"]
  },
  娱乐: {
    strong: ["电影", "游戏", "演唱会", "唱歌", "剧本杀", "密室", "旅游", "门票", "会员", "娱乐", "Steam", "Switch", "KTV", "游乐园"],
    context: ["玩", "看电影", "开会员", "订票"]
  },
  学习: {
    strong: ["书", "课程", "培训", "考试", "资料", "文具", "学习", "网课", "教材", "报名费"],
    context: ["上课", "报名", "买资料", "备考"]
  },
  居家: {
    strong: ["房租", "水电", "物业", "家具", "家电", "日用品", "纸巾", "清洁", "洗衣液", "电费", "水费", "燃气"],
    context: ["家里", "居家", "生活用品"]
  },
  医疗: {
    strong: ["医院", "药", "挂号", "体检", "牙", "诊所", "医疗", "感冒药", "检查", "复诊"],
    context: ["看病", "买药", "挂号费"]
  }
};

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function today() {
  return formatDate(new Date());
}

function formatGroupDate(dateStr) {
  const todayStr = today();
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const parts = dateStr.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const week = weekDays[date.getDay()];
  if (dateStr === todayStr) return `今天 · ${dateStr} · ${week}`;
  if (dateStr === yesterdayStr) return `昨天 · ${dateStr} · ${week}`;
  return `${dateStr} · ${week}`;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadUserCategoryMemory() {
  try {
    return JSON.parse(localStorage.getItem(USER_CATEGORY_KEY)) || [];
  } catch {
    return [];
  }
}

function loadMonthlyBudgets() {
  try {
    return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {};
  } catch {
    return {};
  }
}

function loadCategoryBudgets() {
  try {
    return JSON.parse(localStorage.getItem(CATEGORY_BUDGET_KEY)) || {};
  } catch {
    return {};
  }
}

function loadRecurringExpenses() {
  try {
    return JSON.parse(localStorage.getItem(RECURRING_KEY)) || [];
  } catch {
    return [];
  }
}

function loadCustomTags() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_TAG_KEY)) || [];
  } catch {
    return [];
  }
}

function buildTagOptions() {
  return [...new Set([...defaultTagOptions, ...customTags])].filter(Boolean);
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveUserCategoryMemory() {
  userCategoryMemory = userCategoryMemory.slice(-80);
  localStorage.setItem(USER_CATEGORY_KEY, JSON.stringify(userCategoryMemory));
  renderSmartSettings();
}

function saveMonthlyBudgets() {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(monthlyBudgets));
}

function saveCategoryBudgets() {
  localStorage.setItem(CATEGORY_BUDGET_KEY, JSON.stringify(categoryBudgets));
}

function saveRecurringExpenses() {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses));
  renderRecurringExpenses();
}

function saveCustomTags() {
  customTags = [...new Set(customTags.map(tag => tag.trim()).filter(Boolean))]
    .filter(tag => !defaultTagOptions.includes(tag))
    .slice(0, 40);
  tagOptions = buildTagOptions();
  localStorage.setItem(CUSTOM_TAG_KEY, JSON.stringify(customTags));
  syncTagControls();
  renderTagSettings();
  renderStats();
}

function fillTagSelect(select, { includeAll = false, selected } = {}) {
  const current = selected ?? select.value;
  const options = includeAll ? ['<option value="all">全部标签</option>'] : [];
  options.push(...tagOptions.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`));
  select.innerHTML = options.join("");
  select.value = tagOptions.includes(current) || current === "all" ? current : includeAll ? "all" : "普通支出";
}

function syncTagControls() {
  fillTagSelect(els.tagInput);
  fillTagSelect(els.recurringTagInput, { selected: els.recurringTagInput.value || "固定支出" });
  fillTagSelect(els.bulkTagSelect);
  fillTagSelect(els.tagFilter, { includeAll: true });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function money(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function normalizeNumberText(text) {
  return text
    .replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 65248))
    .replace(/[，,]/g, "")
    .replace(/人民币/g, "")
    .replace(/块钱/g, "块");
}

function normalizeChineseNumber(text) {
  return text
    .replace(/两/g, "二")
    .replace(/壹/g, "一")
    .replace(/贰/g, "二")
    .replace(/叁/g, "三")
    .replace(/肆/g, "四")
    .replace(/伍/g, "五")
    .replace(/陆/g, "六")
    .replace(/柒/g, "七")
    .replace(/捌/g, "八")
    .replace(/玖/g, "九")
    .replace(/拾/g, "十")
    .replace(/佰/g, "百")
    .replace(/仟/g, "千")
    .replace(/萬/g, "万")
    .replace(/[〇○]/g, "零");
}

function chineseIntegerToNumber(text) {
  const clean = normalizeChineseNumber(text);
  const digits = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const units = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
  let total = 0;
  let section = 0;
  let number = 0;

  if (!clean) return NaN;

  for (const char of clean) {
    if (Object.prototype.hasOwnProperty.call(digits, char)) {
      number = digits[char];
      continue;
    }

    const unit = units[char];
    if (!unit) return NaN;

    if (unit === 10000) {
      section = (section + number) * unit;
      total += section;
      section = 0;
    } else {
      section += (number || 1) * unit;
    }
    number = 0;
  }

  return total + section + number;
}

function chineseDecimalToNumber(text) {
  const clean = normalizeChineseNumber(text);
  const digits = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const values = [];

  for (const char of clean) {
    if (Object.prototype.hasOwnProperty.call(digits, char)) {
      values.push(digits[char]);
    }
  }

  return values.length ? Number(`0.${values.join("")}`) : 0;
}

function parseChineseAmount(text) {
  const chineseChars = "零〇○一二两三四五六七八九十百千万萬壹贰叁肆伍陆柒捌玖拾佰仟";
  const amountWithUnit = new RegExp(`([${chineseChars}]+)(?:元|块)(?:([${chineseChars}])(?:角|毛)?)?(?:([${chineseChars}])分?)?`);
  const amountWithPoint = new RegExp(`([${chineseChars}]+)[点.]([${chineseChars}零〇○]+)(?:元|块)?`);
  const amountWithoutUnit = new RegExp(`(?:花了|花费|消费|用了|支出|付了|付款|一共|共|总共)\\s*([${chineseChars}]+)`);

  const pointMatch = text.match(amountWithPoint);
  if (pointMatch) {
    const integer = chineseIntegerToNumber(pointMatch[1]);
    const decimal = chineseDecimalToNumber(pointMatch[2]);
    if (!Number.isNaN(integer)) return Number((integer + decimal).toFixed(2));
  }

  const unitMatch = text.match(amountWithUnit);
  if (unitMatch) {
    const integer = chineseIntegerToNumber(unitMatch[1]);
    if (Number.isNaN(integer)) return "";
    const jiao = unitMatch[2] ? chineseDecimalToNumber(unitMatch[2]) : 0;
    const fen = unitMatch[3] ? chineseDecimalToNumber(unitMatch[3]) / 10 : 0;
    return Number((integer + jiao + fen).toFixed(2));
  }

  const noUnitMatch = text.match(amountWithoutUnit);
  if (noUnitMatch) {
    const amount = chineseIntegerToNumber(noUnitMatch[1]);
    if (!Number.isNaN(amount)) return amount;
  }

  return "";
}

function parseAmount(text) {
  const normalized = normalizeNumberText(text);
  const patterns = [
    /(?:花了|花费|消费|用了|支出|付了|付款|买了|一共|共|总共)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块|块钱|人民币)/,
    /(?:元|块|块钱|人民币)\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return Number(match[1]);
  }

  return parseChineseAmount(normalized);
}

function normalizeForCategory(text) {
  return text
    .replace(/\d+(?:\.\d+)?/g, "")
    .replace(/[零〇○一二两三四五六七八九十百千万萬壹贰叁肆伍陆柒捌玖拾佰仟]+(?:元|块|角|毛|分)?/g, "")
    .replace(/(今天|昨天|前天|明天|早上|上午|中午|下午|晚上|晚上的话|然后|接着|另外|还有|呃|嗯|啊|花了|花费|消费|用了|支出|付了|付款|一共|总共|块钱|元|块|钱|的话|是|也)/g, "")
    .trim();
}

function findUserMemory(text) {
  return userCategoryMemory
    .slice()
    .reverse()
    .find(item => item.keyword && text.includes(item.keyword));
}

function hasFoodLikeWord(text) {
  const clean = normalizeForCategory(text);
  return /[\u4e00-\u9fa5]{1,8}(面|粉|饭|蛋|饼|包|茶|奶|汤|粥|鸡|鸭|鱼|肉|虾|丸|串|糕|饺|馄饨|米线|拉面|米粉)/.test(clean);
}

function categorizeExpense(text) {
  const memory = findUserMemory(text);
  if (memory) {
    return {
      category: memory.category,
      confidence: 99,
      reason: `沿用你的历史修正：“${memory.keyword}”`
    };
  }

  const scores = {};
  const evidence = {};
  categoryOptions.forEach(category => {
    scores[category] = 0;
    evidence[category] = [];
  });

  Object.entries(categoryProfiles).forEach(([category, profile]) => {
    profile.strong.forEach(word => {
      if (text.includes(word)) {
        scores[category] += 5;
        evidence[category].push(word);
      }
    });

    profile.context.forEach(word => {
      if (text.includes(word)) {
        scores[category] += 2;
        evidence[category].push(word);
      }
    });
  });

  if (text.includes("买")) {
    scores.购物 += 0.6;
    evidence.购物.push("买（弱线索）");
  }

  if (hasFoodLikeWord(text)) {
    scores.餐饮 += 4;
    evidence.餐饮.push("食物词形");
  }

  const ranked = Object.entries(scores)
    .filter(([category]) => category !== "其他")
    .sort((a, b) => b[1] - a[1]);
  const [bestCategory, bestScore] = ranked[0];
  const secondScore = ranked[1] ? ranked[1][1] : 0;

  if (!bestScore || bestScore < 2) {
    return {
      category: "其他",
      confidence: 35,
      reason: "没有足够语义线索，先归为其他"
    };
  }

  const confidence = Math.min(95, Math.round(55 + bestScore * 7 + Math.max(0, bestScore - secondScore) * 4));
  const reasonWords = [...new Set(evidence[bestCategory])].slice(0, 3).join("、");
  return {
    category: bestCategory,
    confidence,
    reason: reasonWords ? `根据“${reasonWords}”判断` : "根据上下文评分判断"
  };
}

function parseCategory(text) {
  return categorizeExpense(text).category;
}

function extractLearningKeyword(note) {
  const clean = normalizeForCategory(note);
  if (!clean) return "";
  const knownWords = Object.values(categoryProfiles)
    .flatMap(profile => [...profile.strong, ...profile.context])
    .filter(word => clean.includes(word))
    .sort((a, b) => b.length - a.length);

  if (knownWords.length) return knownWords[0];
  return clean.replace(/^(买|吃|喝|点|一组|一个|一份|一杯)/, "").slice(0, 8);
}

function learnCategoryFromCorrection(note, category, previousCategory) {
  if (!category || category === previousCategory || category === "其他") return;
  const keyword = extractLearningKeyword(note);
  if (!keyword || keyword.length < 2) return;

  userCategoryMemory = userCategoryMemory.filter(item => item.keyword !== keyword);
  userCategoryMemory.push({ keyword, category, source: "修正账单", updatedAt: new Date().toISOString() });
  saveUserCategoryMemory();
}

function getWeekdayIndex(word) {
  const map = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "日": 0, "天": 0 };
  return map[word];
}

function parseDate(text) {
  const base = new Date();
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  if (text.includes("前天")) {
    date.setDate(date.getDate() - 2);
    return formatDate(date);
  }

  if (text.includes("昨天")) {
    date.setDate(date.getDate() - 1);
    return formatDate(date);
  }

  if (text.includes("明天")) {
    date.setDate(date.getDate() + 1);
    return formatDate(date);
  }

  const fullDate = text.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
  if (fullDate) {
    return `${fullDate[1]}-${String(fullDate[2]).padStart(2, "0")}-${String(fullDate[3]).padStart(2, "0")}`;
  }

  const monthDate = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDate) {
    return `${date.getFullYear()}-${String(monthDate[1]).padStart(2, "0")}-${String(monthDate[2]).padStart(2, "0")}`;
  }

  const weekMatch = text.match(/上周([一二三四五六日天])/);
  if (weekMatch) {
    const target = getWeekdayIndex(weekMatch[1]);
    const current = date.getDay();
    const diff = current === 0 ? 7 + (7 - target) : current + (7 - target);
    date.setDate(date.getDate() - diff);
    return formatDate(date);
  }

  if (text.includes("周末")) {
    const current = date.getDay();
    const daysToSaturday = current <= 6 ? 6 - current : 0;
    date.setDate(date.getDate() + daysToSaturday);
    return formatDate(date);
  }

  return today();
}

function parseExpense(text) {
  const clean = text.trim();
  const categoryResult = categorizeExpense(clean);
  return {
    amount: parseAmount(clean),
    category: categoryResult.category,
    originalCategory: categoryResult.category,
    categoryReason: categoryResult.reason,
    categoryConfidence: categoryResult.confidence,
    date: parseDate(clean),
    tag: "普通支出",
    note: clean || "未填写备注"
  };
}

function splitExpenseText(text) {
  const chineseNumberChars = "零〇○一二两三四五六七八九十百千万萬壹贰叁肆伍陆柒捌玖拾佰仟";
  const clean = text
    .replace(/\s+/g, "")
    .replace(/(然后|接着|另外|还有|又|再)/g, "，$1")
    .replace(new RegExp(`([\\d${chineseNumberChars}]+)(?=(早上|上午|中午|下午|晚上|晚上的话|夜里|今天|昨天))`, "g"), "$1，")
    .replace(/([元块])(?=[^，。；;\n、]*?(花了|花费|消费|用了|支出|付了|付款|买了|打车|早餐|午饭|晚饭|宵夜|外卖|咖啡|奶茶|肯德基|KFC|kfc|麦当劳|披萨|炸鸡|汉堡))/g, "$1，");

  const clauses = clean
    .split(/[，,。；;\n、]+/)
    .map(item => item.replace(/^(然后|接着|另外|还有|又|再|呃|嗯|啊)/, "").trim())
    .filter(Boolean);

  const merged = [];
  let buffer = "";

  clauses.forEach(clause => {
    buffer = buffer ? `${buffer}${clause}` : clause;
    if (parseAmount(buffer)) {
      merged.push(buffer);
      buffer = "";
    }
  });

  if (buffer) {
    if (merged.length) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}${buffer}`;
    } else {
      merged.push(buffer);
    }
  }

  return merged;
}

function parseExpenses(text) {
  const fullText = text.trim();
  const clauses = splitExpenseText(fullText);
  const parsed = clauses
    .map(clause => parseExpense(clause))
    .filter(item => item.amount);

  if (parsed.length > 0) return parsed;

  const fallback = parseExpense(fullText);
  return fallback.amount ? [fallback] : [];
}

function summarizeExpenses(expenses) {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const categories = [...new Set(expenses.map(item => item.category))];
  const dates = [...new Set(expenses.map(item => item.date))];
  return {
    total,
    categories,
    dates
  };
}

function renderBatchPreview(expenses) {
  if (!expenses.length) {
    els.batchPreview.hidden = true;
    els.batchPreview.innerHTML = "";
    els.saveBtn.textContent = "保存这一笔";
    els.recordForm.classList.remove("batch-mode");
    return;
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  els.batchPreview.hidden = false;
  els.recordForm.classList.add("batch-mode");
  els.batchPreview.innerHTML = `
    <div class="batch-title">
      <span>识别拆分结果：共 ${expenses.length} 项</span>
      <span class="batch-total">合计 ${money(total)}</span>
    </div>
    <div class="batch-hint">每一项都可以单独调整金额、类目、日期和备注，确认无误后直接批量保存。</div>
    ${expenses.map((item, index) => {
      const confidence = Number(item.categoryConfidence || 60);
      const lowConf = confidence < 50;
      return `
      <div class="batch-item${lowConf ? " low-confidence" : ""}">
        <div class="batch-order">第${index + 1}项${lowConf ? '<span class="batch-warning-badge" title="识别置信度较低，请人工核对类目">建议检查</span>' : ""}</div>
        <div>
          <div class="batch-edit-grid">
            <label>
              金额
              <input class="batch-field" data-index="${index}" data-field="amount" type="number" min="0" step="0.01" value="${Number(item.amount).toFixed(2)}" />
            </label>
            <label>
              类目
              <select class="batch-field batch-category-select" data-index="${index}" data-field="category">
                ${categoryOptions.map(category => `<option value="${category}" ${category === item.category ? "selected" : ""}>${category}</option>`).join("")}
              </select>
            </label>
            <label>
              日期
              <input class="batch-field" data-index="${index}" data-field="date" type="date" value="${escapeHtml(item.date)}" />
            </label>
            <label>
              标签
              <select class="batch-field batch-tag-select" data-index="${index}" data-field="tag">
                ${tagOptions.map(tag => `<option value="${escapeHtml(tag)}" ${tag === (item.tag || "普通支出") ? "selected" : ""}>${escapeHtml(tag)}</option>`).join("")}
              </select>
            </label>
            <label class="batch-note-field">
              备注
              <input class="batch-field" data-index="${index}" data-field="note" type="text" value="${escapeHtml(item.note)}" />
            </label>
          </div>
          <div class="batch-meta">
            <span class="batch-tag">日期：${escapeHtml(item.date)}</span>
            <span class="batch-tag${lowConf ? " warning" : ""}">置信度：${escapeHtml(String(confidence))}%</span>
            <span class="batch-tag reason">依据：${escapeHtml(item.categoryReason || "综合判断")}</span>
          </div>
        </div>
      </div>
    `;
    }).join("")}
  `;
  els.saveBtn.textContent = `批量保存 ${expenses.length} 笔`;
}

function updateBatchSummary() {
  if (!pendingExpenses.length) return;
  const summary = summarizeExpenses(pendingExpenses);
  const totalEl = els.batchPreview.querySelector(".batch-total");
  if (totalEl) totalEl.textContent = `合计 ${money(summary.total)}`;
  els.previewAmount.textContent = `共${pendingExpenses.length}笔 ${money(summary.total)}`;
  els.previewCategory.textContent = summary.categories.length === 1 ? summary.categories[0] : "多类目";
  els.previewDate.textContent = summary.dates.length === 1 ? summary.dates[0] : "多日期";
}

function fillPreview(data) {
  els.previewAmount.textContent = data.amount ? money(data.amount) : "未识别";
  els.previewCategory.textContent = data.category || "其他";
  els.previewDate.textContent = data.date || "未识别";

  els.amountInput.value = data.amount || "";
  els.categoryInput.value = data.category || "其他";
  els.dateInput.value = data.date || today();
  els.tagInput.value = data.tag || "普通支出";
  els.noteInput.value = data.note || els.voiceText.value.trim();
  renderBatchPreview([]);
}

function handleParse() {
  const text = els.voiceText.value.trim();
  if (!text) {
    showToast("请先输入或说出一笔消费");
    els.voiceText.focus();
    return null;
  }

  const expenses = parseExpenses(text);
  pendingExpenses = expenses;

  if (!expenses.length) {
    fillPreview({ amount: "", category: "其他", date: today(), note: text });
    showToast("没有识别到金额，请手动补充");
    return null;
  }

  if (expenses.length === 1) {
    fillPreview(expenses[0]);
    showToast("已完成智能识别，可确认保存");
    return expenses[0];
  }

  const summary = summarizeExpenses(expenses);
  els.previewAmount.textContent = `共${expenses.length}笔 ${money(summary.total)}`;
  els.previewCategory.textContent = summary.categories.length === 1 ? summary.categories[0] : "多类目";
  els.previewDate.textContent = summary.dates.length === 1 ? summary.dates[0] : "多日期";

  renderBatchPreview(expenses);

  showToast(`已识别${expenses.length}笔，点击保存可一次写入账单`);
  return expenses;
}

function createRecord(formData) {
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    amount: Number(formData.amount),
    category: formData.category,
    date: formData.date,
    tag: tagOptions.includes(formData.tag) ? formData.tag : "普通支出",
    note: formData.note,
    createdAt: new Date().toISOString()
  };
  if (formData.recurringId) record.recurringId = formData.recurringId;
  if (formData.recurringMonth) record.recurringMonth = formData.recurringMonth;
  return record;
}

function getFilteredRecords() {
  const period = els.periodFilter.value;
  const category = els.categoryFilter.value;
  const tag = els.tagFilter.value;
  const keyword = els.searchInput.value.trim().toLowerCase();
  const todayKey = today();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return records.filter(record => {
    const periodMatched = period === "all"
      || (period === "today" && record.date === todayKey)
      || (period === "month" && record.date.startsWith(monthKey));
    const categoryMatched = category === "all" || record.category === category;
    const tagMatched = tag === "all" || (record.tag || "普通支出") === tag;
    const keywordMatched = !keyword
      || record.note.toLowerCase().includes(keyword)
      || record.category.toLowerCase().includes(keyword)
      || (record.tag || "普通支出").toLowerCase().includes(keyword)
      || String(record.amount).includes(keyword)
      || record.date.includes(keyword);
    return periodMatched && categoryMatched && tagMatched && keywordMatched;
  });
}

function getSortedFilteredRecords() {
  return [...getFilteredRecords()].sort((a, b) => {
    return `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`);
  });
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFilteredCsv() {
  const exportRecords = getSortedFilteredRecords();
  if (!exportRecords.length) {
    showToast("当前筛选条件下没有可导出的账单");
    return;
  }

  const header = ["日期", "类目", "标签", "金额", "备注", "创建时间"];
  const rows = exportRecords.map(record => [
    record.date,
    record.category,
    record.tag || "普通支出",
    Number(record.amount).toFixed(2),
    record.note,
    record.createdAt || ""
  ]);
  const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  downloadTextFile(`\uFEFF${csv}`, `随手语音记账_${formatDate(new Date())}.csv`, "text/csv;charset=utf-8");
  showToast(`已导出 ${exportRecords.length} 笔账单`);
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function csvHeaderIndex(headers, names) {
  return headers.findIndex(header => names.includes(header.trim().toLowerCase()));
}

function normalizeCsvRecord(row, indexes) {
  const date = String(row[indexes.date] || "").trim();
  const amount = Number(String(row[indexes.amount] || "").replace(/[¥,\s]/g, ""));
  const rawCategory = String(row[indexes.category] || "").trim();
  const rawTag = indexes.tag >= 0 ? String(row[indexes.tag] || "").trim() : "";
  const note = String(row[indexes.note] || "").trim();
  const createdAt = indexes.createdAt >= 0 ? String(row[indexes.createdAt] || "").trim() : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount <= 0 || !note) {
    return null;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    amount,
    category: categoryOptions.includes(rawCategory) ? rawCategory : "其他",
    date,
    tag: tagOptions.includes(rawTag) ? rawTag : "普通支出",
    note,
    createdAt: createdAt || new Date().toISOString(),
    categoryReason: "从 CSV 导入",
    categoryConfidence: 100
  };
}

function isDuplicateRecord(record) {
  return records.some(item =>
    item.date === record.date
    && Number(item.amount).toFixed(2) === Number(record.amount).toFixed(2)
    && item.note.trim() === record.note.trim()
  );
}

function renderCsvPreview() {
  if (!pendingCsvImport) {
    els.csvPreviewPanel.hidden = true;
    els.csvPreviewPanel.innerHTML = "";
    return;
  }

  const { validRecords, invalidCount, duplicateRecords, importableRecords, fileName } = pendingCsvImport;
  const samples = validRecords.slice(0, 5);
  els.csvPreviewPanel.hidden = false;
  els.csvPreviewPanel.innerHTML = `
    <div class="csv-preview-head">
      <div>
        <div class="csv-preview-title">导入预览：${escapeHtml(fileName)}</div>
        <p>默认会跳过疑似重复账单。重复判断规则：日期、金额、备注完全相同。</p>
      </div>
      <button id="cancelCsvImportBtn" class="csv-cancel-btn" type="button">取消</button>
    </div>
    <div class="csv-preview-stats">
      <div><span>可导入</span><strong>${importableRecords.length}</strong></div>
      <div><span>疑似重复</span><strong>${duplicateRecords.length}</strong></div>
      <div><span>无效行</span><strong>${invalidCount}</strong></div>
      <div><span>有效总数</span><strong>${validRecords.length}</strong></div>
    </div>
    <div class="csv-sample-list">
      ${samples.length ? samples.map(record => `
        <div class="csv-sample-item ${record.isDuplicate ? "duplicate" : ""}">
          <div>
            <strong>${escapeHtml(record.note)}</strong>
            <span>${escapeHtml(record.date)} · ${escapeHtml(record.category)} · ${escapeHtml(record.tag || "普通支出")}</span>
          </div>
          <div>
            <b>${money(record.amount)}</b>
            ${record.isDuplicate ? "<em>疑似重复</em>" : ""}
          </div>
        </div>
      `).join("") : `<div class="csv-preview-empty">没有可预览的有效账单。</div>`}
    </div>
    <div class="csv-preview-actions">
      <button id="confirmCsvImportBtn" class="csv-confirm-btn" type="button" ${importableRecords.length ? "" : "disabled"}>确认导入 ${importableRecords.length} 笔</button>
      <span>疑似重复账单不会导入。</span>
    </div>
  `;
}

function importCsvFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCsvText(reader.result);
      if (rows.length < 2) {
        showToast("导入失败：CSV 中没有可导入的账单");
        return;
      }

      const headers = rows[0].map(header => String(header || "").trim().toLowerCase());
      const indexes = {
        date: csvHeaderIndex(headers, ["日期", "date"]),
        category: csvHeaderIndex(headers, ["类目", "消费类目", "category"]),
        tag: csvHeaderIndex(headers, ["标签", "支出标签", "tag"]),
        amount: csvHeaderIndex(headers, ["金额", "amount"]),
        note: csvHeaderIndex(headers, ["备注", "note", "说明"]),
        createdAt: csvHeaderIndex(headers, ["创建时间", "createdat", "created_at"])
      };

      if (indexes.date < 0 || indexes.category < 0 || indexes.amount < 0 || indexes.note < 0) {
        showToast("导入失败：CSV 需要包含日期、类目、金额、备注列");
        return;
      }

      const parsed = rows.slice(1).map(row => normalizeCsvRecord(row, indexes));
      const validRecords = parsed.filter(Boolean).map(record => ({
        ...record,
        isDuplicate: isDuplicateRecord(record)
      }));
      const invalidCount = parsed.length - validRecords.length;
      const duplicateRecords = validRecords.filter(record => record.isDuplicate);
      const importableRecords = validRecords.filter(record => !record.isDuplicate);
      if (!validRecords.length) {
        showToast("导入失败：没有找到有效账单");
        return;
      }

      pendingCsvImport = {
        fileName: file.name || "CSV 文件",
        validRecords,
        invalidCount,
        duplicateRecords,
        importableRecords
      };
      renderCsvPreview();
      els.csvPreviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(`已生成导入预览：可导入 ${importableRecords.length} 笔`);
    } catch {
      showToast("导入失败：无法读取这个 CSV 文件");
    } finally {
      els.importCsvInput.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function normalizeBackupRecord(record) {
  const amount = Number(record?.amount);
  const date = String(record?.date || "");
  const category = categoryOptions.includes(record?.category) ? record.category : "其他";
  const note = String(record?.note || "").trim();
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !note) {
    return null;
  }

  const normalized = {
    id: String(record.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    amount,
    category,
    date,
    tag: String(record.tag || "").trim() || "普通支出",
    note,
    createdAt: record.createdAt || new Date().toISOString(),
    categoryReason: record.categoryReason || "从备份导入",
    categoryConfidence: Number(record.categoryConfidence || 100)
  };
  if (record.recurringId) normalized.recurringId = String(record.recurringId);
  if (/^\d{4}-\d{2}$/.test(record.recurringMonth || "")) normalized.recurringMonth = record.recurringMonth;
  return normalized;
}

function exportBackupJson() {
  const backup = {
    app: "随手语音记账助手",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    userCategoryMemory,
    monthlyBudgets,
    categoryBudgets,
    recurringExpenses,
    customTags
  };
  const json = JSON.stringify(backup, null, 2);
  downloadTextFile(json, `随手语音记账_完整备份_${formatDate(new Date())}.json`, "application/json;charset=utf-8");
  showToast(`已导出完整备份：${records.length} 笔账单`);
}

function importBackupJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(String(reader.result || ""));
      const sourceRecords = Array.isArray(backup.records) ? backup.records : Array.isArray(backup) ? backup : null;
      if (!sourceRecords) {
        showToast("导入失败：备份文件格式不正确");
        return;
      }

      const nextRecords = sourceRecords.map(normalizeBackupRecord).filter(Boolean);
      if (!nextRecords.length) {
        showToast("导入失败：没有找到有效账单");
        return;
      }

      const shouldImport = window.confirm(`将导入 ${nextRecords.length} 笔账单，并覆盖当前 ${records.length} 笔账单。确定继续吗？`);
      if (!shouldImport) {
        showToast("已取消导入");
        return;
      }

      if (Array.isArray(backup.customTags)) {
        customTags = backup.customTags.map(tag => String(tag || "").trim()).filter(Boolean);
        saveCustomTags();
      }
      records = nextRecords;
      if (Array.isArray(backup.userCategoryMemory)) {
        userCategoryMemory = backup.userCategoryMemory.slice(-80);
        saveUserCategoryMemory();
      }
      if (backup.monthlyBudgets && typeof backup.monthlyBudgets === "object" && !Array.isArray(backup.monthlyBudgets)) {
        monthlyBudgets = Object.fromEntries(
          Object.entries(backup.monthlyBudgets)
            .map(([month, amount]) => [month, Number(amount)])
            .filter(([month, amount]) => /^\d{4}-\d{2}$/.test(month) && Number.isFinite(amount) && amount > 0)
        );
        saveMonthlyBudgets();
      }
      if (backup.categoryBudgets && typeof backup.categoryBudgets === "object" && !Array.isArray(backup.categoryBudgets)) {
        categoryBudgets = {};
        Object.entries(backup.categoryBudgets).forEach(([month, budgets]) => {
          if (!/^\d{4}-\d{2}$/.test(month) || !budgets || typeof budgets !== "object" || Array.isArray(budgets)) return;
          const normalized = Object.fromEntries(
            Object.entries(budgets)
              .map(([category, amount]) => [category, Number(amount)])
              .filter(([category, amount]) => categoryOptions.includes(category) && Number.isFinite(amount) && amount > 0)
          );
          if (Object.keys(normalized).length) categoryBudgets[month] = normalized;
        });
        saveCategoryBudgets();
      }
      if (Array.isArray(backup.recurringExpenses)) {
        recurringExpenses = backup.recurringExpenses.map(normalizeRecurringExpense).filter(Boolean);
        saveRecurringExpenses();
      }
      saveRecords();
      currentPage = 1;
      editingRecordId = null;
      renderRecords();
      showToast(`已导入 ${records.length} 笔账单`);
    } catch {
      showToast("导入失败：无法读取这个 JSON 文件");
    } finally {
      els.importBackupInput.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function renderRecords() {
  const filtered = getFilteredRecords();
  const sorted = getSortedFilteredRecords();
  const existingIds = new Set(records.map(record => record.id));
  selectedRecordIds = new Set([...selectedRecordIds].filter(id => existingIds.has(id)));
  const pageSize = Number(els.pageSizeSelect.value || 10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRecords = sorted.slice(start, start + pageSize);

  const groups = [];
  const groupMap = new Map();
  pageRecords.forEach(record => {
    if (!groupMap.has(record.date)) {
      const group = { date: record.date, items: [] };
      groupMap.set(record.date, group);
      groups.push(group);
    }
    groupMap.get(record.date).items.push(record);
  });

  els.recordList.innerHTML = groups.map(group => {
    const groupTotal = group.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const itemsHtml = group.items.map(record => {
    if (record.id === editingRecordId) {
      return `
        <li class="record-item editing" data-id="${record.id}">
          <div class="record-edit-grid">
            <label>
              金额
              <input class="edit-field" data-field="amount" type="number" min="0" step="0.01" value="${Number(record.amount).toFixed(2)}" />
            </label>
            <label>
              类目
              <select class="edit-field" data-field="category">
                ${categoryOptions.map(category => `<option value="${category}" ${category === record.category ? "selected" : ""}>${category}</option>`).join("")}
              </select>
            </label>
            <label>
              日期
              <input class="edit-field" data-field="date" type="date" value="${escapeHtml(record.date)}" />
            </label>
            <label>
              标签
              <select class="edit-field" data-field="tag">
                ${tagOptions.map(tag => `<option value="${escapeHtml(tag)}" ${tag === (record.tag || "普通支出") ? "selected" : ""}>${escapeHtml(tag)}</option>`).join("")}
              </select>
            </label>
            <label class="edit-note-field">
              备注
              <input class="edit-field" data-field="note" type="text" value="${escapeHtml(record.note)}" />
            </label>
          </div>
          <div class="record-actions edit-actions">
            <button class="save-edit-btn" type="button" data-id="${record.id}">保存修改</button>
            <button class="cancel-edit-btn" type="button">取消</button>
          </div>
        </li>
      `;
    }

    const checked = selectedRecordIds.has(record.id) ? "checked" : "";
    return `
      <li class="record-item ${isBulkMode ? "bulk-item" : ""} ${selectedRecordIds.has(record.id) ? "bulk-selected" : ""}" data-id="${record.id}">
        ${isBulkMode ? `
          <label class="bulk-check">
            <input class="bulk-record-checkbox" type="checkbox" data-id="${record.id}" ${checked} />
            <span></span>
          </label>
        ` : ""}
        <div class="record-main">
          <div class="record-note">${escapeHtml(record.note)}</div>
          <div class="record-meta">
            <span>${escapeHtml(record.category)}</span>
            <span class="record-tag">${escapeHtml(record.tag || "普通支出")}</span>
          </div>
        </div>
        <div class="record-amount">${money(record.amount)}</div>
        <div class="record-actions">
          <button class="edit-btn" type="button" data-id="${record.id}">编辑</button>
          <button class="delete-btn" type="button" data-id="${record.id}" aria-label="删除记录">×</button>
        </div>
      </li>
    `;
    }).join("");
    return `
      <li class="record-group">
        <div class="record-group-header">
          <span class="record-group-date">${formatGroupDate(group.date)}</span>
          <span class="record-group-meta">${group.items.length}笔 · ${money(groupTotal)}</span>
        </div>
        <ul class="record-group-items">${itemsHtml}</ul>
      </li>
    `;
  }).join("");

  const filteredTotal = filtered.reduce((sum, item) => sum + Number(item.amount), 0);
  const visibleStart = sorted.length ? start + 1 : 0;
  const visibleEnd = Math.min(start + pageSize, sorted.length);
  els.filteredSummary.textContent = `筛选共 ${filtered.length} 笔，当前显示 ${visibleStart}-${visibleEnd}，合计 ${money(filteredTotal)}`;
  els.emptyState.textContent = records.length ? "当前筛选条件下没有账单。" : "还没有账单。先说一句“今天午饭花了35元”试试。";
  els.emptyState.style.display = pageRecords.length ? "none" : "block";
  els.pager.hidden = sorted.length <= pageSize;
  els.pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
  els.prevPageBtn.disabled = currentPage <= 1;
  els.nextPageBtn.disabled = currentPage >= totalPages;
  renderBulkActionBar();
  renderStats();
}

function renderBulkActionBar() {
  els.bulkActionBar.hidden = !isBulkMode;
  els.toggleBulkModeBtn.textContent = isBulkMode ? "退出批量" : "批量模式";
  els.toggleBulkModeBtn.classList.toggle("active", isBulkMode);
  els.bulkSelectedCount.textContent = `已选 ${selectedRecordIds.size} 笔`;
  const hasSelection = selectedRecordIds.size > 0;
  els.applyBulkCategoryBtn.disabled = !hasSelection;
  els.applyBulkTagBtn.disabled = !hasSelection;
  els.bulkDeleteBtn.disabled = !hasSelection;
}

function showUndo(action) {
  pendingUndo = action;
  els.undoText.textContent = action.message;
  els.undoBar.classList.add("show");
  window.clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => {
    els.undoBar.classList.remove("show");
    pendingUndo = null;
  }, 6000);
}

function shortDateLabel(dateStr) {
  const [, month, day] = dateStr.split("-");
  if (dateStr === today()) return "今天";
  return `${Number(month)}/${Number(day)}`;
}

function getMonthRecords() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return records.filter(item => item.date.startsWith(monthKey));
}

function renderMonthlyReport(monthRecords, now) {
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = monthRecords.reduce((sum, item) => sum + Number(item.amount), 0);
  const budget = Number(monthlyBudgets[monthKey] || 0);

  if (!monthRecords.length) {
    els.monthlyReport.innerHTML = `<div class="insight-empty">本月还没有账单。记几笔之后，这里会自动生成月报总结。</div>`;
    return;
  }

  const categoryTotals = categoryOptions
    .map(category => ({
      category,
      total: monthRecords
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);
  const topCategory = categoryTotals[0];

  const tagTotal = tag => monthRecords
    .filter(item => (item.tag || "普通支出") === tag)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const optimizeTotal = tagTotal("可减少") + tagTotal("冲动消费");
  const reimbursableTotal = tagTotal("可报销");
  const fixedTotal = tagTotal("固定支出");
  const maxRecord = [...monthRecords].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const activeDays = new Set(monthRecords.map(item => item.date)).size;
  const avgDaily = monthTotal / Math.max(activeDays, 1);

  const budgetText = budget
    ? monthTotal > budget
      ? `本月已超出总预算 ${money(monthTotal - budget)}。`
      : `本月总预算还剩 ${money(budget - monthTotal)}。`
    : "本月还没有设置总预算。";
  const categoryText = topCategory
    ? `支出最高的类目是${topCategory.category}，共 ${money(topCategory.total)}。`
    : "本月还没有明显的类目支出。";
  const tagText = optimizeTotal > 0
    ? `可优化支出为 ${money(optimizeTotal)}，建议优先回看“可减少”和“冲动消费”。`
    : "本月暂无可优化支出标签，消费结构相对克制。";
  const reclaimText = reimbursableTotal > 0
    ? `另有 ${money(reimbursableTotal)} 标记为可报销，记得及时追回。`
    : "本月暂无可报销支出。";

  els.monthlyReport.innerHTML = `
    <div class="monthly-report-hero">
      <span>${now.getFullYear()}年${now.getMonth() + 1}月</span>
      <strong>${money(monthTotal)}</strong>
      <small>共 ${monthRecords.length} 笔，覆盖 ${activeDays} 天，记账日均 ${money(avgDaily)}</small>
    </div>
    <div class="monthly-report-grid">
      <div><span>总预算状态</span><strong>${budget ? (monthTotal > budget ? "已超支" : "正常") : "未设置"}</strong></div>
      <button class="monthly-report-filter" type="button" data-filter-type="max" data-keyword="${escapeHtml(maxRecord.note)}">
        <span>最大单笔</span><strong>${money(maxRecord.amount)}</strong>
      </button>
      <div><span>固定支出</span><strong>${money(fixedTotal)}</strong></div>
    </div>
    <ul class="monthly-report-lines">
      <li>${escapeHtml(budgetText)}</li>
      <li>${escapeHtml(categoryText)}</li>
      <li>${escapeHtml(tagText)}</li>
      <li>${escapeHtml(reclaimText)}</li>
    </ul>
  `;
}

function renderCategoryChart(monthRecords) {
  const totals = categoryOptions
    .map(category => ({
      category,
      total: monthRecords
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);
  if (!grandTotal) {
    els.categoryChart.innerHTML = `<div class="insight-empty">本月还没有账单，记一笔后就能看到类目占比。</div>`;
    return;
  }

  els.categoryChart.innerHTML = totals.map(item => {
    const percent = Math.round((item.total / grandTotal) * 100);
    return `
      <button class="category-row clickable-insight" type="button" data-filter-type="category" data-category="${escapeHtml(item.category)}">
        <div class="category-row-head">
          <span>${escapeHtml(item.category)}</span>
          <strong>${money(item.total)} · ${percent}%</strong>
        </div>
        <div class="category-bar">
          <span style="width: ${Math.max(percent, 4)}%"></span>
        </div>
      </button>
    `;
  }).join("");
}

function renderTrendChart() {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
    const key = formatDate(date);
    const total = records
      .filter(item => item.date === key)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { key, total };
  });
  const maxTotal = Math.max(...days.map(item => item.total), 1);

  els.trendChart.innerHTML = days.map(item => {
    const height = item.total ? Math.max((item.total / maxTotal) * 100, 8) : 0;
    return `
      <div class="trend-day">
        <div class="trend-value">${item.total ? money(item.total) : "¥0"}</div>
        <div class="trend-bar"><span style="height: ${height}%"></span></div>
        <div class="trend-label">${shortDateLabel(item.key)}</div>
      </div>
    `;
  }).join("");
}

function renderMaxRecord(monthRecords) {
  if (!monthRecords.length) {
    els.maxRecordInsight.innerHTML = `<div class="insight-empty">本月还没有最大单笔记录。</div>`;
    return;
  }

  const maxRecord = [...monthRecords].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  els.maxRecordInsight.innerHTML = `
    <div class="max-amount">${money(maxRecord.amount)}</div>
    <div class="max-note">${escapeHtml(maxRecord.note)}</div>
    <div class="max-meta">
      <span>${escapeHtml(maxRecord.category)}</span>
      <span>${escapeHtml(maxRecord.date)}</span>
    </div>
  `;
}

function renderTagInsights(monthRecords) {
  const totals = tagOptions
    .map(tag => ({
      tag,
      total: monthRecords
        .filter(item => (item.tag || "普通支出") === tag)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter(item => item.total > 0);
  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);

  if (!grandTotal) {
    els.tagInsightSummary.innerHTML = `<div class="insight-empty">本月还没有带标签的账单，保存账单后这里会显示支出属性分析。</div>`;
    els.tagChart.innerHTML = "";
    return;
  }

  const getTotal = tag => totals.find(item => item.tag === tag)?.total || 0;
  const reducibleTotal = getTotal("可减少");
  const impulseTotal = getTotal("冲动消费");
  const reimbursableTotal = getTotal("可报销");
  const fixedTotal = getTotal("固定支出");

  els.tagInsightSummary.innerHTML = `
    <div class="tag-summary-card caution">
      <span>可优化支出</span>
      <strong>${money(reducibleTotal + impulseTotal)}</strong>
      <small>可减少 + 冲动消费</small>
    </div>
    <button class="tag-summary-card reclaim clickable-insight" type="button" data-filter-type="tag" data-tag="可报销">
      <span>可报销</span>
      <strong>${money(reimbursableTotal)}</strong>
      <small>记得及时追回</small>
    </button>
    <button class="tag-summary-card fixed clickable-insight" type="button" data-filter-type="tag" data-tag="固定支出">
      <span>固定支出</span>
      <strong>${money(fixedTotal)}</strong>
      <small>本月固定成本</small>
    </button>
  `;

  els.tagChart.innerHTML = totals
    .sort((a, b) => b.total - a.total)
    .map(item => {
      const percent = Math.round((item.total / grandTotal) * 100);
      return `
        <button class="tag-row clickable-insight" type="button" data-filter-type="tag" data-tag="${escapeHtml(item.tag)}">
          <div class="tag-row-head">
            <span>${escapeHtml(item.tag)}</span>
            <strong>${money(item.total)} · ${percent}%</strong>
          </div>
          <div class="tag-bar ${item.tag === "冲动消费" || item.tag === "可减少" ? "caution" : ""}">
            <span style="width: ${Math.max(percent, 4)}%"></span>
          </div>
        </button>
      `;
    }).join("");
}

function renderInsights() {
  const now = new Date();
  const monthRecords = getMonthRecords();
  els.insightMonthLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  renderMonthlyReport(monthRecords, now);
  renderCategoryChart(monthRecords);
  renderTrendChart();
  renderMaxRecord(monthRecords);
  renderTagInsights(monthRecords);
}

function renderSmartSettings() {
  const memories = userCategoryMemory
    .map((item, index) => ({ ...item, index }))
    .filter(item => item.keyword && item.category)
    .reverse();
  els.learningCount.textContent = `${memories.length} 条记忆`;

  if (!memories.length) {
    els.learningList.innerHTML = `
      <div class="smart-empty">
        还没有学习记忆。你可以手动新增，也可以在账单里修改类目，系统会自动记住。
      </div>
    `;
    return;
  }

  els.learningList.innerHTML = memories.map(item => `
    <div class="learning-item">
      <div>
        <div class="learning-rule">
          <span>${escapeHtml(item.keyword)}</span>
          <strong>${escapeHtml(item.category)}</strong>
        </div>
        <div class="learning-meta">${escapeHtml(item.source || "历史修正")}${item.updatedAt ? ` · ${escapeHtml(item.updatedAt.slice(0, 10))}` : ""}</div>
      </div>
      <button class="delete-learning-btn" type="button" data-index="${item.index}">删除</button>
    </div>
  `).join("");
}

function renderTagSettings() {
  els.customTagCount.textContent = `${customTags.length} 个自定义`;
  const availableSuggestions = tagSuggestions.filter(tag => !tagOptions.includes(tag));
  els.tagSuggestions.innerHTML = availableSuggestions.length
    ? availableSuggestions.map(tag => `<button class="tag-suggestion-btn" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")
    : `<div class="tag-empty">常用建议都已经添加了。</div>`;

  els.customTagList.innerHTML = `
    ${defaultTagOptions.map(tag => `
      <div class="custom-tag-item default">
        <span>${escapeHtml(tag)}</span>
        <em>默认</em>
      </div>
    `).join("")}
    ${customTags.map(tag => `
      <div class="custom-tag-item">
        <span>${escapeHtml(tag)}</span>
        <button class="delete-custom-tag-btn" type="button" data-tag="${escapeHtml(tag)}">删除</button>
      </div>
    `).join("")}
  `;
}

function addCustomTag(tag) {
  const nextTag = String(tag || "").trim().replace(/\s+/g, "");
  if (!nextTag) {
    showToast("请输入标签名称");
    return;
  }
  if (nextTag.length > 8) {
    showToast("标签名称建议不超过 8 个字");
    return;
  }
  if (tagOptions.includes(nextTag)) {
    showToast(`标签「${nextTag}」已经存在`);
    return;
  }

  customTags.push(nextTag);
  saveCustomTags();
  els.customTagInput.value = "";
  showToast(`已添加标签：${nextTag}`);
}

function deleteCustomTag(tag) {
  if (!customTags.includes(tag)) return;
  const affectedRecords = records.filter(record => (record.tag || "普通支出") === tag).length;
  const affectedRecurring = recurringExpenses.filter(item => item.tag === tag).length;
  const confirmed = window.confirm(`确定要删除自定义标签「${tag}」吗？${affectedRecords || affectedRecurring ? "相关账单和固定支出会改为「普通支出」。" : ""}`);
  if (!confirmed) return;

  records.forEach(record => {
    if ((record.tag || "普通支出") === tag) record.tag = "普通支出";
  });
  recurringExpenses.forEach(item => {
    if (item.tag === tag) item.tag = "普通支出";
  });
  customTags = customTags.filter(item => item !== tag);
  saveRecords();
  saveRecurringExpenses();
  saveCustomTags();
  showToast(`已删除标签：${tag}`);
}

function normalizeRecurringExpense(item) {
  const amount = Number(item?.amount);
  const name = String(item?.name || "").trim();
  const day = Math.min(Math.max(Number(item?.day || 1), 1), 31);
  if (!name || !Number.isFinite(amount) || amount <= 0) return null;

  return {
    id: String(item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name,
    amount,
    category: categoryOptions.includes(item.category) ? item.category : "其他",
    tag: tagOptions.includes(item.tag) ? item.tag : "固定支出",
    day,
    note: String(item.note || "").trim(),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function recurringRecordDate(day, monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return `${monthKey}-${String(actualDay).padStart(2, "0")}`;
}

function hasGeneratedRecurring(item, monthKey) {
  return records.some(record => record.recurringId === item.id && record.recurringMonth === monthKey);
}

function createRecurringRecord(item, monthKey) {
  return createRecord({
    amount: item.amount,
    category: item.category,
    date: recurringRecordDate(item.day, monthKey),
    tag: item.tag,
    note: item.note || item.name,
    recurringId: item.id,
    recurringMonth: monthKey
  });
}

function renderRecurringExpenses() {
  const monthKey = currentMonthKey();
  const pendingCount = recurringExpenses.filter(item => !hasGeneratedRecurring(item, monthKey)).length;
  els.recurringCount.textContent = `${recurringExpenses.length} 项`;
  els.generateAllRecurringBtn.disabled = pendingCount === 0;
  els.generateAllRecurringBtn.textContent = pendingCount ? `生成本月未生成（${pendingCount}）` : "本月已全部生成";

  if (!recurringExpenses.length) {
    els.recurringList.innerHTML = `
      <div class="recurring-empty">
        还没有固定支出。添加房租、会员或水电后，可以每月一键生成账单。
      </div>
    `;
    return;
  }

  els.recurringList.innerHTML = recurringExpenses.map(item => {
    const generated = hasGeneratedRecurring(item, monthKey);
    const billDate = recurringRecordDate(item.day, monthKey);
    return `
      <div class="recurring-item ${generated ? "generated" : ""}">
        <div class="recurring-item-main">
          <div class="recurring-name">${escapeHtml(item.name)}</div>
          <div class="recurring-meta">
            <span>${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.tag)}</span>
            <span>每月${item.day}日</span>
            <span>${escapeHtml(billDate)}</span>
          </div>
          ${item.note ? `<div class="recurring-note">${escapeHtml(item.note)}</div>` : ""}
        </div>
        <div class="recurring-amount">${money(item.amount)}</div>
        <div class="recurring-actions">
          <button class="generate-recurring-btn" type="button" data-id="${escapeHtml(item.id)}" ${generated ? "disabled" : ""}>${generated ? "本月已生成" : "生成本月账单"}</button>
          <button class="delete-recurring-btn" type="button" data-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderBudget(monthTotal, monthKey, now) {
  const budget = Number(monthlyBudgets[monthKey] || 0);
  const percent = budget > 0 ? Math.min((monthTotal / budget) * 100, 140) : 0;
  const remaining = budget - monthTotal;
  const currentCategory = els.categoryBudgetSelect.value || categoryOptions[0];
  const currentCategoryBudget = Number(categoryBudgets[monthKey]?.[currentCategory] || 0);
  els.budgetMonthLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  els.budgetUsed.textContent = money(monthTotal);
  els.budgetLimit.textContent = budget > 0 ? money(budget) : "未设置";
  els.budgetRemaining.textContent = budget > 0 ? money(Math.max(remaining, 0)) : "--";
  els.budgetInput.value = budget > 0 ? Number(budget.toFixed(2)) : "";
  els.categoryBudgetInput.value = currentCategoryBudget > 0 ? Number(currentCategoryBudget.toFixed(2)) : "";
  els.budgetProgressBar.style.width = `${Math.min(percent, 100)}%`;
  els.budgetCard.classList.remove("warning", "danger", "empty");
  renderCategoryBudgetList(monthKey);

  if (!budget) {
    els.budgetCard.classList.add("empty");
    els.budgetStatusText.textContent = "设置本月总预算后，这里会提醒你是否快超支。";
    return;
  }

  if (monthTotal > budget) {
    els.budgetCard.classList.add("danger");
    els.budgetStatusText.textContent = `已超出预算 ${money(Math.abs(remaining))}，建议控制后续支出。`;
  } else if (monthTotal >= budget * 0.8) {
    els.budgetCard.classList.add("warning");
    els.budgetStatusText.textContent = `预算已使用 ${Math.round((monthTotal / budget) * 100)}%，快到上限了。`;
  } else {
    els.budgetStatusText.textContent = `预算使用良好，还剩 ${money(remaining)}。`;
  }
}

function renderCategoryBudgetList(monthKey) {
  const budgets = categoryBudgets[monthKey] || {};
  const rows = categoryOptions
    .map(category => {
      const budget = Number(budgets[category] || 0);
      if (!budget) return null;
      const used = records
        .filter(item => item.date.startsWith(monthKey) && item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const percent = budget > 0 ? (used / budget) * 100 : 0;
      const status = used > budget ? "danger" : used >= budget * 0.8 ? "warning" : "normal";
      const statusText = used > budget ? `超出 ${money(used - budget)}` : `剩余 ${money(budget - used)}`;
      return { category, budget, used, percent, status, statusText };
    })
    .filter(Boolean);

  if (!rows.length) {
    els.categoryBudgetList.innerHTML = `<div class="category-budget-empty">还没有设置类目预算。先选择一个类目，填入预算金额后保存。</div>`;
    return;
  }

  els.categoryBudgetList.innerHTML = rows.map(row => `
    <div class="category-budget-item ${row.status}">
      <div class="category-budget-row">
        <strong>${escapeHtml(row.category)}</strong>
        <span>${escapeHtml(row.statusText)}</span>
      </div>
      <div class="category-budget-progress">
        <span style="width: ${Math.min(row.percent, 100)}%"></span>
      </div>
      <div class="category-budget-meta">
        <span>已用 ${money(row.used)}</span>
        <span>预算 ${money(row.budget)}</span>
        <span>${Math.round(row.percent)}%</span>
      </div>
      <button class="delete-category-budget-btn" type="button" data-category="${escapeHtml(row.category)}">删除该类目预算</button>
    </div>
  `).join("");
}

function renderStats() {
  const now = new Date();
  const todayKey = today();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const todayTotal = records
    .filter(item => item.date === todayKey)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthTotal = records
    .filter(item => item.date.startsWith(monthKey))
    .reduce((sum, item) => sum + Number(item.amount), 0);

  els.todayTotal.textContent = money(todayTotal);
  els.monthTotal.textContent = money(monthTotal);
  els.recordCount.textContent = records.length;
  renderBudget(monthTotal, monthKey, now);
  renderInsights();
  renderSmartSettings();
  renderTagSettings();
  renderRecurringExpenses();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.speechStatus.textContent = "浏览器不支持语音";
    els.micBtn.title = "当前浏览器不支持语音识别，可使用文字输入";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isRecording = true;
    pendingExpenses = [];
    els.voiceText.value = "";
    els.micBtn.classList.add("recording");
    els.micBtn.querySelector("span:last-child").textContent = "正在听";
    els.speechStatus.textContent = "识别中";
  };

  recognition.onresult = event => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i += 1) {
      transcript += event.results[i][0].transcript;
    }
    els.voiceText.value = transcript;
  };

  recognition.onerror = () => {
    showToast("语音识别失败，请改用文字输入");
  };

  recognition.onend = () => {
    isRecording = false;
    els.micBtn.classList.remove("recording");
    els.micBtn.querySelector("span:last-child").textContent = "开始语音";
    els.speechStatus.textContent = els.voiceText.value.trim() ? "已输入" : "待输入";
    if (els.voiceText.value.trim()) handleParse();
  };
}

els.parseBtn.addEventListener("click", handleParse);

els.clearInputBtn.addEventListener("click", () => {
  els.voiceText.value = "";
  pendingExpenses = [];
  fillPreview({ amount: "", category: "其他", date: today(), note: "" });
  els.speechStatus.textContent = "待输入";
});

els.micBtn.addEventListener("click", () => {
  if (!recognition) {
    showToast("当前浏览器不支持语音识别，可先用文字输入");
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

document.querySelectorAll(".sample-btn").forEach(button => {
  button.addEventListener("click", () => {
    els.voiceText.value = button.dataset.sample;
    handleParse();
  });
});

function updatePendingExpenseFromField(field) {
  const index = Number(field.dataset.index);
  const fieldName = field.dataset.field;
  const item = pendingExpenses[index];
  if (!item) return;

  if (fieldName === "amount") {
    item.amount = Number(field.value);
    const moneyEl = field.closest(".batch-item").querySelector(".batch-money");
    if (moneyEl) moneyEl.textContent = money(item.amount);
  }

  if (fieldName === "category") {
    item.category = field.value;
    item.categoryReason = "你手动修正，保存后会记住";
    item.categoryConfidence = 100;
    const itemBox = field.closest(".batch-item");
    if (itemBox) {
      itemBox.classList.remove("low-confidence");
      const badge = itemBox.querySelector(".batch-warning-badge");
      if (badge) badge.remove();
    }
    const meta = field.closest(".batch-item").querySelector(".batch-meta");
    if (meta) {
      const tags = meta.querySelectorAll(".batch-tag");
      if (tags[1]) {
        tags[1].textContent = "置信度：100%";
        tags[1].classList.remove("warning");
      }
      if (tags[2]) tags[2].textContent = "依据：你手动修正，保存后会记住";
    }
  }

  if (fieldName === "date") item.date = field.value;
  if (fieldName === "tag") item.tag = field.value;
  if (fieldName === "note") item.note = field.value.trim();

  updateBatchSummary();
}

els.batchPreview.addEventListener("input", event => {
  const field = event.target.closest(".batch-field");
  if (!field) return;
  updatePendingExpenseFromField(field);
});

els.batchPreview.addEventListener("change", event => {
  const field = event.target.closest(".batch-field");
  if (!field) return;
  updatePendingExpenseFromField(field);
});

els.recordForm.addEventListener("submit", event => {
  event.preventDefault();

  if (pendingExpenses.length > 1) {
    const invalidItem = pendingExpenses.find(item => !Number(item.amount) || Number(item.amount) <= 0 || !item.date || !item.note);
    if (invalidItem) {
      showToast("请检查每一项的金额、日期和备注");
      return;
    }

    pendingExpenses.forEach(item => {
      learnCategoryFromCorrection(item.note, item.category, item.originalCategory);
    });

    const batchRecords = pendingExpenses.map(item => createRecord({
      amount: item.amount,
      category: item.category,
      date: item.date,
      tag: item.tag,
      note: item.note
    }));

    records.push(...batchRecords);
    saveRecords();
    renderRecords();
    showToast(`已批量保存${batchRecords.length}笔账单`);
    showUndo({ type: "create", message: `已保存 ${batchRecords.length} 笔账单`, records: batchRecords });
    notifyDuplicateOnEntry(batchRecords);

    pendingExpenses = [];
    els.voiceText.value = "";
    fillPreview({ amount: "", category: "其他", date: today(), note: "" });
    els.speechStatus.textContent = "待输入";
    return;
  }

  const amount = Number(els.amountInput.value);
  const category = els.categoryInput.value;
  const date = els.dateInput.value;
  const tag = els.tagInput.value;
  const note = els.noteInput.value.trim() || els.voiceText.value.trim() || "未填写备注";

  if (!amount || amount <= 0) {
    showToast("请填写有效金额");
    els.amountInput.focus();
    return;
  }

  if (!date) {
    showToast("请选择日期");
    els.dateInput.focus();
    return;
  }

  const record = createRecord({ amount, category, date, tag, note });
  if (pendingExpenses.length === 1) {
    learnCategoryFromCorrection(note, category, pendingExpenses[0].originalCategory);
  }
  records.push(record);
  saveRecords();
  renderRecords();
  showToast("保存成功");
  showUndo({ type: "create", message: "已保存 1 笔账单", records: [record] });
  notifyDuplicateOnEntry([record]);

  pendingExpenses = [];
  els.voiceText.value = "";
  fillPreview({ amount: "", category: "其他", date: today(), note: "" });
  els.speechStatus.textContent = "待输入";
});

function applyInsightFilter({ category = "all", tag = "all", keyword = "", message }) {
  els.periodFilter.value = "month";
  els.categoryFilter.value = category;
  els.tagFilter.value = tag;
  els.searchInput.value = keyword;
  currentPage = 1;
  editingRecordId = null;
  selectedRecordIds.clear();
  renderRecords();
  els.recordsCard.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast(message);
}

function resetFilters() {
  const alreadyDefault = els.periodFilter.value === "all"
    && els.categoryFilter.value === "all"
    && els.tagFilter.value === "all"
    && !els.searchInput.value.trim();

  els.periodFilter.value = "all";
  els.categoryFilter.value = "all";
  els.tagFilter.value = "all";
  els.searchInput.value = "";
  currentPage = 1;
  editingRecordId = null;
  selectedRecordIds.clear();
  renderRecords();
  showToast(alreadyDefault ? "当前已经是全部账单" : "已重置筛选，显示全部账单");
}

function toggleBulkMode() {
  isBulkMode = !isBulkMode;
  selectedRecordIds.clear();
  editingRecordId = null;
  renderRecords();
  showToast(isBulkMode ? "已进入批量模式" : "已退出批量模式");
}

function selectFilteredRecords() {
  const filtered = getFilteredRecords();
  filtered.forEach(record => selectedRecordIds.add(record.id));
  renderRecords();
  showToast(`已选择当前筛选下的 ${filtered.length} 笔账单`);
}

function clearBulkSelection() {
  selectedRecordIds.clear();
  renderRecords();
  showToast("已清空选择");
}

function applyBulkField(field, value) {
  if (!selectedRecordIds.size) {
    showToast("请先选择账单");
    return;
  }

  const before = records
    .filter(record => selectedRecordIds.has(record.id))
    .map(record => ({ id: record.id, category: record.category, tag: record.tag || "普通支出" }));

  records.forEach(record => {
    if (!selectedRecordIds.has(record.id)) return;
    record[field] = value;
  });
  saveRecords();
  renderRecords();
  showToast(`已批量修改 ${before.length} 笔账单`);
  showUndo({ type: "bulkEdit", message: `已批量修改 ${before.length} 笔账单`, before });
}

function deleteSelectedRecords() {
  if (!selectedRecordIds.size) {
    showToast("请先选择账单");
    return;
  }

  const selectedRecords = records.filter(record => selectedRecordIds.has(record.id));
  const confirmed = window.confirm(`确定要删除已选的 ${selectedRecords.length} 笔账单吗？`);
  if (!confirmed) return;

  records = records.filter(record => !selectedRecordIds.has(record.id));
  selectedRecordIds.clear();
  saveRecords();
  renderRecords();
  showToast(`已删除 ${selectedRecords.length} 笔账单`);
  showUndo({ type: "delete", message: `已删除 ${selectedRecords.length} 笔账单`, records: selectedRecords });
}

els.recordList.addEventListener("click", event => {
  const checkbox = event.target.closest(".bulk-record-checkbox");
  if (checkbox) {
    if (checkbox.checked) {
      selectedRecordIds.add(checkbox.dataset.id);
    } else {
      selectedRecordIds.delete(checkbox.dataset.id);
    }
    renderRecords();
    return;
  }

  const editButton = event.target.closest(".edit-btn");
  if (editButton) {
    editingRecordId = editButton.dataset.id;
    renderRecords();
    return;
  }

  const cancelButton = event.target.closest(".cancel-edit-btn");
  if (cancelButton) {
    editingRecordId = null;
    renderRecords();
    return;
  }

  const saveButton = event.target.closest(".save-edit-btn");
  if (saveButton) {
    const itemEl = saveButton.closest(".record-item");
    const targetRecord = records.find(item => item.id === saveButton.dataset.id);
    if (!itemEl || !targetRecord) return;

    const amount = Number(itemEl.querySelector('[data-field="amount"]').value);
    const category = itemEl.querySelector('[data-field="category"]').value;
    const date = itemEl.querySelector('[data-field="date"]').value;
    const tag = itemEl.querySelector('[data-field="tag"]').value;
    const note = itemEl.querySelector('[data-field="note"]').value.trim();

    if (!amount || amount <= 0) {
      showToast("请填写有效金额");
      return;
    }

    if (!date) {
      showToast("请选择日期");
      return;
    }

    if (!note) {
      showToast("请填写备注");
      return;
    }

    const oldCategory = targetRecord.category;
    const before = {
      id: targetRecord.id,
      amount: targetRecord.amount,
      category: targetRecord.category,
      date: targetRecord.date,
      tag: targetRecord.tag || "普通支出",
      note: targetRecord.note
    };
    targetRecord.amount = amount;
    targetRecord.category = category;
    targetRecord.date = date;
    targetRecord.tag = tag;
    targetRecord.note = note;
    learnCategoryFromCorrection(note, category, oldCategory);
    saveRecords();
    editingRecordId = null;
    renderRecords();
    showToast("账单已更新");
    showUndo({ type: "edit", message: "账单已更新", before });
    return;
  }

  const button = event.target.closest(".delete-btn");
  if (!button) return;

  const targetRecord = records.find(item => item.id === button.dataset.id);
  const recordName = targetRecord ? `${targetRecord.note}（${money(targetRecord.amount)}）` : "这条账单";
  const confirmed = window.confirm(`确定要删除 ${recordName} 吗？此操作不可恢复。`);
  if (!confirmed) return;

  records = records.filter(item => item.id !== button.dataset.id);
  if (editingRecordId === button.dataset.id) editingRecordId = null;
  saveRecords();
  renderRecords();
  showToast("已删除");
  showUndo({ type: "delete", message: "已删除该账单", records: [targetRecord] });
});

els.clearRecordsBtn.addEventListener("click", () => {
  if (!records.length) {
    showToast("当前没有账单");
    return;
  }

  const confirmed = window.confirm("确定要清空所有账单吗？此操作不可恢复。");
  if (!confirmed) return;

  records = [];
  saveRecords();
  renderRecords();
  showToast("账单已清空");
});

function resetPageAndRender() {
  currentPage = 1;
  selectedRecordIds.clear();
  renderRecords();
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

els.saveBudgetBtn.addEventListener("click", () => {
  const amount = Number(els.budgetInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("请输入有效的本月预算金额");
    els.budgetInput.focus();
    return;
  }

  monthlyBudgets[currentMonthKey()] = amount;
  saveMonthlyBudgets();
  renderStats();
  showToast("本月预算已保存");
});

els.clearBudgetBtn.addEventListener("click", () => {
  const monthKey = currentMonthKey();
  if (!monthlyBudgets[monthKey]) {
    showToast("本月还没有设置预算");
    return;
  }

  const confirmed = window.confirm("确定要清除本月总预算吗？清除后，本月总预算提醒将不再显示预算进度。");
  if (!confirmed) return;

  delete monthlyBudgets[monthKey];
  saveMonthlyBudgets();
  renderStats();
  showToast("已清除本月预算");
});

els.categoryBudgetSelect.addEventListener("change", () => {
  const monthKey = currentMonthKey();
  const category = els.categoryBudgetSelect.value;
  const amount = Number(categoryBudgets[monthKey]?.[category] || 0);
  els.categoryBudgetInput.value = amount > 0 ? Number(amount.toFixed(2)) : "";
});

els.saveCategoryBudgetBtn.addEventListener("click", () => {
  const monthKey = currentMonthKey();
  const category = els.categoryBudgetSelect.value;
  const amount = Number(els.categoryBudgetInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("请输入有效的类目预算金额");
    els.categoryBudgetInput.focus();
    return;
  }

  categoryBudgets[monthKey] = categoryBudgets[monthKey] || {};
  categoryBudgets[monthKey][category] = amount;
  saveCategoryBudgets();
  renderStats();
  showToast(`已保存${category}预算`);
});

els.categoryBudgetList.addEventListener("click", event => {
  const button = event.target.closest(".delete-category-budget-btn");
  if (!button) return;
  const monthKey = currentMonthKey();
  const category = button.dataset.category;
  if (!categoryBudgets[monthKey]?.[category]) {
    showToast(`${category}还没有设置预算`);
    return;
  }

  const confirmed = window.confirm(`确定要删除「${category}」的本月类目预算吗？删除后，该类目不再显示预算进度。`);
  if (!confirmed) return;

  delete categoryBudgets[monthKey][category];
  if (!Object.keys(categoryBudgets[monthKey]).length) delete categoryBudgets[monthKey];
  saveCategoryBudgets();
  renderStats();
  showToast(`已清除${category}预算`);
});

els.addRecurringBtn.addEventListener("click", () => {
  const item = normalizeRecurringExpense({
    name: els.recurringNameInput.value,
    amount: els.recurringAmountInput.value,
    category: els.recurringCategoryInput.value,
    tag: els.recurringTagInput.value,
    day: els.recurringDayInput.value,
    note: els.recurringNoteInput.value
  });

  if (!item) {
    showToast("请填写有效的固定支出名称、金额和日期");
    return;
  }

  recurringExpenses.push(item);
  saveRecurringExpenses();
  els.recurringNameInput.value = "";
  els.recurringAmountInput.value = "";
  els.recurringDayInput.value = "1";
  els.recurringNoteInput.value = "";
  els.recurringCategoryInput.value = "居家";
  els.recurringTagInput.value = "固定支出";
  showToast(`已保存固定支出：${item.name}`);
});

els.generateAllRecurringBtn.addEventListener("click", () => {
  const monthKey = currentMonthKey();
  const pendingItems = recurringExpenses.filter(item => !hasGeneratedRecurring(item, monthKey));
  if (!pendingItems.length) {
    showToast("本月固定支出都已经生成");
    return;
  }

  const total = pendingItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const confirmed = window.confirm(`确定生成本月未生成的 ${pendingItems.length} 项固定支出吗？\n合计：${money(total)}`);
  if (!confirmed) return;

  const newRecords = pendingItems.map(item => createRecurringRecord(item, monthKey));
  records.push(...newRecords);
  saveRecords();
  renderRecords();
  showToast(`已生成 ${newRecords.length} 笔固定支出账单`);
  showUndo({ type: "create", message: `已生成 ${newRecords.length} 笔固定支出账单`, records: newRecords });
});

els.recurringList.addEventListener("click", event => {
  const generateButton = event.target.closest(".generate-recurring-btn");
  const deleteButton = event.target.closest(".delete-recurring-btn");

  if (generateButton) {
    const item = recurringExpenses.find(expense => expense.id === generateButton.dataset.id);
    if (!item) return;
    const monthKey = currentMonthKey();
    if (hasGeneratedRecurring(item, monthKey)) {
      showToast(`${item.name}本月已经生成过账单`);
      return;
    }

    const confirmed = window.confirm(`确定生成「${item.name}」本月账单吗？\n日期：${recurringRecordDate(item.day, monthKey)}\n金额：${money(item.amount)}`);
    if (!confirmed) return;

    const record = createRecurringRecord(item, monthKey);
    records.push(record);
    saveRecords();
    renderRecords();
    showToast(`已生成${item.name}本月账单`);
    showUndo({ type: "create", message: `已生成 ${item.name} 账单`, records: [record] });
    return;
  }

  if (deleteButton) {
    const item = recurringExpenses.find(expense => expense.id === deleteButton.dataset.id);
    if (!item) return;
    const confirmed = window.confirm(`确定要删除固定支出「${item.name}」吗？已生成的历史账单不会被删除。`);
    if (!confirmed) return;

    recurringExpenses = recurringExpenses.filter(expense => expense.id !== item.id);
    saveRecurringExpenses();
    showToast(`已删除固定支出：${item.name}`);
  }
});

els.addSmartRuleBtn.addEventListener("click", () => {
  const keyword = els.smartKeywordInput.value.trim();
  const category = els.smartCategoryInput.value;
  if (keyword.length < 2) {
    showToast("请输入至少两个字的关键词");
    els.smartKeywordInput.focus();
    return;
  }

  userCategoryMemory = userCategoryMemory.filter(item => item.keyword !== keyword);
  userCategoryMemory.push({ keyword, category, source: "手动新增", updatedAt: new Date().toISOString() });
  saveUserCategoryMemory();
  els.smartKeywordInput.value = "";
  showToast(`已记住：${keyword} → ${category}`);
});

els.smartKeywordInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    els.addSmartRuleBtn.click();
  }
});

els.learningList.addEventListener("click", event => {
  const button = event.target.closest(".delete-learning-btn");
  if (!button) return;
  const index = Number(button.dataset.index);
  const target = userCategoryMemory[index];
  if (!target) return;
  const confirmed = window.confirm(`确定要删除学习规则「${target.keyword} → ${target.category}」吗？删除后，后续识别将不再沿用这条记忆。`);
  if (!confirmed) return;
  userCategoryMemory.splice(index, 1);
  saveUserCategoryMemory();
  showToast(`已删除：${target.keyword}`);
});

els.addCustomTagBtn.addEventListener("click", () => addCustomTag(els.customTagInput.value));
els.customTagInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomTag(els.customTagInput.value);
  }
});

els.tagSuggestions.addEventListener("click", event => {
  const button = event.target.closest(".tag-suggestion-btn");
  if (!button) return;
  addCustomTag(button.dataset.tag);
});

els.customTagList.addEventListener("click", event => {
  const button = event.target.closest(".delete-custom-tag-btn");
  if (!button) return;
  deleteCustomTag(button.dataset.tag);
});

els.periodFilter.addEventListener("change", resetPageAndRender);
els.categoryFilter.addEventListener("change", resetPageAndRender);
els.pageSizeSelect.addEventListener("change", resetPageAndRender);
els.tagFilter.addEventListener("change", resetPageAndRender);
els.searchInput.addEventListener("input", resetPageAndRender);
els.resetFiltersBtn.addEventListener("click", resetFilters);
els.toggleBulkModeBtn.addEventListener("click", toggleBulkMode);
els.selectFilteredBtn.addEventListener("click", selectFilteredRecords);
els.clearSelectionBtn.addEventListener("click", clearBulkSelection);
els.applyBulkCategoryBtn.addEventListener("click", () => applyBulkField("category", els.bulkCategorySelect.value));
els.applyBulkTagBtn.addEventListener("click", () => applyBulkField("tag", els.bulkTagSelect.value));
els.bulkDeleteBtn.addEventListener("click", deleteSelectedRecords);
els.categoryChart.addEventListener("click", event => {
  const trigger = event.target.closest('[data-filter-type="category"]');
  if (!trigger) return;
  const category = trigger.dataset.category;
  applyInsightFilter({
    category,
    message: `已筛选本月${category}账单`
  });
});

els.tagInsightSummary.addEventListener("click", event => {
  const trigger = event.target.closest('[data-filter-type="tag"]');
  if (!trigger) return;
  const tag = trigger.dataset.tag;
  applyInsightFilter({
    tag,
    message: `已筛选本月${tag}账单`
  });
});

els.tagChart.addEventListener("click", event => {
  const trigger = event.target.closest('[data-filter-type="tag"]');
  if (!trigger) return;
  const tag = trigger.dataset.tag;
  applyInsightFilter({
    tag,
    message: `已筛选本月${tag}账单`
  });
});

els.monthlyReport.addEventListener("click", event => {
  const trigger = event.target.closest('[data-filter-type="max"]');
  if (!trigger) return;
  const keyword = trigger.dataset.keyword || "";
  applyInsightFilter({
    keyword,
    message: "已定位本月最大单笔账单"
  });
});

els.exportCsvBtn.addEventListener("click", exportFilteredCsv);
els.importCsvBtn.addEventListener("click", () => els.importCsvInput.click());
els.importCsvInput.addEventListener("change", event => {
  importCsvFile(event.target.files?.[0]);
});
els.csvPreviewPanel.addEventListener("click", event => {
  if (event.target.closest("#cancelCsvImportBtn")) {
    pendingCsvImport = null;
    renderCsvPreview();
    showToast("已取消导入预览");
    return;
  }

  if (event.target.closest("#confirmCsvImportBtn")) {
    if (!pendingCsvImport) return;
    const nextRecords = pendingCsvImport.importableRecords.map(({ isDuplicate, ...record }) => record);
    if (!nextRecords.length) {
      showToast("没有可导入的非重复账单");
      return;
    }

    records = [...records, ...nextRecords];
    saveRecords();
    currentPage = 1;
    editingRecordId = null;
    const skippedDuplicates = pendingCsvImport.duplicateRecords.length;
    const skippedInvalid = pendingCsvImport.invalidCount;
    pendingCsvImport = null;
    renderCsvPreview();
    renderRecords();
    showToast(`已导入 ${nextRecords.length} 笔，跳过 ${skippedDuplicates + skippedInvalid} 行`);
  }
});
els.exportBackupBtn.addEventListener("click", exportBackupJson);
els.importBackupBtn.addEventListener("click", () => els.importBackupInput.click());
els.importBackupInput.addEventListener("change", event => {
  importBackupJson(event.target.files?.[0]);
});

els.prevPageBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  currentPage -= 1;
  renderRecords();
});

els.nextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderRecords();
});

els.undoBtn.addEventListener("click", () => {
  if (!pendingUndo) return;
  const action = pendingUndo;
  if (action.type === "create") {
    const undoIds = new Set(action.records.map(item => item.id));
    records = records.filter(item => !undoIds.has(item.id));
    saveRecords();
    renderRecords();
    showToast("已撤销刚才保存的账单");
  } else if (action.type === "edit") {
    const target = records.find(item => item.id === action.before.id);
    if (target) {
      target.amount = action.before.amount;
      target.category = action.before.category;
      target.date = action.before.date;
      target.tag = action.before.tag || "普通支出";
      target.note = action.before.note;
      saveRecords();
      renderRecords();
      showToast("已撤销修改");
    }
  } else if (action.type === "delete") {
    records.push(...action.records);
    saveRecords();
    renderRecords();
    showToast("已恢复刚才删除的账单");
  } else if (action.type === "bulkEdit") {
    action.before.forEach(before => {
      const target = records.find(record => record.id === before.id);
      if (!target) return;
      target.category = before.category;
      target.tag = before.tag || "普通支出";
    });
    saveRecords();
    renderRecords();
    showToast("已撤销批量修改");
  }
  els.undoBar.classList.remove("show");
  pendingUndo = null;
  window.clearTimeout(undoTimer);
});

els.voiceText.addEventListener("input", () => {
  els.speechStatus.textContent = els.voiceText.value.trim() ? "已输入" : "待输入";
});

function findPossibleDuplicate(target) {
  const noteKey = String(target.note || "").trim().toLowerCase();
  return records.find(item =>
    item.id !== target.id
    && item.date === target.date
    && Number(item.amount) === Number(target.amount)
    && String(item.note || "").trim().toLowerCase() === noteKey
  );
}

function notifyDuplicateOnEntry(newRecords) {
  const conflicts = newRecords
    .map(record => ({ record, dup: findPossibleDuplicate(record) }))
    .filter(item => item.dup);
  if (!conflicts.length) return;
  if (conflicts.length === 1) {
    const c = conflicts[0];
    showToast(`疑似重复：${c.record.date} ${money(c.record.amount)} ${c.record.note}`);
  } else {
    showToast(`本次保存有 ${conflicts.length} 笔疑似重复，可在数据健康检查中查看`);
  }
}

function runHealthCheck() {
  const issues = [];
  const seenKeys = new Map();
  const todayKey = today();
  const amounts = records.map(r => Number(r.amount) || 0).filter(v => v > 0).sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
  const abnormalThreshold = Math.max(median * 8, 2000);

  records.forEach(record => {
    const key = `${record.date}|${Number(record.amount)}|${String(record.note || "").trim().toLowerCase()}`;
    if (seenKeys.has(key)) {
      issues.push({
        type: "duplicate",
        recordId: record.id,
        peerId: seenKeys.get(key),
        title: "疑似重复账单",
        detail: `${record.date} · ${money(record.amount)} · ${record.note || "无备注"}`
      });
    } else {
      seenKeys.set(key, record.id);
    }

    if (record.date && record.date > todayKey) {
      issues.push({
        type: "future-date",
        recordId: record.id,
        title: "日期为未来",
        detail: `${record.date} · ${money(record.amount)} · ${record.note || "无备注"}`
      });
    }

    if (!String(record.note || "").trim() || record.note === "未填写备注") {
      issues.push({
        type: "empty-note",
        recordId: record.id,
        title: "备注为空",
        detail: `${record.date} · ${money(record.amount)} · ${record.category}`
      });
    }

    if (Number(record.amount) >= abnormalThreshold && abnormalThreshold > 0) {
      issues.push({
        type: "abnormal-amount",
        recordId: record.id,
        title: "金额异常偏大",
        detail: `${record.date} · ${money(record.amount)} · ${record.note || "无备注"}`
      });
    }
  });

  const usedTags = new Set(records.map(r => r.tag || "普通支出"));
  customTags.forEach(tag => {
    if (!usedTags.has(tag)) {
      issues.push({
        type: "unused-tag",
        tag,
        title: "未使用的自定义标签",
        detail: `标签「${tag}」尚未在任何账单中使用`
      });
    }
  });

  renderHealthIssues(issues);
}

function renderHealthIssues(issues) {
  els.healthIssues.innerHTML = "";
  els.dismissHealthBtn.hidden = false;

  if (!issues.length) {
    els.healthSummary.hidden = true;
    els.healthIssues.hidden = true;
    els.healthEmpty.hidden = false;
    els.healthStatus.textContent = "全部正常";
    return;
  }

  els.healthEmpty.hidden = true;
  const counts = issues.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const labels = {
    duplicate: "疑似重复",
    "future-date": "未来日期",
    "empty-note": "备注为空",
    "abnormal-amount": "金额异常",
    "unused-tag": "未使用标签"
  };
  els.healthSummary.hidden = false;
  els.healthSummary.innerHTML = Object.entries(counts)
    .map(([type, count]) => `<span class="health-chip health-chip-${type}">${labels[type] || type} · ${count}</span>`)
    .join("");
  els.healthStatus.textContent = `${issues.length} 项待处理`;

  els.healthIssues.hidden = false;
  els.healthIssues.innerHTML = issues.map((issue, index) => `
    <div class="health-item health-item-${issue.type}">
      <div class="health-item-main">
        <div class="health-item-title">${escapeHtml(issue.title)}</div>
        <div class="health-item-detail">${escapeHtml(issue.detail)}</div>
      </div>
      <div class="health-item-actions">
        ${issue.recordId ? `<button type="button" data-action="view" data-index="${index}">查看</button>` : ""}
        ${issue.type === "duplicate" ? `<button type="button" data-action="delete" data-index="${index}" class="health-danger">删除重复</button>` : ""}
        ${issue.type === "future-date" ? `<button type="button" data-action="fix-date" data-index="${index}">改为今天</button>` : ""}
        ${issue.type === "unused-tag" ? `<button type="button" data-action="delete-tag" data-index="${index}" class="health-danger">删除标签</button>` : ""}
      </div>
    </div>
  `).join("");

  els.healthIssues.dataset.cache = JSON.stringify(issues);
}

function handleHealthAction(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const issues = JSON.parse(els.healthIssues.dataset.cache || "[]");
  const issue = issues[Number(btn.dataset.index)];
  if (!issue) return;

  if (btn.dataset.action === "view" && issue.recordId) {
    const target = records.find(r => r.id === issue.recordId);
    if (!target) return showToast("该账单已被删除");
    applyInsightFilter({
      category: "all",
      tag: "all",
      keyword: target.note || String(target.amount),
      message: "已跳转到对应账单"
    });
    return;
  }

  if (btn.dataset.action === "delete" && issue.recordId) {
    if (!confirm("确定删除这条疑似重复账单吗？")) return;
    const removed = records.find(r => r.id === issue.recordId);
    records = records.filter(r => r.id !== issue.recordId);
    saveRecords();
    renderRecords();
    if (removed) showUndo({ type: "delete", message: "已删除疑似重复账单", records: [removed] });
    runHealthCheck();
    showToast("已删除疑似重复账单");
    return;
  }

  if (btn.dataset.action === "fix-date" && issue.recordId) {
    const target = records.find(r => r.id === issue.recordId);
    if (!target) return;
    target.date = today();
    saveRecords();
    renderRecords();
    runHealthCheck();
    showToast("日期已改为今天");
    return;
  }

  if (btn.dataset.action === "delete-tag" && issue.tag) {
    if (!confirm(`确定删除自定义标签「${issue.tag}」吗？`)) return;
    customTags = customTags.filter(t => t !== issue.tag);
    syncTagControls();
    renderTagSettings();
    runHealthCheck();
    showToast("已删除未使用标签");
  }
}

els.runHealthCheckBtn.addEventListener("click", () => {
  runHealthCheck();
});

els.dismissHealthBtn.addEventListener("click", () => {
  els.healthSummary.hidden = true;
  els.healthIssues.hidden = true;
  els.healthEmpty.hidden = true;
  els.dismissHealthBtn.hidden = true;
  els.healthStatus.textContent = "未扫描";
});

els.healthIssues.addEventListener("click", handleHealthAction);

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetTab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(panel => {
      const isTarget = panel.dataset.panel === targetTab;
      panel.classList.toggle("active", isTarget);
      panel.hidden = !isTarget;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

const helpModal = document.querySelector("#helpModal");
const helpBtn = document.querySelector("#helpBtn");
const helpCloseBtn = document.querySelector("#helpCloseBtn");

helpBtn.addEventListener("click", () => {
  helpModal.hidden = false;
  document.body.style.overflow = "hidden";
});

function closeHelpModal() {
  helpModal.hidden = true;
  document.body.style.overflow = "";
}

helpCloseBtn.addEventListener("click", closeHelpModal);

helpModal.addEventListener("click", event => {
  if (event.target.closest(".help-modal-content")) return;
  closeHelpModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !helpModal.hidden) closeHelpModal();
});

els.dateInput.value = today();
syncTagControls();
renderTagSettings();
fillPreview({ amount: "", category: "其他", date: today(), note: "" });
setupSpeech();
renderRecords();
