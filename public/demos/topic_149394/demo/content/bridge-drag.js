/**
 * VidBuddy 拖拽模块
 * 提供面板拖拽功能，并自动保存位置偏好
 */
(function () {
  const VT_DRAG = {};

  /**
   * 使元素可拖拽
   * 拖拽机制说明：
   * - 支持拖拽状态和点击状态区分（4px阈值）
   * - 位置以比率形式存储，确保在不同屏幕尺寸和全屏/非全屏切换时保持相对位置
   * - 分别存储全屏和非全屏状态下的位置偏好
   * @param {HTMLElement} el - 要拖拽的元素
   * @param {string} keyPrefix - 位置存储键名前缀（Action/Snap/Speed）
   * @param {Function} [onClick] - 点击回调函数（非拖拽时触发）
   * @returns {Function} 清理事件监听器的函数
   */
  VT_DRAG.makeDraggable = function (el, keyPrefix, onClick) {
    // 拖拽状态变量
    let isDragging = false;      // 是否正在拖拽中
    let hasMoved = false;        // 是否产生了有效移动（用于区分点击和拖拽）
    let left = 0;                // 元素当前左偏移（像素）
    let top = 0;                 // 元素当前上偏移（像素）
    let startX = 0;              // 拖拽开始时的鼠标X位置
    let startY = 0;              // 拖拽开始时的鼠标Y位置

    // 拖拽容器：优先查找视频覆盖层容器，否则使用body
    const overlayHost = el.closest(".vt-overlay-host") || document.body;

    /**
     * 鼠标按下事件处理
     * @param {MouseEvent} e - 鼠标事件
     */
    const onMouseDown = (e) => {
      const insideBtn = e.target.closest("button");
      const insideInput = e.target.closest("input");
      if (
        (insideBtn && el.contains(insideBtn)) ||
        (insideInput && el.contains(insideInput)) ||
        e.target.closest(".vt-toast") ||
        e.target.closest(".vt-color-dot") ||
        e.target.closest(".vt-input-prefix")
      ) {
        return;
      }

      if (
        el.classList.contains("vt-speed-panel") &&
        !e.target.closest(".vt-speed-current")
      ) {
        return;
      }

      e.preventDefault();
      isDragging = true;
      hasMoved = false;
      el.classList.add("vt-dragging");

      const parentRect = overlayHost.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      left = elRect.left - parentRect.left;
      top = elRect.top - parentRect.top;

      startX = e.clientX - left;
      startY = e.clientY - top;
    };

    /**
     * 鼠标移动事件处理
     * @param {MouseEvent} e - 鼠标事件
     */
    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.stopPropagation();

      const parentRect = overlayHost.getBoundingClientRect();
      // 计算新位置：鼠标当前位置减去拖拽起始偏移
      let newLeft = e.clientX - startX;
      let newTop = e.clientY - startY;

      // 拖拽vs点击区分阈值：移动距离超过4px才视为拖拽
      // 小于4px的移动视为误触，释放鼠标时会触发点击回调
      const distance = Math.sqrt(
        Math.pow(newLeft - left, 2) + Math.pow(newTop - top, 2),
      );
      if (distance > 4) {
        hasMoved = true;
      }

      // 边界约束：确保元素不会被拖出容器外
      const elWidth = el.offsetWidth;
      const elHeight = el.offsetHeight;
      newLeft = Math.min(parentRect.width - elWidth, Math.max(0, newLeft));
      newTop = Math.min(parentRect.height - elHeight, Math.max(0, newTop));

      // 更新元素位置
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;

      // 计算位置比率（0-1），用于保存到存储中
      // 使用比率而非像素值，确保在不同屏幕尺寸下保持相对位置
      const leftRatio = newLeft / parentRect.width;
      const topRatio = newTop / parentRect.height;

      /**
       * 检查是否处于全屏状态
       * @returns {boolean} 是否全屏
       */
      const isFullscreen = () => {
        if (typeof window.isFullscreen === "function") {
          return window.isFullscreen();
        }
        return !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
      };

      /**
       * 检查扩展上下文是否有效
       * @returns {boolean} 上下文是否有效
       */
      const isContextValid = () => {
        return !!(chrome && chrome.runtime && chrome.runtime.id);
      };

      /**
       * 安全存储设置
       * @param {Object} data - 要存储的数据
       */
      const safeStorageSet = (data) => {
        if (isContextValid() && chrome.storage) {
          chrome.storage.local.set(data);
        }
      };

      // 根据面板类型和全屏状态保存位置
      if (isFullscreen()) {
        if (keyPrefix === "Action") {
          window.globalOffsetFullscreenAction = { leftRatio, topRatio };
          safeStorageSet({
            prefOffsetFullscreenAction: window.globalOffsetFullscreenAction,
          });
        } else if (keyPrefix === "Snap") {
          window.globalOffsetFullscreenSnap = { leftRatio, topRatio };
          safeStorageSet({
            prefOffsetFullscreenSnap: window.globalOffsetFullscreenSnap,
          });
        } else if (keyPrefix === "Speed") {
          window.globalOffsetFullscreenSpeed = { leftRatio, topRatio };
          safeStorageSet({
            prefOffsetFullscreenSpeed: window.globalOffsetFullscreenSpeed,
          });
        }
      } else {
        if (keyPrefix === "Action") {
          window.globalOffsetNormalAction = { leftRatio, topRatio };
          safeStorageSet({
            prefOffsetNormalAction: window.globalOffsetNormalAction,
          });
        } else if (keyPrefix === "Snap") {
          window.globalOffsetNormalSnap = { leftRatio, topRatio };
          safeStorageSet({ prefOffsetNormalSnap: window.globalOffsetNormalSnap });
        } else if (keyPrefix === "Speed") {
          window.globalOffsetNormalSpeed = { leftRatio, topRatio };
          safeStorageSet({
            prefOffsetNormalSpeed: window.globalOffsetNormalSpeed,
          });
        }
      }
    };

    /**
     * 鼠标释放事件处理
     * @param {MouseEvent} e - 鼠标事件
     */
    const onMouseUp = (e) => {
      if (isDragging) {
        isDragging = false;
        el.classList.remove("vt-dragging");
        if (!hasMoved && onClick) {
          onClick(e);
        }
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("mouseup", onMouseUp, true);
    };
  };

  if (typeof window !== "undefined") {
    window.VT_DRAG = VT_DRAG;
  }
})();