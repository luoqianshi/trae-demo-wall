window.LessonPage = function(container, lessonId) {
  const esc = window.escapeHtml;
  const game = window.GameSystem;
  const lessons = window.DemoData ? window.DemoData.lessons || [] : [];
  const cards = window.DemoData ? window.DemoData.cards || [] : [];
  
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) {
    container.innerHTML = '<div style="padding: 20px; text-align: center;">课程不存在</div>';
    return;
  }

  const lessonCards = lesson.cardIds.map(id => cards.find(c => c.id === id)).filter(Boolean);
  const currentCardIndex = 0;

  function renderCard(index) {
    if (index >= lessonCards.length) {
      game.onCompleteLesson(lessonId);
      container.innerHTML = `
        <div class="game-lesson-container">
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <div style="font-size: 24px; font-weight: 700; color: #1F2937; margin-bottom: 8px;">课程完成！</div>
            <div style="font-size: 14px; color: #6B7280; margin-bottom: 24px;">恭喜你完成「${esc(lesson.name)}」</div>
            <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 24px;">
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">+${game.config.xpCompleteLesson}</div>
                <div style="font-size: 12px; color: #6B7280;">XP</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #EAB308;">+${game.config.coinsCompleteLesson}</div>
                <div style="font-size: 12px; color: #6B7280;">识字币</div>
              </div>
            </div>
            <button class="game-card-nav-btn" onclick="navigateTo('home')">返回首页</button>
          </div>
        </div>
      `;
      return;
    }

    const card = lessonCards[index];

    container.innerHTML = `
      <div class="game-lesson-container">
        <div class="game-lesson-header">
          <div class="game-lesson-title">${esc(lesson.icon)} ${esc(lesson.name)}</div>
          <div class="game-lesson-progress">${index + 1} / ${lessonCards.length}</div>
        </div>

        <div class="game-card-large">
          <div class="game-card-char">${esc(card.char)}</div>
          <div class="game-card-pinyin">${esc(card.pinyin)}</div>
          <button class="game-card-audio-btn" onclick="window.AudioManager.playCharacter('${esc(card.char)}', '${esc(card.pinyin)}')">🔊</button>

          <div class="game-card-words">
            <div class="game-card-words-title">组词</div>
            <div class="game-card-word-list">
              ${card.words.map(w => `<div class="game-card-word">${esc(w)}</div>`).join('')}
            </div>
          </div>

          <div class="game-card-sentences">
            <div class="game-card-sentences-title">例句</div>
            ${card.sentences.map(s => `<div class="game-card-sentence">${esc(s)}</div>`).join('')}
          </div>

          <div class="game-card-nav">
            ${index > 0 ? `<button class="game-card-nav-btn secondary" onclick="renderCard(${index - 1})">上一个</button>` : ''}
            <button class="game-card-nav-btn" onclick="nextCard(${index})">${index < lessonCards.length - 1 ? '下一个' : '完成课程'}</button>
          </div>
        </div>
      </div>
    `;

    window.nextCard = function(currentIndex) {
      game.onLearnChar();
      renderCard(currentIndex + 1);
    };
  }

  renderCard(currentCardIndex);
};