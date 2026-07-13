/* ============================================ */
/* app.js - 主应用入口                          */
/* 作用：App的"总指挥"，负责初始化和Tab切换       */
/* 小白理解：这是App的大脑，指挥各模块工作        */
/* ============================================ */

/**
 * App 对象：全局应用状态和方法
 */
window.App = {
    currentTab: 'home',  // 当前激活的 Tab

    /**
     * App 初始化（页面加载完成后自动执行）
     * 小白理解：App 启动时第一件做的事
     */
    init() {
        console.log('🚀 旅简 TravelEasy 启动中...');

        try {
            // 1. 绑定 Tab 切换事件
            this.bindTabEvents();

            // 1.5 绑定 Tab 左右滑动切换手势（创新点）
            this.bindTabSwipe();

            // 2. 绑定顶部按钮事件
            this.bindHeaderEvents();

            // 3. 绑定弹窗关闭事件（点击遮罩关闭）
            this.bindModalEvents();

            // 4. 加载用户设置（字体大小、深色模式等）
            this.loadSettings();

            // 5. 初始化各模块（每个模块都有自己的 init 方法）
            this.initModules();

            // 5.5 创建浮动按钮 FAB（创新点）
            this.createFab();

            // 5.6 初始化顶部栏主题色
            Utils.switchTab(this.currentTab);

            // 5.7 更新 Tab 角标（行程数量提醒）
            this.updateTabBadge();

            // 5.8 启动旅程检查（弹窗引导/恢复进行中旅程）
            if (typeof Journey !== 'undefined' && Journey.init) {
                Journey.init();
            }

            // 5.9 检查出发提醒（创新点：明天出发则发浏览器通知）
            this.checkDepartureReminder();

            // 6. 检查是否需要显示新手引导
            this.checkFirstVisit();

            // 7. 注册 Service Worker（PWA 离线支持）
            this.registerSW();

            console.log('✅ 旅简 TravelEasy 启动完成！');
        } catch (e) {
            console.error('❌ App 启动失败:', e);
            this.showError(e);
        }
    },

    /**
     * 显示启动错误（给用户一个友好的提示，而不是一直加载中）
     */
    showError(error) {
        // 给所有 Tab 页面显示错误信息
        document.querySelectorAll('.tab-inner').forEach(el => {
            el.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin-bottom: 8px;">App 初始化失败</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">${error.message || '未知错误'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">刷新重试</button>
                </div>
            `;
        });
    },

    /**
     * 注册 Service Worker
     * 小白理解：让App支持离线使用，断网也能打开
     * 注意：file:// 协议下不生效，需要通过 http 访问
     */
    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('📦 Service Worker 注册成功'))
                .catch(err => console.log('Service Worker 注册失败:', err));
        }
    },

    /**
     * 绑定底部 Tab 切换事件
     * 小白理解：点击底部的"首页/美食/出行/行程/智小程"时切换页面
     */
    bindTabEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                Utils.vibrate(8);  // 点击振动反馈
                Utils.switchTab(tabName);

                // 切换到某个 Tab 时，调用该模块的 onShow 方法（如果有）
                // 小白理解：每次切到一个页面，让那个页面知道"我被打开了"
                const module = this.getModule(tabName);
                if (module && typeof module.onShow === 'function') {
                    module.onShow();
                }
            });
        });
    },

    /**
     * 绑定 Tab 之间左右滑动手势切换（创新点）
     * 小白理解：在页面上左右滑动手指，就能切换到上一个/下一个 Tab
     *           不用专门去点底部的按钮，更方便
     */
    bindTabSwipe() {
        const content = document.querySelector('.app-content');
        if (!content) return;

        const tabs = ['home', 'food', 'travel', 'trip', 'ai'];  // Tab顺序
        let startX = 0;
        let startY = 0;
        let isTracking = false;

        content.addEventListener('touchstart', (e) => {
            // 只用单指滑动
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isTracking = true;
        }, { passive: true });

        content.addEventListener('touchend', (e) => {
            if (!isTracking) return;
            isTracking = false;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - startX;   // 水平滑动距离
            const dy = endY - startY;   // 垂直滑动距离

            // 水平滑动距离要大于50px，且水平距离大于垂直距离（避免误触上下滚动）
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

            // 排除：在横向滑动容器内的滑动不触发Tab切换（避免与出行页日期滑动冲突）
            const target = e.target;
            if (target.closest('.day-slider') || target.closest('.horizontal-scroll')) {
                return;
            }

            const currentIdx = tabs.indexOf(this.currentTab);
            if (currentIdx === -1) return;

            let targetTab = null;
            if (dx > 0) {
                // 向右滑 → 上一个 Tab
                if (currentIdx > 0) targetTab = tabs[currentIdx - 1];
            } else {
                // 向左滑 → 下一个 Tab
                if (currentIdx < tabs.length - 1) targetTab = tabs[currentIdx + 1];
            }

            if (targetTab) {
                Utils.vibrate(10);
                Utils.switchTab(targetTab);
                const module = this.getModule(targetTab);
                if (module && typeof module.onShow === 'function') {
                    module.onShow();
                }
            }
        }, { passive: true });
    },

    /**
     * 更新行程 Tab 的角标数字（创新点：红色数字提醒）
     * 小白理解：你收藏了几个景点，行程按钮上就显示数字几
     */
    updateTabBadge() {
        const tripBtn = document.querySelector('.tab-btn[data-tab="trip"]');
        if (!tripBtn) return;

        const count = AppStorage.getTrip().length;
        // 先移除旧角标
        const oldBadge = tripBtn.querySelector('.tab-badge');
        if (oldBadge) oldBadge.remove();

        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.textContent = count > 99 ? '99+' : count;
            tripBtn.appendChild(badge);
        }
    },

    /**
     * 创建浮动按钮 FAB（创新点：右下角快捷操作入口）
     * 小白理解：页面右下角有个圆形+号按钮，点击展开快捷菜单
     */
    createFab() {
        // 创建FAB菜单
        const menu = document.createElement('div');
        menu.className = 'fab-menu';
        menu.id = 'fab-menu';
        menu.innerHTML = `
            <div class="fab-menu-item" onclick="App.fabAction('top')">
                <span>⬆️</span><span>回到顶部</span>
            </div>
            <div class="fab-menu-item" onclick="App.fabAction('search')">
                <span>🔍</span><span>快速搜索</span>
            </div>
            <div class="fab-menu-item" onclick="App.fabAction('ai')">
                <span>🤖</span><span>问智小程</span>
            </div>
        `;
        document.getElementById('app').appendChild(menu);

        // 创建FAB按钮
        const fab = document.createElement('div');
        fab.className = 'fab';
        fab.id = 'fab';
        fab.innerHTML = '✚';
        fab.addEventListener('click', () => {
            Utils.vibrate(8);
            this.toggleFabMenu();
        });
        document.getElementById('app').appendChild(fab);
    },

    /**
     * 切换FAB菜单显示/隐藏
     */
    toggleFabMenu() {
        const menu = document.getElementById('fab-menu');
        const fab = document.getElementById('fab');
        if (!menu || !fab) return;

        const isActive = menu.classList.contains('active');
        if (isActive) {
            menu.classList.remove('active');
            fab.innerHTML = '✚';
        } else {
            menu.classList.add('active');
            fab.innerHTML = '✕';
        }
    },

    /**
     * FAB快捷操作
     * 小白理解：点击FAB菜单里的选项后执行对应动作
     */
    fabAction(action) {
        this.toggleFabMenu();
        Utils.vibrate(8);
        switch (action) {
            case 'top':
                // 回到当前页面顶部
                const activePage = document.querySelector('.tab-page.active');
                if (activePage) activePage.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'search':
                // 切到首页并聚焦搜索框
                Utils.switchTab('home');
                setTimeout(() => {
                    const searchInput = document.querySelector('#home-content .search-box input');
                    if (searchInput) searchInput.focus();
                }, 300);
                break;
            case 'ai':
                // 切到智小程
                Utils.switchTab('ai');
                const aiModule = this.getModule('ai');
                if (aiModule && aiModule.onShow) aiModule.onShow();
                break;
        }
    },

    /**
     * 根据当前Tab更新FAB显示状态
     * 小白理解：在AI聊天页和出行输入页隐藏FAB，避免遮挡
     */
    updateFab(tabName) {
        const fab = document.getElementById('fab');
        const menu = document.getElementById('fab-menu');
        if (!fab) return;

        // AI页隐藏FAB（避免遮挡输入框）
        if (tabName === 'ai') {
            fab.classList.add('hidden');
            if (menu) menu.classList.remove('active');
        } else {
            fab.classList.remove('hidden');
        }
    },

    /**
     * 绑定下拉刷新（创新点：在列表页往下拉，松手后刷新数据）
     * 小白理解：手指从页面顶部往下拉，出现刷新提示，松手后重新加载数据
     * @param {string} tabName - 要绑定下拉刷新的Tab名
     * @param {Function} refreshFn - 刷新时执行的函数
     */
    bindPullRefresh(tabName, refreshFn) {
        const page = document.getElementById('tab-' + tabName);
        if (!page) return;

        // 创建下拉刷新指示器
        const indicator = document.createElement('div');
        indicator.className = 'pull-refresh-indicator';
        indicator.innerHTML = '<span class="refresh-icon">⬇️</span><span class="refresh-text">下拉刷新</span>';
        page.appendChild(indicator);

        let startY = 0;
        let pulling = false;

        page.addEventListener('touchstart', (e) => {
            // 只有滚动到顶部时才触发下拉刷新
            if (page.scrollTop <= 0 && e.touches.length === 1) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });

        page.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            // 下拉超过30px才显示指示器
            if (diff > 30) {
                indicator.classList.add('visible');
                // 用 top 调整位置（保持水平居中的 translateX）
                indicator.style.top = (50 + Math.min(diff, 80)) + 'px';
                const text = indicator.querySelector('.refresh-text');
                if (diff > 70) {
                    text.textContent = '松手刷新';
                } else {
                    text.textContent = '下拉刷新';
                }
            }
        }, { passive: true });

        page.addEventListener('touchend', (e) => {
            if (!pulling) return;
            pulling = false;
            const topVal = parseInt(indicator.style.top) || 50;
            const dist = topVal - 50;  // 实际下拉距离

            if (dist > 20) {
                // 触发刷新
                indicator.classList.add('refreshing');
                indicator.querySelector('.refresh-icon').textContent = '🔄';
                indicator.querySelector('.refresh-text').textContent = '刷新中...';

                setTimeout(() => {
                    if (typeof refreshFn === 'function') refreshFn();
                    indicator.classList.remove('visible', 'refreshing');
                    indicator.style.top = '';
                    indicator.querySelector('.refresh-icon').textContent = '⬇️';
                    Utils.toast('✓ 刷新成功');
                    Utils.vibrate(15);
                }, 800);
            } else {
                indicator.classList.remove('visible');
                indicator.style.top = '';
            }
        }, { passive: true });
    },

    /**
     * 绑定顶部按钮事件（历史记录、设置）
     */
    bindHeaderEvents() {
        // 历史记录按钮
        const btnHistory = document.getElementById('btn-history');
        if (btnHistory) {
            btnHistory.addEventListener('click', () => {
                if (typeof Settings !== 'undefined' && Settings.showHistory) {
                    Settings.showHistory();
                }
            });
        }

        // 设置按钮
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                if (typeof Settings !== 'undefined' && Settings.show) {
                    Settings.show();
                }
            });
        }
    },

    /**
     * 绑定弹窗关闭事件
     * 小白理解：点击弹窗外的灰色区域，关闭弹窗
     */
    bindModalEvents() {
        const overlay = document.getElementById('modal-overlay');
        overlay.addEventListener('click', (e) => {
            // 只有点击遮罩本身（不是弹窗内容）才关闭
            if (e.target === overlay) {
                Utils.closeModal();
            }
        });
    },

    /**
     * 加载用户设置（字体大小、深色模式）
     * 小白理解：用户上次设置的字号和主题，重新打开要记住
     */
    loadSettings() {
        // 加载字体大小
        const fontSize = AppStorage.get('fontSize') || 'medium';
        document.body.classList.add('font-' + fontSize);

        // 加载深色模式
        const isDark = AppStorage.get('darkMode') === true;
        if (isDark) {
            document.body.classList.add('dark');
        }
    },

    /**
     * 初始化各功能模块
     * 小白理解：挨个叫醒每个功能模块，让它们准备工作
     */
    initModules() {
        const modules = ['Home', 'Food', 'Travel', 'Trip', 'AI', 'Guide', 'Badges', 'Settings', 'Journey'];
        modules.forEach(name => {
            // 检查模块是否存在，是否有 init 方法
            if (typeof window[name] !== 'undefined' && typeof window[name].init === 'function') {
                try {
                    window[name].init();
                } catch (e) {
                    console.error(`模块 ${name} 初始化失败:`, e);
                }
            }
        });
    },

    /**
     * 根据 Tab 名称获取对应模块
     * @param {string} tabName - Tab名称
     * @returns {object|null} 模块对象
     */
    getModule(tabName) {
        const map = {
            home: 'Home',
            food: 'Food',
            travel: 'Travel',
            trip: 'Trip',
            ai: 'AI'
        };
        const moduleName = map[tabName];
        if (moduleName && typeof window[moduleName] !== 'undefined') {
            return window[moduleName];
        }
        return null;
    },

    /**
     * 检查是否首次访问（显示新手引导）
     */
    checkFirstVisit() {
        const hasVisited = AppStorage.get('hasVisited');
        if (!hasVisited) {
            // 首次访问，显示新手引导
            if (typeof Guide !== 'undefined' && typeof Guide.show === 'function') {
                Guide.show();
            }
            // 标记为已访问
            AppStorage.set('hasVisited', true);
        }
    },

    /**
     * 检查出发提醒（创新点：出行前一天浏览器通知提醒）
     * 小白理解：如果用户有保存的出行方案，且出发日期是明天，就发通知提醒
     */
    checkDepartureReminder() {
        const plan = AppStorage.getTravelPlan();
        if (!plan || !plan.startDate || !plan.dailyPlans || plan.dailyPlans.length === 0) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = Utils.formatDate(tomorrow);

        if (plan.startDate === tomorrowStr) {
            // 明天出发，发通知
            if ('Notification' in window && Notification.permission === 'granted') {
                const firstCity = plan.dailyPlans[0].to || '目的地';
                new Notification('✈️ 出发提醒', {
                    body: `明天就要出发去${firstCity}啦！记得检查行李清单～`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">✈️</text></svg>'
                });
            }
        }
    },

    /**
     * 请求通知权限
     * 小白理解：问用户能不能发通知，同意了才能发出发提醒
     */
    requestNotifyPermission() {
        if (!('Notification' in window)) {
            Utils.toast('浏览器不支持通知功能');
            return;
        }
        if (Notification.permission === 'granted') {
            Utils.toast('已开启通知提醒');
            return;
        }
        if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    Utils.toast('✓ 通知已开启，出发前会提醒你');
                    this.checkDepartureReminder();
                } else {
                    Utils.toast('未开启通知，无法发送出发提醒');
                }
            });
        } else {
            Utils.toast('通知已被浏览器屏蔽，请在设置中开启');
        }
    }
};

/* ============================================ */
/* 页面加载完成后启动 App                        */
/* 小白理解：等网页所有内容都加载好了，再启动App  */
/* ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
