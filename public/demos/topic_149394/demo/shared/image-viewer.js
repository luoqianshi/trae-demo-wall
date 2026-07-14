/**
 * VidBuddy 图片查看器模块
 * 提供截图预览、缩放、切换等功能的全屏图片查看器
 */
const VT_IMAGE_VIEWER = {};

let currentModal = null;
let currentImages = [];
let currentImgIndex = 0;

// 模块级闭包引用，指向 showImageViewer 内部定义的函数。
// 用于让模块级的 updateImages 能够触发导航按钮刷新，
// 以及让新的 showImageViewer 调用能够清理上一个模态框的事件监听器。
let _updateNavButtons = null;
let _cleanupModal = null;
let _resetTransform = null;

/**
 * 更新图片列表（用于异步加载场景）
 * @param {Array<string>} imgList - 图片URL列表
 * @param {number} [startIndex=0] - 起始索引
 */
VT_IMAGE_VIEWER.updateImages = function(imgList, startIndex = 0) {
  if (!currentModal || !imgList) return;
  
  currentImages = Array.isArray(imgList) ? imgList : [imgList];
  currentImgIndex = currentImages.length > 0 ? Math.max(0, Math.min(startIndex, currentImages.length - 1)) : 0;
  
  const modalImg = currentModal.querySelector(".vt-zoom-image");
  const loading = currentModal.querySelector(".vt-zoom-loading");
  const counter = currentModal.querySelector(".vt-zoom-counter");
  
  if (currentImages.length > 0) {
    if (loading) {
      loading.textContent = "加载中...";
      loading.style.display = "flex";
    }
    if (modalImg) {
      modalImg.style.display = "none";
      modalImg.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
      modalImg.src = currentImages[currentImgIndex];
    }
    if (counter) counter.textContent = `${currentImgIndex + 1} / ${currentImages.length}`;
  } else {
    if (modalImg) {
      modalImg.style.display = "none";
    }
    if (loading) {
      loading.textContent = "暂无截图数据";
      loading.style.display = "flex";
    }
    if (counter) counter.textContent = "0 / 0";
  }

  // 刷新翻页按钮可见性 — 修复：updateImages 原先不调用此方法，
  // 导致异步从 1 张图更新到多张图后按钮仍隐藏
  if (_updateNavButtons) _updateNavButtons();

  // 重置缩放/平移状态 — 修复：updateImages 原先只重置 DOM transform，
  // 但闭包变量 scale/pointX/pointY 未重置，导致切换后首次滚轮/拖拽会跳到旧值
  if (_resetTransform) _resetTransform();
};

/**
 * 显示图片查看器
 * 功能特性：
 * - 全屏模态框展示截图
 * - 支持鼠标拖动平移、滚轮缩放、双击复位
 * - 支持键盘导航（左右箭头/A/D切换，ESC/Q关闭）
 * - 自动暂停页面视频，关闭时恢复
 * - 自动跟随全屏状态切换容器
 * - 图片加载失败自动重试（最多2次）
 * @param {HTMLElement} _ - 挂载目标（保留参数，向后兼容）
 * @param {Array<string>|null} imgList - 图片URL列表，null表示异步加载
 * @param {number} [startIndex=0] - 起始索引
 */
