// 主应用逻辑。负责 Tab 切换、初始化各模块、事件绑定、状态轮询。

// 应用状态
const state = {
  currentTab: "leaderboard",
  sort: "views",
  order: "desc",
  page: 1,
  perPage: 50,
  searchQuery: "",
  trendDays: 14,
  updatePolling: null,
};

// Tab 配置：每个 Tab 对应一个初始化函数
const TABS = {
  leaderboard: { init: initLeaderboard },
  tracks: { init: initTracks },
  generator: { init: initGenerator },
  manage: { init: initManage },
};

// 页面加载完成后初始化应用
document.addEventListener("DOMContentLoaded", () => {
  restoreStateFromUrl();
  initTabs();
  initEventStatus();
  initLastUpdateTime();
  switchTab(state.currentTab);
});

// ========== URL 状态管理 ==========

function restoreStateFromUrl() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.get("tab")) state.currentTab = params.get("tab");
  if (params.get("sort")) state.sort = params.get("sort");
  if (params.get("order")) state.order = params.get("order");
  if (params.get("page")) state.page = parseInt(params.get("page"), 10);
  if (params.get("per_page")) state.perPage = parseInt(params.get("per_page"), 10);
  if (params.get("q")) {
    state.searchQuery = params.get("q");
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = state.searchQuery;
  }
}

function updateUrlHash() {
  const params = new URLSearchParams({
    tab: state.currentTab,
    sort: state.sort,
    order: state.order,
    page: String(state.page),
    per_page: String(state.perPage),
  });
  if (state.searchQuery) {
    params.set("q", state.searchQuery);
  }
  window.location.hash = params.toString();
}

// ========== Tab 切换 ==========

function initTabs() {
  document.querySelectorAll(".tab-item").forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  window.addEventListener("hashchange", () => {
    restoreStateFromUrl();
    updateTabActive(state.currentTab);
    showTabContent(state.currentTab);
  });
}

function switchTab(tab) {
  if (!TABS[tab]) return;
  state.currentTab = tab;
  updateTabActive(tab);
  showTabContent(tab);
  updateUrlHash();

  if (TABS[tab] && TABS[tab].init) TABS[tab].init();
}

// 从排行榜/搜索表格打开相似作品抽屉
function jumpToSimilar(postId) {
  openSimilarDrawer(postId);
}

// ========== 相似作品抽屉 ==========
let _similarDrawerEventsBound = false;
let _similarDrawerAnchorId = null;
let _similarDrawerThreshold = 0.5;

function openSimilarDrawer(postId) {
  const drawer = document.getElementById("similar-drawer");
  const overlay = document.getElementById("similar-drawer-overlay");
  if (!drawer || !overlay) return;

  _similarDrawerAnchorId = postId;
  _similarDrawerThreshold = 0.5;

  // 绑定事件（只绑一次）
  if (!_similarDrawerEventsBound) {
    _similarDrawerEventsBound = true;
    bindSimilarDrawerEvents();
  }

  // 重置控件
  const slider = document.getElementById("similar-drawer-threshold");
  const valueLabel = document.getElementById("similar-drawer-threshold-value");
  const demoOnly = document.getElementById("similar-drawer-demo-only");
  if (slider) slider.value = _similarDrawerThreshold;
  if (valueLabel) valueLabel.textContent = _similarDrawerThreshold.toFixed(2);
  if (demoOnly) demoOnly.checked = true;

  // 显示抽屉
  drawer.style.display = "block";
  overlay.style.display = "block";
  // 触发动画
  requestAnimationFrame(() => {
    drawer.classList.add("show");
    overlay.classList.add("show");
  });

  // 加载数据
  loadSimilarDrawerData();
}

