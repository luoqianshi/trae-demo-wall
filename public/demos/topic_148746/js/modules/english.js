const EnglishModule = {
    mode: 'home',

    render() {
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4 sticky top-4">
                        <h3 class="font-bold text-gray-800 mb-4">英语学习</h3>
                        <div class="space-y-2">
                            <button onclick="EnglishModule.setMode('home')" class="w-full text-left p-3 rounded-lg ${this.mode === 'home' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-home mr-2"></i>英语首页
                            </button>
                            <button onclick="EnglishModule.setMode('vocabulary')" class="w-full text-left p-3 rounded-lg ${this.mode === 'vocabulary' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-book mr-2"></i>单词学习
                            </button>
                            <button onclick="EnglishModule.setMode('grammar')" class="w-full text-left p-3 rounded-lg ${this.mode === 'grammar' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-pencil-alt mr-2"></i>语法练习
                            </button>
                            <button onclick="EnglishModule.setMode('reading')" class="w-full text-left p-3 rounded-lg ${this.mode === 'reading' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-file-alt mr-2"></i>课文阅读
                            </button>
                            <button onclick="EnglishModule.setMode('listening')" class="w-full text-left p-3 rounded-lg ${this.mode === 'listening' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-headphones mr-2"></i>听力训练
                            </button>
                            <button onclick="EnglishModule.setMode('speaking')" class="w-full text-left p-3 rounded-lg ${this.mode === 'speaking' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}">
                                <i class="fas fa-microphone mr-2"></i>口语练习
                            </button>
                        </div>
                    </div>
                </div>
                <div class="md:w-2/3">
                    ${this.mode === 'home' ? this.renderHome() : ''}
                    ${this.mode === 'vocabulary' ? VocabularyModule.render() : ''}
                    ${this.mode === 'grammar' ? GrammarModule.render() : ''}
                    ${this.mode === 'reading' ? ReadingModule.render() : ''}
                    ${this.mode === 'listening' ? ListeningModule.render() : ''}
                    ${this.mode === 'speaking' ? SpeakingModule.render() : ''}
                </div>
            </div>
        `;
    },

    setMode(mode) {
        this.mode = mode;
        document.getElementById('page-content').innerHTML = this.render();
    },

    renderHome() {
        const challenge = Storage.getDailyChallenge();
        const wordsProgress = Math.min(100, Math.round((challenge.completedWords / challenge.targetWords) * 100));
        const grammarProgress = Math.min(100, Math.round((challenge.completedGrammar / challenge.targetGrammar) * 100));
        const listeningProgress = Math.min(100, Math.round((challenge.completedListening / challenge.targetListening) * 100));

        return `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                    <h2 class="text-xl font-bold mb-2">英语学习中心</h2>
                    <p class="opacity-80">系统推荐每日学习时间：30-60分钟</p>
                    <div class="mt-4 flex gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${challenge.completedWords}/${challenge.targetWords}</div>
                            <div class="text-xs opacity-70">单词</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${challenge.completedGrammar}/${challenge.targetGrammar}</div>
                            <div class="text-xs opacity-70">语法</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${challenge.completedListening}/${challenge.targetListening}</div>
                            <div class="text-xs opacity-70">听力</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div onclick="EnglishModule.setMode('vocabulary')" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <i class="fas fa-book text-blue-600 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">单词学习</h3>
                                <p class="text-gray-500 text-sm">15个单元，150+单词</p>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${wordsProgress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div onclick="EnglishModule.setMode('grammar')" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                                <i class="fas fa-pencil-alt text-green-600 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">语法练习</h3>
                                <p class="text-gray-500 text-sm">10个语法主题</p>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full" style="width: ${grammarProgress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div onclick="EnglishModule.setMode('reading')" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                                <i class="fas fa-file-alt text-orange-600 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">课文阅读</h3>
                                <p class="text-gray-500 text-sm">8篇精选课文</p>
                            </div>
                        </div>
                    </div>

                    <div onclick="EnglishModule.setMode('listening')" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center">
                                <i class="fas fa-headphones text-pink-600 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">听力训练</h3>
                                <p class="text-gray-500 text-sm">8组听力材料</p>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-pink-500 h-2 rounded-full" style="width: ${listeningProgress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div onclick="EnglishModule.setMode('speaking')" class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer md:col-span-2">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                                <i class="fas fa-microphone text-purple-600 text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-800">口语练习</h3>
                                <p class="text-gray-500 text-sm">8个场景对话练习，20个常用单句</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="font-bold text-gray-800 mb-4">学习小贴士</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-xl p-4">
                            <i class="fas fa-brain text-blue-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-gray-800">刻意练习</h4>
                            <p class="text-gray-500 text-sm">专注于薄弱环节，针对性练习效果更好</p>
                        </div>
                        <div class="bg-green-50 rounded-xl p-4">
                            <i class="fas fa-clock text-green-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-gray-800">间隔重复</h4>
                            <p class="text-gray-500 text-sm">系统会根据记忆曲线自动安排复习</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-4">
                            <i class="fas fa-comments text-purple-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-gray-800">真实场景</h4>
                            <p class="text-gray-500 text-sm">通过对话练习提升实际运用能力</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
