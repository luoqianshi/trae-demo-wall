/*
 * 研复通 ReproPilot —— 报告生成 js/report.js
 *
 * 设计目标：
 *  - UMD/CommonJS 兼容：浏览器端挂到 window.ReproReport，Node 端 module.exports；
 *  - 不依赖 DOM 计算，仅 downloadTextFile 在浏览器触发下载；
 *  - 报告内容全部由传入的 project 与 audit 计算，不写死结论。
 *
 * 暴露函数：
 *   1. generateMarkdownReport(project, audit)  —— 返回 Markdown 字符串
 *   2. generateJsonReport(project, audit)      —— 返回 JSON 字符串
 *   3. downloadTextFile(filename, content, mimeType) —— 浏览器触发下载
 *
 * audit 结构约定（由 app.js 组装）：
 *   {
 *     results:   runAudit().results,
 *     summary:   runAudit().summary,
 *     score:     calculateScore().score,
 *     breakdown: calculateScore().breakdown,
 *     risks:     generateRiskItems(),
 *     plan:      generateRepairPlan(),
 *     validated: validateProjectPackage()
 *   }
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.ReproReport = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isObj(v) { return v !== null && typeof v === "object"; }
  function isArr(v) { return Array.isArray(v); }
  function isNonEmptyStr(v) { return typeof v === "string" && v.length > 0; }
  function safe(v, fallback) { return (v == null || v === "") ? (fallback || "—") : String(v); }

  /* ISO 时间，浏览器与 Node 均可用 */
  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return ""; }
  }

  /* 计算论文步骤统计（若 audit.results 中含 R12.stats 优先用之，否则现场统计） */
  function paperStepStats(project, audit) {
    var fromR12 = null;
    if (audit && isArr(audit.results)) {
      for (var i = 0; i < audit.results.length; i++) {
        if (audit.results[i] && audit.results[i].ruleId === "R12" && audit.results[i].stats) {
          fromR12 = audit.results[i].stats; break;
        }
      }
    }
    if (fromR12) return fromR12;
    var steps = (project && isArr(project.paperSteps)) ? project.paperSteps : [];
    var c = { implemented: 0, partial: 0, alternative: 0, not_implemented: 0, no_evidence: 0 };
    for (var j = 0; j < steps.length; j++) {
      var s = steps[j] || {}; var st = s.status;
      if (st === "implemented") c.implemented++;
      else if (st === "partial") c.partial++;
      else if (st === "alternative") c.alternative++;
      else if (st === "not_implemented") c.not_implemented++;
      else c.no_evidence++;
    }
    return c;
  }

  var SEVERITY_TEXT = { high: "高风险", medium: "中风险", low: "低风险", resolved: "已解决" };
  var STATUS_TEXT = {
    implemented: "已实现", partial: "部分实现", alternative: "替代实现",
    not_implemented: "未实现", pending: "待核验", no_evidence: "无证据"
  };

  /* ===================== 1. generateMarkdownReport ===================== */
  function generateMarkdownReport(project, audit) {
    audit = audit || {};
    var p = isObj(project) ? project : {};
    var proj = isObj(p.project) ? p.project : {};
    var run = isObj(p.run) ? p.run : {};
    var results = isArr(audit.results) ? audit.results : [];
    var summary = audit.summary || { total: 0, passed: 0, failed: 0, highFail: 0 };
    var score = isObj(audit.score) ? audit.score : { score: 0, total: 100 };
    var breakdown = isArr(audit.breakdown) ? audit.breakdown : [];
    var risks = isArr(audit.risks) ? audit.risks : [];
    var plan = isArr(audit.plan) ? audit.plan : [];
    var validated = audit.validated || { valid: true, errors: [] };
    var stats = paperStepStats(p, audit);

    var lines = [];
    lines.push("# 研复通 ReproPilot 审计报告");
    lines.push("");
    lines.push("> 本报告由本地规则引擎根据导入数据生成，所有结论均可追溯到具体规则与证据。");
    lines.push("");

    lines.push("## 一、项目基本信息");
    lines.push("");
    lines.push("- **项目名称**：" + safe(proj.name));
    lines.push("- **当前阶段**：" + safe(proj.stage));
    lines.push("- **审计时间**：" + safe(nowIso()));
    lines.push("- **Run ID**：" + safe(run.run_id));
    lines.push("- **运行时间**：" + safe(run.run_time));
    lines.push("- **输入摘要**：" + safe(run.input_summary));
    if (isArr(proj.pipeline) && proj.pipeline.length) {
      lines.push("- **主流程**：" + proj.pipeline.join(" → "));
    }
    lines.push("");

    lines.push("## 二、综合可信度评分");
    lines.push("");
    lines.push("- **总分**：" + score.score + " / " + (score.total || 100));
    lines.push("- **高风险失败规则数**：" + summary.highFail);
    lines.push("- **已通过规则**：" + summary.passed + " / " + summary.total);
    lines.push("");
    if (breakdown.length) {
      lines.push("| 评分维度 | 满分 | 实得 |");
      lines.push("| --- | ---: | ---: |");
      for (var bi = 0; bi < breakdown.length; bi++) {
        var b = breakdown[bi];
        lines.push("| " + dimText(b.dimension) + " | " + b.full + " | " + b.score + " |");
      }
      lines.push("");
    }

    lines.push("## 三、论文步骤映射统计");
    lines.push("");
    lines.push("| 状态 | 数量 |");
    lines.push("| --- | ---: |");
    lines.push("| 已实现 | " + stats.implemented + " |");
    lines.push("| 部分实现 | " + stats.partial + " |");
    lines.push("| 替代实现 | " + stats.alternative + " |");
    lines.push("| 未实现 | " + stats.not_implemented + " |");
    lines.push("| 无证据 | " + stats.no_evidence + " |");
    lines.push("");
    if (isArr(p.paperSteps) && p.paperSteps.length) {
      lines.push("### 论文步骤明细");
      lines.push("");
      lines.push("| 步骤 | 要求 | 状态 | 风险 |");
      lines.push("| --- | --- | --- | --- |");
      for (var si = 0; si < p.paperSteps.length; si++) {
        var st = p.paperSteps[si] || {};
        lines.push("| " + safe(st.id) + " | " + safe(st.requirement) + " | " + (STATUS_TEXT[st.status] || "待核验") + " | " + (SEVERITY_TEXT[st.riskLevel] || safe(st.riskLevel)) + " |");
      }
      lines.push("");
    }

    lines.push("## 四、规则审计结果");
    lines.push("");
    var passedRules = [], failedRules = [];
    for (var ri = 0; ri < results.length; ri++) {
      (results[ri].passed ? passedRules : failedRules).push(results[ri]);
    }
    lines.push("### 已通过规则（" + passedRules.length + " 条）");
    lines.push("");
    if (passedRules.length) {
      for (var pi = 0; pi < passedRules.length; pi++) {
        lines.push("- " + passedRules[pi].ruleId + " " + passedRules[pi].name);
      }
    } else {
      lines.push("- （无）");
    }
    lines.push("");
    lines.push("### 未通过规则（" + failedRules.length + " 条）");
    lines.push("");
    if (failedRules.length) {
      for (var fi = 0; fi < failedRules.length; fi++) {
        var r = failedRules[fi];
        lines.push("- " + r.ruleId + " " + r.name + "（" + (SEVERITY_TEXT[r.severity] || r.severity) + "）");
      }
    } else {
      lines.push("- （无）");
    }
    lines.push("");

    lines.push("## 五、风险证据");
    lines.push("");
    if (risks.length) {
      for (var rk = 0; rk < risks.length; rk++) {
        var risk = risks[rk];
        lines.push("### " + risk.ruleId + " " + risk.name + "（" + (SEVERITY_TEXT[risk.severity] || risk.severity) + "）");
        lines.push("");
        lines.push("- **论文/方案要求**：" + safe(risk.paper));
        lines.push("- **当前实现值**：" + safe(risk.actual));
        lines.push("- **为什么危险**：" + safe(risk.danger));
        lines.push("- **证据来源**：" + (isArr(risk.evidence) && risk.evidence.length ? risk.evidence.join("；") : "—"));
        lines.push("- **涉及文件或字段**：" + (isArr(risk.files) && risk.files.length ? risk.files.join("、") : "—"));
        lines.push("- **推荐修复方式**：" + safe(risk.fix));
        lines.push("- **验收标准**：" + safe(risk.acceptance));
        lines.push("");
      }
    } else {
      lines.push("本次审计未发现风险项。");
      lines.push("");
    }

    lines.push("## 六、分轮次修正计划");
    lines.push("");
    if (plan.length) {
      var byP = { P0: [], P1: [], P2: [] };
      for (var pj = 0; pj < plan.length; pj++) { (byP[plan[pj].priority] || (byP.P2)).push(plan[pj]); }
      var prioOrder = ["P0", "P1", "P2"];
      var prioDesc = { P0: "P0 会导致字段整体错位或结果不可追溯", P1: "P1 影响实验可信度", P2: "P2 影响报告完整度或使用体验" };
      for (var po = 0; po < prioOrder.length; po++) {
        var arr = byP[prioOrder[po]];
        if (!arr.length) continue;
        lines.push("### " + prioDesc[prioOrder[po]] + "（" + arr.length + " 项）");
        lines.push("");
        for (var ai = 0; ai < arr.length; ai++) {
          var t = arr[ai];
          lines.push("#### " + t.id + " · " + t.riskName);
          lines.push("");
          lines.push("- **对应风险**：" + t.relatedRule);
          lines.push("- **目标**：" + safe(t.target));
          lines.push("- **建议修改文件**：" + safe(t.file));
          lines.push("- **预期代码变化**：" + safe(t.codeChange));
          lines.push("- **必须运行的测试**：" + (isArr(t.mustRunTests) && t.mustRunTests.length ? t.mustRunTests.join("、") : "—"));
          lines.push("- **预期产物**：" + safe(t.expectedArtifact));
          lines.push("- **完成定义**：" + safe(t.definitionOfDone));
          lines.push("- **禁止事项**：" + safe(t.forbidden));
          lines.push("");
        }
      }
    } else {
      lines.push("本次审计无失败规则，未生成修正计划。");
      lines.push("");
    }

    lines.push("## 七、测试信息");
    lines.push("");
    lines.push("- **测试命令**：`" + safe(run.test_command) + "`");
    lines.push("- **退出码**：" + (has(run, "exit_code") ? run.exit_code : "—"));
    lines.push("- **通过数**：" + safe(run.test_passed, "0"));
    lines.push("- **失败数**：" + safe(run.test_failed, "0"));
    lines.push("");

    lines.push("## 八、验收产物");
    lines.push("");
    if (isArr(run.artifacts) && run.artifacts.length) {
      for (var ar = 0; ar < run.artifacts.length; ar++) {
        lines.push("- `" + run.artifacts[ar] + "`");
      }
    } else {
      lines.push("- （无产物）");
    }
    lines.push("");

    lines.push("## 九、审计包校验");
    lines.push("");
    lines.push("- **Schema 校验**：" + (validated.valid ? "通过" : "失败"));
    if (isArr(validated.errors) && validated.errors.length) {
      for (var ei = 0; ei < validated.errors.length; ei++) {
        lines.push("  - " + validated.errors[ei]);
      }
    }
    lines.push("");

    lines.push("## 十、声明");
    lines.push("");
    lines.push("本报告由本地规则引擎根据导入数据生成，不调用任何外部 API，不上传任何文件；所有风险、评分与修正计划均由 R01–R12 规则与失败项动态计算得出，未写死任何结论。");
    lines.push("");

    return lines.join("\n");
  }

  function dimText(dim) {
    return ({
      paper: "论文步骤映射（20）",
      traceability: "数据可追溯性（20）",
      boundary: "边界与分组科学性（25）",
      gru: "GRU请求与结果完整性（20）",
      test: "测试与产物真实性（15）"
    })[dim] || dim;
  }

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }

  /* ===================== 2. generateJsonReport ===================== */
  function generateJsonReport(project, audit) {
    audit = audit || {};
    var p = isObj(project) ? project : {};
    var proj = isObj(p.project) ? p.project : {};
    var run = isObj(p.run) ? p.run : {};
    var results = isArr(audit.results) ? audit.results : [];
    var summary = audit.summary || { total: 0, passed: 0, failed: 0, highFail: 0 };
    var score = isObj(audit.score) ? audit.score : { score: 0, total: 100 };
    var breakdown = isArr(audit.breakdown) ? audit.breakdown : [];
    var risks = isArr(audit.risks) ? audit.risks : [];
    var plan = isArr(audit.plan) ? audit.plan : [];
    var validated = audit.validated || { valid: true, errors: [] };
    var stats = paperStepStats(p, audit);

    var passedRules = [], failedRules = [];
    for (var i = 0; i < results.length; i++) {
      (results[i].passed ? passedRules : failedRules).push(results[i].ruleId);
    }

    var report = {
      reportVersion: "1.0",
      generator: "研复通 ReproPilot 本地规则引擎",
      generatedAt: nowIso(),
      project: {
        name: proj.name || "",
        stage: proj.stage || "",
        pipeline: isArr(proj.pipeline) ? proj.pipeline : []
      },
      run: {
        run_id: run.run_id || "",
        run_time: run.run_time || "",
        input_summary: run.input_summary || "",
        test_command: run.test_command || "",
        exit_code: has(run, "exit_code") ? run.exit_code : null,
        test_passed: run.test_passed || 0,
        test_failed: run.test_failed || 0,
        artifacts: isArr(run.artifacts) ? run.artifacts : []
      },
      credibility: {
        total: score.total || 100,
        score: score.score || 0,
        breakdown: breakdown,
        highFail: summary.highFail || 0
      },
      paperStepStats: stats,
      ruleAudit: {
        summary: summary,
        passedRules: passedRules,
        failedRules: failedRules,
        results: results
      },
      risks: risks,
      repairPlan: plan,
      validation: validated,
      statement: "本报告由本地规则引擎根据导入数据生成，不调用任何外部 API，不上传任何文件；所有风险、评分与修正计划均由 R01–R12 规则与失败项动态计算得出，未写死任何结论。"
    };
    return JSON.stringify(report, null, 2);
  }

  /* ===================== 3. downloadTextFile ===================== */
  /* 浏览器端触发下载；Node 端无 document/Blob 时静默返回 false，便于测试。 */
  function downloadTextFile(filename, content, mimeType) {
    try {
      if (typeof document === "undefined" || typeof Blob === "undefined") return false;
      var blob = new Blob([content], { type: (mimeType || "text/plain") + ";charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename || "download.txt";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        try { URL.revokeObjectURL(url); } catch (e) {}
      }, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    generateMarkdownReport: generateMarkdownReport,
    generateJsonReport: generateJsonReport,
    downloadTextFile: downloadTextFile
  };
}));
