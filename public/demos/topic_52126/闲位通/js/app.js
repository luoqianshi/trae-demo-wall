// 闲位通 - 应用主逻辑

// 全局状态
let currentPage = 'guide-page';
let pageHistory = [];
let selectedSpot = null;
let currentFilter = { type: 'all', price: 'all' };
let guideInterval = null;
let favoriteSpots = [];
let dialogCallback = null;
let currentReviewOrderId = null;
let currentRating = 0;

// 初始化
function init() {
    setupGuideSlides();
    setupNavigation();
    setupFilters();
    setupFormInteractions();
    initPublishDates();
    renderHomePage();
    renderOrders('active');
    renderMySpots();
    renderIncomeList();
    renderMessages();
}

// 引导页轮播
function setupGuideSlides() {
    const slides = document.querySelectorAll('.guide-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    
    function showSlide(index) {
        const prevSlide = slides[currentSlide];
        const nextSlide = slides[index];
        if (prevSlide && prevSlide !== nextSlide) {
            prevSlide.classList.remove('active');
            prevSlide.classList.add('exit-left');
            setTimeout(() => prevSlide.classList.remove('exit-left'), 500);
        }
        dots.forEach(d => d.classList.remove('active'));
        nextSlide.classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });
    
    // 自动轮播
    guideInterval = setInterval(() => {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }, 3000);
}

// 进入应用
function enterApp() {
    if (guideInterval) { clearInterval(guideInterval); guideInterval = null; }
    showPage('home-page');
}

// 页面切换
function showPage(pageId) {
    // 离开详情页时，移除底部悬浮操作栏
    if (currentPage === 'detail-page') {
        const bar = document.getElementById('detail-bottom-bar-global');
        if (bar) bar.remove();
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active', 'slide-in', 'slide-back');
        // 清理可能残留的下拉刷新状态（防止切换页面时异常）
        page.style.transition = '';
        page.style.transform = '';
        const overlay = page.querySelector('.refresh-overlay');
        if (overlay) overlay.remove();
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // 判断方向：进入子页面从右滑入，返回从左滑入
        const mainPages = ['home-page', 'orders-page', 'profile-page', 'message-page', 'guide-page'];
        if (mainPages.includes(pageId)) {
            targetPage.classList.add('slide-back');
        } else {
            targetPage.classList.add('slide-in');
        }
        pageHistory.push(currentPage);
        currentPage = pageId;
        window.scrollTo(0, 0);
        updateBottomNav(pageId);
        if (pageId === 'home-page') renderHomePage();
        else if (pageId === 'orders-page') renderOrders('active');
        else if (pageId === 'message-page') renderMessages();
        else if (pageId === 'my-spots-page') renderMySpots();
        else if (pageId === 'income-page') renderIncomeList();
        else if (pageId === 'favorites-page') renderFavorites();
        else if (pageId === 'coupons-page') renderCoupons();
    }
}

// 返回上一页
function goBack() {
    // 离开详情页时，移除底部悬浮操作栏
    if (currentPage === 'detail-page') {
        const bar = document.getElementById('detail-bottom-bar-global');
        if (bar) bar.remove();
    }
    if (pageHistory.length > 0) {
        const prevPage = pageHistory.pop();
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(prevPage).classList.add('active');
        currentPage = prevPage;
        updateBottomNav(prevPage);
    }
}

// 更新底部导航状态
function updateBottomNav(pageId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // 子页面映射到对应的主 Tab
    const subPageMap = {
        'my-spots-page': 'profile-page',
        'income-page': 'profile-page',
        'credit-page': 'profile-page',
        'dashboard-page': 'profile-page',
        'favorites-page': 'profile-page',
        'coupons-page': 'profile-page',
        'invite-page': 'profile-page',
        'chat-page': 'profile-page'
    };
    const mappedPage = subPageMap[pageId] || pageId;

    if (mappedPage === 'home-page') navItems[0].classList.add('active');
    else if (mappedPage === 'orders-page') navItems[1].classList.add('active');
    else if (mappedPage === 'profile-page') navItems[2].classList.add('active');
    else if (mappedPage === 'message-page') navItems[3].classList.add('active');
}

// 下拉刷新动画（transform 方案，完全不触发重排，GPU 加速）
function triggerRefresh(pageId) {
    const pageEl = document.getElementById(pageId);
    if (!pageEl) return;

    // 如果正在刷新中，忽略重复点击
    if (pageEl.querySelector('.refresh-overlay')) return;

    // 清除页面转场动画（animation-fill-mode:both 会锁定 transform，覆盖 inline style）
    pageEl.style.animation = 'none';
    pageEl.classList.remove('slide-in', 'slide-back', 'slide-out');

    // 1. 插入遮罩（absolute 定位在 page 顶部上方）
    const overlay = document.createElement('div');
    overlay.className = 'refresh-overlay';
    overlay.innerHTML = '<div class="refresh-spinner"></div><div class="refresh-text">拉取数据中...</div>';
    pageEl.prepend(overlay);

    // 2. 给 page 添加 transform 过渡，整体下移（GPU 加速，不触发重排）
    pageEl.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            pageEl.style.transform = 'translateY(80px)';
        });
    });

    // 3. 展开动画完成后渲染数据（停留 800ms，让用户感知到刷新过程）
    setTimeout(() => {
        requestAnimationFrame(() => {
            if (pageId === 'home-page') {
                renderHomePage();
            } else if (pageId === 'orders-page') {
                const activeTab = document.querySelector('.order-tab.active');
                renderOrders(activeTab ? activeTab.dataset.status : 'active');
            } else if (pageId === 'profile-page') {
                renderMySpots();
                renderIncomeList();
            }

            // 渲染完成后更新刷新文字
            const refreshTextEl = pageEl.querySelector('.refresh-text');
            if (refreshTextEl) refreshTextEl.textContent = '刷新完成!';

            // 4. 收起
            requestAnimationFrame(() => {
                pageEl.style.transform = 'translateY(0)';
            });
        });
    }, 800);

    // 5. 收起完成后清理 DOM 和样式
    setTimeout(() => {
        pageEl.style.transition = '';
        pageEl.style.transform = '';
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 1200);
}

