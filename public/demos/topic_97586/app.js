// ============================================================
// 星邻圈 Demo — 应用交互逻辑
// ============================================================

var App = {
  pageStack: [],
  currentTab: 'home',
  filterCommunity: 'all',

  // ---- 初始化 ----
  init: function () {
    this.bindTabBar();
    this.bindNavBack();
    this.bindModalClose();
    this.goTab('home');
  },

  // ---- Tab Bar ----
  bindTabBar: function () {
    var self = this;
    var tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var tabName = this.getAttribute('data-tab');
        self.goTab(tabName);
      });
    });
  },

  goTab: function (tabName) {
    this.currentTab = tabName;
    this.pageStack = [];

    // Update tab bar active state
    document.querySelectorAll('.tab-item').forEach(function (t) {
      t.classList.remove('active');
    });
    var activeTab = document.querySelector('.tab-item[data-tab="' + tabName + '"]');
    if (activeTab) activeTab.classList.add('active');

    // Reset nav bar
    document.getElementById('navBar').classList.remove('show-back');

    // Render page
    var titles = { home: '星邻圈', rent: '租房', secondhand: '二手闲置', help: '邻里互助', service: '家政服务', publish: '发布', message: '消息', profile: '我的' };
    document.getElementById('navTitle').textContent = titles[tabName] || '星邻圈';

    var renderer = this['render_' + tabName];
    if (renderer) {
      document.getElementById('pageContainer').innerHTML = renderer.call(this);
    }
  },

  // ---- Navigation ----
  bindNavBack: function () {
    var self = this;
    document.getElementById('navBack').addEventListener('click', function () {
      self.goBack();
    });
  },

  goBack: function () {
    if (this.pageStack.length > 0) {
      this.pageStack.pop();
      if (this.pageStack.length === 0) {
        this.goTab(this.currentTab);
      } else {
        var prev = this.pageStack[this.pageStack.length - 1];
        this.renderDetailPage(prev.type, prev.id);
      }
    } else {
      this.goTab(this.currentTab);
    }
  },

  pushPage: function (type, id) {
    this.pageStack.push({ type: type, id: id });
    this.renderDetailPage(type, id);
  },

  // ---- Home Page ----
  render_home: function () {
    var html = '';
    html += '<div class="home-header">';
    html += '  <div class="greeting">👋 你好，' + DB.currentUser.name + '</div>';
    html += '  <div class="community-name">' + DB.currentUser.community + '</div>';
    html += '</div>';

    html += '<div class="search-bar">';
    html += '  <span class="search-icon">🔍</span>';
    html += '  <input type="text" placeholder="搜索房源、闲置、服务..." readonly onclick="App.showToast(\'搜索功能 Demo 演示\')">';
    html += '</div>';

    html += '<div class="quick-nav">';
    html += '  <div class="qn-item" onclick="App.goTab(\'rent\')"><div class="qn-icon rent">🔑</div><span class="qn-label">租房</span></div>';
    html += '  <div class="qn-item" onclick="App.goTab(\'secondhand\')"><div class="qn-icon second">🛍️</div><span class="qn-label">二手</span></div>';
    html += '  <div class="qn-item" onclick="App.goTab(\'help\')"><div class="qn-icon help">🤝</div><span class="qn-label">互助</span></div>';
    html += '  <div class="qn-item" onclick="App.goTab(\'service\')"><div class="qn-icon service">✨</div><span class="qn-label">家政</span></div>';
    html += '</div>';

    html += '<div class="section-title"><h3>社区动态</h3><span class="more">查看全部 ›</span></div>';
    html += '<div class="feed-list">';
    DB.feed.forEach(function (item) {
      html += '<div class="feed-item" onclick="App.handleFeedClick(\'' + item.type + '\')">';
      html += '  <div class="feed-icon">' + item.icon + '</div>';
      html += '  <div class="feed-text">';
      html += '    <div class="feed-title">' + item.title + '</div>';
      html += '    <div class="feed-desc">' + item.text + '</div>';
      html += '  </div>';
      html += '  <div class="feed-time">' + item.time + '</div>';
      html += '</div>';
    });
    html += '</div>';

    return html;
  },

  handleFeedClick: function (type) {
    var tabMap = { house: 'rent', secondhand: 'secondhand', help: 'help', service: 'service' };
    if (tabMap[type]) {
      this.goTab(tabMap[type]);
    }
  },

  // ---- Rent Page ----
  render_rent: function () {
    return this.renderListPage('rent', DB.houses, DB.communities, this.renderHouseCard.bind(this));
  },

  renderHouseCard: function (house) {
    var html = '<div class="card house-card" onclick="App.pushPage(\'house\',\'' + house.id + '\')">';
    html += '  <div class="hc-top">';
    html += '    <div class="hc-layout">' + house.layout + '</div>';
    html += '    <div class="hc-price">' + house.price + '<small> 元/月</small></div>';
    html += '  </div>';
    html += '  <div class="hc-info"><span>' + house.area + '㎡</span><span>' + house.direction + '</span><span>' + house.floor + '</span></div>';
    html += '  <div class="hc-community">📍 ' + house.community + '</div>';
    html += '  <div class="hc-tags">';
    house.tags.forEach(function (tag) { html += '<span class="hc-tag">' + tag + '</span>'; });
    html += '  </div>';
    html += '</div>';
    return html;
  },

  // ---- Secondhand Page ----
  render_secondhand: function () {
    var self = this;
    return this.renderListPage('secondhand', DB.secondhand, DB.communities, function (item) {
      var icons = { '婴儿车': '👶', '小米': '📺', '宜家': '📚', 'Switch': '🎮' };
      var icon = '📦';
      for (var key in icons) { if (item.title.indexOf(key) >= 0) { icon = icons[key]; break; } }
      var html = '<div class="card sh-card" onclick="App.pushPage(\'secondhand\',\'' + item.id + '\')">';
      html += '  <div class="sc-top">';
      html += '    <div class="sc-thumb">' + icon + '</div>';
      html += '    <div class="sc-info">';
      html += '      <div class="sc-title">' + item.title + '</div>';
      html += '      <div class="sc-desc">' + item.desc + '</div>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="sc-bottom">';
      html += '    <div class="sc-price">¥' + item.price + '</div>';
      html += '    <div class="sc-seller">' + item.avatar + ' ' + item.seller + ' · ' + item.community + '</div>';
      html += '  </div>';
      html += '</div>';
      return html;
    });
  },

  // ---- Help Page ----
  render_help: function () {
    return this.renderListPage('help', DB.helps, DB.communities, this.renderHelpCard.bind(this));
  },

  renderHelpCard: function (help) {
    var statusClass = help.status === '待响应' ? 'waiting' : (help.status === '进行中' ? 'active' : 'done');
    var html = '<div class="card help-card" onclick="App.pushPage(\'help\',\'' + help.id + '\')">';
    html += '  <div class="mc-top">';
    html += '    <div class="mc-avatar">' + help.avatar + '</div>';
    html += '    <div><div class="mc-user">' + help.requester + '</div><div class="mc-time">' + help.time + '</div></div>';
    html += '  </div>';
    html += '  <div class="mc-title">' + help.title + '</div>';
    html += '  <div class="mc-desc">' + help.desc + '</div>';
    html += '  <div class="mc-bottom">';
    html += '    <span class="mc-reward">' + help.reward + '</span>';
    html += '    <span class="mc-status ' + statusClass + '">' + help.status + '</span>';
    html += '  </div>';
    html += '</div>';
    return html;
  },

  // ---- Service Page ----
  render_service: function () {
    return this.renderListPage('service', DB.services, ['全部服务', '日常保洁', '维修', '月嫂/育婴', '洗衣/熨烫'], this.renderServiceCard.bind(this), 'service');
  },

  renderServiceCard: function (sv) {
    var stars = '';
    for (var i = 0; i < 5; i++) { stars += i < Math.round(sv.rating) ? '★' : '☆'; }
    var html = '<div class="card sv-card" onclick="App.pushPage(\'service\',\'' + sv.id + '\')">';
    html += '  <div class="svc-top">';
    html += '    <div><span class="svc-name">' + sv.name + '</span>' + (sv.certified ? '<span class="svc-cert">✓ 认证</span>' : '') + '</div>';
    html += '    <div class="svc-rating"><span class="svc-stars">' + stars + '</span><span class="svc-rating-num">' + sv.rating + '</span></div>';
    html += '  </div>';
    html += '  <div class="svc-type">' + sv.type + ' · 📍 ' + sv.community + '</div>';
    html += '  <div class="svc-desc">' + sv.desc + '</div>';
    html += '  <div class="svc-bottom">';
    html += '    <span class="svc-price">' + sv.price + '</span>';
    html += '    <span class="svc-orders">' + sv.orders + ' 单</span>';
    html += '  </div>';
    html += '</div>';
    return html;
  },

  // ---- Generic List Page Renderer ----
  renderListPage: function (type, data, filters, cardRenderer, filterMode) {
    var self = this;
    var html = '';

    // Filter bar
    html += '<div class="filter-bar" id="filterBar_' + type + '">';
    var filterData = filterMode === 'service' ? filters : ['全部小区'].concat(DB.communities);
    filterData.forEach(function (f, i) {
      var active = i === 0 ? ' active' : '';
      html += '<span class="filter-chip' + active + '" data-filter="' + f + '" data-type="' + type + '">' + f + '</span>';
    });
    html += '</div>';

    // List
    html += '<div class="list-page" id="listPage_' + type + '">';
    data.forEach(function (item) {
      html += cardRenderer(item);
    });
    html += '</div>';

    // Bind filter events after render
    setTimeout(function () {
      var chips = document.querySelectorAll('#filterBar_' + type + ' .filter-chip');
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) { c.classList.remove('active'); });
          this.classList.add('active');
          var filterVal = this.getAttribute('data-filter');
          self.applyFilter(type, filterVal, data, cardRenderer, filterMode);
        });
      });
    }, 0);

    return html;
  },

  applyFilter: function (type, filterVal, data, cardRenderer, filterMode) {
    var listContainer = document.getElementById('listPage_' + type);
    var filtered;
    if (filterMode === 'service') {
      filtered = filterVal === '全部服务' ? data : data.filter(function (d) { return d.type === filterVal; });
    } else {
      filtered = filterVal === '全部小区' ? data : data.filter(function (d) { return d.community === filterVal; });
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><div class="es-text">该筛选条件下暂无内容</div></div>';
    } else {
      var html = '';
      filtered.forEach(function (item) { html += cardRenderer(item); });
      listContainer.innerHTML = html;
    }
  },

  // ---- Detail Pages ----
  renderDetailPage: function (type, id) {
    document.getElementById('navBar').classList.add('show-back');
    var container = document.getElementById('pageContainer');

    if (type === 'house') {
      var house = DB.houses.find(function (h) { return h.id === id; });
      if (house) container.innerHTML = this.renderHouseDetail(house);
    } else if (type === 'secondhand') {
      var item = DB.secondhand.find(function (s) { return s.id === id; });
      if (item) container.innerHTML = this.renderSecondhandDetail(item);
    } else if (type === 'help') {
      var help = DB.helps.find(function (m) { return m.id === id; });
      if (help) container.innerHTML = this.renderHelpDetail(help);
    } else if (type === 'service') {
      var sv = DB.services.find(function (s) { return s.id === id; });
      if (sv) container.innerHTML = this.renderServiceDetail(sv);
    }
  },

  renderHouseDetail: function (house) {
    var html = '<div class="detail-page">';
    html += '<div class="detail-hero rent">🏠</div>';
    html += '<div class="detail-body">';
    html += '  <h2>' + house.layout + ' · ' + house.area + '㎡</h2>';
    html += '  <div class="detail-price">' + house.price + ' <small>元/月</small></div>';
    html += '  <div class="detail-meta">';
    html += '    <span class="meta-tag">📍 ' + house.community + '</span>';
    html += '    <span class="meta-tag">🧭 ' + house.direction + '</span>';
    html += '    <span class="meta-tag">🏢 ' + house.floor + '</span>';
    html += '    <span class="meta-tag">🎨 ' + house.decoration + '</span>';
    house.tags.forEach(function (t) { html += '    <span class="meta-tag">🏷️ ' + t + '</span>'; });
    html += '  </div>';
    html += '  <div class="detail-desc">' + house.desc + '</div>';
    html += '  <div class="detail-section-label">📞 联系房东</div>';
    html += '  <div class="modal-info"><div class="modal-info-row"><span class="label">联系人</span><span class="value">' + house.contact + '</span></div>';
    html += '  <div class="modal-info-row"><span class="label">电话</span><span class="value">' + house.phone + '</span></div></div>';
    html += '</div>';

    // Action bar
    html += '<div class="action-bar">';
    html += '  <div class="ab-info"><div class="ab-label">月租</div><div class="ab-value">¥' + house.price + '</div></div>';
    html += '  <button class="ab-btn" onclick="App.contactLandlord(\'' + house.id + '\')">联系房东</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  renderSecondhandDetail: function (item) {
    var icons = { '婴儿车': '👶', '小米': '📺', '宜家': '📚', 'Switch': '🎮' };
    var icon = '📦';
    for (var key in icons) { if (item.title.indexOf(key) >= 0) { icon = icons[key]; break; } }

    var html = '<div class="detail-page">';
    html += '<div class="detail-hero second">' + icon + '</div>';
    html += '<div class="detail-body" style="padding-bottom:70px">';
    html += '  <h2>' + item.title + '</h2>';
    html += '  <div class="detail-price">¥' + item.price + '</div>';
    html += '  <div class="detail-meta">';
    html += '    <span class="meta-tag">' + item.avatar + ' ' + item.seller + '</span>';
    html += '    <span class="meta-tag">📍 ' + item.community + '</span>';
    html += '    <span class="meta-tag">🕐 ' + item.time + '</span>';
    html += '  </div>';
    html += '  <div class="detail-desc">' + item.desc + '</div>';
    html += '  <div class="detail-section-label">💬 邻居评论 (' + item.comments.length + ')</div>';
    html += '  <div id="commentList">';
    if (item.comments.length === 0) {
      html += '<div class="empty-state" style="padding:20px"><div class="es-text">暂无评论，快来第一个询价吧</div></div>';
    } else {
      item.comments.forEach(function (c) {
        html += '<div class="comment-item"><div class="comment-avatar">🧑</div><div class="comment-body">';
        html += '<div class="comment-user">' + c.user + '</div><div class="comment-text">' + c.text + '</div><div class="comment-time">' + c.time + '</div>';
        html += '</div></div>';
      });
    }
    html += '  </div>';
    html += '</div>';

    // Comment input bar
    html += '<div class="comment-input-bar">';
    html += '  <input type="text" id="commentInput" placeholder="说点什么...">';
    html += '  <button onclick="App.addComment(\'' + item.id + '\')">发送</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  renderHelpDetail: function (help) {
    var statusClass = help.status === '待响应' ? 'waiting' : (help.status === '进行中' ? 'active' : 'done');
    var html = '<div class="detail-page">';
    html += '<div class="detail-hero help">🤝</div>';
    html += '<div class="detail-body" style="padding-bottom:70px">';
    html += '  <h2>' + help.title + '</h2>';
    html += '  <div class="detail-meta">';
    html += '    <span class="meta-tag">' + help.avatar + ' ' + help.requester + '</span>';
    html += '    <span class="meta-tag">📍 ' + help.community + '</span>';
    html += '    <span class="meta-tag">🕐 ' + help.time + '</span>';
    html += '    <span class="meta-tag mc-status ' + statusClass + '">' + help.status + '</span>';
    html += '  </div>';
    html += '  <div class="detail-desc">' + help.desc + '</div>';
    html += '  <div class="detail-section-label">🎁 报酬</div>';
    html += '  <div class="detail-desc" style="color:var(--accent2);font-weight:600">' + help.reward + '</div>';
    html += '</div>';

    // Action bar
    var btnText = help.status === '已完成' ? '已完成' : (help.status === '进行中' ? '进行中' : '我来帮忙');
    var btnClass = help.status === '待响应' ? 'green' : '';
    var btnDisabled = help.status !== '待响应';
    html += '<div class="action-bar">';
    html += '  <div class="ab-info"><div class="ab-label">报酬</div><div class="ab-value">' + help.reward + '</div></div>';
    html += '  <button class="ab-btn ' + btnClass + '"' + (btnDisabled ? ' disabled style="opacity:0.5"' : '') + ' onclick="App.respondHelp(\'' + help.id + '\')">' + btnText + '</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  renderServiceDetail: function (sv) {
    var stars = '';
    for (var i = 0; i < 5; i++) { stars += i < Math.round(sv.rating) ? '★' : '☆'; }

    var html = '<div class="detail-page">';
    html += '<div class="detail-hero service">✨</div>';
    html += '<div class="detail-body" style="padding-bottom:70px">';
    html += '  <h2>' + sv.name + (sv.certified ? ' <span class="svc-cert">✓ 认证</span>' : '') + '</h2>';
    html += '  <div class="detail-meta">';
    html += '    <span class="meta-tag">' + sv.type + '</span>';
    html += '    <span class="meta-tag">📍 ' + sv.community + '</span>';
    html += '    <span class="meta-tag">' + sv.orders + ' 单</span>';
    html += '  </div>';
    html += '  <div class="detail-desc">' + sv.desc + '</div>';
    html += '  <div class="detail-section-label">⭐ 用户评价 (' + sv.reviews.length + ')</div>';
    html += '  <div id="reviewList">';
    sv.reviews.forEach(function (r) {
      var rStars = '';
      for (var i = 0; i < 5; i++) { rStars += i < r.rating ? '★' : '☆'; }
      html += '<div class="review-item">';
      html += '  <div class="ri-top"><span class="ri-user">' + r.user + '</span><span class="ri-stars">' + rStars + '</span></div>';
      html += '  <div class="ri-text">' + r.text + '</div>';
      html += '  <div class="ri-time">' + r.time + '</div>';
      html += '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // Action bar
    html += '<div class="action-bar">';
    html += '  <div class="ab-info"><div class="ab-label">价格</div><div class="ab-value">' + sv.price + '</div></div>';
    html += '  <button class="ab-btn amber" onclick="App.orderService(\'' + sv.id + '\')">立即下单</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  // ---- Interactions ----
  contactLandlord: function (houseId) {
    var house = DB.houses.find(function (h) { return h.id === houseId; });
    if (!house) return;
    this.showModal({
      title: '联系房东',
      info: [
        { label: '联系人', value: house.contact },
        { label: '电话', value: house.phone },
        { label: '房源', value: house.community + ' ' + house.layout },
        { label: '月租', value: '¥' + house.price + '/月' }
      ],
      btnText: '拨打电话',
      btnAction: function () { App.showToast('📞 正在拨打 ' + house.phone + '...'); App.closeModal(); }
    });
  },

  addComment: function (itemId) {
    var input = document.getElementById('commentInput');
    var text = input.value.trim();
    if (!text) { this.showToast('请输入评论内容'); return; }

    var item = DB.secondhand.find(function (s) { return s.id === itemId; });
    if (item) {
      item.comments.push({ user: DB.currentUser.name, text: text, time: '刚刚' });
      this.showToast('评论成功！');
      // Re-render detail
      this.renderDetailPage('secondhand', itemId);
    }
  },

  respondHelp: function (helpId) {
    var help = DB.helps.find(function (m) { return m.id === helpId; });
    if (!help || help.status !== '待响应') return;

    var self = this;
    this.showModal({
      title: '确认帮忙',
      info: [
        { label: '求助', value: help.title },
        { label: '小区', value: help.community },
        { label: '报酬', value: help.reward }
      ],
      btnText: '确认响应',
      btnAction: function () {
        help.status = '进行中';
        App.showToast('🤝 已响应！请私信联系邻居');
        App.closeModal();
        self.renderDetailPage('help', helpId);
      }
    });
  },

  orderService: function (svId) {
    var sv = DB.services.find(function (s) { return s.id === svId; });
    if (!sv) return;

    var self = this;
    this.showModal({
      title: '预约服务',
      info: [
        { label: '服务商', value: sv.name },
        { label: '类型', value: sv.type },
        { label: '价格', value: sv.price },
        { label: '联系电话', value: '客服 400-***-' + sv.id.toUpperCase() }
      ],
      btnText: '确认下单',
      btnAction: function () {
        App.showToast('✅ 下单成功！客服将尽快联系您');
        App.closeModal();
      }
    });
  },

  // ---- Publish Page ----
  render_publish: function () {
    var html = '<div class="publish-page">';
    html += '<div class="form-label" style="padding:0 16px;margin-bottom:12px">选择发布类型</div>';
    html += '<div class="publish-type-grid">';
    html += '  <div class="pub-type-card" onclick="App.showPublishForm(\'secondhand\')"><div class="ptc-icon">🛍️</div><div class="ptc-name">发布闲置</div><div class="ptc-desc">转让二手物品</div></div>';
    html += '  <div class="pub-type-card" onclick="App.showPublishForm(\'help\')"><div class="ptc-icon">🤝</div><div class="ptc-name">发布求助</div><div class="ptc-desc">邻里互帮互助</div></div>';
    html += '</div>';
    html += '<div class="empty-state" style="padding:30px"><div class="es-text">选择类型开始发布</div></div>';
    html += '</div>';
    return html;
  },

  showPublishForm: function (type) {
    var container = document.getElementById('pageContainer');
    if (type === 'secondhand') {
      container.innerHTML = this.renderPublishSecondhand();
    } else if (type === 'help') {
      container.innerHTML = this.renderPublishHelp();
    }
    document.getElementById('navTitle').textContent = type === 'secondhand' ? '发布闲置' : '发布求助';
  },

  renderPublishSecondhand: function () {
    var html = '<div class="publish-page">';
    html += '<div class="form-group"><label class="form-label">物品标题</label><input class="form-input" id="pub_sh_title" type="text" placeholder="如：九成新婴儿车"></div>';
    html += '<div class="form-group"><label class="form-label">价格（元）</label><input class="form-input" id="pub_sh_price" type="number" placeholder="如：200"></div>';
    html += '<div class="form-group"><label class="form-label">所在小区</label><select class="form-select" id="pub_sh_community">';
    DB.communities.forEach(function (c) { html += '<option value="' + c + '">' + c + '</option>'; });
    html += '</select></div>';
    html += '<div class="form-group"><label class="form-label">详细描述</label><textarea class="form-textarea" id="pub_sh_desc" placeholder="描述物品成色、使用情况等..."></textarea></div>';
    html += '<button class="form-submit" onclick="App.submitSecondhand()">确认发布</button>';
    html += '</div>';
    return html;
  },

  renderPublishHelp: function () {
    var html = '<div class="publish-page">';
    html += '<div class="form-group"><label class="form-label">求助标题</label><input class="form-input" id="pub_help_title" type="text" placeholder="如：帮忙代取快递"></div>';
    html += '<div class="form-group"><label class="form-label">所在小区</label><select class="form-select" id="pub_help_community">';
    DB.communities.forEach(function (c) { html += '<option value="' + c + '">' + c + '</option>'; });
    html += '</select></div>';
    html += '<div class="form-group"><label class="form-label">报酬</label><input class="form-input" id="pub_help_reward" type="text" placeholder="如：一杯奶茶"></div>';
    html += '<div class="form-group"><label class="form-label">详细描述</label><textarea class="form-textarea" id="pub_help_desc" placeholder="描述你的需求..."></textarea></div>';
    html += '<button class="form-submit" onclick="App.submitHelp()">确认发布</button>';
    html += '</div>';
    return html;
  },

  submitSecondhand: function () {
    var title = document.getElementById('pub_sh_title').value.trim();
    var price = document.getElementById('pub_sh_price').value.trim();
    var community = document.getElementById('pub_sh_community').value;
    var desc = document.getElementById('pub_sh_desc').value.trim();

    if (!title) { this.showToast('请输入物品标题'); return; }
    if (!price) { this.showToast('请输入价格'); return; }
    if (!desc) { this.showToast('请输入描述'); return; }

    var newItem = {
      id: 's' + (DB.secondhand.length + 1),
      title: title,
      price: parseInt(price),
      community: community,
      seller: DB.currentUser.name,
      avatar: '🙋',
      time: '刚刚',
      desc: desc,
      comments: []
    };
    DB.secondhand.unshift(newItem);
    this.showToast('✅ 发布成功！');
    var self = this;
    setTimeout(function () { self.goTab('secondhand'); }, 500);
  },

  submitHelp: function () {
    var title = document.getElementById('pub_help_title').value.trim();
    var community = document.getElementById('pub_help_community').value;
    var reward = document.getElementById('pub_help_reward').value.trim();
    var desc = document.getElementById('pub_help_desc').value.trim();

    if (!title) { this.showToast('请输入求助标题'); return; }
    if (!reward) { this.showToast('请输入报酬'); return; }
    if (!desc) { this.showToast('请输入描述'); return; }

    var newHelp = {
      id: 'm' + (DB.helps.length + 1),
      title: title,
      community: community,
      requester: DB.currentUser.name,
      avatar: '🙋',
      time: '刚刚',
      reward: reward,
      status: '待响应',
      desc: desc
    };
    DB.helps.unshift(newHelp);
    this.showToast('✅ 发布成功！');
    var self = this;
    setTimeout(function () { self.goTab('help'); }, 500);
  },

  // ---- Message Page ----
  render_message: function () {
    var html = '<div class="list-page" style="padding-top:16px">';
    var messages = [
      { icon: '🏠', name: '王房东', text: '您好，房子还在的，可以明天来看房', time: '10:30' },
      { icon: '🛍️', name: '宝妈小林', text: '婴儿车还在的，您出多少？', time: '昨天' },
      { icon: '🤝', name: '新邻居老周', text: '太感谢了！明天搬沙发', time: '昨天' },
      { icon: '✨', name: '张姐保洁', text: '好的，明天上午 9 点准时到', time: '前天' },
      { icon: '📢', name: '社区公告', text: '星湖花园 3 期 7 月停水通知', time: '3 天前' }
    ];
    messages.forEach(function (m) {
      html += '<div class="feed-item" onclick="App.showToast(\'打开聊天\')">';
      html += '  <div class="feed-icon">' + m.icon + '</div>';
      html += '  <div class="feed-text"><div class="feed-title">' + m.name + '</div><div class="feed-desc">' + m.text + '</div></div>';
      html += '  <div class="feed-time">' + m.time + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },

  // ---- Profile Page ----
  render_profile: function () {
    var u = DB.currentUser;
    var html = '<div class="profile-header">';
    html += '  <div class="profile-avatar">' + u.avatar + '</div>';
    html += '  <div><div class="profile-name">' + u.name + '</div><div class="profile-community">📍 ' + u.community + '</div></div>';
    html += '</div>';

    html += '<div class="profile-stats">';
    html += '  <div class="ps-item"><div class="ps-num">3</div><div class="ps-label">我的发布</div></div>';
    html += '  <div class="ps-item"><div class="ps-num">5</div><div class="ps-label">我的收藏</div></div>';
    html += '  <div class="ps-item"><div class="ps-num">8</div><div class="ps-label">互助次数</div></div>';
    html += '</div>';

    html += '<div class="profile-menu">';
    var menus = [
      { icon: '📋', name: '我的发布', action: 'App.showToast(\'我的发布\')' },
      { icon: '⭐', name: '我的收藏', action: 'App.showToast(\'我的收藏\')' },
      { icon: '🏠', name: '切换小区', action: 'App.showToast(\'当前小区：' + u.community + '\')' },
      { icon: '📞', name: '联系客服', action: 'App.showToast(\'客服热线：400-***-8888\')' },
      { icon: '⚙️', name: '设置', action: 'App.showToast(\'设置\')' },
      { icon: 'ℹ️', name: '关于星邻圈', action: 'App.showAbout()' }
    ];
    menus.forEach(function (m) {
      html += '<div class="pm-item" onclick="' + m.action + '"><span class="pm-icon">' + m.icon + '</span><span>' + m.name + '</span><span class="pm-arrow">›</span></div>';
    });
    html += '</div>';

    return html;
  },

  showAbout: function () {
    this.showModal({
      title: '关于星邻圈',
      info: [
        { label: '产品名称', value: '星邻圈' },
        { label: '产品形态', value: '微信小程序' },
        { label: 'Slogan', value: '找到你的邻居，便捷星湖生活' },
        { label: '覆盖小区', value: '7 个小区' },
        { label: '核心功能', value: '租房 / 二手 / 互助 / 家政' }
      ],
      btnText: '知道了',
      btnAction: function () { App.closeModal(); }
    });
  },

  // ---- Modal System ----
  showModal: function (config) {
    var overlay = document.getElementById('modalOverlay');
    var content = document.getElementById('modalContent');
    var html = '<div class="modal-title">' + config.title + '</div>';
    if (config.info) {
      html += '<div class="modal-info">';
      config.info.forEach(function (row) {
        html += '<div class="modal-info-row"><span class="label">' + row.label + '</span><span class="value">' + row.value + '</span></div>';
      });
      html += '</div>';
    }
    html += '<button class="modal-btn" id="modalBtn">' + config.btnText + '</button>';
    html += '<div class="modal-close" onclick="App.closeModal()">取消</div>';
    content.innerHTML = html;
    overlay.classList.add('show');

    document.getElementById('modalBtn').addEventListener('click', config.btnAction);
  },

  bindModalClose: function () {
    var self = this;
    document.getElementById('modalOverlay').addEventListener('click', function (e) {
      if (e.target === this) self.closeModal();
    });
  },

  closeModal: function () {
    document.getElementById('modalOverlay').classList.remove('show');
  },

  // ---- Toast ----
  showToast: function (msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
