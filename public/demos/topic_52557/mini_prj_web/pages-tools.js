// pages-tools.js —— 8 个工具页面（T1-T8）
(function(){
  const style = document.createElement('style');
  style.textContent = `
  /* 通用工具页样式 */
  .section{margin-bottom:16px}
  .section-title{font-size:14px;font-weight:600;color:var(--muted);padding:0 4px;margin-bottom:10px}
  .info-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;font-size:12px;color:var(--muted);line-height:1.7}
  .result-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;overflow:hidden}
  .result-row{display:flex;padding:10px 12px;border-bottom:1px solid var(--rule);font-size:13px}
  .result-row:last-child{border-bottom:none}
  .result-label{color:var(--muted);min-width:90px;flex-shrink:0}
  .result-value{color:var(--ink);flex:1;word-break:break-all}
  .result-value.highlight{color:var(--blue);font-weight:600}
  .input-box{width:100%;background:var(--bg);border:1px solid var(--rule);border-radius:8px;padding:10px 12px;color:var(--ink);font-size:13px;outline:none;font-family:monospace}
  .input-box:focus{border-color:var(--blue)}
  .input-box::placeholder{color:var(--weak)}
  textarea.input-box{min-height:80px;resize:vertical;font-family:monospace}
  .err-card{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-left:3px solid var(--red);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--red);margin-bottom:12px}
  .btn-row{display:flex;gap:8px;margin-top:8px}
  .btn-row .btn{flex:1}
  .tag-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .tag-pill{padding:7px 14px;border-radius:16px;font-size:12px;color:var(--muted);background:var(--bg3);border:1px solid var(--rule);cursor:pointer;white-space:nowrap}
  .tag-pill.active{background:var(--blue);color:#fff;border-color:var(--blue)}
  .mono{font-family:'Courier New',monospace}
  /* T1 协议 */
  .proto-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  /* T3 拨码 */
  .dip-row{display:flex;justify-content:space-between;background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px 8px;margin-bottom:12px}
  .dip-unit{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
  .dip-slot{width:22px;height:36px;background:var(--bg);border:1px solid var(--rule);border-radius:3px;position:relative}
  .dip-handle{position:absolute;left:2px;width:16px;height:14px;border-radius:2px;transition:top .15s}
  .dip-handle.on{top:2px;background:var(--blue)}
  .dip-handle.off{top:18px;background:var(--muted)}
  .dip-num{font-size:10px;color:var(--weak)}
  .dip-val{font-size:11px;color:var(--blue);font-weight:600}
  /* T4 标注 */
  .canvas-wrap{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin-bottom:12px;position:relative}
  #annotateCanvas{display:block;width:100%;height:250px;touch-action:none}
  .canvas-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--weak);font-size:13px;pointer-events:none}
  .tool-pills{display:flex;gap:6px;margin-bottom:10px}
  .tp{padding:6px 14px;border-radius:14px;font-size:12px;color:var(--muted);background:var(--bg3);border:1px solid var(--rule);cursor:pointer}
  .tp.active{background:var(--purple);color:#fff;border-color:var(--purple)}
  .color-row{display:flex;gap:8px;margin-bottom:10px}
  .ci{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer}
  .ci.active{border-color:#fff}
  /* T5 语音 */
  .rec-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:16px;text-align:center;margin-bottom:12px}
  .rec-pulse{width:12px;height:12px;border-radius:50%;background:var(--muted);margin:0 auto 8px}
  .rec-pulse.on{background:var(--warn);animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .rec-time{font-size:32px;font-weight:700;color:var(--ink);font-family:monospace;margin:6px 0}
  .rec-btns{display:flex;gap:10px;justify-content:center;margin-top:12px}
  .rec-btn{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;font-size:18px}
  .rec-btn.start{background:var(--blue);color:#fff}
  .rec-btn.stop{background:var(--red);color:#fff}
  .rec-input{width:100%;background:var(--bg);border:1px solid var(--rule);border-radius:6px;padding:8px;color:var(--ink);font-size:12px;margin-top:10px;outline:none}
  .memo-item{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:10px;margin-bottom:8px}
  .memo-h{display:flex;justify-content:space-between;margin-bottom:4px}
  .memo-dev{font-size:13px;font-weight:600;color:var(--ink)}
  .memo-time{font-size:11px;color:var(--weak)}
  .memo-text{font-size:12px;color:var(--muted);margin:4px 0}
  .memo-acts{display:flex;gap:12px}
  .memo-act{font-size:12px;color:var(--blue);cursor:pointer}
  .memo-act.del{color:var(--red)}
  /* T6 单位 */
  .unit-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
  .ug-label{font-size:11px;color:var(--muted);margin-bottom:4px}
  /* T7 CRC */
  .frame-box{background:var(--bg);border:1px solid var(--rule);border-radius:6px;padding:10px;font-family:monospace;font-size:12px;color:var(--green);word-break:break-all;line-height:1.6}
  /* T8 维保 */
  .form-card{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:14px}
  .fc-item{margin-bottom:10px}
  .fc-label{font-size:12px;color:var(--muted);margin-bottom:5px}
  .fc-input{width:100%;background:var(--bg);border:1px solid var(--rule);border-radius:6px;padding:8px 10px;color:var(--ink);font-size:13px;outline:none}
  .fc-input:focus{border-color:var(--blue)}
  .maint-item{background:var(--bg3);border:1px solid var(--rule);border-radius:8px;padding:12px;margin-bottom:10px}
  .maint-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .maint-dev{font-size:14px;font-weight:600;color:var(--ink)}
  .maint-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px}
  .badge-normal{background:rgba(34,197,94,.15);color:var(--green)}
  .badge-soon{background:rgba(245,158,11,.15);color:var(--warn)}
  .badge-overdue{background:rgba(239,68,68,.15);color:var(--red)}
  .maint-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px}
  .maint-k{color:var(--muted)}
  .maint-v{color:var(--ink)}
  .maint-days.danger{color:var(--red)}
  .maint-days.warn{color:var(--warn)}
  .maint-days.success{color:var(--green)}
  .maint-del{font-size:12px;color:var(--red);cursor:pointer;margin-top:6px;display:inline-block}
  `;
  document.head.appendChild(style);
})();

const PagesTools = {};

