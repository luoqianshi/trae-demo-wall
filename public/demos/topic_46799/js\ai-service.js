let aiModels = [];
let currentModel = null;
let selectedProvider = 'deepseek';

async function loadModelsFromServer() {
    try {
        const res = await fetch('/api/models');
        const data = await res.json();
        aiModels = data.models || [];
        currentModel = aiModels.find(m => m.isDefault && m.status === 'active') || aiModels.find(m => m.status === 'active') || aiModels[0];
    } catch (e) {
        console.error('加载模型失败:', e);
    }
}

async function addModelToServer(modelData) {
    const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
    });
    const data = await res.json();
    if (data.model) {
        aiModels.push(data.model);
        return data.model;
    }
    throw new Error(data.error || '添加失败');
}

async function deleteModelFromServer(modelId) {
    const res = await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
        aiModels = aiModels.filter(m => m.id !== modelId);
        return true;
    }
    throw new Error(data.error || '删除失败');
}

function initModels() {
    updateCurrentModelDisplay();
    renderModelList();
    renderModelsContainer();
}

function updateCurrentModelDisplay() {
    const el = document.getElementById('currentModelName');
    if (el && currentModel) {
        el.textContent = currentModel.displayName;
    }
    const displayEl = document.getElementById('defaultModelDisplay');
    if (displayEl && currentModel) {
        displayEl.textContent = `${currentModel.displayName} (${getProviderLabel(currentModel.provider)})`;
    }
}

function getProviderLabel(provider) {
    const labels = { openai: 'OpenAI', anthropic: 'Anthropic', bytedance: '字节豆包', ollama: 'Ollama', deepseek: 'DeepSeek', custom: '自定义' };
    return labels[provider] || provider;
}

function getProviderIcon(provider) {
    const icons = { openai: '🤖', anthropic: '🧠', bytedance: '🎵', ollama: '💻', deepseek: '🌲', custom: '⚙️' };
    return icons[provider] || '⚙️';
}

function renderModelList() {
    const container = document.getElementById('modelList');
    if (!container) return;
    const activeModels = aiModels.filter(m => m.status === 'active');
    container.innerHTML = activeModels.map(model => `
        <div class="model-option ${currentModel && currentModel.id === model.id ? 'active' : ''}" onclick="selectModel('${model.id}')">
            <div class="model-option-icon">${getProviderIcon(model.provider)}</div>
            <div class="model-option-name">
                <div class="model-option-display">${model.displayName}</div>
                <div class="model-option-provider">${getProviderLabel(model.provider)}</div>
            </div>
        </div>
    `).join('');
    if (activeModels.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-light);">暂无可用模型<br><a href="#" onclick="navigateTo(\'settings\'); toggleModelSelector(); return false;" style="color: var(--color-forest);">去添加一个</a></div>';
    }
}

function renderModelsContainer() {
    const container = document.getElementById('modelsContainer');
    if (!container) return;
    container.innerHTML = aiModels.map(model => `
        <div style="padding: 20px; border-radius: 14px; ${model.isDefault ? 'border: 2px solid var(--color-forest); background: var(--color-forest-pale);' : 'border: 1px solid var(--color-border); background: white;'}">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--color-cream); display: flex; align-items: center; justify-content: center; font-size: 20px;">${getProviderIcon(model.provider)}</div>
                <div>
                    <div style="font-weight: 600; font-size: 15px; color: var(--color-wood-dark);">${model.displayName}</div>
                    <div style="font-size: 12px; color: var(--color-text-light);">${getProviderLabel(model.provider)} · ${model.name}</div>
                </div>
                ${model.isDefault ? '<div style="margin-left: auto; padding: 2px 8px; background: var(--color-forest); color: white; border-radius: 8px; font-size: 11px;">默认</div>' : ''}
            </div>
            <div style="display: flex; gap: 8px;">
                ${model.isDefault ? '' : `<button onclick="setDefaultModel('${model.id}')" style="flex: 1; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: white; font-size: 12px; cursor: pointer;">设为默认</button>`}
                <button onclick="deleteModel('${model.id}')" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #FFCDD2; background: #FFEBEE; color: #C62828; font-size: 12px; cursor: pointer;">删除</button>
            </div>
        </div>
    `).join('');
    if (aiModels.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--color-text-light);"><div style="font-size: 36px; margin-bottom: 12px;">🤖</div><div>还没有配置任何AI模型</div><div style="font-size: 13px; margin-top: 8px;">点击上方"添加模型"开始吧</div></div>';
    }
}

