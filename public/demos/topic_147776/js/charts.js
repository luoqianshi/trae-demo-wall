/**
 * ECharts 图表渲染模块
 */

const COLORS = {
  blue: '#00d4ff',
  cyan: '#00f5d4',
  purple: '#7b2dff',
  orange: '#ff6b35',
  red: '#ff2d55',
  green: '#00e676',
  yellow: '#ffd600',
  pink: '#ff6ec7'
};

const GRADIENT_COLORS = [
  ['#00d4ff', '#00f5d4'],
  ['#7b2dff', '#00d4ff'],
  ['#ff6b35', '#ffd600'],
  ['#ff2d55', '#ff6ec7'],
  ['#00e676', '#00f5d4'],
  ['#00d4ff', '#7b2dff']
];

let chartInstances = {};

function initCharts() {
  chartInstances = {
    timeTrend: echarts.init(document.getElementById('chart-time-trend')),
    regionMap: echarts.init(document.getElementById('chart-region-map')),
    salesRank: echarts.init(document.getElementById('chart-sales-rank')),
    customerAnalysis: echarts.init(document.getElementById('chart-customer')),
    productAnalysis: echarts.init(document.getElementById('chart-product')),
    industryChart: echarts.init(document.getElementById('chart-industry'))
  };

  window.addEventListener('resize', () => {
    Object.values(chartInstances).forEach(chart => chart.resize());
  });
}

function getChartOption(title) {
  return {
    title: {
      show: false
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: null
    }
  };
}

function formatAmount(value) {
  if (value >= 100000000) return (value / 100000000).toFixed(2) + '亿';
  if (value >= 10000) return (value / 10000).toFixed(2) + '万';
  return value.toFixed(0);
}

// ====== KPI 卡片更新 ======
function updateKPICards(kpis, prevKpis) {
  const cards = [
    { id: 'kpi-amount', value: kpis.totalAmount, format: v => '¥' + formatAmount(v), prev: prevKpis ? prevKpis.totalAmount : null },
    { id: 'kpi-orders', value: kpis.orderCount, format: v => v.toLocaleString(), prev: prevKpis ? prevKpis.orderCount : null },
    { id: 'kpi-customers', value: kpis.customerCount, format: v => v.toString(), prev: prevKpis ? prevKpis.customerCount : null },
    { id: 'kpi-avg', value: kpis.avgOrderValue, format: v => '¥' + formatAmount(v), prev: prevKpis ? prevKpis.avgOrderValue : null }
  ];

  cards.forEach(card => {
    const valueEl = document.querySelector(`#${card.id} .kpi-value`);
    const trendEl = document.querySelector(`#${card.id} .kpi-trend`);
    const progressEl = document.querySelector(`#${card.id} .kpi-progress-bar`);

    animateNumber(valueEl, card.value, card.format);

    if (card.prev !== null && card.prev > 0) {
      const growth = ((card.value - card.prev) / card.prev * 100).toFixed(1);
      const isUp = growth > 0;
      trendEl.className = `kpi-trend ${isUp ? 'up' : 'down'}`;
      trendEl.innerHTML = `<span>${isUp ? '▲' : '▼'}</span><span>${Math.abs(growth)}% 同比</span>`;
    }

    if (progressEl) {
      const maxVal = Math.max(card.value, card.prev || card.value);
      const pct = maxVal > 0 ? (card.value / maxVal * 100) : 100;
      progressEl.style.width = pct + '%';
    }
  });
}

