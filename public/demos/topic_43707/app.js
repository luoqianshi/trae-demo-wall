/**
 * 找聚点 MVP - 主应用逻辑
 * 包含路由、状态管理、页面渲染和交互逻辑
 */

// ============================================
// 数据层 - Mock 数据
// ============================================

/** 商家数据 */
const businesses = [
  {
    id: 1,
    name: '川味观 · 望京店',
    category: '川菜',
    rating: 4.2,
    distance: '2.3km',
    address: '望京西路18号院',
    price: '¥89/人',
    hours: '10:00 - 22:00',
    phone: '010-12345678',
    tags: ['川菜', '停车方便', '包间'],
    reason: '望京地区口碑最好的川菜馆，招牌水煮鱼必点，适合朋友聚餐',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=800&fit=crop',
    reviews: [
      { name: '小A', avatar: '👩', date: '2天前', text: '水煮鱼真的超级好吃！鱼肉很嫩，辣度刚好。', rating: 5 },
      { name: '大B', avatar: '👨', date: '1周前', text: '环境不错，包间挺大的，适合聚会。', rating: 4 }
    ]
  },
  {
    id: 2,
    name: '潮汕牛肉火锅 · 三元桥',
    category: '火锅',
    rating: 4.5,
    distance: '4.1km',
    address: '三元桥凤凰汇3层',
    price: '¥128/人',
    hours: '11:00 - 23:00',
    phone: '010-87654321',
    tags: ['火锅', '地铁直达', '鲜切牛肉'],
    reason: '现切鲜牛肉，锅底醇厚，三元桥商圈人气TOP3',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=800&fit=crop',
    reviews: [
      { name: '吃货小王', avatar: '👦', date: '3天前', text: '牛肉新鲜，涮几秒就能吃，推荐吊龙！', rating: 5 }
    ]
  },
  {
    id: 3,
    name: '猫的天空之城',
    category: '咖啡',
    rating: 4.7,
    distance: '1.8km',
    address: '朝阳大悦城5层',
    price: '¥45/人',
    hours: '10:00 - 22:00',
    phone: '010-11223344',
    tags: ['咖啡', '书店', '安静'],
    reason: '可以待一整天的咖啡馆，有书有猫有阳光，适合发呆',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=800&fit=crop',
    reviews: [
      { name: '文艺青年', avatar: '👧', date: '昨天', text: '环境超棒，猫咪很可爱，咖啡也好喝。', rating: 5 }
    ]
  },
  {
    id: 4,
    name: '小酒馆 · 深夜食堂',
    category: '酒吧',
    rating: 4.3,
    distance: '3.5km',
    address: '三里屯太古里北区',
    price: '¥150/人',
    hours: '18:00 - 02:00',
    phone: '010-55667788',
    tags: ['酒吧', '氛围感', '约会'],
    reason: '周五晚上最适合微醺的小酒馆，氛围感拉满',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=800&fit=crop',
    reviews: [
      { name: '夜猫子', avatar: '🧑', date: '5天前', text: '调酒师很专业，推荐特调鸡尾酒。', rating: 4 }
    ]
  },
  {
    id: 5,
    name: '云海肴云南菜',
    category: '云南菜',
    rating: 4.1,
    distance: '2.8km',
    address: '国贸商城B1层',
    price: '¥95/人',
    hours: '11:00 - 21:30',
    phone: '010-99887766',
    tags: ['云南菜', '健康', '清淡'],
    reason: '正宗云南风味，汽锅鸡是一绝，适合带长辈来',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=800&fit=crop',
    reviews: []
  }
];

/** 场景化内容 */
const sceneContents = [
  {
    id: 'scene1',
    type: 'scene',
    title: '周五晚上适合约会的5家小酒馆',
    subtitle: '氛围感拉满，微醺刚刚好',
    views: '2.3万',
    friendAction: '小A收藏了',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=800&fit=crop'
  },
  {
    id: 'scene2',
    type: 'scene',
    title: '望京最适合周末发呆的咖啡馆',
    subtitle: '一杯咖啡，一本书，一下午',
    views: '1.8万',
    friendAction: '3个好友去过',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&h=800&fit=crop'
  }
];

/** 聚会数据 */
const parties = [
  {
    id: 'party1',
    name: '周末约饭局',
    date: '2026年6月28日 18:30',
    people: 5,
    budget: '100-200',
    type: '聚餐',
    host: { name: '小明', avatar: '👦' },
    members: [
      { name: '小明', avatar: '👦', isHost: true },
      { name: '小红', avatar: '👧' },
      { name: '小刚', avatar: '👨' },
      { name: '小丽', avatar: '👩' }
    ],
    status: 'voting',
    votes: [
      { businessId: 1, name: '川味观 · 望京店', address: '望京西路18号', votes: 3, total: 4 },
      { businessId: 2, name: '潮汕牛肉火锅', address: '三元桥凤凰汇', votes: 1, total: 4 },
      { businessId: 3, name: '猫的天空之城', address: '朝阳大悦城', votes: 2, total: 4 }
    ],
    confirmedBusiness: null
  }
];

