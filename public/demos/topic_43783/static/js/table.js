// 表格渲染模块。负责渲染帖子表格、排序、分页。

// 赛道标签颜色映射
const TRACK_COLORS = {
  "生活娱乐": "#22c55e",
  "学习工作": "#3b82f6",
  "社会服务": "#f97316",
  "硬件交互": "#a855f7",
  "社会公益": "#ec4899",
};

// HTML 转义，防止 XSS
function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// 格式化数字（千分位）
function formatNumber(n) {
  if (n == null) return "0";
  return Number(n).toLocaleString("zh-CN");
}

// 格式化日期，取 YYYY-MM-DD 部分
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return String(dateStr).slice(0, 10);
}

// 渲染单个赛道标签 pill
function renderTrackTag(tag) {
  const color = TRACK_COLORS[tag] || "#6b7280";
  // 颜色加 1a 透明度作为背景，40 作为边框
  return `<span class="track-pill" style="background:${color}1a;color:${color};border:1px solid ${color}40;">${escapeHtml(tag)}</span>`;
}

// 渲染表格到指定容器
// data: { posts: [...], total, page, per_page, total_pages }
// options: { sort, order, onSort, onPageChange, onRowClick }
function renderTable(container, data, options = {}) {
  if (!container) return;
  const { posts = [] } = data;
  const { sort, order, onSort, onRowClick } = options;

  if (!posts.length) {
    renderEmptyState(container, "暂无数据");
    return;
  }

  // 表头列定义
  const columns = [
    { key: "rank", label: "排名", sortable: false },
    { key: "title", label: "标题", sortable: false },
    { key: "author", label: "作者", sortable: false },
    { key: "tags", label: "赛道标签", sortable: false },
    { key: "views", label: "浏览", sortable: true },
    { key: "like_count", label: "点赞", sortable: true },
    { key: "vote_count", label: "投票", sortable: true },
    { key: "posts_count", label: "评论", sortable: true },
    { key: "created_at", label: "发布时间", sortable: true },
    { key: "actions", label: "操作", sortable: false },
  ];

  let html = '<div class="table-wrapper"><table class="data-table">';

  // 表头
  html += '<thead><tr>';
  for (const col of columns) {
    if (col.sortable) {
      const isActive = sort === col.key;
      const arrow = isActive ? (order === "desc" ? " ▼" : " ▲") : "";
      html += `<th class="sortable" data-sort="${col.key}">${escapeHtml(col.label)}<span class="sort-arrow">${arrow}</span></th>`;
    } else {
      html += `<th>${escapeHtml(col.label)}</th>`;
    }
  }
  html += '</tr></thead>';

  // 表体
  html += '<tbody>';
  for (const post of posts) {
    const tagsHtml = (post.tags || []).map(renderTrackTag).join(" ") || '<span class="muted">-</span>';
    html += `<tr data-post-id="${post.id}">`;
    html += `<td>${post.rank || "-"}</td>`;
    html += `<td class="title-cell"><div class="title-text" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div></td>`;
    html += `<td>${escapeHtml(post.author || "-")}</td>`;
    html += `<td>${tagsHtml}</td>`;
    html += `<td>${formatNumber(post.views)}</td>`;
    html += `<td>${formatNumber(post.like_count)}</td>`;
    html += `<td>${formatNumber(post.vote_count)}</td>`;
    html += `<td>${formatNumber(post.posts_count)}</td>`;
    html += `<td>${formatDate(post.created_at)}</td>`;
    html += `<td class="actions-cell"><button class="btn-similar" data-similar-id="${post.id}" title="查找与该帖子相似的作品">相似</button></td>`;
    html += '</tr>';
  }
  html += '</tbody></table></div>';

  container.innerHTML = html;

  // 绑定表头排序事件
  if (onSort) {
    container.querySelectorAll("th.sortable").forEach(th => {
      th.addEventListener("click", () => {
        const sortKey = th.dataset.sort;
        // 同列再次点击切换升降序，否则默认降序
        const newOrder = (sort === sortKey && order === "desc") ? "asc" : "desc";
        onSort(sortKey, newOrder);
      });
    });
  }

  // 绑定行点击事件
  if (onRowClick) {
    container.querySelectorAll("tbody tr").forEach(tr => {
      tr.addEventListener("click", () => {
        const postId = parseInt(tr.dataset.postId, 10);
        onRowClick(postId);
      });
    });
  }

  // 绑定「相似」按钮点击事件（阻止冒泡，避免触发行点击）
  container.querySelectorAll(".btn-similar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.dataset.similarId, 10);
      if (postId && typeof jumpToSimilar === "function") {
        jumpToSimilar(postId);
      }
    });
  });
}

