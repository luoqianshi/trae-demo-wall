/* ============================================================
   app.js — 主应用入口、路由与视图渲染
   ============================================================ */
const App = (() => {
  const ROUTES = {
    dashboard: { title: "控制台", sub: "今晚的声环境，一目了然" },
    monitor: { title: "实时监听", sub: "开启录制，记录每个噪音时刻" },
    report: { title: "噪音报告", sub: "把数据翻译成生活语言" },
    history: { title: "历史日记", sub: "回看规律，对比趋势" }
  };

  let currentRoute = "dashboard";
  let monitorChartCtx = null; // 频谱 canvas 上下文
  let calMonth = new Date(); // 日历当前月
  let historyFilter = "all";
  let currentReportSessionId = null;
  let lastRenderedEventCount = -1; // 上次渲染的事件数，用于避免每帧重建列表

  // ============ 初始化 ============
  function init() {
    // 首次访问：种子化一周模拟数据
    if (!Storage.isSeeded()) {
      const week = MockDataGenerator.generateWeek(7);
      Storage.bulkSaveSessions(week);
      Storage.markSeeded();
    }

    // 同步设置到 audio 模块
    const settings = Storage.getSettings();
    audioMonitor.setMode(settings.demoMode ? "demo" : "real");
    audioMonitor.setThreshold(settings.threshold);

    bindNav();
    bindModeSwitch();
    bindMonitorControls();
    bindReportControls();
    bindHistoryControls();
    bindModal();
    bindHeroActions();

    window.addEventListener("hashchange", router);
    router();
    startClock();
  }

  // ============ 路由 ============
  function router() {
    const hash = location.hash.replace("#/", "") || "dashboard";
    const route = ROUTES[hash] ? hash : "dashboard";
    currentRoute = route;

    document.querySelectorAll(".nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.route === route);
    });
    document.querySelectorAll(".view").forEach(v => v.hidden = true);
    const view = document.getElementById("view-" + route);
    if (view) view.hidden = false;

    document.getElementById("topbar-title").textContent = ROUTES[route].title;
    document.getElementById("topbar-sub").textContent = ROUTES[route].sub;

    // 渲染对应视图
    if (route === "dashboard") renderDashboard();
    else if (route === "monitor") renderMonitor();
    else if (route === "report") renderReport();
    else if (route === "history") renderHistory();

    refreshIcons();
    // 关闭移动端菜单
    document.querySelector(".sidebar")?.classList.remove("open");
  }

  function refreshIcons() {
    if (window.lucide) lucide.createIcons();
  }

  // 安全替换某个图标元素为新的 lucide 图标（避免 svg 已生成后 setAttribute 失效）
  function setIcon(parentEl, iconClass, iconName) {
    const old = parentEl.querySelector("." + iconClass);
    if (!old) return;
    const el = document.createElement("i");
    el.setAttribute("data-lucide", iconName);
    el.className = iconClass;
    old.replaceWith(el);
    if (window.lucide) lucide.createIcons();
  }

  function navigate(route) { location.hash = "#/" + route; }

  // 按当前模式过滤会话：Demo 模式只看 mock 数据，真实模式只看 real 数据
  function getVisibleSessions() {
    const mode = Storage.getSettings().demoMode ? "mock" : "real";
    return Storage.getAllSessions().filter(s => s.mode === mode);
  }

  // ============ 导航绑定 ============
  function bindNav() {
    document.querySelectorAll(".nav-item").forEach(el => {
      el.addEventListener("click", e => { e.preventDefault(); navigate(el.dataset.route); });
    });
    const menuToggle = document.getElementById("menu-toggle");
    menuToggle?.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("open");
    });
  }

  // ============ 模式切换 ============
  function bindModeSwitch() {
    const settings = Storage.getSettings();
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === (settings.demoMode ? "demo" : "real"));
    });
    updateModeNote();

    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (audioMonitor.isRunning()) {
          toast("监听进行中，请先停止再切换模式");
          return;
        }
        const mode = btn.dataset.mode;
        document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b === btn));
        Storage.saveSettings({ demoMode: mode === "demo" });
        audioMonitor.setMode(mode);
        updateModeNote();
        if (mode === "real") {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            toast("已切换到真实麦克风模式");
          } catch (e) {
            toast("无法访问麦克风，已回退 Demo 模式");
            Storage.saveSettings({ demoMode: true });
            audioMonitor.setMode("demo");
            document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === "demo"));
            updateModeNote();
          }
        } else {
          toast("已切换到 Demo 模式");
        }
        // 切换后重新渲染当前视图，使数据按新模式过滤
        router();
      });
    });
  }
  function updateModeNote() {
    const s = Storage.getSettings();
    document.getElementById("sidebar-mode-note").textContent =
      s.demoMode ? "当前为 Demo 模式，数据为模拟生成" : "已启用真实麦克风采集";
  }

  // ============ 时钟 ============
  function startClock() {
    function tick() {
      const d = new Date();
      const h = d.getHours().toString().padStart(2,"0");
      const m = d.getMinutes().toString().padStart(2,"0");
      document.getElementById("clock-text").textContent = `${h}:${m}`;
    }
    tick();
    setInterval(tick, 10000);
  }

  // ============ Hero / Dashboard ============
  function bindHeroActions() {
    document.getElementById("hero-start").addEventListener("click", () => navigate("monitor"));
    document.getElementById("hero-goto-monitor").addEventListener("click", () => {
      navigate("monitor");
      // 跳转后高亮设置区域并引导
      setTimeout(() => {
        const modeSwitch = document.querySelector(".mode-switch");
        const thresholdCtrl = document.querySelector(".threshold-control");
        [modeSwitch, thresholdCtrl].forEach(el => {
          if (el) {
            el.classList.add("highlight-pulse");
            setTimeout(() => el.classList.remove("highlight-pulse"), 3200);
          }
        });
        // 滚动到阈值控件，确保移动端也能看到
        if (thresholdCtrl) thresholdCtrl.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("下方可切换监听模式、调整噪音阈值（超此值自动标记事件）");
      }, 120);
    });
  }

  function renderDashboard() {
    const sessions = getVisibleSessions();
    const today = new Date(); today.setHours(0,0,0,0);
    const next = new Date(today.getTime() + 86400000);
    const todaySessions = sessions.filter(s => {
      const t = new Date(s.startTime); return t >= today && t < next;
    });

    // Hero 数字（取最近一次会话或当前演示值）
    const allSamples = todaySessions.flatMap(s => s.samples);
    const peak = allSamples.length ? Math.max(...allSamples.map(s=>s.db)) : 0;
    const avg = allSamples.length ? allSamples.reduce((a,b)=>a+b.db,0)/allSamples.length : 0;
    const duration = todaySessions.reduce((a,s)=>a+s.durationSec, 0);

    const heroDb = document.getElementById("hero-db");
    const heroStatus = document.getElementById("hero-status");
    const heroRing = document.getElementById("hero-ring-progress");
    if (peak) {
      heroDb.textContent = peak.toFixed(0);
      heroDb.style.color = peak >= 60 ? "var(--coral)" : (peak >= 45 ? "var(--amber)" : "var(--mint)");
      heroStatus.textContent = peak >= 60 ? "今日偏吵" : (peak >= 45 ? "今日有警戒" : "今日较安静");
      const pct = Math.min(peak / 90, 1);
      heroRing.style.strokeDashoffset = 741 * (1 - pct);
      heroRing.style.stroke = peak >= 60 ? "var(--coral)" : (peak >= 45 ? "var(--amber)" : "var(--mint)");
    } else {
      heroDb.textContent = "--";
      heroStatus.textContent = "暂无今日数据";
      heroRing.style.strokeDashoffset = 741;
    }

    document.getElementById("qs-peak").textContent = peak ? peak.toFixed(1) + " dB" : "-- dB";
    document.getElementById("qs-avg").textContent = avg ? avg.toFixed(1) + " dB" : "-- dB";
    document.getElementById("qs-duration").textContent = duration ? ReportGenerator.formatDuration(duration) : "--";

    // 今日曲线
    Charts.renderToday(document.getElementById("chart-today"), sessions);

    // Top3 时段
    const topList = document.getElementById("top-list");
    const tops = ReportGenerator.topLoudHours(todaySessions);
    if (!tops.length) {
      topList.innerHTML = '<li class="top-list-empty">今日暂无数据</li>';
    } else {
      topList.innerHTML = tops.map((t, i) => `
        <li>
          <span class="top-rank">${i+1}</span>
          <span class="top-time">${t.hour.toString().padStart(2,"0")}:00</span>
          <span class="top-desc">平均 ${t.avg.toFixed(1)} dB · ${t.hour>=22||t.hour<6?"夜间":(t.hour>=18?"傍晚":"白天")}</span>
          <span class="top-db">${t.max.toFixed(1)} dB</span>
        </li>
      `).join("");
    }

    // 近期会话
    const recent = document.getElementById("recent-sessions");
    const recent5 = sessions.slice(0, 5);
    if (!recent5.length) {
      recent.innerHTML = '<div class="empty">暂无会话，点击"开始监听"记录第一段</div>';
    } else {
      recent.innerHTML = recent5.map(s => {
        const cls = s.peakDb >= 60 ? "loud" : (s.peakDb >= 45 ? "warn" : "");
        const d = new Date(s.startTime);
        const dateStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
        return `
          <div class="session-card ${cls}" data-id="${s.id}">
            <div class="sc-time">${dateStr}</div>
            <div class="sc-peak">${s.peakDb.toFixed(0)} dB</div>
            <div class="sc-meta">峰值 · ${ReportGenerator.formatDuration(s.durationSec)} · ${s.events.length} 事件</div>
          </div>
        `;
      }).join("");
      recent.querySelectorAll(".session-card").forEach(card => {
        card.addEventListener("click", () => {
          currentReportSessionId = card.dataset.id;
          navigate("report");
        });
      });
    }
    refreshIcons();
  }

  // ============ Monitor ============
  function bindMonitorControls() {
    const toggleBtn = document.getElementById("btn-toggle-rec");
    const toggleText = document.getElementById("btn-toggle-text");
    const markBtn = document.getElementById("btn-mark-event");
    const thresholdRange = document.getElementById("threshold-range");
    const thresholdVal = document.getElementById("threshold-val");

    thresholdRange.value = Storage.getSettings().threshold;
    thresholdVal.textContent = thresholdRange.value + " dB";

    thresholdRange.addEventListener("input", () => {
      thresholdVal.textContent = thresholdRange.value + " dB";
      Storage.saveSettings({ threshold: +thresholdRange.value });
      audioMonitor.setThreshold(+thresholdRange.value);
    });

    toggleBtn.addEventListener("click", async () => {
      if (!audioMonitor.isRunning()) {
        try {
          await startMonitor();
        } catch (e) {
          toast(e.message || "无法启动监听");
        }
      } else {
        stopMonitor();
      }
    });

    markBtn.addEventListener("click", () => {
      if (!audioMonitor.isRunning()) return;
      openEventModal();
    });

    // 离开页面时自动停止
    window.addEventListener("beforeunload", () => {
      if (audioMonitor.isRunning()) audioMonitor.stop();
    });
  }

  async function startMonitor() {
    const toggleBtn = document.getElementById("btn-toggle-rec");
    const toggleText = document.getElementById("btn-toggle-text");
    const markBtn = document.getElementById("btn-mark-event");
    const recIndicator = document.getElementById("rec-indicator");
    const navPulse = document.getElementById("nav-rec-pulse");

    await audioMonitor.start(
      (db, startTime) => updateGauge(db, startTime),
      (spectrum, waveform) => drawSpectrum(spectrum, waveform)
    );

    lastRenderedEventCount = -1; // 重置，确保首次渲染
    updateEventList();
    toggleBtn.classList.add("recording");
    setIcon(toggleBtn, "btn-icon", "square");
    toggleText.textContent = "停止监听";
    markBtn.disabled = false;
    recIndicator.hidden = false;
    navPulse.hidden = false;
    refreshIcons();
    toast(Storage.getSettings().demoMode ? "Demo 监听已开始（模拟数据）" : "真实监听已开始");
  }

  function stopMonitor() {
    const session = audioMonitor.stop();
    const toggleBtn = document.getElementById("btn-toggle-rec");
    const toggleText = document.getElementById("btn-toggle-text");
    const markBtn = document.getElementById("btn-mark-event");
    const recIndicator = document.getElementById("rec-indicator");
    const navPulse = document.getElementById("nav-rec-pulse");

    toggleBtn.classList.remove("recording");
    setIcon(toggleBtn, "btn-icon", "mic");
    toggleText.textContent = "开始监听";
    markBtn.disabled = true;
    recIndicator.hidden = true;
    navPulse.hidden = true;

    if (session) {
      Storage.saveSession(session);
      toast(`已保存会话：峰值 ${session.peakDb} dB，${session.events.length} 个事件`);
      renderMonitor();
    }
    refreshIcons();
  }

  function updateGauge(db, startTime) {
    const gaugeDb = document.getElementById("gauge-db");
    const gaugeStatus = document.getElementById("gauge-status");
    const needle = document.getElementById("gauge-needle");
    const recTime = document.getElementById("rec-time");

    gaugeDb.textContent = db.toFixed(1);
    // 指针角度：0dB → -90°, 90dB → +90°
    const angle = Math.max(-90, Math.min(90, (db - 45) * 2));
    needle.style.transform = `rotate(${angle}deg)`;

    if (db < 40) { gaugeStatus.textContent = "安静"; gaugeStatus.style.color = "var(--mint-soft)"; }
    else if (db < 60) { gaugeStatus.textContent = "警戒"; gaugeStatus.style.color = "var(--amber-soft)"; }
    else { gaugeStatus.textContent = "嘈杂！"; gaugeStatus.style.color = "var(--coral-soft)"; }

    // 录制时长
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2,"0");
    const s = (elapsed % 60).toString().padStart(2,"0");
    recTime.textContent = `${m}:${s}`;

    // 仅在事件数量变化时才重渲染列表（避免每帧重建导致动画无法完成、元素不可见）
    const evCount = (audioMonitor.events || []).length;
    if (evCount !== lastRenderedEventCount) {
      lastRenderedEventCount = evCount;
      updateEventList();
    }
  }

  function drawSpectrum(spectrum, waveform) {
    const canvas = document.getElementById("spectrum-canvas");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0,0,w,h);

    // 背景网格
    ctx.strokeStyle = "rgba(245,241,232,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = h * i / 4;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    // 频谱柱
    const bars = spectrum.length;
    const barW = w / bars;
    for (let i = 0; i < bars; i++) {
      const v = spectrum[i] / 255;
      const barH = v * h * 0.85;
      const grad = ctx.createLinearGradient(0, h, 0, h - barH);
      if (v > 0.7) { grad.addColorStop(0, "#ff6b6b"); grad.addColorStop(1, "#f5a623"); }
      else if (v > 0.4) { grad.addColorStop(0, "#f5a623"); grad.addColorStop(1, "#e8b04d"); }
      else { grad.addColorStop(0, "#4ecdc4"); grad.addColorStop(1, "#6fdcd4"); }
      ctx.fillStyle = grad;
      ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
    }

    // 波形叠加
    ctx.strokeStyle = "rgba(245,241,232,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const wfLen = waveform.length;
    for (let i = 0; i < wfLen; i++) {
      const x = (i / wfLen) * w;
      const y = (waveform[i] / 255) * h;
      if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // 阈值线
    const threshold = Storage.getSettings().threshold;
    const ty = h - ((threshold - 20) / 80) * h * 0.85;
    if (ty > 0 && ty < h) {
      ctx.strokeStyle = "rgba(255,107,107,0.5)";
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function updateEventList() {
    const list = document.getElementById("event-list");
    const countEl = document.getElementById("event-count");
    const events = audioMonitor.events || [];
    countEl.textContent = events.length + " 条";
    if (!events.length) {
      list.innerHTML = '<div class="empty">开始监听后，超阈值噪音将自动记录于此</div>';
      return;
    }
    list.innerHTML = events.slice().reverse().map(e => {
      const d = new Date(e.t);
      const time = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
      return `
        <div class="event-item ${e.auto ? "" : "manual"}">
          <span class="event-time">${time}</span>
          <span class="event-db">${e.db.toFixed(1)} dB</span>
          <span class="event-label">${e.label}</span>
          <span class="event-tag">${e.auto ? "自动" : "手动"}</span>
        </div>
      `;
    }).join("");
  }

  function renderMonitor() {
    // 重置仪表
    const gaugeDb = document.getElementById("gauge-db");
    if (!audioMonitor.isRunning()) {
      gaugeDb.textContent = "0.0";
      document.getElementById("gauge-status").textContent = "未开始";
      document.getElementById("gauge-needle").style.transform = "rotate(-90deg)";
      updateEventList();
    }
  }

  // ============ 事件标记弹窗 ============
  function bindModal() {
    const modal = document.getElementById("event-modal");
    modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
    let selectedLabel = "";
    modal.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        modal.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        selectedLabel = chip.dataset.label;
      });
    });
    document.getElementById("modal-confirm").addEventListener("click", () => {
      const custom = document.getElementById("label-custom").value.trim();
      const label = custom || selectedLabel || "手动标记";
      const ev = audioMonitor.addManualEvent(label);
      const d = new Date(ev.t);
      toast(`已标记 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} · ${label}`);
      lastRenderedEventCount = -1; // 手动事件后强制刷新
      updateEventList();
      closeModal();
      document.getElementById("label-custom").value = "";
      selectedLabel = "";
      modal.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
    });
  }
  function openEventModal() {
    const modal = document.getElementById("event-modal");
    const lastDb = audioMonitor.samples.length ? audioMonitor.samples[audioMonitor.samples.length-1].db : 0;
    document.getElementById("modal-db").textContent = lastDb.toFixed(1) + " dB";
    modal.hidden = false;
  }
  function closeModal() { document.getElementById("event-modal").hidden = true; }

  // ============ Report ============
  function bindReportControls() {
    const select = document.getElementById("report-session-select");
    select.addEventListener("change", () => {
      currentReportSessionId = select.value;
      renderReportContent();
    });
    document.getElementById("btn-export-card").addEventListener("click", exportReportCard);
  }

  function renderReport() {
    const sessions = getVisibleSessions();
    const select = document.getElementById("report-session-select");
    select.innerHTML = sessions.slice(0, 30).map(s => {
      const d = new Date(s.startTime);
      const label = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} · 峰值 ${s.peakDb.toFixed(0)}dB`;
      return `<option value="${s.id}" ${s.id===currentReportSessionId?"selected":""}>${label}</option>`;
    }).join("");
    if (!currentReportSessionId && sessions.length) currentReportSessionId = sessions[0].id;
    renderReportContent();
  }

  function renderReportContent() {
    const sessions = getVisibleSessions();
    const session = sessions.find(s => s.id === currentReportSessionId) || sessions[0];
    if (!session) {
      document.getElementById("insight-text").textContent = "暂无会话数据，请先在实时监听中录制。";
      return;
    }
    // 曲线
    Charts.renderSession(document.getElementById("chart-session"), session);
    // 统计
    const stats = ReportGenerator.sessionStats(session);
    document.getElementById("report-stats").innerHTML = `
      <div class="rstat"><span class="rstat-label">峰值</span><span class="rstat-val" style="color:var(--coral-soft)">${stats.peak.toFixed(1)}</span></div>
      <div class="rstat"><span class="rstat-label">平均</span><span class="rstat-val">${stats.avg.toFixed(1)}</span></div>
      <div class="rstat"><span class="rstat-label">时长</span><span class="rstat-val">${Math.round(stats.duration/60)}m</span></div>
      <div class="rstat"><span class="rstat-label">安静占比</span><span class="rstat-val" style="color:var(--mint-soft)">${stats.quietRatio}%</span></div>
    `;
    // AI 洞察
    document.getElementById("insight-text").innerHTML = ReportGenerator.generateInsight(session, sessions);
    const tags = ReportGenerator.insightTags(session);
    document.getElementById("insight-tags").innerHTML = tags.map(t => `<span class="insight-tag">${t}</span>`).join("");
    // 热力图
    renderHeatmap(sessions);
    // 报告卡
    renderReportCard(session, stats);
    refreshIcons();
  }

  function renderHeatmap(sessions) {
    const container = document.getElementById("heatmap");
    const grid = ReportGenerator.heatmapData(sessions, 7);
    // 找最大值用于归一化
    let maxDb = 0;
    grid.forEach(row => row.hours.forEach(v => { if (v && v > maxDb) maxDb = v; }));

    const dayLabels = ["周一","周二","周三","周四","周五","周六","周日"];
    let html = '<div class="hm-hour-labels"><span></span>';
    for (let h = 0; h < 24; h++) html += `<span>${h.toString().padStart(2,"0")}</span>`;
    html += '</div><div class="heatmap-grid">';
    grid.forEach(row => {
      const d = row.date;
      const label = dayLabels[(d.getDay()+6)%7] + " " + (d.getMonth()+1) + "/" + d.getDate();
      html += `<div class="hm-label">${label}</div>`;
      for (let h = 0; h < 24; h++) {
        const v = row.hours[h];
        if (v === null) {
          html += '<div class="hm-cell"></div>';
        } else {
          const ratio = v / maxDb;
          const color = heatColor(ratio);
          html += `<div class="hm-cell" style="background:${color}" data-tip="${label} ${h.toString().padStart(2,"0")}:00 · ${v.toFixed(1)} dB"></div>`;
        }
      }
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function heatColor(ratio) {
    // 低 → 薄荷青，中 → 琥珀，高 → 珊瑚
    const r = Math.max(0, Math.min(1, ratio));
    if (r < 0.5) {
      const t = r / 0.5;
      return interpColor([26,58,74], [78,205,196], t);
    } else {
      const t = (r - 0.5) / 0.5;
      return interpColor([78,205,196], [255,107,107], t);
    }
  }
  function interpColor(c1, c2, t) {
    const r = Math.round(c1[0] + (c2[0]-c1[0])*t);
    const g = Math.round(c1[1] + (c2[1]-c1[1])*t);
    const b = Math.round(c1[2] + (c2[2]-c1[2])*t);
    return `rgb(${r},${g},${b})`;
  }

  function renderReportCard(session, stats) {
    const d = new Date(session.startTime);
    const end = new Date(session.endTime);
    document.getElementById("rc-date").textContent =
      `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} — ${end.getHours().toString().padStart(2,"0")}:${end.getMinutes().toString().padStart(2,"0")}`;
    document.getElementById("rc-peak").textContent = stats.peak.toFixed(1) + " dB";
    document.getElementById("rc-avg").textContent = stats.avg.toFixed(1) + " dB";
    document.getElementById("rc-duration").textContent = ReportGenerator.formatDuration(stats.duration);
    document.getElementById("rc-quiet").textContent = stats.quietRatio + "%";
    const gradeEl = document.getElementById("rc-grade");
    gradeEl.textContent = stats.grade.label;
    gradeEl.style.color = stats.grade.color === "coral" ? "var(--coral-soft)" : (stats.grade.color === "amber" ? "var(--amber-soft)" : "var(--mint-soft)");
    gradeEl.style.borderColor = stats.grade.color === "coral" ? "rgba(255,107,107,0.3)" : (stats.grade.color === "amber" ? "var(--border-amber)" : "rgba(78,205,196,0.3)");
    document.getElementById("rc-time").textContent = "生成于 " + new Date().toLocaleString("zh-CN");

    // 时间线（迷你 SVG）
    drawTimeline(session);
  }

  function drawTimeline(session) {
    const container = document.getElementById("rc-timeline");
    const samples = session.samples;
    if (!samples.length) { container.innerHTML = ""; return; }
    const w = container.clientWidth || 600;
    const h = 60;
    const threshold = Storage.getSettings().threshold;
    const startT = new Date(samples[0].t).getTime();
    const endT = new Date(samples[samples.length-1].t).getTime();
    const span = Math.max(1, endT - startT);
    const maxDb = Math.max(...samples.map(s=>s.db), threshold + 5);
    const minDb = 25;

    let path = "";
    let area = `M 0 ${h} `;
    samples.forEach((s, i) => {
      const x = (i / (samples.length-1)) * w;
      const y = h - ((s.db - minDb) / (maxDb - minDb)) * h;
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
      area += `L ${x} ${y} `;
    });
    area += `L ${w} ${h} Z`;

    const ty = h - ((threshold - minDb) / (maxDb - minDb)) * h;
    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(245,166,35,0.4)"/>
            <stop offset="100%" stop-color="rgba(245,166,35,0)"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="${ty}" x2="${w}" y2="${ty}" stroke="rgba(255,107,107,0.4)" stroke-width="1" stroke-dasharray="4,4"/>
        <path d="${area}" fill="url(#tlGrad)"/>
        <path d="${path}" stroke="#f5a623" stroke-width="1.5" fill="none"/>
      </svg>
    `;
  }

  function exportReportCard() {
    toast("报告卡已准备（可右键卡片截图保存，或使用浏览器打印为 PDF）");
    // 高亮报告卡
    const card = document.getElementById("report-card");
    card.style.boxShadow = "0 0 0 2px var(--amber), 0 0 40px var(--amber-glow)";
    setTimeout(() => { card.style.boxShadow = ""; }, 2000);
    // 触发打印
    setTimeout(() => {
      document.body.classList.add("printing");
      window.print();
    }, 300);
  }

  // ============ History ============
  function bindHistoryControls() {
    document.getElementById("cal-prev").addEventListener("click", () => {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1);
      renderHistory();
    });
    document.getElementById("cal-next").addEventListener("click", () => {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
      renderHistory();
    });
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        historyFilter = tab.dataset.filter;
        renderHistoryList();
      });
    });
  }

  function renderHistory() {
    renderCalendar();
    renderCompare();
    renderHistoryList();
    refreshIcons();
  }

  function renderCalendar() {
    const sessions = getVisibleSessions();
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    document.getElementById("cal-title").textContent = `${year}年${month+1}月 噪音日历`;

    const first = new Date(year, month, 1);
    const lastDay = new Date(year, month+1, 0).getDate();
    const startWeekday = (first.getDay() + 6) % 7; // 周一为首
    const today = new Date(); today.setHours(0,0,0,0);

    // 按天聚合
    const dayMap = {};
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d); date.setHours(0,0,0,0);
      const next = new Date(date.getTime() + 86400000);
      const dayS = sessions.filter(s => {
        const t = new Date(s.startTime); return t >= date && t < next;
      });
      if (dayS.length) {
        const allSamples = dayS.flatMap(s=>s.samples);
        const avg = allSamples.reduce((a,b)=>a+b.db,0)/allSamples.length;
        const peak = Math.max(...allSamples.map(s=>s.db));
        dayMap[d] = { avg, peak, count: dayS.length };
      }
    }

    let html = '<div class="cal-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>';
    html += '<div class="cal-grid">';
    for (let i = 0; i < startWeekday; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= lastDay; d++) {
      const data = dayMap[d];
      const date = new Date(year, month, d); date.setHours(0,0,0,0);
      const isToday = date.getTime() === today.getTime();
      let bg = "", scoreText = "";
      if (data) {
        const ratio = Math.min(data.avg / 55, 1);
        bg = `background:${heatColor(ratio)};border-color:transparent;`;
        scoreText = `<span class="cal-day-score">${data.peak.toFixed(0)}</span>`;
      }
      html += `<div class="cal-day ${data?"has-data":""} ${isToday?"today":""}" style="${bg}" ${data?`data-date="${year}-${month+1}-${d}"`:""}>
        <span class="cal-day-num">${d}</span>
        ${scoreText}
      </div>`;
    }
    html += '</div>';
    document.getElementById("calendar").innerHTML = html;

    // 点击有数据的日子跳转报告
    document.querySelectorAll(".cal-day.has-data").forEach(el => {
      el.addEventListener("click", () => {
        const dateStr = el.dataset.date;
        const [y,m,d] = dateStr.split("-").map(Number);
        const dayStart = new Date(y, m-1, d); dayStart.setHours(0,0,0,0);
        const sessions = getVisibleSessions();
        const sess = sessions.find(s => {
          const t = new Date(s.startTime);
          return t >= dayStart && t < new Date(dayStart.getTime()+86400000);
        });
        if (sess) {
          currentReportSessionId = sess.id;
          navigate("report");
        }
      });
    });
  }

  function renderCompare() {
    const sessions = getVisibleSessions();
    const comp = ReportGenerator.weeklyComparison(sessions);
    Charts.renderCompare(document.getElementById("chart-compare"), comp);

    const badge = document.getElementById("compare-badge");
    const diff = comp.avgDiff;
    if (!comp.lastWeek.count) {
      badge.textContent = "无上周数据"; badge.className = "compare-badge";
    } else if (diff > 1) {
      badge.textContent = `↑ 升高 ${diff.toFixed(1)} dB`; badge.className = "compare-badge up";
    } else if (diff < -1) {
      badge.textContent = `↓ 降低 ${Math.abs(diff).toFixed(1)} dB`; badge.className = "compare-badge down";
    } else {
      badge.textContent = "基本持平"; badge.className = "compare-badge";
    }

    const avgClass = comp.avgDiff > 1 ? "up" : (comp.avgDiff < -1 ? "down" : "");
    const peakClass = comp.peakDiff > 1 ? "up" : (comp.peakDiff < -1 ? "down" : "");
    document.getElementById("compare-stats").innerHTML = `
      <div class="cstat">
        <div class="cstat-label">本周平均 / 上周平均</div>
        <div class="cstat-vals">
          <span class="cstat-val">${comp.thisWeek.avg.toFixed(1)}</span>
          <span class="cstat-val" style="color:var(--text-tertiary)">/ ${comp.lastWeek.avg.toFixed(1)} dB</span>
          <span class="cstat-diff ${avgClass}">${comp.avgDiff>=0?"+":""}${comp.avgDiff.toFixed(1)}</span>
        </div>
      </div>
      <div class="cstat">
        <div class="cstat-label">本周峰值 / 上周峰值</div>
        <div class="cstat-vals">
          <span class="cstat-val">${comp.thisWeek.peak.toFixed(1)}</span>
          <span class="cstat-val" style="color:var(--text-tertiary)">/ ${comp.lastWeek.peak.toFixed(1)} dB</span>
          <span class="cstat-diff ${peakClass}">${comp.peakDiff>=0?"+":""}${comp.peakDiff.toFixed(1)}</span>
        </div>
      </div>
    `;
  }

  function renderHistoryList() {
    const sessions = getVisibleSessions();
    let filtered = sessions;
    if (historyFilter === "night") {
      filtered = sessions.filter(s => {
        const h = new Date(s.startTime).getHours();
        return h >= 22 || h < 6;
      });
    } else if (historyFilter === "loud") {
      filtered = sessions.filter(s => s.peakDb >= 55);
    }

    const list = document.getElementById("history-list");
    if (!filtered.length) {
      list.innerHTML = '<div class="empty">暂无符合条件的会话</div>';
      return;
    }
    list.innerHTML = filtered.map(s => {
      const cls = s.peakDb >= 60 ? "loud" : (s.peakDb >= 45 ? "warn" : "");
      const d = new Date(s.startTime);
      const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
      const modeTag = s.mode === "mock" ? "Demo" : "真实";
      return `
        <div class="history-item ${cls}">
          <div class="hi-bar"></div>
          <div class="hi-time">
            <div class="hi-date">${dateStr}</div>
            <div class="hi-meta">${ReportGenerator.formatDuration(s.durationSec)} · 平均 ${s.avgDb.toFixed(1)} dB · ${s.events.length} 事件 · ${modeTag}</div>
          </div>
          <div class="hi-peak">
            <div class="hi-peak-val">${s.peakDb.toFixed(0)}</div>
            <div class="hi-peak-label">峰值 dB</div>
          </div>
          <div class="hi-actions">
            <button class="icon-btn" data-action="view" data-id="${s.id}" aria-label="查看"><i data-lucide="eye"></i></button>
            <button class="icon-btn danger" data-action="delete" data-id="${s.id}" aria-label="删除"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll(".icon-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (btn.dataset.action === "view") {
          currentReportSessionId = id;
          navigate("report");
        } else if (btn.dataset.action === "delete") {
          if (confirm("确定删除此会话？")) {
            Storage.deleteSession(id);
            toast("已删除会话");
            renderHistory();
          }
        }
      });
    });
    refreshIcons();
  }

  // ============ Toast ============
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => { el.hidden = true; }, 300);
    }, 2600);
  }

  return { init, toast };
})();

document.addEventListener("DOMContentLoaded", App.init);
