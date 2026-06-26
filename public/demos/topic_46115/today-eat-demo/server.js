import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'app.sqlite');
const LEGACY_JSON_PATH = path.join(DATA_DIR, 'db.json');
let SQL_PROMISE;

const PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-pro']
  },
  doubao: {
    label: '豆包',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    models: ['doubao-1-5-pro-32k-250115', 'doubao-1-5-lite-32k-250115']
  },
  glm: {
    label: 'GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air']
  },
  kimi: {
    label: 'Kimi',
    baseURL: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  qwen: {
    label: '千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max']
  },
  chatgpt: {
    label: 'ChatGPT',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini']
  }
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getSql() {
  if (!SQL_PROMISE) SQL_PROMISE = initSqlJs();
  return SQL_PROMISE;
}

async function openDatabase() {
  const SQL = await getSql();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = fs.existsSync(SQLITE_PATH)
    ? new SQL.Database(fs.readFileSync(SQLITE_PATH))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS choices (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      source TEXT,
      name TEXT NOT NULL,
      category TEXT,
      takeout_keyword TEXT,
      reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      result_json TEXT,
      raw TEXT
    );
  `);

  migrateLegacyJsonIfNeeded(db);
  persistDatabase(db);
  return db;
}

function persistDatabase(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const data = db.export();
  fs.writeFileSync(SQLITE_PATH, Buffer.from(data));
}

function queryRows(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) result.push(stmt.getAsObject());
  stmt.free();
  return result;
}

function runSql(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
}

function getCount(db, tableName) {
  const rows = queryRows(db, `SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(rows[0]?.count || 0);
}

