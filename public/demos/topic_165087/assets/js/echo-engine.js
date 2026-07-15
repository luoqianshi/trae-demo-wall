/* ============================================================
   Drop Snacks · V6D-C Echo Engine
   纯逻辑模块：从 answered Afterglow 确定性选择 3 条 reviewed example
   ------------------------------------------------------------
   不读写 localStorage；不操作 DOM；不使用 fetch；
   不使用 Math.random；不修改 Store；不修改 Afterglow；
   不分析 responseText 自然语言；不从食品名称推断属性
   ============================================================ */
(function(){
  "use strict";

  var VERSION = "6D-C1.1";

  /* ---------- Intro 安全 allowlist ----------
     V6D-C1: 只允许不虚构"同一件食品"/"同一心理原因"、
     不邀请未实现贡献功能的 Intro。
     排除: ECHO-002(同一件食品) / ECHO-006(同一心理原因) /
           ECHO-009(邀请匿名留下) / ECHO-001/004/010(不在安全池)
  */
  var SAFE_INTRO_IDS = ["ECHO-003", "ECHO-005", "ECHO-007", "ECHO-008"];

  /* FNV-1a 32-bit 稳定哈希（确定性，禁止 Math.random） */
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

  /* 有效值集合 — "unknown" / null / "—" / "" 不作为精确匹配 */
  var VALID_CHOICES = ["eat","drop","save","share"];
  var VALID_TIMES = ["morning","daytime","evening","late_night"];

  function isValidChoice(v){ return VALID_CHOICES.indexOf(v) >= 0; }
  function isValidTime(v){ return VALID_TIMES.indexOf(v) >= 0; }
  function isValidCategory(v){
    return typeof v === "string" && v.length > 0 && v !== "—" && v !== "unknown";
  }
  function isValidReason(v){
    return typeof v === "string" && v.length > 0 && v !== "unknown";
  }
  function isValidFeeling(v){
    if(!v || v === "unknown") return false;
    /* 接受规范与未规范形式 */
    return ["want","hesitate","dont_want","dont-want","dontwant","waste","tired","reward"].indexOf(v) >= 0;
  }

  /* feeling 规范化 */
  function normalizeFeeling(f){
    if(f === "dont-want" || f === "dontwant") return "dont_want";
    return f;
  }

  /* ---------- 显示资格 ----------
     只有满足以下全部条件才允许返回 Echoes：
     1. Afterglow status === "answered"
     2. responseText 去除空格后非空
     3. answeredAt 为有效时间
     4. Echo Bank 可用
     5. 至少存在一条 reviewed zh-CN 条目
  */
  function isEligible(afterglow, bank){
    if(!afterglow) return false;
    if(afterglow.status !== "answered") return false;
    var text = String(afterglow.responseText == null ? "" : afterglow.responseText).replace(/\s/g, "");
    if(text.length === 0) return false;
    if(!afterglow.answeredAt || typeof afterglow.answeredAt !== "number") return false;
    if(!bank || !Array.isArray(bank.entries)) return false;
    return getReviewedPool(bank).length > 0;
  }

  /* ---------- Reviewed Pool ----------
     V6D-C1: 资格检查与实际选择使用同一 reviewed pool。
     只选择 locale=zh-CN && status=reviewed && sourceType=reviewed_example
  */
  function getReviewedPool(bank){
    if(!bank || !Array.isArray(bank.entries)) return [];
    var pool = [];
    for(var i = 0; i < bank.entries.length; i++){
      var en = bank.entries[i];
      if(en && en.locale === "zh-CN" && en.status === "reviewed" && en.sourceType === "reviewed_example"){
        pool.push(en);
      }
    }
    return pool;
  }

  /* ---------- 取最新 answered Afterglow ---------- */
  function getLatestAnsweredAfterglow(state){
    if(!state || !Array.isArray(state.afterglows)) return null;
    var answered = [];
    for(var i = 0; i < state.afterglows.length; i++){
      var ag = state.afterglows[i];
      if(!ag || ag.status !== "answered") continue;
      var text = String(ag.responseText == null ? "" : ag.responseText).replace(/\s/g, "");
      if(text.length === 0) continue;
      if(!ag.answeredAt || typeof ag.answeredAt !== "number") continue;
      answered.push(ag);
    }
    if(answered.length === 0) return null;
    answered.sort(function(a, b){ return b.answeredAt - a.answeredAt; });
    return answered[0];
  }

  /* ---------- 上下文来源 ----------
     只使用明确已有字段，不分析 responseText，不从食品名称推断类别
  */
  function buildContext(afterglow, state){
    if(!afterglow) return null;
    var ctx = {
      choiceType: "unknown",
      foodCategory: "unknown",
      feeling: "unknown",
      purchaseReason: "unknown",
      timeContext: "unknown",
      afterglowId: afterglow.id || null
    };

    /* foodCategory 仅来自 foodSnapshot.category */
    if(afterglow.foodSnapshot && isValidCategory(afterglow.foodSnapshot.category)){
      ctx.foodCategory = afterglow.foodSnapshot.category;
    }

    /* contextSnapshot 字段 */
    var snap = afterglow.contextSnapshot;
    if(snap && typeof snap === "object"){
      if(isValidChoice(snap.choiceType)) ctx.choiceType = snap.choiceType;
      if(isValidFeeling(snap.feeling)) ctx.feeling = normalizeFeeling(snap.feeling);
      if(isValidReason(snap.purchaseReason)) ctx.purchaseReason = snap.purchaseReason;
      if(isValidTime(snap.timeContext)) ctx.timeContext = snap.timeContext;
    }

    /* 若 contextSnapshot 缺少 choiceType，可通过 choiceId 查找现有 Choice */
    if(ctx.choiceType === "unknown" && afterglow.choiceId && state && Array.isArray(state.choices)){
      for(var i = 0; i < state.choices.length; i++){
        var c = state.choices[i];
        if(c && c.id === afterglow.choiceId && isValidChoice(c.choiceType)){
          ctx.choiceType = c.choiceType;
          break;
        }
      }
    }

    return ctx;
  }

  /* ---------- 匹配层级评分 ----------
     第一层：choiceType + foodCategory 明确匹配
     第二层：choiceType + feeling / purchaseReason / timeContext 明确匹配
     第三层：choiceType 匹配
     第四层：通用 reviewed example
  */
  function scoreEntry(entry, ctx){
    var hasChoice = entry.choiceTypes && entry.choiceTypes.length > 0;
    var choiceMatch = hasChoice
      && ctx.choiceType !== "unknown"
      && entry.choiceTypes.indexOf(ctx.choiceType) >= 0;

    if(!choiceMatch){
      return { score: 0, tier: 4 };
    }

    var foodCatMatch = entry.foodCategories && entry.foodCategories.length > 0
      && isValidCategory(ctx.foodCategory)
      && entry.foodCategories.indexOf(ctx.foodCategory) >= 0;

    if(foodCatMatch){
      return { score: 100, tier: 1 };
    }

    var feelingMatch = entry.feelings && entry.feelings.length > 0
      && ctx.feeling !== "unknown"
      && entry.feelings.indexOf(ctx.feeling) >= 0;
    var reasonMatch = entry.purchaseReasons && entry.purchaseReasons.length > 0
      && ctx.purchaseReason !== "unknown"
      && entry.purchaseReasons.indexOf(ctx.purchaseReason) >= 0;
    var timeMatch = entry.timeContexts && entry.timeContexts.length > 0
      && ctx.timeContext !== "unknown"
      && entry.timeContexts.indexOf(ctx.timeContext) >= 0;

    if(feelingMatch || reasonMatch || timeMatch){
      return { score: 60, tier: 2 };
    }

    return { score: 30, tier: 3 };
  }

  /* ---------- 匹配标签 ----------
     允许的匹配标签：
     相似食品类别 / 相似选择方向 / 相似感受 / 相似场景 / 通用回声
  */
  function getMatchLabel(entry, context){
    var ctx = context || {};
    var hasChoice = entry.choiceTypes && entry.choiceTypes.length > 0;
    var choiceMatch = hasChoice
      && ctx.choiceType !== "unknown"
      && entry.choiceTypes.indexOf(ctx.choiceType) >= 0;

    if(!choiceMatch){
      return "通用回声";
    }

    var foodCatMatch = entry.foodCategories && entry.foodCategories.length > 0
      && isValidCategory(ctx.foodCategory)
      && entry.foodCategories.indexOf(ctx.foodCategory) >= 0;
    if(foodCatMatch) return "相似食品类别";

    var feelingMatch = entry.feelings && entry.feelings.length > 0
      && ctx.feeling !== "unknown"
      && entry.feelings.indexOf(ctx.feeling) >= 0;
    if(feelingMatch) return "相似感受";

    var reasonMatch = entry.purchaseReasons && entry.purchaseReasons.length > 0
      && ctx.purchaseReason !== "unknown"
      && entry.purchaseReasons.indexOf(ctx.purchaseReason) >= 0;
    var timeMatch = entry.timeContexts && entry.timeContexts.length > 0
      && ctx.timeContext !== "unknown"
      && entry.timeContexts.indexOf(ctx.timeContext) >= 0;
    if(reasonMatch || timeMatch) return "相似场景";

    return "相似选择方向";
  }

  /* ---------- Intro ----------
     V6D-C1: 从 copy-bank.js 筛选 role=echo_intro && status=production && locale=zh-CN
     且 id 位于 SAFE_INTRO_IDS allowlist。
     不返回 ECHO-001/002/004/006/009/010。
     根据 Afterglow ID 确定性选择一条，不根据 responseText 选择。
  */
  function selectIntro(afterglow){
    var bank = window.DropSnacksCopyBank;
    if(!bank || !bank.entries) return null;
    var pool = [];
    for(var i = 0; i < bank.entries.length; i++){
      var en = bank.entries[i];
      if(en.role === "echo_intro" && en.status === "production" && en.locale === "zh-CN"
         && SAFE_INTRO_IDS.indexOf(en.id) >= 0){
        pool.push(en);
      }
    }
    if(pool.length === 0) return null;
    var seed = stableHash(afterglow && afterglow.id ? afterglow.id : "");
    return pool[seed % pool.length];
  }

  /* ---------- 主入口：选择 3 条不同 Echo ----------
     确定性：相同 Afterglow + 相同 Echo Bank = 相同结果和顺序
     不使用 Math.random；不写入 recentEchoIds；不写入 Store
  */
  function selectEchoes(afterglow, state, limit){
    if(!limit) limit = 3;
    var bank = window.DropSnacksEchoBank;
    if(!isEligible(afterglow, bank)) return [];

    var ctx = buildContext(afterglow, state);
    if(!ctx) return [];

    /* V6D-C1: 只从 reviewed pool 评分和选择 */
    var pool = getReviewedPool(bank);

    /* 评分全部条目 */
    var scored = [];
    for(var i = 0; i < pool.length; i++){
      var entry = pool[i];
      var r = scoreEntry(entry, ctx);
      scored.push({
        entry: entry,
        score: r.score,
        tier: r.tier,
        tiebreak: stableHash((afterglow.id || "") + ":" + entry.id)
      });
    }

    /* 排序：score 降序，tiebreak 升序（确定性） */
    scored.sort(function(a, b){
      if(b.score !== a.score) return b.score - a.score;
      return a.tiebreak - b.tiebreak;
    });

    /* 选取前 limit 条，结果不得重复 */
    var result = [];
    var seen = {};
    for(var j = 0; j < scored.length && result.length < limit; j++){
      var id = scored[j].entry.id;
      if(seen[id]) continue;
      seen[id] = true;
      result.push({
        entry: scored[j].entry,
        matchLabel: getMatchLabel(scored[j].entry, ctx),
        tier: scored[j].tier
      });
    }

    /* 若 Bank 有至少 3 条可用内容，则不得返回不足 3 条 */
    /* 24 条 Bank 总能满足，此处为安全声明 */
    return result;
  }

  window.DropSnacksEchoEngine = {
    VERSION: VERSION,
    SAFE_INTRO_IDS: SAFE_INTRO_IDS,
    getLatestAnsweredAfterglow: getLatestAnsweredAfterglow,
    buildContext: buildContext,
    selectIntro: selectIntro,
    selectEchoes: selectEchoes,
    getMatchLabel: getMatchLabel,
    isEligible: isEligible,
    getReviewedPool: getReviewedPool,
    stableHash: stableHash
  };
})();
