/* ============================================================
   Drop Snacks · V6 Copy Engine v1
   受约束的规则引擎：安全过滤 → 匹配 → 评分 → 轮换
   禁止使用 Math.random 从全部文案随机抽取
   ============================================================ */
(function(){
  "use strict";

  var ENGINE_VERSION = "1.1.0";

  /* feeling 映射到文案库的 feeling 标签值 */
  var FEELING_MAP = {
    "want": "want",
    "hesitate": "hesitate",
    "dont_want": "dont_want",
    "dont-want": "dont_want",
    "dontwant": "dont_want",
    "waste": "waste"
  };

  /* choice 映射到文案库的 choice 标签 */
  var CHOICE_MAP = {
    "eat": "choice:eat",
    "drop": "choice:drop",
    "save": "choice:save",
    "share": "choice:share",
    "substitute": "choice:substitute"
  };

  /* 稳定 hash 函数：用于确定性选择，不使用 Math.random */
  function stableHash(str){
    var hash = 0;
    if(str.length === 0) return hash;
    for(var i = 0; i < str.length; i++){
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /* 解析标签字符串数组为 key:value 对象 */
  function parseTags(tags){
    var obj = {};
    if(!tags || !Array.isArray(tags)) return obj;
    tags.forEach(function(tag){
      var parts = tag.split(":");
      if(parts.length >= 2){
        var key = parts[0].trim();
        var val = parts.slice(1).join(":").trim();
        if(!obj[key]) obj[key] = [];
        obj[key].push(val);
      }
    });
    return obj;
  }

  /* 检查标签数组中是否包含某值 — 精确 token 匹配，禁止 substring */
  function hasTagValue(tags, key, val){
    if(!tags[key]) return false;
    return tags[key].some(function(v){
      /* 按 "/" 拆分为多个 token，trim 后精确比较 */
      var tokens = v.split("/").map(function(t){ return t.trim(); });
      return tokens.indexOf(val) >= 0;
    });
  }

  /* 检查标签数组中是否包含 "*" 通配 */
  function hasTagWildcard(tags, key){
    if(!tags[key]) return false;
    return tags[key].some(function(v){
      return v.trim() === "*";
    });
  }

  /* Choice 候选资格：choice 专属 Bank 在 choice 不匹配时排除 */
  function choiceEligible(entry, ctx){
    var tags = parseTags(entry.tags);
    if(!tags.choice) return true;

    var hasChoiceAny = false;
    var hasChoiceSpecific = false;
    var matchedChoice = false;

    tags.choice.forEach(function(v){
      v = v.trim();
      if(v === "any"){
        hasChoiceAny = true;
      } else {
        hasChoiceSpecific = true;
        if(v === ctx.choiceType){
          matchedChoice = true;
        }
      }
    });

    /* choice:any 总是可进入 */
    if(hasChoiceAny && !hasChoiceSpecific) return true;

    /* 有 choice 专属标签且匹配 */
    if(matchedChoice) return true;

    /* 有 choice 专属标签但不匹配 — 排除 */
    if(hasChoiceSpecific && !matchedChoice) return false;

    return true;
  }

  /* 硬安全过滤：返回 false 排除候选 */
  function isSafe(entry, ctx){
    var tags = parseTags(entry.tags);

    /* needState === likely_needed 时硬排除丢弃导向文案 */
    if(ctx.needState === "likely_needed"){
      /* 排除 Bank C（完成处理/丢掉） */
      if(entry.bank === "C") return false;
      /* 排除任何带 choice:drop 标签的文案 */
      if(tags.choice && tags.choice.indexOf("drop") >= 0) return false;
      /* 排除 Bank D/E/F（保存/分享/替代）— likely_needed 下只允许安全池 */
      if(entry.bank === "D" || entry.bank === "E" || entry.bank === "F") return false;
      /* Bank B（吃掉）仅 choiceType === eat 时允许 */
      if(entry.bank === "B" && ctx.choiceType !== "eat") return false;
      /* Bank A 全部排除 — 不使用文本黑名单，最保守规则 */
      if(entry.bank === "A") return false;
    }

    return true;
  }

  /* Bank G 证据门槛：没有证据时排除候选 */
  function bankGEligible(entry, ctx){
    if(entry.bank !== "G") return true;

    var contextTags = ctx.contextTags || [];
    var hasCtxTag = function(t){
      return contextTags.indexOf(t) >= 0;
    };

    /* END-PROP-024: 不确定性 — confidence 为 low/unknown 时唯一默认允许 */
    if(entry.id === "END-PROP-024"){
      return ctx.confidence === "low" || ctx.confidence === "unknown";
    }

    /* END-PROP-001–004: 分量类 — 需要 portion 证据 */
    if(["END-PROP-001","END-PROP-002","END-PROP-003","END-PROP-004"].indexOf(entry.id) >= 0){
      return hasCtxTag("portion") || hasCtxTag("large_pack") || hasCtxTag("big_pack") ||
             ctx.purchaseReason === "大包装" || ctx.foodCategory === "大包装";
    }

    /* END-PROP-005–008: 能量、糖、油类 — 需要相应属性标签 */
    if(["END-PROP-005","END-PROP-006","END-PROP-007","END-PROP-008"].indexOf(entry.id) >= 0){
      return hasCtxTag("energy") || hasCtxTag("sugar") || hasCtxTag("oil") ||
             hasCtxTag("high_energy") || hasCtxTag("high_sugar") || hasCtxTag("high_fat");
    }

    /* END-PROP-009: 咖啡因 — 需要 caffeine 标签 */
    if(entry.id === "END-PROP-009"){
      return hasCtxTag("caffeine");
    }

    /* END-PROP-010: 夜晚 — 仅 evening/late_night */
    if(entry.id === "END-PROP-010"){
      return ctx.timeContext === "evening" || ctx.timeContext === "late_night";
    }

    /* END-PROP-011: 口感变化 — 需要明确 contextTag，不得仅凭宽泛类别 */
    if(entry.id === "END-PROP-011"){
      return hasCtxTag("crisp") || hasCtxTag("fresh") || hasCtxTag("taste_change") ||
             hasCtxTag("cold") || hasCtxTag("fizzy");
    }

    /* END-PROP-012: 口感变化 — 薯片可支持 crisp */
    if(entry.id === "END-PROP-012"){
      return hasCtxTag("crisp") || hasCtxTag("taste_change") || ctx.foodCategory === "薯片";
    }

    /* END-PROP-019: 甜味 — 需要 sweet/sugar 标签 */
    if(entry.id === "END-PROP-019"){
      return hasCtxTag("sweet") || hasCtxTag("sugar");
    }

    /* END-PROP-020: 脆感 — 薯片可支持 */
    if(entry.id === "END-PROP-020"){
      return hasCtxTag("crisp") || ctx.foodCategory === "薯片";
    }

    /* END-PROP-021: 冰冷/气泡 — 需要明确 contextTag，不得把"含糖饮料"等价为含气 */
    if(entry.id === "END-PROP-021"){
      return hasCtxTag("fizzy") || hasCtxTag("cold") || hasCtxTag("carbonated");
    }

    /* END-PROP-013: 易保存 — 需要 storable 标签 */
    if(entry.id === "END-PROP-013"){
      return hasCtxTag("storable") || hasCtxTag("easy_store");
    }

    /* END-PROP-014: 易腐 — 需要 perishable 标签 */
    if(entry.id === "END-PROP-014"){
      return hasCtxTag("perishable") || hasCtxTag("easy_spoil");
    }

    /* END-PROP-015: 奖励/纪念 — 需要 purchaseReason 或标签 */
    if(entry.id === "END-PROP-015"){
      return ctx.purchaseReason === "reward" || ctx.purchaseReason === "celebration" ||
             ctx.purchaseReason === "情绪奖励" || ctx.purchaseReason === "运动后奖励" ||
             hasCtxTag("reward") || hasCtxTag("celebration");
    }

    /* END-PROP-016: 昂贵 — 需要 expensive 标签 */
    if(entry.id === "END-PROP-016"){
      return hasCtxTag("expensive") || hasCtxTag("pricey");
    }

    /* END-PROP-017: 记忆 — 需要 memory 标签 */
    if(entry.id === "END-PROP-017"){
      return hasCtxTag("memory") || hasCtxTag("nostalgia");
    }

    /* END-PROP-018: 稀有 — 需要 rare 标签 */
    if(entry.id === "END-PROP-018"){
      return hasCtxTag("rare") || hasCtxTag("scarce");
    }

    /* END-PROP-022: 工作间隙 — 需要 work_break 标签 */
    if(entry.id === "END-PROP-022"){
      return hasCtxTag("work_break") || hasCtxTag("work");
    }

    /* END-PROP-023: 非必要摄入 — 仅 needState === optional */
    if(entry.id === "END-PROP-023"){
      return ctx.needState === "optional";
    }

    /* 默认：无证据，排除 */
    return false;
  }

  /* 评分函数 */
  function scoreEntry(entry, ctx, recentCopyIds){
    var score = 0;
    var tags = parseTags(entry.tags);
    var reasons = [];

    /* 1. choiceType 匹配：精确匹配远高于通用匹配 */
    var choiceTag = CHOICE_MAP[ctx.choiceType];
    if(choiceTag && tags.choice){
      var exactMatch = false;
      var genericMatch = false;
      tags.choice.forEach(function(v){
        if(v === ctx.choiceType){
          exactMatch = true;
        } else if(v === "any"){
          genericMatch = true;
        }
      });
      if(exactMatch){
        score += 60;
        reasons.push("choice:exact");
      } else if(genericMatch){
        score += 20;
        reasons.push("choice:generic");
      }
    }

    /* 2. feeling 匹配（不映射 hesitate → waste） */
    if(ctx.feeling && tags.feeling){
      var feelingVal = FEELING_MAP[ctx.feeling] || ctx.feeling;
      if(hasTagValue(tags, "feeling", feelingVal)){
        score += 25;
        reasons.push("feeling:match");
      }
    }

    /* 3. Bank G 食品性质匹配 — 只有通过证据门槛才加分 */
    if(entry.bank === "G"){
      if(bankGEligible(entry, ctx)){
        score += 8;
        reasons.push("food_property:evidence");
      }
      /* 不通过证据门槛时不加分 */
    }

    /* 4. 时间匹配 */
    if(ctx.timeContext && tags.time){
      if(hasTagValue(tags, "time", ctx.timeContext)){
        score += 12;
        reasons.push("time:match");
      }
    }

    /* 5. tone 偏好匹配 */
    if(ctx.tone && tags.tone){
      if(hasTagValue(tags, "tone", ctx.tone)){
        score += 10;
        reasons.push("tone:match");
      }
    }

    /* 6. needState 匹配 — only boost when likely_needed */
    if(ctx.needState === "likely_needed" && tags.need){
      if(hasTagValue(tags, "need", "likely") || hasTagValue(tags, "need", "likely/uncertain")){
        score += 30;
        reasons.push("need:likely_match");
      }
    }

    /* 7. safety 标签加分 — only when likely_needed */
    if(tags.safety && ctx.needState === "likely_needed"){
      score += 40;
      reasons.push("safety:boost");
    }

    /* Bank I 在 likely_needed 下也获得安全加分 */
    if(entry.bank === "I" && ctx.needState === "likely_needed"){
      score += 30;
      reasons.push("longterm:boost");
    }

    /* 8. confidence 低/未知时优先问题式 */
    if((ctx.confidence === "low" || ctx.confidence === "unknown") && entry.type === "反问" && entry.bank !== "H"){
      score += 8;
      reasons.push("question:low_confidence");
    }

    /* 9. 最近已使用的文案降权 — 安全池降权幅度受限 */
    if(recentCopyIds && recentCopyIds.indexOf(entry.id) >= 0){
      /* 安全文案（Bank H/I）在 likely_needed 下降权不超过 10，防止退回不安全文案 */
      if(ctx.needState === "likely_needed" && (entry.bank === "H" || entry.bank === "I")){
        score -= 10;
      } else {
        score -= 20;
      }
      reasons.push("recent:suppress");
    }

    /* 10. 最近连续 3 次使用的文案进一步降权 */
    if(recentCopyIds && recentCopyIds.length >= 3){
      var last3 = recentCopyIds.slice(-3);
      if(last3.indexOf(entry.id) >= 0){
        if(ctx.needState === "likely_needed" && (entry.bank === "H" || entry.bank === "I")){
          score -= 5;
        } else {
          score -= 15;
        }
        reasons.push("recent3:suppress");
      }
    }

    return {score: score, reasons: reasons};
  }

  /* 在最高分小集合中进行稳定轮换 */
  function pickFromTop(candidates, ctx){
    if(candidates.length === 0) return null;
    if(candidates.length === 1) return candidates[0];

    candidates.sort(function(a, b){
      return b.score - a.score;
    });

    var topScore = candidates[0].score;
    var topSet = candidates.filter(function(c){
      return topScore - c.score <= 2;
    });

    if(topSet.length === 1) return topSet[0];

    var ctxHash = stableHash(
      (ctx.choiceType||"") + "|" +
      (ctx.feeling||"") + "|" +
      (ctx.timeContext||"") + "|" +
      (ctx.currentPack||"") + "|" +
      (ctx.foodCategory||"")
    );

    var idx = ctxHash % topSet.length;
    return topSet[idx];
  }

  /* Life Prompt 评分 */
  function scoreLifePrompt(entry, ctx, recentCopyIds){
    var score = 0;
    var contextTags = ctx.contextTags || [];
    var hasCtxTag = function(t){ return contextTags.indexOf(t) >= 0; };

    /* late_night → 睡眠类 */
    if(ctx.timeContext === "late_night" && entry.id === "END-LIFE-008") score += 15;

    /* evening/late_night → 洗澡、安静、结束类 */
    if((ctx.timeContext === "evening" || ctx.timeContext === "late_night")){
      if(entry.id === "END-LIFE-005") score += 10;
      if(["END-LIFE-004","END-LIFE-013","END-LIFE-015","END-LIFE-017","END-LIFE-018","END-LIFE-019","END-LIFE-020"].indexOf(entry.id) >= 0) score += 5;
    }

    /* family tag → 家人类 */
    if(hasCtxTag("family") || hasCtxTag("home")){
      if(["END-LIFE-001","END-LIFE-007"].indexOf(entry.id) >= 0) score += 15;
    }

    /* walk/outdoors tag → 散步、户外类 */
    if(hasCtxTag("walk") || hasCtxTag("outdoors")){
      if(["END-LIFE-002","END-LIFE-012"].indexOf(entry.id) >= 0) score += 15;
    }

    /* reading/music/chat tag → 对应生活邀请 */
    if(hasCtxTag("reading") || hasCtxTag("music") || hasCtxTag("chat")){
      if(entry.id === "END-LIFE-006") score += 15;
    }

    /* work/work_break tag → 工作、桌面类 */
    if(hasCtxTag("work") || hasCtxTag("work_break") || hasCtxTag("desk")){
      if(["END-LIFE-010","END-LIFE-014"].indexOf(entry.id) >= 0) score += 15;
    }

    /* 通用类：evening/late_night 时给予基础分（daytime/morning 无标签不触发） */
    if((ctx.timeContext === "evening" || ctx.timeContext === "late_night")){
      var generalEntries = ["END-LIFE-003","END-LIFE-009","END-LIFE-011","END-LIFE-016"];
      if(generalEntries.indexOf(entry.id) >= 0 && score === 0) score += 3;
    }

    /* 最近使用的降权 */
    if(recentCopyIds && recentCopyIds.indexOf(entry.id) >= 0) score -= 15;

    return score;
  }

  /* Life Prompt 选择（0-1 条，有门槛） */
  function selectLifePrompt(ctx, recentCopyIds){
    var bank = window.DropSnacksCopyBank;
    if(!bank || !bank.entries) return null;

    var lifePool = bank.entries.filter(function(e){
      return e.role === "life_prompt" && e.status === "production" && e.locale === "zh-CN";
    });

    if(lifePool.length === 0) return null;

    /* 评分 */
    var scored = lifePool.map(function(e){
      return { entry: e, score: scoreLifePrompt(e, ctx, recentCopyIds) };
    });

    /* 只保留正分候选（门槛） */
    var eligible = scored.filter(function(s){ return s.score > 0; });

    /* 无合格候选时返回 null */
    if(eligible.length === 0) return null;

    /* 按分数降序 */
    eligible.sort(function(a, b){ return b.score - a.score; });

    /* 取最高分小集合 */
    var topScore = eligible[0].score;
    var topSet = eligible.filter(function(s){ return topScore - s.score <= 2; });

    /* 稳定 hash 轮换 */
    var ctxHash = stableHash(
      (ctx.choiceType||"") + "|" +
      (ctx.feeling||"") + "|" +
      (ctx.timeContext||"") + "|" +
      (ctx.currentPack||"")
    );

    return topSet[ctxHash % topSet.length].entry;
  }

  /* 主入口：选择完成文案 */
  function select(ctx){
    var bank = window.DropSnacksCopyBank;
    if(!bank || !bank.entries){
      return fallback(ctx);
    }

    var recentCopyIds = ctx.recentCopyIds || [];
    if(!recentCopyIds.length && ctx.recentChoicesCopyIds){
      recentCopyIds = recentCopyIds.concat(ctx.recentChoicesCopyIds);
    }

    /* 1. role 过滤：只取 primary */
    var pool = bank.entries.filter(function(e){
      return e.role === "primary";
    });

    /* 2. status 和 locale 过滤 */
    pool = pool.filter(function(e){
      return e.status === "production" && e.locale === "zh-CN";
    });

    /* 3. 硬安全过滤 */
    pool = pool.filter(function(e){
      return isSafe(e, ctx);
    });

    /* 3b. Choice 候选资格过滤 — choice 专属 Bank 在 choice 不匹配时排除 */
    pool = pool.filter(function(e){
      return choiceEligible(e, ctx);
    });

    /* 3c. Bank G 证据门槛过滤 */
    pool = pool.filter(function(e){
      if(e.bank === "G"){
        return bankGEligible(e, ctx);
      }
      return true;
    });

    /* 4-8. 评分 */
    var scored = pool.map(function(e){
      var result = scoreEntry(e, ctx, recentCopyIds);
      return {
        entry: e,
        score: result.score,
        reasons: result.reasons
      };
    });

    /* 过滤掉负分项（除非全部都是负分） */
    var positive = scored.filter(function(s){ return s.score > 0; });
    if(positive.length === 0) positive = scored;

    /* 9. 在最高分小集合中轮换 */
    var picked = pickFromTop(positive, ctx);

    if(!picked){
      return fallback(ctx);
    }

    /* Life Prompt 选择（0-1 条，有门槛） */
    var lifePrompt = selectLifePrompt(ctx, recentCopyIds);

    /* 构造输出 */
    var matchedTags = picked.reasons.slice();
    return {
      primary: picked.entry,
      lifePrompt: lifePrompt,
      matchedTags: matchedTags,
      scoreSummary: {
        candidateCount: positive.length,
        topScore: picked.score,
        primaryReasons: picked.reasons,
        hasLifePrompt: lifePrompt !== null
      },
      engineVersion: ENGINE_VERSION
    };
  }

  /* 降级策略：从安全通用结语中选择 */
  function fallback(ctx){
    var bank = window.DropSnacksCopyBank;
    if(!bank){
      return {
        primary: {id: "FALLBACK-001", text: "这一刻已经结束。", type: "陈述"},
        lifePrompt: null,
        matchedTags: ["fallback"],
        scoreSummary: {candidateCount: 0, topScore: 0, primaryReasons: ["fallback"], hasLifePrompt: false},
        engineVersion: ENGINE_VERSION
      };
    }

    var genEntries = bank.getByBank("A");
    if(genEntries.length > 0){
      var ctxHash = stableHash(
        (ctx.choiceType||"") + "|" +
        (ctx.feeling||"") + "|" +
        (ctx.timeContext||"") + "|" +
        (ctx.currentPack||"")
      );
      var entry = genEntries[ctxHash % genEntries.length];
      return {
        primary: entry,
        lifePrompt: null,
        matchedTags: ["fallback:generic"],
        scoreSummary: {candidateCount: 0, topScore: 0, primaryReasons: ["fallback:generic"], hasLifePrompt: false},
        engineVersion: ENGINE_VERSION
      };
    }

    return {
      primary: {id: "FALLBACK-001", text: "这一刻已经结束。", type: "陈述"},
      lifePrompt: null,
      matchedTags: ["fallback"],
      scoreSummary: {candidateCount: 0, topScore: 0, primaryReasons: ["fallback"], hasLifePrompt: false},
      engineVersion: ENGINE_VERSION
    };
  }

  /* feeling 规范化 */
  function normalizeFeeling(f){
    if(f === "dontwant" || f === "dont-want") return "dont_want";
    return f;
  }

  /* 构造 contextSnapshot */
  function buildSnapshot(ctx){
    return {
      feeling: normalizeFeeling(ctx.feeling) || "unknown",
      choiceType: ctx.choiceType || "unknown",
      foodCategory: ctx.foodCategory || "unknown",
      openedState: ctx.openedState || "unknown",
      purchaseReason: ctx.purchaseReason || "unknown",
      timeContext: ctx.timeContext || "unknown",
      currentPack: ctx.currentPack || "unknown",
      confidence: ctx.confidence || "unknown",
      needState: ctx.needState || "unknown"
    };
  }

  /* 构造 copyResponse */
  function buildCopyResponse(result){
    return {
      primaryId: result.primary ? result.primary.id : null,
      lifePromptId: result.lifePrompt ? result.lifePrompt.id : null,
      matchedTags: result.matchedTags || [],
      scoreSummary: result.scoreSummary || {},
      engineVersion: ENGINE_VERSION
    };
  }

  window.DropSnacksCopyEngine = {
    ENGINE_VERSION: ENGINE_VERSION,
    select: select,
    buildSnapshot: buildSnapshot,
    buildCopyResponse: buildCopyResponse,
    fallback: fallback,
    isSafe: isSafe,
    choiceEligible: choiceEligible,
    bankGEligible: bankGEligible,
    hasTagValue: hasTagValue,
    selectLifePrompt: selectLifePrompt,
    normalizeFeeling: normalizeFeeling
  };
})();
