/* ═══════════════════════════════════════════════════
   VibeX HTML Demo — app.js
   纯前端模拟数据 + 视图切换 + 接单交互
   ═══════════════════════════════════════════════════ */

// ─── 模拟数据 ────────────────────────────────────────

const ANALYSIS_DATA = {
  category: "AI客服Agent",
  summary: "用户希望建设「客服机器人」，需要将非技术描述转化为可交付的 AI 开发任务。",
  solution: "建议构建客服 AI Agent，将常见问题、订单状态和人工转接流程编排为自动化客服工作流。核心模块包括知识库搭建、对话引擎开发、工作流编排和系统集成。",
  skills: ["AI Agent", "客服机器人", "自动化工作流", "大模型API", "知识库"],
  budgetRange: "3000-10000",
  complexity: "中等",
  estimatedDuration: "2-4 周",
  blueprint: [
    { id: "KB", title: "知识库搭建", description: "整理 FAQ、产品信息、售后流程等客服知识" },
    { id: "DM", title: "对话引擎", description: "实现多轮对话理解、意图识别和上下文管理" },
    { id: "WF", title: "工作流编排", description: "编排自动回复、人工转接、订单查询等流程" },
    { id: "INT", title: "系统集成", description: "对接现有客服系统、CRM 和订单管理 API" }
  ],
  diagnosis: {
    industry: "电商 / 企业服务",
    coreGoal: "降低人工客服工作量，提升客户响应速度和满意度",
    currentProblem: "人工客服响应慢、成本高，高峰期排队严重，夜间无法提供服务",
    solutionType: "AI 客服 Agent（LLM + 知识库 + 工作流自动化）",
    involvedCapabilities: ["大语言模型", "多轮对话", "知识库", "工作流引擎", "API 集成"],
    difficulty: "中等"
  },
  tasks: [
    { id: "t1", taskName: "知识库搭建", description: "整理常见问题、产品信息、售后流程等客服知识", requiredSkill: "知识库", priority: "高" },
    { id: "t2", taskName: "对话引擎开发", description: "实现多轮对话理解、意图识别和上下文管理", requiredSkill: "Agent开发", priority: "高" },
    { id: "t3", taskName: "工作流编排", description: "编排自动回复、人工转接、订单查询等业务流程", requiredSkill: "自动化工作流", priority: "高" },
    { id: "t4", taskName: "系统集成", description: "对接现有客服系统、CRM 和订单管理 API", requiredSkill: "API开发", priority: "中" },
    { id: "t5", taskName: "上线与优化", description: "灰度发布、对话日志分析、回答准确率持续优化", requiredSkill: "Prompt工程", priority: "低" }
  ]
};

const BUILDERS = [
  {
    id: "b1",
    name: "林澈",
    headline: "企业知识库与 RAG 应用专家",
    bio: "专注大模型 RAG 架构与企业知识库系统，交付过多个客服 Agent 项目。",
    rating: 4.9,
    deliveryRate: 0.98,
    priceRange: "¥3000-8000",
    availableStatus: "available",
    skills: ["RAG", "文档解析", "向量检索", "大模型API", "客服Agent"]
  },
  {
    id: "b2",
    name: "沈予",
    headline: "AI Agent 工作流自动化工程师",
    bio: "擅长 LLM Agent 编排和多轮对话系统，有丰富客服自动化经验。",
    rating: 4.8,
    deliveryRate: 0.95,
    priceRange: "¥2500-6000",
    availableStatus: "available",
    skills: ["AI Agent", "自动化工作流", "大模型API", "Prompt工程"]
  },
  {
    id: "b3",
    name: "许诺",
    headline: "全栈 AI 应用开发者",
    bio: "从前端到后端到 AI 集成，一人交付完整 AI 应用。",
    rating: 4.7,
    deliveryRate: 0.92,
    priceRange: "¥2000-5000",
    availableStatus: "available",
    skills: ["Web开发", "大模型API", "API开发", "知识库"]
  }
];

