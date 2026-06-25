const STORAGE_KEYS = {
  GOODS: 'neighbor_goods',
  ORDERS: 'neighbor_orders',
  FAVORITES: 'neighbor_favorites',
  USER: 'neighbor_user'
};

const CURRENT_USER_ID = 'user1';

const MOCK_DATA = [
  {
    id: '1',
    name: 'iPhone 14 Pro',
    category: '数码',
    condition: '九成新',
    description: '使用一年，电池健康92%，无划痕，配件齐全',
    exchange: '期望交换一台iPad Air',
    image: '📱',
    createdAt: '2024-01-15',
    ownerId: 'user1',
    ownerName: '邻居小王'
  },
  {
    id: '2',
    name: '宜家书架',
    category: '家居',
    condition: '八成新',
    description: '白色四层书架，尺寸80x30x120cm，自提',
    exchange: '期望交换一张书桌',
    image: '📚',
    createdAt: '2024-01-14',
    ownerId: 'user1',
    ownerName: '邻居小王'
  },
  {
    id: '3',
    name: 'Nike运动鞋',
    category: '服饰',
    condition: '九成新',
    description: 'Air Max系列，42码，穿过几次',
    exchange: '期望交换同等价值的运动装备',
    image: '👟',
    createdAt: '2024-01-13',
    ownerId: 'user2',
    ownerName: '张阿姨'
  },
  {
    id: '4',
    name: '三体全集',
    category: '书籍',
    condition: '全新',
    description: '刘慈欣科幻小说经典，全新未拆封',
    exchange: '期望交换其他科幻小说',
    image: '📖',
    createdAt: '2024-01-12',
    ownerId: 'user3',
    ownerName: '李同学'
  },
  {
    id: '5',
    name: '小米电视43寸',
    category: '数码',
    condition: '八成新',
    description: '4K分辨率，智能电视，功能正常',
    exchange: '期望交换一台投影仪',
    image: '📺',
    createdAt: '2024-01-11',
    ownerId: 'user2',
    ownerName: '张阿姨'
  },
  {
    id: '6',
    name: '实木餐桌',
    category: '家居',
    condition: '七成新',
    description: '四人餐桌，实木材质，略有磨损',
    exchange: '期望交换一套沙发',
    image: '🪑',
    createdAt: '2024-01-10',
    ownerId: 'user3',
    ownerName: '李同学'
  },
  {
    id: '7',
    name: 'MacBook Pro',
    category: '数码',
    condition: '九成新',
    description: '13寸，M2芯片，8GB+256GB',
    exchange: '期望交换一台游戏主机',
    image: '💻',
    createdAt: '2024-01-09',
    ownerId: 'user4',
    ownerName: '王大哥'
  },
  {
    id: '8',
    name: '索尼耳机',
    category: '数码',
    condition: '八成新',
    description: 'WH-1000XM4，降噪效果好',
    exchange: '期望交换一副蓝牙耳机',
    image: '🎧',
    createdAt: '2024-01-08',
    ownerId: 'user4',
    ownerName: '王大哥'
  }
];

function initMockData() {
  localStorage.setItem(STORAGE_KEYS.GOODS, JSON.stringify(MOCK_DATA));
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([
      {
        id: 'O001',
        goodsId: '1',
        goodsName: 'iPhone 14 Pro',
        exchangeTime: '2024-01-20T14:00',
        note: '希望周末交换',
        status: 'pending',
        createdAt: '2024-01-16',
        userId: 'user1'
      },
      {
        id: 'O002',
        goodsId: '3',
        goodsName: 'Nike运动鞋',
        exchangeTime: '2024-01-15T10:00',
        note: '',
        status: 'completed',
        createdAt: '2024-01-14',
        userId: 'user1'
      }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(['2', '4']));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
      name: '邻居小王',
      points: 100
    }));
  }
}

function getGoods() {
  const goods = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOODS) || '[]');
  // 为旧数据补充缺失字段
  return goods.map(g => ({
    ...g,
    ownerId: g.ownerId || 'user1',
    ownerName: g.ownerName || '邻居小王'
  }));
}

function saveGoods(goods) {
  localStorage.setItem(STORAGE_KEYS.GOODS, JSON.stringify(goods));
}

function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function getFavorites() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
}

function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

function getUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || JSON.stringify({ name: '邻居小王', points: 100 }));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
  
  if (pageId === 'home-page') {
    renderGoodsList();
  } else if (pageId === 'profile-page') {
    updateStats();
    switchProfileTab('goods');
  }
}

function switchProfileTab(tabId) {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(`${tabId}-tab`)?.classList.add('active');
  
  if (tabId === 'goods') {
    renderMyGoods();
  } else if (tabId === 'favorites') {
    renderMyFavorites();
  } else if (tabId === 'orders') {
    renderOrders('pending');
  }
}

function updateStats() {
  const allGoods = getGoods();
  const myGoods = allGoods.filter(g => g.ownerId === CURRENT_USER_ID);
  const favorites = getFavorites();
  const allOrders = getOrders();
  const myOrders = allOrders.filter(o => o.userId === CURRENT_USER_ID);
  const completedOrders = myOrders.filter(o => o.status === 'completed').length;
  
  document.querySelector('.stats-row .stat-item:nth-child(1) .stat-value').textContent = myGoods.length;
  document.querySelector('.stats-row .stat-item:nth-child(2) .stat-value').textContent = favorites.length;
  document.querySelector('.stats-row .stat-item:nth-child(3) .stat-value').textContent = myOrders.length;
  document.querySelector('.stats-row .stat-item:nth-child(4) .stat-value').textContent = completedOrders;
}

function renderGoodsCard(goods) {
  const favorites = getFavorites();
  const isFavorited = favorites.includes(goods.id);
  const isMyGoods = goods.ownerId === CURRENT_USER_ID;
  return `
    <div class="goods-card" data-id="${goods.id}">
      <div class="card-image">${goods.image}${isMyGoods ? '<span class="card-badge">我的</span>' : ''}</div>
      <div class="card-content">
        <h3 class="card-title">${goods.name}</h3>
        <span class="card-condition">${goods.condition}</span>
        <p class="card-exchange">期望交换：<span>${goods.exchange}</span></p>
        <div class="card-footer">
          <span class="card-owner">${goods.ownerName}</span>
          <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${goods.id}">
            ${isFavorited ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderGoodsList(goods = null) {
  const goodsList = document.getElementById('goods-list');
  const data = goods || getGoods();
  
  if (data.length === 0) {
    goodsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>暂无闲置物品</p>
      </div>
    `;
    return;
  }
  
  goodsList.innerHTML = data.map(renderGoodsCard).join('');
  
  document.querySelectorAll('.goods-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      showDetail(id);
    });
  });
  
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });
}

function showDetail(id) {
  const goods = getGoods().find(g => g.id === id);
  const favorites = getFavorites();
  const isFavorited = favorites.includes(id);
  
  if (!goods) return;
  
  const isMyGoods = goods.ownerId === CURRENT_USER_ID;
  const exchangeBtnHtml = isMyGoods ? '' : `<button class="btn-exchange" data-id="${goods.id}">发起置换</button>`;
  const detailBody = document.getElementById('detail-body');
  detailBody.innerHTML = `
    <div class="detail-image">${goods.image}${isMyGoods ? '<span class="detail-badge">我的</span>' : ''}</div>
    <h3>${goods.name}</h3>
    <span class="detail-condition">${goods.condition}</span>
    <p><strong>发布者：</strong>${goods.ownerName}</p>
    <p><strong>分类：</strong>${goods.category}</p>
    <p><strong>描述：</strong>${goods.description}</p>
    <p class="detail-exchange"><strong>期望交换：</strong>${goods.exchange}</p>
    <div class="detail-actions">
      <button class="btn-favorite ${isFavorited ? 'favorited' : ''}" data-id="${goods.id}">
        ${isFavorited ? '❤️ 已收藏' : '🤍 收藏'}
      </button>
      ${exchangeBtnHtml}
    </div>
  `;
  
  document.getElementById('detail-modal').classList.add('show');
  
  document.querySelector('.btn-favorite').addEventListener('click', () => {
    toggleFavorite(id);
    showDetail(id);
  });
  
  const exchangeBtn = document.querySelector('.btn-exchange');
  if (exchangeBtn) {
    exchangeBtn.addEventListener('click', () => {
      openOrderModal(id, goods.name);
    });
  }
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('已取消收藏');
  } else {
    favorites.push(id);
    showToast('收藏成功');
  }
  
  saveFavorites(favorites);
  renderGoodsList();
  
  const profilePage = document.getElementById('profile-page');
  if (profilePage.classList.contains('active')) {
    updateStats();
    renderMyFavorites();
  }
}