VT_IMAGE_VIEWER.showImageViewer = function (_, imgList, startIndex = 0) {
  const existingModal = document.getElementById("image-viewer-modal");
  if (existingModal) {
    // 先清理旧模态框的事件监听器，防止 stale handler 残留
    if (_cleanupModal) _cleanupModal();
    existingModal.remove();
  }

  const isAsyncLoading = imgList === null;
  currentImages = !isAsyncLoading && imgList && imgList.length > 0 ? (Array.isArray(imgList) ? imgList : [imgList]) : [];
  currentImgIndex = currentImages.length > 0 ? Math.max(0, Math.min(startIndex, currentImages.length - 1)) : 0;
  
  let scale = 1;
  let pointX = 0;
  let pointY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  let videoElements = [];
  let pausedVideos = [];

  /**
   * 暂停所有视频播放
   */
  const pauseAllVideos = () => {
    videoElements = Array.from(document.querySelectorAll("video"));
    pausedVideos = [];
    videoElements.forEach(video => {
      if (!video.paused) {
        pausedVideos.push(video);
        video.pause();
      }
    });
  };

  /**
   * 恢复之前暂停的视频播放
   */
  const resumePausedVideos = () => {
    pausedVideos.forEach(video => {
      if (video && !video.paused) return;
      try {
        video.play().catch(() => {});
      } catch (e) {}
    });
  };

  const modal = document.createElement("div");
  modal.className = "vt-zoom-modal";
  modal.id = "image-viewer-modal";
  modal.innerHTML = `
    <button class="vt-zoom-close" title="关闭 (Esc)">&times;</button>
    <button class="vt-zoom-prev" title="上一张 (←)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <button class="vt-zoom-next" title="下一张 (→)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
    <div class="vt-zoom-content">
      <div class="vt-zoom-loading">${isAsyncLoading || currentImages.length > 0 ? '加载中...' : '暂无截图数据'}</div>
      <img class="vt-zoom-image" src="${currentImages.length > 0 ? currentImages[currentImgIndex] : ''}" alt="放大截图" style="${currentImages.length > 0 ? 'display:none;' : 'display:none;'}" />
      <div class="vt-zoom-tip">💡 鼠标拖动平移 | 滚轮缩放 | 左右/A/D切换 | 双击复位 | ESC/Q关闭</div>
      <div class="vt-zoom-counter">${currentImages.length > 0 ? currentImgIndex + 1 : 0} / ${currentImages.length}</div>
    </div>
  `;

  const modalImg = modal.querySelector(".vt-zoom-image");
  const btnPrev = modal.querySelector(".vt-zoom-prev");
  const btnNext = modal.querySelector(".vt-zoom-next");
  const counter = modal.querySelector(".vt-zoom-counter");
  const btnClose = modal.querySelector(".vt-zoom-close");
  const tip = modal.querySelector(".vt-zoom-tip");
  const loading = modal.querySelector(".vt-zoom-loading");
  let hideTimeout = null;

  let retryCount = 0;
  const maxRetries = 2;

  /**
   * 图片加载成功回调
   */
  modalImg.onload = () => {
    retryCount = 0;
    if (loading) loading.style.display = "none";
    modalImg.style.display = "block";
  };

  /**
   * 图片加载失败回调（带重试机制）
   */
  modalImg.onerror = () => {
    const currentSrc = modalImg.src;
    if (!currentSrc || currentSrc === window.location.href || currentSrc.endsWith("/undefined") || currentSrc.endsWith("/null")) {
      return;
    }

    retryCount++;
    if (retryCount <= maxRetries) {
      setTimeout(() => {
        modalImg.src = currentImages[currentImgIndex];
      }, 500);
    } else {
      retryCount = 0;
      if (loading) {
        loading.textContent = "图片加载失败，点击重试";
        loading.style.display = "flex";
      }
      modalImg.style.display = "none";
    }
  };

  /**
   * 更新导航按钮显示状态
   */
  const updateNavButtons = () => {
    if (currentImages.length <= 1) {
      btnPrev.style.display = "none";
      btnNext.style.display = "none";
    } else {
      btnPrev.style.display = "flex";
      btnNext.style.display = "flex";
    }
  };

  /**
   * 更新图片计数器
   */
  const updateCounter = () => {
    if (counter) {
      counter.textContent = `${currentImgIndex + 1} / ${currentImages.length}`;
    }
  };

  /**
   * 显示UI元素
   */
  const showUI = () => {
    if (btnPrev) btnPrev.style.opacity = "1";
    if (btnNext) btnNext.style.opacity = "1";
    if (btnClose) btnClose.style.opacity = "1";
    if (tip) tip.style.opacity = "1";
    if (counter) counter.style.opacity = "1";
  };

  /**
   * 隐藏UI元素
   */
  const hideUI = () => {
    if (btnPrev) btnPrev.style.opacity = "0";
    if (btnNext) btnNext.style.opacity = "0";
    if (btnClose) btnClose.style.opacity = "0";
    if (tip) tip.style.opacity = "0";
    if (counter) counter.style.opacity = "0";
  };

  /**
   * 重置UI自动隐藏计时器
   */
  const resetHideTimer = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    showUI();
    hideTimeout = setTimeout(hideUI, 3000);
  };

  let fullscreenCloseKey = "q";
  chrome.storage.local.get({ prefFullscreenCloseKey: "q" }, (result) => {
    fullscreenCloseKey = result.prefFullscreenCloseKey || "q";
  });

  /**
   * 更新图片变换（位置和缩放）
   */
  const updateImgTransform = () => {
    modalImg.style.transform = `translate3d(${pointX}px, ${pointY}px, 0px) scale(${scale})`;
  };

  /**
   * 切换到上一张图片
   */
  const switchToPrev = () => {
    if (currentImages.length <= 1) return;
    currentImgIndex = (currentImgIndex - 1 + currentImages.length) % currentImages.length;
    modalImg.src = currentImages[currentImgIndex];
    scale = 1;
    pointX = 0;
    pointY = 0;
    updateImgTransform();
    updateCounter();
  };

  /**
   * 切换到下一张图片
   */
  const switchToNext = () => {
    if (currentImages.length <= 1) return;
    currentImgIndex = (currentImgIndex + 1) % currentImages.length;
    modalImg.src = currentImages[currentImgIndex];
    scale = 1;
    pointX = 0;
    pointY = 0;
    updateImgTransform();
    updateCounter();
  };

  /**
   * 检查是否处于全屏状态
   * @returns {boolean} 是否全屏
   */
  const isFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  /**
   * 获取全屏元素
   * @returns {HTMLElement|null} 全屏元素或null
   */
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  /**
   * 键盘事件处理
   * 快捷键映射：
   * - ESC / Q：关闭查看器
   * - ← / A：上一张图片
   * - → / D：下一张图片
   * 注意：在全屏状态下，需要阻止默认行为并阻止事件冒泡，防止快捷键被页面捕获
   * @param {KeyboardEvent} e - 键盘事件
   */
  const handleKeydown = (e) => {
    const isFull = isFullscreen();
    const targetKey = isFull ? fullscreenCloseKey : "Escape";

    // 阻止这些快捷键的默认行为，防止页面拦截
    const blockedKeys = [
      "Escape", "escape",
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      " ", "Spacebar",
      "a", "A", "d", "D", "q", "Q"
    ];

    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    // 关闭查看器：全屏时使用配置的关闭键，非全屏时使用 ESC，Q 始终可用
    if (e.key === targetKey || e.key === "Escape" || e.key === "q" || e.key === "Q") {
      closeModal();
    } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      switchToPrev();
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      switchToNext();
    }
  };

  /**
   * 鼠标移动事件处理（平移）
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    pointX = e.clientX - startX;
    pointY = e.clientY - startY;
    updateImgTransform();
  };

  /**
   * 鼠标释放事件处理
   */
  const handleMouseUp = () => {
    isPanning = false;
  };

  /**
   * 滚轮事件处理（缩放）
   * @param {WheelEvent} e - 滚轮事件
   */
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.12;
    const delta = e.deltaY < 0 ? 1 : -1;
    const nextScale = scale + delta * zoomIntensity * scale;
    scale = Math.min(6.0, Math.max(0.5, nextScale));
    updateImgTransform();
  };

  /**
   * 关闭模态框
   */
  const closeModal = () => {
    modal.classList.remove("show");
    modal.classList.remove("active");
    resumePausedVideos();
    currentModal = null;
    _updateNavButtons = null;
    _cleanupModal = null;
    _resetTransform = null;
    setTimeout(() => {
      modal.remove();
    }, 250);
    window.removeEventListener("keydown", handleKeydown, true);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    modal.removeEventListener("wheel", handleWheel, { passive: false });
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    if (hideTimeout) clearTimeout(hideTimeout);
    document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    document.removeEventListener("msfullscreenchange", handleFullscreenChange);
  };

  /**
   * 全屏变化事件处理
   * 当用户进入/退出全屏时，将模态框移动到正确的容器中
   * 这是因为全屏元素会创建独立的渲染上下文，模态框必须在该上下文内才能可见
   */
  const handleFullscreenChange = () => {
    const fsElement = getFullscreenElement();
    if (fsElement) {
      // 进入全屏：将模态框移动到全屏元素内部
      if (modal.parentElement !== fsElement) {
        modal.remove();
        fsElement.appendChild(modal);
      }
    } else {
      // 退出全屏：将模态框移回 body
      if (modal.parentElement !== document.body) {
        modal.remove();
        document.body.appendChild(modal);
      }
    }
  };

  modalImg.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isPanning = true;
    startX = e.clientX - pointX;
    startY = e.clientY - pointY;
  });

  modalImg.addEventListener("dblclick", () => {
    scale = 1;
    pointX = 0;
    pointY = 0;
    updateImgTransform();
  });

  modal.addEventListener("mousemove", resetHideTimer);

  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("vt-zoom-close")) {
      closeModal();
    } else if (e.target === modal || e.target.classList.contains("vt-zoom-content")) {
      closeModal();
    } else if (e.target.classList.contains("vt-zoom-loading") && loading.textContent.includes("点击重试")) {
      retryCount = 0;
      loading.textContent = "加载中...";
      if (currentImages.length > 0 && modalImg) {
        modalImg.src = currentImages[currentImgIndex];
      }
    }
  });

  if (btnPrev) {
    btnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      switchToPrev();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      switchToNext();
    });
  }

  modal.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("msfullscreenchange", handleFullscreenChange);

  // 将闭包函数存储到模块级引用，供 updateImages 和下次 showImageViewer 调用使用
  _updateNavButtons = updateNavButtons;
  _cleanupModal = closeModal;
  _resetTransform = () => { scale = 1; pointX = 0; pointY = 0; };

  updateNavButtons();

  pauseAllVideos();

  currentModal = modal;

  try {
    const mountTarget = getFullscreenElement() || document.body;
    mountTarget.appendChild(modal);
  } catch (e) {
    console.error("VidBuddy ImageViewer: Failed to append modal to target, trying fallback", e);
    try {
      const fallbackContainer = document.createElement("div");
      fallbackContainer.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999999998; pointer-events: none;";
      document.documentElement.appendChild(fallbackContainer);
      fallbackContainer.appendChild(modal);
    } catch (e2) {
      console.error("VidBuddy ImageViewer: All mount attempts failed", e2);
      return;
    }
  }

  requestAnimationFrame(() => {
    modal.classList.add("show");
    resetHideTimer();
  });
};

