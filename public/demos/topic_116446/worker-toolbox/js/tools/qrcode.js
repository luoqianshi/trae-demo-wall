/**
 * 打工人的工具箱 - 二维码生成工具
 * 使用 qrcode.js 库生成二维码
 * 支持历史记录持久化保存和二维码下载功能
 */

(function() {
  'use strict';

  // 当前生成的二维码内容
  let currentQrcodeContent = '';

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadHistory();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'qrcodePage') {
        loadHistory();
      }
    });
    
    // 监听数据重置事件
    document.addEventListener('dataReset', loadHistory);
    document.addEventListener('dataImported', loadHistory);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 生成二维码按钮
    document.getElementById('generateQrcodeBtn').addEventListener('click', generateQrcode);
    
    // 输入框回车生成
    document.getElementById('qrcodeInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        generateQrcode();
      }
    });
    
    // 保存按钮
    document.getElementById('saveQrcodeBtn').addEventListener('click', saveToHistory);
    
    // 下载二维码按钮
    document.getElementById('downloadQrcodeBtn').addEventListener('click', downloadQrcode);
    
    // 清空按钮
    document.getElementById('clearQrcodeBtn').addEventListener('click', clearQrcode);
  }

  /**
   * 生成二维码
   */
  async function generateQrcode() {
    const input = document.getElementById('qrcodeInput');
    const content = input.value.trim();
    
    if (!content) {
      App.showToast('请输入内容', 'warning');
      return;
    }
    
    try {
      const canvas = document.getElementById('qrcodeCanvas');
      
      // 使用QRCode.js生成二维码
      await QRCode.toCanvas(canvas, content, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      // 显示二维码
      document.getElementById('qrcodeDisplay').style.display = 'block';
      document.getElementById('qrcodeActions').style.display = 'flex';
      
      currentQrcodeContent = content;
      
      App.showToast('生成成功', 'success');
      
    } catch (error) {
      console.error('生成二维码失败:', error);
      App.showToast('生成失败: ' + error.message, 'error');
    }
  }

  /**
   * 保存到历史记录（带命名）
   */
  async function saveToHistory() {
    if (!currentQrcodeContent) {
      App.showToast('请先生成二维码', 'warning');
      return;
    }
    
    showNameInputModal((name) => {
      if (!name) return;
      
      const trimmedName = name.trim();
      if (!trimmedName) {
        App.showToast('名称不能为空', 'warning');
        return;
      }
      
      Storage.addQrcodeHistory({
        name: trimmedName,
        content: currentQrcodeContent
      }).then(() => {
        loadHistory();
        App.showToast('保存成功', 'success');
      }).catch((error) => {
        console.error('保存失败:', error);
        App.showToast('保存失败', 'error');
      });
    });
  }

  /**
   * 显示名称输入模态框
   */
  function showNameInputModal(onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background-color: #2a2a2a;
      border: 2px solid #4a4a4a;
      border-radius: 4px;
      padding: 20px;
      width: 90%;
      max-width: 320px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    
    content.innerHTML = `
      <div style="font-family: 'Press Start 2P', monospace; font-size: 10px; color: #00d4ff; margin-bottom: 16px;">📝 输入保存名称</div>
      <input type="text" id="saveNameInput" placeholder="请输入名称" 
        style="width: 100%; padding: 10px; margin-bottom: 12px; 
               background-color: #1a1a1a; border: 2px solid #4a4a4a; 
               border-radius: 4px; color: #fff; font-family: monospace; font-size: 12px;
               outline: none; box-sizing: border-box;" />
      <div style="display: flex; gap: 8px;">
        <button id="saveNameCancel" style="flex: 1; padding: 8px; 
               background-color: #4a4a4a; border: 2px solid #6a6a6a; 
               border-radius: 4px; color: #fff; font-family: 'Press Start 2P', monospace; font-size: 8px;
               cursor: pointer;">取消</button>
        <button id="saveNameConfirm" style="flex: 1; padding: 8px; 
               background-color: #00d4ff; border: 2px solid #00a8cc; 
               border-radius: 4px; color: #000; font-family: 'Press Start 2P', monospace; font-size: 8px;
               cursor: pointer;">保存</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const input = content.querySelector('#saveNameInput');
    const cancelBtn = content.querySelector('#saveNameCancel');
    const confirmBtn = content.querySelector('#saveNameConfirm');
    
    input.focus();
    
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      onConfirm(input.value);
      closeModal();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onConfirm(input.value);
        closeModal();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  /**
   * 下载二维码
   */
  function downloadQrcode() {
    const canvas = document.getElementById('qrcodeCanvas');
    if (!canvas || canvas.width === 0) {
      App.showToast('请先生成二维码', 'warning');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      App.showToast('二维码已下载', 'success');
    } catch (error) {
      console.error('下载失败:', error);
      App.showToast('下载失败: ' + error.message, 'error');
    }
  }

  /**
   * 清空二维码
   */
  function clearQrcode() {
    document.getElementById('qrcodeInput').value = '';
    document.getElementById('qrcodeDisplay').style.display = 'none';
    document.getElementById('qrcodeActions').style.display = 'none';
    currentQrcodeContent = '';
  }

  /**
   * 加载历史记录
   */
  async function loadHistory() {
    const history = await Storage.getQrcodeHistory();
    const container = document.getElementById('qrcodeHistory');
    
    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无历史记录</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    history.forEach(item => {
      const historyItem = createHistoryItem(item);
      container.appendChild(historyItem);
    });
  }

  /**
   * 创建历史记录项
   */
  function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'pixel-list-item';
    div.style.cursor = 'pointer';
    
    const displayName = item.name || (item.content.length > 30 ? item.content.substring(0, 30) + '...' : item.content);
    
    div.innerHTML = `
      <span style="flex: 1; font-size: 10px; word-break: break-all;">${escapeHtml(displayName)}</span>
      <span style="font-size: 8px; color: var(--pixel-text-muted); margin-right: 8px;">${App.formatDate(item.createdAt)}</span>
      <button class="pixel-btn pixel-btn-sm" data-action="use">使用</button>
      <button class="pixel-btn pixel-btn-sm pixel-btn-danger" data-action="delete" style="margin-left: 4px;">×</button>
    `;
    
    // 使用历史记录
    div.querySelector('[data-action="use"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('qrcodeInput').value = item.content;
      generateQrcode();
    });
    
    // 删除历史记录
    div.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await Storage.removeQrcodeHistory(item.id);
      await loadHistory();
      App.showToast('已删除', 'success');
    });
    
    return div;
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