/** 消息数据 */
const messages = [
  { id: 1, type: 'invite', title: '聚会邀请', content: '小明邀请你加入"周末约饭局"', time: '10分钟前', avatar: '👦', badge: 1 },
  { id: 2, type: 'vote', title: '投票提醒', content: '"周末约饭局"投票即将截止', time: '1小时前', avatar: '🗳️', badge: 0 },
  { id: 3, type: 'system', title: '系统通知', content: '你收藏的"川味观"有新优惠', time: '昨天', avatar: '🔔', badge: 0 },
  { id: 4, type: 'friend', title: '好友动态', content: '小红去"猫的天空之城"打卡了', time: '2天前', avatar: '👧', badge: 0 }
];

/** 用户数据 */
const userData = {
  name: '找聚点用户',
  avatar: '👤',
  bio: '让每一次出门都值得期待',
  favorites: [1, 3],
  history: ['party1'],
  stats: { favorites: 12, parties: 8, visits: 23 }
};

/** 盲盒结果 */
const blindBoxResults = {
  date: [
    { name: '浪漫晚餐 + 夜景漫步', business: '小酒馆 · 深夜食堂', plan: '18:00 晚餐 → 20:00 露台酒吧 → 21:30 三里屯夜景漫步', budget: '¥300/两人' },
    { name: 'DIY烘焙体验', business: '甜蜜时光烘焙坊', plan: '14:00 烘焙课程 → 16:00 下午茶 → 18:00 带走亲手做的蛋糕', budget: '¥200/两人' },
    { name: '私汤温泉', business: '汤泉良子', plan: '15:00 私汤体验 → 17:00 按摩 → 19:00 日式料理', budget: '¥500/两人' }
  ],
  friend: [
    { name: '火锅局 + K歌夜', business: '潮汕牛肉火锅', plan: '18:00 火锅聚餐 → 20:30 KTV欢唱 → 23:00 夜宵烧烤', budget: '¥150/人' },
    { name: '桌游下午茶', business: '猫的天空之城', plan: '14:00 下午茶 → 15:00 桌游时间 → 18:00 晚餐', budget: '¥80/人' },
    { name: '密室逃脱', business: 'X先生密室', plan: '13:00 密室挑战 → 15:30 下午茶 → 17:00 逛街', budget: '¥120/人' }
  ],
  solo: [
    { name: '城市漫步路线', business: '多地点', plan: '10:00 咖啡馆 → 12:00 独立书店 → 14:00 美术馆 → 16:00 甜品店', budget: '¥150/人' },
    { name: '美食探索', business: '多地点', plan: '11:00 早茶 → 14:00 小吃街 → 17:00 特色餐厅 → 20:00 夜市', budget: '¥200/人' }
  ]
};

// ============================================
// 状态管理
// ============================================

const state = {
  currentPage: 'home',
  currentBusiness: null,
  currentParty: null,
  blindBoxStep: 1,
  blindBoxType: null,
  blindBoxResult: null,
  favorites: new Set(userData.favorites),
  searchQuery: '',
  searchResults: []
};

// ============================================
// 路由系统
// ============================================

const routes = {
  '#/': renderSearch,
  '#/explore': renderHome,
  '#/search': renderSearch,
  '#/blind-box': renderBlindBox,
  '#/create-party': renderCreateParty,
  '#/messages': renderMessages,
  '#/profile': renderProfile,
  '#/favorites': renderFavorites
};

/**
 * 解析路由并渲染对应页面
 */
function handleRoute() {
  const hash = window.location.hash || '#/';
  const pageContent = document.getElementById('page-content');
  const nav = document.getElementById('bottom-nav');

  // 解析动态路由
  if (hash.startsWith('#/business/')) {
    const id = parseInt(hash.split('/').pop());
    state.currentBusiness = businesses.find(b => b.id === id);
    renderBusinessDetail(pageContent);
    nav.style.display = 'none';
    return;
  }

  if (hash.startsWith('#/party/')) {
    const id = hash.split('/').pop();
    state.currentParty = parties.find(p => p.id === id);
    renderPartyDetail(pageContent);
    nav.style.display = 'none';
    return;
  }

  if (hash.startsWith('#/respond/')) {
    const id = hash.split('/').pop();
    state.currentParty = parties.find(p => p.id === id);
    renderRespondPage(pageContent);
    nav.style.display = 'none';
    return;
  }

  // 静态路由
  const renderer = routes[hash];
  if (renderer) {
    renderer(pageContent);
    nav.style.display = 'flex';
    updateNavActive(hash);
  } else {
    renderSearch(pageContent);
    nav.style.display = 'flex';
  }
}

/**
 * 更新导航栏激活状态
 */
function updateNavActive(hash) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === hash) {
      item.classList.add('active');
    }
  });
}

// ============================================
// 页面渲染函数
// ============================================

/**
 * 渲染首页/探索流
 */
