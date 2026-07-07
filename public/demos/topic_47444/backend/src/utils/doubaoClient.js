import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.DOUBAO_API_KEY;
const MODEL = process.env.DOUBAO_MODEL || 'Doubao-Seed-2.0-lite';
const ENDPOINT = process.env.DOUBAO_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 缓存配置
let promptConfigCache = null;

/**
 * 读取 system-prompt.json 配置
 */
export function loadPromptConfig() {
  if (promptConfigCache) return promptConfigCache;
  const configPath = join(__dirname, '../../../docs/system-prompt.json');
  const data = readFileSync(configPath, 'utf-8');
  promptConfigCache = JSON.parse(data);
  return promptConfigCache;
}

/**
 * 调用豆包大模型 API（带重试）
 * @param {Array} messages - 对话历史 [{role, content}]
 * @param {Object} options - 额外参数
 * @returns {Promise<string>} AI 回复内容
 */
export async function callDoubao(messages, options = {}) {
  if (!API_KEY) {
    throw new Error('DOUBAO_API_KEY 未配置');
  }

  const maxRetries = options.maxRetries ?? 3;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const body = {
        model: MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.8,
        max_tokens: options.max_tokens ?? 500
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 30000);

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        // 401: 认证错误，不重试
        if (response.status === 401) {
          throw new Error(`豆包 API 认证失败: ${errorText}`);
        }

        // 429: 限流，指数退避重试
        if (response.status === 429) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await sleep(delay);
            lastError = new Error(`豆包 API 限流: ${errorText}`);
            continue;
          }
          throw new Error(`豆包 API 限流，已重试${maxRetries}次: ${errorText}`);
        }

        // 5xx: 服务端错误，线性退避重试
        if (response.status >= 500) {
          if (attempt < maxRetries) {
            await sleep(1000 * (attempt + 1));
            lastError = new Error(`豆包 API 服务端错误 ${response.status}: ${errorText}`);
            continue;
          }
          throw new Error(`豆包 API 服务端错误 ${response.status}: ${errorText}`);
        }

        // 其他 4xx: 直接抛错
        throw new Error(`豆包 API 错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        throw new Error('豆包 API 返回空内容');
      }
      return content;
    } catch (err) {
      if (err.name === 'AbortError') {
        if (attempt < maxRetries) {
          await sleep(1000 * (attempt + 1));
          lastError = new Error('豆包 API 请求超时');
          continue;
        }
        throw new Error('豆包 API 请求超时，已重试多次');
      }

      // 网络错误：ECONNRESET / ETIMEDOUT / ENOTFOUND
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
        if (attempt < maxRetries) {
          await sleep(1000 * (attempt + 1));
          lastError = err;
          continue;
        }
      }

      throw err;
    }
  }

  throw lastError || new Error('豆包 API 调用失败');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 从用户画像中检测追问链标记
 * @param {Object} profile - 用户评测画像
 * @returns {Object} 标记对象
 */
export function detectInjectionFlags(profile = {}) {
  const flags = {
    feedingRisk: false,
    driveShadowAlignment: false,
    overlapDetection: false,
    calibrationCheck: false
  };

  // 从 deepDiag 数组检测
  if (profile.deepDiag && Array.isArray(profile.deepDiag)) {
    profile.deepDiag.forEach(item => {
      if (item.type === 'feedingRisk') flags.feedingRisk = true;
      if (item.type === 'driveShadowAlignment') flags.driveShadowAlignment = true;
      if (item.type === 'overlapDetection') flags.overlapDetection = true;
      if (item.type === 'calibrationCheck') flags.calibrationCheck = true;
    });
  }

  // 从 shadow 对象检测
  if (profile.shadow) {
    if (profile.shadow.driveShadowAlignment?.isAligned) {
      flags.driveShadowAlignment = true;
    }
    if (profile.shadow.overlapStatus?.hasOverlap) {
      flags.overlapDetection = true;
    }
  }

  // 从 fiveIndices 检测 calibrationCheck
  if (profile.fiveIndices && profile.fiveIndices.calibrationCheck?.detected) {
    flags.calibrationCheck = true;
  }

  return flags;
}

/**
 * 获取某轮需要注入的追问（按优先级，最多1条）
 * @param {number} round - 轮次（1-6，AI 要生成的轮次）
 * @param {Object} flags - 追问链标记
 * @returns {string|null} 追问文本
 */
export function getInjectionForRound(round, flags = {}) {
  if (!flags) return null;

  const config = loadPromptConfig();

  const injections = [
    { key: 'feedingRisk', flag: flags.feedingRisk, config: config.feedingRiskPrompt },
    { key: 'driveShadowAlignment', flag: flags.driveShadowAlignment, config: config.driveShadowAlignmentPrompt },
    { key: 'overlapDetection', flag: flags.overlapDetection, config: config.overlapDetectionPrompt },
    { key: 'calibrationCheck', flag: flags.calibrationCheck, config: config.calibrationCheckPrompt }
  ].filter(item => item.flag && item.config && item.config.enabled && item.config.injectRound === round);

  if (injections.length === 0) return null;

  // 按优先级排序（priority 数字越小优先级越高）
  injections.sort((a, b) => (a.config.priority || 99) - (b.config.priority || 99));

  return injections[0].config.template || null;
}

/**
 * 构建 System Prompt
 * @param {Object} profile - 用户评测画像
 * @param {Object} flags - 追问链标记
 * @param {number} aiRound - AI 要生成的轮次（1-6）
 * @returns {Object} system 消息 {role, content}
 */
export function buildSystemPrompt(profile = {}, flags = {}, aiRound = 1) {
  const config = loadPromptConfig();
  const base = config.basePrompt || '';

  // 用户画像信息
  const axes = profile.threeAxes || {};
  const portrait = profile.portrait || {};
  const shadow = profile.shadow || {};

  // 构建6轮 template 参考（为当前轮次注入追问）
  let roundsRef = '';
  for (let i = 1; i <= 6; i++) {
    const rk = `round${i}`;
    const rc = config.roundTemplates?.[rk];
    if (rc) {
      let tmpl = rc.template || '';
      // 只为当前 AI 要生成的轮次注入追问
      if (i === aiRound) {
        const injection = getInjectionForRound(i, flags);
        tmpl = tmpl.replace('{injected}', injection ? '\n' + injection : '');
      } else {
        tmpl = tmpl.replace('{injected}', '');
      }
      roundsRef += `\n第${i}轮（${rc.topic}）：${tmpl}`;
    }
  }

  // 个性化指令（基于画像）
  let personalization = '';

  const shadowMap = {
    'lazy': '该用户主遮蔽为"懒"——是真的累，还是有什么在吸走注意力？追问时引导其区分"真累"和"逃避"。',
    'fear': '该用户主遮蔽为"怕"——最怕的后果如果发生了，最坏会怎样？追问时引导其面对最坏情况。',
    'profit': '该用户主遮蔽为"利"——觉得亏的东西是真的亏还是被放大的？追问时引导其核算真实成本。',
    'bind': '该用户主遮蔽为"锁"——锁住的约束有没有一条缝还没仔细看？追问时引导其寻找约束的例外。'
  };
  if (shadow.mainShadow && shadowMap[shadow.mainShadow]) {
    personalization += `\n【遮蔽聚焦】${shadowMap[shadow.mainShadow]}`;
  }

  if (flags.driveShadowAlignment) {
    personalization += '\n【对齐追问】该用户驱动力和遮蔽方向一致——越努力可能越看不见。需要引导其停下来3秒，确认这是否是自己选的。';
  }

  if (flags.feedingRisk) {
    personalization += '\n【投喂风险】该用户倾向于找确认而非找挑战。追问时需要引导其反思：这是在验证已有判断，还是在找同意的声音？';
  }

  if (flags.overlapDetection) {
    personalization += '\n【多层遮蔽】该用户同时踩到多层遮蔽——它们可能互相"验证"。需要引导其分别说出每个遮蔽在告诉自己什么。';
  }

  if (flags.calibrationCheck) {
    personalization += '\n【校准检查】该用户需要区分运气与能力。追问时引导其反思：成功时是否也在反思，还是只有失败时才反思？';
  }

  // 遮蔽模式
  if (shadow.shadowMode === 'compound') {
    personalization += '\n【复合遮蔽】该用户画像显示可能面对多层遮蔽同时在推。引导其分辨哪个声音最大，那个最大的声音是真的还是装出来的。';
  }

  const prohibitions = (config.prohibitions || []).join('\n- ');

  // 当前轮次特殊指示
  let roundInstruction = '';
  if (aiRound === 1) {
    roundInstruction = '现在是第1轮，开场。请直接输出你应该说的话。';
  } else if (aiRound === 6) {
    roundInstruction = '现在是第6轮，最终总结。请基于以上全部对话，输出用户的认知锚点总结。格式：\n1. 核心信息是什么\n2. 见察发现\n3. 澄省发现\n4. 明定第一步（48小时内可执行的最小行动）\n保持简洁，不超过3个短句。';
  } else {
    roundInstruction = `现在是第${aiRound}轮。请根据用户上一条回答，自然衔接，提出本轮的问题。不要完全照搬 template，根据实际对话调整语气和措辞。`;
  }

  return {
    role: 'system',
    content: `${base}

【用户画像】
- 见察力: ${axes.jiancha ?? axes.jiancha_final ?? '?'}
- 澄省力: ${axes.chengxing ?? axes.chengxing_final ?? '?'}
- 明定力: ${axes.mingding ?? axes.mingding_final ?? '?'}
- 主遮蔽: ${shadow.mainShadow ?? portrait.shadow ?? '?'}
- 画像: ${portrait.name ?? portrait.portraitName ?? '?'}
- 遮蔽模式: ${shadow.shadowMode ?? '?'}
${personalization}

【当前状态】
当前轮次：${aiRound}/6
${roundInstruction}

【各轮参考】${roundsRef}

【绝对禁止】
- ${prohibitions}

【期望管理】
${config.expectationManagement || ''}

【敏感内容】
${config.sensitiveContent || ''}
`
  };
}

/**
 * 构建某轮的用户消息
 * @param {number} round - 当前轮次（用户正在回答的轮次，1-5）
 * @param {string} userMessage - 用户输入内容
 * @returns {Object} user 消息 {role, content}
 */
export function buildUserMessage(round, userMessage) {
  if (!userMessage || userMessage.trim() === '') {
    return { role: 'user', content: '请开始。' };
  }
  return {
    role: 'user',
    content: userMessage.trim()
  };
}
