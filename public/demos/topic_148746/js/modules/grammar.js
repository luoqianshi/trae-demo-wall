const GrammarModule = {
    data: null,
    currentTopic: null,
    currentMode: 'learn',
    quizIndex: 0,
    quizScore: 0,
    quizTimer: null,
    quizTimeSpent: 0,

    async init() {
        this.data = await API.getGrammar();
        Router.register('grammar', () => this.render());
    },

    render() {
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">语法目录</h3>
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${this.data.topics.map(topic => `
                                <button onclick="GrammarModule.selectTopic('${topic.id}')" class="w-full text-left p-3 rounded-lg ${this.currentTopic?.id === topic.id ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'} transition-colors">
                                    ${topic.title}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="md:w-2/3">
                    ${this.renderContent()}
                </div>
            </div>
        `;
    },

    selectTopic(topicId) {
        this.currentTopic = this.data.topics.find(t => t.id === topicId);
        this.currentMode = 'learn';
        this.quizIndex = 0;
        this.quizScore = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },

    renderContent() {
        if (!this.currentTopic) {
            return `<div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">请先选择一个语法知识点开始学习</p>
            </div>`;
        }

        switch (this.currentMode) {
            case 'learn':
                return this.renderLearn();
            case 'practice':
                return this.renderPractice();
            default:
                return this.renderLearn();
        }
    },

    renderLearn() {
        const progress = Storage.getData().grammarProgress[this.currentTopic.id] || 'new';
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${this.currentTopic.title}</h2>
                        <p class="text-gray-600 mt-2">${this.currentTopic.description}</p>
                    </div>
                    <span class="badge ${progress === 'mastered' ? 'badge-mastered' : progress === 'learning' ? 'badge-learning' : 'badge-new'}">
                        ${progress === 'mastered' ? '已掌握' : progress === 'learning' ? '学习中' : '新内容'}
                    </span>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">知识点讲解</h3>
                    <div class="space-y-4">
                        ${this.currentTopic.rules.map((rule, index) => `
                            <div class="bg-blue-50 rounded-xl p-4 transition-all hover:shadow-md">
                                <div class="flex items-start">
                                    <span class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">${index + 1}</span>
                                    <div>
                                        <p class="font-semibold text-blue-700">${rule.rule}</p>
                                        <p class="text-gray-600 mt-1 italic">${rule.example}</p>
                                        <button onclick="GrammarModule.playExample('${rule.example}')" class="mt-2 text-blue-500 hover:text-blue-700 text-sm transition-colors">
                                            <i class="fas fa-volume-up mr-1"></i>听例句
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex justify-between">
                    <button onclick="GrammarModule.markProgress('${this.currentTopic.id}', '${progress === 'mastered' ? 'new' : 'mastered'}')" class="px-6 py-3 rounded-lg ${progress === 'mastered' ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'} transition-all hover:scale-105">
                        ${progress === 'mastered' ? '取消掌握' : '标记掌握'}
                    </button>
                    <button onclick="GrammarModule.startPractice()" class="btn-primary transition-all hover:scale-105">
                        <i class="fas fa-pencil-alt mr-2"></i>开始练习
                    </button>
                </div>
            </div>
        `;
    },

    renderPractice() {
        if (this.quizIndex >= this.currentTopic.exercises.length) {
            return this.renderPracticeResult();
        }

        const exercise = this.currentTopic.exercises[this.quizIndex];
        const total = this.currentTopic.exercises.length;
        const progress = Math.round(((this.quizIndex) / total) * 100);
        const combo = Storage.getCombo();

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="GrammarModule.currentMode='learn'; document.getElementById('page-content').innerHTML=GrammarModule.render()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回学习
                    </button>
                    <div class="flex items-center space-x-4">
                        ${combo > 0 ? `<span class="text-orange-500 font-bold text-lg">${combo}x Combo!</span>` : ''}
                        <span class="text-gray-500">第 ${this.quizIndex + 1} / ${total} 题</span>
                    </div>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                </div>

                <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">选择正确答案</h2>
                    <p class="text-gray-600 text-lg">${exercise.question}</p>
                </div>

                <div class="space-y-3">
                    ${exercise.options.map((opt, idx) => `
                        <div class="quiz-option" onclick="GrammarModule.checkAnswer(this, '${opt}', '${exercise.answer}')">
                            <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderPracticeResult() {
        const percentage = Math.round((this.quizScore / this.currentTopic.exercises.length) * 100);
        const combo = Storage.getCombo();
        const comboBonus = Math.floor(combo / 5) * 3;
        
        if (percentage >= 80) {
            Storage.addCoins(8 + comboBonus);
            Storage.addExp(15 + comboBonus);
            Storage.updateGrammarProgress(this.currentTopic.id, 'mastered');
            Storage.addBadge('grammar_master');
        } else if (percentage >= 60) {
            Storage.addCoins(4);
            Storage.addExp(8);
            Storage.updateGrammarProgress(this.currentTopic.id, 'learning');
        }

        Storage.addLearningRecord('grammar', this.quizScore, Math.round(this.quizTimeSpent / 1000));
        Storage.updateDailyStats('grammar', this.currentTopic.exercises.length);
        Storage.updateDailyChallenge('grammar', this.currentTopic.exercises.length);
        Storage.resetCombo();

        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <i class="fas fa-check-circle text-5xl text-green-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">练习完成！</h2>
                <p class="text-gray-600 mb-4">你的得分：${this.quizScore} / ${this.currentTopic.exercises.length}</p>
                ${combo > 0 ? `<p class="text-orange-500 font-bold text-lg mb-2">${combo}x Combo! 额外奖励 ${comboBonus} 金币</p>` : ''}
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xl font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                    ${percentage >= 80 ? '太棒了！继续保持！' : percentage >= 60 ? '不错哦，继续加油！' : '需要多练习哦'}
                </p>
                <div class="flex justify-center space-x-4 mt-6">
                    <button onclick="GrammarModule.startPractice()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再练一次
                    </button>
                    <button onclick="GrammarModule.currentMode='learn'; document.getElementById('page-content').innerHTML=GrammarModule.render()" class="btn-secondary">
                        返回学习
                    </button>
                </div>
            </div>
        `;
    },

    startPractice() {
        this.quizIndex = 0;
        this.quizScore = 0;
        this.quizTimeSpent = 0;
        this.currentMode = 'practice';
        
        if (this.quizTimer) clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeSpent += 1000;
        }, 1000);
        
        document.getElementById('page-content').innerHTML = this.render();
    },

    checkAnswer(element, selected, correct) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.onclick = null);

        if (selected === correct) {
            element.classList.add('correct');
            this.quizScore++;
            Storage.addCombo();
        } else {
            element.classList.add('incorrect');
            Storage.resetCombo();
            options.forEach(opt => {
                if (opt.textContent.includes(correct)) {
                    opt.classList.add('correct');
                }
            });
        }

        setTimeout(() => {
            this.quizIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }, 1500);
    },

    playExample(text) {
        API.speak(text);
    },

    markProgress(topicId, status) {
        Storage.updateGrammarProgress(topicId, status);
        document.getElementById('page-content').innerHTML = this.render();
    },

    stopTimer() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
    }
};