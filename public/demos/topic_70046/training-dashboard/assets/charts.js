// ========== DATA ==========
var sports=[
  {key:'running',name:'跑步',icon:'🏃'},{key:'trail',name:'越野跑',icon:'🏔'},
  {key:'cycling',name:'公路骑行',icon:'🚴'},{key:'triathlon',name:'铁人三项',icon:'🏊'},
  {key:'crossfit',name:'CrossFit',icon:'🏋'},{key:'hyrox',name:'HYROX',icon:'🔥'},
  {key:'bodybuilding',name:'健美',icon:'💪'},{key:'ocr',name:'OCR',icon:'🏃'}
];

// --- Home ---
var homeData={
  completion:70,
  checklist:[{done:true,text:'Zone2跑步45min'},{done:false,text:'核心训练15min'},{done:false,text:'拉伸10min'}],
  metrics:[{label:'恢复指数',value:82,unit:''},{label:'训练负荷',value:68,unit:''},{label:'睡眠评分',value:78,unit:''},{label:'HRV',value:65,unit:'ms'},{label:'疲劳指数',value:45,unit:''},{label:'VO2Max',value:52,unit:'ml/kg'}],
  summary:[{label:'今日步数',value:'12,580',unit:'步'},{label:'消耗热量',value:'2,850',unit:'kcal'},{label:'活跃时长',value:'95',unit:'min'},{label:'站立小时',value:'10',unit:'h'},{label:'训练次数',value:'2',unit:'次'},{label:'平均心率',value:'142',unit:'bpm'}],
  advice:'今天恢复较好，HRV回升至65ms，睡眠评分78分。建议完成Zone2有氧跑，避免高强度间歇。连续高负荷训练2天后，明日安排恢复日。'
};

// --- AI Training ---
var aiData={
  recoveryScore:82,recoveryText:'恢复良好',
  yesterday:'昨日训练：腿部力量训练（深蹲80kg×5组，硬拉100kg×4组）',
  todayPlan:'根据恢复评分82分和昨日腿部训练，今日推荐<strong>30分钟恢复跑</strong>（Zone2心率）+ <strong>15分钟髋部灵活性训练</strong> + <strong>10分钟核心激活</strong>。保持低强度，促进下肢血液循环恢复。',
  upcomingRace:{name:'HYROX 北京站',days:28,focus:['Wall Ball','Farmers Carry','Race Pace']},
  workout:[
    {name:'恢复跑',detail:'Zone2心率 30min',done:false,tag:'有氧'},
    {name:'髋部灵活性',detail:'动态拉伸 15min',done:false,tag:'恢复'},
    {name:'核心激活',detail:'死虫式+鸟狗式 10min',done:false,tag:'力量'}
  ],
  weekPlan:[
    {day:'周一',focus:'休息/恢复跑',status:'done'},{day:'周二',focus:'间歇跑 8×400m',status:'done'},
    {day:'周三',focus:'力量训练-下肢',status:'done'},{day:'周四',focus:'Zone2长距离 60min',status:'today'},
    {day:'周五',focus:'核心+灵活',status:'pending'},{day:'周六',focus:'HYROX模拟',status:'pending'},
    {day:'周日',focus:'越野跑 15km',status:'pending'}
  ]
};

