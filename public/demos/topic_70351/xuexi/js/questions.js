(() => {
  'use strict';

  const API_BASE = '/api';

  const Store = {
    sessionId: localStorage.getItem('xuexi_session') || generateSessionId(),
    currentGrade: 'all'
  };

  function generateSessionId() {
    const id = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('xuexi_session', id);
    return id;
  }

  const API = {
    async getTextbooks() {
      const res = await fetch(`${API_BASE}/textbooks`);
      return res.json();
    },
    async getUnits(textbookId) {
      const res = await fetch(`${API_BASE}/textbooks/${textbookId}/units`);
      return res.json();
    },
    async getQuestions(unitId, page = 1, pageSize = 10) {
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
    },
    async getWrongQuestions() {
      const res = await fetch(
        `${API_BASE}/wrong-questions?session_id=${Store.sessionId}`
      );
      return res.json();
    },
    async getStats() {
      const res = await fetch(
        `${API_BASE}/stats?session_id=${Store.sessionId}`
      );
      return res.json();
    }
  };

  const QuestionBank = {
    textbooks: [],
    unitsMap: {},

    async init() {
      this.bindTabs();
      this.bindGradeTabs();
      await this.loadTextbooks();
      await this.updateStats();
      this.loadWrongQuestions();
    },

    bindTabs() {
      const tabs = document.querySelectorAll('.qb-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const name = tab.dataset.tab;
          document.querySelectorAll('.qb-tab-content').forEach(content => {
            content.style.display = 'none';
          });
          const target = document.querySelector(`[data-tab-content="${name}"]`);
          if (target) target.style.display = 'block';
          if (name === 'wrong') this.loadWrongQuestions();
        });
      });
    },

    bindGradeTabs() {
      const tabs = document.querySelectorAll('.qb-grade-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          Store.currentGrade = tab.dataset.grade;
          this.renderTextbooks();
        });
      });
    },

    async loadTextbooks() {
      const result = await API.getTextbooks();
      if (!result.error) {
        this.textbooks = result.data || [];
        const loadPromises = this.textbooks.map(tb =>
          API.getUnits(tb.id).then(r => {
            if (!r.error) {
              this.unitsMap[tb.id] = r.data || [];
              tb.units = r.data || [];
            }
          })
        );
        await Promise.all(loadPromises);
        this.renderTextbooks();
      }
    },

    async updateStats() {
      const result = await API.getStats();
      if (!result.error) {
        const data = result.data || {};
        const tb = document.querySelector('[data-stat-textbooks]');
        const u = document.querySelector('[data-stat-units]');
        const q = document.querySelector('[data-stat-questions]');
        if (tb) tb.textContent = data.total_textbooks || 0;
        if (u) u.textContent = data.total_units || 0;
        if (q) q.textContent = data.total_questions || 0;
      }
    },

    renderTextbooks() {
      const grid = document.querySelector('[data-textbook-grid]');
      if (!grid) return;
      const filtered = Store.currentGrade === 'all'
        ? this.textbooks
        : this.textbooks.filter(tb => tb.grade === Store.currentGrade);
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="qb-empty" style="grid-column:1/-1;">
            <p style="color:var(--color-text-tertiary);">暂无教材数据</p>
          </div>
        `;
        return;
      }
      grid.innerHTML = filtered.map(tb => {
        const units = this.unitsMap[tb.id] || [];
        const totalQ = units.reduce((sum, u) => sum + (u.question_count || 0), 0);
        return `
          <div class="textbook-card fade-in" data-textbook-id="${tb.id}">
            <div class="textbook-card-header">
              <h3 class="textbook-card-title">${tb.name}</h3>
              <span class="textbook-card-badge">${tb.grade}</span>
            </div>
            <p class="textbook-card-meta">${units.length} 个单元 · ${totalQ} 道题</p>
            <div class="textbook-card-units">
              ${units.slice(0, 4).map(u => `
                <span class="unit-chip" data-unit-id="${u.id}" data-unit-name="${u.name}">
                  ${u.unit_number}. ${u.name.replace(/^第.+单元\s*/, '')}
                </span>
              `).join('')}
              ${units.length > 4 ? `<span class="unit-chip">+${units.length - 4}</span>` : ''}
            </div>
            <div class="textbook-card-footer">
              <span class="textbook-card-count">
                <i data-lucide="help-circle" style="width:14px;height:14px;"></i>
                共 ${totalQ} 题
              </span>
              <span class="textbook-card-action">
                开始练习
                <i data-lucide="chevron-right" style="width:14px;height:14px;"></i>
              </span>
            </div>
          </div>
        `;
      }).join('');
      if (window.lucide) lucide.createIcons();

      grid.querySelectorAll('.unit-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const unitId = chip.dataset.unitId;
          const unitName = chip.dataset.unitName;
          this.startPractice(unitId, unitName);
        });
      });

      grid.querySelectorAll('.textbook-card').forEach(card => {
        card.addEventListener('click', () => {
          const tbId = card.dataset.textbookId;
          const units = this.unitsMap[tbId] || [];
          if (units.length > 0) {
            this.startPractice(units[0].id, units[0].name, units.map(u => u.id));
          }
        });
      });
    },

    startPractice(unitId, unitName, unitIds = null) {
      const params = new URLSearchParams({
        unit_id: unitId,
        unit_name: unitName
      });
      if (unitIds && unitIds.length > 0) {
        params.set('unit_ids', unitIds.join(','));
      }
      window.location.href = `practice.html?${params.toString()}`;
    },

    async loadWrongQuestions() {
      const list = document.querySelector('[data-wrong-list]');
      if (!list) return;
      const result = await API.getWrongQuestions();
      if (result.error || !result.data || result.data.length === 0) {
        list.innerHTML = `
          <div class="qb-empty">
            <i data-lucide="check-circle" style="width:48px;height:48px;color:var(--state-success);"></i>
            <p class="body-md" style="color:var(--color-text-secondary);margin-top:1rem;">暂无错题，继续加油！</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }
      const typeMap = { choice: '选择题', fill: '填空题', short: '简答题' };
      list.innerHTML = result.data.map(q => `
        <div class="wrong-item" data-question-id="${q.id}">
          <div class="wrong-item-header">
            <span class="wrong-item-type">${typeMap[q.question_type] || q.question_type}</span>
            <span class="wrong-item-time">${q.wrong_time ? new Date(q.wrong_time).toLocaleDateString() : ''}</span>
          </div>
          <p class="wrong-item-content">${this.escapeHtml(q.content)}</p>
        </div>
      `).join('');
      list.querySelectorAll('.wrong-item').forEach(item => {
        item.addEventListener('click', () => {
          const qId = item.dataset.questionId;
          window.location.href = `practice.html?question_id=${qId}&mode=wrong`;
        });
      });
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    QuestionBank.init();
  });

  const randomBtn = document.querySelector('[data-random-start]');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      window.location.href = 'practice.html?mode=random';
    });
  }
})();
