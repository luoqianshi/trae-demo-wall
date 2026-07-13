var NotificationBar = (function() {
    'use strict';

    var TYPE_STYLES = {
        info: {
            bgColor: 'linear-gradient(135deg, #4A6FA5 0%, #5B8C5A 100%)',
            icon: 'ℹ️',
            textColor: '#fff'
        },
        success: {
            bgColor: 'linear-gradient(135deg, #5B8C5A 0%, #6B9C6A 100%)',
            icon: '✅',
            textColor: '#fff'
        },
        warning: {
            bgColor: 'linear-gradient(135deg, #D4A574 0%, #C84A3E 100%)',
            icon: '⚠️',
            textColor: '#fff'
        },
        error: {
            bgColor: 'linear-gradient(135deg, #C84A3E 0%, #A03A30 100%)',
            icon: '❌',
            textColor: '#fff'
        },
        celebrate: {
            bgColor: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            icon: '🎉',
            textColor: '#5A4A3A'
        }
    };

    var _container = null;
    var _notifications = [];
    var _maxNotifications = 3;
    var _zIndexBase = 500;
    var _lowPerformanceMode = false;
    var _isPaused = false;

    function ensureContainer() {
        if (_container) return _container;

        _container = document.createElement('div');
        _container.className = 'notification-bar-container';
        _container.style.position = 'fixed';
        _container.style.top = '0';
        _container.style.left = '0';
        _container.style.right = '0';
        _container.style.zIndex = _zIndexBase;
        _container.style.pointerEvents = 'none';
        _container.style.display = 'flex';
        _container.style.flexDirection = 'column';
        _container.style.alignItems = 'center';
        _container.style.gap = '8px';
        _container.style.paddingTop = 'calc(var(--safe-area-top, 0px) + 12px)';
        _container.style.paddingLeft = '16px';
        _container.style.paddingRight = '16px';

        document.body.appendChild(_container);
        return _container;
    }

    function Notification(options) {
        options = options || {};
        this.message = options.message || '';
        this.type = options.type || 'info';
        this.duration = options.duration || 3000;
        this.onClick = options.onClick || null;
        this.id = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        this._element = null;
        this._timer = null;
        this._isVisible = false;
    }

    Notification.prototype._createElement = function() {
        var style = TYPE_STYLES[this.type] || TYPE_STYLES.info;

        var el = document.createElement('div');
        el.className = 'notification-bar-item';
        el.dataset.id = this.id;
        el.style.background = style.bgColor;
        el.style.color = style.textColor;
        el.style.padding = '12px 20px';
        el.style.borderRadius = '12px';
        el.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        el.style.fontSize = '14px';
        el.style.fontWeight = '500';
        el.style.maxWidth = '400px';
        el.style.width = '100%';
        el.style.textAlign = 'center';
        el.style.cursor = this.onClick ? 'pointer' : 'default';
        el.style.pointerEvents = 'auto';
        el.style.transform = 'translateY(-100%)';
        el.style.opacity = '0';
        if (_lowPerformanceMode) {
            el.style.transition = 'opacity 0.15s ease';
        } else {
            el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
            el.style.willChange = 'transform, opacity';
        }
        if (!_lowPerformanceMode) {
            el.style.backdropFilter = 'blur(10px)';
        }

        var content = document.createElement('div');
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.gap = '8px';

        var iconSpan = document.createElement('span');
        iconSpan.className = 'notification-icon';
        iconSpan.textContent = style.icon;
        iconSpan.style.fontSize = '16px';
        iconSpan.style.flexShrink = '0';
        content.appendChild(iconSpan);

        var textSpan = document.createElement('span');
        textSpan.className = 'notification-text';
        textSpan.textContent = this.message;
        textSpan.style.flex = '1';
        textSpan.style.wordBreak = 'break-word';
        content.appendChild(textSpan);

        el.appendChild(content);

        var self = this;
        el.addEventListener('click', function() {
            if (typeof self.onClick === 'function') {
                self.onClick();
            }
            self.hide();
        });

        this._element = el;
        return el;
    };

    Notification.prototype.show = function() {
        var self = this;
        var container = ensureContainer();

        if (!this._element) {
            this._createElement();
        }

        container.insertBefore(this._element, container.firstChild);

        if (_lowPerformanceMode) {
            this._element.style.transform = 'translateY(0)';
            this._element.style.opacity = '1';
        } else {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    if (self._element) {
                        self._element.style.transform = 'translateY(0)';
                        self._element.style.opacity = '1';
                    }
                });
            });
        }

        this._isVisible = true;

        if (this.duration > 0 && !_isPaused) {
            this._timer = setTimeout(function() {
                self.hide();
            }, this.duration);
        }
    };

    Notification.prototype.hide = function() {
        var self = this;
        if (!this._element || !this._isVisible) return;

        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }

        if (_lowPerformanceMode) {
            this._element.style.opacity = '0';
        } else {
            this._element.style.transform = 'translateY(-100%)';
            this._element.style.opacity = '0';
        }

        var hideDelay = _lowPerformanceMode ? 150 : 300;
        setTimeout(function() {
            if (self._element && self._element.parentNode) {
                self._element.parentNode.removeChild(self._element);
            }
            self._element = null;
            self._isVisible = false;

            var idx = _notifications.indexOf(self);
            if (idx !== -1) {
                _notifications.splice(idx, 1);
            }
        }, hideDelay);
    };

    Notification.prototype.destroy = function() {
        this.hide();
        this.onClick = null;
    };

    function show(message, type, duration, onClick) {
        if (_notifications.length >= _maxNotifications) {
            var oldest = _notifications[_notifications.length - 1];
            if (oldest) {
                oldest.hide();
            }
        }

        var notif = new Notification({
            message: message,
            type: type || 'info',
            duration: duration !== undefined ? duration : 3000,
            onClick: onClick || null
        });

        _notifications.push(notif);
        notif.show();

        return notif;
    }

    function hideAll() {
        var copies = _notifications.slice();
        for (var i = 0; i < copies.length; i++) {
            copies[i].hide();
        }
        _notifications = [];
    }

    function setMaxNotifications(max) {
        _maxNotifications = max;
    }

    function getNotificationCount() {
        return _notifications.length;
    }

    function setLowPerformanceMode(enabled) {
        _lowPerformanceMode = enabled;
    }

    function pause() {
        if (_isPaused) return;
        _isPaused = true;
        for (var i = 0; i < _notifications.length; i++) {
            if (_notifications[i]._timer) {
                clearTimeout(_notifications[i]._timer);
                _notifications[i]._timer = null;
            }
        }
    }

    function resume() {
        if (!_isPaused) return;
        _isPaused = false;
        for (var i = 0; i < _notifications.length; i++) {
            var notif = _notifications[i];
            if (notif.duration > 0 && notif._isVisible && !notif._timer) {
                (function(n) {
                    n._timer = setTimeout(function() {
                        n.hide();
                    }, n.duration);
                })(notif);
            }
        }
    }

    return {
        Notification: Notification,
        show: show,
        hideAll: hideAll,
        setMaxNotifications: setMaxNotifications,
        getNotificationCount: getNotificationCount,
        setLowPerformanceMode: setLowPerformanceMode,
        pause: pause,
        resume: resume
    };
})();
