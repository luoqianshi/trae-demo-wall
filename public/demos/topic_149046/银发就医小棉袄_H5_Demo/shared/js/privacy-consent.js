/**
 * 银发就医小棉袄 - 隐私授权弹窗（软授权）SilverPrivacy
 * data-trae-gen="true"
 * @trae-review-status: reviewed
 *
 * 用途：首次使用时展示隐私政策摘要，获取用户"软授权"（非强制）。
 *       遵循 PIPL（个人信息保护法）合规要求。
 *
 * 设计原则：
 *   - 软授权：用户拒绝时不阻止使用，但标记为"未授权"状态（部分功能受限）
 *   - 用户同意后记录 localStorage，不再重复弹出
 *   - 撤回授权后重新弹出授权弹窗
 *   - ESC 键不关闭弹窗（必须明确选择"同意"或"暂不同意"）
 *   - 点击遮罩空白处不关闭（强制用户主动选择）
 *
 * 纯 HTML5+CSS3+原生 JS，零依赖，零 npm，零构建，支持 file:// 协议。
 * 挂载到 window.SilverPrivacy 命名空间。
 *
 * 用法：
 *   // 页面加载时自动初始化（已内置 DOMContentLoaded 监听）
 *   // 也可手动调用：
 *   SilverPrivacy.init();
 *   SilverPrivacy.show({ force: true });
 *   SilverPrivacy.isGranted();        // true / false
 *   SilverPrivacy.getStatus();        // 'granted' | 'denied' | 'pending'
 *   SilverPrivacy.revoke();           // 撤回授权并重新弹出
 */
