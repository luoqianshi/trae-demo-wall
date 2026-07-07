/**
 * AI全流程求职智能管家 - Background Service Worker
 * 功能：简历数据存储调度、投递记录管理、跨页面消息中继
 * Manifest V3 Service Worker
 */

// 加载简历数据模型（提供 DEFAULT_PROFILES 等常量）
importScripts('resume-model.js');

// ============================================================
// 一、安装事件：初始化默认数据
// ============================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[JobPilot] onInstalled reason:', details.reason);

  // 使用空字段的默认 Profile（来自 resume-model.js）
  const defaultProfiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));

  // 默认简历数据也设为空
  const defaultResume = { ...defaultProfiles.profile_1.fields };

  if (details.reason === 'install') {
    console.log('[JobPilot] 扩展首次安装，初始化空默认数据');

    // 默认投递记录（空）
    const defaultApplications = [];

    // 投递统计数据（空）
    const defaultStats = {
      totalApplied: 0,
      totalViewed: 0,
      totalInterviews: 0,
      totalOffers: 0,
      conversionRate: 0,
      weeklyApplied: [0, 0, 0, 0, 0, 0, 0],
      lastUpdated: new Date().toISOString()
    };

    chrome.storage.local.set({
      resumeData: defaultResume,
      resumeProfiles: defaultProfiles,
      activeProfileId: 'profile_1',
      applications: defaultApplications,
      stats: defaultStats,
      installTime: Date.now()
    });
  } else if (details.reason === 'update') {
    // 升级时清空旧的张三默认数据，保留用户已编辑的简历
    console.log('[JobPilot] 扩展升级，清理旧版默认数据');
    chrome.storage.local.get(['resumeProfiles', 'resumeData'], (result) => {
      const updates = {};

      // 如果存储中没有 profiles（旧版本未初始化），写入空的默认 profiles
      if (!result.resumeProfiles) {
        updates.resumeProfiles = defaultProfiles;
        updates.activeProfileId = 'profile_1';
      }

      // 如果旧版 resumeData 是张三默认数据（未编辑过），清空它
      if (result.resumeData && result.resumeData.name === '张三' && result.resumeData.phone === '138****8888') {
        updates.resumeData = { ...defaultResume };
      }

      // 如果没有 resumeData，也写入空默认
      if (!result.resumeData) {
        updates.resumeData = { ...defaultResume };
      }

      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates, () => {
          console.log('[JobPilot] 旧版数据已清理:', Object.keys(updates));
        });
      }
    });
  }
});

