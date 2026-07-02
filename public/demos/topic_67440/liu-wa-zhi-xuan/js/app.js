(function(window) {
  const App = {
    _eventListeners: [],
    _scrollHandlers: [],
    _throttleTimers: {},
    _pageCleanupFns: [],
    _pageCache: new Map(),
    _scrollPositions: {},
    _maxCachedPages: 5,
    _cacheOrder: [],
    _currentCacheKey: null,

    init() {
      this.initPerformanceDetection();
      this.setupRoutes();
      Router.init();
      this.loadInitialData();
      this.initNetworkMonitor();
      this.addAccessibilityFeatures();
      this.initResponsiveHandler();
      this.initScrollHandler();
      this.initPageUnloadHandler();
    },

    initPerformanceDetection() {
      if (this._performanceDetected) return;
      this._performanceDetected = true;

      const isLowEnd = 
        (window.devicePixelRatio && window.devicePixelRatio < 1.5) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
        (navigator.deviceMemory && navigator.deviceMemory < 4);

      if (isLowEnd) {
        document.body.classList.add('low-end-device');
      }
    },

    addEventListener(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      this._eventListeners.push({ target, type, handler, options });
      return () => this.removeEventListener(target, type, handler);
    },

    removeEventListener(target, type, handler) {
      target.removeEventListener(type, handler);
      this._eventListeners = this._eventListeners.filter(
        e => !(e.target === target && e.type === type && e.handler === handler)
      );
    },

    addPageCleanup(fn) {
      this._pageCleanupFns.push(fn);
    },

    cleanupPageEvents() {
      this._pageCleanupFns.forEach(fn => {
        try { fn(); } catch (e) { console.error('Cleanup error:', e); }
      });
      this._pageCleanupFns = [];
      
      if (this._headerScrollHandler) {
        this.removeScrollHandler(this._headerScrollHandler);
        this._headerScrollHandler = null;
      }
      
      if (this._scrollLoadHandler) {
        this.removeScrollHandler(this._scrollLoadHandler);
        this._scrollLoadHandler = null;
      }
    },

    _getCacheKey(pageName, params) {
      const listPages = ['home', 'search', 'favorites', 'bookings'];
      if (pageName === 'activity') {
        const id = params?.params?.id || '';
        return `activity-${id}`;
      }
      if (pageName === 'search') {
        const q = params?.params?.q || '';
        const category = params?.params?.category || '';
        const tag = params?.params?.tag || '';
        const sort = params?.params?.sort || '';
        return `search-${q}-${category}-${tag}-${sort}`;
      }
      if (listPages.includes(pageName)) {
        return pageName;
      }
      return pageName;
    },

    _cachePage(cacheKey, container) {
      if (this._pageCache.has(cacheKey)) {
        const oldContainer = this._pageCache.get(cacheKey);
        if (oldContainer && oldContainer !== container && oldContainer.parentNode) {
          oldContainer.parentNode.removeChild(oldContainer);
        }
        this._cacheOrder = this._cacheOrder.filter(k => k !== cacheKey);
      }
      this._pageCache.set(cacheKey, container);
      this._cacheOrder.push(cacheKey);
      if (this._cacheOrder.length > this._maxCachedPages) {
        this._evictOldestCache();
      }
    },

    _evictOldestCache() {
      if (this._cacheOrder.length === 0) return;
      const oldestKey = this._cacheOrder.shift();
      const cached = this._pageCache.get(oldestKey);
      if (cached && cached.parentNode) {
        cached.parentNode.removeChild(cached);
      }
      this._pageCache.delete(oldestKey);
      delete this._scrollPositions[oldestKey];
    },

    _clearPageCache() {
      this._pageCache.forEach((container, key) => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
      this._pageCache.clear();
      this._cacheOrder = [];
      this._scrollPositions = {};
      this._currentCacheKey = null;
    },

    _updateCachedFavorites(activityId) {
      const isFavorite = Storage.isFavorite(activityId);
      this._pageCache.forEach((container, key) => {
        if (!container) return;
        const favBtns = container.querySelectorAll(`.card-fav, .card-fav-v2, .chat-card-fav, .fav-btn`);
        favBtns.forEach(btn => {
          const btnId = btn.getAttribute('data-id');
          const onclick = btn.getAttribute('onclick') || '';
          if (btnId === activityId || onclick.includes(`'${activityId}'`) || onclick.includes(`"${activityId}"`)) {
            if (isFavorite) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          }
        });
        const bottomActionItems = container.querySelectorAll('.bottom-action-item');
        bottomActionItems.forEach(item => {
          const onclick = item.getAttribute('onclick') || '';
          if (onclick.includes(`toggleFavorite('${activityId}')`) || onclick.includes(`toggleFavorite("${activityId}")`)) {
            const svg = item.querySelector('svg');
            const span = item.querySelector('span');
            if (svg) {
              svg.setAttribute('fill', isFavorite ? '#E85D4E' : 'none');
              svg.setAttribute('stroke', isFavorite ? '#E85D4E' : 'currentColor');
            }
            if (span) {
              span.textContent = isFavorite ? '已收藏' : '收藏';
            }
          }
        });
      });
    },

    _activateCachedPage(pageName) {
      if (typeof this.setupHeaderScrollEffect === 'function') {
        this.setupHeaderScrollEffect();
      }
      if (typeof this.updateMessageBadge === 'function') {
        this.updateMessageBadge();
      }
      if (pageName === 'home') {
        if (typeof this.setupPullRefresh === 'function') {
          this.setupPullRefresh();
        }
        if (typeof this.setupScrollLoad === 'function') {
          this.setupScrollLoad();
        }
      }
      if (pageName === 'search') {
        const input = document.getElementById('search-input');
        if (input) {
          input.focus();
        }
      }
      this.ensureDesktopSidebar(pageName);
    },

    ensureDesktopSidebar(activePage) {
      if (window.innerWidth < 1024) return;
      const pageContainer = document.getElementById('page-container');
      if (!pageContainer) return;
      if (pageContainer.querySelector('.desktop-sidebar')) return;
      const sidebar = this.renderDesktopSidebar(activePage);
      if (sidebar) {
        pageContainer.insertAdjacentHTML('afterbegin', sidebar);
      }
    },

    initPageUnloadHandler() {
      window.addEventListener('beforeunload', () => {
        if (typeof Storage !== 'undefined' && Storage.flush) {
          Storage.flush();
        }
        this.destroyLazyObserver();
      });
    },

    throttle(fn, wait, scope) {
      let lastTime = 0;
      let timer = null;
      return function(...args) {
        const context = scope || this;
        const now = Date.now();
        const remaining = wait - (now - lastTime);
        
        if (remaining <= 0) {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          lastTime = now;
          fn.apply(context, args);
        } else if (!timer) {
          timer = setTimeout(() => {
            lastTime = Date.now();
            timer = null;
            fn.apply(context, args);
          }, remaining);
        }
      };
    },

    debounce(fn, wait, scope) {
      let timer = null;
      return function(...args) {
        const context = scope || this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          fn.apply(context, args);
          timer = null;
        }, wait);
      };
    },

    initResponsiveHandler() {
      let lastWidth = window.innerWidth;
      
      const handleScrollNavigation = (scrollY, direction) => {
        // 不操作底部导航栏，由 CSS 媒体查询控制显示/隐藏
      };
      
      this.addScrollHandler(handleScrollNavigation);
      
      const handleResize = this.debounce(() => {
        const currentWidth = window.innerWidth;
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth;
          this.handleResize();
          Router.clearCache();
          this._isScrolledMode = false;
        }
      }, 150, this);
      
      window.addEventListener('resize', handleResize, { passive: true });
      
      this.handleResize();
    },
    
    initScrollHandler() {
      let lastScrollY = 0;
      let scrollDirection = 'none';
      
      const throttledScroll = this.throttle(() => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY) {
          scrollDirection = 'down';
        } else if (currentScrollY < lastScrollY) {
          scrollDirection = 'up';
        }
        lastScrollY = currentScrollY;
        
        this._scrollHandlers.forEach(handler => {
          try { handler(currentScrollY, scrollDirection); } catch (e) {}
        });
      }, 16, this);
      
      window.addEventListener('scroll', throttledScroll, { passive: true });
    },

    addScrollHandler(handler) {
      if (typeof handler === 'function' && !this._scrollHandlers.includes(handler)) {
        this._scrollHandlers.push(handler);
      }
    },

    removeScrollHandler(handler) {
      this._scrollHandlers = this._scrollHandlers.filter(h => h !== handler);
    },
    
    handleScrollEnd(direction) {
    },

    handleResize() {
      const isDesktop = window.innerWidth >= 1024;
      const sidebar = document.querySelector('.desktop-sidebar');
      
      if (isDesktop) {
        // 桌面端：显示侧边栏
        if (sidebar) sidebar.style.display = 'flex';
      } else {
        // 移动端：隐藏侧边栏
        if (sidebar) sidebar.style.display = 'none';
      }
      
      // 底部导航栏由 CSS 媒体查询控制，不通过 JS 操作
      
      document.body.classList.toggle('is-desktop', isDesktop);
      document.body.classList.toggle('is-tablet', window.innerWidth >= 640 && window.innerWidth < 1024);
      document.body.classList.toggle('is-mobile', window.innerWidth < 640);
      document.body.classList.toggle('is-small-screen', window.innerWidth <= 340);
    },

    setupRoutes() {
      Router.addRoute('/', (params) => {
        this.renderPage('home', params);
      });

      Router.addRoute('/home', (params) => {
        this.renderPage('home', params);
      });

      Router.addRoute('/search', (params) => {
        this.renderPage('search', params);
      });

      Router.addRoute('/activity/:id', (params) => {
        this.renderPage('activity', params);
      });

      Router.addRoute('/favorites', (params) => {
        this.renderPage('favorites', params);
      });

      Router.addRoute('/bookings', (params) => {
        this.renderPage('bookings', params);
      });

      Router.addRoute('/schedule', (params) => {
        this.renderPage('schedule', params);
      });

      Router.addRoute('/subscription', (params) => {
        this.renderPage('subscription', params);
      });

      Router.addRoute('/messages', (params) => {
        this.renderPage('messages', params);
      });

      Router.addRoute('/planner', (params) => {
        this.renderPage('planner', params);
      });

      Router.addRoute('/profile', (params) => {
        this.renderPage('profile', params);
      });

      Router.addRoute('/settings', (params) => {
        this.renderPage('settings', params);
      });

      Router.setNotFound((params) => {
        this.renderPage('notFound', params);
      });
    },

    loadInitialData() {
      const user = Storage.getUser();
      if (!user.id) {
        Storage.setUser(MockData.defaultUser);
      }

      const messages = Storage.getMessages();
      if (messages.length === 0) {
        MockData.messages.forEach(msg => {
          Storage.addMessage(msg);
        });
      }
    },

    renderPage(pageName, params) {
      const app = document.getElementById('app');
      if (!app) return;

      const cacheKey = this._getCacheKey(pageName, params);
      const currentCacheKey = this._currentCacheKey;

      const isRefreshing = this._refreshingPage === cacheKey;
      if (isRefreshing) {
        this._refreshingPage = null;
      }

      if (currentCacheKey === cacheKey && !isRefreshing) {
        return;
      }

      if (this._isRendering) {
        this._pendingRender = { pageName, params };
        return;
      }
      this._isRendering = true;

      this.loadMoreState = { isLoading: false, hasMore: true, isError: false };

      const isBackNav = Router.isBackNavigation && Router.isBackNavigation();
      const pageEnterClass = isBackNav ? 'page-enter-back' : 'page-enter';
      const pageExitClass = isBackNav ? 'page-exit-back' : 'page-exit';

      let currentContainer = currentCacheKey ? this._pageCache.get(currentCacheKey) : null;
      if (isRefreshing && !currentContainer) {
        currentContainer = document.getElementById('page-container');
      }
      const cachedContainer = this._pageCache.get(cacheKey);

      const finishPageTransition = () => {
        this._isRendering = false;
        const pending = this._pendingRender;
        this._pendingRender = null;
        if (pending) {
          this.renderPage(pending.pageName, pending.params);
        }
      };

      const showCachedPage = () => {
        if (currentContainer) {
          this._scrollPositions[currentCacheKey] = window.scrollY;
          currentContainer.style.display = 'none';
          currentContainer.removeAttribute('id');
        }

        cachedContainer.style.display = 'block';
        cachedContainer.classList.add(pageEnterClass);
        cachedContainer.id = 'page-container';

        const scrollY = this._scrollPositions[cacheKey] || 0;
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });

        this._cacheOrder = this._cacheOrder.filter(k => k !== cacheKey);
        this._cacheOrder.push(cacheKey);

        this._currentCacheKey = cacheKey;
        this.currentPageName = pageName;
        this._activateCachedPage(pageName);

        setTimeout(() => {
          if (cachedContainer) {
            cachedContainer.classList.remove(pageEnterClass);
          }
          finishPageTransition();
        }, 300);
      };

      if (cachedContainer && currentCacheKey !== cacheKey) {
        if (currentContainer && !currentContainer.classList.contains('brand-splash')) {
          let done = false;
          currentContainer.classList.add(pageExitClass);
          
          const handleAnimationEnd = () => {
            if (done) return;
            done = true;
            currentContainer.removeEventListener('animationend', handleAnimationEnd);
            showCachedPage();
          };
          
          currentContainer.addEventListener('animationend', handleAnimationEnd);
          
          setTimeout(() => {
            if (done) return;
            done = true;
            currentContainer.removeEventListener('animationend', handleAnimationEnd);
            showCachedPage();
          }, 250);
        } else {
          showCachedPage();
        }
        return;
      }

      this.cleanupPageEvents();

      const skeletonPages = ['home', 'search', 'activity', 'favorites', 'bookings'];
      const useSkeleton = skeletonPages.includes(pageName);

      const renderNewPage = () => {
        if (currentContainer) {
          this._scrollPositions[currentCacheKey] = window.scrollY;
          currentContainer.style.display = 'none';
          currentContainer.removeAttribute('id');
        }

        const newContainer = document.createElement('div');
        newContainer.className = `app-container ${pageEnterClass}`;
        newContainer.id = 'page-container';
        app.appendChild(newContainer);

        const finishRender = (container) => {
          this._cachePage(cacheKey, container);
          this._currentCacheKey = cacheKey;
          this.initPageEvents(pageName);
          this.initPageEnhancements(pageName);

          setTimeout(() => {
            if (container) {
              container.classList.remove(pageEnterClass);
            }
            finishPageTransition();
          }, 300);
        };

        if (useSkeleton) {
          const SKELETON_MIN_DURATION = 200;
          const SKELETON_MAX_DURATION = 800;
          const skeletonType = pageName === 'activity' ? 'detail' : 'cards';
          const skeletonStartTime = Date.now();
          
          newContainer.innerHTML = this.renderSkeletonForPage(skeletonType);
          
          let contentReplaced = false;
          
          const replaceContent = () => {
            if (contentReplaced) return;
            contentReplaced = true;
            
            let html = '';
            switch (pageName) {
              case 'home':
                html = this.renderHome();
                break;
              case 'search':
                html = this.renderSearch(params);
                break;
              case 'activity':
                html = this.renderActivity(params);
                break;
              case 'favorites':
                html = this.renderFavorites();
                break;
              case 'bookings':
                html = this.renderBookings();
                break;
              default:
                html = this.renderHome();
            }
            
            newContainer.style.opacity = '0';
            newContainer.style.transition = 'opacity 0.3s ease';
            
            requestAnimationFrame(() => {
              newContainer.innerHTML = html;
              finishRender(newContainer);
              requestAnimationFrame(() => {
                newContainer.style.opacity = '1';
              });
              setTimeout(() => {
                newContainer.style.transition = '';
              }, 350);
            });
          };
          
          const scheduleReplace = () => {
            const elapsed = Date.now() - skeletonStartTime;
            const remaining = Math.max(0, SKELETON_MIN_DURATION - elapsed);
            
            if (remaining <= 0) {
              requestAnimationFrame(replaceContent);
            } else {
              setTimeout(() => {
                requestAnimationFrame(replaceContent);
              }, remaining);
            }
          };
          
          scheduleReplace();
          
          setTimeout(() => {
            replaceContent();
          }, SKELETON_MAX_DURATION);
        } else {
          let html = '';
          switch (pageName) {
            case 'home':
              html = this.renderHome();
              break;
            case 'search':
              html = this.renderSearch(params);
              break;
            case 'activity':
              html = this.renderActivity(params);
              break;
            case 'favorites':
              html = this.renderFavorites();
              break;
            case 'bookings':
              html = this.renderBookings();
              break;
            case 'schedule':
              html = this.renderSchedule();
              break;
            case 'subscription':
              html = this.renderSubscription();
              break;
            case 'messages':
              html = this.renderMessages();
              break;
            case 'planner':
              html = this.renderPlanner();
              break;
            case 'profile':
              html = this.renderProfile();
              break;
            case 'settings':
              html = this.renderSettingsPage();
              break;
            case 'notFound':
              html = this.renderNotFound();
              break;
            default:
              html = this.renderHome();
          }

          newContainer.innerHTML = html;
          finishRender(newContainer);
        }
      };

      if (currentContainer && !currentContainer.classList.contains('brand-splash')) {
        let done = false;
        currentContainer.classList.add(pageExitClass);
        
        const handleAnimationEnd = () => {
          if (done) return;
          done = true;
          currentContainer.removeEventListener('animationend', handleAnimationEnd);
          renderNewPage();
        };
        
        currentContainer.addEventListener('animationend', handleAnimationEnd);
        
        setTimeout(() => {
          if (done) return;
          done = true;
          currentContainer.removeEventListener('animationend', handleAnimationEnd);
          renderNewPage();
        }, 250);
      } else {
        renderNewPage();
      }
    },

    renderSkeletonForPage(type) {
      if (type === 'detail') {
        return this.renderSkeletonDetailPage();
      }
      return `
        <div style="padding: 16px; min-height: 400px;">
          ${this.renderSkeletonCards(3)}
        </div>
        <nav class="bottom-nav" aria-hidden="true">
          <button class="nav-item" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>首页</span>
          </button>
          <button class="nav-item" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>发现</span>
          </button>
          <button class="nav-item" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>日程</span>
          </button>
          <button class="nav-item" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>我的</span>
          </button>
        </nav>
      `;
    },

    renderHome() {
      const user = Storage.getUser();
      const favorites = Storage.getFavorites();
      const activities = MockData.getUpcomingActivities();
      const currentView = App.currentView || 'list';
      const filters = App.filters || {
        distance: 'all',
        time: 'all',
        category: 'all',
        age: 'all'
      };
      const sortBy = App.sortBy || 'distance';

      const filteredActivities = this.filterActivities(activities, filters);
      const sortedActivities = this.sortActivities(filteredActivities, sortBy);
      const displayActivities = sortedActivities.slice(0, App.currentPage * 10);
      const hasMore = displayActivities.length < sortedActivities.length;
      const aiRecommendations = this.getAIRecommendations(activities, user);

      const filterLabels = {
        distance: this.getFilterLabel('distance', filters.distance),
        time: this.getFilterLabel('time', filters.time),
        category: this.getFilterLabel('category', filters.category),
        age: this.getFilterLabel('age', filters.age)
      };

      return `
        ${this.renderDesktopSidebar('home')}
        <div class="page-home">
          <header class="header header-glass">
            <div class="location-bar" onclick="App.showCityModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span class="location-text">${user.location || '北京·朝阳区'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="search-bar" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>搜索活动、地点、关键词...</span>
            </div>
          </header>

          <main class="main-content">
            <div class="ai-chat-section">
              <div class="ai-chat-header">
                <div class="ai-chat-title-wrap">
                  <div class="ai-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12l9-3"></path></svg>
                  </div>
                  <div class="ai-chat-title-info">
                    <span class="ai-chat-title">AI 智能推荐</span>
                    <span class="ai-chat-subtitle">基于${user.childAge}岁娃偏好 · 支持多轮对话</span>
                  </div>
                </div>
              </div>
              <div class="ai-chat-messages" id="ai-chat-messages">
                ${this.renderAIChatMessages(aiRecommendations, favorites)}
              </div>
              <div class="quick-replies" id="quick-replies">
                ${MockData.quickReplies.map(qr => `
                  <button class="quick-reply-btn" onclick="App.sendQuickReply('${qr.id}', '${qr.text}')">
                    ${qr.text}
                  </button>
                `).join('')}
              </div>
              <div class="ai-chat-input-wrap">
                <button class="ai-voice-btn" id="ai-voice-btn" onclick="App.toggleVoiceInput()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
                <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="问问AI有什么好玩的..." onkeypress="if(event.key === 'Enter') App.sendAIMessage()" />
                <button class="ai-chat-send" onclick="App.sendAIMessage()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
              <div class="voice-listening-overlay" id="voice-listening-overlay" style="display: none;">
                <div class="voice-waves">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="voice-text">正在聆听...</div>
                <button class="voice-cancel-btn" onclick="App.cancelVoiceInput()">取消</button>
              </div>
            </div>

            <div class="smart-planner-entry" onclick="Router.navigate('/planner')">
              <div class="planner-entry-content">
                <div class="planner-entry-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M9 16l2 2 4-4"></path></svg>
                </div>
                <div class="planner-entry-text">
                  <span class="planner-entry-title">智能行程规划</span>
                  <span class="planner-entry-subtitle">AI一键生成本地一日游行程</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="planner-entry-arrow"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <div class="planner-shine"></div>
            </div>

            <div class="view-tabs">
              <button class="view-tab ${currentView === 'map' ? 'active' : ''}" onclick="App.switchView('map')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                <span>地图</span>
              </button>
              <button class="view-tab ${currentView === 'list' ? 'active' : ''}" onclick="App.switchView('list')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>列表</span>
              </button>
            </div>

            <div class="filter-bar">
              <button class="filter-pill ${filters.distance !== 'all' ? 'active' : ''}" onclick="App.showFilterPanel('distance')">
                <span>距离</span>
                <span class="filter-value">${filterLabels.distance}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <button class="filter-pill ${filters.time !== 'all' ? 'active' : ''}" onclick="App.showFilterPanel('time')">
                <span>时间</span>
                <span class="filter-value">${filterLabels.time}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <button class="filter-pill ${filters.category !== 'all' ? 'active' : ''}" onclick="App.showFilterPanel('category')">
                <span>类型</span>
                <span class="filter-value">${filterLabels.category}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <button class="filter-pill ${filters.age !== 'all' ? 'active' : ''}" onclick="App.showFilterPanel('age')">
                <span>适龄</span>
                <span class="filter-value">${filterLabels.age}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <button class="filter-pill filter-more ${this.priceFilter !== 'all' || this.durationFilter !== 'all' || this.venueFilter !== 'all' ? 'active' : ''}" onclick="App.showMoreFilters()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              </button>
            </div>

            <div class="scene-tags-section">
              <div class="section-header">
                <span class="section-title">场景推荐</span>
              </div>
              <div class="scene-tags-scroll">
                ${MockData.sceneTags.map(tag => `
                  <button class="scene-tag-item" onclick="Router.navigate('/search?tag=${tag.id}')">
                    <span class="tag-dot" style="background-color: ${tag.color}"></span>
                    <span>${tag.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="sort-bar">
              <span class="section-title">推荐活动</span>
              <div class="sort-options">
                ${this.renderSortOption('distance', sortBy, '距离最近')}
                ${this.renderSortOption('latest', sortBy, '最新发布')}
                ${this.renderSortOption('upcoming', sortBy, '即将开始')}
                ${this.renderSortOption('popular', sortBy, '热度最高')}
              </div>
            </div>

            ${currentView === 'map' ? this.renderMapView(displayActivities, favorites) : `
              <div class="refresh-container" id="refresh-container">
                <div class="refresh-indicator" id="refresh-indicator" style="display: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="refresh-icon"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  <span>正在刷新...</span>
                </div>
                <div class="activity-list" id="activity-list">
                  ${displayActivities.map(activity => this.renderActivityCard(activity, favorites)).join('')}
                </div>
                ${hasMore ? `<div class="load-more" onclick="App.loadMore()">加载更多</div>` : ''}
              </div>
            `}
          </main>

          <nav class="bottom-nav bottom-nav-glass">
            <button class="nav-item active" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>

          <div class="filter-panel-overlay" id="filter-panel-mask" onclick="App.closeFilterPanel()"></div>
          <div class="filter-panel" id="filter-panel">
            <div class="filter-panel-header">
              <span id="filter-panel-title">筛选</span>
              <button class="filter-panel-close" onclick="App.closeFilterPanel()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div class="filter-panel-content" id="filter-panel-content"></div>
          </div>
        </div>`;
    },

    getFilterLabel(type, value) {
      const options = {
        distance: { all: '全城', '1': '1km', '3': '3km', '5': '5km' },
        time: { all: '全部', today: '今天', tomorrow: '明天', weekend: '周末', '7days': '7天内' },
        category: { all: '全部' },
        age: { all: '全龄', '0-3': '0-3岁', '3-6': '3-6岁', '6-12': '6-12岁' }
      };
      if (type === 'category') {
        const cat = MockData.getCategoryById(value);
        return cat ? cat.name : '全部';
      }
      return options[type]?.[value] || '全部';
    },

    getAIRecommendations(activities, user) {
      const preferences = user.preferences || [];
      const childAge = user.childAge || 5;
      const scored = activities.map(activity => {
        let score = 0;
        if (preferences.includes(activity.category)) score += 30;
        if (activity.minAge <= childAge && activity.maxAge >= childAge) score += 20;
        score += (1 - activity.distance / 60) * 25;
        score += (activity.bookedSlots / activity.maxSlots) * 15;
        score += Math.random() * 10;
        return { ...activity, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5);
    },

    renderAIChatMessages(activities, favorites) {
      const recommendations = activities.slice(0, 3);
      return `
        <div class="chat-message ai-message">
          <div class="chat-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12l9-3"></path></svg>
          </div>
          <div class="chat-bubble">
            <div class="chat-text">
              嗨！我是您的趣享小助手~ 根据${this.getUserChildAge()}岁宝宝的偏好，为您推荐几个有趣的活动：
            </div>
            <div class="chat-activities">
              ${recommendations.map(activity => this.renderChatActivityCard(activity, favorites)).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderChatActivityCard(activity, favorites) {
      const isFavorite = favorites.includes(activity.id);
      const category = MockData.getCategoryById(activity.category);
      const remainingSlots = activity.maxSlots - activity.bookedSlots;

      return `
        <div class="chat-activity-card" onclick="Router.navigate('/activity/${activity.id}')">
          <div class="chat-card-cover">
            <img class="lazy-image gpu-accelerated" data-src="${activity.coverImage}" alt="${activity.title}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%23f5f5f5' width='300' height='200'/%3E%3C/svg%3E" />
            <button class="chat-card-fav ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${activity.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <span class="chat-card-tag">${category?.name || ''}</span>
          </div>
          <div class="chat-card-content">
            <h4 class="chat-card-title">${activity.title}</h4>
            <div class="chat-card-meta">
              <span class="chat-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${this.formatSmartTime(activity.startTime)}
              </span>
              <span class="chat-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${this.formatDistance(activity.distance)}
              </span>
            </div>
          </div>
        </div>
      `;
    },

    getUserChildAge() {
      const user = Storage.getUser();
      return user.childAge || 5;
    },

    aiConversationContext: {
      lastIntent: null,
      lastCategory: null,
      messageCount: 0,
      askedAge: false
    },

    sendAIMessage(text) {
      const input = document.getElementById('ai-chat-input');
      const messagesContainer = document.getElementById('ai-chat-messages');
      if (!messagesContainer) return;

      const messageText = text || input?.value?.trim();
      if (!messageText) return;

      if (input) input.value = '';

      const userMessage = `
        <div class="chat-message user-message">
          <div class="chat-bubble">
            <div class="chat-text">${messageText}</div>
          </div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', userMessage);
      this.scrollToBottom(messagesContainer);

      const typingIndicator = `
        <div class="chat-message ai-message" id="ai-typing-indicator">
          <div class="chat-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12l9-3"></path></svg>
          </div>
          <div class="chat-bubble">
            <div class="typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', typingIndicator);
      this.scrollToBottom(messagesContainer);

      this.aiConversationContext.messageCount++;

      setTimeout(() => {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) {
          indicator.remove();
        }

        const response = this.getAIResponse(messageText);
        messagesContainer.insertAdjacentHTML('beforeend', response);
        this.scrollToBottom(messagesContainer);
      }, 1200 + Math.random() * 800);
    },

    sendQuickReply(id, text) {
      const quickReplyMap = {
        refresh: '换一批推荐',
        nearby: '附近有什么好玩的',
        weekend: '周末有什么活动',
        age3: '适合3岁宝宝的活动'
      };
      this.sendAIMessage(quickReplyMap[id] || text);
    },

    isListening: false,
    voiceTimer: null,

    toggleVoiceInput() {
      if (this.isListening) {
        this.cancelVoiceInput();
      } else {
        this.startVoiceInput();
      }
    },

    startVoiceInput() {
      this.isListening = true;
      const overlay = document.getElementById('voice-listening-overlay');
      const voiceBtn = document.getElementById('ai-voice-btn');
      if (overlay) overlay.style.display = 'flex';
      if (voiceBtn) voiceBtn.classList.add('active');

      const voiceTexts = ['正在聆听...', '识别中...', '正在理解...'];
      let step = 0;
      const voiceTextEl = overlay?.querySelector('.voice-text');

      this.voiceTimer = setInterval(() => {
        step++;
        if (voiceTextEl && step < voiceTexts.length) {
          voiceTextEl.textContent = voiceTexts[step];
        }
      }, 800);

      setTimeout(() => {
        this.finishVoiceInput();
      }, 2500);
    },

    finishVoiceInput() {
      clearInterval(this.voiceTimer);
      this.isListening = false;

      const overlay = document.getElementById('voice-listening-overlay');
      const voiceBtn = document.getElementById('ai-voice-btn');
      if (overlay) overlay.style.display = 'none';
      if (voiceBtn) voiceBtn.classList.remove('active');

      const sampleInputs = [
        '附近有什么好玩的',
        '周末有什么活动',
        '适合3岁宝宝的活动',
        '手工活动推荐',
        '换一批推荐'
      ];
      const randomInput = sampleInputs[Math.floor(Math.random() * sampleInputs.length)];

      const input = document.getElementById('ai-chat-input');
      if (input) {
        input.value = randomInput;
        input.style.animation = 'none';
        setTimeout(() => {
          input.style.animation = 'typingFill 0.3s ease';
        }, 10);
      }

      setTimeout(() => {
        this.sendAIMessage(randomInput);
      }, 400);
    },

    cancelVoiceInput() {
      clearInterval(this.voiceTimer);
      this.isListening = false;
      const overlay = document.getElementById('voice-listening-overlay');
      const voiceBtn = document.getElementById('ai-voice-btn');
      if (overlay) overlay.style.display = 'none';
      if (voiceBtn) voiceBtn.classList.remove('active');
    },

    renderInspirationCard(card) {
      return `
        <div class="inspiration-card" style="background: ${card.gradient};" onclick="App.openInspiration('${card.id}')">
          <div class="inspiration-card-content">
            <div class="inspiration-card-top">
              <span class="inspiration-card-count">${card.activityCount}个活动</span>
            </div>
            <div class="inspiration-card-bottom">
              <h3 class="inspiration-card-title">${card.title}</h3>
              <p class="inspiration-card-subtitle">${card.subtitle}</p>
              <button class="inspiration-card-btn">
                查看详情
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    openInspiration(id) {
      const card = MockData.getInspirationCardById(id);
      if (!card) return;
      const firstActivityId = card.activities?.[0];
      if (firstActivityId) {
        Router.navigate(`/activity/${firstActivityId}`);
      }
    },

    refreshInspiration() {
      Toast.info('正在刷新灵感...');
      setTimeout(() => {
        this.refreshCurrentPage();
        Toast.success('已为您推荐新的灵感');
      }, 800);
    },

    scrollToBottom(element) {
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    },

    getAIResponse(userInput) {
      const ctx = this.aiConversationContext;
      const activities = MockData.getUpcomingActivities();
      const user = Storage.getUser();
      let recommendations = [];
      let responseText = '';

      const followUpPatterns = [
        { pattern: /还有吗|再来|换一批|更多|其他/, type: 'more' },
        { pattern: /附近|离我|近|距离/, type: 'nearby' },
        { pattern: /周末|周六|周日|礼拜/, type: 'weekend' },
        { pattern: /今天|明天|后天/, type: 'nearTime' },
        { pattern: /岁|年龄|宝宝多大|孩子/, type: 'age' },
        { pattern: /手工|画画|黏土|剪纸|制作/, type: 'craft' },
        { pattern: /音乐|舞蹈|演出|音乐会|音乐剧/, type: 'performance' },
        { pattern: /户外|公园|运动|自然|爬山|露营/, type: 'outdoor' },
        { pattern: /科学|实验|机器人|编程/, type: 'science' },
        { pattern: /阅读|绘本|故事|书店/, type: 'reading' },
        { pattern: /烘焙|做饭|美食|披萨|蛋糕/, type: 'baking' },
        { pattern: /你好|hi|hello|在吗/, type: 'greeting' },
        { pattern: /谢谢|感谢|多谢/, type: 'thanks' }
      ];

      let intentType = 'default';
      for (const { pattern, type } of followUpPatterns) {
        if (pattern.test(userInput)) {
          intentType = type;
          break;
        }
      }

      if (intentType === 'more') {
        if (ctx.lastIntent === 'nearby' || ctx.lastCategory) {
          const allRecs = [...activities].sort((a, b) => a.distance - b.distance);
          const startIdx = Math.min(3, allRecs.length - 3);
          recommendations = allRecs.slice(startIdx, startIdx + 3);
          responseText = '好的，再为您推荐几个：';
        } else if (ctx.lastIntent) {
          recommendations = this.getAIRecommendations(activities, user).slice(3, 6);
          responseText = '没问题，这是另外几个精选活动：';
        } else {
          recommendations = this.getAIRecommendations(activities, user).slice(0, 3);
          responseText = '为您推荐这些热门活动：';
        }
        return this.buildAIResponse(responseText, recommendations);
      }

      ctx.lastIntent = intentType;

      switch (intentType) {
        case 'greeting':
          ctx.askedAge = false;
          return this.buildAIResponse(`你好呀！我是你的趣享小助手~ 宝宝今年几岁啦？我可以为你推荐适合的活动哦！`, []);

        case 'thanks':
          return this.buildAIResponse('不客气~ 有任何问题随时问我哦！祝你和宝宝玩得开心 🎉', []);

        case 'weekend':
          ctx.lastCategory = 'weekend';
          recommendations = activities.filter(a => a.tags.includes('weekend')).slice(0, 3);
          responseText = '周末带娃好去处！推荐几个适合周末参加的活动：';
          break;

        case 'nearTime':
          recommendations = activities.slice(0, 3);
          responseText = '最近的活动都在这里啦：';
          break;

        case 'nearby':
          ctx.lastCategory = 'nearby';
          recommendations = [...activities].sort((a, b) => a.distance - b.distance).slice(0, 3);
          responseText = '附近的精彩活动来啦！按距离从近到远排序：';
          break;

        case 'age':
          ctx.askedAge = true;
          const childAge = this.getUserChildAge();
          recommendations = activities.filter(a => a.minAge <= childAge && a.maxAge >= childAge).slice(0, 3);
          responseText = `适合${childAge}岁宝宝的活动推荐：`;
          break;

        case 'craft':
          ctx.lastCategory = 'handcraft';
          recommendations = activities.filter(a => a.category === 'handcraft').slice(0, 3);
          responseText = '创意手工活动推荐，锻炼宝宝动手能力：';
          break;

        case 'performance':
          ctx.lastCategory = 'performance';
          recommendations = activities.filter(a => a.category === 'music' || a.category === 'dance').slice(0, 3);
          responseText = '音乐舞蹈演出推荐，培养宝宝艺术细胞：';
          break;

        case 'outdoor':
          ctx.lastCategory = 'outdoor';
          recommendations = activities.filter(a => a.category === 'outdoor').slice(0, 3);
          responseText = '户外活动推荐，让宝宝亲近大自然：';
          break;

        case 'science':
          ctx.lastCategory = 'science';
          recommendations = activities.filter(a => a.category === 'science').slice(0, 3);
          responseText = '科学探索活动推荐，激发宝宝求知欲：';
          break;

        case 'reading':
          ctx.lastCategory = 'reading';
          recommendations = activities.filter(a => a.category === 'reading').slice(0, 3);
          responseText = '绘本阅读活动推荐，培养阅读习惯：';
          break;

        case 'baking':
          ctx.lastCategory = 'baking';
          recommendations = activities.filter(a => a.category === 'baking').slice(0, 3);
          responseText = '美食烘焙体验，和宝宝一起动手做：';
          break;

        default:
          if (!ctx.askedAge && ctx.messageCount <= 2 && !user.preferences?.length) {
            ctx.askedAge = true;
            recommendations = this.getAIRecommendations(activities, user).slice(0, 2);
            responseText = '我先为您推荐几个热门活动~ 对了，宝宝今年几岁呀？我可以推荐更合适的！';
          } else {
            recommendations = this.getAIRecommendations(activities, user).slice(0, 3);
            responseText = '根据您的需求，为您推荐这些活动：';
          }
      }

      return this.buildAIResponse(responseText, recommendations);
    },

    buildAIResponse(text, activities) {
      const favorites = Storage.getFavorites();
      const activitiesHtml = activities.length > 0 
        ? activities.map(activity => this.renderChatActivityCard(activity, favorites)).join('')
        : '<div style="color: var(--color-muted); font-size: 13px; padding: 8px;">暂无相关活动</div>';

      return `
        <div class="chat-message ai-message">
          <div class="chat-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12l9-3"></path></svg>
          </div>
          <div class="chat-bubble">
            <div class="chat-text">${text}</div>
            ${activities.length > 0 ? `<div class="chat-activities">${activitiesHtml}</div>` : ''}
          </div>
        </div>
      `;
    },

    showFilterPanel(type) {
      const mask = document.getElementById('filter-panel-mask');
      const panel = document.getElementById('filter-panel');
      const title = document.getElementById('filter-panel-title');
      const content = document.getElementById('filter-panel-content');

      if (!mask || !panel || !title || !content) return;

      mask.classList.add('show');

      const titles = { distance: '距离范围', time: '活动时间', category: '活动类型', age: '适龄范围' };
      title.textContent = titles[type] || '筛选';

      let optionsHtml = '';
      const currentValue = App.filters?.[type] || 'all';

      switch (type) {
        case 'distance':
          const distOptions = [
            { value: 'all', label: '全城' },
            { value: '1', label: '1km以内' },
            { value: '3', label: '3km以内' },
            { value: '5', label: '5km以内' }
          ];
          optionsHtml = distOptions.map(opt => `
            <button class="filter-option ${currentValue === opt.value ? 'active' : ''}" onclick="App.setFilterAndClose('distance', '${opt.value}')">
              <span>${opt.label}</span>
              ${currentValue === opt.value ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </button>
          `).join('');
          break;
        case 'time':
          const timeOptions = [
            { value: 'all', label: '全部时间' },
            { value: 'today', label: '今天' },
            { value: 'tomorrow', label: '明天' },
            { value: 'weekend', label: '本周末' },
            { value: '7days', label: '未来7天' }
          ];
          optionsHtml = timeOptions.map(opt => `
            <button class="filter-option ${currentValue === opt.value ? 'active' : ''}" onclick="App.setFilterAndClose('time', '${opt.value}')">
              <span>${opt.label}</span>
              ${currentValue === opt.value ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </button>
          `).join('');
          break;
        case 'category':
          optionsHtml = `<button class="filter-option ${currentValue === 'all' ? 'active' : ''}" onclick="App.setFilterAndClose('category', 'all')">
            <span>全部类型</span>
            ${currentValue === 'all' ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </button>` + MockData.categories.map(cat => `
            <button class="filter-option ${currentValue === cat.id ? 'active' : ''}" onclick="App.setFilterAndClose('category', '${cat.id}')">
              <span>${cat.name}</span>
              ${currentValue === cat.id ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </button>
          `).join('');
          break;
        case 'age':
          const ageOptions = [
            { value: 'all', label: '全年龄段' },
            { value: '0-3', label: '0-3岁' },
            { value: '3-6', label: '3-6岁' },
            { value: '6-12', label: '6-12岁' }
          ];
          optionsHtml = ageOptions.map(opt => `
            <button class="filter-option ${currentValue === opt.value ? 'active' : ''}" onclick="App.setFilterAndClose('age', '${opt.value}')">
              <span>${opt.label}</span>
              ${currentValue === opt.value ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </button>
          `).join('');
          break;
      }

      content.innerHTML = optionsHtml;
      requestAnimationFrame(() => {
        panel.classList.add('show');
      });
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    },

    closeFilterPanel() {
      const mask = document.getElementById('filter-panel-mask');
      const panel = document.getElementById('filter-panel');
      if (mask) mask.classList.remove('show');
      if (panel) panel.classList.remove('show');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    },

    setFilterAndClose(type, value) {
      App.filters[type] = value;
      App.currentPage = 1;
      this.closeFilterPanel();
      this.refreshCurrentPage();
    },

    renderAIActivityCard(activity, favorites) {
      const isFavorite = favorites.includes(activity.id);
      const category = MockData.getCategoryById(activity.category);
      const remainingSlots = activity.maxSlots - activity.bookedSlots;

      return `
        <div class="ai-card" onclick="Router.navigate('/activity/${activity.id}')">
          <div class="ai-card-cover">
            <img src="${activity.coverImage}" alt="${activity.title}" />
            <button class="card-fav ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${activity.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <span class="ai-card-tag">${category?.name || ''}</span>
          </div>
          <div class="ai-card-content">
            <h3 class="ai-card-title">${activity.title}</h3>
            <div class="ai-card-meta">
              <span class="ai-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${this.formatSmartTime(activity.startTime)}
              </span>
              <span class="ai-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${this.formatDistance(activity.distance)}
              </span>
            </div>
            <div class="ai-card-highlights">
              ${activity.highlights?.slice(0, 2).map(h => `<span class="highlight-tag">${h}</span>`).join('') || ''}
            </div>
          </div>
        </div>
      `;
    },

    renderSearch(params) {
      const category = params?.params?.category || '';
      const tag = params?.params?.tag || '';
      const query = params?.params?.q || '';
      const sortBy = params?.params?.sort || 'relevance';
      const searchHistory = Storage.getSearchHistory();
      const favorites = Storage.getFavorites();
      const hotSearches = ['亲子手工', '周末活动', '绘本阅读', '科学实验', '户外露营', '烘焙体验', '舞蹈课', '音乐会', '跳蚤市场', '安全教育'];
      
      let activities = MockData.getUpcomingActivities();

      if (query) {
        activities = MockData.searchActivities(query);
      } else if (category) {
        activities = MockData.getActivitiesByCategory(category);
      } else if (tag) {
        activities = MockData.getActivitiesByTag(tag);
      }

      activities = this.sortActivities(activities, sortBy === 'relevance' ? 'distance' : sortBy);

      return `
        <div class="page-search">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.back()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <div class="search-input-wrap">
                <input type="text" class="search-input" id="search-input" placeholder="搜索活动、地点、关键词..." 
                  value="${query}" 
                  oninput="App.handleSearchInput(this)" 
                  onkeypress="if(event.key === 'Enter') App.doSearch(this.value)"
                  aria-label="搜索活动" />
                <button type="button" class="search-clear-btn" style="display: none;" aria-label="清除搜索内容">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <button class="search-btn" onclick="App.doSearch(document.getElementById('search-input').value)" aria-label="搜索">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
              </div>
            </div>
          </header>

          <main class="main-content">
            ${!query && !category && !tag ? `
              <div class="suggestions" id="search-suggestions" style="display: none;"></div>
              
              <section class="section">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                  <h3 class="section-title">搜索历史</h3>
                  ${searchHistory.length > 0 ? `<button class="section-more" onclick="App.clearAllSearchHistory()">清空</button>` : ''}
                </div>
                <div class="search-history-list">
                  ${searchHistory.length > 0 ? searchHistory.map(q => `
                    <div class="search-history-item">
                      <button class="history-btn" onclick="App.doSearch('${q}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${q}</span>
                      </button>
                      <button class="delete-history-btn" onclick="event.stopPropagation(); App.removeSearchHistoryItem('${q}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  `).join('') : '<span style="color: var(--color-muted); font-size: 12px;">暂无搜索历史</span>'}
                </div>
              </section>

              <section class="hot-searches">
                <h3 class="hot-search-title">热搜榜</h3>
                <div class="hot-search-list">
                  ${hotSearches.slice(0, 10).map((term, index) => `
                    <div class="hot-search-item" onclick="App.doSearch('${term}')">
                      <span class="hot-search-rank ${index < 3 ? 'top' : ''}">${index + 1}</span>
                      <span>${term}</span>
                    </div>
                  `).join('')}
                </div>
              </section>

              <section class="section">
                <h3 class="section-title">分类筛选</h3>
                <div class="category-filter">
                  <button class="filter-item ${!category ? 'active' : ''}" onclick="Router.navigate('/search')">全部</button>
                  ${MockData.categories.map(cat => `
                    <button class="filter-item ${category === cat.id ? 'active' : ''}" onclick="Router.navigate('/search?category=${cat.id}')">${cat.name}</button>
                  `).join('')}
                </div>
              </section>
            ` : `
              <div class="search-results-header">
                <span class="search-results-count">共找到 ${activities.length} 个活动</span>
                <div class="sort-options">
                  <button class="sort-option ${sortBy === 'relevance' ? 'active' : ''}" onclick="App.setSearchSort('relevance')">相关度</button>
                  <button class="sort-option ${sortBy === 'distance' ? 'active' : ''}" onclick="App.setSearchSort('distance')">距离最近</button>
                  <button class="sort-option ${sortBy === 'upcoming' ? 'active' : ''}" onclick="App.setSearchSort('upcoming')">时间最近</button>
                  <button class="sort-option ${sortBy === 'popular' ? 'active' : ''}" onclick="App.setSearchSort('popular')">热度最高</button>
                </div>
              </div>

              <div class="activity-list">
                ${activities.length > 0 ? activities.map(activity => {
                  const cardHtml = this.renderActivityCard(activity, favorites);
                  if (query) {
                    return cardHtml.replace(
                      new RegExp(`(<h3[^>]*>)(.*?)(<\/h3>)`, 'g'),
                      (match, start, content, end) => `${start}${this.highlightKeyword(content, query)}${end}`
                    ).replace(
                      new RegExp(`(<p[^>]*class="[^"]*card-desc[^"]*"[^>]*>)(.*?)(<\/p>)`, 'g'),
                      (match, start, content, end) => `${start}${this.highlightKeyword(content, query)}${end}`
                    );
                  }
                  return cardHtml;
                }).join('') : `
                  ${this.renderEmptyStatePremium('search', '暂无相关活动', '换个关键词试试，或浏览热门活动', '浏览热门', "Router.navigate('/home')")}
                `}
              </div>
            `}
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderActivity(params) {
      const id = params?.params?.id || '';
      const activity = MockData.getActivityById(id);
      if (!activity) return this.renderNotFound();

      const favorites = Storage.getFavorites();
      const isFavorite = favorites.includes(id);
      const hasBooked = Storage.hasBooked(id);
      const hasSchedule = Storage.hasSchedule(id);
      const category = MockData.getCategoryById(activity.category);
      const status = this.getActivityStatus(activity);
      const remainingSlots = activity.maxSlots - activity.bookedSlots;
      const isSoldOut = remainingSlots <= 0;
      const relatedActivities = this.getRelatedActivities(activity);
      const organizerName = typeof activity.organizer === 'object' ? activity.organizer.name : activity.organizer;
      const organizerCount = typeof activity.organizer === 'object' ? activity.organizer.activityCount : 0;
      const organizerIntro = typeof activity.organizer === 'object' ? activity.organizer.intro : '';

      return `
        <div class="page-activity">
          <header class="header header-glass">
            <div class="header-content">
              <button class="back-btn" onclick="Router.back()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="App.toggleFavorite('${id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
              <button class="nav-btn" onclick="App.showShareModal('${id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>
          </header>

          ${status === 'cancelled' ? '<div class="status-banner">活动已取消</div>' : ''}

          <main class="main-content">
            <div class="activity-cover-v2">
              <img src="${activity.coverImage}" alt="${activity.title}" />
              <div class="cover-overlay-v2">
                <div class="cover-tags">
                  <span class="cover-tag">${category?.name || activity.category}</span>
                  ${activity.tags.map(t => {
                    const sceneTag = MockData.getSceneTagById(t);
                    return `<span class="cover-tag cover-tag-secondary">${sceneTag?.name || t}</span>`;
                  }).join('')}
                </div>
                <span class="status-badge ${status}">${this.getStatusText(status)}</span>
              </div>
            </div>

            <div class="activity-info-v2">
              <h1 class="activity-title-v2">${activity.title}</h1>
              
              <div class="highlights-row">
                ${activity.highlights?.map(h => `<span class="highlight-badge">${h}</span>`).join('') || ''}
              </div>

              <div class="activity-desc-section">
                <p class="activity-desc-v2 collapsed" id="activity-desc-${id}">${activity.description.replace(/\n/g, '<br>')}</p>
                <button class="toggle-expand-v2" id="toggle-btn-${id}" onclick="App.toggleDesc('${id}')">展开全文</button>
              </div>

              <div class="info-section">
                <div class="info-item-row">
                  <div class="info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">活动时间</span>
                    <span class="info-value">${this.formatSmartTime(activity.startTime)} - ${this.formatTime(activity.endTime)}</span>
                  </div>
                </div>

                <div class="info-item-row" onclick="App.showMapPreview('${id}')">
                  <div class="info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">活动地点</span>
                    <span class="info-value">${activity.address}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>

                <div class="info-item-row">
                  <div class="info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">距离</span>
                    <span class="info-value">${this.formatDistance(activity.distance)}</span>
                  </div>
                </div>

                <div class="info-item-row">
                  <div class="info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">适龄范围</span>
                    <span class="info-value">${activity.minAge}-${activity.maxAge}岁</span>
                  </div>
                </div>
              </div>

              <div class="organizer-section">
                <div class="organizer-header">
                  <div class="organizer-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <div class="organizer-info">
                    <span class="organizer-name">${organizerName}</span>
                    <span class="organizer-meta">${organizerCount}场活动 · ${organizerIntro ? '优质主办方' : ''}</span>
                  </div>
                </div>
                ${organizerIntro ? `<p class="organizer-desc">${organizerIntro}</p>` : ''}
              </div>

              <div class="booking-section">
                <div class="booking-header">
                  <span class="booking-title">报名情况</span>
                  <span class="booking-count">${activity.bookedSlots}/${activity.maxSlots}人</span>
                </div>
                <div class="progress-bar-v2">
                  <div class="progress-fill-v2" style="width: ${(activity.bookedSlots / activity.maxSlots) * 100}%"></div>
                </div>
                <div class="booking-footer">
                  <span class="slots-info">剩余 <strong style="color: ${isSoldOut ? '#E85D4E' : '#2A9D8F'}">${remainingSlots}</strong> 个名额</span>
                  ${remainingSlots <= 5 && !isSoldOut ? '<span class="urgent-tag">即将满员</span>' : ''}
                </div>
              </div>

              ${activity.price !== undefined ? `
              <div class="detail-section">
                <h3 class="detail-section-title">活动价格</h3>
                <div class="price-info">
                  ${activity.price === 0 ? '<span class="price-free">免费</span>' : `<span class="price-value">¥${activity.price}</span><span class="price-unit">/人</span>`}
                </div>
              </div>
              ` : ''}

              <div class="detail-section">
                <h3 class="detail-section-title">活动亮点</h3>
                <div class="highlights-grid">
                  ${(activity.activityHighlights || activity.highlights || []).slice(0, 6).map((highlight, idx) => `
                    <div class="highlight-item">
                      <div class="highlight-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          ${this.getHighlightIcon(idx)}
                        </svg>
                      </div>
                      <span>${highlight}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="detail-section">
                <h3 class="detail-section-title">交通指南</h3>
                <div class="transport-list">
                  <div class="transport-item">
                    <div class="transport-icon subway">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M4 11h16"></path><circle cx="8" cy="15" r="1"></circle><circle cx="16" cy="15" r="1"></circle><path d="M8 19v2"></path><path d="M16 19v2"></path></svg>
                    </div>
                    <div class="transport-content">
                      <span class="transport-label">地铁</span>
                      <span class="transport-value">${activity.transport?.subway || '暂无地铁信息'}</span>
                    </div>
                  </div>
                  <div class="transport-item">
                    <div class="transport-icon bus">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M2 10h20"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>
                    </div>
                    <div class="transport-content">
                      <span class="transport-label">公交</span>
                      <span class="transport-value">${activity.transport?.bus || '暂无公交信息'}</span>
                    </div>
                  </div>
                  <div class="transport-item">
                    <div class="transport-icon parking">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 7v10"></path><path d="M15 7v10"></path></svg>
                    </div>
                    <div class="transport-content">
                      <span class="transport-label">停车</span>
                      <span class="transport-value">${activity.transport?.parking || '暂无停车信息'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3 class="detail-section-title">周边设施</h3>
                <div class="facilities-tags">
                  ${(activity.facilities || []).map(facility => `
                    <span class="facility-tag">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ${facility}
                    </span>
                  `).join('')}
                </div>
              </div>

              <div class="detail-section">
                <h3 class="detail-section-title">温馨提示</h3>
                <ul class="tips-list">
                  ${(activity.tips || []).map(tip => `
                    <li class="tip-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      ${tip}
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div class="detail-section">
                <div class="section-header">
                  <h3 class="detail-section-title">家长评价</h3>
                  <span class="review-count">${activity.reviews?.length || 0}条评价</span>
                </div>
                <div class="reviews-list">
                  ${(activity.reviews || []).slice(0, 4).map(review => `
                    <div class="review-item">
                      <div class="review-header">
                        <div class="review-avatar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div class="review-user-info">
                          <span class="review-user">${review.user}</span>
                          <div class="review-rating">
                            ${Array.from({ length: 5 }).map((_, i) => `
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${i < review.rating ? '#F5A623' : 'none'}" stroke="${i < review.rating ? '#F5A623' : '#E8DFD5'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            `).join('')}
                          </div>
                        </div>
                        <span class="review-time">${review.time}</span>
                      </div>
                      <p class="review-content">${review.content}</p>
                      <div class="review-footer">
                        <button class="review-like-btn" onclick="event.stopPropagation(); App.likeReview('${review.id}')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          <span>${review.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="map-preview" id="map-preview-${id}" style="display: none;">
                <div class="map-preview-header">
                  <span>地图预览</span>
                  <button class="map-preview-btn" onclick="App.openMapApp('${activity.address}')">打开地图</button>
                </div>
                <div class="map-placeholder">${activity.address}</div>
              </div>
            </div>

            ${relatedActivities.length > 0 ? `
              <div class="related-section">
                <div class="related-header">
                  <h3 class="related-title">猜你喜欢</h3>
                  <button class="section-more" onclick="Router.navigate('/search')">更多</button>
                </div>
                <div class="related-list-v2">
                  ${relatedActivities.map(rel => this.renderAIActivityCard(rel, favorites)).join('')}
                </div>
              </div>
            ` : ''}
          </main>

          <div class="detail-header-actions">
            <button class="action-btn" onclick="App.shareActivity('${id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          <div class="bottom-bar bottom-bar-glass detail-bottom-bar">
            <button class="bottom-action-item" onclick="App.toggleFavorite('${id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? '#E85D4E' : 'none'}" stroke="${isFavorite ? '#E85D4E' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span>${isFavorite ? '已收藏' : '收藏'}</span>
            </button>
            <button class="bottom-action-item" onclick="App.setActivityReminder('${id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span>提醒</span>
            </button>
            <button class="bottom-action-item" onclick="App.addToSchedule('${id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${hasSchedule ? '已添加' : '日程'}</span>
            </button>
            ${status === 'cancelled' ? '' : `
              <button class="btn-primary-v2 bottom-book-btn ${hasBooked || isSoldOut || status === 'ended' ? 'disabled' : ''}" onclick="App.bookActivity('${id}')">
                ${hasBooked ? '已预约' : isSoldOut ? '名额已满' : status === 'ended' ? '活动已结束' : '立即预约'}
              </button>
            `}
          </div>
        </div>`;
    },

    renderFavorites() {
      const favorites = Storage.getFavorites();
      let favActivities = MockData.activities.filter(a => favorites.includes(a.id));

      if (this.favoritesFilterTag !== 'all') {
        favActivities = favActivities.filter(a => a.category === this.favoritesFilterTag);
      }

      if (this.favoritesSortBy === 'time') {
        favActivities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      } else if (this.favoritesSortBy === 'hot') {
        favActivities.sort((a, b) => b.bookedSlots - a.bookedSlots);
      } else if (this.favoritesSortBy === 'distance') {
        favActivities.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      const categories = ['all', ...new Set(MockData.activities.map(a => a.category))];

      return `
        <div class="page-favorites">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/profile')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">我的收藏</h1>
              <button class="header-action-btn" onclick="App.toggleBatchSelect()">
                ${this.batchSelectMode ? '取消' : '管理'}
              </button>
            </div>
          </header>

          ${favActivities.length > 0 ? `
            <div class="favorites-toolbar">
              <div class="sort-options">
                <button class="sort-btn ${this.favoritesSortBy === 'time' ? 'active' : ''}" onclick="App.setFavoritesSort('time')">最新</button>
                <button class="sort-btn ${this.favoritesSortBy === 'hot' ? 'active' : ''}" onclick="App.setFavoritesSort('hot')">最热</button>
                <button class="sort-btn ${this.favoritesSortBy === 'distance' ? 'active' : ''}" onclick="App.setFavoritesSort('distance')">最近</button>
              </div>
            </div>

            <div class="filter-chips">
              ${categories.map(cat => `
                <button class="filter-chip ${this.favoritesFilterTag === cat ? 'active' : ''}" onclick="App.setFavoritesFilter('${cat}')">
                  ${cat === 'all' ? '全部' : MockData.categories.find(c => c.id === cat)?.name || cat}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <main class="main-content">
            <div class="activity-list">
              ${favActivities.length > 0 ? favActivities.map(activity => `
                <div class="fav-item-wrapper">
                  ${this.batchSelectMode ? `
                    <div class="batch-checkbox ${this.batchSelectedIds.includes(activity.id) ? 'checked' : ''}" onclick="App.toggleBatchSelectItem('${activity.id}')">
                      ${this.batchSelectedIds.includes(activity.id) ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    </div>
                  ` : ''}
                  ${this.renderActivityCard(activity, favorites)}
                </div>
              `).join('') : `
                ${this.renderEmptyStatePremium('favorites', '还没有收藏活动', '发现感兴趣的活动，点击收藏按钮保存下来吧', '去发现活动', "Router.navigate('/search')")}
              `}
            </div>
          </main>

          ${this.batchSelectMode && favActivities.length > 0 ? `
            <div class="batch-action-bar">
              <button class="batch-select-all" onclick="App.batchSelectAllFavorites()">
                ${this.batchSelectedIds.length === favActivities.length ? '取消全选' : '全选'}
              </button>
              <span class="batch-selected-count">已选 ${this.batchSelectedIds.length} 项</span>
              <button class="batch-delete-btn" onclick="App.batchUnfavorite()">取消收藏</button>
            </div>
          ` : ''}

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderBookings() {
      const bookings = Storage.getBookings();
      const allBookings = bookings.map(b => ({
        ...MockData.getActivityById(b.activityId),
        bookingId: b.id,
        bookingStatus: b.status || 'confirmed'
      })).filter(Boolean);

      let filteredBookings = allBookings;
      if (this.bookingTab !== 'all') {
        filteredBookings = allBookings.filter(b => b.bookingStatus === this.bookingTab);
      }

      const getStatusLabel = (status) => {
        const labels = {
          confirmed: '待参加',
          completed: '已结束',
          cancelled: '已取消',
          pending: '待确认'
        };
        return labels[status] || status;
      };

      const getStatusClass = (status) => {
        const classes = {
          confirmed: 'status-confirmed',
          completed: 'status-completed',
          cancelled: 'status-cancelled',
          pending: 'status-pending'
        };
        return classes[status] || '';
      };

      return `
        <div class="page-bookings">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/profile')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">我的预约</h1>
              <div class="placeholder"></div>
            </div>
          </header>

          <div class="booking-tabs">
            <button class="booking-tab ${this.bookingTab === 'all' ? 'active' : ''}" onclick="App.setBookingTab('all')">全部</button>
            <button class="booking-tab ${this.bookingTab === 'confirmed' ? 'active' : ''}" onclick="App.setBookingTab('confirmed')">待参加</button>
            <button class="booking-tab ${this.bookingTab === 'completed' ? 'active' : ''}" onclick="App.setBookingTab('completed')">已结束</button>
            <button class="booking-tab ${this.bookingTab === 'cancelled' ? 'active' : ''}" onclick="App.setBookingTab('cancelled')">已取消</button>
          </div>

          <main class="main-content">
            <div class="booking-list">
              ${filteredBookings.length > 0 ? filteredBookings.map(activity => `
                <div class="booking-item card">
                  <div class="booking-item-header" onclick="Router.navigate('/activity/${activity.id}')">
                    <span class="booking-status-tag ${getStatusClass(activity.bookingStatus)}">${getStatusLabel(activity.bookingStatus)}</span>
                  </div>
                  <div class="booking-item-content" onclick="Router.navigate('/activity/${activity.id}')">
                    <img src="${activity.coverImage}" alt="${activity.title}" />
                    <div class="booking-info">
                      <h3>${activity.title}</h3>
                      <div class="booking-meta">
                        <span>${this.formatDateTime(activity.startTime)}</span>
                        <span>${activity.address}</span>
                      </div>
                    </div>
                  </div>
                  ${activity.bookingStatus === 'confirmed' ? `
                    <div class="booking-item-actions">
                      <button class="btn-cancel-booking" onclick="event.stopPropagation(); App.cancelBooking('${activity.bookingId}')">取消预约</button>
                    </div>
                  ` : ''}
                </div>
              `).join('') : `
                ${this.renderEmptyStatePremium('bookings', `暂无${this.bookingTab === 'all' ? '' : getStatusLabel(this.bookingTab)}预约`, '去发现更多有趣的活动吧', '去发现活动', "Router.navigate('/search')")}
              `}
            </div>
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderSchedule() {
      const schedules = Storage.getSchedules();
      const scheduleActivities = schedules.map(s => ({
        ...MockData.getActivityById(s.activityId),
        scheduleId: s.id,
        createdAt: s.createdAt
      })).filter(Boolean);
      
      const groupedActivities = this.groupActivitiesByDate(scheduleActivities);

      return `
        <div class="page-schedule">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/home')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">我的日程</h1>
              <button class="section-more" onclick="App.exportCalendar()">导出日历</button>
            </div>
          </header>

          <main class="main-content">
            <div class="schedule-list">
              ${scheduleActivities.length > 0 ? '<div class="schedule-timeline"></div>' : ''}
              ${scheduleActivities.length > 0 ? Object.keys(groupedActivities).map(groupName => `
                <div class="schedule-group">
                  <h3 class="schedule-group-title">${groupName}</h3>
                  ${groupedActivities[groupName].map(activity => {
                    const status = this.getActivityStatus(activity);
                    return `
                      <div class="schedule-item card" onclick="Router.navigate('/activity/${activity.id}')">
                        <div class="schedule-date">
                          <span class="date-day">${new Date(activity.startTime).getDate()}</span>
                          <span class="date-month">${new Date(activity.startTime).getMonth() + 1}月</span>
                        </div>
                        <div class="schedule-info">
                          <h3>${activity.title}</h3>
                          <div class="schedule-time">${this.formatTime(activity.startTime)} - ${this.formatTime(activity.endTime)}</div>
                          <div class="schedule-location">${activity.address}</div>
                          <span class="schedule-status ${status}">${this.getStatusText(status)}</span>
                        </div>
                        <button class="btn-text" onclick="event.stopPropagation(); App.removeSchedule('${activity.scheduleId}')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              `).join('') : `
                ${this.renderEmptyStatePremium('schedule', '暂无日程安排', '添加感兴趣的活动，规划你的精彩行程', '去添加', "Router.navigate('/search')")}
              `}
            </div>

            ${scheduleActivities.length > 0 ? `
              <div class="schedule-actions">
                <button class="btn-outline" onclick="App.showReminderSettings()">提醒设置</button>
              </div>
            ` : ''}
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderMessages() {
      const messages = Storage.getMessages();
      const category = Router.getQueryParam('category') || 'all';
      
      const categories = [
        { id: 'all', name: '全部', count: messages.length },
        { id: 'system', name: '系统', count: messages.filter(m => m.type === 'system').length },
        { id: 'subscription', name: '订阅', count: messages.filter(m => m.type === 'subscription').length },
        { id: 'reminder', name: '提醒', count: messages.filter(m => m.type === 'reminder').length },
        { id: 'review', name: '审核', count: messages.filter(m => m.type === 'review').length }
      ];

      const filteredMessages = category === 'all' 
        ? messages 
        : messages.filter(m => m.type === category);

      const getMessageAction = (msg) => {
        switch (msg.type) {
          case 'subscription':
            return 'Router.navigate(\'/search?category=handcraft\')';
          case 'reminder':
            return 'Router.navigate(\'/schedule\')';
          case 'review':
            return 'Router.navigate(\'/bookings\')';
          default:
            return '';
        }
      };

      return `
        <div class="page-messages">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/profile')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">消息中心</h1>
              <button class="section-more" onclick="Storage.markAllAsRead(); Router.navigate('/messages')">全部已读</button>
            </div>
          </header>

          <main class="main-content">
            <div class="filter-row" style="margin-bottom: var(--spacing-md);">
              ${categories.map(cat => `
                <button class="filter-item ${category === cat.id ? 'active' : ''}" onclick="Router.navigate('/messages?category=${cat.id}')">
                  ${cat.name}${cat.count > 0 ? `(${cat.count})` : ''}
                </button>
              `).join('')}
            </div>

            <div class="message-list">
              ${filteredMessages.length > 0 ? filteredMessages.map(msg => `
                <div class="message-item card ${msg.read ? '' : 'unread'}" onclick="Storage.markAsRead('${msg.id}'); ${getMessageAction(msg)}">
                  <div class="message-icon">
                    ${this.getMessageIcon(msg.type)}
                  </div>
                  <div class="message-content">
                    <h3>${msg.title}</h3>
                    <p>${msg.content}</p>
                    <span class="message-time">${this.formatDate(msg.createdAt)}</span>
                  </div>
                  ${!msg.read ? '<span class="unread-dot"></span>' : ''}
                </div>
              `).join('') : `
                ${this.renderEmptyStatePremium('messages', '暂无消息', '暂无新的消息通知，去发现更多有趣活动吧')}
              `}
            </div>
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderProfile() {
      const user = Storage.getUser();
      const favorites = Storage.getFavorites();
      const bookings = Storage.getBookings();
      const schedules = Storage.getSchedules();

      return `
        <div class="page-profile">
          <header class="profile-header profile-header-pink">
            <div class="profile-info">
              <div class="avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E85D4E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div class="profile-detail">
                <h2>${user.name}</h2>
                <p>${user.location}</p>
                <p>孩子年龄：${user.childAge}岁</p>
              </div>
            </div>
          </header>

          <main class="main-content">
            <div class="stats-row">
              <button class="stat-item" onclick="Router.navigate('/favorites')">
                <span class="stat-value">${favorites.length}</span>
                <span class="stat-label">收藏</span>
              </button>
              <button class="stat-item" onclick="Router.navigate('/bookings')">
                <span class="stat-value">${bookings.length}</span>
                <span class="stat-label">预约</span>
              </button>
              <button class="stat-item" onclick="Router.navigate('/schedule')">
                <span class="stat-value">${schedules.length}</span>
                <span class="stat-label">日程</span>
              </button>
            </div>

            <div class="menu-list">
              <button class="menu-item" onclick="Router.navigate('/favorites')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span>我的收藏</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="Router.navigate('/bookings')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"></path><polyline points="13 10 13 14 17 14"></polyline></svg>
                <span>我的预约</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="Router.navigate('/schedule')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>日程管理</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="Router.navigate('/messages')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span>我的消息</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="Router.navigate('/subscription')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path><line x1="12" y1="10" x2="12" y2="10.01"></line></svg>
                <span>我的订阅</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="Router.navigate('/settings')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>设置</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="App.showFeatureUnderDevelopment()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>商家入驻</span>
                <span class="menu-badge">开发中</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              <button class="menu-item" onclick="App.showFeatureUnderDevelopment()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span>意见反馈</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    showFeatureUnderDevelopment() {
      Toast.info('功能开发中，敬请期待');
    },

    renderSubscription() {
      const subscriptions = Storage.getSubscriptions();
      const allCategories = MockData.categories;
      const allSceneTags = MockData.sceneTags;
      const maxSubscriptions = 10;
      const subscribedCategories = allCategories.filter(c => subscriptions.includes(c.id));
      const subscribedSceneTags = allSceneTags.filter(t => subscriptions.includes(t.id));
      const unsubscribedCategories = allCategories.filter(c => !subscriptions.includes(c.id));
      const unsubscribedSceneTags = allSceneTags.filter(t => !subscriptions.includes(t.id));

      return `
        <div class="page-subscription">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/profile')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">订阅管理</h1>
              <div class="placeholder"></div>
            </div>
          </header>

          <main class="main-content">
            <div class="subscription-section">
              <h3 class="subscription-title">我的订阅 <span class="subscription-count">(${subscriptions.length}/${maxSubscriptions})</span></h3>
              ${subscriptions.length > 0 ? `
                <div class="subscription-grid">
                  ${subscribedCategories.map(cat => `
                    <button class="subscription-tag active" onclick="App.toggleSubscription('${cat.id}')">
                      ${cat.name}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  `).join('')}
                  ${subscribedSceneTags.map(tag => `
                    <button class="subscription-tag active" onclick="App.toggleSubscription('${tag.id}')">
                      ${tag.name}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  `).join('')}
                </div>
              ` : `
                <div class="empty-state slide-up" style="padding: 40px 20px;">
                  <svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 120px; height: 90px; margin-bottom: 16px;">
                    <circle cx="100" cy="70" r="45" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2"/>
                    <path d="M75 70L92 87L125 55" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M60 110L140 110" stroke="#81C784" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>
                  </svg>
                  <div class="empty-title">暂无订阅标签</div>
                  <div class="empty-desc">选择感兴趣的标签，获取活动推送</div>
                </div>
              `}
            </div>

            <div class="subscription-section">
              <h3 class="subscription-title">分类标签</h3>
              <div class="subscription-grid">
                ${unsubscribedCategories.map(cat => `
                  <button class="subscription-tag subscription-category ${subscriptions.length >= maxSubscriptions ? 'disabled' : ''}" onclick="App.toggleSubscription('${cat.id}')">
                    ${cat.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="subscription-section">
              <h3 class="subscription-title">场景标签</h3>
              <div class="subscription-grid">
                ${unsubscribedSceneTags.map(tag => `
                  <button class="subscription-tag subscription-scene ${subscriptions.length >= maxSubscriptions ? 'disabled' : ''}" onclick="App.toggleSubscription('${tag.id}')">
                    <span class="tag-dot" style="background-color: ${tag.color}"></span>
                    ${tag.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <div style="background-color: #FFF9E6; padding: 12px; border-radius: 8px; margin-top: 16px;">
              <p style="font-size: 12px; color: #F5A623; line-height: 1.5;">
                订阅标签后，我们会在有相关活动时通知您。最多订阅${maxSubscriptions}个标签。
              </p>
            </div>
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    plannerState: {
      step: 1,
      selectedDate: 'tomorrow',
      selectedDuration: 'full',
      selectedAge: '3-6',
      selectedPreferences: [],
      generatedItinerary: null,
      isGenerating: false
    },

    renderPlanner() {
      const state = this.plannerState;

      return `
        <div class="page-planner">
          <header class="header header-glass">
            <div class="header-content">
              <button class="back-btn" onclick="Router.back()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">智能规划</h1>
              <div class="placeholder"></div>
            </div>
          </header>

          <main class="main-content">
            <div class="planner-stepper">
              <div class="stepper-item ${state.step >= 1 ? 'active' : ''} ${state.step > 1 ? 'done' : ''}">
                <div class="stepper-circle">
                  ${state.step > 1 ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '1'}
                </div>
                <span>选择日期</span>
              </div>
              <div class="stepper-line ${state.step > 1 ? 'active' : ''}"></div>
              <div class="stepper-item ${state.step >= 2 ? 'active' : ''} ${state.step > 2 ? 'done' : ''}">
                <div class="stepper-circle">
                  ${state.step > 2 ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '2'}
                </div>
                <span>选择偏好</span>
              </div>
              <div class="stepper-line ${state.step > 2 ? 'active' : ''}"></div>
              <div class="stepper-item ${state.step >= 3 ? 'active' : ''}">
                <div class="stepper-circle">3</div>
                <span>生成行程</span>
              </div>
            </div>

            ${state.step === 1 ? this.renderPlannerStep1() : ''}
            ${state.step === 2 ? this.renderPlannerStep2() : ''}
            ${state.step === 3 ? this.renderPlannerStep3() : ''}
          </main>

          ${state.step < 3 ? `
            <div class="planner-bottom-bar">
              <button class="planner-prev-btn ${state.step === 1 ? 'hidden' : ''}" onclick="App.plannerPrevStep()">
                上一步
              </button>
              <button class="planner-next-btn" onclick="App.plannerNextStep()">
                ${state.step === 2 ? '开始生成' : '下一步'}
              </button>
            </div>
          ` : ''}

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>`;
    },

    renderPlannerStep1() {
      const state = this.plannerState;
      const dateOptions = [
        { id: 'today', label: '今天', desc: '当日行程' },
        { id: 'tomorrow', label: '明天', desc: '提前规划' },
        { id: 'weekend', label: '周末', desc: '放松时光' },
        { id: 'custom', label: '自定义', desc: '选择日期' }
      ];

      const durationOptions = [
        { id: 'half', label: '半天', desc: '约3小时' },
        { id: 'full', label: '全天', desc: '约6小时' }
      ];

      return `
        <div class="planner-step-content fade-in">
          <div class="planner-section">
            <h3 class="planner-section-title">选择日期</h3>
            <div class="planner-option-grid">
              ${dateOptions.map(opt => `
                <button class="planner-option-card ${state.selectedDate === opt.id ? 'selected' : ''}" onclick="App.plannerSelectDate('${opt.id}')">
                  <span class="option-label">${opt.label}</span>
                  <span class="option-desc">${opt.desc}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="planner-section">
            <h3 class="planner-section-title">选择时长</h3>
            <div class="planner-option-grid two-col">
              ${durationOptions.map(opt => `
                <button class="planner-option-card ${state.selectedDuration === opt.id ? 'selected' : ''}" onclick="App.plannerSelectDuration('${opt.id}')">
                  <span class="option-label">${opt.label}</span>
                  <span class="option-desc">${opt.desc}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderPlannerStep2() {
      const state = this.plannerState;
      const ageOptions = [
        { id: '0-3', label: '0-3岁', desc: '婴幼儿' },
        { id: '3-6', label: '3-6岁', desc: '学龄前' },
        { id: '6-12', label: '6-12岁', desc: '学龄期' },
        { id: 'all', label: '全龄段', desc: '都适合' }
      ];

      const prefOptions = [
        { id: 'handcraft', label: '手工', icon: '🎨' },
        { id: 'outdoor', label: '户外', icon: '🌳' },
        { id: 'music', label: '音乐', icon: '🎵' },
        { id: 'reading', label: '阅读', icon: '📚' },
        { id: 'science', label: '科学', icon: '🔬' },
        { id: 'baking', label: '烘焙', icon: '🍰' }
      ];

      return `
        <div class="planner-step-content fade-in">
          <div class="planner-section">
            <h3 class="planner-section-title">孩子年龄</h3>
            <div class="planner-option-grid">
              ${ageOptions.map(opt => `
                <button class="planner-option-card ${state.selectedAge === opt.id ? 'selected' : ''}" onclick="App.plannerSelectAge('${opt.id}')">
                  <span class="option-label">${opt.label}</span>
                  <span class="option-desc">${opt.desc}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="planner-section">
            <h3 class="planner-section-title">偏好类型 <span style="font-size: 12px; color: var(--color-muted); font-weight: 400;">（可多选）</span></h3>
            <div class="planner-pref-grid">
              ${prefOptions.map(opt => `
                <button class="planner-pref-item ${state.selectedPreferences.includes(opt.id) ? 'selected' : ''}" onclick="App.plannerTogglePref('${opt.id}')">
                  <span class="pref-icon">${opt.icon}</span>
                  <span class="pref-label">${opt.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderPlannerStep3() {
      const state = this.plannerState;

      if (state.isGenerating || !state.generatedItinerary) {
        return `
          <div class="planner-loading fade-in">
            <div class="loading-spinner"></div>
            <h3 class="loading-title">AI 正在为您规划行程...</h3>
            <p class="loading-desc">分析偏好、匹配活动、优化路线</p>
          </div>
        `;
      }

      const itinerary = state.generatedItinerary;
      const activities = itinerary.activities || [];

      return `
        <div class="planner-result fade-in">
          <div class="itinerary-summary">
            <div class="itinerary-summary-item">
              <span class="summary-icon">📅</span>
              <span class="summary-text">${this.getPlannerDateLabel(itinerary.date)}</span>
            </div>
            <div class="itinerary-summary-item">
              <span class="summary-icon">⏱️</span>
              <span class="summary-text">${itinerary.totalDuration}</span>
            </div>
            <div class="itinerary-summary-item">
              <span class="summary-icon">📍</span>
              <span class="summary-text">${activities.length}个活动</span>
            </div>
          </div>

          <div class="itinerary-timeline">
            ${activities.map((activity, index) => {
              const startTime = 9 + index * 2;
              const endTime = startTime + 1;
              return `
                <div class="timeline-item">
                  <div class="timeline-marker">
                    <div class="timeline-dot"></div>
                    ${index < activities.length - 1 ? '<div class="timeline-line"></div>' : ''}
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-time">${startTime}:00 - ${endTime}:00</div>
                    <div class="timeline-activity" onclick="Router.navigate('/activity/${activity.id}')">
                      <div class="timeline-activity-img">
                        <img src="${activity.coverImage}" alt="${activity.title}" />
                      </div>
                      <div class="timeline-activity-info">
                        <h4 class="timeline-activity-title">${activity.title}</h4>
                        <div class="timeline-activity-meta">
                          <span>${this.formatDistance(activity.distance)}</span>
                          <span>·</span>
                          <span>${activity.minAge}-${activity.maxAge}岁</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            <div class="timeline-item">
              <div class="timeline-marker">
                <div class="timeline-dot lunch"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-time">12:00 - 13:30</div>
                <div class="timeline-lunch">
                  <div class="lunch-icon">🍽️</div>
                  <div class="lunch-info">
                    <h4 class="lunch-title">午餐推荐 · ${itinerary.lunch.name}</h4>
                    <p class="lunch-desc">${itinerary.lunch.cuisine} · 距上一站${itinerary.lunch.distance}km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="itinerary-transport">
            <div class="transport-icon">🚗</div>
            <div class="transport-info">
              <span class="transport-label">交通建议</span>
              <span class="transport-text">${itinerary.transportTip}</span>
            </div>
          </div>

          <div class="planner-actions">
            <button class="planner-action-btn secondary" onclick="App.plannerRegenerate()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              换一批
            </button>
            <button class="planner-action-btn primary" onclick="App.plannerAddToSchedule()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              加入日程
            </button>
          </div>

          <div class="planner-share">
            <button class="share-btn" onclick="App.shareItinerary()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              分享行程
            </button>
          </div>
        </div>
      `;
    },

    getPlannerDateLabel(dateId) {
      const labels = {
        today: '今天',
        tomorrow: '明天',
        weekend: '本周末',
        custom: '自定义'
      };
      return labels[dateId] || '明天';
    },

    plannerSelectDate(date) {
      this.plannerState.selectedDate = date;
      this.refreshCurrentPage();
    },

    plannerSelectDuration(duration) {
      this.plannerState.selectedDuration = duration;
      this.refreshCurrentPage();
    },

    plannerSelectAge(age) {
      this.plannerState.selectedAge = age;
      this.refreshCurrentPage();
    },

    plannerTogglePref(prefId) {
      const prefs = this.plannerState.selectedPreferences;
      const index = prefs.indexOf(prefId);
      if (index > -1) {
        prefs.splice(index, 1);
      } else {
        prefs.push(prefId);
      }
      this.refreshCurrentPage();
    },

    plannerNextStep() {
      if (this.plannerState.step < 3) {
        this.plannerState.step++;
        if (this.plannerState.step === 3) {
          this.generateItinerary();
        } else {
          this.refreshCurrentPage();
        }
      }
    },

    plannerPrevStep() {
      if (this.plannerState.step > 1) {
        this.plannerState.step--;
        this.refreshCurrentPage();
      }
    },

    generateItinerary() {
      this.plannerState.isGenerating = true;
      this.plannerState.generatedItinerary = null;
      this.refreshCurrentPage();

      setTimeout(() => {
        const state = this.plannerState;
        const ageRange = state.selectedAge.split('-');
        const age = ageRange.length === 2 ? (parseInt(ageRange[0]) + parseInt(ageRange[1])) / 2 : 5;

        const itinerary = MockData.generateItinerary(
          state.selectedDate,
          state.selectedDuration,
          age,
          state.selectedPreferences
        );

        this.plannerState.generatedItinerary = itinerary;
        this.plannerState.isGenerating = false;
        this.refreshCurrentPage();
      }, 2000);
    },

    plannerRegenerate() {
      this.plannerState.isGenerating = true;
      this.refreshCurrentPage();

      setTimeout(() => {
        const state = this.plannerState;
        const ageRange = state.selectedAge.split('-');
        const age = ageRange.length === 2 ? (parseInt(ageRange[0]) + parseInt(ageRange[1])) / 2 : 5;

        const itinerary = MockData.generateItinerary(
          state.selectedDate,
          state.selectedDuration,
          age,
          state.selectedPreferences
        );

        this.plannerState.generatedItinerary = itinerary;
        this.plannerState.isGenerating = false;
        this.refreshCurrentPage();
        Toast.success('已为您重新规划');
      }, 1500);
    },

    plannerAddToSchedule() {
      const itinerary = this.plannerState.generatedItinerary;
      if (!itinerary || !itinerary.activities) return;

      itinerary.activities.forEach(activity => {
        if (!Storage.hasSchedule(activity.id)) {
          Storage.addSchedule({ activityId: activity.id });
        }
      });

      Toast.success(`已添加 ${itinerary.activities.length} 个活动到日程`);
    },

    shareItinerary() {
      Toast.info('行程分享功能开发中...');
    },

    renderNotFound() {
      return `
        <div class="page-notfound" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
          ${this.renderEmptyStatePremium('notFound', '页面未找到', '抱歉，您访问的页面不存在或已被移除', '返回首页', "Router.navigate('/home')")}
        </div>`;
    },

    renderActivityCard(activity, favorites) {
      const isFavorite = favorites.includes(activity.id);
      const category = MockData.getCategoryById(activity.category);
      const remainingSlots = activity.maxSlots - activity.bookedSlots;
      const organizerName = typeof activity.organizer === 'object' ? activity.organizer.name : activity.organizer;

      return `
        <div class="activity-card card-v2" data-id="${activity.id}">
          <div class="card-cover-v2">
            <img class="lazy-image gpu-accelerated" data-src="${activity.coverImage}" alt="${activity.title}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%23f5f5f5' width='300' height='200'/%3E%3C/svg%3E" />
            <button class="card-fav-v2 ${isFavorite ? 'active' : ''}" data-id="${activity.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <div class="card-tags">
              <span class="card-cat-tag">${category?.name || activity.category}</span>
              ${activity.highlights?.[0] ? `<span class="card-hl-tag">${activity.highlights[0]}</span>` : ''}
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title-v2">${activity.title}</h3>
            <div class="card-info-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${this.formatSmartTime(activity.startTime)}</span>
            </div>
            <div class="card-info-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span class="card-address">${activity.address}</span>
            </div>
            <div class="card-footer">
              <div class="card-footer-left">
                <span class="age-tag">${activity.minAge}-${activity.maxAge}岁</span>
                <span class="organizer-text">${organizerName}</span>
              </div>
              <div class="card-footer-right">
                <span class="distance-text">${this.formatDistance(activity.distance)}</span>
                <span class="slots-text ${remainingSlots <= 5 ? 'urgent' : ''}">剩${remainingSlots}名</span>
              </div>
            </div>
          </div>
        </div>`;
    },

    getCategoryIconPath(iconName) {
      const paths = {
        palette: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
        music: 'M9 18V5l12-2v13',
        headphones: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-5 9H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm10 0h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z',
        'book-open': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
        'tree-pine': 'M12 2l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1z',
        'shopping-bag': 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
        cake: 'M6 2h12v5H6z',
        book: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
        'flask-conical': 'M10 2v7.31l2 2 2-2V2h-4zm0 18h4v2h-4v-2z'
      };
      return paths[iconName] || paths.book;
    },

    getMessageIcon(type) {
      const icons = {
        system: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        subscription: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A9D8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
        reminder: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        review: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      };
      return icons[type] || icons.system;
    },

    formatSmartTime(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      if (date >= today && date < tomorrow) {
        return `今天 ${timeStr}`;
      } else if (date >= tomorrow && date < dayAfterTomorrow) {
        return `明天 ${timeStr}`;
      } else if (date >= dayAfterTomorrow && date < endOfWeek) {
        return `${weekDays[date.getDay()]} ${timeStr}`;
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
      }
    },

    formatDistance(km) {
      if (km < 1) {
        return `${Math.round(km * 1000)}m`;
      }
      return `${km.toFixed(1)}km`;
    },

    formatDateTime(dateString) {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    formatTime(dateString) {
      const date = new Date(dateString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return `${days}天前`;
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    getUnreadCount() {
      const messages = Storage.getMessages();
      return messages.filter(m => !m.read).length;
    },

    toggleFavorite(id) {
      if (Storage.isFavorite(id)) {
        Storage.removeFavorite(id);
        Toast.info('已取消收藏');
      } else {
        Storage.addFavorite(id);
        Toast.success('收藏成功');
      }
      this._updateCachedFavorites(id);
      const currentPage = this.currentPageName;
      if (currentPage === 'favorites') {
        this.refreshCurrentPage();
      }
    },

    bookActivity(id) {
      if (Storage.hasBooked(id)) {
        Toast.warning('您已预约此活动');
        return;
      }

      Modal.confirm({
        title: '确认预约',
        content: '确定要预约此活动吗？',
        onConfirm: () => {
          Storage.addBooking({ activityId: id });
          Toast.success('预约成功');
          this.refreshCurrentPage();
        }
      });
    },

    togglePreference(id) {
      const user = Storage.getUser();
      const preferences = user.preferences || [];

      if (preferences.includes(id)) {
        user.preferences = preferences.filter(p => p !== id);
      } else {
        user.preferences = [...preferences, id];
      }

      Storage.setUser(user);
      this.refreshCurrentPage();
    },

    doSearch(query) {
      if (!query.trim()) return;
      Storage.addSearchHistory(query);
      Router.navigate(`/search?q=${encodeURIComponent(query)}`);
    },

    clearSearchHistory() {
      Storage.clearSearchHistory();
      Toast.info('搜索历史已清空');
      this.refreshCurrentPage();
    },

    refreshCurrentPage() {
      const path = Router.getPath();
      const params = Router.getParams();
      const pageName = this.getPageNameFromPath(path);
      const cacheKey = this._getCacheKey(pageName, params);
      
      if (this._pageCache.has(cacheKey)) {
        const oldContainer = this._pageCache.get(cacheKey);
        if (oldContainer && oldContainer.parentNode) {
          oldContainer.parentNode.removeChild(oldContainer);
        }
        this._cacheOrder = this._cacheOrder.filter(k => k !== cacheKey);
        this._pageCache.delete(cacheKey);
        delete this._scrollPositions[cacheKey];
      }
      
      this._refreshingPage = cacheKey;
      this.renderPage(pageName, params);
    },

    getPageNameFromPath(path) {
      if (path.startsWith('/activity/')) return 'activity';
      const pageMap = {
        '/': 'home',
        '/home': 'home',
        '/search': 'search',
        '/activity': 'activity',
        '/favorites': 'favorites',
        '/bookings': 'bookings',
        '/schedule': 'schedule',
        '/subscription': 'subscription',
        '/messages': 'messages',
        '/planner': 'planner',
        '/profile': 'profile',
        '/settings': 'settings'
      };
      return pageMap[path] || 'notFound';
    },

    currentView: 'list',
    currentPage: 1,
    filters: {
      distance: 'all',
      time: 'all',
      category: 'all',
      age: 'all'
    },
    sortBy: 'distance',

    switchView(view) {
      App.currentView = view;
      App.currentPage = 1;
      this.refreshCurrentPage();
    },

    setFilter(type, value) {
      App.filters[type] = value;
      App.currentPage = 1;
      this.refreshCurrentPage();
    },

    setSort(sortBy) {
      App.sortBy = sortBy;
      App.currentPage = 1;
      this.refreshCurrentPage();
    },

    loadMore() {
      if (this.loadMoreState.isLoading) return;
      
      this.loadMoreState.isLoading = true;
      const loadMoreEl = document.querySelector('.load-more');
      const activityList = document.getElementById('activity-list');
      
      if (!activityList) {
        this.refreshCurrentPage();
        return;
      }
      
      if (loadMoreEl) {
        loadMoreEl.classList.add('loading');
        loadMoreEl.innerHTML = `
          <span class="load-more-spinner"></span>
          <span>加载中...</span>
        `;
      }
      
      setTimeout(() => {
        const prevPage = App.currentPage;
        App.currentPage++;
        
        const activities = MockData.getUpcomingActivities();
        const filters = App.filters || { distance: 'all', time: 'all', category: 'all', age: 'all' };
        const sortBy = App.sortBy || 'distance';
        const favorites = Storage.getFavorites();
        
        const filteredActivities = this.filterActivities(activities, filters);
        const sortedActivities = this.sortActivities(filteredActivities, sortBy);
        const prevCount = prevPage * 10;
        const newActivities = sortedActivities.slice(prevCount, App.currentPage * 10);
        const hasMore = App.currentPage * 10 < sortedActivities.length;
        
        if (newActivities.length > 0) {
          const newCardsHtml = newActivities.map(activity => this.renderActivityCard(activity, favorites)).join('');
          activityList.insertAdjacentHTML('beforeend', newCardsHtml);
          this.initLazyLoading();
        }
        
        if (loadMoreEl) {
          if (hasMore) {
            loadMoreEl.classList.remove('loading');
            loadMoreEl.innerHTML = '加载更多';
          } else {
            loadMoreEl.style.display = 'none';
          }
        }
        
        this.setupScrollLoad();
        this.loadMoreState.isLoading = false;
      }, 600);
    },

    filterActivities(activities, filters) {
      return activities.filter(activity => {
        if (filters.distance !== 'all') {
          const maxDist = parseFloat(filters.distance);
          if (activity.distance > maxDist) return false;
        }
        if (filters.time !== 'all') {
          const start = new Date(activity.startTime);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          const endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
          const endOf7Days = new Date(today);
          endOf7Days.setDate(endOf7Days.getDate() + 7);

          switch (filters.time) {
            case 'today':
              if (start < today || start >= tomorrow) return false;
              break;
            case 'tomorrow':
              if (start < tomorrow || start >= dayAfterTomorrow) return false;
              break;
            case 'weekend':
              if (start < today || start >= endOfWeek) return false;
              break;
            case '7days':
              if (start < today || start >= endOf7Days) return false;
              break;
          }
        }
        if (filters.category !== 'all' && activity.category !== filters.category) {
          return false;
        }
        if (filters.age !== 'all') {
          const ageRanges = {
            '0-3': { min: 0, max: 3 },
            '3-6': { min: 3, max: 6 },
            '6-12': { min: 6, max: 12 }
          };
          const range = ageRanges[filters.age];
          if (range) {
            if (activity.maxAge < range.min || activity.minAge > range.max) return false;
          }
        }
        if (this.priceFilter !== 'all') {
          const price = activity.price || 0;
          switch (this.priceFilter) {
            case 'free': 
              if (price !== 0) return false;
              break;
            case '0-50': 
              if (price <= 0 || price > 50) return false;
              break;
            case '50-100': 
              if (price <= 50 || price > 100) return false;
              break;
            case '100+': 
              if (price <= 100) return false;
              break;
          }
        }
        if (this.durationFilter !== 'all') {
          const duration = activity.durationMinutes || 90;
          switch (this.durationFilter) {
            case '1h': 
              if (duration > 60) return false;
              break;
            case '1-2h': 
              if (duration <= 60 || duration > 120) return false;
              break;
            case '2h+': 
              if (duration <= 120) return false;
              break;
          }
        }
        if (this.venueFilter !== 'all') {
          if ((activity.venueType || 'indoor') !== this.venueFilter) return false;
        }
        return true;
      });
    },

    sortActivities(activities, sortBy) {
      const sorted = [...activities];
      switch (sortBy) {
        case 'distance':
          sorted.sort((a, b) => a.distance - b.distance);
          break;
        case 'latest':
          sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
          break;
        case 'upcoming':
          sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
          break;
        case 'popular':
          sorted.sort((a, b) => (b.bookedSlots / b.maxSlots) - (a.bookedSlots / a.maxSlots));
          break;
      }
      return sorted;
    },

    renderDistanceFilter(selected) {
      const options = [
        { value: 'all', label: '全城' },
        { value: '1', label: '1km' },
        { value: '3', label: '3km' },
        { value: '5', label: '5km' }
      ];
      return options.map(opt => `
        <button class="filter-item ${selected === opt.value ? 'active' : ''}" onclick="App.setFilter('distance', '${opt.value}')">${opt.label}</button>
      `).join('');
    },

    renderTimeFilter(selected) {
      const options = [
        { value: 'all', label: '全部时间' },
        { value: 'today', label: '今天' },
        { value: 'tomorrow', label: '明天' },
        { value: 'weekend', label: '本周末' },
        { value: '7days', label: '未来7天' }
      ];
      return options.map(opt => `
        <button class="filter-item ${selected === opt.value ? 'active' : ''}" onclick="App.setFilter('time', '${opt.value}')">${opt.label}</button>
      `).join('');
    },

    renderCategoryFilter(selected) {
      return `<button class="filter-item ${selected === 'all' ? 'active' : ''}" onclick="App.setFilter('category', 'all')">全部</button>` +
        MockData.categories.map(cat => `
          <button class="filter-item ${selected === cat.id ? 'active' : ''}" onclick="App.setFilter('category', '${cat.id}')">${cat.name}</button>
        `).join('');
    },

    renderAgeFilter(selected) {
      const options = [
        { value: 'all', label: '全龄' },
        { value: '0-3', label: '0-3岁' },
        { value: '3-6', label: '3-6岁' },
        { value: '6-12', label: '6-12岁' }
      ];
      return options.map(opt => `
        <button class="filter-item ${selected === opt.value ? 'active' : ''}" onclick="App.setFilter('age', '${opt.value}')">${opt.label}</button>
      `).join('');
    },

    renderSortOption(value, selected, label) {
      return `<button class="sort-option ${selected === value ? 'active' : ''}" onclick="App.setSort('${value}')">${label}</button>`;
    },

    mapZoom: 1,
    mapType: 'standard',
    mapCenter: { x: 50, y: 50 },
    activeMarkerId: null,

    getActivityTypeIcon(category) {
      const icons = {
        outdoor: '🌳',
        indoor: '🏠',
        education: '📚',
        sports: '⚽',
        art: '🎨',
        science: '🔬'
      };
      return icons[category] || '📍';
    },

    getActivityTypeClass(category) {
      const types = {
        outdoor: 'type-outdoor',
        indoor: 'type-indoor',
        education: 'type-education',
        sports: 'type-sports',
        art: 'type-art',
        science: 'type-science'
      };
      return types[category] || 'type-outdoor';
    },

    renderMapView(activities, favorites) {
      this.mapActivities = activities;
      const markers = activities.map((activity, index) => {
        const x = 10 + (activity.longitude - 116) * 30;
        const y = 10 + (40 - activity.latitude) * 30;
        const typeClass = this.getActivityTypeClass(activity.category);
        const icon = this.getActivityTypeIcon(activity.category);
        return `
          <div class="map-marker ${typeClass}" data-id="${activity.id}" 
               style="left: ${Math.min(Math.max(x, 10), 90)}%; top: ${Math.min(Math.max(y, 10), 90)}%" 
               onclick="App.toggleMapMarker('${activity.id}')"
               role="button" tabindex="0"
               aria-label="${activity.title}，${activity.distance}公里"
               onkeydown="if(event.key==='Enter')App.toggleMapMarker('${activity.id}')">
            <div class="map-marker-icon"><span>${icon}</span></div>
          </div>
        `;
      }).join('');

      const bottomCards = activities.slice(0, 10).map(activity => `
        <div class="map-card-item" data-id="${activity.id}" onclick="App.scrollToMapMarker('${activity.id}')"
             role="button" tabindex="0" aria-label="查看${activity.title}详情"
             onkeydown="if(event.key==='Enter')App.scrollToMapMarker('${activity.id}')">
          <div class="map-card-cover">
            <img src="${activity.coverImage}" alt="${activity.title}" />
            <span class="map-card-tag">${activity.categoryName || activity.category}</span>
          </div>
          <div class="map-card-body">
            <div class="map-card-title">${activity.title}</div>
            <div class="map-card-meta">
              <span>${this.formatDate(activity.startTime)}</span>
              <span>·</span>
              <span>${activity.distance}km</span>
            </div>
            <div class="map-card-price">${activity.price === 0 ? '免费' : '¥' + activity.price + '起'}</div>
          </div>
        </div>
      `).join('');

      const mapSvg = this.renderMapSvg();
      const mapLegend = this.renderMapLegend();

      return `
        <div class="map-view-wrapper">
          <div class="map-type-switcher">
            <button class="map-type-btn ${this.mapType === 'standard' ? 'active' : ''}" onclick="App.switchMapType('standard')" aria-label="标准地图">标准</button>
            <button class="map-type-btn ${this.mapType === 'satellite' ? 'active' : ''}" onclick="App.switchMapType('satellite')" aria-label="卫星地图">卫星</button>
          </div>
          <div class="map-activity-count">
            <span>共找到</span>
            <span class="count-num">${activities.length}</span>
            <span>个活动</span>
          </div>
          <div class="map-controls">
            <button class="map-control-btn" onclick="App.zoomInMap()" aria-label="放大地图">+</button>
            <button class="map-control-btn" onclick="App.zoomOutMap()" aria-label="缩小地图">−</button>
            <button class="map-control-btn" onclick="App.locateMe()" aria-label="定位到当前位置">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"></path></svg>
            </button>
          </div>
          ${mapLegend}
          <div class="map-container map-type-${this.mapType}" id="map-container">
            <div class="map-svg-container">
              ${mapSvg}
            </div>
            <div class="map-user-location" style="left: 50%; top: 50%;" aria-label="我的位置"></div>
            ${markers}
          </div>
          <div class="map-bottom-cards">
            <div class="map-cards-scroll" role="listbox" aria-label="活动列表">
              ${bottomCards}
            </div>
          </div>
        </div>
      `;
    },

    renderMapSvg() {
      return `
        <svg class="map-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="parkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#A8E6CF;stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:#88D8B0;stop-opacity:0.6" />
            </linearGradient>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#81D4FA;stop-opacity:0.5" />
              <stop offset="100%" style="stop-color:#4FC3F7;stop-opacity:0.5" />
            </linearGradient>
            <pattern id="roadPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="none"/>
            </pattern>
          </defs>
          
          <rect width="400" height="300" fill="#F5F0EB"/>
          
          <ellipse cx="80" cy="80" rx="60" ry="45" fill="url(#parkGradient)"/>
          <text x="80" y="85" text-anchor="middle" fill="#2E7D32" font-size="12" font-weight="500">城市公园</text>
          
          <ellipse cx="320" cy="220" rx="70" ry="50" fill="url(#parkGradient)"/>
          <text x="320" y="225" text-anchor="middle" fill="#2E7D32" font-size="12" font-weight="500">森林公园</text>
          
          <ellipse cx="200" cy="150" rx="50" ry="35" fill="url(#waterGradient)"/>
          <text x="200" y="155" text-anchor="middle" fill="#0277BD" font-size="12" font-weight="500">人工湖</text>
          
          <line x1="0" y1="100" x2="400" y2="100" stroke="#E0D5C8" stroke-width="8" stroke-linecap="round"/>
          <line x1="0" y1="100" x2="400" y2="100" stroke="#F5F0EB" stroke-width="2" stroke-dasharray="10,10"/>
          
          <line x1="0" y1="200" x2="400" y2="200" stroke="#E0D5C8" stroke-width="8" stroke-linecap="round"/>
          <line x1="0" y1="200" x2="400" y2="200" stroke="#F5F0EB" stroke-width="2" stroke-dasharray="10,10"/>
          
          <line x1="100" y1="0" x2="100" y2="300" stroke="#E0D5C8" stroke-width="8" stroke-linecap="round"/>
          <line x1="100" y1="0" x2="100" y2="300" stroke="#F5F0EB" stroke-width="2" stroke-dasharray="10,10"/>
          
          <line x1="300" y1="0" x2="300" y2="300" stroke="#E0D5C8" stroke-width="8" stroke-linecap="round"/>
          <line x1="300" y1="0" x2="300" y2="300" stroke="#F5F0EB" stroke-width="2" stroke-dasharray="10,10"/>
          
          <line x1="0" y1="50" x2="400" y2="50" stroke="#EDE5DC" stroke-width="4" stroke-linecap="round"/>
          <line x1="0" y1="250" x2="400" y2="250" stroke="#EDE5DC" stroke-width="4" stroke-linecap="round"/>
          <line x1="50" y1="0" x2="50" y2="300" stroke="#EDE5DC" stroke-width="4" stroke-linecap="round"/>
          <line x1="350" y1="0" x2="350" y2="300" stroke="#EDE5DC" stroke-width="4" stroke-linecap="round"/>
          
          <rect x="160" y="70" width="20" height="20" fill="#FFE0B2" rx="2"/>
          <rect x="220" y="120" width="25" height="18" fill="#FFCCBC" rx="2"/>
          <rect x="50" y="160" width="18" height="22" fill="#FFE0B2" rx="2"/>
          <rect x="330" y="90" width="22" height="20" fill="#FFCCBC" rx="2"/>
          <rect x="270" y="250" width="20" height="18" fill="#FFE0B2" rx="2"/>
          <rect x="120" y="230" width="24" height="20" fill="#FFCCBC" rx="2"/>
          
          <circle cx="200" cy="80" r="8" fill="#E85D4E" opacity="0.8"/>
          <text x="200" y="84" text-anchor="middle" fill="white" font-size="10">⭐</text>
          
          <circle cx="300" cy="150" r="8" fill="#F39C12" opacity="0.8"/>
          <text x="300" y="154" text-anchor="middle" fill="white" font-size="10">🏛</text>
          
          <rect x="20" y="260" width="60" height="25" fill="#FFF" stroke="#E0D5C8" rx="4"/>
          <text x="50" y="277" text-anchor="middle" fill="#6B6B6B" font-size="9">购物中心</text>
          
          <rect x="320" y="30" width="60" height="25" fill="#FFF" stroke="#E0D5C8" rx="4"/>
          <text x="350" y="47" text-anchor="middle" fill="#6B6B6B" font-size="9">文化中心</text>
        </svg>
      `;
    },

    renderMapLegend() {
      const categories = [
        { key: 'handcraft', name: '手工', color: '#E85D4E' },
        { key: 'dance', name: '舞蹈音乐', color: '#9B59B6' },
        { key: 'lecture', name: '讲座', color: '#3498DB' },
        { key: 'outdoor', name: '户外', color: '#27AE60' },
        { key: 'market', name: '市集', color: '#F39C12' }
      ];
      
      return `
        <div class="map-legend" id="map-legend" role="region" aria-label="地图图例">
          <div class="map-legend-header" onclick="App.toggleMapLegend()">
            <div class="map-legend-title">图例</div>
            <button class="map-legend-toggle" aria-label="切换图例显示">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          <div class="map-legend-items">
            ${categories.map(cat => `
              <div class="map-legend-item">
                <span class="map-legend-dot" style="background: ${cat.color}"></span>
                <span class="map-legend-label">${cat.name}</span>
              </div>
            `).join('')}
            <div class="map-legend-item">
              <span class="map-legend-dot" style="background: #3B82F6; border: 2px solid white;"></span>
              <span class="map-legend-label">我的位置</span>
            </div>
          </div>
        </div>
      `;
    },

    toggleMapLegend() {
      const legend = document.getElementById('map-legend');
      if (legend) {
        legend.classList.toggle('collapsed');
      }
    },

    toggleMapMarker(id) {
      const activity = MockData.getActivityById(id);
      if (!activity) return;

      const markers = document.querySelectorAll('.map-marker');
      const cards = document.querySelectorAll('.map-card-item');
      
      if (this.activeMarkerId === id) {
        markers.forEach(m => m.classList.remove('active'));
        cards.forEach(c => c.classList.remove('active'));
        this.activeMarkerId = null;
        this.hideMapBubble();
      } else {
        markers.forEach(m => m.classList.remove('active'));
        cards.forEach(c => c.classList.remove('active'));
        
        const marker = document.querySelector(`.map-marker[data-id="${id}"]`);
        const card = document.querySelector(`.map-card-item[data-id="${id}"]`);
        
        if (marker) marker.classList.add('active');
        if (card) card.classList.add('active');
        
        this.activeMarkerId = id;
        this.showMapBubble(id, marker);
        
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    },

    scrollToMapMarker(id) {
      const activity = MockData.getActivityById(id);
      if (!activity) return;

      const markers = document.querySelectorAll('.map-marker');
      const cards = document.querySelectorAll('.map-card-item');
      
      markers.forEach(m => m.classList.remove('active'));
      cards.forEach(c => c.classList.remove('active'));
      
      const marker = document.querySelector(`.map-marker[data-id="${id}"]`);
      const card = document.querySelector(`.map-card-item[data-id="${id}"]`);
      
      if (marker) marker.classList.add('active');
      if (card) card.classList.add('active');
      
      this.activeMarkerId = id;
      this.showMapBubble(id, marker);
    },

    showMapBubble(id, marker) {
      const activity = MockData.getActivityById(id);
      if (!activity || !marker) return;

      let bubble = document.getElementById('map-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'map-bubble';
        bubble.className = 'map-popup-bubble';
        document.getElementById('map-container').appendChild(bubble);
      }

      marker.appendChild(bubble);
      
      bubble.innerHTML = `
        <img class="map-popup-thumb" src="${activity.coverImage}" alt="${activity.title}" />
        <div class="map-popup-title">${activity.title}</div>
        <div class="map-popup-info">${this.formatDate(activity.startTime)} · ${activity.distance}km</div>
        <button class="map-popup-btn" onclick="Router.navigate('/activity/${activity.id}')">查看详情</button>
      `;
      
      bubble.classList.add('show');
    },

    hideMapBubble() {
      const bubble = document.getElementById('map-bubble');
      if (bubble) {
        bubble.classList.remove('show');
      }
    },

    switchMapType(type) {
      this.mapType = type;
      const container = document.getElementById('map-container');
      if (container) {
        container.className = `map-container map-type-${type}`;
      }
      
      const btns = document.querySelectorAll('.map-type-btn');
      btns.forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.querySelector(`.map-type-btn[onclick*="${type}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    },

    zoomInMap() {
      this.mapZoom = Math.min(this.mapZoom + 0.2, 2);
      this.applyMapZoom();
    },

    zoomOutMap() {
      this.mapZoom = Math.max(this.mapZoom - 0.2, 0.5);
      this.applyMapZoom();
    },

    applyMapZoom() {
      const container = document.getElementById('map-container');
      const markers = container?.querySelectorAll('.map-marker');
      if (markers) {
        markers.forEach(marker => {
          const left = parseFloat(marker.style.left);
          const top = parseFloat(marker.style.top);
          const newLeft = 50 + (left - 50) * (this.mapZoom / this.mapZoom);
          marker.style.transform = `scale(${this.mapZoom})`;
          marker.style.transformOrigin = 'center bottom';
        });
      }
      Toast.info(`缩放: ${Math.round(this.mapZoom * 100)}%`);
    },

    locateMe() {
      Toast.success('已定位到当前位置');
      const container = document.getElementById('map-container');
      if (container) {
        container.style.animation = 'none';
        container.offsetHeight;
        container.style.animation = 'pulse 0.5s ease';
      }
    },

    showCityModal() {
      const cities = ['北京·朝阳区', '北京·海淀区', '北京·西城区', '北京·东城区', '上海·浦东新区', '上海·徐汇区', '广州·天河区', '深圳·南山区'];
      Modal.confirm({
        title: '选择城市',
        content: `<div style="max-height: 200px; overflow-y: auto;">${cities.map(city => `<button style="display:block; width:100%; padding:10px; text-align:left; border-bottom:1px solid #E8DFD5;" onclick="App.setCity('${city}'); Modal.close()">${city}</button>`).join('')}</div>`,
        showCancel: true,
        confirmText: '确定',
        cancelText: '取消'
      });
    },

    setCity(city) {
      const user = Storage.getUser();
      user.location = city;
      Storage.setUser(user);
      Toast.success(`已切换到 ${city}`);
      this.refreshCurrentPage();
    },

    getActivityStatus(activity) {
      const now = new Date();
      const start = new Date(activity.startTime);
      const end = new Date(activity.endTime);

      if (activity.status === 'cancelled') return 'cancelled';
      if (now < start) return 'upcoming';
      if (now >= start && now < end) return 'ongoing';
      return 'ended';
    },

    getStatusText(status) {
      const texts = {
        upcoming: '即将开始',
        ongoing: '活动进行中',
        ended: '已结束',
        cancelled: '已取消'
      };
      return texts[status] || status;
    },

    getRelatedActivities(activity) {
      return MockData.getUpcomingActivities()
        .filter(a => a.id !== activity.id && (a.category === activity.category || a.tags.some(t => activity.tags.includes(t))))
        .slice(0, 5);
    },

    toggleDesc(id) {
      const el = document.getElementById(`activity-desc-${id}`);
      const btn = document.getElementById(`toggle-btn-${id}`);
      if (el) {
        el.classList.toggle('collapsed');
        if (btn) {
          btn.textContent = el.classList.contains('collapsed') ? '展开全文' : '收起';
        }
      }
    },

    showMapPreview(id) {
      const el = document.getElementById(`map-preview-${id}`);
      if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
      }
    },

    openMapApp(address) {
      const encoded = encodeURIComponent(address);
      const url = `https://maps.google.com?q=${encoded}`;
      window.open(url, '_blank');
    },

    showShareModal(id) {
      const activity = MockData.getActivityById(id);
      const url = `${window.location.origin}${window.location.pathname}#/activity/${id}`;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 199;
      `;
      overlay.onclick = () => document.body.removeChild(overlay);

      const modal = document.createElement('div');
      modal.className = 'share-modal';
      modal.innerHTML = `
        <div class="share-title">分享活动</div>
        <div class="share-options">
          <button class="share-option" onclick="App.copyLink('${url}'); document.body.removeChild(overlay)">
            <div class="share-option-icon">📋</div>
            <span>复制链接</span>
          </button>
          <button class="share-option" onclick="document.body.removeChild(overlay)">
            <div class="share-option-icon">💬</div>
            <span>微信</span>
          </button>
          <button class="share-option" onclick="document.body.removeChild(overlay)">
            <div class="share-option-icon">📱</div>
            <span>朋友圈</span>
          </button>
          <button class="share-option" onclick="document.body.removeChild(overlay)">
            <div class="share-option-icon">📧</div>
            <span>邮件</span>
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    },

    copyLink(url) {
      navigator.clipboard.writeText(url).then(() => {
        Toast.success('链接已复制');
      }).catch(() => {
        Toast.info('链接已复制');
      });
    },

    toggleSubscription(tagId) {
      const subscriptions = Storage.getSubscriptions();
      const maxSubscriptions = 10;

      if (subscriptions.includes(tagId)) {
        Storage.removeSubscription(tagId);
        Toast.info('已取消订阅');
      } else {
        if (subscriptions.length >= maxSubscriptions) {
          Toast.warning(`最多订阅${maxSubscriptions}个标签`);
          return;
        }
        Storage.addSubscription(tagId);
        Toast.success('订阅成功');
      }
      this.refreshCurrentPage();
    },

    searchDebounceTimer: null,
    _searchSuggestCache: new Map(),
    _lastSearchQuery: '',

    handleSearchInput(input) {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      const query = input.value.trim();
      const suggestions = document.getElementById('search-suggestions');

      this.searchDebounceTimer = setTimeout(() => {
        if (!suggestions) return;

        if (query.length > 0) {
          let results;
          if (this._searchSuggestCache.has(query)) {
            results = this._searchSuggestCache.get(query);
          } else {
            results = MockData.searchActivities(query).slice(0, 5);
            this._searchSuggestCache.set(query, results);
            if (this._searchSuggestCache.size > 20) {
              const firstKey = this._searchSuggestCache.keys().next().value;
              this._searchSuggestCache.delete(firstKey);
            }
          }
          if (results.length > 0) {
            suggestions.innerHTML = results.map(item => `
              <div class="suggestion-item" onclick="App.doSearch('${item.title}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>${item.title}</span>
              </div>
            `).join('');
            suggestions.style.display = 'block';
          } else {
            suggestions.style.display = 'none';
          }
        } else {
          suggestions.style.display = 'none';
        }
      }, 200);
    },

    groupActivitiesByDate(activities) {
      const groups = {};
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

      activities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      activities.forEach(activity => {
        const start = new Date(activity.startTime);
        const dateKey = start.toDateString();

        let groupName;
        if (start >= today && start < tomorrow) {
          groupName = '今天';
        } else if (start >= tomorrow && start < dayAfterTomorrow) {
          groupName = '明天';
        } else if (start >= dayAfterTomorrow && start < endOfWeek) {
          groupName = '本周';
        } else {
          groupName = `${start.getMonth() + 1}月${start.getDate()}日`;
        }

        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(activity);
      });

      const orderedGroups = {};
      const order = ['今天', '明天', '本周'];
      order.forEach(key => {
        if (groups[key]) {
          orderedGroups[key] = groups[key];
          delete groups[key];
        }
      });
      Object.keys(groups).sort().forEach(key => {
        orderedGroups[key] = groups[key];
      });

      return orderedGroups;
    },

    checkScheduleConflict(newActivity) {
      const schedules = Storage.getSchedules();
      const newStart = new Date(newActivity.startTime);
      const newEnd = new Date(newActivity.endTime);

      for (const s of schedules) {
        const existingActivity = MockData.getActivityById(s.activityId);
        if (existingActivity) {
          const existingStart = new Date(existingActivity.startTime);
          const existingEnd = new Date(existingActivity.endTime);

          if (newStart < existingEnd && newEnd > existingStart) {
            return existingActivity;
          }
        }
      }
      return null;
    },

    addToSchedule(id) {
      if (Storage.hasSchedule(id)) {
        Toast.warning('已添加到日程');
        return;
      }

      const activity = MockData.getActivityById(id);
      const conflict = this.checkScheduleConflict(activity);

      if (conflict) {
        Modal.confirm({
          title: '时间冲突',
          content: `该时段已有安排：${conflict.title}，确定添加？`,
          onConfirm: () => {
            Storage.addSchedule({ activityId: id });
            Toast.success('已添加到日程');
            this.refreshCurrentPage();
          }
        });
      } else {
        Storage.addSchedule({ activityId: id });
        Toast.success('已添加到日程');
        this.refreshCurrentPage();
      }
    },

    removeSchedule(scheduleId) {
      Modal.confirm({
        title: '删除日程',
        content: '确定要删除此日程吗？',
        onConfirm: () => {
          Storage.removeSchedule(scheduleId);
          Toast.success('已删除');
          this.refreshCurrentPage();
        }
      });
    },

    exportCalendar() {
      const schedules = Storage.getSchedules();
      let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//QuXiangBenDi//CN\n';

      schedules.forEach(s => {
        const activity = MockData.getActivityById(s.activityId);
        if (activity) {
          const start = new Date(activity.startTime);
          const end = new Date(activity.endTime);
          
          const formatDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
          };

          icsContent += `BEGIN:VEVENT\n`;
          icsContent += `UID:${s.id}@quxiangbendi.com\n`;
          icsContent += `DTSTAMP:${formatDate(new Date())}\n`;
          icsContent += `DTSTART:${formatDate(start)}\n`;
          icsContent += `DTEND:${formatDate(end)}\n`;
          icsContent += `SUMMARY:${activity.title}\n`;
          icsContent += `DESCRIPTION:${activity.description}\n`;
          icsContent += `LOCATION:${activity.address}\n`;
          icsContent += `END:VEVENT\n`;
        }
      });

      icsContent += 'END:VCALENDAR';

      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-schedule.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Toast.success('日历已导出');
    },

    showReminderSettings() {
      const settings = Storage.getReminderSettings();
      Modal.confirm({
        title: '提醒设置',
        content: `
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px;">报名截止前提醒</label>
            <select id="reminder-before-deadline" style="width: 100%; padding: 8px; border: 1px solid #E8DFD5; border-radius: 6px;">
              <option ${settings.beforeDeadline === '24h' ? 'selected' : ''} value="24h">24小时</option>
              <option ${settings.beforeDeadline === '12h' ? 'selected' : ''} value="12h">12小时</option>
              <option ${settings.beforeDeadline === '6h' ? 'selected' : ''} value="6h">6小时</option>
              <option ${settings.beforeDeadline === '1h' ? 'selected' : ''} value="1h">1小时</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px;">活动开始前提醒</label>
            <select id="reminder-before-start" style="width: 100%; padding: 8px; border: 1px solid #E8DFD5; border-radius: 6px;">
              <option ${settings.beforeStart === '1h' ? 'selected' : ''} value="1h">1小时</option>
              <option ${settings.beforeStart === '30m' ? 'selected' : ''} value="30m">30分钟</option>
              <option ${settings.beforeStart === '15m' ? 'selected' : ''} value="15m">15分钟</option>
            </select>
          </div>
        `,
        onConfirm: () => {
          const beforeDeadline = document.getElementById('reminder-before-deadline')?.value || '24h';
          const beforeStart = document.getElementById('reminder-before-start')?.value || '1h';
          Storage.setReminderSettings({ beforeDeadline, beforeStart });
          Toast.success('设置已保存');
        }
      });
    },

    initPageEvents(pageName) {
      this.currentPageName = pageName;
      
      document.querySelectorAll('.activity-list').forEach(list => {
        if (!list._delegated) {
          list._delegated = true;
          list.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.card-fav-v2');
            if (favBtn) {
              e.stopPropagation();
              const id = favBtn.getAttribute('data-id');
              if (id) App.toggleFavorite(id);
              return;
            }
            const card = e.target.closest('.activity-card');
            if (card) {
              const id = card.getAttribute('data-id');
              if (id) Router.navigate('/activity/' + id);
            }
          });
        }
      });
      
      document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          if (id) App.toggleFavorite(id);
        });
      });

      if (typeof this.setupHeaderScrollEffect === 'function') {
        this.setupHeaderScrollEffect();
      }
      if (typeof this.updateMessageBadge === 'function') {
        this.updateMessageBadge();
      }
      if (typeof this.addAccessibilityFeatures === 'function') {
        this.addAccessibilityFeatures();
      }

      if (pageName === 'home') {
        if (typeof this.setupPullRefresh === 'function') {
          this.setupPullRefresh();
        }
        if (typeof this.setupScrollLoad === 'function') {
          this.setupScrollLoad();
        }
        if (typeof this.initAIChatEvents === 'function') {
          this.initAIChatEvents();
        }
      }

      if (pageName === 'search') {
        const input = document.getElementById('search-input');
        if (input) {
          input.focus();
        }
      }

      if (pageName === 'planner' && typeof this.initPlannerEvents === 'function') {
        this.initPlannerEvents();
      }

      const searchInput = document.querySelector('.search-input');
      const searchClearBtn = document.querySelector('.search-clear-btn');
      if (searchInput && searchClearBtn && typeof this.setupSearchClear === 'function') {
        this.setupSearchClear('.search-input', '.search-clear-btn');
      }
    },

    initAIChatEvents() {
      const input = document.getElementById('ai-chat-input');
      const sendBtn = document.querySelector('.ai-chat-send');
      const chatContainer = document.querySelector('.ai-chat-messages');
      
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    },

    initPlannerEvents() {
    },

    setupHeaderScrollEffect() {
      const header = document.querySelector('.header');
      if (!header) return;

      if (this._headerScrollHandler) {
        this.removeScrollHandler(this._headerScrollHandler);
      }

      this._headerScrolledState = false;
      this._headerScrollHandler = (scrollY) => {
        const scrolled = scrollY > 10;
        if (scrolled !== this._headerScrolledState) {
          this._headerScrolledState = scrolled;
          if (scrolled) {
            header.classList.add('header-scrolled');
          } else {
            header.classList.remove('header-scrolled');
          }
        }
      };

      this.addScrollHandler(this._headerScrollHandler);
      this._headerScrollHandler(window.scrollY);
    },

    touchStartY: 0,
    touchCurrentY: 0,
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    PULL_THRESHOLD: 60,

    setupPullRefresh() {
      const container = document.getElementById('refresh-container');
      if (!container) return;

      const pullContent = container.querySelector('.pull-content') || container.querySelector('.page-content') || container;
      pullContent.classList.add('pull-content');

      let _pullTicking = false;

      const updatePullDOM = () => {
        pullContent.style.transform = `translateY(${this.pullDistance}px)`;
        
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
          indicator.style.display = 'flex';
          const textEl = indicator.querySelector('span');
          
          if (this.pullDistance >= this.PULL_THRESHOLD) {
            indicator.classList.add('release');
            if (textEl) textEl.textContent = '释放刷新';
          } else {
            indicator.classList.remove('release');
            if (textEl) textEl.textContent = '下拉刷新';
          }
        }
        
        _pullTicking = false;
      };

      container.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0 && !this.isRefreshing) {
          this.touchStartY = e.touches[0].clientY;
          this.isPulling = false;
          this.pullDistance = 0;
          pullContent.classList.add('pulling');
        }
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (window.scrollY === 0 && !this.isRefreshing) {
          this.touchCurrentY = e.touches[0].clientY;
          const diff = this.touchCurrentY - this.touchStartY;
          
          if (diff > 0) {
            this.isPulling = true;
            this.pullDistance = Math.min(diff * 0.5, 100);
            
            if (!_pullTicking) {
              _pullTicking = true;
              requestAnimationFrame(updatePullDOM);
            }
          }
        }
      }, { passive: true });

      container.addEventListener('touchend', () => {
        if (this.isPulling && !this.isRefreshing) {
          pullContent.classList.remove('pulling');
          
          if (this.pullDistance >= this.PULL_THRESHOLD) {
            pullContent.style.transform = `translateY(${this.PULL_THRESHOLD}px)`;
            this.doRefresh();
          } else {
            pullContent.style.transform = 'translateY(0)';
            const indicator = document.getElementById('refresh-indicator');
            if (indicator) {
              indicator.style.display = 'none';
              indicator.classList.remove('release');
            }
          }
        }
        this.isPulling = false;
        this.pullDistance = 0;
      });
    },

    doRefresh() {
      if (this.isRefreshing) return;
      this.isRefreshing = true;

      const indicator = document.getElementById('refresh-indicator');
      if (indicator) {
        const icon = indicator.querySelector('.refresh-icon');
        const text = indicator.querySelector('span');
        indicator.classList.remove('release');
        if (icon) {
          icon.classList.add('spin');
        }
        if (text) text.textContent = '正在刷新...';
      }

      setTimeout(() => {
        App.currentPage = 1;
        App.refreshCurrentPage();
        
        const pullContent = document.querySelector('.pull-content');
        if (pullContent) {
          pullContent.style.transform = 'translateY(0)';
        }
        
        if (indicator) {
          const icon = indicator.querySelector('.refresh-icon');
          const text = indicator.querySelector('span');
          if (icon) icon.classList.remove('spin');
          if (text) text.textContent = '刷新成功';
          
          setTimeout(() => {
            indicator.style.display = 'none';
          }, 500);
        }
        
        this.isRefreshing = false;
        Toast.success('刷新成功');
      }, 1200);
    },

    setupScrollLoad() {
      if (this._scrollLoadHandler) {
        this.removeScrollHandler(this._scrollLoadHandler);
      }

      const loadMore = document.querySelector('.load-more');
      if (!loadMore) return;

      let ticking = false;
      this._scrollLoadHandler = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect = loadMore.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100) {
            loadMore.style.display = 'none';
            this.removeScrollHandler(this._scrollLoadHandler);
            this._scrollLoadHandler = null;
            App.loadMore();
          }
          ticking = false;
        });
      };

      this.addScrollHandler(this._scrollLoadHandler);
    },

    getHighlightIcon(index) {
      const icons = [
        '<path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"></path>',
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
        '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
        '<polyline points="20 6 9 17 4 12"></polyline>',
        '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
      ];
      return icons[index % icons.length];
    },

    likeReview(reviewId) {
      Toast.success('点赞成功');
    },

    setActivityReminder(activityId) {
      const activity = MockData.getActivityById(activityId);
      if (!activity) return;

      const currentReminder = Storage.getActivityReminder(activityId);
      
      Modal.confirm({
        title: '设置活动提醒',
        content: `
          <div style="padding: 10px 0;">
            <p style="font-size: 14px; color: #6B6B6B; margin-bottom: 15px;">${activity.title}</p>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 14px; color: #2A2A2A; margin-bottom: 8px; font-weight: 500;">活动开始前提醒</label>
              <select id="reminder-start" style="width: 100%; padding: 10px; border: 1px solid #E8DFD5; border-radius: 8px; font-size: 14px;">
                <option value="" ${!currentReminder?.startBefore ? 'selected' : ''}>不提醒</option>
                <option value="15m" ${currentReminder?.startBefore === '15m' ? 'selected' : ''}>提前15分钟</option>
                <option value="30m" ${currentReminder?.startBefore === '30m' ? 'selected' : ''}>提前30分钟</option>
                <option value="1h" ${currentReminder?.startBefore === '1h' ? 'selected' : ''}>提前1小时</option>
                <option value="1d" ${currentReminder?.startBefore === '1d' ? 'selected' : ''}>提前1天</option>
              </select>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 14px; color: #2A2A2A; margin-bottom: 8px; font-weight: 500;">报名截止提醒</label>
              <select id="reminder-deadline" style="width: 100%; padding: 10px; border: 1px solid #E8DFD5; border-radius: 8px; font-size: 14px;">
                <option value="" ${!currentReminder?.deadlineBefore ? 'selected' : ''}>不提醒</option>
                <option value="1h" ${currentReminder?.deadlineBefore === '1h' ? 'selected' : ''}>提前1小时</option>
                <option value="6h" ${currentReminder?.deadlineBefore === '6h' ? 'selected' : ''}>提前6小时</option>
                <option value="1d" ${currentReminder?.deadlineBefore === '1d' ? 'selected' : ''}>提前1天</option>
              </select>
            </div>

            <button onclick="App.addToCalendar('${activityId}')" style="width: 100%; padding: 12px; background: #FDF8F3; border: 1px solid #E8DFD5; border-radius: 8px; font-size: 14px; color: #B07156; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              添加到系统日历
            </button>
          </div>
        `,
        confirmText: '保存提醒',
        cancelText: '取消',
        onConfirm: () => {
          const startBefore = document.getElementById('reminder-start')?.value || '';
          const deadlineBefore = document.getElementById('reminder-deadline')?.value || '';
          
          if (startBefore || deadlineBefore) {
            Storage.setActivityReminder(activityId, { startBefore, deadlineBefore, activityId, setTime: Date.now() });
            Toast.success('提醒设置成功');
          } else {
            Storage.removeActivityReminder(activityId);
            Toast.success('已取消提醒');
          }
        }
      });
    },

    addToCalendar(activityId) {
      const activity = MockData.getActivityById(activityId);
      if (!activity) return;

      const startDate = activity.dateTime ? new Date(activity.dateTime) : new Date();
      const duration = activity.durationMinutes || 90;
      const endDate = new Date(startDate.getTime() + duration * 60000);

      const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//趣享本地//CN',
        'BEGIN:VEVENT',
        `UID:${activityId}@quxiangbendi`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${activity.title}`,
        `DESCRIPTION:${activity.desc || ''}`,
        `LOCATION:${activity.address || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activity.title}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Toast.success('日历文件已下载');
    },

    shareActivity(activityId) {
      const activity = MockData.getActivityById(activityId);
      if (!activity) return;

      Modal.confirm({
        title: '分享活动',
        content: `
          <div style="padding: 10px 0;">
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 20px;">
              <div onclick="App.shareToWechat('${activityId}')" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #07C160; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">微信好友</span>
              </div>
              <div onclick="App.shareToMoments('${activityId}')" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #07C160; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">朋友圈</span>
              </div>
              <div onclick="App.generatePoster('${activityId}')" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #B07156; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">生成海报</span>
              </div>
              <div onclick="App.copyLink('${activityId}')" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #6B7B8C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">复制链接</span>
              </div>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: '关闭'
      });
    },

    shareToWechat(activityId) {
      Toast.info('请使用微信APP扫码分享');
    },

    shareToMoments(activityId) {
      Toast.info('请使用微信APP扫码分享到朋友圈');
    },

    generatePoster(activityId) {
      const activity = MockData.getActivityById(activityId);
      if (!activity) return;

      Modal.confirm({
        title: '分享海报',
        content: `
          <div style="padding: 10px 0;">
            <div style="background: linear-gradient(135deg, #FDF8F3 0%, #F5E6D3 100%); border-radius: 12px; padding: 20px; text-align: center;">
              <div style="width: 100%; height: 180px; background: #E8DFD5; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B07156" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <h3 style="font-size: 18px; color: #2A2A2A; margin-bottom: 8px;">${activity.title}</h3>
              <p style="font-size: 14px; color: #6B6B6B; margin-bottom: 15px;">${activity.address || ''}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 20px; font-weight: bold; color: #E85D4E;">${activity.price === 0 ? '免费' : '¥' + activity.price}</span>
                <div style="width: 60px; height: 60px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </div>
              </div>
            </div>
            <p style="font-size: 12px; color: #9B9B9B; text-align: center; margin-top: 12px;">长按保存图片分享</p>
          </div>
        `,
        confirmText: '保存图片',
        onConfirm: () => {
          Toast.success('海报已保存到相册（模拟）');
        }
      });
    },

    copyLink(activityId) {
      const url = `${window.location.origin}${window.location.pathname}?activity=${activityId}`;
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        Toast.success('链接已复制');
      } catch (e) {
        Toast.error('复制失败，请手动复制');
      }
      document.body.removeChild(textarea);
    },

    favoritesSortBy: 'time',
    favoritesFilterTag: 'all',
    batchSelectMode: false,
    batchSelectedIds: [],

    setFavoritesSort(sortBy) {
      this.favoritesSortBy = sortBy;
      this.refreshCurrentPage();
    },

    setFavoritesFilter(tag) {
      this.favoritesFilterTag = tag;
      this.refreshCurrentPage();
    },

    toggleBatchSelect() {
      this.batchSelectMode = !this.batchSelectMode;
      this.batchSelectedIds = [];
      this.refreshCurrentPage();
    },

    batchSelectAllFavorites() {
      const favorites = Storage.getFavorites();
      let favActivities = MockData.activities.filter(a => favorites.includes(a.id));
      
      if (this.favoritesFilterTag !== 'all') {
        favActivities = favActivities.filter(a => a.category === this.favoritesFilterTag);
      }
      
      if (this.batchSelectedIds.length === favActivities.length) {
        this.batchSelectedIds = [];
      } else {
        this.batchSelectedIds = favActivities.map(a => a.id);
      }
      this.refreshCurrentPage();
    },

    toggleBatchSelectItem(id) {
      const index = this.batchSelectedIds.indexOf(id);
      if (index > -1) {
        this.batchSelectedIds.splice(index, 1);
      } else {
        this.batchSelectedIds.push(id);
      }
      this.refreshCurrentPage();
    },

    batchUnfavorite() {
      if (this.batchSelectedIds.length === 0) {
        Toast.info('请先选择要取消的活动');
        return;
      }
      
      Modal.confirm({
        title: '确认取消',
        content: `<p style="text-align: center; padding: 10px 0;">确定取消收藏选中的 ${this.batchSelectedIds.length} 个活动吗？</p>`,
        confirmText: '确认取消',
        onConfirm: () => {
          this.batchSelectedIds.forEach(id => {
            Storage.removeFavorite(id);
          });
          this.batchSelectedIds = [];
          this.batchSelectMode = false;
          Toast.success('已取消收藏');
          this.refreshCurrentPage();
        }
      });
    },

    bookingTab: 'all',

    setBookingTab(tab) {
      this.bookingTab = tab;
      this.refreshCurrentPage();
    },

    cancelBooking(bookingId) {
      Modal.confirm({
        title: '取消预约',
        content: '<p style="text-align: center; padding: 10px 0;">确定要取消这个预约吗？取消后名额将释放给其他用户。</p>',
        confirmText: '确认取消',
        onConfirm: () => {
          Storage.cancelBooking(bookingId);
          Toast.success('预约已取消');
          this.refreshCurrentPage();
        }
      });
    },

    searchSortBy: 'relevance',

    setSearchSort(sortBy) {
      const params = Router.getParams();
      const query = params.params.q || '';
      const category = params.params.category || '';
      const tag = params.params.tag || '';
      let url = '/search?';
      if (query) url += `q=${encodeURIComponent(query)}&`;
      if (category) url += `category=${encodeURIComponent(category)}&`;
      if (tag) url += `tag=${encodeURIComponent(tag)}&`;
      url += `sort=${sortBy}`;
      Router.navigate(url);
    },

    highlightKeyword(text, keyword) {
      if (!keyword) return text;
      const regex = new RegExp(`(${keyword})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
    },

    removeSearchHistoryItem(query) {
      Storage.removeSearchHistory(query);
      this.refreshCurrentPage();
    },

    clearAllSearchHistory() {
      const searchHistory = Storage.getSearchHistory();
      if (searchHistory.length === 0) return;
      
      Modal.confirm({
        title: '清空历史',
        content: '<p style="text-align: center; padding: 10px 0;">确定清空所有搜索历史吗？</p>',
        confirmText: '清空',
        onConfirm: () => {
          Storage.clearSearchHistory();
          Toast.success('已清空搜索历史');
          this.refreshCurrentPage();
        }
      });
    },

    priceFilter: 'all',
    durationFilter: 'all',
    venueFilter: 'all',

    setPriceFilter(price) {
      this.priceFilter = price;
    },

    setDurationFilter(duration) {
      this.durationFilter = duration;
    },

    setVenueFilter(venue) {
      this.venueFilter = venue;
    },

    applyMoreFilters() {
      App.currentPage = 1;
      this.refreshCurrentPage();
    },

    showMoreFilters() {
      Modal.confirm({
        title: '筛选活动',
        content: `
          <div style="padding: 10px 0;">
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 14px; color: #2A2A2A; margin-bottom: 10px; font-weight: 500;">价格区间</label>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="price-filter-btns">
                <button onclick="App.setPriceFilter('all'); App.updateFilterBtnStyle('price', 'all');" data-filter="price" data-value="all" style="padding: 8px 16px; border: 1px solid ${this.priceFilter === 'all' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.priceFilter === 'all' ? '#FDF0E6' : 'white'}; color: ${this.priceFilter === 'all' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">全部</button>
                <button onclick="App.setPriceFilter('free'); App.updateFilterBtnStyle('price', 'free');" data-filter="price" data-value="free" style="padding: 8px 16px; border: 1px solid ${this.priceFilter === 'free' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.priceFilter === 'free' ? '#FDF0E6' : 'white'}; color: ${this.priceFilter === 'free' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">免费</button>
                <button onclick="App.setPriceFilter('0-50'); App.updateFilterBtnStyle('price', '0-50');" data-filter="price" data-value="0-50" style="padding: 8px 16px; border: 1px solid ${this.priceFilter === '0-50' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.priceFilter === '0-50' ? '#FDF0E6' : 'white'}; color: ${this.priceFilter === '0-50' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">0-50元</button>
                <button onclick="App.setPriceFilter('50-100'); App.updateFilterBtnStyle('price', '50-100');" data-filter="price" data-value="50-100" style="padding: 8px 16px; border: 1px solid ${this.priceFilter === '50-100' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.priceFilter === '50-100' ? '#FDF0E6' : 'white'}; color: ${this.priceFilter === '50-100' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">50-100元</button>
                <button onclick="App.setPriceFilter('100+'); App.updateFilterBtnStyle('price', '100+');" data-filter="price" data-value="100+" style="padding: 8px 16px; border: 1px solid ${this.priceFilter === '100+' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.priceFilter === '100+' ? '#FDF0E6' : 'white'}; color: ${this.priceFilter === '100+' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">100元以上</button>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 14px; color: #2A2A2A; margin-bottom: 10px; font-weight: 500;">活动时长</label>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="duration-filter-btns">
                <button onclick="App.setDurationFilter('all'); App.updateFilterBtnStyle('duration', 'all');" data-filter="duration" data-value="all" style="padding: 8px 16px; border: 1px solid ${this.durationFilter === 'all' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.durationFilter === 'all' ? '#FDF0E6' : 'white'}; color: ${this.durationFilter === 'all' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">全部</button>
                <button onclick="App.setDurationFilter('1h'); App.updateFilterBtnStyle('duration', '1h');" data-filter="duration" data-value="1h" style="padding: 8px 16px; border: 1px solid ${this.durationFilter === '1h' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.durationFilter === '1h' ? '#FDF0E6' : 'white'}; color: ${this.durationFilter === '1h' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">1小时内</button>
                <button onclick="App.setDurationFilter('1-2h'); App.updateFilterBtnStyle('duration', '1-2h');" data-filter="duration" data-value="1-2h" style="padding: 8px 16px; border: 1px solid ${this.durationFilter === '1-2h' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.durationFilter === '1-2h' ? '#FDF0E6' : 'white'}; color: ${this.durationFilter === '1-2h' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">1-2小时</button>
                <button onclick="App.setDurationFilter('2h+'); App.updateFilterBtnStyle('duration', '2h+');" data-filter="duration" data-value="2h+" style="padding: 8px 16px; border: 1px solid ${this.durationFilter === '2h+' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.durationFilter === '2h+' ? '#FDF0E6' : 'white'}; color: ${this.durationFilter === '2h+' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">2小时以上</button>
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="display: block; font-size: 14px; color: #2A2A2A; margin-bottom: 10px; font-weight: 500;">场地类型</label>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="venue-filter-btns">
                <button onclick="App.setVenueFilter('all'); App.updateFilterBtnStyle('venue', 'all');" data-filter="venue" data-value="all" style="padding: 8px 16px; border: 1px solid ${this.venueFilter === 'all' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.venueFilter === 'all' ? '#FDF0E6' : 'white'}; color: ${this.venueFilter === 'all' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">全部</button>
                <button onclick="App.setVenueFilter('indoor'); App.updateFilterBtnStyle('venue', 'indoor');" data-filter="venue" data-value="indoor" style="padding: 8px 16px; border: 1px solid ${this.venueFilter === 'indoor' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.venueFilter === 'indoor' ? '#FDF0E6' : 'white'}; color: ${this.venueFilter === 'indoor' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">室内</button>
                <button onclick="App.setVenueFilter('outdoor'); App.updateFilterBtnStyle('venue', 'outdoor');" data-filter="venue" data-value="outdoor" style="padding: 8px 16px; border: 1px solid ${this.venueFilter === 'outdoor' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.venueFilter === 'outdoor' ? '#FDF0E6' : 'white'}; color: ${this.venueFilter === 'outdoor' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">户外</button>
                <button onclick="App.setVenueFilter('mixed'); App.updateFilterBtnStyle('venue', 'mixed');" data-filter="venue" data-value="mixed" style="padding: 8px 16px; border: 1px solid ${this.venueFilter === 'mixed' ? '#B07156' : '#E8DFD5'}; border-radius: 20px; font-size: 13px; background: ${this.venueFilter === 'mixed' ? '#FDF0E6' : 'white'}; color: ${this.venueFilter === 'mixed' ? '#B07156' : '#6B6B6B'}; cursor: pointer;">混合</button>
              </div>
            </div>
          </div>
        `,
        confirmText: '确定',
        cancelText: '重置',
        onConfirm: () => {
          this.applyMoreFilters();
          Toast.success('筛选已应用');
        },
        onCancel: () => {
          this.priceFilter = 'all';
          this.durationFilter = 'all';
          this.venueFilter = 'all';
          this.applyMoreFilters();
          Toast.info('已重置筛选');
        }
      });
    },

    updateFilterBtnStyle(filterType, value) {
      const btns = document.querySelectorAll(`[data-filter="${filterType}"]`);
      btns.forEach(btn => {
        if (btn.getAttribute('data-value') === value) {
          btn.style.borderColor = '#B07156';
          btn.style.background = '#FDF0E6';
          btn.style.color = '#B07156';
        } else {
          btn.style.borderColor = '#E8DFD5';
          btn.style.background = 'white';
          btn.style.color = '#6B6B6B';
        }
      });
    },

    sharePlanner() {
      Modal.confirm({
        title: '分享行程',
        content: `
          <div style="padding: 10px 0;">
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 20px;">
              <div onclick="Toast.info('请使用微信APP扫码分享')" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #07C160; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">微信好友</span>
              </div>
              <div onclick="App.copyPlannerLink()" style="text-align: center; cursor: pointer;">
                <div style="width: 50px; height: 50px; background: #6B7B8C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <span style="font-size: 12px; color: #6B6B6B;">复制链接</span>
              </div>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: '关闭'
      });
    },

    copyPlannerLink() {
      const url = `${window.location.origin}${window.location.pathname}?planner=share`;
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        Toast.success('行程链接已复制');
      } catch (e) {
        Toast.error('复制失败，请手动复制');
      }
      document.body.removeChild(textarea);
    },

    // ============================================================
    // 骨架屏相关功能
    // ============================================================

    renderSkeleton(type, count = 5) {
      const skeletons = [];
      
      switch (type) {
        case 'activity-list':
          for (let i = 0; i < count; i++) {
            skeletons.push(`
              <div class="skeleton-activity-item">
                <div class="skeleton skeleton-activity-thumb"></div>
                <div class="skeleton-activity-info">
                  <div class="skeleton skeleton-activity-title"></div>
                  <div class="skeleton skeleton-activity-meta"></div>
                  <div class="skeleton skeleton-activity-footer"></div>
                </div>
              </div>
            `);
          }
          break;
          
        case 'activity-detail':
          return `
            <div class="skeleton skeleton-detail-hero"></div>
            <div class="skeleton-detail-section">
              <div class="skeleton skeleton-detail-title"></div>
              <div class="skeleton skeleton-detail-row"></div>
              <div class="skeleton skeleton-detail-row medium"></div>
              <div class="skeleton skeleton-detail-row short"></div>
            </div>
            <div class="skeleton-detail-section">
              <div class="skeleton skeleton-detail-title" style="height:18px;width:30%;"></div>
              <div class="skeleton skeleton-detail-row"></div>
              <div class="skeleton skeleton-detail-row"></div>
              <div class="skeleton skeleton-detail-row medium"></div>
            </div>
          `;
          
        case 'favorites':
          for (let i = 0; i < count; i++) {
            skeletons.push(`
              <div class="skeleton-activity-item">
                <div class="skeleton skeleton-activity-thumb"></div>
                <div class="skeleton-activity-info">
                  <div class="skeleton skeleton-activity-title"></div>
                  <div class="skeleton skeleton-activity-meta"></div>
                  <div class="skeleton skeleton-activity-footer"></div>
                </div>
              </div>
            `);
          }
          break;
          
        case 'messages':
          for (let i = 0; i < count; i++) {
            skeletons.push(`
              <div class="skeleton-card" style="display:flex;gap:12px;align-items:flex-start;">
                <div class="skeleton" style="width:44px;height:44px;border-radius:12px;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div class="skeleton skeleton-title" style="height:16px;margin-bottom:8px;"></div>
                  <div class="skeleton skeleton-text" style="height:12px;margin-bottom:6px;"></div>
                  <div class="skeleton skeleton-text short" style="height:12px;"></div>
                </div>
              </div>
            `);
          }
          break;
          
        default:
          for (let i = 0; i < count; i++) {
            skeletons.push(`
              <div class="skeleton-card">
                <div class="skeleton skeleton-cover"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
              </div>
            `);
          }
      }
      
      return skeletons.join('');
    },

    showSkeleton(containerId, type) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = `<div class="skeleton-page">${this.renderSkeleton(type)}</div>`;
    },

    hideSkeleton(containerId, content) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const skeletonPage = container.querySelector('.skeleton-page');
      if (skeletonPage) {
        skeletonPage.classList.add('fade-out');
        setTimeout(() => {
          container.innerHTML = content;
        }, 300);
      } else {
        container.innerHTML = content;
      }
    },

    simulateLoading(containerId, type, contentCallback, delay = 1200) {
      this.showSkeleton(containerId, type);
      setTimeout(() => {
        const content = contentCallback();
        this.hideSkeleton(containerId, content);
        this.initPageEvents(this.currentPageName);
      }, delay);
    },

    // ============================================================
    // 消息通知相关功能
    // ============================================================

    getMessageIcon(type) {
      const icons = {
        reminder: '⏰',
        success: '✅',
        error: '❌',
        system: '📢',
        subscription: '🔔',
        cancel: '📋'
      };
      return icons[type] || '📬';
    },

    getMessageTypeLabel(type) {
      const labels = {
        reminder: '活动提醒',
        success: '报名成功',
        error: '报名失败',
        system: '系统公告',
        subscription: '订阅上新',
        cancel: '活动取消'
      };
      return labels[type] || '消息通知';
    },

    initMockMessages() {
      const messages = Storage.getMessages();
      if (messages.length === 0) {
        const now = new Date();
        const activities = MockData.getUpcomingActivities();
        
        Storage.addMessage({
          type: 'reminder',
          title: '活动即将开始',
          content: `「${activities[0]?.title || '亲子手工活动'}」明天上午10:00开始，记得准时参加哦~`,
          activityId: activities[0]?.id || '',
          createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString()
        });
        
        Storage.addMessage({
          type: 'success',
          title: '报名成功',
          content: `您已成功报名「${activities[1]?.title || '周末户外探索'}」，请按时参加活动。`,
          activityId: activities[1]?.id || '',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString()
        });
        
        Storage.addMessage({
          type: 'system',
          title: '系统公告',
          content: '趣享本地 v1.0.0 正式上线！感谢您的使用，祝您和宝贝玩得开心~',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString()
        });
        
        Storage.addMessage({
          type: 'subscription',
          title: '订阅活动上新',
          content: '您订阅的「户外探险」分类有新活动上线啦，快来看看吧！',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString()
        });
        
        Storage.addMessage({
          type: 'cancel',
          title: '活动取消通知',
          content: `很抱歉，「${activities[2]?.title || '某活动'}」因场地原因取消，报名费用将原路退回。`,
          activityId: activities[2]?.id || '',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString()
        });
      }
    },

    renderMessagesPage() {
      this.initMockMessages();
      const messages = Storage.getMessages();
      const unreadCount = Storage.getUnreadMessageCount();
      
      let content = `
        <div class="page">
          <div class="message-header">
            <div class="message-header-title">消息通知</div>
            ${unreadCount > 0 ? `<div class="message-header-action" onclick="App.markAllMessagesRead()">全部已读</div>` : ''}
          </div>
          <div class="message-list" id="message-list">
      `;
      
      if (messages.length === 0) {
        content += this.renderEmptyState('inbox', '暂无消息', '暂无新的消息通知');
      } else {
        content += messages.map(msg => {
          const typeIcon = this.getMessageIcon(msg.type);
          const typeLabel = this.getMessageTypeLabel(msg.type);
          const timeStr = this.formatMessageTime(msg.createdAt);
          const isUnread = !msg.read;
          
          return `
            <div class="message-swipe-wrapper" data-id="${msg.id}">
              <div class="message-item ${isUnread ? 'unread' : ''}" 
                   onclick="App.openMessageDetail('${msg.id}')"
                   ontouchstart="App.handleSwipeStart(event, '${msg.id}')"
                   ontouchmove="App.handleSwipeMove(event, '${msg.id}')"
                   ontouchend="App.handleSwipeEnd(event, '${msg.id}')">
                <div class="message-icon type-${msg.type}">${typeIcon}</div>
                <div class="message-content">
                  <div class="message-title">
                    ${isUnread ? '<span class="message-unread-dot"></span>' : ''}
                    <span class="message-type-badge type-${msg.type}">${typeLabel}</span>
                    <span class="message-title-text">${msg.title}</span>
                  </div>
                  <div class="message-preview">${msg.content}</div>
                  <div class="message-time">${timeStr}</div>
                </div>
              </div>
              <div class="message-delete-btn" onclick="App.deleteMessage('${msg.id}')">删除</div>
            </div>
          `;
        }).join('');
      }
      
      content += `
          </div>
        </div>
        ${this.renderBottomNav('messages')}
      `;
      
      return content;
    },

    formatMessageTime(dateStr) {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    openMessageDetail(msgId) {
      const messages = Storage.getMessages();
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;
      
      Storage.markAsRead(msgId);
      this.updateMessageBadge();
      
      if (msg.activityId) {
        Router.navigate(`/activity/${msg.activityId}`);
      } else {
        Modal.confirm({
          title: msg.title,
          content: `
            <div style="padding: 10px 0; line-height: 1.6; color: #2A2A2A;">
              <p style="margin-bottom:12px;font-size:13px;color:#B0B0B0;">${this.formatMessageTime(msg.createdAt)}</p>
              <p style="font-size:14px;">${msg.content}</p>
            </div>
          `,
          showCancel: false,
          confirmText: '我知道了'
        });
        
        this.refreshCurrentPage();
      }
    },

    markAllMessagesRead() {
      Storage.markAllAsRead();
      Toast.success('已全部标为已读');
      this.updateMessageBadge();
      this.refreshCurrentPage();
    },

    deleteMessage(msgId) {
      Modal.confirm({
        title: '删除消息',
        content: '确定要删除这条消息吗？',
        onConfirm: () => {
          Storage.deleteMessage(msgId);
          Toast.success('已删除');
          this.updateMessageBadge();
          this.refreshCurrentPage();
        }
      });
    },

    swipeStartX: 0,
    swipeCurrentX: 0,
    swipeActiveId: null,

    handleSwipeStart(e, msgId) {
      this.swipeStartX = e.touches[0].clientX;
      this.swipeCurrentX = 0;
      this.swipeActiveId = msgId;
    },

    handleSwipeMove(e, msgId) {
      if (this.swipeActiveId !== msgId) return;
      
      const currentX = e.touches[0].clientX;
      const diff = currentX - this.swipeStartX;
      
      if (diff < 0) {
        const wrapper = document.querySelector(`.message-swipe-wrapper[data-id="${msgId}"] .message-item`);
        if (wrapper) {
          const translateX = Math.max(diff, -80);
          wrapper.style.transform = `translateX(${translateX}px)`;
        }
      }
    },

    handleSwipeEnd(e, msgId) {
      const wrapper = document.querySelector(`.message-swipe-wrapper[data-id="${msgId}"] .message-item`);
      if (!wrapper) return;
      
      const transform = wrapper.style.transform;
      const match = transform.match(/translateX\((-?\d+)px\)/);
      
      if (match && parseInt(match[1]) < -40) {
        wrapper.style.transform = 'translateX(-80px)';
      } else {
        wrapper.style.transform = 'translateX(0)';
      }
      
      this.swipeActiveId = null;
    },

    updateMessageBadge() {
      const badge = document.querySelector('.nav-badge');
      const count = Storage.getUnreadMessageCount();
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    },

    // ============================================================
    // 设置页面相关功能
    // ============================================================

    renderSettingsPage() {
      const settings = Storage.getSettings();
      const version = Storage.getAppVersion();
      
      return `
        <div class="page-settings">
          <header class="header">
            <div class="header-content">
              <button class="back-btn" onclick="Router.navigate('/profile')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              </button>
              <h1 class="page-title">设置</h1>
              <div class="placeholder"></div>
            </div>
          </header>
          
          <main class="main-content">
            <div class="settings-group">
              <div class="settings-group-title">通知设置</div>
              <div class="settings-item" onclick="App.openNotificationSettings()">
                <div class="settings-item-icon icon-notification">🔔</div>
                <div class="settings-item-content">
                  <div class="settings-item-title">消息通知</div>
                  <div class="settings-item-desc">管理各类消息通知</div>
                </div>
                <div class="settings-item-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
            
            <div class="settings-group">
              <div class="settings-group-title">隐私与缓存</div>
              <div class="settings-item" onclick="App.openPrivacySettings()">
                <div class="settings-item-icon icon-privacy">🔒</div>
                <div class="settings-item-content">
                  <div class="settings-item-title">隐私设置</div>
                  <div class="settings-item-desc">位置信息、数据收集等</div>
                </div>
                <div class="settings-item-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
              <div class="settings-item" onclick="App.clearAppCache()">
                <div class="settings-item-icon icon-cache">🗑️</div>
                <div class="settings-item-content">
                  <div class="settings-item-title">清除缓存</div>
                  <div class="settings-item-desc">当前缓存 ${this.formatCacheSize(settings.cacheSize)}</div>
                </div>
                <div class="settings-item-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
            
            <div class="settings-group">
              <div class="settings-group-title">关于</div>
              <div class="settings-item" onclick="App.showAbout()">
                <div class="settings-item-icon icon-about">ℹ️</div>
                <div class="settings-item-content">
                  <div class="settings-item-title">关于我们</div>
                  <div class="settings-item-desc">了解趣享本地</div>
                </div>
                <div class="settings-item-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
              <div class="settings-item" onclick="App.showFeedback()">
                <div class="settings-item-icon icon-feedback">💬</div>
                <div class="settings-item-content">
                  <div class="settings-item-title">意见反馈</div>
                  <div class="settings-item-desc">告诉我们您的想法</div>
                </div>
                <div class="settings-item-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
            
            <div class="settings-version">
              <div class="version-num">v${version}</div>
              <div>趣享本地 · 发现身边精彩</div>
            </div>
          </main>

          <nav class="bottom-nav">
            <button class="nav-item" onclick="Router.navigate('/home')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>首页</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/search')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>发现</span>
            </button>
            <button class="nav-item" onclick="Router.navigate('/schedule')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>日程</span>
            </button>
            <button class="nav-item active" onclick="Router.navigate('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>我的</span>
            </button>
          </nav>
        </div>
      `;
    },

    formatCacheSize(size) {
      if (size < 1024) return `${size}KB`;
      return `${(size / 1024).toFixed(1)}MB`;
    },

    openNotificationSettings() {
      const settings = Storage.getSettings();
      const notif = settings.notifications;
      
      Modal.confirm({
        title: '消息通知设置',
        content: `
          <div style="padding: 10px 0;">
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>消息通知总开关</div>
                <div class="notif-setting-desc">关闭后将不接收任何消息推送</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-enabled" ${notif.enabled ? 'checked' : ''} onchange="App.toggleNotification('enabled')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>活动开始提醒</div>
                <div class="notif-setting-desc">活动开始前推送提醒</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-reminder" ${notif.activityReminder ? 'checked' : ''} onchange="App.toggleNotification('activityReminder')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>报名成功通知</div>
                <div class="notif-setting-desc">报名成功后推送通知</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-success" ${notif.bookingSuccess ? 'checked' : ''} onchange="App.toggleNotification('bookingSuccess')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>报名失败通知</div>
                <div class="notif-setting-desc">报名失败时推送通知</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-failure" ${notif.bookingFailure ? 'checked' : ''} onchange="App.toggleNotification('bookingFailure')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>活动取消通知</div>
                <div class="notif-setting-desc">活动取消时推送通知</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-cancel" ${notif.activityCancel ? 'checked' : ''} onchange="App.toggleNotification('activityCancel')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>订阅上新通知</div>
                <div class="notif-setting-desc">订阅的分类有新活动时通知</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-subscription" ${notif.subscription ? 'checked' : ''} onchange="App.toggleNotification('subscription')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>系统公告</div>
                <div class="notif-setting-desc">接收系统公告和更新通知</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="notif-system" ${notif.systemNotice ? 'checked' : ''} onchange="App.toggleNotification('systemNotice')">
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: '完成'
      });
    },

    toggleNotification(key) {
      const current = Storage.getNotificationSetting(key);
      Storage.setNotificationSetting(key, !current);
    },

    openPrivacySettings() {
      const settings = Storage.getSettings();
      const privacy = settings.privacy;
      
      Modal.confirm({
        title: '隐私设置',
        content: `
          <div style="padding: 10px 0;">
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>显示位置信息</div>
                <div class="notif-setting-desc">允许获取位置用于推荐附近活动</div>
              </div>
              <label class="switch">
                <input type="checkbox" ${privacy.showLocation ? 'checked' : ''} onchange="App.togglePrivacy('showLocation')">
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="notif-setting-item">
              <div class="notif-setting-label">
                <div>允许数据收集</div>
                <div class="notif-setting-desc">帮助我们改进产品体验</div>
              </div>
              <label class="switch">
                <input type="checkbox" ${privacy.allowDataCollection ? 'checked' : ''} onchange="App.togglePrivacy('allowDataCollection')">
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: '完成'
      });
    },

    togglePrivacy(key) {
      const settings = Storage.getSettings();
      settings.privacy[key] = !settings.privacy[key];
      Storage.setSettings(settings);
    },

    clearAppCache() {
      Modal.confirm({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？',
        onConfirm: () => {
          Storage.clearCache();
          Toast.success('缓存已清除');
          this.refreshCurrentPage();
        }
      });
    },

    showAbout() {
      Modal.confirm({
        title: '关于趣享本地',
        content: `
          <div style="padding: 10px 0; text-align: center; line-height: 1.8;">
            <div style="font-size: 40px; margin-bottom: 12px;">🎈</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">趣享本地 v${Storage.getAppVersion()}</div>
            <div style="font-size: 14px; color: #6B6B6B; margin-bottom: 16px;">发现身边精彩，趣享本地生活</div>
            <div style="font-size: 13px; color: #999; text-align: left;">
              <p style="margin-bottom: 8px;">📱 精选优质亲子活动</p>
              <p style="margin-bottom: 8px;">📍 智能推荐附近好去处</p>
              <p style="margin-bottom: 8px;">📅 一键报名轻松预约</p>
              <p>❤️ 陪伴孩子快乐成长</p>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: '好的'
      });
    },

    showFeedback() {
      Modal.confirm({
        title: '意见反馈',
        content: `
          <div style="padding: 10px 0;">
            <div style="margin-bottom: 12px;">
              <label style="display:block;font-size:14px;color:#2A2A2A;margin-bottom:8px;">反馈类型</label>
              <select id="feedback-type" style="width:100%;padding:10px;border:1px solid #E8DFD5;border-radius:8px;">
                <option value="bug">问题反馈</option>
                <option value="feature">功能建议</option>
                <option value="content">内容建议</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:14px;color:#2A2A2A;margin-bottom:8px;">详细描述</label>
              <textarea id="feedback-content" rows="4" placeholder="请描述您的问题或建议..." 
                style="width:100%;padding:10px;border:1px solid #E8DFD5;border-radius:8px;resize:none;font-family:inherit;"></textarea>
            </div>
          </div>
        `,
        onConfirm: () => {
          Toast.success('感谢您的反馈，我们会尽快处理');
        }
      });
    },

    // ============================================================
    // 错误处理与异常状态
    // ============================================================

    renderErrorPage(type, title, desc, onRetry) {
      return `
        <div class="error-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
          ${this.renderEmptyStatePremium('network', title, desc, '重新加载', onRetry)}
        </div>
      `;
    },

    renderEmptyState(type, title, desc, actionText = '', action = '') {
      return this.renderEmptyStatePremium(type, title, desc, actionText, action);
    },

    renderLoadFailure(onRetry) {
      return `
        <div class="load-failure">
          <span class="load-failure-icon">⚠️</span>
          <span class="load-failure-text">加载失败，请检查网络</span>
          <button class="load-failure-btn" onclick="${onRetry}">重试</button>
        </div>
      `;
    },

    showNetworkError() {
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = this.renderErrorPage(
          'network',
          '网络连接失败',
          '请检查您的网络连接，然后点击下方按钮重试',
          'App.retryLoad()'
        );
      }
    },

    retryLoad() {
      Toast.info('正在重新加载...');
      setTimeout(() => {
        this.refreshCurrentPage();
      }, 800);
    },

    // ============================================================
    // 无障碍优化
    // ============================================================

    addAccessibilityFeatures() {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = '跳转到主要内容';
      document.body.insertBefore(skipLink, document.body.firstChild);
      
      document.querySelectorAll('img').forEach(img => {
        if (!img.alt) {
          img.alt = '图片';
        }
      });
      
      document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          btn.setAttribute('aria-label', '按钮');
        }
      });
    },

    // ============================================================
    // 个人中心添加设置入口
    // ============================================================

    renderProfileSettingsEntry() {
      return `
        <div class="profile-section-item" onclick="Router.navigate('/settings')">
          <div class="profile-section-icon" style="background:#FFF3E0;">⚙️</div>
          <div class="profile-section-text">
            <div class="profile-section-title">设置</div>
            <div class="profile-section-desc">通知、隐私、关于</div>
          </div>
          <div class="profile-section-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      `;
    },

    // ============================================================
    // 骨架屏加载
    // ============================================================

    renderSkeletonCards(count = 3) {
      const cards = Array.from({ length: count }, (_, i) => `
        <div class="skeleton-card">
          <div class="skeleton-card-image"></div>
          <div class="skeleton-card-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line meta"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      `).join('');
      
      return `<div class="skeleton-cards" aria-busy="true" aria-label="加载中">${cards}</div>`;
    },

    renderSkeletonDetailPage() {
      return `
        <div class="skeleton-detail-page" aria-busy="true" aria-label="加载中">
          <div class="skeleton-detail-cover"></div>
          <div class="skeleton-detail-content">
            <div class="skeleton-line skeleton-detail-title"></div>
            <div class="skeleton-detail-section">
              <div class="skeleton-line skeleton-detail-section-title"></div>
              <div class="skeleton-detail-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line" style="width: 70%"></div>
              </div>
            </div>
            <div class="skeleton-detail-section">
              <div class="skeleton-line skeleton-detail-section-title"></div>
              <div class="skeleton-detail-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line" style="width: 60%"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="bottom-bar" aria-hidden="true">
          <div class="skeleton-line" style="width: 40%; height: 20px; margin: 0;"></div>
          <div class="skeleton-line" style="width: 30%; height: 32px; border-radius: 8px; margin: 0;"></div>
        </div>
      `;
    },

    showSkeleton(containerId, type = 'cards') {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      let skeletonHtml = '';
      if (type === 'detail') {
        skeletonHtml = this.renderSkeletonDetailPage();
      } else {
        skeletonHtml = this.renderSkeletonCards(3);
      }
      
      container.innerHTML = skeletonHtml;
    },

    hideSkeleton(containerId, contentHtml) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = contentHtml;
      container.classList.add('skeleton-fade-in');
      setTimeout(() => container.classList.remove('skeleton-fade-in'), 300);
    },

    // ============================================================
    // 完善下拉刷新
    // ============================================================

    doRefresh() {
      if (this.isRefreshing) return;
      this.isRefreshing = true;

      const indicator = document.getElementById('refresh-indicator');
      if (indicator) {
        const icon = indicator.querySelector('.refresh-indicator-icon');
        const text = indicator.querySelector('.refresh-indicator-text');
        indicator.classList.remove('success', 'error');
        if (icon) {
          icon.classList.add('spin');
          icon.style.transform = 'rotate(0deg)';
        }
        if (text) text.textContent = '正在刷新...';
        indicator.classList.add('visible');
      }

      setTimeout(() => {
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          App.currentPage = 1;
          App.refreshCurrentPage();
          
          if (indicator) {
            const icon = indicator.querySelector('.refresh-indicator-icon');
            const text = indicator.querySelector('.refresh-indicator-text');
            indicator.classList.add('success');
            if (icon) {
              icon.classList.remove('spin');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            if (text) text.textContent = '刷新成功';
            
            setTimeout(() => {
              indicator.classList.remove('visible', 'success');
              const pullContent = document.querySelector('.pull-content');
              if (pullContent) {
                pullContent.style.transform = 'translateY(0)';
              }
            }, 800);
          }
          
          Toast.success('刷新成功');
        } else {
          if (indicator) {
            const icon = indicator.querySelector('.refresh-indicator-icon');
            const text = indicator.querySelector('.refresh-indicator-text');
            indicator.classList.add('error');
            if (icon) {
              icon.classList.remove('spin');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            }
            if (text) text.textContent = '刷新失败，请重试';
            
            setTimeout(() => {
              indicator.classList.remove('visible', 'error');
              const pullContent = document.querySelector('.pull-content');
              if (pullContent) {
                pullContent.style.transform = 'translateY(0)';
              }
            }, 1500);
          }
          
          Toast.error('刷新失败，请检查网络');
        }
        
        this.isRefreshing = false;
      }, 1200);
    },

    // ============================================================
    // 网络状态监听与错误处理
    // ============================================================

    isOnline: true,

    initNetworkMonitor() {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.hideNetworkStatusBar();
        Toast.success('网络已恢复');
        this.refreshCurrentPage();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.showNetworkStatusBar();
      });
    },

    showNetworkStatusBar() {
      let bar = document.getElementById('network-status-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'network-status-bar';
        bar.className = 'network-status-bar';
        bar.setAttribute('role', 'alert');
        bar.innerHTML = '<span>📡 网络连接已断开</span>';
        document.body.appendChild(bar);
      }
      
      setTimeout(() => bar.classList.add('visible'), 10);
    },

    hideNetworkStatusBar() {
      const bar = document.getElementById('network-status-bar');
      if (bar) {
        bar.classList.remove('visible');
        setTimeout(() => bar.remove(), 300);
      }
    },

    // ============================================================
    // 搜索框清除按钮与表单交互
    // ============================================================

    setupSearchClear(inputSelector, clearSelector) {
      const input = document.querySelector(inputSelector);
      const clearBtn = document.querySelector(clearSelector);
      if (!input || !clearBtn) return;
      
      const toggleClear = () => {
        if (input.value.length > 0) {
          clearBtn.style.display = 'flex';
        } else {
          clearBtn.style.display = 'none';
        }
      };
      
      input.addEventListener('input', toggleClear);
      
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        toggleClear();
        input.focus();
        if (typeof this.handleSearchClear === 'function') {
          this.handleSearchClear();
        }
      });
      
      toggleClear();
    },

    setButtonLoading(btn, isLoading, loadingText = '加载中...') {
      if (!btn) return;
      
      if (isLoading) {
        btn.dataset.originalText = btn.textContent;
        btn.classList.add('btn-loading');
        btn.disabled = true;
        btn.innerHTML = loadingText;
      } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || btn.textContent;
      }
    },

    // ============================================================
    // 确认弹窗
    // ============================================================

    showConfirm(options) {
      const {
        title = '提示',
        content = '',
        confirmText = '确定',
        cancelText = '取消',
        type = 'warning',
        onConfirm = null,
        onCancel = null
      } = options;

      const iconSvg = type === 'danger' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'confirm-modal-title');
      
      modal.innerHTML = `
        <div class="confirm-modal-content">
          <div class="confirm-modal-icon ${type}">${iconSvg}</div>
          <div class="confirm-modal-title" id="confirm-modal-title">${title}</div>
          <div class="confirm-modal-desc">${content}</div>
          <div class="confirm-modal-actions">
            <button class="confirm-modal-btn cancel" data-action="cancel" aria-label="${cancelText}">${cancelText}</button>
            <button class="confirm-modal-btn confirm ${type}" data-action="confirm" aria-label="${confirmText}">${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      setTimeout(() => modal.classList.add('visible'), 10);
      
      const closeModal = (action) => {
        modal.classList.remove('visible');
        setTimeout(() => {
          modal.remove();
          if (action === 'confirm' && onConfirm) {
            onConfirm();
          } else if (action === 'cancel' && onCancel) {
            onCancel();
          }
        }, 300);
      };
      
      modal.addEventListener('click', (e) => {
        const action = e.target.dataset?.action;
        if (action) {
          closeModal(action);
        } else if (e.target === modal) {
          closeModal('cancel');
        }
      });
      
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          closeModal('cancel');
          document.removeEventListener('keydown', handleKeydown);
        } else if (e.key === 'Enter') {
          closeModal('confirm');
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);
      
      setTimeout(() => {
        const confirmBtn = modal.querySelector('.confirm-modal-btn.confirm');
        if (confirmBtn) confirmBtn.focus();
      }, 100);
    },

    // ============================================================
    // Toast 增强
    // ============================================================

    showToastEnhanced(message, type = 'info', duration = 2000) {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
      };
      
      let toast = document.querySelector('.toast');
      if (toast) {
        toast.remove();
      }
      
      toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'i'}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('visible'), 10);
      
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    // ============================================================
    // 无障碍增强
    // ============================================================

    enhanceAccessibility() {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('role', 'main');
        mainContent.setAttribute('tabindex', '-1');
      }
      
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach((item, index) => {
        item.setAttribute('role', 'tab');
        item.setAttribute('aria-selected', item.classList.contains('active') ? 'true' : 'false');
        item.setAttribute('tabindex', item.classList.contains('active') ? '0' : '-1');
      });
      
      document.addEventListener('keydown', (e) => {
        const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    },

    renderEmptyStatePremium(type, title, desc, actionText = '', action = '') {
      const typeMap = {
        messages: 'inbox',
        inbox: 'inbox',
        search: 'search',
        favorites: 'favorites',
        bookings: 'bookings',
        schedule: 'schedule',
        network: 'network',
        notFound: 'notFound',
        activities: 'activities'
      };
      const actualType = typeMap[type] || 'activities';
      
      const illustrations = {
        search: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="70" r="50" fill="#FFF5F3"/>
          <circle cx="95" cy="65" r="35" stroke="#E85D4E" stroke-width="3" stroke-linecap="round"/>
          <line x1="122" y1="92" x2="145" y2="115" stroke="#E85D4E" stroke-width="4" stroke-linecap="round"/>
          <circle cx="85" cy="55" r="4" fill="#F4A261"/>
          <circle cx="105" cy="75" r="3" fill="#F4A261"/>
          <path d="M75 80 Q85 70 95 80" stroke="#2A9D8F" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>`,
        favorites: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#FFF5F3"/>
          <path d="M100 110 C60 85 60 50 85 45 C95 43 100 52 100 58 C100 52 105 43 115 45 C140 50 140 85 100 110Z" stroke="#E85D4E" stroke-width="3" fill="#FFF5F3"/>
          <circle cx="80" cy="65" r="3" fill="#F4A261"/>
          <circle cx="120" cy="68" r="2" fill="#2A9D8F"/>
          <path d="M88 80 L95 87 L112 72" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`,
        bookings: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#E8F7F5"/>
          <rect x="65" y="50" width="70" height="60" rx="8" stroke="#2A9D8F" stroke-width="3" fill="white"/>
          <line x1="65" y1="70" x2="135" y2="70" stroke="#2A9D8F" stroke-width="2"/>
          <circle cx="78" cy="60" r="4" fill="#E85D4E"/>
          <circle cx="122" cy="60" r="4" fill="#E85D4E"/>
          <line x1="80" y1="88" x2="120" y2="88" stroke="#2A9D8F" stroke-width="2" stroke-linecap="round"/>
          <line x1="80" y1="98" x2="100" y2="98" stroke="#2A9D8F" stroke-width="2" stroke-linecap="round"/>
          <path d="M85 45 L85 52" stroke="#E85D4E" stroke-width="3" stroke-linecap="round"/>
          <path d="M115 45 L115 52" stroke="#E85D4E" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        inbox: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#FFF5F3"/>
          <path d="M55 65 L100 95 L145 65 V100 C145 105.5 140.5 110 135 110 H65 C59.5 110 55 105.5 55 100 V65Z" stroke="#E85D4E" stroke-width="3" fill="white"/>
          <path d="M55 65 L65 75 H135 L145 65" stroke="#F4A261" stroke-width="2" fill="none"/>
          <circle cx="85" cy="85" r="3" fill="#2A9D8F"/>
          <circle cx="115" cy="88" r="2" fill="#2A9D8F"/>
        </svg>`,
        schedule: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#E8F7F5"/>
          <circle cx="100" cy="75" r="35" stroke="#2A9D8F" stroke-width="3" fill="white"/>
          <path d="M100 55 V75 L115 85" stroke="#E85D4E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="100" cy="50" r="3" fill="#F4A261"/>
          <circle cx="135" cy="75" r="2" fill="#2A9D8F"/>
          <circle cx="65" cy="75" r="2" fill="#2A9D8F"/>
          <circle cx="100" cy="100" r="2" fill="#2A9D8F"/>
        </svg>`,
        network: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#FFF5F3"/>
          <path d="M65 85 Q75 70 100 70 Q125 70 135 85" stroke="#E85D4E" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M75 95 Q85 85 100 85 Q115 85 125 95" stroke="#F4A261" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="105" r="5" fill="#2A9D8F"/>
          <path d="M80 55 L85 45" stroke="#E85D4E" stroke-width="2" stroke-linecap="round"/>
          <path d="M120 55 L115 45" stroke="#E85D4E" stroke-width="2" stroke-linecap="round"/>
          <path d="M100 40 L100 35" stroke="#E85D4E" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        notFound: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#FFF5F3"/>
          <text x="100" y="85" text-anchor="middle" font-size="48" font-weight="700" fill="#E85D4E">404</text>
          <circle cx="75" cy="55" r="6" fill="#F4A261"/>
          <circle cx="125" cy="60" r="4" fill="#2A9D8F"/>
          <path d="M70 105 Q100 115 130 105" stroke="#E85D4E" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>`,
        activities: `<svg class="empty-illustration" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="50" fill="#FFF5F3"/>
          <rect x="60" y="50" width="80" height="60" rx="10" stroke="#E85D4E" stroke-width="3" fill="white"/>
          <rect x="70" y="60" width="35" height="8" rx="4" fill="#F4A261"/>
          <rect x="70" y="75" width="50" height="6" rx="3" fill="#E8F7F5"/>
          <rect x="70" y="87" width="40" height="6" rx="3" fill="#E8F7F5"/>
          <circle cx="130" cy="95" r="15" stroke="#2A9D8F" stroke-width="2" fill="white"/>
          <path d="M124 95 L128 99 L136 91" stroke="#2A9D8F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`
      };

      return `
        <div class="empty-state slide-up">
          ${illustrations[actualType] || illustrations.activities}
          <div class="empty-title">${title}</div>
          <div class="empty-desc">${desc}</div>
          ${actionText ? `<button class="empty-btn" onclick="${action}">${actionText}</button>` : ''}
        </div>
      `;
    },

    renderDesktopSidebar(activePage) {
      if (window.innerWidth < 1024) return '';

      const navItems = [
        { id: 'home', label: '首页', path: '/home', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
        { id: 'search', label: '发现', path: '/search', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' },
        { id: 'favorites', label: '收藏', path: '/favorites', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' },
        { id: 'bookings', label: '预约', path: '/bookings', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' },
        { id: 'schedule', label: '日程', path: '/schedule', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' },
        { id: 'messages', label: '消息', path: '/messages', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' },
        { id: 'profile', label: '我的', path: '/profile', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' }
      ];

      return `
        <aside class="desktop-sidebar">
          <div class="desktop-sidebar-logo">
            <span class="desktop-sidebar-logo-icon">🎈</span>
            <span class="desktop-sidebar-logo-text">趣享本地</span>
          </div>
          ${navItems.map(item => `
            <button class="desktop-nav-item ${activePage === item.id ? 'active' : ''}" onclick="Router.navigate('${item.path}')">
              ${item.icon}
              <span>${item.label}</span>
            </button>
          `).join('')}
        </aside>
      `;
    },

    initStaggerAnimation(selector, delay = 80) {
      const items = document.querySelectorAll(selector);
      items.forEach((item, index) => {
        item.classList.add('stagger-item');
        item.style.animationDelay = `${index * delay}ms`;
      });
    },

    toggleFavoritePremium(activityId, element) {
      const favorites = Storage.getFavorites();
      const isFav = favorites.includes(activityId);
      
      if (isFav) {
        Storage.removeFavorite(activityId);
        element.classList.remove('active');
      } else {
        Storage.addFavorite(activityId);
        element.classList.add('active');
        element.style.animation = 'none';
        setTimeout(() => {
          element.style.animation = '';
        }, 10);
      }
      
      Toast.info(isFav ? '已取消收藏' : '已收藏');
    },

    removeBrandSplash() {
      const splash = document.getElementById('brand-splash');
      if (splash) {
        setTimeout(() => {
          splash.remove();
        }, 2000);
      }
    },

    initSearchClearButton() {
      const searchInput = document.getElementById('search-input');
      const clearBtn = document.querySelector('.search-clear-btn');
      
      if (searchInput && clearBtn) {
        searchInput.addEventListener('input', () => {
          if (searchInput.value.length > 0) {
            clearBtn.classList.add('visible');
            clearBtn.style.display = 'flex';
          } else {
            clearBtn.classList.remove('visible');
            clearBtn.style.display = 'none';
          }
        });

        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearBtn.classList.remove('visible');
          clearBtn.style.display = 'none';
          searchInput.focus();
          App.handleSearchInput(searchInput);
        });
      }
    },

    addButtonLoadingState(btn) {
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }
    },

    removeButtonLoadingState(btn) {
      if (btn) {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
      }
    },

    // ============================================================
    // DOM性能优化工具函数
    // ============================================================
    createFragment() {
      return document.createDocumentFragment();
    },

    appendChildren(parent, children) {
      const fragment = document.createDocumentFragment();
      children.forEach(child => fragment.appendChild(child));
      parent.appendChild(fragment);
    },

    batchUpdate(fn) {
      let rafId = null;
      return function(...args) {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          fn.apply(this, args);
          rafId = null;
        });
      };
    },

    measureLayout(fn) {
      let result;
      requestAnimationFrame(() => {
        result = fn();
      });
      return result;
    },

    updateElements(selector, updater) {
      const elements = document.querySelectorAll(selector);
      const length = elements.length;
      for (let i = 0; i < length; i++) {
        updater(elements[i], i);
      }
    },

    initPageEnhancements(pageName) {
      setTimeout(() => {
        this.enhanceAccessibility();
        this.removeBrandSplash();
        this.initSearchClearButton();
        
        this.initLazyLoading();
        
        this.ensureDesktopSidebar(pageName);
      }, 100);
    },
    
    // ============================================================
    // 图片懒加载实现（优化版：单例Observer + 内存管理）
    // ============================================================
    lazyImageObserver: null,
    lazyImagePlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%23f5f5f5" width="300" height="200"/%3E%3C/svg%3E',
    lazyImageErrorPlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"%3E%3Crect fill="%23f0f0f0" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" fill="%23ccc" text-anchor="middle" dy=".3em" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E',

    getLazyObserver() {
      if (this.lazyImageObserver) return this.lazyImageObserver;
      
      if (!('IntersectionObserver' in window)) {
        return null;
      }
      
      this.lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (!src) {
              observer.unobserve(img);
              return;
            }
            
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.classList.add('loaded');
              img.removeAttribute('data-src');
            };
            tempImg.onerror = () => {
              img.src = this.lazyImageErrorPlaceholder;
              img.classList.add('loaded');
              img.removeAttribute('data-src');
            };
            tempImg.src = src;
            
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.01
      });
      
      return this.lazyImageObserver;
    },

    initLazyLoading() {
      const lazyImages = document.querySelectorAll('img[data-src]:not([data-loaded])');
      if (lazyImages.length === 0) return;
      
      const observer = this.getLazyObserver();
      
      if (!observer) {
        lazyImages.forEach(img => {
          img.src = img.dataset.src;
          img.classList.add('loaded', 'lazy-image');
          img.removeAttribute('data-src');
        });
        return;
      }
      
      lazyImages.forEach(img => {
        img.classList.add('lazy-image');
        if (!img.src) {
          img.src = this.lazyImagePlaceholder;
        }
        observer.observe(img);
      });
    },

    destroyLazyObserver() {
      if (this.lazyImageObserver) {
        this.lazyImageObserver.disconnect();
        this.lazyImageObserver = null;
      }
    },
  };

  window.App = App;
  window.addEventListener('DOMContentLoaded', () => App.init());
})(window);