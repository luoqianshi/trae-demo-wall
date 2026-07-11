// ==================== MOCK DATA ====================
var DATA = {
  cats: [
    { id:1, name:'Mimi', breed:'布偶猫', gender:'母', age:'3岁2月', status:'active', color:'海豹双色', pedigree:'TICA-RG-2023-0891', avatar:'🐱' },
    { id:2, name:'Leo', breed:'布偶猫', gender:'公', age:'2岁8月', status:'active', color:'蓝色双色', pedigree:'TICA-RG-2024-1205', avatar:'😺' },
    { id:3, name:'Luna', breed:'英国短毛', gender:'母', age:'4岁1月', status:'active', color:'蓝色', pedigree:'GCCF-UK-2022-4567', avatar:'🐈' },
    { id:4, name:'Max', breed:'英国短毛', gender:'公', age:'3岁6月', status:'rest', color:'英短蓝白', pedigree:'GCCF-UK-2023-3210', avatar:'😸' },
    { id:5, name:'Bella', breed:'缅因猫', gender:'母', age:'2岁11月', status:'active', color:'棕虎斑', pedigree:'CFA-MC-2023-7890', avatar:'🐱' },
    { id:6, name:'Oscar', breed:'缅因猫', gender:'公', age:'3岁4月', status:'active', color:'银虎斑', pedigree:'CFA-MC-2023-7891', avatar:'😺' },
    { id:7, name:'Coco', breed:'德文卷毛', gender:'母', age:'1岁9月', status:'active', color:'黑色卷毛', pedigree:'TICA-DR-2025-0234', avatar:'🐈' },
    { id:8, name:'Daisy', breed:'布偶猫', gender:'母', age:'5岁', status:'retired', color:'奶油色', pedigree:'TICA-RG-2021-0456', avatar:'😸' }
  ],
  breeding: [
    { id:1, name:'2026春季布偶A系', dam:'Mimi', sire:'Leo', breed:'布偶猫', date:'2026-03-15', status:'lactation', progress:75 },
    { id:2, name:'2026春季布偶B系', dam:'Daisy', sire:'Leo', breed:'布偶猫', date:'2026-04-01', status:'pregnant', progress:55 },
    { id:3, name:'2026春季英短计划', dam:'Luna', sire:'Max', breed:'英短', date:'2026-05-10', status:'mating', progress:30 },
    { id:4, name:'2026缅因虎斑系', dam:'Bella', sire:'Oscar', breed:'缅因猫', date:'2026-06-01', status:'planned', progress:0 },
    { id:5, name:'2025冬季布偶C系', dam:'Mimi', sire:'Oscar', breed:'布偶猫', date:'2025-12-10', status:'completed', progress:100 }
  ],
  kittens: [
    { id:1, name:'小橘', breed:'布偶猫', color:'海豹双色', gender:'公', birth:'2026-04-28', status:'available' },
    { id:2, name:'小白', breed:'布偶猫', color:'奶油色', gender:'母', birth:'2026-04-28', status:'reserved' },
    { id:3, name:'花卷', breed:'英短', color:'蓝白', gender:'母', birth:'2026-03-15', status:'available' },
    { id:4, name:'大胖', breed:'英短', color:'蓝色', gender:'公', birth:'2026-03-15', status:'sold' },
    { id:5, name:'咪咪', breed:'缅因猫', color:'棕虎斑', gender:'公', birth:'2026-05-02', status:'available' },
    { id:6, name:'团子', breed:'布偶猫', color:'蓝色双色', gender:'母', birth:'2026-05-10', status:'keeping' },
    { id:7, name:'豆豆', breed:'缅因猫', color:'银虎斑', gender:'母', birth:'2026-05-02', status:'available' }
  ],
  health: [
    { date:'2026-07-10', cat:'Mimi', type:'体检', desc:'产后42天复查，身体恢复良好，体重4.2kg', doctor:'张医生', status:'正常' },
    { date:'2026-07-08', cat:'Leo', type:'驱虫', desc:'体内外驱虫，使用博来恩+大宠爱', doctor:'李医生', status:'正常' },
    { date:'2026-07-05', cat:'小橘', type:'体检', desc:'满月体检，体重420g，发育正常', doctor:'张医生', status:'正常' },
    { date:'2026-07-03', cat:'Luna', type:'异常', desc:'食欲下降2天，体温38.8°C，需观察', doctor:'王医生', status:'关注' },
    { date:'2026-06-28', cat:'Bella', type:'疫苗', desc:'猫三联加强针第三针', doctor:'李医生', status:'正常' },
    { date:'2026-06-25', cat:'Coco', type:'体检', desc:'6月龄体检，体重2.1kg，发育正常', doctor:'张医生', status:'正常' },
    { date:'2026-06-20', cat:'Max', type:'异常', desc:'皮肤局部脱毛，真菌培养等待中', doctor:'王医生', status:'关注' }
  ],
  vaccines: [
    { cat:'小橘', type:'猫三联', planned:'2026-07-25', actual:'', status:'待接种', trace:'' },
    { cat:'小白', type:'猫三联', planned:'2026-07-25', actual:'2026-07-24', status:'已接种', trace:'VAC-2026-0724-001' },
    { cat:'花卷', type:'狂犬', planned:'2026-08-01', actual:'', status:'待接种', trace:'' },
    { cat:'大胖', type:'猫三联', planned:'2026-06-15', actual:'2026-06-15', status:'已接种', trace:'VAC-2026-0615-002' },
    { cat:'团子', type:'猫三联', planned:'2026-07-15', actual:'', status:'逾期', trace:'' },
    { cat:'咪咪', type:'猫三联', planned:'2026-08-10', actual:'', status:'待接种', trace:'' }
  ],
  finance: [
    { date:'2026-07-09', type:'income', category:'幼猫销售', desc:'布偶猫小橘预定金', amount:5000, ref:'客户-张女士' },
    { date:'2026-07-08', type:'income', category:'幼猫销售', desc:'英短花卷尾款', amount:8000, ref:'客户-李先生' },
    { date:'2026-07-06', type:'expense', category:'猫粮', desc:'渴望六种鱼 20kg*5', amount:-4200, ref:'供应商' },
    { date:'2026-07-05', type:'expense', category:'医疗', desc:'Mimi产后复查+驱虫', amount:-680, ref:'宠爱动物医院' },
    { date:'2026-07-03', type:'income', category:'幼猫销售', desc:'缅因大胖全款', amount:15000, ref:'客户-王先生' },
    { date:'2026-07-01', type:'expense', category:'猫砂', desc:'爱宠爱猫砂 50袋', amount:-3500, ref:'京东' },
    { date:'2026-06-28', type:'expense', category:'设备', desc:'新猫笼2组', amount:-2800, ref:'淘宝' },
    { date:'2026-06-25', type:'income', category:'配种费', desc:'Leo配种服务费', amount:3000, ref:'合作猫舍' }
  ],
  customers: [
    { id:1, name:'张女士', phone:'138****5621', city:'上海', sourceCat:'大胖', count:1, status:'active' },
    { id:2, name:'李先生', phone:'139****3345', city:'北京', sourceCat:'花卷', count:1, status:'active' },
    { id:3, name:'王先生', phone:'136****7890', city:'广州', sourceCat:'大胖、小白', count:2, status:'active' },
    { id:4, name:'陈小姐', phone:'158****2234', city:'深圳', sourceCat:'-', count:0, status:'potential' },
    { id:5, name:'赵女士', phone:'137****6678', city:'杭州', sourceCat:'小橘（预定）', count:0, status:'reserved' },
    { id:6, name:'刘先生', phone:'155****4456', city:'成都', sourceCat:'咪咪', count:1, status:'aftercare' }
  ],
  contracts: [
    { id:'MK-2026-018', customer:'王先生', cat:'大胖', amount:'¥15,000', date:'2026-07-03', status:'active', aftercare:'跟踪中' },
    { id:'MK-2026-017', customer:'李先生', cat:'花卷', amount:'¥12,000', date:'2026-07-08', status:'active', aftercare:'正常' },
    { id:'MK-2026-016', customer:'张女士', cat:'小橘', amount:'¥18,000', date:'2026-07-09', status:'pending', aftercare:'待确认' },
    { id:'MK-2026-015', customer:'赵女士', cat:'小橘', amount:'¥18,000', date:'2026-07-05', status:'pending', aftercare:'-' },
    { id:'MK-2026-014', customer:'刘先生', cat:'咪咪', amount:'¥22,000', date:'2026-06-20', status:'active', aftercare:'回访中' },
    { id:'MK-2026-013', customer:'周女士', cat:'团子（自留）', amount:'-', date:'-', status:'internal', aftercare:'-' }
  ],
  todos: [
    { text:'小橘、小白 7月25日猫三联接种', priority:'warning' },
    { text:'团子疫苗已逾期，需尽快补种', priority:'danger' },
    { text:'Luna食欲异常，持续观察', priority:'warning' },
    { text:'赵女士预定金待确认', priority:'info' },
    { text:'Max真菌培养结果7月15日出', priority:'info' },
    { text:'2026缅因虎斑系配种准备', priority:'default' }
  ],
  activities: [
    { time:'2小时前', text:'Mimi产后复查完成，恢复良好' },
    { time:'昨天', text:'Leo完成体内外驱虫' },
    { time:'昨天', text:'张女士支付小橘预定金 ¥5,000' },
    { time:'2天前', text:'李先生完成花卷尾款 ¥8,000' },
    { time:'3天前', text:'小橘、小白满月体检通过' },
    { time:'5天前', text:'Bella完成猫三联加强针' }
  ]
};

