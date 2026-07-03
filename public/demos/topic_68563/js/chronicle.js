// ==================== 编年册渲染模块 ====================

let currentYear = null;

/**
 * 渲染年份标签
 */
function renderYearTabs() {
  const storyData = getStoryData();
  const years = Object.keys(storyData).sort();
  const container = document.getElementById('yearTabs');
  
  if (years.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = years.map((year, i) => `
    <button class="year-tab ${i === 0 ? 'active' : ''}" data-year="${year}" onclick="switchYear('${year}')">
      ${year}年 (${storyData[year].length})
    </button>
  `).join('');

  currentYear = years[0];
}

/**
 * 切换年份
 */
function switchYear(year) {
  currentYear = year;
  document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-year="${year}"]`)?.classList.add('active');
  renderChronicle(year);
}

/**
 * 渲染编年册内容
 * @param {string} year - 年份
 */
function renderChronicle(year) {
  const storyData = getStoryData();
  const events = storyData[year] || [];
  const container = document.getElementById('chronicleContent');

  if (events.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">暂无照片</p>';
    return;
  }

  const yearSubtitle = `共 ${events.length} 个值得记住的时刻`;

  let html = `
    <div class="year-title">
      <h3>${year}年</h3>
      <p>${yearSubtitle}</p>
    </div>
    <div class="story-events">
  `;

  events.forEach(event => {
    const imgSrc = event.srcPath
      || (event.fullBase64 ? `data:image/jpeg;base64,${event.fullBase64}` : '')
      || (event.thumbnail ? `data:image/jpeg;base64,${event.thumbnail}` : '');
    
    html += `
      <div class="event-card">
        <div class="event-date">
          <div class="day">${event.day}</div>
          <div class="month">${event.month}</div>
        </div>
        <div class="event-content">
          ${imgSrc ? `
          <div class="event-photo" onclick="openLightbox('${imgSrc}')">
            <img src="${imgSrc}" alt="${event.title}">
          </div>` : ''}
          <h3 class="event-title">${escapeHtml(event.title)}</h3>
          <div class="event-story">"${escapeHtml(event.story)}"</div>
          <div class="event-tags">
            ${event.tags.map(t => `<span class="event-tag">#${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 初始化编年册页面
 */
function initChroniclePage() {
  renderYearTabs();
  if (currentYear) {
    renderChronicle(currentYear);
  }
  
  // 更新副标题
  const storyData = getStoryData();
  const total = Object.values(storyData).reduce((sum, arr) => sum + arr.length, 0);
  document.getElementById('chronicleSubtitle').textContent = 
    `AI从${getPhotoCount()}张照片中挖掘了${total}个值得记住的故事`;
}
