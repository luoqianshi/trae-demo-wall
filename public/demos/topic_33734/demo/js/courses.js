const Courses = {
    selectedLanguage: null,
    selectedLevel: null,

    render() {
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        this.selectedLanguage = this.selectedLanguage || user.currentLanguage;

        const container = document.getElementById('view-courses');
        const languages = COURSE_DATA.languages;

        container.innerHTML = `
            <div class="card">
                <div class="card-title">🌍 选择学习语言</div>
                <div class="grid grid-3" style="gap: 16px;">
                    ${languages.map(lang => `
                        <div class="language-card ${this.selectedLanguage === lang.id ? 'selected' : ''}" 
                             style="--card-color: ${lang.color}; --card-color-light: ${lang.colorLight};"
                             onclick="Courses.selectLanguage('${lang.id}')">
                            <div class="language-icon">${lang.icon}</div>
                            <h3>${lang.name}</h3>
                            <p>${lang.nativeName}</p>
                            <p style="margin-top: 8px;">${lang.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div id="levels-container"></div>
            <div id="lessons-container"></div>
        `;

        this.renderLevels();
    },

    selectLanguage(langId) {
        this.selectedLanguage = langId;
        const username = Storage.getCurrentUser();
        Storage.updateUserData(username, { currentLanguage: langId });
        this.render();
    },

    renderLevels() {
        const container = document.getElementById('levels-container');
        if (!container) return;

        const language = COURSE_DATA.languages.find(l => l.id === this.selectedLanguage);
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        this.selectedLevel = this.selectedLevel || user.currentLevel || language.levels[0];

        container.innerHTML = `
            <div class="card">
                <div class="card-title">📊 选择等级</div>
                <div class="level-tabs">
                    ${language.levels.map(level => `
                        <button class="level-tab ${this.selectedLevel === level ? 'active' : ''}"
                                onclick="Courses.selectLevel('${level}')">${level}</button>
                    `).join('')}
                </div>
            </div>
        `;

        this.renderLessons();
    },

    selectLevel(level) {
        this.selectedLevel = level;
        const username = Storage.getCurrentUser();
        Storage.updateUserData(username, { currentLevel: level });
        this.renderLevels();
    },

    renderLessons() {
        const container = document.getElementById('lessons-container');
        if (!container) return;

        const language = COURSE_DATA.languages.find(l => l.id === this.selectedLanguage);
        const lessons = COURSE_DATA.lessons[this.selectedLanguage][this.selectedLevel] || [];
        const username = Storage.getCurrentUser();
        const user = Storage.getUserData(username);
        const completed = user.progress.completedLessons;

        const typeNames = {
            vocabulary: '📖 单词',
            grammar: '✍️ 语法',
            speaking: '🎤 口语',
            listening: '👂 听力'
        };

        container.innerHTML = `
            <div class="card">
                <div class="card-title">📚 ${language.icon} ${language.name} - ${this.selectedLevel} 课程列表</div>
                ${lessons.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>暂无课程</h3>
                        <p>这个等级的课程正在开发中</p>
                    </div>
                ` : lessons.map(lesson => `
                    <div class="lesson-item ${completed.includes(lesson.id) ? 'completed' : ''}"
                         onclick="Courses.startLesson('${lesson.id}', '${lesson.type}')">
                        <div class="lesson-icon">${lesson.icon}</div>
                        <div class="lesson-content">
                            <div class="lesson-title">${lesson.title}</div>
                            <div class="lesson-meta">${typeNames[lesson.type]} · ${lesson.duration} 分钟 ${completed.includes(lesson.id) ? '· ✓ 已完成' : ''}</div>
                        </div>
                        <div class="lesson-status">${completed.includes(lesson.id) ? '✓' : '→'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    startLesson(lessonId, lessonType) {
        UI.switchView('learning');
        setTimeout(() => {
            Learning.switchModule(lessonType);
            Learning.currentLessonId = lessonId;
            Learning.loadLessonData();
        }, 100);
    }
};