function closeSimilarDrawer() {
  const drawer = document.getElementById("similar-drawer");
  const overlay = document.getElementById("similar-drawer-overlay");
  if (!drawer || !overlay) return;
  drawer.classList.remove("show");
  overlay.classList.remove("show");
  // 等动画结束再隐藏
  setTimeout(() => {
    drawer.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}

function bindSimilarDrawerEvents() {
  const closeBtn = document.getElementById("similar-drawer-close");
  const overlay = document.getElementById("similar-drawer-overlay");
  const slider = document.getElementById("similar-drawer-threshold");
  const valueLabel = document.getElementById("similar-drawer-threshold-value");
  const demoOnly = document.getElementById("similar-drawer-demo-only");

  if (closeBtn) closeBtn.addEventListener("click", closeSimilarDrawer);
  if (overlay) overlay.addEventListener("click", closeSimilarDrawer);

  let debounceTimer = null;
  if (slider) {
    slider.addEventListener("input", () => {
      _similarDrawerThreshold = parseFloat(slider.value);
      if (valueLabel) valueLabel.textContent = _similarDrawerThreshold.toFixed(2);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadSimilarDrawerData, 300);
    });
  }

  if (demoOnly) {
    demoOnly.addEventListener("change", loadSimilarDrawerData);
  }
}

function loadSimilarDrawerData() {
  const anchorEl = document.getElementById("similar-drawer-anchor");
  const resultsEl = document.getElementById("similar-drawer-results");
  if (!resultsEl || !_similarDrawerAnchorId) return;

  resultsEl.innerHTML = '<div class="loading">加载中...</div>';
  const demoOnly = document.getElementById("similar-drawer-demo-only")?.checked ?? true;

  API.getSimilar(_similarDrawerAnchorId, _similarDrawerThreshold, demoOnly).then(data => {
    if (data.error) {
      resultsEl.innerHTML = `<div class="muted">${escapeHtml(data.error)}</div>`;
      return;
    }

    // 渲染锚点摘要
    if (anchorEl && data.anchor) {
      const a = data.anchor;
      const tagsHtml = (a.tags || []).map(renderTrackTag).join(" ") || '<span class="muted">无标签</span>';
      anchorEl.innerHTML = `
        <div class="anchor-label">锚点帖子</div>
        <div class="anchor-title">${escapeHtml(a.title || "")}</div>
        <div class="anchor-meta">
          <span class="muted">作者: ${escapeHtml(a.author || "-")}</span>
          ${tagsHtml}
        </div>
        <div class="anchor-excerpt">${escapeHtml(a.excerpt || "")}</div>
      `;
    }

    if (!data.results || data.results.length === 0) {
      resultsEl.innerHTML = '<div class="muted">未找到与该帖子相似度超过阈值的其他作品</div>';
      return;
    }

    let html = `<div class="similar-summary" style="color:var(--text-secondary);font-size:12px;font-family:var(--font-mono);margin-bottom:8px;">共 ${data.total} 个相似作品（阈值 ${data.threshold}）</div>`;
    data.results.forEach(post => {
      const simPercent = (post.similarity * 100).toFixed(1);
      const simColor = post.similarity >= 0.85 ? "#ef4444" : (post.similarity >= 0.7 ? "#f97316" : "#eab308");
      const tagsHtml = (post.tags || []).map(renderTrackTag).join(" ") || "";
      html += `<div class="similar-drawer-item" data-id="${post.id}" data-url="${escapeHtml(post.url || "")}">
        <div class="similar-drawer-item-header">
          <span class="sim-pct" style="color:${simColor};">${simPercent}%</span>
          <span class="sim-title">${escapeHtml(post.title || "")}</span>
        </div>
        <div class="similar-drawer-item-meta">
          <span class="muted">${escapeHtml(post.author || "-")}</span>
          ${tagsHtml}
          <span class="muted">${formatNumber(post.views || 0)} 浏览</span>
          <span class="muted">${formatNumber(post.like_count || 0)} 点赞</span>
          <span class="muted">${formatNumber(post.vote_count || 0)} 票</span>
        </div>
        <div class="similar-drawer-item-excerpt">${escapeHtml(post.excerpt || "")}</div>
      </div>`;
    });
    resultsEl.innerHTML = html;

    // 点击结果项 → 在新窗口打开论坛原帖
    resultsEl.querySelectorAll(".similar-drawer-item").forEach(item => {
      item.addEventListener("click", () => {
        const url = item.dataset.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });
  }).catch(err => {
    resultsEl.innerHTML = `<div class="muted">加载失败: ${escapeHtml(err.message)}</div>`;
  });
}

function updateTabActive(tab) {
  document.querySelectorAll(".tab-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tab === tab);
  });
}

function showTabContent(tab) {
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tab}`);
  });
}

// ========== 排行榜（含搜索） ==========

let _leaderboardEventsBound = false;

function initLeaderboard() {
  const tableContainer = document.getElementById("leaderboard-table-container");
  const paginationContainer = document.getElementById("leaderboard-pagination");
  if (!tableContainer) return;

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("btn-search");

  // 绑定搜索事件（只绑一次）
  if (!_leaderboardEventsBound) {
    _leaderboardEventsBound = true;
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          state.searchQuery = searchInput.value.trim();
          state.page = 1;
          updateUrlHash();
          loadLeaderboard();
        }
      });
    }
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        state.searchQuery = searchInput.value.trim();
        state.page = 1;
        updateUrlHash();
        loadLeaderboard();
      });
    }
  }

  // 恢复搜索框内容
  if (searchInput && state.searchQuery) {
    searchInput.value = state.searchQuery;
  }

  loadLeaderboard();
}

function loadLeaderboard() {
  const tableContainer = document.getElementById("leaderboard-table-container");
  const paginationContainer = document.getElementById("leaderboard-pagination");
  if (!tableContainer) return;

  const demoOnly = document.getElementById("search-demo-only")?.checked ?? true;

  // 有搜索词 → 调搜索 API，无搜索词 → 调全量 API
  if (state.searchQuery) {
    API.search(state.searchQuery, demoOnly, {
      sort: state.sort || "relevance",
      order: state.order,
      page: state.page,
      per_page: state.perPage,
    }).then(data => {
      renderLeaderboardResults(tableContainer, paginationContainer, data, true);
    }).catch(err => {
      renderEmptyState(tableContainer, "搜索失败: " + err.message);
    });
  } else {
    API.getPosts({
      sort: state.sort,
      order: state.order,
      page: state.page,
      per_page: state.perPage,
      demo_only: demoOnly ? "1" : "0",
    }).then(data => {
      renderLeaderboardResults(tableContainer, paginationContainer, data, false);
    }).catch(err => {
      renderEmptyState(tableContainer, "加载失败: " + err.message);
    });
  }
}

function renderLeaderboardResults(tableContainer, paginationContainer, data, isSearch) {
  if (!data.posts || data.posts.length === 0) {
    if (data.total === 0) {
      if (isSearch) {
        renderEmptyState(tableContainer, `未找到包含 "${state.searchQuery}" 的帖子`);
      } else {
        renderNoDataPrompt(tableContainer);
        const btn = document.getElementById("btn-first-scrape");
        if (btn) btn.addEventListener("click", handleFirstScrape);
      }
    } else {
      renderEmptyState(tableContainer, "当前页无数据");
    }
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  renderTable(tableContainer, data, {
    sort: state.sort,
    order: state.order,
    onSort: (sort, order) => {
      state.sort = sort;
      state.order = order;
      state.page = 1;
      updateUrlHash();
      loadLeaderboard();
    },
    onPageChange: (page, perPage) => {
      if (perPage) state.perPage = perPage;
      state.page = page;
      updateUrlHash();
      loadLeaderboard();
    },
    onRowClick: (postId) => openDrawer(postId),
  });

  if (paginationContainer) {
    renderPagination(paginationContainer, data, (page, perPage) => {
      if (perPage) state.perPage = perPage;
      state.page = page;
      updateUrlHash();
      loadLeaderboard();
    });
  }
}

function handleFirstScrape() {
  const btn = document.getElementById("btn-first-scrape");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "爬取中...";
  }
  API.firstScrape().then(res => {
    if (res.success) {
      alert("首次爬取已启动，请稍后在数据管理 Tab 查看进度");
      startUpdatePolling();
    } else {
      alert("爬取失败: " + (res.message || "未知错误"));
      if (btn) { btn.disabled = false; btn.textContent = "开始爬取"; }
    }
  }).catch(err => {
    alert("请求失败: " + err.message);
    if (btn) { btn.disabled = false; btn.textContent = "开始爬取"; }
  });
}

// ========== 赛道分析 Tab ==========

// 赛道顺序（与后端 TRACK_TAGS 一致）
const TRACK_TAGS_ORDER = ["生活娱乐", "学习工作", "社会服务", "硬件交互", "社会公益"];

let _tracksData = null;        // 赛道数据缓存
let _currentTrack = null;      // 当前选中赛道
let _selectedKeywords = new Set(); // 选中的关键词（交集筛选）
let _trackSortField = "views"; // 帖子列表排序字段
let _trackSortOrder = "desc";  // 帖子列表排序方向

function initTracks() {
  const container = document.getElementById("tracks-container");
  if (!container) return;

  if (_tracksData) {
    renderTracks(container, _tracksData);
    return;
  }

  container.innerHTML = '<div class="loading">加载中...</div>';
  API.getTracks().then(data => {
    if (!data.tracks) {
      renderEmptyState(container, "暂无数据");
      return;
    }
    _tracksData = data;
    if (!_currentTrack || !data.tracks[_currentTrack]) {
      _currentTrack = TRACK_TAGS_ORDER.find(t => data.tracks[t] && data.tracks[t].count > 0)
        || TRACK_TAGS_ORDER[0];
    }
    renderTracks(container, data);
  }).catch(err => {
    renderEmptyState(container, "加载失败: " + err.message);
  });
}

function renderTracks(container, data) {
  let html = '<div class="tracks-overview">';
  html += `<span class="tracks-total">参赛帖总数: ${data.total}</span>`;
  if (data.untagged_count > 0) {
    html += `<span class="tracks-untagged">未分类: ${data.untagged_count}</span>`;
  }
  html += '</div>';

  // 赛道切换器
  html += '<div class="track-switcher">';
  for (const track of TRACK_TAGS_ORDER) {
    const stats = data.tracks[track];
    if (!stats) continue;
    const active = track === _currentTrack ? " active" : "";
    const color = TRACK_COLORS[track] || "#6b7280";
    html += `<button class="track-switcher-btn${active}" data-track="${escapeHtml(track)}" style="--track-color:${color};">${escapeHtml(track)} <span class="track-switcher-count">${stats.count}</span></button>`;
  }
  html += '</div>';

  // 当前赛道看板
  const stats = data.tracks[_currentTrack];
  if (stats) {
    html += renderTrackBoard(_currentTrack, stats, data.total);
  }

  container.innerHTML = html;

  // 绑定赛道切换
  container.querySelectorAll(".track-switcher-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      _currentTrack = btn.dataset.track;
      _selectedKeywords = new Set(); // 切换赛道时清空筛选
      renderTracks(container, _tracksData);
    });
  });

  // 绑定关键词点击
  container.querySelectorAll(".kw-bar").forEach(bar => {
    bar.addEventListener("click", () => {
      const word = bar.dataset.kw;
      if (_selectedKeywords.has(word)) {
        _selectedKeywords.delete(word);
      } else {
        _selectedKeywords.add(word);
      }
      renderTracks(container, _tracksData);
    });
  });

  // 绑定排序切换
  container.querySelectorAll(".track-sort-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      _trackSortField = btn.dataset.sort;
      _trackSortOrder = _trackSortOrder === "desc" ? "asc" : "desc";
      renderTracks(container, _tracksData);
    });
  });

  // 绑定帖子行点击 → 打开详情抽屉
  container.querySelectorAll(".track-post-row").forEach(row => {
    row.addEventListener("click", () => {
      const postId = parseInt(row.dataset.id, 10);
      if (postId) openDrawer(postId);
    });
  });
}

function renderTrackBoard(track, stats, total) {
  const color = TRACK_COLORS[track] || "#6b7280";
  const ratio = stats.ratio;

  let html = '<div class="track-board">';

  // 概览栏
  html += `<div class="track-board-header" style="border-left:3px solid ${color};">
    <div class="track-board-title" style="color:${color};">${escapeHtml(track)}</div>
    <div class="track-board-count">${stats.count} 帖 / ${total} 总帖 (${ratio.toFixed(1)}%)</div>
  </div>`;

  // 关键词分布（Canvas 柱状图 + 点击筛选）
  html += renderKeywordChart(stats.keywords, color);

  // 帖子列表
  html += renderTrackPostList(stats.posts, color);

  html += '</div>';
  return html;
}

function renderKeywordChart(keywords, color) {
  if (!keywords || keywords.length === 0) {
    return '<div class="muted" style="padding:12px 0;">暂无关键词数据</div>';
  }

  // 取前 15 个关键词
  const topKw = keywords.slice(0, 15);
  const maxCount = topKw[0].count;

  let html = '<div class="kw-section">';
  html += '<div class="kw-title">// 标题关键词分布（点击筛选）</div>';
  html += '<div class="kw-chart">';

  topKw.forEach(kw => {
    const selected = _selectedKeywords.has(kw.word);
    const barWidth = maxCount > 0 ? (kw.count / maxCount * 100).toFixed(1) : 0;
    html += `<div class="kw-row ${selected ? "selected" : ""}">
      <span class="kw-label">${escapeHtml(kw.word)}</span>
      <div class="kw-bar" data-kw="${escapeHtml(kw.word)}" style="flex:1;height:20px;position:relative;cursor:pointer;">
        <div class="kw-bar-fill" style="width:${barWidth}%;background:${selected ? color : color}80;"></div>
      </div>
      <span class="kw-count">${kw.count}</span>
    </div>`;
  });

  html += '</div></div>';
  return html;
}

function renderTrackPostList(posts, color) {
  if (!posts || posts.length === 0) {
    return '<div class="muted" style="padding:12px 0;">暂无帖子</div>';
  }

  // 按选中关键词筛选（交集）
  let filtered = posts;
  if (_selectedKeywords.size > 0) {
    filtered = posts.filter(p => {
      const title = (p.title || "").toLowerCase();
      for (const kw of _selectedKeywords) {
        if (!title.includes(kw.toLowerCase())) return false;
      }
      return true;
    });
  }

  // 排序
  const sortField = _trackSortField;
  const sortOrder = _trackSortOrder;
  filtered = [...filtered].sort((a, b) => {
    const va = a[sortField] || 0;
    const vb = b[sortField] || 0;
    return sortOrder === "desc" ? vb - va : va - vb;
  });

  // 分页：只显示前 50
  const displayPosts = filtered.slice(0, 50);

  const sortCol = (field, label) => {
    if (_trackSortField === field) {
      const arrow = _trackSortOrder === "desc" ? " ↓" : " ↑";
      return `<button class="track-sort-btn active" data-sort="${field}">${label}${arrow}</button>`;
    }
    return `<button class="track-sort-btn" data-sort="${field}">${label}</button>`;
  };

  let html = '<div class="track-post-section">';
  html += `<div class="track-post-header">
    <span class="track-post-title-text">帖子列表（${filtered.length} 条${_selectedKeywords.size > 0 ? "，已筛选" : ""}，显示前 50）</span>
    <div class="track-post-sorts">
      ${sortCol("views", "浏览")}
      ${sortCol("like_count", "点赞")}
      ${sortCol("vote_count", "投票")}
      ${sortCol("reply_count", "评论")}
    </div>
  </div>`;

  if (displayPosts.length === 0) {
    html += '<div class="muted" style="padding:24px;text-align:center;">没有匹配的帖子</div>';
  } else {
    html += '<div class="track-post-list">';
    displayPosts.forEach(p => {
      html += `<div class="track-post-row" data-id="${p.id}">
        <span class="track-post-title">${escapeHtml(p.title)}</span>
        <span class="track-post-author">${escapeHtml(p.author || "-")}</span>
        <span class="track-post-stat">${formatNumber(p.views || 0)} 浏览</span>
        <span class="track-post-stat">${formatNumber(p.like_count || 0)} 赞</span>
        <span class="track-post-stat">${formatNumber(p.vote_count || 0)} 票</span>
        <span class="track-post-stat">${formatNumber(p.reply_count || 0)} 评论</span>
      </div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ========== 数据管理 Tab ==========

function initManage() {
  const updateBtn = document.getElementById("btn-update");
  const exportCsvBtn = document.getElementById("btn-export-csv");
  const exportJsonBtn = document.getElementById("btn-export-json");
  const trendCanvas = document.getElementById("trend-canvas");

  // 更新按钮 - 直接触发更新，无需密码
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      updateBtn.disabled = true;
      updateBtn.textContent = "更新中...";
      API.update("").then(res => {
        if (res.success) {
          startUpdatePolling();
        } else {
          alert(res.message || "更新失败");
          updateBtn.disabled = false;
          updateBtn.textContent = "触发增量更新";
        }
      }).catch(err => {
        alert("请求失败: " + err.message);
        updateBtn.disabled = false;
        updateBtn.textContent = "触发增量更新";
      });
    });
  }

  // 导出
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      window.location.href = API.exportData("csv", true);
    });
  }
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      window.location.href = API.exportData("json", true);
    });
  }

  // 趋势图天数切换
  document.querySelectorAll(".trend-days-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".trend-days-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.trendDays = parseInt(btn.dataset.days, 10);
      loadSiteTrend(trendCanvas);
    });
  });

  loadUpdateLog();
  loadSiteTrend(trendCanvas);
  startUpdatePolling();
}

