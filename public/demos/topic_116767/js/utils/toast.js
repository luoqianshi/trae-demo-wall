var Toast = (function() {
    var DEFAULT_DURATION = 3000;
    var TOAST_CONTAINER_ID = 'toast-container';
    var toastContainer = null;
    var toastQueue = [];

    var icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    function getContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = TOAST_CONTAINER_ID;
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function createToast(type, message, duration) {
        duration = duration || DEFAULT_DURATION;
        var container = getContainer();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', 'polite');

        toast.innerHTML =
            '<div class="toast-icon">' + icons[type] + '</div>' +
            '<div class="toast-message"></div>' +
            '<button class="toast-close" aria-label="关闭">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>';

        toast.querySelector('.toast-message').textContent = message;

        var closeBtn = toast.querySelector('.toast-close');
        var closeTimer = null;

        function closeToast() {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
            toast.classList.add('toast-leaving');
            toast.addEventListener('transitionend', function onEnd(e) {
                if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
                    toast.removeEventListener('transitionend', onEnd);
                    toast.remove();
                    var index = toastQueue.indexOf(toast);
                    if (index !== -1) {
                        toastQueue.splice(index, 1);
                    }
                }
            });
        }

        closeBtn.addEventListener('click', closeToast);

        toast.addEventListener('mouseenter', function() {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
        });

        toast.addEventListener('mouseleave', function() {
            if (duration > 0) {
                closeTimer = setTimeout(closeToast, duration);
            }
        });

        container.appendChild(toast);
        toastQueue.push(toast);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                toast.classList.add('toast-enter');
            });
        });

        if (duration > 0) {
            closeTimer = setTimeout(closeToast, duration);
        }

        return {
            close: closeToast
        };
    }

    function success(message, duration) {
        return createToast('success', message, duration);
    }

    function warning(message, duration) {
        return createToast('warning', message, duration);
    }

    function error(message, duration) {
        return createToast('error', message, duration);
    }

    function info(message, duration) {
        return createToast('info', message, duration);
    }

    function clearAll() {
        var container = getContainer();
        var toasts = container.querySelectorAll('.toast');
        toasts.forEach(function(toast) {
            toast.classList.add('toast-leaving');
            setTimeout(function() {
                toast.remove();
            }, 300);
        });
        toastQueue = [];
    }

    return {
        success: success,
        warning: warning,
        error: error,
        info: info,
        clearAll: clearAll
    };
})();
