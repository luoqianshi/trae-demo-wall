var OnboardingTour = (function() {
    var STORAGE_PREFIX = 'onboarding_tour_completed_';

    var timers = [];

    function addTimer(timerId) {
        timers.push(timerId);
        return timerId;
    }

    function clearAllTimers() {
        timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
        });
        timers = [];
    }

    var state = {
        isActive: false,
        currentStepIndex: 0,
        steps: [],
        tourId: null,
        onCompleteCallback: null,
        resizeListenerAdded: false
    };

    var elements = {
        overlay: null,
        maskTop: null,
        maskBottom: null,
        maskLeft: null,
        maskRight: null,
        tooltip: null,
        tooltipTitle: null,
        tooltipDesc: null,
        stepIndicator: null,
        skipBtn: null,
        prevBtn: null,
        nextBtn: null
    };

    function isTourCompleted(tourId) {
        return Storage.load(STORAGE_PREFIX + tourId) === true;
    }

    function markTourCompleted(tourId) {
        Storage.save(STORAGE_PREFIX + tourId, true);
    }

    function resetTour(tourId) {
        Storage.remove(STORAGE_PREFIX + tourId);
    }

    function init() {
        createOverlay();
        bindEvents();
    }

    function createOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.id = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-mask onboarding-mask-top"></div>
            <div class="onboarding-mask onboarding-mask-bottom"></div>
            <div class="onboarding-mask onboarding-mask-left"></div>
            <div class="onboarding-mask onboarding-mask-right"></div>
            <div class="onboarding-tooltip" id="onboarding-tooltip">
                <div class="onboarding-tooltip-arrow"></div>
                <div class="onboarding-tooltip-content">
                    <div class="onboarding-tooltip-title" id="onboarding-tooltip-title"></div>
                    <div class="onboarding-tooltip-desc" id="onboarding-tooltip-desc"></div>
                    <div class="onboarding-tooltip-footer">
                        <button class="onboarding-skip-btn" id="onboarding-skip-btn">跳过</button>
                        <div class="onboarding-step-indicator" id="onboarding-step-indicator"></div>
                        <div class="onboarding-nav-buttons">
                            <button class="btn-secondary onboarding-prev-btn" id="onboarding-prev-btn">上一步</button>
                            <button class="btn-primary onboarding-next-btn" id="onboarding-next-btn">下一步</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        elements.overlay = overlay;
        elements.maskTop = overlay.querySelector('.onboarding-mask-top');
        elements.maskBottom = overlay.querySelector('.onboarding-mask-bottom');
        elements.maskLeft = overlay.querySelector('.onboarding-mask-left');
        elements.maskRight = overlay.querySelector('.onboarding-mask-right');
        elements.tooltip = overlay.querySelector('.onboarding-tooltip');
        elements.tooltipTitle = overlay.querySelector('#onboarding-tooltip-title');
        elements.tooltipDesc = overlay.querySelector('#onboarding-tooltip-desc');
        elements.stepIndicator = overlay.querySelector('#onboarding-step-indicator');
        elements.skipBtn = overlay.querySelector('#onboarding-skip-btn');
        elements.prevBtn = overlay.querySelector('#onboarding-prev-btn');
        elements.nextBtn = overlay.querySelector('#onboarding-next-btn');
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
    }

    function handleResize() {
        if (state.isActive) {
            var step = state.steps[state.currentStepIndex];
            var target = document.querySelector(step.target);
            if (target) {
                updateSpotlight(state.currentStepIndex, step, target);
            }
        }
    }

    function start(tourId, steps, options) {
        if (!steps || steps.length === 0) return;
        if (isTourCompleted(tourId)) return;

        state.tourId = tourId;
        state.steps = steps;
        state.currentStepIndex = 0;
        state.isActive = true;
        state.onCompleteCallback = options && options.onComplete ? options.onComplete : null;

        if (!elements.overlay) {
            init();
        }

        if (!state.resizeListenerAdded) {
            window.addEventListener('resize', handleResize);
            state.resizeListenerAdded = true;
        }

        elements.overlay.classList.add('active');

        addTimer(setTimeout(function() {
            showStep(0);
        }, 100));
    }

    function scrollToTarget(target) {
        if (!target) return;

        var rect = target.getBoundingClientRect();
        var isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

        if (!isVisible) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }

    function showStep(index) {
        if (index < 0 || index >= state.steps.length) return;

        state.currentStepIndex = index;
        var step = state.steps[index];

        var target = document.querySelector(step.target);
        if (!target) {
            console.warn('[OnboardingTour] Step', index, 'target not found:', step.target, '- skipping');
            nextStep();
            return;
        }

        scrollToTarget(target);

        addTimer(setTimeout(function() {
            updateSpotlight(index, step, target);
        }, 350));
    }

    function updateSpotlight(index, step, target) {
        if (!state.isActive) return;

        var rect = target.getBoundingClientRect();
        var padding = step.padding || 12;

        var left = rect.left - padding;
        var top = rect.top - padding;
        var width = rect.width + padding * 2;
        var height = rect.height + padding * 2;

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

        if (elements.tooltipTitle && step.title) {
            elements.tooltipTitle.textContent = step.title;
        }
        if (elements.tooltipDesc && step.description) {
            elements.tooltipDesc.textContent = step.description;
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
                elements.nextBtn.textContent = '完成';
            } else {
                elements.nextBtn.textContent = '下一步';
            }
        }

        positionTooltip(step.position || 'bottom', left, top, width, height);
    }

    function positionTooltip(position, targetLeft, targetTop, targetWidth, targetHeight) {
        if (!elements.tooltip) return;

        elements.tooltip.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right');

        var tooltipWidth = 320;
        var tooltipHeight = 200;
        var gap = 16;

        var cx = targetLeft + targetWidth / 2;
        var cy = targetTop + targetHeight / 2;

        var tooltipLeft, tooltipTop;

        switch (position) {
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
        tooltipTop = Math.max(80, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));

        elements.tooltip.style.top = tooltipTop + 'px';
        elements.tooltip.style.left = tooltipLeft + 'px';

        elements.tooltip.classList.add('show');
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

        clearAllTimers();

        if (state.tourId) {
            markTourCompleted(state.tourId);
        }

        state.isActive = false;

        window.removeEventListener('resize', handleResize);

        if (elements.overlay) {
            elements.overlay.classList.remove('active');
            elements.tooltip.classList.remove('show');

            if (elements.maskTop) {
                elements.maskTop.style.height = '';
            }
            if (elements.maskBottom) {
                elements.maskBottom.style.top = '';
                elements.maskBottom.style.height = '';
            }
            if (elements.maskLeft) {
                elements.maskLeft.style.top = '';
                elements.maskLeft.style.width = '';
                elements.maskLeft.style.height = '';
            }
            if (elements.maskRight) {
                elements.maskRight.style.top = '';
                elements.maskRight.style.left = '';
                elements.maskRight.style.width = '';
                elements.maskRight.style.height = '';
            }
        }

        if (typeof state.onCompleteCallback === 'function') {
            state.onCompleteCallback();
        }

        state.steps = [];
        state.tourId = null;
        state.currentStepIndex = 0;
        state.onCompleteCallback = null;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        start: start,
        reset: resetTour,
        isCompleted: isTourCompleted
    };
})();
