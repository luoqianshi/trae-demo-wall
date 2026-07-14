const ListeningModule = {
    data: null,
    currentExercise: null,
    currentQuestionIndex: 0,
    score: 0,
    isPlaying: false,

    async init() {
        this.data = await API.getListening();
        Router.register('listening', () => this.render());
    },

    render() {
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">听力练习</h3>
                        <div class="space-y-2">
                            ${this.data.exercises.map(exercise => `
                                <button onclick="ListeningModule.selectExercise('${exercise.id}')" class="w-full text-left p-3 rounded-lg ${this.currentExercise?.id === exercise.id ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'} transition-colors">
                                    ${exercise.title}
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

    selectExercise(exerciseId) {
        this.currentExercise = this.data.exercises.find(e => e.id === exerciseId);
        this.currentQuestionIndex = 0;
        this.score = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },

    renderContent() {
        if (!this.currentExercise) {
            return `<div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-headphones text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">请先选择一个听力练习开始</p>
            </div>`;
        }

        if (this.currentQuestionIndex >= this.currentExercise.questions.length) {
            return this.renderResult();
        }

        const question = this.currentExercise.questions[this.currentQuestionIndex];
        const total = this.currentExercise.questions.length;

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="ListeningModule.currentExercise=null; document.getElementById('page-content').innerHTML=ListeningModule.render()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left mr-1"></i>返回选择
                    </button>
                    <span class="text-gray-500">第 ${this.currentQuestionIndex + 1} / ${total} 题</span>
                </div>

                <h2 class="text-xl font-bold text-gray-800 mb-2">${this.currentExercise.title}</h2>
                <p class="text-gray-600 mb-6">${this.currentExercise.description}</p>

                <div class="text-center mb-8">
                    <button onclick="ListeningModule.playAudio('${question.audioText}')" class="w-20 h-20 ${this.isPlaying ? 'bg-red-500 animate-pulse' : 'bg-pink-500'} rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:bg-pink-600 transition-colors">
                        <i class="fas ${this.isPlaying ? 'fa-stop' : 'fa-play'} text-3xl"></i>
                    </button>
                    <p class="text-gray-500">点击播放按钮听题目</p>
                </div>

                <div class="space-y-3">
                    ${question.options.map((opt, idx) => `
                        <div class="quiz-option" onclick="ListeningModule.checkAnswer(this, '${opt}', '${question.answer}')">
                            <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderResult() {
        const percentage = Math.round((this.score / this.currentExercise.questions.length) * 100);
        
        if (percentage >= 80) {
            Storage.addCoins(8);
            Storage.addBadge('listening_master');
        } else if (percentage >= 60) {
            Storage.addCoins(4);
        }

        Storage.addLearningRecord('listening', this.score, 5);
        Storage.updateDailyStats('listening', this.currentExercise.questions.length);

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                <div class="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-headphones text-4xl text-pink-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">听力练习完成！</h2>
                <p class="text-gray-600 mb-4">你的得分：${this.score} / ${this.currentExercise.questions.length}</p>
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="text-xl font-semibold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                    ${percentage >= 80 ? '太棒了！' : percentage >= 60 ? '继续加油！' : '需要多练习'}
                </p>
                <div class="flex justify-center space-x-4 mt-6">
                    <button onclick="ListeningModule.selectExercise('${this.currentExercise.id}'); document.getElementById('page-content').innerHTML=ListeningModule.render()" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>再练一次
                    </button>
                    <button onclick="ListeningModule.currentExercise=null; document.getElementById('page-content').innerHTML=ListeningModule.render()" class="btn-secondary">
                        返回选择
                    </button>
                </div>
            </div>
        `;
    },

    async playAudio(text) {
        this.isPlaying = true;
        document.getElementById('page-content').innerHTML = this.render();
        try {
            await API.speak(text);
        } finally {
            this.isPlaying = false;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    checkAnswer(element, selected, correct) {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.onclick = null);

        if (selected === correct) {
            element.classList.add('correct');
            this.score++;
        } else {
            element.classList.add('incorrect');
            options.forEach(opt => {
                if (opt.textContent.includes(correct)) {
                    opt.classList.add('correct');
                }
            });
        }

        setTimeout(() => {
            this.currentQuestionIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }, 1500);
    }
};
