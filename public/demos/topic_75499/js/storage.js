/**
 * 学智云学习平台 - localStorage封装
 * 用于本地数据持久化存储
 */

const Storage = {
    // 存储键名前缀
    PREFIX: 'xzy_',

    /**
     * 获取存储数据
     * @param {string} key - 存储键名
     * @returns {any} 存储的数据
     */
    get(key) {
        try {
            const fullKey = this.PREFIX + key;
            const value = localStorage.getItem(fullKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    /**
     * 设置存储数据
     * @param {string} key - 存储键名
     * @param {any} value - 要存储的数据
     */
    set(key, value) {
        try {
            const fullKey = this.PREFIX + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
        } catch (error) {
            console.error('Storage set error:', error);
            // 存储空间不足时清理旧数据
            if (error.name === 'QuotaExceededError') {
                this.clearOldData();
                localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            }
        }
    },

    /**
     * 删除存储数据
     * @param {string} key - 存储键名
     */
    remove(key) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    /**
     * 清空所有存储数据
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    },

    /**
     * 清理旧数据（当存储空间不足时）
     */
    clearOldData() {
        try {
            // 清理30天前的学习记录
            const learningRecords = this.get('learning_records') || [];
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const filteredRecords = learningRecords.filter(record => {
                return new Date(record.startTime) > thirtyDaysAgo;
            });
            this.set('learning_records', filteredRecords);

            // 清理旧的错题记录（保留最近100条）
            const mistakes = this.get('mistakes') || [];
            if (mistakes.length > 100) {
                this.set('mistakes', mistakes.slice(0, 100));
            }
        } catch (error) {
            console.error('Storage clearOldData error:', error);
        }
    },

    /**
     * 获取存储大小（字节）
     * @returns {number} 存储大小
     */
    getSize() {
        let size = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    const value = localStorage.getItem(key);
                    size += key.length + (value ? value.length : 0);
                }
            }
        } catch (error) {
            console.error('Storage getSize error:', error);
        }
        return size;
    },

    // ============================================
    // 用户相关存储
    // ============================================

    /**
     * 获取当前用户信息
     * @returns {object|null} 用户信息
     */
    getUser() {
        return this.get('current_user');
    },

    /**
     * 设置当前用户信息
     * @param {object} user - 用户信息
     */
    setUser(user) {
        this.set('current_user', user);
    },

    /**
     * 清除当前用户信息（退出登录）
     */
    clearUser() {
        this.remove('current_user');
    },

    // ============================================
    // 学习记录相关存储
    // ============================================

    /**
     * 获取学习记录
     * @returns {array} 学习记录列表
     */
    getLearningRecords() {
        return this.get('learning_records') || [];
    },

    /**
     * 添加学习记录
     * @param {object} record - 学习记录
     */
    addLearningRecord(record) {
        const records = this.getLearningRecords();
        records.unshift({
            ...record,
            id: Helpers.generateId(),
            startTime: new Date().toISOString()
        });
        this.set('learning_records', records);
    },

    /**
     * 更新学习记录
     * @param {string} recordId - 记录ID
     * @param {object} updates - 更新内容
     */
    updateLearningRecord(recordId, updates) {
        const records = this.getLearningRecords();
        const index = records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates };
            this.set('learning_records', records);
        }
    },

    // ============================================
    // 错题相关存储
    // ============================================

    /**
     * 获取错题列表
     * @returns {array} 错题列表
     */
    getMistakes() {
        return this.get('mistakes') || [];
    },

    /**
     * 添加错题
     * @param {object} mistake - 错题信息
     */
    addMistake(mistake) {
        const mistakes = this.getMistakes();
        // 检查是否已存在该错题
        const existing = mistakes.find(m => m.questionId === mistake.questionId);
        if (existing) {
            existing.attemptCount += 1;
            existing.lastAttempt = new Date().toISOString();
            existing.wrongAnswer = mistake.wrongAnswer;
        } else {
            mistakes.unshift({
                ...mistake,
                id: Helpers.generateId(),
                attemptCount: 1,
                lastAttempt: new Date().toISOString()
            });
        }
        this.set('mistakes', mistakes);
    },

    /**
     * 移除错题（已掌握）
     * @param {string} mistakeId - 错题ID
     */
    removeMistake(mistakeId) {
        const mistakes = this.getMistakes();
        const filtered = mistakes.filter(m => m.id !== mistakeId);
        this.set('mistakes', filtered);
    },

    // ============================================
    // 学习计划相关存储
    // ============================================

    /**
     * 获取学习计划
     * @returns {object} 学习计划
     */
    getStudyPlan() {
        return this.get('study_plan') || {
            dailyGoal: 10, // 每日目标题目数
            weeklyGoal: 50, // 每周目标题目数
            reminderTimes: ['09:00', '15:00', '19:00'] // 提醒时间
        };
    },

    /**
     * 设置学习计划
     * @param {object} plan - 学习计划
     */
    setStudyPlan(plan) {
        this.set('study_plan', plan);
    },

    // ============================================
    // 学习统计相关存储
    // ============================================

    /**
     * 获取今日学习统计
     * @returns {object} 今日统计
     */
    getTodayStats() {
        const today = Helpers.getTodayDate();
        const records = this.getLearningRecords();
        const todayRecords = records.filter(r => {
            const recordDate = new Date(r.startTime).toISOString().split('T')[0];
            return recordDate === today;
        });

        const totalQuestions = todayRecords.filter(r => r.itemType === 'question').length;
        const correctQuestions = todayRecords.filter(r => r.itemType === 'question' && r.score === 100).length;
        const totalVideos = todayRecords.filter(r => r.itemType === 'video').length;

        // 计算学习时长（分钟）
        let totalTime = 0;
        todayRecords.forEach(r => {
            if (r.endTime) {
                const duration = (new Date(r.endTime) - new Date(r.startTime)) / 1000 / 60;
                totalTime += duration;
            }
        });

        return {
            date: today,
            totalQuestions,
            correctQuestions,
            accuracy: totalQuestions > 0 ? (correctQuestions / totalQuestions * 100).toFixed(1) : 0,
            totalVideos,
            totalTime: Math.round(totalTime)
        };
    },

    /**
     * 获取周学习统计
     * @returns {object} 周统计
     */
    getWeeklyStats() {
        const weekStart = Helpers.getWeekStart();
        const weekEnd = Helpers.getWeekEnd();
        const records = this.getLearningRecords();

        const weekRecords = records.filter(r => {
            const recordDate = new Date(r.startTime);
            return recordDate >= weekStart && recordDate <= weekEnd;
        });

        // 按天分组统计
        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = {
                questions: 0,
                videos: 0,
                time: 0,
                accuracy: 0,
                correct: 0
            };
        }

        weekRecords.forEach(r => {
            const dateStr = new Date(r.startTime).toISOString().split('T')[0];
            if (dailyStats[dateStr]) {
                if (r.itemType === 'question') {
                    dailyStats[dateStr].questions += 1;
                    if (r.score === 100) {
                        dailyStats[dateStr].correct += 1;
                    }
                } else if (r.itemType === 'video') {
                    dailyStats[dateStr].videos += 1;
                }
                if (r.endTime) {
                    const duration = (new Date(r.endTime) - new Date(r.startTime)) / 1000 / 60;
                    dailyStats[dateStr].time += duration;
                }
            }
        });

        // 计算每天的正确率
        Object.keys(dailyStats).forEach(date => {
            const stats = dailyStats[date];
            stats.accuracy = stats.questions > 0 ? (stats.correct / stats.questions * 100).toFixed(1) : 0;
        });

        return {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            dailyStats
        };
    },

    /**
     * 获取科目学习统计
     * @returns {object} 科目统计
     */
    getSubjectStats() {
        const records = this.getLearningRecords();
        const subjectStats = {
            chinese: { questions: 0, correct: 0, time: 0 },
            math: { questions: 0, correct: 0, time: 0 },
            english: { questions: 0, correct: 0, time: 0 },
            physics: { questions: 0, correct: 0, time: 0 },
            chemistry: { questions: 0, correct: 0, time: 0 },
            biology: { questions: 0, correct: 0, time: 0 },
            science: { questions: 0, correct: 0, time: 0 }
        };

        records.forEach(r => {
            if (r.subject && subjectStats[r.subject]) {
                if (r.itemType === 'question') {
                    subjectStats[r.subject].questions += 1;
                    if (r.score === 100) {
                        subjectStats[r.subject].correct += 1;
                    }
                }
                if (r.endTime) {
                    const duration = (new Date(r.endTime) - new Date(r.startTime)) / 1000 / 60;
                    subjectStats[r.subject].time += duration;
                }
            }
        });

        // 计算每个科目的正确率
        Object.keys(subjectStats).forEach(subject => {
            const stats = subjectStats[subject];
            stats.accuracy = stats.questions > 0 ? (stats.correct / stats.questions * 100).toFixed(1) : 0;
        });

        return subjectStats;
    },

    // ============================================
    // 用户设置相关存储
    // ============================================

    /**
     * 获取用户设置
     * @returns {object} 用户设置
     */
    getUserSettings() {
        return this.get('user_settings') || {
            theme: 'light', // 主题
            language: 'zh-CN', // 语言
            notifications: true, // 通知
            autoPlay: false // 自动播放视频
        };
    },

    /**
     * 设置用户设置
     * @param {object} settings - 用户设置
     */
    setUserSettings(settings) {
        this.set('user_settings', settings);
    },

    // ============================================
    // 当前年级和科目存储
    // ============================================

    /**
     * 获取当前年级
     * @returns {number} 年级（1-9）
     */
    getCurrentGrade() {
        return this.get('current_grade') || 1;
    },

    /**
     * 设置当前年级
     * @param {number} grade - 年级（1-9）
     */
    setCurrentGrade(grade) {
        this.set('current_grade', grade);
    },

    /**
     * 获取当前科目
     * @returns {string} 科目名称
     */
    getCurrentSubject() {
        return this.get('current_subject') || 'math';
    },

    /**
     * 设置当前科目
     * @param {string} subject - 科目名称
     */
    setCurrentSubject(subject) {
        this.set('current_subject', subject);
    }
};

// 导出Storage对象（兼容模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
} else {
    window.Storage = Storage;
}