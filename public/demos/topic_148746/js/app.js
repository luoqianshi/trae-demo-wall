const Storage = {
    KEY: 'zhixue_ai_v2',
    data: null,
    init() {
        const saved = localStorage.getItem(this.KEY);
        if (saved) {
            try { this.data = JSON.parse(saved); }
            catch(e) { this.data = this.getDefaultData(); }
        } else {
            this.data = this.getDefaultData();
        }
        this.checkStreak();
    },
    getDefaultData() {
        return {
            xp: 0, level: 1, hearts: 5, maxHearts: 5,
            streak: 0, maxStreak: 0, lastStudyDate: null,
            totalQuestions: 0, correctAnswers: 0,
            perfectSets: 0, feynmanCount: 0, speakingCount: 0, reviewCount: 0,
            subjectsTried: { english: false, math: false, chinese: false },
            masteryLevels: {}, cardStates: {},
            weakPoints: {}, achievements: {},
            lastHeartsRegen: Date.now()
        };
    },
    checkStreak() {
        const today = new Date().toDateString();
        if (this.data.lastStudyDate) {
            const last = new Date(this.data.lastStudyDate);
            const now = new Date(today);
            const diff = Math.floor((now - last) / (1000*60*60*24));
            if (diff === 1) {
                this.data.streak++;
                this.data.maxStreak = Math.max(this.data.streak, this.data.maxStreak);
            } else if (diff > 1) {
                this.data.streak = 0;
            }
        }
    },
    save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
    addXP(amount) {
        this.data.xp += amount;
        const newLevel = Math.floor(this.data.xp / 100) + 1;
        if (newLevel > this.data.level) {
            this.data.level = newLevel;
            this.data.hearts = this.data.maxHearts;
        }
        this.save();
    },
    loseHeart() {
        this.data.hearts = Math.max(0, this.data.hearts - 1);
        this.save();
    },
    updateUI() {
        document.getElementById('stat-hearts').textContent = this.data.hearts;
        document.getElementById('stat-streak').textContent = this.data.streak;
        document.getElementById('stat-level').textContent = 'Lv.' + this.data.level;
        updateProgressBars();
    }
};
const SM2 = {
    calculate(card, quality) {
        let state = Storage.data.cardStates[card.id] || { interval: 0, ease: 2.5, reps: 0, due: null };
        if (quality < 3) {
            state.reps = 0;
            state.interval = 1;
        } else {
            if (state.reps === 0) state.interval = 1;
            else if (state.reps === 1) state.interval = 6;
            else state.interval = Math.round(state.interval * state.ease);
            state.reps++;
            state.ease = Math.max(1.3, state.ease + (0.1 - (5-quality) * (0.08 + (5-quality)*0.02)));
        }
        const now = new Date();
        state.due = new Date(now.getTime() + state.interval * 24*60*60*1000).toISOString();
        Storage.data.cardStates[card.id] = state;
        Storage.data.masteryLevels[card.id] = Math.min(5, state.reps);
        Storage.save();
        return state;
    }
};
const App = {
    currentSubject: null,
    currentType: null,
    questionQueue: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    answered: false,
    hintsUsed: 0,
    sessionCorrect: 0,
    sessionTotal: 0,
    sessionStartTime: null,
    timerInterval: null,
    timerSeconds: 0,
    isReviewMode: false,
    init() {
        Storage.init();
        Storage.updateUI();
        this.renderSubjectGrid();
        this.bindEvents();
        this.loadReviewBadge();
        if (Storage.data.totalQuestions === 0) {
            setTimeout(() => {
                const englishCard = document.querySelector('.subject-card.english');
                if (englishCard) englishCard.click();
            }, 600);
        }
    },
    renderSubjectGrid() {
        const grid = document.getElementById('subject-grid');
        grid.innerHTML = Object.entries(SubjectConfig).map(([key, cfg]) => {
            const questions = KnowledgeBase[key];
            const mastered = questions.filter(q => (Storage.data.masteryLevels[q.id] || 0) >= 3).length;
            const percent = questions.length > 0 ? Math.round((mastered / questions.length) * 100) : 0;
            const done = questions.filter(q => Storage.data.masteryLevels[q.id] > 0).length;
            return `
                <div class="subject-card ${key}" onclick="App.selectSubject('${key}')">
                    <div class="subject-icon"><i class="fas ${cfg.icon}"></i></div>
                    <div class="subject-title">${cfg.name}</div>
                    <div class="subject-desc">${this.getSubjectDesc(key)}</div>
                    <div class="subject-stats">
                        <div class="subject-stat">
                            <div class="subject-stat-num">${questions.length}</div>
                            <div class="subject-stat-label">题目总数</div>
                        </div>
                        <div class="subject-stat">
                            <div class="subject-stat-num">${done}</div>
                            <div class="subject-stat-label">已练习</div>
                        </div>
                        <div class="subject-stat">
                            <div class="subject-stat-num">${mastered}</div>
                            <div class="subject-stat-label">已掌握</div>
                        </div>
                    </div>
                    <div class="subject-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${percent}%;background:${cfg.gradient};"></div>
                        </div>
                        <div class="progress-text">掌握度 ${percent}%</div>
                    </div>
                </div>`;
        }).join('');
    },
    getSubjectDesc(key) {
        const descs = {
            english: '音标、词汇、语法、听力、口语、阅读、完形、翻译全方位训练',
            math: '概念辨析、计算训练、选择填空、应用题、规律探究',
            chinese: '字音字形、词语成语、病句标点、古诗词、文言文、现代文阅读'
        };
        return descs[key];
    },
    selectSubject(subject) {
        this.currentSubject = subject;
        Storage.data.subjectsTried[subject] = true;
        Storage.save();
        this.renderTypeGrid();
        this.navigateTo('types');
    },
    renderTypeGrid() {
        const cfg = SubjectConfig[this.currentSubject];
        document.getElementById('type-selection-title').innerHTML = `<i class="fas ${cfg.icon}" style="color:${cfg.color};margin-right:10px;"></i>${cfg.name} - 选择题型`;
        const types = QuestionTypes[this.currentSubject];
        types.forEach(t => {
            t.count = KnowledgeBase[this.currentSubject].filter(q => q.type === t.id).length;
        });
        const grid = document.getElementById('type-grid');
        grid.innerHTML = types.map(t => {
            if (t.count === 0) return '';
            return `
                <div class="type-card" onclick="App.startType('${t.id}')">
                    <div class="type-card-icon"><i class="fas ${t.icon}" style="color:${cfg.color};"></i></div>
                    <div class="type-card-title">${t.name}</div>
                    <div class="type-card-desc">${t.desc}</div>
                    <span class="type-card-badge ${t.difficulty}">${t.count}题 · ${t.difficulty === 'easy' ? '基础' : t.difficulty === 'medium' ? '进阶' : '挑战'}</span>
                </div>`;
        }).join('');
    },
    startType(typeId) {
        this.currentType = typeId;
        this.isReviewMode = false;
        this.questionQueue = KnowledgeBase[this.currentSubject]
            .filter(q => q.type === typeId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
        if (this.questionQueue.length === 0) {
            alert('该题型暂无题目');
            return;
        }
        this.startSession();
    },
    startReview(cardId, subject) {
        this.currentSubject = subject;
        this.isReviewMode = true;
        const card = KnowledgeBase[subject].find(c => c.id === cardId);
        if (!card) return;
        this.currentType = card.type;
        this.questionQueue = [card];
        this.startSession();
    },
    startSession() {
        this.currentQuestionIndex = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.sessionStartTime = Date.now();
        this.hintsUsed = 0;
        this.timerSeconds = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            const m = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
            const s = (this.timerSeconds % 60).toString().padStart(2, '0');
            document.getElementById('timer-display').textContent = `${m}:${s}`;
        }, 1000);
        const typeInfo = QuestionTypes[this.currentSubject].find(t => t.id === this.currentType);
        const subjCfg = SubjectConfig[this.currentSubject];
        document.getElementById('learn-type-icon').className = `fas ${typeInfo ? typeInfo.icon : 'fa-question-circle'}`;
        document.getElementById('learn-type-title').textContent = `${subjCfg.name} · ${typeInfo ? typeInfo.name : '学习'}`;
        this.navigateTo('learn');
        this.renderQuestion();
    },
    renderQuestion() {
        const q = this.questionQueue[this.currentQuestionIndex];
        this.currentQuestion = q;
        this.answered = false;
        this.hintsUsed = 0;
        document.getElementById('hints-left').textContent = '3';
        document.getElementById('hint-btn').style.display = 'flex';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback-area').innerHTML = '';
        const progress = ((this.currentQuestionIndex) / this.questionQueue.length) * 100;
        document.getElementById('question-progress-fill').style.width = progress + '%';
        document.getElementById('question-progress-text').textContent = `${this.currentQuestionIndex + 1} / ${this.questionQueue.length}`;
        const diffBadge = document.getElementById('difficulty-badge');
        diffBadge.className = 'difficulty-badge ' + q.difficulty;
        diffBadge.textContent = q.difficulty === 'beginner' ? '入门' : q.difficulty === 'intermediate' ? '进阶' : '挑战';
        const area = document.getElementById('question-area');
        let html = '<div class="question-card">';
        if (q.passage) {
            html += `<div class="reading-passage">
                <div class="reading-passage-title">
                    <span>${q.passageTitle || '📖 阅读材料'}</span>
                    <button class="audio-btn" onclick="Speech.speak(\`${q.passage.replace(/`/g, "'").replace(/\n/g, ' ')}\`)" title="朗读全文"><i class="fas fa-volume-up"></i></button>
                </div>
                <div style="white-space:pre-line;font-size:15px;line-height:2;">${q.passage}</div>
            </div>`;
        }
        if (q.type === 'listening') {
            html += `<div class="listen-section">
                <button class="listen-icon" id="listen-btn" onclick="App.playListening()">
                    <i class="fas fa-headphones"></i>
                </button>
                <div style="font-weight:600;margin-bottom:8px;">🎧 听力理解</div>
                <div style="color:var(--text-secondary);font-size:14px;">点击喇叭播放，可反复听</div>
                <div class="wave-container" id="wave-container">
                    ${Array(20).fill(0).map(() => `<div class="wave-bar"></div>`).join('')}
                </div>
            </div>`;
        }
        if (q.type === 'speaking') {
            html += `<div class="speak-section">
                <div class="speak-text">${q.displayText || q.question}</div>
                <div style="margin-bottom:16px;">
                    <button class="audio-btn" onclick="Speech.speak(\`${q.speakText.replace(/`/g, "'")}\`)" style="width:50px;height:50px;font-size:18px;margin-right:12px;"><i class="fas fa-volume-up"></i></button>
                    <span style="color:var(--text-secondary);font-size:14px;">先听示范，再跟读</span>
                </div>
                <button class="mic-btn" id="mic-btn" onclick="App.startSpeaking()">
                    <i class="fas fa-microphone"></i>
                </button>
                <div style="color:var(--text-secondary);font-size:14px;margin-top:12px;">点击麦克风开始录音</div>
                <div class="speak-feedback" id="speak-feedback"></div>
            </div>`;
        }
        if (q.phonetic) {
            html += `<div class="phonetic-box">
                <span>${q.phonetic}</span>
                <button class="audio-btn" onclick="Speech.speak('${q.speakText || q.phonetic}')"><i class="fas fa-volume-up"></i></button>
            </div>`;
        }
        if (q.speakText && q.type !== 'speaking' && q.type !== 'listening' && q.type !== 'phonetics') {
            html += `<button class="audio-btn" onclick="Speech.speak('${q.speakText.replace(/'/g, "\\'")}')" style="margin-bottom:16px;"><i class="fas fa-volume-up"></i> 朗读</button>`;
        }
        html += `<div class="question-text">${q.question}</div>`;
        if (q.clozeText) {
            html += `<div style="background:rgba(59,130,246,0.08);padding:20px;border-radius:12px;margin-bottom:20px;line-height:2;font-size:15px;">${q.clozeText}</div>`;
        }
        if (q.typeInput === 'fill' || q.typeInput === 'speak') {
            if (q.typeInput === 'fill') {
                html += `<input type="text" class="fill-input" id="fill-answer" placeholder="输入你的答案..." autocomplete="off">`;
            }
        } else if (q.type !== 'speaking') {
            const letters = ['A', 'B', 'C', 'D', 'E'];
            html += `<div class="options-grid">`;
            const shuffled = [...q.options].sort(() => Math.random() - 0.5);
            shuffled.forEach((opt, i) => {
                html += `<button class="option-btn" data-index="${i}" onclick="App.selectOption(this, ${q.options.indexOf(opt)})">
                    <span class="option-letter">${letters[i]}</span>
                    <span>${opt.text}</span>
                </button>`;
            });
            html += `</div>`;
        }
        html += '</div>';
        area.innerHTML = html;
        if (q.typeInput === 'fill') {
            const input = document.getElementById('fill-answer');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !this.answered) this.submitFill();
                });
                setTimeout(() => input.focus(), 300);
            }
        }
    },
    selectOption(btn, idx) {
        if (this.answered) return;
        this.answered = true;
        const correct = this.currentQuestion.options[idx].correct;
        document.querySelectorAll('.option-btn').forEach(b => {
            b.disabled = true;
            const optIdx = parseInt(b.dataset.index);
            const shuffledOpts = [...this.currentQuestion.options].map((o, oi) => ({...o, origIdx: oi}));
        });
        document.querySelectorAll('.option-btn').forEach(b => {
            b.classList.add(b.textContent.includes(this.currentQuestion.options.find(o => o.correct).text) ? 'correct' : (b === btn && !correct ? 'wrong' : ''));
        });
        this.handleResult(correct);
    },
    submitFill() {
        if (this.answered) return;
        const input = document.getElementById('fill-answer');
        const userAns = input.value.trim().toLowerCase();
        if (!userAns) return;
        this.answered = true;
        input.disabled = true;
        let correct = false;
        const q = this.currentQuestion;
        if (q.answerList) {
            correct = q.answerList.some(a => {
                const ua = userAns.replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
                const aa = a.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
                return ua === aa || ua.includes(aa) || aa.includes(ua);
            });
        } else {
            const ua = userAns.replace(/[^a-z0-9\u4e00-\u9fa5,，。！？]/g, '');
            const aa = (q.answer || '').toString().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5,，。！？]/g, '');
            if (q.answer.includes(',')) {
                const answers = aa.split(/[,，]/);
                correct = answers.every(a => ua.includes(a.trim()));
            } else {
                correct = ua === aa || ua.includes(aa) || (aa.length > 2 && ua.includes(aa));
            }
        }
        input.classList.add(correct ? 'correct' : 'wrong');
        this.handleResult(correct);
    },
    handleResult(correct) {
        this.sessionTotal++;
        Storage.data.totalQuestions++;
        if (correct) {
            this.sessionCorrect++;
            Storage.data.correctAnswers++;
            Storage.addXP(10 + this.hintsUsed * -2);
            SM2.calculate(this.currentQuestion, 5 - this.hintsUsed);
        } else {
            Storage.loseHeart();
            Storage.data.weakPoints[this.currentQuestion.id] = {
                topic: this.currentQuestion.topic,
                subject: this.currentSubject,
                type: this.currentType,
                wrongAt: Date.now()
            };
            SM2.calculate(this.currentQuestion, 1);
        }
        if (correct && this.sessionCorrect >= 3) {
            Storage.data.maxStreak = Math.max(Storage.data.maxStreak, this.sessionCorrect);
        }
        Storage.save();
        Storage.updateUI();
        this.showFeedback(correct);
        if (correct && this.sessionCorrect > 1 && this.sessionCorrect % 5 === 0) {
            this.showCombo(this.sessionCorrect);
        }
        document.getElementById('next-btn').style.display = 'flex';
        document.getElementById('hint-btn').style.display = 'none';
        checkAchievements();
        if (Storage.data.hearts <= 0) {
            setTimeout(() => {
                alert('❤️ 生命值用完啦！休息一下，明天再来吧～（升级可以恢复满血哦）');
                this.navigateTo('home');
            }, 1500);
        }
    },
    showFeedback(correct) {
        const q = this.currentQuestion;
        const area = document.getElementById('feedback-area');
        let feedbackClass = correct ? 'correct' : 'wrong';
        let icon = correct ? '🎉' : '💪';
        let title = correct ? this.getCorrectMsg() : this.getWrongMsg();
        let html = `<div class="feedback-box ${feedbackClass}">
            <div class="feedback-icon">${correct ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}</div>
            <div class="feedback-text">
                <div class="feedback-title">${icon} ${title}</div>
                <div class="feedback-msg">${correct ? '太棒了！' : '没关系，错误是学习的好机会！'} ${this.hintsUsed > 0 ? `（使用了${this.hintsUsed}次提示）` : ''}</div>
            </div>
        </div>`;
        if (q.explanation) {
            html += `<div class="explanation-box">
                <div class="explanation-title"><i class="fas fa-lightbulb"></i> 解析</div>
                <div class="explanation-content">${q.explanation}</div>
            </div>`;
        }
        area.innerHTML = html;
    },
    getCorrectMsg() {
        const msgs = ['太棒了！答对了！', '完美！正确！', '你真厉害！', '完全正确！', '太棒了，掌握得很好！', 'Bingo！🎯'];
        return msgs[Math.floor(Math.random() * msgs.length)];
    },
    getWrongMsg() {
        const msgs = ['没关系，再想想！', '这个有点难，加油！', '错了不要紧，看看解析！', '再试一次！', '这个知识点需要再巩固一下！'];
        return msgs[Math.floor(Math.random() * msgs.length)];
    },
    showCombo(count) {
        const popup = document.getElementById('combo-popup');
        popup.textContent = `${count} 连击! 🔥`;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 1200);
    },
    showHint() {
        if (this.answered || this.hintsUsed >= 3) return;
        this.hintsUsed++;
        document.getElementById('hints-left').textContent = 3 - this.hintsUsed;
        const q = this.currentQuestion;
        const area = document.getElementById('question-area');
        let existingHint = area.querySelector('.hint-box');
        if (existingHint) existingHint.remove();
        const hint = document.createElement('div');
        hint.className = 'hint-box';
        hint.innerHTML = `
            <div class="hint-level">💡 提示 ${this.hintsUsed}/3</div>
            <div class="hint-content">${q.hints[this.hintsUsed - 1]}</div>
        `;
        area.appendChild(hint);
        if (this.hintsUsed >= 3) document.getElementById('hint-btn').style.display = 'none';
    },
    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questionQueue.length) {
            this.finishSession();
            return;
        }
        this.renderQuestion();
    },
    finishSession() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.sessionCorrect === this.sessionTotal && this.sessionTotal >= 5) {
            Storage.data.perfectSets++;
            Storage.addXP(30);
        }
        Storage.data.lastStudyDate = new Date().toDateString();
        Storage.save();
        const time = Math.floor(this.timerSeconds / 60) + '分' + (this.timerSeconds % 60) + '秒';
        const accuracy = this.sessionTotal > 0 ? Math.round((this.sessionCorrect / this.sessionTotal) * 100) : 0;
        let stars = '⭐'.repeat(Math.min(3, Math.ceil(accuracy / 34)));
        alert(`🎉 练习完成！\n\n正确率：${accuracy}%（${this.sessionCorrect}/${this.sessionTotal}）\n用时：${time}\n评价：${stars}\n获得 ${this.sessionCorrect * 10} 经验值！`);
        this.renderSubjectGrid();
        this.navigateTo('home');
    },
    playListening() {
        if (!this.currentQuestion || !this.currentQuestion.speakText) return;
        const btn = document.getElementById('listen-btn');
        const waves = document.querySelectorAll('#wave-container .wave-bar');
        if (btn) btn.classList.add('playing');
        waves.forEach((bar, i) => {
            bar.style.animation = `wave ${0.4 + Math.random() * 0.6}s ease-in-out infinite`;
            bar.style.animationDelay = `${i * 0.05}s`;
        });
        Speech.speak(this.currentQuestion.speakText).then(() => {
            if (btn) btn.classList.remove('playing');
            waves.forEach(bar => bar.style.animation = '');
        });
    },
    startSpeaking() {
        if (!Speech.isRecognitionSupported()) {
            const fb = document.getElementById('speak-feedback');
            fb.innerHTML = '<div style="color:var(--warning);">⚠️ 您的浏览器不支持语音识别，请使用Chrome浏览器</div>';
            fb.classList.add('show');
            return;
        }
        const btn = document.getElementById('mic-btn');
        const fb = document.getElementById('speak-feedback');
        if (this.isRecording) {
            Speech.stopRecording();
            btn.classList.remove('recording');
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            return;
        }
        this.isRecording = true;
        btn.classList.add('recording');
        btn.innerHTML = '<i class="fas fa-stop"></i>';
        fb.innerHTML = '<div style="color:var(--info);">🎤 正在录音...请大声跟读</div>';
        fb.classList.add('show');
        Speech.startRecording(
            (results) => {
                const best = results[0];
                const target = this.currentQuestion.speakText;
                const sim = Speech.checkSimilarity(best.text, target);
                this.answered = true;
                Storage.data.speakingCount++;
                let feedbackHtml = '';
                if (sim.perfect || sim.score >= 90) {
                    Storage.addXP(20);
                    feedbackHtml = `<div style="color:var(--success);font-weight:600;font-size:18px;">🎉 太棒了！发音非常标准！</div>
                        <div style="margin-top:10px;color:var(--text-secondary);">
                            识别结果：${best.text}<br>
                            标准句子：${target}<br>
                            相似度：<strong style="color:var(--success);">${sim.score}%</strong>
                        </div>`;
                    SM2.calculate(this.currentQuestion, 5);
                    this.sessionCorrect++;
                    Storage.data.correctAnswers++;
                } else if (sim.good || sim.score >= 70) {
                    Storage.addXP(10);
                    feedbackHtml = `<div style="color:var(--warning);font-weight:600;font-size:16px;">👍 不错！继续加油！</div>
                        <div style="margin-top:10px;color:var(--text-secondary);">
                            识别结果：${best.text}<br>
                            标准句子：${target}<br>
                            相似度：<strong style="color:var(--warning);">${sim.score}%</strong><br><br>
                            💡 建议：多听几遍示范，注意发音和语调，再试一次会更好！
                        </div>`;
                    SM2.calculate(this.currentQuestion, 3);
                    this.sessionCorrect++;
                    Storage.data.correctAnswers++;
                } else {
                    feedbackHtml = `<div style="color:var(--info);font-weight:600;">💪 再试一次！</div>
                        <div style="margin-top:10px;color:var(--text-secondary);">
                            识别结果：${best.text}<br>
                            标准句子：${target}<br>
                            相似度：<strong style="color:var(--info);">${sim.score}%</strong><br><br>
                            💡 建议：先仔细听示范，逐词跟读，注意每个单词的发音。
                        </div>`;
                    SM2.calculate(this.currentQuestion, 2);
                }
                fb.innerHTML = feedbackHtml;
                this.sessionTotal++;
                Storage.data.totalQuestions++;
                Storage.data.lastStudyDate = new Date().toDateString();
                Storage.save();
                Storage.updateUI();
                document.getElementById('next-btn').style.display = 'flex';
                document.getElementById('hint-btn').style.display = 'none';
                checkAchievements();
            },
            (err) => {
                this.isRecording = false;
                btn.classList.remove('recording');
                btn.innerHTML = '<i class="fas fa-microphone"></i>';
                if (err === 'no-speech') {
                    fb.innerHTML = '<div style="color:var(--warning);">没有检测到声音，请再试一次，声音大一点！</div>';
                } else if (err === 'not-allowed') {
                    fb.innerHTML = '<div style="color:var(--danger);">需要麦克风权限才能练习口语哦</div>';
                }
            }
        );
    },
    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        appState.currentPage = page;
        if (page === 'review') this.loadReviewPage();
        if (page === 'feynman') this.loadFeynmanPage();
        if (page === 'analysis') this.loadAnalysisPage();
        if (page === 'achievement') this.loadAchievementPage();
        if (page === 'home') this.renderSubjectGrid();
    },
    backToTypes() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.navigateTo('types');
    },
    loadReviewPage() {
        const now = new Date();
        const dueCards = [];
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        Object.entries(Storage.data.cardStates).forEach(([id, state]) => {
            if (state.due) {
                const dueDate = new Date(state.due);
                const card = [...KnowledgeBase.english, ...KnowledgeBase.math, ...KnowledgeBase.chinese].find(c => c.id === id);
                if (card) {
                    const diff = Math.floor((dueDate - today) / (1000*60*60*24));
                    let status = 'upcoming';
                    if (diff < 0) status = 'overdue';
                    else if (diff === 0) status = 'today';
                    dueCards.push({ card, state, status, diff });
                }
            }
        });
        dueCards.sort((a, b) => a.diff - b.diff);
        const container = document.getElementById('review-list');
        if (dueCards.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <div class="empty-state-text">太棒了！暂时没有需要复习的卡片</div>
                <div class="empty-state-sub">完成一些新题目后，系统会根据遗忘曲线安排复习时间</div>
            </div>`;
            return;
        }
        container.innerHTML = `<div class="review-grid">${dueCards.map(({card, state, status, diff}) => {
            const subj = SubjectConfig[card.subject];
            const statusText = status === 'overdue' ? `逾期${Math.abs(diff)}天` : status === 'today' ? '今天复习' : `${diff}天后`;
            const mastery = Storage.data.masteryLevels[card.id] || 0;
            return `<div class="review-card ${status}" onclick="App.startReview('${card.id}', '${card.subject}')">
                <div class="review-card-header">
                    <span class="review-card-subject ${card.subject}">${subj.name}</span>
                    <span class="review-card-due">${statusText}</span>
                </div>
                <div class="review-card-topic">${card.topic}</div>
                <div class="review-card-meta">
                    <span><i class="fas fa-redo"></i> 复习${state.reps}次</span>
                    <span><i class="fas fa-calendar"></i> 间隔${state.interval}天</span>
                </div>
                <div class="review-card-mastery">
                    ${Array(5).fill(0).map((_, i) => `<div class="mastery-dot ${i < mastery ? 'filled' : ''}"></div>`).join('')}
                </div>
            </div>`;
        }).join('')}</div>`;
    },
    loadReviewBadge() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let dueCount = 0;
        Object.values(Storage.data.cardStates).forEach(state => {
            if (state.due && new Date(state.due) <= today) dueCount++;
        });
        const badge = document.getElementById('review-badge');
        if (dueCount > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = dueCount;
        } else {
            badge.style.display = 'none';
        }
    },
    loadFeynmanPage() {
        const container = document.getElementById('feynman-topics');
        const mastered = [];
        ['english', 'math', 'chinese'].forEach(subject => {
            KnowledgeBase[subject].filter(c => {
                const m = Storage.data.masteryLevels[c.id] || 0;
                if (m >= 3) mastered.push({...c, subject});
                return m >= 3;
            });
        });
        const weakTopics = Object.entries(Storage.data.weakPoints || {}).slice(0, 3).map(([id, wp]) => {
            const card = [...KnowledgeBase.english, ...KnowledgeBase.math, ...KnowledgeBase.chinese].find(c => c.id === id);
            return card ? {...card, subject: wp.subject} : null;
        }).filter(Boolean);
        const topics = [...weakTopics, ...mastered.slice(0, 6)].slice(0, 6);
        if (topics.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <i class="fas fa-chalkboard-teacher"></i>
                <div class="empty-state-text">先去学习并掌握一些知识点吧</div>
                <div class="empty-state-sub">掌握几个知识点后（答对3次以上），就可以在这里使用费曼学习法了</div>
            </div>`;
            return;
        }
        container.innerHTML = topics.map((topic, i) => `
            <div class="feynman-topic">
                <div class="feynman-topic-title">
                    <i class="fas fa-lightbulb" style="color:#a78bfa;"></i>
                    ${topic.topic}
                    <span style="margin-left:auto;font-size:12px;color:var(--text-secondary);">${SubjectConfig[topic.subject].name}</span>
                </div>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;line-height:1.7;">
                    请用你自己的话，把这个知识点讲给一个完全不懂的小白听。就像老师在讲课一样，用生活中的比喻和例子，不要照搬书本定义！
                </p>
                <textarea class="feynman-textarea" id="feynman-input-${i}" placeholder="在这里写下你的讲解...&#10;&#10;比如：有理数加减法就像记账，正数是收入，负数是支出...&#10;Tips：用"这就像..."打比方，举生活中的例子！"></textarea>
                <button class="btn btn-primary" onclick="App.submitFeynman(${i})" style="margin-top:12px;">
                    <i class="fas fa-paper-plane"></i> 提交讲解
                </button>
                <div class="feynman-feedback" id="feynman-feedback-${i}"></div>
            </div>
        `).join('');
    },
    submitFeynman(i) {
        const input = document.getElementById(`feynman-input-${i}`);
        const feedback = document.getElementById(`feynman-feedback-${i}`);
        const text = input.value.trim();
        if (text.length < 30) {
            feedback.innerHTML = `<div style="color:var(--warning);"><i class="fas fa-exclamation-triangle"></i> 再多写一点！至少写30个字，尽量用自己的话，最好加上比喻和生活例子。费曼学习法的精髓就是"用最简单的话讲清楚"！</div>`;
            feedback.classList.add('show');
            return;
        }
        Storage.data.feynmanCount = (Storage.data.feynmanCount || 0) + 1;
        Storage.addXP(25);
        Storage.save();
        checkAchievements();
        const hasExample = /比如|例如|像|就像|好比|相当于|举个|比方说/.test(text);
        const longEnough = text.length > 100;
        const connectsLife = /生活|日常|我们|你|想象|记得|大家|其实|简单说/.test(text);
        const usesAnalogy = /就像|好比|相当于|类似|这就好比|和...一样/.test(text);
        let feedbackText = '';
        const score = (hasExample ? 25 : 0) + (longEnough ? 25 : 0) + (connectsLife ? 25 : 0) + (usesAnalogy ? 25 : 0);
        if (score >= 90) {
            feedbackText = `
                <div style="color:#34d399;font-weight:600;margin-bottom:10px;">🎉 太棒了！这是费曼学习法的完美示范！</div>
                <div style="color:var(--text-secondary);line-height:1.8;">
                    你成功地使用了比喻和生活例子，把知识点讲得通俗易懂！这说明你是真的理解了。<br><br>
                    💡 <strong>进阶建议：</strong>把这个讲解讲给你的同学或家人听，如果他们听完能懂并且能给别人讲，说明你彻底掌握了！这就是费曼学习法的终极检验标准。
                </div>`;
        } else if (score >= 50) {
            feedbackText = `
                <div style="color:#fbbf24;font-weight:600;margin-bottom:10px;">👍 不错的尝试！你已经理解了费曼学习法的核心</div>
                <div style="color:var(--text-secondary);line-height:1.8;">
                    你的讲解已经不错了，再加把劲就完美了：<br>
                    ${!usesAnalogy ? '• 🎯 试试用"这就像..."开头打个生动的比方<br>' : ''}
                    ${!hasExample ? '• 📝 加一个具体的生活例子会更有说服力<br>' : ''}
                    ${!longEnough ? '• 📖 可以再详细一点，把"为什么"讲清楚<br>' : ''}
                    ${!connectsLife ? '• 🌍 把知识点和日常生活联系起来<br>' : ''}
                </div>`;
        } else {
            feedbackText = `
                <div style="color:#60a5fa;font-weight:600;margin-bottom:10px;">💪 继续加油！试试费曼四步法：</div>
                <div style="color:var(--text-secondary);line-height:1.8;">
                    1️⃣ <strong>概念</strong>：先写出这个概念是什么<br>
                    2️⃣ <strong>类比</strong>：用"这就像___"打个生活中的比方（比如学物理就像学骑车）<br>
                    3️⃣ <strong>举例</strong>：举1-2个具体的例子<br>
                    4️⃣ <strong>总结</strong>：用一句话大白话总结<br><br>
                    ⚠️ 记住：不要用术语！假装你在给小学五年级学生讲题！
                </div>`;
        }
        feedback.innerHTML = feedbackText;
        feedback.classList.add('show');
        input.disabled = true;
    },
    loadAnalysisPage() {
        const subjects = ['english', 'math', 'chinese'];
        const scores = subjects.map(s => {
            const cards = KnowledgeBase[s];
            const totalMastery = cards.reduce((sum, c) => sum + (Storage.data.masteryLevels[c.id] || 0), 0);
            return Math.round((totalMastery / Math.max(1, cards.length * 5)) * 100);
        });
        if (window.radarChart) window.radarChart.destroy();
        const radarCtx = document.getElementById('radarChart').getContext('2d');
        window.radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['英语', '数学', '语文', '答题准确率', '学习连续性', '复习完成度'],
                datasets: [{
                    label: '能力值',
                    data: [
                        scores[0], scores[1], scores[2],
                        Storage.data.totalQuestions > 0 ? Math.round((Storage.data.correctAnswers / Storage.data.totalQuestions) * 100) : 0,
                        Math.min(Storage.data.streak * 15, 100),
                        50
                    ],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#818cf8'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#f1f5f9', font: { size: 13 } } }
                },
                plugins: { legend: { display: false } }
            }
        });
        if (window.barChart) window.barChart.destroy();
        const barCtx = document.getElementById('barChart').getContext('2d');
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        window.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: '答题数',
                    data: [5, 8, 12, 6, 15, 10, Math.min(Storage.data.totalQuestions, 25)],
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1, borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
        const tagsContainer = document.getElementById('knowledge-tags');
        const allTags = [];
        subjects.forEach(s => {
            KnowledgeBase[s].forEach(c => {
                const mastery = Storage.data.masteryLevels[c.id] || 0;
                c.tags.forEach(tag => {
                    if (!allTags.find(t => t.name === tag)) {
                        allTags.push({ name: tag, mastery, subject: s });
                    } else {
                        const existing = allTags.find(t => t.name === tag);
                        existing.mastery = Math.max(existing.mastery, mastery);
                    }
                });
            });
        });
        tagsContainer.innerHTML = allTags.map(tag => {
            let cls = 'weak';
            if (tag.mastery >= 4) cls = 'mastered';
            else if (tag.mastery >= 2) cls = 'learning';
            const icon = cls === 'mastered' ? '✓' : cls === 'learning' ? '◐' : '✗';
            return `<span class="knowledge-tag ${cls}">${icon} ${tag.name}</span>`;
        }).join('');
        const weakList = document.getElementById('weak-points-list');
        const weakPoints = Object.entries(Storage.data.weakPoints || {});
        if (weakPoints.length === 0) {
            weakList.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:30px;">
                <i class="fas fa-check-circle" style="font-size:40px;color:var(--success);margin-bottom:12px;display:block;"></i>
                太棒了！目前没有薄弱知识点，继续保持！
            </div>`;
        } else {
            weakList.innerHTML = weakPoints.map(([id, wp]) => `
                <div class="weak-point-item">
                    <div>
                        <span class="weak-point-name">${wp.topic}</span>
                        <span style="color:var(--text-secondary);font-size:13px;margin-left:8px;">${SubjectConfig[wp.subject].name}</span>
                    </div>
                    <button class="weak-point-action" onclick="App.startReview('${id}', '${wp.subject}')">立即攻克</button>
                </div>`).join('');
        }
    },
    loadAchievementPage() {
        const totalUnlocked = Object.values(Storage.data.achievements).filter(Boolean).length;
        document.getElementById('achievement-total').textContent = `${totalUnlocked}/${Achievements.length}`;
        document.getElementById('achievement-xp').textContent = Storage.data.xp;
        document.getElementById('achievement-questions').textContent = Storage.data.totalQuestions;
        document.getElementById('achievement-streak').textContent = Storage.data.maxStreak;
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = Achievements.map(a => {
            const unlocked = Storage.data.achievements[a.id];
            return `<div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.desc}</div>
            </div>`;
        }).join('');
    },
    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo(btn.dataset.page));
        });
        const chatToggle = document.getElementById('ai-chat-toggle');
        const chatWindow = document.getElementById('ai-chat-window');
        chatToggle.addEventListener('click', () => chatWindow.classList.toggle('show'));
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMessages = document.getElementById('chat-messages');
        function sendChat() {
            const text = chatInput.value.trim();
            if (!text) return;
            chatMessages.innerHTML += `<div class="chat-message user">${text}</div>`;
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            setTimeout(() => {
                const responses = [
                    '这个问题问得很好！让我用提问的方式引导你思考：你觉得这个问题的关键是什么？先告诉我你已经想到哪一步了？',
                    '别急着要答案哦～试着回忆一下：我们学过和这个相关的知识点是什么？哪个地方最让你困惑？',
                    '好问题！费曼说过"提出好问题比给出好答案更重要"。你先试着用自己的话说说：这道题在考什么知识点？',
                    '我看到你在思考，这非常棒！大脑正在建立新的神经连接呢。给你一个小提示：回到最基本的定义想想看？',
                    '遇到困难是学习中最好的信号——这说明你即将突破！你先试试把题目拆解成几个小部分？'
                ];
                chatMessages.innerHTML += `<div class="chat-message bot">${responses[Math.floor(Math.random() * responses.length)]}</div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 600);
        }
        chatSend.addEventListener('click', sendChat);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
    }
};
let appState = { currentPage: 'home' };
function checkAchievements() {
    Achievements.forEach(a => {
        if (!Storage.data.achievements[a.id] && a.condition(Storage.data)) {
            Storage.data.achievements[a.id] = true;
            Storage.addXP(50);
            showAchievementNotification(a);
        }
    });
}
function showAchievementNotification(a) {
    const el = document.getElementById('achievement-notification');
    document.getElementById('achievement-notification-text').textContent = ` ${a.name} ${a.icon}`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
}
function updateProgressBars() {
    App.loadReviewBadge();
}
document.addEventListener('DOMContentLoaded', () => App.init());
window.addEventListener('beforeunload', () => {
    localStorage.setItem('zhixue_last_page', appState.currentPage);
});
