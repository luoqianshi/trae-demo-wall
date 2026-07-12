/* 齐鲁志愿罗盘 - 交互逻辑（返工版） */
(function(){
"use strict";
var DATA=null,ALL_VOL=[],STUDENT=null;
var POOL=[];           // 候选池
var FINAL_96=[];       // 最终96志愿方案
var DISPLAY=[];        // 当前显示的列表（候选池或96方案）
var MODE='pool';       // 'pool' 或 'final'
var TIER_FILTER='all',SEARCH='',OWN_FILTER='all';

// 暴露内部状态供自动化测试访问（不参与业务逻辑）
Object.defineProperty(window,'_app_state',{get:function(){return {POOL:POOL,FINAL_96:FINAL_96,MODE:MODE,TIER_FILTER:TIER_FILTER}}});
Object.defineProperty(window,'FINAL_96',{get:function(){return FINAL_96}});
Object.defineProperty(window,'POOL',{get:function(){return POOL}});
Object.defineProperty(window,'MODE',{get:function(){return MODE}});

// ===== 工具 =====
function $(s,p){return (p||document).querySelector(s)}
function $all(s,p){return Array.prototype.slice.call((p||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return n==null?'-':Number(n).toLocaleString()}
// 保研率格式化：数据库是比例值(0.59=59%)，需×100
function formatRate(rate){
  var n=Number(rate);
  if(!n||isNaN(n))return '-';
  return (n<=1?n*100:n).toFixed(2)+'%';
}

// ===== 选科匹配 =====
function subjectMatch(req,subs){
  if(!req||req==='不限'||req==='')return true;
  var need=[];
  ['物理','化学','生物','历史','地理','政治'].forEach(function(s){if(req.indexOf(s)>=0)need.push(s)});
  if(!need.length)return true;
  var has={};subs.forEach(function(s){has[s]=1});
  if(/和|且/.test(req))return need.every(function(s){return has[s]});
  return need.some(function(s){return has[s]});
}

// ===== 冲稳保分类 =====
function classifyTier(refRank,R){
  if(!refRank||!R)return 'new';
  var wenUpper=R<=250000?R+30000:Math.round(R*1.2);
  if(refRank<R)return 'chong';
  if(refRank<=wenUpper)return 'wen';
  return 'bao';
}

// ===== 判断办学性质 =====
function isMinban(v){return v.ownership==='民办'}
function isZhongwai(v){
  var txt=(v.major_full||'')+(v.note||'')+v.ownership;
  return /中外合作|内地与港澳台|境外高校|合作办学/.test(txt);
}
function isGaoshou(v){return v.tuition>=18000}

// ===== 筛选候选池 =====
function computePool(student){
  var R=student.rank,subs=student.subjects,tLimit=student.tuition_limit||999999;
  var excl=student.province_exclude||[];
  var mPref=student.major_pref||[],mExcl=student.major_exclude||[];
  var accMinban=student.accept_minban!==false;      // 默认接受
  var accZw=student.accept_zhongwai!==false;
  var accGs=student.accept_gaoshou!==false;

  var filtered=ALL_VOL.filter(function(v){
    if(v.level&&v.level.indexOf('本科')<0)return false;
    if(!subjectMatch(v.req,subs))return false;
    if(v.tuition>tLimit)return false;
    // 排斥省份：强制排除
    if(excl.length&&excl.indexOf(v.province)>=0)return false;
    // 办学性质过滤
    if(!accMinban&&isMinban(v))return false;
    if(!accZw&&isZhongwai(v))return false;
    if(!accGs&&isGaoshou(v))return false;
    var mn=(v.major_full||'')+(v.major||'');
    if(mExcl.length&&mExcl.some(function(k){return mn.indexOf(k)>=0}))return false;
    if(mPref.length&&!mPref.some(function(k){return mn.indexOf(k)>=0}))return false;
    return true;
  });

  // 分档：新增专业独立分档（P0修复）
  filtered.forEach(function(v){
    v._tier=classifyTier(v.ref_rank,R);
    if(v.is_new)v._tier='new';  // 新增专业一律进独立档
  });

  // 排序：偏好省份加权（不排除其他省份），档内按位次接近度
  var prefProv=student.province_pref||[];
  filtered.sort(function(a,b){
    var order={chong:0,wen:1,bao:2,new:3};
    if(order[a._tier]!==order[b._tier])return order[a._tier]-order[b._tier];
    // 偏好省份排序加权
    var aPref=prefPrefWeight(a.province,prefProv);
    var bPref=prefPrefWeight(b.province,prefProv);
    if(aPref!==bPref)return bPref-aPref; // 偏好省份排前
    return Math.abs(a.ref_rank-R)-Math.abs(b.ref_rank-R);
  });
  return filtered;
}
function prefPrefWeight(prov,prefList){
  if(!prefList||!prefList.length)return 0;
  return prefList.some(function(p){return prov.indexOf(p)>=0})?1:0;
}

// ===== 生成最终96志愿方案 =====
function build96(pool){
  var chong=[],wen=[],bao=[],newp=[];
  pool.forEach(function(v){
    if(v._tier==='chong')chong.push(v);
    else if(v._tier==='wen')wen.push(v);
    else if(v._tier==='bao')bao.push(v);
    else newp.push(v);
  });
  // 目标比例：冲24 稳40 保32 = 96（新增不挤占保底）
  var TARGET={chong:24,wen:40,bao:32};
  var result=[];
  var picks={
    chong:chong.slice(0,TARGET.chong),
    wen:wen.slice(0,TARGET.wen),
    bao:bao.slice(0,TARGET.bao)
  };
  // 如果某档不足，从其他档补（优先稳→保）
  var total=picks.chong.length+picks.wen.length+picks.bao.length;
  if(total<96){
    var deficit=96-total;
    // 先从保底补
    var extraBao=bao.slice(TARGET.bao,TARGET.bao+deficit);
    picks.bao=picks.bao.concat(extraBao);
    deficit-=extraBao.length;
    // 再从稳档补
    if(deficit>0){
      var extraWen=wen.slice(TARGET.wen,TARGET.wen+deficit);
      picks.wen=picks.wen.concat(extraWen);
      deficit-=extraWen.length;
    }
    // 再从冲档补
    if(deficit>0){
      var extraChong=chong.slice(TARGET.chong,TARGET.chong+deficit);
      picks.chong=picks.chong.concat(extraChong);
    }
  }
  result=picks.chong.concat(picks.wen,picks.bao);
  // 新增专业作为特殊备选附加（不挤占96名额）
  return {volunteers:result,newSpecial:newp};
}

// ===== 入选理由 =====
function buildReason(v,student){
  var R=student.rank,tier=v._tier;
  var parts=[];
  var diff=v.ref_rank-R;
  if(tier==='chong'){
    parts.push('该校往年录取位次 '+fmt(v.ref_rank)+'，比考生位次 '+fmt(R)+' 靠前 '+fmt(Math.abs(diff))+' 名，属于冲档尝试。');
  }else if(tier==='wen'){
    parts.push('该校往年录取位次 '+fmt(v.ref_rank)+'，与考生位次 '+fmt(R)+' 接近（差 '+fmt(Math.abs(diff))+' 名），录取把握较大。');
  }else if(tier==='bao'){
    parts.push('该校往年录取位次 '+fmt(v.ref_rank)+'，明显低于考生位次 '+fmt(R)+'（低 '+fmt(Math.abs(diff))+' 名），可作为保底。');
  }else{
    parts.push('新增专业，无往年录取数据参考，单独标记不作为稳妥保底。');
  }
  if(v.req==='不限'||!v.req)parts.push('选科要求「不限」，'+student.subjects.join('')+'可报。');
  else parts.push('选科要求「'+v.req+'」，考生选科匹配。');
  if(v.tuition>0&&v.tuition<=5000)parts.push('学费 '+v.tuition+' 元/年，公办正常水平。');
  else if(v.tuition>5000&&v.tuition<18000)parts.push('学费 '+v.tuition+' 元/年。');
  else if(v.tuition>=18000)parts.push('学费 '+v.tuition+' 元/年，属于较高收费。');
  if(student.major_pref&&student.major_pref.length){
    var mn=(v.major_full||'')+(v.major||'');
    student.major_pref.forEach(function(k){if(mn.indexOf(k)>=0)parts.push('专业含「'+k+'」，符合你的专业偏好。')});
  }
  if(student.province_pref&&student.province_pref.length){
    if(student.province_pref.some(function(p){return v.province.indexOf(p)>=0}))parts.push('位于'+v.province+'，属于你的偏好省份，排序加权。');
  }
  if(v.city_tier&&/一线|新一线/.test(v.city_tier))parts.push('位于'+v.city+'（'+v.city_tier+'），区位较好。');
  if(v.保研率&&Number(v.保研率)>0)parts.push('保研率 '+formatRate(v.保研率)+'。');
  return parts;
}

// ===== 风险提醒 =====
function buildRisks(v){
  var rs=(v.risks||[]).slice();
  if(v.tuition>=30000&&rs.indexOf('高收费')<0)rs.push('高收费');
  if(v.note&&/色盲|色弱|体检|不予录取|不招/.test(v.note)&&rs.indexOf('体检/色觉限制')<0)rs.push('体检/色觉限制');
  return rs;
}

// ===== 渲染统计卡 =====
function renderStats(){
  var counts={chong:0,wen:0,bao:0,new:0};
  var list=MODE==='final'?FINAL_96:POOL;
  list.forEach(function(v){
    if(v._tier)counts[v._tier]=(counts[v._tier]||0)+1;
  });
  if(MODE==='final'){
    // 96方案不包含新增
    $('#statTotal').textContent=FINAL_96.length;
    $('#statChong').textContent=counts.chong||0;
    $('#statWen').textContent=counts.wen||0;
    $('#statBao').textContent=counts.bao||0;
    $('#statNew').textContent=POOL.filter(function(v){return v._tier==='new'}).length;
  }else{
    $('#statTotal').textContent=POOL.length;
    $('#statChong').textContent=counts.chong||0;
    $('#statWen').textContent=counts.wen||0;
    $('#statBao').textContent=counts.bao||0;
    $('#statNew').textContent=counts.new||0;
  }
}

// ===== 渲染表格 =====
function renderTable(){
  // 最终96模式下：新增档从 POOL 取（附加备选不占96名额）；其他档从 FINAL_96 取
  var base;
  if(MODE==='final'){
    if(TIER_FILTER==='new'){
      base=POOL.filter(function(v){return v._tier==='new'});
    }else{
      base=FINAL_96.slice();
    }
  }else{
    base=POOL.slice();
  }
  var list=base;
  // 档位过滤
  if(TIER_FILTER!=='all'){
    if(TIER_FILTER==='new'){
      list=list.filter(function(v){return v._tier==='new'});
    }else{
      list=list.filter(function(v){return v._tier===TIER_FILTER});
    }
  }
  // 办学性质过滤
  if(OWN_FILTER!=='all'){
    list=list.filter(function(v){
      if(OWN_FILTER==='gongban')return !isMinban(v)&&!isZhongwai(v);
      if(OWN_FILTER==='minban')return isMinban(v);
      if(OWN_FILTER==='zhongwai')return isZhongwai(v);
      if(OWN_FILTER==='gaoshou')return isGaoshou(v);
      return true;
    });
  }
  // 搜索
  if(SEARCH){
    var q=SEARCH.toLowerCase();
    list=list.filter(function(v){
      return (v.school+v.major_full+v.major+v.province+v.city+v.category).toLowerCase().indexOf(q)>=0;
    });
  }
  // 更新模式标签
  updateModeLabel();
  var tb=$('#vBody');
  if(!list.length){
    tb.innerHTML='<tr><td colspan="8" class="empty"><div class="big">🔍</div>没有匹配的志愿，试试调整筛选条件</td></tr>';
    return;
  }
  var rows=list.slice(0,300).map(function(v){
    var tierName={chong:'冲',wen:'稳',bao:'保',new:'新'}[v._tier];
    var tierClass='tier-'+v._tier;
    var risks=buildRisks(v).map(function(r){
      var cls={'新增专业':'r-new','民办院校':'r-minban','中外合作':'r-zhongwai','高收费':'r-gaoshou','体检/色觉限制':'r-tijian','历史波动较大':'r-bodong','单科成绩要求':'r-tijian'}[r]||'r-bodong';
      return '<span class="risk-tag '+cls+'">'+esc(r)+'</span>';
    }).join('');
    var tuition=v.tuition>0?fmt(v.tuition)+'元':'-';
    var tClass=v.tuition>=18000?'tuition-warn':'';
    return '<tr data-idx="'+POOL.indexOf(v)+'">'+
      '<td><span class="tier-tag '+tierClass+'">'+tierName+'</span></td>'+
      '<td class="school-name">'+esc(v.school)+'</td>'+
      '<td class="major-name">'+esc(v.major_full)+'</td>'+
      '<td>'+esc(v.province)+' '+esc(v.city)+'</td>'+
      '<td>'+esc(v.req||'不限')+'</td>'+
      '<td>'+v.ref_score+'</td>'+
      '<td>'+fmt(v.ref_rank)+'</td>'+
      '<td class="'+tClass+'">'+tuition+(risks?'<br>'+risks:'')+'</td>'+
      '</tr>';
  });
  tb.innerHTML=rows.join('');
  if(list.length>300){
    tb.innerHTML+='<tr><td colspan="8" style="text-align:center;color:#7f8c8d;padding:10px">仅显示前 300 条，共 '+list.length+' 条，请用搜索缩小范围</td></tr>';
  }
  $all('#vBody tr[data-idx]').forEach(function(tr){
    tr.onclick=function(){openDetail(POOL[+tr.dataset.idx])};
  });
}

// ===== 更新模式标签 =====
function updateModeLabel(){
  var label=$('#modeLabel');
  if(!label)return;
  if(MODE==='pool'){
    label.textContent='当前：候选志愿池';
    return;
  }
  // final 模式
  if(TIER_FILTER==='new'){
    label.textContent='当前：新增专业附加备选（不占96名额）';
  }else{
    label.textContent='当前：最终96志愿方案（实际 '+FINAL_96.length+' 条）';
  }
}

function renderAll(){
  renderStats();
  renderTable();
}

// ===== 详情弹窗 =====
function openDetail(v){
  var tierName={chong:'冲档',wen:'稳档',bao:'保底',new:'新增（不作为稳妥保底）'}[v._tier];
  var reasons=buildReason(v,STUDENT);
  var risks=buildRisks(v);
  var m=$('#modal');
  // P0: 所有进入 innerHTML 的内容都转义
  var riskHtml=risks.length?risks.map(function(r){
    return '<span class="risk-tag '+(r.indexOf('新增')>=0?'r-new':r.indexOf('民办')>=0?'r-minban':r.indexOf('中外')>=0?'r-zhongwai':r.indexOf('高收费')>=0?'r-gaoshou':'r-tijian')+'">'+esc(r)+'</span>';
  }).join(''):'<span style="color:#27ae60">无明显风险标签</span>';
  // P1: 空年份处理
  var yearText=v.ref_year?('（'+esc(v.ref_year)+'年）'):'';
  var scoreLabel=v.ref_year?'往年最低分':'最近一年最低分';
  m.querySelector('.modal-body').innerHTML=
    '<h3>'+esc(v.major_full)+'<span class="close" onclick="document.getElementById(\'modal\').classList.remove(\'show\')">×</span></h3>'+
    '<div class="m-school">'+esc(v.school)+' · '+esc(v.province)+' '+esc(v.city||'')+' · '+esc(v.ownership)+'</div>'+
    '<div class="m-tags">'+riskHtml+'</div>'+
    '<div class="m-section"><div class="reason"><b>入选理由：</b><br>'+reasons.map(function(p){return '· '+esc(p)}).join('<br>')+'</div></div>'+
    (risks.length?'<div class="m-section"><div class="risk-warn"><b>风险提醒：</b><br>'+risks.map(function(r){return '· '+esc(r)}).join('<br>')+'</div></div>':'')+
    '<div class="m-section"><h4>关键数据</h4>'+
    '<div class="m-row"><span class="k">分档</span><span>'+esc(tierName)+'</span></div>'+
    '<div class="m-row"><span class="k">'+scoreLabel+'</span><span>'+v.ref_score+' 分'+yearText+'</span></div>'+
    '<div class="m-row"><span class="k">往年最低位次</span><span>'+fmt(v.ref_rank)+'</span></div>'+
    '<div class="m-row"><span class="k">2026 预估位次</span><span>'+(v.est_rank_2026?fmt(v.est_rank_2026):'-')+'</span></div>'+
    '<div class="m-row"><span class="k">选科要求</span><span>'+esc(v.req||'不限')+'</span></div>'+
    '<div class="m-row"><span class="k">学费</span><span>'+(v.tuition>0?fmt(v.tuition)+' 元/年':'-')+'</span></div>'+
    '<div class="m-row"><span class="k">学制</span><span>'+esc(v.duration||'-')+' 年</span></div>'+
    '<div class="m-row"><span class="k">办学性质</span><span>'+esc(v.ownership)+'</span></div>'+
    '<div class="m-row"><span class="k">院校类型</span><span>'+esc(v.school_type||'-')+'</span></div>'+
    '<div class="m-row"><span class="k">城市层级</span><span>'+esc(v.city_tier||'-')+'</span></div>'+
    (v.保研率&&Number(v.保研率)>0?'<div class="m-row"><span class="k">保研率</span><span>'+formatRate(v.保研率)+'</span></div>':'')+
    '</div>'+
    (v.note?'<div class="m-section"><h4>专业备注</h4><p>'+esc(v.note)+'</p></div>':'')+
    '<div class="m-section" style="font-size:12px;color:#7f8c8d;border-top:1px solid #eee;padding-top:10px">本解释仅基于往年数据辅助决策，不承诺录取。正式填报以山东省教育招生考试院和高校招生章程为准。</div>';
  m.classList.add('show');
}

// ===== 读取表单 =====
function readForm(){
  var score=parseInt($('#fScore').value);
  var rank=parseInt($('#fRank').value);
  if(!rank||rank<=0){alert('请输入有效的考生位次（必须为正数）');return null}
  var subs=[];
  $all('.subjects input[value]:checked').forEach(function(c){subs.push(c.value)});
  // P1: 选科必须且只能3门
  if(subs.length!==3){alert('请选择且只能选择 3 门选考科目（当前选了 '+subs.length+' 门）');return null}
  var tLimit=parseInt($('#fTuition').value)||999999;
  var pref=($('#fPref').value||'').split(/[,，\s]+/).filter(Boolean);
  var excl=($('#fExcl').value||'').split(/[,，\s]+/).filter(Boolean);
  var mPref=($('#fMPref').value||'').split(/[,，\s]+/).filter(Boolean);
  var mExcl=($('#fMExcl').value||'').split(/[,，\s]+/).filter(Boolean);
  // P1: 办学性质选项
  var accMinban=!$('#fNoMinban')||!$('#fNoMinban').checked;
  var accZw=!$('#fNoZw')||!$('#fNoZw').checked;
  var accGs=!$('#fNoGs')||!$('#fNoGs').checked;
  return {score:score,rank:rank,subjects:subs,tuition_limit:tLimit,
    province_pref:pref,province_exclude:excl,
    major_pref:mPref,major_exclude:mExcl,
    accept_minban:accMinban,accept_zhongwai:accZw,accept_gaoshou:accGs};
}

// ===== 生成候选池 =====
function run(){
  var s=readForm();
  if(!s)return;
  STUDENT=s;
  POOL=computePool(s);
  FINAL_96=[];
  MODE='pool';
  if(POOL.length===0){
    $('#vBody').innerHTML='<tr><td colspan="8" class="empty"><div class="big">😕</div>候选为 0，请放宽学费上限、选科或省份限制</td></tr>';
    renderStats();
  }
  renderAll();
  $('#resultSection').style.display='block';
  $('#btn96').style.display='inline-block';
  $('#modeLabel').textContent='当前：候选志愿池';
  $('#resultSection').scrollIntoView({behavior:'smooth'});
}

// ===== 生成96志愿方案 =====
function run96(){
  if(!POOL.length){alert('请先生成候选池');return}
  var res=build96(POOL);
  FINAL_96=res.volunteers;
  MODE='final';
  TIER_FILTER='all';
  $all('.tier-filter button').forEach(function(b){b.classList.toggle('active',b.dataset.tier==='all')});
  renderAll();
  $('#modeLabel').textContent='当前：最终96志愿方案（实际 '+FINAL_96.length+' 条）';
  if(FINAL_96.length<96){
    alert('候选池数据不足，最终方案仅 '+FINAL_96.length+' 条（目标 96 条）。请放宽筛选条件后重试。');
  }
}

// ===== 样例 =====
function loadSample(i){
  var s=DATA.samples[i];
  $('#fScore').value=s.score;
  $('#fRank').value=s.rank;
  $all('.subjects input').forEach(function(c){c.checked=s.subjects.indexOf(c.value)>=0});
  $('#fTuition').value=s.tuition_limit>=999999?'':s.tuition_limit;
  $('#fPref').value=(s.province_pref||[]).join(',');
  $('#fExcl').value=(s.province_exclude||[]).join(',');
  $('#fMPref').value=(s.major_pref||[]).join(',');
  $('#fMExcl').value=(s.major_exclude||[]).join(',');
  // 重置办学性质
  if($('#fNoMinban'))$('#fNoMinban').checked=false;
  if($('#fNoZw'))$('#fNoZw').checked=false;
  if($('#fNoGs'))$('#fNoGs').checked=false;
  $all('.btn-sample').forEach(function(b,k){b.classList.toggle('active',k===i)});
  run();
}

// ===== 初始化 =====
function init(){
  DATA=window.DEMO_DATA;
  if(!DATA||!DATA.volunteers){
    $('#errBox').style.display='block';
    return;
  }
  ALL_VOL=DATA.volunteers;
  // 样例按钮
  var sb=$('#sampleBtns');
  DATA.samples.forEach(function(s,i){
    var b=document.createElement('button');
    b.className='btn btn-sample';
    b.textContent=s.name;
    b.onclick=function(){loadSample(i)};
    sb.appendChild(b);
  });
  // 事件
  $('#btnRun').onclick=run;
  $('#btn96').onclick=run96;
  $('#btn96').style.display='none';
  $('#btnPrint').onclick=function(){window.print()};
  // 选科即时提示（仅科目输入，不含办学性质复选框）
  $all('.subjects input[value]').forEach(function(cb){
    cb.onchange=function(){
      var n=$all('.subjects input[value]:checked').length;
      if(n>3){
        cb.checked=false;
        alert('选科只能选择 3 门，已选 '+n+' 门。请先取消一个再选。');
      }
    };
  });
  // 档位筛选
  $all('.tier-filter button').forEach(function(b){
    b.onclick=function(){
      $all('.tier-filter button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
      TIER_FILTER=b.dataset.tier;
      renderTable();
    };
  });
  // 办学性质筛选
  $all('.own-filter button').forEach(function(b){
    b.onclick=function(){
      $all('.own-filter button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
      OWN_FILTER=b.dataset.own;
      renderTable();
    };
  });
  $('#fSearch').oninput=function(){SEARCH=this.value.trim();renderTable()};
  $('#modal').onclick=function(e){if(e.target===this||e.target.classList.contains('close'))this.classList.remove('show')};
}
document.addEventListener('DOMContentLoaded',init);
})();