// 位置选择器
function showLocationPicker() {
    const picker = document.getElementById('location-picker');
    if (picker) {
        picker.classList.add('show');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const input = document.getElementById('location-search-input');
            if (input) input.focus();
        }, 350);
    }
}

function closeLocationPicker() {
    const picker = document.getElementById('location-picker');
    if (picker) picker.classList.remove('show');
    document.body.style.overflow = '';
}

function selectLocation(name) {
    const el = document.getElementById('current-location');
    if (el) el.textContent = name;
    closeLocationPicker();
    showToast('已切换到：' + name);
    // 刷新首页数据
    renderHomePage();
}

// 设置底部导航
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.dataset.page;
            if (pageId) {
                // 如果点击的是当前页面
                if (pageId === currentPage) {
                    // "首页"和"订单"支持下拉刷新，"我的"和"消息"静默
                    if (!['profile-page', 'message-page'].includes(pageId)) {
                        triggerRefresh(pageId);
                    }
                } else {
                    showPage(pageId);
                }
            }
        });
    });
}

// 筛选面板切换
function toggleFilter() {
    const panel = document.getElementById('filter-panel');
    panel.classList.toggle('show');
}

// 设置筛选
function setupFilters() {
    document.querySelectorAll('.filter-option[data-filter]').forEach(option => {
        option.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentFilter.type = this.dataset.filter;
            renderHomePage();
        });
    });
    
    document.querySelectorAll('.filter-option[data-price]').forEach(option => {
        option.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentFilter.price = this.dataset.price;
            renderHomePage();
        });
    });
}

// 渲染首页
function renderHomePage() {
    renderBanner();
    renderMapPins();
    renderSpotList();
}

// 渲染活动轮播 Banner
let bannerIndex = 0;
let bannerInterval = null;

