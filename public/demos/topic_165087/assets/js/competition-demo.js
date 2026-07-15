/* ============================================================
   Drop Snacks · V6E-A Competition Demo Harness
   ------------------------------------------------------------
   非生产、Operator-only：
   - 唯一入口 ?competition=1
   - 只使用 sessionStorage（SESSION_KEY: dropSnacks_v6_competition_demo）
   - 不读取或写入真实 localStorage（dropSnacks_v4）
   - 不调用 DropSnacksStore.load / DropSnacksStore.save
   - 不使用 Math.random；不使用 fetch / WebSocket / Notification
   - 初始数据为确定性演示 state（Schema 1）
   ------------------------------------------------------------
   适配合同：getAdapter() 返回 { key, load, save }
   与 app.js 现有 Store adapter 字段一致，仅替换数据源。
   ============================================================ */
(function(){
  "use strict";

  var VERSION = "6E-A.1";
  var QUERY_PARAM = "competition";
  var SESSION_KEY = "dropSnacks_v6_competition_demo";
  var SCHEMA_VERSION = 1;
  var DELAY_MS = 60 * 60 * 1000; /* 与 afterglow-engine.DELAY_MS 对齐 */
  var DAY_MS = 24 * 60 * 60 * 1000;

  /* ---------- URL 激活检测 ----------
     只有 ?competition=1 存在时才返回 true。
     正常模式不读取 sessionStorage、不创建 SESSION_KEY。 */
  function isActive(){
    try{
      var params = new URLSearchParams(window.location.search);
      return params.get(QUERY_PARAM) === "1";
    }catch(e){
      return false;
    }
  }

  /* ---------- 构造确定性初始演示 state ----------
     时间线（以 reset 时的 now 为基准）：
     - 历史 answered 最早（now - 3 天）
     - available 记录较新（now - 2 天，availableAt < now）
     - 当前未处理食品最新（now - 1 天）
     不使用 Math.random；不依赖固定过期日期。 */
  function createInitialState(now){
    if(!now) now = Date.now();

    /* 历史 answered 时间线 */
    var t_answered_food       = now - 3 * DAY_MS;
    var t_answered_choice     = t_answered_food + 60 * 1000;
    var t_answered_ag_create  = t_answered_choice;
    var t_answered_ag_avail   = t_answered_ag_create + DELAY_MS;
    var t_answered_ag_answer  = t_answered_ag_avail + 30 * 60 * 1000;

    /* available 时间线 */
    var t_avail_food          = now - 2 * DAY_MS;
    var t_avail_choice        = t_avail_food + 60 * 1000;
    var t_avail_ag_create     = t_avail_choice;
    var t_avail_ag_avail      = t_avail_ag_create + DELAY_MS; /* < now，effective available */

    /* 当前未处理食品最新 */
    var t_current_food        = now - 1 * DAY_MS;

    /* K-A. 历史 answered：海盐薯片（drop） */
    var foodAnswered = {
      id: "demo-food-answered",
      name: "海盐薯片",
      category: "薯片",
      openedState: "已开封",
      location: "桌上",
      purchaseReason: "情绪奖励",
      energyBand: "开封后口感会变化",
      createdAt: t_answered_food,
      handled: true,
      contextTags: [],
      deleted: false,
      isDemoSeed: true
    };

    /* K-B. 当前可回答余波：草莓奶油蛋糕（save） */
    var foodAvailable = {
      id: "demo-food-available",
      name: "草莓奶油蛋糕",
      category: "甜品",
      openedState: "未开封",
      location: "冰箱",
      purchaseReason: "顺手买",
      energyBand: "新鲜感可能变化",
      createdAt: t_avail_food,
      handled: true,
      contextTags: [],
      deleted: false,
      isDemoSeed: true
    };

    /* K-C. 当前待处理食品：焦糖爆米花 */
    var foodCurrent = {
      id: "demo-food-current",
      name: "焦糖爆米花",
      category: "薯片",
      openedState: "未开封",
      location: "桌上",
      purchaseReason: "顺手买",
      energyBand: "开封后口感会变化",
      createdAt: t_current_food,
      handled: false,
      contextTags: [],
      deleted: false,
      isDemoSeed: true
    };

    /* 已回答 Choice：drop + waste（关联海盐薯片） */
    var choiceAnswered = {
      id: "demo-choice-answered",
      foodId: "demo-food-answered",
      choiceType: "drop",
      feeling: "waste",
      createdAt: t_answered_choice,
      pack: "signature",
      copyResponse: null,
      contextSnapshot: {
        choiceType: "drop",
        feeling: "waste",
        foodCategory: "薯片",
        openedState: "已开封",
        purchaseReason: "情绪奖励",
        timeContext: "evening",
        currentPack: "signature",
        contextTags: [],
        recentCopyIds: [],
        recentChoicesCopyIds: [],
        confidence: "unknown",
        needState: "unknown",
        tone: "warm"
      },
      afterglowId: "demo-afterglow-answered"
    };

    /* 可回答 Choice：save + hesitate（关联草莓奶油蛋糕） */
    var choiceAvailable = {
      id: "demo-choice-available",
      foodId: "demo-food-available",
      choiceType: "save",
      feeling: "hesitate",
      createdAt: t_avail_choice,
      pack: "signature",
      copyResponse: null,
      contextSnapshot: {
        choiceType: "save",
        feeling: "hesitate",
        foodCategory: "甜品",
        openedState: "未开封",
        purchaseReason: "顺手买",
        timeContext: "daytime",
        currentPack: "signature",
        contextTags: [],
        recentCopyIds: [],
        recentChoicesCopyIds: [],
        confidence: "unknown",
        needState: "unknown",
        tone: "warm"
      },
      afterglowId: "demo-afterglow-available"
    };

    /* 已回答 Afterglow：AFTER-002（drop / 处理之后，今晚有没有轻一点？） */
    var agAnswered = {
      id: "demo-afterglow-answered",
      choiceId: "demo-choice-answered",
      foodId: "demo-food-answered",
      promptId: "AFTER-002",
      status: "answered",
      createdAt: t_answered_ag_create,
      availableAt: t_answered_ag_avail,
      answeredAt: t_answered_ag_answer,
      dismissedAt: null,
      deferredAt: null,
      deferCount: 0,
      responseText: "第二天再看时，我发现自己真正想要的只是停一下，而不是立刻吃完。",
      foodSnapshot: { name: "海盐薯片", category: "薯片" },
      contextSnapshot: choiceAnswered.contextSnapshot
    };

    /* 可回答 Afterglow：AFTER-006（save / 保存以后，你后来还想要它吗？）
       availableAt 早于 now，effective status = available，responseText 为空。 */
    var agAvailable = {
      id: "demo-afterglow-available",
      choiceId: "demo-choice-available",
      foodId: "demo-food-available",
      promptId: "AFTER-006",
      status: "pending",
      createdAt: t_avail_ag_create,
      availableAt: t_avail_ag_avail,
      answeredAt: null,
      dismissedAt: null,
      deferredAt: null,
      deferCount: 0,
      responseText: null,
      foodSnapshot: { name: "草莓奶油蛋糕", category: "甜品" },
      contextSnapshot: choiceAvailable.contextSnapshot
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      foods: [foodAnswered, foodAvailable, foodCurrent],
      choices: [choiceAnswered, choiceAvailable],
      afterglows: [agAnswered, agAvailable],
      userPreferences: {
        tone: "warm",
        language: "zh-CN",
        recentCopyIds: [],
        afterglowEnabled: true
      },
      currentPack: "signature"
    };
  }

  /* ---------- 读取 ----------
     - SESSION_KEY 不存在 → 创建初始演示 state 并写入
     - JSON 损坏 → 重置为初始 state
     - 返回新对象（深拷贝）
     - 保留 Schema 1
     - 不调用真实 Store */
  function load(){
    if(!isActive()) return null;
    var raw = null;
    try{
      raw = sessionStorage.getItem(SESSION_KEY);
    }catch(e){
      /* sessionStorage 不可用：返回初始 state，不写入 */
      return createInitialState(Date.now());
    }
    if(raw === null){
      var fresh = createInitialState(Date.now());
      try{
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
      }catch(e){
        /* 写入失败：仍返回 state（只读退化） */
      }
      return JSON.parse(JSON.stringify(fresh));
    }
    try{
      var parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== SCHEMA_VERSION){
        return reset();
      }
      /* 返回新对象（深拷贝，不返回引用） */
      return JSON.parse(JSON.stringify(parsed));
    }catch(e){
      /* JSON 损坏：重置为初始 state */
      return reset();
    }
  }

  /* ---------- 保存 ----------
     - 只写 sessionStorage
     - JSON.stringify 完整 Schema 1 state
     - 成功返回 true，失败返回 false
     - 不修改传入 state
     - 不吞掉异常（console 输出克制且明确） */
  function save(state){
    if(!isActive()) return false;
    try{
      var json = JSON.stringify(state);
      sessionStorage.setItem(SESSION_KEY, json);
      return true;
    }catch(e){
      console.error("[CompetitionDemo] save 失败:", e);
      return false;
    }
  }

  /* ---------- 重置 ----------
     - 创建完全一致的确定性初始演示 state
     - 写入 SESSION_KEY
     - 返回新 state（深拷贝） */
  function reset(){
    var fresh = createInitialState(Date.now());
    try{
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
    }catch(e){
      console.error("[CompetitionDemo] reset 写入失败:", e);
    }
    return JSON.parse(JSON.stringify(fresh));
  }

  /* ---------- 清除 ----------
     - 只删除 SESSION_KEY
     - 不删除任何 localStorage
     - 不删除 dropSnacks_v4 */
  function clear(){
    try{
      sessionStorage.removeItem(SESSION_KEY);
    }catch(e){
      /* ignore */
    }
  }

  /* ---------- 状态信息 ---------- */
  function getStatus(){
    var exists = false;
    var bytes = 0;
    try{
      var raw = sessionStorage.getItem(SESSION_KEY);
      if(raw !== null){
        exists = true;
        bytes = raw.length;
      }
    }catch(e){
      /* ignore */
    }
    return {
      active: isActive(),
      sessionKeyExists: exists,
      sessionKeyBytes: bytes,
      sessionKey: SESSION_KEY,
      schemaVersion: SCHEMA_VERSION,
      version: VERSION
    };
  }

  /* ---------- Adapter ----------
     返回合同必须与 app.js 当前 DB adapter 一致：
       { key, load, save }
     app.js 的 DB:
       key: Store.STORAGE_KEY
       load: function(){ return Store.load(); }
       save: function(data){ return Store.save(data); }
     竞赛模式只是替换数据源，不重写业务逻辑。 */
  function getAdapter(){
    return {
      key: SESSION_KEY,
      load: function(){ return load(); },
      save: function(data){ return save(data); }
    };
  }

  /* ---------- 导出元信息 ----------
     竞赛模式导出必须明确 demoMode=true。
     普通模式导出格式由 private-space.js 维持不变。 */
  function getExportMeta(state){
    return {
      demoMode: true,
      storageKey: "sessionStorage:" + SESSION_KEY,
      schemaVersion: SCHEMA_VERSION,
      data: state
    };
  }

  window.DropSnacksCompetitionDemo = {
    VERSION: VERSION,
    QUERY_PARAM: QUERY_PARAM,
    SESSION_KEY: SESSION_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    isActive: isActive,
    createInitialState: createInitialState,
    load: load,
    save: save,
    reset: reset,
    clear: clear,
    getStatus: getStatus,
    getAdapter: getAdapter,
    getExportMeta: getExportMeta
  };
})();
