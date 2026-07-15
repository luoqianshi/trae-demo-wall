/* =====================================================
 *  叮咚学 v3 · AI 自适应学习引擎 (adaptive.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.AI (ai.js)、window.DD (data.js)、window.WrongBook (wrongbook.js)
 *  暴露：window.Adaptive
 *
 *  功能总览：
 *    1. AI 自适应试卷生成（综合年级 / 版本 / 学科 / 错题 / 进度 / 掌握度）
 *    2. 难度自适应（连对 3 题升级，答错降级，下限 easy / 上限 hard）
 *    3. BOSS 战模式（10 题限时 5 分钟，BOSS/玩家双血量）
 *    4. 学习路径图（SVG 节点图：已掌握/当前/未解锁）
 *    5. 三环紧扣（预习 → 学习 → 复习 自动流转）
 *    6. 试卷结算（正确率 / 用时 / 难度曲线 / 奖励 / AI 评价）
 *
 *  数据结构（session 会话）：
 *    {
 *      id: 'sess_xxx',         会话 id
 *      type: 'paper|boss',     会话类型
 *      subject: 'math',        学科
 *      grade: 'g5up',          年级
 *      version: 'pep',         教材版本
 *      questions: [],          题目数组
 *      answers: [],            用户答题记录 [{ qid, answer, correct, ts, diff, timeUsed }]
 *      current: 0,             当前题号
 *      difficulty: 'easy',     当前难度
 *      streak: 0,              连对计数
 *      diffHistory: [],        难度变化曲线
 *      startTime: 0,           开始时间戳
 *      endTime: 0,             结束时间戳
 *      over: false,            是否已结束
 *      boss: null,             BOSS 战状态（仅 boss 类型）
 *      coin: 0, exp: 0,        本次奖励
 *      stats: null             结算统计
 *    }
 *
 *  BOSS 战状态（bossState）：
 *    {
 *      bossHP: 100, bossMaxHP: 100,
 *      playerHP: 100, playerMaxHP: 100,
 *      questionIndex: 0, totalQuestions: 10,
 *      startTime: 0, timeLimit: 300000, perQuestionLimit: 30000,
 *      correctCount: 0, wrongCount: 0,
 *      over: false, win: false
 *    }
 *
 *  学习路径节点（pathNode）：
 *    {
 *      id: 'node_xxx',       节点 id
 *      subject: 'math',      学科
 *      unit: 1,              单元号
 *      title: '第一单元',    节点标题
 *      knowledge: '加法',    知识点
 *      status: 'locked',     状态：locked / current / mastered
 *      unlockedAt: 0,        解锁时间
 *      masteredAt: 0,        掌握时间
 *      masteryRate: 0        掌握率（0-100）
 *    }
 * ===================================================== */
