const esc = window.escapeHtml;
window.YXQuizItem = {
  render: function(container, options) {
    const { pinyin, options: quizOptions, correctIndex, onSelect, selectedIndex, feedback } = options;
    
    const shuffledOptions = [...quizOptions].sort(() => Math.random() - 0.5);
    const actualCorrectIndex = shuffledOptions.indexOf(quizOptions[correctIndex]);
    
    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-question">
          <div class="quiz-pinyin">${esc(pinyin)}</div>
        </div>
        
        <div class="quiz-options">
          ${shuffledOptions.map((opt, idx) => {
            let optionClass = 'quiz-option';
            if (selectedIndex !== undefined) {
              if (idx === selectedIndex) {
                optionClass += idx === actualCorrectIndex ? ' correct' : ' wrong';
              } else if (idx === actualCorrectIndex) {
                optionClass += ' correct';
              }
            }
            return `
              <div class="${optionClass}" onclick="YXQuizItem.handleSelect(${idx}, ${actualCorrectIndex})">
                ${esc(opt)}
              </div>
            `;
          }).join('')}
        </div>
        
        ${feedback ? `
          <div class="quiz-feedback ${selectedIndex === actualCorrectIndex ? 'success' : 'error'}">
            ${esc(feedback)}
          </div>
        ` : ''}
      </div>
    `;
    
    window.YXQuizItem.currentOnSelect = onSelect;
    window.YXQuizItem.currentCorrectIndex = actualCorrectIndex;
  },
  
  handleSelect: function(selectedIndex, correctIndex) {
    if (window.YXQuizItem.currentOnSelect) {
      window.YXQuizItem.currentOnSelect(selectedIndex, correctIndex);
    }
  },
  
  renderResult: function(container, options) {
    const { total, correct, wrong, onRestart } = options;
    const accuracy = Math.round((correct / total) * 100);
    
    container.innerHTML = `
      <div class="quiz-container">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">
            ${accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
          </div>
          <div style="font-size: 24px; font-weight: 700; color: var(--color-text); margin-bottom: 8px;">
            练习完成！
          </div>
          <div style="font-size: 16px; color: var(--color-text-secondary); margin-bottom: 20px;">
            共 ${total} 题，答对 ${correct} 题，正确率 ${accuracy}%
          </div>
          
          <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: var(--color-success);">${correct}</div>
              <div style="font-size: 12px; color: var(--color-text-secondary);">答对</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: var(--color-error);">${wrong}</div>
              <div style="font-size: 12px; color: var(--color-text-secondary);">答错</div>
            </div>
          </div>
          
          <button class="exercise-btn" onclick="${onRestart}">
            🔄 再来一组
          </button>
        </div>
      </div>
    `;
  }
};