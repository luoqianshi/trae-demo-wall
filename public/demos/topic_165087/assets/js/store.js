/* ============================================================
   Drop Snacks · V6 Store
   Schema 迁移与安全存储
   key: dropSnacks_v4 (不变)
   schemaVersion: 1
   ============================================================ */
(function(){
  "use strict";

  var STORAGE_KEY = "dropSnacks_v4";
  var SCHEMA_VERSION = 1;
  var BACKUP_PREFIX = "dropSnacks_v4_backup_";

  /* 模块级存储状态 */
  var storeStatus = {
    readable: true,
    writable: true,
    reason: null
  };

  /* 创建默认 state */
  function createDefaultState(){
    return {
      schemaVersion: SCHEMA_VERSION,
      foods: [],
      choices: [],
      afterglows: [],
      userPreferences: {
        tone: "calm",
        language: "zh-CN",
        recentCopyIds: [],
        afterglowEnabled: true
      },
      currentPack: "signature"
    };
  }

  /* 补齐 Food 默认字段（不覆盖已有值） */
  function ensureFoodDefaults(food){
    if(!food) return food;
    if(food.contextTags === undefined) food.contextTags = [];
    if(food.deleted === undefined) food.deleted = false;
    return food;
  }

  /* 补齐 Choice 默认字段（不覆盖已有值） */
  function ensureChoiceDefaults(choice){
    if(!choice) return choice;
    if(choice.copyResponse === undefined) choice.copyResponse = null;
    if(choice.contextSnapshot === undefined) choice.contextSnapshot = null;
    if(choice.afterglowId === undefined) choice.afterglowId = null;
    return choice;
  }

  /* 补齐 Afterglow 默认字段（不覆盖已有值，保留未知字段） */
  function ensureAfterglowDefaults(ag){
    if(!ag) return ag;
    if(ag.status === undefined) ag.status = "pending";
    if(ag.promptId === undefined) ag.promptId = null;
    if(ag.createdAt === undefined) ag.createdAt = null;
    if(ag.availableAt === undefined) ag.availableAt = null;
    if(ag.answeredAt === undefined) ag.answeredAt = null;
    if(ag.dismissedAt === undefined) ag.dismissedAt = null;
    if(ag.deferredAt === undefined) ag.deferredAt = null;
    if(ag.deferCount === undefined) ag.deferCount = 0;
    if(ag.responseText === undefined) ag.responseText = null;
    if(ag.foodSnapshot === undefined) ag.foodSnapshot = { name: "—", category: "—" };
    if(ag.contextSnapshot === undefined) ag.contextSnapshot = null;
    /* id/choiceId/foodId 不强制补齐（保留原值，包括 null） */
    return ag;
  }

  /* 扫描已有 backup key，检查是否已有相同内容的备份 */
  function findExistingBackup(rawJson){
    try{
      for(var i = localStorage.length - 1; i >= 0; i--){
        var key = localStorage.key(i);
        if(key && key.indexOf(BACKUP_PREFIX) === 0){
          var existing = localStorage.getItem(key);
          if(existing === rawJson){
            return key;
          }
        }
      }
    }catch(e){ /* ignore */ }
    return null;
  }

  /* 非破坏性规范化：从原始 state 浅拷贝开始，只补缺失字段 */
  function normalizeState(rawState){
    if(rawState === null || rawState === undefined){
      return createDefaultState();
    }

    /* 从浅拷贝开始，保留所有顶层字段（含未知字段） */
    var normalized = {};
    Object.keys(rawState).forEach(function(key){
      normalized[key] = rawState[key];
    });

    /* 强制 schemaVersion */
    normalized.schemaVersion = SCHEMA_VERSION;

    /* foods: 完整保留数组，只补缺失字段 */
    if(!Array.isArray(normalized.foods)){
      normalized.foods = [];
    } else {
      normalized.foods = normalized.foods.map(function(f){
        var food = Object.assign({}, f);
        ensureFoodDefaults(food);
        return food;
      });
    }

    /* choices: 完整保留数组，只补缺失字段 */
    if(!Array.isArray(normalized.choices)){
      normalized.choices = [];
    } else {
      normalized.choices = normalized.choices.map(function(c){
        var choice = Object.assign({}, c);
        ensureChoiceDefaults(choice);
        return choice;
      });
    }

    /* afterglows: 完整保留数组，禁止清空，只补缺失字段 */
    if(!Array.isArray(normalized.afterglows)){
      normalized.afterglows = [];
    } else {
      normalized.afterglows = normalized.afterglows.map(function(ag){
        var afterglow = Object.assign({}, ag);
        if(afterglow.foodSnapshot && typeof afterglow.foodSnapshot === 'object'){
          afterglow.foodSnapshot = Object.assign({}, afterglow.foodSnapshot);
        }
        if(afterglow.contextSnapshot && typeof afterglow.contextSnapshot === 'object'){
          afterglow.contextSnapshot = Object.assign({}, afterglow.contextSnapshot);
        }
        ensureAfterglowDefaults(afterglow);
        return afterglow;
      });
    }

    /* userPreferences: 保留所有字段，只补缺失默认值 */
    if(!normalized.userPreferences || typeof normalized.userPreferences !== 'object'){
      normalized.userPreferences = {
        tone: "calm",
        language: "zh-CN",
        recentCopyIds: [],
        afterglowEnabled: true
      };
    } else {
      var up = normalized.userPreferences;
      if(up.tone === undefined) up.tone = "calm";
      if(up.language === undefined) up.language = "zh-CN";
      if(!Array.isArray(up.recentCopyIds)) up.recentCopyIds = [];
      if(up.afterglowEnabled === undefined) up.afterglowEnabled = true;
    }

    /* currentPack: 存在时保留 */
    if(normalized.currentPack === undefined){
      normalized.currentPack = "signature";
    }

    return normalized;
  }

  /* 核心迁移函数：使用 normalizeState */
  function migrate(rawState){
    if(rawState === null || rawState === undefined){
      return createDefaultState();
    }
    return normalizeState(rawState);
  }

  /* 安全加载：读取 + 迁移 + 写回 */
  function load(){
    var rawJson = null;
    try{
      rawJson = localStorage.getItem(STORAGE_KEY);
    }catch(e){
      storeStatus.readable = false;
      storeStatus.writable = false;
      storeStatus.reason = "storage_unavailable";
      return createDefaultState();
    }

    /* 新安装，无旧数据 — 明确重置状态 */
    if(rawJson === null){
      storeStatus.readable = true;
      storeStatus.writable = true;
      storeStatus.reason = null;
      return createDefaultState();
    }

    var rawState = null;
    try{
      rawState = JSON.parse(rawJson);
    }catch(e){
      /* 畸形 JSON — 进入写保护，返回默认但不写回 */
      storeStatus.readable = false;
      storeStatus.writable = false;
      storeStatus.reason = "malformed_json";
      console.error("[DropSnacksStore] 无法解析 localStorage 数据:", e);
      return createDefaultState();
    }

    /* 正常可读可写 */
    storeStatus.readable = true;
    storeStatus.writable = true;
    storeStatus.reason = null;

    /* schemaVersion:1 — normalize 但不备份不迁移 */
    if(rawState.schemaVersion === SCHEMA_VERSION){
      return normalizeState(rawState);
    }

    /* 旧数据 — 先备份再迁移 */
    var existingBackup = findExistingBackup(rawJson);
    if(!existingBackup){
      var timestamp = Date.now();
      var backupKey = BACKUP_PREFIX + timestamp;
      try{
        localStorage.setItem(backupKey, rawJson);
      }catch(e){
        /* 备份写入失败 — 进入写保护，返回可展示 state 但禁止后续覆盖 */
        console.error("[DropSnacksStore] 备份失败:", e);
        storeStatus.readable = true;
        storeStatus.writable = false;
        storeStatus.reason = "migration_backup_failed";
        return normalizeState(rawState);
      }
    }

    /* 执行迁移 */
    var migrated = normalizeState(rawState);

    /* 验证后写回 */
    if(migrated && migrated.schemaVersion === SCHEMA_VERSION){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }catch(e){
        /* 主 key 写回失败 — 进入写保护，保留已创建的 backup */
        console.error("[DropSnacksStore] 写回失败:", e);
        storeStatus.readable = true;
        storeStatus.writable = false;
        storeStatus.reason = "migration_write_failed";
        return migrated;
      }
    }

    return migrated;
  }

  /* 安全保存（写保护时拒绝） */
  function save(state){
    if(!storeStatus.writable){
      console.error("[DropSnacksStore] 存储已写保护，保存被拒绝:", storeStatus.reason);
      return false;
    }
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    }catch(e){
      console.error("[DropSnacksStore] 保存失败:", e);
      return false;
    }
  }

  /* 获取存储状态 */
  function getStatus(){
    return {
      readable: storeStatus.readable,
      writable: storeStatus.writable,
      reason: storeStatus.reason
    };
  }

  /* 获取当前时间上下文 */
  function getTimeContext(){
    var hour = new Date().getHours();
    if(hour >= 6 && hour < 11) return "morning";
    if(hour >= 11 && hour < 18) return "daytime";
    if(hour >= 18 && hour < 23) return "evening";
    return "late_night";
  }

  /* 更新 recentCopyIds */
  function pushRecentCopyId(state, copyId){
    if(!copyId) return;
    if(!state.userPreferences) state.userPreferences = {tone:"calm",language:"zh-CN",recentCopyIds:[]};
    if(!state.userPreferences.recentCopyIds) state.userPreferences.recentCopyIds = [];
    var arr = state.userPreferences.recentCopyIds;
    var idx = arr.indexOf(copyId);
    if(idx >= 0) arr.splice(idx, 1);
    arr.push(copyId);
    while(arr.length > 30) arr.shift();
  }

  /* 获取最近 30 天使用过的 copy ID（从 choices 中提取 Primary + Life Prompt） */
  function getRecentCopyIdsFromChoices(state){
    var now = Date.now();
    var thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    var ids = [];
    if(!state.choices) return ids;
    state.choices.forEach(function(c){
      if(c.createdAt && c.createdAt >= thirtyDaysAgo && c.copyResponse){
        if(c.copyResponse.primaryId){
          ids.push(c.copyResponse.primaryId);
        }
        if(c.copyResponse.lifePromptId){
          ids.push(c.copyResponse.lifePromptId);
        }
      }
    });
    return ids;
  }

  window.DropSnacksStore = {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    load: load,
    save: save,
    migrate: migrate,
    normalizeState: normalizeState,
    createDefaultState: createDefaultState,
    ensureFoodDefaults: ensureFoodDefaults,
    ensureChoiceDefaults: ensureChoiceDefaults,
    ensureAfterglowDefaults: ensureAfterglowDefaults,
    getTimeContext: getTimeContext,
    pushRecentCopyId: pushRecentCopyId,
    getRecentCopyIdsFromChoices: getRecentCopyIdsFromChoices,
    getStatus: getStatus
  };
})();
