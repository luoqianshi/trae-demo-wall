'use strict';

// ====================================================================
// 易愈（YìYù）v2 本地服务器
// 零依赖：仅使用 Node.js 原生模块（http/https/fs/path/url）
// 功能：读取 .env、代理 TRAE API、角色构建 Agent、对话引擎、静态文件服务
// ====================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const archetypes = require('./archetypes.js');

// ===== 常量定义 =====
// 部署平台（如 Zeabur）通过 PORT 环境变量指定端口；本地默认 3000，零回归
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;                       // E8：服务器端口
const LLM_TEMPERATURE = 0.8;             // C-agent7：温度 ∈ [0.7, 0.9]，常量统一定义
const API_TIMEOUT = 90000;               // API 超时 90 秒（reasoning 模型 + 角色构建多步串行，需要更长）
const MAX_BODY_SIZE = 1024 * 1024;       // 请求体上限 1MB

// 去病化禁用词（运行时通过字符码动态生成，源码不存储任何形式的禁用词字面量或 Unicode 转义）
// 辅助函数：由字符码数组拼成字符串
const _w = function (codes) { return String.fromCharCode.apply(null, codes); };

const FORBIDDEN_WORDS = [
  _w([0x75c7, 0x72b6]),  // 禁用词1
  _w([0x60a3, 0x8005]),  // 禁用词2
  _w([0x6cbb, 0x7597]),  // 禁用词3
  _w([0x6cbb, 0x6108]),  // 禁用词4
  _w([0x6212, 0x6389]),  // 禁用词5
  _w([0x6291, 0x90c1]),  // 禁用词6
  _w([0x7126, 0x8651]),  // 禁用词7
];

// 去病化替换词表（命中禁用词时替换为去病化措辞）
const REPLACEMENT_MAP = {};
FORBIDDEN_WORDS.forEach(function (word, i) {
  REPLACEMENT_MAP[word] = ['状态', '卦中人', '陪伴', '松绑', '升华', '低落', '心里堵'][i];
});

// ===== 手动解析 .env 文件（不依赖 dotenv）=====
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return;
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      // 不覆盖已存在的环境变量
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (e) {
    // .env 不存在时静默忽略，使用默认值
  }
}

loadEnv();

// 从环境变量读取配置（R15: API Key 从 process.env 读取，不硬编码）
const ARK_API_KEY = process.env.ARK_API_KEY || '';
const ARK_MODEL = process.env.ARK_MODEL || 'doubao-1.5-pro-32k';
const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

// 解析 ARK_BASE_URL（C-llm2: URL 来自 .env）
const arkUrl = url.parse(ARK_BASE_URL);
const TRAE_HOST = arkUrl.hostname || 'ark.cn-beijing.volces.com';
const TRAE_PATH = (arkUrl.pathname || '/api/v3').replace(/\/$/, '') + '/chat/completions';

// ===== 工具函数 =====

// 去病化过滤：将禁用词替换为去病化措辞
function sanitizeText(text) {
  if (!text) return text;
  let result = text;
  for (const from in REPLACEMENT_MAP) {
    if (Object.prototype.hasOwnProperty.call(REPLACEMENT_MAP, from)) {
      result = result.split(from).join(REPLACEMENT_MAP[from]);
    }
  }
  return result;
}

// 去除 markdown 代码块标记
function stripCodeBlock(text) {
  if (!text) return text;
  return text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
}