// --- Data Center ---
var dataContent={
  hyrox:{
    pb:'1:12:33',worldRank:'前12%',nationalRank:'前6%',
    stations:[
      {name:'SkiErg',pb:'4:12',avg:'4:35',change:'+8%',advice:'加强背部耐力'},
      {name:'Sled Push',pb:'3:08',avg:'3:25',change:'+5%',advice:'提升腿部推力'},
      {name:'Sled Pull',pb:'3:45',avg:'4:02',change:'+12%',advice:'强化握力与背部'},
      {name:'Burpee Broad',pb:'2:55',avg:'3:18',change:'+15%',advice:'增强心肺爆发'},
      {name:'Row',pb:'3:30',avg:'3:48',change:'+6%',advice:'维持划桨效率'},
      {name:'Farmers',pb:'2:40',avg:'2:58',change:'+10%',advice:'提升 grip strength'},
      {name:'Lunges',pb:'3:15',avg:'3:35',change:'+9%',advice:'加强单腿稳定'},
      {name:'Wall Ball',pb:'3:10',avg:'3:42',change:'+18%',advice:'继续提升肩部耐力'}
    ],
    runs:['Run1','Run2','Run3','Run4','Run5','Run6','Run7','Run8']
  },
  trail:{
    stats:[{label:'最长距离',value:'168',unit:'km'},{label:'累计爬升',value:'8,200',unit:'m'},{label:'平均配速',value:'7:30',unit:'/km'},{label:'平均心率',value:'152',unit:'bpm'},{label:'技术路段',value:'5:45',unit:'/km'},{label:'下坡能力',value:'4:20',unit:'/km'}],
    races:['UTMB','TNF100','崇礼168','港百']
  },
  crossfit:{
    benchmarks:[
      {name:'Fran',history:[{year:2024,time:'5:13'},{year:2025,time:'4:31'}],improve:'13%'},{name:'Murph',history:[{year:2024,time:'52:00'},{year:2025,time:'45:30'}],improve:'12%'},{name:'Grace',history:[{year:2024,time:'3:45'},{year:2025,time:'2:58'}],improve:'21%'},{name:'Helen',history:[{year:2024,time:'10:20'},{year:2025,time:'9:15'}],improve:'10%'},{name:'Fight Gone Bad',history:[{year:2024,time:'320'},{year:2025,time:'365'}],improve:'14%'}
    ]
  },
  running:{
    pbs:[{dist:'5km',time:'19:45',date:'2025-05-01'},{dist:'10km',time:'41:20',date:'2025-04-15'},{dist:'半马',time:'1:32:15',date:'2025-03-20'},{dist:'全马',time:'3:15:42',date:'2024-11-10'}],
    weekly:{distance:42.5,duration:210,sessions:5,avgPace:'5:04',avgHr:145}
  },
  cycling:{stats:[{label:'周里程',value:'185',unit:'km'},{label:'爬升',value:'2,400',unit:'m'},{label:'功率',value:'195',unit:'W'},{label:'TSS',value:'420',unit:''}],routes:['戒台寺','妙峰山','潭王路','十三陵']},
  triathlon:{splits:{swim:'1.5km',bike:'40km',run:'10km'},pbs:{sprint:'1:08:45',olympic:'2:22:10',half:'4:45:30'}},
  bodybuilding:{stats:[{label:'体重',value:'72.5',unit:'kg'},{label:'体脂',value:'14.2',unit:'%'},{label:'深蹲',value:'120',unit:'kg'},{label:'硬拉',value:'160',unit:'kg'},{label:'卧推',value:'95',unit:'kg'}],split:'胸/背/腿/肩/臂'},
  ocr:{stats:[{label:'斯巴达竞速',value:'1:15',unit:''},{label:'超级赛',value:'2:45',unit:''},{label:'野兽赛',value:'4:20',unit:''},{label:'障碍通过率',value:'92',unit:'%'}],races:['斯巴达北京','斯巴达上海',' Tough Mudder']}
};

// --- Compare ---
var compareData={
  radar:{me:[82,75,70,78,65,72,68],target:[88,85,82,85,78,75,80]},
  dimensions:['耐力','力量','速度','爆发','恢复','灵活','技术'],
  projects:{
    hyrox:{
      items:[
        {name:'总成绩',me:'1:15:20',target:'1:08:45',diff:'6分35秒',progress:65,advice:'若Wall Ball提升25秒，总成绩可提升约40秒'},
        {name:'Wall Ball',me:'3:45',target:'2:58',diff:'47秒',progress:65,advice:'肩部耐力是最大短板，建议每周2次Wall Ball专项'},
        {name:'SkiErg',me:'4:35',target:'4:05',diff:'30秒',progress:72,advice:'背部耐力良好，维持当前训练量'},
        {name:'Row',me:'3:48',target:'3:30',diff:'18秒',progress:78,advice:'划船技术稳定，重点关注后半程掉速'}
      ]
    },
    running:{
      items:[
        {name:'10km',me:'44:20',target:'41:13',diff:'3分07秒',progress:58,advice:'差距主要在配速稳定性和最后2km掉速'},
        {name:'5km',me:'19:45',target:'18:30',diff:'1分15秒',progress:62,advice:'间歇训练可有效提升5km成绩'},
        {name:'半马',me:'1:32:15',target:'1:25:00',diff:'7分15秒',progress:55,advice:'长距离有氧基础需加强'}
      ]
    }
  }
};

