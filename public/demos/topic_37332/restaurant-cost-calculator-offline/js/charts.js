// ==================== 图表渲染 ====================

class ChartRenderer {
  constructor() {
    this.charts = {};
    this.colorPalette = {
      green: '#00704A',
      greenLight: '#008c5e',
      blue: '#3B82F6',
      red: '#EF4444',
      amber: '#F59E0B',
      purple: '#8B5CF6',
      teal: '#14B8A6',
      orange: '#F97316'
    };
  }

  // 销毁所有图表
  destroyAll() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.dispose) {
        chart.dispose();
      }
    });
    this.charts = {};
  }

  // KPI 卡片
  renderKPIs(kpis, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const formatMoney = (num) => {
      return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPercent = (num) => {
      return num.toFixed(2) + '%';
    };

    container.innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kpi-card rounded-2xl p-6 hover-lift">
          <div class="text-xs text-gray-400 mb-1 font-medium tracking-wider">TOTAL REVENUE</div>
          <div class="text-sm text-gray-600 mb-2">总收入</div>
          <div class="text-2xl font-black text-gray-800">${formatMoney(kpis.totalRevenue)}</div>
          <div class="text-xs text-sb-green mt-2 font-medium flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            ${kpis.totalUnits} 杯销量
          </div>
        </div>
        <div class="kpi-card rounded-2xl p-6 hover-lift">
          <div class="text-xs text-gray-400 mb-1 font-medium tracking-wider">TOTAL COST</div>
          <div class="text-sm text-gray-600 mb-2">总成本</div>
          <div class="text-2xl font-black text-gray-800">${formatMoney(kpis.totalCost)}</div>
          <div class="text-xs text-red-400 mt-2 font-medium">材料成本</div>
        </div>
        <div class="kpi-card rounded-2xl p-6 hover-lift">
          <div class="text-xs text-gray-400 mb-1 font-medium tracking-wider">GROSS PROFIT</div>
          <div class="text-sm text-gray-600 mb-2">毛利</div>
          <div class="text-2xl font-black text-sb-blue">${formatMoney(kpis.grossProfit)}</div>
          <div class="text-xs text-sb-blue/70 mt-2 font-medium">收入 - 成本</div>
        </div>
        <div class="kpi-card rounded-2xl p-6 hover-lift">
          <div class="text-xs text-gray-400 mb-1 font-medium tracking-wider">PROFIT MARGIN</div>
          <div class="text-sm text-gray-600 mb-2">毛利率</div>
          <div class="text-2xl font-black text-sb-green">${formatPercent(kpis.profitMargin)}</div>
          <div class="text-xs text-sb-green/70 mt-2 font-medium">毛利 / 收入</div>
        </div>
      </div>
    `;
  }

  // 趋势图（收入/成本/利润）
  renderTrendChart(data, containerId, periodType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.charts[containerId]) {
      this.charts[containerId].dispose();
    }

    const xAxisData = data.map(d => {
      if (periodType === 'day') return d.date.substring(5);
      if (periodType === 'week') return `W${d.weekStart.substring(5)}`;
      return d.month;
    });

    const revenueData = data.map(d => d.totalRevenue.toFixed(2));
    const costData = data.map(d => d.totalCost.toFixed(2));
    const profitData = data.map(d => d.grossProfit.toFixed(2));

    const chart = echarts.init(container);
    this.charts[containerId] = chart;

    const option = {
      title: {
        text: '收入 / 成本 / 利润趋势',
        subtext: 'Revenue / Cost / Profit Trend',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
        subtextStyle: { fontSize: 11, color: '#9ca3af' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: function(params) {
          let result = `<div style="font-weight:bold;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach(p => {
            const color = p.color;
            result += `<div style="display:flex;align-items:center;margin:2px 0;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
              <span style="flex:1;">${p.seriesName}:</span>
              <span style="font-weight:bold;">¥${parseFloat(p.value).toLocaleString()}</span>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        data: ['收入', '成本', '利润'],
        bottom: 0,
        textStyle: { color: '#6b7280' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: { rotate: periodType === 'day' ? 45 : 0, color: '#9ca3af', fontSize: 10 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10,
          formatter: value => '¥' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value)
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      series: [
        {
          name: '收入',
          type: 'line',
          data: revenueData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: this.colorPalette.green },
          lineStyle: { width: 3, shadowColor: 'rgba(0,112,74,0.3)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,112,74,0.2)' },
              { offset: 1, color: 'rgba(0,112,74,0.02)' }
            ])
          }
        },
        {
          name: '成本',
          type: 'line',
          data: costData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: this.colorPalette.red },
          lineStyle: { width: 2, type: 'dashed' }
        },
        {
          name: '利润',
          type: 'line',
          data: profitData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: this.colorPalette.blue },
          lineStyle: { width: 3 }
        }
      ]
    };

    chart.setOption(option);
  }

  // 产品利润排行（横向条形图）
  renderProductRanking(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.charts[containerId]) {
      this.charts[containerId].dispose();
    }

    const sortedData = [...data].sort((a, b) => a.grossProfit - b.grossProfit);
    const names = sortedData.map(d => d.name);
    const profits = sortedData.map(d => d.grossProfit.toFixed(2));
    const margins = sortedData.map(d => d.profitMargin.toFixed(2));

    const chart = echarts.init(container);
    this.charts[containerId] = chart;

    const option = {
      title: {
        text: '产品利润排行',
        subtext: 'Product Profit Ranking',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
        subtextStyle: { fontSize: 11, color: '#9ca3af' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: function(params) {
          const p = params[0];
          const idx = p.dataIndex;
          return `<div style="font-weight:bold;margin-bottom:4px;">${p.name}</div>
                  <div>毛利: <span style="font-weight:bold;color:#00704A;">¥${parseFloat(profits[idx]).toLocaleString()}</span></div>
                  <div>毛利率: <span style="font-weight:bold;color:#00704A;">${margins[idx]}%</span></div>
                  <div>销量: ${sortedData[idx].quantity} 杯</div>`;
        }
      },
      grid: {
        left: '3%',
        right: '12%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10,
          formatter: value => '¥' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value)
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, color: '#4b5563' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: profits,
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#00704A' },
            { offset: 1, color: '#008c5e' }
          ]),
          borderRadius: [0, 6, 6, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: params => {
            const idx = params.dataIndex;
            return `¥${parseFloat(profits[idx]).toLocaleString()}`;
          },
          fontSize: 10,
          color: '#00704A',
          fontWeight: 'bold'
        }
      }]
    };

    chart.setOption(option);
  }

  // 产品利润对比（柱状图）
  renderProductComparison(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.charts[containerId]) {
      this.charts[containerId].dispose();
    }

    const names = data.map(d => d.name);
    const revenues = data.map(d => d.revenue.toFixed(2));
    const costs = data.map(d => d.cost.toFixed(2));
    const profits = data.map(d => d.grossProfit.toFixed(2));

    const chart = echarts.init(container);
    this.charts[containerId] = chart;

    const option = {
      title: {
        text: '产品收入/成本/利润对比',
        subtext: 'Revenue / Cost / Profit Comparison',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
        subtextStyle: { fontSize: 11, color: '#9ca3af' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: function(params) {
          let result = `<div style="font-weight:bold;margin-bottom:4px;">${params[0].name}</div>`;
          params.forEach(p => {
            const color = p.color;
            result += `<div style="display:flex;align-items:center;margin:2px 0;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
              <span style="flex:1;">${p.seriesName}:</span>
              <span style="font-weight:bold;">¥${parseFloat(p.value).toLocaleString()}</span>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        data: ['收入', '成本', '利润'],
        bottom: 0,
        textStyle: { color: '#6b7280' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 10, color: '#6b7280', rotate: 15 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#9ca3af',
          fontSize: 10,
          formatter: value => '¥' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value)
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      series: [
        {
          name: '收入',
          type: 'bar',
          data: revenues,
          itemStyle: { color: this.colorPalette.green, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '成本',
          type: 'bar',
          data: costs,
          itemStyle: { color: this.colorPalette.red, borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '利润',
          type: 'bar',
          data: profits,
          itemStyle: { color: this.colorPalette.blue, borderRadius: [4, 4, 0, 0] }
        }
      ]
    };

    chart.setOption(option);
  }

  // 渠道占比饼图（线上/线下双环）
  renderChannelPie(sales, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.charts[containerId]) {
      this.charts[containerId].dispose();
    }

    const onlineChannels = ['美团外卖', '淘宝闪购', '微信小程序'];
    const offlineChannels = ['到店取餐'];

    // 按渠道聚合
    const channelData = {};
    sales.forEach(s => {
      if (!channelData[s.channel]) {
        channelData[s.channel] = { revenue: 0, quantity: 0 };
      }
      channelData[s.channel].revenue += s.revenue;
      channelData[s.channel].quantity += s.quantity;
    });

    // 内环：线上 vs 线下
    let onlineRevenue = 0, onlineQty = 0;
    let offlineRevenue = 0, offlineQty = 0;

    Object.entries(channelData).forEach(([name, data]) => {
      if (onlineChannels.includes(name)) {
        onlineRevenue += data.revenue;
        onlineQty += data.quantity;
      } else if (offlineChannels.includes(name)) {
        offlineRevenue += data.revenue;
        offlineQty += data.quantity;
      }
    });

    const innerData = [
      { name: '线上渠道', value: onlineRevenue.toFixed(2), quantity: onlineQty, itemStyle: { color: '#3B82F6' } },
      { name: '线下门店', value: offlineRevenue.toFixed(2), quantity: offlineQty, itemStyle: { color: '#00704A' } }
    ];

    // 外环：各具体渠道
    const outerData = Object.entries(channelData).map(([name, data]) => {
      const colors = {
        '美团外卖': '#FFD100',
        '淘宝闪购': '#FF5000',
        '微信小程序': '#07C160',
        '到店取餐': '#008c5e'
      };
      return {
        name,
        value: data.revenue.toFixed(2),
        quantity: data.quantity,
        itemStyle: { color: colors[name] || '#999' }
      };
    });

    const chart = echarts.init(container);
    this.charts[containerId] = chart;

    const option = {
      title: {
        text: '渠道收入占比',
        subtext: 'Online vs Offline Channel Share',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
        subtextStyle: { fontSize: 11, color: '#9ca3af' }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: params => {
          return `<div style="font-weight:bold;margin-bottom:4px;">${params.name}</div>
                  <div>收入: <span style="font-weight:bold;color:#00704A;">¥${parseFloat(params.value).toLocaleString()}</span></div>
                  <div>占比: <span style="font-weight:bold;">${params.percent}%</span></div>
                  <div>销量: ${params.data.quantity} 杯</div>`;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#6b7280' },
        data: ['线上渠道', '线下门店', '美团外卖', '淘宝闪购', '微信小程序', '到店取餐']
      },
      series: [
        {
          name: '线上/线下',
          type: 'pie',
          radius: [0, '35%'],
          center: ['50%', '50%'],
          data: innerData,
          label: {
            position: 'inner',
            fontSize: 11,
            fontWeight: 'bold',
            color: '#fff',
            formatter: '{b}\n{d}%'
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          }
        },
        {
          name: '具体渠道',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          data: outerData,
          label: {
            formatter: '{b}\n{d}%',
            color: '#4b5563',
            fontSize: 11
          },
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 16,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.15)'
            }
          }
        }
      ]
    };

    chart.setOption(option);
  }

  // 响应式调整
  resize() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartRenderer;
}
