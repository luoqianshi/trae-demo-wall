let chatMessages = [];
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;
let isAiTyping = false;

const aiResponses = {
  greeting: [
    '{elderName}您好！我是{aiName}，很高兴和您聊天。今天想聊点什么呢？您可以说说小时候的事情，或者讲讲工作时候的故事。',
  ],
  childhood: [
    '童年的时光真美好啊！{elderName}，您还记得小时候最喜欢玩什么游戏吗？或者有没有什么特别难忘的事情？',
    '那时候的夏天一定很有趣吧！院子里的老槐树、一起玩耍的小伙伴，这些回忆都特别珍贵。您能再讲讲更多细节吗？',
  ],
  work: [
    '第一次领工资的感觉一定很特别！{elderName}，您当时把工资用来做什么了？是给家里买了东西，还是存起来了？',
    '工作那些年一定有很多故事吧？有没有什么让您特别难忘的同事或者经历？',
  ],
  family: [
    '结婚那天一定是您人生中最幸福的日子之一！{elderName}，您还记得当时的心情吗？婚礼上有什么有趣的事情吗？',
    '孩子出生的那一刻，是不是觉得一切都值得了？初为人母/人父的感觉是什么样的？',
  ],
  default: [
    '这个故事真好听！{elderName}，您能再讲讲更多细节吗？比如当时天气怎么样，周围有什么人？',
    '真是珍贵的回忆啊！后来呢？发生了什么事情？',
    '我听得入迷了！继续讲下去吧，我在认真听呢。',
    '这些故事太宝贵了，我帮您记录下来，以后家人们也能听到。',
  ],
  thanks: [
    '不客气！{elderName}，能听您讲故事我也很开心。您的每一段回忆都值得被好好保存。',
  ]
};

const quickRepliesList = [
  '聊聊小时候',
  '讲讲工作的事',
  '说说家庭生活',
  '今天心情很好'
];

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function addMessage(type, content, time) {
  const msgTime = time || formatTime(new Date());
  chatMessages.push({ type, content, time: msgTime });
  renderMessages();
  scrollToBottom();
}

function renderMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = chatMessages.map(msg => {
    if (msg.type === 'typing') {
      return `
        <div class="chat-message chat-message-ai">
          <div class="chat-avatar chat-avatar-ai">${AppState.settings.aiName.charAt(0)}</div>
          <div class="chat-bubble">
            <div class="typing-indicator">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        </div>
      `;
    }

    const isAi = msg.type === 'ai';
    const avatarText = isAi ? AppState.settings.aiName.charAt(0) : AppState.settings.elderName.charAt(0);
    return `
      <div class="chat-message ${isAi ? 'chat-message-ai' : 'chat-message-user'}">
        <div class="chat-avatar ${isAi ? 'chat-avatar-ai' : 'chat-avatar-user'}">${avatarText}</div>
        <div>
          <div class="chat-bubble">${msg.content}</div>
          <div class="chat-bubble-time" style="text-align: ${isAi ? 'left' : 'right'};">${msg.time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderQuickReplies() {
  const container = document.getElementById('chat-quick-replies');
  if (!container) return;

  container.innerHTML = quickRepliesList.map(reply => `
    <button class="chat-quick-reply" onclick="sendQuickReply('${reply}')">${reply}</button>
  `).join('');
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
}

function replaceTemplate(text) {
  return text.replace(/{elderName}/g, AppState.settings.elderName)
             .replace(/{aiName}/g, AppState.settings.aiName);
}

function getAiResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  let responses;

  if (lowerMsg.includes('小时候') || lowerMsg.includes('童年') || lowerMsg.includes('夏天') || lowerMsg.includes('上学')) {
    responses = aiResponses.childhood;
  } else if (lowerMsg.includes('工作') || lowerMsg.includes('上班') || lowerMsg.includes('工资') || lowerMsg.includes('工厂')) {
    responses = aiResponses.work;
  } else if (lowerMsg.includes('结婚') || lowerMsg.includes('孩子') || lowerMsg.includes('家人') || lowerMsg.includes('老伴')) {
    responses = aiResponses.family;
  } else if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢')) {
    responses = aiResponses.thanks;
  } else {
    responses = aiResponses.default;
  }

  return replaceTemplate(responses[Math.floor(Math.random() * responses.length)]);
}

function showTypingIndicator() {
  isAiTyping = true;
  chatMessages.push({ type: 'typing' });
  renderMessages();
  scrollToBottom();
}

function removeTypingIndicator() {
  isAiTyping = false;
  chatMessages = chatMessages.filter(msg => msg.type !== 'typing');
}

function sendAiResponse(delay = 1500) {
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    const lastUserMsg = chatMessages.filter(m => m.type === 'user').pop();
    const response = getAiResponse(lastUserMsg ? lastUserMsg.content : '');
    addMessage('ai', response);
  }, delay);
}

function sendQuickReply(text) {
  if (isAiTyping) return;
  addMessage('user', text);
  renderQuickReplies();
  sendAiResponse(1000 + Math.random() * 1000);
}

function sendUserMessage(text) {
  if (!text.trim() || isAiTyping) return;
  addMessage('user', text);
  sendAiResponse(1000 + Math.random() * 1500);
}

function startRecording() {
  if (isRecording) return;
  isRecording = true;
  recordingSeconds = 0;

  const overlay = document.getElementById('recording-overlay');
  const btn = document.getElementById('voice-record-btn');
  const btnText = document.getElementById('record-btn-text');
  const timer = document.getElementById('recording-timer');

  if (overlay) overlay.classList.add('active');
  if (btn) btn.classList.add('recording');
  if (btnText) btnText.textContent = '松开结束';

  recordingTimer = setInterval(() => {
    recordingSeconds++;
    const mins = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
    const secs = (recordingSeconds % 60).toString().padStart(2, '0');
    if (timer) timer.textContent = `${mins}:${secs}`;

    if (recordingSeconds >= 60) {
      stopRecording();
    }
  }, 1000);
}

function stopRecording(cancel = false) {
  if (!isRecording) return;
  isRecording = false;

  clearInterval(recordingTimer);
  recordingTimer = null;

  const overlay = document.getElementById('recording-overlay');
  const btn = document.getElementById('voice-record-btn');
  const btnText = document.getElementById('record-btn-text');

  if (overlay) overlay.classList.remove('active');
  if (btn) btn.classList.remove('recording');
  if (btnText) btnText.textContent = '按住说话';

  if (!cancel && recordingSeconds >= 1) {
    const simulatedTexts = [
      '我记得小时候，每到过年的时候，家里就特别热闹。',
      '那时候在工厂上班，大家关系都特别好，就像一家人一样。',
      '年轻的时候，我和你爷爷/奶奶是经人介绍认识的。',
      '孩子小时候特别乖，从来不哭闹，邻居们都夸他/她懂事。',
      '今天天气真好，想起了很多以前的事情。',
    ];
    const randomText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
    sendUserMessage(randomText);
  }
}

function initChatPage() {
  if (chatMessages.length === 0) {
    chatMessages = [];
    addMessage('ai', replaceTemplate(aiResponses.greeting[0]));
  }
  renderQuickReplies();
  renderMessages();
  scrollToBottom();

  const recordBtn = document.getElementById('voice-record-btn');
  if (recordBtn) {
    recordBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      startRecording();
    });

    recordBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      stopRecording();
    });

    recordBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      startRecording();
    });

    recordBtn.addEventListener('mouseup', function(e) {
      e.preventDefault();
      stopRecording();
    });

    recordBtn.addEventListener('mouseleave', function(e) {
      if (isRecording) {
        stopRecording(true);
      }
    });
  }
}

window.initChatPage = initChatPage;
window.sendQuickReply = sendQuickReply;
