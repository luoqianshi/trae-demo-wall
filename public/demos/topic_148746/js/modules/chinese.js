const ChineseModule = {
    mode: 'poems',
    currentIndex: 0,
    currentQuestion: 0,
    chinesePoems: [],
    chineseReading: [],
    chineseVocabulary: [],
    
    async init() {
        const poemsData = await API.getChinesePoems();
        this.chinesePoems = poemsData.poems;
        const readingData = await API.getChineseReading();
        this.chineseReading = readingData.articles;
        const vocabData = await API.getChineseVocabulary();
        this.chineseVocabulary = vocabData.words;
    },
    
    async render() {
        if (!this.chinesePoems.length) await this.init();
        
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">语文学习</h3>
                        <div class="space-y-2">
                            <button onclick="ChineseModule.setMode('poems')" class="w-full text-left p-3 rounded-lg ${this.mode === 'poems' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-scroll mr-2"></i>古诗词
                            </button>
                            <button onclick="ChineseModule.setMode('reading')" class="w-full text-left p-3 rounded-lg ${this.mode === 'reading' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-book mr-2"></i>阅读理解
                            </button>
                            <button onclick="ChineseModule.setMode('vocabulary')" class="w-full text-left p-3 rounded-lg ${this.mode === 'vocabulary' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-pencil-alt mr-2"></i>字词积累
                            </button>
                        </div>
                    </div>
                </div>
                <div class="md:w-2/3">
                    ${this.mode === 'poems' ? await this.renderPoems() : ''}
                    ${this.mode === 'reading' ? await this.renderReading() : ''}
                    ${this.mode === 'vocabulary' ? await this.renderVocabulary() : ''}
                </div>
            </div>
        `;
    },
    
    setMode(mode) {
        this.mode = mode;
        this.currentIndex = 0;
        this.currentQuestion = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },
    
    async renderPoems() {
        if (!this.chinesePoems.length) await this.init();
        
        const poem = this.chinesePoems[this.currentIndex];
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">古诗词学习</h2>
                    <div class="flex gap-2">
                        ${this.chinesePoems.map((_, i) => `
                            <button onclick="ChineseModule.currentIndex=${i}; document.getElementById('page-content').innerHTML=ChineseModule.render()" class="w-8 h-8 rounded-lg ${i === this.currentIndex ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}">${i + 1}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 text-center">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${poem.title}</h3>
                    <p class="text-gray-500 mb-6">【${poem.dynasty}】${poem.author}</p>
                    <div class="space-y-3">
                        ${poem.content.map(line => `
                            <p class="text-xl text-gray-700 font-medium">${line}</p>
                        `).join('')}
                    </div>
                </div>
                <div class="mt-6 bg-gray-50 rounded-xl p-4">
                    <h4 class="font-bold text-gray-800 mb-2">诗词解读</h4>
                    <p class="text-gray-600">${poem.explanation}</p>
                </div>
                <div class="mt-4 bg-red-50 rounded-xl p-4">
                    <h4 class="font-bold text-red-800 mb-2">重点字词</h4>
                    <div class="flex flex-wrap gap-2">
                        ${poem.keyPoints.map(kp => `<span class="text-xs bg-white px-3 py-1 rounded-full text-red-600">${kp}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    async renderReading() {
        if (!this.chineseReading.length) await this.init();
        
        const article = this.chineseReading[this.currentIndex];
        const question = article.questions[this.currentQuestion];
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">阅读理解</h2>
                    <div class="flex gap-2">
                        ${this.chineseReading.map((_, i) => `
                            <button onclick="ChineseModule.currentIndex=${i}; ChineseModule.currentQuestion=0; document.getElementById('page-content').innerHTML=ChineseModule.render()" class="w-8 h-8 rounded-lg ${i === this.currentIndex ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}">${i + 1}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-red-50 rounded-xl p-6 mb-6">
                    <h3 class="font-bold text-gray-800 mb-4">${article.title}</h3>
                    <p class="text-gray-600 leading-relaxed">${article.content}</p>
                </div>
                <div class="bg-gray-50 rounded-xl p-6">
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-lg font-semibold text-gray-800">问题 ${this.currentQuestion + 1}：${question.question}</p>
                        <span class="text-sm text-gray-500">${this.currentQuestion + 1} / ${article.questions.length}</span>
                    </div>
                    <div class="space-y-3">
                        ${question.options.map(opt => `
                            <div onclick="ChineseModule.checkAnswer(this, '${opt}', '${question.answer}')" class="quiz-option">${opt}</div>
                        `).join('')}
                    </div>
                </div>
                <div class="mt-4 bg-red-50 rounded-xl p-4">
                    <h4 class="font-bold text-red-800 mb-2">重点词语</h4>
                    <div class="flex flex-wrap gap-2">
                        ${article.keyPoints.map(kp => `<span class="text-xs bg-white px-3 py-1 rounded-full text-red-600">${kp}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    async renderVocabulary() {
        if (!this.chineseVocabulary.length) await this.init();
        
        const word = this.chineseVocabulary[this.currentIndex];
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">字词积累</h2>
                    <span class="text-gray-500">${this.currentIndex + 1} / ${this.chineseVocabulary.length}</span>
                </div>
                <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-8 text-center">
                    <h3 class="text-3xl font-bold text-gray-800 mb-2">${word.word}</h3>
                    <p class="text-gray-500 text-lg">${word.pinyin}</p>
                    <span class="inline-block mt-2 px-3 py-1 bg-red-200 text-red-700 rounded-full text-sm">${word.partOfSpeech}</span>
                    <div class="mt-6">
                        <p class="text-xl text-red-600 font-semibold">${word.meaning}</p>
                        <p class="text-gray-600 mt-2">例：${word.example}</p>
                    </div>
                </div>
                <div class="flex justify-between mt-6">
                    <button onclick="ChineseModule.prev()" class="btn-primary ${this.currentIndex === 0 ? 'opacity-50' : ''}" ${this.currentIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left mr-2"></i>上一个
                    </button>
                    <button onclick="ChineseModule.next()" class="btn-secondary">
                        下一个<i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },
    
    next() {
        if (this.mode === 'vocabulary' && this.currentIndex < this.chineseVocabulary.length - 1) {
            this.currentIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },
    
    checkAnswer(element, selected, correct) {
        document.querySelectorAll('.quiz-option').forEach(opt => opt.onclick = null);
        if (selected === correct) {
            element.classList.add('correct');
            Storage.addCoins(3);
            Storage.addExp(10);
            Storage.updateDailyStats('chinese', 1);
            Storage.updateDailyChallenge('chinese', 1);
            
            setTimeout(() => {
                if (this.currentQuestion < this.chineseReading[this.currentIndex].questions.length - 1) {
                    this.currentQuestion++;
                    document.getElementById('page-content').innerHTML = this.render();
                } else {
                    document.getElementById('page-content').innerHTML = `
                        <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                                <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">阅读完成！</h2>
                            <p class="text-gray-600">你已完成《${this.chineseReading[this.currentIndex].title}》的所有问题</p>
                            <button onclick="ChineseModule.setMode('reading')" class="mt-4 btn-primary">继续阅读</button>
                        </div>
                    `;
                }
            }, 1000);
        } else {
            element.classList.add('incorrect');
            document.querySelectorAll('.quiz-option').forEach(opt => {
                if (opt.textContent.includes(correct)) opt.classList.add('correct');
            });
        }
    }
};