function toggleModelSelector() {
    const selector = document.getElementById('modelSelector');
    selector.classList.toggle('show');
}

function selectModel(modelId) {
    const model = aiModels.find(m => m.id === modelId);
    if (model && model.status === 'active') {
        currentModel = model;
        updateCurrentModelDisplay();
        renderModelList();
        toggleModelSelector();
    }
}

async function setDefaultModel(modelId) {
    const model = aiModels.find(m => m.id === modelId);
    if (model) {
        currentModel = model;
        updateCurrentModelDisplay();
        renderModelsContainer();
    }
}

async function deleteModel(modelId) {
    if (!confirm('确定要删除这个模型吗？')) return;
    try {
        await deleteModelFromServer(modelId);
        if (currentModel && currentModel.id === modelId) {
            currentModel = aiModels.find(m => m.isDefault && m.status === 'active') || aiModels[0];
        }
        updateCurrentModelDisplay();
        renderModelList();
        renderModelsContainer();
    } catch (e) {
        alert('删除失败: ' + e.message);
    }
}

function showAddModelModal() {
    document.getElementById('addModelModal').classList.add('show');
    document.getElementById('modelDisplayName').value = '';
    document.getElementById('modelApiKey').value = '';
    document.getElementById('modelName').value = '';
    document.getElementById('modelBaseUrl').value = '';
}

function closeAddModelModal() {
    document.getElementById('addModelModal').classList.remove('show');
}

function selectProvider(provider) {
    selectedProvider = provider;
    document.querySelectorAll('.provider-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const hints = {
        openai: { name: 'gpt-4o', url: 'https://api.openai.com/v1' },
        anthropic: { name: 'claude-3-5-sonnet', url: '' },
        bytedance: { name: 'doubao-lite', url: '' },
        ollama: { name: 'llama3', url: 'http://localhost:11434' },
        deepseek: { name: 'deepseek-chat', url: 'https://api.deepseek.com/v1' },
        custom: { name: '', url: '' }
    };
    const hint = hints[provider] || { name: '', url: '' };
    document.getElementById('modelName').placeholder = hint.name;
    document.getElementById('modelBaseUrl').placeholder = hint.url;
    document.getElementById('modelNameHint').textContent = `${getProviderLabel(provider)} 模型名称`;
    document.getElementById('baseUrlHint').textContent = provider === 'ollama' ? 'Ollama 本地服务地址' : 'API 请求地址';
}

async function addModel() {
    const displayName = document.getElementById('modelDisplayName').value.trim();
    const apiKey = document.getElementById('modelApiKey').value.trim();
    const name = document.getElementById('modelName').value.trim() || displayName;
    const baseUrl = document.getElementById('modelBaseUrl').value.trim();

    if (!displayName) {
        alert('请输入显示名称');
        return;
    }

    try {
        await addModelToServer({
            provider: selectedProvider,
            displayName,
            name,
            apiKey,
            baseUrl
        });
        closeAddModelModal();
        renderModelsContainer();
        renderModelList();
        updateCurrentModelDisplay();
    } catch (e) {
        alert('添加失败: ' + e.message);
    }
}

function switchSettingTab(tab, el) {
    document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.settings-tab').forEach(t => t.style.display = 'none');
    document.getElementById('settings-' + tab).style.display = 'block';
}