/* ===== T1 报文解析器 ===== */
PagesTools.protocolParser = {
  data:{
    currentProtocol:'modbus',
    protocols:[
      {code:'modbus',name:'Modbus RTU'},
      {code:'645',name:'DL/T 645-2007'},
      {code:'3761',name:'DL/T 376.1'},
      {code:'ascii',name:'Modbus ASCII'}
    ],
    hexInput:'', parseResult:null, errorMsg:'',
    protocolDesc:'Modbus RTU 协议：采用主从方式，报文格式为 [地址码][功能码][数据区][CRC校验]。常用于工业设备通信。'
  },
  navTitle:'报文解析器 T1',
  sampleMap:{
    modbus:'01 03 00 00 00 0A C4 0D',
    '645':'68 00 00 00 00 00 68 11 04 33 33 33 33 AE 16',
    '3761':'68 30 00 00 00 00 68 4B 33 33 33 33 34 33 33 33 33 33 00 00 00 00 D4 16',
    ascii:'3A 30 31 30 33 30 30 30 30 30 30 30 41 43 52 0D 0A'
  },
  descMap:{
    modbus:'Modbus RTU 协议：采用主从方式，报文格式为 [地址码][功能码][数据区][CRC校验]。常用于工业设备通信。',
    '645':'DL/T 645-2007：多功能电能表通信协议。报文格式为 [68H][地址域][68H][控制码][数据长度][数据域][校验码][16H]。地址域为 BCD 反序。',
    '3761':'DL/T 376.1：电力负荷管理数据传输协议。报文格式为 [68H][长度L][长度L][68H][控制域][地址域][链路用户数据][校验和][16H]。常用于集中器与主站通信。',
    ascii:'Modbus ASCII：以冒号(:)开始，CRLF 结束，中间数据为 16 进制 ASCII 字符，LRC 校验。可读性较好。'
  },
  onProtocolChange(code){
    this.setData({currentProtocol:code, protocolDesc:this.descMap[code], parseResult:null, errorMsg:''});
  },
  onHexInput(e){ this.setData({hexInput:e.target.value}); },
  onClear(){ this.setData({hexInput:'',parseResult:null,errorMsg:''}); },
  onSample(){
    const s = this.sampleMap[this.data.currentProtocol]||'';
    this.setData({hexInput:s, parseResult:null, errorMsg:''});
  },
  onParse(){
    const {hexInput, currentProtocol} = this.data;
    if(!hexInput || !hexInput.trim()){ this.setData({errorMsg:'请输入报文'}); return; }
    const bytes = this.hexToBytes(hexInput);
    if(!bytes){ this.setData({errorMsg:'报文格式错误，请输入16进制（空格分隔）'}); return; }
    let result = null;
    try{
      switch(currentProtocol){
        case 'modbus': result = this.parseModbus(bytes); break;
        case '645': result = this.parse645(bytes); break;
        case '3761': result = this.parse3761(bytes); break;
        case 'ascii': result = this.parseAscii(bytes); break;
      }
      this.setData({parseResult:result, errorMsg:''});
    }catch(err){ this.setData({errorMsg:'解析失败：'+err.message}); }
  },
  hexToBytes(hex){
    const c = hex.replace(/[^0-9a-fA-F]/g,'');
    if(c.length%2!==0) return null;
    const b = [];
    for(let i=0;i<c.length;i+=2) b.push(parseInt(c.substr(i,2),16));
    return b;
  },
  bytesToHex(bytes){ return bytes.map(b=>(b<16?'0':'')+b.toString(16).toUpperCase()).join(' '); },
  calcCRC16(bytes){
    let crc = 0xFFFF;
    for(let i=0;i<bytes.length;i++){
      crc ^= bytes[i];
      for(let j=0;j<8;j++) crc = (crc&1)?(crc>>1)^0xA001:crc>>1;
    }
    return crc;
  },
  parseModbus(bytes){
    if(bytes.length<4) throw new Error('报文长度不足');
    const addr=bytes[0], func=bytes[1];
    const crcCalc = this.calcCRC16(bytes.slice(0, bytes.length-2));
    const crcLow=bytes[bytes.length-2], crcHigh=bytes[bytes.length-1];
    const crcRecv = crcLow | (crcHigh<<8);
    const data = bytes.slice(2, bytes.length-2);
    const fm = {1:'读线圈',2:'读离散输入',3:'读保持寄存器',4:'读输入寄存器',5:'写单个线圈',6:'写单个寄存器',16:'写多个寄存器'};
    return [
      {label:'从站地址', value:addr+' (0x'+addr.toString(16).toUpperCase().padStart(2,'0')+')'},
      {label:'功能码', value:func+' ('+(fm[func]||'未知')+')'},
      {label:'数据区', value:this.bytesToHex(data), highlight:true},
      {label:'CRC校验', value:this.bytesToHex([crcLow,crcHigh])+(crcRecv===crcCalc?' ✓ 正确':' ✗ 错误'), highlight: crcRecv!==crcCalc}
    ];
  },
  parse645(bytes){
    if(bytes.length<12) throw new Error('报文长度不足');
    if(bytes[0]!==0x68 || bytes[6]!==0x68) throw new Error('起始/结束符 68H 错误');
    if(bytes[bytes.length-1]!==0x16) throw new Error('结束符 16H 错误');
    const addr = bytes.slice(1,6).reverse();
    const addrStr = addr.map(b=>((b&0x33).toString(16).padStart(2,'0')).toUpperCase()).join('');
    const ctrl=bytes[7], dataLen=bytes[8];
    const data = bytes.slice(9, 9+dataLen);
    const cs = bytes[9+dataLen];
    let csCalc=0;
    for(let i=0;i<9+dataLen;i++) csCalc += bytes[i];
    csCalc = csCalc & 0xFF;
    const dir = (ctrl&0x80)?'从站→主站':'主站→从站';
    const err = (ctrl&0x40)?'异常应答':'正常';
    return [
      {label:'地址域', value:addrStr, highlight:true},
      {label:'控制码', value:'0x'+ctrl.toString(16).toUpperCase().padStart(2,'0')+' ('+dir+','+err+')'},
      {label:'数据长度', value:dataLen+' 字节'},
      {label:'数据域', value:this.bytesToHex(data), highlight:true},
      {label:'CS校验', value:'0x'+cs.toString(16).toUpperCase().padStart(2,'0')+(cs===csCalc?' ✓ 正确':' ✗ 错误'), highlight: cs!==csCalc}
    ];
  },
  parse3761(bytes){
    if(bytes.length<12) throw new Error('报文长度不足');
    if(bytes[0]!==0x68 || bytes[5]!==0x68) throw new Error('起始符 68H 错误');
    if(bytes[bytes.length-1]!==0x16) throw new Error('结束符 16H 错误');
    const len=bytes[1], ctrl=bytes[6];
    const addr = bytes.slice(7,13).reverse();
    const addrStr = addr.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join('');
    const dataLen = len-12;
    const data = bytes.slice(13, 13+dataLen);
    const cs = bytes[bytes.length-2];
    let csCalc=0;
    for(let i=6;i<bytes.length-2;i++) csCalc += bytes[i];
    csCalc = csCalc & 0xFF;
    const funcCode = ctrl & 0x0F;
    return [
      {label:'长度L', value:len+' 字节'},
      {label:'控制域', value:'0x'+ctrl.toString(16).toUpperCase().padStart(2,'0')+' (功能码:'+funcCode+')'},
      {label:'地址域', value:addrStr, highlight:true},
      {label:'链路用户数据', value:this.bytesToHex(data), highlight:true},
      {label:'CS校验', value:'0x'+cs.toString(16).toUpperCase().padStart(2,'0')+(cs===csCalc?' ✓ 正确':' ✗ 错误'), highlight: cs!==csCalc}
    ];
  },
  parseAscii(bytes){
    if(bytes[0]!==0x3A) throw new Error('起始符 : 错误');
    const hexStr = bytes.slice(1, bytes.length-2).map(b=>String.fromCharCode(b)).join('');
    const db = [];
    for(let i=0;i<hexStr.length;i+=2) db.push(parseInt(hexStr.substr(i,2),16));
    if(db.length<3) throw new Error('数据不足');
    const addr=db[0], func=db[1];
    const lrc = db[db.length-1];
    const payload = db.slice(0, db.length-1);
    let lrcCalc=0;
    for(let i=0;i<payload.length;i++) lrcCalc += payload[i];
    lrcCalc = (~lrcCalc + 1) & 0xFF;
    return [
      {label:'从站地址', value:addr+' (0x'+addr.toString(16).toUpperCase().padStart(2,'0')+')'},
      {label:'功能码', value:func+''},
      {label:'数据区', value:this.bytesToHex(db.slice(2, db.length-1)), highlight:true},
      {label:'LRC校验', value:'0x'+lrc.toString(16).toUpperCase().padStart(2,'0')+(lrc===lrcCalc?' ✓ 正确':' ✗ 错误'), highlight: lrc!==lrcCalc}
    ];
  },
  render(d){
    return `<div>
      <div class="section">
        <div class="section-title">选择协议</div>
        <div class="proto-tabs">${d.protocols.map(p=>`<span class="tag-pill ${d.currentProtocol===p.code?'active':''}" data-code="${p.code}">${p.name}</span>`).join('')}</div>
      </div>
      <div class="section">
        <div class="section-title">输入报文（16进制，空格分隔）</div>
        <textarea class="input-box" placeholder="例如：68 00 00 00 00 00 68 01 02 03 04 05 06 07 08 09 16" data-act="hex">${d.hexInput}</textarea>
        <div class="btn-row">
          <button class="btn btn-secondary" data-act="clear">清空</button>
          <button class="btn btn-secondary" data-act="sample">示例</button>
          <button class="btn btn-primary" data-act="parse">解析</button>
        </div>
      </div>
      ${d.errorMsg?`<div class="err-card">${d.errorMsg}</div>`:''}
      ${d.parseResult?`<div class="section"><div class="section-title">解析结果</div><div class="result-card">
        ${d.parseResult.map(r=>`<div class="result-row"><div class="result-label">${r.label}</div><div class="result-value ${r.highlight?'highlight':''}">${r.value}</div></div>`).join('')}
      </div></div>`:''}
      <div class="section"><div class="section-title">协议说明</div><div class="info-card">${d.protocolDesc}</div></div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-code]').forEach(el=>{ el.onclick=()=>inst.onProtocolChange(el.dataset.code); });
    const ta = view.querySelector('[data-act="hex"]'); if(ta) ta.addEventListener('input', e=>inst.onHexInput(e));
    view.querySelectorAll('.btn-row [data-act]').forEach(el=>{
      el.onclick = ()=>{
        const a = el.dataset.act;
        if(a==='clear') inst.onClear();
        else if(a==='sample') inst.onSample();
        else if(a==='parse') inst.onParse();
      };
    });
  }
};

/* ===== T2 通信参数速查 ===== */
PagesTools.commReference = {
  data:{
    activeTab:'rs485', searchKeyword:'',
    tabs:[{code:'rs485',name:'RS485'},{code:'rs232',name:'RS232'},{code:'ttl',name:'TTL'},{code:'baud',name:'波特率距离表'}],
    rs485Pins:[{label:'A+',desc:'差分正信号',visible:true},{label:'B-',desc:'差分负信号',visible:true},{label:'GND',desc:'信号地',visible:true},{label:'屏蔽层',desc:'接地屏蔽',visible:true}],
    rs485Notes:'RS485 采用差分信号传输，抗干扰能力强，最远距离 1200m，支持多节点（32 个）。终端电阻 120Ω 接在总线两端。',
    rs232Pins:[
      {label:'DCD',desc:'载波检测',visible:true},{label:'RXD',desc:'接收数据',visible:true},
      {label:'TXD',desc:'发送数据',visible:true},{label:'DTR',desc:'数据终端就绪',visible:true},
      {label:'GND',desc:'信号地',visible:true},{label:'DSR',desc:'数据设备就绪',visible:true},
      {label:'RTS',desc:'请求发送',visible:true},{label:'CTS',desc:'清除发送',visible:true},
      {label:'RI',desc:'振铃指示',visible:true}
    ],
    rs232Notes:'RS232 为单端信号，传输距离短（15m），点对点通信。DB9 接口常见于工业设备调试口。',
    ttlPins:[{label:'VCC',desc:'电源正（3.3V/5V）',visible:true},{label:'GND',desc:'地',visible:true},{label:'TXD',desc:'发送数据',visible:true},{label:'RXD',desc:'接收数据',visible:true}],
    ttlLevels:'TTL 电平：0V = 逻辑 0；3.3V/5V = 逻辑 1。常用于芯片间短距离通信（<30cm）。',
    ttlNotes:'TTL 通信抗干扰能力弱，不适合长距离。连接时需共地，且 TX/RX 交叉连接。',
    baudRates:[
      {rate:'1200',distance:'1200m',visible:true},{rate:'2400',distance:'1000m',visible:true},
      {rate:'4800',distance:'800m',visible:true},{rate:'9600',distance:'600m',visible:true},
      {rate:'19200',distance:'400m',visible:true},{rate:'38400',distance:'200m',visible:true},
      {rate:'115200',distance:'100m',visible:true}
    ],
    checklist:[
      {label:'接线端子紧固',desc:'检查 A/B 线端子是否松动、锈蚀',visible:true},
      {label:'终端电阻',desc:'总线两端是否接入 120Ω 终端电阻',visible:true},
      {label:'屏蔽接地',desc:'屏蔽层单端接地，防止地环路',visible:true},
      {label:'波特率匹配',desc:'主从设备波特率、校验位一致',visible:true},
      {label:'地址唯一',desc:'总线上各设备地址不冲突',visible:true}
    ]
  },
  navTitle:'通信参数速查 T2',
  onTabChange(code){ this.setData({activeTab:code}); this.applyFilter(); },
  onSearchInput(e){ this.setData({searchKeyword:e.target.value}); this.applyFilter(); },
  applyFilter(){
    const kw = (this.data.searchKeyword||'').trim().toLowerCase();
    const upd = {};
    ['rs485Pins','rs232Pins','ttlPins','baudRates','checklist'].forEach(key=>{
      upd[key] = this.data[key].map(it=>{
        const txt = (it.label+' '+(it.desc||'')+' '+(it.rate||'')+' '+(it.distance||'')).toLowerCase();
        return {...it, visible: !kw || txt.includes(kw)};
      });
    });
    this.setData(upd);
  },
  render(d){
    let body='';
    if(d.activeTab==='rs485'){
      body = d.rs485Pins.filter(p=>p.visible).map(p=>`<div class="result-row"><div class="result-label">${p.label}</div><div class="result-value">${p.desc}</div></div>`).join('')
        + `<div class="info-card" style="margin-top:8px">${d.rs485Notes}</div>`;
    } else if(d.activeTab==='rs232'){
      body = `<div class="result-card">${d.rs232Pins.filter(p=>p.visible).map(p=>`<div class="result-row"><div class="result-label">${p.label}</div><div class="result-value">${p.desc}</div></div>`).join('')}</div>
        <div class="info-card" style="margin-top:8px">${d.rs232Notes}</div>`;
    } else if(d.activeTab==='ttl'){
      body = `<div class="result-card">${d.ttlPins.filter(p=>p.visible).map(p=>`<div class="result-row"><div class="result-label">${p.label}</div><div class="result-value">${p.desc}</div></div>`).join('')}</div>
        <div class="info-card" style="margin-top:8px">${d.ttlLevels}</div>
        <div class="info-card" style="margin-top:8px">${d.ttlNotes}</div>`;
    } else {
      body = `<div class="result-card">${d.baudRates.filter(p=>p.visible).map(p=>`<div class="result-row"><div class="result-label">${p.rate} bps</div><div class="result-value">最远 ${p.distance}</div></div>`).join('')}</div>`;
    }
    return `<div>
      <div class="tag-row">${d.tabs.map(t=>`<span class="tag-pill ${d.activeTab===t.code?'active':''}" data-code="${t.code}">${t.name}</span>`).join('')}</div>
      <div class="search-box" style="margin-bottom:12px"><span class="si">🔍</span><input placeholder="搜索引脚、参数、距离..." data-act="search" value="${d.searchKeyword}" /></div>
      <div class="section">${body}</div>
      <div class="section"><div class="section-title">接线检查清单</div>
        ${d.checklist.filter(c=>c.visible).map(c=>`<div class="result-card" style="margin-bottom:6px"><div class="result-row"><div class="result-label">✓ ${c.label}</div><div class="result-value">${c.desc}</div></div></div>`).join('')}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-code]').forEach(el=>{ el.onclick=()=>inst.onTabChange(el.dataset.code); });
    const s = view.querySelector('[data-act="search"]'); if(s) s.addEventListener('input', e=>inst.onSearchInput(e));
  }
};

