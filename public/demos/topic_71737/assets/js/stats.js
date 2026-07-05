/* ============================================
   文创数据看板 - ECharts 逻辑
   ============================================ */

(function () {
  const D = WF_DATA;
  const charts = [];
  let orderTimer;

  /* ===== KPI ===== */
  function renderKpis() {
    const wrap = document.getElementById('stats-kpis');
    wrap.innerHTML = D.stats.kpis.map((k, i) => `
      <div class="stats-kpi ${k.color}" style="animation-delay:${i * 0.08}s">
        <div class="sk-label">${k.label}</div>
        <div class="sk-num-row">
          <span class="sk-num scroll-num" data-target="${k.value}">0</span>
          <span class="sk-unit">${k.unit}</span>
        </div>
        <div class="sk-up">▲ ${k.up}</div>
      </div>
    `).join('');

    wrap.querySelectorAll('.scroll-num').forEach((el, i) => {
      setTimeout(() => WF.animateNumber(el, +el.dataset.target, { duration: 1800 + i * 100 }), 200 + i * 80);
    });
  }

  /* ===== 销量趋势 ===== */
  function renderSales() {
    const el = document.getElementById('chart-sales');
    const chart = echarts.init(el);
    charts.push(chart);
    const t = D.stats.salesTrend;

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(14, 23, 38, 0.9)',
        borderColor: 'rgba(201, 161, 74, 0.5)',
        textStyle: { color: '#E8E0CC' }
      },
      grid: { left: 50, right: 30, top: 20, bottom: 30 },
      xAxis: {
        type: 'category', data: t.months, boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.4)' } },
        axisLabel: { color: '#9AA3B8', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.12)', type: 'dashed' } },
        axisLabel: { color: '#9AA3B8', fontSize: 11 }
      },
      series: [
        {
          name: '线上销量',
          type: 'line',
          data: t.online,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 3, color: '#E8C97A', shadowColor: '#E8C97A', shadowBlur: 12 },
          itemStyle: { color: '#E8C97A', borderColor: '#0E1726', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(232, 201, 122, 0.5)' },
              { offset: 1, color: 'rgba(232, 201, 122, 0.02)' }
            ])
          },
          animationDuration: 1800,
          animationEasing: 'cubicOut'
        },
        {
          name: '线下销量',
          type: 'line',
          data: t.offline,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#2E8B7A', shadowColor: '#2E8B7A', shadowBlur: 10 },
          itemStyle: { color: '#2E8B7A', borderColor: '#0E1726', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(46, 139, 122, 0.4)' },
              { offset: 1, color: 'rgba(46, 139, 122, 0.02)' }
            ])
          },
          animationDuration: 1800,
          animationDelay: 300,
          animationEasing: 'cubicOut'
        }
      ]
    });
  }

  /* ===== 品类占比（发光环形） ===== */
  function renderCategoryStats() {
    const el = document.getElementById('chart-category-stats');
    const chart = echarts.init(el);
    charts.push(chart);
    const colors = ['#E8C97A', '#C8392F', '#2E8B7A', '#1F4E8C', '#A82820'];

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(14, 23, 38, 0.9)',
        borderColor: 'rgba(201, 161, 74, 0.5)',
        textStyle: { color: '#E8E0CC' },
        formatter: '{b}<br/>{c}% ({d}%)'
      },
      legend: {
        bottom: 0, left: 'center',
        textStyle: { color: '#9AA3B8', fontSize: 11 },
        itemWidth: 10, itemHeight: 10
      },
      series: [{
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#0E1726',
          borderWidth: 3,
          borderRadius: 8,
          shadowColor: 'rgba(232, 201, 122, 0.6)',
          shadowBlur: 18
        },
        label: {
          color: '#E8E0CC',
          fontSize: 11,
          formatter: '{b}\n{c}%'
        },
        labelLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.5)' }, length: 8, length2: 8 },
        emphasis: {
          itemStyle: { shadowBlur: 28, shadowColor: 'rgba(232, 201, 122, 0.9)' },
          label: { fontSize: 13, fontWeight: 700 }
        },
        data: D.stats.categorySales.map((d, i) => ({
          ...d,
          itemStyle: { color: colors[i % colors.length] }
        })),
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        animationType: 'expansion'
      }]
    });
  }

  /* ===== 游客访问量（圆角柱状） ===== */
  function renderVisitors() {
    const el = document.getElementById('chart-visitors');
    const chart = echarts.init(el);
    charts.push(chart);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(14, 23, 38, 0.9)',
        borderColor: 'rgba(201, 161, 74, 0.5)',
        textStyle: { color: '#E8E0CC' }
      },
      grid: { left: 45, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category', data: D.stats.salesTrend.months,
        axisLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.4)' } },
        axisLabel: { color: '#9AA3B8', fontSize: 10, interval: 0 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.12)', type: 'dashed' } },
        axisLabel: { color: '#9AA3B8', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: D.stats.visitors.map((v, i) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: i > 8 ? '#E8C97A' : '#C8392F' },
              { offset: 1, color: 'rgba(232, 201, 122, 0.2)' }
            ]),
            borderRadius: [8, 8, 2, 2],
            shadowColor: 'rgba(232, 201, 122, 0.4)',
            shadowBlur: 8
          }
        })),
        barWidth: '50%',
        animationDuration: 1400,
        animationEasing: 'cubicOut',
        animationDelay: function (i) { return i * 60; }
      }]
    });
  }

  /* ===== 区县排行 ===== */
  function renderRank() {
    const el = document.getElementById('chart-rank');
    const chart = echarts.init(el);
    charts.push(chart);
    const data = [
      { name: '寒亭区', v: 286 }, { name: '高密市', v: 264 },
      { name: '青州市', v: 218 }, { name: '诸城市', v: 196 },
      { name: '临朐县', v: 168 }, { name: '寿光市', v: 142 }
    ].sort((a, b) => a.v - b.v);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(14, 23, 38, 0.9)',
        borderColor: 'rgba(201, 161, 74, 0.5)',
        textStyle: { color: '#E8E0CC' }
      },
      grid: { left: 60, right: 30, top: 15, bottom: 20 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.12)', type: 'dashed' } },
        axisLabel: { color: '#9AA3B8', fontSize: 11 }
      },
      yAxis: {
        type: 'category', data: data.map(d => d.name),
        axisLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.4)' } },
        axisLabel: { color: '#E8E0CC', fontSize: 11 },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: 'rgba(232, 201, 122, 0.2)' },
              { offset: 1, color: i === data.length - 1 ? '#C8392F' : '#E8C97A' }
            ]),
            borderRadius: [0, 8, 8, 0],
            shadowColor: 'rgba(232, 201, 122, 0.4)',
            shadowBlur: 8
          }
        })),
        barWidth: '55%',
        label: { show: true, position: 'right', color: '#E8C97A', fontSize: 11 },
        animationDuration: 1400,
        animationEasing: 'cubicOut'
      }]
    });
  }

  /* ===== 用户画像雷达 ===== */
  function renderPortrait() {
    const el = document.getElementById('chart-portrait');
    const chart = echarts.init(el);
    charts.push(chart);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(14, 23, 38, 0.9)',
        borderColor: 'rgba(201, 161, 74, 0.5)',
        textStyle: { color: '#E8E0CC' }
      },
      radar: {
        indicator: [
          { name: '18-25 岁', max: 100 },
          { name: '26-35 岁', max: 100 },
          { name: '36-45 岁', max: 100 },
          { name: '46-55 岁', max: 100 },
          { name: '55+', max: 100 }
        ],
        center: ['50%', '52%'],
        radius: '65%',
        axisName: { color: '#E8E0CC', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.2)' } },
        splitArea: { areaStyle: { color: ['rgba(201, 161, 74, 0.04)', 'rgba(201, 161, 74, 0.08)'] } },
        axisLine: { lineStyle: { color: 'rgba(201, 161, 74, 0.2)' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: [62, 88, 76, 54, 38],
          name: '年龄分布',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: '#E8C97A', shadowColor: '#E8C97A', shadowBlur: 10 },
          itemStyle: { color: '#E8C97A' },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
              { offset: 0, color: 'rgba(232, 201, 122, 0.4)' },
              { offset: 1, color: 'rgba(200, 57, 47, 0.2)' }
            ])
          }
        }],
        animationDuration: 1500,
        animationEasing: 'cubicOut'
      }]
    });
  }

  /* ===== 实时订单流 ===== */
  const orderNames = ['李女士', '王先生', '张女士', '陈先生', '刘女士', '赵先生', '孙女士', '周先生', '吴女士', '郑先生'];
  const orderProducts = ['龙头蜈蚣风筝', '聂家庄泥叫虎', '杨家埠年画册', '高密剪纸装裱', '昌邑丝绸丝巾', '诸城派古琴U盘', '潍坊风筝文创礼盒', '木版年画日历', '泥塑摆件', '剪纸灯笼'];
  const orderRegions = ['寒亭区', '高密市', '青州市', '诸城市', '临朐县', '奎文区', '昌邑市', '寿光市'];
  const colors = ['#C8392F', '#C9A14A', '#2E8B7A', '#1F4E8C', '#A82820', '#E8C97A'];

  function pushOrder() {
    const wrap = document.getElementById('order-stream');
    if (!wrap) return;
    const name = orderNames[Math.floor(Math.random() * orderNames.length)];
    const product = orderProducts[Math.floor(Math.random() * orderProducts.length)];
    const region = orderRegions[Math.floor(Math.random() * orderRegions.length)];
    const amount = Math.floor(Math.random() * 800 + 100);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const time = new Date();
    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;

    const item = document.createElement('div');
    item.className = 'order-item';
    item.innerHTML = `
      <div class="order-avatar" style="background:linear-gradient(135deg, ${color}, ${color}cc)">${name.charAt(0)}</div>
      <div class="order-info">
        <div class="order-name">${name} · ${product}</div>
        <div class="order-meta">${timeStr} · ${region} · 在线支付</div>
      </div>
      <div class="order-amount">¥${amount}</div>
    `;
    wrap.insertBefore(item, wrap.firstChild);

    // 限制条数
    while (wrap.children.length > 6) {
      wrap.removeChild(wrap.lastChild);
    }
  }

  function startOrderStream() {
    // 初始 4 条
    for (let i = 0; i < 4; i++) {
      setTimeout(pushOrder, i * 200);
    }
    orderTimer = setInterval(pushOrder, 2400);
  }

  /* ===== 初始化 ===== */
  function init() {
    renderKpis();
    renderSales();
    renderCategoryStats();
    renderVisitors();
    renderRank();
    renderPortrait();
    startOrderStream();

    window.addEventListener('resize', WF.debounce(() => {
      charts.forEach(c => c.resize());
    }, 200));
  }

  window.addEventListener('hashchange', () => {
    if (orderTimer) clearInterval(orderTimer);
    charts.forEach(c => c.dispose());
  }, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
