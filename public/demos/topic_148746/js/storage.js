const Storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    init() {
        const defaultData = {
            user: {
                name: '同学',
                level: 1,
                coins: 0,
                exp: 0,
                badges: [],
                streak: 0,
                lastLogin: null
            },
            learningRecords: [],
            wordProgress: {},
            grammarProgress: {},
            srsData: {},
            dailyStats: {},
            combo: 0,
            dailyChallenge: {
                targetWords: 20,
                targetGrammar: 5,
                targetListening: 5,
                targetMath: 5,
                targetChinese: 5,
                completedWords: 0,
                completedGrammar: 0,
                completedListening: 0,
                completedMath: 0,
                completedChinese: 0,
                date: null
            }
        };

        if (!this.get('english_learning_data')) {
            this.set('english_learning_data', defaultData);
        }
    },

    getData() {
        return this.get('english_learning_data', {
            user: { name: '同学', level: 1, coins: 0, exp: 0, badges: [], streak: 0, lastLogin: null },
            learningRecords: [],
            wordProgress: {},
            grammarProgress: {},
            srsData: {},
            dailyStats: {},
            combo: 0,
            dailyChallenge: {
                targetWords: 20,
                targetGrammar: 5,
                targetListening: 5,
                targetMath: 5,
                targetChinese: 5,
                completedWords: 0,
                completedGrammar: 0,
                completedListening: 0,
                completedMath: 0,
                completedChinese: 0,
                date: null
            }
        });
    },

    saveData(data) {
        return this.set('english_learning_data', data);
    },

    addLearningRecord(type, score, timeSpent) {
        const data = this.getData();
        const record = {
            id: Date.now(),
            type,
            score,
            timeSpent,
            date: new Date().toISOString(),
            combo: data.combo
        };
        data.learningRecords.push(record);
        this.saveData(data);
    },

    updateWordProgress(wordId, status) {
        const data = this.getData();
        data.wordProgress[wordId] = status;
        this.saveData(data);
    },

    updateGrammarProgress(topicId, status) {
        const data = this.getData();
        data.grammarProgress[topicId] = status;
        this.saveData(data);
    },

    addCoins(amount) {
        const data = this.getData();
        data.user.coins += amount;
        this.saveData(data);
    },

    addExp(amount) {
        const data = this.getData();
        data.user.exp += amount;
        const expNeeded = data.user.level * 100;
        if (data.user.exp >= expNeeded) {
            data.user.exp -= expNeeded;
            data.user.level++;
            this.addBadge(`level_${data.user.level}`);
        }
        this.saveData(data);
    },

    addBadge(badgeId) {
        const data = this.getData();
        if (!data.user.badges.includes(badgeId)) {
            data.user.badges.push(badgeId);
            this.saveData(data);
        }
    },

    updateDailyStats(type, value) {
        const data = this.getData();
        const today = new Date().toLocaleDateString('zh-CN');
        if (!data.dailyStats[today]) {
            data.dailyStats[today] = { words: 0, grammar: 0, reading: 0, listening: 0, speaking: 0, math: 0, chinese: 0, games: 0 };
        }
        data.dailyStats[today][type] += value;
        this.saveData(data);
    },

    updateSRS(itemId, correct) {
        const data = this.getData();
        if (!data.srsData[itemId]) {
            data.srsData[itemId] = {
                interval: 1,
                repetitions: 0,
                easeFactor: 2.5,
                nextReview: Date.now()
            };
        }

        const srs = data.srsData[itemId];

        if (correct) {
            srs.repetitions++;
            if (srs.repetitions === 1) {
                srs.interval = 1;
            } else if (srs.repetitions === 2) {
                srs.interval = 3;
            } else {
                srs.interval = Math.round(srs.interval * srs.easeFactor);
            }
            srs.easeFactor = Math.max(1.3, srs.easeFactor + 0.1);
        } else {
            srs.repetitions = 0;
            srs.interval = 1;
            srs.easeFactor = Math.max(1.3, srs.easeFactor - 0.2);
        }

        srs.nextReview = Date.now() + srs.interval * 24 * 60 * 60 * 1000;
        data.srsData[itemId] = srs;
        this.saveData(data);
    },

    getItemsToReview(itemIds) {
        const data = this.getData();
        const now = Date.now();
        return itemIds.filter(id => {
            const srs = data.srsData[id];
            return !srs || srs.nextReview <= now;
        });
    },

    getSRSWeight(itemId) {
        const data = this.getData();
        const srs = data.srsData[itemId];
        if (!srs) return 10;
        const now = Date.now();
        if (srs.nextReview <= now) {
            const overdueDays = Math.floor((now - srs.nextReview) / (24 * 60 * 60 * 1000));
            return 10 + overdueDays * 5;
        }
        return Math.max(1, 10 - Math.floor((srs.nextReview - now) / (24 * 60 * 60 * 1000)));
    },

    addCombo() {
        const data = this.getData();
        data.combo++;
        this.saveData(data);
        return data.combo;
    },

    resetCombo() {
        const data = this.getData();
        data.combo = 0;
        this.saveData(data);
    },

    getCombo() {
        return this.getData().combo;
    },

    checkStreak() {
        const data = this.getData();
        const today = new Date().toLocaleDateString('zh-CN');
        
        if (!data.user.lastLogin) {
            data.user.streak = 1;
            data.user.lastLogin = today;
            this.saveData(data);
            return 1;
        }

        const lastDate = new Date(data.user.lastLogin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (24 * 60 * 60 * 1000));

        if (diffDays === 0) {
            return data.user.streak;
        } else if (diffDays === 1) {
            data.user.streak++;
            data.user.lastLogin = today;
            
            if (data.user.streak === 7) {
                this.addBadge('streak_7');
                this.addCoins(30);
                this.addExp(50);
            } else if (data.user.streak === 30) {
                this.addBadge('streak_30');
                this.addCoins(100);
                this.addExp(200);
            } else if (data.user.streak % 7 === 0) {
                this.addCoins(20);
                this.addExp(30);
            }
            
            this.saveData(data);
            return data.user.streak;
        } else {
            data.user.streak = 1;
            data.user.lastLogin = today;
            this.saveData(data);
            return 1;
        }
    },

    updateDailyChallenge(type, value) {
        const data = this.getData();
        const today = new Date().toLocaleDateString('zh-CN');

        if (data.dailyChallenge.date !== today) {
            data.dailyChallenge = {
                targetWords: 20,
                targetGrammar: 5,
                targetListening: 5,
                targetMath: 5,
                targetChinese: 5,
                completedWords: 0,
                completedGrammar: 0,
                completedListening: 0,
                completedMath: 0,
                completedChinese: 0,
                date: today
            };
        }

        switch (type) {
            case 'words':
                data.dailyChallenge.completedWords += value;
                break;
            case 'grammar':
                data.dailyChallenge.completedGrammar += value;
                break;
            case 'listening':
                data.dailyChallenge.completedListening += value;
                break;
            case 'math':
                data.dailyChallenge.completedMath += value;
                break;
            case 'chinese':
                data.dailyChallenge.completedChinese += value;
                break;
        }

        this.saveData(data);
        return this.checkDailyChallengeComplete(data.dailyChallenge);
    },

    checkDailyChallengeComplete(challenge) {
        const wordsDone = challenge.completedWords >= challenge.targetWords;
        const grammarDone = challenge.completedGrammar >= challenge.targetGrammar;
        const listeningDone = challenge.completedListening >= challenge.targetListening;
        const mathDone = challenge.completedMath >= challenge.targetMath;
        const chineseDone = challenge.completedChinese >= challenge.targetChinese;

        if (wordsDone && grammarDone && listeningDone && mathDone && chineseDone) {
            this.addCoins(80);
            this.addExp(150);
            this.addBadge('daily_champion');
            return true;
        }
        return false;
    },

    getDailyChallenge() {
        const data = this.getData();
        const today = new Date().toLocaleDateString('zh-CN');

        if (!data.dailyChallenge || data.dailyChallenge.date !== today) {
            data.dailyChallenge = {
                targetWords: 20,
                targetGrammar: 5,
                targetListening: 5,
                targetMath: 5,
                targetChinese: 5,
                completedWords: 0,
                completedGrammar: 0,
                completedListening: 0,
                completedMath: 0,
                completedChinese: 0,
                date: today
            };
            this.saveData(data);
        }

        return data.dailyChallenge;
    }
};
