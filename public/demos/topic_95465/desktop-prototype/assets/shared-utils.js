/**
 * @file shared-utils.js
 * @brief Desktop Prototype shared interaction utilities
 * @author Gemsea
 * @company BZI
 * @date 2026-07-03
 */

/* ==========================================================================
 * 1. DMModal — 模态对话框
 * ========================================================================== */

var DMModal = (function() {
  var overlay = null;
  var modal = null;

  function show(opts) {
    // opts: { title, body (HTML string), confirmText (default '确认'),
    //         cancelText (default '取消'), onConfirm (fn), onCancel (fn),
    //         width (default '420px'), closeOnOverlay (default true) }
    close(); // close any existing

    overlay = document.createElement('div');
    overlay.className = 'dm-modal-overlay';

    var cancelHtml = opts.cancelText !== null
      ? '<button class="dm-modal__cancel">' + (opts.cancelText || '取消') + '</button>'
      : '';
    var confirmHtml = opts.confirmText !== null
      ? '<button class="dm-modal__confirm">' + (opts.confirmText || '确认') + '</button>'
      : '';

    modal = document.createElement('div');
    modal.className = 'dm-modal';
    if (opts.width) modal.style.width = opts.width;
    modal.innerHTML =
      '<div class="dm-modal__header">' +
        '<span class="dm-modal__title">' + (opts.title || '') + '</span>' +
        '<button class="dm-modal__close">&times;</button>' +
      '</div>' +
      '<div class="dm-modal__body">' + (opts.body || '') + '</div>' +
      '<div class="dm-modal__footer">' + cancelHtml + confirmHtml + '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    modal.querySelector('.dm-modal__close').addEventListener('click', close);
    if (opts.closeOnOverlay !== false) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) close();
      });
    }
    var confirmBtn = modal.querySelector('.dm-modal__confirm');
    if (confirmBtn && opts.onConfirm) {
      confirmBtn.addEventListener('click', function() {
        opts.onConfirm();
      });
    }
    var cancelBtn = modal.querySelector('.dm-modal__cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        close();
        if (typeof opts.onCancel === 'function') opts.onCancel();
      });
    }

    // Escape key
    document.addEventListener('keydown', handleEscape);

    // Focus first input if any
    setTimeout(function() {
      var input = modal.querySelector('input, textarea');
      if (input) input.focus();
    }, 100);
  }

  function close() {
    if (overlay) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
      modal = null;
    }
    document.removeEventListener('keydown', handleEscape);
    // Also close any open dropdowns
    document.querySelectorAll(
      '.dm-col2__ent-dropdown.show, .dm-col2__model-dropdown.show, .ide__titlebar-user-dropdown.show'
    ).forEach(function(d) {
      d.classList.remove('show');
    });
  }

  function confirm(title, message, onConfirm) {
    show({
      title: title,
      body: '<div style="padding: 4px 0;">' + message + '</div>',
      confirmText: '确认',
      cancelText: '取消',
      onConfirm: function() {
        close();
        if (onConfirm) onConfirm();
      }
    });
  }

  function handleEscape(e) {
    if (e.key === 'Escape') close();
  }

  return { show: show, close: close, confirm: confirm };
})();

/* ==========================================================================
 * 1.5. DMDrawer — 右侧抽屉（资源详情弹出）
 * ========================================================================== */

var DMDrawer = (function() {
  var overlay = null;
  var drawer = null;
  var onCloseCallback = null;

  function show(opts) {
    // opts: { title, body (HTML string), onClose (fn) }
    close(); // close any existing

    onCloseCallback = (typeof opts.onClose === 'function') ? opts.onClose : null;

    overlay = document.createElement('div');
    overlay.className = 'dm-drawer-overlay';

    drawer = document.createElement('div');
    drawer.className = 'dm-drawer';
    drawer.innerHTML =
      '<div class="dm-drawer__header">' +
        '<span class="dm-drawer__title">' + (opts.title || '') + '</span>' +
        '<button class="dm-drawer__close" aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="dm-drawer__body">' + (opts.body || '') + '</div>';

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // Event listeners
    drawer.querySelector('.dm-drawer__close').addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', handleEscape);
  }

  function close() {
    if (!overlay) return;
    var cb = onCloseCallback;
    onCloseCallback = null;
    if (typeof cb === 'function') cb();
    drawer.classList.add('is-closing');
    overlay.style.pointerEvents = 'none';
    var oldOverlay = overlay;
    var oldDrawer = drawer;
    setTimeout(function() {
      if (oldOverlay && oldOverlay.parentNode) {
        oldOverlay.parentNode.removeChild(oldOverlay);
      }
    }, 200);
    overlay = null;
    drawer = null;
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') close();
  }

  return { show: show, close: close };
})();

/* ==========================================================================
 * 2. DMToast — 轻提示
 * ========================================================================== */

var DMToast = (function() {
  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'dm-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type) {
    type = type || 'info';
    var c = getContainer();
    var toast = document.createElement('div');
    toast.className = 'dm-toast dm-toast--' + type;
    toast.textContent = message;
    c.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('dm-toast--leaving');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 150);
    }, 3000);
  }

  return {
    show: show,
    success: function(msg) { show(msg, 'success'); },
    error: function(msg) { show(msg, 'error'); },
    info: function(msg) { show(msg, 'info'); }
  };
})();

/* ==========================================================================
 * 3. DMTabRouter — 标签页路由
 * ========================================================================== */

var DMTabRouter = (function() {
  var tabs = {};        // name -> { render, onEnter, onLeave, _cachedHtml, _container }
  var currentTab = null;
  var containerSel = null;
  var tabbarSel = null;

  function init(containerSelector, tabbarSelector) {
    containerSel = containerSelector;
    tabbarSel = tabbarSelector;
  }

  function register(name, config) {
    tabs[name] = config;
  }

  function hasTab(name) {
    return !!tabs[name];
  }

  function switchTo(name) {
    if (!tabs[name]) return;
    if (!containerSel) return;

    var container = document.querySelector(containerSel);
    if (!container) return;

    // Leave current tab
    if (currentTab && tabs[currentTab] && tabs[currentTab].onLeave) {
      tabs[currentTab].onLeave(container);
    }

    // Cache current content if it's the home tab
    if (currentTab && tabs[currentTab]) {
      if (!tabs[currentTab]._cachedHtml) {
        tabs[currentTab]._cachedHtml = container.innerHTML;
      }
    }

    // Render new tab
    container.innerHTML = '';
    container.className = 'dm-col3__content dm-col3__content--entering';
    tabs[name].render(container);
    currentTab = name;

    // Enter callback
    if (tabs[name].onEnter) {
      tabs[name].onEnter(container);
    }

    // Update tabbar
    if (tabbarSel) {
      var tabbar = document.querySelector(tabbarSel);
      if (tabbar) {
        tabbar.querySelectorAll('.dm-col3__tab').forEach(function(tab) {
          tab.classList.remove('dm-col3__tab--active');
          // 修复 P0-05: 通过 data-tab-name 精确匹配，避免 textContent 包含 × 关闭按钮导致匹配失败
          if (tab.getAttribute('data-tab-name') === name) {
            tab.classList.add('dm-col3__tab--active');
          }
        });
      }
    }

    // Remove animation class
    setTimeout(function() {
      container.classList.remove('dm-col3__content--entering');
    }, 200);
  }

  function addTabButton(name) {
    if (!tabbarSel) return;
    var tabbar = document.querySelector(tabbarSel);
    if (!tabbar) return;

    // 修复 P0-05: 通过 data-tab-name 精确匹配，避免 textContent 受关闭按钮 × 影响
    var existing = null;
    tabbar.querySelectorAll('.dm-col3__tab').forEach(function(tab) {
      if (tab.getAttribute('data-tab-name') === name) existing = tab;
    });
    if (existing) return;

    // Create new tab before the "+" button
    var addBtn = tabbar.querySelector('.dm-col3__tab-btn');
    var newTab = document.createElement('div');
    newTab.className = 'dm-col3__tab';
    newTab.setAttribute('data-tab-name', name);
    var isHome = (name === '首页' || name === 'home');
    if (isHome) {
      // 首页不可关闭，仅显示文本
      newTab.innerHTML = '<span class="dm-col3__tab-label">' + name + '</span>';
    } else {
      // 修复 P0-05: 为非首页标签注入关闭按钮
      newTab.innerHTML = '<span class="dm-col3__tab-label">' + name + '</span>' +
        '<button class="dm-col3__tab-close" title="关闭">&times;</button>';
      var closeBtn = newTab.querySelector('.dm-col3__tab-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          closeTab(name);
        });
      }
    }
    newTab.addEventListener('click', function(e) {
      // 点击关闭按钮不触发切换
      if (e.target.classList.contains('dm-col3__tab-close')) return;
      switchTo(name);
    });
    tabbar.insertBefore(newTab, addBtn);
  }

  // 修复 P0-05: 新增 closeTab 方法，移除标签 DOM 与注册，关闭当前标签则切换回首页
  function closeTab(name) {
    if (name === '首页' || name === 'home') return; // 首页不可关闭
    if (!tabs[name]) return;
    var tabbar = tabbarSel ? document.querySelector(tabbarSel) : null;
    var tabEl = null;
    if (tabbar) {
      tabbar.querySelectorAll('.dm-col3__tab').forEach(function(tab) {
        if (tab.getAttribute('data-tab-name') === name) tabEl = tab;
      });
    }
    // 添加退出动画
    if (tabEl) {
      tabEl.classList.add('dm-col3__tab--closing');
    }
    // 延迟移除以播放动画
    setTimeout(function() {
      if (tabEl && tabEl.parentNode) tabEl.parentNode.removeChild(tabEl);
      delete tabs[name];
      // 若关闭的是当前激活标签，切换回首页
      if (currentTab === name) {
        switchTo('首页');
      }
    }, 150);
  }

  function getCurrentTab() {
    return currentTab;
  }

  return {
    init: init,
    register: register,
    hasTab: hasTab,
    switchTo: switchTo,
    addTabButton: addTabButton,
    closeTab: closeTab,
    getCurrentTab: getCurrentTab
  };
})();

/* ==========================================================================
 * 4. DMAnimate — 动画工具
 * ========================================================================== */

var DMAnimate = (function() {
  function fadeIn(el) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    el.style.transition = 'opacity .2s ease, transform .2s ease';
    setTimeout(function() {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 10);
  }

  function fadeOut(el, cb) {
    if (!el) return;
    el.style.transition = 'opacity .15s ease';
    el.style.opacity = '0';
    setTimeout(function() {
      if (cb) cb();
    }, 150);
  }

  function pulse(el) {
    if (!el) return;
    el.style.animation = 'dm-checkPulse .3s ease';
    setTimeout(function() {
      el.style.animation = '';
    }, 300);
  }

  return { fadeIn: fadeIn, fadeOut: fadeOut, pulse: pulse };
})();

/* ==========================================================================
 * 5. DMBranch — 对话分支管理
 * ========================================================================== */

var DMBranch = (function() {
  var branches = {};
  var currentId = 'main';
  var counter = 1;
  var chatBodySel = '.dm-col2__chat-body';

  function init(selector) {
    chatBodySel = selector || '.dm-col2__chat-body';
    reset();
  }

  function reset() {
    branches = {};
    branches['main'] = { messages: [], parentBranchId: null, splitIndex: 0 };
    currentId = 'main';
    counter = 1;
  }

  function createFrom(msgIndex) {
    var current = branches[currentId];
    if (!current || msgIndex < 0 || msgIndex >= current.messages.length) return;
    var sliced = current.messages.slice(0, msgIndex + 1);
    var newId = 'branch-' + (counter++);
    branches[newId] = {
      messages: sliced.slice(),
      parentBranchId: currentId,
      splitIndex: msgIndex,
      name: null
    };
    currentId = newId;
    renderAllMessages();
  }

  // 获取分支显示名:优先使用自定义名称,否则回退到默认名
  function getBranchName(branchId) {
    var b = branches[branchId];
    if (!b) return '';
    if (b.name) return b.name;
    return branchId === 'main' ? '主分支' : '分支 ' + branchId.replace('branch-', '');
  }

  // 删除分支:主分支不可删除;删除当前分支则切到父分支或 main
  function deleteBranch(branchId) {
    if (branchId === 'main' || !branches[branchId]) return false;
    var parentId = branches[branchId].parentBranchId;
    delete branches[branchId];
    if (currentId === branchId) {
      currentId = (parentId && branches[parentId]) ? parentId : 'main';
    }
    renderAllMessages();
    return true;
  }

  // 重命名分支:主分支不可重命名;名称去空格后非空才生效
  function renameBranch(branchId, newName) {
    if (branchId === 'main' || !branches[branchId]) return false;
    var trimmed = (newName || '').trim();
    if (!trimmed) return false;
    branches[branchId].name = trimmed;
    renderAllMessages();
    return true;
  }

  // 复制分支:拷贝消息列表,生成新分支并切换
  function duplicateBranch(branchId) {
    if (!branches[branchId]) return null;
    var src = branches[branchId];
    var newId = 'branch-' + (counter++);
    branches[newId] = {
      messages: src.messages.slice(),
      parentBranchId: branchId,
      splitIndex: src.messages.length - 1,
      name: null
    };
    currentId = newId;
    renderAllMessages();
    return newId;
  }

  function switchTo(branchId) {
    if (!branches[branchId]) return;
    currentId = branchId;
    renderAllMessages();
  }

  function addMessage(msg) {
    if (!branches[currentId]) return;
    branches[currentId].messages.push(msg);
  }

  function getCurrentMessages() {
    return branches[currentId] ? branches[currentId].messages : [];
  }

  function getAllBranches() {
    var result = [];
    for (var id in branches) {
      if (branches.hasOwnProperty(id)) {
        result.push({ id: id, msgCount: branches[id].messages.length, parentBranchId: branches[id].parentBranchId });
      }
    }
    return result;
  }

  function getMessageHtml(msg, msgIndex) {
    if (msg.role === 'bot') {
      var html = '<div class="dm-col2__msg dm-col2__msg--bot">' +
        '<div class="dm-col2__msg-avatar"><svg class="dm-icon" width="14" height="14" aria-hidden="true"><use href="#icon-sparkles"/></svg></div>' +
        '<div class="dm-col2__msg-body">' +
          '<div class="dm-col2__msg-header">' +
            '<span class="dm-col2__msg-role">小专快</span>' +
            '<span class="dm-col2__msg-model">GPT-4o</span>' +
            '<span class="dm-col2__msg-time">' + (msg.time || '') + '</span>' +
            '<div class="dm-col2__msg-actions">' +
              '<button class="dm-col2__msg-action-btn" title="复制" data-action="copy">&#x1F4CB;</button>' +
              '<button class="dm-col2__msg-action-btn" title="重新生成" data-action="regenerate">&#x21BB;</button>' +
            '</div>' +
          '</div>' +
          '<div class="dm-col2__msg-content">' + msg.text + '</div>';
      if (msg.resultCardHtml) {
        html += msg.resultCardHtml;
      }
      html += '<div class="dm-col2__msg-footer">' +
          '<button class="dm-col2__msg-branch-btn" data-branch-from="' + msgIndex + '">从此处分支</button>' +
          '<div class="dm-col2__msg-feedback">' +
            '<button class="dm-col2__msg-feedback-btn" data-action="thumbs-up">&#x1F44D;</button>' +
            '<button class="dm-col2__msg-feedback-btn" data-action="thumbs-down">&#x1F44E;</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
      return html;
    } else {
      var html2 = '<div class="dm-col2__msg dm-col2__msg--user">' +
        '<div class="dm-col2__msg-body dm-col2__msg-body--user">' +
          '<div class="dm-col2__msg-header">' +
            '<span class="dm-col2__msg-role">王会计</span>' +
            '<span class="dm-col2__msg-time">' + (msg.time || '') + '</span>' +
            '<div class="dm-col2__msg-actions">' +
              '<button class="dm-col2__msg-action-btn" title="编辑" data-action="edit">&#x270E;</button>' +
            '</div>' +
          '</div>' +
          '<div class="dm-col2__msg-content">' + msg.text + '</div>' +
        '</div></div>';
      return html2;
    }
  }

  function renderAllMessages() {
    var chatBody = document.querySelector(chatBodySel);
    if (!chatBody) return;

    // Check if greeting exists
    var greeting = chatBody.querySelector('.dm-col2__greeting');
    if (greeting) greeting.style.display = 'none';

    // Remove existing messages but keep greeting and composer
    var existingMsgs = chatBody.querySelectorAll('.dm-col2__msg, .dm-col2__branch-bar');
    for (var i = 0; i < existingMsgs.length; i++) {
      if (existingMsgs[i].parentNode) existingMsgs[i].parentNode.removeChild(existingMsgs[i]);
    }

    // Render branch bar into top container (outside message stream)
    var allBr = getAllBranches();
    var topBar = document.getElementById('branchBarTop');
    if (topBar) {
      if (allBr.length > 1) {
        var branchIdx = 0;
        for (var bi = 0; bi < allBr.length; bi++) {
          if (allBr[bi].id === currentId) { branchIdx = bi; break; }
        }
        var branchName = getBranchName(currentId);
        var barHtml = '<span class="dm-col2__branch-label">分支:</span>' +
          '<button class="dm-col2__branch-arrow" data-branch-prev="' + (branchIdx > 0 ? allBr[branchIdx-1].id : '') + '"' + (branchIdx > 0 ? '' : ' disabled') + '>&#x2039;</button>' +
          '<span class="dm-col2__branch-name">' + branchName + '</span>' +
          '<span class="dm-col2__branch-count">(' + (branchIdx+1) + '/' + allBr.length + ')</span>' +
          '<button class="dm-col2__branch-arrow" data-branch-next="' + (branchIdx < allBr.length-1 ? allBr[branchIdx+1].id : '') + '"' + (branchIdx < allBr.length-1 ? '' : ' disabled') + '>&#x203a;</button>';
        // 主分支不可删除/重命名,仅子分支显示管理图标
        if (currentId !== 'main') {
          barHtml += '<div class="dm-col2__branch-actions">' +
            '<button class="dm-col2__branch-action-btn" data-branch-action="rename" title="重命名分支">' +
              '<svg class="dm-icon" width="12" height="12" aria-hidden="true"><use href="#icon-edit"/></svg>' +
            '</button>' +
            '<button class="dm-col2__branch-action-btn" data-branch-action="duplicate" title="复制分支">' +
              '<svg class="dm-icon" width="12" height="12" aria-hidden="true"><use href="#icon-copy"/></svg>' +
            '</button>' +
            '<button class="dm-col2__branch-action-btn dm-col2__branch-action-btn--danger" data-branch-action="delete" title="删除分支">' +
              '<svg class="dm-icon" width="12" height="12" aria-hidden="true"><use href="#icon-trash"/></svg>' +
            '</button>' +
          '</div>';
        }
        topBar.innerHTML = barHtml;
        topBar.style.display = '';
        topBar.classList.remove('dm-col2__branch-bar-top--hidden');
        // Bind arrow clicks
        var prevBtn = topBar.querySelector('[data-branch-prev]');
        var nextBtn = topBar.querySelector('[data-branch-next]');
        if (prevBtn && prevBtn.getAttribute('data-branch-prev')) {
          prevBtn.addEventListener('click', function() { switchTo(this.getAttribute('data-branch-prev')); });
        }
        if (nextBtn && nextBtn.getAttribute('data-branch-next')) {
          nextBtn.addEventListener('click', function() { switchTo(this.getAttribute('data-branch-next')); });
        }
        // 绑定分支管理图标事件(重命名/复制/删除)
        var actionBtns = topBar.querySelectorAll('.dm-col2__branch-action-btn');
        for (var ai = 0; ai < actionBtns.length; ai++) {
          (function(btn) {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              var action = this.getAttribute('data-branch-action');
              var targetId = currentId; // 操作当前分支
              if (action === 'delete') {
                DMModal.confirm(
                  '删除分支',
                  '确定要删除 "' + getBranchName(targetId) + '" 吗?此操作不可恢复,分支内的所有消息将丢失。',
                  function() {
                    if (deleteBranch(targetId)) {
                      DMToast.success('分支已删除');
                    } else {
                      DMToast.error('无法删除该分支');
                    }
                  }
                );
              } else if (action === 'rename') {
                var currentName = getBranchName(targetId);
                DMModal.show({
                  title: '重命名分支',
                  body: '<div style="padding:8px 0;"><input type="text" id="branchRenameInput" value="' + currentName + '" style="width:100%;padding:6px 8px;border:1px solid var(--border-neutral-l2);border-radius:var(--radius-4);background:var(--bg-base-default);color:var(--text-default);font-size:var(--body-base-font-size);outline:none;" /></div>',
                  confirmText: '保存',
                  cancelText: '取消',
                  onConfirm: function() {
                    var input = document.getElementById('branchRenameInput');
                    var newName = input ? input.value.trim() : '';
                    if (!newName) {
                      DMToast.error('分支名不能为空');
                      return;
                    }
                    if (renameBranch(targetId, newName)) {
                      DMToast.success('分支已重命名');
                      DMModal.close();
                    } else {
                      DMToast.error('重命名失败');
                    }
                  }
                });
              } else if (action === 'duplicate') {
                var newId = duplicateBranch(targetId);
                if (newId) {
                  DMToast.success('已复制到新分支');
                } else {
                  DMToast.error('复制失败');
                }
              }
            });
          })(actionBtns[ai]);
        }
      } else {
        topBar.style.display = 'none';
        topBar.classList.add('dm-col2__branch-bar-top--hidden');
      }
    }

    // Render messages
    var msgs = branches[currentId].messages;
    var msgsHtml = '';
    for (var m = 0; m < msgs.length; m++) {
      msgsHtml += getMessageHtml(msgs[m], m);
    }

    // Insert before composer
    var composer = chatBody.querySelector('.dm-col2__composer, .dm-col2__composer-v2');
    if (composer) {
      composer.insertAdjacentHTML('beforebegin', msgsHtml);
    } else {
      chatBody.innerHTML += msgsHtml;
    }

    chatBody.scrollTop = chatBody.scrollHeight;

    // Bind branch-related events
    bindBranchEvents(chatBody);
  }

  function appendSingleMessage(msg) {
    var chatBody = document.querySelector(chatBodySel);
    if (!chatBody) return;
    var msgs = branches[currentId].messages;
    var msgIndex = msgs.length - 1;
    var html = getMessageHtml(msg, msgIndex);

    var composer = chatBody.querySelector('.dm-col2__composer, .dm-col2__composer-v2');
    if (composer) {
      composer.insertAdjacentHTML('beforebegin', html);
    } else {
      chatBody.innerHTML += html;
    }
    chatBody.scrollTop = chatBody.scrollHeight;
    bindBranchEvents(chatBody);
  }

  function bindBranchEvents(chatBody) {
    // Branch-from buttons
    var branchBtns = chatBody.querySelectorAll('.dm-col2__msg-branch-btn');
    for (var i = 0; i < branchBtns.length; i++) {
      (function(btn) {
        if (btn.getAttribute('data-bound')) return;
        btn.setAttribute('data-bound', '1');
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var idx = parseInt(this.getAttribute('data-branch-from'), 10);
          createFrom(idx);
        });
      })(branchBtns[i]);
    }

    // Branch switch buttons
    var switchBtns = chatBody.querySelectorAll('.dm-col2__branch-btn');
    for (var j = 0; j < switchBtns.length; j++) {
      (function(btn) {
        if (btn.getAttribute('data-bound')) return;
        btn.setAttribute('data-bound', '1');
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var bid = this.getAttribute('data-branch-id');
          switchTo(bid);
        });
      })(switchBtns[j]);
    }

    // Action buttons (copy, regenerate, edit) - demo behavior
    var actionBtns = chatBody.querySelectorAll('.dm-col2__msg-action-btn');
    for (var k = 0; k < actionBtns.length; k++) {
      (function(btn) {
        if (btn.getAttribute('data-bound')) return;
        btn.setAttribute('data-bound', '1');
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var action = this.getAttribute('data-action');
          if (action === 'copy') {
            DMToast.info('已复制到剪贴板');
          } else if (action === 'regenerate') {
            DMToast.info('正在重新生成...');
          } else if (action === 'edit') {
            DMToast.info('编辑功能演示中');
          }
        });
      })(actionBtns[k]);
    }

    // Feedback buttons
    var feedbackBtns = chatBody.querySelectorAll('.dm-col2__msg-feedback-btn');
    for (var f = 0; f < feedbackBtns.length; f++) {
      (function(btn) {
        if (btn.getAttribute('data-bound')) return;
        btn.setAttribute('data-bound', '1');
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var action = this.getAttribute('data-action');
          if (action === 'thumbs-up') {
            DMToast.success('感谢反馈');
          } else if (action === 'thumbs-down') {
            DMToast.info('感谢反馈，会持续改进');
          }
        });
      })(feedbackBtns[f]);
    }
  }

  return {
    init: init,
    reset: reset,
    createFrom: createFrom,
    switchTo: switchTo,
    addMessage: addMessage,
    getCurrentMessages: getCurrentMessages,
    getAllBranches: getAllBranches,
    renderAllMessages: renderAllMessages,
    appendSingleMessage: appendSingleMessage,
    getMessageHtml: getMessageHtml,
    // 分支管理(重命名/复制/删除)
    deleteBranch: deleteBranch,
    renameBranch: renameBranch,
    duplicateBranch: duplicateBranch,
    getBranchName: getBranchName
  };
})();

