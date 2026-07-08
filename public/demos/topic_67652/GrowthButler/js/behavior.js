/* ============================================
   behavior.js - 行为积分模块
   负责行为模板列表渲染（分加分/扣分两组）、
   添加/编辑/删除行为，以及首页快捷操作按钮区
   和点击后的记录创建与反馈动画。
   挂载到全局命名空间 App.BehaviorManager
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 渲染设置页行为列表（分加分/扣分两组） */
  function renderBehaviorList() {
    var listEl = $('#behaviorList');
    if (!listEl) return;
    var behaviors = Storage.getBehaviors();
    var addBehaviors = behaviors.filter(function (b) { return b.type === 'add'; });
    var deductBehaviors = behaviors.filter(function (b) { return b.type === 'deduct'; });

    listEl.innerHTML = '';

    if (addBehaviors.length > 0) {
      listEl.appendChild(el('div', { class: 'group-label add', text: '加分行为' }));
      addBehaviors.forEach(function (b) { listEl.appendChild(buildBehaviorItem(b)); });
    }
    if (deductBehaviors.length > 0) {
      listEl.appendChild(el('div', { class: 'group-label deduct', text: '扣分行为' }));
      deductBehaviors.forEach(function (b) { listEl.appendChild(buildBehaviorItem(b)); });
    }
    if (behaviors.length === 0) {
      listEl.appendChild(el('div', { class: 'empty-state', html: '<div class="empty-emoji">📋</div><div class="empty-text">暂无行为，点击新增添加</div>' }));
    }
  }

  /** 构建单个行为列表项 */
  function buildBehaviorItem(b) {
    return el('div', { class: 'list-item', dataset: { id: b.id } }, [
      el('div', { class: 'list-item-icon', text: b.icon || '⭐' }),
      el('div', { class: 'list-item-main' }, [
        el('div', { class: 'list-item-name', text: b.name }),
        el('div', { class: 'list-item-sub ' + b.type, text: (b.type === 'add' ? '+' : '-') + b.points + ' 分' })
      ]),
      el('div', { class: 'list-item-actions' }, [
        el('button', { class: 'icon-btn edit', text: '✎', title: '编辑', onclick: function (e) { e.stopPropagation(); showBehaviorForm(b); } }),
        el('button', { class: 'icon-btn delete', text: '🗑', title: '删除', onclick: function (e) { e.stopPropagation(); handleDelete(b); } })
      ])
    ]);
  }

  /** 渲染首页快捷操作按钮区 */
  function renderQuickActions() {
    var addWrap = $('#quickAddList');
    var deductWrap = $('#quickDeductList');
    if (!addWrap || !deductWrap) return;
    var addBtns = $('.quick-btns', addWrap);
    var deductBtns = $('.quick-btns', deductWrap);
    addBtns.innerHTML = '';
    deductBtns.innerHTML = '';

    var addBehaviors = Storage.getBehaviorsByType('add');
    var deductBehaviors = Storage.getBehaviorsByType('deduct');

    addBehaviors.forEach(function (b) {
      addBtns.appendChild(buildQuickBtn(b, 'add'));
    });
    deductBehaviors.forEach(function (b) {
      deductBtns.appendChild(buildQuickBtn(b, 'deduct'));
    });

    // 无行为时显示提示
    if (addBehaviors.length === 0) {
      addBtns.appendChild(el('div', { class: 'quick-empty', text: '暂无加分行为' }));
    }
    if (deductBehaviors.length === 0) {
      deductBtns.appendChild(el('div', { class: 'quick-empty', text: '暂无扣分行为' }));
    }
  }

  /** 构建快捷按钮 */
  function buildQuickBtn(b, type) {
    return el('button', {
      class: 'quick-btn ' + type,
      dataset: { id: b.id },
      onclick: function () { handleQuickAction(b); }
    }, [
      el('div', { class: 'quick-btn-icon', text: b.icon || '⭐' }),
      el('div', { class: 'quick-btn-name', text: b.name }),
      el('div', { class: 'quick-btn-points', text: (type === 'add' ? '+' : '-') + b.points })
    ]);
  }

  /** 处理快捷操作：创建记录 + 触发动画 + Toast */
  function handleQuickAction(behavior) {
    var baby = Storage.getCurrentBaby();
    if (!baby) {
      Utils.toast('请先添加或选择一个宝宝', 'warning');
      return;
    }
    var operator = Storage.getCurrentOperator();
    if (!operator) {
      Utils.toast('请先选择操作人', 'warning');
      return;
    }
    // 创建记录
    Storage.addRecord({
      babyId: baby.id,
      behaviorId: behavior.id,
      behaviorName: behavior.name,
      behaviorIcon: behavior.icon,
      points: behavior.points,
      type: behavior.type,
      operatorId: operator.id,
      operatorName: operator.name
    });
    // 反馈动画
    App.Dashboard.playPointsAnimation(behavior.type);
    // Toast 提示
    var sign = behavior.type === 'add' ? '+' : '-';
    Utils.toast('已记录：' + behavior.name + ' ' + sign + behavior.points, behavior.type);
    // 刷新看板与时间线
    App.Dashboard.renderDashboard();
    App.RecordManager.renderTimeline();
  }

  /** 显示行为表单（添加/编辑） */
  function showBehaviorForm(behavior) {
    var isEdit = !!behavior;
    Utils.formDialog({
      title: isEdit ? '编辑行为' : '新增行为',
      fields: [
        { name: 'name', label: '行为名称', type: 'text', required: true, placeholder: '如：按时睡觉', value: isEdit ? behavior.name : '' },
        { name: 'points', label: '分值', type: 'number', required: true, placeholder: '正整数', value: isEdit ? behavior.points : 1, min: 1 },
        { name: 'icon', label: '图标', type: 'emoji', options: Utils.BEHAVIOR_EMOJIS, value: isEdit ? behavior.icon : Utils.BEHAVIOR_EMOJIS[0] },
        { name: 'type', label: '类型', type: 'type', value: isEdit ? behavior.type : 'add', options: [
          { value: 'add', label: '➕ 加分' },
          { value: 'deduct', label: '➖ 扣分' }
        ] }
      ],
      confirmText: isEdit ? '保存' : '添加',
      onSubmit: function (values) {
        if (isEdit) {
          Storage.updateBehavior(behavior.id, {
            name: values.name,
            points: values.points,
            icon: values.icon,
            type: values.type
          });
          Utils.toast('行为已更新', 'info');
        } else {
          Storage.addBehavior({
            name: values.name,
            points: values.points,
            icon: values.icon,
            type: values.type
          });
          Utils.toast('行为已添加', 'info');
        }
        App.Controller.refreshAll();
      }
    });
  }

  /** 处理删除行为（二次确认，仅删模板保留历史） */
  function handleDelete(behavior) {
    Utils.confirmDialog(
      '确定要删除行为「' + behavior.name + '」吗？\n历史记录将保留，仅删除该行为模板。',
      function () {
        Storage.deleteBehavior(behavior.id);
        Utils.toast('行为已删除', 'info');
        App.Controller.refreshAll();
      },
      { title: '删除行为', confirmText: '确认删除' }
    );
  }

  /** 绑定事件 */
  function bindEvents() {
    var addBtn = $('#addBehaviorBtn');
    if (addBtn) addBtn.addEventListener('click', function () { showBehaviorForm(null); });
  }

  // ---------- 暴露 API ----------
  App.BehaviorManager = {
    renderBehaviorList: renderBehaviorList,
    renderQuickActions: renderQuickActions,
    handleQuickAction: handleQuickAction,
    showBehaviorForm: showBehaviorForm,
    bindEvents: bindEvents
  };

})(typeof window !== 'undefined' ? window : this);