function renderHome(container) {
  const currentCard = businesses[0];

  container.innerHTML = `
    <div class="page explore-page">
      <!-- 顶部栏 -->
      <div class="explore-header">
        <div class="location">
          <span>📍</span>
          <span>北京市朝阳区</span>
        </div>
        <div class="search-bar" onclick="navigateTo('#/search')">
          <span>🔍</span>
          <span>搜索商家、地点</span>
        </div>
        <div class="blindbox-btn" onclick="navigateTo('#/blind-box')">
          <span>🎁</span>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="category-tabs">
        <span class="category-tab active">推荐</span>
        <span class="category-tab">美食</span>
        <span class="category-tab">咖啡</span>
        <span class="category-tab">酒吧</span>
        <span class="category-tab">景点</span>
      </div>

      <!-- 卡片流 -->
      <div class="card-stack" id="card-stack">
        <div class="explore-card" data-id="${currentCard.id}">
          <img src="${currentCard.image}" alt="${currentCard.name}" class="card-image">
          <div class="card-gradient"></div>
          <div class="card-content">
            <div class="card-tags">
              ${currentCard.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
            <h2 class="card-title">${currentCard.name}</h2>
            <div class="card-meta">
              <span class="stars">${'★'.repeat(Math.floor(currentCard.rating))}${'☆'.repeat(5 - Math.floor(currentCard.rating))}</span>
              <span>${currentCard.rating}</span>
              <span>·</span>
              <span>${currentCard.distance}</span>
              <span>·</span>
              <span>${currentCard.price}</span>
            </div>
            <div class="card-reason">
              💡 ${currentCard.reason}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <button class="card-action-btn" onclick="toggleFavorite(${currentCard.id})">
          <span>${state.favorites.has(currentCard.id) ? '❤️' : '🤍'}</span>
        </button>
        <button class="card-action-btn" onclick="navigateTo('#/business/${currentCard.id}')">
          <span>ℹ️</span>
        </button>
        <button class="card-action-btn" onclick="shareBusiness(${currentCard.id})">
          <span>📤</span>
        </button>
      </div>

      <!-- 滑动提示 -->
      <div class="swipe-hint">
        <span>👆</span>
        <span>上滑查看更多</span>
      </div>
    </div>
  `;

  // 绑定卡片滑动事件
  bindCardSwipe();
}

/**
 * 绑定卡片滑动事件
 */
function bindCardSwipe() {
  const stack = document.getElementById('card-stack');
  if (!stack) return;

  let startY = 0;
  let currentY = 0;
  let currentCardIndex = 0;

  stack.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  stack.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    const card = stack.querySelector('.explore-card');
    if (card && diff < 0) {
      card.style.transform = `translateY(${diff}px) scale(${1 + diff * 0.001})`;
      card.style.opacity = 1 + diff * 0.003;
    }
  }, { passive: true });

  stack.addEventListener('touchend', () => {
    const diff = currentY - startY;
    const card = stack.querySelector('.explore-card');
    if (!card) return;

    if (diff < -80) {
      // 上滑切换下一张
      card.style.transition = 'all 0.3s ease-out';
      card.style.transform = 'translateY(-100%)';
      card.style.opacity = '0';

      setTimeout(() => {
        currentCardIndex = (currentCardIndex + 1) % businesses.length;
        renderNextCard(stack, currentCardIndex);
      }, 300);
    } else {
      // 回弹
      card.style.transition = 'all 0.3s ease-out';
      card.style.transform = 'translateY(0)';
      card.style.opacity = '1';
    }

    startY = 0;
    currentY = 0;
  });
}

/**
 * 渲染下一张卡片
 */
function renderNextCard(stack, index) {
  const card = businesses[index];
  stack.innerHTML = `
    <div class="explore-card fade-in" data-id="${card.id}">
      <img src="${card.image}" alt="${card.name}" class="card-image">
      <div class="card-gradient"></div>
      <div class="card-content">
        <div class="card-tags">
          ${card.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
        </div>
        <h2 class="card-title">${card.name}</h2>
        <div class="card-meta">
          <span class="stars">${'★'.repeat(Math.floor(card.rating))}${'☆'.repeat(5 - Math.floor(card.rating))}</span>
          <span>${card.rating}</span>
          <span>·</span>
          <span>${card.distance}</span>
          <span>·</span>
          <span>${card.price}</span>
        </div>
        <div class="card-reason">
          💡 ${card.reason}
        </div>
      </div>
    </div>
  `;

  // 更新操作按钮
  const actions = document.querySelector('.card-actions');
  if (actions) {
    actions.innerHTML = `
      <button class="card-action-btn" onclick="toggleFavorite(${card.id})">
        <span>${state.favorites.has(card.id) ? '❤️' : '🤍'}</span>
      </button>
      <button class="card-action-btn" onclick="navigateTo('#/business/${card.id}')">
        <span>ℹ️</span>
      </button>
      <button class="card-action-btn" onclick="shareBusiness(${card.id})">
        <span>📤</span>
      </button>
    `;
  }
}

/**
 * 渲染商家详情页
 */
