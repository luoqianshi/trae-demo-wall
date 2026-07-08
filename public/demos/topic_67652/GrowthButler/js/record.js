/* ============================================
   record.js - 成长记录时间线模块
   负责合并行为记录和兑换记录，按时间倒序排列，
   支持日期范围筛选（今天/近7天/近30天/全部），
   每条显示时间、操作人、内容、分值。
   挂载到全局命名空间 App.RecordManager
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 当前筛选范围：today/7/30/all */
  var currentFilter = 'today';

  /** 渲染时间线 */
  function renderTimeline() {
    var listEl = $('#timelineList');
    var emptyEl = $('#recordsEmpty');
    if (!listEl) return;
    var baby = Storage.getCurrentBaby();
    listEl.innerHTML = '';

    if (!baby) {
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-text').textContent = '请先选择宝宝';
      return;
    }

    // 合并行为记录和兑换记录
    var records = Storage.getRecordsByBaby(baby.id).map(function (r) {
      return {
        id: r.id,
        kind: 'behavior',
        timestamp: r.timestamp,
        icon: r.behaviorIcon,
        title: r.behaviorName,
        operatorName: r.operatorName,
        points: r.type === 'add' ? r.points : -r.points,
        type: r.type,
        meta: '行为记录'
      };
    });
    var exchanges = Storage.getExchangesByBaby(baby.id).map(function (e) {
      return {
        id: e.id,
        kind: 'exchange',
        timestamp: e.resolvedAt || e.timestamp, // 已处理的按处理时间显示
        icon: e.rewardIcon,
        title: e.rewardName,
        operatorName: e.operatorName,
        points: e.status === 'approved' ? -e.cost : 0,
        type: 'exchange',
        status: e.status,
        meta: '兑换 · ' + ({ pending: '待确认', approved: '已兑换', rejected: '已拒绝' }[e.status])
      };
    });

    var allItems = records.concat(exchanges);

    // 日期筛选
    allItems = filterByRange(allItems);

    // 按时间倒序
    allItems.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    if (allItems.length === 0) {
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-text').textContent = '暂无记录';
      return;
    }
    emptyEl.classList.add('hidden');

    allItems.forEach(function (item) {
      listEl.appendChild(buildTimelineItem(item));
    });
  }

  /** 按当前筛选范围过滤 */
  function filterByRange(items) {
    if (currentFilter === 'all') return items;
    var now = new Date();
    var startMs;
    if (currentFilter === 'today') {
      startMs = Utils.startOfDay(now).getTime();
    } else if (currentFilter === '7') {
      startMs = Utils.startOfDay(now).getTime() - 6 * 24 * 60 * 60 * 1000;
    } else if (currentFilter === '30') {
      startMs = Utils.startOfDay(now).getTime() - 29 * 24 * 60 * 60 * 1000;
    } else {
      return items;
    }
    return items.filter(function (it) {
      var t = new Date(it.timestamp).getTime();
      return t >= startMs;
    });
  }

  /** 构建单条时间线项 */
  function buildTimelineItem(item) {
    var pointsClass = item.type === 'add' ? 'add' : (item.type === 'deduct' ? 'deduct' : 'exchange');
    var pointsText = '';
    if (item.kind === 'behavior') {
      pointsText = (item.points >= 0 ? '+' : '') + item.points;
    } else {
      // 兑换记录
      if (item.status === 'approved') {
        pointsText = '-' + Math.abs(item.points);
      } else {
        pointsText = '—';
      }
    }
    var timeStr = Utils.formatRelativeDate(item.timestamp) + ' ' + Utils.formatTime(item.timestamp);
    var titleChildren = [
      document.createTextNode(item.title)
    ];
    if (item.kind === 'exchange') {
      titleChildren.push(el('span', { class: 'exchange-tag', text: '兑换' }));
    }
    return el('div', { class: 'timeline-item', dataset: { id: item.id, kind: item.kind } }, [
      el('div', { class: 'timeline-icon', text: item.icon || (item.kind === 'exchange' ? '🎁' : '⭐') }),
      el('div', { class: 'timeline-body' }, [
        el('div', { class: 'timeline-title' }, titleChildren),
        el('div', { class: 'timeline-meta', html: timeStr + ' · 操作人：' + Utils.escapeHTML(item.operatorName || '未知') + ' · ' + Utils.escapeHTML(item.meta) })
      ]),
      el('div', { class: 'timeline-points ' + pointsClass, text: pointsText })
    ]);
  }

  /** 设置筛选范围 */
  function setFilter(range) {
    currentFilter = range;
    $all('.filter-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.range === range);
    });
    renderTimeline();
  }

  /** 绑定事件 */
  function bindEvents() {
    $all('.filter-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setFilter(tab.dataset.range);
      });
    });
  }

  // ---------- 暴露 API ----------
  App.RecordManager = {
    renderTimeline: renderTimeline,
    setFilter: setFilter,
    bindEvents: bindEvents
  };

})(typeof window !== 'undefined' ? window : this);
