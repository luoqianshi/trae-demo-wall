var ChatInterface = (function() {
    'use strict';

    var state = {
        container: null,
        root: null,
        header: null,
        messageList: null,
        inputArea: null,
        input: null,
        sendBtn: null,
        quickQuestions: null,
        isOpen: false,
        isTyping: false,
        typingTimer: null,
        unreadCount: 0,
        onClose: null
    };

    var TYPING_SPEED = 30;
    var TYPING_DELAY = 500;

    function render(container, options) {
        if (state.root) {
            destroy();
        }

        options = options || {};
        state.container = container || document.body;
        state.onClose = options.onClose || null;

        createElements();
        bindEvents();
        addWelcomeMessage();
    }

    function createElements() {
        var root = document.createElement('div');
        root.className = 'chat-interface';
        root.id = 'chat-interface';

        root.innerHTML = `
            <div class="chat-interface-header" id="chat-interface-header">
                <div class="chat-interface-header-left">
                    <div class="chat-interface-avatar">
                        <span class="chat-interface-avatar-icon">年</span>
                    </div>
                    <div class="chat-interface-header-info">
                        <div class="chat-interface-title">年年小管家</div>
                        <div class="chat-interface-status">
                            <span class="chat-interface-status-dot"></span>
                            <span class="chat-interface-status-text">在线</span>
                        </div>
                    </div>
                </div>
                <button class="chat-interface-close-btn" id="chat-interface-close-btn" title="关闭">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="chat-interface-messages" id="chat-interface-messages"></div>
            <div class="chat-interface-quick-questions" id="chat-interface-quick-questions"></div>
            <div class="chat-interface-input-area" id="chat-interface-input-area">
                <div class="chat-interface-input-wrapper">
                    <textarea 
                        class="chat-interface-input" 
                        id="chat-interface-input" 
                        placeholder="输入你的问题..."
                        rows="1"
                    ></textarea>
                </div>
                <button class="chat-interface-send-btn" id="chat-interface-send-btn" title="发送">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;

        state.container.appendChild(root);
        state.root = root;
        state.header = root.querySelector('#chat-interface-header');
        state.messageList = root.querySelector('#chat-interface-messages');
        state.inputArea = root.querySelector('#chat-interface-input-area');
        state.input = root.querySelector('#chat-interface-input');
        state.sendBtn = root.querySelector('#chat-interface-send-btn');
        state.quickQuestions = root.querySelector('#chat-interface-quick-questions');
    }

    function bindEvents() {
        var closeBtn = state.root.querySelector('#chat-interface-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', onCloseClick);
        }

        if (state.sendBtn) {
            state.sendBtn.addEventListener('click', onSendClick);
        }

        if (state.input) {
            state.input.addEventListener('keydown', onInputKeydown);
            state.input.addEventListener('input', onInputInput);
            state.input.addEventListener('focus', onInputFocus);
        }
    }

    function onCloseClick(e) {
        e.stopPropagation();
        close();
        if (typeof state.onClose === 'function') {
            state.onClose();
        }
    }

    function onSendClick(e) {
        e.stopPropagation();
        sendMessage();
    }

    function onInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function onInputInput(e) {
        adjustInputHeight();
    }

    function onInputFocus(e) {
        scrollToBottom();
    }

    function adjustInputHeight() {
        if (!state.input) return;
        state.input.style.height = 'auto';
        state.input.style.height = Math.min(state.input.scrollHeight, 120) + 'px';
    }

    function sendMessage() {
        if (state.isTyping) return;

        var text = state.input ? state.input.value.trim() : '';
        if (!text) return;

        addUserMessage(text);
        state.input.value = '';
        adjustInputHeight();

        updateQuickQuestions();

        setTimeout(function() {
            showTypingIndicator();
            setTimeout(function() {
                hideTypingIndicator();
                var response = AiAssistant.generateResponse(text);
                addAssistantMessage(response.text);
            }, TYPING_DELAY + text.length * 10);
        }, 300);
    }

    function addUserMessage(text) {
        if (!state.messageList) return;

        var msgEl = createMessageElement('user', text);
        state.messageList.appendChild(msgEl);
        scrollToBottom();
    }

    function addAssistantMessage(text) {
        if (!state.messageList) return;

        var msgEl = createMessageElement('assistant', '');
        state.messageList.appendChild(msgEl);

        var contentEl = msgEl.querySelector('.chat-message-content');
        typeText(contentEl, text, function() {
            state.isTyping = false;
            updateQuickQuestions();
        });

        scrollToBottom();
    }

    function addWelcomeMessage() {
        if (!state.messageList) return;

        var welcomeText = '你好呀！我是你的装修小管家年年~ 🏠\n\n关于装修的任何问题都可以问我，比如：\n• 装修预算怎么规划？\n• 装修流程有哪些步骤？\n• 材料选购要注意什么？\n\n快来和我聊聊吧~';

        var msgEl = createMessageElement('assistant', '');
        state.messageList.appendChild(msgEl);

        var contentEl = msgEl.querySelector('.chat-message-content');
        typeText(contentEl, welcomeText, function() {
            state.isTyping = false;
            updateQuickQuestions();
        });
    }

    function createMessageElement(role, text) {
        var msgEl = document.createElement('div');
        msgEl.className = 'chat-message chat-message-' + role;

        var time = formatTime(new Date());

        if (role === 'assistant') {
            msgEl.innerHTML = `
                <div class="chat-message-avatar">
                    <span class="chat-message-avatar-icon">年</span>
                </div>
                <div class="chat-message-bubble">
                    <div class="chat-message-content">${escapeHtml(text)}</div>
                    <div class="chat-message-time">${time}</div>
                </div>
            `;
        } else {
            msgEl.innerHTML = `
                <div class="chat-message-bubble">
                    <div class="chat-message-content">${escapeHtml(text)}</div>
                    <div class="chat-message-time">${time}</div>
                </div>
                <div class="chat-message-avatar">
                    <span class="chat-message-avatar-icon">我</span>
                </div>
            `;
        }

        return msgEl;
    }

    function typeText(element, text, callback) {
        state.isTyping = true;
        var index = 0;
        var length = text.length;

        function type() {
            if (index < length) {
                var char = text.charAt(index);
                if (char === '\n') {
                    element.innerHTML += '<br>';
                } else {
                    element.innerHTML += escapeHtml(char);
                }
                index++;
                scrollToBottom();
                state.typingTimer = setTimeout(type, TYPING_SPEED);
            } else {
                state.isTyping = false;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }

        type();
    }

    function showTypingIndicator() {
        if (!state.messageList) return;

        var indicator = document.createElement('div');
        indicator.className = 'chat-message chat-message-assistant chat-message-typing';
        indicator.id = 'chat-message-typing';
        indicator.innerHTML = `
            <div class="chat-message-avatar">
                <span class="chat-message-avatar-icon">年</span>
            </div>
            <div class="chat-message-bubble">
                <div class="chat-typing-indicator">
                    <span class="chat-typing-dot"></span>
                    <span class="chat-typing-dot"></span>
                    <span class="chat-typing-dot"></span>
                </div>
            </div>
        `;

        state.messageList.appendChild(indicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        var indicator = document.getElementById('chat-message-typing');
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    function updateQuickQuestions() {
        if (!state.quickQuestions || typeof AiAssistant === 'undefined') return;

        var questions = AiAssistant.getQuickQuestions();
        if (!questions || questions.length === 0) {
            state.quickQuestions.style.display = 'none';
            return;
        }

        state.quickQuestions.style.display = '';

        var html = '<div class="chat-quick-questions-list">';
        for (var i = 0; i < questions.length; i++) {
            html += '<button class="chat-quick-question-btn" data-question="' + escapeHtml(questions[i]) + '">';
            html += escapeHtml(questions[i]);
            html += '</button>';
        }
        html += '</div>';

        state.quickQuestions.innerHTML = html;

        var btns = state.quickQuestions.querySelectorAll('.chat-quick-question-btn');
        for (var j = 0; j < btns.length; j++) {
            btns[j].addEventListener('click', onQuickQuestionClick);
        }
    }

    function onQuickQuestionClick(e) {
        e.stopPropagation();
        var btn = e.currentTarget;
        var question = btn.getAttribute('data-question');
        if (question && state.input) {
            state.input.value = question;
            sendMessage();
        }
    }

    function scrollToBottom() {
        if (!state.messageList) return;
        state.messageList.scrollTop = state.messageList.scrollHeight;
    }

    function formatTime(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        return (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function open() {
        if (!state.root) return;
        state.root.classList.add('open');
        state.isOpen = true;
        state.unreadCount = 0;
        updateQuickQuestions();
        setTimeout(scrollToBottom, 100);
    }

    function close() {
        if (!state.root) return;
        state.root.classList.remove('open');
        state.isOpen = false;
    }

    function toggle() {
        if (state.isOpen) {
            close();
        } else {
            open();
        }
    }

    function getUnreadCount() {
        return state.unreadCount;
    }

    function destroy() {
        if (state.typingTimer) {
            clearTimeout(state.typingTimer);
            state.typingTimer = null;
        }

        if (state.root && state.root.parentNode) {
            state.root.parentNode.removeChild(state.root);
        }

        state.container = null;
        state.root = null;
        state.header = null;
        state.messageList = null;
        state.inputArea = null;
        state.input = null;
        state.sendBtn = null;
        state.quickQuestions = null;
        state.isOpen = false;
        state.isTyping = false;
        state.typingTimer = null;
        state.unreadCount = 0;
        state.onClose = null;
    }

    return {
        render: render,
        open: open,
        close: close,
        toggle: toggle,
        getUnreadCount: getUnreadCount,
        destroy: destroy
    };
})();
