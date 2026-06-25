const app = {
  data: {
    words: [],
    quizzes: [],
    history: [],
    currentQuiz: null,
    currentQuestion: 0,
    answers: [],
    currentPage: 'dashboard'
  },

  init() {
    this.loadData();
    this.bindNav();
    this.renderAll();
  },

  loadData() {
    try {
      const w = localStorage.getItem('arm_words');
      const q = localStorage.getItem('arm_quizzes');
      const h = localStorage.getItem('arm_history');
      if (w) this.data.words = JSON.parse(w);
      if (q) this.data.quizzes = JSON.parse(q);
      if (h) this.data.history = JSON.parse(h);
    } catch(e) {}
  },

  saveData() {
    localStorage.setItem('arm_words', JSON.stringify(this.data.words));
    localStorage.setItem('arm_quizzes', JSON.stringify(this.data.quizzes));
    localStorage.setItem('arm_history', JSON.stringify(this.data.history));
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(item.dataset.page);
      });
    });
  },

  navigate(page) {
    this.data.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    const titles = { dashboard: '学习看板', vocabulary: '词库管理', generate: '智能出题', practice: '开始练习', history: '练习记录', result: '练习结果' };
    document.getElementById('page-title').textContent = titles[page] || '';
    this.renderAll();
    window.scrollTo(0,0);
  },

  renderAll() {
    this.renderDashboard();
    this.renderWords();
    this.renderPracticeList();
    this.renderHistory();
  },

  // Dashboard
  renderDashboard() {
    document.getElementById('total-words').textContent = this.data.words.length;
    document.getElementById('total-practices').textContent = this.data.history.length;
    const avg = this.data.history.length ? Math.round(this.data.history.reduce((s,h)=>s+h.score,0)/this.data.history.length) : 0;
    document.getElementById('avg-score').textContent = avg + '%';
    document.getElementById('streak-days').textContent = this.calcStreak();
    this.renderWeakPoints();
    this.renderTrendChart();
  },

  calcStreak() {
    if (!this.data.history.length) return 0;
    const days = [...new Set(this.data.history.map(h => h.date))].sort();
    let streak = 1;
    for (let i = days.length-1; i > 0; i--) {
      const d1 = new Date(days[i]), d0 = new Date(days[i-1]);
      if ((d1-d0)/(864e5) <= 1) streak++; else break;
    }
    return streak;
  },

  renderWeakPoints() {
    const el = document.getElementById('weak-points');
    const wrongs = {};
    this.data.history.forEach(h => {
      h.wrongItems?.forEach(w => { wrongs[w.word] = (wrongs[w.word]||0)+1; });
    });
    const sorted = Object.entries(wrongs).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if (!sorted.length) { el.innerHTML = '<div class="empty-state">暂无数据，请先进行练习</div>'; return; }
    el.innerHTML = sorted.map(([word,count]) => {
      const max = sorted[0][1];
      return `<div class="weak-item">
        <span>${word}</span>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.8rem;color:var(--muted)">错${count}次</span>
          <div class="weak-bar-bg"><div class="weak-bar-fill" style="width:${(count/max*100)}%"></div></div>
        </div>
      </div>`;
    }).join('');
  },

  renderTrendChart() {
    const el = document.getElementById('chart-trend');
    if (!this.data.history.length) { el.innerHTML = '<div class="empty-state" style="padding:2rem">暂无练习记录</div>'; return; }
    const byDate = {};
    this.data.history.forEach(h => { byDate[h.date] = h.score; });
    const dates = Object.keys(byDate).slice(-7);
    const scores = dates.map(d => byDate[d]);
    const max = Math.max(...scores, 100);
    const w = el.clientWidth || 400, h = 260, pad = 40;
    const pw = w - pad*2, ph = h - pad*2;
    const dx = pw / (dates.length-1 || 1);
    const points = scores.map((s,i) => `${pad + i*dx},${pad + ph - (s/max)*ph}`).join(' ');
    const area = `${pad},${pad+ph} ${points} ${pad+(dates.length-1)*dx},${pad+ph}`;
    el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.3"/><stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/></linearGradient></defs>
      <polygon points="${area}" fill="url(#grad)"/>
      <polyline points="${points}" fill="none" stroke="#0ea5e9" stroke-width="2"/>
      ${scores.map((s,i) => `<circle cx="${pad+i*dx}" cy="${pad+ph-(s/max)*ph}" r="4" fill="#0ea5e9"/><text x="${pad+i*dx}" y="${h-10}" text-anchor="middle" font-size="10" fill="#64748b">${dates[i].slice(5)}</text>`).join('')}
    </svg>`;
  },

  // Vocabulary
  renderWords() {
    const search = (document.getElementById('word-search')?.value || '').toLowerCase();
    const cat = document.getElementById('word-category')?.value || '';
    let list = this.data.words;
    if (cat) list = list.filter(w => w.category === cat);
    if (search) list = list.filter(w => w.word.toLowerCase().includes(search) || w.meaning.toLowerCase().includes(search));
    const tbody = document.getElementById('word-list');
    const empty = document.getElementById('word-empty');
    if (!list.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    tbody.innerHTML = list.map((w,i) => {
      const catLabel = w.category==='english'?'英语':'语文';
      const catClass = w.category==='english'?'tag-english':'tag-chinese';
      const diffClass = 'tag-'+w.difficulty;
      const diffLabel = {easy:'简单',medium:'中等',hard:'困难'}[w.difficulty];
      return `<tr>
        <td><span class="tag ${catClass}">${catLabel}</span></td>
        <td><strong>${w.word}</strong></td>
        <td>${w.meaning}</td>
        <td><span class="tag ${diffClass}">${diffLabel}</span></td>
        <td>${w.date}</td>
        <td><button class="btn btn-danger" style="padding:0.3rem 0.6rem;font-size:0.8rem" onclick="app.deleteWord(${this.data.words.indexOf(w)})">删除</button></td>
      </tr>`;
    }).join('');
  },

  filterWords() { this.renderWords(); },

  showAddWordModal() {
    document.getElementById('modal-add-word').classList.add('active');
    document.getElementById('add-word').value = '';
    document.getElementById('add-meaning').value = '';
  },

  closeModal() {
    document.getElementById('modal-add-word').classList.remove('active');
  },

  addWord() {
    const cat = document.getElementById('add-category').value;
    const word = document.getElementById('add-word').value.trim();
    const meaning = document.getElementById('add-meaning').value.trim();
    const diff = document.getElementById('add-difficulty').value;
    if (!word || !meaning) { this.showToast('请填写完整信息'); return; }
    this.data.words.push({ category: cat, word, meaning, difficulty: diff, date: new Date().toISOString().slice(0,10) });
    this.saveData();
    this.closeModal();
    this.renderWords();
    this.showToast('添加成功');
  },

  deleteWord(idx) {
    if (!confirm('确定删除？')) return;
    this.data.words.splice(idx,1);
    this.saveData();
    this.renderWords();
    this.showToast('已删除');
  },

  loadSampleData() {
    const samples = [
      {category:'english',word:'apple',meaning:'苹果',difficulty:'easy',date:'2026-06-20'},
      {category:'english',word:'banana',meaning:'香蕉',difficulty:'easy',date:'2026-06-20'},
      {category:'english',word:'computer',meaning:'电脑',difficulty:'medium',date:'2026-06-20'},
      {category:'english',word:'environment',meaning:'环境',difficulty:'hard',date:'2026-06-20'},
      {category:'english',word:'beautiful',meaning:'美丽的',difficulty:'easy',date:'2026-06-20'},
      {category:'english',word:'necessary',meaning:'必要的',difficulty:'medium',date:'2026-06-20'},
      {category:'english',word:'achievement',meaning:'成就',difficulty:'hard',date:'2026-06-20'},
      {category:'chinese',word:'床前明月光',meaning:'李白《静夜思》',difficulty:'easy',date:'2026-06-20'},
      {category:'chinese',word:'春眠不觉晓',meaning:'孟浩然《春晓》',difficulty:'easy',date:'2026-06-20'},
      {category:'chinese',word:'会当凌绝顶',meaning:'杜甫《望岳》',difficulty:'medium',date:'2026-06-20'},
      {category:'chinese',word:'先天下之忧而忧',meaning:'范仲淹《岳阳楼记》',difficulty:'hard',date:'2026-06-20'},
      {category:'chinese',word:'学而不思则罔',meaning:'《论语》',difficulty:'medium',date:'2026-06-20'},
    ];
    this.data.words = [...this.data.words, ...samples];
    this.saveData();
    this.renderWords();
    this.showToast('示例数据已导入');
  },

  // Generate Quiz
  generateQuiz() {
    const cat = document.getElementById('gen-category').value;
    const count = parseInt(document.getElementById('gen-count').value);
    const type = document.getElementById('gen-type').value;
    const diff = document.getElementById('gen-difficulty').value;
    let pool = this.data.words;
    if (cat !== 'all') pool = pool.filter(w => w.category === cat);
    if (diff !== 'all') pool = pool.filter(w => w.difficulty === diff);
    if (pool.length < 3) { this.showToast('词库数量不足，请先添加更多内容'); return; }
    const selected = this.shuffle([...pool]).slice(0, Math.min(count, pool.length));
    const questions = selected.map((w, idx) => {
      const isChoice = type === 'choice' || (type === 'mixed' && Math.random() > 0.5);
      if (isChoice) {
        const choices = this.shuffle(pool.filter(x => x.word !== w.word)).slice(0,3).map(x => x.meaning);
        choices.push(w.meaning);
        return { type: 'choice', word: w.word, answer: w.meaning, choices: this.shuffle(choices), category: w.category };
      } else {
        return { type: 'fill', word: w.word, answer: w.meaning, hint: w.meaning[0] + '...', category: w.category };
      }
    });
    const quiz = { id: Date.now(), title: `练习 ${new Date().toLocaleString('zh-CN')}`, questions, date: new Date().toISOString().slice(0,10) };
    this.data.quizzes.push(quiz);
    this.saveData();
    this.renderQuizPreview(quiz);
    document.getElementById('preview-panel').style.display = 'block';
    this.showToast('练习题已生成');
  },

  renderQuizPreview(quiz) {
    const el = document.getElementById('quiz-preview');
    el.innerHTML = quiz.questions.map((q,i) => {
      if (q.type === 'choice') {
        return `<div class="quiz-item">
          <div class="quiz-item-header"><span class="quiz-num">${i+1}</span><span class="quiz-type-tag">选择题</span></div>
          <div class="quiz-question">"${q.word}" 的意思是？</div>
          <div class="quiz-choices">${q.choices.map((c,ci) => `<div class="quiz-choice">${String.fromCharCode(65+ci)}. ${c}</div>`).join('')}</div>
          <div class="quiz-answer">答案：${q.answer}</div>
        </div>`;
      } else {
        return `<div class="quiz-item">
          <div class="quiz-item-header"><span class="quiz-num">${i+1}</span><span class="quiz-type-tag">填空题</span></div>
          <div class="quiz-question">"${q.word}" 的意思是 ______</div>
          <div class="quiz-answer">答案：${q.answer}</div>
        </div>`;
      }
    }).join('');
  },

  printQuiz() {
    window.print();
  },

  // Practice
  renderPracticeList() {
    const el = document.getElementById('practice-list');
    const empty = document.getElementById('practice-empty');
    if (!this.data.quizzes.length) { el.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    el.innerHTML = this.data.quizzes.map((q,i) => `
      <div class="practice-card" onclick="app.startPractice(${i})">
        <div class="practice-card-title">${q.title}</div>
        <div class="practice-card-meta">
          <span>${q.questions.length}题</span>
          <span>${q.date}</span>
        </div>
      </div>
    `).join('');
  },

  startPractice(idx) {
    this.data.currentQuiz = this.data.quizzes[idx];
    this.data.currentQuestion = 0;
    this.data.answers = new Array(this.data.currentQuiz.questions.length).fill(null);
    document.getElementById('practice-setup').style.display = 'none';
    document.getElementById('practice-area').style.display = 'block';
    document.getElementById('practice-title').textContent = this.data.currentQuiz.title;
    document.getElementById('total-q').textContent = this.data.currentQuiz.questions.length;
    this.renderQuestion();
  },

  renderQuestion() {
    const q = this.data.currentQuiz.questions[this.data.currentQuestion];
    const total = this.data.currentQuiz.questions.length;
    document.getElementById('current-q').textContent = this.data.currentQuestion + 1;
    document.getElementById('progress-fill').style.width = ((this.data.currentQuestion+1)/total*100) + '%';
    const container = document.getElementById('question-container');
    if (q.type === 'choice') {
      container.innerHTML = `
        <div class="question-box">
          <div class="question-text">"${q.word}" 的意思是？</div>
          <div class="choice-list">
            ${q.choices.map((c,ci) => `
              <div class="choice-option ${this.data.answers[this.data.currentQuestion]===c?'selected':''}" onclick="app.selectChoice(decodeURIComponent('${encodeURIComponent(c)}'))">
                <span class="choice-letter">${String.fromCharCode(65+ci)}</span>
                <span>${c}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="question-box">
          <div class="question-text">"${q.word}" 的意思是 ______</div>
          <input type="text" class="question-input" placeholder="请输入答案..." value="${this.data.answers[this.data.currentQuestion]||''}" oninput="app.fillAnswer(this.value)">
        </div>`;
    }
    document.getElementById('btn-next').style.display = this.data.currentQuestion < total-1 ? 'inline-flex' : 'none';
    document.getElementById('btn-submit').style.display = this.data.currentQuestion === total-1 ? 'inline-flex' : 'none';
  },

  selectChoice(val) {
    this.data.answers[this.data.currentQuestion] = val;
    this.renderQuestion();
  },

  fillAnswer(val) {
    this.data.answers[this.data.currentQuestion] = val.trim();
  },

  nextQuestion() {
    if (this.data.currentQuestion < this.data.currentQuiz.questions.length - 1) {
      this.data.currentQuestion++;
      this.renderQuestion();
    }
  },

  prevQuestion() {
    if (this.data.currentQuestion > 0) {
      this.data.currentQuestion--;
      this.renderQuestion();
    }
  },

  submitPractice() {
    const quiz = this.data.currentQuiz;
    let correct = 0, wrongItems = [];
    quiz.questions.forEach((q,i) => {
      const ans = (this.data.answers[i]||'').toLowerCase().trim();
      const right = q.answer.toLowerCase().trim();
      if (ans === right) correct++;
      else wrongItems.push({ word: q.word, answer: q.answer, userAnswer: this.data.answers[i]||'' });
    });
    const score = Math.round(correct/quiz.questions.length*100);
    const result = { id: Date.now(), title: quiz.title, score, correct, wrong: quiz.questions.length-correct, total: quiz.questions.length, wrongItems, date: new Date().toISOString().slice(0,10) };
    this.data.history.push(result);
    this.saveData();
    this.showResult(result);
  },

  showResult(result) {
    this.navigate('result');
    document.getElementById('result-score').textContent = result.score;
    document.getElementById('result-correct').textContent = result.correct;
    document.getElementById('result-wrong').textContent = result.wrong;
    document.getElementById('result-accuracy').textContent = result.score + '%';
    const review = document.getElementById('result-review');
    if (!result.wrongItems.length) {
      review.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--success);font-size:1.2rem;font-weight:700">🎉 全对！太棒了！</div>';
    } else {
      review.innerHTML = '<h4 style="margin-bottom:1rem">错题回顾</h4>' + result.wrongItems.map(w => `
        <div class="review-item wrong">
          <div class="review-q">${w.word}</div>
          <div class="review-a">你的答案：${w.userAnswer||'(未作答)'} | 正确答案：${w.answer}</div>
        </div>
      `).join('');
    }
    document.getElementById('practice-setup').style.display = 'block';
    document.getElementById('practice-area').style.display = 'none';
  },

  // History
  renderHistory() {
    const el = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    if (!this.data.history.length) { el.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    el.innerHTML = this.data.history.slice().reverse().map(h => `
      <div class="history-item">
        <div class="history-info">
          <span class="history-title">${h.title}</span>
          <span class="history-meta">${h.date} · ${h.total}题 · 对${h.correct}错${h.wrong}</span>
        </div>
        <div class="history-score">${h.score}分</div>
      </div>
    `).join('');
  },

  // Utils
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