function migrateLegacyJsonIfNeeded(db) {
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;
  if (getCount(db, 'choices') > 0 || getCount(db, 'conversations') > 0) return;

  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf-8'));
    const choices = Array.isArray(legacy.choices) ? legacy.choices : [];
    const conversations = Array.isArray(legacy.conversations) ? legacy.conversations : [];

    choices.forEach((item) => {
      runSql(db, `
        INSERT OR IGNORE INTO choices
        (id, conversation_id, source, name, category, takeout_keyword, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id || makeId('choice'),
        item.conversationId || null,
        item.source || '推荐结果',
        item.name || '未知菜品',
        item.category || '',
        item.takeoutKeyword || item.name || '',
        item.reason || '',
        item.createdAt || new Date().toISOString()
      ]);
    });

    conversations.forEach((item) => {
      runSql(db, `
        INSERT OR IGNORE INTO conversations
        (id, created_at, profile_json, result_json, raw)
        VALUES (?, ?, ?, ?, ?)
      `, [
        item.id || makeId('chat'),
        item.createdAt || new Date().toISOString(),
        JSON.stringify(item.profile || {}),
        item.result ? JSON.stringify(item.result) : null,
        item.raw || null
      ]);
    });
  } catch {
    // 旧 JSON 损坏时跳过迁移，不影响 SQLite 正常启动。
  }
}

function mapChoice(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    source: row.source,
    name: row.name,
    category: row.category,
    takeoutKeyword: row.takeout_keyword,
    reason: row.reason,
    createdAt: row.created_at
  };
}

function mapConversation(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    profile: JSON.parse(row.profile_json || '{}'),
    result: row.result_json ? JSON.parse(row.result_json) : null,
    raw: row.raw || null
  };
}

async function getHistory(limit = 20) {
  const db = await openDatabase();
  try {
    const choiceRows = queryRows(db, `
      SELECT * FROM choices
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);

    const conversationRows = queryRows(db, `
      SELECT * FROM conversations
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);

    return {
      choices: choiceRows.map(mapChoice),
      conversations: conversationRows.map(mapConversation)
    };
  } finally {
    db.close();
  }
}

async function insertChoice(record) {
  const db = await openDatabase();
  try {
    runSql(db, `
      INSERT INTO choices
      (id, conversation_id, source, name, category, takeout_keyword, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id,
      record.conversationId,
      record.source,
      record.name,
      record.category,
      record.takeoutKeyword,
      record.reason,
      record.createdAt
    ]);
    persistDatabase(db);
  } finally {
    db.close();
  }
}

async function insertConversation(record) {
  const db = await openDatabase();
  try {
    runSql(db, `
      INSERT INTO conversations
      (id, created_at, profile_json, result_json, raw)
      VALUES (?, ?, ?, ?, ?)
    `, [
      record.id,
      record.createdAt,
      JSON.stringify(record.profile || {}),
      record.result ? JSON.stringify(record.result) : null,
      record.raw || null
    ]);
    persistDatabase(db);
  } finally {
    db.close();
  }
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatProfileValue(value, fallback = '未说明') {
  if (Array.isArray(value)) return value.length ? value.join('、') : fallback;
  return value || fallback;
}

function summarizeMemory(db) {
  const recentChoices = db.choices.filter((item) => item.source !== '不想吃').slice(0, 8);
  const recentDislikes = db.choices.filter((item) => item.source === '不想吃').slice(0, 8);
  const recentQuestions = db.conversations.slice(0, 5);

  return `
最近用户实际选择过的菜品：
${recentChoices.length ? recentChoices.map((item, index) => `${index + 1}. ${item.name}（${item.category || '未分类'}，来源：${item.source || '推荐结果'}，时间：${item.createdAt}）`).join('\n') : '暂无'}

最近用户明确不想吃的菜品：
${recentDislikes.length ? recentDislikes.map((item, index) => `${index + 1}. ${item.name}（${item.category || '未分类'}，时间：${item.createdAt}）`).join('\n') : '暂无'}

最近用户提问/状态记录：
${recentQuestions.length ? recentQuestions.map((item, index) => `${index + 1}. ${item.profile?.mealTime || '未知餐次'}，上一顿：${item.profile?.lastMeal || '未说明'}，目标：${formatProfileValue(item.profile?.goal)}，口味：${item.profile?.taste || '未说明'}，补充：${item.profile?.mood || '无'}`).join('\n') : '暂无'}

请结合这些历史记录做个人化推荐：
- 用户最近连续选择过的同类餐食，不要重复推荐太多。
- 用户多次选择过的口味、餐食形态，可以适度提高权重。
- 用户明确点过“不想吃”的菜品或同类餐食，本次尽量避开，除非当前状态强烈适合。
- 如果历史记录和当前状态冲突，以当前状态优先。
`;
}

function normalizeAiConfig(aiConfig = {}) {
  const providerKey = PROVIDERS[aiConfig.provider] ? aiConfig.provider : 'deepseek';
  const provider = PROVIDERS[providerKey];
  const model = provider.models.includes(aiConfig.model) ? aiConfig.model : provider.models[0];
  const apiKey = String(aiConfig.apiKey || '').trim();

  return {
    providerKey,
    provider,
    model,
    apiKey
  };
}

async function callChatModel({ aiConfig, messages, temperature = 0.7, jsonMode = false }) {
  const config = normalizeAiConfig(aiConfig);
  if (!config.apiKey) {
    const error = new Error('没有输入 API Key。');
    error.code = 'NO_API_KEY';
    throw error;
  }

  const body = {
    model: config.model,
    messages,
    temperature
  };

  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await fetch(config.provider.baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.error?.message || `${config.provider.label} 请求失败`);
    error.status = response.status;
    error.detail = data;
    throw error;
  }

  return data?.choices?.[0]?.message?.content || '';
}

function createDemoRecommendation(profile, history) {
  const recentNames = new Set(history.choices.slice(0, 5).map((item) => item.name));
  const presets = [
    {
      summary: '演示模式：今天适合吃一顿清爽、有饱腹感但不太油的组合。',
      basisTags: ['天气偏热', '上一顿偏油', '目标偏清淡', '避免重复米饭类'],
      primary: {
        name: '清汤麻辣烫自选',
        category: '麻辣烫自选',
        reason: `结合你当前的${formatProfileValue(profile.goal, '饮食目标')}、${profile.weather || '天气状态'}和上一顿“${profile.lastMeal || '未说明'}”，清汤底能保留满足感，同时更好控制油盐。`,
        howToOrder: '选择清汤或番茄汤底，搭配绿叶菜、豆制品、菌菇和一份牛肉或鸡肉，少选丸子和油炸类。',
        healthNote: '如果正在减脂，可以少放酱料，把主食控制在半份到一份。',
        takeoutKeyword: '清汤麻辣烫'
      },
      alternatives: [
        {
          name: '鸡肉卷饼配无糖茶',
          category: '卷饼',
          reason: '适合时间紧、想吃得方便的时候，比重油套餐更轻，也比单纯沙拉更有饱腹感。',
          takeoutKeyword: '鸡肉卷饼'
        },
        {
          name: '虾仁云吞汤配青菜',
          category: '汤食',
          reason: '如果今天胃口一般或天气偏闷，热汤类更舒服，也能避开连续吃饭或面。',
          takeoutKeyword: '虾仁云吞汤'
        }
      ],
      avoid: '这顿先少吃炸鸡、奶茶和重油拌饭，容易和当前目标冲突，也可能让下午犯困。',
      whyNot: [
        '没有推荐炸鸡：上一顿已经偏油，且当前目标更适合清爽一点。',
        '没有推荐拌饭：如果最近米饭类偏多，这顿换成自选汤食更不容易重复。',
        '没有推荐奶茶甜品：和控油、控糖或下午不犯困的需求不太匹配。'
      ],
      adjustments: ['想更便宜：把肉类换成鸡蛋或豆制品', '想更清淡：选择清汤底并少放酱', '想更满足：增加一份蛋白质，不额外加油炸小吃']
    },
    {
      summary: '演示模式：这顿推荐换个口味，避免总在饭和面之间打转。',
      basisTags: ['想换口味', '避开饭面重复', '需要饱腹感', '预算友好'],
      primary: {
        name: '番茄牛腩砂锅配青菜',
        category: '砂锅',
        reason: `根据你输入的预算、饥饿程度和口味偏好，砂锅类比普通盖饭更有变化，番茄汤底也更适合想吃热乎但不想太油的时候。`,
        howToOrder: '点番茄汤底，牛腩正常份，额外加青菜或菌菇，米饭按半份到一份选择。',
        healthNote: '砂锅汤底可能含盐偏高，汤不用全部喝完。',
        takeoutKeyword: '番茄牛腩砂锅'
      },
      alternatives: [
        {
          name: '越南鲜虾春卷套餐',
          category: '东南亚简餐',
          reason: '清爽、口味有变化，适合想探索新口味但又不想吃太重的时候。',
          takeoutKeyword: '越南春卷'
        },
        {
          name: '皮蛋瘦肉粥配小菜',
          category: '粥',
          reason: '适合胃口不强或想吃软一点的时候，比重口外卖更容易消化。',
          takeoutKeyword: '皮蛋瘦肉粥'
        }
      ],
      avoid: '如果上一顿已经吃了重口味或油炸类，这顿不建议继续点炸物套餐。',
      whyNot: [
        '没有推荐普通盖饭：和饭类重复概率高，变化感不足。',
        '没有推荐干拌面：如果天气热或口渴，汤底类会更舒服。',
        '没有推荐高油小炒：容易超出清淡或不犯困的目标。'
      ],
      adjustments: ['想更省钱：选粥或卷饼类', '想更高蛋白：加牛肉、鸡肉或虾仁', '想换口味：优先搜东南亚简餐或砂锅']
    }
  ];

  const picked = presets.find((item) => !recentNames.has(item.primary.name)) || presets[0];
  return {
    demoMode: true,
    ...picked
  };
}

function buildPrompt(profile, memory) {
  return `
你是“今天吃什么！”AI 饮食推荐助手。
请根据用户当前状态，推荐这一顿适合吃什么。不要随机推荐，要解释原因。
推荐需要有“花样感”，不要默认只推荐盖饭、拌饭、面条。除非用户明确只想吃饭或面，否则请主动从不同餐食形态中挑选，例如：汤粉/米粉、馄饨/饺子、麻辣烫自选、轻食沙拉、卷饼、三明治、粥、砂锅、冒菜、寿司、韩式/日式/东南亚简餐、地方小炒、家常套餐、小吃组合、便利店组合餐。
主推荐和两个备选必须尽量属于不同形态；如果上一顿已经吃过饭或面，这一顿优先避开同类主食形态。

个人历史记忆：
${memory}

用户状态：
- 当前餐次：${profile.mealTime || '未说明'}
- 城市/位置：${profile.location || '未说明'}
- 天气/温度：${profile.weather || '未说明'}
- 上一顿吃了什么：${profile.lastMeal || '未说明'}
- 饮食目标：${formatProfileValue(profile.goal)}
- 口味偏好：${profile.taste || '未说明'}
- 忌口/过敏：${profile.restrictions || '无'}
- 预算：${profile.budget || '未说明'}
- 时间限制：${profile.timeLimit || '未说明'}
- 饥饿程度：${profile.hunger || '未说明'}
- 当前心情/补充：${profile.mood || '未说明'}

请严格返回 JSON，不要输出 Markdown，不要输出多余解释。JSON 结构如下：
{
  "summary": "一句话总结今天推荐方向",
  "basisTags": ["本次推荐依据标签 1", "本次推荐依据标签 2", "本次推荐依据标签 3"],
  "primary": {
    "name": "最推荐吃什么",
    "category": "餐食形态，例如：汤粉、卷饼、麻辣烫、粥、地方小炒、轻食等",
    "reason": "推荐理由，结合至少 3 个用户参数",
    "howToOrder": "如果是外卖/食堂/餐厅，建议怎么点；如果在家做，建议怎么做",
    "healthNote": "健康或营养提醒",
    "takeoutKeyword": "适合在外卖平台搜索的关键词，尽量短，例如：番茄牛肉饭"
  },
  "alternatives": [
    {
      "name": "备选 1",
      "category": "餐食形态",
      "reason": "为什么也适合",
      "takeoutKeyword": "适合在外卖平台搜索的关键词"
    },
    {
      "name": "备选 2",
      "category": "餐食形态",
      "reason": "为什么也适合",
      "takeoutKeyword": "适合在外卖平台搜索的关键词"
    }
  ],
  "avoid": "这一顿不太建议吃什么，以及原因",
  "whyNot": ["为什么没有推荐某类常见选择 1", "为什么没有推荐某类常见选择 2", "为什么没有推荐某类常见选择 3"],
  "adjustments": ["如果想更便宜可以怎么调", "如果想更清淡可以怎么调", "如果想更有满足感可以怎么调"]
}
`;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: 'demo-ready',
    providers: Object.entries(PROVIDERS).map(([key, value]) => ({
      key,
      label: value.label,
      models: value.models
    })),
    storage: 'SQLite',
    database: 'data/app.sqlite'
  });
});