/* ===== T3 拨码开关计算器 ===== */
PagesTools.dipCalculator = {
  data:{
    switches:[false,false,false,false,false,false,false,false],
    bitValues:[128,64,32,16,8,4,2,1],
    decimalValue:0, hexValue:'0x00', binValue:'00000000',
    reverseInput:'', errorMsg:''
  },
  navTitle:'拨码开关计算器 T3',
  onToggleSwitch(i){
    const sw = this.data.switches.slice();
    sw[i] = !sw[i];
    this.setData({switches:sw, errorMsg:''});
    this.recalculate();
  },
  onReset(){ this.setData({switches:[false,false,false,false,false,false,false,false],errorMsg:''}); this.recalculate(); },
  onAllOn(){ this.setData({switches:[true,true,true,true,true,true,true,true],errorMsg:''}); this.recalculate(); },
  onReverseInput(e){ this.setData({reverseInput:e.target.value, errorMsg:''}); },
  onReverseQuery(){
    const raw = (this.data.reverseInput||'').trim();
    if(!raw){ this.setData({errorMsg:'请输入数值'}); return; }
    let v;
    if(/^0x[0-9a-fA-F]+$/.test(raw)) v = parseInt(raw, 16);
    else if(/^\d+$/.test(raw)) v = parseInt(raw, 10);
    else { this.setData({errorMsg:'格式错误：请输入十进制或 0x 开头的十六进制'}); return; }
    if(isNaN(v)||v<0||v>255){ this.setData({errorMsg:'数值超出范围（0-255）'}); return; }
    const sw = [];
    for(let i=0;i<8;i++) sw.push(((v>>(7-i))&1)===1);
    this.setData({switches:sw, errorMsg:''});
    this.recalculate();
  },
  recalculate(){
    let dec=0;
    for(let i=0;i<8;i++) if(this.data.switches[i]) dec += this.data.bitValues[i];
    this.setData({
      decimalValue:dec,
      hexValue:'0x'+dec.toString(16).toUpperCase().padStart(2,'0'),
      binValue:dec.toString(2).padStart(8,'0')
    });
  },
  render(d){
    return `<div>
      <div class="section"><div class="section-title">拨码开关（点击切换）</div>
        <div class="dip-row">${d.switches.map((s,i)=>`
          <div class="dip-unit" data-i="${i}">
            <div class="dip-slot"><div class="dip-handle ${s?'on':'off'}"></div></div>
            <div class="dip-num">${i+1}</div>
            <div class="dip-val">${d.bitValues[i]}</div>
          </div>`).join('')}</div>
        <div class="btn-row"><button class="btn btn-secondary" data-act="reset">复位</button><button class="btn btn-secondary" data-act="allon">全部开启</button></div>
      </div>
      <div class="section"><div class="section-title">计算结果</div>
        <div class="result-card">
          <div class="result-row"><div class="result-label">十进制</div><div class="result-value highlight">${d.decimalValue}</div></div>
          <div class="result-row"><div class="result-label">十六进制</div><div class="result-value mono">${d.hexValue}</div></div>
          <div class="result-row"><div class="result-label">二进制</div><div class="result-value mono">${d.binValue}</div></div>
        </div>
      </div>
      <div class="section"><div class="section-title">反向查询</div>
        <input class="input-box" placeholder="输入十进制或 0x十六进制（0-255）" data-act="rev" value="${d.reverseInput}" />
        <div class="btn-row"><button class="btn btn-primary" data-act="revquery">查询</button></div>
        ${d.errorMsg?`<div class="err-card" style="margin-top:8px">${d.errorMsg}</div>`:''}
      </div>
      <div class="info-card">说明：拨码开关 ON 表示该位为 1，OFF 表示 0。从左到右为高位到低位（bit7-bit0）。</div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-i]').forEach(el=>{ el.onclick=()=>inst.onToggleSwitch(parseInt(el.dataset.i)); });
    const rev = view.querySelector('[data-act="rev"]'); if(rev) rev.addEventListener('input', e=>inst.onReverseInput(e));
    view.querySelectorAll('[data-act]').forEach(el=>{
      const a = el.dataset.act;
      if(a==='reset') el.onclick=()=>inst.onReset();
      else if(a==='allon') el.onclick=()=>inst.onAllOn();
      else if(a==='revquery') el.onclick=()=>inst.onReverseQuery();
    });
  }
};

/* ===== T4 拍照标注 ===== */
PagesTools.photoAnnotate = {
  data:{
    imageUrl:'', currentTool:'arrow', currentColor:'#EF4444',
    tools:[{code:'arrow',name:'箭头'},{code:'circle',name:'圆圈'},{code:'rect',name:'矩形'},{code:'text',name:'文字'}],
    colors:[{color:'#EF4444'},{color:'#F59E0B'},{color:'#22C55E'},{color:'#E2E8F0'}]
  },
  navTitle:'现场拍照标注 T4',
  canvas:null, ctx:null, imageObj:null, snapshot:null, touchStart:null,
  onLoad(){ setTimeout(()=>this.initCanvas(), 50); },
  initCanvas(){
    const canvas = document.getElementById('annotateCanvas');
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    this.canvas = canvas; this.ctx = ctx;
    this.fillBackground();
  },
  fillBackground(){
    const c = this.ctx, w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
    c.fillStyle = '#18273A'; c.fillRect(0,0,w,h);
    this.captureSnapshot();
  },
  captureSnapshot(){
    this.snapshot = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
  },
  restoreSnapshot(){ if(this.snapshot) this.ctx.putImageData(this.snapshot,0,0); },
  loadImageToCanvas(src){
    const img = new Image();
    img.onload = ()=>{
      this.imageObj = img;
      this.drawImageFit();
      this.captureSnapshot();
      this.setData({imageUrl:src});
    };
    img.src = src;
  },
  drawImageFit(){
    const c = this.ctx, img = this.imageObj;
    const cw = this.canvas.offsetWidth, ch = this.canvas.offsetHeight;
    const scale = Math.min(cw/img.width, ch/img.height);
    const w = img.width*scale, h = img.height*scale;
    const x = (cw-w)/2, y = (ch-h)/2;
    c.drawImage(img, x, y, w, h);
  },
  drawShape(start, end, tool, color){
    const c = this.ctx;
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 3;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const dx = end.x - start.x, dy = end.y - start.y;
    if(tool==='arrow'){
      c.beginPath(); c.moveTo(start.x, start.y); c.lineTo(end.x, end.y); c.stroke();
      const headLen = 16, ang = Math.atan2(dy, dx);
      c.beginPath();
      c.moveTo(end.x, end.y);
      c.lineTo(end.x - headLen*Math.cos(ang - Math.PI/6), end.y - headLen*Math.sin(ang - Math.PI/6));
      c.moveTo(end.x, end.y);
      c.lineTo(end.x - headLen*Math.cos(ang + Math.PI/6), end.y - headLen*Math.sin(ang + Math.PI/6));
      c.stroke();
    } else if(tool==='circle'){
      const r = Math.sqrt(dx*dx + dy*dy);
      c.beginPath(); c.arc(start.x, start.y, r, 0, Math.PI*2); c.stroke();
    } else if(tool==='rect'){
      const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
      c.strokeRect(x, y, Math.abs(dx), Math.abs(dy));
    }
  },
  onChoosePhoto(){
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e)=>{
      const f = e.target.files[0];
      if(f){ this.loadImageToCanvas(URL.createObjectURL(f)); }
    };
    input.click();
  },
  onToolSelect(code){ this.setData({currentTool:code}); },
  onColorSelect(color){ this.setData({currentColor:color}); },
  onTouchStart(e){
    if(!this.canvas || !this.imageObj) { UI.toast('请先选择照片'); return; }
    const r = this.canvas.getBoundingClientRect();
    const p = {x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top};
    this.touchStart = p;
    if(this.data.currentTool==='text'){
      this.handleTextInput(p);
    } else {
      this.captureSnapshot();
    }
  },
  onTouchMove(e){
    if(!this.canvas || !this.touchStart || this.data.currentTool==='text') return;
    e.preventDefault();
    const r = this.canvas.getBoundingClientRect();
    const p = {x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top};
    this.restoreSnapshot();
    this.drawShape(this.touchStart, p, this.data.currentTool, this.data.currentColor);
  },
  onTouchEnd(){
    if(this.canvas && this.touchStart && this.data.currentTool!=='text'){
      this.captureSnapshot();
    }
    this.touchStart = null;
  },
  async handleTextInput(p){
    const txt = await UI.showModal({title:'输入标注文字', editable:true, content:''});
    if(txt){
      const c = this.ctx;
      c.fillStyle = this.data.currentColor;
      c.font = '16px sans-serif'; c.textBaseline = 'top';
      c.fillText(txt, p.x, p.y);
      this.captureSnapshot();
    }
  },
  onClearAnnotations(){
    if(this.imageObj){ this.drawImageFit(); this.captureSnapshot(); }
    else { this.fillBackground(); }
  },
  onSaveImage(){
    if(!this.imageObj){ UI.toast('请先选择照片'); return; }
    try{
      const url = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = 'annotate_'+Date.now()+'.png';
      a.click();
      UI.toast('已保存','success');
    }catch(e){ UI.toast('保存失败'); }
  },
  render(d){
    return `<div>
      <div class="section">
        <div class="canvas-wrap">
          <canvas id="annotateCanvas"></canvas>
          ${!d.imageUrl?`<div class="canvas-empty">📷<br>请先选择照片</div>`:''}
        </div>
        <button class="btn btn-primary btn-block" data-act="choose">选择照片</button>
      </div>
      <div class="section">
        <div class="section-title">标注工具</div>
        <div class="tool-pills">${d.tools.map(t=>`<span class="tp ${d.currentTool===t.code?'active':''}" data-tool="${t.code}">${t.name}</span>`).join('')}</div>
        <div class="color-row">${d.colors.map(c=>`<span class="ci ${d.currentColor===c.color?'active':''}" data-color="${c.color}" style="background:${c.color}"></span>`).join('')}</div>
        <div class="btn-row"><button class="btn btn-secondary" data-act="clear">清除标注</button><button class="btn btn-primary" data-act="save">保存图片</button></div>
      </div>
      <div class="info-card">提示：选择工具和颜色后在照片上拖动绘制。文字工具点击位置后输入文字。</div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-tool]').forEach(el=>{ el.onclick=()=>inst.onToolSelect(el.dataset.tool); });
    view.querySelectorAll('[data-color]').forEach(el=>{ el.onclick=()=>inst.onColorSelect(el.dataset.color); });
    const cv = view.querySelector('#annotateCanvas');
    if(cv){
      cv.addEventListener('touchstart', e=>inst.onTouchStart(e));
      cv.addEventListener('touchmove', e=>inst.onTouchMove(e));
      cv.addEventListener('touchend', ()=>inst.onTouchEnd());
      // 兼容鼠标
      cv.addEventListener('mousedown', e=>{ e.touches=[{clientX:e.clientX,clientY:e.clientY}]; inst.onTouchStart(e); });
      cv.addEventListener('mousemove', e=>{ if(inst.touchStart){ e.touches=[{clientX:e.clientX,clientY:e.clientY}]; inst.onTouchMove(e); } });
      cv.addEventListener('mouseup', ()=>inst.onTouchEnd());
    }
    view.querySelectorAll('[data-act]').forEach(el=>{
      const a = el.dataset.act;
      if(a==='choose') el.onclick=()=>inst.onChoosePhoto();
      else if(a==='clear') el.onclick=()=>inst.onClearAnnotations();
      else if(a==='save') el.onclick=()=>inst.onSaveImage();
    });
  }
};

