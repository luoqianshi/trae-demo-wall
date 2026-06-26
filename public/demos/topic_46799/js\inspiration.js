const schemes = [
    { name: '木质显示器增高架', desc: '原木打造，稳固耐用', difficulty: 2, price: '¥120-180', color: '#C9A86C', icon: '🌿', materials: ['原木板 30x20cm x2', 'L型角码 x4', '木螺丝 x16'] },
    { name: '简约收纳盒套装', desc: '一盒多用，收纳整理', difficulty: 1, price: '¥80-120', color: '#7CB342', icon: '📦', materials: ['竹板 25x15cm x3', 'L型角码 x8', '木螺丝 x24'] },
    { name: '赛博朋克耳机架', desc: '亚克力+LED灯带，科技感', difficulty: 3, price: '¥200-280', color: '#667eea', icon: '🎧', materials: ['透明亚克力板 x2', 'LED灯带 50cm', 'USB排插 x1', '螺丝 x8'] }
];

const schemeToPartsMap = {
    0: [
        { id: 'board-wood-1', name: '原木板 30×20', price: 25, color: '#C9A86C' },
        { id: 'board-wood-1', name: '原木板 30×20', price: 25, color: '#C9A86C' },
        { id: 'bracket-l', name: 'L型角码', price: 3, color: '#888888' },
        { id: 'screw-wood', name: '木螺丝', price: 0.5, color: '#666666' }
    ],
    1: [
        { id: 'board-bamboo-1', name: '竹板 25×15', price: 20, color: '#D4C9A0' },
        { id: 'board-bamboo-1', name: '竹板 25×15', price: 20, color: '#D4C9A0' },
        { id: 'board-bamboo-1', name: '竹板 25×15', price: 20, color: '#D4C9A0' },
        { id: 'bracket-l', name: 'L型角码', price: 3, color: '#888888' },
        { id: 'screw-wood', name: '木螺丝', price: 0.5, color: '#666666' }
    ],
    2: [
        { id: 'board-acrylic-1', name: '透明亚克力板', price: 30, color: '#FFFFFF' },
        { id: 'board-acrylic-1', name: '透明亚克力板', price: 30, color: '#FFFFFF' },
        { id: 'led-strip', name: 'LED灯带 50cm', price: 15, color: '#FFFF00' },
        { id: 'usb-hub', name: 'USB排插', price: 25, color: '#222222' },
        { id: 'screw-wood', name: '木螺丝', price: 0.5, color: '#666666' }
    ]
};

let chatHistory = [];
let currentSchemeIndex = null;
let wizardStep = 1;

async function sendInspirationMessage() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    input.value = '';
    autoResize(input);

    showTyping();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory, modelId: currentModel ? currentModel.id : null })
        });
        const data = await res.json();
        hideTyping();

        if (data.error) {
            addChatMessage('ai', '抱歉，AI 暂时无法响应：' + data.error);
        } else {
            const paramsMatch = data.reply.match(/<INSPIRATION_PARAMS>([\s\S]*?)<\/INSPIRATION_PARAMS>/);
            let displayReply = data.reply;
            let aiParams = null;

            if (paramsMatch) {
                displayReply = data.reply.replace(/<INSPIRATION_PARAMS>[\s\S]*?<\/INSPIRATION_PARAMS>/, '').trim();
                try {
                    aiParams = JSON.parse(paramsMatch[1]);
                } catch (e) {
                    console.error('解析AI参数失败:', e);
                }
            }

            addChatMessage('ai', displayReply);
            chatHistory.push({ role: 'assistant', content: displayReply });

            if (aiParams) {
                applyInspirationParams(aiParams);
            }
        }
    } catch (e) {
        hideTyping();
        addChatMessage('ai', '抱歉，网络连接出现问题，请稍后重试。');
    }
}

