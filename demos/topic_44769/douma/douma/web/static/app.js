// DouMa 论剑台前端：四步向导（点将 -> 拈阄点题 -> 过招 -> 论剑）。
const $ = (id) => document.getElementById(id);
let CONFIGS = [];
let RANKS = [];          // 题墙分档数据
let DRAWN = [];          // 本场抽出的三道题（每档一道）
let MODELS = [];         // 本场登台的选手名
let ROUND_DONE = false;     // 本回合已出结果：允许只读回溯与查看做题明细
let MAX_STEP = 1;           // 已走到过的最高步骤（含当前）：仅这些步骤允许回点
let EVAL_RUNNING = false;   // 评测进行中：锁定 stepbar，禁止任何跳转
const STAGE_BY_STEP = { 1: "setup", 2: "wall", 3: "arena", 4: "results" };
let RUN_ID = null;            // 当前回合 run_id（供 Console 拉明细）
let CONSOLE_PICK = new Set(); // Console 勾选的选手名
let CONSOLE_TASK = null;      // Console 当前查看的题 id
let CONSOLE_SEQ = 0;          // Console 明细请求序号：避免快速切换时旧请求覆盖新结果
let LIVE = {};                // 实时观赛缓冲：cellId -> { 回合号: 累积文本 }
let LIVE_VIEW = null;         // 当前打开的实时观战格 cellId（null 表示未开实时观战）
let RESULTS = {};             // 擂台判定缓存：cellId -> progress 事件（供 Console 顶部展示最终战果）

// 优先默认选中的配置：界面可增删的运行时选手库（服务端持久化于卷）
const PREFERRED_CONFIG = "__players__";

async function boot() {
  CONFIGS = await (await fetch("/api/configs")).json();
  const tasks = await (await fetch("/api/tasks")).json();
  RANKS = tasks.ranks;

  const sel = $("config-select");
  const cfgLabel = (f) => (f === "__players__" ? "界面选手（可增删 · 持久化）" : f);
  sel.innerHTML = CONFIGS.map((c) => `<option value="${c.file}">${cfgLabel(c.file)}</option>`).join("");
  // 默认选中界面可增删的运行时选手库（若存在）
  if (CONFIGS.some((c) => c.file === PREFERRED_CONFIG)) sel.value = PREFERRED_CONFIG;
  sel.onchange = renderModels;
  renderModels();
  renderWall();

  // 回填校准默认值随模式联动：one_shot 为标准口径默认开启；
  // agentic 通过率偏高，默认关闭以免污染难度基准。用户仍可手动改。
  const modeSel = $("mode-select");
  const syncCalibrateDefault = () => {
    const oneShot = modeSel.value === "one_shot";
    $("calibrate").checked = oneShot;
    $("calibrate-hint").textContent = oneShot
      ? "✓ one_shot 为标准口径，本场结果将加权回填题库难度基准"
      : "agentic 通过率偏高，默认不回填以免污染基准（如确需纳入可手动勾选）";
  };
  modeSel.addEventListener("change", syncCalibrateDefault);
  syncCalibrateDefault();

  $("toggle-models").onclick = () =>
    document.querySelectorAll(".model-card").forEach((el) => el.classList.toggle("selected"));
  $("manage-players").onclick = openPlayers;
  $("players-close").onclick = () => { $("players-mask").hidden = true; };
  $("pf-add").onclick = addPlayer;
  $("to-wall-btn").onclick = goWall;
  $("back-setup-btn").onclick = () => showStage("setup");
  $("draw-btn").onclick = drawTasks;
  $("start-btn").onclick = startRun;
  $("again-btn").onclick = resetRound;
  $("open-console-btn").onclick = openConsole;
  $("console-close").onclick = () => { $("console-mask").hidden = true; LIVE_VIEW = null; };

  // stepbar 点击：已走到过的步骤可回点跳转；评测进行中锁定，未到达的步骤禁止前跳
  const gotoStep = (step) => {
    if (EVAL_RUNNING) return;            // 评测进行中，锁定不可跳
    if (step > MAX_STEP) return;         // 尚未到达的步骤不可前跳
    const target = STAGE_BY_STEP[step];
    if (target) showStage(target);
  };
  document.querySelectorAll(".step-dot").forEach((dot) => {
    dot.onclick = () => gotoStep(+dot.dataset.step);
    dot.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); gotoStep(+dot.dataset.step); }
    };
  });

  showStage("setup");
}

