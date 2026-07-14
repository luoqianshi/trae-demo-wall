const ReadingModule = {
    data: null,
    currentArticle: null,

    async init() {
        this.data = await API.getReading();
        Router.register('reading', () => this.render());
    },

    render() {
        return `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-4">课文目录</h3>
                        <div class="space-y-2">
                            ${this.data.articles.map(article => `
                                <button onclick="ReadingModule.selectArticle('${article.id}')" class="w-full text-left p-3 rounded-lg ${this.currentArticle?.id === article.id ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'} transition-colors">
                                    ${article.title}
                                    <span class="text-sm text-gray-500 ml-2">${article.titleChinese}</span>
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

    selectArticle(articleId) {
        this.currentArticle = this.data.articles.find(a => a.id === articleId);
        document.getElementById('page-content').innerHTML = this.render();
    },

    renderContent() {
        if (!this.currentArticle) {
            return `<div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">请先选择一篇课文开始学习</p>
            </div>`;
        }

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${this.currentArticle.title}</h2>
                        <p class="text-gray-600 mt-1">${this.currentArticle.titleChinese}</p>
                    </div>
                    <button onclick="ReadingModule.readAloud()" class="btn-primary">
                        <i class="fas fa-volume-up mr-2"></i>全文朗读
                    </button>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">课文内容</h3>
                    <div class="space-y-3">
                        ${this.currentArticle.content.map((sentence, index) => `
                            <div class="bg-orange-50 rounded-xl p-4 hover:bg-orange-100 transition-colors">
                                <div class="flex items-start">
                                    <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">${index + 1}</span>
                                    <div class="flex-1">
                                        <p class="text-gray-800 font-medium">${sentence.english}</p>
                                        <button onclick="ReadingModule.playSentence('${sentence.english}')" class="mt-1 text-blue-500 hover:text-blue-700 text-sm">
                                            <i class="fas fa-volume-up mr-1"></i>听句子
                                        </button>
                                        <p class="text-gray-600 mt-2">${sentence.chinese}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">重点句子解析</h3>
                    <div class="space-y-4">
                        ${this.currentArticle.keyPoints.map((point, index) => `
                            <div class="bg-purple-50 rounded-xl p-4">
                                <div class="flex items-start">
                                    <span class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">${index + 1}</span>
                                    <div>
                                        <p class="text-gray-800 italic">"${point.sentence}"</p>
                                        <button onclick="ReadingModule.playSentence('${point.sentence}')" class="mt-1 text-blue-500 hover:text-blue-700 text-sm">
                                            <i class="fas fa-volume-up mr-1"></i>听句子
                                        </button>
                                        <p class="text-gray-600 mt-2">${point.explanation}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    playSentence(text) {
        API.speak(text);
    },

    readAloud() {
        const text = this.currentArticle.content.map(c => c.english).join(' ');
        API.speak(text);
    }
};
