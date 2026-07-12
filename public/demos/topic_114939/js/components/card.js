const esc = window.escapeHtml;
window.YXCard = {
  render: function(container, options) {
    const { char, pinyin, status = 'unlearned', onClick } = options;
    
    const statusClass = {
      unlearned: '',
      learned: 'learned',
      mistake: 'mistake',
      mastered: 'mastered'
    }[status] || '';

    container.innerHTML = `
      <div class="card-item ${statusClass}" onclick="${esc(onClick || '')}">
        <div class="card-char">${esc(char)}</div>
        <div class="card-pinyin">${esc(pinyin)}</div>
      </div>
    `;
  },

  renderDetail: function(container, options) {
    const { char, pinyin, words = [], sentences = [], onAudioClick } = options;

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-char">${esc(char)}</div>
        <div class="detail-pinyin">${esc(pinyin)}</div>
        <button class="detail-audio-btn" onclick="${esc(onAudioClick || '')}">🔊</button>
        
        <div class="detail-section">
          <div class="detail-section-title">组词</div>
          <div class="detail-word-list">
            ${words.map(w => `<div class="detail-word">${esc(w)}</div>`).join('')}
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-section-title">例句</div>
          ${sentences.map(s => `<div class="detail-sentence">${esc(s)}</div>`).join('')}
        </div>
      </div>
    `;
  },

  renderList: function(container, cards, onClick) {
    container.innerHTML = cards.map((card, index) => {
      const statusClass = {
        unlearned: '',
        learned: 'learned',
        mistake: 'mistake',
        mastered: 'mastered'
      }[card.status] || '';
      
      return `
        <div class="card-item ${statusClass}" onclick="${esc(onClick)}(index)">
          <div class="card-char">${esc(card.char)}</div>
          <div class="card-pinyin">${esc(card.pinyin)}</div>
        </div>
      `;
    }).join('');
  }
};