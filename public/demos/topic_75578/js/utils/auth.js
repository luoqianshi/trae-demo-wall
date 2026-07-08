/**
 * 学智云学习平台 - 认证工具
 */

const Auth = {
    /**
     * 模拟用户数据库（本地存储）
     */
    mockUsers: [
        {
            id: 'user-student-001',
            phone: '13800138001',
            email: 'student@example.com',
            password: '123456',
            name: '小明',
            role: 'student',
            grade: 3,
            avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小男孩卡通头像，蓝色背景&image_size=square',
            createdAt: '2026-01-01'
        },
        {
            id: 'user-student-002',
            phone: '13800138002',
            email: 'student2@example.com',
            password: '123456',
            name: '小红',
            role: 'student',
            grade: 5,
            avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=小女孩卡通头像，粉色背景&image_size=square',
            createdAt: '2026-02-01'
        },
        {
            id: 'user-parent-001',
            phone: '13900139001',
            email: 'parent@example.com',
            password: '123456',
            name: '小明爸爸',
            role: 'parent',
            childrenIds: ['user-student-001'],
            avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=中年男性头像，商务风格，灰色背景&image_size=square',
            createdAt: '2026-01-01'
        },
        {
            id: 'user-teacher-001',
            phone: '13700137001',
            email: 'teacher@example.com',
            password: '123456',
            name: '张老师',
            role: 'teacher',
            subject: 'math',
            school: '实验中学',
            avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=教师头像，专业形象，青色背景&image_size=square',
            createdAt: '2026-01-01'
        }
    ],

    /**
     * 初始化认证系统
     */
    init() {
        const DATA_VERSION = '3.0';
        const savedVersion = Storage.get('data_version');

        if (savedVersion !== DATA_VERSION) {
            const existingUsers = Storage.get('users') || [];
            
            const mockUserPhones = this.mockUsers.map(u => u.phone);
            const newMockUsers = this.mockUsers.filter(u => 
                !existingUsers.some(eu => eu.phone === u.phone)
            );

            const mergedUsers = [...existingUsers, ...newMockUsers];
            Storage.set('users', mergedUsers);
            Storage.set('data_version', DATA_VERSION);
        } else {
            const savedUsers = Storage.get('users');
            if (!savedUsers || savedUsers.length === 0) {
                Storage.set('users', this.mockUsers);
            }
        }

        const currentUser = Storage.getUser();
        if (currentUser) {
            this.updateUI(currentUser);
        }
    },

    /**
     * 用户登录
     * @param {object} credentials - 登录信息
     * @returns {object} 登录结果
     */
    login(credentials) {
        const { phone, password, role, captcha } = credentials;
        const users = Storage.get('users') || [];

        // 查找匹配的用户
        const user = users.find(u => {
            const matchPhone = u.phone === phone || u.email === phone;
            const matchPassword = u.password === password;
            const matchRole = u.role === role;
            return matchPhone && matchPassword && matchRole;
        });

        if (user) {
            // 检查用户是否在黑名单中（白名单用户不受限制）
            if (!this.checkWhitelist(user.id)) {
                const banInfo = this.checkBlacklist(user.id);
                if (banInfo) {
                    let message = '您的账号已被封禁';
                    if (banInfo.reason) {
                        message += '，原因：' + banInfo.reason;
                    }
                    if (banInfo.banEndTime) {
                        const remainingTime = Math.ceil((new Date(banInfo.banEndTime).getTime() - Date.now()) / 60000);
                        message += `，剩余封禁时间：${remainingTime}分钟`;
                    }
                    return {
                        success: false,
                        message,
                        banned: true,
                        banEndTime: banInfo.banEndTime,
                        reason: banInfo.reason
                    };
                }
            }

            // 登录成功，保存用户信息
            Storage.setUser({
                ...user,
                loginTime: new Date().toISOString()
            });

            // 记录登录日志
            this.logLogin(user.id);

            // 更新UI
            this.updateUI(user);

            return {
                success: true,
                message: '登录成功',
                user
            };
        } else {
            return {
                success: false,
                message: '账号或密码错误，请重试'
            };
        }
    },

    /**
     * 用户注册
     * @param {object} userData - 注册信息
     * @returns {object} 注册结果
     */
    register(userData) {
        const { phone, email, password, name, role } = userData;
        const users = Storage.get('users') || [];

        // 检查手机号是否已存在
        if (users.some(u => u.phone === phone)) {
            return {
                success: false,
                message: '该手机号已被注册'
            };
        }

        // 检查邮箱是否已存在
        if (email && users.some(u => u.email === email)) {
            return {
                success: false,
                message: '该邮箱已被注册'
            };
        }

        // 创建新用户
        const newUser = {
            id: Helpers.generateId(),
            phone,
            email: email || '',
            password,
            name,
            role,
            avatar: this.getDefaultAvatar(role),
            createdAt: new Date().toISOString()
        };

        // 根据角色添加额外信息
        if (role === 'student') {
            newUser.grade = 1; // 默认一年级
        } else if (role === 'teacher') {
            newUser.subject = 'math'; // 默认数学
            newUser.school = '';
        } else if (role === 'parent') {
            newUser.childrenIds = [];
        }

        // 保存新用户
        users.push(newUser);
        Storage.set('users', users);

        // 自动登录新用户
        Storage.setUser({
            ...newUser,
            loginTime: new Date().toISOString()
        });

        // 更新UI
        this.updateUI(newUser);

        return {
            success: true,
            message: '注册成功',
            user: newUser
        };
    },

    /**
     * 用户退出登录
     */
    logout() {
        // 清除用户信息
        Storage.clearUser();

        // 更新UI
        this.updateUI(null);

        // 跳转到首页
        Router.navigate('home');

        Helpers.showMessage('退出登录成功', 'success');
    },

    /**
     * 检查用户是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return Storage.getUser() !== null;
    },

    /**
     * 获取当前用户信息
     * @returns {object|null} 用户信息
     */
    getCurrentUser() {
        return Storage.getUser();
    },

    /**
     * 获取当前用户角色
     * @returns {string|null} 用户角色（student/parent/teacher）
     */
    getCurrentRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    /**
     * 更新用户信息
     * @param {object} updates - 要更新的信息
     * @returns {object} 更新结果
     */
    updateUser(updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                message: '用户未登录'
            };
        }

        // 更新本地存储中的用户列表
        const users = Storage.get('users') || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            Storage.set('users', users);
        }

        // 更新当前用户信息
        const updatedUser = { ...currentUser, ...updates };
        Storage.setUser(updatedUser);

        // 更新UI
        this.updateUI(updatedUser);

        return {
            success: true,
            message: '更新成功',
            user: updatedUser
        };
    },

    /**
     * 更新UI显示
     * @param {object|null} user - 用户信息
     */
    updateUI(user) {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (user) {
            // 已登录状态
            userInfo.querySelector('.username').textContent = user.name;
            userInfo.querySelector('.avatar').src = user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=用户头像图标，简约风格，绿色背景&image_size=square';
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            // 未登录状态
            userInfo.querySelector('.username').textContent = '未登录';
            userInfo.querySelector('.avatar').src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=用户头像图标，简约风格，绿色背景&image_size=square';
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
        }
    },

    /**
     * 获取默认头像
     * @param {string} role - 用户角色
     * @returns {string} 头像路径
     */
    getDefaultAvatar(role) {
        const avatarMap = {
            student: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=学生头像，简约风格，蓝色背景&image_size=square',
            parent: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=家长头像，简约风格，灰色背景&image_size=square',
            teacher: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=教师头像，专业形象，青色背景&image_size=square'
        };
        return avatarMap[role] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=用户头像图标，简约风格，绿色背景&image_size=square';
    },

    /**
     * 记录登录日志
     * @param {string} userId - 用户ID
     */
    logLogin(userId) {
        const loginLogs = Storage.get('login_logs') || [];
        loginLogs.unshift({
            userId,
            loginTime: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        // 只保留最近50条登录日志
        if (loginLogs.length > 50) {
            loginLogs.splice(50);
        }
        Storage.set('login_logs', loginLogs);
    },

    /**
     * 检查权限（是否允许访问某个页面）
     * @param {string} page - 页面名称
     * @returns {boolean} 是否有权限
     */
    checkPermission(page) {
        const role = this.getCurrentRole();

        // 公共页面，所有人可访问
        const publicPages = ['home', 'courses', 'login', 'register'];
        if (publicPages.includes(page)) {
            return true;
        }

        // 学生专属页面
        const studentPages = ['practice', 'ai-tutor', 'report', 'profile', 'mistakes', 'history'];
        if (role === 'student' && studentPages.includes(page)) {
            return true;
        }

        // 家长专属页面
        const parentPages = ['parent', 'profile'];
        if (role === 'parent' && parentPages.includes(page)) {
            return true;
        }

        // 教师专属页面
        const teacherPages = ['teacher', 'profile'];
        if (role === 'teacher' && teacherPages.includes(page)) {
            return true;
        }

        return false;
    },

    /**
     * 绑定学生账号（家长角色）
     * @param {string} studentPhone - 学生手机号
     * @returns {object} 绑定结果
     */
    bindStudent(studentPhone) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'parent') {
            return {
                success: false,
                message: '只有家长账号可以绑定学生'
            };
        }

        const users = Storage.get('users') || [];
        const student = users.find(u => u.phone === studentPhone && u.role === 'student');

        if (!student) {
            return {
                success: false,
                message: '找不到该学生账号'
            };
        }

        // 检查是否已经绑定
        if (currentUser.childrenIds && currentUser.childrenIds.includes(student.id)) {
            return {
                success: false,
                message: '该学生已经绑定'
            };
        }

        // 添加绑定关系
        const updatedChildrenIds = currentUser.childrenIds || [];
        updatedChildrenIds.push(student.id);

        // 更新家长信息
        const result = this.updateUser({ childrenIds: updatedChildrenIds });

        if (result.success) {
            return {
                success: true,
                message: '绑定成功',
                student
            };
        } else {
            return result;
        }
    },

    /**
     * 获取绑定的学生列表（家长角色）
     * @returns {array} 学生列表
     */
    getBindStudents() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'parent') {
            return [];
        }

        const users = Storage.get('users') || [];
        const studentIds = currentUser.childrenIds || [];

        return users.filter(u => studentIds.includes(u.id));
    },

    /**
     * 重置密码
     * @param {object} resetData - 重置信息
     * @returns {object} 重置结果
     */
    resetPassword(resetData) {
        const { phone, newPassword } = resetData;
        const users = Storage.get('users') || [];

        const userIndex = users.findIndex(u => u.phone === phone);
        if (userIndex === -1) {
            return {
                success: false,
                message: '找不到该用户'
            };
        }

        users[userIndex].password = newPassword;
        Storage.set('users', users);

        return {
            success: true,
            message: '密码重置成功'
        };
    },

    /**
     * 生成验证码
     * @param {number} length - 验证码长度，默认4位
     * @returns {string} 验证码
     */
    generateCaptcha(length = 4) {
        const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < length; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        Storage.set('captcha', {
            code: captcha,
            timestamp: Date.now(),
            expires: Date.now() + 5 * 60 * 1000 // 5分钟过期
        });
        return captcha;
    },

    /**
     * 验证验证码
     * @param {string} code - 用户输入的验证码
     * @returns {boolean} 是否有效
     */
    validateCaptcha(code) {
        const captchaData = Storage.get('captcha');
        if (!captchaData) {
            return false;
        }
        // 检查是否过期
        if (Date.now() > captchaData.expires) {
            Storage.remove('captcha');
            return false;
        }
        // 检查验证码是否匹配
        const isValid = captchaData.code.toUpperCase() === code.toUpperCase();
        if (isValid) {
            Storage.remove('captcha');
        }
        return isValid;
    },

    /**
     * 检查用户是否在黑名单中
     * @param {string} userId - 用户ID
     * @returns {object|null} 封禁信息
     */
    checkBlacklist(userId) {
        const blacklist = Storage.get('blacklist') || [];
        const entry = blacklist.find(item => item.userId === userId);
        
        if (entry) {
            // 检查封禁是否已过期
            if (entry.banEndTime && Date.now() > new Date(entry.banEndTime).getTime()) {
                // 封禁已过期，移除黑名单
                this.removeFromBlacklist(userId);
                return null;
            }
            return entry;
        }
        return null;
    },

    /**
     * 将用户加入黑名单
     * @param {string} userId - 用户ID
     * @param {number} duration - 封禁时长（分钟），0表示永久封禁
     * @param {string} reason - 封禁原因
     * @returns {object} 操作结果
     */
    addToBlacklist(userId, duration = 0, reason = '') {
        const blacklist = Storage.get('blacklist') || [];
        
        // 检查是否已在黑名单中
        const existingIndex = blacklist.findIndex(item => item.userId === userId);
        if (existingIndex !== -1) {
            // 更新封禁信息
            blacklist[existingIndex] = {
                ...blacklist[existingIndex],
                duration,
                reason,
                banStartTime: new Date().toISOString(),
                banEndTime: duration > 0 ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null,
                updatedAt: new Date().toISOString()
            };
        } else {
            // 添加新条目
            blacklist.push({
                userId,
                duration,
                reason,
                banStartTime: new Date().toISOString(),
                banEndTime: duration > 0 ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        Storage.set('blacklist', blacklist);
        return {
            success: true,
            message: '用户已被封禁'
        };
    },

    /**
     * 将用户移出黑名单
     * @param {string} userId - 用户ID
     * @returns {object} 操作结果
     */
    removeFromBlacklist(userId) {
        let blacklist = Storage.get('blacklist') || [];
        blacklist = blacklist.filter(item => item.userId !== userId);
        Storage.set('blacklist', blacklist);
        return {
            success: true,
            message: '用户已被解封'
        };
    },

    /**
     * 检查用户是否在白名单中
     * @param {string} userId - 用户ID
     * @returns {boolean} 是否在白名单中
     */
    checkWhitelist(userId) {
        const whitelist = Storage.get('whitelist') || [];
        return whitelist.includes(userId);
    },

    /**
     * 将用户加入白名单
     * @param {string} userId - 用户ID
     * @returns {object} 操作结果
     */
    addToWhitelist(userId) {
        let whitelist = Storage.get('whitelist') || [];
        if (!whitelist.includes(userId)) {
            whitelist.push(userId);
            Storage.set('whitelist', whitelist);
        }
        return {
            success: true,
            message: '用户已加入白名单'
        };
    },

    /**
     * 将用户移出白名单
     * @param {string} userId - 用户ID
     * @returns {object} 操作结果
     */
    removeFromWhitelist(userId) {
        let whitelist = Storage.get('whitelist') || [];
        whitelist = whitelist.filter(id => id !== userId);
        Storage.set('whitelist', whitelist);
        return {
            success: true,
            message: '用户已移出白名单'
        };
    },

    /**
     * 提交解封申诉
     * @param {string} userId - 用户ID
     * @param {string} reason - 申诉理由
     * @returns {object} 操作结果
     */
    submitAppeal(userId, reason) {
        const appeals = Storage.get('appeals') || [];
        appeals.push({
            id: Helpers.generateId(),
            userId,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        Storage.set('appeals', appeals);
        return {
            success: true,
            message: '申诉已提交，管理员将尽快处理'
        };
    },

    /**
     * 获取所有申诉
     * @returns {array} 申诉列表
     */
    getAppeals() {
        return Storage.get('appeals') || [];
    },

    /**
     * 处理申诉
     * @param {string} appealId - 申诉ID
     * @param {string} status - 处理结果（approved/rejected）
     * @returns {object} 操作结果
     */
    handleAppeal(appealId, status) {
        const appeals = Storage.get('appeals') || [];
        const appealIndex = appeals.findIndex(a => a.id === appealId);
        
        if (appealIndex === -1) {
            return {
                success: false,
                message: '找不到该申诉'
            };
        }
        
        appeals[appealIndex].status = status;
        appeals[appealIndex].processedAt = new Date().toISOString();
        Storage.set('appeals', appeals);
        
        // 如果通过申诉，解封用户
        if (status === 'approved') {
            this.removeFromBlacklist(appeals[appealIndex].userId);
        }
        
        return {
            success: true,
            message: '申诉已处理'
        };
    }
};

// 导出Auth对象（兼容模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
} else {
    window.Auth = Auth;
}