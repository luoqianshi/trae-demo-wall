/**
 * 叮咚学 v3 - AI 抽象层（AI 老师 3.0）
 * 提供 OpenAI 兼容 Provider + 本地兜底 Provider
 * 暴露到 window.AI
 *
 * V3 新增：
 *   多轮记忆增强（短期 10 轮 + 长期记忆 localStorage）
 *   情感感知（detectEmotion / getEmotionPrompt）
 *   主动教学策略（TEACHING_STRATEGIES）
 *   多模态输出（formatAIResponse: step/tip/quiz/progress 标记）
 *   人设 V3（PERSONAS_V3 + emotionBoost）
 *   学科 prompt V3（SUBJECT_PROMPTS_V3）
 *
 * 用法:
 *   window.AI.loadConfig()         -> 读取配置
 *   window.AI.saveConfig(cfg)      -> 保存配置
 *   window.AI.hasRealAI()          -> 是否配置了真实 API
 *   window.AI.chat(messages)       -> Promise<string>
 *   window.AI.chatStream(m, cb)    -> 流式：onChunk/onDone/onError
 *   window.AI.explainQuestion(q)   -> Promise<string>
 *   window.AI.generateQuestions()  -> Promise<questions>
 *   window.AI.generateStudyPlan()  -> Promise<string>
 *   window.AI.respondMood(t, e)    -> Promise<string>
 *   window.AI.summarizeWeek()      -> Promise<string>
 *   window.AI.testConnection()     -> Promise<{ok,msg}>
 *   window.AI.generateVariants(q,n)-> Promise<[{q,opts,a,exp}]>
 *   window.AI.analyzeWrongBook(i)  -> Promise<{summary,weaknesses,advice}>
 *   window.AI.generateAdaptivePaper(o) -> Promise<[questions]|null>
 *   window.AI.summarizeTextbook(u) -> Promise<{summary,keyWords,keyPoints,examTips}>
 *   window.AI.ocrQuestion(b64)     -> Promise<{q,opts,a,subject,knowledge}|null>
 *   window.AI.preLearnExplain(t,s) -> 流式回调
 *   window.AI.clearConfig()        -> 清空
 *   window.AI.isParentMode()       -> 家长模式
 *   // V3 新增
 *   window.AI.detectEmotion(text)  -> 'frustrated'|'confused'|'happy'|'bored'|'neutral'
 *   window.AI.formatResponse(text) -> 格式化后的 HTML
 *   window.AI.saveMemory(t, s, sum)-> 保存长期记忆
 *   window.AI.searchMemory(query)  -> 检索相关记忆
 *   window.AI.getTeachingStrategy(e)-> 教学策略文本
 *   window.AI.PERSONAS_V3          -> V3 人设对象
 *   window.AI.SUBJECT_PROMPTS_V3   -> V3 学科 prompt
 */
