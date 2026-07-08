/**
 * 机器狗遥控 - 主应用
 * 3Tab: 首页 / 设备 / 我的
 * 全屏面板: 遥控 / 校准
 */

// ===== Storage =====
const Storage = {
    get(k, d=null) { try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d} },
    set(k, v) { try{localStorage.setItem(k,JSON.stringify(v))}catch(e){} },
    remove(k) { localStorage.removeItem(k) },
    clear() { localStorage.clear() }
};

// ===== Protocol =====
const Protocol = {
    CMD: { MOVE:0x01, STOP:0x02, GAIT:0x03, ACTION:0x04, ZERO_CAL:0x10, FINE_CAL:0x11, HEIGHT:0x30, POSTURE:0x31, SELF_BAL:0x32 },
    seq: 0,
    checksum(d) { let s=0; for(let i=0;i<d.length;i++) s+=d[i]; return s&0xFF },
    pad(d) { const p=Array(5).fill(0); for(let i=0;i<Math.min(d.length,5);i++) p[i]=d[i]&0xFF; return p },
    buildFrame(cmd, data=[]) {
        const seq=this.seq++&0xFF, d=this.pad(data);
        const f=[0xAA,0x55,cmd,seq,...d];
        f.push(this.checksum(f.slice(2)));
        return new Uint8Array(f);
    },
    map(v,a,b,c=0,d=255) { return Math.round(((Math.max(a,Math.min(b,v))-a)/(b-a))*(d-c)+c) },
    moveCmd(vx,vy,vr) { return this.buildFrame(this.CMD.MOVE,[this.map(vx,-100,100),this.map(vy,-100,100),this.map(vr,-100,100)]) },
    stopCmd() { return this.buildFrame(this.CMD.STOP,[0xFF,0xFF,0xFF,0xFF,0xFF]) },
    gaitCmd(g) { return this.buildFrame(this.CMD.GAIT,[g]) },
    actionCmd(a) { return this.buildFrame(this.CMD.ACTION,[a]) },
    zeroCalCmd() { return this.buildFrame(this.CMD.ZERO_CAL,[0x01]) },
    fineCalCmd(m,o) { return this.buildFrame(this.CMD.FINE_CAL,[m,this.map(o,-90,90)]) },
    heightCmd(h) { return this.buildFrame(this.CMD.HEIGHT,[h]) },
    postureCmd(p,r,y) { return this.buildFrame(this.CMD.POSTURE,[this.map(p,-30,30),this.map(r,-30,30),this.map(y,-45,45)]) },
    selfBalCmd(on) { return this.buildFrame(this.CMD.SELF_BAL,[on?1:0]) }
};

// ===== Toast =====
const Toast = {
    show(msg, type='info', dur=3000) {
        const c=document.getElementById('toast-container');
        const t=document.createElement('div');
        t.className=`toast ${type}`; t.textContent=msg;
        c.appendChild(t); setTimeout(()=>t.remove(), dur);
    },
    info(m){this.show(m,'info')}, success(m){this.show(m,'success')}, error(m){this.show(m,'error')}, warn(m){this.show(m,'warn')}
};

// ===== Modal =====
const Modal = {
    show(opts) {
        document.getElementById('modal-title').textContent=opts.title||'';
        document.getElementById('modal-body').innerHTML=opts.body||'';
        const acts=document.getElementById('modal-actions');
        acts.innerHTML='';
        (opts.actions||[]).forEach(a=>{
            const b=document.createElement('button');
            b.className=`btn ${a.cls||'btn-secondary'}`; b.textContent=a.text;
            b.onclick=()=>{this.hide(); if(a.fn) a.fn()};
            acts.appendChild(b);
        });
        document.getElementById('modal-overlay').style.display='flex';
    },
    hide() { document.getElementById('modal-overlay').style.display='none' },
    confirm(title,msg,onOk) {
        this.show({title,body:`<p>${msg}</p>`,actions:[{text:'取消',cls:'btn-secondary'},{text:'确认',cls:'btn-primary',fn:onOk}]});
    },
    alert(title,msg) {
        this.show({title,body:`<p>${msg}</p>`,actions:[{text:'确定',cls:'btn-primary'}]});
    }
};

// ===== State =====
const State = {
    conn: { type:null, connected:false, name:'', id:'' },
    device: { voltage:0, current:0, temperature:0, gait:'trot', height:80, motionMode:'stand', isMoving:false },
    params: Storage.get('params',{sensitivity:50,deadZone:5,maxSpeed:100}),
    calibration: Storage.get('calibration',{offsets:Array(12).fill(0),calibrated:false}),
    guide: Storage.get('guide',{step:0}), // 0=未开始,1=连接,2=校准,3=遥控,4=完成
    history: Storage.get('history',[]),
    settings: Storage.get('settings',{darkMode:false,showLog:true}),
    setConn(t,c,n='',i='') { this.conn={type:t,connected:c,name:n,id:i} },
    clearConn() { this.conn={type:null,connected:false,name:'',id:''} },
    save() { Storage.set('params',this.params); Storage.set('calibration',this.calibration); Storage.set('guide',this.guide); Storage.set('history',this.history); Storage.set('settings',this.settings) }
};

