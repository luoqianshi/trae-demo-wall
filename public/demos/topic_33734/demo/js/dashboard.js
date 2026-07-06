const Dashboard = {
    render() {
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        const language = COURSE_DATA.languages.find(l => l.id === user.currentLanguage);

        const container = document.getElementById('view-dashboard');
        const level = user.stats.level;
        const xp = user.stats.totalXP;
        const xpForNext = 500;
        const currentLevelXP = xp % xpForNext;
        const progressPercent = (currentLevelXP / xpForNext) * 100;

        const recommendations = this.getRecommendations(user);

        container.innerHTML = `
            <div class="dashboard-hero">
                <div class="dashboard-hero-content">
                    <h1>👋 你好，${username}！</h1>
                    <p>今天是你学习 ${language.icon} ${language.name} 的好日子。</p>
                    <div class="hero-actions">
                        <button class="btn btn-primary" onclick="UI.switchView('learning')">🚀 开始学习</button>
                        <button class="btn btn-primary" style="background: rgba(255,255,255,0.2);" onclick="UI.switchView('courses')">📚 浏览课程</button>
                    </div>
                </div>
            </div>

            <div class="grid grid-3" style="margin-bottom: 30px;">
                <div class="card">
                    <div class="card-title">⭐ 等级进度</div>
                    <div class="progress-section">
                        <div>
                            <div class="big-num" style="color: ${language.color};">Lv.${level}</div>
                            <div class="small-text">总经验 ${xp} XP</div>
                        </div>
                    </div>
                    <div class="progress-bar-container" style="margin-top: 16px;">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div class="progress-bar-label">
                            <span>${currentLevelXP} / ${xpForNext} XP</span>
                            <span>距离 Lv.${level + 1}</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">🔥 学习统计</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 0;">
                        <div style="text-align: center;">
                            <div class="big-num" style="color: #ef4444;">${user.progress.streak || 0}</div>
                            <div class="small-text">连续天数</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="big-num" style="color: #10b981;">${user.progress.todayLessons || 0}</div>
                            <div class="small-text">今日课程</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="big-num" style="color: #6366f1;">${user.stats.completedLessons || 0}</div>
                            <div class="small-text">总课程数</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="big-num" style="color: #f59e0b;">${user.progress.todayXP || 0}</div>
                            <div class="small-text">今日XP</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">🌍 当前语言</div>
                    <div style="text-align: center; padding: 16px 0;">
                        <div style="font-size: 64px; margin-bottom: 8px;">${language.icon}</div>
                        <div style="font-size: 24px; font-weight: 600; margin-bottom: 4px;">${language.name}</div>
                        <div style="color: #64748b; margin-bottom: 12px;">${language.nativeName}</div>
                        <div style="display: inline-block; padding: 6px 16px; background: ${language.colorLight}; color: ${language.color}; border-radius: 20px; font-size: 14px; font-weight: 600;">${user.currentLevel}</div>
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 12px;" onclick="UI.switchView('courses')">切换语言 →</button>
                </div>
            </div>

            ${recommendations.length > 0 ? `
            <div class="card">
                <div class="card-title">💡 个性化推荐</div>
                ${recommendations.map(rec => `
                    <div class="recommendation-card" style="margin-bottom: 12px;">
                        <h3>${rec.icon} ${rec.title}</h3>
                        <p>${rec.content}</p>
                        <button class="btn btn-primary" style="background: ${rec.color}; padding: 8px 20px;" onclick="${rec.action}">${rec.buttonText}</button>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-title">📈 本周学习</div>
                    <div class="weekly-chart">
                        ${['日', '一', '二', '三', '四', '五', '六'].map((day, i) => {
                            const val = user.stats.weeklyXP[i] || 0;
                            const max = Math.max(...user.stats.weeklyXP, 1);
                            const height = (val / max) * 100;
                            return `
                                <div class="chart-bar-wrapper">
                                    <div class="chart-bar" style="height: ${Math.max(height, 4)}%; background: linear-gradient(180deg, ${language.color}, ${language.colorLight});"></div>
                                    <div class="chart-label">${day}</div>
                                    <div class="small-text" style="font-size: 11px;">${val}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">🏆 最新成就</div>
                    ${this.getLatestAchievements(user)}
                </div>
            </div>
        `;
    },

    getRecommendations(user) {
        const recs = [];
        const completed = user.progress.completedLessons.length;
        const streak = user.progress.streak || 0;

        if (completed === 0) {
            recs.push({
                icon: '🎯',
                title: '开启你的学习之旅',
                content: '看起来你还没有开始学习，先从基础课程开始吧！',
                buttonText: '开始第一课',
                action: "UI.switchView('learning')",
                color: '#6366f1'
            });
        } else if (streak === 0) {
            recs.push({
                icon: '🔥',
                title: '重新点燃学习热情',
                content: '保持连续学习是进步的关键，今天再来一节课吧！',
                buttonText: '继续学习',
                action: "UI.switchView('learning')",
                color: '#ef4444'
            });
        }

        if (user.stats.vocabLearned < 20) {
            recs.push({
                icon: '📖',
                title: '扩展你的词汇量',
                content: '词汇是语言学习的基础，试试我们的单词记忆模块！',
                buttonText: '学习单词',
                action: "UI.switchView('learning'); setTimeout(() => Learning.switchModule('vocabulary'), 100)",
                color: '#10b981'
            });
        }

        if (recs.length === 0) {
            recs.push({
                icon: '🚀',
                title: '继续保持！',
                content: `你已经完成了 ${completed} 节课，太棒了！挑战更高难度的内容吧。`,
                buttonText: '查看课程',
                action: "UI.switchView('courses')",
                color: '#f59e0b'
            });
        }

        return recs.slice(0, 3);
    },

    getLatestAchievements(user) {
        const unlocked = user.stats.unlockedAchievements || [];
        if (unlocked.length === 0) {
            return `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-state-icon">🏆</div>
                    <h3>暂无成就</h3>
                    <p>完成更多课程来解锁成就吧！</p>
                </div>
            `;
        }

        const achievements = unlocked.slice(-3).reverse();
        return `
            <div style="display: flex; gap: 16px; justify-content: center; padding: 20px 0;">
                ${achievements.map(id => {
                    const ach = COURSE_DATA.achievements.find(a => a.id === id);
                    if (!ach) return '';
                    return `
                        <div style="text-align: center;">
                            <div style="font-size: 48px;">${ach.icon}</div>
                            <div style="font-size: 14px; font-weight: 600; margin-top: 8px;">${ach.title}</div>
                            <div style="font-size: 12px; color: #f59e0b;">+${ach.xp} XP</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <button class="btn btn-secondary" style="width: 100%;" onclick="UI.switchView('achievements')">查看全部成就 →</button>
        `;
    }
};
