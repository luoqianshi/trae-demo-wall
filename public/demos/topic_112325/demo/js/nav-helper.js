/**
 * nav-helper.js — 跨域导航兼容脚本
 * 
 * 解决 Chrome 直接打开 file:// 时，iframe 子页面无法访问
 * window.parent.governancePlatform 的问题。
 * 
 * 原理：
 * 1. 优先尝试直接调用 window.parent.governancePlatform.navigate()
 * 2. 如果不可访问（Chrome file:// 跨域），则通过 postMessage 发送导航请求
 * 3. 父页面 layout.js 中监听 message 事件并执行导航
 * 
 * 使用方式：
 *   在子页面中引入此脚本后，使用 govNav(url, breadcrumb, params) 代替
 *   window.parent.governancePlatform.navigate(url, breadcrumb, params)
 */
(function () {
    'use strict';

    var _canDirectAccess = false;

    try {
        // 检测是否能直接访问 parent 的 governancePlatform
        if (window.parent && window.parent.governancePlatform && typeof window.parent.governancePlatform.navigate === 'function') {
            _canDirectAccess = true;
        }
    } catch (e) {
        // DOMException: Blocked a frame with origin "null" from accessing a cross-origin frame
        _canDirectAccess = false;
    }

    /**
     * 统一导航函数 — 自动选择直接调用或 postMessage
     * @param {string} url - 目标页面URL
     * @param {string|Array} breadcrumb - 面包屑
     * @param {object} params - URL参数
     */
    window.govNav = function (url, breadcrumb, params) {
        if (_canDirectAccess) {
            // 直接调用（HTTP 服务器场景）
            window.parent.governancePlatform.navigate(url, breadcrumb, params);
        } else {
            // postMessage fallback（Chrome file:// 场景）
            try {
                window.parent.postMessage({
                    type: 'GOVERNANCE_NAVIGATE',
                    url: url,
                    breadcrumb: breadcrumb,
                    params: params || {}
                }, '*');
            } catch (e) {
                console.error('[govNav] postMessage 失败:', e);
            }
        }
    };

    /**
     * 获取 URL 参数（兼容 getParam）
     * @param {string} key
     * @returns {string|null}
     */
    window.govGetParam = function (key) {
        if (_canDirectAccess && window.parent.governancePlatform.getParam) {
            return window.parent.governancePlatform.getParam(key);
        }
        // fallback: 从自身 URL 读取
        var search = window.location.search.substring(1);
        var pairs = search.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var kv = pairs[i].split('=');
            if (decodeURIComponent(kv[0]) === key) {
                return decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
            }
        }
        return null;
    };

})();

// ====== 全局页面异常状态组件（自动注入，可被页面内自定义状态覆盖） ======
(function () {
    'use strict';

    var _stateInjected = false;

    function injectStateStyles() {
        if (document.getElementById('gov-page-state-styles')) return;
        var style = document.createElement('style');
        style.id = 'gov-page-state-styles';
        style.textContent = [
            '.gov-page-state-overlay { display: none; position: fixed; z-index: 9998; top: 80px; left: 24px; right: 24px; bottom: 24px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 64px 20px; text-align: center; color: #64748b; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }',
            '.gov-page-state-overlay.active { display: flex; flex-direction: column; align-items: center; justify-content: center; }',
            '.gov-page-state-overlay i { font-size: 48px; display: block; margin-bottom: 16px; color: #cbd5e1; }',
            '.gov-page-state-overlay.error i { color: #f59e0b; }',
            '.gov-page-state-overlay.forbidden i { color: #dc2626; }',
            '.gov-page-state-overlay .state-title { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 8px; }',
            '.gov-page-state-overlay .state-action { margin-top: 20px; }',
            '.gov-page-state-overlay .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #1890ff; border-radius: 50%; animation: gov-spin 0.8s linear infinite; margin: 0 auto 16px; }',
            '@keyframes gov-spin { to { transform: rotate(360deg); } }',
            '.gov-page-state-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; background: #fff; color: #374151; }',
            '.gov-page-state-btn.primary { background: #1890ff; border-color: #1890ff; color: #fff; }'
        ].join('\n');
        document.head.appendChild(style);
    }

    function createOverlay(id, icon, title, desc, buttonsHtml) {
        var div = document.createElement('div');
        div.id = id;
        div.className = 'gov-page-state-overlay';
        div.innerHTML = '<i class="fa ' + icon + '"></i>' +
                        '<div class="state-title">' + title + '</div>' +
                        '<div>' + desc + '</div>' +
                        '<div class="state-action">' + buttonsHtml + '</div>';
        return div;
    }

    window.initPageStates = function () {
        if (_stateInjected) return;
        // 若页面已自定义页面级或表格级状态，则不重复注入
        if (document.querySelector('.page-state-overlay, .table-state, .gov-page-state-overlay')) {
            _stateInjected = true;
            return;
        }
        injectStateStyles();
        document.body.appendChild(createOverlay('govStateLoading', 'fa-spinner fa-spin', '数据加载中', '正在加载页面数据，请稍候...', ''));
        document.body.appendChild(createOverlay('govStateEmpty', 'fa-inbox', '暂无数据', '未找到符合条件的数据，请调整查询条件后重试',
            '<button class="gov-page-state-btn primary" onclick="govResetPageQuery()"><i class="fa fa-refresh"></i> 重置条件</button>'));
        document.body.appendChild(createOverlay('govStateError', 'fa-exclamation-circle', '加载失败', '网络异常或服务器繁忙，请检查网络后重试',
            '<button class="gov-page-state-btn primary" onclick="location.reload()"><i class="fa fa-refresh"></i> 重新加载</button>'));
        document.body.appendChild(createOverlay('govStateForbidden', 'fa-lock', '权限不足', '您当前没有访问该页面数据的权限，请联系管理员',
            '<button class="gov-page-state-btn" onclick="history.back()"><i class="fa fa-arrow-left"></i> 返回</button>'));
        _stateInjected = true;
    };

    /**
     * 显示/隐藏全局页面状态
     * @param {string} state - Loading | Empty | Error | Forbidden | ''(隐藏)
     */
    window.showPageState = function (state) {
        var ids = ['govStateLoading', 'govStateEmpty', 'govStateError', 'govStateForbidden'];
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === 'govState' + state);
        });
    };

    /**
     * 占位重置函数：页面可覆盖以实现真实重置逻辑
     */
    window.govResetPageQuery = function () {
        if (typeof showToast === 'function') showToast('已重置查询条件');
        else location.reload();
    };

    // DOM 就绪后自动注入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageStates);
    } else {
        initPageStates();
    }
})();

// ====== 全局showToast函数（统一签名，支持消息类型） ======
// 各页面局部定义的 showToast 会在 nav-helper.js 加载后被此全局函数覆盖，
// 统一支持 showToast(msg) 和 showToast(msg, type) 两种调用方式。
function showToast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast-msg' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('show'); }, 10);
    setTimeout(function() {
        t.classList.remove('show');
        setTimeout(function() { t.remove(); }, 300);
    }, 2000);
}
