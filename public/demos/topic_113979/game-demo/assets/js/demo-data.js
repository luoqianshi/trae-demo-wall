// Workspace Switcher 游戏化交互 Demo —— 演示数据（S3 软桌面模拟重构）
//
// 数据分两类：
// 1. metrics         实验指标，来自真实实验报告 experiments/20260620-124805/report.md
//                    这些不是网页实时检测的结果，而是已提供实验报告的关键指标。
//                    仅在最终证据层展示，不驱动主流程。
// 2. desktops/representativeWindows/browserUrls/apps/releaseTargets
//                    软桌面模拟对象，纯前端虚构。
//                    主显示器只展示每个桌面的 3-5 个代表窗口（共 17 个），
//                    不复刻历史实验的全部 28 个窗口。所有 URL 使用 example.local。
//
// 安全边界：本文件不调用任何真实系统 API。所有桌面/窗口/URL 均为模拟对象。

window.DEMO_DATA = (function () {
  "use strict";

  // ---- 关键实验指标（来自实验报告，非网页实时检测；仅用于最终证据层）----
  var metrics = {
    desktopsBefore: 4,
    screens: 2,
    baselineVisibleWindows: 28,
    gameModeExitCode: 0,
    desktopsAfterGameMode: 1,
    residualCloseTargets: 0,
    minimizedSnapshotEntriesExcluded: 2,
    restoreExitCode: 0,
    desktopsAfterRestore: 4,
    browserArgsNewWindow: "8/8",
    powerToysDuplicateAppEntries: 0,
    hardFailures: "None"
  };

  var metricsSource =
    "已提供实验报告关键指标 (experiments/20260620-124805/report.md)，不是当前网页实时检测。";

  var safetyStatement =
    "本页面是安全的前端模拟，不会操作真实窗口、虚拟桌面、PowerToys 或 PowerShell。";

  var simulationNote =
    "以下显示器、桌面、窗口、URL 均为模拟对象，仅用于演示工作区释放与恢复流程，不代表评委机器的真实状态。";

  // ---- 应用注册表（窗口图标 + 颜色 + 字母）----
  var apps = {
    trae:       { label: "TRAE/Editor",     letter: "T", color: "#0f62fe" },
    edge:       { label: "Edge",            letter: "E", color: "#0078d4" },
    chrome:     { label: "Chrome",          letter: "C", color: "#5a6268" },
    onenote:    { label: "OneNote",         letter: "N", color: "#7743a8" },
    explorer:   { label: "File Explorer",   letter: "F", color: "#d9a412" },
    terminal:   { label: "Terminal",        letter: ">", color: "#24a148" },
    powertoys:  { label: "PowerToys",       letter: "P", color: "#3d3d3d" },
    docs:       { label: "Docs",            letter: "D", color: "#525252" },
    chat:       { label: "Chat",            letter: "M", color: "#a91d8a" }
  };

  // ---- 4 个虚拟桌面 ----
  var desktops = [
    { id: "d1", name: "桌面 1", role: "开发主线",   roleEn: "Dev main",   tint: "#eaf3ff" },
    { id: "d2", name: "桌面 2", role: "资料检索",   roleEn: "Research",   tint: "#fff5e6" },
    { id: "d3", name: "桌面 3", role: "文档记录",   roleEn: "Docs",       tint: "#eef9f0" },
    { id: "d4", name: "桌面 4", role: "沟通协作",   roleEn: "Comms",      tint: "#fdeef7" }
  ];

  // ---- 代表性窗口（3-5 个/桌面，共 17 个；不复刻全部 28 个历史窗口）----
  // 字段：id / app / title / desktopId / status / url(可选) / x,y,w,h(显示器内百分比定位)
  // status: "visible"（可见）| "minimized"（最小化，记录时排除）
  // 坐标系：x/y 为左上角百分比，w/h 为宽高百分比（相对显示器桌面区域）
  var representativeWindows = [
    // 桌面 1 · 开发主线（4 个代表窗口）
    { id: "w1", app: "trae",     title: "Trae IDE — main.ts",            desktopId: "d1", status: "visible",   x: 5,  y: 8,  w: 44, h: 46 },
    { id: "w2", app: "terminal", title: "PowerShell — workspace-control",desktopId: "d1", status: "visible",   x: 5,  y: 58, w: 44, h: 34 },
    { id: "w3", app: "edge",     title: "TRAE Docs — Editor",            desktopId: "d1", status: "visible",   x: 52, y: 8,  w: 43, h: 38, url: "https://docs.trae.example.local/editor" },
    { id: "w4", app: "chrome",   title: "GitHub — workspace-switcher",   desktopId: "d1", status: "visible",   x: 52, y: 50, w: 43, h: 42, url: "https://github.example.local/workspace-switcher" },

    // 桌面 2 · 资料检索（4 个代表窗口）
    { id: "w5", app: "edge",     title: "Stack Overflow — VirtualDesktop",desktopId: "d2", status: "visible",  x: 5,  y: 8,  w: 43, h: 40, url: "https://so.example.local/questions/virtualdesktop" },
    { id: "w6", app: "edge",     title: "MDN — Web APIs",                desktopId: "d2", status: "visible",   x: 52, y: 8,  w: 43, h: 40, url: "https://mdn.example.local/web-api" },
    { id: "w7", app: "chrome",   title: "Azure Portal — workspace",      desktopId: "d2", status: "visible",   x: 5,  y: 54, w: 43, h: 38, url: "https://portal.azure.example.local/workspace" },
    { id: "w8", app: "onenote",  title: "资料检索笔记",                   desktopId: "d2", status: "visible",   x: 52, y: 54, w: 43, h: 38 },

    // 桌面 3 · 文档记录（4 个代表窗口）
    { id: "w9",  app: "onenote",  title: "项目文档 — 工作区救援",         desktopId: "d3", status: "visible",   x: 5,  y: 8,  w: 44, h: 44 },
    { id: "w10", app: "docs",     title: "report-draft.md",              desktopId: "d3", status: "visible",   x: 52, y: 8,  w: 43, h: 44 },
    { id: "w11", app: "edge",     title: "Internal Wiki — 自动化",        desktopId: "d3", status: "visible",   x: 5,  y: 56, w: 44, h: 36, url: "https://wiki.example.local/automation" },
    { id: "w12", app: "explorer", title: "E:\\learning\\Trae比赛",       desktopId: "d3", status: "visible",   x: 52, y: 56, w: 43, h: 36 },

    // 桌面 4 · 沟通协作（5 个代表窗口）
    { id: "w13", app: "chat",      title: "Teams — 团队频道",            desktopId: "d4", status: "visible",   x: 5,  y: 8,  w: 43, h: 36 },
    { id: "w14", app: "chat",      title: "Slack — #workspace-switcher", desktopId: "d4", status: "visible",   x: 52, y: 8,  w: 43, h: 36 },
    { id: "w15", app: "edge",      title: "Jira — WS Switcher Board",    desktopId: "d4", status: "visible",   x: 5,  y: 48, w: 43, h: 22, url: "https://jira.example.local/board/ws-switcher" },
    { id: "w16", app: "chrome",    title: "Figma — 工作区设计稿",         desktopId: "d4", status: "visible",   x: 52, y: 48, w: 43, h: 22, url: "https://figma.example.local/file/workspace" },
    { id: "w17", app: "powertoys", title: "PowerToys — FancyZones",      desktopId: "d4", status: "visible",   x: 5,  y: 74, w: 90, h: 18 }
  ];

  // ---- 8 条模拟浏览器 URL 条目（恢复时 8/8 使用 --new-window）----
  // 不使用真实外部链接，统一用 example.local。
  var browserUrls = [
    { id: "u1", windowId: "w3",  app: "edge",   label: "TRAE Docs — Editor",            url: "https://docs.trae.example.local/editor" },
    { id: "u2", windowId: "w4",  app: "chrome", label: "GitHub — workspace-switcher",   url: "https://github.example.local/workspace-switcher" },
    { id: "u3", windowId: "w5",  app: "edge",   label: "Stack Overflow — VirtualDesktop",url: "https://so.example.local/questions/virtualdesktop" },
    { id: "u4", windowId: "w6",  app: "edge",   label: "MDN — Web APIs",                url: "https://mdn.example.local/web-api" },
    { id: "u5", windowId: "w7",  app: "chrome", label: "Azure Portal — workspace",      url: "https://portal.azure.example.local/workspace" },
    { id: "u6", windowId: "w11", app: "edge",   label: "Internal Wiki — 自动化",         url: "https://wiki.example.local/automation" },
    { id: "u7", windowId: "w15", app: "edge",   label: "Jira — WS Switcher Board",      url: "https://jira.example.local/board/ws-switcher" },
    { id: "u8", windowId: "w16", app: "chrome", label: "Figma — 工作区设计稿",           url: "https://figma.example.local/file/workspace" }
  ];

  // ---- 释放目标（两种选择，流程相同，仅目标卡文案不同）----
  var releaseTargets = [
    { id: "ai",    label: "AI 重任务模式",   en: "AI heavy task",   card: "AI 重任务准备就绪",   desc: "释放 CPU / 内存 / 显存给本地模型推理或训练。" },
    { id: "game",  label: "游戏会话模式",    en: "Game session",    card: "游戏会话准备就绪",    desc: "释放 CPU / GPU / 注意力给一局沉浸式游戏。" }
  ];

  // ---- 5 个 Debug Mission 卡片（仅最终证据层，默认折叠）----
  var debugMissions = [
    {
      id: "minimized-pollution",
      title: "最小化窗口污染",
      problem: "最小化窗口进入快照会污染恢复结果。",
      fix: "排除最小化快照条目。",
      metricKey: "minimizedSnapshotEntriesExcluded",
      metricLabel: "Minimized snapshot entries excluded"
    },
    {
      id: "url-mismatch",
      title: "Edge/Chrome URL 错位",
      problem: "浏览器 URL 恢复时容易落到错误窗口。",
      fix: "使用 --new-window 隔离恢复入口。",
      metricKey: "browserArgsNewWindow",
      metricLabel: "Browser args using --new-window"
    },
    {
      id: "residual-close",
      title: "OneNote/Edge 残留关闭",
      problem: "受管关闭目标可能残留。",
      fix: "关闭配置目标和工作区托管目标，并检查残留。",
      metricKey: "residualCloseTargets",
      metricLabel: "Residual configured and managed close targets"
    },
    {
      id: "dual-screen-drift",
      title: "双屏坐标偏差",
      problem: "双屏布局下窗口位置容易偏移。",
      fix: "恢复时纳入屏幕和布局校验。",
      metricKey: "screens",
      metricLabel: "Screens / Restore exit code"
    },
    {
      id: "edge-delayed-restore",
      title: "Edge 延迟恢复旧标签",
      problem: "Edge 可能延迟恢复旧标签，干扰恢复窗口。",
      fix: "使用新窗口参数并做浏览器恢复校验。",
      metricKey: "browserArgsNewWindow",
      metricLabel: "Browser args using --new-window"
    }
  ];

  // ---- 证据条（恢复完成后显示的 4 项关键指标）----
  var evidenceStrip = [
    { key: "desktopsAfterRestore",      label: "恢复后桌面数",       short: "4" },
    { key: "browserArgsNewWindow",      label: "浏览器 --new-window", short: "8/8" },
    { key: "residualCloseTargets",      label: "残留关闭目标",       short: "0" },
    { key: "hardFailures",              label: "Hard Failures",      short: "None" }
  ];

  return {
    metrics: metrics,
    metricsSource: metricsSource,
    safetyStatement: safetyStatement,
    simulationNote: simulationNote,
    apps: apps,
    desktops: desktops,
    representativeWindows: representativeWindows,
    browserUrls: browserUrls,
    releaseTargets: releaseTargets,
    debugMissions: debugMissions,
    evidenceStrip: evidenceStrip
  };
})();
