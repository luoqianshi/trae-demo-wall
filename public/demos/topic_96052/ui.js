let selectedAvatar = '😊';
let uploadedImage = null;

const selectAvatar = (avatar) => {
    selectedAvatar = avatar;
    uploadedImage = null;
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector(`[data-avatar="${avatar}"]`)?.classList.add('active');
    document.getElementById('image-preview').innerHTML = '';
};

const handleImageUpload = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            selectedAvatar = uploadedImage;
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
            document.getElementById('image-preview').innerHTML = `<img src="${uploadedImage}">`;
        };
        reader.readAsDataURL(file);
    }
};

const showCustomCharModal = () => {
    selectedAvatar = '😊';
    uploadedImage = null;
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('[data-avatar="😊"]').classList.add('active');
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('custom-char-name').value = '';
    document.getElementById('custom-char-desc').value = '';
    document.getElementById('custom-char-phrases').value = '';
    document.getElementById('custom-char-modal').classList.add('active');
};

const hideCustomCharModal = () => {
    document.getElementById('custom-char-modal').classList.remove('active');
};

const createCustomCharacter = () => {
    const name = document.getElementById('custom-char-name').value.trim();
    const desc = document.getElementById('custom-char-desc').value.trim();
    const phrases = document.getElementById('custom-char-phrases').value.trim();
    
    if (!name || !desc) {
        showToast('请填写角色名称和性格描述', 'error');
        return;
    }
    
    const newChar = {
        id: `custom-${Date.now()}`,
        name,
        avatar: uploadedImage || selectedAvatar,
        desc,
        systemPrompt: `你是一个${desc}的AI助手。`,
        isCustom: true,
        phrases: phrases.split('\n').filter(p => p.trim())
    };
    
    customCharacters.push(newChar);
    saveCustomCharacters();
    renderCharacterGrid();
    hideCustomCharModal();
    showToast('自定义角色创建成功！', 'success');
};

const showLoading = () => {
    document.getElementById('loading-overlay').classList.add('active');
};

const hideLoading = () => {
    document.getElementById('loading-overlay').classList.remove('active');
};

