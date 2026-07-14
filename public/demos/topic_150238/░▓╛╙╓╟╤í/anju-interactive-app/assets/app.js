(function(){
  var houses=[
    {id:1,title:'青禾里一居室',area:'青禾里',type:'房东直租',price:2850,commute:32,value:92,route:'2号线直达，步行8分钟到地铁口',facility:'商超、餐饮、药店、地铁',desc:'适合预算有限又希望通勤稳定的职场新人。房东身份、房源实拍、地址一致性均已认证。',tags:['已认证','房东直租','高性价比']},
    {id:2,title:'云桥社区南向开间',area:'云桥社区',type:'中介帮租',price:3200,commute:41,value:86,route:'公交接驳1次，地铁3站到公司',facility:'健身房、公园、大型超市',desc:'适合重视生活便利的人，中介可协助沟通、带看、议价和合同审核。',tags:['已认证','中介帮租','生活便利']},
    {id:3,title:'北岸新村合租主卧',area:'北岸新村',type:'房东直租',price:2380,commute:48,value:88,route:'骑行9分钟到地铁站，换乘1次',facility:'菜市场、社区医院、安静小区',desc:'适合价格敏感、可接受稍长通勤的人。房源经过出租身份和实拍核验。',tags:['已认证','房东直租','低预算']},
    {id:4,title:'松屿公寓精装单间',area:'松屿公寓',type:'中介帮租',price:3600,commute:26,value:84,route:'地铁2站直达，早高峰路线稳定',facility:'洗衣房、快递柜、自习区、餐饮',desc:'适合希望省心入住的人，中介帮忙对接公寓方、确认入住细节。',tags:['已认证','中介帮租','拎包入住']},
    {id:5,title:'栖木花园小两居',area:'栖木花园',type:'中介帮租',price:3980,commute:36,value:90,route:'地铁直达后步行12分钟',facility:'商场、医院、绿地、幼儿园',desc:'适合合租或情侣居住，设施完整，空间更舒适，认证资料齐全。',tags:['已认证','中介帮租','高性价比']}
  ];
  var state={filter:'全部',favorites:new Set(),compare:new Set(),appointments:[],selected:null};
  var $=function(id){return document.getElementById(id)};
  function formSummary(){return {company:$('company').value||'未填写公司地',moveIn:$('moveIn').value,mode:$('mode').value,time:$('time').value,budget:$('budget').value,value:$('value').value};}
  function visible(){var arr=houses.slice();if(state.filter==='房东直租'||state.filter==='中介帮租')arr=arr.filter(h=>h.type===state.filter);if(state.filter==='高性价比')arr=arr.filter(h=>h.value>=88);return arr.sort((a,b)=>b.value-a.value)}
  function badge(t){var c=t==='中介帮租'?'badge red':(t==='房东直租'||t==='高性价比'?'badge gold':'badge');return '<span class="'+c+'">'+t+'</span>'}
  function card(h){var fav=state.favorites.has(h.id),cmp=state.compare.has(h.id);return '<article class="house"><div class="pic"></div><div><div class="badges">'+h.tags.map(badge).join('')+'</div><h3>'+h.title+'</h3><p class="desc">'+h.desc+'</p><div class="meta"><div><b>'+h.price+'元</b><span>月租</span></div><div><b>'+h.commute+'分钟</b><span>通勤</span></div><div><b>'+h.value+'分</b><span>性价比</span></div><div><b>'+h.type+'</b><span>服务</span></div></div><p class="desc">路线：'+h.route+'<br>设施：'+h.facility+'</p><div class="actions"><button class="secondary" data-detail="'+h.id+'">详情</button><button class="secondary" data-fav="'+h.id+'">'+(fav?'取消收藏':'收藏')+'</button><button class="secondary" data-compare="'+h.id+'">'+(cmp?'移出对比':'加入对比')+'</button><button class="primary" data-book="'+h.id+'">预约看房</button></div></div></article>'}
  function renderHome(){var arr=visible();$('houseList').innerHTML=arr.map(card).join('')||'<div class="empty">暂无匹配房源，试试放宽预算或通勤时间。</div>';$('houseCount').textContent=arr.length;var f=formSummary();$('summaryText').textContent='基于'+f.company+'，预计'+f.moveIn+'入住，'+f.mode+'，'+f.time+'，'+f.budget+'生成。'}
  function renderFavorites(){var arr=houses.filter(h=>state.favorites.has(h.id));$('favoriteList').innerHTML=arr.map(card).join('')||'<div class="empty">还没有收藏房源。点击房源卡片里的“收藏”即可加入。</div>'}
  function renderCompare(){var arr=houses.filter(h=>state.compare.has(h.id));$('compareList').innerHTML=arr.map(h=>'<div class="mini-card"><h3>'+h.title+'</h3><p>'+h.area+' · '+h.type+'</p><p>月租 '+h.price+' 元，通勤 '+h.commute+' 分钟，性价比 '+h.value+' 分。</p><p>设施：'+h.facility+'</p></div>').join('')||'<div class="empty">还没有加入对比的房源，最多建议对比 3 套。</div>'}
  function renderAppointments(){ $('appointmentList').innerHTML=state.appointments.map(a=>'<div class="appt"><div><b>'+a.title+'</b><p class="desc">'+a.time+' · '+a.type+'</p></div><button class="secondary" data-cancel="'+a.id+'">取消</button></div>').join('')||'<div class="empty">暂无预约记录。</div>'}
  function renderAll(){renderHome();renderFavorites();renderCompare();renderAppointments();$('favCount').textContent=state.favorites.size;$('apptCount').textContent=state.appointments.length}
  function openDetail(id){var h=houses.find(x=>x.id===id);state.selected=h;$('modalTitle').textContent=h.title;$('modalDesc').textContent=h.desc;$('modalDetails').innerHTML='<div><b>'+h.price+' 元/月</b><span>价格</span></div><div><b>'+h.commute+' 分钟</b><span>通勤</span></div><div><b>'+h.value+' 分</b><span>性价比</span></div><div><b>'+h.type+'</b><span>服务方式</span></div><div><b>认证</b><span>实拍、地址、出租身份已核验</span></div><div><b>'+h.area+'</b><span>推荐区域</span></div>';$('modal').classList.add('show')}
  function book(h){state.selected=h;$('visitTime').value='明天 10:00';openDetail(h.id)}
  document.querySelectorAll('.chip').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.filter=btn.dataset.filter;renderAll()}));
  $('generate').addEventListener('click',renderAll);
  $('clear').addEventListener('click',function(){state.favorites.clear();state.compare.clear();state.appointments=[];renderAll()});
  document.body.addEventListener('click',function(e){
    var t=e.target, id;
    if(t.dataset.detail){openDetail(Number(t.dataset.detail))}
    if(t.dataset.fav){id=Number(t.dataset.fav);state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);renderAll()}
    if(t.dataset.compare){id=Number(t.dataset.compare);state.compare.has(id)?state.compare.delete(id):(state.compare.size<3?state.compare.add(id):alert('最多对比 3 套房源'));renderAll()}
    if(t.dataset.book){book(houses.find(h=>h.id===Number(t.dataset.book)))}
    if(t.dataset.cancel){state.appointments=state.appointments.filter(a=>a.id!==Number(t.dataset.cancel));renderAll()}
  });
  document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(btn.dataset.view).classList.add('active');$('viewTitle').textContent={home:'首页推荐',favorites:'我的收藏',compare:'房源对比',appointments:'预约记录'}[btn.dataset.view]}));
  $('closeModal').addEventListener('click',()=>$('modal').classList.remove('show'));
  $('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').classList.remove('show')});
  $('bookNow').addEventListener('click',function(){if(!state.selected)return;state.appointments.push({id:Date.now(),title:state.selected.title,type:state.selected.type,time:$('visitTime').value});$('modal').classList.remove('show');renderAll();alert('预约已生成，可在“预约”中查看。')});
  renderAll();
})();