function renderBanner() {
    const container = document.getElementById('home-banner');
    if (!container) return;
    const banners = [
        { title: '新用户首单立减5元', desc: '注册即享专属优惠', bg: 'linear-gradient(135deg, #ff6b35, #ff9f43)', btn: '立即领取' },
        { title: '邀请好友 赚佣金', desc: '每成功邀请1人得10元', bg: 'linear-gradient(135deg, #2ed573, #7bed9f)', btn: '去邀请' },
        { title: '周末停车特惠', desc: '精选车位低至5元/天', bg: 'linear-gradient(135deg, #5352ed, #a29bfe)', btn: '查看详情' },
    ];
    container.innerHTML = `
        <div class="banner-wrapper">
            <div class="banner-track" id="banner-track">
                ${banners.map((b, i) => `
                    <div class="banner-slide" style="background:${b.bg}">
                        <div class="banner-content">
                            <div class="banner-title">${b.title}</div>
                            <div class="banner-desc">${b.desc}</div>
                            <div class="banner-btn" onclick="showToast('活动即将上线')">${b.btn}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="banner-dots" id="banner-dots">
                ${banners.map((_, i) => `<span class="banner-dot ${i === 0 ? 'active' : ''}" onclick="slideBanner(${i})"></span>`).join('')}
            </div>
        </div>
    `;
    // 自动轮播
    startBannerAutoplay();
}

function slideBanner(index) {
    bannerIndex = index;
    const track = document.getElementById('banner-track');
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startBannerAutoplay() {
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        slideBanner((bannerIndex + 1) % 3);
    }, 4000);
}

// 渲染地图标记
function renderMapPins() {
    const pinsContainer = document.getElementById('map-pins');
    if (!pinsContainer) return;
    
    let filteredSpots = parkingSpots;
    
    // 应用筛选
    if (currentFilter.type !== 'all') {
        filteredSpots = filteredSpots.filter(s => s.type === currentFilter.type);
    }
    if (currentFilter.price !== 'all') {
        if (currentFilter.price === '0-10') {
            filteredSpots = filteredSpots.filter(s => s.price <= 10);
        } else if (currentFilter.price === '10-20') {
            filteredSpots = filteredSpots.filter(s => s.price > 10 && s.price <= 20);
        } else if (currentFilter.price === '20+') {
            filteredSpots = filteredSpots.filter(s => s.price > 20);
        }
    }
    
    pinsContainer.innerHTML = filteredSpots.map(spot => `
        <div class="pin ${spot.status}" style="${getPositionStyle(spot.mapPosition)}" onclick="highlightPin(this); showSpotDetail('${spot.id}')">
            <div class="pin-icon"></div>
            <div class="pin-price">¥${spot.price}/天</div>
        </div>
    `).join('');
    
    // 更新统计
    document.getElementById('available-count').textContent = filteredSpots.filter(s => s.status === 'available').length;
}

function getPositionStyle(pos) {
    if (!pos) return 'top: 50%; left: 50%;';
    return Object.entries(pos).map(([key, value]) => `${key}: ${value}`).join('; ');
}

// 渲染车位列表
function renderSpotList() {
    const listContainer = document.getElementById('spot-list');
    if (!listContainer) return;
    
    let filteredSpots = parkingSpots;
    
    // 应用筛选
    if (currentFilter.type !== 'all') {
        filteredSpots = filteredSpots.filter(s => s.type === currentFilter.type);
    }
    if (currentFilter.price !== 'all') {
        if (currentFilter.price === '0-10') {
            filteredSpots = filteredSpots.filter(s => s.price <= 10);
        } else if (currentFilter.price === '10-20') {
            filteredSpots = filteredSpots.filter(s => s.price > 10 && s.price <= 20);
        } else if (currentFilter.price === '20+') {
            filteredSpots = filteredSpots.filter(s => s.price > 20);
        }
    }
    
    listContainer.innerHTML = filteredSpots.map(spot => `
        <div class="spot-card" onclick="showSpotDetail('${spot.id}')">
            <button class="favorite-btn ${isFavorited(spot.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${spot.id}')">${isFavorited(spot.id) ? '❤' : '🤍'}</button>
            <div class="spot-image ${spot.type}">
                <div class="spot-image-icon">
                    <div class="p-letter">P</div>
                    <div class="type-label">${getTypeName(spot.type)}</div>
                </div>
            </div>
            <div class="spot-info">
                <div class="spot-name">${spot.name}</div>
                <div class="spot-address">📍 ${spot.address}</div>
                <div class="spot-tags">
                    <span class="tag type">${getTypeName(spot.type)}</span>
                    ${spot.features.map(f => `<span class="tag">${f}</span>`).join('')}
                </div>
                <div class="spot-meta">
                    <div class="spot-time">⏰ ${spot.timeRange.start} - ${spot.timeRange.end}</div>
                    <div class="spot-price">
                        <div class="price-number">¥${spot.price}</div>
                        <div class="price-unit">/天</div>
                        <div class="spot-distance">${formatDistance(spot.distance)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // 更新筛选标题计数
    updateSpotCount(filteredSpots);
}

// 显示车位详情
function showSpotDetail(spotId) {
    selectedSpot = parkingSpots.find(s => s.id === spotId);
    if (!selectedSpot) return;
    
    const detailContent = document.getElementById('detail-content');
    if (!detailContent) return;
    
    detailContent.innerHTML = `
        <div class="detail-card">
            <div class="detail-spot-header">
                <div class="detail-spot-image ${selectedSpot.type}">
                    <div class="spot-image-icon">
                        <div class="p-letter">P</div>
                        <div class="type-label">${getTypeName(selectedSpot.type)}</div>
                    </div>
                </div>
                <div class="detail-spot-info">
                    <h3>${selectedSpot.name}</h3>
                    <p>📍 ${selectedSpot.address}</p>
                    <p>📏 ${formatDistance(selectedSpot.distance)}</p>
                    <p>⭐ ${selectedSpot.rating}分 (${selectedSpot.reviews}条评价)</p>
                </div>
                <button class="detail-fav-btn ${isFavorited(selectedSpot.id) ? 'active' : ''}" onclick="toggleFavorite('${selectedSpot.id}')">${isFavorited(selectedSpot.id) ? '❤' : '🤍'}</button>
            </div>
            <div class="detail-price">
                ¥${selectedSpot.price}<span>/天</span>
            </div>
            <div class="spot-tags">
                <span class="tag type">${getTypeName(selectedSpot.type)}</span>
                ${selectedSpot.features.map(f => `<span class="tag">${f}</span>`).join('')}
            </div>
        </div>
        
        <div class="detail-card">
            <div class="detail-section">
                <h4>车位描述</h4>
                <p style="font-size: 14px; color: #666; line-height: 1.6;">${selectedSpot.desc}</p>
            </div>
            <div class="detail-section">
                <h4>可停时段</h4>
                <p style="font-size: 14px; color: #666;">⏰ ${selectedSpot.timeRange.start} - ${selectedSpot.timeRange.end}</p>
            </div>
        </div>
        
        <div class="detail-card">
            <h4>本周可租情况</h4>
            <div class="week-calendar">
                ${generateWeekCalendar()}
            </div>
        </div>
        
        <div class="detail-card">
            <div class="detail-section" style="border-top: none; margin-top: 0; padding-top: 0;">
                <h4>车主信息</h4>
                <div class="owner-info">
                    <div class="owner-avatar">${selectedSpot.owner.avatar}</div>
                    <div class="owner-detail">
                        <h5>${selectedSpot.owner.name}</h5>
                        <p>信用分: ${selectedSpot.owner.credit} ⭐</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>用户评价 (${selectedSpot.reviews}条)</h4>
            <div class="review-list">
                ${(selectedSpot.reviewList || []).map(r => `
                    <div class="review-item">
                        <div class="review-header">
                            <div class="review-avatar">${r.avatar}</div>
                            <span class="review-name">${r.name}</span>
                            <span class="review-date">${r.date}</span>
                        </div>
                        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                        <div class="review-text">${r.text}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // 移除旧的底部操作栏（防止重复创建）
    const oldBar = document.querySelector('.detail-bottom-bar');
    if (oldBar) oldBar.remove();
    
    // 将底部操作栏追加到 body 级别，完全脱离 .page 的 position:relative 嵌套
    // 这是移动端 fixed 定位失效的唯一可靠解决方案
    const bar = document.createElement('div');
    if (selectedSpot.status === 'available') {
        bar.className = 'detail-bottom-bar';
        bar.innerHTML = `
            <div class="detail-bottom-price">
                <span class="price-big">¥${selectedSpot.price}</span>
                <span class="price-unit">/天</span>
            </div>
            <button class="book-btn" onclick="showBookingPage()">立即预约</button>`;
    } else {
        bar.className = 'detail-bottom-bar detail-bottom-bar-disabled';
        bar.innerHTML = `
            <div class="detail-bottom-price">
                <span class="price-big">¥${selectedSpot.price}</span>
                <span class="price-unit">/天</span>
            </div>
            <span class="detail-status-text">该车位暂不可预约</span>`;
    }
    bar.id = 'detail-bottom-bar-global';
    document.body.appendChild(bar);
    
    showPage('detail-page');
}

// 显示预约页面
function showBookingPage() {
    if (!selectedSpot) return;
    
    const bookingContent = document.getElementById('booking-content');
    if (!bookingContent) return;
    
    bookingContent.innerHTML = `
        <div class="booking-card">
            <div class="date-selector">
                <div class="date-option selected" data-date-offset="0" onclick="selectDate(this)">
                    <div class="date-day">今天</div>
                    <div class="date-val">${new Date().getDate()}</div>
                    <div class="date-month">${new Date().getMonth()+1}月</div>
                </div>
                <div class="date-option" data-date-offset="1" onclick="selectDate(this)">
                    <div class="date-day">明天</div>
                    <div class="date-val">${new Date().getDate()+1}</div>
                    <div class="date-month">${new Date().getMonth()+1}月</div>
                </div>
                <div class="date-option" data-date-offset="2" onclick="selectDate(this)">
                    <div class="date-day">后天</div>
                    <div class="date-val">${new Date().getDate()+2}</div>
                    <div class="date-month">${new Date().getMonth()+1}月</div>
                </div>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">车位名称</span>
                <span class="booking-value">${selectedSpot.name}</span>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">车位地址</span>
                <span class="booking-value">${selectedSpot.address}</span>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">预约日期</span>
                <span class="booking-value" id="booking-date">${formatDate(0)}</span>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">停车时段</span>
                <span class="booking-value">${selectedSpot.timeRange.start} - ${selectedSpot.timeRange.end}</span>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">车主</span>
                <span class="booking-value">${selectedSpot.owner.name}</span>
            </div>
            <div class="booking-info-row">
                <span class="booking-label">单价</span>
                <span class="booking-value">¥${selectedSpot.price}/天</span>
            </div>
        </div>
        
        <div class="booking-card">
            <div class="booking-info-row" style="border-bottom: none;">
                <span class="booking-label">支付方式</span>
                <span class="booking-value">微信支付</span>
            </div>
        </div>
        
        <div class="booking-total">
            合计: ¥${selectedSpot.price}
        </div>
        
        <button class="confirm-btn" onclick="confirmBooking()">确认支付</button>
    `;
    
    showPage('booking-page');
}

// 确认预约
function confirmBooking() {
    showToast('预约成功！');
    
    const selectedDateEl = document.querySelector('.date-option.selected');
    const dateOffset = selectedDateEl ? parseInt(selectedDateEl.dataset.dateOffset) : 0;
    
    // 创建新订单
    const newOrder = {
        id: 'XWT' + Date.now(),
        spotId: selectedSpot.id,
        status: 'pending',
        date: formatDate(dateOffset),
        timeRange: selectedSpot.timeRange,
        amount: selectedSpot.price,
        spotName: selectedSpot.name,
        spotAddress: selectedSpot.address,
        ownerName: selectedSpot.owner.name
    };
    
    orders.unshift(newOrder);
    
    setTimeout(() => {
        showPage('orders-page');
        renderOrders('pending');
    }, 1500);
}

// 渲染订单列表
function renderOrders(status) {
    const orderList = document.getElementById('order-list');
    if (!orderList) return;
    
    const filteredOrders = orders.filter(o => o.status === status);
    
    if (filteredOrders.length === 0) {
        orderList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"></div>
                <div class="empty-state-title">暂无${getStatusText(status)}订单</div>
                <div class="empty-state-desc">快去附近找找合适的车位吧</div>
                <button class="empty-state-btn" onclick="showPage('home-page')">去预约车位</button>
            </div>
        `;
        return;
    }
    
    orderList.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">订单号：${order.id}</span>
                <span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-detail">
                <div class="spot-image" style="width:60px;height:60px;font-size:24px;">${getTypeIcon(parkingSpots.find(s => s.id === order.spotId)?.type || 'ground')}</div>
                <div class="order-info">
                    <div class="spot-name">${order.spotName}</div>
                    <p>📍 ${order.spotAddress}</p>
                    <p>⏰ ${order.date} ${order.timeRange.start} - ${order.timeRange.end}</p>
                    <p>💰 ¥${order.amount}.00</p>
                </div>
            </div>
            <div class="order-actions">
                ${getOrderActions(order)}
            </div>
            ${order.status === 'active' ? `<div class="order-countdown" id="countdown-${order.id}"></div>` : ''}
        </div>
    `).join('');

    updateCountdowns();
}

// 获取订单操作按钮
function getOrderActions(order) {
    if (order.status === 'active') {
        return `
            <button class="btn-outline" onclick="showToast('正在打开导航...')">导航去车位</button>
            <button class="btn-primary" onclick="openChat('${order.ownerName}', '${order.spotName}')">联系车主</button>
        `;
    } else if (order.status === 'pending') {
        return `
            <button class="btn-outline" onclick="cancelOrder('${order.id}')">取消订单</button>
            <button class="btn-primary" onclick="showToast('导航中...')">导航去车位</button>
        `;
    } else {
        return `
            <button class="btn-outline" onclick="showSpotDetail('${order.spotId}')">再次预约</button>
            <button class="btn-outline" onclick="openReview('${order.id}')">评价</button>
        `;
    }
}

// 取消订单
function cancelOrder(orderId) {
    showDialog('取消订单', '确定要取消该订单吗？取消后将退还停车费用。', function() {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
            orders.splice(orderIndex, 1);
            showToast('订单已取消');
            const activeTab = document.querySelector('.order-tab.active');
            renderOrders(activeTab ? activeTab.dataset.status : 'pending');
        }
    });
}

