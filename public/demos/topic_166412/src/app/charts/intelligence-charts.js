(function () {
  const charts = window.MiniFishCharts = window.MiniFishCharts || {};
  function useChart(ctx, key, id) {
    const el = document.getElementById(id);
    if (!el || !window.echarts) return null;
    const instance = echarts.getInstanceByDom(el) || echarts.init(el);
    ctx.charts[key] = instance;
    return instance;
  }
  charts.intelligence = {
    renderHeatTrend(ctx) {
      const c = useChart(ctx, 'heatTrend', 'chart-heat-trend'); if (!c) return;
      let dates, mainVals, avgVals;
      if (ctx._trendSeries && ctx._trendSeries.points && ctx._trendSeries.points.length) {
        const pts = ctx._trendSeries.points.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        const n = pts.length;
        mainVals = pts.map(p => p.heat);
        avgVals = [];
        dates = pts.map((p, idx) => {
          const d = new Date(p.date);
          const label = (d.getMonth() + 1) + '/' + d.getDate();
          if (n <= 7) return label;
          if (n <= 30) return (idx % 3 === 0 || idx === n - 1 || idx === 0) ? label : '';
          return (idx % 10 === 0 || idx === 0) ? label : '';
        });
      } else if (ctx.demoMode) {
        const active = ctx.activeTrendItem;
        const range = ctx.heatRange || '7d';
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

        const baseHeat = active ? active.heatScore : 55;
        const growth = active ? active.growthRate : 120;
        const today = new Date();

        dates = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const label = (d.getMonth()+1) + '/' + d.getDate();
          if (range === '7d') {
            dates.push(label);
          } else if (range === '30d') {
            dates.push((i % 3 === 0 || i === days-1 || i === 0) ? label : '');
          } else {
            dates.push((i % 10 === 0 || i === 0) ? label : '');
          }
        }

        function genData(seed, volatility, trendPct) {
          let val = seed;
          const arr = [];
          for (let i = days - 1; i >= 0; i--) {
            const dayFactor = 1 + (Math.sin(i * 0.8 + seed) * 0.08) + (Math.cos(i * 1.3 + seed * 2) * 0.05);
            const trendFactor = 1 + (trendPct * (days - i) / days) / 100;
            const noise = (Math.sin(i * 2.1 + seed * 3) * volatility) + (Math.cos(i * 3.7 + seed) * volatility * 0.5);
            val = Math.max(5, Math.min(100, seed * dayFactor * trendFactor + noise));
            arr.push(Math.round(val));
          }
          return arr;
        }

        const trendDir = growth > 200 ? 35 : growth > 100 ? 20 : growth > 50 ? 8 : -5;
        mainVals = genData(baseHeat, 3.5, trendDir);
        avgVals = genData(baseHeat * 0.65, 2, 5);
      } else {
        dates = [];
        mainVals = [];
        avgVals = [];
      }

      c.clear();
      c.setOption({
        ...ctx.baseChart(),
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(25,25,30,.95)',
          borderColor: 'rgba(255,255,255,.1)',
          textStyle: { color: '#e5e5e5', fontSize: 11 },
          formatter: function(params) {
            if (!params || !params.length) return '';
            let html = `<div style="font-size:11px;margin-bottom:4px;color:#999">${params[0].axisValue}</div>`;
            params.forEach(p => {
              html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                <span style="width:8px;height:2px;background:${p.color};border-radius:1px;display:inline-block"></span>
                <span style="color:#ccc">${p.seriesName}</span>
                <span style="color:#fff;font-weight:600;margin-left:auto">${p.value}</span>
              </div>`;
            });
            return html;
          }
        },
        grid: { left: 42, right: 16, top: 28, bottom: 36 },
        legend: {
          show: true,
          top: 0,
          right: 0,
          textStyle: { color: '#8a8a90', fontSize: 10 },
          itemWidth: 14,
          itemHeight: 2,
          itemGap: 14,
          data: ['该话题', '同类均值']
        },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false,
          axisLabel: { color: '#6b6b70', fontSize: 10 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,.06)' } },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: { color: '#6b6b70', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,.04)' } },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        series: [
          {
            name: '该话题',
            type: 'line',
            smooth: true,
            data: mainVals,
            symbol: 'circle',
            symbolSize: 0,
            showSymbol: false,
            lineStyle: { width: 2.5, color: '#e8755e' },
            itemStyle: { color: '#e8755e', borderWidth: 2, borderColor: 'rgba(22,22,28,.95)' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(232,117,94,.25)' },
                { offset: 1, color: 'rgba(232,117,94,.02)' }
              ])
            },
            emphasis: { focus: 'series', scale: 1.5 }
          },
          {
            name: '同类均值',
            type: 'line',
            smooth: true,
            data: avgVals,
            symbol: 'none',
            lineStyle: { width: 1.5, color: 'rgba(140,140,150,.45)', type: 'dashed' },
            itemStyle: { color: 'rgba(140,140,150,.5)' },
            areaStyle: { color: 'transparent' }
          }
        ]
      });
    },
    renderSkillRadar(ctx) {
      const c = useChart(ctx, 'skillRadar', 'chart-skill-radar'); if (!c) return;
      const scores = ctx.skillScores || [];
      if (!scores.length) { c.clear(); return; }
      const baseline = ctx.skillBaseline || scores.map(() => 60);
      const mainColor = '#e8755e';
      const indicators = scores.map((s, i) => {
        const score = s.val != null ? s.val : s.value;
        const avg = s.baseline != null ? s.baseline : (s.avg != null ? s.avg : (baseline[i] || 60));
        const delta = score - avg;
        const deltaStr = (delta >= 0 ? '+' : '') + delta;
        const deltaCls = delta >= 0 ? 'pos' : 'neg';
        return {
          name: ctx.isLoggedIn
            ? `{dim|${s.name}}\n{score|${score}}`
            : `{dim|${s.name}}\n{score|${score}}{${deltaCls}|${deltaStr}}`,
          max: 100
        };
      });
      c.setOption({
        ...ctx.baseChart(),
        tooltip: {
          backgroundColor:'rgba(25,25,30,.95)',
          borderColor:'rgba(255,255,255,.1)',
          textStyle:{color:'#e5e5e5',fontSize:11}
        },
        radar: {
          indicator: indicators,
          center:['50%','54%'], radius:'60%',
          nameGap: 10,
          name: {
            lineHeight: 15,
            rich: {
              dim: { color:'#b0b0b0', fontSize:10, align:'center' },
              score: { color: mainColor, fontSize:15, fontWeight:700, fontFamily:'Georgia,serif', align:'center', padding:[3,0,0,0] },
              pos: { color:'#7ba989', fontSize:9, align:'center', padding:[0,0,0,3] },
              neg: { color:'#c96b6b', fontSize:9, align:'center', padding:[0,0,0,3] }
            }
          },
          splitNumber: 4,
          splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}},
          splitArea:{areaStyle:{color:['rgba(255,255,255,.02)','rgba(255,255,255,.04)']}},
          axisLine:{lineStyle:{color:'rgba(255,255,255,.1)'}}
        },
        series: [{
          type:'radar',
          areaStyle:{color:'rgba(232,117,94,.18)'},
          data:[{
            name:'能力画像',
            value:scores.map(s => s.val != null ? s.val : s.value),
            lineStyle:{color:mainColor,width:2.5},
            itemStyle:{color:mainColor},
            symbolSize: 6
          }]
        }]
      });
    },
    renderRouteMatch(ctx) {
      const c = useChart(ctx, 'routeMatch', 'chart-route-match'); if (!c) return;
      const route = ctx.routes.find(r => r.status === 'primary');
      if (!route) return;
      const md = route.matchDetails;
      const baselines = { ability:65, audience:60, content:62, monetization:50 };
      const dims = [
        { name:'能力匹配', val:md.ability, base:baselines.ability },
        { name:'受众匹配', val:md.audience, base:baselines.audience },
        { name:'内容匹配', val:md.content, base:baselines.content },
        { name:'变现匹配', val:md.monetization, base:baselines.monetization }
      ];
      c.setOption({
        backgroundColor:'transparent',
        radar:{
          center:['50%','55%'],
          radius:'60%',
          indicator: dims.map(d => ({name:d.name, max:100})),
          shape:'polygon',
          splitNumber:4,
          axisName:{
            formatter: (name) => {
              const d = dims.find(x => x.name === name);
              const delta = d.val - d.base;
              const cls = delta >= 0 ? 'pos' : 'neg';
              const sign = delta >= 0 ? '+' : '';
              return `{name|${name}}\n{score|${d.val}} {delta${cls}|${sign}${delta}}`;
            },
            rich:{
              name:{color:'#b0b0b6',fontSize:10,fontWeight:500,lineHeight:14,padding:[0,0,2,0]},
              score:{color:'#e8755e',fontSize:15,fontWeight:700,fontFamily:'Georgia',lineHeight:18},
              deltapos:{color:'#7bc498',fontSize:9,fontWeight:600,padding:[2,0,0,2],lineHeight:12},
              deltaneg:{color:'#d88a8a',fontSize:9,fontWeight:600,padding:[2,0,0,2],lineHeight:12}
            }
          },
          splitArea:{areaStyle:{color:['rgba(255,255,255,.015)','rgba(255,255,255,.03)']}},
          splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}},
          axisLine:{lineStyle:{color:'rgba(255,255,255,.1)'}}
        },
        series:[{
          type:'radar',
          symbol:'circle',
          symbolSize:5,
          data:[
            {
              value:dims.map(d=>d.base),
              name:'赛道均值',
              lineStyle:{color:'rgba(200,200,200,.3)',width:1,type:'dashed'},
              itemStyle:{color:'rgba(200,200,200,.4)'},
              areaStyle:{color:'transparent'},
              symbol:'none'
            },
            {
              value:dims.map(d=>d.val),
              name:'当前匹配',
              lineStyle:{color:'#5ea87a',width:2.5},
              itemStyle:{color:'#5ea87a',borderWidth:2,borderColor:'rgba(22,22,26,.9)'},
              areaStyle:{color:'rgba(94,168,122,.18)'}
            }
          ]
        }]
      });
    },
    renderGrowthTrack(ctx) {
      const c = useChart(ctx, 'growthTrack', 'chart-growth-track'); if (!c) return;

      let weeks, stabilityData, matchData;
      if (ctx._coachGrowthSeries && ctx._coachGrowthSeries.points && ctx._coachGrowthSeries.points.length) {
        const pts = ctx._coachGrowthSeries.points.slice().sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
        weeks = pts.map(p => {
          const d = new Date(p.period_start);
          return (d.getMonth() + 1) + '/' + d.getDate();
        });
        stabilityData = pts.map(p => p.content_stability);
        matchData = pts.map(p => p.track_match_score);
      } else if (ctx.demoMode) {
        weeks = ['第1周','第2周','第3周','第4周','第5周','第6周'];
        stabilityData = [58,64,68,73,78,82];
        matchData = [62,70,76,83,88,92];
      } else {
        weeks = [];
        stabilityData = [];
        matchData = [];
      }
      
      c.setOption({
        ...ctx.baseChart(),
        grid: { left: 38, right: 12, top: 20, bottom: 24 },
        xAxis: { 
          type:'category', data: weeks, 
          axisLabel:{color:'#6b6b70', fontSize: 10}, 
          axisLine:{lineStyle:{color:'rgba(255,255,255,.06)'}},
          axisTick: { show: false }
        },
        yAxis: { 
          type:'value', min:40, max:100, interval: 20,
          axisLabel:{color:'#6b6b70', fontSize: 10}, 
          splitLine:{lineStyle:{color:'rgba(255,255,255,.04)'}},
          axisLine: { show: false },
          axisTick: { show: false }
        },
        legend: { 
          top: 0, right: 0, 
          textStyle:{color:'#8a8a90', fontSize: 10},
          itemWidth: 14, itemHeight: 2, itemGap: 16
        },
        series: [
          { 
            name:'内容稳定性', 
            type:'line', 
            smooth:true, 
            data: stabilityData,
            symbol: 'none',
            lineStyle:{width:1.5, color:'#6b6b70'},
            itemStyle:{color:'#6b6b70'}
          },
          { 
            name:'赛道匹配', 
            type:'line', 
            smooth:true, 
            data: matchData,
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: true,
            lineStyle:{width:2, color:'#e8755e'},
            itemStyle:{color:'#e8755e', borderWidth: 2, borderColor: 'rgba(30,30,35,.9)'},
            emphasis: { scale: 1.5, focus: 'series' },
            markPoint: {
              silent: true,
              data: [
                { coord: [5, 92], symbol: 'circle', symbolSize: 7, itemStyle: { color: '#e8755e', shadowBlur: 8, shadowColor: 'rgba(232,117,94,.4)' }, label: { show: false } },
                { coord: [2, 76], symbol: 'circle', symbolSize: 5, itemStyle: { color: '#6b95bf' }, label: { show: false } },
                { coord: [0, 62], symbol: 'circle', symbolSize: 4, itemStyle: { color: '#8a8a90' }, label: { show: false } }
              ]
            }
          }
        ]
      });
    },
    renderCaseChart(ctx) {
      const filter = ctx.activeCaseFilter || 'all';
      const el = document.getElementById('chart-case-main');
      if (!el) return;
      let c = echarts.getInstanceByDom(el);
      if (!c) { c = echarts.init(el); } else { c.clear(); }
      ctx.charts['caseMain'] = c;
      const data = ctx.caseChartData[filter];
      if (!data) return;
      const dims = ctx.caseDimensions;
      const base = ctx.baseChart();
      const textColor = '#9a9a9a';
      const axisColor = 'rgba(255,255,255,.1)';
      const splitColor = 'rgba(255,255,255,.06)';
      const splitAreaColors = ['rgba(255,255,255,.02)','rgba(255,255,255,.04)'];

      let series = [];
      let legendData = [];
      let indicators = [];
      let radarNameOption = { color:'#c4c4c4', fontSize:11 };

      if (filter === 'all') {
        indicators = dims.map(d => ({name: d.name, max:100}));
        series = [
          {
            value: data.scores.baseline, name: '全量均值',
            lineStyle:{color:'rgba(200,200,200,.35)',width:1.5,type:'dashed'},
            itemStyle:{color:'rgba(200,200,200,.4)'},
            areaStyle:{color:'transparent'},
            symbol:'none'
          },
          {
            value: data.scores.excellent, name: '优秀案例',
            lineStyle:{color:'#c9a14f',width:2.5},
            itemStyle:{color:'#c9a14f'},
            areaStyle:{color:'rgba(201,161,79,.12)'}
          },
          {
            value: data.scores.average, name: '一般案例',
            lineStyle:{color:'#6b95bf',width:2},
            itemStyle:{color:'#6b95bf'},
            areaStyle:{color:'rgba(107,149,191,.08)'}
          },
          {
            value: data.scores.failed, name: '失败案例',
            lineStyle:{color:'#c96b6b',width:2},
            itemStyle:{color:'#c96b6b'},
            areaStyle:{color:'rgba(201,107,107,.08)'}
          }
        ];
        legendData = ['优秀案例','一般案例','失败案例','全量均值'];
      } else {
        const catColor = data.color || '#c8b896';
        const catLabel = filter === 'excellent' ? '优秀案例' : filter === 'average' ? '一般案例' : '失败案例';
        const scores = data.scores;
        const baseline = data.baseline;
        indicators = dims.map((d, i) => {
          const score = scores[i];
          const delta = score - baseline[i];
          const deltaStr = (delta >= 0 ? '+' : '') + delta;
          const deltaCls = delta >= 0 ? 'pos' : 'neg';
          return {
            name: `{dim|${d.name}}\n{score|${score}}{${deltaCls}|${deltaStr}}`,
            max: 100
          };
        });
        radarNameOption = {
          lineHeight: 14,
          rich: {
            dim: { color:'#b0b0b0', fontSize:10, align:'center' },
            score: { color: catColor, fontSize:14, fontWeight:700, fontFamily:'Georgia,serif', align:'center', padding:[2,0,0,0] },
            pos: { color:'#7ba989', fontSize:9, align:'center', padding:[0,0,0,3] },
            neg: { color:'#c96b6b', fontSize:9, align:'center', padding:[0,0,0,3] }
          }
        };
        series = [
          {
            value: baseline, name: '全量均值',
            lineStyle:{color:'rgba(200,200,200,.35)',width:1.5,type:'dashed'},
            itemStyle:{color:'rgba(200,200,200,.4)'},
            areaStyle:{color:'transparent'},
            symbol:'none'
          },
          {
            value: scores, name: catLabel,
            lineStyle:{color:catColor,width:2.5},
            itemStyle:{color:catColor},
            areaStyle:{color:catColor+'20'},
            symbolSize: 6
          }
        ];
        legendData = [catLabel, '全量均值'];
      }

      c.setOption({
        ...base,
        tooltip: {
          backgroundColor:'rgba(25,25,30,.95)',
          borderColor:'rgba(255,255,255,.1)',
          textStyle:{color:'#e5e5e5',fontSize:11}
        },
        radar: {
          indicator: indicators,
          center:['42%','52%'], radius:'58%',
          nameGap: 8,
          name: radarNameOption,
          splitNumber: 4,
          splitArea:{areaStyle:{color:splitAreaColors}},
          splitLine:{lineStyle:{color:splitColor}},
          axisLine:{lineStyle:{color:axisColor}}
        },
        series:[{
          type:'radar',
          data: series
        }],
        legend:{
          show:true,
          orient:'vertical',
          right: 8, top:'middle',
          textStyle:{color:textColor,fontSize:10},
          itemWidth:14, itemHeight:8, itemGap:10,
          data: legendData
        }
      });
    },

    renderCaseCardRadar(ctx) {
      const card = ctx.activeCaseCard;
      if (!card) return;
      const el = document.getElementById('chart-case-card');
      if (!el) return;
      let c = echarts.getInstanceByDom(el);
      if (!c) { c = echarts.init(el); } else { c.clear(); }
      ctx.charts['caseCard'] = c;
      const bars = card.diagnosis.bars || [];
      const catColor = card.category === 'excellent' ? '#c9a14f' : card.category === 'average' ? '#6b95bf' : '#c96b6b';
      const catLabel = card.category === 'excellent' ? '该案例（优秀）' : card.category === 'average' ? '该案例（一般）' : '该案例（失败）';
      const valData = bars.map(b => b.val);
      const avgData = bars.map(b => b.avg);
      const base = ctx.baseChart();
      const axisColor = 'rgba(255,255,255,.1)';
      const splitColor = 'rgba(255,255,255,.06)';
      const splitAreaColors = ['rgba(255,255,255,.02)','rgba(255,255,255,.04)'];

      el.querySelectorAll('.cc-radar-label').forEach(n => n.remove());
      if (el._ccResizeObs) { el._ccResizeObs.disconnect(); el._ccResizeObs = null; }

      const indicators = bars.map((b) => {
        const delta = b.val - b.avg;
        const deltaStr = (delta >= 0 ? '+' : '') + delta;
        const deltaCls = delta >= 0 ? 'pos' : 'neg';
        return {
          name: `{dim|${b.dim}}\n{score|${b.val}}{${deltaCls}|${deltaStr}}`,
          max: 100
        };
      });

      c.setOption({
        ...base,
        tooltip: {
          backgroundColor: 'rgba(25,25,30,.95)',
          borderColor: 'rgba(255,255,255,.1)',
          textStyle: { color: '#e5e5e5', fontSize: 11 }
        },
        radar: {
          indicator: indicators,
          center: ['50%', '50%'],
          radius: '58%',
          nameGap: 6,
          name: {
            lineHeight: 14,
            rich: {
              dim: { color:'#b0b0b0', fontSize:10, align:'center' },
              score: { color: catColor, fontSize:14, fontWeight:700, fontFamily:'Georgia,serif', align:'center', padding:[2,0,0,0] },
              pos: { color:'#7ba989', fontSize:9, align:'center', padding:[0,0,0,3] },
              neg: { color:'#c96b6b', fontSize:9, align:'center', padding:[0,0,0,3] }
            }
          },
          splitNumber: 4,
          splitArea: { areaStyle: { color: splitAreaColors } },
          splitLine: { lineStyle: { color: splitColor } },
          axisLine: { lineStyle: { color: axisColor } }
        },
        series: [{
          type: 'radar',
          data: [
            {
              value: avgData, name: '同类均值',
              lineStyle: { color: 'rgba(200,200,200,.35)', width: 1.5, type: 'dashed' },
              itemStyle: { color: 'rgba(200,200,200,.4)' },
              areaStyle: { color: 'transparent' },
              symbol: 'none'
            },
            {
              value: valData, name: catLabel,
              lineStyle: { color: catColor, width: 2.5 },
              itemStyle: { color: catColor, borderColor: 'rgba(255,255,255,.6)', borderWidth: 1.5 },
              areaStyle: { color: catColor + '20' },
              symbolSize: 7
            }
          ]
        }],
        legend: {
          show: true,
          bottom: 2,
          left: 'center',
          textStyle: { color: '#a0a0a0', fontSize: 10 },
          itemWidth: 14, itemHeight: 8, itemGap: 16,
          data: [catLabel, '同类均值']
        }
      });
    }
  };
})();