app.post('/api/validate-key', async (req, res) => {
  const { aiConfig } = req.body || {};
  const config = normalizeAiConfig(aiConfig);

  if (!config.apiKey) {
    return res.json({
      ok: true,
      demoMode: true,
      message: '未输入 Key，当前会使用演示模式。'
    });
  }

  try {
    await callChatModel({
      aiConfig,
      messages: [
        { role: 'system', content: '你只需要回复 OK。' },
        { role: 'user', content: '请回复 OK，用于连通性测试。' }
      ],
      temperature: 0
    });

    res.json({
      ok: true,
      demoMode: false,
      provider: config.provider.label,
      model: config.model,
      message: `${config.provider.label} 已连通。`
    });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      message: '验证失败，请检查 Key、模型或平台权限。',
      detail: error.message
    });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    res.json(await getHistory(20));
  } catch (error) {
    res.status(500).json({
      error: '读取 SQLite 历史记录失败。',
      detail: error.message
    });
  }
});

app.post('/api/select', async (req, res) => {
  const { dish, source, conversationId } = req.body || {};

  if (!dish?.name) {
    return res.status(400).json({ error: '缺少要记录的菜品名称。' });
  }

  const record = {
    id: makeId('choice'),
    conversationId: conversationId || null,
    source: source || '推荐结果',
    name: dish.name,
    category: dish.category || '',
    takeoutKeyword: dish.takeoutKeyword || dish.name,
    reason: dish.reason || '',
    createdAt: new Date().toISOString()
  };

  try {
    await insertChoice(record);
    const history = await getHistory(20);
    res.json({
      ok: true,
      choice: record,
      choices: history.choices
    });
  } catch (error) {
    res.status(500).json({
      error: '保存选择记录失败。',
      detail: error.message
    });
  }
});

