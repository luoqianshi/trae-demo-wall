window.StorybookPage = function(container) {
  const data = window.DemoData || {};
  const storybooks = data.storybooks || [];

  const gradeTabs = [
    { key: 'grade1', label: '一年级' },
    { key: 'grade2', label: '二年级' },
    { key: 'grade3', label: '三年级' }
  ];

  const diffTabs = [
    { key: 'all', label: '全部' },
    { key: '简单', label: '简单' },
    { key: '中等', label: '中等' },
    { key: '困难', label: '困难' }
  ];

  let activeGrade = 'grade1';
  let activeDiff = 'all';

  function getDifficultyColor(diff) {
    if (diff === '困难') return { bg: 'var(--color-berry-bg)', color: 'var(--color-error)', dot: '#EF4444' };
    if (diff === '中等') return { bg: 'var(--color-butter-bg)', color: 'var(--color-warning)', dot: '#F59E0B' };
    return { bg: 'var(--color-mint-bg)', color: 'var(--color-success)', dot: '#10B981' };
  }

  function getDifficultyEmoji(diff) {
    if (diff === '困难') return '🔴';
    if (diff === '中等') return '🟡';
    return '🟢';
  }

  function render() {
    let filteredBooks = storybooks;

    if (activeDiff !== 'all') {
      filteredBooks = filteredBooks.filter(book => book.difficulty === activeDiff);
    }

    const hardBooks = filteredBooks.filter(b => b.difficulty === '困难');
    const mediumBooks = filteredBooks.filter(b => b.difficulty === '中等');
    const easyBooks = filteredBooks.filter(b => b.difficulty === '简单');

    const groups = [
      { title: '困难', subtitle: 'L1困难', emoji: '🔴', books: hardBooks, dotColor: '#EF4444' },
      { title: '中等', subtitle: 'L1中等', emoji: '🟡', books: mediumBooks, dotColor: '#F59E0B' },
      { title: '简单', subtitle: 'L1简单', emoji: '🟢', books: easyBooks, dotColor: '#10B981' }
    ];

    container.innerHTML = `
      <div class="storybook-page page-transition">
        <div class="page-header">
          <div class="page-title">课本绘本</div>
          <div class="page-subtitle">从故事中学习汉字</div>
        </div>

        <div class="grade-tabs">
          ${gradeTabs.map(tab => `
            <div class="grade-tab ${activeGrade === tab.key ? 'active' : ''}" onclick="switchGradeTab('${tab.key}')">
              ${tab.label}
            </div>
          `).join('')}
        </div>

        <div class="diff-tabs">
          ${diffTabs.map(tab => `
            <div class="diff-tab ${activeDiff === tab.key ? 'active' : ''}" onclick="switchDiffTab('${tab.key}')">
              ${tab.label}
            </div>
          `).join('')}
        </div>

        ${groups.map(group => group.books.length > 0 ? `
          <div class="diff-group">
            <div class="group-header">
              <div class="group-dot" style="background: ${group.dotColor};"></div>
              <div class="group-title">${group.emoji} ${group.title}（${group.subtitle}）</div>
              <div class="group-count">${group.books.length}本</div>
            </div>
            <div class="book-list">
              ${group.books.map(book => {
                const diffColor = getDifficultyColor(book.difficulty);
                return `
                  <div class="book-card">
                    <div class="book-cover-wrap">
                      <div class="book-cover-placeholder">${book.coverEmoji}</div>
                    </div>
                    <div class="book-info">
                      <div class="book-title">${book.title}</div>
                      <div class="book-meta">
                        <span class="book-diff-tag" style="background: ${diffColor.bg}; color: ${diffColor.color};">${book.difficulty}</span>
                        <span>${book.pages}页</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : '').join('')}

        <div style="height: 20px;"></div>
      </div>
    `;
  }

  window.switchGradeTab = function(tabKey) {
    activeGrade = tabKey;
    render();
  };

  window.switchDiffTab = function(tabKey) {
    activeDiff = tabKey;
    render();
  };

  render();
};
