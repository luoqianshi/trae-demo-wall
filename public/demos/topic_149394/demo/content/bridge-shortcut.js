/**
 * VidBuddy 快捷键模块
 * 处理全局键盘快捷键，包括倍速控制、弹幕输入、截图等功能
 */
(function () {
  const VT_SHORTCUTS = {};

  /**
   * 安全检查扩展上下文是否有效
   * @returns {boolean} 上下文是否有效
   */
  const isContextValid = () => {
    return !!(chrome.runtime && chrome.runtime.id);
  };

  /**
   * 安全显示提示消息
   * @param {string} msg - 提示消息
   */
  const safeShowToast = (msg) => {
    const fn = window.VT_MODAL?.showToast;
    if (typeof fn === 'function') {
      fn(msg);
    } else {
      console.warn("VidBuddy: showToast not available");
    }
  };

  /**
   * 动态获取全局 videoMap 引用，避免时序问题
   * @returns {Map} 视频映射表
   */
  const getVideoMap = () => window.videoMap || new Map();

  /**
   * 设置视频映射表（保留方法签名，保证向后兼容性）
   * @param {Map} map - 视频映射表
   */
  VT_SHORTCUTS.setVideoMap = function (map) {
  };

  /**
   * 设置最后活跃视频的ID
   * @param {string} id - 视频ID
   */
  VT_SHORTCUTS.setLastActiveVideoId = function (id) {
    window.lastActiveVideoId = id;
  };

  /**
   * 获取当前活跃的视频实体，支持单页切集和多视频切换
   * @returns {Object|null} 活跃视频实体或null
   */
  VT_SHORTCUTS.getActiveVideo = function () {
    const videoMap = getVideoMap();
    const activeId = window.lastActiveVideoId;
    if (activeId && videoMap.has(activeId)) {
      return videoMap.get(activeId);
    }
    if (videoMap.size > 0) {
      const firstEntry = videoMap.values().next().value;
      return firstEntry;
    }
    return null;
  };

  /**
   * 调整视频播放倍速
   * @param {HTMLVideoElement} video - 视频元素
   * @param {number} diff - 倍速调整量（-1 降低，1 升高）
   */
  VT_SHORTCUTS.changePlaybackSpeed = function (video, diff) {
    let currentSpeed = video.playbackRate;
    let step = window.globalSpeedStep || 0.1;
    let newSpeed = currentSpeed + diff * step;
    newSpeed = Math.round(newSpeed * 100) / 100;
    newSpeed = Math.max(window.globalMinSpeed || 0.1, Math.min(window.globalMaxSpeed || 2.0, newSpeed));
    VT_SHORTCUTS.setVideoSpeed(newSpeed);
  };

  /**
   * 设置视频播放倍速
   * @param {number} newSpeed - 新的倍速值
   * @param {boolean} [isSilent=false] - 是否静默设置（不显示提示）
   */
  VT_SHORTCUTS.setVideoSpeed = function (newSpeed, isSilent = false) {
    window.dispatchEvent(
      new CustomEvent("VT_SET_SPEED", { detail: newSpeed }),
    );
    if (!isSilent) safeShowToast(`倍速已调整为：${newSpeed}x`);
    if (isContextValid()) {
      chrome.storage.local.set({ globalPlaybackSpeed: newSpeed });
    }
  };

  /**
   * 初始化快捷键监听
   * 快捷键处理流程：
   * 1. 检查全局快捷键开关是否启用
   * 2. 检测当前焦点是否在输入框内（避免干扰用户输入）
   * 3. 处理需要修饰键的组合快捷键（弹幕聚焦、快速截图）
   * 4. 处理单键快捷键（倍速控制）
   * 5. 处理键盘侧键快捷键
   */
  VT_SHORTCUTS.init = function () {
    document.addEventListener("keydown", function (e) {
      // 全局开关检查：用户可在设置中禁用所有快捷键
      if (!window.globalEnableShortcuts) return;

      // 输入框过滤：当焦点在输入框、文本域或可编辑区域时，禁用所有快捷键
      // 避免在用户输入时误触快捷键
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      // 组合快捷键集合：需要配合修饰键使用的功能键
      const comboKeys = new Set([window.globalDanmakuFocusKey, window.globalQuickScreenshotKey]);
      // 检测是否有任何修饰键被按下
      const isModifierPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

      /**
       * 检查修饰键是否匹配配置要求
       * 支持的修饰键：alt、ctrl、meta（Cmd/Win）、shift
       * 必须所有配置的修饰键都被按下才返回 true
       * @param {Array<string>} modifiers - 修饰键列表
       * @returns {boolean} 是否匹配
       */
      const checkModifiers = (modifiers) => {
        if (!modifiers || modifiers.length === 0) return false;
        return modifiers.every(mod => {
          switch(mod) {
            case 'alt': return e.altKey;
            case 'ctrl': return e.ctrlKey;
            case 'meta': return e.metaKey;
            case 'shift': return e.shiftKey;
            default: return false;
          }
        });
      };

      // 弹幕输入框聚焦快捷键：修饰键 + 功能键组合
      // 聚焦到当前活跃视频的笔记输入框，方便快速输入弹幕
      if (checkModifiers(window.globalDanmakuFocusModifiers) && e.code === window.globalDanmakuFocusKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) {
          const input = active.actionPanel.querySelector(".vt-input-field");
          if (input) input.focus();
        } else {
          safeShowToast("⚠️ 未检测到可操作的视频");
        }
      }

      // 快速截图快捷键：修饰键 + 功能键组合
      // 截取当前活跃视频的画面帧
      if (checkModifiers(window.globalQuickScreenshotModifiers) && e.code === window.globalQuickScreenshotKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active && typeof window.VT_TAKE_SCREENSHOT === "function") {
          window.VT_TAKE_SCREENSHOT(active.video, active.vtUrlId);
        } else {
          safeShowToast("⚠️ 未检测到可操作的视频");
        }
      }

      // 修饰键冲突保护：如果按下了修饰键且按下的是组合快捷键集合中的键，
      // 则不继续处理单键快捷键，避免组合键和单键重复触发
      if (isModifierPressed && comboKeys.has(e.code)) {
        return;
      }

      // 倍速降低快捷键（自定义）
      if (window.globalSpeedShortcut && e.code === window.globalSpeedDecreaseKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.changePlaybackSpeed(active.video, -1);
      }

      // 倍速升高快捷键（自定义）
      if (window.globalSpeedShortcut && e.code === window.globalSpeedIncreaseKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.changePlaybackSpeed(active.video, 1);
      }

      // 倍速重置快捷键（自定义）
      if (window.globalSpeedShortcut && e.code === window.globalSpeedResetKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.setVideoSpeed(1.0);
      }

      // 倍速降低快捷键（键盘侧键）
      if (window.globalSpeedShortcut && e.code === window.globalKeyboardSpeedDecreaseKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.changePlaybackSpeed(active.video, -1);
      }

      // 倍速升高快捷键（键盘侧键）
      if (window.globalSpeedShortcut && e.code === window.globalKeyboardSpeedIncreaseKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.changePlaybackSpeed(active.video, 1);
      }

      // 倍速重置快捷键（键盘侧键）
      if (window.globalSpeedShortcut && e.code === window.globalKeyboardSpeedResetKey) {
        e.preventDefault();
        const active = VT_SHORTCUTS.getActiveVideo();
        if (active) VT_SHORTCUTS.setVideoSpeed(1.0);
      }
    });
  };

  if (typeof window !== "undefined") {
    window.VT_SHORTCUTS = VT_SHORTCUTS;
  }
})();