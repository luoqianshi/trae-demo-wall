/**
 * AI Prompt Manager - Content Script
 * Injects floating button on configured AI websites
 * @author hetao (贺涛)
 * @license CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)
 */

(function() {
  'use strict';

  // Default sites will be loaded from storage, this is just a fallback
  let DEFAULT_SITES = [];
  let currentPopup = null;
  let currentPopupStyle = null;
  let inputSelectorsConfig = null;

  // Load sites from config (via storage)
  async function loadSitesFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get('enabledSites', (result) => {
        DEFAULT_SITES = result.enabledSites || [];
        resolve(DEFAULT_SITES);
      });
    });
  }

  // Load input selectors config
  async function loadInputSelectors() {
    try {
      const url = chrome.runtime.getURL('config/input-selectors.json');
      const response = await fetch(url);
      inputSelectorsConfig = await response.json();
    } catch (e) {
      inputSelectorsConfig = null;
    }
  }

  // ── Auto-fill Logic ──

  // Find the chat input element for the current site
  function findChatInput() {
    if (!inputSelectorsConfig) return null;

    const hostname = window.location.hostname;

    // Try site-specific selectors first
    for (const site of inputSelectorsConfig.sites) {
      const isMatch = site.domains.some(domain => hostname.includes(domain));
      if (!isMatch) continue;

      for (const selector of site.selectors) {
        try {
          const el = document.querySelector(selector);
          if (el && isElementVisible(el)) return el;
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // Fallback to universal selectors
    if (inputSelectorsConfig.universalFallback) {
      for (const selector of inputSelectorsConfig.universalFallback.selectors) {
        try {
          const el = document.querySelector(selector);
          if (el && isElementVisible(el)) return el;
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    return null;
  }

  // Check if element is visible and interactable
  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    // offsetParent can be null for fixed-position elements or body, so check getBoundingClientRect instead
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Fill content into a textarea element
  function fillTextarea(textarea, content) {
    // Use native setter to trigger framework reactivity (React, Vue, etc.)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(textarea, content);

    // Dispatch events to notify frameworks
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Fill content into a contenteditable element
  function fillContentEditable(el, content) {
    // Focus first (some frameworks require focus before content changes)
    el.focus();

    // Clear existing content
    el.innerHTML = '';

    // Create a text node and insert it
    const textNode = document.createTextNode(content);
    el.appendChild(textNode);

    // Move cursor to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispatch events to notify frameworks (Vue, ProseMirror, TipTap, Quill, etc.)
    // Use InputEvent instead of plain Event for better framework compatibility
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: content
    }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Fill content into an input element
  function fillInput(input, content) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, content);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Main function: try to auto-fill, return true if successful
  function tryAutoFill(content) {
    const inputEl = findChatInput();
    if (!inputEl) return false;

    try {
      const tagName = inputEl.tagName.toLowerCase();

      if (tagName === 'textarea') {
        fillTextarea(inputEl, content);
        inputEl.focus();
        return true;
      }

      if (tagName === 'input') {
        fillInput(inputEl, content);
        inputEl.focus();
        return true;
      }

      if (inputEl.contentEditable === 'true' || inputEl.isContentEditable) {
        fillContentEditable(inputEl, content);
        inputEl.focus();
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  let fab = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // Create floating action button
  function createFAB(position) {
    if (fab) return;

    fab = document.createElement('button');
    fab.className = 'ai-prompt-fab';
    fab.id = 'ai-prompt-fab';
    fab.title = 'AI Prompt Manager';

    // Icon SVG
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    `;

    // Set position
    if (position) {
      fab.style.left = position.x + 'px';
      fab.style.top = position.y + 'px';
    } else {
      fab.style.right = '20px';
      fab.style.bottom = '100px';
    }

    // Click handler - open popup near the button
    fab.addEventListener('click', (e) => {
      if (!isDragging) {
        openPopupNearButton();
      }
    });

    // Drag handlers
    fab.addEventListener('mousedown', startDrag);
    fab.addEventListener('touchstart', startDrag, { passive: false });

    document.body.appendChild(fab);
  }

  // Start dragging
  function startDrag(e) {
    if (e.type === 'touchstart') {
      e.preventDefault();
      const touch = e.touches[0];
      dragOffset.x = touch.clientX - fab.offsetLeft;
      dragOffset.y = touch.clientY - fab.offsetTop;
    } else {
      dragOffset.x = e.clientX - fab.offsetLeft;
      dragOffset.y = e.clientY - fab.offsetTop;
    }

    isDragging = false;
    fab.classList.add('dragging');

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  // During drag
  function onDrag(e) {
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      e.preventDefault();
    }

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // Check if moved enough to be considered dragging
    if (!isDragging) {
      const dx = clientX - (fab.offsetLeft + dragOffset.x);
      const dy = clientY - (fab.offsetTop + dragOffset.y);
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging = true;
        // Close popup if dragging
        closePopup();
      }
    }

    if (isDragging) {
      fab.style.left = (clientX - dragOffset.x) + 'px';
      fab.style.top = (clientY - dragOffset.y) + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
    }
  }

  // End drag
  function endDrag(e) {
    fab.classList.remove('dragging');

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);

    // Save position if dragged
    if (isDragging) {
      savePosition();
      isDragging = false;
    }
  }

  // Save button position
  function savePosition() {
    const hostname = window.location.hostname;
    chrome.storage.local.get('fabPositions', (result) => {
      const positions = result.fabPositions || {};
      positions[hostname] = {
        x: fab.offsetLeft,
        y: fab.offsetTop
      };
      chrome.storage.local.set({ fabPositions: positions });
    });
  }

  // Load saved position for this site
  function loadPosition() {
    const hostname = window.location.hostname;
    return new Promise((resolve) => {
      chrome.storage.local.get(['fabPositions', 'enabledSites'], (result) => {
        const positions = result.fabPositions || {};
        resolve(positions[hostname] || null);
      });
    });
  }

  // Check if current site should show FAB
  async function shouldShowFAB() {
    return new Promise((resolve) => {
      chrome.storage.local.get('enabledSites', (result) => {
        const sites = result.enabledSites || DEFAULT_SITES;
        const currentHost = window.location.hostname;
        const isMatch = sites.some(site => currentHost.includes(site));
        resolve(isMatch);
      });
    });
  }

  // Close popup
  function closePopup() {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
    if (currentPopupStyle) {
      currentPopupStyle.remove();
      currentPopupStyle = null;
    }
    // Remove click outside listener
    document.removeEventListener('click', handleClickOutside);
  }

  // Handle click outside to close popup
  function handleClickOutside(e) {
    if (currentPopup && !currentPopup.contains(e.target) && e.target !== fab) {
      closePopup();
    }
  }

  // Open popup near the floating button
  function openPopupNearButton() {
    // Close existing popup first
    closePopup();

    // Get button position
    const fabRect = fab.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'ai-prompt-mini-popup';
    popup.innerHTML = `
      <div class="mini-popup-content">
        <div class="mini-popup-header">
          <span>Prompts</span>
          <button class="mini-popup-close">&times;</button>
        </div>
        <div class="mini-popup-body">
          <p>正在加载...</p>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #ai-prompt-mini-popup {
        position: fixed;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .mini-popup-content {
        background: #FFFFFF;
        border-radius: 12px;
        width: 280px;
        max-height: 400px;
        overflow: hidden;
        animation: mpPopIn 0.2s cubic-bezier(0.2, 0, 0, 1);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.05);
        border: 0.5px solid rgba(0, 0, 0, 0.05);
      }
      @keyframes mpPopIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .mini-popup-header {
        background: #FFFFFF;
        color: #1D1D1F;
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 13px;
        letter-spacing: -0.1px;
        border-bottom: 0.5px solid rgba(60, 60, 67, 0.08);
      }
      .mini-popup-close {
        background: transparent;
        border: none;
        color: #8E8E93;
        font-size: 16px;
        cursor: pointer;
        line-height: 1;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.15s;
      }
      .mini-popup-close:hover {
        background: #F2F2F7;
        color: #1D1D1F;
      }
      .mini-popup-body {
        padding: 8px;
        max-height: 320px;
        overflow-y: auto;
      }
      .mini-prompt-item {
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 2px;
        cursor: pointer;
        transition: background 0.12s;
      }
      .mini-prompt-item:hover {
        background: #F2F2F7;
      }
      .mini-prompt-item:active {
        background: #E5E5EA;
      }
      .mini-prompt-title {
        font-weight: 600;
        font-size: 12px;
        color: #1D1D1F;
        margin-bottom: 2px;
        letter-spacing: -0.1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mini-prompt-category {
        display: inline-block;
        background: #F2F2F7;
        color: #8E8E93;
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 500;
        margin-left: 4px;
        vertical-align: middle;
      }
      .mini-prompt-content {
        font-size: 11px;
        color: #86868B;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .mini-prompt-empty {
        text-align: center;
        padding: 20px 12px;
        color: #AEAEB2;
        font-size: 12px;
      }
      .mini-prompt-toast {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #1D1D1F;
        color: #fff;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 500;
        z-index: 2147483648;
        animation: mpToastIn 0.2s cubic-bezier(0.2, 0, 0, 1);
        white-space: nowrap;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }
      @keyframes mpToastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(4px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(popup);

    // Store references
    currentPopup = popup;
    currentPopupStyle = style;

    // Calculate position - place near the button
    const popupWidth = 280;
    const popupHeight = Math.min(400, viewportHeight - 40);
    let left, top;

    // Horizontal positioning
    if (fabRect.left + popupWidth + 10 <= viewportWidth) {
      // Place to the right of the button
      left = fabRect.left + fabRect.width + 10;
    } else if (fabRect.left - popupWidth - 10 >= 0) {
      // Place to the left of the button
      left = fabRect.left - popupWidth - 10;
    } else {
      // Center horizontally if no space on sides
      left = Math.max(10, Math.min(viewportWidth - popupWidth - 10, fabRect.left));
    }

    // Vertical positioning
    if (fabRect.top + popupHeight <= viewportHeight - 10) {
      // Align top with button
      top = fabRect.top;
    } else if (fabRect.bottom - popupHeight >= 10) {
      // Align bottom with button
      top = fabRect.bottom - popupHeight;
    } else {
      // Center vertically
      top = Math.max(10, Math.min(viewportHeight - popupHeight - 10, (viewportHeight - popupHeight) / 2));
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';

    // Load prompts, categories and filter
    chrome.storage.local.get(['prompts', 'categories', 'categoryFilter'], (result) => {
      let prompts = result.prompts || [];
      const categories = result.categories || [];
      const selectedCategory = result.categoryFilter || '';
      const body = popup.querySelector('.mini-popup-body');

      if (prompts.length === 0) {
        body.innerHTML = '<div class="mini-prompt-empty">暂无提示词<br>请从扩展图标添加</div>';
        return;
      }

      // Sort by category order
      const categoryOrder = {};
      categories.forEach((cat, index) => { categoryOrder[cat] = index; });
      prompts = [...prompts].sort((a, b) => {
        const orderA = categoryOrder[a.category] !== undefined ? categoryOrder[a.category] : 999;
        const orderB = categoryOrder[b.category] !== undefined ? categoryOrder[b.category] : 999;
        return orderA - orderB;
      });

      // Filter by selected category if any
      if (selectedCategory) {
        prompts = prompts.filter(p => p.category === selectedCategory);
      }

      if (prompts.length === 0) {
        body.innerHTML = `<div class="mini-prompt-empty">${selectedCategory ? '该分类下暂无提示词' : '暂无提示词'}<br>请从扩展图标添加</div>`;
        return;
      }

      body.innerHTML = prompts.map(p => `
        <div class="mini-prompt-item" data-content="${encodeURIComponent(p.content)}">
          <div class="mini-prompt-title">
            ${escapeHtml(p.title)}
            <span class="mini-prompt-category">${escapeHtml(p.category)}</span>
          </div>
          <div class="mini-prompt-content">${escapeHtml(p.content)}</div>
        </div>
      `).join('');

      // Add click handlers
      body.querySelectorAll('.mini-prompt-item').forEach(item => {
        item.addEventListener('click', () => {
          const content = decodeURIComponent(item.dataset.content);

          // Try auto-fill first
          if (tryAutoFill(content)) {
            showToast('已填入输入框');
            closePopup();
          } else {
            // Fallback to clipboard copy
            navigator.clipboard.writeText(content).then(() => {
              showToast('已复制到剪贴板');
              closePopup();
            });
          }
        });
      });
    });

    // Close handlers
    popup.querySelector('.mini-popup-close').addEventListener('click', closePopup);

    // Add click outside listener with delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);

    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'mini-prompt-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  async function init() {
    // Load sites from storage first
    await loadSitesFromStorage();
    // Load input selectors config for auto-fill
    await loadInputSelectors();

    const shouldShow = await shouldShowFAB();
    if (!shouldShow) return;

    const position = await loadPosition();
    createFAB(position);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Listen for storage changes to update FAB visibility
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabledSites) {
      DEFAULT_SITES = changes.enabledSites.newValue || [];
      shouldShowFAB().then((shouldShow) => {
        if (shouldShow && !fab) {
          loadPosition().then(pos => createFAB(pos));
        } else if (!shouldShow && fab) {
          fab.remove();
          fab = null;
        }
      });
    }
  });
})();
