// app.js —— 数据层 + 路由 + 渲染引擎 + 工具方法
/* ===== 存储工具（localStorage 版） ===== */
const Storage = {
  get(key, def){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch(e){ return def; }
  },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} },
  remove(key){ try{ localStorage.removeItem(key); }catch(e){} }
};

/* ===== 数据层：reportStore ===== */
const reportStore = {
  RKEY:'zhangshi_reports', CKEY:'zhangshi_records', VKEY:'zhangshi_reports_v',
  init(){
    // 数据版本检测，版本号变更时刷新数据
    const curVer = 'v2';
    if(localStorage.getItem(this.VKEY) === curVer && localStorage.getItem(this.RKEY) !== null) return;
    const reports = [
      { id:'rpt_20260620_001', deviceInfo:'威胜 WFET-1000 · 站点 A-3',
        symptom:'通信模块故障（F4.E001）：RS485 通信中断，终端无法上报数据',
        process:'电源状态检查 → 接线检查 → 通信模块检测 → 版本核查',
        rootCause:'RS485 通信模块芯片损坏\n\n维修措施：\n1. 更换 RS485 通信模块\n2. 重新配置通信参数\n3. 验证数据上报\n4. 恢复现场运行',
        duration:'诊断耗时 8 分钟 · 维修耗时 25 分钟', status:'已提交', createTime:1718870400000 },
      { id:'rpt_20260619_002', deviceInfo:'林洋 LY-P300 · 站点 B-1',
        symptom:'数据采集异常（F3.B002）：采集数据偏差超阈值',
        process:'接线检查 → 传感器检测 → 采集板测试',
        rootCause:'传感器接线松动导致信号衰减\n\n维修措施：\n1. 重新紧固传感器接线\n2. 校准采集参数',
        duration:'诊断耗时 5 分钟 · 维修耗时 12 分钟', status:'已提交', createTime:1718784000000 },
      { id:'rpt_20260618_003', deviceInfo:'海兴 HX-3000 · 站点 C-2',
        symptom:'电源异常（F1.D001）：终端频繁重启',
        process:'电源状态检查 → 电压测量 → 电源板检测',
        rootCause:'电源板电容老化\n\n维修措施：\n1. 更换电源板电容\n2. 测试启动稳定性',
        duration:'诊断耗时 6 分钟 · 维修耗时 18 分钟', status:'草稿', createTime:1718697600000 },
      { id:'rpt_20260617_004', deviceInfo:'西门子 S7-1200 · 站点 D-4',
        symptom:'通信链路中断（F4.E003）：PROFINET 链路异常',
        process:'网络拓扑检查 → 交换机状态 → 网线测试',
        rootCause:'交换机端口损坏导致链路中断\n\n维修措施：\n1. 更换交换机端口\n2. 重新配置 VLAN',
        duration:'诊断耗时 10 分钟 · 维修耗时 30 分钟', status:'已提交', createTime:1718611200000 },
      { id:'rpt_20260616_005', deviceInfo:'安科瑞 ACR-300 · 站点 E-1',
        symptom:'测量偏差（F3.B005）：电压测量值偏离标准',
        process:'PT 变比核查 → 接线检查 → 校准',
        rootCause:'PT 变比设置错误\n\n维修措施：\n1. 修正 PT 变比参数\n2. 重新校准',
        duration:'诊断耗时 4 分钟 · 维修耗时 8 分钟', status:'已提交', createTime:1718524800000 },
      { id:'rpt_20260615_006', deviceInfo:'科陆 CL-100 · 站点 F-2',
        symptom:'存储异常（F5.C001）：历史数据读写错误',
        process:'存储器检测 → 文件系统修复 → 数据恢复',
        rootCause:'Flash 存储器坏块\n\n维修措施：\n1. 修复坏块\n2. 备份恢复数据',
        duration:'诊断耗时 7 分钟 · 维修耗时 20 分钟', status:'草稿', createTime:1718438400000 },
      { id:'rpt_20260614_007', deviceInfo:'炬华 DT-800 · 站点 G-3',
        symptom:'显示异常（F6.A001）：LCD 黑屏',
        process:'电源检查 → 显示排线 → LCD 模块',
        rootCause:'LCD 排线接触不良\n\n维修措施：\n1. 重新插接排线\n2. 紧固固定螺丝',
        duration:'诊断耗时 3 分钟 · 维修耗时 5 分钟', status:'已提交', createTime:1718352000000 },
      { id:'rpt_20260613_008', deviceInfo:'威胜 DSSD-331 · 站点 H-1',
        symptom:'指示灯异常（F6.A002）：状态灯全灭',
        process:'指示灯电路 → 主板检测 → 固件核查',
        rootCause:'指示灯驱动芯片故障\n\n维修措施：\n1. 更换驱动芯片\n2. 测试指示灯',
        duration:'诊断耗时 9 分钟 · 维修耗时 22 分钟', status:'草稿', createTime:1718265600000 },
      { id:'rpt_20260612_009', deviceInfo:'林洋 DTZ-341 · 站点 I-4',
        symptom:'看门狗复位（F7.H001）：系统周期性复位',
        process:'固件版本 → 内存检测 → 外设排查',
        rootCause:'内存泄漏导致看门狗超时\n\n维修措施：\n1. 升级固件版本\n2. 重启并监控',
        duration:'诊断耗时 12 分钟 · 维修耗时 35 分钟', status:'已提交', createTime:1718179200000 },
      { id:'rpt_20260611_010', deviceInfo:'海兴 DTSD-666 · 站点 J-2',
        symptom:'通信地址冲突（F4.E010）：Modbus 地址重复',
        process:'地址扫描 → 冲突定位 → 重新分配',
        rootCause:'现场设备地址重复配置\n\n维修措施：\n1. 重新分配从站地址\n2. 记录地址表',
        duration:'诊断耗时 5 分钟 · 维修耗时 10 分钟', status:'已提交', createTime:1718092800000 }
    ];
    const records = [
      { id:'r1', date:'6/20 14:30', device:'威胜 WFET-1000 · 站点 A-3', fault:'通信模块故障', status:'已提交', site:'站点 A-3' },
      { id:'r2', date:'6/19 10:15', device:'林洋 LY-P300 · 站点 B-1', fault:'数据采集异常', status:'已提交', site:'站点 B-1' },
      { id:'r3', date:'6/18 16:42', device:'海兴 HX-3000 · 站点 C-2', fault:'电源异常', status:'草稿', site:'站点 C-2' },
      { id:'r4', date:'6/17 09:20', device:'西门子 S7-1200 · 站点 D-4', fault:'通信链路中断', status:'已提交', site:'站点 D-4' },
      { id:'r5', date:'6/16 11:05', device:'安科瑞 ACR-300 · 站点 E-1', fault:'测量偏差', status:'已提交', site:'站点 E-1' },
      { id:'r6', date:'6/15 15:28', device:'科陆 CL-100 · 站点 F-2', fault:'存储异常', status:'草稿', site:'站点 F-2' },
      { id:'r7', date:'6/14 10:12', device:'炬华 DT-800 · 站点 G-3', fault:'显示异常', status:'已提交', site:'站点 G-3' },
      { id:'r8', date:'6/13 14:50', device:'威胜 DSSD-331 · 站点 H-1', fault:'指示灯异常', status:'草稿', site:'站点 H-1' },
      { id:'r9', date:'6/12 09:35', device:'林洋 DTZ-341 · 站点 I-4', fault:'看门狗复位', status:'已提交', site:'站点 I-4' },
      { id:'r10', date:'6/11 13:18', device:'海兴 DTSD-666 · 站点 J-2', fault:'通信地址冲突', status:'已提交', site:'站点 J-2' }
    ];
    Storage.set(this.RKEY, reports);
    Storage.set(this.CKEY, records);
    Storage.set(this.VKEY, curVer);
  },
  getAllReports(){ return Storage.get(this.RKEY, []); },
  getReportById(id){ return this.getAllReports().find(r=>r.id===id); },
  saveReport(report){
    const list = this.getAllReports();
    const idx = list.findIndex(r=>r.id===report.id);
    if(idx>=0) list[idx]=report; else list.unshift(report);
    Storage.set(this.RKEY, list);
  },
  addRecord(rec){ const list = this.getRecords(); list.unshift(rec); Storage.set(this.CKEY, list); },
  getRecords(){ return Storage.get(this.CKEY, []); },
  filterRecords(status){
    const all = this.getRecords();
    if(status==='全部') return all;
    return all.filter(r=>r.status===status);
  },
  newReportId(){ return 'rpt_' + Date.now() + '_' + Math.floor(Math.random()*1000); },
  formatDate(ts){
    const d = new Date(ts);
    const p = n=>n<10?'0'+n:n;
    return d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
  }
};

