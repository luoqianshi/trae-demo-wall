// ===== State =====
let currentView = 'chat';
let currentSessionId = null;
let sessions = [];
let config = {};
let isGenerating = false;
let messageCount = 0;

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initNavigation();
  initChat();
  initConfig();
  initArchive();
  initProfile();
  loadConfig().then(() => {
    loadSessions();
    checkConnection();
  });
});

// ===== Navigation =====
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `${view}-view`));

  if (view === 'archive') loadArchive();
  if (view === 'profile') loadProfile();
  if (view === 'config') loadConfigIntoForm();

  lucide.createIcons();
}

// ===== Config =====
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    config = await res.json();
    document.querySelectorAll('#companion-name').forEach(el => el.textContent = config.companionName || '天一');
    document.getElementById('companion-name-footer').textContent = config.companionName || '天一';
  } catch (e) {
    console.error('加载配置失败', e);
  }
}

function loadConfigIntoForm() {
  document.getElementById('use-local').checked = config.useLocal !== false;
  document.getElementById('ollama-url').value = config.ollamaUrl || 'http://localhost:11434';
  document.getElementById('model-name').value = config.modelName || 'granite4.1:3b';
  document.getElementById('api-url').value = config.apiUrl || '';
  document.getElementById('api-key').value = config.apiKey || '';
  document.getElementById('api-model-name').value = config.modelName || '';
  document.getElementById('companion-name-input').value = config.companionName || '天一';
  document.getElementById('system-prompt').value = config.systemPrompt || '';

  toggleApiConfig(config.useLocal !== false);

  document.querySelectorAll('.personality-card').forEach(card => {
    card.classList.toggle('active', card.dataset.personality === (config.personality || 'gentle'));
  });
}

function initConfig() {
  document.getElementById('use-local').addEventListener('change', (e) => {
    toggleApiConfig(e.target.checked);
  });

  document.getElementById('test-connection').addEventListener('click', async () => {
    const resultEl = document.getElementById('test-result');
    resultEl.textContent = '检测中...';
    resultEl.className = 'test-result';
    try {
      const body = {
        useLocal: document.getElementById('use-local').checked,
        ollamaUrl: document.getElementById('ollama-url').value,
        apiUrl: document.getElementById('api-url').value
      };
      const res = await fetch('/api/config/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        resultEl.textContent = data.models ? `连接成功，可用模型: ${data.models.join(', ')}` : data.message;
        resultEl.className = 'test-result success';
      } else {
        resultEl.textContent = data.error || '连接失败';
        resultEl.className = 'test-result error';
      }
    } catch (e) {
      resultEl.textContent = '请求失败: ' + e.message;
      resultEl.className = 'test-result error';
    }
  });

  document.querySelectorAll('.personality-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.personality-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  document.getElementById('save-config').addEventListener('click', async () => {
    const personalityCard = document.querySelector('.personality-card.active');
    const updates = {
      useLocal: document.getElementById('use-local').checked,
      ollamaUrl: document.getElementById('ollama-url').value,
      modelName: document.getElementById('model-name').value,
      apiUrl: document.getElementById('api-url').value,
      apiKey: document.getElementById('api-key').value,
      companionName: document.getElementById('companion-name-input').value,
      systemPrompt: document.getElementById('system-prompt').value,
      personality: personalityCard ? personalityCard.dataset.personality : 'gentle'
    };
    try {
      await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      await loadConfig();
      alert('设置已保存');
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  });
}

function toggleApiConfig(useLocal) {
  document.getElementById('ollama-config').classList.toggle('hidden', !useLocal);
  document.getElementById('api-config').classList.toggle('hidden', useLocal);
}

