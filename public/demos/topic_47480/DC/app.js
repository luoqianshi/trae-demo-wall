(function() {
    const TYPE_CONFIG = {
        police: { number: '110', label: '公安报警', color: '#1890ff' },
        fire: { number: '119', label: '消防救援', color: '#ff7a45' },
        medical: { number: '120', label: '医疗急救', color: '#52c41a' }
    };

    const MAP_LOCATIONS = [
        { x: 25, y: 30, address: '北京市东城区天安门广场' },
        { x: 28, y: 35, address: '北京市东城区故宫博物院' },
        { x: 15, y: 20, address: '北京市海淀区颐和园' },
        { x: 30, y: 55, address: '北京市丰台区北京南站' },
        { x: 65, y: 45, address: '北京市朝阳区三里屯' },
        { x: 70, y: 50, address: '北京市朝阳区国贸CBD' },
        { x: 45, y: 40, address: '北京市东城区王府井' },
        { x: 55, y: 65, address: '北京市丰台区方庄' }
    ];

    let callHistory = [];
    let activeCall = null;
    let callTimer = null;
    let callSeconds = 0;
    let totalCalls = 0;
    let totalDuration = 0;

    document.addEventListener('DOMContentLoaded', function() {
        initViewSwitcher();
        initEmergencyButtons();
        initHangupButton();
        initDemoControls();
    });

    function initViewSwitcher() {
        const buttons = document.querySelectorAll('.view-btn');
        const sections = document.querySelectorAll('.view-section');

        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.dataset.view;
                
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(view + 'View').classList.add('active');
            });
        });
    }

    function initEmergencyButtons() {
        const buttons = document.querySelectorAll('.emergency-btn, .mini-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const number = this.dataset.number;
                startEmergencyCall(type, number);
            });
        });
    }

    function initHangupButton() {
        document.getElementById('hangupBtn').addEventListener('click', endCall);
    }

    function initDemoControls() {
        document.getElementById('simulateBtn').addEventListener('click', simulateCall);
        document.getElementById('resetBtn').addEventListener('click', resetDemo);
    }

    function simulateCall() {
        const type = document.getElementById('callTypeSelect').value;
        const config = TYPE_CONFIG[type];
        startEmergencyCall(type, config.number);
    }

    function startEmergencyCall(type, number) {
        if (activeCall) return;

        activeCall = {
            id: Date.now(),
            type: type,
            number: number,
            label: TYPE_CONFIG[type].label,
            color: TYPE_CONFIG[type].color,
            mapLocation: MAP_LOCATIONS[Math.floor(Math.random() * MAP_LOCATIONS.length)],
            accuracy: Math.floor(Math.random() * 30) + 15,
            caller: '138' + Math.floor(Math.random() * 9000 + 1000) + '88' + Math.floor(Math.random() * 90 + 10),
            startTime: new Date(),
            duration: 0,
            status: 'connecting'
        };

        showCallingScreen(type, number);
        startCallTimer();
        animateTransmission(type);
        updateSystemStatus('通话中', 'warning');

        document.getElementById('activeCalls').textContent = '1';
    }

    function showCallingScreen(type, number) {
        const config = TYPE_CONFIG[type];
        
        document.querySelector('.emergency-dialer').style.display = 'none';
        document.getElementById('callingScreen').style.display = 'flex';
        document.getElementById('callingNumber').textContent = '正在拨打 ' + number + '...';
        
        const callingIcon = document.querySelector('.calling-icon');
        callingIcon.style.background = 'linear-gradient(135deg, ' + config.color + ' 0%, ' + adjustColor(config.color, -40) + ' 100%)';
        
        document.querySelectorAll('.calling-waves span').forEach(s => {
            s.style.background = config.color + '40';
        });
    }

    function startCallTimer() {
        callSeconds = 0;
        updateCallTimer();
        callTimer = setInterval(() => {
            callSeconds++;
            updateCallTimer();
        }, 1000);
    }

    function updateCallTimer() {
        const mins = Math.floor(callSeconds / 60).toString().padStart(2, '0');
        const secs = (callSeconds % 60).toString().padStart(2, '0');
        document.getElementById('callingTimer').textContent = mins + ':' + secs;
    }

    function animateTransmission(type) {
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const stepLine1 = document.getElementById('stepLine1');
        const stepLine2 = document.getElementById('stepLine2');
        const detail = document.getElementById('transmissionDetail');

        const flowSteps = document.querySelectorAll('.flow-step');
        const flowArrows = document.querySelectorAll('.flow-arrow');
        const miniStatus = document.getElementById('miniStatus');

        detail.textContent = '正在获取位置信息...';
        step1.classList.add('active');
        flowSteps[0].classList.add('completed');
        flowSteps[1].classList.add('active');
        flowArrows[0].classList.add('active');

        updateMiniPhoneScreen('calling', type);

        setTimeout(() => {
            step1.classList.remove('active');
            step1.classList.add('completed');
            stepLine1.classList.add('completed');
            step2.classList.add('active');
            detail.textContent = '位置已获取，精度约' + activeCall.accuracy + '米，正在传输...';
            flowSteps[1].classList.remove('active');
            flowSteps[1].classList.add('completed');
            flowSteps[2].classList.add('active');
            flowArrows[0].classList.remove('active');
            flowArrows[1].classList.add('active');

            updateLocationInfo(activeCall.mapLocation.address, activeCall.accuracy);

        }, 1200);

        setTimeout(() => {
            step2.classList.remove('active');
            step2.classList.add('completed');
            stepLine2.classList.add('completed');
            step3.classList.add('active');
            detail.textContent = '位置数据传输中，即将送达指挥中心...';
            flowSteps[2].classList.remove('active');
            flowSteps[2].classList.add('completed');
            flowSteps[3].classList.add('active');
            flowArrows[1].classList.remove('active');
            flowArrows[2].classList.add('active');

            miniStatus.textContent = '收到位置数据...';
            miniStatus.classList.add('alert');

        }, 2800);

        setTimeout(() => {
            step3.classList.remove('active');
            step3.classList.add('completed');
            detail.textContent = '位置已成功送达指挥中心！耗时 ' + callSeconds + ' 秒';
            flowSteps[3].classList.remove('active');
            flowSteps[3].classList.add('completed');
            flowArrows[2].classList.remove('active');

            activeCall.status = 'arrived';
            activeCall.duration = callSeconds;
            totalDuration += callSeconds;
            totalCalls++;

            addCallToList(activeCall);
            showOnMap(activeCall);
            updateStats();
            showCallDetail(activeCall);

            miniStatus.textContent = '位置已送达 - ' + TYPE_CONFIG[type].label;
            miniStatus.classList.remove('alert');

            updateFlowTimer(callSeconds);
            updateSystemStatus('位置已送达', 'success');

        }, 4500);
    }

    function updateLocationInfo(address, accuracy) {
        const statusEl = document.querySelector('.location-status');
        const detailEl = document.querySelector('.location-detail');
        if (statusEl) statusEl.textContent = '定位成功';
        if (detailEl) detailEl.textContent = address + ' (精度' + accuracy + '米)';
    }

    function addCallToList(call) {
        const callList = document.getElementById('callList');
        const emptyState = callList.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = 'none';

        const timeStr = formatTime(call.startTime);

        const callItem = document.createElement('div');
        callItem.className = 'call-item active';
        callItem.dataset.id = call.id;
        callItem.innerHTML = `
            <div class="call-type-icon ${call.type}">${call.number}</div>
            <div class="call-item-info">
                <div class="call-item-number">${call.caller}</div>
                <div class="call-item-meta">
                    <span>${timeStr}</span>
                    <span>${call.mapLocation.address.substring(0, 8)}...</span>
                </div>
            </div>
            <div class="call-item-status">
                <span class="status-tag ${call.status === 'arrived' ? 'arrived' : 'pending'}">
                    ${call.status === 'arrived' ? '已送达' : '进行中'}
                </span>
            </div>
        `;

        callItem.addEventListener('click', () => {
            document.querySelectorAll('.call-item').forEach(i => i.classList.remove('active'));
            callItem.classList.add('active');
            showCallDetail(call);
            focusOnMap(call);
        });

        callList.insertBefore(callItem, callList.firstChild);
        callHistory.push(call);

        document.getElementById('callCount').textContent = callHistory.length + ' 条';
    }

    function showOnMap(call) {
        addMapMarker('mapMarkers', 'mapRipples', call, false);
        addMapMarker('miniMapMarkers', null, call, true);
    }

    function focusOnMap(call) {
    }

    function addMapMarker(markerGroupId, rippleGroupId, call, isMini) {
        const svg = isMini ? document.querySelector('#miniMap svg') : document.querySelector('#controlMap svg');
        if (!svg) return;

        const markerGroup = document.getElementById(markerGroupId);
        if (!markerGroup) return;

        const x = call.mapLocation.x;
        const y = call.mapLocation.y;
        const size = isMini ? 12 : 16;
        const svgWidth = isMini ? 400 : 800;
        const svgHeight = isMini ? 300 : 500;
        const cx = (x / 100) * svgWidth;
        const cy = (y / 100) * svgHeight;

        if (rippleGroupId) {
            const rippleGroup = document.getElementById(rippleGroupId);
            if (rippleGroup) {
                const rippleCount = 3;
                for (let i = 0; i < rippleCount; i++) {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', cx);
                    circle.setAttribute('cy', cy);
                    circle.setAttribute('r', size);
                    circle.setAttribute('fill', 'none');
                    circle.setAttribute('stroke', call.color);
                    circle.setAttribute('stroke-width', '2');
                    circle.setAttribute('opacity', '0.6');
                    circle.style.transformOrigin = cx + 'px ' + cy + 'px';
                    circle.style.animation = `rippleExpand 2s ease-out ${i * 0.6}s infinite`;
                    rippleGroup.appendChild(circle);
                }
            }
        }

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'map-marker-group');
        g.setAttribute('data-id', call.id);

        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', cx);
        glow.setAttribute('cy', cy);
        glow.setAttribute('r', size + 4);
        glow.setAttribute('fill', call.color);
        glow.setAttribute('opacity', '0.3');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', size);
        circle.setAttribute('fill', call.color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', isMini ? '2' : '3');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + (isMini ? 3 : 4));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', isMini ? '8' : '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = call.number;

        g.appendChild(glow);
        g.appendChild(circle);
        g.appendChild(text);
        markerGroup.appendChild(g);
    }

    function showCallDetail(call) {
        const panel = document.getElementById('callDetailPanel');
        panel.style.display = 'block';

        const typeBadge = document.getElementById('detailTypeBadge');
        typeBadge.textContent = call.label + ' (' + call.number + ')';
        typeBadge.style.background = call.color + '33';
        typeBadge.style.color = call.color;

        document.getElementById('detailCaller').textContent = call.caller;
        document.getElementById('detailTime').textContent = formatTime(call.startTime);
        document.getElementById('detailAccuracy').textContent = call.accuracy + ' 米';
        document.getElementById('detailDuration').textContent = call.duration + ' 秒';
        document.getElementById('detailCoords').textContent = call.mapLocation.x.toFixed(1) + '%, ' + call.mapLocation.y.toFixed(1) + '%';
        document.getElementById('detailAddress').textContent = call.mapLocation.address;
    }

    function updateStats() {
        document.getElementById('totalCalls').textContent = totalCalls;
        if (totalCalls > 0) {
            const avg = (totalDuration / totalCalls).toFixed(1);
            document.getElementById('avgTime').textContent = avg + 's';
        }
    }

    function updateFlowTimer(seconds) {
        document.getElementById('flowTimer').textContent = seconds.toFixed(0);
    }

    function updateMiniPhoneScreen(state, type) {
        const screen = document.getElementById('miniPhoneScreen');
        if (!screen) return;

        if (state === 'calling') {
            const config = TYPE_CONFIG[type];
            screen.innerHTML = `
                <div class="mini-calling">
                    <div class="mini-calling-icon" style="background: linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -40)} 100%);">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                    </div>
                    <h4 style="color: ${config.color}">正在拨打 ${config.number}</h4>
                    <p>${config.label}</p>
                    <div class="mini-steps">
                        <div class="mini-step step-1 active"><span class="mini-step-dot"></span>获取位置中...</div>
                        <div class="mini-step step-2"><span class="mini-step-dot"></span>传输数据</div>
                        <div class="mini-step step-3"><span class="mini-step-dot"></span>送达指挥中心</div>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const s1 = screen.querySelector('.step-1');
                const s2 = screen.querySelector('.step-2');
                if (s1) { s1.classList.remove('active'); s1.classList.add('completed'); s1.innerHTML = '<span class="mini-step-dot"></span>位置已获取'; }
                if (s2) s2.classList.add('active');
            }, 1200);

            setTimeout(() => {
                const s2 = screen.querySelector('.step-2');
                const s3 = screen.querySelector('.step-3');
                if (s2) { s2.classList.remove('active'); s2.classList.add('completed'); s2.innerHTML = '<span class="mini-step-dot"></span>数据已传输'; }
                if (s3) s3.classList.add('active');
            }, 2800);

            setTimeout(() => {
                const s3 = screen.querySelector('.step-3');
                if (s3) { s3.classList.remove('active'); s3.classList.add('completed'); s3.innerHTML = '<span class="mini-step-dot"></span>已送达指挥中心'; }
            }, 4500);
        }
    }

    function endCall() {
        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }

        document.querySelector('.emergency-dialer').style.display = 'flex';
        document.getElementById('callingScreen').style.display = 'none';

        resetTransmissionSteps();

        activeCall = null;
        updateStats();
        document.getElementById('activeCalls').textContent = '0';
        updateSystemStatus('系统就绪', 'success');

        const miniStatus = document.getElementById('miniStatus');
        if (miniStatus) {
            miniStatus.textContent = '等待呼叫...';
            miniStatus.classList.remove('alert');
        }

        resetMiniPhoneScreen();
    }

    function resetTransmissionSteps() {
        ['step1', 'step2', 'step3'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active', 'completed');
            }
        });
        ['stepLine1', 'stepLine2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('completed');
            }
        });
        const detail = document.getElementById('transmissionDetail');
        if (detail) detail.textContent = '准备中...';

        document.querySelectorAll('.flow-step').forEach(s => {
            s.classList.remove('active', 'completed');
        });
        document.querySelectorAll('.flow-arrow').forEach(a => {
            a.classList.remove('active');
        });

        document.getElementById('flowTimer').textContent = '--';
    }

    function resetMiniPhoneScreen() {
        const screen = document.getElementById('miniPhoneScreen');
        if (!screen) return;
        screen.innerHTML = `
            <div class="mini-emergency-dialer">
                <h3>紧急呼叫</h3>
                <div class="mini-buttons">
                    <button class="mini-btn police" data-type="police" data-number="110">110</button>
                    <button class="mini-btn fire" data-type="fire" data-number="119">119</button>
                    <button class="mini-btn medical" data-type="medical" data-number="120">120</button>
                </div>
                <p class="mini-hint">点击呼叫自动发送位置</p>
            </div>
        `;

        screen.querySelectorAll('.mini-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const number = this.dataset.number;
                startEmergencyCall(type, number);
            });
        });
    }

    function resetDemo() {
        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }

        activeCall = null;
        callHistory = [];
        totalCalls = 0;
        totalDuration = 0;
        callSeconds = 0;

        document.querySelector('.emergency-dialer').style.display = 'flex';
        document.getElementById('callingScreen').style.display = 'none';
        document.getElementById('callingTimer').textContent = '00:00';

        resetTransmissionSteps();

        const callList = document.getElementById('callList');
        callList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <p>暂无紧急呼叫</p>
                <span>等待呼入中...</span>
            </div>
        `;
        document.getElementById('callCount').textContent = '0 条';

        document.getElementById('callDetailPanel').style.display = 'none';

        document.getElementById('totalCalls').textContent = '0';
        document.getElementById('avgTime').textContent = '--';
        document.getElementById('activeCalls').textContent = '0';

        const mapMarkers = document.getElementById('mapMarkers');
        const mapRipples = document.getElementById('mapRipples');
        const miniMapMarkers = document.getElementById('miniMapMarkers');
        if (mapMarkers) mapMarkers.innerHTML = '';
        if (mapRipples) mapRipples.innerHTML = '';
        if (miniMapMarkers) miniMapMarkers.innerHTML = '';

        const miniStatus = document.getElementById('miniStatus');
        if (miniStatus) {
            miniStatus.textContent = '等待呼叫...';
            miniStatus.classList.remove('alert');
        }

        resetMiniPhoneScreen();
        updateSystemStatus('系统就绪', 'success');

        const locationStatus = document.querySelector('.location-status');
        const locationDetail = document.querySelector('.location-detail');
        if (locationStatus) locationStatus.textContent = '等待定位';
        if (locationDetail) locationDetail.textContent = '点击紧急呼叫自动发送位置';
    }

    function updateSystemStatus(text, type) {
        const badge = document.getElementById('systemStatus');
        const dot = badge.querySelector('.status-dot');
        
        badge.innerHTML = '<span class="status-dot"></span>' + text;
        
        if (type === 'success') {
            badge.style.background = 'rgba(82, 196, 26, 0.1)';
            badge.style.borderColor = 'rgba(82, 196, 26, 0.3)';
            badge.style.color = 'var(--success)';
        } else if (type === 'warning') {
            badge.style.background = 'rgba(250, 173, 20, 0.1)';
            badge.style.borderColor = 'rgba(250, 173, 20, 0.3)';
            badge.style.color = 'var(--warning)';
        }
    }

    function formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleExpand {
            0% { r: 16; opacity: 0.6; }
            100% { r: 60; opacity: 0; }
        }
        .map-marker-group {
            cursor: pointer;
        }
        .map-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
        }
        .map-svg {
            width: 100%;
            height: 100%;
            display: block;
        }
        .map-labels {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .map-label {
            position: absolute;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
            transform: translate(-50%, -50%);
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .mini-map {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
            overflow: hidden;
        }
        .mini-map-svg {
            width: 100%;
            height: 100%;
            display: block;
        }
    `;
    document.head.appendChild(style);
})();
