/**
 * AI 配置面板逻辑 (WI-AI-Config)
 * 前端配置大模型 API Key / Base URL / Model，保存即生效，支持测试连接。
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const overlay = $('config-overlay');
  const closeBtn = $('config-close');
  const openBtn = $('ai-config-btn');
  const form = $('config-form');
  const keyInput = $('cfg-api-key');
  const baseInput = $('cfg-api-base');
  const modelInput = $('cfg-model');
  const testBtn = $('test-btn');
  const testResult = $('test-result');
  const statusBar = $('config-status-bar');
  const statusText = $('config-status-text');
  const statusDot = statusBar.querySelector('.config-status-dot');
  const aiDot = $('ai-dot');
  const aiLabel = $('ai-status-label');

  // === 加载当前配置状态 ===
  async function loadStatus() {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.success && json.data) {
        renderStatus(json.data);
      }
    } catch (e) {
      statusText.textContent = '无法连接服务';
      statusBar.className = 'config-status-bar fail';
    }
  }

  function renderStatus(data) {
    if (data.connected) {
      statusText.innerHTML = `已连接 · <strong>${data.model}</strong> · ${data.apiKey}`;
      statusBar.className = 'config-status-bar connected';
      aiDot.className = 'ai-dot on';
      aiLabel.textContent = data.model;
    } else {
      statusText.textContent = '未连接 · 使用规则引擎生成（无需配置也可体验）';
      statusBar.className = 'config-status-bar disconnected';
      aiDot.className = 'ai-dot off';
      aiLabel.textContent = '规则引擎';
    }
    // 回填表单
    baseInput.value = data.apiBase || '';
    modelInput.value = data.model || '';
    keyInput.placeholder = data.connected ? `当前: ${data.apiKey}` : 'sk-...';
  }

  // === 打开/关闭弹层 ===
  function open() {
    overlay.classList.remove('hidden');
    loadStatus();
  }
  function close() {
    overlay.classList.add('hidden');
    testResult.classList.add('hidden');
  }

  // === 保存配置 ===
  async function save(e) {
    if (e) e.preventDefault();
    const payload = {
      apiKey: keyInput.value,
      apiBase: baseInput.value,
      model: modelInput.value
    };
    // Key 为空时不覆盖（保留已有）
    if (!payload.apiKey) delete payload.apiKey;

    testResult.classList.remove('hidden');
    testResult.className = 'test-result testing';
    testResult.textContent = '正在保存配置...';

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        renderStatus(json.data);
        testResult.className = 'test-result ok';
        testResult.textContent = '配置已保存。若已连接大模型，下次生成方案将使用真实 AI。';
        keyInput.value = ''; // 清空明文
      } else {
        throw new Error(json.error || '保存失败');
      }
    } catch (err) {
      testResult.className = 'test-result fail';
      testResult.textContent = '保存失败：' + err.message;
    }
  }

  // === 测试连接 ===
  async function testConnection() {
    const payload = {
      apiKey: keyInput.value || undefined,
      apiBase: baseInput.value,
      model: modelInput.value
    };

    testResult.classList.remove('hidden');
    testResult.className = 'test-result testing';
    testResult.textContent = '正在测试连接...（最多等待 10 秒）';
    testBtn.disabled = true;

    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        testResult.className = 'test-result ok';
        testResult.innerHTML = `连接成功 · ${json.model} · 响应 ${json.latency_ms}ms<br><em>"${escapeHtml(json.reply)}"</em>`;
      } else {
        testResult.className = 'test-result fail';
        testResult.innerHTML = `连接失败 · ${escapeHtml(json.error)}`;
        if (json.detail) {
          testResult.innerHTML += `<br><span class="test-detail">${escapeHtml(json.detail)}</span>`;
        }
      }
    } catch (err) {
      testResult.className = 'test-result fail';
      testResult.textContent = '请求异常：' + err.message;
    } finally {
      testBtn.disabled = false;
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // === 预设 ===
  function applyPreset(base, model) {
    baseInput.value = base;
    modelInput.value = model;
    if (!keyInput.value) keyInput.focus();
  }

  // === 事件绑定 ===
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  // 仅当鼠标按下在遮罩层空白区（overlay 本身）时才关闭；
  // 用 mousedown 且严格判断 target，避免粘贴/输入等操作误触关闭
  if (overlay) {
    overlay.addEventListener('mousedown', (e) => {
      // 只在点击目标是遮罩层本身（不是内部弹层）时关闭
      if (e.target === overlay) close();
    });
  }
  // 阻止弹层内部所有 mousedown 事件冒泡到 overlay
  const modal = document.querySelector('.config-modal');
  if (modal) {
    modal.addEventListener('mousedown', (e) => e.stopPropagation());
  }
  // 输入框粘贴保护：确保粘贴时焦点不丢失
  [keyInput, baseInput, modelInput].forEach(input => {
    if (!input) return;
    input.addEventListener('paste', (e) => { e.stopPropagation(); });
    input.addEventListener('mousedown', (e) => e.stopPropagation());
  });
  if (form) form.addEventListener('submit', save);
  if (testBtn) testBtn.addEventListener('click', testConnection);

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      applyPreset(chip.dataset.base, chip.dataset.model);
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // 启动时加载一次状态
  loadStatus();
})();