async function checkConnection() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    if (config.useLocal) {
      const url = new URL(config.ollamaUrl || 'http://localhost:11434');
      const res = await fetch(`${config.ollamaUrl || 'http://localhost:11434'}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        dot.className = 'status-dot online';
        text.textContent = '已连接';
        return;
      }
    }
    dot.className = 'status-dot offline';
    text.textContent = '离线';
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = '离线';
  }
}

// ===== Chat =====
function initChat() {
  document.getElementById('new-session-btn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '新对话' }) });
      const data = await res.json();
      currentSessionId = data.id;
      await loadSessions();
      openSession(currentSessionId);
    } catch (e) {
      console.error(e);
    }
  });

  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('message-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.getElementById('message-input').addEventListener('input', autoResizeTextarea);
}

async function loadSessions() {
  try {
    const res = await fetch('/api/sessions');
    sessions = await res.json();
    renderSessions();
  } catch (e) {
    console.error(e);
  }
}

function renderSessions() {
  const list = document.getElementById('session-list');
  list.innerHTML = '';

  const groups = {
    '今天': [],
    '昨天': [],
    '上周': [],
    '更早': []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    if (d >= today) groups['今天'].push(s);
    else if (d >= yesterday) groups['昨天'].push(s);
    else if (d >= weekAgo) groups['上周'].push(s);
    else groups['更早'].push(s);
  }

  for (const [label, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const groupEl = document.createElement('div');
    groupEl.className = 'session-group';
    groupEl.innerHTML = `<div class="session-group-label">${label}</div>`;
    for (const s of items) {
      const item = document.createElement('div');
      item.className = 'session-item' + (s.id == currentSessionId ? ' active' : '');
      item.dataset.id = s.id;
      item.innerHTML = `
        <div class="session-item-title">${escapeHtml(s.title)}</div>
        <div class="session-item-preview">${escapeHtml(s.summary || '还没有消息...')}</div>
        <button class="session-item-delete" title="删除">
          <i data-lucide="trash-2" width="14" height="14"></i>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.session-item-delete')) {
          e.stopPropagation();
          deleteSession(s.id);
        } else {
          openSession(s.id);
        }
      });
      groupEl.appendChild(item);
    }
    list.appendChild(groupEl);
  }

  lucide.createIcons();
}

async function deleteSession(id) {
  if (!confirm('确定要删除这段对话吗？')) return;
  try {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (currentSessionId == id) {
      currentSessionId = null;
      clearChat();
    }
    await loadSessions();
  } catch (e) {
    console.error(e);
  }
}

async function openSession(id) {
  currentSessionId = id;
  renderSessions();
  const session = sessions.find(s => s.id == id);
  if (session) {
    document.getElementById('current-title').textContent = session.title;
    document.getElementById('info-words').textContent = session.wordCount || 0;
    document.getElementById('info-mood').textContent = session.mood || '温柔陪伴中';
    // 显示标签
    let tags = [];
    try { tags = JSON.parse(session.tags || '[]'); } catch { tags = []; }
    updateInfoTags(tags);
  }

  try {
    const res = await fetch(`/api/sessions/${id}/messages`);
    const messages = await res.json();
    renderMessages(messages);
  } catch (e) {
    console.error(e);
  }
}

function clearChat() {
  document.getElementById('messages-container').innerHTML = '';
  document.getElementById('current-title').textContent = '新对话';
  document.getElementById('info-words').textContent = '0';
  document.getElementById('info-mood').textContent = '温柔陪伴中';
  updateInfoTags([]);
}

function renderMessages(messages) {
  const container = document.getElementById('messages-container');
  container.innerHTML = '';
  for (const msg of messages) {
    appendMessage(msg.role, msg.content, msg.createdAt, false);
  }
  scrollToBottom();
}