function currentConfig() {
  return CONFIGS.find((c) => c.file === $("config-select").value);
}

// —— 步骤切换 ——
function showStage(name) {
  ["setup", "wall", "arena", "results"].forEach((s) => {
    $(`stage-${s}`).hidden = s !== name;
  });
  const idx = { setup: 1, wall: 2, arena: 3, results: 4 }[name];
  if (idx > MAX_STEP) MAX_STEP = idx;   // 记录已走到过的最高步骤
  document.querySelectorAll(".step-dot").forEach((el) => {
    const n = +el.dataset.step;
    el.classList.toggle("active", n === idx);
    el.classList.toggle("done", n < idx);
    // 已到达且非评测进行中的步骤才可回点
    el.classList.toggle("clickable", !EVAL_RUNNING && n <= MAX_STEP);
  });
  applyReadonly(ROUND_DONE && (name === "setup" || name === "wall"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 只读回溯：禁用本场配置/抽题/开战控件，仅供查看（"再战一场"可解锁）
function applyReadonly(readonly) {
  const ids = ["config-select", "mode-select", "concurrency", "calibrate",
               "toggle-models", "to-wall-btn", "back-setup-btn", "draw-btn", "start-btn"];
  ids.forEach((id) => { const el = $(id); if (el) el.disabled = readonly; });
  document.querySelectorAll(".model-card").forEach((el) => {
    el.classList.toggle("locked", readonly);
  });
  const banner = $("readonly-banner");
  if (banner) banner.hidden = !readonly;
}

// —— 再战一场：纯前端重置，不刷新页面（避免服务瞬时不可达导致白屏） ——
function resetRound() {
  if (window.__es) window.__es.close(); // 关掉可能残留的 SSE 连接
  EVAL_RUNNING = false;
  ROUND_DONE = false;
  MAX_STEP = 1;
  applyReadonly(false);
  DRAWN = [];
  // 复位题墙抽题状态
  document.querySelectorAll(".wall-card").forEach((el) => el.classList.remove("picked", "dim"));
  const tray = $("drawn-tray");
  if (tray) tray.hidden = true;
  $("drawn-slots").innerHTML = "";
  $("draw-btn").disabled = false;
  $("draw-btn").textContent = "拈阄点题";
  $("start-btn").hidden = true;
  // 复位擂台与提示
  $("versus").innerHTML = "";
  updateProgress(0, 0);
  $("wall-error").textContent = "";
  $("setup-error").textContent = "";
  RUN_ID = null;
  CONSOLE_PICK = new Set();
  CONSOLE_TASK = null;
  LIVE = {};
  LIVE_VIEW = null;
  RESULTS = {};
  const mask = $("console-mask");
  if (mask) mask.hidden = true;
  showStage("setup");
}

// —— 第一步：选手 ——
function renderModels() {
  const cfg = currentConfig();
  $("concurrency").value = cfg.max_concurrency;
  if (!cfg.models.length) {
    $("model-list").innerHTML =
      `<p class="hint">该卷宗无真实模型选手（mock 仅用于自测，不在此显示）。</p>`;
    return;
  }
  const anyReady = cfg.models.some((m) => m.api_key_ready);
  const tip = anyReady
    ? ""
    : `<p class="hint">所有选手均缺少 API 密钥，请先在项目根 .env 配置对应环境变量后重启服务。</p>`;
  $("model-list").innerHTML =
    tip +
    cfg.models
      .map((m) => {
        const badge = m.api_key_ready
          ? `<span class="badge ok">密钥就绪</span>`
          : `<span class="badge no">缺密钥</span>`;
        const sel = m.api_key_ready ? "selected" : "";
        return `<div class="model-card ${sel}" data-name="${m.name}" data-ready="${m.api_key_ready}">
        <span class="pick-mark">✓</span>
        <div class="mname">${m.name}${badge}</div>
        <div class="mmodel">${m.model || m.adapter}</div>
        <span class="pick-state">已点将</span></div>`;
      })
      .join("");
  document.querySelectorAll(".model-card").forEach((el) => {
    el.onclick = () => el.classList.toggle("selected");
  });
}

function selected(selector, attr) {
  return [...document.querySelectorAll(selector + ".selected")].map((el) => el.dataset[attr]);
}

function goWall() {
  $("setup-error").textContent = "";
  MODELS = selected(".model-card", "name");
  if (!MODELS.length) return showError("setup-error", "请至少选择一位英雄（点击模型卡选中）");
  showStage("wall");
}

// —— 第二步：题墙 + 拈阄点题 ——
function renderWall() {
  const total = RANKS.reduce((sum, g) => sum + g.tasks.length, 0);
  $("wall-subtitle").textContent = `共 ${total} 式罗列于壁，每档拈取一道，凑成本场三式`;
  $("task-wall").innerHTML = RANKS.map(
    (g) => `<div class="wall-col">
      <div class="wall-rank">${g.icon} ${g.difficulty_label}</div>
      ${g.tasks
        .map(
          (t) => `<div class="wall-card" data-id="${t.id}" data-rank="${g.rank}">
            <span class="wc-id">${t.id}</span>
            <span class="wc-title">${t.title}</span></div>`
        )
        .join("")}
    </div>`
  ).join("");
}

function drawTasks() {
  $("wall-error").textContent = "";
  // 清除上一次高亮
  document.querySelectorAll(".wall-card").forEach((el) => el.classList.remove("picked", "dim"));

  DRAWN = RANKS.map((g) => {
    const pick = g.tasks[Math.floor(Math.random() * g.tasks.length)];
    return { ...pick, rank: g.rank, icon: g.icon, label: g.label, difficulty_label: g.difficulty_label };
  });

  // 抽题动画：先全部变暗，逐档依次点亮被抽中的卡，并飞入托盘
  document.querySelectorAll(".wall-card").forEach((el) => el.classList.add("dim"));
  const tray = $("drawn-tray");
  const slots = $("drawn-slots");
  tray.hidden = false;
  slots.innerHTML = DRAWN.map(
    (t, i) => `<div class="slot pending" id="slot-${i}"><span class="slot-icon">${t.icon}</span>
      <span class="slot-label">${t.difficulty_label}</span><span class="slot-title">？？？</span></div>`
  ).join("");

  $("start-btn").hidden = true;
  $("draw-btn").disabled = true;

  DRAWN.forEach((t, i) => {
    setTimeout(() => {
      const card = document.querySelector(`.wall-card[data-id="${t.id}"]`);
      if (card) {
        card.classList.remove("dim");
        card.classList.add("picked");
      }
      const slot = $(`slot-${i}`);
      slot.classList.remove("pending");
      slot.classList.add("reveal");
      slot.querySelector(".slot-title").textContent = t.title;
      // 最后一道揭晓后亮出开战按钮
      if (i === DRAWN.length - 1) {
        $("draw-btn").disabled = false;
        $("draw-btn").textContent = "重新拈阄";
        $("start-btn").hidden = false;
      }
    }, 500 + i * 700);
  });
}

// —— 第三步：发起评测 + 比试矩阵 ——
async function startRun() {
  $("wall-error").textContent = "";
  if (!DRAWN.length) return showError("wall-error", "请先「拈阄点题」抽取本场题目");

  const body = {
    config_file: $("config-select").value,
    model_names: MODELS,
    task_ids: DRAWN.map((t) => t.id),
    mode: $("mode-select").value,
    max_concurrency: parseInt($("concurrency").value, 10) || null,
    calibrate: $("calibrate").checked,
  };
  let resp;
  try {
    resp = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // 网络层失败（服务未启动/已断开），fetch 直接 reject，需单独兜底，否则点击静默无反应
    return showError("wall-error", "无法连接论剑台服务，请确认后端已启动后重试");
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "启动失败" }));
    return showError("wall-error", err.detail || "启动失败");
  }
  const { run_id } = await resp.json();
  RUN_ID = run_id;
  ROUND_DONE = false;
  EVAL_RUNNING = true;   // 进入评测：锁定 stepbar
  buildVersus();
  showStage("arena");
  beginStream(run_id);
}

