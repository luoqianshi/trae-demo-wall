const MathModule = {
    mode: 'topics',
    currentTopic: 0,
    currentExercise: 0,
    mathTopics: [],
    mathPuzzles: [],
    
    async init() {
        const topicsData = await API.getMathTopics();
        this.mathTopics = topicsData.topics;
        const puzzlesData = await API.getMathPuzzles();
        this.mathPuzzles = puzzlesData.puzzles;
    },
    
    async render() {
        if (!this.mathTopics.length) await this.init();
        
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">数学学习</h3>
                        <div class="space-y-2">
                            <button onclick="MathModule.setMode('topics')" class="w-full text-left p-3 rounded-lg ${this.mode === 'topics' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-book mr-2"></i>知识点
                            </button>
                            <button onclick="MathModule.setMode('practice')" class="w-full text-left p-3 rounded-lg ${this.mode === 'practice' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-pencil-alt mr-2"></i>练习题
                            </button>
                            <button onclick="MathModule.setMode('thinking')" class="w-full text-left p-3 rounded-lg ${this.mode === 'thinking' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-brain mr-2"></i>思维训练
                            </button>
                        </div>
                    </div>
                </div>
                <div class="md:w-2/3">
                    ${this.mode === 'topics' ? await this.renderTopics() : ''}
                    ${this.mode === 'practice' ? await this.renderPractice() : ''}
                    ${this.mode === 'thinking' ? await this.renderThinking() : ''}
                </div>
            </div>
        `;
    },
    
    setMode(mode) {
        this.mode = mode;
        this.currentTopic = 0;
        this.currentExercise = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },
    
    async renderTopics() {
        if (!this.mathTopics.length) await this.init();
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${this.mathTopics.map((topic, i) => `
                    <div onclick="MathModule.selectTopic(${i})" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer">
                        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                            <i class="fas fa-calculator text-green-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800">${topic.title}</h3>
                        <p class="text-gray-500 text-sm mt-2">${topic.description}</p>
                        <div class="mt-4 flex flex-wrap gap-2">
                            ${topic.examples.slice(0, 2).map(ex => `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${ex}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    selectTopic(index) {
        this.currentTopic = index;
        this.mode = 'practice';
        this.currentExercise = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },
    
    async renderPractice() {
        if (!this.mathTopics.length) await this.init();
        
        const topic = this.mathTopics[this.currentTopic];
        const exercise = topic.exercises[this.currentExercise];
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">${topic.title}</h2>
                    <button onclick="MathModule.setMode('topics')" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回
                    </button>
                </div>
                <div class="bg-green-50 rounded-xl p-4 mb-6">
                    <h3 class="font-bold text-green-800 mb-2">知识点讲解</h3>
                    <p class="text-green-700">${topic.description}</p>
                </div>
                <div class="bg-gray-50 rounded-xl p-6">
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-lg font-semibold text-gray-800">${this.currentExercise + 1}. ${exercise.question}</p>
                        <span class="text-sm text-gray-500">${this.currentExercise + 1} / ${topic.exercises.length}</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${exercise.options.map(opt => `
                            <button onclick="MathModule.checkAnswer(this, '${opt}', '${exercise.answer}')" class="quiz-option justify-center text-lg">${opt}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    async renderThinking() {
        if (!this.mathPuzzles.length) await this.init();
        
        const puzzle = this.mathPuzzles[this.currentTopic];
        
        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">思维训练</h2>
                    <span class="text-sm text-gray-500">${this.currentTopic + 1} / ${this.mathPuzzles.length}</span>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                    <p class="text-xl font-semibold text-gray-800">${puzzle.question}</p>
                    <button onclick="document.getElementById('hint').style.display='block'" class="mt-4 text-purple-600 text-sm">
                        <i class="fas fa-lightbulb mr-1"></i>查看提示
                    </button>
                    <div id="hint" class="hidden mt-2 p-2 bg-white rounded text-gray-600 text-sm">${puzzle.hint}</div>
                </div>
                <div class="flex gap-3">
                    <input type="number" id="math-input" class="flex-1 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-4 focus:border-green-500 focus:outline-none" placeholder="输入答案">
                    <button onclick="MathModule.checkThinkingAnswer('${puzzle.answer}')" class="btn-primary">
                        <i class="fas fa-check mr-2"></i>提交
                    </button>
                </div>
            </div>
        `;
    },
    
    checkAnswer(element, selected, correct) {
        document.querySelectorAll('.quiz-option').forEach(opt => opt.onclick = null);
        if (selected === correct) {
            element.classList.add('correct');
            Storage.addCoins(3);
            Storage.addExp(10);
            Storage.updateDailyStats('math', 1);
            Storage.updateDailyChallenge('math', 1);
            
            setTimeout(() => {
                if (this.currentExercise < this.mathTopics[this.currentTopic].exercises.length - 1) {
                    this.currentExercise++;
                    document.getElementById('page-content').innerHTML = this.render();
                } else {
                    document.getElementById('page-content').innerHTML = `
                        <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                                <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">练习完成！</h2>
                            <p class="text-gray-600">你已完成${this.mathTopics[this.currentTopic].title}的所有练习</p>
                            <button onclick="MathModule.setMode('topics')" class="mt-4 btn-primary">返回知识点</button>
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
    },
    
    checkThinkingAnswer(correct) {
        const input = document.getElementById('math-input');
        const answer = input.value.trim();
        if (answer === correct) {
            input.classList.add('correct');
            Storage.addCoins(5);
            Storage.addExp(15);
            Storage.updateDailyStats('math', 1);
            Storage.updateDailyChallenge('math', 2);
            
            setTimeout(() => {
                if (this.currentTopic < this.mathPuzzles.length - 1) {
                    this.currentTopic++;
                    document.getElementById('page-content').innerHTML = this.render();
                } else {
                    document.getElementById('page-content').innerHTML = `
                        <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                                <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">思维训练完成！</h2>
                            <p class="text-gray-600">你的逻辑思维能力很棒！</p>
                            <button onclick="MathModule.setMode('thinking')" class="mt-4 btn-primary">再练一次</button>
                        </div>
                    `;
                }
            }, 1000);
        } else {
            input.classList.add('incorrect');
            input.value = correct;
        }
    }
};
