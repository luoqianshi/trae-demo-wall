// 爪印城市 - 发现页
Router.register('discover', () => {
  return `
    <div class="discover-page">
      <div class="nav-header">
        <div class="page-title">🧭 发现</div>
      </div>
      <div class="banner">
        <h2>🐾 宠物友好出行指南</h2>
        <p>发现城市中的宠物友好好去处，和毛孩子一起探索世界</p>
      </div>

      <!-- 城市宠物友好指数看板 -->
      <div class="city-pet-dashboard" id="city-pet-dashboard">
        <div class="dashboard-header">
          <span class="dashboard-title">🏙️ 城市宠物友好指数</span>
          <span class="dashboard-city" id="dashboard-city">北京</span>
        </div>
        <div class="dashboard-main">
          <div class="dashboard-score">
            <div class="score-value" id="dashboard-score">--</div>
            <div class="score-label">综合指数</div>
          </div>
          <div class="dashboard-stats" id="dashboard-stats">
            <div class="dashboard-stat">
              <div class="stat-num" id="stat-places">--</div>
              <div class="stat-label">收录场所</div>
            </div>
            <div class="dashboard-stat">
              <div class="stat-num" id="stat-verifies">--</div>
              <div class="stat-label">实地验证</div>
            </div>
            <div class="dashboard-stat">
              <div class="stat-num" id="stat-facilities">--</div>
              <div class="stat-label">平均设施</div>
            </div>
          </div>
        </div>
      </div>

      <div class="category-grid">
        <div class="category-item" onclick="goToCategory('餐饮')">
          <div class="cat-icon">🍽️</div>
          <div class="cat-name">周末探店</div>
          <div class="cat-desc">宠物友好餐厅精选</div>
        </div>
        <div class="category-item" onclick="goToCategory('住宿')">
          <div class="cat-icon">🏨</div>
          <div class="cat-name">宠物酒店</div>
          <div class="cat-desc">带宠出行住宿推荐</div>
        </div>
        <div class="category-item" onclick="goToCategory('公园')">
          <div class="cat-icon">🌳</div>
          <div class="cat-name">遛狗圣地</div>
          <div class="cat-desc">城市公园宠物区</div>
        </div>
        <div class="category-item" onclick="goToCategory('商场')">
          <div class="cat-icon">🛍️</div>
          <div class="cat-name">出行攻略</div>
          <div class="cat-desc">宠物友好商场指南</div>
        </div>
      </div>
      <div class="section-header">
        <h3>🔥 人气宠物友好餐厅 TOP5</h3>
        <span class="more" onclick="goToCategory('餐饮')">更多 ›</span>
      </div>
      <div class="rank-list" id="rank-list">
        <div style="text-align:center;color:var(--text-light);padding:20px;">加载中...</div>
      </div>
      <div class="section-header">
        <h3>📋 最新验证动态</h3>
        <span class="more">更多 ›</span>
      </div>
      <div class="feed-list" id="feed-list">
        <div style="text-align:center;color:var(--text-light);padding:20px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_discover() {
  // 添加导航辅助函数
  window.goToDetail = function(id) {
    Router.navigate('detail', { id });
  };
  window.goToCategory = function(type) {
    Router.navigate('home');
    setTimeout(() => {
      const tag = document.querySelector(`[data-type="${type}"]`);
      if (tag) tag.click();
    }, 100);
  };

  // 获取当前城市（从首页全局变量或默认值）
  const currentCity = window.currentCity || '北京';

  // 加载城市统计数据
  const allRes = await api.getPlaces({ city: currentCity });
  const allPlaces = allRes.data || [];

  // 计算城市宠物友好指数
  const cityStats = calculateCityPetStats(allPlaces, currentCity);
  renderCityDashboard(cityStats);

  // 加载排行榜
  const res = await api.getPlaces({ type: '餐饮' });
  const places = (res.data || []).sort((a, b) => b.rating - a.rating).slice(0, 5);

  const rankList = document.getElementById('rank-list');
  if (places.length === 0) {
    rankList.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:13px;">暂无餐厅数据</div>';
  } else {
    rankList.innerHTML = places.map((p, i) => `
      <div class="rank-item" onclick="goToDetail(${p.id})">
        <div class="rank-num ${i < 3 ? 'top' : 'normal'}">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-name">${p.name}</div>
          <div class="rank-meta">${p.address.slice(0, 15)}... | ${p.verifyCount}人验证</div>
        </div>
        <div class="rank-rating">★ ${p.rating}</div>
      </div>
    `).join('');
  }

  // 加载最新动态（验证记录）
  const verifiesRes = await api.getUserVerifies();
  const verifies = (verifiesRes.data || []).slice(0, 5);

  const feedList = document.getElementById('feed-list');
  feedList.innerHTML = verifies.map(v => `
    <div class="feed-item">
      <div class="feed-user">
        <div class="feed-avatar">${v.avatar || '🐾'}</div>
        <div>
          <div class="feed-username">${v.user}</div>
          <div class="feed-place">在 ${v.placeName || '某场所'} 验证</div>
        </div>
      </div>
      <div class="feed-content">${v.content}</div>
      <div class="feed-time">${v.time}</div>
    </div>
  `).join('') || '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:13px;">暂无动态</div>';
}

// 计算城市宠物友好统计数据
function calculateCityPetStats(places, city) {
  const totalPlaces = places.length;
  const totalVerifies = places.reduce((sum, p) => sum + (p.verifyCount || 0), 0);
  const avgFacilities = totalPlaces > 0
    ? (places.reduce((sum, p) => sum + ((p.petPolicy?.facilities || []).length), 0) / totalPlaces).toFixed(1)
    : 0;

  // 综合指数计算
  let score = 0;
  if (totalPlaces > 0) {
    // 场所数量占比 30%
    score += Math.min(30, totalPlaces * 3);
    // 平均评分占比 30%
    const avgRating = places.reduce((sum, p) => sum + p.rating, 0) / totalPlaces;
    score += Math.min(30, avgRating * 6);
    // 验证活跃度占比 25%
    score += Math.min(25, totalVerifies * 1.5);
    // 设施完善度占比 15%
    score += Math.min(15, avgFacilities * 3.75);
  }

  return {
    city,
    score: Math.round(score),
    totalPlaces,
    totalVerifies,
    avgFacilities
  };
}

// 渲染城市宠物友好指数看板
function renderCityDashboard(stats) {
  const cityEl = document.getElementById('dashboard-city');
  const scoreEl = document.getElementById('dashboard-score');
  const placesEl = document.getElementById('stat-places');
  const verifiesEl = document.getElementById('stat-verifies');
  const facilitiesEl = document.getElementById('stat-facilities');

  if (cityEl) cityEl.textContent = stats.city;
  if (scoreEl) scoreEl.textContent = stats.score;
  if (placesEl) placesEl.textContent = stats.totalPlaces;
  if (verifiesEl) verifiesEl.textContent = stats.totalVerifies;
  if (facilitiesEl) facilitiesEl.textContent = stats.avgFacilities;
}