/* ==========================================================================
 * 6. DMData — 标签页内容生成器
 * ========================================================================== */

var DMData = (function() {

  /* ---------- helpers ---------- */

  function breadcrumb(items) {
    // 修复 P1 Task 10: 为非当前层级项增加 data-breadcrumb 属性，配合 desktop-main.html 事件委托实现可点击导航
    var html = '<div class="dm-col3__breadcrumb" style="display:flex;align-items:center;gap:6px;margin-bottom:var(--spacer-16);font-size:var(--body-xs);">';
    for (var i = 0; i < items.length; i++) {
      if (i > 0) html += '<span style="color:var(--text-tertiary);">/</span>';
      if (i < items.length - 1) {
        html += '<span class="dm-col3__breadcrumb-item" data-breadcrumb="' + items[i] + '" style="color:var(--text-tertiary);cursor:pointer;transition:color .12s;" onmouseover="this.style.color=\'var(--text-secondary)\'" onmouseout="this.style.color=\'var(--text-tertiary)\'">' + items[i] + '</span>';
      } else {
        html += '<span style="color:var(--text-default);">' + items[i] + '</span>';
      }
    }
    html += '</div>';
    return html;
  }

  function statCard(label, value, detail) {
    return '<div class="dm-col3__stat-card" style="cursor:pointer;" onclick="DMToast.info(\'' + label + ' - 功能演示中\')">' +
      '<div class="dm-col3__stat-label">' + label + '</div>' +
      '<div class="dm-col3__stat-value">' + value + '</div>' +
      '<div class="dm-col3__stat-detail">' + detail + '</div>' +
      '</div>';
  }

  function moduleCard(title, desc, icon, actionText) {
    var iconColor = 'var(--module-color-tax)';
    var iconSurface = 'var(--module-color-tax-surface)';
    if (title.indexOf('发票') >= 0) { iconColor = 'var(--module-color-bank)'; iconSurface = 'var(--module-color-bank-surface)'; }
    else if (title.indexOf('申报') >= 0) { iconColor = 'var(--module-color-business)'; iconSurface = 'var(--module-color-business-surface)'; }
    else if (title.indexOf('检测') >= 0) { iconColor = 'var(--module-color-ip)'; iconSurface = 'var(--module-color-ip-surface)'; }
    else if (title.indexOf('报表') >= 0) { iconColor = 'var(--module-color-report)'; iconSurface = 'var(--module-color-report-surface)'; }
    return '<div class="dm-col3__module-card" style="cursor:pointer;" onclick="DMToast.info(\'' + title + ' - 功能演示中\')">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<div style="width:32px;height:32px;border-radius:var(--radius-6);background:' + iconSurface + ';display:flex;align-items:center;justify-content:center;">' +
          '<span style="font-size:var(--body-md-font-size);color:' + iconColor + ';">&#x1F4CB;</span>' +
        '</div>' +
        '<div class="dm-col3__module-title">' + title + '</div>' +
      '</div>' +
      '<div class="dm-col3__module-desc">' + desc + '</div>' +
      '</div>';
  }

  function listTable(headers, rows) {
    var cols = headers.length;
    var gridTemplate = '';
    for (var i = 0; i < cols; i++) {
      gridTemplate += (i === 0 ? '2fr' : '1fr') + ' ';
    }
    var html = '<div class="dm-col3__list">' +
      '<div class="dm-col3__list-header" style="grid-template-columns:' + gridTemplate.trim() + ';">';
    for (var h = 0; h < headers.length; h++) {
      html += '<span>' + headers[h] + '</span>';
    }
    html += '</div>';
    for (var r = 0; r < rows.length; r++) {
      html += '<div class="dm-col3__list-item" style="grid-template-columns:' + gridTemplate.trim() + ';">';
      for (var c = 0; c < rows[r].length; c++) {
        html += '<span>' + rows[r][c] + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /* ---------- tab content renderers ---------- */

  var tabContents = {};

  // 首页
  tabContents['首页'] = function(container) {
    if (this._cachedHtml) {
      container.innerHTML = this._cachedHtml;
    }
  };

  // 税务
  tabContents['税务'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '税务']) +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--spacer-12);">' +
        '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);">华信科技有限公司</div>' +
        '<span class="dm-col3__badge dm-col3__badge--primary">记账中</span>' +
      '</div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('本月申报', '3/5', '<span style="color:var(--status-success-default);">进行中</span>') +
        statCard('待处理发票', '89', '<span style="color:var(--status-warning-default);">较上月 +12</span>') +
        statCard('税负率', '3.2%', '行业均值 3.5%') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('发票管理', '进项89张 / 销项76张') +
        moduleCard('纳税申报', '增值税 · 企业所得税 · 印花税') +
        moduleCard('税负检测', '实时监控税负异常') +
        moduleCard('税务报表', '资产负债表 · 利润表') +
      '</div>' +
      '<div class="dm-col3__table-header">最近操作</div>' +
      listTable(
        ['操作', '状态', '日期'],
        [
          ['增值税申报 - 6月', '<span class="dm-col3__badge dm-col3__badge--success">已完成</span>', '2026-06-28'],
          ['进项发票OCR', '<span class="dm-col3__badge dm-col3__badge--primary">处理中</span>', '2026-06-27'],
          ['税负分析报告', '<span class="dm-col3__badge dm-col3__badge--muted">已生成</span>', '2026-06-25']
        ]
      );
  };

  // 工商
  tabContents['工商'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '工商']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司</div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('工商年报', '已完成', '<span style="color:var(--status-success-default);">2026年度</span>') +
        statCard('工商变更', '0', '无待办变更') +
        statCard('证照到期', '2', '<span style="color:var(--status-warning-default);">30天内</span>') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('工商年报', '年度报告填报与公示') +
        moduleCard('工商变更', '名称/地址/经营范围/股权') +
        moduleCard('注销清算', '简易注销 / 一般注销') +
      '</div>' +
      '<div class="dm-col3__table-header">最近操作</div>' +
      listTable(
        ['操作', '状态', '日期'],
        [
          ['2025年度工商年报', '<span class="dm-col3__badge dm-col3__badge--success">已完成</span>', '2026-05-15'],
          ['营业执照续期', '<span class="dm-col3__badge dm-col3__badge--primary">审核中</span>', '2026-06-20']
        ]
      );
  };

  // 银行
  tabContents['银行'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '银行']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司</div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('对账账户', '3', '已授权') +
        statCard('本月流水', '156笔', '较上月 +23') +
        statCard('待处理回单', '8', '需确认') +
      '</div>' +
      '<div class="dm-col3__table-header">银行账户</div>' +
      listTable(
        ['账户名称', '银行', '账号', '余额'],
        [
          ['基本户', '中国银行', '****1234', '¥245,680.00'],
          ['一般户', '工商银行', '****5678', '¥89,120.50'],
          ['纳税专户', '建设银行', '****9012', '¥12,000.00']
        ]
      );
  };

  // 合同
  tabContents['合同'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '合同']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司</div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">生效中</button>' +
        '<button class="dm-col3__list-toolbar-btn">即将到期</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">+ 新增合同</button>' +
      '</div>' +
      listTable(
        ['合同编号', '甲方', '金额', '状态', '到期日'],
        [
          ['HT-2026-001', '华信科技有限公司', '¥500,000', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>', '2027-06-30'],
          ['HT-2026-002', '明达贸易有限公司', '¥320,000', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>', '2027-03-15'],
          ['HT-2025-018', '众诚电子有限公司', '¥180,000', '<span class="dm-col3__badge dm-col3__badge--warning">即将到期</span>', '2026-08-20'],
          ['HT-2026-003', '华信科技有限公司', '¥750,000', '<span class="dm-col3__badge dm-col3__badge--primary">审核中</span>', '-']
        ]
      );
  };

  // 客户服务（4 类：合同履行 / 客户关怀 / 待回复 / 登录密钥）
  tabContents['客户服务'] = function(container) {
    // 根据分类生成对应的新增表单 HTML
    function getCsFormHtml(category) {
      if (category === '合同履行') {
        return '<div class="dm-form-group"><label class="dm-form-label">合同编号</label><input class="dm-form-input" value="HT-2026-' + (Math.floor(Math.random() * 900) + 100) + '" readonly></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">客户</label><input class="dm-form-input" placeholder="请输入客户名称"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">合同金额</label><input class="dm-form-input" type="number" placeholder="请输入金额（元）"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">履行进度</label><input class="dm-form-input" type="number" min="0" max="100" placeholder="0-100"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">状态</label><select class="dm-form-select"><option>履行中</option><option>已完成</option><option>已暂停</option></select></div>';
      }
      if (category === '客户关怀') {
        return '<div class="dm-form-group"><label class="dm-form-label">工单编号</label><input class="dm-form-input" value="WO-CC-' + (Math.floor(Math.random() * 900) + 100) + '" readonly></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">客户</label><input class="dm-form-input" placeholder="请输入客户名称"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">关怀类型</label><select class="dm-form-select"><option>生日关怀</option><option>节日问候</option><option>满意度回访</option><option>其他</option></select></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">状态</label><select class="dm-form-select"><option>待处理</option><option>处理中</option><option>已完成</option></select></div>';
      }
      if (category === '待回复') {
        return '<div class="dm-form-group"><label class="dm-form-label">工单编号</label><input class="dm-form-input" value="WO-PR-' + (Math.floor(Math.random() * 900) + 100) + '" readonly></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">客户</label><input class="dm-form-input" placeholder="请输入客户名称"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">问题类型</label><select class="dm-form-select"><option>咨询</option><option>需求</option><option>投诉</option><option>其他</option></select></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">优先级</label><select class="dm-form-select"><option>高</option><option selected>中</option><option>低</option></select></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">状态</label><select class="dm-form-select"><option selected>待回复</option><option>已回复</option><option>已关闭</option></select></div>';
      }
      if (category === '登录密钥') {
        return '<div class="dm-form-group"><label class="dm-form-label">平台名称</label><input class="dm-form-input" placeholder="如：国家税务总局"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">平台 URL</label><input class="dm-form-input" placeholder="https://"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">凭证类型</label><select class="dm-form-select" id="dm-cs-credential-type"><option value="账号密码">账号密码</option><option value="API Key">API Key</option><option value="OAuth Token">OAuth Token</option></select></div>' +
          '<div class="dm-form-group" id="dm-cs-username-field"><label class="dm-form-label">用户名</label><input class="dm-form-input" placeholder="请输入用户名"></div>' +
          '<div class="dm-form-group" id="dm-cs-password-field"><label class="dm-form-label">密码</label><div style="position:relative;"><input class="dm-form-input" type="password" id="dm-cs-password" placeholder="请输入密码"><button type="button" id="dm-cs-password-toggle" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-tertiary);cursor:pointer;font-size:var(--body-md-font-size);">显示</button></div></div>' +
          '<div class="dm-form-group" id="dm-cs-apikey-field" style="display:none;"><label class="dm-form-label">API Key</label><input class="dm-form-input" placeholder="请输入 API Key"></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">备注</label><textarea class="dm-form-input" rows="2" placeholder="可选备注信息" style="resize:vertical;font-family:inherit;"></textarea></div>';
      }
      return '<div class="dm-form-group"><label class="dm-form-label">名称</label><input class="dm-form-input"></div>';
    }

    // 绑定登录密钥表单的凭证类型切换 & 密码显示/隐藏（须在 DMModal.show 之后调用）
    function bindCredentialTypeToggle() {
      var select = document.getElementById('dm-cs-credential-type');
      if (!select) return;
      var usernameField = document.getElementById('dm-cs-username-field');
      var passwordField = document.getElementById('dm-cs-password-field');
      var apikeyField = document.getElementById('dm-cs-apikey-field');

      function update() {
        var type = select.value;
        if (type === 'API Key' || type === 'OAuth Token') {
          if (usernameField) usernameField.style.display = 'none';
          if (passwordField) passwordField.style.display = 'none';
          if (apikeyField) apikeyField.style.display = 'block';
        } else {
          // 账号密码
          if (usernameField) usernameField.style.display = 'block';
          if (passwordField) passwordField.style.display = 'block';
          if (apikeyField) apikeyField.style.display = 'none';
        }
      }

      select.addEventListener('change', update);

      // 密码显示/隐藏切换
      var toggle = document.getElementById('dm-cs-password-toggle');
      var pwd = document.getElementById('dm-cs-password');
      if (toggle && pwd) {
        toggle.addEventListener('click', function() {
          if (pwd.type === 'password') {
            pwd.type = 'text';
            toggle.textContent = '隐藏';
          } else {
            pwd.type = 'password';
            toggle.textContent = '显示';
          }
        });
      }
    }

    container.innerHTML = breadcrumb(['首页', '客户服务']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">客户服务</div>' +
      '<div class="dm-col3__cs-category">' +
        '<div class="dm-col3__cs-category-header"><span class="dm-col3__cs-icon">📋</span><span class="dm-col3__cs-title">合同履行</span><button class="dm-col3__cs-add-btn" data-cs-category="合同履行">+ 新增</button></div>' +
        listTable(
          ['合同编号', '客户', '合同金额', '履行进度', '状态'],
          [
            ['HT-2026-001', '华信科技', '¥500,000', '<span style="display:inline-block;width:50px;height:6px;background:var(--bg-overlay-l2);border-radius:3px;vertical-align:middle;margin-right:4px;"><span style="display:inline-block;width:80%;height:100%;background:var(--bg-brand);border-radius:3px;"></span></span>80%', '<span class="dm-col3__badge dm-col3__badge--primary">履行中</span>'],
            ['HT-2026-002', '明达贸易', '¥320,000', '<span style="display:inline-block;width:50px;height:6px;background:var(--bg-overlay-l2);border-radius:3px;vertical-align:middle;margin-right:4px;"><span style="display:inline-block;width:100%;height:100%;background:var(--status-success-default);border-radius:3px;"></span></span>100%', '<span class="dm-col3__badge dm-col3__badge--success">已完成</span>']
          ]
        ) +
      '</div>' +
      '<div class="dm-col3__cs-category">' +
        '<div class="dm-col3__cs-category-header"><span class="dm-col3__cs-icon">💝</span><span class="dm-col3__cs-title">客户关怀</span><button class="dm-col3__cs-add-btn" data-cs-category="客户关怀">+ 新增</button></div>' +
        listTable(
          ['工单编号', '客户', '关怀类型', '状态', '创建日期'],
          [
            ['WO-CC-001', '众诚电子', '生日关怀', '<span class="dm-col3__badge dm-col3__badge--success">已完成</span>', '2026-06-30'],
            ['WO-CC-002', '华信科技', '节日问候', '<span class="dm-col3__badge dm-col3__badge--primary">处理中</span>', '2026-07-02']
          ]
        ) +
      '</div>' +
      '<div class="dm-col3__cs-category">' +
        '<div class="dm-col3__cs-category-header"><span class="dm-col3__cs-icon">💬</span><span class="dm-col3__cs-title">待回复</span><button class="dm-col3__cs-add-btn" data-cs-category="待回复">+ 新增</button></div>' +
        listTable(
          ['工单编号', '客户', '问题类型', '优先级', '状态', '创建日期'],
          [
            ['WO-PR-001', '明达贸易', '税务咨询', '高', '<span class="dm-col3__badge dm-col3__badge--success">已回复</span>', '2026-07-01'],
            ['WO-PR-002', '众诚电子', '工商咨询', '中', '<span class="dm-col3__badge dm-col3__badge--warning">待回复</span>', '2026-07-03'],
            ['WO-PR-003', '华信科技', '报表定制需求', '中', '<span class="dm-col3__badge dm-col3__badge--primary">处理中</span>', '2026-07-02']
          ]
        ) +
      '</div>' +
      '<div class="dm-col3__cs-category">' +
        '<div class="dm-col3__cs-category-header"><span class="dm-col3__cs-icon">🔑</span><span class="dm-col3__cs-title">登录密钥</span><button class="dm-col3__cs-add-btn" data-cs-category="登录密钥">+ 新增</button></div>' +
        listTable(
          ['平台名称', '平台 URL', '凭证类型', '状态', '更新时间'],
          [
            ['国家税务总局', 'https://etax.chinatax.gov.cn', '账号密码', '<span class="dm-col3__badge dm-col3__badge--success">正常</span>', '2026-06-15'],
            ['国家企业信用信息公示系统', 'https://gsxt.gov.cn', '账号密码', '<span class="dm-col3__badge dm-col3__badge--success">正常</span>', '2026-05-20'],
            ['电子发票服务平台', 'https://fpdk.chinatax.gov.cn', 'API Key', '<span class="dm-col3__badge dm-col3__badge--warning">已过期</span>', '2026-04-10']
          ]
        ) +
      '</div>';

    // 新增按钮事件委托：根据分类调用不同表单
    container.querySelectorAll('.dm-col3__cs-add-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var category = this.getAttribute('data-cs-category');
        var formHtml = getCsFormHtml(category);
        DMModal.show({
          title: '新增' + category,
          body: formHtml,
          confirmText: '保存',
          cancelText: '取消',
          width: '520px',
          onConfirm: function() {
            DMModal.close();
            DMToast.success('已保存（演示）');
          }
        });
        // 登录密钥表单需要绑定凭证类型切换事件（须在模态框 DOM 渲染后）
        if (category === '登录密钥') {
          bindCredentialTypeToggle();
        }
      });
    });
  };

  // 客户配置
  tabContents['客户配置'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '客户配置']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-16);">华信科技有限公司</div>' +
      '<div class="dm-form-group"><label class="dm-form-label">企业名称</label><input class="dm-form-input" value="华信科技有限公司" /></div>' +
      '<div class="dm-form-group"><label class="dm-form-label">统一社会信用代码</label><input class="dm-form-input" value="91310115MA1K4XXX0X" /></div>' +
      '<div class="dm-form-row">' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">纳税人识别号</label><input class="dm-form-input" value="91310115MA1K4XXX0X" /></div>' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">纳税人类型</label><input class="dm-form-input" value="一般纳税人" /></div>' +
      '</div>' +
      '<div class="dm-form-row">' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">注册地址</label><input class="dm-form-input" value="上海市浦东新区XX路XX号" /></div>' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">联系电话</label><input class="dm-form-input" value="021-12345678" /></div>' +
      '</div>' +
      '<div style="margin-top:var(--spacer-16);text-align:right;"><button class="dm-modal__confirm" onclick="DMToast.success(\'配置已保存\')">保存配置</button></div>';
  };

  // 统一凭证
  tabContents['统一凭证'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '统一凭证']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司 - 2026年6月</div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">已确认</button>' +
        '<button class="dm-col3__list-toolbar-btn">待确认</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">+ 新增凭证</button>' +
      '</div>' +
      listTable(
        ['凭证号', '摘要', '借方金额', '贷方金额', '状态'],
        [
          ['V-2026-06-001', '收到货款 - 华信', '¥50,000', '', '<span class="dm-col3__badge dm-col3__badge--success">已确认</span>'],
          ['V-2026-06-002', '支付工资', '¥85,000', '', '<span class="dm-col3__badge dm-col3__badge--success">已确认</span>'],
          ['V-2026-06-003', '采购原材料 - 明达', '¥32,000', '', '<span class="dm-col3__badge dm-col3__badge--warning">待确认</span>'],
          ['V-2026-06-004', '销售商品 - 众诚', '', '¥120,000', '<span class="dm-col3__badge dm-col3__badge--warning">待确认</span>'],
          ['V-2026-06-005', '办公室租金', '¥8,000', '', '<span class="dm-col3__badge dm-col3__badge--primary">审核中</span>']
        ]
      );
  };

  // 资料管理
  tabContents['资料管理'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '资料管理']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司</div>' +
      listTable(
        ['文件名', '类型', '大小', '上传日期', '状态'],
        [
          ['营业执照扫描件.pdf', '证照', '2.4 MB', '2026-01-15', '<span class="dm-col3__badge dm-col3__badge--success">已归档</span>'],
          ['开户许可证.pdf', '银行', '1.1 MB', '2026-01-15', '<span class="dm-col3__badge dm-col3__badge--success">已归档</span>'],
          ['6月进项发票.zip', '发票', '15.7 MB', '2026-06-30', '<span class="dm-col3__badge dm-col3__badge--primary">处理中</span>'],
          ['租赁合同.pdf', '合同', '3.2 MB', '2026-03-01', '<span class="dm-col3__badge dm-col3__badge--success">已归档</span>'],
          ['章程修正案.docx', '工商', '856 KB', '2026-05-20', '<span class="dm-col3__badge dm-col3__badge--success">已归档</span>']
        ]
      );
  };

  // 系统配置
  tabContents['系统配置'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '系统配置']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-16);">系统配置</div>' +
      '<div class="dm-form-group"><label class="dm-form-label">通用设置</label>' +
        '<div class="dm-form-row"><div class="dm-form-group" style="flex:1"><label class="dm-form-label">系统名称</label><input class="dm-form-input" value="小专快企服中心" /></div>' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">语言</label><select class="dm-form-select"><option>简体中文</option><option>English</option></select></div></div>' +
      '</div>' +
      '<div class="dm-form-group"><label class="dm-form-label">通知设置</label>' +
        '<div class="dm-form-row"><div class="dm-form-group" style="flex:1"><label class="dm-form-label">任务提醒</label><input class="dm-form-input" value="开启" /></div>' +
        '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">到期提醒(天)</label><input class="dm-form-input" value="30" /></div></div>' +
      '</div>' +
      '<div style="margin-top:var(--spacer-16);text-align:right;"><button class="dm-modal__confirm" onclick="DMToast.success(\'配置已保存\')">保存配置</button></div>';
  };

  // 财务报表 - 资产负债表数据
  function getBalanceSheetHtml() {
    return '<table class="dm-col3__report-table">' +
      '<thead><tr class="dm-col3__report-table--header"><th>科目</th><th>本期金额</th><th>上期金额</th></tr></thead>' +
      '<tbody>' +
        '<tr class="dm-col3__report-table--section"><td colspan="3">资产类</td></tr>' +
        '<tr><td>货币资金</td><td>¥425,680.00</td><td>¥356,800.00</td></tr>' +
        '<tr><td>应收账款</td><td>¥385,000.00</td><td>¥420,000.00</td></tr>' +
        '<tr><td>存货</td><td>¥320,000.00</td><td>¥280,000.00</td></tr>' +
        '<tr><td>固定资产</td><td>¥608,000.00</td><td>¥620,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>资产总计</td><td>¥1,738,680.00</td><td>¥1,676,800.00</td></tr>' +
        '<tr class="dm-col3__report-table--section"><td colspan="3">负债及所有者权益类</td></tr>' +
        '<tr><td>应付账款</td><td>¥220,000.00</td><td>¥185,000.00</td></tr>' +
        '<tr><td>短期借款</td><td>¥200,000.00</td><td>¥200,000.00</td></tr>' +
        '<tr><td>实收资本</td><td>¥1,000,000.00</td><td>¥1,000,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>负债及所有者权益总计</td><td>¥1,738,680.00</td><td>¥1,676,800.00</td></tr>' +
      '</tbody>' +
    '</table>';
  }

  // 财务报表 - 利润表数据
  function getIncomeStatementHtml() {
    return '<table class="dm-col3__report-table">' +
      '<thead><tr class="dm-col3__report-table--header"><th>科目</th><th>本期金额</th><th>上期金额</th></tr></thead>' +
      '<tbody>' +
        '<tr><td>营业收入</td><td>¥856,000.00</td><td>¥760,000.00</td></tr>' +
        '<tr><td>营业成本</td><td>¥512,000.00</td><td>¥473,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>营业利润</td><td>¥198,455.00</td><td>¥161,500.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>利润总额</td><td>¥198,455.00</td><td>¥161,500.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>净利润</td><td>¥148,841.00</td><td>¥121,125.00</td></tr>' +
      '</tbody>' +
    '</table>';
  }

  // 财务报表 - 现金流量表数据
  function getCashFlowHtml() {
    return '<table class="dm-col3__report-table">' +
      '<thead><tr class="dm-col3__report-table--header"><th>项目</th><th>本期金额</th><th>上期金额</th></tr></thead>' +
      '<tbody>' +
        '<tr class="dm-col3__report-table--section"><td colspan="3">经营活动</td></tr>' +
        '<tr><td>流入小计</td><td>¥956,000.00</td><td>¥820,000.00</td></tr>' +
        '<tr><td>流出小计</td><td>¥712,000.00</td><td>¥650,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>净额</td><td>¥244,000.00</td><td>¥170,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--section"><td colspan="3">投资活动</td></tr>' +
        '<tr><td>流入小计</td><td>¥0.00</td><td>¥45,000.00</td></tr>' +
        '<tr><td>流出小计</td><td>¥120,000.00</td><td>¥80,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>净额</td><td>-¥120,000.00</td><td>-¥35,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--section"><td colspan="3">筹资活动</td></tr>' +
        '<tr><td>流入小计</td><td>¥0.00</td><td>¥200,000.00</td></tr>' +
        '<tr><td>流出小计</td><td>¥35,000.00</td><td>¥85,000.00</td></tr>' +
        '<tr class="dm-col3__report-table--total"><td>净额</td><td>-¥35,000.00</td><td>¥115,000.00</td></tr>' +
      '</tbody>' +
    '</table>';
  }

  // 财务报表
  tabContents['财务报表'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '财务报表']) +
      '<div style="font-size:var(--body-base);font-weight:600;color:var(--text-default);margin-bottom:var(--spacer-12);">华信科技有限公司 - 2026年上半年</div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active" data-report="balance">资产负债表</button>' +
        '<button class="dm-col3__list-toolbar-btn" data-report="income">利润表</button>' +
        '<button class="dm-col3__list-toolbar-btn" data-report="cashflow">现金流量表</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">导出</button>' +
      '</div>' +
      '<div id="reportContent">' + getBalanceSheetHtml() + '</div>';

    // 事件委托：toolbar 点击切换报表
    var toolbar = container.querySelector('.dm-col3__list-toolbar');
    if (toolbar) {
      toolbar.addEventListener('click', function(e) {
        var btn = e.target;
        if (!btn.classList.contains('dm-col3__list-toolbar-btn')) return;
        var report = btn.getAttribute('data-report');
        if (!report) return; // 导出按钮无 data-report，跳过
        // 移除所有按钮的 active 状态
        toolbar.querySelectorAll('.dm-col3__list-toolbar-btn').forEach(function(b) {
          b.classList.remove('dm-col3__list-toolbar-btn--active');
        });
        btn.classList.add('dm-col3__list-toolbar-btn--active');
        // 根据 data-report 重新渲染对应报表
        var reportContent = container.querySelector('#reportContent');
        if (reportContent) {
          if (report === 'balance') reportContent.innerHTML = getBalanceSheetHtml();
          else if (report === 'income') reportContent.innerHTML = getIncomeStatementHtml();
          else if (report === 'cashflow') reportContent.innerHTML = getCashFlowHtml();
        }
      });
    }
  };

  // 社保
  tabContents['社保'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '社保']) +
      '<div class="dm-col3__subtitle">社保 <span class="dm-col3__tag">参保中</span></div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('参保人数', '42', '在职员工') +
        statCard('本月缴费', '¥48,260', '已申报') +
        statCard('待办', '3', '增减员') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('社保申报', '月度缴费基数申报') +
        moduleCard('增减员', '参保 · 停保 · 转移') +
        moduleCard('社保查询', '缴费明细 · 参保证明') +
      '</div>';
  };

  // 公积金
  tabContents['公积金'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '公积金']) +
      '<div class="dm-col3__subtitle">公积金 <span class="dm-col3__tag">正常</span></div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('缴存人数', '42', '在职员工') +
        statCard('账户余额', '¥286,400', '累计缴存') +
        statCard('本月缴存', '¥24,360', '已申报') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('公积金申报', '月度缴存基数申报') +
        moduleCard('提取申请', '购房 · 租房 · 退休') +
        moduleCard('账户查询', '余额 · 明细 · 状态') +
      '</div>';
  };

  // 知识产权
  tabContents['知识产权'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '知识产权']) +
      '<div class="dm-col3__subtitle">知识产权 <span class="dm-col3__tag">12项</span></div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('商标', '8', '已注册') +
        statCard('专利', '3', '有效') +
        statCard('版权', '1', '已登记') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('商标管理', '注册 · 续展 · 变更') +
        moduleCard('专利管理', '申请 · 维护 · 转让') +
        moduleCard('版权登记', '作品 · 软件 · 变更') +
      '</div>';
  };

  // 审计
  tabContents['审计'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '审计']) +
      '<div class="dm-col3__subtitle">审计 <span class="dm-col3__tag">2项</span></div>' +
      '<div class="dm-col3__stats-grid">' +
        statCard('内审', '1', '进行中') +
        statCard('外审', '1', '已完成') +
        statCard('整改', '0', '无待办') +
      '</div>' +
      '<div class="dm-col3__modules-grid">' +
        moduleCard('内部审计', '财务 · 流程 · 合规') +
        moduleCard('外部审计', '年报 · 专项 · 税审') +
        moduleCard('整改跟踪', '问题 · 措施 · 闭环') +
      '</div>';
  };

  /* ---------- home grid modules ---------- */

  var homeGridModules = [
    { name: '税务',     desc: '申报 · 发票 · 报表', icon: 'file-text.svg', color: 'var(--module-color-tax)',      colorSurface: 'var(--module-color-tax-surface)',      tabName: '税务' },
    { name: '工商',     desc: '年报 · 变更 · 注销', icon: 'shield.svg',    color: 'var(--module-color-business)', colorSurface: 'var(--module-color-business-surface)', tabName: '工商' },
    { name: '银行',     desc: '对账 · 流水 · 回单', icon: 'file.svg',      color: 'var(--module-color-bank)',     colorSurface: 'var(--module-color-bank-surface)',     tabName: '银行' },
    { name: '社保',     desc: '参保 · 申报 · 缴费', icon: 'users.svg',     color: 'var(--module-color-social)',   colorSurface: 'var(--module-color-social-surface)',   tabName: '社保' },
    { name: '公积金',   desc: '账户 · 缴存 · 提取', icon: 'file.svg',      color: 'var(--module-color-fund)',     colorSurface: 'var(--module-color-fund-surface)',     tabName: '公积金' },
    { name: '知识产权', desc: '商标 · 专利 · 版权', icon: 'shield.svg',    color: 'var(--module-color-ip)',       colorSurface: 'var(--module-color-ip-surface)',       tabName: '知识产权' },
    { name: '报表',     desc: '资产负债 · 利润 · 现金流', icon: 'bar.svg', color: 'var(--module-color-report)',   colorSurface: 'var(--module-color-report-surface)',   tabName: '财务报表' },
    { name: '审计',     desc: '内审 · 外审 · 整改', icon: 'file-text.svg', color: 'var(--module-color-audit)',    colorSurface: 'var(--module-color-audit-surface)',    tabName: '审计' },
    { name: '客户服务', desc: '合同履行 · 客户关怀 · 待回复 · 登录密钥', icon: 'users.svg', color: 'var(--module-color-service)', colorSurface: 'var(--module-color-service-surface)', tabName: '客户服务' }
  ];

  function getHomeGridHtml(container) {
    var html = '<div class="dm-col3__home-grid">';
    for (var i = 0; i < homeGridModules.length; i++) {
      var m = homeGridModules[i];
      html += '<div class="dm-col3__home-card" data-module="' + m.tabName + '">' +
        '<div class="dm-col3__home-card-icon" style="background:' + m.colorSurface + ';">' +
          '<svg class="dm-icon" width="24" height="24" aria-hidden="true" style="color:' + m.color + ';"><use href="#icon-' + m.icon.replace(/\.svg$/, '') + '"/></svg>' +
        '</div>' +
        '<div class="dm-col3__home-card-name">' + m.name + '</div>' +
        '<div class="dm-col3__home-card-desc">' + m.desc + '</div>' +
      '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  /* ---------- resource tree items (clicked from Col4) ---------- */

  var resourceContents = {};

  resourceContents['进项发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '进项发票']) +
      '<div class="dm-col3__subtitle">进项发票 <span class="dm-col3__tag">89</span></div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">待认证</button>' +
        '<button class="dm-col3__list-toolbar-btn">已认证</button>' +
      '</div>' +
      listTable(
        ['发票代码', '销方', '金额', '税额', '状态'],
        [
          ['042001200311', '上海XX科技有限公司', '¥12,345.00', '¥1,604.85', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>'],
          ['042001200412', '北京YY贸易有限公司', '¥8,900.00', '¥1,157.00', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>'],
          ['042001200523', '广州ZZ科技有限公司', '¥25,600.00', '¥3,328.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200634', '深圳AA电子有限公司', '¥5,200.00', '¥676.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200745', '杭州BB商贸有限公司', '¥18,000.00', '¥2,340.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>']
        ]
      );
  };

  resourceContents['销项发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '销项发票']) +
      '<div class="dm-col3__subtitle">销项发票 <span class="dm-col3__tag">76</span></div>' +
      listTable(
        ['发票代码', '购方', '金额', '税额', '状态'],
        [
          ['032001200101', '明达贸易有限公司', '¥45,000.00', '¥5,850.00', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['032001200202', '众诚电子有限公司', '¥28,000.00', '¥3,640.00', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['032001200303', '华信科技有限公司', '¥62,000.00', '¥8,060.00', '<span class="dm-col3__badge dm-col3__badge--primary">待开具</span>']
        ]
      );
  };

  /* ---------- 修复 P0-07: 叶子节点详情视图渲染函数 ---------- */

  // 通用卡片布局（用于证照类单条记录）
  function detailCard(title, fields) {
    var html = '<div class="dm-col3__detail-card">' +
      '<div class="dm-col3__detail-card-header">' + title + '</div>' +
      '<div class="dm-col3__detail-card-body">';
    for (var i = 0; i < fields.length; i++) {
      html += '<div class="dm-col3__detail-row">' +
        '<span class="dm-col3__detail-label">' + fields[i].label + '</span>' +
        '<span class="dm-col3__detail-value">' + fields[i].value + '</span>' +
      '</div>';
    }
    html += '</div></div>';
    return html;
  }

  // 进项发票类叶子节点
  resourceContents['增值税专用发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '进项发票', '增值税专用发票']) +
      '<div class="dm-col3__subtitle">增值税专用发票 <span class="dm-col3__tag">45</span></div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">待认证</button>' +
        '<button class="dm-col3__list-toolbar-btn">已认证</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">导出</button>' +
      '</div>' +
      listTable(
        ['发票号', '销方', '金额', '税额', '状态'],
        [
          ['042001200311', '上海XX科技有限公司', '¥12,345.00', '¥1,604.85', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>'],
          ['042001200412', '北京YY贸易有限公司', '¥8,900.00', '¥1,157.00', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>'],
          ['042001200523', '广州ZZ科技有限公司', '¥25,600.00', '¥3,328.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200634', '深圳AA电子有限公司', '¥5,200.00', '¥676.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200745', '杭州BB商贸有限公司', '¥18,000.00', '¥2,340.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200856', '南京CC实业有限公司', '¥9,800.00', '¥1,274.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['042001200967', '苏州DD科技有限公司', '¥15,400.00', '¥2,002.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>']
        ]
      );
  };

  resourceContents['机动车销售发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '进项发票', '机动车销售发票']) +
      '<div class="dm-col3__subtitle">机动车销售发票 <span class="dm-col3__tag">12</span></div>' +
      listTable(
        ['发票号', '销方', '车价', '税额', '状态'],
        [
          ['20260531001', '上海大众4S店', '¥185,000.00', '¥24,050.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>'],
          ['20260531002', '一汽丰田4S店', '¥220,000.00', '¥28,600.00', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>'],
          ['20260531003', '奔驰销售中心', '¥450,000.00', '¥58,500.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>']
        ]
      );
  };

  resourceContents['海关进口缴款书'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '进项发票', '海关进口缴款书']) +
      '<div class="dm-col3__subtitle">海关进口缴款书 <span class="dm-col3__tag">8</span></div>' +
      listTable(
        ['缴款书号', '报关口岸', '金额', '税额', '状态'],
        [
          ['HD202606001', '上海海关', '¥56,800.00', '¥7,384.00', '<span class="dm-col3__badge dm-col3__badge--success">已确认</span>'],
          ['HD202606002', '深圳海关', '¥32,400.00', '¥4,212.00', '<span class="dm-col3__badge dm-col3__badge--warning">待确认</span>'],
          ['HD202606003', '宁波海关', '¥18,900.00', '¥2,457.00', '<span class="dm-col3__badge dm-col3__badge--success">已确认</span>']
        ]
      );
  };

  resourceContents['普通发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '销项发票', '普通发票']) +
      '<div class="dm-col3__subtitle">普通发票 <span class="dm-col3__tag">18</span></div>' +
      listTable(
        ['发票号', '购方', '金额', '税额', '状态'],
        [
          ['032001800101', '上海AA商贸', '¥5,800.00', '¥169.90', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['032001800202', '南京BB实业', '¥12,400.00', '¥362.68', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['032001800303', '苏州CC科技', '¥8,900.00', '¥260.32', '<span class="dm-col3__badge dm-col3__badge--warning">待开具</span>']
        ]
      );
  };

  resourceContents['电子发票'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '销项发票', '电子发票']) +
      '<div class="dm-col3__subtitle">电子发票 <span class="dm-col3__tag">25</span></div>' +
      listTable(
        ['发票号', '购方', '金额', '税额', '状态'],
        [
          ['EL2026060001', '北京DD科技', '¥3,500.00', '¥210.00', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['EL2026060002', '杭州EE互联', '¥7,800.00', '¥468.00', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['EL2026060003', '深圳FF网络', '¥15,200.00', '¥912.00', '<span class="dm-col3__badge dm-col3__badge--success">已开具</span>'],
          ['EL2026060004', '广州GG软件', '¥2,400.00', '¥144.00', '<span class="dm-col3__badge dm-col3__badge--warning">待开具</span>']
        ]
      );
  };

  // 证照类叶子节点（卡片布局）
  resourceContents['营业执照'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '证照', '营业执照']) +
      '<div class="dm-col3__subtitle">营业执照 <span class="dm-col3__tag">1</span></div>' +
      detailCard('华信科技有限公司 - 营业执照', [
        { label: '统一社会信用代码', value: '91310115MA1K4XXX0X' },
        { label: '企业名称', value: '华信科技有限公司' },
        { label: '法定代表人', value: '张明' },
        { label: '注册资本', value: '¥1,000万元' },
        { label: '成立日期', value: '2018-03-15' },
        { label: '颁发日期', value: '2024-03-15' },
        { label: '到期日期', value: '2028-03-14' },
        { label: '登记机关', value: '上海市浦东新区市场监督管理局' },
        { label: '当前状态', value: '<span class="dm-col3__badge dm-col3__badge--success">有效</span>' }
      ]);
  };

  resourceContents['开户许可证'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '证照', '开户许可证']) +
      '<div class="dm-col3__subtitle">开户许可证 <span class="dm-col3__tag">1</span></div>' +
      detailCard('华信科技有限公司 - 开户许可证', [
        { label: '核准号', value: 'JZ-2024-001234' },
        { label: '开户企业', value: '华信科技有限公司' },
        { label: '基本户账号', value: '****1234' },
        { label: '开户银行', value: '中国银行上海浦东支行' },
        { label: '颁发日期', value: '2024-01-15' },
        { label: '当前状态', value: '<span class="dm-col3__badge dm-col3__badge--success">有效</span>' }
      ]);
  };

  resourceContents['印章备案'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '证照', '印章备案']) +
      '<div class="dm-col3__subtitle">印章备案 <span class="dm-col3__tag">3</span></div>' +
      listTable(
        ['印章编号', '印章类型', '备案机关', '备案日期', '状态'],
        [
          ['YZ-001', '公章', '上海浦东公安局', '2018-03-20', '<span class="dm-col3__badge dm-col3__badge--success">有效</span>'],
          ['YZ-002', '财务专用章', '上海浦东公安局', '2018-03-20', '<span class="dm-col3__badge dm-col3__badge--success">有效</span>'],
          ['YZ-003', '合同专用章', '上海浦东公安局', '2019-06-10', '<span class="dm-col3__badge dm-col3__badge--success">有效</span>']
        ]
      );
  };

  // 合同类叶子节点
  resourceContents['采购合同'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '合同', '采购合同']) +
      '<div class="dm-col3__subtitle">采购合同 <span class="dm-col3__tag">8</span></div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">生效中</button>' +
        '<button class="dm-col3__list-toolbar-btn">即将到期</button>' +
      '</div>' +
      listTable(
        ['合同号', '供应商', '金额', '签订日期', '状态'],
        [
          ['CG-2026-001', '上海XX原材料', '¥520,000', '2026-01-15', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['CG-2026-002', '北京YY包装', '¥85,000', '2026-02-20', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['CG-2026-003', '广州ZZ物流', '¥126,000', '2026-03-10', '<span class="dm-col3__badge dm-col3__badge--warning">即将到期</span>'],
          ['CG-2026-004', '深圳AA电子', '¥380,000', '2026-04-05', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['CG-2026-005', '杭州BB五金', '¥45,000', '2026-05-12', '<span class="dm-col3__badge dm-col3__badge--primary">审核中</span>']
        ]
      );
  };

  resourceContents['销售合同'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '合同', '销售合同']) +
      '<div class="dm-col3__subtitle">销售合同 <span class="dm-col3__tag">15</span></div>' +
      listTable(
        ['合同号', '客户', '金额', '签订日期', '状态'],
        [
          ['XS-2026-001', '北京DD科技', '¥850,000', '2026-01-08', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['XS-2026-002', '杭州EE互联', '¥420,000', '2026-02-15', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['XS-2026-003', '深圳FF网络', '¥680,000', '2026-03-22', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['XS-2026-004', '广州GG软件', '¥230,000', '2026-04-18', '<span class="dm-col3__badge dm-col3__badge--warning">即将到期</span>'],
          ['XS-2026-005', '上海HH集团', '¥1,250,000', '2026-05-30', '<span class="dm-col3__badge dm-col3__badge--primary">审核中</span>']
        ]
      );
  };

  resourceContents['服务合同'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '合同', '服务合同']) +
      '<div class="dm-col3__subtitle">服务合同 <span class="dm-col3__tag">6</span></div>' +
      listTable(
        ['合同号', '服务商', '金额', '签订日期', '状态'],
        [
          ['FW-2026-001', '上海法律事务所', '¥80,000', '2026-01-01', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['FW-2026-002', '北京财税咨询', '¥120,000', '2026-02-01', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>'],
          ['FW-2026-003', '深圳IT服务商', '¥56,000', '2026-03-15', '<span class="dm-col3__badge dm-col3__badge--success">生效中</span>']
        ]
      );
  };

  // 银行账户叶子节点（账户详情卡片）
  resourceContents['中国银行-基本户'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '银行档案', '中国银行-基本户']) +
      '<div class="dm-col3__subtitle">中国银行 - 基本户 <span class="dm-col3__tag">基本户</span></div>' +
      detailCard('账户详情', [
        { label: '账户名称', value: '华信科技有限公司' },
        { label: '开户银行', value: '中国银行上海浦东支行' },
        { label: '账号', value: '4401 2345 6789 1234' },
        { label: '账户类型', value: '基本存款账户' },
        { label: '当前余额', value: '<span style="color:var(--status-success-default);font-weight:600;">¥245,680.00</span>' },
        { label: '本月流水', value: '156 笔' },
        { label: '最近交易', value: '2026-07-03 14:23 收款 ¥45,000.00' },
        { label: '账户状态', value: '<span class="dm-col3__badge dm-col3__badge--success">正常</span>' }
      ]) +
      '<div class="dm-col3__table-header" style="margin-top:var(--spacer-16);">最近5笔交易</div>' +
      listTable(
        ['日期', '摘要', '收入', '支出', '余额'],
        [
          ['2026-07-03', '货款收入', '¥45,000.00', '-', '¥245,680.00'],
          ['2026-07-02', '采购付款', '-', '¥32,000.00', '¥200,680.00'],
          ['2026-07-01', '工资发放', '-', '¥85,000.00', '¥232,680.00'],
          ['2026-06-30', '销售回款', '¥120,000.00', '-', '¥317,680.00'],
          ['2026-06-29', '办公租金', '-', '¥8,000.00', '¥197,680.00']
        ]
      );
  };

  resourceContents['工商银行-一般户'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '银行档案', '工商银行-一般户']) +
      '<div class="dm-col3__subtitle">工商银行 - 一般户 <span class="dm-col3__tag">一般户</span></div>' +
      detailCard('账户详情', [
        { label: '账户名称', value: '华信科技有限公司' },
        { label: '开户银行', value: '中国工商银行上海分行' },
        { label: '账号', value: '6222 0200 1234 5678' },
        { label: '账户类型', value: '一般存款账户' },
        { label: '当前余额', value: '<span style="color:var(--status-success-default);font-weight:600;">¥89,120.50</span>' },
        { label: '本月流水', value: '78 笔' },
        { label: '最近交易', value: '2026-07-02 10:15 转出 ¥12,500.00' },
        { label: '账户状态', value: '<span class="dm-col3__badge dm-col3__badge--success">正常</span>' }
      ]) +
      '<div class="dm-col3__table-header" style="margin-top:var(--spacer-16);">最近5笔交易</div>' +
      listTable(
        ['日期', '摘要', '收入', '支出', '余额'],
        [
          ['2026-07-02', '供应商付款', '-', '¥12,500.00', '¥89,120.50'],
          ['2026-07-01', '客户回款', '¥35,000.00', '-', '¥101,620.50'],
          ['2026-06-30', '员工报销', '-', '¥8,200.00', '¥66,620.50'],
          ['2026-06-28', '服务费收入', '¥18,000.00', '-', '¥74,820.50'],
          ['2026-06-25', '采购付款', '-', '¥25,000.00', '¥56,820.50']
        ]
      );
  };

  resourceContents['建设银行-纳税专户'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '银行档案', '建设银行-纳税专户']) +
      '<div class="dm-col3__subtitle">建设银行 - 纳税专户 <span class="dm-col3__tag">纳税专户</span></div>' +
      detailCard('账户详情', [
        { label: '账户名称', value: '华信科技有限公司' },
        { label: '开户银行', value: '中国建设银行上海分行' },
        { label: '账号', value: '4403 5678 9012 9012' },
        { label: '账户类型', value: '纳税专用账户' },
        { label: '当前余额', value: '<span style="color:var(--status-success-default);font-weight:600;">¥12,000.00</span>' },
        { label: '本月已缴税', value: '¥48,500.00' },
        { label: '最近交易', value: '2026-06-30 16:00 缴税 ¥12,345.00' },
        { label: '账户状态', value: '<span class="dm-col3__badge dm-col3__badge--success">正常</span>' }
      ]) +
      '<div class="dm-col3__table-header" style="margin-top:var(--spacer-16);">最近5笔缴税记录</div>' +
      listTable(
        ['日期', '税种', '金额', '申报表号', '状态'],
        [
          ['2026-06-30', '增值税', '¥12,345.00', 'VAT-202606-001', '<span class="dm-col3__badge dm-col3__badge--success">已缴</span>'],
          ['2026-06-15', '企业所得税', '¥18,000.00', 'EIT-2026Q2-001', '<span class="dm-col3__badge dm-col3__badge--success">已缴</span>'],
          ['2026-05-30', '增值税', '¥10,500.00', 'VAT-202605-001', '<span class="dm-col3__badge dm-col3__badge--success">已缴</span>'],
          ['2026-05-15', '印花税', '¥2,300.00', 'SD-202605-001', '<span class="dm-col3__badge dm-col3__badge--success">已缴</span>'],
          ['2026-04-30', '个人所得税', '¥5,355.00', 'IIT-202604-001', '<span class="dm-col3__badge dm-col3__badge--success">已缴</span>']
        ]
      );
  };

  // 财务报表叶子节点
  resourceContents['资产负债表'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '财务报表', '资产负债表']) +
      '<div class="dm-col3__subtitle">资产负债表 <span class="dm-col3__tag">2026年6月</span></div>' +
      listTable(
        ['项目', '期初余额', '期末余额', '增减'],
        [
          ['流动资产合计', '¥1,256,400.00', '¥1,389,200.00', '<span style="color:var(--status-success-default);">+¥132,800</span>'],
          ['货币资金', '¥356,800.00', '¥425,680.00', '<span style="color:var(--status-success-default);">+¥68,880</span>'],
          ['应收账款', '¥420,000.00', '¥385,000.00', '<span style="color:var(--status-error-default);">-¥35,000</span>'],
          ['存货', '¥280,000.00', '¥320,000.00', '<span style="color:var(--status-success-default);">+¥40,000</span>'],
          ['非流动资产合计', '¥856,000.00', '¥845,000.00', '<span style="color:var(--status-error-default);">-¥11,000</span>'],
          ['固定资产', '¥620,000.00', '¥608,000.00', '<span style="color:var(--status-error-default);">-¥12,000</span>'],
          ['流动负债合计', '¥485,000.00', '¥526,400.00', '<span style="color:var(--status-error-default);">+¥41,400</span>'],
          ['应付账款', '¥185,000.00', '¥220,000.00', '<span style="color:var(--status-error-default);">+¥35,000</span>'],
          ['非流动负债合计', '¥200,000.00', '¥200,000.00', '无变动'],
          ['所有者权益合计', '¥1,427,400.00', '¥1,507,800.00', '<span style="color:var(--status-success-default);">+¥80,400</span>']
        ]
      );
  };

  resourceContents['利润表'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '财务报表', '利润表']) +
      '<div class="dm-col3__subtitle">利润表 <span class="dm-col3__tag">2026年6月</span></div>' +
      listTable(
        ['项目', '本期金额', '本年累计', '同比'],
        [
          ['营业收入', '¥856,000.00', '¥4,856,000.00', '<span style="color:var(--status-success-default);">+12.5%</span>'],
          ['营业成本', '¥512,000.00', '¥2,985,000.00', '<span style="color:var(--status-error-default);">+8.2%</span>'],
          ['税金及附加', '¥12,345.00', '¥73,500.00', '<span style="color:var(--status-success-default);">-3.1%</span>'],
          ['销售费用', '¥45,000.00', '¥256,000.00', '<span style="color:var(--status-success-default);">-2.0%</span>'],
          ['管理费用', '¥85,000.00', '¥512,000.00', '<span style="color:var(--status-error-default);">+5.6%</span>'],
          ['财务费用', '¥3,200.00', '¥18,500.00', '<span style="color:var(--status-success-default);">-8.1%</span>'],
          ['营业利润', '¥198,455.00', '¥1,011,000.00', '<span style="color:var(--status-success-default);">+22.8%</span>'],
          ['所得税费用', '¥49,614.00', '¥252,750.00', '<span style="color:var(--status-success-default);">+22.8%</span>'],
          ['净利润', '¥148,841.00', '¥758,250.00', '<span style="color:var(--status-success-default);">+22.8%</span>']
        ]
      );
  };

  resourceContents['现金流量表'] = function(container) {
    container.innerHTML = breadcrumb(['首页', '财务报表', '现金流量表']) +
      '<div class="dm-col3__subtitle">现金流量表 <span class="dm-col3__tag">2026年6月</span></div>' +
      listTable(
        ['项目', '本期金额', '本年累计'],
        [
          ['经营活动现金流入', '¥956,000.00', '¥5,420,000.00'],
          ['经营活动现金流出', '¥712,000.00', '¥4,180,000.00'],
          ['经营活动产生的现金流量净额', '¥244,000.00', '¥1,240,000.00'],
          ['投资活动现金流入', '¥0.00', '¥45,000.00'],
          ['投资活动现金流出', '¥120,000.00', '¥380,000.00'],
          ['投资活动产生的现金流量净额', '-¥120,000.00', '-¥335,000.00'],
          ['筹资活动现金流入', '¥0.00', '¥200,000.00'],
          ['筹资活动现金流出', '¥35,000.00', '¥85,000.00'],
          ['筹资活动产生的现金流量净额', '-¥35,000.00', '¥115,000.00'],
          ['现金及现金等价物净增加额', '¥89,000.00', '¥1,020,000.00']
        ]
      );
  };

  // Generic resource fallback
  function resourceFallback(name, count) {
    return function(container) {
      container.innerHTML = breadcrumb(['首页', name]) +
        '<div class="dm-col3__subtitle">' + name + ' <span class="dm-col3__tag">' + (count || '') + '</span></div>' +
        '<div style="background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);padding:var(--spacer-24);text-align:center;color:var(--text-tertiary);font-size:var(--body-sm);">' +
          '<div style="font-size:32px;margin-bottom:8px;">&#x1F4C1;</div>' + name + '列表<br>（' + (count || 0) + ' 条记录）' +
        '</div>';
    };
  }

  function getTabContent(name) {
    if (tabContents[name]) return null; // will be rendered by registered render fn
    if (resourceContents[name]) return null;
    return null;
  }

  function getTabConfig(name) {
    if (tabContents[name]) return { render: tabContents[name] };
    if (resourceContents[name]) return { render: resourceContents[name] };
    return { render: resourceFallback(name, '') };
  }

  function registerResourceContent(name, renderFn, count) {
    resourceContents[name] = renderFn || resourceFallback(name, count || '');
  }

  // Register all known resources
  registerResourceContent('银行档案', null, '45');
  registerResourceContent('证照', null, '12');
  registerResourceContent('合同', null, '23');
  registerResourceContent('财务报表', null, '34');
  registerResourceContent('发票管理', null, '');
  registerResourceContent('纳税申报', null, '');
  registerResourceContent('税负检测', null, '');
  registerResourceContent('税务报表', null, '');

  /* ---------- resource sub items ---------- */

  var resourceSubItems = {
    '进项发票': [
      { name: '增值税专用发票', count: 45 },
      { name: '机动车销售发票', count: 12 },
      { name: '海关进口缴款书', count: 32 }
    ],
    '销项发票': [
      { name: '增值税专用发票', count: 52 },
      { name: '普通发票', count: 18 },
      { name: '电子发票', count: 6 }
    ],
    '银行档案': [
      { name: '中国银行-基本户', count: 0 },
      { name: '工商银行-一般户', count: 0 },
      { name: '建设银行-纳税专户', count: 0 }
    ],
    '证照': [
      { name: '营业执照', count: 1 },
      { name: '开户许可证', count: 1 },
      { name: '印章备案', count: 3 }
    ],
    '合同': [
      { name: '采购合同', count: 8 },
      { name: '销售合同', count: 12 },
      { name: '服务合同', count: 3 }
    ],
    '财务报表': [
      { name: '资产负债表', count: 0 },
      { name: '利润表', count: 0 },
      { name: '现金流量表', count: 0 }
    ]
  };

  function getSubItemsHtml(resourceName) {
    var items = resourceSubItems[resourceName];
    if (!items) return '';
    var html = '<div class="dm-col4__tree-children" data-parent-resource="' + resourceName + '">';
    for (var i = 0; i < items.length; i++) {
      var countStr = items[i].count > 0 ? '<span class="count">' + items[i].count + '</span>' : '';
      html += '<div class="dm-col4__tree-item dm-col4__tree-item--leaf" data-leaf="' + items[i].name + '">' +
        '<svg class="dm-icon dm-col4__leaf-icon" width="10" height="10" aria-hidden="true"><use href="#icon-file-text"/></svg>' +
        '<span>' + items[i].name + '</span>' + countStr +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  /* ---------- resource explorer data (VS Code 风格资源管理器统一数据源) ---------- */

  /**
   * 资源管理器统一数据源
   * 结构：企业 → 资源类别 → 叶子节点 → 文件列表（懒加载）
   * 文件列表由 generateMockFiles() 按 count 生成 mock 数据
   */
  var resourceExplorerData = {
    enterprises: [
      {
        name: '华信科技有限公司',
        expanded: true,
        active: true,
        categories: [
          {
            name: '进项发票', count: 89, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 45, expanded: false, fileType: 'invoice', files: null },
              { name: '机动车销售发票', count: 12, expanded: false, fileType: 'invoice', files: null },
              { name: '海关进口缴款书', count: 32, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '销项发票', count: 76, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 52, expanded: false, fileType: 'invoice', files: null },
              { name: '普通发票', count: 18, expanded: false, fileType: 'invoice', files: null },
              { name: '电子发票', count: 6, expanded: false, fileType: 'invoice', files: null }
            ]
          },
          {
            name: '银行档案', count: 45, expanded: false,
            leaves: [
              { name: '中国银行-基本户', count: 15, expanded: false, fileType: 'excel', files: null },
              { name: '工商银行-一般户', count: 18, expanded: false, fileType: 'excel', files: null },
              { name: '建设银行-纳税专户', count: 12, expanded: false, fileType: 'excel', files: null }
            ]
          },
          {
            name: '证照', count: 12, expanded: false,
            leaves: [
              { name: '营业执照', count: 1, expanded: false, fileType: 'image', files: null },
              { name: '开户许可证', count: 1, expanded: false, fileType: 'image', files: null },
              { name: '印章备案', count: 3, expanded: false, fileType: 'image', files: null }
            ]
          },
          {
            name: '合同', count: 23, expanded: false,
            leaves: [
              { name: '采购合同', count: 8, expanded: false, fileType: 'pdf', files: null },
              { name: '销售合同', count: 12, expanded: false, fileType: 'pdf', files: null },
              { name: '服务合同', count: 3, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '财务报表', count: 34, expanded: false,
            leaves: [
              { name: '资产负债表', count: 12, expanded: false, fileType: 'excel', files: null },
              { name: '利润表', count: 11, expanded: false, fileType: 'excel', files: null },
              { name: '现金流量表', count: 11, expanded: false, fileType: 'excel', files: null }
            ]
          },
          {
            name: '审计报告', count: 3, expanded: false,
            leaves: [
              { name: '2025年度审计报告', count: 1, expanded: false, fileType: 'pdf', files: null },
              { name: '2024年度审计报告', count: 1, expanded: false, fileType: 'pdf', files: null },
              { name: '专项审计报告', count: 1, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '其他', count: 3, expanded: false,
            leaves: [
              { name: '银行对账单', count: 8, expanded: false, fileType: 'excel', files: null },
              { name: '税务申报表', count: 6, expanded: false, fileType: 'pdf', files: null },
              { name: '其他附件', count: 4, expanded: false, fileType: 'generic', files: null }
            ]
          }
        ]
      },
      { name: '明达贸易有限公司', expanded: true, active: false, categories: [
          {
            name: '进项发票', count: 42, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 28, expanded: false, fileType: 'invoice', files: null },
              { name: '海关进口发票', count: 9, expanded: false, fileType: 'invoice', files: null },
              { name: '代扣代缴凭证', count: 5, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '销项发票', count: 38, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 24, expanded: false, fileType: 'invoice', files: null },
              { name: '出口商品发票', count: 14, expanded: false, fileType: 'invoice', files: null }
            ]
          },
          {
            name: '出口单证', count: 15, expanded: false,
            leaves: [
              { name: '出口报关单', count: 9, expanded: false, fileType: 'pdf', files: null },
              { name: '原产地证书', count: 6, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '运输合同', count: 9, expanded: false,
            leaves: [
              { name: '海运合同', count: 5, expanded: false, fileType: 'pdf', files: null },
              { name: '陆运合同', count: 4, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '报关单', count: 22, expanded: false,
            leaves: [
              { name: '进口报关单', count: 13, expanded: false, fileType: 'pdf', files: null },
              { name: '出口报关单', count: 9, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '其他', count: 4, expanded: false,
            leaves: [
              { name: '银行对账单', count: 2, expanded: false, fileType: 'excel', files: null },
              { name: '其他附件', count: 2, expanded: false, fileType: 'generic', files: null }
            ]
          }
        ]
      },
      { name: '众诚电子有限公司', expanded: true, active: false, categories: [
          {
            name: '进项发票', count: 156, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 112, expanded: false, fileType: 'invoice', files: null },
              { name: '电子发票', count: 32, expanded: false, fileType: 'invoice', files: null },
              { name: '机动车销售发票', count: 12, expanded: false, fileType: 'invoice', files: null }
            ]
          },
          {
            name: '销项发票', count: 134, expanded: false,
            leaves: [
              { name: '增值税专用发票', count: 89, expanded: false, fileType: 'invoice', files: null },
              { name: '电子发票', count: 38, expanded: false, fileType: 'invoice', files: null },
              { name: '普通发票', count: 7, expanded: false, fileType: 'invoice', files: null }
            ]
          },
          {
            name: '库存清单', count: 28, expanded: false,
            leaves: [
              { name: '原材料库存', count: 12, expanded: false, fileType: 'excel', files: null },
              { name: '半成品库存', count: 9, expanded: false, fileType: 'excel', files: null },
              { name: '成品库存', count: 7, expanded: false, fileType: 'excel', files: null }
            ]
          },
          {
            name: '检测报告', count: 7, expanded: false,
            leaves: [
              { name: '来料检验报告', count: 4, expanded: false, fileType: 'pdf', files: null },
              { name: '成品检测报告', count: 3, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '采购订单', count: 45, expanded: false,
            leaves: [
              { name: '元件采购单', count: 28, expanded: false, fileType: 'pdf', files: null },
              { name: '设备采购单', count: 17, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '销售订单', count: 38, expanded: false,
            leaves: [
              { name: '国内销售单', count: 24, expanded: false, fileType: 'pdf', files: null },
              { name: '海外销售单', count: 14, expanded: false, fileType: 'pdf', files: null }
            ]
          },
          {
            name: '其他', count: 11, expanded: false,
            leaves: [
              { name: '银行对账单', count: 5, expanded: false, fileType: 'excel', files: null },
              { name: '税务申报表', count: 4, expanded: false, fileType: 'pdf', files: null },
              { name: '其他附件', count: 2, expanded: false, fileType: 'generic', files: null }
            ]
          }
        ]
      }
    ]
  };

  /**
   * 按叶子节点名与 count 生成 mock 文件列表
   * @param {string} leafName - 叶子节点名（如"增值税专用发票"）
   * @param {number} count - 文件总数（如 45）
   * @param {string} fileType - 文件类型（pdf/excel/image/invoice/generic）
   * @returns {Array<{name:string,type:string,size:string,modified:string,author:string}>}
   */
  function generateMockFiles(leafName, count, fileType) {
    // 实际生成 min(count, 8) 个文件项，避免渲染过多
    var displayCount = Math.min(count, 8);
    var files = [];
    var extensions = { pdf: '.pdf', excel: '.xlsx', image: '.png', invoice: '.pdf', generic: '.pdf' };
    var sizes = { pdf: '1.2MB', excel: '156KB', image: '2.4MB', invoice: '380KB', generic: '512KB' };
    for (var i = 1; i <= displayCount; i++) {
      var seq = String(i).padStart(3, '0');
      var day = String(i).padStart(2, '0');
      files.push({
        name: leafName + '_202607' + day + '_' + seq + (extensions[fileType] || '.pdf'),
        type: fileType,
        size: sizes[fileType] || '512KB',
        modified: '2026-07-' + day + ' 10:30',
        author: '王会计'
      });
    }
    return files;
  }

  /**
   * 按文件类型返回图标文件名
   * @param {string} fileType - 文件类型
   * @returns {string} 图标文件名
   */
  function getFileTypeIcon(fileType) {
    var map = { pdf: 'file-text.svg', excel: 'file-text.svg', image: 'image.svg', invoice: 'file-text.svg', generic: 'file.svg' };
    return map[fileType] || 'file.svg';
  }

  /**
   * 渲染文件列表项（VS Code 风格紧凑单行）
   * @param {Object} leaf - 叶子节点对象
   * @returns {string} HTML 字符串
   */
  function renderFileListItems(leaf) {
    if (!leaf.files) leaf.files = generateMockFiles(leaf.name, leaf.count, leaf.fileType);
    var html = '';
    leaf.files.forEach(function(file) {
      var icon = getFileTypeIcon(file.type);
      // 行业领先：DOM 顺序 = [占位 chevron → icon → name → 详情按钮]（与父类目/叶子一致）
      // data-leaf-name: 双击时调用 getFileEditor(leafName) 所需的叶子节点名
      html += '<div class="dm-col4__file-item" data-file="' + file.name + '" data-file-type="' + file.type + '" data-leaf-name="' + leaf.name + '" data-file-size="' + file.size + '" data-file-modified="' + file.modified + '" data-file-author="' + file.author + '" draggable="true">';
      // [1] Chevron 占位（透明不可点击，对齐用）
      html += '<span class="dm-col4__tree-toggle dm-col4__tree-toggle--file" aria-hidden="true"></span>';
      // [2] File icon
      html += '<svg class="dm-icon dm-col4__file-icon" width="10" height="10" aria-hidden="true"><use href="#icon-' + icon.replace(/\.svg$/, '') + '"/></svg>';
      // [3] Name (flex:1 + ellipsis)
      html += '<span class="dm-col4__file-name" title="' + file.name + ' · ' + file.size + ' · ' + file.modified + '">' + file.name + '</span>';
      // [4] 详情按钮（行末 hover 显隐）
      html += '<button class="dm-col4__file-detail-btn" title="查看详情" aria-label="查看详情"><svg class="dm-icon" width="12" height="12" aria-hidden="true"><use href="#icon-info"/></svg></button>';
      html += '</div>';
    });
    return html;
  }

  /**
   * 渲染叶子节点项
   * @param {Object} leaf - 叶子节点对象
   * @returns {string} HTML 字符串
   */
  function renderLeafItem(leaf) {
    // 行业领先：DOM 顺序 = [chevron → icon → name → count → action]（与父类目一致）
    var isExpandable = leaf.count > 0;
    var expandedClass = (leaf.expanded && isExpandable) ? ' is-expanded' : '';
    var html = '<div class="dm-col4__tree-item dm-col4__tree-item--leaf' + expandedClass + '" data-leaf="' + leaf.name + '" data-file-type="' + leaf.fileType + '" data-leaf-count="' + leaf.count + '">';
    // [1] Chevron（可展开节点显示真实 chevron，否则占位透明）
    if (isExpandable) {
      html += '<span class="dm-col4__tree-toggle' + expandedClass + '" aria-hidden="true"></span>';
    } else {
      html += '<span class="dm-col4__tree-toggle dm-col4__tree-toggle--file" aria-hidden="true"></span>';
    }
    // [2] File icon
    html += '<svg class="dm-icon dm-col4__leaf-icon" width="12" height="12" aria-hidden="true"><use href="#icon-file-text"/></svg>';
    // [3] Name (flex:1 + ellipsis)
    html += '<span class="dm-col4__tree-name">' + leaf.name + '</span>';
    // [4] Count (右对齐定宽)
    html += '<span class="count">' + leaf.count + '</span>';
    // [5] Action (行末 hover 显隐)
    html += '<button class="dm-col4__tree-item-action" data-row-action="add" title="新建子项" aria-label="新建子项"><svg class="dm-icon" width="10" height="10" aria-hidden="true"><use href="#icon-plus"/></svg></button>';
    // 修复 P1-09g: 必须显式闭合 .dm-col4__tree-item--leaf <div>，否则浏览器 HTML 容错机制
    // 会把后续所有兄弟节点吞进第一个 .dm-col4__tree-children 中（导致仅显示 1 个 cat）。
    html += '</div>';
    return html;
  }

  /**
   * 渲染资源管理器树（VS Code 风格，仅展示指定企业的资源类目）
   * 一级目录 = 当前企业的资源类目（进项发票 / 销项发票 / ...）
   * 企业名通过页面的 `.dm-col4__ent-header-name` 头部单独展示，不再作为可点击父节点
   * @param {string} [entName] - 企业名；缺省时取 data-active 企业
   * @returns {string} HTML 字符串
   */
  function renderResourceExplorer(entName) {
    var html = '';
    // 找到目标企业；未指定时取 active=true 的企业
    var ent = null;
    if (entName) {
      for (var i = 0; i < resourceExplorerData.enterprises.length; i++) {
        if (resourceExplorerData.enterprises[i].name === entName) {
          ent = resourceExplorerData.enterprises[i];
          break;
        }
      }
    }
    if (!ent) {
      for (var j = 0; j < resourceExplorerData.enterprises.length; j++) {
        if (resourceExplorerData.enterprises[j].active) {
          ent = resourceExplorerData.enterprises[j];
          break;
        }
      }
    }
    if (!ent) {
      return '<div class="dm-col4__tree-empty">暂无企业数据</div>';
    }
    if (!ent.categories || ent.categories.length === 0) {
      return '<div class="dm-col4__tree-empty">该企业暂无资源</div>';
    }
    // 一级 = 资源类目（dm-col4__tree-item--child），不再包裹企业层
    // 行业领先：DOM 顺序 = [chevron → icon → name → count → action]（VS Code/IntelliJ/GitHub 行业标准）
    ent.categories.forEach(function(cat) {
      html += '<div class="dm-col4__tree-item dm-col4__tree-item--child dm-col4__tree-item--expandable" data-resource="' + cat.name + '">';
      // [1] Chevron 行首（VS Code 风格）
      html += '<span class="dm-col4__tree-toggle" aria-hidden="true"></span>';
      // [2] Folder icon
      html += '<svg class="dm-icon dm-col4__tree-icon" width="12" height="12" aria-hidden="true"><use href="#icon-folder"/></svg>';
      // [3] Name (flex:1 + ellipsis)
      html += '<span class="dm-col4__tree-name">' + cat.name + '</span>';
      // [4] Count (右对齐定宽)
      html += '<span class="count">' + cat.count + '</span>';
      // [5] Action (行末 hover 显隐)
      html += '<button class="dm-col4__tree-item-action" data-row-action="add" title="新建子项" aria-label="新建子项"><svg class="dm-icon" width="10" height="10" aria-hidden="true"><use href="#icon-plus"/></svg></button>';
      html += '</div>';
      html += '<div class="dm-col4__tree-children' + (cat.expanded ? ' is-expanded' : '') + '" data-parent-resource="' + cat.name + '">';
      cat.leaves.forEach(function(leaf) {
        html += renderLeafItem(leaf);
        html += '<div class="dm-col4__file-list' + (leaf.expanded ? ' is-expanded' : '') + '" data-leaf-files="' + leaf.name + '">';
        if (leaf.expanded) html += renderFileListItems(leaf);
        html += '</div>';
      });
      html += '</div>';
    });
    return html;
  }

  /**
   * 按 leafName 查找并返回文件列表 HTML（懒加载展开时调用）
   * @param {string} leafName - 叶子节点名
   * @returns {string} HTML 字符串
   */
  function getFileListHtml(leafName) {
    for (var i = 0; i < resourceExplorerData.enterprises.length; i++) {
      var ent = resourceExplorerData.enterprises[i];
      for (var j = 0; j < ent.categories.length; j++) {
        var cat = ent.categories[j];
        for (var k = 0; k < cat.leaves.length; k++) {
          if (cat.leaves[k].name === leafName) {
            return renderFileListItems(cat.leaves[k]);
          }
        }
      }
    }
    return '';
  }

  /* ---------- modal content generators ---------- */

  function getModalContent(type, context) {
    switch (type) {
      case 'account-settings':
        return '<div class="dm-form-group"><label class="dm-form-label">头像</label><div style="width:48px;height:48px;border-radius:var(--radius-full);background:var(--bg-overlay-l2);display:flex;align-items:center;justify-content:center;font-size:var(--body-base-font-size);font-weight:600;color:var(--text-secondary);">王</div></div>' +
          '<div class="dm-form-row"><div class="dm-form-group" style="flex:1"><label class="dm-form-label">姓名</label><input class="dm-form-input" value="王会计" /></div>' +
          '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">角色</label><input class="dm-form-input" value="管理员" disabled /></div></div>' +
          '<div class="dm-form-row"><div class="dm-form-group" style="flex:1"><label class="dm-form-label">邮箱</label><input class="dm-form-input" value="wangkuaiji@example.com" /></div>' +
          '<div class="dm-form-group" style="flex:1"><label class="dm-form-label">手机号</label><input class="dm-form-input" value="138****8888" /></div></div>' +
          '<div style="margin-top:12px;"><button class="dm-ghost-btn" data-action="change-password">修改密码</button></div>';

      case 'security-center':
        return '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="padding:12px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">密码强度</span><span style="font-size:var(--body-xs);color:var(--status-success-default);">强</span></div><div style="height:4px;background:var(--bg-overlay-l2);border-radius:2px;overflow:hidden;"><div style="width:85%;height:100%;background:var(--status-success-default);border-radius:2px;"></div></div></div>' +
          '<div style="padding:12px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);display:flex;justify-content:space-between;align-items:center;"><span style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">双因素认证</span><span style="font-size:var(--body-xs);color:var(--status-success-default);">已开启</span></div>' +
          '<div style="padding:12px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);margin-bottom:8px;">最近登录设备</div>' +
            '<div style="font-size:var(--body-xs);color:var(--text-tertiary);display:flex;justify-content:space-between;"><span>Windows 11 · Chrome</span><span>当前设备</span></div>' +
            '<div style="font-size:var(--body-xs);color:var(--text-tertiary);display:flex;justify-content:space-between;margin-top:4px;"><span>iPhone 15 · 小专快App</span><span>2小时前</span></div></div>' +
          '</div>';

      case 'global-search':
        // 修复 P1-04: 增加 input id 与 data-module/data-keyword 属性，配合 desktop-main.html 中的事件委托与过滤逻辑
        return '<div style="position:relative;margin-bottom:16px;"><input id="dm-global-search-input" class="dm-form-input" placeholder="搜索功能、模块、操作..." style="padding-right:32px;" /><span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:var(--body-xs-font-size);color:var(--text-tertiary);background:var(--bg-overlay-l2);padding:2px 6px;border-radius:3px;">Ctrl+K</span></div>' +
          '<div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-bottom:8px;font-weight:500;">最近搜索</div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px;">' +
            '<div class="dm-modal__search-item" data-keyword="进项发票认证" style="padding:6px 8px;border-radius:var(--radius-4);font-size:var(--body-sm);color:var(--text-secondary);cursor:pointer;">进项发票认证</div>' +
            '<div class="dm-modal__search-item" data-keyword="6月增值税申报" style="padding:6px 8px;border-radius:var(--radius-4);font-size:var(--body-sm);color:var(--text-secondary);cursor:pointer;">6月增值税申报</div>' +
          '</div>' +
          '<div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-bottom:8px;font-weight:500;">热门功能</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
            '<div class="dm-modal__search-item dm-modal__module-item" data-module="税务" style="padding:8px;background:var(--bg-overlay-l1);border-radius:var(--radius-4);font-size:var(--body-xs);color:var(--text-secondary);cursor:pointer;">&#x1F4E6; 发票管理</div>' +
            '<div class="dm-modal__search-item dm-modal__module-item" data-module="税务" style="padding:8px;background:var(--bg-overlay-l1);border-radius:var(--radius-4);font-size:var(--body-xs);color:var(--text-secondary);cursor:pointer;">&#x1F4C8; 纳税申报</div>' +
            '<div class="dm-modal__search-item dm-modal__module-item" data-module="财务报表" style="padding:8px;background:var(--bg-overlay-l1);border-radius:var(--radius-4);font-size:var(--body-xs);color:var(--text-secondary);cursor:pointer;">&#x1F4CA; 税负检测</div>' +
            '<div class="dm-modal__search-item dm-modal__module-item" data-module="合同" style="padding:8px;background:var(--bg-overlay-l1);border-radius:var(--radius-4);font-size:var(--body-xs);color:var(--text-secondary);cursor:pointer;">&#x1F4CB; 合同管理</div>' +
          '</div>' +
          '<div class="dm-modal__search-no-result" style="display:none;padding:24px 8px;text-align:center;color:var(--text-tertiary);font-size:var(--body-sm);">未找到相关功能</div>';

      case 'chat-history':
        // 修复 P0-09: 为每条历史记录添加 data-task-title 属性，与 getTaskConversation 的 key 对齐
        // 修复：公司全名作为唯一标识符，data-task-title 直接包含企业全称
        return '<div style="display:flex;flex-direction:column;gap:2px;">' +
          '<div data-task-title="6月记账 - 华信科技有限公司" style="padding:10px 8px;border-radius:var(--radius-4);cursor:pointer;display:flex;justify-content:space-between;transition:background .12s;" onmouseover="this.style.background=\'var(--bg-overlay-l1)\'" onmouseout="this.style.background=\'transparent\'"><div><div style="font-size:var(--body-sm);color:var(--text-default);">6月记账 - 华信科技有限公司</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">已完成 45 笔凭证</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">今天 14:23</span></div>' +
          '<div data-task-title="工商年报 - 明达贸易有限公司" style="padding:10px 8px;border-radius:var(--radius-4);cursor:pointer;display:flex;justify-content:space-between;transition:background .12s;" onmouseover="this.style.background=\'var(--bg-overlay-l1)\'" onmouseout="this.style.background=\'transparent\'"><div><div style="font-size:var(--body-sm);color:var(--text-default);">工商年报 - 明达贸易有限公司</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">待补充资料</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">今天 10:15</span></div>' +
          '<div data-task-title="银行对账 - 众诚电子有限公司" style="padding:10px 8px;border-radius:var(--radius-4);cursor:pointer;display:flex;justify-content:space-between;transition:background .12s;" onmouseover="this.style.background=\'var(--bg-overlay-l1)\'" onmouseout="this.style.background=\'transparent\'"><div><div style="font-size:var(--body-sm);color:var(--text-default);">银行对账 - 众诚电子有限公司</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">等待流水导入</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">昨天 09:30</span></div>' +
          '<div data-task-title="5月凭证确认 - 华信科技有限公司" style="padding:10px 8px;border-radius:var(--radius-4);cursor:pointer;display:flex;justify-content:space-between;transition:background .12s;" onmouseover="this.style.background=\'var(--bg-overlay-l1)\'" onmouseout="this.style.background=\'transparent\'"><div><div style="font-size:var(--body-sm);color:var(--text-default);">5月凭证确认 - 华信科技有限公司</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">全部确认完成</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">6月28日</span></div>' +
          '<div data-task-title="社保基数核定 - 华信科技有限公司" style="padding:10px 8px;border-radius:var(--radius-4);cursor:pointer;display:flex;justify-content:space-between;transition:background .12s;" onmouseover="this.style.background=\'var(--bg-overlay-l1)\'" onmouseout="this.style.background=\'transparent\'"><div><div style="font-size:var(--body-sm);color:var(--text-default);">社保基数核定 - 华信科技有限公司</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">自动完成</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">6月25日</span></div>' +
          '</div>';

      case 'gateway-connect':
        // 修复 P1-05: 为 App ID 与 App Secret 输入框添加 data-field 属性，便于 onConfirm 校验定位
        return '<div class="dm-form-group"><label class="dm-form-label">网关类型</label><select class="dm-form-select"><option>企业微信</option><option>钉钉</option><option>飞书</option></select></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">App ID</label><input class="dm-form-input" data-field="appId" placeholder="请输入 App ID" /></div>' +
          '<div class="dm-form-group"><label class="dm-form-label">App Secret</label><input class="dm-form-input" data-field="appSecret" type="password" placeholder="请输入 App Secret" /></div>';

      case 'gateway-messages':
        var gwName = context || '企业微信';
        return '<div style="display:flex;flex-direction:column;gap:2px;">' +
          '<div style="padding:8px;border-bottom:1px solid var(--border-neutral-l1);display:flex;justify-content:space-between;"><div><div style="font-size:var(--body-sm);color:var(--text-default);">客户群消息推送</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);">' + gwName + ' · 发送成功</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">14:20</span></div>' +
          '<div style="padding:8px;border-bottom:1px solid var(--border-neutral-l1);display:flex;justify-content:space-between;"><div><div style="font-size:var(--body-sm);color:var(--text-default);">发票提醒通知</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);">' + gwName + ' · 发送成功</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">13:45</span></div>' +
          '<div style="padding:8px;border-bottom:1px solid var(--border-neutral-l1);display:flex;justify-content:space-between;"><div><div style="font-size:var(--body-sm);color:var(--text-default);">催报通知</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);">' + gwName + ' · 发送成功</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">11:30</span></div>' +
          '<div style="padding:8px;border-bottom:1px solid var(--border-neutral-l1);display:flex;justify-content:space-between;"><div><div style="font-size:var(--body-sm);color:var(--text-default);">群成员变更</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);">' + gwName + ' · 自动同步</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">10:15</span></div>' +
          '<div style="padding:8px;display:flex;justify-content:space-between;"><div><div style="font-size:var(--body-sm);color:var(--text-default);">连接状态同步</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);">' + gwName + ' · 正常</div></div><span style="font-size:var(--body-xs);color:var(--text-tertiary);">09:00</span></div>' +
          '</div>';

      case 'agent-selector':
        // 修复 P0-08: 为每个智能体选项添加 data-agent 与 data-agent-desc 属性，通过事件委托处理点击
        return '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<div class="dm-modal__agent-item" data-agent="小专快" data-agent-desc="全能AI助手" style="padding:10px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);cursor:pointer;border:1px solid var(--border-neutral-l1);transition:border-color .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\'"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">&#x2728; 小专快</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">全能AI助手</div></div>' +
          '<div class="dm-modal__agent-item" data-agent="记账Agent" data-agent-desc="自动记账凭证生成" style="padding:10px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);cursor:pointer;border:1px solid var(--border-neutral-l1);transition:border-color .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\'"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">&#x1F4CB; 记账Agent</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">自动记账凭证生成</div></div>' +
          '<div class="dm-modal__agent-item" data-agent="报税Agent" data-agent-desc="税务申报与筹划" style="padding:10px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);cursor:pointer;border:1px solid var(--border-neutral-l1);transition:border-color .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\'"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">&#x1F4E6; 报税Agent</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">税务申报与筹划</div></div>' +
          '<div class="dm-modal__agent-item" data-agent="审计Agent" data-agent-desc="财务审计与稽核" style="padding:10px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);cursor:pointer;border:1px solid var(--border-neutral-l1);transition:border-color .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\'"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">&#x1F3E2; 审计Agent</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">财务审计与稽核</div></div>' +
          '<div class="dm-modal__agent-item" data-agent="凭证Agent" data-agent-desc="凭证生成与管理" style="padding:10px;background:var(--bg-overlay-l1);border-radius:var(--radius-6);cursor:pointer;border:1px solid var(--border-neutral-l1);transition:border-color .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\'"><div style="font-size:var(--body-sm);font-weight:500;color:var(--text-default);">&#x1F680; 凭证Agent</div><div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-top:2px;">凭证生成与管理</div></div>' +
          '</div>';

      case 'module-picker':
        // 修复 P1-03: 移除内联 onclick，改为 data-module 属性，由 desktop-main.html 中的事件委托处理
        var modules = ['税务', '工商', '银行', '合同', '客户服务', '客户配置', '统一凭证', '资料管理', '系统配置', '财务报表'];
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
        for (var i = 0; i < modules.length; i++) {
          html += '<div class="dm-modal__module-item" data-module="' + modules[i] + '" style="padding:12px 8px;background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);cursor:pointer;text-align:center;font-size:var(--body-sm);color:var(--text-secondary);transition:all .12s;" onmouseover="this.style.borderColor=\'var(--bg-brand)\';this.style.color=\'var(--text-default)\'" onmouseout="this.style.borderColor=\'var(--border-neutral-l1)\';this.style.color=\'var(--text-secondary)\'">' + modules[i] + '</div>';
        }
        html += '</div>';
        return html;

      default:
        return '<div style="padding:16px;text-align:center;color:var(--text-tertiary);">内容加载中...</div>';
    }
  }

  /* ---------- task conversation data for DMChat ---------- */

  /**
   * 企业列表（演示数据，可扩展至 50+ 家）
   * 用于第一栏 AI 对话记录筛选「企业」下拉选择器
   * 真实场景应从后端 /saas/enterprises 接口动态拉取
   */
  var ENTERPRISE_LIST = [
    '华信科技有限公司',
    '明达贸易有限公司',
    '众诚电子有限公司',
    '昌盛物流股份有限公司',
    '宏图建筑工程有限公司',
    '瑞达生物科技有限公司',
    '嘉和餐饮管理有限公司',
    '远方跨境电商有限公司',
    '锦绣纺织有限公司',
    '天和医药集团有限公司'
  ];

  var taskConversations = {
    '6月记账 - 华信科技有限公司': [
      { role: 'bot', text: '正在为您处理华信科技有限公司6月份的记账任务。已获取银行流水156笔，进项发票89张，销项发票76张。', time: '14:20' },
      { role: 'bot', text: '凭证草稿已生成45笔，请确认以下关键凭证...', time: '14:21' },
      { role: 'user', text: '凭证第3笔金额有误，应该是12,000而不是120,000', time: '14:23' },
      { role: 'bot', text: '已修正凭证第3笔金额为¥12,000.00。请问还有其他需要调整的吗？', time: '14:24' },
      { role: 'bot', text: '所有凭证已确认完毕，正在生成6月财务报表...', time: '14:25' }
    ],
    '工商年报 - 明达贸易有限公司': [
      { role: 'bot', text: '正在准备明达贸易有限公司的工商年报材料。', time: '10:10' },
      { role: 'bot', text: '以下资料需要您补充：1) 年度审计报告 2) 社保缴纳证明', time: '10:12' },
      { role: 'user', text: '审计报告已上传，社保证明明天提供', time: '10:15' }
    ],
    '银行对账 - 众诚电子有限公司': [
      { role: 'bot', text: '开始为众诚电子有限公司进行银行对账。已获取3个银行账户信息。', time: '09:28' },
      { role: 'bot', text: '等待导入6月银行流水数据...', time: '09:30' }
    ],
    '5月凭证确认 - 华信科技有限公司': [
      { role: 'bot', text: '华信科技5月凭证已全部生成，共52笔。', time: '16:00' },
      { role: 'user', text: '好的，确认全部', time: '16:05' },
      { role: 'bot', text: '已确认52笔凭证，5月财务报表生成完毕。', time: '16:06' },
      { role: 'bot', text: '5月记账任务已完成。', time: '16:06' }
    ],
    // 修复 P0-09: 补充社保基数核定的历史对话数据
    '社保基数核定 - 华信科技有限公司': [
      { role: 'bot', text: '正在为华信科技有限公司核定 2026 年度社保基数。已获取上年度月均工资数据。', time: '14:00' },
      { role: 'bot', text: '社保基数核定完成：养老保险基数 18,500 元/月，医疗保险基数 18,500 元/月，失业保险基数 18,500 元/月。', time: '14:05' },
      { role: 'bot', text: '已自动同步至社保局系统，核定流程完成。', time: '14:10' }
    ]
  };

  function getTaskConversation(taskTitle) {
    for (var key in taskConversations) {
      if (taskConversations.hasOwnProperty(key)) {
        if (taskTitle.indexOf(key.substring(0, 4)) >= 0 || key.indexOf(taskTitle.substring(0, 4)) >= 0) {
          return taskConversations[key];
        }
      }
    }
    return null;
  }

  function getConversationHtml(messages) {
    // 修复 P0-01: 真正渲染 HTML 字符串，避免返回数组导致 innerHTML 渲染为 [object Object]
    if (!Array.isArray(messages)) return '';
    var html = '';
    for (var i = 0; i < messages.length; i++) {
      html += DMBranch.getMessageHtml(messages[i], i);
    }
    return html;
  }

  // Task 9: 系统设置 Modal 内容——返回包含左侧分区导航 + 右侧内容区的 HTML
  function getSettingsModalContent() {
    return '<div style="display:flex;gap:0;height:400px;">' +
      '<div class="dm-settings-nav" style="width:140px;border-right:1px solid var(--border-neutral-l1);padding:8px 0;flex-shrink:0;">' +
        '<div class="dm-settings-nav-item dm-settings-nav-item--active" data-section="general">通用</div>' +
        '<div class="dm-settings-nav-item" data-section="appearance">外观</div>' +
        '<div class="dm-settings-nav-item" data-section="shortcuts">快捷键</div>' +
        '<div class="dm-settings-nav-item" data-section="ai">AI</div>' +
        '<div class="dm-settings-nav-item" data-section="notifications">通知</div>' +
      '</div>' +
      '<div class="dm-settings-content" id="settingsContent" style="flex:1;overflow-y:auto;padding:16px;">' +
        getSettingsSectionHtml('general') +
      '</div>' +
    '</div>';
  }

  // Task 9: 根据分区名返回对应对话设置项 HTML
  function getSettingsSectionHtml(section) {
    if (section === 'general') {
      return '<div class="dm-form-group"><label class="dm-form-label">语言</label><select class="dm-form-select"><option>简体中文</option><option>English</option><option>繁體中文</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">启动行为</label><select class="dm-form-select"><option>打开上次会话</option><option>显示首页</option><option>显示空白对话</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">自动更新</label><select class="dm-form-select"><option>自动检查并安装</option><option>仅检查不安装</option><option>关闭自动更新</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">数据缓存(MB)</label><input class="dm-form-input" value="500" type="number" min="100" max="2000"></div>';
    }
    if (section === 'appearance') {
      var currentTheme = (window.DMTheme && DMTheme.get) ? DMTheme.get() : 'dark';
      return '<div class="dm-form-group"><label class="dm-form-label">主题</label><select class="dm-form-select" id="settingsThemeSelect">' +
          '<option value="dark"' + (currentTheme === 'dark' ? ' selected' : '') + '>暗色（默认）</option>' +
          '<option value="light"' + (currentTheme === 'light' ? ' selected' : '') + '>亮色</option>' +
        '</select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">字号</label><select class="dm-form-select"><option>小</option><option selected>默认</option><option>大</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">界面密度</label><select class="dm-form-select"><option>紧凑</option><option selected>标准</option><option>宽松</option></select></div>';
    }
    if (section === 'shortcuts') {
      return '<div class="dm-form-group"><label class="dm-form-label">全局搜索</label><input class="dm-form-input" value="Ctrl+P" readonly></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">命令面板</label><input class="dm-form-input" value="Ctrl+K" readonly></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">关闭弹窗</label><input class="dm-form-input" value="Esc" readonly></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">新对话</label><input class="dm-form-input" value="Ctrl+N" readonly></div>';
    }
    if (section === 'ai') {
      return '<div class="dm-form-group"><label class="dm-form-label">默认 Agent</label><select class="dm-form-select"><option>记账Agent</option><option>税务Agent</option><option>通用助手</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">默认模型</label><select class="dm-form-select"><option>GPT-4o</option><option>Claude 3.5 Sonnet</option><option>GLM-4</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">Temperature</label><input class="dm-form-input" type="number" value="0.7" step="0.1" min="0" max="2"></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">自动确认凭证</label><select class="dm-form-select"><option>关闭</option><option>开启</option></select></div>';
    }
    if (section === 'notifications') {
      return '<div class="dm-form-group"><label class="dm-form-label">任务完成提醒</label><select class="dm-form-select"><option>系统通知</option><option>邮件</option><option>关闭</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">日程提醒</label><select class="dm-form-select"><option>提前1天</option><option>提前3天</option><option>提前1周</option></select></div>' +
        '<div class="dm-form-group"><label class="dm-form-label">错误告警</label><select class="dm-form-select"><option>即时通知</option><option>每日汇总</option><option>关闭</option></select></div>';
    }
    return '';
  }

  /* ---------- Extension Center Metadata ---------- */

  var extensionsData = [
    {
      name: 'OCR 识别', version: '2.1.0', enabled: true,
      icon: 'atom.svg', category: 'AI 识别',
      author: 'Gemsea @ BZI', updated: '2026-06-12', size: '12.4 MB',
      description: '基于深度学习的通用文字识别引擎，支持印刷体、手写体、表格、混合排版，准确率 99.2%。',
      features: [
        '支持中/英/日/韩等 18 种语言',
        '表格结构自动还原',
        '手写体识别',
        '批量并发处理'
      ],
      permissions: ['读取本地文件', '调用摄像头（可选）', '网络请求（API 调用）'],
      changelog: [
        { ver: '2.1.0', date: '2026-06-12', note: '新增日文识别支持' },
        { ver: '2.0.0', date: '2026-04-08', note: '重构识别引擎，准确率 +3.1%' },
        { ver: '1.8.0', date: '2026-01-15', note: '支持表格自动还原' }
      ]
    },
    {
      name: '浏览器自动化', version: '1.5.2', enabled: true,
      icon: 'globe.svg', category: '自动化',
      author: 'Gemsea @ BZI', updated: '2026-05-28', size: '8.7 MB',
      description: '使用脚本控制浏览器完成重复性网页操作，如批量登录、数据抓取、表单填写。',
      features: ['可视化录制', '多账号管理', '定时任务', '失败重试'],
      permissions: ['读取浏览器 Cookie', '模拟用户操作', '网络请求'],
      changelog: [
        { ver: '1.5.2', date: '2026-05-28', note: '修复 Chrome 124 兼容性问题' },
        { ver: '1.5.0', date: '2026-03-20', note: '新增可视化录制' }
      ]
    },
    {
      name: '报表生成', version: '3.0.1', enabled: true,
      icon: 'bar.svg', category: '数据分析',
      author: 'Gemsea @ BZI', updated: '2026-07-01', size: '15.2 MB',
      description: '可视化报表设计器，支持拖拽式布局、实时数据绑定、PDF/Excel 导出。',
      features: ['拖拽式设计器', '60+ 图表组件', 'PDF/Excel 导出', '实时数据绑定'],
      permissions: ['读取数据库', '写入本地文件', '网络请求'],
      changelog: [
        { ver: '3.0.1', date: '2026-07-01', note: '修复大数据集渲染卡顿' },
        { ver: '3.0.0', date: '2026-05-10', note: '全新架构，性能提升 5x' }
      ]
    },
    {
      name: '凭证OCR', version: '1.8.4', enabled: false,
      icon: 'scroll-text.svg', category: '财务',
      author: 'Gemsea @ BZI', updated: '2026-04-15', size: '9.8 MB',
      description: '财务凭证专用 OCR，自动识别摘要、科目、金额、借贷方向，生成标准记账凭证。',
      features: ['凭证要素识别', '科目自动匹配', '借贷方向判断', '批量处理'],
      permissions: ['读取本地文件', '调用 OCR 引擎', '写入数据库'],
      changelog: [
        { ver: '1.8.4', date: '2026-04-15', note: '支持银行回单识别' }
      ]
    },
    {
      name: '银行直连', version: '2.0.0', enabled: false,
      icon: 'dollar.svg', category: '金融',
      author: 'Gemsea @ BZI', updated: '2026-03-22', size: '22.1 MB',
      description: '直连 200+ 银行获取交易明细、回单、对账单，支持自动对账。',
      features: ['200+ 银行接入', '交易自动同步', '回单 PDF 下载', '智能对账'],
      permissions: ['网络请求（银行 API）', '读取 U盾证书', '本地加密存储'],
      changelog: [
        { ver: '2.0.0', date: '2026-03-22', note: '支持 80 家新增银行' }
      ]
    }
  ];

  function getSortedFilteredExtensions(sort, filter, keyword) {
    var list = extensionsData.slice();
    if (filter === 'enabled') {
      list = list.filter(function(e) { return e.enabled; });
    }
    if (keyword) {
      var kw = keyword.toLowerCase();
      list = list.filter(function(e) { return e.name.toLowerCase().indexOf(kw) >= 0; });
    }
    if (sort === 'name') {
      list.sort(function(a, b) { return a.name.localeCompare(b.name, 'zh-CN'); });
    }
    return list;
  }

  function getExtensionDetail(extName) {
    var ext = null;
    for (var i = 0; i < extensionsData.length; i++) {
      if (extensionsData[i].name === extName) { ext = extensionsData[i]; break; }
    }
    if (!ext) {
      return breadcrumb(['首页', '扩展中心', extName]) +
        '<div class="dm-col3__subtitle">' + extName + '</div>' +
        '<div style="text-align:center;padding:48px;color:var(--text-tertiary);">未找到扩展信息</div>';
    }

    var featuresHtml = ext.features.map(function(f) {
      return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:var(--body-sm-font-size);color:var(--text-secondary);">' +
        '<svg class="dm-icon" width="12" height="12" aria-hidden="true"><use href="#icon-check"/></svg>' +
        '<span>' + f + '</span></div>';
    }).join('');

    var permsHtml = ext.permissions.map(function(p) {
      return '<span style="display:inline-block;padding:2px 8px;background:var(--bg-overlay-l2);color:var(--text-secondary);font-size:var(--body-xs-font-size);border-radius:var(--radius-4);margin:2px;">' + p + '</span>';
    }).join('');

    var changelogHtml = ext.changelog.map(function(c) {
      return '<div class="dm-col3__detail-row">' +
        '<div class="dm-col3__detail-label">v' + c.ver + ' · ' + c.date + '</div>' +
        '<div class="dm-col3__detail-value">' + c.note + '</div>' +
        '</div>';
    }).join('');

    var statusTag = ext.enabled
      ? '<span class="dm-col3__tag" style="background:var(--status-success-default);">已启用</span>'
      : '<span class="dm-col3__tag dm-col3__tag--muted">已禁用</span>';

    return breadcrumb(['首页', '扩展中心', ext.name]) +
      '<div class="dm-col3__subtitle">' +
        '<svg class="dm-icon" width="18" height="18" aria-hidden="true"><use href="#icon-' + ext.icon.replace(/\.svg$/, '') + '"/></svg>' +
        '<span>' + ext.name + '</span>' +
        '<span class="dm-col3__tag">v' + ext.version + '</span>' +
        statusTag +
      '</div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active" data-ext-action="toggle">' + (ext.enabled ? '禁用' : '启用') + '</button>' +
        '<button class="dm-col3__list-toolbar-btn" data-ext-action="settings">设置</button>' +
        '<button class="dm-col3__list-toolbar-btn" data-ext-action="changelog">更新日志</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;color:var(--status-error-default);" data-ext-action="uninstall">卸载</button>' +
      '</div>' +
      '<div class="dm-col3__detail-card">' +
        '<div class="dm-col3__detail-card-header">基础信息</div>' +
        '<div class="dm-col3__detail-card-body">' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">扩展名称</div><div class="dm-col3__detail-value">' + ext.name + '</div></div>' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">当前版本</div><div class="dm-col3__detail-value">v' + ext.version + '</div></div>' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">分类</div><div class="dm-col3__detail-value">' + ext.category + '</div></div>' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">作者</div><div class="dm-col3__detail-value">' + ext.author + '</div></div>' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">更新时间</div><div class="dm-col3__detail-value">' + ext.updated + '</div></div>' +
          '<div class="dm-col3__detail-row"><div class="dm-col3__detail-label">安装包大小</div><div class="dm-col3__detail-value">' + ext.size + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="dm-col3__detail-card">' +
        '<div class="dm-col3__detail-card-header">功能描述</div>' +
        '<div class="dm-col3__detail-card-body">' +
          '<div style="font-size:var(--body-sm-font-size);color:var(--text-secondary);line-height:1.6;padding:4px 0;">' + ext.description + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dm-col3__detail-card">' +
        '<div class="dm-col3__detail-card-header">核心功能</div>' +
        '<div class="dm-col3__detail-card-body">' + featuresHtml + '</div>' +
      '</div>' +
      '<div class="dm-col3__detail-card">' +
        '<div class="dm-col3__detail-card-header">所需权限</div>' +
        '<div class="dm-col3__detail-card-body"><div style="padding:4px 0;">' + permsHtml + '</div></div>' +
      '</div>' +
      '<div class="dm-col3__detail-card">' +
        '<div class="dm-col3__detail-card-header">更新日志</div>' +
        '<div class="dm-col3__detail-card-body">' + changelogHtml + '</div>' +
      '</div>';
  }

  /* ---------- Task 10: 资源树文件编辑器 ---------- */

  // 根据文件名分派到对应类型的编辑器
  function getFileEditor(fileName) {
    // 发票类 - 表格编辑器
    var invoiceTypes = ['增值税专用发票', '普通发票', '电子发票', '机动车销售发票', '海关进口缴款书'];
    if (invoiceTypes.indexOf(fileName) >= 0) {
      return getFileEditorTable(fileName);
    }
    // 合同类 - 文本编辑器
    var contractTypes = ['采购合同', '销售合同', '服务合同'];
    if (contractTypes.indexOf(fileName) >= 0) {
      return getFileEditorText(fileName);
    }
    // 证照类 - 预览
    var licenseTypes = ['营业执照', '开户许可证', '印章备案'];
    if (licenseTypes.indexOf(fileName) >= 0) {
      return getFileEditorPreview(fileName);
    }
    // 银行类 - 账户详情
    var bankTypes = ['中国银行-基本户', '工商银行-一般户', '建设银行-纳税专户'];
    if (bankTypes.indexOf(fileName) >= 0) {
      return getFileEditorBank(fileName);
    }
    // 报表类 - 预览
    var reportTypes = ['资产负债表', '利润表', '现金流量表'];
    if (reportTypes.indexOf(fileName) >= 0) {
      return getFileEditorPreview(fileName);
    }
    // 不支持的类型
    return getFileEditorUnsupported(fileName);
  }

  // 发票类表格编辑器
  function getFileEditorTable(fileName) {
    return breadcrumb(['首页', fileName]) +
      '<div class="dm-col3__subtitle">' + fileName + ' <span class="dm-col3__tag">表格编辑器</span></div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">全部</button>' +
        '<button class="dm-col3__list-toolbar-btn">待认证</button>' +
        '<button class="dm-col3__list-toolbar-btn">已认证</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">导入</button>' +
        '<button class="dm-col3__list-toolbar-btn">导出</button>' +
      '</div>' +
      listTable(
        ['编号', '发票代码', '销方名称', '金额', '税额', '状态', '操作'],
        [
          ['1', '042001200311', '上海XX科技有限公司', '¥12,345.00', '¥1,604.85', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>', '<span style="color:var(--bg-brand);cursor:pointer;">查看</span>'],
          ['2', '042001200412', '北京YY贸易有限公司', '¥8,900.00', '¥1,157.00', '<span class="dm-col3__badge dm-col3__badge--warning">待认证</span>', '<span style="color:var(--bg-brand);cursor:pointer;">查看</span>'],
          ['3', '042001200523', '广州ZZ科技有限公司', '¥25,600.00', '¥3,328.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>', '<span style="color:var(--bg-brand);cursor:pointer;">查看</span>'],
          ['4', '042001200634', '深圳AA电子有限公司', '¥5,200.00', '¥676.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>', '<span style="color:var(--bg-brand);cursor:pointer;">查看</span>'],
          ['5', '042001200745', '杭州BB商贸有限公司', '¥18,000.00', '¥2,340.00', '<span class="dm-col3__badge dm-col3__badge--success">已认证</span>', '<span style="color:var(--bg-brand);cursor:pointer;">查看</span>']
        ]
      );
  }

  // 合同类文本编辑器
  function getFileEditorText(fileName) {
    return breadcrumb(['首页', fileName]) +
      '<div class="dm-col3__subtitle">' + fileName + ' <span class="dm-col3__tag">文本编辑器</span></div>' +
      '<div class="dm-col3__list-toolbar">' +
        '<button class="dm-col3__list-toolbar-btn dm-col3__list-toolbar-btn--active">编辑</button>' +
        '<button class="dm-col3__list-toolbar-btn">预览</button>' +
        '<button class="dm-col3__list-toolbar-btn" style="margin-left:auto;">保存</button>' +
      '</div>' +
      '<div style="background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);padding:16px;font-family:var(--code-editor-font-family);font-size:var(--code-editor-font-size);line-height:1.6;color:var(--text-default);min-height:300px;white-space:pre-wrap;">' +
        '合同编号：HT-2026-' + Math.floor(Math.random() * 9000 + 1000) + '\n' +
        '甲方：华信科技有限公司\n' +
        '乙方：________________\n' +
        '\n' +
        '第一条 合同标的\n' +
        '  本合同项下的采购/服务内容为：________________\n' +
        '\n' +
        '第二条 合同金额\n' +
        '  本合同总金额为人民币 ¥________ 元（大写：________）\n' +
        '\n' +
        '第三条 付款方式\n' +
        '  3.1 甲方应在合同签订后 7 个工作日内支付预付款 30%\n' +
        '  3.2 验收合格后 15 个工作日内支付尾款 70%\n' +
        '\n' +
        '第四条 违约责任\n' +
        '  任何一方违反本合同约定，应承担违约责任...\n' +
        '\n' +
        '签订日期：2026-07-04\n' +
        '签订地点：上海' +
      '</div>';
  }

  // 证照/报表类预览视图
  function getFileEditorPreview(fileName) {
    return breadcrumb(['首页', fileName]) +
      '<div class="dm-col3__subtitle">' + fileName + ' <span class="dm-col3__tag dm-col3__tag--muted">预览</span></div>' +
      '<div style="background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);padding:var(--spacer-24);text-align:center;color:var(--text-tertiary);font-size:var(--body-sm);min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        '<div style="font-size:48px;margin-bottom:12px;">&#x1F4C4;</div>' +
        '<div style="font-size:var(--body-md);color:var(--text-default);margin-bottom:8px;">' + fileName + '</div>' +
        '<div>文件类型：图片/PDF文档</div>' +
        '<div style="margin-top:16px;display:flex;gap:8px;">' +
          '<button class="dm-ghost-btn">放大查看</button>' +
          '<button class="dm-ghost-btn">下载</button>' +
        '</div>' +
        '<div style="margin-top:24px;max-width:400px;padding:12px;background:var(--bg-base-secondary);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);text-align:left;">' +
          '<div style="font-size:var(--body-sm-font-size);color:var(--text-tertiary);margin-bottom:6px;">文件信息</div>' +
          '<div style="font-size:var(--body-md-font-size);color:var(--text-secondary);">名称：' + fileName + '.pdf</div>' +
          '<div style="font-size:var(--body-md-font-size);color:var(--text-secondary);">大小：2.4 MB</div>' +
          '<div style="font-size:var(--body-md-font-size);color:var(--text-secondary);">上传：2026-06-15</div>' +
        '</div>' +
      '</div>';
  }

  // 银行类账户详情卡片
  function getFileEditorBank(fileName) {
    var bankInfo = {
      '中国银行-基本户': { bank: '中国银行', account: '****1234', balance: '¥245,680.00', type: '基本户' },
      '工商银行-一般户': { bank: '工商银行', account: '****5678', balance: '¥89,120.50', type: '一般户' },
      '建设银行-纳税专户': { bank: '建设银行', account: '****9012', balance: '¥45,000.00', type: '纳税专户' }
    };
    var info = bankInfo[fileName] || { bank: '', account: '', balance: '', type: '' };
    return breadcrumb(['首页', fileName]) +
      '<div class="dm-col3__subtitle">' + fileName + ' <span class="dm-col3__tag">账户详情</span></div>' +
      '<div style="background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-8);padding:24px;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
          '<div>' +
            '<div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-bottom:4px;">' + info.type + '</div>' +
            '<div style="font-size:var(--heading-sm);color:var(--text-default);font-weight:600;">' + info.bank + '</div>' +
            '<div style="font-size:var(--body-sm);color:var(--text-secondary);margin-top:4px;font-family:var(--code-editor-font-family);">' + info.account + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:var(--body-xs);color:var(--text-tertiary);margin-bottom:4px;">当前余额</div>' +
            '<div style="font-size:var(--heading-md);color:var(--bg-brand);font-weight:600;">' + info.balance + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="dm-ghost-btn">查看流水</button>' +
          '<button class="dm-ghost-btn">下载回单</button>' +
          '<button class="dm-ghost-btn">对账</button>' +
        '</div>' +
      '</div>' +
      '<div class="dm-col3__subtitle">近期流水</div>' +
      listTable(
        ['日期', '摘要', '收入', '支出', '余额'],
        [
          ['2026-07-03', '税款扣款', '', '¥58,691.00', '¥245,680.00'],
          ['2026-07-02', '客户回款', '¥120,000.00', '', '¥304,371.00'],
          ['2026-07-01', '工资发放', '', '¥85,200.00', '¥184,371.00'],
          ['2026-06-30', '供应商付款', '', '¥45,600.00', '¥269,571.00']
        ]
      );
  }

  // 不支持的文件类型空态
  function getFileEditorUnsupported(fileName) {
    return breadcrumb(['首页', fileName]) +
      '<div class="dm-col3__subtitle">' + fileName + '</div>' +
      '<div style="background:var(--bg-overlay-l1);border:1px solid var(--border-neutral-l1);border-radius:var(--radius-6);padding:var(--spacer-24);text-align:center;color:var(--text-tertiary);font-size:var(--body-sm);min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        '<div style="font-size:48px;margin-bottom:12px;">&#x26A0;&#xFE0F;</div>' +
        '<div style="font-size:var(--body-md);color:var(--text-default);margin-bottom:8px;">暂无可用编辑器</div>' +
        '<div>该文件类型暂不支持在线编辑，请使用桌面应用打开</div>' +
        '<div style="margin-top:16px;">' +
          '<button class="dm-ghost-btn" onclick="DMToast.info(\'下载功能演示中\')">下载到本地</button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Task 7: 日程切换四栏联动数据 ---------- */

  /**
   * 统一日程数据源
   * 每条记录包含：标题、日期、图标、企业全称、模块、资源、颜色类别
   */
  var SCHEDULE_ITEMS = [
    { title: '月报提交截止',   date: '6/30', icon: 'alert-triangle', ent: '华信科技有限公司', module: '财务报表',  resource: '财务报表',  color: 'alert' },
    { title: '工商年检',       date: '7/05', icon: 'shield',         ent: '明达贸易有限公司', module: '工商',       resource: '证照',     color: 'primary' },
    { title: '季度申报',       date: '7/10', icon: 'bar',            ent: '众诚电子有限公司', module: '税务',       resource: '进项发票', color: 'warning' },
    { title: '银行对账完成',   date: '7/15', icon: 'check-circle',   ent: '众诚电子有限公司', module: '银行',       resource: '银行档案', color: 'success' },
    { title: '社保基数核定',   date: '7/20', icon: 'users',          ent: '华信科技有限公司', module: '社保',       resource: '',         color: 'default' }
  ];

  /** 历史日程记录（已完成） */
  var scheduleHistory = [];

  /**
   * 获取企业全称对应的颜色类名
   */
  function getScheduleColorClass(color) {
    var map = {
      alert:   'var(--status-alert-surface-l1); color:var(--status-alert-default)',
      primary: 'var(--status-primary-surface-l1); color:var(--status-primary-default)',
      warning: 'var(--status-warning-surface-l1); color:var(--status-warning-default)',
      success: 'var(--status-success-surface-l1); color:var(--status-success-default)',
      default: 'var(--bg-overlay-l2); color:var(--text-secondary)'
    };
    return map[color] || map.default;
  }

  /**
   * 渲染所有日程项 HTML
   */
  function renderScheduleItems() {
    var html = '';
    for (var i = 0; i < SCHEDULE_ITEMS.length; i++) {
      var item = SCHEDULE_ITEMS[i];
      var colorStyle = getScheduleColorClass(item.color);
      html +=
        '<div class="dm-col1__schedule-item" data-ent="' + item.ent + '" data-title="' + item.title + '">' +
          '<svg width="12" height="12" class="dm-icon" aria-hidden="true"><use href="#icon-' + item.icon + '"/></svg>' +
          '<span class="dm-col1__schedule-item-date" style="display:inline-flex;align-items:center;justify-content:center;height:18px;border-radius:var(--radius-2);background:' + colorStyle + ';font-size:var(--body-md-font-size);font-weight:var(--font-weight-medium);">' + item.date + '</span>' +
          '<div class="dm-col1__schedule-item-body">' +
            '<span class="dm-col1__schedule-item-title">' + item.title + '</span>' +
            '<span class="dm-col1__schedule-item-ent">' + item.ent + '</span>' +
          '</div>' +
          '<button class="dm-schedule__done-btn" title="标记完成" data-title="' + item.title + '">' +
            '<svg width="10" height="10" class="dm-icon" aria-hidden="true"><use href="#icon-check"/></svg>' +
          '</button>' +
        '</div>';
    }
    return html;
  }

  /**
   * 标记日程为已完成
   * @param {string} title - 日程标题
   */
  function completeSchedule(title) {
    for (var i = 0; i < SCHEDULE_ITEMS.length; i++) {
      if (SCHEDULE_ITEMS[i].title === title) {
        scheduleHistory.push(SCHEDULE_ITEMS[i]);
        SCHEDULE_ITEMS.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * 获取历史日程列表副本
   */
  function getScheduleHistory() {
    return scheduleHistory.slice();
  }

  /**
   * 获取已完成日程数量
   */
  function getScheduleDoneCount() {
    return scheduleHistory.length;
  }

  // 根据日程标题返回对应对话流
  function getScheduleConversation(scheduleTitle) {
    var convs = {
      '月报提交截止': [
        { role: 'bot', text: '6月月报已生成，包含：<ul><li>资产负债表</li><li>利润表</li><li>现金流量表</li></ul>请确认后提交。', time: '09:15' },
        { role: 'user', text: '确认提交', time: '09:18' },
        { role: 'bot', text: '月报已提交至税务局，受理回执编号：SH-2026-06-8847', time: '09:20' }
      ],
      '工商年检': [
        { role: 'bot', text: '工商年检材料已准备完毕：<ul><li>年度报告</li><li>财务报表</li><li>股东会决议</li></ul>', time: '10:30' },
        { role: 'user', text: '发起年检申报', time: '10:35' },
        { role: 'bot', text: '工商年检已提交，预计3个工作日内完成审核', time: '10:36' }
      ],
      '季度申报': [
        { role: 'bot', text: 'Q2季度申报数据已汇总：<ul><li>增值税：¥45,260</li><li>企业所得税：¥128,500</li><li>附加税：¥5,431</li></ul>', time: '14:00' },
        { role: 'user', text: '核对无误，提交申报', time: '14:15' },
        { role: 'bot', text: '季度申报已提交，税局回执：Q2-2026-9982', time: '14:16' }
      ],
      '税款缴纳': [
        { role: 'bot', text: '本期应缴税款已计算完成：¥58,691（增值税+附加税+企业所得税），请确认扣款账户。', time: '15:00' },
        { role: 'user', text: '从基本户扣款', time: '15:05' },
        { role: 'bot', text: '税款扣款成功，电子缴款书已生成并归档', time: '15:08' }
      ],
      '银行对账完成': [
        { role: 'bot', text: '众诚电子银行对账已完成，共核对 3 个账户：<ul><li>中国银行-基本户：差异 0 笔</li><li>工商银行-一般户：差异 0 笔</li><li>建设银行-纳税专户：差异 0 笔</li></ul>', time: '11:00' },
        { role: 'user', text: '查看对账明细', time: '11:05' },
        { role: 'bot', text: '所有流水已自动归类，对账报告已归档至银行档案', time: '11:06' }
      ],
      '社保基数核定': [
        { role: 'bot', text: '华信科技 2026 年度社保基数核定完成：<ul><li>养老保险基数：18,500 元/月</li><li>医疗保险基数：18,500 元/月</li><li>失业保险基数：18,500 元/月</li></ul>', time: '14:00' },
        { role: 'user', text: '确认并提交至社保局', time: '14:10' },
        { role: 'bot', text: '社保基数已同步至社保局系统，核定流程完成', time: '14:12' }
      ]
    };
    return convs[scheduleTitle] || [
      { role: 'bot', text: '已加载日程：' + scheduleTitle, time: '09:00' }
    ];
  }

  // 根据日程标题返回对应模块名（用于第3栏 Tab 切换）
  function getScheduleModule(scheduleTitle) {
    var map = {
      '月报提交截止': '财务报表',
      '工商年检': '工商',
      '季度申报': '税务',
      '税款缴纳': '税务',
      '银行对账完成': '银行',
      '社保基数核定': '社保'
    };
    return map[scheduleTitle] || '首页';
  }

  // 根据日程标题返回对应资源名（用于第4栏资源节点高亮）
  function getScheduleResource(scheduleTitle) {
    var map = {
      '月报提交截止': '财务报表',
      '工商年检': '证照',
      '季度申报': '进项发票',
      '税款缴纳': '银行档案',
      '银行对账完成': '银行档案'
    };
    return map[scheduleTitle] || '';
  }

  // Task 5: 渲染内联详情面板（文件元数据 + 操作按钮 + 文件类型差异化预览）
  function getFileTypeLabel(fileType) {
    var labels = { pdf: 'PDF 文档', excel: 'Excel 文档', image: '图片', invoice: '票据/合同', generic: '文件' };
    return labels[fileType] || '文件';
  }

  function renderPdfPreview(leafName) {
    var lines = '';
    for (var i = 0; i < 6; i++) {
      var width = 60 + Math.floor(Math.random() * 30);
      lines += '<div class="dm-col4__file-preview-page-line" style="width:' + width + '%;"></div>';
    }
    return '<div class="dm-col4__file-preview dm-col4__file-preview--pdf">' +
      '<div class="dm-col4__file-preview-pager">第 1 页 / 共 12 页</div>' +
      '<div class="dm-col4__file-preview-page">' +
        '<div class="dm-col4__file-preview-page-title">' + leafName + '</div>' +
        lines +
      '</div>' +
    '</div>';
  }

  function renderExcelPreview(leafName) {
    var rows = [
      ['2026-06-01', '期初余额', '', '', '¥100,000.00'],
      ['2026-06-05', '收到货款', '¥50,000.00', '', '¥150,000.00'],
      ['2026-06-10', '支付工资', '', '¥85,000.00', '¥65,000.00'],
      ['2026-06-15', '采购原材料', '', '¥32,000.00', '¥33,000.00'],
      ['2026-06-20', '收到服务费', '¥18,000.00', '', '¥51,000.00']
    ];
    var rowsHtml = rows.map(function(row) {
      return '<tr>' + row.map(function(cell, idx) {
        var isAmount = idx === 2 || idx === 3 || idx === 4;
        var cls = isAmount ? ' class="dm-col4__file-table-cell dm-col4__file-table-cell--amount"' : ' class="dm-col4__file-table-cell"';
        return '<td' + cls + '>' + (cell || '—') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="dm-col4__file-preview dm-col4__file-preview--excel">' +
      '<div class="dm-col4__file-preview-caption">' + leafName + ' · 2026年6月</div>' +
      '<div class="dm-col4__file-table-wrapper">' +
        '<table class="dm-col4__file-table">' +
          '<thead><tr>' +
            ['日期', '摘要', '收入', '支出', '余额'].map(function(h) {
              return '<th class="dm-col4__file-table-header">' + h + '</th>';
            }).join('') +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  }

  function renderImagePreview(leafName) {
    return '<div class="dm-col4__file-preview dm-col4__file-preview--image">' +
      '<div class="dm-col4__file-image-thumb">' +
        '<div class="dm-col4__file-image-placeholder">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
          '<span>' + leafName + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="dm-col4__file-image-meta">尺寸: 1920×1080 · 格式: JPG · 大小: 1.2 MB</div>' +
    '</div>';
  }

  function renderInvoicePreview(leafName) {
    return '<div class="dm-col4__file-preview dm-col4__file-preview--invoice">' +
      '<div class="dm-col4__file-info-card">' +
        '<div class="dm-col4__file-info-card-row"><span class="dm-col4__file-info-card-label">发票号</span><span class="dm-col4__file-info-card-value">FP-2026-001</span></div>' +
        '<div class="dm-col4__file-info-card-row"><span class="dm-col4__file-info-card-label">金额</span><span class="dm-col4__file-info-card-value dm-col4__file-info-card-value--primary">¥50,000.00</span></div>' +
        '<div class="dm-col4__file-info-card-row"><span class="dm-col4__file-info-card-label">开票日期</span><span class="dm-col4__file-info-card-value">2026-06-15</span></div>' +
        '<div class="dm-col4__file-info-card-row"><span class="dm-col4__file-info-card-label">购方</span><span class="dm-col4__file-info-card-value">华信科技有限公司</span></div>' +
        '<div class="dm-col4__file-info-card-row"><span class="dm-col4__file-info-card-label">销方</span><span class="dm-col4__file-info-card-value">明达贸易有限公司</span></div>' +
      '</div>' +
    '</div>';
  }

  function renderGenericPreview(leafName) {
    return '<div class="dm-col4__file-preview dm-col4__file-preview--generic">' +
      '<div class="dm-col4__file-image-placeholder">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<span>' + leafName + '</span>' +
      '</div>' +
    '</div>';
  }

  function renderFileMeta(leafName, fileType) {
    var fileSize = '2.4 MB';
    if (fileType === 'image') fileSize = '1.2 MB';
    if (fileType === 'excel') fileSize = '156 KB';
    if (fileType === 'pdf') fileSize = '3.8 MB';
    var ext = '.pdf';
    if (fileType === 'excel') ext = '.xlsx';
    else if (fileType === 'image') ext = '.jpg';
    return '<div class="dm-col4__inline-detail-meta">' +
      '<div class="dm-col4__inline-detail-meta-item"><span class="dm-col4__inline-detail-label">文件名</span><span>' + leafName + ext + '</span></div>' +
      '<div class="dm-col4__inline-detail-meta-item"><span class="dm-col4__inline-detail-label">类型</span><span>' + getFileTypeLabel(fileType) + '</span></div>' +
      '<div class="dm-col4__inline-detail-meta-item"><span class="dm-col4__inline-detail-label">大小</span><span>' + fileSize + '</span></div>' +
      '<div class="dm-col4__inline-detail-meta-item"><span class="dm-col4__inline-detail-label">上传时间</span><span>2026-07-01 10:30</span></div>' +
      '<div class="dm-col4__inline-detail-meta-item"><span class="dm-col4__inline-detail-label">上传人</span><span>王会计</span></div>' +
    '</div>';
  }

  function renderVersionHistory() {
    var versions = [
      { v: 'v3', user: '王会计', time: '2026-07-01 10:30', note: '更新 6 月份报表数据' },
      { v: 'v2', user: '李会计', time: '2026-06-15 14:20', note: '修正凭证金额错误' },
      { v: 'v1', user: '王会计', time: '2026-06-01 09:00', note: '初始上传' }
    ];
    var itemsHtml = versions.map(function(v) {
      return '<div class="dm-col4__file-version-item">' +
        '<span class="dm-col4__file-version-v">' + v.v + '</span>' +
        '<div class="dm-col4__file-version-info">' +
          '<div class="dm-col4__file-version-meta">' + v.user + ' · ' + v.time + '</div>' +
          '<div class="dm-col4__file-version-note">' + v.note + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="dm-col4__file-section">' +
      '<div class="dm-col4__file-section-header" data-section-toggle="version">' +
        '<span class="dm-col4__file-section-arrow">▶</span>' +
        '<span class="dm-col4__file-section-title">版本历史</span>' +
        '<span class="dm-col4__file-section-count">3</span>' +
      '</div>' +
      '<div class="dm-col4__file-section-body" style="display:none;">' + itemsHtml + '</div>' +
    '</div>';
  }

  function renderFileLinks() {
    var links = [
      { type: '关联任务', name: 'T-2026-06-月度报表', status: '进行中' },
      { type: '关联凭证', name: 'V-2026-06-001', status: '已确认' }
    ];
    var itemsHtml = links.map(function(l) {
      return '<div class="dm-col4__file-link-item">' +
        '<span class="dm-col4__file-link-type">' + l.type + '</span>' +
        '<span class="dm-col4__file-link-name">' + l.name + '</span>' +
        '<span class="dm-col4__file-link-status">' + l.status + '</span>' +
      '</div>';
    }).join('');
    return '<div class="dm-col4__file-section">' +
      '<div class="dm-col4__file-section-header" data-section-toggle="link">' +
        '<span class="dm-col4__file-section-arrow">▶</span>' +
        '<span class="dm-col4__file-section-title">关联信息</span>' +
        '<span class="dm-col4__file-section-count">2</span>' +
      '</div>' +
      '<div class="dm-col4__file-section-body" style="display:none;">' + itemsHtml + '</div>' +
    '</div>';
  }

  function renderInlineDetail(leafName) {
    // 参数兼容叶子节点名（如"增值税专用发票"）与文件名（如"增值税专用发票_20260701_001.pdf"）
    // 判定文件类型（基于关键词正则匹配，对文件名同样有效）
    var fileType = 'generic';
    if (/审计报告/.test(leafName)) fileType = 'pdf';
    else if (/银行对账单|税务申报表/.test(leafName)) fileType = 'excel';
    else if (/营业执照|法人身份证|开户许可证|印章备案/.test(leafName)) fileType = 'image';
    else if (/发票|合同/.test(leafName)) fileType = 'invoice';

    // 生成预览内容
    var previewHtml = '';
    if (fileType === 'pdf') {
      previewHtml = renderPdfPreview(leafName);
    } else if (fileType === 'excel') {
      previewHtml = renderExcelPreview(leafName);
    } else if (fileType === 'image') {
      previewHtml = renderImagePreview(leafName);
    } else if (fileType === 'invoice') {
      previewHtml = renderInvoicePreview(leafName);
    } else {
      previewHtml = renderGenericPreview(leafName);
    }

    // 元数据
    var metaHtml = renderFileMeta(leafName, fileType);

    // 操作按钮（为 Task 4 预留 data-action 属性）
    var actionsHtml = '<div class="dm-col4__inline-detail-actions">' +
      '<button class="dm-col4__inline-detail-btn dm-col4__inline-detail-btn--primary" data-action="preview">预览</button>' +
      '<button class="dm-col4__inline-detail-btn" data-action="download">下载</button>' +
      '<button class="dm-col4__inline-detail-btn" data-action="rename">重命名</button>' +
      '<button class="dm-col4__inline-detail-btn dm-col4__inline-detail-btn--danger" data-action="delete">删除</button>' +
    '</div>';

    // 版本历史
    var versionHtml = renderVersionHistory();

    // 关联信息
    var linkHtml = renderFileLinks();

    return '<div class="dm-col4__inline-detail">' +
      '<div class="dm-col4__inline-detail-header">' +
        '<span class="dm-col4__inline-detail-title">' + leafName + '</span>' +
        '<span class="dm-col4__inline-detail-type">' + getFileTypeLabel(fileType) + '</span>' +
      '</div>' +
      '<div class="dm-col4__file-preview-wrapper">' + previewHtml + '</div>' +
      metaHtml +
      actionsHtml +
      versionHtml +
      linkHtml +
    '</div>';
  }

  // Task 4: 文件查看器 Modal(放大版预览)
  function renderFileViewerModal(leafName) {
    // 判定文件类型
    var fileType = 'generic';
    if (/审计报告/.test(leafName)) fileType = 'pdf';
    else if (/银行对账单|税务申报表/.test(leafName)) fileType = 'excel';
    else if (/营业执照|法人身份证|开户许可证|印章备案/.test(leafName)) fileType = 'image';
    else if (/发票|合同/.test(leafName)) fileType = 'invoice';

    // 复用预览渲染函数(放大版)
    var previewHtml = '';
    if (fileType === 'pdf') {
      previewHtml = renderPdfPreview(leafName);
    } else if (fileType === 'excel') {
      previewHtml = renderExcelPreview(leafName);
    } else if (fileType === 'image') {
      previewHtml = renderImagePreview(leafName);
    } else if (fileType === 'invoice') {
      previewHtml = renderInvoicePreview(leafName);
    } else {
      previewHtml = renderGenericPreview(leafName);
    }

    return '<div class="dm-col4__file-viewer">' +
      '<div class="dm-col4__file-viewer-header">' +
        '<span class="dm-col4__file-viewer-type">' + getFileTypeLabel(fileType) + '</span>' +
        '<span class="dm-col4__file-viewer-size">大小: ' + (fileType === 'image' ? '1.2 MB' : fileType === 'excel' ? '156 KB' : '3.8 MB') + '</span>' +
      '</div>' +
      '<div class="dm-col4__file-viewer-body">' + previewHtml + '</div>' +
    '</div>';
  }

  return {
    getTabContent: getTabContent,
    getTabConfig: getTabConfig,
    getModalContent: getModalContent,
    getTaskConversation: getTaskConversation,
    getConversationHtml: getConversationHtml,
    registerResourceContent: registerResourceContent,
    taskConversations: taskConversations,
    getEnterpriseList: function() { return ENTERPRISE_LIST.slice(); },
    homeGridModules: homeGridModules,
    getHomeGridHtml: getHomeGridHtml,
    resourceSubItems: resourceSubItems,
    getSubItemsHtml: getSubItemsHtml,
    // 修复 P0-07: 暴露 resourceContents 给叶子节点点击处理器调用
    resourceContents: resourceContents,
    // Task 9: 暴露系统设置 Modal 内容函数
    getSettingsModalContent: getSettingsModalContent,
    getSettingsSectionHtml: getSettingsSectionHtml,
    // Task 10: 暴露文件编辑器函数给叶子节点点击处理器调用
    getFileEditor: getFileEditor,
    // Task 7: 暴露日程联动数据函数
    SCHEDULE_ITEMS: SCHEDULE_ITEMS,
    scheduleHistory: scheduleHistory,
    getScheduleConversation: getScheduleConversation,
    getScheduleModule: getScheduleModule,
    getScheduleResource: getScheduleResource,
    renderScheduleItems: renderScheduleItems,
    completeSchedule: completeSchedule,
    getScheduleHistory: getScheduleHistory,
    getScheduleDoneCount: getScheduleDoneCount,
    // Task 5: 暴露内联详情面板渲染函数
    renderInlineDetail: renderInlineDetail,
    // Task 4: 暴露文件查看器 Modal 渲染函数
    renderFileViewerModal: renderFileViewerModal,
    // 资源管理器：暴露统一数据源与渲染函数（VS Code 风格）
    resourceExplorerData: resourceExplorerData,
    renderResourceExplorer: renderResourceExplorer,
    generateMockFiles: generateMockFiles,
    getFileListHtml: getFileListHtml,
    // 扩展中心：暴露元数据与详情/排序/筛选函数
    extensionsData: extensionsData,
    getSortedFilteredExtensions: getSortedFilteredExtensions,
    getExtensionDetail: getExtensionDetail
  };
})();

/* ==========================================================================
 * 7. DMChat — 聊天交互
 * ========================================================================== */

var DMChat = (function() {
  var replies = [
    { keywords: ['发票', 'invoice'], text: '已查询到 89 张待处理进项发票，正在批量 OCR 识别中。预计 3 分钟完成全部识别，请稍候...' },
    { keywords: ['申报', 'declare'], text: '6 月增值税申报已准备就绪，应纳税额 ¥12,345.00，应退税额 ¥0.00。确认后可一键提交。' },
    { keywords: ['合同', 'contract'], text: '本月即将到期合同 3 份，需续签 2 份。已标记为高风险，建议优先处理。' },
    { keywords: ['记账', 'accounting', '凭证', 'voucher'], text: '6 月记账凭证已生成 45 笔，其中 3 笔需要您确认。请查看凭证列表。' },
    { keywords: ['银行', 'bank', '对账', 'reconcile'], text: '银行对账已完成 3/3 个账户，差异 0 笔。所有流水已自动归类。' },
    { keywords: ['年报', 'annual', '工商', 'business'], text: '工商年报材料准备进度 80%，还缺少社保缴纳证明和审计报告。' },
    { keywords: ['你好', 'hi', 'hello', '嗨'], text: '你好！我是小专快 AI 助手，可以帮你处理记账、税务、工商、银行等企业服务。有什么需要帮忙的吗？' },
    { keywords: [], text: '收到您的指令，正在处理中。处理完成后会通知您结果。' }
  ];

  function getTimeStr() {
    var now = new Date();
    return (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
           (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
  }

  function sendMessage(text) {
    // Hide greeting
    var chatBody = document.querySelector('.dm-col2__chat-body');
    if (chatBody) {
      var greeting = chatBody.querySelector('.dm-col2__greeting');
      if (greeting) greeting.style.display = 'none';
    }

    DMBranch.addMessage({ role: 'user', text: text, time: getTimeStr() });
    DMBranch.appendSingleMessage({ role: 'user', text: text, time: getTimeStr() });
  }

  function simulateReply(userText, delay) {
    delay = delay || 1200;
    var chatBody = document.querySelector('.dm-col2__chat-body');
    if (!chatBody) return;

    // Show typing indicator
    var typingEl = document.createElement('div');
    typingEl.className = 'dm-col2__msg dm-col2__msg--bot dm-col2__msg--typing';
    typingEl.innerHTML = '<div class="dm-col2__msg-avatar"><svg class="dm-icon" width="14" height="14" aria-hidden="true"><use href="#icon-sparkles"/></svg></div><div class="dm-col2__msg-body"><div class="dm-col2__msg-content"><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></div></div>';
    chatBody.appendChild(typingEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Find reply
    var replyText = replies[replies.length - 1].text;
    var lowerText = userText.toLowerCase();
    for (var i = 0; i < replies.length - 1; i++) {
      for (var k = 0; k < replies[i].keywords.length; k++) {
        if (lowerText.indexOf(replies[i].keywords[k].toLowerCase()) >= 0) {
          replyText = replies[i].text;
          break;
        }
      }
      if (replyText !== replies[replies.length - 1].text) break;
    }

    setTimeout(function() {
      if (typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      var msg = { role: 'bot', text: replyText, time: getTimeStr() };
      DMBranch.addMessage(msg);
      DMBranch.appendSingleMessage(msg);
    }, delay);
  }

  return { sendMessage: sendMessage, simulateReply: simulateReply };
})();

/* ==========================================================================
 * 8. DMTheme — 主题切换工具（双模式：light / dark）
 *
 * 通过 <html data-theme="light|dark"> 切换，localStorage 持久化。
 * 详见 docs/desktop-prototype-color-scheme.md
 * ========================================================================== */

var DMTheme = window.DMTheme = (function() {
  var themes = ['light', 'dark'];
  var current = 'dark';
  var STORAGE_KEY = 'dm-theme';

  function set(theme) {
    if (themes.indexOf(theme) < 0) return;
    document.documentElement.setAttribute('data-theme', theme);
    current = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // localStorage 不可用时静默降级（隐私模式等）
    }
  }

  function get() {
    return current;
  }

  function toggle() {
    var idx = themes.indexOf(current);
    set(themes[(idx + 1) % themes.length]);
  }

  function init() {
    // URL 参数 ?theme=light|dark 在 inline 脚本中已处理，此处仅做防御性检查
    try {
      var params = new URLSearchParams(location.search);
      var urlTheme = params.get('theme');
      if (urlTheme && themes.indexOf(urlTheme) >= 0) {
        // inline 脚本已 setAttribute 并写入 localStorage
        current = urlTheme;
        return;
      }
    } catch (e) {
      // URLSearchParams 不可用时跳过
    }

    // localStorage 优先（记忆用户上次选择）
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage 不可用
    }
    if (saved && themes.indexOf(saved) >= 0) {
      set(saved);
      return;
    }
    // 尊重 HTML 静态 data-theme（开发期默认值）
    var htmlTheme = document.documentElement.getAttribute('data-theme');
    if (htmlTheme && themes.indexOf(htmlTheme) >= 0) {
      set(htmlTheme);
      return;
    }
    // 都没配置时才跟随系统偏好
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    set(prefers ? 'dark' : 'light');
  }

  init();

  return { themes: themes, set: set, get: get, toggle: toggle, init: init };
})();
