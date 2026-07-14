/**
 * VidBuddy Main 模块
 * 负责视频元素捕获、倍速锁定和 Shadow DOM 穿透等核心功能
 */
(function () {
  const currentHost = location.hostname;

  /**
   * 检查当前域名是否在黑名单中，若在则静默退出
   */
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
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
          `VidBuddy Main: 当前域名 ${currentHost} 处于禁用黑名单中，插件已静默退隐。`,
        );
        return;
      }
      initMain();
    });
  } else {
    initMain();
  }

  /**
   * 初始化主模块
   */
  function initMain() {
    if (window.__video_tools_main_injected__) return;
    window.__video_tools_main_injected__ = true;

    // 倍速劫持锁定机制 (GhostMode) - 防止某些网站强制重置倍速
    // 原理说明：
    // 某些网站（如百度网盘、腾讯视频、抖音等）会通过 JavaScript 定期重置 video.playbackRate 为 1.0
    // GhostMode 通过重写 HTMLMediaElement.prototype.playbackRate 的 getter/setter
    // 拦截所有对 playbackRate 的写入操作，强制设置为用户期望的 targetSpeed
    let targetSpeed = 1.0;  // 用户设置的目标倍速
    
    // 需要启用 GhostMode 的网站列表
    // 这些网站会强制重置倍速，需要特殊处理
    const ghostSites = [
      "pan.baidu.com",      // 百度网盘
      ".qq.com",            // 腾讯视频
      "wetv.vip",           // WeTV
      ".douyin.com",        // 抖音
      ".tiktok.com",        // TikTok
      "mooc1.chaoxing.com", // 超星慕课
      "live.study.163.com", // 网易云课堂直播
      "study.163.com",      // 网易云课堂
    ];
    
    // 判断当前网站是否需要启用 GhostMode
    const ghostModeActive = ghostSites.some((site) =>
      location.hostname.includes(site),
    );
    
    // 保存原始的 playbackRate 属性描述符
    const ogPlaybackRateDesc = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "playbackRate",
    );
    const ogDefaultPlaybackRateDesc = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "defaultPlaybackRate",
    );
    
    // 一致性映射：存储每个媒体元素的"表面"倍速值
    // 网站读取 playbackRate 时返回这个值，避免网站检测到倍速被篡改
    const coherence = new WeakMap();

    if (ogPlaybackRateDesc && ogDefaultPlaybackRateDesc) {
      try {
        // 重写 playbackRate 属性，实现 GhostMode 劫持
        Object.defineProperty(HTMLMediaElement.prototype, "playbackRate", {
          configurable: true,
          enumerable: true,
          get: function () {
            // GhostMode 激活时：返回 coherence 中存储的值（网站认为的倍速）
            // 这样网站检测到的是它自己设置的值，不会触发额外的重置逻辑
            if (ghostModeActive) {
              return coherence.has(this) ? coherence.get(this) : 1.0;
            }
            // 非 GhostMode：直接返回原始值
            return ogPlaybackRateDesc.get.call(this);
          },
          set: function (newValue) {
            if (ghostModeActive) {
              // GhostMode 激活时：
              // 1. 将网站设置的值存入 coherence（表面值）
              // 2. 强制将实际播放倍速设置为 targetSpeed（用户期望的值）
              coherence.set(this, newValue);
              ogPlaybackRateDesc.set.call(this, targetSpeed);
            } else {
              // 非 GhostMode：直接使用原始 setter
              ogPlaybackRateDesc.set.call(this, newValue);
            }
          },
        });
      } catch (err) {}
    }

    // 监听来自 bridge.js 的倍速同步通知
    window.addEventListener("VT_SET_SPEED", (e) => {
      const newSpeed = parseFloat(e.detail);
      if (!isNaN(newSpeed) && newSpeed > 0) {
        targetSpeed = newSpeed;
        const mediaElements = document.querySelectorAll("video, audio");
        mediaElements.forEach((media) => {
          try {
            if (ogPlaybackRateDesc) {
              ogPlaybackRateDesc.set.call(media, targetSpeed);
            } else {
              media.playbackRate = targetSpeed;
            }
          } catch (err) {}
        });
      }
    });

    // 轮询强制锁定倍速，防止动态生成的媒体元素倍速脱轨
    // 适用场景：
    // 1. 动态生成的 video 元素（SPA 页面切换视频）
    // 2. 某些网站绕过 playbackRate setter 直接修改内部属性
    // 3. 视频切换后倍速未自动同步
    // 检查间隔：1秒
    setInterval(() => {
      // 倍速为1.0时无需锁定
      if (targetSpeed === 1.0) return;
      
      const mediaElements = document.querySelectorAll("video, audio");
      mediaElements.forEach((media) => {
        try {
          // 通过原始描述符获取真实倍速值（绕过 GhostMode 的 getter）
          const currentRate = ogPlaybackRateDesc
            ? ogPlaybackRateDesc.get.call(media)
            : media.playbackRate;
          
          // 如果实际倍速与目标倍速偏差超过0.01，强制修正
          if (Math.abs(currentRate - targetSpeed) > 0.01) {
            if (ogPlaybackRateDesc) {
              ogPlaybackRateDesc.set.call(media, targetSpeed);
            } else {
              media.playbackRate = targetSpeed;
            }
          }
        } catch (err) {}
      });
    }, 1000);

    /**
     * 生成随机ID
     * @returns {string} 随机ID字符串
     */
    function randomId() {
      return (Math.random() * 0xffffffff).toString(36);
    }

    /**
     * 根据URL生成视频ID，支持多平台识别
     * @returns {string} 视频ID
     */
    function generateUrlBasedId() {
      const host = location.hostname;
      const path = location.pathname;
      const urlParams = new URLSearchParams(location.search);

      // B站视频识别：支持 BV号、分P视频（带 _pN 后缀）、番剧EP、番剧SS
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

      // 腾讯视频识别：支持 cover 格式、page 格式、vpath 参数
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

      // YouTube识别：通过 v 参数获取视频ID
      if (host.includes("youtube.com")) {
        const v = urlParams.get("v");
        if (v) return `yt_${v}`;
      }

      // 爱奇艺识别：支持 v_xxx.html 格式，优先使用 tvid 参数
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

      // 网易云课堂识别：支持 courseId/lessonId/chapterId/liveId 参数组合
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

      // 中国大学MOOC识别：支持 courseId/lessonId/chapterId 参数组合
      if (host.includes("icourse163.org")) {
        const courseId = urlParams.get("courseId");
        const lessonId = urlParams.get("lessonId");
        const chapterId = urlParams.get("chapterId");

        if (courseId && lessonId) return `icourse_${courseId}_${lessonId}`;
        if (courseId && chapterId) return `icourse_${courseId}_${chapterId}`;

        const pathMatch = path.match(/\/learn\/(\d+)/);
        if (pathMatch) return `icourse_learn_${pathMatch[1]}`;

        const pathMatch2 = path.match(/\/course\/(\d+)/);
        if (pathMatch2) return `icourse_course_${pathMatch2[1]}`;
      }

      // 酷学习识别：通过路径中的数字组合生成ID
      if (host.includes("koolearn.com")) {
        const pathParts = path
          .split("/")
          .filter((p) => p && !isNaN(parseInt(p)));
        if (pathParts.length >= 2) {
          return `koolearn_${pathParts[0]}_${pathParts[1]}`;
        }
        if (pathParts.length >= 1) {
          return `koolearn_${pathParts[0]}`;
        }
      }

      // 优酷识别：支持 v_show/id_xxx.html 格式和 id 参数
      if (host.includes("youku.com")) {
        const ukMatch = path.match(/\/v_show\/id_([a-zA-Z0-9]+)\.html/);
        if (ukMatch) return `youku_${ukMatch[1]}`;
        const idParam = urlParams.get("id");
        if (idParam) return `youku_id_${idParam}`;
      }

      // 土豆识别
      if (host.includes("tudou.com")) {
        const tdMatch = path.match(/\/programs\/view\/([a-zA-Z0-9]+)/);
        if (tdMatch) return `tudou_${tdMatch[1]}`;
      }

      // Vimeo识别
      if (host.includes("vimeo.com")) {
        const vmMatch = path.match(/\/(\d+)/);
        if (vmMatch) return `vimeo_${vmMatch[1]}`;
      }

      // DailyMotion识别
      if (host.includes("dailymotion.com")) {
        const dmMatch = path.match(/\/video\/([a-zA-Z0-9]+)/);
        if (dmMatch) return `dm_${dmMatch[1]}`;
      }

      // Twitch识别
      if (host.includes("twitch.tv")) {
        const channelMatch = path.match(/\/([^/]+)/);
        if (channelMatch) return `twitch_${channelMatch[1]}`;
      }

      // Netflix识别
      if (host.includes("netflix.com")) {
        const titleId = urlParams.get("titleId");
        if (titleId) return `netflix_${titleId}`;
      }

      // 通用哈希算法生成ID：对未识别的平台，使用 URL 的 DJB2 哈希算法生成唯一ID
      const cleanUrl = host + path;
      let hash = 0;
      for (let i = 0; i < cleanUrl.length; i++) {
        const char = cleanUrl.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return `hash_${Math.abs(hash).toString(36)}`;
    }

    let capturedVideos = new Set();
    const hostname = location.hostname;
    const isCorsWhiteList =
      hostname.includes("bilibili.com") || hostname.includes("biliapi.net");

    /**
     * 向沙盒隔离环境（ISOLATED World）发送捕获的视频元素通知
     * @param {HTMLVideoElement} video - 视频元素
     */
    function notifyIsolatedWorld(video) {
      if (!video) return;

      // 白名单域名策略：仅对已知支持 CORS 的网站注入 crossorigin 属性
      if (
        isCorsWhiteList &&
        video.tagName === "VIDEO" &&
        !video.getAttribute("crossorigin")
      ) {
        video.setAttribute("crossorigin", "anonymous");
      }

      // 为每个视频元素分配永久唯一的随机ID（不随URL变化）
      if (!video.vtKey) {
        video.vtKey = randomId();
      }
      if (!video.getAttribute("data-vt-key")) {
        video.setAttribute("data-vt-key", video.vtKey);
      }

      // URL-based ID：用于数据存储和匹配，会随URL变化
      const urlBasedId = generateUrlBasedId();
      video.vtUrlId = urlBasedId;

      // SPA 单页应用切集换源时，DOM 元素会被复用，绑定 loadstart 事件更新 URL-based ID
      if (video.getAttribute("data-vt-loadstart-bound") !== "true") {
        video.setAttribute("data-vt-loadstart-bound", "true");
        video.addEventListener("loadstart", () => {
          const newUrlBasedId = generateUrlBasedId();
          video.vtUrlId = newUrlBasedId;
          notifyIsolatedWorld(video);
        });
      }

      if (capturedVideos.has(video.vtKey)) return;
      capturedVideos.add(video.vtKey);

      // 触发冒泡事件，穿透 Shadow DOM 边界
      const event = new CustomEvent("VT_VIDEO_CAPTURED", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          vtKey: video.vtKey,
          vtUrlId: video.vtUrlId,
        },
      });
      video.dispatchEvent(event);
    }

    // 存储所有捕获到的 ShadowRoot 引用：用于后续深度遍历穿透 Shadow DOM
  const capturedShadowRoots = new Set();

    /**
     * 全局重写 Element.prototype.attachShadow，捕获 Shadow DOM 创建
     */
    const originalAttachShadow = Element.prototype.attachShadow;
    if (originalAttachShadow) {
      const ogAttachString = originalAttachShadow.toString();
      Element.prototype.attachShadow = function (init) {
        const shadowRoot = originalAttachShadow.call(this, init);
        if (shadowRoot) {
          capturedShadowRoots.add(shadowRoot);
        }
        return shadowRoot;
      };
      Element.prototype.attachShadow.toString = () => ogAttachString;
    }

    /**
     * 全局重写 HTMLMediaElement.prototype.play，捕获视频播放事件
     */
    const originalPlay = HTMLMediaElement.prototype.play;
    if (originalPlay) {
      const ogPlayString = originalPlay.toString();
      HTMLMediaElement.prototype.play = function (...args) {
        if (this.tagName === "VIDEO") {
          const self = this;
          setTimeout(() => notifyIsolatedWorld(self), 0);
        }
        return originalPlay.apply(this, args);
      };
      HTMLMediaElement.prototype.play.toString = () => ogPlayString;
    }

    /**
     * 全局重写 document.createElement，捕获动态创建的视频元素
     */
    const originalCreateElement = document.createElement;
    if (originalCreateElement) {
      const ogCreateString = originalCreateElement.toString();
      document.createElement = function (tagName, ...args) {
        const element = originalCreateElement.call(document, tagName, ...args);
        if (typeof tagName === "string" && tagName.toUpperCase() === "VIDEO") {
          if (isCorsWhiteList) {
            element.setAttribute("crossorigin", "anonymous");
          }
          setTimeout(() => notifyIsolatedWorld(element), 50);
        }
        return element;
      };
      document.createElement.toString = () => ogCreateString;
    }

    /**
     * 监听视频 loadedmetadata 事件，捕获视频元素
     */
    document.addEventListener(
      "loadedmetadata",
      (e) => {
        if (e.target && e.target.tagName === "VIDEO") {
          notifyIsolatedWorld(e.target);
        }
      },
      true,
    );

    /**
     * 监听视频 play 事件，捕获视频元素
     */
    document.addEventListener(
      "play",
      (e) => {
        if (e.target && e.target.tagName === "VIDEO") {
          notifyIsolatedWorld(e.target);
        }
      },
      true,
    );

    /**
     * 安全深度 DOM 遍历算法，用于穿透 Shadow DOM 捕获视频元素
     * @returns {Array<HTMLVideoElement>} 视频元素列表
     */
    function scanVideosDeep() {
      const videos = [];
      const visited = new Set();
      const MAX_DEPTH = 32; // 最大遍历深度，防止无限递归

      /**
       * 递归遍历 DOM 树，同时穿透 Shadow DOM 边界
       * @param {Node} node - 当前节点
       * @param {number} depth - 当前深度
       */
      function traverse(node, depth) {
        if (!node || depth > MAX_DEPTH || visited.has(node)) return;
        visited.add(node);

        if (node.tagName === "VIDEO") {
          videos.push(node);
        }

        let child = node.firstElementChild;
        while (child) {
          traverse(child, depth + 1);
          child = child.nextElementSibling;
        }

        if (node.shadowRoot) {
          traverse(node.shadowRoot, depth + 1);
        }
      }

      traverse(document, 0);

      capturedShadowRoots.forEach((shadowRoot) => {
        traverse(shadowRoot, 0);
      });

      return videos;
    }

    /**
     * 扫描现有视频元素并通知隔离环境
     */
    function scanExistingVideos() {
      try {
        const videos = scanVideosDeep();
        videos.forEach((video) => {
          notifyIsolatedWorld(video);
        });
      } catch (e) {
        // 容错处理
      }
    }

    /**
     * 监听 bridge 就绪事件，重新扫描视频
     */
    document.addEventListener("VT_BRIDGE_READY", () => {
      capturedVideos = new Set();
      scanExistingVideos();
    });

    // 初始扫描和定时轮询扫描
    scanExistingVideos();
    const scanInterval = setInterval(scanExistingVideos, 3000);

    /**
     * 页面卸载时清理资源
     */
    window.addEventListener("beforeunload", () => {
      clearInterval(scanInterval);
      capturedVideos = new Set();
      capturedShadowRoots.clear();
    });
  }
})();
