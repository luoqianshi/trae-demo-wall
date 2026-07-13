/**
 * 打工人的工具箱 - 下载器工具
 * 根据输入链接下载内容到指定目录
 * 下载路径可在设置中修改
 */

(function() {
  'use strict';

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadDownloadHistory();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'downloaderPage') {
        loadDownloadHistory();
      }
    });
    
    // 监听下载变化
    if (chrome.downloads && chrome.downloads.onChanged) {
      chrome.downloads.onChanged.addListener(handleDownloadChanged);
    }
    
    // 监听数据重置事件
    document.addEventListener('dataReset', loadDownloadHistory);
    document.addEventListener('dataImported', loadDownloadHistory);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 开始下载按钮
    document.getElementById('startDownloadBtn').addEventListener('click', startDownload);
    
    // 下载链接输入框回车
    document.getElementById('downloadUrlInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startDownload();
      }
    });
    
    // 清空下载历史
    document.getElementById('clearDownloadHistoryBtn').addEventListener('click', clearHistory);
  }

  /**
   * 开始下载
   */
  async function startDownload() {
    const url = document.getElementById('downloadUrlInput').value.trim();
    const filename = document.getElementById('downloadFilenameInput').value.trim();
    
    if (!url) {
      App.showToast('请输入下载链接', 'warning');
      return;
    }
    
    // 验证URL
    try {
      new URL(url);
    } catch (e) {
      App.showToast('请输入有效的URL链接', 'error');
      return;
    }
    
    try {
      const settings = await Storage.getSettings();
      
      // 添加到历史记录
      const history = await Storage.addDownloadHistory({
        url: url,
        filename: filename || getFilenameFromUrl(url),
        status: 'downloading'
      });
      
      // 构建下载路径
      const downloadPath = settings.downloadPath && settings.downloadPath !== 'Downloads' 
        ? `${settings.downloadPath}/${filename || getFilenameFromUrl(url)}`
        : (filename || undefined);

      // 使用 chrome.downloads API 下载
      chrome.downloads.download({
        url: url,
        filename: downloadPath,
        saveAs: false
      }, async (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('下载失败:', chrome.runtime.lastError);
          App.showToast('下载失败: ' + chrome.runtime.lastError.message, 'error');
          
          // 更新历史记录状态
          if (history.length > 0) {
            await Storage.updateDownloadStatus(history[0].id, 'failed');
          }
        } else {
          App.showToast('下载已开始', 'success');
          
          // 清空输入框
          document.getElementById('downloadUrlInput').value = '';
          document.getElementById('downloadFilenameInput').value = '';
        }
        
        await loadDownloadHistory();
      });
      
    } catch (error) {
      console.error('下载失败:', error);
      App.showToast('下载失败: ' + error.message, 'error');
    }
  }

  /**
   * 从URL获取文件名
   */
  function getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || 'download';
    } catch (e) {
      return 'download';
    }
  }

  /**
   * 处理下载状态变化
   */
  async function handleDownloadChanged(delta) {
    // 可以在这里监听下载状态变化并更新UI
    // 由于下载历史是本地记录，这里做简单处理
    await loadDownloadHistory();
  }

  /**
   * 加载下载历史
   */
  async function loadDownloadHistory() {
    const history = await Storage.getDownloadHistory();
    const container = document.getElementById('downloadHistory');
    const emptyState = document.getElementById('downloadEmpty');
    
    if (history.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    history.forEach(item => {
      const itemEl = createDownloadItem(item);
      container.appendChild(itemEl);
    });
  }

  /**
   * 创建下载历史项
   */
  function createDownloadItem(item) {
    const div = document.createElement('div');
    div.className = 'download-item';
    
    // 状态徽章
    let statusBadge = '';
    let statusText = '';
    switch (item.status) {
      case 'completed':
        statusBadge = '<span class="pixel-badge pixel-badge-success">完成</span>';
        statusText = '已完成';
        break;
      case 'downloading':
        statusBadge = '<span class="pixel-badge pixel-badge-warning">下载中</span>';
        statusText = '下载中';
        break;
      case 'failed':
        statusBadge = '<span class="pixel-badge pixel-badge-danger">失败</span>';
        statusText = '失败';
        break;
      default:
        statusBadge = '<span class="pixel-badge">等待中</span>';
        statusText = '等待中';
    }
    
    const displayUrl = item.url.length > 40 
      ? item.url.substring(0, 40) + '...' 
      : item.url;
    
    div.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${statusBadge}
          <span class="download-filename" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;" title="${escapeHtml(item.filename || item.url)}">
            ${escapeHtml(item.filename || displayUrl)}
          </span>
        </div>
        <div class="download-url" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.url)}">
          ${escapeHtml(displayUrl)}
        </div>
        <div style="font-size: 8px; color: var(--pixel-text-muted); margin-top: 4px; font-family: var(--pixel-font);">
          ${App.formatDate(item.createdAt)}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <button class="pixel-btn pixel-btn-sm pixel-btn-info" data-action="redownload" title="重新下载">↻</button>
        <button class="pixel-btn pixel-btn-sm pixel-btn-danger" data-action="delete" title="删除">×</button>
      </div>
    `;
    
    // 重新下载
    div.querySelector('[data-action="redownload"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('downloadUrlInput').value = item.url;
      document.getElementById('downloadFilenameInput').value = item.filename || '';
      App.showToast('已填充到下载框', 'success');
    });
    
    // 删除历史记录
    div.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await Storage.removeDownloadHistory(item.id);
      await loadDownloadHistory();
      App.showToast('已删除', 'success');
    });
    
    return div;
  }

  /**
   * 清空下载历史
   */
  async function clearHistory() {
    const history = await Storage.getDownloadHistory();
    
    if (history.length === 0) {
      App.showToast('没有可清除的历史记录', 'warning');
      return;
    }
    
    if (!confirm(`确定要清除所有 ${history.length} 条下载历史吗？`)) {
      return;
    }
    
    await Storage.clearDownloadHistory();
    await loadDownloadHistory();
    App.showToast('已清空下载历史', 'success');
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