const MATCHES = [
  { builderId: "b1", score: 96, reason: "林澈在企业知识库与 RAG 领域有丰富经验，技能标签命中 4/5，且有客服 Agent 交付案例，与本项目高度匹配。" },
  { builderId: "b2", score: 88, reason: "沈予擅长 AI Agent 工作流编排，对话引擎和工作流模块能直接复用其已有框架，交付速度快。" },
  { builderId: "b3", score: 72, reason: "许诺作为全栈开发者可以覆盖系统集成和 API 开发模块，但在 Agent 深度上略有不足。" }
];

// 接单状态
const appliedProjects = new Set();

// ─── 任务大厅模拟项目 ─────────────────────────────────

const MARKETPLACE_PROJECTS = [
  {
    id: "p1",
    title: "跨国电商企业级本地多模态知识库 Agent 搭建",
    description: "为跨境电商团队构建企业知识库 AI Agent，支持商品信息、售后流程、物流状态的智能问答，需对接现有 ERP 系统。",
    category: "AI知识库",
    budgetRange: "5000-15000",
    estimatedDuration: "3-5 周",
    complexity: "高",
    skills: ["RAG", "向量检索", "文档解析", "大模型API", "PostgreSQL"],
    matchScore: 96,
    publisher: "GlobalShop 科技",
    publisherInitial: "G",
    publishedAt: "2 小时前",
    proposals: 3,
    status: "matching"
  },
  {
    id: "p2",
    title: "AI 客服 Agent 悬赏任务",
    description: "构建客服 AI Agent，将常见问题、订单状态和人工转接流程编排为自动化客服工作流，降低人工客服工作量。",
    category: "AI客服Agent",
    budgetRange: "3000-10000",
    estimatedDuration: "2-4 周",
    complexity: "中等",
    skills: ["AI Agent", "客服机器人", "自动化工作流", "大模型API", "知识库"],
    matchScore: 92,
    publisher: "VibeX Demo",
    publisherInitial: "V",
    publishedAt: "刚刚",
    proposals: 2,
    status: "matching"
  },
  {
    id: "p3",
    title: "金融研报自动生成工作流",
    description: "搭建自动化研报生成流水线，从数据采集、指标计算到 LLM 撰写分析报告，支持定时任务和多模板输出。",
    category: "AI内容生成",
    budgetRange: "2000-8000",
    estimatedDuration: "1-2 周",
    complexity: "中等",
    skills: ["自动化工作流", "大模型API", "Prompt工程", "Python"],
    matchScore: 85,
    publisher: "量化基金 A",
    publisherInitial: "Q",
    publishedAt: "5 小时前",
    proposals: 5,
    status: "matching"
  },
  {
    id: "p4",
    title: "法律合同智能审查 AI 助手",
    description: "开发合同审查 Agent，支持条款风险识别、合规性检查和修改建议，需对接法律法规知识库。",
    category: "AI知识库",
    budgetRange: "8000-20000",
    estimatedDuration: "3-5 周",
    complexity: "高",
    skills: ["RAG", "向量检索", "文档解析", "大模型API", "法律NLP"],
    matchScore: 78,
    publisher: "法智科技",
    publisherInitial: "F",
    publishedAt: "1 天前",
    proposals: 4,
    status: "matching"
  },
  {
    id: "p5",
    title: "短视频脚本批量生成工具",
    description: "构建 AI 内容生成工作流，输入主题关键词自动生成短视频脚本、分镜描述和配音文案，支持多平台格式导出。",
    category: "AI内容生成",
    budgetRange: "1500-6000",
    estimatedDuration: "1-2 周",
    complexity: "低",
    skills: ["Prompt工程", "大模型API", "自动化工作流"],
    matchScore: 71,
    publisher: "MCN 机构",
    publisherInitial: "M",
    publishedAt: "3 小时前",
    proposals: 7,
    status: "matching"
  },
  {
    id: "p6",
    title: "企业内部 AI 办公助手开发",
    description: "搭建企业级 AI 办公平台，集成日程管理、邮件摘要、会议纪要和工作流审批，支持多部门权限管理。",
    category: "AI应用开发",
    budgetRange: "10000-30000",
    estimatedDuration: "4-6 周",
    complexity: "高",
    skills: ["Web开发", "大模型API", "API开发", "工作流引擎", "React"],
    matchScore: 65,
    publisher: "某大型企业",
    publisherInitial: "E",
    publishedAt: "2 天前",
    proposals: 6,
    status: "matching"
  }
];

