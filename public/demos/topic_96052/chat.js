const addMessage = (name, avatar, text, type, containerId) => {
    const list = document.getElementById(containerId);
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-content"><div class="message-name">${name}</div><div class="message-text">${text}</div></div>`;
    list.appendChild(msg);
    list.scrollTop = list.scrollHeight;
    return msg;
};

const updateMessage = (msg, text) => {
    const textEl = msg.querySelector('.message-text');
    if (textEl) textEl.innerHTML = text;
};

const startProfessionalChat = () => {
    document.getElementById('pro-setup-area').style.display = 'none';
    document.getElementById('pro-chat-area').style.display = 'flex';
    state.chatStarted = true;
    document.getElementById('pro-input').disabled = false;
    document.getElementById('pro-send').disabled = false;
    const names = state.selectedCharacters.map(c => c.name).join('、');
    document.getElementById('pro-chat-header').textContent = `群聊：${names}`;
    addMessage('系统', '🤖', `群聊已创建！${names}已加入群聊，开始你的问题吧~`, 'system', 'pro-messages');
    state.selectedCharacters.forEach((char, i) => {
        setTimeout(() => handleAIResponse(char, '请用一两句话介绍一下你自己', 'pro-messages'), 800 + i * 500);
    });
};

const sendProMessage = () => {
    const input = document.getElementById('pro-input');
    const text = input.value.trim();
    if (!text || !state.chatStarted) return;
    input.value = '';
    addMessage('我', '👤', text, 'user', 'pro-messages');
    saveUserQuestion(text);
    state.selectedCharacters.forEach((char, i) => {
        setTimeout(() => handleAIResponse(char, text, 'pro-messages'), 500 + i * 500);
    });
};

const handleAIResponse = (character, userMessage, containerId) => {
    console.log('[DEBUG] handleAIResponse调用:', character.name, userMessage);
    const msg = addMessage(character.name, character.avatar, '<div class="typing-indicator"><span></span><span></span><span></span></div>', 'ai', containerId);
    const config = state.apiConfigs.find(c => c.id === state.selectedApi);
    
    console.log('[DEBUG] 当前API配置:', JSON.stringify(config));
    
    if (!config) {
        updateMessage(msg, '抱歉，未配置API');
        return;
    }
    
    callRealAPI(character, userMessage, msg);
};
