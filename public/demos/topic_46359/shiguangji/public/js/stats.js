/**
 * 食光机 - 数据统计页逻辑
 * 使用 ECharts 渲染统计数据可视化
 */

let chartInstances = {};

// ===== 初始化 =====
(async function () {
  const user = await checkAuth();
  if (!user) return;

  await renderNav('stats');

  await loadStats();
})();

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const res = await API.getStats();
    if (res.success && res.data) {
      const stats = res.data;
      updateOverview(stats);
      renderTrendChart(stats.monthlyCount || {});
      renderTagChart(stats.tagCount || {});
      renderMealChart(stats.mealTypeCount || {});
      renderDifficultyChart(stats.difficultyCount || {});
    }
  } catch (err) {
    showToast('加载统计数据失败: ' + err.message, 'error');
    document.querySelectorAll('.chart-container').forEach(function (el) {
      el.innerHTML = '<p class="chart-empty">加载失败</p>';
    });
  }
}

/**
 * 更新概览卡片
 */
function updateOverview(stats) {
  const elTotal = document.getElementById('overviewTotal');
  const elTags = document.getElementById('overviewTags');
  const elRating = document.getElementById('overviewRating');
  const elMonth = document.getElementById('overviewMonth');

  if (elTotal) elTotal.textContent = stats.total || 0;
  if (elTags) elTags.textContent = stats.tagCount ? Object.keys(stats.tagCount).length : 0;
  if (elRating) elRating.textContent = stats.avgRating || '0.0';

  if (elMonth) {
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    elMonth.textContent = (stats.monthlyCount && stats.monthlyCount[monthKey]) || 0;
  }
}

// ===== 图表渲染 =====

/**
 * 从CSS变量获取主题颜色
 */
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: style.getPropertyValue('--accent').trim() || '#D4653B',
    accent2: style.getPropertyValue('--accent2').trim() || '#5A8A6E',
    accentLight: style.getPropertyValue('--accent-light').trim() || '#F4A261',
    ink: style.getPropertyValue('--ink').trim() || '#2D2420',
    muted: style.getPropertyValue('--muted').trim() || '#8C7B72',
    rule: style.getPropertyValue('--rule').trim() || '#E8DDD4',
    bg2: style.getPropertyValue('--bg2').trim() || '#FFF5EB'
  };
}

/**
 * 销毁已有图表
 */
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].dispose();
    delete chartInstances[id];
  }
}

/**
 * 渲染烹饪趋势图（折线图）
 */
function renderTrendChart(monthlyData) {
  const el = document.getElementById('chartTrend');
  if (!el || typeof echarts === 'undefined') return;

  destroyChart('trend');
  const colors = getThemeColors();

  const months = Object.keys(monthlyData).sort();
  const values = months.map(function (m) { return monthlyData[m]; });

  if (months.length === 0) {
    el.innerHTML = '<p class="chart-empty">暂无数据，快去记录你的第一道菜吧</p>';
    return;
  }

  const chart = echarts.init(el, null, { renderer: 'svg' });
  chartInstances['trend'] = chart;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: colors.bg2,
      borderColor: colors.rule,
      textStyle: { color: colors.ink }
    },
    grid: { top: 30, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: months.map(function (m) { return m.replace('-', '/'); }),
      axisLine: { lineStyle: { color: colors.rule } },
      axisLabel: { color: colors.muted, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.rule, type: 'dashed' } },
      axisLabel: { color: colors.muted, fontSize: 11 }
    },
    series: [{
      name: '烹饪次数',
      type: 'line',
      smooth: true,
      data: values,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: colors.accent, width: 3 },
      itemStyle: { color: colors.accent },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: colors.accent + '40' },
            { offset: 1, color: colors.accent + '05' }
          ]
        }
      }
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
}

/**
 * 渲染标签分布图（饼图）
 */
