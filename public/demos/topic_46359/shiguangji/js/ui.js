/**
 * 食光机 - UI 渲染层
 * 负责所有动态内容的渲染：时光轴、相册、推荐、统计、模态框
 */
const UI = (function () {

  const MEAL_TYPE_MAP = {
    breakfast: { label: '早餐', icon: '🌅' },
    lunch: { label: '午餐', icon: '☀️' },
    dinner: { label: '晚餐', icon: '🌙' },
    snack: { label: '加餐', icon: '🍪' }
  };

  const DIFFICULTY_MAP = {
    easy: { label: '简单', color: '#5A8A6E' },
    medium: { label: '中等', color: '#D4653B' },
    hard: { label: '进阶', color: '#C0392B' }
  };

  /**
   * 格式化日期
   */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays < 7) return diffDays + '天前';

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  function formatDateFull(dateStr) {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  /**
   * 渲染时光轴
   */
  function renderTimeline(records) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    if (records.length === 0) {
      container.innerHTML = createEmptyState('还没有美食记录', '点击"记录美食"开始你的第一道菜', '🍳');
      return;
    }

    let html = '<div class="timeline-line"></div>';

    records.forEach((record, index) => {
      const isOdd = index % 2 === 0; // 第一项在左边
      const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
      const diffInfo = DIFFICULTY_MAP[record.difficulty] || DIFFICULTY_MAP.easy;

      const imageContent = record.image
        ? `<img src="${record.image}" alt="${record.dishName}" loading="lazy">`
        : `<div class="timeline-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));">${record.emoji || '🍽️'}</div>`;

      const tagsHtml = record.tags && record.tags.length > 0
        ? `<div class="timeline-tags">${record.tags.slice(0, 4).map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>`
        : '';

      const starsHtml = record.rating
        ? `<span class="timeline-rating">${'★'.repeat(record.rating)}${'☆'.repeat(5 - record.rating)}</span>`
        : '';

      html += `
        <div class="timeline-item" data-id="${record.id}">
          <div class="timeline-content ${isOdd ? 'left' : 'right'}">
            <div class="timeline-date">${formatDate(record.date)} ${mealInfo.icon} ${mealInfo.label}</div>
            <div class="timeline-title">${escapeHtml(record.dishName)}</div>
            ${tagsHtml}
            ${record.notes ? `<div class="timeline-desc">${escapeHtml(record.notes)}</div>` : ''}
            <div class="timeline-meta">
              <span class="difficulty-badge" style="color:${diffInfo.color};border-color:${diffInfo.color}">${diffInfo.label}</span>
              ${starsHtml}
            </div>
            <div class="timeline-actions">
              <button class="btn-icon" onclick="App.viewRecord('${record.id}')" title="查看详情">👁️</button>
              <button class="btn-icon" onclick="App.editRecord('${record.id}')" title="编辑">✏️</button>
              <button class="btn-icon" onclick="App.confirmDelete('${record.id}')" title="删除">🗑️</button>
            </div>
          </div>
          <div class="timeline-dot"></div>
          <div class="timeline-img">${imageContent}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * 渲染相册
   */
  function renderGallery(records) {
    const container = document.getElementById('galleryGrid');
    if (!container) return;

    if (records.length === 0) {
      container.innerHTML = createEmptyState('相册还是空的', '上传美食照片，填满你的相册', '📸');
      return;
    }

    let html = '';
    records.forEach((record, index) => {
      const isLarge = index === 0;
      const imageContent = record.image
        ? `<img src="${record.image}" alt="${record.dishName}" loading="lazy">`
        : `<div class="gallery-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));">${record.emoji || '🍽️'}</div>`;

      html += `
        <div class="gallery-item ${isLarge ? 'large' : ''}" onclick="App.viewRecord('${record.id}')">
          ${imageContent}
          <div class="gallery-overlay">
            <div class="dish-name">${escapeHtml(record.dishName)}</div>
            <div class="dish-date">${formatDateFull(record.date)}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * 渲染AI推荐
   */
  function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendList');
    if (!container) return;

    if (recommendations.length === 0) {
      container.innerHTML = '<p class="empty-text">暂无推荐，先记录几道菜吧</p>';
      return;
    }

    let html = '';
    recommendations.forEach(rec => {
      const matchColor = rec.matchScore >= 90 ? '#5A8A6E' : rec.matchScore >= 80 ? '#D4653B' : '#8C7B72';
      html += `
        <div class="recommend-item" onclick="App.addRecommendToRecord('${rec.name}')">
          <div class="rec-img">${rec.emoji || '🍽️'}</div>
          <div class="rec-info">
            <h4>${escapeHtml(rec.name)}</h4>
            <p>${rec.cuisine} · ${rec.cookTime}分钟 · ${DIFFICULTY_MAP[rec.difficulty]?.label || '简单'} · ${rec.calories}卡</p>
            <p class="rec-reason">💡 ${escapeHtml(rec.reason)}</p>
          </div>
          <div class="rec-match" style="color:${matchColor};background:${matchColor}1a;">${rec.matchScore}% 匹配</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * 渲染统计数字
   */
  function renderStatsBar(stats) {
    const elements = {
      totalRecords: document.getElementById('statTotal'),
      totalTags: document.getElementById('statTags'),
      avgRating: document.getElementById('statRating'),
      thisMonth: document.getElementById('statMonth')
    };

    if (elements.totalRecords) elements.totalRecords.textContent = stats.total;

    if (elements.totalTags) {
      elements.totalTags.textContent = Object.keys(stats.tagCount).length;
    }

    if (elements.avgRating) {
      elements.avgRating.textContent = stats.avgRating;
    }

    if (elements.thisMonth) {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      elements.thisMonth.textContent = stats.monthlyCount[monthKey] || 0;
    }
  }

  /**
   * 渲染标签筛选器
   */
  function renderTagFilter(selectedTags) {
    const container = document.getElementById('tagFilter');
    if (!container) return;

    const allTags = AIEngine.getAllTags();
    let html = '<button class="tag-filter-btn active" data-tag="">全部</button>';
    allTags.forEach(tag => {
      const isActive = selectedTags && selectedTags.includes(tag);
      html += `<button class="tag-filter-btn ${isActive ? 'active' : ''}" data-tag="${tag}">${tag}</button>`;
    });
    container.innerHTML = html;
  }

  /**
   * 渲染记录详情模态框
   */
  function renderRecordDetail(record) {
    const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
    const diffInfo = DIFFICULTY_MAP[record.difficulty] || DIFFICULTY_MAP.easy;

    const imageHtml = record.image
      ? `<img src="${record.image}" alt="${record.dishName}" class="detail-image">`
      : `<div class="detail-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));">${record.emoji || '🍽️'}</div>`;

    const tagsHtml = record.tags && record.tags.length > 0
      ? `<div class="detail-tags">${record.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>`
      : '';

    const starsHtml = record.rating
      ? `<div class="detail-rating">${'★'.repeat(record.rating)}${'☆'.repeat(5 - record.rating)}</div>`
      : '';

    return `
      <div class="detail-modal-content">
        ${imageHtml}
        <div class="detail-body">
          <h2 class="detail-title">${escapeHtml(record.dishName)}</h2>
          <div class="detail-meta">
            <span class="meta-item">📅 ${formatDateFull(record.date)}</span>
            <span class="meta-item">${mealInfo.icon} ${mealInfo.label}</span>
            <span class="meta-item difficulty-badge" style="color:${diffInfo.color};border-color:${diffInfo.color}">${diffInfo.label}</span>
          </div>
          ${starsHtml}
          ${tagsHtml}
          ${record.notes ? `<div class="detail-notes"><h4>烹饪笔记</h4><p>${escapeHtml(record.notes)}</p></div>` : ''}
          <div class="detail-actions">
            <button class="btn btn-primary" onclick="App.editRecord('${record.id}')">✏️ 编辑</button>
            <button class="btn btn-secondary" onclick="App.confirmDelete('${record.id}')">🗑️ 删除</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 创建空状态
   */
  function createEmptyState(title, desc, icon) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon || '🍽️'}</div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
    `;
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 显示Toast通知
   */
  function showToast(message, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 显示确认对话框
   */
  function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    if (!modal) return;

    msgEl.textContent = message;
    modal.classList.add('show');

    const newOk = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    newOk.addEventListener('click', () => {
      modal.classList.remove('show');
      onConfirm();
    });

    cancelBtn.onclick = () => modal.classList.remove('show');
  }

  return {
    renderTimeline,
    renderGallery,
    renderRecommendations,
    renderStatsBar,
    renderTagFilter,
    renderRecordDetail,
    createEmptyState,
    showToast,
    showConfirm,
    formatDate,
    formatDateFull,
    MEAL_TYPE_MAP,
    DIFFICULTY_MAP
  };
})();
