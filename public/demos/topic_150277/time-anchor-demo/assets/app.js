(function(){
  var $=id=>document.getElementById(id);
  var entries=[
    {title:'出门一路绿灯',time:'2026-07-03 08:31',weather:'晴，微风，24℃',location:'通勤路口',mood:'开心',source:'自己选择',event:'上班路上一路绿灯',content:'早上出门很顺，路口一路绿灯，像是城市悄悄给了我一点鼓励。',note:'顺利的小事也值得被保存。'},
    {title:'路边的绿树',time:'2026-07-09 18:47',weather:'多云，22℃',location:'梧桐路',mood:'平静',source:'智能手表',event:'下班路上看见绿树',content:'今天有点累，但路边的树被风吹得很轻，我走慢了一点。',note:'慢一点也没关系。'},
    {title:'把蓝天留在今天',time:'2026-07-13 20:36',weather:'晴，微风，24℃',location:'公司楼下的梧桐路口附近',mood:'被治愈',source:'自己选择',event:'下班路上抬头看见蓝天',content:'今天工作有点忙，但回家路上风很舒服。我在路口等红灯时抬头看见蓝天，突然觉得这一刻值得被记住。',note:'如果某天难过，就回来看看：你曾经也被很小的事情照亮过。'}
  ];
  var samples=[
    ['久违的旅行','海边民宿附近','开心','自己选择','周末去了海边','我很久没有这样认真看海，风吹过来的时候，整个人都松了一点。'],
    ['雨后的小路','小区门口','平静','智能手表','雨停后散步','地面还有水光，路灯照在树叶上，像一小段安静电影。'],
    ['今天也撑过去了','回家路上','勇敢','自己选择','完成了一件拖很久的事','事情没有想象中那么难，我还是把它做完了。']
  ];
  function now(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
  function getForm(){return {title:$('title').value,time:$('time').value,weather:$('weather').value,location:$('location').value,mood:$('mood').value,source:$('source').value,event:$('event').value,content:$('content').value,note:$('note').value}}
  function sync(){var e=getForm();$('previewTitle').textContent=e.title;$('previewTime').textContent=e.time.split(' ')[1]||e.time;$('previewWeather').textContent=e.weather;$('previewMood').textContent=e.mood;$('previewSource').textContent=e.source;$('previewLocation').textContent='定位位置：'+e.location;$('previewEvent').textContent='事件：'+e.event;$('previewContent').textContent=e.content;$('previewNote').textContent='给未来自己：'+e.note}
  function renderList(){ $('entryList').innerHTML=entries.slice().reverse().map((e,i)=>'<article class="entry"><div class="thumb"></div><div><h3>'+e.title+'</h3><div class="badges"><span class="badge">'+e.mood+'</span><span class="badge">'+e.source+'</span><span class="badge">'+e.weather+'</span></div><p>'+e.content+'</p><div class="actions"><button class="secondary" data-open="'+(entries.length-1-i)+'">查看</button><button class="secondary" data-del="'+(entries.length-1-i)+'">删除</button></div></div></article>').join('')||'<div class="empty">还没有日记，先保存今天的锚点吧。</div>'}
  function renderCalendar(){var days=Array.from({length:31},(_,i)=>i+1);var has=new Set(entries.map(e=>Number(e.time.slice(8,10))));$('calendarGrid').innerHTML=days.map(d=>'<div class="day '+(has.has(d)?'has':'')+'">'+d+(has.has(d)?'<br>有锚点':'')+'</div>').join('')}
  function renderSummary(){var moodCount={};var sourceCount={};entries.forEach(e=>{moodCount[e.mood]=(moodCount[e.mood]||0)+1;sourceCount[e.source]=(sourceCount[e.source]||0)+1});var top=o=>Object.keys(o).sort((a,b)=>o[b]-o[a])[0]||'-';$('count').textContent=entries.length;$('happy').textContent=entries.filter(e=>['开心','被治愈','平静'].includes(e.mood)).length;$('sumCount').textContent=entries.length;$('sumMood').textContent=top(moodCount);$('sumSource').textContent=top(sourceCount);$('summaryText').textContent='最近的记录里，你多次把通勤、风景、散步和完成小事的瞬间保存下来。这些内容说明：普通日子并不是空白的，它们正在慢慢组成你的生活记忆。'}
  function render(){sync();renderList();renderCalendar();renderSummary()}
  $('time').value=now();document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',sync));
  $('save').addEventListener('click',function(){entries.push(getForm());$('modalTitle').textContent='已保存今天的锚点';$('modalText').textContent='这篇日记已经加入时间线和本月汇总。';$('modal').classList.add('show');render()});
  $('random').addEventListener('click',function(){var s=samples[Math.floor(Math.random()*samples.length)];$('title').value=s[0];$('location').value=s[1];$('mood').value=s[2];$('source').value=s[3];$('event').value=s[4];$('content').value=s[5];$('note').value='以后再看到这一页，希望你记得这一天真实存在过。';sync()});
  document.body.addEventListener('click',function(e){if(e.target.dataset.open){var x=entries[Number(e.target.dataset.open)];$('modalTitle').textContent=x.title;$('modalText').textContent=x.time+' · '+x.location+' · '+x.mood+'\\n\\n'+x.content;$('modal').classList.add('show')}if(e.target.dataset.del){entries.splice(Number(e.target.dataset.del),1);render()}});
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(btn.dataset.view).classList.add('active');$('viewTitle').textContent={today:'今日记录',timeline:'日记时间线',summary:'多篇日记汇总'}[btn.dataset.view]}));
  $('close').addEventListener('click',()=>$('modal').classList.remove('show'));$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').classList.remove('show')});
  render();
})();