let currentOrderGoodsId = '';
let currentOrderGoodsName = '';

function openOrderModal(goodsId, goodsName) {
  currentOrderGoodsId = goodsId;
  currentOrderGoodsName = goodsName;
  document.getElementById('detail-modal').classList.remove('show');
  document.getElementById('order-modal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function renderMyGoods() {
  const allGoods = getGoods();
  const goods = allGoods.filter(g => g.ownerId === CURRENT_USER_ID);
  const myGoodsList = document.getElementById('my-goods-list');
  
  if (goods.length === 0) {
    myGoodsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <p>暂无发布的闲置</p>
      </div>
    `;
    return;
  }
  
  const displayGoods = goods.slice(0, 6);
  myGoodsList.innerHTML = displayGoods.map(g => `
    <div class="goods-card" data-id="${g.id}">
      <div class="card-image">${g.image}</div>
      <div class="card-content">
        <h3 class="card-title">${g.name}</h3>
        <span class="card-condition">${g.condition}</span>
        <div class="card-actions">
          <button class="delete-btn" data-id="${g.id}">删除</button>
        </div>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('#my-goods-list .goods-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        showDetail(card.dataset.id);
      }
    });
  });
  
  document.querySelectorAll('#my-goods-list .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const goodsId = btn.dataset.id;
      confirmDelete(goodsId);
    });
  });
}

function renderMyFavorites() {
  const favorites = getFavorites();
  const allGoods = getGoods();
  const favoriteGoods = allGoods.filter(g => favorites.includes(g.id));
  const myFavoritesList = document.getElementById('my-favorites-list');
  
  if (favoriteGoods.length === 0) {
    myFavoritesList.innerHTML = `
      <div class="empty-state">
        <div class="icon">❤️</div>
        <p>暂无收藏</p>
      </div>
    `;
    return;
  }
  
  const displayGoods = favoriteGoods.slice(0, 6);
  myFavoritesList.innerHTML = displayGoods.map(g => `
    <div class="goods-card" data-id="${g.id}">
      <div class="card-image">${g.image}</div>
      <div class="card-content">
        <h3 class="card-title">${g.name}</h3>
        <span class="card-condition">${g.condition}</span>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('#my-favorites-list .goods-card').forEach(card => {
    card.addEventListener('click', () => {
      showDetail(card.dataset.id);
    });
  });
}

function confirmDelete(goodsId) {
  const goods = getGoods().find(g => g.id === goodsId);
  if (!goods) {
    showToast('商品不存在');
    return;
  }
  
  if (goods.ownerId !== CURRENT_USER_ID) {
    showToast('您只能删除自己发布的商品');
    return;
  }
  
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  confirmMessage.textContent = `确定要删除"${goods.name}"吗？删除后无法恢复。`;
  confirmModal.classList.add('show');
  
  const confirmBtn = document.querySelector('.btn-confirm');
  const cancelBtn = document.querySelector('.btn-cancel');
  
  const handleConfirm = () => {
    confirmModal.classList.remove('show');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    deleteGoods(goodsId);
  };
  
  const handleCancel = () => {
    confirmModal.classList.remove('show');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

function deleteGoods(id) {
  const goods = getGoods().find(g => g.id === id);
  
  if (!goods) {
    showToast('商品不存在');
    return;
  }
  
  if (goods.ownerId !== CURRENT_USER_ID) {
    showToast('您只能删除自己发布的商品');
    return;
  }
  
  let allGoods = getGoods();
  allGoods = allGoods.filter(g => g.id !== id);
  saveGoods(allGoods);
  
  let favorites = getFavorites();
  favorites = favorites.filter(f => f !== id);
  saveFavorites(favorites);
  
  showToast('删除成功');
  updateStats();
  
  const activePane = document.querySelector('.tab-pane.active');
  if (activePane) {
    if (activePane.id === 'goods-tab') {
      renderMyGoods();
    } else if (activePane.id === 'favorites-tab') {
      renderMyFavorites();
    }
  }
  
  renderGoodsList();
}

function renderOrders(status) {
  const orders = getOrders().filter(o => o.userId === CURRENT_USER_ID && o.status === status);
  const orderList = document.getElementById('order-list');
  
  if (orders.length === 0) {
    orderList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>暂无${status === 'pending' ? '待确认' : '已完成'}订单</p>
      </div>
    `;
    return;
  }
  
  orderList.innerHTML = orders.map(order => `
    <div class="order-item">
      <h4>${order.goodsName}</h4>
      <p>交换时间：${formatDateTime(order.exchangeTime)}</p>
      ${order.note ? `<p>备注：${order.note}</p>` : ''}
      <span class="order-status ${order.status}">${order.status === 'pending' ? '待确认' : '已完成'}</span>
    </div>
  `).join('');
}

