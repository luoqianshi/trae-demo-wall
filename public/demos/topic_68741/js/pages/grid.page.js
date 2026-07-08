window.GridPage = function(container, categoryIndex = 0) {
  const data = window.DemoData || {};
  const categories = data.categories || [];
  const cards = data.cards || [];

  const currentCategory = categories[categoryIndex] || categories[0] || { name: '识字卡片' };

  const statuses = ['learned', 'wrong', 'mastered', 'unlearned', 'learned', 'mastered', 'unlearned', 'wrong', 'learned', 'unlearned',
                    'mastered', 'learned', 'wrong', 'unlearned', 'learned', 'mastered', 'unlearned', 'learned', 'wrong', 'mastered'];

  const displayCards = [];
  for (let i = 0; i < 20; i++) {
    const card = cards[i % cards.length];
    displayCards.push({
      ...card,
      status: statuses[i],
      emoji: getEmojiForIndex(i)
    });
  }

  function getEmojiForIndex(i) {
    const emojis = ['🌿', '💧', '☀️', '🌙', '🌸', '👁️', '👂', '👄', '✋', '🦶',
                    '1️⃣', '2️⃣', '3️⃣', '🔟', '👨', '👩', '👦', '🐶', '🐱', '🍚'];
    return emojis[i % emojis.length];
  }

  container.innerHTML = `
    <div class="grid-page page-transition">
      <div class="page-header">
        <div class="page-title">${currentCategory.name}</div>
        <div class="page-subtitle">共 ${displayCards.length} 个汉字</div>
      </div>

      <div class="card-grid">
        ${displayCards.map(card => `
          <div class="card-cell status-${card.status}" onclick="navigateTo('detail')">
            <div class="cell-status-dot"></div>
            <div class="cell-char">${card.char}</div>
            <div class="cell-img-placeholder">${card.emoji}</div>
            <div class="cell-pinyin">${card.pinyin}</div>
          </div>
        `).join('')}
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;
};