app.post('/api/recommend', async (req, res) => {
  const profile = req.body?.profile || req.body || {};
  const aiConfig = req.body?.aiConfig || {};
  const history = await getHistory(20);
  const prompt = buildPrompt(profile, summarizeMemory(history));
  const normalizedConfig = normalizeAiConfig(aiConfig);

  if (!normalizedConfig.apiKey) {
    const demoResult = createDemoRecommendation(profile, history);
    const conversationRecord = {
      id: makeId('chat'),
      createdAt: new Date().toISOString(),
      profile,
      result: demoResult
    };

    await insertConversation(conversationRecord);

    return res.json({
      conversationId: conversationRecord.id,
      ...demoResult
    });
  }

  try {
    const content = await callChatModel({
      aiConfig,
      messages: [
        {
          role: 'system',
          content: '你是一个细心、克制、可信的中文 AI 饮食推荐助手。推荐必须基于用户参数，不要编造医疗结论。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      jsonMode: true
    });

    const parsed = safeParseJson(content);

    if (!parsed) {
      const fallbackRecord = {
        id: makeId('chat'),
        createdAt: new Date().toISOString(),
        profile,
        result: null,
        raw: content
      };
      await insertConversation(fallbackRecord);

      return res.json({
        conversationId: fallbackRecord.id,
        summary: 'AI 已返回结果，但格式不是标准 JSON。',
        raw: content
      });
    }

    const conversationRecord = {
      id: makeId('chat'),
      createdAt: new Date().toISOString(),
      profile,
      result: parsed
    };

    await insertConversation(conversationRecord);

    res.json({
      conversationId: conversationRecord.id,
      demoMode: false,
      ...parsed
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: '模型请求失败，请检查 Key、模型或平台权限。',
      detail: error.message,
      provider: normalizedConfig.provider.label,
      model: normalizedConfig.model
    });
  }
});

app.listen(PORT, () => {
  console.log(`今天吃什么 Demo 已启动：http://localhost:${PORT}`);
});
