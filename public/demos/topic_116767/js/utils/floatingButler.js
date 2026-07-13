var FloatingButler = (function() {
    'use strict';

    var state = {
        currentState: 'default',
        emoji: 'nian-happy',
        tip: '有什么我可以帮你的？',
        tips: [],
        container: null,
        root: null,
        avatar: null,
        avatarIcon: null,
        avatar3dContainer: null,
        bubble: null,
        panel: null,
        panelHeader: null,
        panelBody: null,
        collapseBtn: null,
        use3D: false,
        avatar3d: null,
        onClick: null,
        chatBtn: null,
        unreadBadge: null,
        unreadCount: 0,
        chatInterface: null
    };

    var VALID_STATES = ['default', 'expanded', 'minimized'];
    var EMOJI_TO_EXPRESSION = {
        'nian-happy': 'happy',
        'nian-default': 'default',
        'nian-confused': 'confused',
        'nian-nervous': 'nervous'
    };

    function render(container, options) {
        if (state.root) {
            destroy();
        }

        options = options || {};
        state.emoji = options.emoji || 'nian-happy';
        state.tip = options.tip || '有什么我可以帮你的？';
        state.tips = options.tips || [];
        state.container = container || document.body;
        state.use3D = options.use3D !== false;
        state.onClick = options.onClick || null;

        createElements();
        bindEvents();
        setState('default');
        init3DAvatar();
    }

    function createElements() {
        var root = document.createElement('div');
        root.className = 'floating-butler';
        root.id = 'floating-butler';

        root.innerHTML = `
            <div class="floating-butler-bubble" id="floating-butler-bubble">
                <div class="floating-butler-bubble-text" id="floating-butler-bubble-text"></div>
                <div class="floating-butler-bubble-arrow"></div>
            </div>
            <div class="floating-butler-panel" id="floating-butler-panel">
                <div class="floating-butler-panel-header" id="floating-butler-panel-header">
                    <div class="floating-butler-panel-title">小管家提示</div>
                    <button class="floating-butler-collapse-btn" id="floating-butler-collapse-btn" title="收起">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="floating-butler-panel-body" id="floating-butler-panel-body"></div>
                <div class="floating-butler-panel-footer" id="floating-butler-panel-footer">
                    <button class="floating-butler-chat-btn" id="floating-butler-chat-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>和年年聊聊</span>
                    </button>
                </div>
            </div>
            <button class="floating-butler-avatar" id="floating-butler-avatar" title="小管家">
                <span class="floating-butler-avatar-3d" id="floating-butler-avatar-3d"></span>
                <span class="floating-butler-avatar-icon" id="floating-butler-avatar-icon"></span>
                <span class="floating-butler-unread-badge" id="floating-butler-unread-badge" style="display:none;">0</span>
            </button>
        `;

        state.container.appendChild(root);
        state.root = root;
        state.avatar = root.querySelector('#floating-butler-avatar');
        state.avatarIcon = root.querySelector('#floating-butler-avatar-icon');
        state.avatar3dContainer = root.querySelector('#floating-butler-avatar-3d');
        state.bubble = root.querySelector('#floating-butler-bubble');
        state.panel = root.querySelector('#floating-butler-panel');
        state.panelHeader = root.querySelector('#floating-butler-panel-header');
        state.panelBody = root.querySelector('#floating-butler-panel-body');
        state.collapseBtn = root.querySelector('#floating-butler-collapse-btn');
        state.chatBtn = root.querySelector('#floating-butler-chat-btn');
        state.unreadBadge = root.querySelector('#floating-butler-unread-badge');

        updateAvatar();
        updateBubble();
        updatePanel();
        updateUnreadBadge();
    }

    function init3DAvatar() {
        if (!state.use3D || !state.avatar3dContainer) return;
        if (typeof Nian3DAvatar === 'undefined') {
            console.warn('Nian3DAvatar not available, falling back to SVG');
            return;
        }
        if (!Nian3DAvatar.isSupported()) {
            console.warn('WebGL not supported, falling back to SVG');
            return;
        }

        var expression = EMOJI_TO_EXPRESSION[state.emoji] || 'happy';
        state.avatar3d = Nian3DAvatar.create({
            container: state.avatar3dContainer,
            size: 112,
            expression: expression,
            interactive: true,
            autoRotate: false
        });

        if (state.avatar3d) {
            state.root.classList.add('has-3d-avatar');
        }
    }

    function updateAvatar() {
        if (!state.avatar) return;
        var iconEl = state.avatar.querySelector('#floating-butler-avatar-icon');
        if (iconEl && typeof Icons !== 'undefined' && Icons.render) {
            iconEl.innerHTML = Icons.render(state.emoji, 'floating-butler-emoji');
        }
    }

    function updateBubble() {
        if (!state.bubble) return;
        var textEl = state.bubble.querySelector('#floating-butler-bubble-text');
        if (textEl) {
            textEl.textContent = state.tip;
        }
    }

    function updatePanel() {
        if (!state.panelBody) return;
        var html = '';
        if (state.tips && state.tips.length > 0) {
            html = '<ul class="floating-butler-tips-list">';
            state.tips.forEach(function(tip) {
                html += '<li class="floating-butler-tip-item">';
                if (tip.title) {
                    html += '<div class="floating-butler-tip-title">' + tip.title + '</div>';
                }
                if (tip.content) {
                    html += '<div class="floating-butler-tip-content">' + tip.content + '</div>';
                }
                html += '</li>';
            });
            html += '</ul>';
        } else {
            html = '<div class="floating-butler-empty">暂无提示</div>';
        }
        state.panelBody.innerHTML = html;
    }

    function bindEvents() {
        if (state.avatar) {
            state.avatar.addEventListener('click', onAvatarClick);
        }
        if (state.collapseBtn) {
            state.collapseBtn.addEventListener('click', onCollapseClick);
        }
        if (state.chatBtn) {
            state.chatBtn.addEventListener('click', onChatBtnClick);
        }
        document.addEventListener('click', onDocumentClick);
    }

    function onAvatarClick(e) {
        e.stopPropagation();
        if (typeof state.onClick === 'function') {
            state.onClick(e);
            return;
        }
        if (state.currentState === 'default') {
            setState('expanded');
        } else if (state.currentState === 'expanded') {
            setState('default');
        } else if (state.currentState === 'minimized') {
            setState('default');
        }
    }

    function onCollapseClick(e) {
        e.stopPropagation();
        setState('minimized');
    }

    function onChatBtnClick(e) {
        e.stopPropagation();
        openChat();
    }

    function openChat() {
        if (typeof ChatInterface === 'undefined') {
            console.warn('ChatInterface not available');
            return;
        }

        if (!state.chatInterface) {
            state.chatInterface = ChatInterface;
            ChatInterface.render(document.body, {
                onClose: function() {
                    clearUnread();
                }
            });
        }

        ChatInterface.open();
        clearUnread();
        setState('default');
    }

    function updateUnreadBadge() {
        if (!state.unreadBadge) return;
        if (state.unreadCount > 0) {
            state.unreadBadge.style.display = 'flex';
            state.unreadBadge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
        } else {
            state.unreadBadge.style.display = 'none';
        }
    }

    function setUnreadCount(count) {
        state.unreadCount = Math.max(0, parseInt(count, 10) || 0);
        updateUnreadBadge();
    }

    function incrementUnread() {
        state.unreadCount++;
        updateUnreadBadge();
    }

    function clearUnread() {
        state.unreadCount = 0;
        updateUnreadBadge();
    }

    function onDocumentClick(e) {
        if (state.currentState !== 'expanded') return;
        if (!state.root) return;
        if (!state.root.contains(e.target)) {
            setState('default');
        }
    }

    function setState(newState) {
        if (VALID_STATES.indexOf(newState) === -1) return;

        state.currentState = newState;

        if (!state.root) return;

        state.root.classList.remove('state-default', 'state-expanded', 'state-minimized');
        state.root.classList.add('state-' + newState);
    }

    function updateContent(data) {
        data = data || {};
        if (data.emoji) {
            state.emoji = data.emoji;
            updateAvatar();
            if (state.avatar3d) {
                var expression = EMOJI_TO_EXPRESSION[state.emoji] || 'happy';
                state.avatar3d.setExpression(expression);
            }
        }
        if (data.tip !== undefined) {
            state.tip = data.tip;
            updateBubble();
        }
        if (data.tips) {
            state.tips = data.tips;
            updatePanel();
        }
    }

    function destroy() {
        document.removeEventListener('click', onDocumentClick);

        if (state.avatar3d) {
            state.avatar3d.destroy();
            state.avatar3d = null;
        }

        if (state.chatInterface && typeof state.chatInterface.destroy === 'function') {
            state.chatInterface.destroy();
            state.chatInterface = null;
        }

        if (state.root && state.root.parentNode) {
            state.root.parentNode.removeChild(state.root);
        }

        state.currentState = 'default';
        state.emoji = 'nian-happy';
        state.tip = '有什么我可以帮你的？';
        state.tips = [];
        state.container = null;
        state.root = null;
        state.avatar = null;
        state.avatarIcon = null;
        state.avatar3dContainer = null;
        state.bubble = null;
        state.panel = null;
        state.panelHeader = null;
        state.panelBody = null;
        state.collapseBtn = null;
        state.use3D = false;
        state.chatBtn = null;
        state.unreadBadge = null;
        state.unreadCount = 0;
        state.chatInterface = null;
    }

    return {
        render: render,
        updateContent: updateContent,
        setState: setState,
        destroy: destroy,
        openChat: openChat,
        setUnreadCount: setUnreadCount,
        incrementUnread: incrementUnread,
        clearUnread: clearUnread
    };
})();
