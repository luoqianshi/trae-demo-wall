var OnboardingGuide = (function() {
    'use strict';

    var STORAGE_KEY = 'onboarding_guide_completed';
    var CURRENT_VERSION = '1.0.0';

    var state = {
        isActive: false,
        currentStepIndex: 0,
        steps: [],
        timers: [],
        resizeTimer: null
    };

    var elements = {
        overlay: null,
        maskTop: null,
        maskBottom: null,
        maskLeft: null,
        maskRight: null,
        spotlightCircle: null,
        tooltip: null,
        tooltipArrow: null,
        tooltipTitle: null,
        tooltipDesc: null,
        stepIndicator: null,
        skipBtn: null,
        prevBtn: null,
        nextBtn: null,
        nianAvatar: null,
        gestureHand: null
    };

    var GUIDE_STEPS = [
        {
            id: 'welcome',
            title: '欢迎来到「我的宝贝房子」',
            description: '我是你的专属装修小管家年年，接下来我会带你快速了解核心功能，让我们一起打造理想中的家吧~',
            target: null,
            position: 'center',
            showNian: true,
            shape: 'none'
        },
        {
            id: 'scene25d',
            title: '2.5D 可视化家',
            description: '这是你的专属 2.5D 家！装修流程每推进一步，家里就会多一件新物件。点击不同区域还可以和年年互动哦~',
            target: '#home-scene-25d-container, .home-scene-25d-container, #home-scene-container, .home-scene-container',
            position: 'top',
            padding: 16,
            shape: 'rect'
        },
        {
            id: 'level-exp',
            title: '等级与经验系统',
            description: '完成装修步骤、每日任务、解锁成就都能获得经验值。等级越高，解锁的功能和奖励越多哦~',
            target: '.home-level-badge, .home-level-info',
            position: 'bottom',
            padding: 12,
            shape: 'rect'
        },
        {
            id: 'achievements',
            title: '成就系统',
            description: '装修路上的每一个里程碑都会被记录下来！解锁成就不仅有经验奖励，还能收集稀有徽章~',
            target: '#home-achievement-btn, .home-action-btn.tertiary:nth-of-type(2)',
            position: 'top',
            padding: 8,
            shape: 'rect'
        },
        {
            id: 'daily-tasks',
            title: '每日任务',
            description: '每天来完成小任务，轻松获取经验值和奖励。坚持打卡还能解锁连续签到奖励哦！',
            target: '#home-daily-tasks-btn, .home-action-btn.tertiary:nth-of-type(1)',
            position: 'top',
            padding: 8,
            shape: 'rect'
        },
        {
            id: 'sop-entry',
            title: '装修流程 SOP',
            description: '点击「去装修」进入 23 步标准化装修流程。从设计到入住，年年全程陪跑，让装修不再头疼！',
            target: '#home-go-sop-btn, .home-action-btn.primary',
            position: 'top',
            padding: 12,
            shape: 'rect',
            highlightPulse: true
        },
        {
            id: 'first-step',
            title: '开始你的第一步',
            description: '准备好了吗？点击「去装修」按钮，开启你的装修之旅吧！年年会一直陪着你~',
            target: '#home-go-sop-btn, .home-action-btn.primary',
            position: 'top',
            padding: 12,
            shape: 'rect',
            isFinal: true,
            actionBtn: '开始装修'
        }
    ];

    function addTimer(timerId) {
        state.timers.push(timerId);
        return timerId;
    }

    function clearAllTimers() {
        state.timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
        });
        state.timers = [];
        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = null;
        }
    }

    function isCompleted() {
        var saved = Storage.load(STORAGE_KEY);
        return saved && saved.completed && saved.version === CURRENT_VERSION;
    }

    function markCompleted() {
        Storage.save(STORAGE_KEY, {
            completed: true,
            version: CURRENT_VERSION,
            completedAt: Date.now()
        });
    }

    function reset() {
        Storage.remove(STORAGE_KEY);
    }

    function shouldShow() {
        if (isCompleted()) return false;
        var cultivationData = window.CultivationData;
        if (cultivationData && typeof cultivationData.getStat === 'function') {
            var totalSteps = cultivationData.getStat('totalStepsCompleted');
            if (totalSteps > 0) return false;
        }
        return true;
    }

    function createOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'obg-overlay';
        overlay.id = 'obg-overlay';
        overlay.innerHTML = `
            <div class="obg-mask obg-mask-top"></div>
            <div class="obg-mask obg-mask-bottom"></div>
            <div class="obg-mask obg-mask-left"></div>
            <div class="obg-mask obg-mask-right"></div>
            <div class="obg-spotlight-circle" id="obg-spotlight-circle"></div>
            <div class="obg-gesture-hand" id="obg-gesture-hand">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 11V6a2 2 0 0 0-4 0v5"></path>
                    <path d="M14 10V4a2 2 0 0 0-4 0v6"></path>
                    <path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path>
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
                </svg>
            </div>
            <div class="obg-tooltip" id="obg-tooltip">
                <div class="obg-tooltip-arrow"></div>
                <div class="obg-tooltip-content">
                    <div class="obg-nian-avatar" id="obg-nian-avatar">
                        <img src="images/nian-icons/nian-happy.png" alt="年年" />
                    </div>
                    <div class="obg-tooltip-body">
                        <div class="obg-tooltip-title" id="obg-tooltip-title"></div>
                        <div class="obg-tooltip-desc" id="obg-tooltip-desc"></div>
                        <div class="obg-tooltip-footer">
                            <button class="obg-skip-btn" id="obg-skip-btn">跳过</button>
                            <div class="obg-step-indicator" id="obg-step-indicator"></div>
                            <div class="obg-nav-buttons">
                                <button class="btn-secondary obg-prev-btn" id="obg-prev-btn">上一步</button>
                                <button class="btn-primary obg-next-btn" id="obg-next-btn">下一步</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        elements.overlay = overlay;
        elements.maskTop = overlay.querySelector('.obg-mask-top');
        elements.maskBottom = overlay.querySelector('.obg-mask-bottom');
        elements.maskLeft = overlay.querySelector('.obg-mask-left');
        elements.maskRight = overlay.querySelector('.obg-mask-right');
        elements.spotlightCircle = overlay.querySelector('#obg-spotlight-circle');
        elements.tooltip = overlay.querySelector('#obg-tooltip');
        elements.tooltipArrow = overlay.querySelector('.obg-tooltip-arrow');
        elements.tooltipTitle = overlay.querySelector('#obg-tooltip-title');
        elements.tooltipDesc = overlay.querySelector('#obg-tooltip-desc');
        elements.stepIndicator = overlay.querySelector('#obg-step-indicator');
        elements.skipBtn = overlay.querySelector('#obg-skip-btn');
        elements.prevBtn = overlay.querySelector('#obg-prev-btn');
        elements.nextBtn = overlay.querySelector('#obg-next-btn');
        elements.nianAvatar = overlay.querySelector('#obg-nian-avatar');
        elements.gestureHand = overlay.querySelector('#obg-gesture-hand');
    }

    function bindEvents() {
        if (elements.skipBtn) {
            elements.skipBtn.addEventListener('click', skip);
        }
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', prevStep);
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', nextStep);
        }

        document.addEventListener('keydown', handleKeydown);
        window.addEventListener('resize', handleResize);
    }

    function unbindEvents() {
        document.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('resize', handleResize);
    }

    function handleKeydown(e) {
        if (!state.isActive) return;

        if (e.key === 'Escape') {
            skip();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            nextStep();
        } else if (e.key === 'ArrowLeft') {
            prevStep();
        }
    }

    function handleResize() {
        if (!state.isActive) return;
        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
        }
        state.resizeTimer = setTimeout(function() {
            if (state.isActive && state.steps[state.currentStepIndex]) {
                updateSpotlight(state.currentStepIndex);
            }
        }, 100);
    }

    function getVisibleElementRects(selector) {
        if (!selector) return null;

        var selectors = selector.split(',');
        var minLeft = Infinity;
        var minTop = Infinity;
        var maxRight = -Infinity;
        var maxBottom = -Infinity;
        var hasVisible = false;
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;

        for (var s = 0; s < selectors.length; s++) {
            var sel = selectors[s].trim();
            var targets = document.querySelectorAll(sel);
            if (!targets || targets.length === 0) continue;

            for (var i = 0; i < targets.length; i++) {
                var rect = targets[i].getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) continue;

                var visibleLeft = Math.max(rect.left, 0);
                var visibleTop = Math.max(rect.top, 0);
                var visibleRight = Math.min(rect.right, viewportWidth);
                var visibleBottom = Math.min(rect.bottom, viewportHeight);
                var visibleWidth = visibleRight - visibleLeft;
                var visibleHeight = visibleBottom - visibleTop;

                if (visibleWidth <= 0 || visibleHeight <= 0) continue;

                var visibleAreaRatio = (visibleWidth * visibleHeight) / (rect.width * rect.height);
                if (visibleAreaRatio < 0.3) continue;

                if (rect.left < minLeft) minLeft = rect.left;
                if (rect.top < minTop) minTop = rect.top;
                if (rect.right > maxRight) maxRight = rect.right;
                if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                hasVisible = true;
            }
        }

        if (!hasVisible) return null;

        return {
            left: minLeft,
            top: minTop,
            right: maxRight,
            bottom: maxBottom,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };
    }

    function scrollToTarget(selector) {
        if (!selector) return;
        var selectors = selector.split(',');
        for (var i = 0; i < selectors.length; i++) {
            var target = document.querySelector(selectors[i].trim());
            if (target) {
                var rect = target.getBoundingClientRect();
                var isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                if (!isVisible) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
                break;
            }
        }
    }

    function updateSpotlight(index) {
        if (!state.isActive) return;

        var step = state.steps[index];
        if (!step) return;

        if (elements.tooltipTitle) {
            elements.tooltipTitle.textContent = step.title || '';
        }
        if (elements.tooltipDesc) {
            elements.tooltipDesc.textContent = step.description || '';
        }
        if (elements.stepIndicator) {
            elements.stepIndicator.textContent = (index + 1) + ' / ' + state.steps.length;
        }

        if (elements.prevBtn) {
            if (index === 0) {
                elements.prevBtn.style.opacity = '0.5';
                elements.prevBtn.style.pointerEvents = 'none';
            } else {
                elements.prevBtn.style.opacity = '1';
                elements.prevBtn.style.pointerEvents = 'auto';
            }
        }

        if (elements.nextBtn) {
            if (index === state.steps.length - 1) {
                elements.nextBtn.textContent = step.actionBtn || '完成';
            } else {
                elements.nextBtn.textContent = '下一步';
            }
        }

        if (elements.nianAvatar) {
            if (step.showNian) {
                elements.nianAvatar.style.display = 'flex';
            } else {
                elements.nianAvatar.style.display = 'none';
            }
        }

        if (elements.tooltip) {
            elements.tooltip.classList.remove('show');
        }

        if (step.shape === 'none' || !step.target) {
            hideMasks();
            hideSpotlightCircle();
            hideGesture();
            positionTooltipCenter();
            return;
        }

        var rects = getVisibleElementRects(step.target);
        if (!rects) {
            hideMasks();
            hideSpotlightCircle();
            hideGesture();
            positionTooltipCenter();
            return;
        }

        scrollToTarget(step.target);

        var padding = step.padding || 12;
        var left = rects.left - padding;
        var top = rects.top - padding;
        var width = rects.width + padding * 2;
        var height = rects.height + padding * 2;

        if (step.shape === 'circle') {
            showSpotlightCircle(left, top, width, height);
            hideMasks();
        } else {
            showMasks(left, top, width, height);
            hideSpotlightCircle();
        }

        if (step.highlightPulse) {
            showGesture(left + width / 2, top + height / 2);
        } else {
            hideGesture();
        }

        positionTooltip(step.position || 'bottom', left, top, width, height);
    }

    function hideMasks() {
        if (elements.maskTop) elements.maskTop.style.height = '0';
        if (elements.maskBottom) {
            elements.maskBottom.style.top = '100%';
            elements.maskBottom.style.height = '0';
        }
        if (elements.maskLeft) {
            elements.maskLeft.style.width = '0';
            elements.maskLeft.style.height = '0';
        }
        if (elements.maskRight) {
            elements.maskRight.style.width = '0';
            elements.maskRight.style.height = '0';
        }
    }

    function showMasks(left, top, width, height) {
        if (elements.maskTop) {
            elements.maskTop.style.height = top + 'px';
        }
        if (elements.maskBottom) {
            elements.maskBottom.style.top = (top + height) + 'px';
            elements.maskBottom.style.height = (window.innerHeight - top - height) + 'px';
        }
        if (elements.maskLeft) {
            elements.maskLeft.style.top = top + 'px';
            elements.maskLeft.style.width = left + 'px';
            elements.maskLeft.style.height = height + 'px';
        }
        if (elements.maskRight) {
            elements.maskRight.style.top = top + 'px';
            elements.maskRight.style.left = (left + width) + 'px';
            elements.maskRight.style.width = (window.innerWidth - left - width) + 'px';
            elements.maskRight.style.height = height + 'px';
        }
    }

    function hideSpotlightCircle() {
        if (elements.spotlightCircle) {
            elements.spotlightCircle.style.display = 'none';
        }
    }

    function showSpotlightCircle(left, top, width, height) {
        if (!elements.spotlightCircle) return;

        var diameter = Math.max(width, height);
        var cx = left + width / 2;
        var cy = top + height / 2;
        var circleLeft = cx - diameter / 2;
        var circleTop = cy - diameter / 2;

        elements.spotlightCircle.style.display = 'block';
        elements.spotlightCircle.style.left = circleLeft + 'px';
        elements.spotlightCircle.style.top = circleTop + 'px';
        elements.spotlightCircle.style.width = diameter + 'px';
        elements.spotlightCircle.style.height = diameter + 'px';
    }

    function hideGesture() {
        if (elements.gestureHand) {
            elements.gestureHand.style.display = 'none';
        }
    }

    function showGesture(x, y) {
        if (!elements.gestureHand) return;
        elements.gestureHand.style.display = 'block';
        elements.gestureHand.style.left = (x - 16) + 'px';
        elements.gestureHand.style.top = (y - 16) + 'px';
    }

    function positionTooltip(position, targetLeft, targetTop, targetWidth, targetHeight) {
        if (!elements.tooltip) return;

        elements.tooltip.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right', 'pos-center');

        var isMobile = window.innerWidth <= 767;
        var tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 380;
        var tooltipHeight = isMobile ? 200 : 180;
        var gap = 16;

        var cx = targetLeft + targetWidth / 2;
        var cy = targetTop + targetHeight / 2;

        var tooltipLeft, tooltipTop;

        var spaceTop = targetTop - gap;
        var spaceBottom = window.innerHeight - (targetTop + targetHeight) - gap;
        var spaceLeft = targetLeft - gap;
        var spaceRight = window.innerWidth - (targetLeft + targetWidth) - gap;

        var finalPosition = position;

        if (position === 'top' || position === 'bottom') {
            if (position === 'bottom' && spaceBottom < tooltipHeight) {
                if (spaceTop >= tooltipHeight) {
                    finalPosition = 'top';
                } else if (spaceRight >= tooltipWidth || spaceLeft >= tooltipWidth) {
                    finalPosition = spaceRight >= spaceLeft ? 'right' : 'left';
                }
            } else if (position === 'top' && spaceTop < tooltipHeight) {
                if (spaceBottom >= tooltipHeight) {
                    finalPosition = 'bottom';
                } else if (spaceRight >= tooltipWidth || spaceLeft >= tooltipWidth) {
                    finalPosition = spaceRight >= spaceLeft ? 'right' : 'left';
                }
            }
        } else if (position === 'left' || position === 'right') {
            if ((position === 'right' && spaceRight < tooltipWidth) ||
                (position === 'left' && spaceLeft < tooltipWidth)) {
                if (spaceBottom >= tooltipHeight || spaceTop >= tooltipHeight) {
                    finalPosition = spaceBottom >= spaceTop ? 'bottom' : 'top';
                }
            }
        }

        switch (finalPosition) {
            case 'top':
                tooltipTop = targetTop - tooltipHeight - gap;
                tooltipLeft = cx - tooltipWidth / 2;
                elements.tooltip.classList.add('pos-bottom');
                break;
            case 'bottom':
            default:
                tooltipTop = targetTop + targetHeight + gap;
                tooltipLeft = cx - tooltipWidth / 2;
                elements.tooltip.classList.add('pos-top');
                break;
            case 'left':
                tooltipTop = cy - tooltipHeight / 2;
                tooltipLeft = targetLeft - tooltipWidth - gap;
                elements.tooltip.classList.add('pos-right');
                break;
            case 'right':
                tooltipTop = cy - tooltipHeight / 2;
                tooltipLeft = targetLeft + targetWidth + gap;
                elements.tooltip.classList.add('pos-left');
                break;
        }

        var padding = 16;
        tooltipLeft = Math.max(padding, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - padding));
        tooltipTop = Math.max(60, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));

        elements.tooltip.style.width = tooltipWidth + 'px';
        elements.tooltip.style.top = tooltipTop + 'px';
        elements.tooltip.style.left = tooltipLeft + 'px';
        
        requestAnimationFrame(function() {
            if (elements.tooltip) {
                elements.tooltip.classList.add('show');
            }
        });
    }

    function positionTooltipCenter() {
        if (!elements.tooltip) return;

        elements.tooltip.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right');
        elements.tooltip.classList.add('pos-center');

        var isMobile = window.innerWidth <= 767;
        var tooltipWidth = isMobile ? Math.min(340, window.innerWidth - 32) : 400;

        elements.tooltip.style.width = tooltipWidth + 'px';
        elements.tooltip.style.left = '50%';
        elements.tooltip.style.top = '50%';
        elements.tooltip.style.transform = '';
        
        requestAnimationFrame(function() {
            if (elements.tooltip) {
                elements.tooltip.classList.add('show');
            }
        });
    }

    function showStep(index) {
        if (index < 0 || index >= state.steps.length) return;

        state.currentStepIndex = index;
        var step = state.steps[index];

        if (step.beforeShow && typeof step.beforeShow === 'function') {
            try {
                step.beforeShow();
            } catch (e) {
                console.warn('[OnboardingGuide] beforeShow error:', e);
            }
        }

        addTimer(setTimeout(function() {
            updateSpotlight(index);
        }, 50));
    }

    function nextStep() {
        if (state.currentStepIndex < state.steps.length - 1) {
            state.currentStepIndex++;
            showStep(state.currentStepIndex);
        } else {
            complete();
        }
    }

    function prevStep() {
        if (state.currentStepIndex > 0) {
            state.currentStepIndex--;
            showStep(state.currentStepIndex);
        }
    }

    function skip() {
        complete();
    }

    function complete() {
        if (!state.isActive) return;

        state.isActive = false;
        clearAllTimers();
        markCompleted();

        if (elements.overlay) {
            elements.overlay.classList.remove('active');
        }

        hideGesture();
        unbindEvents();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('onboarding:guideCompleted', {});
        }

        setTimeout(function() {
            if (elements.overlay && elements.overlay.parentNode) {
                elements.overlay.parentNode.removeChild(elements.overlay);
            }
            Object.keys(elements).forEach(function(key) {
                elements[key] = null;
            });
        }, 300);
    }

    function buildSteps() {
        var steps = GUIDE_STEPS.map(function(step) {
            return Object.assign({}, step);
        });
        return steps;
    }

    function start(options) {
        if (state.isActive) return;

        options = options || {};

        if (options.force !== true && isCompleted()) {
            return false;
        }

        if (!elements.overlay) {
            createOverlay();
            bindEvents();
        }

        state.isActive = true;
        state.currentStepIndex = 0;
        state.steps = buildSteps();

        if (elements.overlay) {
            requestAnimationFrame(function() {
                elements.overlay.classList.add('active');
            });
        }

        addTimer(setTimeout(function() {
            showStep(0);
        }, 200));

        return true;
    }

    function init() {
        if (shouldShow()) {
            if (typeof EventBus !== 'undefined') {
                EventBus.on(EventBus.EVENTS.VIEW_CHANGED, function(data) {
                    if (data && data.view === 'home' && state.isActive === false) {
                        var saved = Storage.load(STORAGE_KEY);
                        if (!saved || !saved.completed) {
                            addTimer(setTimeout(function() {
                                start();
                            }, 1500));
                        }
                    }
                });

                EventBus.on(EventBus.EVENTS.APP_INITIALIZED, function() {
                    if (App && App.state && App.state.currentView === 'home') {
                        addTimer(setTimeout(function() {
                            if (shouldShow()) {
                                start();
                            }
                        }, 2000));
                    }
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        start: start,
        skip: skip,
        reset: reset,
        isCompleted: isCompleted,
        shouldShow: shouldShow
    };
})();