function animateNumber(el, target, formatter) {
  const duration = 1000;
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (target - startVal) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ====== 时间趋势图 ======
function renderTimeTrend(engine, data) {
  const chart = chartInstances.timeTrend;
  const drillPath = engine.getDrillPath();
  const timeDrill = drillPath.find(p => p.dimension === 'year' || p.dimension === 'quarter' || p.dimension === 'month');

  let grouped, xData, seriesData, titleText;

  if (!timeDrill) {
    grouped = engine.aggregateBy(data, 'year');
    xData = grouped.map(g => g.name + '年').sort();
    seriesData = grouped.sort((a, b) => a.name - b.name).map(g => g.amount);
    titleText = '年度销售趋势（点击年份钻取）';
  } else if (timeDrill.dimension === 'year') {
    grouped = engine.aggregateBy(data, 'quarter');
    xData = ['Q1', 'Q2', 'Q3', 'Q4'];
    const map = {};
    grouped.forEach(g => { map[g.name] = g.amount; });
    seriesData = xData.map(q => map[q] || 0);
    titleText = `${timeDrill.value}年 季度销售趋势（点击季度钻取）`;
  } else if (timeDrill.dimension === 'quarter') {
    grouped = engine.aggregateBy(data, 'month');
    xData = Array.from({ length: 12 }, (_, i) => (i + 1) + '月');
    const map = {};
    grouped.forEach(g => { map[g.name] = g.amount; });
    seriesData = Array.from({ length: 12 }, (_, i) => map[i + 1] || 0);
    titleText = '月度销售趋势';
  } else {
    grouped = engine.aggregateBy(data, 'date');
    grouped.sort((a, b) => a.name.localeCompare(b.name));
    xData = grouped.map(g => g.name);
    seriesData = grouped.map(g => g.amount);
    titleText = '日度销售趋势';
  }

  const option = {
    ...getChartOption(),
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: params => {
        const p = params[0];
        return `${p.name}<br/>销售额: ¥${formatAmount(p.value)}`;
      }
    },
    grid: { top: 40, right: 20, bottom: 30, left: 80 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: v => formatAmount(v) }
    },
    series: [{
      type: 'line',
      data: seriesData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#00d4ff' },
          { offset: 1, color: '#00f5d4' }
        ])
      },
      itemStyle: { color: '#00f5d4', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
          { offset: 1, color: 'rgba(0, 212, 255, 0.02)' }
        ])
      }
    }],
    graphic: [{
      type: 'text',
      left: 10,
      top: 5,
      style: {
        text: titleText,
        fill: 'rgba(255,255,255,0.5)',
        fontSize: 12
      }
    }]
  };

  chart.setOption(option, true);

  chart.off('click');
  chart.on('click', params => {
    const name = params.name;
    if (!timeDrill) {
      const year = parseInt(name);
      engine.drillDown('year', year);
    } else if (timeDrill.dimension === 'year') {
      const quarter = name;
      engine.drillDown('quarter', quarter);
    }
  });
}

// ====== 地区地图 ======
async function renderRegionMap(engine, data) {
  const chart = chartInstances.regionMap;
  const drillPath = engine.getDrillPath();
  const regionDrill = drillPath.find(p => p.dimension === 'province');

  if (!regionDrill) {
    const provinceData = engine.aggregateBy(data, 'region_province');
    const mapData = provinceData.map(p => ({
      name: p.name,
      value: p.amount
    }));

    const option = {
      ...getChartOption(),
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 39, 0.9)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        formatter: p => `${p.name}<br/>销售额: ¥${formatAmount(p.value)}`
      },
      visualMap: {
        min: 0,
        max: Math.max(...mapData.map(d => d.value), 1),
        left: 'left',
        bottom: 20,
        text: ['高', '低'],
        textStyle: { color: 'rgba(255,255,255,0.7)' },
        inRange: {
          color: ['#0a0e27', '#0f1a3c', '#1a3a6c', '#00d4ff', '#00f5d4']
        },
        calculable: true
      },
      geo: {
        map: 'china',
        roam: false,
        zoom: 1.2,
        label: {
          show: false
        },
        itemStyle: {
          areaColor: '#0f1a3c',
          borderColor: '#00d4ff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            areaColor: '#1a3a6c',
            borderColor: '#00f5d4',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#fff'
          }
        }
      },
      series: [{
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data: mapData
      }]
    };

    chart.setOption(option, true);

    chart.off('click');
    chart.on('click', params => {
      if (params.componentType === 'geo' || params.componentType === 'series') {
        const province = params.name;
        if (data.some(d => d.region_province === province)) {
          engine.drillDown('province', province);
        }
      }
    });
  } else {
    const cityData = engine.aggregateBy(data, 'region_city');
    const barData = cityData.slice(0, 10);

    const option = {
      ...getChartOption(),
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 14, 39, 0.9)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        formatter: params => `${params[0].name}<br/>销售额: ¥${formatAmount(params[0].value)}`
      },
      grid: { top: 20, right: 20, bottom: 30, left: 80 },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: v => formatAmount(v) }
      },
      yAxis: {
        type: 'category',
        data: barData.map(d => d.name).reverse(),
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
        axisLabel: { color: 'rgba(255,255,255,0.7)' }
      },
      series: [{
        type: 'bar',
        data: barData.map(d => d.amount).reverse(),
        barWidth: 15,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#00f5d4' }
          ])
        }
      }]
    };

    chart.setOption(option, true);
    chart.off('click');
  }
}

