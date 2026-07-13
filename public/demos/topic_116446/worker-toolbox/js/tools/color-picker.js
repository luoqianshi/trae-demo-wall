/**
 * 打工人的工具箱 - 取色器工具
 * 基于 EyeDropper API 实现网页取色
 * 支持 HEX/RGB 复制、取色历史记录
 */

(function() {
  'use strict';

  // 当前取色结果缓存
  let currentColor = null;

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadColorHistory();

    // 监听页面进入事件，刷新历史列表
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'color-pickerPage') {
        loadColorHistory();
      }
    });

    // 监听数据重置/导入事件
    document.addEventListener('dataReset', loadColorHistory);
    document.addEventListener('dataImported', loadColorHistory);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 开始取色按钮
    document.getElementById('startPickBtn').addEventListener('click', startPick);

    // 复制 HEX
    document.getElementById('copyHexBtn').addEventListener('click', () => {
      if (currentColor) {
        copyToClipboard(currentColor.hex);
      }
    });

    // 复制 RGB
    document.getElementById('copyRgbBtn').addEventListener('click', () => {
      if (currentColor) {
        copyToClipboard(`rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`);
      }
    });

    // 清空取色历史
    document.getElementById('clearColorHistoryBtn').addEventListener('click', clearHistory);
  }

  /**
   * 开始取色 - 调用 EyeDropper API
   */
  async function startPick() {
    // 检查浏览器是否支持 EyeDropper API
    if (typeof EyeDropper === 'undefined') {
      App.showToast('当前浏览器不支持取色功能（需 Chrome 95+）', 'error');
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      // open() 返回 Promise，用户取消时会 reject
      const result = await eyeDropper.open();

      // 解析取色结果，sRGBHex 格式如 "#ff5733"
      const hex = result.sRGBHex.toLowerCase();
      const { r, g, b } = hexToRgb(hex);

      // 更新当前颜色
      currentColor = { hex, r, g, b };
      updateColorDisplay(currentColor);

      // 保存到历史记录
      await Storage.addColorHistory(currentColor);
      loadColorHistory();

      App.showToast('取色成功', 'success');
    } catch (error) {
      // 用户主动取消取色时不报错
      if (error && error.name === 'NotAllowedError') {
        return;
      }
      App.showToast('取色失败: ' + (error.message || '未知错误'), 'error');
    }
  }

  /**
   * 更新颜色展示区域
   * @param {Object} color - { hex, r, g, b }
   */
  function updateColorDisplay(color) {
    const preview = document.getElementById('colorPreview');
    const hexEl = document.getElementById('colorHex');
    const rgbEl = document.getElementById('colorRgb');
    const actions = document.getElementById('colorActions');

    preview.style.backgroundColor = color.hex;
    hexEl.textContent = color.hex.toUpperCase();
    rgbEl.textContent = `RGB(${color.r}, ${color.g}, ${color.b})`;
    actions.style.display = 'flex';
  }

  /**
   * 加载取色历史列表
   */
  async function loadColorHistory() {
    const history = await Storage.getColorHistory();
    const listEl = document.getElementById('colorHistory');
    const emptyEl = document.getElementById('colorEmpty');

    if (history.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = history.map(item => `
      <div class="color-history-item" data-id="${item.id}">
        <div class="color-history-swatch" style="background-color: ${item.hex};"></div>
        <div class="color-history-info">
          <div class="color-history-hex">${item.hex.toUpperCase()}</div>
          <div class="color-history-rgb">RGB(${item.r}, ${item.g}, ${item.b})</div>
        </div>
        <div class="color-history-actions">
          <button class="pixel-btn pixel-btn-sm color-copy-btn" data-hex="${item.hex}" title="复制HEX">📋</button>
          <button class="pixel-btn pixel-btn-sm color-pick-btn" data-hex="${item.hex}" data-r="${item.r}" data-g="${item.g}" data-b="${item.b}" title="应用此颜色">🎯</button>
          <button class="pixel-btn pixel-btn-sm pixel-btn-danger color-delete-btn" data-id="${item.id}" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');

    // 绑定历史记录操作事件
    bindHistoryEvents();
  }

  /**
   * 绑定历史记录列表中的按钮事件
   */
  function bindHistoryEvents() {
    // 复制 HEX
    document.querySelectorAll('.color-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = btn.dataset.hex;
        copyToClipboard(hex);
      });
    });

    // 应用历史颜色到当前展示
    document.querySelectorAll('.color-pick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = btn.dataset.hex;
        const r = parseInt(btn.dataset.r);
        const g = parseInt(btn.dataset.g);
        const b = parseInt(btn.dataset.b);
        currentColor = { hex, r, g, b };
        updateColorDisplay(currentColor);
        App.showToast('已应用此颜色', 'success');
      });
    });

    // 删除单条历史
    document.querySelectorAll('.color-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await Storage.removeColorHistory(id);
        loadColorHistory();
        App.showToast('已删除', 'success');
      });
    });
  }

  /**
   * 清空取色历史
   */
  async function clearHistory() {
    const history = await Storage.getColorHistory();
    if (history.length === 0) {
      App.showToast('没有可清除的历史记录', 'warning');
      return;
    }
    await Storage.clearColorHistory();
    loadColorHistory();
    App.showToast('已清空取色历史', 'success');
  }

  /**
   * HEX 转 RGB
   * @param {string} hex - 如 "#ff5733"
   * @returns {Object} { r, g, b }
   */
  function hexToRgb(hex) {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16)
    };
  }

  /**
   * 复制文本到剪贴板
   * @param {string} text - 待复制文本
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      App.showToast(`已复制: ${text}`, 'success');
    } catch (error) {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        App.showToast(`已复制: ${text}`, 'success');
      } catch (e) {
        App.showToast('复制失败', 'error');
      }
      document.body.removeChild(textarea);
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