function applyInspirationParams(params) {
    inspParams.length = params.length || 30;
    inspParams.width = params.width || 20;
    inspParams.height = params.height || 10;
    inspParams.material = params.material || 'wood';
    inspParams.color = params.color || '#C9A86C';

    const typeMap = {
        'monitor_riser': 0,
        'storage_box': 1,
        'headphone_stand': 2
    };
    currentSchemeIndex = typeMap[params.type] !== undefined ? typeMap[params.type] : 0;

    buildInspirationModel(currentSchemeIndex);

    document.getElementById('wizardSidebar').classList.add('show');
    wizardStep = 1;
    renderWizardStep();
}

function addChatMessage(type, text) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = `
        <div class="message-avatar">${type === 'ai' ? '🌲' : '😊'}</div>
        <div class="message-content">
            <div class="message-name">${type === 'ai' ? '小木工' : '我'}</div>
            <div class="message-bubble">${text.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'message ai';
    div.innerHTML = `
        <div class="message-avatar">🌲</div>
        <div class="message-content">
            <div class="message-name">小木工</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function showSchemes() {
    const container = document.getElementById('schemeCards');
    const list = document.getElementById('schemeCardsList');
    list.innerHTML = schemes.map((s, i) => `
        <div class="scheme-card" onclick="selectScheme(${i})">
            <div class="scheme-card-image" style="background: ${s.color};">${s.icon}</div>
            <div class="scheme-card-info">
                <div class="scheme-card-name">${s.name}</div>
                <div class="scheme-card-desc">${s.desc}</div>
                <div class="scheme-card-meta">
                    <span class="scheme-card-difficulty">${'⭐'.repeat(s.difficulty)}</span>
                    <span class="scheme-card-price">${s.price}</span>
                </div>
            </div>
        </div>
    `).join('');
    container.classList.add('show');
}

function selectScheme(index) {
    currentSchemeIndex = index;
    document.getElementById('schemeCards').classList.remove('show');
    document.getElementById('wizardSidebar').classList.add('show');
    wizardStep = 1;
    const scheme = schemes[index];
    inspParams.color = scheme.color;
    renderWizardStep();
    buildInspirationModel(index);
}

function closeWizard() {
    document.getElementById('wizardSidebar').classList.remove('show');
    wizardStep = 1;
}

