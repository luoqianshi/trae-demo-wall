/**
 * 食光机 - 相册页逻辑
 */

// ===== 状态管理 =====
let allRecords = [];
let currentFilter = { keyword: '', mealType: '' };

// ===== 初始化 =====
(async function () {
  const user = await checkAuth();
  if (!user) return;

  await renderNav('gallery');

  bindEvents();

  await loadRecords();
})();

/**
 * 绑定事件
 */
function bindEvents() {
  // 搜索
  document.getElementById('gallerySearch').addEventListener('input', debounce(function (e) {
    currentFilter.keyword = e.target.value.trim();
    renderGallery();
  }, 300));

  // 餐次筛选
  document.getElementById('galleryMealFilter').addEventListener('change', function (e) {
    currentFilter.mealType = e.target.value;
    renderGallery();
  });
}

/**
 * 加载记录
 */
async function loadRecords() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = createLoadingState('正在加载美食相册...');

  try {
    const res = await API.getRecords();
    if (res.success && res.data) {
      allRecords = res.data;
      renderGallery();
    }
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

/**
 * 筛选记录
 */
function getFilteredRecords() {
  return allRecords.filter(function (record) {
    if (currentFilter.keyword) {
      const kw = currentFilter.keyword.toLowerCase();
      if (!record.dishName || !record.dishName.toLowerCase().includes(kw)) return false;
    }
    if (currentFilter.mealType && record.mealType !== currentFilter.mealType) return false;
    return true;
  });
}

/**
 * 渲染相册
 */
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const records = getFilteredRecords();

  if (records.length === 0) {
    grid.innerHTML = createEmptyState('相册还是空的', '上传美食照片，填满你的相册', '📸');
    return;
  }

  // 按日期降序排列
  records.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  let html = '';
  records.forEach(function (record, index) {
    const isLarge = index === 0;
    const imgUrl = getRecordImageUrl(record);

    const imageContent = imgUrl
      ? '<img src="' + imgUrl + '" alt="' + escapeHtml(record.dishName) + '" loading="lazy">'
      : '<div class="gallery-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));">' + (record.emoji || '🍽️') + '</div>';

    const tagsHtml = (record.tags && record.tags.length > 0)
      ? '<div class="dish-tags">' + record.tags.slice(0, 3).map(function (t) { return '<span class="tag-chip">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
      : '';

    html +=
      '<div class="gallery-item' + (isLarge ? ' large' : '') + '" onclick="viewGalleryRecord(' + record.id + ')">' +
      imageContent +
      '<div class="gallery-overlay">' +
      '<div class="dish-name">' + escapeHtml(record.dishName) + '</div>' +
      '<div class="dish-date">' + formatDateFull(record.date) + '</div>' +
      tagsHtml +
      '</div>' +
      '</div>';
  });

  grid.innerHTML = html;
}

/**
 * 查看记录详情
 */
function viewGalleryRecord(id) {
  const record = allRecords.find(function (r) { return r.id == id; });
  if (!record) return;

  const content = document.getElementById('detailContent');
  // 相册页只显示详情，不提供编辑/删除（跳转到时光轴编辑）
  content.innerHTML = renderRecordDetail(record, false, false);

  // 添加跳转编辑的按钮
  const body = content.querySelector('.detail-actions');
  if (body) {
    body.innerHTML = '<a href="timeline.html" class="btn btn-primary btn-sm">前往时光轴管理</a>';
  }

  document.getElementById('detailModal').classList.add('show');
}