/* ===== T5 语音速记 ===== */
PagesTools.voiceMemo = {
  data:{ isRecording:false, recordTime:0, timerText:'00:00', deviceInput:'', transcribing:false, currentTranscript:'', memoList:[] },
  navTitle:'语音速记 T5',
  _timer:null, _mediaRecorder:null, _chunks:[], _audioPath:'', _recStart:0,
  onLoad(){ this.loadMemos(); },
  onUnload(){ if(this._timer) clearInterval(this._timer); },
  formatTime(s){ const m=Math.floor(s/60), ss=s%60; return (m<10?'0':'')+m+':'+(ss<10?'0':'')+ss; },
  formatDateTime(ts){ const d=new Date(ts), p=n=>n<10?'0'+n:''+n; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); },
  loadMemos(){
    const list = Storage.get('voiceMemos', []);
    this.setData({memoList:list});
  },
  saveMemos(list){ Storage.set('voiceMemos', list); },
  onStartRecord(){
    if(this.data.isRecording){ this.onStopRecord(); return; }
    this._chunks = [];
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
        this._mediaRecorder = new MediaRecorder(stream);
        this._mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) this._chunks.push(e.data); };
        this._mediaRecorder.onstop = ()=>{ this.handleRecordStop(); };
        this._mediaRecorder.start();
        this._recStart = Date.now();
        this.setData({isRecording:true, recordTime:0, timerText:'00:00'});
        this._timer = setInterval(()=>{ const s = Math.floor((Date.now()-this._recStart)/1000); if(s>=60){ this.onStopRecord(); return; } this.setData({recordTime:s, timerText:this.formatTime(s)}); }, 1000);
      }).catch(()=>{ this.simulateRecord(); });
    } else { this.simulateRecord(); }
  },
  simulateRecord(){
    // 不支持录音时模拟
    this._recStart = Date.now();
    this.setData({isRecording:true, recordTime:0, timerText:'00:00'});
    this._timer = setInterval(()=>{ const s = Math.floor((Date.now()-this._recStart)/1000); if(s>=60){ this.onStopRecord(); return; } this.setData({recordTime:s, timerText:this.formatTime(s)}); }, 1000);
    UI.toast('使用模拟录音模式');
  },
  onStopRecord(){
    if(!this.data.isRecording) return;
    if(this._timer) clearInterval(this._timer);
    const dur = this.data.recordTime;
    this.setData({isRecording:false});
    if(this._mediaRecorder && this._mediaRecorder.state!=='inactive'){
      this._mediaRecorder.stop();
      this._mediaRecorder.stream.getTracks().forEach(t=>t.stop());
    } else {
      this._audioPath = '';
      this.handleRecordStop();
    }
  },
  handleRecordStop(){
    if(this._chunks.length>0){
      const blob = new Blob(this._chunks, {type:'audio/webm'});
      this._audioPath = URL.createObjectURL(blob);
    } else { this._audioPath = ''; }
    this.setData({transcribing:true});
    setTimeout(()=>{
      const transcript = '[语音识别] 这是模拟识别结果，实际部署应接入端侧 ASR 引擎。';
      const memo = {
        id:'m_'+Date.now(), device:this.data.deviceInput||'未指定设备',
        duration:this.data.recordTime, durationText:this.formatTime(this.data.recordTime),
        audioPath:this._audioPath, transcript:transcript,
        time:Date.now(), timeText:this.formatDateTime(Date.now())
      };
      const list = [memo, ...this.data.memoList];
      this.saveMemos(list);
      this.setData({transcribing:false, currentTranscript:transcript, memoList:list, recordTime:0, timerText:'00:00'});
    }, 1500);
  },
  onDeviceInput(e){ this.setData({deviceInput:e.target.value}); },
  onPlayMemo(e){
    const id = e.currentTarget.dataset.id;
    const m = this.data.memoList.find(x=>x.id===id);
    if(m && m.audioPath){ new Audio(m.audioPath).play(); }
    else UI.toast('无音频文件');
  },
  async onDeleteMemo(e){
    const id = e.currentTarget.dataset.id;
    const ok = await UI.showModal({title:'删除备忘', content:'确认删除该条语音速记？'});
    if(ok){
      const list = this.data.memoList.filter(x=>x.id!==id);
      this.saveMemos(list);
      this.setData({memoList:list});
      UI.toast('已删除','success');
    }
  },
  render(d){
    return `<div>
      <div class="rec-card">
        <div class="rec-pulse ${d.isRecording?'on':''}"></div>
        <div style="font-size:12px;color:var(--muted)">${d.isRecording?'录音中...':'准备就绪'}</div>
        <div class="rec-time">${d.timerText}</div>
        <div class="rec-btns">
          <button class="rec-btn ${d.isRecording?'stop':'start'}" data-act="rec">${d.isRecording?'⏹':'🎤'}</button>
        </div>
        <input class="rec-input" placeholder="关联设备（可选）" data-act="dev" value="${d.deviceInput}" />
      </div>
      <div class="section">
        <div class="section-title">识别结果</div>
        ${d.transcribing?`<div class="info-card">⏳ 语音识别中...</div>`:(d.currentTranscript?`<div class="info-card">${d.currentTranscript}</div>`:'')}
      </div>
      <div class="section">
        <div class="section-title">备忘列表（${d.memoList.length}）</div>
        ${d.memoList.length? d.memoList.map(m=>`
          <div class="memo-item">
            <div class="memo-h"><span class="memo-dev">${m.device}</span><span class="memo-time">${m.durationText} · ${m.timeText}</span></div>
            <div class="memo-text">${m.transcript}</div>
            <div class="memo-acts">
              ${m.audioPath?`<span class="memo-act" data-id="${m.id}" data-act="play">▶ 播放</span>`:''}
              <span class="memo-act del" data-id="${m.id}" data-act="del">🗑 删除</span>
            </div>
          </div>`).join('') : '<div class="empty-tip">暂无语音速记</div>'}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    const rec = view.querySelector('[data-act="rec"]'); if(rec) rec.onclick=()=>inst.onStartRecord();
    const dev = view.querySelector('[data-act="dev"]'); if(dev) dev.addEventListener('input', e=>inst.onDeviceInput(e));
    view.querySelectorAll('[data-act="play"]').forEach(el=>{ el.onclick=()=>inst.onPlayMemo(el); });
    view.querySelectorAll('[data-act="del"]').forEach(el=>{ el.onclick=()=>inst.onDeleteMemo(el); });
  }
};

/* ===== T6 单位换算器 ===== */
PagesTools.unitConverter = {
  data:{
    categories:[{code:'power',name:'功率换算'},{code:'ohm',name:'欧姆定律'},{code:'temp',name:'温度'},{code:'base',name:'进制换算'},{code:'ip',name:'IP换算'}],
    activeCategory:'power', errorMsg:'',
    powerUnits:['dBm','mW'], powerUnit:'dBm', powerInput:'', powerResult:{dBm:'',mW:'',W:''},
    ohmV:'',ohmI:'',ohmP:'',ohmR:'',
    tempUnits:[{code:'C'},{code:'F'}], tempUnit:'C', tempInput:'', tempResult:{C:'',F:'',K:''},
    baseTypes:[{code:'dec',name:'十进制'},{code:'hex',name:'十六进制'},{code:'bin',name:'二进制'}], baseType:'dec', baseInput:'', baseResult:{dec:'',hex:'',bin:''},
    ipModes:[{code:'ip',name:'IP地址'},{code:'int',name:'int32'}], ipMode:'ip', ipInput:'', ipResult:{ip:'',int:'',bin:''}
  },
  navTitle:'单位换算器 T6',
  fmt(num, digits){
    if(!isFinite(num)) return 'NaN';
    digits = digits==null?4:digits;
    if(num!==0 && (Math.abs(num)>=1e6 || Math.abs(num)<1e-4)) return num.toExponential(3);
    const s = num.toFixed(digits);
    return parseFloat(s).toString();
  },
  onCategoryChange(code){ this.setData({activeCategory:code, errorMsg:''}); },
  onPowerUnit(u){ this.setData({powerUnit:u}); this.calcPower(); },
  onPowerInput(e){ this.setData({powerInput:e.target.value}); this.calcPower(); },
  calcPower(){
    const raw = this.data.powerInput.trim();
    if(!raw){ this.setData({powerResult:{dBm:'',mW:'',W:''}}); return; }
    const num = parseFloat(raw);
    if(isNaN(num)){ this.setData({powerResult:{dBm:'',mW:'',W:''}, errorMsg:'请输入有效数字'}); return; }
    let dBm, mW;
    if(this.data.powerUnit==='dBm'){ dBm = num; mW = Math.pow(10, num/10); }
    else { mW = num; if(mW<=0){ this.setData({errorMsg:'mW 必须 > 0', powerResult:{dBm:'',mW:'',W:''}}); return; } dBm = 10*Math.log10(mW); }
    this.setData({powerResult:{dBm:this.fmt(dBm,4), mW:this.fmt(mW,4), W:this.fmt(mW/1000,6)}, errorMsg:''});
  },
  onOhmInput(k,e){ const o={}; o[k]=e.target.value; this.setData(o); },
  onOhmClear(){ this.setData({ohmV:'',ohmI:'',ohmP:'',ohmR:'',errorMsg:''}); },
  onOhmCalc(){
    const {ohmV,ohmI,ohmP,ohmR} = this.data;
    const filled = [ohmV,ohmI,ohmP,ohmR].filter(x=>x.trim()!=='');
    if(filled.length!==2){ this.setData({errorMsg:'请恰好输入 2 个参数（其余留空）'}); return; }
    let V = ohmV?parseFloat(ohmV):null, I = ohmI?parseFloat(ohmI):null;
    let P = ohmP?parseFloat(ohmP):null, R = ohmR?parseFloat(ohmR):null;
    if([V,I,P,R].some(x=>x!==null&&x<0)){ this.setData({errorMsg:'参数不能为负'}); return; }
    try{
      if(V!==null && I!==null){ R = V/I; P = V*I; }
      else if(V!==null && P!==null){ I = P/V; R = V*V/P; }
      else if(V!==null && R!==null){ I = V/R; P = V*V/R; }
      else if(I!==null && P!==null){ V = P/I; R = P/(I*I); }
      else if(I!==null && R!==null){ V = I*R; P = I*I*R; }
      else if(P!==null && R!==null){ V = Math.sqrt(P*R); I = Math.sqrt(P/R); }
      this.setData({ohmV:this.fmt(V,4), ohmI:this.fmt(I,4), ohmP:this.fmt(P,4), ohmR:this.fmt(R,4), errorMsg:''});
    }catch(e){ this.setData({errorMsg:'计算失败：'+e.message}); }
  },
  onTempUnit(u){ this.setData({tempUnit:u}); this.calcTemp(); },
  onTempInput(e){ this.setData({tempInput:e.target.value}); this.calcTemp(); },
  calcTemp(){
    const raw = this.data.tempInput.trim();
    if(!raw){ this.setData({tempResult:{C:'',F:'',K:''}}); return; }
    const num = parseFloat(raw);
    if(isNaN(num)){ this.setData({tempResult:{C:'',F:'',K:''}}); return; }
    let C, F, K;
    if(this.data.tempUnit==='C'){ C = num; F = C*9/5+32; K = C+273.15; }
    else { F = num; C = (F-32)*5/9; K = C+273.15; }
    this.setData({tempResult:{C:this.fmt(C,2), F:this.fmt(F,2), K:this.fmt(K,2)}});
  },
  onBaseType(t){ this.setData({baseType:t}); this.calcBase(); },
  onBaseInput(e){ this.setData({baseInput:e.target.value}); this.calcBase(); },
  calcBase(){
    const raw = this.data.baseInput.trim();
    if(!raw){ this.setData({baseResult:{dec:'',hex:'',bin:''}}); return; }
    let dec;
    if(this.data.baseType==='dec'){
      if(!/^-?\d+$/.test(raw)){ this.setData({errorMsg:'十进制格式错误', baseResult:{dec:'',hex:'',bin:''}}); return; }
      dec = parseInt(raw, 10);
    } else if(this.data.baseType==='hex'){
      if(!/^[0-9a-fA-F]+$/.test(raw)){ this.setData({errorMsg:'十六进制格式错误', baseResult:{dec:'',hex:'',bin:''}}); return; }
      dec = parseInt(raw, 16);
    } else {
      if(!/^[01]+$/.test(raw)){ this.setData({errorMsg:'二进制格式错误', baseResult:{dec:'',hex:'',bin:''}}); return; }
      dec = parseInt(raw, 2);
    }
    if(dec > 4294967295){ this.setData({errorMsg:'数值超出 32 位范围'}); return; }
    this.setData({baseResult:{dec:dec.toString(), hex:'0x'+dec.toString(16).toUpperCase(), bin:dec.toString(2)}, errorMsg:''});
  },
  onIpMode(m){ this.setData({ipMode:m}); },
  onIpInput(e){ this.setData({ipInput:e.target.value}); },
  onIpClear(){ this.setData({ipInput:'', ipResult:{ip:'',int:'',bin:''}, errorMsg:''}); },
  onIpCalc(){
    const raw = this.data.ipInput.trim();
    if(!raw){ this.setData({ipResult:{ip:'',int:'',bin:''}}); return; }
    if(this.data.ipMode==='ip'){
      const parts = raw.split('.');
      if(parts.length!==4){ this.setData({errorMsg:'IP 格式错误', ipResult:{ip:'',int:'',bin:''}}); return; }
      for(const p of parts){ const n = parseInt(p,10); if(isNaN(n)||n<0||n>255){ this.setData({errorMsg:'IP 段超出范围 0-255', ipResult:{ip:'',int:'',bin:''}}); return; } }
      const [p0,p1,p2,p3] = parts.map(p=>parseInt(p,10));
      const intVal = (p0*16777216 + p1*65536 + p2*256 + p3) >>> 0;
      this.setData({ipResult:{ip:raw, int:intVal.toString(), bin:intVal.toString(2).padStart(32,'0')}, errorMsg:''});
    } else {
      if(!/^\d+$/.test(raw)){ this.setData({errorMsg:'请输入数字', ipResult:{ip:'',int:'',bin:''}}); return; }
      let n = parseInt(raw, 10);
      if(n<0 || n>4294967295){ this.setData({errorMsg:'数值超出 32 位范围', ipResult:{ip:'',int:'',bin:''}}); return; }
      n = n >>> 0;
      const ip = ((n>>>24)&0xFF)+'.'+((n>>>16)&0xFF)+'.'+((n>>>8)&0xFF)+'.'+(n&0xFF);
      this.setData({ipResult:{ip:ip, int:n.toString(), bin:n.toString(2).padStart(32,'0')}, errorMsg:''});
    }
  },
  render(d){
    let body='';
    if(d.activeCategory==='power'){
      body = `<div class="tag-row">${d.powerUnits.map(u=>`<span class="tag-pill ${d.powerUnit===u?'active':''}" data-pu="${u}">${u}</span>`).join('')}</div>
        <input class="input-box" placeholder="输入数值" data-act="pinput" value="${d.powerInput}" />
        <div class="result-card" style="margin-top:8px">
          <div class="result-row"><div class="result-label">dBm</div><div class="result-value highlight">${d.powerResult.dBm}</div></div>
          <div class="result-row"><div class="result-label">mW</div><div class="result-value highlight">${d.powerResult.mW}</div></div>
          <div class="result-row"><div class="result-label">W</div><div class="result-value highlight">${d.powerResult.W}</div></div>
        </div>`;
    } else if(d.activeCategory==='ohm'){
      body = `<div class="unit-grid2">
          <div><div class="ug-label">电压 V (留空则计算)</div><input class="input-box" data-ohm="V" value="${d.ohmV}" /></div>
          <div><div class="ug-label">电流 I (留空则计算)</div><input class="input-box" data-ohm="I" value="${d.ohmI}" /></div>
          <div><div class="ug-label">功率 P (留空则计算)</div><input class="input-box" data-ohm="P" value="${d.ohmP}" /></div>
          <div><div class="ug-label">电阻 R (留空则计算)</div><input class="input-box" data-ohm="R" value="${d.ohmR}" /></div>
        </div>
        <div class="btn-row"><button class="btn btn-secondary" data-act="ohmclear">清空</button><button class="btn btn-primary" data-act="ohmcalc">计算</button></div>
        <div class="info-card" style="margin-top:8px">公式：V=IR · P=VI · P=I²R · P=V²/R · 输入 2 个参数自动求另 2 个</div>`;
    } else if(d.activeCategory==='temp'){
      body = `<div class="tag-row">${d.tempUnits.map(u=>`<span class="tag-pill ${d.tempUnit===u.code?'active':''}" data-tu="${u.code}">${u.code==='C'?'°C':'°F'}</span>`).join('')}</div>
        <input class="input-box" placeholder="输入数值" data-act="tinput" value="${d.tempInput}" />
        <div class="result-card" style="margin-top:8px">
          <div class="result-row"><div class="result-label">°C</div><div class="result-value highlight">${d.tempResult.C}</div></div>
          <div class="result-row"><div class="result-label">°F</div><div class="result-value highlight">${d.tempResult.F}</div></div>
          <div class="result-row"><div class="result-label">K</div><div class="result-value highlight">${d.tempResult.K}</div></div>
        </div>`;
    } else if(d.activeCategory==='base'){
      body = `<div class="tag-row">${d.baseTypes.map(t=>`<span class="tag-pill ${d.baseType===t.code?'active':''}" data-bt="${t.code}">${t.name}</span>`).join('')}</div>
        <input class="input-box" placeholder="输入数值" data-act="binput" value="${d.baseInput}" />
        <div class="result-card" style="margin-top:8px">
          <div class="result-row"><div class="result-label">DEC</div><div class="result-value highlight mono">${d.baseResult.dec}</div></div>
          <div class="result-row"><div class="result-label">HEX</div><div class="result-value highlight mono">${d.baseResult.hex}</div></div>
          <div class="result-row"><div class="result-label">BIN</div><div class="result-value highlight mono">${d.baseResult.bin}</div></div>
        </div>`;
    } else {
      body = `<div class="tag-row">${d.ipModes.map(m=>`<span class="tag-pill ${d.ipMode===m.code?'active':''}" data-im="${m.code}">${m.name}</span>`).join('')}</div>
        <input class="input-box" placeholder="${d.ipMode==='ip'?'192.168.1.1':'3232235777'}" data-act="iinput" value="${d.ipInput}" />
        <div class="btn-row"><button class="btn btn-secondary" data-act="ipclear">清空</button><button class="btn btn-primary" data-act="ipcalc">换算</button></div>
        <div class="result-card" style="margin-top:8px">
          <div class="result-row"><div class="result-label">IP</div><div class="result-value highlight mono">${d.ipResult.ip}</div></div>
          <div class="result-row"><div class="result-label">int32</div><div class="result-value highlight mono">${d.ipResult.int}</div></div>
          <div class="result-row"><div class="result-label">二进制</div><div class="result-value mono" style="font-size:11px">${d.ipResult.bin}</div></div>
        </div>`;
    }
    return `<div>
      <div class="tag-row">${d.categories.map(c=>`<span class="tag-pill ${d.activeCategory===c.code?'active':''}" data-cat="${c.code}">${c.name}</span>`).join('')}</div>
      ${d.errorMsg?`<div class="err-card">${d.errorMsg}</div>`:''}
      <div class="section">${body}</div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-cat]').forEach(el=>{ el.onclick=()=>inst.onCategoryChange(el.dataset.cat); });
    view.querySelectorAll('[data-pu]').forEach(el=>{ el.onclick=()=>inst.onPowerUnit(el.dataset.pu); });
    view.querySelectorAll('[data-tu]').forEach(el=>{ el.onclick=()=>inst.onTempUnit(el.dataset.tu); });
    view.querySelectorAll('[data-bt]').forEach(el=>{ el.onclick=()=>inst.onBaseType(el.dataset.bt); });
    view.querySelectorAll('[data-im]').forEach(el=>{ el.onclick=()=>inst.onIpMode(el.dataset.im); });
    const p = view.querySelector('[data-act="pinput"]'); if(p) p.addEventListener('input', e=>inst.onPowerInput(e));
    const t = view.querySelector('[data-act="tinput"]'); if(t) t.addEventListener('input', e=>inst.onTempInput(e));
    const b = view.querySelector('[data-act="binput"]'); if(b) b.addEventListener('input', e=>inst.onBaseInput(e));
    const i = view.querySelector('[data-act="iinput"]'); if(i) i.addEventListener('input', e=>inst.onIpInput(e));
    view.querySelectorAll('[data-ohm]').forEach(el=>{ el.addEventListener('input', e=>inst.onOhmInput(el.dataset.ohm, e)); });
    view.querySelectorAll('[data-act]').forEach(el=>{
      const a = el.dataset.act;
      if(a==='ohmclear') el.onclick=()=>inst.onOhmClear();
      else if(a==='ohmcalc') el.onclick=()=>inst.onOhmCalc();
      else if(a==='ipclear') el.onclick=()=>inst.onIpClear();
      else if(a==='ipcalc') el.onclick=()=>inst.onIpCalc();
    });
  }
};