// 设置订单标签切换
function setupOrderTabs() {
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderOrders(this.dataset.status);
        });
    });
}

// 设置页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    setupOrderTabs();
});

// 渲染我的车位
function renderMySpots() {
    const container = document.getElementById('my-spots-list');
    if (!container) return;
    
    container.innerHTML = mySpots.map(spot => `
        <div class="my-spot-card">
            <div class="my-spot-header">
                <div>
                    <div class="my-spot-name">${spot.name}</div>
                    <div style="font-size: 13px; color: #999; margin-top: 4px;">📍 ${spot.address}</div>
                </div>
                <div class="my-spot-status" style="display:flex;align-items:center;gap:8px;">
                    <div class="toggle-switch ${spot.status === 'published' ? 'active' : ''}" onclick="event.stopPropagation();toggleSpotStatus('${spot.id}')"></div>
                    <span style="font-size:13px;color:${spot.status === 'published' ? '#2ed573' : 'var(--muted)'}">${spot.status === 'published' ? '已发布' : '已下线'}</span>
                </div>
            </div>
            <div class="spot-tags">
                <span class="tag type">${getTypeName(spot.type)}</span>
                <span class="tag">¥${spot.price}/天</span>
                <span class="tag">⏰ ${spot.timeRange.start}-${spot.timeRange.end}</span>
            </div>
            <div class="my-spot-footer">
                <div class="my-spot-stats">
                    <div class="my-spot-stat">预约 <span>${spot.bookings}</span> 次</div>
                    <div class="my-spot-stat">收益 <span>¥${spot.income}</span></div>
                </div>
                <button class="view-bookings-btn" onclick="event.stopPropagation();showBookingRecords('${spot.id}')">查看预约</button>
            </div>
        </div>
    `).join('');
}

