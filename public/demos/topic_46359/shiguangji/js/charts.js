/**
 * 食光机 - 图表模块
 * 使用 ECharts 渲染统计数据可视化
 */
const Charts = (function () {
  let chartInstances = {};

  /**
   * 从CSS变量获取颜色
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
    if (!el) return;

    destroyChart('trend');
    const colors = getThemeColors();

    const months = Object.keys(monthlyData).sort();
    const values = months.map(m => monthlyData[m]);

    if (months.length === 0) {
      el.innerHTML = '<p class="chart-empty">暂无数据</p>';
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
        data: months.map(m => m.replace('-', '/')),
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
        },
        animation: false
      }]
    });

    window.addEventListener('resize', () => chart.resize());
  }

  /**
   * 渲染标签分布图（饼图）
   */
  function renderTagChart(tagCount) {
    const el = document.getElementById('chartTags');
    if (!el) return;

    destroyChart('tags');
    const colors = getThemeColors();

    const data = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

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
        data: data.map((d, i) => ({ ...d, itemStyle: { color: palette[i % palette.length] } })),
        animation: false
      }]
    });

    window.addEventListener('resize', () => chart.resize());
  }

  /**
   * 渲染餐次分布图（柱状图）
   */
  function renderMealChart(mealTypeCount) {
    const el = document.getElementById('chartMeals');
    if (!el) return;

    destroyChart('meals');
    const colors = getThemeColors();

    const labels = ['早餐', '午餐', '晚餐', '加餐'];
    const keys = ['breakfast', 'lunch', 'dinner', 'snack'];
    const values = keys.map(k => mealTypeCount[k] || 0);
    const icons = ['🌅', '☀️', '🌙', '🍪'];

    if (values.every(v => v === 0)) {
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
        data: values.map((v, i) => ({
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
        })),
        barWidth: '50%',
        animation: false
      }]
    });

    window.addEventListener('resize', () => chart.resize());
  }

  /**
   * 渲染难度分布图（环形图）
   */
  function renderDifficultyChart(difficultyCount) {
    const el = document.getElementById('chartDifficulty');
    if (!el) return;

    destroyChart('difficulty');
    const colors = getThemeColors();

    const data = [
      { name: '简单', value: difficultyCount.easy || 0 },
      { name: '中等', value: difficultyCount.medium || 0 },
      { name: '进阶', value: difficultyCount.hard || 0 }
    ].filter(d => d.value > 0);

    if (data.length === 0) {
      el.innerHTML = '<p class="chart-empty">暂无数据</p>';
      return;
    }

    const chart = echarts.init(el, null, { renderer: 'svg' });
    chartInstances['difficulty'] = chart;

    chart.setOption({
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: colors.bg2,
        borderColor: colors.rule,
        textStyle: { color: colors.ink },
        formatter: '{b}: {c}次 ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 8, borderColor: colors.bg2, borderWidth: 3 },
        label: {
          show: true,
          position: 'center',
          formatter: '{c|总记录}\n{b|' + data.reduce((s, d) => s + d.value, 0) + '}',
          rich: {
            c: { fontSize: 12, color: colors.muted, lineHeight: 20 },
            b: { fontSize: 28, fontWeight: 'bold', color: colors.accent }
          }
        },
        emphasis: { label: { show: true } },
        data: [
          { ...data[0], itemStyle: { color: colors.accent2 } },
          { ...data[1], itemStyle: { color: colors.accent } },
          { ...data[2], itemStyle: { color: '#C0392B' } }
        ].filter(d => d.value !== undefined),
        animation: false
      }]
    });

    window.addEventListener('resize', () => chart.resize());
  }

  /**
   * 渲染所有图表
   */
  function renderAllCharts(stats) {
    renderTrendChart(stats.monthlyCount);
    renderTagChart(stats.tagCount);
    renderMealChart(stats.mealTypeCount);
    renderDifficultyChart(stats.difficultyCount);
  }

  return {
    renderAllCharts,
    renderTrendChart,
    renderTagChart,
    renderMealChart,
    renderDifficultyChart
  };
})();