// 比试矩阵：行=选手，列=三道题，每格三盏考察灯（功能/回归/边界）
function buildVersus() {
  // 图例：先讲清三盏灯含义，避免"看不懂"
  const legend = `<div class="versus-legend">
    <span class="lg-item"><span class="lamp-demo func">克敌</span>功能正确</span>
    <span class="lg-item"><span class="lamp-demo reg">守成</span>回归安全</span>
    <span class="lg-item"><span class="lamp-demo edge">应变</span>边界处理</span>
    <span class="lg-sep">·</span>
    <span class="lg-hint">三关依次点亮，全亮方为通关</span>
  </div>`;
  const head =
    `<div class="vs-corner">英雄 \\ 招式</div>` +
    DRAWN.map(
      (t) => `<div class="vs-head">
        <span class="vs-code">${t.id}</span>
        <span class="vs-rank">${t.icon} ${t.difficulty_label}</span>
        <small>${t.title}</small></div>`
    ).join("");
  const rows = MODELS.map(
    (m) =>
      `<div class="vs-name">${m}</div>` +
      DRAWN.map(
        (t) => `<div class="vs-cell waiting" id="cell-${cellId(m, t.id)}"
          role="button" tabindex="0" title="点击围观该选手实时作答"
          data-model="${escapeHtml(m)}" data-task="${escapeHtml(t.id)}">
          <div class="cell-status"><span class="spinner"></span>运笔作答…</div>
          <div class="lamp-set">
            <span class="clamp" data-k="func" title="克敌·功能正确性">克敌</span>
            <span class="clamp" data-k="reg" title="守成·回归安全性">守成</span>
            <span class="clamp" data-k="edge" title="应变·边界处理">应变</span>
          </div>
          <span class="cell-verdict"></span>
          <span class="cell-time"></span>
          <span class="cell-reason" title="落败原因"></span>
        </div>`
      ).join("")
  ).join("");
  $("versus").style.setProperty("--cols", DRAWN.length);
  $("versus").innerHTML = legend + `<div class="versus-grid">` + head + rows + `</div>`;
  // 绑定格子点击：打开实时观战 Console
  $("versus").querySelectorAll(".vs-cell").forEach((el) => {
    const open = () => openLiveConsole(el.dataset.model, el.dataset.task);
    el.onclick = open;
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    };
  });
}

