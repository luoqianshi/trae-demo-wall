/* ============================================
   dashboard.js - 积分看板与趋势图模块
   负责首页总积分大数字展示、宝宝信息、
   今日摘要、Canvas 柱状趋势图（7天/30天切换）、
   以及加扣分动画触发。
   挂载到全局命名空间 App.Dashboard
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 当前趋势图周期：7 或 30 */
  var currentRange = 7;

  /** 渲染整个看板（首页主体） */
  function renderDashboard() {
    var baby = Storage.getCurrentBaby();
    var totalEl = $('#totalPoints');
    var homeEmpty = $('#homeEmptyGuide');
    var homeAvatar = $('#homeBabyAvatar');
    var homeName = $('#homeBabyName');
    var homeBirthday = $('#homeBabyBirthday');

    if (!baby) {
      // 无宝宝：显示引导
      if (totalEl) totalEl.textContent = '0';
      if (homeAvatar) homeAvatar.textContent = '👶';
      if (homeName) homeName.textContent = '未选择宝宝';
      if (homeBirthday) homeBirthday.textContent = '';
      if (homeEmpty) homeEmpty.classList.remove('hidden');
      renderTodaySummary(null);
      renderTrendChart();
      App.BehaviorManager.renderQuickActions();
      return;
    }

    if (homeEmpty) homeEmpty.classList.add('hidden');
    if (homeAvatar) homeAvatar.textContent = baby.avatar || '👶';
    if (homeName) homeName.textContent = baby.name;
    var age = Utils.ageFromBirthday(baby.birthday);
    if (homeBirthday) homeBirthday.textContent = age ? (age + (baby.birthday ? ' · ' + baby.birthday : '')) : (baby.birthday || '');

    // 总积分
    var total = Storage.getBabyTotalPoints(baby.id);
    if (totalEl) totalEl.textContent = total;

    renderTodaySummary(baby);
    renderTrendChart();
    App.BehaviorManager.renderQuickActions();
  }

  /** 渲染今日摘要 */
  function renderTodaySummary(baby) {
    var addEl = $('#todayAddCount');
    var deductEl = $('#todayDeductCount');
    var netEl = $('#todayNetPoints');
    if (!baby) {
      if (addEl) addEl.textContent = '0';
      if (deductEl) deductEl.textContent = '0';
      if (netEl) netEl.textContent = '0';
      return;
    }
    var s = Storage.getBabyTodaySummary(baby.id);
    if (addEl) addEl.textContent = s.addCount;
    if (deductEl) deductEl.textContent = s.deductCount;
    if (netEl) netEl.textContent = (s.net >= 0 ? '+' : '') + s.net;
  }

  /** 触发总积分动画（type: add/deduct） */
  function playPointsAnimation(type) {
    var totalEl = $('#totalPoints');
    if (!totalEl) return;
    var cls = type === 'add' ? 'animate-add' : 'animate-deduct';
    totalEl.classList.remove('animate-add', 'animate-deduct');
    // 强制重排以重新触发动画
    void totalEl.offsetWidth;
    totalEl.classList.add(cls);
    setTimeout(function () {
      totalEl.classList.remove(cls);
    }, 600);
  }

  /** 渲染趋势图（Canvas 柱状图） */
  function renderTrendChart() {
    var canvas = $('#trendChart');
    if (!canvas) return;
    var baby = Storage.getCurrentBaby();
    var ctx = canvas.getContext('2d');

    // 适配设备像素比，保证清晰
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 320;
    var cssH = 180;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.height = cssH + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var days = Utils.lastNDays(currentRange);
    var values = days.map(function (d) {
      return baby ? Storage.getBabyDayNetPoints(baby.id, d) : 0;
    });

    // 计算最大绝对值用于纵轴缩放
    var maxAbs = 1;
    values.forEach(function (v) {
      var a = Math.abs(v);
      if (a > maxAbs) maxAbs = a;
    });

    // 布局参数
    var padLeft = 28;
    var padRight = 10;
    var padTop = 14;
    var padBottom = 24;
    var chartW = cssW - padLeft - padRight;
    var chartH = cssH - padTop - padBottom;
    var zeroY = padTop + chartH / 2; // 零轴居中
    var barCount = days.length;
    var barGap = 2;
    var barW = Math.max(2, (chartW / barCount) - barGap);

    // 绘制零轴
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(cssW - padRight, zeroY);
    ctx.stroke();

    // 绘制纵轴刻度（最大值与负最大值）
    ctx.fillStyle = '#B0B0B0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('+' + maxAbs, padLeft - 4, padTop + 2);
    ctx.fillText('-' + maxAbs, padLeft - 4, padTop + chartH - 2);
    ctx.fillText('0', padLeft - 4, zeroY);

    // 绘制柱子
    var unitH = (chartH / 2) / maxAbs; // 每单位高度
    days.forEach(function (day, i) {
      var v = values[i];
      var x = padLeft + i * (barW + barGap) + barGap / 2;
      var barH = Math.abs(v) * unitH;
      var y;
      if (v >= 0) {
        y = zeroY - barH;
      } else {
        y = zeroY;
      }
      // 柱子颜色
      if (v > 0) {
        ctx.fillStyle = '#26DE81';
      } else if (v < 0) {
        ctx.fillStyle = '#FC5C65';
      } else {
        ctx.fillStyle = '#E8E8E8';
      }
      // 最小可见高度
      if (v !== 0 && barH < 1) barH = 1;
      ctx.fillRect(x, y, barW, barH);

      // 横轴日期标签（7天全显示，30天隔几个显示）
      var showLabel = currentRange === 7 || i % 5 === 0 || i === days.length - 1;
      if (showLabel) {
        ctx.fillStyle = '#B0B0B0';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var label = (day.getMonth() + 1) + '/' + day.getDate();
        ctx.fillText(label, x + barW / 2, padTop + chartH + 4);
      }
    });

    // 无宝宝时显示提示文字
    if (!baby) {
      ctx.fillStyle = '#B0B0B0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('请先选择宝宝', cssW / 2, cssH / 2);
    }
  }

  /** 切换趋势图周期 */
  function setRange(range) {
    currentRange = Number(range);
    // 更新 tab 高亮
    $all('.trend-tab').forEach(function (tab) {
      tab.classList.toggle('active', Number(tab.dataset.range) === currentRange);
    });
    renderTrendChart();
  }

  /** 绑定事件 */
  function bindEvents() {
    // 趋势图周期切换
    $all('.trend-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setRange(tab.dataset.range);
      });
    });
    // 首页引导按钮
    var goBtn = $('#goSettingsFromHome');
    if (goBtn) goBtn.addEventListener('click', function () {
      App.Controller.switchView('settings');
    });
  }

  // ---------- 暴露 API ----------
  App.Dashboard = {
    renderDashboard: renderDashboard,
    renderTodaySummary: renderTodaySummary,
    renderTrendChart: renderTrendChart,
    playPointsAnimation: playPointsAnimation,
    setRange: setRange,
    bindEvents: bindEvents
  };

})(typeof window !== 'undefined' ? window : this);
