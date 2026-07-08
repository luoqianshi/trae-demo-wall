window.HomePage = function(container) {
  const data = window.DemoData || {};
  const stats = data.stats || {};
  const totalLearned = stats.totalLearned || 128;
  const streakDays = stats.streakDays || 7;
  const totalWords = stats.totalWords || 1343;

  container.innerHTML = `
    <div class="home-page page-transition">
      <div class="hero">
        <div class="hero-top">
          <div class="hero-title">你好，今天想学点什么呢？</div>
          <div class="hero-badge">每日学习 · 积少成多</div>
        </div>
        <div class="hero-decoration">
          <div class="deco-item deco-1">📚</div>
          <div class="deco-item deco-2">✨</div>
          <div class="deco-item deco-3">🌟</div>
        </div>
      </div>

      <div class="stats-card">
        <div class="stats-item">
          <div class="stats-num-wrap">
            <span class="stats-num">${totalLearned}</span>
            <span style="font-size: 14px; color: var(--color-text-secondary); font-weight: 500;">字</span>
          </div>
          <div class="stats-label">已学汉字</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <div class="stats-num-wrap">
            <span class="stats-num">${streakDays}</span>
            <span class="streak-icon">🔥</span>
          </div>
          <div class="stats-label">连续天数</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <div class="stats-num-wrap">
            <span class="stats-num">${totalWords}</span>
          </div>
          <div class="stats-label">总字数</div>
        </div>
      </div>

      <div class="section-title">
        <div class="section-dot"></div>
        <text>学习入口</text>
      </div>

      <div class="entry-card" onclick="navigateTo('category')">
        <div class="entry-icon-wrap">
          <div class="entry-icon-bg"></div>
          <div class="entry-icon-emoji">🔤</div>
        </div>
        <div class="entry-body">
          <div class="entry-title">认字卡片</div>
          <div class="entry-desc">开始认字之旅</div>
        </div>
        <div class="entry-arrow-wrap">
          <span class="entry-arrow">›</span>
        </div>
      </div>

      <div class="entry-card entry-storybook" onclick="navigateTo('storybook')">
        <div class="entry-icon-wrap">
          <div class="entry-icon-bg"></div>
          <div class="entry-icon-emoji">📕</div>
        </div>
        <div class="entry-body">
          <div class="entry-title">课本绘本</div>
          <div class="entry-desc">从故事中学习</div>
        </div>
        <div class="entry-arrow-wrap">
          <span class="entry-arrow">›</span>
        </div>
      </div>

      <div class="entry-card entry-pinyin" onclick="navigateTo('pinyin')">
        <div class="entry-icon-wrap">
          <div class="entry-icon-bg"></div>
          <div class="entry-icon-emoji">🎵</div>
        </div>
        <div class="entry-body">
          <div class="entry-title">拼音学习</div>
          <div class="entry-desc">打好识字基础</div>
        </div>
        <div class="entry-arrow-wrap">
          <span class="entry-arrow">›</span>
        </div>
      </div>

      <div class="entry-card entry-exercise" onclick="navigateTo('exercise')">
        <div class="entry-icon-wrap">
          <div class="entry-icon-bg"></div>
          <div class="entry-icon-emoji">🎯</div>
        </div>
        <div class="entry-body">
          <div class="entry-title">趣味练习</div>
          <div class="entry-desc">巩固学习成果</div>
        </div>
        <div class="entry-arrow-wrap">
          <span class="entry-arrow">›</span>
        </div>
      </div>

      <div class="entry-card entry-progress" onclick="navigateTo('progress')">
        <div class="entry-icon-wrap">
          <div class="entry-icon-bg"></div>
          <div class="entry-icon-emoji">📊</div>
        </div>
        <div class="entry-body">
          <div class="entry-title">学习进度</div>
          <div class="entry-desc">查看你的进步</div>
        </div>
        <div class="entry-arrow-wrap">
          <span class="entry-arrow">›</span>
        </div>
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;
};
