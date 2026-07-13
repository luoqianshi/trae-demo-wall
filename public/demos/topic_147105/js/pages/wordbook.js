/**
 * 单词本 - 单词列表 / 错题本 / 每日复习（闪卡）
 */

window.Pages.Wordbook = {
  currentTab: 'all',

  render() {
    const wordbook = Store.getWordbook();
    document.getElementById('app').innerHTML = `
      <div class="page page--wordbook">
        <header class="page-header">
          <button class="page-header__back" data-route="#/home">←</button>
          <h1 class="page-header__title">单词本</h1>
        </header>

        <div class="tabs">
          <button class="tab tab--active" data-tab="all">全部 (${wordbook.length})</button>
          <button class="tab" data-tab="wrong">错题本 (${wordbook.filter(w => w.wrongCount > 0).length})</button>
          <button class="tab" data-tab="review">每日复习</button>
        </div>

        <div class="wordbook-content" id="wordbook-content">
          ${this.renderWordList(wordbook)}
        </div>

        <div class="home-bottom-spacer"></div>
        ${Components.bottomNav('#/wordbook')}
      </div>
    `;
    this.bindEvents();
  },

  renderWordList(words) {
    if (words.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">📖</div>
          <p class="empty-state__text">还没有学过的单词</p>
          <p class="empty-state__hint">去课程地图开始学习吧！</p>
        </div>
      `;
    }
    // 按单元分组
    const grouped = {};
    words.forEach(w => {
      const unit = w.unit || 1;
      if (!grouped[unit]) grouped[unit] = [];
      grouped[unit].push(w);
    });
    let html = '';
    Object.keys(grouped).sort().forEach(unit => {
      html += `<div class="word-group">`;
      html += `<div class="word-group__title">Unit ${unit}</div>`;
      grouped[unit].forEach(w => {
        const masteryText = ['生疏', '熟悉', '掌握'][w.mastery] || '生疏';
        const masteryClass = ['', 'mastery--1', 'mastery--2', 'mastery--3'][w.mastery] || '';
        html += `
          <div class="word-card" data-word="${w.word}">
            <div class="word-card__emoji">${w.emoji || '📝'}</div>
            <div class="word-card__main">
              <div class="word-card__word">${w.word} <span class="word-card__phonetic">${w.phonetic}</span></div>
              <div class="word-card__meaning">${w.meaning}</div>
              <div class="word-card__example">${w.example}</div>
              ${w.wrongCount > 0 ? `<div class="word-card__wrong">❌ 错 ${w.wrongCount} 次</div>` : ''}
            </div>
            <div class="word-card__mastery">
              <div class="mastery-dot ${masteryClass}"></div>
              <div class="mastery-text">${masteryText}</div>
              <button class="word-card__play" data-word="${w.word}">🔊</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    });
    return html;
  },

  renderReview() {
    const wordbook = Store.getWordbook();
    const now = Date.now();
    const needReview = wordbook.filter(w => w.nextReview && new Date(w.nextReview).getTime() <= now);
    if (needReview.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">✨</div>
          <p class="empty-state__text">今日复习已完成！</p>
          <p class="empty-state__hint">明天再来复习吧</p>
        </div>
      `;
    }
    // 闪卡模式
    const word = needReview[0];
    return `
      <div class="flashcard-container">
        <div class="flashcard-progress">${needReview.length} 个待复习</div>
        <div class="flashcard" id="flashcard" data-word="${word.word}">
          <div class="flashcard__front">
            <div class="flashcard__emoji">${word.emoji}</div>
            <div class="flashcard__word">${word.word}</div>
            <div class="flashcard__phonetic">${word.phonetic}</div>
            <div class="flashcard__hint">点击翻牌查看释义</div>
          </div>
          <div class="flashcard__back">
            <div class="flashcard__meaning">${word.meaning}</div>
            <div class="flashcard__example">${word.example}</div>
            <button class="btn btn--primary flashcard__btn" data-word="${word.word}">
              <span class="btn__icon">🔊</span>
              <span>发音</span>
            </button>
          </div>
        </div>
        <div class="flashcard-actions">
          <button class="btn btn--secondary" id="btn-forgot">忘了</button>
          <button class="btn btn--primary" id="btn-remember">记得</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // 返回
    document.querySelector('.page-header__back').addEventListener('click', () => {
      AudioEngine.playClick();
      window.location.hash = '/home';
    });

    // Tab 切换
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        AudioEngine.playClick();
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        this.currentTab = tab.getAttribute('data-tab');
        this.refreshContent();
      });
    });

    // 单词发音（事件委托）
    document.getElementById('wordbook-content').addEventListener('click', (e) => {
      const playBtn = e.target.closest('.word-card__play');
      if (playBtn) {
        e.stopPropagation();
        const word = playBtn.getAttribute('data-word');
        Speech.speak(word);
        return;
      }
      const card = e.target.closest('.word-card');
      if (card) {
        const word = card.getAttribute('data-word');
        Speech.speak(word);
      }
    });

    Components.bindBottomNav();
  },

  refreshContent() {
    const content = document.getElementById('wordbook-content');
    const wordbook = Store.getWordbook();
    if (this.currentTab === 'all') {
      content.innerHTML = this.renderWordList(wordbook);
    } else if (this.currentTab === 'wrong') {
      const wrong = wordbook.filter(w => w.wrongCount > 0);
      content.innerHTML = wrong.length > 0
        ? this.renderWordList(wrong)
        : `<div class="empty-state"><div class="empty-state__icon">🎉</div><p class="empty-state__text">没有错题，太棒了！</p></div>`;
    } else if (this.currentTab === 'review') {
      content.innerHTML = this.renderReview();
      this.bindReviewEvents();
    }
  },

  bindReviewEvents() {
    const card = document.getElementById('flashcard');
    if (card) {
      card.addEventListener('click', () => {
        card.classList.toggle('flashcard--flipped');
      });
      document.getElementById('btn-remember').addEventListener('click', () => {
        const word = card.getAttribute('data-word');
        Store.updateWordbook(word, true);
        AudioEngine.playCorrect();
        this.refreshContent();
      });
      document.getElementById('btn-forgot').addEventListener('click', () => {
        const word = card.getAttribute('data-word');
        Store.updateWordbook(word, false);
        AudioEngine.playWrong();
        this.refreshContent();
      });
      // 发音按钮
      const playBtn = card.querySelector('.flashcard__btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Speech.speak(playBtn.getAttribute('data-word'));
        });
      }
    }
  }
};
