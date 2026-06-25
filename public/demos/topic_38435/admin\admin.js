// ============================================================
// 城市脉搏 - 管理端主逻辑
// ============================================================

const adminApp = {
  currentPage: 'dashboard',

  // 初始化
  init() {
    this.renderDashboard();
    this.renderHighwayManage();
    this.renderMessageTable();
    this.renderTagManage();
    this.renderTagCheckboxes();
  },

  // 登录
  login() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    if (user === 'admin' && pass === 'admin123') {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('admin-main').style.display = 'flex';
      this.init();
    } else {
      alert('账号或密码错误');
    }
  },

  // 退出
  logout() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('admin-main').style.display = 'none';
  },

  // 切换页面
  switchPage(page) {
    this.currentPage = page;

    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));

    const targetPage = document.getElementById(`admin-${page}`);
    if (targetPage) targetPage.classList.add('active');

    const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (targetNav) targetNav.classList.add('active');

    // 更新标题
    const titles = {
      dashboard: '数据看板',
      highway: '高速路口管理',
      bus: '公交管理',
      message: '城市消息管理',
      tag: '标签管理',
      weather: '天气管理'
    };
    document.getElementById('page-title').textContent = titles[page] || '';

    // 重新渲染
    if (page === 'dashboard') this.renderDashboard();
    if (page === 'highway') this.renderHighwayManage();
    if (page === 'message') this.renderMessageTable();
    if (page === 'tag') this.renderTagManage();
  },

  // 渲染数据看板
  renderDashboard() {
    const stats = window.CityPulseData.adminStats;
    document.getElementById('stat-messages').textContent = stats.totalMessages;
    document.getElementById('stat-tags').textContent = stats.totalTags;
    document.getElementById('stat-today').textContent = stats.todayVisits;
    document.getElementById('stat-total').textContent = stats.totalVisits;

    // 标签统计
    const tagStats = document.getElementById('tag-stats');
    const tags = window.CityPulseData.tags;
    tagStats.innerHTML = tags.map(t => {
      const count = stats.messageByTag[t.id] || 0;
      return `
        <div class="tag-stat-item">
          <span class="tag-stat-name">${t.icon} ${t.name}</span>
          <span class="tag-stat-num">${count}</span>
        </div>
      `;
    }).join('');

    // 最新消息
    const recentMsgs = document.getElementById('recent-messages');
    const messages = window.CityPulseData.messages.slice(0, 5);
    recentMsgs.innerHTML = messages.map(m => `
      <div class="recent-msg-item">
        <span class="recent-msg-title">${m.title}</span>
        <span class="recent-msg-time">${m.time}</span>
      </div>
    `).join('');
  },

  // 渲染高速管理
  renderHighwayManage() {
    const list = document.getElementById('highway-manage-list');
    const highways = window.CityPulseData.highways;
    list.innerHTML = highways.map(h => {
      const directionsHtml = h.directions.map((d, idx) => `
        <div class="direction-edit">
          <div class="form-group">
            <label>方向</label>
            <input type="text" value="${d.name}" id="hw-${h.id}-dir-${idx}-name">
          </div>
          <div class="form-group">
            <label>状态</label>
            <select id="hw-${h.id}-dir-${idx}-status">
              <option value="open" ${d.status === 'open' ? 'selected' : ''}>开放</option>
              <option value="limited" ${d.status === 'limited' ? 'selected' : ''}>限速</option>
              <option value="closed" ${d.status === 'closed' ? 'selected' : ''}>封闭</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input type="text" value="${d.note}" id="hw-${h.id}-dir-${idx}-note">
          </div>
        </div>
      `).join('');

      return `
        <div class="manage-card">
          <div class="manage-card-header">
            <span class="manage-card-title">${h.name}</span>
            <span class="manage-card-code">${h.code}</span>
          </div>
          <div class="form-group">
            <label>封闭原因（如有）</label>
            <input type="text" value="${h.reason}" id="hw-${h.id}-reason" placeholder="输入封闭原因">
          </div>
          ${directionsHtml}
          <button class="btn-primary" onclick="adminApp.saveHighway('${h.id}')">保存修改</button>
        </div>
      `;
    }).join('');
  },

  // 保存高速数据
  saveHighway(highwayId) {
    const h = window.CityPulseData.highways.find(hw => hw.id === highwayId);
    if (!h) return;

    h.reason = document.getElementById(`hw-${highwayId}-reason`).value;
    h.directions.forEach((d, idx) => {
      d.name = document.getElementById(`hw-${highwayId}-dir-${idx}-name`).value;
      d.status = document.getElementById(`hw-${highwayId}-dir-${idx}-status`).value;
      d.note = document.getElementById(`hw-${highwayId}-dir-${idx}-note`).value;
    });
    h.updateTime = new Date().toLocaleString('zh-CN');

    alert('保存成功！');
  },

  // 保存公交数据
  saveBus() {
    const bus = window.CityPulseData.bus;
    bus.currentStation = document.getElementById('bus-edit-current').value;
    bus.nextStation.name = document.getElementById('bus-edit-next').value;
    bus.nextStation.arrivalMinutes = parseInt(document.getElementById('bus-edit-arrival').value);
    bus.status = document.getElementById('bus-edit-status').value;
    bus.updateTime = new Date().toLocaleString('zh-CN');
    alert('保存成功！');
  },

  // 渲染消息表格
  renderMessageTable() {
    const tbody = document.getElementById('message-table-body');
    const messages = window.CityPulseData.messages;
    tbody.innerHTML = messages.map(m => {
      const tagsHtml = m.tags.map(tagId => {
        const tag = window.CityPulseUtils.getTagById(tagId);
        return tag ? `<span style="color:${tag.color};margin-right:6px;">${tag.icon}</span>` : '';
      }).join('');

      return `
        <div class="table-row">
          <span style="flex:2">${m.title}</span>
          <span style="flex:1">${tagsHtml}</span>
          <span style="flex:1">${m.time}</span>
          <span style="width:100px" class="table-actions">
            <button class="btn-delete" onclick="adminApp.deleteMessage('${m.id}')">删除</button>
          </span>
        </div>
      `;
    }).join('');
  },

  // 显示消息表单
  showMessageForm() {
    document.getElementById('message-modal').style.display = 'flex';
    this.renderTagCheckboxes();
  },

  // 隐藏消息表单
  hideMessageForm() {
    document.getElementById('message-modal').style.display = 'none';
    // 清空表单
    document.getElementById('msg-title').value = '';
    document.getElementById('msg-summary').value = '';
    document.getElementById('msg-content').value = '';
    document.getElementById('msg-source').value = '';
  },

  // 渲染标签复选框
  renderTagCheckboxes() {
    const container = document.getElementById('msg-tag-checkboxes');
    const tags = window.CityPulseData.tags;
    container.innerHTML = tags.map(t => `
      <label class="tag-checkbox">
        <input type="checkbox" value="${t.id}" name="msg-tags">
        <span>${t.icon} ${t.name}</span>
      </label>
    `).join('');
  },

  // 保存消息
  saveMessage() {
    const title = document.getElementById('msg-title').value;
    const summary = document.getElementById('msg-summary').value;
    const content = document.getElementById('msg-content').value;
    const source = document.getElementById('msg-source').value;

    if (!title || !summary) {
      alert('请填写标题和摘要');
      return;
    }

    const checkedTags = Array.from(document.querySelectorAll('input[name="msg-tags"]:checked')).map(cb => cb.value);

    const newMsg = {
      id: 'msg_' + Date.now(),
      title,
      summary,
      content: content || summary,
      time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
      tags: checkedTags.length > 0 ? checkedTags : ['news'],
      image: null,
      source: source || '管理员'
    };

    window.CityPulseData.messages.unshift(newMsg);
    window.CityPulseData.adminStats.totalMessages++;

    // 更新标签统计
    checkedTags.forEach(tagId => {
      window.CityPulseData.adminStats.messageByTag[tagId] = (window.CityPulseData.adminStats.messageByTag[tagId] || 0) + 1;
    });

    this.hideMessageForm();
    this.renderMessageTable();
    alert('发布成功！');
  },

  // 删除消息
  deleteMessage(msgId) {
    if (!confirm('确定删除这条消息吗？')) return;

    const idx = window.CityPulseData.messages.findIndex(m => m.id === msgId);
    if (idx > -1) {
      const msg = window.CityPulseData.messages[idx];
      msg.tags.forEach(tagId => {
        if (window.CityPulseData.adminStats.messageByTag[tagId]) {
          window.CityPulseData.adminStats.messageByTag[tagId]--;
        }
      });
      window.CityPulseData.messages.splice(idx, 1);
      window.CityPulseData.adminStats.totalMessages--;
      this.renderMessageTable();
    }
  },

  // 渲染标签管理
  renderTagManage() {
    const list = document.getElementById('tag-manage-list');
    const tags = window.CityPulseData.tags;
    list.innerHTML = tags.map(t => `
      <div class="tag-manage-item">
        <span class="tag-manage-icon">${t.icon}</span>
        <div class="tag-manage-info">
          <div class="tag-manage-name">${t.name}</div>
          <div class="tag-manage-id">${t.id}</div>
        </div>
        <div class="tag-manage-color" style="background:${t.color}"></div>
      </div>
    `).join('');
  },

  // 保存天气
  saveWeather() {
    const weather = window.CityPulseData.weather.current;
    weather.condition = document.getElementById('weather-condition').value;
    weather.temp = parseInt(document.getElementById('weather-temp').value);
    weather.high = parseInt(document.getElementById('weather-high').value);
    weather.low = parseInt(document.getElementById('weather-low').value);

    const alertText = document.getElementById('weather-alert').value;
    if (alertText) {
      window.CityPulseData.weather.alerts = [{
        id: 'alert_' + Date.now(),
        level: 'yellow',
        title: '天气预警',
        content: alertText,
        time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
        icon: '⚠️'
      }];
    } else {
      window.CityPulseData.weather.alerts = [];
    }

    alert('保存成功！');
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 管理端等登录后才初始化
});
