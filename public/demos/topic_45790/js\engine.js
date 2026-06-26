/*
 * 研复通 ReproPilot —— 审计引擎 js/engine.js
 *
 * 设计目标：
 *  - 规则引擎可复用，不操作 DOM，与页面渲染分离；
 *  - UMD/CommonJS 兼容：既可被 <script> 加载（挂到 window.ReproEngine），
 *    也可被 Node 测试 require('./engine.js')；
 *  - 所有审计结论（风险、分数、修正计划、对比）均由数据与规则计算产生，
 *    不存在固定写死的“发现 N 个问题”或“审计通过”。
 *
 * 暴露的核心函数：
 *   1. validateProjectPackage(data)        —— 审计包 schema 校验
 *   2. runAudit(data)                       —— 执行 12 条规则 R01–R12
 *   3. calculateScore(results)              —— 计算可信度评分（满分 100）
 *   4. generateRiskItems(results)           —— 由失败规则生成风险证据
 *   5. generateRepairPlan(results)          —— 由失败规则生成优先级修正计划
 *   6. applyDemoRepairs(data)               —— 模拟“应用示例修复”，返回修复后数据
 *   7. compareAudits(before, after)         —— 对比修复前后两次审计
 *
 * 规则编号 R01–R12 与 README / SESSION2_RESULT 严格对应。
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.ReproEngine = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ===================== 工具 ===================== */
  function isObj(v) { return v !== null && typeof v === "object"; }
  function isArr(v) { return Array.isArray(v); }
  function isInt(v) { return typeof v === "number" && isFinite(v) && Math.floor(v) === v; }
  function isNonEmptyStr(v) { return typeof v === "string" && v.length > 0; }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function uniq(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      var k = arr[i];
      if (!seen[k]) { seen[k] = 1; out.push(k); }
    }
    return out;
  }

  /* ===================== 规则定义 ===================== */
  /* 每条规则声明：编号、名称、严重度、所属评分维度、论文要求、为什么危险、推荐修复、验收标准、默认涉及文件 */
  var RULES = {
    R01: {
      id: "R01", name: "message_id 可追溯", severity: "high", dimension: "traceability",
      paper: "每条消息或字段记录必须具有非空 message_id；不得重复；映射结果可回到原消息。",
      danger: "一旦 message_id 缺失或重复，字段切片与源消息无法对应，整条复现链条断裂，结果不可追溯。",
      fix: "为每条消息生成唯一 message_id；在合并与导出阶段强制非空校验；对重复 ID 抛错。",
      acceptance: "所有消息与结果均能通过 message_id 反查到唯一源消息，无空值、无重复。",
      files: ["messages[].message_id", "gru.results[].message_id"]
    },
    R02: {
      id: "R02", name: "边界单位正确", severity: "high", dimension: "boundary",
      paper: "offset_unit 必须为 byte；边界值为整数；0 ≤ start < end；end ≤ 消息字节长度；不得把十六进制字符位置当作字节位置。",
      danger: "单位错误或越界会让字段切片整体偏移，程序虽能运行，但切到的是错误字节，后续语义推断全部失真。",
      fix: "统一 offset_unit=byte；启动期校验整数性与范围；禁止 hex_char 作为单位；越界直接抛异常。",
      acceptance: "所有字段边界均为字节级整数，且满足 0 ≤ start < end ≤ byte_length。",
      files: ["messages[].fields[]"]
    },
    R03: {
      id: "R03", name: "必须使用逐消息边界", severity: "high", dimension: "boundary",
      paper: "formal_gru_input_boundary_source 必须为 per_message；不允许 protocol_representative；不允许从旧 .out 文件猜测丢失的 message_id。",
      danger: "使用协议代表性边界而非逐消息边界，会掩盖单条消息的字段差异，丢失真实切片，导致审计无法回溯。",
      fix: "将边界来源改为 per_message；删除对 .out 历史文件的猜测路径；逐消息保存边界。",
      acceptance: "formal_gru_input_boundary_source === 'per_message'，且无 .out 猜测路径。",
      files: ["gru.formal_gru_input_boundary_source"]
    },
    R04: {
      id: "R04", name: "严格分组", severity: "high", dimension: "boundary",
      paper: "同一 GRU request 组内必须同时满足：direction 相同、boundaries 完全相同、field_count 相同、message_limit 相同。",
      danger: "混合方向或边界不一致的消息进入同一组，会让 GRU 对错误切片推断，字段对齐错位且无告警。",
      fix: "在 strict_group() 中按 direction+boundaries+field_count+message_limit 联合分组；任一不同不得同组。",
      acceptance: "每个 request 内所有消息的 direction、boundaries、field_count、message_limit 完全一致。",
      files: ["gru.requests[]"]
    },
    R05: {
      id: "R05", name: "禁止复制消息凑数量", severity: "high", dimension: "boundary",
      paper: "copy_messages_to_ten 必须为 false。",
      danger: "复制消息凑满 10 条会制造虚假样本，污染统计与模型推断，复现结果不可信。",
      fix: "关闭 copy_messages_to_ten；不足 10 条时按真实数量构造 request。",
      acceptance: "copy_messages_to_ten === false，且 request.message_ids 无重复。",
      files: ["gru.copy_messages_to_ten"]
    },
    R06: {
      id: "R06", name: "禁止最短消息静默截断", severity: "high", dimension: "boundary",
      paper: "truncate_to_shortest 必须为 false。",
      danger: "静默截断会让字段位置整体偏移，程序虽能运行，但后续语义属于错误字段。",
      fix: "拒绝不满足统一 message_limit 的分组，不允许静默截断；启动期配置校验。",
      acceptance: "truncate_to_shortest === false。",
      files: ["gru.truncate_to_shortest"]
    },
    R07: {
      id: "R07", name: "GRU 核心保持不变", severity: "high", dimension: "gru",
      paper: "model_weights_mutable 必须为 false；semantic_centers_mutable 必须为 false；不得通过修改模型核心迁就错误输入。",
      danger: "修改模型权重或语义中心会改变推断结果，使复现不可重复，等同于伪造实验。",
      fix: "将权重与语义中心设为只读；任何输入问题都不得通过改模型核心绕过。",
      acceptance: "model_weights_mutable === false 且 semantic_centers_mutable === false。",
      files: ["gru.model_weights_mutable", "gru.semantic_centers_mutable"]
    },
    R08: {
      id: "R08", name: "请求可重新解析", severity: "high", dimension: "gru",
      paper: "GRU request 必须存在；包含 schema_version；包含 group_key；能重新解析；字段切片与边界一致。",
      danger: "request 不可重新解析意味着下游无法验证结构一致性，结果可能来自不可复现的中间态。",
      fix: "为每个 request 写入 schema_version 与 group_key；新增 build→parse 回环测试；校验 field_count 与 boundaries 长度一致。",
      acceptance: "每个 request 含 schema_version、group_key、reparse_ok=true，且 field_count == boundaries.length。",
      files: ["gru.schema_version", "gru.requests[]"]
    },
    R09: {
      id: "R09", name: "结果可追溯", severity: "high", dimension: "traceability",
      paper: "最终结果必须包含：message_id、direction、field_index、start、end、field_hex、semantic_candidate、confidence、source_request_id。",
      danger: "结果字段缺失会让消费方无法定位字段来源，无法回放，无法验收。",
      fix: "在 merge_results() 与 export 阶段强制九字段完整性校验；缺失即拒绝输出。",
      acceptance: "每条 result 均含九个必备字段且 source_request_id 能映射到某 request。",
      files: ["gru.results[]"]
    },
    R10: {
      id: "R10", name: "产物真实性", severity: "high", dimension: "gru",
      paper: "结果必须来自当前 run_id；存在运行时间；存在输入摘要；不允许使用历史 JSON 冒充新运行结果。",
      danger: "用历史 JSON 冒充新运行会伪造复现证据，使审计失去意义。",
      fix: "运行时强制写入 run_id、run_time、input_summary；导出阶段校验产物 run_id 与当前一致。",
      acceptance: "run.run_id 非空、run_time 非空、input_summary 非空，且 historical_run_ids 未被引用。",
      files: ["run.run_id", "run.run_time", "run.input_summary", "run.historical_run_ids"]
    },
    R11: {
      id: "R11", name: "测试闭环", severity: "high", dimension: "test",
      paper: "测试命令存在；exit_code 存在；passed/failed 数量存在；存在未解释失败时不得判为通过；不允许只用空测试证明功能正确。",
      danger: "未解释的失败被判定为通过，会让缺陷流入验收；空测试无法证明任何功能。",
      fix: "记录 test_command、exit_code、passed/failed；test_failed>0 时强制 exit_code!=0；禁止空测试。",
      acceptance: "test_command 非空、exit_code 存在、passed+failed>0，且 test_failed>0 ⇒ 非“通过”。",
      files: ["run.test_command", "run.exit_code", "run.test_passed", "run.test_failed"]
    },
    R12: {
      id: "R12", name: "论文步骤映射完整度", severity: "medium", dimension: "paper",
      paper: "统计已实现 / 部分实现 / 替代实现 / 未实现 / 无证据 的论文步骤数量。",
      danger: "步骤映射不完整会让复现进度不可量化，难以判断是否达到验收门槛。",
      fix: "为每个论文步骤标注状态与证据；未实现项进入修正计划。",
      acceptance: "每个论文步骤均有明确状态与证据，统计可计算。",
      files: ["paperSteps[]"]
    }
  };

  var RULE_ORDER = ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10", "R11", "R12"];

  /* 评分维度权重（满分 100） */
  var SCORE_WEIGHTS = {
    paper: 20,        // R12
    traceability: 20, // R01, R09
    boundary: 25,     // R02, R03, R04, R05, R06
    gru: 20,          // R07, R08, R10
    test: 15          // R11
  };

  /* ===================== 1. validateProjectPackage ===================== */
  /* 校验审计包基础结构，返回 { valid, errors }。不抛异常。 */
  function validateProjectPackage(data) {
    var errors = [];
    if (!isObj(data)) { return { valid: false, errors: ["审计包必须是一个 JSON 对象。"] }; }
    if (!isObj(data.project)) { errors.push("缺少 project 字段或类型错误。"); }
    else {
      if (!isNonEmptyStr(data.project.name)) { errors.push("project.name 缺失或为空。"); }
      if (!isNonEmptyStr(data.project.stage)) { errors.push("project.stage 缺失或为空。"); }
      if (!isArr(data.project.pipeline)) { errors.push("project.pipeline 必须为数组。"); }
    }
    if (!isArr(data.paperSteps)) { errors.push("paperSteps 必须为数组。"); }
    else if (data.paperSteps.length === 0) { errors.push("paperSteps 不能为空。"); }
    if (!isArr(data.sourceMappings)) { errors.push("sourceMappings 必须为数组。"); }
    if (!isObj(data.run)) { errors.push("缺少 run 字段或类型错误。"); }
    else {
      if (!isNonEmptyStr(data.run.run_id)) { errors.push("run.run_id 缺失或为空。"); }
    }
    if (!isArr(data.messages)) { errors.push("messages 必须为数组。"); }
    if (!isObj(data.gru)) { errors.push("缺少 gru 字段或类型错误。"); }
    return { valid: errors.length === 0, errors: errors };
  }

  /* ===================== 单条规则检查器 ===================== */
  /* 每个检查器返回 { passed, evidence: [..], actual, required } */
  function checkR01(data) {
    var ev = [];
    var msgs = isArr(data.messages) ? data.messages : [];
    var idMap = {};
    var emptyCount = 0, dupCount = 0;
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i] || {};
      var mid = m.message_id;
      if (!isNonEmptyStr(mid)) {
        emptyCount++;
        ev.push("第 " + (i + 1) + " 条消息 message_id 为空。");
      } else if (idMap[mid]) {
        dupCount++;
        ev.push("message_id 重复：" + mid + "（第 " + (i + 1) + " 条与第 " + idMap[mid] + " 条）。");
      } else {
        idMap[mid] = (i + 1);
      }
    }
    // 结果能否回到原消息
    var results = data.gru && isArr(data.gru.results) ? data.gru.results : [];
    var orphan = 0;
    for (var j = 0; j < results.length; j++) {
      var rid = results[j] && results[j].message_id;
      if (isNonEmptyStr(rid) && !idMap[rid]) {
        orphan++;
        ev.push("结果中的 message_id 无法回到原消息：" + rid + "。");
      }
    }
    var passed = emptyCount === 0 && dupCount === 0 && orphan === 0;
    return {
      passed: passed,
      evidence: ev,
      actual: "空 " + emptyCount + " 条 / 重复 " + dupCount + " 处 / 孤立结果 " + orphan + " 处",
      required: "全量 message_id 非空、唯一、可回到原消息"
    };
  }

  function checkR02(data) {
    var ev = [];
    var msgs = isArr(data.messages) ? data.messages : [];
    var badUnit = 0, badInt = 0, badRange = 0, overflow = 0;
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i] || {};
      var len = m.byte_length;
      var fields = isArr(m.fields) ? m.fields : [];
      for (var k = 0; k < fields.length; k++) {
        var f = fields[k] || {};
        if (f.offset_unit !== "byte") {
          badUnit++;
          ev.push("消息 " + (m.message_id || ("#" + (i + 1))) + " 字段 " + f.field_index + " 的 offset_unit=" + f.offset_unit + "（应为 byte）。");
        }
        if (!isInt(f.start) || !isInt(f.end)) {
          badInt++;
          ev.push("消息 " + (m.message_id || ("#" + (i + 1))) + " 字段 " + f.field_index + " 边界非整数（start=" + f.start + ", end=" + f.end + "）。");
        } else {
          if (!(f.start >= 0 && f.end > f.start)) {
            badRange++;
            ev.push("消息 " + (m.message_id || ("#" + (i + 1))) + " 字段 " + f.field_index + " 不满足 0 ≤ start < end（start=" + f.start + ", end=" + f.end + "）。");
          }
          if (isInt(len) && f.end > len) {
            overflow++;
            ev.push("消息 " + (m.message_id || ("#" + (i + 1))) + " 字段 " + f.field_index + " end=" + f.end + " 超过字节长度 " + len + "。");
          }
        }
      }
    }
    var passed = badUnit === 0 && badInt === 0 && badRange === 0 && overflow === 0;
    return {
      passed: passed,
      evidence: ev,
      actual: "单位错误 " + badUnit + " / 非整数 " + badInt + " / 范围错误 " + badRange + " / 越界 " + overflow,
      required: "全部 offset_unit=byte，整数边界，0 ≤ start < end ≤ byte_length"
    };
  }

  function checkR03(data) {
    var ev = [];
    var src = data.gru && data.gru.formal_gru_input_boundary_source;
    var passed = src === "per_message";
    if (!passed) {
      ev.push("formal_gru_input_boundary_source=" + src + "（必须为 per_message）。");
      if (src === "protocol_representative") {
        ev.push("使用协议代表性边界会掩盖单条消息字段差异。");
      }
    }
    return { passed: passed, evidence: ev, actual: String(src), required: "per_message" };
  }

  function checkR04(data) {
    var ev = [];
    var reqs = data.gru && isArr(data.gru.requests) ? data.gru.requests : [];
    var msgs = isArr(data.messages) ? data.messages : [];
    var msgDir = {};
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i] && isNonEmptyStr(msgs[i].message_id)) {
        msgDir[msgs[i].message_id] = msgs[i].direction;
      }
    }
    var mixedDir = 0, inconsistent = 0, boundaryMismatch = 0;
    for (var r = 0; r < reqs.length; r++) {
      var req = reqs[r] || {};
      var ids = isArr(req.message_ids) ? req.message_ids : [];
      // 组内方向是否一致（与 request.direction 一致）
      for (var k = 0; k < ids.length; k++) {
        var d = msgDir[ids[k]];
        if (d && d !== req.direction) {
          mixedDir++;
          ev.push("request " + req.request_id + " 中 " + ids[k] + " 方向 " + d + " 与组方向 " + req.direction + " 不一致。");
        }
      }
      // boundaries / field_count / message_limit 一致性（组内只有一个 request，校验 field_count == boundaries.length）
      var bl = isArr(req.boundaries) ? req.boundaries.length : 0;
      if (isInt(req.field_count) && req.field_count !== bl) {
        boundaryMismatch++;
        ev.push("request " + req.request_id + " field_count=" + req.field_count + " 与 boundaries 长度 " + bl + " 不一致。");
      }
      // 多个 request 之间若声称同组，message_limit 应一致；此处按单 request 内字段统计
      if (!isInt(req.message_limit)) {
        inconsistent++;
        ev.push("request " + req.request_id + " 缺少 message_limit。");
      }
    }
    var passed = mixedDir === 0 && inconsistent === 0 && boundaryMismatch === 0;
    return {
      passed: passed,
      evidence: ev,
      actual: "方向冲突 " + mixedDir + " / 字段不一致 " + boundaryMismatch + " / 缺 limit " + inconsistent,
      required: "组内 direction、boundaries、field_count、message_limit 完全一致"
    };
  }

  function checkR05(data) {
    var ev = [];
    var v = data.gru && data.gru.copy_messages_to_ten;
    var passed = v === false;
    if (!passed) ev.push("copy_messages_to_ten=" + v + "（必须为 false）。");
    return { passed: passed, evidence: ev, actual: String(v), required: "false" };
  }

  function checkR06(data) {
    var ev = [];
    var v = data.gru && data.gru.truncate_to_shortest;
    var passed = v === false;
    if (!passed) ev.push("truncate_to_shortest=" + v + "（必须为 false，禁止静默截断）。");
    return { passed: passed, evidence: ev, actual: String(v), required: "false" };
  }

  function checkR07(data) {
    var ev = [];
    var g = data.gru || {};
    var w = g.model_weights_mutable, s = g.semantic_centers_mutable;
    var passed = w === false && s === false;
    if (w !== false) ev.push("model_weights_mutable=" + w + "（必须为 false）。");
    if (s !== false) ev.push("semantic_centers_mutable=" + s + "（必须为 false）。");
    return { passed: passed, evidence: ev, actual: "weights=" + w + ", centers=" + s, required: "weights=false, centers=false" };
  }

  function checkR08(data) {
    var ev = [];
    var g = data.gru || {};
    var reqs = isArr(g.requests) ? g.requests : [];
    var noSchema = !isNonEmptyStr(g.schema_version);
    if (noSchema) ev.push("gru.schema_version 缺失（request 无法按版本重新解析）。");
    var noGroupKey = 0, noReparse = 0, sliceMismatch = 0;
    if (reqs.length === 0) ev.push("gru.requests 为空（无 GRU request）。");
    for (var i = 0; i < reqs.length; i++) {
      var r = reqs[i] || {};
      if (!isNonEmptyStr(r.group_key)) {
        noGroupKey++;
        ev.push("request " + r.request_id + " 缺少 group_key。");
      }
      if (r.reparse_ok !== true) {
        noReparse++;
        ev.push("request " + r.request_id + " reparse_ok=" + r.reparse_ok + "（无法重新解析）。");
      }
      var bl = isArr(r.boundaries) ? r.boundaries.length : 0;
      if (isInt(r.field_count) && r.field_count !== bl) {
        sliceMismatch++;
        ev.push("request " + r.request_id + " field_count=" + r.field_count + " 与 boundaries 长度 " + bl + " 不一致（字段切片与边界不一致）。");
      }
    }
    var passed = !noSchema && noGroupKey === 0 && noReparse === 0 && sliceMismatch === 0 && reqs.length > 0;
    return {
      passed: passed,
      evidence: ev,
      actual: "schema=" + (noSchema ? "缺失" : "存在") + " / 缺 group_key " + noGroupKey + " / 不可重解析 " + noReparse + " / 切片不一致 " + sliceMismatch,
      required: "存在 request、schema_version、group_key，可重解析，切片一致"
    };
  }

  var R09_FIELDS = ["message_id", "direction", "field_index", "start", "end", "field_hex", "semantic_candidate", "confidence", "source_request_id"];
  function checkR09(data) {
    var ev = [];
    var results = data.gru && isArr(data.gru.results) ? data.gru.results : [];
    var reqs = data.gru && isArr(data.gru.requests) ? data.gru.requests : [];
    var reqIds = {};
    for (var i = 0; i < reqs.length; i++) { if (reqs[i] && reqs[i].request_id) reqIds[reqs[i].request_id] = 1; }
    var missing = 0, orphan = 0;
    for (var j = 0; j < results.length; j++) {
      var r = results[j] || {};
      for (var k = 0; k < R09_FIELDS.length; k++) {
        var key = R09_FIELDS[k];
        var val = r[key];
        if (val == null || val === "") {
          missing++;
          ev.push("结果 #" + (j + 1) + " 缺少字段 " + key + "。");
        }
      }
      if (isNonEmptyStr(r.source_request_id) && !reqIds[r.source_request_id]) {
        orphan++;
        ev.push("结果 #" + (j + 1) + " source_request_id=" + r.source_request_id + " 无法映射到任何 request。");
      }
    }
    var passed = missing === 0 && orphan === 0;
    return {
      passed: passed,
      evidence: ev,
      actual: "缺字段 " + missing + " 处 / 孤立 source_request_id " + orphan + " 处",
      required: "九字段齐全且 source_request_id 可映射"
    };
  }

  function checkR10(data) {
    var ev = [];
    var run = data.run || {};
    var noId = !isNonEmptyStr(run.run_id);
    var noTime = !isNonEmptyStr(run.run_time);
    var noSummary = !isNonEmptyStr(run.input_summary);
    if (noId) ev.push("run.run_id 缺失，无法证明结果来自当前运行。");
    if (noTime) ev.push("run.run_time 缺失，无法证明存在真实运行时间。");
    if (noSummary) ev.push("run.input_summary 缺失，无法证明输入摘要。");
    // 历史 run_id 被引用即视为冒充
    var hist = isArr(run.historical_run_ids) ? run.historical_run_ids : [];
    var histUsed = hist.length > 0;
    if (histUsed) ev.push("run.historical_run_ids 非空：" + hist.join(", ") + "（疑似使用历史 JSON 冒充新运行）。");
    var passed = !noId && !noTime && !noSummary && !histUsed;
    return {
      passed: passed,
      evidence: ev,
      actual: "run_id=" + (noId ? "缺失" : "存在") + " / run_time=" + (noTime ? "缺失" : "存在") + " / input_summary=" + (noSummary ? "缺失" : "存在") + " / 历史 ID " + hist.length + " 个",
      required: "run_id、run_time、input_summary 均存在，且不引用历史 run_id"
    };
  }

  function checkR11(data) {
    var ev = [];
    var run = data.run || {};
    var noCmd = !isNonEmptyStr(run.test_command);
    var noExit = !has(run, "exit_code") || !isInt(run.exit_code);
    var noPassed = !has(run, "test_passed") || !isInt(run.test_passed);
    var noFailed = !has(run, "test_failed") || !isInt(run.test_failed);
    if (noCmd) ev.push("run.test_command 缺失。");
    if (noExit) ev.push("run.exit_code 缺失或非整数。");
    if (noPassed) ev.push("run.test_passed 缺失或非整数。");
    if (noFailed) ev.push("run.test_failed 缺失或非整数。");
    var total = (isInt(run.test_passed) ? run.test_passed : 0) + (isInt(run.test_failed) ? run.test_failed : 0);
    if (total === 0) ev.push("测试总数为 0（不允许只用空测试证明功能正确）。");
    // 存在未解释失败但 exit_code=0 ⇒ 视为“不得判为通过”
    var unexplainedFail = isInt(run.test_failed) && run.test_failed > 0 && run.exit_code === 0;
    if (unexplainedFail) ev.push("test_failed=" + run.test_failed + " 但 exit_code=0（存在未解释失败却判为通过）。");
    var passed = !noCmd && !noExit && !noPassed && !noFailed && total > 0 && !unexplainedFail;
    return {
      passed: passed,
      evidence: ev,
      actual: "cmd=" + (noCmd ? "缺失" : "存在") + " / exit=" + (noExit ? "缺失" : run.exit_code) + " / passed=" + (isInt(run.test_passed) ? run.test_passed : "缺失") + " / failed=" + (isInt(run.test_failed) ? run.test_failed : "缺失"),
      required: "测试命令、exit_code、passed/failed 均存在，失败>0 时不得判通过，且总数>0"
    };
  }

  function checkR12(data) {
    var steps = isArr(data.paperSteps) ? data.paperSteps : [];
    var count = { implemented: 0, partial: 0, alternative: 0, not_implemented: 0, no_evidence: 0 };
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i] || {};
      var st = s.status;
      if (st === "implemented") count.implemented++;
      else if (st === "partial") count.partial++;
      else if (st === "alternative") count.alternative++;
      else if (st === "not_implemented") count.not_implemented++;
      else count.no_evidence++;
    }
    // R12 永远“通过”（它是统计型规则），但未实现数量会影响评分
    var ev = ["已实现 " + count.implemented + " / 部分实现 " + count.partial + " / 替代实现 " + count.alternative + " / 未实现 " + count.not_implemented + " / 无证据 " + count.no_evidence + "。"];
    return {
      passed: true,
      evidence: ev,
      actual: ev[0],
      required: "统计论文步骤状态分布",
      stats: count
    };
  }

  var CHECKERS = {
    R01: checkR01, R02: checkR02, R03: checkR03, R04: checkR04, R05: checkR05, R06: checkR06,
    R07: checkR07, R08: checkR08, R09: checkR09, R10: checkR10, R11: checkR11, R12: checkR12
  };

  /* ===================== 2. runAudit ===================== */
  /* 执行全部 12 条规则，返回 { results: [...], summary, validated } */
  function runAudit(data) {
    var validation = validateProjectPackage(data);
    var results = [];
    for (var i = 0; i < RULE_ORDER.length; i++) {
      var id = RULE_ORDER[i];
      var rule = RULES[id];
      var checker = CHECKERS[id];
      var r;
      try {
        r = checker(data);
      } catch (e) {
        r = { passed: false, evidence: ["规则执行异常：" + (e && e.message ? e.message : String(e))], actual: "异常", required: rule.paper };
      }
      results.push({
        ruleId: id,
        name: rule.name,
        severity: rule.severity,
        dimension: rule.dimension,
        passed: !!r.passed,
        evidence: r.evidence || [],
        required: rule.paper,
        actual: r.actual || "",
        danger: rule.danger,
        fix: rule.fix,
        acceptance: rule.acceptance,
        files: rule.files,
        stats: r.stats || null
      });
    }
    var passed = 0, failed = 0, highFail = 0;
    for (var j = 0; j < results.length; j++) {
      if (results[j].passed) passed++;
      else { failed++; if (results[j].severity === "high") highFail++; }
    }
    return {
      results: results,
      summary: {
        total: results.length,
        passed: passed,
        failed: failed,
        highFail: highFail
      },
      validated: validation
    };
  }

  /* ===================== 3. calculateScore ===================== */
  /* 由规则结果计算 0–100 可信度分数，返回 { total, score, breakdown, deductions } */
  function calculateScore(results) {
    var byDim = { paper: { full: SCORE_WEIGHTS.paper, rules: [] }, traceability: { full: SCORE_WEIGHTS.traceability, rules: [] }, boundary: { full: SCORE_WEIGHTS.boundary, rules: [] }, gru: { full: SCORE_WEIGHTS.gru, rules: [] }, test: { full: SCORE_WEIGHTS.test, rules: [] } };
    var rs = (results && results.results) ? results.results : (isArr(results) ? results : []);
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i];
      if (!r || !byDim[r.dimension]) continue;
      byDim[r.dimension].rules.push(r);
    }
    var breakdown = [];
    var deductions = [];
    var score = 0;
    for (var dim in byDim) {
      if (!has(byDim, dim)) continue;
      var d = byDim[dim];
      var dimScore = d.full;
      var nRules = d.rules.length;
      // 每条规则在该维度内均分权重；失败按其权重扣分；高风险失败额外扣 20% 维度分
      for (var k = 0; k < d.rules.length; k++) {
        var rule = d.rules[k];
        var weight = d.full / Math.max(1, nRules);
        // 论文步骤统计型规则（R12）：passed 恒为 true，但按未实现比例扣分
        // 必须在 if(rule.passed) continue 之前处理，否则统计型扣分永远不会生效
        if (rule.ruleId === "R12" && rule.stats) {
          var total = rule.stats.implemented + rule.stats.partial + rule.stats.alternative + rule.stats.not_implemented + rule.stats.no_evidence;
          var notDone = rule.stats.not_implemented + rule.stats.no_evidence + rule.stats.partial * 0.5 + rule.stats.alternative * 0.3;
          var ratio = total > 0 ? notDone / total : 1;
          var deduct = Math.round(d.full * ratio);
          dimScore -= deduct;
          deductions.push({ ruleId: "R12", dimension: dim, deduct: deduct, reason: "论文步骤未完成比例 " + (ratio * 100).toFixed(0) + "%" });
          continue;
        }
        if (rule.passed) continue;
        dimScore -= weight;
        deductions.push({ ruleId: rule.ruleId, dimension: dim, deduct: weight, reason: rule.name + " 未通过" });
        if (rule.severity === "high") {
          var extra = Math.round(d.full * 0.2);
          dimScore -= extra;
          deductions.push({ ruleId: rule.ruleId, dimension: dim, deduct: extra, reason: "高风险失败额外扣减" });
        }
      }
      if (dimScore < 0) dimScore = 0;
      if (dimScore > d.full) dimScore = d.full;
      score += dimScore;
      breakdown.push({ dimension: dim, full: d.full, score: Math.round(dimScore), rules: d.rules.map(function (x) { return { ruleId: x.ruleId, passed: x.passed, severity: x.severity }; }) });
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    return { total: 100, score: score, breakdown: breakdown, deductions: deductions };
  }

  /* ===================== 4. generateRiskItems ===================== */
  /* 仅由失败规则生成风险证据项（含完整字段）。通过规则不产生风险。
   * 例外：R12 是统计型规则，passed 恒为 true，但当存在未实现/无证据步骤时
   * 仍应作为低风险项输出，以体现真实进度。 */
  function generateRiskItems(results) {
    var rs = (results && results.results) ? results.results : (isArr(results) ? results : []);
    var out = [];
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i];
      // R12 统计型：passed 恒为 true，需在 skip 通过规则前单独判断
      if (r.ruleId === "R12") {
        var st12 = r.stats || {};
        var undone12 = (st12.not_implemented || 0) + (st12.no_evidence || 0);
        if (undone12 === 0) continue;
        // 有未实现/无证据时，作为风险输出（R12 severity=medium/低风险残留）
        out.push({
          ruleId: r.ruleId,
          name: r.name,
          severity: r.severity,
          paper: r.required,
          actual: r.actual,
          danger: r.danger,
          evidence: r.evidence,
          files: r.files,
          fix: r.fix,
          acceptance: r.acceptance,
          dimension: r.dimension
        });
        continue;
      }
      if (r.passed) continue;
      out.push({
        ruleId: r.ruleId,
        name: r.name,
        severity: r.severity,
        paper: r.required,
        actual: r.actual,
        danger: r.danger,
        evidence: r.evidence,
        files: r.files,
        fix: r.fix,
        acceptance: r.acceptance,
        dimension: r.dimension
      });
    }
    return out;
  }

  /* ===================== 5. generateRepairPlan ===================== */
  /* 由失败规则动态生成修正计划，按 P0/P1/P2 优先级排序。 */
  var PRIORITY_MAP = {
    // P0：会导致字段整体错位或结果不可追溯
    R01: "P0", R02: "P0", R03: "P0", R04: "P0", R06: "P0", R09: "P0",
    // P1：影响实验可信度
    R05: "P1", R07: "P1", R08: "P1", R10: "P1", R11: "P1",
    // P2：影响报告完整度或使用体验
    R12: "P2"
  };
  var PLAN_TEMPLATES = {
    R01: {
      target: "恢复 message_id 全量可追溯",
      file: "mdi_gru/pipeline.py, mdi_gru/merge.py",
      codeChange: "为每条消息生成唯一 message_id；合并/导出阶段强制非空校验；重复 ID 抛错。",
      mustRunTests: ["test_message_id_unique", "test_message_id_non_empty"],
      expectedArtifact: "outputs/results.jsonl 全量 message_id 可反查",
      dod: "所有消息与结果的 message_id 非空、唯一、可回到原消息。",
      forbidden: "不得用占位字符串或时间戳拼接伪造唯一性。"
    },
    R02: {
      target: "统一字节级边界与范围校验",
      file: "mdi_gru/offset.py, mdi_gru/boundary.py",
      codeChange: "offset_unit 强制 byte；start/end 整数校验；0 ≤ start < end ≤ byte_length；越界抛异常。",
      mustRunTests: ["test_boundary_unit_byte", "test_boundary_range", "test_boundary_overflow"],
      expectedArtifact: "字段边界表全部通过字节级校验",
      dod: "无单位错误、无非整数、无范围错误、无越界。",
      forbidden: "不得静默返回 0 或截断到合法范围。"
    },
    R03: {
      target: "切换为逐消息边界来源",
      file: "mdi_gru/grouping.py, configs/baseline.yaml",
      codeChange: "formal_gru_input_boundary_source 改为 per_message；删除 .out 猜测路径。",
      mustRunTests: ["test_per_message_boundary"],
      expectedArtifact: "逐消息边界表，无协议代表性边界",
      dod: "formal_gru_input_boundary_source === 'per_message'，无 .out 引用。",
      forbidden: "不得保留 protocol_representative 作为回退。"
    },
    R04: {
      target: "严格分组校验",
      file: "mdi_gru/grouping.py",
      codeChange: "strict_group() 按 direction+boundaries+field_count+message_limit 联合分组；任一不同不得同组。",
      mustRunTests: ["test_strict_group_direction", "test_strict_group_boundaries"],
      expectedArtifact: "分组结果与配置完全一致",
      dod: "每个 request 内方向、边界、字段数、消息上限完全一致。",
      forbidden: "不得为了凑满 10 条而合并不同组。"
    },
    R05: {
      target: "关闭复制消息凑数量",
      file: "mdi_gru/grouping.py, configs/baseline.yaml",
      codeChange: "copy_messages_to_ten=false；不足 10 条按真实数量构造 request。",
      mustRunTests: ["test_no_copy_messages"],
      expectedArtifact: "request.message_ids 无重复",
      dod: "copy_messages_to_ten === false，且 message_ids 唯一。",
      forbidden: "不得以“样本太少”为由复制消息。"
    },
    R06: {
      target: "关闭最短消息静默截断",
      file: "configs/baseline.yaml, mdi_gru/grouping.py",
      codeChange: "truncate_to_shortest=false；启动期配置校验；不满足 message_limit 的分组拒绝。",
      mustRunTests: ["test_no_truncate_shortest"],
      expectedArtifact: "启动期校验报告",
      dod: "truncate_to_shortest === false。",
      forbidden: "不得静默截断字段位置。"
    },
    R07: {
      target: "锁定 GRU 核心权重与语义中心",
      file: "gru_core/infer.py, configs/baseline.yaml",
      codeChange: "model_weights_mutable=false；semantic_centers_mutable=false；权重只读打开。",
      mustRunTests: ["test_weights_readonly"],
      expectedArtifact: "权重文件 SHA256 记录",
      dod: "model_weights_mutable === false 且 semantic_centers_mutable === false。",
      forbidden: "不得通过修改模型核心迁就错误输入。"
    },
    R08: {
      target: "GRU request 可重新解析",
      file: "mdi_gru/request.py, tests/test_request_roundtrip.py",
      codeChange: "写入 schema_version 与 group_key；新增 build→parse 回环测试；校验 field_count==boundaries.length。",
      mustRunTests: ["test_request_roundtrip", "test_field_slice_consistency"],
      expectedArtifact: "回环测试报告",
      dod: "每个 request 含 schema_version、group_key、reparse_ok=true，切片一致。",
      forbidden: "不得用“能发送”代替“能重解析”。"
    },
    R09: {
      target: "结果九字段完整可追溯",
      file: "mdi_gru/merge.py, mdi_gru/export.py",
      codeChange: "merge_results() 强制九字段校验；source_request_id 必须映射到某 request。",
      mustRunTests: ["test_result_fields_complete"],
      expectedArtifact: "outputs/results.jsonl",
      dod: "每条 result 九字段齐全且 source_request_id 可映射。",
      forbidden: "不得用空字符串或 null 填充必备字段。"
    },
    R10: {
      target: "保证产物真实性",
      file: "mdi_gru/pipeline.py, mdi_gru/export.py",
      codeChange: "运行时写入 run_id、run_time、input_summary；导出校验产物 run_id 与当前一致；删除历史 run_id 引用。",
      mustRunTests: ["test_artifact_run_id_match"],
      expectedArtifact: "outputs/acceptance.json",
      dod: "run_id/run_time/input_summary 均存在，且不引用历史 run_id。",
      forbidden: "不得用历史 JSON 冒充新运行结果。"
    },
    R11: {
      target: "补全测试闭环",
      file: "tests/, mdi_gru/pipeline.py",
      codeChange: "记录 test_command、exit_code、passed/failed；test_failed>0 时 exit_code!=0；禁止空测试。",
      mustRunTests: ["test_smoke"],
      expectedArtifact: "outputs/test_report.md",
      dod: "测试命令、exit_code、passed/failed 均存在，失败>0 时非通过，总数>0。",
      forbidden: "不得删除失败测试或跳过测试以凑通过。"
    },
    R12: {
      target: "补全论文步骤映射",
      file: "docs/paper_mapping.md, mdi_gru/metrics.py",
      codeChange: "为每个论文步骤标注状态与证据；未实现项进入修正计划。",
      mustRunTests: ["test_paper_step_coverage"],
      expectedArtifact: "论文步骤映射表",
      dod: "每个论文步骤均有明确状态与证据。",
      forbidden: "不得用“替代实现”掩盖未实现。"
    }
  };

  function generateRepairPlan(results) {
    var rs = (results && results.results) ? results.results : (isArr(results) ? results : []);
    var plan = [];
    var idx = { P0: 0, P1: 0, P2: 0 };
    var order = ["P0", "P1", "P2"];
    // 先按优先级分组
    var buckets = { P0: [], P1: [], P2: [] };
    for (var i = 0; i < rs.length; i++) {
      var r = rs[i];
      // R12 统计型：passed 恒为 true，需在 skip 通过规则前单独判断
      if (r.ruleId === "R12") {
        var st12 = r.stats || {};
        if ((st12.not_implemented || 0) + (st12.no_evidence || 0) === 0) continue;
        // 有未实现/无证据时进入计划
        buckets[PRIORITY_MAP.R12].push(r);
        continue;
      }
      if (r.passed) continue;
      var p = PRIORITY_MAP[r.ruleId] || "P2";
      buckets[p].push(r);
    }
    for (var oi = 0; oi < order.length; oi++) {
      var p = order[oi];
      for (var bi = 0; bi < buckets[p].length; bi++) {
        var rule = buckets[p][bi];
        var tpl = PLAN_TEMPLATES[rule.ruleId] || {
          target: rule.name, file: "（待定）", codeChange: rule.fix,
          mustRunTests: [], expectedArtifact: "（待定）", dod: rule.acceptance, forbidden: "（待定）"
        };
        idx[p]++;
        plan.push({
          id: p + "-" + String(idx[p]).padStart(2, "0"),
          priority: p,
          relatedRule: rule.ruleId,
          riskName: rule.name,
          target: tpl.target,
          file: tpl.file,
          codeChange: tpl.codeChange,
          mustRunTests: tpl.mustRunTests,
          expectedArtifact: tpl.expectedArtifact,
          definitionOfDone: tpl.dod,
          forbidden: tpl.forbidden
        });
      }
    }
    return plan;
  }

  /* ===================== 6. applyDemoRepairs ===================== */
  /* 模拟“应用示例修复”：对传入数据应用一组已知修复，返回修复后的新数据。
   * 注意：不修改用户真实工程；仅在内置数据上做可追溯的字段修正，
   * 并保留至少一个低风险问题（P09 Acc1/Acc2 未计算）以体现真实进度。 */
  function applyDemoRepairs(data) {
    var d = deepClone(data);

    // run：写入新的 run_id / run_time / input_summary，清空历史 run_id，测试全通过
    if (!isObj(d.run)) d.run = {};
    d.run.run_id = "run-improved-" + Date.now();
    d.run.run_time = new Date().toISOString();
    d.run.input_summary = isNonEmptyStr(d.run.input_summary)
      ? d.run.input_summary + "（已应用示例修复：逐消息边界 + 严格分组 + 结果可追溯）"
      : "已应用示例修复：逐消息边界 + 严格分组 + 结果可追溯。";
    d.run.historical_run_ids = [];
    d.run.exit_code = 0;
    d.run.test_passed = isInt(d.run.test_passed) ? d.run.test_passed + 4 : 22;
    d.run.test_failed = 0;
    if (!isArr(d.run.artifacts)) d.run.artifacts = [];
    if (d.run.artifacts.indexOf("outputs/results.jsonl") === -1) d.run.artifacts.push("outputs/results.jsonl");
    if (d.run.artifacts.indexOf("outputs/test_report.md") === -1) d.run.artifacts.push("outputs/test_report.md");
    if (d.run.artifacts.indexOf("outputs/acceptance.json") === -1) d.run.artifacts.push("outputs/acceptance.json");

    // messages：补全空 message_id，去重，统一 offset_unit=byte，修正越界/范围
    if (isArr(d.messages)) {
      var used = {};
      var seq = 1;
      for (var i = 0; i < d.messages.length; i++) {
        var m = d.messages[i] || {};
        if (!isNonEmptyStr(m.message_id) || used[m.message_id]) {
          m.message_id = "msg-fix-" + String(seq).padStart(3, "0");
          seq++;
        }
        used[m.message_id] = 1;
        d.messages[i] = m;
        var len = isInt(m.byte_length) ? m.byte_length : 0;
        if (isArr(m.fields)) {
          for (var k = 0; k < m.fields.length; k++) {
            var f = m.fields[k] || {};
            f.offset_unit = "byte";
            if (!isInt(f.start) || !isInt(f.end) || !(f.start >= 0 && f.end > f.start)) {
              // 修正为相邻切片
              f.start = k === 0 ? 0 : (m.fields[k - 1] ? m.fields[k - 1].end : 0);
              f.end = f.start + 4;
            }
            if (isInt(len) && f.end > len) {
              f.end = len;
              if (!(f.start >= 0 && f.end > f.start)) { f.start = 0; f.end = len; }
            }
            m.fields[k] = f;
          }
        }
      }
    }

    // gru：核心修复
    if (!isObj(d.gru)) d.gru = {};
    d.gru.formal_gru_input_boundary_source = "per_message";
    d.gru.copy_messages_to_ten = false;
    d.gru.truncate_to_shortest = false;
    d.gru.model_weights_mutable = false;
    d.gru.semantic_centers_mutable = false;
    if (!isNonEmptyStr(d.gru.schema_version)) d.gru.schema_version = "1.0.0";

    // requests：补 group_key、修正方向冲突、reparse_ok=true、field_count 一致
    if (isArr(d.gru.requests)) {
      var msgDir = {};
      if (isArr(d.messages)) {
        for (var mi = 0; mi < d.messages.length; mi++) {
          if (d.messages[mi] && d.messages[mi].message_id) msgDir[d.messages[mi].message_id] = d.messages[mi].direction;
        }
      }
      for (var ri = 0; ri < d.gru.requests.length; ri++) {
        var req = d.gru.requests[ri] || {};
        if (!isNonEmptyStr(req.group_key)) {
          req.group_key = (req.direction || "uplink") + "|req-" + (ri + 1);
        }
        // 修正 message_ids 中与组方向不一致的项（移除）
        if (isArr(req.message_ids)) {
          var filtered = [];
          for (var ii = 0; ii < req.message_ids.length; ii++) {
            var id = req.message_ids[ii];
            if (isNonEmptyStr(id) && (!msgDir[id] || msgDir[id] === req.direction)) filtered.push(id);
          }
          // 去重
          req.message_ids = uniq(filtered);
        }
        req.reparse_ok = true;
        var bl = isArr(req.boundaries) ? req.boundaries.length : 0;
        if (isInt(req.field_count) && req.field_count !== bl) req.field_count = bl;
        d.gru.requests[ri] = req;
      }
    }

    // results：补全九字段，source_request_id 必须映射到某 request
    if (isArr(d.gru.results)) {
      var reqIds = {};
      if (isArr(d.gru.requests)) {
        for (var qi = 0; qi < d.gru.requests.length; qi++) {
          if (d.gru.requests[qi] && d.gru.requests[qi].request_id) reqIds[d.gru.requests[qi].request_id] = 1;
        }
      }
      var firstReq = isArr(d.gru.requests) && d.gru.requests[0] ? d.gru.requests[0].request_id : "req-001";
      for (var rj = 0; rj < d.gru.results.length; rj++) {
        var res = d.gru.results[rj] || {};
        if (!isNonEmptyStr(res.message_id)) res.message_id = "msg-fix-001";
        if (!isNonEmptyStr(res.direction)) res.direction = "uplink";
        if (!isInt(res.field_index)) res.field_index = 0;
        if (!isInt(res.start)) res.start = 0;
        if (!isInt(res.end)) res.end = 4;
        if (!isNonEmptyStr(res.field_hex)) res.field_hex = "01020304";
        if (!isNonEmptyStr(res.semantic_candidate)) res.semantic_candidate = "unknown";
        if (typeof res.confidence !== "number") res.confidence = 0.5;
        if (!isNonEmptyStr(res.source_request_id) || !reqIds[res.source_request_id]) {
          res.source_request_id = firstReq;
        }
        d.gru.results[rj] = res;
      }
    }

    // paperSteps：把 P01–P08 提升为 implemented（保留 P09 Acc1/Acc2 未实现作为低风险残留）
    if (isArr(d.paperSteps)) {
      for (var ps = 0; ps < d.paperSteps.length; ps++) {
        var step = d.paperSteps[ps];
        if (!step) continue;
        // 仅当步骤属于第一阶段核心（P01–P08）才升级
        if (/^P0[1-8]$/.test(step.id)) {
          step.status = "implemented";
          step.riskLevel = "low";
        }
      }
      // 若不存在 P09（Acc1/Acc2），追加一条作为残留低风险
      var hasP09 = false;
      for (var pi = 0; pi < d.paperSteps.length; pi++) {
        if (d.paperSteps[pi] && d.paperSteps[pi].id === "P09") { hasP09 = true; break; }
      }
      if (!hasP09) {
        d.paperSteps.push({
          id: "P09",
          requirement: "计算 Acc1/Acc2 评价指标",
          acceptance: "输出 Acc1 与 Acc2 指标；含与论文基线的对照表。",
          status: "not_implemented",
          source: "（第二阶段实现）",
          evidence: "最终 Acc1/Acc2 尚未在第一阶段计算，等待后续评价阶段。",
          riskLevel: "low"
        });
      }
    }

    // sourceMappings：与 paperSteps 同步
    if (isArr(d.sourceMappings)) {
      for (var sm = 0; sm < d.sourceMappings.length; sm++) {
        var map = d.sourceMappings[sm];
        if (map && /^P0[1-8]$/.test(map.step)) {
          map.status = "implemented";
          map.riskLevel = "low";
        }
      }
    }

    // 标记修复后阶段
    if (isObj(d.project)) {
      d.project.stage = isNonEmptyStr(d.project.stage) ? d.project.stage + "-已修正" : "已修正";
      if (!/已修正/.test(d.project.name)) d.project.name = d.project.name + "（修正后）";
    }

    return d;
  }

  /* ===================== 7. compareAudits ===================== */
  /* 对比修复前后两次审计，返回结构化对比结果。 */
  function compareAudits(before, after) {
    var bAudit = before && before.results ? before : runAudit(before);
    var aAudit = after && after.results ? after : runAudit(after);
    var bScore = calculateScore(bAudit);
    var aScore = calculateScore(aAudit);
    var bRisks = generateRiskItems(bAudit);
    var aRisks = generateRiskItems(aAudit);

    var bFailIds = {}, aFailIds = {};
    for (var i = 0; i < bAudit.results.length; i++) if (!bAudit.results[i].passed) bFailIds[bAudit.results[i].ruleId] = 1;
    for (var j = 0; j < aAudit.results.length; j++) if (!aAudit.results[j].passed) aFailIds[aAudit.results[j].ruleId] = 1;

    var resolved = [], unresolved = [];
    for (var r in bFailIds) {
      if (has(bFailIds, r)) {
        if (!aFailIds[r]) resolved.push(r); else unresolved.push(r);
      }
    }
    // 新增问题（修复后才出现的）
    var newlyIntroduced = [];
    for (var r2 in aFailIds) {
      if (has(aFailIds, r2) && !bFailIds[r2]) newlyIntroduced.push(r2);
    }

    var delta = aScore.score - bScore.score;
    var summary = "风险数量由 " + bRisks.length + " 降至 " + aRisks.length + "；可信度由 " + bScore.score + " 变为 " + aScore.score + "（" + (delta >= 0 ? "+" : "") + delta + "）；已解决规则 " + resolved.length + " 条" + (unresolved.length ? "；仍有 " + unresolved.length + " 条未解决" : "") + "。";

    return {
      before: { score: bScore.score, riskCount: bRisks.length, highFail: bAudit.summary.highFail, failed: bAudit.summary.failed },
      after: { score: aScore.score, riskCount: aRisks.length, highFail: aAudit.summary.highFail, failed: aAudit.summary.failed },
      scoreDelta: delta,
      resolvedRules: resolved,
      unresolvedRules: unresolved,
      newlyIntroducedRules: newlyIntroduced,
      changeSummary: summary,
      beforeRisks: bRisks,
      afterRisks: aRisks
    };
  }

  /* ===================== 导出 ===================== */
  return {
    RULES: RULES,
    RULE_ORDER: RULE_ORDER,
    SCORE_WEIGHTS: SCORE_WEIGHTS,
    R09_FIELDS: R09_FIELDS,
    validateProjectPackage: validateProjectPackage,
    runAudit: runAudit,
    calculateScore: calculateScore,
    generateRiskItems: generateRiskItems,
    generateRepairPlan: generateRepairPlan,
    applyDemoRepairs: applyDemoRepairs,
    compareAudits: compareAudits
  };
}));
