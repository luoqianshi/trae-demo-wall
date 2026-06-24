// ============================================================
// TouchSee Charts — ECharts 图表初始化逻辑
// 包含：竞品雷达对比、距离-频率-强度映射曲线、
//       场景障碍物分布、电机区域分布 共 4 张图表
// 全部使用 SVG 渲染、关闭动画、读取 CSS 主题变量配色
// ============================================================
(function (global) {
  'use strict';

  // ====== 读取主题 CSS 变量 ======
  var style = getComputedStyle(document.documentElement);

  function cssVar(name) {
    var v = style.getPropertyValue(name);
    return v ? v.trim() : '';
  }

  // hex 转 rgba（用于半透明叠加色，如区域填充 / 网格线）
  function hexToRgba(hex, alpha) {
    if (!hex) { return 'rgba(148,163,184,' + alpha + ')'; }
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.charAt(0) + hex.charAt(0) +
            hex.charAt(1) + hex.charAt(1) +
            hex.charAt(2) + hex.charAt(2);
    }
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  var bg      = cssVar('--bg');
  var bg2     = cssVar('--bg2');
  var ink     = cssVar('--ink');
  var muted   = cssVar('--muted');
  var accent  = cssVar('--accent');
  var accent2 = cssVar('--accent2');
  var safe    = cssVar('--safe');
  var danger  = cssVar('--danger');
  var warn    = cssVar('--warn');
  var caution = cssVar('--caution');
  var info    = cssVar('--info');
  var cyan    = cssVar('--cyan');

  // 收集所有已初始化图表实例，供 resize 监听统一重绘
  var charts = [];

  // ============================================================
  // 1. 竞品雷达对比图 (#chart-radar)
  //    4 款产品 × 7 维度能力对比，TouchSee 使用 accent 高亮
  // ============================================================
  try {
    var radarEl = document.getElementById('chart-radar');
    if (radarEl && global.echarts) {
      var radarDims = ['双手解放', '保留听觉', '社交隐蔽', '触觉点位', '检测范围', '价格亲民', '全身覆盖'];

      var radarChart = global.echarts.init(radarEl, null, { renderer: 'svg' });
      radarChart.setOption({
        animation: false,
        tooltip: {
          appendToBody: true,
          trigger: 'item',
          formatter: function (params) {
            if (!params || !params.value) { return ''; }
            var html = '<b>' + params.name + '</b><br/>';
            for (var i = 0; i < params.value.length; i++) {
              html += radarDims[i] + ': ' + params.value[i] + '<br/>';
            }
            return html;
          }
        },
        legend: {
          data: ['WeWALK智能盲杖', 'GUIDi智能腰带', '瞳行AI眼镜', '触见TouchSee'],
          bottom: 0,
          textStyle: { color: muted, fontSize: 12 },
          itemGap: 16
        },
        radar: {
          indicator: [
            { name: '双手解放', max: 10 },
            { name: '保留听觉', max: 10 },
            { name: '社交隐蔽', max: 10 },
            { name: '触觉点位', max: 10 },
            { name: '检测范围', max: 10 },
            { name: '价格亲民', max: 10 },
            { name: '全身覆盖', max: 10 }
          ],
          center: ['50%', '47%'],
          radius: '62%',
          nameGap: 8,
          axisName: { color: ink, fontSize: 12 },
          splitLine: { lineStyle: { color: hexToRgba(muted, 0.2) } },
          splitArea: { areaStyle: { color: [hexToRgba(muted, 0.03), hexToRgba(muted, 0.07)] } },
          axisLine: { lineStyle: { color: hexToRgba(muted, 0.2) } }
        },
        series: [{
          type: 'radar',
          symbol: 'circle',
          symbolSize: 6,
          data: [
            {
              value: [3, 5, 2, 2, 3, 4, 2],
              name: 'WeWALK智能盲杖',
              lineStyle: { color: muted, width: 1.5 },
              itemStyle: { color: muted },
              areaStyle: { color: hexToRgba(muted, 0.05) }
            },
            {
              value: [8, 6, 5, 4, 4, 5, 3],
              name: 'GUIDi智能腰带',
              lineStyle: { color: muted, width: 1.5 },
              itemStyle: { color: muted },
              areaStyle: { color: hexToRgba(muted, 0.05) }
            },
            {
              value: [8, 2, 2, 0, 5, 4, 3],
              name: '瞳行AI眼镜',
              lineStyle: { color: muted, width: 1.5 },
              itemStyle: { color: muted },
              areaStyle: { color: hexToRgba(muted, 0.05) }
            },
            {
              value: [10, 10, 10, 9, 9, 9, 9],
              name: '触见TouchSee',
              lineStyle: { color: accent, width: 2.5 },
              itemStyle: { color: accent },
              areaStyle: { color: hexToRgba(accent, 0.3) }
            }
          ]
        }]
      });
      charts.push(radarChart);
    }
  } catch (e) {
    if (global.console) { global.console.error('[TouchSee] 雷达图初始化失败:', e); }
  }

  // ============================================================
  // 2. 距离-频率-强度映射曲线 (#chart-mapping)
  //    双 Y 轴折线图：左轴频率(Hz 0-16)、右轴强度(% 0-100)
  //    X 轴距离 0.5~6.0m，56 个采样点，4 段距离区域着色
  // ============================================================
  try {
    var mappingEl = document.getElementById('chart-mapping');
    if (mappingEl && global.echarts) {
      // 生成 56 个数据点 (0.5m ~ 6.0m，步长 0.1)
      var freqData = [];
      var intensityData = [];
      for (var i = 0; i < 56; i++) {
        var dist = Math.round((0.5 + i * 0.1) * 10) / 10;
        var freq = Math.max(2, Math.min(16, 2 + (4 - dist) * 3.5));
        var inten = Math.max(0.3, Math.min(1, 1 - (dist - 0.5) / 4.5)) * 100;
        freqData.push([dist, Math.round(freq * 100) / 100]);
        intensityData.push([dist, Math.round(inten * 100) / 100]);
      }

      var mappingChart = global.echarts.init(mappingEl, null, { renderer: 'svg' });
      mappingChart.setOption({
        animation: false,
        tooltip: {
          appendToBody: true,
          trigger: 'axis',
          formatter: function (params) {
            if (!params || params.length === 0) { return ''; }
            var d = params[0].value[0];
            var html = '距离: ' + d + ' m<br/>';
            for (var j = 0; j < params.length; j++) {
              var p = params[j];
              var unit = p.seriesName === '频率' ? ' Hz' : ' %';
              html += p.marker + p.seriesName + ': ' + p.value[1] + unit + '<br/>';
            }
            return html;
          }
        },
        legend: {
          data: ['频率', '强度'],
          top: 0,
          textStyle: { color: muted, fontSize: 12 },
          itemGap: 24
        },
        grid: { left: 24, right: 24, top: 48, bottom: 48, containLabel: true },
        xAxis: {
          type: 'value',
          name: '距离 (m)',
          nameLocation: 'middle',
          nameGap: 28,
          min: 0.5,
          max: 6,
          nameTextStyle: { color: muted, fontSize: 12 },
          axisLine: { lineStyle: { color: hexToRgba(muted, 0.4) } },
          axisLabel: { color: muted },
          splitLine: { lineStyle: { color: hexToRgba(muted, 0.08) } }
        },
        yAxis: [
          {
            type: 'value',
            name: '频率 (Hz)',
            min: 0,
            max: 16,
            nameTextStyle: { color: accent, fontSize: 12 },
            axisLine: { lineStyle: { color: hexToRgba(accent, 0.5) } },
            axisLabel: { color: muted },
            splitLine: { lineStyle: { color: hexToRgba(muted, 0.08) } }
          },
          {
            type: 'value',
            name: '强度 (%)',
            min: 0,
            max: 100,
            nameTextStyle: { color: accent2, fontSize: 12 },
            axisLine: { lineStyle: { color: hexToRgba(accent2, 0.5) } },
            axisLabel: { color: muted, formatter: '{value}%' },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '频率',
            type: 'line',
            yAxisIndex: 0,
            showSymbol: false,
            data: freqData,
            lineStyle: { color: accent, width: 2.5 },
            itemStyle: { color: accent },
            markArea: {
              silent: true,
              data: [
                [
                  { xAxis: 0.5, itemStyle: { color: hexToRgba(danger, 0.12) },
                    label: { show: true, formatter: '危险 <1m', color: danger, position: 'insideTopLeft', fontSize: 10, padding: [4, 0, 0, 6] } },
                  { xAxis: 1 }
                ],
                [
                  { xAxis: 1, itemStyle: { color: hexToRgba(warn, 0.12) },
                    label: { show: true, formatter: '警示 1-2m', color: warn, position: 'insideTopLeft', fontSize: 10, padding: [4, 0, 0, 6] } },
                  { xAxis: 2 }
                ],
                [
                  { xAxis: 2, itemStyle: { color: hexToRgba(caution, 0.12) },
                    label: { show: true, formatter: '注意 2-4m', color: caution, position: 'insideTopLeft', fontSize: 10, padding: [4, 0, 0, 6] } },
                  { xAxis: 4 }
                ],
                [
                  { xAxis: 4, itemStyle: { color: hexToRgba(info, 0.12) },
                    label: { show: true, formatter: '感知 >4m', color: info, position: 'insideTopLeft', fontSize: 10, padding: [4, 0, 0, 6] } },
                  { xAxis: 6 }
                ]
              ]
            }
          },
          {
            name: '强度',
            type: 'line',
            yAxisIndex: 1,
            showSymbol: false,
            data: intensityData,
            lineStyle: { color: accent2, width: 2.5 },
            itemStyle: { color: accent2 }
          }
        ]
      });
      charts.push(mappingChart);
    }
  } catch (e) {
    if (global.console) { global.console.error('[TouchSee] 映射曲线图初始化失败:', e); }
  }

  // ============================================================
  // 3. 场景障碍物类型分布 (#chart-scene-dist)
  //    堆叠柱状图：6 场景 × 7 障碍物类型
  // ============================================================
  try {
    var sceneEl = document.getElementById('chart-scene-dist');
    if (sceneEl && global.echarts) {
      var sceneChart = global.echarts.init(sceneEl, null, { renderer: 'svg' });
      sceneChart.setOption({
        animation: false,
        tooltip: {
          appendToBody: true,
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['行人', '车辆', '台阶', '门框', '悬空物', '墙壁', '柱子'],
          bottom: 0,
          textStyle: { color: muted, fontSize: 12 },
          itemGap: 14
        },
        grid: { left: 24, right: 24, top: 24, bottom: 56, containLabel: true },
        xAxis: {
          type: 'category',
          data: ['十字路口', '地铁站', '办公楼', '公园', '商场', '夜间小巷'],
          axisLine: { lineStyle: { color: hexToRgba(muted, 0.4) } },
          axisLabel: { color: muted, fontSize: 12 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          name: '数量',
          nameTextStyle: { color: muted, fontSize: 12 },
          axisLine: { show: false },
          axisLabel: { color: muted },
          splitLine: { lineStyle: { color: hexToRgba(muted, 0.08) } }
        },
        series: [
          { name: '行人',   type: 'bar', stack: 'total', barWidth: '50%', data: [1, 2, 1, 1, 2, 0], itemStyle: { color: accent } },
          { name: '车辆',   type: 'bar', stack: 'total', data: [1, 0, 0, 0, 0, 1], itemStyle: { color: danger } },
          { name: '台阶',   type: 'bar', stack: 'total', data: [0, 1, 0, 1, 0, 0], itemStyle: { color: caution } },
          { name: '门框',   type: 'bar', stack: 'total', data: [0, 0, 1, 0, 1, 0], itemStyle: { color: safe } },
          { name: '悬空物', type: 'bar', stack: 'total', data: [0, 1, 0, 0, 0, 1], itemStyle: { color: accent2 } },
          { name: '墙壁',   type: 'bar', stack: 'total', data: [0, 0, 1, 0, 1, 0], itemStyle: { color: warn } },
          { name: '柱子',   type: 'bar', stack: 'total', data: [1, 0, 0, 1, 0, 1], itemStyle: { color: cyan } }
        ]
      });
      charts.push(sceneChart);
    }
  } catch (e) {
    if (global.console) { global.console.error('[TouchSee] 场景分布图初始化失败:', e); }
  }

  // ============================================================
  // 4. 电机区域分布 (#chart-motor-dist)
  //    柱状图：6 个身体区域的电机数量
  // ============================================================
  try {
    var motorEl = document.getElementById('chart-motor-dist');
    if (motorEl && global.echarts) {
      var motorChart = global.echarts.init(motorEl, null, { renderer: 'svg' });
      motorChart.setOption({
        animation: false,
        tooltip: {
          appendToBody: true,
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: function (params) {
            if (!params || params.length === 0) { return ''; }
            var p = params[0];
            return p.name + '<br/>' + p.marker + '电机数量: ' + p.value + ' 个';
          }
        },
        grid: { left: 24, right: 24, top: 36, bottom: 36, containLabel: true },
        xAxis: {
          type: 'category',
          data: ['前肩(2)', '后肩(2)', '前胸(6)', '后背(6)', '前腰(2)', '后腰(2)'],
          axisLine: { lineStyle: { color: hexToRgba(muted, 0.4) } },
          axisLabel: { color: muted, fontSize: 12 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 8,
          axisLine: { show: false },
          axisLabel: { color: muted },
          splitLine: { lineStyle: { color: hexToRgba(muted, 0.08) } }
        },
        series: [{
          type: 'bar',
          barWidth: '48%',
          data: [2, 2, 6, 6, 2, 2],
          itemStyle: {
            color: accent,
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: ink,
            fontSize: 14,
            fontWeight: 'bold'
          }
        }]
      });
      charts.push(motorChart);
    }
  } catch (e) {
    if (global.console) { global.console.error('[TouchSee] 电机分布图初始化失败:', e); }
  }

  // ====== 窗口尺寸变化时重绘所有图表（防抖 200ms）======
  var resizeTimer = null;
  global.addEventListener('resize', function () {
    if (resizeTimer) { clearTimeout(resizeTimer); }
    resizeTimer = setTimeout(function () {
      for (var k = 0; k < charts.length; k++) {
        if (charts[k]) { charts[k].resize(); }
      }
    }, 200);
  });

})(window);
