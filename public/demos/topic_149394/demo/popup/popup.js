/**
 * VidBuddy 弹出窗口模块
 * 负责扩展弹出窗口的播放历史展示、笔记管理、截图查看等功能
 */
(function () {
  const VT_POPUP = {};

  /** 历史记录列表容器 */
  let historyList = null;
  /** 清空所有按钮 */
  let btnClearAll = null;
  /** 平台过滤器 */
  let platformFilter = null;
  /** 打开管理中心按钮 */
  let btnOpenDashboard = null;
  /** 打开设置按钮 */
  let btnOpenSettings = null;
  /** 当前过滤平台 */
  let currentFilterPlatform = "all";

  /**
   * 初始化弹出窗口
   */
  VT_POPUP.init = function () {
    historyList = document.getElementById("history-list");
    btnClearAll = document.getElementById("btn-clear-all");
    platformFilter = document.getElementById("platform-filter");
    btnOpenDashboard = document.getElementById("btn-open-dashboard");
    btnOpenSettings = document.getElementById("btn-open-settings");

    VT_POPUP.bindEventListeners();
    VT_POPUP.renderHistory();
    VT_POPUP.initImageViewer();

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local") {
        const hasRelevantChange = Object.keys(changes).some(key => 
          key === "markers" || key === "screenshots" || key === "progressHistory" || key.startsWith("screenshot_")
        );
        if (hasRelevantChange) {
          VT_POPUP.renderHistory();
        }
      }
    });
  };

  /**
   * 绑定事件监听器
   */
  VT_POPUP.bindEventListeners = function () {
    if (btnOpenDashboard) {
      btnOpenDashboard.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
      });
    }

    if (btnOpenSettings) {
      btnOpenSettings.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") + "#settings" });
      });
    }

    if (platformFilter) {
      platformFilter.addEventListener("change", (e) => {
        currentFilterPlatform = e.target.value;
        VT_POPUP.renderHistory();
      });
    }

    if (btnClearAll) {
      btnClearAll.addEventListener("click", async () => {
        const confirmed = await VT_POPUP.showConfirm({
          title: "清空所有数据",
          message: "确定要完全清空所有的视频播放历史、打点标记以及全部的高清截图吗？（该操作无法恢复）",
          icon: "warning",
        });
        if (confirmed) {
          chrome.storage.local.get({ screenshots: [] }, (result) => {
            const deleteKeys = result.screenshots.map((s) => `screenshot_${s.id}`);
            chrome.storage.local.remove(deleteKeys, () => {
              chrome.storage.local.set(
                {
                  progressHistory: [],
                  markers: [],
                  screenshots: [],
                },
                () => {
                  currentFilterPlatform = "all";
                  VT_POPUP.renderHistory();
                  VT_POPUP.showToast("✅ 所有数据已清空", "success");
                },
              );
            });
          });
        }
      });
    }
  };

  /**
   * 显示确认对话框
   * @param {Object} options - 对话框配置
   * @returns {Promise<boolean>} 用户确认返回true，取消返回false
   */
  VT_POPUP.showConfirm = function (options) {
    if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
      return window.VT_MODAL.showConfirm(options);
    }
    return Promise.resolve(confirm(options.message));
  };

  /**
   * 显示提示消息
   * @param {string} msg - 提示内容
   * @param {string} [type="info"] - 提示类型
   */
  VT_POPUP.showToast = function (msg, type = "info") {
    if (window.VT_MODAL && window.VT_MODAL.showToast) {
      window.VT_MODAL.showToast(msg, type);
    }
  };

  /**
   * 格式化时间
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   */
  VT_POPUP.formatTime = function (seconds) {
    if (window.VT_UTILS && window.VT_UTILS.formatTime) {
      return window.VT_UTILS.formatTime(seconds);
    }
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
  };

  /**
   * 生成视频ID的备用匹配ID
   * @param {string} videoId - 视频ID
   * @returns {Array<string>} 备用ID列表
   */
  VT_POPUP.generateFallbackIds = function (videoId) {
    const fallbackIds = [];
    if (videoId && videoId.startsWith("bili_") && videoId.includes("_p")) {
      const baseId = videoId.split("_p")[0];
      fallbackIds.push(baseId);
    }
    if (videoId && videoId.startsWith("iq_")) {
      const parts = videoId.split("_");
      if (parts.length > 2) {
        fallbackIds.push(`${parts[0]}_${parts[1]}`);
      }
    }
    return fallbackIds;
  };

  /**
   * 更新平台过滤器选项
   * @param {Array} history - 播放历史列表
   */
  VT_POPUP.updatePlatformFilterOptions = function (history) {
    const platforms = [...new Set(history.map((item) => item.platform))].filter(
      Boolean,
    );
    platformFilter.innerHTML = '<option value="all">全部网站</option>';
    platforms.forEach((plat) => {
      const option = document.createElement("option");
      option.value = plat;
      option.innerText = plat;
      if (plat === currentFilterPlatform) {
        option.selected = true;
      }
      platformFilter.appendChild(option);
    });
  };

  /**
   * 删除标记点
   * @param {string} markerId - 标记点ID
   * @param {HTMLElement} markerItemEl - 标记点元素
   */
  VT_POPUP.deleteMarker = function (markerId, markerItemEl) {
    if (window.VT_STORAGE && window.VT_STORAGE.deleteMarker) {
      window.VT_STORAGE.deleteMarker(markerId).then(() => {
        VT_POPUP.handleMarkerDeleteUI(markerItemEl);
      });
    } else {
      chrome.storage.local.get({ markers: [] }, (result) => {
        const updated = result.markers.filter((m) => m.id !== markerId);
        chrome.storage.local.set({ markers: updated }, () => {
          VT_POPUP.handleMarkerDeleteUI(markerItemEl);
        });
      });
    }
  };

  /**
   * 处理标记点删除后的UI更新
   * @param {HTMLElement} markerItemEl - 标记点元素
   */
  VT_POPUP.handleMarkerDeleteUI = function (markerItemEl) {
    if (markerItemEl) {
      const container = markerItemEl.parentElement;
      const card = markerItemEl.closest(".record-card");
      markerItemEl.remove();
      if (card) {
        const toggleBtn = card.querySelector(".btn-notes-toggle");
        const remainingCount =
          container.querySelectorAll(".marker-item").length;
        if (toggleBtn) {
          if (remainingCount > 0) {
            const textSpan = toggleBtn.querySelector("span");
            if (textSpan) textSpan.innerText = `笔记 (${remainingCount})`;
          } else {
            toggleBtn.remove();
            container.remove();
          }
        }
      }
    } else {
      VT_POPUP.renderHistory();
    }
  };

  /**
   * 删除截图
   * @param {string} snapId - 截图ID
   * @param {HTMLElement} snapItemEl - 截图元素
   */
  VT_POPUP.deleteScreenshot = function (snapId, snapItemEl) {
    if (window.VT_STORAGE && window.VT_STORAGE.deleteScreenshot) {
      window.VT_STORAGE.deleteScreenshot(snapId).then(() => {
        VT_POPUP.handleScreenshotDeleteUI(snapItemEl);
      });
    } else {
      chrome.storage.local.get({ screenshots: [], markers: [] }, (result) => {
        const updatedScreenshots = result.screenshots.filter((s) => s.id !== snapId);
        const updatedMarkers = result.markers.filter((m) => m.screenshotId !== snapId);
        chrome.storage.local.remove([`screenshot_${snapId}`], () => {
          chrome.storage.local.set({ screenshots: updatedScreenshots, markers: updatedMarkers }, () => {
            VT_POPUP.handleScreenshotDeleteUI(snapItemEl);
          });
        });
      });
    }
  };

  /**
   * 处理截图删除后的UI更新
   * @param {HTMLElement} snapItemEl - 截图元素
   */
  VT_POPUP.handleScreenshotDeleteUI = function (snapItemEl) {
    if (snapItemEl) {
      const container = snapItemEl.parentElement;
      const card = snapItemEl.closest(".record-card");
      snapItemEl.remove();
      if (card) {
        const toggleBtn = card.querySelector(".btn-snaps-toggle");
        const remainingCount =
          container.querySelectorAll(".popup-snap-item").length;
        if (toggleBtn) {
          if (remainingCount > 0) {
            const textSpan = toggleBtn.querySelector("span");
            if (textSpan) textSpan.innerText = `截图 (${remainingCount})`;
          } else {
            toggleBtn.remove();
            container.remove();
          }
        }
      }
    } else {
      VT_POPUP.renderHistory();
    }
  };

  /**
   * 删除播放历史项
   * @param {string} url - 视频URL
   * @param {string} videoId - 视频ID
   */
  VT_POPUP.deleteHistoryItem = function (url, videoId) {
    chrome.storage.local.get(null, (allData) => {
      const progressHistory = allData.progressHistory || [];
      const updatedHistory = progressHistory.filter((item) => item.url !== url);

      const fallbackIds = VT_POPUP.generateFallbackIds(videoId);
      const allMatchIds = [videoId, ...fallbackIds];

      const markers = allData.markers || [];
      const updatedMarkers = markers.filter(
        (m) => !allMatchIds.includes(m.videoId),
      );

      const screenshots = allData.screenshots || [];
      const targetSnaps = screenshots.filter((s) =>
        allMatchIds.includes(s.videoId),
      );
      const updatedScreenshots = screenshots.filter(
        (s) => !allMatchIds.includes(s.videoId),
      );

      const deleteKeys = targetSnaps.map((s) => `screenshot_${s.id}`);

      chrome.storage.local.remove(deleteKeys, () => {
        chrome.storage.local.set(
          {
            progressHistory: updatedHistory,
            markers: updatedMarkers,
            screenshots: updatedScreenshots,
          },
          () => {
            VT_POPUP.renderHistory();
          },
        );
      });
    });
  };

  /**
   * 渲染播放历史列表
   * 渲染流程：
   * 1. 记录当前展开状态（笔记/截图区域）
   * 2. 从存储加载历史、标记、截图数据
   * 3. 根据平台过滤器筛选
   * 4. 为每个历史项创建卡片，包含标题、进度条、笔记列表、截图网格
   * 5. 绑定交互事件（点击跳转、删除、查看截图等）
   */
  VT_POPUP.renderHistory = function () {
    // 记录当前展开状态，保持用户操作体验（避免重新渲染后折叠）
    const openNotesVideoIds = new Set();
    const openSnapsVideoIds = new Set();
    document.querySelectorAll(".record-card").forEach((c) => {
      const videoId = c.getAttribute("data-id");
      if (videoId) {
        const notesSection = c.querySelector(".record-markers-list");
        const snapsSection = c.querySelector(".record-screenshots-grid");
        if (notesSection && !notesSection.classList.contains("collapsed")) {
          openNotesVideoIds.add(videoId);
        }
        if (snapsSection && !snapsSection.classList.contains("collapsed")) {
          openSnapsVideoIds.add(videoId);
        }
      }
    });

    chrome.storage.local.get(
      { progressHistory: [], markers: [], screenshots: [] },
      (result) => {
        if (chrome.runtime.lastError) {
          console.error("VidBuddy: 读取存储失败:", chrome.runtime.lastError);
          return;
        }
        const history = result ? result.progressHistory : [];
        const allMarkers = result.markers;
        const allScreenshots = result.screenshots;

        VT_POPUP.updatePlatformFilterOptions(history);

        const filteredHistory =
          currentFilterPlatform === "all"
            ? history
            : history.filter((item) => item.platform === currentFilterPlatform);

        if (filteredHistory.length === 0) {
          historyList.innerHTML = `<div class="list-empty">暂无该网站的播放记录</div>`;
          return;
        }

        historyList.innerHTML = "";
        filteredHistory.forEach((item) => {
          const percent = Math.min(
            100,
            Math.max(0, (item.currentTime / item.duration) * 100),
          );

          // 构建完整的匹配ID列表：当前ID + 备用ID（跨集匹配） + 同URL不同ID（SPA切集）
          const fallbackIds = VT_POPUP.generateFallbackIds(item.id);
          const urlMatchingIds = history
            .filter((h) => h.url === item.url && h.id !== item.id)
            .map((h) => h.id);
          const allMatchIds = [item.id, ...fallbackIds, ...urlMatchingIds];

          // 筛选当前视频的标记和截图，排除截图锚点标记
          const videoMarkers = allMarkers
            .filter(
              (m) =>
                allMatchIds.includes(m.videoId) &&
                !m.screenshotId &&
                !(m.note && m.note.startsWith("📷 截图锚点")),
            )
            .sort((a, b) => a.time - b.time);
          const videoScreenshots = allScreenshots
            .filter((s) => allMatchIds.includes(s.videoId))
            .sort((a, b) => a.timestamp - b.timestamp);

          const notesCount = videoMarkers.length;
          const snapsCount = videoScreenshots.length;

          const card = document.createElement("div");
          card.className = "record-card";
          card.setAttribute("data-id", item.id);

          const isNotesOpen = openNotesVideoIds.has(item.id);
          const isSnapsOpen = openSnapsVideoIds.has(item.id);

          let markersContainer = null;
          if (notesCount > 0) {
            markersContainer = document.createElement("div");
            markersContainer.className =
              "record-markers-list" + (isNotesOpen ? "" : " collapsed");

            videoMarkers.forEach((mk) => {
              const markerItem = document.createElement("div");
              markerItem.className = "marker-item";
              markerItem.setAttribute("data-time", mk.time);
              markerItem.setAttribute("title", "点击跳转并恢复视频播放");

              const infoSpan = document.createElement("span");
              infoSpan.className = "marker-item-info";

              const timeSpan = document.createElement("span");
              timeSpan.className = "marker-item-time";
              timeSpan.textContent = `[${VT_POPUP.formatTime(mk.time)}]`;

              const noteSpan = document.createElement("span");
              noteSpan.textContent = ` ${mk.note}`;

              infoSpan.appendChild(timeSpan);
              infoSpan.appendChild(noteSpan);
              markerItem.appendChild(infoSpan);

              const matchedSnap = videoScreenshots.find(
                (s) => Math.abs(s.timestamp - mk.time) < 0.5,
              );
              if (matchedSnap) {
                const previewDiv = document.createElement("div");
                previewDiv.className = "marker-screenshot-preview";
                previewDiv.setAttribute("data-id", matchedSnap.id);
                previewDiv.setAttribute("title", "点击放大查看高清截图");
                const img = document.createElement("img");
                img.className = "marker-preview-img";
                previewDiv.appendChild(img);
                markerItem.appendChild(previewDiv);

                previewDiv.addEventListener("click", (e) => {
                  e.stopPropagation();
                  if (img.src) {
                    const allImgs = Array.from(
                      new Set(
                        Array.from(
                          card.querySelectorAll(
                            ".marker-preview-img, .popup-snap-img",
                          ),
                        )
                          .map((el) => el.src)
                          .filter((src) => !!src),
                      ),
                    );
                    const curIdx = allImgs.indexOf(img.src);
                    VT_POPUP.openVideoPageViewer(allImgs, curIdx);
                  }
                });

                chrome.storage.local.get(
                  `screenshot_${matchedSnap.id}`,
                  (imgResult) => {
                    const imageData = imgResult[`screenshot_${matchedSnap.id}`];
                    if (imageData) {
                      img.src = imageData;
                    }
                  },
                );
              }

              const delBtn = document.createElement("button");
              delBtn.className = "marker-item-delete";
              delBtn.setAttribute("data-id", mk.id);
              delBtn.setAttribute("title", "删除此打点");
              delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

              markerItem.appendChild(delBtn);
              markersContainer.appendChild(markerItem);
            });
          }

          let snapsContainer = null;
          if (snapsCount > 0) {
            snapsContainer = document.createElement("div");
            snapsContainer.className =
              "record-screenshots-grid" + (isSnapsOpen ? "" : " collapsed");

            videoScreenshots.forEach((snap) => {
              const snapItem = document.createElement("div");
              snapItem.className = "popup-snap-item";
              snapItem.setAttribute("data-time", snap.timestamp);

              const img = document.createElement("img");
              img.className = "popup-snap-img";
              img.alt = "";
              img.setAttribute("title", "点击高清放大预览");
              img.onerror = () => {
                img.classList.remove("visible");
                placeholder.style.display = "flex";
                snapItem.classList.remove("has-image");
              };

              const placeholder = document.createElement("div");
              placeholder.className = "snap-placeholder";
              placeholder.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg><span>截图</span>`;

              const controlDiv = document.createElement("div");
              controlDiv.className = "popup-snap-hover-bar";

              const jumpBtn = document.createElement("button");
              jumpBtn.className = "popup-snap-mini-btn jump-snap";
              jumpBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
              jumpBtn.setAttribute("title", "跳转到视频该秒数");

              const zoomBtn = document.createElement("button");
              zoomBtn.className = "popup-snap-mini-btn zoom-snap";
              zoomBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
              zoomBtn.setAttribute("title", "放大查看截图");

              const delBtn = document.createElement("button");
              delBtn.className = "popup-snap-mini-btn delete-snap";
              delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
              delBtn.setAttribute("title", "删除截图");

              controlDiv.appendChild(jumpBtn);
              controlDiv.appendChild(zoomBtn);
              controlDiv.appendChild(delBtn);
              snapItem.appendChild(placeholder);
              snapItem.appendChild(img);
              snapItem.appendChild(controlDiv);
              snapsContainer.appendChild(snapItem);

              let cachedImageData = null;
              chrome.storage.local.get(`screenshot_${snap.id}`, (imgResult) => {
                const imageData = imgResult[`screenshot_${snap.id}`];
                if (imageData) {
                  cachedImageData = imageData;
                  img.src = imageData;
                  img.classList.add("visible");
                  snapItem.classList.add("has-image");
                  placeholder.style.display = "none";
                }
              });

              const openSnapViewer = () => {
                const snapIds = videoScreenshots.map(s => s.id);
                const targetSnapId = snap.id;
                const startIndex = snapIds.indexOf(targetSnapId);
                
                VT_POPUP.openVideoPageViewerBySnapIds(snapIds, startIndex);
              };

              snapItem.addEventListener("click", (e) => {
                e.stopPropagation();
                if (e.target.classList.contains("popup-snap-mini-btn")) return;
                openSnapViewer();
              });

              zoomBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openSnapViewer();
              });

              jumpBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const jumpUrl = new URL(item.url);
                jumpUrl.searchParams.set("vt_t", snap.timestamp);
                chrome.tabs.create({ url: jumpUrl.toString() });
              });

              delBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const confirmed = await VT_POPUP.showConfirm({
                  title: "删除截图",
                  message: "确定要删除此张截图吗？",
                  icon: "warning",
                });
                if (confirmed) {
                  VT_POPUP.deleteScreenshot(snap.id, snapItem);
                }
              });
            });
          }

          const titleEl = document.createElement("h3");
          titleEl.className = "record-title";
          titleEl.textContent = item.title;
          titleEl.setAttribute("title", item.title);

          const metaEl = document.createElement("div");
          metaEl.className = "record-meta";

          const metaLeft = document.createElement("div");
          metaLeft.className = "record-meta-left";
          const platformSpan = document.createElement("span");
          platformSpan.textContent = item.platform;
          platformSpan.style.fontSize = "11px";
          platformSpan.style.opacity = "0.7";
          metaLeft.appendChild(platformSpan);
          metaEl.appendChild(metaLeft);

          const metaRight = document.createElement("div");
          metaRight.className = "record-meta-right";

          let notesToggle = null;
          let snapsToggle = null;

          if (notesCount > 0) {
            notesToggle = document.createElement("button");
            notesToggle.className =
              "record-toggle-btn btn-notes-toggle" +
              (isNotesOpen ? " active" : "");
            notesToggle.innerHTML = `<svg class="toggle-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg><span>笔记 (${notesCount})</span><svg class="toggle-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            metaRight.appendChild(notesToggle);

            notesToggle.addEventListener("click", (e) => {
              e.stopPropagation();
              const isCollapsed =
                markersContainer.classList.toggle("collapsed");
              if (!isCollapsed) {
                notesToggle.classList.add("active");
              } else {
                notesToggle.classList.remove("active");
              }
            });
          }

          if (snapsCount > 0) {
            snapsToggle = document.createElement("button");
            snapsToggle.className =
              "record-toggle-btn btn-snaps-toggle" +
              (isSnapsOpen ? " active" : "");
            snapsToggle.style.marginLeft = "4px";
            snapsToggle.innerHTML = `<svg class="toggle-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg><span>截图 (${snapsCount})</span><svg class="toggle-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            metaRight.appendChild(snapsToggle);

            snapsToggle.addEventListener("click", (e) => {
              e.stopPropagation();
              const isCollapsed = snapsContainer.classList.toggle("collapsed");
              if (!isCollapsed) {
                snapsToggle.classList.add("active");
              } else {
                snapsToggle.classList.remove("active");
              }
            });
          }

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "delete-btn";
          deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
          deleteBtn.setAttribute("title", "删除视频记录");
          metaRight.appendChild(deleteBtn);

          metaEl.appendChild(metaRight);

          const progressMeta = document.createElement("div");
          progressMeta.className = "record-progress-meta";
          const percentSpan = document.createElement("span");
          percentSpan.className = "record-percent";
          percentSpan.textContent = `${Math.round(percent)}%`;
          progressMeta.appendChild(percentSpan);
          const timeSpan = document.createElement("span");
          timeSpan.className = "record-time";
          timeSpan.textContent = `${VT_POPUP.formatTime(item.currentTime)} / ${VT_POPUP.formatTime(item.duration)}`;
          progressMeta.appendChild(timeSpan);

          const progressEl = document.createElement("div");
          progressEl.className = "record-progress";
          const progressFill = document.createElement("div");
          progressFill.className = "record-progress-fill";
          progressFill.style.width = `${percent}%`;
          progressEl.appendChild(progressFill);

          card.appendChild(titleEl);
          card.appendChild(metaEl);
          card.appendChild(progressMeta);
          card.appendChild(progressEl);
          if (markersContainer) card.appendChild(markersContainer);
          if (snapsContainer) card.appendChild(snapsContainer);

          card.addEventListener("click", (e) => {
            if (
              e.target.classList.contains("delete-btn") ||
              e.target.closest(".marker-item") ||
              e.target.closest(".marker-item-delete") ||
              e.target.closest(".marker-screenshot-preview") ||
              e.target.closest(".popup-snap-item")
            ) {
              return;
            }
            chrome.tabs.create({ url: item.url });
          });

          const markerElems = card.querySelectorAll(".marker-item");
          markerElems.forEach((el) => {
            el.addEventListener("click", (e) => {
              const previewEl = e.target.closest(".marker-screenshot-preview");
              if (previewEl) {
                e.stopPropagation();
                return;
              }

              if (e.target.classList.contains("marker-item-delete")) return;
              const time = el.getAttribute("data-time");
              const jumpUrl = new URL(item.url);
              jumpUrl.searchParams.set("vt_t", time);
              chrome.tabs.create({ url: jumpUrl.toString() });
              e.stopPropagation();
            });

            const delBtn = el.querySelector(".marker-item-delete");
            if (delBtn) {
              delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const markerId = delBtn.getAttribute("data-id");
                VT_POPUP.deleteMarker(markerId, el);
              });
            }
          });

          card.querySelector(".delete-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            const confirmed = await VT_POPUP.showConfirm({
              title: "删除播放历史",
              message: `确定要删除该视频的播放历史吗？（这会同步删除其图文笔记与截图）`,
              icon: "warning",
            });
            if (confirmed) {
              VT_POPUP.deleteHistoryItem(item.url, item.id);
            }
          });

          historyList.appendChild(card);
        });
      },
    );
  };

  /**
   * 在视频页面打开图片查看器
   * @param {Array<string>} imgList - 图片URL列表
   * @param {number} startIndex - 起始索引
   */
  VT_POPUP.openVideoPageViewer = function (imgList, startIndex) {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      let targetTab = null;
      for (const tab of tabs) {
        if (
          tab.active &&
          tab.status === "complete" &&
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://")
        ) {
          targetTab = tab;
          break;
        }
      }
      if (!targetTab) {
        for (const tab of tabs) {
          if (
            !tab.url ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("chrome-extension://")
          )
            continue;
          if (tab.status === "complete") {
            targetTab = tab;
            break;
          }
        }
      }
      if (targetTab) {
        chrome.tabs.sendMessage(targetTab.id, {
          type: "OPEN_IMAGE_VIEWER",
          imgList: imgList,
          startIndex: startIndex,
        }).then(() => {
          window.close();
        }).catch(() => {
          VT_POPUP.openImageViewer(imgList, startIndex);
        });
      }
    });
  };

  /**
   * 通过截图ID在视频页面打开图片查看器
   * @param {Array<string>} snapIds - 截图ID列表
   * @param {number} startIndex - 起始索引
   */
  VT_POPUP.openVideoPageViewerBySnapIds = function (snapIds, startIndex) {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      // 1. 优先寻找当前活跃（Active）的普通网页 Tab
      let targetTab = tabs.find(tab => 
        tab.active && 
        tab.url && 
        !tab.url.startsWith("chrome://") && 
        !tab.url.startsWith("chrome-extension://")
      );
      
      // 2. 如果没找到活跃的网页 Tab，再找其他已经 complete 状态的非系统网页 Tab 做兜底
      if (!targetTab) {
        targetTab = tabs.find(tab => 
          tab.url && 
          !tab.url.startsWith("chrome://") && 
          !tab.url.startsWith("chrome-extension://") &&
          tab.status === "complete"
        );
      }
      
      if (targetTab) {
        chrome.tabs.sendMessage(
          targetTab.id,
          {
            type: "OPEN_IMAGE_VIEWER_BY_IDS",
            snapIds: snapIds,
            startIndex: startIndex,
          },
          (response) => {
            if (chrome.runtime.lastError || !response || !response.success) {
              console.warn("VidBuddy: Send message to tab failed, falling back to local viewer", chrome.runtime.lastError);
              VT_POPUP.loadAndOpenImageViewer(snapIds, startIndex);
            } else {
              window.close();
            }
          }
        );
      } else {
        // 找不到适合接收消息的网页 Tab，退回到本地 popup 弹窗
        VT_POPUP.loadAndOpenImageViewer(snapIds, startIndex);
      }
    });
  };

  /**
   * 加载截图数据并打开图片查看器
   * @param {Array<string>} snapIds - 截图ID列表
   * @param {number} startIndex - 起始索引
   */
  VT_POPUP.loadAndOpenImageViewer = function (snapIds, startIndex) {
    const keys = snapIds.map(snapId => `screenshot_${snapId}`);
    // 批量加载截图数据，避免在循环中重复查询
    chrome.storage.local.get(keys, (res) => {
      const screenshotUrls = [];
      for (const snapId of snapIds) {
        const imageData = res[`screenshot_${snapId}`];
        if (imageData) {
          screenshotUrls.push(imageData);
        }
      }
      if (screenshotUrls.length > 0) {
        VT_POPUP.openImageViewer(screenshotUrls, Math.max(0, startIndex));
      }
    });
  };

  /**
   * 初始化图片查看器
   */
  VT_POPUP.initImageViewer = function () {
    /**
     * 打开图片查看器
     * @param {Array<string>} imgList - 图片URL列表
     * @param {number} index - 起始索引
     */
    VT_POPUP.openImageViewer = function (imgList, index) {
      if (window.VT_IMAGE_VIEWER && typeof window.VT_IMAGE_VIEWER.showImageViewer === "function") {
        window.VT_IMAGE_VIEWER.showImageViewer(document.body, imgList, index);
      }
    };
  };

  document.addEventListener("DOMContentLoaded", () => {
    VT_POPUP.init();
  });

  if (typeof window !== "undefined") {
    window.VT_POPUP = VT_POPUP;
  }
})();