// 渲染分页栏
// data: { total, page, per_page, total_pages }
// onPageChange(page, perPage): 页码或每页条数变化时回调
function renderPagination(container, data, onPageChange) {
  if (!container) return;
  const { total, page, per_page, total_pages } = data;

  // 只有 1 页或无数据时隐藏分页栏
  if (!total_pages || total_pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = '<div class="pagination">';

  // 上一页
  const prevDisabled = page <= 1;
  html += `<button class="page-btn" data-page="${page - 1}" ${prevDisabled ? "disabled" : ""}>上一页</button>`;

  // 页码按钮（最多显示 7 个，超出用省略号）
  const maxButtons = 7;
  let start = Math.max(1, page - 3);
  let end = Math.min(total_pages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  if (start > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (start > 2) html += '<span class="page-ellipsis">...</span>';
  }

  for (let i = start; i <= end; i++) {
    const isCurrent = i === page;
    html += `<button class="page-btn ${isCurrent ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (end < total_pages) {
    if (end < total_pages - 1) html += '<span class="page-ellipsis">...</span>';
    html += `<button class="page-btn" data-page="${total_pages}">${total_pages}</button>`;
  }

  // 下一页
  const nextDisabled = page >= total_pages;
  html += `<button class="page-btn" data-page="${page + 1}" ${nextDisabled ? "disabled" : ""}>下一页</button>`;

  // 每页条数选择器
  html += `<span class="per-page">每页 <select class="per-page-select">
    <option value="20" ${per_page === 20 ? "selected" : ""}>20</option>
    <option value="50" ${per_page === 50 ? "selected" : ""}>50</option>
    <option value="100" ${per_page === 100 ? "selected" : ""}>100</option>
  </select> 条</span>`;

  html += `<span class="total-info">共 ${total} 条</span>`;
  html += '</div>';

  container.innerHTML = html;

  // 绑定页码点击
  container.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const p = parseInt(btn.dataset.page, 10);
      if (onPageChange) onPageChange(p);
    });
  });

  // 绑定每页条数变化
  const perPageSelect = container.querySelector(".per-page-select");
  if (perPageSelect) {
    perPageSelect.addEventListener("change", () => {
      const newPerPage = parseInt(perPageSelect.value, 10);
      if (onPageChange) onPageChange(1, newPerPage);
    });
  }
}

// 渲染空状态
function renderEmptyState(container, message = "暂无数据") {
  if (!container) return;
  container.innerHTML = `<div class="empty-state">
    <div class="empty-icon">[ ]</div>
    <div class="empty-message">${escapeHtml(message)}</div>
  </div>`;
}

// 渲染首次无数据提示
function renderNoDataPrompt(container) {
  if (!container) return;
  container.innerHTML = `<div class="no-data-prompt">
    <div class="prompt-icon">&gt;_</div>
    <h3>暂无数据</h3>
    <p>系统尚未爬取任何帖子数据，请点击下方按钮进行首次爬取。</p>
    <button class="btn btn-primary" id="btn-first-scrape">开始爬取</button>
  </div>`;
}
