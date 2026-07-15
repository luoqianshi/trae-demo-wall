/* =====================================================
 *  叮咚学 v3 · 广场 3.0 剧本系统引擎 (script.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.DD (data.js) 中的 SAMPLE_SCRIPTS
 *  暴露：window.Script
 *
 *  功能总览：
 *    1. 剧本编辑器（场景 / 选项 / 结局 / 信息）
 *    2. 剧本体验（互动阅读，前进 / 后退 / 重新开始）
 *    3. 社交功能（发布 / 点赞 / 收藏 / 投喂 / 排行榜）
 *    4. 数据管理（草稿自动保存 / 序列化 / 校验）
 *
 *  与 app.js 的对接：
 *    由于 app.js 中的 state、addCoin、toast 等是私有的，
 *    app.js 启动时调用 Script.config({ ... }) 注入这些方法即可。
 *    若未注入，模块会使用默认实现（读 localStorage / 控制台输出）。
 * ===================================================== */
(function (window) {
  'use strict';

  // ===================================================
  // 0. 常量与存储键
  // ===================================================

  var STORAGE_KEY   = 'dd.scripts';        // 我的剧本列表（草稿 + 已发布）
  var SQUARE_KEY    = 'dd.scripts.square'; // 广场剧本（含社交数据）
  var LIKES_KEY     = 'dd.scripts.likes';  // 我点赞过的剧本 id 列表
  var COLLECTS_KEY  = 'dd.scripts.coll';   // 我收藏的剧本 id 列表
  var PLAY_LOG_KEY  = 'dd.scripts.play';   // 体验记录（用于排行：体验次数）
  var CREATE_COST   = 50;                  // 创建新剧本消耗的叮咚币
  var MAX_CHOICES   = 4;                   // 每个场景最多选项数
  var MIN_CHOICES   = 2;                   // 每个场景最少选项数

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
    return (prefix || 's') + '_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 8);
  }

  /** 判断是否为数字 */
  function isNum(n) { return typeof n === 'number' && !isNaN(n); }

  // ===================================================
  // 2. 与 app.js 的钩子（可注入）
  // ===================================================

  var hooks = {
    /** 获取当前叮咚币数量 */
    getCoin: function () {
      var s = safeGet('dd_state', null);
      return s && isNum(s.coin) ? s.coin : 0;
    },
    /** 增加叮咚币（n 可为负数表示消耗） */
    addCoin: function (n) {
      var s = safeGet('dd_state', null);
      if (!s) s = { coin: 0 };
      s.coin = (s.coin || 0) + n;
      safeSet('dd_state', s);
    },
    /** 显示提示消息 */
    toast: function (msg, type) {
      try { console.log('[Script ' + (type || 'info') + '] ' + msg); } catch (e) {}
    },
    /** 获取当前用户名 */
    getUser: function () {
      var s = safeGet('dd_state', null);
      return (s && s.name) || '匿名小作者';
    },
    /** 获取当前用户头像 */
    getAvatar: function () {
      var s = safeGet('dd_state', null);
      return (s && s.avatar) || '📝';
    }
  };

  /**
   * 由 app.js 注入钩子函数，例如：
   *   Script.config({
   *     getCoin: function(){ return state.coin; },
   *     addCoin: addCoin,
   *     toast: toast,
   *     getUser: function(){ return state.name; },
   *     getAvatar: function(){ return state.avatar; }
   *   });
   */
  function config(opts) {
    if (!opts) return;
    if (typeof opts.getCoin   === 'function') hooks.getCoin   = opts.getCoin;
    if (typeof opts.addCoin   === 'function') hooks.addCoin   = opts.addCoin;
    if (typeof opts.toast     === 'function') hooks.toast     = opts.toast;
    if (typeof opts.getUser   === 'function') hooks.getUser   = opts.getUser;
    if (typeof opts.getAvatar === 'function') hooks.getAvatar = opts.getAvatar;
  }

  // ===================================================
  // 3. 剧本结构创建与编辑
  // ===================================================

  /**
   * 创建一个空剧本（消耗 CREATE_COST 叮咚币）
   * @returns {Object|null} 新剧本对象；若叮咚币不足返回 null
   */
  function createNew() {
    if (hooks.getCoin() < CREATE_COST) {
      hooks.toast('叮咚币不足，创建剧本需要 ' + CREATE_COST + ' 币', 'warn');
      return null;
    }
    hooks.addCoin(-CREATE_COST);
    var script = {
      id: genId('script'),
      title: '未命名剧本',
      author: hooks.getUser(),
      avatar: hooks.getAvatar(),
      emoji: '📖',
      desc: '这是一个新剧本，快来编写你的故事吧！',
      reward: 20,
      scenes: [
        {
          id: 0,
          bg: '故事开始的地方',
          text: '在这里写下场景描述……',
          emoji: '🌟',
          choices: [
            { text: '选项一', next: -1 },
            { text: '选项二', next: -1 }
          ]
        }
      ],
      ending: '感谢体验！',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      published: false    // 是否已发布到广场
    };
    hooks.toast('剧本已创建，消耗 ' + CREATE_COST + ' 叮咚币', 'success');
    return script;
  }

  /**
   * 添加场景到剧本
   * @param {Object} script    剧本对象
   * @param {Object} sceneData 场景数据 { bg, text, emoji, choices }
   * @returns {Object} 新增的场景对象
   */
  function addScene(script, sceneData) {
    if (!script || !script.scenes) return null;
    var newId = script.scenes.length;
    // 找一个未使用的 id（防止删除后产生冲突）
    while (getScene(script, newId)) newId++;
    var scene = {
      id: newId,
      bg: (sceneData && sceneData.bg) || '新场景',
      text: (sceneData && sceneData.text) || '',
      emoji: (sceneData && sceneData.emoji) || '🎬',
      choices: (sceneData && sceneData.choices) || []
    };
    script.scenes.push(scene);
    script.updatedAt = Date.now();
    return scene;
  }

  /**
   * 更新场景
   * @param {Object} script   剧本对象
   * @param {Number} sceneId  场景 id
   * @param {Object} data     要更新的字段 { bg, text, emoji }
   * @returns {Object|null} 更新后的场景
   */
  function updateScene(script, sceneId, data) {
    var scene = getScene(script, sceneId);
    if (!scene || !data) return null;
    if (typeof data.bg    !== 'undefined') scene.bg    = data.bg;
    if (typeof data.text  !== 'undefined') scene.text  = data.text;
    if (typeof data.emoji !== 'undefined') scene.emoji = data.emoji;
    script.updatedAt = Date.now();
    return scene;
  }

  /**
   * 删除场景（同时清理其它场景中跳转到该场景的选项）
   * @param {Object} script  剧本对象
   * @param {Number} sceneId 场景 id
   * @returns {Boolean} 是否删除成功
   */
  function removeScene(script, sceneId) {
    if (!script || !script.scenes) return false;
    // 不允许删除最后一个场景
    if (script.scenes.length <= 1) {
      hooks.toast('至少需要保留 1 个场景', 'warn');
      return false;
    }
    // 不允许删除起始场景（id=0），保证体验入口有效
    if (sceneId === 0) {
      hooks.toast('不能删除起始场景', 'warn');
      return false;
    }
    var idx = -1;
    for (var i = 0; i < script.scenes.length; i++) {
      if (script.scenes[i].id === sceneId) { idx = i; break; }
    }
    if (idx < 0) return false;
    script.scenes.splice(idx, 1);
    // 清理引用：把指向被删除场景的选项改为跳到结局
    for (var j = 0; j < script.scenes.length; j++) {
      var chs = script.scenes[j].choices || [];
      for (var k = 0; k < chs.length; k++) {
        if (chs[k].next === sceneId) chs[k].next = -1;
      }
    }
    script.updatedAt = Date.now();
    return true;
  }

  /**
   * 给场景添加选项
   * @param {Object} script     剧本对象
   * @param {Number} sceneId    场景 id
   * @param {Object} choiceData { text, next }
   * @returns {Object|null} 新增的选项
   */
  function addChoice(script, sceneId, choiceData) {
    var scene = getScene(script, sceneId);
    if (!scene) return null;
    if (!scene.choices) scene.choices = [];
    if (scene.choices.length >= MAX_CHOICES) {
      hooks.toast('每个场景最多 ' + MAX_CHOICES + ' 个选项', 'warn');
      return null;
    }
    var choice = {
      text: (choiceData && choiceData.text) || '新选项',
      next: isNum(choiceData && choiceData.next) ? choiceData.next : -1
    };
    scene.choices.push(choice);
    script.updatedAt = Date.now();
    return choice;
  }

  /**
   * 删除场景的某个选项
   * @param {Object} script  剧本对象
   * @param {Number} sceneId 场景 id
   * @param {Number} choiceIndex 选项索引
   * @returns {Boolean} 是否删除成功
   */
  function removeChoice(script, sceneId, choiceIndex) {
    var scene = getScene(script, sceneId);
    if (!scene || !scene.choices) return false;
    if (scene.choices.length <= MIN_CHOICES) {
      hooks.toast('每个场景至少保留 ' + MIN_CHOICES + ' 个选项', 'warn');
      return false;
    }
    if (choiceIndex < 0 || choiceIndex >= scene.choices.length) return false;
    scene.choices.splice(choiceIndex, 1);
    script.updatedAt = Date.now();
    return true;
  }

  /**
   * 设置结局文字
   * @param {Object} script 剧本对象
   * @param {String} text   结局文字
   */
  function setEnding(script, text) {
    if (!script) return;
    script.ending = text || '';
    script.updatedAt = Date.now();
  }

  /**
   * 设置剧本基础信息
   * @param {Object} script 剧本对象
   * @param {Object} info   { title, desc, emoji, reward }
   */
  function setInfo(script, info) {
    if (!script || !info) return;
    if (info.title)  script.title  = info.title;
    if (info.desc)   script.desc   = info.desc;
    if (info.emoji)  script.emoji  = info.emoji;
    if (isNum(info.reward)) script.reward = info.reward;
    script.updatedAt = Date.now();
  }

  // ===================================================
  // 4. 持久化（localStorage）
  // ===================================================

  /**
   * 保存单个剧本（草稿自动保存也用此方法）
   * @param {Object} script 剧本对象
   * @returns {Boolean}
   */
  function saveScript(script) {
    if (!script || !script.id) return false;
    var list = safeGet(STORAGE_KEY, []);
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === script.id) {
        list[i] = script;
        found = true;
        break;
      }
    }
    if (!found) list.push(script);
    return safeSet(STORAGE_KEY, list);
  }

  /**
   * 加载所有剧本（我的剧本列表）
   * @returns {Array}
   */
  function loadScripts() {
    return safeGet(STORAGE_KEY, []);
  }

  /**
   * 按 id 获取单个剧本
   * @param {String} id 剧本 id
   * @returns {Object|null}
   */
  function getScript(id) {
    var list = loadScripts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    // 再到广场里找
    var sq = safeGet(SQUARE_KEY, []);
    for (var j = 0; j < sq.length; j++) {
      if (sq[j].id === id) return sq[j];
    }
    // 再到示例剧本里找
    if (window.DD && DD.SAMPLE_SCRIPTS) {
      for (var k = 0; k < DD.SAMPLE_SCRIPTS.length; k++) {
        if (DD.SAMPLE_SCRIPTS[k].id === id) return DD.SAMPLE_SCRIPTS[k];
      }
    }
    return null;
  }

  /**
   * 删除剧本（同时从广场移除）
   * @param {String} id 剧本 id
   * @returns {Boolean}
   */
  function deleteScript(id) {
    var list = safeGet(STORAGE_KEY, []);
    var newList = [];
    var removed = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { removed = true; continue; }
      newList.push(list[i]);
    }
    safeSet(STORAGE_KEY, newList);
    // 从广场移除
    var sq = safeGet(SQUARE_KEY, []);
    var newSq = [];
    for (var j = 0; j < sq.length; j++) {
      if (sq[j].id === id) continue;
      newSq.push(sq[j]);
    }
    safeSet(SQUARE_KEY, newSq);
    return removed;
  }

  // ===================================================
  // 5. 剧本体验（互动阅读）
  // ===================================================

  /**
   * 开始体验剧本
   * @param {Object} script 剧本对象
   * @param {Object} opts   回调 { onScene(scene), onEnd(ending), onBack(prevScene) }
   * @returns {Object} 体验上下文 { script, history:[sceneId], opts }
   */
  function play(script, opts) {
    if (!script || !script.scenes || script.scenes.length === 0) {
      hooks.toast('剧本内容为空', 'warn');
      return null;
    }
    var ctx = {
      script: script,
      history: [script.scenes[0].id],   // 历史场景 id 栈
      opts: opts || {}
    };
    _showCurrent(ctx);
    return ctx;
  }

  /** 显示当前场景（内部方法） */
  function _showCurrent(ctx) {
    var curId = ctx.history[ctx.history.length - 1];
    var scene = getScene(ctx.script, curId);
    if (!scene) {
      // 场景不存在，直接到结局
      if (ctx.opts.onEnd) ctx.opts.onEnd(ctx.script.ending || '故事结束');
      return;
    }
    if (ctx.opts.onScene) ctx.opts.onScene(scene, ctx);
  }

  /**
   * 跳转到下一个场景
   * @param {Object} ctx          体验上下文（由 play 返回）
   * @param {Number} currentId    当前场景 id
   * @param {Number} choiceIndex  选择的选项索引
   * @returns {Object|null} 下一个场景或结局标记
   */
  function nextScene(ctx, currentId, choiceIndex) {
    if (!ctx || !ctx.script) return null;
    var scene = getScene(ctx.script, currentId);
    if (!scene || !scene.choices) return null;
    if (choiceIndex < 0 || choiceIndex >= scene.choices.length) return null;
    var next = scene.choices[choiceIndex].next;
    if (next === -1) {
      // 到达结局
      _recordPlay(ctx.script.id);
      if (ctx.opts.onEnd) ctx.opts.onEnd(ctx.script.ending || '故事结束');
      return { end: true };
    }
    ctx.history.push(next);
    _showCurrent(ctx);
    return getScene(ctx.script, next);
  }

  /**
   * 返回上一场景
   * @param {Object} ctx 体验上下文
   * @returns {Object|null} 上一场景
   */
  function back(ctx) {
    if (!ctx || !ctx.history || ctx.history.length <= 1) {
      hooks.toast('已经是开头了', 'info');
      return null;
    }
    ctx.history.pop();
    var curId = ctx.history[ctx.history.length - 1];
    var scene = getScene(ctx.script, curId);
    if (scene && ctx.opts.onBack) ctx.opts.onBack(scene, ctx);
    else if (scene && ctx.opts.onScene) ctx.opts.onScene(scene, ctx);
    return scene;
  }

  /**
   * 重新开始（清空历史）
   * @param {Object} ctx
   */
  function restart(ctx) {
    if (!ctx || !ctx.script) return;
    ctx.history = [ctx.script.scenes[0].id];
    _showCurrent(ctx);
  }

  /**
   * 获取剧本中的场景
   * @param {Object} script 剧本对象
   * @param {Number} id     场景 id
   * @returns {Object|null}
   */
  function getScene(script, id) {
    if (!script || !script.scenes) return null;
    for (var i = 0; i < script.scenes.length; i++) {
      if (script.scenes[i].id === id) return script.scenes[i];
    }
    return null;
  }

  /** 记录一次体验（用于排行榜） */
  function _recordPlay(id) {
    var log = safeGet(PLAY_LOG_KEY, {});
    log[id] = (log[id] || 0) + 1;
    safeSet(PLAY_LOG_KEY, log);
    // 同步到广场
    var sq = safeGet(SQUARE_KEY, []);
    for (var i = 0; i < sq.length; i++) {
      if (sq[i].id === id) {
        sq[i].plays = (sq[i].plays || 0) + 1;
        break;
      }
    }
    safeSet(SQUARE_KEY, sq);
  }

  // ===================================================
  // 6. 社交功能
  // ===================================================

  /**
   * 发布剧本到广场
   * @param {Object} script 剧本对象
   * @returns {Boolean}
   */
  function publishToSquare(script) {
    if (!script) return false;
    // 发布前校验
    var v = validate(script);
    if (!v.ok) {
      hooks.toast('剧本不完整：' + v.msg, 'warn');
      return false;
    }
    script.published = true;
    script.publishedAt = Date.now();
    script.plays  = script.plays  || 0;
    script.likes  = script.likes  || 0;
    script.collects = script.collects || 0;
    script.tips   = script.tips   || 0;
    // 先保存到我的剧本
    saveScript(script);
    // 写入广场
    var sq = safeGet(SQUARE_KEY, []);
    var found = false;
    for (var i = 0; i < sq.length; i++) {
      if (sq[i].id === script.id) { sq[i] = script; found = true; break; }
    }
    if (!found) sq.push(script);
    safeSet(SQUARE_KEY, sq);
    hooks.toast('剧本已发布到广场！', 'success');
    return true;
  }

  /**
   * 获取广场剧本列表
   * @returns {Array}
   */
  function getSquare() {
    var sq = safeGet(SQUARE_KEY, []);
    // 合并示例剧本（让广场有内容）
    if (window.DD && DD.SAMPLE_SCRIPTS) {
      var ids = {};
      for (var i = 0; i < sq.length; i++) ids[sq[i].id] = true;
      for (var j = 0; j < DD.SAMPLE_SCRIPTS.length; j++) {
        var s = DD.SAMPLE_SCRIPTS[j];
        if (!ids[s.id]) {
          sq.push({
            id: s.id, title: s.title, author: s.author, avatar: '🤖',
            emoji: s.emoji, desc: s.desc, reward: s.reward,
            scenes: s.scenes, ending: s.ending,
            published: true, publishedAt: 0,
            plays: 0, likes: 0, collects: 0, tips: 0,
            isSample: true
          });
        }
      }
    }
    return sq;
  }

  /**
   * 点赞剧本（每个剧本每人只能点一次）
   * @param {String} id 剧本 id
   * @returns {Boolean} true=点赞成功，false=已点过或失败
   */
  function like(id) {
    var likes = safeGet(LIKES_KEY, []);
    var already = false;
    for (var i = 0; i < likes.length; i++) {
      if (likes[i] === id) { already = true; break; }
    }
    if (already) {
      hooks.toast('你已经点过赞啦', 'info');
      return false;
    }
    likes.push(id);
    safeSet(LIKES_KEY, likes);
    // 广场剧本点赞数 +1
    var sq = safeGet(SQUARE_KEY, []);
    for (var j = 0; j < sq.length; j++) {
      if (sq[j].id === id) { sq[j].likes = (sq[j].likes || 0) + 1; break; }
    }
    safeSet(SQUARE_KEY, sq);
    hooks.toast('点赞成功 ❤', 'success');
    return true;
  }

  /**
   * 收藏剧本
   * @param {String} id 剧本 id
   * @returns {Boolean}
   */
  function collect(id) {
    var coll = safeGet(COLLECTS_KEY, []);
    var already = false;
    for (var i = 0; i < coll.length; i++) {
      if (coll[i] === id) { already = true; break; }
    }
    if (already) {
      hooks.toast('已经收藏过了', 'info');
      return false;
    }
    coll.push(id);
    safeSet(COLLECTS_KEY, coll);
    var sq = safeGet(SQUARE_KEY, []);
    for (var j = 0; j < sq.length; j++) {
      if (sq[j].id === id) { sq[j].collects = (sq[j].collects || 0) + 1; break; }
    }
    safeSet(SQUARE_KEY, sq);
    hooks.toast('已收藏到我的书架', 'success');
    return true;
  }

  /**
   * 投喂作者（消耗叮咚币）
   * @param {String} id     剧本 id
   * @param {Number} amount 投喂金额
   * @returns {Boolean}
   */
  function tip(id, amount) {
    if (!isNum(amount) || amount <= 0) {
      hooks.toast('投喂金额必须大于 0', 'warn');
      return false;
    }
    if (hooks.getCoin() < amount) {
      hooks.toast('叮咚币不足', 'warn');
      return false;
    }
    hooks.addCoin(-amount);
    var sq = safeGet(SQUARE_KEY, []);
    for (var i = 0; i < sq.length; i++) {
      if (sq[i].id === id) { sq[i].tips = (sq[i].tips || 0) + amount; break; }
    }
    safeSet(SQUARE_KEY, sq);
    hooks.toast('投喂成功！作者收到 ' + amount + ' 叮咚币', 'success');
    return true;
  }

  /**
   * 剧本排行榜
   * @param {String} sortBy 'plays'（体验次数，默认）或 'likes'（点赞数）
   * @returns {Array} 排序后的剧本列表（不含 scenes 等大字段，便于渲染）
   */
  function getRanking(sortBy) {
    sortBy = sortBy || 'plays';
    var sq = getSquare();
    var arr = [];
    for (var i = 0; i < sq.length; i++) {
      var s = sq[i];
      arr.push({
        id: s.id,
        title: s.title,
        author: s.author,
        emoji: s.emoji,
        desc: s.desc,
        reward: s.reward,
        plays: s.plays || 0,
        likes: s.likes || 0,
        collects: s.collects || 0,
        tips: s.tips || 0,
        isSample: s.isSample
      });
    }
    arr.sort(function (a, b) {
      if (sortBy === 'likes')    return b.likes - a.likes;
      if (sortBy === 'collects') return b.collects - a.collects;
      if (sortBy === 'tips')     return b.tips - a.tips;
      return b.plays - a.plays;
    });
    return arr;
  }

  /**
   * 我点赞过的剧本 id 列表
   */
  function getMyLikes() { return safeGet(LIKES_KEY, []); }

  /**
   * 我收藏的剧本列表（返回完整剧本对象）
   */
  function getMyCollects() {
    var ids = safeGet(COLLECTS_KEY, []);
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      var s = getScript(ids[i]);
      if (s) out.push(s);
    }
    return out;
  }

  // ===================================================
  // 7. 序列化 / 反序列化
  // ===================================================

  /**
   * 序列化剧本为字符串（JSON）
   * @param {Object} script
   * @returns {String}
   */
  function serialize(script) {
    try { return JSON.stringify(script); }
    catch (e) { return ''; }
  }

  /**
   * 反序列化字符串为剧本对象
   * @param {String} str
   * @returns {Object|null}
   */
  function deserialize(str) {
    if (!str) return null;
    try { return JSON.parse(str); }
    catch (e) { return null; }
  }

  /**
   * 校验剧本完整性
   * @param {Object} script
   * @returns {Object} { ok: Boolean, msg: String }
   */
  function validate(script) {
    if (!script)                         return { ok: false, msg: '剧本为空' };
    if (!script.title || !script.title.trim())
                                          return { ok: false, msg: '标题不能为空' };
    if (!script.desc || !script.desc.trim())
                                          return { ok: false, msg: '描述不能为空' };
    if (!script.ending || !script.ending.trim())
                                          return { ok: false, msg: '结局文字不能为空' };
    if (!script.scenes || script.scenes.length === 0)
                                          return { ok: false, msg: '至少需要 1 个场景' };
    // 校验每个场景
    for (var i = 0; i < script.scenes.length; i++) {
      var sc = script.scenes[i];
      if (!sc.text || !sc.text.trim()) {
        return { ok: false, msg: '场景 ' + sc.id + ' 的文字不能为空' };
      }
      if (!sc.choices || sc.choices.length < MIN_CHOICES) {
        return { ok: false, msg: '场景 ' + sc.id + ' 至少需要 ' + MIN_CHOICES + ' 个选项' };
      }
      // 校验选项的 next 指向
      for (var j = 0; j < sc.choices.length; j++) {
        var ch = sc.choices[j];
        if (!ch.text || !ch.text.trim()) {
          return { ok: false, msg: '场景 ' + sc.id + ' 的选项 ' + (j+1) + ' 文字不能为空' };
        }
        if (!isNum(ch.next)) {
          return { ok: false, msg: '场景 ' + sc.id + ' 的选项 ' + (j+1) + ' 跳转目标无效' };
        }
        // next=-1 表示结局；否则必须指向存在的场景
        if (ch.next !== -1 && !getScene(script, ch.next)) {
          return { ok: false, msg: '场景 ' + sc.id + ' 的选项 ' + (j+1) + ' 指向了不存在的场景' };
        }
      }
    }
    return { ok: true, msg: '剧本校验通过' };
  }

  // ===================================================
  // 8. 暴露接口
  // ===================================================

  window.Script = {
    // —— 配置 ——
    config: config,

    // —— 编辑器 ——
    createNew: createNew,
    addScene: addScene,
    updateScene: updateScene,
    removeScene: removeScene,
    addChoice: addChoice,
    removeChoice: removeChoice,
    setEnding: setEnding,
    setInfo: setInfo,
    saveScript: saveScript,
    loadScripts: loadScripts,
    getScript: getScript,
    deleteScript: deleteScript,

    // —— 体验 ——
    play: play,
    nextScene: nextScene,
    back: back,
    restart: restart,
    getScene: getScene,

    // —— 社交 ——
    publishToSquare: publishToSquare,
    getSquare: getSquare,
    like: like,
    collect: collect,
    tip: tip,
    getRanking: getRanking,
    getMyLikes: getMyLikes,
    getMyCollects: getMyCollects,

    // —— 工具 ——
    serialize: serialize,
    deserialize: deserialize,
    validate: validate,

    // —— 常量 ——
    CREATE_COST: CREATE_COST,
    MAX_CHOICES: MAX_CHOICES,
    MIN_CHOICES: MIN_CHOICES
  };

})(window);