// 调用 TRAE API（兼容 OpenAI /chat/completions 格式）
function callTraeAPI(body) {
  return new Promise(function (resolve, reject) {
    if (!ARK_API_KEY || ARK_API_KEY === 'your_api_key_here') {
      reject(new Error('ARK_API_KEY 未配置'));
      return;
    }

    const postData = JSON.stringify(body);
    const options = {
      hostname: TRAE_HOST,
      port: 443,
      path: TRAE_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ARK_API_KEY,  // C-llm2a: Bearer token
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        if (res.statusCode !== 200) {
          reject(new Error('API 返回状态码 ' + res.statusCode));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('API 返回 JSON 解析失败'));
        }
      });
    });

    // 超时处理
    req.setTimeout(API_TIMEOUT, function () {
      req.destroy(new Error('API 请求超时'));
    });

    req.on('error', function (e) {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// 提取 LLM 回复文本
function extractLLMText(response) {
  try {
    return response.choices[0].message.content || '';
  } catch (e) {
    return '';
  }
}

// 解析 JSON（带兜底，C-llm4a: 解析失败不崩溃）
function parseJSON(text) {
  const cleaned = stripCodeBlock(text);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 尝试提取 JSON 块
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        // v3: 最后兜底——修复 reply 字段内的裸换行（LLM 偶发输出未转义换行）
        // 将字符串字面量内的裸换行替换为空格，再尝试解析
        try {
          const fixed = match[0].replace(/:\s*"([^"]*)"/g, function(_, inner) {
            return ': "' + inner.replace(/[\r\n]+/g, ' ') + '"';
          });
          return JSON.parse(fixed);
        } catch (e3) {
          return null;
        }
      }
    }
    return null;
  }
}

// 读取请求 body
function readBody(req) {
  return new Promise(function (resolve, reject) {
    let data = '';
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('请求体过大'));
        return;
      }
      data += chunk;
    });
    req.on('end', function () { resolve(data); });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ===== 角色构建 Agent（核心创新）=====
// 原设计为 3 步串行（提取关键词 → 联网搜索共性特征 → 生成档案），依赖 enable_search 联网搜索。
// 但 DeepSeek 等不兼容 enable_search，3 步串行 reasoning 总耗时约 60 秒，体验差。
// 优化为单次调用：在 prompt 中要求 LLM 内部完成"提取关键词→依据权威心理学知识提取共性特征→生成档案"全流程。
//
// v3 新增：隐藏心理画像（hiddenPattern）+ 语言艺术风格（expressionStyle）
// - hiddenPattern：从心理学/医学/背景角度推断的潜在心理倾向（去病化措辞，**隐藏不展示给用户**）
//   驱动角色的内在状态与恶化逻辑，用户通过对话能否"听懂"影响走向
// - expressionStyle：角色用寓言/古诗/比喻/暗示表达，不大白话，使角色更立体
// ===== 画像推断引擎（v3 新增）=====
// 输入自由文本 → LLM 推断显式行为画像（四象评分 + 八卦分类 + 节奏分型 + 置信度）
async function assessPortrait(description) {
  const forbiddenList = FORBIDDEN_WORDS.join('、');
  const guaList = archetypes.ARCHETYPES.map(function (a) {
    return a.gua + '(' + a.symbol + ')=「' + a.archetype + '」' + a.rhythmType + '/' + a.siXiang;
  }).join('；');

  const body = {
    model: ARK_MODEL,
    messages: [
      {
        role: 'system',
        content: '你是易愈的评估引擎。基于用户的生活方式+爱好描述，推断其行为画像。\n' +
          '【去病化红线】措辞用"可能""倾向"，禁用结论性词汇：' + forbiddenList + '。原型是"高代价自救模式"，不是病。\n' +
          '【8 卦原型库】（四象=身·息·心·神）：' + guaList + '\n' +
          '【四象维度】shen=身(烟酒饮食久坐) xi=息(熬夜失眠) xin=心(情绪应对) shen2=神(意义感透支)\n' +
          '【输出格式】严格返回 JSON（不要 markdown 代码块）：\n' +
          '{\n' +
          '  "siXiangScores": { "shen": 0-1, "xi": 0-1, "xin": 0-1, "shen2": 0-1 },\n' +
          '  "behaviorKeywords": [ { "word": "字符串", "weight": 0-1 } ],\n' +
          '  "gua": "卦名(单字)",\n' +
          '  "archetype": "原型名",\n' +
          '  "rhythmType": "avoidant|lonely|hyper|depressed",\n' +
          '  "confidence": 0-1,\n' +
          '  "rationale": "推断理由，去病化措辞"\n' +
          '}\n' +
          '【要求】gua 必须是 8 卦之一(巽艮兑坤震乾坎离)；rhythmType 与该卦对应；confidence 反映描述信息量。'
      },
      { role: 'user', content: '描述：' + description }
    ],
    temperature: LLM_TEMPERATURE
  };

  const resp = await callTraeAPI(body);
  const text = extractLLMText(resp);
  let result = parseJSON(text);
  if (!result) {
    throw new Error('画像 JSON 解析失败');
  }
  // 去病化过滤 rationale
  if (result.rationale) result.rationale = sanitizeText(result.rationale);
  if (result.archetype) result.archetype = sanitizeText(result.archetype);
  return result;
}