/* ===== 数据层：knowledgeStore ===== */
const knowledgeStore = {
  downloadedPackages:[
    { name:'威胜 WFET-1000', industry:'电力', size:'2.4MB', version:'v3.2.1', downloaded:true, recentUsed:true },
    { name:'林洋 LY-P300', industry:'电力', size:'1.8MB', version:'v2.5.0', downloaded:true, recentUsed:false },
    { name:'海兴 HX-3000', industry:'水务', size:'3.1MB', version:'v1.8.3', downloaded:true, recentUsed:false },
    { name:'西门子 S7-1200', industry:'工控', size:'4.2MB', version:'v4.0.0', downloaded:true, recentUsed:false },
    { name:'安科瑞 ACR-300', industry:'电力', size:'2.0MB', version:'v2.1.5', downloaded:true, recentUsed:false },
    { name:'科陆 CL-100', industry:'电力', size:'2.7MB', version:'v1.5.2', downloaded:true, recentUsed:false },
    { name:'炬华 DT-800', industry:'电力', size:'1.5MB', version:'v3.0.1', downloaded:true, recentUsed:false },
    { name:'施耐德 PM5000', industry:'工控', size:'3.8MB', version:'v2.2.0', downloaded:true, recentUsed:false },
    { name:'ABB ACH550', industry:'工控', size:'4.5MB', version:'v1.9.0', downloaded:true, recentUsed:false },
    { name:'三菱 FX-5U', industry:'工控', size:'3.3MB', version:'v2.8.4', downloaded:true, recentUsed:false }
  ],
  storePackages:[
    { name:'威胜 WFET-1000', industry:'电力', size:'2.4MB', version:'v3.2.1', downloaded:false },
    { name:'林洋 LY-P300', industry:'电力', size:'1.8MB', version:'v2.5.0', downloaded:false },
    { name:'海兴 HX-3000', industry:'水务', size:'3.1MB', version:'v1.8.3', downloaded:false },
    { name:'西门子 S7-1200', industry:'工控', size:'4.2MB', version:'v4.0.0', downloaded:false }
  ],
  wfetFaultCodes:[
    { code:'F4.E001', description:'RS485 通信中断', category:'通信类' },
    { code:'F4.E002', description:'通信模块无响应', category:'通信类' },
    { code:'F3.B002', description:'采集数据偏差超阈值', category:'采集类' },
    { code:'F1.D001', description:'终端频繁重启', category:'电源类' },
    { code:'F1.D002', description:'电源电压异常', category:'电源类' },
    { code:'F5.C001', description:'存储器读写错误', category:'存储类' },
    { code:'F5.C002', description:'历史数据丢失', category:'存储类' },
    { code:'F6.A001', description:'LCD 显示异常', category:'显示类' },
    { code:'F6.A002', description:'指示灯状态错误', category:'显示类' },
    { code:'F7.H001', description:'看门狗复位', category:'其他' }
  ],
  wfetRepairSteps:[
    '断开终端电源，佩戴防静电手环',
    '打开终端外壳，定位 RS485 通信模块位置',
    '用万用表测量 RS485 A/B 线电压（正常 1.5-5V）',
    '检查通信模块指示灯状态（红灯=故障）',
    '更换 RS485 通信模块，注意方向',
    '重新配置通信参数（波特率、地址）',
    '通电测试，验证数据上报正常',
    '恢复外壳，清理现场'
  ],
  wfetFaq:[
    'Q: RS485 通信中断的常见原因？\nA: 接线松动、终端电阻未接、模块损坏、波特率不匹配、地址冲突。',
    'Q: 如何判断通信模块是否损坏？\nA: 观察指示灯（红灯常亮=损坏）、测量 A/B 电压（无电压=损坏）、替换法测试。',
    'Q: 终端电阻的作用和接法？\nA: 匹配阻抗防信号反射，120Ω 接在总线两端，跨接 A/B 线。'
  ],
  searchDownloaded(kw){
    if(!kw||!kw.trim()) return this.getDownloadedPackages();
    const k = kw.toLowerCase();
    return this.getDownloadedPackages().filter(p=>p.name.toLowerCase().includes(k)||p.industry.toLowerCase().includes(k));
  },
  searchFaultCodes(kw){
    if(!kw||!kw.trim()) return this.wfetFaultCodes;
    const k = kw.toLowerCase();
    return this.wfetFaultCodes.filter(f=>f.code.toLowerCase().includes(k)||f.description.toLowerCase().includes(k));
  },
  filterStoreByCategory(cat){
    if(cat==='全部') return this.storePackages;
    return this.storePackages.filter(p=>p.industry===cat);
  },
  downloadPackage(name){
    const sp = this.storePackages.find(p=>p.name===name);
    if(sp && !this.downloadedPackages.find(p=>p.name===name)){
      sp.downloaded = true;
      this.downloadedPackages.push({...sp, downloaded:true, recentUsed:false});
    }
  },
  getDownloadedPackages(){ return this.downloadedPackages; },
  getStorePackages(){ return this.storePackages; }
};