// --- Races ---
var raceData={
  hyrox:[
    {name:'2025 HYROX 上海站',date:'2025-03-15',total:'1:14:33',rank:'156/1200',catRank:'32/180',stations:['Ski 4:15','Push 3:18','Pull 3:55','Burpee 3:02','Row 3:38','Farmers 2:50','Lunges 3:22','Wall Ball 3:28']},
    {name:'2024 HYROX 北京站',date:'2024-11-10',total:'1:18:45',rank:'230/980',catRank:'45/150',stations:['Ski 4:35','Push 3:35','Pull 4:15','Burpee 3:25','Row 3:55','Farmers 3:05','Lunges 3:45','Wall Ball 3:50']}
  ],
  trail:[
    {name:'2025 崇礼168 DTC',date:'2025-07-01',dist:'100km',time:'14:32:15',rank:'45/320',elevation:'5200m'},
    {name:'2025 TNF100北京',date:'2025-04-20',dist:'50km',time:'6:45:30',rank:'78/450',elevation:'2800m'},
    {name:'2024 港百',date:'2024-01-20',dist:'103km',time:'15:20:00',rank:'120/500',elevation:'4800m'}
  ],
  crossfit:[
    {name:'CrossFit Open 2025',date:'2025-03-01',rank:'1250/5000',region:'亚洲区',scores:['24.1: 185 reps','24.2: 8:15','24.3: 215 reps']},
    {name:'2024 馆赛',date:'2024-09-15',rank:'8/32',team:'FireTeam',scores:['WOD1: 第3名','WOD2: 第5名','WOD3: 第2名']}
  ],
  running:[
    {name:'2025 上海马拉松',date:'2025-11-30',dist:'42.195km',time:'3:15:42',rank:'2156/25000',splits:['5k:22:30','10k:45:15','半马:1:32:00','30k:2:15:30','全马:3:15:42']},
    {name:'2025 北京半程马拉松',date:'2025-04-15',dist:'21.0975km',time:'1:32:15',rank:'1200/15000'}
  ]
};

// --- Profile ---
var profileData={
  athleteScore:845,grade:'A+',
  abilities:[{label:'耐力',value:90},{label:'力量',value:84},{label:'恢复',value:71},{label:'速度',value:81},{label:'灵活',value:78}],
  stats:[{label:'累计训练',value:'526',unit:'h'},{label:'累计距离',value:'5,380',unit:'km'},{label:'累计爬升',value:'132k',unit:'m'},{label:'赛事',value:'46',unit:'场'},{label:'奖牌',value:'18',unit:'枚'},{label:'PB次数',value:'32',unit:'次'}],
  goals:[{name:'HYROX',progress:70,target:'sub 1:10'},{name:'越野跑',progress:45,target:'完成UTMB'},{name:'铁三',progress:20,target:'完成70.3'},{name:'全马',progress:55,target:'sub 3:00'}],
  periodStats:{
    week:{sessions:8,duration:420,load:485,avgHr:148,rest:2},
    month:{sessions:32,duration:1680,load:1920,avgHr:147,rest:8},
    year:{sessions:286,duration:15200,load:18500,avgHr:146,rest:72}
  },
  heatmap:[0,1,2,3,1,0,2, 2,3,1,2,3,2,1, 0,2,3,3,2,1,2, 3,2,1,0,2,3,1, 2,1,2,3,2,1,0, 2,3,2,1,2,3,2, 1,0,2,1,3,2,1],
  devices:[{name:'Garmin Fenix 7X',status:'已连接',last:'2分钟前'},{name:'Apple Health',status:'已同步',last:'5分钟前'},{name:'Strava',status:'已授权',last:'10分钟前'},{name:'COROS',status:'未连接',last:'--'}]
};

