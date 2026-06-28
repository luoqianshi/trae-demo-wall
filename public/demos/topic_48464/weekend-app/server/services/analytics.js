/**
 * 埋点服务 (WI-1.4)
 * 轻量事件收集：生成 / 采纳 / 分享。内存存储 + 定期落盘 JSON。
 * 支撑北极星指标：方案生成量、方案采纳率、分享传播率。
 */
const fs = require('fs');
const path = require('path');

const events = [];
const METRICS_FILE = path.join(__dirname, '..', 'data', 'metrics.json');
const MAX_EVENTS = 5000;

// 允许的事件属性白名单（防止伪造覆盖内部字段）
const ALLOWED_PROPS = ['city', 'budget', 'weather', 'mood', 'companion', 'source', 'latency_ms', 'plan_name', 'activity_index'];

// 启动时从磁盘恢复历史数据
try {
  if (fs.existsSync(METRICS_FILE)) {
    const raw = fs.readFileSync(METRICS_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) events.push(...saved.slice(-MAX_EVENTS));
  }
} catch (e) {
  console.warn('[Analytics] 恢复历史埋点失败:', e.message);
}

let flushTimer = null;
let flushPending = false;

function doFlush() {
  flushPending = false;
  try {
    fs.mkdirSync(path.dirname(METRICS_FILE), { recursive: true });
    fs.writeFileSync(METRICS_FILE, JSON.stringify(events.slice(-MAX_EVENTS)), 'utf-8');
  } catch (e) {
    console.warn('[Analytics] 落盘失败:', e.message);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushPending = true;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    doFlush();
  }, 5000);
  // 允许进程退出时不等待定时器
  if (flushTimer.unref) flushTimer.unref();
}

/**
 * 立即将内存事件落盘（用于优雅关闭）
 */
function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (flushPending) doFlush();
}

/**
 * 记录事件
 * @param {string} type - generate / adopt / share / replace / favorite / unfavorite
 * @param {object} props - 事件属性
 */
function track(type, props = {}) {
  // 白名单过滤 props，防止覆盖 type/ts 或注入任意字段
  const safeProps = {};
  for (const key of ALLOWED_PROPS) {
    if (props[key] !== undefined) safeProps[key] = props[key];
  }
  const event = {
    ...safeProps,
    type,
    ts: Date.now()
  };
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  scheduleFlush();
}

/**
 * 获取指标汇总
 */
function getMetrics() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  // 使用 UTC+8 时区计算"今日"起始
  const now8 = new Date(Date.now() + 8 * 3600 * 1000);
  const todayStart = new Date(now8.toISOString().slice(0, 10) + 'T00:00:00+08:00').getTime();

  const generateEvents = events.filter(e => e.type === 'generate');
  const adoptEvents = events.filter(e => e.type === 'adopt');
  const shareEvents = events.filter(e => e.type === 'share');

  const todayGenerate = generateEvents.filter(e => e.ts >= todayStart);
  const todayAdopt = adoptEvents.filter(e => e.ts >= todayStart);
  const todayShare = shareEvents.filter(e => e.ts >= todayStart);

  // 城市分布
  const cityDist = {};
  for (const e of generateEvents) {
    if (e.city) cityDist[e.city] = (cityDist[e.city] || 0) + 1;
  }

  // 采纳率 = 采纳事件 / 生成事件
  const adoptRate = generateEvents.length > 0
    ? Math.round((adoptEvents.length / generateEvents.length) * 100)
    : 0;

  // 分享率
  const shareRate = generateEvents.length > 0
    ? Math.round((shareEvents.length / generateEvents.length) * 100)
    : 0;

  return {
    total: {
      generate: generateEvents.length,
      adopt: adoptEvents.length,
      share: shareEvents.length
    },
    today: {
      generate: todayGenerate.length,
      adopt: todayAdopt.length,
      share: todayShare.length
    },
    rates: {
      adopt_rate: adoptRate,
      share_rate: shareRate
    },
    city_distribution: cityDist,
    event_count: events.length
  };
}

module.exports = { track, getMetrics, flush };
