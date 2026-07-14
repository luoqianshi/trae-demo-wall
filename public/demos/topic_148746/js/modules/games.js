const GamesModule = {
    currentGame: null,
    matchingCards: [],
    matchingSelected: [],
    matchingScore: 0,
    fillBlankWords: [],
    fillBlankIndex: 0,
    fillBlankScore: 0,
    wordRaceWords: [],
    wordRaceIndex: 0,
    wordRaceScore: 0,
    timeLeft: 60,
    timer: null,
    difficulty: 'easy',

    async init() {
        Router.register('games', () => this.render());
    },

    render() {
        const data = Storage.getData();
        const todayStats = data.dailyStats[new Date().toLocaleDateString('zh-CN')] || { games: 0 };
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer" onclick="GamesModule.startMatchingGame()">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-link text-3xl text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">单词连连看</h3>
                        <p class="text-gray-500 mt-2">找到匹配的单词和释义</p>
                        <div class="mt-4 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">热门</div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer" onclick="GamesModule.startFillBlankGame()">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-pen text-3xl text-green-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">填空闯关</h3>
                        <p class="text-gray-500 mt-2">填写正确的单词完成句子</p>
                        <div class="mt-4 px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">进阶</div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer" onclick="GamesModule.startWordRaceGame()">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-trophy text-3xl text-purple-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">单词竞速</h3>
                        <p class="text-gray-500 mt-2">限时内答对更多单词</p>
                        <div class="mt-4 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm font-medium">挑战</div>
                    </div>
                </div>
            </div>

            <div class="mt-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold">游戏统计</h3>
                        <p class="text-purple-100 mt-1">今日已玩 ${todayStats.games} 次</p>
                    </div>
                    <div class="text-right">
                        <p class="text-3xl font-bold">${data.user.coins}</p>
                        <p class="text-purple-100">金币</p>
                    </div>
                </div>
            </div>
        `;
    },

    startMatchingGame() {
        this.currentGame = 'matching';
        this.initMatchingGame();
        document.getElementById('page-content').innerHTML = this.renderMatchingGame();
    },

    initMatchingGame() {
        const vocabulary = [
            { word: 'classmate', meaning: '同学' },
            { word: 'friend', meaning: '朋友' },
            { word: 'teacher', meaning: '老师' },
            { word: 'student', meaning: '学生' },
            { word: 'school', meaning: '学校' },
            { word: 'family', meaning: '家庭' },
            { word: 'father', meaning: '父亲' },
            { word: 'mother', meaning: '母亲' },
            { word: 'brother', meaning: '兄弟' },
            { word: 'sister', meaning: '姐妹' },
            { word: 'book', meaning: '书' },
            { word: 'pen', meaning: '钢笔' }
        ];

        const selected = shuffleArray(vocabulary).slice(0, this.difficulty === 'easy' ? 6 : this.difficulty === 'medium' ? 8 : 10);

        this.matchingCards = [];
        selected.forEach(v => {
            this.matchingCards.push({ id: v.word, text: v.word, type: 'word', matched: false });
            this.matchingCards.push({ id: v.word, text: v.meaning, type: 'meaning', matched: false });
        });

        this.matchingCards = shuffleArray(this.matchingCards);
        this.matchingSelected = [];
        this.matchingScore = 0;
        this.timeLeft = this.difficulty === 'easy' ? 90 : this.difficulty === 'medium' ? 60 : 45;
        this.startTimer();
    },

    renderMatchingGame() {
        const gridCols = this.matchingCards.length <= 12 ? 'grid-cols-4' : this.matchingCards.length <= 16 ? 'grid-cols-4' : 'grid-cols-5';
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回游戏选择
                    </button>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-600">分数：<span class="font-bold text-blue-600 text-xl">${this.matchingScore}</span></span>
                        <span class="text-gray-600">时间：<span class="font-bold ${this.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-green-600'} text-xl">${this.timeLeft}s</span></span>
                    </div>
                </div>

                <div class="grid ${gridCols} gap-3">
                    ${this.matchingCards.map((card, index) => `
                        <div class="game-card ${card.matched ? 'matched' : ''} ${this.matchingSelected.includes(index) ? 'selected' : ''}" onclick="GamesModule.selectMatchingCard(${index})">
                            <div class="text-center">
                                <p class="font-semibold ${card.type === 'word' ? 'text-blue-600' : 'text-green-600'}">${card.text}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${this.checkMatchingGameEnd() ? this.renderMatchingResult() : ''}
            </div>
        `;
    },

    selectMatchingCard(index) {
        if (this.matchingCards[index].matched || this.matchingSelected.includes(index)) return;
        if (this.matchingSelected.length >= 2) return;

        this.matchingSelected.push(index);
        document.getElementById('page-content').innerHTML = this.renderMatchingGame();

        if (this.matchingSelected.length === 2) {
            const [first, second] = this.matchingSelected;
            const card1 = this.matchingCards[first];
            const card2 = this.matchingCards[second];

            if (card1.id === card2.id && card1.type !== card2.type) {
                card1.matched = true;
                card2.matched = true;
                this.matchingScore += 20;
            }

            setTimeout(() => {
                this.matchingSelected = [];
                document.getElementById('page-content').innerHTML = this.renderMatchingGame();
            }, 600);
        }
    },

    checkMatchingGameEnd() {
        return this.matchingCards.every(card => card.matched) || this.timeLeft <= 0;
    },

    renderMatchingResult() {
        const isWin = this.matchingCards.every(card => card.matched);
        const percentage = Math.round((this.matchingScore / (this.matchingCards.length * 10)) * 100);
        
        if (isWin) {
            Storage.addCoins(30);
            Storage.addExp(25);
            Storage.addBadge('game_winner');
        } else if (percentage >= 60) {
            Storage.addCoins(10);
            Storage.addExp(10);
        }

        Storage.updateDailyStats('games', 1);

        return `
            <div class="mt-6 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <i class="fas ${isWin ? 'fa-trophy' : 'fa-clock'} text-5xl ${isWin ? 'text-yellow-500' : 'text-blue-500'}"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${isWin ? '恭喜通关！' : '时间到！'}</h2>
                <p class="text-gray-600 mb-4">最终得分：${this.matchingScore}</p>
                <div class="flex justify-center space-x-4">
                    <button onclick="GamesModule.startMatchingGame(); document.getElementById('page-content').innerHTML=GamesModule.renderMatchingGame()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再玩一次
                    </button>
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="btn-secondary">
                        返回选择
                    </button>
                </div>
            </div>
        `;
    },

    startFillBlankGame() {
        this.currentGame = 'fillblank';
        this.initFillBlankGame();
        document.getElementById('page-content').innerHTML = this.renderFillBlankGame();
    },

    initFillBlankGame() {
        const vocabulary = [
            { sentence: 'I have a happy ______.', answer: 'family', options: ['family', 'school', 'friend', 'teacher'] },
            { sentence: 'She is my best ______.', answer: 'friend', options: ['friend', 'family', 'school', 'student'] },
            { sentence: 'My ______ is a doctor.', answer: 'father', options: ['father', 'mother', 'sister', 'brother'] },
            { sentence: 'I go to ______ every day.', answer: 'school', options: ['school', 'home', 'park', 'shop'] },
            { sentence: 'Our ______ is very kind.', answer: 'teacher', options: ['teacher', 'student', 'friend', 'classmate'] },
            { sentence: 'He is my little ______.', answer: 'brother', options: ['brother', 'sister', 'father', 'mother'] },
            { sentence: 'She has a beautiful ______.', answer: 'dress', options: ['dress', 'shirt', 'pants', 'coat'] },
            { sentence: 'I read a ______ every day.', answer: 'book', options: ['book', 'pen', 'pencil', 'bag'] },
            { sentence: 'What ______ is it?', answer: 'time', options: ['time', 'day', 'week', 'month'] },
            { sentence: 'It is ______ today.', answer: 'sunny', options: ['sunny', 'rainy', 'cloudy', 'windy'] }
        ];

        this.fillBlankWords = shuffleArray(vocabulary).slice(0, 8);
        this.fillBlankIndex = 0;
        this.fillBlankScore = 0;
        this.timeLeft = 90;
        this.startTimer();
    },

    renderFillBlankGame() {
        if (this.fillBlankIndex >= this.fillBlankWords.length) {
            return this.renderFillBlankResult();
        }

        const word = this.fillBlankWords[this.fillBlankIndex];
        const total = this.fillBlankWords.length;
        const progress = Math.round(((this.fillBlankIndex) / total) * 100);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回游戏选择
                    </button>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-600">第 ${this.fillBlankIndex + 1} / ${total} 题</span>
                        <span class="text-gray-600">分数：<span class="font-bold text-green-600 text-xl">${this.fillBlankScore}</span></span>
                        <span class="text-gray-600">时间：<span class="font-bold ${this.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-green-600'} text-xl">${this.timeLeft}s</span></span>
                    </div>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                </div>

                <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">完成句子</h2>
                    <p class="text-gray-600 text-xl">${word.sentence}</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${word.options.map(opt => `
                        <div class="quiz-option text-center" onclick="GamesModule.checkFillBlank('${opt}', '${word.answer}')">
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    checkFillBlank(selected, correct) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.onclick = null);

        if (selected === correct) {
            options.forEach(opt => {
                if (opt.textContent.includes(selected)) {
                    opt.classList.add('correct');
                }
            });
            this.fillBlankScore += 25;
        } else {
            options.forEach(opt => {
                if (opt.textContent.includes(selected)) {
                    opt.classList.add('incorrect');
                } else if (opt.textContent.includes(correct)) {
                    opt.classList.add('correct');
                }
            });
        }

        setTimeout(() => {
            this.fillBlankIndex++;
            document.getElementById('page-content').innerHTML = this.renderFillBlankGame();
        }, 1200);
    },

    renderFillBlankResult() {
        const percentage = Math.round((this.fillBlankScore / (this.fillBlankWords.length * 25)) * 100);
        
        if (percentage >= 80) {
            Storage.addCoins(25);
            Storage.addExp(20);
            Storage.addBadge('game_winner');
        } else if (percentage >= 60) {
            Storage.addCoins(12);
            Storage.addExp(10);
        }

        Storage.updateDailyStats('games', 1);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <i class="fas ${percentage >= 80 ? 'fa-trophy' : percentage >= 60 ? 'fa-smile' : 'fa-frown'} text-5xl ${percentage >= 80 ? 'text-yellow-500' : percentage >= 60 ? 'text-green-500' : 'text-gray-500'}"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">闯关完成！</h2>
                <p class="text-gray-600 mb-4">最终得分：${this.fillBlankScore}</p>
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xl font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                    ${percentage >= 80 ? '太棒了！' : percentage >= 60 ? '继续加油！' : '需要多练习'}
                </p>
                <div class="flex justify-center space-x-4 mt-6">
                    <button onclick="GamesModule.startFillBlankGame(); document.getElementById('page-content').innerHTML=GamesModule.renderFillBlankGame()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再玩一次
                    </button>
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="btn-secondary">
                        返回选择
                    </button>
                </div>
            </div>
        `;
    },

    startWordRaceGame() {
        this.currentGame = 'wordrace';
        this.initWordRaceGame();
        document.getElementById('page-content').innerHTML = this.renderWordRaceGame();
    },

    initWordRaceGame() {
        const vocabulary = [
            { word: 'apple', meaning: '苹果' },
            { word: 'book', meaning: '书' },
            { word: 'cat', meaning: '猫' },
            { word: 'dog', meaning: '狗' },
            { word: 'egg', meaning: '鸡蛋' },
            { word: 'fish', meaning: '鱼' },
            { word: 'girl', meaning: '女孩' },
            { word: 'hand', meaning: '手' },
            { word: 'ice', meaning: '冰' },
            { word: 'jump', meaning: '跳' },
            { word: 'king', meaning: '国王' },
            { word: 'lion', meaning: '狮子' },
            { word: 'milk', meaning: '牛奶' },
            { word: 'nose', meaning: '鼻子' },
            { word: 'open', meaning: '打开' },
            { word: 'play', meaning: '玩' },
            { word: 'queen', meaning: '女王' },
            { word: 'rain', meaning: '雨' },
            { word: 'sun', meaning: '太阳' },
            { word: 'tree', meaning: '树' },
            { word: 'under', meaning: '在...下面' },
            { word: 'voice', meaning: '声音' },
            { word: 'water', meaning: '水' },
            { word: 'yellow', meaning: '黄色' },
            { word: 'zebra', meaning: '斑马' },
            { word: 'friend', meaning: '朋友' },
            { word: 'school', meaning: '学校' },
            { word: 'teacher', meaning: '老师' },
            { word: 'family', meaning: '家庭' },
            { word: 'happy', meaning: '快乐的' }
        ];

        this.wordRaceWords = shuffleArray(vocabulary);
        this.wordRaceIndex = 0;
        this.wordRaceScore = 0;
        this.timeLeft = 60;
        this.startTimer();
    },

    renderWordRaceGame() {
        if (this.timeLeft <= 0) {
            return this.renderWordRaceResult();
        }

        const word = this.wordRaceWords[this.wordRaceIndex];
        const options = this.generateRaceOptions(word);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回游戏选择
                    </button>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-600">连续：<span class="font-bold text-orange-600 text-xl">${this.wordRaceIndex}</span></span>
                        <span class="text-gray-600">分数：<span class="font-bold text-purple-600 text-xl">${this.wordRaceScore}</span></span>
                        <span class="text-gray-600">时间：<span class="font-bold ${this.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-green-600'} text-xl">${this.timeLeft}s</span></span>
                    </div>
                </div>

                <div class="text-center mb-6">
                    <h2 class="text-4xl font-bold text-gray-800 mb-2">${word.word}</h2>
                    <p class="text-gray-500">请选择正确的中文释义</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${options.map(opt => `
                        <div class="quiz-option text-center text-lg py-4" onclick="GamesModule.checkWordRace('${opt.meaning}', '${word.meaning}', '${word.word}')">
                            <span>${opt.meaning}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    generateRaceOptions(correctWord) {
        const vocabulary = [
            { word: 'apple', meaning: '苹果' },
            { word: 'book', meaning: '书' },
            { word: 'cat', meaning: '猫' },
            { word: 'dog', meaning: '狗' },
            { word: 'egg', meaning: '鸡蛋' },
            { word: 'fish', meaning: '鱼' },
            { word: 'girl', meaning: '女孩' },
            { word: 'hand', meaning: '手' },
            { word: 'friend', meaning: '朋友' },
            { word: 'school', meaning: '学校' },
            { word: 'teacher', meaning: '老师' },
            { word: 'family', meaning: '家庭' },
            { word: 'happy', meaning: '快乐的' },
            { word: 'sunny', meaning: '晴朗的' },
            { word: 'rainy', meaning: '下雨的' },
            { word: 'food', meaning: '食物' },
            { word: 'vegetable', meaning: '蔬菜' },
            { word: 'fruit', meaning: '水果' },
            { word: 'animal', meaning: '动物' },
            { word: 'water', meaning: '水' }
        ];

        const options = [correctWord];
        while (options.length < 4) {
            const randomWord = vocabulary[getRandomInt(0, vocabulary.length - 1)];
            if (!options.find(o => o.word === randomWord.word)) {
                options.push(randomWord);
            }
        }
        return shuffleArray(options);
    },

    checkWordRace(selected, correct, word) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.onclick = null);

        if (selected === correct) {
            options.forEach(opt => {
                if (opt.textContent.includes(selected)) {
                    opt.classList.add('correct');
                }
            });
            this.wordRaceScore += 10;
            this.wordRaceIndex++;
        } else {
            options.forEach(opt => {
                if (opt.textContent.includes(selected)) {
                    opt.classList.add('incorrect');
                } else if (opt.textContent.includes(correct)) {
                    opt.classList.add('correct');
                }
            });
            this.wordRaceIndex++;
        }

        setTimeout(() => {
            document.getElementById('page-content').innerHTML = this.renderWordRaceGame();
        }, 400);
    },

    renderWordRaceResult() {
        const percentage = Math.round((this.wordRaceScore / (this.wordRaceIndex * 10)) * 100);
        
        if (this.wordRaceScore >= 100) {
            Storage.addCoins(40);
            Storage.addExp(35);
            Storage.addBadge('game_winner');
        } else if (this.wordRaceScore >= 60) {
            Storage.addCoins(15);
            Storage.addExp(15);
        }

        Storage.updateDailyStats('games', 1);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <i class="fas ${this.wordRaceScore >= 100 ? 'fa-crown' : this.wordRaceScore >= 60 ? 'fa-trophy' : 'fa-flag'} text-5xl ${this.wordRaceScore >= 100 ? 'text-yellow-500' : this.wordRaceScore >= 60 ? 'text-purple-500' : 'text-gray-500'}"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">时间到！</h2>
                <p class="text-gray-600 mb-2">答对：${Math.floor(this.wordRaceScore / 10)} / ${this.wordRaceIndex}</p>
                <p class="text-gray-600 mb-4">最终得分：${this.wordRaceScore}</p>
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xl font-semibold ${this.wordRaceScore >= 100 ? 'text-green-600' : this.wordRaceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                    ${this.wordRaceScore >= 100 ? '太厉害了！' : this.wordRaceScore >= 60 ? '不错哦！' : '继续加油！'}
                </p>
                <div class="flex justify-center space-x-4 mt-6">
                    <button onclick="GamesModule.startWordRaceGame(); document.getElementById('page-content').innerHTML=GamesModule.renderWordRaceGame()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再玩一次
                    </button>
                    <button onclick="GamesModule.currentGame=null; document.getElementById('page-content').innerHTML=GamesModule.render()" class="btn-secondary">
                        返回选择
                    </button>
                </div>
            </div>
        `;
    },

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.stopTimer();
                if (this.currentGame === 'matching') {
                    document.getElementById('page-content').innerHTML = this.renderMatchingGame();
                } else if (this.currentGame === 'fillblank') {
                    this.fillBlankIndex = this.fillBlankWords.length;
                    document.getElementById('page-content').innerHTML = this.renderFillBlankGame();
                } else if (this.currentGame === 'wordrace') {
                    document.getElementById('page-content').innerHTML = this.renderWordRaceGame();
                }
            } else {
                if (this.currentGame === 'matching') {
                    document.getElementById('page-content').innerHTML = this.renderMatchingGame();
                } else if (this.currentGame === 'fillblank') {
                    document.getElementById('page-content').innerHTML = this.renderFillBlankGame();
                } else if (this.currentGame === 'wordrace') {
                    document.getElementById('page-content').innerHTML = this.renderWordRaceGame();
                }
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
};