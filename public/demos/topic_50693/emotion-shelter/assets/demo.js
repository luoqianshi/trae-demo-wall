(function () {
  "use strict";

  /* ========== 基础 state（优化4 扩展字段） ========== */
  var state = {
    emotion: "hurt",
    energy: 0,
    published: false,
    completedActions: [],
    worryText: ""
  };

  var userTouchedEmotion = false;
  var autoDetectPaused = false; // 重置后暂时禁用自动识别，避免默认文本立即覆盖
  var debounceTimer = null; // 情绪识别防抖定时器

  /* ========== 情绪档案 ========== */
  var profiles = {
    hurt: {
      type: "委屈型",
      name: "雾绒",
      story: "它是一只把委屈藏进软耳朵里的小动物。它不需要你马上开心，只希望你今晚对自己温柔一点。"
    },
    anger: {
      type: "愤怒型",
      name: "火尾豆",
      story: "它的尾巴会冒火，因为它替你记得那些不公平。先让火焰有出口，再决定要不要回应。"
    },
    anxiety: {
      type: "焦虑型",
      name: "闪触",
      story: "它的触角一直在闪，像停不下来的念头。它现在最需要的是慢慢呼吸，把注意力放回身体。"
    },
    tired: {
      type: "疲惫型",
      name: "慢慢",
      story: "它走路很慢，电量很低。它不是偷懒，只是提醒你：今天可以少撑一会儿。"
    }
  };

  /* ========== 优化1：情绪识别词典 ========== */
  var EMOTION_LEXICON = {
    hurt: {
      words: {
        "委屈": 1.4, "冤枉": 1.5, "被误解": 1.4, "误会": 1.2, "不公平": 1.3,
        "被忽视": 1.3, "冷落": 1.2, "没人懂": 1.3, "不被理解": 1.4,
        "被指责": 1.3, "背锅": 1.2, "哑巴吃黄连": 1.3, "难过": 1.0,
        "伤心": 1.0, "想哭": 1.1, "眼泪": 0.9, "憋屈": 1.3, "心酸": 1.1,
        "被辜负": 1.2, "被抛弃": 1.3, "孤单": 0.9, "被冷淡": 1.1
      }
    },
    anger: {
      words: {
        "愤怒": 1.5, "生气": 1.4, "气死": 1.5, "恼火": 1.3, "火大": 1.3,
        "炸了": 1.4, "烦死了": 1.2, "讨厌": 1.0, "恶心": 1.1, "可恶": 1.2,
        "凭什么": 1.3, "不可理喻": 1.3, "气不过": 1.2, "暴怒": 1.5,
        "忍不了": 1.2, "想骂人": 1.3, "被欺骗": 1.2, "被背叛": 1.3,
        "无耻": 1.3, "过分": 1.1, "受够了": 1.2, "被冒犯": 1.2
      }
    },
    anxiety: {
      words: {
        "焦虑": 1.5, "担心": 1.2, "害怕": 1.2, "紧张": 1.2, "慌": 1.1,
        "忐忑": 1.2, "压力大": 1.3, "睡不着": 1.0, "胡思乱想": 1.2,
        "心慌": 1.2, "不安": 1.1, "恐惧": 1.3, "怕": 0.9, "愁": 1.0,
        "纠结": 1.0, "烦躁": 1.1, "坐立不安": 1.3, "喘不过气": 1.2,
        "完不成": 1.0, "来不及": 1.0, "怎么办": 0.9, "心跳": 0.8
      }
    },
    tired: {
      words: {
        "累": 1.3, "疲惫": 1.5, "困": 1.1, "撑不住": 1.4, "没力气": 1.3,
        "精疲力尽": 1.5, "心力交瘁": 1.4, "耗尽": 1.3, "不想动": 1.2,
        "好困": 1.2, "犯困": 1.0, "没精神": 1.2, "虚脱": 1.3,
        "身心俱疲": 1.5, "电量低": 1.2, "透支": 1.3, "想休息": 1.1,
        "撑不了": 1.2, "好累": 1.3, "没劲": 1.0, "犯困": 1.0
      }
    }
  };

  var NEGATION_WORDS = ["不", "没", "没有", "别", "无", "非", "未", "莫", "不算", "不是", "并不", "从不"];

  var DEGREE_WORDS = {
    "极其": 2.0, "非常": 1.8, "特别": 1.7, "太": 1.6, "十分": 1.7,
    "很": 1.5, "挺": 1.3, "超": 1.6, "真的": 1.4, "实在": 1.4,
    "有点": 0.8, "稍微": 0.7, "一点": 0.8, "有些": 0.9, "蛮": 1.2
  };

  /* ========== 优化3：社区文案模板 ========== */
  var communityTemplates = {
    hurt: {
      messages: ["慢一点也没有关系。", "今天的我没有丢下自己。", "委屈也被好好接住了。"],
      actionFallback: "完成了几件照顾自己的小事"
    },
    anger: {
      messages: ["愤怒也可以被好好安放。", "让火先有出口，再决定回不回应。", "我没有把火撒向自己。"],
      actionFallback: "深呼吸、给情绪一个出口"
    },
    anxiety: {
      messages: ["停不下来的念头，今晚先停一停。", "把注意力放回身体里。", "担心的事，明天再拆。"],
      actionFallback: "深呼吸、把念头放下来"
    },
    tired: {
      messages: ["今天可以少撑一会儿。", "允许自己慢下来。", "电量正在一点点回来。"],
      actionFallback: "早睡、让身体休息"
    }
  };

  /* ========== 工具函数 ========== */
  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  /* ========== 优化1：情绪识别算法 ========== */
  function analyzeEmotion(text) {
    var scores = { hurt: 0, anger: 0, anxiety: 0, tired: 0 };
    var matchedWords = [];
    if (!text || !text.trim()) {
      return { primary: null, scores: scores, mixed: [], confidence: 0, matchedWords: [] };
    }

    Object.keys(EMOTION_LEXICON).forEach(function (emo) {
      var dict = EMOTION_LEXICON[emo].words;
      Object.keys(dict).forEach(function (word) {
        var baseWeight = dict[word];
        var fromIndex = 0;
        var idx;
        while ((idx = text.indexOf(word, fromIndex)) !== -1) {
          var winStart = Math.max(0, idx - 3);
          var context = text.substring(winStart, idx);

          var negated = NEGATION_WORDS.some(function (n) {
            return context.indexOf(n) !== -1;
          });
          if (!negated) {
            var degree = 1;
            Object.keys(DEGREE_WORDS).forEach(function (d) {
              if (context.indexOf(d) !== -1 && DEGREE_WORDS[d] > degree) {
                degree = DEGREE_WORDS[d];
              }
            });
            scores[emo] += baseWeight * degree;
            if (matchedWords.indexOf(word) === -1) matchedWords.push(word);
          }
          fromIndex = idx + word.length;
        }
      });
    });

    var primary = null, maxScore = 0, total = 0;
    Object.keys(scores).forEach(function (emo) {
      total += scores[emo];
      if (scores[emo] > maxScore) {
        maxScore = scores[emo];
        primary = emo;
      }
    });
    if (maxScore === 0) {
      return { primary: null, scores: scores, mixed: [], confidence: 0, matchedWords: [] };
    }

    var mixed = [primary];
    Object.keys(scores).forEach(function (emo) {
      if (emo !== primary && scores[emo] >= maxScore * 0.6 && scores[emo] > 0) {
        mixed.push(emo);
      }
    });

    var confidence = total > 0 ? maxScore / total : 0;
    return { primary: primary, scores: scores, mixed: mixed, confidence: confidence, matchedWords: matchedWords };
  }

  function renderEmotionHint(result) {
    var hint = $("#emotionHint");
    if (!hint) return;
    if (!result.primary) {
      hint.hidden = true;
      return;
    }
    if (result.mixed.length > 1) {
      var names = result.mixed.map(function (k) {
        return profiles[k].type.replace("型", "");
      }).join("+");
      hint.textContent = "检测到多种情绪（" + names + "），已选「" +
        profiles[result.primary].type + "」为主，可手动调整";
    } else {
      hint.textContent = "已识别为「" + profiles[result.primary].type + "」";
    }
    hint.hidden = false;
  }

  function selectEmotion(emo) {
    state.emotion = emo;
    $all(".emotion").forEach(function (item) {
      var isActive = item.dataset.emotion === emo;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    updateMonster();
  }

  /* ========== 优化4：localStorage 持久化 ========== */
  var STORAGE_KEY = "emotionShelter:v1";
  var STORAGE_TTL = 24 * 60 * 60 * 1000;

  function saveState() {
    var payload = { state: state, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      if (!payload || !payload.savedAt) return null;
      if (Date.now() - payload.savedAt > STORAGE_TTL) {
        localStorage.removeItem(STORAGE_KEY);
        return { expired: true };
      }
      return payload;
    } catch (e) { return null; }
  }

  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function syncUIFromState() {
    $all(".emotion").forEach(function (btn) {
      var active = btn.dataset.emotion === state.emotion;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    var msvg = document.getElementById("msvg");
    if (msvg) msvg.setAttribute("data-variant", state.emotion);
    // 喂养屏迷你宠物同步
    var feedSvg = document.querySelector("#feedMonster .msvg");
    if (feedSvg) feedSvg.setAttribute("data-variant", state.emotion);
    var feedMonster = document.getElementById("feedMonster");
    if (feedMonster) {
      feedMonster.classList.toggle("hurt-stage", state.energy < 70);
      feedMonster.classList.toggle("healed", state.energy >= 70 && state.energy < 100);
      feedMonster.classList.toggle("transformed", state.energy >= 100);
    }
    if (state.worryText) {
      var input = $("#worryInput");
      if (input) input.value = state.worryText;
    }
    $all(".feed").forEach(function (btn) {
      var action = btn.dataset.action;
      var done = state.completedActions.indexOf(action) !== -1;
      btn.classList.toggle("done", done);
      if (done) {
        var s = btn.querySelector("strong");
        if (s) s.textContent = "已完成";
      }
    });
    if (state.published) {
      renderMyCommunityCard();
      var card = $("#myCommunityCard");
      if (card) card.hidden = false;
      var pub = $("#publishBtn");
      if (pub) pub.textContent = "已发布到成果社区";
    }
    // 能量条同步
    var petBar = document.getElementById("energyBar");
    var petText = document.getElementById("energyText");
    var feedBar = document.getElementById("feedEnergyBar");
    var feedText = document.getElementById("feedEnergyText");
    if (petBar) petBar.style.width = state.energy + "%";
    if (petText) petText.textContent = state.energy + "%";
    if (feedBar) feedBar.style.width = state.energy + "%";
    if (feedText) feedText.textContent = state.energy + "%";
  }

  /* ========== 优化3：动态社区卡片 ========== */
  function buildCommunityCard() {
    var profile = profiles[state.emotion];
    var tpl = communityTemplates[state.emotion];
    var actions = state.completedActions.slice(0, 3);
    var actionText = actions.length ? actions.join("、") : tpl.actionFallback;
    var msg = tpl.messages[Math.floor(Math.random() * tpl.messages.length)];
    return { name: profile.name, actionText: actionText, message: msg };
  }

  function avatarStyleFor(emo) {
    var styles = {
      hurt: "border-radius:42% 58% 48% 52%;",
      anger: "border-radius:58% 42% 48% 52%;",
      anxiety: "border-radius:48% 52% 58% 42%;",
      tired: "border-radius:52% 48% 42% 58%;"
    };
    return styles[emo] || styles.hurt;
  }

  function renderMyCommunityCard() {
    var card = $("#myCommunityCard");
    if (!card) return;
    var info = buildCommunityCard();
    var avatarStyle = avatarStyleFor(state.emotion);
    card.innerHTML =
      '<div class="avatar" style="' + avatarStyle + '"></div>' +
      '<div><h3>' + info.name + ' · 已蜕变</h3>' +
      '<p>行动：' + info.actionText + '。留言：' + info.message + '</p></div>';
  }

  /* ========== 优化6：重置 ========== */
  var DEFAULT_WORRY = "今天被误解了，但又不想解释。明明已经很累，还要装作没关系。";

  function resetAll() {
    if (!window.confirm("确定要重置吗？当前怪兽和进度将被清空，无法恢复。")) return;
    // 清除可能待触发的防抖定时器，防止重置后情绪识别意外触发
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    state.emotion = "hurt";
    state.energy = 0;
    state.published = false;
    state.completedActions = [];
    state.worryText = "";
    userTouchedEmotion = false;
    autoDetectPaused = true; // 重置后暂停自动识别，防止默认文本立即覆盖
    clearState();

    var input = $("#worryInput");
    if (input) input.value = DEFAULT_WORRY;
    $all(".emotion").forEach(function (btn) {
      var active = btn.dataset.emotion === "hurt";
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    $all(".feed").forEach(function (btn) {
      btn.classList.remove("done");
      var s = btn.querySelector("strong");
      if (s && btn.dataset.originalEnergy) s.textContent = "+" + btn.dataset.originalEnergy;
    });
    var card = $("#myCommunityCard");
    if (card) card.hidden = true;
    var pub = $("#publishBtn");
    if (pub) pub.textContent = "发布我的成果宠物";
    var hint = $("#emotionHint");
    if (hint) hint.hidden = true;
    showScreen("talk");
    updateMonster();
  }

  /* ========== 屏幕切换 ========== */
  function showScreen(name) {
    $all(".screen").forEach(function (screen) {
      screen.classList.toggle("active", screen.dataset.screen === name);
    });
    $all(".tabbar button").forEach(function (button) {
      var isActive = button.dataset.tab === name;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  /* ========== 优化9：三阶段宠物视觉 ========== */
  function updateMonster() {
    var profile = profiles[state.emotion];
    var monster = $("#monster");
    if (!monster) return;

    // 三阶段互斥类
    monster.classList.toggle("hurt-stage", state.energy < 70);
    monster.classList.toggle("healed", state.energy >= 70 && state.energy < 100);
    monster.classList.toggle("transformed", state.energy >= 100);

    var msvg = document.getElementById("msvg");
    if (msvg) {
      msvg.setAttribute("data-variant", state.emotion);
    }

    $("#petType").textContent = profile.type;
    $("#petName").textContent = profile.name;
    $("#petStory").textContent = profile.story;
    $("#energyText").textContent = state.energy + "%";
    $("#energyBar").style.width = state.energy + "%";

    // 喂养屏迷你宠物同步
    var feedMonster = document.getElementById("feedMonster");
    var feedSvg = feedMonster ? feedMonster.querySelector(".msvg") : null;
    if (feedMonster) {
      feedMonster.classList.toggle("hurt-stage", state.energy < 70);
      feedMonster.classList.toggle("healed", state.energy >= 70 && state.energy < 100);
      feedMonster.classList.toggle("transformed", state.energy >= 100);
    }
    if (feedSvg) {
      feedSvg.setAttribute("data-variant", state.emotion);
    }
    var feedEnergyText = document.getElementById("feedEnergyText");
    var feedEnergyBar = document.getElementById("feedEnergyBar");
    if (feedEnergyText) feedEnergyText.textContent = state.energy + "%";
    if (feedEnergyBar) feedEnergyBar.style.width = state.energy + "%";

    if (state.energy >= 100) {
      $("#feedResult").textContent = "怪兽完成蜕变，可以发布成果宠物";
    } else if (state.energy >= 70) {
      $("#feedResult").textContent = "怪兽正在蜕变，伤痕已经明显变浅";
    } else if (state.energy > 0) {
      $("#feedResult").textContent = "怪兽被照顾到了，能量正在恢复";
    } else {
      $("#feedResult").textContent = "今日尚未喂养";
    }
  }

  /* ========== 事件绑定 ========== */
  // 情绪按钮
  $all(".emotion").forEach(function (button) {
    button.addEventListener("click", function () {
      userTouchedEmotion = true;
      selectEmotion(button.dataset.emotion);
      saveState();
    });
  });

  // 优化1：倾诉文本实时识别
  var worryInput = $("#worryInput");
  if (worryInput) {
    worryInput.addEventListener("input", function () {
      state.worryText = worryInput.value;
      // 如果自动识别被暂停，且用户输入已不同于默认文本，解除暂停
      if (autoDetectPaused && worryInput.value !== DEFAULT_WORRY) {
        autoDetectPaused = false;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var result = analyzeEmotion(worryInput.value);
        renderEmotionHint(result);
        // 只有用户没手动选过 且 自动识别未被暂停 时才自动切换
        if (!userTouchedEmotion && !autoDetectPaused && result.primary) {
          selectEmotion(result.primary);
        }
      }, 400);
    });
    // 输入框获得焦点时，如果 autoDetectPaused 为 true 且文本已变化，解除暂停
    worryInput.addEventListener("focus", function () {
      if (autoDetectPaused && worryInput.value !== DEFAULT_WORRY) {
        autoDetectPaused = false;
      }
    });
  }

  // 生成按钮
  var generateBtn = $("#generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", function () {
      // 兜底识别
      if (!userTouchedEmotion && worryInput) {
        var result = analyzeEmotion(worryInput.value);
        if (result.primary) {
          selectEmotion(result.primary);
        }
      }
      state.worryText = worryInput ? worryInput.value : "";
      updateMonster();
      showScreen("pet");
      saveState();
    });
  }

  // 底部导航
  $all(".tabbar button").forEach(function (button) {
    button.addEventListener("click", function () {
      showScreen(button.dataset.tab);
    });
  });

  // data-jump 跳转
  $all("[data-jump]").forEach(function (button) {
    button.addEventListener("click", function () {
      showScreen(button.dataset.jump);
    });
  });

  // 喂养按钮（优化3/4：记录行动 + 持久化 + 喂养反馈动画）
  $all(".feed").forEach(function (button) {
    button.dataset.originalEnergy = button.dataset.energy;
    button.addEventListener("click", function () {
      if (button.classList.contains("done")) return;
      var energyGain = Number(button.dataset.energy || 0);
      state.energy = Math.min(100, state.energy + energyGain);
      button.classList.add("done");
      button.querySelector("strong").textContent = "已完成";
      var action = button.dataset.action || "行动";
      if (state.completedActions.indexOf(action) === -1) {
        state.completedActions.push(action);
      }

      // === 喂养反馈动画 ===
      var monster = $("#monster");
      var feedMonster = document.getElementById("feedMonster");
      var stage = $(".monster-stage");

      // 1. 宠物弹跳（宠物屏 + 喂养屏迷你宠物）
      [monster, feedMonster].forEach(function (m) {
        if (!m) return;
        m.classList.remove("feeding");
        void m.offsetWidth;
        m.classList.add("feeding");
        setTimeout(function () { m.classList.remove("feeding"); }, 600);

        // 2. 临时开心表情（1.5s 后恢复）
        m.classList.add("happy");
        setTimeout(function () { m.classList.remove("happy"); }, 1500);
      });

      // 3. 能量条脉冲（两个屏都脉冲）
      $all(".progress").forEach(function (bar) {
        bar.classList.remove("pulse");
        void bar.offsetWidth;
        bar.classList.add("pulse");
        setTimeout(function () { bar.classList.remove("pulse"); }, 500);
      });
      $all(".progress-label").forEach(function (label) {
        label.classList.add("pulse");
        setTimeout(function () { label.classList.remove("pulse"); }, 800);
      });

      // 4. 浮动 +N 数字（宠物屏）
      if (stage && energyGain > 0) {
        var floatEl = document.createElement("span");
        floatEl.className = "float-plus";
        floatEl.textContent = "+" + energyGain;
        floatEl.style.left = "50%";
        floatEl.style.top = "40%";
        floatEl.style.transform = "translateX(-50%)";
        stage.appendChild(floatEl);
        setTimeout(function () {
          if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
        }, 1200);
      }
      // 喂养屏迷你宠物浮动数字
      if (feedMonster && energyGain > 0) {
        var smallFloat = document.createElement("span");
        smallFloat.className = "float-plus";
        smallFloat.textContent = "+" + energyGain;
        smallFloat.style.left = "50%";
        smallFloat.style.top = "20%";
        smallFloat.style.fontSize = ".9rem";
        smallFloat.style.transform = "translateX(-50%)";
        var parent = feedMonster.parentNode;
        if (parent && getComputedStyle(parent).position === "static") {
          parent.style.position = "relative";
        }
        feedMonster.parentNode.appendChild(smallFloat);
        setTimeout(function () {
          if (smallFloat.parentNode) smallFloat.parentNode.removeChild(smallFloat);
        }, 1200);
      }

      updateMonster();
      saveState();
    });
  });

  // 发布按钮（优化3：动态卡片）
  var publishBtn = $("#publishBtn");
  if (publishBtn) {
    publishBtn.addEventListener("click", function () {
      if (state.energy < 100) {
        publishBtn.textContent = "能量达到 100% 后才能发布";
        window.setTimeout(function () {
          publishBtn.textContent = "发布我的成果宠物";
        }, 1400);
        return;
      }
      state.published = true;
      renderMyCommunityCard();
      var card = $("#myCommunityCard");
      if (card) card.hidden = false;
      publishBtn.textContent = "已发布到成果社区";
      saveState();
    });
  }

  // 优化6：重置按钮
  var resetBtn = $("#resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAll);
  }

  /* ========== 启动：恢复 + 渲染 ========== */
  var saved = loadState();
  if (saved && saved.state) {
    state.emotion = saved.state.emotion || "hurt";
    state.energy = saved.state.energy || 0;
    state.published = !!saved.state.published;
    state.completedActions = Array.isArray(saved.state.completedActions) ? saved.state.completedActions : [];
    state.worryText = saved.state.worryText || "";
    syncUIFromState();
  }
  updateMonster();
})();
