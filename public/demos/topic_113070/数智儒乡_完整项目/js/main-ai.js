let chatMessages = [];

function addMessage(text, isUser) {
  const chatWindow = document.getElementById('chat-messages');
  if (!chatWindow) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
  
  const avatarText = isUser ? '我' : '儒';
  const avatarColor = isUser ? 'var(--jade)' : 'var(--cinnabar)';
  
  messageDiv.innerHTML = `
    <div class="msg-avatar" style="background: ${avatarColor};">${avatarText}</div>
    <div class="msg-content">${formatAnswer(text)}</div>
  `;
  
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  
  chatMessages.push({ text, isUser });
}

function showTyping() {
  const chatWindow = document.getElementById('chat-messages');
  if (!chatWindow) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="msg-avatar" style="background: var(--cinnabar);">儒</div>
    <div class="msg-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const text = input.value.trim();
  
  if (!text || aiAgent.isGenerating) return;
  
  input.value = '';
  sendBtn.disabled = true;
  
  addMessage(text, true);
  showTyping();
  
  try {
    const response = await aiAgent.generateResponse(text);
    hideTyping();
    addMessage(response, false);
  } catch (error) {
    hideTyping();
    addMessage('抱歉，我现在无法回答您的问题，请稍后再试。', false);
  } finally {
    sendBtn.disabled = false;
  }
}

function quickAsk(question) {
  const input = document.getElementById('chat-input');
  input.value = question;
  sendMessage();
}

function newChat() {
  aiAgent.clearMessages();
  chatMessages = [];
  const chatWindow = document.getElementById('chat-messages');
  if (chatWindow) chatWindow.innerHTML = '';
  
  addMessage('您好！我是数智儒乡的AI助手，很高兴为您解答关于儒家文化、《论语》、孔子生平以及齐鲁文化的问题。请问有什么可以帮您的？', false);
}

function handleKeyPress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  
  if (input) input.addEventListener('keypress', handleKeyPress);
  
  newChat();
  
  const urlParams = new URLSearchParams(window.location.search);
  const question = urlParams.get('question');
  if (question) {
    setTimeout(() => {
      quickAsk(decodeURIComponent(question));
    }, 500);
  }
});

window.sendMessage = sendMessage;
window.quickAsk = quickAsk;
window.newChat = newChat;