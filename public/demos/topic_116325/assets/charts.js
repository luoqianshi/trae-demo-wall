/**
 * 福特宝赛程助手 - 纯 CSS/JS 柱形图组件
 * 文件路径: e:\报名\fortebow-demo\assets\charts.js
 * 说明: 不依赖 ECharts 或任何外部库，使用纯 CSS+JS 实现积分对比柱形图
 */

;(function() {
  'use strict';

  // ========== 积分榜数据（与主 HTML 同步） ==========
  var STANDINGS = [
    { team: '计算机学院', short: '计算机', color: '#1890ff', pts: 12, gf: 12, ga: 4, group: 'A' },
    { team: '体育学院',   short: '体育',   color: '#f5222d', pts: 10, gf: 10, ga: 5, group: 'B' },
    { team: '经济管理学院', short: '经管', color: '#13c2c2', pts: 9,  gf: 8,  ga: 6, group: 'A' },
    { team: '电子信息学院', short: '电信', color: '#722ed1', pts: 8,  gf: 7,  ga: 5, group: 'A' },
    { team: '土木建筑学院', short: '土木', color: '#52c41a', pts: 7,  gf: 6,  ga: 7, group: 'B' },
    { team: '机械工程学院', short: '机械', color: '#fa8c16', pts: 5,  gf: 5,  ga: 8, group: 'A' },
    { team: '文法学院',   short: '文法',   color: '#eb2f96', pts: 4,  gf: 4,  ga: 9, group: 'B' },
    { team: '理学院',     short: '理学',   color: '#fa541c', pts: 1,  gf: 3,  ga: 11, group: 'B' }
  ];

  /**
   * 注入柱形图所需的 CSS 样式
   * 仅在尚未注入时执行
   */
  function injectStyles() {
    if (document.getElementById('fortebow-charts-style')) return;

    var style = document.createElement('style');
    style.id = 'fortebow-charts-style';
    style.textContent = [
      /* 柱形图容器 */
      '.fb-chart-wrapper {',
      '  background: #fff;',
      '  border-radius: 12px;',
      '  padding: 16px;',
      '  margin-top: 16px;',
      '  box-shadow: 0 1px 4px rgba(0,0,0,0.06);',
      '}',

      /* 图表标题行 */
      '.fb-chart-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  margin-bottom: 14px;',
      '}',
      '.fb-chart-header h3 {',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  color: #333;',
      '}',
      '.fb-chart-legend {',
      '  display: flex;',
      '  gap: 12px;',
      '  font-size: 11px;',
      '  color: #999;',
      '}',
      '.fb-chart-legend span::before {',
      '  content: "";',
      '  display: inline-block;',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 2px;',
      '  margin-right: 4px;',
      '  vertical-align: middle;',
      '}',
      '.fb-chart-legend .leg-pts::before { background: #1a8c3a; }',
      '.fb-chart-legend .leg-gf::before { background: #1890ff; }',
      '.fb-chart-legend .leg-ga::before { background: #ff4d4f; }',

      /* 图表主体 */
      '.fb-chart-body {',
      '  display: flex;',
      '  align-items: flex-end;',
      '  justify-content: space-around;',
      '  height: 180px;',
      '  padding: 0 4px;',
      '  border-bottom: 1px solid #eee;',
      '  position: relative;',
      '}',

      /* 单柱组 */
      '.fb-bar-group {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  flex: 1;',
      '  max-width: 52px;',
      '}',

      /* 柱顶数值 */
      '.fb-bar-val {',
      '  font-size: 9px;',
      '  color: #666;',
      '  font-weight: 600;',
      '  margin-bottom: 3px;',
      '  white-space: nowrap;',
      '}',

      /* 柱体容器（多柱并列） */
      '.fb-bars {',
      '  display: flex;',
      '  align-items: flex-end;',
      '  gap: 2px;',
      '}',

      /* 单根柱子 */
      '.fb-bar {',
      '  width: 12px;',
      '  border-radius: 3px 3px 0 0;',
      '  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);',
      '  min-height: 2px;',
      '}',

      /* 底部标签 */
      '.fb-bar-label {',
      '  font-size: 9px;',
      '  color: #999;',
      '  margin-top: 6px;',
      '  text-align: center;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  max-width: 48px;',
      '}',

      /* Y 轴参考线 */
      '.fb-chart-gridlines {',
      '  position: absolute;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none;',
      '}',
      '.fb-gridline {',
      '  position: absolute;',
      '  left: 0; right: 0;',
      '  border-top: 1px dashed #f0f0f0;',
      '}',
      '.fb-gridline-label {',
      '  position: absolute;',
      '  left: -2px;',
      '  transform: translateY(-50%);',
      '  font-size: 9px;',
      '  color: #ccc;',
      '}',

      /* 进球失球对比图 */
      '.fb-compare-row {',
      '  display: flex;',
      '  align-items: center;',
      '  padding: 8px 0;',
      '  border-bottom: 1px solid #f8f8f8;',
      '  font-size: 12px;',
      '}',
      '.fb-compare-row:last-child { border-bottom: none; }',
      '.fb-compare-name {',
      '  width: 64px;',
      '  color: #333;',
      '  font-weight: 500;',
      '  font-size: 11px;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '}',
      '.fb-compare-bars {',
      '  flex: 1;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '}',
      '.fb-compare-bar {',
      '  height: 10px;',
      '  border-radius: 5px;',
      '  transition: width 0.5s ease;',
      '  min-width: 2px;',
      '}',
      '.fb-compare-num {',
      '  font-size: 10px;',
      '  color: #999;',
      '  min-width: 18px;',
      '  text-align: center;',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  /**
   * 渲染积分柱形图
   * @param {string} containerId - 容器 DOM ID
   * @param {object} options - 配置项
   */
  function renderPointsChart(containerId, options) {
    var opts = options || {};
    var group = opts.group || 'all';
    var showLegend = opts.showLegend !== false;
    var animate = opts.animate !== false;

    injectStyles();

    var container = document.getElementById(containerId);
    if (!container) return;

    // 按组筛选
    var data = STANDINGS;
    if (group && group !== 'all') {
      data = data.filter(function(s) { return s.group === group.toUpperCase(); });
    }

    // 按积分降序
    data = data.slice().sort(function(a, b) { return b.pts - a.pts; });

    var maxPts = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].pts > maxPts) maxPts = data[i].pts;
    }
    maxPts = Math.max(maxPts, 1);

    // 计算 Y 轴刻度
    var gridStep = maxPts <= 5 ? 1 : (maxPts <= 10 ? 2 : 5);
    var gridlines = '';
    for (var v = 0; v <= maxPts; v += gridStep) {
      var bottom = (v / maxPts) * 100;
      gridlines += '<div class="fb-gridline" style="bottom:' + bottom + '%">';
      gridlines += '<span class="fb-gridline-label">' + v + '</span></div>';
    }

    // 构建 HTML
    var html = '<div class="fb-chart-wrapper">';
    html += '<div class="fb-chart-header"><h3>' + (opts.title || '积分对比') + '</h3>';
    if (showLegend) {
      html += '<div class="fb-chart-legend">';
      html += '<span class="leg-pts">积分</span>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="fb-chart-body">';
    html += '<div class="fb-chart-gridlines">' + gridlines + '</div>';

    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var h = Math.max(2, (d.pts / maxPts) * 100);
      var barHeight = animate ? '0%' : h + '%';

      html += '<div class="fb-bar-group">';
      html += '<div class="fb-bar-val">' + d.pts + '</div>';
      html += '<div class="fb-bars">';
      html += '<div class="fb-bar" data-target="' + h + '" style="height:' + barHeight + '%;background:' + d.color + '"></div>';
      html += '</div>';
      html += '<div class="fb-bar-label">' + d.short + '</div>';
      html += '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;

    // 动画
    if (animate) {
      setTimeout(function() {
        var bars = container.querySelectorAll('.fb-bar');
        for (var j = 0; j < bars.length; j++) {
          (function(bar) {
            setTimeout(function() {
              bar.style.height = bar.getAttribute('data-target') + '%';
            }, 100 + j * 80);
          })(bars[j]);
        }
      }, 50);
    }
  }

  /**
   * 渲染进球/失球对比条形图
   * @param {string} containerId - 容器 DOM ID
   * @param {object} options - 配置项
   */
  function renderGoalsChart(containerId, options) {
    var opts = options || {};
    var group = opts.group || 'all';
    var limit = opts.limit || 8;

    injectStyles();

    var container = document.getElementById(containerId);
    if (!container) return;

    var data = STANDINGS;
    if (group && group !== 'all') {
      data = data.filter(function(s) { return s.group === group.toUpperCase(); });
    }

    // 按净球排序
    data = data.slice().sort(function(a, b) { return (b.gf - b.ga) - (a.gf - a.ga); });
    if (data.length > limit) data = data.slice(0, limit);

    var maxGoals = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].gf > maxGoals) maxGoals = data[i].gf;
    }
    maxGoals = Math.max(maxGoals, 1);

    var html = '<div class="fb-chart-wrapper">';
    html += '<div class="fb-chart-header"><h3>进球 / 失球对比</h3>';
    html += '<div class="fb-chart-legend">';
    html += '<span class="leg-gf">进球</span>';
    html += '<span class="leg-ga">失球</span>';
    html += '</div></div>';

    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var gfW = Math.max(4, (d.gf / maxGoals) * 100);
      var gaW = Math.max(4, (d.ga / maxGoals) * 100);

      html += '<div class="fb-compare-row">';
      html += '<div class="fb-compare-name">' + d.short + '</div>';
      html += '<div class="fb-compare-bars">';
      html += '<div class="fb-compare-num">' + d.gf + '</div>';
      html += '<div class="fb-compare-bar" style="width:' + gfW + '%;background:#1a8c3a"></div>';
      html += '<div class="fb-compare-bar" style="width:' + gaW + '%;background:#ff4d4f"></div>';
      html += '<div class="fb-compare-num">' + d.ga + '</div>';
      html += '</div></div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ========== 暴露到全局 ============
  window.ForteBowCharts = {
    renderPointsChart: renderPointsChart,
    renderGoalsChart: renderGoalsChart,
    _data: STANDINGS
  };

})();