function cellId(model, taskId) {
  return (model + "__" + taskId).replace(/[^a-zA-Z0-9_]/g, "_");
}

function beginStream(runId) {
  let total = 0,
    done = 0,
    finished = false; // 是否已正常收到 done/error，用于区分"正常结束"与"连接中断"
  const es = new EventSource(`/api/stream/${runId}`);
  window.__es = es; // 暴露便于外部主动关闭
  es.onmessage = (e) => {
    const ev = JSON.parse(e.data);
    if (ev.type === "start") {
      total = ev.total_jobs;
      updateProgress(0, total);
    } else if (ev.type === "progress") {
      done += 1;
      lightCell(ev);
      updateProgress(done, total);
    } else if (ev.type === "token") {
      accumulateToken(ev);
    } else if (ev.type === "done") {
      finished = true;
      EVAL_RUNNING = false;
      ROUND_DONE = true;
      renderResults(ev);
      es.close();
      setTimeout(() => showStage("results"), 800);
    } else if (ev.type === "error") {
      finished = true;
      EVAL_RUNNING = false;
      showError("wall-error", "评测出错：" + ev.message);
      showStage("wall");
      es.close();
    }
  };
  es.onerror = () => {
    es.close();
    // 仅在尚未正常结束时提示，避免 done 后浏览器关流误报
    if (!finished) {
      EVAL_RUNNING = false;
      showError("wall-error", "与论剑台的连接中断，请确认服务正常后重新华山论剑");
      showStage("wall");
    }
  };
}