/* ===== 数据层：teamStore ===== */
const teamStore = {
  members:[
    { id:'u1', name:'张工', role:'一线运维', reportCount:45, accuracy:92, avgDuration:18 },
    { id:'u2', name:'李工', role:'技术支持', reportCount:38, accuracy:88, avgDuration:22 },
    { id:'u3', name:'王工', role:'驻场维护', reportCount:52, accuracy:95, avgDuration:15 },
    { id:'u4', name:'赵工', role:'一线运维', reportCount:30, accuracy:85, avgDuration:25 },
    { id:'u5', name:'陈工', role:'技术支持', reportCount:42, accuracy:90, avgDuration:20 }
  ],
  approvalCases:[
    { id:'c1', title:'WFET-1000 通信链路优化方案', author:'张工', date:'6/25', description:'总结 3 次现场排查经验，提出 RS485 接线标准化方案，降低通信故障率。', status:'待审' },
    { id:'c2', title:'电源板电容老化快速检测法', author:'王工', date:'6/24', description:'利用万用表电容档快速判断电源板电容是否老化，无需拆机测量。', status:'待审' },
    { id:'c3', title:'传感器接线防松加固工艺', author:'李工', date:'6/23', description:'使用螺纹紧固胶加固传感器接线端子，防止振动松动。', status:'待审' }
  ],
  approvedCases:[],
  getPendingApprovals(){ return this.approvalCases.filter(c=>c.status==='待审'); },
  approve(id){ const c=this.approvalCases.find(c=>c.id===id); if(c){c.status='已通过'; this.approvedCases.unshift(c);} },
  reject(id){ const c=this.approvalCases.find(c=>c.id===id); if(c){c.status='已驳回';} },
  totalReports(){ return this.members.reduce((s,m)=>s+m.reportCount,0); },
  avgAccuracy(){ return Math.floor(this.members.reduce((s,m)=>s+m.accuracy,0)/this.members.length); },
  avgDuration(){ return Math.floor(this.members.reduce((s,m)=>s+m.avgDuration,0)/this.members.length); },
  getApprovedCases(){ return this.approvedCases; }
};