if (typeof window !== "undefined") {
  window.VT_IMAGE_VIEWER = VT_IMAGE_VIEWER;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = VT_IMAGE_VIEWER;
}

if (typeof exports !== "undefined") {
  Object.keys(VT_IMAGE_VIEWER).forEach(key => {
    exports[key] = VT_IMAGE_VIEWER[key];
  });
}

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showScreenshotZoom" || message.type === "OPEN_IMAGE_VIEWER") {
      const { imgList, startIndex } = message;
      if (typeof VT_IMAGE_VIEWER.showImageViewer === "function") {
        VT_IMAGE_VIEWER.showImageViewer(document.body, imgList || null, startIndex || 0);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "VT_IMAGE_VIEWER showImageViewer not available" });
      }
    } else if (message.type === "OPEN_IMAGE_VIEWER_BY_IDS") {
      const { snapIds, startIndex } = message;
      if (!snapIds || snapIds.length === 0) {
        sendResponse({ success: false, error: "No snap IDs provided" });
        return;
      }
      
      if (typeof VT_IMAGE_VIEWER.showImageViewer === "function") {
        // 先用加载状态展示模态框，保证 UI 响应即刻进行
        VT_IMAGE_VIEWER.showImageViewer(document.body, null, 0);
        
        // 合并成一次 chrome.storage.local.get 批量读取，大幅提升性能
        const keys = snapIds.map(snapId => `screenshot_${snapId}`);
        chrome.storage.local.get(keys, (res) => {
          if (chrome.runtime.lastError) {
            console.error("VidBuddy: Failed to load screenshots from storage:", chrome.runtime.lastError);
            if (typeof VT_IMAGE_VIEWER.updateImages === "function") {
              VT_IMAGE_VIEWER.updateImages([], 0);
            }
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }

          const screenshotUrls = [];
          for (const snapId of snapIds) {
            const imageData = res[`screenshot_${snapId}`];
            if (imageData) {
              screenshotUrls.push(imageData);
            }
          }

          if (screenshotUrls.length > 0 && typeof VT_IMAGE_VIEWER.updateImages === "function") {
            VT_IMAGE_VIEWER.updateImages(screenshotUrls, Math.max(0, startIndex));
            sendResponse({ success: true, count: screenshotUrls.length });
          } else {
            // 如果未成功读取到数据，重置列表为空
            if (typeof VT_IMAGE_VIEWER.updateImages === "function") {
              VT_IMAGE_VIEWER.updateImages([], 0);
            }
            sendResponse({ success: false, error: "No matching screenshots found" });
          }
        });
        
        // 关键点：返回 true 声明这是一个异步消息通道，防止 popup.js 立即执行 window.close() 导致连接中断
        return true;
      } else {
        sendResponse({ success: false, error: "VT_IMAGE_VIEWER showImageViewer not available" });
      }
    }
  });
}
