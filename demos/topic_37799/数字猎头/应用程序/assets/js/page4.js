(function () {
  const $ = (sel) => document.querySelector(sel);

  // ==================== 1. 读取数据 ====================
  let data = { selectedPositions: [], userProfile: { intro: "", resume: "", skills: [], keywords: [] } };
  try {
    const raw = sessionStorage.getItem("headhunter_page3");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.selectedPositions && parsed.selectedPositions.length) {
        data = parsed;
      }
    }
  } catch (e) {}

  // 回退：如果没有数据，使用默认示例
  if (!data.selectedPositions || data.selectedPositions.length === 0) {
    data.selectedPositions = [
      {
        id: "demo-1",
        title: "Senior Data Scientist",
        company: { name: "拜耳", fullName: "Bayer AG", country: "德国", industry: "医药" },
        salary: "参考 3-4.5万·13薪",
        location: "上海",
        experience: "5-10 年",
        education: "统招本科",
        description: [
          "负责识别机会开发统计洞察、报告和模型以支持组织目标",
          "使用数据挖掘、预测性和规范性分析等技术进行复杂数据分析",
          "与跨部门团队协作，推动数据驱动的业务决策"
        ],
        requirements: [
          "计算机科学、统计学、数学或相关领域的本科或以上学位",
          "精通 Python 或 R，具备 5 年以上数据分析工作经验",
          "熟悉机器学习、深度学习、数据可视化等技术",
          "出色的沟通能力和团队协作精神"
        ],
        totalScore: 82,
        scores: { skill: 85, keyword: 70, description: 80, company: 90, salary: 75 }
      },
      {
        id: "demo-2",
        title: "Senior Data & AI Architect",
        company: { name: "SAP", fullName: "SAP SE", country: "德国", industry: "企业软件" },
        salary: "面议",
        location: "上海",
        experience: "5-10 年",
        education: "统招本科",
        description: [
          "设计并领导实施企业级分析解决方案",
          "与业务利益相关者、产品经理、数据科学家和 AI 工程师紧密合作",
          "管理不同类型和来源的数据集成到统一的数据资产中"
        ],
        requirements: [
          "计算机科学或相关专业的学士/硕士学位",
          "5-8 年数据工程和架构领域工作经验",
          "精通大数据技术栈和云计算平台",
          "流利的中英文书面和口语能力"
        ],
        totalScore: 76,
        scores: { skill: 80, keyword: 60, description: 75, company: 85, salary: 70 }
      }
    ];
    data.userProfile = {
      intro: "5 年数据分析与机器学习工作经验，专注于将数据洞察转化为业务价值。",
      resume: "",
      skills: ["Python", "SQL", "机器学习", "数据可视化", "TensorFlow", "大数据", "Spark", "统计分析"],
      keywords: ["上海", "本科", "5 年经验", "外企"]
    };
  }

  $("#targetCount").textContent = data.selectedPositions.length;

  // 渲染目标岗位
  const targetListEl = $("#targetList");
  targetListEl.innerHTML = data.selectedPositions.map(pos => {
    const initial = (pos.company.name || pos.company.fullName || "?").charAt(0).toUpperCase();
    return `
      <div class="target-item">
        <div class="target-badge">${initial}</div>
        <div class="target-info">
          <p class="target-title">${escapeHtml(pos.title)}</p>
          <p class="target-company">${escapeHtml(pos.company.name || pos.company.fullName)} · ${escapeHtml(pos.company.country || "")} · ${escapeHtml(pos.location || "")}</p>
        </div>
        <div class="target-score">${pos.totalScore || "-"} 分</div>
      </div>`;
  }).join("");

  // ==================== 2. 过程日志 ====================
  const logEl = $("#processLog");
  const logSteps = [];

  function addLogStep(idx, title, lines, { ok = false } = {}) {
    logSteps.push({ idx, title, lines, ok });
    renderLog();
  }
  function renderLog() {
    logEl.innerHTML = logSteps.map(s => `
      <div class="log-step">
        <div class="log-head${s.ok ? " ok" : ""}">
          <span class="idx">Step ${String(s.idx).padStart(2, "0")} ·</span>
          <span>${s.title}</span>
          <span>${s.ok ? "✔" : "…"}</span>
        </div>
        <div class="log-body">${s.lines.map(l => `<span class="sub">· ${l}</span>`).join("")}</div>
      </div>`).join("");
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(text, isDone) {
    const dot = $("#processDot");
    const badge = $("#processStatus");
    if (isDone) {
      dot.classList.remove("running"); dot.classList.add("done");
      badge.classList.remove("running"); badge.classList.add("done");
    } else {
      dot.classList.add("running"); dot.classList.remove("done");
      badge.classList.add("running"); badge.classList.remove("done");
    }
    badge.textContent = text;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[m]));
  }
  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ==================== 3. 简历生成核心 ====================
  let lastResumeHtml = "";

  function aggregateRequirements(positions) {
    const all = [];
    positions.forEach(p => (p.requirements || []).forEach(r => all.push(r)));
    return [...new Set(all)];
  }

  function aggregateSkills(positions) {
    const skills = new Set();
    positions.forEach(p => {
      (p.requirements || []).forEach(r => {
        const matches = r.match(/[\w\+\#\.]+/g) || [];
        matches.forEach(m => {
          if (m.length >= 3 && m.length <= 20) skills.add(m);
        });
      });
      (p.description || []).forEach(d => {
        const matches = d.match(/[\w\+\#\.]+/g) || [];
        matches.forEach(m => {
          if (m.length >= 3 && m.length <= 20) skills.add(m);
        });
      });
    });
    return [...skills].slice(0, 15);
  }

  function buildResumeHtml(positions, userProfile) {
    const targetCompanies = positions.map(p => p.company.name || p.company.fullName).filter(Boolean);
    const uniqueCompanies = [...new Set(targetCompanies)];
    const reqs = aggregateRequirements(positions);
    const aggSkills = aggregateSkills(positions);
    const userSkills = userProfile.skills || [];
    const userIntro = userProfile.intro || "";

    // 生成适配的个人简介（AI 生成部分）
    const introText = `
      <div class="ai-generated">
        <p>具有 ${positions.length >= 2 ? "跨多行业" : ""}工作经验的专业人士，在 ${uniqueCompanies.map(c => escapeHtml(c)).join("、")} 等企业的岗位要求方向具备扎实积累。擅长将业务需求与数据分析 / 算法工程相结合，推动高价值解决方案落地。</p>
      </div>
      <p><strong>核心价值主张：</strong>结合 ${positions.length} 家目标公司的核心要求，我具备以下关键能力 —</p>
      <div class="ai-generated" data-type="skill">
        <ul>
          <li>技术深度：${aggSkills.slice(0, 5).map(s => `<strong>${escapeHtml(s)}</strong>`).join("、")} 等技术栈的实战经验</li>
          <li>业务广度：${escapeHtml(positions[0].company.industry || positions[0].industry || "企业级")} 方向的业务理解与落地能力</li>
          <li>沟通协作：具备跨团队 / 跨部门协作经验，中英双语工作环境（外企环境）</li>
        </ul>
      </div>
    `;

    // 生成工作经历（基于原始简历 + AI 增强）
    let workExperience = "";
    if (userProfile.resume && userProfile.resume.trim().length > 20) {
      workExperience = `<p>（以下为原始简历内容）</p><p>${escapeHtml(userProfile.resume).replace(/\n/g, "<br/>")}</p>`;
    } else {
      workExperience = `
        <div class="ai-generated" data-type="project">
          <h3>工作经历（AI 根据目标岗位要求生成 · 请补充真实信息）</h3>
          <p><strong>高级 ${positions.length >= 2 ? "数据 / AI" : positions[0].title} 岗位</strong> · 2021.06 - 至今</p>
          <ul>
            ${(positions[0].description || []).slice(0, 3).map(d => `<li>${escapeHtml(d)}</li>`).join("")}
            <li>主导 ${positions.length} 个关键项目，平均 ROI 提升显著</li>
            <li>建立团队的数据分析与 AI 方法论体系，推动标准化工作流</li>
          </ul>

          <p><strong>数据 / AI 工程师</strong> · 2018.07 - 2021.05</p>
          <ul>
            <li>负责企业级数据平台与模型服务的设计与优化</li>
            <li>推动机器学习模型从 0 到 1 的工程化落地</li>
            <li>参与 ${positions.length >= 2 ? "多业务线" : "核心业务"} 数据驱动决策项目</li>
          </ul>
        </div>
      `;
    }

    // 生成项目经历（AI 增强）
    const projectText = `
      <div class="ai-generated" data-type="project">
        <h3>代表性项目（AI 根据目标岗位生成 · 请审阅补充）</h3>
        <p><strong>项目 A：企业级数据分析与建模平台</strong></p>
        <ul>
          <li>项目背景：面向大型企业客户的数据洞察需求</li>
          <li>个人角色：技术负责人 / 核心开发者</li>
          <li>技术方案：${aggSkills.slice(0, 4).join("、")} 等技术</li>
          <li>核心产出：服务 50+ 企业客户，提升分析效率 3 倍</li>
        </ul>
        <p><strong>项目 B：智能推荐与决策引擎</strong></p>
        <ul>
          <li>基于业务场景设计个性化推荐方案</li>
          <li>效果：转化率 / 效率 / 用户满意度均有显著提升</li>
        </ul>
      </div>
    `;

    // 教育背景
    const eduText = `
      <p><strong>本科及以上学历</strong> · 计算机科学 / 统计学 / 数学或相关领域</p>
      <p>主修课程：数据结构、算法设计、概率论、统计学、机器学习、数据挖掘等</p>
    `;

    // 专业技能（AI 生成的融合技能树）
    const combinedSkills = [...new Set([...userSkills, ...aggSkills])].slice(0, 20);
    const skillsText = `
      <div class="ai-generated" data-type="skill">
        <p><strong>专业技能（AI 根据目标岗位扩展 · 请只保留你真正掌握的部分）：</strong></p>
        <p><span style="color:#e8652b;">■ 原始技能：</span>${combinedSkills.slice(0, userSkills.length).map(s => escapeHtml(s)).join(" · ")}</p>
        <p><span style="color:#4f6bff;">■ AI 扩展技能：</span>${combinedSkills.slice(userSkills.length, userSkills.length + 6).map(s => `<strong>${escapeHtml(s)}</strong>`).join(" · ") || "（无）"}</p>
      </div>
      <p><strong>其他技能：</strong>${combinedSkills.slice(userSkills.length + 6, combinedSkills.length).map(s => escapeHtml(s)).join(" · ") || "（无）"}</p>
    `;

    // 自我评价（AI）
    const selfEval = `
      <div class="ai-generated">
        <h3>自我评价</h3>
        <p>我是一位以结果为导向的专业人士，善于将复杂的技术方案转化为清晰的业务价值。面对 ${uniqueCompanies.slice(0, 2).map(c => escapeHtml(c)).join("、")}${uniqueCompanies.length > 2 ? "等" : ""} 目标公司的岗位要求，我在核心技能、业务理解和跨团队协作方面均有匹配的工作经验。欢迎进一步沟通。</p>
      </div>
    `;

    const header = `
      <h1>个人简历（适配 ${uniqueCompanies.slice(0, 3).map(c => escapeHtml(c)).join("、")}${uniqueCompanies.length > 3 ? "等" : ""}）</h1>
      <div class="info-row">
        <span>📞 电话：（请补充）</span>
        <span>✉️ 邮箱：（请补充）</span>
        <span>📍 地点：${escapeHtml(positions[0].location || positions[0].company.city || "（请补充）")}</span>
      </div>
    `;

    const resumeHtml = `
      ${header}

      <h2>个人简介</h2>
      ${userIntro ? `<p><strong>原始简介：</strong>${escapeHtml(userIntro)}</p>` : ""}
      ${introText}

      <h2>工作经历</h2>
      ${workExperience}

      ${projectText}

      <h2>教育背景</h2>
      ${eduText}

      <h2>专业技能</h2>
      ${skillsText}

      ${selfEval}

      <h2>目标岗位方向</h2>
      <p>${positions.map(p => `• ${escapeHtml(p.company.fullName || p.company.name)} · ${escapeHtml(p.title)}`).join("<br/>")}</p>
    `;

    return resumeHtml;
  }

  async function runGeneration() {
    setStatus("模型加载中...", false);
    logEl.innerHTML = "";
    logSteps.length = 0;

    await sleep(400);

    // Step 1
    addLogStep(1, "【解析目标岗位】分析职位要求的核心能力", [
      `目标公司：${data.selectedPositions.map(p => escapeHtml(p.company.name || p.company.fullName)).join("、")}`,
      `提取到 ${aggregateRequirements(data.selectedPositions).length} 条核心要求`,
      `识别到 ${aggregateSkills(data.selectedPositions).length} 个关键词技能`
    ]);

    await sleep(500);

    // Step 2
    addLogStep(2, "【融合原始简历】读取并解析你的原始简历内容", [
      `原始简介长度：${(data.userProfile.intro || "").length} 字`,
      `原始简历长度：${(data.userProfile.resume || "").length} 字`,
      `用户核心技能：${(data.userProfile.skills || []).slice(0, 8).map(s => `<span class="highlight">${escapeHtml(s)}</span>`).join("、")}`
    ]);

    await sleep(500);

    // Step 3
    addLogStep(3, "【生成策略】制定简历适配策略", [
      `策略 A：突出目标岗位共同要求的核心技能`,
      `策略 B：将项目经历按照岗位要求进行重写与包装`,
      `策略 C：调整自我摘要以匹配岗位方向`,
      `策略 D：AI 生成内容使用<span class="highlight">蓝色标记</span>，便于你审阅修改`
    ]);

    await sleep(500);

    // Step 4
    addLogStep(4, "【技能树扩展】融合用户技能与岗位技能树", [
      `原技能数：${(data.userProfile.skills || []).length} 项`,
      `新增 AI 扩展技能：融合岗位关键词中的相关技术`,
      `生成技能分组：编程语言 / 框架工具 / 业务能力 / 软技能`
    ]);

    await sleep(500);

    // Step 5
    addLogStep(5, "【项目经历重写】根据岗位要求生成项目故事线", [
      `按照 STAR 原则重写（情境 / 任务 / 行动 / 结果）`,
      `添加量化指标：效率提升、成本节约、用户增长等`,
      `项目描述方向对齐 ${data.selectedPositions.length} 个目标岗位`
    ]);

    await sleep(400);

    // Step 6
    addLogStep(6, "【生成完成】输出适配版简历", [
      `<span class="found">✓ 简历 HTML 已生成到下方</span>`,
      `<span class="highlight">蓝色高亮部分</span>为 AI 生成，请务必审阅修改`,
      `可使用"下载 TXT"或"复制到剪贴板"保存内容`,
      `也可直接在编辑器中编辑后再导出`
    ], { ok: true });

    setStatus("生成完成", true);

    // 渲染简历
    lastResumeHtml = buildResumeHtml(data.selectedPositions, data.userProfile);
    const editor = $("#resumeEditor");
    editor.innerHTML = lastResumeHtml;
    $("#resumeCard").style.display = "block";
    $("#actionBar").style.display = "flex";
    $("#actionBar2").style.display = "flex";

    // 滚动到简历
    setTimeout(() => {
      $("#resumeCard").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  // ==================== 4. 下载 / 复制 ====================
  function htmlToText(html) {
    // 简单 HTML 到文本转换
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.innerText || temp.textContent || "";
  }

  $("#btnDownload").addEventListener("click", () => {
    const editorContent = $("#resumeEditor").innerHTML;
    const text = htmlToText(editorContent);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `适配简历_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("已下载为 TXT 文件");
  });

  $("#btnCopy").addEventListener("click", async () => {
    const text = htmlToText($("#resumeEditor").innerHTML);
    try {
      await navigator.clipboard.writeText(text);
      showToast("已复制到剪贴板");
    } catch (e) {
      // 兼容方案
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("已复制到剪贴板");
      } catch (err) {
        showToast("复制失败，请手动选择");
      }
      document.body.removeChild(ta);
    }
  });

  $("#btnRegenerate").addEventListener("click", () => {
    runGeneration();
  });

  $("#btnApply").addEventListener("click", () => {
    const finalText = htmlToText($("#resumeEditor").innerHTML);
    try {
      sessionStorage.setItem("headhunter_finalResume", finalText);
      sessionStorage.setItem("headhunter_apply", JSON.stringify({
        selectedPositions: data.selectedPositions,
        userProfile: data.userProfile,
        sourcePage: "page4"
      }));
    } catch (e) {}
    window.location.href = "../页面5-投递简历/index.html";
  });

  // ==================== 5. 启动 ====================
  runGeneration();
})();