// ==================== LOGIN / NAV ====================
function doLogin() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appLayout').style.display = 'block';
  initCharts();
  renderAll();
}

function doLogout() {
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

function switchPage(page) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active') });
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active') });
  document.querySelector('.nav-item[data-page="'+page+'"]').classList.add('active');
  var names = { dashboard:'工作台', cats:'种猫管理', breeding:'繁育计划', kittens:'幼猫管理', health:'健康记录', vaccines:'疫苗管理', finance:'财务管理', customers:'客户管理', contracts:'合同管理' };
  document.getElementById('breadcrumbText').textContent = names[page] || page;
  if (page === 'finance') { setTimeout(initFinanceCharts, 100); }
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ==================== RENDER FUNCTIONS ====================
function badgeClass(status) {
  var map = { active:'badge-success', rest:'badge-warning', retired:'badge-default', planned:'badge-info', mating:'badge-primary', pregnant:'badge-warning', lactation:'badge-success', completed:'badge-default', available:'badge-success', reserved:'badge-warning', sold:'badge-default', keeping:'badge-info', normal:'badge-success', '关注':'badge-warning', '待接种':'badge-warning', '已接种':'badge-success', '逾期':'badge-danger', income:'badge-success', expense:'badge-danger', active2:'badge-success', potential:'badge-warning', reserved2:'badge-warning', aftercare:'badge-info', pending:'badge-warning', internal:'badge-default' };
  return map[status] || 'badge-default';
}

function statusText(status) {
  var map = { active:'在繁育', rest:'休繁期', retired:'已退役', planned:'计划中', mating:'交配中', pregnant:'怀孕中', lactation:'哺乳期', completed:'已完成', available:'待售', reserved:'已预定', sold:'已售出', keeping:'自留' };
  return map[status] || status;
}

function renderCats() {
  var q = document.getElementById('catSearch').value.toLowerCase();
  var g = document.getElementById('catGender').value;
  var s = document.getElementById('catStatus').value;
  var filtered = DATA.cats.filter(function(c) {
    if (q && c.name.toLowerCase().indexOf(q) < 0 && c.breed.toLowerCase().indexOf(q) < 0) return false;
    if (g && c.gender !== g) return false;
    if (s && c.status !== s) return false;
    return true;
  });
  document.getElementById('catTable').innerHTML = filtered.map(function(c) {
    return '<tr><td style="font-size:28px;text-align:center">'+c.avatar+'</td><td><strong>'+c.name+'</strong></td><td>'+c.breed+'</td><td>'+c.gender+'</td><td>'+c.age+'</td><td><span class="badge '+badgeClass(c.status)+'">'+statusText(c.status)+'</span></td><td style="font-size:12px;color:var(--muted)">'+c.pedigree+'</td><td><button class="btn btn-sm btn-ghost">详情</button></td></tr>';
  }).join('');
}

function renderBreeding() {
  var q = document.getElementById('breedSearch').value.toLowerCase();
  var s = document.getElementById('breedStatus').value;
  var filtered = DATA.breeding.filter(function(b) {
    if (q && b.name.toLowerCase().indexOf(q) < 0) return false;
    if (s && b.status !== s) return false;
    return true;
  });
  document.getElementById('breedTable').innerHTML = filtered.map(function(b) {
    return '<tr><td><strong>'+b.name+'</strong></td><td>'+b.dam+'</td><td>'+b.sire+'</td><td>'+b.breed+'</td><td>'+b.date+'</td><td><span class="badge '+badgeClass(b.status)+'">'+statusText(b.status)+'</span></td><td><div class="progress-bar" style="width:100px"><div class="progress-fill" style="width:'+b.progress+'%;background:var(--primary)"></div></div><span style="font-size:12px;color:var(--muted);margin-left:6px">'+b.progress+'%</span></td><td><button class="btn btn-sm btn-ghost">详情</button></td></tr>';
  }).join('');
}

function renderKittens() {
  var q = document.getElementById('kittenSearch').value.toLowerCase();
  var s = document.getElementById('kittenStatus').value;
  var filtered = DATA.kittens.filter(function(k) {
    if (q && k.name.toLowerCase().indexOf(q) < 0 && k.breed.toLowerCase().indexOf(q) < 0) return false;
    if (s && k.status !== s) return false;
    return true;
  });
  document.getElementById('kittenTable').innerHTML = filtered.map(function(k) {
    return '<tr><td><strong>'+k.name+'</strong></td><td>'+k.breed+'</td><td>'+k.color+'</td><td>'+k.gender+'</td><td>'+k.birth+'</td><td>'+calcAge(k.birth)+'</td><td><span class="badge '+badgeClass(k.status)+'">'+statusText(k.status)+'</span></td><td><button class="btn btn-sm btn-ghost">详情</button></td></tr>';
  }).join('');
}

function renderHealth() {
  document.getElementById('healthTable').innerHTML = DATA.health.map(function(h) {
    return '<tr><td>'+h.date+'</td><td><strong>'+h.cat+'</strong></td><td><span class="badge '+badgeClass(h.type === '异常' ? 'danger' : h.type === '疫苗' ? 'info' : 'success')+'">'+h.type+'</span></td><td>'+h.desc+'</td><td>'+h.doctor+'</td><td><span class="badge '+badgeClass(h.status)+'">'+h.status+'</span></td></tr>';
  }).join('');
}

function renderVaccines() {
  document.getElementById('vaccineTable').innerHTML = DATA.vaccines.map(function(v) {
    return '<tr><td><strong>'+v.cat+'</strong></td><td>'+v.type+'</td><td>'+v.planned+'</td><td>'+(v.actual||'-')+'</td><td><span class="badge '+badgeClass(v.status)+'">'+v.status+'</span></td><td style="font-size:12px;color:var(--muted)">'+(v.trace||'-')+'</td></tr>';
  }).join('');
}

function renderFinance() {
  document.getElementById('financeTable').innerHTML = DATA.finance.map(function(f) {
    var color = f.type === 'income' ? 'var(--success)' : 'var(--danger)';
    var prefix = f.type === 'income' ? '+' : '';
    return '<tr><td>'+f.date+'</td><td><span class="badge '+badgeClass(f.type)+'">'+(f.type==='income'?'收入':'支出')+'</span></td><td>'+f.category+'</td><td>'+f.desc+'</td><td style="color:'+color+';font-weight:600">'+prefix+'¥'+Math.abs(f.amount).toLocaleString()+'</td><td style="font-size:12px;color:var(--muted)">'+f.ref+'</td></tr>';
  }).join('');
}

function renderCustomers() {
  var q = document.getElementById('custSearch').value.toLowerCase();
  var filtered = DATA.customers.filter(function(c) {
    if (q && c.name.toLowerCase().indexOf(q) < 0 && c.phone.indexOf(q) < 0) return false;
    return true;
  });
  document.getElementById('custTable').innerHTML = filtered.map(function(c) {
    var stMap = { active:'活跃客户', potential:'潜在客户', reserved:'已预定', aftercare:'售后跟进' };
    var stCls = { active:'active2', potential:'potential', reserved:'reserved2', aftercare:'aftercare' };
    return '<tr><td><strong>'+c.name+'</strong></td><td>'+c.phone+'</td><td>'+c.city+'</td><td>'+c.sourceCat+'</td><td>'+c.count+'</td><td><span class="badge '+badgeClass(stCls[c.status]||'default')+'">'+(stMap[c.status]||c.status)+'</span></td><td><button class="btn btn-sm btn-ghost">详情</button></td></tr>';
  }).join('');
}

function renderContracts() {
  document.getElementById('contractTable').innerHTML = DATA.contracts.map(function(c) {
    return '<tr><td style="font-size:12px;color:var(--muted)">'+c.id+'</td><td><strong>'+c.customer+'</strong></td><td>'+c.cat+'</td><td style="font-weight:600">'+c.amount+'</td><td>'+c.date+'</td><td><span class="badge '+badgeClass(c.status)+'">'+(c.status==='active'?'已签署':c.status==='pending'?'待签署':'内部')+'</span></td><td>'+c.aftercare+'</td></tr>';
  }).join('');
}

function renderTodos() {
  var colors = { danger:'var(--danger)', warning:'var(--warning)', info:'var(--info)', default:'var(--muted)' };
  document.getElementById('todoList').innerHTML = DATA.todos.map(function(t) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div style="width:8px;height:8px;border-radius:50%;background:'+(colors[t.priority]||colors.default)+';flex-shrink:0"></div><span style="font-size:13px">'+t.text+'</span></div>';
  }).join('');
}

