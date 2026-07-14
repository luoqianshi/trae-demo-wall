/**
 * VidBuddy 模态框组件模块
 * 提供 Toast 提示和确认对话框功能
 * 核心特性：
 * - Toast 和确认对话框会自动跟随全屏状态切换挂载目标
 * - Toast 容器采用懒加载策略，仅在首次调用时创建
 * - Toast 支持自动消失，带渐入渐出动画
 * - 确认对话框返回 Promise，支持异步处理
 */
const VT_MODAL = {};

let toastContainer = null;  // Toast 容器实例，全局复用
let confirmModal = null;     // 确认对话框实例，全局复用

/**
 * 获取全屏元素
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

/**
 * 获取视频的挂载容器（向上查找最多5层）
 * @param {HTMLElement} video - 视频元素
 * @returns {HTMLElement|null} 挂载容器或null
 */
function getMountContainer(video) {
  if (!video) return null;
  let parent = video.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    const style = window.getComputedStyle(parent);
    if (style.position === "relative" || style.position === "absolute" || 
        style.position === "fixed" || parent.tagName === "BODY") {
      return parent;
    }
    parent = parent.parentElement;
    depth++;
  }
  return null;
}

/**
 * 获取当前活跃的视频元素
 * @returns {HTMLVideoElement|null} 活跃视频元素或null
 */
function getActiveVideo() {
  const videos = document.querySelectorAll("video");
  for (const v of videos) {
    if (!v.paused || v.currentTime > 0) return v;
  }
  return videos[0] || null;
}

/**
 * 获取Toast的挂载目标（优先全屏元素，否则body）
 * @returns {HTMLElement} 挂载目标元素
 */
function getToastMountTarget() {
  const fullscreenEl = getFullscreenElement();
  if (fullscreenEl) {
    return fullscreenEl;
  }
  return document.body;
}

/**
 * 确保Toast容器存在
 * 容器生命周期管理：
 * 1. 在目标容器中查找已存在的容器，找到则复用
 * 2. 检查全局容器实例是否已挂载到目标容器，是则直接返回
 * 3. 如果全局容器挂载在其他容器，先移除再重新创建
 * 4. 创建新容器并设置样式，挂载到目标容器
 * @param {HTMLElement} [mountTarget=document.body] - 挂载目标
 * @returns {HTMLElement} Toast容器
 */
function ensureToastContainer(mountTarget = document.body) {
  // 优先级1：在目标容器内查找已存在的Toast容器
  const existing = mountTarget.querySelector(".vt-toast-container");
  if (existing) {
    toastContainer = existing;
    return toastContainer;
  }
  
  // 优先级2：检查全局容器是否已挂载到当前目标
  if (toastContainer && toastContainer.parentNode === mountTarget) {
    return toastContainer;
  }
  
  // 优先级3：全局容器挂载在其他地方，需要移除并重新创建
  // 这种情况发生在全屏切换时，Toast需要从body移动到全屏元素
  if (toastContainer && toastContainer.parentNode !== mountTarget) {
    toastContainer.remove();
    toastContainer = null;
  }
  
  // 创建新容器
  toastContainer = document.createElement("div");
  toastContainer.className = "vt-toast-container";
  
  // 根据挂载目标决定定位方式：body使用fixed定位，其他使用absolute定位
  // 这样可以确保在全屏视频内部显示时，Toast相对于视频区域定位
  const isBodyMount = mountTarget === document.body;
  toastContainer.style.cssText = `
    position: ${isBodyMount ? "fixed" : "absolute"};
    bottom: 40px;
    right: 40px;
    z-index: 999999;
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    pointer-events: none;
  `;
  mountTarget.appendChild(toastContainer);
  return toastContainer;
}

/**
 * 显示Toast提示
 * Toast生命周期：
 * 1. 获取挂载目标（优先全屏元素，否则body）
 * 2. 确保Toast容器存在
 * 3. 创建Toast元素并添加到容器
 * 4. 使用requestAnimationFrame触发渐入动画
 * 5. 2.5秒后触发渐出动画，300ms后移除DOM
 * @param {string} message - 提示消息
 * @param {string} [type="info"] - 提示类型（info/success/error/warning）
 * @param {HTMLElement} [mountTarget] - 挂载目标元素
 */
VT_MODAL.showToast = function (message, type = "info", mountTarget) {
  // 获取挂载目标：优先全屏元素，否则body
  if (!mountTarget) {
    mountTarget = getToastMountTarget();
  }
  const container = ensureToastContainer(mountTarget);
  
  // 创建Toast元素
  const toast = document.createElement("div");
  toast.className = `vt-toast vt-toast-${type}`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // 使用requestAnimationFrame确保DOM已插入后再触发动画
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });
  
  // 自动消失：2.5秒后渐出，300ms过渡动画后移除
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2500);
};

/**
 * 确保确认对话框存在
 * @param {HTMLElement} [mountTarget=document.body] - 挂载目标
 * @returns {HTMLElement} 确认对话框元素
 */