(function (window) {
  'use strict';

  var STORAGE_KEY = 'dingstudy_ai_config_v1';

  var DEFAULT_CONFIG = {
    enabled: false,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.5,
    persona: 'gentle',     // gentle / strict / senior / magical / peer
    parentMode: false
  };

  /** 5 套人设（含名称/图标/描述/system prompt） */
  var PERSONAS = {
    gentle: {
      name: '温柔大姐姐',
      icon: '🌸',
      desc: '亲切耐心，多鼓励',
      system:
        '你是一位温柔的小学老师，名字叫叮咚姐姐。你回答问题亲切、耐心，' +
        '多用"宝贝""没关系"等温暖的词，多给鼓励和表扬。回答问题不超过 300 字，' +
        '语言简单有趣，适合 5-6 年级小学生理解。'
    },
    strict: {
      name: '严格老师',
      icon: '📏',
      desc: '简洁直接，准确严谨',
      system:
        '你是一位严格的老师，回答问题简洁、直接、准确、严谨。' +
        '不啰嗦，不废话，但要有耐心。先给结论，再给解释。' +
        '回答不超过 200 字。如果学生答错，要明确指出错误并给出正确思路。'
    },
    senior: {
      name: '学长学姐',
      icon: '🎓',
      desc: '像朋友一样，幽默风趣',
      system:
        '你是用户的学长/学姐，回答像朋友聊天一样。可以用一些网络用语、表情包，' +
        '幽默风趣，但内容要准确。不要长篇大论，像朋友吐槽一样分享知识。' +
        '回答不超过 250 字。'
    },
    magical: {
      name: '魔法导师',
      icon: '🪄',
      desc: '霍格沃茨风格，沉浸式',
      system:
        '你是霍格沃茨魔法学校的导师，教授学生各种知识魔法。回答要沉浸式、有故事感，' +
        '把每个知识点比作一种魔法。例如：背单词 = 咒语、数学公式 = 炼金术、' +
        '古诗 = 古代预言。回答不超过 300 字，结尾加一句魔法术语。'
    },
    peer: {
      name: '同龄朋友',
      icon: '🐻',
      desc: '像同学一样，平等活泼',
      system:
        '你和用户是同龄的小朋友，在一起讨论学习问题。回答要平等、活泼、有趣，' +
        '像同桌互相讲解。可以用"我""咱们"这样的词，回答不超过 250 字。' +
        '如果遇到不会的，要诚实地说"这个我也不太懂，咱们去问老师吧"。'
    }
  };

  /** 8 学科讲解 prompt */
  var SUBJECT_PROMPTS = {
    math: '你正在教数学。讲解时：1) 分步骤；2) 用具体数字例子；3) 不直接给答案，要引导思考；4) 用小学生能懂的语言。',
    chinese: '你正在教语文。讲解时：1) 分析字词含义；2) 解释典故来源；3) 介绍作者背景；4) 朗读古诗词。',
    english: '你正在教英语。讲解时：1) 用中文解释英文；2) 举一两个例子；3) 和中文对比；4) 教孩子跟读。',
    science: '你正在教科学。讲解时：1) 联系生活实际；2) 给小实验例子；3) 用比喻讲抽象概念；4) 鼓励孩子观察。',
    politics: '你正在教道德与法治。讲解时：1) 联系生活；2) 讲小故事；3) 引导思考；4) 强调正确价值观。',
    history: '你正在教历史。讲解时：1) 讲有趣的故事；2) 给时间线；3) 介绍人物特点；4) 联系今天。',
    music: '你正在教音乐。讲解时：1) 用节拍和旋律；2) 推荐相似歌曲；3) 教简单的乐理；4) 鼓励多听。',
    art: '你正在教美术。讲解时：1) 描述画面；2) 介绍艺术家；3) 教小技巧；4) 鼓励孩子动手画。'
  };

  /** 安全护栏 */
  var SAFETY_GUIDE =
    '\n\n【安全护栏】\n' +
    '1. 拒绝回答：暴力、色情、毒品、自残、敏感政治等不当内容。\n' +
    '2. 如果遇到不太懂的知识，要说"这个我也不太懂，问问老师或家长吧"。\n' +
    '3. 单次回复不超过 500 字，简明扼要。\n' +
    '4. 不替学生做作业：只讲解思路，不直接给完整答案。';

  /* ============== V3 多轮记忆增强 ============== */

  /** localStorage 安全读写 */
  function safeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }

  /**
   * 长期记忆结构：
   * dd.aiMemory = [{ topic, subject, summary, time }]
   * 每次对话结束，AI 自动提取 1-2 条关键知识点保存
   */
  function saveMemory(topic, subject, summary) {
    var mem = safeGet('dd.aiMemory', []);
    mem.push({ topic: topic, subject: subject, summary: summary, time: Date.now() });
    if (mem.length > 200) mem = mem.slice(-200); // 最多 200 条
    safeSet('dd.aiMemory', mem);
  }

  function searchMemory(query) {
    var mem = safeGet('dd.aiMemory', []);
    var q = (query || '').toLowerCase();
    var results = [];
    for (var i = 0; i < mem.length; i++) {
      if (mem[i].topic.toLowerCase().indexOf(q) >= 0 || mem[i].summary.toLowerCase().indexOf(q) >= 0) {
        results.push(mem[i]);
      }
    }
    return results.slice(0, 5); // 最多 5 条相关记忆
  }

  /** 从 AI 回复中提取关键知识点并保存到长期记忆 */
  function _extractAndSaveMemory(userMsg, aiReply, subject) {
    if (!aiReply || !userMsg) return;
    // 简单提取：取用户输入中的关键词作为 topic，AI 回复的前 60 字作为 summary
    var topic = userMsg.replace(/[，。！？、；：""''（）\[\]{}【】…—\s]+/g, ' ').trim();
    if (topic.length > 20) topic = topic.substring(0, 20) + '...';
    var summary = aiReply.replace(/\n/g, ' ').trim();
    if (summary.length > 60) summary = summary.substring(0, 60) + '...';
    saveMemory(topic, subject || 'general', summary);
  }

  /* ============== V3 情感感知 ============== */

  var EMOTION_PATTERNS = {
    frustrated: ['不会','不懂','太难了','做不出','搞不懂','崩溃','烦','想放弃','做不来','太难'],
    confused: ['为什么','怎么','什么意思','搞混了','分不清','不太明白','有点懵','没懂'],
    happy: ['会了！','做对了！','太简单','哈哈','太棒了','厉害','开心','懂了！','对了！'],
    bored: ['好无聊','没意思','不想做','太简单了','又是这个','还要做啊']
  };

  function detectEmotion(text) {
    var t = (text || '').toLowerCase();
    var detected = 'neutral';
    var keys = Object.keys(EMOTION_PATTERNS);
    for (var i = 0; i < keys.length; i++) {
      var patterns = EMOTION_PATTERNS[keys[i]];
      for (var j = 0; j < patterns.length; j++) {
        if (t.indexOf(patterns[j]) >= 0) { detected = keys[i]; break; }
      }
      if (detected !== 'neutral') break;
    }
    return detected;
  }

  function getEmotionPrompt(emotion) {
    var prompts = {
      frustrated: '\n注意：学生现在可能感到挫败，请多用鼓励性语言，如"没关系，我们一起来看！"、"你已经很棒了，再试一次！"。降低难度，分小步讲解。',
      confused: '\n注意：学生可能有些困惑，请用更简单的方式解释，多用类比和例子，避免术语。',
      happy: '\n注意：学生现在很开心，可以适当增加挑战，夸奖并引导深入思考。',
      bored: '\n注意：学生可能觉得无聊，请用更有趣的方式讲解，加入故事、游戏化元素。',
      neutral: ''
    };
    return prompts[emotion] || '';
  }

  /* ============== V3 主动教学策略 ============== */

  var TEACHING_STRATEGIES = {
    afterExplain: '\n\n💡 讲解完毕。你可以：\n1. 让我出一道类似的题练练手\n2. 继续问其他问题\n3. 让我换个方式再讲一遍',
    afterCorrect: '\n\n🌟 答对了！太厉害了！要不要挑战更难一点的？',
    afterWrong: '\n\n没关系，我们一起来看哪里不对。要我换个方式讲解吗？',
    afterThreeWrong: '\n\n看来这个知识点还需要多练练。要不我们先从更简单的开始？',
    reviewReminder: '\n\n📅 这个知识点上次是{days}天前学的，根据遗忘曲线该复习了！要我帮你复习一下吗？'
  };

  /* ============== V3 多模态输出 ============== */

  function formatAIResponse(text) {
    if (!text) return text;
    // 步骤标记 [step:N]内容
    text = text.replace(/\[step:(\d+)\]\s*(.*?)(?=\[step:|\[|$)/g, function(_, n, content) {
      return '<div class="ai-step"><span class="ai-step-num">' + n + '</span><span class="ai-step-text">' + content.trim() + '</span></div>';
    });
    // 提示标记 [tip]内容
    text = text.replace(/\[tip\]\s*(.*?)(?=\[|$)/g, function(_, content) {
      return '<div class="ai-tip">' + content.trim() + '</div>';
    });
    // 题目标记 [quiz]内容
    text = text.replace(/\[quiz\]\s*(.*?)(?=\[|$)/g, function(_, content) {
      return '<div class="ai-quiz">' + content.trim() + '</div>';
    });
    // 进度标记 [progress:N%]
    text = text.replace(/\[progress:(\d+)%\]/g, function(_, pct) {
      return '<div class="ai-progress"><div class="ai-progress-bar" style="width:' + pct + '%"></div></div>';
    });
    return text;
  }

  /* ============== V3 人设升级 ============== */

  var PERSONAS_V3 = {
    gentle: {
      name: '温柔大姐姐',
      emoji: '🌸',
      system: '你是一位温柔耐心的女老师，声音像春风一样。你总是先夸奖学生的努力，再温柔地指出问题。你善于用生活中的小故事来解释抽象概念。你从不说"你错了"，而是说"我们再来看看这里～"。你的口头禅是"真棒！"、"你真聪明！"。回答不超过500字，用中文。',
      emotionBoost: { frustrated: '加倍温柔和耐心', confused: '用更多类比' }
    },
    strict: {
      name: '严格老师',
      emoji: '📏',
      system: '你是一位严谨负责的老师，像孔子一样严格要求。你会指出每一个小错误，但也会为每一个进步鼓掌。你注重解题规范和思维过程，经常说"过程比答案更重要"。你会追问"为什么？"来引导学生深入思考。回答不超过500字，用中文。',
      emotionBoost: { frustrated: '严肃但鼓励', confused: '逐步推导' }
    },
    senior: {
      name: '学长学姐',
      emoji: '🎓',
      system: '你是一位刚考上重点中学的学长/学姐，你理解学弟学妹的苦恼，因为你也曾经这样。你用同龄人的语言讲解，偶尔开个玩笑活跃气氛。你会分享自己的学习技巧和记忆口诀。你的口头禅是"我当年也是这样～"、"教你个秘招！"。回答不超过500字，用中文。',
      emotionBoost: { frustrated: '共情+分享经历', confused: '用口诀和技巧' }
    },
    magic: {
      name: '魔法导师',
      emoji: '🪄',
      system: '你是一位来自魔法世界的导师，你把数学变成魔法咒语，语文变成魔法卷轴，英语变成异世界语言。你用奇幻故事包装知识点，让学生在冒险中学习。你的口头禅是"施展魔法！"、"哇，魔力提升了！"。回答不超过500字，用中文。',
      emotionBoost: { frustrated: '用冒险故事激励', confused: '用魔法比喻' }
    },
    peer: {
      name: '同龄朋友',
      emoji: '🐻',
      system: '你是一位和用户同年级的好朋友，你们一起学习一起玩。你不会说教，而是说"我们一起来！"、"我也觉得这个好难！"。你会和用户一起讨论，偶尔也装傻让用户来教你（费曼技巧）。你的口头禅是"诶我也不会，我们一起看！"。回答不超过500字，用中文。',
      emotionBoost: { frustrated: '一起吐槽再一起解决', confused: '一起查资料' }
    }
  };

  /* ============== V3 学科 prompt 升级 ============== */

  var SUBJECT_PROMPTS_V3 = {
    math: '数学教学策略：先用具体数字举例，再抽象出公式。引导学生自己发现规律。鼓励多种解法。画图辅助理解。',
    chinese: '语文教学策略：先朗读感受语言之美，再分析结构和手法。联系生活实际。积累好词好句。培养语感。',
    english: '英语教学策略：创设情境记忆单词。用歌谣/顺口溜帮助记忆。反复练习句型。鼓励大胆开口。',
    science: '科学教学策略：从生活中的现象引入。鼓励动手实验。用"为什么？"激发好奇心。联系其他学科。',
    politics: '道法教学策略：用真实案例引入。引导价值判断。联系时事新闻。角色代入思考。',
    history: '历史教学策略：讲故事为主。时间线可视化。人物角色代入。以史为鉴联系现实。',
    music: '音乐教学策略：先听后学。用身体节奏感受。创编简单旋律。了解音乐背后的故事。',
    art: '美术教学策略：先观察后创作。从大师作品学习。鼓励自由表达。发现生活中的美。'
  };

  var config = null;

  /* ============== 配置管理 ============== */

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); return config; }
      var parsed = JSON.parse(raw);
      config = {};
      for (var k in DEFAULT_CONFIG) config[k] = (typeof parsed[k] === typeof DEFAULT_CONFIG[k]) ? parsed[k] : DEFAULT_CONFIG[k];
      return config;
    } catch (e) {
      config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      return config;
    }
  }

  function saveConfig(cfg) {
    cfg = cfg || config;
    if (!cfg) cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    var safe = {};
    for (var k in DEFAULT_CONFIG) safe[k] = (typeof cfg[k] === typeof DEFAULT_CONFIG[k]) ? cfg[k] : DEFAULT_CONFIG[k];
    config = safe;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch (e) {}
    return safe;
  }

  function clearConfig() {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    return config;
  }

  function hasRealAI() {
    if (!config) loadConfig();
    return !!(config.enabled && config.apiKey && !config.parentMode);
  }

  function isParentMode() {
    if (!config) loadConfig();
    return !!config.parentMode;
  }

  /* ============== 构造 system prompt ============== */

  function buildSystemPrompt(opts) {
    opts = opts || {};
    var persona = (opts.persona || (config && config.persona) || 'gentle');
    var subject = opts.subject || '';
    var useV3 = opts.useV3 !== false; // 默认使用 V3
    var emotion = opts.emotion || 'neutral';

    // V3 人设优先，回退到 V2
    var p;
    if (useV3 && PERSONAS_V3[persona]) {
      p = PERSONAS_V3[persona];
    } else {
      p = PERSONAS[persona] || PERSONAS.gentle;
    }
    var lines = [p.system];

    // V3 学科 prompt 优先
    if (subject && SUBJECT_PROMPTS_V3[subject] && useV3) {
      lines.push(SUBJECT_PROMPTS_V3[subject]);
    } else if (subject && SUBJECT_PROMPTS[subject]) {
      lines.push(SUBJECT_PROMPTS[subject]);
    }

    // V3 情感感知注入
    if (emotion && emotion !== 'neutral') {
      lines.push(getEmotionPrompt(emotion));
      // V3 人设情感加成
      if (p.emotionBoost && p.emotionBoost[emotion]) {
        lines.push('【情感加成】' + p.emotionBoost[emotion]);
      }
    }

    // V3 记忆检索注入
    if (opts.userMsg && useV3) {
      var memResults = searchMemory(opts.userMsg);
      if (memResults.length > 0) {
        var memText = '【之前学过的相关知识】\n';
        for (var mi = 0; mi < memResults.length; mi++) {
          memText += '- ' + memResults[mi].topic + '：' + memResults[mi].summary + '\n';
        }
        lines.push(memText);
      }
    }

    if (opts.extra) lines.push(opts.extra);
    lines.push(SAFETY_GUIDE);
    return lines.join('\n\n');
  }

  /* ============== OpenAI 兼容 Provider ============== */

  function _endpoint() {
    var base = (config.baseUrl || '').replace(/\/+$/, '');
    return base + '/chat/completions';
  }

  function _timeoutPromise(ms) {
    return new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('请求超时（' + (ms / 1000) + ' 秒）')); }, ms);
    });
  }

  /** 非流式 */
  function callRealAPI(messages, opts) {
    opts = opts || {};
    if (!config || !config.apiKey) return Promise.reject(new Error('未配置 API Key'));
    var body = {
      model: config.model || 'deepseek-chat',
      messages: messages,
      temperature: typeof config.temperature === 'number' ? config.temperature : 0.5,
      stream: false
    };
    var url = _endpoint();
    var p = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (t) {
          var msg = 'HTTP ' + resp.status;
          if (resp.status === 401 || resp.status === 403) msg += '：API Key 无效或无权限';
          else if (resp.status === 404) msg += '：地址错误，请检查 Base URL';
          else if (resp.status === 429) msg += '：请求太频繁，请稍后再试';
          else msg += '：' + (t || '').substring(0, 200);
          throw new Error(msg);
        });
      }
      return resp.json();
    }).then(function (data) {
      var choice = data && data.choices && data.choices[0];
      if (!choice) throw new Error('返回数据格式异常');
      var content = choice.message && choice.message.content;
      if (!content) throw new Error('AI 没有返回内容');
      return content;
    });
    return Promise.race([p, _timeoutPromise(30000)]);
  }

  /** 流式（解析 SSE） - V3 增强版 */
  function chatStream(messages, callbacks) {
    callbacks = callbacks || {};
    if (!config || !config.apiKey) {
      var err = new Error('未配置 API Key');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }

    // V3：情感感知 + 注入 system prompt
    var userMsg = _lastUserMsg(messages);
    var emotion = detectEmotion(userMsg);
    if (emotion !== 'neutral' && Array.isArray(messages)) {
      for (var ei = 0; ei < messages.length; ei++) {
        if (messages[ei].role === 'system') {
          messages[ei].content += getEmotionPrompt(emotion);
          break;
        }
      }
    }

    // V3：流式收集完整回复用于记忆保存
    var fullReply = '';

    var body = {
      model: config.model || 'deepseek-chat',
      messages: messages,
      temperature: typeof config.temperature === 'number' ? config.temperature : 0.5,
      stream: true
    };
    var url = _endpoint();
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (t) {
          var msg = 'HTTP ' + resp.status;
          if (resp.status === 401 || resp.status === 403) msg += '：API Key 无效或无权限';
          else if (resp.status === 404) msg += '：地址错误，请检查 Base URL';
          else if (resp.status === 429) msg += '：请求太频繁，请稍后再试';
          else msg += '：' + (t || '').substring(0, 200);
          throw new Error(msg);
        });
      }
      if (!resp.body || !resp.body.getReader) {
        // 浏览器不支持流式
        return resp.json().then(function (data) {
          var c = data && data.choices && data.choices[0];
          var content = c && c.message && c.message.content;
          if (content) {
            fullReply = content;
            if (callbacks.onChunk) callbacks.onChunk(formatAIResponse(content));
          }
          // V3：保存记忆
          _extractAndSaveMemory(userMsg, fullReply);
          if (callbacks.onDone) callbacks.onDone();
        });
      }
      var reader = resp.body.getReader();
      var decoder = new TextDecoder('utf-8');
      var buffer = '';
      function readNext() {
        return reader.read().then(function (result) {
          if (result.done) {
            if (buffer.trim()) {
              var lastLines = buffer.split('\n');
              for (var li = 0; li < lastLines.length; li++) _parseLine(lastLines[li]);
            }
            // V3：流式结束，保存记忆
            _extractAndSaveMemory(userMsg, fullReply);
            if (callbacks.onDone) callbacks.onDone();
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop();
          for (var i = 0; i < lines.length; i++) _parseLine(lines[i]);
          return readNext();
        });
      }
      function _parseLine(line) {
        var t = (line || '').trim();
        if (!t || !t.startsWith('data:')) return;
        var data = t.slice(5).trim();
        if (data === '[DONE]') {
          // V3：保存记忆
          _extractAndSaveMemory(userMsg, fullReply);
          if (callbacks.onDone) callbacks.onDone();
          return;
        }
        try {
          var json = JSON.parse(data);
          var delta = json.choices && json.choices[0] && json.choices[0].delta;
          if (delta && delta.content) {
            fullReply += delta.content;
            if (callbacks.onChunk) callbacks.onChunk(delta.content);
          }
        } catch (e) { /* ignore */ }
      }
      return readNext();
    }).catch(function (e) {
      if (callbacks.onError) callbacks.onError(e);
      throw e;
    });
  }

  /* ============== 本地兜底 Provider ============== */

  /** 安全检查：判断输入是否属于禁止话题 */
  function _isUnsafe(t) {
    if (!t) return false;
    var bad = ['自杀','自残','毒品','色情','裸体','杀人','炸弹','恐怖袭击','邪教'];
    var lower = String(t).toLowerCase();
    for (var i = 0; i < bad.length; i++) if (lower.indexOf(bad[i]) >= 0) return true;
    return false;
  }

  /** 数学计算 */
  function _tryCalc(t) {
    var m = t.match(/(-?\d+(?:\.\d+)?)\s*([\+\-\*\/×x÷%])\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    var a = parseFloat(m[1]);
    var b = parseFloat(m[3]);
    var op = m[2];
    var sym = op;
    if (op === 'x' || op === 'X') { op = '*'; sym = '×'; }
    if (op === '÷') { op = '/'; sym = '÷'; }
    var r;
    if (op === '+') r = a + b;
    else if (op === '-') r = a - b;
    else if (op === '*') r = a * b;
    else if (op === '/') {
      if (b === 0) return a + ' 不能除以 0 哦';
      r = a / b;
    } else if (op === '%') r = a % b;
    else return null;
    var rs = (r === Math.floor(r)) ? String(r) : r.toFixed(4).replace(/\.?0+$/, '');
    return a + ' ' + sym + ' ' + b + ' = ' + rs;
  }

  /** 心情识别 */
  var MOOD_MAP = [
    { keys: ['开心','高兴','快乐','兴奋','哈哈','嘻嘻','幸福'], reply: '听到你这么开心，叮咚也觉得很开心呢！继续做点有趣的事，让自己一直保持好心情吧！' },
    { keys: ['难过','伤心','悲伤','哭','委屈','失望'], reply: '宝贝，难过是正常的。抱抱你。要不要和我说说发生了什么？也许说出来会好受一些。' },
    { keys: ['生气','愤怒','讨厌','烦','气死'], reply: '生气啦？先深呼吸三次，1...2...3...。气坏了身体可不值得，要不要告诉我是什么事让你这么生气？' },
    { keys: ['害怕','恐惧','担心','紧张','焦虑'], reply: '没事的，宝贝。你能告诉叮咚是什么让你担心吗？我们一起想办法。' },
    { keys: ['累','疲惫','困','疲倦','没劲'], reply: '辛苦了！记得劳逸结合哦。休息一下再继续，会更有效率。' },
    { keys: ['无聊','没事干'], reply: '无聊的时候可以做这些：1) 读一本有趣的书；2) 听一首喜欢的歌；3) 出门散散步；4) 来做几道题吧！' },
    { keys: ['无聊','孤独','一个人'], reply: '叮咚一直陪着你呢！要不要聊聊天，或者做几道有趣的题？' }
  ];
  function _moodReply(t) {
    for (var i = 0; i < MOOD_MAP.length; i++) {
      var m = MOOD_MAP[i];
      for (var j = 0; j < m.keys.length; j++) {
        if (t.indexOf(m.keys[j]) >= 0) return m.reply;
      }
    }
    return null;
  }

  /** 学科关键词 */
  var SCIENCE_FACTS = {
    '水的化学式': '水的化学式是 H₂O，2 个氢原子和 1 个氧原子组成。',
    '光速': '光在真空中的速度约为 30 万公里/秒。',
    '声音': '声音是由物体振动产生的，靠介质传播，真空中不能传声。',
    '地球': '地球是太阳系八大行星之一，是唯一有生命的星球。',
    '太阳系': '太阳系以太阳为中心，包括 8 大行星：水星、金星、地球、火星、木星、土星、天王星、海王星。',
    '植物': '植物通过光合作用制造养分，需要阳光、水和空气。',
    '动物': '动物分脊椎动物和无脊椎动物，会动、需要吃东西。',
    '光合作用': '植物的叶子利用阳光、水和二氧化碳制造养分，并释放氧气。',
    '心脏': '人的心脏在胸腔左侧偏下，是血液循环的动力泵。',
    '重力': '物体由于地球的吸引而受到的力叫重力，方向竖直向下。',
    '元素': '化学元素是组成物质的基本单位，目前已知 118 种。'
  };
  function _scienceReply(t) {
    for (var k in SCIENCE_FACTS) {
      if (t.indexOf(k) >= 0) return SCIENCE_FACTS[k];
    }
    if (/为什么|怎么回事|原理/.test(t) && /雨|风|雷|电|雪|水|火|光/.test(t)) {
      return '这是一个有趣的问题！你可以观察生活或者做个小实验来验证，比如...（开启 AI 老师可以给你更详细的解释哦）';
    }
    return null;
  }

  /** 古诗查询 */
  function _poemReply(t) {
    var DD = window.DD;
    if (!DD || !DD.ARTICLES) return null;
    for (var i = 0; i < DD.ARTICLES.length; i++) {
      var a = DD.ARTICLES[i];
      if (t.indexOf(a.title) >= 0 || t.indexOf(a.author) >= 0) {
        return '《' + a.title + '》' + a.author + '：\n' + a.text + '\n\n意思：' + a.translation;
      }
    }
    return null;
  }

  /** 字词典查询 */
  function _dictReply(t) {
    var DD = window.DD;
    if (!DD || !DD.DICT) return null;
    // 提取可能的中文词
    var m = t.match(/[\u4e00-\u9fa5]{2,8}/g);
    if (!m) return null;
    for (var i = 0; i < m.length; i++) {
      var w = m[i];
      for (var j = 0; j < DD.DICT.length; j++) {
        var d = DD.DICT[j];
        if (d.meaning === w || (d.meaning && d.meaning.indexOf(w) >= 0)) {
          var out = d.meaning + ' [' + d.pinyin + '] 英：' + d.en + '\n例句：' + d.example;
          if (d.near && d.near.length) out += '\n近义词：' + d.near.join('、');
          if (d.ant && d.ant.length) out += '\n反义词：' + d.ant.join('、');
          return out;
        }
      }
    }
    return null;
  }

  /** 学科知识点 */
  var KNOWLEDGE = {
    '圆的面积': '圆的面积 = π × r²（π 取 3.14）。',
    '圆的周长': '圆的周长 = 2 × π × r。',
    '三角形面积': '三角形的面积 = 底 × 高 ÷ 2。',
    '长方形面积': '长方形面积 = 长 × 宽。',
    '加减乘除': '加（+）、减（-）、乘（×）、除（÷），是数学的四种基本运算。',
    '九九乘法': '1×1=1, 1×2=2 ... 9×9=81，背熟对以后学数学很有帮助。',
    '古诗': '古诗讲究押韵和意境，多读多背可以培养语感。',
    '拼音': '汉语拼音有 23 个声母、24 个韵母、4 个声调。',
    '英语': '学英语要多听多说，可以看英文动画、唱英文歌。'
  };
  function _knowledgeReply(t) {
    for (var k in KNOWLEDGE) {
      if (t.indexOf(k) >= 0) return k + '：' + KNOWLEDGE[k];
    }
    return null;
  }

  /** 本地入口：未配置真实 AI 时的兜底 */
  function callLocalAI(text, ctx) {
    ctx = ctx || {};
    var t = (text || '').trim();
    if (!t) return Promise.resolve('你想问什么呢？');

    if (_isUnsafe(t)) {
      return Promise.resolve('这个问题我没办法回答，你可以问问老师或者家长。');
    }

    // 1) 计算
    var calc = _tryCalc(t);
    if (calc) return Promise.resolve(calc);

    // 2) 心情
    var mood = _moodReply(t);
    if (mood) return Promise.resolve(mood);

    // 3) 学科
    var sci = _scienceReply(t);
    if (sci) return Promise.resolve(sci);

    // 4) 知识
    var k = _knowledgeReply(t);
    if (k) return Promise.resolve(k);

    // 5) 古诗
    var poem = _poemReply(t);
    if (poem) return Promise.resolve(poem);

    // 6) 字典
    var dict = _dictReply(t);
    if (dict) return Promise.resolve(dict);

    // 7) 寒暄
    if (/你好|hi|hello|嗨|hey/i.test(t)) {
      return Promise.resolve('你好！我是叮咚的 AI 老师。配置 API Key 后可以和我深度对话哦～也可以问我数学题、查字典、读古诗。');
    }
    if (/谢谢|thank/i.test(t)) {
      return Promise.resolve('不客气！能帮到你我很开心～');
    }
    if (/你是谁|你叫什么/.test(t)) {
      return Promise.resolve('我是叮咚的 AI 老师，会算数、查字典、读古诗、讲知识。配置 API Key 后可以更聪明地和你聊天。');
    }
    if (/怎么学|如何学|学习/.test(t)) {
      return Promise.resolve('学习小建议：1) 每天做 5-10 道题；2) 整理错题本，定期复习；3) 多读课外书；4) 劳逸结合，效率第一。');
    }
    if (/成语|故事|古诗/.test(t)) {
      return Promise.resolve('古诗推荐：' + '《静夜思》（李白）床前明月光，疑是地上霜。');
    }
    if (/奖励|金币|叮咚币/.test(t)) {
      return Promise.resolve('答对题目可获得叮咚币和经验，连击还有额外奖励！');
    }

    // 8) 兜底
    return Promise.resolve(
      '这是个有趣的问题～配置 API Key 后我可以回答得更详细。' +
      '你也可以试着问我：' +
      '\n· 数学题（如 12×5）' +
      '\n· 字词（如 "苹果怎么写"）' +
      '\n· 古诗（如 "静夜思"）' +
      '\n· 科学小知识（如 "水的化学式"）'
    );
  }

  /* ============== 通用 chat 接口 ============== */

  /** 从 messages 中提取最后一条用户消息 */
  function _lastUserMsg(messages) {
    if (!Array.isArray(messages)) return '';
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        var c = messages[i].content;
        if (typeof c === 'string') return c;
        // 多模态消息：提取 text 部分
        if (Array.isArray(c)) {
          for (var k = 0; k < c.length; k++) {
            if (c[k].type === 'text' && c[k].text) return c[k].text;
          }
        }
        return '';
      }
    }
    return '';
  }

  function chat(messages, opts) {
    opts = opts || {};
    var userMsg = _lastUserMsg(messages);

    // V3：情感感知
    var emotion = detectEmotion(userMsg);
    opts._emotion = emotion;

    // V3：构建增强的 system prompt（如果 messages 中有 system 消息则替换）
    if (opts.useV3 !== false && emotion !== 'neutral') {
      // 找到 system 消息并注入情感
      if (Array.isArray(messages)) {
        for (var si = 0; si < messages.length; si++) {
          if (messages[si].role === 'system') {
            messages[si].content += getEmotionPrompt(emotion);
            break;
          }
        }
      }
    }

    if (hasRealAI()) {
      return callRealAPI(messages, opts).then(function (reply) {
        // V3：格式化回复
        var formatted = formatAIResponse(reply);
        // V3：保存到长期记忆
        _extractAndSaveMemory(userMsg, reply, opts.subject);
        return formatted;
      }).catch(function (e) {
        console.warn('[AI] 真实 API 失败，降级本地：', e.message);
        return callLocalAI(userMsg, opts).then(function (localReply) {
          var full = '（AI 暂不可用：' + e.message + '）\n' + localReply;
          // V3：格式化并保存
          _extractAndSaveMemory(userMsg, localReply, opts.subject);
          return formatAIResponse(full);
        });
      });
    }
    // 没配置：直接本地
    return callLocalAI(userMsg, opts).then(function (localReply) {
      _extractAndSaveMemory(userMsg, localReply, opts.subject);
      return formatAIResponse(localReply);
    });
  }

  /* ============== 高级功能 ============== */

  /** 题目讲解 */
  function explainQuestion(q, opts) {
    opts = opts || {};
    var subject = opts.subject || (q && q.subject) || 'general';
    var sys = buildSystemPrompt({ subject: subject });
    var userText = '请讲解这道题：\n' +
      '题目：' + (q.q || '') + '\n' +
      '选项：' + (q.opts ? q.opts.map(function (o, i) { return (i + 1) + '. ' + o; }).join(' / ') : '（无）') + '\n' +
      '正确答案：' + (q.opts && typeof q.a === 'number' ? q.opts[q.a] : '（无）') + '\n' +
      (q.exp ? '已有提示：' + q.exp + '\n' : '') +
      '\n请：1) 解释考查的知识点；2) 给出详细解题思路；3) 教孩子怎么想到答案。';
    return chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ], opts);
  }

  /** AI 出题（JSON 格式） */
  function generateQuestions(subject, difficulty, count) {
    count = count || 5;
    difficulty = difficulty || 'normal';
    var sys = buildSystemPrompt({ subject: subject }) +
      '\n你是一个出题老师，请输出严格 JSON 格式的题目数组。';
    var userText = '请出 ' + count + ' 道 ' + subject + ' 学科的题目，难度 ' + difficulty + '，适合 5-6 年级小学生。\n' +
      '输出 JSON 数组，每个元素结构：\n' +
      '{ "q": "题目", "opts": ["A", "B", "C", "D"], "a": 正确答案索引(0-3), "exp": "解释", "diff": "' + difficulty + '", "subject": "' + subject + '" }\n' +
      '只输出 JSON，不要其他文字。';
    return chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]).then(function (text) {
      // 解析 JSON（兼容可能的代码块）
      try {
        var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        var arr = JSON.parse(cleaned);
        if (!Array.isArray(arr)) return [];
        return arr.slice(0, count);
      } catch (e) {
        console.warn('[AI] 解析生成题目失败：', e);
        return [];
      }
    });
  }

  /** 学习计划 */
  function generateStudyPlan(state) {
    state = state || {};
    var sys = buildSystemPrompt({});
    var userText = '请为下面的小学生生成一个简单的 7 天学习计划：\n' +
      '年级：' + (state.grade || '五年级') + '\n' +
      '当前等级：' + (state.level || 1) + '\n' +
      '积分：' + (state.coin || 0) + '\n' +
      '要求：每天 3-5 个学习任务，包含学科、预计时间、小目标。' +
      '输出不超过 400 字。';
    return chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]);
  }

  /** 心情陪伴 */
  function respondMood(text, emoji) {
    var sys = buildSystemPrompt({}) +
      '\n你是孩子的暖心朋友，记录并回应孩子的情绪。' +
      '回复风格：温暖、简短（不超过 200 字）、不评判、给出小建议。';
    var userText = '孩子刚才记下了心情：' + (emoji || '😊') + '\n' +
      '写的内容是：' + (text || '（没有写）') +
      '\n请用温暖的语气回应一下，可以问一个小问题。';
    return chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]);
  }

  /** 周报总结 */
  function summarizeWeek(state) {
    state = state || {};
    var sys = buildSystemPrompt({});
    var userText = '这是孩子本周的学习数据：\n' +
      '答题数：' + (state.total || 0) + '\n' +
      '正确数：' + (state.correct || 0) + '\n' +
      '正确率：' + (state.ratio || 0) + '%\n' +
      '各学科情况：' + JSON.stringify(state.bySub || {}) + '\n' +
      '\n请用亲切的语言给出本周总结：1) 亮点 2) 待改进 3) 下周建议。' +
      '不超过 300 字。';
    return chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]);
  }

  /** 测试连接 */
  function testConnection() {
    if (!config || !config.apiKey) {
      return Promise.resolve({ ok: false, msg: '请先填写 API Key' });
    }
    var sys = buildSystemPrompt({});
    var body = {
      model: config.model || 'deepseek-chat',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: '请用一句话回复"连接成功"' }
      ],
      temperature: 0.3,
      stream: false,
      max_tokens: 30
    };
    var url = _endpoint();
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (t) {
          var msg = 'HTTP ' + resp.status;
          if (resp.status === 401 || resp.status === 403) msg += '：API Key 无效或无权限';
          else if (resp.status === 404) msg += '：地址错误，请检查 Base URL';
          else if (resp.status === 429) msg += '：请求太频繁';
          else msg += '：' + (t || '').substring(0, 120);
          return { ok: false, msg: msg };
        });
      }
      return resp.json().then(function (data) {
        var c = data && data.choices && data.choices[0];
        if (!c) return { ok: false, msg: '返回数据格式异常' };
        return { ok: true, msg: '连接成功！' + ((c.message && c.message.content) ? ' 模型返回：' + c.message.content.substring(0, 40) : '') };
      });
    }).catch(function (e) {
      return { ok: false, msg: '网络错误：' + (e.message || '未知错误') + '（可能 CORS 跨域问题）' };
    });
  }

  /* ============== v3 新增能力 ============== */

  /** 1. 举一反三：为错题生成同知识点变种题 */
  function generateVariants(question, count) {
    count = count || 3;
    var q = question.q || '';
    var opts = question.opts || [];
    var a = question.a;
    var subject = question.subject || 'general';
    var knowledge = question.knowledge || '';

    if (hasRealAI()) {
      var sys = buildSystemPrompt({ subject: subject }) +
        '\n你是一位小学老师，请根据题目生成同知识点但不同数字/情境的变种题。输出严格 JSON 数组。';
      var userText = '原题：' + q + '\n' +
        '选项：' + (opts.length ? opts.join(' / ') : '（无）') + '\n' +
        '答案：' + (typeof a === 'number' && opts[a] ? opts[a] : String(a || '')) + '\n' +
        (knowledge ? '知识点：' + knowledge + '\n' : '') +
        '\n请生成 ' + count + ' 道同知识点但不同数字或情境的变种题。\n' +
        '返回 JSON 数组，每个元素：{ "q": "题目", "opts": ["A","B","C","D"], "a": 答案索引(0-3), "exp": "解析" }\n' +
        '只输出 JSON，不要其他文字。';

      return callRealAPI([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ]).then(function (text) {
        try {
          var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          var arr = JSON.parse(cleaned);
          if (!Array.isArray(arr)) return _variantLocalFallback(question, count);
          return arr.slice(0, count);
        } catch (e) {
          console.warn('[AI] generateVariants 解析失败：', e);
          return _variantLocalFallback(question, count);
        }
      }).catch(function (e) {
        console.warn('[AI] generateVariants API 失败，降级本地：', e.message);
        return _variantLocalFallback(question, count);
      });
    }
    return Promise.resolve(_variantLocalFallback(question, count));
  }

  /** generateVariants 本地兜底：简单替换数字 */
  function _variantLocalFallback(question, count) {
    var result = [];
    var q = question.q || '';
    var opts = question.opts || [];
    var a = question.a;
    for (var i = 0; i < count; i++) {
      var newQ = q;
      var newOpts = opts.slice();
      // 找出所有数字，随机加减偏移
      newQ = newQ.replace(/(\d+)/g, function (match) {
        var n = parseInt(match, 10);
        if (isNaN(n) || n === 0) return match;
        var offset = Math.floor(Math.random() * 5) + 1;
        return String(n + offset * (i + 1));
      });
      for (var j = 0; j < newOpts.length; j++) {
        newOpts[j] = newOpts[j].replace(/(\d+)/g, function (match) {
          var n = parseInt(match, 10);
          if (isNaN(n) || n === 0) return match;
          var offset = Math.floor(Math.random() * 5) + 1;
          return String(n + offset * (i + 1));
        });
      }
      result.push({ q: newQ, opts: newOpts, a: a, exp: '（本地生成的变种题，解析请参考原题）' });
    }
    return result;
  }

  /** 2. 错题本分析：AI 分析薄弱点 */
  function analyzeWrongBook(items) {
    items = items || [];

    if (hasRealAI()) {
      var sys = buildSystemPrompt({}) +
        '\n你是学习分析师，根据学生的错题记录分析薄弱点，返回严格 JSON。';
      var summary = [];
      for (var i = 0; i < items.length && i < 50; i++) {
        summary.push('题' + (i + 1) + '：' + (items[i].q || '') +
          ' | 学科：' + (items[i].subject || '未知') +
          ' | 知识点：' + (items[i].knowledge || '未知') +
          ' | 错误次数：' + (items[i].wrongCount || 1));
      }
      var userText = '学生的错题记录如下：\n' + summary.join('\n') +
        '\n\n请分析薄弱点，返回 JSON：\n' +
        '{ "summary": "总体总结(50字内)", "weaknesses": [{ "subject": "学科", "knowledge": "知识点", "rate": "错误率(如30%)", "suggestion": "改进建议" }], "advice": "总体建议(100字内)" }\n' +
        '只输出 JSON，不要其他文字。';

      return callRealAPI([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ]).then(function (text) {
        try {
          var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          var obj = JSON.parse(cleaned);
          if (typeof obj === 'object' && obj.summary) return obj;
          return _wrongBookLocalFallback(items);
        } catch (e) {
          console.warn('[AI] analyzeWrongBook 解析失败：', e);
          return _wrongBookLocalFallback(items);
        }
      }).catch(function (e) {
        console.warn('[AI] analyzeWrongBook API 失败，降级本地：', e.message);
        return _wrongBookLocalFallback(items);
      });
    }
    return Promise.resolve(_wrongBookLocalFallback(items));
  }

  /** analyzeWrongBook 本地兜底：按学科统计 */
  function _wrongBookLocalFallback(items) {
    var bySubject = {};
    var total = items.length || 1;
    for (var i = 0; i < items.length; i++) {
      var subj = items[i].subject || '未知';
      if (!bySubject[subj]) bySubject[subj] = { count: 0, knowledge: {} };
      bySubject[subj].count++;
      var kn = items[i].knowledge || '综合';
      if (!bySubject[subj].knowledge[kn]) bySubject[subj].knowledge[kn] = 0;
      bySubject[subj].knowledge[kn]++;
    }
    var weaknesses = [];
    for (var s in bySubject) {
      var info = bySubject[s];
      var rate = Math.round((info.count / total) * 100) + '%';
      var topKn = '';
      var topCount = 0;
      for (var k in info.knowledge) {
        if (info.knowledge[k] > topCount) { topCount = info.knowledge[k]; topKn = k; }
      }
      weaknesses.push({
        subject: s,
        knowledge: topKn || '综合',
        rate: rate,
        suggestion: '建议多练习' + s + '的' + (topKn || '基础') + '相关题目'
      });
    }
    return {
      summary: '共有 ' + total + ' 道错题，分布在 ' + weaknesses.length + ' 个学科。',
      weaknesses: weaknesses,
      advice: '建议重点复习错误率较高的学科，每天做几道针对性练习，错题要反复巩固。'
    };
  }

  /** 3. 自适应出题：根据错题和难度生成题目 */
  function generateAdaptivePaper(opts) {
    opts = opts || {};
    var subject = opts.subject || 'math';
    var grade = opts.grade || '五年级';
    var version = opts.version || '人教版';
    var wrongbook = opts.wrongbook || [];
    var count = opts.count || 10;
    var difficulty = opts.difficulty || 'normal';

    if (hasRealAI()) {
      var sys = buildSystemPrompt({ subject: subject }) +
        '\n你是一个自适应出题老师，根据学生情况出题。输出严格 JSON 数组。';
      var wrongSummary = [];
      for (var i = 0; i < wrongbook.length && i < 20; i++) {
        wrongSummary.push((wrongbook[i].q || '') + '（知识点：' + (wrongbook[i].knowledge || '未知') + '）');
      }
      var userText = '学生信息：\n' +
        '年级：' + grade + '\n' +
        '版本：' + version + '\n' +
        '当前难度：' + difficulty + '\n' +
        '错题记录：\n' + (wrongSummary.length ? wrongSummary.join('\n') : '（无）') + '\n\n' +
        '请根据以上信息生成 ' + count + ' 道自适应题目。' +
        '对于错过的知识点，出类似但不同的题目加强练习；' +
        '对于已掌握的知识点，适当提高难度。\n' +
        '返回 JSON 数组，每个元素：{ "q": "题目", "opts": ["A","B","C","D"], "a": 答案索引(0-3), "exp": "解析", "diff": "easy/normal/hard" }\n' +
        '只输出 JSON，不要其他文字。';

      return callRealAPI([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ]).then(function (text) {
        try {
          var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          var arr = JSON.parse(cleaned);
          if (!Array.isArray(arr)) return null;
          return arr.slice(0, count);
        } catch (e) {
          console.warn('[AI] generateAdaptivePaper 解析失败：', e);
          return null;
        }
      }).catch(function (e) {
        console.warn('[AI] generateAdaptivePaper API 失败：', e.message);
        return null;
      });
    }
    return Promise.resolve(null);
  }

  /** 4. 教材单元整理：AI 总结单元知识 */
  function summarizeTextbook(unit) {
    unit = unit || {};
    var subject = unit.subject || 'general';
    var grade = unit.grade || '五年级';
    var title = unit.title || '';
    var lessons = unit.lessons || [];

    if (hasRealAI()) {
      var sys = buildSystemPrompt({ subject: subject }) +
        '\n你是教材分析专家，请整理单元知识，返回严格 JSON。';
      var lessonText = [];
      for (var i = 0; i < lessons.length; i++) {
        lessonText.push('第' + (i + 1) + '课：' + (lessons[i].title || '') +
          '\n内容摘要：' + ((lessons[i].content || '').substring(0, 300)));
      }
      var userText = '学科：' + subject + '\n年级：' + grade + '\n单元：' + title + '\n\n课文列表：\n' +
        (lessonText.length ? lessonText.join('\n\n') : '（无）') +
        '\n\n请整理这个单元的知识，返回 JSON：\n' +
        '{ "summary": "单元总结(100字内)", "keyWords": ["关键词1","关键词2"], "keyPoints": ["要点1","要点2"], "examTips": ["考试提示1","考试提示2"] }\n' +
        '只输出 JSON，不要其他文字。';

      return callRealAPI([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ]).then(function (text) {
        try {
          var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          var obj = JSON.parse(cleaned);
          if (typeof obj === 'object' && obj.summary) return obj;
          return _textbookLocalFallback(unit);
        } catch (e) {
          console.warn('[AI] summarizeTextbook 解析失败：', e);
          return _textbookLocalFallback(unit);
        }
      }).catch(function (e) {
        console.warn('[AI] summarizeTextbook API 失败，降级本地：', e.message);
        return _textbookLocalFallback(unit);
      });
    }
    return Promise.resolve(_textbookLocalFallback(unit));
  }

  /** summarizeTextbook 本地兜底：提取课文标题和首句 */
  function _textbookLocalFallback(unit) {
    unit = unit || {};
    var lessons = unit.lessons || [];
    var keyWords = [];
    var keyPoints = [];
    for (var i = 0; i < lessons.length; i++) {
      var lTitle = lessons[i].title || '';
      var lContent = lessons[i].content || '';
      if (lTitle) {
        keyWords.push(lTitle);
        keyPoints.push(lTitle + '：' + lContent.substring(0, 50));
      }
    }
    return {
      summary: '本单元' + (unit.title || '') + '共 ' + lessons.length + ' 课。',
      keyWords: keyWords.slice(0, 10),
      keyPoints: keyPoints.slice(0, 10),
      examTips: ['请仔细阅读每课内容，重点关注加粗部分']
    };
  }

  /** 5. OCR 识别：AI 识别图片中的题目 */
  function ocrQuestion(imageBase64) {
    if (!imageBase64) return Promise.resolve(null);

    if (hasRealAI()) {
      var sys = buildSystemPrompt({}) +
        '\n你是 OCR 识别专家，请识别图片中的题目并返回 JSON。';
      var prompt = '请识别图片中的题目，返回 JSON：\n' +
        '{ "q": "题目文字", "opts": ["选项A","选项B","选项C","选项D"], "a": 答案索引(0-3,无则为-1), "subject": "学科(如math/chinese等)", "knowledge": "知识点" }\n' +
        '如果没有选项，opts 返回空数组。如果无法识别答案，a 返回 -1。\n' +
        '只输出 JSON，不要其他文字。';

      var messages = [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageBase64 } }
          ]
        }
      ];

      return callRealAPI(messages).then(function (text) {
        try {
          var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          var obj = JSON.parse(cleaned);
          if (typeof obj === 'object' && obj.q) return obj;
          return null;
        } catch (e) {
          console.warn('[AI] ocrQuestion 解析失败：', e);
          return null;
        }
      }).catch(function (e) {
        console.warn('[AI] ocrQuestion API 失败：', e.message);
        return null;
      });
    }
    return Promise.resolve(null);
  }

  /** 6. 预习讲解：三环紧扣-预习环（流式） */
  function preLearnExplain(topic, subject) {
    topic = topic || '';
    subject = subject || 'general';
    var sys = buildSystemPrompt({ subject: subject }) +
      '\n你是小学' + (subject || '') + '老师，正在为学生的预习做讲解。' +
      '讲解要求：1) 先介绍这个知识点是什么；2) 用生活例子帮助理解；' +
      '3) 给出 2-3 个预习思考题；4) 语言简单有趣，适合 5-6 年级。' +
      '不超过 400 字。';
    var userText = '请为学生预习讲解"' + topic + '"，要通俗易懂，激发学习兴趣。';
    var messages = [
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ];
    return chatStream(messages);
  }

  /* ============== 暴露 API ============== */

  // 启动时加载
  loadConfig();

  window.AI = {
    config: config,
    PERSONAS: PERSONAS,
    SUBJECT_PROMPTS: SUBJECT_PROMPTS,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    clearConfig: clearConfig,
    hasRealAI: hasRealAI,
    isParentMode: isParentMode,
    buildSystemPrompt: buildSystemPrompt,
    chat: chat,
    chatStream: chatStream,
    explainQuestion: explainQuestion,
    generateQuestions: generateQuestions,
    generateStudyPlan: generateStudyPlan,
    respondMood: respondMood,
    summarizeWeek: summarizeWeek,
    testConnection: testConnection,
    generateVariants: generateVariants,
    analyzeWrongBook: analyzeWrongBook,
    generateAdaptivePaper: generateAdaptivePaper,
    summarizeTextbook: summarizeTextbook,
    ocrQuestion: ocrQuestion,
    preLearnExplain: preLearnExplain,
    callLocalAI: callLocalAI,
    callRealAPI: callRealAPI,
    /* V3 新增接口 */
    detectEmotion: detectEmotion,
    formatResponse: formatAIResponse,
    saveMemory: saveMemory,
    searchMemory: searchMemory,
    getTeachingStrategy: function(emotion) { return TEACHING_STRATEGIES[emotion] || ''; },
    PERSONAS_V3: PERSONAS_V3,
    SUBJECT_PROMPTS_V3: SUBJECT_PROMPTS_V3,
    EMOTION_PATTERNS: EMOTION_PATTERNS,
    TEACHING_STRATEGIES: TEACHING_STRATEGIES
  };

})(window);
