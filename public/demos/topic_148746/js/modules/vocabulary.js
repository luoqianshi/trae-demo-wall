const VocabularyModule = {
    data: null,
    currentMode: 'list',
    currentUnit: null,
    currentWordIndex: 0,
    quizWords: [],
    quizIndex: 0,
    quizScore: 0,
    quizType: 'meaning',
    quizTimer: null,
    quizTimeSpent: 0,
    lastCorrectAnimation: null,

    async init() {
        this.data = await API.getVocabulary();
        Router.register('vocabulary', () => this.render());
        Router.register('home', () => this.renderHome());
        Storage.checkStreak();
    },

    renderHome() {
        const data = Storage.getData();
        const today = new Date().toLocaleDateString('zh-CN');
        const todayStats = data.dailyStats[today] || { words: 0, grammar: 0, reading: 0, listening: 0, speaking: 0, games: 0 };
        const challenge = Storage.getDailyChallenge();
        const masteredWords = Object.keys(data.wordProgress).filter(k => data.wordProgress[k] === 'mastered').length;
        const totalWords = this.data ? this.data.units.flatMap(u => u.words).length : 0;
        
        const wordsProgress = Math.min(100, Math.round((challenge.completedWords / challenge.targetWords) * 100));
        const grammarProgress = Math.min(100, Math.round((challenge.completedGrammar / challenge.targetGrammar) * 100));
        const listeningProgress = Math.min(100, Math.round((challenge.completedListening / challenge.targetListening) * 100));
        const mathProgress = Math.min(100, Math.round(((challenge.completedMath || 0) / (challenge.targetMath || 5)) * 100));
        const chineseProgress = Math.min(100, Math.round(((challenge.completedChinese || 0) / (challenge.targetChinese || 5)) * 100));
        
        const expNeeded = data.user.level * 100;
        const expProgress = Math.round((data.user.exp / expNeeded) * 100);
        const toReviewCount = Storage.getItemsToReview(this.data.units.flatMap(u => u.words).map(w => w.id)).length;

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow-lg card-hover">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-book text-blue-600 text-xl"></i>
                        </div>
                        <span class="text-3xl font-bold text-blue-600">${data.user.coins}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">学习金币</h3>
                    <p class="text-gray-500 text-sm mt-1">加油赚金币！</p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-lg card-hover">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-600 text-xl"></i>
                        </div>
                        <span class="text-3xl font-bold text-green-600">${masteredWords}/${totalWords}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">已掌握单词</h3>
                    <p class="text-gray-500 text-sm mt-1">继续加油！</p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-lg card-hover">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-fire text-orange-600 text-xl"></i>
                        </div>
                        <span class="text-3xl font-bold text-orange-600">${data.user.streak}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">连续打卡</h3>
                    <p class="text-gray-500 text-sm mt-1">坚持每天学习！</p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-lg card-hover">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-award text-purple-600 text-xl"></i>
                        </div>
                        <span class="text-3xl font-bold text-purple-600">Lv.${data.user.level}</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">等级</h3>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-purple-500 h-2 rounded-full" style="width: ${expProgress}%"></div>
                    </div>
                </div>
            </div>

            <div class="mt-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 opacity-10">
                    <i class="fas fa-trophy text-9xl"></i>
                </div>
                <div class="flex justify-between items-start relative z-10">
                    <div>
                        <h3 class="text-xl font-bold flex items-center">
                            <i class="fas fa-target mr-2"></i>今日挑战
                        </h3>
                        <p class="text-yellow-100 mt-1">完成挑战获得额外奖励！</p>
                    </div>
                    ${data.combo > 0 ? `
                    <div class="combo-display animate-bounce">
                        <span class="text-3xl font-bold text-yellow-200">${data.combo}x</span>
                        <span class="text-lg">Combo!</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 relative z-10">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>单词</span>
                            <span>${challenge.completedWords}/${challenge.targetWords}</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${wordsProgress}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>语法</span>
                            <span>${challenge.completedGrammar}/${challenge.targetGrammar}</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${grammarProgress}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>听力</span>
                            <span>${challenge.completedListening}/${challenge.targetListening}</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${listeningProgress}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>数学</span>
                            <span>${challenge.completedMath || 0}/${challenge.targetMath || 5}</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${mathProgress}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span>语文</span>
                            <span>${challenge.completedChinese || 0}/${challenge.targetChinese || 5}</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-500" style="width: ${chineseProgress}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">快速开始</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onclick="VocabularyModule.startSmartQuiz()" class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl text-left card-hover transform transition-all">
                        <div class="flex items-center justify-between">
                            <div>
                                <i class="fas fa-brain text-3xl mb-3"></i>
                                <h3 class="text-xl font-semibold">智能复习</h3>
                                <p class="text-blue-100 mt-1">根据记忆曲线推荐复习</p>
                            </div>
                            <div class="bg-white/20 rounded-full px-3 py-1">
                                ${toReviewCount}待复习
                            </div>
                        </div>
                    </button>
                    <button onclick="Router.navigate('vocabulary')" class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl text-left card-hover transform transition-all">
                        <i class="fas fa-book text-3xl mb-3"></i>
                        <h3 class="text-xl font-semibold">单词学习</h3>
                        <p class="text-green-100 mt-1">按单元学习新单词</p>
                    </button>
                    <button onclick="Router.navigate('games')" class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl text-left card-hover transform transition-all">
                        <i class="fas fa-gamepad text-3xl mb-3"></i>
                        <h3 class="text-xl font-semibold">趣味游戏</h3>
                        <p class="text-purple-100 mt-1">玩游戏学英语，轻松有趣</p>
                    </button>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">今日学习统计</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-xl">
                            <p class="text-blue-600 font-bold text-xl">${todayStats.words}</p>
                            <p class="text-gray-500 text-sm">单词</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-xl">
                            <p class="text-green-600 font-bold text-xl">${todayStats.grammar}</p>
                            <p class="text-gray-500 text-sm">语法</p>
                        </div>
                        <div class="text-center p-4 bg-pink-50 rounded-xl">
                            <p class="text-pink-600 font-bold text-xl">${todayStats.listening}</p>
                            <p class="text-gray-500 text-sm">听力</p>
                        </div>
                        <div class="text-center p-4 bg-orange-50 rounded-xl">
                            <p class="text-orange-600 font-bold text-xl">${todayStats.reading}</p>
                            <p class="text-gray-500 text-sm">课文</p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-xl">
                            <p class="text-purple-600 font-bold text-xl">${todayStats.speaking}</p>
                            <p class="text-gray-500 text-sm">口语</p>
                        </div>
                        <div class="text-center p-4 bg-teal-50 rounded-xl">
                            <p class="text-teal-600 font-bold text-xl">${todayStats.math || 0}</p>
                            <p class="text-gray-500 text-sm">数学</p>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-xl">
                            <p class="text-red-600 font-bold text-xl">${todayStats.chinese || 0}</p>
                            <p class="text-gray-500 text-sm">语文</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-xl">
                            <p class="text-yellow-600 font-bold text-xl">${todayStats.games}</p>
                            <p class="text-gray-500 text-sm">游戏</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">我的徽章</h3>
                    <div class="flex flex-wrap gap-3">
                        ${this.renderBadges(data.user.badges)}
                    </div>
                </div>
            </div>
        `;
    },

    renderBadges(badges) {
        const badgeList = {
            'quiz_master': { name: '单词达人', icon: 'fa-trophy', color: 'text-yellow-500', bg: 'bg-yellow-100' },
            'listening_master': { name: '听力高手', icon: 'fa-headphones', color: 'text-pink-500', bg: 'bg-pink-100' },
            'grammar_master': { name: '语法专家', icon: 'fa-pencil-alt', color: 'text-green-500', bg: 'bg-green-100' },
            'game_winner': { name: '游戏冠军', icon: 'fa-gamepad', color: 'text-purple-500', bg: 'bg-purple-100' },
            'daily_champion': { name: '每日冠军', icon: 'fa-calendar-check', color: 'text-orange-500', bg: 'bg-orange-100' },
            'level_5': { name: '五级学者', icon: 'fa-star', color: 'text-blue-500', bg: 'bg-blue-100' },
            'level_10': { name: '十级大师', icon: 'fa-crown', color: 'text-yellow-600', bg: 'bg-yellow-200' },
            'streak_7': { name: '七日坚持', icon: 'fa-fire', color: 'text-red-500', bg: 'bg-red-100' },
            'streak_30': { name: '月坚持者', icon: 'fa-calendar', color: 'text-indigo-500', bg: 'bg-indigo-100' },
            'word_100': { name: '百词斩', icon: 'fa-book-open', color: 'text-emerald-500', bg: 'bg-emerald-100' }
        };

        return Object.keys(badgeList).map(id => {
            const badge = badgeList[id];
            const isUnlocked = badges.includes(id);
            return `
                <div class="flex flex-col items-center p-3 rounded-xl ${isUnlocked ? badge.bg : 'bg-gray-100'} transition-all ${isUnlocked ? 'animate-badge' : ''}">
                    <i class="fas ${badge.icon} text-lg ${isUnlocked ? badge.color : 'text-gray-400'}"></i>
                    <p class="text-xs font-medium ${isUnlocked ? 'text-gray-800' : 'text-gray-400'} mt-1">${isUnlocked ? badge.name : '???'}</p>
                </div>
            `;
        }).join('');
    },

    render() {
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">选择单元</h3>
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${this.data.units.map(unit => `
                                <button onclick="VocabularyModule.selectUnit('${unit.id}')" class="w-full text-left p-3 rounded-lg ${this.currentUnit?.id === unit.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors">
                                    ${unit.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4 mt-4">
                        <h3 class="font-bold text-gray-800 mb-4">学习模式</h3>
                        <div class="space-y-2">
                            <button onclick="VocabularyModule.setMode('list')" class="w-full text-left p-3 rounded-lg ${this.currentMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-list mr-2"></i>单词列表
                            </button>
                            <button onclick="VocabularyModule.setMode('flashcard')" class="w-full text-left p-3 rounded-lg ${this.currentMode === 'flashcard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-clipboard mr-2"></i>卡片记忆
                            </button>
                            <button onclick="VocabularyModule.startQuiz()" class="w-full text-left p-3 rounded-lg ${this.currentMode === 'quiz' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-question-circle mr-2"></i>单词测试
                            </button>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4 mt-4">
                        <h3 class="font-bold text-gray-800 mb-4">测试类型</h3>
                        <div class="space-y-2">
                            <button onclick="VocabularyModule.setQuizType('meaning')" class="w-full text-left p-3 rounded-lg ${this.quizType === 'meaning' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-language mr-2"></i>英译中
                            </button>
                            <button onclick="VocabularyModule.setQuizType('spelling')" class="w-full text-left p-3 rounded-lg ${this.quizType === 'spelling' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-pencil mr-2"></i>单词拼写
                            </button>
                            <button onclick="VocabularyModule.setQuizType('fillblank')" class="w-full text-left p-3 rounded-lg ${this.quizType === 'fillblank' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-edit mr-2"></i>选词填空
                            </button>
                            <button onclick="VocabularyModule.setQuizType('mixed')" class="w-full text-left p-3 rounded-lg ${this.quizType === 'mixed' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'} transition-colors">
                                <i class="fas fa-random mr-2"></i>混合模式
                            </button>
                        </div>
                    </div>
                </div>

                <div class="md:w-2/3">
                    ${this.renderContent()}
                </div>
            </div>
        `;
    },

    selectUnit(unitId) {
        this.currentUnit = this.data.units.find(u => u.id === unitId);
        this.currentWordIndex = 0;
        this.currentMode = 'list';
        document.getElementById('page-content').innerHTML = this.render();
    },

    setMode(mode) {
        this.currentMode = mode;
        this.currentWordIndex = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },

    setQuizType(type) {
        this.quizType = type;
        if (this.currentMode === 'quiz') {
            this.startQuiz();
        }
    },

    renderContent() {
        if (!this.currentUnit) {
            return `<div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">请先选择一个单元开始学习</p>
                <button onclick="VocabularyModule.startSmartQuiz()" class="mt-4 btn-primary">
                    <i class="fas fa-brain mr-2"></i>智能复习
                </button>
            </div>`;
        }

        switch (this.currentMode) {
            case 'list':
                return this.renderList();
            case 'flashcard':
                return this.renderFlashcard();
            case 'quiz':
                return this.renderQuiz();
            default:
                return this.renderList();
        }
    },

    renderList() {
        const progress = Storage.getData().wordProgress;
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">${this.currentUnit.name}</h2>
                    <button onclick="VocabularyModule.startSmartQuiz()" class="btn-primary">
                        <i class="fas fa-brain mr-2"></i>智能复习
                    </button>
                </div>
                <div class="space-y-3">
                    ${this.currentUnit.words.map(word => {
                        const status = progress[word.id] || 'new';
                        return `
                            <div class="flex items-center p-4 rounded-xl ${status === 'mastered' ? 'bg-green-50' : status === 'learning' ? 'bg-yellow-50' : 'bg-gray-50'} transition-all hover:shadow-md">
                                <button onclick="VocabularyModule.playSound('${word.word}')" class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4 hover:bg-blue-600 transition-all hover:scale-110">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <span class="text-lg font-bold text-gray-800">${word.word}</span>
                                        <span class="text-gray-500 ml-2">${word.phonetic}</span>
                                        <span class="badge ${status === 'mastered' ? 'badge-mastered' : status === 'learning' ? 'badge-learning' : 'badge-new'} ml-2">${status === 'mastered' ? '已掌握' : status === 'learning' ? '学习中' : '新单词'}</span>
                                    </div>
                                    <p class="text-gray-600 mt-1">${word.meaning}</p>
                                    <p class="text-gray-400 text-sm mt-1 italic">${word.example}</p>
                                </div>
                                <button onclick="VocabularyModule.markWord('${word.id}', '${status === 'mastered' ? 'new' : 'mastered'}')" class="px-4 py-2 rounded-lg ${status === 'mastered' ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'} transition-all hover:scale-105">
                                    ${status === 'mastered' ? '取消掌握' : '标记掌握'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderFlashcard() {
        const word = this.currentUnit.words[this.currentWordIndex];
        const total = this.currentUnit.words.length;
        const progress = Math.round(((this.currentWordIndex + 1) / total) * 100);
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="VocabularyModule.setMode('list')" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回列表
                    </button>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-500">${this.currentWordIndex + 1} / ${total}</span>
                    </div>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>

                <div class="card-flip h-72 cursor-pointer" onclick="VocabularyModule.flipCard(this)">
                    <div class="card-flip-inner w-full h-full relative">
                        <div class="card-flip-front absolute w-full h-full word-card">
                            <h2 class="text-4xl font-bold text-gray-800 mb-4">${word.word}</h2>
                            <p class="text-gray-500 text-lg">${word.phonetic}</p>
                            <button onclick="event.stopPropagation(); VocabularyModule.playSound('${word.word}')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg transition-all hover:scale-105">
                                <i class="fas fa-volume-up mr-2"></i>发音
                            </button>
                            <p class="text-gray-400 text-sm mt-4">点击卡片查看释义</p>
                        </div>
                        <div class="card-flip-back absolute w-full h-full word-card">
                            <h3 class="text-2xl font-bold text-blue-600 mb-4">${word.meaning}</h3>
                            <p class="text-gray-600 text-lg mt-4">例句：${word.example}</p>
                            <button onclick="event.stopPropagation(); VocabularyModule.playSound('${word.example}')" class="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg transition-all hover:scale-105">
                                <i class="fas fa-volume-up mr-2"></i>听例句
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between mt-6">
                    <button onclick="VocabularyModule.prevWord()" class="btn-primary ${this.currentWordIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentWordIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left mr-2"></i>上一个
                    </button>
                    <button onclick="VocabularyModule.nextWord()" class="btn-secondary">
                        下一个<i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderQuiz() {
        if (this.quizIndex >= this.quizWords.length) {
            return this.renderQuizResult();
        }

        const word = this.quizWords[this.quizIndex];
        const total = this.quizWords.length;
        const combo = Storage.getCombo();
        const progress = Math.round(((this.quizIndex) / total) * 100);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="VocabularyModule.setMode('list')" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>退出测试
                    </button>
                    <div class="flex items-center space-x-4">
                        ${combo > 0 ? `<span class="text-orange-500 font-bold text-xl combo-badge">${combo}x Combo!</span>` : ''}
                        <span class="text-gray-500">第 ${this.quizIndex + 1} / ${total} 题</span>
                    </div>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                </div>

                ${this.renderQuizQuestion(word)}
            </div>
        `;
    },

    renderQuizQuestion(word) {
        const options = this.generateOptions(word);
        
        switch (this.currentQuizType || this.quizType) {
            case 'spelling':
                return this.renderSpellingQuestion(word);
            case 'fillblank':
                return this.renderFillBlankQuestion(word, options);
            case 'mixed':
                this.currentQuizType = ['meaning', 'spelling', 'fillblank'][Math.floor(Math.random() * 3)];
                return this.renderQuizQuestion(word);
            default:
                return this.renderMeaningQuestion(word, options);
        }
    },

    renderMeaningQuestion(word, options) {
        return `
            <div class="text-center mb-6">
                <button onclick="VocabularyModule.playSound('${word.word}')" class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:bg-blue-600 transition-all hover:scale-110">
                    <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <h2 class="text-3xl font-bold text-gray-800">${word.word}</h2>
                <p class="text-gray-500 mt-2">${word.phonetic}</p>
            </div>

            <div class="space-y-3">
                ${options.map((opt, idx) => `
                    <div class="quiz-option" onclick="VocabularyModule.checkAnswer(this, '${opt.meaning}', '${word.meaning}', '${word.id}')">
                        <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">${String.fromCharCode(65 + idx)}</span>
                        <span>${opt.meaning}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderSpellingQuestion(word) {
        const scrambled = this.scrambleWord(word.word);
        
        return `
            <div class="text-center mb-6">
                <button onclick="VocabularyModule.playSound('${word.word}')" class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:bg-blue-600 transition-all hover:scale-110">
                    <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <p class="text-gray-600 text-lg mb-2">请拼写这个单词</p>
                <h2 class="text-xl font-semibold text-gray-700">${word.meaning}</h2>
                <p class="text-gray-400 text-sm mt-2">提示：${scrambled}</p>
            </div>

            <div class="max-w-md mx-auto">
                <input type="text" id="spelling-input" 
                    class="w-full text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-4 px-6 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="输入单词" autocomplete="off">
                <button onclick="VocabularyModule.checkSpellingAnswer('${word.word}', '${word.id}')" 
                    class="w-full mt-4 btn-primary text-lg">
                    <i class="fas fa-check mr-2"></i>提交答案
                </button>
            </div>
        `;
    },

    renderFillBlankQuestion(word, options) {
        const blankSentence = word.example.replace(word.word, '________');
        
        return `
            <div class="text-center mb-6">
                <button onclick="VocabularyModule.playSound('${word.example}')" class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:bg-green-600 transition-all hover:scale-110">
                    <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <p class="text-gray-600 text-lg mb-2">完成句子</p>
                <h2 class="text-xl font-bold text-gray-800">${blankSentence}</h2>
            </div>

            <div class="grid grid-cols-2 gap-3">
                ${options.map(opt => `
                    <div class="quiz-option text-center" onclick="VocabularyModule.checkAnswer(this, '${opt.word}', '${word.word}', '${word.id}')">
                        <span>${opt.word}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    scrambleWord(word) {
        const letters = word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        return letters.join('');
    },

    renderQuizResult() {
        const percentage = Math.round((this.quizScore / this.quizWords.length) * 100);
        const data = Storage.getData();
        const combo = data.combo;
        
        const baseCoins = percentage >= 80 ? 15 : percentage >= 60 ? 8 : 3;
        const baseExp = percentage >= 80 ? 30 : percentage >= 60 ? 15 : 8;
        const comboBonus = Math.floor(combo / 5) * 8;
        
        Storage.addCoins(baseCoins + comboBonus);
        Storage.addExp(baseExp + comboBonus);
        
        if (percentage >= 80) {
            Storage.addBadge('quiz_master');
        }

        const masteredWords = Object.keys(data.wordProgress).filter(k => data.wordProgress[k] === 'mastered').length;
        if (masteredWords >= 100) {
            Storage.addBadge('word_100');
        }

        Storage.addLearningRecord('vocabulary', this.quizScore, Math.round(this.quizTimeSpent / 1000));
        Storage.updateDailyStats('words', this.quizWords.length);
        Storage.updateDailyChallenge('words', this.quizWords.length);
        Storage.resetCombo();

        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">测试完成！</h2>
                <p class="text-gray-600 mb-4">你的得分：${this.quizScore} / ${this.quizWords.length}</p>
                ${combo > 0 ? `<p class="text-orange-500 font-bold text-lg mb-2">${combo}x Combo! 额外奖励 ${comboBonus} 金币</p>` : ''}
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xl font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                    ${percentage >= 80 ? '太棒了！继续保持！' : percentage >= 60 ? '不错哦，继续加油！' : '需要多练习哦'}
                </p>
                <div class="flex justify-center space-x-4 mt-6">
                    <button onclick="VocabularyModule.startQuiz()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再测一次
                    </button>
                    <button onclick="VocabularyModule.setMode('list')" class="btn-secondary">
                        返回列表
                    </button>
                </div>
            </div>
        `;
    },

    startQuiz() {
        this.quizWords = this.getSmartQuizWords();
        this.quizIndex = 0;
        this.quizScore = 0;
        this.currentQuizType = null;
        this.quizTimeSpent = 0;
        this.currentMode = 'quiz';
        
        if (this.quizTimer) clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeSpent += 1000;
        }, 1000);
        
        document.getElementById('page-content').innerHTML = this.render();
    },

    startSmartQuiz() {
        this.currentUnit = { id: 'smart', name: '智能复习', words: this.data.units.flatMap(u => u.words) };
        this.quizWords = this.getSmartQuizWords();
        this.quizIndex = 0;
        this.quizScore = 0;
        this.currentQuizType = null;
        this.quizTimeSpent = 0;
        this.currentMode = 'quiz';
        
        if (this.quizTimer) clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeSpent += 1000;
        }, 1000);
        
        document.getElementById('page-content').innerHTML = this.render();
    },

    getSmartQuizWords() {
        const allWords = this.currentUnit ? this.currentUnit.words : this.data.units.flatMap(u => u.words);
        const wordIds = allWords.map(w => w.id);
        const toReview = Storage.getItemsToReview(wordIds);
        
        let selectedWords = shuffleArray(toReview.map(id => allWords.find(w => w.id === id)));
        
        if (selectedWords.length < 5) {
            const remaining = allWords.filter(w => !toReview.includes(w.id));
            selectedWords = selectedWords.concat(shuffleArray(remaining).slice(0, 15 - selectedWords.length));
        } else {
            selectedWords = selectedWords.slice(0, 15);
        }
        
        return shuffleArray(selectedWords);
    },

    generateOptions(correctWord) {
        const allWords = this.data.units.flatMap(u => u.words);
        const options = [correctWord];
        
        while (options.length < 4) {
            const randomWord = allWords[getRandomInt(0, allWords.length - 1)];
            if (!options.find(o => o.id === randomWord.id)) {
                options.push(randomWord);
            }
        }
        
        return shuffleArray(options);
    },

    checkAnswer(element, selected, correct, wordId) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.onclick = null);

        if (selected === correct) {
            element.classList.add('correct');
            this.quizScore++;
            Storage.addCombo();
            Storage.updateSRS(wordId, true);
            Storage.updateWordProgress(wordId, 'mastered');
            this.showCorrectAnimation(element);
        } else {
            element.classList.add('incorrect');
            Storage.resetCombo();
            Storage.updateSRS(wordId, false);
            Storage.updateWordProgress(wordId, 'learning');
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

    checkSpellingAnswer(correctWord, wordId) {
        const input = document.getElementById('spelling-input');
        const selected = input.value.trim().toLowerCase();
        
        if (selected === correctWord.toLowerCase()) {
            input.classList.add('correct');
            this.quizScore++;
            Storage.addCombo();
            Storage.updateSRS(wordId, true);
            Storage.updateWordProgress(wordId, 'mastered');
        } else {
            input.classList.add('incorrect');
            Storage.resetCombo();
            Storage.updateSRS(wordId, false);
            Storage.updateWordProgress(wordId, 'learning');
            input.value = correctWord;
        }

        setTimeout(() => {
            this.quizIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }, 1500);
    },

    showCorrectAnimation(element) {
        if (this.lastCorrectAnimation) {
            clearTimeout(this.lastCorrectAnimation);
        }
        
        const combo = Storage.getCombo();
        if (combo >= 5) {
            const particle = document.createElement('div');
            particle.className = 'combo-particle';
            particle.textContent = `${combo}x!`;
            element.appendChild(particle);
            
            this.lastCorrectAnimation = setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    },

    flipCard(element) {
        element.classList.toggle('flipped');
    },

    prevWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    nextWord() {
        if (this.currentWordIndex < this.currentUnit.words.length - 1) {
            this.currentWordIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    playSound(text) {
        API.speak(text);
    },

    markWord(wordId, status) {
        Storage.updateWordProgress(wordId, status);
        document.getElementById('page-content').innerHTML = this.render();
    },

    stopTimer() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
    }
};