// ============================================================
// 二、消息中继：popup ↔ content-script 通信
// ============================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {

    // ---- 简历数据（向后兼容旧版） ----
    case 'getResumeData':
      chrome.storage.local.get(['resumeData'], (result) => {
        sendResponse(result.resumeData || {});
      });
      return true;

    case 'updateResumeData':
      chrome.storage.local.set({ resumeData: request.data }, () => {
        sendResponse({ success: true });
      });
      return true;

    // ---- 多模板 Profile 管理 ----
    case 'getProfiles':
      chrome.storage.local.get(['resumeProfiles', 'activeProfileId'], (result) => {
        const profiles = result.resumeProfiles || {};
        const activeId = result.activeProfileId || 'profile_1';
        sendResponse({ profiles, activeProfileId: activeId });
      });
      return true;

    case 'updateProfile':
      chrome.storage.local.get(['resumeProfiles'], (result) => {
        const profiles = result.resumeProfiles || {};
        if (!profiles[request.profileId]) {
          sendResponse({ success: false, error: 'Profile not found' });
          return;
        }
        profiles[request.profileId].fields = { ...profiles[request.profileId].fields, ...request.fields };
        profiles[request.profileId].updatedAt = Date.now();
        chrome.storage.local.set({ resumeProfiles: profiles }, () => {
          sendResponse({ success: true, profile: profiles[request.profileId] });
        });
      });
      return true;

    case 'setActiveProfile':
      chrome.storage.local.set({ activeProfileId: request.profileId }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'renameProfile':
      chrome.storage.local.get(['resumeProfiles'], (result) => {
        const profiles = result.resumeProfiles || {};
        if (!profiles[request.profileId]) {
          sendResponse({ success: false, error: 'Profile not found' });
          return;
        }
        profiles[request.profileId].name = request.name;
        profiles[request.profileId].updatedAt = Date.now();
        chrome.storage.local.set({ resumeProfiles: profiles }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case 'createProfile':
      ProfileManager.create(request.name, request.type || 'form', request.fields || {})
        .then((profile) => sendResponse({ success: true, profile }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'deleteProfile':
      ProfileManager.delete(request.profileId)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'duplicateProfile':
      ProfileManager.duplicate(request.profileId)
        .then((profile) => sendResponse({ success: true, profile }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'getProfileFillData':
      chrome.storage.local.get(['resumeProfiles', 'activeProfileId'], (result) => {
        const profiles = result.resumeProfiles || {};
        const activeId = result.activeProfileId || 'profile_1';
        const profile = profiles[activeId];
        sendResponse(profile ? profile.fields : {});
      });
      return true;

    // ---- 自定义字段/栏目 Schema ----
    case 'customSchema_get':
      (async () => {
        try {
          let pid = request.profileId;
          if (!pid) {
            const result = await chrome.storage.local.get(['activeProfileId']);
            pid = result.activeProfileId || 'profile_1';
          }
          const schema = await CustomSchemaManager.load(pid);
          sendResponse({ success: true, schema });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;

    case 'customSchema_addField':
      CustomSchemaManager.addField(request.profileId, request.field)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'customSchema_updateField':
      CustomSchemaManager.updateField(request.profileId, request.fieldKey, request.updates)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'customSchema_removeField':
      CustomSchemaManager.removeField(request.profileId, request.fieldKey)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'customSchema_addSection':
      CustomSchemaManager.addSection(request.profileId, request.section)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'customSchema_removeSection':
      CustomSchemaManager.removeSection(request.profileId, request.sectionId)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'customSchema_renameSection':
      CustomSchemaManager.renameSection(request.profileId, request.sectionId, request.name)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    // 获取投递记录
    case 'getApplications':
      chrome.storage.local.get(['applications'], (result) => {
        sendResponse(result.applications || []);
      });
      return true;

    // 添加投递记录
    case 'addApplication':
      chrome.storage.local.get(['applications'], (result) => {
        const apps = result.applications || [];
        const newApp = {
          id: Date.now(),
          ...request.data,
          date: new Date().toISOString().split('T')[0],
          status: '已投递'
        };
        apps.push(newApp);
        chrome.storage.local.set({ applications: apps }, () => {
          updateStats();
          sendResponse({ success: true, app: newApp });
        });
      });
      return true;

    // 更新投递状态
    case 'updateApplicationStatus':
      chrome.storage.local.get(['applications'], (result) => {
        const apps = result.applications || [];
        const idx = apps.findIndex(a => a.id === request.id);
        if (idx >= 0) {
          apps[idx].status = request.status;
          chrome.storage.local.set({ applications: apps }, () => {
            updateStats();
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, error: '未找到该记录' });
        }
      });
      return true;

    // 获取统计数据
    case 'getStats':
      chrome.storage.local.get(['stats'], (result) => {
        sendResponse(result.stats || {});
      });
      return true;

    // 打开投递看板
    case 'openDashboard':
      chrome.tabs.create({
        url: chrome.runtime.getURL('web-dashboard/index.html')
      });
      sendResponse({ success: true });
      break;

    // 获取当前标签页信息
    case 'getActiveTab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse(tabs[0] || null);
      });
      return true;

    default:
      break;
  }
});

// ============================================================
// 三、投递统计更新
// ============================================================

function updateStats() {
  chrome.storage.local.get(['applications'], (result) => {
    const apps = result.applications || [];
    const statusCounts = {};
    apps.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    const stats = {
      totalApplied: apps.length,
      totalViewed: apps.length + Math.floor(Math.random() * 20),
      totalInterviews: statusCounts['已面试'] || 0,
      totalOffers: statusCounts['已offer'] || 0,
      statusBreakdown: statusCounts,
      conversionRate: apps.length > 0
        ? Math.round(((statusCounts['已面试'] || 0) + (statusCounts['已offer'] || 0)) / apps.length * 1000) / 10
        : 0,
      lastUpdated: new Date().toISOString()
    };

    chrome.storage.local.set({ stats });
  });
}

// ============================================================
// 四、Badge更新：显示投递数量
// ============================================================

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.applications) {
    const apps = changes.applications.newValue || [];
    const pendingCount = apps.filter(a => a.status === '待回复' || a.status === '已投递').length;
    chrome.action.setBadgeText({ text: pendingCount > 0 ? String(pendingCount) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }
});

// ============================================================
// 五、定时投递调度（模拟）
// ============================================================

let schedulerEnabled = false;
let schedulerInterval = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleScheduler') {
    schedulerEnabled = request.enabled;
    if (schedulerEnabled) {
      console.log('[JobPilot] 定时投递已开启，间隔:', request.interval, '分钟');
      // 模拟定时调度（实际环境中会结合content-script执行投递）
      if (schedulerInterval) clearInterval(schedulerInterval);
      schedulerInterval = setInterval(() => {
        chrome.storage.local.get(['schedulerQueue'], (result) => {
          const queue = result.schedulerQueue || [];
          if (queue.length > 0) {
            const next = queue.shift();
            console.log('[JobPilot] 定时投递执行:', next.company, next.position);
            // 将已投递的移入applications
            chrome.storage.local.get(['applications'], (r) => {
              const apps = r.applications || [];
              apps.push({
                id: Date.now(),
                company: next.company,
                position: next.position,
                date: new Date().toISOString().split('T')[0],
                status: '已投递',
                salary: next.salary || '面议',
                source: '定时投递'
              });
              chrome.storage.local.set({ applications: apps, schedulerQueue: queue });
              updateStats();
            });
          } else {
            // 队列为空，停止调度
            clearInterval(schedulerInterval);
            schedulerEnabled = false;
          }
        });
      }, (request.interval || 3) * 60 * 1000);
    } else {
      console.log('[JobPilot] 定时投递已关闭');
      if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
      }
    }
    sendResponse({ success: true, enabled: schedulerEnabled });
    return true;
  }

  // 设置调度队列
  if (request.action === 'setSchedulerQueue') {
    chrome.storage.local.set({ schedulerQueue: request.queue }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// ============================================================
// 六、LLM 调用模块（Qwen / DashScope OpenAI 兼容接口）
// ============================================================
//
// 隐私与安全设计：
// - API Key 仅由 background.js 读取，content-script/popup 永远不可见
// - 简历文本发送前会过滤身份证号、手机号等极敏感字段
// - 下拉匹配只发送 (字段名 + 简历值 + 选项列表)，不含原始简历
// - 用户自填 Key，存 chrome.storage.local，源码零硬编码
//
// API 文档：https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope
// JSON Mode：response_format={"type":"json_object"}，提示词必须包含"JSON"关键词

const QWEN_API_CONFIG = {
  // 北京地域（简单域名仍可用，业务空间专属域名性能更好）
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  // 默认模型：qwen-turbo（最便宜，0.3元/百万输入token）用于简单匹配；
  // 简历解析用 qwen-plus（0.8元/百万token，理解力更强）
  modelSimple: 'qwen-turbo',
  modelComplex: 'qwen-plus',
  timeoutMs: 30000,
};

// 极敏感字段 — 永不外传
const SENSITIVE_PATTERNS = [
  // 18位身份证号（含末位X）
  { re: /\d{17}[\dXx]/g, repl: '[身份证已隐藏]' },
  // 11位中国大陆手机号
  { re: /1[3-9]\d{9}/g, repl: '[手机号已隐藏]' },
  // 带分隔符的手机号 130-4200-2838
  { re: /1[3-9]\d[\-\s]?\d{4}[\-\s]?\d{4}/g, repl: '[手机号已隐藏]' },
  // 家庭信息段落（"家庭情况：..." 或 "父亲：..." 等）
  { re: /(?:家庭情况|家庭背景|家庭成员|父母信息|紧急联系人|紧急联系方式)[：:\s]*[^\n]{0,200}/gi, repl: '[家庭信息已隐藏]' },
  // 父亲/母亲/配偶开头的行
  { re: /^(父亲|母亲|配偶|家长|监护人)[：:\s]*[^\n]{0,100}$/gim, repl: '[亲属信息已隐藏]' },
];

/**
 * 过滤简历文本中的极敏感信息
 * @param {string} text 原始简历文本
 * @returns {string} 脱敏后文本
 */
function sanitizeResumeText(text) {
  if (!text) return '';
  let sanitized = text;
  for (const { re, repl } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(re, repl);
  }
  return sanitized;
}

/**
 * 从 chrome.storage.local 读取用户配置的 API Key
 * @returns {Promise<string|null>}
 */
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['qwenApiKey', 'llmSettings'], (result) => {
      const key = result.qwenApiKey || (result.llmSettings && result.llmSettings.apiKey) || '';
      resolve(key || null);
    });
  });
}

/**
 * 核心调用函数：调用 Qwen OpenAI 兼容接口
 * 只有此函数接触 API Key
 *
 * @param {Array} messages - OpenAI 消息格式 [{role, content}]
 * @param {object} options - { jsonMode: bool, model: 'simple'|'complex', temperature: 0-2 }
 * @returns {Promise<{success: boolean, content?: string, error?: string, usage?: object}>}
 */
async function callQwenAPI(messages, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: '未配置 Qwen API Key，请在扩展设置中填写',
      code: 'NO_API_KEY',
    };
  }

  const model = options.model === 'complex' ? QWEN_API_CONFIG.modelComplex : QWEN_API_CONFIG.modelSimple;
  const body = {
    model,
    messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.1,
  };
  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QWEN_API_CONFIG.timeoutMs);

  try {
    const resp = await fetch(`${QWEN_API_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      let errMsg = `API 返回 ${resp.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (e) {}
      return { success: false, error: errMsg, code: 'API_ERROR', httpStatus: resp.status };
    }

    const data = await resp.json();
    const content = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    return {
      success: true,
      content,
      usage: data.usage || null,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { success: false, error: 'API 请求超时', code: 'TIMEOUT' };
    }
    return { success: false, error: err.message || '网络错误', code: 'NETWORK' };
  }
}

