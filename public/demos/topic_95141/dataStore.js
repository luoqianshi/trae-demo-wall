/**
 * DataStore - localStorage 数据持久化封装
 * 用于保存学习数据：错题、答题历史、学习打卡、知识点掌握度、用户设置
 * 支持多用户数据隔离
 */
class DataStore {
    constructor() {
        this.keys = {
            USERS: 'ai_exam_users',
            CURRENT_USER: 'ai_exam_current_user',
            WRONG_ANSWERS: 'ai_exam_wrong_answers',
            EXAM_HISTORY: 'ai_exam_history',
            STUDY_DAYS: 'ai_exam_study_days',
            KNOWLEDGE_MASTERY: 'ai_exam_knowledge_mastery',
            USER_SETTINGS: 'ai_exam_user_settings',
            // 新增：积分和勋章系统
            USER_SCORE: 'ai_exam_user_score',
            USER_MEDALS: 'ai_exam_user_medals',
            USER_GRADE: 'ai_exam_user_grade',
            USER_TEXTBOOK: 'ai_exam_user_textbook',
            LAST_STUDY_DATE: 'ai_exam_last_study_date',
            STREAK_DAYS: 'ai_exam_streak_days'
        };
        this.init();
    }

    init() {
        // 检查是否有用户，没有则创建默认用户
        const users = this.getUsers();
        if (users.length === 0) {
            this.createDefaultUsers();
        }
        // 确保有当前用户
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            const allUsers = this.getUsers();
            if (allUsers.length > 0) {
                this.switchUser(allUsers[0].id);
            }
        }
    }

    // 用户管理方法
    getUsers() {
        return this.get(this.keys.USERS) || [];
    }

    createUser(name) {
        const users = this.getUsers();
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            avatar: this.generateAvatar(name),
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this.set(this.keys.USERS, users);
        return newUser;
    }

    switchUser(userId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            this.set(this.keys.CURRENT_USER, userId);
            return user;
        }
        return null;
    }

    getCurrentUser() {
        const currentUserId = this.get(this.keys.CURRENT_USER);
        if (!currentUserId) return null;
        const users = this.getUsers();
        return users.find(u => u.id === currentUserId) || null;
    }

    getCurrentUserId() {
        const currentUser = this.getCurrentUser();
        return currentUser ? currentUser.id : null;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return false;

        // 删除用户数据
        this.clearUserData(userId);

        // 从用户列表中移除
        users.splice(index, 1);
        this.set(this.keys.USERS, users);

        // 如果删除的是当前用户，切换到第一个用户
        const currentUserId = this.get(this.keys.CURRENT_USER);
        if (currentUserId === userId && users.length > 0) {
            this.switchUser(users[0].id);
        }

        return true;
    }

    generateAvatar(name) {
        const avatars = [
            { icon: '🐱', color: '#ff9ff3' },
            { icon: '🐶', color: '#feca57' },
            { icon: '🐰', color: '#ff6b6b' },
            { icon: '🐼', color: '#48dbfb' },
            { icon: '🦊', color: '#ff9f43' },
            { icon: '🐨', color: '#54a0ff' },
            { icon: '🐯', color: '#ff6348' },
            { icon: '🦁', color: '#ffa502' }
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % avatars.length;
        return avatars[index];
    }

    // 用户数据隔离辅助方法
    getUserDataKey(key) {
        const userId = this.getCurrentUserId();
        if (!userId) return key;
        return `${key}_${userId}`;
    }

    clearUserData(userId) {
        const keysToClear = [
            this.keys.WRONG_ANSWERS,
            this.keys.EXAM_HISTORY,
            this.keys.STUDY_DAYS,
            this.keys.KNOWLEDGE_MASTERY,
            this.keys.USER_SETTINGS
        ];
        keysToClear.forEach(key => {
            localStorage.removeItem(`${key}_${userId}`);
        });
    }

    // 创建默认用户和差异化数据
    createDefaultUsers() {
        // 创建3个演示用户
        const user1 = this.createUser('小明');
        const user2 = this.createUser('小红');
        const user3 = this.createUser('小刚');

        // 为每个用户设置差异化数据
        this.switchUser(user1.id);
        this.setDefaultDataForUser('xiaoming');

        this.switchUser(user2.id);
        this.setDefaultDataForUser('xiaohong');

        this.switchUser(user3.id);
        this.setDefaultDataForUser('xiaogang');

        // 默认切换到小明
        this.switchUser(user1.id);
    }

    setDefaultDataForUser(userType) {
        let defaultWrongAnswers, defaultExamHistory, defaultStudyDays, defaultMastery;

        if (userType === 'xiaoming') {
            // 小明 - 中等水平，分数乘除法薄弱
            defaultWrongAnswers = [
                {
                    id: 1,
                    knowledge: '分数乘除法',
                    date: '2026-06-20',
                    content: '计算：2/3 × 3/4 = ?',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 2,
                    knowledge: '分数乘除法',
                    date: '2026-06-19',
                    content: '小明有4/5千克苹果，分给3个小朋友，每个小朋友分多少？',
                    wrongAnswer: 'C',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 3,
                    knowledge: '图形面积计算',
                    date: '2026-06-18',
                    content: '一个三角形底是10cm，高是6cm，面积是多少？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'medium'
                },
                {
                    id: 4,
                    knowledge: '图形面积计算',
                    date: '2026-06-17',
                    content: '一个梯形上底4cm，下底8cm，高5cm，面积是多少？',
                    wrongAnswer: 'D',
                    correctAnswer: 'A',
                    mastery: 'medium'
                },
                {
                    id: 5,
                    knowledge: '单位换算',
                    date: '2026-06-16',
                    content: '2小时15分钟 = 多少分钟？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'high'
                }
            ];

            defaultExamHistory = [
                { date: '2026-06-20', score: 75, correct: 6, total: 8, knowledge: '分数乘除法' },
                { date: '2026-06-19', score: 82, correct: 9, total: 11, knowledge: '全部知识点' },
                { date: '2026-06-18', score: 68, correct: 5, total: 8, knowledge: '图形面积计算' }
            ];

            defaultStudyDays = [
                '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05',
                '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12',
                '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19',
                '2026-06-20', '2026-06-21', '2026-06-22'
            ];

            defaultMastery = {
                '分数乘除法': 45,
                '图形面积计算': 62,
                '单位换算': 78,
                '小数加减法': 91,
                '应用题': 70,
                '几何图形': 68
            };
        } else if (userType === 'xiaohong') {
            // 小红 - 优秀水平，小数加减法薄弱
            defaultWrongAnswers = [
                {
                    id: 1,
                    knowledge: '小数加减法',
                    date: '2026-06-20',
                    content: '计算：10.5 - 3.28 = ?',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 2,
                    knowledge: '小数加减法',
                    date: '2026-06-19',
                    content: '计算：8.6 + 3.45 - 5.2 = ?',
                    wrongAnswer: 'C',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 3,
                    knowledge: '应用题',
                    date: '2026-06-18',
                    content: '商店促销，买3送1，每支笔5元，小明想买8支笔，需要多少钱？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'medium'
                },
                {
                    id: 4,
                    knowledge: '单位换算',
                    date: '2026-06-17',
                    content: '1立方米 = 多少立方厘米？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'high'
                }
            ];

            defaultExamHistory = [
                { date: '2026-06-20', score: 88, correct: 7, total: 8, knowledge: '小数加减法' },
                { date: '2026-06-19', score: 92, correct: 11, total: 12, knowledge: '全部知识点' },
                { date: '2026-06-18', score: 85, correct: 6, total: 7, knowledge: '应用题' }
            ];

            defaultStudyDays = [
                '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05',
                '2026-06-06', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11',
                '2026-06-12', '2026-06-13', '2026-06-15', '2026-06-16', '2026-06-17',
                '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'
            ];

            defaultMastery = {
                '分数乘除法': 82,
                '图形面积计算': 88,
                '单位换算': 90,
                '小数加减法': 55,
                '应用题': 72,
                '几何图形': 85
            };
        } else {
            // 小刚 - 需要努力，多个知识点薄弱
            defaultWrongAnswers = [
                {
                    id: 1,
                    knowledge: '分数乘除法',
                    date: '2026-06-20',
                    content: '计算：(1/2 ÷ 1/3) × (2/3 ÷ 3/4) = ?',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 2,
                    knowledge: '图形面积计算',
                    date: '2026-06-19',
                    content: '一个圆的半径是5cm，面积是多少？（π取3.14）',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 3,
                    knowledge: '单位换算',
                    date: '2026-06-18',
                    content: '3.5千米 = 多少米？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 4,
                    knowledge: '应用题',
                    date: '2026-06-17',
                    content: '甲乙两地相距360千米，两车同时相向而行，甲车速度60km/h，乙车速度40km/h，几小时后相遇？',
                    wrongAnswer: 'C',
                    correctAnswer: 'A',
                    mastery: 'low'
                },
                {
                    id: 5,
                    knowledge: '小数加减法',
                    date: '2026-06-16',
                    content: '小明有20元，买一本书用去12.8元，还剩多少元？',
                    wrongAnswer: 'B',
                    correctAnswer: 'A',
                    mastery: 'medium'
                }
            ];

            defaultExamHistory = [
                { date: '2026-06-20', score: 55, correct: 4, total: 8, knowledge: '分数乘除法' },
                { date: '2026-06-19', score: 62, correct: 5, total: 10, knowledge: '全部知识点' },
                { date: '2026-06-18', score: 48, correct: 3, total: 7, knowledge: '图形面积计算' }
            ];

            defaultStudyDays = [
                '2026-06-02', '2026-06-04', '2026-06-06',
                '2026-06-09', '2026-06-11', '2026-06-13',
                '2026-06-16', '2026-06-18', '2026-06-20', '2026-06-22'
            ];

            defaultMastery = {
                '分数乘除法': 35,
                '图形面积计算': 42,
                '单位换算': 50,
                '小数加减法': 65,
                '应用题': 38,
                '几何图形': 45
            };
        }

        const defaultSettings = {
            defaultSubject: 'math',
            defaultDifficulty: 'auto',
            defaultCount: 10,
            darkMode: false
        };

        this.set(this.getUserDataKey(this.keys.WRONG_ANSWERS), defaultWrongAnswers);
        this.set(this.getUserDataKey(this.keys.EXAM_HISTORY), defaultExamHistory);
        this.set(this.getUserDataKey(this.keys.STUDY_DAYS), defaultStudyDays);
        this.set(this.getUserDataKey(this.keys.KNOWLEDGE_MASTERY), defaultMastery);
        this.set(this.getUserDataKey(this.keys.USER_SETTINGS), defaultSettings);
    }

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('DataStore get error:', e);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('DataStore set error:', e);
            return false;
        }
    }

    addWrongAnswer(question, userAnswer) {
        const wrongAnswers = this.getWrongAnswers();
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = wrongAnswers.findIndex(w => w.id === question.id);

        const wrongItem = {
            id: question.id,
            knowledge: question.knowledge,
            date: today,
            content: question.content,
            wrongAnswer: userAnswer || '未作答',
            correctAnswer: question.answer,
            mastery: 'low'
        };

        if (existingIndex >= 0) {
            wrongAnswers[existingIndex] = wrongItem;
        } else {
            wrongAnswers.unshift(wrongItem);
        }

        this.set(this.getUserDataKey(this.keys.WRONG_ANSWERS), wrongAnswers);
        return wrongItem;
    }

    addExamHistory(result) {
        const history = this.getExamHistory();
        const today = new Date().toISOString().split('T')[0];

        const historyItem = {
            date: today,
            score: result.score,
            correct: result.correct,
            total: result.total,
            knowledge: result.knowledge || '全部知识点'
        };

        history.unshift(historyItem);
        this.set(this.getUserDataKey(this.keys.EXAM_HISTORY), history);
        return historyItem;
    }

    getStudyDays() {
        return this.get(this.getUserDataKey(this.keys.STUDY_DAYS)) || [];
    }

    markStudyDay(date) {
        const studyDays = this.getStudyDays();
        const dateStr = date || new Date().toISOString().split('T')[0];
        if (!studyDays.includes(dateStr)) {
            studyDays.push(dateStr);
            this.set(this.getUserDataKey(this.keys.STUDY_DAYS), studyDays);
        }
        return studyDays;
    }

    updateMastery(knowledge, score) {
        const mastery = this.getMastery();
        const currentScore = mastery[knowledge] || 0;
        const newScore = Math.round((currentScore * 0.7) + (score * 0.3));
        mastery[knowledge] = Math.min(100, Math.max(0, newScore));
        this.set(this.getUserDataKey(this.keys.KNOWLEDGE_MASTERY), mastery);
        return mastery[knowledge];
    }

    getWrongAnswers() {
        return this.get(this.getUserDataKey(this.keys.WRONG_ANSWERS)) || [];
    }

    getExamHistory() {
        return this.get(this.getUserDataKey(this.keys.EXAM_HISTORY)) || [];
    }

    getMastery() {
        return this.get(this.getUserDataKey(this.keys.KNOWLEDGE_MASTERY)) || {};
    }

    getSettings() {
        return this.get(this.getUserDataKey(this.keys.USER_SETTINGS)) || {};
    }

    updateSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        this.set(this.getUserDataKey(this.keys.USER_SETTINGS), updated);
        return updated;
    }

    // ===== 新增：积分系统 =====
    getScore() {
        return this.get(this.getUserDataKey(this.keys.USER_SCORE)) || 0;
    }

    addScore(amount) {
        const current = this.getScore();
        const newScore = current + amount;
        this.set(this.getUserDataKey(this.keys.USER_SCORE), newScore);
        return newScore;
    }

    // ===== 新增：连续学习天数 =====
    getStreakDays() {
        return this.get(this.getUserDataKey(this.keys.STREAK_DAYS)) || 0;
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.get(this.getUserDataKey(this.keys.LAST_STUDY_DATE));
        let streak = this.getStreakDays();

        if (lastDate === today) {
            return streak; // 今天已经记录
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate === yesterday.toDateString()) {
            streak += 1;
        } else if (lastDate !== today) {
            streak = 1;
        }

        this.set(this.getUserDataKey(this.keys.STREAK_DAYS), streak);
        this.set(this.getUserDataKey(this.keys.LAST_STUDY_DATE), today);
        return streak;
    }

    // ===== 新增：勋章系统 =====
    getMedals() {
        return this.get(this.getUserDataKey(this.keys.USER_MEDALS)) || [];
    }

    unlockMedal(medalId) {
        const medals = this.getMedals();
        if (!medals.includes(medalId)) {
            medals.push(medalId);
            this.set(this.getUserDataKey(this.keys.USER_MEDALS), medals);
            return true; // 新解锁
        }
        return false; // 已拥有
    }

    hasMedal(medalId) {
        return this.getMedals().includes(medalId);
    }

    // ===== 新增：年级和课本版本 =====
    getGrade() {
        return this.get(this.getUserDataKey(this.keys.USER_GRADE)) || '4';
    }

    setGrade(grade) {
        this.set(this.getUserDataKey(this.keys.USER_GRADE), grade);
    }

    getTextbook() {
        return this.get(this.getUserDataKey(this.keys.USER_TEXTBOOK)) || 'pep';
    }

    setTextbook(textbook) {
        this.set(this.getUserDataKey(this.keys.USER_TEXTBOOK), textbook);
    }

    clearAll() {
        const userId = this.getCurrentUserId();
        if (userId) {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(`${key}_${userId}`);
            });
        }
    }
}

const dataStore = new DataStore();
