window.CategoryPage = function(container) {
  const esc = window.escapeHtml;
  const data = window.DemoData || {};
  const categories = data.categories || [];

  container.innerHTML = `
    <div class="category-page page-transition">
      <div class="page-header">
        <div class="page-title">识字分类</div>
        <div class="page-subtitle">按主题分类，系统化学习汉字</div>
      </div>

      <div class="cat-grid">
        ${categories.map((cat, index) => {
          const learned = Math.floor(cat.totalChars * (cat.progress / 100));
          return `
            <div class="cat-item cat-${index % 6}" onclick="navigateTo('grid', {categoryIndex: ${index}})">
              <div class="cat-icon-wrap">
                <span class="cat-emoji">${esc(cat.emoji)}</span>
              </div>
              <div class="cat-info">
                <div class="cat-name">${esc(cat.name)}</div>
                <div class="cat-count">
                  <span class="count-num">${learned}</span>
                  <span class="count-divider">/</span>
                  <span class="count-total">${cat.totalChars}</span>
                  <span class="count-unit">字</span>
                </div>
                <div class="cat-progress">
                  <div class="cat-progress-fill" style="width: ${cat.progress}%;"></div>
                </div>
              </div>
              <div class="cat-arrow-wrap">
                <span class="cat-arrow">›</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;
};