function renderBusinessDetail(container) {
  const biz = state.currentBusiness;
  if (!biz) return;

  container.innerHTML = `
    <div class="page">
      <!-- 商家大图 -->
      <div class="business-hero">
        <img src="${biz.image}" alt="${biz.name}">
        <div class="hero-gradient"></div>
        <button class="back-btn" onclick="goBack()">←</button>
        <button class="share-btn" onclick="shareBusiness(${biz.id})">↗</button>
      </div>

      <!-- 商家信息 -->
      <div class="business-info">
        <div class="info-card">
          <h1>${biz.name}</h1>
          <div class="rating-row">
            <span class="rating-score">${biz.rating}</span>
            <span class="stars">${'★'.repeat(Math.floor(biz.rating))}${'☆'.repeat(5 - Math.floor(biz.rating))}</span>
            <span class="tag tag-lemon">${biz.category}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">📍</span>
            <span>${biz.address} · 距你 ${biz.distance}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">💰</span>
            <span>人均 ${biz.price}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">🕐</span>
            <span>${biz.hours}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">📞</span>
            <span>${biz.phone}</span>
          </div>
        </div>
      </div>

      <!-- 推荐理由 -->
      <div class="business-reason">
        <h3>✨ 推荐理由</h3>
        <p>${biz.reason}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="business-actions">
        <button class="btn btn-outline" onclick="toggleFavorite(${biz.id}); this.innerHTML='${state.favorites.has(biz.id) ? '❤️ 已收藏' : '🤍 收藏'}'">
          ${state.favorites.has(biz.id) ? '❤️ 已收藏' : '🤍 收藏'}
        </button>
        <button class="btn btn-primary" onclick="createPartyFromBusiness(${biz.id})">
          🎉 从该商家创建聚会
        </button>
      </div>

      <!-- 评价列表 -->
      <div class="review-list">
        <h3>用户评价 (${biz.reviews.length})</h3>
        ${biz.reviews.length > 0 ? biz.reviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              <div class="review-avatar">${r.avatar}</div>
              <div>
                <div class="review-name">${r.name}</div>
                <div class="review-date">${r.date}</div>
              </div>
            </div>
            <div class="stars" style="margin-bottom:4px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            <div class="review-text">${r.text}</div>
          </div>
        `).join('') : '<p style="color:var(--muted);font-size:0.85rem;">暂无评价</p>'}
      </div>
    </div>
  `;
}

/**
 * 渲染盲盒页面
 */
function renderBlindBox(container) {
  container.innerHTML = `
    <div class="page blindbox-page">
      <div class="page-header" style="background:transparent;position:relative;">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1>开盲盒</h1>
      </div>

      <div class="blindbox-header">
        <div class="gift-icon">🎁</div>
        <h1>今天去哪？让AI决定！</h1>
        <p>选择一种盲盒，开启惊喜之旅</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div class="step-dot active" id="step1"></div>
        <div class="step-dot" id="step2"></div>
        <div class="step-dot" id="step3"></div>
      </div>

      <!-- 步骤1：选择类型 -->
      <div id="blindbox-step1" class="blindbox-types">
        <div class="blindbox-type-card" onclick="selectBlindBoxType('date', this)">
          <div class="type-icon" style="background:linear-gradient(135deg,#FBCFE8,#F9A8D4);">💕</div>
          <div class="type-info">
            <h3>情侣约会盲盒</h3>
            <p>AI生成完整约会剧本</p>
          </div>
        </div>
        <div class="blindbox-type-card" onclick="selectBlindBoxType('friend', this)">
          <div class="type-icon" style="background:linear-gradient(135deg,#BFDBFE,#93C5FD);">🍻</div>
          <div class="type-info">
            <h3>朋友聚会盲盒</h3>
            <p>生成聚会主题和地点</p>
          </div>
        </div>
        <div class="blindbox-type-card" onclick="selectBlindBoxType('solo', this)">
          <div class="type-icon" style="background:linear-gradient(135deg,#A7F3D0,#6EE7B7);">🌍</div>
          <div class="type-info">
            <h3>独自探索盲盒</h3>
            <p>生成城市漫步路线</p>
          </div>
        </div>
      </div>

      <!-- 步骤2：设置条件 -->
      <div id="blindbox-step2" style="display:none;">
        <div class="condition-section">
          <h3>预算范围</h3>
          <div class="chip-group">
            <span class="chip active" onclick="selectChip(this)">不限</span>
            <span class="chip" onclick="selectChip(this)">50-100</span>
            <span class="chip" onclick="selectChip(this)">100-200</span>
            <span class="chip" onclick="selectChip(this)">200+</span>
          </div>
        </div>
        <div class="condition-section">
          <h3>距离范围</h3>
          <div class="chip-group">
            <span class="chip active" onclick="selectChip(this)">3km内</span>
            <span class="chip" onclick="selectChip(this)">5km内</span>
            <span class="chip" onclick="selectChip(this)">10km内</span>
          </div>
        </div>
        <div class="condition-section">
          <h3>偏好标签</h3>
          <div class="chip-group">
            <span class="chip" onclick="selectChip(this)">安静</span>
            <span class="chip" onclick="selectChip(this)">热闹</span>
            <span class="chip" onclick="selectChip(this)">美食</span>
            <span class="chip" onclick="selectChip(this)">文艺</span>
            <span class="chip" onclick="selectChip(this)">户外</span>
          </div>
        </div>
        <div style="padding:0 16px 20px;">
          <button class="btn btn-primary btn-block btn-lg" onclick="goToBlindBoxStep3()">
            下一步 🎲
          </button>
        </div>
      </div>

      <!-- 步骤3：摇一摇 -->
      <div id="blindbox-step3" style="display:none;">
        <div class="shake-area">
          <div class="shake-box" id="shake-box">🎁</div>
          <div class="shake-text">
            <h3>摇一摇手机</h3>
            <p>或点击礼盒随机选择</p>
          </div>
        </div>
        <div style="padding:0 16px 30px;">
          <button class="btn btn-primary btn-block btn-lg" onclick="shakeBlindBox()">
            点击开盲盒 🎉
          </button>
        </div>
      </div>

      <!-- 结果展示 -->
      <div id="blindbox-result" style="display:none;">
        <div class="blindbox-result">
          <h3 style="text-align:center;margin-bottom:16px;">🎉 AI为你推荐</h3>
          <div id="result-cards"></div>
          <div style="display:flex;gap:12px;margin-top:20px;">
            <button class="btn btn-outline" style="flex:1;" onclick="shakeBlindBox()">🔄 再摇一次</button>
            <button class="btn btn-primary" style="flex:1;" onclick="createPartyFromBlindBox()">🎉 创建聚会</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染创建聚会页面
 */
