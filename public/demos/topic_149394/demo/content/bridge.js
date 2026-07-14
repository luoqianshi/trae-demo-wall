/**
 * VidBuddy Bridge 核心模块
 * 负责视频元素追踪、UI面板管理、全局配置管理、事件监听等核心功能
 * 是插件与网页之间的桥梁层，实现跨域、跨框架的视频增强能力
 */
(function () {
  const currentHost = location.hostname;

  /**
   * 获取当前全屏元素
   * @returns {HTMLElement|null} 全屏元素或null
   */
  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // 优先加载黑名单过滤策略，匹配域名则静默退出
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ prefBlacklist: "" }, (res) => {
      const blacklistStr = res.prefBlacklist || "";
      const blacklist = blacklistStr
        .split("\n")
        .map((d) => d.trim())
        .filter((d) => !!d);
      const isBlacklisted = blacklist.some((domain) =>
        currentHost.includes(domain),
      );
      if (isBlacklisted) {
        console.log(
          `VidBuddy Bridge: 当前域名 ${currentHost} 处于禁用黑名单中，插件已静默退隐。`,
        );
        return;
      }
      initBridge();
    });
  } else {
    initBridge();
  }

  /**
   * 显示提示消息
   * @param {string} msg - 提示内容
   * @param {string} [type="info"] - 提示类型
   */
  function showToast(msg, type = "info") {
    if (window.VT_MODAL && typeof window.VT_MODAL.showToast === "function") {
      window.VT_MODAL.showToast(msg, type);
      return;
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(30, 30, 30, 0.95);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(120%);
      transition: transform 0.3s ease;
      max-width: 300px;
      word-break: break-word;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
    });

    setTimeout(() => {
      toast.style.transform = "translateX(120%)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  /**
   * 初始化 Bridge 核心模块
   */
  function initBridge() {
    if (window.__video_tools_bridge_injected__) return;
    window.__video_tools_bridge_injected__ = true;

    /** 视频元素映射表，存储所有已追踪的视频及其相关资源 */
    const videoMap = new Map();
    /** 最后活跃的视频ID */
    let lastActiveVideoId = null;
    /** 鼠标移动对应的活跃视频 */
    let activeVideoForMouseMove = null;
    /** 精准定位定时器标识 */
    let adjustRafId = null;

    /** 全网跨网页面板偏好坐标百分比记忆变量 */
    let globalOffsetNormalAction = null;
    let globalOffsetFullscreenAction = null;
    let globalOffsetNormalSnap = null;
    let globalOffsetFullscreenSnap = null;
    let globalOffsetNormalSpeed = null;
    let globalOffsetFullscreenSpeed = null;

    /** 插件自定义配置全局缓存变量（管理中心控制） */
    let globalAutoHideDelay = 3000;
    let globalHoverFocus = true;
    let globalHoverVideoExpand = true;
    let globalDanmakuSpeed = 7.5;
    let globalEnableShortcuts = true;
    let globalSpeedShortcut = true;
    let globalShowDanmakuOnJump = true;
    let globalTimeDisplayType = "positive";
    let globalSpeedDecreaseKey = "KeyA";
    let globalSpeedIncreaseKey = "KeyD";
    let globalSpeedResetKey = "KeyS";
    let globalScreenshotQuality = 0.9;
    let globalAutoScreenshot = true;
    let globalMaxScreenshots = 500;
    let globalPanelOpacity = 85;
    let globalDanmakuColor = "white";
    let globalDanmakuCustomColor = "#f472b6";
    let globalDanmakuSize = 14;
    let globalMarkerColor = "#6366f1";
    let globalMarkerCustomColor = "#6366f1";
    let globalMarkerSize = 8;
    let globalMinSpeed = 0.5;
    let globalMaxSpeed = 2.0;
    let globalSpeedStep = 0.1;
    let globalAutoSaveInterval = 5000;
    let globalAutoCleanDays = 0;
    let globalTheme = "dark";
    let globalPanelRadius = 21;

    /** 快捷键配置 */
    let globalDanmakuFocusKey = "KeyM";
    let globalDanmakuFocusModifiers = ["alt"];
    let globalQuickScreenshotKey = "KeyS";
    let globalQuickScreenshotModifiers = ["alt"];
    let globalKeyboardSpeedDecreaseKey = "BracketLeft";
    let globalKeyboardSpeedIncreaseKey = "BracketRight";
    let globalKeyboardSpeedResetKey = "Backslash";

    // 暴露全局变量供其他模块使用
    window.videoMap = videoMap;
    window.lastActiveVideoId = lastActiveVideoId;
    window.globalDanmakuSpeed = globalDanmakuSpeed;
    window.globalEnableShortcuts = globalEnableShortcuts;
    window.globalSpeedShortcut = globalSpeedShortcut;
    window.globalSpeedStep = globalSpeedStep;
    window.globalMinSpeed = globalMinSpeed;
    window.globalMaxSpeed = globalMaxSpeed;
    window.globalPanelRadius = globalPanelRadius;
    window.globalDanmakuFocusKey = globalDanmakuFocusKey;
    window.globalDanmakuFocusModifiers = globalDanmakuFocusModifiers;
    window.globalQuickScreenshotKey = globalQuickScreenshotKey;
    window.globalQuickScreenshotModifiers = globalQuickScreenshotModifiers;
    window.globalSpeedDecreaseKey = globalSpeedDecreaseKey;
    window.globalSpeedIncreaseKey = globalSpeedIncreaseKey;
    window.globalSpeedResetKey = globalSpeedResetKey;
    window.globalKeyboardSpeedDecreaseKey = globalKeyboardSpeedDecreaseKey;
    window.globalKeyboardSpeedIncreaseKey = globalKeyboardSpeedIncreaseKey;
    window.globalKeyboardSpeedResetKey = globalKeyboardSpeedResetKey;

    // 挂载全局全屏状态检测函数
    window.isFullscreen = isFullscreen;

    /**
     * 时间格式化函数
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
    const formatTime =
      window.VT_UTILS?.formatTime ||
      ((seconds) => {
        if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const parts = [
          m.toString().padStart(2, "0"),
          s.toString().padStart(2, "0"),
        ];
        if (h > 0) parts.unshift(h.toString());
        return parts.join(":");
      });

    /**
     * 获取显示时间（支持倒计时模式）
     * @param {number} time - 当前时间
     * @param {HTMLVideoElement} video - 视频元素
     * @returns {string} 显示时间字符串
     */
    const getDisplayTime = (time, video) => {
      if (globalTimeDisplayType === "countdown") {
        const duration = video.duration || 0;
        const rate = video.playbackRate > 0 ? video.playbackRate : 1.0;
        const remainingRealTime = Math.max(0, duration - time) / rate;
        return "-" + formatTime(remainingRealTime);
      }
      return formatTime(time);
    };

    /**
     * 安全检测是否处于全屏或网页全屏状态
     * @returns {boolean} 是否处于全屏状态
     */
    function isFullscreen() {
      // 1. 系统全屏检测
      const sysFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (sysFull) return true;

      // 2. 网页全屏 (Web Fullscreen) 检测
      const activeVideo = getActiveVideo();
      if (activeVideo && activeVideo.video) {
        const container = getMountContainer(activeVideo.video);
        if (container) {
          // B站网页全屏类名包含 'bpx-state-web-fullscreen' 或 'player-fullscreen'
          if (
            container.classList.contains("bpx-state-web-fullscreen") ||
            container.classList.contains("webfullscreen") ||
            container.classList.contains("player-fullscreen") ||
            container.classList.contains("fullscreen")
          ) {
            return true;
          }
          // 兜底：如果容器的高宽几乎等于视口高宽，且处于 fixed/absolute 定位，也认定为网页全屏
          const rect = container.getBoundingClientRect();
          const isNearlyViewport =
            Math.abs(rect.width - window.innerWidth) < 10 &&
            Math.abs(rect.height - window.innerHeight) < 10;
          if (isNearlyViewport) {
            const style = window.getComputedStyle(container);
            if (style.position === "fixed" || style.position === "absolute") {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     * 统一获取或生成 DOM 唯一标识符，解决 videoMap 的双重键注册冲突
     * @param {HTMLVideoElement} video - 视频元素
     * @returns {string|null} DOM唯一标识符
     */
    function getOrGenerateDomId(video) {
      if (!video) return null;
      let domId =
        video.getAttribute("data-vt-key") ||
        video.getAttribute("data-vt-dom-id");
      if (!domId) {
        domId =
          window.VT_UTILS?.generateId("vdom-") ||
          "vdom-" + Math.random().toString(36).substr(2, 9);
        video.setAttribute("data-vt-dom-id", domId);
      }
      return domId;
    }

    /**
     * 安全检查扩展上下文是否有效
     * @returns {boolean} 上下文是否有效
     */
    function isContextValid() {
      return !!(chrome.runtime && chrome.runtime.id);
    }

    /**
     * 包装 Storage API 防止 Context Invalidated 崩溃
     * @param {Object|string} keys - 要获取的键
     * @param {Function} callback - 回调函数
     */
    function safeStorageGet(keys, callback) {
      if (!isContextValid()) return;
      chrome.storage.local.get(keys, callback);
    }

    /**
     * 包装 Storage API 防止 Context Invalidated 崩溃
     * @param {Object} data - 要存储的数据
     * @param {Function} [callback] - 回调函数
     */
    function safeStorageSet(data, callback) {
      if (!isContextValid()) return;
      chrome.storage.local.set(data, callback);
    }

    /**
     * 开局拉取用户面板位置记忆及自定义设置偏好
     */
    safeStorageGet(
      {
        prefOffsetNormalAction: null,
        prefOffsetFullscreenAction: null,
        prefOffsetNormalSnap: null,
        prefOffsetFullscreenSnap: null,
        prefOffsetNormalSpeed: null,
        prefOffsetFullscreenSpeed: null,
        prefOffsetNormal: null, // fallback
        prefOffsetFullscreen: null, // fallback
        prefAutoHideDelay: 3000,
        prefHoverFocus: true,
        prefHoverVideoExpand: true,
        prefDanmakuSpeed: 7.5,
        prefEnableShortcuts: true,
        prefShowDanmakuOnJump: true,
        prefTimeDisplayType: "positive",
        prefScreenshotQuality: 0.9,
        prefAutoScreenshot: true,
        prefMaxScreenshots: 500,
        prefPanelOpacity: 85,
        prefDanmakuColor: "white",
        prefDanmakuCustomColor: "#f472b6",
        prefDanmakuSize: 14,
        prefMarkerColor: "#6366f1",
        prefMarkerCustomColor: "#6366f1",
        prefMarkerSize: 8,
        prefMinSpeed: 0.5,
        prefMaxSpeed: 2.0,
        prefSpeedStep: 0.1,
        prefAutoSaveInterval: 5000,
        prefShowStats: true,
        prefAutoCleanDays: 0,
        prefTheme: "dark",
        prefPanelRadius: 21,
        prefDanmakuFocusKey: "KeyM",
        prefDanmakuFocusModifiers: ["alt"],
        prefQuickScreenshotKey: "KeyS",
        prefQuickScreenshotModifiers: ["alt"],
        prefKeyboardSpeedDecreaseKey: "BracketLeft",
        prefKeyboardSpeedIncreaseKey: "BracketRight",
        prefKeyboardSpeedResetKey: "Backslash",
      },
      (res) => {
        if (res) {
          globalOffsetNormalAction =
            res.prefOffsetNormalAction || res.prefOffsetNormal;
          globalOffsetFullscreenAction =
            res.prefOffsetFullscreenAction || res.prefOffsetFullscreen;
          globalOffsetNormalSnap = res.prefOffsetNormalSnap;
          globalOffsetFullscreenSnap = res.prefOffsetFullscreenSnap;
          globalOffsetNormalSpeed = res.prefOffsetNormalSpeed;
          globalOffsetFullscreenSpeed = res.prefOffsetFullscreenSpeed;

          globalAutoHideDelay =
            res.prefAutoHideDelay !== undefined
              ? Number(res.prefAutoHideDelay)
              : 3000;
          globalHoverFocus =
            res.prefHoverFocus !== undefined ? res.prefHoverFocus : true;
          globalHoverVideoExpand =
            res.prefHoverVideoExpand !== undefined
              ? res.prefHoverVideoExpand
              : true;
          globalDanmakuSpeed =
            res.prefDanmakuSpeed !== undefined
              ? Number(res.prefDanmakuSpeed)
              : 7.5;
          globalEnableShortcuts =
            res.prefEnableShortcuts !== undefined
              ? res.prefEnableShortcuts
              : true;
          globalSpeedShortcut =
            res.prefSpeedShortcut !== undefined
              ? res.prefSpeedShortcut
              : true;
          globalShowDanmakuOnJump =
            res.prefShowDanmakuOnJump !== undefined
              ? res.prefShowDanmakuOnJump
              : true;
          globalTimeDisplayType = res.prefTimeDisplayType || "positive";
          globalSpeedDecreaseKey =
            res.prefSpeedDecreaseKey !== undefined
              ? res.prefSpeedDecreaseKey
              : "KeyA";
          globalSpeedIncreaseKey =
            res.prefSpeedIncreaseKey !== undefined
              ? res.prefSpeedIncreaseKey
              : "KeyD";
          globalSpeedResetKey =
            res.prefSpeedResetKey !== undefined
              ? res.prefSpeedResetKey
              : "KeyS";

          globalScreenshotQuality =
            res.prefScreenshotQuality !== undefined
              ? Number(res.prefScreenshotQuality)
              : 0.9;
          globalAutoScreenshot =
            res.prefAutoScreenshot !== undefined
              ? res.prefAutoScreenshot
              : true;
          globalMaxScreenshots =
            res.prefMaxScreenshots !== undefined
              ? Number(res.prefMaxScreenshots)
              : 500;
          globalPanelOpacity =
            res.prefPanelOpacity !== undefined
              ? Number(res.prefPanelOpacity)
              : 85;
          globalDanmakuCustomColor =
            res.prefDanmakuCustomColor !== undefined
              ? res.prefDanmakuCustomColor
              : "#f472b6";
          globalMarkerCustomColor =
            res.prefMarkerCustomColor !== undefined
              ? res.prefMarkerCustomColor
              : "#6366f1";

          const rawDanmakuColor =
            res.prefDanmakuColor !== undefined
              ? res.prefDanmakuColor
              : "white";
          globalDanmakuColor =
            rawDanmakuColor === "custom"
              ? globalDanmakuCustomColor
              : rawDanmakuColor;

          globalDanmakuSize =
            res.prefDanmakuSize !== undefined
              ? Number(res.prefDanmakuSize)
              : 14;

          const rawMarkerColor =
            res.prefMarkerColor !== undefined
              ? res.prefMarkerColor
              : "#6366f1";
          globalMarkerColor =
            rawMarkerColor === "custom"
              ? globalMarkerCustomColor
              : rawMarkerColor;
          globalMarkerSize =
            res.prefMarkerSize !== undefined
              ? Number(res.prefMarkerSize)
              : 8;
          globalMinSpeed =
            res.prefMinSpeed !== undefined
              ? Number(res.prefMinSpeed)
              : 0.5;
          globalMaxSpeed =
            res.prefMaxSpeed !== undefined
              ? Number(res.prefMaxSpeed)
              : 2.0;
          globalSpeedStep =
            res.prefSpeedStep !== undefined
              ? Number(res.prefSpeedStep)
              : 0.1;
          globalAutoSaveInterval =
            res.prefAutoSaveInterval !== undefined
              ? Number(res.prefAutoSaveInterval)
              : 5000;
          globalAutoCleanDays =
            res.prefAutoCleanDays !== undefined
              ? Number(res.prefAutoCleanDays)
              : 0;
          globalTheme =
            res.prefTheme !== undefined
              ? res.prefTheme
              : "dark";
          globalPanelRadius =
            res.prefPanelRadius !== undefined
              ? Number(res.prefPanelRadius)
              : 21;
          globalDanmakuFocusKey =
            res.prefDanmakuFocusKey !== undefined
              ? res.prefDanmakuFocusKey
              : "KeyM";
          globalDanmakuFocusModifiers =
            res.prefDanmakuFocusModifiers !== undefined
              ? res.prefDanmakuFocusModifiers
              : ["alt"];
          globalQuickScreenshotKey =
            res.prefQuickScreenshotKey !== undefined
              ? res.prefQuickScreenshotKey
              : "KeyS";
          globalQuickScreenshotModifiers =
            res.prefQuickScreenshotModifiers !== undefined
              ? res.prefQuickScreenshotModifiers
              : ["alt"];
          globalKeyboardSpeedDecreaseKey =
            res.prefKeyboardSpeedDecreaseKey !== undefined
              ? res.prefKeyboardSpeedDecreaseKey
              : "BracketLeft";
          globalKeyboardSpeedIncreaseKey =
            res.prefKeyboardSpeedIncreaseKey !== undefined
              ? res.prefKeyboardSpeedIncreaseKey
              : "BracketRight";
          globalKeyboardSpeedResetKey =
            res.prefKeyboardSpeedResetKey !== undefined
              ? res.prefKeyboardSpeedResetKey
              : "Backslash";

          if (globalAutoCleanDays > 0) {
            autoCleanOldData(globalAutoCleanDays);
          }

          window.videoMap = videoMap;
          window.lastActiveVideoId = lastActiveVideoId;
          window.globalDanmakuSpeed = globalDanmakuSpeed;
          window.globalEnableShortcuts = globalEnableShortcuts;
          window.globalSpeedShortcut = globalSpeedShortcut;
          window.globalSpeedStep = globalSpeedStep;
          window.globalMinSpeed = globalMinSpeed;
          window.globalMaxSpeed = globalMaxSpeed;
          window.globalPanelRadius = globalPanelRadius;
          window.globalDanmakuFocusKey = globalDanmakuFocusKey;
          window.globalDanmakuFocusModifiers = globalDanmakuFocusModifiers;
          window.globalQuickScreenshotKey = globalQuickScreenshotKey;
          window.globalQuickScreenshotModifiers = globalQuickScreenshotModifiers;
          window.globalSpeedDecreaseKey = globalSpeedDecreaseKey;
          window.globalSpeedIncreaseKey = globalSpeedIncreaseKey;
          window.globalSpeedResetKey = globalSpeedResetKey;
          window.globalKeyboardSpeedDecreaseKey = globalKeyboardSpeedDecreaseKey;
          window.globalKeyboardSpeedIncreaseKey = globalKeyboardSpeedIncreaseKey;
          window.globalKeyboardSpeedResetKey = globalKeyboardSpeedResetKey;
        }
      },
    );

    /**
     * 自动清理旧数据
     * @param {number} days - 保留天数，超过此天数的数据将被清理
     */
    async function autoCleanOldData(days) {
      if (window.VT_STORAGE && typeof window.VT_STORAGE.removeOldData === "function") {
        await window.VT_STORAGE.removeOldData(days);
        return;
      }

      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

      const result = await new Promise((resolve) => {
        chrome.storage.local.get(["progressHistory", "markers", "screenshots"], (res) => {
          resolve(res || {});
        });
      });

      const progressHistory = result.progressHistory || [];
      const markers = result.markers || [];
      const screenshots = result.screenshots || [];

      const deletedProgress = progressHistory.filter(p => p.lastWatched && p.lastWatched < cutoffTime);
      const deletedMarkers = markers.filter(m => m.timestamp && m.timestamp < cutoffTime);
      const deletedScreenshots = screenshots.filter(s => s.timestamp && s.timestamp < cutoffTime);

      if (deletedProgress.length === 0 && deletedMarkers.length === 0 && deletedScreenshots.length === 0) {
        return;
      }

      const keepProgress = progressHistory.filter(p => !p.lastWatched || p.lastWatched >= cutoffTime);
      const keepMarkers = markers.filter(m => !m.timestamp || m.timestamp >= cutoffTime);
      const keepScreenshots = screenshots.filter(s => !s.timestamp || s.timestamp >= cutoffTime);

      const updates = {};
      if (keepProgress.length !== progressHistory.length) {
        updates.progressHistory = keepProgress;
      }
      if (keepMarkers.length !== markers.length) {
        updates.markers = keepMarkers;
      }
      if (keepScreenshots.length !== screenshots.length) {
        updates.screenshots = keepScreenshots;
        deletedScreenshots.forEach(s => {
          if (s.id) {
            chrome.storage.local.remove(`screenshot_${s.id}`);
          }
        });
      }

      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    }

    /**
     * 监听配置热更新，实现管理中心选项秒级在视频播放页实时生效
     */
    if (isContextValid()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local") {
          if (changes.prefOffsetNormalAction)
            globalOffsetNormalAction = changes.prefOffsetNormalAction.newValue;
          if (changes.prefOffsetFullscreenAction)
            globalOffsetFullscreenAction =
              changes.prefOffsetFullscreenAction.newValue;
          if (changes.prefOffsetNormalSnap)
            globalOffsetNormalSnap = changes.prefOffsetNormalSnap.newValue;
          if (changes.prefOffsetFullscreenSnap)
            globalOffsetFullscreenSnap =
              changes.prefOffsetFullscreenSnap.newValue;
          if (changes.prefOffsetNormalSpeed)
            globalOffsetNormalSpeed = changes.prefOffsetNormalSpeed.newValue;
          if (changes.prefOffsetFullscreenSpeed)
            globalOffsetFullscreenSpeed =
              changes.prefOffsetFullscreenSpeed.newValue;

          if (changes.prefAutoHideDelay)
            globalAutoHideDelay = Number(changes.prefAutoHideDelay.newValue);
          if (changes.prefHoverFocus)
            globalHoverFocus = changes.prefHoverFocus.newValue;
          if (changes.prefHoverVideoExpand)
            globalHoverVideoExpand = changes.prefHoverVideoExpand.newValue;
          if (changes.prefDanmakuSpeed)
            globalDanmakuSpeed = Number(changes.prefDanmakuSpeed.newValue);
          if (changes.prefEnableShortcuts)
            globalEnableShortcuts = changes.prefEnableShortcuts.newValue;
          if (changes.prefSpeedShortcut)
            globalSpeedShortcut = changes.prefSpeedShortcut.newValue;
          if (changes.prefShowDanmakuOnJump)
            globalShowDanmakuOnJump = changes.prefShowDanmakuOnJump.newValue;
          if (changes.prefTimeDisplayType) {
            globalTimeDisplayType = changes.prefTimeDisplayType.newValue;
            videoMap.forEach((entry) => {
              const prefixEl = entry.actionPanel?.querySelector(".vt-input-prefix");
              const inputEl = entry.actionPanel?.querySelector(".vt-input-field");
              if (prefixEl && inputEl && entry.video) {
                const isFocused = document.activeElement === inputEl;
                const targetTime = isFocused && entry.lockedTime !== undefined ? entry.lockedTime : entry.video.currentTime;
                prefixEl.innerText = getDisplayTime(targetTime, entry.video);
              }
            });
          }
          if (changes.prefSpeedDecreaseKey)
            globalSpeedDecreaseKey = changes.prefSpeedDecreaseKey.newValue;
          if (changes.prefSpeedIncreaseKey)
            globalSpeedIncreaseKey = changes.prefSpeedIncreaseKey.newValue;
          if (changes.prefSpeedResetKey)
            globalSpeedResetKey = changes.prefSpeedResetKey.newValue;

          if (changes.prefScreenshotQuality)
            globalScreenshotQuality = Number(changes.prefScreenshotQuality.newValue);
          if (changes.prefAutoScreenshot)
            globalAutoScreenshot = changes.prefAutoScreenshot.newValue;
          if (changes.prefMaxScreenshots)
            globalMaxScreenshots = Number(changes.prefMaxScreenshots.newValue);
          if (changes.prefPanelOpacity)
            globalPanelOpacity = Number(changes.prefPanelOpacity.newValue);
          if (changes.prefDanmakuCustomColor) {
            globalDanmakuCustomColor = changes.prefDanmakuCustomColor.newValue;
          }
          if (changes.prefMarkerCustomColor) {
            globalMarkerCustomColor = changes.prefMarkerCustomColor.newValue;
          }

          if (changes.prefDanmakuColor) {
            const rawVal = changes.prefDanmakuColor.newValue;
            globalDanmakuColor = rawVal === "custom" ? globalDanmakuCustomColor : rawVal;
          } else if (changes.prefDanmakuCustomColor) {
            chrome.storage.local.get({ prefDanmakuColor: "white" }, (res) => {
              if (res.prefDanmakuColor === "custom") {
                globalDanmakuColor = globalDanmakuCustomColor;
              }
            });
          }

          if (changes.prefDanmakuSize)
            globalDanmakuSize = Number(changes.prefDanmakuSize.newValue);

          if (changes.prefMarkerColor) {
            const rawVal = changes.prefMarkerColor.newValue;
            globalMarkerColor = rawVal === "custom" ? globalMarkerCustomColor : rawVal;
            if (typeof updateAllMarkerPointColors === "function") {
              updateAllMarkerPointColors();
            }
          } else if (changes.prefMarkerCustomColor) {
            chrome.storage.local.get({ prefMarkerColor: "#6366f1" }, (res) => {
              if (res.prefMarkerColor === "custom") {
                globalMarkerColor = globalMarkerCustomColor;
                if (typeof updateAllMarkerPointColors === "function") {
                  updateAllMarkerPointColors();
                }
              }
            });
          }
          if (changes.prefMarkerSize)
            globalMarkerSize = Number(changes.prefMarkerSize.newValue);
          if (changes.prefMinSpeed)
            globalMinSpeed = Number(changes.prefMinSpeed.newValue);
          if (changes.prefMaxSpeed)
            globalMaxSpeed = Number(changes.prefMaxSpeed.newValue);
          if (changes.prefSpeedStep)
            globalSpeedStep = Number(changes.prefSpeedStep.newValue);
          if (changes.prefAutoSaveInterval)
            globalAutoSaveInterval = Number(changes.prefAutoSaveInterval.newValue);
          if (changes.prefAutoCleanDays)
            globalAutoCleanDays = Number(changes.prefAutoCleanDays.newValue);
          if (changes.prefTheme)
            globalTheme = changes.prefTheme.newValue;
          if (changes.prefPanelRadius)
            globalPanelRadius = Number(changes.prefPanelRadius.newValue);
          if (changes.prefDanmakuFocusKey)
            globalDanmakuFocusKey = changes.prefDanmakuFocusKey.newValue;
          if (changes.prefDanmakuFocusModifiers)
            globalDanmakuFocusModifiers = changes.prefDanmakuFocusModifiers.newValue;
          if (changes.prefQuickScreenshotKey)
            globalQuickScreenshotKey = changes.prefQuickScreenshotKey.newValue;
          if (changes.prefQuickScreenshotModifiers)
            globalQuickScreenshotModifiers = changes.prefQuickScreenshotModifiers.newValue;
          if (changes.prefKeyboardSpeedDecreaseKey)
            globalKeyboardSpeedDecreaseKey = changes.prefKeyboardSpeedDecreaseKey.newValue;
          if (changes.prefKeyboardSpeedIncreaseKey)
            globalKeyboardSpeedIncreaseKey = changes.prefKeyboardSpeedIncreaseKey.newValue;
          if (changes.prefKeyboardSpeedResetKey)
            globalKeyboardSpeedResetKey = changes.prefKeyboardSpeedResetKey.newValue;

          window.globalDanmakuSpeed = globalDanmakuSpeed;
          window.globalEnableShortcuts = globalEnableShortcuts;
          window.globalSpeedShortcut = globalSpeedShortcut;
          window.globalSpeedStep = globalSpeedStep;
          window.globalMinSpeed = globalMinSpeed;
          window.globalMaxSpeed = globalMaxSpeed;
          window.globalPanelRadius = globalPanelRadius;
          window.globalDanmakuFocusKey = globalDanmakuFocusKey;
          window.globalDanmakuFocusModifiers = globalDanmakuFocusModifiers;
          window.globalQuickScreenshotKey = globalQuickScreenshotKey;
          window.globalQuickScreenshotModifiers = globalQuickScreenshotModifiers;
          window.globalSpeedDecreaseKey = globalSpeedDecreaseKey;
          window.globalSpeedIncreaseKey = globalSpeedIncreaseKey;
          window.globalSpeedResetKey = globalSpeedResetKey;
          window.globalKeyboardSpeedDecreaseKey = globalKeyboardSpeedDecreaseKey;
          window.globalKeyboardSpeedIncreaseKey = globalKeyboardSpeedIncreaseKey;
          window.globalKeyboardSpeedResetKey = globalKeyboardSpeedResetKey;
        }
      });
    }

    /**
     * 智能计算最合适的挂载容器，适配 B站等特殊播放器的 z-index 层级压制和 iframe 重塑
     * @param {HTMLVideoElement} video - 视频元素
     * @returns {HTMLElement|null} 挂载容器元素
     */
    function getMountContainer(video) {
      if (!video) return null;
      const hostname = location.hostname;

      // 穿透 Shadow DOM 边界向上搜寻合适的播放器主容器
      let target = video;
      while (target) {
        if (target.closest) {
          const container =
            target.closest(".bpx-player-container") ||
            target.closest(".bilibili-player") ||
            target.closest("#bilibiliPlayer") ||
            target.closest(".txp_player") || // 腾讯视频核心播放器
            target.closest(".html5-video-player") || // YouTube 播放器
            // 百家云（baijiayun）内核播放器，用于启航考研 iqihang 等网校站点，
            // 必须放在通用通配选择器之前，否则会被外层大容器抢先匹配导致标记条定位错乱
            target.closest("[class*='bjy-']") || // 百家云组件前缀 bjy-player / bjy-playback 等
            target.closest("[class*='baijia']") || // 百家云备选前缀
            target.closest("[class*='player-container']") || // 通用类名检索
            target.closest("[class*='player_container']") || // 通用类名检索
            target.closest("[class*='video-player']") || // 通用类名检索
            target.closest("[id*='player']") || // 通用 ID 检索
            target.closest("[class*='player']") || // 兜底类名包含 player 的容器
            target.closest("[class*='video-container']") || // 视频容器
            target.closest("[class*='video_container']") || // 视频容器
            target.closest("[class*='video-wrapper']") || // 视频包装器
            target.closest("[class*='video_wrapper']") || // 视频包装器
            target.closest("[class*='learning']") || // 学习平台
            target.closest("[class*='course']") || // 课程平台
            target.closest("[class*='study']") || // 学习平台
            target.closest("[class*='lesson']") || // 课时容器
            target.closest("[class*='player-box']") || // 播放器盒子
            target.closest("[class*='player_box']") || // 播放器盒子
            target.closest("[class*='player-wrapper']") || // 播放器包装器
            target.closest("[class*='player_wrapper']"); // 播放器包装器
          if (container) return container;
        }

        // 检查父节点并跨越 ShadowRoot 界限
        const parent = target.parentElement || target.parentNode;
        if (parent && parent instanceof ShadowRoot) {
          target = parent.host; // 跳出影子 DOM，指向宿主元素！
        } else if (parent && parent !== document) {
          target = parent;
        } else {
          break;
        }
      }

      // 兜底返回视频元素的直属父级或影子宿主
      return (
        video.parentElement ||
        (video.parentNode && video.parentNode.host
          ? video.parentNode.host
          : video.parentElement)
      );
    }

    /**
     * 清理已被从 DOM 中移除的视频相关资源，并自动修复和重新挂载掉线的插件 UI 控制层
     */
    function cleanupRemovedVideos() {
      const toRemove = [];

      for (const [id, entry] of videoMap.entries()) {
        // 防抖：3秒内不重复重新挂载
        const now = Date.now();
        if (entry.lastRemountTime && now - entry.lastRemountTime < 3000) {
          continue;
        }
        // 1. 如果视频本身已被销毁或离线，清理对应资源，防止内存泄漏
        if (!entry.video || !entry.video.isConnected) {
          toRemove.push(id);
          continue;
        }

        // 【关键修复】：检测视频元素是否已被其他 videoId 占用（被复用）
        // 如果当前 entry 的 video 元素已经被另一个 videoId 记录，清理当前 entry
        let isVideoReused = false;
        for (const [otherId, otherEntry] of videoMap.entries()) {
          if (otherId !== id && otherEntry.video === entry.video) {
            isVideoReused = true;
            break;
          }
        }
        if (isVideoReused) {
          toRemove.push(id);
          continue;
        }

        // 2. 如果视频仍在，但打点控制面板或底部打点条被网页框架的重绘操作误删了，执行自动挂载恢复
        let isBarOffline = entry.markerBar && !entry.markerBar.isConnected;
        let isPanelOffline =
          entry.actionPanel && !entry.actionPanel.isConnected;
        let isSnapOffline = entry.snapPanel && !entry.snapPanel.isConnected;
        let isSpeedOffline = entry.speedPanel && !entry.speedPanel.isConnected;

        if (isBarOffline || isPanelOffline || isSnapOffline || isSpeedOffline) {
          console.log(
            `VidBuddy Bridge: 检测到离线 - ID: ${id}, barOffline: ${isBarOffline}, panelOffline: ${isPanelOffline}, snapOffline: ${isSnapOffline}, speedOffline: ${isSpeedOffline}`,
          );

          const currentBest = getMountContainer(entry.video);
          if (currentBest) {
            // 清除可能残留的旧脏节点，维护 DOM 树的唯一性
            const legacyBars = currentBest.querySelectorAll(
              ".vt-marker-bar-wrapper",
            );
            const legacyPanels =
              currentBest.querySelectorAll(".vt-action-panel");
            const legacySnaps = currentBest.querySelectorAll(".vt-snap-panel");
            const legacySpeeds =
              currentBest.querySelectorAll(".vt-speed-panel");

            legacyBars.forEach((bar) => {
              if (bar !== entry.markerBar) bar.remove();
            });
            legacyPanels.forEach((panel) => {
              if (panel !== entry.actionPanel) panel.remove();
            });
            legacySnaps.forEach((panel) => {
              if (panel !== entry.snapPanel) panel.remove();
            });
            legacySpeeds.forEach((panel) => {
              if (panel !== entry.speedPanel) panel.remove();
            });

            // 重新追加到 overlayHost 中
            if (
              entry.markerBar &&
              entry.markerBar.parentNode !== entry.overlayHost
            ) {
              entry.markerBar.remove();
              entry.overlayHost.appendChild(entry.markerBar);
            }
            if (
              entry.actionPanel &&
              entry.actionPanel.parentNode !== entry.overlayHost
            ) {
              entry.actionPanel.remove();
              entry.overlayHost.appendChild(entry.actionPanel);
            }
            if (
              entry.snapPanel &&
              entry.snapPanel.parentNode !== entry.overlayHost
            ) {
              entry.snapPanel.remove();
              entry.overlayHost.appendChild(entry.snapPanel);
            }
            if (
              entry.speedPanel &&
              entry.speedPanel.parentNode !== entry.overlayHost
            ) {
              entry.speedPanel.remove();
              entry.overlayHost.appendChild(entry.speedPanel);
            }

            currentBest.appendChild(entry.overlayHost);

            // 重新进行一次定位和尺寸微调
            requestAdjustOverlayPosition(
              entry.video,
              entry.markerBar,
              entry.actionPanel,
            );

            // 重新显示所有面板
            if (entry.actionPanel) {
              entry.actionPanel.classList.add("vt-panel-visible");
              entry.actionPanel.classList.remove("vt-collapsed");
            }
            if (entry.markerBar) {
              entry.markerBar.classList.add("vt-bar-visible");
            }
            if (entry.snapPanel) {
              entry.snapPanel.classList.add("vt-panel-visible");
            }
            if (entry.speedPanel) {
              entry.speedPanel.classList.add("vt-panel-visible");
            }

            entry.lastRemountTime = Date.now();
            console.log(
              `VidBuddy Bridge: 检测到视频 ${id} 的插件 UI 掉线，已自动重新挂载并对准。`,
            );
          }
        }
      }

      for (const id of toRemove) {
        const entry = videoMap.get(id);
        if (!entry) continue;

        if (entry.video === activeVideoForMouseMove) {
          activeVideoForMouseMove = null;
        }

        if (entry.resizeObserver) {
          entry.resizeObserver.disconnect();
        }
        if (entry.globalMouseMoveListener) {
          document.removeEventListener(
            "mousemove",
            entry.globalMouseMoveListener,
            { capture: true },
          );
          document.removeEventListener(
            "pointermove",
            entry.globalMouseMoveListener,
            { capture: true },
          );
        }
        if (entry.globalMarkerClickListener) {
          document.removeEventListener(
            "click",
            entry.globalMarkerClickListener,
            { capture: true },
          );
        }
        if (entry.handleFullscreenChange) {
          document.removeEventListener(
            "fullscreenchange",
            entry.handleFullscreenChange,
          );
          document.removeEventListener(
            "webkitfullscreenchange",
            entry.handleFullscreenChange,
          );
          document.removeEventListener(
            "mozfullscreenchange",
            entry.handleFullscreenChange,
          );
          document.removeEventListener(
            "MSFullscreenChange",
            entry.handleFullscreenChange,
          );
        }
        if (entry.cleanupDrags) {
          entry.cleanupDrags();
        }
        if (adjustRafId) {
          cancelAnimationFrame(adjustRafId);
          adjustRafId = null;
        }
        if (entry.overlayHost) entry.overlayHost.remove();
        if (entry.markerBar) entry.markerBar.remove();
        if (entry.actionPanel) entry.actionPanel.remove();
        videoMap.delete(id);
        if (lastActiveVideoId === id) {
          lastActiveVideoId = null;
        }
        console.log(`VidBuddy Bridge: 已清理视频记录 ${id}`);
      }
    }

    /**
     * 验证视频源是否有效
     * @param {HTMLVideoElement} video - 视频元素
     * @returns {boolean} 源是否有效
     */
    function isValidVideoSource(video) {
      if (!video) return false;

      const src = video.src;
      const sourceElements = video.querySelectorAll('source');

      if (!src && sourceElements.length === 0) {
        return false;
      }

      const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.flv', '.mkv', '.wmv', '.ogg', '.m3u8', '.ts'];
      const validSchemes = ['http:', 'https:', 'data:', 'blob:'];

      if (src) {
        try {
          const url = new URL(src);
          const scheme = url.protocol;
          
          if (!validSchemes.includes(scheme)) {
            return false;
          }

          if (scheme === 'data:') {
            if (!src.startsWith('data:video/')) {
              return false;
            }
          }

          if ((scheme === 'http:' || scheme === 'https:') && src.length > 0) {
            const path = url.pathname.toLowerCase();
            const isRootPath = path === '/' || path === '';
            if (isRootPath) {
              return false;
            }

            const hasValidExtension = validExtensions.some(ext => path.endsWith(ext));
            const isVideoContentType = video.currentSrc && video.currentSrc.includes('video/');
            
            if (!hasValidExtension && !isVideoContentType) {
              return false;
            }
          }
        } catch (e) {
          return false;
        }
      }

      for (const source of sourceElements) {
        const sourceSrc = source.src;
        if (!sourceSrc) continue;
        
        try {
          const url = new URL(sourceSrc);
          const path = url.pathname.toLowerCase();
          const hasValidExtension = validExtensions.some(ext => path.endsWith(ext));
          if (!hasValidExtension) {
            return false;
          }
        } catch (e) {
          continue;
        }
      }

      return true;
    }

    /**
     * 判定是否为主视频元素（过滤隐藏、微小、广告视频等，避免 UI 被多视频抢占）
     * @param {HTMLVideoElement} video - 视频元素
     * @returns {boolean} 是否为主视频
     */
    function isMainVideo(video) {
      if (!video) return false;

      const width = video.offsetWidth;
      const height = video.offsetHeight;

      // 1. 过滤不可见视频元素
      const style = window.getComputedStyle(video);
      if (style.display === 'none' || style.visibility === 'hidden') return false;

      // 2. 过滤流类型视频（如 WebRTC 实时视频流）
      if (video.srcObject instanceof MediaStream) {
        return false;
      }

      // 3. 过滤没有有效视频源的元素
      if (!isValidVideoSource(video)) {
        return false;
      }

      // 4. 如果视频已渲染出物理尺寸，但尺寸过小（通常是广告或推荐栏小窗），予以拦截
      if (width > 0 && width < 250) return false;
      if (height > 0 && height < 180) return false;

      // 5. 如果页面上有多个大视频，只选择面积最大的那个作为正片主视频（未排版尺寸为0的不参与对比）
      const allVideos = Array.from(document.querySelectorAll("video")).filter(
        (v) => v.offsetWidth >= 250 && v.offsetHeight >= 180,
      );

      if (allVideos.length > 1) {
        let maxArea = 0;
        let bestVideo = null;
        allVideos.forEach((v) => {
          const area = v.offsetWidth * v.offsetHeight;
          if (area > maxArea) {
            maxArea = area;
            bestVideo = v;
          }
        });
        // 若当前视频已有大尺寸，但不是面积最大的那个，予以拦截
        if (width >= 250 && video !== bestVideo) {
          return false;
        }
      }

      return true;
    }

    /**
     * 精确获取各视频网站上的真实视频标题（排除网站通用后缀，防止初始化时抓到通用平台名）
     * @returns {string} 视频标题
     */
    function getVideoTitle() {
      const host = location.hostname;

      /**
     * 深度清洗标题后缀，剔除各种平台名或网校小尾巴以及时间戳、进度比值或百分比等无用后缀
     * 同时利用精确的时间/百分比格式匹配，保护原本标题中可能含有的非时间戳数字/符号后缀
     * 清洗策略：
     * 1. 剔除常见平台名（腾讯视频、哔哩哔哩、YouTube等）
     * 2. 剔除播放进度比值（如 "00:06 / 45:04"）
     * 3. 剔除括号内的时间戳（如 "[00:04:48]"）
     * 4. 剔除中文进度前缀（如 "已学至 00:00:10"）
     * 5. 剔除百分比进度（如 "100%"）
     * @param {string} rawTitle - 原始标题
     * @returns {string} 清洗后的标题
     */
    function cleanTitleTail(rawTitle) {
        if (!rawTitle) return "";
        let title = rawTitle;

        // 1. 剔除常见的平台名或网校小尾巴
        title = title.replace(
          /\s*[-_|_]\s*(?:腾讯视频|哔哩哔哩|bilibili|YouTube|爱奇艺|优酷|新东方在线网络课堂|新东方在线|新东方|启航教育考研网络课堂|启航教育考研|启航教育|启航考研|网易云课堂|慕课网|学堂在线|网校|网络课堂|在线课堂|在线网校|官网|官方网站|在线学习平台)$/i,
          "",
        );

        // 2. 剔除无用的时间戳/播放进度后缀
        title = title
          // 匹配播放进度比值，如 "00:06 / 45:04" 或 "32:26/32:27"
          .replace(
            /\s*(?:(?:\d{2}:)?\d{2}:\d{2})\s*\/\s*(?:(?:\d{2}:)?\d{2}:\d{2})\s*$/,
            "",
          )
          // 匹配包裹在各种括号内的时间戳，如 "[00:04:48]"、"(01:23:45)"、"（00:12）"、"【00:00:13】"
          .replace(
            /\s*(?:\[|【|（|\()?\s*(?:(?:\d{2}:)?\d{2}:\d{2})\s*(?:\]|】|）|\))?\s*$/,
            "",
          )
          // 匹配带中文前缀的时间进度，如 "已学至 00:00:10"、"已播 12:34"、"播放时长 02:30:00"
          .replace(
            /\s*(?:已学至|已学|已播|播放|学习进度|进度|时长)\s*(?:(?:\d{2}:)?\d{2}:\d{2})\s*$/,
            "",
          )
          // 匹配百分比进度，如 " 100%"、"已学 85%"
          .replace(
            /\s*(?:已学至|已学|已播|播放|学习进度|进度)?\s*\d{1,3}%\s*$/,
            "",
          );

        return title.trim();
      }

      /**
     * 通用标题验证：过滤无效标题
     * 验证规则：
     * 1. 长度必须在 2-100 字符之间
     * 2. 不能是常见导航项（首页、登录、注册等）
     * 3. 不能仅包含数字和特殊符号
     * @param {string} text - 标题文本
     * @returns {boolean} 是否为有效标题
     */
    function isValidTitle(text) {
        if (text.length < 2 || text.length > 100) return false;
        const blacklist = [
          "首页",
          "全部课程",
          "我的课程",
          "个人中心",
          "我的",
          "登录",
          "注册",
          "退出",
          "返回",
          "客服",
          "在线客服",
          "APP下载",
          "播放器",
          "视频播放器",
          "常见问题",
          "帮助中心",
          "关于我们",
        ];
        if (blacklist.includes(text)) return false;
        if (/^[0-9\s\-–—_|,.:;!?=+$%^&*()<>{}#@~`\\\/]+$/.test(text))
          return false;
        return true;
      }

      /**
       * 检测元素是否处于"当前播放/选中"状态（向上遍历祖先链，覆盖 li.active > .title 等嵌套结构）
       * @param {HTMLElement} el - 元素
       * @returns {boolean} 是否处于激活容器中
       */
      function isInActiveContainer(el) {
        // 边界同时兼容 BEM/连字符/下划线命名（如 learn--tree__content--active、is-active、tab_current），
        // 否则现代 Vue/组件库站点的激活态全部识别失败，导致标题被列表里第一项带偏
        const activePattern =
          /(^|[\s_-])(active|current|playing|selected)([\s_-]|$)/i;
        let walkEl = el;
        for (
          let i = 0;
          i < 6 &&
          walkEl &&
          walkEl.tagName !== "BODY" &&
          walkEl.tagName !== "HTML";
          i++
        ) {
          const cls = walkEl.getAttribute("class") || "";
          if (activePattern.test(cls)) {
            return true;
          }
          walkEl = walkEl.parentElement;
        }
        return false;
      }

      /**
     * 从 DOM 树中搜索并评估最适合的视频/课时标题元素
     * 搜索策略（两阶段）：
     * 第一阶段：使用预定义选择器在所有可访问 document 域中查找
     * 第二阶段：全局可见叶子节点正则扫描（当第一阶段分数低于 20 分时触发）
     * 评分规则：
     * - 长度得分：6-60字符 +20分，3-5字符 +5分
     * - 课时特征："第X讲 标题" +20分，仅"第X讲" -15分
     * - 文件后缀：.mp4/.mkv等 +15分
     * - 标签权重：h1 +8分，h2 +4分
     * - 类名匹配：video-title等 +10分
     * - 激活状态：处于 active/current/playing 容器 +50分（最高优先级）
     * @returns {string|null} 最佳标题或null
     */
      function findTitleInDOM() {
        const selectors = [
          ".video-title",
          ".video-name",
          ".video-info-title",
          ".video-info .title",
          ".course-title",
          ".course-name",
          ".course-info .title",
          ".lesson-title",
          ".lesson-name",
          ".lesson-info .title",
          ".class-title",
          ".class-name",
          ".chapter-title",
          ".chapter-name",
          ".play-title",
          ".playing-title",
          ".active-title",
          ".current-title",
          ".player-title",
          ".player-info-title",
          ".active .title",
          ".current .title",
          ".playing .title",
          ".active .name",
          ".current .name",
          ".playing .name",
          ".active-item",
          ".current-item",
          ".playing-item",
          "li.active",
          "li.current",
          "li.playing",
          ".breadcrumb .active",
          ".breadcrumb-item.active",
          "h1.title",
          "h1.name",
          "h2.title",
          "h2.name",
          "h1",
          "h2",
        ];

        // 收集所有可访问的 document 域，支持同源 parent/top 跨 iframe 页面检索
        const docs = [document];
        try {
          if (
            window.parent &&
            window.parent !== window &&
            window.parent.document
          ) {
            docs.push(window.parent.document);
          }
          if (
            window.top &&
            window.top !== window &&
            window.top !== window.parent &&
            window.top.document
          ) {
            docs.push(window.top.document);
          }
        } catch (e) {
          // 忽略跨域拦截报错
        }

        const candidates = new Map(); // text -> score

        // 1. 基于特定选择器在所有可访问 document 域中查找
        docs.forEach((doc) => {
          selectors.forEach((selector) => {
            try {
              const elements = doc.querySelectorAll(selector);
              elements.forEach((el) => {
                if (el && el.offsetHeight > 0 && el.offsetWidth > 0) {
                  const text = (el.innerText || el.textContent || "").trim();
                  if (text && isValidTitle(text)) {
                    let score = 10;
                    const len = text.length;

                    // 1. 长度打分 (更丰满的标题得分更高，惩罚过短的单纯序号)
                    if (len >= 6 && len <= 60) {
                      score += 20;
                    } else if (len >= 3 && len < 6) {
                      score += 5;
                    }

                    // 2. 课时细节打分
                    // 类似 "第1讲 具体型行列式"
                    if (/第?\s*\d+\s*[讲节课]\s*[^\d\s]+/.test(text)) {
                      score += 20;
                    }
                    // 如果仅仅是 "第1讲" 这种纯大纲编号
                    if (/^第?\s*\d+\s*[讲节课]$/.test(text)) {
                      score -= 15;
                    }

                    // 3. 常见视频/课件文件名后缀加分
                    if (/\.(mp4|mkv|flv|avi|rmvb|mov|wmv)$/i.test(text)) {
                      score += 15;
                    }

                    // 4. 标签语义权重
                    const tagName = el.tagName.toLowerCase();
                    if (tagName === "h1") {
                      score += 8;
                    } else if (tagName === "h2") {
                      score += 4;
                    }

                    // 5. 常见高价值类名加分
                    const className = el.getAttribute("class") || "";
                    if (
                      className.includes("video-title") ||
                      className.includes("course-name") ||
                      className.includes("play-title")
                    ) {
                      score += 10;
                    }

                    // 6. 当前播放/选中项强权重：若元素处于 active/current/playing 容器中，给予最高优先级加分，
                    //    确保播放列表中正在播放的视频标题胜出，而非列表中排在前面的其他视频。
                    //    但仅对长度 >= 6 的标题生效，防止 "第1讲" 等纯编号短文本被加分后越过 20 分阈值，
                    //    导致第二轮全局叶子节点扫描被跳过、完整标题无法被发现
                    if (isInActiveContainer(el) && text.length >= 6) {
                      score += 50;
                    }

                    const existingScore = candidates.get(text) || 0;
                    if (score > existingScore) {
                      candidates.set(text, score);
                    }
                  }
                }
              });
            } catch (e) {}
          });
        });

        // 2. 如果特定选择器没有获得满意结果，在所有可访问 document 域中进行全局可见叶子节点正则扫描
        let highestScore = -999;
        for (const score of candidates.values()) {
          if (score > highestScore) highestScore = score;
        }

        if (candidates.size === 0 || highestScore < 20) {
          docs.forEach((doc) => {
            try {
              const allEls = doc.querySelectorAll(
                "div, span, p, h1, h2, h3, h4, li, a",
              );
              allEls.forEach((el) => {
                // 放宽叶子节点的判断：允许没有子元素，或者子元素数量 <= 2（防止嵌套 icon/span 的标题元素被漏掉）
                if (
                  el &&
                  el.offsetHeight > 0 &&
                  el.offsetWidth > 0 &&
                  (!el.childElementCount || el.childElementCount <= 2)
                ) {
                  const text = (el.innerText || el.textContent || "").trim();
                  if (text && isValidTitle(text)) {
                    let score = 10;
                    const len = text.length;

                    if (len >= 6 && len <= 60) {
                      score += 20;
                    } else if (len >= 3 && len < 6) {
                      score += 5;
                    }

                    let matchesFeatures = false;

                    // 强特征 1：以常见视频后缀结尾 (如 .mp4)
                    if (/\.(mp4|mkv|flv|avi|rmvb|mov|wmv|ts)$/i.test(text)) {
                      score += 40;
                      matchesFeatures = true;
                    }

                    // 强特征 2：包含 "第X讲/节" 且后面还有课时描述
                    if (/第?\s*\d+\s*[讲节课集回]\s*[^\d\s]+/.test(text)) {
                      score += 35;
                      matchesFeatures = true;
                    }

                    // 强特征 3：处于 active/current/playing 容器中（当前正在播放的视频标题）
                    // 同第一轮：仅对长度 >= 6 的标题生效，防止 "第1讲" 等短编号被加分
                    if (isInActiveContainer(el) && text.length >= 6) {
                      score += 50;
                      matchesFeatures = true;
                    }

                    if (matchesFeatures && score >= 20) {
                      const existingScore = candidates.get(text) || 0;
                      if (score > existingScore) {
                        candidates.set(text, score);
                      }
                    }
                  }
                }
              });
            } catch (e) {}
          });
        }

        if (candidates.size === 0) return null;

        let bestTitle = null;
        let maxScore = -999;
        for (const [text, score] of candidates.entries()) {
          if (score > maxScore) {
            maxScore = score;
            bestTitle = text;
          }
        }

        return bestTitle;
      }

      // 阶段一：平台专属标题选择器（按优先级顺序）
      // 1. 哔哩哔哩 (Bilibili)
      if (host.includes("bilibili.com")) {
        const bTitle =
          document.querySelector(".video-title")?.innerText ||
          document.querySelector(".title-text")?.innerText;
        if (bTitle) return cleanTitleTail(bTitle);
      }

      // 2. 腾讯视频 (QQ Video)
      if (host.includes("qq.com")) {
        const qqTitle =
          document.querySelector(".video_title")?.innerText ||
          document.querySelector(".cover_title")?.innerText ||
          document.querySelector(".title_name")?.innerText ||
          document.querySelector(".cover_title_text")?.innerText ||
          document.querySelector(".cover_title_link")?.innerText ||
          document.querySelector(".cover_title_left")?.innerText;
        if (qqTitle) return cleanTitleTail(qqTitle);
      }

      // 3. YouTube
      if (host.includes("youtube.com")) {
        const ytTitle =
          document.querySelector("h1.ytd-watch-metadata")?.innerText ||
          document.querySelector("#container > h1")?.innerText;
        if (ytTitle) return cleanTitleTail(ytTitle);
      }

      // 4. 爱奇艺 (iQIYI)
      if (host.includes("iqiyi.com")) {
        const iqTitle =
          document.querySelector(".play-title")?.innerText ||
          document.querySelector(".video-title-wrap")?.innerText;
        if (iqTitle) return cleanTitleTail(iqTitle);
      }

      // 5. 优酷 (Youku)
      if (host.includes("youku.com")) {
        const ykTitle =
          document.querySelector(".title-link")?.innerText ||
          document.querySelector(".yk-play-title")?.innerText;
        if (ykTitle) return cleanTitleTail(ykTitle);
      }

      // 6. 启航考研 (iqihang.com，百家云内核学习页)
      // 该站课时列表里所有 .title-text 同分平局，必须直接读百家云播放器自带的"正在播放"标题元素，
      // 它是单一元素且永远跟随当前课时，最可靠。
      if (host.includes("iqihang.com")) {
        const iqhTitle =
          document.querySelector(".record--content--title")?.innerText ||
          document.querySelector("li.learn--tree__content--active .title-text")
            ?.innerText;
        if (iqhTitle) return cleanTitleTail(iqhTitle);
      }

      // 6.5. 网易云课堂 / 录播 / 直播回放 (study.163.com / live.study.163.com)
      if (host.includes("study.163.com")) {
        // A. 启发式：“目录”文本相邻节点查找法（针对直播回放教室头部导航条设计，免疫类名变更）
        const catalogEl = Array.from(document.querySelectorAll("*")).find(
          (el) => el.childNodes.length === 1 && el.innerText?.trim() === "目录",
        );
        if (catalogEl) {
          // 1. 查找相邻同级兄弟节点
          let sibling = catalogEl.nextElementSibling;
          while (sibling) {
            const text = sibling.innerText?.trim();
            if (
              text &&
              text !== "目录" &&
              text.length > 2 &&
              !text.includes("\n")
            ) {
              return cleanTitleTail(text);
            }
            sibling = sibling.nextElementSibling;
          }
          // 2. 查找父节点内剥离“目录”后的单行文本
          const parent = catalogEl.parentElement;
          if (parent) {
            const parentText = parent.innerText || "";
            const cleanText = parentText.replace("目录", "").trim();
            if (cleanText.length > 2 && !cleanText.includes("\n")) {
              return cleanTitleTail(cleanText);
            }
          }
        }

        // B. 特异性类名查找法（包含叶子级活跃节点与常见头部容器）
        const studyTitle =
          document.querySelector(".classroom-title")?.innerText ||
          document.querySelector(".classroom-header-title")?.innerText ||
          document.querySelector(".live-title")?.innerText ||
          document.querySelector(".title-name")?.innerText ||
          document.querySelector(".current-lesson-name")?.innerText ||
          document.querySelector(".leaf-item.active-item .title-text")
            ?.innerText ||
          document.querySelector(".leaf-item.active .title-text")?.innerText ||
          document.querySelector(".lesson-item-active .title-text")
            ?.innerText ||
          document.querySelector(".active-sub-item .title-text")?.innerText ||
          document.querySelector(".video-title")?.innerText ||
          document.querySelector(".lesson-title")?.innerText ||
          document.querySelector(".lesson-name")?.innerText ||
          document.querySelector(".active-item .title-text")?.innerText ||
          document.querySelector("li.active .title-text")?.innerText ||
          document.querySelector(".learn--tree__content--active .title-text")
            ?.innerText;
        if (studyTitle) return cleanTitleTail(studyTitle);
      }

      // 阶段二：通用 DOM 查找（当平台专属选择器未匹配时）
      const domTitle = findTitleInDOM();
      if (domTitle) {
        return cleanTitleTail(domTitle);
      }

      // 阶段三：兜底策略：优先使用顶层同源页面的网页标题，但剔除常见的平台小尾巴
      // 跨域时降级为当前 document.title
      let title = "";
      try {
        title =
          window.top.document.title ||
          window.parent.document.title ||
          document.title;
      } catch (e) {
        title = document.title;
      }
      title = title || "未知视频";
      return cleanTitleTail(title);
    }

    // 过滤无意义追踪参数，保留关键 Query 参数用于生成唯一哈希
    function getCleanUrlForHash() {
      const host = location.hostname;
      const path = location.pathname;
      const search = location.search;

      if (!search) return host + path;

      try {
        const urlParams = new URLSearchParams(search);
        // 排除不用于区分课时的追踪、营销及视频起始时间参数
        const excludeKeys = [
          "spm_id_from",
          "vd_source",
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
          "from",
          "ref",
          "referer",
          "origin",
          "t",
          "time",
          "start",
          "_t",
          "timestamp",
          "click_id",
          "gclid",
          "fbclid",
        ];

        excludeKeys.forEach((key) => urlParams.delete(key));

        const sortedKeys = Array.from(urlParams.keys()).sort();
        const cleanParams = new URLSearchParams();
        sortedKeys.forEach((key) => {
          cleanParams.set(key, urlParams.get(key));
        });

        const cleanQuery = cleanParams.toString();
        return host + path + (cleanQuery ? "?" + cleanQuery : "");
      } catch (e) {
        return host + path;
      }
    }

    // 清理视频源URL中的一次性时效参数，保持哈希唯一且稳定
    function cleanVideoUrlParams(url) {
      if (!url) return "";
      try {
        const parsed = new URL(url);
        const keysToRemove = [
          "token",
          "sign",
          "signature",
          "expires",
          "expires_in",
          "expire",
          "auth_key",
          "ts",
          "timestamp",
          "t",
          "key",
          "vkey",
          "uuid",
          "uid",
          "auth",
          "wsSecret",
          "wsTime",
        ];
        const params = parsed.searchParams;
        keysToRemove.forEach((k) => params.delete(k));

        const sortedKeys = Array.from(params.keys()).sort();
        const cleanParams = new URLSearchParams();
        sortedKeys.forEach((k) => cleanParams.set(k, params.get(k)));

        parsed.search = cleanParams.toString();
        return parsed.toString();
      } catch (e) {
        return url;
      }
    }

    // 核心的稳定 Video ID 生成器（基于网页专属的视频主键，防止刷新或换源产生重复记录）
    function generateVideoUniqueId(video) {
      const host = location.hostname;
      const path = location.pathname;
      const urlParams = new URLSearchParams(location.search);

      // 1. 哔哩哔哩 (Bilibili)：提取 BV 号或 ep 号，同时考虑分P参数
      if (host.includes("bilibili.com")) {
        const bvMatch = path.match(/\/video\/(BV[a-zA-Z0-9]+)/);
        if (bvMatch) {
          const p = urlParams.get("p");
          if (p && parseInt(p) > 1) {
            return `bili_${bvMatch[1]}_p${p}`;
          }
          return `bili_${bvMatch[1]}`;
        }

        const epMatch = path.match(/\/bangumi\/play\/ep(\d+)/);
        if (epMatch) return `bili_ep${epMatch[1]}`;

        const ssMatch = path.match(/\/bangumi\/play\/ss(\d+)/);
        if (ssMatch) return `bili_ss${ssMatch[1]}`;
      }

      // 2. 腾讯视频 (QQ Video)：从路径提取封面 ID 和视频 ID
      if (host.includes("qq.com")) {
        const qqMatch = path.match(
          /\/x\/cover\/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\.html/,
        );
        if (qqMatch) return `qq_${qqMatch[1]}_${qqMatch[2]}`;

        const qqPageMatch = path.match(/\/x\/page\/([a-zA-Z0-9]+)\.html/);
        if (qqPageMatch) return `qq_${qqPageMatch[1]}`;

        const qqVpathMatch = urlParams.get("vpath");
        if (qqVpathMatch) return `qq_vpath_${qqVpathMatch.replace(/\//g, "_")}`;
      }

      // 3. YouTube：提取 ?v= 参数
      if (host.includes("youtube.com")) {
        const v = urlParams.get("v");
        if (v) return `yt_${v}`;
      }

      // 4. 爱奇艺 (iQIYI)：考虑分P参数
      if (host.includes("iqiyi.com")) {
        const iqMatch = path.match(/\/v_([a-zA-Z0-9]+)\.html/);
        if (iqMatch) {
          const tvid = urlParams.get("tvid");
          const src = urlParams.get("src");
          if (tvid) return `iq_${iqMatch[1]}_${tvid}`;
          if (src) return `iq_${iqMatch[1]}_${src}`;
          return `iq_${iqMatch[1]}`;
        }
      }

      // 5. 网易云课堂 (NetEase MOOC)：从 URL 参数提取课程 ID
      if (host.includes("study.163.com")) {
        const courseId = urlParams.get("courseId");
        const lessonId = urlParams.get("lessonId");
        const chapterId = urlParams.get("chapterId");
        const liveId = urlParams.get("liveId");
        const videoIdParam = urlParams.get("videoId");

        if (courseId && lessonId) return `mooc_${courseId}_${lessonId}`;
        if (courseId && chapterId) return `mooc_${courseId}_${chapterId}`;
        if (liveId) return `mooc_live_${liveId}`;
        if (videoIdParam) return `mooc_video_${videoIdParam}`;

        const pathMatch = path.match(/\/course\/(\d+)/);
        if (pathMatch) return `mooc_course_${pathMatch[1]}`;

        const pathMatch2 = path.match(/\/learn\/(\d+)/);
        if (pathMatch2) return `mooc_learn_${pathMatch2[1]}`;
      }

      // 6. 兜底策略 1：如果是普通未知网站的真实静态或流媒体直连（非 Blob），优先使用视频源 URL 的哈希作为唯一标识
      let videoSrc = "";
      if (video) {
        videoSrc = video.currentSrc || video.src || "";
      }
      if (videoSrc && !videoSrc.startsWith("blob:") && videoSrc.length > 10) {
        const cleanVideoSrc = cleanVideoUrlParams(videoSrc);
        let hash = 0;
        for (let i = 0; i < cleanVideoSrc.length; i++) {
          const char = cleanVideoSrc.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return `hash_src_${Math.abs(hash).toString(36)}`;
      }

      // 7. 兜底策略 2：如果视频源是 blob 或空，退回到 host + path + 关键 Query 参数 + 视频标题 的哈希值，以实现同页面多视频/课时区分
      let cleanUrl = getCleanUrlForHash();
      const title = getVideoTitle();
      // 只有在抓取到合法的、非未知的标题时，才将标题拼入哈希种子，以实现同页面多视频/课时区分
      if (
        title &&
        ![
          "未知视频",
          "正在加载...",
          "加载中",
          "播放器",
          "视频播放器",
          "未知来源视频",
        ].includes(title)
      ) {
        cleanUrl += "_" + title;
      }
      let hash = 0;
      for (let i = 0; i < cleanUrl.length; i++) {
        const char = cleanUrl.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return `hash_${Math.abs(hash).toString(36)}`;
    }

    function generateFallbackVideoIds(videoId) {
      const fallbackIds = [];

      if (!videoId || typeof videoId !== "string") {
        return fallbackIds;
      }

      const cleanUrl = getCleanUrlForHash();
      let hash = 0;
      for (let i = 0; i < cleanUrl.length; i++) {
        const char = cleanUrl.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const urlHash = `hash_${Math.abs(hash).toString(36)}`;

      if (videoId.startsWith("mooc_")) {
        fallbackIds.push(urlHash);
      }

      if (videoId.startsWith("bili_") && videoId.includes("_p")) {
        const baseId = videoId.split("_p")[0];
        fallbackIds.push(baseId);
        fallbackIds.push(urlHash);
      }

      if (videoId.startsWith("koolearn_")) {
        fallbackIds.push(urlHash);
      }

      if (videoId.startsWith("icourse_")) {
        fallbackIds.push(urlHash);
      }

      if (videoId.startsWith("study163_")) {
        fallbackIds.push(urlHash);
      }

      if (videoId.startsWith("hash_")) {
        fallbackIds.push(urlHash);
      }

      if (
        !videoId.startsWith("mooc_") &&
        !videoId.startsWith("bili_") &&
        !videoId.startsWith("koolearn_") &&
        !videoId.startsWith("icourse_") &&
        !videoId.startsWith("study163_") &&
        !videoId.startsWith("hash_")
      ) {
        fallbackIds.push(urlHash);
      }

      return fallbackIds;
    }

    // 判断当前页面是否属于广告、第三方嵌入或统计追踪域名，防止历史记录被垃圾视频污染
    function isAdOrTraceDomain() {
      const host = location.hostname.toLowerCase();
      const url = location.href.toLowerCase();

      // 常见的广告、分析追踪及无关小部件域名关键词
      const badKeywords = [
        "googleads",
        "doubleclick",
        "adservice",
        "adsystem",
        "analytics",
        "scorecardresearch",
        "syndication",
        "adobedtm",
        "amazon-adsystem",
        "taboola",
        "outbrain",
        "adskeeper",
        "popads",
        "propellerads",
        "adcolony",
        "admob",
        "leadbolt",
        "chartboost",
        "adnxs",
        "crwdcntrl",
      ];

      if (badKeywords.some((kw) => host.includes(kw))) {
        return true;
      }

      // 屏蔽常见的广告路由路径
      if (
        url.includes("/ad/") ||
        url.includes("/ads/") ||
        url.includes("pos=ad") ||
        url.includes("click?")
      ) {
        return true;
      }

      return false;
    }

    // 1. 拦截 CustomEvent 获取 MAIN World 中捕获的 video 元素
    document.addEventListener("VT_VIDEO_CAPTURED", function (e) {
      cleanupRemovedVideos();
      const video = e.target;
      const { vtUrlId } = e.detail;

      if (video && video.tagName === "VIDEO") {
        if (!isMainVideo(video)) return;

        const domId = getOrGenerateDomId(video);
        if (!videoMap.has(domId)) {
          setupVideoHelper(video, domId, vtUrlId);
        } else {
          const entry = videoMap.get(domId);
          if (entry && entry.actionPanel) {
            // 如果 URL-based ID 发生了变化，说明 SPA 切集了，需要重新加载该视频的打点并恢复进度
            if (vtUrlId && entry.vtUrlId !== vtUrlId) {
              entry.vtUrlId = vtUrlId;
              if (entry.markerBar) {
                const pointsWrapper = entry.markerBar.querySelector(
                  ".vt-marker-points-wrapper",
                );
                if (pointsWrapper) {
                  loadMarkers(vtUrlId, pointsWrapper, video);
                }
              }
              restoreProgress(video, vtUrlId);
            }

            const currentBest = getMountContainer(video);
            const isDisconnected = !entry.actionPanel.isConnected;
            const hasBetterParent =
              currentBest && entry.actionPanel.parentNode !== currentBest;

            if (isDisconnected || hasBetterParent) {
              if (currentBest) {
                if (
                  entry.markerBar &&
                  entry.markerBar.parentNode !== entry.overlayHost
                ) {
                  entry.markerBar.remove();
                  entry.overlayHost.appendChild(entry.markerBar);
                }
                if (
                  entry.actionPanel &&
                  entry.actionPanel.parentNode !== entry.overlayHost
                ) {
                  entry.actionPanel.remove();
                  entry.overlayHost.appendChild(entry.actionPanel);
                }
                currentBest.appendChild(entry.overlayHost);
                requestAdjustOverlayPosition(
                  video,
                  entry.markerBar,
                  entry.actionPanel,
                );
              }
            }
          }
        }
      }
    });

    function seekToVideo(video, time) {
      const host = location.hostname;
      const paused = video.paused;

      if (video.readyState < 2) {
        video.addEventListener(
          "loadedmetadata",
          () => {
            video.currentTime = time;
          },
          { once: true },
        );
        return;
      }

      video.currentTime = time;

      if (host.includes("amazon.com") && !paused) {
        video.play();
        setTimeout(() => video.pause(), 50);
        setTimeout(() => video.play(), 100);
      } else if (host.includes("bilibili.com")) {
        const player = video.parentElement?.parentElement?.querySelector(
          ".bilibili-player-video-progress",
        );
        if (player) {
          player.click();
        }
      }
    }

    // 获取当前最活跃的视频对象
    function getActiveVideo() {
      if (lastActiveVideoId && videoMap.has(lastActiveVideoId)) {
        return videoMap.get(lastActiveVideoId);
      }
      if (videoMap.size > 0) {
        const firstEntry = videoMap.values().next().value;
        return firstEntry;
      }
      return null;
    }

    function changePlaybackSpeed(video, diff) {
      if (window.VT_SHORTCUTS && window.VT_SHORTCUTS.changePlaybackSpeed) {
        window.VT_SHORTCUTS.changePlaybackSpeed(video, diff);
      } else {
        let currentSpeed = video.playbackRate;
        let step = globalSpeedStep || 0.1;
        let newSpeed = currentSpeed + diff * step;
        newSpeed = Math.round(newSpeed * 100) / 100;
        newSpeed = Math.max(globalMinSpeed || 0.1, Math.min(globalMaxSpeed || 2.0, newSpeed));
        setVideoSpeed(newSpeed);
      }
    }

    function setVideoSpeed(newSpeed, isSilent = false) {
      if (window.VT_SHORTCUTS && window.VT_SHORTCUTS.setVideoSpeed) {
        window.VT_SHORTCUTS.setVideoSpeed(newSpeed, isSilent);
      } else {
        window.dispatchEvent(new CustomEvent("VT_SET_SPEED", { detail: newSpeed }));
        if (!isSilent) {
          showToast(`倍速已调整为：${newSpeed}x`);
        }
        if (window.VT_STORAGE) {
          window.VT_STORAGE.saveConfig({ globalPlaybackSpeed: newSpeed });
        } else {
          chrome.storage.local.set({ globalPlaybackSpeed: newSpeed });
        }
      }
    }

    if (window.VT_SHORTCUTS) {
      window.VT_SHORTCUTS.setVideoMap(videoMap);
      window.VT_SHORTCUTS.init();
    }
    if (window.VT_DANMAKU) {
      window.VT_DANMAKU.setVideoMap(videoMap);
    }

    // 3. 初始化视频辅助功能
    function setupVideoHelper(video, vtKey, vtUrlId) {
      const platform = location.hostname;

      lastActiveVideoId = vtKey;
      if (window.VT_SHORTCUTS && window.VT_SHORTCUTS.setLastActiveVideoId) {
        window.VT_SHORTCUTS.setLastActiveVideoId(vtKey);
      }

      function getCurrentUrlId() {
        const entry = videoMap.get(vtKey);
        return entry ? entry.vtUrlId : vtUrlId;
      }

      // 【白名单豪华 UI 分支】
      const mountContainer = getMountContainer(video);
      if (mountContainer) {
        if (video.paused) {
          mountContainer.classList.add("vt-video-wrapper-paused");
        }
        mountContainer.style.setProperty("--vt-speed", video.playbackRate);
      }

      video.addEventListener("play", () => {
        lastActiveVideoId = vtKey;
        if (window.VT_SHORTCUTS && window.VT_SHORTCUTS.setLastActiveVideoId) {
          window.VT_SHORTCUTS.setLastActiveVideoId(vtKey);
        }
        const mountContainer = getMountContainer(video);
        if (mountContainer) {
          mountContainer.classList.remove("vt-video-wrapper-paused");
        }
      });

      video.addEventListener("pause", () => {
        const mountContainer = getMountContainer(video);
        if (mountContainer) {
          mountContainer.classList.add("vt-video-wrapper-paused");
        }
      });

      video.addEventListener("ratechange", () => {
        const mountContainer = getMountContainer(video);
        if (mountContainer) {
          mountContainer.style.setProperty("--vt-speed", video.playbackRate);
        }
      });

      // 确保挂载容器为定位上下文容器，防止绝对定位的打点条坐标漂移
      if (mountContainer) {
        const parentStyle = window.getComputedStyle(mountContainer);
        if (parentStyle.position === "static") {
          mountContainer.style.position = "relative";
        }
      }

      // 【全屏兼容机制】创建 overlay 宿主容器，自动跟随全屏状态
      const overlayHost = document.createElement("div");
      overlayHost.className = `vt-overlay-host vt-theme-${globalTheme}`;
      overlayHost.style.position = "absolute";
      overlayHost.style.top = "0";
      overlayHost.style.left = "0";
      overlayHost.style.width = "100%";
      overlayHost.style.height = "100%";
      overlayHost.style.pointerEvents = "none";
      overlayHost.style.zIndex = "2147483647";

      let currentMountTarget =
        mountContainer || video.parentElement || document.body;
      currentMountTarget.appendChild(overlayHost);

      const handleFullscreenChange = () => {
        const entry = videoMap.get(vtKey);
        if (!entry) return;

        const { overlayHost, markerBar, actionPanel, vtUrlId } = entry;
        if (!overlayHost || !markerBar || !actionPanel) return;

        const fsElement =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;

        let targetElement = null;
        let isFull = false;

        if (fsElement) {
          const isVideoFullscreen =
            fsElement === video ||
            fsElement.contains(video) ||
            video.contains(fsElement);
          if (isVideoFullscreen) {
            targetElement = fsElement;
            isFull = true;
          }
        }

        if (!targetElement && mountContainer) {
          if (
            mountContainer.classList.contains("bpx-state-web-fullscreen") ||
            mountContainer.classList.contains("webfullscreen") ||
            mountContainer.classList.contains("player-fullscreen") ||
            mountContainer.classList.contains("fullscreen")
          ) {
            targetElement = mountContainer;
            isFull = true;
          }
        }

        if (targetElement && overlayHost.parentElement !== targetElement) {
          overlayHost.remove();
          targetElement.appendChild(overlayHost);
          currentMountTarget = targetElement;
          requestAdjustOverlayPosition(video, markerBar, actionPanel);
          showPanel();
          delayHidePanel();
          lastMouseInside = null;
          if (video.readyState >= 1) {
            const wrapper = markerBar.querySelector(
              ".vt-marker-points-wrapper",
            );
            if (wrapper) {
              loadMarkers(getCurrentUrlId(), wrapper, video);
            }
          }
        } else if (
          !isFull &&
          overlayHost.parentElement !== currentMountTarget
        ) {
          overlayHost.remove();
          const newTarget =
            getMountContainer(video) || video.parentElement || document.body;
          newTarget.appendChild(overlayHost);
          currentMountTarget = newTarget;
          requestAdjustOverlayPosition(video, markerBar, actionPanel);
          if (video.readyState >= 1) {
            const wrapper = markerBar.querySelector(
              ".vt-marker-points-wrapper",
            );
            if (wrapper) {
              loadMarkers(getCurrentUrlId(), wrapper, video);
            }
          }
        } else {
          requestAdjustOverlayPosition(video, markerBar, actionPanel);
        }
      };

      if (mountContainer) {
        const fullscreenClassObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (
              mutation.type === "attributes" &&
              mutation.attributeName === "class"
            ) {
              handleFullscreenChange();
            }
          }
        });
        fullscreenClassObserver.observe(mountContainer, { attributes: true });
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);

      // 创建通用的底部透明标记条
      const markerBar = document.createElement("div");
      markerBar.className = "vt-marker-bar-wrapper";
      markerBar.innerHTML = `
        <div class="vt-marker-points-wrapper"></div>
        <div class="vt-marker-tooltip"></div>
      `;

      const tooltipEl = markerBar.querySelector(".vt-marker-tooltip");

      if (tooltipEl) {
        tooltipEl.addEventListener("mouseenter", () => {
          if (tooltipEl._hideTimeout) {
            clearTimeout(tooltipEl._hideTimeout);
            tooltipEl._hideTimeout = null;
          }
        });
        tooltipEl.addEventListener("mouseleave", () => {
          tooltipEl._hideTimeout = setTimeout(() => {
            tooltipEl.classList.remove("vt-tooltip-visible");
          }, 300); // 300ms 溢出安全移动余地
        });
      }

      const actionPanel = window.VT_PANELS?.createActionPanel() || (() => {
        const el = document.createElement("div");
        el.className = "vt-action-panel vt-drag-handle";
        el.style.setProperty("border-radius", `${globalPanelRadius}px`, "important");
        el.innerHTML = `<span class="vt-input-prefix">00:00</span><div class="vt-input-container"><input type="text" class="vt-input-field" placeholder="记笔记并发弹幕..." /><div class="vt-color-selector"><span class="vt-color-dot red active" data-color="#ef4444"></span><span class="vt-color-dot yellow" data-color="#f59e0b"></span><span class="vt-color-dot green" data-color="#10b981"></span><span class="vt-color-dot purple" data-color="#a855f7"></span></div><button class="vt-input-send"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button></div>`;
        return el;
      })();

      const snapPanel = window.VT_PANELS?.createSnapPanel() || (() => {
        const el = document.createElement("div");
        el.className = "vt-snap-panel";
        el.style.setProperty("border-radius", `${globalPanelRadius}px`, "important");
        el.setAttribute("title", "截取视频当前帧 (Alt + S)");
        el.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
        return el;
      })();

      const speedPanel = window.VT_PANELS?.createSpeedPanel() || (() => {
        const el = document.createElement("div");
        el.className = "vt-speed-panel";
        el.innerHTML = `<div class="vt-speed-current" style="border-radius: ${globalPanelRadius}px !important;">1.0x</div><div class="vt-speed-menu"><div class="vt-speed-opt" data-rate="0.75">0.75x</div><div class="vt-speed-opt" data-rate="1.0">1.0x</div><div class="vt-speed-opt" data-rate="1.25">1.25x</div><div class="vt-speed-opt" data-rate="1.5">1.5x</div><div class="vt-speed-opt" data-rate="2.0">2.0x</div><div class="vt-speed-opt" data-rate="3.0">3.0x</div><div class="vt-speed-custom-row"><input type="text" class="vt-speed-custom-input" placeholder="自定义" /></div></div>`;
        return el;
      })();

      if (mountContainer) {
        // 【防双重面板物理铲除】：清除挂载点下可能遗留的任何旧打点条与控制面板，保障 DOM 树唯一性
        const legacyBars = mountContainer.querySelectorAll(
          ".vt-marker-bar-wrapper",
        );
        const legacyPanels =
          mountContainer.querySelectorAll(".vt-action-panel");
        const legacySpeeds = mountContainer.querySelectorAll(".vt-speed-panel");
        const legacySnaps = mountContainer.querySelectorAll(".vt-snap-panel");
        legacyBars.forEach((bar) => bar.remove());
        legacyPanels.forEach((panel) => panel.remove());
        legacySpeeds.forEach((panel) => panel.remove());
        legacySnaps.forEach((panel) => panel.remove());
      }

      // 挂载 overlay 到 overlayHost（无论 mountContainer 是否存在）
      overlayHost.appendChild(markerBar);
      overlayHost.appendChild(actionPanel);
      overlayHost.appendChild(snapPanel);
      overlayHost.appendChild(speedPanel);

      // 元素节点抓取与逻辑绑定（提前声明，避免引用错误）
      const prefixEl = actionPanel.querySelector(".vt-input-prefix");
      const inputEl = actionPanel.querySelector(".vt-input-field");
      const sendBtn = actionPanel.querySelector(".vt-input-send");
      const markerPointsWrapper = markerBar.querySelector(
        ".vt-marker-points-wrapper",
      );

      // 进度自动恢复 and 标记点加载
      const onVideoReady = () => {
        restoreProgress(video, getCurrentUrlId());
        loadMarkers(getCurrentUrlId(), markerPointsWrapper, video);
      };

      if (video.readyState >= 1) {
        onVideoReady();
      } else {
        video.addEventListener("loadedmetadata", onVideoReady, { once: true });
      }

      // 时长变化事件监听，拿到真实时长后即刻刷新打点位置
      video.addEventListener("durationchange", () => {
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          loadMarkers(getCurrentUrlId(), markerPointsWrapper, video);
        }
      });

      // 提取悬浮面板元素
      const speedCurrentEl = speedPanel.querySelector(".vt-speed-current");
      const speedCustomInput = speedPanel.querySelector(
        ".vt-speed-custom-input",
      );
      const speedOpts = speedPanel.querySelectorAll(".vt-speed-opt");

      // 从全局存储读取并恢复记忆倍速
      const applySavedSpeed = (savedSpeed) => {
        setVideoSpeed(savedSpeed, true);
        if (speedCurrentEl) {
          speedCurrentEl.innerText = `${savedSpeed}x`;
        }
        speedOpts.forEach((opt) => {
          const rate = parseFloat(opt.getAttribute("data-rate"));
          if (Math.abs(rate - savedSpeed) < 0.01) {
            opt.classList.add("active");
          } else {
            opt.classList.remove("active");
          }
        });
      };

      if (window.VT_STORAGE) {
        window.VT_STORAGE.loadConfig({ globalPlaybackSpeed: 1.0 }).then((res) => {
          applySavedSpeed(parseFloat(res.globalPlaybackSpeed) || 1.0);
        });
      } else {
        chrome.storage.local.get({ globalPlaybackSpeed: 1.0 }, (res) => {
          applySavedSpeed(parseFloat(res.globalPlaybackSpeed) || 1.0);
        });
      }

      if (speedCurrentEl) {
        // 滚轮在当前倍速按钮上滚动，微调倍速 (0.1 步长)
        speedCurrentEl.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            const diff = e.deltaY < 0 ? 1 : -1;
            changePlaybackSpeed(video, diff);
          },
          { passive: false },
        );
      }

      // 菜单选项的快捷点击
      speedOpts.forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          const rate = parseFloat(opt.getAttribute("data-rate"));
          if (!isNaN(rate)) {
            setVideoSpeed(rate);
          }
        });
      });

      // 自定义速度输入框
      if (speedCustomInput) {
        speedCustomInput.addEventListener("focus", (e) => {
          e.stopPropagation();
          isSpeedInputFocused = true;
          if (speedPanel) speedPanel.classList.add("vt-menu-open");
          speedCustomInput.value = video.playbackRate;
          speedCustomInput.select();
        });

        speedCustomInput.addEventListener("blur", () => {
          isSpeedInputFocused = false;
          if (speedPanel) speedPanel.classList.remove("vt-menu-open");
          let val = parseFloat(speedCustomInput.value);
          if (!isNaN(val) && val >= 0.1 && val <= 16.0) {
            setVideoSpeed(Math.round(val * 100) / 100);
          }
          speedCustomInput.value = "";
          delayHidePanel(1000);
        });

        speedCustomInput.addEventListener("keydown", (e) => {
          e.stopPropagation(); // 阻止热键
          if (e.key === "Enter") {
            speedCustomInput.blur();
          } else if (e.key === "Escape") {
            speedCustomInput.value = "";
            speedCustomInput.blur();
          }
        });
      }

      // 监听视频实际倍速变更，同步更新悬浮球文字和菜单中的选中态
      video.addEventListener("ratechange", () => {
        const curRate = video.playbackRate;
        if (speedCurrentEl) {
          speedCurrentEl.innerText = `${curRate}x`;
        }
        // 更新选中态
        speedOpts.forEach((opt) => {
          const rate = parseFloat(opt.getAttribute("data-rate"));
          if (Math.abs(rate - curRate) < 0.01) {
            opt.classList.add("active");
          } else {
            opt.classList.remove("active");
          }
        });
        // 倍速变更时更新打点输入框时间前缀（如果是倒数模式需要根据新倍速重新折算）
        if (prefixEl && globalTimeDisplayType === "countdown") {
          const targetTime = isInputFocused ? lockedTime : video.currentTime;
          prefixEl.innerText = getDisplayTime(targetTime, video);
        }
      });

      // 类似 B站/抖音长按左键视频区域 3.0x 极速快进
      let holdSpeedTimeout = null;
      let originalSpeed = 1.0;
      let isSpeedHolding = false;

      video.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || e.target.tagName !== "VIDEO") return;
        originalSpeed = video.playbackRate;
        holdSpeedTimeout = setTimeout(() => {
          isSpeedHolding = true;
          setVideoSpeed(3.0);
          showToast("⚡ 极速播放中 3.0x >>>");
        }, 500);
      });

      const releaseSpeedHold = () => {
        if (holdSpeedTimeout) {
          clearTimeout(holdSpeedTimeout);
          holdSpeedTimeout = null;
        }
        if (isSpeedHolding) {
          isSpeedHolding = false;
          setVideoSpeed(originalSpeed);
          showToast(`恢复播放速度：${originalSpeed}x`);
        }
      };

      video.addEventListener("mouseup", releaseSpeedHold);
      video.addEventListener("mouseleave", releaseSpeedHold);

      let isInputFocused = false;
      let isSpeedInputFocused = false;
      let lockedTime = 0;
      let activeColor = "#ef4444"; // 默认重点/考点红色

      const colorDots = actionPanel.querySelectorAll(".vt-color-dot");
      colorDots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          colorDots.forEach((d) => d.classList.remove("active"));
          dot.classList.add("active");
          activeColor = dot.getAttribute("data-color");
        });
      });

      // 输入框聚焦：锁定当前播放秒数作为打点刻度
      inputEl.addEventListener("focus", () => {
        isInputFocused = true;
        lockedTime = video.currentTime;
        const entry = videoMap.get(vtKey);
        if (entry) {
          entry.isInputFocused = true;
          entry.lockedTime = lockedTime;
        }
        prefixEl.innerText = getDisplayTime(lockedTime, video);
        prefixEl.classList.add("locked");
        showPanel(); // 聚焦时必须保持面板强显示
      });

      // 输入框失焦：解锁刻度并触发渐隐
      inputEl.addEventListener("blur", () => {
        isInputFocused = false;
        const entry = videoMap.get(vtKey);
        if (entry) {
          entry.isInputFocused = false;
          delete entry.lockedTime;
        }
        prefixEl.classList.remove("locked");
        delayHidePanel(1000); // 失焦后 1 秒隐藏
      });

      // 确认发射弹幕与记录打点
      function handleEmitDanmaku() {
        const val = inputEl.value.trim();
        const markTime = isInputFocused ? lockedTime : video.currentTime;
        const finalNote = val || `标记 @ ${formatTime(markTime)}`;

        const markerColor = activeColor;

        const marker = {
          id:
            window.VT_UTILS?.generateId("mk-") ||
            "mk-" + Math.random().toString(36).substr(2, 9),
          videoId: getCurrentUrlId(),
          time: markTime,
          note: finalNote,
          color: markerColor,
          createdAt: Date.now(),
        };

        enqueue("markers", async () => {
          const markers = await storageGet("markers", []);
          markers.push(marker);
          await storageSet({ markers });
        }).then(() => {
          renderMarkerPoint(marker, markerPointsWrapper, video);
          // 发射本地弹幕
          if (typeof firedMarkerIds !== "undefined") {
            firedMarkerIds.add(marker.id);
          }
          if (window.VT_DANMAKU && typeof window.VT_DANMAKU.launchDanmaku === "function") {
            window.VT_DANMAKU.launchDanmaku(video, `📌 ${finalNote}`);
          }
          // showToast(`📌 已发射标记弹幕：${finalNote}`);

          // 发射后清空并失焦复位
          inputEl.value = "";
          inputEl.blur();
        });
      }

      sendBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleEmitDanmaku();
      });

      // 输入框键盘拦截
      inputEl.addEventListener("keydown", (e) => {
        e.stopPropagation();

        // 拦截 Alt + 1-4 快捷键快速切换标记颜色分类
        if (
          e.altKey &&
          ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)
        ) {
          e.preventDefault();
          const idx = parseInt(e.code.replace("Digit", "")) - 1;
          const targetDot = colorDots[idx];
          if (targetDot) {
            colorDots.forEach((d) => d.classList.remove("active"));
            targetDot.classList.add("active");
            activeColor = targetDot.getAttribute("data-color");
            showToast(`已切换标记分类为：${targetDot.getAttribute("title").split(" ")[0]}`);
          }
          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();
          handleEmitDanmaku();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          inputEl.blur();
        }
      });

      // 实时位置监听：进度存储、时间动态同步与本地弹幕触发检测
      let lastSaveTime = 0;
      const firedMarkerIds = new Set();
      let suppressDanmakuUntil = 0; // 记录时间戳，用于跳转后临时抑制弹幕发射

      video.addEventListener("seeking", () => {
        firedMarkerIds.clear();
        suppressDanmakuUntil = Date.now() + 1000; // 寻求后 1 秒内不触发弹幕，防跳转重复轰炸
      });

      video.addEventListener("timeupdate", () => {
        const now = Date.now();
        const curTime = video.currentTime;
        const currentId = getCurrentUrlId();

        // 1. 进度自动存入 Storage（使用全局配置的保存间隔）
        if (now - lastSaveTime > globalAutoSaveInterval) {
          lastSaveTime = now;
          saveProgress(
            currentId,
            platform,
            location.href,
            getVideoTitle(),
            curTime,
            video.duration,
          );
        }

        // 2. 常驻面板时间戳动态同步（未聚焦时跟随时钟跳动）
        if (!isInputFocused) {
          prefixEl.innerText = getDisplayTime(curTime, video);
        }

        // 3. 弹幕发射检测（正在寻求中或跳转后 1 秒内禁止触发，防沿途标记点被中间帧错误激活）
        if (video.seeking || now < suppressDanmakuUntil) return;

        safeStorageGet({ markers: [], progressHistory: [] }, (result) => {
          if (!result) return;
          const allMarkers = result.markers;
          let markers = allMarkers.filter((m) => m.videoId === currentId);
          if (markers.length === 0) {
            const fallbackIds = generateFallbackVideoIds(currentId);
            // URL 关联回退：通过同 URL 的历史记录找回旧 videoId 关联的标记点
            const currentUrl = location.href;
            const urlMatchingIds = (result.progressHistory || [])
              .filter((item) => item.url === currentUrl)
              .map((item) => item.id);
            const allFallbackIds = [...fallbackIds, ...urlMatchingIds];
            markers = allMarkers.filter((m) =>
              allFallbackIds.includes(m.videoId),
            );
          }
          markers.forEach((mk) => {
            // 过滤截图点弹幕：截图的弹幕文字不进行本地弹幕发射
            const isScreenshot =
              mk.screenshotId ||
              mk.type === "screenshot" ||
              (mk.note && mk.note.startsWith("📷")) ||
              mk.color === "hsl(45, 95%, 55%)";
            if (isScreenshot) return;

            if (
              Math.abs(curTime - mk.time) < 0.4 &&
              !firedMarkerIds.has(mk.id)
            ) {
              firedMarkerIds.add(mk.id);
              if (window.VT_DANMAKU && typeof window.VT_DANMAKU.launchDanmaku === "function") {
                window.VT_DANMAKU.launchDanmaku(video, `📌 ${mk.note}`);
              }
            }
          });
        });
      });

      // ResizeObserver 监听视频尺寸，确保打点条和悬浮栏位置精准
      const debouncedAdjust = window.VT_UTILS?.debounce(
        () => requestAdjustOverlayPosition(video, markerBar, actionPanel),
        50
      ) || (() => requestAdjustOverlayPosition(video, markerBar, actionPanel));
      const resizeObserver = new ResizeObserver(debouncedAdjust);
      resizeObserver.observe(video);
      setTimeout(
        () => requestAdjustOverlayPosition(video, markerBar, actionPanel),
        100,
      );

      const dragCleanups = [];

      // 绑定 Action 面板拖拽
      if (window.VT_DRAG && typeof window.VT_DRAG.makeDraggable === "function") {
        dragCleanups.push(window.VT_DRAG.makeDraggable(actionPanel, "Action"));

        // 绑定 Snap 独立截图面板拖拽与点击
        dragCleanups.push(
          window.VT_DRAG.makeDraggable(snapPanel, "Snap", () => {
            takeScreenshot(video, getCurrentUrlId());
          }),
        );

        // 绑定 Speed 独立倍速面板拖拽与点击
        dragCleanups.push(
          window.VT_DRAG.makeDraggable(speedPanel, "Speed", () => {
          const rates = [1.0, 1.25, 1.5, 2.0, 3.0, 0.75];
          let currentIndex = rates.indexOf(video.playbackRate);
          if (currentIndex === -1) currentIndex = 0;
          const nextIndex = (currentIndex + 1) % rates.length;
          setVideoSpeed(rates[nextIndex]);
        }),
        );
      }

      // 5. 【自动显示与渐隐防打扰系统】：控制面板的可见性与延迟隐藏
      let panelHideTimeout = null;
      let panelCollapseTimeout = null;

      function showPanel() {
        if (panelHideTimeout) {
          clearTimeout(panelHideTimeout);
          panelHideTimeout = null;
        }
        if (panelCollapseTimeout) {
          clearTimeout(panelCollapseTimeout);
          panelCollapseTimeout = null;
        }
        actionPanel.classList.add("vt-panel-visible");
        actionPanel.classList.remove("vt-collapsed");
        if (speedPanel) speedPanel.classList.add("vt-panel-visible");
        if (snapPanel) snapPanel.classList.add("vt-panel-visible");
        requestAdjustOverlayPosition(video, markerBar, actionPanel);
        if (markerBar) markerBar.classList.add("vt-bar-visible");
        console.log(
          "VT: showPanel called, panel visible:",
          actionPanel.classList.contains("vt-panel-visible"),
        );
      }

      function showPanelCollapsed() {
        if (panelHideTimeout) {
          clearTimeout(panelHideTimeout);
          panelHideTimeout = null;
        }
        if (panelCollapseTimeout) {
          clearTimeout(panelCollapseTimeout);
          panelCollapseTimeout = null;
        }
        actionPanel.classList.add("vt-panel-visible");
        actionPanel.classList.add("vt-collapsed");
        if (speedPanel) speedPanel.classList.add("vt-panel-visible");
        if (snapPanel) snapPanel.classList.add("vt-panel-visible");
        if (markerBar) markerBar.classList.add("vt-bar-visible");
        requestAdjustOverlayPosition(video, markerBar, actionPanel);
      }

      function delayHidePanel(ms = globalAutoHideDelay) {
        if (panelHideTimeout) clearTimeout(panelHideTimeout);

        if (globalAutoHideDelay === 0 && ms !== 0) {
          actionPanel.classList.remove("vt-collapsed");
          actionPanel.classList.add("vt-panel-visible");
          if (speedPanel) speedPanel.classList.add("vt-panel-visible");
          if (snapPanel) snapPanel.classList.add("vt-panel-visible");
          if (markerBar) markerBar.classList.add("vt-bar-visible");
          return;
        }

        if (isInputFocused || isSpeedInputFocused) return;

        console.log(
          "VT: delayHidePanel called, ms:",
          ms,
          "autoHideDelay:",
          globalAutoHideDelay,
        );

        panelHideTimeout = setTimeout(() => {
          isHideTimerActive = false;
          // 放大弹窗打开期间，跳过隐藏逻辑
          if (overlayHost && overlayHost.classList.contains("vt-zoom-open"))
            return;

          if (ms === 0) {
            actionPanel.classList.remove("vt-panel-visible");
            actionPanel.classList.remove("vt-collapsed");
            if (speedPanel) speedPanel.classList.remove("vt-panel-visible");
            if (snapPanel) snapPanel.classList.remove("vt-panel-visible");
          } else {
            actionPanel.classList.add("vt-collapsed");
            if (speedPanel) speedPanel.classList.remove("vt-panel-visible");
            if (snapPanel) snapPanel.classList.remove("vt-panel-visible");
            setTimeout(() => {
              actionPanel.classList.remove("vt-panel-visible");
            }, 250);
          }
          requestAdjustOverlayPosition(video, markerBar, actionPanel);
          if (markerBar) markerBar.classList.remove("vt-bar-visible");
        }, ms);
      }

      // 默认呼出并开启首次自动隐藏
      showPanel();
      delayHidePanel();

      const onGlobalMarkerClick = async (e) => {
        const target = e.target;
        const markerEl = target.closest(".vt-marker-point");
        if (markerEl) {
          e.preventDefault();
          e.stopPropagation();
          const markerTime = parseFloat(markerEl.getAttribute("data-time"));
          const note =
            markerEl.getAttribute("data-note") ||
            markerEl.getAttribute("title") ||
            "标记点";

          const isScreenshot =
            markerEl.classList.contains("vt-marker-screenshot") ||
            (note && note.startsWith("📷")) ||
            !!markerEl.getAttribute("data-screenshot-id");

          if (!isNaN(markerTime) && video && video.isConnected) {
            window.VT_DANMAKU.clearAllDanmakus(video);
            seekToVideo(video, markerTime);
            showToast(`已跳转至标记：${note}`);

            // 仅在非截图（纯文本）标记跳转时发射网页弹幕，避免遮挡视频画面
            if (globalShowDanmakuOnJump && !isScreenshot) {
              if (window.VT_DANMAKU && typeof window.VT_DANMAKU.launchDanmaku === "function") {
                window.VT_DANMAKU.launchDanmaku(video, `📌 ${note}`);
              }
            }
          }
        }
      };

      document.addEventListener("click", onGlobalMarkerClick, {
        capture: true,
      });

      let lastMouseInside = null;
      let mouseMoveDebounce = null;
      let isHideTimerActive = false;

      const handleMouseStateChange = (isInside) => {
        if (!video || !video.isConnected) return;

        if (!actionPanel.isConnected) {
          showPanel();
          delayHidePanel();
          isHideTimerActive = true;
          return;
        }

        if (isInside) {
          const isVisible = actionPanel.classList.contains("vt-panel-visible");
          const isCollapsed = actionPanel.classList.contains("vt-collapsed");

          if (!isVisible || isCollapsed) {
            showPanel();
            delayHidePanel();
            isHideTimerActive = true;
          } else if (!isHideTimerActive) {
            delayHidePanel();
            isHideTimerActive = true;
          }
        } else {
          delayHidePanel(globalAutoHideDelay);
          isHideTimerActive = true;
        }
      };

      const onGlobalMouseMove = (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        let rect = video.getBoundingClientRect();

        const isFull = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );

        if (isFull && (rect.width === 0 || rect.height === 0)) {
          const fsElement =
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;
          if (fsElement) {
            rect = fsElement.getBoundingClientRect();
          } else {
            rect = {
              left: 0,
              right: window.innerWidth,
              top: 0,
              bottom: window.innerHeight,
              width: window.innerWidth,
              height: window.innerHeight,
            };
          }
        }

        const isInside =
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseX >= 0 &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom;

        if (isInside) {
          activeVideoForMouseMove = video;
          if (!globalHoverVideoExpand) {
            // 如果关闭了悬浮唤醒，仅在面板目前处于收折折叠状态时才唤醒显现，防止强行缩回用户已手动展开的面板
            if (actionPanel.classList.contains("vt-collapsed")) {
              showPanelCollapsed();
            }
          } else {
            showPanel();
          }
          delayHidePanel();
          isHideTimerActive = true;
        } else {
          if (isInside !== lastMouseInside) {
            lastMouseInside = isInside;
            handleMouseStateChange(isInside);
          }
        }
      };

      // 使用捕获模式（capture: true）防止被其他层级的 stopPropagation 阻断
      document.addEventListener("mousemove", onGlobalMouseMove, {
        capture: true,
        passive: true,
      });

      // 添加 pointermove 作为备用方案，某些平台可能拦截 mousemove 但不拦截 pointermove
      document.addEventListener("pointermove", onGlobalMouseMove, {
        capture: true,
        passive: true,
      });

      // 6. 【Hover 自动聚焦与防抖失焦交互】：根据用户设置决定是否鼠标移入立即 focus
      let hoverLeaveTimeout = null;
      let mouseEnterDebounce = null;

      // 统一为主输入、相机截图、倍速调节三组件绑定 hover 唤醒与维持显示逻辑
      [actionPanel, snapPanel, speedPanel].forEach((panel) => {
        if (!panel) return;
        panel.addEventListener("mouseenter", () => {
          if (!globalHoverVideoExpand) return;
          if (hoverLeaveTimeout) {
            clearTimeout(hoverLeaveTimeout);
            hoverLeaveTimeout = null;
          }
          if (mouseEnterDebounce) clearTimeout(mouseEnterDebounce);
          mouseEnterDebounce = setTimeout(() => {
            showPanel();
          }, 50);
        });
        panel.addEventListener("click", () => {
          showPanel();
        });
      });

      // 仅主输入面板控制输入框的自动聚焦与失焦防抖
      actionPanel.addEventListener("mouseenter", () => {
        if (globalHoverFocus) {
          inputEl.focus();
        }
      });

      actionPanel.addEventListener("mouseleave", () => {
        hoverLeaveTimeout = setTimeout(() => {
          inputEl.blur();
        }, 400); // 400ms 防抖，防止用户鼠标滑出面板边缘时瞬间失焦导致打字截断
      });

      videoMap.set(vtKey, {
        id: vtKey,
        vtUrlId: vtUrlId,
        video,
        markerBar,
        actionPanel,
        snapPanel,
        speedPanel,
        overlayHost,
        handleFullscreenChange,
        resizeObserver,
        firedMarkerIds,
        globalMouseMoveListener: onGlobalMouseMove,
        globalMarkerClickListener: onGlobalMarkerClick,
        cleanupDrags: () => {
          dragCleanups.forEach((cb) => {
            if (typeof cb === "function") cb();
          });
        },
        hasMovedNormal: false,
        leftNormal: 0,
        topNormal: 0,
        hasMovedFullscreen: false,
        leftFullscreen: 0,
        topFullscreen: 0,
      });
    }

    // 精准定位算法
    function requestAdjustOverlayPosition(video, markerBar, actionPanel) {
      if (adjustRafId) cancelAnimationFrame(adjustRafId);
      adjustRafId = requestAnimationFrame(() => {
        adjustOverlayPosition(video, markerBar, actionPanel);
        adjustRafId = null;
      });
    }

    function adjustOverlayPosition(video, markerBar, actionPanel) {
      let rect = video.getBoundingClientRect();

      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (isFull && (rect.width === 0 || rect.height === 0)) {
        const fsElement =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;
        if (fsElement) {
          rect = fsElement.getBoundingClientRect();
        } else {
          rect = {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        }
      }

      if (!isFull && (rect.width === 0 || rect.height === 0)) {
        const entry = videoMap.get(getOrGenerateDomId(video));
        const overlayHost = entry ? entry.overlayHost : markerBar.parentElement;
        if (overlayHost && overlayHost.classList.contains("vt-overlay-host")) {
          const hostRect = overlayHost.getBoundingClientRect();
          rect = {
            left: 0,
            right: hostRect.width,
            top: 0,
            bottom: hostRect.height,
            width: hostRect.width,
            height: hostRect.height,
          };
        }
      }

      const entry = videoMap.get(getOrGenerateDomId(video));
      const overlayHost = entry ? entry.overlayHost : markerBar.parentElement;
      let parentRect;
      if (overlayHost && overlayHost.classList.contains("vt-overlay-host")) {
        parentRect = overlayHost.getBoundingClientRect();
      } else {
        const mountContainer = getMountContainer(video);
        if (!mountContainer) return;
        parentRect = mountContainer.getBoundingClientRect();
      }

      const left = rect.left - parentRect.left;
      const width = rect.width;

      // 底部标记条定位 (贴在 video 底边，高 24px)
      const markerTop = rect.bottom - parentRect.top - 24;
      markerBar.style.left = `${left}px`;
      markerBar.style.top = `${markerTop}px`;
      markerBar.style.width = `${width}px`;

      const videoId = video.getAttribute("data-vt-id");
      const isCollapsed = actionPanel.classList.contains("vt-collapsed");
      const snapPanel = overlayHost
        ? overlayHost.querySelector(".vt-snap-panel")
        : null;
      const speedPanel = overlayHost
        ? overlayHost.querySelector(".vt-speed-panel")
        : null;

      let offsetAction = isFull
        ? (window.globalOffsetFullscreenAction || globalOffsetFullscreenAction)
        : (window.globalOffsetNormalAction || globalOffsetNormalAction);
      let actTop = 0;
      let actLeft = 0;
      if (offsetAction) {
        actTop = parentRect.height * offsetAction.topRatio;
        actLeft = parentRect.width * offsetAction.leftRatio;
      } else {
        actTop = parentRect.height - 120;
        actLeft = parentRect.width - (520 + 8 + 42 + 8 + 56) - 20;
      }
      actTop = Math.min(parentRect.height - 42, Math.max(0, actTop));
      if (isCollapsed) {
        actionPanel.style.left = `${parentRect.width - 32}px`;
      } else {
        actLeft = Math.min(parentRect.width - 520, Math.max(0, actLeft));
        actionPanel.style.left = `${actLeft}px`;
      }
      actionPanel.style.top = `${actTop}px`;

      // --- 2. Snap Panel (Screenshot) ---
      if (snapPanel) {
        if (isCollapsed) {
          snapPanel.style.left = `${parentRect.width}px`; // offscreen
        } else {
          let offsetSnap = isFull
            ? (window.globalOffsetFullscreenSnap || globalOffsetFullscreenSnap)
            : (window.globalOffsetNormalSnap || globalOffsetNormalSnap);
          let snapTop = 0;
          let snapLeft = 0;
          if (offsetSnap) {
            snapTop = parentRect.height * offsetSnap.topRatio;
            snapLeft = parentRect.width * offsetSnap.leftRatio;
          } else {
            // default position relative to video container: on the right, next to Speed Panel
            snapTop = parentRect.height - 120;
            snapLeft = parentRect.width - (42 + 8 + 56) - 20;
          }
          snapTop = Math.min(parentRect.height - 42, Math.max(0, snapTop));
          snapLeft = Math.min(parentRect.width - 42, Math.max(0, snapLeft));
          snapPanel.style.top = `${snapTop}px`;
          snapPanel.style.left = `${snapLeft}px`;
        }
      }

      // --- 3. Speed Panel ---
      if (speedPanel) {
        if (isCollapsed) {
          speedPanel.style.left = `${parentRect.width}px`; // offscreen
        } else {
          let offsetSpeed = isFull
          ? (window.globalOffsetFullscreenSpeed || globalOffsetFullscreenSpeed)
          : (window.globalOffsetNormalSpeed || globalOffsetNormalSpeed);
          let speedTop = 0;
          let speedLeft = 0;
          if (offsetSpeed) {
            speedTop = parentRect.height * offsetSpeed.topRatio;
            speedLeft = parentRect.width * offsetSpeed.leftRatio;
          } else {
            // default position relative to video container: on the far right
            speedTop = parentRect.height - 120;
            speedLeft = parentRect.width - 56 - 20;
          }
          speedTop = Math.min(parentRect.height - 42, Math.max(0, speedTop));
          speedLeft = Math.min(parentRect.width - 56, Math.max(0, speedLeft));
          speedPanel.style.top = `${speedTop}px`;
          speedPanel.style.left = `${speedLeft}px`;
        }
      }
    }

    const storageQueues = new Map();

    function getQueue(key) {
      if (!storageQueues.has(key)) {
        storageQueues.set(key, Promise.resolve());
      }
      return storageQueues.get(key);
    }

    function enqueue(key, fn) {
      const queue = getQueue(key);
      const newQueue = queue.then(fn).catch(() => {});
      storageQueues.set(key, newQueue);
      return newQueue;
    }

    function storageGet(key, defaultValue) {
      return new Promise((resolve) => {
        safeStorageGet({ [key]: defaultValue }, (result) => {
          resolve(result ? result[key] : defaultValue);
        });
      });
    }

    function storageSet(data) {
      return new Promise((resolve) => {
        safeStorageSet(data, resolve);
      });
    }

    function saveProgress(
      videoId,
      platform,
      url,
      title,
      currentTime,
      duration,
    ) {
      if (isAdOrTraceDomain()) return; // 过滤广告与追踪 iframe 记录，防止数据污染
      if (!duration || duration <= 0) return;
      const record = {
        id: videoId,
        platform,
        url,
        title,
        currentTime,
        duration,
        updatedAt: Date.now(),
      };

      enqueue("progressHistory", async () => {
        const history = await storageGet("progressHistory", []);

        // 找出同 URL 但不同 videoId 的旧记录（标题修正等原因导致 videoId 变化）
        const oldRecords = history.filter(
          (item) => item.url === url && item.id !== videoId,
        );
        const oldVideoIds = oldRecords.map((item) => item.id);

        // 删除同 URL 或同 videoId 的旧记录
        const filtered = history.filter(
          (item) => item.url !== url && item.id !== videoId,
        );
        filtered.unshift(record);
        if (filtered.length > 100) {
          filtered.pop();
        }
        await storageSet({ progressHistory: filtered });

        // 将旧 videoId 的标记点和截图迁移到新 videoId，防止数据孤儿
        if (oldVideoIds.length > 0) {
          const markers = await storageGet("markers", []);
          let markersChanged = false;
          for (const marker of markers) {
            if (oldVideoIds.includes(marker.videoId)) {
              marker.videoId = videoId;
              markersChanged = true;
            }
          }
          if (markersChanged) {
            await storageSet({ markers });
          }

          const screenshots = await storageGet("screenshots", []);
          let snapsChanged = false;
          for (const snap of screenshots) {
            if (oldVideoIds.includes(snap.videoId)) {
              snap.videoId = videoId;
              snapsChanged = true;
            }
          }
          if (snapsChanged) {
            await storageSet({ screenshots });
          }
          if (markersChanged || snapsChanged) {
            document.dispatchEvent(
              new CustomEvent("VT_MARKERS_MIGRATED", {
                detail: { videoId },
                bubbles: true,
              }),
            );
          }
        }
      });
    }

    function restoreProgress(video, videoId) {
      const urlParams = new URLSearchParams(location.search);
      const targetTime = urlParams.get("vt_t");
      if (targetTime) {
        seekToVideo(video, parseFloat(targetTime));
        showToast(`已跳转至标记时间：${formatTime(parseFloat(targetTime))}`);
        return;
      }

      safeStorageGet({ progressHistory: [] }, (result) => {
        if (!result) return;
        const history = result.progressHistory;
        let record = history.find((item) => item.id === videoId);

        if (!record) {
          const fallbackIds = generateFallbackVideoIds(videoId);
          record = history.find((item) => fallbackIds.includes(item.id));
        }

        if (!record) {
          record = history.find((item) => item.url === location.href);
        }

        if (
          record &&
          record.currentTime > 3 &&
          record.currentTime < record.duration - 5
        ) {
          if (video.currentTime < 2) {
            seekToVideo(video, record.currentTime);
            showToast(`已为你自动恢复播放进度至 ${formatTime(record.currentTime)}`);
          }
        }
      });
    }

    function loadMarkers(videoId, wrapper, video) {
      wrapper.innerHTML = "";
      safeStorageGet({ markers: [], progressHistory: [] }, (result) => {
        if (!result) return;

        const allMarkers = result.markers;
        let markers = allMarkers.filter((m) => m.videoId === videoId);

        if (markers.length === 0) {
          const fallbackIds = generateFallbackVideoIds(videoId);
          // URL 关联回退：通过同 URL 的历史记录找回旧 videoId 关联的标记点
          const currentUrl = location.href;
          const urlMatchingIds = (result.progressHistory || [])
            .filter((item) => item.url === currentUrl)
            .map((item) => item.id);
          const allFallbackIds = [...fallbackIds, ...urlMatchingIds];
          markers = allMarkers.filter((m) =>
            allFallbackIds.includes(m.videoId),
          );
        }

        markers.forEach((marker) => {
          const isScreenshot =
            marker.screenshotId ||
            marker.type === "screenshot" ||
            (marker.note && marker.note.startsWith("📷")) ||
            marker.color === "hsl(45, 95%, 55%)";
          
          if (isScreenshot && marker.screenshotId) {
            if (window.VT_STORAGE) {
              window.VT_STORAGE.loadScreenshotData(marker.screenshotId).then(url => {
                renderMarkerPoint(marker, wrapper, video, videoId, url);
              }).catch(() => {
                renderMarkerPoint(marker, wrapper, video, videoId);
              });
            } else {
              chrome.storage.local.get(`screenshot_${marker.screenshotId}`, (res) => {
                const screenshotData = res[`screenshot_${marker.screenshotId}`];
                if (screenshotData) {
                  renderMarkerPoint(marker, wrapper, video, videoId, screenshotData);
                } else {
                  renderMarkerPoint(marker, wrapper, video, videoId);
                }
              });
            }
          } else {
            renderMarkerPoint(marker, wrapper, video, videoId);
          }
        });
      });
    }

    // 更新所有默认颜色的标记点颜色
    function updateAllMarkerPointColors() {
      document.querySelectorAll(".vt-marker-point.vt-marker-text").forEach(point => {
        if (!point.getAttribute("data-custom-color")) {
          point.style.setProperty("background-color", globalMarkerColor, "important");
          point.style.setProperty(
            "box-shadow",
            `0 0 5px ${globalMarkerColor}, 0 0 1px ${globalMarkerColor}`,
            "important"
          );
        }
      });
    }

    // 渲染打点红点
    function renderMarkerPoint(marker, wrapper, video, videoId, screenshotUrl) {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration <= 0) return; // 时长无效时不渲染，防止定位飞出屏幕

      const percent = (marker.time / duration) * 100;

      const point = document.createElement("div");
      point.style.left = `${percent}%`;
      point.setAttribute("data-time", marker.time);
      point.setAttribute("data-note", marker.note);
      point.setAttribute("data-video-id", marker.videoId || videoId);

      if (marker.screenshotId) {
        point.setAttribute("data-screenshot-id", marker.screenshotId);
      }

      // 判断打点类型以绑定不同样式类（截图为方形圆角，文字为圆形）
      const isScreenshot =
        marker.screenshotId ||
        marker.type === "screenshot" ||
        (marker.note && marker.note.startsWith("📷")) ||
        marker.color === "hsl(45, 95%, 55%)";

      if (isScreenshot && screenshotUrl) {
        point.setAttribute("data-screenshot-url", screenshotUrl);
      }

      point.className = isScreenshot
        ? "vt-marker-point vt-marker-screenshot"
        : "vt-marker-point vt-marker-text";

      // 使用全局配置的标记点大小
      point.style.setProperty("width", `${globalMarkerSize}px`, "important");
      point.style.setProperty("height", `${globalMarkerSize}px`, "important");

      // 获取并写入打点的自定义彩虹色，并追加霓虹微光 box-shadow 外发光效果
      // 截图默认采用金黄色，文字笔记采用选择的颜色或全局配置颜色
      const hasCustomColor = !isScreenshot && marker.color;
      if (hasCustomColor) {
        point.setAttribute("data-custom-color", "true");
      }
      const pointColor = isScreenshot
        ? "hsl(45, 95%, 55%)"
        : marker.color || globalMarkerColor || "#6366f1";
      point.style.setProperty("background-color", pointColor, "important");
      point.style.setProperty(
        "box-shadow",
        `0 0 5px ${pointColor}, 0 0 1px ${pointColor}`,
        "important",
      );

      // 获取当前标记条下的气泡 Tooltip 节点
      const markerBar = wrapper.parentElement;
      const tooltip = markerBar
        ? markerBar.querySelector(".vt-marker-tooltip")
        : null;
      // 通过 DOM 层级向上查找 overlayHost（wrapper → markerBar → overlayHost）
      const overlayHost = markerBar?.parentElement?.classList.contains(
        "vt-overlay-host",
      )
        ? markerBar.parentElement
        : null;

      // 绑定悬浮事件显示预览
      point.addEventListener("mouseenter", () => {
        if (!tooltip) return;
        if (tooltip._hideTimeout) {
          clearTimeout(tooltip._hideTimeout);
          tooltip._hideTimeout = null;
        }

        // 设置 Tooltip 的定位和显示状态
        tooltip.style.left = `${percent}%`;
        tooltip.className = "vt-marker-tooltip vt-tooltip-visible";

        if (isScreenshot) {
          tooltip.classList.add("vt-tooltip-screenshot");
          tooltip.innerHTML = `<div class="vt-tooltip-caption">加载中...</div>`;
        }

        // 动态调整 Tooltip 左右偏移，防止最左边和最右边打点时卡片溢出播放器边界
        const repositionTooltip = () => {
          const tooltipWidth =
            tooltip.clientWidth || (isScreenshot ? 236 : 150);
          const containerWidth = markerBar.clientWidth || 800;
          const centerPx = (percent / 100) * containerWidth;

          let transformX = "translateX(-50%)";
          if (centerPx < tooltipWidth / 2) {
            // 距离左边界过近，向右平移，保留 8px 安全边距
            const shiftPx = tooltipWidth / 2 - centerPx + 8;
            transformX = `translateX(calc(-50% + ${shiftPx}px))`;
          } else if (containerWidth - centerPx < tooltipWidth / 2) {
            // 距离右边界过近，向左平移，保留 8px 安全边距
            const shiftPx = tooltipWidth / 2 - (containerWidth - centerPx) + 8;
            transformX = `translateX(calc(-50% - ${shiftPx}px))`;
          }
          tooltip.style.setProperty("transform", transformX, "important");
        };

        // 初始定位计算
        repositionTooltip();

        if (isScreenshot) {
          // 异步检索关联的截图 Base64 数据
          const lookupScreenshot = async () => {
            if (marker.screenshotId) {
              const dataUrl = await storageGet(
                `screenshot_${marker.screenshotId}`,
                null,
              );
              if (dataUrl) return dataUrl;
            }
            // 兜底：联合标记点 ID、当前视频 ID 以及对应的 URL 兜底 ID，防标题切换导致的 ID 迁移失效
            const screenshots = await storageGet("screenshots", []);
            const currentVideoId = marker.videoId || videoId;
            const fallbackIds = [
              marker.videoId,
              currentVideoId,
              ...generateFallbackVideoIds(marker.videoId),
              ...generateFallbackVideoIds(currentVideoId),
            ];
            const matchingSnap = screenshots.find(
              (snap) =>
                fallbackIds.includes(snap.videoId) &&
                Math.abs(snap.timestamp - marker.time) < 2.0,
            );
            if (matchingSnap) {
              return await storageGet(`screenshot_${matchingSnap.id}`, null);
            }
            return null;
          };

          lookupScreenshot().then((dataUrl) => {
            // 确保在数据返回时，鼠标仍然悬停在该点上
            if (!tooltip.classList.contains("vt-tooltip-visible")) return;

            if (dataUrl) {
              tooltip.innerHTML = `<img src="${dataUrl}" class="vt-tooltip-img" alt="截图预览">`;
              const img = tooltip.querySelector(".vt-tooltip-img");
              if (img) {
                img.addEventListener("click", async (e) => {
                  e.stopPropagation();
                  
                  // 1. 立即以单图模式展示模态框，保障 UI 响应即刻进行
                  if (window.VT_IMAGE_VIEWER && typeof window.VT_IMAGE_VIEWER.showImageViewer === "function") {
                    window.VT_IMAGE_VIEWER.showImageViewer(document.body, [dataUrl], 0);
                  }

                  // 2. 异步后台加载合集其他截图，更新模态框
                  const storageResult = await new Promise(resolve =>
                    safeStorageGet({ screenshots: [], progressHistory: [] }, resolve),
                  );
                  const allScreenshots = storageResult.screenshots || [];

                  // 使用 videoId 参数（当前 URL ID）作为主匹配 ID，
                  const markerVideoId = marker.videoId || videoId;
                  const allMatchIds = new Set([
                    videoId,
                    markerVideoId,
                    ...generateFallbackVideoIds(videoId),
                    ...generateFallbackVideoIds(markerVideoId),
                  ]);

                  // progressHistory URL 关联回退 — 与 loadMarkers 一致，
                  const currentUrl = location.href;
                  const urlMatchingIds = (storageResult.progressHistory || [])
                    .filter(item => item.url === currentUrl)
                    .map(item => item.id);
                  urlMatchingIds.forEach(id => allMatchIds.add(id));

                  let videoScreenshots = allScreenshots
                    .filter(snap => allMatchIds.has(snap.videoId))
                    .sort((a, b) => a.timestamp - b.timestamp);

                  // timestamp 邻近兜底 — 当 videoId 因迁移等原因不匹配时，用时间戳邻近匹配补充可能遗漏的截图（与 lookupScreenshot 逻辑一致）
                  if (videoScreenshots.length === 0 && marker.time !== undefined) {
                    const proximityFallbackIds = [
                      ...generateFallbackVideoIds(videoId),
                      ...generateFallbackVideoIds(markerVideoId),
                      ...urlMatchingIds,
                    ];
                    videoScreenshots = allScreenshots
                      .filter(snap =>
                        proximityFallbackIds.includes(snap.videoId) &&
                        Math.abs(snap.timestamp - marker.time) < 2.0,
                      )
                      .sort((a, b) => a.timestamp - b.timestamp);
                  }

                  const screenshotUrls = [];
                  const keys = videoScreenshots.map(snap => `screenshot_${snap.id}`);
                  if (keys.length > 0) {
                    const res = await new Promise(resolve => safeStorageGet(keys, resolve));
                    if (res) {
                      for (const snap of videoScreenshots) {
                        const url = res[`screenshot_${snap.id}`];
                        if (url) screenshotUrls.push(url);
                      }
                    }
                  }

                  // 条件从 > 1 改为 > 0，即使只找到 1 张也更新模态框，确保显示的图片和索引正确
                  if (screenshotUrls.length > 0 && window.VT_IMAGE_VIEWER && typeof window.VT_IMAGE_VIEWER.updateImages === "function") {
                    let startIndex = screenshotUrls.indexOf(dataUrl);
                    if (startIndex < 0 && marker.screenshotId) {
                      startIndex = videoScreenshots.findIndex(s => s.id === marker.screenshotId);
                    }
                    if (startIndex < 0) startIndex = 0;
                    window.VT_IMAGE_VIEWER.updateImages(screenshotUrls, startIndex);
                  }
                });
              }
            } else {
              tooltip.innerHTML = `[${formatTime(marker.time)}] ${window.VT_UTILS ? window.VT_UTILS.escapeHtml(marker.note) : marker.note}`;
            }

            // 重新计算并应用偏移量（解决图片加载后尺寸撑开导致的溢出）
            repositionTooltip();
          });
        } else {
          // 文字笔记打点
          tooltip.innerHTML = `[${formatTime(marker.time)}] ${window.VT_UTILS ? window.VT_UTILS.escapeHtml(marker.note) : marker.note}`;
          repositionTooltip();
        }
      });

      point.addEventListener("mouseleave", () => {
        if (tooltip) {
          tooltip._hideTimeout = setTimeout(() => {
            tooltip.classList.remove("vt-tooltip-visible");
          }, 300); // 给 300ms 滑动缓冲区
        }
      });

      wrapper.appendChild(point);
    }

    async function takeScreenshot(video, videoId) {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        showToast("⚠️ 视频分辨率尚未加载，无法截取，请稍后再试");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      try {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");

        const screenshotId =
          window.VT_UTILS?.generateId("ss-") ||
          "ss-" + Math.random().toString(36).substr(2, 9);
        const screenshotTime = video.currentTime;
        const metadata = {
          id: screenshotId,
          videoId,
          timestamp: screenshotTime,
          createdAt: Date.now(),
        };

        enqueue("screenshots", async () => {
          const screenshots = await storageGet("screenshots", []);
          screenshots.push(metadata);
          await storageSet({
            screenshots,
            [`screenshot_${screenshotId}`]: dataUrl,
          });
        }).then(() => {
          // 自动在当前播放时间点创建一个标记点，以便用户后续能一键闪回截图对应画面
          const marker = {
            id:
              window.VT_UTILS?.generateId("mk-") ||
              "mk-" + Math.random().toString(36).substr(2, 9),
            videoId,
            time: screenshotTime,
            note: `📷 截图锚点`,
            color: "hsl(45, 95%, 55%)", // 截图标记专属的高光金黄色
            screenshotId: screenshotId, // 直接绑定截图ID，方便高精度加载
            createdAt: Date.now(),
          };

          enqueue("markers", async () => {
            const markers = await storageGet("markers", []);
            markers.push(marker);
            await storageSet({ markers });
          }).then(() => {
            // 实时在底部进度条渲染出该小红点
            let activeEntry = null;
            for (const [key, entry] of videoMap.entries()) {
              if (entry.video === video) {
                activeEntry = entry;
                break;
              }
            }
            if (activeEntry && activeEntry.markerBar) {
              const wrapper = activeEntry.markerBar.querySelector(
                ".vt-marker-points-wrapper",
              );
              if (wrapper) {
                renderMarkerPoint(marker, wrapper, video, videoId, dataUrl);
              }
            }
            if (activeEntry && activeEntry.firedMarkerIds) {
              // 【关键去重】：立刻将此标记点 ID 添加至已消费弹幕集合，彻底阻断后续播放经过该帧时的二次弹幕
              activeEntry.firedMarkerIds.add(marker.id);
            }
            showToast("📷 截图成功！");
          });
        });
      } catch (e) {
        console.error("VidBuddy: Canvas 截图失败，可能受到跨域限制:", e);
        showToast("❌ 截图失败：视频源跨域安全限制");
      }
    }

    window.VT_TAKE_SCREENSHOT = takeScreenshot;

    // 6. 【平面就地扫描双保险】：对于常规网页的常规视频，直接在沙箱内定时平面扫描就地捕获，摆脱跨世界事件丢包时序问题
    function scanLocalVideos() {
      try {
        cleanupRemovedVideos();
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          if (!isMainVideo(video)) return;

          const domId = getOrGenerateDomId(video);
          const vtUrlId = generateVideoUniqueId(video);

          if (!videoMap.has(domId)) {
            setupVideoHelper(video, domId, vtUrlId);
          } else {
            // 如果已注册，但 URL 发生变化（SPA 切集），更新数据关联并重新加载打点
            const entry = videoMap.get(domId);
            if (entry && entry.vtUrlId !== vtUrlId) {
              entry.vtUrlId = vtUrlId;
              if (entry.firedMarkerIds) {
                entry.firedMarkerIds.clear();
              }
              if (entry.markerBar) {
                const pointsWrapper = entry.markerBar.querySelector(
                  ".vt-marker-points-wrapper",
                );
                if (pointsWrapper) {
                  loadMarkers(vtUrlId, pointsWrapper, video);
                }
              }
              restoreProgress(video, vtUrlId);
            }
          }
        });
      } catch (e) {
        // 容错
      }
    }

    // 监听迁移事件，重新加载标记点以确保 DOM 闭包使用最新 videoId
    document.addEventListener("VT_MARKERS_MIGRATED", (e) => {
      if (!e.detail || !e.detail.videoId) return;
      const migratedVideoId = e.detail.videoId;
      videoMap.forEach((entry) => {
        if (!entry.video || !entry.video.isConnected) return;
        const entryVideoId = entry.vtUrlId;
        // 检查迁移的 videoId 是否匹配当前条目（直接匹配或 fallback 匹配）
        if (
          entryVideoId === migratedVideoId ||
          generateFallbackVideoIds(entryVideoId).includes(migratedVideoId) ||
          generateFallbackVideoIds(migratedVideoId).includes(entryVideoId)
        ) {
          if (entry.markerBar) {
            const pointsWrapper = entry.markerBar.querySelector(
              ".vt-marker-points-wrapper",
            );
            if (pointsWrapper) {
              loadMarkers(entryVideoId, pointsWrapper, entry.video);
            }
          }
        }
      });
    });

    scanLocalVideos();
    const localScanInterval = setInterval(scanLocalVideos, 3000);

    window.addEventListener("beforeunload", () => {
      clearInterval(localScanInterval);
    });

    document.dispatchEvent(
      new CustomEvent("VT_BRIDGE_READY", { bubbles: true, composed: true }),
    );
  }
})();