// ========== UTILS ==========
var currentTab='home';
var currentDataSport='hyrox';
var currentCompareSport='hyrox';
var currentRaceSport='hyrox';
var radarChart=null;

function switchTab(name){
  currentTab=name;
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
  document.querySelector('.nav-item:nth-child('+(['home','ai','data','compare','race','profile'].indexOf(name)+1)+')').classList.add('active');
  document.getElementById('panel-'+name).classList.add('active');
  if(name==='compare'&&!radarChart) setTimeout(renderRadar,100);
}

function showToast(msg){
  var e=document.querySelector('.toast'); if(e)e.remove();
  var d=document.createElement('div'); d.className='toast'; d.textContent=msg;
  document.body.appendChild(d); setTimeout(function(){d.remove();},2000);
}

function pctColor(p){ return p>=100?'#10b981':p>=70?'#f59e0b':'#ef4444'; }

// ========== HOME ==========
function renderHome(){
  var d=homeData;
  // Ring
  var deg=Math.round(d.completion*3.6);
  document.getElementById('home-ring').style.background='conic-gradient(#3b82f6 0deg,#3b82f6 '+deg+'deg,#1f2937 '+deg+'deg,#1f2937 360deg)';
  document.getElementById('home-completion').textContent=d.completion+'%';
  // Checklist
  var ch='';
  d.checklist.forEach(function(item,i){
    ch+='<div class="check-item '+(item.done?'done':'')+'" onclick="toggleCheck('+i+')">'+
      '<div class="check-box">'+(item.done?'✓':'')+'</div>'+
      '<div class="check-text">'+item.text+'</div></div>';
  });
  document.getElementById('home-checklist').innerHTML=ch;
  // Advice
  document.getElementById('home-advice').textContent=d.advice;
  // Metrics
  var mh='';
  d.metrics.forEach(function(m){
    mh+='<div class="metric-item"><div class="m-label">'+m.label+'</div><div class="m-value">'+m.value+'</div><div class="m-unit">'+m.unit+'</div></div>';
  });
  document.getElementById('home-metrics').innerHTML=mh;
  // Summary
  var sh='';
  d.summary.forEach(function(s){
    sh+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';
  });
  document.getElementById('home-summary').innerHTML=sh;
}

function toggleCheck(i){
  homeData.checklist[i].done=!homeData.checklist[i].done;
  var done=homeData.checklist.filter(function(c){return c.done;}).length;
  homeData.completion=Math.round(done/homeData.checklist.length*100);
  renderHome(); showToast(homeData.checklist[i].done?'已完成':'已取消');
}

// ========== AI TRAINING ==========
function renderAI(){
  var d=aiData;
  document.getElementById('ai-recovery').textContent=d.recoveryScore;
  document.getElementById('ai-recovery-text').textContent=d.recoveryText;
  document.getElementById('ai-yesterday').textContent=d.yesterday;
  document.getElementById('ai-today-plan').innerHTML=d.todayPlan;

  // Race countdown
  if(d.upcomingRace){
    var r=d.upcomingRace;
    var html='<div class="countdown">'+
      '<div class="cd-num">'+r.days+'</div>'+
      '<div class="cd-label">距离 '+r.name+' 还有 '+r.days+' 天</div>'+
      '<div style="margin-top:10px;">';
    r.focus.forEach(function(f){html+='<span class="tag tag-red" style="margin:2px;">'+f+'</span>';});
    html+='</div></div>';
    document.getElementById('ai-race-section').innerHTML=html;
  }

  // Workout list
  var wh='';
  d.workout.forEach(function(w,i){
    wh+='<div class="act-item">'+
      '<div class="act-icon" style="background:rgba(59,130,246,0.15);">'+(w.done?'✓':'○')+'</div>'+
      '<div class="act-info"><div class="act-name">'+w.name+'</div><div class="act-meta">'+w.detail+'</div></div>'+
      '<div><span class="tag tag-blue">'+w.tag+'</span></div>'+
      '</div>';
  });
  document.getElementById('ai-workout-list').innerHTML=wh;

  // Week plan
  var wp='';
  d.weekPlan.forEach(function(day){
    var statusColor=day.status==='done'?'var(--accent2)':day.status==='today'?'var(--accent)':'var(--dim)';
    var statusIcon=day.status==='done'?'✓':day.status==='today'?'▶':'○';
    wp+='<div class="act-item">'+
      '<div class="act-icon" style="background:rgba(59,130,246,0.1);color:'+statusColor+';">'+statusIcon+'</div>'+
      '<div class="act-info"><div class="act-name">'+day.day+'</div><div class="act-meta">'+day.focus+'</div></div>'+
      '</div>';
  });
  document.getElementById('ai-week-plan').innerHTML=wp;
}