function showBookingRecords(spotId) {
    const spot = mySpots.find(s => s.id === spotId);
    if (!spot) return;
    document.getElementById('booking-records-title').textContent = spot.name + ' - 预约记录';
    const list = document.getElementById('booking-records-list');
    if (!spot.bookingRecords || spot.bookingRecords.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding:40px 0;"><div class="empty-state-icon"></div><p>暂无预约记录</p></div>';
    } else {
        list.innerHTML = spot.bookingRecords.map(r => `
            <div class="booking-record-item">
                <div class="booking-record-avatar">${r.user.charAt(0)}</div>
                <div class="booking-record-info">
                    <div class="booking-record-user">${r.user}</div>
                    <div class="booking-record-time">${r.date} · ${r.timeRange.start} - ${r.timeRange.end}</div>
                </div>
                <div class="booking-record-right">
                    <div class="booking-record-amount">+¥${r.amount}</div>
                    <div class="booking-record-status ${r.status}">${r.status === 'completed' ? '已完成' : '待使用'}</div>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('booking-records-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBookingRecords() {
    document.getElementById('booking-records-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

// 渲染收益列表
function renderIncomeList() {
    const container = document.getElementById('income-list');
    if (!container) return;
    
    container.innerHTML = incomeRecords.map(record => `
        <div class="income-item">
            <div class="income-item-info">
                <h4>${record.spotName}</h4>
                <p>${record.date}</p>
            </div>
            <div class="income-item-amount">+¥${record.amount}</div>
        </div>
    `).join('');
}

// 表单交互设置
function setupFormInteractions() {
    // 车位类型选择
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // 价格选项
    document.querySelectorAll('.price-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.price-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('custom-price-input').value = this.dataset.price;
        });
    });
    
    // 标签选择
    document.querySelectorAll('.tag-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase();
            if (keyword) {
                document.getElementById('map-pins').innerHTML = '';
                const filtered = parkingSpots.filter(s => 
                    s.name.toLowerCase().includes(keyword) || 
                    s.address.toLowerCase().includes(keyword)
                );
                renderFilteredSpots(filtered);
            } else {
                renderSpotList();
            }
        });
    }
}

// 渲染筛选后的车位
function renderFilteredSpots(spots) {
    const listContainer = document.getElementById('spot-list');
    if (!listContainer) return;
    
    if (spots.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"></div>
                <div class="empty-state-title">未找到匹配的车位</div>
                <div class="empty-state-desc">换个关键词试试吧</div>
            </div>
        `;
        // 更新筛选标题计数
        updateSpotCount(spots);
        return;
    }
    
    listContainer.innerHTML = spots.map(spot => `
        <div class="spot-card" onclick="showSpotDetail('${spot.id}')">
            <button class="favorite-btn ${isFavorited(spot.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${spot.id}')">${isFavorited(spot.id) ? '❤' : '🤍'}</button>
            <div class="spot-image ${spot.type}">
                <div class="spot-image-icon">
                    <div class="p-letter">P</div>
                    <div class="type-label">${getTypeName(spot.type)}</div>
                </div>
            </div>
            <div class="spot-info">
                <div class="spot-name">${spot.name}</div>
                <div class="spot-address">📍 ${spot.address}</div>
                <div class="spot-tags">
                    <span class="tag type">${getTypeName(spot.type)}</span>
                    ${spot.features.map(f => `<span class="tag">${f}</span>`).join('')}
                </div>
                <div class="spot-meta">
                    <div class="spot-time">⏰ ${spot.timeRange.start} - ${spot.timeRange.end}</div>
                    <div class="spot-price">
                        <div class="price-number">¥${spot.price}</div>
                        <div class="price-unit">/天</div>
                        <div class="spot-distance">${formatDistance(spot.distance)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // 更新筛选标题计数
    updateSpotCount(spots);
}

// 模拟上传
function simulateUpload() {
    showToast('照片上传成功！');
    const uploadArea = document.querySelector('.photo-upload');
    if (uploadArea) {
        uploadArea.innerHTML = '<span style="font-size: 32px;">✅</span><span style="font-size: 12px;">上传成功</span>';
        uploadArea.style.borderColor = '#1dd1a1';
        uploadArea.style.color = '#1dd1a1';
    }
}

// 发布车位
function publishSpot() {
    const location = document.getElementById('publish-location').value;
    const timeStart = document.getElementById('time-start').value;
    const timeEnd = document.getElementById('time-end').value;
    const price = document.getElementById('custom-price-input').value;
    const desc = document.getElementById('publish-desc').value;
    
    if (!location) {
        showToast('请填写车位位置');
        return;
    }
    
    // 获取选中的类型
    const selectedType = document.querySelector('.type-option.selected');
    const type = selectedType ? selectedType.dataset.type : 'ground';
    
    // 获取选中的标签
    const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(t => t.dataset.tag);
    
    // 创建新车位
    const newSpot = {
        id: 'SP' + Date.now(),
        name: location,
        address: location,
        distance: Math.floor(Math.random() * 1000),
        type: type,
        features: selectedTags.length > 0 ? selectedTags : ['有监控'],
        timeRange: { start: timeStart, end: timeEnd },
        price: parseInt(price) || 10,
        owner: { name: '我', credit: 5.0, avatar: '👤' },
        rating: 5.0,
        reviews: 0,
        status: 'available',
        desc: desc || '新发布的车位',
        mapPosition: { top: Math.floor(Math.random() * 150) + 'px', left: Math.floor(Math.random() * 300) + 'px' }
    };
    
    parkingSpots.unshift(newSpot);
    
    // 添加到我的车位
    mySpots.unshift({
        id: 'MY' + Date.now(),
        name: location,
        address: location,
        type: type,
        price: parseInt(price) || 10,
        timeRange: { start: timeStart, end: timeEnd },
        status: 'published',
        bookings: 0,
        income: 0
    });
    
    showToast('发布成功！');
    
    // 立即跳转到首页
    showPage('home-page');
    return;
    // 完全重置表单
    document.getElementById('publish-location').value = '';
    document.getElementById('publish-desc').value = '';
    document.getElementById('time-start').value = '08:00';
    document.getElementById('time-end').value = '18:00';
    document.getElementById('custom-price-input').value = '10';
    document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('.price-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.price-option[data-price="10"]').classList.add('selected');
    document.querySelectorAll('.tag-option').forEach(t => t.classList.remove('selected'));
    // 重置重复选项为"仅工作日"
    document.querySelectorAll('#repeat-options .repeat-option').forEach(opt => opt.classList.remove('active'));
    const weekdayOpt = document.querySelector('#repeat-options .repeat-option[data-repeat="weekday"]');
    if (weekdayOpt) weekdayOpt.classList.add('active');
    // 重置上传区域
    const uploadArea = document.querySelector('.photo-upload');
    if (uploadArea && uploadArea.innerHTML.includes('✅')) {
        uploadArea.innerHTML = '<span class="upload-icon">📷</span><span class="upload-text">点击上传照片</span>';
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.color = '#999';
    }
    // 重置日期（延迟到下次进入发布页时初始化）
    
    setTimeout(() => {
        showPage('home-page');
        renderHomePage();
    }, 1500);
}

// Toast 提示
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 页面加载完成后初始化 - 确保只执行一次
if (!window.appInitialized) {
    window.appInitialized = true;
    document.addEventListener('DOMContentLoaded', init);
}

// ===== 新增辅助函数 =====

// 收藏功能
function toggleFavorite(spotId) {
    const idx = favoriteSpots.indexOf(spotId);
    if (idx > -1) {
        favoriteSpots.splice(idx, 1);
        showToast('已取消收藏');
    } else {
        favoriteSpots.push(spotId);
        showToast('已收藏');
    }
    // 刷新首页列表和详情页收藏按钮状态
    renderHomePage();
    if (selectedSpot && selectedSpot.id === spotId) {
        showSpotDetail(spotId);
    }
}

function isFavorited(spotId) { return favoriteSpots.includes(spotId); }

// 分享功能
function shareSpot() {
    if (selectedSpot) {
        showToast('链接已复制到剪贴板');
    }
}

// 渲染我的收藏列表
function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;
    const spots = parkingSpots.filter(s => favoriteSpots.includes(s.id));
    if (spots.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"></div><p>暂无收藏</p><p style="font-size:13px;color:var(--muted)">去首页逛逛，收藏喜欢的车位吧</p></div>';
        return;
    }
    container.innerHTML = spots.map(spot => `
        <div class="spot-card" onclick="showSpotDetail('${spot.id}')" style="margin: 12px 16px;">
            <button class="favorite-btn active" onclick="event.stopPropagation(); toggleFavorite('${spot.id}')">❤</button>
            <div class="spot-image ${spot.type}">
                <div class="spot-image-icon">
                    <div class="p-letter">P</div>
                    <div class="type-label">${getTypeName(spot.type)}</div>
                </div>
            </div>
            <div class="spot-info">
                <div class="spot-name">${spot.name}</div>
                <div class="spot-address">📍 ${spot.address}</div>
                <div class="spot-meta">
                    <div class="spot-time">⏰ ${spot.timeRange.start} - ${spot.timeRange.end}</div>
                    <div class="spot-price">
                        <div class="price-number">¥${spot.price}</div>
                        <div class="price-unit">/天</div>
                        <div class="spot-distance">${formatDistance(spot.distance)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染优惠券列表
function renderCoupons() {
    const container = document.getElementById('coupons-list');
    if (!container) return;
    if (coupons.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"></div><p>暂无优惠券</p></div>';
        return;
    }
    container.innerHTML = coupons.map(c => `
        <div class="coupon-card ${c.status === 'used' ? 'used' : ''}">
            <div class="coupon-amount">
                <span class="coupon-symbol">${c.type === 'percent' ? '' : '¥'}</span>
                <span class="coupon-number">${c.type === 'percent' ? c.value : c.value}</span>
                ${c.type === 'percent' ? '<span class="coupon-unit">折</span>' : ''}
            </div>
            <div class="coupon-info">
                <div class="coupon-condition">${c.name}</div>
                <div class="coupon-expire">${c.condition} | 有效期至 ${c.expireDate}</div>
            </div>
            <div class="coupon-status">${c.status === 'used' ? '已使用' : '去使用'}</div>
        </div>
    `).join('');
}

// Dialog 确认弹窗
function showDialog(title, msg, callback) {
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-msg').textContent = msg;
    dialogCallback = callback;
    document.getElementById('dialog-overlay').classList.add('show');
}

function closeDialog() {
    document.getElementById('dialog-overlay').classList.remove('show');
    dialogCallback = null;
}

function confirmDialog() {
    if (dialogCallback) dialogCallback();
    closeDialog();
}

// 评价功能
function openReview(orderId) {
    currentReviewOrderId = orderId;
    currentRating = 0;
    document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('active'));
    document.getElementById('review-text').value = '';
    document.getElementById('review-dialog').classList.add('show');
}

function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('#star-rating .star').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
    });
}