const showToast = (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span style="margin-right:8px">${icons[type] || icons.info}</span>${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

const showApiConfigGuide = () => {
    showToast('首次使用请先配置API密钥', 'warning', 5000);
    setTimeout(() => {
        showApiConfig();
    }, 500);
};

const showModal = (modalId) => {
    document.getElementById(modalId).classList.add('active');
};

const hideModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

const showMain = () => {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-content').classList.add('active');
    document.querySelectorAll('.mode-container,.page-container').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.modal').forEach(el => el.classList.remove('active'));
    
    const hasConfiguredApi = state.apiConfigs.some(c => c.url && c.apiKey);
    const hasShownGuide = localStorage.getItem('ai-platform-shown-api-guide');
    
    if (!hasConfiguredApi && !hasShownGuide) {
        showApiConfigGuide();
        localStorage.setItem('ai-platform-shown-api-guide', 'true');
    }
};

const showMode = (mode) => {
    showMain();
    document.getElementById('main-content').classList.remove('active');
    if (mode === 'professional') {
        document.getElementById('professional-mode').classList.add('active');
        renderCharacterGrid();
    } else if (mode === 'social') {
        document.getElementById('social-mode').classList.add('active');
        renderGroupList();
    }
};

const showAppsPage = () => {
    showMain();
    document.getElementById('main-content').classList.remove('active');
    document.getElementById('apps-page').classList.add('active');
};

const showPrompts = () => {
    showMain();
    document.getElementById('main-content').classList.remove('active');
    document.getElementById('prompts-page').classList.add('active');
    renderPrompts('all');
};

const showHelpPage = () => {
    showMain();
    document.getElementById('main-content').classList.remove('active');
    document.getElementById('help-page').classList.add('active');
};

const showApiConfig = () => {
    renderApiList();
    showModal('api-config-modal');
};

const renderApiList = () => {
    document.getElementById('api-list').innerHTML = state.apiConfigs.map(config => `
        <div class="api-item" onclick="selectApi('${config.id}')">
            <div>
                <span style="font-weight:bold">${config.name}</span>
                <span style="margin-left:8px;padding:2px 8px;border-radius:10px;font-size:12px;${state.selectedApi === config.id ? 'background:rgba(0,212,255,0.3);color:#00d4ff' : 'background:rgba(255,255,255,0.1);color:#aaa'}">${state.selectedApi === config.id ? '✓ 已选中' : '点击选中'}</span>
                <br><span style="font-size:12px;color:#666">${config.url}</span>
                <br><span style="font-size:11px;color:#888">模型: ${config.model || '未设置'}</span>
            </div>
            <div>
                <button class="api-delete" onclick="event.stopPropagation();deleteApi('${config.id}')">删除</button>
                <button style="padding:6px 12px;border:1px solid rgba(0,212,255,0.3);border-radius:4px;background:transparent;color:#00d4ff;cursor:pointer;font-size:12px;margin-left:5px" onclick="event.stopPropagation();testApiConnection().then(res => showToast(res.message, res.success ? 'success' : 'error'))">测试</button>
            </div>
        </div>
    `).join('');
};

const selectApi = (id) => {
    state.selectedApi = id;
    showToast('已切换到: ' + state.apiConfigs.find(c => c.id === id)?.name, 'success');
    renderApiList();
};

const addNewApi = () => {
    const name = document.getElementById('new-api-name').value;
    const mode = document.getElementById('new-api-mode').value;
    const url = document.getElementById('new-api-url').value;
    const apiKey = document.getElementById('new-api-key').value;
    if (!name || !url) {
        showToast('请填写API名称和地址', 'error');
        return;
    }
    state.apiConfigs.push({ id: Date.now().toString(), name, type: mode, url, apiKey, model: 'default', enabled: true });
    state.selectedApi = state.apiConfigs[state.apiConfigs.length - 1].id;
    showToast('API添加成功！', 'success');
    hideModal('add-api-modal');
    renderApiList();
};

const deleteApi = (id) => {
    state.apiConfigs = state.apiConfigs.filter(c => c.id !== id);
    if (state.selectedApi === id && state.apiConfigs.length > 0) {
        state.selectedApi = state.apiConfigs[0].id;
    }
    showToast('API已删除', 'info');
    renderApiList();
};

const renderCharacterGrid = () => {
    const grid = document.getElementById('ai-character-grid');
    grid.innerHTML = '';
    
    const allCharacters = [...aiCharacters, ...customCharacters];
    
    allCharacters.forEach(char => {
        const isSelected = state.selectedCharacters.some(c => c.id === char.id);
        const card = document.createElement('div');
        card.className = `character-card ${isSelected ? 'selected' : ''}`;
        const avatarHtml = char.isCustom && char.avatar.startsWith('data:') 
            ? `<img src="${char.avatar}" class="avatar-image">` 
            : `<div class="avatar">${char.avatar}</div>`;
        card.innerHTML = `
            ${avatarHtml}
            <div class="name">${char.name}</div>
            <div class="desc">${char.desc}</div>
            ${char.isCustom ? '<div class="custom-badge">自定义</div>' : ''}
        `;
        card.addEventListener('click', () => toggleCharacter(char));
        grid.appendChild(card);
    });
    
    updateSelectedCount();
};

const toggleCharacter = (char) => {
    const index = state.selectedCharacters.findIndex(c => c.id === char.id);
    if (index === -1) {
        state.selectedCharacters.push(char);
    } else {
        state.selectedCharacters.splice(index, 1);
    }
    renderCharacterGrid();
};

const updateSelectedCount = () => {
    document.getElementById('selected-count').textContent = state.selectedCharacters.length;
    document.getElementById('start-pro-chat').disabled = state.selectedCharacters.length === 0;
    
    const createdAis = document.getElementById('created-ais');
    if (state.selectedCharacters.length === 0) {
        createdAis.innerHTML = '<div style="text-align:center;color:#666;padding:40px">点击左侧卡片添加AI角色</div>';
    } else {
        createdAis.innerHTML = state.selectedCharacters.map(char => `
            <div class="character-card selected" style="margin-bottom:10px;">
                <div class="avatar">${char.avatar}</div>
                <div class="name">${char.name}</div>
                <div class="desc">${char.desc}</div>
            </div>
        `).join('');
    }
};

const renderGroupList = () => {
    const groups = [
        { id: 'tech', name: '技术交流群', icon: '💻', desc: '讨论编程、技术分享' },
        { id: 'life', name: '生活闲聊群', icon: '🏠', desc: '分享生活趣事' },
        { id: 'study', name: '学习讨论群', icon: '📚', desc: '一起学习进步' },
        { id: 'game', name: '游戏交流群', icon: '🎮', desc: '游戏爱好者聚集地' }
    ];
    
    document.getElementById('group-list').innerHTML = groups.map(g => `
        <div class="group-card" onclick="selectGroup('${g.id}','${g.name}')">
            <div style="font-size:24px;margin-bottom:8px">${g.icon}</div>
            <div style="font-weight:bold;margin-bottom:4px">${g.name}</div>
            <div style="font-size:12px;color:#aaa">${g.desc}</div>
        </div>
    `).join('');
};

const renderPrompts = (tab) => {
    const list = document.getElementById('prompts-list');
    let prompts = [];
    if (tab === 'all') {
        prompts = promptTemplates;
    } else if (tab === 'memory') {
        prompts = state.userQuestions.map(q => ({
            id: q.id, name: '历史问题', category: 'memory', content: q.question
        }));
    } else {
        prompts = promptTemplates.filter(p => p.category === tab);
    }
    if (prompts.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:50px;color:#666">暂无数据</div>';
        return;
    }
    list.innerHTML = prompts.map(p => `
        <div class="prompt-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">${p.name}</span>
                <span style="font-size:12px;padding:4px 10px;border-radius:20px;background:rgba(0,212,255,0.2);color:#00d4ff">${tab === 'memory' ? '历史' : (p.category === 'professional' ? '专业' : '创意')}</span>
            </div>
            <div style="font-size:14px;color:#ccc;margin-bottom:15px;line-height:1.6">${p.content}</div>
            <div style="display:flex;gap:10px">
                <button style="padding:8px 15px;border:1px solid rgba(0,212,255,0.3);border-radius:6px;background:transparent;color:#00d4ff;cursor:pointer;font-size:12px" onclick="showToast('提示词已复制','success');navigator.clipboard.writeText('${p.content}')">复制</button>
            </div>
        </div>
    `).join('');
};
