(function () {
  const charts = window.MiniFishCharts = window.MiniFishCharts || {};
  function useChart(ctx, key, id) {
    const el = document.getElementById(id);
    if (!el || !window.echarts) return null;
    const instance = echarts.getInstanceByDom(el) || echarts.init(el);
    ctx.charts[key] = instance;
    return instance;
  }
  charts.dashboard = {
    renderTrend(ctx) {
      const c = useChart(ctx, 'trend', 'chart-trend'); if (!c) return;
      const series = ctx._dashboardSeries;
      let xData = ctx.demoMode ? ['周一','周二','周三','周四','周五','周六','周日'] : [];
      let pubData = ctx.demoMode ? [8, 12, 10, 14, 11, 16, 12] : [];
      let engData = ctx.demoMode ? [3200,4500,3800,6200,4900,7800,5400] : [];
      if (series && series.publication_engagement) {
        const arr = series.publication_engagement;
        xData = arr.map(i => i.date);
        pubData = arr.map(i => i.publications);
        engData = arr.map(i => i.engagements);
      }
      c.setOption({
        ...ctx.baseChart(),
        legend: { data: ['发布量', '互动量'], top: 0, right: 10, textStyle: { color: '#a3a3a3' } },
        xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } }, axisLabel: { color: '#737373' } },
        yAxis: [{ type: 'value', name: '篇', nameTextStyle:{color:'#737373'}, splitLine: { lineStyle: { color: 'rgba(255,255,255,.06)' } }, axisLabel:{color:'#737373'} }, { type: 'value', name: '互动', nameTextStyle:{color:'#737373'}, splitLine:{show:false}, axisLabel:{color:'#737373'} }],
        series: [
          { name: '发布量', type: 'bar', data: pubData, barWidth: 22, itemStyle: { borderRadius: [6,6,0,0], color: { type: 'linear', x:0,y:0,x2:0,y2:1, colorStops: [{offset:0,color:'#e8755e'},{offset:1,color:'#d96548'}] } } },
          { name: '互动量', type: 'line', yAxisIndex: 1, data: engData, smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { width: 3 }, itemStyle: { color: '#6b8cb8' }, areaStyle: { color: { type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(107,140,184,.28)'},{offset:1,color:'rgba(107,140,184,0)'}] } } }
        ]
      });
    },
    renderFans(ctx) {
      const c = useChart(ctx, 'fans', 'chart-fans'); if (!c) return;
      const series = ctx._dashboardSeries;
      let pieData = ctx.demoMode ? [
        { value: 2864000, name: '抖音' }, { value: 1589000, name: '小红书' },
        { value: 4321000, name: '微博' }, { value: 987000, name: 'B站' }, { value: 763000, name: '知乎' }
      ] : [];
      if (series && series.followers_by_platform) {
        pieData = series.followers_by_platform.map(i => ({ value: i.value, name: ctx.reversePlatformName(i.platform) }));
      }
      c.setOption({
        ...ctx.baseChart(),
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: '#a3a3a3' } },
        series: [{
          type: 'pie', radius: ['42%','68%'], center: ['50%','45%'],
          itemStyle: { borderColor: '#1f1f1f', borderWidth: 3 },
          label: { color: '#a3a3a3', formatter: '{b}\n{d}%' },
          data: pieData
        }]
      });
    },
    renderHeat(ctx) {
      const c = useChart(ctx, 'heat', 'chart-heat'); if (!c) return;
      const series = ctx._dashboardSeries;
      const days = ['周一','周二','周三','周四','周五','周六','周日'];
      const hrs = ['6h','9h','12h','15h','18h','21h','24h'];
      const data = [];
      if (series && series.fan_active_heatmap) {
        series.fan_active_heatmap.forEach(i => {
          data.push([i.hour, i.weekday, i.value]);
        });
      } else if (ctx.demoMode) {
        days.forEach((d, di) => hrs.forEach((h, hi) => {
          let v = 10 + ((di * 13 + hi * 7) % 30);
          if (di >= 4) v += 25;
          if (hi >= 4 && hi <= 6) v += 20;
          data.push([hi, di, v]);
        }));
      }
      c.setOption({
        ...ctx.baseChart(),
        tooltip: { position: 'top' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: hrs, splitArea: { show: true, areaStyle:{color:['rgba(255,255,255,.02)','transparent']} }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}, axisLabel:{color:'#737373'} },
        yAxis: { type: 'category', data: days, splitArea: { show: true, areaStyle:{color:['rgba(255,255,255,.02)','transparent']} }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}, axisLabel:{color:'#737373'} },
        visualMap: { min: 10, max: 80, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, textStyle:{color:'#a3a3a3'}, inRange: { color: ['#2d2d2d','#5a3a32','#b8584a','#e8755e'] } },
        series: [{ type: 'heatmap', data, label: { show: true, color: '#f5f5f5', fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10 } } }]
      });
    }
  };
})();
