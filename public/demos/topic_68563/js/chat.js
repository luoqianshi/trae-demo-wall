// ==================== 对话记忆模块 ====================

let chatHistory = [];

/**
 * 构建对话系统提示词
 */
function buildSystemPrompt() {
  const photos = getAllPhotoDescriptions();
  
  let photosContext = '';
  if (photos.length > 0) {
    photosContext = photos.map((p, i) => `
照片${i + 1}（${p.date.toISOString().split('T')[0]}）:
- 描述：${p.description}
- 场景：${p.scene}
- 情绪：${p.emotion}
- 人物：${(p.subjects || []).join('、')}
- 关键细节：${(p.keyMoments || []).join('、')}
`).join('\n');
  }

  return `你是"时光说书人"，一个温暖的家庭记忆管家。你的任务是基于用户的家庭照片，回答用户关于回忆的问题。

性格设定：
- 温暖、细腻、有同理心
- 说话像一个懂你的老朋友
- 擅长从照片中发现感人的细节
- 适当使用表情符号增加亲切感

回答规则：
1. 基于提供的照片信息回答，不要编造不存在的内容
2. 如果照片信息不足，坦诚地说"从照片中看不太清楚"
3. 回答要有温度，不要太机械
4. 适当关联多张照片，发现照片之间的故事线
5. 如果用户问的问题涉及具体照片，在回答中提到照片编号
6. 回答控制在200字以内，简洁温暖

照片信息：
${photosContext || '暂无照片信息'}

请用中文回答用户的问题。`;
}

/**
 * 发送消息
 * @param {string} text - 用户输入
 */
async function sendChatMessage(text) {
  if (!text.trim()) return;

  // 添加用户消息
  addChatMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // 显示输入指示器
  showTypingIndicator();
  setSendButtonEnabled(false);

  try {
    const systemPrompt = buildSystemPrompt();
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-6) // 保留最近6轮对话
    ];

    const response = await callChatModel(messages, {
      temperature: 0.8,
      max_tokens: 500
    });

    hideTypingIndicator();
    addChatMessage('ai', response);
    chatHistory.push({ role: 'assistant', content: response });

  } catch (e) {
    hideTypingIndicator();
    addChatMessage('ai', `抱歉，出了一点小问题：${e.message}。请检查API设置后重试。`);
  }

  setSendButtonEnabled(true);
  document.getElementById('chatInput').value = '';
  document.getElementById('chatInput').focus();
}

/**
 * 添加消息到聊天界面
 */
function addChatMessage(sender, text, photos = []) {
  const container = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;

  const avatar = sender === 'ai' ? '🤖' : '😊';

  let photosHtml = '';
  if (photos.length > 0) {
    photosHtml = '<div class="msg-photos">';
    photos.forEach(p => {
      const src = p.startsWith('data:') || p.includes('/') ? p : `data:image/jpeg;base64,${p}`;
      photosHtml += `<img src="${src}" onclick="openLightbox('${src}')" alt="照片">`;
    });
    photosHtml += '</div>';
  }

  msg.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-bubble">
      ${text.replace(/\n/g, '<br>')}
      ${photosHtml}
    </div>
  `;

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

/**
 * 显示输入指示器
 */
function showTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'message ai';
  indicator.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

/**
 * 隐藏输入指示器
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

/**
 * 设置发送按钮状态
 */
function setSendButtonEnabled(enabled) {
  const btn = document.getElementById('sendBtn');
  btn.disabled = !enabled;
}

/**
 * 重置对话
 */
function resetChat() {
  chatHistory = [];
  const container = document.getElementById('chatMessages');
  container.innerHTML = `
    <div class="message ai">
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble">
        你好呀！我是你的时光说书人 ✨<br><br>
        我已经读完了你上传的所有照片，从中挖掘出了很多温暖的故事。<br><br>
        你想回忆点什么？点击左边的问题试试，或者直接问我～
      </div>
    </div>
  `;
}
