const aiCharacters = [
    { id: 'action', name: '行动派', avatar: '🚀', desc: '冲动果断，第一时间动手解决',
      systemPrompt: '你是一个冲动果断、执行力极强的AI助手。说话风格干脆利落、雷厉风行，喜欢说干就干。' },
    { id: 'thinker', name: '三思派', avatar: '🤔', desc: '谨慎思虑，想好完整方案再动手',
      systemPrompt: '你是一个谨慎思虑、善于分析的AI助手。说话风格沉稳谨慎、深思熟虑，喜欢谋定而后动。' },
    { id: 'avoid', name: '摆烂派', avatar: '😴', desc: '逃避回避，能躲就躲',
      systemPrompt: '你是一个逃避回避、喜欢拖延的AI助手。说话风格慵懒随意、佛系躺平。' },
    { id: 'depend', name: '借力派', avatar: '🤝', desc: '求助依赖，擅长借力别人经验',
      systemPrompt: '你是一个求助依赖、善于借力的AI助手。说话风格谦虚好学、善于合作。' },
    { id: 'perfection', name: '完美派', avatar: '💎', desc: '偏执较真，追求细节极致',
      systemPrompt: '你是一个偏执较真、追求完美的AI助手。说话风格严谨细致、精益求精。' }
];

const promptTemplates = [
    { id: 'p1', name: '代码优化建议', category: 'professional', content: '请帮我优化以下代码，指出潜在问题并给出改进方案：' },
    { id: 'p2', name: '市场分析报告', category: 'professional', content: '请分析当前市场趋势，包括竞争格局、用户需求和增长机会：' },
    { id: 'p3', name: '创意写作', category: 'creative', content: '请写一篇富有想象力的科幻故事，主题是：' },
    { id: 'p4', name: '产品设计思路', category: 'professional', content: '请帮我构思一个新产品的设计方案：' },
    { id: 'p5', name: '旅行攻略', category: 'creative', content: '请为我规划一次完美的旅行，目的地是：' },
    { id: 'p6', name: '营销文案', category: 'creative', content: '请帮我写一段吸引人的营销文案：' }
];

let isInitialized = false;

const state = {
    selectedCharacters: [],
    chatStarted: false,
    apiConfigs: CONFIG.defaultApiConfigs,
    selectedApi: 'custom',
    userQuestions: [],
    appMemory: []
};

let catAnimationId = null;

