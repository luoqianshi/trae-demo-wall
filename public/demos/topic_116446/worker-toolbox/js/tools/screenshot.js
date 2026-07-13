/**
 * 打工人的工具箱 - 网页截屏工具
 * 使用 chrome.tabs.captureVisibleTab 截取当前页面
 * 支持全屏截取、框选区域截取、下载保存和复制图片功能
 */

(function() {
  'use strict';

  // 当前截屏的 dataUrl
  let currentScreenshot = null;

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'screenshotPage') {
        // 页面进入时可以做一些准备工作
      }
    });

    // 监听来自框选脚本的截取结果消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'captureSelectedArea') {
        handleCaptureSelectedArea(message);
      } else if (message.action === 'captureSelectionCancelled') {
        handleCaptureSelectionCancelled();
      }
    });
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 截取按钮
    document.getElementById('captureBtn').addEventListener('click', captureTab);
    
    // 框选截取按钮
    document.getElementById('captureSelectionBtn').addEventListener('click', startSelectionMode);
    
    // 下载按钮
    document.getElementById('downloadScreenshotBtn').addEventListener('click', downloadScreenshot);
    
    // 复制按钮
    document.getElementById('copyScreenshotBtn').addEventListener('click', copyScreenshot);
  }

  /**
   * 截取当前标签页
   */
  function captureTab() {
    App.showToast('正在截取...', 'success', 1000);
    
    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
      if (response && response.success) {
        currentScreenshot = response.dataUrl;
        
        // 显示截图
        const img = document.getElementById('screenshotImg');
        img.src = response.dataUrl;
        document.getElementById('screenshotResult').style.display = 'block';
        
        App.showToast('截屏成功', 'success');
      } else {
        App.showToast('截屏失败: ' + (response?.error || '未知错误'), 'error');
      }
    });
  }

  /**
   * 进入框选模式
   */
  function startSelectionMode() {
    App.showToast('请拖动鼠标选择区域，按 ESC 取消', 'success', 2000);
    
    chrome.runtime.sendMessage({ action: 'startSelectionMode' }, (response) => {
      if (!response || !response.success) {
        App.showToast('进入框选模式失败: ' + (response?.error || '未知错误'), 'error');
      }
    });
  }

  /**
   * 处理框选区域截取结果
   */
  function handleCaptureSelectedArea(message) {
    chrome.runtime.sendMessage({
      action: 'captureSelectedArea',
      selection: message.selection
    }, (response) => {
      if (response && response.success) {
        // 在 sidepanel 中进行图片裁剪（service worker 无 DOM）
        cropImage(response.dataUrl, response.selection).then((croppedDataUrl) => {
          currentScreenshot = croppedDataUrl;
          
          const img = document.getElementById('screenshotImg');
          img.src = croppedDataUrl;
          document.getElementById('screenshotResult').style.display = 'block';
          
          App.showToast('框选截屏成功', 'success');
        }).catch((error) => {
          App.showToast('裁剪图片失败: ' + error.message, 'error');
        });
      } else {
        App.showToast('框选截屏失败: ' + (response?.error || '未知错误'), 'error');
      }
    });
  }

  /**
   * 处理用户取消框选
   */
  function handleCaptureSelectionCancelled() {
    App.showToast('已取消框选', 'warning');
  }

  /**
   * 使用 Canvas 裁剪图片
   * @param {string} dataUrl - 原始图片的 dataUrl
   * @param {Object} selection - 裁剪区域 {x, y, width, height}
   * @returns {Promise<string>} - 裁剪后的 dataUrl
   */
  function cropImage(dataUrl, selection) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = selection.width;
          canvas.height = selection.height;
          
          // 考虑设备像素比
          const devicePixelRatio = window.devicePixelRatio || 1;
          ctx.drawImage(
            img,
            selection.x * devicePixelRatio,
            selection.y * devicePixelRatio,
            selection.width * devicePixelRatio,
            selection.height * devicePixelRatio,
            0,
            0,
            selection.width,
            selection.height
          );
          
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      img.src = dataUrl;
    });
  }

  /**
   * 下载截屏
   */
  async function downloadScreenshot() {
    if (!currentScreenshot) {
      App.showToast('请先截取屏幕', 'warning');
      return;
    }
    
    try {
      const settings = await Storage.getSettings();
      const filename = `screenshot-${formatTimestamp()}.png`;
      
      // 构建下载路径
      const downloadPath = settings.downloadPath && settings.downloadPath !== 'Downloads' 
        ? `${settings.downloadPath}/${filename}`
        : filename;
      
      // 使用 chrome.downloads API 下载
      chrome.runtime.sendMessage({
        action: 'downloadFile',
        url: currentScreenshot,
        filename: downloadPath,
        path: settings.downloadPath
      }, (response) => {
        if (response && response.success) {
          App.showToast('已开始下载', 'success');
        } else {
          // 降级方案：直接通过a标签下载
          fallbackDownload(currentScreenshot, filename);
        }
      });
    } catch (error) {
      console.error('下载失败:', error);
      fallbackDownload(currentScreenshot, `screenshot-${Date.now()}.png`);
    }
  }

  /**
   * 降级下载方案
   */
  function fallbackDownload(dataUrl, filename) {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      App.showToast('图片已下载', 'success');
    } catch (error) {
      App.showToast('下载失败: ' + error.message, 'error');
    }
  }

  /**
   * 复制图片到剪贴板
   */
  async function copyScreenshot() {
    if (!currentScreenshot) {
      App.showToast('请先截取屏幕', 'warning');
      return;
    }
    
    try {
      // 将 dataUrl 转换为 Blob
      const response = await fetch(currentScreenshot);
      const blob = await response.blob();
      
      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      
      App.showToast('图片已复制到剪贴板', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      App.showToast('复制失败，请尝试右键保存图片', 'error');
    }
  }

  /**
   * 格式化时间戳
   */
  function formatTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