const MARKETPLACE_CATEGORIES = ["全部", "AI客服Agent", "AI知识库", "AI内容生成", "AI应用开发"];

// ─── 工具函数 ────────────────────────────────────────

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function priorityClass(p) {
  if (p === "高") return "priority-high";
  if (p === "中") return "priority-mid";
  return "priority-low";
}

function priorityLabel(p) {
  if (p === "高") return "高优先级";
  if (p === "中") return "中优先级";
  return "低优先级";
}

function getBuilder(id) {
  return BUILDERS.find((b) => b.id === id);
}

// ─── 视图切换 ────────────────────────────────────────

function switchView(viewName) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  $("#view-" + viewName).classList.add("active");

  $$(".navbar__link").forEach((l) => l.classList.remove("active"));
  const activeLink = document.querySelector(`.navbar__link[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add("active");

  // 按需渲染
  if (viewName === "marketplace") renderMarketplace();
  if (viewName === "builder") renderBuilder();

  // 更新步骤指示器
  const stepMap = { copilot: 1, marketplace: 2, detail: 3, builder: 4 };
  const stepNum = stepMap[viewName];
  if (stepNum) {
    ["step1", "step2", "step3", "step4"].forEach((id, i) => {
      $("#" + id).classList.toggle("active", i < stepNum);
    });
  }
}

// ─── 渲染：AI 蓝图 ───────────────────────────────────

function renderDiagnosis() {
  const d = ANALYSIS_DATA.diagnosis;
  const caps = d.involvedCapabilities.map((c) => `<span class="badge badge--skill">${c}</span>`).join("");

  $("#diagnosis-container").innerHTML = `
    <div class="diagnosis-card">
      <p class="diagnosis-card__title">AI Requirement Diagnosis</p>
      <div class="diagnosis-row"><span class="diagnosis-row__label">行业</span><p class="diagnosis-row__value">${d.industry}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">核心目标</span><p class="diagnosis-row__value">${d.coreGoal}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">当前痛点</span><p class="diagnosis-row__value">${d.currentProblem}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">推荐方向</span><p class="diagnosis-row__value">${d.solutionType}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">需求等级</span><p class="diagnosis-row__value">${d.difficulty}</p></div>
      <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">${caps}</div>
    </div>
  `;
}

function renderBlueprint() {
  const a = ANALYSIS_DATA;
  const skills = a.skills.map((s) => `<span class="badge badge--cyan">${s}</span>`).join("");
  const nodes = a.blueprint.map((n) => `
    <div class="blueprint-node">
      <p class="blueprint-node__id">${n.id}</p>
      <p class="blueprint-node__title">${n.title}</p>
      <p class="blueprint-node__desc">${n.description}</p>
    </div>
  `).join("");

  const tasks = a.tasks.map((t, i) => `
    <div class="task-item">
      <span class="task-item__num">${String(i + 1).padStart(2, "0")}</span>
      <div style="flex: 1;">
        <span class="task-item__name">${t.taskName}</span>
        <span class="priority-tag ${priorityClass(t.priority)}">${priorityLabel(t.priority)}</span>
        <p class="task-item__desc">${t.description}</p>
      </div>
      <span class="badge badge--skill">${t.requiredSkill}</span>
    </div>
  `).join("");

  const matchesHtml = MATCHES.map((m) => {
    const b = getBuilder(m.builderId);
    return `
      <div class="builder-match">
        <div class="match-score">${m.score}%</div>
        <div style="flex: 1;">
          <p class="match-info__name">${b.name}</p>
          <p class="match-info__headline">${b.headline}</p>
          <p class="match-info__reason">${m.reason}</p>
        </div>
      </div>
    `;
  }).join("");

  $("#blueprint-empty").style.display = "none";
  $("#blueprint-content").style.display = "block";
  $("#blueprint-content").innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div>
        <p class="blueprint-section__title">AI Blueprint</p>
        <h2 style="font-size: 28px; font-weight: 700;">${a.category}</h2>
      </div>
      <span class="badge badge--purple">${a.complexity}复杂度</span>
    </div>
    <div class="blueprint-solution">${a.solution}</div>
    <div class="skills-row">${skills}</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <p class="metric-card__label">预算建议</p>
        <p class="metric-card__value metric-card__value--cyan">¥${a.budgetRange}</p>
      </div>
      <div class="metric-card">
        <p class="metric-card__label">开发周期</p>
        <p class="metric-card__value">${a.estimatedDuration}</p>
      </div>
      <div class="metric-card">
        <p class="metric-card__label">推荐 Builder</p>
        <p class="metric-card__value">${MATCHES.length} 位</p>
      </div>
    </div>
    <div style="margin-top: 24px;">
      <p class="blueprint-section__title">Technical Blueprint</p>
      <div class="blueprint-flow">${nodes}</div>
    </div>
    <div style="margin-top: 24px;">
      <p class="blueprint-section__title">Task Decomposition</p>
      <div class="task-list">${tasks}</div>
    </div>
    <div style="margin-top: 24px;">
      <p class="blueprint-section__title">Recommended Builders</p>
      ${matchesHtml}
    </div>
    <button class="btn btn--primary" style="width: 100%; margin-top: 20px;" id="btn-create-project">一键转化为悬赏任务</button>
  `;

  $("#btn-create-project").addEventListener("click", () => {
    renderDetail();
    switchView("detail");
    showToast("项目创建成功！已跳转至项目详情页");
  });
}

