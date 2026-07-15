const STORAGE_KEY = 'petpilot_session_id';

let sessionId = '';
let trialCount = 0;
let trialTotal = 100;
let isSending = false;

const petEmoji = document.getElementById('petEmoji');
const petStatus = document.getElementById('petStatus');
const petContainer = document.getElementById('petContainer');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const trialCountEl = document.getElementById('trialCount');
const trialProgressBar = document.getElementById('trialProgressBar');

const petStates = [
    { emoji: '🐱', status: '开心地摇尾巴~' },
    { emoji: '😸', status: '喵~主人好！' },
    { emoji: '😺', status: '咕噜咕噜~' },
    { emoji: '😻', status: '喜欢你！💕' },
    { emoji: '😼', status: '在思考呢~' }
];

async function initSession() {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    
    let response;
    if (storedSession) {
        response = await fetch(`/api/session?session_id=${storedSession}`);
    } else {
        response = await fetch('/api/session');
    }
    
    const data = await response.json();
    if (data.success) {
        sessionId = data.session_id;
        localStorage.setItem(STORAGE_KEY, sessionId);
        trialCount = data.trial_used;
        trialTotal = data.trial_total;
        updateTrialDisplay();
    }
}

function updateTrialDisplay() {
    trialCountEl.textContent = `${trialCount}`;
    if (trialProgressBar) {
        const percentage = (trialCount / trialTotal) * 100;
        trialProgressBar.style.width = `${percentage}%`;
    }
}

function changePetState(stateIndex = null) {
    const index = stateIndex !== null ? stateIndex : Math.floor(Math.random() * petStates.length);
    const state = petStates[index];
    
    petEmoji.textContent = state.emoji;
    petStatus.textContent = state.status;
    
    petEmoji.classList.remove('happy', 'think');
    petEmoji.classList.add('bounce');
    
    setTimeout(() => {
        petEmoji.classList.remove('bounce');
    }, 600);
}

function setPetThinking() {
    petEmoji.textContent = '😼';
    petStatus.textContent = '正在思考中...';
    petEmoji.classList.add('think');
}

function setPetIdle() {
    petEmoji.textContent = '🐱';
    petStatus.textContent = '等待主人召唤~';
    petEmoji.classList.remove('happy', 'think');
}

function addMessage(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const avatar = document.createElement('div');
    avatar.className = `avatar ${isUser ? 'user' : 'ai'}`;
    avatar.textContent = isUser ? '👤' : '🐱';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user' : 'ai'}`;
    bubble.textContent = content;
    
    contentDiv.appendChild(bubble);
    messageDiv.appendChild(isUser ? avatar : contentDiv);
    if (!isUser) messageDiv.appendChild(avatar);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message';
    typingDiv.id = 'typingIndicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    contentDiv.appendChild(indicator);
    typingDiv.appendChild(contentDiv);
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar ai';
    avatar.textContent = '🐱';
    typingDiv.appendChild(avatar);
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isSending) return;
    
    isSending = true;
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    addMessage(message, true);
    setPetThinking();
    addTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                message: message
            })
        });
        
        const data = await response.json();
        
        removeTypingIndicator();
        
        if (data.success && data.reply) {
            addMessage(data.reply, false);
            trialCount = data.trial_used;
            updateTrialDisplay();
            
            if (data.reply.includes('用完') || data.reply.includes('次数')) {
                setPetIdle();
            } else {
                changePetState(0);
            }
        } else {
            addMessage('喵~我现在有点不舒服，休息一下再来陪你吧~ 🐱', false);
            setPetIdle();
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        addMessage('喵~网络好像有点问题，我稍后再来陪你~ 🐱', false);
        setPetIdle();
    } finally {
        isSending = false;
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

petContainer.addEventListener('click', () => {
    changePetState();
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function loadUserData() {
    if (!sessionId) return;
    
    try {
        const response = await fetch(`/api/user_data?session_id=${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
            trialCount = data.trial_used;
            trialTotal = data.trial_total;
            updateTrialDisplay();
        }
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

initSession();
loadUserData();

setInterval(() => {
    loadUserData();
}, 30000);