/**
 * 学智云学习平台 - 导航栏组件
 */

const NavbarComponent = {
    /**
     * 初始化导航栏
     */
    init() {
        // 导航项点击事件
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = item.getAttribute('data-route');
                Router.navigate(route);
            });
        });

        // 快速入口点击事件
        const quickLinks = document.querySelectorAll('.quick-link');
        quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // 允许默认行为（hash导航）
            });
        });

        // 用户信息点击事件
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.addEventListener('click', () => {
                if (Auth.isLoggedIn()) {
                    Router.navigate('profile');
                } else {
                    App.showLoginModal();
                }
            });
        }

        // 移动端：添加菜单切换按钮
        this.initMobileMenu();
    },

    /**
     * 初始化移动端菜单
     */
    initMobileMenu() {
        if (Helpers.isMobile()) {
            // 在移动端，侧边栏作为抽屉式菜单
            // 添加汉堡菜单按钮（如果不存在）
            const navbar = document.querySelector('.navbar');
            const menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="el-icon-menu"></i>';
            menuToggle.style.cssText = `
                padding: 8px;
                background: transparent;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
            `;

            // 插入到navbar brand后面
            const navbarBrand = document.querySelector('.navbar-brand');
            if (navbarBrand && !document.querySelector('.menu-toggle')) {
                navbarBrand.insertBefore(menuToggle, navbarBrand.firstChild);

                // 点击事件
                menuToggle.addEventListener('click', () => {
                    App.toggleSidebar();
                });
            }
        }
    },

    /**
     * 更新导航状态
     * @param {string} activeRoute - 当前激活的路由
     */
    updateActive(activeRoute) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const route = item.getAttribute('data-route');
            if (route === activeRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

// 导出NavbarComponent对象
window.NavbarComponent = NavbarComponent;