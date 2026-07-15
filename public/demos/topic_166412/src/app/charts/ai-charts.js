(function () {
  const charts = window.MiniFishCharts = window.MiniFishCharts || {};
  function useChart(ctx, key, id) {
    const el = document.getElementById(id);
    if (!el || !window.echarts) return null;
    const instance = echarts.getInstanceByDom(el) || echarts.init(el);
    ctx.charts[key] = instance;
    return instance;
  }
  charts.ai = {
    renderModelCall(ctx) {
      const c = useChart(ctx, 'modelCall', 'chart-model-call'); if (!c) return;
      let pieData = (ctx.usageTable || []).map(x => ({ value: Number(x.calls || 0), name: x.model }));
      if (ctx._aiUsageSummary && ctx._aiUsageSummary.by_model) {
        const items = ctx._aiUsageSummary.by_model;
        pieData = items.map(p => ({ value: p.calls, name: p.model_id }));
      }
      c.setOption({
        ...ctx.baseChart(),
        tooltip: { trigger: 'item' },
        legend: { type: 'scroll', bottom: 0, textStyle: { color: '#a3a3a3' } },
        series: [{
          type: 'pie', radius: ['38%','65%'], center: ['50%','45%'],
          itemStyle: { borderColor: '#1f1f1f', borderWidth: 2 },
          label: { formatter: '{d}%', color: '#a3a3a3' },
          data: pieData
        }]
      });
    },
    renderCost(ctx) {
      const c = useChart(ctx, 'cost', 'chart-cost'); if (!c) return;
      let days = ctx.demoMode ? Array.from({ length: 30 }, (_, i) => (i + 1) + '日') : [];
      let cost = ctx.demoMode ? days.map((_, i) => (8 + Math.sin(i / 3) * 4 + (i % 4)).toFixed(1)) : [];
      if (ctx._aiUsageSeries && ctx._aiUsageSeries.points) {
        const points = ctx._aiUsageSeries.points;
        days = points.map(p => p.date);
        cost = points.map(p => p.estimated_cost);
      }
      c.setOption({
        ...ctx.baseChart(),
        xAxis: { type: 'category', data: days, axisLabel: { interval: 4, color:'#737373' }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}} },
        yAxis: { type: 'value', name: '¥', nameTextStyle:{color:'#737373'}, splitLine:{lineStyle:{color:'rgba(255,255,255,.06)'}}, axisLabel:{color:'#737373'} },
        series: [{ type: 'line', data: cost, smooth: true, symbol: 'none', lineStyle: { width: 3, color: '#e8755e' },
          areaStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(232,117,94,.28)'},{offset:1,color:'rgba(232,117,94,0)'}] } } }]
      });
    }
  };
})();
