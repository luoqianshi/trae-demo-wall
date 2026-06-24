// 抽屉面板模块。使用 HTML 中已有的抽屉元素，负责打开/关闭和渲染帖子详情。

// 打开抽屉并加载帖子详情
function openDrawer(postId) {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  if (!drawer || !overlay) return;

  // 显示抽屉
  drawer.style.display = "block";
  overlay.style.display = "block";
  document.body.style.overflow = "hidden";

  // 延迟添加 show class 触发 CSS transition
  setTimeout(() => {
    drawer.classList.add("show");
    overlay.classList.add("show");
  }, 10);

  // 显示加载中
  const body = document.getElementById("drawer-body");
  if (body) body.innerHTML = '<div class="loading">加载中...</div>';

  // 绑定关闭事件（只绑定一次）
  _bindDrawerCloseEvents();

  // 加载帖子详情
  API.getPostDetail(postId).then(post => {
    if (post.error) {
      if (body) body.innerHTML = `<div class="error-msg">${escapeHtml(post.error)}</div>`;
      return;
    }
    renderDrawerContent(post);
  }).catch(err => {
    if (body) body.innerHTML = `<div class="error-msg">加载失败: ${escapeHtml(err.message)}</div>`;
  });
}

// 渲染抽屉内容
function renderDrawerContent(post) {
  const title = document.getElementById("drawer-title");
  const author = document.getElementById("drawer-author");
  const tags = document.getElementById("drawer-tags");
  const stats = document.getElementById("drawer-stats");
  const body = document.getElementById("drawer-body");
  const link = document.getElementById("drawer-link");
  const trendContainer = document.getElementById("drawer-trend-chart");

  if (title) title.textContent = post.title || "无标题";

  if (author) {
    author.innerHTML = `<span>作者: ${escapeHtml(post.author || "-")}</span> <span>发布: ${formatDate(post.created_at)}</span>`;
  }

  if (tags) {
    const tagsHtml = (post.tags || []).map(renderTrackTag).join(" ") || '<span class="muted">无标签</span>';
    tags.innerHTML = tagsHtml;
  }

  if (stats) {
    stats.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${formatNumber(post.like_count)}</div>
        <div class="stat-label">点赞</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(post.vote_count)}</div>
        <div class="stat-label">投票</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(post.views)}</div>
        <div class="stat-label">浏览</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(post.posts_count)}</div>
        <div class="stat-label">评论</div>
      </div>`;
  }

  if (body) {
    let bodyHtml = "";
    if (post.possibly_deleted) {
      bodyHtml += '<div class="deleted-warning">! 该帖子可能已被论坛删除，以下为本地缓存数据</div>';
    }
    bodyHtml += post.safe_html || "<p>暂无正文</p>";
    body.innerHTML = bodyHtml;
  }

  if (link) {
    link.href = post.url || "#";
  }

  // 加载趋势小图
  if (trendContainer && post.id) {
    // 创建 canvas 元素
    trendContainer.innerHTML = '<canvas id="drawer-trend-canvas" width="400" height="150"></canvas>';
    const canvas = document.getElementById("drawer-trend-canvas");
    if (canvas) {
      API.getTrend(post.id, 7).then(trendData => {
        if (trendData.dates && trendData.dates.length > 0) {
          drawTrendChart(canvas, trendData, {
            colors: { views: "#00d97e", likes: "#f59e0b", votes: "#f97316" },
          });
        } else {
          trendContainer.innerHTML = '<div class="muted">暂无趋势数据</div>';
        }
      }).catch(() => {
        trendContainer.innerHTML = '<div class="muted">趋势数据加载失败</div>';
      });
    }
  }
}

// 关闭抽屉
function closeDrawer() {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  if (!drawer || !overlay) return;

  drawer.classList.remove("show");
  overlay.classList.remove("show");
  document.body.style.overflow = "";

  // 延迟隐藏，等动画完成
  setTimeout(() => {
    drawer.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}

// 绑定关闭事件（只绑定一次）
let _drawerEventsBound = false;
function _bindDrawerCloseEvents() {
  if (_drawerEventsBound) return;
  _drawerEventsBound = true;

  const closeBtn = document.getElementById("drawer-close");
  const overlay = document.getElementById("drawer-overlay");

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
}