function renderTagChart(tagCount) {
  const el = document.getElementById('chartTags');
  if (!el || typeof echarts === 'undefined') return;

  destroyChart('tags');
  const colors = getThemeColors();

  const data = Object.entries(tagCount)
    .sort(function (a, b) { return b[1] - a[1]; })
    .slice(0, 8)
    .map(function (entry) { return { name: entry[0], value: entry[1] }; });

  if (data.length === 0) {
    el.innerHTML = '<p class="chart-empty">暂无数据</p>';
    return;
  }

  const chart = echarts.init(el, null, { renderer: 'svg' });
  chartInstances['tags'] = chart;

  const palette = [colors.accent, colors.accent2, colors.accentLight, '#E76F51', '#8FBC8F', '#E9C46A', '#B5838D', '#6D6875'];

  chart.setOption({
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: colors.bg2,
      borderColor: colors.rule,
      textStyle: { color: colors.ink },
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: colors.muted, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: colors.bg2, borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: colors.ink }
      },
      data: data.map(function (d, i) {
        return { name: d.name, value: d.value, itemStyle: { color: palette[i % palette.length] } };
      })
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
}

/**
 * 渲染餐次分布图（柱状图）
 */
function renderMealChart(mealTypeCount) {
  const el = document.getElementById('chartMeals');
  if (!el || typeof echarts === 'undefined') return;

  destroyChart('meals');
  const colors = getThemeColors();

  const labels = ['早餐', '午餐', '晚餐', '加餐'];
  const keys = ['breakfast', 'lunch', 'dinner', 'snack'];
  const values = keys.map(function (k) { return mealTypeCount[k] || 0; });

  if (values.every(function (v) { return v === 0; })) {
    el.innerHTML = '<p class="chart-empty">暂无数据</p>';
    return;
  }

  const chart = echarts.init(el, null, { renderer: 'svg' });
  chartInstances['meals'] = chart;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: colors.bg2,
      borderColor: colors.rule,
      textStyle: { color: colors.ink },
      axisPointer: { type: 'shadow' }
    },
    grid: { top: 30, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: colors.rule } },
      axisLabel: { color: colors.muted, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.rule, type: 'dashed' } },
      axisLabel: { color: colors.muted, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: values.map(function (v, i) {
        return {
          value: v,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: i % 2 === 0 ? colors.accent : colors.accent2 },
                { offset: 1, color: i % 2 === 0 ? colors.accentLight : '#8FBC8F' }
              ]
            },
            borderRadius: [8, 8, 0, 0]
          }
        };
      }),
      barWidth: '50%'
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
}

/**
 * 渲染难度分布图（环形图）
 */
function renderDifficultyChart(difficultyCount) {
  const el = document.getElementById('chartDifficulty');
  if (!el || typeof echarts === 'undefined') return;

  destroyChart('difficulty');
  const colors = getThemeColors();

  const allData = [
    { name: '简单', value: difficultyCount.easy || 0, color: colors.accent2 },
    { name: '中等', value: difficultyCount.medium || 0, color: colors.accent },
    { name: '进阶', value: difficultyCount.hard || 0, color: '#C0392B' }
  ];

  const data = allData.filter(function (d) { return d.value > 0; });

  if (data.length === 0) {
    el.innerHTML = '<p class="chart-empty">暂无数据</p>';
    return;
  }

  const chart = echarts.init(el, null, { renderer: 'svg' });
  chartInstances['difficulty'] = chart;

  const total = data.reduce(function (s, d) { return s + d.value; }, 0);

  chart.setOption({
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: colors.bg2,
      borderColor: colors.rule,
      textStyle: { color: colors.ink },
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      bottom: 10,
      textStyle: { color: colors.muted, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 8, borderColor: colors.bg2, borderWidth: 3 },
      label: {
        show: true,
        position: 'center',
        formatter: '{c|总记录}\n{b|' + total + '}',
        rich: {
          c: { fontSize: 12, color: colors.muted, lineHeight: 20 },
          b: { fontSize: 28, fontWeight: 'bold', color: colors.accent }
        }
      },
      emphasis: { label: { show: true } },
      data: data.map(function (d) {
        return { name: d.name, value: d.value, itemStyle: { color: d.color } };
      })
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
}
