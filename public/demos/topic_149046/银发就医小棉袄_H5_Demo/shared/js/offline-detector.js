<!-- @trae-gen Offline-Detector V1.0 -->
<!-- @trae-review-status: reviewed -->
/**
 * 银发就医小棉袄 - 离线演示模式检测器 (D9 里程碑核心交付物)
 * data-trae-gen="true"
 *
 * 职责：
 *   1. 自动检测网络状态（navigator.onLine + online/offline 事件）
 *   2. file:// 协议下默认视为离线（navigator.onLine 不可靠，且 ASR 引擎
 *      通常因 CORS 不可达，等价于"演示机断网"场景）
 *   3. 断网自动切换到离线模式（调用 setDemoMode('offline')），恢复网络
 *      自动切回在线模式
 *   4. 顶部 push-down 横幅提示（非 overlay，不遮挡内容），适老化样式
 *   5. 提供 shouldCheckASR() 供 asr-bridge.js 在离线态跳过健康检查
 *   6. body 同步 offline-mode / online-mode 类，并通过 onChange 通知其他模块
 *
 * 设计原则：
 *   - 不破坏现有 getDemoMode()/setDemoMode() 逻辑，仅在其基础上增强
 *   - 纯 HTML5 + JS，零依赖，IIFE 挂载到 window.SilverOffline
 *   - 所有 DOM / BOM 访问均做存在性判断，确保在 Node.js 测试 shim 下不抛错
 *
 * 用法：
 *   SilverOffline.init();                  // 页面加载时调用一次
 *   SilverOffline.isOffline();             // 当前是否离线
 *   SilverOffline.getMode();               // 'online' | 'offline'
 *   SilverOffline.setMode('offline');      // 手动切换（测试 / 演示）
 *   SilverOffline.onChange(function(m){}); // 注册模式变化回调
 *   SilverOffline.shouldCheckASR();        // 离线态返回 false，跳过 ASR 健康检查
 */