// ====== 销售员排行榜 ======
function renderSalesRank(engine, data) {
  const chart = chartInstances.salesRank;
  const rankData = engine.aggregateBy(data, 'salesperson_name').slice(0, 10);

  const option = {
    ...getChartOption(),
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: params => `${params[0].name}<br/>销售额: ¥${formatAmount(params[0].value)}`
    },
    grid: { top: 10, right: 30, bottom: 10, left: 80 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'category',
      data: rankData.map(d => d.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: rankData.map((d, i) => ({
        value: d.amount,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: i >= 7 ? '#ff6b35' : '#00d4ff' },
            { offset: 1, color: i >= 7 ? '#ffd600' : '#00f5d4' }
          ])
        }
      })).reverse(),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        formatter: p => '¥' + formatAmount(p.value)
      }
    }]
  };

  chart.setOption(option, true);

  chart.off('click');
  chart.on('click', params => {
    const name = params.name;
    engine.updateFilter('salesperson', name);
  });
}

// ====== 客户分析 ======
function renderCustomerAnalysis(engine, data) {
  const chart = chartInstances.customerAnalysis;
  const topCustomers = engine.aggregateBy(data, 'customer_name').slice(0, 8);
  const industryData = engine.aggregateBy(data, 'customer_industry');

  const option = {
    ...getChartOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: p => `${p.name}<br/>销售额: ¥${formatAmount(p.value)}`
    },
    legend: {
      show: false
    },
    grid: { top: 10, right: '50%', bottom: 10, left: 10 },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      data: topCustomers.map(d => d.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        width: 80,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: '客户排行',
        type: 'bar',
        data: topCustomers.map((d, i) => ({
          value: d.amount,
          itemStyle: {
            borderRadius: [0, 3, 3, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#7b2dff' },
              { offset: 1, color: '#00d4ff' }
            ])
          }
        })).reverse(),
        barWidth: 10,
        gridIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0
      },
      {
        name: '行业分布',
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['75%', '50%'],
        roseType: 'area',
        label: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: 10
        },
        data: industryData.map((d, i) => ({
          name: d.name,
          value: d.amount,
          itemStyle: {
            color: [COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.orange, COLORS.green, COLORS.yellow, COLORS.pink, COLORS.red][i % 8]
          }
        }))
      }
    ]
  };

  chart.setOption(option, true);

  chart.off('click');
  chart.on('click', params => {
    if (params.seriesType === 'bar') {
      engine.updateFilter('customer', params.name);
    } else if (params.seriesType === 'pie') {
      engine.updateFilter('customerIndustry', params.name);
    }
  });
}