// ===== WebSocket Manager =====
let ws = null;
let wsIntentionalClose = false;
function wsConnect(url) {
    return new Promise((resolve,reject)=>{
        if(ws) { wsIntentionalClose=true; ws.close(); }
        wsIntentionalClose = false;
        try {
            ws = new WebSocket(url);
            ws.onopen = ()=>{ State.setConn('wifi',true,'WiFi设备',url); App.onConnected(); resolve() };
            ws.onmessage = e=>{ try{const d=JSON.parse(e.data); App.onMessage(d)}catch(er){} };
            ws.onclose = ()=>{
                if(!wsIntentionalClose && State.conn.connected){ State.clearConn(); App.onDisconnected() }
                wsIntentionalClose = false;
            };
            ws.onerror = ()=>reject(new Error('连接失败'));
        } catch(e) { reject(e) }
    });
}
function wsSend(data) { if(ws&&ws.readyState===1) { if(data instanceof Uint8Array) ws.send(data.buffer); else ws.send(JSON.stringify(data)) } }

// ===== BLE Manager =====
const BLE = {
    device: null, server: null, writeChar: null,
    SERVICE_UUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
    WRITE_UUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
    isSupported() { return 'bluetooth' in navigator },
    async scan() {
        if(!this.isSupported()) throw new Error('浏览器不支持蓝牙');
        const dev = await navigator.bluetooth.requestDevice({
            filters:[{namePrefix:'Robot'},{namePrefix:'Dog'},{namePrefix:'BLE'}],
            optionalServices:[this.SERVICE_UUID]
        });
        this.device = dev;
        return dev;
    },
    async connect(dev) {
        dev = dev || this.device;
        if(!dev) throw new Error('未选择设备');
        dev.addEventListener('gattserverdisconnected', ()=>{ if(State.conn.connected){State.clearConn();App.onDisconnected()} });
        this.server = await dev.gatt.connect();
        const svc = await this.server.getPrimaryService(this.SERVICE_UUID);
        this.writeChar = await svc.getCharacteristic(this.WRITE_UUID);
        // 尝试启用通知
        try {
            const notifyChar = await svc.getCharacteristic(this.WRITE_UUID);
            if(notifyChar.properties.notify) {
                await notifyChar.startNotifications();
                notifyChar.addEventListener('characteristicvaluechanged', e=>{
                    const data = new Uint8Array(e.target.value.buffer);
                    App.onMessage({binary:data});
                });
            }
        } catch(e) {}
        this.device = dev;
        State.setConn('ble',true,dev.name||'BLE设备',dev.id);
        App.onConnected();
        return dev;
    },
    disconnect() {
        if(this.device&&this.device.gatt.connected) this.device.gatt.disconnect();
        this.device=this.server=this.writeChar=null;
    },
    async send(data) {
        if(!this.writeChar) return;
        try {
            let buf = data instanceof Uint8Array ? data.buffer : new Uint8Array(data).buffer;
            await this.writeChar.writeValue(buf);
        } catch(e) { console.error('BLE send error:',e) }
    }
};

// ===== Joystick =====
class Joystick {
    constructor(id, opts={}) {
        this.el = document.getElementById(id);
        this.handle = this.el.querySelector('.joystick-handle');
        if(!this.el) return;
        this.deadZone = opts.deadZone||5;
        this.sensitivity = opts.sensitivity||50;
        this.onMove = opts.onMove||(()=>{});
        this.onEnd = opts.onEnd||(()=>{});
        this.dragging=false; this.maxR=55;
        this.el.addEventListener('touchstart',e=>this.start(e),{passive:false});
        this.el.addEventListener('touchmove',e=>this.move(e),{passive:false});
        this.el.addEventListener('touchend',()=>this.end());
        this.el.addEventListener('mousedown',e=>{this.start(e);const mm=e2=>this.move(e2);const mu=()=>{this.end();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu)};document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu)});
    }
    start(e) { e.preventDefault(); this.dragging=true; this.handle.classList.add('active'); const r=this.el.getBoundingClientRect(); this.cx=r.width/2; this.cy=r.height/2; this.maxR=Math.min(this.cx,this.cy)-15; if(e.touches) this.proc(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); else this.proc(e.clientX-r.left,e.clientY-r.top) }
    move(e) { if(!this.dragging) return; e.preventDefault(); const r=this.el.getBoundingClientRect(); if(e.touches) this.proc(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); else this.proc(e.clientX-r.left,e.clientY-r.top) }
    end() { if(!this.dragging) return; this.dragging=false; this.handle.classList.remove('active'); this.handle.style.transform='translate(-50%,-50%)'; this.onEnd() }
    proc(x,y) {
        let dx=x-this.cx, dy=y-this.cy;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d>this.maxR){dx=dx/d*this.maxR;dy=dy/d*this.maxR}
        this.handle.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
        let vx=Math.round(dx/this.maxR*100), vy=Math.round(dy/this.maxR*100);
        if(Math.abs(vx)<this.deadZone) vx=0;
        if(Math.abs(vy)<this.deadZone) vy=0;
        const s=0.5+this.sensitivity/100;
        this.onMove(Math.max(-100,Math.min(100,Math.round(vx*s))),Math.max(-100,Math.min(100,Math.round(vy*s))));
    }
    reset() { this.handle.style.transform='translate(-50%,-50%)'; this.onEnd() }
}

