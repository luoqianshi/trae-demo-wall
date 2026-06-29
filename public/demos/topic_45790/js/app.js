/*
 * 研复通 ReproPilot — 应用主逻辑
 * 原生 JS，无依赖。
 *
 * 本文件负责：导航、数据驱动渲染、详情抽屉、JSON 导入、重置、
 * 以及基于 js/engine.js 的完整审计闭环：
 *   载入案例 → 执行审计 → 查看风险证据 → 生成修正计划 →
 *   模拟应用修复 → 重新审计 → 显示对比 → 导出报告
 *
 * 所有风险、分数、修正计划均由 ReproEngine 动态计算，不在 HTML 写死结论。
 */
(function () {
  "use strict";

  var D = window.ReproData;
  var E = window.ReproEngine;
  var R = window.ReproReport;
  if (!D || !D.project) {
    console.error("[ReproPilot] 内置数据缺失，请确认 js/data.js 已加载。");
    return;
  }
  if (!E || !E.runAudit) {
    console.error("[ReproPilot] 审计引擎缺失，请确认 js/engine.js 已加载。");
    return;
  }
  if (!R || !R.generateMarkdownReport) {
    console.error("[ReproPilot] 报告模块缺失，请确认 js/report.js 已加载。");
    return;
  }

  /* 当前生效的项目数据（可被导入/重置/模拟修复覆盖） */
  var state = {
    project: D.project,
    route: "overview",
    audit: null,        // 当前项目的审计结果（含 results/summary/score/risks/plan/validated）
    beforeAudit: null,  // 模拟修复前的审计快照
    afterAudit: null,   // 模拟修复后的审计快照
    comparison: null,   // compareAudits 结果
    repairApplied: false,
    auditRun: false,    // 是否已在本会话执行过审计
    busy: false,        // 是否正在执行审计/修复（防止重复点击）
    filters: { risks: "all", steps: "all", plan: "all" } // 各页筛选值
  };

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
  /* 超长名称截断（防止页面溢出，标题属性保留完整名称） */
  function truncName(s, max) {
    s = s == null ? "" : String(s);
    max = max || 40;
    if (s.length <= max) return esc(s);
    return '<span title="' + esc(s) + '">' + esc(s.slice(0, max)) + '…</span>';
  }

  var STATUS_TEXT = {
    implemented: "已实现", partial: "部分实现", alternative: "替代实现",
    not_implemented: "未实现", pending: "待核验", no_evidence: "无证据"
  };
  var RISK_TEXT = { high: "高风险", medium: "中风险", low: "低风险", resolved: "已解决" };
  var DIM_TEXT = {
    paper: "论文步骤映射", traceability: "数据可追溯性",
    boundary: "边界与分组科学性", gru: "GRU请求与结果完整性", test: "测试与产物真实性"
  };

  function statusTag(status) {
    var cls = STATUS_TEXT[status] ? status : "pending";
    return '<span class="tag iconed ' + cls + '">' + (STATUS_TEXT[status] || "待核验") + "</span>";
  }
  function riskTag(sev) {
    return '<span class="tag iconed ' + sev + '">' + (RISK_TEXT[sev] || sev) + "</span>";
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg, type) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2800);
  }

  /* ===================== 审计核心：在当前 project 上执行规则引擎 ===================== */
  /* 返回组装好的 audit 对象：{ results, summary, score, breakdown, risks, plan, validated } */
  function computeAudit(project) {
    var a = E.runAudit(project);
    var sc = E.calculateScore(a);
    var risks = E.generateRiskItems(a);
    var plan = E.generateRepairPlan(a);
    return {
      results: a.results,
      summary: a.summary,
      validated: a.validated,
      score: { total: sc.total, score: sc.score, breakdown: sc.breakdown, deductions: sc.deductions },
      risks: risks,
      plan: plan
    };
  }

  /* 对当前 project 执行审计并缓存到 state.audit，同时刷新顶栏可信度 */
  function runAuditOnCurrent(scrollTop) {
    state.audit = computeAudit(state.project);
    state.auditRun = true;
    refreshCredChip();
    if (state.route) renderRoute(state.route);
    if (scrollTop) $("content").scrollTop = 0;
    return state.audit;
  }

  /* 带加载反馈的异步审计：对应真实计算过程（computeAudit 是同步 CPU 计算，
   * 通过微任务延迟让加载动画可见，不用长延时假动画） */
  function runAuditAsync(btn, doneMsg, doneType) {
    if (state.busy) { toast("正在执行，请稍候…", "bad"); return; }
    state.busy = true;
    if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }
    // 让出渲染帧，使加载动画出现，再执行真实计算
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          runAuditOnCurrent(true);
          if (doneMsg) toast(doneMsg, doneType || (state.audit.summary.failed === 0 ? "ok" : "bad"));
        } catch (e) {
          toast("审计执行失败：" + (e && e.message ? e.message : String(e)), "bad");
        } finally {
          state.busy = false;
          if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
        }
      });
    });
  }

  function refreshCredChip() {
    var v = $("credVal");
    if (v && state.audit) v.textContent = state.audit.score.score + "%";
  }

  /* ===================== 视图切换 ===================== */
  function goHome() {
    $("view-home").classList.add("is-active");
    $("view-app").classList.remove("is-active");
    closeSidebar();
  }
  function goApp() {
    $("view-home").classList.remove("is-active");
    $("view-app").classList.add("is-active");
    // 进入工作台即执行一次审计，确保所有页面均有引擎结果可渲染
    runAuditOnCurrent(false);
    setRoute("overview", true);
  }

  /* ---------- 侧栏（移动端） ---------- */
  function openSidebar() { $("sidebar").classList.add("is-open"); }
  function closeSidebar() { $("sidebar").classList.remove("is-open"); }

  /* ---------- 路由 ---------- */
  var ROUTE_TITLE = {
    overview: "项目总览",
    steps: "论文步骤",
    mapping: "源码映射",
    audit: "实验审计",
    risks: "风险证据",
    plan: "修正计划",
    report: "报告导出"
  };

  function setRoute(route, scrollTop) {
    state.route = route;
    var navs = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navs.length; i++) {
      navs[i].classList.toggle("is-active", navs[i].getAttribute("data-route") === route);
    }
    $("topbarTitle").textContent = ROUTE_TITLE[route] || route;
    refreshCredChip();
    renderRoute(route);
    if (scrollTop) $("content").scrollTop = 0;
    closeSidebar();
  }

  function renderRoute(route) {
    var c = $("content");
    switch (route) {
      case "overview": c.innerHTML = tplOverview(); bindOverview(); break;
      case "steps": c.innerHTML = tplSteps(); bindSteps(); break;
      case "mapping": c.innerHTML = tplMapping(); break;
      case "audit": c.innerHTML = tplAudit(); bindAudit(); break;
      case "risks": c.innerHTML = tplRisks(); bindRisks(); break;
      case "plan": c.innerHTML = tplPlan(); bindPlan(); break;
      case "report": c.innerHTML = tplReport(); bindReport(); break;
      default: c.innerHTML = "";
    }
  }

  /* ===================== 模板：项目总览 ===================== */
  function tplOverview() {
    var p = state.project;
    var a = state.audit || computeAudit(p);
    var proj = p.project || {};
    var run = p.run || {};
    var sc = a.score;
    var sm = a.summary;

    var pipeline = (proj.pipeline || []).map(function (n, i) {
      return '<span class="node">' + esc(n) + "</span>" +
        (i < proj.pipeline.length - 1 ? '<span class="arrow">→</span>' : "");
    }).join("");

    // 风险分布（按严重度统计引擎产出的 risks）
    var sevCount = { high: 0, medium: 0, low: 0 };
    for (var i = 0; i < a.risks.length; i++) {
      var s = a.risks[i].severity;
      if (sevCount[s] != null) sevCount[s]++;
    }
    var riskBreakdown = ["high", "medium", "low"].map(function (k) {
      return '<span class="audit-pill">' + RISK_TEXT[k] + ' <b>' + sevCount[k] + '</b></span>';
    }).join("");

    // 论文步骤统计
    var ps = p.paperSteps || [];
    var psCount = { implemented: 0, partial: 0, alternative: 0, not_implemented: 0, no_evidence: 0 };
    for (var j = 0; j < ps.length; j++) { var st = ps[j].status; if (psCount[st] != null) psCount[st]++; else psCount.no_evidence++; }

    return '' +
      '<div class="card" style="margin-bottom:18px;">' +
        '<div class="section-title">项目概览</div>' +
        '<div class="step-meta" style="margin-bottom:8px;"><span>项目名称：<b style="color:#fff">' + truncName(proj.name, 48) + '</b></span></div>' +
        '<div class="step-meta"><span>当前阶段：<b style="color:#fff">' + esc(proj.stage) + '</b></span>' +
          '<span style="margin-left:14px;">Run ID：<span class="src">' + esc(run.run_id || "—") + '</span></span></div>' +
      "</div>" +

      '<div class="audit-control card" style="margin-bottom:18px;">' +
        '<div class="section-title">审计控制</div>' +
        '<div class="audit-control-row">' +
          '<div class="audit-stat"><span class="m-label">综合可信度</span><b class="cred-big" style="color:var(--cy)">' + sc.score + '</b><small>/' + sc.total + '</small></div>' +
          '<div class="audit-stat"><span class="m-label">通过规则</span><b class="cred-big" style="color:var(--ok)">' + sm.passed + '</b><small>/' + sm.total + '</small></div>' +
          '<div class="audit-stat"><span class="m-label">失败规则</span><b class="cred-big" style="color:var(--bad)">' + sm.failed + '</b><small>/' + sm.total + '</small></div>' +
          '<div class="audit-stat"><span class="m-label">高风险失败</span><b class="cred-big" style="color:var(--risk-hi)">' + sm.highFail + '</b></div>' +
          '<div class="audit-stat"><span class="m-label">风险证据数</span><b class="cred-big" style="color:var(--pu)">' + a.risks.length + '</b></div>' +
        '</div>' +
        '<div class="audit-actions">' +
          '<button class="btn btn-primary" id="btnRunAudit" type="button">开始审计 / 重新审计</button>' +
          '<button class="btn btn-secondary" id="btnGenPlanOv" type="button">生成修正计划</button>' +
          '<button class="btn btn-ghost" id="btnApplyRepairOv" type="button">应用示例修复</button>' +
        '</div>' +
        (state.repairApplied ? '<div class="dev-badge" style="margin-top:10px;">已应用示例修复 · 可在「修正计划」页查看前后对比</div>' : '') +
      '</div>' +

      '<div class="metrics">' +
        metric(psCount.implemented + "/" + ps.length, "已实现步骤", "", "ok") +
        metric(sm.failed, "失败规则", "", "bad") +
        metric(sevCount.high, "高风险项", "", "bad") +
        metric(a.risks.length, "风险证据", "", "pu") +
        metric(run.test_passed || 0, "测试通过", "", "ok") +
        metric(run.test_failed || 0, "测试失败", "", "bad") +
        metric((run.artifacts || []).length, "验收产物", "项", "warn") +
        metric(sc.score + "%", "可信度", "", "ok") +
      "</div>" +

      '<div class="card" style="margin-bottom:18px;">' +
        '<div class="section-title">综合复现可信度（由 R01–R12 规则计算）</div>' +
        '<div class="cred-bar-wrap">' +
          '<div class="cred-bar"><i style="width:' + sc.score + '%"></i></div>' +
          '<div class="cred-legend"><span>0%</span><span>基准线 50%</span><span>100%</span></div>' +
        "</div>" +
        scoreBreakdownHtml(sc) +
      "</div>" +

      '<div class="grid grid-2">' +
        '<div class="card">' +
          '<div class="section-title">风险分布</div>' +
          '<div class="audit-summary">' + riskBreakdown + "</div>" +
          '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin:0;">点击左侧「风险证据」查看每条风险的完整证据。</p>' +
        "</div>" +
        '<div class="card">' +
          '<div class="section-title">下一步建议</div>' +
          '<ol style="color:var(--fg-1);font-size:13px;line-height:1.9;padding-left:18px;">' +
            nextStepsHtml(a) +
          "</ol>" +
        "</div>" +
      "</div>";
  }

  function scoreBreakdownHtml(sc) {
    if (!sc.breakdown || !sc.breakdown.length) return "";
    var rows = sc.breakdown.map(function (b) {
      var pct = b.full > 0 ? Math.round((b.score / b.full) * 100) : 0;
      return '<div class="score-row">' +
        '<span class="score-dim">' + esc(DIM_TEXT[b.dimension] || b.dimension) + '</span>' +
        '<div class="score-bar"><i style="width:' + pct + '%"></i></div>' +
        '<span class="score-val">' + b.score + '/' + b.full + '</span>' +
      "</div>";
    }).join("");
    return '<div class="score-breakdown">' + rows + "</div>";
  }

  function metric(val, label, unit, cls) {
    return '<div class="metric ' + (cls || "") + '">' +
      '<div class="m-label">' + esc(label) + "</div>" +
      '<div class="m-val">' + esc(val) + (unit ? "<small>" + esc(unit) + "</small>" : "") + "</div>" +
    "</div>";
  }

  function nextStepsHtml(a) {
    var high = a.risks.filter(function (r) { return r.severity === "high"; });
    if (!high.length) {
      return "<li>暂无高风险项。可前往「报告导出」导出审计报告。</li>" +
        "<li>若已应用示例修复，可查看前后对比并导出修复后报告。</li>";
    }
    return high.slice(0, 5).map(function (r) {
      return "<li>" + esc(r.ruleId) + " " + esc(r.name) + "</li>";
    }).join("");
  }

  function bindOverview() {
    var b1 = $("btnRunAudit"), b2 = $("btnGenPlanOv"), b3 = $("btnApplyRepairOv");
    if (b1) b1.addEventListener("click", function () {
      runAuditAsync(b1, "已完成审计：通过 " + (state.audit ? state.audit.summary.passed : 0) + " / " + (state.audit ? state.audit.summary.total : 12) + " 条规则，可信度 " + (state.audit ? state.audit.score.score : 0) + "%。");
    });
    if (b2) b2.addEventListener("click", function () {
      if (!state.auditRun) { toast("请先点击「开始审计」执行一次审计。", "bad"); return; }
      setRoute("plan", true);
    });
    if (b3) b3.addEventListener("click", function () { setRoute("plan", true); });
  }

  /* ===================== 模板：论文步骤 ===================== */
  function tplSteps() {
    var p = state.project;
    var steps = p.paperSteps || [];
    if (!steps.length) {
      return '<div class="section-title">论文 / 方案步骤</div>' +
        '<div class="placeholder"><div class="ph-ico">≡</div><h3>暂无论文步骤</h3>' +
        '<p>当前数据包未包含论文步骤。可点击「重置示例」载入内置 MDI+GRU 案例。</p></div>';
    }
    // 统计各状态数量
    var sc = { implemented: 0, partial: 0, alternative: 0, not_implemented: 0, no_evidence: 0 };
    for (var i = 0; i < steps.length; i++) { var st = steps[i].status; if (sc[st] != null) sc[st]++; else sc.no_evidence++; }

    var filterHtml = '<div class="filter-bar" role="group" aria-label="按状态筛选步骤">' +
      '<span class="filter-label">筛选：</span>' +
      stepFilterChip("all", "全部", steps.length) +
      stepFilterChip("implemented", "已实现", sc.implemented) +
      stepFilterChip("partial", "部分实现", sc.partial) +
      stepFilterChip("alternative", "替代实现", sc.alternative) +
      stepFilterChip("not_implemented", "未实现", sc.not_implemented) +
      "</div>";

    return '<div class="section-title">论文 / 方案步骤（共 ' + steps.length + " 条）</div>" +
      filterHtml +
      '<div class="steps-grid" id="stepsGrid"></div>' +
      '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin-top:16px;">点击任意卡片查看验收标准与完整证据。</p>';
  }

  function stepFilterChip(val, label, count) {
    var active = state.filters.steps === val ? " is-active" : "";
    return '<button class="filter-chip' + active + '" data-filter="steps" data-val="' + val + '" type="button">' + esc(label) + '<span class="count">' + count + "</span></button>";
  }

  function renderStepCards() {
    var p = state.project;
    var steps = p.paperSteps || [];
    var f = state.filters.steps;
    var filtered = steps.filter(function (s) { return f === "all" || s.status === f; });
    var grid = $("stepsGrid");
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = '<div class="placeholder" style="grid-column:1/-1;"><div class="ph-ico">∅</div><h3>该状态无步骤</h3><p>当前筛选下没有匹配的论文步骤。</p></div>';
      return;
    }
    grid.innerHTML = filtered.map(function (s) {
      return '<div class="step-card" data-step="' + esc(s.id) + '" tabindex="0" role="button" aria-label="步骤 ' + esc(s.id) + ' 详情">' +
        '<div class="step-head">' +
          '<span class="step-id">' + esc(s.id) + "</span>" +
          statusTag(s.status) +
        "</div>" +
        '<div class="step-req">' + esc(s.requirement) + "</div>" +
        '<div class="step-meta">' +
          '<span class="src">' + esc(s.source) + "</span>" +
          riskTag(s.riskLevel) +
        "</div>" +
        '<div class="muted" style="color:var(--fg-2);font-size:12px;">证据摘要：' + esc(s.evidence) + "</div>" +
      "</div>";
    }).join("");
    // 绑定卡片点击
    var cards = grid.querySelectorAll(".step-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var open = function () { openStepDrawer(card.getAttribute("data-step")); };
        card.addEventListener("click", open);
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      })(cards[i]);
    }
  }

  function bindSteps() {
    renderStepCards();
    var chips = document.querySelectorAll('.filter-chip[data-filter="steps"]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        state.filters.steps = this.getAttribute("data-val");
        renderStepCards();
        // 刷新筛选条高亮
        var all = document.querySelectorAll('.filter-chip[data-filter="steps"]');
        for (var j = 0; j < all.length; j++) {
          all[j].classList.toggle("is-active", all[j].getAttribute("data-val") === state.filters.steps);
        }
      });
    }
  }

  function openStepDrawer(id) {
    var p = state.project;
    var s = null;
    for (var i = 0; i < (p.paperSteps || []).length; i++) {
      if (p.paperSteps[i].id === id) { s = p.paperSteps[i]; break; }
    }
    if (!s) return;
    var relMap = (p.sourceMappings || []).filter(function (m) { return m.step === s.id; });

    // 关联引擎风险（按规则关联步骤做粗匹配：若风险 evidence/规则涉及该步骤）
    var relRisks = (state.audit && state.audit.risks) ? state.audit.risks.filter(function (r) {
      // 简单关联：风险名称或证据里包含该步骤 id
      return (r.name && r.name.indexOf(s.id) >= 0) || (r.files && r.files.join(" ").indexOf(s.id) >= 0);
    }) : [];

    var riskHtml = relRisks.length
      ? relRisks.map(function (r) {
          return '<div class="tl-item bad"><div class="tl-time">' + esc(r.ruleId) + " · " + esc(r.severity) + '</div><div class="tl-text">' + esc(r.name) + "：" + esc(r.danger) + "</div></div>";
        }).join("")
      : '<div class="tl-item"><div class="tl-text muted">无关联风险。</div></div>';

    var mapHtml = relMap.length
      ? relMap.map(function (m) {
          return '<div class="kv"><div class="k">代码位置</div><div class="v mono">' + esc(m.file) + " :: " + esc(m.symbol) + "</div></div>";
        }).join("")
      : '<div class="kv"><div class="k">代码位置</div><div class="v muted">（尚未实现）</div></div>';

    $("drawerTitle").textContent = s.id + " · 步骤详情";
    $("drawerBody").innerHTML =
      '<div class="kv"><div class="k">论文要求</div><div class="v">' + esc(s.requirement) + "</div></div>" +
      '<div class="kv"><div class="k">验收标准</div><div class="v">' + esc(s.acceptance) + "</div></div>" +
      '<div class="kv"><div class="k">当前状态</div><div class="v">' + statusTag(s.status) + " " + riskTag(s.riskLevel) + "</div></div>" +
      mapHtml +
      '<div class="kv"><div class="k">证据摘要</div><div class="v">' + esc(s.evidence) + "</div></div>" +
      '<div class="kv"><div class="k">关联风险时间线</div></div>' +
      '<div class="timeline">' + riskHtml + "</div>";
    openDrawer();
  }

  /* ===================== 模板：源码映射 ===================== */
  function tplMapping() {
    var p = state.project;
    var rows = (p.sourceMappings || []).map(function (m) {
      return '<tr class="row-clickable" data-step="' + esc(m.step) + '">' +
        "<td><span class=\"mono\">" + esc(m.step) + "</span></td>" +
        "<td>" + esc(m.file) + "</td>" +
        '<td><span class="mono">' + esc(m.symbol) + "</span></td>" +
        "<td>" + statusTag(m.status) + "</td>" +
        "<td>" + esc(m.evidence) + "</td>" +
        "<td>" + riskTag(m.riskLevel) + "</td>" +
      "</tr>";
    }).join("");

    return '<div class="section-title">论文步骤 → 源码实现映射</div>' +
      '<div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>步骤</th><th>代码文件</th><th>类 / 函数</th><th>实现状态</th><th>证据</th><th>风险</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table></div>" +
      '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin-top:12px;">点击任意行可在「论文步骤」中查看该步骤详情。</p>';
  }

  /* ===================== 模板：实验审计（引擎规则结果） ===================== */
  function tplAudit() {
    var a = state.audit;
    if (!a) { runAuditOnCurrent(false); a = state.audit; }
    var run = state.project.run || {};
    var rows = a.results.map(function (r) {
      var cls = r.passed ? "pass" : "fail";
      var tag = r.passed ? '<span class="tag low">通过</span>' : '<span class="tag ' + r.severity + '">' + (RISK_TEXT[r.severity] || r.severity) + '</span>';
      return '<tr class="audit-row ' + cls + '">' +
        '<td><span class="mono">' + esc(r.ruleId) + "</span></td>" +
        "<td>" + esc(r.name) + "</td>" +
        "<td>" + tag + "</td>" +
        '<td class="muted">' + esc(r.actual || "—") + "</td>" +
        '<td class="muted">' + esc(r.required) + "</td>" +
      "</tr>";
    }).join("");

    var dimRows = a.score.breakdown.map(function (b) {
      return '<span class="audit-pill"> ' + esc(DIM_TEXT[b.dimension] || b.dimension) + ' <b>' + b.score + '/' + b.full + '</b></span>';
    }).join("");

    return '<div class="section-title">规则审计结果（R01–R12，由引擎动态计算）</div>' +
      '<div class="audit-summary">' +
        '<span class="audit-pill pass">通过 <b>' + a.summary.passed + "</b></span>" +
        '<span class="audit-pill fail">未通过 <b>' + a.summary.failed + "</b></span>" +
        '<span class="audit-pill">高风险失败 <b>' + a.summary.highFail + "</b></span>" +
        '<span class="audit-pill">可信度 <b>' + a.score.score + "/" + a.score.total + "</b></span>" +
      "</div>" +
      '<div class="card" style="margin-bottom:16px;"><div class="section-title">评分维度</div><div class="audit-summary">' + dimRows + "</div></div>" +
      '<div class="audit-actions" style="margin-bottom:16px;">' +
        '<button class="btn btn-primary" id="btnReAudit" type="button">重新审计</button>' +
      "</div>" +
      '<div class="cmd-box">$ ' + esc(run.test_command || "—") + "</div>" +
      '<div class="table-wrap"><table class="tbl">' +
        "<thead><tr><th>规则</th><th>名称</th><th>结果</th><th>当前实现</th><th>论文要求</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table></div>" +
      '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin-top:12px;">退出码 ' + (run.exit_code != null ? run.exit_code : "—") +
        " · 通过 " + (run.test_passed || 0) + " · 失败 " + (run.test_failed || 0) + "。</p>";
  }

  function bindAudit() {
    var b = $("btnReAudit");
    if (b) b.addEventListener("click", function () {
      runAuditAsync(b, "已完成重新审计：可信度 " + (state.audit ? state.audit.score.score : 0) + "%。");
    });
  }

  /* ===================== 模板：风险证据（引擎产出） ===================== */
  function tplRisks() {
    var a = state.audit;
    if (!a) { runAuditOnCurrent(false); a = state.audit; }
    if (!a.risks.length) {
      return '<div class="section-title">风险证据</div>' +
        '<div class="placeholder"><div class="ph-ico">✓</div>' +
        '<h3>本次审计未发现风险项</h3>' +
        '<p>所有 R01–R12 规则均通过。可在「报告导出」生成审计报告。</p></div>';
    }
    var sev = { high: 0, medium: 0, low: 0 };
    for (var i = 0; i < a.risks.length; i++) { var s = a.risks[i].severity; if (sev[s] != null) sev[s]++; }
    var filterHtml = '<div class="filter-bar" role="group" aria-label="按等级筛选风险">' +
      '<span class="filter-label">筛选：</span>' +
      riskFilterChip("all", "全部", a.risks.length) +
      riskFilterChip("high", "高风险", sev.high) +
      riskFilterChip("medium", "中风险", sev.medium) +
      riskFilterChip("low", "低风险", sev.low) +
      "</div>";
    return '<div class="section-title">风险证据（共 ' + a.risks.length + " 条，由失败规则动态生成）</div>" +
      filterHtml +
      '<div class="risk-list" id="risksList"></div>' +
      '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin-top:16px;">点击任意风险卡片查看完整证据、推荐修复方式与验收标准。</p>';
  }

  function riskFilterChip(val, label, count) {
    var active = state.filters.risks === val ? " is-active" : "";
    return '<button class="filter-chip' + active + '" data-filter="risks" data-val="' + val + '" type="button">' + esc(label) + '<span class="count">' + count + "</span></button>";
  }

  function renderRiskCards() {
    var a = state.audit;
    if (!a) return;
    var f = state.filters.risks;
    var filtered = a.risks.filter(function (r) { return f === "all" || r.severity === f; });
    var list = $("risksList");
    if (!list) return;
    if (!filtered.length) {
      list.innerHTML = '<div class="placeholder"><div class="ph-ico">∅</div><h3>该等级无风险项</h3><p>当前筛选下没有匹配的风险证据。</p></div>';
      return;
    }
    list.innerHTML = filtered.map(function (r) {
      return '<div class="risk-card ' + r.severity + '" data-rule="' + esc(r.ruleId) + '" tabindex="0" role="button" aria-label="风险 ' + esc(r.ruleId) + ' 详情">' +
        '<div class="risk-head">' +
          '<span class="step-id">' + esc(r.ruleId) + "</span>" +
          '<span class="risk-title">' + esc(r.name) + "</span>" +
          riskTag(r.severity) +
        "</div>" +
        '<div class="risk-body"><b>当前实现：</b>' + esc(r.actual || "—") + "</div>" +
        '<div class="risk-body" style="margin-top:6px;"><b>为什么危险：</b>' + esc(r.danger) + "</div>" +
        (r.evidence && r.evidence.length ? '<div class="risk-body" style="margin-top:6px;"><b>证据：</b>' + esc(r.evidence.slice(0, 2).join("；")) + (r.evidence.length > 2 ? " 等" : "") + "</div>" : "") +
      "</div>";
    }).join("");
    var cards = list.querySelectorAll(".risk-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var open = function () { openRiskDrawer(card.getAttribute("data-rule")); };
        card.addEventListener("click", open);
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      })(cards[i]);
    }
  }

  function bindRisks() {
    renderRiskCards();
    var chips = document.querySelectorAll('.filter-chip[data-filter="risks"]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        state.filters.risks = this.getAttribute("data-val");
        renderRiskCards();
        var all = document.querySelectorAll('.filter-chip[data-filter="risks"]');
        for (var j = 0; j < all.length; j++) {
          all[j].classList.toggle("is-active", all[j].getAttribute("data-val") === state.filters.risks);
        }
      });
    }
  }

  function openRiskDrawer(ruleId) {
    var a = state.audit;
    if (!a) return;
    var r = null;
    for (var i = 0; i < a.risks.length; i++) {
      if (a.risks[i].ruleId === ruleId) { r = a.risks[i]; break; }
    }
    if (!r) return;

    var evidenceHtml = (r.evidence && r.evidence.length)
      ? r.evidence.map(function (e) { return '<div class="tl-item bad"><div class="tl-text">' + esc(e) + "</div></div>"; }).join("")
      : '<div class="tl-item"><div class="tl-text muted">无具体证据条目。</div></div>';
    var filesHtml = (r.files && r.files.length)
      ? r.files.map(function (f) { return '<code>' + esc(f) + "</code>"; }).join(" ")
      : '<span class="muted">—</span>';

    $("drawerTitle").textContent = r.ruleId + " · 风险证据";
    $("drawerBody").innerHTML =
      '<div class="kv"><div class="k">规则编号</div><div class="v mono">' + esc(r.ruleId) + "</div></div>" +
      '<div class="kv"><div class="k">风险名称</div><div class="v">' + esc(r.name) + "</div></div>" +
      '<div class="kv"><div class="k">风险等级</div><div class="v">' + riskTag(r.severity) + "</div></div>" +
      '<div class="kv"><div class="k">论文 / 方案要求</div><div class="v">' + esc(r.paper) + "</div></div>" +
      '<div class="kv"><div class="k">当前实现值</div><div class="v">' + esc(r.actual || "—") + "</div></div>" +
      '<div class="kv"><div class="k">为什么危险</div><div class="v">' + esc(r.danger) + "</div></div>" +
      '<div class="kv"><div class="k">证据来源</div></div>' +
      '<div class="timeline">' + evidenceHtml + "</div>" +
      '<div class="kv" style="margin-top:14px;"><div class="k">涉及文件或字段</div><div class="v">' + filesHtml + "</div></div>" +
      '<div class="kv"><div class="k">推荐修复方式</div><div class="v">' + esc(r.fix) + "</div></div>" +
      '<div class="kv"><div class="k">验收标准</div><div class="v">' + esc(r.acceptance) + "</div></div>";
    openDrawer();
  }

  /* ===================== 模板：修正计划（引擎产出 + 模拟修复闭环） ===================== */
  function tplPlan() {
    var a = state.audit;
    if (!a) { runAuditOnCurrent(false); a = state.audit; }
    var plan = a.plan || [];

    var grouped = { P0: [], P1: [], P2: [] };
    for (var i = 0; i < plan.length; i++) { (grouped[plan[i].priority] || (grouped.P2)).push(plan[i]); }
    var prioDesc = { P0: "P0 会导致字段整体错位或结果不可追溯", P1: "P1 影响实验可信度", P2: "P2 影响报告完整度或使用体验" };

    var filterHtml = "";
    if (plan.length) {
      filterHtml = '<div class="filter-bar" role="group" aria-label="按优先级筛选修正计划">' +
        '<span class="filter-label">筛选：</span>' +
        planFilterChip("all", "全部", plan.length) +
        planFilterChip("P0", "P0 高优先级", grouped.P0.length) +
        planFilterChip("P1", "P1 中优先级", grouped.P1.length) +
        planFilterChip("P2", "P2 低优先级", grouped.P2.length) +
        "</div>";
    }

    var compareHtml = state.comparison ? tplCompare(state.comparison) : "";

    return '<div class="section-title">修正计划（由失败规则动态生成）</div>' +
      '<div class="audit-actions" style="margin-bottom:16px;">' +
        '<button class="btn btn-primary" id="btnGenPlan" type="button">生成修正计划</button>' +
        '<button class="btn btn-secondary" id="btnApplyRepair" type="button" ' + (state.repairApplied ? "disabled" : "") + '>应用示例修复</button>' +
        '<button class="btn btn-ghost" id="btnReAuditPlan" type="button">重新审计</button>' +
      "</div>" +
      filterHtml +
      '<div id="planList"></div>' +
      compareHtml +
      '<p class="muted" style="color:var(--fg-2);font-size:12.5px;margin-top:16px;">「应用示例修复」不会修改用户真实工程，仅在内置 baseline 数据上应用一组可追溯的字段修正，并保留至少一个低风险问题（如 Acc1/Acc2 未计算）。</p>';
  }

  function planFilterChip(val, label, count) {
    var active = state.filters.plan === val ? " is-active" : "";
    return '<button class="filter-chip' + active + '" data-filter="plan" data-val="' + val + '" type="button">' + esc(label) + '<span class="count">' + count + "</span></button>";
  }

  function renderPlanTasks() {
    var a = state.audit;
    if (!a) return;
    var plan = a.plan || [];
    var f = state.filters.plan;
    var box = $("planList");
    if (!box) return;
    if (!plan.length) {
      box.innerHTML = '<div class="placeholder"><div class="ph-ico">✓</div><h3>当前无失败规则</h3><p>所有 R01–R12 规则均通过，未生成修正计划。</p></div>';
      return;
    }
    var grouped = { P0: [], P1: [], P2: [] };
    for (var i = 0; i < plan.length; i++) { (grouped[plan[i].priority] || (grouped.P2)).push(plan[i]); }
    var prioDesc = { P0: "P0 会导致字段整体错位或结果不可追溯", P1: "P1 影响实验可信度", P2: "P2 影响报告完整度或使用体验" };
    var html = "";
    var order = ["P0", "P1", "P2"];
    for (var oi = 0; oi < order.length; oi++) {
      var p = order[oi];
      if (f !== "all" && f !== p) continue;
      var arr = grouped[p];
      if (!arr.length) continue;
      html += '<div class="card" style="margin-bottom:14px;"><div class="section-title">' + esc(prioDesc[p]) + "（" + arr.length + " 项）</div>";
      for (var ai = 0; ai < arr.length; ai++) {
        var t = arr[ai];
        html += '<div class="plan-task" data-plan-id="' + esc(t.id) + '" tabindex="0">' +
          '<div class="plan-task-head"><span class="plan-id">' + esc(t.id) + "</span>" +
            '<span class="tag iconed ' + (t.priority === "P0" ? "high" : t.priority === "P1" ? "medium" : "low") + '">' + esc(t.priority) + "</span>" +
            '<span class="risk-title">' + esc(t.riskName) + "</span>" +
            '<span class="muted">对应规则 ' + esc(t.relatedRule) + "</span></div>" +
          '<div class="plan-task-body">' +
            '<div><b>目标：</b>' + esc(t.target) + "</div>" +
            '<div><b>建议修改文件：</b><span class="mono">' + esc(t.file) + "</span></div>" +
            '<div><b>预期代码变化：</b>' + esc(t.codeChange) + "</div>" +
            '<div><b>必须运行的测试：</b>' + (t.mustRunTests.length ? t.mustRunTests.map(function (x) { return '<code>' + esc(x) + "</code>"; }).join(" ") : "—") + "</div>" +
            '<div><b>预期产物：</b>' + esc(t.expectedArtifact) + "</div>" +
            '<div><b>完成定义：</b>' + esc(t.definitionOfDone) + "</div>" +
            '<div class="forbidden"><b>禁止事项：</b>' + esc(t.forbidden) + "</div>" +
          "</div>" +
        "</div>";
      }
      html += "</div>";
    }
    if (!html) {
      html = '<div class="placeholder"><div class="ph-ico">∅</div><h3>该优先级无任务</h3><p>当前筛选下没有匹配的修正任务。</p></div>';
    }
    box.innerHTML = html;
    var tasks = box.querySelectorAll(".plan-task");
    for (var i2 = 0; i2 < tasks.length; i2++) {
      (function (t) {
        t.addEventListener("click", function () { t.classList.toggle("is-open"); });
        t.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t.classList.toggle("is-open"); }
        });
      })(tasks[i2]);
    }
  }

  function tplCompare(cmp) {
    return '<div class="card compare-card">' +
      '<div class="section-title">修复前后对比（由 compareAudits 计算）</div>' +
      '<div class="compare-grid">' +
        '<div class="compare-col"><div class="m-label">修复前</div>' +
          '<div class="compare-num" style="color:var(--bad)">' + cmp.before.score + '</div><div class="muted">可信度 / ' + cmp.before.riskCount + ' 条风险</div>' +
        "</div>" +
        '<div class="compare-arrow">→</div>' +
        '<div class="compare-col"><div class="m-label">修复后</div>' +
          '<div class="compare-num" style="color:var(--ok)">' + cmp.after.score + '</div><div class="muted">可信度 / ' + cmp.after.riskCount + ' 条风险</div>' +
        "</div>" +
      "</div>" +
      '<div class="kv" style="margin-top:14px;"><div class="k">本次模拟变更摘要</div><div class="v">' + esc(cmp.changeSummary) + "</div></div>" +
      '<div class="kv"><div class="k">已解决规则（' + cmp.resolvedRules.length + "）</div><div class=\"v\">" + (cmp.resolvedRules.length ? cmp.resolvedRules.map(function (x) { return '<code>' + esc(x) + "</code>"; }).join(" ") : "—") + "</div></div>" +
      '<div class="kv"><div class="k">尚未解决规则（' + cmp.unresolvedRules.length + "）</div><div class=\"v\">" + (cmp.unresolvedRules.length ? cmp.unresolvedRules.map(function (x) { return '<code>' + esc(x) + "</code>"; }).join(" ") : "—") + "</div></div>" +
      (cmp.newlyIntroducedRules.length ? '<div class="kv"><div class="k">新增问题</div><div class="v">' + cmp.newlyIntroducedRules.map(function (x) { return '<code>' + esc(x) + "</code>"; }).join(" ") + "</div></div>" : "") +
      "</div>";
  }

  function bindPlan() {
    renderPlanTasks();
    // 筛选条
    var chips = document.querySelectorAll('.filter-chip[data-filter="plan"]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        state.filters.plan = this.getAttribute("data-val");
        renderPlanTasks();
        var all = document.querySelectorAll('.filter-chip[data-filter="plan"]');
        for (var j = 0; j < all.length; j++) {
          all[j].classList.toggle("is-active", all[j].getAttribute("data-val") === state.filters.plan);
        }
      });
    }
    var b1 = $("btnGenPlan"), b2 = $("btnApplyRepair"), b3 = $("btnReAuditPlan");
    if (b1) b1.addEventListener("click", function () {
      if (!state.auditRun) { toast("请先在「实验审计」页执行一次审计。", "bad"); return; }
      runAuditAsync(b1, "已根据 " + (state.audit ? state.audit.summary.failed : 0) + " 条失败规则生成修正计划，共 " + (state.audit ? state.audit.plan.length : 0) + " 项任务。", state.audit && state.audit.plan.length ? "ok" : "bad");
    });
    if (b2) b2.addEventListener("click", function () {
      if (!state.auditRun) { toast("请先执行审计后再应用修复。", "bad"); return; }
      applyDemoRepair(b2);
    });
    if (b3) b3.addEventListener("click", function () { runAuditAsync(b3, "已重新审计。", "ok"); });
  }

  /* ===================== 模拟修复闭环 ===================== */
  function applyDemoRepair(btn) {
    if (state.repairApplied) { toast("已应用过示例修复，可点击「重置示例」回到基线。", "bad"); return; }
    if (state.busy) { toast("正在执行，请稍候…", "bad"); return; }
    state.busy = true;
    if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          // 1. 记录修复前审计快照
          state.beforeAudit = state.audit || computeAudit(state.project);
          // 2. 应用示例修复
          var repaired = E.applyDemoRepairs(state.project);
          state.project = repaired;
          state.repairApplied = true;
          // 3. 修复后重新审计
          state.afterAudit = computeAudit(repaired);
          state.audit = state.afterAudit;
          state.auditRun = true;
          // 4. 对比前后
          state.comparison = E.compareAudits(state.beforeAudit, state.afterAudit);
          // 5. 刷新视图
          refreshCredChip();
          renderRoute("plan");
          toast("已应用示例修复：可信度 " + state.beforeAudit.score.score + "% → " + state.afterAudit.score.score + "%，风险 " + state.beforeAudit.risks.length + " → " + state.afterAudit.risks.length + " 条。", "ok");
        } catch (e) {
          toast("应用修复失败：" + (e && e.message ? e.message : String(e)), "bad");
        } finally {
          state.busy = false;
          if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
        }
      });
    });
  }

  /* ===================== 模板：报告导出 ===================== */
  function tplReport() {
    var a = state.audit;
    if (!a) { runAuditOnCurrent(false); a = state.audit; }
    var proj = state.project.project || {};
    return '<div class="section-title">报告导出（由本地规则引擎生成）</div>' +
      '<div class="card" style="margin-bottom:16px;">' +
        '<div class="section-title">报告摘要预览</div>' +
        '<div class="kvs">' +
          '<div class="card"><div class="m-label">项目</div><div class="m-val" style="font-size:15px;">' + truncName(proj.name, 48) + "</div></div>" +
          '<div class="card"><div class="m-label">阶段</div><div class="m-val" style="font-size:15px;">' + esc(proj.stage) + "</div></div>" +
          '<div class="card"><div class="m-label">综合可信度</div><div class="m-val" style="color:var(--cy)">' + a.score.score + "/" + a.score.total + "</div></div>" +
          '<div class="card"><div class="m-label">通过 / 总规则</div><div class="m-val" style="font-size:15px;">' + a.summary.passed + "/" + a.summary.total + "</div></div>" +
          '<div class="card"><div class="m-label">风险证据</div><div class="m-val" style="color:var(--bad)">' + a.risks.length + "</div></div>" +
          '<div class="card"><div class="m-label">修正任务</div><div class="m-val" style="font-size:15px;">' + a.plan.length + "</div></div>" +
        "</div>" +
      "</div>" +
      '<div class="audit-actions" style="flex-wrap:wrap;">' +
        '<button class="btn btn-primary" id="btnExportMd" type="button">导出 Markdown</button>' +
        '<button class="btn btn-secondary" id="btnExportJson" type="button">导出 JSON</button>' +
        '<button class="btn btn-ghost" id="btnCopySummary" type="button">复制报告摘要</button>' +
      "</div>" +
      '<div class="card" style="margin-top:16px;">' +
        '<div class="section-title">声明</div>' +
        '<p class="muted" style="color:var(--fg-1);font-size:13px;margin:0;">本报告由本地规则引擎根据导入数据生成，不调用任何外部 API，不上传任何文件；所有风险、评分与修正计划均由 R01–R12 规则与失败项动态计算得出，未写死任何结论。</p>' +
      "</div>";
  }

  function bindReport() {
    $("btnExportMd").addEventListener("click", function () {
      if (!state.auditRun || !state.audit) { toast("请先执行审计后再导出报告。", "bad"); return; }
      try {
        var md = R.generateMarkdownReport(state.project, state.audit);
        var ok = R.downloadTextFile("repropilot-audit-report.md", md, "text/markdown");
        toast(ok ? "已导出 Markdown 报告（repropilot-audit-report.md）。" : "当前浏览器禁止下载，请检查下载权限或更换浏览器。", ok ? "ok" : "bad");
      } catch (e) { toast("导出失败：" + (e && e.message ? e.message : String(e)), "bad"); }
    });
    $("btnExportJson").addEventListener("click", function () {
      if (!state.auditRun || !state.audit) { toast("请先执行审计后再导出报告。", "bad"); return; }
      try {
        var js = R.generateJsonReport(state.project, state.audit);
        var ok = R.downloadTextFile("repropilot-audit-report.json", js, "application/json");
        toast(ok ? "已导出 JSON 报告（repropilot-audit-report.json）。" : "当前浏览器禁止下载，请检查下载权限或更换浏览器。", ok ? "ok" : "bad");
      } catch (e) { toast("导出失败：" + (e && e.message ? e.message : String(e)), "bad"); }
    });
    $("btnCopySummary").addEventListener("click", function () {
      if (!state.auditRun || !state.audit) { toast("请先执行审计后再复制摘要。", "bad"); return; }
      var a = state.audit;
      var proj = state.project.project || {};
      var summary = "研复通审计摘要\n" +
        "项目：" + (proj.name || "—") + "\n" +
        "阶段：" + (proj.stage || "—") + "\n" +
        "综合可信度：" + a.score.score + "/" + a.score.total + "\n" +
        "通过规则：" + a.summary.passed + "/" + a.summary.total + "\n" +
        "高风险失败：" + a.summary.highFail + "\n" +
        "风险证据数：" + a.risks.length + "\n" +
        "修正任务数：" + a.plan.length + "\n" +
        "声明：本摘要由本地规则引擎根据导入数据生成。";
      copyText(summary);
    });
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast("已复制报告摘要到剪贴板。", "ok"); }, function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    } catch (e) { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      toast(ok ? "已复制报告摘要。" : "复制失败，请手动选择文本。", ok ? "ok" : "bad");
    } catch (e) { toast("复制失败：" + e.message, "bad"); }
  }

  /* ===================== 抽屉 ===================== */
  function openDrawer() {
    closeSidebar(); /* 避免移动端侧栏与抽屉同时打开 */
    $("drawer").classList.add("is-open");
    $("drawer").setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    $("drawer").classList.remove("is-open");
    $("drawer").setAttribute("aria-hidden", "true");
  }

  /* ===================== Modal ===================== */
  function openModal(id) {
    var m = $(id);
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
  }
  function closeModal(id) {
    var m = $(id);
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
  }

  /* ===================== 导入审计包 ===================== */
  var pendingFile = null;
  function onFileChange(e) {
    var f = e.target.files && e.target.files[0];
    pendingFile = f || null;
    if (!f) {
      // 用户取消文件选择
      $("importHint").innerHTML = '未选择文件。提示：可载入 <code>mdi-gru-baseline.json</code> 或 <code>mdi-gru-improved.json</code>。';
      return;
    }
    // 检查文件扩展名
    var lower = f.name.toLowerCase();
    if (!/\.json$/.test(lower)) {
      $("importHint").innerHTML = '<span style="color:var(--bad)">不支持的文件扩展名：仅支持 .json 文件。已选择 <code>' + esc(f.name) + '</code>。</span>';
      toast("不支持的文件扩展名，请选择 .json 文件。", "bad");
      pendingFile = null;
      $("importFile").value = "";
      return;
    }
    // 检查空文件
    if (f.size === 0) {
      $("importHint").innerHTML = '<span style="color:var(--bad)">文件为空：<code>' + esc(f.name) + '</code>（0 字节）。请选择有效的 JSON 审计包。</span>';
      toast("导入失败：文件为空。", "bad");
      pendingFile = null;
      $("importFile").value = "";
      return;
    }
    $("importHint").innerHTML = "已选择：<code>" + esc(f.name) + "</code>（" + f.size + " 字节），点击「载入文件」。";
  }
  function doImport() {
    if (!pendingFile) { toast("请先选择一个 JSON 文件。", "bad"); return; }
    var btn = $("btnImportConfirm");
    if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }
    var reader = new FileReader();
    reader.onload = function () {
      var raw = reader.result;
      // 再次检查空内容
      if (!raw || !String(raw).trim()) {
        $("importHint").innerHTML = '<span style="color:var(--bad)">文件内容为空，无法解析为 JSON。</span>';
        toast("导入失败：文件内容为空。", "bad");
        if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
        return;
      }
      var data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        $("importHint").innerHTML = '<span style="color:var(--bad)">JSON 语法错误：' + esc(err.message) + "</span>";
        toast("JSON 解析失败：" + err.message, "bad");
        if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
        return;
      }
      // 使用引擎校验必要字段
      var v = E.validateProjectPackage(data);
      if (!v.valid) {
        $("importHint").innerHTML = '<span style="color:var(--bad)">字段校验失败：' + v.errors.map(esc).join("；") + "</span>";
        toast("审计包字段缺失：" + v.errors.join("；"), "bad");
        if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
        return;
      }
      try {
        state.project = data;
        state.repairApplied = false;
        state.auditRun = false;
        state.beforeAudit = null;
        state.afterAudit = null;
        state.comparison = null;
        state.filters = { risks: "all", steps: "all", plan: "all" };
        closeModal("modalImport");
        runAuditOnCurrent(true);
        setRoute("overview", true);
        toast("已载入审计包：" + pendingFile.name + "，并通过校验与审计。", "ok");
        pendingFile = null;
        $("importFile").value = "";
      } catch (err) {
        toast("载入后渲染失败：" + (err && err.message ? err.message : String(err)), "bad");
      } finally {
        if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
      }
    };
    reader.onerror = function () {
      toast("读取文件失败，请检查文件是否可访问。", "bad");
      if (btn) { btn.classList.remove("is-loading"); btn.disabled = false; }
    };
    reader.readAsText(pendingFile, "UTF-8");
  }

  /* 下载示例审计包（使用内置 baseline 数据生成） */
  function downloadSample() {
    try {
      var json = JSON.stringify(D.baseline, null, 2);
      var ok = R.downloadTextFile("mdi-gru-baseline-sample.json", json, "application/json");
      toast(ok ? "已下载示例审计包（mdi-gru-baseline-sample.json）。" : "当前环境不支持下载。", ok ? "ok" : "bad");
    } catch (e) { toast("下载失败：" + e.message, "bad"); }
  }

  /* ===================== 重置 ===================== */
  function resetDemo() {
    state.project = deepClone(D.baseline);
    state.repairApplied = false;
    state.auditRun = false;
    state.beforeAudit = null;
    state.afterAudit = null;
    state.comparison = null;
    state.filters = { risks: "all", steps: "all", plan: "all" };
    runAuditOnCurrent(false);
    setRoute("overview", true);
    // 明确反馈：用状态条 + Toast 双重提示
    var proj = state.project.project || {};
    toast("已重置为内置 MDI+GRU 基线示例「" + (proj.name || "") + "」，并完成重新审计。", "ok");
  }

  /* ===================== 首页装饰：十六进制流 ===================== */
  function renderHexStream() {
    var el = $("hexStream");
    if (!el) return;
    var chars = "0123456789abcdef";
    var lines = [];
    for (var i = 0; i < 26; i++) {
      var s = "";
      for (var j = 0; j < 48; j++) {
        if (j && j % 2 === 0) s += " ";
        s += chars.charAt(Math.floor(Math.random() * 16));
      }
      lines.push(s);
    }
    el.textContent = lines.join("\n");
  }

  /* ===================== 首次使用引导 ===================== */
  var ONBOARD_KEY = "repropilot_onboard_done";
  var onboardStep = 1;
  function shouldShowOnboard() {
    try { return localStorage.getItem(ONBOARD_KEY) !== "1"; } catch (e) { return true; }
  }
  function markOnboardDone() {
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch (e) {}
  }
  function showOnboard() {
    onboardStep = 1;
    updateOnboardStep();
    openModal("modalOnboard");
  }
  function updateOnboardStep() {
    var steps = document.querySelectorAll(".onboard-step");
    var dots = document.querySelectorAll(".onboard-dot");
    for (var i = 0; i < steps.length; i++) {
      var n = i + 1;
      steps[i].classList.toggle("is-active", n === onboardStep);
    }
    for (var d = 0; d < dots.length; d++) {
      var dn = d + 1;
      dots[d].classList.toggle("is-active", dn === onboardStep);
      dots[d].classList.toggle("is-done", dn < onboardStep);
    }
    var nextBtn = $("btnOnboardNext");
    if (nextBtn) nextBtn.textContent = onboardStep >= 4 ? "开始体验" : "下一步";
  }
  function onboardNext() {
    if (onboardStep >= 4) {
      markOnboardDone();
      closeModal("modalOnboard");
      goApp();
      return;
    }
    onboardStep++;
    updateOnboardStep();
  }
  function onboardSkip() {
    markOnboardDone();
    closeModal("modalOnboard");
  }

  /* ===================== 绑定事件 ===================== */
  function bind() {
    // 首页按钮
    $("btnLoadDemo").addEventListener("click", goApp);
    $("btnProductLoad").addEventListener("click", function () { closeModal("modalProduct"); goApp(); });
    $("btnProduct").addEventListener("click", function () { openModal("modalProduct"); });
    $("btnHomeProduct").addEventListener("click", function () { openModal("modalProduct"); });
    $("btnHomeAbout").addEventListener("click", function () { openModal("modalAbout"); });
    $("btnImport").addEventListener("click", function () { openModal("modalImport"); });

    // Modal 关闭
    $("btnCloseProduct").addEventListener("click", function () { closeModal("modalProduct"); });
    $("btnCloseImport").addEventListener("click", function () { closeModal("modalImport"); });
    $("btnImportCancel").addEventListener("click", function () { closeModal("modalImport"); });
    $("btnImportConfirm").addEventListener("click", doImport);
    $("btnDownloadSample").addEventListener("click", downloadSample);
    $("importFile").addEventListener("change", onFileChange);

    // 关于 Demo
    $("btnCloseAbout").addEventListener("click", function () { closeModal("modalAbout"); });
    $("btnAboutClose").addEventListener("click", function () { closeModal("modalAbout"); });

    // 首次使用引导
    $("btnCloseOnboard").addEventListener("click", onboardSkip);
    $("btnOnboardSkip").addEventListener("click", onboardSkip);
    $("btnOnboardNext").addEventListener("click", onboardNext);

    // 侧栏导航
    var navs = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navs.length; i++) {
      navs[i].addEventListener("click", function () {
        setRoute(this.getAttribute("data-route"), true);
      });
    }

    // 工作台顶栏
    $("btnBackHome").addEventListener("click", goHome);
    $("btnReset").addEventListener("click", resetDemo);
    $("btnToggleNav").addEventListener("click", function () {
      var sb = $("sidebar");
      if (sb.classList.contains("is-open")) closeSidebar(); else openSidebar();
    });

    // 抽屉关闭
    $("btnCloseDrawer").addEventListener("click", closeDrawer);
    $("btnDrawerClose").addEventListener("click", closeDrawer);
    $("drawerScrim").addEventListener("click", closeDrawer);

    // ESC 关闭抽屉/弹窗
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("drawer").classList.contains("is-open")) { closeDrawer(); return; }
      if ($("modalProduct").classList.contains("is-open")) { closeModal("modalProduct"); return; }
      if ($("modalImport").classList.contains("is-open")) { closeModal("modalImport"); return; }
      if ($("modalAbout").classList.contains("is-open")) { closeModal("modalAbout"); return; }
      if ($("modalOnboard").classList.contains("is-open")) { onboardSkip(); return; }
    });

    // 源码映射表格行点击 -> 跳转步骤详情
    document.addEventListener("click", function (e) {
      var tr = e.target.closest ? e.target.closest("tr.row-clickable[data-step]") : null;
      if (tr && state.route === "mapping") {
        openStepDrawer(tr.getAttribute("data-step"));
      }
    });
  }

  /* ===================== 启动 ===================== */
  function init() {
    renderHexStream();
    bind();
    goHome();
    // 首次使用引导（仅首次访问展示，可跳过）
    if (shouldShowOnboard()) {
      showOnboard();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
