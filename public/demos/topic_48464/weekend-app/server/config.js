/**
 * 服务配置（运行时可修改）
 * 初始值从环境变量读取；运行时可通过 /api/config 接口动态更新并落盘到 data/config.json。
 * 未配置 LLM 时使用规则引擎生成，接入 Key 即用真实大模型。
 */
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// 默认配置（环境变量优先）
function defaultConfig() {
  return {
    port: process.env.PORT || 3000,
    adminToken: process.env.ADMIN_TOKEN || '',
    llm: {
      apiKey: process.env.LLM_API_KEY || '',
      apiBase: process.env.LLM_API_BASE || 'https://api.openai.com/v1',
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      timeoutMs: (() => { const v = Number(process.env.LLM_TIMEOUT_MS); return !isNaN(v) && v > 0 ? v : 60000; })(),
      maxRetries: 1
    },
    cache: {
      enabled: true,
      ttlMs: 30 * 60 * 1000
    },
    weather: {
      enabled: true,
      rainThreshold: 60
    },
    analytics: {
      enabled: true
    },
    demo: {
      offlineMode: process.env.DEMO_OFFLINE === 'true'
    }
  };
}

// apiBase 白名单（允许的 LLM API 域名，防止 SSRF）
const ALLOWED_API_DOMAINS = [
  'api.openai.com',
  'api.deepseek.com',
  'api.moonshot.cn',
  'dashscope.aliyuncs.com',
  'open.bigmodel.cn',
  'api.anthropic.com'
];

/**
 * 校验 apiBase 是否为合法的 LLM API 地址（防止 SSRF）
 */
function isValidApiBase(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    // 禁止访问内网/本地地址
    const hostname = u.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.16.') || hostname.startsWith('172.17.') || hostname.startsWith('172.18.') || hostname.startsWith('172.19.') || hostname.startsWith('172.2') || hostname.startsWith('172.30.') || hostname.startsWith('172.31.')) return false;
    if (hostname === '169.254.169.254') return false; // 云元数据
    // 允许已知的 LLM 域名或通用 HTTPS 域名（宽松策略：只要不是内网IP即可）
    return true;
  } catch {
    return false;
  }
}

// 当前生效配置（可变对象，运行时修改即生效）
let current = defaultConfig();

// 仅这些字段允许持久化/被用户配置覆盖（技术参数 timeoutMs/maxRetries 不持久化）
const PERSIST_FIELDS = ['apiKey', 'apiBase', 'model'];

// 启动时从落盘文件恢复用户保存的配置（覆盖默认值）
function loadPersisted() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      if (saved && saved.llm) {
        // 仅覆盖用户可配置字段，技术参数保持默认值
        PERSIST_FIELDS.forEach(k => {
          if (saved.llm[k] !== undefined) current.llm[k] = saved.llm[k];
        });
      }
    }
  } catch (e) {
    console.warn('[Config] 恢复持久化配置失败:', e.message);
  }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    // 只持久化用户可配置字段，不含技术参数
    const toSave = {};
    PERSIST_FIELDS.forEach(k => { toSave[k] = current.llm[k]; });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ llm: toSave }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Config] 落盘失败:', e.message);
  }
}

// 模块加载时恢复
loadPersisted();

/**
 * 更新 LLM 配置（运行时生效 + 落盘）
 */
function updateLLM({ apiKey, apiBase, model }) {
  if (typeof apiKey === 'string') current.llm.apiKey = apiKey.trim();
  if (typeof apiBase === 'string' && apiBase.trim()) {
    const base = apiBase.trim();
    if (!isValidApiBase(base)) {
      throw new Error('无效的 API 地址：仅允许 HTTPS 公网地址，禁止内网/本地地址');
    }
    current.llm.apiBase = base;
  }
  if (typeof model === 'string' && model.trim()) current.llm.model = model.trim();
  persist();
  return getLLMStatus();
}

/**
 * 获取 LLM 配置状态（脱敏，只显示 Key 后4位）
 */
function getLLMStatus() {
  const key = current.llm.apiKey;
  return {
    connected: !!key,
    apiKey: key ? '••••••' + key.slice(-4) : '',
    apiBase: current.llm.apiBase,
    model: current.llm.model,
    source: key ? '大模型' : '规则引擎'
  };
}

module.exports = current;
module.exports.updateLLM = updateLLM;
module.exports.getLLMStatus = getLLMStatus;
module.exports.persist = persist;
module.exports.isValidApiBase = isValidApiBase;
