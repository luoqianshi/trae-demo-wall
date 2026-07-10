(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var state = {
    activeFilter: 'all',
    activeBook: 0,
    bookSearch: '',
    chartType: 'bar',
    typeChartType: 'bar',
    isLoggedIn: true,
    currentUser: '你',
    currentRole: 'admin',
    editingEntryIndex: null,
    editingBookIndex: null,
    currentReceiptData: null,
    books: [
      {
        name: '暖冬衣物募集账本', desc: '为社区困难家庭募集冬衣和保暖物资，目标募集20000元', goal: 20000, created: '2026-06-15T09:00', creator: '林青', audit: [],
        income: 19100, expense: 9050, count: 14,
        rows: [
          {type:'income',title:'企业公益配捐',amount:5000,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T10:00'},
          {type:'income',title:'爱心人士定向捐赠',amount:1200,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-01T14:30'},
          {type:'expense',title:'采购保暖手套120双',amount:2460,user:'陈敏',creator:'陈敏',category:'采购',receipt:'assets/receipts/receipt_book1.jpg',date:'2026-07-02T09:00'},
          {type:'income',title:'社区居民爱心捐款',amount:800,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-02T16:00'},
          {type:'expense',title:'仓储与打包材料',amount:680,user:'林青',creator:'林青',category:'物流',date:'2026-07-03T11:00'},
          {type:'income',title:'企业第二批配捐',amount:3000,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-03T15:00'},
          {type:'expense',title:'采购棉衣50件',amount:4200,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-04T10:30'},
          {type:'income',title:'线上众筹筹款',amount:2600,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-04T18:00'},
          {type:'expense',title:'运输至山区物流费',amount:950,user:'陈敏',creator:'陈敏',category:'物流',date:'2026-07-05T09:00'},
          {type:'income',title:'爱心企业年终捐赠',amount:4500,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-05T14:00'},
          {type:'expense',title:'志愿者餐食补贴',amount:320,user:'林青',creator:'林青',category:'餐食',date:'2026-07-06T12:00'},
          {type:'expense',title:'宣传横幅及物料',amount:180,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-06T16:30'},
          {type:'income',title:'社区基金会拨款',amount:2000,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-07T10:00'},
          {type:'expense',title:'收尾清洁与整理',amount:260,user:'林青',creator:'林青',category:'其他',date:'2026-07-07T15:00'}
        ]
      },
      {
        name: '社区图书角计划', desc: '记录图书捐赠、书架采购和社区阅读活动支出', goal: 15000, created: '2026-06-18T14:00', creator: '你', audit: [],
        income: 12150, expense: 4240, count: 14,
        rows: [
          {type:'income',title:'居民捐赠图书折价',amount:3800,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T09:30'},
          {type:'expense',title:'采购二手书架3组',amount:1560,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-01T16:00'},
          {type:'income',title:'社区基金支持',amount:3000,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-02T11:00'},
          {type:'expense',title:'采购儿童绘本100册',amount:1200,user:'林青',creator:'林青',category:'采购',receipt:'assets/receipts/receipt_book2.jpg',date:'2026-07-02T15:00'},
          {type:'expense',title:'活动日志愿者餐食',amount:280,user:'陈敏',creator:'陈敏',category:'餐食',date:'2026-07-03T12:30'},
          {type:'income',title:'线上二手书义卖',amount:650,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-03T18:00'},
          {type:'expense',title:'书架安装人工费',amount:400,user:'林青',creator:'林青',category:'采购',date:'2026-07-04T10:00'},
          {type:'income',title:'家长群定向捐款',amount:1200,user:'陈敏',creator:'陈敏',category:'捐赠',date:'2026-07-04T20:00'},
          {type:'expense',title:'阅读活动宣传物料',amount:180,user:'周洋',creator:'周洋',category:'采购',date:'2026-07-05T14:00'},
          {type:'income',title:'学校图书馆赠书',amount:2000,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-05T16:00'},
          {type:'expense',title:'借阅登记系统',amount:150,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-06T11:00'},
          {type:'expense',title:'活动日零食水果',amount:120,user:'周洋',creator:'周洋',category:'餐食',date:'2026-07-06T15:30'},
          {type:'income',title:'公益组织图书捐赠',amount:1500,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-07T09:00'},
          {type:'expense',title:'图书角装饰布置',amount:350,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-07T17:00'}
        ]
      },
      {
        name: '山区助学基金账本', desc: '资助山区困难学生，用于学费、文具和生活补贴', goal: 25000, created: '2026-06-10T08:30', creator: '林青', audit: [],
        income: 21000, expense: 12020, count: 14,
        rows: [
          {type:'income',title:'企业定向助学捐赠',amount:6000,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T09:00'},
          {type:'income',title:'个人月捐计划',amount:1500,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-01T14:00'},
          {type:'expense',title:'采购文具套装50套',amount:1800,user:'陈敏',creator:'陈敏',category:'采购',receipt:'assets/receipts/receipt_book3.jpg',date:'2026-07-02T10:00'},
          {type:'income',title:'校友会爱心筹款',amount:2200,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-02T16:30'},
          {type:'expense',title:'采购书包及背包',amount:1200,user:'周洋',creator:'周洋',category:'采购',date:'2026-07-03T11:00'},
          {type:'income',title:'网络众筹平台拨款',amount:3500,user:'陈敏',creator:'陈敏',category:'捐赠',date:'2026-07-03T15:00'},
          {type:'expense',title:'助学金发放第一批',amount:4000,user:'林青',creator:'林青',category:'其他',date:'2026-07-04T09:00'},
          {type:'income',title:'爱心家长定向捐赠',amount:800,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-04T18:00'},
          {type:'expense',title:'采购课本及辅导书',amount:950,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-05T10:30'},
          {type:'income',title:'教育机构合作捐赠',amount:2500,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-05T14:00'},
          {type:'expense',title:'物资运输至山区',amount:650,user:'周洋',creator:'周洋',category:'物流',date:'2026-07-06T09:00'},
          {type:'expense',title:'志愿者差旅补贴',amount:420,user:'陈敏',creator:'陈敏',category:'餐食',date:'2026-07-06T16:00'},
          {type:'income',title:'年终爱心企业汇总捐',amount:4500,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-07T10:00'},
          {type:'expense',title:'第二批助学金发放',amount:3000,user:'周洋',creator:'周洋',category:'其他',date:'2026-07-07T15:00'}
        ]
      },
      {
        name: '流浪动物救助站', desc: '救助流浪猫狗，用于宠物粮、疫苗和医疗费用', goal: 15000, created: '2026-06-05T10:00', creator: '你', audit: [],
        income: 12800, expense: 6000, count: 14,
        rows: [
          {type:'income',title:'爱心众筹平台筹款',amount:2800,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T09:00'},
          {type:'expense',title:'采购猫粮20袋',amount:1200,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-01T15:00'},
          {type:'income',title:'宠物医院物资捐赠',amount:1500,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-02T11:00'},
          {type:'expense',title:'流浪猫疫苗接种',amount:800,user:'林青',creator:'林青',category:'采购',receipt:'assets/receipts/receipt_book4.jpg',date:'2026-07-02T16:00'},
          {type:'expense',title:'流浪犬医疗手术',amount:1500,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-03T10:30'},
          {type:'income',title:'爱心人士月度捐赠',amount:2000,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-03T18:00'},
          {type:'expense',title:'采购犬粮15袋',amount:900,user:'林青',creator:'林青',category:'采购',date:'2026-07-04T09:00'},
          {type:'income',title:'企业动物保护基金',amount:3500,user:'陈敏',creator:'陈敏',category:'捐赠',date:'2026-07-04T14:00'},
          {type:'expense',title:'猫砂采购',amount:350,user:'周洋',creator:'周洋',category:'采购',date:'2026-07-05T11:00'},
          {type:'income',title:'线上义卖活动',amount:1200,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-05T17:00'},
          {type:'expense',title:'笼具及用品',amount:600,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-06T10:00'},
          {type:'expense',title:'志愿者交通补贴',amount:200,user:'周洋',creator:'周洋',category:'餐食',date:'2026-07-06T15:30'},
          {type:'income',title:'宠物品牌合作捐赠',amount:1800,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-07T09:00'},
          {type:'expense',title:'驱虫药采购',amount:450,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-07T16:00'}
        ]
      },
      {
        name: '乡村医疗义诊账本', desc: '组织乡村免费义诊活动，为偏远地区提供基础医疗服务', goal: 20000, created: '2026-06-08T09:00', creator: '林青', audit: [],
        income: 16300, expense: 5750, count: 14,
        rows: [
          {type:'income',title:'药企捐赠药品',amount:4500,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T08:30'},
          {type:'expense',title:'采购基础医疗器械',amount:1800,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-01T15:00'},
          {type:'income',title:'医院志愿者团队支持',amount:2000,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-02T10:00'},
          {type:'expense',title:'医生交通及住宿',amount:1200,user:'林青',creator:'林青',category:'物流',receipt:'assets/receipts/receipt_book5.jpg',date:'2026-07-02T16:00'},
          {type:'expense',title:'义诊日志愿者餐食',amount:380,user:'陈敏',creator:'陈敏',category:'餐食',date:'2026-07-03T12:00'},
          {type:'income',title:'企业社会责任赞助',amount:3500,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-03T14:30'},
          {type:'expense',title:'采购消毒及防护用品',amount:650,user:'林青',creator:'林青',category:'采购',date:'2026-07-04T11:00'},
          {type:'income',title:'社区居民爱心捐款',amount:800,user:'陈敏',creator:'陈敏',category:'捐赠',date:'2026-07-04T18:00'},
          {type:'expense',title:'宣传横幅及告示',amount:220,user:'周洋',creator:'周洋',category:'采购',date:'2026-07-05T10:00'},
          {type:'income',title:'慈善基金会拨款',amount:3000,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-05T15:00'},
          {type:'expense',title:'义诊药品补充',amount:950,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-06T09:30'},
          {type:'expense',title:'志愿者饮用水及补给',amount:150,user:'周洋',creator:'周洋',category:'餐食',date:'2026-07-06T16:00'},
          {type:'income',title:'医疗器械公司捐赠',amount:2500,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-07T10:00'},
          {type:'expense',title:'场地租赁及布置',amount:400,user:'陈敏',creator:'陈敏',category:'其他',date:'2026-07-07T17:00'}
        ]
      },
      {
        name: '环保垃圾分类宣传', desc: '社区垃圾分类推广活动，用于宣传物料和活动组织', goal: 10000, created: '2026-06-12T10:00', creator: '你', audit: [],
        income: 7200, expense: 3330, count: 14,
        rows: [
          {type:'income',title:'政府环保基金拨款',amount:3000,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-01T09:00'},
          {type:'expense',title:'采购分类垃圾桶20个',amount:1200,user:'陈敏',creator:'陈敏',category:'采购',date:'2026-07-01T15:00'},
          {type:'income',title:'社区物业赞助',amount:800,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-02T11:00'},
          {type:'expense',title:'宣传手册印刷500份',amount:650,user:'林青',creator:'林青',category:'采购',receipt:'assets/receipts/receipt_book6.jpg',date:'2026-07-02T16:00'},
          {type:'expense',title:'志愿者工作补贴',amount:500,user:'陈敏',creator:'陈敏',category:'餐食',date:'2026-07-03T10:00'},
          {type:'income',title:'环保企业合作赞助',amount:1500,user:'周洋',creator:'周洋',category:'捐赠',date:'2026-07-03T18:00'},
          {type:'expense',title:'活动日横幅及展架',amount:280,user:'林青',creator:'林青',category:'采购',date:'2026-07-04T09:30'},
          {type:'income',title:'居民绿色积分兑换',amount:400,user:'陈敏',creator:'陈敏',category:'捐赠',date:'2026-07-04T17:00'},
          {type:'expense',title:'分类标识贴纸采购',amount:120,user:'周洋',creator:'周洋',category:'采购',date:'2026-07-05T11:00'},
          {type:'income',title:'学校环保社团捐赠',amount:600,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-05T15:00'},
          {type:'expense',title:'活动日饮用水',amount:80,user:'陈敏',creator:'陈敏',category:'餐食',date:'2026-07-06T10:00'},
          {type:'expense',title:'环保讲座讲师费',amount:400,user:'周洋',creator:'周洋',category:'其他',date:'2026-07-06T16:30'},
          {type:'income',title:'线上环保众筹',amount:900,user:'林青',creator:'林青',category:'捐赠',date:'2026-07-07T09:00'},
          {type:'expense',title:'活动收尾清理',amount:100,user:'陈敏',creator:'陈敏',category:'其他',date:'2026-07-07T15:00'}
        ]
      }
    ]
  };

  // 数据版本号，更新内置数据后递增，自动清除旧缓存
  var DATA_VERSION = 3;

  // 优先从 localStorage 恢复数据，首次使用或版本不匹配时用内置数据
  (function loadPersistedData() {
    try {
      var savedVersion = localStorage.getItem('charity_books_version');
      if (Number(savedVersion) === DATA_VERSION) {
        var saved = localStorage.getItem('charity_books');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            state.books = parsed;
            return;
          }
        }
      }
    } catch (e) {}
    // 版本不匹配或无缓存：用内置数据并保存
    try {
      localStorage.setItem('charity_books', JSON.stringify(state.books));
      localStorage.setItem('charity_books_version', String(DATA_VERSION));
    } catch(e) {}
  })();

  // 给已有账本初始化 challenge 字段（内置账本默认全部完成）
  state.books.forEach(function(book) {
    if (!book.challenge) {
      var isBuiltin = book.rows && book.rows.length >= 8;
      book.challenge = { completed: isBuiltin ? [true, true, true, true, true, true, true] : [false, false, false, false, false, false, false], round: 1 };
    }
  });

  function activeRows() {
    if (!state.books[state.activeBook].rows) {
      state.books[state.activeBook].rows = [];
    }
    return state.books[state.activeBook].rows;
  }

  function currentBook() {
    return state.books[state.activeBook];
  }

  function isAdmin() {
    return state.isLoggedIn && state.currentRole === 'admin';
  }

  function canEdit(item) {
    return state.isLoggedIn && (isAdmin() || item.creator === state.currentUser);
  }

  function requireLogin() {
    if (state.isLoggedIn) return true;
    openModal('loginModal');
    showToast('请先登录后再协作记账');
    return false;
  }

  function roleText() {
    if (!state.isLoggedIn) return '未登录';
    return state.currentRole === 'admin' ? '管理员' : '成员';
  }

  function saveBooksToStorage() {
    try { localStorage.setItem('charity_books', JSON.stringify(state.books)); } catch(e) {}
  }

  function renderLoginState() {
    var label = document.getElementById('loginState');
    if (label) label.textContent = state.isLoggedIn ? state.currentUser + ' · ' + roleText() : '未登录';
    var member = document.getElementById('entryMember');
    if (member && state.isLoggedIn) member.value = state.currentUser;
    renderBooks();
    renderLedger();
  }

  function addAudit(action, target, beforeText, afterText) {
    var book = currentBook();
    if (!book.audit) book.audit = [];
    book.audit.unshift({
      action: action,
      target: target,
      user: state.currentUser,
      time: now(),
      before: beforeText || '',
      after: afterText || ''
    });
  }

  function recalcBook(book) {
    var rows = book.rows || [];
    book.income = rows.filter(function(row) { return row.type === 'income'; }).reduce(function(sum, row) { return sum + Number(row.amount || 0); }, 0);
    book.expense = rows.filter(function(row) { return row.type === 'expense'; }).reduce(function(sum, row) { return sum + Number(row.amount || 0); }, 0);
    book.count = rows.length;
  }

  var chart = echarts.init(document.getElementById('ledgerChart'), null, { renderer: 'svg' });
  var typeChart = echarts.init(document.getElementById('typeChart'), null, { renderer: 'svg' });
  var titleMap = {
    ledger: '项目账本工作台',
    stats: '自动统计',
    public: '公开查账页面',
    challenge: '7 天公益记账挑战'
  };

  function money(n) {
    return '¥' + Number(n).toLocaleString('zh-CN');
  }

  function now() {
    var d = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDate(dt) {
    if (!dt) return '';
    var d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function showToast(text) {
    var toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function() {
      toast.classList.remove('show');
    }, 1600);
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModals() {
    document.querySelectorAll('.modal').forEach(function(modal) {
      if (modal.id === 'imagePreviewModal') return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  function updatePublicLink() {
    var link = 'public.html#book=' + state.activeBook;
    var el = document.getElementById('publicLink');
    if (el) {
      el.href = link;
      el.textContent = link;
    }
  }

  function switchView(name) {
    if (name === 'create') {
      if (!requireLogin()) return;
      openModal('createModal');
      var newBookDate = document.getElementById('newBookDate');
      if (newBookDate && !newBookDate.value) newBookDate.value = now();
      return;
    }
    if (name === 'ledger' && !requireLogin()) return;
    openModal('viewModal');
    var book = currentBook();
    document.getElementById('modalTitle').textContent = book ? book.name : '项目账本工作台';
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.classList.toggle('active', tab.getAttribute('data-view') === name);
    });
    document.querySelectorAll('[data-panel]').forEach(function(panel) {
      panel.classList.toggle('active', panel.getAttribute('data-panel') === name);
    });
    if (name === 'ledger') {
      var entryDate = document.getElementById('entryDate');
      if (entryDate && !entryDate.value) entryDate.value = now();
      renderLedger();
    }
    if (name === 'challenge') {
      renderChallenge();
    }
    if (name === 'stats') {
      setTimeout(function() {
        chart.resize();
        typeChart.resize();
        renderChart();
        renderTypeChart();
      }, 80);
    }
    if (name === 'public') {
      updatePublicLink();
    }
  }

  function renderHome() {
    var currentBook = state.books[state.activeBook];
    var el;
    if ((el = document.getElementById('homeIncome'))) el.textContent = money(currentBook.income);
    if ((el = document.getElementById('homeExpense'))) el.textContent = money(currentBook.expense);
    if ((el = document.getElementById('homeBalance'))) el.textContent = money(currentBook.income - currentBook.expense);
    if ((el = document.getElementById('bookTotal'))) el.textContent = state.books.length;
    renderBooks();
  }

  function renderBooks() {
    var list = document.getElementById('bookList');
    var keyword = state.bookSearch.trim().toLowerCase();
    var books = state.books.map(function(book, index) {
      return Object.assign({ originalIndex: index }, book);
    }).filter(function(book) {
      return !keyword || (book.name + book.desc).toLowerCase().indexOf(keyword) >= 0;
    });
    var icons = ['📗','📘','📙','📕','📓','📔','📒','📚'];
    list.innerHTML = books.map(function(book) {
      var index = book.originalIndex;
      var balance = book.income - book.expense;
      var active = index === state.activeBook ? ' active' : '';
      var editBtn = canEdit(book) ? '<button class="small-btn" data-edit-book="' + index + '">编辑</button>' : '';
      var deleteBookBtn = isAdmin() ? '<button class="small-btn" style="color:var(--accent2)" data-delete-book="' + index + '">删除</button>' : '';
      var icon = icons[index % icons.length];
      return '<div class="book-card' + active + '" title="' + (book.desc || '') + '">' +
        '<div class="book-icon">' + icon + '</div>' +
        '<div><strong>' + book.name + '</strong><p class="meta">' + book.count + ' 笔 · 创建于 ' + (book.created ? book.created.slice(0, 10) : '-') + '</p></div>' +
        '<div style="text-align:right"><div class="book-balance">' + money(balance) + '</div><div class="book-actions" style="margin-top:8px"><button class="small-btn primary-lite" data-manage-book="' + index + '">维护</button>' + editBtn + '<button class="small-btn" data-challenge-book="' + index + '">7天挑战</button><button class="small-btn" data-public-book="' + index + '">公开页</button>' + deleteBookBtn + '</div></div>' +
      '</div>';
    }).join('');
    if (!books.length) {
      list.innerHTML = '<div class="book-card"><div class="book-icon">📭</div><div><strong>没有找到匹配账本</strong><p>可以调整搜索条件，或新建一个公益账本。</p></div><div class="book-actions"><button class="small-btn primary-lite" data-open="create">新建</button></div></div>';
    }
  }

  function renderLedger() {
    var book = currentBook();
    document.getElementById('modalTitle').textContent = book ? book.name : '项目账本';
    var list = document.getElementById('ledgerList');
    var rows = activeRows().map(function(row, index) {
      return Object.assign({ originalIndex: index }, row);
    }).filter(function(row) {
      return state.activeFilter === 'all' || row.type === state.activeFilter;
    });
    list.innerHTML = rows.map(function(row) {
      var prefix = row.type === 'income' ? '+' : '-';
      var label = row.type === 'income' ? '收入' : '支出';
      var dateText = row.date ? formatDate(row.date) : '未记录';
      var editBtn = canEdit(row) ? '<button class="small-btn" data-edit-entry="' + row.originalIndex + '">编辑</button>' : '';
      var deleteEntryBtn = canEdit(row) ? '<button class="small-btn" style="color:var(--accent2)" data-delete-entry="' + row.originalIndex + '">删除</button>' : '';
      var isImageReceipt = row.receipt && (row.receipt.indexOf('data:') === 0 || /\.(jpg|jpeg|png|gif|webp)$/i.test(row.receipt));
      var receiptDisplay = isImageReceipt
        ? '<img data-receipt-img src="' + row.receipt + '" style="max-width:80px;max-height:60px;border-radius:6px;border:1px solid var(--rule);vertical-align:middle;margin-left:4px;cursor:zoom-in">'
        : (row.receipt ? '凭证：' + row.receipt : '');
      return '<div class="row"><div><strong>' + row.title + '</strong><p>' + label + ' · ' + row.category + ' · ' + row.user + '记录 · 创建人：' + (row.creator || row.user) + (receiptDisplay ? ' · ' + receiptDisplay : '') + '</p><p style="font-size:.78rem;color:var(--accent);margin-top:2px">' + dateText + '</p></div><div class="row-actions"><span class="amount ' + row.type + '">' + prefix + money(row.amount) + '</span>' + editBtn + deleteEntryBtn + '</div></div>';
    }).join('');
    if (!rows.length) {
      list.innerHTML = '<div class="row"><div><strong>暂无匹配流水</strong><p>切换筛选条件或新增一笔记录</p></div></div>';
    }
    renderAudit();
    syncRightHeight();
  }

  function renderAudit() {
    var list = document.getElementById('auditList');
    if (!list) return;
    var logs = currentBook().audit || [];
    list.innerHTML = logs.slice(0, 6).map(function(log) {
      return '<div class="audit-item"><strong>' + log.action + ' · ' + log.target + '</strong><span>' + log.user + ' · ' + formatDate(log.time) + '</span><br><span>' + log.before + ' → ' + log.after + '</span></div>';
    }).join('');
    if (!logs.length) {
      list.innerHTML = '<div class="audit-item"><strong>暂无编辑记录</strong><span>修改账本或流水后会自动记录。</span></div>';
    }
    syncRightHeight();
  }

  function syncRightHeight() {
    var viewGrid = document.querySelector('.view-grid');
    if (!viewGrid) return;
    var leftDiv = viewGrid.children[0];
    var rightDiv = viewGrid.children[1];
    if (leftDiv && rightDiv) {
      rightDiv.style.height = leftDiv.offsetHeight + 'px';
    }
  }

  function renderChart() {
    var buckets = {};
    activeRows().forEach(function(row) {
      var key = row.date ? String(row.date).slice(0, 10) : '未记录';
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
      buckets[key][row.type] += Number(row.amount || 0);
    });
    var dates = Object.keys(buckets).sort();
    if (!dates.length) {
      dates = ['暂无数据'];
      buckets['暂无数据'] = { income: 0, expense: 0 };
    }
    var income = dates.map(function(date) { return buckets[date].income; });
    var expense = dates.map(function(date) { return buckets[date].expense; });
    var labels = dates.map(function(date) {
      return date === '暂无数据' || date === '未记录' ? date : date.slice(5);
    });
    var balance = [];
    var running = 0;
    dates.forEach(function(date) {
      running += buckets[date].income - buckets[date].expense;
      balance.push(running);
    });
    chart.clear();
    if (state.chartType === 'pie') {
      var totalIncome = income.reduce(function(sum, n) { return sum + n; }, 0);
      var totalExpense = expense.reduce(function(sum, n) { return sum + n; }, 0);
      chart.setOption({
        animation: false,
        color: [accent, accent2],
        tooltip: { trigger: 'item', appendToBody: true, valueFormatter: money },
        legend: { bottom: 0, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
        series: [{
          name: '收支占比',
          type: 'pie',
          radius: ['46%', '70%'],
          center: ['50%', '46%'],
          label: { color: muted, formatter: '{b}: {d}%' },
          data: [
            { name: '收入', value: totalIncome },
            { name: '支出', value: totalExpense }
          ]
        }]
      });
      return;
    }
    var lineMode = state.chartType === 'line';
    var legendSelected = lineMode ? { '收入': true, '支出': false, '累计余额': false } : { '收入': true, '支出': true, '累计余额': true };
    chart.setOption({
      animation: false,
      color: [accent, accent2, muted],
      tooltip: { trigger: 'axis', appendToBody: true, valueFormatter: money },
      legend: { top: 0, selected: legendSelected, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
      grid: { left: 10, right: 12, bottom: 20, top: 44, containLabel: true },
      xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
      yAxis: { type: 'value', axisLabel: { color: muted, formatter: function(v) { return v >= 1000 ? v / 1000 + 'k' : v; } }, splitLine: { lineStyle: { color: rule } } },
      series: [
        { name: '收入', type: lineMode ? 'line' : 'bar', smooth: lineMode, barWidth: 18, symbolSize: 8, data: income, itemStyle: { borderRadius: [8, 8, 0, 0] } },
        { name: '支出', type: lineMode ? 'line' : 'bar', smooth: lineMode, barWidth: 18, symbolSize: 8, data: expense, itemStyle: { borderRadius: [8, 8, 0, 0] } },
        { name: '累计余额', type: 'line', smooth: true, symbolSize: 8, data: balance, lineStyle: { width: 3 }, areaStyle: lineMode ? null : { color: bg2, opacity: .5 } }
      ]
    });
  }

  function renderTypeChart() {
    var buckets = {};
    activeRows().forEach(function(row) {
      var key = row.category || '其他';
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
      buckets[key][row.type] += Number(row.amount || 0);
    });
    var categories = Object.keys(buckets).sort(function(a, b) {
      return (buckets[b].income + buckets[b].expense) - (buckets[a].income + buckets[a].expense);
    });
    if (!categories.length) {
      categories = ['暂无数据'];
      buckets['暂无数据'] = { income: 0, expense: 0 };
    }
    var income = categories.map(function(category) { return buckets[category].income; });
    var expense = categories.map(function(category) { return buckets[category].expense; });
    var typeLegendSelected = { '收入': true, '支出': false };
    typeChart.clear();
    if (state.typeChartType === 'pie') {
      typeChart.setOption({
        animation: false,
        color: [accent, accent2, muted, '#8bbf9f', '#f3b47f'],
        tooltip: { trigger: 'item', appendToBody: true, valueFormatter: money },
        legend: { bottom: 0, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
        series: [{
          name: '类型金额',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '46%'],
          label: { color: muted, formatter: '{b}: {d}%' },
          data: categories.map(function(category) {
            return { name: category, value: buckets[category].income + buckets[category].expense };
          })
        }]
      });
      return;
    }
    if (state.typeChartType === 'line') {
      typeChart.setOption({
        animation: false,
        color: [accent, accent2],
        tooltip: { trigger: 'axis', appendToBody: true, valueFormatter: money },
        legend: { top: 0, selected: typeLegendSelected, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
        grid: { left: 10, right: 12, bottom: 20, top: 44, containLabel: true },
        xAxis: { type: 'category', data: categories, axisTick: { show: false }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
        yAxis: { type: 'value', axisLabel: { color: muted, formatter: function(v) { return v >= 1000 ? v / 1000 + 'k' : v; } }, splitLine: { lineStyle: { color: rule } } },
        series: [
          { name: '收入', type: 'line', smooth: true, symbolSize: 8, data: income },
          { name: '支出', type: 'line', smooth: true, symbolSize: 8, data: expense }
        ]
      });
      return;
    }
    typeChart.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: { trigger: 'axis', appendToBody: true, valueFormatter: money },
      legend: { top: 0, selected: typeLegendSelected, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
      grid: { left: 10, right: 12, bottom: 20, top: 44, containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: muted, formatter: function(v) { return v >= 1000 ? v / 1000 + 'k' : v; } }, splitLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'category', data: categories, axisTick: { show: false }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
      series: [
        { name: '收入', type: 'bar', stack: 'total', data: income, itemStyle: { borderRadius: [0, 8, 8, 0] } },
        { name: '支出', type: 'bar', stack: 'total', data: expense, itemStyle: { borderRadius: [0, 8, 8, 0] } }
      ]
    });
  }

  function addEntry() {
    if (!requireLogin()) return;
    var type = document.getElementById('entryType').value;
    var amount = Math.max(1, Number(document.getElementById('entryAmount').value || 1));
    var title = document.getElementById('entryTitle').value.trim() || '未命名账目';
    var category = document.getElementById('entryCategory').value;
    var user = document.getElementById('entryMember').value;
    var date = document.getElementById('entryDate').value || now();
    var receipt = state.currentReceiptData || null;
    var savedReceipt = receipt;
    var rows = activeRows();
    if (state.editingEntryIndex !== null) {
      var oldRow = rows[state.editingEntryIndex];
      if (!oldRow || !canEdit(oldRow)) {
        showToast('只有管理员或创建人可以编辑');
        return;
      }
      var beforeText = oldRow.title + ' · ' + money(oldRow.amount);
      savedReceipt = oldRow.receipt || receipt;
      rows[state.editingEntryIndex] = {
        type: type,
        title: title,
        amount: amount,
        user: user,
        creator: oldRow.creator || state.currentUser,
        category: category,
        receipt: savedReceipt,
        date: date
      };
      recalcBook(currentBook());
      addAudit('编辑流水', title, beforeText, title + ' · ' + money(amount));
      resetEntryForm();
      saveBooksToStorage();
      showToast('流水已更新，并写入编辑记录');
    } else {
      rows.unshift({ type: type, title: title, amount: amount, user: user, creator: state.currentUser, category: category, receipt: receipt, date: date });
      recalcBook(currentBook());
      saveBooksToStorage();
      showToast('已保存，并同步给协作者');
    }
    resetEntryForm();
    document.getElementById('entryDate').value = now();
    renderHome();
    renderLedger();
    renderChart();
    renderTypeChart();
  }

  function resetEntryForm() {
    state.editingEntryIndex = null;
    state.currentReceiptData = null;
    document.getElementById('entryFormTitle').textContent = '新增一笔账';
    document.getElementById('addEntry').textContent = '保存并同步给协作者';
    document.getElementById('cancelEditEntry').style.display = 'none';
    document.getElementById('receiptFile').value = '';
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('receiptPreview').src = '';
    document.getElementById('receiptState').textContent = '点击上传凭证';
  }

  function startEditEntry(index) {
    var row = activeRows()[index];
    if (!row || !canEdit(row)) {
      showToast('只有管理员或创建人可以编辑');
      return;
    }
    state.editingEntryIndex = index;
    document.getElementById('entryType').value = row.type;
    document.getElementById('entryAmount').value = row.amount;
    document.getElementById('entryTitle').value = row.title;
    document.getElementById('entryCategory').value = row.category;
    document.getElementById('entryMember').value = row.user;
    document.getElementById('entryDate').value = row.date || now();
    document.getElementById('entryFormTitle').textContent = '编辑这笔账';
    document.getElementById('addEntry').textContent = '保存修改';
    document.getElementById('cancelEditEntry').style.display = 'block';
    showToast('已载入流水，可修改后保存');
  }

  function startEditBook(index) {
    var book = state.books[index];
    if (!book || !canEdit(book)) {
      showToast('只有管理员或创建人可以编辑账本');
      return;
    }
    state.editingBookIndex = index;
    document.getElementById('editBookName').value = book.name;
    document.getElementById('editBookGoal').value = book.goal || '';
    document.getElementById('editBookDesc').value = book.desc;
    document.getElementById('editBookDate').value = book.created || now();
    openModal('editBookModal');
  }

  function saveBookEdit() {
    var index = state.editingBookIndex;
    var book = state.books[index];
    if (!book || !canEdit(book)) {
      showToast('只有管理员或创建人可以编辑账本');
      return;
    }
    var beforeText = book.name;
    var name = document.getElementById('editBookName').value.trim() || '未命名公益账本';
    book.name = name.indexOf('账本') >= 0 ? name : name + '账本';
    book.goal = Number(document.getElementById('editBookGoal').value || 0);
    book.desc = document.getElementById('editBookDesc').value.trim() || '暂无项目说明';
    book.created = document.getElementById('editBookDate').value || now();
    state.activeBook = index;
    addAudit('编辑账本', book.name, beforeText, book.name);
    renderHome();
    renderLedger();
    saveBooksToStorage();
    closeModals();
    showToast('账本信息已更新，并写入编辑记录');
  }

  function applyTemplate(name) {
    var type = document.getElementById('entryType');
    var amount = document.getElementById('entryAmount');
    var title = document.getElementById('entryTitle');
    var category = document.getElementById('entryCategory');
    if (name === 'donate') {
      type.value = 'income';
      amount.value = 500;
      title.value = '爱心人士线上捐赠';
      category.value = '捐赠';
    }
    if (name === 'purchase') {
      type.value = 'expense';
      amount.value = 860;
      title.value = '采购公益物资';
      category.value = '采购';
    }
    if (name === 'logistics') {
      type.value = 'expense';
      amount.value = 120;
      title.value = '物资运输费用';
      category.value = '物流';
    }
    showToast('已填入模板，可继续修改');
  }

  document.querySelectorAll('[data-open]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchView(this.getAttribute('data-open'));
    });
  });

  document.addEventListener('click', function(event) {
    var manageBtn = event.target.closest('[data-manage-book]');
    var challengeBookBtn = event.target.closest('[data-challenge-book]');
    var publicBtn = event.target.closest('[data-public-book]');
    var editBookBtn = event.target.closest('[data-edit-book]');
    var deleteBookBtn = event.target.closest('[data-delete-book]');
    var editEntryBtn = event.target.closest('[data-edit-entry]');
    var deleteEntryBtn = event.target.closest('[data-delete-entry]');
    var receiptImg = event.target.closest('[data-receipt-img]');
    if (manageBtn) {
      state.activeBook = Number(manageBtn.getAttribute('data-manage-book'));
      renderHome();
      renderChallenge();
      switchView('ledger');
      showToast('已进入该账本维护');
    }
    if (challengeBookBtn) {
      state.activeBook = Number(challengeBookBtn.getAttribute('data-challenge-book'));
      renderHome();
      renderChallenge();
      switchView('challenge');
      showToast('已进入7天挑战');
    }
    if (publicBtn) {
      state.activeBook = Number(publicBtn.getAttribute('data-public-book'));
      renderHome();
      switchView('public');
      showToast('已打开该账本公开页');
    }
    if (editBookBtn) {
      state.activeBook = Number(editBookBtn.getAttribute('data-edit-book'));
      renderHome();
      renderLedger();
      startEditBook(state.activeBook);
    }
    if (deleteBookBtn) {
      var delBookIndex = Number(deleteBookBtn.getAttribute('data-delete-book'));
      var delBook = state.books[delBookIndex];
      if (!delBook) return;
      if (!confirm('确定要删除账本「' + delBook.name + '」吗？此操作不可恢复，将同时删除该账本下的所有流水记录。')) return;
      addAudit('删除账本', delBook.name, '账本包含 ' + (delBook.rows ? delBook.rows.length : 0) + ' 笔流水', '已删除');
      state.books.splice(delBookIndex, 1);
      if (state.activeBook >= state.books.length) state.activeBook = 0;
      if (state.books.length === 0) state.activeBook = 0;
      saveBooksToStorage();
      renderHome();
      closeModals();
      showToast('账本「' + delBook.name + '」已删除');
    }
    if (editEntryBtn) {
      startEditEntry(Number(editEntryBtn.getAttribute('data-edit-entry')));
    }
    if (deleteEntryBtn) {
      var delEntryIndex = Number(deleteEntryBtn.getAttribute('data-delete-entry'));
      var rows = activeRows();
      var delRow = rows[delEntryIndex];
      if (!delRow) return;
      if (!confirm('确定要删除这条「' + delRow.title + '」' + (delRow.type === 'income' ? '收入' : '支出') + '记录吗？金额 ¥' + delRow.amount + '。此操作不可恢复。')) return;
      addAudit('删除流水', delRow.title, (delRow.type === 'income' ? '收入' : '支出') + ' · ¥' + money(delRow.amount), '已删除');
      rows.splice(delEntryIndex, 1);
      recalcBook(currentBook());
      saveBooksToStorage();
      renderLedger();
      renderHome();
      showToast('流水「' + delRow.title + '」已删除');
    }
    if (receiptImg) {
      document.getElementById('previewImage').src = receiptImg.getAttribute('src');
      var modal = document.getElementById('imagePreviewModal');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  });

  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', closeModals);
  });

  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(event) {
      if (modal.id === 'imagePreviewModal') {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        return;
      }
      if (event.target === modal) closeModals();
    });
  });

  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchView(this.getAttribute('data-view'));
    });
  });

  document.querySelectorAll('.sub-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = this.getAttribute('data-sub-tab');
      document.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.sub-view').forEach(function(v) { v.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.querySelector('.sub-view[data-sub-panel="' + target + '"]');
      if (panel) panel.classList.add('active');
      syncRightHeight();
    });
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncRightHeight, 100);
  });

  document.querySelectorAll('[data-template]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      applyTemplate(this.getAttribute('data-template'));
    });
  });

  document.querySelectorAll('[data-filter]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-filter]').forEach(function(item) { item.classList.remove('active'); });
      this.classList.add('active');
      state.activeFilter = this.getAttribute('data-filter');
      renderLedger();
    });
  });

  document.querySelectorAll('[data-chart-type]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-chart-type]').forEach(function(item) { item.classList.remove('active'); });
      this.classList.add('active');
      state.chartType = this.getAttribute('data-chart-type');
      renderChart();
      chart.resize();
    });
  });

  document.querySelectorAll('[data-type-chart-type]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-type-chart-type]').forEach(function(item) { item.classList.remove('active'); });
      this.classList.add('active');
      state.typeChartType = this.getAttribute('data-type-chart-type');
      renderTypeChart();
      typeChart.resize();
    });
  });

  document.getElementById('bookSearch').addEventListener('input', function() {
    state.bookSearch = this.value;
    renderBooks();
  });

  document.getElementById('receiptFile').addEventListener('change', function(e) {
    if (!requireLogin()) return;
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('图片不能超过 2MB');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(ev) {
      state.currentReceiptData = ev.target.result;
      document.getElementById('receiptState').textContent = '凭证已上传 ✓';
      var preview = document.getElementById('receiptPreview');
      preview.src = state.currentReceiptData;
      preview.style.display = 'block';
      showToast('凭证已上传');
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('openLogin').addEventListener('click', function() {
    document.getElementById('loginAccount').value = state.currentUser === '游客' ? '你' : state.currentUser;
    openModal('loginModal');
  });
  document.getElementById('confirmLogin').addEventListener('click', function() {
    var account = document.getElementById('loginAccount').value;
    state.currentUser = account;
    state.currentRole = account === '你' ? 'admin' : 'member';
    state.isLoggedIn = true;
    renderLoginState();
    closeModals();
    showToast('已登录：' + state.currentUser + ' · ' + roleText());
  });
  document.getElementById('logoutBtn').addEventListener('click', function() {
    state.isLoggedIn = false;
    state.currentUser = '游客';
    state.currentRole = 'guest';
    resetEntryForm();
    renderLoginState();
    closeModals();
    showToast('已退出登录');
  });
  document.getElementById('addEntry').addEventListener('click', addEntry);
  document.getElementById('cancelEditEntry').addEventListener('click', function() {
    resetEntryForm();
    showToast('已取消编辑');
  });
  document.getElementById('saveBookEdit').addEventListener('click', saveBookEdit);
  document.getElementById('confirmCreate').addEventListener('click', function() {
    if (!requireLogin()) return;
    var name = document.getElementById('newBookName').value.trim() || '未命名公益账本';
    var goal = Number(document.getElementById('newBookGoal').value || 0);
    var desc = document.getElementById('newBookDesc').value.trim() || '暂无项目说明';
    var created = document.getElementById('newBookDate').value || now();
    state.books.unshift({
      name: name.indexOf('账本') >= 0 ? name : name + '账本',
      desc: desc,
      goal: goal,
      income: 0,
      expense: 0,
      count: 0,
      created: created,
      creator: state.currentUser,
      audit: [],
      rows: [],
      challenge: { completed: [false, false, false, false, false, false, false], round: 1 }
    });
    state.activeBook = 0;
    renderHome();
    renderChallenge();
    saveBooksToStorage();
    closeModals();
    showToast('账本已创建，已加入列表');
  });
  document.getElementById('copyPublic').addEventListener('click', function() {
    updatePublicLink();
    var link = document.getElementById('publicLink').href;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    showToast('公开查账链接已复制');
  });
  document.getElementById('openPublic').addEventListener('click', function() {
    updatePublicLink();
    var link = document.getElementById('publicLink').href;
    window.open(link, '_blank');
  });
  window.addEventListener('resize', function() {
    chart.resize();
    typeChart.resize();
  });

  /* ==================== 7 天挑战系统（每个账本独立） ==================== */
  var CHALLENGE_TASKS = [
    { day: 1, title: '创建公益账本', desc: '本账本已创建成功', check: function(book) {
      return { current: 1, target: 1, label: '1/1 已创建', met: true };
    }},
    { day: 2, title: '累计记录3笔账目', desc: '在本账本中记录收支流水，累计达到3笔', check: function(book) {
      var total = book.rows ? book.rows.length : 0;
      return { current: total, target: 3, label: total + '/3 笔账目' };
    }},
    { day: 3, title: '记录带凭证的支出', desc: '在本账本新增一笔支出，并上传凭证图片', check: function(book) {
      var count = (book.rows || []).filter(function(r) { return r.type === 'expense' && r.receipt; }).length;
      return { current: count, target: 1, label: count + '/1 笔支出' };
    }},
    { day: 4, title: '让账本余额为正', desc: '确保本账本收入总额超过支出总额', check: function(book) {
      var met = book.income > book.expense ? 1 : 0;
      return { current: met, target: 1, label: (met ? '已' : '未') + '达标' };
    }},
    { day: 5, title: '探索统计图表', desc: '切换到统计面板，切换查看柱状图、折线图、饼图', check: null },
    { day: 6, title: '精细化管理账本', desc: '编辑本账本信息（名称、目标或说明）并保存', check: null },
    { day: 7, title: '达成记账达人', desc: '在本账本累计记录达到8笔，完成挑战闭环', check: function(book) {
      var total = book.rows ? book.rows.length : 0;
      return { current: total, target: 8, label: total + '/8 笔账目' };
    }}
  ];

  function loadChallenge() {
    var book = currentBook();
    if (!book) return { completed: [false, false, false, false, false, false, false], round: 1 };
    if (!book.challenge) {
      book.challenge = { completed: [false, false, false, false, false, false, false], round: 1 };
    }
    return book.challenge;
  }

  function saveChallenge(data) {
    var book = currentBook();
    if (book) book.challenge = data;
    saveBooksToStorage();
  }

  function initChallenge() {
    renderChallenge();
    document.getElementById('challengeReset').addEventListener('click', function() {
      var data = loadChallenge();
      data.completed = [false, false, false, false, false, false, false];
      data.round = (data.round || 1) + 1;
      saveChallenge(data);
      renderChallenge();
      showToast('已重置挑战，第 ' + data.round + ' 轮开始！');
    });
  }

  function getTaskProgress(idx) {
    var task = CHALLENGE_TASKS[idx];
    var book = currentBook();
    if (!task.check || !book) return { current: 0, target: 0, label: '手动打卡', met: true };
    var result = task.check(book);
    result.met = result.current >= result.target;
    return result;
  }

  function renderChallenge() {
    var data = loadChallenge();
    var doneCount = data.completed.filter(Boolean).length;
    var total = CHALLENGE_TASKS.length;
    var allDone = doneCount === total;

    var badge = document.getElementById('challengeBadge');
    badge.textContent = doneCount + ' / ' + total;
    badge.classList.toggle('completed', allDone);

    var homeBtn = document.querySelector('[data-open="challenge"]');
    var book = currentBook();
    var bookName = book ? book.name : '';
    if (homeBtn) homeBtn.textContent = bookName ? (bookName.slice(0, 6) + '… 挑战 ' + doneCount + '/' + total) : ('7 天挑战 ' + doneCount + '/' + total);

    document.getElementById('challengeBarFill').style.width = Math.round(doneCount / total * 100) + '%';
    document.getElementById('challengeCompleteBanner').style.display = allDone ? 'block' : 'none';

    var currentIdx = data.completed.indexOf(false);
    var timelineHTML = '';
    for (var i = 0; i < total; i++) {
      var t = CHALLENGE_TASKS[i];
      var dotClass = data.completed[i] ? 'done' : (i === currentIdx ? 'current' : '');
      var dotContent = data.completed[i] ? '✓' : String(i + 1);
      timelineHTML += '<div class="challenge-step">'
        + '<div class="step-dot ' + dotClass + '">' + dotContent + '</div>'
        + '<div class="step-label">Day ' + t.day + '</div>'
        + '<div class="step-sub">' + t.title.slice(0, 4) + '</div>'
        + '</div>';
    }
    document.getElementById('challengeTimeline').innerHTML = timelineHTML;

    var tasksHTML = '';
    for (var j = 0; j < total; j++) {
      var task = CHALLENGE_TASKS[j];
      var isDone = data.completed[j];
      var prog = getTaskProgress(j);
      var progColor = prog.met ? 'var(--accent)' : 'var(--accent2)';
      var progBar = task.check ? ('<div style="height:4px;background:var(--rule);border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, Math.round(prog.current / prog.target * 100)) + '%;background:' + progColor + ';border-radius:2px;transition:width .3s"></div></div>') : '';
      tasksHTML += '<div class="challenge-task' + (isDone ? ' done' : '') + '" data-challenge-task="' + j + '">'
        + '<div class="task-check">' + (isDone ? '✓' : '') + '</div>'
        + '<div class="task-info">'
        + '<div class="task-title">' + task.title + '</div>'
        + '<div class="task-desc">' + task.desc + '</div>'
        + progBar
        + '</div>'
        + '<div style="text-align:right"><span class="task-day-tag">Day ' + task.day + '</span><div style="font-size:.72rem;font-weight:800;color:' + progColor + ';margin-top:4px">' + prog.label + '</div></div>'
        + '</div>';
    }
    document.getElementById('challengeTasks').innerHTML = tasksHTML;

    document.querySelectorAll('[data-challenge-task]').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = Number(this.getAttribute('data-challenge-task'));
        completeChallengeTask(idx);
      });
    });
  }

  function completeChallengeTask(idx) {
    var data = loadChallenge();
    if (data.completed[idx]) return;
    for (var i = 0; i < idx; i++) {
      if (!data.completed[i]) {
        showToast('请先完成 Day ' + CHALLENGE_TASKS[i].day + ' 的任务');
        return;
      }
    }
    var prog = getTaskProgress(idx);
    if (!prog.met) {
      var need = prog.target - prog.current;
      showToast('进度不足：还差 ' + need + ' 才能打卡');
      return;
    }
    data.completed[idx] = true;
    saveChallenge(data);
    renderChallenge();
    if (data.completed.filter(Boolean).length === CHALLENGE_TASKS.length) {
      showToast('🎉 7 天挑战全部完成！第 ' + (data.round || 1) + ' 轮');
    } else {
      showToast('Day ' + CHALLENGE_TASKS[idx].day + ' 任务完成！');
    }
  }

  renderHome();
  renderLedger();
  renderLoginState();
  saveBooksToStorage();
  renderChart();
  renderTypeChart();
  initChallenge();
})();