(function (window) {
  'use strict';

  // ===================================================
  // 0. 常量与存储键
  // ===================================================

  /** 会话历史 localStorage 主键 */
  var STORAGE_KEY = 'dd.adaptive';

  /** 学习路径进度 localStorage 主键 */
  var PATH_KEY = 'dd.adaptive.path';

  /** 难度等级（顺序即难度递增） */
  var DIFF_LEVELS = ['easy', 'normal', 'hard'];

  /** 难度中文名 */
  var DIFF_NAMES = { easy: '简单', normal: '中等', hard: '困难' };

  /** 难度颜色（用于 SVG/UI） */
  var DIFF_COLORS = { easy: '#2ECC71', normal: '#FFB300', hard: '#FF5C5C' };

  /** 学科中文名映射 */
  var SUBJECT_NAMES = {
    math: '数学', chinese: '语文', english: '英语', science: '科学',
    politics: '道法', history: '历史', music: '音乐', art: '美术',
    general: '综合'
  };

  /** 一天的毫秒数 */
  var DAY_MS = 86400000;

  /** BOSS 战默认参数 */
  var BOSS_DEFAULTS = {
    totalQuestions: 10,
    timeLimit: 300000,        // 5 分钟
    perQuestionLimit: 30000,  // 30 秒/题
    bossMaxHP: 100,
    playerMaxHP: 100,
    hpPerHit: 10,             // 每题扣血量
    coinPerWin: 20,           // 胜利基础奖励
    coinPerCorrect: 5,        // 每对 1 题奖励
    expPerCorrect: 10
  };

  /** 普通会话奖励规则 */
  var PAPER_REWARDS = {
    coinPerCorrect: 3,
    expPerCorrect: 5,
    bonusFullCorrect: 30,     // 全对额外奖励
    bonusNoWrong: 20          // 零错题奖励
  };

  /** 连对升级阈值 */
  var STREAK_UP = 3;

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
    return (prefix || 'sess') + '_' + Date.now().toString(36) + '_' +
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

  /** 格式化时长（毫秒 → 分秒） */
  function fmtDuration(ms) {
    if (!ms || ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  /** 学科中文名 */
  function subjectName(key) {
    return SUBJECT_NAMES[key] || key || '综合';
  }

  /** 打乱数组（Fisher-Yates 洗牌，返回新数组） */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** 随机取数组前 n 个元素（不重复） */
  function sample(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  // ===================================================
  // 2. 与 app.js 的钩子（可注入）
  // ===================================================

  var hooks = {
    /** 获取当前叮咚币数量 */
    getCoin: function () {
      var s = safeGet('dd_state', null);
      return s && typeof s.coin === 'number' ? s.coin : 0;
    },
    /** 增加叮咚币（n 可为负数表示消耗） */
    addCoin: function (n) {
      var s = safeGet('dd_state', null);
      if (!s) s = { coin: 0 };
      s.coin = (s.coin || 0) + n;
      safeSet('dd_state', s);
    },
    /** 增加经验值 */
    addExp: function (n) {
      var s = safeGet('dd_state', null);
      if (!s) s = { exp: 0 };
      s.exp = (s.exp || 0) + n;
      safeSet('dd_state', s);
    },
    /** 显示提示消息 */
    toast: function (msg, type) {
      try { console.log('[Adaptive ' + (type || 'info') + '] ' + msg); } catch (e) {}
    },
    /** 获取当前用户名 */
    getUser: function () {
      var s = safeGet('dd_state', null);
      return (s && s.name) || '小同学';
    },
    /** 获取用户状态（含年级、版本等） */
    getState: function () {
      return safeGet('dd_state', {}) || {};
    }
  };

  /**
   * 由 app.js 注入钩子函数，例如：
   *   Adaptive.config({
   *     getCoin: function(){ return state.coin; },
   *     addCoin: addCoin,
   *     addExp:  addExp,
   *     toast:   toast,
   *     getUser: function(){ return state.name; },
   *     getState: function(){ return state; }
   *   });
   */
  function config(opts) {
    if (!opts) return;
    if (typeof opts.getCoin   === 'function') hooks.getCoin   = opts.getCoin;
    if (typeof opts.addCoin   === 'function') hooks.addCoin   = opts.addCoin;
    if (typeof opts.addExp    === 'function') hooks.addExp    = opts.addExp;
    if (typeof opts.toast     === 'function') hooks.toast     = opts.toast;
    if (typeof opts.getUser   === 'function') hooks.getUser   = opts.getUser;
    if (typeof opts.getState  === 'function') hooks.getState  = opts.getState;
  }

  // ===================================================
  // 3. 难度工具
  // ===================================================

  /** 获取难度的索引（0/1/2） */
  function diffIndex(d) {
    var i = DIFF_LEVELS.indexOf(d);
    return i < 0 ? 1 : i;
  }

  /** 难度升一级（上限 hard） */
  function nextLevel(d) {
    return DIFF_LEVELS[Math.min(diffIndex(d) + 1, DIFF_LEVELS.length - 1)];
  }

  /** 难度降一级（下限 easy） */
  function prevLevel(d) {
    return DIFF_LEVELS[Math.max(diffIndex(d) - 1, 0)];
  }

  // ===================================================
  // 4. 用户画像（综合错题 / 答题进度 / 掌握度）
  // ===================================================

  /**
   * 获取用户画像
   * @return {Object} {
   *   grade, version, level, coin,
   *   totalAnswered, totalCorrect, accuracy,
   *   bySubject: { math: {answered, correct, accuracy} },
   *   weakPoints: [{ subject, knowledge, masteryRate }],
   *   wrongTotal, wrongMastered
   * }
   */
  function getProfile() {
    var st = hooks.getState() || {};
    var WB = window.WrongBook;
    var wrongStats = WB && WB.stats ? WB.stats() : { total: 0, bySubject: {}, byMastery: { 0: 0, 1: 0, 2: 0 } };
    var km = WB && WB.knowledgeMap ? WB.knowledgeMap() : [];

    // 薄弱知识点（掌握率 < 60% 的取前 5）
    var weak = [];
    for (var i = 0; i < km.length; i++) {
      if (km[i].masteryRate < 60) weak.push(km[i]);
      if (weak.length >= 5) break;
    }

    return {
      grade:        st.grade || 'g5up',
      version:      st.version || 'pep',
      level:        st.level || 1,
      coin:         st.coin || 0,
      exp:          st.exp || 0,
      totalAnswered: st.totalCount || 0,
      totalCorrect: st.correctCount || 0,
      accuracy:     st.totalCount > 0 ? Math.round(st.correctCount / st.totalCount * 100) : 0,
      bySubject:    st.subjectCorrect || {},
      weakPoints:   weak,
      wrongTotal:   wrongStats.total,
      wrongMastered: (wrongStats.byMastery[2] || 0)
    };
  }

  /**
   * 根据用户水平推荐初始难度
   *  - 新手（答题 < 20 或正确率 < 50%）：easy
   *  - 进阶（答题 < 100 或正确率 < 75%）：normal
   *  - 高手（答题 ≥ 100 且正确率 ≥ 75%）：hard
   */
  function initDifficulty(profile) {
    profile = profile || getProfile();
    if (profile.totalAnswered < 20 || profile.accuracy < 50) return 'easy';
    if (profile.totalAnswered < 100 || profile.accuracy < 75) return 'normal';
    return 'hard';
  }

  // ===================================================
  // 5. 数据存储（会话历史）
  // ===================================================

  var _sessions = null;

  /** 从 localStorage 加载历史会话 */
  function loadSessions() {
    if (_sessions) return _sessions;
    _sessions = safeGet(STORAGE_KEY, []);
    if (!Array.isArray(_sessions)) _sessions = [];
    return _sessions;
  }

  /** 保存历史会话 */
  function saveSessions() {
    return safeSet(STORAGE_KEY, _sessions);
  }

  /** 记录一条会话到历史 */
  function pushSession(sess) {
    loadSessions();
    _sessions.push(sess);
    if (_sessions.length > 100) _sessions = _sessions.slice(-100); // 最多保留 100 条
    saveSessions();
  }

  /** 获取历史会话列表 */
  function listSessions() {
    return loadSessions().slice().reverse(); // 倒序，最新在前
  }

  // ===================================================
  // 6. 试卷生成
  // ===================================================

  /**
   * 从本地题库抽取题目
   * @param {Object} opts { subject, grade, version, count, difficulty, knowledge, wrongbook }
   * @return {Array} 题目数组
   */
  function generateFromLocal(opts) {
    opts = opts || {};
    var DD = window.DD;
    if (!DD || !DD.QUESTIONS) return [];

    var subject = opts.subject || 'math';
    var count = opts.count || 10;
    var diff = opts.difficulty || null;  // 不传则混合难度
    var knowledge = opts.knowledge || null;
    var useWrongbook = opts.wrongbook !== false; // 默认利用错题

    // 1. 从本地题库筛选
    var pool = [];
    for (var i = 0; i < DD.QUESTIONS.length; i++) {
      var q = DD.QUESTIONS[i];
      if (q.subject !== subject) continue;
      if (diff && q.diff !== diff) continue;
      if (knowledge && q.knowledge && q.knowledge.indexOf(knowledge) < 0) continue;
      pool.push(q);
    }

    // 2. 若题量不足，放宽难度筛选
    if (pool.length < count) {
      pool = [];
      for (var j = 0; j < DD.QUESTIONS.length; j++) {
        if (DD.QUESTIONS[j].subject === subject) pool.push(DD.QUESTIONS[j]);
      }
    }

    // 3. 若仍不足，跨学科补足（标记为综合）
    if (pool.length < count) {
      for (var k = 0; k < DD.QUESTIONS.length && pool.length < count; k++) {
        if (DD.QUESTIONS[k].subject !== subject) pool.push(DD.QUESTIONS[k]);
      }
    }

    // 4. 优先加入错题变种（强化薄弱点）
    var result = [];
    if (useWrongbook && window.WrongBook) {
      var wbList = window.WrongBook.list({ subject: subject }) || [];
      // 取未掌握 / 部分掌握的错题
      var wbPool = [];
      for (var w = 0; w < wbList.length; w++) {
        if (wbList[w].mastery < 2) wbPool.push(wbList[w]);
      }
      // 取最多 30% 的错题相关题
      var wbCount = Math.min(Math.floor(count * 0.3), wbPool.length);
      if (wbCount > 0) {
        var wbPick = sample(wbPool, wbCount);
        for (var x = 0; x < wbPick.length; x++) {
          var it = wbPick[x];
          // 优先用变种题，没有就用原题
          if (it.variants && it.variants.length) {
            var v = it.variants[Math.floor(Math.random() * it.variants.length)];
            result.push({
              id: it.id + '_v',
              q: v.q,
              opts: v.opts || [],
              a: v.a,
              exp: v.exp || it.exp || '',
              diff: it.diff || (it.mastery === 0 ? 'easy' : 'normal'),
              subject: subject,
              knowledge: v.knowledge || it.knowledge || '',
              fromWrong: true
            });
          } else {
            result.push({
              id: it.id + '_r',
              q: it.q,
              opts: it.opts,
              a: it.a,
              exp: it.exp || '',
              diff: it.diff || (it.mastery === 0 ? 'easy' : 'normal'),
              subject: subject,
              knowledge: it.knowledge || '',
              fromWrong: true
            });
          }
        }
      }
    }

    // 5. 从题池补足剩余题量
    var remain = count - result.length;
    if (remain > 0 && pool.length > 0) {
      // 排除已选中的题
      var existIds = {};
      for (var e = 0; e < result.length; e++) existIds[result[e].id] = true;
      var filtered = [];
      for (var f = 0; f < pool.length; f++) {
        if (!existIds[pool[f].id]) filtered.push(pool[f]);
      }
      var picks = sample(filtered, remain);
      result = result.concat(picks);
    }

    // 6. 打乱顺序
    return shuffle(result).slice(0, count);
  }

  /**
   * 由 AI 生成题目
   * @param {Object} opts { subject, grade, version, count, difficulty, knowledge }
   * @return {Promise<Array>} 题目数组
   */
  function generateFromAI(opts) {
    opts = opts || {};
    var AI = window.AI;
    if (!AI || !AI.hasRealAI || !AI.hasRealAI()) {
      // 未配置 AI，降级本地
      return Promise.resolve(generateFromLocal(opts));
    }

    var subject = opts.subject || 'math';
    var count = opts.count || 10;
    var diff = opts.difficulty || 'normal';
    var profile = getProfile();
    var gradeName = '五年级';
    if (window.DD && window.DD.GRADES) {
      for (var i = 0; i < window.DD.GRADES.length; i++) {
        if (window.DD.GRADES[i].id === (opts.grade || profile.grade)) {
          gradeName = window.DD.GRADES[i].name;
          break;
        }
      }
    }

    // 构造 AI 出题 prompt（参考错题本薄弱点）
    var weakText = profile.weakPoints.length
      ? '薄弱知识点：' + profile.weakPoints.map(function (w) { return w.knowledge; }).join('、')
      : '暂无错题记录';

    var sys = AI.buildSystemPrompt({ subject: subject }) +
      '\n你是出题老师，请输出严格 JSON 格式的题目数组，不要其他文字、不要 markdown 代码块。';
    var userText = '请出 ' + count + ' 道 ' + subjectName(subject) + '学科的题目，难度 ' + diff +
      '，适合' + gradeName + '小学生。\n' +
      '用户薄弱点参考：' + weakText + '\n' +
      '要求题目覆盖该学科多个知识点，不要重复。\n' +
      '输出 JSON 数组，每个元素：\n' +
      '{"q":"题目","opts":["A","B","C","D"],"a":0,"exp":"解析","diff":"' + diff + '","subject":"' + subject + '","knowledge":"知识点"}\n' +
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
        console.warn('[Adaptive] AI 出题 JSON 解析失败，降级本地：', e);
        arr = [];
      }
      // 不够则用本地补足
      if (arr.length < count) {
        var local = generateFromLocal(opts);
        for (var i = 0; i < local.length && arr.length < count; i++) {
          arr.push(local[i]);
        }
      }
      return arr.slice(0, count);
    }).catch(function (e) {
      console.warn('[Adaptive] AI 出题失败，降级本地：', e);
      return generateFromLocal(opts);
    });
  }

  /**
   * 生成完整试卷（综合入口）
   *  优先 AI 生成，失败降级本地；未配置 AI 直接本地
   * @param {Object} opts { subject, grade, version, count, difficulty, wrongbook, useAI }
   * @return {Promise<Object>} paper {
   *   id, subject, grade, version, difficulty, questions: [], createdAt
   * }
   */
  function generatePaper(opts) {
    opts = opts || {};
    var subject = opts.subject || 'math';
    var count = opts.count || 10;
    var profile = getProfile();
    var grade = opts.grade || profile.grade;
    var version = opts.version || profile.version;
    var difficulty = opts.difficulty || initDifficulty(profile);
    var useAI = opts.useAI !== false; // 默认使用 AI

    var baseOpts = {
      subject: subject,
      grade: grade,
      version: version,
      count: count,
      difficulty: difficulty,
      wrongbook: opts.wrongbook !== false
    };

    var p;
    if (useAI && window.AI && window.AI.hasRealAI && window.AI.hasRealAI()) {
      p = generateFromAI(baseOpts);
    } else {
      p = Promise.resolve(generateFromLocal(baseOpts));
    }

    return p.then(function (questions) {
      // 兜底：题目为空，至少返回本地若干
      if (!questions || !questions.length) {
        questions = generateFromLocal(baseOpts);
      }
      return {
        id: genId('paper'),
        subject: subject,
        grade: grade,
        version: version,
        difficulty: difficulty,
        questions: questions,
        createdAt: now()
      };
    });
  }

  // ===================================================
  // 7. 自适应会话
  // ===================================================

  /** 当前会话（内存） */
  var currentSession = null;

  /**
   * 开始一次答题会话
   * @param {Object} paper   generatePaper() 的返回值
   * @param {Object} opts    { mode: 'paper'|'boss', timeLimit, perQuestionLimit }
   * @return {Object} 会话对象
   */
  function startSession(paper, opts) {
    opts = opts || {};
    paper = paper || {};
    var questions = ensureArr(paper.questions);
    if (!questions.length) {
      hooks.toast('试卷没有题目，无法开始', 'warn');
      return null;
    }

    var mode = opts.mode || 'paper';
    var sess = {
      id: genId('sess'),
      type: mode,
      subject: paper.subject || 'math',
      grade: paper.grade || '',
      version: paper.version || '',
      questions: questions,
      answers: [],
      current: 0,
      difficulty: paper.difficulty || 'easy',
      streak: 0,
      diffHistory: [paper.difficulty || 'easy'],
      startTime: now(),
      endTime: 0,
      over: false,
      boss: null,
      coin: 0,
      exp: 0,
      stats: null
    };

    // BOSS 战模式：初始化 BOSS 状态
    if (mode === 'boss') {
      sess.boss = {
        bossHP: BOSS_DEFAULTS.bossMaxHP,
        bossMaxHP: BOSS_DEFAULTS.bossMaxHP,
        playerHP: BOSS_DEFAULTS.playerMaxHP,
        playerMaxHP: BOSS_DEFAULTS.playerMaxHP,
        questionIndex: 0,
        totalQuestions: Math.min(questions.length, BOSS_DEFAULTS.totalQuestions),
        startTime: now(),
        timeLimit: opts.timeLimit || BOSS_DEFAULTS.timeLimit,
        perQuestionLimit: opts.perQuestionLimit || BOSS_DEFAULTS.perQuestionLimit,
        correctCount: 0,
        wrongCount: 0,
        over: false,
        win: false
      };
    }

    currentSession = sess;
    return sess;
  }

  /**
   * 调整难度（核心算法）
   *  连对 3 题升级，答错降级
   * @param {Boolean} correct 是否答对
   * @return {String} 新难度
   */
  function adjustDifficulty(correct) {
    if (!currentSession) return 'easy';
    if (correct) {
      currentSession.streak++;
      if (currentSession.streak >= STREAK_UP) {
        currentSession.streak = 0;
        currentSession.difficulty = nextLevel(currentSession.difficulty);
      }
    } else {
      currentSession.streak = 0;
      currentSession.difficulty = prevLevel(currentSession.difficulty);
    }
    currentSession.diffHistory.push(currentSession.difficulty);
    return currentSession.difficulty;
  }

  /** 获取下一题应使用的难度 */
  function getNextDifficulty() {
    return currentSession ? currentSession.difficulty : 'easy';
  }

  /**
   * 提交答案（普通会话）
   * @param {String} questionId 题目 id
   * @param {*}      answer     用户答案（索引或文本）
   * @return {Object} { correct, difficulty, next, over, session }
   */
  function submitAnswer(questionId, answer) {
    if (!currentSession) {
      return { correct: false, difficulty: 'easy', over: true, session: null };
    }
    var sess = currentSession;
    if (sess.over) {
      return { correct: false, difficulty: sess.difficulty, over: true, session: sess };
    }

    // 找到题目
    var q = null;
    var idx = -1;
    for (var i = 0; i < sess.questions.length; i++) {
      if (sess.questions[i].id === questionId) {
        q = sess.questions[i]; idx = i; break;
      }
    }
    if (!q) {
      return { correct: false, difficulty: sess.difficulty, over: false, session: sess };
    }

    // 判对
    var correct = _checkAnswer(q, answer);
    var ts = now();
    var timeUsed = sess.answers.length ? ts - (sess.answers[sess.answers.length - 1].ts || sess.startTime) : ts - sess.startTime;

    sess.answers.push({
      qid: questionId,
      answer: answer,
      correct: correct,
      ts: ts,
      diff: sess.difficulty,
      timeUsed: timeUsed
    });

    // 错题入错题本
    if (!correct && window.WrongBook) {
      try {
        window.WrongBook.addFromQuiz({
          q: q.q,
          opts: q.opts,
          a: q.a,
          exp: q.exp,
          subject: q.subject || sess.subject,
          knowledge: q.knowledge || ''
        }, answer, q.subject || sess.subject);
      } catch (e) {
        console.warn('[Adaptive] 错题录入失败：', e);
      }
    }

    // 自适应调整
    adjustDifficulty(correct);

    // 推进到下一题
    sess.current = idx + 1;

    // 是否结束
    var over = sess.current >= sess.questions.length;
    if (over) {
      _finishInternal(sess);
    }

    return {
      correct: correct,
      difficulty: sess.difficulty,
      next: over ? null : sess.questions[sess.current],
      over: over,
      session: sess
    };
  }

  /** 判断答案是否正确（兼容索引/字母/文本） */
  function _checkAnswer(q, answer) {
    if (q.a == null) return false;
    // 数字索引
    if (typeof q.a === 'number') {
      if (typeof answer === 'number') return answer === q.a;
      // 字母 A/B/C/D
      if (typeof answer === 'string' && answer.length === 1) {
        var up = answer.toUpperCase();
        var code = up.charCodeAt(0) - 65;
        return code === q.a;
      }
      // 文本比较
      if (q.opts && q.opts[q.a] && answer === q.opts[q.a]) return true;
      return false;
    }
    // 字符串答案
    return String(answer) === String(q.a);
  }

  /** 内部：完成会话（计算奖励，记录历史） */
  function _finishInternal(sess) {
    sess.over = true;
    sess.endTime = now();

    var correctCount = 0;
    var total = sess.answers.length;
    for (var i = 0; i < total; i++) {
      if (sess.answers[i].correct) correctCount++;
    }
    var wrongCount = total - correctCount;

    // 奖励计算
    var coin = correctCount * PAPER_REWARDS.coinPerCorrect;
    var exp = correctCount * PAPER_REWARDS.expPerCorrect;
    if (correctCount === total && total > 0) coin += PAPER_REWARDS.bonusFullCorrect;
    if (wrongCount === 0 && total > 0) coin += PAPER_REWARDS.bonusNoWrong;

    // BOSS 战额外结算
    if (sess.type === 'boss' && sess.boss) {
      sess.boss.over = true;
      sess.boss.win = sess.boss.bossHP <= 0;
      if (sess.boss.win) {
        // 胜利奖励翻倍
        coin = coin * 2 + BOSS_DEFAULTS.coinPerWin;
        exp = exp * 2;
      }
    }

    sess.coin = coin;
    sess.exp = exp;
    sess.stats = _buildStats(sess);

    // 发放奖励
    try {
      if (coin) hooks.addCoin(coin);
      if (exp) hooks.addExp(exp);
    } catch (e) {
      console.warn('[Adaptive] 奖励发放失败：', e);
    }

    // 写入历史
    pushSession(sess);

    return sess;
  }

  /** 构建结算统计 */
  function _buildStats(sess) {
    var total = sess.answers.length;
    var correct = 0;
    var totalTime = 0;
    var diffCount = { easy: 0, normal: 0, hard: 0 };
    for (var i = 0; i < total; i++) {
      if (sess.answers[i].correct) correct++;
      totalTime += sess.answers[i].timeUsed || 0;
      var d = sess.answers[i].diff || 'normal';
      if (diffCount[d] != null) diffCount[d]++;
    }
    return {
      total: total,
      correct: correct,
      wrong: total - correct,
      accuracy: total > 0 ? Math.round(correct / total * 100) : 0,
      duration: sess.endTime - sess.startTime,
      avgTime: total > 0 ? Math.round(totalTime / total) : 0,
      diffDistribution: diffCount,
      diffHistory: sess.diffHistory.slice(),
      coin: sess.coin,
      exp: sess.exp,
      win: sess.type === 'boss' ? (sess.boss && sess.boss.win) : null
    };
  }

  // ===================================================
  // 8. BOSS 战
  // ===================================================

  /**
   * 开始 BOSS 战（封装 startSession）
   * @param {Object} paper 试卷
   * @param {Object} opts { timeLimit, perQuestionLimit }
   * @return {Object} 会话对象（含 boss 状态）
   */
  function startBoss(paper, opts) {
    opts = opts || {};
    opts.mode = 'boss';
    var sess = startSession(paper, opts);
    return sess;
  }

  /**
   * BOSS 战答题
   * @param {String} questionId 题目 id
   * @param {*}      answer     用户答案
   * @return {Object} { correct, bossHP, playerHP, over, win, next }
   */
  function bossAnswer(questionId, answer) {
    if (!currentSession || currentSession.type !== 'boss' || !currentSession.boss) {
      return { correct: false, over: true, win: false };
    }
    var sess = currentSession;
    var boss = sess.boss;
    if (boss.over) {
      return { correct: false, bossHP: boss.bossHP, playerHP: boss.playerHP, over: true, win: boss.win };
    }

    // 找到题目
    var q = null;
    var idx = -1;
    for (var i = 0; i < sess.questions.length; i++) {
      if (sess.questions[i].id === questionId) {
        q = sess.questions[i]; idx = i; break;
      }
    }
    if (!q) {
      return { correct: false, bossHP: boss.bossHP, playerHP: boss.playerHP, over: false };
    }

    var correct = _checkAnswer(q, answer);
    var ts = now();

    sess.answers.push({
      qid: questionId,
      answer: answer,
      correct: correct,
      ts: ts,
      diff: sess.difficulty,
      timeUsed: 0
    });

    if (correct) {
      // 答对：BOSS 扣血
      boss.bossHP = Math.max(0, boss.bossHP - BOSS_DEFAULTS.hpPerHit);
      boss.correctCount++;
    } else {
      // 答错：玩家扣血
      boss.playerHP = Math.max(0, boss.playerHP - BOSS_DEFAULTS.hpPerHit);
      boss.wrongCount++;
      // 错题入错题本
      if (window.WrongBook) {
        try {
          window.WrongBook.addFromQuiz({
            q: q.q, opts: q.opts, a: q.a, exp: q.exp,
            subject: q.subject || sess.subject,
            knowledge: q.knowledge || ''
          }, answer, q.subject || sess.subject);
        } catch (e) {}
      }
    }

    // 自适应难度
    adjustDifficulty(correct);

    // 推进
    boss.questionIndex++;
    sess.current = idx + 1;

    // 判断结束
    var over = false;
    var win = false;
    if (boss.bossHP <= 0) { over = true; win = true; }
    else if (boss.playerHP <= 0) { over = true; win = false; }
    else if (boss.questionIndex >= boss.totalQuestions) {
      // 题目用完，按 BOSS 血量判定
      over = true;
      win = boss.bossHP <= 0;
    }
    // 时间到
    if (!over && (ts - boss.startTime) >= boss.timeLimit) {
      over = true;
      win = boss.bossHP <= 0;
    }

    if (over) {
      _finishInternal(sess);
      return {
        correct: correct,
        bossHP: boss.bossHP,
        playerHP: boss.playerHP,
        over: true,
        win: sess.boss.win,
        next: null,
        session: sess
      };
    }

    return {
      correct: correct,
      bossHP: boss.bossHP,
      playerHP: boss.playerHP,
      over: false,
      win: false,
      next: sess.questions[sess.current] || null,
      session: sess
    };
  }

  /** 获取 BOSS 战当前状态 */
  function getBossState() {
    if (!currentSession || !currentSession.boss) return null;
    var b = currentSession.boss;
    return {
      bossHP: b.bossHP,
      bossMaxHP: b.bossMaxHP,
      playerHP: b.playerHP,
      playerMaxHP: b.playerMaxHP,
      questionIndex: b.questionIndex,
      totalQuestions: b.totalQuestions,
      elapsed: now() - b.startTime,
      timeLimit: b.timeLimit,
      remaining: Math.max(0, b.timeLimit - (now() - b.startTime)),
      correctCount: b.correctCount,
      wrongCount: b.wrongCount,
      over: b.over,
      win: b.win
    };
  }

  // ===================================================
  // 9. 学习路径图
  // ===================================================

  /** 路径数据缓存 */
  var _paths = null;

  /** 加载路径进度 */
  function loadPaths() {
    if (_paths) return _paths;
    _paths = safeGet(PATH_KEY, {});
    if (!_paths || typeof _paths !== 'object') _paths = {};
    return _paths;
  }

  /** 保存路径进度 */
  function savePaths() {
    return safeSet(PATH_KEY, _paths);
  }

  /**
   * 基于教材生成某学科的路径节点（首次访问时初始化）
   * @param {String} subject 学科
   * @return {Array} 节点数组
   */
  function _buildPathNodes(subject) {
    var DD = window.DD;
    var st = hooks.getState() || {};
    var grade = st.grade || 'g5up';
    var version = st.version || 'pep';
    var nodes = [];

    // 优先从教材取单元
    if (DD && DD.TEXTBOOKS) {
      var key = subject + '_' + version;
      var tb = DD.TEXTBOOKS[key];
      if (tb && tb[grade] && tb[grade].units) {
        var units = tb[grade].units;
        for (var i = 0; i < units.length; i++) {
          var u = units[i];
          var title = u.title || ('第' + u.unit + '单元');
          var knowledge = '';
          if (u.lessons && u.lessons.length) {
            knowledge = u.lessons[0].title || '';
          }
          nodes.push({
            id: 'node_' + subject + '_' + u.unit,
            subject: subject,
            unit: u.unit,
            title: title,
            knowledge: knowledge,
            status: i === 0 ? 'current' : 'locked', // 第一节默认当前
            unlockedAt: i === 0 ? now() : 0,
            masteredAt: 0,
            masteryRate: 0
          });
        }
      }
    }

    // 兜底：教材没有该学科数据，按本地题库分组生成
    if (!nodes.length && DD && DD.QUESTIONS) {
      var knowledges = {};
      for (var q = 0; q < DD.QUESTIONS.length; q++) {
        var item = DD.QUESTIONS[q];
        if (item.subject !== subject) continue;
        var kn = item.knowledge || '综合';
        if (!knowledges[kn]) knowledges[kn] = 0;
        knowledges[kn]++;
      }
      var ki = 0;
      for (var k in knowledges) {
        ki++;
        nodes.push({
          id: 'node_' + subject + '_' + ki,
          subject: subject,
          unit: ki,
          title: k,
          knowledge: k,
          status: ki === 1 ? 'current' : 'locked',
          unlockedAt: ki === 1 ? now() : 0,
          masteredAt: 0,
          masteryRate: 0
        });
      }
    }

    // 仍然为空，给个默认节点
    if (!nodes.length) {
      nodes.push({
        id: 'node_' + subject + '_1',
        subject: subject,
        unit: 1,
        title: '入门',
        knowledge: '基础',
        status: 'current',
        unlockedAt: now(),
        masteredAt: 0,
        masteryRate: 0
      });
    }
    return nodes;
  }

  /**
   * 获取某学科的学习路径图
   * @param {String} subject 学科
   * @return {Array} 节点数组（已合并进度）
   */
  function getPathMap(subject) {
    subject = subject || 'math';
    var paths = loadPaths();
    if (!paths[subject]) {
      paths[subject] = _buildPathNodes(subject);
      savePaths();
    }

    // 根据错题本和答题数据，刷新掌握率
    var nodes = paths[subject];
    var wbMap = {};
    if (window.WrongBook) {
      var wbList = window.WrongBook.list({ subject: subject }) || [];
      for (var i = 0; i < wbList.length; i++) {
        var kn = wbList[i].knowledge || '';
        if (!kn) continue;
        if (!wbMap[kn]) wbMap[kn] = { total: 0, mastered: 0 };
        wbMap[kn].total++;
        if (wbList[i].mastery >= 2) wbMap[kn].mastered++;
      }
    }

    for (var j = 0; j < nodes.length; j++) {
      var n = nodes[j];
      var kn = n.knowledge || '';
      if (kn && wbMap[kn]) {
        var r = wbMap[kn].total > 0 ? Math.round(wbMap[kn].mastered / wbMap[kn].total * 100) : 0;
        n.masteryRate = r;
        if (r >= 80 && n.status !== 'mastered') {
          n.status = 'mastered';
          n.masteredAt = n.masteredAt || now();
          // 自动解锁下一节点
          if (j + 1 < nodes.length && nodes[j + 1].status === 'locked') {
            nodes[j + 1].status = 'current';
            nodes[j + 1].unlockedAt = now();
          }
        }
      }
    }
    savePaths();
    return nodes;
  }

  /**
   * 解锁指定节点（手动）
   * @param {String} subject 学科
   * @param {String} nodeId  节点 id
   * @return {Object|null} 更新后的节点
   */
  function unlockNode(subject, nodeId) {
    var nodes = getPathMap(subject);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        if (nodes[i].status === 'locked') {
          nodes[i].status = 'current';
          nodes[i].unlockedAt = now();
          savePaths();
        }
        return nodes[i];
      }
    }
    return null;
  }

  /**
   * 获取某学科路径进度
   * @param {String} subject
   * @return {Object} { total, mastered, current, locked, progress }
   */
  function getPathProgress(subject) {
    var nodes = getPathMap(subject);
    var total = nodes.length;
    var mastered = 0, current = 0, locked = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].status === 'mastered') mastered++;
      else if (nodes[i].status === 'current') current++;
      else locked++;
    }
    return {
      total: total,
      mastered: mastered,
      current: current,
      locked: locked,
      progress: total > 0 ? Math.round(mastered / total * 100) : 0
    };
  }

  /**
   * 渲染学习路径图为 SVG
   *  节点：已掌握（绿）/ 当前（橙）/ 未解锁（灰）
   *  形状：曲折路径连线 + 圆形节点 + 标签
   * @param {String} subject 学科
   * @return {String} SVG 字符串
   */
  function renderPathMapSVG(subject) {
    var nodes = getPathMap(subject);
    var n = nodes.length;
    if (n === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">' +
             '<text x="200" y="50" text-anchor="middle" fill="#999" font-size="14">暂无路径数据</text>' +
             '</svg>';
    }

    // 布局参数
    var nodeR = 22;
    var hGap = 110;     // 横向间距
    var vAmp = 50;      // 上下波幅
    var padX = 50;
    var padY = 80;
    var width = padX * 2 + (n - 1) * hGap;
    var height = padY * 2 + vAmp * 2 + 60;

    var STATUS_COLOR = {
      mastered: '#2ECC71',
      current: '#FF9800',
      locked: '#BDBDBD'
    };
    var STATUS_ICON = {
      mastered: '✓',
      current: '▶',
      locked: '🔒'
    };

    // 计算每个节点的坐标（之字形）
    var coords = [];
    for (var i = 0; i < n; i++) {
      var x = padX + i * hGap;
      var y = padY + (i % 2 === 0 ? 0 : vAmp * 2) + vAmp;
      coords.push({ x: x, y: y });
    }

    var parts = '';
    // 标题
    parts += '<text x="' + (width / 2) + '" y="28" text-anchor="middle" font-size="16" fill="#333" font-weight="bold">' +
             subjectName(subject) + '学习路径</text>';

    // 连线
    for (var j = 0; j < n - 1; j++) {
      var a = coords[j], b = coords[j + 1];
      var locked = nodes[j].status === 'locked' || nodes[j + 1].status === 'locked';
      var stroke = locked ? '#E0E0E0' : '#7C5CFF';
      var dash = locked ? '4,4' : '';
      parts += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
               '" stroke="' + stroke + '" stroke-width="2" stroke-dasharray="' + dash + '" stroke-linecap="round"/>';
    }

    // 节点
    for (var k = 0; k < n; k++) {
      var c = coords[k];
      var nd = nodes[k];
      var color = STATUS_COLOR[nd.status] || STATUS_COLOR.locked;
      // 外圈光晕（当前节点）
      if (nd.status === 'current') {
        parts += '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + (nodeR + 6) +
                 '" fill="' + color + '" opacity="0.2"/>';
      }
      // 主圆
      parts += '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + nodeR +
               '" fill="' + color + '" stroke="#fff" stroke-width="3"/>';
      // 图标
      parts += '<text x="' + c.x + '" y="' + (c.y + 5) + '" text-anchor="middle" font-size="16" fill="#fff">' +
               STATUS_ICON[nd.status] + '</text>';
      // 单元标签
      var label = nd.title || ('第' + nd.unit + '单元');
      if (label.length > 8) label = label.substring(0, 8) + '…';
      parts += '<text x="' + c.x + '" y="' + (c.y + nodeR + 18) + '" text-anchor="middle" font-size="11" fill="#555">' +
               label + '</text>';
      // 掌握率（已掌握/当前显示）
      if (nd.status !== 'locked' && nd.masteryRate > 0) {
        parts += '<text x="' + c.x + '" y="' + (c.y + nodeR + 32) + '" text-anchor="middle" font-size="10" fill="' + color + '">' +
                 nd.masteryRate + '%</text>';
      }
    }

    // 图例
    var legendY = height - 14;
    var lx = padX;
    var legendItems = [
      { color: STATUS_COLOR.mastered, label: '已掌握' },
      { color: STATUS_COLOR.current, label: '当前' },
      { color: STATUS_COLOR.locked, label: '未解锁' }
    ];
    for (var li = 0; li < legendItems.length; li++) {
      parts += '<circle cx="' + lx + '" cy="' + legendY + '" r="6" fill="' + legendItems[li].color + '"/>';
      parts += '<text x="' + (lx + 12) + '" y="' + (legendY + 4) + '" font-size="11" fill="#666">' + legendItems[li].label + '</text>';
      lx += 70;
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
           '" viewBox="0 0 ' + width + ' ' + height + '">' + parts + '</svg>';
  }

  // ===================================================
  // 10. 三环紧扣（预习 → 学习 → 复习）
  // ===================================================

  /** 三环状态缓存（内存） */
  var loopState = {
    subject: null,
    topic: null,
    stage: null,    // 'pre' / 'learn' / 'review'
    preDone: false,
    learnDone: false,
    reviewDone: false
  };

  /**
   * 预习环：AI 讲解知识点
   * @param {String} subject 学科
   * @param {String} topic   知识点 / 主题
   * @param {Object} callbacks { onChunk, onDone, onError }
   * @return {Promise}
   */
  function startPreLearn(subject, topic, callbacks) {
    callbacks = callbacks || {};
    var AI = window.AI;
    if (!AI) {
      var err = new Error('AI 模块未加载');
      if (callbacks.onError) callbacks.onError(err);
      return Promise.reject(err);
    }

    loopState.subject = subject;
    loopState.topic = topic;
    loopState.stage = 'pre';

    var sys = AI.buildSystemPrompt({ subject: subject }) +
      '\n你是预习辅导老师。请用引导式、有趣的方式讲解知识点，让孩子先建立直观印象。' +
      '要求：1) 联系生活实际；2) 用比喻或故事；3) 不超过 300 字；4) 结尾给一个小思考题。';
    var userText = '请给我预习讲解：\n学科：' + subjectName(subject) + '\n知识点：' + (topic || '基础') +
      '\n请用适合 5-6 年级小学生的语言，给我一次简短有趣的预习讲解。';

    if (AI.chatStream && callbacks.onChunk) {
      return AI.chatStream([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ], {
        onChunk: function (t) { if (callbacks.onChunk) callbacks.onChunk(t); },
        onDone: function () {
          loopState.preDone = true;
          if (callbacks.onDone) callbacks.onDone();
        },
        onError: function (e) { if (callbacks.onError) callbacks.onError(e); }
      });
    }
    return AI.chat([
      { role: 'system', content: sys },
      { role: 'user', content: userText }
    ]).then(function (text) {
      if (callbacks.onChunk) callbacks.onChunk(text);
      loopState.preDone = true;
      if (callbacks.onDone) callbacks.onDone();
      return text;
    }).catch(function (e) {
      if (callbacks.onError) callbacks.onError(e);
      throw e;
    });
  }

  /**
   * 学习环：答题闯关（基于知识点生成小试卷并启动会话）
   * @param {String} subject 学科
   * @param {String} topic   知识点（可选）
   * @return {Promise<Object>} 会话对象
   */
  function startLearn(subject, topic) {
    loopState.subject = subject;
    loopState.topic = topic;
    loopState.stage = 'learn';

    return generatePaper({
      subject: subject,
      count: 10,
      knowledge: topic || null,
      useAI: false   // 学习环用本地题库即可，快速开始
    }).then(function (paper) {
      var sess = startSession(paper, { mode: 'paper' });
      loopState._learnSession = sess;
      return sess;
    });
  }

  /**
   * 复习环：错题 + 变种题
   * @param {String} subject 学科
   * @return {Promise<Object>} 会话对象
   */
  function startReview(subject) {
    loopState.subject = subject;
    loopState.stage = 'review';

    var questions = [];
    // 1. 取今天到期的错题
    if (window.WrongBook) {
      var due = window.WrongBook.getDueItems() || [];
      var dueOfSubject = [];
      for (var i = 0; i < due.length; i++) {
        if (due[i].subject === subject) dueOfSubject.push(due[i]);
      }
      // 取前 5 道
      var picks = sample(dueOfSubject, Math.min(5, dueOfSubject.length));
      for (var j = 0; j < picks.length; j++) {
        var it = picks[j];
        questions.push({
          id: it.id + '_rv',
          q: it.q,
          opts: it.opts,
          a: it.a,
          exp: it.exp || '',
          diff: it.diff || (it.mastery === 0 ? 'easy' : 'normal'),
          subject: subject,
          knowledge: it.knowledge || '',
          fromWrong: true
        });
      }
    }

    // 2. 题量不足，从本地题库补足到 10 题
    if (questions.length < 10) {
      var local = generateFromLocal({
        subject: subject,
        count: 10 - questions.length,
        wrongbook: false
      });
      questions = questions.concat(local);
    }
    questions = questions.slice(0, 10);

    var paper = {
      id: genId('paper_review'),
      subject: subject,
      grade: '',
      version: '',
      difficulty: 'normal',
      questions: questions,
      createdAt: now()
    };
    var sess = startSession(paper, { mode: 'paper' });
    loopState._reviewSession = sess;
    loopState.reviewDone = false;
    return sess;
  }

  /**
   * 获取三环当前状态
   * @return {Object} { stage, preDone, learnDone, reviewDone }
   */
  function getLoopState() {
    // 学习环是否完成
    if (loopState._learnSession && loopState._learnSession.over) {
      loopState.learnDone = true;
    }
    if (loopState._reviewSession && loopState._reviewSession.over) {
      loopState.reviewDone = true;
    }
    return {
      subject: loopState.subject,
      topic: loopState.topic,
      stage: loopState.stage,
      preDone: loopState.preDone,
      learnDone: loopState.learnDone,
      reviewDone: loopState.reviewDone
    };
  }

  // ===================================================
  // 11. 试卷结算
  // ===================================================

  /**
   * 结束当前会话（手动提前结束也调用此方法）
   * @return {Object} 结算结果 { stats, coin, exp, evaluation }
   */
  function finishSession() {
    if (!currentSession) return null;
    if (!currentSession.over) {
      _finishInternal(currentSession);
    }

    // AI 评价
    return _buildSettlement(currentSession);
  }

  /** 构建完整结算（含 AI 评价） */
  function _buildSettlement(sess) {
    var result = {
      session: sess,
      stats: sess.stats,
      coin: sess.coin,
      exp: sess.exp,
      evaluation: ''
    };

    // 生成 AI 评价（异步通过 chat）
    var AI = window.AI;
    if (AI) {
      var sys = AI.buildSystemPrompt({ subject: sess.subject }) +
        '\n你是学习评价老师。根据孩子的答题数据给出简短、温暖、有针对性的评价，不超过 200 字。';
      var s = sess.stats || {};
      var userText = '请评价孩子本次答题：\n' +
        '学科：' + subjectName(sess.subject) + '\n' +
        '题目数：' + s.total + '\n' +
        '正确数：' + s.correct + '\n' +
        '正确率：' + s.accuracy + '%\n' +
        '用时：' + fmtDuration(s.duration) + '\n' +
        '难度分布：简单 ' + (s.diffDistribution ? s.diffDistribution.easy : 0) +
        ' / 中等 ' + (s.diffDistribution ? s.diffDistribution.normal : 0) +
        ' / 困难 ' + (s.diffDistribution ? s.diffDistribution.hard : 0) + '\n' +
        (sess.type === 'boss' ? '模式：BOSS 战（' + (sess.boss && sess.boss.win ? '胜利' : '失败') + '）\n' : '') +
        '\n请给一段温暖的评价，并指出一个改进点。';

      // 异步获取评价，不阻塞结算
      AI.chat([
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ]).then(function (text) {
        result.evaluation = text;
        if (hooks.onEvaluation) hooks.onEvaluation(text);
      }).catch(function (e) {
        result.evaluation = _localEvaluation(sess);
      });
    } else {
      result.evaluation = _localEvaluation(sess);
    }

    return result;
  }

  /** 本地兜底评价（无 AI 时） */
  function _localEvaluation(sess) {
    var s = sess.stats || {};
    var acc = s.accuracy || 0;
    if (acc >= 90) {
      return '太棒了！正确率 ' + acc + '%，几乎是满分哦！继续保持，你就是小学霸！🌟';
    } else if (acc >= 70) {
      return '做得不错！正确率 ' + acc + '%。再仔细一点点，下次可以更好！💪';
    } else if (acc >= 50) {
      return '正确率 ' + acc + '%，还有进步空间。错题记得看解析，理解了就会啦！📖';
    } else {
      return '正确率 ' + acc + '%，不要灰心，多看错题本，慢慢就会进步的！加油！🌈';
    }
  }

  /**
   * 获取当前会话的实时统计（不结束会话）
   * @return {Object} 统计数据
   */
  function getSessionStats() {
    if (!currentSession) return null;
    var sess = currentSession;
    var total = sess.answers.length;
    var correct = 0;
    var totalTime = 0;
    for (var i = 0; i < total; i++) {
      if (sess.answers[i].correct) correct++;
      totalTime += sess.answers[i].timeUsed || 0;
    }
    return {
      current: sess.current,
      total: sess.questions.length,
      answered: total,
      correct: correct,
      wrong: total - correct,
      accuracy: total > 0 ? Math.round(correct / total * 100) : 0,
      streak: sess.streak,
      difficulty: sess.difficulty,
      diffHistory: sess.diffHistory.slice(),
      elapsed: now() - sess.startTime,
      avgTime: total > 0 ? Math.round(totalTime / total) : 0,
      over: sess.over
    };
  }

  // ===================================================
  // 12. 暴露 API
  // ===================================================

  window.Adaptive = {
    // —— 常量 ——
    DIFF_LEVELS: DIFF_LEVELS,
    DIFF_NAMES: DIFF_NAMES,
    DIFF_COLORS: DIFF_COLORS,
    SUBJECT_NAMES: SUBJECT_NAMES,
    BOSS_DEFAULTS: BOSS_DEFAULTS,
    PAPER_REWARDS: PAPER_REWARDS,
    STREAK_UP: STREAK_UP,

    // —— 配置 ——
    config: config,

    // —— 用户画像 ——
    getProfile: getProfile,
    initDifficulty: initDifficulty,

    // —— 试卷生成 ——
    generatePaper: generatePaper,
    generateFromLocal: generateFromLocal,
    generateFromAI: generateFromAI,

    // —— 自适应逻辑 ——
    startSession: startSession,
    submitAnswer: submitAnswer,
    getNextDifficulty: getNextDifficulty,
    adjustDifficulty: adjustDifficulty,

    // —— BOSS 战 ——
    startBoss: startBoss,
    bossAnswer: bossAnswer,
    getBossState: getBossState,

    // —— 学习路径 ——
    getPathMap: getPathMap,
    unlockNode: unlockNode,
    getPathProgress: getPathProgress,
    renderPathMapSVG: renderPathMapSVG,

    // —— 三环紧扣 ——
    startPreLearn: startPreLearn,
    startLearn: startLearn,
    startReview: startReview,
    getLoopState: getLoopState,

    // —— 结算 ——
    finishSession: finishSession,
    getSessionStats: getSessionStats,

    // —— 难度工具 ——
    nextLevel: nextLevel,
    prevLevel: prevLevel,
    diffIndex: diffIndex,

    // —— 历史会话 ——
    listSessions: listSessions,

    // —— 工具 ——
    fmtDuration: fmtDuration,
    subjectName: subjectName
  };

})(window);
