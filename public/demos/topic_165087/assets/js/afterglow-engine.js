/* ============================================================
   Drop Snacks · V6D-B Afterglow Engine
   纯逻辑模块：创建、状态计算、问题选择、回答/延后/忽略
   不读取/写入 localStorage；不操作 DOM；不调用通知
   ============================================================ */
(function(){
  "use strict";

  var VERSION = "6D-B.1";
  var DELAY_MS = 60 * 60 * 1000; /* 统一 60 分钟 */

  /* Bank K 中与 choiceType 强相关的首选项（确定性映射） */
  var CHOICE_PROMPT_MAP = {
    eat:   "AFTER-007", /* 吃完以后，满足感和原本期待的一样吗？ */
    save:  "AFTER-006", /* 保存以后，你后来还想要它吗？ */
    share: "AFTER-008", /* 分享以后，这件食品还留在你的注意力里吗？ */
    drop:  "AFTER-002"  /* 处理之后，今晚有没有轻一点？ */
  };

  /* 安全降级用的通用 Bank K 条目（无具体 choiceType 证据） */
  var GENERIC_PROMPT_IDS = [
    "AFTER-001","AFTER-003","AFTER-004","AFTER-011",
    "AFTER-012","AFTER-013","AFTER-014","AFTER-018"
  ];

  /* 极小确定性字符串哈希（FNV-1a 32 位变体），返回正整数 */
  function stableHash(str){
    if(str === null || str === undefined) str = "";
    str = String(str);
    var hash = 0x811c9dc5;
    for(var i = 0; i < str.length; i++){
      hash ^= str.charCodeAt(i);
      hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
    }
    return hash >>> 0;
  }

  /* 从 Copy Bank 读取 Bank K 活跃 zh-CN 条目 */
  function getBankKEntries(){
    var bank = window.DropSnacksCopyBank;
    if(!bank || !bank.entries) return [];
    return bank.entries.filter(function(e){
      return e.role === "afterglow"
        && e.status === "production" /* copy-bank 中 "active" = production */
        && e.locale === "zh-CN";
    });
  }

  /* 确定性选择 promptId */
  function selectPromptId(choiceType, foodId, createdAt){
    /* 1. 优先 choiceType 证据条目 */
    if(choiceType && CHOICE_PROMPT_MAP[choiceType]){
      var specificId = CHOICE_PROMPT_MAP[choiceType];
      var entries = getBankKEntries();
      if(entries.some(function(e){ return e.id === specificId; })){
        return specificId;
      }
    }
    /* 2. 安全降级：在通用池中确定性选择 */
    var pool = GENERIC_PROMPT_IDS;
    var seed = stableHash((foodId || "") + ":" + (createdAt || 0));
    return pool[seed % pool.length];
  }

  /* 根据 promptId 解析问题文本 */
  function getPromptText(promptId){
    var bank = window.DropSnacksCopyBank;
    if(!bank || !bank.getById) return "";
    var entry = bank.getById(promptId);
    return entry ? entry.text : "";
  }

  /* 创建 Afterglow（不写入 Store，由调用者原子保存） */
  function createForChoice(choice, food, context){
    if(!choice) return null;
    var now = choice.createdAt || Date.now();
    var foodId = choice.foodId || null;
    var promptId = selectPromptId(choice.choiceType, foodId, now);
    return {
      id: "ag_" + now + "_" + stableHash(foodId + ":" + now).toString(36),
      choiceId: choice.id || null,
      foodId: foodId,
      promptId: promptId,
      status: "pending",
      createdAt: now,
      availableAt: now + DELAY_MS,
      answeredAt: null,
      dismissedAt: null,
      deferredAt: null,
      deferCount: 0,
      responseText: null,
      foodSnapshot: {
        name: food && food.name ? food.name : "—",
        category: food && food.category ? food.category : "—"
      },
      contextSnapshot: context || null
    };
  }

  /* 动态有效状态：available 不写入 Store */
  function getEffectiveStatus(afterglow, now){
    if(!afterglow) return null;
    if(!now) now = Date.now();
    if(afterglow.status === "answered") return "answered";
    if(afterglow.status === "dismissed") return "dismissed";
    if(afterglow.status === "pending"){
      return now >= afterglow.availableAt ? "available" : "pending";
    }
    return afterglow.status;
  }

  /* 取下一条需要展示的 Afterglow：
     - 优先 available（availableAt 最早）
     - 无 available 时返回 null（pending 由调用者单独提示） */
  function getNextAfterglow(state, now){
    if(!state || !Array.isArray(state.afterglows)) return null;
    if(!now) now = Date.now();
    var available = [];
    var pending = [];
    for(var i = 0; i < state.afterglows.length; i++){
      var ag = state.afterglows[i];
      var eff = getEffectiveStatus(ag, now);
      if(eff === "available") available.push(ag);
      else if(eff === "pending") pending.push(ag);
    }
    if(available.length > 0){
      available.sort(function(a, b){ return a.availableAt - b.availableAt; });
      return available[0];
    }
    /* 返回最早的 pending 供调用者决定是否提示 */
    if(pending.length > 0){
      pending.sort(function(a, b){ return a.availableAt - b.availableAt; });
      return { __pendingHint: true, afterglow: pending[0] };
    }
    return null;
  }

  /* 取最早的 pending（用于“一小时以后”提示） */
  function getEarliestPending(state, now){
    if(!state || !Array.isArray(state.afterglows)) return null;
    if(!now) now = Date.now();
    var pending = state.afterglows.filter(function(ag){
      return getEffectiveStatus(ag, now) === "pending";
    });
    if(pending.length === 0) return null;
    pending.sort(function(a, b){ return a.availableAt - b.availableAt; });
    return pending[0];
  }

  /* 回答：返回新对象，调用者负责保存 */
  function answer(afterglow, responseText, now){
    if(!afterglow) return null;
    if(!now) now = Date.now();
    var text = (responseText || "").trim();
    /* 长度校验 1–120 字 */
    if(text.length < 1 || text.length > 120) return null;
    var updated = {};
    Object.keys(afterglow).forEach(function(k){ updated[k] = afterglow[k]; });
    /* 浅拷贝 foodSnapshot/contextSnapshot 保持引用即可（不修改） */
    updated.status = "answered";
    updated.answeredAt = now;
    updated.responseText = text;
    return updated;
  }

  /* 延后：availableAt = now + 60 分钟，status 保持 pending */
  function defer(afterglow, now){
    if(!afterglow) return null;
    if(!now) now = Date.now();
    var updated = {};
    Object.keys(afterglow).forEach(function(k){ updated[k] = afterglow[k]; });
    updated.status = "pending";
    updated.availableAt = now + DELAY_MS;
    updated.deferredAt = now;
    updated.deferCount = (afterglow.deferCount || 0) + 1;
    return updated;
  }

  /* 忽略：终态 */
  function dismiss(afterglow, now){
    if(!afterglow) return null;
    if(!now) now = Date.now();
    var updated = {};
    Object.keys(afterglow).forEach(function(k){ updated[k] = afterglow[k]; });
    updated.status = "dismissed";
    updated.dismissedAt = now;
    return updated;
  }

  /* 校验回答文本 */
  function isValidResponse(text){
    var t = (text || "").trim();
    return t.length >= 1 && t.length <= 120;
  }

  /* 距离可回答的剩余毫秒（负值表示已可回答） */
  function msUntilAvailable(afterglow, now){
    if(!afterglow) return 0;
    if(!now) now = Date.now();
    return afterglow.availableAt - now;
  }

  window.DropSnacksAfterglowEngine = {
    VERSION: VERSION,
    DELAY_MS: DELAY_MS,
    createForChoice: createForChoice,
    getEffectiveStatus: getEffectiveStatus,
    getNextAfterglow: getNextAfterglow,
    getEarliestPending: getEarliestPending,
    getPromptText: getPromptText,
    selectPromptId: selectPromptId,
    answer: answer,
    defer: defer,
    dismiss: dismiss,
    isValidResponse: isValidResponse,
    msUntilAvailable: msUntilAvailable,
    stableHash: stableHash
  };
})();