// 点亮某格的三盏考察灯：依次点亮（功→回→边），再亮出胜负
function lightCell(ev) {
  const cid = cellId(ev.model_name, ev.task_id);
  RESULTS[cid] = ev;   // 缓存判定，供 Console 顶部展示最终战果
  const cell = $(`cell-${cid}`);
  if (!cell) return;
  cell.classList.remove("waiting", "writing");
  const status = cell.querySelector(".cell-status");
  if (status) status.remove(); // 收起"运笔作答…"动画
  cell.querySelector(".cell-time").textContent = `${ev.elapsed}s`;

  // 三关按顺序逐一点亮，营造"逐项判定"的比试感
  const order = [
    { k: "func", ok: ev.functional_pass },
    { k: "reg", ok: ev.regression_pass },
    { k: "edge", ok: ev.edge_pass },
  ];
  order.forEach((step, i) => {
    setTimeout(() => {
      const lamp = cell.querySelector(`.clamp[data-k="${step.k}"]`);
      if (lamp) lamp.classList.add(step.ok ? "on" : "miss");
      // 最后一盏点完，落定整格胜负
      if (i === order.length - 1) {
        cell.classList.add(ev.passed ? "pass" : "fail");
        const v = cell.querySelector(".cell-verdict");
        if (v) v.textContent = ev.passed ? "✔ 通关" : "✘ 落败";
        // 落败时亮出一句话原因（哪一关挂 + 关键报错），点开 Console 看完整日志
        const reason = cell.querySelector(".cell-reason");
        if (reason && !ev.passed && ev.fail_reason) {
          reason.textContent = ev.fail_reason;
          reason.title = ev.fail_reason;
        }
        // 神行不在此判定：需全场耗时分布做相对中位数比较，整轮后才有结论，
        // 故仅在「论剑榜单」战力卡与「做题 Console」展示，比试格不再实时点亮。
      }
    }, 220 * i);
  });
  // 若正围观此格，刷新 Console 顶部判定条
  if (LIVE_VIEW === cid) renderLiveVerdict(cid);
}

function updateProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("progress-bar").style.width = pct + "%";
  $("progress-text").textContent = `${done} / ${total}`;
}

// —— 第四步：论剑榜单 ——
function renderResults(data) {
  $("scorecards").innerHTML = data.scorecards
    .map((sc) => {
      const lamps = sc.lamps
        .map((l) => `<span class="lamp ${l.lit ? "" : "off"}">${l.icon}</span>`)
        .join("");
      const hr = sc.highest_rank_icon ? `${sc.highest_rank_icon} ${sc.highest_rank_label}` : "未定级";
      const pct = Math.round(sc.pass_rate * 100);
      return `<div class="sc-card"><h4>${sc.model_name}</h4>
        <div class="lamps">${lamps}</div>
        <div>江湖段位：<b class="tier">${sc.tier}</b><small>（积分 ${sc.weighted_score}）</small></div>
        <div>最高境界：<b>${hr}</b></div>
        <div>通过 ${sc.passed_count}/${sc.total}　神行 <b class="speed-cnt">${sc.speed_count}</b>　均耗时 ${sc.avg_elapsed}s</div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="comment">"${sc.comment}"</div></div>`;
    })
    .join("");
  $("leaderboard").innerHTML =
    `<tr><th>名次</th><th>英雄</th><th>江湖段位</th><th>积分</th><th>境界点亮</th><th>通过率</th><th>均耗时</th></tr>` +
    data.leaderboard
      .map(
        (r) =>
          `<tr><td>${r.place}</td><td class="left">${r.model_name}</td><td><b>${r.tier}</b></td>
          <td>${r.weighted_score}</td><td>${r.lamps}</td><td>${r.passed_count}/${r.total}</td><td>${r.avg_elapsed}s</td></tr>`
      )
      .join("");
  $("discrimination").innerHTML =
    `<tr><th>境界</th><th>题号</th><th>通过率</th><th>区分度</th></tr>` +
    data.discrimination
      .map((d) => {
        const pct = Math.round(d.rate * 100);
        let cls = "tag-easy";
        if (d.tag.includes("黄金")) cls = "tag-gold";
        else if (d.tag.includes("太难")) cls = "tag-hard";
        return `<tr><td>${d.icon}${d.difficulty_label}</td><td class="left"><b>${d.task_id}</b></td>
          <td>${d.passed}/${d.total} (${pct}%)</td><td class="${cls}">${d.tag}</td></tr>`;
      })
      .join("");
}

function showError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// —— 实时观战：累积某格的逐字流式文本，并在打开时实时渲染 ——
function accumulateToken(ev) {
  const cid = cellId(ev.model_name, ev.task_id);
  const buf = LIVE[cid] || (LIVE[cid] = {});
  buf[ev.round] = (buf[ev.round] || "") + ev.delta;
  // 矩阵格子：标记"有实时内容"，并展示挥毫中的字数，让人一眼看出谁在动笔
  const cell = $(`cell-${cid}`);
  if (cell && !cell.classList.contains("pass") && !cell.classList.contains("fail")) {
    cell.classList.add("has-live", "writing");
    const status = cell.querySelector(".cell-status");
    if (status) {
      const chars = Object.values(buf).reduce((s, t) => s + t.length, 0);
      status.innerHTML = `<span class="spinner"></span>挥毫中 · ${chars} 字`;
    }
  }
  // 仅对当前打开的格做 DOM 增量追加（不重建，保留滚动位置）
  if (LIVE_VIEW === cid) appendLiveDelta(cid, ev.round, ev.delta);
}