/* @trae-review-status: reviewed */
(function() {
  'use strict';

  var MODE_ONLINE = 'online';
  var MODE_OFFLINE = 'offline';

  // ----- 内部状态 -----
  var state = {
    mode: MODE_ONLINE,         // 当前模式 'online' | 'offline'
    initialized: false,        // init() 是否已执行
    navigatorOnline: true      // navigator.onLine 最近一次快照
  };

  var listeners = [];          // onChange 注册的回调列表
  var bannerEl = null;         // 横幅 DOM 节点（惰性创建）
  var bannerHideTimer = null;  // 横幅自动隐藏定时器（恢复态用）

  // ==========================================================================
  // 内部辅助：storage 同步（复用现有 setDemoMode，不破坏其逻辑）
  // ==========================================================================
  function persistMode(mode) {
    try {
      if (typeof window !== 'undefined' && typeof window.setDemoMode === 'function') {
        window.setDemoMode(mode);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('demo_current_mode', mode);
      }
    } catch (e) {
      // localStorage 不可用（隐私模式等），静默降级
    }
  }

  // 同步 body class: offline-mode / online-mode（保留原有其它 class）
  function updateBodyClass(mode) {
    if (typeof document === 'undefined' || !document.body) return;
    var cls = (document.body.className || '')
      .replace(/\b(?:offline-mode|online-mode)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    cls += (cls ? ' ' : '') + (mode === MODE_OFFLINE ? 'offline-mode' : 'online-mode');
    document.body.className = cls;
  }

  // 触发所有 onChange 回调
  function notifyListeners(mode) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](mode);
      } catch (e) {
        // 单个监听器异常不影响其他监听器
        if (typeof console !== 'undefined' && console.error) {
          console.error('[SilverOffline] onChange listener error:', e);
        }
      }
    }
  }

  // ==========================================================================
  // 离线提示横幅（push-down，非 overlay）
  // ==========================================================================
  function ensureBanner() {
    if (bannerEl) return bannerEl;
    if (typeof document === 'undefined' || !document.body) return null;
    if (typeof document.createElement !== 'function') return null;
    bannerEl = document.createElement('div');
    bannerEl.className = 'offline-banner';
    bannerEl.setAttribute('role', 'status');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.style.display = 'none';
    // 插入到 body 第一个子节点前，实现 push-down（占据文档流顶部，不遮挡内容）
    // try/catch：横幅为非关键功能，DOM 方法缺失（极简 shim）不应阻断模式切换流程
    try {
      if (typeof document.body.insertBefore === 'function') {
        document.body.insertBefore(bannerEl, document.body.firstChild);
      } else if (typeof document.body.appendChild === 'function') {
        document.body.appendChild(bannerEl);
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
    return bannerEl;
  }

  function showBanner(mode) {
    var el = ensureBanner();
    if (!el) return;
    if (bannerHideTimer) {
      clearTimeout(bannerHideTimer);
      bannerHideTimer = null;
    }
    if (mode === MODE_OFFLINE) {
      // 离线态：橙色横幅，持续显示直到网络恢复
      el.className = 'offline-banner offline';
      el.textContent = '📡 当前为离线模式，使用预置数据演示';
      el.style.display = 'block';
    } else {
      // 恢复态：绿色横幅，3 秒后自动消失
      el.className = 'offline-banner online';
      el.textContent = '🌐 网络已恢复';
      el.style.display = 'block';
      bannerHideTimer = setTimeout(function() {
        if (bannerEl) bannerEl.style.display = 'none';
        bannerHideTimer = null;
      }, 3000);
    }
  }

  // ==========================================================================
  // 网络状态检测
  // ==========================================================================

  // 初始模式判定：
  //   - file:// 协议：navigator.onLine 在本地文件下通常返回 true，但后端
  //     和 ASR 引擎不可达（CORS 限制），等价于断网 → 离线
  //   - http(s)://：依赖 navigator.onLine
  function detectInitialMode() {
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      return MODE_OFFLINE;
    }
    var online = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean')
      ? navigator.onLine : true;
    return online ? MODE_ONLINE : MODE_OFFLINE;
  }

  // online/offline 事件回调
  function handleOnlineEvent() {
    applyMode(MODE_ONLINE, true);
  }
  function handleOfflineEvent() {
    applyMode(MODE_OFFLINE, true);
  }

  // 应用模式变更（去重 + 同步 storage + body class + 横幅 + 回调）
  function applyMode(mode, showHint) {
    var prev = state.mode;
    if (prev === mode) {
      // 模式未变，仅确保 body class 同步（防止外部覆盖）
      updateBodyClass(mode);
      return;
    }
    state.mode = mode;
    state.navigatorOnline = (mode === MODE_ONLINE);
    persistMode(mode);
    updateBodyClass(mode);
    if (showHint) showBanner(mode);
    notifyListeners(mode);
  }

  // ==========================================================================
  // 对外 API
  // ==========================================================================

  // 初始化：页面加载时调用一次
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    var initial = detectInitialMode();
    state.mode = initial;
    state.navigatorOnline = (initial === MODE_ONLINE);

    // 同步到 storage 与 body class（不破坏既有 getDemoMode/setDemoMode）
    persistMode(initial);
    updateBodyClass(initial);

    // 监听浏览器 online/offline 事件
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', handleOnlineEvent);
      window.addEventListener('offline', handleOfflineEvent);
    }

    // 初始即为离线 → 等待 DOM 就绪后显示横幅
    if (initial === MODE_OFFLINE && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { showBanner(MODE_OFFLINE); });
      } else {
        showBanner(MODE_OFFLINE);
      }
    }
  }

  // 当前是否离线
  function isOffline() {
    return state.mode === MODE_OFFLINE;
  }

  // 获取当前模式: 'online' | 'offline'
  function getMode() {
    return state.mode;
  }

  // 手动切换模式（测试 / 演示用）
  function setMode(mode) {
    if (mode !== MODE_ONLINE && mode !== MODE_OFFLINE) return;
    applyMode(mode, true);
  }

  // 注册模式变化回调 (callback 接收 mode 参数)
  function onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  // 供 asr-bridge.js 调用：是否需要执行 ASR 健康检查
  //   - 离线模式：跳过检查，直接返回 false（ASR 不可用）
  //   - 在线模式：正常执行检查
  function shouldCheckASR() {
    return state.mode !== MODE_OFFLINE;
  }

  // ==========================================================================
  // 挂载到 window
  // ==========================================================================
  if (typeof window !== 'undefined') {
    window.SilverOffline = {
      init: init,
      isOffline: isOffline,
      getMode: getMode,
      setMode: setMode,
      onChange: onChange,
      shouldCheckASR: shouldCheckASR
    };
  }
})();