function appendMessage(role, content, timeStr, animate = true) {
  const container = document.getElementById('messages-container');
  const msgEl = document.createElement('div');
  msgEl.className = `message ${role}`;
  if (!animate) msgEl.style.animation = 'none';

  const time = timeStr ? formatTime(timeStr) : formatTime(new Date());
  const avatarText = role === 'user' ? '你' : (config.companionName || '天一').charAt(0);

  msgEl.innerHTML = `
    <div class="message-avatar">${avatarText}</div>
    <div>
      <div class="message-content">${renderMarkdown(content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
  container.appendChild(msgEl);
  scrollToBottom();
}

function appendTypingIndicator() {
  const container = document.getElementById('messages-container');
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="message-avatar">${(config.companionName || '天一').charAt(0)}</div>
    <div>
      <div class="message-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(el);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || isGenerating) return;

  if (!currentSessionId) {
    // Create a new session
    try {
      const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text.slice(0, 20) }) });
      const data = await res.json();
      currentSessionId = data.id;
      await loadSessions();
    } catch (e) {
      alert('创建会话失败');
      return;
    }
  }

  input.value = '';
  autoResizeTextarea();
  appendMessage('user', text, null, true);
  isGenerating = true;
  appendTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSessionId, message: text })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantMsg = '';
    let msgEl = null;

    removeTypingIndicator();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) {
            appendMessage('assistant', '抱歉，出了点问题：' + data.error, null, false);
            isGenerating = false;
            return;
          }
          if (data.chunk) {
            assistantMsg += data.chunk;
            if (!msgEl) {
              msgEl = document.createElement('div');
              msgEl.className = 'message assistant';
              msgEl.innerHTML = `
                <div class="message-avatar">${(config.companionName || '天一').charAt(0)}</div>
                <div>
                  <div class="message-content">${renderMarkdown(assistantMsg)}</div>
                  <div class="message-time">${formatTime(new Date())}</div>
                </div>
              `;
              document.getElementById('messages-container').appendChild(msgEl);
            } else {
              msgEl.querySelector('.message-content').innerHTML = renderMarkdown(assistantMsg);
            }
            scrollToBottom();
          }
          if (data.done) {
            isGenerating = false;
            messageCount++;
            // Update word count display
            const session = sessions.find(s => s.id == currentSessionId);
            if (session) {
              document.getElementById('info-words').textContent = (session.wordCount || 0) + text.length + assistantMsg.length;
            }
            // 触发自动归档（后台分析标题、摘要、标签、情绪）
            autoArchive(currentSessionId);
            return;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (e) {
    removeTypingIndicator();
    appendMessage('assistant', '连接失败了，请检查 Ollama 是否已启动，或网络设置是否正确。', null, false);
    isGenerating = false;
  }
}

async function autoArchive(sessionId) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/auto-archive`, { method: 'POST' });
    const data = await res.json();
    if (data.success && data.archive) {
      // 更新会话列表
      await loadSessions();
      // 更新标题
      document.getElementById('current-title').textContent = data.archive.title || '对话';
      // 更新标签
      updateInfoTags(data.archive.tags || []);
      // 更新心情
      document.getElementById('info-mood').textContent = data.archive.mood || '温柔陪伴中';
    }
  } catch {
    // 归档失败静默处理，不影响对话体验
  }
}

function updateInfoTags(tags) {
  const container = document.getElementById('info-tags');
  if (!container) return;
  container.innerHTML = '';
  if (tags.length === 0) {
    container.innerHTML = '<span class="tag" style="color:var(--text-muted)">暂无标签</span>';
    return;
  }
  for (const tag of tags) {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    container.appendChild(el);
  }
}

function scrollToBottom() {
  const container = document.getElementById('messages-container');
  container.scrollTop = container.scrollHeight;
}

function autoResizeTextarea() {
  const textarea = document.getElementById('message-input');
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ===== Archive =====
function initArchive() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadArchive();
    });
  });

  document.getElementById('archive-search').addEventListener('input', debounce(loadArchive, 300));

  // 手动写思绪
  document.getElementById('write-thought-btn').addEventListener('click', openManualModal);
  document.getElementById('manual-cancel').addEventListener('click', closeManualModal);
  document.getElementById('manual-save').addEventListener('click', saveManualArchive);
  document.getElementById('manual-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeManualModal();
  });
}

function openManualModal() {
  document.getElementById('manual-modal-overlay').classList.add('show');
  document.getElementById('manual-title').value = '';
  document.getElementById('manual-content').value = '';
  document.getElementById('manual-mood').value = '温暖';
  document.getElementById('manual-tags').value = '';
  document.getElementById('manual-title').focus();
}

function closeManualModal() {
  document.getElementById('manual-modal-overlay').classList.remove('show');
}

async function saveManualArchive() {
  const title = document.getElementById('manual-title').value.trim();
  const content = document.getElementById('manual-content').value.trim();
  const mood = document.getElementById('manual-mood').value.trim() || '温暖';
  const tagsStr = document.getElementById('manual-tags').value.trim();
  const tags = tagsStr ? tagsStr.split(/[,，、\s]+/).filter(Boolean) : [];

  if (!content) {
    alert('写点什么吧...');
    return;
  }

  const btn = document.getElementById('manual-save');
  btn.disabled = true;
  btn.textContent = '保存中...';

  try {
    const res = await fetch('/api/archive/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || '一条思绪', content, mood, tags })
    });
    const data = await res.json();
    if (data.success) {
      closeManualModal();
      await loadArchive();
    } else {
      alert(data.error || '保存失败');
    }
  } catch (e) {
    alert('保存失败: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '保存';
  }
}