/* ===== T7 CRC 校验计算器 ===== */
PagesTools.crcCalculator = {
  data:{
    currentAlgo:'crc16',
    algorithms:[{code:'crc16',name:'CRC-16 Modbus'},{code:'cs',name:'CS校验(645)'},{code:'xor',name:'XOR校验'},{code:'crc32',name:'CRC-32'}],
    hexInput:'', resultHex:'', resultDec:'', appendedFrame:'', errorMsg:'',
    algoDesc:{crc16:'CRC-16 Modbus：多项式 0xA001，初值 0xFFFF，结果 2 字节低字节在前。',cs:'CS校验(645)：所有字节累加和 mod 256，1 字节。',xor:'XOR校验：所有字节异或，1 字节。',crc32:'CRC-32：多项式 0xEDB88320，初值 0xFFFFFFFF，终值异或 0xFFFFFFFF，4 字节低字节在前。'}
  },
  navTitle:'CRC校验计算器 T7',
  onAlgoChange(code){ this.setData({currentAlgo:code, resultHex:'', resultDec:'', appendedFrame:'', errorMsg:''}); },
  onHexInput(e){ this.setData({hexInput:e.target.value}); },
  onClear(){ this.setData({hexInput:'',resultHex:'',resultDec:'',appendedFrame:'',errorMsg:''}); },
  onCalc(){
    const {hexInput, currentAlgo} = this.data;
    if(!hexInput || !hexInput.trim()){ this.setData({errorMsg:'请输入报文'}); return; }
    const bytes = this.hexToBytes(hexInput);
    if(!bytes){ this.setData({errorMsg:'报文格式错误，请输入16进制'}); return; }
    if(bytes.length===0){ this.setData({errorMsg:'报文为空'}); return; }
    let rb=[], dec='';
    try{
      switch(currentAlgo){
        case 'crc16': { const crc = this.calcCRC16Modbus(bytes); rb = [crc&0xFF, (crc>>8)&0xFF]; dec = crc.toString(); break; }
        case 'cs': { rb = [this.calcCS645(bytes)]; break; }
        case 'xor': { rb = [this.calcXOR(bytes)]; break; }
        case 'crc32': { const crc = this.calcCRC32(bytes); rb = [crc&0xFF,(crc>>8)&0xFF,(crc>>16)&0xFF,(crc>>24)&0xFF]; dec = crc.toString(); break; }
      }
      this.setData({resultHex:this.bytesToHex(rb), resultDec:dec, appendedFrame:'', errorMsg:''});
    }catch(e){ this.setData({errorMsg:'计算失败：'+e.message}); }
  },
  onAppend(){
    const {hexInput, resultHex} = this.data;
    if(!resultHex){ this.setData({errorMsg:'请先计算校验值'}); return; }
    if(!hexInput || !hexInput.trim()){ this.setData({errorMsg:'请输入报文'}); return; }
    const t = hexInput.trim().replace(/\s+/g, ' ');
    this.setData({appendedFrame: t+' '+resultHex, errorMsg:''});
  },
  async onCopyResult(){
    if(!this.data.resultHex){ this.setData({errorMsg:'请先计算校验值'}); return; }
    try{ await navigator.clipboard.writeText(this.data.resultHex); UI.toast('已复制','success'); }
    catch(e){ UI.toast('复制失败'); }
  },
  hexToBytes(hex){
    const c = hex.replace(/[^0-9a-fA-F]/g,'');
    if(c.length%2!==0) return null;
    const b=[];
    for(let i=0;i<c.length;i+=2) b.push(parseInt(c.substr(i,2),16));
    return b;
  },
  bytesToHex(bytes){ return bytes.map(b=>(b<16?'0':'')+b.toString(16).toUpperCase()).join(' '); },
  calcCRC16Modbus(bytes){
    let crc=0xFFFF;
    for(let i=0;i<bytes.length;i++){ crc ^= bytes[i]; for(let j=0;j<8;j++) crc = (crc&1)?(crc>>1)^0xA001:crc>>1; }
    return crc;
  },
  calcCS645(bytes){ let s=0; for(let i=0;i<bytes.length;i++) s += bytes[i]; return s & 0xFF; },
  calcXOR(bytes){ let x=0; for(let i=0;i<bytes.length;i++) x ^= bytes[i]; return x & 0xFF; },
  calcCRC32(bytes){
    let crc=0xFFFFFFFF;
    for(let i=0;i<bytes.length;i++){ crc ^= bytes[i]; for(let j=0;j<8;j++) crc = (crc&1)?(crc>>>1)^0xEDB88320:crc>>>1; }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  },
  render(d){
    return `<div>
      <div class="section"><div class="section-title">选择算法</div>
        <div class="tag-row">${d.algorithms.map(a=>`<span class="tag-pill ${d.currentAlgo===a.code?'active':''}" data-algo="${a.code}">${a.name}</span>`).join('')}</div>
      </div>
      <div class="section"><div class="section-title">输入报文（16进制，空格分隔）</div>
        <textarea class="input-box" placeholder="例如：01 03 00 00 00 0A" data-act="hex">${d.hexInput}</textarea>
        <div class="btn-row"><button class="btn btn-secondary" data-act="clear">清空</button><button class="btn btn-primary" data-act="calc">计算</button></div>
      </div>
      ${d.errorMsg?`<div class="err-card">${d.errorMsg}</div>`:''}
      ${d.resultHex?`<div class="section"><div class="section-title">计算结果</div>
        <div class="result-card">
          <div class="result-row"><div class="result-label">校验值(HEX)</div><div class="result-value highlight mono">${d.resultHex}</div></div>
          ${d.resultDec?`<div class="result-row"><div class="result-label">校验值(DEC)</div><div class="result-value mono">${d.resultDec}</div></div>`:''}
        </div>
        <div class="btn-row"><button class="btn btn-secondary" data-act="append">追加校验到报文</button><button class="btn btn-primary" data-act="copy">复制结果</button></div>
      </div>`:''}
      ${d.appendedFrame?`<div class="section"><div class="section-title">完整帧（含校验）</div><div class="frame-box">${d.appendedFrame}</div></div>`:''}
      <div class="section"><div class="section-title">算法说明</div><div class="info-card">${d.algoDesc[d.currentAlgo]}</div></div>
    </div>`;
  },
  bindEvents(view, inst){
    view.querySelectorAll('[data-algo]').forEach(el=>{ el.onclick=()=>inst.onAlgoChange(el.dataset.algo); });
    const ta = view.querySelector('[data-act="hex"]'); if(ta) ta.addEventListener('input', e=>inst.onHexInput(e));
    view.querySelectorAll('.btn-row [data-act]').forEach(el=>{
      const a = el.dataset.act;
      if(a==='clear') el.onclick=()=>inst.onClear();
      else if(a==='calc') el.onclick=()=>inst.onCalc();
      else if(a==='append') el.onclick=()=>inst.onAppend();
      else if(a==='copy') el.onclick=()=>inst.onCopyResult();
    });
  }
};

