/* =========================================================================
 * 「知行」App 本体 Demo —— 全局功能菜单（左滑抽屉 drawer.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 在 .zx-phone 内挂载一个共享抽屉（遮罩 + 左滑面板）
 *   2. 监听 document 级 [data-action="menu"]：任何 tab 顶栏的 ☰ 都打开它
 *   3. 内容：用户摘要（→个人主页）+ 快捷入口（扫一扫/收藏/稍后看/草稿）+ 快开关（主题/字号）
 *   4. 主题快开关：给 body 切 .zx-theme-dark，即时生效（demo 本地态）
 * 依赖：../../demo/shared/icons.js（ZX.icon）、../../demo/shared/mock-data.js（ZX_MOCK）
 * 挂载：window.ZX_DRAWER
 * 约束：原生 JS，无框架；不破坏各 tab 自身的事件委托
 * =======================================================================*/

(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function zicon(name, size) { return (window.ZX && typeof window.ZX.icon === 'function') ? window.ZX.icon(name, size || 22) : svg('', size); }

  var IC = {
    chev: function (s) { return svg('<path d="M9 6l6 6-6 6"/>', s); },
    back: function (s) { return svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>', s); },
    pencil: function (s) { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s); },
    scan: function (s) { return svg('<path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>', s); },
    bookmark: function (s) { return svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', s); },
    clock: function (s) { return svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s); },
    drafts: function (s) { return svg('<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M8 13h8M8 17h5"/>', s); },
    moon: function (s) { return svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', s); },
    sun: function (s) { return svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>', s); },
    type: function (s) { return svg('<path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/>', s); },
    heart: function (s) { return svg('<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>', s); },
    userPlus: function (s) { return svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6"/><path d="M17 11h6"/><path d="M20 8v6"/>', s); },
    user: function (s) { return svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>', s); },
    order: function (s) { return svg('<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4"/><path d="M9 13h6M9 17h4"/>', s); },
    cart: function (s) { return svg('<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11h9.3l1.8-8H6"/>', s); },
    wallet: function (s) { return svg('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.3" fill="currentColor" stroke="none"/>', s); },
    goods: function (s) { return svg('<path d="M3 9l2-5h14l2 5"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9h18"/><path d="M9 13h6"/>', s); },
    miniapp: function (s) { return svg('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>', s); },
    cache: function (s) { return svg('<path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M21 4v5h-5"/>', s); }
  };

  /* —— 本地状态：主题/离线缓存（demo 本地态，不持久化） —— */
  var state = { dark: false, cacheCount: 23 };

  /* —— Toast 复用：优先 bridge/shell 的全局 toast，否则自带 —— */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.toast === 'function') { window.ZX_BRIDGE.toast(msg); return; }
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'fr-toast';
      var phone = $('.zx-phone');
      (phone || document.body).appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 1800);
  }

  /* —— 当前用户（mock）—— motto 与个人页 MOCK_PROFILE.user.motto 保持一致 —— */
  function currentUser() {
    var pf = (window.MOCK_PROFILE && window.MOCK_PROFILE.user) || null;
    var src = (window.ZX_MOCK && window.ZX_MOCK.users && window.ZX_MOCK.users[0]) || {};
    return {
      name: (pf && pf.name) || src.name || '我',
      initials: (pf && pf.initials) || src.initials || '我',
      avatarColor: (pf && pf.avatarColor) || src.avatarColor || '#1D5B7A',
      /* 自我介绍严格对齐个人页格言（motto）：有 motto 显示 motto，否则占位提示。
       * 不再 fallback 到 src.bio，确保两处始终一致。 */
      bio: (pf && pf.motto) ? pf.motto : '点击设置你的格言'
    };
  }

  /* —— 抽屉二级详情页：每项点进去展开全屏列表（mock 内容）—— */
  function detailRow(main, sub, right) {
    return '<div class="zx-detail__row">'
      + '<div class="zx-detail__row-main"><span>' + escapeHtml(main) + '</span>'
      + (sub ? '<span class="zx-detail__row-sub">' + escapeHtml(sub) + '</span>' : '') + '</div>'
      + (right ? '<span class="zx-detail__row-right">' + escapeHtml(right) + '</span>' + IC.chev(16) : '')
      + '</div>';
  }
  /* 用户卡片行：与个人页 .pf-user-item 同款（头像 + 名称 + 副信息 + chev） */
  function detailUserCard(initial, color, name, sub) {
    return '<div class="zx-detail__user">'
      + '<span class="zx-detail__ava" style="background:' + color + '">' + escapeHtml(initial) + '</span>'
      + '<div class="zx-detail__user-main">'
      +   '<span class="zx-detail__user-name">' + escapeHtml(name) + '</span>'
      +   '<span class="zx-detail__user-sub">' + escapeHtml(sub) + '</span>'
      + '</div>'
      + '<span class="zx-detail__user-chev">' + IC.chev(16) + '</span>'
      + '</div>';
  }
  function detailGroup(label, rowsHtml) {
    return '<div class="zx-detail__group"><p class="zx-detail__group-label">' + escapeHtml(label) + '</p>'
      + '<div class="zx-detail__list">' + rowsHtml + '</div></div>';
  }

  var DETAIL_META = {
    'msg-likes': {
      title: '收到的赞',
      html: function () {
        return detailGroup('最近 7 天', ''
          + detailUserCard('江', '#3E8DB0', '江月', '5 分钟前 · 赞了《LiNbO₃ 涂层厚度优化》')
          + detailUserCard('林', '#C1272D', '林知微', '1 小时前 · 赞了《界面阻抗测量方法对比》')
          + detailUserCard('陈', '#9C7E2E', '陈砚', '昨天 · 赞了《钠枝晶的真正成因》')
          + detailUserCard('周', '#1D5B7A', '周屿', '2 天前 · 赞了《固态电池界面阻抗》')
          + detailUserCard('苏', '#B4602C', '苏野', '3 天前 · 赞了《为什么 2026 是固态量产元年》'));
      }
    },
    'msg-follows': {
      title: '收到的关注',
      html: function () {
        return detailGroup('新的关注者', ''
          + detailUserCard('江', '#3E8DB0', '江月', '10 分钟前 · 研究员 · 界面阻抗')
          + detailUserCard('林', '#C1272D', '林知微', '今天 · 博士 · 钠电枝晶')
          + detailUserCard('陈', '#9C7E2E', '陈砚', '昨天 · 工程师 · 产业路线'));
      }
    },
    'orders': {
      title: '我的订单',
      html: function () {
        return detailGroup('进行中', ''
          + detailRow('电池阻抗测试套件', '订单号 #20260618', '待发货')
          + detailRow('LiNbO₃ 靶材 ×2', '订单号 #20260615', '运输中'))
          + detailGroup('已完成', ''
          + detailRow('原位 XPS 数据集', '订单号 #20260530', '已完成')
          + detailRow('EIS 等效电路插件', '订单号 #20260520', '已完成'));
      }
    },
    'cart': {
      title: '购物车',
      html: function () {
        return detailGroup('待结算（3）', ''
          + detailRow('固态电解质粉末 50g', '高离子电导率 · 实验级', '¥ 320')
          + detailRow('锂金属负极片 ×10', '50μm · 均匀沉积', '¥ 180')
          + detailRow('原位 XPS 数据集', '100+ 组标定数据', '¥ 99'))
          + '<div class="zx-detail__total">合计 ¥ 599</div>';
      }
    },
    'my-goods': {
      title: '我的商品',
      html: function () {
        return detailGroup('在售（2）', ''
          + detailRow('EIS 数据拟合服务', '等效电路推荐 · 售出 89 次', '¥ 49/次')
          + detailRow('文献摘要助手（Pro）', '月度订阅 · 售出 156 次', '¥ 29/月'))
          + detailGroup('已下架', ''
          + detailRow('钠枝晶复盘报告', '已售罄', '已下架'));
      }
    },
    'wallet': {
      title: '钱包',
      html: function () {
        return '<div class="zx-detail__balance">'
          + '<span class="zx-detail__balance-label">可用余额</span>'
          + '<span class="zx-detail__balance-num">¥ 1,288.50</span>'
          + '<div class="zx-detail__balance-actions">'
          + '<button class="zx-detail__btn" data-drawer-detail-act="withdraw">提现</button>'
          + '<button class="zx-detail__btn zx-detail__btn--ghost" data-drawer-detail-act="recharge">充值</button>'
          + '</div></div>'
          /* Task 9：收费记录归入钱包 */
          + detailGroup('收费记录（本月）', ''
          + detailRow('解锁次数', '付费内容', '23 次')
          + detailRow('订阅收入', '月度订阅', '+ ¥ 186')
          + detailRow('平台币兑换', '1,200 币', '+ ¥ 120'))
          + detailGroup('最近明细', ''
          + detailRow('EIS 拟合服务收入', '订单收入', '+ ¥ 49.00')
          + detailRow('文献助手订阅', '订单收入', '+ ¥ 29.00')
          + detailRow('提现到银行卡', '尾号 6688', '- ¥ 500.00')
          + detailRow('购买靶材', '订单支出', '- ¥ 180.00'));
      }
    },
    'miniapp': {
      title: '小程序中心',
      html: function () {
        return detailGroup('常用', ''
          + detailRow('文献检索', '跨库检索 · 引文追踪', '')
          + detailRow('公式识别', '截图转 LaTeX', '')
          + detailRow('数据可视化', 'EIS / CV 一键绘图', ''))
          + detailGroup('工具', ''
          + detailRow('单位换算', '电池领域专用', '')
          + detailRow('术语词典', '中英对照', ''));
      }
    },
    'cache': {
      title: '离线缓存',
      html: function () {
        return detailGroup('已缓存 ' + state.cacheCount + ' 篇', ''
          + detailRow('固态电池界面阻抗：从 1200 到 80 Ω·cm²', '3.2 MB', '可离线')
          + detailRow('钠枝晶 137 篇论文复盘', '5.8 MB', '可离线')
          + detailRow('LiNbO₃ 涂层厚度优化', '1.1 MB', '可离线')
          + detailRow('界面阻抗测量方法对比', '2.4 MB', '可离线'))
          + '<div class="zx-detail__cache-tip">已缓存内容在无网络时仍可阅读</div>';
      }
    },
    'visit-log': {
      title: '访问记录',
      html: function () {
        return '<div class="zx-detail__group">'
          + '<div class="zx-detail__list">'
          + '<div class="zx-detail__row">'
          + '<div class="zx-detail__row-main"><span>隐身访问</span></div>'
          + '<span class="pf-toggle is-on"><span class="pf-toggle__knob"></span></span>'
          + '</div>'
          + '</div></div>'
          + detailGroup('最近访客', ''
          + detailUserCard('沈', '#3E8DB0', '沈砚', '2 小时前 · 查看《电池阻抗》')
          + detailUserCard('林', '#C1272D', '林知遥', '昨天 · 访问主页'));
      }
    },
    'paid-log': {
      title: '收费记录',
      html: function () {
        return detailGroup('本月收益', ''
          + detailRow('解锁次数', '付费内容', '23 次')
          + detailRow('订阅收入', '月度订阅', '+ ¥ 186')
          + detailRow('平台币兑换', '1,200 币', '+ ¥ 120'));
      }
    }
  };

  function openDetail(key) {
    var meta = DETAIL_META[key];
    if (!meta) { toast('（demo）'); return; }
    closeDetail();
    var host = document.createElement('div');
    host.className = 'zx-drawer-detail';
    host.setAttribute('data-drawer-detail', '');
    host.innerHTML = ''
      + '<div class="zx-drawer-detail__top">'
      +   '<button class="zx-icon-btn" data-drawer-detail-back aria-label="返回">' + IC.back(22) + '</button>'
      +   '<h2 class="zx-drawer-detail__title">' + escapeHtml(meta.title) + '</h2>'
      + '</div>'
      + '<div class="zx-drawer-detail__body">' + meta.html() + '</div>';
    var drawerHost = $('#zx-drawer');
    if (drawerHost) drawerHost.appendChild(host);
  }
  function closeDetail() {
    var d = $('[data-drawer-detail]');
    if (d) d.parentNode.removeChild(d);
  }

  function openDrawer() {
    var phone = $('.zx-phone');
    if (!phone) return;
    render();
    /* render 重建 DOM 后，新抽屉/scrim 默认带 translateX(-100%)/opacity:0。
     * 同帧 add class 会被浏览器合并跳过过渡，必须强制 reflow 后再 add。 */
    void phone.offsetHeight;
    phone.classList.add('is-drawer-open');
  }
  function closeDrawer() {
    closeDetail();
    var phone = $('.zx-phone');
    if (phone) phone.classList.remove('is-drawer-open');
  }
  function isOpen() { return $('.zx-phone') && $('.zx-phone').classList.contains('is-drawer-open'); }

  /* —— 切 tab 辅助（复用 bridge/shell route） —— */
  function switchTab(name) {
    if (window.ZX_BRIDGE && typeof window.ZX_BRIDGE.switchTab === 'function') { window.ZX_BRIDGE.switchTab(name); return; }
    var tab = document.querySelector('[data-tab="' + name + '"]');
    if (tab) tab.click();
  }

  /* —— 主题快开关 —— */
  function applyTheme() {
    document.body.classList.toggle('zx-theme-dark', state.dark);
  }
  function applyFontScale() {
    var screen = $('.zx-screen');
    if (screen) screen.style.fontSize = (16 * state.fontScale) + 'px';
  }

  /* —— 渲染抽屉内容 —— */
  function groupHtml(label, items) {
    return '<div class="zx-drawer__group">'
      + '<p class="zx-drawer__group-label">' + escapeHtml(label) + '</p>'
      + items.map(function (it) {
          return '<button class="zx-drawer__item" data-drawer-act="' + it.key + '"' + (it.badge ? ' data-badge="' + escapeHtml(it.badge) + '"' : '') + '>'
            + '<span class="zx-drawer__item-ico">' + it.icon + '</span>'
            + '<span class="zx-drawer__item-main"><span>' + escapeHtml(it.name) + '</span>'
            + (it.hint ? '<span class="zx-drawer__item-hint">' + escapeHtml(it.hint) + '</span>' : '') + '</span>'
            + (it.badge ? '<span class="zx-drawer__badge">' + escapeHtml(it.badge) + '</span>' : '')
            + (it.noChev ? '' : '<span class="zx-drawer__item-chev">' + IC.chev(16) + '</span>')
            + '</button>';
        }).join('')
      + '</div>';
  }

  function render() {
    var root = $('#zx-drawer');
    if (!root) return;
    var u = currentUser();

    var grpSys = groupHtml('系统消息', [
      { key: 'msg-likes', icon: IC.heart(18), name: '收到的赞', hint: '谁赞了你的笔记', badge: '5' },
      { key: 'msg-follows', icon: IC.userPlus(18), name: '收到的关注', hint: '新的关注者', badge: '2' }
    ]);
    var grpInteract = groupHtml('数据与互动', [
      { key: 'visit-log', icon: IC.eye ? IC.eye(18) : '👁', name: '访问记录', hint: '谁看过你的笔记与主页' }
      /* Task 9：收费记录已归入钱包，不再单独显示 */
    ]);
    var grpBiz = groupHtml('交易与服务', [
      { key: 'orders', icon: IC.order(18), name: '我的订单', hint: '订单查询与售后' },
      { key: 'cart', icon: IC.cart(18), name: '购物车', hint: '待结算商品', badge: '3' },
      { key: 'my-goods', icon: IC.goods(18), name: '我的商品', hint: '在售 · 已售商品' },
      { key: 'wallet', icon: IC.wallet(18), name: '钱包', hint: '余额 · 明细 · 提现' }
    ]);
    var grpApp = groupHtml('小程序', [
      { key: 'miniapp', icon: IC.miniapp(18), name: '小程序中心', hint: '工具与服务' }
    ]);

    var grpDisplay = '<div class="zx-drawer__group">'
      + '<p class="zx-drawer__group-label">显示与缓存</p>'
      + '<button class="zx-drawer__toggle-row" data-drawer-act="toggle-dark">'
      +   '<span class="zx-drawer__item-ico">' + (state.dark ? IC.moon(18) : IC.sun(18)) + '</span>'
      +   '<span class="zx-drawer__item-main"><span>深色模式</span></span>'
      +   '<span class="pf-toggle' + (state.dark ? ' is-on' : '') + '" aria-hidden="true"><span class="pf-toggle__knob"></span></span>'
      + '</button>'
      + '<button class="zx-drawer__item" data-drawer-act="cache">'
      +   '<span class="zx-drawer__item-ico">' + IC.cache(18) + '</span>'
      +   '<span class="zx-drawer__item-main"><span>离线缓存</span><span class="zx-drawer__item-hint">已缓存 ' + state.cacheCount + ' 篇笔记</span></span>'
      +   '<span class="zx-drawer__item-chev">' + IC.chev(16) + '</span>'
      + '</button>'
      + '</div>';

    var html = ''
      + '<div class="zx-drawer-scrim" data-drawer-act="close"></div>'
      + '<aside class="zx-drawer" role="dialog" aria-modal="true" aria-label="功能菜单">'
      +   '<div class="zx-drawer__head">'
      +     '<div class="zx-drawer__user">'
      +       '<button class="zx-drawer__user-tap" data-drawer-act="goto-profile" aria-label="查看个人主页">'
      +         '<span class="zx-drawer__ava" style="background:' + u.avatarColor + '">' + escapeHtml(u.initials) + '</span>'
      +         '<span class="zx-drawer__uname">' + escapeHtml(u.name) + '</span>'
      +       '</button>'
      +       '<button class="zx-drawer__usub-tap" data-drawer-act="edit-motto" aria-label="编辑格言">'
      +         '<span class="zx-drawer__usub">' + escapeHtml(u.bio) + '</span>'
      +         '<span class="zx-drawer__usub-edit">' + IC.pencil(12) + '</span>'
      +       '</button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="zx-drawer__scroll">'
      +     groupHtml('账户', [
          { key: 'account-info', icon: IC.user(18), name: '我的账户', hint: '数据总览 · 账户信息 · 成就' }
        ])
      +     grpSys + grpInteract + grpBiz + grpApp + grpDisplay
      +   '</div>'
      + '</aside>';
    root.innerHTML = html;
  }

  /* —— 事件委托 —— */
  function onDrawerClick(e) {
    /* 二级详情页：返回键 / 操作按钮 */
    var detailBack = e.target.closest('[data-drawer-detail-back]');
    if (detailBack) { closeDetail(); return; }
    var detailAct = e.target.closest('[data-drawer-detail-act]');
    if (detailAct) {
      var da = detailAct.getAttribute('data-drawer-detail-act');
      closeDetail();
      toast(da === 'withdraw' ? '提现（demo）' : (da === 'recharge' ? '充值（demo）' : '（demo）'));
      return;
    }
    var node = e.target.closest('[data-drawer-act]');
    if (!node) return;
    var act = node.getAttribute('data-drawer-act');
    switch (act) {
      case 'close': closeDrawer(); return;
      case 'goto-profile': switchTab('profile'); closeDrawer(); return;
      /* 编辑格言：调用 profile 模块的格言编辑器（profile 已 init 时可用） */
      case 'edit-motto':
        if (window.ZX_PROFILE && typeof window.ZX_PROFILE.openMottoEditor === 'function') {
          window.ZX_PROFILE.openMottoEditor();
        } else {
          toast('请先打开个人页（demo）');
        }
        return;
      /* 账户信息入口：切到 profile 页并打开账户信息详情页 */
      case 'account-info':
        switchTab('profile');
        closeDrawer();
        if (window.ZX_PROFILE && typeof window.ZX_PROFILE.openAccountInfo === 'function') {
          setTimeout(function () { window.ZX_PROFILE.openAccountInfo(); }, 60);
        }
        return;
      /* 以下各项：打开抽屉二级详情页（mock 内容列表）
       * Task 7：带红点的项点击后清除红点 */
      case 'msg-likes':
      case 'msg-follows':
      case 'orders':
      case 'cart':
      case 'my-goods':
      case 'wallet':
      case 'miniapp':
      case 'cache':
      case 'visit-log':
        /* Task 7：清除该项的红点 */
        if (node.querySelector('.zx-drawer__badge')) {
          node.removeAttribute('data-badge');
          var bd = node.querySelector('.zx-drawer__badge');
          if (bd) bd.parentNode.removeChild(bd);
        }
        openDetail(act);
        return;
      case 'toggle-dark':
        state.dark = !state.dark; applyTheme(); render();
        toast(state.dark ? '已切换深色模式' : '已切换浅色模式');
        return;
      default: return;
    }
  }

  /* —— 挂载抽屉容器 + 全局监听 —— */
  function mount() {
    var phone = $('.zx-phone');
    if (!phone) return;
    if (!$('#zx-drawer')) {
      var host = document.createElement('div');
      host.id = 'zx-drawer';
      phone.appendChild(host);
      host.addEventListener('click', onDrawerClick);
    }
    /* 全局监听 ☰：任何 tab 顶栏的 data-action="menu" 都打开抽屉 */
    document.addEventListener('click', function (e) {
      var node = e.target.closest('[data-action="menu"]');
      if (!node) return;
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    }, true);
    /* Android 返回键语义：抽屉开时点返回先关抽屉（demo 用 Esc 代） */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeDrawer();
    });
  }

  function init() { mount(); }

  window.ZX_DRAWER = { open: openDrawer, close: closeDrawer, isOpen: isOpen };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
