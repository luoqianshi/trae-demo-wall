(function() {
  function initCharts() {
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();
    var bg2 = style.getPropertyValue('--bg2').trim();

    // --- Chart: Aging Trend ---
    var chartAgingEl = document.getElementById('chart-aging-trend');
    if (chartAgingEl) {
      var chartAging = echarts.init(chartAgingEl, null, { renderer: 'svg' });
      chartAging.setOption({
        animation: false,
        tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['60岁以上人口（亿人）', '银发经济规模（万亿元）'], top: 0, textStyle: { color: muted, fontSize: 12 } },
        grid: { left: 60, right: 60, top: 50, bottom: 40 },
        xAxis: {
          type: 'category',
          data: ['2023', '2024', '2025', '2026（预计）', '2028（预计）', '2030（预计）'],
          axisLine: { lineStyle: { color: rule } },
          axisLabel: { color: muted, fontSize: 11 }
        },
        yAxis: [
          {
            type: 'value',
            name: '人口（亿）',
            nameTextStyle: { color: muted, fontSize: 11 },
            axisLine: { lineStyle: { color: rule } },
            axisLabel: { color: muted, fontSize: 11 },
            splitLine: { lineStyle: { color: rule, type: 'dashed' } }
          },
          {
            type: 'value',
            name: '经济规模（万亿）',
            nameTextStyle: { color: muted, fontSize: 11 },
            axisLine: { lineStyle: { color: rule } },
            axisLabel: { color: muted, fontSize: 11 },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '60岁以上人口（亿人）',
            type: 'bar',
            data: [2.97, 3.10, 3.23, 3.31, 3.60, 3.90],
            itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
            barWidth: '35%'
          },
          {
            name: '银发经济规模（万亿元）',
            type: 'line',
            yAxisIndex: 1,
            data: [7.0, 7.8, 9.4, 10.8, 16.0, 25.0],
            smooth: true,
            lineStyle: { color: accent2, width: 2.5 },
            itemStyle: { color: accent2 },
            symbol: 'circle',
            symbolSize: 7,
            areaStyle: { color: accent2 + '15' }
          }
        ]
      });
      window.addEventListener('resize', function() { chartAging.resize(); });
    }

    // --- Chart: LLM Price Comparison ---
    var chartLLMEl = document.getElementById('chart-llm-price');
    if (chartLLMEl) {
      var chartLLM = echarts.init(chartLLMEl, null, { renderer: 'svg' });
      chartLLM.setOption({
        animation: false,
        tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['输入价格', '输出价格'], top: 0, textStyle: { color: muted, fontSize: 12 } },
        grid: { left: 120, right: 40, top: 50, bottom: 40 },
        xAxis: {
          type: 'value',
          name: '元/百万tokens',
          nameTextStyle: { color: muted, fontSize: 11 },
          axisLine: { lineStyle: { color: rule } },
          axisLabel: { color: muted, fontSize: 11 },
          splitLine: { lineStyle: { color: rule, type: 'dashed' } }
        },
        yAxis: {
          type: 'category',
          data: ['智谱 GLM-4-Plus', '通义千问 Qwen3.5', '腾讯混元 HY2.0', '字节豆包 Doubao', 'DeepSeek V4-Pro', 'DeepSeek V4-Flash', '小米 MiMo-V2.5'],
          axisLine: { lineStyle: { color: rule } },
          axisLabel: { color: ink, fontSize: 11 }
        },
        series: [
          {
            name: '输入价格',
            type: 'bar',
            data: [5, 0.8, 3.975, 0.8, 3, 1, 1],
            itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] },
            barWidth: '30%'
          },
          {
            name: '输出价格',
            type: 'bar',
            data: [5, 2, 15.9, 2, 6, 2, 2],
            itemStyle: { color: accent2, borderRadius: [0, 4, 4, 0] },
            barWidth: '30%'
          }
        ]
      });
      window.addEventListener('resize', function() { chartLLM.resize(); });
    }

    // --- Chart: Revenue Structure ---
    var chartRevenueEl = document.getElementById('chart-revenue');
    if (chartRevenueEl) {
      var chartRevenue = echarts.init(chartRevenueEl, null, { renderer: 'svg' });
      chartRevenue.setOption({
        animation: false,
        tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}万 ({d}%)' },
        legend: { orient: 'vertical', right: 20, top: 'center', textStyle: { color: muted, fontSize: 12 } },
        series: [
          {
            name: '纯公益期（0-12月）',
            type: 'pie',
            radius: ['0%', '45%'],
            center: ['35%', '50%'],
            label: { show: false },
            data: [
              { value: 15, name: '公益创投奖金' },
              { value: 20, name: '政府补贴' },
              { value: 7.5, name: '企业CSR' },
              { value: 15, name: '基金会资助' }
            ],
            itemStyle: { borderColor: '#FFFDF9', borderWidth: 2 },
            color: [accent, accent2, muted, accent + '99']
          },
          {
            name: '轻商业化（12-24月）',
            type: 'pie',
            radius: ['55%', '80%'],
            center: ['35%', '50%'],
            label: { show: false },
            data: [
              { value: 40, name: '政府/机构采购' },
              { value: 25, name: 'B端企业服务' },
              { value: 20, name: '产品推荐佣金' },
              { value: 15, name: '公益捐赠' }
            ],
            itemStyle: { borderColor: '#FFFDF9', borderWidth: 2 },
            color: [accent, accent2, muted, accent + '99']
          }
        ]
      });
      window.addEventListener('resize', function() { chartRevenue.resize(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }
})();
