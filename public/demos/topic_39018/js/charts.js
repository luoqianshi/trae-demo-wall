/**
 * AI 旅行规划引擎 - ECharts 图表初始化
 * 根据生成的路书数据渲染可视化图表
 */

function initCharts(params) {
  const data = window._reportData;
  if (!data) return;

  const s = getComputedStyle(document.documentElement);
  const accent = s.getPropertyValue('--accent').trim();
  const accent2 = s.getPropertyValue('--accent2').trim();
  const ink = s.getPropertyValue('--ink').trim();
  const muted = s.getPropertyValue('--muted').trim();
  const rule = s.getPropertyValue('--rule').trim();
  const bg2 = s.getPropertyValue('--bg2').trim();
  const gold = s.getPropertyValue('--gold').trim();
  const danger = s.getPropertyValue('--danger').trim();
  const safe = s.getPropertyValue('--safe').trim();

  // ── Chart 1: Budget Pie ──
  const c1 = echarts.init(document.getElementById('chart-budget'), null, {renderer:'svg'});
  c1.setOption({
    tooltip:{trigger:'item',appendToBody:true,formatter:'{b}: ¥{c} ({d}%)'},
    series:[{
      type:'pie',radius:['38%','68%'],center:['50%','50%'],
      animation:false,
      label:{color:ink,fontSize:11,formatter:'{b}\n¥{c}'},
      labelLine:{lineStyle:{color:rule}},
      color:[accent,accent2,accent+'99',accent2+'99',gold,muted],
      data: data.budgetData
    }]
  });
  window.addEventListener('resize',()=>c1.resize());

  // ── Chart 2: Daily Cost Stacked Bar ──
  const c2 = echarts.init(document.getElementById('chart-daily-cost'), null, {renderer:'svg'});
  const dayLabels = data.dailyKm.map((_,i)=>'D'+(i+1));
  c2.setOption({
    tooltip:{trigger:'axis',appendToBody:true,axisPointer:{type:'shadow'}},
    legend:{data:['住宿','餐饮','油费/过路费','门票'],textStyle:{color:muted},top:5},
    grid:{left:'8%',right:'5%',bottom:'10%',top:'15%'},
    xAxis:{type:'category',data:dayLabels,
      axisLabel:{color:muted,fontSize:10},axisLine:{lineStyle:{color:rule}}},
    yAxis:{type:'value',name:'元',nameTextStyle:{color:muted},
      axisLabel:{color:muted},splitLine:{lineStyle:{color:rule}}},
    animation:false,
    color:[accent,accent2,gold,muted],
    series:[
      {name:'住宿',type:'bar',stack:'cost',data:data.dailyCost.map(d=>d[0])},
      {name:'餐饮',type:'bar',stack:'cost',data:data.dailyCost.map(d=>d[1])},
      {name:'油费/过路费',type:'bar',stack:'cost',data:data.dailyCost.map(d=>d[2])},
      {name:'门票',type:'bar',stack:'cost',data:data.dailyCost.map(d=>d[3])}
    ]
  });
  window.addEventListener('resize',()=>c2.resize());

  // ── Chart 3: Daily KM Bar ──
  const c3 = echarts.init(document.getElementById('chart-daily-km'), null, {renderer:'svg'});
  c3.setOption({
    tooltip:{trigger:'axis',appendToBody:true,formatter:function(p){return p[0].name+': '+p[0].value+'km'}},
    grid:{left:'8%',right:'5%',bottom:'10%',top:'10%'},
    xAxis:{type:'category',data:dayLabels,
      axisLabel:{color:muted,fontSize:10},axisLine:{lineStyle:{color:rule}}},
    yAxis:{type:'value',name:'km',nameTextStyle:{color:muted},
      axisLabel:{color:muted},splitLine:{lineStyle:{color:rule}}},
    animation:false,
    series:[{
      type:'bar',data:data.dailyKm,
      itemStyle:{color:function(p){
        var v=p.value;
        if(v>=600)return danger;
        if(v>=300)return accent;
        if(v>=100)return accent2;
        return safe;
      },borderRadius:[4,4,0,0]},
      label:{show:true,position:'top',color:muted,fontSize:9,formatter:'{c}km'}
    }]
  });
  window.addEventListener('resize',()=>c3.resize());

  // ── Chart 4: Altitude Profile ──
  const c4 = echarts.init(document.getElementById('chart-altitude'), null, {renderer:'svg'});
  c4.setOption({
    tooltip:{trigger:'axis',appendToBody:true,formatter:function(p){
      return p[0].name+'<br/>海拔: '+p[0].value+'m';
    }},
    grid:{left:'8%',right:'5%',bottom:'12%',top:'10%'},
    xAxis:{type:'category',data:data.altLabels,
      axisLabel:{color:muted,fontSize:9,rotate:45},axisLine:{lineStyle:{color:rule}}},
    yAxis:{type:'value',name:'海拔(m)',nameTextStyle:{color:muted},
      axisLabel:{color:muted},splitLine:{lineStyle:{color:rule}}},
    animation:false,
    series:[{
      type:'line',smooth:true,
      data:data.altData,
      lineStyle:{width:3,color:accent},
      itemStyle:{color:accent2},
      areaStyle:{color:{
        type:'linear',x:0,y:0,x2:0,y2:1,
        colorStops:[{offset:0,color:accent+'44'},{offset:1,color:accent+'05'}]
      }}
    }]
  });
  window.addEventListener('resize',()=>c4.resize());
}
