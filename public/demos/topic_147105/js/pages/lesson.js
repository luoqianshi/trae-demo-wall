/**
 * 学习界面 - 核心模块
 * 6 种题型：单词翻译选择、看图选词、听音选义、单词拼写、配对题、句子翻译
 */

window.Pages.Lesson = {
  state: null,

  render(lessonId) {
    // 找到关卡
    let lesson = null;
    for (const unit of window.APP_DATA.COURSES) {
      const found = unit.lessons.find(l => l.id === lessonId);
      if (found) { lesson = found; break; }
    }
    if (!lesson) {
      Utils.toast('关卡不存在', 'error');
      window.location.hash = '/home';
      return;
    }

    // 初始化状态
    const user = Store.getUser();
    this.state = {
      lesson,
      questions: this.generateQuestions(lesson),
      currentIndex: 0,
      hearts: user.hearts,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      totalXp: 0,
      startTime: Date.now(),
      doubleXpActive: user.doubleXpActive || false,
      answered: false
    };

    this.renderQuestion();
  },

  // 根据关卡生成题目
  generateQuestions(lesson) {
    const words = lesson.words.map(w => window.APP_DATA.WORDS[w]).filter(Boolean);
    const questions = [];
    const isBoss = lesson.type === 'boss';

    // Boss 关：生成更多题目，混合题型
    const types = isBoss
      ? ['translate', 'image', 'listen', 'spell', 'match', 'sentence']
      : ['translate', 'image', 'listen', 'spell'];

    words.forEach((word, i) => {
      const type = types[i % types.length];
      questions.push(this.makeQuestion(type, word, words));
    });

    // 最后一题固定配对题
    if (questions.length > 0 && !isBoss) {
      questions.push(this.makeQuestion('match', words[0], words));
    }

    return questions;
  },

  // 生成单个题目
  makeQuestion(type, word, allWords) {
    const base = { type, word: word.word, correctAnswer: '' };
    switch (type) {
      case 'translate': {
        // 中文释义 → 选英文
        const distractors = Utils.getDistractors(word.word, 3);
        const options = Utils.shuffle([word.word, ...distractors]);
        return { ...base, prompt: word.meaning, options, correctAnswer: word.word, hint: `首字母: ${word.word[0]}` };
      }
      case 'image': {
        // emoji 图 → 选英文
        const distractors = Utils.getDistractors(word.word, 3);
        const options = Utils.shuffle([word.word, ...distractors]);
        return { ...base, prompt: word.emoji, options, correctAnswer: word.word, hint: `${word.word.length}个字母` };
      }
      case 'listen': {
        // 听音 → 选中文释义
        const distractors = Utils.sample(allWords.filter(w => w.word !== word.word), 3).map(w => w.meaning);
        const options = Utils.shuffle([word.meaning, ...distractors]);
        return { ...base, prompt: '🔊', audioWord: word.word, options, correctAnswer: word.meaning, hint: `首字母: ${word.word[0]}` };
      }
      case 'spell': {
        // 中文释义 + 乱序字母拼出单词
        const letters = word.word.split('');
        const shuffled = Utils.shuffle(letters);
        return { ...base, prompt: word.meaning, letters: shuffled, correctAnswer: word.word, hint: `${word.word.length}个字母` };
      }
      case 'match': {
        // 配对题：4 个英文 ↔ 4 个中文
        const pairs = Utils.sample(allWords, 4).map(w => ({ en: w.word, zh: w.meaning }));
        return { ...base, pairs, correctAnswer: 'all' };
      }
      case 'sentence': {
        // 句子翻译：乱序单词排序
        const sentence = word.example;
        const wordsInSentence = sentence.replace(/[.,!?]/g, '').split(' ');
        const shuffled = Utils.shuffle(wordsInSentence);
        return { ...base, prompt: word.meaning, sentenceWords: shuffled, correctAnswer: sentence.replace(/[.,!?]/g, ''), fullSentence: sentence };
      }
    }
    return base;
  },

  // 渲染当前题目
  renderQuestion() {
    const q = this.state.questions[this.state.currentIndex];
    const total = this.state.questions.length;
    const progress = (this.state.currentIndex / total) * 100;
    const settings = Store.getSettings();

    document.getElementById('app').innerHTML = `
      <div class="page page--lesson">
        ${Components.lessonHeader(progress, this.state.hearts)}
        <div class="lesson-body" id="lesson-body">
          ${this.renderByType(q)}
        </div>
        <div class="lesson-tools">
          <button class="lesson-tool" id="btn-hint">💡 提示 (20💎)</button>
          <button class="lesson-tool" id="btn-skip">⏭️ 跳过 (50💎)</button>
        </div>
        ${this.state.combo >= 3 ? `<div class="combo-indicator">🔥 Combo x${this.state.combo}!</div>` : ''}
      </div>
    `;

    this.bindQuestionEvents(q);
  },

  // 根据题型渲染
  renderByType(q) {
    switch (q.type) {
      case 'translate':
        return `
          <div class="question">
            <div class="question__prompt">${q.prompt}</div>
            <div class="question__options">
              ${q.options.map(opt => `<button class="option" data-value="${opt}">${opt}</button>`).join('')}
            </div>
          </div>
        `;
      case 'image':
        return `
          <div class="question">
            <div class="question__image">${q.prompt}</div>
            <div class="question__prompt">这是什么单词？</div>
            <div class="question__options">
              ${q.options.map(opt => `<button class="option" data-value="${opt}">${opt}</button>`).join('')}
            </div>
          </div>
        `;
      case 'listen':
        return `
          <div class="question">
            <div class="question__audio">
              <button class="audio-btn" id="play-audio">
                <span class="audio-btn__icon">🔊</span>
              </button>
            </div>
            <div class="question__prompt">选择正确的释义</div>
            <div class="question__options">
              ${q.options.map(opt => `<button class="option" data-value="${opt}">${opt}</button>`).join('')}
            </div>
          </div>
        `;
      case 'spell':
        return `
          <div class="question">
            <div class="question__prompt">${q.prompt}</div>
            <div class="spell-answer" id="spell-answer"></div>
            <div class="spell-letters">
              ${q.letters.map((letter, i) => `<button class="letter-tile" data-letter="${letter}" data-idx="${i}">${letter}</button>`).join('')}
            </div>
          </div>
        `;
      case 'match':
        return `
          <div class="question">
            <div class="question__prompt">将英文与中文配对</div>
            <div class="match-game">
              <div class="match-column">
                ${q.pairs.map((p, i) => `<button class="match-item" data-side="en" data-idx="${i}" data-value="${p.en}">${p.en}</button>`).join('')}
              </div>
              <div class="match-column">
                ${Utils.shuffle(q.pairs).map((p, i) => `<button class="match-item" data-side="zh" data-idx="${i}" data-value="${p.zh}">${p.zh}</button>`).join('')}
              </div>
            </div>
          </div>
        `;
      case 'sentence':
        return `
          <div class="question">
            <div class="question__prompt">${q.prompt}</div>
            <div class="sentence-answer" id="sentence-answer"></div>
            <div class="sentence-words">
              ${q.sentenceWords.map((w, i) => `<button class="word-tile" data-word="${w}" data-idx="${i}">${w}</button>`).join('')}
            </div>
          </div>
        `;
    }
    return '';
  },

  // 绑定题目事件
  bindQuestionEvents(q) {
    // 退出
    document.getElementById('lesson-exit').addEventListener('click', () => {
      AudioEngine.playClick();
      if (confirm('退出本关？进度将不会保存。')) {
        window.location.hash = '/home';
      }
    });

    // 提示
    document.getElementById('btn-hint').addEventListener('click', () => this.useHint(q));
    // 跳过
    document.getElementById('btn-skip').addEventListener('click', () => this.useSkip(q));

    switch (q.type) {
      case 'translate':
      case 'image':
      case 'listen':
        this.bindChoiceEvents(q);
        break;
      case 'spell':
        this.bindSpellEvents(q);
        break;
      case 'match':
        this.bindMatchEvents(q);
        break;
      case 'sentence':
        this.bindSentenceEvents(q);
        break;
    }
  },

  // 绑定选择题（translate/image/listen）
  bindChoiceEvents(q) {
    if (q.type === 'listen') {
      const audioBtn = document.getElementById('play-audio');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          AudioEngine.playClick();
          Speech.speak(q.audioWord);
        });
        // 自动播放一次
        setTimeout(() => Speech.speak(q.audioWord), 400);
      }
    }
    document.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.state.answered) return;
        this.state.answered = true;
        AudioEngine.playClick();
        const value = btn.getAttribute('data-value');
        const correct = value === q.correctAnswer;
        // 标记所有选项
        document.querySelectorAll('.option').forEach(o => {
          if (o.getAttribute('data-value') === q.correctAnswer) {
            o.classList.add('option--correct');
          }
        });
        if (!correct) {
          btn.classList.add('option--wrong');
        }
        this.handleAnswer(correct, q);
      });
    });
  },

  // 绑定拼写题
  bindSpellEvents(q) {
    const answerEl = document.getElementById('spell-answer');
    let current = [];
    const renderAnswer = () => {
      answerEl.innerHTML = current.map((c, i) =>
        `<span class="spell-slot" data-idx="${i}">${c}</span>`
      ).join('');
      // 补齐空位
      const need = q.correctAnswer.length - current.length;
      if (need > 0) {
        answerEl.innerHTML += Array.from({ length: need }, () => '<span class="spell-slot spell-slot--empty"></span>').join('');
      }
    };
    renderAnswer();

    document.querySelectorAll('.letter-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        if (this.state.answered) return;
        if (tile.classList.contains('letter-tile--used')) return;
        AudioEngine.playClick();
        const letter = tile.getAttribute('data-letter');
        current.push(letter);
        tile.classList.add('letter-tile--used');
        renderAnswer();
        // 检查是否拼完
        if (current.length === q.correctAnswer.length) {
          this.state.answered = true;
          const correct = current.join('') === q.correctAnswer;
          answerEl.classList.add(correct ? 'spell-answer--correct' : 'spell-answer--wrong');
          if (!correct) {
            // 显示正确答案
            setTimeout(() => {
              answerEl.innerHTML = q.correctAnswer.split('').map(c => `<span class="spell-slot spell-slot--correct">${c}</span>`).join('');
            }, 500);
          }
          this.handleAnswer(correct, q);
        }
      });
    });
  },

  // 绑定配对题
  bindMatchEvents(q) {
    let selectedEn = null;
    let selectedZh = null;
    let matched = 0;
    const totalPairs = q.pairs.length;

    document.querySelectorAll('.match-item').forEach(item => {
      item.addEventListener('click', () => {
        if (this.state.answered) return;
        if (item.classList.contains('match-item--matched')) return;
        AudioEngine.playClick();
        const side = item.getAttribute('data-side');
        // 取消同侧已选
        if (side === 'en') {
          document.querySelectorAll('.match-item[data-side="en"].match-item--selected').forEach(s => s.classList.remove('match-item--selected'));
          item.classList.add('match-item--selected');
          selectedEn = item;
        } else {
          document.querySelectorAll('.match-item[data-side="zh"].match-item--selected').forEach(s => s.classList.remove('match-item--selected'));
          item.classList.add('match-item--selected');
          selectedZh = item;
        }

        // 两边都选了，检查配对
        if (selectedEn && selectedZh) {
          const enValue = selectedEn.getAttribute('data-value');
          const zhValue = selectedZh.getAttribute('data-value');
          const pair = q.pairs.find(p => p.en === enValue);
          if (pair && pair.zh === zhValue) {
            // 配对成功
            selectedEn.classList.remove('match-item--selected');
            selectedEn.classList.add('match-item--matched');
            selectedZh.classList.remove('match-item--selected');
            selectedZh.classList.add('match-item--matched');
            matched++;
            selectedEn = null;
            selectedZh = null;
            if (matched === totalPairs) {
              this.state.answered = true;
              this.handleAnswer(true, q);
            }
          } else {
            // 配对失败
            selectedEn.classList.add('match-item--wrong');
            selectedZh.classList.add('match-item--wrong');
            const enEl = selectedEn;
            const zhEl = selectedZh;
            setTimeout(() => {
              enEl.classList.remove('match-item--wrong', 'match-item--selected');
              zhEl.classList.remove('match-item--wrong', 'match-item--selected');
            }, 500);
            selectedEn = null;
            selectedZh = null;
            // 配对错误扣心
            this.state.combo = 0;
            const newHearts = Store.loseHeart();
            this.state.hearts = newHearts;
            this.updateHearts();
            AudioEngine.playWrong();
            if (newHearts <= 0) {
              this.state.answered = true;
              this.showFailDialog();
            }
          }
        }
      });
    });
  },

  // 绑定句子翻译题
  bindSentenceEvents(q) {
    const answerEl = document.getElementById('sentence-answer');
    let current = [];
    const renderAnswer = () => {
      answerEl.innerHTML = current.map((w, i) =>
        `<span class="sentence-word" data-idx="${i}">${w}</span>`
      ).join('');
    };
    renderAnswer();

    document.querySelectorAll('.word-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        if (this.state.answered) return;
        if (tile.classList.contains('word-tile--used')) return;
        AudioEngine.playClick();
        const word = tile.getAttribute('data-word');
        current.push(word);
        tile.classList.add('word-tile--used');
        renderAnswer();
        // 点击答案中的单词可以取消
        answerEl.querySelectorAll('.sentence-word').forEach((sw, idx) => {
          sw.addEventListener('click', () => {
            if (this.state.answered) return;
            const removed = current.splice(idx, 1)[0];
            // 找到对应 tile 取消使用
            document.querySelectorAll('.word-tile').forEach(t => {
              if (t.getAttribute('data-word') === removed && t.classList.contains('word-tile--used')) {
                t.classList.remove('word-tile--used');
              }
            });
            renderAnswer();
            this.bindSentenceRebind(q, answerEl, current);
          });
        });

        // 检查是否拼完
        if (current.length === q.sentenceWords.length) {
          this.state.answered = true;
          const answer = current.join(' ');
          const correct = answer.toLowerCase() === q.correctAnswer.toLowerCase();
          answerEl.classList.add(correct ? 'sentence-answer--correct' : 'sentence-answer--wrong');
          if (!correct) {
            setTimeout(() => {
              answerEl.innerHTML = `<span class="sentence-correct">${q.correctAnswer}</span>`;
            }, 500);
          }
          this.handleAnswer(correct, q);
        }
      });
    });
  },

  bindSentenceRebind(q, answerEl, current) {
    answerEl.querySelectorAll('.sentence-word').forEach((sw, idx) => {
      sw.addEventListener('click', () => {
        if (this.state.answered) return;
        const removed = current.splice(idx, 1)[0];
        document.querySelectorAll('.word-tile').forEach(t => {
          if (t.getAttribute('data-word') === removed && t.classList.contains('word-tile--used')) {
            t.classList.remove('word-tile--used');
          }
        });
        answerEl.innerHTML = current.map((w, i) => `<span class="sentence-word" data-idx="${i}">${w}</span>`).join('');
        this.bindSentenceRebind(q, answerEl, current);
      });
    });
  },

  // 处理答题结果
  handleAnswer(correct, q) {
    if (correct) {
      AudioEngine.playCorrect();
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.state.correctCount += 1;
      // XP 计算：基础 10，连击加成
      let xp = 10;
      if (this.state.combo >= 5) xp *= 2; // 5 连击双倍
      else if (this.state.combo >= 3) xp = Math.floor(xp * 1.5); // 3 连击 1.5 倍
      if (this.state.doubleXpActive) xp *= 2;
      this.state.totalXp += xp;

      // 更新单词本
      Store.updateWordbook(q.word, true);

      // 3 连击触发特效
      if (this.state.combo === 3 || this.state.combo === 5) {
        AudioEngine.playCombo();
        Utils.toast(`🔥 Combo x${this.state.combo}! ${this.state.combo >= 5 ? '双倍 XP!' : 'XP 加成!'}`, 'combo', 2000);
      }

      this.showFeedback(true, '', xp);
    } else {
      AudioEngine.playWrong();
      this.state.combo = 0;
      const newHearts = Store.loseHeart();
      this.state.hearts = newHearts;
      this.updateHearts();
      Store.updateWordbook(q.word, false);
      this.showFeedback(false, q.correctAnswer, 0);
      if (newHearts <= 0) {
        // 心扣完，延迟显示失败弹窗
        setTimeout(() => this.showFailDialog(), 1500);
        return;
      }
    }
  },

  // 更新生命值显示
  updateHearts() {
    const heartsEl = document.querySelector('.hearts');
    if (heartsEl) {
      heartsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<span class="hearts__icon ${i < this.state.hearts ? 'hearts__icon--full' : ''}">${i < this.state.hearts ? '❤️' : '🖤'}</span>`
      ).join('');
    }
  },

  // 显示反馈条
  showFeedback(correct, correctAnswer, xp) {
    const feedbackHtml = Components.feedbackBar(correct, correctAnswer, xp);
    const temp = document.createElement('div');
    temp.innerHTML = feedbackHtml;
    const feedback = temp.firstElementChild;
    document.querySelector('.page--lesson').appendChild(feedback);
    requestAnimationFrame(() => feedback.classList.add('feedback--show'));

    // XP 飘字
    if (correct && xp > 0) {
      const heartsEl = document.querySelector('.hearts');
      if (heartsEl) Utils.floatXp(heartsEl, xp);
    }

    // 猫头鹰表情
    const owl = correct ? Components.owl('happy') : Components.owl('sad');
    const owlContainer = document.createElement('div');
    owlContainer.className = 'feedback__owl';
    owlContainer.innerHTML = owl;
    feedback.appendChild(owlContainer);

    document.getElementById('feedback-continue').addEventListener('click', () => {
      AudioEngine.playClick();
      this.nextQuestion();
    });
  },

  // 下一题
  nextQuestion() {
    this.state.currentIndex += 1;
    this.state.answered = false;
    if (this.state.currentIndex >= this.state.questions.length) {
      this.finishLesson();
    } else {
      this.renderQuestion();
    }
  },

  // 完成关卡
  finishLesson() {
    const totalTime = Math.floor((Date.now() - this.state.startTime) / 1000);
    const accuracy = Math.round((this.state.correctCount / this.state.questions.length) * 100);
    let stars = 1;
    if (accuracy >= 80) stars = 2;
    if (accuracy >= 95) stars = 3;

    // 保存结算数据
    sessionStorage.setItem('lesson_result', JSON.stringify({
      lessonId: this.state.lesson.id,
      lessonTitle: this.state.lesson.title,
      xp: this.state.totalXp,
      accuracy,
      stars,
      time: totalTime,
      maxCombo: this.state.maxCombo,
      correct: this.state.correctCount,
      total: this.state.questions.length
    }));

    // 更新数据
    Store.completeLesson(this.state.lesson.id, stars);
    Store.updateStreak();
    Store.addXp(this.state.totalXp);
    // 重置双倍 XP
    const user = Store.getUser();
    if (user.doubleXpActive) {
      user.doubleXpActive = false;
      Store.setUser(user);
    }

    // 成就检查
    this.checkAchievements();

    window.location.hash = '/lesson-result';
  },

  // 检查成就
  checkAchievements() {
    const user = Store.getUser();
    const progress = Store.getProgress();
    const wordbook = Store.getWordbook();
    const unlocked = [];

    if (progress.completedLessons.length >= 1) {
      const a = Store.unlockAchievement('first_lesson');
      if (a) unlocked.push(a);
    }
    if (this.state.maxCombo >= 5) {
      const a = Store.unlockAchievement('combo_5');
      if (a) unlocked.push(a);
    }
    if (user.streak >= 3) {
      const a = Store.unlockAchievement('streak_3');
      if (a) unlocked.push(a);
    }
    if (user.streak >= 7) {
      const a = Store.unlockAchievement('streak_7');
      if (a) unlocked.push(a);
    }
    if (wordbook.filter(w => w.mastery >= 3).length >= 30) {
      const a = Store.unlockAchievement('word_master');
      if (a) unlocked.push(a);
    }
    if (Store.getLevel(user.xp) >= 5) {
      const a = Store.unlockAchievement('level_5');
      if (a) unlocked.push(a);
    }
    // 单元完成
    const unit1Done = window.APP_DATA.COURSES[0].lessons.every(l => progress.completedLessons.includes(l.id));
    if (unit1Done) { const a = Store.unlockAchievement('unit_1_done'); if (a) unlocked.push(a); }
    const unit2Done = window.APP_DATA.COURSES[1].lessons.every(l => progress.completedLessons.includes(l.id));
    if (unit2Done) { const a = Store.unlockAchievement('unit_2_done'); if (a) unlocked.push(a); }
    const unit3Done = window.APP_DATA.COURSES[2].lessons.every(l => progress.completedLessons.includes(l.id));
    if (unit3Done) { const a = Store.unlockAchievement('unit_3_done'); if (a) unlocked.push(a); }
    // 完美通关
    if (this.state.correctCount === this.state.questions.length) {
      const a = Store.unlockAchievement('first_perfect');
      if (a) unlocked.push(a);
    }

    // 显示成就横幅
    unlocked.forEach((a, i) => {
      setTimeout(() => Utils.achievementBanner(a), i * 1500);
    });
  },

  // 使用提示
  useHint(q) {
    const user = Store.getUser();
    if (user.gems < 20) {
      Utils.toast('💎 宝石不足', 'warn');
      return;
    }
    Store.spendGems(20);
    AudioEngine.playClick();
    Utils.toast(`💡 提示：${q.hint || '暂无提示'}`, 'info', 3000);
    // 更新宝石显示（在反馈条期间不更新）
  },

  // 跳过题目
  useSkip(q) {
    const user = Store.getUser();
    if (user.gems < 50) {
      Utils.toast('💎 宝石不足', 'warn');
      return;
    }
    if (this.state.answered) return;
    Store.spendGems(50);
    AudioEngine.playClick();
    this.state.answered = true;
    this.state.combo = 0;
    this.nextQuestion();
  },

  // 失败弹窗
  showFailDialog() {
    const user = Store.getUser();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal modal--fail">
        <div class="modal__owl">${Components.owl('sad')}</div>
        <h2 class="modal__title">生命值耗尽了！</h2>
        <p class="modal__desc">不要灰心，再试一次吧</p>
        <div class="modal__actions">
          <button class="btn btn--primary" id="btn-revive">💎 用 100 宝石续命</button>
          <button class="btn btn--secondary" id="btn-restart">重新开始</button>
          <button class="btn btn--ghost" id="btn-quit">返回首页</button>
        </div>
        <p class="modal__gems">当前宝石：${user.gems}</p>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('modal-overlay--show'));

    document.getElementById('btn-revive').addEventListener('click', () => {
      if (Store.spendGems(100)) {
        Store.addHeart(5);
        this.state.hearts = 5;
        AudioEngine.playHeartRecover();
        modal.remove();
        this.renderQuestion();
      } else {
        Utils.toast('💎 宝石不足', 'warn');
      }
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      AudioEngine.playClick();
      modal.remove();
      this.render(this.state.lesson.id);
    });
    document.getElementById('btn-quit').addEventListener('click', () => {
      AudioEngine.playClick();
      window.location.hash = '/home';
    });
  }
};