function initCatAnimation() {
    const canvas = document.getElementById('cat-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    
    function drawCat() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const bounce = Math.sin(frame * 0.15) * 8;
        const rotate = Math.sin(frame * 0.08) * 0.1;
        
        ctx.save();
        ctx.translate(150, 150 + bounce);
        ctx.rotate(rotate);
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 50, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-15, -8, 8, 0, Math.PI * 2);
        ctx.arc(15, -8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-13, -10, 3, 0, Math.PI * 2);
        ctx.arc(13, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 5, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#ff9999';
        ctx.beginPath();
        ctx.ellipse(-35, -20, 15, 20, -0.3, 0, Math.PI * 2);
        ctx.ellipse(35, -20, 15, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffcccc';
        ctx.beginPath();
        ctx.ellipse(-35, -18, 8, 12, -0.3, 0, Math.PI * 2);
        ctx.ellipse(35, -18, 8, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-45, 5, 10, 8, -0.2, 0, Math.PI * 2);
        ctx.ellipse(45, 5, 10, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        frame++;
        catAnimationId = requestAnimationFrame(drawCat);
    }
    
    drawCat();
}

function openCatDecider() {
    document.getElementById('cat-decider-container').classList.add('active');
    initCatAnimation();
}

function closeCatDecider() {
    if (catAnimationId) {
        cancelAnimationFrame(catAnimationId);
        catAnimationId = null;
    }
    document.getElementById('cat-decider-container').classList.remove('active');
}

function catDecide() {
    const input = document.getElementById('cat-input');
    const question = input.value.trim();
    if (!question) {
        showToast('请输入你的问题', 'error');
        return;
    }
    
    catDecideWithAI(question);
    input.value = '';
}

async function catDecideWithAI(question) {
    console.log('[CAT_DECIDE] 猫裁决器开始分析:', {question});
    
    try {
        showLoading();
        const apiConfig = state.apiConfigs.find(c => c.id === state.selectedApi);
        
        if (!apiConfig || !apiConfig.url) {
            throw new Error('未配置AI API，请在专业模式中配置API');
        }
        
        const prompt = `你是一只傲娇的猫咪裁决器，名叫"喵大王"。请用幽默、傲娇的猫咪语气回答用户的问题："${question}"。回答要简短有趣，带点猫咪的可爱和傲娇。`;
        
        let response = '';
        
        if (apiConfig.type === 'huggingface') {
            const formattedPrompt = `<s>[INST] ${prompt} [/INST]`;
            response = await callHuggingFaceAPI(apiConfig.url, formattedPrompt);
        } else if (apiConfig.type === 'openai') {
            const messages = [
                { role: 'system', content: '你是一只傲娇的猫咪裁决器，名叫"喵大王"。请用幽默、傲娇的猫咪语气回答问题。' },
                { role: 'user', content: prompt }
            ];
            response = await callOpenAIAPI(apiConfig.url, apiConfig.apiKey, apiConfig.model, messages);
        } else if (apiConfig.type === 'simple') {
            response = await callSimpleAPI(apiConfig.url, prompt);
        }
        
        if (!response || response.length < 5) {
            throw new Error('API返回内容过短');
        }
        
        console.log('[CAT_DECIDE] 猫裁决器回答成功:', {answer: response.substring(0, 50) + '...'});
        document.getElementById('cat-result').textContent = '🐱 裁决结果：' + response;
        
    } catch (error) {
        console.error('[CAT_DECIDE] 猫裁决器失败:', error.message);
        document.getElementById('cat-result').textContent = '🐱 裁决结果：⚠️ ' + error.message;
        showToast('猫裁决器失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    if (username && password) {
        setLoginState(username);
        showToast('登录成功！', 'success');
        showMain();
    } else {
        showToast('请输入账号和密码', 'error');
    }
}

function enterAsGuest() {
    setLoginState('guest');
    showToast('欢迎进入访客模式！', 'success');
    showMain();
}

function runAITest() {
    console.log('\n=== AI强制调用API测试 ===');
    console.log('测试目标：验证所有AI功能必须调用真实API，无自动回答');
    
    const apiConfig = state.apiConfigs.find(c => c.id === state.selectedApi);
    console.log('当前API配置:', {
        id: apiConfig.id,
        name: apiConfig.name,
        type: apiConfig.type,
        hasApiKey: apiConfig.apiKey ? '有' : '无',
        hasUrl: apiConfig.url ? '有' : '无'
    });
    
    if (!apiConfig.apiKey) {
        console.log('✅ API Key为空，符合测试条件');
        console.log('测试结果：所有AI功能将显示错误信息，不会自动回答');
        showToast('API Key未配置，所有AI功能将显示错误信息', 'warning');
    } else {
        console.log('❌ API Key已配置，需要清空才能测试');
        showToast('请清空API Key后再测试', 'error');
    }
    
    console.log('\n测试场景：');
    console.log('1. 专业模式聊天 → 预期：API调用失败');
    console.log('2. 猫裁决器 → 预期：猫裁决器失败');
}

function init() {
    if (isInitialized) return;
    isInitialized = true;
    
    loadCustomCharacters();
    checkLoginState();

    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('guest-btn').addEventListener('click', enterAsGuest);

    const btnProfessional = document.getElementById('btn-professional');
    const btnCatDecider = document.getElementById('btn-cat-decider');
    
    if (btnProfessional) btnProfessional.addEventListener('click', () => showMode('professional'));
    if (btnCatDecider) btnCatDecider.addEventListener('click', openCatDecider);

    document.getElementById('pro-back-btn').addEventListener('click', showMain);

    document.getElementById('nav-apps').addEventListener('click', showAppsPage);
    document.getElementById('nav-prompts').addEventListener('click', showPrompts);
    document.getElementById('nav-help').addEventListener('click', showHelpPage);
    document.getElementById('search-btn').addEventListener('click', () => showToast('搜索功能开发中...', 'info'));

    document.getElementById('apps-back-btn').addEventListener('click', showMain);
    document.getElementById('prompts-back-btn').addEventListener('click', showMain);
    document.getElementById('help-back-btn').addEventListener('click', showMain);

    document.getElementById('app-pro-chat').querySelector('.launch-btn').addEventListener('click', () => showMode('professional'));
    document.getElementById('app-cat-decider').querySelector('.launch-btn').addEventListener('click', openCatDecider);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPrompts(btn.dataset.tab);
        });
    });

    document.querySelectorAll('.help-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.help-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
            document.querySelector('.help-section[data-category="' + category + '"]').classList.add('active');
        });
    });

    document.getElementById('api-config-btn').addEventListener('click', showApiConfig);
    document.getElementById('close-api-modal').addEventListener('click', () => hideModal('api-config-modal'));
    document.getElementById('add-api-btn').addEventListener('click', () => document.getElementById('add-api-modal').classList.add('active'));
    document.getElementById('close-add-api-modal').addEventListener('click', () => hideModal('add-api-modal'));
    document.getElementById('confirm-add-api').addEventListener('click', addNewApi);

    document.getElementById('start-pro-chat').addEventListener('click', startProfessionalChat);
    document.getElementById('pro-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendProMessage(); });
    document.getElementById('pro-send').addEventListener('click', sendProMessage);

    document.getElementById('cat-close-btn').addEventListener('click', closeCatDecider);
    document.getElementById('cat-decide-btn').addEventListener('click', catDecide);

    document.getElementById('create-custom-char-btn').addEventListener('click', showCustomCharModal);
    document.getElementById('close-custom-char-modal').addEventListener('click', hideCustomCharModal);
    document.getElementById('confirm-custom-char').addEventListener('click', createCustomCharacter);
}

document.addEventListener('DOMContentLoaded', init);
