/* ============================================================
   kimi-settings.js — KIMI API 配置弹窗
   负责：配置存储、连接测试、状态显示
   ============================================================ */

const KimiSettings = (() => {
  'use strict';

  const STORAGE_KEY = 'kimi_config_v1';

  const els = {};

  function init() {
    els.modal = document.getElementById('kimi-settings-modal');
    els.btnOpen = document.getElementById('btn-kimi-settings');
    els.btnClose = document.getElementById('kimi-modal-close');
    els.btnCancel = document.getElementById('kimi-btn-cancel');
    els.btnSave = document.getElementById('kimi-btn-save');
    els.btnTest = document.getElementById('kimi-btn-test');
    els.apiKey = document.getElementById('kimi-api-key');
    els.mode = document.getElementById('kimi-mode');
    els.enabled = document.getElementById('kimi-enabled');
    els.status = document.getElementById('kimi-status');

    if (!els.modal) return;

    loadFromStorage();
    bindEvents();
    updateButtonState();
  }

  function bindEvents() {
    els.btnOpen.addEventListener('click', openModal);
    els.btnClose.addEventListener('click', closeModal);
    els.btnCancel.addEventListener('click', closeModal);
    els.btnSave.addEventListener('click', saveConfig);
    els.btnTest.addEventListener('click', testConnection);

    els.modal.addEventListener('click', (e) => {
      if (e.target === els.modal) closeModal();
    });

    els.apiKey.addEventListener('input', updateStatusText);
    els.enabled.addEventListener('change', updateStatusText);
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cfg = JSON.parse(raw);
        AppState.set('kimiApiKey', cfg.apiKey || '');
        AppState.set('kimiMode', cfg.mode || 'rules-first');
        AppState.set('kimiEnabled', !!cfg.enabled);
      }
    } catch (e) {
      console.warn('读取 KIMI 配置失败:', e);
    }
  }

  function saveToStorage() {
    const cfg = {
      apiKey: AppState.get('kimiApiKey'),
      mode: AppState.get('kimiMode'),
      enabled: AppState.get('kimiEnabled'),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('保存 KIMI 配置失败:', e);
    }
  }

  function openModal() {
    if (!els.modal) return;
    els.apiKey.value = AppState.get('kimiApiKey') || '';
    els.mode.value = AppState.get('kimiMode') || 'rules-first';
    els.enabled.checked = AppState.get('kimiEnabled') || false;
    updateStatusText();
    els.modal.classList.remove('hidden');
  }

  function closeModal() {
    if (els.modal) els.modal.classList.add('hidden');
  }

  function saveConfig() {
    AppState.set('kimiApiKey', els.apiKey.value.trim());
    AppState.set('kimiMode', els.mode.value);
    AppState.set('kimiEnabled', els.enabled.checked);
    saveToStorage();
    updateButtonState();
    closeModal();
    Toast.success('KIMI 配置已保存', getStatusDescription());
  }

  async function testConnection() {
    const key = els.apiKey.value.trim();
    if (!key) {
      setStatus('请先填写 API Key', 'error');
      return;
    }

    setStatus('正在连接 KIMI...', '');
    els.btnTest.disabled = true;

    try {
      const res = await fetch('/api/kimi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (data.connected) {
        setStatus(`连接成功，示例返回 ${data.sampleCount} 个包装点`, 'success');
      } else {
        setStatus(`连接失败：${data.error || '未知错误'}`, 'error');
      }
    } catch (err) {
      setStatus(`网络错误：${err.message}`, 'error');
    } finally {
      els.btnTest.disabled = false;
    }
  }

  function updateStatusText() {
    const key = els.apiKey.value.trim();
    const enabled = els.enabled.checked;
    if (!key) {
      setStatus('未配置 API Key，将使用本地规则', '');
      return;
    }
    if (!enabled) {
      setStatus('已填写 Key，但未启用 KIMI 辅助', '');
      return;
    }
    setStatus(getStatusDescription(key, enabled), 'success');
  }

  function getStatusDescription(key, enabled) {
    const hasKey = key !== undefined ? !!key : !!AppState.get('kimiApiKey');
    const isEnabled = enabled !== undefined ? enabled : AppState.get('kimiEnabled');
    if (!hasKey) return '未配置 API Key，将使用本地规则';
    if (!isEnabled) return '已配置 Key，KIMI 辅助未启用';
    const mode = AppState.get('kimiMode') || 'rules-first';
    const modeLabel = {
      'rules-first': '规则优先，KIMI 补充',
      'llm-first': 'KIMI 优先，失败降级',
      'rules-only': '仅本地规则',
    }[mode];
    return `KIMI 已启用（${modeLabel}）`;
  }

  function setStatus(text, type) {
    els.status.textContent = text;
    els.status.className = 'status-text';
    if (type === 'success') els.status.classList.add('status-text--success');
    if (type === 'error') els.status.classList.add('status-text--error');
  }

  function updateButtonState() {
    if (!els.btnOpen) return;
    const enabled = AppState.get('kimiEnabled') && !!AppState.get('kimiApiKey');
    els.btnOpen.textContent = enabled ? 'KIMI 已启用' : 'KIMI 设置';
    els.btnOpen.classList.toggle('btn--primary', enabled);
  }

  function getConfig() {
    return {
      enabled: AppState.get('kimiEnabled'),
      apiKey: AppState.get('kimiApiKey'),
      mode: AppState.get('kimiMode'),
    };
  }

  AppState.on('kimiEnabled', updateButtonState);

  return {
    init,
    openModal,
    closeModal,
    getConfig,
  };
})();

window.KimiSettings = KimiSettings;
