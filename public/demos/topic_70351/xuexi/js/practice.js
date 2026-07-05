(() => {
  'use strict';

  const API_BASE = '/api';

  const Store = {
    sessionId: localStorage.getItem('xuexi_session') || generateSessionId(),
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    results: {},
    mode: 'unit',
    unitId: null,
    unitIds: [],
    params: new URLSearchParams(window.location.search)
  };

  function generateSessionId() {
    const id = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('xuexi_session', id);
    return id;
  }

  const API = {
    async getQuestions(unitId, page = 1, pageSize = 50) {
      const res = await fetch(
        `${API_BASE}/units/${unitId}/questions?page=${page}&page_size=${pageSize}&include_answer=false`
      );
      return res.json();
    },
    async getQuestion(questionId) {
      const res = await fetch(`${API_BASE}/questions/${questionId}`);
      return res.json();
    },
    async submitAnswer(questionId, answer, timeSpent = 0) {
      const res = await fetch(`${API_BASE}/questions/${questionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          session_id: Store.sessionId,
          time_spent: timeSpent
        })
      });
      return res.json();
    },
    async getRandomQuestion(params = {}) {
      const qs = new URLSearchParams({
        session_id: Store.sessionId,
        ...params
      });
      const res = await fetch(`${API_BASE}/questions/random?${qs}`);
      return res.json();
    }
  };

  const Practice = {
    startTime: 0,

    async init() {
      this.parseParams();
      this.bindEvents();
      await this.loadQuestions();
      if (Store.questions.length > 0) {
        this.startTime = Date.now();
        this.renderQuestion();
      } else {
        this.showEmpty();
      }
    },

    parseParams() {
      Store.mode = Store.params.get('mode') || 'unit';
      Store.unitId = Store.params.get('unit_id');
      const unitIdsStr = Store.params.get('unit_ids');
      if (unitIdsStr) {
        Store.unitIds = unitIdsStr.split(',').map(Number);
      }
    },

    async loadQuestions() {
      const card = document.querySelector('[data-practice-card]');
      const qContent = document.querySelector('[data-question-content]');
      if (qContent) qContent.textContent = '加载中...';

      if (Store.mode === 'random') {
        const result = await API.getRandomQuestion();
        if (!result.error && result.data) {
          Store.questions = [result.data];
        }
        return;
      }

      if (Store.mode === 'wrong') {
        const qId = Store.params.get('question_id');
        if (qId) {
          const result = await API.getQuestion(qId);
          if (!result.error && result.data) {
            Store.questions = [result.data];
          }
        }
        return;
      }

      if (Store.unitIds && Store.unitIds.length > 0) {
        const allQuestions = [];
        for (const uid of Store.unitIds) {
          const result = await API.getQuestions(uid, 1, 50);
          if (!result.error && result.data) {
            allQuestions.push(...result.data);
          }
        }
        Store.questions = allQuestions;
        return;
      }

      if (Store.unitId) {
        const result = await API.getQuestions(Store.unitId, 1, 50);
        if (!result.error && result.data) {
          Store.questions = result.data;
        }
      }
    },

    bindEvents() {
      const submitBtn = document.querySelector('[data-submit]');
      const nextBtn = document.querySelector('[data-next]');
      const prevBtn = document.querySelector('[data-prev]');

      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.checkAnswer());
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextQuestion());
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.prevQuestion());
      }
    },

    renderQuestion() {
      const q = Store.questions[Store.currentIndex];
      if (!q) return;

      const typeMap = { choice: '选择题', fill: '填空题', short: '简答题' };
      const diffMap = { easy: '简单', medium: '中等', hard: '困难' };

      const typeName = document.querySelector('[data-type-name]');
      const difficulty = document.querySelector('[data-difficulty]');
      const content = document.querySelector('[data-question-content]');
      const body = document.querySelector('[data-question-body]');
      const analysis = document.querySelector('[data-analysis]');
      const result = document.querySelector('[data-result]');
      const submitBtn = document.querySelector('[data-submit]');
      const nextBtn = document.querySelector('[data-next]');
      const prevBtn = document.querySelector('[data-prev]');

      if (typeName) typeName.textContent = typeMap[q.question_type] || q.question_type;
      if (difficulty) difficulty.textContent = diffMap[q.difficulty] || q.difficulty;
      if (content) content.textContent = q.content;
      if (analysis) analysis.classList.remove('show');
      if (result) result.innerHTML = '';

      if (body) {
        if (q.question_type === 'choice' && q.options) {
          body.innerHTML = `
            <div class="practice-options" data-options>
              ${q.options.map(opt => `
                <div class="practice-option" data-option-key="${opt.key}">
                  <span class="option-key">${opt.key}</span>
                  <span class="option-text">${this.escapeHtml(opt.text)}</span>
                </div>
              `).join('')}
            </div>
          `;
          body.querySelectorAll('.practice-option').forEach(opt => {
            opt.addEventListener('click', () => this.selectOption(opt.dataset.optionKey));
          });
          if (submitBtn) {
            submitBtn.style.display = 'inline-flex';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
          }
        } else if (q.question_type === 'fill') {
          body.innerHTML = `
            <input type="text" class="fill-input" placeholder="请输入答案..." data-fill-input>
          `;
          const input = body.querySelector('[data-fill-input]');
          if (input) {
            input.addEventListener('input', () => {
              if (submitBtn) {
                const hasVal = input.value.trim().length > 0;
                submitBtn.disabled = !hasVal;
                submitBtn.style.opacity = hasVal ? '1' : '0.5';
                submitBtn.style.cursor = hasVal ? 'pointer' : 'not-allowed';
              }
            });
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') this.checkAnswer();
            });
          }
          if (submitBtn) {
            submitBtn.style.display = 'inline-flex';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
          }
        }
      }

      if (Store.mode === 'random') {
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
      } else {
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = Store.currentIndex > 0 ? 'inline-flex' : 'none';
      }

      this.updateProgress();

      if (window.lucide) lucide.createIcons();

      if (Store.userAnswers[q.id] !== undefined) {
        this.showResult(q.id);
      }
    },

    selectOption(key) {
      const q = Store.questions[Store.currentIndex];
      if (!q || Store.results[q.id]) return;

      const options = document.querySelectorAll('[data-option-key]');
      options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.optionKey === key) {
          opt.classList.add('selected');
        }
      });

      Store.userAnswers[q.id] = key;
      const submitBtn = document.querySelector('[data-submit]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    },

    async checkAnswer() {
      const q = Store.questions[Store.currentIndex];
      if (!q || Store.results[q.id]) return;

      let userAnswer = '';
      if (q.question_type === 'choice') {
        userAnswer = Store.userAnswers[q.id] || '';
      } else if (q.question_type === 'fill') {
        const input = document.querySelector('[data-fill-input]');
        userAnswer = input ? input.value.trim() : '';
        Store.userAnswers[q.id] = userAnswer;
      }

      if (!userAnswer) return;

      const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
      const result = await API.submitAnswer(q.id, userAnswer, timeSpent);

      if (!result.error) {
        Store.results[q.id] = result;
        this.showResult(q.id);
      }
    },

    showResult(questionId) {
      const result = Store.results[questionId];
      if (!result) return;

      const q = Store.questions[Store.currentIndex];
      const analysis = document.querySelector('[data-analysis]');
      const analysisText = document.querySelector('[data-analysis-text]');
      const correctAnswer = document.querySelector('[data-correct-answer]');
      const resultEl = document.querySelector('[data-result]');
      const submitBtn = document.querySelector('[data-submit]');
      const nextBtn = document.querySelector('[data-next]');

      if (result.is_correct) {
        if (resultEl) {
          resultEl.innerHTML = `
            <span class="result-correct">
              <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
              回答正确
            </span>
          `;
        }
      } else {
        if (resultEl) {
          resultEl.innerHTML = `
            <span class="result-wrong">
              <i data-lucide="x-circle" style="width:18px;height:18px;"></i>
              回答错误
            </span>
          `;
        }
      }

      if (q.question_type === 'choice') {
        const options = document.querySelectorAll('[data-option-key]');
        options.forEach(opt => {
          opt.classList.add('disabled');
          opt.classList.remove('selected');
          if (opt.dataset.optionKey === result.correct_answer) {
            opt.classList.add('correct');
          } else if (opt.dataset.optionKey === Store.userAnswers[questionId] && !result.is_correct) {
            opt.classList.add('wrong');
          }
        });
      } else if (q.question_type === 'fill') {
        const input = document.querySelector('[data-fill-input]');
        if (input) {
          input.disabled = true;
          input.classList.add(result.is_correct ? 'correct' : 'wrong');
        }
      }

      if (analysis && analysisText && correctAnswer) {
        analysisText.textContent = result.analysis || '暂无解析';
        correctAnswer.textContent = result.correct_answer;
        analysis.classList.add('show');
      }

      if (submitBtn) submitBtn.style.display = 'none';

      if (Store.mode === 'random') {
        if (nextBtn) {
          nextBtn.style.display = 'inline-flex';
          nextBtn.innerHTML = `
            换一题
            <i data-lucide="shuffle" style="width:16px;height:16px;"></i>
          `;
          nextBtn.onclick = () => this.nextRandom();
        }
      } else {
        if (nextBtn && Store.currentIndex < Store.questions.length - 1) {
          nextBtn.style.display = 'inline-flex';
          nextBtn.innerHTML = `
            下一题
            <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>
          `;
          nextBtn.onclick = () => this.nextQuestion();
        }
      }

      if (window.lucide) lucide.createIcons();
    },

    nextQuestion() {
      if (Store.currentIndex < Store.questions.length - 1) {
        Store.currentIndex++;
        this.startTime = Date.now();
        this.renderQuestion();
      }
    },

    prevQuestion() {
      if (Store.currentIndex > 0) {
        Store.currentIndex--;
        this.renderQuestion();
      }
    },

    async nextRandom() {
      const result = await API.getRandomQuestion();
      if (!result.error && result.data) {
        Store.questions = [result.data];
        Store.currentIndex = 0;
        Store.userAnswers = {};
        Store.results = {};
        this.startTime = Date.now();
        this.renderQuestion();
      }
    },

    updateProgress() {
      const fill = document.querySelector('[data-progress-fill]');
      const text = document.querySelector('[data-progress-text]');
      const total = Store.questions.length;
      const current = Store.currentIndex + 1;
      if (Store.mode === 'random') {
        if (fill) fill.style.width = '100%';
        if (text) text.textContent = '随机练习';
      } else {
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${current} / ${total}`;
      }
    },

    showEmpty() {
      const content = document.querySelector('[data-question-content]');
      const body = document.querySelector('[data-question-body]');
      if (content) {
        content.textContent = '暂无题目';
        content.style.color = 'var(--color-text-tertiary)';
        content.style.textAlign = 'center';
      }
      if (body) {
        body.innerHTML = `
          <p style="text-align:center;color:var(--color-text-tertiary);font-size:var(--text-sm);">
            该单元暂无题目，敬请期待
          </p>
        `;
      }
      const submitBtn = document.querySelector('[data-submit]');
      if (submitBtn) submitBtn.style.display = 'none';
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    Practice.init();
  });
})();
