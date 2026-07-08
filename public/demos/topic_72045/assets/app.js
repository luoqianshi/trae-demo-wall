// schoolbus-demo - Interactive page switcher and info panel
(function() {
  var pageData = {
    login: {
      title: '登录页',
      desc: '支持三种登录方式：手机号/密码登录、手机号/验证码登录（Mock 短信服务）和微信扫码登录（Mock）。顶部 Tab 切换登录方式，底部提供测试账号提示。',
      features: [
        { icon: '&#128241;', text: '手机号 + 密码 / 验证码双模式' },
        { icon: '&#128172;', text: '微信扫码登录（Mock 实现）' },
        { icon: '&#128274;', text: '密码哈希存储（bcrypt/scrypt）' },
        { icon: '&#9201;', text: 'Token 持久化与自动续期' }
      ]
    },
    routes: {
      title: '线路列表页',
      desc: '展示所有可用校园出行线路，支持按出发日期和目的地筛选。每条线路卡片展示起终点、时间、票价、余票和车型信息，点击即可进入订票流程。',
      features: [
        { icon: '&#128197;', text: '按日期 / 目的地智能筛选' },
        { icon: '&#128663;', text: '线路卡片展示起终点与时刻' },
        { icon: '&#127919;', text: '余票实时显示，售罄自动标记' },
        { icon: '&#128204;', text: '长途 / 短途标签区分' }
      ]
    },
    booking: {
      title: '订票页',
      desc: '选择线路后进入订票流程。顶部展示线路详情（起终点、时间、票价），中部显示常用乘车人列表供勾选，支持添加新乘车人。每车次最多选 3 人，底部显示合计金额。',
      features: [
        { icon: '&#128100;', text: '常用乘车人一键勾选' },
        { icon: '&#128196;', text: '身份证号 + 手机号 + 性别必填' },
        { icon: '&#9989;', text: '身份证校验系统（Mock 实现）' },
        { icon: '&#128176;', text: '实时计算票价，底部确认订票' }
      ]
    },
    orders: {
      title: '订单列表页',
      desc: '按状态分类展示所有订单（全部 / 待支付 / 已支付 / 已完成 / 已取消）。待支付订单可直接支付，已支付订单可查看详情或退票。TabBar 快捷切换。',
      features: [
        { icon: '&#128203;', text: '全部 / 待支付 / 已支付 / 已完成 / 已取消' },
        { icon: '&#128179;', text: '待支付订单一键支付' },
        { icon: '&#11088;', text: '状态标签颜色区分' },
        { icon: '&#128336;', text: '订单超时自动检查（30分钟）' }
      ]
    },
    'order-detail': {
      title: '订单详情页',
      desc: '展示订单完整信息：状态、行程（起终点 + 时间）、乘车人详情、费用明细。已支付订单支持部分退票，可选择部分或全部乘客退票，退票规则根据发车时间计算手续费。',
      features: [
        { icon: '&#128205;', text: '行程信息 + 乘客座位号' },
        { icon: '&#128176;', text: '费用明细与实付金额' },
        { icon: '&#128260;', text: '发车前 2 小时免费退票' },
        { icon: '&#9989;', text: '支持部分乘客退票' }
      ]
    },
    profile: {
      title: '个人中心页',
      desc: '展示用户头像、昵称和手机号，提供常用乘车人管理、意见反馈和关于我们入口。统计面板展示订单概况（全部 / 待支付 / 已支付 / 已完成），支持退出登录。',
      features: [
        { icon: '&#128100;', text: '用户信息展示与退出登录' },
        { icon: '&#128101;', text: '常用乘车人管理（增删改）' },
        { icon: '&#128202;', text: '订单统计面板' },
        { icon: '&#128172;', text: '意见反馈与关于我们' }
      ]
    }
  };

  var currentPage = 'login';
  var phoneScreen = document.getElementById('phoneScreen');
  var pageInfo = document.getElementById('pageInfo');
  var pageNav = document.getElementById('pageNav');

  function renderPageInfo(pageKey) {
    var data = pageData[pageKey];
    if (!data) return;

    var html = '<h3>' + data.title + '</h3>';
    html += '<p class="page-desc">' + data.desc + '</p>';
    html += '<ul class="feature-list">';
    data.features.forEach(function(f) {
      html += '<li><span class="feature-icon">' + f.icon + '</span><span>' + f.text + '</span></li>';
    });
    html += '</ul>';
    pageInfo.innerHTML = html;
  }

  function switchPage(pageKey) {
    if (pageKey === currentPage) return;

    // Fade out current image
    phoneScreen.classList.add('fade-out');

    setTimeout(function() {
      phoneScreen.src = 'assets/' + pageKey + '-screen.jpg';
      phoneScreen.alt = pageData[pageKey].title;
      phoneScreen.onload = function() {
        phoneScreen.classList.remove('fade-out');
      };
    }, 200);

    // Update nav buttons
    var btns = pageNav.querySelectorAll('.page-nav-btn');
    btns.forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-page') === pageKey);
    });

    // Update info panel
    renderPageInfo(pageKey);
    currentPage = pageKey;
  }

  // Nav button click handlers
  pageNav.querySelectorAll('.page-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchPage(this.getAttribute('data-page'));
    });
  });

  // Screenshot card click handlers
  document.querySelectorAll('.screenshot-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var page = this.getAttribute('data-page');
      switchPage(page);
      // Scroll to phone showcase
      document.querySelector('.demo-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Initial render
  renderPageInfo('login');
})();