/* ===== 数据层：diagnosisEngine ===== */
const diagnosisEngine = {
  recognitionCandidates:[
    { code:'F4.E001', name:'通信模块故障', description:'RS485 通信中断，终端无法上报数据', confidence:98, deviceModel:'威胜 WFET-1000' },
    { code:'F3.B002', name:'数据采集异常', description:'采集数据偏差超阈值', confidence:72, deviceModel:'林洋 LY-P300' },
    { code:'F1.D001', name:'电源异常', description:'终端频繁重启', confidence:45, deviceModel:'海兴 HX-3000' }
  ],
  diagnosisSteps:[
    { stepIndex:0, title:'电源状态检查', question:'终端电源指示灯状态？', options:['A. 电源指示灯正常（绿色常亮）','B. 指示灯异常或熄灭'], targetCheck:'电源异常' },
    { stepIndex:1, title:'接线状态检查', question:'RS485 接线端子状态？', options:['A. 接线紧固无松动','B. 接线有松动或锈蚀'], targetCheck:'接线松动' },
    { stepIndex:2, title:'通信模块检测', question:'通信模块指示灯状态？', options:['A. 绿灯闪烁（正常）','B. 红灯常亮（故障）','C. 指示灯快闪（异常）'], targetCheck:'通信模块故障' },
    { stepIndex:3, title:'数据上报验证', question:'终端能否正常上报数据？', options:['A. 数据正常上报','B. 数据上报异常或中断'], targetCheck:'数据上报异常' },
    { stepIndex:4, title:'模块版本核查', question:'通信模块固件版本？', options:['A. 版本正常（v3.0+）','B. 版本过旧需升级'], targetCheck:'版本过旧' }
  ],
  currentSession:null,
  startSession(candidate){
    this.currentSession = {
      sessionId:'sess_'+Date.now(), deviceModel:candidate.deviceModel, deviceSite:'站点 A-3',
      faultCode:candidate.code, faultName:candidate.name, startTime:Date.now(), endTime:null,
      currentStep:0, answeredSteps:[], excludedCauses:[], conclusion:null, supplement:null
    };
  },
  getSession(){ return this.currentSession; },
  getCurrentStep(){ return this.diagnosisSteps[this.currentSession.currentStep]; },
  getTotalSteps(){ return this.diagnosisSteps.length; },
  isComplete(){ return this.currentSession.currentStep >= this.diagnosisSteps.length; },
  submitAnswer(answer, skipped){
    const step = this.diagnosisSteps[this.currentSession.currentStep];
    this.currentSession.answeredSteps.push({ stepIndex:step.stepIndex, question:step.question, answer:skipped?'跳过':answer });
    if(!skipped){
      if(this.currentSession.currentStep===0 && answer.startsWith('A')) this.currentSession.excludedCauses.push('电源异常');
      if(this.currentSession.currentStep===1 && answer.startsWith('A')) this.currentSession.excludedCauses.push('接线松动');
      if(this.currentSession.currentStep===2 && answer.includes('快闪')){ this.currentSession.currentStep = this.diagnosisSteps.length; return; }
    }
    this.currentSession.currentStep++;
  },
  generateConclusion(){
    const s = this.currentSession;
    if(!s) return this.defaultConclusion();
    const hasFastFlash = s.answeredSteps.some(a=>a.answer.includes('快闪'));
    const highConf = hasFastFlash || s.excludedCauses.length>=2;
    if(highConf){
      return { rootCause:'RS485 通信模块芯片损坏，导致通信链路中断', confidenceLevel:'高置信度',
        repairSteps:['断开终端电源，佩戴防静电手环','打开终端外壳，定位 RS485 通信模块','用万用表测量 A/B 线电压（正常 1.5-5V）','更换 RS485 通信模块，重新配置参数','通电测试，验证数据上报正常'],
        tools:['防静电手环','万用表','螺丝刀套装','备用 RS485 通信模块'],
        safetyNotes:'更换前务必断开电源；注意防静电；模块方向不可接反',
        excludedCauses:s.excludedCauses };
    }
    return { rootCause:'疑似通信模块故障，需进一步检测确认', confidenceLevel:'中置信度',
      repairSteps:['断开终端电源','检查接线端子是否紧固','用万用表测量 A/B 线电压','若电压异常，更换通信模块'],
      tools:['万用表','螺丝刀套装'],
      safetyNotes:'操作前断开电源',
      excludedCauses:s.excludedCauses };
  },
  defaultConclusion(){
    return { rootCause:'暂无诊断会话', confidenceLevel:'中置信度', repairSteps:[], tools:[], safetyNotes:'', excludedCauses:[] };
  },
  generateProcessText(){
    const s = this.currentSession; if(!s) return '';
    return s.answeredSteps.map(a=>a.question+' → '+a.answer).join(' → ');
  },
  getDuration(){
    const s = this.currentSession; if(!s||!s.endTime) return '诊断耗时 '+Math.floor((Date.now()-(s? s.startTime:Date.now()))/60000)+' 分钟';
    return '诊断耗时 '+Math.floor((s.endTime-s.startTime)/60000)+' 分钟';
  },
  clearSession(){ this.currentSession = null; }
};

