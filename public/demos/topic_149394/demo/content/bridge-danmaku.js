/**
 * VidBuddy 弹幕模块
 * 提供弹幕发射和管理功能
 */
(function () {
  const VT_DANMAKU = {};

  let videoMap = new Map();

  /**
   * 获取视频映射表
   * @returns {Map} 视频映射表
   */
  const getVideoMap = () => videoMap;

  /**
   * 获取视频元素的ID
   * @param {HTMLVideoElement} video - 视频元素
   * @returns {string} 视频ID
   */
  function getVideoId(video) {
    return video.getAttribute("data-vt-key") || video.getAttribute("data-vt-dom-id") || video.id || "";
  }

  /**
   * 清除指定视频的所有弹幕
   * @param {HTMLVideoElement} video - 视频元素
   */
  VT_DANMAKU.clearAllDanmakus = function (video) {
    const entry = getVideoMap().get(getVideoId(video));
    if (!entry || !entry.overlayHost) return;
    const existing = entry.overlayHost.querySelectorAll(".vt-danmaku");
    existing.forEach((d) => d.remove());
  };

  /**
   * 发射弹幕
   * 弹幕发射流程：
   * 1. 获取视频的覆盖层容器
   * 2. 创建弹幕元素并设置文本内容
   * 3. 计算轨道位置：在视频上半部分（40%高度）随机分配一条轨道
   * 4. 设置弹幕动画参数（视频宽度、滚动时长）
   * 5. 添加到DOM并绑定动画结束后的自动移除事件
   * @param {HTMLVideoElement} video - 视频元素
   * @param {string} text - 弹幕文本内容
   */
  VT_DANMAKU.launchDanmaku = function (video, text) {
    const entry = getVideoMap().get(getVideoId(video));
    if (!entry || !entry.overlayHost) return;

    const danmaku = document.createElement("div");
    danmaku.className = "vt-danmaku";
    danmaku.innerText = text;

    // 轨道计算：每条轨道高度32px，最多使用视频高度的40%作为弹幕区域
    // 防止弹幕遮挡视频关键内容（如字幕区域）
    const trackHeight = 32;
    const maxTracks = Math.floor((video.clientHeight * 0.4) / trackHeight) || 3;
    const track = Math.floor(Math.random() * maxTracks);
    const topOffset = 20 + track * trackHeight;

    danmaku.style.top = `${topOffset}px`;

    // 设置动画参数：视频宽度用于计算弹幕移动距离
    const videoWidth = video.clientWidth;
    danmaku.style.setProperty("--vt-video-width", `${videoWidth}px`);
    
    // 设置滚动时长：默认7.5秒，可通过全局配置调整
    const duration = window.globalDanmakuSpeed || 7.5;
    danmaku.style.setProperty("--vt-danmaku-duration", `${duration}s`);

    entry.overlayHost.appendChild(danmaku);

    // 动画结束后自动移除弹幕元素，避免DOM堆积
    danmaku.addEventListener("animationend", () => {
      danmaku.remove();
    });
  };

  /**
   * 设置视频映射表
   * @param {Map} map - 视频映射表
   */
  VT_DANMAKU.setVideoMap = function (map) {
    videoMap = map;
  };

  if (typeof window !== "undefined") {
    window.VT_DANMAKU = VT_DANMAKU;
  }
})();