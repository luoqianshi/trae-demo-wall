window.ExercisePage = function(container) {
  const data = window.DemoData || {};
  const stats = data.stats || {};
  const practice = stats.practice || {};

  const masteredCount = 42;
  const wrongCount = 8;
  const totalCount = 55;
  const rate = Math.round((masteredCount / totalCount) * 100);

  const todayGoal = 5;
  const todayDone = 3;
  const todayRate = Math.round((todayDone / todayGoal) * 100);

  const goalItems = [
    { key: 'image', label: '看图选字', done: 2, total: 2, color: 'orange' },
    { key: 'audio', label: '听音选字', done: 1, total: 1, color: 'green' },
    { key: 'sentence', label: '句子练习', done: 0, total: 1, color: 'purple' },
    { key: 'pinyin', label: '拼音练习', done: 0, total: 1, color: 'blue' }
  ];

  const filterTabs = [
    { key: 'all', label: '全部' },
    { key: 'unlearned', label: '未学习' },
    { key: 'wrong', label: '错题' },
    { key: 'mastered', label: '已掌握' }
  ];

  const modeCards = [
    {
      key: 'image',
      title: '看图选字',
      desc: '看图片选择正确的汉字',
      icon: '🖼️',
      color: 'orange',
      bgClass: ''
    },
    {
      key: 'sentence',
      title: '听句子选图',
      desc: '听句子选择对应的图片',
      icon: '💬',
      color: 'green',
      bgClass: 'mode-icon-bg-sentence'
    },
    {
      key: 'pinyin',
      title: '拼音练习',
      desc: '学习拼音，打好基础',
      icon: '🎵',
      color: 'purple',
      bgClass: 'mode-icon-bg-pinyin'
    }
  ];

  container.innerHTML = `
    <div class="exercise-page page-transition">
      <div class="progress-overview">
        <div class="progress-main">
        <div class="progress-num">${masteredCount}</div>
        <div class="progress-label">已掌握汉字</div>
        </div>
        <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width: ${rate}%;"></div>
        </div>
        <div class="progress-stats">
        <div class="stat-item">
          <span class="stat-num wrong">${wrongCount}</span>
          <span class="stat-key">错题</span>
        </div>
        <div class="stat-item">
          <span class="stat-num mastered">${masteredCount}</span>
          <span class="stat-key">已掌握</span>
        </div>
        <div class="stat-item">
          <span class="stat-num rate">${rate}%</span>
          <span class="stat-key">正确率</span>
        </div>
        </div>
      </div>

      <div class="goal-card">
        <div class="goal-header">
        <div class="goal-title-row">
          <div class="goal-title">今日目标</div>
          <div class="goal-edit">${todayGoal}字</div>
        </div>
        <div class="goal-done-badge">已完成 ${todayDone} 个（${todayRate}%）</div>
        </div>
        <div class="goal-items">
        ${goalItems.map(item => {
          const percent = Math.round((item.done / item.total) * 100);
          const isDone = item.done >= item.total;
          return `
            <div class="goal-item">
            <div class="goal-item-top">
              <span class="goal-item-label">${item.label}</span>
              <span class="goal-item-count">${item.done}/${item.total}</span>
            </div>
            <div class="goal-item-bar-wrap">
              <div class="goal-item-bar ${isDone ? 'done' : ''}" style="width: ${percent}%;"></div>
            </div>
            </div>
          `;
        }).join('')}
        </div>
      </div>

      <div class="mode-section">
        <div class="section-label">学习模式</div>
        <div class="mode-tabs">
        ${filterTabs.map((tab, idx) => `
          <div class="mode-tab ${idx === 0 ? 'active' : ''}">${tab.label}</div>
        `).join('')}
        </div>
      </div>

      ${modeCards.map(card => `
        <div class="mode-card" onclick="navigateTo('quiz')">
        <div class="mode-icon-wrap">
          <div class="mode-icon-bg ${card.bgClass}"></div>
          <span class="mode-icon">${card.icon}</span>
        </div>
        <div class="mode-body">
          <div class="mode-title">${card.title}</div>
          <div class="mode-desc">${card.desc}</div>
        </div>
        <div class="mode-arrow">
          <span class="arrow-icon">›</span>
        </div>
        </div>
      `).join('')}

      <div class="tip-card">
        <span class="tip-icon">💡</span>
        <span>每天坚持练习，效果更好哦！</span>
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;
};
