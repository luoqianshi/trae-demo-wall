(function () {
  const charts = window.MiniFishCharts = window.MiniFishCharts || {};
  function useChart(ctx, key, id) {
    const el = document.getElementById(id);
    if (!el || !window.echarts) return null;
    const instance = echarts.getInstanceByDom(el) || echarts.init(el);
    ctx.charts[key] = instance;
    return instance;
  }
  charts.media = {
    renderSentiment(ctx) {
      const c = useChart(ctx, 'sentiment', 'chart-sentiment'); if (!c) return;
      let xData = ctx.demoMode ? ['00:03','00:15','00:30','00:45','01:00','01:15','01:30'] : [];
      let positiveData = ctx.demoMode ? [85, 40, 75, 60, 90, 95, 88] : [];
      let neutralData = ctx.demoMode ? [15, 60, 25, 40, 10, 5, 12] : [];
      const hasRealSeries = !!(ctx.mediaAnalysisResult && ctx.mediaAnalysisResult.sentiment_series);
      if (ctx.mediaAnalysisResult && ctx.mediaAnalysisResult.sentiment_series) {
        const series = ctx.mediaAnalysisResult.sentiment_series;
        xData = series.map(p => ctx.formatMediaTime(p.timestamp_seconds));
        positiveData = series.map(p => p.score);
        neutralData = [];
      }
      c.setOption({
        ...ctx.baseChart(),
        legend: { data: hasRealSeries ? ['情感分'] : ['正面', '中性'], top: 0, textStyle: { color: '#a3a3a3' } },
        xAxis: { type: 'category', data: xData, axisLabel: { fontSize: 10, color:'#737373' }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}} },
        yAxis: { type: 'value', min: 0, max: 100, splitLine:{lineStyle:{color:'rgba(255,255,255,.06)'}}, axisLabel:{color:'#737373'} },
        series: [
          { name: hasRealSeries ? '情感分' : '正面', type: 'line', smooth: true, data: positiveData, areaStyle: { color: 'rgba(123,169,137,.2)' }, lineStyle: { color: '#7ba989', width: 3 }, itemStyle: { color: '#7ba989' } },
          { name: '中性', type: 'line', smooth: true, data: neutralData, areaStyle: { color: 'rgba(115,115,115,.12)' }, lineStyle: { color: '#737373', width: 2 }, itemStyle: { color: '#737373' } }
        ]
      });
    },
    renderTopicHot(ctx) {
      const c = useChart(ctx, 'topicHot', 'chart-topic-hot'); if (!c) return;
      let yData = ctx.demoMode ? ['夏日饮品','水蜜桃','气泡水','高颜值','ASMR','减脂','种草','治愈','学生党'].reverse() : [];
      let barData = ctx.demoMode ? [98, 92, 88, 76, 68, 54, 48, 42, 30].reverse() : [];
      if (ctx.mediaAnalysisResult && ctx.mediaAnalysisResult.topic_distribution) {
        const items = ctx.mediaAnalysisResult.topic_distribution;
        yData = items.map(p => p.label);
        barData = items.map(p => p.score);
      }
      c.setOption({
        ...ctx.baseChart(),
        xAxis: { type: 'value', axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}, splitLine:{lineStyle:{color:'rgba(255,255,255,.06)'}}, axisLabel:{color:'#737373'} },
        yAxis: { type: 'category', data: yData, axisLabel: { fontSize: 11, color:'#a3a3a3' }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}} },
        series: [{ type: 'bar', data: barData, barWidth: 16, itemStyle: { borderRadius: [0,8,8,0], color: { type:'linear', x:0,y:0,x2:1,y2:0, colorStops:[{offset:0,color:'#5a3a32'},{offset:1,color:'#e8755e'}] } } }]
      });
    },
    renderAudio(ctx) {
      const c = useChart(ctx, 'audio', 'chart-audio'); if (!c) return;
      const audioColors = ['#e8755e', '#6b8cb8', '#d4a04c', '#7ba989'];
      let pieData = ctx.demoMode ? [
        { value: 55, name: '欢快', itemStyle: { color: '#e8755e' } },
        { value: 22, name: '平静', itemStyle: { color: '#6b8cb8' } },
        { value: 15, name: '激动', itemStyle: { color: '#d4a04c' } },
        { value: 8, name: '温柔', itemStyle: { color: '#7ba989' } }
      ] : [];
      if (ctx.mediaAnalysisResult && ctx.mediaAnalysisResult.audio_emotions) {
        const items = ctx.mediaAnalysisResult.audio_emotions;
        pieData = items.map((p, i) => ({ value: p.score, name: p.label, itemStyle: { color: audioColors[i % audioColors.length] } }));
      }
      c.setOption({
        ...ctx.baseChart(),
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: '#a3a3a3' } },
        series: [{
          type: 'pie', radius: ['45%','70%'], center: ['50%','45%'],
          itemStyle: { borderColor: '#1f1f1f', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%', color: '#a3a3a3' },
          data: pieData
        }]
      });
    },
    renderStructure(ctx) {
      const c = useChart(ctx, 'structure', 'chart-structure'); if (!c) return;
      const colors = ['#e8755e', '#6b8cb8', '#7ba989', '#d4a04c', '#9b8fd0'];
      let yData = ctx.videoStructure.map(s => s.range);
      let barData = (ctx.videoStructure || []).map((s, i) => ({ name: s.stage, value: ctx.demoMode ? [12, 22, 30, 18, 18][i] : Number(s.ratio || 0) * 100, itemStyle: { color: colors[i], borderRadius: [0,8,8,0] } }));
      if (ctx.mediaAnalysisResult && ctx.mediaAnalysisResult.structure) {
        const items = ctx.mediaAnalysisResult.structure;
        const total = items.reduce((sum, p) => sum + Math.max(0, p.end_seconds - p.start_seconds), 0) || 1;
        yData = items.map(p => p.label);
        barData = items.map((p, i) => ({ name: p.label, value: Math.round(Math.max(0, p.end_seconds - p.start_seconds) / total * 100), itemStyle: { color: colors[i % colors.length], borderRadius: [0,8,8,0] } }));
      }
      c.setOption({
        ...ctx.baseChart(),
        tooltip: { formatter: p => `${p.name}<br/>占比 ${p.value}%` },
        xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color:'#737373' }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}, splitLine:{lineStyle:{color:'rgba(255,255,255,.06)'}} },
        yAxis: { type: 'category', data: yData, axisLabel: { fontSize: 10, color:'#a3a3a3' }, axisLine:{lineStyle:{color:'rgba(255,255,255,.12)'}} },
        series: [{ type: 'bar', data: barData, barWidth: 18, label: { show: true, position: 'right', formatter: p => p.name, color: '#a3a3a3' } }]
      });
    }
  };
})();
