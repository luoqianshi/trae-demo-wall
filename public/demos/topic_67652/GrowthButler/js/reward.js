/* ============================================
   reward.js - 奖励兑换模块
   负责奖励列表渲染、添加/编辑/删除奖励、
   申请兑换（积分校验）、家长确认/拒绝兑换，
   以及兑换申请列表展示。
   挂载到全局命名空间 App.RewardManager
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 渲染奖励列表 */
  function renderRewardList() {
    var listEl = $('#rewardList');
    var emptyEl = $('#rewardsEmpty');
    if (!listEl) return;
    var rewards = Storage.getRewards();
    var baby = Storage.getCurrentBaby();
    var totalPoints = baby ? Storage.getBabyTotalPoints(baby.id) : 0;

    listEl.innerHTML = '';
    if (rewards.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    rewards.forEach(function (reward) {
      var canAfford = baby && totalPoints >= reward.cost;
      var item = el('div', { class: 'reward-item', dataset: { id: reward.id } }, [
        el('div', { class: 'list-item-icon', text: reward.icon || '🎁' }),
        el('div', { class: 'list-item-main' }, [
          el('div', { class: 'list-item-name', text: reward.name }),
          el('div', { class: 'list-item-sub', html: '需要 <span class="reward-cost">' + reward.cost + '</span> 分' + (baby ? ' · 当前 ' + totalPoints + ' 分' : '') })
        ]),
        el('div', { class: 'reward-actions' }, [
          el('button', {
            class: 'btn btn-small ' + (canAfford ? 'btn-primary' : 'btn-ghost'),
            text: '兑换',
            onclick: function (e) { e.stopPropagation(); handleExchange(reward); }
          }),
          el('button', { class: 'icon-btn edit', text: '✎', title: '编辑', onclick: function (e) { e.stopPropagation(); showRewardForm(reward); } }),
          el('button', { class: 'icon-btn delete', text: '🗑', title: '删除', onclick: function (e) { e.stopPropagation(); handleDeleteReward(reward); } })
        ])
      ]);
      listEl.appendChild(item);
    });
  }

  /** 渲染兑换申请列表（按时间倒序） */
  function renderExchangeList() {
    var listEl = $('#exchangeList');
    var emptyEl = $('#exchangesEmpty');
    if (!listEl) return;
    var baby = Storage.getCurrentBaby();
    listEl.innerHTML = '';

    if (!baby) {
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-text').textContent = '请先选择宝宝';
      return;
    }

    var exchanges = Storage.getExchangesByBaby(baby.id).slice().sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    if (exchanges.length === 0) {
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-text').textContent = '暂无兑换申请';
      return;
    }
    emptyEl.classList.add('hidden');

    exchanges.forEach(function (ex) {
      var statusText = { pending: '待确认', approved: '已兑换', rejected: '已拒绝' }[ex.status];
      var statusClass = 'status-' + ex.status;
      var timeStr = Utils.formatDateTime(ex.timestamp);
      var resolvedStr = ex.resolvedAt ? (' · 处理于 ' + Utils.formatDateTime(ex.resolvedAt)) : '';

      var item = el('div', { class: 'exchange-item', dataset: { id: ex.id } }, [
        el('div', { class: 'exchange-top' }, [
          el('div', { class: 'exchange-icon', text: ex.rewardIcon || '🎁' }),
          el('div', { class: 'exchange-name', text: ex.rewardName }),
          el('div', { class: 'exchange-cost', text: '-' + ex.cost + '分' })
        ]),
        el('div', { class: 'exchange-meta', html: '申请时间：' + timeStr + ' · 操作人：' + Utils.escapeHTML(ex.operatorName || '未知') + resolvedStr + ' · <span class="status-tag ' + statusClass + '">' + statusText + '</span>' }),
        ex.status === 'pending' ? el('div', { class: 'exchange-actions' }, [
          el('button', { class: 'btn btn-small btn-success', text: '✓ 确认兑换', onclick: function (e) { e.stopPropagation(); handleApprove(ex); } }),
          el('button', { class: 'btn btn-small btn-danger', text: '✗ 拒绝', onclick: function (e) { e.stopPropagation(); handleReject(ex); } })
        ]) : null
      ]);
      listEl.appendChild(item);
    });
  }

  /** 处理申请兑换：积分校验 + 创建 pending 记录 */
  function handleExchange(reward) {
    var baby = Storage.getCurrentBaby();
    if (!baby) {
      Utils.toast('请先选择宝宝', 'warning');
      return;
    }
    var operator = Storage.getCurrentOperator();
    if (!operator) {
      Utils.toast('请先选择操作人', 'warning');
      return;
    }
    var totalPoints = Storage.getBabyTotalPoints(baby.id);
    if (totalPoints < reward.cost) {
      var diff = reward.cost - totalPoints;
      Utils.toast('积分不足，还差 ' + diff + ' 分', 'warning');
      return;
    }
    // 二次确认
    Utils.confirmDialog(
      '确定为「' + baby.name + '」申请兑换「' + reward.name + '」吗？\n将消耗 ' + reward.cost + ' 分，等待家长确认后扣分。',
      function () {
        Storage.addExchange({
          babyId: baby.id,
          rewardId: reward.id,
          rewardName: reward.name,
          rewardIcon: reward.icon,
          cost: reward.cost,
          operatorId: operator.id,
          operatorName: operator.name
        });
        Utils.toast('兑换申请已提交，等待确认', 'info');
        renderExchangeList();
        App.RecordManager.renderTimeline();
      },
      { title: '申请兑换', confirmText: '确认申请' }
    );
  }

  /** 家长确认兑换：扣分 + 状态变 approved */
  function handleApprove(exchange) {
    var baby = Storage.getCurrentBaby();
    if (!baby || baby.id !== exchange.babyId) {
      Utils.toast('只能处理当前宝宝的兑换', 'warning');
      return;
    }
    var totalPoints = Storage.getBabyTotalPoints(baby.id);
    if (totalPoints < exchange.cost) {
      Utils.toast('当前积分不足，无法确认兑换', 'warning');
      return;
    }
    Utils.confirmDialog(
      '确认兑换「' + exchange.rewardName + '」？\n将扣除 ' + exchange.cost + ' 分。',
      function () {
        Storage.updateExchange(exchange.id, {
          status: 'approved',
          resolvedAt: new Date().toISOString()
        });
        Utils.toast('兑换已确认，已扣除 ' + exchange.cost + ' 分', 'add');
        renderExchangeList();
        App.Dashboard.renderDashboard();
        App.RecordManager.renderTimeline();
      },
      { title: '确认兑换', confirmText: '确认扣分' }
    );
  }

  /** 家长拒绝兑换：不扣分，状态变 rejected */
  function handleReject(exchange) {
    Utils.confirmDialog(
      '拒绝兑换「' + exchange.rewardName + '」的申请？\n不会扣除积分。',
      function () {
        Storage.updateExchange(exchange.id, {
          status: 'rejected',
          resolvedAt: new Date().toISOString()
        });
        Utils.toast('已拒绝兑换申请', 'info');
        renderExchangeList();
        App.RecordManager.renderTimeline();
      },
      { title: '拒绝兑换', confirmText: '确认拒绝' }
    );
  }

  /** 显示奖励表单（添加/编辑） */
  function showRewardForm(reward) {
    var isEdit = !!reward;
    Utils.formDialog({
      title: isEdit ? '编辑奖励' : '新增奖励',
      fields: [
        { name: 'name', label: '奖励名称', type: 'text', required: true, placeholder: '如：看一集动画片', value: isEdit ? reward.name : '' },
        { name: 'cost', label: '所需积分', type: 'number', required: true, placeholder: '正整数', value: isEdit ? reward.cost : 10, min: 1 },
        { name: 'icon', label: '图标', type: 'emoji', options: Utils.REWARD_EMOJIS, value: isEdit ? reward.icon : Utils.REWARD_EMOJIS[0] }
      ],
      confirmText: isEdit ? '保存' : '添加',
      onSubmit: function (values) {
        if (isEdit) {
          Storage.updateReward(reward.id, {
            name: values.name,
            cost: values.cost,
            icon: values.icon
          });
          Utils.toast('奖励已更新', 'info');
        } else {
          Storage.addReward({
            name: values.name,
            cost: values.cost,
            icon: values.icon
          });
          Utils.toast('奖励已添加', 'info');
        }
        App.Controller.refreshAll();
      }
    });
  }

  /** 删除奖励 */
  function handleDeleteReward(reward) {
    Utils.confirmDialog(
      '确定要删除奖励「' + reward.name + '」吗？',
      function () {
        Storage.deleteReward(reward.id);
        Utils.toast('奖励已删除', 'info');
        App.Controller.refreshAll();
      },
      { title: '删除奖励', confirmText: '确认删除' }
    );
  }

  /** 绑定事件 */
  function bindEvents() {
    var addBtn = $('#addRewardBtn');
    if (addBtn) addBtn.addEventListener('click', function () { showRewardForm(null); });
  }

  // ---------- 暴露 API ----------
  App.RewardManager = {
    renderRewardList: renderRewardList,
    renderExchangeList: renderExchangeList,
    showRewardForm: showRewardForm,
    bindEvents: bindEvents
  };

})(typeof window !== 'undefined' ? window : this);
