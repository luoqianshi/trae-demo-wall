/**
 * 饭泛之交 - Home 首页与榜单
 * 模块化拆分自单文件原型
 */

// ==================== HOME ====================
function renderHome() {
  const container = document.getElementById('home-posts');
  if(Store.user) {
    document.getElementById('home-greeting').textContent = (Store.user.name || '美食家') + '，今天想吃点什么？';
  }
  // Show skeleton first
  LoadingManager.showSkeleton('home-posts', 'cards', 3);
  // Simulate API fetch
  MockAPI.getHomeFeed()
    .then(posts => {
      container.innerHTML = posts.map((p, i) => `
        <div class="post-card stagger-item" style="animation-delay:${i * 0.08}s;">
          <div class="post-header">
            <div class="post-avatar">${p.avatar}</div>
            <div>
              <div class="post-name">${p.name}</div>
              <div class="post-time">${p.time}</div>
            </div>
          </div>
          <div class="post-content">${p.content}</div>
          <div class="post-image">${p.emoji}</div>
          <div class="post-actions">
            <span onclick="showToast('已点赞 ❤️')">❤️ ${p.likes}</span>
            <span onclick="showToast('已收藏 ⭐')">⭐ 收藏</span>
            <span>💬 ${p.comments}</span>
          </div>
        </div>
      `).join('');
      refreshDishes();
    })
    .catch(err => {
      LoadingManager.showErrorRetry('home-posts', '加载推荐失败', 'renderHome');
    });
}

function refreshDishes() {
  const container = document.getElementById('dish-scroll');
  if(!container) return;
  const shuffled = [...mockDishes].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 3);
  container.innerHTML = picks.map(d => `
    <div class="dish-card">
      <div class="dish-top">
        <div class="dish-emoji">${d.emoji}</div>
        <div class="dish-info">
          <div class="dish-name">${d.name}</div>
          <div class="dish-restaurant">${d.restaurant}</div>
        </div>
      </div>
      <div class="dish-tags">
        ${d.tags.map(t => `<span class="dish-tag">${t}</span>`).join('')}
      </div>
      <div class="dish-quote">${d.quote}</div>
    </div>
  `).join('');
}

// ==================== RANK ====================
function switchRank(type) {
  document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
  if(typeof event !== 'undefined' && event && event.target) {
    event.target.classList.add('active');
  } else {
    document.querySelector('.rank-tab[onclick*="' + type + '"]')?.classList.add('active');
  }
  renderRank(type);
}
function renderRank(type) {
  const container = document.getElementById('rank-list');
  LoadingManager.showSkeleton('rank-list', 'rank', 5);
  MockAPI.getRankList(type)
    .then(data => {
      container.innerHTML = data.map((item,i) => `
        <div class="rank-item stagger-item" style="animation-delay:${i * 0.06}s;" onclick="showToast('正在打开 ${item.name}...')">
          <div class="rank-num ${i<3?'top':''}">${i+1}</div>
          <div class="rank-img">${item.emoji}</div>
          <div class="rank-info">
            <h4>${item.name}</h4>
            <p>${item.addr} · ${item.tags}</p>
            <div class="rank-meta">
              <span>⭐ ${item.score}</span>
              <span>💬 ${Math.floor(Math.random()*500+50)}条评价</span>
            </div>
          </div>
          <div class="rank-score">${item.score}</div>
        </div>
      `).join('');
    })
    .catch(err => {
      LoadingManager.showErrorRetry('rank-list', '加载榜单失败', 'renderRank.bind(null,"' + type + '")');
    });
}