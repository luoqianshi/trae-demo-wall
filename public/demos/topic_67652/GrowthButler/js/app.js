/* ============================================
   app.js - 应用主控制器
   负责应用初始化、视图切换（路由）、
   顶部宝宝选择器与操作人选择器的交互、
   操作人管理，以及协调各模块的渲染刷新。
   挂载到全局命名空间 App.Controller
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 当前激活的视图 */
  var currentView = 'home';

  // ---------- 视图切换 ----------
  /** 切换视图 */
  function switchView(view) {
    currentView = view;
    // 切换视图容器
    $all('.view').forEach(function (v) {
      v.classList.toggle('view-active', v.id === 'view-' + view);
    });
    // 切换底部导航高亮
    $all('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.dataset.view === view);
    });
    // 按视图刷新对应内容
    refreshCurrentView();
    // 关闭下拉
    hideBabyDropdown();
    hideOperatorDropdown();
    // 滚动到顶部
    var main = $('.app-main');
    if (main) main.scrollTop = 0;
  }

  /** 刷新当前视图 */
  function refreshCurrentView() {
    switch (currentView) {
      case 'home':
        App.Dashboard.renderDashboard();
        break;
      case 'records':
        App.RecordManager.renderTimeline();
        break;
      case 'rewards':
        App.RewardManager.renderRewardList();
        App.RewardManager.renderExchangeList();
        break;
      case 'settings':
        App.BabyManager.renderBabyList();
        App.BehaviorManager.renderBehaviorList();
        renderOperatorList();
        break;
    }
  }

  /** 刷新所有视图与顶部选择器 */
  function refreshAll() {
    renderHeaderSelectors();
    refreshCurrentView();
  }

  // ---------- 顶部选择器渲染 ----------
  /** 渲染顶部宝宝选择器和操作人选择器 */
  function renderHeaderSelectors() {
    var baby = Storage.getCurrentBaby();
    var operator = Storage.getCurrentOperator();
    var babyAvatar = $('#currentBabyAvatar');
    var babyName = $('#currentBabyName');
    var opName = $('#currentOperatorName');
    if (babyAvatar) babyAvatar.textContent = baby ? (baby.avatar || '👶') : '👶';
    if (babyName) babyName.textContent = baby ? baby.name : '未选择';
    if (opName) opName.textContent = operator ? operator.name : '未选择';
    App.BabyManager.renderBabyDropdown();
    renderOperatorDropdown();
  }

  // ---------- 宝宝下拉 ----------
  function showBabyDropdown() {
    var dd = $('#babyDropdown');
    if (dd) dd.classList.remove('hidden');
    hideOperatorDropdown();
  }
  function hideBabyDropdown() {
    var dd = $('#babyDropdown');
    if (dd) dd.classList.add('hidden');
  }

  // ---------- 操作人下拉 ----------
  function renderOperatorDropdown() {
    var listEl = $('#operatorDropdownList');
    if (!listEl) return;
    var operators = Storage.getOperators();
    var currentOpId = Storage.getData().currentOperatorId;
    listEl.innerHTML = '';
    operators.forEach(function (op) {
      var isCurrent = op.id === currentOpId;
      var item = el('div', { class: 'dropdown-item' + (isCurrent ? ' current' : ''), dataset: { id: op.id } }, [
        el('div', { class: 'dropdown-item-icon', text: '👤' }),
        el('div', { class: 'dropdown-item-name', text: op.name }),
        isCurrent ? el('div', { class: 'dropdown-item-check', text: '✓' }) : null
      ]);
      item.addEventListener('click', function () {
        Storage.setCurrentOperator(op.id);
        renderHeaderSelectors();
        hideOperatorDropdown();
        Utils.toast('操作人已切换为 ' + op.name, 'info');
      });
      listEl.appendChild(item);
    });
    if (operators.length === 0) {
      listEl.appendChild(el('div', { class: 'dropdown-item', text: '暂无操作人，请去设置页添加' }));
    }
  }
  function showOperatorDropdown() {
    var dd = $('#operatorDropdown');
    if (dd) dd.classList.remove('hidden');
    hideBabyDropdown();
  }
  function hideOperatorDropdown() {
    var dd = $('#operatorDropdown');
    if (dd) dd.classList.add('hidden');
  }

  // ---------- 操作人管理（设置页） ----------
  /** 渲染操作人列表 */
  function renderOperatorList() {
    var listEl = $('#operatorList');
    if (!listEl) return;
    var operators = Storage.getOperators();
    var currentOpId = Storage.getData().currentOperatorId;
    listEl.innerHTML = '';
    if (operators.length === 0) {
      listEl.appendChild(el('div', { class: 'empty-state', html: '<div class="empty-emoji">👤</div><div class="empty-text">暂无操作人</div>' }));
      return;
    }
    operators.forEach(function (op) {
      var isCurrent = op.id === currentOpId;
      var item = el('div', { class: 'list-item', dataset: { id: op.id } }, [
        el('div', { class: 'list-item-icon', text: op.name.charAt(0) }),
        el('div', { class: 'list-item-main' }, [
          el('div', { class: 'list-item-name', text: op.name + (isCurrent ? '（当前）' : '') }),
          el('div', { class: 'list-item-sub', text: '操作人' })
        ]),
        el('div', { class: 'list-item-actions' }, [
          el('button', { class: 'icon-btn edit', text: '✎', title: '编辑', onclick: function (e) { e.stopPropagation(); showOperatorForm(op); } }),
          el('button', { class: 'icon-btn delete', text: '🗑', title: '删除', onclick: function (e) { e.stopPropagation(); handleDeleteOperator(op); } })
        ])
      ]);
      listEl.appendChild(item);
    });
  }

  /** 显示操作人表单（添加/编辑） */
  function showOperatorForm(operator) {
    var isEdit = !!operator;
    Utils.formDialog({
      title: isEdit ? '编辑操作人' : '添加操作人',
      fields: [
        { name: 'name', label: '操作人名称', type: 'text', required: true, placeholder: '如：妈妈', value: isEdit ? operator.name : '' }
      ],
      confirmText: isEdit ? '保存' : '添加',
      onSubmit: function (values) {
        if (isEdit) {
          Storage.updateOperator(operator.id, values.name);
          Utils.toast('操作人已更新', 'info');
        } else {
          Storage.addOperator(values.name);
          Utils.toast('操作人已添加', 'info');
        }
        App.Controller.refreshAll();
      }
    });
  }

  /** 删除操作人 */
  function handleDeleteOperator(operator) {
    var operators = Storage.getOperators();
    if (operators.length <= 1) {
      Utils.toast('至少保留一个操作人', 'warning');
      return;
    }
    Utils.confirmDialog(
      '确定要删除操作人「' + operator.name + '」吗？',
      function () {
        Storage.deleteOperator(operator.id);
        Utils.toast('操作人已删除', 'info');
        App.Controller.refreshAll();
      },
      { title: '删除操作人', confirmText: '确认删除' }
    );
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 底部导航
    $all('.nav-item').forEach(function (nav) {
      nav.addEventListener('click', function () {
        switchView(nav.dataset.view);
      });
    });

    // 顶部宝宝选择器
    var babyBtn = $('#babySelectorBtn');
    if (babyBtn) babyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = $('#babyDropdown');
      if (dd.classList.contains('hidden')) showBabyDropdown();
      else hideBabyDropdown();
    });

    // 顶部操作人选择器
    var opBtn = $('#operatorSelectorBtn');
    if (opBtn) opBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = $('#operatorDropdown');
      if (dd.classList.contains('hidden')) showOperatorDropdown();
      else hideOperatorDropdown();
    });

    // 点击页面其他区域关闭下拉
    document.addEventListener('click', function (e) {
      // 检查点击是否在下拉内或触发按钮上
      var babyDd = $('#babyDropdown');
      var opDd = $('#operatorDropdown');
      var babyBtn = $('#babySelectorBtn');
      var opBtn = $('#operatorSelectorBtn');
      if (babyDd && !babyDd.classList.contains('hidden')) {
        if (!babyDd.contains(e.target) && e.target !== babyBtn && !babyBtn.contains(e.target)) {
          hideBabyDropdown();
        }
      }
      if (opDd && !opDd.classList.contains('hidden')) {
        if (!opDd.contains(e.target) && e.target !== opBtn && !opBtn.contains(e.target)) {
          hideOperatorDropdown();
        }
      }
    });

    // 遮罩点击关闭下拉
    var babyDd = $('#babyDropdown');
    var opDd = $('#operatorDropdown');
    // 下拉本身点击不冒泡关闭
    if (babyDd) babyDd.addEventListener('click', function (e) { e.stopPropagation(); });
    if (opDd) opDd.addEventListener('click', function (e) { e.stopPropagation(); });

    // 各模块事件
    App.BabyManager.bindEvents();
    App.BehaviorManager.bindEvents();
    App.Dashboard.bindEvents();
    App.RewardManager.bindEvents();
    App.RecordManager.bindEvents();

    // 操作人添加按钮
    var addOpBtn = $('#addOperatorBtn');
    if (addOpBtn) addOpBtn.addEventListener('click', function () { showOperatorForm(null); });

    // 窗口尺寸变化时重绘趋势图
    window.addEventListener('resize', function () {
      if (currentView === 'home') {
        App.Dashboard.renderTrendChart();
      }
    });
  }

  // ---------- 初始化入口 ----------
  function init() {
    // 初始化 Modal 引用
    Utils.initModalRefs();
    // 加载数据
    Storage.loadData();
    // 绑定事件
    bindEvents();
    // 渲染顶部选择器
    renderHeaderSelectors();
    // 渲染首页
    switchView('home');
    console.log('宝宝成长积分管家 已启动 ✨');
  }

  // ---------- 暴露 API ----------
  App.Controller = {
    init: init,
    switchView: switchView,
    refreshAll: refreshAll,
    refreshCurrentView: refreshCurrentView,
    renderHeaderSelectors: renderHeaderSelectors,
    showBabyDropdown: showBabyDropdown,
    hideBabyDropdown: hideBabyDropdown,
    hideOperatorDropdown: hideOperatorDropdown,
    renderOperatorList: renderOperatorList,
    showOperatorForm: showOperatorForm
  };

  // DOM 就绪后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(typeof window !== 'undefined' ? window : this);