/* ===== Toast / Modal 工具 ===== */
const UI = {
  toast(msg, icon, dur){
    icon = icon||'none'; dur = dur||1500;
    const host = document.getElementById('toastHost');
    const el = document.createElement('div');
    el.className = 'toast-mask';
    el.innerHTML = '<div class="toast-box">'+(icon==='success'?'✓ ':'')+msg+'</div>';
    host.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, dur);
  },
  showModal(opt){
    return new Promise(resolve=>{
      const host = document.getElementById('modalHost');
      const el = document.createElement('div');
      el.className='modal-mask';
      let inputHtml = opt.editable ? '<input class="modal-input" id="modalInput" value="'+(opt.content||'')+'" />' : '';
      el.innerHTML = '<div class="modal-box">'+
        '<div class="modal-title">'+(opt.title||'提示')+'</div>'+
        (opt.editable?'':'<div class="modal-content">'+(opt.content||'')+'</div>')+
        inputHtml+
        '<div class="modal-footer"><div class="mb-btn mb-cancel">'+(opt.cancelText||'取消')+'</div><div class="mb-btn mb-confirm">'+(opt.confirmText||'确定')+'</div></div>'+
        '</div>';
      host.appendChild(el);
      const done = (v)=>{ el.remove(); resolve(v); };
      el.querySelector('.mb-cancel').onclick = ()=>done(opt.editable?'':false);
      el.querySelector('.mb-confirm').onclick = ()=>{
        if(opt.editable){ const v=document.getElementById('modalInput').value; done(v); }
        else done(true);
      };
    });
  },
  vibrateShort(){ if(navigator.vibrate) navigator.vibrate(15); }
};