function renderWizardStep() {
    const scheme = schemes[currentSchemeIndex];
    const content = document.getElementById('wizardContent');
    const prevBtn = document.getElementById('wizardPrev');
    const nextBtn = document.getElementById('wizardNext');

    prevBtn.style.visibility = wizardStep === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = wizardStep === 4 ? '完成' : '下一步';

    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.remove('active', 'completed');
        const step = parseInt(el.dataset.step);
        if (step < wizardStep) el.classList.add('completed');
        if (step === wizardStep) el.classList.add('active');
    });

    switch(wizardStep) {
        case 1:
            content.innerHTML = `
                <div class="wizard-section-title">调整尺寸</div>
                <div class="wizard-section-desc">拖动滑块调整长宽高</div>
                <div class="slider-group">
                    <div class="slider-label"><span>长度</span><span class="slider-value" id="lengthVal">${inspParams.length} cm</span></div>
                    <input type="range" class="slider-input" min="20" max="60" value="${inspParams.length}" oninput="document.getElementById('lengthVal').textContent=this.value+' cm'; updateInspirationSize('length', this.value);">
                </div>
                <div class="slider-group">
                    <div class="slider-label"><span>宽度</span><span class="slider-value" id="widthVal">${inspParams.width} cm</span></div>
                    <input type="range" class="slider-input" min="15" max="40" value="${inspParams.width}" oninput="document.getElementById('widthVal').textContent=this.value+' cm'; updateInspirationSize('width', this.value);">
                </div>
                <div class="slider-group">
                    <div class="slider-label"><span>高度</span><span class="slider-value" id="heightVal">${inspParams.height} cm</span></div>
                    <input type="range" class="slider-input" min="5" max="20" value="${inspParams.height}" oninput="document.getElementById('heightVal').textContent=this.value+' cm'; updateInspirationSize('height', this.value);">
                </div>
            `;
            break;
        case 2:
            const materials = [
                { key: 'wood', name: '原木', color: 'linear-gradient(135deg, #C9A86C, #8B5A2B)' },
                { key: 'acrylic', name: '亚克力', color: 'linear-gradient(135deg, #FFFFFF, #F0F0F0)', border: '1px solid #DDD' },
                { key: 'bamboo', name: '竹材', color: 'linear-gradient(135deg, #D4C9A0, #B8A880)' },
                { key: 'metal', name: '金属', color: 'linear-gradient(135deg, #888888, #666666)' },
                { key: 'mdf', name: '密度板', color: 'linear-gradient(135deg, #E8D5B7, #C4956A)' }
            ];
            content.innerHTML = `
                <div class="wizard-section-title">选择材质</div>
                <div class="wizard-section-desc">不同材质带来不同的质感和温度</div>
                <div class="material-grid">
                    ${materials.map(m => `
                        <div class="material-item ${inspParams.material === m.key ? 'active' : ''}" onclick="selectMaterial(this, '${m.key}')">
                            <div class="material-swatch" style="background: ${m.color}; ${m.border ? 'border:' + m.border : ''}"></div>
                            <span>${m.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
        case 3:
            const colors = ['#C9A86C', '#8B4513', '#D4C9A0', '#7CB342', '#667eea', '#333333'];
            content.innerHTML = `
                <div class="wizard-section-title">选择颜色</div>
                <div class="wizard-section-desc">选择你喜欢的配色方案</div>
                <div class="color-grid">
                    ${colors.map(c => `
                        <div class="color-item ${inspParams.color === c ? 'active' : ''}" onclick="selectColor(this, '${c}')" style="background: ${c};"></div>
                    `).join('')}
                </div>
            `;
            break;
        case 4:
            content.innerHTML = `
                <div class="wizard-section-title">确认方案</div>
                <div class="wizard-section-desc">你的专属桌面小物设计</div>
                <div style="background: var(--color-muted); padding: 20px; border-radius: 14px; margin-bottom: 16px;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--color-wood-dark); margin-bottom: 8px; font-family: 'Noto Serif SC', serif;">${scheme.name}</div>
                    <div style="font-size: 13px; color: var(--color-text-light); margin-bottom: 12px;">${scheme.desc}</div>
                    <div style="font-size: 14px;"><strong>预估成本：</strong><span style="color: var(--color-forest); font-weight: 600;">${scheme.price}</span></div>
                    <div style="font-size: 13px; margin-top: 12px;"><strong>材料清单：</strong></div>
                    <ul style="margin: 8px 0 0 16px; font-size: 12px; color: var(--color-text-light);">
                        ${scheme.materials.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
                <button class="btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="importToProfessional()">📦 导入专业模式</button>
                <button class="btn-wood" style="width: 100%;" onclick="navigateTo('professional')">🎨 进入专业模式调整</button>
            `;
            break;
    }
}

function selectMaterial(el, materialKey) {
    el.parentElement.querySelectorAll('.material-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    updateInspirationMaterial(materialKey);
}

function selectColor(el, color) {
    el.parentElement.querySelectorAll('.color-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    updateInspirationColor(color);
}

function wizardPrev() {
    if (wizardStep > 1) {
        wizardStep--;
        renderWizardStep();
    }
}

function wizardNext() {
    if (wizardStep < 4) {
        wizardStep++;
        renderWizardStep();
    }
}

function importToProfessional() {
    const parts = schemeToPartsMap[currentSchemeIndex] || [];
    AppState.setImportedScheme({
        schemeIndex: currentSchemeIndex,
        schemeName: schemes[currentSchemeIndex].name,
        parts: parts
    });
    alert(`已将"${schemes[currentSchemeIndex].name}"导入专业模式！\n共 ${parts.length} 个零件将被加载到工作台。`);
    navigateTo('professional');
}
