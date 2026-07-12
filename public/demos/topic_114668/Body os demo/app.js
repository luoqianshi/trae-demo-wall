document.addEventListener('DOMContentLoaded', function() {
  var DATA = window.BODYOS_DATA;
  var CASES = window.BODYOS_CASES;
  var records = DATA.records;
  var baseline = DATA.meta.baseline;

  // === Helpers ===
  function avg(arr) { return Math.round((arr.reduce(function(a,b){return a+b;},0)/arr.length)*10)/10; }
  function pearson(x, y) {
    var n = x.length, sx=0, sy=0, sxy=0, sx2=0, sy2=0;
    for (var i=0;i<n;i++){ sx+=x[i]; sy+=y[i]; sxy+=x[i]*y[i]; sx2+=x[i]*x[i]; sy2+=y[i]*y[i]; }
    var num = n*sxy - sx*sy;
    var den = Math.sqrt((n*sx2-sx*sx)*(n*sy2-sy*sy));
    return den===0 ? 0 : Math.round((num/den)*100)/100;
  }
  function esc(s) { var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  // === Date labels ===
  var dateLabels = records.map(function(r){ var p=r.date.split('-'); return parseInt(p[1])+'-'+parseInt(p[2]); });

  // === Data series ===
  var series = {
    hrv:   { name:'HRV',      unit:'ms',  color:'#c2ef4e', baseline:baseline.hrv_avg,        threshold:38, data:records.map(function(r){return r.hrv;}) },
    sleep: { name:'\u7761\u7720\u5206', unit:'',     color:'#00d992', baseline:baseline.sleep_avg,      threshold:65, data:records.map(function(r){return r.sleep_score;}) },
    hr:    { name:'\u9759\u606f\u5fc3\u7387', unit:'bpm', color:'#fa7faa', baseline:baseline.resting_hr_avg, threshold:62, data:records.map(function(r){return r.resting_hr;}) }
  };

  // === Metric cards ===
  var avgHrv = avg(series.hrv.data);
  var avgSleep = Math.round(avg(series.sleep.data));
  var avgHr = Math.round(avg(series.hr.data));

  document.getElementById('avg-hrv').innerHTML = avgHrv + '<span class="u">ms</span>';
  document.getElementById('baseline-hrv').innerHTML = '\u57fa\u7ebf ' + baseline.hrv_avg + 'ms \u00b7 <span class="down">\u2193 ' + Math.round((1-avgHrv/baseline.hrv_avg)*100) + '%</span>';
  document.getElementById('avg-sleep').innerHTML = avgSleep + '<span class="u">/100</span>';
  document.getElementById('baseline-sleep').innerHTML = '\u57fa\u7ebf ' + baseline.sleep_avg + ' \u00b7 <span class="down">\u2193 ' + (baseline.sleep_avg-avgSleep) + '</span>';
  document.getElementById('avg-hr').innerHTML = avgHr + '<span class="u">bpm</span>';
  document.getElementById('baseline-hr').innerHTML = '\u57fa\u7ebf ' + baseline.resting_hr_avg + 'bpm \u00b7 <span class="up">\u2191 +' + (avgHr-baseline.resting_hr_avg) + '</span>';

  // === Trend chart ===
  var chart = echarts.init(document.getElementById('trend-chart'));
  var currentMetric = 'hrv';

  function renderChart(metric) {
    var cfg = series[metric];
    var bl = []; for (var i=0;i<records.length;i++) bl.push(cfg.baseline);
    var isLower = metric !== 'hr';
    var pColors = cfg.data.map(function(v){ return (isLower ? v<cfg.threshold : v>cfg.threshold) ? '#ff4757' : cfg.color; });

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1d1432', borderColor: 'rgba(194,239,78,0.2)',
        textStyle: { color: '#f5f5f7', fontSize: 12, fontFamily: 'JetBrains Mono' },
        formatter: function(p) {
          var r = records[p[0].dataIndex];
          return '<b>'+r.date+'</b><br/>'+cfg.name+': <b style="color:'+pColors[p[0].dataIndex]+'">'+cfg.data[p[0].dataIndex]+cfg.unit+'</b><br/><span style="color:#7a7a8e;font-size:11px">'+r.location+' \u00b7 '+r.stress_events+'</span>';
        }
      },
      grid: { left:50, right:30, top:20, bottom:30 },
      xAxis: { type:'category', data:dateLabels, axisLine:{lineStyle:{color:'rgba(255,255,255,0.08)'}}, axisLabel:{color:'#7a7a8e',fontSize:10,interval:2,fontFamily:'JetBrains Mono'} },
      yAxis: { type:'value', axisLine:{show:false}, axisLabel:{color:'#7a7a8e',fontSize:10,fontFamily:'JetBrains Mono'}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}} },
      series: [
        { name:cfg.name, type:'line', smooth:true, symbol:'circle', symbolSize:6,
          data: cfg.data.map(function(v,i){ return { value:v, itemStyle:{color:pColors[i],borderColor:pColors[i]} }; }),
          lineStyle:{color:cfg.color,width:2},
          areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:cfg.color+'20'},{offset:1,color:cfg.color+'00'}]}}
        },
        { name:'\u57fa\u7ebf', type:'line', data:bl, symbol:'none', lineStyle:{color:'rgba(255,255,255,0.12)',width:1,type:'dashed'} }
      ]
    }, true);
  }
  renderChart('hrv');

  document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
      tab.classList.add('active'); currentMetric = tab.dataset.metric; renderChart(currentMetric);
    });
  });

  // === Day drill ===
  chart.on('click', function(params) {
    var idx = params.dataIndex;
    var r = records[idx];
    var cfg = series[currentMetric];
    document.getElementById('day-drill').classList.add('active');
    document.getElementById('drill-date').textContent = r.date;

    var badge = document.getElementById('drill-badge');
    var isAnomaly = currentMetric==='hr' ? r.resting_hr>cfg.threshold : r[currentMetric==='hrv'?'hrv':'sleep_score']<cfg.threshold;
    if (r.stress_events !== '\u65e5\u5e38') {
      badge.style.display='inline-block'; badge.className='dd-badge alert'; badge.textContent=r.stress_events;
    } else if (isAnomaly) {
      badge.style.display='inline-block'; badge.className='dd-badge warn'; badge.textContent='\u6307\u6807\u5f02\u5e38';
    } else {
      badge.style.display='inline-block'; badge.className='dd-badge ok'; badge.textContent='\u6b63\u5e38';
    }

    function setVal(id, val, unit, threshold, lowerBetter) {
      var el = document.getElementById(id);
      el.textContent = val + unit; el.className = 'dd-val';
      if (lowerBetter) { if (val<threshold) el.classList.add('alert'); else if (val<threshold+(threshold*0.1)) el.classList.add('warn'); else el.classList.add('ok'); }
      else { if (val>threshold) el.classList.add('alert'); else if (val>threshold-3) el.classList.add('warn'); else el.classList.add('ok'); }
    }
    setVal('drill-hrv', r.hrv.toFixed(1), ' ms', 38, true);
    setVal('drill-sleep', r.sleep_score, '', 65, true);
    setVal('drill-hr', r.resting_hr, ' bpm', 62, false);

    var m = document.getElementById('drill-meeting');
    m.textContent = r.meeting_hours + ' h'; m.className = 'dd-val';
    if (r.meeting_hours>4) m.classList.add('alert'); else if (r.meeting_hours>2.5) m.classList.add('warn'); else m.classList.add('ok');

    var c = document.getElementById('drill-coffee');
    c.textContent = r.coffee_count + ' \u676f'; c.className = 'dd-val';
    if (r.coffee_count>=3) c.classList.add('alert'); else if (r.coffee_count>=2) c.classList.add('warn'); else c.classList.add('ok');
  });

  // === Correlation Matrix ===
  var factors = {
    meeting: { label:'\u4f1a\u8bae\u65f6\u957f', data: records.map(function(r){return r.meeting_hours;}) },
    coffee:  { label:'\u5496\u5561\u6444\u5165', data: records.map(function(r){return r.coffee_count;}) },
    officeB: { label:'\u529e\u516c\u5ba4 B',   data: records.map(function(r){return r.location==='B'?1:0;}) },
    stress:  { label:'\u538b\u529b\u4e8b\u4ef6', data: records.map(function(r){return r.stress_events!=='\u65e5\u5e38'?1:0;}) }
  };
  var metrics = [
    { key:'hrv',   label:'HRV',      data: series.hrv.data },
    { key:'sleep', label:'\u7761\u7720\u5206', data: series.sleep.data },
    { key:'hr',    label:'\u9759\u606f\u5fc3\u7387',  data: series.hr.data }
  ];

  var corrMatrix = document.getElementById('corr-matrix');
  // Header row
  var html = '<div class="corr-head"></div>';
  Object.keys(factors).forEach(function(fk){ html += '<div class="corr-head">'+factors[fk].label+'</div>'; });
  // Data rows
  metrics.forEach(function(m){
    html += '<div class="corr-row-label">'+m.label+'</div>';
    Object.keys(factors).forEach(function(fk){
      var r = pearson(m.data, factors[fk].data);
      var bg, textColor;
      if (r <= -0.5) { var op = Math.min(0.9, Math.abs(r)); bg = 'rgba(255,71,87,'+op+')'; textColor='#fff'; }
      else if (r >= 0.5) { var op2 = Math.min(0.9, r); bg = 'rgba(0,217,146,'+op2+')'; textColor='#fff'; }
      else if (r <= -0.2 || r >= 0.2) { bg = 'rgba(245,166,35,0.3)'; textColor='#f5a623'; }
      else { bg = 'rgba(255,255,255,0.03)'; textColor='#7a7a8e'; }
      var strength = Math.abs(r)>=0.7 ? '\u5f3a' : Math.abs(r)>=0.4 ? '\u4e2d' : '\u5f31';
      html += '<div class="corr-cell" style="background:'+bg+';color:'+textColor+';" data-metric="'+m.key+'" data-factor="'+fk+'" data-r="'+r+'">'+
        '<div class="corr-val">'+r.toFixed(2)+'</div>'+
        '<div class="corr-val-label" style="color:'+textColor+';opacity:0.7;">'+strength+'</div>'+
      '</div>';
    });
  });
  corrMatrix.innerHTML = html;

  // === Case Views ===
  var caseNav = document.getElementById('case-nav');
  var caseViews = document.getElementById('case-views');

  CASES.forEach(function(c, idx){
    // Nav button
    var btn = document.createElement('button');
    btn.className = 'case-nav-btn' + (idx===0 ? ' active' : '');
    btn.dataset.idx = idx;
    var topConf = Math.max.apply(null, c.suspects.map(function(s){return s.confidence;}));
    btn.innerHTML = '<div class="case-nav-id">'+c.case_id+'</div><div class="case-nav-title">'+c.case_title.substring(0,14)+(c.case_title.length>14?'...':'')+'</div>';
    btn.addEventListener('click', function(){ switchCase(idx); });
    caseNav.appendChild(btn);

    // Case view
    var view = document.createElement('div');
    view.className = 'case-view' + (idx===0 ? ' active' : '');
    view.id = 'case-view-'+idx;

    var isAlert = topConf >= 0.75;
    var status = isAlert ? 'open' : 'investigating';
    var statusText = isAlert ? '\u5df2\u7acb\u6848' : '\u8c03\u67e5\u4e2d';

    // Find anomaly days for this case (based on case_id patterns)
    var anomalyDays = [];
    if (idx === 0) { // Wednesday meetings
      records.forEach(function(r,i){ if (r.meeting_hours > 4 && r.hrv < 38) anomalyDays.push(i); });
    } else if (idx === 1) { // Coffee -> sleep
      records.forEach(function(r,i){ if (r.coffee_count >= 3 && r.sleep_score < 60) anomalyDays.push(i); });
    } else if (idx === 2) { // Office B -> HR
      records.forEach(function(r,i){ if (r.location === 'B' && r.resting_hr > 62) anomalyDays.push(i); });
    } else { // Annual review
      records.forEach(function(r,i){ if (r.stress_events !== '\u65e5\u5e38') anomalyDays.push(i); });
    }

    // Timeline HTML
    var timelineDaysHtml = '';
    records.forEach(function(r,i){
      var isAnomaly = anomalyDays.indexOf(i) >= 0;
      var tipText = r.date + ' | HRV:'+r.hrv+' \u7761\u7720:'+r.sleep_score+' HR:'+r.resting_hr;
      if (r.stress_events !== '\u65e5\u5e38') tipText += ' | '+r.stress_events;
      timelineDaysHtml += '<div class="timeline-day'+(isAnomaly?' anomaly':'')+'"><div class="timeline-day-tip">'+tipText+'</div></div>';
    });

    // Suspects HTML
    var suspectsHtml = c.suspects.map(function(s,si){
      var isPrimary = si === 0;
      var sClass = s.confidence>=0.7?'high':s.confidence>=0.4?'mid':'low';
      var barColor = s.confidence>=0.7?'#ff4757':s.confidence>=0.4?'#f5a623':'#7a7a8e';
      return '<div class="suspect'+(isPrimary?' primary':'')+'">'+
        '<div class="suspect-head">'+
          '<div><span class="suspect-name">'+esc(s.factor)+'</span>'+(isPrimary?'<span class="suspect-badge">\u4e3b\u56e0</span>':'')+'</div>'+
          '<span class="suspect-conf '+sClass+'">'+s.confidence.toFixed(2)+'</span>'+
        '</div>'+
        '<div class="suspect-evidence">'+esc(s.evidence)+'</div>'+
        '<div class="suspect-bar"><div class="suspect-bar-fill" style="width:'+Math.round(s.confidence*100)+'%;background:'+barColor+';"></div></div>'+
      '</div>';
    }).join('');

    view.innerHTML =
      '<div class="case-header">'+
        '<span class="case-id-big">'+c.case_id+'</span>'+
        '<div class="case-title-big">'+esc(c.case_title)+'</div>'+
        '<span class="case-status-big '+status+'">'+statusText+'</span>'+
      '</div>'+

      '<div class="case-anomaly">'+
        '<div class="case-section-label"><span class="num">01</span> \u5f02\u5e38\u63cf\u8ff0 \u00b7 Anomaly</div>'+
        '<div class="case-anomaly-text">'+esc(c.anomaly_description)+'</div>'+
      '</div>'+

      '<div class="timeline-wrap">'+
        '<div class="case-section-label"><span class="num">02</span> \u5f02\u5e38\u65f6\u95f4\u7ebf \u00b7 Timeline</div>'+
        '<div class="timeline">'+
          '<div class="timeline-track">'+
            '<div class="timeline-line"></div>'+
            '<div class="timeline-days">'+timelineDaysHtml+'</div>'+
          '</div>'+
          '<div class="timeline-labels">'+
            '<span class="timeline-label">'+dateLabels[0]+'</span>'+
            '<span class="timeline-label">'+dateLabels[Math.floor(dateLabels.length/2)]+'</span>'+
            '<span class="timeline-label">'+dateLabels[dateLabels.length-1]+'</span>'+
          '</div>'+
        '</div>'+
        '<div style="margin-top:12px;display:flex;gap:16px;font-size:11px;color:var(--mute);font-family:var(--font-mono);">'+
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:var(--danger);border-radius:2px;box-shadow:0 0 4px var(--danger);"></span>\u5f02\u5e38\u65e5 ('+anomalyDays.length+'\u5929)</span>'+
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:var(--hairline-soft);border-radius:2px;"></span>\u6b63\u5e38\u65e5</span>'+
        '</div>'+
      '</div>'+

      '<div class="timeline-wrap">'+
        '<div class="case-section-label"><span class="num">03</span> \u5acc\u7591\u4eba\u5206\u6790 \u00b7 Suspects</div>'+
        '<div class="suspects">'+suspectsHtml+'</div>'+
      '</div>'+

      '<div class="case-bottom">'+
        '<div class="verdict-box">'+
          '<div class="verdict-label">\u88c1\u51b3 \u00b7 Verdict</div>'+
          '<div class="verdict-text">'+esc(c.verdict)+'</div>'+
        '</div>'+
        '<div class="action-box">'+
          '<div class="action-label">\u25b6 \u53ef\u6267\u884c\u5efa\u8bae \u00b7 Action</div>'+
          '<div class="action-text">'+esc(c.action)+'</div>'+
        '</div>'+
      '</div>';

    caseViews.appendChild(view);
  });

  function switchCase(idx) {
    document.querySelectorAll('.case-nav-btn').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.case-view').forEach(function(v){ v.classList.remove('active'); });
    document.querySelector('.case-nav-btn[data-idx="'+idx+'"]').classList.add('active');
    document.getElementById('case-view-'+idx).classList.add('active');
  }

  // === Before/After comparison chart ===
  var compareChart = echarts.init(document.getElementById('compare-chart'));
  var beforeHrv = series.hrv.data;
  // Projected: simulate improvement (+6ms avg, reduce anomalies)
  var afterHrv = beforeHrv.map(function(v, i){
    var r = records[i];
    if (r.meeting_hours > 4) return Math.min(50, v + 8); // meeting days improve
    if (r.coffee_count >= 3) return Math.min(50, v + 5); // coffee days improve
    if (r.stress_events !== '\u65e5\u5e38') return Math.min(52, v + 10); // stress days improve most
    return Math.min(52, v + 3); // normal days slight improvement
  });

  compareChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', backgroundColor: '#1d1432', borderColor: 'rgba(194,239,78,0.2)',
      textStyle: { color: '#f5f5f7', fontSize: 12, fontFamily: 'JetBrains Mono' }
    },
    legend: {
      data: ['\u4e0d\u5e72\u9884', '\u5e72\u9884\u540e'],
      textStyle: { color: '#c4c4cc', fontSize: 12 },
      top: 0, right: 0
    },
    grid: { left:50, right:30, top:40, bottom:30 },
    xAxis: { type:'category', data:dateLabels, axisLine:{lineStyle:{color:'rgba(255,255,255,0.08)'}}, axisLabel:{color:'#7a7a8e',fontSize:10,interval:2,fontFamily:'JetBrains Mono'} },
    yAxis: { type:'value', axisLine:{show:false}, axisLabel:{color:'#7a7a8e',fontSize:10,fontFamily:'JetBrains Mono'}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}} },
    series: [
      { name:'\u4e0d\u5e72\u9884', type:'line', smooth:true, symbol:'none', data:beforeHrv, lineStyle:{color:'#ff4757',width:2}, areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(255,71,87,0.15)'},{offset:1,color:'rgba(255,71,87,0)'}]}} },
      { name:'\u5e72\u9884\u540e', type:'line', smooth:true, symbol:'none', data:afterHrv, lineStyle:{color:'#c2ef4e',width:2}, areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(194,239,78,0.15)'},{offset:1,color:'rgba(194,239,78,0)'}]}} }
    ]
  });

  // === Scroll reveal ===
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });

  // === Count-up animation ===
  var countObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = parseInt(el.dataset.target);
        var current = 0;
        var step = Math.max(1, Math.ceil(target / 30));
        var interval = setInterval(function(){
          current += step;
          if (current >= target) { current = target; clearInterval(interval); }
          var unit = el.querySelector('.unit');
          if (unit) {
            el.innerHTML = current + '<span class="unit">'+unit.textContent+'</span>';
          } else {
            el.textContent = current;
          }
        }, 30);
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count-up').forEach(function(el){ countObserver.observe(el); });

  // === Window resize ===
  window.addEventListener('resize', function(){
    chart.resize();
    compareChart.resize();
  });
});
