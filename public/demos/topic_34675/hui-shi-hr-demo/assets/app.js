/* =========================================================
   慧识 HR · Demo App Logic
   - 离线状态管理（localStorage）
   - 规则引擎生成 AI 增益建议
   - 主题切换 / 模态确认 / 路由 / 面包屑
   - 内嵌 SVG 数据可视化（雷达 / 趋势 / 能力分布）
   ========================================================= */
(function () {
  "use strict";

  // ============== Storage ==============
  var STORAGE_KEY = "huishi_hr_demo_state_v1";
  var THEME_KEY = "huishi_hr_demo_theme";

  // ============== Seed ==============
  var seedState = {
    review: {
      owner: "林雨晴",
      team: "招聘一组",
      role: "AI 产品经理",
      period: "2026 Q2",
      ttfDays: 42,
      slaRate: 0.56,
      offerRate: 0.62,
      experienceScore: 3.2,
      process: "需求澄清主要通过口头沟通完成，简历筛选依靠过往经验，面试问题由面试官临时准备。候选人反馈有时会延迟，面试后复盘记录比较分散。",
      problems: "岗位画像不够清晰，业务方对能力要求变化较快；面试评价口径不统一；候选人反馈慢，部分候选人中途流失；缺少统一评分卡和跟进 SOP。",
      actions: "准备整理候选人沟通话术；希望建立统一的简历筛选维度；下个周期尝试缩短反馈时间。"
    },
    advice: [],
    selectedAdviceIds: [],
    versions: { v0: null, v1: null },
    people: [
      { name: "林雨晴", team: "招聘一组",   adopted: 4, actions: 5, quality: 88, signal: "高成长：能把建议转化为流程模板" },
      { name: "赵明",   team: "招聘二组",   adopted: 2, actions: 3, quality: 73, signal: "稳定执行：需加强复盘深度" },
      { name: "周妍",   team: "校园招聘组", adopted: 5, actions: 6, quality: 91, signal: "创新潜力：提出候选人体验改进" },
      { name: "陈航",   team: "招聘一组",   adopted: 1, actions: 2, quality: 61, signal: "需关注：行动项缺少证据闭环" }
    ],
    evidence: []
  };

  // ============== Page meta ==============
  var ROUTE_META = {
    home:      { title: "项目首页",   ps: 0 },
    review:    { title: "员工复盘",   ps: 0 },
    compare:   { title: "证据对比",   ps: 0 },
    dashboard: { title: "管理看板",   ps: 0 },
    settings:  { title: "数据设置",   ps: 0 }
  };

  // ============== State ==============
  var state = loadState();

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function escapeHtml(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pct(n) { return Math.round(Number(n) * 100) + "%"; }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(seedState);
      return Object.assign(clone(seedState), JSON.parse(raw));
    } catch (e) { return clone(seedState); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  // ============== Theme ==============
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(saved || "light");
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  }

  // ============== Toast ==============
  function toast(message) {
    var el = $("#toast");
    var txt = $("#toastText");
    if (txt) txt.textContent = message;
    el.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  // ============== Modal confirm ==============
  function modalConfirm(opts) {
    return new Promise(function (resolve) {
      var modal = $("#modal");
      $("#modalTitle").textContent = opts.title || "确认操作";
      $("#modalMsg").textContent   = opts.message || "确认要继续吗？";
      $("#modalConfirm").textContent = opts.okText || "确认";
      $("#modalCancel").textContent  = opts.cancelText || "取消";

      var btnOk = $("#modalConfirm");
      btnOk.classList.toggle("danger-btn", opts.danger !== false);
      btnOk.classList.toggle("primary",    opts.danger === false);

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");

      function close(result) {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        $("#modalConfirm").removeEventListener("click", onOk);
        $("#modalCancel").removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        resolve(result);
      }
      function onOk()     { close(true); }
      function onCancel() { close(false); }
      function onBackdrop(e) { if (e.target === modal) close(false); }

      $("#modalConfirm").addEventListener("click", onOk);
      $("#modalCancel").addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
    });
  }

  // ============== Form ==============
  function getFormData() {
    var form = $("#reviewForm");
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      data[el.name] = el.type === "number" ? Number(el.value) : el.value.trim();
    });
    return data;
  }
  function setFormData(data) {
    var form = $("#reviewForm");
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || data[el.name] == null) return;
      el.value = data[el.name];
    });
  }

  function aiAssistFillDraft() {
    var data = getFormData();
    var improved = Object.assign({}, data);
    var owner = data.owner || "我";
    var role = data.role || "当前岗位";

    if (!data.process || data.process.length < 70) {
      improved.process = [
        data.process || "",
        owner + "在" + role + "招聘过程中，先与业务方确认岗位目标和关键能力，再根据候选人经历进行初筛，并协调面试官完成面试安排。",
        "过程中已经记录了招聘周期、反馈时效、候选人体验等关键指标，便于后续复盘哪些环节可标准化。"
      ].filter(Boolean).join(" ");
    }
    if (!data.problems || data.problems.length < 70) {
      improved.problems = [
        data.problems || "",
        "当前主要卡点集中在需求澄清不够稳定、面试评价口径不统一、候选人反馈节奏不一致。",
        "这些问题会影响招聘周期、候选人体验以及业务方对候选人质量的判断。"
      ].filter(Boolean).join(" ");
    }
    if (!data.actions || data.actions.length < 60) {
      improved.actions = [
        data.actions || "",
        "下个周期计划把岗位画像、面试评分卡、候选人反馈 SLA 和行动项证据表沉淀为固定模板。",
        "每周复盘一次异常节点，并记录哪些动作真正改善了 TTF、SLA 和候选人体验。"
      ].filter(Boolean).join(" ");
    }

    setFormData(improved);
    state.review = improved;
    saveState();
    toast("AI 已帮你补全为更完整的复盘草稿，你可以继续修改");
  }

  // ============== Routing ==============
  function route() {
    var name = location.hash.replace("#", "") || "home";
    if (!ROUTE_META[name]) name = "home";

    $all(".view").forEach(function (v) { v.classList.remove("active"); });
    var target = $("#view-" + name);
    (target || $("#view-home")).classList.add("active");

    $all(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });

    var crumb = $("#crumbCurrent");
    if (crumb) crumb.textContent = ROUTE_META[name].title;

    if (name === "compare")   renderCompare();
    if (name === "dashboard") renderDashboard();
    if (name === "review")    updateProgressStrip();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============== Progress strip on review ==============
  function updateProgressStrip() {
    var step2 = $("#psStep2"), step3 = $("#psStep3"), step4 = $("#psStep4");
    if (!step2) return;
    var hasAdvice   = state.advice && state.advice.length > 0;
    var hasSelected = state.selectedAdviceIds && state.selectedAdviceIds.length > 0;
    var hasV1       = state.versions && state.versions.v1;

    [step2, step3, step4].forEach(function (s) { s.classList.remove("active", "done"); });
    if (!hasAdvice) {
      step2.classList.add("active");
    } else if (!hasSelected) {
      step2.classList.add("done");
      step3.classList.add("active");
    } else if (!hasV1) {
      step2.classList.add("done");
      step3.classList.add("done");
      step4.classList.add("active");
    } else {
      step2.classList.add("done");
      step3.classList.add("done");
      step4.classList.add("done");
    }
  }

  // ============== Rule engine ==============
  function buildAdvice(review) {
    var list = [];
    var text = [review.process, review.problems, review.actions].join(" ");

    if (Number(review.slaRate) < 0.8 || /反馈慢|延迟|跟进/.test(text)) {
      list.push({
        id: "sla", priority: "P0", title: "建立候选人反馈 SLA 与责任人机制",
        dimension: "效率 / 体验", ruleId: "R-SLA-001",
        evidence: "feedbackSlaHit=" + review.slaRate + "，文本命中“反馈慢/延迟/跟进”",
        action: "设置 24 小时初筛反馈、48 小时面试反馈；每个候选人阶段绑定 owner 和截止时间。",
        versionText: "新增候选人反馈 SLA：初筛 24 小时内反馈，面试 48 小时内反馈，并在 ATS 或表格中记录 owner、阶段、截止时间和反馈状态。"
      });
    }
    if (Number(review.ttfDays) > 35) {
      list.push({
        id: "ttf", priority: "P0", title: "拆解招聘周期瓶颈并设置阶段目标",
        dimension: "效率", ruleId: "R-TTF-002",
        evidence: "ttfDays=" + review.ttfDays + "，超过 35 天目标阈值",
        action: "将 TTF 拆为需求澄清、简历筛选、面试安排、offer 沟通四段，分别设置阶段上限。",
        versionText: "将招聘周期拆为四段：需求澄清 2 天、简历筛选 5 天、面试安排 7 天、offer 沟通 3 天，周会只追踪超过阶段上限的节点。"
      });
    }
    if (/画像不清|需求澄清|业务方|能力要求/.test(text)) {
      list.push({
        id: "profile", priority: "P1", title: "把岗位画像从口头描述改为结构化需求卡",
        dimension: "质量", ruleId: "R-PROFILE-003",
        evidence: "文本命中“画像不清/需求澄清/业务方/能力要求”",
        action: "固定岗位画像字段：核心任务、必备能力、加分能力、淘汰项、样例候选人。",
        versionText: "新增岗位需求卡：核心任务、必备能力、加分能力、淘汰项、样例候选人、业务方确认人，避免筛选口径反复变化。"
      });
    }
    if (/评分卡|评价口径|面试随机|面试问题|临时准备/.test(text)) {
      list.push({
        id: "rubric", priority: "P1", title: "引入结构化面试 Rubric 与评分口径",
        dimension: "质量 / 公平", ruleId: "R-RUBRIC-004",
        evidence: "文本命中“评分卡/评价口径/面试问题/临时准备”",
        action: "建立能力维度、行为问题、评分标准和反向证据四列模板。",
        versionText: "新增面试 Rubric：产品判断、AI 理解、跨部门协作、数据意识四个维度，每个维度包含行为问题、1-5 分标准和反向证据。"
      });
    }
    if (/沟通话术|候选人体验|爽约|中途流失|offer/.test(text) || Number(review.experienceScore) < 4) {
      list.push({
        id: "candidate", priority: "P2", title: "沉淀候选人沟通话术与体验节点",
        dimension: "体验", ruleId: "R-CX-005",
        evidence: "experienceScore=" + review.experienceScore + "，文本命中“沟通/体验/流失/offer”",
        action: "沉淀邀约、面试前提醒、面试后反馈、拒绝、offer 跟进五类话术。",
        versionText: "新增候选人沟通模板：邀约、面试前提醒、面试后反馈、拒绝沟通、offer 跟进，并为每类模板设置语气和信息完整度检查项。"
      });
    }
    if (!/证据|指标|KPI|数据|完成/.test(text)) {
      list.push({
        id: "evidence", priority: "P2", title: "为行动项补充可验证证据路径",
        dimension: "成长证据", ruleId: "R-EVD-006",
        evidence: "行动项缺少明确 KPI 或证据路径",
        action: "每个行动项必须包含 owner、截止时间、指标和证据类型。",
        versionText: "新增行动项证据要求：每条行动必须记录 owner、截止日期、预期指标、证据类型和复盘节点。"
      });
    }
    return list;
  }

  // ============== Render: advice list ==============
  function renderAdvice() {
    var list = $("#adviceList");
    var countEl = $("#adviceCount");
    var createBtn = $("#createVersion");

    if (countEl) countEl.textContent = state.advice.length;

    if (!state.advice.length) {
      list.className = "advice-list empty";
      list.innerHTML = [
        '<div class="empty-state">',
        '<div class="empty-icon">',
        '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5 5.6.8-4 3.9 1 5.6L12 14.8 6.9 17.4l1-5.6-4-3.9 5.6-.8L12 2z"/></svg>',
        '</div>',
        '<strong>等待生成建议</strong>',
        '<p>点击右上角「生成 AI 增益建议」<br/>查看可解释的 P0 / P1 / P2 建议</p>',
        '</div>'
      ].join("");
      createBtn.disabled = true;
      updateProgressStrip();
      return;
    }

    list.className = "advice-list";
    list.innerHTML = state.advice.map(function (item) {
      var checked = state.selectedAdviceIds.indexOf(item.id) >= 0 ? "checked" : "";
      return [
        '<article class="advice-item">',
          '<div class="advice-top">',
            '<span class="priority ' + item.priority.toLowerCase() + '">' + item.priority + '</span>',
            '<div style="flex:1;">',
              '<h3>' + escapeHtml(item.title) + '</h3>',
              '<p class="advice-meta">影响维度：' + escapeHtml(item.dimension) + '｜命中规则：' + escapeHtml(item.ruleId) + '</p>',
              '<p class="advice-meta">证据：' + escapeHtml(item.evidence) + '</p>',
              '<p>' + escapeHtml(item.action) + '</p>',
              '<label><input type="checkbox" data-advice="' + item.id + '" ' + checked + ' /> 采纳此建议（不适用的可以取消勾选）</label>',
            '</div>',
          '</div>',
        '</article>'
      ].join("");
    }).join("");

    createBtn.disabled = false;

    $all("[data-advice]").forEach(function (input) {
      input.addEventListener("change", function () {
        var id = input.getAttribute("data-advice");
        if (input.checked && state.selectedAdviceIds.indexOf(id) < 0) {
          state.selectedAdviceIds.push(id);
        } else if (!input.checked) {
          state.selectedAdviceIds = state.selectedAdviceIds.filter(function (v) { return v !== id; });
        }
        saveState();
        updateProgressStrip();
      });
    });

    updateProgressStrip();
  }

  // ============== Versions ==============
  function buildV1(review, selected) {
    return {
      title: "v1 AI 增益改进版",
      improvements: selected.map(function (s) { return s.versionText; }),
      templates: [
        "岗位需求卡：核心任务 / 必备能力 / 加分能力 / 淘汰项 / 样例候选人",
        "面试评分卡：能力维度 / 行为问题 / 评分标准 / 反向证据",
        "候选人沟通 SOP：邀约 / 提醒 / 反馈 / 拒绝 / offer 跟进",
        "行动项证据表：owner / 截止时间 / 指标 / 证据类型 / 复盘节点"
      ],
      metrics: {
        ttfDays:         Math.max(24,  Number(review.ttfDays) - 10),
        slaRate:         Math.min(0.96, Number(review.slaRate) + 0.27),
        offerRate:       Math.min(0.86, Number(review.offerRate) + 0.12),
        experienceScore: Math.min(4.6,  Number(review.experienceScore) + 0.8)
      }
    };
  }

  function buildV0(review) {
    return {
      title: "v0 原始复盘",
      process: review.process, problems: review.problems, actions: review.actions,
      metrics: {
        ttfDays: review.ttfDays, slaRate: review.slaRate,
        offerRate: review.offerRate, experienceScore: review.experienceScore
      }
    };
  }

  function createVersion() {
    var selected = state.advice.filter(function (a) {
      return state.selectedAdviceIds.indexOf(a.id) >= 0;
    });
    if (!selected.length) { toast("请先至少勾选一条建议"); return; }

    state.versions.v0 = buildV0(state.review);
    state.versions.v1 = buildV1(state.review, selected);
    state.evidence = selected.map(function (s, i) {
      return {
        type: i % 2 === 0 ? "NOTE" : "LINK",
        target: s.title,
        content: "已转化为 v1 改进项：" + s.action
      };
    });
    saveState();
    renderCompare();
    toast("已生成 v1 改进版，跳转到「证据对比」");
    location.hash = "#compare";
  }

  function ensureVersions() {
    var review = state.review || seedState.review;
    if (state.versions.v0 && state.versions.v1) return;
    state.versions.v0 = buildV0(review);
    if (!state.advice.length) state.advice = buildAdvice(review);
    if (!state.selectedAdviceIds.length) {
      state.selectedAdviceIds = state.advice.slice(0, 4).map(function (a) { return a.id; });
    }
    var sel = state.advice.filter(function (a) {
      return state.selectedAdviceIds.indexOf(a.id) >= 0;
    });
    state.versions.v1 = buildV1(review, sel);
    state.evidence = sel.map(function (s, i) {
      return {
        type: i % 2 === 0 ? "NOTE" : "LINK",
        target: s.title,
        content: "已转化为 v1 改进项：" + s.action
      };
    });
    saveState();
  }

  // ============== Metric card helper ==============
  function metricCard(opts) {
    var deltaHtml = "";
    if (opts.delta) {
      var dir = opts.deltaDir === "down" ? "down" : "up";
      var arrow = dir === "up"
        ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H9M17 7v8"/></svg>'
        : '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7L7 17M7 17h8M7 17V9"/></svg>';
      deltaHtml = '<span class="mc-delta ' + dir + '">' + arrow + escapeHtml(opts.delta) + '</span>';
    }
    var icon = opts.icon || '<svg viewBox="0 0 24 24"><path d="M3 12l4 4L21 4"/></svg>';
    return [
      '<div class="metric-card">',
        '<div class="mc-icon">' + icon + '</div>',
        '<div class="mc-label">' + escapeHtml(opts.label) + '</div>',
        '<div class="mc-value">' + escapeHtml(opts.value) + '</div>',
        '<div class="mc-desc">' + escapeHtml(opts.desc || "") + '</div>',
        deltaHtml,
      '</div>'
    ].join("");
  }

  // ============== Charts (inline SVG) ==============
  function renderRadar(mountId, v0Metrics, v1Metrics) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    // 4 维度，归一到 0-1
    var dims = [
      { key: "效率",   v0: 1 - Math.min(1, (v0Metrics.ttfDays - 20) / 40),
                       v1: 1 - Math.min(1, (v1Metrics.ttfDays - 20) / 40) },
      { key: "质量",   v0: Math.min(1, v0Metrics.offerRate),
                       v1: Math.min(1, v1Metrics.offerRate) },
      { key: "体验",   v0: v0Metrics.experienceScore / 5,
                       v1: v1Metrics.experienceScore / 5 },
      { key: "响应",   v0: v0Metrics.slaRate, v1: v1Metrics.slaRate }
    ];

    var size = 320, cx = size/2, cy = size/2, R = 110;
    var n = dims.length;

    function pt(angleDeg, r) {
      var a = (angleDeg - 90) * Math.PI / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }

    // 背景多边形（4 圈）
    var rings = "";
    [0.25, 0.5, 0.75, 1].forEach(function (k) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var p = pt(360 / n * i, R * k);
        pts.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
      }
      rings += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="var(--rule)" stroke-width="1"/>';
    });

    // 轴线
    var axes = "";
    var labels = "";
    for (var i = 0; i < n; i++) {
      var p = pt(360 / n * i, R);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="var(--rule)" stroke-width="1"/>';
      var lp = pt(360 / n * i, R + 20);
      var anchor = "middle";
      if (lp[0] > cx + 5) anchor = "start";
      else if (lp[0] < cx - 5) anchor = "end";
      labels += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="12" font-weight="600" fill="var(--ink-2)">' + dims[i].key + '</text>';
    }

    // v0 多边形
    var p0 = [], p1 = [];
    for (var j = 0; j < n; j++) {
      var a0 = pt(360 / n * j, R * dims[j].v0);
      var a1 = pt(360 / n * j, R * dims[j].v1);
      p0.push(a0[0].toFixed(1) + "," + a0[1].toFixed(1));
      p1.push(a1[0].toFixed(1) + "," + a1[1].toFixed(1));
    }

    // 顶点点
    var dotsV0 = "", dotsV1 = "";
    for (var k = 0; k < n; k++) {
      var d0 = pt(360 / n * k, R * dims[k].v0);
      var d1 = pt(360 / n * k, R * dims[k].v1);
      dotsV0 += '<circle cx="' + d0[0].toFixed(1) + '" cy="' + d0[1].toFixed(1) + '" r="3" fill="var(--muted-soft)"/>';
      dotsV1 += '<circle cx="' + d1[0].toFixed(1) + '" cy="' + d1[1].toFixed(1) + '" r="3.5" fill="var(--accent)"/>';
    }

    mount.innerHTML = [
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">',
        rings,
        axes,
        '<polygon points="' + p0.join(" ") + '" fill="var(--muted-soft)" fill-opacity="0.18" stroke="var(--muted-soft)" stroke-width="1.5"/>',
        '<polygon points="' + p1.join(" ") + '" fill="var(--accent)" fill-opacity="0.22" stroke="var(--accent)" stroke-width="2">',
          '<animate attributeName="fill-opacity" from="0" to="0.22" dur=".6s" fill="freeze"/>',
        '</polygon>',
        dotsV0, dotsV1, labels,
      '</svg>'
    ].join("");
  }

  function renderTrend(mountId, points) {
    var mount = document.getElementById(mountId);
    if (!mount) return;
    var W = 520, H = 180, padL = 36, padR = 16, padT = 16, padB = 28;
    var iw = W - padL - padR, ih = H - padT - padB;

    var max = 1, min = 0;
    var n = points.length;
    var step = iw / (n - 1);

    var dots = "", line = "", area = "M ", labels = "", grid = "";

    // grid lines
    [0, 0.25, 0.5, 0.75, 1].forEach(function (k) {
      var y = padT + ih - ih * k;
      grid += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="var(--rule)" stroke-width="1" stroke-dasharray="' + (k === 0 ? "0" : "3,3") + '"/>';
      grid += '<text x="' + (padL - 6) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + Math.round(k * 100) + '%</text>';
    });

    points.forEach(function (p, i) {
      var x = padL + step * i;
      var y = padT + ih - ((p.value - min) / (max - min)) * ih;
      if (i === 0) { line += "M" + x.toFixed(1) + " " + y.toFixed(1); area += x.toFixed(1) + " " + y.toFixed(1); }
      else         { line += " L" + x.toFixed(1) + " " + y.toFixed(1); area += " L" + x.toFixed(1) + " " + y.toFixed(1); }
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>';
      dots += '<text x="' + x.toFixed(1) + '" y="' + (y - 10) + '" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">' + Math.round(p.value * 100) + '%</text>';
      labels += '<text x="' + x.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + p.label + '</text>';
    });
    area += " L" + (padL + step * (n - 1)).toFixed(1) + " " + (padT + ih) + " L" + padL + " " + (padT + ih) + " Z";

    mount.innerHTML = [
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="xMidYMid meet">',
        '<defs>',
          '<linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">',
            '<stop offset="0%" stop-color="var(--accent)" stop-opacity=".3"/>',
            '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>',
          '</linearGradient>',
        '</defs>',
        grid,
        '<path d="' + area + '" fill="url(#trendGrad)"/>',
        '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
        dots, labels,
      '</svg>'
    ].join("");
  }

  function renderAbility(mountId, items) {
    var mount = document.getElementById(mountId);
    if (!mount) return;
    var W = 520, H = 180, padL = 70, padR = 20, padT = 20, padB = 20;
    var ih = H - padT - padB;
    var rowH = ih / items.length;
    var iw = W - padL - padR;
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;

    var html = "";
    items.forEach(function (it, i) {
      var y = padT + rowH * i + 4;
      var bh = rowH - 14;
      var bw = (it.value / max) * iw;
      html += '<text x="' + (padL - 10) + '" y="' + (y + bh / 2 + 4) + '" text-anchor="end" font-size="12" font-weight="600" fill="var(--ink-2)">' + it.label + '</text>';
      html += '<rect x="' + padL + '" y="' + y + '" width="' + iw + '" height="' + bh + '" rx="6" fill="var(--surface-3)"/>';
      html += '<rect x="' + padL + '" y="' + y + '" width="' + bw.toFixed(1) + '" height="' + bh + '" rx="6" fill="' + it.color + '">';
      html += '<animate attributeName="width" from="0" to="' + bw.toFixed(1) + '" dur=".7s" fill="freeze"/>';
      html += '</rect>';
      html += '<text x="' + (padL + bw - 6).toFixed(1) + '" y="' + (y + bh / 2 + 4) + '" text-anchor="end" font-size="11" font-weight="700" fill="#fff">' + it.value + '%</text>';
    });

    mount.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="xMidYMid meet">' + html + '</svg>';
  }

  // ============== Render: Compare ==============
  var ICON_CLOCK   = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var ICON_CHECK   = '<svg viewBox="0 0 24 24"><path d="M3 12l5 5L21 4"/></svg>';
  var ICON_USERS   = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.13a4 4 0 0 1 0 7.75M22 21a7 7 0 0 0-3-5.77"/></svg>';
  var ICON_HEART   = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  function renderCompare() {
    ensureVersions();
    var v0 = state.versions.v0, v1 = state.versions.v1;

    // Metric grid
    var ttfImprove = v0.metrics.ttfDays - v1.metrics.ttfDays;
    var slaImprove = (v1.metrics.slaRate - v0.metrics.slaRate) * 100;
    var offerImp   = (v1.metrics.offerRate - v0.metrics.offerRate) * 100;
    var expImp     = v1.metrics.experienceScore - v0.metrics.experienceScore;

    $("#compareMetrics").innerHTML = [
      metricCard({
        icon: ICON_CLOCK, label: "TTF（招聘周期）",
        value: v0.metrics.ttfDays + "天 → " + v1.metrics.ttfDays + "天",
        desc: "v1 拆解阶段后预计缩短",
        delta: "-" + ttfImprove + "天", deltaDir: "down"
      }),
      metricCard({
        icon: ICON_CHECK, label: "反馈 SLA 达标",
        value: pct(v0.metrics.slaRate) + " → " + pct(v1.metrics.slaRate),
        desc: "建立 SLA 与责任人后",
        delta: "+" + slaImprove.toFixed(0) + " 个百分点", deltaDir: "up"
      }),
      metricCard({
        icon: ICON_USERS, label: "Offer 接受率",
        value: pct(v0.metrics.offerRate) + " → " + pct(v1.metrics.offerRate),
        desc: "结构化沟通后",
        delta: "+" + offerImp.toFixed(0) + " 个百分点", deltaDir: "up"
      }),
      metricCard({
        icon: ICON_HEART, label: "候选人体验",
        value: v0.metrics.experienceScore.toFixed(1) + " → " + v1.metrics.experienceScore.toFixed(1),
        desc: "5 分制评分",
        delta: "+" + expImp.toFixed(1) + " 分", deltaDir: "up"
      })
    ].join("");

    // Radar
    renderRadar("radarMount", v0.metrics, v1.metrics);

    // V0 / V1 box
    $("#v0Content").innerHTML = [
      "<h3>流程做法</h3><p>" + escapeHtml(v0.process) + "</p>",
      "<h3>关键问题</h3><p>" + escapeHtml(v0.problems) + "</p>",
      "<h3>已有行动项</h3><p>" + escapeHtml(v0.actions) + "</p>"
    ].join("");

    $("#v1Content").innerHTML = [
      "<h3>新增改进项</h3>",
      v1.improvements.map(function (t) { return '<div class="diff-add">+ ' + escapeHtml(t) + '</div>'; }).join(""),
      "<h3>沉淀模板</h3><ul>",
      v1.templates.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join(""),
      "</ul>"
    ].join("");

    $("#evidenceList").innerHTML = (state.evidence || []).map(function (e) {
      return [
        '<div class="evidence-item">',
          '<strong>' + escapeHtml(e.type) + '</strong>',
          '<div><b>' + escapeHtml(e.target) + '</b><span>' + escapeHtml(e.content) + '</span></div>',
        '</div>'
      ].join("");
    }).join("") || '<p style="color:var(--muted); margin:0;">暂无证据。生成 v1 改进版后会自动沉淀证据。</p>';
  }

  // ============== Render: Dashboard ==============
  var ICON_TEAM      = '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_ALERT     = '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
  var ICON_TARGET    = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
  var ICON_TROPHY    = '<svg viewBox="0 0 24 24"><path d="M6 9V2h12v7a6 6 0 0 1-12 0z"/><path d="M6 9H2a4 4 0 0 0 4 4M18 9h4a4 4 0 0 1-4 4M12 15v6M8 21h8"/></svg>';

  function renderDashboard() {
    var review = state.review || seedState.review;
    var advice = state.advice.length ? state.advice : buildAdvice(review);

    var issueCounts = [
      { name: "反馈 SLA",  value: hasAdvice(advice, "sla")       ? 5 : 2 },
      { name: "岗位画像",  value: hasAdvice(advice, "profile")   ? 4 : 2 },
      { name: "面试评分",  value: hasAdvice(advice, "rubric")    ? 4 : 1 },
      { name: "周期过长",  value: hasAdvice(advice, "ttf")       ? 3 : 1 },
      { name: "体验跟进",  value: hasAdvice(advice, "candidate") ? 3 : 1 }
    ];

    $("#dashboardMetrics").innerHTML = [
      metricCard({ icon: ICON_TEAM,   label: "团队人数",  value: "4",   desc: "演示样本" }),
      metricCard({ icon: ICON_ALERT,  label: "共性问题",  value: issueCounts.filter(function (i) { return i.value >= 3; }).length, desc: "需重点处理", delta: "+2 项", deltaDir: "up" }),
      metricCard({ icon: ICON_TARGET, label: "平均采纳",  value: "3.0", desc: "条建议/人", delta: "+0.4", deltaDir: "up" }),
      metricCard({ icon: ICON_TROPHY, label: "高成长信号", value: "2",   desc: "人具备明显信号", delta: "+1 人", deltaDir: "up" })
    ].join("");

    $("#issueBars").innerHTML = issueCounts.map(function (it) {
      return [
        '<div class="bar-row">',
          '<span>' + escapeHtml(it.name) + '</span>',
          '<div class="bar-track"><div class="bar-fill" style="width:' + (it.value * 18) + '%"></div></div>',
          '<b>' + it.value + '</b>',
        '</div>'
      ].join("");
    }).join("");

    $("#riskList").innerHTML = [
      risk("面试口径不统一", "可能带来候选人评价偏差，需统一 Rubric。"),
      risk("反馈链路过长",   "候选人反馈慢会影响体验和 offer 接受率。"),
      risk("行动项证据不足", "部分复盘停留在想法层面，需补充指标和证据。")
    ].join("");

    // Trend
    renderTrend("trendMount", [
      { label: "Q3'25", value: 0.42 },
      { label: "Q4'25", value: 0.51 },
      { label: "Q1'26", value: 0.56 },
      { label: "Q2'26", value: 0.83 }
    ]);

    // Ability
    renderAbility("abilityMount", [
      { label: "学习力", value: 78, color: "var(--accent)"  },
      { label: "改进力", value: 62, color: "var(--accent2)" },
      { label: "创新力", value: 45, color: "var(--accent3)" }
    ]);

    $("#peopleRows").innerHTML = state.people.map(function (p) {
      var qBadge = p.quality >= 85 ? "var(--success)" : p.quality >= 70 ? "var(--warn)" : "var(--danger)";
      return [
        "<tr>",
          "<td>" + escapeHtml(p.name) + "</td>",
          "<td>" + escapeHtml(p.team) + "</td>",
          "<td>" + p.adopted + " 条</td>",
          "<td>" + p.actions + " 项</td>",
          '<td><span style="color:' + qBadge + '; font-weight:700;">' + p.quality + "</span></td>",
          "<td>" + escapeHtml(p.signal) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function hasAdvice(advice, id) { return advice.some(function (a) { return a.id === id; }); }
  function risk(title, body) {
    return '<div class="risk-item"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(body) + '</span></div>';
  }

  // ============== Events ==============
  function bindEvents() {
    window.addEventListener("hashchange", route);

    // Theme
    var themeBtn = $("#themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    // Generate advice
    $("#generateAdvice").addEventListener("click", function () {
      state.review = getFormData();
      state.advice = buildAdvice(state.review);
      state.selectedAdviceIds = state.advice
        .filter(function (a) { return a.priority === "P0" || a.priority === "P1"; })
        .map(function (a) { return a.id; });
      state.versions = { v0: null, v1: null };
      saveState();
      renderAdvice();
      toast("已生成 " + state.advice.length + " 条 AI 增益建议（默认勾选 P0/P1）");
    });

    $("#saveDraft").addEventListener("click", function () {
      state.review = getFormData(); saveState();
      toast("草稿已保存到本地");
    });

    $("#aiAssistFill").addEventListener("click", aiAssistFillDraft);

    $("#createVersion").addEventListener("click", createVersion);

    $("#loadSeedReview").addEventListener("click", function () {
      state = clone(seedState);
      setFormData(state.review);
      saveState();
      renderAdvice();
      toast("已载入示例复盘");
    });

    $("#refreshCompare").addEventListener("click", function () {
      renderCompare(); toast("对比已刷新");
    });

    $("#refreshDashboard").addEventListener("click", function () {
      renderDashboard(); toast("看板已更新");
    });

    // Segmented control on dashboard
    $all(".seg .seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var grp = btn.parentElement;
        $all(".seg-btn", grp).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        toast("已切换到「" + btn.textContent.trim() + "」（Demo 静态数据）");
      });
    });

    // Settings
    $("#loadSeed").addEventListener("click", function () {
      state = clone(seedState);
      state.advice = buildAdvice(state.review);
      state.selectedAdviceIds = state.advice.slice(0, 4).map(function (a) { return a.id; });
      ensureVersions();
      saveState();
      setFormData(state.review);
      renderAdvice();
      toast("示例数据已载入");
    });

    $("#exportData").addEventListener("click", function () {
      var json = JSON.stringify(state, null, 2);
      $("#importText").value = json;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).catch(function () {});
      }
      toast("JSON 已生成并尝试复制到剪贴板");
    });

    $("#importData").addEventListener("click", function () {
      try {
        var imported = JSON.parse($("#importText").value);
        state = Object.assign(clone(seedState), imported);
        saveState();
        setFormData(state.review);
        renderAdvice();
        toast("导入成功");
      } catch (e) { toast("导入失败：JSON 格式不正确"); }
    });

    $("#exportForTrae").addEventListener("click", function () {
      var r = state.review || {};
      var md = [
        "# " + (r.owner || "员工") + " 的成长复盘报告",
        "",
        "> 由 慧识 HR 生成，可在 TRAE AI 中继续分析",
        "",
        "## 基本信息",
        "- **员工**：" + (r.owner || "-") + " | **团队**：" + (r.team || "-") + " | **岗位**：" + (r.role || "-") + " | **周期**：" + (r.period || "-"),
        "",
        "## 关键指标",
        "| 指标 | 数值 |",
        "|---|---|",
        "| 招聘周期 TTF | " + (r.ttfDays || "-") + " 天 |",
        "| 反馈 SLA 达标率 | " + (r.slaRate != null ? Math.round(r.slaRate * 100) + "%" : "-") + " |",
        "| Offer 接受率 | " + (r.offerRate != null ? Math.round(r.offerRate * 100) + "%" : "-") + " |",
        "| 候选人体验评分 | " + (r.experienceScore || "-") + " / 5 |",
        "",
        "## 原始复盘（v0）",
        "### 当时是怎么做的",
        r.process || "（未填写）",
        "",
        "### 遇到的问题 / 卡点",
        r.problems || "（未填写）",
        "",
        "### 已尝试或准备尝试的动作",
        r.actions || "（未填写）",
        "",
        "## AI 增益建议",
        state.advice.length
          ? state.advice.map(function (a, i) {
              var sel = state.selectedAdviceIds.indexOf(a.id) >= 0 ? "✅ 已采纳" : "⬜ 未采纳";
              return (i + 1) + ". **" + a.title + "**（" + a.priority + "）\n   - 维度：" + a.dimension + " | 规则：" + a.ruleId + "\n   - " + sel + "\n   - 建议动作：" + a.action;
            }).join("\n\n")
          : "（尚未生成建议）",
        "",
        "## 改进版本（v1）",
        state.versions.v1
          ? [
              "### 新增改进项",
              state.versions.v1.improvements.map(function (t) { return "- " + t; }).join("\n"),
              "",
              "### 沉淀模板",
              state.versions.v1.templates.map(function (t) { return "- " + t; }).join("\n"),
              "",
              "### 预期指标改善",
              "| 指标 | v0 | v1 |",
              "|---|---|---|",
              "| TTF | " + state.versions.v0.metrics.ttfDays + " 天 | " + state.versions.v1.metrics.ttfDays + " 天 |",
              "| SLA | " + Math.round(state.versions.v0.metrics.slaRate * 100) + "% | " + Math.round(state.versions.v1.metrics.slaRate * 100) + "% |",
              "| Offer | " + Math.round(state.versions.v0.metrics.offerRate * 100) + "% | " + Math.round(state.versions.v1.metrics.offerRate * 100) + "% |",
              "| 体验 | " + state.versions.v0.metrics.experienceScore + " | " + state.versions.v1.metrics.experienceScore + " |",
            ].join("\n")
          : "（尚未生成 v1）",
        "",
        "---",
        "*导出时间：" + new Date().toLocaleString("zh-CN") + "*",
        "*慧识 HR Demo — 在 TRAE 中打开此文件，AI 可继续生成深度分析报告*"
      ].join("\n");

      $("#importText").value = md;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md).catch(function () {});
      }
      toast("Markdown 报告已生成，并尝试复制到剪贴板");
    });

    $("#clearData").addEventListener("click", function () {
      modalConfirm({
        title: "清空本地数据",
        message: "这将删除所有复盘、建议和版本数据，无法恢复。确认继续？",
        okText: "清空", danger: true
      }).then(function (ok) {
        if (!ok) return;
        localStorage.removeItem(STORAGE_KEY);
        state = clone(seedState);
        state.advice = []; state.selectedAdviceIds = [];
        state.versions = { v0: null, v1: null };
        state.evidence = [];
        setFormData(state.review);
        renderAdvice();
        toast("本地数据已清空");
      });
    });

    // Search bar (placeholder)
    var searchInput = $(".topbar-search input");
    if (searchInput) {
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && searchInput.value.trim()) {
          toast("搜索能力将在后续版本接入：" + searchInput.value.trim());
        }
      });
    }
  }

  // ============== Init ==============
  function init() {
    initTheme();
    bindEvents();
    setFormData(state.review || seedState.review);
    renderAdvice();
    route();
  }

  init();
})();
