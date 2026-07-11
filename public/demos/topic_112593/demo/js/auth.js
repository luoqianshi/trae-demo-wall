/* ==================== 账户管理（匿名登录） ==================== */
const Auth = {
    USER_KEY: 'mingchen_user',

    // 获取当前用户（如果不存在则自动创建匿名用户）
    getUser() {
        try {
            const data = localStorage.getItem(this.USER_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取用户信息失败:', e);
        }
        // 首次使用，自动创建匿名用户
        return this.createAnonymousUser();
    },

    // 创建匿名用户
    createAnonymousUser() {
        const user = {
            id: this.generateUserId(),
            type: 'anonymous',
            name: '射手_' + this.generateShortId(),
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };
        this.saveUser(user);
        console.log('[Auth] 匿名用户已创建:', user.name);
        return user;
    },

    // 保存用户信息
    saveUser(user) {
        try {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('保存用户信息失败:', e);
        }
    },

    // 更新最后登录时间
    updateLoginTime() {
        const user = this.getUser();
        user.lastLoginAt = new Date().toISOString();
        this.saveUser(user);
    },

    // 获取用户ID
    getUserId() {
        return this.getUser().id;
    },

    // 获取用户显示名
    getUserName() {
        return this.getUser().name;
    },

    // 是否已登录
    isLoggedIn() {
        return !!localStorage.getItem(this.USER_KEY);
    },

    // 退出登录（清除用户信息和历史记录）
    logout() {
        localStorage.removeItem(this.USER_KEY);
        // 注意：不删除历史记录，保留数据
        console.log('[Auth] 用户已退出');
    },

    // 生成用户ID
    generateUserId() {
        return 'mc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 生成短ID（用于显示名）
    generateShortId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
};