// ====== 商品分析 ======
function renderProductAnalysis(engine, data) {
  const chart = chartInstances.productAnalysis;
  const categoryData = engine.aggregateBy(data, 'product_category');
  const topProducts = engine.aggregateBy(data, 'product_name').slice(0, 8);

  const option = {
    ...getChartOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: p => `${p.name}<br/>销售额: ¥${formatAmount(p.value)}`
    },
    legend: { show: false },
    grid: { top: 10, right: 10, bottom: 10, left: '50%' },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      data: topProducts.map(d => d.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        width: 100,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: '品类占比',
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['25%', '50%'],
        label: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: 10,
          formatter: '{b}\n{d}%'
        },
        data: categoryData.map((d, i) => ({
          name: d.name,
          value: d.amount,
          itemStyle: {
            color: [COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.orange, COLORS.green, COLORS.yellow, COLORS.pink, COLORS.red][i % 8]
          }
        }))
      },
      {
        name: '热销商品',
        type: 'bar',
        data: topProducts.map((d, i) => ({
          value: d.amount,
          itemStyle: {
            borderRadius: [0, 3, 3, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#ff6b35' },
              { offset: 1, color: '#ffd600' }
            ])
          }
        })).reverse(),
        barWidth: 10,
        gridIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0
      }
    ]
  };

  chart.setOption(option, true);

  chart.off('click');
  chart.on('click', params => {
    if (params.seriesType === 'pie') {
      engine.updateFilter('productCategory', params.name);
    } else if (params.seriesType === 'bar') {
      engine.updateFilter('product', params.name);
    }
  });
}

// ====== 行业分布图 ======
function renderIndustryChart(engine, data) {
  const chart = chartInstances.industryChart;
  const industryData = engine.aggregateBy(data, 'customer_industry');

  const option = {
    ...getChartOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 39, 0.9)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: p => `${p.name}<br/>销售额: ¥${formatAmount(p.value)}<br/>占比: ${p.percent}%`
    },
    series: [{
      type: 'pie',
      radius: ['0%', '70%'],
      center: ['50%', '55%'],
      roseType: 'radius',
      label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        formatter: '{b}\n¥{c}'
      },
      labelLine: {
        lineStyle: { color: 'rgba(0, 212, 255, 0.5)' }
      },
      data: industryData.map((d, i) => ({
        name: d.name,
        value: d.amount,
        itemStyle: {
          color: [COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.orange, COLORS.green, COLORS.yellow, COLORS.pink, COLORS.red][i % 8],
          shadowBlur: 10,
          shadowColor: 'rgba(0, 212, 255, 0.3)'
        }
      }))
    }]
  };

  chart.setOption(option, true);

  chart.off('click');
  chart.on('click', params => {
    engine.updateFilter('customerIndustry', params.name);
  });
}

// ====== 更新面包屑 ======
function updateBreadcrumb(drillPath) {
  const container = document.getElementById('breadcrumb');
  container.innerHTML = '';

  const root = document.createElement('span');
  root.className = `breadcrumb-item ${drillPath.length === 0 ? 'active' : ''}`;
  root.textContent = '全国总览';
  root.onclick = () => {
    if (drillPath.length > 0) {
      window.linkageEngine.resetAllFilters();
    }
  };
  container.appendChild(root);

  drillPath.forEach((item, index) => {
    const sep = document.createElement('span');
    sep.className = 'breadcrumb-separator';
    sep.textContent = ' > ';
    container.appendChild(sep);

    const crumb = document.createElement('span');
    const isLast = index === drillPath.length - 1;
    crumb.className = `breadcrumb-item ${isLast ? 'active' : ''}`;
    crumb.textContent = item.value;
    if (!isLast) {
      crumb.onclick = () => {
        window.linkageEngine.drillUp(index + 1);
      };
    }
    container.appendChild(crumb);
  });
}

// ====== 更新筛选器 ======
function updateFilterSelects(filterState) {
  const yearSelect = document.getElementById('filter-year');
  const categorySelect = document.getElementById('filter-category');

  if (filterState.year) yearSelect.value = filterState.year;
  else yearSelect.value = '';

  if (filterState.productCategory) categorySelect.value = filterState.productCategory;
  else categorySelect.value = '';
}

window.ChartManager = {
  initCharts,
  updateKPICards,
  renderTimeTrend,
  renderRegionMap,
  renderSalesRank,
  renderCustomerAnalysis,
  renderProductAnalysis,
  renderIndustryChart,
  updateBreadcrumb,
  updateFilterSelects
};