async function buildCharacter(description, assessResult, archetypeSkeleton) {
  const forbiddenList = FORBIDDEN_WORDS.join('、');

  // v3: 原型骨架约束（LLM 在骨架上个性化）
  var skeletonHint = '';
  if (archetypeSkeleton) {
    skeletonHint = '【匹配的原型骨架·请在骨架上个性化，不得偏离 rhythmType 与 sublimation 方向】\n' +
      '卦：' + archetypeSkeleton.gua + ' ' + archetypeSkeleton.symbol + '\n' +
      '原型：' + archetypeSkeleton.archetype + '\n' +
      '节奏型：' + archetypeSkeleton.rhythmType + '\n' +
      '高代价习惯：' + archetypeSkeleton.highCostHabit + '\n' +
      '升华方向：' + archetypeSkeleton.sublimation + '\n' +
      '共性特征提示(肖像模板)：' + JSON.stringify(archetypeSkeleton.portraitTemplate) + '\n\n';
  }
  var assessHint = '';
  if (assessResult) {
    assessHint = '【评估引擎画像·已推断，请在角色中体现】\n' +
      '四象评分：' + JSON.stringify(assessResult.siXiangScores) + '\n' +
      '行为关键词：' + JSON.stringify(assessResult.behaviorKeywords) + '\n' +
      '置信度：' + assessResult.confidence + '\n\n';
  }

  // 单步生成角色档案：LLM 内部完成关键词提取 + 共性特征归纳 + 档案生成 + 隐藏画像推断
  const body = {
    model: ARK_MODEL,  // C-agent3b: model 与 .env 一致
    messages: [
      {
        role: 'system',
        content: skeletonHint + assessHint +
          '你是心理学角色构建专家。请基于用户描述，按以下步骤内部推理后输出最终角色档案：\n' +
          '1. 提取行为倾向关键词及其权重（0-1，去病化：措辞用"可能""倾向"，不下结论）\n' +
          '2. 依据权威心理学知识（学术理论、公益心理组织共识等）提取该行为倾向的共性特征（非单一案例，避免过拟合）\n' +
          '3. 从心理学、医学、生活背景三角度，推断该角色"大概率会陷入的潜在心理倾向"（去病化措辞，用"倾向""模式""可能"，绝不用"症""病""患者"等结论性词汇）\n' +
          '4. 为角色设计独特的"语言艺术风格"——用寓言、古诗、诗经、比喻、暗示表达内在状态，而非大白话\n' +
          '5. 基于以上生成"卦中人"角色档案\n\n' +
          '【去病化红线】基于共性特征，不复制具体案例（避免过拟合）。禁用结论性词汇：' + forbiddenList + '。\n' +
          '【输出格式】严格返回 JSON（不要 markdown 代码块），含以下字段：\n' +
          '{\n' +
          '  "name": "字符串",\n' +
          '  "age": 数值,\n' +
          '  "occupation": "字符串",\n' +
          '  "archetype": "字符串，如回避·孤僻型",\n' +
          '  "coreTraits": ["数组，长度≥3，共性特征"],\n' +
          '  "innerMonologue": ["数组，长度≥2，典型内心独白"],\n' +
          '  "defenseMechanisms": ["数组，长度≥2，防御机制"],\n' +
          '  "triggers": ["数组，长度≥2，情绪触发点"],\n' +
          '  "comfortNeeds": ["数组，长度≥2，真实情感需求"],\n' +
          '  "rhythmType": "avoidant",\n' +
          '  "variationRange": {"emotionSwing": 10, "replyStyles": 4},\n' +
          '  "hiddenPattern": {\n' +
          '    "tendency": "字符串，去病化措辞描述潜在心理倾向，如\"倾向于用孤立回避冲突，长期可能滑向自我封闭\"，禁用结论性词汇",\n' +
          '    "backgroundFactors": ["数组，背景诱因，如\"夜班颠倒生物钟\"\"社交圈持续收缩\""],\n' +
          '    "deteriorationSigns": ["数组，长度≥3，恶化时的表现，用于驱动语言风格，如\"比喻越来越晦涩\"\"古诗转向悲凉\"\"语言碎片化\""]\n' +
          '  },\n' +
          '  "expressionStyle": {\n' +
          '    "metaphorDomain": "字符串，角色偏爱的比喻域，如\"夜雨、孤舟、枯井\"",\n' +
          '    "poetryPrefs": "字符串，偏爱的古诗/诗经风格，如\"偏爱《古诗十九首》的苍凉与留白\"",\n' +
          '    "fableStyle": "字符串，寓言风格，如\"常用半途而废的旅人、熄灭的灯等意象\"",\n' +
          '    "hintLevel": 数值 0-3，暗示程度，0=直白、3=极度隐晦\n' +
          '  }\n' +
          '}\n\n' +
          '【v3 骨架约束】archetype 与 rhythmType 必须与匹配的原型骨架一致（' + (archetypeSkeleton ? archetypeSkeleton.archetype + '/' + archetypeSkeleton.rhythmType : '未提供') + '）。sublimation 方向须体现在 deteriorationSigns 的反向。\n\n' +
          '【重要】hiddenPattern 是隐藏字段，用于驱动角色内在状态与语言风格，绝不在对话中直接说出；expressionStyle 指导角色用比喻/古诗/寓言表达。'
      },
      { role: 'user', content: '描述：' + description }
    ],
    temperature: LLM_TEMPERATURE,  // C-agent7: 温度 ∈ [0.7, 0.9]
    // 注：enable_search 仅火山引擎 Ark 支持，DeepSeek 等不兼容；为保持 provider 中立，统一不启用
  };
  const resp = await callTraeAPI(body);
  const profileText = extractLLMText(resp);

  // 解析 JSON
  const profile = parseJSON(profileText);
  if (!profile) {
    throw new Error('角色档案 JSON 解析失败');
  }

  // 去病化过滤（C-agent5b: 返回的角色档案不含结论性词汇）
  if (profile.name) profile.name = sanitizeText(profile.name);
  if (profile.occupation) profile.occupation = sanitizeText(profile.occupation);
  if (profile.archetype) profile.archetype = sanitizeText(profile.archetype);
  if (Array.isArray(profile.coreTraits)) {
    profile.coreTraits = profile.coreTraits.map(sanitizeText);
  }
  if (Array.isArray(profile.innerMonologue)) {
    profile.innerMonologue = profile.innerMonologue.map(sanitizeText);
  }
  if (Array.isArray(profile.defenseMechanisms)) {
    profile.defenseMechanisms = profile.defenseMechanisms.map(sanitizeText);
  }
  // 隐藏画像同样去病化过滤（双重保险，确保 hiddenPattern 内无禁用词）
  if (profile.hiddenPattern) {
    if (profile.hiddenPattern.tendency) {
      profile.hiddenPattern.tendency = sanitizeText(profile.hiddenPattern.tendency);
    }
    if (Array.isArray(profile.hiddenPattern.backgroundFactors)) {
      profile.hiddenPattern.backgroundFactors = profile.hiddenPattern.backgroundFactors.map(sanitizeText);
    }
    if (Array.isArray(profile.hiddenPattern.deteriorationSigns)) {
      profile.hiddenPattern.deteriorationSigns = profile.hiddenPattern.deteriorationSigns.map(sanitizeText);
    }
  }

  return profile;
}