// 打开某格的实时观战 Console（进行中看逐字流式，结束后看完整流式+最终明细）
function openLiveConsole(model, taskId) {
  const cid = cellId(model, taskId);
  LIVE_VIEW = cid;
  const mask = $("console-mask");
  mask.dataset.live = cid;
  mask.dataset.model = model;
  mask.dataset.task = taskId;
  renderLive(cid);
  mask.hidden = false;
}

// 全量渲染实时观战面板：判定条 + 头部 + 各回合流式正文（打开/切题时调用）
function renderLive(cid) {
  const mask = $("console-mask");
  if (mask.dataset.live !== cid) return;
  const model = mask.dataset.model;
  const taskId = mask.dataset.task;
  $("console-pick").innerHTML =
    `<div class="cpick-row"><span class="cpick-lbl">围观：</span>` +
    `<b>${escapeHtml(model)}</b>　·　<span class="vs-code">${escapeHtml(taskId)}</span></div>` +
    `<div id="live-verdict" class="live-verdict"></div>`;
  renderLiveVerdict(cid);

  const buf = LIVE[cid] || {};
  const rounds = Object.keys(buf).map(Number).sort((a, b) => a - b);
  const body = $("console-body");
  if (!rounds.length) {
    body.innerHTML = `<p class="hint">该选手尚未开始作答，请稍候……</p>`;
    return;
  }
  const multi = rounds.length > 1;
  body.innerHTML = rounds
    .map((rn) => {
      const head = multi ? `第 ${rn} 回合 · 模型实时回复` : `模型实时回复`;
      // pre 带 data-round，便于后续增量 append 精准定位
      return `<details class="cblock" open><summary>${head}</summary>` +
        `<pre class="live-pre" data-round="${rn}">${escapeHtml(buf[rn])}</pre></details>`;
    })
    .join("");
  const last = body.querySelector(".live-pre:last-of-type");
  if (last) last.scrollTop = last.scrollHeight;
}

// 增量追加单段 delta 到对应回合的 pre 末尾（无整树重建，仅贴底时自动滚动）
function appendLiveDelta(cid, round, delta) {
  const body = $("console-body");
  let pre = body.querySelector(`.live-pre[data-round="${round}"]`);
  // 首段或新回合：尚无对应节点，回退到全量渲染建好结构
  if (!pre) {
    renderLive(cid);
    return;
  }
  const atBottom = pre.scrollHeight - pre.scrollTop - pre.clientHeight < 24;
  pre.appendChild(document.createTextNode(delta)); // 文本节点天然转义，安全
  if (atBottom) pre.scrollTop = pre.scrollHeight;   // 仅原本贴底才跟随，不打断回看
}

// Console 顶部判定条：未判定显示"挥毫中"，判定后显示通关/落败+三灯+耗时
function renderLiveVerdict(cid) {
  const el = $("live-verdict");
  if (!el) return;
  const ev = RESULTS[cid];
  if (!ev) {
    el.className = "live-verdict pending";
    el.innerHTML = `<span class="lv-dot"></span>挥毫作答中……`;
    return;
  }
  const lamp = (ok, label) => `<span class="cl ${ok ? "on" : "miss"}">${label}</span>`;
  el.className = "live-verdict " + (ev.passed ? "pass" : "fail");
  el.innerHTML =
    `<span class="lv-verdict">${ev.passed ? "✔ 通关" : "✘ 落败"}</span>` +
    lamp(ev.functional_pass, "克敌") + lamp(ev.regression_pass, "守成") + lamp(ev.edge_pass, "应变") +
    `<span class="lv-time">耗时 ${ev.elapsed}s</span>`;
}

// —— Console：选手×题做题明细对比 ——
function openConsole() {
  LIVE_VIEW = null;             // 结果页明细对比，退出实时观战模式
  $("console-mask").dataset.live = "";
  // 默认勾选全部选手，默认看第一道题
  CONSOLE_PICK = new Set(MODELS);
  CONSOLE_TASK = DRAWN.length ? DRAWN[0].id : null;
  renderConsolePick();
  renderConsoleBody();
  $("console-mask").hidden = false;
}