// ===== App =====
const App = {
    currentTab: 'home',
    joysticks: null,

    init() {
        // 应用设置
        if(State.settings.darkMode) document.body.classList.add('dark-mode');

        // 渲染初始状态
        Home.render();
        Devices.render();
        Profile.render();

        // 更新连接状态
        this.updateConnectionUI();
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
        document.getElementById(`page-${tab}`).classList.add('active');
        document.querySelectorAll('.tab-item').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
    },

    // 发送命令
    send(frame) {
        if(!State.conn.connected) { Toast.warn('请先连接设备'); return }
        if(State.conn.type==='wifi') wsSend(frame);
        else BLE.send(frame);
    },

    // 连接成功回调
    onConnected() {
        Toast.success('连接成功');
        // 添加到历史（去重：同一设备只保留最新记录）
        State.history = State.history.filter(h => h.id !== State.conn.id);
        State.history.unshift({name:State.conn.name,id:State.conn.id,type:State.conn.type,time:Date.now()});
        if(State.history.length>20) State.history.length=20;
        State.save();
        this.updateConnectionUI();
        // 更新引导步骤
        if(State.guide.step < 1) { State.guide.step=1; State.save() }
        Home.renderGuide();
    },

    // 断开连接回调
    onDisconnected() {
        Toast.warn('设备已断开');
        this.updateConnectionUI();
    },

    // 断开连接
    disconnect() {
        if(State.conn.type==='ble') BLE.disconnect();
        else if(ws) { wsIntentionalClose=true; ws.close(); }
        State.clearConn();
        this.updateConnectionUI();
        Toast.info('已断开连接');
    },

    // 消息处理
    onMessage(data) {
        if(data.type==='status') {
            State.device.voltage=parseFloat(data.voltage)||0;
            State.device.temperature=parseInt(data.temperature)||0;
            State.device.gait=data.gait||'trot';
            State.device.height=parseInt(data.height)||80;
            State.device.motionMode=data.motionMode||'stand';
            Home.updateDeviceStats();
        }
    },

    // 更新连接状态UI
    updateConnectionUI() {
        Home.render();
        Devices.render();
        Profile.render();
    },

    // 打开/关闭遥控面板
    openControlPanel() {
        if(!State.conn.connected) { Toast.warn('请先连接设备'); return }
        const panel = document.getElementById('control-panel');
        panel.style.display='flex';
        document.getElementById('panel-comm-type').textContent = State.conn.type==='ble'?'BLE':'WiFi';
        // 初始化摇杆
        this.joysticks = {
            left: new Joystick('joystick-left', {
                ...State.params,
                onMove:(x,y)=>{
                    document.getElementById('left-x').textContent=x;
                    document.getElementById('left-y').textContent=y;
                    Control.sendMove(-y,null,x);
                    Home.onControlMove();
                },
                onEnd:()=>{
                    document.getElementById('left-x').textContent=0;
                    document.getElementById('left-y').textContent=0;
                    Control.sendMove(0,null,0);
                }
            }),
            right: new Joystick('joystick-right', {
                ...State.params,
                onMove:(x,y)=>{
                    document.getElementById('right-x').textContent=x;
                    Control.sendMove(null,x,null);
                    Home.onControlMove();
                },
                onEnd:()=>{
                    document.getElementById('right-x').textContent=0;
                    Control.sendMove(null,0,null);
                }
            })
        };
    },
    closeControlPanel() {
        document.getElementById('control-panel').style.display='none';
        if(this.joysticks) { this.joysticks.left.reset(); this.joysticks.right.reset() }
    },

    // 打开/关闭校准面板
    openCalibrationPanel() {
        if(!State.conn.connected) { Toast.warn('请先连接设备'); App.switchTab('devices'); return }
        document.getElementById('calibration-panel').style.display='flex';
        Calibration.render();
    },
    closeCalibrationPanel() {
        document.getElementById('calibration-panel').style.display='none';
    }
};

