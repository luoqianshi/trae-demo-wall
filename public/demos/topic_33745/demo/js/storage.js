const Storage = {
    KEY_USERS: 'linguaworld_users',
    KEY_CURRENT_USER: 'linguaworld_current_user',
    KEY_POSTS: 'linguaworld_posts',

    getUsers() {
        const data = localStorage.getItem(this.KEY_USERS);
        return data ? JSON.parse(data) : [];
    },

    saveUsers(users) {
        localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
    },

    getCurrentUser() {
        const data = localStorage.getItem(this.KEY_CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    setCurrentUser(username) {
        localStorage.setItem(this.KEY_CURRENT_USER, JSON.stringify(username));
    },

    clearCurrentUser() {
        localStorage.removeItem(this.KEY_CURRENT_USER);
    },

    getUserData(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username) || null;
    },

    updateUserData(username, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.username === username);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.saveUsers(users);
            return users[index];
        }
        return null;
    },

    registerUser(username, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.username === username)) {
            return { success: false, message: '用户名已存在' };
        }
        if (users.find(u => u.email === email)) {
            return { success: false, message: '邮箱已被注册' };
        }

        const today = new Date().toISOString().split('T')[0];
        const newUser = {
            username,
            email,
            password,
            createdAt: today,
            currentLanguage: 'en',
            currentLevel: 'A1 入门',
            progress: {
                completedLessons: [],
                completedQuizzes: [],
                streak: 0,
                lastStudyDate: null,
                todayXP: 0,
                todayLessons: 0
            },
            stats: {
                totalXP: 0,
                level: 1,
                completedLessons: 0,
                vocabLearned: 0,
                grammarSolved: 0,
                speakingCompleted: 0,
                listeningCompleted: 0,
                streak: 0,
                postsMade: 0,
                likesReceived: 0,
                unlockedAchievements: [],
                weeklyXP: [0, 0, 0, 0, 0, 0, 0]
            }
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, message: '注册成功' };
    },

    loginUser(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return { success: false, message: '用户不存在' };
        }
        if (user.password !== password) {
            return { success: false, message: '密码错误' };
        }
        this.setCurrentUser(username);
        this.updateStreak(username);
        return { success: true, message: '登录成功' };
    },

    updateStreak(username) {
        const user = this.getUserData(username);
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.progress.lastStudyDate;

        if (lastDate === today) {
            return;
        }

        let newStreak = user.progress.streak || 0;
        if (lastDate) {
            const last = new Date(lastDate);
            const now = new Date(today);
            const diff = Math.round((now - last) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        user.progress.lastStudyDate = today;
        user.progress.streak = newStreak;
        user.progress.todayXP = 0;
        user.progress.todayLessons = 0;
        user.stats.streak = newStreak;

        this.updateUserData(username, { progress: user.progress, stats: user.stats });
    },

    markLessonCompleted(username, lessonId) {
        const user = this.getUserData(username);
        if (!user) return;

        if (!user.progress.completedLessons.includes(lessonId)) {
            user.progress.completedLessons.push(lessonId);
            user.stats.completedLessons += 1;
            this.updateUserData(username, { progress: user.progress, stats: user.stats });
            return true;
        }
        return false;
    },

    addXP(username, amount) {
        const user = this.getUserData(username);
        if (!user) return 0;

        user.stats.totalXP += amount;
        user.progress.todayXP = (user.progress.todayXP || 0) + amount;

        const newLevel = Math.floor(user.stats.totalXP / 500) + 1;
        const leveledUp = newLevel > user.stats.level;
        user.stats.level = newLevel;

        const dayOfWeek = new Date().getDay();
        user.stats.weeklyXP[dayOfWeek] = (user.stats.weeklyXP[dayOfWeek] || 0) + amount;

        this.updateUserData(username, { progress: user.progress, stats: user.stats });

        return { newXP: user.stats.totalXP, leveledUp, newLevel };
    },

    incrementStat(username, statKey, amount = 1) {
        const user = this.getUserData(username);
        if (!user) return;

        if (user.stats[statKey] !== undefined) {
            user.stats[statKey] += amount;
            this.updateUserData(username, { stats: user.stats });
        }
    },

    checkAchievements(username) {
        const user = this.getUserData(username);
        if (!user) return [];

        const newlyUnlocked = [];
        COURSE_DATA.achievements.forEach(achievement => {
            if (!user.stats.unlockedAchievements.includes(achievement.id)) {
                if (achievement.condition(user.stats)) {
                    user.stats.unlockedAchievements.push(achievement.id);
                    newlyUnlocked.push(achievement);
                }
            }
        });

        if (newlyUnlocked.length > 0) {
            this.updateUserData(username, { stats: user.stats });
        }

        return newlyUnlocked;
    },

    getPosts() {
        const data = localStorage.getItem(this.KEY_POSTS);
        if (data) {
            return JSON.parse(data);
        }
        this.savePosts(COURSE_DATA.samplePosts);
        return COURSE_DATA.samplePosts;
    },

    savePosts(posts) {
        localStorage.setItem(this.KEY_POSTS, JSON.stringify(posts));
    },

    addPost(post) {
        const posts = this.getPosts();
        posts.unshift(post);
        this.savePosts(posts);
        return posts;
    },

    likePost(postId, username) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            const likeKey = `liked_${username}_${postId}`;
            const alreadyLiked = localStorage.getItem(likeKey);
            if (!alreadyLiked) {
                post.likes = (post.likes || 0) + 1;
                localStorage.setItem(likeKey, 'true');
                this.savePosts(posts);
                return { liked: true, likes: post.likes };
            }
        }
        return { liked: false, likes: post ? post.likes : 0 };
    }
};