function renderActivities() {
  document.getElementById('activityList').innerHTML = DATA.activities.map(function(a) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted);white-space:nowrap;min-width:60px">'+a.time+'</span><span style="font-size:13px">'+a.text+'</span></div>';
  }).join('');
}

function calcAge(birthDate) {
  var birth = new Date(birthDate);
  var now = new Date();
  var months = (now.getFullYear()-birth.getFullYear())*12 + (now.getMonth()-birth.getMonth());
  return Math.floor(months/12)+'岁'+(months%12)+'月';
}

function renderAll() {
  renderCats(); renderBreeding(); renderKittens(); renderHealth();
  renderVaccines(); renderFinance(); renderCustomers(); renderContracts();
  renderTodos(); renderActivities();
}

// ==================== CHARTS ====================
function initCharts() { initRevenueChart(); initBreedChart(); }

function initRevenueChart() {
  var el = document.getElementById('chartRevenue');
  if (!el) return;
  var chart = echarts.init(el, null, { renderer:'svg' });
  chart.setOption({
    animation:false,
    grid:{ left:50, right:20, top:20, bottom:30 },
    xAxis:{ type:'category', data:['1月','2月','3月','4月','5月','6月','7月'], axisLine:{lineStyle:{color:'#E8E8E8'}}, axisLabel:{color:'#999'}, axisTick:{show:false} },
    yAxis:{ type:'value', splitLine:{lineStyle:{color:'#F0F0F0'}}, axisLabel:{color:'#999',formatter:function(v){return '¥'+v/1000+'k'}} },
    tooltip:{ trigger:'axis', appendToBody:true },
    series:[{
      type:'bar', data:[52000,48000,71000,65000,92000,77000,86500],
      itemStyle:{ color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#C45C26'},{offset:1,color:'#E8A87C'}]), borderRadius:[4,4,0,0] },
      barWidth:'40%'
    }]
  });
  window.addEventListener('resize', function(){ chart.resize(); });
}

function initBreedChart() {
  var el = document.getElementById('chartBreed');
  if (!el) return;
  var chart = echarts.init(el, null, { renderer:'svg' });
  chart.setOption({
    animation:false,
    tooltip:{ trigger:'item', appendToBody:true, formatter:'{b}: {c}只 ({d}%)' },
    series:[{
      type:'pie', radius:['45%','72%'], center:['50%','50%'],
      label:{ show:true, formatter:'{b}\n{d}%', fontSize:12, color:'#555' },
      labelLine:{ lineStyle:{color:'#CCC'} },
      data:[
        { value:10, name:'布偶猫', itemStyle:{color:'#C45C26'} },
        { value:6, name:'英短', itemStyle:{color:'#2E7D6B'} },
        { value:4, name:'缅因猫', itemStyle:{color:'#1890FF'} },
        { value:2, name:'德文卷毛', itemStyle:{color:'#F4A261'} },
        { value:2, name:'美短', itemStyle:{color:'#9B59B6'} }
      ]
    }]
  });
  window.addEventListener('resize', function(){ chart.resize(); });
}

function initFinanceCharts() { initFinanceTrendChart(); initExpenseChart(); }

function initFinanceTrendChart() {
  var el = document.getElementById('chartFinance');
  if (!el || el.clientWidth === 0) return;
  var chart = echarts.init(el, null, { renderer:'svg' });
  chart.setOption({
    animation:false,
    legend:{ data:['收入','支出'], top:0, textStyle:{color:'#999'} },
    grid:{ left:50, right:20, top:36, bottom:30 },
    xAxis:{ type:'category', data:['1月','2月','3月','4月','5月','6月','7月'], axisLine:{lineStyle:{color:'#E8E8E8'}}, axisLabel:{color:'#999'}, axisTick:{show:false} },
    yAxis:{ type:'value', splitLine:{lineStyle:{color:'#F0F0F0'}}, axisLabel:{color:'#999',formatter:function(v){return '¥'+v/1000+'k'}} },
    tooltip:{ trigger:'axis', appendToBody:true },
    series:[
      { name:'收入', type:'line', data:[52000,48000,71000,65000,92000,77000,86500], smooth:true, lineStyle:{width:2.5,color:'#C45C26'}, itemStyle:{color:'#C45C26'}, areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(196,92,38,0.15)'},{offset:1,color:'rgba(196,92,38,0)'}])} },
      { name:'支出', type:'line', data:[28000,31000,35000,29000,38000,32400,32400], smooth:true, lineStyle:{width:2.5,color:'#2E7D6B'}, itemStyle:{color:'#2E7D6B'}, areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(46,125,107,0.1)'},{offset:1,color:'rgba(46,125,107,0)'}])} }
    ]
  });
  window.addEventListener('resize', function(){ chart.resize(); });
}

function initExpenseChart() {
  var el = document.getElementById('chartExpense');
  if (!el || el.clientWidth === 0) return;
  var chart = echarts.init(el, null, { renderer:'svg' });
  chart.setOption({
    animation:false,
    tooltip:{ trigger:'item', appendToBody:true, formatter:'{b}: ¥{c} ({d}%)' },
    series:[{
      type:'pie', radius:['45%','72%'], center:['50%','50%'],
      roseType:'radius',
      label:{ show:true, formatter:'{b}\n¥{c}', fontSize:11, color:'#555' },
      labelLine:{ lineStyle:{color:'#CCC'} },
      data:[
        { value:15000, name:'猫粮', itemStyle:{color:'#C45C26'} },
        { value:8200, name:'猫砂', itemStyle:{color:'#E8A87C'} },
        { value:6500, name:'医疗', itemStyle:{color:'#2E7D6B'} },
        { value:4800, name:'设备', itemStyle:{color:'#1890FF'} },
        { value:3200, name:'营养品', itemStyle:{color:'#F4A261'} },
        { value:2100, name:'其他', itemStyle:{color:'#9B59B6'} }
      ]
    }]
  });
  window.addEventListener('resize', function(){ chart.resize(); });
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});
