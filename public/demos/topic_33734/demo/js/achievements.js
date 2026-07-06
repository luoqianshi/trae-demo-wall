const Achievements = {
    render() {
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        const unlocked = user.stats.unlockedAchievements || [];
        const total = COURSE_DATA.achievements.length;
        const container = document.getElementById('view-achievements');

        const unlockedList = COURSE_DATA.achievements.filter(a => unlocked.includes(a.id));
        const lockedList = COURSE_DATA.achievements.filter(a => !unlocked.includes(a.id));

        container.innerHTML = `
            <div class="card">
                <div class="card-title">🏆 成就概览</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px 0; text-align: center;">
                    <div>
                        <div class="big-num" style="color: #f59e0b; font-size: 48px;">${unlocked.length}</div>
                        <div class="small-text" style="margin-top: 8px;">已解锁</div>
                    </div>
                    <div>
                        <div class="big-num" style="color: #64748b; font-size: 48px;">${total - unlocked.length}</div>
                        <div class="small-text" style="margin-top: 8px;">待解锁</div>
                    </div>
                    <div>
                        <div class="big-num" style="color: #10b981; font-size: 48px;">${Math.round((unlocked.length / total) * 100)}%</div>
                        <div class="small-text" style="margin-top: 8px;">完成率</div>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${(unlocked.length / total) * 100}%; background: linear-gradient(90deg, #f59e0b, #fde68a);"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">✨ 已解锁成就 (${unlockedList.length})</div>
                ${unlockedList.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏆</div>
                        <h3>继续努力！</h3>
                        <p>完成课程来解锁更多成就</p>
                    </div>
                ` : `
                    <div class="achievement-grid">
                        ${unlockedList.map(a => `
                            <div class="achievement-card unlocked">
                                <div class="achievement-icon">${a.icon}</div>
                                <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">${a.title}</div>
                                <div class="small-text" style="margin-bottom: 8px;">${a.desc}</div>
                                <div style="display: inline-block; padding: 4px 12px; background: #fef3c7; color: #f59e0b; border-radius: 20px; font-size: 12px; font-weight: 600;">+${a.xp} XP</div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <div class="card">
                <div class="card-title">🔒 待解锁成就 (${lockedList.length})</div>
                <div class="achievement-grid">
                    ${lockedList.map(a => `
                        <div class="achievement-card locked">
                            <div class="achievement-icon">${a.icon}</div>
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">${a.title}</div>
                            <div class="small-text" style="margin-bottom: 8px;">${a.desc}</div>
                            <div style="display: inline-block; padding: 4px 12px; background: #e2e8f0; color: #64748b; border-radius: 20px; font-size: 12px; font-weight: 600;">+${a.xp} XP</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-title">💡 如何获得成就？</div>
                <div class="grid grid-2" style="gap: 16px; margin-top: 16px;">
                    <div style="padding: 20px; background: #fef3c7; border-radius: 12px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">📚</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">坚持学习</div>
                        <div style="font-size: 13px; color: #78350f;">完成更多课程，学习更多单词</div>
                    </div>
                    <div style="padding: 20px; background: #eef2ff; border-radius: 12px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">保持连续</div>
                        <div style="font-size: 13px; color: #4338ca;">每天坚持学习，保持连续学习记录</div>
                    </div>
                    <div style="padding: 20px; background: #f0fdf4; border-radius: 12px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">多元化练习</div>
                        <div style="font-size: 13px; color: #166534;">练习不同模块：语法、口语、听力</div>
                    </div>
                    <div style="padding: 20px; background: #fdf2f8; border-radius: 12px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">社区互动</div>
                        <div style="font-size: 13px; color: #9d174d;">参与社区讨论，分享你的学习心得</div>
                    </div>
                </div>
            </div>
        `;
    }
};