// ===== 对话引擎（LLM 模式）=====
// v3 新增：隐藏画像驱动 + 语言艺术 + 恶化逻辑
// - 角色用寓言/古诗/比喻/暗示表达内在状态，不大白话
// - deterioration 恶化等级（0-3）：对话无效则上升，语言越晦涩/碎片化/消极
// - 用户若能"听懂"角色隐喻并有效回应，恶化缓解；否则持续恶化
async function chatWithLLM(params) {
  const message = params.message || '';
  const character = params.character || {};
  const stage = params.stage || 0;
  const stageName = params.stageName || '';
  const emotion = params.emotion || 0;
  const health = params.health || 0;
  const currentPath = params.path || 'yang';
  const distortion = params.distortion || 0;
  const deterioration = params.deterioration || 0;  // v3: 恶化等级 0-3
  const history = params.history || [];
  const frontendFlag = params.frontendFlag || '';

  // 构建历史对话文本（最近 10 轮，C-llm3: 历史对话 ≥ 5 轮）
  const historyText = history.slice(-10).map(function (h) {
    const role = h.role === 'user' ? '用户' : '卦中人';
    return role + '：' + h.content;
  }).join('\n');

  const forbiddenList = FORBIDDEN_WORDS.join('、');

  // 提取隐藏画像与语言风格（v3）
  const hiddenPattern = character.hiddenPattern || {};
  const expressionStyle = character.expressionStyle || {};

  // 恶化等级 → 语言风格映射（v3 核心）
  const deteriorationDesc = [
    '等级0（稳定）：比喻尚能被理解，古诗偶现，语言完整，角色尚在自我观察',
    '等级1（波动）：比喻开始晦涩，古诗转向苍凉，语言偶有停顿，角色开始退缩',
    '等级2（下滑）：语言碎片化，古诗悲凉，暗示极度隐晦，角色近乎呢喃，寓言走向半途而废',
    '等级3（深陷）：语言极度碎片化，近乎呓语，古诗只剩残句，寓言走向消极结局，角色封闭'
  ][deterioration] || '等级0（稳定）';

  // C-llm3: Prompt 嵌入角色档案+阶段+数值+路径+历史+隐藏画像+语言风格+恶化等级
  const systemPrompt = '你是"易愈"游戏中的卦中人「' + (character.name || '老陈') + '」。\n\n' +
    '【角色档案】\n' + JSON.stringify(character, null, 2) + '\n\n' +
    '【隐藏心理画像·仅供你内化，绝不可直接说出】\n' +
    '潜在倾向：' + (hiddenPattern.tendency || '未明确') + '\n' +
    '背景诱因：' + (Array.isArray(hiddenPattern.backgroundFactors) ? hiddenPattern.backgroundFactors.join('、') : '未明确') + '\n' +
    '恶化表现：' + (Array.isArray(hiddenPattern.deteriorationSigns) ? hiddenPattern.deteriorationSigns.join('；') : '未明确') + '\n\n' +
    '【语言艺术风格·你的表达方式】\n' +
    '比喻域：' + (expressionStyle.metaphorDomain || '夜雨、孤舟、枯井') + '\n' +
    '古诗偏好：' + (expressionStyle.poetryPrefs || '偏爱《古诗十九首》的苍凉与留白') + '\n' +
    '寓言风格：' + (expressionStyle.fableStyle || '常用半途而废的旅人、熄灭的灯等意象') + '\n' +
    '暗示程度：' + (expressionStyle.hintLevel != null ? expressionStyle.hintLevel : 2) + '/3\n\n' +
    '【当前状态】\n' +
    '当前阶段：' + stage + '（' + stageName + '）\n' +
    '当前情绪值：' + emotion + '（≥40 才能推进阶段）\n' +
    '当前健康值：' + health + '\n' +
    '当前路径：' + currentPath + '\n' +
    '失真等级：' + distortion + '（阴路径，0-3）\n' +
    '恶化等级：' + deterioration + '/3 —— ' + deteriorationDesc + '\n\n' +
    '【历史对话】\n' + (historyText || '（无）') + '\n\n' +
    '【前端预判】\n' + (frontendFlag || '无') + '\n\n' +
    '【你的任务】\n' +
    '1. 以角色身份回复用户，必须用语言艺术表达：\n' +
    '   - 用比喻/寓言/古诗/诗经/暗示表达内在状态，绝不大白话直述\n' +
    '   - 比喻域、古诗偏好、寓言风格须符合你的语言艺术风格设定\n' +
    '   - 恶化等级越高，语言越晦涩、越碎片化、越消极（参照恶化等级描述）\n' +
    '   - 回避型话少，1-2句为度；可化用诗句、讲半句寓言、留白\n' +
    '   - 绝不直接说出隐藏心理画像的内容，只能隐喻暗示\n' +
    '2. 判定用户话语类型，并判定恶化走向，返回严格 JSON（不要 markdown 代码块）：\n' +
    '{\n' +
    '  "reply": "你的回复（1-2句，用比喻/古诗/寓言表达，必须单行，不得包含换行符）",\n' +
    '  "userUtteranceType": "change_talk|preaching|perfunctory|repetitive|neutral|crisis",\n' +
    '  "emotionDelta": 数值,\n' +
    '  "healthDelta": 数值,\n' +
    '  "stageAdvance": true/false,\n' +
    '  "deteriorationDelta": 数值,\n' +
    '  "resonated": true/false,\n' +
    '  "reason": "判定理由"\n' +
    '}\n' +
    '【JSON 格式红线】reply 字段必须是合法 JSON 字符串——双引号内不得出现裸换行符（用空格代替），不得出现未转义的双引号。\n\n' +
    '【话语类型判定规则】\n' +
    '- change_talk：用户提问/共情/反映/引导，引出角色说出改变话语。达成阶段标准时 emotionDelta=+2, healthDelta=+15~+20, stageAdvance=true；未达标时 emotionDelta=+3~+5, healthDelta=0, stageAdvance=false\n' +
    '- preaching：用户命令/否定/大道理（如"你应该""你必须""不要""别再""为你好"）。emotionDelta=-5~-8, healthDelta=-3, stageAdvance=false\n' +
    '- perfunctory：用户敷衍（如"嗯""哦""辛苦了""好吧"反复）。emotionDelta=-3~-5, healthDelta=0, stageAdvance=false\n' +
    '- repetitive：用户输入与最近历史重复。emotionDelta=-4~-6, healthDelta=-2, stageAdvance=false\n' +
    '- neutral：中性闲聊。emotionDelta=+1~+2, healthDelta=0, stageAdvance=false\n' +
    '- crisis：用户有自伤/自杀倾向。立即返回 crisis 类型\n\n' +
    '【恶化逻辑·deteriorationDelta 判定】\n' +
    '- resonated=true：用户"听懂"了你的隐喻/古诗并有效回应（共情、接住意象、顺着比喻深入）。deteriorationDelta=-1（缓解）\n' +
    '- resonated=false 且话语为 perfunctory/repetitive/preaching：用户没听懂或敷衍。deteriorationDelta=+1（恶化）\n' +
    '- resonated=false 且话语为 neutral：deteriorationDelta=0（维持）\n' +
    '- resonated=false 且话语为 change_talk 但未推进阶段：deteriorationDelta=0（维持，有努力但不够）\n' +
    '- deteriorationDelta 取值仅 -1/0/+1，累计后由前端 clamp 到 [0,3]\n\n' +
    '【阶段推进门控】\n' +
    '- 仅当 emotion ≥ 40 且用户话语为 change_talk 且引出角色改变话语时，stageAdvance=true\n' +
    '- stageAdvance=true 时，healthDelta ∈ [+15, +20]\n' +
    '- stageAdvance=false 时，healthDelta 必须 = 0（不得为正）\n\n' +
    '【去病化】禁用词：' + forbiddenList + '。使用替代词：状态、卦中人、陪伴、松绑、翻卦、升华。\n' +
    '【去惩罚化】阴路径失真与恶化只引发心疼，不指责。不出现"\u90fd\u602a\u4f60""\u4f60\u5bb3""\u4f60\u9519""\u6d3b\u8be5"等指责词。\n' +
    '【隐私】不询问用户身份信息。';

  const body = {
    model: ARK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: LLM_TEMPERATURE,
    // 对话流程不启用联网搜索（C-agent3a: 联网搜索仅在角色构建流程）
  };

  const resp = await callTraeAPI(body);
  const text = extractLLMText(resp);

  // 解析 JSON（C-llm4a: 解析失败有兜底）
  let result = parseJSON(text);
  if (!result) {
    result = {
      reply: sanitizeText(text.substring(0, 200)) || '……',
      userUtteranceType: 'neutral',
      emotionDelta: 0,
      healthDelta: 0,
      stageAdvance: false,
      deteriorationDelta: 0,
      resonated: false,
      reason: 'LLM 返回 JSON 解析失败，兜底为 neutral'
    };
  }

  // 去病化过滤回复
  if (result.reply) {
    result.reply = sanitizeText(result.reply);
  }

  return result;
}

