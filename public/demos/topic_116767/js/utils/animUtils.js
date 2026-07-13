var AnimUtils = (function() {

    function initRippleEffect() {
        document.addEventListener('click', function(e) {
            var target = e.target.closest('.btn-primary, .btn-secondary');
            if (!target) return;

            var rect = target.getBoundingClientRect();
            var ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            var size = Math.max(rect.width, rect.height);
            var x = e.clientX - rect.left - size / 2;
            var y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            target.appendChild(ripple);
            
            setTimeout(function() {
                ripple.remove();
            }, 600);
        });
    }

    function createCelebration(options) {
        options = options || {};
        var overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        
        var canvas = document.createElement('canvas');
        canvas.className = 'celebration-canvas';
        overlay.appendChild(canvas);
        
        var textContent = document.createElement('div');
        textContent.className = 'celebration-text';
        textContent.innerHTML = '\n            <div class="celebration-title">' + (options.title || '太棒了！') + '</div>\n            <div class="celebration-subtitle">' + (options.subtitle || '') + '</div>\n        ';
        overlay.appendChild(textContent);
        
        document.body.appendChild(overlay);
        
        if (window.ParticleSystem) {
            ParticleSystem.init(canvas);
            var centerX = canvas.offsetWidth / 2;
            var centerY = canvas.offsetHeight / 2;
            
            ParticleSystem.burst(centerX, centerY, 30, 'ink');
            ParticleSystem.burst(centerX, centerY, 20, 'gold');
            
            setTimeout(function() {
                ParticleSystem.burst(centerX - 100, centerY + 50, 15, 'ink');
                ParticleSystem.burst(centerX + 100, centerY + 50, 15, 'gold');
            }, 200);
            
            setTimeout(function() {
                ParticleSystem.burst(centerX - 150, centerY, 10, 'ink');
                ParticleSystem.burst(centerX + 150, centerY, 10, 'gold');
            }, 400);
        }
        
        var duration = options.duration || 2500;
        setTimeout(function() {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.remove();
                if (window.ParticleSystem) {
                    ParticleSystem.clear();
                }
            }, 500);
        }, duration);
        
        return overlay;
    }

    function animateStagger(container, selector, delay) {
        delay = delay || 40;
        var items = container.querySelectorAll(selector || '.stagger-item');
        
        items.forEach(function(item, index) {
            setTimeout(function() {
                item.classList.add('visible');
            }, index * delay);
        });
    }

    function triggerNianAction(nianElement, action) {
        if (!nianElement) return;
        
        var actions = ['spin', 'bounce', 'bow'];
        var chosenAction = action || actions[Math.floor(Math.random() * actions.length)];
        
        nianElement.classList.remove('nian-spin', 'nian-bounce', 'nian-bow');
        
        void nianElement.offsetWidth;
        
        nianElement.classList.add('nian-' + chosenAction);
        
        var durations = {
            spin: 1000,
            bounce: 800,
            bow: 1000
        };
        
        setTimeout(function() {
            nianElement.classList.remove('nian-' + chosenAction);
        }, durations[chosenAction] || 1000);
    }

    function changeNianExpression(nianElement, expression) {
        if (!nianElement) return;
        
        var expressions = ['happy', 'confused', 'nervous', 'sleepy', 'expectant', 'idle'];
        var emojiElement = nianElement.querySelector('.nian-emoji');
        
        expressions.forEach(function(expr) {
            nianElement.classList.remove('nian-' + expr);
        });
        
        if (emojiElement) {
            emojiElement.classList.add('nian-emoji-transition');
            setTimeout(function() {
                emojiElement.classList.remove('nian-emoji-transition');
            }, 300);
        }
        
        if (expression && expressions.indexOf(expression) !== -1) {
            nianElement.classList.add('nian-' + expression);
        }
    }

    function showLoading(container, type) {
        if (!container) return;
        type = type || 'spinner';
        
        container.innerHTML = '\n            <div class="loading-state">\n                <div class="loading-' + type + '"></div>\n                <div class="loading-text">加载中...</div>\n            </div>\n        ';
    }

    function showEmptyState(container, options) {
        if (!container) return;
        options = options || {};
        
        var expressions = {
            confused: 'nian-confused',
            expectant: 'nian-happy',
            happy: 'nian-happy',
            sleepy: 'nian-default'
        };
        
        var expression = options.expression || 'confused';
        var iconName = expressions[expression] || 'nian-confused';
        var iconHtml = window.Icons ? Icons.render(iconName) : '';
        
        container.innerHTML = '\n            <div class="empty-state">\n                <div class="empty-state-icon">' + iconHtml + '</div>\n                <div class="empty-state-title">' + (options.title || '暂无数据') + '</div>\n                <div class="empty-state-desc">' + (options.desc || '小管家在这里等你回来哦~') + '</div>\n                ' + (options.actionBtn ? '\n                    <button class="btn-primary">' + options.actionBtn + '</button>\n                ' : '') + '\n            </div>\n        ';
        
        if (options.onAction && options.actionBtn) {
            var btn = container.querySelector('.btn-primary');
            if (btn) {
                btn.addEventListener('click', options.onAction);
            }
        }
    }

    function burstParticlesAtElement(element, count, type) {
        if (!element || !window.ParticleSystem) return;
        
        var rect = element.getBoundingClientRect();
        var canvas = document.querySelector('.celebration-canvas') || 
                     document.querySelector('.hero-particles canvas');
        
        if (!canvas) return;
        
        var canvasRect = canvas.getBoundingClientRect();
        var x = rect.left + rect.width / 2 - canvasRect.left;
        var y = rect.top + rect.height / 2 - canvasRect.top;
        
        ParticleSystem.burst(x, y, count || 20, type || 'ink');
    }

    function animateNumber(element, start, end, duration, callback) {
        duration = duration || 800;
        var startTime = null;
        var isNegative = start < 0;

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function formatNumber(num) {
            if (num >= 10000) {
                return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
            }
            return Math.round(num).toLocaleString();
        }

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var easedProgress = easeOutCubic(progress);
            var current = start + (end - start) * easedProgress;
            
            if (element) {
                element.textContent = formatNumber(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        }
        
        requestAnimationFrame(animate);
    }

    function smoothCollapse(element, duration) {
        duration = duration || 300;
        element.style.height = element.offsetHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.transition = 'height ' + duration + 'ms ease, opacity ' + duration + 'ms ease';
        
        requestAnimationFrame(function() {
            element.style.height = '0';
            element.style.opacity = '0';
        });
        
        setTimeout(function() {
            element.style.display = 'none';
            element.style.height = '';
            element.style.opacity = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    }

    function smoothExpand(element, duration) {
        duration = duration || 300;
        element.style.display = '';
        var height = element.offsetHeight;
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.opacity = '0';
        element.style.transition = 'height ' + duration + 'ms ease, opacity ' + duration + 'ms ease';
        
        requestAnimationFrame(function() {
            element.style.height = height + 'px';
            element.style.opacity = '1';
        });
        
        setTimeout(function() {
            element.style.height = '';
            element.style.opacity = '';
            element.style.overflow = '';
            element.style.transition = '';
        }, duration);
    }

    return {
        initRippleEffect: initRippleEffect,
        createCelebration: createCelebration,
        animateStagger: animateStagger,
        triggerNianAction: triggerNianAction,
        changeNianExpression: changeNianExpression,
        showLoading: showLoading,
        showEmptyState: showEmptyState,
        burstParticlesAtElement: burstParticlesAtElement,
        animateNumber: animateNumber,
        smoothCollapse: smoothCollapse,
        smoothExpand: smoothExpand
    };
})();