async function loadArchive() {
  const tag = document.querySelector('.filter-btn.active')?.dataset.tag || '';
  const search = document.getElementById('archive-search').value;
  try {
    const res = await fetch(`/api/archive?tag=${encodeURIComponent(tag)}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    renderArchive(data.sessions, data.stats);
  } catch (e) {
    console.error(e);
  }
}

function renderArchive(sessions, stats) {
  document.getElementById('stat-total').textContent = (stats.totalSessions || 0) + ' 段';
  document.getElementById('stat-month').textContent = (stats.monthSessions || 0) + ' 段';
  document.getElementById('stat-words').textContent = ((stats.totalWords || 0) / 10000).toFixed(1) + ' 万字';

  const list = document.getElementById('archive-list');
  list.innerHTML = '';

  const grouped = {};
  for (const s of sessions) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  for (const [month, items] of Object.entries(grouped)) {
    const monthEl = document.createElement('div');
    monthEl.innerHTML = `<div class="archive-month">${month}</div>`;
    for (const s of items) {
      const d = new Date(s.createdAt);
      const item = document.createElement('div');
      item.className = 'archive-item';
      item.innerHTML = `
        <div class="archive-date">
          <span class="archive-date-day">${d.getDate()}</span>
          <span class="archive-date-month">${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}</span>
        </div>
        <div class="archive-content">
          <div class="archive-title">${escapeHtml(s.title)}</div>
          <div class="archive-summary">${escapeHtml(s.summary || '还没有摘要...')}</div>
          <div class="archive-meta">
            <span class="archive-mood">${escapeHtml(s.mood || '温暖')}</span>
            <span>${escapeHtml(s.tags || '').replace(/\[|\]|"/g, '').split(',').filter(Boolean).join(' · ') || '未分类'}</span>
            <span class="archive-wordcount">${s.wordCount || 0} 字</span>
          </div>
        </div>
      `;
      item.addEventListener('click', () => {
        openSession(s.id);
        switchView('chat');
      });
      monthEl.appendChild(item);
    }
    list.appendChild(monthEl);
  }
}

// ===== Profile =====
function initProfile() {
  document.querySelectorAll('.intensity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('analyze-profile').addEventListener('click', async () => {
    const btn = document.getElementById('analyze-profile');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> 分析中...';
    lucide.createIcons();
    try {
      const res = await fetch('/api/profile/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fillProfileForm(data.content);
        alert('画像分析完成');
      } else {
        alert(data.error || '分析失败');
      }
    } catch (e) {
      alert('分析失败: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="refresh-cw"></i> 重新分析';
      lucide.createIcons();
    }
  });

  document.getElementById('save-profile').addEventListener('click', async () => {
    const content = {};
    document.querySelectorAll('.profile-textarea').forEach(ta => {
      content[ta.dataset.field] = ta.value;
    });
    const enabled = document.getElementById('profile-enabled').checked;
    const intensity = document.querySelector('.intensity-btn.active')?.dataset.intensity || 'medium';
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, enabled, intensity })
      });
      alert('画像已保存');
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  });
}

async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    if (data) {
      document.getElementById('profile-enabled').checked = data.enabled !== false;
      document.querySelectorAll('.intensity-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.intensity === (data.intensity || 'medium'));
      });
      fillProfileForm(data.content || {});
    }
  } catch (e) {
    console.error(e);
  }
}

function fillProfileForm(content) {
  document.querySelectorAll('.profile-textarea').forEach(ta => {
    ta.value = content[ta.dataset.field] || '';
  });
}

// ===== Utilities =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function renderMarkdown(text) {
  // Simple markdown renderer
  let html = escapeHtml(text);

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Paragraphs
  const lines = html.split('\n');
  html = lines.map(line => {
    if (line.trim() && !line.startsWith('<')) {
      return '<p>' + line + '</p>';
    }
    return line;
  }).join('\n');

  // Fix nested lists
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  return html;
}
