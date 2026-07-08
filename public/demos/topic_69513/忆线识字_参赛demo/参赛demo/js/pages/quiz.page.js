window.QuizPage = function(container) {
  const data = window.DemoData || {};
  const cards = data.cards || [];
  const totalQuestions = 5;

  let currentQuestion = 0;
  let correctCount = 0;
  let answered = false;
  let selectedIndex = -1;
  let currentOptions = [];
  let correctIndex = 0;

  function generateQuestion() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const correctCard = shuffled[0];
    const wrongCards = shuffled.slice(1, 4);

    const options = [correctCard, ...wrongCards].sort(() => Math.random() - 0.5);
    currentOptions = options;
    correctIndex = options.findIndex(c => c.id === correctCard.id);
  }

  function render() {
    if (currentQuestion >= totalQuestions) {
      renderResult();
      return;
    }

    const progress = ((currentQuestion) / totalQuestions) * 100;
    const card = currentOptions[correctIndex];
    const toneNames = ['', '第一声', '第二声', '第三声', '第四声', '轻声'];

    container.innerHTML = `
      <div class="quiz-page page-transition">
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">第 ${currentQuestion + 1} / ${totalQuestions} 题</span>
            <span class="progress-total">答对 ${correctCount} 题</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>

        <div class="question-section">
          <div class="pinyin-card">
            <div class="pinyin-big">${card.pinyin || 'hàn'}</div>
            <div class="tone-indicator">
              <span class="tone-label">${toneNames[card.tone] || '第一声'}</span>
            </div>
          </div>

          <div class="question-tip">请选出对应的汉字</div>
        </div>

        <div class="option-section">
          <div class="option-list">
            ${currentOptions.map((opt, idx) => {
              let cls = 'option-item';
              let mark = '';
              if (answered) {
                cls += ' locked';
                if (idx === correctIndex) {
                  cls += ' correct';
                  mark = '<div class="option-mark">✓</div>';
                } else if (idx === selectedIndex && idx !== correctIndex) {
                  cls += ' wrong';
                  mark = '<div class="option-mark wrong-mark">✗</div>';
                }
              }
              return `
                <div class="${cls}" onclick="selectOption(${idx})">
                  <span class="option-char">${opt.char || '汉'}</span>
                  ${mark}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${answered ? `
          <div class="feedback-section">
            <div class="feedback-text ${selectedIndex === correctIndex ? 'ok' : 'no'}">
              ${selectedIndex === correctIndex ? '🎉 回答正确！' : '😅 答错了，正确答案是 ' + currentOptions[correctIndex].char}
            </div>
            <button class="next-btn" onclick="nextQuestion()">
              ${currentQuestion < totalQuestions - 1 ? '下一题' : '查看结果'}
              <span class="next-arrow">→</span>
            </button>
          </div>
        ` : ''}

        <div style="height: 20px;"></div>
      </div>
    `;
  }

  function renderResult() {
    const rate = Math.round((correctCount / totalQuestions) * 100);
    const isGood = rate >= 60;

    container.innerHTML = `
      <div class="quiz-page page-transition">
        <div class="result-wrap">
          <div class="result-card">
            <div class="result-emoji-wrap">
              <span class="result-emoji">${isGood ? '🎉' : '💪'}</span>
            </div>
            <div class="result-title">${isGood ? '太棒了！' : '继续加油！'}</div>

            <div class="result-score-wrap">
              <div class="score-ring">
                <span class="score-correct">${correctCount}</span>
                <span class="score-divider">/</span>
                <span class="score-total">${totalQuestions}</span>
              </div>
            </div>

            <div class="result-rate">
              <span class="rate-num">${rate}%</span>
              <span class="rate-unit">正确率</span>
            </div>

            <div class="result-btns">
              <button class="next-btn" onclick="restartQuiz()">
                🔄 再来一次
              </button>
              <button class="btn btn-secondary btn-block" style="padding: 14px; border-radius: var(--radius-xl); font-size: 15px;" onclick="navigateTo('home')">
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.selectOption = function(idx) {
    if (answered) return;
    answered = true;
    selectedIndex = idx;
    if (idx === correctIndex) {
      correctCount++;
    }
    render();
  };

  window.nextQuestion = function() {
    currentQuestion++;
    answered = false;
    selectedIndex = -1;
    if (currentQuestion < totalQuestions) {
      generateQuestion();
    }
    render();
  };

  window.restartQuiz = function() {
    currentQuestion = 0;
    correctCount = 0;
    answered = false;
    selectedIndex = -1;
    generateQuestion();
    render();
  };

  generateQuestion();
  render();
};
