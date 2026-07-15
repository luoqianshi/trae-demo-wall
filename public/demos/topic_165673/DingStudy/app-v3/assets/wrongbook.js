/* =====================================================
 *  叮咚学 v3 · AI 错题本 3.0 引擎 (wrongbook.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.AI (ai.js)
 *  暴露：window.WrongBook
 *
 *  功能总览：
 *    1. 错题录入（手动 / 拍照 OCR / 答题收集 / 批量导入）
 *    2. 错题管理（列表 / 筛选 / 编辑 / 删除 / 掌握度）
 *    3. AI 讲解（学科特化 prompt，流式输出，引导式不直接给答案）
 *    4. 举一反三（AI 生成 2-3 道同知识点变种题）
 *    5. AI 分析（学科统计 / 知识点薄弱 / SVG 饼图 + 雷达图）
 *    6. 艾宾浩斯复习（间隔复习 1/2/4/7/15/30 天 / 到期提醒 / 复习模式）
 *
 *  数据结构（单条错题 item）：
 *    {
 *      id: 'w_xxx',           唯一 id
 *      q: '题目文本',
 *      opts: ['A','B','C','D'],选项数组（可空）
 *      a: 0,                  正确答案索引(数字) 或字符串
 *      userAnswer: null,      用户的错答（可空）
 *      subject: 'math',       学科 key
 *      knowledge: '两位数乘法',知识点
 *      source: 'manual',      录入来源：manual / quiz / photo / import
 *      mastery: 0,            掌握度：0 未掌握 / 1 部分掌握 / 2 已掌握
 *      reviewCount: 0,        已复习次数
 *      addedAt: 1234567890,   录入时间戳
 *      lastReviewAt: 0,       上次复习时间
 *      nextReviewAt: 0,       下次复习时间
 *      exp: '',               解析（可空）
 *      variants: []           举一反三生成的变种题
 *    }
 * ===================================================== */
