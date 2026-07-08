window.DetailPage = function(container, cardIndex) {
  const data = window.DemoData || {};
  const cards = data.cards || [];
  const index = typeof cardIndex === 'number' ? cardIndex : 0;
  const card = cards[index] || cards[0] || {};
  const total = cards.length;
  const currentIndex = cards.indexOf(card) >= 0 ? cards.indexOf(card) : 0;

  const toneNames = ['', '第一声', '第二声', '第三声', '第四声', '轻声'];
  const toneBadgeText = toneNames[card.tone] || '';

  const statusList = ['unlearned', 'learned', 'mastered'];
  const statusNames = { unlearned: '未学习', learned: '已学习', mastered: '已掌握' };
  const statusIndex = currentIndex % 3;
  const currentStatus = statusList[statusIndex];

  container.innerHTML = `
    <div class="detail-page page-transition">
      <div class="detail-hero">
        <div class="hero-card">
          <div class="hero-decoration deco-circle-1"></div>
          <div class="hero-decoration deco-circle-2"></div>
          <div class="hero-decoration deco-dot-1"></div>
          <div class="hero-decoration deco-dot-2"></div>

          <div class="card-status-badge status-${currentStatus}">
            ${statusNames[currentStatus]}
          </div>

          <div class="hero-char-wrap">
            <div class="char-grid">
              <div class="grid-line grid-h"></div>
              <div class="grid-line grid-v"></div>
              <div class="grid-line grid-d1"></div>
              <div class="grid-line grid-d2"></div>
            </div>
            <div class="hero-char">${card.char || '汉'}</div>
          </div>

          <div class="hero-pinyin-wrap">
            <span class="hero-pinyin">${card.pinyin || 'hàn'}</span>
            <span class="pinyin-tone-badge">${toneBadgeText}</span>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <span class="section-title">组词</span>
          </div>
          <div class="word-tags">
            ${(card.words || ['汉字', '文字', '中文']).map(w => `
              <span class="word-tag">${w}</span>
            `).join('')}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">🔄</span>
            <span class="section-title">近义词 · 反义词</span>
          </div>
          <div class="word-tags">
            ${(card.synonyms || ['字', '文']).map(w => `
              <span class="word-tag word-tag-syn">${w}</span>
            `).join('')}
            ${(card.antonyms || ['画', '图']).map(w => `
              <span class="word-tag word-tag-ant">${w}</span>
            `).join('')}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">💬</span>
            <span class="section-title">例句</span>
          </div>
          <div class="examples-list">
            ${(card.sentences || ['这是一个汉字。', '我喜欢学习汉字。']).map((s, i) => `
              <div class="example-item">
                <span class="example-num">${i + 1}</span>
                <span class="example-text">${s}</span>
                <div class="example-speaker" onclick="playExampleAudio(${i})">
                  <span class="speaker-icon">🔊</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">🎧</span>
            <span class="section-title">听读练习</span>
          </div>
          <div class="audio-grid">
            <div class="audio-btn" onclick="playStandardAudio()">
              <div class="audio-icon-wrap">
                <span class="audio-icon">🔊</span>
              </div>
              <span class="audio-label">标准读音</span>
            </div>
            <div class="audio-btn" onclick="playSpellAudio()">
              <div class="audio-icon-wrap">
                <span class="audio-icon">🔤</span>
              </div>
              <span class="audio-label">拼读练习</span>
            </div>
          </div>
        </div>

        <div style="height: 20px;"></div>
      </div>

      <div class="pager-bar">
        <div class="pager-btn ${currentIndex <= 0 ? 'disabled' : ''}" onclick="prevCard()">
          <span class="pager-arrow">‹</span>
          <span>上一个</span>
        </div>
        <div class="pager-info">
          <span class="pager-current">${currentIndex + 1}</span>
          <span class="pager-divider">/</span>
          <span>${total}</span>
        </div>
        <div class="pager-btn ${currentIndex >= total - 1 ? 'disabled' : ''}" onclick="nextCard()">
          <span>下一个</span>
          <span class="pager-arrow">›</span>
        </div>
      </div>
    </div>
  `;

  window.prevCard = function() {
    if (currentIndex > 0) {
      DetailPage(container, currentIndex - 1);
    }
  };

  window.nextCard = function() {
    if (currentIndex < total - 1) {
      DetailPage(container, currentIndex + 1);
    }
  };

  window.playExampleAudio = function(idx) {
    const sentences = card.sentences || [];
    const text = sentences[idx] || '';
    if (text && window.AudioManager) {
      window.AudioManager.playSentence(text);
    }
  };

  window.playStandardAudio = function() {
    if (window.AudioManager && card.char) {
      window.AudioManager.playCharacter(card.char, card.pinyin);
    }
  };

  window.playSpellAudio = function() {
    if (window.AudioManager && card.pinyin) {
      window.AudioManager.playSpell(card.pinyin, card.char);
    }
  };
};
