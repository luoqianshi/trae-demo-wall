/**
 * VidBuddy 管理中心 - 历史记录模块
 * 负责播放历史、笔记、截图的展示与管理
 */
(function () {
  const VT_DASHBOARD_HISTORY = {};

  /** 历史记录容器 */
  let historyContainer = null;
  /** 视频统计数量元素 */
  let statVideosCount = null;
  /** 笔记统计数量元素 */
  let statNotesCount = null;
  /** 截图统计数量元素 */
  let statSnapsCount = null;
  /** 搜索文本 */
  let searchText = "";
  /** 搜索防抖定时器 */
  let searchDebounceTimer = null;

  /**
   * 初始化历史记录模块
   */
  VT_DASHBOARD_HISTORY.init = function () {
    historyContainer = document.getElementById("history-container");
    statVideosCount = document.getElementById("stat-videos-count");
    statNotesCount = document.getElementById("stat-notes-count");
    statSnapsCount = document.getElementById("stat-snaps-count");

    const globalSearch = document.getElementById("global-search");
    if (globalSearch) {
      globalSearch.addEventListener("input", (e) => {
        searchText = e.target.value.toLowerCase().trim();
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          VT_DASHBOARD_HISTORY.loadAndRender();
        }, 300);
      });
    }

    const btnClearAllData = document.getElementById("btn-clear-all-data");
    if (btnClearAllData) {
      btnClearAllData.addEventListener("click", () => {
        if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
          window.VT_MODAL.showConfirm({
            title: "清空所有数据",
            message:
              "⚠️ 确定要清空所有播放历史、标记点和截图吗？此操作不可恢复！",
            icon: "warning",
          }).then((confirmed) => {
            if (confirmed) {
              chrome.storage.local.get(null, (allData) => {
                const keysToRemove = [];
                for (const key of Object.keys(allData)) {
                  if (key === "markers" || key === "screenshots" || key === "progressHistory" || key.startsWith("screenshot_")) {
                    keysToRemove.push(key);
                  }
                }
                if (keysToRemove.length > 0) {
                  chrome.storage.local.remove(keysToRemove, () => {
                    if (window.VT_MODAL && window.VT_MODAL.showToast) {
                      window.VT_MODAL.showToast("🗑️ 所有数据已清空！", "success");
                    }
                    VT_DASHBOARD_HISTORY.loadAndRender();
                  });
                } else {
                  if (window.VT_MODAL && window.VT_MODAL.showToast) {
                    window.VT_MODAL.showToast("🗑️ 所有数据已清空！", "success");
                  }
                  VT_DASHBOARD_HISTORY.loadAndRender();
                }
              });
            }
          });
        }
      });
    }

    VT_DASHBOARD_HISTORY.loadAndRender();
  };

  /**
   * 生成视频ID的备用匹配ID
   * 用于处理同一视频不同集数的ID匹配问题
   * @param {string} videoId - 视频ID
   * @returns {Array<string>} 备用ID列表
   */
  function generateFallbackIds(videoId) {
    const fallbackIds = [];
    if (!videoId || typeof videoId !== "string") {
      return fallbackIds;
    }
    if (videoId.startsWith("bili_") && videoId.includes("_p")) {
      const baseId = videoId.split("_p")[0];
      fallbackIds.push(baseId);
    }
    if (videoId.startsWith("iq_")) {
      const parts = videoId.split("_");
      if (parts.length > 2) {
        fallbackIds.push(`${parts[0]}_${parts[1]}`);
      }
    }
    return fallbackIds;
  }

  /**
   * 加载并渲染历史记录
   * 执行流程：
   * 1. 显示加载状态动画
   * 2. 从存储读取所有数据（历史、标记、截图）
   * 3. 根据配置更新统计面板显隐
   * 4. 更新统计数据（视频数、笔记数、截图数）
   * 5. 调用 renderHistory 渲染列表
   */
  VT_DASHBOARD_HISTORY.loadAndRender = function () {
    if (historyContainer) {
      historyContainer.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
      `;
    }

    chrome.storage.local.get(null, (allData) => {
      if (chrome.runtime.lastError) {
        console.error("VidBuddy: 加载存储失败:", chrome.runtime.lastError);
        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("❌ 加载数据失败，请刷新页面重试", "error");
        }
        return;
      }
      allData = allData || {};
      const history = allData.progressHistory || [];
      const markers = allData.markers || [];
      const screenshots = allData.screenshots || [];

      // 消费 prefShowStats 参数，联动控制顶部统计面板显隐
      const statsPanel = document.getElementById("stats-panel");
      if (statsPanel) {
        const showStats = allData.prefShowStats === true;
        statsPanel.style.display = showStats ? "grid" : "none";
        statsPanel.style.marginBottom = showStats ? "32px" : "0";
      }

      if (statVideosCount) statVideosCount.innerText = history.length;
      if (statNotesCount) {
        const realNotes = markers.filter(
          (m) =>
            !m.screenshotId && !(m.note && m.note.startsWith("📷 截图锚点")),
        );
        statNotesCount.innerText = realNotes.length;
      }
      if (statSnapsCount) statSnapsCount.innerText = screenshots.length;

      VT_DASHBOARD_HISTORY.renderHistory(
        history,
        markers,
        screenshots,
        allData,
        searchText,
      );
    });
  };

  /**
   * 渲染历史记录列表
   * 渲染逻辑：
   * 1. 记录当前展开状态，保持用户操作体验
   * 2. 根据搜索文本过滤历史
   * 3. 为每个历史项创建卡片，包含标题、平台标签、进度条、操作按钮
   * 4. 渲染笔记列表和截图网格（可折叠）
   * 5. 绑定交互事件（鼠标悬停效果、点击跳转、删除、查看截图等）
   * @param {Array} history - 播放历史列表
   * @param {Array} markers - 标记点列表
   * @param {Array} screenshots - 截图列表
   * @param {Object} allData - 所有存储数据
   * @param {string} filterText - 搜索过滤文本
   */
  VT_DASHBOARD_HISTORY.renderHistory = function (
    history,
    markers,
    screenshots,
    allData,
    filterText,
  ) {
    if (!historyContainer) return;

    const openNotesVideoIds = new Set();
    const openSnapsVideoIds = new Set();
    document.querySelectorAll(".history-card").forEach((c) => {
      const videoId = c.getAttribute("data-id");
      if (videoId) {
        const notesSection = c.querySelector(".card-markers-section");
        const snapsSection = c.querySelector(".card-screenshots-section");
        if (notesSection && notesSection.style.display === "block") {
          openNotesVideoIds.add(videoId);
        }
        if (snapsSection && snapsSection.style.display === "block") {
          openSnapsVideoIds.add(videoId);
        }
      }
    });

    let filtered = history;
    if (filterText) {
      filtered = history.filter(
        (item) =>
          item.title.toLowerCase().includes(filterText) ||
          item.platform.toLowerCase().includes(filterText),
      );
    }

    if (filtered.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-artwork">
            <div class="artwork-circle"></div>
            <div class="artwork-rect"></div>
            <div class="artwork-triangle"></div>
          </div>
          <div class="empty-title">探索你的学习旅程</div>
          <div class="empty-desc">暂无匹配的播放历史记录，快去视频网页记录你的第一个笔记吧！</div>
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = "";
    filtered.forEach((item, index) => {
      const percent = Math.round(
        Math.min(100, Math.max(0, (item.currentTime / item.duration) * 100)),
      );
      const fallbackIds = generateFallbackIds(item.id);
      const allMatchIds = [item.id, ...fallbackIds];

      const videoMarkers = markers
        .filter(
          (m) =>
            allMatchIds.includes(m.videoId) &&
            !m.screenshotId &&
            !(m.note && m.note.startsWith("📷 截图锚点")),
        )
        .sort((a, b) => a.time - b.time);
      const videoScreenshots = screenshots
        .filter((s) => allMatchIds.includes(s.videoId))
        .sort((a, b) => a.timestamp - b.timestamp);

      const notesCount = videoMarkers.length;
      const snapsCount = videoScreenshots.length;

      const card = document.createElement("div");
      card.className = "history-card";
      card.setAttribute("data-id", item.id);
      card.style.animationDelay = `${index * 0.06}s`;

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });

      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--mouse-x", "50%");
        card.style.setProperty("--mouse-y", "50%");
      });

      const isNotesOpen = openNotesVideoIds.has(item.id);
      const isSnapsOpen = openSnapsVideoIds.has(item.id);

      let markersHtml = "";
      if (notesCount > 0) {
        markersHtml = `
          <div class="card-markers-section" style="display: ${isNotesOpen ? "block" : "none"};">
            <div class="markers-title">
              <svg class="btn-svg-icon" style="margin-right: 6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <span>视频文字笔记打点 (${notesCount} 条)：</span>
            </div>
            <div class="markers-dashboard-list">
        `;
        videoMarkers.forEach((mk) => {
          const matchedSnap = videoScreenshots.find(
            (s) => Math.abs(s.timestamp - mk.time) < 0.5,
          );
          let previewHtml = "";
          if (matchedSnap) {
            const imageKey = `screenshot_${matchedSnap.id}`;
            const imgData = allData[imageKey] || matchedSnap.image;
            if (imgData) {
              previewHtml = `
                <div class="marker-screenshot-preview" data-id="${matchedSnap.id}" title="点击新窗口放大查看高清截图">
                  <img src="${imgData}" class="marker-preview-img" />
                </div>
              `;
            }
          }

          let cleanNote = mk.note || "";
          if (cleanNote.startsWith("📷 截图锚点 @")) {
            cleanNote = "截图锚点";
          }

          markersHtml += `
            <div class="marker-dashboard-item" data-time="${mk.time}" style="border-left-color: ${mk.color || "rgba(168, 85, 247, 0.5)"} !important;" title="点击新窗口直接闪回到此播放点">
              <div class="marker-left-group">
                <span class="marker-time-badge">${VT_UTILS.formatTime(mk.time)}</span>
                <span class="marker-note-text" data-note="${encodeURIComponent(cleanNote)}"></span>
              </div>
              ${previewHtml}
              <div class="marker-dash-actions">
                <button class="marker-dash-edit" data-id="${mk.id}" title="编辑此笔记">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
                <button class="marker-dash-delete" data-id="${mk.id}" title="删除此打点">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        });
        markersHtml += `</div></div>`;
      }

      let snapsHtml = "";
      if (snapsCount > 0) {
        snapsHtml = `
          <div class="card-screenshots-section" style="display: ${isSnapsOpen ? "block" : "none"};">
            <div class="screenshots-title">
              <svg class="btn-svg-icon" style="margin-right: 6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span>视频截图墙 (${snapsCount} 张)：</span>
            </div>
            <div class="snaps-dashboard-grid">
        `;
        videoScreenshots.forEach((snap) => {
          const imageKey = `screenshot_${snap.id}`;
          const imgData = allData[imageKey] || snap.image;
          if (imgData) {
            snapsHtml += `
              <div class="snap-grid-item" data-id="${snap.id}">
                <div class="snap-img-wrapper">
                  <img src="${imgData}" class="snap-grid-img" alt="截图 ${VT_UTILS.formatTime(snap.timestamp)}" title="${VT_UTILS.formatTime(snap.timestamp)}" />
                  <div class="snap-hover-overlay">
                    <button class="overlay-action-btn jump-snap-video" data-id="${snap.id}" title="跳转至播放点">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                    <button class="overlay-action-btn zoom-snap" data-id="${snap.id}" title="放大查看">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                    <button class="overlay-action-btn download-snap" data-id="${snap.id}" title="下载截图">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    <button class="overlay-action-btn delete-snap" data-id="${snap.id}" title="删除此截图">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <div class="snap-grid-info">
                  <span class="snap-time-label">⏱️ ${VT_UTILS.formatTime(snap.timestamp)}</span>
                </div>
              </div>
            `;
          }
        });
        snapsHtml += `</div></div>`;
      }

      const notesBtnHtml =
        notesCount > 0
          ? `<button class="card-toggle-btn btn-notes-toggle ${isNotesOpen ? "active" : ""}" data-id="${item.id}" data-section="notes">
              <span>📝 笔记 (${notesCount})</span>
              <svg class="toggle-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>`
          : "";
      const snapsBtnHtml =
        snapsCount > 0
          ? `<button class="card-toggle-btn btn-snaps-toggle ${isSnapsOpen ? "active" : ""}" data-id="${item.id}" data-section="snaps">
              <span>📷 截图 (${snapsCount})</span>
              <svg class="toggle-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>`
          : "";

      card.innerHTML = `
        <div class="card-header" data-id="${item.id}">
          <div class="card-title-group">
            <h3 class="card-title" title="点击新窗口打开视频并恢复进度"></h3>
            <div class="card-meta-line">
              <span class="card-badge"></span>
            </div>
          </div>
          <div class="card-actions-wrapper">
            ${notesBtnHtml}
            ${snapsBtnHtml}
            <button class="card-delete-btn" data-id="${item.id}" title="删除此记录">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="card-progress-meta">
          <span class="card-percent-badge">${percent}%</span>
          <span class="card-time">${VT_UTILS.formatTime(item.currentTime)} / ${VT_UTILS.formatTime(item.duration)}</span>
        </div>
        <div class="card-progress-track">
          <div class="card-progress-fill" style="width: ${percent}%;"></div>
        </div>
        ${markersHtml}
        ${snapsHtml}`;
      card.querySelector(".card-title").textContent = item.title || "未命名视频";
      card.querySelector(".card-badge").textContent = item.platform || "未知";

      card.querySelectorAll(".marker-note-text").forEach((el) => {
        const note = el.getAttribute("data-note");
        el.textContent = note ? decodeURIComponent(note) : "";
        el.removeAttribute("data-note");
      });

      historyContainer.appendChild(card);
    });

    VT_DASHBOARD_HISTORY.bindEvents();
  };

  /**
   * 绑定历史记录相关事件
   */
  VT_DASHBOARD_HISTORY.bindEvents = function () {
    document.querySelectorAll(".btn-notes-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const videoId = e.currentTarget.getAttribute("data-id");
        const card = document.querySelector(
          `.history-card[data-id="${videoId}"]`,
        );
        if (card) {
          const section = card.querySelector(".card-markers-section");
          const btnEl = card.querySelector(".btn-notes-toggle");
          if (section) {
            const isBlock = section.style.display === "block";
            section.style.display = isBlock ? "none" : "block";
            if (btnEl) btnEl.classList.toggle("active", !isBlock);
          }
        }
      });
    });

    document.querySelectorAll(".btn-snaps-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const videoId = e.currentTarget.getAttribute("data-id");
        const card = document.querySelector(
          `.history-card[data-id="${videoId}"]`,
        );
        if (card) {
          const section = card.querySelector(".card-screenshots-section");
          const btnEl = card.querySelector(".btn-snaps-toggle");
          if (section) {
            const isBlock = section.style.display === "block";
            section.style.display = isBlock ? "none" : "block";
            if (btnEl) btnEl.classList.toggle("active", !isBlock);
          }
        }
      });
    });

    document.querySelectorAll(".card-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const videoId = e.currentTarget.getAttribute("data-id");

        if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
          const confirmed = await window.VT_MODAL.showConfirm({
            title: "删除播放历史",
            message:
              "确定要删除该视频的播放历史吗？（这会同步删除其图文笔记与截图，且不可恢复）",
            icon: "warning",
          });
          if (!confirmed) return;
        }

        if (window.VT_STORAGE && window.VT_STORAGE.deleteProgress) {
          await window.VT_STORAGE.deleteProgress(videoId);
        } else {
          chrome.storage.local.get(null, (allData) => {
            const history = allData.progressHistory || [];
            const updatedHistory = history.filter((p) => p.id !== videoId);
            const markers = allData.markers || [];
            const updatedMarkers = markers.filter((m) => m.videoId !== videoId);
            const screenshots = allData.screenshots || [];
            const updatedScreenshots = screenshots.filter((s) => s.videoId !== videoId);
            const deleteKeys = updatedScreenshots
              .filter((s) => !updatedScreenshots.includes(s))
              .map((s) => `screenshot_${s.id}`);
            chrome.storage.local.remove(deleteKeys, () => {
              chrome.storage.local.set({
                progressHistory: updatedHistory,
                markers: updatedMarkers,
                screenshots: updatedScreenshots,
              });
            });
          });
        }

        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast(
            "🗑️ 已成功彻底删除该播放历史及关联图文笔记",
            "warning",
          );
        }
        VT_DASHBOARD_HISTORY.loadAndRender();
      });
    });

    document.querySelectorAll(".marker-dash-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const markerId = e.currentTarget.getAttribute("data-id");

        if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
          const confirmed = await window.VT_MODAL.showConfirm({
            title: "删除笔记",
            message: "确定要删除这条打点笔记吗？",
            icon: "warning",
          });
          if (!confirmed) return;
        }

        if (window.VT_STORAGE && window.VT_STORAGE.deleteMarker) {
          await window.VT_STORAGE.deleteMarker(markerId);
        }

        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("🗑️ 笔记已成功删除", "warning");
        }
        VT_DASHBOARD_HISTORY.loadAndRender();
      });
    });

    document.querySelectorAll(".delete-snap").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const screenshotId = e.currentTarget.getAttribute("data-id");

        if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
          const confirmed = await window.VT_MODAL.showConfirm({
            title: "删除截图",
            message: "确定要删除这张视频截图吗？（不可恢复）",
            icon: "warning",
          });
          if (!confirmed) return;
        }

        if (window.VT_STORAGE && window.VT_STORAGE.deleteScreenshot) {
          await window.VT_STORAGE.deleteScreenshot(screenshotId);
        }

        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("🗑️ 截图已成功删除", "warning");
        }
        VT_DASHBOARD_HISTORY.loadAndRender();
      });
    });

    document.querySelectorAll(".marker-screenshot-preview").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");
        chrome.storage.local.get(null, (allData) => {
          const imageKey = `screenshot_${id}`;
          const imgData = allData[imageKey];
          if (
            imgData &&
            window.VT_IMAGE_VIEWER &&
            window.VT_IMAGE_VIEWER.showImageViewer
          ) {
            window.VT_IMAGE_VIEWER.showImageViewer(document.body, [imgData], 0);
          }
        });
      });
    });

    document.querySelectorAll(".download-snap").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");
        chrome.storage.local.get(null, (allData) => {
          const imageKey = `screenshot_${id}`;
          const imgData = allData[imageKey];
          if (imgData) {
            const link = document.createElement("a");
            link.href = imgData;
            link.download = `vidbuddy-snapshot-${id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      });
    });

    document.querySelectorAll(".zoom-snap").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");
        chrome.storage.local.get(null, (allData) => {
          const card = btn.closest(".history-card");
          const videoId = card ? card.getAttribute("data-id") : null;
          const screenshots = allData.screenshots || [];
          const videoSnaps = screenshots.filter((s) => s.videoId === videoId);
          const imgList = videoSnaps.map((s) => allData[`screenshot_${s.id}`]).filter(Boolean);
          const currentIndex = videoSnaps.findIndex((s) => s.id === id);
          if (
            imgList.length > 0 &&
            window.VT_IMAGE_VIEWER &&
            window.VT_IMAGE_VIEWER.showImageViewer
          ) {
            window.VT_IMAGE_VIEWER.showImageViewer(document.body, imgList, currentIndex >= 0 ? currentIndex : 0);
          }
        });
      });
    });

    document.querySelectorAll(".jump-snap-video").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const screenshotId = e.currentTarget.getAttribute("data-id");
        chrome.storage.local.get(
          { screenshots: [], progressHistory: [] },
          (res) => {
            const screenshots = res.screenshots || [];
            const history = res.progressHistory || [];
            const snap = screenshots.find((s) => s.id === screenshotId);
            if (snap) {
              const item = history.find((h) => h.id === snap.videoId);
              if (item && item.url) {
                const url = new URL(item.url);
                url.searchParams.set("vt_t", Math.floor(snap.timestamp).toString());
                chrome.storage.local.get({ prefJumpMode: "newTab" }, (modeRes) => {
                  const jumpMode = modeRes.prefJumpMode || "newTab";
                  if (jumpMode === "currentTab") {
                    chrome.tabs.update({ url: url.toString() });
                  } else {
                    chrome.tabs.create({ url: url.toString() });
                  }
                });
              }
            }
          },
        );
      });
    });

    document.querySelectorAll(".marker-dashboard-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".marker-dash-actions")) return;
        const time = item.getAttribute("data-time");
        const cardHeader = item.closest(".card-header");
        const videoId = cardHeader ? cardHeader.getAttribute("data-id") : null;
        if (!time || !videoId) return;
        chrome.storage.local.get({ progressHistory: [] }, (res) => {
          const history = res.progressHistory || [];
          const historyItem = history.find((h) => h.id === videoId);
          if (historyItem && historyItem.url) {
            const url = new URL(historyItem.url);
            url.searchParams.set("vt_t", Math.floor(parseFloat(time)).toString());
            chrome.storage.local.get({ prefJumpMode: "newTab" }, (modeRes) => {
              const jumpMode = modeRes.prefJumpMode || "newTab";
              if (jumpMode === "currentTab") {
                chrome.tabs.update({ url: url.toString() });
              } else {
                chrome.tabs.create({ url: url.toString() });
              }
            });
          }
        });
      });
    });

    document.querySelectorAll(".card-title").forEach((title) => {
      title.addEventListener("click", (e) => {
        const cardHeader = e.currentTarget.closest(".card-header");
        const videoId = cardHeader.getAttribute("data-id");
        chrome.storage.local.get({ progressHistory: [] }, (res) => {
          const history = res.progressHistory || [];
          const item = history.find((h) => h.id === videoId);
          if (item && item.url) {
            const url = new URL(item.url);
            url.searchParams.set("vt_t", Math.floor(item.currentTime).toString());
            chrome.storage.local.get({ prefJumpMode: "newTab" }, (modeRes) => {
              const jumpMode = modeRes.prefJumpMode || "newTab";
              if (jumpMode === "currentTab") {
                chrome.tabs.update({ url: url.toString() });
              } else {
                chrome.tabs.create({ url: url.toString() });
              }
            });
          }
        });
      });
    });
  };

  if (typeof window !== "undefined") {
    window.VT_DASHBOARD_HISTORY = VT_DASHBOARD_HISTORY;
  }
})();