function renderCreateParty(container) {
  const biz = state.currentBusiness;

  container.innerHTML = `
    <div class="page create-party-page">
      <div class="page-header">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1>创建聚会</h1>
      </div>

      <div class="create-form">
        ${biz ? `
        <div class="selected-business">
          <img src="${biz.image}" class="biz-image" alt="${biz.name}">
          <div class="biz-info">
            <h4>${biz.name}</h4>
            <p>${biz.address}</p>
          </div>
        </div>
        ` : ''}

        <div class="form-group">
          <label>聚会名称</label>
          <input type="text" class="input" placeholder="给聚会起个名字" value="${biz ? '周末约饭' : ''}">
        </div>

        <div class="form-group">
          <label>日期和时间</label>
          <input type="text" class="input" placeholder="选择日期和时间" value="2026年6月28日 18:30">
        </div>

        <div class="form-group">
          <label>人数</label>
          <input type="number" class="input" placeholder="预计参加人数" value="5">
        </div>

        <div class="form-group">
          <label>聚会类型</label>
          <div class="chip-group">
            <span class="chip active" onclick="selectChip(this)">聚餐</span>
            <span class="chip" onclick="selectChip(this)">桌游</span>
            <span class="chip" onclick="selectChip(this)">咖啡</span>
            <span class="chip" onclick="selectChip(this)">运动</span>
          </div>
        </div>

        <div class="form-group">
          <label>预算范围</label>
          <div class="chip-group">
            <span class="chip active" onclick="selectChip(this)">不限</span>
            <span class="chip" onclick="selectChip(this)">50-100</span>
            <span class="chip" onclick="selectChip(this)">100-200</span>
            <span class="chip" onclick="selectChip(this)">200+</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block btn-lg" onclick="generateShareCard()">
          生成分享卡片 🎉
        </button>
      </div>

      <!-- 分享卡片预览 -->
      <div id="share-card-preview" style="display:none;">
        <div class="share-card-preview">
          <h3>🎉 周末约饭局</h3>
          <div class="party-info">
            📅 2026年6月28日 18:30<br>
            👥 5人 · 聚餐
          </div>
          <div class="qr-placeholder">📱</div>
          <p style="margin-top:12px;font-size:0.78rem;color:var(--muted);">扫码加入聚会</p>
        </div>
        <div style="padding:0 16px 30px;">
          <button class="btn btn-primary btn-block" onclick="shareToWeChat()">
            📤 分享到微信
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染聚会详情页
 */
function renderPartyDetail(container) {
  const party = state.currentParty;
  if (!party) return;

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1>聚会详情</h1>
      </div>

      <!-- 聚会头部信息 -->
      <div class="party-header">
        <h1>${party.name}</h1>
        <div class="party-meta">
          <span>📅 ${party.date}</span>
          <span>👥 ${party.people}人</span>
          <span>💰 ${party.budget}</span>
          <span>🏷️ ${party.type}</span>
        </div>
      </div>

      <!-- 参与人列表 -->
      <div class="members-section">
        <h3>参与人 (${party.members.length}/${party.people})</h3>
        <div class="members-list">
          ${party.members.map(m => `
            <div class="member-item">
              <div class="member-avatar ${m.isHost ? 'host' : ''}">${m.avatar}</div>
              <span class="member-name">${m.name}${m.isHost ? '(发起人)' : ''}</span>
            </div>
          `).join('')}
          <div class="member-item" onclick="navigateTo('#/respond/${party.id}')">
            <div class="member-avatar" style="background:var(--border);font-size:1.5rem;">+</div>
            <span class="member-name">邀请好友</span>
          </div>
        </div>
      </div>

      <!-- AI推荐投票 -->
      <div class="vote-section">
        <h3>🤖 AI推荐场所 <span style="font-size:0.78rem;color:var(--muted);font-weight:400;">- 请投票</span></h3>
        ${party.votes.map((v, i) => `
          <div class="vote-card">
            <div class="vote-biz-name">${v.name}</div>
            <div class="vote-biz-addr">${v.address}</div>
            <div class="vote-progress">
              <div class="vote-progress-bar">
                <div class="vote-progress-fill" style="width:${(v.votes / v.total * 100).toFixed(0)}%"></div>
              </div>
              <span class="vote-progress-text">${v.votes}/${v.total}票</span>
            </div>
            <div class="vote-actions">
              <button class="btn btn-mint" style="flex:1;" onclick="voteFor(${i})">
                👍 投一票
              </button>
              <button class="btn btn-outline" style="flex:1;" onclick="navigateTo('#/business/${v.businessId}')">
                查看详情
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 路线引导（确认后显示） -->
      ${party.confirmedBusiness ? `
      <div class="route-section">
        <h3>🗺️ 路线引导</h3>
        <div class="route-card">
          <div class="route-map">🗺️</div>
          <div class="route-info">
            <div class="route-detail">
              <h4>${party.confirmedBusiness.name}</h4>
              <p>距你 ${party.confirmedBusiness.distance} · 预计15分钟</p>
            </div>
            <button class="btn btn-primary">导航</button>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- 发起人确认按钮 -->
      <div style="padding:0 16px 30px;">
        <button class="btn btn-primary btn-block btn-lg" onclick="confirmParty()">
          ✓ 确认最终地点
        </button>
      </div>
    </div>
  `;
}

/**
 * 渲染消息页面
 */
function renderMessages(container) {
  container.innerHTML = `
    <div class="page messages-page">
      <div class="page-header">
        <h1>消息</h1>
      </div>

      <div class="message-tabs">
        <span class="message-tab active">全部</span>
        <span class="message-tab">邀请</span>
        <span class="message-tab">动态</span>
      </div>

      <div class="message-list">
        ${messages.map(m => `
          <div class="message-item" onclick="handleMessageClick(${m.id})">
            <div class="message-avatar ${m.type === 'system' ? 'system' : ''}">${m.avatar}</div>
            <div class="message-content">
              <h4>
                ${m.title}
                <span class="time">${m.time}</span>
              </h4>
              <p>${m.content}</p>
            </div>
            ${m.badge > 0 ? `<span class="message-badge">${m.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 渲染个人中心页面
 */
function renderProfile(container) {
  container.innerHTML = `
    <div class="page profile-page">
      <!-- 头部信息 -->
      <div class="profile-header">
        <div class="profile-avatar">${userData.avatar}</div>
        <div class="profile-name">${userData.name}</div>
        <div class="profile-bio">${userData.bio}</div>
      </div>

      <!-- 统计栏 -->
      <div class="profile-stats">
        <div class="stat-item">
          <div class="stat-value">${userData.stats.favorites}</div>
          <div class="stat-label">收藏</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.stats.parties}</div>
          <div class="stat-label">聚会</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.stats.visits}</div>
          <div class="stat-label">打卡</div>
        </div>
      </div>

      <!-- 菜单列表 -->
      <div class="menu-list">
        <div class="menu-group">
          <div class="menu-item" onclick="navigateTo('#/favorites')">
            <div class="menu-icon lemon">❤️</div>
            <span class="menu-text">我的收藏</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" onclick="navigateTo('#/favorites?tab=history')">
            <div class="menu-icon mint">📅</div>
            <span class="menu-text">历史聚会</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>

        <div class="menu-group">
          <div class="menu-item">
            <div class="menu-icon coral">🎁</div>
            <span class="menu-text">盲盒记录</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item">
            <div class="menu-icon lavender">🏷️</div>
            <span class="menu-text">我的标签</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>

        <div class="menu-group">
          <div class="menu-item">
            <div class="menu-icon sky">⚙️</div>
            <span class="menu-text">设置</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item">
            <div class="menu-icon lemon">❓</div>
            <span class="menu-text">帮助与反馈</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染发现页面（首页）
 */
function renderSearch(container) {
  container.innerHTML = `
    <div class="page search-page">
      <!-- 顶部搜索栏 -->
      <div class="search-bar-container" style="padding:16px;">
        <div class="location" style="display:flex;align-items:center;gap:4px;margin-bottom:12px;font-size:0.85rem;color:var(--ink-secondary);">
          <span>📍</span>
          <span>北京市朝阳区</span>
        </div>
        <div class="search-input-wrapper" style="width:100%;">
          <span>🔍</span>
          <input type="text" placeholder="搜索商家、地点、标签..." id="search-input" oninput="handleSearch(this.value)">
        </div>
      </div>

      <div id="search-content">
        <!-- 分类快捷入口 -->
        <div style="padding:0 16px 16px;">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
            <div onclick="navigateTo('#/explore')" style="padding:12px 8px;background:linear-gradient(135deg,var(--lemon-light),var(--mint-light));border-radius:var(--radius-md);cursor:pointer;">
              <div style="font-size:1.8rem;margin-bottom:4px;">✨</div>
              <div style="font-size:0.75rem;font-weight:500;">探索流</div>
            </div>
            <div onclick="navigateTo('#/blind-box')" style="padding:12px 8px;background:linear-gradient(135deg,var(--lavender-light),var(--sky-light));border-radius:var(--radius-md);cursor:pointer;">
              <div style="font-size:1.8rem;margin-bottom:4px;">🎁</div>
              <div style="font-size:0.75rem;font-weight:500;">盲盒</div>
            </div>
            <div onclick="quickSearch('美食')" style="padding:12px 8px;background:linear-gradient(135deg,var(--coral-light),var(--lemon-light));border-radius:var(--radius-md);cursor:pointer;">
              <div style="font-size:1.8rem;margin-bottom:4px;">🍜</div>
              <div style="font-size:0.75rem;font-weight:500;">美食</div>
            </div>
            <div onclick="quickSearch('咖啡')" style="padding:12px 8px;background:linear-gradient(135deg,var(--mint-light),var(--sky-light));border-radius:var(--radius-md);cursor:pointer;">
              <div style="font-size:1.8rem;margin-bottom:4px;">☕</div>
              <div style="font-size:0.75rem;font-weight:500;">咖啡</div>
            </div>
          </div>
        </div>

        <!-- 热门标签 -->
        <div class="hot-tags">
          <h3>🔥 热门搜索</h3>
          <div class="chip-group" style="margin-top:12px;">
            <span class="chip" onclick="quickSearch('火锅')">火锅</span>
            <span class="chip" onclick="quickSearch('咖啡')">咖啡</span>
            <span class="chip" onclick="quickSearch('约会')">约会</span>
            <span class="chip" onclick="quickSearch('聚餐')">聚餐</span>
            <span class="chip" onclick="quickSearch('安静')">安静</span>
            <span class="chip" onclick="quickSearch('夜景')">夜景</span>
          </div>
        </div>

        <!-- 推荐商家列表 -->
        <div class="hot-tags">
          <h3>⭐ 为你推荐</h3>
          <div class="search-results" style="margin-top:12px;">
            ${businesses.map(b => `
              <div class="result-item" onclick="navigateTo('#/business/${b.id}')">
                <div class="result-image">
                  <img src="${b.image}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);">
                </div>
                <div class="result-info">
                  <h4>${b.name}</h4>
                  <div class="result-meta">${b.category} · ${b.distance} · ${b.price}</div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="stars">${'★'.repeat(Math.floor(b.rating))}${'☆'.repeat(5 - Math.floor(b.rating))}</div>
                    <span style="font-size:0.8rem;color:var(--lemon-dark);font-weight:600;">${b.rating}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div id="search-results" style="display:none;padding:0 16px;"></div>
    </div>
  `;
}

/**
 * 渲染收藏/历史页面
 */
function renderFavorites(container) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const activeTab = urlParams.get('tab') || 'favorites';

  container.innerHTML = `
    <div class="page favorites-page">
      <div class="page-header">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1>${activeTab === 'favorites' ? '我的收藏' : '历史聚会'}</h1>
      </div>

      <div class="sub-tabs">
        <span class="sub-tab ${activeTab === 'favorites' ? 'active' : ''}" onclick="navigateTo('#/favorites')">收藏</span>
        <span class="sub-tab ${activeTab === 'history' ? 'active' : ''}" onclick="navigateTo('#/favorites?tab=history')">历史</span>
      </div>

      <div style="padding:16px;">
        ${activeTab === 'favorites' ? renderFavoritesList() : renderHistoryList()}
      </div>
    </div>
  `;
}

/**
 * 渲染收藏列表
 */
function renderFavoritesList() {
  const favs = businesses.filter(b => state.favorites.has(b.id));
  if (favs.length === 0) {
    return `
      <div class="empty-state">
        <div class="icon">🤍</div>
        <h3>还没有收藏</h3>
        <p>浏览推荐流，收藏喜欢的商家</p>
      </div>
    `;
  }

  return favs.map(b => `
    <div class="favorite-card" onclick="navigateTo('#/business/${b.id}')">
      <div class="fav-image">
        <img src="${b.image}" alt="${b.name}">
      </div>
      <div class="fav-info">
        <h4>${b.name}</h4>
        <div class="fav-meta">${b.category} · ${b.distance} · ${b.price}</div>
        <div class="fav-tags">
          ${b.tags.map(t => `<span class="tag tag-lemon">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * 渲染历史列表
 */
function renderHistoryList() {
  return parties.map(p => `
    <div class="history-item" onclick="navigateTo('#/party/${p.id}')">
      <h4>${p.name}</h4>
      <div class="history-meta">
        <span>📅 ${p.date}</span>
        <span>👥 ${p.members.length}人</span>
      </div>
      <span class="history-status ${p.status === 'completed' ? 'completed' : 'pending'}">
        ${p.status === 'completed' ? '已完成' : '进行中'}
      </span>
    </div>
  `).join('');
}

/**
 * 渲染响应聚会页面（分享落地页）
 */
function renderRespondPage(container) {
  const party = state.currentParty;
  if (!party) return;

  container.innerHTML = `
    <div class="page respond-page">
      <div class="page-header" style="background:transparent;">
        <button class="back-btn" onclick="goBack()">←</button>
      </div>

      <div class="respond-card">
        <div class="inviter-avatar">${party.host.avatar}</div>
        <h2>${party.host.name} 邀请你加入聚会</h2>
        <div class="inviter-name">"${party.name}"</div>

        <div class="party-detail">
          <div class="party-detail-row">
            <span class="icon">📅</span>
            <span>${party.date}</span>
          </div>
          <div class="party-detail-row">
            <span class="icon">👥</span>
            <span>${party.people}人 · 已有${party.members.length}人加入</span>
          </div>
          <div class="party-detail-row">
            <span class="icon">🏷️</span>
            <span>${party.type} · ${party.budget}</span>
          </div>
        </div>

        <div style="display:flex;gap:12px;">
          <button class="btn btn-outline" style="flex:1;" onclick="goBack()">稍后再说</button>
          <button class="btn btn-primary" style="flex:1;" onclick="joinParty()">加入聚会 🎉</button>
        </div>
      </div>

      <div style="padding:0 16px 30px;">
        <div class="card" style="margin-bottom:16px;">
          <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;">设置你的偏好</h3>
          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:0.82rem;color:var(--muted);">你的位置</label>
            <input type="text" class="input" value="北京市朝阳区" style="margin-top:6px;">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.82rem;color:var(--muted);">饮食偏好</label>
            <div class="chip-group" style="margin-top:8px;">
              <span class="chip active" onclick="selectChip(this)">无特殊</span>
              <span class="chip" onclick="selectChip(this)">素食</span>
              <span class="chip" onclick="selectChip(this)">不吃辣</span>
              <span class="chip" onclick="selectChip(this)">清真</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// 交互函数
// ============================================

/**
 * 导航到指定路由
 */
function navigateTo(hash) {
  window.location.hash = hash;
}

/**
 * 返回上一页
 */
function goBack() {
  window.history.back();
}

/**
 * 切换收藏状态
 */
function toggleFavorite(businessId) {
  if (state.favorites.has(businessId)) {
    state.favorites.delete(businessId);
  } else {
    state.favorites.add(businessId);
  }
  // 刷新当前页面
  handleRoute();
}

/**
 * 分享商家
 */
function shareBusiness(businessId) {
  alert('分享功能：生成分享卡片，支持微信好友/朋友圈');
}

/**
 * 从商家创建聚会
 */
function createPartyFromBusiness(businessId) {
  state.currentBusiness = businesses.find(b => b.id === businessId);
  navigateTo('#/create-party');
}

/**
 * 选择盲盒类型
 */
function selectBlindBoxType(type, element) {
  state.blindBoxType = type;
  document.querySelectorAll('.blindbox-type-card').forEach(c => c.classList.remove('selected'));
  element.classList.add('selected');

  setTimeout(() => {
    document.getElementById('blindbox-step1').style.display = 'none';
    document.getElementById('blindbox-step2').style.display = 'block';
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
  }, 300);
}

/**
 * 进入盲盒步骤3
 */
function goToBlindBoxStep3() {
  document.getElementById('blindbox-step2').style.display = 'none';
  document.getElementById('blindbox-step3').style.display = 'block';
  document.getElementById('step2').classList.add('completed');
  document.getElementById('step3').classList.add('active');
}

/**
 * 摇动盲盒
 */
function shakeBlindBox() {
  const box = document.getElementById('shake-box');
  box.classList.add('shake');

  setTimeout(() => {
    box.classList.remove('shake');
    showBlindBoxResult();
  }, 600);
}

/**
 * 显示盲盒结果
 */
function showBlindBoxResult() {
  const results = blindBoxResults[state.blindBoxType] || blindBoxResults.date;
  const randomResult = results[Math.floor(Math.random() * results.length)];
  state.blindBoxResult = randomResult;

  document.getElementById('blindbox-step3').style.display = 'none';
  document.getElementById('blindbox-result').style.display = 'block';

  document.getElementById('result-cards').innerHTML = `
    <div class="result-card fade-in">
      <div class="result-content">
        <h3>${randomResult.name}</h3>
        <div class="result-meta">
          <span>🏪 ${randomResult.business}</span>
          <span>💰 ${randomResult.budget}</span>
        </div>
        <div class="result-plan">
          <strong>📋 约会计划</strong><br>
          ${randomResult.plan}
        </div>
      </div>
    </div>
  `;
}

/**
 * 从盲盒结果创建聚会
 */
function createPartyFromBlindBox() {
  navigateTo('#/create-party');
}

/**
 * 选择芯片标签
 */
function selectChip(element) {
  const parent = element.parentElement;
  parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
}

/**
 * 生成分享卡片
 */
function generateShareCard() {
  document.getElementById('share-card-preview').style.display = 'block';
  document.querySelector('.create-form').style.display = 'none';
}

/**
 * 分享到微信
 */
function shareToWeChat() {
  alert('分享成功！已生成聚会邀请卡片');
  navigateTo('#/party/party1');
}

/**
 * 投票
 */
function voteFor(voteIndex) {
  const party = state.currentParty;
  if (party && party.votes[voteIndex]) {
    party.votes[voteIndex].votes += 1;
    renderPartyDetail(document.getElementById('page-content'));
  }
}

/**
 * 确认聚会地点
 */
function confirmParty() {
  const party = state.currentParty;
  if (party) {
    const topVote = party.votes.reduce((max, v) => v.votes > max.votes ? v : max, party.votes[0]);
    party.confirmedBusiness = businesses.find(b => b.id === topVote.businessId);
    party.status = 'completed';
    alert(`已确认聚会地点：${topVote.name}`);
    renderPartyDetail(document.getElementById('page-content'));
  }
}

/**
 * 加入聚会
 */
function joinParty() {
  alert('🎉 成功加入聚会！');
  navigateTo('#/party/party1');
}

/**
 * 处理搜索
 */
function handleSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  const contentContainer = document.getElementById('search-content');

  if (!query.trim()) {
    resultsContainer.style.display = 'none';
    contentContainer.style.display = 'block';
    return;
  }

  const results = businesses.filter(b =>
    b.name.includes(query) ||
    b.category.includes(query) ||
    b.tags.some(t => t.includes(query))
  );

  contentContainer.style.display = 'none';
  resultsContainer.style.display = 'block';

  resultsContainer.innerHTML = results.length > 0 ? results.map(b => `
    <div class="result-item" onclick="navigateTo('#/business/${b.id}')">
      <div class="result-image">🏪</div>
      <div class="result-info">
        <h4>${b.name}</h4>
        <div class="result-meta">${b.category} · ${b.distance} · ${b.price}</div>
        <div class="stars">${'★'.repeat(Math.floor(b.rating))}${'☆'.repeat(5 - Math.floor(b.rating))} ${b.rating}</div>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><div class="icon">🔍</div><h3>未找到相关结果</h3></div>';
}

/**
 * 快速搜索
 */
function quickSearch(keyword) {
  const input = document.getElementById('search-input');
  if (input) {
    input.value = keyword;
    handleSearch(keyword);
  }
}

/**
 * 处理消息点击
 */
function handleMessageClick(messageId) {
  const msg = messages.find(m => m.id === messageId);
  if (msg && msg.type === 'invite') {
    navigateTo('#/respond/party1');
  }
}

// ============================================
// 初始化
// ============================================

/**
 * 初始化应用
 */
function initApp() {
  // 监听路由变化
  window.addEventListener('hashchange', handleRoute);

  // 初始渲染
  handleRoute();
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);