// ─── 渲染：项目详情 ──────────────────────────────────

function renderDetail() {
  const a = ANALYSIS_DATA;
  const d = a.diagnosis;
  const skills = a.skills.map((s) => `<span class="badge badge--cyan">${s}</span>`).join("");
  const nodes = a.blueprint.map((n) => `
    <div class="blueprint-node">
      <p class="blueprint-node__id">${n.id}</p>
      <p class="blueprint-node__title">${n.title}</p>
      <p class="blueprint-node__desc">${n.description}</p>
    </div>
  `).join("");

  const tasks = a.tasks.map((t, i) => `
    <div class="task-item">
      <span class="task-item__num">${String(i + 1).padStart(2, "0")}</span>
      <div style="flex: 1;">
        <span class="task-item__name">${t.taskName}</span>
        <span class="priority-tag ${priorityClass(t.priority)}">${priorityLabel(t.priority)}</span>
        <p class="task-item__desc">${t.description}</p>
      </div>
      <span class="badge badge--skill">${t.requiredSkill}</span>
    </div>
  `).join("");

  const caps = d.involvedCapabilities.map((c) => `<span class="badge badge--skill">${c}</span>`).join("");

  // 主区域
  $("#detail-main").innerHTML = `
    <div class="glass-card">
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <span class="badge badge--cyan">${a.category}</span>
        <span class="badge">matching</span>
      </div>
      <h1 style="margin-top: 16px; font-size: 36px; font-weight: 700;">AI 客服 Agent 悬赏任务</h1>
      <p style="margin-top: 12px; font-size: 15px; line-height: 1.7; color: var(--steelText);">我要做客服机器人</p>
    </div>

    <div class="diagnosis-card">
      <p class="diagnosis-card__title">AI Requirement Diagnosis</p>
      <div class="diagnosis-row"><span class="diagnosis-row__label">行业</span><p class="diagnosis-row__value">${d.industry}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">核心目标</span><p class="diagnosis-row__value">${d.coreGoal}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">当前痛点</span><p class="diagnosis-row__value">${d.currentProblem}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">推荐方向</span><p class="diagnosis-row__value">${d.solutionType}</p></div>
      <div class="diagnosis-row"><span class="diagnosis-row__label">需求等级</span><p class="diagnosis-row__value">${d.difficulty}</p></div>
      <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">${caps}</div>
    </div>

    <div class="glass-card">
      <p class="blueprint-section__title">AI Generated Specification</p>
      <h2 style="margin-top: 8px; font-size: 24px; font-weight: 700;">AI 生成方案</h2>
      <div class="blueprint-solution" style="margin-top: 16px;">${a.solution}</div>
      <div class="skills-row">${skills}</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <p class="metric-card__label">预算范围</p>
          <p class="metric-card__value metric-card__value--cyan">¥${a.budgetRange}</p>
        </div>
        <div class="metric-card">
          <p class="metric-card__label">开发周期</p>
          <p class="metric-card__value">${a.estimatedDuration}</p>
        </div>
        <div class="metric-card">
          <p class="metric-card__label">复杂度</p>
          <p class="metric-card__value">${a.complexity}</p>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <p class="blueprint-section__title">Technical Blueprint</p>
        <div class="blueprint-flow">${nodes}</div>
      </div>
    </div>

    <div class="glass-card">
      <p class="blueprint-section__title">Task Decomposition</p>
      <div class="task-list">${tasks}</div>
    </div>
  `;

  // 侧栏
  const matchesHtml = MATCHES.map((m) => {
    const b = getBuilder(m.builderId);
    const isApplied = appliedProjects.has("detail-" + b.id);
    return `
      <div class="builder-match" style="flex-direction: column;">
        <div style="display: flex; gap: 16px; width: 100%;">
          <div class="match-score">${m.score}%</div>
          <div style="flex: 1;">
            <p class="match-info__name">${b.name}</p>
            <p class="match-info__headline">${b.headline}</p>
          </div>
        </div>
        <p class="match-info__reason" style="margin-top: 12px;">${m.reason}</p>
        <button class="btn ${isApplied ? "btn--ghost" : "btn--primary"}" style="width: 100%; margin-top: 12px;" data-apply="detail" data-builder="${b.id}" ${isApplied ? "disabled" : ""}>
          ${isApplied ? "已申请" : "用 " + b.name + " 身份接单"}
        </button>
      </div>
    `;
  }).join("");

  $("#detail-sidebar").innerHTML = `
    <div class="glass-card" style="position: sticky; top: 80px;">
      <p style="font-size: 13px; color: var(--steelText);">预算建议</p>
      <p class="detail-sidebar__price">¥${a.budgetRange}</p>
      <button class="btn btn--ghost" style="width: 100%; margin-top: 16px;" onclick="switchView('builder')">前往 Builder 工作台</button>
    </div>
    <div class="glass-card">
      <h2 style="font-size: 20px; font-weight: 700;">推荐 Builder</h2>
      <div style="margin-top: 16px;">${matchesHtml}</div>
    </div>
  `;

  // 绑定接单按钮
  $$('[data-apply="detail"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const builderId = this.dataset.builder;
      const b = getBuilder(builderId);
      appliedProjects.add("detail-" + builderId);
      this.textContent = "已申请";
      this.classList.remove("btn--primary");
      this.classList.add("btn--ghost");
      this.disabled = true;
      showToast("已以 " + b.name + " 身份提交接单申请");
    });
  });
}