// 更新进度轮询
function startUpdatePolling() {
  if (state.updatePolling) return;

  const poll = () => {
    API.getStatus().then(status => {
      updateStatusDisplay(status);
      if (status.is_updating || status.state === "running") {
        state.updatePolling = setTimeout(poll, 2000);
      } else {
        state.updatePolling = null;
        // 更新完成后恢复按钮
        const updateBtn = document.getElementById("btn-update");
        if (updateBtn) {
          updateBtn.disabled = false;
          updateBtn.textContent = "触发增量更新";
        }
        // 更新完成后刷新排行榜
        if (state.currentTab === "leaderboard") initLeaderboard();
        // 刷新更新日志
        loadUpdateLog();
      }
    }).catch(() => {
      state.updatePolling = setTimeout(poll, 5000);
    });
  };

  poll();
}

function updateStatusDisplay(status) {
  const progressContainer = document.getElementById("update-progress");
  const progressBar = progressContainer ? progressContainer.querySelector(".progress-bar-fill") : null;
  const statusText = document.getElementById("update-status-text");
  const lastUpdatedEl = document.getElementById("last-updated");

  if (status.is_updating || status.state === "running") {
    if (progressContainer) progressContainer.style.display = "block";
    let etaText = "";
    if (status.total > 0 && status.current > 0 && status.started_at) {
      const elapsed = (Date.now() - new Date(status.started_at).getTime()) / 1000;
      const speed = status.current / elapsed;
      const remaining = (status.total - status.current) / speed;
      if (remaining > 0 && remaining < 3600) {
        etaText = `（预计剩余 ${Math.ceil(remaining)}s）`;
      }
    }
    if (progressBar && status.total > 0) {
      const percent = Math.round((status.current / status.total) * 100);
      progressBar.style.width = percent + "%";
    } else if (progressBar) {
      progressBar.style.width = "100%";
    }
    if (statusText) statusText.textContent = (status.message || "正在更新中...") + etaText;
  } else {
    if (progressContainer) progressContainer.style.display = "none";
    if (statusText) {
      if (status.state === "success") {
        statusText.textContent = status.message || "更新完成";
      } else if (status.state === "error") {
        statusText.textContent = status.message || "更新失败";
      } else {
        statusText.textContent = "系统就绪，等待更新";
      }
    }
  }

  if (lastUpdatedEl && status.updated_at) {
    lastUpdatedEl.textContent = formatDate(status.updated_at);
  }
}