// ===== 首页 =====
const Home = {
    render() {
        const card = document.getElementById('home-device-card');
        const nameEl = document.getElementById('home-device-name');
        const descEl = document.getElementById('home-device-desc');
        const connBtn = document.getElementById('home-connect-btn');
        const statsEl = document.getElementById('home-device-stats');
        const detailEl = document.getElementById('home-device-detail');

        if(State.conn.connected) {
            card.classList.remove('disconnected');
            nameEl.textContent = State.conn.name;
            descEl.textContent = State.conn.type==='ble'?'蓝牙已连接':'WiFi已连接';
            connBtn.innerHTML = '<div class="connect-icon" style="color:#fff">✓</div>';
            connBtn.onclick = ()=>App.disconnect();
            statsEl.classList.remove('hidden');
            detailEl.style.display='';
            this.updateDeviceStats();
        } else {
            card.classList.add('disconnected');
            nameEl.textContent = '未连接设备';
            descEl.textContent = '点击连接你的机器狗';
            connBtn.innerHTML = '<div class="connect-icon">+</div>';
            connBtn.onclick = ()=>App.switchTab('devices');
            statsEl.classList.add('hidden');
            detailEl.style.display='none';
        }
        this.renderGuide();
    },

    updateDeviceStats() {
        document.getElementById('home-voltage').textContent = State.device.voltage?State.device.voltage.toFixed(1)+'V':'--';
        document.getElementById('home-temp').textContent = State.device.temperature?State.device.temperature+'°C':'--';
        document.getElementById('home-conn-type').textContent = State.conn.type==='ble'?'BLE':'WiFi';
        document.getElementById('home-battery').textContent = State.device.voltage>11?'正常':'低';
        document.getElementById('home-gait').textContent = {trot:'小跑',walk:'行走',crawl:'爬行',stand:'站立',sit:'坐下'}[State.device.gait]||State.device.gait;
        document.getElementById('home-height').textContent = State.device.height+'mm';
        document.getElementById('home-motion').textContent = State.device.isMoving?'运动中':'静止';
        document.getElementById('home-calib').textContent = State.calibration.calibrated?'已校准':'未校准';
    },

    renderGuide() {
        const step = State.guide.step;
        for(let i=1;i<=4;i++) {
            const circle = document.getElementById(`guide-step-${i}`);
            const status = document.getElementById(`guide-status-${i}`);
            const line = document.getElementById(`guide-line-${i}`);
            if(i<=step) {
                circle.className='step-circle done'; circle.textContent='✓';
                status.className='step-status done'; status.textContent='已完成';
                if(line) line.className='guide-line done';
            } else if(i===step+1) {
                circle.className='step-circle current'; circle.textContent=i;
                status.className='step-status current'; status.textContent='进行中';
            } else {
                circle.className='step-circle'; circle.textContent=i;
                status.className='step-status'; status.textContent='未完成';
            }
        }
        const btn = document.getElementById('guide-action-btn');
        if(step>=4) { btn.textContent='重新测试'; }
        else if(step===0) { btn.textContent='开始引导测试'; }
        else { btn.textContent='继续测试'; }
    },

    goConnect() { App.switchTab('devices') },
    openControl() { App.openControlPanel() },
    openCalibration() { App.openCalibrationPanel() },
    openGuide() { this.startGuide() },
    openSettings() { App.switchTab('profile') },

    startGuide() {
        const step = State.guide.step;
        if(step>=4) { State.guide.step=0; State.save(); this.renderGuide(); return }
        if(step===0) {
            // 需要连接设备
            App.switchTab('devices');
            Toast.info('请先连接设备');
        } else if(step===1) {
            // 需要校准 - 先展示协议标准
            this.showProtocolBeforeCalibrate();
        } else if(step===2) {
            // 需要遥控测试
            App.openControlPanel();
            Toast.info('请测试遥控功能：推动摇杆使机器狗运动，然后点击"测试完成"');
            this.startControlTest();
        } else if(step===3) {
            State.guide.step=4; State.save(); this.renderGuide();
            Toast.success('引导测试完成!');
        }
    },

    showProtocolBeforeCalibrate() {
        Modal.show({
            title: '接入协议标准（校准前必读）',
            body: `
<div style="font-size:12px;line-height:1.8;max-height:50vh;overflow-y:auto">
<p style="font-weight:bold;color:#1a1a2e">帧格式 (10字节)</p>
<p style="color:#666">AA 55 CMD SEQ D0 D1 D2 D3 D4 CHK</p>
<p style="font-weight:bold;color:#1a1a2e;margin-top:8px">核心命令</p>
<p style="color:#e74c3c">0x01 移动 | 0x02 停止 | 0x10 零位校准 | 0x11 精校准 | 0x12 批量偏移</p>
<p style="font-weight:bold;color:#1a1a2e;margin-top:8px">舵机编号</p>
<p style="color:#666">motorId = 腿×DOF + 关节</p>
<p style="font-weight:bold;color:#1a1a2e;margin-top:8px">数值编码</p>
<p style="color:#666">速度: -100~100→0x00~0xFF | 偏移: -90°~90°→0x00~0xFF</p>
</div>`,
            actions: [{text:'已阅，开始校准',cls:'btn-primary',fn:()=>{ App.openCalibrationPanel(); }}]
        });
    },

    startControlTest() {
        // 遥控测试：打开遥控面板后，监听摇杆活动
        this._controlTestActive = true;
        this._controlTestMoves = 0;
    },

    onControlMove() {
        if(!this._controlTestActive) return;
        this._controlTestMoves = (this._controlTestMoves||0) + 1;
        // 摇杆活动超过3次即认为测试通过
        if(this._controlTestMoves >= 3) {
            this._controlTestActive = false;
            if(State.guide.step === 2) {
                State.guide.step = 3;
                State.save();
                Toast.success('遥控测试通过！');
                // 延迟关闭面板并刷新引导
                setTimeout(()=>{
                    App.closeControlPanel();
                    this.renderGuide();
                    Modal.alert('遥控测试完成','<p>遥控功能正常！</p><p style="margin-top:8px;color:#888">你可以继续使用遥控，或返回首页查看引导状态。</p>');
                }, 500);
            }
        }
    }
};