function submitReview() {
    if (currentRating === 0) { showToast('请选择评分'); return; }
    document.getElementById('review-dialog').classList.remove('show');
    showToast('评价提交成功，感谢反馈！');
}

// 日期选择辅助函数
function selectDate(el) {
    document.querySelectorAll('.date-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    const offset = parseInt(el.dataset.dateOffset);
    document.getElementById('booking-date').textContent = formatDate(offset);
}

function formatDate(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// 初始化发布页默认日期
function initPublishDates() {
    const today = formatDate(0);
    const nextWeek = formatDate(7);
    const dateStart = document.getElementById('publish-date-start');
    const dateEnd = document.getElementById('publish-date-end');
    if (dateStart) dateStart.value = today;
    if (dateEnd) dateEnd.value = nextWeek;
}

// 重复日期选择
function selectRepeat(el) {
    document.querySelectorAll('#repeat-options .repeat-option').forEach(opt => opt.classList.remove('active'));
    el.classList.add('active');
}

// 地图pin高亮
function highlightPin(el) {
    document.querySelectorAll('.pin').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
}

// 切换车位上线/下线状态
function toggleSpotStatus(spotId) {
    const spot = mySpots.find(s => s.id === spotId);
    if (!spot) return;
    spot.status = spot.status === 'published' ? 'offline' : 'published';
    showToast(spot.status === 'published' ? '车位已上线' : '车位已下线');
    renderMySpots();
}

// 生成本周日历视图
function generateWeekCalendar() {
    const days = ['一','二','三','四','五','六','日'];
    const today = new Date().getDay(); // 0=周日
    const booked = [today === 0 ? 7 : today, (today === 0 ? 7 : today) + 1, (today === 0 ? 7 : today) + 2];
    return days.map((d, i) => {
        const dayNum = i + 1;
        const isBooked = booked.includes(dayNum);
        return `<div class="cal-day ${isBooked ? 'booked' : ''}">
            <span class="cal-day-name">周${d}</span>
            <span class="cal-day-status">${isBooked ? '已约' : '可租'}</span>
        </div>`;
    }).join('');
}

// 渲染消息中心
function renderMessages() {
    const container = document.getElementById('message-list-dynamic');
    if (!container) return;

    // 合并预约通知和静态系统消息
    const systemMessages = [
        { id: 'SYS001', type: 'system', title: '系统通知', content: '您发布的车位已通过审核，开始接收预约', time: '10分钟前', icon: '📢', iconBg: '#e8f4fd', read: false },
        { id: 'SYS002', type: 'system', title: '收益到账', content: '您的一笔车位收益 ¥10 已到账', time: '2小时前', icon: '💰', iconBg: '#fff3e0', read: true },
        { id: 'SYS003', type: 'system', title: '新评价', content: '李女士给您的好评：车位很干净，位置好找', time: '昨天', icon: '⭐', iconBg: '#fce4ec', read: true },
        { id: 'SYS004', type: 'system', title: '活动通知', content: '邀请好友注册，双方各得 ¥5 优惠券', time: '3天前', icon: '🎉', iconBg: '#f3e5f5', read: true },
    ];

    const allMessages = [...bookingNotifications, ...systemMessages];

    let html = '<div class="message-date-group">今天</div>';

    html += allMessages.map(msg => {
        const isBooking = msg.type === 'booking';
        const iconBg = isBooking ? '#fff3e0' : (msg.iconBg || '#e8f4fd');
        const icon = isBooking ? '📅' : (msg.icon || '📢');

        let actionsHtml = '';
        if (isBooking && !msg.read) {
            actionsHtml = `
                <div class="booking-notification-actions" onclick="event.stopPropagation()">
                    <button class="btn-booking-confirm" onclick="handleBookingNotification('${msg.id}', 'confirm')">确认</button>
                    <button class="btn-booking-reject" onclick="handleBookingNotification('${msg.id}', 'reject')">拒绝</button>
                </div>
            `;
        }

        return `<div class="message-item ${!msg.read ? 'unread' : ''}" onclick="${isBooking ? (msg.spotId && msg.spotId.startsWith('MY') ? `showPage('my-spots-page')` : `showSpotDetail('${msg.spotId}')`) : `showToast('查看系统通知')`}">
            <div class="message-icon" style="background:${iconBg};">${icon}</div>
            <div class="message-content">
                <div class="message-title">${msg.title}</div>
                <div class="message-text">${msg.content}</div>
                <div class="message-time">${msg.time}</div>
                ${actionsHtml}
            </div>
            ${!msg.read ? '<div class="message-badge">1</div>' : ''}
        </div>`;
    }).join('');

    container.innerHTML = html;
}

// 处理预约通知的确认/拒绝
function handleBookingNotification(notificationId, action) {
    const notification = bookingNotifications.find(n => n.id === notificationId);
    if (!notification) return;
    notification.read = true;
    showToast(action === 'confirm' ? '已确认预约' : '已拒绝预约');
    renderMessages();
}

// 筛选标题动态更新
function updateSpotCount(spots) {
    const countEl = document.getElementById('spot-count');
    const titleEl = document.getElementById('spot-section-title');
    if (countEl && titleEl) {
        if (spots.length < parkingSpots.length) {
            titleEl.firstChild.textContent = '筛选结果 ';
            countEl.textContent = `(${spots.length}个)`;
            countEl.style.display = '';
        } else {
            titleEl.firstChild.textContent = '推荐车位';
            countEl.textContent = '';
            countEl.style.display = 'none';
        }
    }
}

// ===== 聊天相关 =====
let currentChatUser = '';

function openChat(userName, spotName) {
    currentChatUser = userName || '车主';
    document.getElementById('chat-title').textContent = `与${currentChatUser}对话`;
    renderChatMessages();
    showPage('chat-page');
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = chatHistory.map(msg => `
        <div class="chat-msg ${msg.from === 'me' ? 'chat-msg-me' : 'chat-msg-other'}">
            <div class="chat-bubble">${msg.text}</div>
            <div class="chat-time">${msg.time}</div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    chatHistory.push({ from: 'me', text, time });
    input.value = '';
    renderChatMessages();
    // 模拟自动回复
    setTimeout(() => {
        const replies = [
            '好的，收到！',
            '没问题，我马上确认一下。',
            '车位已经为您预留好了。',
            '谢谢您的预约！',
            '请问还有什么需要帮忙的吗？',
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        chatHistory.push({ from: 'other', text: reply, time });
        renderChatMessages();
    }, 1000);
}

// ===== 预约提醒倒计时 =====
function updateCountdowns() {
    orders.filter(o => o.status === 'active').forEach(order => {
        const el = document.getElementById(`countdown-${order.id}`);
        if (!el) return;
        // 模拟：假设预约时间是今天 14:00
        const target = new Date();
        target.setHours(14, 0, 0, 0);
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
            el.innerHTML = '<span style="color:var(--accent);font-weight:600;">预约时间已到</span>';
            return;
        }
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        el.innerHTML = `<span style="color:var(--muted);font-size:12px;">距开始还有 ${hours}小时${mins}分钟</span>`;
    });
}

// 每30秒更新一次倒计时
setInterval(updateCountdowns, 30000);