// ========== DATA CENTER ==========
function renderDataSportSelector(){
  var h='';
  sports.forEach(function(s){
    h+='<button class="sport-chip '+(s.key===currentDataSport?'active':'')+'" onclick="switchDataSport(\''+s.key+'\')">'+s.icon+' '+s.name+'</button>';
  });
  document.getElementById('data-sport-selector').innerHTML=h;
}

function switchDataSport(key){
  currentDataSport=key;
  renderDataSportSelector();
  renderDataContent();
}

function renderDataContent(){
  var key=currentDataSport;
  var data=dataContent[key];
  if(!data){document.getElementById('data-content').innerHTML='<div class="card" style="text-align:center;color:var(--muted);padding:40px;">该运动数据即将上线</div>';return;}
  var html='';

  if(key==='hyrox'){
    html+='<div class="card" style="text-align:center;">'+
      '<div style="font-size:12px;color:var(--muted);">HYROX PB</div>'+
      '<div style="font-size:36px;font-weight:800;margin:4px 0;">'+data.pb+'</div>'+
      '<div style="display:flex;justify-content:center;gap:16px;margin-top:8px;">'+
      '<span class="tag tag-purple">世界排名 '+data.worldRank+'</span>'+
      '<span class="tag tag-blue">全国排名 '+data.nationalRank+'</span></div></div>';
    html+='<div class="section-h">8 Stations</div>';
    html+='<div class="station-grid">';
    data.stations.forEach(function(st){
      var changeColor=st.change.includes('+')?'var(--accent2)':'var(--danger)';
      html+='<div class="station-card">'+
        '<div class="st-name">'+st.name+'</div>'+
        '<div class="st-pb">'+st.pb+'</div>'+
        '<div class="st-avg">平均 '+st.avg+'</div>'+
        '<div class="st-change" style="color:'+changeColor+';">近半年提升'+st.change+'</div>'+
        '<div class="ai-msg" style="margin-top:8px;font-size:12px;padding:8px;">'+st.advice+'</div>'+
        '</div>';
    });
    html+='</div>';
  }

  if(key==='trail'){
    html+='<div class="card"><div class="metric-grid">';
    data.stats.forEach(function(s){html+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';});
    html+='</div></div>';
    html+='<div class="section-h">赛事成绩</div>';
    data.races.forEach(function(r){
      html+='<div class="race-card"><div class="race-name">'+r+'</div><div style="margin-top:8px;"><span class="tag tag-blue">查看分段</span></div></div>';
    });
  }

  if(key==='crossfit'){
    html+='<div class="section-h">Benchmark WODs</div><div class="card">';
    data.benchmarks.forEach(function(b){
      var latest=b.history[b.history.length-1];
      var prev=b.history[b.history.length-2];
      html+='<div class="bench-item">'+
        '<div><div class="bench-name">'+b.name+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px;">'+prev.year+': '+prev.time+' → '+latest.year+': '+latest.time+'</div></div>'+
        '<div class="bench-pr"><div class="pr-time">'+latest.time+'</div><div class="pr-change">提升 '+b.improve+'</div></div>'+
        '</div>';
    });
    html+='</div>';
  }

  if(key==='running'){
    html+='<div class="section-h">个人最好成绩</div><div class="card">';
    data.pbs.forEach(function(pb){
      html+='<div class="bench-item">'+
        '<div><div class="bench-name">'+pb.dist+'</div><div style="font-size:11px;color:var(--muted);">'+pb.date+'</div></div>'+
        '<div class="bench-pr"><div class="pr-time">'+pb.time+'</div></div>'+
        '</div>';
    });
    html+='</div>';
    html+='<div class="section-h">本周数据</div><div class="card"><div class="metric-grid">';
    html+='<div class="metric-item"><div class="m-label">距离</div><div class="m-value">'+data.weekly.distance+'</div><div class="m-unit">km</div></div>';
    html+='<div class="metric-item"><div class="m-label">时长</div><div class="m-value">'+data.weekly.duration+'</div><div class="m-unit">min</div></div>';
    html+='<div class="metric-item"><div class="m-label">次数</div><div class="m-value">'+data.weekly.sessions+'</div><div class="m-unit">次</div></div>';
    html+='<div class="metric-item"><div class="m-label">配速</div><div class="m-value">'+data.weekly.avgPace+'</div><div class="m-unit">/km</div></div>';
    html+='<div class="metric-item"><div class="m-label">心率</div><div class="m-value">'+data.weekly.avgHr+'</div><div class="m-unit">bpm</div></div>';
    html+='</div></div>';
  }

  if(key==='cycling'){
    html+='<div class="card"><div class="metric-grid">';
    data.stats.forEach(function(s){html+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';});
    html+='</div></div>';
    html+='<div class="section-h">常骑路线</div><div class="card">';
    data.routes.forEach(function(r){html+='<div class="act-item"><div class="act-icon" style="background:rgba(16,185,129,0.15);">🚴</div><div class="act-info"><div class="act-name">'+r+'</div></div></div>';});
    html+='</div>';
  }

  if(key==='triathlon'){
    html+='<div class="card" style="text-align:center;">'+
      '<div style="font-size:14px;color:var(--muted);">标准距离</div>'+
      '<div style="font-size:28px;font-weight:800;margin:8px 0;">'+data.splits.swim+' + '+data.splits.bike+' + '+data.splits.run+'</div>'+
      '<div style="display:flex;justify-content:center;gap:12px;">'+
      '<span class="tag tag-blue">游泳 '+data.splits.swim+'</span>'+
      '<span class="tag tag-green">骑行 '+data.splits.bike+'</span>'+
      '<span class="tag tag-orange">跑步 '+data.splits.run+'</span></div></div>';
    html+='<div class="section-h">最好成绩</div><div class="card">';
    html+='<div class="bench-item"><div class="bench-name">Sprint</div><div class="bench-pr"><div class="pr-time">'+data.pbs.sprint+'</div></div></div>';
    html+='<div class="bench-item"><div class="bench-name">Olympic</div><div class="bench-pr"><div class="pr-time">'+data.pbs.olympic+'</div></div></div>';
    html+='<div class="bench-item"><div class="bench-name">Half</div><div class="bench-pr"><div class="pr-time">'+data.pbs.half+'</div></div></div>';
    html+='</div>';
  }

  if(key==='bodybuilding'){
    html+='<div class="card"><div class="metric-grid">';
    data.stats.forEach(function(s){html+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';});
    html+='</div></div>';
    html+='<div class="section-h">分化训练</div><div class="card" style="text-align:center;font-size:18px;font-weight:700;color:var(--accent);">'+data.split+'</div>';
  }

  if(key==='ocr'){
    html+='<div class="card"><div class="metric-grid">';
    data.stats.forEach(function(s){html+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';});
    html+='</div></div>';
    html+='<div class="section-h">参加赛事</div><div class="card">';
    data.races.forEach(function(r){html+='<div class="act-item"><div class="act-icon" style="background:rgba(249,115,22,0.15);">🏃</div><div class="act-info"><div class="act-name">'+r+'</div></div></div>';});
    html+='</div>';
  }

  document.getElementById('data-content').innerHTML=html;
}

// ========== COMPARE ==========
function renderRadar(){
  var container=document.getElementById('radar-chart');
  if(!container)return;
  radarChart=echarts.init(container,null,{renderer:'svg'});
  radarChart.setOption({
    animation:false,tooltip:{trigger:'item',appendToBody:true},
    radar:{indicator:compareData.dimensions.map(function(d){return{name:d,max:100};}),radius:'65%',axisName:{color:'#9ca3af',fontSize:12},splitArea:{areaStyle:{color:['rgba(31,41,55,0.3)','rgba(31,41,55,0.5)']}},axisLine:{lineStyle:{color:'#374151'}},splitLine:{lineStyle:{color:'#374151'}}},
    series:[{type:'radar',data:[
      {value:compareData.radar.me,name:'我',lineStyle:{color:'#3b82f6',width:2},areaStyle:{color:'rgba(59,130,246,0.2)'},itemStyle:{color:'#3b82f6'}},
      {value:compareData.radar.target,name:'陈同学',lineStyle:{color:'#ef4444',width:2},areaStyle:{color:'rgba(239,68,68,0.1)'},itemStyle:{color:'#ef4444'}}
    ]}]
  });
}

function renderCompareSportSelector(){
  var keys=Object.keys(compareData.projects);
  var h='';
  keys.forEach(function(k){
    var s=sports.find(function(x){return x.key===k;});
    h+='<button class="sport-chip '+(k===currentCompareSport?'active':'')+'" onclick="switchCompareSport(\''+k+'\')">'+s.icon+' '+s.name+'</button>';
  });
  document.getElementById('compare-sport-selector').innerHTML=h;
}

function switchCompareSport(key){
  currentCompareSport=key;
  renderCompareSportSelector();
  renderCompareDetail();
}

function renderCompareDetail(){
  var items=compareData.projects[currentCompareSport].items;
  var html='';
  items.forEach(function(item){
    var color=pctColor(item.progress);
    html+='<div class="card">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'+
      '<div style="font-size:15px;font-weight:700;">'+item.name+'</div>'+
      '<span class="tag '+(item.progress>=70?'tag-green':'tag-orange')+'">差距 '+item.diff+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">'+
      '<span style="color:var(--accent);">我: '+item.me+'</span>'+
      '<span style="color:var(--danger);">陈同学: '+item.target+'</span></div>'+
      '<div class="progress-track"><div class="progress-fill" style="width:'+item.progress+'%;background:'+color+';"></div></div>'+
      '<div style="text-align:right;font-size:12px;color:var(--muted);margin-top:4px;">追赶进度 '+item.progress+'%</div>'+
      '<div class="ai-msg" style="margin-top:10px;font-size:12px;padding:10px;">'+item.advice+'</div>'+
      '</div>';
  });
  document.getElementById('compare-detail').innerHTML=html;
}

// ========== RACES ==========
function renderRaceSportSelector(){
  var keys=Object.keys(raceData);
  var h='';
  keys.forEach(function(k){
    var s=sports.find(function(x){return x.key===k;});
    h+='<button class="sport-chip '+(k===currentRaceSport?'active':'')+'" onclick="switchRaceSport(\''+k+'\')">'+s.icon+' '+s.name+'</button>';
  });
  document.getElementById('race-sport-selector').innerHTML=h;
}

function switchRaceSport(key){
  currentRaceSport=key;
  renderRaceSportSelector();
  renderRaceContent();
}

function renderRaceContent(){
  var races=raceData[currentRaceSport]||[];
  if(!races.length){document.getElementById('race-content').innerHTML='<div class="card" style="text-align:center;color:var(--muted);padding:40px;">暂无赛事记录</div>';return;}
  var html='';
  races.forEach(function(r){
    html+='<div class="race-card">'+
      '<div class="race-name">'+r.name+'</div>'+
      '<div class="race-date">'+r.date+'</div>'+
      '<div class="race-stats">';
    if(r.total) html+='<div class="race-stat"><div class="rs-val">'+r.total+'</div><div class="rs-label">总成绩</div></div>';
    if(r.time) html+='<div class="race-stat"><div class="rs-val">'+r.time+'</div><div class="rs-label">用时</div></div>';
    if(r.rank) html+='<div class="race-stat"><div class="rs-val">'+r.rank+'</div><div class="rs-label">排名</div></div>';
    if(r.dist) html+='<div class="race-stat"><div class="rs-val">'+r.dist+'</div><div class="rs-label">距离</div></div>';
    html+='</div>';
    if(r.stations){
      html+='<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px;">';
      r.stations.forEach(function(st){html+='<span class="tag tag-blue" style="font-size:10px;">'+st+'</span>';});
      html+='</div>';
    }
    if(r.splits){
      html+='<div style="margin-top:10px;font-size:12px;color:var(--muted);">'+r.splits.join(' | ')+'</div>';
    }
    html+='</div>';
  });
  document.getElementById('race-content').innerHTML=html;
}

// ========== PROFILE ==========
function renderProfile(){
  var d=profileData;
  // Abilities
  var ah='';
  d.abilities.forEach(function(a){
    ah+='<div class="metric-item"><div class="m-label">'+a.label+'</div><div class="m-value">'+a.value+'</div></div>';
  });
  document.getElementById('profile-abilities').innerHTML=ah;
  // Stats
  var sh='';
  d.stats.forEach(function(s){
    sh+='<div class="metric-item"><div class="m-label">'+s.label+'</div><div class="m-value">'+s.value+'</div><div class="m-unit">'+s.unit+'</div></div>';
  });
  document.getElementById('profile-stats').innerHTML=sh;
  // Goals
  var gh='';
  d.goals.forEach(function(g){
    gh+='<div class="goal-item">'+
      '<div class="goal-head"><span class="goal-name">'+g.name+'</span><span class="goal-pct">'+g.progress+'%</span></div>'+
      '<div class="progress-track"><div class="progress-fill" style="width:'+g.progress+'%;background:'+pctColor(g.progress)+';"></div></div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">目标: '+g.target+'</div>'+
      '</div>';
  });
  document.getElementById('profile-goals').innerHTML=gh;
  // Period stats
  renderProfilePeriod('week');
  // Heatmap
  var hh='';
  d.heatmap.forEach(function(v){
    var alpha=v===0?0.1:v===1?0.3:v===2?0.5:v===3?0.7:1;
    hh+='<div class="heatmap-day" style="background:rgba(59,130,246,'+alpha+');"></div>';
  });
  document.getElementById('profile-heatmap').innerHTML=hh;
  // Devices
  var dh='';
  d.devices.forEach(function(dev){
    var isConn=dev.status.includes('已');
    dh+='<div class="act-item">'+
      '<div class="act-icon" style="background:'+(isConn?'rgba(16,185,129,0.15)':'rgba(107,114,128,0.15)')+';">⌚</div>'+
      '<div class="act-info"><div class="act-name">'+dev.name+'</div><div class="act-meta">'+dev.last+'</div></div>'+
      '<div><span class="tag '+(isConn?'tag-green':'tag-red')+'">'+dev.status+'</span></div>'+
      '</div>';
  });
  document.getElementById('profile-devices').innerHTML=dh;
}

function switchProfilePeriod(period,btn){
  document.querySelectorAll('.period-btn').forEach(function(b){b.style.background='none';b.style.color='var(--muted)';});
  if(btn){btn.style.background='var(--accent)';btn.style.color='#fff';}
  renderProfilePeriod(period);
}

function renderProfilePeriod(period){
  var s=profileData.periodStats[period];
  var html='<div class="metric-grid">'+
    '<div class="metric-item"><div class="m-label">训练次数</div><div class="m-value">'+s.sessions+'</div><div class="m-unit">次</div></div>'+
    '<div class="metric-item"><div class="m-label">总时长</div><div class="m-value">'+s.duration+'</div><div class="m-unit">min</div></div>'+
    '<div class="metric-item"><div class="m-label">训练负荷</div><div class="m-value">'+s.load+'</div><div class="m-unit">TSS</div></div>'+
    '<div class="metric-item"><div class="m-label">平均心率</div><div class="m-value">'+s.avgHr+'</div><div class="m-unit">bpm</div></div>'+
    '<div class="metric-item"><div class="m-label">恢复天数</div><div class="m-value">'+s.rest+'</div><div class="m-unit">天</div></div>'+
    '</div>';
  document.getElementById('profile-period-stats').innerHTML=html;
}

// ========== INIT ==========
(function(){
  renderHome();
  renderAI();
  renderDataSportSelector(); renderDataContent();
  renderCompareSportSelector(); renderCompareDetail();
  renderRaceSportSelector(); renderRaceContent();
  renderProfile();
  window.addEventListener('resize',function(){if(radarChart)radarChart.resize();});
})();