/* ===== 路由 + 渲染引擎 ===== */
const App = {
  stack:[],         // 页面栈（navigateTo 压入）
  currentRoute:null,
  tabBarList:[
    { pagePath:'home', text:'首页', icon:'🏠' },
    { pagePath:'knowledge', text:'知识库', icon:'📚' },
    { pagePath:'records', text:'诊断记录', icon:'📋' },
    { pagePath:'tools', text:'工具', icon:'🔧' },
    { pagePath:'mine', text:'我的', icon:'👤' }
  ],
  pages:{},         // pagePath -> {render, onShow, onLoad, onUnload, data, instance}
  pageInstances:{}, // 当前活跃实例
  registered:[],

  init(){
    reportStore.init();
    // 注册所有页面
    ['home','knowledge','records','tools','mine'].forEach(p=>this.register(p, PagesTabs[p]));
    ['photo','recognition','diagnosis','conclusion','reportPreview','myReports'].forEach(p=>this.register(p, PagesDiag[p]));
    ['packageDetail','knowledgeStore','dashboard','team','guide'].forEach(p=>this.register(p, PagesKnow[p]));
    ['protocolParser','commReference','dipCalculator','photoAnnotate','voiceMemo','unitConverter','crcCalculator','maintenanceReminder'].forEach(p=>this.register(p, PagesTools[p]));
    this.renderTabBar();
    this.switchTab('home');
    // 状态栏时钟
    setInterval(()=>{ const d=new Date(); document.getElementById('sbTime').textContent = d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes(); },1000);
    // 导航栏返回
    document.getElementById('navBack').onclick = ()=>this.navigateBack();
  },

  register(name, def){
    this.pages[name] = def;
  },

  renderTabBar(){
    const bar = document.getElementById('tabBar');
    bar.innerHTML = this.tabBarList.map(t=>
      '<div class="tab-item" data-path="'+t.pagePath+'"><span class="ti-icon">'+t.icon+'</span><span>'+t.text+'</span></div>'
    ).join('');
    bar.querySelectorAll('.tab-item').forEach(el=>{
      el.onclick = ()=>this.switchTab(el.dataset.path);
    });
  },

  highlightTab(path){
    document.querySelectorAll('.tab-item').forEach(el=>{
      el.classList.toggle('active', el.dataset.path===path);
    });
  },

  setNavBar(title, showBack){
    document.getElementById('navTitle').textContent = title;
    document.getElementById('navBack').style.display = showBack?'flex':'none';
  },

  // switchTab：切到 5 个 Tab 页之一（清空页面栈）
  switchTab(path){
    this.stack = [];
    this._renderPage(path, {}, true);
    this.highlightTab(path);
    document.getElementById('tabBar').style.display = 'flex';
  },

  // navigateTo：压入新页面（保留返回栈）
  navigateTo(path, params){
    params = params||{};
    this.stack.push(this.currentRoute);
    this._renderPage(path, params, false);
    document.getElementById('tabBar').style.display = 'flex';
  },

  // navigateBack：返回上一页
  navigateBack(){
    if(this.stack.length===0){ return; }
    const prev = this.stack.pop();
    this._renderPage(prev.page, prev.params, this.stack.length===0 && this.tabBarList.find(t=>t.pagePath===prev.page));
    if(this.stack.length===0) this.highlightTab(prev.page);
  },

  // redirectTo：替换当前页
  redirectTo(path, params){
    this._renderPage(path, params||{}, false);
  },

  _renderPage(page, params, isTab){
    // 卸载当前实例
    if(this.currentRoute && this.pageInstances[this.currentRoute.page]){
      const inst = this.pageInstances[this.currentRoute.page];
      if(inst.onUnload) inst.onUnload();
    }
    this.currentRoute = { page, params };
    const def = this.pages[page];
    if(!def){ console.error('页面未注册:', page); return; }

    const view = document.getElementById('pageView');
    view.scrollTop = 0;

    // 创建实例
    const inst = {
      data: JSON.parse(JSON.stringify(def.data||{})),
      params: params
    };
    // 绑定方法
    Object.keys(def).forEach(k=>{
      if(typeof def[k]==='function') inst[k] = def[k].bind(inst);
    });
    inst.setData = (obj)=>{
      Object.assign(inst.data, obj);
      if(inst._mounted){ this._updateView(page, inst); }
    };
    inst.navigateTo = (p,pr)=>this.navigateTo(p,pr);
    inst.switchTab = (p)=>this.switchTab(p);
    inst.navigateBack = ()=>this.navigateBack();
    inst.redirectTo = (p,pr)=>this.redirectTo(p,pr);

    this.pageInstances[page] = inst;
    this._updateView(page, inst);
    inst._mounted = true;
    if(inst.onLoad) inst.onLoad(params);
    if(inst.onShow) inst.onShow();
  },

  _updateView(page, inst){
    const def = this.pages[page];
    const view = document.getElementById('pageView');
    // 调用 render 生成 HTML
    const html = def.render(inst.data, inst);
    view.innerHTML = html;
    // 绑定事件
    if(def.bindEvents) def.bindEvents(view, inst);
    // 设置导航栏
    const navTitle = def.navTitle || '';
    const isTabPage = !!this.tabBarList.find(t=>t.pagePath===page);
    const showBack = !isTabPage;
    if(typeof navTitle==='function') this.setNavBar(navTitle(inst.data), showBack);
    else this.setNavBar(navTitle, showBack);
    // TabBar 显隐：5 个 Tab 页及子页面均显示
    document.getElementById('tabBar').style.display = 'flex';
  }
};

// 页面基类辅助：链式调用简化
function PageDef(data, methods, render, bindEvents, navTitle){
  return Object.assign({}, data, methods, { data, render, bindEvents, navTitle });
}
