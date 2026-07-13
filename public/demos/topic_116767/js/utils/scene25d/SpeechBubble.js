var SpeechBubble = (function() {
    'use strict';

    var STATE_ICONS = {
        thinking: '🤔',
        work: '💪',
        happy: '😊',
        celebrate: '🎉',
        confused: '😵',
        idle: '💡',
        wave: '👋',
        sleep: '😴',
        point: '👉'
    };

    function SpeechBubble(options) {
        options = options || {};
        this.container = options.container || document.body;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 220;
        this.maxLines = options.maxLines || 3;
        this.typewriterSpeed = options.typewriterSpeed || 60;
        this.state = options.state || null;
        this.autoHideDuration = options.autoHideDuration || 3000;
        this.lowPerformanceMode = options.lowPerformanceMode || false;

        this._element = null;
        this._textEl = null;
        this._stateIconEl = null;
        this._arrowOuterEl = null;
        this._arrowInnerEl = null;
        this._cursorEl = null;
        this._isVisible = false;
        this._isTyping = false;
        this._typewriterTimer = null;
        this._autoHideTimer = null;
        this._fullText = '';
        this._currentTextIndex = 0;
        this._onTypeComplete = null;
        this._onClick = null;
        this._isPaused = false;
    }

    SpeechBubble.prototype.init = function() {
        if (this._element) return;

        this._createDOM();
        this._bindEvents();
    };

    SpeechBubble.prototype._createDOM = function() {
        var bubble = document.createElement('div');
        bubble.className = 'speech-bubble-25d';
        bubble.style.display = 'none';
        bubble.style.opacity = '0';
        bubble.style.transform = 'scale(0.8)';
        bubble.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        bubble.style.position = 'absolute';
        bubble.style.zIndex = '100';
        bubble.style.maxWidth = this.width + 'px';
        bubble.style.minWidth = '80px';
        bubble.style.background = 'linear-gradient(135deg, #FFFEF9 0%, #FAF7F0 100%)';
        bubble.style.border = '2px solid #D4C4A8';
        bubble.style.borderRadius = '16px';
        bubble.style.padding = '10px 14px';
        bubble.style.boxShadow = '0 4px 20px rgba(139, 111, 71, 0.15)';
        bubble.style.cursor = 'pointer';
        bubble.style.fontSize = '13px';
        bubble.style.lineHeight = '1.5';
        bubble.style.color = '#5A4A3A';
        bubble.style.userSelect = 'none';
        bubble.style.willChange = 'transform, opacity';

        var stateIcon = document.createElement('div');
        stateIcon.className = 'speech-bubble-state-icon';
        stateIcon.style.position = 'absolute';
        stateIcon.style.top = '-10px';
        stateIcon.style.left = '10px';
        stateIcon.style.fontSize = '18px';
        stateIcon.style.display = 'none';
        stateIcon.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))';
        bubble.appendChild(stateIcon);
        this._stateIconEl = stateIcon;

        var textWrapper = document.createElement('div');
        textWrapper.style.position = 'relative';
        textWrapper.style.display = 'flex';
        textWrapper.style.alignItems = 'flex-start';
        textWrapper.style.gap = '4px';

        var textEl = document.createElement('span');
        textEl.className = 'speech-bubble-text';
        textEl.style.wordBreak = 'break-word';
        textEl.style.whiteSpace = 'pre-wrap';
        textEl.style.flex = '1';
        textWrapper.appendChild(textEl);
        this._textEl = textEl;

        var cursor = document.createElement('span');
        cursor.className = 'speech-bubble-cursor';
        cursor.style.display = 'none';
        cursor.style.width = '2px';
        cursor.style.height = '14px';
        cursor.style.background = '#8B6F47';
        cursor.style.marginLeft = '2px';
        cursor.style.alignSelf = 'center';
        cursor.style.animation = 'sb-cursor-blink 0.8s step-end infinite';
        textWrapper.appendChild(cursor);
        this._cursorEl = cursor;

        bubble.appendChild(textWrapper);

        var arrow = document.createElement('div');
        arrow.className = 'speech-bubble-arrow';
        arrow.style.position = 'absolute';
        arrow.style.bottom = '-12px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = '10px solid transparent';
        arrow.style.borderRight = '10px solid transparent';
        arrow.style.borderTop = '12px solid #D4C4A8';
        bubble.appendChild(arrow);
        this._arrowOuterEl = arrow;

        var arrowInner = document.createElement('div');
        arrowInner.className = 'speech-bubble-arrow-inner';
        arrowInner.style.position = 'absolute';
        arrowInner.style.bottom = '-9px';
        arrowInner.style.left = '50%';
        arrowInner.style.transform = 'translateX(-50%)';
        arrowInner.style.width = '0';
        arrowInner.style.height = '0';
        arrowInner.style.borderLeft = '8px solid transparent';
        arrowInner.style.borderRight = '8px solid transparent';
        arrowInner.style.borderTop = '10px solid #FFFEF9';
        arrowInner.style.zIndex = '1';
        bubble.appendChild(arrowInner);
        this._arrowInnerEl = arrowInner;

        this._element = bubble;
        this.container.appendChild(bubble);

        this._addKeyframes();

        if (this.state) {
            this.setStateIcon(this.state);
        }

        this.setPosition(this.x, this.y);
    };

    SpeechBubble.prototype._addKeyframes = function() {
        if (document.getElementById('sb-cursor-blink-keyframes')) return;

        var style = document.createElement('style');
        style.id = 'sb-cursor-blink-keyframes';
        style.textContent = '@keyframes sb-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }';
        document.head.appendChild(style);
    };

    SpeechBubble.prototype._bindEvents = function() {
        var self = this;
        if (!this._element) return;

        this._element.addEventListener('click', function(e) {
            e.stopPropagation();
            if (self._isTyping) {
                self._skipTypewriter();
            }
            if (typeof self._onClick === 'function') {
                self._onClick();
            }
        });
    };

    SpeechBubble.prototype.onClick = function(callback) {
        this._onClick = callback;
    };

    SpeechBubble.prototype.setText = function(text, withTypewriter, onComplete) {
        if (!this._element || !this._textEl) return;

        this._fullText = text || '';
        this._currentTextIndex = 0;
        this._onTypeComplete = onComplete || null;

        this._clearTypewriterTimer();

        var useTypewriter = withTypewriter && this._fullText.length > 0 && !this.lowPerformanceMode;

        if (useTypewriter) {
            this._textEl.textContent = '';
            this._cursorEl.style.display = 'inline-block';
            this._isTyping = true;
            this._startTypewriter();
        } else {
            this._textEl.textContent = this._fullText;
            this._cursorEl.style.display = 'none';
            this._isTyping = false;
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }
    };

    SpeechBubble.prototype._startTypewriter = function() {
        var self = this;
        this._typewriterTimer = setTimeout(function type() {
            if (!self._isTyping || !self._textEl) return;

            if (self._currentTextIndex < self._fullText.length) {
                self._textEl.textContent += self._fullText.charAt(self._currentTextIndex);
                self._currentTextIndex++;
                self._typewriterTimer = setTimeout(type, self.typewriterSpeed);
            } else {
                self._finishTypewriter();
            }
        }, this.typewriterSpeed);
    };

    SpeechBubble.prototype._skipTypewriter = function() {
        if (!this._isTyping || !this._textEl) return;

        this._clearTypewriterTimer();
        this._textEl.textContent = this._fullText;
        this._currentTextIndex = this._fullText.length;
        this._finishTypewriter();
    };

    SpeechBubble.prototype._finishTypewriter = function() {
        this._isTyping = false;
        if (this._cursorEl) {
            this._cursorEl.style.display = 'none';
        }
        if (typeof this._onTypeComplete === 'function') {
            var callback = this._onTypeComplete;
            this._onTypeComplete = null;
            callback();
        }
    };

    SpeechBubble.prototype._clearTypewriterTimer = function() {
        if (this._typewriterTimer) {
            clearTimeout(this._typewriterTimer);
            this._typewriterTimer = null;
        }
    };

    SpeechBubble.prototype.setStateIcon = function(state) {
        this.state = state;
        if (!this._stateIconEl) return;

        var icon = STATE_ICONS[state];
        if (icon) {
            this._stateIconEl.textContent = icon;
            this._stateIconEl.style.display = 'block';
        } else {
            this._stateIconEl.style.display = 'none';
        }
    };

    SpeechBubble.prototype.setPosition = function(x, y) {
        this.x = x;
        this.y = y;

        if (!this._element) return;

        var bubbleWidth = this._element.offsetWidth || this.width;
        var bubbleHeight = this._element.offsetHeight || 40;

        var left = x - bubbleWidth / 2;
        var top = y - bubbleHeight - 20;

        if (this.container && this.container.getBoundingClientRect) {
            var containerRect = this.container.getBoundingClientRect();
            var maxLeft = containerRect.width - bubbleWidth - 10;
            var maxTop = containerRect.height - bubbleHeight - 10;

            left = Math.max(10, Math.min(left, maxLeft));
            top = Math.max(10, Math.min(top, maxTop));
        }

        this._element.style.left = left + 'px';
        this._element.style.top = top + 'px';

        if (this._arrowOuterEl && this._arrowInnerEl) {
            var arrowLeft = x - left;
            arrowLeft = Math.max(15, Math.min(arrowLeft, bubbleWidth - 15));
            this._arrowOuterEl.style.left = arrowLeft + 'px';
            this._arrowOuterEl.style.transform = 'translateX(-50%)';
            this._arrowInnerEl.style.left = arrowLeft + 'px';
            this._arrowInnerEl.style.transform = 'translateX(-50%)';
        }
    };

    SpeechBubble.prototype.show = function() {
        var self = this;
        try {
            if (!this._element) {
                this.init();
            }
            if (!this._element) return;

            this._element.style.display = 'block';
            this._isVisible = true;

            if (this.lowPerformanceMode) {
                this._element.style.opacity = '1';
                this._element.style.transform = 'scale(1)';
            } else {
                requestAnimationFrame(function() {
                    if (self._element) {
                        self._element.style.opacity = '1';
                        self._element.style.transform = 'scale(1)';
                    }
                });
            }

            this._resetAutoHide();
        } catch (e) {
            console.error('[SpeechBubble] show error:', e);
        }
    };

    SpeechBubble.prototype.hide = function() {
        var self = this;
        try {
            if (!this._element || !this._isVisible) return;

            this._clearAutoHideTimer();
            this._clearTypewriterTimer();
            this._isTyping = false;

            if (this.lowPerformanceMode) {
                this._element.style.opacity = '0';
            } else {
                this._element.style.opacity = '0';
                this._element.style.transform = 'scale(0.8)';
            }

            var hideDelay = this.lowPerformanceMode ? 150 : 300;
            setTimeout(function() {
                if (self._element && self._isVisible === false) {
                    self._element.style.display = 'none';
                }
            }, hideDelay);

            this._isVisible = false;
        } catch (e) {
            console.error('[SpeechBubble] hide error:', e);
        }
    };

    SpeechBubble.prototype._resetAutoHide = function() {
        var self = this;
        this._clearAutoHideTimer();

        if (this.autoHideDuration > 0) {
            this._autoHideTimer = setTimeout(function() {
                self.hide();
            }, this.autoHideDuration);
        }
    };

    SpeechBubble.prototype._clearAutoHideTimer = function() {
        if (this._autoHideTimer) {
            clearTimeout(this._autoHideTimer);
            this._autoHideTimer = null;
        }
    };

    SpeechBubble.prototype.setAutoHideDuration = function(duration) {
        this.autoHideDuration = duration;
        if (this._isVisible) {
            this._resetAutoHide();
        }
    };

    SpeechBubble.prototype.isVisible = function() {
        return this._isVisible;
    };

    SpeechBubble.prototype.isTyping = function() {
        return this._isTyping;
    };

    SpeechBubble.prototype.getElement = function() {
        return this._element;
    };

    SpeechBubble.prototype.setLowPerformanceMode = function(enabled) {
        this.lowPerformanceMode = enabled;
        if (enabled && this._isTyping) {
            this._skipTypewriter();
        }
    };

    SpeechBubble.prototype.pause = function() {
        if (this._isPaused) return;
        this._isPaused = true;
        this._clearAutoHideTimer();
        this._clearTypewriterTimer();
    };

    SpeechBubble.prototype.resume = function() {
        if (!this._isPaused) return;
        this._isPaused = false;
        if (this._isVisible) {
            this._resetAutoHide();
            if (this._isTyping && this._fullText.length > 0 && !this.lowPerformanceMode) {
                this._startTypewriter();
            }
        }
    };

    SpeechBubble.prototype.destroy = function() {
        this._clearTypewriterTimer();
        this._clearAutoHideTimer();

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this._textEl = null;
        this._stateIconEl = null;
        this._arrowOuterEl = null;
        this._arrowInnerEl = null;
        this._cursorEl = null;
        this._isVisible = false;
        this._isTyping = false;
        this._onClick = null;
        this._onTypeComplete = null;
    };

    return {
        SpeechBubble: SpeechBubble,
        create: function(options) {
            var bubble = new SpeechBubble(options);
            return bubble;
        }
    };
})();