// ===== 设备页 =====
const Devices = {
    wifiMode: 'lan',

    render() {
        // BLE 兼容性检测
        this.checkBLESupport();
        // 已连接设备
        const sec = document.getElementById('connected-device-section');
        if(State.conn.connected) {
            sec.style.display='';
            document.getElementById('connected-device-name').textContent=State.conn.name;
            document.getElementById('connected-device-id').textContent=State.conn.id;
        } else {
            sec.style.display='none';
        }
        // 历史设备
        this.renderHistory();
        // WiFi历史
        this.renderWifiHistory();
    },

    renderHistory() {
        const list = document.getElementById('history-device-list');
        if(State.history.length===0) { list.innerHTML='<div class="empty-hint">暂无历史设备，请添加设备</div>'; return }
        list.innerHTML = State.history.slice(0,10).map((d,i)=>`
            <div class="device-item" onclick="Devices.connectHistory(${i})">
                <span class="icon">${d.type==='ble'?'📡':'📶'}</span>
                <div class="info"><span class="name">${d.name}</span><span class="id">${d.id.substring(0,20)}</span></div>
                <span style="font-size:11px;color:#999">${new Date(d.time).toLocaleDateString()}</span>
            </div>
        `).join('');
    },

    renderWifiHistory() {
        const tags = document.getElementById('wifi-history-tags');
        const hist = Storage.get('wifi_history',[]);
        if(hist.length===0) { tags.innerHTML=''; return }
        tags.innerHTML = hist.map(h=>`<span class="history-tag" onclick="Devices.useWifiHistory('${h}')">${h}</span>`).join('');
    },

    checkBLESupport() {
        const supported = BLE.isSupported();
        const hint = document.getElementById('ble-unsupported-hint');
        const desc = document.getElementById('ble-method-desc');
        const card = document.getElementById('ble-method-card');
        if(hint) {
            hint.style.display = supported ? 'none' : '';
        }
        if(desc) {
            desc.textContent = supported ? '近距离低延迟控制' : '需要Chrome/Edge桌面版';
        }
        if(card && !supported) {
            card.style.opacity = '0.6';
        }
    },

    connectHistory(i) {
        const d = State.history[i];
        if(!d) return;
        if(State.conn.connected) { Toast.info('当前已连接设备，请先断开'); return }
        if(d.type==='ble') {
            Toast.warn('蓝牙设备需重新扫描连接');
            this.startBLEScan();
        } else {
            let url = d.id;
            if(!url.startsWith('ws://') && !url.startsWith('wss://')) {
                url = 'ws://' + url;
            }
            Toast.info('正在连接...');
            wsConnect(url).catch(e=>Toast.error('连接失败: '+(e.message||'无法连接')));
        }
    },

    // BLE扫描
    async startBLEScan() {
        if(!BLE.isSupported()) {
            Modal.alert('蓝牙不可用',
                '<p>当前浏览器不支持 Web Bluetooth API</p>' +
                '<p style="margin-top:8px;color:#888">蓝牙控制请使用微信小程序，或使用 Chrome/Edge 桌面浏览器访问本页面。</p>' +
                '<p style="margin-top:8px">💡 <strong>推荐：</strong>使用WiFi连接，全平台通用，覆盖范围更广。</p>'
            );
            return;
        }
        const sec = document.getElementById('ble-scan-section');
        sec.style.display='';
        document.getElementById('scan-indicator').style.display='inline-flex';
        document.getElementById('ble-device-list').innerHTML='';

        try {
            const dev = await BLE.scan();
            // 用户选择了设备，直接连接
            document.getElementById('ble-device-list').innerHTML=`
                <div class="device-item" onclick="Devices.connectBLE()">
                    <span class="icon">📡</span>
                    <div class="info"><span class="name">${dev.name||'未知设备'}</span><span class="id">${dev.id}</span></div>
                </div>`;
            await this.connectBLE(dev);
        } catch(e) {
            if(e.name!=='NotFoundError') Toast.error('扫描失败');
        } finally {
            document.getElementById('scan-indicator').style.display='none';
        }
    },

    async connectBLE(dev) {
        try {
            await BLE.connect(dev);
        } catch(e) {
            Toast.error('连接失败: '+e.message);
        }
    },

    stopBLEScan() {
        document.getElementById('ble-scan-section').style.display='none';
    },

    // WiFi
    showWiFiPanel() { document.getElementById('wifi-panel').style.display='' },
    hideWiFiPanel() { document.getElementById('wifi-panel').style.display='none' },
    switchWiFiMode(mode) {
        this.wifiMode=mode;
        document.querySelectorAll('#wifi-panel .sub-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===mode));
        document.getElementById('wifi-lan-form').style.display=mode==='lan'?'':'none';
        document.getElementById('wifi-remote-form').style.display=mode==='remote'?'':'none';
    },

    async connectWiFi() {
        const ip=document.getElementById('wifi-ip').value.trim();
        const port=document.getElementById('wifi-port').value.trim()||'81';
        if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)){Toast.error('请输入有效IP');return}
        const parts=ip.split('.'); if(!parts.every(p=>parseInt(p)>=0&&parseInt(p)<=255)){Toast.error('IP格式错误');return}
        Toast.info('正在连接...');
        try {
            await wsConnect(`ws://${ip}:${port}`);
            const hist=Storage.get('wifi_history',[]).filter(h=>h!==`${ip}:${port}`);
            hist.unshift(`${ip}:${port}`); Storage.set('wifi_history',hist.slice(0,5));
            this.renderWifiHistory();
        } catch(e) { Toast.error('连接失败') }
    },

    async connectRemote() {
        const url=document.getElementById('wifi-server').value.trim();
        const id=document.getElementById('wifi-device-id').value.trim();
        if(!url){Toast.error('请输入服务器地址');return}
        Toast.info('正在连接...');
        try {
            await wsConnect(url);
            if(id) wsSend({type:'register',deviceId:id,role:'controller'});
        } catch(e) { Toast.error('连接失败') }
    },

    useWifiHistory(addr) {
        const [ip,port]=addr.split(':');
        document.getElementById('wifi-ip').value=ip;
        document.getElementById('wifi-port').value=port||'81';
    }
};

