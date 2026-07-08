/**
 * 学智云学习平台 - 主应用入口
 */

// 应用主对象
const App = {
    /**
     * 应用状态
     */
    state: {
        initialized: false,
        currentGrade: 1,
        currentSubject: 'math',
        sidebarOpen: false
    },

    /**
     * 初始化应用
     */
    init() {
        try {
            // 1. 初始化数据
            this.initData();

            // 2. 初始化认证系统
            Auth.init();

            // 3. 初始化路由系统
            Router.init();

            // 4. 初始化导航栏
            NavbarComponent.init();

            // 5. 初始化侧边栏
            this.initSidebar();

            // 6. 初始化全局事件监听
            this.initEventListeners();

            // 7. 加载用户设置
            this.loadUserSettings();

            // 8. 更新侧边栏统计
            this.updateSidebarStats();

            // 标记初始化完成
            this.state.initialized = true;

            // 显示欢迎消息（如果是首次使用）
            if (!Storage.get('visited')) {
                Helpers.showMessage('欢迎使用学智云学习平台！', 'success');
                Storage.set('visited', true);
            }
        } catch (error) {
            Helpers.showMessage('应用初始化失败，请刷新页面', 'error');
        }
    },

    /**
     * 初始化数据
     */
    initData() {
        // 初始化API数据
        API.initData();

        // 加载当前年级和科目
        this.state.currentGrade = Storage.getCurrentGrade();
        this.state.currentSubject = Storage.getCurrentSubject();
    },

    /**
     * 初始化侧边栏
     */
    initSidebar() {
        const gradeButtons = document.querySelectorAll('.grade-btn');

        // 设置当前年级激活状态
        gradeButtons.forEach(btn => {
            const grade = parseInt(btn.getAttribute('data-grade'));
            if (grade === this.state.currentGrade) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            // 添加点击事件
            btn.addEventListener('click', () => {
                this.selectGrade(grade);
            });
        });
    },

    /**
     * 初始化全局事件监听
     */
    initEventListeners() {
        // 登录按钮点击事件
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.addEventListener('click', () => {
            this.showLoginModal();
        });

        // 退出登录按钮点击事件
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        // 登录表单提交事件
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 监听窗口大小变化
        window.addEventListener('resize', Helpers.debounce(() => {
            this.handleWindowResize();
        }, 300));

        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    },

    /**
     * 加载用户设置
     */
    loadUserSettings() {
        const settings = Storage.getUserSettings();

        // 应用主题
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // 其他设置...
    },

    /**
     * 选择年级
     * @param {number} grade - 年级数字
     */
    selectGrade(grade) {
        this.state.currentGrade = grade;
        Storage.setCurrentGrade(grade);

        // 更新侧边栏按钮状态
        const gradeButtons = document.querySelectorAll('.grade-btn');
        gradeButtons.forEach(btn => {
            const btnGrade = parseInt(btn.getAttribute('data-grade'));
            if (btnGrade === grade) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        Helpers.showMessage(`已切换到${Helpers.getGradeName(grade)}`, 'success');

        // 刷新当前页面数据
        Router.refresh();
    },

    /**
     * 显示登录模态框
     */
    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        loginModal.classList.remove('hidden');
    },

    /**
     * 关闭登录模态框
     */
    closeLoginModal() {
        const loginModal = document.getElementById('loginModal');
        loginModal.classList.add('hidden');
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        // 验证输入
        if (!phone || !password) {
            Helpers.showMessage('请填写完整的登录信息', 'warning');
            return;
        }

        // 执行登录
        const result = Auth.login({ phone, password, role });

        if (result.success) {
            Helpers.showMessage('登录成功！', 'success');
            this.closeLoginModal();
            Router.navigate('home');
        } else {
            Helpers.showMessage(result.message, 'error');
        }
    },

    /**
     * 退出登录
     */
    logout() {
        const confirmLogout = confirm('确定要退出登录吗？');
        if (confirmLogout) {
            Auth.logout();
        }
    },

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        // 移动端侧边栏处理
        if (window.innerWidth < 768) {
            if (this.state.sidebarOpen) {
                document.getElementById('sidebar').classList.add('open');
            } else {
                document.getElementById('sidebar').classList.remove('open');
            }
        } else {
            // 桌面端移除open类
            document.getElementById('sidebar').classList.remove('open');
        }

        // 重新调整图表大小（如果存在）
        if (typeof echarts !== 'undefined') {
            echarts.getInstanceByDom && setTimeout(() => {
                const charts = document.querySelectorAll('[id^="Chart"]');
                charts.forEach(chartDom => {
                    const chartInstance = echarts.getInstanceByDom(chartDom);
                    if (chartInstance) {
                        chartInstance.resize();
                    }
                });
            }, 100);
        }
    },

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyPress(e) {
        // Ctrl/Cmd + 数字 快速导航
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    Router.navigate('home');
                    break;
                case '2':
                    Router.navigate('practice');
                    break;
                case '3':
                    Router.navigate('courses');
                    break;
                case '4':
                    Router.navigate('ai-tutor');
                    break;
                case '5':
                    Router.navigate('report');
                    break;
            }
        }

        // ESC键关闭模态框
        if (e.key === 'Escape') {
            this.closeLoginModal();
            // 关闭其他模态框
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => modal.classList.add('hidden'));
        }
    },

    /**
     * 更新侧边栏统计信息
     */
    updateSidebarStats() {
        const todayStats = Storage.getTodayStats();

        // 更新今日学习时长
        const todayTimeEl = document.getElementById('todayTime');
        if (todayTimeEl) {
            todayTimeEl.textContent = Helpers.formatTime(todayStats.totalTime);
        }

        // 更新今日完成题目数
        const todayQuestionsEl = document.getElementById('todayQuestions');
        if (todayQuestionsEl) {
            todayQuestionsEl.textContent = `${todayStats.totalQuestions}题`;
        }

        // 更新今日正确率
        const todayAccuracyEl = document.getElementById('todayAccuracy');
        if (todayAccuracyEl) {
            todayAccuracyEl.textContent = `${todayStats.accuracy}%`;
        }
    },

    /**
     * 切换侧边栏（移动端）
     */
    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
        const sidebar = document.getElementById('sidebar');

        if (this.state.sidebarOpen) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
        }
    },

    /**
     * 检查应用是否初始化完成
     * @returns {boolean} 是否已初始化
     */
    isInitialized() {
        return this.state.initialized;
    },

    /**
     * 获取应用版本
     * @returns {string} 版本号
     */
    getVersion() {
        return '1.6.0';
    }
};

// 全局函数：关闭登录模态框（供HTML调用）
function closeLoginModal() {
    App.closeLoginModal();
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出App对象
window.App = App;