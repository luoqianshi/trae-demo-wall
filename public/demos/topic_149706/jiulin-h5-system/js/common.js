// 救邻 H5 系统 - 公共函数

const JLCommon = {
  // 页面跳转
  goTo(page) {
    window.location.href = page + '.html';
  },

  // 返回上一页
  back() {
    window.history.back();
  },

  // 本地存储
  storage: {
    set(key, value) {
      localStorage.setItem('jl_' + key, JSON.stringify(value));
    },
    get(key, defaultValue) {
      const data = localStorage.getItem('jl_' + key);
      return data ? JSON.parse(data) : defaultValue;
    },
    remove(key) {
      localStorage.removeItem('jl_' + key);
    }
  },

  // 设置当前选中的症状
  setSymptom(symptomId) {
    this.storage.set('selectedSymptom', symptomId);
  },

  // 获取当前选中的症状
  getSymptom() {
    return this.storage.get('selectedSymptom', null);
  },

  // 格式化距离
  formatDistance(meters) {
    if (meters < 1000) return meters + 'm';
    return (meters / 1000).toFixed(1) + 'km';
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return mins + ':' + secs;
  },

  // 高亮当前底部导航
  activeNav(activeIndex) {
    const items = document.querySelectorAll('.bottom-nav .nav-item');
    items.forEach((item, index) => {
      if (index === activeIndex) item.classList.add('active');
      else item.classList.remove('active');
    });
  },

  // 渲染底部导航
  renderBottomNav(activeIndex) {
    const nav = document.createElement('div');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
      <a href="home.html" class="nav-item ${activeIndex === 0 ? 'active' : ''}">
        <div class="nav-icon">🏠</div>
        <div class="nav-label">首页</div>
      </a>
      <a href="aed.html" class="nav-item ${activeIndex === 1 ? 'active' : ''}">
        <div class="nav-icon">📍</div>
        <div class="nav-label">AED</div>
      </a>
      <a href="sos.html" class="nav-item sos-tab">
        <div class="sos-center">SOS</div>
      </a>
      <a href="ai-guide.html" class="nav-item ${activeIndex === 3 ? 'active' : ''}">
        <div class="nav-icon">🤖</div>
        <div class="nav-label">指引</div>
      </a>
      <a href="profile.html" class="nav-item ${activeIndex === 4 ? 'active' : ''}">
        <div class="nav-icon">👤</div>
        <div class="nav-label">我的</div>
      </a>
    `;
    document.getElementById('app').appendChild(nav);
  },

  // 渲染顶部状态栏
  renderStatusBar(title, type, showBack, backUrl) {
    const bar = document.createElement('div');
    bar.className = 'status-bar ' + (type || '');
    bar.innerHTML = `
      ${showBack ? `<div class="back-btn" onclick="${backUrl ? "JLCommon.goTo('" + backUrl + "')" : 'JLCommon.back()'}">←</div>` : '<div style="width:36px"></div>'}
      <div class="page-title">${title}</div>
      <div style="width:36px"></div>
    `;
    const app = document.getElementById('app');
    app.insertBefore(bar, app.firstChild);
  },

  // 显示弹窗
  alert(message, title) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:24px;max-width:320px;width:100%;text-align:center;">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">${title || '提示'}</h3>
        <p style="font-size:14px;color:#666;line-height:1.7;margin-bottom:20px;">${message}</p>
        <button onclick="this.closest('.modal').remove()" style="width:100%;padding:14px;background:var(--red);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">知道了</button>
      </div>
    `;
    modal.className = 'modal';
    document.body.appendChild(modal);
    modal.querySelector('button').onclick = () => modal.remove();
  },

  // 模拟加载
  simulateLoading(callback, duration) {
    setTimeout(callback, duration || 1500);
  }
};

// 防止底部导航遮挡内容
window.addEventListener('resize', () => {
  document.body.style.paddingBottom = '80px';
});