// ===== 遥控 =====
const Control = {
    lastMove: {vx:0,vy:0,vr:0},
    lastSend: 0,
    sendInt: 50,
    gait: 0,
    height: 80,
    posture: {pitch:0,roll:0,yaw:0},
    selfBal: false,

    sendMove(vx,vy,vr) {
        if(vx!==null) this.lastMove.vx=vx;
        if(vy!==null) this.lastMove.vy=vy;
        if(vr!==null) this.lastMove.vr=vr;
        const now=Date.now();
        if(now-this.lastSend<this.sendInt) return;
        this.lastSend=now;
        const m=State.params.maxSpeed/100;
        App.send(Protocol.moveCmd(this.lastMove.vx*m,this.lastMove.vy*m,this.lastMove.vr*m));
    },

    setGait(g) {
        this.gait=g;
        document.querySelectorAll('.gait-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.gait)===g));
        App.send(Protocol.gaitCmd(g));
    },

    setHeight(v) {
        this.height=parseInt(v);
        document.getElementById('ctrl-height-val').textContent=v;
        document.getElementById('ctrl-height').value=v;
        App.send(Protocol.heightCmd(this.height));
    },

    doAction(a) { App.send(Protocol.actionCmd(a)) },

    emergencyStop() {
        App.send(Protocol.stopCmd());
        if(App.joysticks) { App.joysticks.left.reset(); App.joysticks.right.reset() }
        this.lastMove={vx:0,vy:0,vr:0};
        Toast.warn('紧急停止!');
    },

    toggleAdvanced() {
        const p=document.getElementById('advanced-panel');
        const a=document.getElementById('advanced-arrow');
        if(p.style.display==='none'){p.style.display='';a.classList.add('up')}else{p.style.display='none';a.classList.remove('up')}
    },

    toggleSelfBalance(on) { this.selfBal=on; App.send(Protocol.selfBalCmd(on)) },

    setPosture(axis,v) {
        v=parseInt(v); this.posture[axis]=v;
        document.getElementById(`${axis}-val`).textContent=v+'°';
        App.send(Protocol.postureCmd(this.posture.pitch,this.posture.roll,this.posture.yaw));
    }
};

// ===== 校准 =====
const Calibration = {
    mode: 'coarse',
    step: 0,
    leg: 0,
    joint: 0,
    stepSize: 1,
    offsets: Storage.get('calibration',{offsets:Array(12).fill(0)}).offsets,

    steps: [
        {icon:'📋',title:'准备工作',desc:'确保机器狗已断电，将机器狗放置在水平桌面上'},
        {icon:'🔧',title:'拆卸结构件',desc:'按照说明书拆卸所有腿部结构件，使舵机处于自由状态'},
        {icon:'⚡',title:'上电连接',desc:'给机器狗上电，通过蓝牙或WiFi连接设备'},
        {icon:'📡',title:'发送0位指令',desc:'点击下方按钮，向所有舵机发送0位校准指令',action:true},
        {icon:'👀',title:'确认舵机状态',desc:'观察所有舵机是否转到0位位置（垂直向下）'},
        {icon:'✅',title:'完成校准',desc:'确认无误后，校准完成。可以断电重新安装结构件'}
    ],
    legNames: ['左前腿','右前腿','左后腿','右后腿'],
    jointNames: ['髋关节','膝关节','踝关节'],

    render() {
        this.renderStep();
        this.renderOffsetOverview();
        this.updateJointInfo();
    },

    switchMode(m) {
        this.mode=m;
        document.querySelectorAll('#calibration-panel .sub-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===m));
        document.getElementById('coarse-panel').style.display=m==='coarse'?'':'none';
        document.getElementById('fine-panel').style.display=m==='fine'?'':'none';
    },

    renderStep() {
        const s=this.steps[this.step];
        document.getElementById('coarse-progress').style.width=`${((this.step+1)/6)*100}%`;
        document.getElementById('coarse-step-num').textContent=this.step+1;
        document.getElementById('coarse-icon').textContent=s.icon;
        document.getElementById('coarse-title').textContent=s.title;
        document.getElementById('coarse-desc').textContent=s.desc;
        document.getElementById('coarse-execute').style.display=s.action?'':'none';
        document.getElementById('coarse-result').style.display='none';
        document.getElementById('coarse-prev').disabled=this.step===0;
        document.getElementById('coarse-next').textContent=this.step===5?'完成':'下一步';
    },

    prevStep() { if(this.step>0){this.step--;this.renderStep()} },
    nextStep() { if(this.step<5){this.step++;this.renderStep()} else { Toast.success('校准完成'); App.closeCalibrationPanel(); if(State.guide.step<2){State.guide.step=2;State.save();Home.renderGuide()} } },

    async executeZeroCalibrate() {
        const r=document.getElementById('coarse-result'); r.style.display='';
        document.getElementById('coarse-success').style.display='none';
        document.getElementById('coarse-fail').style.display='none';
        try {
            App.send(Protocol.zeroCalCmd());
            document.getElementById('coarse-success').style.display='';
            Toast.success('校准指令已发送');
        } catch(e) {
            document.getElementById('coarse-fail').style.display='';
        }
    },

    selectLeg(i) {
        this.leg=i; this.joint=0;
        document.querySelectorAll('#leg-selector .sel-btn').forEach((b,idx)=>b.classList.toggle('active',idx===i));
        document.querySelectorAll('#joint-selector .sel-btn').forEach((b,idx)=>b.classList.toggle('active',idx===0));
        this.updateJointInfo(); this.renderOffsetOverview();
    },

    selectJoint(i) {
        this.joint=i;
        document.querySelectorAll('#joint-selector .sel-btn').forEach((b,idx)=>b.classList.toggle('active',idx===i));
        this.updateJointInfo(); this.renderOffsetOverview();
    },

    updateJointInfo() {
        const mi=this.leg*3+this.joint;
        document.getElementById('fine-joint-name').textContent=`${this.legNames[this.leg]} - ${this.jointNames[this.joint]}`;
        document.getElementById('fine-offset-val').textContent=this.offsets[mi];
    },

    setStepSize(s) {
        this.stepSize=s;
        document.querySelectorAll('.step-btn').forEach(b=>b.classList.toggle('active',b.textContent===s+'°'));
        document.getElementById('step-num').textContent=s;
        document.getElementById('step-num-2').textContent=s;
    },

    increaseOffset() { const i=this.leg*3+this.joint; this.offsets[i]=Math.min(90,this.offsets[i]+this.stepSize); this.updateJointInfo(); this.renderOffsetOverview(); this.sendFineCal(i) },
    decreaseOffset() { const i=this.leg*3+this.joint; this.offsets[i]=Math.max(-90,this.offsets[i]-this.stepSize); this.updateJointInfo(); this.renderOffsetOverview(); this.sendFineCal(i) },
    resetCurrentJoint() { const i=this.leg*3+this.joint; this.offsets[i]=0; this.updateJointInfo(); this.renderOffsetOverview(); this.sendFineCal(i) },

    sendFineCal(i) { App.send(Protocol.fineCalCmd(i,this.offsets[i])) },

    renderOffsetOverview() {
        const el=document.getElementById('offset-overview');
        el.innerHTML = ['左前','右前','左后','右后'].map((leg,li)=>
            `<div class="offset-row"><span class="leg-name">${leg}</span><div class="offset-cells">${
                ['髋','膝','踝'].map((j,ji)=>{
                    const mi=li*3+ji;
                    return `<div class="offset-cell ${mi===this.leg*3+this.joint?'active':''}"><span class="jname">${j}</span>${this.offsets[mi]}°</div>`;
                }).join('')
            }</div></div>`
        ).join('');
    },

    resetAll() { Modal.confirm('重置','确定重置所有偏移?',()=>{ this.offsets=Array(12).fill(0); this.updateJointInfo(); this.renderOffsetOverview(); Toast.success('已重置') }) },
    saveCalibration() { State.calibration={offsets:this.offsets,calibrated:true}; State.save(); Toast.success('校准已保存') }
};

// ===== 我的 =====
const Profile = {
    render() {
        document.getElementById('profile-device-count').textContent=`已连接 ${State.history.length} 台设备`;
        this.renderHistory();
        this.loadParams();
        document.getElementById('darkmode-switch').checked=State.settings.darkMode;
        document.getElementById('log-switch').checked=State.settings.showLog;
    },

    renderHistory() {
        const list=document.getElementById('control-history-list');
        if(State.history.length===0){list.innerHTML='<div class="empty-hint">暂无控制记录</div>';return}
        list.innerHTML = State.history.slice(0,8).map(d=>`
            <div class="history-item">
                <span class="h-icon">${d.type==='ble'?'📡':'📶'}</span>
                <div class="h-info"><span class="h-name">${d.name}</span><span class="h-time">${new Date(d.time).toLocaleString()}</span></div>
            </div>
        `).join('');
    },

    loadParams() {
        const p=State.params;
        document.getElementById('param-sensitivity').value=p.sensitivity;
        document.getElementById('param-sensitivity-val').textContent=p.sensitivity;
        document.getElementById('param-deadzone').value=p.deadZone;
        document.getElementById('param-deadZone-val').textContent=p.deadZone;
        document.getElementById('param-maxspeed').value=p.maxSpeed;
        document.getElementById('param-maxSpeed-val').textContent=p.maxSpeed;
    },

    updateParam(key,val) {
        val=parseInt(val); State.params[key]=val; State.save();
        const el=document.getElementById(`param-${key}-val`); if(el) el.textContent=val;
    },

    toggleDarkMode(on) { State.settings.darkMode=on; State.save(); document.body.classList.toggle('dark-mode',on) },
    toggleLog(on) { State.settings.showLog=on; State.save() },

    showCalibrationData() {
        const json=JSON.stringify(State.calibration,null,2);
        Modal.alert('校准数据',`<pre style="white-space:pre-wrap;font-size:12px;max-height:250px;overflow-y:auto">${json}</pre>`);
    },

    exportAllData() {
        const data={calibration:State.calibration,params:State.params,history:State.history,guide:State.guide,robotConfig:Storage.get('robotConfig',{})};
        const json=JSON.stringify(data,null,2);
        Modal.show({
            title:'导出数据',
            body:`<p>将导出校准数据、遥控参数、控制记录等共 ${json.length} 字符</p><pre style="max-height:200px;overflow-y:auto;font-size:11px;background:#f5f6fa;padding:8px;border-radius:6px;margin-top:8px">${json.substring(0,500)}${json.length>500?'\n...':''}</pre>`,
            actions:[{text:'复制到剪贴板',cls:'btn-primary',fn:()=>{navigator.clipboard.writeText(json).then(()=>Toast.success('已复制')).catch(()=>Toast.error('复制失败'))}},{text:'取消',cls:'btn-secondary'}]
        });
    },

    clearAllData() {
        Modal.confirm('清除数据','确定清除所有本地数据?',()=>{
            Storage.clear();
            State.params={sensitivity:50,deadZone:5,maxSpeed:100};
            State.calibration={offsets:Array(12).fill(0),calibrated:false};
            State.guide={step:0}; State.history=[]; State.settings={darkMode:false,showLog:true};
            this.render(); Home.render();
            Toast.success('已清除');
        });
    },

    checkUpdate() { Toast.info('当前已是最新版本') },
    feedback() { Modal.alert('问题反馈','<p>反馈渠道:</p><p style="margin-top:6px"><a href="https://gitee.com/pickyking/robotcontrol" target="_blank" style="color:var(--primary)">Gitee Issues</a></p>') },
    about() { Modal.alert('关于','<p>机器狗遥控 v1.0.0</p><p style="margin-top:6px;color:#888">基于BLE/WiFi的四足机器人控制系统</p>') },

    showProtocol() {
        Modal.alert('协议标准 v1.0', `
<div style="font-size:12px;line-height:1.8;max-height:60vh;overflow-y:auto">
<p style="font-weight:bold;font-size:13px;color:#1a1a2e">帧格式 (10字节)</p>
<table style="width:100%;border-collapse:collapse;margin:6px 0">
<tr style="background:#f0f4f8"><th style="padding:4px;border:1px solid #ddd">偏移</th><th style="padding:4px;border:1px solid #ddd">字段</th><th style="padding:4px;border:1px solid #ddd">说明</th></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;text-align:center">0-1</td><td style="padding:3px 4px;border:1px solid #ddd">帧头</td><td style="padding:3px 4px;border:1px solid #ddd">0xAA 0x55</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;text-align:center">2</td><td style="padding:3px 4px;border:1px solid #ddd">CMD</td><td style="padding:3px 4px;border:1px solid #ddd">命令码</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;text-align:center">3</td><td style="padding:3px 4px;border:1px solid #ddd">SEQ</td><td style="padding:3px 4px;border:1px solid #ddd">序列号0~255</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;text-align:center">4-8</td><td style="padding:3px 4px;border:1px solid #ddd">数据区</td><td style="padding:3px 4px;border:1px solid #ddd">5字节</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;text-align:center">9</td><td style="padding:3px 4px;border:1px solid #ddd">校验和</td><td style="padding:3px 4px;border:1px solid #ddd">字节2~8累加&0xFF</td></tr>
</table>

<p style="font-weight:bold;font-size:13px;color:#1a1a2e;margin-top:12px">命令表</p>
<table style="width:100%;border-collapse:collapse;margin:6px 0">
<tr style="background:#f0f4f8"><th style="padding:4px;border:1px solid #ddd">CMD</th><th style="padding:4px;border:1px solid #ddd">名称</th><th style="padding:4px;border:1px solid #ddd">数据格式</th></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#4a90d9;font-family:monospace">0x01</td><td style="padding:3px 4px;border:1px solid #ddd">移动控制</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[vx,vy,vr,0,0]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#4a90d9;font-family:monospace">0x02</td><td style="padding:3px 4px;border:1px solid #ddd">紧急停止</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[FF,FF,FF,FF,FF]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#4a90d9;font-family:monospace">0x03</td><td style="padding:3px 4px;border:1px solid #ddd">步态切换</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[gaitType,0,0,0,0]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#4a90d9;font-family:monospace">0x04</td><td style="padding:3px 4px;border:1px solid #ddd">预设动作</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[actionType,0,0,0,0]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#e67e22;font-family:monospace">0x10</td><td style="padding:3px 4px;border:1px solid #ddd">0位校准</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[01,0,0,0,0]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#e67e22;font-family:monospace">0x11</td><td style="padding:3px 4px;border:1px solid #ddd">精校准</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[motorId,offByte,0,0,0]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#e67e22;font-family:monospace">0x12</td><td style="padding:3px 4px;border:1px solid #ddd">批量偏移</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[partIdx,off0-3]</td></tr>
<tr><td style="padding:3px 4px;border:1px solid #ddd;color:#27ae60;font-family:monospace">0x20</td><td style="padding:3px 4px;border:1px solid #ddd">状态上报</td><td style="padding:3px 4px;border:1px solid #ddd;font-family:monospace;font-size:11px">[volt,curr,temp,mode,err]</td></tr>
</table>

<p style="font-weight:bold;font-size:13px;color:#1a1a2e;margin-top:12px">舵机编号</p>
<p style="color:#666">motorId = 腿×3 + 关节(0髋/1膝/2踝)</p>
<p style="color:#666">0左前髋 1左前膝 2左前踝 | 3右前髋 4右前膝 5右前踝</p>
<p style="color:#666">6左后髋 7左后膝 8左后踝 | 9右后髋 10右后膝 11右后踝</p>

<p style="font-weight:bold;font-size:13px;color:#1a1a2e;margin-top:12px">数值编码</p>
<p style="color:#666">速度: -100~100 → 0x00~0xFF (0x80=静止)</p>
<p style="color:#666">偏移: -90°~90° → 0x00~0xFF (0x80=0°)</p>

<p style="font-weight:bold;font-size:13px;color:#1a1a2e;margin-top:12px">ESP32接入必须实现</p>
<p style="color:#e74c3c">✦ CMD 0x01 移动控制 ✦ CMD 0x02 紧急停止</p>
<p style="color:#e74c3c">✦ CMD 0x10 0位校准 ✦ CMD 0x11 精校准 ✦ CMD 0x12 批量偏移</p>
<p style="color:#666;margin-top:4px">BLE: Service=FFE0, Write/Notify=FFE1</p>
<p style="color:#666">WiFi: WebSocket 端口81</p>
</div>
        `);
    }
};

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => App.init());