function ensureConfirmModal(mountTarget = document.body) {
  const existing = mountTarget.querySelector(".vt-confirm-modal");
  if (existing) {
    confirmModal = existing;
    return confirmModal;
  }
  
  if (confirmModal && confirmModal.parentNode === mountTarget) {
    return confirmModal;
  }
  
  if (confirmModal && confirmModal.parentNode !== mountTarget) {
    confirmModal.remove();
    confirmModal = null;
  }
  
  confirmModal = document.createElement("div");
  confirmModal.className = "vt-confirm-modal";
  confirmModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    opacity: 0;
    pointer-events: none;
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  
  confirmModal.innerHTML = `
    <div style="
      background: rgba(20, 20, 28, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
      width: 320px;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      transform: scale(0.9) translateY(10px);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="vt-confirm-icon" style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 20px;
        ">⚠️</div>
        <h3 class="vt-confirm-title" style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #f9fafb;">确认操作</h3>
      </div>
      <p class="vt-confirm-message" style="text-align: center; color: #9ca3af; margin: 0 0 20px 0; font-size: 12px; line-height: 1.5;"></p>
      <div style="display: flex; gap: 10px; justify-content: center; width: 100%;">
        <button class="vt-confirm-cancel" style="
          flex: 1;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          transition: all 0.2s;
          outline: none;
        ">取消</button>
        <button class="vt-confirm-ok" style="
          flex: 1;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          transition: all 0.2s;
          outline: none;
        ">确定</button>
      </div>
    </div>
  `;
  
  mountTarget.appendChild(confirmModal);
  return confirmModal;
}

/**
 * 显示确认对话框
 * @param {Object} options - 对话框配置
 * @param {string} [options.title="确认操作"] - 标题
 * @param {string} [options.message=""] - 消息内容
 * @param {string} [options.icon="warning"] - 图标类型（warning/info）
 * @param {HTMLElement} [mountTarget=document.body] - 挂载目标
 * @returns {Promise<boolean>} 用户确认返回true，取消返回false
 */
VT_MODAL.showConfirm = function (options, mountTarget) {
  return new Promise((resolve) => {
    const { title = "确认操作", message = "", icon = "warning" } = options;
    if (!mountTarget) {
      const fullscreenEl = getFullscreenElement();
      mountTarget = fullscreenEl || document.body;
    }
    const modal = ensureConfirmModal(mountTarget);
    
    const iconEl = modal.querySelector(".vt-confirm-icon");
    const titleEl = modal.querySelector(".vt-confirm-title");
    const msgEl = modal.querySelector(".vt-confirm-message");
    const cancelBtn = modal.querySelector(".vt-confirm-cancel");
    const okBtn = modal.querySelector(".vt-confirm-ok");
    
    if (icon === "warning") {
      iconEl.textContent = "⚠️";
      iconEl.style.background = "rgba(251, 191, 36, 0.15)";
      iconEl.style.border = "2px solid rgba(251, 191, 36, 0.4)";
    } else {
      iconEl.textContent = "ℹ️";
      iconEl.style.background = "rgba(59, 130, 246, 0.15)";
      iconEl.style.border = "2px solid rgba(59, 130, 246, 0.4)";
    }
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modal.classList.add("show");
    
    const content = modal.querySelector("div");
    content.style.transform = "scale(1) translateY(0)";
    
    // 绑定动态 hover 动画效果
    const onCancelEnter = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.1)";
      cancelBtn.style.color = "#f9fafb";
    };
    const onCancelLeave = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.05)";
      cancelBtn.style.color = "#9ca3af";
    };
    const onOkEnter = () => {
      okBtn.style.transform = "translateY(-2px)";
      okBtn.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.4)";
    };
    const onOkLeave = () => {
      okBtn.style.transform = "translateY(0)";
      okBtn.style.boxShadow = "none";
    };
    
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        close(false);
      }
    };
    
    cancelBtn.addEventListener("mouseenter", onCancelEnter);
    cancelBtn.addEventListener("mouseleave", onCancelLeave);
    okBtn.addEventListener("mouseenter", onOkEnter);
    okBtn.addEventListener("mouseleave", onOkLeave);
    document.addEventListener("keydown", onKeyDown);
    
    const close = (result) => {
      modal.style.opacity = "0";
      modal.style.pointerEvents = "none";
      modal.classList.remove("show");
      content.style.transform = "scale(0.9) translateY(10px)";
      
      cancelBtn.removeEventListener("click", cancelHandler);
      okBtn.removeEventListener("click", okHandler);
      cancelBtn.removeEventListener("mouseenter", onCancelEnter);
      cancelBtn.removeEventListener("mouseleave", onCancelLeave);
      okBtn.removeEventListener("mouseenter", onOkEnter);
      okBtn.removeEventListener("mouseleave", onOkLeave);
      document.removeEventListener("keydown", onKeyDown);
      
      setTimeout(() => resolve(result), 200);
    };
    
    const cancelHandler = () => close(false);
    const okHandler = () => close(true);
    
    cancelBtn.addEventListener("click", cancelHandler);
    okBtn.addEventListener("click", okHandler);
  });
};

if (typeof window !== "undefined") {
  window.VT_MODAL = VT_MODAL;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = VT_MODAL;
}

if (typeof exports !== "undefined") {
  Object.keys(VT_MODAL).forEach(key => {
    exports[key] = VT_MODAL[key];
  });
}