// ─── 渲染：任务大厅 ──────────────────────────────────

let marketplaceFilter = "全部";

function renderMarketplace() {
  // 筛选
  const filtered = marketplaceFilter === "全部"
    ? MARKETPLACE_PROJECTS
    : MARKETPLACE_PROJECTS.filter((p) => p.category === marketplaceFilter);

  // 统计指标
  const totalBudget = MARKETPLACE_PROJECTS.reduce((sum, p) => {
    const nums = p.budgetRange.match(/\d+/g)?.map(Number) ?? [];
    return sum + (nums[1] ?? nums[0] ?? 0);
  }, 0);
  const avgMatch = Math.round(
    MARKETPLACE_PROJECTS.reduce((s, p) => s + p.matchScore, 0) / MARKETPLACE_PROJECTS.length
  );
  const totalProposals = MARKETPLACE_PROJECTS.reduce((s, p) => s + p.proposals, 0);

  $("#marketplace-stats").innerHTML = `
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">可接项目</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">${MARKETPLACE_PROJECTS.length}<span style="font-size: 16px; color: var(--steelText);">个</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">平均匹配度</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700; color: var(--neonCyan);">${avgMatch}<span style="font-size: 16px; color: var(--steelText);">%</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">总悬赏预算</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">¥${(totalBudget / 1000).toFixed(1)}k<span style="font-size: 16px; color: var(--steelText);">+</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">已收到投标</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">${totalProposals}<span style="font-size: 16px; color: var(--steelText);">份</span></p>
    </div>
  `;

  // 筛选器
  $("#marketplace-filters").innerHTML = MARKETPLACE_CATEGORIES.map((cat) => `
    <button class="filter-chip ${cat === marketplaceFilter ? "active" : ""}" data-cat="${cat}">${cat}</button>
  `).join("");

  $$("[data-cat]").forEach((chip) => {
    chip.addEventListener("click", function () {
      marketplaceFilter = this.dataset.cat;
      renderMarketplace();
    });
  });

  // 项目卡片
  if (filtered.length === 0) {
    $("#marketplace-grid").innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div>
          <div class="empty-state__glow"></div>
          <p class="empty-state__title">该分类暂无项目</p>
          <p class="empty-state__desc">切换其他分类看看，或去 AI Copilot 发布新项目。</p>
        </div>
      </div>
    `;
    return;
  }

  $("#marketplace-grid").innerHTML = filtered.map((p) => {
    const isApplied = appliedProjects.has("market-" + p.id);
    const matchClass = p.matchScore >= 80 ? "" : "bounty-card__match--low";
    const skills = p.skills.map((s) => `<span class="badge badge--skill">${s}</span>`).join("");

    return `
      <div class="bounty-card">
        <div class="bounty-card__top">
          <div class="bounty-card__badges">
            <span class="badge badge--cyan">${p.category}</span>
            <span class="badge">${p.status}</span>
          </div>
          <div class="bounty-card__match ${matchClass}">${p.matchScore}% MATCH</div>
        </div>
        <h3 class="bounty-card__title">${p.title}</h3>
        <p class="bounty-card__desc">${p.description}</p>
        <div class="bounty-card__metrics">
          <div class="bounty-card__metric">
            <p class="bounty-card__metric-label">预算</p>
            <p class="bounty-card__metric-value" style="color: var(--neonCyan);">¥${p.budgetRange}</p>
          </div>
          <div class="bounty-card__metric">
            <p class="bounty-card__metric-label">周期</p>
            <p class="bounty-card__metric-value">${p.estimatedDuration}</p>
          </div>
          <div class="bounty-card__metric">
            <p class="bounty-card__metric-label">复杂度</p>
            <p class="bounty-card__metric-value">${p.complexity}</p>
          </div>
        </div>
        <div class="bounty-card__skills">${skills}</div>
        <div class="bounty-card__publisher">
          <span class="bounty-card__publisher-avatar">${p.publisherInitial}</span>
          <span>${p.publisher}</span>
          <span style="color: rgba(255,255,255,0.2);">·</span>
          <span>${p.publishedAt}</span>
          <span style="color: rgba(255,255,255,0.2);">·</span>
          <span>${p.proposals} 人投标</span>
        </div>
        <div class="bounty-card__footer">
          <button class="btn btn--ghost" style="flex: 1;" onclick="switchView('detail')">查看详情</button>
          <button class="btn btn--primary" style="flex: 1;" data-apply-market="${p.id}" ${isApplied ? "disabled" : ""}>
            ${isApplied ? "已申请" : "申请接单"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  // 绑定接单按钮
  $$("[data-apply-market]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const pid = this.dataset.applyMarket;
      appliedProjects.add("market-" + pid);
      this.textContent = "已申请";
      this.disabled = true;
      const project = MARKETPLACE_PROJECTS.find((p) => p.id === pid);
      showToast("已申请接单：" + project.title.substring(0, 12) + "...");
    });
  });
}

