/**
 * AI问答助手模块
 * 功能：聊天式界面、历史消息、预设问答、思考动画、答案匹配
 */
(function () {
  let messages = [];
  let isThinking = false;

  function getPresets() {
    return (window.AppData && window.AppData.qaPresets) || [
      { q: '这次会议的核心结论是什么？', a: '本次会议纪要的核心结论包括三点：第一，Q3季度销售目标上调15%；第二，新产品线将于下月初启动内测；第三，团队需要扩充3名后端工程师以支持后续开发。' },
      { q: '有哪些待办事项需要跟进？', a: '目前确定的待办事项如下：\n1. 产品经理需在本周五前提交PRD文档；\n2. 技术负责人评估微服务拆分方案；\n3. 市场部准备下月发布会物料；\n4. HR启动后端工程师招聘流程。' },
      { q: '各位发言人的主要观点是什么？', a: '发言人A主要强调数据驱动决策的重要性，建议引入更多自动化分析工具；发言人B关注用户体验，提出需要在下个迭代中优化核心流程的交互设计；发言人C从成本角度分析，认为应当优先投入ROI最高的功能模块。' }
    ];
  }

  function renderHeader() {
    return `
      <div class="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <i data-lucide="bot" class="w-4 h-4 text-white"></i>
        </div>
        <div>
          <h3 class="font-semibold text-gray-800 text-sm">AI 问答助手</h3>
          <p class="text-[10px] text-gray-400">基于当前会议内容智能解答</p>
        </div>
      </div>
    `;
  }

  function renderMessage(msg, index) {
    const isUser = msg.role === 'user';
    return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]">
        <div class="flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}">
          <div class="flex-shrink-0 w-7 h-7 rounded-full ${isUser ? 'bg-gray-200' : 'bg-blue-600'} flex items-center justify-center mt-0.5">
            <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-3.5 h-3.5 ${isUser ? 'text-gray-600' : 'text-white'}"></i>
          </div>
          <div class="${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm leading-relaxed shadow-sm">
            ${msg.html || escapeHtml(msg.text)}
          </div>
        </div>
      </div>
    `;
  }

  function renderThinking() {
    return `
      <div id="qa-thinking" class="flex justify-start animate-[fadeIn_0.2s_ease-out]">
        <div class="flex gap-2 max-w-[80%]">
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
            <i data-lucide="bot" class="w-3.5 h-3.5 text-white"></i>
          </div>
          <div class="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-tl-none text-sm shadow-sm flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
            <span class="ml-1 text-xs">思考中</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderChatArea() {
    return `
      <div id="qa-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div class="flex justify-start">
          <div class="flex gap-2 max-w-[80%]">
            <div class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
              <i data-lucide="bot" class="w-3.5 h-3.5 text-white"></i>
            </div>
            <div class="bg-gray-100 text-gray-700 px-3 py-2 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
              你好！我是你的AI问答助手。可以针对当前会议内容为你解答问题，也可以尝试点击下方预设问题。
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPresets() {
    const presets = getPresets();
    let html = '<div class="px-4 py-2 bg-white border-t border-gray-200 flex gap-2 overflow-x-auto">';
    presets.forEach((p, i) => {
      html += `
        <button data-preset="${i}" class="qa-preset flex-shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs text-gray-600 transition-colors text-left truncate max-w-[200px]">
          ${escapeHtml(p.q)}
        </button>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderInputArea() {
    return `
      <div class="px-4 py-3 bg-white border-t border-gray-200">
        <div class="flex items-end gap-2">
          <div class="flex-1 relative">
            <textarea id="qa-input" rows="1" placeholder="输入你的问题..." class="w-full px-3 py-2 pr-10 rounded-xl border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"></textarea>
            <button id="qa-send" class="absolute right-2 bottom-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function render(container) {
    container.innerHTML = `
      <div class="flex flex-col h-full">
        ${renderHeader()}
        ${renderChatArea()}
        ${renderPresets()}
        ${renderInputArea()}
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function nl2br(html) {
    return html.replace(/\n/g, '<br>');
  }

  function appendMessage(msg) {
    const container = document.getElementById('qa-messages');
    if (!container) return;
    const html = renderMessage(msg, messages.length - 1);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper.firstElementChild);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  function showThinking() {
    const container = document.getElementById('qa-messages');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderThinking();
    container.appendChild(wrapper.firstElementChild);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  function removeThinking() {
    const el = document.getElementById('qa-thinking');
    if (el) el.remove();
  }

  function findAnswer(question) {
    const presets = getPresets();
    const q = question.trim();
    // 简单匹配：包含或相等
    let best = presets[0];
    let maxScore = -1;
    presets.forEach(p => {
      const pq = p.q;
      let score = 0;
      if (pq === q) score = 100;
      else if (pq.includes(q) || q.includes(pq)) score = 50;
      else {
        // 简单关键词重叠
        const a = pq.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
        const b = q.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
        let overlap = 0;
        for (let i = 0; i < b.length; i++) {
          if (a.includes(b[i])) overlap++;
        }
        score = overlap;
      }
      if (score > maxScore) {
        maxScore = score;
        best = p;
      }
    });
    return best.a;
  }

  function handleSend() {
    if (isThinking) return;
    const input = document.getElementById('qa-input');
    const text = input.value.trim();
    if (!text) return;

    // 用户消息
    messages.push({ role: 'user', text });
    appendMessage({ role: 'user', text });
    input.value = '';
    input.style.height = 'auto';

    isThinking = true;
    showThinking();

    const delay = Math.max(800, Math.random() * 1500 + 500);
    setTimeout(() => {
      removeThinking();
      const answer = findAnswer(text);
      const msg = { role: 'assistant', text: answer, html: nl2br(escapeHtml(answer)) };
      messages.push(msg);
      appendMessage(msg);
      isThinking = false;

      // 如果有 typeWriter，对纯文本使用
      const container = document.getElementById('qa-messages');
      const lastBubble = container.lastElementChild.querySelector('.bg-gray-100, .bg-blue-600');
      if (lastBubble && window.App && App.typeWriter && !msg.html.includes('<br>')) {
        lastBubble.innerHTML = '';
        App.typeWriter(lastBubble, answer, 20);
      }
    }, delay);
  }

  function bindEvents() {
    const sendBtn = document.getElementById('qa-send');
    const input = document.getElementById('qa-input');

    sendBtn.addEventListener('click', handleSend);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 128) + 'px';
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.qa-preset');
      if (!btn) return;
      const idx = parseInt(btn.dataset.preset, 10);
      const presets = getPresets();
      if (presets[idx]) {
        input.value = presets[idx].q;
        handleSend();
      }
    });
  }

  function init() {
    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  window.QaModule = { render, init };
})();