function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function initEventListeners() {
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      switchPage(item.dataset.page);
    });
  });

  let searchTimeout = null;
  
  const performSearch = () => {
    const keyword = document.getElementById('search-input').value.toLowerCase();
    const category = document.querySelector('.category-tabs .tab.active').dataset.category;
    
    let goods = getGoods();
    
    if (keyword) {
      goods = goods.filter(g => 
        g.name.toLowerCase().includes(keyword) || 
        g.description.toLowerCase().includes(keyword) ||
        g.exchange.toLowerCase().includes(keyword)
      );
    }
    
    if (category !== 'all') {
      goods = goods.filter(g => g.category === category);
    }
    
    renderGoodsList(goods);
  };

  document.getElementById('search-btn').addEventListener('click', performSearch);

  document.getElementById('search-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      performSearch();
      return;
    }
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(performSearch, 300);
  });

  document.querySelectorAll('.category-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      performSearch();
    });
  });

  document.getElementById('publish-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('goods-name').value.trim();
    const category = document.getElementById('goods-category').value;
    const condition = document.getElementById('goods-condition').value;
    const desc = document.getElementById('goods-desc').value.trim();
    const exchange = document.getElementById('goods-exchange').value.trim();
    
    if (!name) {
      showToast('请输入物品名称');
      return;
    }
    
    if (!category) {
      showToast('请选择分类');
      return;
    }
    
    if (!condition) {
      showToast('请选择成色');
      return;
    }
    
    if (!desc) {
      showToast('请输入物品描述');
      return;
    }
    
    if (!exchange) {
      showToast('请输入期望置换物品');
      return;
    }
    
    const images = ['📱', '📚', '👟', '📖', '📺', '🪑', '💻', '🎮', '🎧', '⌚'];
    const user = getUser();
    const newGoods = {
      id: Date.now().toString(),
      name,
      category,
      condition,
      description: desc,
      exchange,
      image: images[Math.floor(Math.random() * images.length)],
      createdAt: new Date().toISOString().split('T')[0],
      ownerId: CURRENT_USER_ID,
      ownerName: user.name
    };
    
    const goods = getGoods();
    goods.unshift(newGoods);
    saveGoods(goods);
    
    showToast('发布成功');
    
    document.getElementById('publish-form').reset();
    
    setTimeout(() => {
      switchPage('home-page');
    }, 300);
  });

  document.getElementById('close-detail').addEventListener('click', () => {
    closeModal('detail-modal');
  });

  document.getElementById('close-order').addEventListener('click', () => {
    closeModal('order-modal');
  });

  document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const exchangeTime = document.getElementById('order-time').value;
    const note = document.getElementById('order-note').value;
    
    if (!exchangeTime) {
      showToast('请选择交换时间');
      return;
    }
    
    const newOrder = {
      id: 'O' + Date.now(),
      goodsId: currentOrderGoodsId,
      goodsName: currentOrderGoodsName,
      exchangeTime,
      note,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      userId: CURRENT_USER_ID
    };
    
    const orders = getOrders();
    orders.unshift(newOrder);
    saveOrders(orders);
    
    showToast('发起置换成功');
    
    document.getElementById('order-form').reset();
    closeModal('order-modal');
  });

  document.querySelectorAll('.order-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderOrders(tab.dataset.status);
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });

  document.getElementById('settings-btn')?.addEventListener('click', () => {
    showToast('设置功能开发中');
  });

  document.getElementById('message-btn')?.addEventListener('click', () => {
    showToast('消息功能开发中');
  });

  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchProfileTab(tab.dataset.tab);
    });
  });
}

function init() {
  initMockData();
  initEventListeners();
  switchPage('home-page');
}

document.addEventListener('DOMContentLoaded', init);