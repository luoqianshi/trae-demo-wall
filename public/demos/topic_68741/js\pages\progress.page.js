window.ProgressPage = function(container) {
  const data = window.DemoData || {};
  const stats = data.stats || {};
  const totalLearned = stats.totalLearned || 128;
  const streakDays = stats.streakDays || 7;
  const practice = stats.practice || {};

  const statItems = [
    { key: 'image', title: '看图选字', icon: '🖼️', iconClass: 'image-icon', data: practice.image || { done: 86, total: 120, mastered: 65 } },
    { key: 'audio', title: '听音选字', icon: '🔊', iconClass: 'audio-icon', data: practice.audio || { done: 72, total: 100, mastered: 50 } },
    { key: 'sentence', title: '听句子选图', icon: '💬', iconClass: 'sentence-icon', data: practice.sentence || { done: 58, total: 90, mastered: 40 } },
    { key: 'pinyin', title: '拼音练习', icon: '🎵', iconClass: 'pinyin-icon', data: practice.pinyin || { done: 95, total: 150, mastered: 70 } }
  ];

  const actionItems = [
    { icon: '📝', title: '错题本', desc: '回顾做错的题目，查漏补缺' },
    { icon: '⭐', title: '收藏夹', desc: '收藏的汉字和重点内容' },
    { icon: '📅', title: '学习日历', desc: '查看每日学习记录' },
    { icon: '⚙️', title: '设置', desc: '个性化设置与偏好' }
  ];

  container.innerHTML = `
    <div class="progress-page page-transition">
      <div class="hero-card">
        <div class="hero-decoration deco-circle-1"></div>
        <div class="hero-decoration deco-circle-2"></div>
        <div class="hero-decoration deco-dot"></div>

        <div class="streak-badge">
          <span class="streak-fire">🔥</span>
          <span>连续${streakDays}天</span>
        </div>

        <div class="hero-content">
          <div class="hero-num">${totalLearned}</div>
          <div class="hero-label">已学汉字</div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 8px;">
        <div class="section-dot"></div>
        <text>练习统计</text>
      </div>

      <div class="stat-section">
        ${statItems.map(item => `
          <div class="stat-card">
            <div class="stat-icon-wrap ${item.iconClass}">
              <span class="stat-icon">${item.icon}</span>
            </div>
            <div class="stat-info">
              <div class="stat-title">${item.title}</div>
              <div class="stat-detail">
                <div class="stat-item">
                  <span class="stat-value highlight">${item.data.done}/${item.data.total}</span>
                  <span class="stat-key">已做/总数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">${item.data.mastered}</span>
                  <span class="stat-key">已掌握</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-title" style="margin-top: 8px;">
        <div class="section-dot"></div>
        <text>更多功能</text>
      </div>

      <div class="action-section">
        ${actionItems.map(item => `
          <div class="action-card">
            <span class="action-icon">${item.icon}</span>
            <div class="action-body">
              <div class="action-title">${item.title}</div>
              <div class="action-desc">${item.desc}</div>
            </div>
            <span class="action-arrow">›</span>
          </div>
        `).join('')}
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;
};
