// 小运动家 KidSport - App Logic
(function(){
  'use strict';

  // === LocalStorage ===
  function get(k){try{return JSON.parse(localStorage.getItem('ks_'+k))}catch(e){return null}}
  function set(k,v){try{localStorage.setItem('ks_'+k,JSON.stringify(v))}catch(e){}}

  // === Page Navigation ===
  window.goPage = function(name){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
    document.getElementById('page-'+name).classList.add('active');
    document.querySelectorAll('.tab-item').forEach(function(t){t.classList.remove('active')});
    var idx = ['home','report','plan','buddy'].indexOf(name);
    document.querySelectorAll('.tab-item')[idx].classList.add('active');
    if(name==='plan'){buildPlan();updateAch();drawCharts();}
    if(name==='buddy') buildBuddies();
  };

  // === Concern Picker ===
  window.pickConcern = function(el){
    document.querySelectorAll('.concern-card').forEach(function(c){c.classList.remove('selected')});
    el.classList.add('selected');
    document.getElementById('concern').value = el.getAttribute('data-v');
  };

  // === Weather ===
  function initWeather(){
    var h=new Date().getHours(),w;
    if(h>=6&&h<18) w={i:'☀️',t:'28°C 晴天',d:'适合户外运动',p:'今天天气好，推荐户外跑步或骑自行车！'};
    else w={i:'🌙',t:'22°C 多云',d:'适合室内运动',p:'天黑了，推荐在家做瑜伽或跳绳！'};
    if(Math.random()<.15) w={i:'🌧️',t:'20°C 小雨',d:'不适合户外运动',p:'下雨啦！推荐在室内做拉伸或跳操！'};
    document.getElementById('wIcon').textContent=w.i;
    document.getElementById('wTemp').textContent=w.t;
    document.getElementById('wDesc').textContent=w.d;
    document.getElementById('wTip').textContent=w.p;
  }

  // === Analysis ===
  window.doAnalysis = function(){
    var ht=parseFloat(document.getElementById('height').value),
        wt=parseFloat(document.getElementById('weight').value),
        concern=document.getElementById('concern').value;
    if(!ht||!wt||ht<50||wt<10){alert('请输入正确的身高和体重哦！');return;}
    set('profile',{age:+document.getElementById('age').value,h:ht,w:wt,c:concern});

    var hm=ht/100, bmi=wt/(hm*hm), bmiR=bmi.toFixed(1);
    document.getElementById('bmiVal').textContent=bmiR;

    // Highlight BMI row
    var bn=parseFloat(bmiR);
    document.getElementById('bmiR1').className='';
    document.getElementById('bmiR2').className='';
    document.getElementById('bmiR3').className='';
    var stTxt,stBg;
    if(bn<14){stTxt='偏瘦';stBg='#E6F2FF';}
    else if(bn<18){stTxt='正常';stBg='#E6FFF8';document.getElementById('bmiR1').className='hl';}
    else if(bn<22){stTxt='偏胖';stBg='#FFF0E6';document.getElementById('bmiR2').className='hl';}
    else{stTxt='肥胖';stBg='#FFE6E6';document.getElementById('bmiR3').className='hl';}
    var stEl=document.getElementById('bmiStatus');
    stEl.textContent=stTxt; stEl.style.background=stBg; stEl.style.color=var_ink();

    // BMI history
    var hist=get('bmiHist')||[];
    hist.push({d:new Date().toLocaleDateString('zh-CN'),v:bn});
    if(hist.length>10)hist=hist.slice(-10);
    set('bmiHist',hist);

    // Weather note
    var hour=new Date().getHours(), wn='';
    if(hour<6||hour>=18) wn='（现在是晚上，建议在室内运动哦！）';

    var sport,adv,time;
    switch(concern){
      case'overweight':sport='游泳、骑自行车、快走';adv='你的体重稍微偏重，建议选择对关节压力小的运动。游泳是最好的选择，水的浮力可以保护膝盖和脚踝。每天放学后骑20分钟自行车也是很好的开始。'+wn;time='每天 20-30 分钟';break;
      case'underweight':sport='跳绳、爬楼梯、仰卧起坐';adv='你偏瘦，需要增强肌肉力量。跳绳可以锻炼全身，从每天50个开始。运动后记得多吃鸡蛋和牛奶！'+wn;time='每天 15-20 分钟';break;
      case'stamina':sport='慢跑、跳绳、踢毽子';adv='体能需要慢慢培养。从每天慢跑5分钟开始，每周增加1-2分钟。记住，喘气是正常的，说明你的身体在变强！'+wn;time='每天 15-25 分钟';break;
      case'shy':sport='在家瑜伽、跳绳、舞蹈';adv='很多小朋友刚开始都会害羞，这很正常！可以先在家里练习，慢慢建立自信。等准备好了，再邀请家人一起运动。'+wn;time='每天 15-20 分钟';break;
      case'quit':sport='趣味跳绳、拍皮球、障碍跑';adv='坚持不下去往往是因为运动太枯燥了。试试把运动变成游戏，设置小目标和奖励。每完成一周就给自己一个小奖励！'+wn;time='每天 10-15 分钟';break;
      default:sport='游泳、跑步、球类运动';adv='你的身体状态很好，可以尝试多种运动找到最喜欢的。找到你真正喜欢的，就能一直坚持下去！'+wn;time='每天 30-40 分钟';
    }
    if(bn>22) adv='【注意】体重偏高，建议优先选择低冲击运动。'+adv;
    else if(bn<14) adv='【注意】体重偏低，建议以力量训练为主。'+adv;

    document.getElementById('rSport').textContent=sport;
    document.getElementById('rAdvice').textContent=adv;
    document.getElementById('rTime').textContent=time;
    goPage('report');
  };

  function var_ink(){return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()}

  // === Plan ===
  function buildPlan(){
    var concern=(document.getElementById('concern').value||(get('profile')||{}).c)||'none';
    var days=['周一','周二','周三','周四','周五','周六','周日'];
    var plans={
      overweight:['🏊游泳 20分钟','🚶快走 20分钟','🚲骑自行车','🏊游泳 20分钟','🚶快走 20分钟','👨‍👩‍👧和家人散步','😴休息日'],
      underweight:['🤸跳绳 100个','💪仰卧起坐 20个','🧗爬楼梯 10分钟','🤸跳绳 100个','💪仰卧起坐 20个','⚽户外玩耍','😴休息日'],
      stamina:['🏃慢跑 5分钟','🤸跳绳 30秒x3','🏃慢跑 6分钟','🤸跳绳 30秒x3','🏃慢跑 7分钟','🌳公园散步','😴休息日'],
      shy:['🧘在家瑜伽 15分','💃镜子舞蹈 15分','🤸跳绳 50个','🧘在家瑜伽 15分','💃镜子舞蹈 15分','👨‍👩‍👧和家人一起','😴休息日'],
      quit:['🤸趣味跳绳','🏀拍皮球 15分','🏃障碍跑游戏','🤸跳绳挑战','🏀拍皮球花样','🌳户外探险','😴休息日'],
      none:['🏃跑步 15分钟','🏊游泳 30分钟','⚽球类运动','🤸跳绳 200个','🤩自由选择','🏀团队运动','😴休息日']
    };
    var plan=plans[concern]||plans.none;
    var ck=get('ck')||{};
    var html='';
    for(var i=0;i<7;i++){
      var done=ck['d'+i]===true;
      html+='<div class="plan-day"><span class="pd-day">'+days[i]+'</span><span class="pd-task">'+plan[i]+'</span><div class="day-check'+(done?' done':'')+'" data-i="'+i+'" onclick="toggleCk(this)">'+(done?'✓':'')+'</div></div>';
    }
    document.getElementById('planList').innerHTML=html;
    document.getElementById('timerCard').style.display='block';
    updateMot();
  }

  window.toggleCk = function(el){
    var i=el.getAttribute('data-i'), ck=get('ck')||{}, was=ck['d'+i]===true;
    ck['d'+i]=!was; set('ck',ck);
    el.classList.toggle('done'); el.textContent=el.classList.contains('done')?'✓':'';
    var st=get('st')||{s:0,k:0,t:0};
    if(!was){st.s++;st.t++;st.k=Object.values(ck).filter(function(v){return v===true}).length;set('st',st);confetti();}
    else{st.s=Math.max(0,st.s-1);st.t=Math.max(0,st.t-1);set('st',st);}
    updateAch();updateMot();drawCharts();
  };

  function updateAch(){
    var st=get('st')||{s:0,k:0,t:0};
    document.getElementById('streakN').textContent=st.k;
    document.getElementById('starN').textContent=st.s;
    var lv=st.s>=30?5:st.s>=20?4:st.s>=10?3:st.s>=5?2:1;
    document.getElementById('levelN').textContent=lv;
    document.getElementById('b1').classList.toggle('on',st.t>=1);
    document.getElementById('b2').classList.toggle('on',st.k>=3);
    document.getElementById('b3').classList.toggle('on',st.k>=7);
    document.getElementById('b4').classList.toggle('on',st.s>=10);
    document.getElementById('b5').classList.toggle('on',st.s>=30);
  }

  function updateMot(){
    var ck=get('ck')||{}, done=Object.values(ck).filter(function(v){return v===true}).length;
    var el=document.getElementById('mMsg');
    if(done>=7) el.innerHTML='<span class="mo-emoji">🏆</span><span class="mo-msg">全部完成！你是运动小达人！</span>';
    else if(done>=5) el.innerHTML='<span class="mo-emoji">⭐</span><span class="mo-msg">太棒了！目标即将达成！</span>';
    else if(done>=3) el.innerHTML='<span class="mo-emoji">💪</span><span class="mo-msg">做得不错！继续加油！</span>';
    else el.innerHTML='<span class="mo-emoji">🌱</span><span class="mo-msg">每一小步都是进步！</span>';
  }

  // === Timer ===
  var tRun=false, tInt=null, tSec=30;
  window.doTimer = function(){
    var btn=document.getElementById('tBtn'), circle=document.getElementById('tCircle'), disp=document.getElementById('tNum');
    if(tRun){clearInterval(tInt);tRun=false;btn.textContent='开始运动';circle.classList.remove('on');tSec=30;disp.textContent='00:30';return;}
    tRun=true;btn.textContent='停止';circle.classList.add('on');
    tInt=setInterval(function(){
      tSec--;var m=Math.floor(tSec/60),s=tSec%60;
      disp.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
      if(tSec<=0){
        clearInterval(tInt);tRun=false;btn.textContent='已完成！';circle.classList.remove('on');disp.textContent='完成！';
        confetti();
        var ti=(new Date().getDay()+6)%7, ck=get('ck')||{};
        if(!ck['d'+ti]){ck['d'+ti]=true;set('ck',ck);var st=get('st')||{s:0,k:0,t:0};st.s++;st.t++;set('st',st);buildPlan();updateAch();updateMot();drawCharts();}
      }
    },1000);
  };

  // === Buddy ===
  function buildBuddies(){
    var concern=(document.getElementById('concern').value||(get('profile')||{}).c)||'none';
    var all={
      overweight:[{n:'小雨（8岁）',d:'正在学游泳，已经坚持2周了',a:'👧',c:'pk',t:'一起游泳'},{n:'小涛（10岁）',d:'骑自行车一个月瘦了2斤',a:'👦',c:'bl',t:'一起骑车'},{n:'小美（9岁）',d:'和你一样喜欢快走散步',a:'👧',c:'gn',t:'一起散步'}],
      underweight:[{n:'小杰（11岁）',d:'跳绳达人，已经能跳200个',a:'👦',c:'bl',t:'一起跳绳'},{n:'小琳（7岁）',d:'每天做仰卧起坐收集星星',a:'👧',c:'pk',t:'一起练力量'}],
      stamina:[{n:'小宇（9岁）',d:'从跑1分钟到跑10分钟，花了2个月',a:'👦',c:'yl',t:'一起慢跑'},{n:'小雨（8岁）',d:'踢毽子高手，教你技巧',a:'👧',c:'pk',t:'一起练'}],
      shy:[{n:'小美（9岁）',d:'以前也不敢运动，现在在家做瑜伽很自信',a:'👧',c:'gn',t:'一起瑜伽'},{n:'小琳（7岁）',d:'跟着视频跳舞，变得越来越大方',a:'👧',c:'pk',t:'一起跳舞'}],
      quit:[{n:'小杰（10岁）',d:'以前总是放弃，现在连续打卡21天',a:'👦',c:'bl',t:'互相监督'},{n:'小涛（11岁）',d:'拍皮球花样很多，超有趣',a:'👦',c:'yl',t:'一起玩'}],
      none:[{n:'小雨（8岁）',d:'什么都想试试的运动小达人',a:'👧',c:'pk',t:'一起探索'},{n:'小宇（11岁）',d:'连续打卡21天，运动达人',a:'👦',c:'yl',t:'一起练'},{n:'小杰（10岁）',d:'游泳跑步球类都喜欢',a:'👦',c:'bl',t:'一起玩'}]
    };
    var list=all[concern]||all.none, html='';
    list.forEach(function(b){html+='<div class="buddy"><div class="buddy-av '+b.c+'">'+b.a+'</div><div class="buddy-info"><div class="buddy-name">'+b.n+'</div><div class="buddy-desc">'+b.d+'</div></div><span class="buddy-tag">+ '+b.t+'</span></div>';});
    document.getElementById('buddyList').innerHTML=html;
  }

  // === Charts ===
  function drawCharts(){
    var cs=getComputedStyle(document.documentElement),
        accent=cs.getPropertyValue('--accent').trim(),
        accent2=cs.getPropertyValue('--accent2').trim(),
        muted=cs.getPropertyValue('--muted').trim();
    // Weekly
    var d1=document.getElementById('chart1');
    if(d1){
      var e1=echarts.getInstanceByDom(d1);if(e1)e1.dispose();
      var c1=echarts.init(d1,null,{renderer:'svg'});
      var ck=get('ck')||{}, dd=[];
      for(var i=0;i<7;i++) dd.push(ck['d'+i]===true?60+Math.floor(Math.random()*30):0);
      c1.setOption({animation:false,title:{text:'本周运动完成情况',left:'center',top:0,textStyle:{fontSize:11,color:muted}},
        tooltip:{trigger:'axis',appendToBody:true,formatter:function(p){return['一','二','三','四','五','六','日'][p[0].dataIndex]+': '+(p[0].value>0?'已完成':'未完成')}},
        grid:{left:30,right:16,top:28,bottom:16},
        xAxis:{data:['一','二','三','四','五','六','日'],axisLabel:{fontSize:10,color:muted}},
        yAxis:{show:false,min:0,max:100},
        series:[{type:'bar',data:dd.map(function(v){return{value:v,itemStyle:{color:v>0?accent2:muted+'33'}}}),barWidth:18,itemStyle:{borderRadius:[8,8,0,0]}}]
      });
      window.addEventListener('resize',function(){c1.resize()});
    }
    // BMI History
    var d2=document.getElementById('chart2');
    if(d2){
      var e2=echarts.getInstanceByDom(d2);if(e2)e2.dispose();
      var hist=get('bmiHist')||[];
      if(hist.length<2){d2.innerHTML='<div style="text-align:center;padding:40px 0;color:'+muted+';font-size:.8rem">BMI趋势图：多次测评后自动生成（已记录 '+hist.length+' 次）</div>';return;}
      var c2=echarts.init(d2,null,{renderer:'svg'});
      c2.setOption({animation:false,title:{text:'BMI变化趋势',left:'center',top:0,textStyle:{fontSize:11,color:muted}},
        tooltip:{trigger:'axis',appendToBody:true},
        grid:{left:30,right:16,top:28,bottom:16},
        xAxis:{type:'category',data:hist.map(function(h){return h.d}),axisLabel:{fontSize:10,color:muted,rotate:30}},
        yAxis:{type:'value',min:function(v){return Math.floor(v.min-2)},max:function(v){return Math.ceil(v.max+2)},axisLabel:{fontSize:10,color:muted}},
        series:[{type:'line',data:hist.map(function(h){return h.v}),smooth:true,lineStyle:{color:accent,width:2},itemStyle:{color:accent},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:accent+'33'},{offset:1,color:accent+'05'}]}}}]
      });
      window.addEventListener('resize',function(){c2.resize()});
    }
  }

  // === Confetti ===
  function confetti(){
    var c=document.createElement('div');c.className='confetti';
    var colors=['#FF6B35','#00B894','#0984E3','#FDCB6E','#E17055'];
    for(var i=0;i<25;i++){var p=document.createElement('div');p.className='confetti-p';p.style.left=Math.random()*100+'%';p.style.background=colors[Math.floor(Math.random()*colors.length)];p.style.animationDelay=Math.random()*0.5+'s';p.style.borderRadius=Math.random()>0.5?'50%':'0';c.appendChild(p);}
    document.body.appendChild(c);setTimeout(function(){c.remove()},2000);
  }

  // === Init ===
  (function(){
    var pf=get('profile');
    if(pf){
      document.getElementById('age').value=pf.age||9;
      document.getElementById('height').value=pf.h||'';
      document.getElementById('weight').value=pf.w||'';
      document.getElementById('concern').value=pf.c||'none';
      document.querySelectorAll('.concern-card').forEach(function(c){c.classList.toggle('selected',c.getAttribute('data-v')===pf.c)});
    }
    initWeather();
  })();
})();