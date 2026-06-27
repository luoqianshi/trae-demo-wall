const DB = {
    KEYS: {
        USER: 'health_user',
        DIET_LOGS: 'health_diet_logs',
        SLEEP_LOGS: 'health_sleep_logs',
        ENV_LOGS: 'health_env_logs',
        SPORT_LOGS: 'health_sport_logs',
        REPORTS: 'health_reports',
        FOODS: 'health_foods',
        IS_LOGGED_IN: 'health_is_logged_in'
    },

    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    getUser() {
        return this.get(this.KEYS.USER) || null;
    },

    saveUser(user) {
        this.set(this.KEYS.USER, user);
    },

    isLoggedIn() {
        return localStorage.getItem(this.KEYS.IS_LOGGED_IN) === 'true';
    },

    login(username) {
        let user = this.getUser();
        if (!user) {
            user = {
                id: 1,
                nickname: username || '健康达人',
                avatar: '',
                gender: 0,
                birthday: '1995-01-01',
                height: 170,
                weight: 65,
                health_goal: '保持健康',
                health_score: 85,
                jointime: Date.now(),
                logintime: Date.now()
            };
            this.saveUser(user);
        }
        user.logintime = Date.now();
        this.saveUser(user);
        localStorage.setItem(this.KEYS.IS_LOGGED_IN, 'true');
        return user;
    },

    logout() {
        localStorage.removeItem(this.KEYS.IS_LOGGED_IN);
    },

    updateProfile(data) {
        const user = this.getUser();
        if (user) {
            Object.assign(user, data);
            this.saveUser(user);
            return user;
        }
        return null;
    },

    getDietLogs(date) {
        const logs = this.get(this.KEYS.DIET_LOGS) || [];
        if (date) {
            return logs.filter(log => log.record_date === date);
        }
        return logs;
    },

    addDietLog(log) {
        const logs = this.get(this.KEYS.DIET_LOGS) || [];
        log.id = Date.now();
        log.createtime = Date.now();
        logs.push(log);
        this.set(this.KEYS.DIET_LOGS, logs);
        return log;
    },

    deleteDietLog(id) {
        let logs = this.get(this.KEYS.DIET_LOGS) || [];
        logs = logs.filter(log => log.id !== id);
        this.set(this.KEYS.DIET_LOGS, logs);
    },

    getSleepLogs(startDate, endDate) {
        let logs = this.get(this.KEYS.SLEEP_LOGS) || [];
        if (startDate && endDate) {
            logs = logs.filter(log => log.record_date >= startDate && log.record_date <= endDate);
        }
        return logs.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
    },

    addSleepLog(log) {
        const logs = this.get(this.KEYS.SLEEP_LOGS) || [];
        log.id = Date.now();
        log.createtime = Date.now();
        logs.push(log);
        this.set(this.KEYS.SLEEP_LOGS, logs);
        return log;
    },

    deleteSleepLog(id) {
        let logs = this.get(this.KEYS.SLEEP_LOGS) || [];
        logs = logs.filter(log => log.id !== id);
        this.set(this.KEYS.SLEEP_LOGS, logs);
    },

    getEnvLogs() {
        const logs = this.get(this.KEYS.ENV_LOGS) || [];
        return logs.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
    },

    addEnvLog(log) {
        const logs = this.get(this.KEYS.ENV_LOGS) || [];
        log.id = Date.now();
        log.createtime = Date.now();
        logs.push(log);
        this.set(this.KEYS.ENV_LOGS, logs);
        return log;
    },

    deleteEnvLog(id) {
        let logs = this.get(this.KEYS.ENV_LOGS) || [];
        logs = logs.filter(log => log.id !== id);
        this.set(this.KEYS.ENV_LOGS, logs);
    },

    getSportLogs(date) {
        const logs = this.get(this.KEYS.SPORT_LOGS) || [];
        if (date) {
            return logs.filter(log => log.record_date === date);
        }
        return logs.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
    },

    addSportLog(log) {
        const logs = this.get(this.KEYS.SPORT_LOGS) || [];
        log.id = Date.now();
        log.createtime = Date.now();
        logs.push(log);
        this.set(this.KEYS.SPORT_LOGS, logs);
        return log;
    },

    deleteSportLog(id) {
        let logs = this.get(this.KEYS.SPORT_LOGS) || [];
        logs = logs.filter(log => log.id !== id);
        this.set(this.KEYS.SPORT_LOGS, logs);
    },

    getReports() {
        return this.get(this.KEYS.REPORTS) || [];
    },

    addReport(report) {
        const reports = this.get(this.KEYS.REPORTS) || [];
        report.id = Date.now();
        report.createtime = Date.now();
        reports.push(report);
        this.set(this.KEYS.REPORTS, reports);
        return report;
    },

    getFoods() {
        const foods = this.get(this.KEYS.FOODS);
        if (foods) return foods;
        const defaultFoods = [
            { name: '米饭', calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3, unit: '100g' },
            { name: '馒头', calories: 221, protein: 7, carbs: 47, fat: 1.1, unit: '100g' },
            { name: '鸡蛋', calories: 144, protein: 13.3, carbs: 2.8, fat: 8.8, unit: '1个(50g)' },
            { name: '牛奶', calories: 54, protein: 3, carbs: 3.4, fat: 3.2, unit: '100ml' },
            { name: '苹果', calories: 52, protein: 0.2, carbs: 13.5, fat: 0.2, unit: '1个(200g)' },
            { name: '香蕉', calories: 91, protein: 1.4, carbs: 22, fat: 0.2, unit: '1根(120g)' },
            { name: '菠萝', calories: 50, protein: 0.4, carbs: 10.8, fat: 0.1, unit: '100g' },
            { name: '鸡胸肉', calories: 133, protein: 19.4, carbs: 2.5, fat: 5, unit: '100g' },
            { name: '牛肉', calories: 125, protein: 19.9, carbs: 2, fat: 4.2, unit: '100g' },
            { name: '西兰花', calories: 33, protein: 4.1, carbs: 4.3, fat: 0.6, unit: '100g' },
            { name: '番茄', calories: 19, protein: 0.9, carbs: 4, fat: 0.2, unit: '100g' },
            { name: '黄瓜', calories: 16, protein: 0.8, carbs: 2.9, fat: 0.2, unit: '100g' },
            { name: '豆腐', calories: 81, protein: 8.1, carbs: 3.8, fat: 3.7, unit: '100g' },
            { name: '燕麦片', calories: 367, protein: 15, carbs: 61.6, fat: 6.7, unit: '100g' },
            { name: '面包', calories: 312, protein: 8.3, carbs: 58.6, fat: 5.1, unit: '100g' },
            { name: '面条', calories: 109, protein: 3.4, carbs: 21.4, fat: 0.7, unit: '100g' },
            { name: '饺子', calories: 240, protein: 8, carbs: 27, fat: 11, unit: '100g' },
            { name: '披萨', calories: 235, protein: 10, carbs: 25, fat: 10, unit: '1块(100g)' },
            { name: '汉堡', calories: 290, protein: 15, carbs: 25, fat: 15, unit: '1个' },
            { name: '薯条', calories: 312, protein: 3.3, carbs: 41, fat: 15, unit: '1份(100g)' },
            { name: '可乐', calories: 43, protein: 0, carbs: 10.6, fat: 0, unit: '100ml' }
        ];
        this.set(this.KEYS.FOODS, defaultFoods);
        return defaultFoods;
    },

    searchFood(keyword) {
        const foods = this.getFoods();
        if (!keyword) return foods;
        return foods.filter(f => f.name.includes(keyword));
    },

    calculateHealthScore() {
        const user = this.getUser();
        if (!user) return 0;

        const today = this.formatDate(new Date());
        const dietLogs = this.getDietLogs(today);
        const sleepLogs = this.getSleepLogs(today, today);
        const envLogs = this.getEnvLogs().filter(l => l.record_date === today);
        const sportLogs = this.getSportLogs(today);

        let dietScore = 70;
        let sleepScore = 70;
        let envScore = 70;
        let sportScore = 70;

        if (dietLogs.length > 0) {
            const totalCalories = dietLogs.reduce((sum, log) => sum + Number(log.calories), 0);
            const targetCalories = 2000;
            const diff = Math.abs(totalCalories - targetCalories) / targetCalories;
            dietScore = Math.max(50, Math.min(100, 90 - diff * 100));
        }

        if (sleepLogs.length > 0) {
            const lastSleep = sleepLogs[0];
            const durationHours = lastSleep.duration / 60;
            if (durationHours >= 7 && durationHours <= 9) {
                sleepScore = 95;
            } else if (durationHours >= 6 && durationHours <= 10) {
                sleepScore = 80;
            } else {
                sleepScore = 60;
            }
            if (lastSleep.quality) {
                sleepScore = (sleepScore + lastSleep.quality * 20) / 2;
            }
        }

        if (envLogs.length > 0) {
            const lastEnv = envLogs[0];
            const riskLevel = lastEnv.risk_level || 3;
            envScore = 100 - (riskLevel - 1) * 12.5;
        }

        if (sportLogs.length > 0) {
            const totalDuration = sportLogs.reduce((sum, log) => sum + Number(log.duration), 0);
            const totalCalories = sportLogs.reduce((sum, log) => sum + Number(log.calories), 0);
            if (totalDuration >= 30 && totalDuration <= 90) {
                sportScore = Math.min(100, 70 + totalDuration / 3);
            } else if (totalDuration < 30) {
                sportScore = Math.max(50, 50 + totalDuration);
            } else {
                sportScore = Math.max(70, 90 - (totalDuration - 90) / 10);
            }
        }

        const totalScore = Math.round(dietScore * 0.3 + sleepScore * 0.25 + envScore * 0.2 + sportScore * 0.25);
        
        if (user) {
            user.health_score = totalScore;
            this.saveUser(user);
        }

        return {
            total: totalScore,
            diet: Math.round(dietScore),
            sleep: Math.round(sleepScore),
            environment: Math.round(envScore),
            sport: Math.round(sportScore)
        };
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    generateMockData() {
        // 只在首次使用时生成测试数据，已有数据则保留
        const hasData = this.get(this.KEYS.DIET_LOGS) || this.get(this.KEYS.SLEEP_LOGS);
        if (hasData) return;

        const user = {
            id: 1,
            nickname: '健康达人',
            avatar: '',
            gender: 1,
            birthday: '1995-06-15',
            height: 175,
            weight: 68,
            health_goal: '减脂增肌',
            health_score: 82,
            jointime: Date.now() - 30 * 24 * 60 * 60 * 1000,
            logintime: Date.now()
        };
        this.saveUser(user);
        localStorage.setItem(this.KEYS.IS_LOGGED_IN, 'true');

        const today = new Date();
        const dietLogs = [];
        const sleepLogs = [];
        const envLogs = [];
        const sportLogs = [];

        // 生成近14天的数据
        for (let i = 14; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);

            // 早餐
            const breakfastFoods = [
                { name: '燕麦粥 + 鸡蛋 + 牛奶', calories: 420, protein: 22, carbs: 55, fat: 12 },
                { name: '全麦面包 + 煎蛋 + 牛奶', calories: 380, protein: 18, carbs: 48, fat: 14 },
                { name: '小米粥 + 包子 + 咸菜', calories: 450, protein: 12, carbs: 70, fat: 12 },
                { name: '豆浆 + 油条 + 鸡蛋', calories: 520, protein: 15, carbs: 65, fat: 22 },
                { name: '水果沙拉 + 酸奶 + 坚果', calories: 350, protein: 12, carbs: 45, fat: 15 }
            ];
            if (Math.random() > 0.2) {
                const food = breakfastFoods[Math.floor(Math.random() * breakfastFoods.length)];
                dietLogs.push({
                    id: Date.now() + i * 100 + 1,
                    meal_type: 'breakfast',
                    food_name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    record_date: dateStr,
                    createtime: date.getTime()
                });
            }

            // 午餐
            const lunchFoods = [
                { name: '糙米饭 + 鸡胸肉 + 西兰花', calories: 680, protein: 35, carbs: 75, fat: 18 },
                { name: '面条 + 牛肉 + 青菜', calories: 650, protein: 28, carbs: 80, fat: 20 },
                { name: '饺子 ×10 + 醋', calories: 580, protein: 22, carbs: 70, fat: 22 },
                { name: '披萨 + 沙拉', calories: 720, protein: 25, carbs: 85, fat: 28 },
                { name: '盖浇饭 + 番茄炒蛋', calories: 620, protein: 20, carbs: 90, fat: 18 }
            ];
            if (Math.random() > 0.1) {
                const food = lunchFoods[Math.floor(Math.random() * lunchFoods.length)];
                dietLogs.push({
                    id: Date.now() + i * 100 + 2,
                    meal_type: 'lunch',
                    food_name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    record_date: dateStr,
                    createtime: date.getTime() + 3600000 * 4
                });
            }

            // 晚餐
            const dinnerFoods = [
                { name: '面条 + 牛肉 + 番茄', calories: 550, protein: 28, carbs: 65, fat: 15 },
                { name: '米饭 + 鱼香肉丝 + 青菜', calories: 620, protein: 25, carbs: 75, fat: 22 },
                { name: '粥 + 馒头 + 凉拌菜', calories: 450, protein: 12, carbs: 70, fat: 12 },
                { name: '沙拉 + 鸡胸肉', calories: 380, protein: 30, carbs: 25, fat: 15 },
                { name: '火锅 + 各种蔬菜', calories: 750, protein: 35, carbs: 60, fat: 35 }
            ];
            if (Math.random() > 0.15) {
                const food = dinnerFoods[Math.floor(Math.random() * dinnerFoods.length)];
                dietLogs.push({
                    id: Date.now() + i * 100 + 3,
                    meal_type: 'dinner',
                    food_name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    record_date: dateStr,
                    createtime: date.getTime() + 3600000 * 10
                });
            }

            // 加餐（概率较低）
            if (Math.random() > 0.7) {
                const snackFoods = [
                    { name: '苹果', calories: 52, protein: 0.2, carbs: 13.5, fat: 0.2 },
                    { name: '香蕉', calories: 91, protein: 1.4, carbs: 22, fat: 0.2 },
                    { name: '酸奶', calories: 70, protein: 3, carbs: 10, fat: 2 },
                    { name: '坚果', calories: 120, protein: 4, carbs: 8, fat: 10 },
                    { name: '饼干', calories: 150, protein: 2, carbs: 20, fat: 6 }
                ];
                const food = snackFoods[Math.floor(Math.random() * snackFoods.length)];
                dietLogs.push({
                    id: Date.now() + i * 100 + 4,
                    meal_type: 'snack',
                    food_name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    record_date: dateStr,
                    createtime: date.getTime() + 3600000 * 15
                });
            }

            if (Math.random() > 0.1) {
                const sleepDuration = Math.round(360 + Math.random() * 180);
                const quality = Math.round(3 + Math.random() * 2);
                sleepLogs.push({
                    id: Date.now() + i * 100 + 10,
                    sleep_time: `${dateStr} 23:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`,
                    wake_time: `${this.formatDate(new Date(date.getTime() + 24 * 60 * 60 * 1000))} 07:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`,
                    duration: sleepDuration,
                    quality: quality,
                    record_date: dateStr,
                    createtime: date.getTime()
                });
            }

            if (Math.random() > 0.3) {
                const riskLevel = Math.round(1 + Math.random() * 2);
                envLogs.push({
                    id: Date.now() + i * 100 + 20,
                    location_type: Math.random() > 0.5 ? 'home' : 'office',
                    air_quality: Math.round(30 + Math.random() * 80),
                    temperature: (22 + Math.random() * 6).toFixed(1),
                    humidity: Math.round(40 + Math.random() * 30),
                    risk_level: riskLevel,
                    record_date: dateStr,
                    createtime: date.getTime()
                });
            }

            if (Math.random() > 0.25) {
                const sportTypes = [
                    { type: 'walking', name: '步行', icon: '🚶' },
                    { type: 'running', name: '跑步', icon: '🏃' },
                    { type: 'cycling', name: '骑行', icon: '🚴' },
                    { type: 'gym', name: '健身', icon: '💪' },
                    { type: 'yoga', name: '瑜伽', icon: '🧘' }
                ];
                const sportType = sportTypes[Math.floor(Math.random() * sportTypes.length)];
                const duration = Math.round(30 + Math.random() * 60);
                const steps = Math.round(3000 + Math.random() * 7000);
                const calories = Math.round(duration * 5 + Math.random() * 100);
                const distance = (steps * 0.0007).toFixed(2);
                
                sportLogs.push({
                    id: Date.now() + i * 100 + 30,
                    sport_type: sportType.type,
                    sport_name: sportType.name,
                    sport_icon: sportType.icon,
                    duration: duration,
                    calories: calories,
                    steps: steps,
                    distance: parseFloat(distance),
                    intensity: Math.round(1 + Math.random() * 2),
                    note: '',
                    record_date: dateStr,
                    createtime: date.getTime()
                });
            }
        }

        if (dietLogs.length > 0) this.set(this.KEYS.DIET_LOGS, dietLogs);
        if (sleepLogs.length > 0) this.set(this.KEYS.SLEEP_LOGS, sleepLogs);
        if (envLogs.length > 0) this.set(this.KEYS.ENV_LOGS, envLogs);
        if (sportLogs.length > 0) this.set(this.KEYS.SPORT_LOGS, sportLogs);
    }
};