// ─── 渲染：Builder 工作台 ────────────────────────────

function renderBuilder() {
  const builder = BUILDERS[0]; // 林澈
  const score = 96;

  // 指标
  $("#builder-metrics").innerHTML = `
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">推荐项目</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">1<span style="font-size: 16px; color: var(--steelText);">个</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">平均匹配度</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700; color: var(--neonCyan);">96<span style="font-size: 16px; color: var(--steelText);">%</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">可接预算</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">$10k<span style="font-size: 16px; color: var(--steelText);">+</span></p>
    </div>
    <div class="glass-card">
      <p style="font-size: 12px; color: var(--steelText);">进行中项目</p>
      <p style="margin-top: 8px; font-family: var(--font-mono); font-size: 28px; font-weight: 700;">${appliedProjects.size}<span style="font-size: 16px; color: var(--steelText);">个</span></p>
    </div>
  `;

  const skills = builder.skills.map((s) => `<span class="badge badge--skill">${s}</span>`).join("");
  const a = ANALYSIS_DATA;
  const isApplied = appliedProjects.has("builder-project");

  // 三栏
  $("#builder-grid").innerHTML = `
    <!-- 左栏：Builder Profile + 进行中项目 -->
    <aside style="display: flex; flex-direction: column; gap: 24px;">
      <div class="glass-card">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="builder-profile__avatar">${builder.name[0]}</div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700;">${builder.name}</h3>
            <p style="font-size: 12px; color: var(--steelText);">${builder.headline}</p>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; gap: 8px; align-items: center;">
          <span style="display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); border-radius: 999px; padding: 4px 12px; font-size: 12px; color: #6ee7b7;">
            <span class="status-dot"></span> Available
          </span>
          <span class="badge">★ ${builder.rating}</span>
        </div>
        <p style="margin-top: 16px; font-size: 12px; line-height: 1.6; color: var(--steelText);">${builder.bio}</p>
        <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px;">${skills}</div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="border: 1px solid var(--border); border-radius: 10px; background: rgba(255,255,255,0.04); padding: 8px 10px;">
            <p style="font-size: 11px; color: var(--steelText);">交付率</p>
            <p style="margin-top: 4px; font-family: var(--font-mono); font-size: 14px; font-weight: 700;">${(builder.deliveryRate * 100).toFixed(0)}%</p>
          </div>
          <div style="border: 1px solid var(--border); border-radius: 10px; background: rgba(255,255,255,0.04); padding: 8px 10px;">
            <p style="font-size: 11px; color: var(--steelText);">报价</p>
            <p style="margin-top: 4px; font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--neonCyan);">${builder.priceRange}</p>
          </div>
        </div>
      </div>

      ${appliedProjects.size > 0 ? `
      <div class="glass-card">
        <p class="blueprint-section__title">Active Projects</p>
        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
          <div style="border: 1px solid var(--border); border-radius: 12px; background: rgba(255,255,255,0.04); padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 style="font-size: 14px; font-weight: 700;">AI 客服 Agent 悬赏任务</h4>
              <span style="border: 1px solid rgba(0,242,254,0.3); background: rgba(0,242,254,0.1); border-radius: 999px; padding: 2px 8px; font-size: 10px; color: var(--neonCyan);">applied</span>
            </div>
            <p style="margin-top: 4px; font-size: 11px; color: var(--steelText);">AI客服Agent · 2-4 周</p>
          </div>
        </div>
      </div>
      ` : ""}
    </aside>

    <!-- 中栏：推荐项目 -->
    <main>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 22px; font-weight: 700;">推荐给我的项目</h2>
        <span style="font-family: var(--font-mono); font-size: 12px; color: var(--steelText);">1 个匹配</span>
      </div>
      <div class="opp-card">
        <div class="opp-card__header">
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span class="badge badge--cyan">${a.category}</span>
            <span class="badge">matching</span>
          </div>
          <div style="flex-shrink: 0; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid rgba(0,242,254,0.3); background: rgba(0,242,254,0.1); font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--neonCyan);">${score}%</div>
        </div>
        <h3 class="opp-card__title">AI 客服 Agent 悬赏任务</h3>
        <div class="opp-card__metrics">
          <div class="opp-card__metric">
            <p class="opp-card__metric-label">预算</p>
            <p class="opp-card__metric-value" style="color: var(--neonCyan);">¥${a.budgetRange}</p>
          </div>
          <div class="opp-card__metric">
            <p class="opp-card__metric-label">周期</p>
            <p class="opp-card__metric-value">${a.estimatedDuration}</p>
          </div>
          <div class="opp-card__metric">
            <p class="opp-card__metric-label">复杂度</p>
            <p class="opp-card__metric-value">${a.complexity}</p>
          </div>
        </div>
        <div class="opp-card__reason">
          <p class="opp-card__reason-label">AI Match Reason</p>
          <p class="opp-card__reason-text">${MATCHES[0].reason}</p>
        </div>
        <div class="opp-card__skills">
          ${a.skills.map((s) => `<span class="badge badge--skill">${s}</span>`).join("")}
        </div>
        <div class="opp-card__actions">
          <button class="btn btn--ghost" style="flex: 1;" onclick="switchView('detail')">查看详情</button>
          <button class="btn btn--primary" style="flex: 1;" id="btn-apply-builder" ${isApplied ? "disabled" : ""}>
            ${isApplied ? "已申请" : "申请接单"}
          </button>
        </div>
      </div>
    </main>

    <!-- 右栏：AI Match Insight -->
    <aside>
      <div class="glass-card">
        <p class="blueprint-section__title">AI Match Insight</p>
        <h3 style="margin-top: 8px; font-size: 16px; font-weight: 700;">匹配原理解析</h3>
        <div class="insight-cosine">
          <span style="font-size: 12px; color: var(--steelText);">余弦相似度</span>
          <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--neonCyan);">0.960</span>
        </div>
        <div class="insight-bar">
          <div class="insight-bar__header"><span style="color: var(--steelText);">技能适配</span><span>100%</span></div>
          <div class="insight-bar__track"><div class="insight-bar__fill" style="width: 100%;"></div></div>
        </div>
        <div class="insight-bar">
          <div class="insight-bar__header"><span style="color: var(--steelText);">预算匹配</span><span>91%</span></div>
          <div class="insight-bar__track"><div class="insight-bar__fill" style="width: 91%;"></div></div>
        </div>
        <div class="insight-bar">
          <div class="insight-bar__header"><span style="color: var(--steelText);">周期适配</span><span>94%</span></div>
          <div class="insight-bar__track"><div class="insight-bar__fill" style="width: 94%;"></div></div>
        </div>
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.1); border-radius: 10px; padding: 8px 12px;">
          <span style="font-size: 12px; color: #fca5a5;">优先级</span>
          <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #fca5a5;">P0 HIGHEST</span>
        </div>
      </div>
      <div class="glass-card">
        <p class="blueprint-section__title" style="color: var(--steelText);">Quick Actions</p>
        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn--ghost" style="width: 100%; text-align: left;" onclick="switchView('copilot')">AI Copilot</button>
          <button class="btn btn--ghost" style="width: 100%; text-align: left;" onclick="switchView('detail')">项目详情</button>
        </div>
      </div>
    </aside>
  `;

  // 绑定接单按钮
  const applyBtn = $("#btn-apply-builder");
  if (applyBtn && !isApplied) {
    applyBtn.addEventListener("click", function () {
      appliedProjects.add("builder-project");
      appliedProjects.add("detail-b1");
      this.textContent = "已申请";
      this.disabled = true;
      showToast("接单申请已提交！项目已加入进行中列表");
      renderBuilder(); // 重新渲染以显示进行中项目
    });
  }
}

// ─── 事件绑定 ────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // 导航切换
  $$(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  // 生成蓝图
  $("#btn-analyze").addEventListener("click", () => {
    const input = $("#requirement-input").value.trim();
    if (!input || input.length < 4) {
      showToast("请至少输入 4 个字的需求描述");
      return;
    }

    // 模拟加载
    $("#blueprint-empty").innerHTML = '<div style="text-align: center;"><div class="loading-pulse"></div><p style="margin-top: 16px; color: var(--steelText); font-size: 14px;">AI 正在拆解需求...</p></div>';

    // 更新步骤
    $("#step2").classList.add("active");

    setTimeout(() => {
      renderDiagnosis();
      renderBlueprint();
      showToast("AI 需求蓝图生成完成！");
    }, 1200);
  });

  // 演示需求
  $("#btn-example").addEventListener("click", () => {
    $("#requirement-input").value = "我要做客服机器人";
  });
});
