const UI = {
    currentView: 'dashboard',

    switchView(viewName) {
        this.currentView = viewName;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById('view-' + viewName);
        if (targetView) {
            targetView.classList.add('active');
        }

        const titles = {
            dashboard: { title: '学习中心', subtitle: '开启今日的语言学习之旅' },
            courses: { title: '课程中心', subtitle: '选择语言，探索分级课程' },
            learning: { title: '互动学习', subtitle: '通过多种方式练习语言' },
            progress: { title: '学习进度', subtitle: '追踪你的成长轨迹' },
            community: { title: '社区交流', subtitle: '与全球学习者分享心得' },
            achievements: { title: '成就中心', subtitle: '解锁成就，激励前行' }
        };

        if (titles[viewName]) {
            document.getElementById('page-title').textContent = titles[viewName].title;
            document.getElementById('page-subtitle').textContent = titles[viewName].subtitle;
        }

        switch (viewName) {
            case 'dashboard':
                Dashboard.render();
                break;
            case 'courses':
                Courses.render();
                break;
            case 'learning':
                Learning.render();
                break;
            case 'progress':
                Progress.render();
                break;
            case 'community':
                Community.render();
                break;
            case 'achievements':
                Achievements.render();
                break;
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showXPPopup(xp) {
        const popup = document.createElement('div');
        popup.className = 'xp-popup';
        popup.textContent = `+${xp} XP`;
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 1500);
    },

    showModal(content, title = '') {
        const modal = document.getElementById('modal');
        const container = document.getElementById('modal-container');

        modal.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size: 20px;">${title}</h3>
                <button class="modal-close" onclick="UI.closeModal()">✕</button>
            </div>
            <div class="modal-body">${content}</div>
        `;

        container.style.display = 'flex';
    },

    closeModal() {
        document.getElementById('modal-container').style.display = 'none';
    },

    updateUserStats() {
        const username = Storage.getCurrentUser();
        if (!username) return;

        const user = Storage.getUserData(username);
        if (!user) return;

        document.getElementById('stat-streak').textContent = user.progress.streak || 0;
        document.getElementById('stat-xp').textContent = user.stats.totalXP || 0;
        document.getElementById('stat-today').textContent = user.progress.todayLessons || 0;
        document.getElementById('sidebar-level').textContent = `Lv.${user.stats.level}`;
    },

    completeLesson(lessonId, xp = 20) {
        const username = Storage.getCurrentUser();
        if (!username) return;

        const wasNew = Storage.markLessonCompleted(username, lessonId);
        if (wasNew) {
            Storage.incrementStat(username, 'completedLessons');
            const result = Storage.addXP(username, xp);

            this.updateUserStats();
            this.showXPPopup(xp);

            const newAchievements = Storage.checkAchievements(username);
            newAchievements.forEach(achievement => {
                setTimeout(() => {
                    this.showToast(`🏆 解锁成就: ${achievement.title} (+${achievement.xp}XP)`, 'success');
                    Storage.addXP(username, achievement.xp);
                    this.updateUserStats();
                }, 500);
            });

            if (result.leveledUp) {
                setTimeout(() => {
                    this.showToast(`🎉 升级啦！现在是 Lv.${result.newLevel}`, 'success');
                }, 1000);
            }
        }
    }
};
