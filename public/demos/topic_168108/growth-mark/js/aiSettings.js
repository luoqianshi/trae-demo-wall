/**
 * 成长印记 · AI 设置页面交互逻辑（aiSettings.js）
 *
 * 负责配置模态框的展示、交互和保存逻辑
 * 依赖：aiService.js（AIService 对象）
 */

'use strict';

const AISettings = {
  // 模态框 DOM 引用
  _modal: null,

  // ============================================================
  // 打开模态框
  // ============================================================
  openModal() {
    const modal = document.getElementById('ai-settings-modal');
    if (!modal) return;
    this._modal = modal;
    modal.style.display = 'flex';

    // 加载当前配置到表单
    this._loadConfigToForm();

    // 更新状态显示
    this._updateStatus();

    // 阻止滚动穿透
    document.body.style.overflow = 'hidden';

    // ESC 关闭
    this._bindEscKey();
  },

  // ============================================================
  // 关闭模态框
  // ============================================================
  closeModal() {
    if (!this._modal) return;
    this._modal.style.display = 'none';
    document.body.style.overflow = '';
    this._modal = null;
    this._unbindEscKey();
  },

  // ============================================================
  // ESC 键关闭
  // ============================================================
  _bindEscKey() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._escHandler);
  },

  _unbindEscKey() {
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  // ============================================================
  // 加载当前配置到表单
  // ============================================================
  _loadConfigToForm() {
    const config = AIService.getConfig();

    // API 密钥
    const keyInput = document.getElementById('ai-api-key');
    if (keyInput) keyInput.value = config.apiKey || '';

    // API 地址
    const urlSelect = document.getElementById('ai-base-url-select');
    const urlCustom = document.getElementById('ai-base-url-custom');
    if (urlSelect && urlCustom) {
      const presets = AIService.getPresets();
      const presetUrls = Object.values(presets).map(p => p.baseUrl);
      if (presetUrls.includes(config.baseUrl)) {
        urlSelect.value = config.baseUrl;
        urlCustom.style.display = 'none';
      } else if (config.baseUrl) {
        urlSelect.value = 'custom';
        urlCustom.style.display = 'block';
        urlCustom.value = config.baseUrl;
      } else {
        urlSelect.value = '';
        urlCustom.style.display = 'none';
      }
      // 更新模型列表
      this._updateModelOptions();
    }

    // 模型
    const modelInput = document.getElementById('ai-model');
    if (modelInput && config.model) {
      modelInput.value = config.model;
    }

    // 温度
    const tempInput = document.getElementById('ai-temperature');
    const tempValue = document.getElementById('ai-temp-value');
    if (tempInput) tempInput.value = config.temperature ?? 0.7;
    if (tempValue) tempValue.textContent = config.temperature ?? 0.7;

    // 最大 token
    const maxTokensInput = document.getElementById('ai-max-tokens');
    if (maxTokensInput) maxTokensInput.value = config.maxTokens ?? 1024;

    // 超时时间（毫秒转秒）
    const timeoutInput = document.getElementById('ai-timeout');
    if (timeoutInput) timeoutInput.value = (config.timeout ?? 15000) / 1000;

    // 系统提示词
    const promptInput = document.getElementById('ai-system-prompt');
    if (promptInput) promptInput.value = config.systemPrompt || AIService.getDefaultSystemPrompt();

    // 启用开关
    const enabledCheckbox = document.getElementById('ai-enabled');
    if (enabledCheckbox) enabledCheckbox.checked = config.enabled || false;
  },

  // ============================================================
  // 从表单获取配置
  // ============================================================
  _getConfigFromForm() {
    const config = {};

    const keyInput = document.getElementById('ai-api-key');
    if (keyInput) config.apiKey = keyInput.value.trim();

    const urlSelect = document.getElementById('ai-base-url-select');
    const urlCustom = document.getElementById('ai-base-url-custom');
    if (urlSelect) {
      if (urlSelect.value === 'custom') {
        config.baseUrl = urlCustom ? urlCustom.value.trim() : '';
      } else {
        config.baseUrl = urlSelect.value;
      }
    }

    const modelInput = document.getElementById('ai-model');
    if (modelInput) config.model = modelInput.value.trim();

    const tempInput = document.getElementById('ai-temperature');
    if (tempInput) config.temperature = parseFloat(tempInput.value) || 0.7;

    const maxTokensInput = document.getElementById('ai-max-tokens');
    if (maxTokensInput) config.maxTokens = parseInt(maxTokensInput.value) || 1024;

    // 超时时间（秒转毫秒）
    const timeoutInput = document.getElementById('ai-timeout');
    if (timeoutInput) {
      const sec = parseInt(timeoutInput.value) || 15;
      config.timeout = Math.max(5, Math.min(60, sec)) * 1000;
    }

    const promptInput = document.getElementById('ai-system-prompt');
    if (promptInput) config.systemPrompt = promptInput.value;

    const enabledCheckbox = document.getElementById('ai-enabled');
    if (enabledCheckbox) config.enabled = enabledCheckbox.checked;

    return config;
  },

  // ============================================================
  // 更新状态显示
  // ============================================================
  _updateStatus() {
    const status = AIService.getStatus();

    const modeEl = document.getElementById('ai-status-mode');
    const urlEl = document.getElementById('ai-status-url');

    if (modeEl) {
      if (!status.enabled) {
        modeEl.textContent = '本地模拟';
        modeEl.className = 'ai-status-value';
      } else if (status.fuseRemainingSec > 0) {
        modeEl.textContent = `熔断中（${status.fuseRemainingSec}秒）`;
        modeEl.className = 'ai-status-value';
        modeEl.style.color = '#E8836A';
      } else if (status.lastApiFailed) {
        modeEl.textContent = 'API 调用（上次失败）';
        modeEl.className = 'ai-status-value';
        modeEl.style.color = '#D4A843';
      } else {
        modeEl.textContent = 'API 调用';
        modeEl.className = 'ai-status-value ai-status-active';
        modeEl.style.color = '';
      }
    }

    if (urlEl) {
      if (status.baseUrl) {
        // 简化显示域名
        try {
          const url = new URL(status.baseUrl);
          urlEl.textContent = url.hostname;
        } catch {
          urlEl.textContent = status.baseUrl;
        }
        urlEl.className = 'ai-status-value';
      } else {
        urlEl.textContent = '未设置';
        urlEl.className = 'ai-status-value ai-status-muted';
      }
    }
  },

  // ============================================================
  // 更新模型下拉选项
  // ============================================================
  _updateModelOptions() {
    const urlSelect = document.getElementById('ai-base-url-select');
    const modelList = document.getElementById('ai-model-list');
    if (!urlSelect || !modelList) return;

    const presets = AIService.getPresets();
    let models = [];

    let currentUrl;
    if (!urlSelect.value) {
      models = [];
    } else if (urlSelect.value === 'custom') {
      const urlCustom = document.getElementById('ai-base-url-custom');
      currentUrl = urlCustom ? urlCustom.value.trim() : '';
      const allModels = new Set();
      Object.values(presets).forEach(p => p.models.forEach(m => allModels.add(m)));
      models = Array.from(allModels);
    } else {
      currentUrl = urlSelect.value;
      for (const [key, preset] of Object.entries(presets)) {
        if (preset.baseUrl === currentUrl) {
          models = preset.models;
          break;
        }
      }
    }

    // 填充 datalist 建议选项（用户仍可自由输入）
    modelList.innerHTML = '';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      modelList.appendChild(option);
    });
  },

  // ============================================================
  // 应用预设
  // ============================================================
  applyPreset(presetKey) {
    const presets = AIService.getPresets();
    const preset = presets[presetKey];
    if (!preset) return;

    const urlSelect = document.getElementById('ai-base-url-select');
    const urlCustom = document.getElementById('ai-base-url-custom');
    if (urlSelect && urlCustom) {
      urlSelect.value = preset.baseUrl;
      urlCustom.style.display = 'none';
      this._updateModelOptions();
    }

    // 提示用户
    this._showHint(`已填充常用地址，请填写 API 密钥`);
  },

  // ============================================================
  // API 地址变化
  // ============================================================
  onBaseUrlChange() {
    const urlSelect = document.getElementById('ai-base-url-select');
    const urlCustom = document.getElementById('ai-base-url-custom');
    if (!urlSelect || !urlCustom) return;

    if (urlSelect.value === 'custom') {
      urlCustom.style.display = 'block';
      urlCustom.focus();
    } else {
      urlCustom.style.display = 'none';
    }

    this._updateModelOptions();
  },

  // ============================================================
  // 温度滑块变化
  // ============================================================
  onTempChange(value) {
    const valueEl = document.getElementById('ai-temp-value');
    if (valueEl) valueEl.textContent = value;
  },

  // ============================================================
  // 切换高级设置展开/收起
  // ============================================================
  toggleAdvanced() {
    const body = document.getElementById('ai-advanced-body');
    const icon = document.getElementById('ai-advanced-icon');
    if (!body || !icon) return;

    if (body.style.display === 'none') {
      body.style.display = 'block';
      icon.style.transform = 'rotate(180deg)';
    } else {
      body.style.display = 'none';
      icon.style.transform = '';
    }
  },

  // ============================================================
  // 切换密钥显示/隐藏
  // ============================================================
  toggleKeyVisibility() {
    const input = document.getElementById('ai-api-key');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  // ============================================================
  // 重置系统提示词
  // ============================================================
  resetSystemPrompt() {
    const input = document.getElementById('ai-system-prompt');
    if (input) {
      input.value = AIService.getDefaultSystemPrompt();
      this._showHint('已恢复默认系统提示词');
    }
  },

  // ============================================================
  // 启用开关变化
  // ============================================================
  onEnabledChange(checked) {
    if (checked) {
      // 尝试启用前校验必填项
      const config = this._getConfigFromForm();
      if (!config.apiKey || !config.baseUrl || !config.model) {
        // 不阻止勾选，但提示用户
        this._showTestResult(false, '配置不完整，启用后可能无法正常工作，请填写完整信息');
      }
    }
    this._updateStatus();
  },

  // ============================================================
  // 测试连接
  // ============================================================
  async testConnection(event) {
    const btn = event ? event.currentTarget : null;
    const resultEl = document.getElementById('ai-test-result');

    // 先临时保存当前表单配置到 AIService（不持久化）
    const config = this._getConfigFromForm();
    const originalConfig = AIService.getConfig();

    // 临时应用配置
    AIService._config = { ...originalConfig, ...config, enabled: true };

    try {
      // 按钮 loading 状态
      if (btn) {
        btn.disabled = true;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
          <svg class="ai-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          测试中...
        `;
      }

      const result = await AIService.testConnection();

      // 恢复原始配置
      AIService._config = originalConfig;

      // 显示结果
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.className = 'ai-test-result ' + (result.success ? 'ai-test-success' : 'ai-test-error');
        resultEl.textContent = result.message;
      }

      // 恢复按钮
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          测试连接
        `;
      }

    } catch (err) {
      // 恢复原始配置
      AIService._config = originalConfig;

      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.className = 'ai-test-result ai-test-error';
        resultEl.textContent = '测试异常：' + (err.message || String(err));
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          测试连接
        `;
      }
    }
  },

  // ============================================================
  // 保存配置
  // ============================================================
  save() {
    const config = this._getConfigFromForm();

    // 基本校验
    if (config.enabled) {
      if (!config.apiKey) {
        this._showTestResult(false, '请填写 API 密钥');
        return;
      }
      if (!config.baseUrl) {
        this._showTestResult(false, '请填写 API 地址');
        return;
      }
      if (!config.model) {
        this._showTestResult(false, '请选择模型');
        return;
      }
    }

    // 保存
    AIService.saveConfig(config);

    // 更新状态显示
    this._updateStatus();

    // 提示保存成功
    this._showTestResult(true, '配置已保存');

    // 延迟关闭
    setTimeout(() => {
      this.closeModal();
    }, 800);

    console.log('[成长印记] AI 配置已保存', {
      enabled: config.enabled,
      baseUrl: config.baseUrl,
      model: config.model
    });
  },

  // ============================================================
  // 清空表单
  // ============================================================
  clearForm() {
    const keyInput = document.getElementById('ai-api-key');
    if (keyInput) keyInput.value = '';

    const urlSelect = document.getElementById('ai-base-url-select');
    if (urlSelect) {
      urlSelect.value = '';
      this.onBaseUrlChange();
    }

    const modelInput = document.getElementById('ai-model');
    if (modelInput) modelInput.value = '';

    const tempInput = document.getElementById('ai-temperature');
    const tempValue = document.getElementById('ai-temp-value');
    if (tempInput) tempInput.value = 0.7;
    if (tempValue) tempValue.textContent = '0.7';

    const maxTokensInput = document.getElementById('ai-max-tokens');
    if (maxTokensInput) maxTokensInput.value = 1024;

    const timeoutInput = document.getElementById('ai-timeout');
    if (timeoutInput) timeoutInput.value = 15;

    const promptInput = document.getElementById('ai-system-prompt');
    if (promptInput) promptInput.value = AIService.getDefaultSystemPrompt();

    const enabledCheckbox = document.getElementById('ai-enabled');
    if (enabledCheckbox) enabledCheckbox.checked = false;

    this._updateStatus();
    this._showHint('已清空配置');
  },

  // ============================================================
  // 显示临时提示（3秒后消失）
  // ============================================================
  _showHint(text) {
    const resultEl = document.getElementById('ai-test-result');
    if (!resultEl) return;
    resultEl.style.display = 'block';
    resultEl.className = 'ai-test-result ai-test-info';
    resultEl.textContent = text;

    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      resultEl.style.display = 'none';
    }, 2500);
  },

  // ============================================================
  // 显示测试结果
  // ============================================================
  _showTestResult(success, message) {
    const resultEl = document.getElementById('ai-test-result');
    if (!resultEl) return;
    resultEl.style.display = 'block';
    resultEl.className = 'ai-test-result ' + (success ? 'ai-test-success' : 'ai-test-error');
    resultEl.textContent = message;
  }
};

// 点击遮罩层关闭模态框
document.addEventListener('click', (e) => {
  const modal = document.getElementById('ai-settings-modal');
  if (!modal || modal.style.display === 'none') return;
  if (e.target === modal) {
    AISettings.closeModal();
  }
});
