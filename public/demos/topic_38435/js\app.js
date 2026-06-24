// ============================================================
// 城市脉搏 - 用户端主逻辑
// ============================================================

const app = {
  currentTab: 'home',
  currentFilter: 'all',
  busTimer: null,

  // 初始化
  init() {
    this.renderHome();
    this.renderWeather();
    this.renderHighway();
    this.renderBus();
    this.renderMessages();
    this.renderTags();
    this.showAlertBanner();
    this.startBusCountdown();
  },

  // 切换页面
  switchTab(tab) {
    this.currentTab = tab;

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.top-nav-item').forEach(n => n.classList.remove('active'));

    // 显示目标页面
    const targetPage = document.getElementById(`page-${tab}`);
    if (targetPage) targetPage.classList.add('active');

    // 更新顶部导航状态
    const targetNav = document.querySelector(`.top-nav-item[data-tab="${tab}"]`);
    if (targetNav) targetNav.classList.add('active');

    // 滚动到顶部
    window.scrollTo(0, 0);

    // 如果切换到消息页，重新渲染
    if (tab === 'message') {
      this.renderMessages();
    }
  },

  // 显示预警横幅
  showAlertBanner() {
    const alerts = window.CityPulseData.weather.alerts;
    if (alerts && alerts.length > 0) {
      const banner = document.getElementById('alert-banner');
      const text = document.getElementById('alert-text');
      text.textContent = `⚠️ ${alerts[0].title}`;
      banner.style.display = 'flex';
    }
  },

  // 关闭预警横幅
  dismissAlert() {
    document.getElementById('alert-banner').style.display = 'none';
  },

  // 渲染首页
  renderHome() {
    const weather = window.CityPulseData.weather.current;
    document.getElementById('home-weather-icon').textContent = weather.icon;
    document.getElementById('home-temp').textContent = `${weather.temp}°C`;
    document.getElementById('home-condition').textContent = weather.condition;
    document.getElementById('home-range').textContent = `${weather.high}° / ${weather.low}°`;

    // 渲染高速预览
    const highwayList = document.getElementById('home-highway-list');
    const highways = window.CityPulseData.highways.slice(0, 3);
    highwayList.innerHTML = highways.map(h => {
      const closedCount = h.directions.filter(d => d.status === 'closed').length;
      const statusText = closedCount > 0 ? `⚠️ ${closedCount}个方向封闭` : '✅ 正常通行';
      return `
        <div class="highway-item">
          <span class="highway-name">${h.name}</span>
          <span style="font-size:12px;color:#999;">${statusText}</span>
        </div>
      `;
    }).join('');

    // 渲染消息预览
    const messageList = document.getElementById('home-message-list');
    const messages = window.CityPulseData.messages.slice(0, 3);
    messageList.innerHTML = messages.map(m => {
      const tags = m.tags.map(tagId => {
        const tag = window.CityPulseUtils.getTagById(tagId);
        return tag ? `<span class="message-tag" style="background:${tag.color}">${tag.icon} ${tag.name}</span>` : '';
      }).join('');
      return `
        <div class="message-item">
          <div class="message-image">📰</div>
          <div class="message-content">
            <div class="message-title">${m.title}</div>
            <div class="message-summary">${m.summary}</div>
            <div class="message-meta">
              ${tags}
              <span>${window.CityPulseUtils.formatTime(m.time)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 渲染天气页
  renderWeather() {
    const weather = window.CityPulseData.weather.current;
    document.getElementById('weather-icon').textContent = weather.icon;
    document.getElementById('weather-temp').textContent = `${weather.temp}°C`;
    document.getElementById('weather-condition').textContent = weather.condition;
    document.getElementById('weather-range').textContent = `今日 ${weather.high}° / ${weather.low}°`;

    // 渲染预警
    const alertSection = document.getElementById('weather-alerts');
    const alerts = window.CityPulseData.weather.alerts;
    alertSection.innerHTML = alerts.map(a => `
      <div class="alert-card ${a.level === 'blue' ? 'blue' : ''}">
        <div class="alert-title">${a.icon} ${a.title}</div>
        <div class="alert-content">${a.content}</div>
        <div class="alert-time">${a.time}</div>
      </div>
    `).join('');

    // 渲染7天预报
    const forecastList = document.getElementById('forecast-list');
    const forecast = window.CityPulseData.weather.forecast;
    forecastList.innerHTML = forecast.map(f => `
      <div class="forecast-item">
        <span class="forecast-day">${f.day}</span>
        <span class="forecast-date">${f.date}</span>
        <span class="forecast-icon">${f.icon}</span>
        <span class="forecast-condition">${f.condition}</span>
        <span class="forecast-temp">${f.high}° / ${f.low}°</span>
      </div>
    `).join('');
  },

  // 渲染高速页
  renderHighway() {
    document.getElementById('highway-weather-tag').textContent =
      `${window.CityPulseData.weather.current.icon} ${window.CityPulseData.weather.current.condition} ${window.CityPulseData.weather.current.temp}°C`;

    const highwayList = document.getElementById('highway-list');
    const highways = window.CityPulseData.highways;
    highwayList.innerHTML = highways.map(h => {
      const directionsHtml = h.directions.map(d => {
        const style = window.CityPulseUtils.getStatusStyle(d.status);
        return `
          <div class="direction-item">
            <div>
              <div class="direction-name">${d.name}</div>
              <div class="direction-note">${d.note}</div>
            </div>
            <div class="direction-status">
              <span style="color:${style.color};font-weight:600;">${style.icon} ${style.text}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="highway-detail-card">
          <div class="highway-detail-header">
            <span class="highway-detail-name">${h.name}</span>
            <span class="highway-detail-code">${h.code}</span>
          </div>
          ${h.reason ? `<div class="highway-reason">⚠️ ${h.reason}</div>` : ''}
          <div class="highway-directions">
            ${directionsHtml}
          </div>
        </div>
      `;
    }).join('');
  },

  // 渲染公交页
  renderBus() {
    const bus = window.CityPulseData.bus;
    document.getElementById('bus-current').textContent = bus.currentStation;
    document.getElementById('bus-next').textContent = bus.nextStation.name;
    document.getElementById('bus-arrival').textContent = bus.nextStation.arrivalMinutes;
    document.getElementById('bus-following').textContent = bus.followingStations.join(' → ');
  },

  // 公交倒计时
  startBusCountdown() {
    this.busTimer = setInterval(() => {
      const bus = window.CityPulseData.bus;
      if (bus.nextStation.arrivalMinutes > 0) {
        bus.nextStation.arrivalMinutes--;
        if (this.currentTab === 'bus') {
          document.getElementById('bus-arrival').textContent = bus.nextStation.arrivalMinutes;
        }
        // 更新首页预览
        const homeBusInfo = document.getElementById('home-bus-info');
        if (homeBusInfo) {
          homeBusInfo.innerHTML = `
            <div class="bus-current">当前站：${bus.currentStation}</div>
            <div class="bus-next">下一站：${bus.nextStation.name} <span class="arrival-time">${bus.nextStation.arrivalMinutes}分钟</span></div>
          `;
        }
      }
    }, 60000); // 每分钟更新
  },

  // 渲染标签筛选
  renderTags() {
    const tagFilter = document.getElementById('tag-filter');
    const tags = window.CityPulseData.tags;
    const tagsHtml = tags.map(t => `
      <span class="tag-item" data-tag="${t.id}" onclick="app.filterMessages('${t.id}')">${t.icon} ${t.name}</span>
    `).join('');
    tagFilter.innerHTML = `<span class="tag-item active" data-tag="all" onclick="app.filterMessages('all')">全部</span>${tagsHtml}`;
  },

  // 筛选消息
  filterMessages(tagId) {
    this.currentFilter = tagId;

    // 更新标签样式
    document.querySelectorAll('.tag-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tag === tagId);
    });

    this.renderMessages();
  },

  // 渲染消息列表
  renderMessages() {
    const messageList = document.getElementById('message-list');
    let messages = window.CityPulseData.messages;

    if (this.currentFilter !== 'all') {
      messages = messages.filter(m => m.tags.includes(this.currentFilter));
    }

    messageList.innerHTML = messages.map(m => {
      const tagsHtml = m.tags.map(tagId => {
        const tag = window.CityPulseUtils.getTagById(tagId);
        return tag ? `<span class="message-full-tag" style="background:${tag.color}">${tag.icon} ${tag.name}</span>` : '';
      }).join('');

      return `
        <div class="message-full-item">
          <div class="message-full-header">
            <div class="message-full-title">${m.title}</div>
            <div class="message-full-time">${window.CityPulseUtils.formatTime(m.time)}</div>
          </div>
          <div class="message-full-summary">${m.summary}</div>
          <div class="message-full-tags">${tagsHtml}</div>
          <div class="message-source">来源：${m.source}</div>
        </div>
      `;
    }).join('');
  },

  // 切换推送设置
  togglePush() {
    const toggle = document.getElementById('push-toggle');
    window.CityPulseData.userSettings.pushEnabled = toggle.checked;
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