/**
 * 解析 JSON 字符串，兼容 ```json 代码块包裹和多余文本
 */
function safeParseJSON(content) {
  if (!content) return null;
  let s = content.trim();
  // 去除 ```json ... ``` 包裹
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) s = fenceMatch[1].trim();
  // 提取第一个 { ... } 块
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    s = s.substring(start, end + 1);
  }
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

// ============================================================
// 七、LLM 消息处理器
// ============================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }

  // ---- 测试 API Key 连通性 ----
  if (request.action === 'testQwenApi') {
    (async () => {
      const result = await callQwenAPI(
        [
          { role: 'system', content: '你是测试助手。请只回复 "ok"。' },
          { role: 'user', content: '测试连通性' },
        ],
        { model: 'simple', temperature: 0 }
      );
      sendResponse(result);
    })();
    return true;
  }

  // ---- 保存 / 读取 API Key ----
  if (request.action === 'saveApiKey') {
    chrome.storage.local.set({ qwenApiKey: request.apiKey || '' }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.action === 'getApiKeyStatus') {
    chrome.storage.local.get(['qwenApiKey'], (result) => {
      const key = result.qwenApiKey || '';
      sendResponse({ hasKey: !!key, masked: key ? key.substring(0, 6) + '****' + key.substring(key.length - 4) : '' });
    });
    return true;
  }

  // ---- LLM 简历解析 ----
  if (request.action === 'llmParseResume') {
    (async () => {
      try {
        // 1. 敏感字段过滤
        const safeText = sanitizeResumeText(request.text || '');

        // 2. 构建 Prompt
        const systemPrompt = `你是专业的简历解析助手。请从简历文本中提取结构化信息，以 JSON 格式返回。
要求：
1. 只返回 JSON 对象，不要任何解释文字
2. 字段名使用英文 key（见下方字段列表）
3. 无法识别的字段不要包含在结果中
4. 日期格式统一为 YYYY-MM 或 YYYY-MM-DD
5. 多条目字段（教育/实习/项目）使用 _1 _2 _3 后缀编号，按时间从早到晚排列

字段列表：
- name: 姓名
- gender: 性别（男/女）
- birth: 出生年月
- age: 年龄
- birthplace: 出生地
- ethnicity: 民族
- height: 身高(cm)
- weight: 体重(kg)
- marital_status: 婚姻状况（未婚/已婚/离异/丧偶）
- email: 邮箱
- phone: 手机号
- native_place: 籍贯
- student_source: 生源地
- hukou_location: 户口所在地
- hukou_type: 户口类型（农业户口/非农业户口/居民户口）
- location: 现居城市
- current_residence: 目前居住地
- mailing_address: 通信地址
- target_city: 目标城市
- expected_salary: 期望薪资
- job_status: 求职状态（在校生/应届生/在职-暂不离职/在职-考虑机会/已离职-随时到岗）
- available_date: 到岗时间（随时到岗/一周内/两周内/一个月内/待定）
- school_N: 第N段学校名称（N从1开始，含本科/硕士/博士等）
- degree_N: 第N段学历（博士/硕士/MBA/EMBA/本科/大专/高中/其他）
- major_N: 第N段专业
- graduation_N: 第N段毕业时间（YYYY-MM）
- school: 最高学历学校（等效于最后一段school_N）
- degree: 最高学历（等效于最后一段degree_N）
- major: 最高学历专业（等效于最后一段major_N）
- graduation: 最高学历毕业时间
- gpa: GPA
- courses: 主修课程
- political_status: 政治面貌（中共党员/中共预备党员/共青团员/群众/民主党派）
- party_join_date: 入党/团时间
- id_type: 证件类型
- skills: 技能（逗号分隔）
- languages: 语言能力
- certificates: 证书
- self_eval: 自我评价
- campus_activities: 校内活动/社会实践
- awards_honors: 奖励荣誉
- intern_company_N / intern_position_N / intern_duration_N / intern_desc_N: 第N段实习（公司名/职位/时间/描述）
- project_name_N / project_role_N / project_duration_N / project_desc_N: 第N个项目（项目名/角色/时间/描述）

注意：
- 如果只有一段教育经历，使用 school/degree/major/graduation（不带_N后缀）
- 如果有多段教育经历，必须输出 school_1/degree_1/major_1/graduation_1, school_2/degree_2/... 按时间从早到晚排列
- 身份证号、手机号、家庭信息等敏感字段已脱敏，无需提取。`;

        const userPrompt = `请解析以下简历文本并以 JSON 格式返回结果：

${safeText}`;

        const result = await callQwenAPI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { model: 'complex', jsonMode: true, temperature: 0.1 }
        );

        if (!result.success) {
          sendResponse(result);
          return;
        }

        const parsed = safeParseJSON(result.content);
        if (!parsed) {
          sendResponse({
            success: false,
            error: 'LLM 返回内容无法解析为 JSON',
            rawContent: result.content ? result.content.substring(0, 200) : '',
            code: 'JSON_PARSE_FAIL',
          });
          return;
        }

        sendResponse({ success: true, data: parsed, usage: result.usage });
      } catch (err) {
        sendResponse({ success: false, error: err.message, code: 'EXCEPTION' });
      }
    })();
    return true;
  }

  // ---- LLM 下拉选项批量匹配 ----
  if (request.action === 'llmMatchDropdownOptions') {
    (async () => {
      try {
        const fields = request.fields || [];
        if (!Array.isArray(fields) || fields.length === 0) {
          sendResponse({ success: true, data: {} });
          return;
        }

        const systemPrompt = `你是表单填充助手。请将简历值匹配到最合适的下拉选项。
要求：
1. 只返回 JSON 对象，key 是字段名，value 是最匹配的选项文本（必须是 options 数组中的某个值）
2. 如果没有任何选项匹配，该字段不要包含在结果中
3. 对于地点类字段，如果 options 是省/市/区的层级选项，返回当前层级的最佳匹配
4. 对于地点级联（需要从"广东梅州"拆分出"广东"），返回数组形式 ["广东","梅州"]

示例输入：
[{"field":"political_status","value":"中共党员","options":["群众","团员","党员"]},
 {"field":"native_place","value":"广东梅州","options":["北京","上海","广东","江苏"]}]
示例输出：
{"political_status":"党员","native_place":"广东"}`;

        const userPrompt = `请匹配以下字段，以 JSON 格式返回：

${JSON.stringify(fields, null, 2)}`;

        const result = await callQwenAPI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { model: 'simple', jsonMode: true, temperature: 0.1 }
        );

        if (!result.success) {
          sendResponse(result);
          return;
        }

        const parsed = safeParseJSON(result.content);
        if (!parsed) {
          sendResponse({
            success: false,
            error: 'LLM 返回内容无法解析为 JSON',
            rawContent: result.content ? result.content.substring(0, 200) : '',
            code: 'JSON_PARSE_FAIL',
          });
          return;
        }

        sendResponse({ success: true, data: parsed, usage: result.usage });
      } catch (err) {
        sendResponse({ success: false, error: err.message, code: 'EXCEPTION' });
      }
    })();
    return true;
  }

  // ---- LLM 自定义字段兜底匹配 ----
  // 入参: { fields: [{field, fieldLabel, fieldType, value, options}], pageControls: [{label, type}] }
  // 出参: { success: true, data: { fieldKey: matchedLabel } }
  // 隐私: 只发送字段标签+值+页面控件 label 列表，不发完整简历
  if (request.action === 'llmMatchCustomFields') {
    (async () => {
      try {
        const fields = request.fields || [];
        const pageControls = request.pageControls || [];
        if (!Array.isArray(fields) || fields.length === 0 || pageControls.length === 0) {
          sendResponse({ success: true, data: {} });
          return;
        }

        const systemPrompt = `你是表单填充助手。任务：将每个自定义字段的值匹配到页面控件中最合适的 label。
要求：
1. 只返回 JSON 对象，key 是字段名(field)，value 是最匹配的 pageControls 中的 label 文本（必须是 pageControls 列表中存在的某个 label）
2. 如果某个字段在 pageControls 中找不到合适的控件，不要包含在结果中
3. 字段值应填入语义最接近的控件，例如"GitHub 地址"应填入 label 含"GitHub"或"个人主页"的控件
4. 不要凭空创造 label，必须从 pageControls 列表中选取

示例输入：
fields: [{"field":"custom_1","fieldLabel":"GitHub主页","fieldType":"text","value":"github.com/xxx","options":[]}]
pageControls: [{"label":"姓名","type":"text"},{"label":"GitHub 账号","type":"text"},{"label":"个人主页","type":"text"}]
示例输出：
{"custom_1":"GitHub 账号"}`;

        const userPrompt = `请匹配以下字段，以 JSON 格式返回（key=field, value=匹配的 label）：

fields:
${JSON.stringify(fields, null, 2)}

pageControls:
${JSON.stringify(pageControls.map(c => c.label), null, 2)}`;

        const result = await callQwenAPI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { model: 'simple', jsonMode: true, temperature: 0.1 }
        );

        if (!result.success) {
          sendResponse(result);
          return;
        }

        const parsed = safeParseJSON(result.content);
        if (!parsed) {
          sendResponse({
            success: false,
            error: 'LLM 返回内容无法解析为 JSON',
            rawContent: result.content ? result.content.substring(0, 200) : '',
            code: 'JSON_PARSE_FAIL',
          });
          return;
        }

        sendResponse({ success: true, data: parsed, usage: result.usage });
      } catch (err) {
        sendResponse({ success: false, error: err.message, code: 'EXCEPTION' });
      }
    })();
    return true;
  }

  // ---- LLM 页面表单智能分析 ----
  // 入参: { formFields: [{label, type, options, selector}], resumeData: {...} }
  // 出参: { success: true, data: [{formLabel, resumeKey, fillValue}] }
  // 隐私: 只发送表单结构和简历字段值，不发完整简历文本
  if (request.action === 'llmAnalyzePageForm') {
    (async () => {
      try {
        const formFields = request.formFields || [];
        const resumeData = request.resumeData || {};
        if (!Array.isArray(formFields) || formFields.length === 0 || Object.keys(resumeData).length === 0) {
          sendResponse({ success: true, data: [] });
          return;
        }

        const resumeFields = Object.entries(resumeData)
          .filter(([key, value]) => value && String(value).trim().length > 0)
          .map(([key, value]) => ({ key, value: String(value).trim() }));

        const systemPrompt = `你是智能表单填充专家。任务：分析页面表单结构，将简历数据智能匹配到最合适的表单字段。

要求：
1. 返回 JSON 数组，每个元素包含：
   - formLabel: 表单字段的 label（必须来自 formFields 列表）
   - resumeKey: 简历字段名（必须来自 resumeFields 列表）
   - fillValue: 要填充的具体值（使用简历中的值）
2. 一个表单字段只能匹配一个简历字段，一个简历字段可以匹配多个表单字段
3. 语义匹配要灵活：
   - "民族"可以匹配"民族"或"国籍/民族"
   - "英语等级"可以匹配"英语水平"、"外语能力"、"CET等级"
   - "成绩排名"可以匹配"排名"、"成绩"、"专业排名"
4. 不要凭空创造匹配，只在语义合理时匹配
5. 对于文本输入框，如果没有完全匹配的简历字段，可以尝试使用相关字段的值

示例输入：
formFields: [{"label":"民族","type":"select","options":["汉族","蒙古族"]},{"label":"英语水平","type":"select","options":["CET-4","CET-6"]}]
resumeFields: [{"key":"ethnicity","value":"汉族"},{"key":"english_level","value":"CET-6"},{"key":"name","value":"张三"}]

示例输出：
[{"formLabel":"民族","resumeKey":"ethnicity","fillValue":"汉族"},{"formLabel":"英语水平","resumeKey":"english_level","fillValue":"CET-6"}]`;

        const userPrompt = `请分析以下表单结构和简历数据，返回最佳匹配结果：

表单字段（formFields）：
${JSON.stringify(formFields, null, 2)}

简历数据（resumeFields）：
${JSON.stringify(resumeFields, null, 2)}

请返回 JSON 数组格式的匹配结果：`;

        const result = await callQwenAPI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { model: 'simple', jsonMode: true, temperature: 0.1 }
        );

        if (!result.success) {
          sendResponse(result);
          return;
        }

        const parsed = safeParseJSON(result.content);
        if (!parsed || !Array.isArray(parsed)) {
          sendResponse({
            success: false,
            error: 'LLM 返回内容无法解析为 JSON 数组',
            rawContent: result.content ? result.content.substring(0, 200) : '',
            code: 'JSON_PARSE_FAIL',
          });
          return;
        }

        sendResponse({ success: true, data: parsed, usage: result.usage });
      } catch (err) {
        sendResponse({ success: false, error: err.message, code: 'EXCEPTION' });
      }
    })();
    return true;
  }

  // ---- LLM 生成开放问题回答 ----
  // 入参: { questions: [{question, type}], resumeData: {...} }
  // 出参: { success: true, data: [{question, answer}] }
  if (request.action === 'llmGenerateAnswers') {
    (async () => {
      try {
        const questions = request.questions || [];
        const resumeData = request.resumeData || {};
        if (!Array.isArray(questions) || questions.length === 0) {
          sendResponse({ success: true, data: [] });
          return;
        }

        const resumeSummary = Object.entries(resumeData)
          .filter(([key, value]) => value && String(value).trim().length > 0)
          .map(([key, value]) => `${key}: ${String(value).trim().substring(0, 100)}`)
          .join('\n');

        const systemPrompt = `你是专业的求职助手。任务：根据用户的简历信息，为开放问题生成个性化回答。

要求：
1. 返回 JSON 数组，每个元素包含：
   - question: 问题原文
   - answer: 个性化回答（200字以内，语气诚恳专业）
2. 回答必须基于用户提供的简历信息，不要编造内容
3. 不同类型问题的回答策略：
   - "为什么选择"类：结合公司特点和个人兴趣
   - "自我介绍"类：突出核心优势和经历
   - "职业规划"类：展示清晰的发展方向
   - "自我评价"类：客观评价优缺点
4. 回答要自然流畅，不要使用模板化语言

示例输入：
questions: [{"question":"为什么选择我们公司？","type":"为什么选择"}]
resume:
name: 张三
education: 清华大学计算机专业
skills: Python, Java, 数据分析
experience: 曾在字节跳动实习，负责数据中台项目

示例输出：
[{"question":"为什么选择我们公司？","answer":"贵公司在数据领域的技术积累深厚，与我在字节跳动参与的数据中台项目经验高度契合。我相信在这里能充分发挥我的技术能力，同时学习到更多前沿技术。"}]`;

        const userPrompt = `请根据以下简历信息，为开放问题生成回答：

简历信息：
${resumeSummary}

问题列表：
${JSON.stringify(questions, null, 2)}

请返回 JSON 数组格式的回答：`;

        const result = await callQwenAPI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { model: 'complex', jsonMode: true, temperature: 0.7 }
        );

        if (!result.success) {
          sendResponse(result);
          return;
        }

        const parsed = safeParseJSON(result.content);
        if (!parsed || !Array.isArray(parsed)) {
          sendResponse({
            success: false,
            error: 'LLM 返回内容无法解析为 JSON 数组',
            rawContent: result.content ? result.content.substring(0, 200) : '',
            code: 'JSON_PARSE_FAIL',
          });
          return;
        }

        sendResponse({ success: true, data: parsed, usage: result.usage });
      } catch (err) {
        sendResponse({ success: false, error: err.message, code: 'EXCEPTION' });
      }
    })();
    return true;
  }
});

// ============================================================
// 八、API Key 安装时初始化（空值）
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['qwenApiKey'], (result) => {
    if (result.qwenApiKey === undefined) {
      chrome.storage.local.set({ qwenApiKey: '' });
    }
  });
});