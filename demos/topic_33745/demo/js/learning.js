const Learning = {
    currentModule: 'vocabulary',
    currentLessonId: null,
    vocabIndex: 0,
    vocabData: [],
    quizIndex: 0,
    quizData: [],
    speakingIndex: 0,
    speakingData: [],
    listeningData: null,

    render() {
        const container = document.getElementById('view-learning');
        container.innerHTML = `
            <div class="card">
                <div class="module-tabs">
                    <div class="module-tab ${this.currentModule === 'vocabulary' ? 'active' : ''}"
                         onclick="Learning.switchModule('vocabulary')">
                        <div class="module-tab-icon">📖</div>
                        <div class="module-tab-title">单词记忆</div>
                    </div>
                    <div class="module-tab ${this.currentModule === 'grammar' ? 'active' : ''}"
                         onclick="Learning.switchModule('grammar')">
                        <div class="module-tab-icon">✍️</div>
                        <div class="module-tab-title">语法练习</div>
                    </div>
                    <div class="module-tab ${this.currentModule === 'speaking' ? 'active' : ''}"
                         onclick="Learning.switchModule('speaking')">
                        <div class="module-tab-icon">🎤</div>
                        <div class="module-tab-title">口语跟读</div>
                    </div>
                    <div class="module-tab ${this.currentModule === 'listening' ? 'active' : ''}"
                         onclick="Learning.switchModule('listening')">
                        <div class="module-tab-icon">👂</div>
                        <div class="module-tab-title">听力训练</div>
                    </div>
                </div>
            </div>

            <div id="module-content"></div>
        `;

        this.loadLessonData();
    },

    switchModule(moduleName) {
        this.currentModule = moduleName;
        this.vocabIndex = 0;
        this.quizIndex = 0;
        this.speakingIndex = 0;
        this.render();
    },

    loadLessonData() {
        const content = document.getElementById('module-content');
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);

        let lessonId = this.currentLessonId;
        if (!lessonId) {
            const lessons = COURSE_DATA.lessons[user.currentLanguage][user.currentLevel] || [];
            if (lessons.length > 0) {
                const moduleLessons = lessons.filter(l => l.type === this.currentModule);
                lessonId = moduleLessons.length > 0 ? moduleLessons[0].id : lessons[0].id;
            }
        }

        switch (this.currentModule) {
            case 'vocabulary':
                this.vocabData = COURSE_DATA.vocabulary[lessonId] || this.getDefaultVocab(user.currentLanguage);
                this.currentLessonId = lessonId;
                this.renderVocabulary();
                break;
            case 'grammar':
                this.quizData = COURSE_DATA.grammar[lessonId] || this.getDefaultGrammar(user.currentLanguage);
                this.currentLessonId = lessonId;
                this.renderGrammar();
                break;
            case 'speaking':
                this.speakingData = COURSE_DATA.speaking[lessonId] || this.getDefaultSpeaking(user.currentLanguage);
                this.currentLessonId = lessonId;
                this.renderSpeaking();
                break;
            case 'listening':
                this.listeningData = COURSE_DATA.listening[lessonId] || this.getDefaultListening(user.currentLanguage);
                this.currentLessonId = lessonId;
                this.renderListening();
                break;
        }
    },

    getDefaultVocab(langId) {
        const defaults = {
            en: COURSE_DATA.vocabulary['en-a1-1'] || [],
            ja: COURSE_DATA.vocabulary['ja-n5-1'] || [],
            ko: COURSE_DATA.vocabulary['ko-1-1'] || []
        };
        return defaults[langId] || defaults.en;
    },

    getDefaultGrammar(langId) {
        const defaults = {
            en: COURSE_DATA.grammar['en-a1-4'],
            ja: COURSE_DATA.grammar['ja-n5-4'],
            ko: COURSE_DATA.grammar['ko-1-4']
        };
        return defaults[langId] || defaults.en;
    },

    getDefaultSpeaking(langId) {
        const defaults = {
            en: COURSE_DATA.speaking['en-a1-3'] || [],
            ja: COURSE_DATA.speaking['ja-n5-3'] || [],
            ko: COURSE_DATA.speaking['ko-1-3'] || []
        };
        return defaults[langId] || defaults.en;
    },

    getDefaultListening(langId) {
        const defaults = {
            en: COURSE_DATA.listening['en-a1-5'],
            ja: COURSE_DATA.listening['ja-n5-5'],
            ko: COURSE_DATA.listening['ko-1-5']
        };
        return defaults[langId] || defaults.en;
    },

    renderVocabulary() {
        const content = document.getElementById('module-content');
        if (!this.vocabData || this.vocabData.length === 0) {
            content.innerHTML = `
                <div class="learning-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">📖</div>
                        <h3>暂无单词数据</h3>
                        <p>请从课程中心选择具体课程</p>
                    </div>
                </div>
            `;
            return;
        }

        const vocab = this.vocabData[this.vocabIndex];
        const total = this.vocabData.length;

        content.innerHTML = `
            <div class="learning-container">
                <div class="vocab-card" onclick="Learning.flipCard(this)">
                    <div class="vocab-word">${vocab.word}</div>
                    <div class="vocab-phonetic">${vocab.phonetic}</div>
                    <div class="vocab-meaning">
                        <div style="font-size: 28px; margin-bottom: 12px;">${vocab.meaning}</div>
                        <div style="font-size: 16px; opacity: 0.9; font-style: italic;">"${vocab.example}"</div>
                    </div>
                    <div class="vocab-hint">点击卡片查看释义</div>
                </div>
                <div class="vocab-progress" style="margin-top: 24px;">
                    进度：${this.vocabIndex + 1} / ${total}
                </div>
                <div class="progress-bar-container" style="margin-top: 12px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${((this.vocabIndex + 1) / total) * 100}%;"></div>
                    </div>
                </div>
                <div class="vocab-actions" style="margin-top: 24px;">
                    <button class="btn btn-secondary" onclick="Learning.prevVocab()" ${this.vocabIndex === 0 ? 'disabled' : ''}>← 上一个</button>
                    <button class="btn btn-primary" onclick="Learning.speakWord('${vocab.word.replace(/'/g, "\\'")}')">🔊 朗读</button>
                    <button class="btn btn-success" onclick="Learning.nextVocab()">${this.vocabIndex === total - 1 ? '✓ 完成' : '下一个 →'}</button>
                </div>
            </div>
        `;
    },

    flipCard(card) {
        card.classList.toggle('flipped');
    },

    speakWord(word) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            UI.showToast('浏览器不支持语音功能', 'warning');
        }
    },

    prevVocab() {
        if (this.vocabIndex > 0) {
            this.vocabIndex--;
            this.renderVocabulary();
        }
    },

    nextVocab() {
        const username = Storage.getCurrentUser();
        Storage.incrementStat(username, 'vocabLearned', 1);

        if (this.vocabIndex < this.vocabData.length - 1) {
            this.vocabIndex++;
            this.renderVocabulary();
        } else {
            UI.completeLesson(this.currentLessonId, 30);
            UI.showToast('🎉 单词学习完成！', 'success');
            this.vocabIndex = 0;
            this.renderVocabulary();
        }
    },

    renderGrammar() {
        const content = document.getElementById('module-content');
        if (!this.quizData || !this.quizData.questions || this.quizData.questions.length === 0) {
            content.innerHTML = `
                <div class="learning-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">✍️</div>
                        <h3>暂无语法练习</h3>
                        <p>请从课程中心选择具体课程</p>
                    </div>
                </div>
            `;
            return;
        }

        const total = this.quizData.questions.length;
        const q = this.quizData.questions[this.quizIndex];

        content.innerHTML = `
            <div class="learning-container">
                <div class="grammar-quiz">
                    <div style="text-align: center; margin-bottom: 24px; padding: 16px; background: #eef2ff; border-radius: 12px;">
                        <h3 style="color: #6366f1; margin-bottom: 8px;">${this.quizData.title}</h3>
                        <p style="color: #64748b; font-size: 14px;">${this.quizData.explanation}</p>
                    </div>
                    <div style="text-align: right; color: #64748b; margin-bottom: 16px;">题目 ${this.quizIndex + 1} / ${total}</div>
                    <div class="quiz-question">${q.question}</div>
                    <div class="quiz-options" id="quiz-options">
                        ${q.options.map((opt, i) => `
                            <button class="quiz-option" data-index="${i}" onclick="Learning.selectAnswer(${i}, ${q.answer}, '${q.explain.replace(/'/g, "\\'")}')">
                                <strong>${String.fromCharCode(65 + i)}.</strong> ${opt}
                            </button>
                        `).join('')}
                    </div>
                    <div id="quiz-explanation" style="display: none; margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                        <div style="font-weight: 600; margin-bottom: 8px;">💡 解析</div>
                        <div id="explanation-text"></div>
                    </div>
                    <div id="quiz-next" style="display: none; text-align: center; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="Learning.nextQuestion()">${this.quizIndex === total - 1 ? '✓ 完成练习' : '下一题 →'}</button>
                    </div>
                </div>
            </div>
        `;
    },

    selectAnswer(selected, correct, explanation) {
        const options = document.querySelectorAll('.quiz-option');
        const username = Storage.getCurrentUser();
        Storage.incrementStat(username, 'grammarSolved', 1);

        options.forEach((opt, i) => {
            opt.classList.add('disabled');
            if (i === correct) {
                opt.classList.add('correct');
            } else if (i === selected) {
                opt.classList.add('wrong');
            }
        });

        const explEl = document.getElementById('quiz-explanation');
        const explText = document.getElementById('explanation-text');
        explText.textContent = explanation;
        explEl.style.display = 'block';

        document.getElementById('quiz-next').style.display = 'block';

        if (selected === correct) {
            Storage.addXP(username, 5);
            UI.showToast('✓ 回答正确！+5 XP', 'success');
        } else {
            UI.showToast('✗ 回答错误，再接再厉！', 'error');
        }
    },

    nextQuestion() {
        const total = this.quizData.questions.length;
        if (this.quizIndex < total - 1) {
            this.quizIndex++;
            this.renderGrammar();
        } else {
            UI.completeLesson(this.currentLessonId, 40);
            UI.showToast('🎉 语法练习完成！', 'success');
            this.quizIndex = 0;
            this.renderGrammar();
        }
    },

    renderSpeaking() {
        const content = document.getElementById('module-content');
        if (!this.speakingData || this.speakingData.length === 0) {
            content.innerHTML = `
                <div class="learning-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎤</div>
                        <h3>暂无口语练习</h3>
                        <p>请从课程中心选择具体课程</p>
                    </div>
                </div>
            `;
            return;
        }

        const item = this.speakingData[this.speakingIndex];
        const total = this.speakingData.length;

        content.innerHTML = `
            <div class="learning-container">
                <div class="speaking-practice">
                    <div style="text-align: right; color: #64748b; margin-bottom: 24px;">进度：${this.speakingIndex + 1} / ${total}</div>
                    <div class="speaking-sentence">${item.sentence}</div>
                    <div class="speaking-translation">${item.translation}</div>
                    <div style="margin: 40px 0;">
                        <button class="record-btn" onclick="Learning.toggleSpeak(this, '${item.sentence.replace(/'/g, "\\'")}')" id="speak-btn">
                            🔊
                        </button>
                        <div style="color: #64748b; margin-top: 12px;">点击听示范朗读</div>
                    </div>
                    <div style="padding: 24px; background: #f0fdf4; border-radius: 16px; margin: 24px 0;">
                        <div style="font-size: 48px;">🎤</div>
                        <div style="font-size: 18px; font-weight: 600; color: #10b981; margin: 8px 0;">跟读练习</div>
                        <div style="color: #64748b; font-size: 14px;">请大声跟读上面的句子</div>
                    </div>
                    <div class="speaking-actions">
                        <button class="btn btn-secondary" onclick="Learning.prevSpeaking()" ${this.speakingIndex === 0 ? 'disabled' : ''}>← 上一句</button>
                        <button class="btn btn-primary" onclick="Learning.completeSpeakingItem()">✓ 我已跟读</button>
                        <button class="btn btn-success" onclick="Learning.nextSpeaking()">${this.speakingIndex === total - 1 ? '✓ 完成' : '下一句 →'}</button>
                    </div>
                </div>
            </div>
        `;
    },

    toggleSpeak(btn, sentence) {
        if ('speechSynthesis' in window) {
            btn.classList.add('recording');
            btn.textContent = '🎵';
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.rate = 0.8;
            utterance.onend = () => {
                btn.classList.remove('recording');
                btn.textContent = '🔊';
            };
            speechSynthesis.speak(utterance);
        } else {
            UI.showToast('浏览器不支持语音功能', 'warning');
        }
    },

    prevSpeaking() {
        if (this.speakingIndex > 0) {
            this.speakingIndex--;
            this.renderSpeaking();
        }
    },

    completeSpeakingItem() {
        const username = Storage.getCurrentUser();
        Storage.incrementStat(username, 'speakingCompleted', 1);
        Storage.addXP(username, 3);
        UI.showToast('+3 XP', 'success');
    },

    nextSpeaking() {
        const total = this.speakingData.length;
        if (this.speakingIndex < total - 1) {
            this.speakingIndex++;
            this.renderSpeaking();
        } else {
            UI.completeLesson(this.currentLessonId, 40);
            UI.showToast('🎉 口语练习完成！', 'success');
            this.speakingIndex = 0;
            this.renderSpeaking();
        }
    },

    renderListening() {
        const content = document.getElementById('module-content');
        if (!this.listeningData || !this.listeningData.questions) {
            content.innerHTML = `
                <div class="learning-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">👂</div>
                        <h3>暂无听力材料</h3>
                        <p>请从课程中心选择具体课程</p>
                    </div>
                </div>
            `;
            return;
        }

        const data = this.listeningData;
        const total = data.questions.length;
        const q = data.questions[this.quizIndex];

        content.innerHTML = `
            <div class="learning-container">
                <div class="grammar-quiz">
                    <div class="listening-audio">
                        <button class="play-btn" onclick="Learning.playAudio()">▶</button>
                        <div class="audio-hint">点击播放音频材料 (可重复播放)</div>
                    </div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <button class="btn btn-secondary" onclick="Learning.showTranscript()">📝 查看原文</button>
                    </div>
                    <div id="transcript" style="display: none; padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 24px; font-size: 14px; line-height: 1.8;">
                        ${data.audio}
                    </div>
                    <div style="text-align: right; color: #64748b; margin-bottom: 16px;">题目 ${this.quizIndex + 1} / ${total}</div>
                    <div class="quiz-question">${q.question}</div>
                    <div class="quiz-options" id="listen-options">
                        ${q.options.map((opt, i) => `
                            <button class="quiz-option" data-index="${i}" onclick="Learning.selectListenAnswer(${i}, ${q.answer}, '${q.explain.replace(/'/g, "\\'")}')">
                                <strong>${String.fromCharCode(65 + i)}.</strong> ${opt}
                            </button>
                        `).join('')}
                    </div>
                    <div id="listen-explanation" style="display: none; margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                        <div style="font-weight: 600; margin-bottom: 8px;">💡 解析</div>
                        <div id="listen-explanation-text"></div>
                    </div>
                    <div id="listen-next" style="display: none; text-align: center; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="Learning.nextListen()">${this.quizIndex === total - 1 ? '✓ 完成练习' : '下一题 →'}</button>
                    </div>
                </div>
            </div>
        `;
    },

    playAudio() {
        const data = this.listeningData;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(data.audio);
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
            UI.showToast('🔊 正在播放音频...', 'info');
        } else {
            UI.showToast('浏览器不支持语音功能，请查看原文', 'warning');
            document.getElementById('transcript').style.display = 'block';
        }
    },

    showTranscript() {
        const t = document.getElementById('transcript');
        t.style.display = t.style.display === 'none' ? 'block' : 'none';
    },

    selectListenAnswer(selected, correct, explanation) {
        const options = document.querySelectorAll('#listen-options .quiz-option');
        const username = Storage.getCurrentUser();
        Storage.incrementStat(username, 'listeningCompleted', 1);

        options.forEach((opt, i) => {
            opt.classList.add('disabled');
            if (i === correct) {
                opt.classList.add('correct');
            } else if (i === selected) {
                opt.classList.add('wrong');
            }
        });

        const explEl = document.getElementById('listen-explanation');
        const explText = document.getElementById('listen-explanation-text');
        explText.textContent = explanation;
        explEl.style.display = 'block';

        document.getElementById('listen-next').style.display = 'block';

        if (selected === correct) {
            Storage.addXP(username, 5);
            UI.showToast('✓ 回答正确！+5 XP', 'success');
        } else {
            UI.showToast('✗ 回答错误', 'error');
        }
    },

    nextListen() {
        const total = this.listeningData.questions.length;
        if (this.quizIndex < total - 1) {
            this.quizIndex++;
            this.renderListening();
        } else {
            UI.completeLesson(this.currentLessonId, 40);
            UI.showToast('🎉 听力练习完成！', 'success');
            this.quizIndex = 0;
            this.renderListening();
        }
    }
};
