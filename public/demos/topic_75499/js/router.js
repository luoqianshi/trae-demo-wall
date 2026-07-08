/**
 * 学智云学习平台 - 路由管理
 * 使用hash路由实现单页应用页面切换
 */

const Router = {
    // 当前路由
    currentRoute: 'home',

    // 路由配置
    routes: {
        home: {
            title: '首页',
            render: () => HomeComponent.render(),
            init: () => HomeComponent.initProgressChart()
        },
        practice: {
            title: '题库练习',
            render: () => PracticeComponent.render(),
            init: () => PracticeComponent.startTimer()
        },
        courses: {
            title: '视频课程',
            render: () => CoursesComponent.render(),
            init: () => CoursesComponent.init()
        },
        'ai-tutor': {
            title: 'AI辅导',
            render: () => AiTutorComponent.render()
        },
        report: {
            title: '学习报告',
            render: () => ReportComponent.render(),
            init: () => ReportComponent.initCharts()
        },
        profile: {
            title: '个人中心',
            render: () => ProfileComponent.render()
        },
        mistakes: {
            title: '错题本',
            render: () => ProfileComponent.renderMistakes()
        },
        history: {
            title: '学习历史',
            render: () => ProfileComponent.renderHistory()
        },
        parent: {
            title: '家长端',
            render: () => ParentComponent.render()
        },
        teacher: {
            title: '教师端',
            render: () => TeacherComponent.render()
        },
        login: {
            title: '登录',
            render: () => LoginComponent.render()
        },
        register: {
            title: '注册',
            render: () => RegisterComponent.render()
        },
        '404': {
            title: '页面未找到',
            render: () => `
                <div class="error-page">
                    <div class="error-404">
                        <i class="el-icon-warning" style="font-size: 96px; color: var(--text-light);"></i>
                        <h2>404</h2>
                        <p>页面未找到</p>
                        <p>您访问的页面不存在或已被删除</p>
                        <button class="action-btn submit-btn" onclick="Router.navigate('home')">返回首页</button>
                    </div>
                </div>
            `
        }
    },

    /**
     * 初始化路由系统
     */
    init() {
        // 监听hash变化
        window.addEventListener('hashchange', this.handleHashChange.bind(this));

        // 处理初始hash
        this.handleHashChange();
    },

    /**
     * 处理hash变化
     */
    handleHashChange() {
        // 获取hash值
        const hash = window.location.hash.slice(1) || 'home';
        const route = hash.replace('/', '');

        // 检查路由是否存在
        if (!this.routes[route]) {
            this.currentRoute = '404';
            this.updateNavigation();
            this.renderPage();
            document.title = `页面未找到 - 学智云学习平台`;
            Helpers.scrollToTop();
            return;
        }

        // 检查权限
        if (!Auth.checkPermission(route)) {
            Helpers.showMessage('您没有权限访问该页面，请先登录', 'warning');
            this.navigate('login');
            return;
        }

        // 更新当前路由
        this.currentRoute = route;

        // 更新导航栏激活状态
        this.updateNavigation();

        // 渲染页面
        this.renderPage();

        // 更新页面标题
        document.title = `${this.routes[route].title} - 学智云学习平台`;

        // 滚动到顶部
        Helpers.scrollToTop();
    },

    /**
     * 导航到指定路由
     * @param {string} route - 路由名称
     */
    navigate(route) {
        window.location.hash = route;
    },

    /**
     * 渲染当前页面
     */
    renderPage() {
        const mainContent = document.getElementById('main-content');
        const routeConfig = this.routes[this.currentRoute];

        if (routeConfig && routeConfig.render) {
            try {
                const html = routeConfig.render();
                mainContent.innerHTML = html;

                // 执行页面初始化函数（如果存在）
                if (routeConfig.init) {
                    routeConfig.init();
                }
            } catch (error) {
                console.error(`Error rendering page ${this.currentRoute}:`, error);
                mainContent.innerHTML = `<div class="error-page"><h2>页面加载失败</h2><p>请刷新页面重试</p></div>`;
            }
        }
    },

    /**
     * 更新导航栏激活状态
     */
    updateNavigation() {
        // 更新顶部导航栏
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const itemRoute = item.getAttribute('data-route');
            if (itemRoute === this.currentRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 更新侧边栏快速入口
        const quickLinks = document.querySelectorAll('.quick-link');
        quickLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkRoute = href.slice(2); // 去掉 "#/"
            if (linkRoute === this.currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * 获取当前路由参数
     * @returns {object} 参数对象
     */
    getParams() {
        const hash = window.location.hash.slice(1);
        const params = {};
        const queryStart = hash.indexOf('?');

        if (queryStart !== -1) {
            const queryString = hash.slice(queryStart + 1);
            const pairs = queryString.split('&');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value || '');
            });
        }

        return params;
    },

    /**
     * 设置路由参数
     * @param {object} params - 参数对象
     */
    setParams(params) {
        const currentHash = window.location.hash.slice(1);
        const routePart = currentHash.split('?')[0];
        const paramString = Helpers.buildUrlParams(params);

        window.location.hash = routePart + '?' + paramString;
    },

    /**
     * 返回上一页（浏览器历史）
     */
    back() {
        window.history.back();
    },

    /**
     * 前进到下一页（浏览器历史）
     */
    forward() {
        window.history.forward();
    },

    /**
     * 刷新当前页面（重新渲染）
     */
    refresh() {
        this.renderPage();
    }
};

// 导出Router对象（兼容模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
} else {
    window.Router = Router;
}