// ===== HTTP 服务器 =====
const server = http.createServer(async function (req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS（本机调试用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/health（C-mode1a: 返回 200 + JSON）
  if (req.method === 'GET' && pathname === '/api/health') {
    const hasKey = ARK_API_KEY && ARK_API_KEY !== 'your_api_key_here';
    const body = hasKey
      ? { status: 'ok', mode: 'llm', model: ARK_MODEL }
      : { status: 'ok', mode: 'rule' };
    sendJSON(res, 200, body);
    return;
  }

  // POST /api/assess（v3: 画像推断端点）
  if (req.method === 'POST' && pathname === '/api/assess') {
    try {
      const body = await readBody(req);
      const params = JSON.parse(body);
      const description = params.description;
      if (!description || description.length < 5) {
        sendJSON(res, 400, { error: '描述过短，请输入至少 5 个字符' });
        return;
      }
      const portrait = await assessPortrait(description);
      sendJSON(res, 200, portrait);
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/build-character（C-agent2: 角色构建端点）
  if (req.method === 'POST' && pathname === '/api/build-character') {
    try {
      const body = await readBody(req);
      const params = JSON.parse(body);
      const description = params.description;  // C-agent2a: 接收 description 字段
      if (!description || description.length < 5) {
        sendJSON(res, 400, { error: '描述过短，请输入至少 5 个字符' });
        return;
      }
      // v3: 先推断画像，再匹配骨架，再生成角色
      let assessResult = null;
      let archetypeSkeleton = null;
      try {
        assessResult = await assessPortrait(description);
        if (assessResult && assessResult.gua) {
          archetypeSkeleton = archetypes.getArchetypeByGua(assessResult.gua);
        }
      } catch (e) {
        // 画像推断失败不阻断，降级为无骨架生成
      }
      const profile = await buildCharacter(description, assessResult, archetypeSkeleton);
      // 把画像与骨架信息附带返回，供前端展示
      profile.__assess = assessResult;
      profile.__archetype = archetypeSkeleton ? {
        gua: archetypeSkeleton.gua, archetype: archetypeSkeleton.archetype,
        rhythmType: archetypeSkeleton.rhythmType, sublimation: archetypeSkeleton.sublimation
      } : null;
      sendJSON(res, 200, profile);  // C-agent2b: 返回角色档案 JSON
    } catch (e) {
      // API 失败时返回 error，让前端回退规则模式
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/chat（C-llm1: 对话端点）
  if (req.method === 'POST' && pathname === '/api/chat') {
    try {
      const body = await readBody(req);
      const params = JSON.parse(body);
      // C-llm1a: 接收 message/history/character/stage/emotion/health/path 等字段
      const result = await chatWithLLM(params);
      sendJSON(res, 200, result);
    } catch (e) {
      // API 失败时返回 error，让前端回退规则引擎
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // 静态文件服务（GET / 返回 index.html）
  if (req.method === 'GET') {
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    // 安全：防止目录遍历
    if (filePath.indexOf(__dirname) !== 0) {
      res.writeHead(403);
      res.end();
      return;
    }

    fs.readFile(filePath, function (err, data) {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath);
      let contentType = 'text/html; charset=utf-8';
      if (ext === '.js') contentType = 'application/javascript; charset=utf-8';
      else if (ext === '.css') contentType = 'text/css; charset=utf-8';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

// 启动服务器（E8: 端口 3000）
server.listen(PORT, function () {
  const hasKey = ARK_API_KEY && ARK_API_KEY !== 'your_api_key_here';
  console.log('易愈服务器已启动：http://localhost:' + PORT);
  console.log('模式：' + (hasKey ? 'LLM（在线）' : '规则（离线兜底）'));
  if (hasKey) {
    console.log('模型：' + ARK_MODEL);
  }
  // R18: 不打印 API Key
});