/* ===== T8 维保周期提醒 ===== */
PagesTools.maintenanceReminder = {
  data:{
    formData:{deviceId:'', lastDate:'', cycleDays:'', remark:''},
    records:[], errorMsg:''
  },
  navTitle:'维保周期提醒 T8',
  onLoad(){
    const today = this.formatDate(new Date());
    this.setData({['formData.lastDate']:today});
    this.loadRecords();
  },
  onShow(){ this.loadRecords(); },
  formatDate(date){
    const d = new Date(date), p = n=>n<10?'0'+n:''+n;
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
  },
  parseDate(str){
    const p = str.split('-').map(n=>parseInt(n,10));
    return new Date(p[0], p[1]-1, p[2]).getTime();
  },
  loadRecords(){
    const list = Storage.get('maintenanceRecords', []);
    list.forEach(r => { Object.assign(r, this.calcStatus(r)); });
    this.setData({records:list});
  },
  calcStatus(rec){
    const todayTs = new Date(); todayTs.setHours(0,0,0,0);
    const today = todayTs.getTime();
    const nextTs = this.parseDate(rec.nextDate);
    const days = Math.floor((today - nextTs) / 86400000);
    let status, text;
    if(days < 0){ status='normal'; text='正常'; }
    else if(days <= 7){ status='soon'; text='即将到期'; }
    else { status='overdue'; text='已逾期'; }
    return {daysRemaining:days, status, statusText:text};
  },
  onDeviceInput(e){ this.setData({['formData.deviceId']:e.target.value}); },
  onDateChange(e){ this.setData({['formData.lastDate']:e.target.value}); },
  onCycleInput(e){ this.setData({['formData.cycleDays']:e.target.value}); },
  onRemarkInput(e){ this.setData({['formData.remark']:e.target.value}); },
  onAddRecord(){
    const f = this.data.formData;
    if(!f.deviceId.trim()){ this.setData({errorMsg:'请输入设备 ID / 名称'}); return; }
    if(!f.lastDate){ this.setData({errorMsg:'请选择上次维保日期'}); return; }
    const cycle = parseInt(f.cycleDays, 10);
    if(!cycle || cycle<=0){ this.setData({errorMsg:'维保周期必须为正整数'}); return; }
    const lastTs = this.parseDate(f.lastDate);
    const nextTs = lastTs + cycle * 86400000;
    const nextDate = this.formatDate(new Date(nextTs));
    const rec = {
      id: Date.now().toString(), deviceId: f.deviceId.trim(), lastDate: f.lastDate,
      cycleDays: cycle, remark: f.remark.trim(), nextDate: nextDate
    };
    Object.assign(rec, this.calcStatus(rec));
    const list = [rec, ...this.data.records];
    Storage.set('maintenanceRecords', list);
    this.setData({records:list, errorMsg:'', formData:{deviceId:'', lastDate:this.formatDate(new Date()), cycleDays:'', remark:''}});
    UI.toast('已添加','success');
  },
  async onDeleteRecord(id){
    const ok = await UI.showModal({title:'删除记录', content:'确认删除该维保记录？'});
    if(ok){
      const list = this.data.records.filter(r=>r.id!==id);
      Storage.set('maintenanceRecords', list);
      this.setData({records:list});
      UI.toast('已删除','success');
    }
  },
  render(d){
    return `<div>
      <div class="info-card" style="margin-bottom:12px">⏰ 维保到期将通过订阅消息提醒（演示版）</div>
      <div class="form-card">
        <div class="fc-item"><div class="fc-label">设备 ID / 名称</div><input class="fc-input" data-act="dev" value="${d.formData.deviceId}" placeholder="如：WFET-1000-A3" /></div>
        <div class="fc-item"><div class="fc-label">上次维保日期</div><input type="date" class="fc-input" data-act="date" value="${d.formData.lastDate}" /></div>
        <div class="fc-item"><div class="fc-label">维保周期（天）</div><input type="number" class="fc-input" data-act="cycle" value="${d.formData.cycleDays}" placeholder="如：90" /></div>
        <div class="fc-item"><div class="fc-label">备注</div><input class="fc-input" data-act="remark" value="${d.formData.remark}" placeholder="可选" /></div>
        ${d.errorMsg?`<div class="err-card">${d.errorMsg}</div>`:''}
        <button class="btn btn-primary btn-block" data-act="add">添加维保记录</button>
      </div>
      <div class="section"><div class="section-title">维保记录（${d.records.length}）</div>
        ${d.records.length? d.records.map(r=>{
          const dc = r.status==='overdue'?'danger':(r.status==='soon'?'warn':'success');
          return `<div class="maint-item">
            <div class="maint-h"><span class="maint-dev">${r.deviceId}</span><span class="maint-badge badge-${r.status}">${r.statusText}</span></div>
            <div class="maint-row"><span class="maint-k">上次维保</span><span class="maint-v">${r.lastDate}</span></div>
            <div class="maint-row"><span class="maint-k">维保周期</span><span class="maint-v">${r.cycleDays} 天</span></div>
            <div class="maint-row"><span class="maint-k">下次维保</span><span class="maint-v">${r.nextDate}</span></div>
            <div class="maint-row"><span class="maint-k">剩余天数</span><span class="maint-v maint-days ${dc}">${r.daysRemaining < 0 ? '剩 '+Math.abs(r.daysRemaining)+' 天' : '逾期 '+r.daysRemaining+' 天'}</span></div>
            ${r.remark?`<div class="maint-row"><span class="maint-k">备注</span><span class="maint-v">${r.remark}</span></div>`:''}
            <span class="maint-del" data-id="${r.id}" data-act="del">删除</span>
          </div>`;
        }).join('') : '<div class="empty-tip">暂无维保记录</div>'}
      </div>
    </div>`;
  },
  bindEvents(view, inst){
    const d = view.querySelector('[data-act="dev"]'); if(d) d.addEventListener('input', e=>inst.onDeviceInput(e));
    const dt = view.querySelector('[data-act="date"]'); if(dt) dt.addEventListener('change', e=>inst.onDateChange(e));
    const c = view.querySelector('[data-act="cycle"]'); if(c) c.addEventListener('input', e=>inst.onCycleInput(e));
    const r = view.querySelector('[data-act="remark"]'); if(r) r.addEventListener('input', e=>inst.onRemarkInput(e));
    const add = view.querySelector('[data-act="add"]'); if(add) add.onclick=()=>inst.onAddRecord();
    view.querySelectorAll('[data-act="del"]').forEach(el=>{ el.onclick=()=>inst.onDeleteRecord(el.dataset.id); });
  }
};