(function (window) {
  'use strict';

  // ===================================================
  // 0. 常量与存储键
  // ===================================================

  /** localStorage 主键 */
  var STORAGE_KEY = 'dd.wrongbook';

  /** 艾宾浩斯复习间隔（天） */
  var REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

  /** 一天的毫秒数 */
  var DAY_MS = 86400000;

  /** 学科中文名映射 */
  var SUBJECT_NAMES = {
    math: '数学', chinese: '语文', english: '英语', science: '科学',
    politics: '道法', history: '历史', music: '音乐', art: '美术',
    general: '综合'
  };

  /** 掌握度文案 */
  var MASTERY_TEXT = ['未掌握', '部分掌握', '已掌握'];

  /** 掌握度对应颜色（用于 UI 标签） */
  var MASTERY_COLOR = ['#FF5C5C', '#FFB300', '#2ECC71'];

  /** 图表配色 */
  var PALETTE = ['#7C5CFF', '#FF5CAE', '#FFB300', '#2ECC71', '#3B82F6', '#FF7B54', '#06D6A0', '#9D4EDD'];

  // ===================================================
  // 1. 工具函数
  // ===================================================

  /** 安全地从 localStorage 读取 JSON */
  function safeGet(key, def) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }

  /** 安全地把 JSON 写入 localStorage */
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  /** 生成唯一 id（基于时间戳 + 随机数） */
  function genId(prefix) {
    return (prefix || 'w') + '_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 8);
  }

  /** 当前时间戳 */
  function now() { return Date.now(); }

  /** 今天 0 点的时间戳 */
  function todayStart() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** 安全读取数组（非数组返回空数组） */
  function ensureArr(v) { return Array.isArray(v) ? v : []; }

  /** 格式化日期为 YYYY-MM-DD */
  function fmtDate(ts) {
    var d = new Date(ts);
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  /** 学科中文名转 key */
  function subjectKey(name) {
    for (var k in SUBJECT_NAMES) {
      if (SUBJECT_NAMES[k] === name) return k;
    }
    return 'general';
  }

  // ===================================================
  // 2. 数据存储（内存缓存 + localStorage 持久化）
  // ===================================================

  var _items = null;

  /** 从 localStorage 加载到内存 */
  function load() {
    if (_items) return _items;
    _items = safeGet(STORAGE_KEY, []);
    if (!Array.isArray(_items)) _items = [];
    return _items;
  }

  /** 把内存写回 localStorage */
  function save() {
    return safeSet(STORAGE_KEY, _items);
  }

  // ===================================================
  // 3. 艾宾浩斯复习算法
  // ===================================================

  /**
   * 根据录入时间和已复习次数，计算下次复习时间戳
   * @param {number} addedAt     录入时间
   * @param {number} reviewCount 已复习次数
   * @return {number} 下次复习时间戳
   */
  function getReviewDate(addedAt, reviewCount) {
    var idx = Math.min(reviewCount, REVIEW_INTERVALS.length - 1);
    var days = REVIEW_INTERVALS[idx];
    return addedAt + days * DAY_MS;
  }

  // ===================================================
  // 4. 错题录入
  // ===================================================

  /**
   * 规范化错题项（补全字段、计算首次复习时间）
   * @param {Object} raw 原始数据
   * @return {Object} 规范化后的错题项
   */
  function normalize(raw) {
    raw = raw || {};
    var t = now();
    return {
      id: raw.id || genId('w'),
      q: raw.q || '',
      opts: ensureArr(raw.opts),
      a: (typeof raw.a !== 'undefined') ? raw.a : null,
      userAnswer: (typeof raw.userAnswer !== 'undefined') ? raw.userAnswer : null,
      subject: raw.subject || 'general',
      knowledge: raw.knowledge || '',
      source: raw.source || 'manual',
      mastery: typeof raw.mastery === 'number' ? raw.mastery : 0,
      reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
      addedAt: raw.addedAt || t,
      lastReviewAt: raw.lastReviewAt || 0,
      nextReviewAt: raw.nextReviewAt || getReviewDate(t, 0),
      exp: raw.exp || '',
      variants: ensureArr(raw.variants)
    };
  }

  /**
   * 通用添加错题
   * @param {Object} item 错题数据（字段参见文件头注释）
   * @return {Object} 已添加的错题项
   */
  function add(item) {
    load();
    var it = normalize(item);
    _items.push(it);
    save();
    return it;
  }

  /**
   * 从答题 / 试卷自动收集错题
   *  若同一题（q + 学科相同）已存在，则更新错答并重置掌握度
   * @param {Object} question   题目对象 { q, opts, a, exp, subject, knowledge }
   * @param {*}      userAnswer 用户的错误答案
   * @param {String} subject    学科（可选，缺省取 question.subject）
   * @return {Object} 已添加 / 更新的错题项
   */
  function addFromQuiz(question, userAnswer, subject) {
    question = question || {};
    load();
    var subj = subject || question.subject || 'general';
    // 去重：同题 + 同学科
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].q === question.q && _items[i].subject === subj) {
        _items[i].userAnswer = userAnswer;
        _items[i].mastery = 0;                       // 重新打回未掌握
        _items[i].reviewCount = 0;                   // 复习次数重置
        _items[i].nextReviewAt = getReviewDate(now(), 0);
        save();
        return _items[i];
      }
    }
    return add({
      q: question.q,
      opts: ensureArr(question.opts),
      a: question.a,
      userAnswer: userAnswer,
      subject: subj,
      knowledge: question.knowledge || '',
      exp: question.exp || '',
      source: 'quiz'
    });
  }

  /**
   * 手动录入
   * @param {Object} data { q, opts, a, subject, knowledge, exp }
   * @return {Object} 已添加的错题项
   */
  function addManual(data) {
    data = data || {};
    return add({
      q: data.q,
      opts: ensureArr(data.opts),
      a: data.a,
      subject: data.subject || 'general',
      knowledge: data.knowledge || '',
      exp: data.exp || '',
      source: 'manual'
    });
  }

  /**
   * 拍照录入（调用摄像头 → AI OCR 识别题目 → 返回可编辑结果）
   *  注意：本函数只做"识别"，最终入库需由前端把识别结果交给用户编辑后调用 addManual
   * @param {HTMLCanvasElement} canvas 拍照后的画布（包含题目图片）
   * @param {Object} opts { onResult(result), onError(err) }
   * @return {Promise<Object>} 识别结果 { q, opts, a, subject, knowledge }
   */
  function addFromPhoto(canvas, opts) {
    opts = opts || {};
    var AI = window.AI;
    if (!AI || !AI.hasRealAI || !AI.hasRealAI()) {
      var err = new Error('拍照识别需要配置真实 AI（API Key），请先在设置里开启 AI。');
      if (opts.onError) opts.onError(err);
      return Promise.reject(err);
    }

    // 1. 把 canvas 转 base64 JPEG
    var dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      if (opts.onError) opts.onError(e);
      return Promise.reject(e);
    }

    // 2. 构造 AI 消息（system + user，user 中含图片，OpenAI Vision 兼容格式）
    var sys = AI.buildSystemPrompt({}) +
      '\n你是题目识别助手。请识别图片中的题目，返回严格 JSON：\n' +
      '{"q":"题目文本","opts":["A","B","C","D"],"a":0,"subject":"math","knowledge":"知识点"}\n' +
      '字段说明：a 是正确答案的索引（从 0 开始）；学科 subject 必须是以下之一：' +
      'math/chinese/english/science/politics/history/music/art。' +
      '如果某字段无法识别，opts 给空数组，a 给 0，subject 给 "general"。' +
      '只输出 JSON，不要加任何其他文字、不要 markdown 代码块。';

    var userMsg = {
      role: 'user',
      content: [
        { type: 'text', text: '请识别这张图片中的题目，并以 JSON 格式返回。' },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    };

    // 3. 调用 AI.chat（内部会自动用真实 API）
    return AI.chat([
      { role: 'system', content: sys },
      userMsg
    ]).then(function (text) {
      var result = null;
      try {
        // 兼容 AI 可能返回的 ```json ``` 包裹
        var cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        result = JSON.parse(cleaned);
      } catch (e) {
        console.warn('[WrongBook] OCR 结果解析失败，原样返回文本：', e);
        result = {
          q: String(text).substring(0, 500),
          opts: [],
          a: 0,
          subject: 'general',
          knowledge: ''
        };
      }
      // 规范化学科
      if (result.subject && !SUBJECT_NAMES[result.subject]) result.subject = 'general';
      if (opts.onResult) opts.onResult(result);
      return result;
    }).catch(function (e) {
      if (opts.onError) opts.onError(e);
      throw e;
    });
  }

  /**
   * 从文本批量导入
   *  文本格式（每题之间空行分隔）：
   *    学科|知识点
   *    题目文本
   *    A.选项A
   *    B.选项B
   *    C.选项C
   *    D.选项D
   *    答案：A
   *    解析：可选
   * @param {String} text 文本内容
   * @return {Array<Object>} 已添加的错题项数组
   */
  function addFromText(text) {
    text = (text || '').trim();
    if (!text) return [];
    var blocks = text.split(/\n\s*\n/); // 空行分隔
    var added = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i].trim();
      if (!b) continue;
      var parsed = parseTextBlock(b);
      if (parsed) added.push(add(parsed));
    }
    return added;
  }

  /** 解析单个文本块为错题数据 */
  function parseTextBlock(block) {
    var lines = block.split(/\n/);
    var subject = 'general', knowledge = '';
    var q = '', opts = [], a = null, exp = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      // 学科 | 知识点
      var m = line.match(/^(数学|语文|英语|科学|道法|历史|音乐|美术)\s*[|｜]\s*(.+)$/);
      if (m) { subject = subjectKey(m[1]); knowledge = m[2]; continue; }
      // 选项 A. xxx / A、xxx
      var om = line.match(/^([A-D])[\.、]\s*(.+)$/);
      if (om) { opts.push(om[2]); continue; }
      // 答案
      var am = line.match(/^答案\s*[:：]\s*([A-D])/);
      if (am) { a = am[1].charCodeAt(0) - 65; continue; }   // A=0
      // 解析
      var em = line.match(/^解析\s*[:：]\s*(.+)$/);
      if (em) { exp = em[1]; continue; }
      // 其余视为题目（取第一行）或追加到解析
      if (!q) q = line;
      else exp = (exp ? exp + '\n' : '') + line;
    }
    if (!q) return null;
    return {
      q: q, opts: opts, a: a, subject: subject, knowledge: knowledge,
      exp: exp, source: 'import'
    };
  }

  // ===================================================
  // 5. 错题管理
  // ===================================================

  /**
   * 列表查询（可筛选）
   * @param {Object} filter { subject, knowledge, mastery, source, due }
   *   - due: true 时只返回今天到期的
   * @return {Array} 错题数组（按录入时间倒序）
   */
  function list(filter) {
    load();
    filter = filter || {};
    var out = [];
    var t = now();
    for (var i = 0; i < _items.length; i++) {
      var it = _items[i];
      if (filter.subject && it.subject !== filter.subject) continue;
      if (filter.knowledge && it.knowledge.indexOf(filter.knowledge) < 0) continue;
      if (typeof filter.mastery === 'number' && it.mastery !== filter.mastery) continue;
      if (filter.source && it.source !== filter.source) continue;
      if (filter.due && (t < it.nextReviewAt || it.mastery >= 2)) continue;
      out.push(it);
    }
    out.sort(function (a, b) { return b.addedAt - a.addedAt; });
    return out;
  }

  /** 获取单条错题 */
  function get(id) {
    load();
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].id === id) return _items[i];
    }
    return null;
  }

  /**
   * 更新错题字段
   * @param {String} id   错题 id
   * @param {Object} data 待更新字段
   * @return {Object|null} 更新后的错题项
   */
  function update(id, data) {
    load();
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].id === id) {
        var it = _items[i];
        data = data || {};
        if (typeof data.q !== 'undefined') it.q = data.q;
        if (typeof data.opts !== 'undefined') it.opts = ensureArr(data.opts);
        if (typeof data.a !== 'undefined') it.a = data.a;
        if (typeof data.userAnswer !== 'undefined') it.userAnswer = data.userAnswer;
        if (typeof data.subject !== 'undefined') it.subject = data.subject;
        if (typeof data.knowledge !== 'undefined') it.knowledge = data.knowledge;
        if (typeof data.exp !== 'undefined') it.exp = data.exp;
        if (typeof data.mastery === 'number') it.mastery = data.mastery;
        if (typeof data.variants !== 'undefined') it.variants = ensureArr(data.variants);
        save();
        return it;
      }
    }
    return null;
  }

  /** 删除错题 */
  function remove(id) {
    load();
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].id === id) {
        _items.splice(i, 1);
        save();
        return true;
      }
    }
    return false;
  }

  /**
   * 设置掌握度
   * @param {String} id    错题 id
   * @param {Number} level 0 未掌握 / 1 部分掌握 / 2 已掌握
   * @return {Object|null} 更新后的错题项
   */
  function setMastery(id, level) {
    load();
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].id === id) {
        _items[i].mastery = level;
        // 标记"已掌握"时，下次复习自动延后到最后一档
        if (level === 2) {
          var idx = REVIEW_INTERVALS.length - 1;
          _items[i].nextReviewAt = now() + REVIEW_INTERVALS[idx] * DAY_MS;
        }
        save();
        return _items[i];
      }
    }
    return null;
  }

  // ===================================================
  // 6. AI 讲解（流式） / 举一反三 / AI 分析
  // ===================================================

  /**
   * AI 讲解错题（流式）
   *  学科特化 prompt + 引导式（不直接给答案）
   * @param {String} id        错题 id
   * @param {Object} callbacks { onChunk(text), onDone(), onError(err) }
   * @return {Promise} chatStream 的 Promise
   */
  function explain(id, callbacks) {
    callbacks = callbacks || {};
    var item = get(id);
    if (!item) {
      var err = new Error('错题不存在');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }
    var AI = window.AI;
    if (!AI) {
      err = new Error('AI 模块未加载');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }

    // 学科特化 system prompt（ai.js 内置 8 学科 prompt）
    var sys = AI.buildSystemPrompt({ subject: item.subject }) +
      '\n你是错题讲解老师。讲解要求：' +
      '1) 引导式，绝对不直接给答案；2) 分步骤拆解思路；' +
      '3) 指出这道题的常见错误；4) 最后鼓励学生自己说出正确答案。';

    // 用户的错答文本
    var uaText = '';
    if (item.userAnswer != null) {
      uaText = (typeof item.userAnswer === 'number' && item.opts[item.userAnswer])
        ? item.opts[item.userAnswer]
        : String(item.userAnswer);
    }

    var userText = '我有一道错题，请给我讲解：\n' +
      '学科：' + (SUBJECT_NAMES[item.subject] || item.subject) + '\n' +
      '知识点：' + (item.knowledge || '（未填）') + '\n' +
      '题目：' + (item.q || '') + '\n' +
      (item.opts.length ? '选项：\n' + item.opts.map(function (o, i) {
        return '  ' + String.fromCharCode(65 + i) + '. ' + o;
      }).join('\n') : '') +
      (uaText ? '\n我答错了，我选了：' + uaText : '') +
      '\n请用引导式的方式讲解，让我自己想出正确答案，不要直接告诉我答案。';

    return AI.chatStream([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ], callbacks);
  }

  /**
   * 举一反三：AI 生成 2-3 道同知识点变种题
   *  生成的变种题保存在原错题的 variants 字段
   * @param {String} id        错题 id
   * @param {Object} callbacks { onResult(arr), onError(err) }
   * @return {Promise<Array>} 变种题数组
   */
  function generateVariants(id, callbacks) {
    callbacks = callbacks || {};
    var item = get(id);
    if (!item) {
      var err = new Error('错题不存在');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }
    var AI = window.AI;
    if (!AI) {
      err = new Error('AI 模块未加载');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }

    var sys = AI.buildSystemPrompt({ subject: item.subject }) +
      '\n你是出题老师，请输出严格 JSON 格式的题目数组，不要其他文字、不要 markdown。';
    var userText = '请基于下面这道错题，出 3 道同知识点的变种题（难度相近，情景不同）：\n' +
      '原题：' + (item.q || '') + '\n' +
      '选项：' + (item.opts.length ? item.opts.join(' / ') : '（无）') + '\n' +
      '知识点：' + (item.knowledge || '') + '\n' +
      '\n输出 JSON 数组，每个元素结构：\n' +
      '{"q":"题目","opts":["A","B","C","D"],"a":0,"exp":"解析","knowledge":"知识点"}\n' +
      'a 是正确答案的索引（0 起）。只输出 JSON。';

    return AI.chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]).then(function (text) {
      var arr = [];
      try {
        var cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        arr = JSON.parse(cleaned);
        if (!Array.isArray(arr)) arr = [];
      } catch (e) {
        console.warn('[WrongBook] 变种题 JSON 解析失败：', e);
        arr = [];
      }
      arr = arr.slice(0, 3);
      // 保存到原错题的 variants 字段
      item.variants = arr;
      update(id, { variants: arr });
      if (callbacks.onResult) callbacks.onResult(arr);
      return arr;
    }).catch(function (e) {
      if (callbacks.onError) callbacks.onError(e);
      throw e;
    });
  }

  /**
   * 变种题答对 → 把原错题标为已掌握
   * @param {String} id 错题 id
   * @return {Object|null} 更新后的错题项
   */
  function markVariantCorrect(id) {
    return setMastery(id, 2);
  }

  /**
   * AI 自然语言分析总结（流式）
   * @param {Object} callbacks { onChunk, onDone, onError }
   * @return {Promise}
   */
  function analyze(callbacks) {
    callbacks = callbacks || {};
    var AI = window.AI;
    if (!AI) {
      var err = new Error('AI 模块未加载');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }
    var s = stats();
    var weakPoints = knowledgeMap().slice(0, 5).map(function (k) {
      return k.knowledge + '(掌握率' + k.masteryRate + '%)';
    });

    var sys = AI.buildSystemPrompt({}) +
      '\n你是学习分析助手。根据错题数据，用温和、亲切的语言给出总结和建议，' +
      '适合 5-6 年级小学生理解。';
    var userText = '这是孩子的错题数据：\n' +
      '总错题数：' + s.total + '\n' +
      '近 7 天新增：' + s.recent7 + '\n' +
      '各学科错题数：' + JSON.stringify(s.bySubject) + '\n' +
      '掌握度分布（未掌握/部分/已掌握）：' +
      s.byMastery[0] + '/' + s.byMastery[1] + '/' + s.byMastery[2] + '\n' +
      '薄弱知识点 TOP 5：' + (weakPoints.length ? weakPoints.join('、') : '暂无') + '\n' +
      '\n请：\n1) 用亲切语言总结学习情况；\n' +
      '2) 指出 1-2 个最需要加强的薄弱点；\n' +
      '3) 给出 3 条针对性的练习建议。\n' +
      '回复不超过 400 字。';

    // 优先使用流式
    if (AI.chatStream && callbacks.onChunk) {
      return AI.chatStream([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ], callbacks);
    }
    // 降级非流式
    return AI.chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]).then(function (text) {
      if (callbacks.onChunk) callbacks.onChunk(text);
      if (callbacks.onDone) callbacks.onDone();
      return text;
    }).catch(function (e) {
      if (callbacks.onError) callbacks.onError(e);
      throw e;
    });
  }

  // ===================================================
  // 7. 艾宾浩斯复习
  // ===================================================

  /**
   * 获取今天到期的复习项（已掌握的不算）
   * @return {Array} 错题数组（按到期时间升序）
   */
  function getDueItems() {
    load();
    var t = now();
    var out = [];
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].nextReviewAt <= t && _items[i].mastery < 2) {
        out.push(_items[i]);
      }
    }
    out.sort(function (a, b) { return a.nextReviewAt - b.nextReviewAt; });
    return out;
  }

  /**
   * 获取未来 7 天的复习计划
   * @return {Array} [{ date, dateStr, count, items }]
   */
  function getReviewSchedule() {
    load();
    var t0 = todayStart();
    var out = [];
    for (var d = 0; d < 7; d++) {
      var dayStart = t0 + d * DAY_MS;
      var dayEnd = dayStart + DAY_MS - 1;
      var count = 0;
      var items = [];
      for (var i = 0; i < _items.length; i++) {
        var it = _items[i];
        if (it.mastery >= 2) continue;
        if (it.nextReviewAt >= dayStart && it.nextReviewAt <= dayEnd) {
          count++;
          items.push(it);
        }
      }
      out.push({
        date: dayStart,
        dateStr: fmtDate(dayStart),
        count: count,
        items: items
      });
    }
    return out;
  }

  /**
   * 标记某错题为本次已复习（推进到下一阶段）
   * @param {String} id 错题 id
   * @return {Object|null} 更新后的错题项
   */
  function markReviewed(id) {
    load();
    for (var i = 0; i < _items.length; i++) {
      if (_items[i].id === id) {
        var it = _items[i];
        it.reviewCount = (it.reviewCount || 0) + 1;
        it.lastReviewAt = now();
        var idx = Math.min(it.reviewCount, REVIEW_INTERVALS.length - 1);
        it.nextReviewAt = now() + REVIEW_INTERVALS[idx] * DAY_MS;
        save();
        return it;
      }
    }
    return null;
  }

  // ===================================================
  // 8. 统计
  // ===================================================

  /**
   * 整体统计
   * @return {Object} { total, bySubject, byMastery, bySource, recent7 }
   */
  function stats() {
    load();
    var bySubject = {};
    var byMastery = { 0: 0, 1: 0, 2: 0 };
    var bySource = {};
    var recent7 = 0;
    var t = now() - 7 * DAY_MS;
    for (var i = 0; i < _items.length; i++) {
      var it = _items[i];
      bySubject[it.subject] = (bySubject[it.subject] || 0) + 1;
      byMastery[it.mastery] = (byMastery[it.mastery] || 0) + 1;
      bySource[it.source] = (bySource[it.source] || 0) + 1;
      if (it.addedAt >= t) recent7++;
    }
    return {
      total: _items.length,
      bySubject: bySubject,
      byMastery: byMastery,
      bySource: bySource,
      recent7: recent7
    };
  }

  /**
   * 学科分布（用于饼图）
   * @return {Array} [{ subject, name, count, percent }]
   */
  function subjectDistribution() {
    load();
    var total = _items.length;
    var map = {};
    for (var i = 0; i < _items.length; i++) {
      var s = _items[i].subject;
      map[s] = (map[s] || 0) + 1;
    }
    var out = [];
    for (var k in map) {
      out.push({
        subject: k,
        name: SUBJECT_NAMES[k] || k,
        count: map[k],
        percent: total > 0 ? Math.round(map[k] / total * 100) : 0
      });
    }
    out.sort(function (a, b) { return b.count - a.count; });
    return out;
  }

  /**
   * 知识点掌握度（用于雷达图，薄弱的在前）
   * @return {Array} [{ knowledge, subject, total, mastered, partial, unmastered, masteryRate }]
   */
  function knowledgeMap() {
    load();
    var map = {};
    for (var i = 0; i < _items.length; i++) {
      var it = _items[i];
      var key = (it.subject || 'general') + '|' + (it.knowledge || '未分类');
      if (!map[key]) {
        map[key] = {
          knowledge: it.knowledge || '未分类',
          subject: it.subject || 'general',
          total: 0, m0: 0, m1: 0, m2: 0
        };
      }
      map[key].total++;
      if (it.mastery === 0) map[key].m0++;
      else if (it.mastery === 1) map[key].m1++;
      else if (it.mastery === 2) map[key].m2++;
    }
    var out = [];
    for (var k in map) {
      var v = map[k];
      v.mastered = v.m2;
      v.partial = v.m1;
      v.unmastered = v.m0;
      // 掌握率 = (已掌握×1 + 部分掌握×0.5) / 总数 × 100
      v.masteryRate = v.total > 0
        ? Math.round((v.m2 * 1 + v.m1 * 0.5) / v.total * 100)
        : 0;
      out.push(v);
    }
    // 按掌握率升序（最薄弱的在前）
    out.sort(function (a, b) { return a.masteryRate - b.masteryRate; });
    return out;
  }

  // ===================================================
  // 9. SVG 图表生成
  // ===================================================

  /**
   * 生成饼图 SVG（学科分布）
   * @param {Array}  data subjectDistribution() 的返回值（可选）
   * @param {Number} size 画布尺寸
   * @return {String} SVG 字符串
   */
  function pieChart(data, size) {
    data = data || subjectDistribution();
    size = size || 220;
    var cx = size / 2, cy = size / 2, r = size / 2 - 10;
    var total = 0;
    for (var i = 0; i < data.length; i++) total += data[i].count;

    var parts = '';
    if (total === 0) {
      // 空状态
      parts = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#E5E7EB"/>' +
              '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="13" fill="#999">暂无错题</text>';
    } else {
      var start = -Math.PI / 2; // 12 点方向开始
      for (var j = 0; j < data.length; j++) {
        var d = data[j];
        if (d.count === 0) continue;
        var angle = (d.count / total) * Math.PI * 2;
        var end = start + angle;
        var color = PALETTE[j % PALETTE.length];

        if (angle >= Math.PI * 2 - 0.001) {
          // 整圆
          parts += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '"/>';
        } else {
          var x1 = cx + r * Math.cos(start);
          var y1 = cy + r * Math.sin(start);
          var x2 = cx + r * Math.cos(end);
          var y2 = cy + r * Math.sin(end);
          var large = angle > Math.PI ? 1 : 0;
          parts += '<path d="M' + cx + ',' + cy +
                   ' L' + x1.toFixed(2) + ',' + y1.toFixed(2) +
                   ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) +
                   ' Z" fill="' + color + '"/>';
        }
        start = end;
      }
    }

    // 图例
    var legend = '';
    var ly = 14;
    for (var k = 0; k < data.length; k++) {
      var col = PALETTE[k % PALETTE.length];
      legend += '<rect x="10" y="' + ly + '" width="12" height="12" fill="' + col + '"/>' +
                '<text x="28" y="' + (ly + 11) + '" font-size="12" fill="#333">' +
                (data[k].name || data[k].subject) + ' ' + data[k].count +
                ' (' + data[k].percent + '%)</text>';
      ly += 18;
    }

    var w = size + 170;
    var h = Math.max(size, ly + 6);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
           '<g transform="translate(170,0)">' + parts + '</g>' +
           legend +
           '</svg>';
  }

  /**
   * 生成雷达图 SVG（知识点掌握度）
   * @param {Array}  data knowledgeMap() 的返回值（取前 6 项）
   * @param {Number} size 画布尺寸
   * @return {String} SVG 字符串
   */
  function radarChart(data, size) {
    data = (data || knowledgeMap()).slice(0, 6);
    size = size || 280;
    var cx = size / 2, cy = size / 2, R = size / 2 - 50;
    var n = data.length;

    if (n === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">' +
             '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="14" fill="#999">暂无数据</text>' +
             '</svg>';
    }

    var parts = '';

    // 5 层网格
    for (var ring = 1; ring <= 5; ring++) {
      var rr = R * ring / 5;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
        pts.push((cx + rr * Math.cos(ang)).toFixed(2) + ',' + (cy + rr * Math.sin(ang)).toFixed(2));
      }
      parts += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#E5E7EB" stroke-width="1"/>';
    }

    // 轴线 + 标签
    for (var j = 0; j < n; j++) {
      var ang2 = -Math.PI / 2 + j * 2 * Math.PI / n;
      var ax = cx + R * Math.cos(ang2);
      var ay = cy + R * Math.sin(ang2);
      parts += '<line x1="' + cx + '" y1="' + cy +
               '" x2="' + ax.toFixed(2) + '" y2="' + ay.toFixed(2) +
               '" stroke="#E5E7EB"/>';
      var lx = cx + (R + 22) * Math.cos(ang2);
      var ly = cy + (R + 22) * Math.sin(ang2);
      var label = data[j].knowledge || '未分类';
      if (label.length > 6) label = label.substring(0, 6) + '…';
      parts += '<text x="' + lx.toFixed(2) + '" y="' + ly.toFixed(2) +
               '" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#666">' +
               label + '</text>';
    }

    // 数据多边形
    var dpts = [];
    for (var k = 0; k < n; k++) {
      var ang3 = -Math.PI / 2 + k * 2 * Math.PI / n;
      var val = (data[k].masteryRate || 0) / 100;
      var rr2 = R * val;
      var px = cx + rr2 * Math.cos(ang3);
      var py = cy + rr2 * Math.sin(ang3);
      dpts.push(px.toFixed(2) + ',' + py.toFixed(2));
    }
    parts += '<polygon points="' + dpts.join(' ') +
             '" fill="rgba(124,92,255,0.3)" stroke="#7C5CFF" stroke-width="2"/>';

    // 顶点圆
    for (var m = 0; m < n; m++) {
      var xy = dpts[m].split(',');
      parts += '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="#7C5CFF"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
           '" viewBox="0 0 ' + size + ' ' + size + '">' + parts + '</svg>';
  }

  // ===================================================
  // 10. 序列化 / 导入导出
  // ===================================================

  /** 序列化为字符串 */
  function serialize() {
    load();
    return JSON.stringify({ version: 3, items: _items });
  }

  /** 从字符串反序列化（覆盖现有数据） */
  function deserialize(str) {
    try {
      var obj = JSON.parse(str);
      if (obj && Array.isArray(obj.items)) {
        _items = obj.items;
        save();
        return _items;
      }
      // 兼容直接是数组的情况
      if (Array.isArray(obj)) {
        _items = obj;
        save();
        return _items;
      }
    } catch (e) {
      console.warn('[WrongBook] 反序列化失败：', e);
    }
    return null;
  }

  /** 导出（含元数据） */
  function exportData() {
    load();
    return {
      version: 3,
      exportedAt: now(),
      count: _items.length,
      items: _items
    };
  }

  /** 清空全部错题 */
  function clear() {
    _items = [];
    save();
    return true;
  }

  // ===================================================
  // 11. 暴露 API
  // ===================================================

  window.WrongBook = {
    // —— 常量 ——
    REVIEW_INTERVALS: REVIEW_INTERVALS,
    SUBJECT_NAMES: SUBJECT_NAMES,
    MASTERY_TEXT: MASTERY_TEXT,
    MASTERY_COLOR: MASTERY_COLOR,

    // —— 录入 ——
    add: add,
    addFromQuiz: addFromQuiz,
    addManual: addManual,
    addFromPhoto: addFromPhoto,
    addFromText: addFromText,           // 批量导入

    // —— 管理 ——
    list: list,
    get: get,
    update: update,
    remove: remove,
    setMastery: setMastery,

    // —— AI ——
    explain: explain,
    generateVariants: generateVariants,
    markVariantCorrect: markVariantCorrect,
    analyze: analyze,

    // —— 复习 ——
    getDueItems: getDueItems,
    getReviewSchedule: getReviewSchedule,
    markReviewed: markReviewed,
    getReviewDate: getReviewDate,

    // —— 统计 ——
    stats: stats,
    subjectDistribution: subjectDistribution,
    knowledgeMap: knowledgeMap,

    // —— SVG 图表 ——
    pieChart: pieChart,
    radarChart: radarChart,

    // —— 工具 ——
    serialize: serialize,
    deserialize: deserialize,
    exportData: exportData,
    clear: clear
  };

})(window);
