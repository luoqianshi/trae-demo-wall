const RecordsModule = {
    chart: null,

    async init() {
        Router.register('records', () => this.render());
    },

    render() {
        const data = Storage.getData();
        const today = new Date().toLocaleDateString('zh-CN');
        const todayStats = data.dailyStats[today] || { words: 0, grammar: 0, reading: 0, listening: 0, speaking: 0, games: 0 };

        const masteredWords = Object.keys(data.wordProgress).filter(k => data.wordProgress[k] === 'mastered').length;
        const totalWords = 25;
        const masteredGrammar = Object.keys(data.grammarProgress).filter(k => data.grammarProgress[k] === 'mastered').length;
        const totalGrammar = 5;

        return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">学习金币</p>
                                <p class="text-2xl font-bold text-blue-600">${data.user.coins}</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-coins text-blue-600"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">已掌握单词</p>
                                <p class="text-2xl font-bold text-green-600">${masteredWords}/${totalWords}</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-book text-green-600"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">已掌握语法</p>
                                <p class="text-2xl font-bold text-orange-600">${masteredGrammar}/${totalGrammar}</p>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-pencil-alt text-orange-600"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">获得徽章</p>
                                <p class="text-2xl font-bold text-purple-600">${data.user.badges.length}</p>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-award text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">学习进度</h3>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between mb-2">
                                <span class="text-gray-600">单词学习</span>
                                <span class="text-gray-600">${Math.round((masteredWords / totalWords) * 100)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="progress-bar" style="width: ${(masteredWords / totalWords) * 100}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-2">
                                <span class="text-gray-600">语法学习</span>
                                <span class="text-gray-600">${Math.round((masteredGrammar / totalGrammar) * 100)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="progress-bar" style="width: ${(masteredGrammar / totalGrammar) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">今日学习统计</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-xl">
                            <p class="text-blue-600 font-bold">${todayStats.words}</p>
                            <p class="text-gray-500 text-sm">单词</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-xl">
                            <p class="text-green-600 font-bold">${todayStats.grammar}</p>
                            <p class="text-gray-500 text-sm">语法</p>
                        </div>
                        <div class="text-center p-4 bg-orange-50 rounded-xl">
                            <p class="text-orange-600 font-bold">${todayStats.reading}</p>
                            <p class="text-gray-500 text-sm">课文</p>
                        </div>
                        <div class="text-center p-4 bg-pink-50 rounded-xl">
                            <p class="text-pink-600 font-bold">${todayStats.listening}</p>
                            <p class="text-gray-500 text-sm">听力</p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-xl">
                            <p class="text-purple-600 font-bold">${todayStats.speaking}</p>
                            <p class="text-gray-500 text-sm">口语</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-xl">
                            <p class="text-yellow-600 font-bold">${todayStats.games}</p>
                            <p class="text-gray-500 text-sm">游戏</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">学习记录</h3>
                    <div class="flex items-center space-x-4">
                        <div class="flex-1">
                            <canvas id="weeklyChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">我的徽章</h3>
                    <div class="flex flex-wrap gap-4">
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
            'game_winner': { name: '游戏冠军', icon: 'fa-gamepad', color: 'text-purple-500', bg: 'bg-purple-100' }
        };

        return Object.keys(badgeList).map(id => {
            const badge = badgeList[id];
            const isUnlocked = badges.includes(id);
            return `
                <div class="flex flex-col items-center p-4 rounded-xl ${isUnlocked ? badge.bg : 'bg-gray-100'}">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center ${isUnlocked ? badge.color : 'text-gray-400'} ${isUnlocked ? '' : 'opacity-50'}">
                        <i class="fas ${badge.icon} text-2xl"></i>
                    </div>
                    <p class="text-sm font-medium ${isUnlocked ? 'text-gray-800' : 'text-gray-400'} mt-2">${isUnlocked ? badge.name : '???'}</p>
                </div>
            `;
        }).join('');
    }
};
