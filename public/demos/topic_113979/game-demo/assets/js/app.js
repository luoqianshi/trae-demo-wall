// Workspace Switcher 游戏化交互 Demo —— 应用逻辑（S3 软桌面模拟 · 显示器内交互）
//
// 核心模型：6 阶段状态机 + 大显示器视觉模拟器 + 一键自动播放。
// 全部交互融合在显示器内部：托盘图标触发 → flyout 管理 → 自动播放 → 恢复 → 证据覆盖层。
//
//   preview          → 轮播 4 桌面，托盘图标高亮 + 箭头提示，点击打开 flyout
//   managing         → flyout 弹出（显示器内），选择释放目标，触发自动播放
//   releasing        → 自动：逐桌面 记录 → 收起 → 干净桌面
//   clean            → 干净桌面 + 目标卡，托盘图标高亮 + 箭头提示，点击打开恢复 flyout
//   restore-managing → flyout 弹出（显示器内），选择恢复，触发自动播放（与释放入口对称）
//   restoring        → 自动：逐桌面 恢复 → 8/8 URL 归位
//   done             → 证据覆盖层（显示器内）+ 重新演示
//
// 安全边界：本文件不调用任何真实系统 API。所有日志行均带 [SIMULATED] 标记。

(function () {
  "use strict";

  var D = window.DEMO_DATA || {};
  var data = D.metrics || {};
  var safetyStatement = D.safetyStatement ||
    "本页面是安全的前端模拟，不会操作真实窗口、虚拟桌面、PowerToys 或 PowerShell。";
  var simNote = D.simulationNote || "";
  var apps = D.apps || {};
  var desktops = D.desktops || [];
  var windows = D.representativeWindows || [];
  var browserUrls = D.browserUrls || [];
  var releaseTargets = D.releaseTargets || [];
  var debugMissions = D.debugMissions || [];
  var evidenceStrip = D.evidenceStrip || [];
  var phases = (window.SCENES && window.SCENES.phases) || [];

  // 任务栏固定应用（始终显示，模拟 Windows 任务栏固定图标）
  var pinnedTaskbarApps = ["edge", "explorer", "terminal", "chat"];

  // ---- 查找表 ----
  var desktopMap = {};
  desktops.forEach(function (d) { desktopMap[d.id] = d; });
  var windowMap = {};
  windows.forEach(function (w) { windowMap[w.id] = w; });

  function windowsOnDesktop(dId) {
    return windows.filter(function (w) { return w.desktopId === dId; });
  }

  // ---- 运行时状态 ----
  var phase = "preview";
  var activeDesktopIndex = 0;
  var desktopStates = desktops.map(function () { return "active"; });
  var releaseTarget = null;
  var urlRestoredCount = 0;
  var fullEvidenceOpen = false;
  var carouselTimer = null;
  var playbackTimers = [];

  // ---- DOM 引用 ----
  var el = {};
  function cacheDom() {
    el.safety = document.getElementById("safety-statement");
    el.simNote = document.getElementById("sim-note");
    el.monitorScreen = document.getElementById("monitor-screen");
    el.desktopLabel = document.getElementById("desktop-label");
    el.desktopIcons = document.getElementById("desktop-icons");
    el.windowLayer = document.getElementById("window-layer");
    el.taskbar = document.getElementById("taskbar");
    el.desktopIndicator = document.getElementById("desktop-indicator");
    el.monitorOverlay = document.getElementById("monitor-overlay");
    el.phaseToast = document.getElementById("phase-toast");
    el.urlBadge = document.getElementById("url-restore-badge");
    el.mgmtFlyout = document.getElementById("mgmt-flyout");
    el.evidenceOverlay = document.getElementById("evidence-overlay");
    el.arrowHint = document.getElementById("arrow-hint");
    el.logList = document.getElementById("log-list");
  }

  // ---- 日志（次要区域，所有行带 [SIMULATED]）----
  function log(message) {
    if (!el.logList) return;
    var time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    var line = document.createElement("li");
    line.className = "log-line";
    line.textContent = "[" + time + "] [SIMULATED] " + message;
    el.logList.appendChild(line);
    while (el.logList.children.length > 6) {
      el.logList.removeChild(el.logList.firstChild);
    }
    el.logList.scrollTop = el.logList.scrollHeight;
  }

  // ---- 工具 ----
  function currentPhase() {
    return window.SCENES.byId(phase);
  }

  function clearPlayback() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
    playbackTimers.forEach(function (t) { clearTimeout(t); });
    playbackTimers = [];
  }

  function schedule(fn, delay) {
    var t = setTimeout(fn, delay);
    playbackTimers.push(t);
    return t;
  }

  // ---- 渲染：阶段 toast（显示器顶部）----
  function renderPhaseToast() {
    if (!el.phaseToast) return;
    var p = currentPhase();
    if (!p) { el.phaseToast.style.display = "none"; return; }
    el.phaseToast.style.display = "";
    el.phaseToast.innerHTML =
      '<span class="toast-label">' + p.label + '</span>' +
      '<span class="toast-hint">' + p.hint + '</span>';
  }

  // ---- 渲染：显示器（核心）----
  function renderMonitor() {
    var d = desktops[activeDesktopIndex];
    if (!d) return;
    var state = desktopStates[activeDesktopIndex];

    // 桌面标签 + 壁纸色
    if (el.desktopLabel) {
      el.desktopLabel.innerHTML =
        '<span class="desktop-name">' + d.name + '</span>' +
        '<span class="desktop-role">' + d.role + ' · ' + d.roleEn + '</span>' +
        '<span class="desktop-state-tag state-tag--' + state + '">' + desktopStateLabel(state) + '</span>';
    }
    if (el.monitorScreen) {
      el.monitorScreen.style.background = d.tint;
      el.monitorScreen.className = "monitor-screen phase--" + phase + " desktop--" + state;
    }

    // 桌面图标
    renderDesktopIcons();

    // 窗口层
    if (el.windowLayer) {
      el.windowLayer.innerHTML = "";
      if (state === "closed") {
        // 干净桌面：不渲染窗口
      } else {
        var list = windowsOnDesktop(d.id);
        list.forEach(function (w) {
          var appInfo = apps[w.app] || { label: w.app, letter: "?", color: "#525252" };
          var winState = windowVisualState(w, state);
          var node = document.createElement("div");
          node.className = "win win--" + winState;
          node.style.left = w.x + "%";
          node.style.top = w.y + "%";
          node.style.width = w.w + "%";
          node.style.height = w.h + "%";
          node.dataset.app = w.app;

          var titlebar = document.createElement("div");
          titlebar.className = "win-titlebar";
          titlebar.style.background = appInfo.color;
          titlebar.innerHTML =
            '<span class="win-icon" style="background:' + appInfo.color + '">' + appInfo.letter + '</span>' +
            '<span class="win-title">' + w.title + '</span>' +
            (state === "recorded" ? '<span class="win-stamp">已记录</span>' : '') +
            '<span class="win-controls">' +
              '<span class="win-ctrl win-ctrl-min" title="最小化"></span>' +
              '<span class="win-ctrl win-ctrl-max" title="最大化"></span>' +
              '<span class="win-ctrl win-ctrl-close" title="关闭"></span>' +
            '</span>';

          var body = document.createElement("div");
          body.className = "win-body";
          if (w.url) {
            body.innerHTML = '<span class="win-url">' + shortenUrl(w.url) + '</span>';
          } else {
            body.innerHTML = '<span class="win-placeholder-line"></span>' +
              '<span class="win-placeholder-line short"></span>';
          }

          node.appendChild(titlebar);
          node.appendChild(body);
          el.windowLayer.appendChild(node);
        });
      }
    }

    // 任务栏：Windows 风格（开始按钮 + 搜索 + 固定/运行应用 + 系统托盘）
    if (el.taskbar) {
      el.taskbar.innerHTML = "";

      // 开始按钮（Windows 田字格 logo）
      var start = document.createElement("span");
      start.className = "taskbar-start";
      start.title = "开始";
      start.innerHTML = '<span class="win-logo"><i></i><i></i><i></i><i></i></span>';
      el.taskbar.appendChild(start);

      // 搜索框
      var search = document.createElement("span");
      search.className = "taskbar-search";
      search.innerHTML = '<span class="search-glyph"></span><span class="search-text">搜索</span>';
      el.taskbar.appendChild(search);

      // 固定应用
      var shown = {};
      pinnedTaskbarApps.forEach(function (appKey) {
        var appInfo = apps[appKey] || { letter: "?", color: "#525252" };
        var icon = document.createElement("span");
        var extra = (appKey === "edge") ? " taskbar-icon--edge" : (appKey === "chrome") ? " taskbar-icon--chrome" : "";
        icon.className = "taskbar-icon pinned" + extra;
        if (appKey !== "edge" && appKey !== "chrome") {
          icon.style.background = appInfo.color;
        }
        icon.textContent = appInfo.letter;
        icon.title = appInfo.label || appKey;
        el.taskbar.appendChild(icon);
        shown[appKey] = true;
      });

      // 当前桌面的运行中应用
      if (state !== "closed") {
        var taskbarApps = uniqueAppsOnDesktop(d.id);
        taskbarApps.forEach(function (appKey) {
          if (shown[appKey]) return;
          var appInfo = apps[appKey] || { letter: "?", color: "#525252" };
          var icon = document.createElement("span");
          var extra = (appKey === "edge") ? " taskbar-icon--edge" : (appKey === "chrome") ? " taskbar-icon--chrome" : "";
          icon.className = "taskbar-icon running" + extra;
          if (appKey !== "edge" && appKey !== "chrome") {
            icon.style.background = appInfo.color;
          }
          icon.textContent = appInfo.letter;
          icon.title = appInfo.label || appKey;
          el.taskbar.appendChild(icon);
          shown[appKey] = true;
        });
      }

      // 系统托盘（右侧：Workspace Switcher 托盘图标 + 网络/音量/电池 + 时钟）
      var tray = document.createElement("span");
      tray.className = "taskbar-tray";
      var switcherActive = (phase === "preview" || phase === "clean") ? " tray-switcher--active" : "";
      tray.innerHTML =
        '<span class="tray-switcher' + switcherActive + '" id="tray-switcher" title="Workspace Switcher · 工作区管理">' +
          '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="2" y="3" width="7" height="5" rx="1"/>' +
            '<rect x="7" y="8" width="7" height="5" rx="1"/>' +
          '</svg>' +
        '</span>' +
        '<span class="tray-icon tray-wifi" title="网络">' +
          '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<path d="M2 6 Q8 1 14 6"/>' +
            '<path d="M4.5 8.5 Q8 5 11.5 8.5"/>' +
            '<circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none"/>' +
          '</svg>' +
        '</span>' +
        '<span class="tray-icon tray-vol" title="音量">' +
          '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 6 L3 10 L6 10 L9.5 12.5 L9.5 3.5 L6 6 Z"/>' +
            '<path d="M11.5 6 Q13 8 11.5 10" fill="none"/>' +
          '</svg>' +
        '</span>' +
        '<span class="tray-icon tray-bat" title="电池">' +
          '<svg viewBox="0 0 16 16" width="16" height="13" fill="none" stroke="currentColor" stroke-width="1.2">' +
            '<rect x="1.5" y="4.5" width="11" height="7" rx="1"/>' +
            '<rect x="13" y="6.5" width="1.5" height="3" rx="0.5" fill="currentColor" stroke="none"/>' +
            '<rect x="3" y="6" width="6" height="4" fill="currentColor" stroke="none"/>' +
          '</svg>' +
        '</span>' +
        '<span class="tray-clock">10:24</span>';
      el.taskbar.appendChild(tray);

      // 绑定托盘图标点击（preview 进入释放管理，clean 进入恢复管理）
      var switcherEl = document.getElementById("tray-switcher");
      if (switcherEl && (phase === "preview" || phase === "clean")) {
        switcherEl.addEventListener("click", onTrayClick);
      }
    }

    // 桌面指示点（可点击切换，点击后停止自动轮播）
    if (el.desktopIndicator) {
      el.desktopIndicator.innerHTML = "";
      var hint = document.createElement("span");
      hint.className = "indicator-hint";
      hint.textContent = "点击数字切换不同桌面";
      el.desktopIndicator.appendChild(hint);
      desktops.forEach(function (dd, i) {
        var dot = document.createElement("span");
        dot.className = "desktop-dot" + (i === activeDesktopIndex ? " active" : "");
        dot.textContent = String(i + 1);
        dot.title = dd.name + " · " + dd.role;
        if (phase === "preview") {
          dot.classList.add("clickable");
          (function (idx) {
            dot.addEventListener("click", function () {
              if (phase !== "preview") return;
              activeDesktopIndex = idx;
              stopCarousel();
              log("手动切换到 " + desktops[idx].name + " · 已停止自动轮播");
              renderMonitor();
            });
          })(i);
        }
        el.desktopIndicator.appendChild(dot);
      });
    }

    // 显示器覆盖层（已收起 / 干净 / 目标卡 + 恢复按钮）
    renderMonitorOverlay();
  }

  // ---- 渲染：桌面图标（Windows 风格，渲染在窗口下层）----
  function renderDesktopIcons() {
    if (!el.desktopIcons) return;
    var icons = [
      { label: "此电脑", cls: "desk-icon--pc" },
      { label: "回收站", cls: "desk-icon--bin" },
      { label: "Edge",   cls: "desk-icon--edge" },
      { label: "工作区", cls: "desk-icon--folder" }
    ];
    el.desktopIcons.innerHTML = "";
    icons.forEach(function (ic) {
      var node = document.createElement("div");
      node.className = "desk-icon";
      node.innerHTML =
        '<span class="desk-icon-img ' + ic.cls + '"></span>' +
        '<span class="desk-icon-label">' + ic.label + '</span>';
      el.desktopIcons.appendChild(node);
    });
  }

  // ---- 渲染：显示器覆盖层（仅承载一次性 flash 提示，不再常驻蒙版）----
  function renderMonitorOverlay() {
    if (!el.monitorOverlay) return;
    el.monitorOverlay.innerHTML = "";
    el.monitorOverlay.style.display = "none";
  }

  // 一次性 flash 提示（进入 clean 阶段弹出，1s 后淡出，不阻挡交互）
  function showFlash(title, sub) {
    if (!el.monitorOverlay) return;
    el.monitorOverlay.innerHTML = "";
    var toast = document.createElement("div");
    toast.className = "flash-toast";
    var target = getReleaseTarget();
    toast.innerHTML =
      '<div class="flash-icon">' + (target && target.id === "ai" ? "AI" : "游戏") + '</div>' +
      '<div class="flash-title">' + title + '</div>' +
      '<div class="flash-sub">' + sub + '</div>';
    el.monitorOverlay.appendChild(toast);
    el.monitorOverlay.style.display = "flex";
    schedule(function () {
      if (!el.monitorOverlay) return;
      el.monitorOverlay.style.display = "none";
      el.monitorOverlay.innerHTML = "";
    }, 1000);
  }

  // ---- 渲染：管理 flyout（从任务栏托盘弹出，显示器内；释放/恢复两种模式对称）----
  function renderFlyout() {
    if (!el.mgmtFlyout) return;
    if (phase !== "managing" && phase !== "restore-managing") {
      el.mgmtFlyout.style.display = "none";
      return;
    }
    el.mgmtFlyout.style.display = "";

    if (phase === "managing") {
      // 释放模式：列出 4 桌面 + 释放目标按钮
      var listHtml = desktops.map(function (d) {
        var count = windowsOnDesktop(d.id).length;
        return '<div class="flyout-desktop">' +
          '<span class="flyout-desktop-name">' + d.name + '</span>' +
          '<span class="flyout-desktop-role">' + d.role + '</span>' +
          '<span class="flyout-desktop-count">' + count + ' 窗口</span>' +
          '</div>';
      }).join("");

      var targetsHtml = releaseTargets.map(function (t) {
        return '<button class="btn btn-release flyout-target" data-target="' + t.id + '" type="button">' +
          '<span class="btn-title">' + t.label + '</span>' +
          '<span class="btn-sub">' + t.desc + '</span></button>';
      }).join("");

      el.mgmtFlyout.innerHTML =
        '<div class="flyout-head">' +
          '<span class="flyout-title">工作区管理</span>' +
          '<span class="flyout-close" id="flyout-close" title="关闭"></span>' +
        '</div>' +
        '<div class="flyout-desktops">' + listHtml + '</div>' +
        '<div class="flyout-section-label">选择释放目标</div>' +
        '<div class="flyout-targets">' + targetsHtml + '</div>';

      var closeBtn = document.getElementById("flyout-close");
      if (closeBtn) closeBtn.addEventListener("click", closeFlyout);
      var targetBtns = el.mgmtFlyout.querySelectorAll(".flyout-target");
      targetBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          onReleaseTargetChosen(btn.dataset.target);
        });
      });
    } else {
      // 恢复模式：列出已记录桌面 + 恢复按钮（与释放入口对称）
      var recordedHtml = desktops.map(function (d) {
        var count = windowsOnDesktop(d.id).length;
        return '<div class="flyout-desktop">' +
          '<span class="flyout-desktop-name">' + d.name + '</span>' +
          '<span class="flyout-desktop-role">已记录</span>' +
          '<span class="flyout-desktop-count">' + count + ' 窗口</span>' +
          '</div>';
      }).join("");

      el.mgmtFlyout.innerHTML =
        '<div class="flyout-head">' +
          '<span class="flyout-title">恢复工作区</span>' +
          '<span class="flyout-close" id="flyout-close" title="关闭"></span>' +
        '</div>' +
        '<div class="flyout-desktops">' + recordedHtml + '</div>' +
        '<div class="flyout-section-label">恢复操作</div>' +
        '<div class="flyout-targets">' +
          '<button class="btn btn-primary flyout-restore" id="flyout-restore" type="button">' +
            '<span class="btn-title">恢复全部工作区</span>' +
            '<span class="btn-sub">按记录位置原样恢复 · 浏览器 URL --new-window</span>' +
          '</button>' +
        '</div>';

      var closeBtn2 = document.getElementById("flyout-close");
      if (closeBtn2) closeBtn2.addEventListener("click", closeFlyout);
      var restoreBtn = document.getElementById("flyout-restore");
      if (restoreBtn) restoreBtn.addEventListener("click", startRestoring);
    }
  }

  function closeFlyout() {
    // 关闭 flyout → 回到来源阶段（preview 或 clean）
    if (phase === "managing") {
      phase = "preview";
      log("关闭工作区管理面板，返回预览");
      applyState();
      startCarousel();
    } else if (phase === "restore-managing") {
      phase = "clean";
      log("关闭恢复管理面板，返回干净桌面");
      applyState();
    }
  }

  // ---- 渲染：箭头提示（指向可点击元素）----
  function renderArrowHint() {
    if (!el.arrowHint) return;
    el.arrowHint.style.display = "none";
    el.arrowHint.className = "arrow-hint";

    if (phase === "preview") {
      // 指向托盘图标（右下角任务栏托盘区）
      el.arrowHint.style.display = "";
      el.arrowHint.classList.add("arrow-hint--tray");
      el.arrowHint.innerHTML =
        '<span class="arrow-hint-text">点击托盘图标打开管理</span>' +
        '<span class="arrow-hint-arrow"></span>';
    } else if (phase === "managing") {
      // 指向 flyout 内的释放目标按钮
      el.arrowHint.style.display = "";
      el.arrowHint.classList.add("arrow-hint--flyout");
      el.arrowHint.innerHTML =
        '<span class="arrow-hint-text">选择释放目标</span>' +
        '<span class="arrow-hint-arrow"></span>';
    } else if (phase === "clean") {
      // 指向托盘图标（与 preview 对称，恢复入口也是托盘）
      el.arrowHint.style.display = "";
      el.arrowHint.classList.add("arrow-hint--tray");
      el.arrowHint.innerHTML =
        '<span class="arrow-hint-text">点击托盘图标恢复工作区</span>' +
        '<span class="arrow-hint-arrow"></span>';
    } else if (phase === "restore-managing") {
      // 指向 flyout 内的恢复按钮
      el.arrowHint.style.display = "";
      el.arrowHint.classList.add("arrow-hint--flyout");
      el.arrowHint.innerHTML =
        '<span class="arrow-hint-text">点击恢复工作区</span>' +
        '<span class="arrow-hint-arrow"></span>';
    }
  }

  function uniqueAppsOnDesktop(dId) {
    var seen = {};
    var out = [];
    windowsOnDesktop(dId).forEach(function (w) {
      if (!seen[w.app]) { seen[w.app] = true; out.push(w.app); }
    });
    return out;
  }

  function shortenUrl(url) {
    return url.replace(/^https?:\/\//, "");
  }

  function desktopStateLabel(state) {
    return {
      active: "活动中",
      recorded: "已记录",
      closed: "已收起",
      restored: "已恢复"
    }[state] || "";
  }

  function windowVisualState(win, desktopState) {
    switch (desktopState) {
      case "active": return "visible";
      case "recorded": return "recorded";
      case "closed": return "closed";
      case "restored": return "restored";
      default: return "visible";
    }
  }

  function allDesktopsClosed() {
    return desktopStates.every(function (s) { return s === "closed"; });
  }

  function getReleaseTarget() {
    if (releaseTarget) {
      for (var i = 0; i < releaseTargets.length; i++) {
        if (releaseTargets[i].id === releaseTarget) return releaseTargets[i];
      }
    }
    return releaseTargets[0] || null;
  }

  // ---- 渲染：URL 恢复徽标（显示器右上角）----
  function renderUrlBadge() {
    if (!el.urlBadge) return;
    if (phase === "restoring" || phase === "done") {
      el.urlBadge.style.display = "";
      el.urlBadge.textContent = urlRestoredCount + "/8 URL · --new-window";
      el.urlBadge.className = "url-badge" + (urlRestoredCount >= 8 ? " url-badge--done" : "");
    } else {
      el.urlBadge.style.display = "none";
    }
  }

  // ---- 渲染：证据覆盖层（完成阶段，显示器内）----
  function renderEvidenceOverlay() {
    if (!el.evidenceOverlay) return;
    if (phase !== "done") {
      el.evidenceOverlay.style.display = "none";
      return;
    }
    el.evidenceOverlay.style.display = "";

    var stripHtml = evidenceStrip.map(function (e) {
      return '<div class="evidence-item">' +
        '<span class="evidence-label">' + e.label + '</span>' +
        '<span class="evidence-value">' + e.short + '</span></div>';
    }).join("");

    var fullHtml = "";
    if (fullEvidenceOpen) {
      var rows = [
        ["Desktops before", data.desktopsBefore],
        ["Screens", data.screens],
        ["Baseline visible windows", data.baselineVisibleWindows],
        ["Game mode exit code", data.gameModeExitCode],
        ["Desktops after game mode", data.desktopsAfterGameMode],
        ["Residual configured and managed close targets", data.residualCloseTargets],
        ["Minimized snapshot entries excluded", data.minimizedSnapshotEntriesExcluded],
        ["Restore exit code", data.restoreExitCode],
        ["Desktops after restore", data.desktopsAfterRestore],
        ["Browser args using --new-window", data.browserArgsNewWindow],
        ["PowerToys duplicate app entries", data.powerToysDuplicateAppEntries],
        ["Hard Failures", data.hardFailures]
      ];
      var metricsRows = rows.map(function (r) {
        return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="pass">PASS</td></tr>';
      }).join("");

      var debugCardsHtml = debugMissions.map(function (m) {
        return '<details class="debug-card">' +
          '<summary class="debug-card-title">' + m.title + '</summary>' +
          '<p><strong>问题：</strong>' + m.problem + '</p>' +
          '<p><strong>解决：</strong>' + m.fix + '</p>' +
          '<p class="metric-line"><strong>指标：</strong>' + m.metricLabel + ': ' +
          (data[m.metricKey] !== undefined ? data[m.metricKey] : "—") + '</p>' +
          '</details>';
      }).join("");

      fullHtml = '<div class="full-evidence-inner">' +
        (D.metricsSource ? '<p class="metrics-source">' + D.metricsSource + '</p>' : '') +
        '<table class="metrics-table"><thead><tr><th>指标</th><th>数值</th><th>结果</th></tr></thead><tbody>' + metricsRows + '</tbody></table>' +
        '<div class="debug-cards">' + debugCardsHtml + '</div>' +
        '</div>';
    }

    el.evidenceOverlay.innerHTML =
      '<div class="evidence-card">' +
        '<div class="evidence-card-head">' +
          '<span class="evidence-card-title">验证证据</span>' +
          '<span class="evidence-card-badge">8/8 URL · Hard Failures: None</span>' +
        '</div>' +
        '<div class="evidence-strip">' + stripHtml + '</div>' +
        '<button class="btn btn-ghost evidence-toggle" id="evidence-toggle" type="button">' +
          (fullEvidenceOpen ? '收起完整证据' : '查看完整证据') + '</button>' +
        fullHtml +
        '<button class="btn btn-primary evidence-restart" id="evidence-restart" type="button">重新演示</button>' +
      '</div>';

    // 绑定事件
    var toggle = document.getElementById("evidence-toggle");
    if (toggle) toggle.addEventListener("click", toggleFullEvidence);
    var restartBtn = document.getElementById("evidence-restart");
    if (restartBtn) restartBtn.addEventListener("click", restart);
  }

  function toggleFullEvidence() {
    fullEvidenceOpen = !fullEvidenceOpen;
    renderEvidenceOverlay();
  }

  // ---- 总渲染 ----
  function applyState() {
    renderPhaseToast();
    renderMonitor();
    renderFlyout();
    renderUrlBadge();
    renderArrowHint();
    renderEvidenceOverlay();
  }

  // ---- 轮播（preview 阶段）----
  function startCarousel() {
    stopCarousel();
    carouselTimer = setInterval(function () {
      activeDesktopIndex = (activeDesktopIndex + 1) % desktops.length;
      renderMonitor();
    }, 2600);
  }
  function stopCarousel() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
  }

  // ---- 托盘图标点击（preview 进入释放管理，clean 进入恢复管理）----
  function onTrayClick() {
    if (phase === "preview") {
      enterManaging();
    } else if (phase === "clean") {
      enterRestoreManaging();
    }
  }

  function enterRestoreManaging() {
    phase = "restore-managing";
    log("点击托盘图标，打开恢复管理 flyout");
    applyState();
  }

  // ---- 阶段推进 ----
  function enterManaging() {
    stopCarousel();
    phase = "managing";
    log("点击托盘图标，打开工作区管理 flyout");
    applyState();
    log("4 个工作区已列出，等待选择释放目标");
  }

  function onReleaseTargetChosen(targetId) {
    releaseTarget = targetId;
    var t = getReleaseTarget();
    log("选择释放目标：" + (t ? t.label : "重任务"));
    startReleasing();
  }

  function startReleasing() {
    phase = "releasing";
    log("开始释放资源：逐桌面记录并收起");
    applyState();

    var PER_DESKTOP = 1500;
    var RECORD_AFTER = 250;
    var CLOSE_AFTER = 800;
    var NEXT_AFTER = PER_DESKTOP;

    var t = 0;
    for (var i = 0; i < desktops.length; i++) {
      (function (idx) {
        schedule(function () {
          activeDesktopIndex = idx;
          renderMonitor();
          log("切到 " + desktops[idx].name + " · 记录快照");
        }, t);
        schedule(function () {
          desktopStates[idx] = "recorded";
          renderMonitor();
          log(desktops[idx].name + " 已记录（最小化窗口已排除）");
        }, t + RECORD_AFTER);
        schedule(function () {
          desktopStates[idx] = "closed";
          renderMonitor();
          log(desktops[idx].name + " 已收起");
        }, t + CLOSE_AFTER);
      })(i);
      t += NEXT_AFTER;
    }

    schedule(function () {
      activeDesktopIndex = 0;
      phase = "clean";
      log("所有工作区已收起，桌面干净，资源已释放");
      applyState();
      showFlash("重任务准备就绪", "资源已释放 · 工作区已记录 · 点击托盘恢复");
    }, t + 200);
  }

  function startRestoring() {
    phase = "restoring";
    urlRestoredCount = 0;
    log("开始恢复工作区：逐桌面按记录位置恢复");
    applyState();

    var PER_DESKTOP = 1200;
    var RESTORE_AFTER = 200;
    var t = 0;

    for (var i = 0; i < desktops.length; i++) {
      (function (idx) {
        schedule(function () {
          activeDesktopIndex = idx;
          renderMonitor();
          log("切到 " + desktops[idx].name + " · 恢复窗口");
        }, t);
        schedule(function () {
          desktopStates[idx] = "restored";
          renderMonitor();
          var dId = desktops[idx].id;
          var cnt = browserUrls.filter(function (u) {
            var win = windowMap[u.windowId];
            return win && win.desktopId === dId;
          }).length;
          urlRestoredCount = Math.min(8, urlRestoredCount + cnt);
          renderUrlBadge();
          log(desktops[idx].name + " 已恢复 · 浏览器 URL " + urlRestoredCount + "/8");
        }, t + RESTORE_AFTER);
      })(i);
      t += PER_DESKTOP;
    }

    schedule(function () {
      phase = "done";
      activeDesktopIndex = 0;
      urlRestoredCount = 8;
      log("工作区全部恢复 · 浏览器 URL 8/8 · --new-window");
      applyState();
    }, t + 200);
  }

  function restart() {
    clearPlayback();
    stopCarousel();
    phase = "preview";
    activeDesktopIndex = 0;
    desktopStates = desktops.map(function () { return "active"; });
    releaseTarget = null;
    urlRestoredCount = 0;
    fullEvidenceOpen = false;
    log("重新演示，状态已重置");
    applyState();
    startCarousel();
    log("Demo 已就绪");
  }

  // ---- 启动 ----
  function init() {
    cacheDom();
    if (el.safety) el.safety.textContent = safetyStatement;
    if (el.simNote) el.simNote.textContent = simNote;
    applyState();
    startCarousel();
    log("Demo 已加载（显示器内交互模式）");
    log(safetyStatement);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
