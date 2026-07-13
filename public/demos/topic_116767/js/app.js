var App = (function() {
    var STORAGE_KEY_STATE = 'app_state';
    var NAV_VIEWS = ['sop', 'budget', 'tools', 'knowledge', 'home'];
    var ANIMATION_DURATION = 250;

    var DECORATION_MODES = ['full', 'half', 'self'];
    var DEFAULT_MODE = 'full';

    var AppState = {
        currentView: 'hero',
        userData: {
            id: null,
            name: '',
            decorationMode: DEFAULT_MODE,
            settings: {}
        },
        globalState: {
            initialized: false,
            lastVisit: null,
            theme: 'light'
        },
        sopProgress: {
            full: { completedSteps: [], currentStep: 'F-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            half: { completedSteps: [], currentStep: 'H-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            self: { completedSteps: [], currentStep: 'S-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            settings: { paymentReminder: true, delayWarning: true, warrantyExpiry: true }
        },
        budgetPlans: {
            full: null,
            half: null,
            self: null
        },
        homeData: {
            full: null,
            half: null,
            self: null
        }
    };

    var viewRegistry = {};
    var viewContainer = null;
    var viewWrapper = null;
    var sidebarNav = null;
    var bottomNav = null;
    var currentViewModule = null;
    var isAnimating = false;

    var saveStateDebounceTimer = null;
    var SAVE_STATE_DEBOUNCE = 300;

    function registerView(viewName, viewModule) {
        if (!viewModule || typeof viewModule.render !== 'function') {
            console.error('Invalid view module for:', viewName);
            return;
        }
        viewRegistry[viewName] = viewModule;
    }

    function shouldShowNav(viewName) {
        return NAV_VIEWS.indexOf(viewName) !== -1;
    }

    function updateNavVisibility(viewName) {
        var showNav = shouldShowNav(viewName);

        if (sidebarNav) {
            if (showNav) {
                sidebarNav.classList.add('visible');
            } else {
                sidebarNav.classList.remove('visible');
            }
        }

        if (bottomNav) {
            if (showNav) {
                bottomNav.classList.add('visible');
            } else {
                bottomNav.classList.remove('visible');
            }
        }

        if (viewWrapper) {
            if (showNav) {
                viewWrapper.classList.add('with-sidebar', 'with-bottom-nav');
            } else {
                viewWrapper.classList.remove('with-sidebar', 'with-bottom-nav');
            }
        }
    }

    function updateActiveNavItem(viewName) {
        if (sidebarNav) {
            var sidebarItems = sidebarNav.querySelectorAll('.sidebar-nav-item');
            sidebarItems.forEach(function(item) {
                var itemView = item.getAttribute('data-view');
                if (itemView === viewName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        if (bottomNav) {
            var bottomItems = bottomNav.querySelectorAll('.bottom-nav-item');
            bottomItems.forEach(function(item) {
                var itemView = item.getAttribute('data-view');
                if (itemView === viewName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    function switchView(viewName) {
        if (!viewRegistry[viewName]) {
            console.error('View not found:', viewName);
            Toast.error('页面不存在：' + viewName);
            return;
        }

        if (isAnimating || viewName === AppState.currentView) {
            return;
        }

        isAnimating = true;

        if (viewContainer) {
            viewContainer.classList.remove('visible');
            viewContainer.classList.add('fade-out');
        }

        setTimeout(function() {
            try {
                if (currentViewModule && typeof currentViewModule.destroy === 'function') {
                    try {
                        currentViewModule.destroy();
                    } catch (destroyErr) {
                        console.error('Error destroying view:', destroyErr);
                    }
                }

                AppState.currentView = viewName;
                currentViewModule = viewRegistry[viewName];

                updateNavVisibility(viewName);
                updateActiveNavItem(viewName);

                if (viewContainer) {
                    viewContainer.classList.remove('fade-out');
                    try {
                        currentViewModule.render(viewContainer);
                    } catch (renderErr) {
                        console.error('Error rendering view [' + viewName + ']:', renderErr);
                        showErrorState(viewContainer, {
                            title: '页面加载失败',
                            desc: '小管家在加载这个页面时遇到了一点小问题，您可以试试重试或者回到首页~',
                            primaryAction: '重试',
                            secondaryAction: '返回首页',
                            onPrimaryAction: function() {
                                switchView(viewName);
                            },
                            onSecondaryAction: function() {
                                switchView('home');
                            }
                        });
                        isAnimating = false;
                        return;
                    }

                    if (typeof currentViewModule.init === 'function') {
                        try {
                            currentViewModule.init(viewContainer);
                        } catch (initErr) {
                            console.error('Error initializing view [' + viewName + ']:', initErr);
                        }
                    }

                    if (typeof currentViewModule.viewEnter === 'function') {
                        try {
                            currentViewModule.viewEnter(viewContainer);
                        } catch (enterErr) {
                            console.error('Error entering view [' + viewName + ']:', enterErr);
                        }
                    }

                    requestAnimationFrame(function() {
                        viewContainer.classList.add('visible');
                    });
                }

                saveState();
                EventBus.emit(EventBus.EVENTS.VIEW_CHANGED, { view: viewName });
            } catch (e) {
                console.error('Unexpected error switching to view [' + viewName + ']:', e);
                Toast.error('页面切换失败，请重试');
                if (viewName !== 'home' && viewRegistry['home']) {
                    AppState.currentView = 'home';
                    currentViewModule = viewRegistry['home'];
                    if (viewContainer) {
                        viewContainer.classList.remove('fade-out');
                        try {
                            currentViewModule.render(viewContainer);
                            if (typeof currentViewModule.init === 'function') {
                                currentViewModule.init(viewContainer);
                            }
                            if (typeof currentViewModule.viewEnter === 'function') {
                                currentViewModule.viewEnter(viewContainer);
                            }
                            requestAnimationFrame(function() {
                                viewContainer.classList.add('visible');
                            });
                        } catch (homeErr) {
                            console.error('Failed to fallback to home view:', homeErr);
                        }
                    }
                }
            }

            setTimeout(function() {
                isAnimating = false;
            }, ANIMATION_DURATION);
        }, ANIMATION_DURATION);
    }

    function openQuickAddModal() {
        var modal = document.getElementById('quick-add-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quick-add-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content quick-add-content">
                    <button class="modal-close" aria-label="关闭">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <h3 class="modal-title">快捷操作</h3>
                    <div class="quick-add-grid">
                        <button class="quick-add-item" data-action="expense">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--zhu-red), var(--zhu-red-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </span>
                            <span class="quick-add-label">记一笔支出</span>
                        </button>
                        <button class="quick-add-item" data-action="next-step">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--dai-blue), var(--dai-blue-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                            <span class="quick-add-label">查看下一步</span>
                        </button>
                        <button class="quick-add-item" data-action="search">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--zhu-green), var(--zhu-green-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </span>
                            <span class="quick-add-label">搜索</span>
                        </button>
                        <button class="quick-add-item" data-action="tools">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--gold), var(--gold-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                            </span>
                            <span class="quick-add-label">工具箱</span>
                        </button>
                        <button class="quick-add-item" data-action="knowledge">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--purple), var(--purple-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            </span>
                            <span class="quick-add-label">知识库</span>
                        </button>
                        <button class="quick-add-item" data-action="sop">
                            <span class="quick-add-icon" style="background: linear-gradient(135deg, var(--tan-brown), var(--tan-brown-light));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect><polyline points="9 14 11 16 15 12"></polyline></svg>
                            </span>
                            <span class="quick-add-label">装修流程</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            var closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    modal.classList.remove('active');
                });
            }

            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            var quickItems = modal.querySelectorAll('.quick-add-item');
            quickItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var action = this.getAttribute('data-action');
                    modal.classList.remove('active');
                    handleQuickAction(action);
                });
            });
        }

        requestAnimationFrame(function() {
            modal.classList.add('active');
        });
    }

    function handleQuickAction(action) {
        switch (action) {
            case 'expense':
                Toast.info('正在打开记一笔...');
                switchView('budget');
                break;
            case 'next-step':
                Toast.info('正在查看下一步...');
                switchView('sop');
                break;
            case 'search':
                if (window.GlobalSearch && GlobalSearch.open) {
                    GlobalSearch.open();
                } else {
                    Toast.info('搜索功能即将上线');
                }
                break;
            case 'tools':
                switchView('tools');
                break;
            case 'knowledge':
                switchView('knowledge');
                break;
            case 'sop':
                switchView('sop');
                break;
            default:
                break;
        }
    }

    function openProfileModal() {
        var modal = document.getElementById('profile-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'profile-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content profile-content">
                    <button class="modal-close" aria-label="关闭">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div class="profile-info">
                            <div class="profile-name">装修小管家</div>
                            <div class="profile-desc">陪你一起打造理想家 🏠</div>
                        </div>
                    </div>
                    <div class="profile-menu">
                        <button class="profile-menu-item" data-action="settings">
                            <span class="profile-menu-icon" style="color: var(--dai-blue);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </span>
                            <span class="profile-menu-text">设置</span>
                            <span class="profile-menu-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                        </button>
                        <button class="profile-menu-item" data-action="tools">
                            <span class="profile-menu-icon" style="color: var(--gold);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                            </span>
                            <span class="profile-menu-text">工具箱</span>
                            <span class="profile-menu-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                        </button>
                        <button class="profile-menu-item" data-action="collection">
                            <span class="profile-menu-icon" style="color: var(--zhu-red);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </span>
                            <span class="profile-menu-text">我的收藏</span>
                            <span class="profile-menu-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                        </button>
                        <button class="profile-menu-item" data-action="about">
                            <span class="profile-menu-icon" style="color: var(--zhu-green);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </span>
                            <span class="profile-menu-text">关于我们</span>
                            <span class="profile-menu-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            var closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    modal.classList.remove('active');
                });
            }

            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            var menuItems = modal.querySelectorAll('.profile-menu-item');
            menuItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    var action = this.getAttribute('data-action');
                    modal.classList.remove('active');
                    handleProfileAction(action);
                });
            });
        }

        requestAnimationFrame(function() {
            modal.classList.add('active');
        });
    }

    function handleProfileAction(action) {
        switch (action) {
            case 'settings':
                if (window.SettingsModal && SettingsModal.open) {
                    SettingsModal.open();
                } else {
                    Toast.info('设置功能即将上线');
                }
                break;
            case 'tools':
                switchView('tools');
                break;
            case 'collection':
                Toast.info('收藏功能即将上线');
                break;
            case 'about':
                Toast.info('关于页面即将上线');
                break;
            default:
                break;
        }
    }

    function initNavEvents() {
        var navItems = document.querySelectorAll('.sidebar-nav-item, .bottom-nav-item');
        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                var viewName = this.getAttribute('data-view');

                if (action === 'settings') {
                    if (window.SettingsModal && SettingsModal.open) {
                        SettingsModal.open();
                    }
                    return;
                }

                if (action === 'quick-add') {
                    openQuickAddModal();
                    return;
                }

                if (action === 'profile') {
                    openProfileModal();
                    return;
                }

                if (viewName && viewRegistry[viewName]) {
                    switchView(viewName);
                }
            });

            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var action = this.getAttribute('data-action');
                    var viewName = this.getAttribute('data-view');

                    if (action === 'settings') {
                        if (window.SettingsModal && SettingsModal.open) {
                            SettingsModal.open();
                        }
                        return;
                    }

                    if (action === 'quick-add') {
                        openQuickAddModal();
                        return;
                    }

                    if (action === 'profile') {
                        openProfileModal();
                        return;
                    }

                    if (viewName && viewRegistry[viewName]) {
                        switchView(viewName);
                    }
                }
            });
        });
    }

    function saveStateImmediate() {
        if (saveStateDebounceTimer) {
            clearTimeout(saveStateDebounceTimer);
            saveStateDebounceTimer = null;
        }
        return Storage.save(STORAGE_KEY_STATE, AppState);
    }

    function saveState(immediate) {
        if (immediate) {
            return saveStateImmediate();
        }
        if (saveStateDebounceTimer) {
            clearTimeout(saveStateDebounceTimer);
        }
        saveStateDebounceTimer = setTimeout(function() {
            saveStateDebounceTimer = null;
            Storage.save(STORAGE_KEY_STATE, AppState);
        }, SAVE_STATE_DEBOUNCE);
    }

    function isUnsafeKey(key) {
        return key === '__proto__' || key === 'constructor' || key === 'prototype';
    }

    function deepMerge(target, source) {
        if (!source || typeof source !== 'object') return target;
        if (!target || typeof target !== 'object') return source;

        for (var key in source) {
            if (source.hasOwnProperty(key) && !isUnsafeKey(key)) {
                var srcVal = source[key];
                var tgtVal = target[key];

                if (Array.isArray(srcVal)) {
                    target[key] = srcVal.slice();
                } else if (srcVal !== null && typeof srcVal === 'object') {
                    if (tgtVal === null || typeof tgtVal !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], srcVal);
                } else {
                    target[key] = srcVal;
                }
            }
        }
        return target;
    }

    function loadState() {
        try {
            var savedState = Storage.load(STORAGE_KEY_STATE);
            if (savedState && typeof savedState === 'object') {
                if (savedState.userData) {
                    deepMerge(AppState.userData, savedState.userData);
                }
                if (savedState.globalState) {
                    deepMerge(AppState.globalState, savedState.globalState);
                }
                if (savedState.sopProgress) {
                    deepMerge(AppState.sopProgress, savedState.sopProgress);
                    var modes = ['full', 'half', 'self'];
                    for (var m = 0; m < modes.length; m++) {
                        var mode = modes[m];
                        if (AppState.sopProgress[mode] && !Array.isArray(AppState.sopProgress[mode].completedSteps)) {
                            AppState.sopProgress[mode].completedSteps = [];
                        }
                    }
                    if (!AppState.sopProgress.full || !AppState.sopProgress.full.completedSteps) {
                        if (Array.isArray(AppState.sopProgress.completedSteps)) {
                            var oldMode = savedState.userData && savedState.userData.decorationMode 
                                ? savedState.userData.decorationMode 
                                : AppState.userData.decorationMode;
                            if (!AppState.sopProgress[oldMode]) {
                                AppState.sopProgress[oldMode] = {};
                            }
                            AppState.sopProgress[oldMode].completedSteps = AppState.sopProgress.completedSteps;
                            AppState.sopProgress[oldMode].currentStep = AppState.sopProgress.currentStep;
                            AppState.sopProgress[oldMode].currentStage = AppState.sopProgress.currentStage;
                            AppState.sopProgress[oldMode].stepPhotos = AppState.sopProgress.stepPhotos || {};
                            AppState.sopProgress[oldMode].stepDelays = AppState.sopProgress.stepDelays || {};
                        }
                    }
                }
                if (savedState.budgetPlans) {
                    deepMerge(AppState.budgetPlans, savedState.budgetPlans);
                }
                if (savedState.homeData) {
                    deepMerge(AppState.homeData, savedState.homeData);
                }
                if (savedState.currentView && typeof savedState.currentView === 'string') {
                    AppState.currentView = savedState.currentView;
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            var modes = ['full', 'half', 'self'];
            for (var m = 0; m < modes.length; m++) {
                var mode = modes[m];
                if (!AppState.sopProgress[mode]) {
                    AppState.sopProgress[mode] = {};
                }
                AppState.sopProgress[mode].completedSteps = [];
            }
        }
    }

    function restoreView() {
        var validViews = ['hero', 'onboarding', 'sop', 'budget', 'tools', 'knowledge', 'home'];
        
        if (validViews.indexOf(AppState.currentView) === -1 || !viewRegistry[AppState.currentView]) {
            if (AppState.userData && AppState.userData.styleResult) {
                AppState.currentView = 'sop';
            } else {
                AppState.currentView = 'hero';
            }
        }
        
        if (!viewRegistry[AppState.currentView]) {
            AppState.currentView = 'hero';
        }
    }

    function resetAllData(callback) {
        AppState.currentView = 'hero';
        AppState.userData = {
            id: null,
            name: '',
            decorationMode: DEFAULT_MODE,
            settings: {}
        };
        AppState.globalState = {
            initialized: true,
            lastVisit: null,
            theme: 'light'
        };
        AppState.sopProgress = {
            full: { completedSteps: [], currentStep: 'F-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            half: { completedSteps: [], currentStep: 'H-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            self: { completedSteps: [], currentStep: 'S-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
            settings: { paymentReminder: true, delayWarning: true, warrantyExpiry: true }
        };
        AppState.budgetPlans = {
            full: null,
            half: null,
            self: null
        };
        AppState.homeData = {
            full: null,
            half: null,
            self: null
        };
        
        Storage.remove(STORAGE_KEY_STATE);
        
        if (window.CultivationData && typeof CultivationData.reset === 'function') {
            try {
                CultivationData.reset();
            } catch (e) {
                console.error('Failed to reset cultivation data:', e);
            }
        }
        
        if (callback && typeof callback === 'function') {
            callback();
        }
    }

    function getDecorationMode() {
        if (AppState.userData && AppState.userData.decorationMode) {
            return AppState.userData.decorationMode;
        }
        return DEFAULT_MODE;
    }

    function setDecorationMode(mode) {
        if (DECORATION_MODES.indexOf(mode) === -1) {
            console.error('Invalid decoration mode:', mode);
            return false;
        }
        var oldMode = AppState.userData.decorationMode;
        AppState.userData.decorationMode = mode;
        saveState(true);
        EventBus.emit(EventBus.EVENTS.MODE_CHANGED, {
            oldMode: oldMode,
            newMode: mode
        });
        return true;
    }

    function getBudgetPlan(mode) {
        mode = mode || getDecorationMode();
        if (!AppState.budgetPlans) {
            AppState.budgetPlans = {};
        }
        return AppState.budgetPlans[mode] || null;
    }

    function setBudgetPlan(plan, mode, immediate) {
        mode = mode || getDecorationMode();
        if (!AppState.budgetPlans) {
            AppState.budgetPlans = {};
        }
        AppState.budgetPlans[mode] = plan;
        saveState(immediate);
    }

    function getHomeData(mode) {
        mode = mode || getDecorationMode();
        if (!AppState.homeData) {
            AppState.homeData = {};
        }
        return AppState.homeData[mode] || null;
    }

    function setHomeData(data, mode, immediate) {
        mode = mode || getDecorationMode();
        if (!AppState.homeData) {
            AppState.homeData = {};
        }
        AppState.homeData[mode] = data;
        saveState(immediate);
    }

    function showLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
            </div>
        `;
    }

    function showEmptyState(container, options) {
        if (!container) return;
        options = options || {};

        var iconClass = 'empty-state-icon';
        if (options.iconClass) {
            iconClass += ' ' + options.iconClass;
        }

        var actionsHtml = '';
        if (options.primaryAction) {
            actionsHtml += '<div class="empty-state-actions">';
            actionsHtml += '<button class="btn-primary" id="empty-primary-btn">' + options.primaryAction + '</button>';
            if (options.secondaryAction) {
                actionsHtml += '<button class="empty-state-secondary-link" id="empty-secondary-btn">' +
                    options.secondaryAction +
                    ' <span class="link-arrow">→</span></button>';
            }
            actionsHtml += '</div>';
        }

        var tagsHtml = '';
        if (options.tags && options.tags.length > 0) {
            tagsHtml = '<div class="empty-state-tags">' +
                options.tags.map(function(tag) {
                    return '<span class="empty-state-tag" data-tag="' + tag + '">' + tag + '</span>';
                }).join('') +
                '</div>';
        }

        var containerClass = 'empty-state';
        if (options.variant === 'card') {
            containerClass += ' empty-state-card';
        } else if (options.variant === 'mini') {
            containerClass += ' empty-state-mini';
        }

        container.innerHTML = `
            <div class="${containerClass}">
                <div class="${iconClass}">${options.icon || Icons.render('nian-default')}</div>
                <div class="empty-state-title">${options.title || '暂无数据'}</div>
                <div class="empty-state-desc">${options.desc || '小管家在这里等你回来哦~'}</div>
                ${tagsHtml}
                ${actionsHtml}
            </div>
        `;

        if (options.onPrimaryAction && typeof options.onPrimaryAction === 'function') {
            var primaryBtn = container.querySelector('#empty-primary-btn');
            if (primaryBtn) {
                primaryBtn.addEventListener('click', options.onPrimaryAction);
            }
        }

        if (options.onSecondaryAction && typeof options.onSecondaryAction === 'function') {
            var secondaryBtn = container.querySelector('#empty-secondary-btn');
            if (secondaryBtn) {
                secondaryBtn.addEventListener('click', options.onSecondaryAction);
            }
        }

        if (options.onTagClick && typeof options.onTagClick === 'function') {
            var tagElements = container.querySelectorAll('.empty-state-tag');
            tagElements.forEach(function(tagEl) {
                tagEl.addEventListener('click', function() {
                    var tag = this.getAttribute('data-tag');
                    options.onTagClick(tag);
                });
            });
        }
    }

    function showErrorState(container, options) {
        if (!container) return;
        options = options || {};

        var errorIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        var iconClass = 'error-state-icon';
        if (options.iconClass) {
            iconClass += ' ' + options.iconClass;
        }

        var actionsHtml = '';
        if (options.primaryAction) {
            actionsHtml += '<div class="error-state-actions">';
            actionsHtml += '<button class="btn-primary" id="error-primary-btn">' + options.primaryAction + '</button>';
            if (options.secondaryAction) {
                actionsHtml += '<button class="error-state-secondary-link" id="error-secondary-btn">' +
                    options.secondaryAction +
                    ' <span class="link-arrow">→</span></button>';
            }
            actionsHtml += '</div>';
        }

        var containerClass = 'error-state';
        if (options.variant === 'card') {
            containerClass += ' error-state-card';
        } else if (options.variant === 'mini') {
            containerClass += ' error-state-mini';
        }

        container.innerHTML = `
            <div class="${containerClass}">
                <div class="${iconClass}">${options.icon || errorIcon}</div>
                <div class="error-state-title">${options.title || '出了点小问题'}</div>
                <div class="error-state-desc">${options.desc || '小管家遇到了一点小麻烦，请稍后再试~'}</div>
                ${actionsHtml}
            </div>
        `;

        if (options.onPrimaryAction && typeof options.onPrimaryAction === 'function') {
            var primaryBtn = container.querySelector('#error-primary-btn');
            if (primaryBtn) {
                primaryBtn.addEventListener('click', options.onPrimaryAction);
            }
        }

        if (options.onSecondaryAction && typeof options.onSecondaryAction === 'function') {
            var secondaryBtn = container.querySelector('#error-secondary-btn');
            if (secondaryBtn) {
                secondaryBtn.addEventListener('click', options.onSecondaryAction);
            }
        }
    }

    function showGlobalError(options) {
        options = options || {};

        var existingOverlay = document.getElementById('global-error-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        var errorIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

        var overlay = document.createElement('div');
        overlay.id = 'global-error-overlay';
        overlay.className = 'global-error-overlay';

        var refreshAction = options.onRefresh || function() {
            window.location.reload();
        };

        var resetAction = options.onReset || function() {
            if (window.App && App.resetAllData) {
                App.resetAllData(function() {
                    window.location.reload();
                });
            } else {
                window.location.reload();
            }
        };

        overlay.innerHTML = `
            <div class="global-error-content">
                <div class="global-error-icon">${errorIcon}</div>
                <div class="global-error-title">${options.title || '哎呀，出问题了'}</div>
                <div class="global-error-desc">${options.desc || '小管家遇到了一点小意外，您可以试试刷新页面或者重置数据。'}</div>
                <div class="global-error-actions">
                    <button class="btn-primary" id="global-error-refresh">刷新页面</button>
                    <button class="btn-secondary" id="global-error-reset">重置数据</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        var refreshBtn = overlay.querySelector('#global-error-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshAction);
        }

        var resetBtn = overlay.querySelector('#global-error-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetAction);
        }
    }

    function initGlobalErrorHandlers() {
        var errorCount = 0;
        var lastErrorTime = 0;

        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Global error:', message, source, lineno, colno, error);

            var now = Date.now();
            if (now - lastErrorTime < 1000) {
                errorCount++;
            } else {
                errorCount = 1;
            }
            lastErrorTime = now;

            if (errorCount >= 5) {
                console.warn('Too many errors, showing global error overlay');
                showGlobalError();
                return true;
            }

            if (window.Toast && Toast.error) {
                Toast.error('出了点小问题，不影响使用~');
            }

            return false;
        };

        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);

            if (window.Toast && Toast.error) {
                Toast.error('操作失败，请重试');
            }
        });
    }

    function init() {
        try {
            initGlobalErrorHandlers();

            viewContainer = document.getElementById('view-container');
            viewWrapper = document.getElementById('view-wrapper');
            sidebarNav = document.getElementById('sidebar-nav');
            bottomNav = document.getElementById('bottom-nav');

            if (window.CultivationData && typeof CultivationData.init === 'function') {
                try {
                    CultivationData.init();
                } catch (e) {
                    console.error('Failed to init cultivation data:', e);
                }
            }

            if (window.AnimUtils && typeof AnimUtils.initRippleEffect === 'function') {
                try {
                    AnimUtils.initRippleEffect();
                } catch (e) {
                    console.error('Failed to init ripple effect:', e);
                }
            }

            if (!viewContainer) {
                console.error('View container not found');
                showGlobalError({
                    title: '初始化失败',
                    desc: '找不到页面容器元素，请刷新页面试试~'
                });
                return;
            }

            registerView('hero', window.HeroView);
            registerView('onboarding', window.OnboardingView);
            registerView('sop', window.SopView);
            registerView('budget', window.BudgetView);
            registerView('tools', window.ToolsView);
            registerView('knowledge', window.KnowledgeView);
            registerView('home', window.HomeView);

            try {
                initNavEvents();
            } catch (e) {
                console.error('Failed to init nav events:', e);
            }

            loadState();
            restoreView();

            AppState.globalState.lastVisit = new Date().toISOString();
            AppState.globalState.initialized = true;

            updateNavVisibility(AppState.currentView);
            updateActiveNavItem(AppState.currentView);

            var initialView = AppState.currentView;
            currentViewModule = viewRegistry[initialView];

            if (currentViewModule) {
                try {
                    currentViewModule.render(viewContainer);
                } catch (renderErr) {
                    console.error('Error rendering initial view [' + initialView + ']:', renderErr);
                    if (initialView !== 'hero' && viewRegistry['hero']) {
                        AppState.currentView = 'hero';
                        currentViewModule = viewRegistry['hero'];
                        try {
                            currentViewModule.render(viewContainer);
                        } catch (heroErr) {
                            console.error('Failed to fallback to hero view:', heroErr);
                            showErrorState(viewContainer, {
                                title: '页面加载失败',
                                desc: '小管家在启动时遇到了问题，请刷新页面试试~',
                                primaryAction: '刷新页面',
                                onPrimaryAction: function() {
                                    window.location.reload();
                                }
                            });
                        }
                    } else {
                        showErrorState(viewContainer, {
                            title: '页面加载失败',
                            desc: '小管家在启动时遇到了问题，请刷新页面试试~',
                            primaryAction: '刷新页面',
                            onPrimaryAction: function() {
                                window.location.reload();
                            }
                        });
                    }
                }

                if (currentViewModule && typeof currentViewModule.init === 'function') {
                    try {
                        currentViewModule.init(viewContainer);
                    } catch (initErr) {
                        console.error('Error initializing initial view:', initErr);
                    }
                }

                if (currentViewModule && typeof currentViewModule.viewEnter === 'function') {
                    try {
                        currentViewModule.viewEnter(viewContainer);
                    } catch (enterErr) {
                        console.error('Error entering initial view:', enterErr);
                    }
                }
            } else {
                showErrorState(viewContainer, {
                    title: '找不到页面',
                    desc: '小管家找不到要显示的页面，请刷新页面试试~',
                    primaryAction: '刷新页面',
                    onPrimaryAction: function() {
                        window.location.reload();
                    }
                });
            }

            requestAnimationFrame(function() {
                if (viewContainer) {
                    viewContainer.classList.add('visible');
                }
            });

            window.addEventListener('beforeunload', function() {
                try {
                    saveStateImmediate();
                } catch (e) {
                    console.error('Failed to save state on unload:', e);
                }
            });

            try {
                EventBus.emit(EventBus.EVENTS.APP_INITIALIZED, AppState);
            } catch (e) {
                console.error('Failed to emit app initialized event:', e);
            }
        } catch (e) {
            console.error('Fatal error during app init:', e);
            showGlobalError({
                title: '启动失败',
                desc: '小管家在启动时遇到了严重问题，请刷新页面试试~'
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        state: AppState,
        switchView: switchView,
        registerView: registerView,
        storage: Storage,
        eventBus: EventBus,
        cultivationData: CultivationData,
        saveState: saveState,
        saveStateImmediate: saveStateImmediate,
        loadState: loadState,
        resetAllData: resetAllData,
        showLoading: showLoading,
        showEmptyState: showEmptyState,
        showErrorState: showErrorState,
        showGlobalError: showGlobalError,
        getDecorationMode: getDecorationMode,
        setDecorationMode: setDecorationMode,
        getBudgetPlan: getBudgetPlan,
        setBudgetPlan: setBudgetPlan,
        getHomeData: getHomeData,
        setHomeData: setHomeData,
        openQuickAddModal: openQuickAddModal,
        MODES: DECORATION_MODES
    };
})();
