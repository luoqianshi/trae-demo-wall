/**
 * VidBuddy UI面板组件模块
 * 提供操作面板、截图面板、倍速面板的创建功能
 */
(function () {
  const VT_PANELS = {};

  /**
   * 创建操作面板（笔记输入+弹幕发送）
   * @returns {HTMLElement} 操作面板元素
   */
  VT_PANELS.createActionPanel = function () {
    const actionPanel = document.createElement("div");
    actionPanel.className = "vt-action-panel vt-drag-handle";
    actionPanel.style.setProperty("border-radius", `${window.globalPanelRadius}px`, "important");
    actionPanel.innerHTML = `
      <span class="vt-input-prefix">00:00</span>
      <div class="vt-input-container">
        <input type="text" class="vt-input-field" placeholder="📝 输入笔记内容..." autocomplete="off" />
        <div class="vt-color-selector">
          <span class="vt-color-dot red active" data-color="#ef4444" title="红色标记 (Alt+1)"></span>
          <span class="vt-color-dot yellow" data-color="#f59e0b" title="黄色标记 (Alt+2)"></span>
          <span class="vt-color-dot green" data-color="#10b981" title="绿色标记 (Alt+3)"></span>
          <span class="vt-color-dot purple" data-color="#a855f7" title="紫色标记 (Alt+4)"></span>
        </div>
        <button class="vt-input-send" title="发送弹幕">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;
    return actionPanel;
  };

  /**
   * 创建截图面板
   * @returns {HTMLElement} 截图面板元素
   */
  VT_PANELS.createSnapPanel = function () {
    const snapPanel = document.createElement("div");
    snapPanel.className = "vt-snap-panel";
    snapPanel.style.setProperty("border-radius", `${window.globalPanelRadius}px`, "important");
    snapPanel.setAttribute("title", "截取视频当前帧 (Alt + S)");
    snapPanel.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    `;
    return snapPanel;
  };

  /**
   * 创建倍速面板
   * @returns {HTMLElement} 倍速面板元素
   */
  VT_PANELS.createSpeedPanel = function () {
    const speedPanel = document.createElement("div");
    speedPanel.className = "vt-speed-panel";
    speedPanel.innerHTML = `
      <div class="vt-speed-current" style="border-radius: ${window.globalPanelRadius}px !important;">1.0x</div>
      <div class="vt-speed-menu">
        <div class="vt-speed-opt" data-rate="0.75">0.75x</div>
        <div class="vt-speed-opt" data-rate="1.0">1.0x</div>
        <div class="vt-speed-opt" data-rate="1.25">1.25x</div>
        <div class="vt-speed-opt" data-rate="1.5">1.5x</div>
        <div class="vt-speed-opt" data-rate="2.0">2.0x</div>
        <div class="vt-speed-opt" data-rate="3.0">3.0x</div>
        <div class="vt-speed-custom-row">
          <input type="text" class="vt-speed-custom-input" placeholder="自定义" title="回车确认" />
        </div>
      </div>
    `;
    return speedPanel;
  };

  if (typeof window !== "undefined") {
    window.VT_PANELS = VT_PANELS;
  }
})();