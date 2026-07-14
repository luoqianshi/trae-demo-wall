window.DetailPage = function(container, cardIndex) {
  const esc = window.escapeHtml;
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
            <div class="hero-char">${esc(card.char || '汉')}</div>
          </div>

          <div class="hero-pinyin-wrap">
            <span class="hero-pinyin">${esc(card.pinyin || 'hàn')}</span>
            <span class="pinyin-tone-badge">${toneBadgeText}</span>
          </div>

          <div class="hero-actions">
            <button class="hero-audio-btn hero-audio-btn--primary" onclick="window.AudioManager.playCharacter('${esc(card.char)}', '${esc(card.pinyin)}')" title="标准读音">
              <span class="hero-audio-icon">🔊</span>
              <span class="hero-audio-label">发音</span>
            </button>
            <button class="hero-audio-btn hero-audio-btn--lavender" onclick="window.AudioManager.playSpell('${esc(card.pinyin)}', '${esc(card.char)}')" title="拼音拼读">
              <span class="hero-audio-icon">✨</span>
              <span class="hero-audio-label">拼读</span>
            </button>
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
              <span class="word-tag">${esc(w)}</span>
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
              <span class="word-tag word-tag-syn">${esc(w)}</span>
            `).join('')}
            ${(card.antonyms || ['画', '图']).map(w => `
              <span class="word-tag word-tag-ant">${esc(w)}</span>
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
                <span class="example-text">${esc(s)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${buildExplainBlock(card, currentIndex)}

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

  /* ========== 汉字讲解模块（T2 渲染层 / T4 交互层） ========== */

  /**
   * 转义 HTML 特殊字符，防止文案中的 < > & 破坏结构。
   * @param {*} value 任意值
   * @return {string} 转义后的安全字符串
   */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
  }

  /**
   * 小兔气泡：固定引导语 + 当前字。
   * @param {Object} card 当前卡片
   * @return {string} HTML 片段
   */
  function buildBunnyBubble(card) {
    const char = escapeHtml(card.char || '');
    return `
        <div class="bunny-bubble">
          <span class="bunny-emoji">🐰</span>
          <span class="bunny-text">我是小兔，带你认识「${char}」～</span>
        </div>`;
  }

  /**
   * 字源卡：originGlyph 大 emoji + originText + 复用 hero 的发音按钮。
   * @param {Object} card 当前卡片
   * @return {string} HTML 片段
   */
  function buildOriginCard(card) {
    const glyph = escapeHtml(card.originGlyph || '🔍');
    const text = escapeHtml(card.originText || '');
    return `
        <div class="section-card origin-card">
          <div class="section-header">
            <span class="section-icon">🔍</span>
            <span class="section-title">字源 · 它长这样</span>
          </div>
          <div class="origin-glyph">${glyph}</div>
          <div class="origin-text">${text}</div>
        </div>`;
  }

  /**
   * 故事卡：storyEmoji + story（小兔口吻）。
   * @param {Object} card 当前卡片
   * @return {string} HTML 片段
   */
  function buildStoryCard(card) {
    const emoji = escapeHtml(card.storyEmoji || '🐰');
    const text = escapeHtml(card.story || '');
    return `
        <div class="section-card story-card">
          <div class="section-header">
            <span class="section-icon">📖</span>
            <span class="section-title">小兔故事</span>
          </div>
          <div class="story-emoji">${emoji}</div>
          <div class="story-text">${text}</div>
        </div>`;
  }

  /**
   * 笔顺卡：strokeOrder 文字占位（真实动画为 P2）。
   * @param {Object} card 当前卡片
   * @return {string} HTML 片段（无笔顺数据时返回空串）
   */
  function buildStrokeCard(card) {
    const order = escapeHtml(card.strokeOrder || '');
    if (!order) return '';
    return `
        <div class="section-card stroke-card">
          <div class="section-header">
            <span class="section-icon">✍️</span>
            <span class="section-title">笔顺</span>
          </div>
          <div class="stroke-order">${order}</div>
        </div>`;
  }

  /**
   * 猜谜卡：riddle.q 常显 + riddle.a/hint 默认隐藏，点击按钮揭晓。
   * @param {Object} card 当前卡片
   * @param {number} idx 当前卡片索引（用于生成唯一 id）
   * @return {string} HTML 片段（无谜语数据时返回空串）
   */
  function buildRiddleCard(card, idx) {
    const riddle = card.riddle;
    if (!riddle || !riddle.q) return '';
    const q = escapeHtml(riddle.q);
    const a = escapeHtml(riddle.a);
    const hint = escapeHtml(riddle.hint);
    return `
        <div class="section-card riddle-card" id="riddle-${idx}">
          <div class="section-header">
            <span class="section-icon">🧩</span>
            <span class="section-title">字源猜谜</span>
          </div>
          <div class="riddle-q">${q}</div>
          <div class="riddle-answer">
            <div class="riddle-a">答案：${a}</div>
            <div class="riddle-hint">提示：${hint}</div>
          </div>
          <button class="riddle-btn" onclick="revealRiddle('riddle-${idx}')">猜一猜 💡</button>
        </div>`;
  }

  /**
   * 讲解区总装：组合 5 个子卡。
   * @param {Object} card 当前卡片
   * @param {number} idx 当前卡片索引
   * @return {string} 完整讲解区 HTML
   */
  function buildExplainBlock(card, idx) {
    if (!card) return '';
    return `
      <div class="explain-block">
        ${buildBunnyBubble(card)}
        ${buildOriginCard(card)}
        ${buildStoryCard(card)}
        ${buildStrokeCard(card)}
        ${buildRiddleCard(card, idx)}
      </div>`;
  }

  /**
   * 字源猜谜揭晓：仅切换 .revealed 类，答案已预写在 DOM 中，不动态取数。
   * @param {string} id 猜谜卡 DOM id（如 'riddle-0'）
   */
  window.revealRiddle = function(id) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('riddle-card')) {
      el.classList.toggle('revealed');
    }
  };
};
