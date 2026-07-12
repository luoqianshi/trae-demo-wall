(function () {
  const STORAGE_KEYS = {
    templates: "pby_user_templates_v1",
    records: "pby_records_v1",
    draft: "pby_draft_v1",
    activeDecision: "pby_active_decision_v1"
  };

  const EFFECTS = [
    { id: "none", name: "无动效", desc: "直接拍板" },
    { id: "flip", name: "翻牌", desc: "拍一下翻开" },
    { id: "wheel", name: "转盘", desc: "转一圈停下" }
  ];

  const OFFICIAL_TEMPLATES = [
    { id: "eat", title: "今天吃什么", iconKey: "eat", desc: "晚饭不用再纠结", effect: "wheel", options: ["火锅", "烧烤", "日料", "面食", "轻食", "粤菜"] },
    { id: "weekend", title: "周末去哪玩", iconKey: "weekend", desc: "给周末一个方向", effect: "flip", options: ["公园散步", "逛商场", "看展览", "周边县城游", "宅家休息", "城市骑行"] },
    { id: "housework", title: "谁来做家务", iconKey: "housework", desc: "公平一点最省心", effect: "none", options: ["洗碗", "倒垃圾", "拖地", "做饭", "收衣服", "采购"] }
  ];

  const HOT_TEMPLATES = [
    { id: "movie", title: "看什么电影", iconKey: "movie", desc: "片单选择交给鸭", effect: "flip", options: ["喜剧", "爱情", "动画", "悬疑", "纪录片", "老电影"] },
    { id: "drink", title: "喝什么饮品", iconKey: "drink", desc: "奶茶咖啡都公平", effect: "wheel", options: ["奶茶", "咖啡", "果茶", "气泡水", "酸奶", "热可可"] },
    { id: "date", title: "约会做什么", iconKey: "date", desc: "轻松安排小约会", effect: "flip", options: ["吃饭", "散步", "看电影", "拍照", "逛街", "做甜品"] },
    { id: "night", title: "晚上玩什么", iconKey: "night", desc: "把夜晚拍可爱点", effect: "wheel", options: ["桌游", "游戏", "追剧", "聊天", "运动", "早睡"] },
    { id: "travel", title: "旅行小决定", iconKey: "travel", desc: "路上也能少纠结", effect: "wheel", options: ["先去景点", "先吃饭", "先拍照", "买伴手礼", "找咖啡店", "随便走走"] },
    { id: "family", title: "家庭小分工", iconKey: "family", desc: "家里也要温柔公平", effect: "none", options: ["做饭", "收拾", "采购", "陪娃", "洗衣", "整理玩具"] },
    { id: "reward", title: "随机小奖励", iconKey: "reward", desc: "给今天一点甜头", effect: "flip", options: ["吃甜品", "休息半小时", "免家务", "选节目", "买小物", "按摩十分钟"] }
  ];

  function blankDraft() {
    return {
      title: "",
      options: ["", ""],
      effect: "none",
      sourceType: "custom",
      sourceLabel: "",
      editingTemplateId: null
    };
  }

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeOptions(options) {
    const rows = Array.isArray(options) ? options.slice(0, 12).map((item) => String(item || "")) : [];
    while (rows.length < 2) rows.push("");
    return rows;
  }

  function effectiveOptions(options) {
    return normalizeOptions(options).map((item) => item.trim()).filter(Boolean);
  }

  function getDraft() {
    const draft = safeRead(STORAGE_KEYS.draft, null);
    if (!draft) return blankDraft();
    return {
      title: draft.title || "",
      options: normalizeOptions(draft.options),
      effect: EFFECTS.some((effect) => effect.id === draft.effect) ? draft.effect : "none",
      sourceType: draft.sourceType || "custom",
      sourceLabel: draft.sourceLabel || "",
      editingTemplateId: draft.editingTemplateId || null
    };
  }

  function saveDraft(draft) {
    safeWrite(STORAGE_KEYS.draft, draft);
  }

  function setBlankDraft() {
    const draft = blankDraft();
    saveDraft(draft);
    return draft;
  }

  function setDraftFromTemplate(template, isSaved) {
    const draft = {
      title: template.title || "",
      options: normalizeOptions(template.options),
      effect: template.effect || "none",
      sourceType: isSaved ? "mine" : "template",
      sourceLabel: isSaved ? "来自我的模板" : "来自官方模板",
      editingTemplateId: isSaved ? template.id : null
    };
    saveDraft(draft);
    return draft;
  }

  function getSavedTemplates() {
    return safeRead(STORAGE_KEYS.templates, []);
  }

  function saveSavedTemplates(templates) {
    safeWrite(STORAGE_KEYS.templates, templates);
  }

  function getRecords() {
    return safeRead(STORAGE_KEYS.records, []);
  }

  function saveRecords(records) {
    safeWrite(STORAGE_KEYS.records, records);
  }

  function setActiveDecision(decision) {
    safeWrite(STORAGE_KEYS.activeDecision, decision);
  }

  function getActiveDecision() {
    return safeRead(STORAGE_KEYS.activeDecision, null);
  }

  function pickRandom(options) {
    const valid = effectiveOptions(options);
    const index = Math.floor(Math.random() * valid.length);
    return { index, value: valid[index], total: valid.length };
  }

  function nowTimeText() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getEffectName(effectId) {
    return (EFFECTS.find((effect) => effect.id === effectId) || EFFECTS[0]).name;
  }

  function showToast(text) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    window.clearTimeout(showToast.timer);
    toast.textContent = text;
    toast.classList.add("is-visible");
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function tabbar(active) {
    const items = [
      {
        id: "home",
        href: "index.html",
        label: "首页",
        icon: `<svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 10 8-6 8 6"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/></svg>`
      },
      {
        id: "create",
        href: "create.html",
        label: "创建决策",
        icon: `<svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`
      },
      {
        id: "mine",
        href: "mine.html",
        label: "我的",
        icon: `<svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.25"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>`
      }
    ];
    return `<nav class="tabbar" aria-label="底部导航">
      ${items.map((item) => {
        const current = active === item.id;
        return `<a class="tab-btn ${current ? "is-active" : ""}" ${current ? 'aria-current="page"' : ""} href="${item.href}">
          <span class="tab-mark">${item.icon}</span><span class="tab-label">${item.label}</span>
        </a>`;
      }).join("")}
    </nav>`;
  }

  window.PBY = {
    STORAGE_KEYS,
    EFFECTS,
    OFFICIAL_TEMPLATES,
    HOT_TEMPLATES,
    blankDraft,
    normalizeOptions,
    effectiveOptions,
    getDraft,
    saveDraft,
    setBlankDraft,
    setDraftFromTemplate,
    getSavedTemplates,
    saveSavedTemplates,
    getRecords,
    saveRecords,
    setActiveDecision,
    getActiveDecision,
    pickRandom,
    nowTimeText,
    escapeHTML,
    getEffectName,
    showToast,
    tabbar
  };
})();
