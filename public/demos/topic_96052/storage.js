let customCharacters = [];

const loadCustomCharacters = () => {
    try {
        const saved = localStorage.getItem('ai-platform-custom-chars');
        if (saved) {
            customCharacters = JSON.parse(saved);
        } else {
            initTestCharacters();
        }
    } catch (error) {
        console.error('Failed to load custom characters:', error);
    }
};

const initTestCharacters = () => {
    const testAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzcyMjJmNyIvPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgeD0iMTAiIHk9IjEwIiBmaWxsPSIjOWM1ZmRmIi8+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiB4PSIyMCIgeT0iMjAiIGZpbGw9IiMxZDM1NjUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMyIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjMiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjYwIiByPSIyIiBmaWxsPSIjZmZmIi8+PC9zdmc+';
    
    customCharacters = [
        {
            id: 'custom-test-1',
            name: '幽默大师',
            avatar: testAvatar,
            desc: '幽默风趣，善于调侃，喜欢开玩笑，说话充满笑点',
            systemPrompt: '你是一个幽默风趣、善于调侃的AI助手。说话风格轻松搞笑，喜欢开玩笑，总是能找到话题中的笑点。',
            isCustom: true,
            phrases: [
                '哈哈，这个问题太有意思了！',
                '让我想想...嗯，这个嘛~',
                '开个玩笑啦，其实我觉得应该这样...',
                '这个问题问得好！我来给你讲讲~',
                '哎呀，你这个想法太棒了！'
            ]
        },
        {
            id: 'custom-test-2',
            name: '学霸导师',
            avatar: '🎓',
            desc: '学识渊博，耐心细致，善于讲解复杂知识',
            systemPrompt: '你是一个学识渊博、耐心细致的AI导师。说话风格严谨认真，善于把复杂的知识讲解得通俗易懂。',
            isCustom: true,
            phrases: [
                '这个问题涉及到以下几个关键点...',
                '让我从原理开始讲起...',
                '首先，我们需要理解...',
                '根据我的分析，这个问题可以从以下角度思考...',
                '关键点在于...'
            ]
        },
        {
            id: 'custom-test-3',
            name: '情感顾问',
            avatar: '💝',
            desc: '温柔体贴，善解人意，擅长倾听和安抚',
            systemPrompt: '你是一个温柔体贴、善解人意的AI情感顾问。说话风格温暖亲切，善于倾听和安抚人心。',
            isCustom: true,
            phrases: [
                '我理解你的感受...',
                '别担心，一切都会好起来的~',
                '你并不孤单，我在这里陪着你',
                '让我来帮你分析一下...',
                '抱抱你，一切都会过去的'
            ]
        }
    ];
    
    saveCustomCharacters();
    console.log('测试角色数据已初始化');
};

const saveCustomCharacters = () => {
    try {
        localStorage.setItem('ai-platform-custom-chars', JSON.stringify(customCharacters));
    } catch (error) {
        console.error('Failed to save custom characters:', error);
    }
};

const saveUserQuestion = (question) => {
    state.userQuestions.push({ id: Date.now().toString(), question, timestamp: Date.now() });
    if (state.userQuestions.length > CONFIG.maxQuestions) {
        state.userQuestions = state.userQuestions.slice(-CONFIG.maxQuestions);
    }
    saveMemory({ type: 'question', content: question });
};

const saveMemory = (item) => {
    state.appMemory.push({ ...item, id: Date.now().toString(), timestamp: Date.now() });
    const expireTime = Date.now() - (CONFIG.maxMemoryDays * 24 * 60 * 60 * 1000);
    state.appMemory = state.appMemory.filter(i => i.timestamp > expireTime);
};

const checkLoginState = () => {
    if (localStorage.getItem('ai-platform-logged-in') === 'true') {
        showMain();
    }
};

const setLoginState = (username) => {
    localStorage.setItem('ai-platform-logged-in', 'true');
    localStorage.setItem('ai-platform-username', username);
};
