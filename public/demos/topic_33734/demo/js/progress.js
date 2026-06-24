const Progress = {
    render() {
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        const container = document.getElementById('view-progress');

        const language = COURSE_DATA.languages.find(l => l.id === user.currentLanguage);
        const levels = language.levels;
        const totalLessons = this.countTotalLessons(user.currentLanguage);
        const completedCount = user.progress.completedLessons.length;
        const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        const xp = user.stats.totalXP;
        const xpForNext = 500;
        const currentLevelXP = xp % xpForNext;
        const levelPercent = (currentLevelXP / xpForNext) * 100;

        container.innerHTML = `
            <div class="progress-overview">
                <div class="card">
                    <div class="card-title">📊 总体进度</div>
                    <div class="progress-circle-container">
                        <div class="progress-number" style="color: ${language.color};">${overallPercent}%</div>
                        <div class="progress-label">${language.icon} ${language.name} 总进度</div>
                        <div class="progress-bar-container" style="margin-top: 16px;">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${overallPercent}%; background: linear-gradient(90deg, ${language.color}, ${language.colorLight});"></div>
                            </div>
                            <div class="progress-bar-label">
                                <span>${completedCount} / ${totalLessons} 节课</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">⭐ 经验等级</div>
                    <div class="progress-circle-container">
                        <div class="progress-number" style="color: #f59e0b;">Lv.${user.stats.level}</div>
                        <div class="progress-label">总经验值: ${xp} XP</div>
                        <div class="progress-bar-container" style="margin-top: 16px;">
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${levelPercent}%; background: linear-gradient(90deg, #f59e0b, #fde68a);"></div>
                            </div>
                            <div class="progress-bar-label">
                                <span>${currentLevelXP} / ${xpForNext} XP</span>
                                <span>距离 Lv.${user.stats.level + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-3" style="margin-bottom: 30px;">
                <div class="card">
                    <div class="card-title">🔥 连续学习</div>
                    <div style="text-align: center; padding: 16px 0;">
                        <div class="big-num" style="color: #ef4444; font-size: 48px;">${user.progress.streak || 0}</div>
                        <div class="small-text" style="margin-top: 8px;">天</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">📖 学习词汇</div>
                    <div style="text-align: center; padding: 16px 0;">
                        <div class="big-num" style="color: #10b981; font-size: 48px;">${user.stats.vocabLearned || 0}</div>
                        <div class="small-text" style="margin-top: 8px;">个单词</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">✍️ 语法练习</div>
                    <div style="text-align: center; padding: 16px 0;">
                        <div class="big-num" style="color: #6366f1; font-size: 48px;">${user.stats.grammarSolved || 0}</div>
                        <div class="small-text" style="margin-top: 8px;">道题目</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">📈 本周学习情况</div>
                <div class="weekly-chart">
                    ${['日', '一', '二', '三', '四', '五', '六'].map((day, i) => {
                        const val = user.stats.weeklyXP[i] || 0;
                        const max = Math.max(...user.stats.weeklyXP, 100);
                        const height = (val / max) * 100;
                        return `
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar" style="height: ${Math.max(height, 4)}%;"></div>
                                <div class="chart-label">${day}</div>
                                <div class="small-text" style="font-size: 11px;">${val} XP</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-title">📚 各等级完成情况</div>
                ${levels.map(level => {
                    const lessons = COURSE_DATA.lessons[user.currentLanguage][level] || [];
                    const levelCompleted = lessons.filter(l => user.progress.completedLessons.includes(l.id)).length;
                    const levelPercent = lessons.length > 0 ? Math.round((levelCompleted / lessons.length) * 100) : 0;
                    return `
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-weight: 600;">${level}</span>
                                <span style="color: #64748b; font-size: 14px;">${levelCompleted} / ${lessons.length} 节课</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${levelPercent}%;"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="card">
                <div class="card-title">📅 已完成课程 (${user.progress.completedLessons.length})</div>
                ${user.progress.completedLessons.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>还没有完成的课程</h3>
                        <p>快去学习中心开始你的第一节课吧！</p>
                    </div>
                ` : `
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${user.progress.completedLessons.slice(-20).reverse().map(id => `
                            <span style="padding: 6px 12px; background: #dcfce7; color: #15803d; border-radius: 20px; font-size: 13px;">✓ ${id}</span>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    countTotalLessons(langId) {
        const lessons = COURSE_DATA.lessons[langId];
        let count = 0;
        for (const level in lessons) {
            count += lessons[level].length;
        }
        return count;
    }
};
