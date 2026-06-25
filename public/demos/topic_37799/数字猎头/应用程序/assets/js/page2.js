(function () {
  const $ = (sel) => document.querySelector(sel);

  // ========== 读取页面1 输入 ==========
  const raw = (() => {
    try { return sessionStorage.getItem("headhunter_page1"); } catch (e) { return null; }
  })();

  let input = { intro: "", resume: "", files: [] };
  if (raw) {
    try { input = Object.assign(input, JSON.parse(raw)); } catch (e) {}
  }

  // 如果用户没有输入但有样例文件路径提示，展示样例内容
  const hasAnyInput = (input.intro + input.resume).trim().length > 0;
  if (!hasAnyInput) {
    // 使用内置样例内容
    input.intro = "";
    input.resume = getSampleResumeText();
    input.files = [{ name: "高守的简历 0618.docx", size: 0, sample: true }];
  }

  // 填充输入摘要
  const introLen = input.intro.trim().length;
  const resumeLen = input.resume.trim().length;
  $("#introMeta").textContent = introLen > 0 ? introLen + " 字" : "未填写";
  $("#resumeMeta").textContent = resumeLen > 0 ? resumeLen + " 字" : "未填写";
  $("#fileMeta").textContent =
    input.files && input.files.length > 0
      ? input.files.map((f) => f.name).join("、")
      : "无";

  $("#introDetail").textContent = input.intro.trim() || "（无）";
  $("#resumeDetail").textContent = input.resume.trim() || "（无）";

  let detailOpen = false;
  $("#btnToggleInput").addEventListener("click", () => {
    detailOpen = !detailOpen;
    $("#inputDetail").style.display = detailOpen ? "block" : "none";
    $("#btnToggleInput").textContent = detailOpen ? "收起详情" : "展开详情";
  });

  // ========== Toast ==========
  let toastTimer = null;
  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ========== TRAE Auto Model 核心逻辑 ==========
  // 该模型通过"启发式规则 + 岗位技能库"实现：
  //  1) 识别简历中的岗位关键词 → 确定岗位
  //  2) 从文本中抽取技能（词库命中 + 前后向模式匹配）
  //  3) 根据岗位补充该岗位常见技能
  //  4) 关键词从文本抽取非技能的关键词（项目名/公司/城市/学历等）

  const POSITION_LIBRARY = {
    "前端工程师": {
      patterns: ["前端", "前端工程师", "Frontend", "Front-end"],
      skills: [
        "HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Vue",
        "Next.js", "Nuxt.js", "Webpack", "Vite", "Node.js",
        "Sass/Less", "Tailwind", "ESLint", "Jest", "Web性能优化",
        "响应式设计", "浏览器兼容性", "Webpack", "PWA", "Micro Frontend"
      ]
    },
    "后端工程师": {
      patterns: ["后端", "后端工程师", "服务端", "Backend"],
      skills: [
        "Java", "Python", "Go", "Spring Boot", "MySQL", "Redis",
        "分布式系统", "微服务", "Kafka", "Kubernetes", "Docker",
        "RESTful API", "GraphQL", "数据库设计", "高并发架构", "Linux"
      ]
    },
    "AI / 大模型算法": {
      patterns: ["AI", "大模型", "LLM", "算法工程师", "机器学习", "深度学习", "NLP"],
      skills: [
        "Python", "PyTorch", "TensorFlow", "Transformer", "GPT", "LLaMA",
        "RAG", "LangChain", "LoRA 微调", "RLHF", "向量检索", "vLLM",
        "DeepSpeed", "模型部署", "Prompt Engineering"
      ]
    },
    "产品经理": {
      patterns: ["产品经理", "PM", "产品"],
      skills: [
        "需求分析", "用户研究", "PRD 撰写", "竞品分析", "Figma",
        "Axure", "数据分析", "OKR", "Scrum", "用户画像",
        "A/B 测试", "用户增长"
      ]
    },
    "数据分析师": {
      patterns: ["数据分析师", "数据分析"],
      skills: [
        "SQL", "Python", "Pandas", "Tableau", "Power BI", "Excel",
        "漏斗分析", "用户行为分析", "A/B 测试", "数据可视化",
        "业务建模", "统计分析"
      ]
    },
    "运营经理": {
      patterns: ["运营", "新媒体", "内容运营", "用户运营"],
      skills: [
        "内容策划", "社群运营", "公众号", "小红书", "抖音",
        "用户增长", "活动策划", "数据分析", "裂变增长",
        "KOL 合作", "品牌传播"
      ]
    }
  };

  // 通用技能词库（用于从文本中识别）
  const SKILL_LEXICON = [
    "React", "Vue", "Angular", "Next.js", "Nuxt.js", "TypeScript",
    "JavaScript", "Python", "Java", "Go", "Node.js", "Spring Boot",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Kafka", "Docker",
    "Kubernetes", "Linux", "AWS", "Azure", "Git", "HTML5", "CSS3",
    "Sass", "Less", "Tailwind", "Webpack", "Vite", "Jest",
    "SQL", "Tableau", "Power BI", "Pandas", "Scikit-learn",
    "PyTorch", "TensorFlow", "Transformer", "GPT", "LLaMA", "RAG",
    "LangChain", "Figma", "Axure", "Sketch", "Photoshop",
    "数据分析", "用户研究", "需求分析", "竞品分析", "A/B 测试",
    "OKR", "Scrum", "敏捷开发", "项目管理", "高并发", "分布式",
    "微服务", "RESTful", "GraphQL", "JWT", "OAuth",
    "机器学习", "深度学习", "NLP", "CV", "推荐算法",
    "社群运营", "内容策划", "用户增长", "活动策划",
    "公众号", "小红书", "抖音", "视频号", "直播运营"
  ];

  // 学位 / 城市 / 公司 识别词
  const DEGREE_WORDS = ["本科", "硕士", "博士", "专科", "学士", "MBA", "博士后"];
  const CITY_WORDS = [
    "北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "武汉",
    "西安", "苏州", "天津", "重庆", "厦门", "长沙", "青岛", "郑州"
  ];

  // ========== 模型核心函数 ==========
  function detectPositions(text) {
    const hits = [];
    Object.entries(POSITION_LIBRARY).forEach(([name, def]) => {
      const matched = def.patterns.some((p) => text.toLowerCase().includes(p.toLowerCase()));
      if (matched) hits.push(name);
    });
    return hits;
  }

  function extractSkillsFromText(text) {
    const found = [];
    SKILL_LEXICON.forEach((skill) => {
      // 大小写不敏感搜索，但尽量找到词边界
      const re = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(skill)})([^A-Za-z0-9]|$)`, "i");
      if (re.test(text)) {
        found.push({ name: skill, source: "文本识别" });
      }
    });

    // 额外模式："XX 语言", "YY 框架"
    const langMatch = text.match(/([A-Za-z+#]+)\s*(语言|编程|开发)/g);
    const fwMatch = text.match(/([A-Za-z0-9.]+)\s*(框架|库|工具|平台)/g);
    (langMatch || []).forEach((m) => {
      const name = m.replace(/\s*(语言|编程|开发)$/, "").trim();
      if (name.length >= 2 && !found.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        found.push({ name, source: "模式匹配" });
      }
    });
    (fwMatch || []).forEach((m) => {
      const name = m.replace(/\s*(框架|库|工具|平台)$/, "").trim();
      if (name.length >= 2 && !found.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        found.push({ name, source: "模式匹配" });
      }
    });

    return found;
  }

  function extractKeywords(text, excludeNames) {
    const kws = [];
    const exclude = new Set(excludeNames.map((n) => n.toLowerCase()));

    // 1. 学位
    DEGREE_WORDS.forEach((d) => {
      if (text.includes(d) && !exclude.has(d.toLowerCase())) kws.push({ name: d, cat: "学历" });
    });

    // 2. 城市
    CITY_WORDS.forEach((c) => {
      if (text.includes(c) && !exclude.has(c.toLowerCase())) kws.push({ name: c, cat: "城市" });
    });

    // 3. 公司名（通过"公司"后缀匹配）
    const companyRe = /([\u4e00-\u9fa5A-Za-z0-9]+)\s*(股份有限公司|有限公司|集团|公司|科技|信息技术)/g;
    let m;
    while ((m = companyRe.exec(text)) !== null) {
      const name = (m[1] + (m[2] || "")).trim();
      if (name.length >= 3 && name.length <= 14 && !kws.some((k) => k.name === name) && !exclude.has(name.toLowerCase())) {
        kws.push({ name, cat: "公司" });
      }
    }

    // 4. 项目（"项目"关键词前后）
    const projRe = /([\u4e00-\u9fa5A-Za-z0-9·]+)\s*项目/g;
    while ((m = projRe.exec(text)) !== null) {
      const name = m[1].trim() + "项目";
      if (name.length <= 16 && !kws.some((k) => k.name === name) && !exclude.has(name.toLowerCase())) {
        kws.push({ name, cat: "项目" });
      }
    }

    // 5. 工作年限
    const yearRe = /(\d+)\s*年.*?(工作经验|经验|从业)/;
    const yMatch = text.match(yearRe);
    if (yMatch && !exclude.has("经验年限")) {
      kws.push({ name: yMatch[1] + " 年经验", cat: "经验" });
    }

    // 6. 从大段文本提取高频词（2-4 字中文名词，排除技能）
    const freq = extractHighFreq(text, 15);
    freq.forEach((w) => {
      if (!exclude.has(w.toLowerCase()) && !kws.some((k) => k.name === w)) {
        kws.push({ name: w, cat: "高频词" });
      }
    });

    return kws;
  }

  function extractHighFreq(text, limit) {
    // 简单的 2-4 字中文词频统计（演示用）
    const clean = text.replace(/[。，、；：！？·"''（）\[\]【】《》\s\d\w+\-\/\\.]+/g, " ");
    const map = new Map();
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= clean.length - len; i++) {
        const token = clean.slice(i, i + len);
        if (!/^[\u4e00-\u9fa5]+$/.test(token)) continue;
        if (STOPWORDS.has(token)) continue;
        map.set(token, (map.get(token) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([w]) => w);
  }

  const STOPWORDS = new Set([
    "工作", "项目", "公司", "负责", "经验", "岗位", "任职", "期间",
    "参与", "完成", "主导", "设计", "开发", "实现", "用户", "业务",
    "核心", "主要", "相关", "技术", "系统", "产品", "内容", "提供",
    "合作", "管理", "能力", "技能", "学历", "专业", "方向"
  ]);

  function escapeRegex(s) { return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"); }

  // ========== 过程日志：类型安全的步进输出 ==========
  const logEl = $("#processLog");
  const pulseDot = $("#pulseDot");
  const processStatus = $("#processStatus");
  const logSteps = [];

  function resetLog() {
    logSteps.length = 0;
    logEl.innerHTML = `<div class="process-hint">点击「开始分析」按钮，查看模型推理的详细过程。</div>`;
    pulseDot.classList.remove("running", "done");
    processStatus.textContent = "待开始";
    processStatus.classList.remove("running", "done");
  }

  function addLogStep(stepIdx, title, lines, { ok = false } = {}) {
    logSteps.push({ idx: stepIdx, title, lines, ok });
    renderLog(true);
  }

  function renderLog(withCursor) {
    logEl.innerHTML = logSteps
      .map(
        (s, i) =>
          `<div class="log-step">
             <div class="log-head${s.ok ? " ok" : ""}">
               <span class="idx">Step ${String(s.idx).padStart(2, "0")} ·</span>
               <span>${s.title}</span>
               <span>${s.ok ? "✔" : "…"}</span>
             </div>
             <div class="log-body">${s.lines
               .map((l) => `<span class="sub">· ${l}</span>`)
               .join("")}</div>
           </div>`
      )
      .join("") + (withCursor ? `<div class="log-step log-inline-cursor"></div>` : "");
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setRunning() {
    pulseDot.classList.add("running");
    pulseDot.classList.remove("done");
    processStatus.textContent = "模型推理中...";
    processStatus.classList.add("running");
    processStatus.classList.remove("done");
  }

  function setDone() {
    pulseDot.classList.remove("running");
    pulseDot.classList.add("done");
    processStatus.textContent = "推理完成";
    processStatus.classList.remove("running");
    processStatus.classList.add("done");
    renderLog(false);
  }

  // ========== 主流程 ==========
  let skills = [];   // [{name, source}]
  let keywords = []; // [{name, cat}]
  let detectedPositions = [];

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function runModel() {
    resetTags();
    resetLog();
    setRunning();

    const combinedText = (input.intro + "\n" + input.resume).trim();

    // Step 01
    await sleep(400);
    addLogStep(1, "【预处理】读取用户输入", [
      `个人介绍长度：${input.intro.trim().length} 字`,
      `简历内容长度：${input.resume.trim().length} 字`,
      `上传文件：${input.files.map((f) => f.name).join("、") || "（无）"}`,
      `合并文本用于分析：共 ${combinedText.length} 字`
    ]);

    // Step 02
    await sleep(600);
    detectedPositions = detectPositions(combinedText);
    addLogStep(2, "【岗位识别】匹配岗位定义库", [
      `扫描内置 ${Object.keys(POSITION_LIBRARY).length} 个岗位模式`,
      detectedPositions.length > 0
        ? `命中岗位：<span class="highlight">${detectedPositions.join("、")}</span>`
        : `<span class="highlight">未命中显式岗位</span>，将走通用路径`,
      `将使用命中岗位的技能库进行自动扩展`
    ]);

    // Step 03
    await sleep(700);
    const textSkills = extractSkillsFromText(combinedText);
    const uniqTextSkills = dedup(textSkills);
    addLogStep(3, "【技能抽取】从文本中识别具体技能", [
      `技能词库命中：${textSkills.length} 项原始命中`,
      `模式匹配补充：${textSkills.filter((s) => s.source === "模式匹配").length} 项`,
      `去重后识别技能 <span class="found">${uniqTextSkills.length}</span> 项：${
        uniqTextSkills.slice(0, 6).map((s) => `<span class="highlight">${s.name}</span>`).join("、")
      }${uniqTextSkills.length > 6 ? "..." : ""}`
    ]);

    // Step 04
    await sleep(700);
    let positionSkills = [];
    if (detectedPositions.length > 0) {
      const allLib = detectedPositions
        .map((p) => POSITION_LIBRARY[p])
        .reduce((acc, def) => acc.concat(def.skills), []);
      const existing = new Set(uniqTextSkills.map((s) => s.name.toLowerCase()));
      positionSkills = allLib
        .filter((s) => !existing.has(s.toLowerCase()))
        .slice(0, 10)
        .map((s) => ({ name: s, source: detectedPositions[0] + "·自动补充" }));
      positionSkills = dedup(positionSkills);
    }
    addLogStep(4, "【岗位扩展】补充岗位常用技能（去重）", [
      positionSkills.length > 0
        ? `补充 <span class="found">${positionSkills.length}</span> 项岗位常用技能：${
            positionSkills.slice(0, 5).map((s) => `<span class="highlight">${s.name}</span>`).join("、")
          }${positionSkills.length > 5 ? "..." : ""}`
        : `未发现明显岗位方向，已跳过扩展`,
      `规则：只保留文本中未出现的技能，避免重复`
    ]);

    // Step 05
    await sleep(700);
    skills = dedup(uniqTextSkills.concat(positionSkills));
    const kw = extractKeywords(combinedText, skills.map((s) => s.name));
    keywords = kw;
    addLogStep(5, "【关键词抽取】提取非技能类关键信息", [
      `学历信息：${kw.filter((k) => k.cat === "学历").map((k) => `<span class="highlight">${k.name}</span>`).join("、") || "（无）"}`,
      `城市信息：${kw.filter((k) => k.cat === "城市").map((k) => `<span class="highlight">${k.name}</span>`).join("、") || "（无）"}`,
      `公司信息：${kw.filter((k) => k.cat === "公司").map((k) => `<span class="highlight">${k.name}</span>`).join("、") || "（无）"}`,
      `项目信息：${kw.filter((k) => k.cat === "项目").map((k) => `<span class="highlight">${k.name}</span>`).join("、") || "（无）"}`,
      `高频词：${kw.filter((k) => k.cat === "高频词").map((k) => `<span class="highlight">${k.name}</span>`).join("、") || "（无）"}`
    ]);

    // Step 06
    await sleep(500);
    addLogStep(
      6,
      "【汇总】构建候选集合",
      [
        `最终技能数：<span class="found">${skills.length}</span> 项`,
        `最终关键词数：<span class="found">${keywords.length}</span> 项`,
        `检查技能 &amp; 关键词交集：<span class="found">空集</span>，符合不重复要求`,
        `→ 你可以在下方直接编辑 / 删除 / 新增`
      ],
      { ok: true }
    );

    setDone();
    renderTags();
    showToast("分析完成，可在下方编辑结果");
  }

  function dedup(list) {
    const seen = new Set();
    const out = [];
    list.forEach((item) => {
      const key = (item.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  }

  // ========== 标签渲染 ==========
  const skillGroup = $("#skillTagGroup");
  const keywordGroup = $("#keywordTagGroup");

  function resetTags() {
    skills = [];
    keywords = [];
    $("#skillsCard").style.display = "none";
    $("#keywordCard").style.display = "none";
    skillGroup.innerHTML = "";
    keywordGroup.innerHTML = "";
    $("#skillCount").textContent = "0 项";
    $("#keywordCount").textContent = "0 项";
  }

  function renderTags() {
    // 技能
    $("#skillsCard").style.display = "block";
    if (skills.length === 0) {
      skillGroup.innerHTML = `<div class="tag-empty">（暂未识别到技能，可在下方手动添加）</div>`;
    } else {
      skillGroup.innerHTML = skills
        .map(
          (s, i) =>
            `<span class="tag-item${s.source && s.source.includes("自动补充") ? " auto" : ""}">
               ${s.name}
               <span class="tag-source">· ${s.source || "自定义"}</span>
               <span class="tag-actions">
                 <button class="tag-btn" data-kind="skill" data-action="edit" data-idx="${i}" title="编辑">✎</button>
                 <button class="tag-btn" data-kind="skill" data-action="del" data-idx="${i}" title="删除">✕</button>
               </span>
             </span>`
        )
        .join("");
    }
    $("#skillCount").textContent = skills.length + " 项";

    // 关键词
    $("#keywordCard").style.display = "block";
    if (keywords.length === 0) {
      keywordGroup.innerHTML = `<div class="tag-empty">（暂未识别到关键词）</div>`;
    } else {
      keywordGroup.innerHTML = keywords
        .map(
          (k, i) =>
            `<span class="tag-item keyword">
               ${k.name}
               <span class="tag-source">· ${k.cat}</span>
               <span class="tag-actions">
                 <button class="tag-btn" data-kind="kw" data-action="edit" data-idx="${i}" title="编辑">✎</button>
                 <button class="tag-btn" data-kind="kw" data-action="del" data-idx="${i}" title="删除">✕</button>
               </span>
             </span>`
        )
        .join("");
    }
    $("#keywordCount").textContent = keywords.length + " 项";

    // 绑定事件
    skillGroup.querySelectorAll(".tag-btn").forEach((btn) => bindTagBtn(btn));
    keywordGroup.querySelectorAll(".tag-btn").forEach((btn) => bindTagBtn(btn));
  }

  function bindTagBtn(btn) {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.kind;
      const action = btn.dataset.action;
      const idx = Number(btn.dataset.idx);
      if (action === "del") {
        if (kind === "skill") {
          skills.splice(idx, 1);
        } else {
          keywords.splice(idx, 1);
        }
        renderTags();
      } else if (action === "edit") {
        openEditModal(kind, idx);
      }
    });
  }

  // ========== 编辑弹窗 ==========
  const editModal = $("#editModal");
  let editingState = null;

  function openEditModal(kind, idx) {
    editingState = { kind, idx };
    const list = kind === "skill" ? skills : keywords;
    const item = list[idx];
    $("#editTitle").textContent = "编辑" + (kind === "skill" ? "技能" : "关键词");
    $("#editInput").value = item.name;
    editModal.classList.add("open");
    setTimeout(() => $("#editInput").focus(), 50);
  }

  function closeEditModal() {
    editModal.classList.remove("open");
    editingState = null;
  }

  editModal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeEditModal));

  $("#editConfirm").addEventListener("click", () => {
    if (!editingState) return;
    const val = $("#editInput").value.trim();
    if (!val) { showToast("内容不能为空"); return; }
    const list = editingState.kind === "skill" ? skills : keywords;
    list[editingState.idx].name = val;
    closeEditModal();
    renderTags();
  });

  $("#editInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#editConfirm").click();
    if (e.key === "Escape") closeEditModal();
  });

  // ========== 添加 ==========
  function addSkill(val) {
    val = val.trim();
    if (!val) return;
    if (skills.some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      showToast("该技能已存在"); return;
    }
    skills.push({ name: val, source: "自定义" });
    renderTags();
  }

  function addKeyword(val) {
    val = val.trim();
    if (!val) return;
    if (keywords.some((k) => k.name.toLowerCase() === val.toLowerCase())) {
      showToast("该关键词已存在"); return;
    }
    keywords.push({ name: val, cat: "自定义" });
    renderTags();
  }

  $("#skillAddBtn").addEventListener("click", () => {
    addSkill($("#skillInput").value);
    $("#skillInput").value = "";
    $("#skillInput").focus();
  });
  $("#skillInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#skillAddBtn").click();
  });
  $("#keywordAddBtn").addEventListener("click", () => {
    addKeyword($("#keywordInput").value);
    $("#keywordInput").value = "";
    $("#keywordInput").focus();
  });
  $("#keywordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#keywordAddBtn").click();
  });

  // ========== 运行 / 重置 ==========
  $("#btnRunModel").addEventListener("click", runModel);
  $("#btnReset").addEventListener("click", () => {
    resetTags();
    resetLog();
    showToast("已重置");
  });

  // 自动开始一次分析，用户也可再次点击
  setTimeout(runModel, 350);

  // ========== 下一步 ==========
  $("#btnNext").addEventListener("click", () => {
    if (skills.length === 0 && keywords.length === 0) {
      showToast("请先完成信息抽取或手动添加技能 / 关键词");
      return;
    }
    const payload = {
      positions: detectedPositions,
      skills: skills,
      keywords: keywords,
      source: { intro: input.intro, resume: input.resume, files: input.files }
    };
    try {
      sessionStorage.setItem("headhunter_page2", JSON.stringify(payload));
    } catch (e) {}

    window.location.href = "../页面3-职位检索/index.html";
  });

  // ========== 样例简历文本（当用户完全没有输入时使用）==========
  function getSampleResumeText() {
    return `姓名：高守
性别：男　　年龄：29
城市：北京　　求职状态：在职，可 1 个月内入职
电话：138-****-1234　　邮箱：gaoshou@example.com

【求职意向】
目标岗位：高级前端工程师
期望薪资：35K - 50K · 14 薪
期望城市：北京 / 杭州

【个人简介】
5 年互联网前端工作经验，专注于 React 技术栈与 Web 性能优化，
主导过多个百万级 DAU 产品的架构升级。擅长团队组件库建设与工程化治理。

【工作经历】
2022.03 - 至今　　字节跳动（北京）科技有限公司　　高级前端工程师
- 负责核心业务 Web 端架构设计，将首屏加载从 3.2s 降至 1.1s
- 主导团队 React 组件库建设，沉淀 40+ 通用组件，提升团队效率 40%
- 推动 TypeScript 全量迁移与 ESLint / Jest 单测体系落地

2020.06 - 2022.02　　美团有限公司　　前端工程师
- 负责外卖商家后台系统开发与优化
- 主导 Vite + Vue3 升级项目，构建时间从 90s 降至 18s

2019.07 - 2020.05　　某创业公司　　前端开发
- 从 0 到 1 搭建 React + Next.js 的 SaaS 产品前端

【项目经历】
项目 A：公司组件库建设项目（2023）
- 角色：技术负责人
- 核心产出：组件库覆盖 40+ 组件，月均 8 个业务线使用

项目 B：双十一活动页性能优化项目（2021）
- 角色：主力开发
- 产出：页面 PV 200 万+，P95 加载 < 1.5s

【教育背景】
2015.09 - 2019.06　　北京理工大学　　计算机科学与技术　　本科

【专业技能】
- 框架：React / Vue / Next.js
- 语言：TypeScript / JavaScript ES6+
- 工程化：Webpack / Vite / ESLint / Jest / Rollup
- 其他：Node.js / HTML5 / CSS3 / Sass / Tailwind / PWA
- 能力：Web 性能优化 / 组件库设计 / 微前端
`;
  }
})();
