(function() {
  'use strict';

  let selectionRect = null;
  let startX = 0;
  let startY = 0;
  let isSelecting = false;
  let overlay = null;
  let selectionDiv = null;
  let closeBtn = null;
  let confirmBtn = null;

  function initSelector() {
    createOverlay();
    bindEvents();
  }

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'screenshot-selector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      cursor: crosshair;
    `;

    selectionDiv = document.createElement('div');
    selectionDiv.id = 'screenshot-selection';
    selectionDiv.style.cssText = `
      position: absolute;
      border: 2px solid #4CAF50;
      background: rgba(76, 175, 80, 0.1);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
      cursor: move;
    `;

    closeBtn = document.createElement('button');
    closeBtn.id = 'screenshot-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    confirmBtn = document.createElement('button');
    confirmBtn.id = 'screenshot-confirm-btn';
    confirmBtn.innerHTML = '✓';
    confirmBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 56px;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: #4CAF50;
      color: white;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    confirmBtn.style.display = 'none';
    closeBtn.style.display = 'none';

    overlay.appendChild(selectionDiv);
    overlay.appendChild(closeBtn);
    overlay.appendChild(confirmBtn);
    document.body.appendChild(overlay);
  }

  function bindEvents() {
    overlay.addEventListener('mousedown', startSelection);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endSelection);
    closeBtn.addEventListener('click', cancelSelection);
    confirmBtn.addEventListener('click', confirmSelection);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelSelection();
      }
    });
  }

  function startSelection(e) {
    if (e.target === closeBtn || e.target === confirmBtn) return;
    
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selectionDiv.style.left = startX + 'px';
    selectionDiv.style.top = startY + 'px';
    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    selectionDiv.style.display = 'block';
    
    closeBtn.style.display = 'flex';
    confirmBtn.style.display = 'none';
  }

  function onMouseMove(e) {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    selectionDiv.style.left = left + 'px';
    selectionDiv.style.top = top + 'px';
    selectionDiv.style.width = width + 'px';
    selectionDiv.style.height = height + 'px';

    if (width > 20 && height > 20) {
      confirmBtn.style.display = 'flex';
    } else {
      confirmBtn.style.display = 'none';
    }
  }

  function endSelection() {
    isSelecting = false;
  }

  function confirmSelection() {
    const rect = selectionDiv.getBoundingClientRect();
    if (rect.width > 20 && rect.height > 20) {
      const selectionData = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
      chrome.runtime.sendMessage({
        action: 'captureSelectedArea',
        selection: selectionData
      });
    }
    cleanup();
  }

  function cancelSelection() {
    cleanup();
    chrome.runtime.sendMessage({ action: 'captureSelectionCancelled' });
  }

  function cleanup() {
    isSelecting = false;
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
    selectionDiv = null;
    closeBtn = null;
    confirmBtn = null;
  }

  initSelector();
})();