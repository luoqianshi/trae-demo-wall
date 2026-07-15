/**
 * App - 医脑AI 主应用入口
 * 负责UI交互、事件绑定、组件协调
 */

(function () {
  'use strict';

  // ============ 状态管理 ============
  const state = {
    isProcessing: false,
    uploadedFiles: [],      // {file: File, parsed: {name, content, size}, status: 'pending'|'parsing'|'done'|'error'}
    agent: null,
    llm: null,
    parser: null,
    currentThinkingMsg: null,
    currentStreamMsg: null
  };

  // ============ DOM引用 ============
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    sidebar: $('#sidebar'),
    btnToggleSidebar: $('#btn-toggle-sidebar'),
    btnOpenSidebar: $('#btn-open-sidebar'),
    btnNewSession: $('#btn-new-session'),
    sessionList: $('#session-list'),
    skillList: $('#skill-list'),
    btnSettings: $('#btn-settings'),
    btnCloseSettings: $('#btn-close-settings'),
    settingsPanel: $('#settings-panel'),
    inputApiKey: $('#input-api-key'),
    btnToggleKeyVisibility: $('#btn-toggle-key-visibility'),
    apiKeyStatus: $('#api-key-status'),
    selectProvider: $('#select-provider'),
    selectModel: $('#select-model'),
    inputApiBase: $('#input-api-base'),
    selectLearningModel: $('#select-learning-model'),
    btnSaveSettings: $('#btn-save-settings'),
    messages: $('#messages'),
    userInput: $('#user-input'),
    btnSend: $('#btn-send'),
    fileInput: $('#file-input'),
    fileUploadArea: $('#file-upload-area'),
    fileChips: $('#file-chips'),
    agentStatus: $('#agent-status'),
    previewPanel: $('#preview-panel'),
    previewContent: $('#preview-content'),
    btnTogglePreview: $('#btn-toggle-preview'),
    btnClosePreview: $('#btn-close-preview'),
    currentSessionTitle: $('#current-session-title')
  };

  // ============ 初始化 ============
  function init() {
    // 创建核心模块
    state.llm = new LLMClient();
    state.llm.loadConfig();
    state.parser = new FileParser();
    state.agent = new ReActAgent(state.llm);

    // 注册Skills
    registerSkills();

    // 加载设置到UI
    loadSettingsToUI();

    // 渲染Skill列表
    renderSkillList();

    // 绑定事件
    bindEvents();

    // 自动展开预览面板
    dom.previewPanel.classList.remove('hidden');
  }

  // ============ 注册Skills ============
  function registerSkills() {
    for (const [id, SkillClass] of Object.entries(window.SkillRegistry || {})) {
      const instance = new SkillClass();
      state.agent.registerSkill(instance);
    }
  }

  // ============ 设置管理 ============
  function loadSettingsToUI() {
    const saved = localStorage.getItem('yinao_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.apiKey) dom.inputApiKey.value = config.apiKey;
        if (config.provider) dom.selectProvider.value = config.provider;
        if (config.model) dom.selectModel.value = config.model;
        if (config.baseUrl) dom.inputApiBase.value = config.baseUrl;
        if (config.learningModel) dom.selectLearningModel.value = config.learningModel;
      } catch (e) {}
    }
  }

  function saveSettings() {
    state.llm.apiKey = dom.inputApiKey.value.trim();
    state.llm.provider = dom.selectProvider.value;
    state.llm.model = dom.selectModel.value;
    state.llm.baseUrl = dom.inputApiBase.value.trim();

    const config = {
      apiKey: state.llm.apiKey,
      provider: state.llm.provider,
      model: state.llm.model,
      baseUrl: state.llm.baseUrl,
      learningModel: dom.selectLearningModel.value
    };

    localStorage.setItem('yinao_config', JSON.stringify(config));
    state.llm.saveConfig();

    // 显示状态
    const validation = state.llm.validateApiKey();
    dom.apiKeyStatus.textContent = validation.message;
    dom.apiKeyStatus.className = 'setting-status ' + (validation.valid ? 'success' : 'error');
  }

  // ============ Skill列表渲染 ============
  function renderSkillList() {
    const skills = state.agent.getEnabledSkills();
    dom.skillList.innerHTML = skills.map(skill => `
      <div class="skill-item" data-skill-id="${skill.id}">
        <div class="skill-icon" style="background:${skill.color}">${skill.icon}</div>
        <div class="skill-info">
          <div class="skill-name">${skill.name}</div>
          <div class="skill-desc">${skill.description}</div>
        </div>
        <div class="skill-toggle ${skill.enabled ? 'active' : ''}" data-skill-id="${skill.id}"></div>
      </div>
    `).join('');

    // 绑定Toggle事件
    dom.skillList.querySelectorAll('.skill-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.skillId;
        const skill = state.agent.skills[id];
        if (skill) {
          skill.enabled = !skill.enabled;
          e.currentTarget.classList.toggle('active');
        }
      });
    });
  }

  // ============ 事件绑定 ============
  function bindEvents() {
    // 侧边栏折叠
    dom.btnToggleSidebar.addEventListener('click', () => {
      dom.sidebar.classList.add('collapsed');
      dom.btnOpenSidebar.classList.remove('hidden');
    });

    dom.btnOpenSidebar.addEventListener('click', () => {
      dom.sidebar.classList.remove('collapsed');
      dom.btnOpenSidebar.classList.add('hidden');
    });

    // 新建会话
    dom.btnNewSession.addEventListener('click', () => {
      if (state.isProcessing) return;
      state.agent.resetContext();
      state.uploadedFiles = [];
      renderFileChips();
      dom.messages.innerHTML = '';
      dom.previewContent.innerHTML = `
        <div class="preview-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>Agent 的结构化学习产出将在这里显示</p>
        </div>`;
      dom.currentSessionTitle.textContent = '新的学习会话';
      addWelcomeMessage();
    });

    // 设置面板
    dom.btnSettings.addEventListener('click', () => {
      dom.settingsPanel.classList.remove('hidden');
    });
    dom.btnCloseSettings.addEventListener('click', () => {
      dom.settingsPanel.classList.add('hidden');
    });
    dom.btnSaveSettings.addEventListener('click', () => {
      saveSettings();
      // 简单的保存反馈
      const btn = dom.btnSaveSettings;
      const originalText = btn.textContent;
      btn.textContent = '已保存';
      btn.style.background = 'var(--success)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 1500);
    });

    // API Key可见性切换
    dom.btnToggleKeyVisibility.addEventListener('click', () => {
      const input = dom.inputApiKey;
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // 服务商切换时更新模型列表
    dom.selectProvider.addEventListener('change', () => {
      const provider = dom.selectProvider.value;
      updateModelOptions(provider);
    });

    // 预览面板
    dom.btnTogglePreview.addEventListener('click', () => {
      dom.previewPanel.classList.toggle('hidden');
    });
    dom.btnClosePreview.addEventListener('click', () => {
      dom.previewPanel.classList.add('hidden');
    });

    // 文件上传
    dom.fileInput.addEventListener('change', handleFileSelect);

    // 发送消息
    dom.btnSend.addEventListener('click', handleSend);
    dom.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // 自动调整输入框高度
    dom.userInput.addEventListener('input', () => {
      dom.userInput.style.height = 'auto';
      dom.userInput.style.height = Math.min(dom.userInput.scrollHeight, 150) + 'px';
    });
  }

  // ============ 服务商与模型联动 ============
  function updateModelOptions(provider) {
    const models = {
      deepseek: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
      ]
    };
    const options = models[provider] || models.deepseek;
    dom.selectModel.innerHTML = options
      .map(m => `<option value="${m.value}">${m.label}</option>`)
      .join('');
  }

  // ============ 文件处理 ============
  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (!state.parser.isSupported(file.name)) {
        addSystemMessage(`暂不支持 "${file.name}" 的解析。Demo阶段仅支持 Word (.docx) 格式。`, 'error');
        continue;
      }

      const fileEntry = {
        file: file,
        parsed: null,
        status: 'pending'
      };
      state.uploadedFiles.push(fileEntry);
      parseFile(fileEntry);
    }

    renderFileChips();
    // 清空input以允许重复选择同一文件
    dom.fileInput.value = '';
  }

  async function parseFile(fileEntry) {
    fileEntry.status = 'parsing';
    renderFileChips();

    try {
      fileEntry.parsed = await state.parser.parse(fileEntry.file);
      fileEntry.status = 'done';
    } catch (err) {
      fileEntry.status = 'error';
      console.error('文件解析失败:', err);
      addSystemMessage(`文件 "${fileEntry.file.name}" 解析失败：${err.message}`, 'error');
    }

    renderFileChips();
  }

  function renderFileChips() {
    if (state.uploadedFiles.length === 0) {
      dom.fileUploadArea.classList.remove('has-files');
      dom.fileChips.innerHTML = '';
      return;
    }

    dom.fileUploadArea.classList.add('has-files');
    dom.fileChips.innerHTML = state.uploadedFiles.map((entry, i) => {
      const sizeStr = state.parser.formatSize(entry.file.size);
      const loading = entry.status === 'parsing' ? '<span class="file-chip-loading">&#8635;</span>' : '';
      const statusIcon = entry.status === 'done' ? '&#10003;' : entry.status === 'error' ? '&#10007;' : loading;

      return `
        <div class="file-chip">
          ${statusIcon}
          <span>${entry.file.name}</span>
          <span class="file-chip-size">${sizeStr}</span>
          <span class="file-chip-remove" data-index="${i}">&#10005;</span>
        </div>`;
    }).join('');

    // 删除文件事件
    dom.fileChips.querySelectorAll('.file-chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        state.uploadedFiles.splice(index, 1);
        renderFileChips();
      });
    });
  }

  // ============ 发送消息 ============
  async function handleSend() {
    if (state.isProcessing) return;

    const message = dom.userInput.value.trim();
    if (!message && state.uploadedFiles.length === 0) return;

    // 检查API配置
    const validation = state.llm.validateApiKey();
    if (!validation.valid) {
      dom.settingsPanel.classList.remove('hidden');
      addSystemMessage(validation.message + ' 请先在设置中配置。', 'error');
      return;
    }

    // 等待所有文件解析完成
    const pendingFiles = state.uploadedFiles.filter(f => f.status === 'parsing');
    if (pendingFiles.length > 0) {
      addSystemMessage('正在解析上传的文件，请稍候...', 'info');
      await Promise.all(
        state.uploadedFiles
          .filter(f => f.status === 'parsing')
          .map(f => new Promise(resolve => {
            const check = setInterval(() => {
              if (f.status !== 'parsing') {
                clearInterval(check);
                resolve();
              }
            }, 200);
          }))
      );
    }

    // 收集已解析的文件
    const parsedFiles = state.uploadedFiles
      .filter(f => f.status === 'done' && f.parsed)
      .map(f => f.parsed);

    // 更新Agent上下文
    if (parsedFiles.length > 0) {
      state.agent.setUploadedFiles(parsedFiles);
    }

    // 更新会话标题
    if (message && !state.agent.sessionContext.learningGoal) {
      const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
      dom.currentSessionTitle.textContent = title;
      updateSessionList(title);
    }

    // 显示用户消息
    addUserMessage(message || '(上传了' + parsedFiles.length + '个文件)');

    // 清空输入
    dom.userInput.value = '';
    dom.userInput.style.height = 'auto';

    // 禁用发送
    setProcessing(true);

    // 处理Agent响应
    try {
      // 创建思考消息占位
      const thinkingEl = addAgentThinkingMessage();

      // 设置Agent回调
      state.agent.onThinkingUpdate = (thought) => {
        updateThinkingMessage(thinkingEl, thought);
      };

      state.agent.onSkillStart = (skillName) => {
        appendThinkingStep(thinkingEl, skillName, 'processing');
      };

      state.agent.onSkillEnd = (skillName, result) => {
        appendThinkingStep(thinkingEl, skillName, result.error ? 'error' : 'done');
      };

      state.agent.onStreamChunk = (chunk) => {
        if (!state.currentStreamMsg) {
          state.currentStreamMsg = addAgentStreamMessage();
        }
        updateStreamMessage(state.currentStreamMsg, chunk);
      };

      // 执行Agent
      const result = await state.agent.process(message, []);

      // 移除流式消息（如果存在），因为Agent会返回完整结果
      if (state.currentStreamMsg) {
        state.currentStreamMsg.remove();
        state.currentStreamMsg = null;
      }

      if (result.type === 'error') {
        addAgentErrorMessage(result.content);
      } else {
        // 显示最终答案
        addAgentFinalMessage(result.content, result.context);

        // 更新预览面板
        if (result.context) {
          renderPreview(result.context);
        }
      }

      // 完成思考消息
      finishThinkingMessage(thinkingEl);

    } catch (err) {
      console.error('处理失败:', err);
      addAgentErrorMessage('处理过程中发生错误：' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  // ============ 消息渲染 ============
  function addWelcomeMessage() {
    // 重新显示欢迎消息
    const div = document.createElement('div');
    div.className = 'message welcome-message';
    div.innerHTML = `
      <div class="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#wg)"/>
          <path d="M14 7C10.13 7 7 10.13 7 14s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.6c-3.09 0-5.6-2.51-5.6-5.6S10.91 8.4 14 8.4s5.6 2.51 5.6 5.6-2.51 5.6-5.6 5.6z" fill="#fff" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="#fff"/>
          <defs><linearGradient id="wg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">医脑AI</span></div>
        <div class="message-body">
          <p>你好！我是 <strong>医脑AI</strong>，你的智能记忆构建助手。</p>
          <p>请输入学习目标或上传资料开始学习。</p>
        </div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message user-message';
    div.innerHTML = `
      <div class="message-avatar user-avatar">你</div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">你</span></div>
        <div class="message-body"><p>${escapeHtml(text)}</p></div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
  }

  function addAgentThinkingMessage() {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
      <div class="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#tg)"/>
          <path d="M14 7C10.13 7 7 10.13 7 14s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.6c-3.09 0-5.6-2.51-5.6-5.6S10.91 8.4 14 8.4s5.6 2.51 5.6 5.6-2.51 5.6-5.6 5.6z" fill="#fff" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="#fff"/>
          <defs><linearGradient id="tg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">医脑AI</span></div>
        <div class="message-body">
          <div class="thinking-block">
            <div class="thinking-label">&#128161; Agent思考中...</div>
            <div class="thinking-steps"></div>
          </div>
        </div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function updateThinkingMessage(el, thought) {
    const label = el.querySelector('.thinking-label');
    if (label && thought) {
      label.innerHTML = `&#128161; ${escapeHtml(thought.substring(0, 100))}`;
    }
  }

  function appendThinkingStep(el, skillName, status) {
    const stepsContainer = el.querySelector('.thinking-steps');
    if (!stepsContainer) return;

    const stepEl = document.createElement('div');
    stepEl.className = 'thinking-step';

    const statusIcon = status === 'processing' ? '&#9203;' :
                       status === 'done' ? '&#10003;' : '&#10007;';
    const statusClass = status === 'done' ? 'color: var(--success)' :
                        status === 'error' ? 'color: var(--error)' : '';

    stepEl.innerHTML = `
      <span class="step-num">${statusIcon}</span>
      <span style="${statusClass}">${skillName} ${status === 'processing' ? '...' : status === 'done' ? '完成' : '失败'}</span>`;

    stepsContainer.appendChild(stepEl);
    scrollToBottom();
  }

  function finishThinkingMessage(el) {
    const label = el.querySelector('.thinking-label');
    if (label) {
      label.innerHTML = '&#9989; Agent处理完成';
    }
  }

  function addAgentStreamMessage() {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
      <div class="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#sg)"/>
          <path d="M14 7C10.13 7 7 10.13 7 14s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.6c-3.09 0-5.6-2.51-5.6-5.6S10.91 8.4 14 8.4s5.6 2.51 5.6 5.6-2.51 5.6-5.6 5.6z" fill="#fff" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="#fff"/>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">医脑AI</span></div>
        <div class="message-body">
          <div class="stream-text"></div>
        </div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function updateStreamMessage(el, chunk) {
    const textEl = el.querySelector('.stream-text');
    if (textEl) {
      textEl.innerHTML = renderMarkdown(textEl.textContent + chunk);
    }
    scrollToBottom();
  }

  function addAgentFinalMessage(text, context) {
    const div = document.createElement('div');
    div.className = 'message';

    // 如果有结构化数据，同时渲染富文本
    let bodyHtml = '';
    if (context?.finalOutput && !context.finalOutput.error) {
      bodyHtml = renderStructuredOutput(context.finalOutput);
    } else {
      bodyHtml = renderMarkdown(text);
    }

    div.innerHTML = `
      <div class="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#fg)"/>
          <path d="M14 7C10.13 7 7 10.13 7 14s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.6c-3.09 0-5.6-2.51-5.6-5.6S10.91 8.4 14 8.4s5.6 2.51 5.6 5.6-2.51 5.6-5.6 5.6z" fill="#fff" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="#fff"/>
          <defs><linearGradient id="fg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">医脑AI</span></div>
        <div class="message-body">${bodyHtml}</div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
  }

  function addAgentErrorMessage(text) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
      <div class="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#eg)"/>
          <path d="M14 7C10.13 7 7 10.13 7 14s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.6c-3.09 0-5.6-2.51-5.6-5.6S10.91 8.4 14 8.4s5.6 2.51 5.6 5.6-2.51 5.6-5.6 5.6z" fill="#fff" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="#fff"/>
          <defs><linearGradient id="eg" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-header"><span class="message-name">医脑AI</span></div>
        <div class="message-body"><div class="error-message">${escapeHtml(text)}</div></div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
  }

  function addSystemMessage(text, type) {
    const div = document.createElement('div');
    div.className = 'message';
    const cls = type === 'error' ? 'error-message' : type === 'info' ? 'thinking-block' : 'output-block-body';
    div.innerHTML = `
      <div class="message-content" style="margin: 0 auto; max-width: 820px; width: 100%;">
        <div class="message-body"><div class="${cls}">${escapeHtml(text)}</div></div>
      </div>`;
    dom.messages.appendChild(div);
    scrollToBottom();
  }

  // ============ 预览面板渲染 ============
  function renderPreview(context) {
    if (!context) return;

    const parts = [];

    // 概览
    if (context.finalOutput?.overview) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">概述</div>
          <div class="preview-card">
            <p>${escapeHtml(context.finalOutput.overview)}</p>
          </div>
        </div>`);
    }

    // 学习路径
    if (context.finalOutput?.learning_path?.steps) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">学习路径</div>
          ${context.finalOutput.learning_path.steps.map((step, i) => `
            <div class="preview-memory-item">
              <div class="preview-memory-num">${i + 1}</div>
              <div>
                <strong>${escapeHtml(step.action)}</strong>
                <p style="margin-top:4px">${escapeHtml(step.key_takeaway || '')}</p>
              </div>
            </div>
            ${i < context.finalOutput.learning_path.steps.length - 1 ? '<div class="preview-arrow">&#8595;</div>' : ''}
          `).join('')}
        </div>`);
    }

    // 记忆要点
    if (context.finalOutput?.memory_guide?.key_conclusions) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">记忆要点</div>
          ${context.finalOutput.memory_guide.key_conclusions.map((item, i) => `
            <div class="preview-card">
              <h4>${escapeHtml(item.conclusion)}</h4>
              <p style="color:var(--primary);font-style:italic">${escapeHtml(item.anchor)}</p>
            </div>
          `).join('')}
        </div>`);
    }

    // 记忆清单（来自memory_structure）
    if (context.memoryStructure?.memory_list) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">记忆清单</div>
          ${context.memoryStructure.memory_list.map((item, i) => `
            <div class="preview-memory-item">
              <div class="preview-memory-num">${i + 1}</div>
              <div>
                <strong>${escapeHtml(item.key_conclusion)}</strong>
                <p style="margin-top:4px;color:var(--text-tertiary)">${escapeHtml(item.one_line)}</p>
              </div>
            </div>
          `).join('')}
        </div>`);
    }

    // 练习题预览
    if (context.questions?.questions) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">练习题 (${context.questions.questions.length}道)</div>
          ${context.questions.questions.slice(0, 3).map((q, idx) => `
            <div class="preview-card">
              <h4>${idx + 1}. ${escapeHtml(q.question)}</h4>
              <p>难度：${q.difficulty} | 考查：${escapeHtml(q.target_knowledge)}</p>
            </div>
          `).join('')}
          ${context.questions.questions.length > 3 ? `<p style="text-align:center;color:var(--text-tertiary);font-size:12px">...还有${context.questions.questions.length - 3}道题</p>` : ''}
        </div>`);
    }

    // 自检清单
    if (context.finalOutput?.final_checklist) {
      parts.push(`
        <div class="preview-section">
          <div class="preview-section-title">自检清单</div>
          ${context.finalOutput.final_checklist.map(item => `
            <div class="preview-card" style="padding:10px 14px">
              <p style="margin:0">&#9744; ${escapeHtml(item)}</p>
            </div>
          `).join('')}
        </div>`);
    }

    if (parts.length > 0) {
      dom.previewContent.innerHTML = parts.join('');
    }
  }

  // ============ 结构化输出渲染 ============
  function renderStructuredOutput(output) {
    const parts = [];

    // 概览
    if (output.overview) {
      parts.push(`<p>${escapeHtml(output.overview)}</p>`);
    }

    // 学习路径
    if (output.learning_path?.steps) {
      parts.push(`
        <div class="output-block">
          <div class="output-block-header">&#128218; 学习路径</div>
          <div class="output-block-body">
            ${output.learning_path.steps.map(step => `
              <h3>步骤${step.step}：${escapeHtml(step.action)}</h3>
              <div class="key-point">${escapeHtml(step.content || '')}</div>
              <p><em>学完你应该能：${escapeHtml(step.expected_outcome || '')}</em></p>
            `).join('')}
          </div>
        </div>`);
    }

    // 记忆指南
    if (output.memory_guide) {
      const mg = output.memory_guide;
      parts.push(`
        <div class="output-block">
          <div class="output-block-header">&#129504; 记忆指南</div>
          <div class="output-block-body">
            ${mg.key_conclusions?.map(c => `
              <div class="key-point">
                <strong>${escapeHtml(c.conclusion)}</strong><br>
                <em>记忆锚点：${escapeHtml(c.anchor)}</em>
              </div>
            `).join('') || ''}
            ${mg.mnemonic_tips?.length ? `
              <h3>记忆技巧</h3>
              <ul>${mg.mnemonic_tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
            ` : ''}
            ${mg.common_pitfalls?.length ? `
              <h3>易错点</h3>
              <ul>${mg.common_pitfalls.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
            ` : ''}
          </div>
        </div>`);
    }

    // 练习题
    if (output.practice_section) {
      const ps = output.practice_section;
      parts.push(`
        <div class="output-block">
          <div class="output-block-header">&#9997; 练习建议</div>
          <div class="output-block-body">
            <p>共 <strong>${ps.questions_count}</strong> 道题 | ${escapeHtml(ps.difficulty_distribution)}</p>
            <p>重点考查：${ps.focus_areas?.map(f => `<span class="tag">${escapeHtml(f)}</span>`).join('') || ''}</p>
          </div>
        </div>`);
    }

    // 自检清单
    if (output.final_checklist?.length) {
      parts.push(`
        <div class="output-block">
          <div class="output-block-header">&#9989; 学完后自检</div>
          <div class="output-block-body">
            <ul>${output.final_checklist.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
          </div>
        </div>`);
    }

    return parts.join('');
  }

  // ============ 工具函数 ============
  function setProcessing(processing) {
    state.isProcessing = processing;
    dom.btnSend.disabled = processing;
    dom.userInput.disabled = processing;

    if (processing) {
      dom.agentStatus.textContent = '思考中...';
      dom.agentStatus.classList.add('thinking');
    } else {
      dom.agentStatus.textContent = '就绪';
      dom.agentStatus.classList.remove('thinking');
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.messages.scrollTop = dom.messages.scrollHeight;
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updateSessionList(title) {
    const items = dom.sessionList.querySelectorAll('.session-item');
    items.forEach(item => item.classList.remove('active'));

    const newItem = document.createElement('div');
    newItem.className = 'session-item active';
    newItem.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>${escapeHtml(title)}</span>`;
    dom.sessionList.insertBefore(newItem, dom.sessionList.firstChild);
  }

  // 简易Markdown渲染（纯文本场景，不需要完整markdown库）
  function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h3 style="font-size:15px">$1</h3>');
    html = html.replace(/^# (.*$)/gm, '<h3 style="font-size:16px">$1</h3>');
    // 列表
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    // 换行
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  // ============ 启动 ============
  document.addEventListener('DOMContentLoaded', init);

})();