function renderConsolePick() {
  const models = MODELS.map(
    (m) => `<label class="cpick ${CONSOLE_PICK.has(m) ? "on" : ""}">
      <input type="checkbox" data-model="${m}" ${CONSOLE_PICK.has(m) ? "checked" : ""}/> ${m}</label>`
  ).join("");
  const tasks = DRAWN.map(
    (t) => `<button class="ctask ${CONSOLE_TASK === t.id ? "on" : ""}" data-task="${t.id}">
      ${t.id} · ${t.difficulty_label}</button>`
  ).join("");
  $("console-pick").innerHTML =
    `<div class="cpick-row"><span class="cpick-lbl">选手：</span>${models}</div>` +
    `<div class="cpick-row"><span class="cpick-lbl">题目：</span>${tasks}</div>`;
  $("console-pick").querySelectorAll("input[data-model]").forEach((el) => {
    el.onchange = () => {
      const m = el.dataset.model;
      if (el.checked) CONSOLE_PICK.add(m); else CONSOLE_PICK.delete(m);
      renderConsolePick();
      renderConsoleBody();
    };
  });
  $("console-pick").querySelectorAll(".ctask").forEach((el) => {
    el.onclick = () => { CONSOLE_TASK = el.dataset.task; renderConsolePick(); renderConsoleBody(); };
  });
}

