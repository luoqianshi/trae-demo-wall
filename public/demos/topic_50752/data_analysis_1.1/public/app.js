/* ============================================================
   数据复盘分析 Agent — 前端主逻辑 (Indigo 紫色系)
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const state = {
    mode: "setup",
    sessionId: null,
    fileName: null,
    running: false,
    config: loadConfig(),
    taskSteps: [],
    runCodeDone: 0,
    lastReport: null,
    currentPrompt: "",
    isFollowup: false,
  };

  function loadConfig() {
    try { return JSON.parse(localStorage.getItem("llm_config_v1.1") || "{}"); }
    catch { return {}; }
  }
  function saveConfig(cfg) {
    localStorage.setItem("llm_config_v1.1", JSON.stringify(cfg));
    state.config = cfg;
    refreshConfigDot();
  }
  function hasConfig() {
    return !!(state.config.model && state.config.apiKey);
  }
  function refreshConfigDot() {
    const dot = $("#configDot");
    if (hasConfig()) {
      dot.className = "cfg-dot configured";
      dot.title = "已配置：" + state.config.model;
    } else {
      dot.className = "cfg-dot unconfigured";
      dot.title = "未配置";
    }
  }

  const configModal = $("#configModal");
  function openConfig() {
    $("#cfgBaseUrl").value = state.config.baseUrl || "";
    $("#cfgApiKey").value = state.config.apiKey || "";
    $("#cfgModel").value = state.config.model || "";
    $("#cfgTestResult").classList.add("hidden");
    configModal.classList.remove("hidden");
    $("#cfgModel").focus();
  }
  function closeConfig() { configModal.classList.add("hidden"); }

  $("#configBtn").addEventListener("click", openConfig);
  $("#configClose").addEventListener("click", closeConfig);
  configModal.querySelector(".modal-mask").addEventListener("click", closeConfig);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeConfig();
  });

  function readCfgForm() {
    return {
      baseUrl: $("#cfgBaseUrl").value.trim(),
      apiKey: $("#cfgApiKey").value.trim(),
      model: $("#cfgModel").value.trim(),
    };
  }

  $("#cfgSave").addEventListener("click", () => {
    const cfg = readCfgForm();
    if (!cfg.model || !cfg.apiKey) {
      showTestResult(false, "请至少填写 模型名称 与 API Key");
      return;
    }
    saveConfig(cfg);
    closeConfig();
    refreshStartState();
  });

  $("#cfgTest").addEventListener("click", async () => {
    const cfg = readCfgForm();
    if (!cfg.model || !cfg.apiKey) { showTestResult(false, "请先填写模型名称与 API Key"); return; }
    showTestResult(null, "正在测试连接…");
    try {
      const resp = await fetch("/api/test-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
      const data = await resp.json();
      if (data.ok) showTestResult(true, "连接成功：" + (data.reply || "(空回复)"));
      else showTestResult(false, "失败：" + (data.error || "未知错误"));
    } catch (err) {
      showTestResult(false, "请求异常：" + err.message);
    }
  });

  function showTestResult(ok, msg) {
    const el = $("#cfgTestResult");
    el.className = "test-result" + (ok === true ? " ok" : ok === false ? " fail" : "");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  const HISTORY_KEY = "conv_history_v1.1";
  const MAX_HISTORY = 30;

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }
  function saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  }
  function addHistory(item) {
    const list = loadHistory().filter(function (h) { return h.id !== item.id; });
    list.unshift(item);
    saveHistory(list);
    renderHistoryList();
  }
  function deleteHistory(id) {
    const list = loadHistory().filter(function (h) { return h.id !== id; });
    saveHistory(list);
    renderHistoryList();
  }

  function renderHistoryList() {
    const list = loadHistory();
    const el = $("#historyList");
    if (!list.length) {
      el.innerHTML = '<p class="history-empty">暂无历史记录</p>';
      return;
    }
    el.innerHTML = list.map(function (h) {
      return '<div class="history-item" data-id="' + h.id + '">' +
        '<div class="history-item-inner" data-action="open" data-id="' + h.id + '">' +
          '<div class="hi-icon">' +
            '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x=".5" y=".5" width="12" height="12" rx="2.5" stroke="currentColor" stroke-opacity=".4"/><path d="M3 4h7M3 6.5h5M3 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
          '</div>' +
          '<div class="hi-body">' +
            '<span class="hi-title">' + escHtml(h.title) + '</span>' +
            '<span class="hi-meta">' + escHtml(h.fileName || "") + ' · ' + fmtDate(h.createdAt) + '</span>' +
          '</div>' +
        '</div>' +
        '<button class="hi-del" data-action="del" data-id="' + h.id + '" title="删除" type="button">' +
          '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");
  }

  $("#historyList").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id;
    if (action === "open") openHistoryItem(id);
    if (action === "del") { deleteHistory(id); }
  });

  function openHistoryItem(id) {
    const item = loadHistory().find(function (h) { return h.id === id; });
    if (!item) return;
    goToViewMode(item);
  }

  function goToSetup() {
    state.mode = "setup";
    state.taskSteps = [];
    state.runCodeDone = 0;
    state.lastReport = null;
    state.isFollowup = false;
    $("#setupPanel").classList.remove("hidden");
    $("#analysisPanel").classList.add("hidden");
    $("#taskBar").classList.add("hidden");
    $("#statusBar").classList.add("hidden");
    $("#inputBar").classList.add("hidden");
    $("#streamContent").innerHTML = "";
    $("#reportWrap").classList.add("hidden");
    $("#reportWrap").innerHTML = "";
    renderTaskList();
    refreshStartState();
  }

  function goToAnalysis() {
    state.mode = "analyzing";
    $("#setupPanel").classList.add("hidden");
    $("#analysisPanel").classList.remove("hidden");
    $("#statusBar").classList.remove("hidden");
    $("#inputBar").classList.remove("hidden");
    setStatusText("正在分析…");
    $("#stopBtn").disabled = false;
    $("#sendBtn").disabled = true;
    $("#chatInput").disabled = true;
    $("#chatInput").placeholder = "分析进行中，完成后可继续追问…";
  }

  function goToDone() {
    state.mode = "done";
    state.running = false;
    $("#statusBar").classList.add("hidden");
    $("#sendBtn").disabled = false;
    $("#chatInput").disabled = false;
    $("#chatInput").placeholder = "继续追问或补充分析需求…（Enter 发送，Shift+Enter 换行）";
    refreshStartState();
  }

  function goToViewMode(historyItem) {
    state.mode = "done";
    state.sessionId = null;
    state.running = false;
    $("#setupPanel").classList.add("hidden");
    $("#analysisPanel").classList.remove("hidden");
    $("#taskBar").classList.add("hidden");
    $("#statusBar").classList.add("hidden");
    $("#inputBar").classList.add("hidden");
    $("#streamContent").innerHTML = "";
    const rw = $("#reportWrap");
    rw.innerHTML = "";
    rw.classList.remove("hidden");
    if (historyItem.report) {
      appendReportCard(rw, historyItem.report, true);
    } else {
      rw.innerHTML = '<p class="no-report">该记录未包含报告内容。</p>';
    }
    scrollToBottom();
  }

  $("#newConvBtn").addEventListener("click", function () {
    if (state.running) { stopAnalysis(); }
    resetSession();
    goToSetup();
  });

  function resetSession() {
    if (state.sessionId) {
      fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId }),
      }).catch(function () {});
    }
    state.sessionId = null;
    state.fileName = null;
    $("#fileInput").value = "";
    $("#fileMeta").classList.add("hidden");
    $("#previewBox").classList.add("hidden");
    $("#previewBox").textContent = "";
    refreshStartState();
  }

  const fileInput = $("#fileInput");
  const dropZone = $("#dropZone");

  fileInput.addEventListener("change", function (e) {
    if (e.target.files[0]) uploadFile(e.target.files[0]);
  });
  ["dragover", "dragenter"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) { e.preventDefault(); dropZone.classList.add("dragging"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropZone.addEventListener(evt, function (e) { e.preventDefault(); dropZone.classList.remove("dragging"); });
  });
  dropZone.addEventListener("drop", function (e) {
    const f = e.dataTransfer.files[0];
    if (f) uploadFile(f);
  });

  async function uploadFile(file) {
    const meta = $("#fileMeta");
    meta.innerHTML = '<span class="spinner"></span> 正在解析 <b>' + escHtml(file.name) + '</b> …';
    meta.classList.remove("hidden");
    $("#previewBox").classList.add("hidden");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const resp = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "上传失败");
      state.sessionId = data.sessionId;
      state.fileName = data.originalName;
      meta.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5L11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> 已加载：<b>' + escHtml(data.originalName) + '</b>';
      meta.className = "file-meta file-meta-ok";
      const pv = $("#previewBox");
      pv.textContent = data.preview || "";
      pv.classList.remove("hidden");
      refreshStartState();
    } catch (err) {
      meta.innerHTML = '<span class="err-text">上传失败：' + escHtml(err.message) + '</span>';
    }
  }

  function refreshStartState() {
    const ready = state.sessionId && hasConfig() && !state.running;
    $("#startBtn").disabled = !ready;
    const hint = $("#sidebarHint");
    if (state.running) hint.textContent = "Agent 正在分析中…";
    else if (!state.sessionId) hint.textContent = "请先上传数据文件";
    else if (!hasConfig()) hint.textContent = "请点击右上角完成模型配置";
    else hint.textContent = "准备就绪，点击开始分析";
  }

  $("#startBtn").addEventListener("click", function () { startAnalyze(false); });

  async function startAnalyze(isFollowup) {
    if (!state.sessionId) { alert("请先上传文件"); return; }
    if (!hasConfig()) { openConfig(); return; }

    const inputEl = isFollowup ? $("#chatInput") : $("#promptInput");
    const prompt = inputEl.value.trim() || "请根据数据完成一份完整的复盘分析报告。";
    if (isFollowup && !inputEl.value.trim()) return;

    state.currentPrompt = prompt;
    state.running = true;
    state.isFollowup = isFollowup;

    if (!isFollowup) {
      state.taskSteps = [];
      state.runCodeDone = 0;
      state.lastReport = null;
      $("#streamContent").innerHTML = "";
      $("#reportWrap").classList.add("hidden");
      $("#reportWrap").innerHTML = "";
      goToAnalysis();
      renderTaskList();
    } else {
      state.mode = "analyzing";
      $("#statusBar").classList.remove("hidden");
      setStatusText("正在处理追问…");
      $("#stopBtn").disabled = false;
      $("#sendBtn").disabled = true;
      $("#chatInput").disabled = true;
    }

    appendUserMsg(isFollowup ? prompt : "分析需求：" + prompt);
    if (isFollowup) inputEl.value = "";

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          prompt: prompt,
          config: state.config,
          isFollowup: isFollowup,
        }),
      });

      if (!resp.ok) {
        const d = await resp.json().catch(function () { return {}; });
        throw new Error(d.error || "服务错误 " + resp.status);
      }

      await consumeStream(resp.body);
    } catch (err) {
      if (!err.message.includes("abort") && !err.message.includes("Abort")) {
        appendStreamMsg("出错了：" + err.message, "error");
      }
    } finally {
      state.running = false;
      goToDone();
    }
  }

  async function consumeStream(body) {
    const reader = body.getReader();
    const decoder = new TextDecoder("utf-8");
    var buf = "";
    var liveBubble = null;
    const actionCards = new Map();

    function flush() { liveBubble = null; }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        var nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          var evt;
          try { evt = JSON.parse(line); } catch (e) { continue; }

          switch (evt.type) {
            case "round":
              flush();
              break;
            case "assistant_delta":
              if (!liveBubble) liveBubble = createLiveBubble();
              liveBubble.text += evt.text;
              liveBubble.el.textContent = liveBubble.text;
              scrollToBottom();
              break;
            case "assistant_done":
              if (liveBubble) finalizeBubble(liveBubble, evt.text);
              flush();
              break;
            case "task_plan":
              state.taskSteps = (evt.steps || []).map(function (t, i) {
                return { title: t, status: "pending" };
              });
              renderTaskList();
              $("#taskBar").classList.remove("hidden");
              break;
            case "task_update": {
              const step = state.taskSteps[evt.index];
              if (step) {
                step.status = evt.status;
                if (evt.status === "done") state.runCodeDone = evt.index + 1;
              }
              renderTaskList();
              const done = state.taskSteps.filter(function (s) { return s.status === "done"; }).length;
              const total = state.taskSteps.length;
              if (total) setStatusText("正在执行第 " + (done + 1) + " / " + total + " 步…");
              break;
            }
            case "tool_call": {
              if (liveBubble) { finalizeBubble(liveBubble, liveBubble.text); flush(); }
              const card = createActionCard(evt.summary, evt.code);
              actionCards.set(evt.id, card);
              scrollToBottom();
              break;
            }
            case "tool_result": {
              const card = actionCards.get(evt.id);
              if (card) fillActionResult(card, evt);
              scrollToBottom();
              break;
            }
            case "final": {
              if (liveBubble) { liveBubble.el.closest(".stream-msg") && liveBubble.el.closest(".stream-msg").remove(); flush(); }
              state.lastReport = evt.text;
              state.taskSteps.forEach(function (s) { s.status = "done"; });
              renderTaskList();
              const rw = $("#reportWrap");
              rw.classList.remove("hidden");
              appendReportCard(rw, evt.text, false);
              scrollToBottom();
              saveToHistory(evt.text);
              break;
            }
            case "aborted":
              appendStreamMsg("分析已停止。", "info");
              state.taskSteps.forEach(function (s) { if (s.status === "active") s.status = "pending"; });
              renderTaskList();
              scrollToBottom();
              break;
            case "error":
              appendStreamMsg("错误：" + evt.message, "error");
              scrollToBottom();
              break;
          }
        }
      }
    } finally {
      if (liveBubble) finalizeBubble(liveBubble, liveBubble.text);
    }
  }

  async function stopAnalysis() {
    if (!state.sessionId || !state.running) return;
    $("#stopBtn").disabled = true;
    setStatusText("正在停止…");
    try {
      await fetch("/api/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });
    } catch (e) { /* ignore */ }
  }

  $("#stopBtn").addEventListener("click", stopAnalysis);

  $("#sendBtn").addEventListener("click", function () { startAnalyze(true); });

  $("#chatInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!state.running) startAnalyze(true);
    }
  });

  function renderTaskList() {
    const el = $("#taskList");
    if (!state.taskSteps.length) { el.innerHTML = ""; return; }
    el.innerHTML = state.taskSteps
      .map(function (s, i) {
        return '<div class="task-item task-' + s.status + '">' +
          '<span class="task-dot-wrap">' +
            (s.status === "done"
              ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" fill="var(--primary)" stroke="var(--primary)"/><path d="M3 6l2 2 4-4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
              : s.status === "active"
                ? '<span class="task-spin"></span>'
                : '<span class="task-dot"></span>'
            ) +
          '</span>' +
          '<span class="task-label">' + (i + 1) + '. ' + escHtml(s.title) + '</span>' +
        '</div>';
      })
      .join("");
  }

  var taskBarExpanded = true;
  $("#taskToggleBtn").addEventListener("click", function () {
    taskBarExpanded = !taskBarExpanded;
    $("#taskList").style.display = taskBarExpanded ? "" : "none";
    $("#taskToggleBtn").textContent = taskBarExpanded ? "收起" : "展开";
  });

  function setStatusText(text) { $("#statusText").textContent = text; }

  function appendUserMsg(text) {
    const div = document.createElement("div");
    div.className = "stream-msg user-msg";
    div.innerHTML = '<div class="user-bubble">' + escHtml(text) + '</div>';
    $("#streamContent").appendChild(div);
    scrollToBottom();
  }

  function createLiveBubble() {
    const wrap = document.createElement("div");
    wrap.className = "stream-msg agent-msg";
    const el = document.createElement("div");
    el.className = "agent-bubble thinking";
    wrap.appendChild(el);
    $("#streamContent").appendChild(wrap);
    scrollToBottom();
    return { el: el, text: "", wrap: wrap };
  }

  function finalizeBubble(live, text) {
    live.el.classList.remove("thinking");
    if (!text || !text.trim()) { live.wrap.remove(); return; }
    live.el.innerHTML = window.DOMPurify
      ? DOMPurify.sanitize(marked.parse(text))
      : escHtml(text);
    live.el.querySelectorAll("a").forEach(function (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    scrollToBottom();
  }

  function appendStreamMsg(text, type) {
    type = type || "info";
    const div = document.createElement("div");
    div.className = "stream-msg notice-msg notice-" + type;
    div.textContent = text;
    $("#streamContent").appendChild(div);
  }

  function createActionCard(summary, code) {
    const card = document.createElement("div");
    card.className = "action-card";
    card.innerHTML =
      '<div class="action-head">' +
        '<span class="action-icon">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2L1 6l3 4M8 2l3 4-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</span>' +
        '<span class="action-summary">' + escHtml(summary || "执行分析代码") + '</span>' +
        '<span class="action-status running">运行中</span>' +
        '<button class="toggle-btn" type="button">展开</button>' +
      '</div>' +
      '<div class="action-detail hidden">' +
        '<div class="detail-block">' +
          '<div class="detail-label">Python 代码</div>' +
          '<pre class="code-pre"></pre>' +
        '</div>' +
        '<div class="detail-block result-block hidden">' +
          '<div class="detail-label">执行结果</div>' +
          '<pre class="result-pre"></pre>' +
        '</div>' +
      '</div>';
    card.querySelector(".code-pre").textContent = code || "";
    const detail = card.querySelector(".action-detail");
    const toggle = card.querySelector(".toggle-btn");
    toggle.addEventListener("click", function () {
      const isHidden = detail.classList.toggle("hidden");
      toggle.textContent = isHidden ? "展开" : "收起";
    });
    $("#streamContent").appendChild(card);
    return card;
  }

  function fillActionResult(card, evt) {
    const status = card.querySelector(".action-status");
    status.classList.remove("running");
    status.classList.add(evt.ok ? "ok" : "fail");
    status.textContent = evt.ok ? "完成" : "异常";
    card.querySelector(".result-block").classList.remove("hidden");
    const parts = [];
    if (evt.stdout) parts.push(evt.stdout);
    if (evt.stderr) parts.push("[stderr]\n" + evt.stderr);
    if (evt.error) parts.push("[error]\n" + evt.error);
    card.querySelector(".result-pre").textContent = parts.join("\n\n") || "(无输出)";
  }

  function appendReportCard(container, markdown, readOnly) {
    readOnly = readOnly || false;
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML =
      '<div class="report-head">' +
        '<div class="report-head-left">' +
          '<span class="report-badge">报告</span>' +
          '<span class="report-title">分析复盘报告</span>' +
        '</div>' +
        '<div class="report-actions">' +
          '<button class="btn btn-ghost btn-sm btn-copy" type="button">' +
            '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 8.5H2A1.5 1.5 0 01.5 7V2A1.5 1.5 0 012 .5h5A1.5 1.5 0 018.5 2v2" stroke="currentColor" stroke-width="1.3"/></svg>' +
            '复制 Markdown' +
          '</button>' +
          '<button class="btn btn-ghost btn-sm btn-download" type="button">' +
            '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6l3.5 3.5L10 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
            '下载 .md' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="report-body"></div>';

    Render.renderRich(card.querySelector(".report-body"), markdown);

    card.querySelector(".btn-copy").addEventListener("click", function () {
      copyReport(markdown, card.querySelector(".btn-copy"));
    });
    card.querySelector(".btn-download").addEventListener("click", function () {
      downloadReport(markdown);
    });

    container.appendChild(card);
    setTimeout(function () { Render.resizeCharts(); }, 80);
  }

  async function copyReport(markdown, btn) {
    try {
      await navigator.clipboard.writeText(markdown);
      const orig = btn.innerHTML;
      btn.innerHTML = btn.innerHTML.replace("复制 Markdown", "已复制！");
      btn.classList.add("btn-copied");
      setTimeout(function () { btn.innerHTML = orig; btn.classList.remove("btn-copied"); }, 2000);
    } catch (e) {
      alert("复制失败，请手动选取报告内容复制。");
    }
  }

  function downloadReport(markdown) {
    const title = (state.currentPrompt || "分析报告").slice(0, 40).replace(/[\\/:*?"<>|]/g, "_");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title + "_" + fmtDateShort(new Date()) + ".md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function saveToHistory(report) {
    const title = (state.currentPrompt || "分析报告").slice(0, 40);
    addHistory({
      id: nanoid(),
      title: title,
      fileName: state.fileName || "",
      createdAt: new Date().toISOString(),
      report: report,
    });
  }

  function nanoid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function scrollToBottom() {
    const area = $("#scrollArea");
    area.scrollTop = area.scrollHeight;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function fmtDateShort(d) {
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  }

  refreshConfigDot();
  renderHistoryList();
  refreshStartState();
  goToSetup();
})();