function loadUpdateLog() {
  const container = document.getElementById("update-log-container");
  if (!container) return;

  API.getUpdateLog().then(data => {
    if (!data.logs || data.logs.length === 0) {
      container.innerHTML = '<div class="muted">暂无更新日志</div>';
      return;
    }

    let html = '<div class="log-list">';
    data.logs.forEach(log => {
      const time = formatDate(log.time);
      const statusBadge = log.status === "success" ? "✓" : (log.status === "error" ? "✗" : "");
      const detail = `新增 ${log.new_posts || 0} 条，共 ${log.total_posts || 0} 条，耗时 ${log.elapsed_seconds || 0}s`;
      html += `<div class="log-item">
        <span class="log-time">${time} ${statusBadge}</span>
        <span class="log-message">${escapeHtml(detail)}</span>
        ${log.error ? `<span class="log-error">${escapeHtml(log.error)}</span>` : ""}
        ${log.warning ? `<span class="log-error">${escapeHtml(log.warning)}</span>` : ""}
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }).catch(() => {
    container.innerHTML = '<div class="muted">日志加载失败</div>';
  });
}

function loadSiteTrend(canvas) {
  if (!canvas) return;

  API.getTrend(null, state.trendDays).then(data => {
    if (data.dates && data.dates.length > 0) {
      drawTrendChart(canvas, data, {
        colors: { views: "#00d97e", likes: "#22c55e", votes: "#f97316" },
      });
    } else {
      const parent = canvas.parentElement;
      if (parent) parent.innerHTML = '<div class="muted">暂无趋势数据（需要至少 2 天的快照）</div>';
    }
  }).catch(() => {
    const parent = canvas.parentElement;
    if (parent) parent.innerHTML = '<div class="muted">趋势数据加载失败</div>';
  });
}

// ========== 赛事状态检查 ==========

function initEventStatus() {
  API.getEventStatus().then(data => {
    if (data.event_ended) {
      const banner = document.getElementById("event-ended-banner");
      if (banner) {
        banner.style.display = "block";
        banner.textContent = `赛事已于 ${data.event_end_date} 结束，数据不再自动更新`;
      }
    }
  }).catch(() => {});
}

function initLastUpdateTime() {
  API.getStatus().then(status => {
    const el = document.getElementById("last-updated");
    if (el && status.updated_at) {
      el.textContent = formatDate(status.updated_at);
    }
  }).catch(() => {});
}