async function renderConsoleBody() {
  const body = $("console-body");
  if (!CONSOLE_TASK || CONSOLE_PICK.size === 0) {
    body.innerHTML = `<p class="hint">请至少勾选一位选手并选择一道题。</p>`;
    return;
  }
  const models = [...CONSOLE_PICK];
  const seq = ++CONSOLE_SEQ;   // 标记本次请求；返回时若已非最新则丢弃，避免旧结果覆盖
  body.innerHTML = `<p class="hint">载入中…</p>`;
  const details = await Promise.all(
    models.map((m) =>
      fetch(`/api/run/${RUN_ID}/detail?model=${encodeURIComponent(m)}&task=${encodeURIComponent(CONSOLE_TASK)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  if (seq !== CONSOLE_SEQ) return;   // 期间又切换了选手/题，放弃过期结果
  // 题面只展示一次（同题对所有选手相同）
  const first = details.find((d) => d);
  const promptBlock = first
    ? `<details class="console-prompt" open><summary>题面 prompt</summary><pre>${escapeHtml(first.prompt)}</pre></details>`
    : "";
  const cols = models
    .map((m, i) => renderConsoleCol(m, details[i]))
    .join("");
  body.innerHTML = promptBlock + `<div class="console-cols" style="--n:${models.length}">${cols}</div>`;
}

function renderConsoleCol(model, d) {
  if (!d) return `<div class="ccol"><h4>${model}</h4><p class="hint">无明细</p></div>`;
  const verdict = d.passed ? `<span class="cv pass">✔ 通关</span>` : `<span class="cv fail">✘ 落败</span>`;
  const lamps =
    `<span class="cl ${d.functional_pass ? "on" : "miss"}">克敌</span>` +
    `<span class="cl ${d.regression_pass ? "on" : "miss"}">守成</span>` +
    `<span class="cl ${d.edge_pass ? "on" : "miss"}">应变</span>` +
    `<span class="cl ${d.speed_pass ? "on" : "miss"}">神行</span>`;
  // 落败原因条：一句话点明哪一关挂、关键报错；完整日志见下方各阶段输出
  const reason = !d.passed && d.fail_reason
    ? `<div class="cfail-reason">⚑ 落败原因：${escapeHtml(d.fail_reason)}</div>`
    : "";
  const phases = ["functional", "regression", "edge"]
    .map(
      (p) =>
        `<details class="cphase"><summary>${p} 输出</summary><pre>${escapeHtml(d.phase_outputs[p] || "(无)")}</pre></details>`
    )
    .join("");
  return `<div class="ccol"><h4>${model} ${verdict}</h4>
    <div class="clamps">${lamps}　${d.elapsed}s</div>
    ${reason}
    <details class="cblock" open><summary>生成代码</summary><pre>${escapeHtml(d.fixed_code || "(空)")}</pre></details>
    <details class="cblock"><summary>原始回复</summary><pre>${escapeHtml(d.raw_response || "(空)")}</pre></details>
    ${phases}</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// —— 选手管理：招贤纳士（增/删/测试，服务端持久化于卷） ——
async function openPlayers() {
  $("pf-error").textContent = "";
  $("players-mask").hidden = false;
  await renderPlayersList();
}

async function renderPlayersList() {
  const box = $("players-list");
  box.innerHTML = `<p class="hint">载入中…</p>`;
  let players = [];
  try {
    players = await (await fetch("/api/players")).json();
  } catch (e) {
    box.innerHTML = `<p class="error">无法连接服务，请确认后端已启动</p>`;
    return;
  }
  if (!players.length) {
    box.innerHTML = `<p class="hint">暂无选手，请在上方新增。</p>`;
    return;
  }
  const keyBadge = (p) => {
    if (p.key_source === "env") return `<span class="badge ok">环境密钥</span>`;
    if (p.key_source === "set") return `<span class="badge ok">密钥已设置</span>`;
    return `<span class="badge no">缺密钥</span>`;
  };
  box.innerHTML = players
    .map(
      (p) => `<div class="player-row" data-name="${escapeHtml(p.name)}">
        <div class="pr-main">
          <div class="pr-name">${escapeHtml(p.name)} ${keyBadge(p)}</div>
          <div class="pr-meta">${escapeHtml(p.model || p.adapter)}　·　${escapeHtml(p.base_url || "(默认端点)")}</div>
          <div class="pr-test" id="pr-test-${cssId(p.name)}"></div>
        </div>
        <div class="pr-acts">
          <button class="link pr-test-btn" data-name="${escapeHtml(p.name)}">测试连通</button>
          <button class="link danger pr-del-btn" data-name="${escapeHtml(p.name)}">删除</button>
        </div>
      </div>`
    )
    .join("");
  box.querySelectorAll(".pr-del-btn").forEach((el) => {
    el.onclick = () => deletePlayer(el.dataset.name);
  });
  box.querySelectorAll(".pr-test-btn").forEach((el) => {
    el.onclick = () => testPlayer(el.dataset.name, el);
  });
}

function cssId(name) {
  return String(name).replace(/[^a-zA-Z0-9_]/g, "_");
}

async function addPlayer() {
  $("pf-error").textContent = "";
  const name = $("pf-name").value.trim();
  const model = $("pf-model").value.trim();
  const base_url = $("pf-baseurl").value.trim();
  const api_key = $("pf-key").value;
  if (!name) return showError("pf-error", "请填写选手名号");
  if (!model) return showError("pf-error", "请填写模型 ID");
  const resp = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, model, base_url, api_key }),
  }).catch(() => null);
  if (!resp) return showError("pf-error", "无法连接服务");
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "新增失败" }));
    return showError("pf-error", err.detail || "新增失败");
  }
  // 清空表单并刷新：选手列表 + 点将页选手卡
  ["pf-name", "pf-model", "pf-baseurl", "pf-key"].forEach((id) => ($(id).value = ""));
  await renderPlayersList();
  await refreshConfigs();
}

async function deletePlayer(name) {
  const resp = await fetch(`/api/players/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => null);
  if (!resp || !resp.ok) return showError("pf-error", "删除失败");
  await renderPlayersList();
  await refreshConfigs();
}

async function testPlayer(name, btn) {
  const slot = $(`pr-test-${cssId(name)}`);
  if (slot) slot.innerHTML = `<span class="hint">连通测试中…</span>`;
  if (btn) btn.disabled = true;
  const resp = await fetch(`/api/players/${encodeURIComponent(name)}/test`, { method: "POST" }).catch(() => null);
  if (btn) btn.disabled = false;
  if (!resp) { if (slot) slot.innerHTML = `<span class="error">无法连接服务</span>`; return; }
  const data = await resp.json().catch(() => ({ ok: false, message: "解析失败" }));
  if (slot) {
    slot.innerHTML = data.ok
      ? `<span class="pr-ok">✔ ${escapeHtml(data.message)}</span>`
      : `<span class="error">✘ ${escapeHtml(data.message)}</span>`;
  }
}

// 增删选手后刷新 CONFIGS 与点将页选手卡，保持联动
async function refreshConfigs() {
  CONFIGS = await (await fetch("/api/configs")).json();
  renderModels();
}

boot();