(function () {
  'use strict';

  /* @trae-review-status: reviewed */

  // ============ 常量 ============
  var STORAGE_KEY = 'silvercare_privacy_consent';
  var STATUS_GRANTED = 'granted';
  var STATUS_DENIED = 'denied';
  var STATUS_PENDING = 'pending';
  var AUTO_SHOW_DELAY_MS = 1000;       // 首次使用延迟 1 秒后自动弹出

  // ============ 模块私有状态 ============
  var overlay = null;                  // 弹窗遮罩 DOM
  var banner = null;                   // 未授权状态底部提示条 DOM
  var autoShowTimer = null;            // 延迟自动弹出定时器
  var callbacks = { onConsent: null, onDeny: null };

  // ============ 隐私政策内容 ============

  // 政策摘要条目（弹窗中展示）
  var POLICY_SUMMARY = [
    { icon: '📋', title: '数据收集说明', desc: '我们收集您的就诊录音、健康记录，用于生成医嘱摘要' },
    { icon: '🔒', title: '数据存储', desc: '所有数据存储在您的设备本地（localStorage），不会上传到云端（Demo阶段）' },
    { icon: '🎯', title: '数据用途', desc: '仅用于生成就诊摘要和健康提醒，不会用于其他目的' },
    { icon: '👥', title: '第三方共享', desc: '仅在您主动分享时，将摘要发送给您指定的家人' },
    { icon: '📞', title: '您的权利', desc: '您有权随时撤回授权、删除所有数据（设置→重置数据）' },
    { icon: '⚖️', title: '法律依据', desc: '依据《个人信息保护法》第13条、第18条' }
  ];

  // 完整隐私政策文本（点击"查看完整隐私政策"后展开）
  var FULL_POLICY = [
    '一、我们收集的信息：就诊录音（临时存储，72小时后自动删除）、AI生成的就诊摘要（仅您本人可见）、服药记录（仅用于用药提醒）、健康日志与自测数据。',
    '二、数据存储与安全：Demo阶段所有数据存储在您设备的 localStorage 中，不上传云端、不用于AI训练、不出售给第三方。数据清除后不可恢复。',
    '三、数据使用目的：生成就诊摘要、用药提醒、健康趋势分析。不会用于商业营销或其他无关目的。',
    '四、第三方共享：仅在您主动发起"分享给家人"操作时，将就诊摘要共享给您指定的家庭成员，录音文件不会共享。',
    '五、您的权利：依据《个人信息保护法》第44-50条，您享有知情权、决定权、查阅复制权、更正补充权、删除权、撤回同意权。您可随时在"设置→重置数据"清除所有数据，或调用 SilverPrivacy.revoke() 撤回授权。',
    '六、紧急情况例外：依据《个人信息保护法》第18条，为保护您或他人生命健康，在紧急情况下可绕过授权处理个人信息，事后30天内补充确认。',
    '七、儿童信息：本产品面向老年群体，不主动收集未成年人个人信息。',
    '八、政策更新：隐私政策更新时将重新弹出授权弹窗，您可再次选择是否同意。'
  ];

  // ============ 工具函数 ============

  /**
   * 读取授权记录。
   * @returns {{status:string, timestamp:number}|null}
   */
  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (obj && (obj.status === STATUS_GRANTED || obj.status === STATUS_DENIED)) {
        return obj;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 写入授权记录。
   */
  function saveConsent(status) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        status: status,
        timestamp: Date.now()
      }));
    } catch (e) {
      // localStorage 不可用时静默失败（file:// 协议部分浏览器限制）
    }
  }

  /**
   * 清除授权记录。
   */
  function clearConsent() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  // ============ 状态查询 API ============

  /**
   * 获取授权状态。
   * @returns {'granted'|'denied'|'pending'}
   */
  function getStatus() {
    var c = getConsent();
    if (!c) return STATUS_PENDING;
    return c.status;
  }

  /**
   * 是否已授权（同意）。
   * @returns {boolean}
   */
  function isGranted() {
    return getStatus() === STATUS_GRANTED;
  }

  // ============ DOM 构建 ============

  /**
   * 构建弹窗 DOM 并绑定事件。
   */
  function buildModal(options) {
    overlay = document.createElement('div');
    overlay.className = 'privacy-consent-overlay';
    overlay.setAttribute('data-trae-gen', 'true');

    var modal = document.createElement('div');
    modal.className = 'privacy-consent-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pcm-title');

    // 政策摘要条目 HTML
    var summaryHtml = POLICY_SUMMARY.map(function (item) {
      return '<li class="pcm-item">' +
        '<span class="pcm-item-icon" aria-hidden="true">' + item.icon + '</span>' +
        '<span class="pcm-item-text"><span class="pcm-item-title">' + item.title + '</span>' +
        '<span class="pcm-item-desc">' + item.desc + '</span></span>' +
        '</li>';
    }).join('');

    // 完整政策文本 HTML
    var fullPolicyHtml = FULL_POLICY.map(function (p) {
      return '<p class="pcm-full-policy-line">' + p + '</p>';
    }).join('');

    modal.innerHTML =
      '<div class="pcm-icon" aria-hidden="true">🔒</div>' +
      '<h2 class="pcm-title" id="pcm-title">隐私保护说明</h2>' +
      '<p class="pcm-intro">为了给您提供就诊摘要服务，我们需要您了解并授权以下信息：</p>' +
      '<ul class="pcm-body pcm-summary">' + summaryHtml + '</ul>' +
      '<a href="javascript:void(0)" class="pcm-link" id="pcm-toggle-policy" role="button" aria-expanded="false">查看完整隐私政策</a>' +
      '<div class="pcm-full-policy" id="pcm-full-policy" hidden>' + fullPolicyHtml + '</div>' +
      '<button type="button" class="pcm-btn-primary" id="pcm-agree">同意并开始使用</button>' +
      '<button type="button" class="pcm-btn-secondary" id="pcm-deny">暂不同意</button>' +
      '<p class="pcm-legal-basis">依据《个人信息保护法》第13条、第18条</p>';

    overlay.appendChild(modal);

    // 事件绑定
    modal.querySelector('#pcm-agree').addEventListener('click', handleAgree);
    modal.querySelector('#pcm-deny').addEventListener('click', handleDeny);
    modal.querySelector('#pcm-toggle-policy').addEventListener('click', toggleFullPolicy);

    // 不绑定遮罩点击关闭、不绑定 ESC 关闭（强制用户明确选择）
    return overlay;
  }

  /**
   * 切换"完整隐私政策"展开/收起。
   */
  function toggleFullPolicy() {
    var link = overlay.querySelector('#pcm-toggle-policy');
    var panel = overlay.querySelector('#pcm-full-policy');
    if (!link || !panel) return;

    var expanded = link.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      panel.setAttribute('hidden', '');
      link.setAttribute('aria-expanded', 'false');
      link.textContent = '查看完整隐私政策';
    } else {
      panel.removeAttribute('hidden');
      link.setAttribute('aria-expanded', 'true');
      link.textContent = '收起完整隐私政策';
    }
  }

  // ============ 未授权状态提示条 ============

  /**
   * 显示页面底部"未授权"提示条（denied 状态）。
   */
  function showBanner() {
    hideBanner();
    if (!document.body) return;
    banner = document.createElement('div');
    banner.className = 'privacy-unauthorized-banner';
    banner.setAttribute('data-trae-gen', 'true');
    banner.innerHTML =
      '<span class="pub-icon" aria-hidden="true">⚠️</span>' +
      '<span class="pub-text">未授权状态：部分功能受限</span>' +
      '<a href="javascript:void(0)" class="pub-link" role="button">重新授权</a>';
    document.body.appendChild(banner);
    banner.querySelector('.pub-link').addEventListener('click', function () {
      show({ force: true });
    });
  }

  /**
   * 隐藏"未授权"提示条。
   */
  function hideBanner() {
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
      banner = null;
    }
  }

  // ============ 事件处理 ============

  function handleAgree() {
    saveConsent(STATUS_GRANTED);
    hideBanner();
    var cb = callbacks.onConsent;
    hide();
    if (typeof cb === 'function') cb();
  }

  function handleDeny() {
    saveConsent(STATUS_DENIED);
    var cb = callbacks.onDeny;
    hide();
    showBanner();
    if (typeof cb === 'function') cb();
  }

  // ============ 公共 API ============

  /**
   * 显示授权弹窗。
   * @param {Object} [options]
   *   {boolean} options.force - 强制弹出（即使已 granted 也弹出）
   *   {Function} options.onConsent - 用户同意后的回调
   *   {Function} options.onDeny - 用户拒绝后的回调
   */
  function show(options) {
    options = options || {};
    callbacks.onConsent = typeof options.onConsent === 'function' ? options.onConsent : null;
    callbacks.onDeny = typeof options.onDeny === 'function' ? options.onDeny : null;

    // 已授权且未强制 → 不弹出
    if (!options.force && getStatus() === STATUS_GRANTED) return;

    // 若已有弹窗展示，先移除
    if (overlay) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
    }

    if (!document.body) return;

    buildModal(options);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  /**
   * 隐藏授权弹窗（保留授权状态不变）。
   */
  function hide() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    if (document.body) document.body.style.overflow = '';
  }

  /**
   * 撤回授权：清除授权记录并重新弹出授权弹窗。
   */
  function revoke() {
    clearConsent();
    hideBanner();
    show({ force: true });
  }

  /**
   * 初始化：页面加载时检查授权状态。
   *   - pending：延迟 1 秒后自动弹出授权弹窗
   *   - granted：不做任何展示
   *   - denied：显示页面底部"未授权"提示条
   */
  function init() {
    if (typeof window === 'undefined' || !window.document) return;
    if (!document.body) return;
    if (typeof localStorage === 'undefined') return;

    var status = getStatus();

    if (status === STATUS_PENDING) {
      // 首次使用：延迟 1 秒后自动弹出
      if (autoShowTimer) clearTimeout(autoShowTimer);
      autoShowTimer = setTimeout(function () {
        autoShowTimer = null;
        // 再次确认仍为 pending（避免期间已选择）
        if (getStatus() === STATUS_PENDING) {
          show();
        }
      }, AUTO_SHOW_DELAY_MS);
    } else if (status === STATUS_DENIED) {
      showBanner();
    }
    // granted：无操作
  }

  // ============ 自动初始化（页面加载时） ============
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else if (document.body) {
      init();
    }
  }

  // ============ 暴露 API ============
  window.SilverPrivacy = {
    init: init,
    show: show,
    hide: hide,
    isGranted: isGranted,
    revoke: revoke,
    getStatus: getStatus,
    // 暴露常量便于测试与外部集成
    _constants: {
      STORAGE_KEY: STORAGE_KEY,
      AUTO_SHOW_DELAY_MS: AUTO_SHOW_DELAY_MS,
      STATUS: {
        GRANTED: STATUS_GRANTED,
        DENIED: STATUS_DENIED,
        PENDING: STATUS_PENDING
      }
    }
  };
})();
