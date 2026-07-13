var DemoGuide = (function() {
    var state = {
        isPlaying: false,
        isPaused: false,
        currentStepIndex: 0,
        progress: 0,
        scriptSteps: [],
        timers: [],
        originalState: null,
        mockData: {},
        playbackSpeed: 1,
        onboardingCancelled: false,
        consecutiveErrors: 0,
        maxConsecutiveErrors: 5,
        resizeTimer: null
    };

    function addTimer(timerId) {
        state.timers.push(timerId);
        return timerId;
    }

    var elements = {
        fab: null,
        progressBar: null,
        progressFill: null,
        progressTooltip: null,
        spotlightOverlay: null,
        spotlightCircle: null,
        spotlightTooltip: null,
        centerTooltip: null,
        clickBlocker: null,
        controlHint: null,
        pauseOverlay: null
    };

    var CHAPTERS = [
        { id: 1, name: '开场', startProgress: 0, endProgress: 10 },
        { id: 2, name: '我的家', startProgress: 10, endProgress: 35 },
        { id: 3, name: '装修流程', startProgress: 35, endProgress: 50 },
        { id: 4, name: '预算管理', startProgress: 50, endProgress: 65 },
        { id: 5, name: '更多', startProgress: 65, endProgress: 90 },
        { id: 6, name: '开始', startProgress: 90, endProgress: 100 }
    ];

    function buildScript() {
        return [
            // ===== 第1章：开场 =====
            {
                chapter: 1,
                delay: 200,
                action: function(done) {
                    App.switchView('hero');
                    setTimeout(done, 300);
                },
                spotlight: null,
                narration: '欢迎来到「我的宝贝房子」！1分钟快速了解你的专属装修管家~',
                progress: 5,
                holdTime: 3500
            },
            // ===== 第2章：我的家 =====
            {
                chapter: 2,
                delay: 200,
                action: function(done) {
                    ensureCompleteUserData();
                    ensureHomeProgress();
                    App.switchView('home');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.home-scene-container, #home-scene-container, .home-scene-25d-container',
                    position: 'bottom',
                    padding: 24,
                    shape: 'rect'
                },
                narration: '2.5D可视化家，SOP推进一步，家就成长一分',
                progress: 20,
                holdTime: 7000
            },
            {
                chapter: 2,
                delay: 200,
                action: function(done) {
                    done();
                },
                spotlight: {
                    selector: '.home-nian, #home-nian, .home-nian-wrapper, .home-level-badge, [class*=level-badge]',
                    position: 'top',
                    padding: 20,
                    shape: 'circle'
                },
                narration: '小管家年年全程陪伴，见证你从小白到首席管家的蜕变',
                progress: 35,
                holdTime: 5000
            },
            // ===== 第3章：装修流程 =====
            {
                chapter: 3,
                delay: 200,
                action: function(done) {
                    ensureSopStepsCompleted('F-1');
                    App.switchView('sop');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.sop-step-nav, .sop-side-panel',
                    position: 'right',
                    padding: 12,
                    shape: 'rect'
                },
                narration: '23步标准化装修流程，从设计到入住全程陪跑',
                progress: 50,
                holdTime: 5000
            },
            // ===== 第4章：预算管理 =====
            {
                chapter: 4,
                delay: 200,
                action: function(done) {
                    closeAllModals();
                    ensureBudgetPlan();
                    App.switchView('budget');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.coin-progress-card, .budget-overview, [class*=budget-card]',
                    position: 'right',
                    padding: 16,
                    shape: 'rect'
                },
                narration: '智能预算管理，每一分钱都清清楚楚',
                progress: 65,
                holdTime: 5000
            },
            // ===== 第5章：更多 =====
            {
                chapter: 5,
                delay: 200,
                action: function(done) {
                    App.switchView('tools');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.tools-grid, .tool-list, [class*=tool]',
                    position: 'bottom',
                    padding: 12,
                    shape: 'rect'
                },
                narration: '多种实用装修工具，随时可用',
                progress: 75,
                holdTime: 3000
            },
            {
                chapter: 5,
                delay: 200,
                action: function(done) {
                    App.switchView('knowledge');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.knowledge-list, .knowledge-grid, [class*=knowledge]',
                    position: 'bottom',
                    padding: 12,
                    shape: 'rect'
                },
                narration: '装修知识百科，小白也能变专家',
                progress: 88,
                holdTime: 3000
            },
            // ===== 第6章：开始 =====
            {
                chapter: 6,
                delay: 200,
                action: function(done) {
                    ensureHomeProgress();
                    App.switchView('home');
                    setTimeout(done, 300);
                },
                spotlight: {
                    selector: '.home-action-area, #home-go-sop-btn, .home-action-btn.primary',
                    position: 'bottom',
                    padding: 20,
                    shape: 'rect'
                },
                narration: '准备好了吗？点击开始，打造你理想中的家',
                progress: 100,
                holdTime: 7000
            }
        ];
    }

    function init() {
        createFAB();
        createProgressBar();
        createSpotlight();
        createCenterTooltip();
        createPauseOverlay();
        createClickBlocker();
        createControlHint();
        bindEvents();
        checkUrlParam();
    }

    function createFAB() {
        var fab = document.createElement('button');
        fab.className = 'demo-fab';
        fab.innerHTML = `
            <span class="demo-fab-icon">${Icons.render('clapperboard')}</span>
            <span class="demo-fab-text">演示</span>
        `;
        fab.title = '功能演示';
        fab.id = 'demo-fab';
        document.body.appendChild(fab);
        elements.fab = fab;
    }

    function createProgressBar() {
        var bar = document.createElement('div');
        bar.className = 'demo-progress-bar';
        bar.id = 'demo-progress-bar';
        bar.style.display = 'none';
        bar.innerHTML = `
            <div class="demo-progress-bar-fill" id="demo-progress-fill"></div>
            <div class="demo-progress-tooltip" id="demo-progress-tooltip">开场Hook</div>
        `;
        document.body.appendChild(bar);
        elements.progressBar = bar;
        elements.progressFill = bar.querySelector('.demo-progress-bar-fill');
        elements.progressTooltip = bar.querySelector('.demo-progress-tooltip');
    }

    function createSpotlight() {
        var overlay = document.createElement('div');
        overlay.className = 'demo-spotlight-overlay';
        overlay.id = 'demo-spotlight-overlay';
        overlay.innerHTML = `
            <div class="demo-spotlight-mask demo-spotlight-mask-top"></div>
            <div class="demo-spotlight-mask demo-spotlight-mask-bottom"></div>
            <div class="demo-spotlight-mask demo-spotlight-mask-left"></div>
            <div class="demo-spotlight-mask demo-spotlight-mask-right"></div>
            <div class="demo-spotlight-circle" id="demo-spotlight-circle"></div>
            <div class="demo-spotlight-tooltip" id="demo-spotlight-tooltip">
                <div class="demo-chapter-label" id="demo-chapter-label"></div>
                <div class="demo-tooltip-text" id="demo-tooltip-text"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        elements.spotlightOverlay = overlay;
        elements.spotlightCircle = overlay.querySelector('.demo-spotlight-circle');
        elements.spotlightTooltip = overlay.querySelector('.demo-spotlight-tooltip');
    }

    function createCenterTooltip() {
        var tooltip = document.createElement('div');
        tooltip.className = 'demo-center-tooltip';
        tooltip.id = 'demo-center-tooltip';
        tooltip.innerHTML = `
            <div class="demo-center-chapter" id="demo-center-chapter"></div>
            <div class="demo-center-text" id="demo-center-text"></div>
        `;
        document.body.appendChild(tooltip);
        elements.centerTooltip = tooltip;
    }

    function createPauseOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'demo-pause-overlay';
        overlay.id = 'demo-pause-overlay';
        overlay.innerHTML = `
            <div class="demo-pause-content">
                <div class="demo-pause-icon">${Icons.render('pause')}</div>
                <div class="demo-pause-title">演示暂停</div>
                <div class="demo-pause-desc">选择章节或调整设置后继续</div>
                
                <div class="demo-pause-section">
                    <div class="demo-pause-section-title">播放速度</div>
                    <div class="demo-speed-controls">
                        <button class="demo-speed-btn" data-speed="0.5">0.5x</button>
                        <button class="demo-speed-btn active" data-speed="1">1x</button>
                        <button class="demo-speed-btn" data-speed="1.5">1.5x</button>
                        <button class="demo-speed-btn" data-speed="2">2x</button>
                    </div>
                </div>
                
                <div class="demo-pause-section">
                    <div class="demo-pause-section-title">选择章节</div>
                    <div class="demo-chapter-selector">
                        ${CHAPTERS.map(function(ch) {
                            return `<button class="demo-chapter-btn" data-chapter="${ch.id}">
                                <span class="demo-chapter-num">第${ch.id}章</span>
                                <span class="demo-chapter-name">${ch.name}</span>
                            </button>`;
                        }).join('')}
                    </div>
                </div>
                
                <div class="demo-pause-step-controls">
                    <button class="demo-step-btn" id="demo-prev-step-btn" title="上一步">
                        ${Icons.render('chevron-left')}
                    </button>
                    <span class="demo-step-indicator" id="demo-step-indicator">0 / 0</span>
                    <button class="demo-step-btn" id="demo-next-step-btn" title="下一步">
                        ${Icons.render('chevron-right')}
                    </button>
                </div>
                
                <div class="demo-pause-actions">
                    <button class="btn-secondary" id="demo-home-btn">返回首页</button>
                    <button class="btn-secondary" id="demo-stop-btn">退出演示</button>
                    <button class="btn-primary" id="demo-resume-btn">继续演示</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        elements.pauseOverlay = overlay;
    }

    function createClickBlocker() {
        var blocker = document.createElement('div');
        blocker.className = 'demo-click-blocker';
        blocker.id = 'demo-click-blocker';
        blocker.style.display = 'none';
        document.body.appendChild(blocker);
        elements.clickBlocker = blocker;
    }

    function createControlHint() {
        var hint = document.createElement('div');
        hint.className = 'demo-control-hint';
        hint.id = 'demo-control-hint';
        hint.textContent = 'ESC 暂停/继续';
        document.body.appendChild(hint);
        elements.controlHint = hint;
    }

    function bindEvents() {
        if (elements.fab) {
            elements.fab.addEventListener('click', showConfirmModal);
        }

        if (elements.progressBar) {
            elements.progressBar.addEventListener('click', function(e) {
                if (!state.isPlaying) return;

                var rect = elements.progressBar.getBoundingClientRect();
                var clickX = e.clientX - rect.left;
                var percent = clickX / rect.width;
                var targetProgress = Math.max(0, Math.min(100, percent * 100));

                var targetStepIndex = findStepIndexByProgress(targetProgress);
                if (targetStepIndex >= 0 && targetStepIndex !== state.currentStepIndex) {
                    clearAllTimers();
                    state.onboardingCancelled = true;

                    var currentChapter = getCurrentChapterByStep(state.currentStepIndex);
                    var targetChapter = getCurrentChapterByStep(targetStepIndex);
                    if (currentChapter !== targetChapter) {
                        resetStateForChapter(targetChapter);
                    }

                    state.currentStepIndex = targetStepIndex;
                    state.progress = targetProgress;
                    updateProgress(targetProgress);
                    updateStepIndicator();

                    if (state.isPaused) {
                        runStep(targetStepIndex, true);
                    } else {
                        runStep(targetStepIndex);
                    }
                } else {
                    if (state.isPaused) {
                        resume();
                    } else {
                        pause();
                    }
                }
            });
        }

        if (elements.clickBlocker) {
            elements.clickBlocker.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
            });
        }

        var resumeBtn = document.getElementById('demo-resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', resume);
        }

        var stopBtn = document.getElementById('demo-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', stop);
        }

        var homeBtn = document.getElementById('demo-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', goHome);
        }

        var speedBtns = document.querySelectorAll('.demo-speed-btn');
        speedBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var speed = parseFloat(btn.getAttribute('data-speed'));
                setPlaybackSpeed(speed);
                speedBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });

        var chapterBtns = document.querySelectorAll('.demo-chapter-btn');
        chapterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var chapterId = parseInt(btn.getAttribute('data-chapter'));
                jumpToChapter(chapterId);
            });
        });

        var prevStepBtn = document.getElementById('demo-prev-step-btn');
        if (prevStepBtn) {
            prevStepBtn.addEventListener('click', prevStep);
        }

        var nextStepBtn = document.getElementById('demo-next-step-btn');
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', nextStep);
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && state.isPlaying) {
            if (state.isPaused) {
                resume();
            } else {
                pause();
            }
        }
        if (state.isPlaying && state.isPaused) {
            if (e.key === 'ArrowLeft') {
                prevStep();
            } else if (e.key === 'ArrowRight') {
                nextStep();
            }
        }
        if (state.isPlaying && document.activeElement === elements.progressBar) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                prevStep();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextStep();
            } else if (e.key === 'Home') {
                e.preventDefault();
                jumpToChapter(1);
            } else if (e.key === 'End') {
                e.preventDefault();
                var lastChapter = CHAPTERS[CHAPTERS.length - 1];
                if (lastChapter) {
                    jumpToChapter(lastChapter.id);
                }
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (state.isPaused) {
                    resume();
                } else {
                    pause();
                }
            }
        }
    }

    function checkUrlParam() {
        var params = new URLSearchParams(window.location.search);
        if (params.get('demo') === '1') {
            setTimeout(function() {
                showConfirmModal();
            }, 1000);
        }
    }

    function showConfirmModal() {
        if (state.isPlaying) return;

        var modalId = 'demo-confirm-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var modalHtml = `
            <div class="modal active" id="${modalId}">
                <div class="modal-content">
                    <button class="modal-close" id="demo-modal-close-btn">✕</button>
                    <div class="modal-title">${Icons.render('clapperboard')} 功能演示</div>
                    <div class="modal-body">
                        <p style="margin-bottom: 12px;">观看约1分钟的自动演示，快速了解核心功能。</p>
                        <p style="font-size: 14px; color: var(--text-muted);">演示过程中可随时按 ESC 暂停，演示数据不会保存。</p>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end;">
                        <button class="btn-secondary" id="demo-modal-cancel-btn">取消</button>
                        <button class="btn-primary" id="demo-start-btn">开始演示</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        function closeModal() {
            var modal = document.getElementById(modalId);
            if (modal) modal.remove();
        }

        var closeBtn = document.getElementById('demo-modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        var cancelBtn = document.getElementById('demo-modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }

        var startBtn = document.getElementById('demo-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                closeModal();
                start();
            });
        }

        var modal = document.getElementById(modalId);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    function start() {
        if (state.isPlaying) return;

        saveOriginalState();
        disableAllOnboardingTours();
        closeAllModals();

        state.isPlaying = true;
        state.isPaused = false;
        state.currentStepIndex = 0;
        state.progress = 0;
        state.scriptSteps = buildScript();
        state.onboardingCancelled = false;
        state.consecutiveErrors = 0;

        if (elements.fab) {
            elements.fab.style.display = 'none';
        }
        if (elements.progressBar) {
            elements.progressBar.style.display = 'block';
        }
        if (elements.clickBlocker) {
            elements.clickBlocker.style.display = 'block';
        }
        if (elements.controlHint) {
            elements.controlHint.classList.add('show');
        }

        window.addEventListener('resize', handleResize);
        document.addEventListener('keydown', handleKeydown);

        runStep(0);

        showControlHint(15000);
    }

    function showControlHint(duration) {
        if (!elements.controlHint) return;
        elements.controlHint.classList.add('show');
        addTimer(setTimeout(function() {
            if (elements.controlHint && elements.controlHint.classList.contains('show')) {
                elements.controlHint.classList.remove('show');
            }
        }, duration || 8000));
    }

    function getOnboardingTourIds() {
        return [
            'sop-first-visit',
            'budget-first-visit',
            'home-first-visit',
            'toolbox-first-visit',
            'knowledge-first-visit'
        ];
    }

    function saveOriginalState() {
        var tourIds = getOnboardingTourIds();
        var originalTours = {};
        tourIds.forEach(function(id) {
            originalTours[id] = Storage.load('onboarding_tour_completed_' + id);
        });

        var originalLocalStorage = {};
        var allKeys = Storage.getKeys();
        allKeys.forEach(function(key) {
            originalLocalStorage[key] = Storage.load(key);
        });

        state.originalState = {
            currentView: App.state.currentView,
            userData: JSON.parse(JSON.stringify(App.state.userData || {})),
            sopProgress: App.state.sopProgress !== undefined ? JSON.parse(JSON.stringify(App.state.sopProgress || null)) : undefined,
            onboardingTours: originalTours,
            allLocalStorage: originalLocalStorage
        };
    }

    function restoreOriginalState() {
        if (!state.originalState) return;

        if (state.originalState.allLocalStorage) {
            var currentKeys = Storage.getKeys();
            currentKeys.forEach(function(key) {
                if (!(key in state.originalState.allLocalStorage)) {
                    Storage.remove(key);
                }
            });
            for (var key in state.originalState.allLocalStorage) {
                if (state.originalState.allLocalStorage.hasOwnProperty(key)) {
                    var value = state.originalState.allLocalStorage[key];
                    if (value === null || value === undefined) {
                        Storage.remove(key);
                    } else {
                        Storage.save(key, value);
                    }
                }
            }
        }

        App.state.currentView = state.originalState.currentView;
        App.state.userData = JSON.parse(JSON.stringify(state.originalState.userData));
        if (state.originalState.sopProgress !== undefined) {
            if (state.originalState.sopProgress === null) {
                App.state.sopProgress = null;
            } else {
                App.state.sopProgress = JSON.parse(JSON.stringify(state.originalState.sopProgress));
            }
        }
        App.saveState();

        if (state.originalState.onboardingTours) {
            var tourIds = getOnboardingTourIds();
            tourIds.forEach(function(id) {
                var key = 'onboarding_tour_completed_' + id;
                var originalValue = state.originalState.onboardingTours[id];
                if (originalValue === null || originalValue === undefined) {
                    Storage.remove(key);
                } else {
                    Storage.save(key, originalValue === 'true' ? true : originalValue);
                }
            });
        }

        App.switchView(state.originalState.currentView);
    }

    function handleStepError(index, step, error, context) {
        state.consecutiveErrors++;
        console.error(
            '[DemoGuide] Step error | index:', index,
            '| chapter:', step ? step.chapter : 'unknown',
            '| progress:', step ? step.progress : 'unknown',
            '| context:', context || 'unknown',
            '| consecutiveErrors:', state.consecutiveErrors,
            '| error:', error
        );

        try {
            if (state.consecutiveErrors >= state.maxConsecutiveErrors) {
                console.error('[DemoGuide] Too many consecutive errors (' + state.consecutiveErrors + '), pausing demo');
                if (elements.pauseOverlay) {
                    elements.pauseOverlay.classList.add('active');
                }
                state.isPaused = true;
                return false;
            }
        } catch (e) {
            console.error('[DemoGuide] handleStepError inner error:', e);
        }
        return true;
    }

    function runStep(index, holdAfter) {
        if (!state.isPlaying) return;
        if (!holdAfter && state.isPaused) {
            return;
        }
        if (index >= state.scriptSteps.length) {
            finishDemo();
            return;
        }

        state.currentStepIndex = index;
        var step = state.scriptSteps[index];
        var speed = state.playbackSpeed || 1;

        try {
            updateProgress(step.progress);
            updateChapterLabel(step.chapter);
            updateStepIndicator();

            if (step.spotlight) {
                hideCenterTooltip();
                showSpotlight(step.spotlight, step.narration, step.chapter);
            } else if (step.narration && step.narration.length > 0) {
                hideSpotlight();
                showCenterTooltip(step.narration, step.chapter);
            } else {
                hideSpotlight();
                hideCenterTooltip();
            }
            state.consecutiveErrors = 0;
        } catch (e) {
            var canContinue = handleStepError(index, step, e, 'setup');
            if (!canContinue) {
                return;
            }
        }

        if (holdAfter) {
            state.isPaused = true;
            if (elements.pauseOverlay) {
                elements.pauseOverlay.classList.add('active');
            }
            return;
        }

        var advanced = false;
        function safeAdvance() {
            if (advanced) return;
            advanced = true;
            state.consecutiveErrors = 0;
            runStep(index + 1);
        }

        var watchdogTimeout = (step.watchdogTimeout || 15000) / speed;
        var watchdogTimer = setTimeout(function() {
            if (!advanced) {
                console.warn(
                    '[DemoGuide] Watchdog timeout | step index:', index,
                    '| chapter:', step ? step.chapter : 'unknown',
                    '| progress:', step ? step.progress : 'unknown',
                    '| isPlaying:', state.isPlaying,
                    '| isPaused:', state.isPaused,
                    '| currentStep:', state.currentStepIndex
                );
                safeAdvance();
            }
        }, watchdogTimeout);
        state.timers.push(watchdogTimer);

        var delayTimer = setTimeout(function() {
            if (!state.isPlaying || state.isPaused) return;

            try {
                if (typeof step.action === 'function') {
                    var actionCompleted = false;
                    var actionTimeout = (step.actionTimeout || 12000) / speed;
                    var actionWatchdog = setTimeout(function() {
                        if (!actionCompleted) {
                            console.warn(
                                '[DemoGuide] Action timeout | step index:', index,
                                '| chapter:', step ? step.chapter : 'unknown'
                            );
                            try {
                                disableAllOnboardingTours();
                                closeAllModals();
                            } catch (e) {
                                console.warn('cleanup error:', e);
                            }
                            var holdTime = (step.holdTime || 1500) / speed;
                            var timer = setTimeout(function() {
                                safeAdvance();
                            }, holdTime);
                            state.timers.push(timer);
                        }
                    }, actionTimeout);
                    state.timers.push(actionWatchdog);

                    step.action(function() {
                        if (actionCompleted) return;
                        actionCompleted = true;
                        clearTimeout(actionWatchdog);

                        if (!state.isPlaying || state.isPaused) return;

                        try {
                            disableAllOnboardingTours();
                            closeAllModals();
                        } catch (e) {
                            console.warn('cleanup error:', e);
                        }

                        var holdTime = (step.holdTime || 1500) / speed;
                        var timer = setTimeout(function() {
                            safeAdvance();
                        }, holdTime);
                        state.timers.push(timer);
                    });
                } else {
                    var holdTime = (step.holdTime || 1500) / speed;
                    var timer = setTimeout(function() {
                        safeAdvance();
                    }, holdTime);
                    state.timers.push(timer);
                }
            } catch (e) {
                var canContinue = handleStepError(index, step, e, 'action');
                if (canContinue) {
                    safeAdvance();
                }
            }
        }, (step.delay || 300) / speed);
        state.timers.push(delayTimer);
    }

    function pause() {
        if (!state.isPlaying || state.isPaused) return;

        state.isPaused = true;
        clearAllTimers();

        if (elements.spotlightOverlay) {
            elements.spotlightOverlay.classList.add('paused');
        }
        if (elements.centerTooltip) {
            elements.centerTooltip.classList.add('paused');
        }
        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.add('active');
        }
        if (elements.controlHint) {
            elements.controlHint.classList.remove('show');
        }
    }

    function resume() {
        if (!state.isPlaying || !state.isPaused) return;

        state.isPaused = false;

        if (elements.spotlightOverlay) {
            elements.spotlightOverlay.classList.remove('paused');
        }
        if (elements.centerTooltip) {
            elements.centerTooltip.classList.remove('paused');
        }
        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.remove('active');
        }

        showControlHint(5000);

        runStep(state.currentStepIndex);
    }

    function stop() {
        if (!state.isPlaying) return;

        state.isPlaying = false;
        state.isPaused = false;
        state.onboardingCancelled = true;
        clearAllTimers();

        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = null;
        }
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('keydown', handleKeydown);

        hideSpotlight();
        hideCenterTooltip();

        if (elements.spotlightOverlay) {
            elements.spotlightOverlay.classList.remove('paused');
        }
        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.remove('active');
        }
        if (elements.progressBar) {
            elements.progressBar.style.display = 'none';
        }
        if (elements.clickBlocker) {
            elements.clickBlocker.style.display = 'none';
        }
        if (elements.controlHint) {
            elements.controlHint.classList.remove('show');
        }
        if (elements.fab) {
            elements.fab.style.display = 'flex';
        }

        restoreOriginalState();

        state.currentStepIndex = 0;
        state.progress = 0;
    }

    function goHome() {
        stop();
        if (window.App && typeof App.switchView === 'function') {
            App.switchView('home');
        }
    }

    function setPlaybackSpeed(speed) {
        state.playbackSpeed = speed;
    }

    function resetStateForChapter(chapterId) {
        try {
            closeAllModals();
            disableAllOnboardingTours();

            switch (chapterId) {
                case 1:
                    App.switchView('hero');
                    break;
                case 2:
                    ensureCompleteUserData();
                    ensureHomeProgress();
                    App.switchView('home');
                    break;
                case 3:
                    ensureCompleteUserData();
                    ensureSopStepsCompleted('F-1');
                    App.switchView('sop');
                    break;
                case 4:
                    ensureCompleteUserData();
                    ensureBudgetPlan();
                    App.switchView('budget');
                    break;
                case 5:
                    App.switchView('tools');
                    break;
                case 6:
                    ensureCompleteUserData();
                    ensureHomeProgress();
                    App.switchView('home');
                    break;
            }
        } catch (e) {
            console.warn('resetStateForChapter error, chapter:', chapterId, e);
        }
    }

    function jumpToChapter(chapterId) {
        if (!state.isPlaying) return;

        var script = state.scriptSteps;
        var targetIndex = 0;

        for (var i = 0; i < script.length; i++) {
            if (script[i].chapter === chapterId) {
                targetIndex = i;
                break;
            }
        }

        clearAllTimers();
        state.onboardingCancelled = true;
        resetStateForChapter(chapterId);
        state.currentStepIndex = targetIndex;
        updateStepIndicator();

        var chapterInfo = CHAPTERS.find(function(c) { return c.id === chapterId; });
        if (chapterInfo) {
            state.progress = chapterInfo.startProgress;
            updateProgress(state.progress);
        }

        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.remove('active');
        }

        state.isPaused = false;
        runStep(targetIndex);
    }

    function prevStep() {
        if (!state.isPlaying || state.currentStepIndex <= 0) return;

        clearAllTimers();
        state.currentStepIndex = Math.max(0, state.currentStepIndex - 1);
        updateStepIndicator();

        var step = state.scriptSteps[state.currentStepIndex];
        if (step && typeof step.progress !== 'undefined') {
            state.progress = step.progress;
            updateProgress(state.progress);
        }

        if (state.isPaused) {
            runStep(state.currentStepIndex, true);
        } else {
            runStep(state.currentStepIndex);
        }
    }

    function nextStep() {
        if (!state.isPlaying || state.currentStepIndex >= state.scriptSteps.length - 1) return;

        clearAllTimers();
        state.currentStepIndex = Math.min(state.scriptSteps.length - 1, state.currentStepIndex + 1);
        updateStepIndicator();

        var step = state.scriptSteps[state.currentStepIndex];
        if (step && typeof step.progress !== 'undefined') {
            state.progress = step.progress;
            updateProgress(state.progress);
        }

        if (state.isPaused) {
            runStep(state.currentStepIndex, true);
        } else {
            runStep(state.currentStepIndex);
        }
    }

    function updateStepIndicator() {
        var indicator = document.getElementById('demo-step-indicator');
        if (indicator) {
            indicator.textContent = (state.currentStepIndex + 1) + ' / ' + state.scriptSteps.length;
        }

        var chapterBtns = document.querySelectorAll('.demo-chapter-btn');
        var currentChapter = getCurrentChapterByStep(state.currentStepIndex);
        chapterBtns.forEach(function(btn) {
            var ch = parseInt(btn.getAttribute('data-chapter'));
            if (ch === currentChapter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function getCurrentChapterByStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= state.scriptSteps.length) return 1;
        var step = state.scriptSteps[stepIndex];
        return step ? step.chapter : 1;
    }

    function findStepIndexByProgress(targetProgress) {
        if (!state.scriptSteps || state.scriptSteps.length === 0) return -1;

        var closestIndex = 0;
        var minDiff = Math.abs(targetProgress - (state.scriptSteps[0].progress || 0));

        for (var i = 1; i < state.scriptSteps.length; i++) {
            var stepProgress = state.scriptSteps[i].progress || 0;
            var diff = Math.abs(targetProgress - stepProgress);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        return closestIndex;
    }

    function finishDemo() {
        state.isPlaying = false;
        state.onboardingCancelled = true;
        clearAllTimers();

        addTimer(setTimeout(function() {
            hideSpotlight();
            hideCenterTooltip();

            if (elements.progressBar) {
                elements.progressBar.style.display = 'none';
            }
            if (elements.clickBlocker) {
                elements.clickBlocker.style.display = 'none';
            }
            if (elements.fab) {
                elements.fab.style.display = 'flex';
            }
            if (elements.controlHint) {
                elements.controlHint.classList.remove('show');
            }

            restoreOriginalState();

            if (window.App && typeof App.switchView === 'function') {
                App.switchView('home');
            }

            state.currentStepIndex = 0;
            state.progress = 0;
        }, 2000));
    }

    function handleResize() {
        if (!state.isPlaying) return;
        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
        }
        state.resizeTimer = setTimeout(function() {
            if (!state.isPlaying) return;
            var step = state.scriptSteps[state.currentStepIndex];
            if (step && step.spotlight) {
                showSpotlight(step.spotlight, step.narration, step.chapter);
            }
        }, 100);
    }

    function clearAllTimers() {
        state.timers.forEach(function(timer) {
            clearTimeout(timer);
            clearInterval(timer);
        });
        state.timers = [];
        if (state.resizeTimer) {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = null;
        }
    }

    function updateProgress(percent) {
        state.progress = percent;
        if (elements.progressFill) {
            elements.progressFill.style.width = percent + '%';
        }
        if (elements.progressBar) {
            elements.progressBar.setAttribute('aria-valuenow', Math.round(percent));
        }
        if (elements.progressTooltip) {
            var chapter = getCurrentChapter(percent);
            if (chapter) {
                elements.progressTooltip.textContent = chapter.name;
            }
            elements.progressTooltip.style.left = percent + '%';
        }
    }

    function getCurrentChapter(progress) {
        for (var i = CHAPTERS.length - 1; i >= 0; i--) {
            if (progress >= CHAPTERS[i].startProgress) {
                return CHAPTERS[i];
            }
        }
        return CHAPTERS[0];
    }

    function updateChapterLabel(chapterId) {
        var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
        if (chapter && elements.progressTooltip) {
            elements.progressTooltip.textContent = chapter.name;
        }
    }

    function getVisibleElementRects(selector) {
        var targets = document.querySelectorAll(selector);
        if (!targets || targets.length === 0) {
            return null;
        }

        var minLeft = Infinity;
        var minTop = Infinity;
        var maxRight = -Infinity;
        var maxBottom = -Infinity;
        var hasVisible = false;
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;

        for (var i = 0; i < targets.length; i++) {
            var rect = targets[i].getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            if (rect.left === 0 && rect.top === 0 && rect.width === 0 && rect.height === 0) continue;

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

        if (!hasVisible) {
            return null;
        }

        return {
            left: minLeft,
            top: minTop,
            right: maxRight,
            bottom: maxBottom,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };
    }

    function showSpotlight(config, text, chapterId) {
        var rects = getVisibleElementRects(config.selector);
        if (!rects) {
            var retryCount = 0;
            var maxRetries = 5;
            var retryInterval = 200;

            function tryShowSpotlight() {
                if (!state.isPlaying || state.isPaused) return;
                rects = getVisibleElementRects(config.selector);
                if (rects) {
                    renderSpotlight(rects, config, text, chapterId);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    addTimer(setTimeout(tryShowSpotlight, retryInterval));
                } else {
                    hideSpotlight();
                }
            }

            addTimer(setTimeout(tryShowSpotlight, retryInterval));
            return;
        }

        renderSpotlight(rects, config, text, chapterId);
    }

    function renderSpotlight(rects, config, text, chapterId) {
        var padding = config.padding || 10;
        var shape = config.shape || 'rect';

        var left = rects.left - padding;
        var top = rects.top - padding;
        var width = rects.width + padding * 2;
        var height = rects.height + padding * 2;

        if (elements.spotlightOverlay) {
            if (shape === 'circle') {
                elements.spotlightOverlay.classList.add('shape-circle');
            } else {
                elements.spotlightOverlay.classList.remove('shape-circle');
            }
        }

        if (shape === 'circle' && elements.spotlightCircle) {
            var diameter = Math.max(width, height);
            var cx = left + width / 2;
            var cy = top + height / 2;
            var circleLeft = cx - diameter / 2;
            var circleTop = cy - diameter / 2;

            elements.spotlightCircle.style.left = circleLeft + 'px';
            elements.spotlightCircle.style.top = circleTop + 'px';
            elements.spotlightCircle.style.width = diameter + 'px';
            elements.spotlightCircle.style.height = diameter + 'px';
        } else {
            var maskTop = elements.spotlightOverlay.querySelector('.demo-spotlight-mask-top');
            var maskBottom = elements.spotlightOverlay.querySelector('.demo-spotlight-mask-bottom');
            var maskLeft = elements.spotlightOverlay.querySelector('.demo-spotlight-mask-left');
            var maskRight = elements.spotlightOverlay.querySelector('.demo-spotlight-mask-right');

            if (maskTop) {
                maskTop.style.height = top + 'px';
            }
            if (maskBottom) {
                maskBottom.style.top = (top + height) + 'px';
                maskBottom.style.height = (window.innerHeight - top - height) + 'px';
            }
            if (maskLeft) {
                maskLeft.style.top = top + 'px';
                maskLeft.style.width = left + 'px';
                maskLeft.style.height = height + 'px';
            }
            if (maskRight) {
                maskRight.style.top = top + 'px';
                maskRight.style.left = (left + width) + 'px';
                maskRight.style.width = (window.innerWidth - left - width) + 'px';
                maskRight.style.height = height + 'px';
            }
        }

        if (elements.spotlightOverlay) {
            elements.spotlightOverlay.classList.add('active');
        }

        if (elements.spotlightTooltip && text) {
            var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
            var chapterLabel = elements.spotlightTooltip.querySelector('.demo-chapter-label');
            var tooltipText = elements.spotlightTooltip.querySelector('.demo-tooltip-text');

            if (chapterLabel && chapter) {
                chapterLabel.textContent = '第' + chapter.id + '章 · ' + chapter.name;
            }
            if (tooltipText) {
                tooltipText.textContent = text;
            }

            elements.spotlightTooltip.classList.remove('top', 'bottom', 'left', 'right');

            var isMobile = window.innerWidth <= 767;
            var isLandscape = window.innerWidth > window.innerHeight;
            var tooltipWidth = isMobile ? Math.min(280, window.innerWidth - 32) : 320;
            var tooltipHeight = isMobile ? 72 : 84;
            var gap = 16;
            var cx = left + width / 2;
            var cy = top + height / 2;

            var position = config.position || 'bottom';
            var tooltipTop, tooltipLeft;
            var originalTooltipLeft, originalTooltipTop;

            var spaceTop = top - gap;
            var spaceBottom = window.innerHeight - (top + height) - gap;
            var spaceLeft = left - gap;
            var spaceRight = window.innerWidth - (left + width) - gap;

            if (position === 'top' || position === 'bottom') {
                if (position === 'bottom' && spaceBottom < tooltipHeight) {
                    if (spaceTop >= tooltipHeight) {
                        position = 'top';
                    } else if (spaceRight >= tooltipWidth || spaceLeft >= tooltipWidth) {
                        position = spaceRight >= spaceLeft ? 'right' : 'left';
                    }
                } else if (position === 'top' && spaceTop < tooltipHeight) {
                    if (spaceBottom >= tooltipHeight) {
                        position = 'bottom';
                    } else if (spaceRight >= tooltipWidth || spaceLeft >= tooltipWidth) {
                        position = spaceRight >= spaceLeft ? 'right' : 'left';
                    }
                }
            } else if (position === 'left' || position === 'right') {
                if ((position === 'right' && spaceRight < tooltipWidth) ||
                    (position === 'left' && spaceLeft < tooltipWidth)) {
                    if (spaceBottom >= tooltipHeight || spaceTop >= tooltipHeight) {
                        position = spaceBottom >= spaceTop ? 'bottom' : 'top';
                    }
                }
            }

            if (isLandscape && isMobile) {
                if ((position === 'top' && spaceTop < 60) ||
                    (position === 'bottom' && spaceBottom < 60)) {
                    if (spaceRight >= 200 || spaceLeft >= 200) {
                        position = spaceRight >= spaceLeft ? 'right' : 'left';
                        tooltipWidth = Math.min(220, window.innerWidth - left - width - gap - 16);
                        if (position === 'left') {
                            tooltipWidth = Math.min(220, left - gap - 16);
                        }
                    }
                }
            }

            switch (position) {
                case 'top':
                    tooltipTop = top - tooltipHeight - gap;
                    tooltipLeft = cx - tooltipWidth / 2;
                    elements.spotlightTooltip.classList.add('bottom');
                    break;
                case 'bottom':
                    tooltipTop = top + height + gap;
                    tooltipLeft = cx - tooltipWidth / 2;
                    elements.spotlightTooltip.classList.add('top');
                    break;
                case 'left':
                    tooltipTop = cy - tooltipHeight / 2;
                    tooltipLeft = left - tooltipWidth - gap;
                    elements.spotlightTooltip.classList.add('right');
                    break;
                case 'right':
                    tooltipTop = cy - tooltipHeight / 2;
                    tooltipLeft = left + width + gap;
                    elements.spotlightTooltip.classList.add('left');
                    break;
            }

            originalTooltipLeft = tooltipLeft;
            originalTooltipTop = tooltipTop;

            var minLeft = 12;
            var maxLeft = window.innerWidth - tooltipWidth - 12;
            var minTop = 50;
            var maxTop = window.innerHeight - tooltipHeight - 12;

            tooltipLeft = Math.max(minLeft, Math.min(tooltipLeft, maxLeft));
            tooltipTop = Math.max(minTop, Math.min(tooltipTop, maxTop));

            var arrowOffsetX = tooltipLeft - originalTooltipLeft;
            var arrowOffsetY = tooltipTop - originalTooltipTop;

            elements.spotlightTooltip.style.setProperty('--arrow-offset-x', arrowOffsetX + 'px');
            elements.spotlightTooltip.style.setProperty('--arrow-offset-y', arrowOffsetY + 'px');

            elements.spotlightTooltip.style.top = tooltipTop + 'px';
            elements.spotlightTooltip.style.left = tooltipLeft + 'px';
            elements.spotlightTooltip.style.maxWidth = tooltipWidth + 'px';
            elements.spotlightTooltip.classList.add('show');
        }
    }

    function hideSpotlight() {
        if (elements.spotlightOverlay) {
            elements.spotlightOverlay.classList.remove('active');
            elements.spotlightOverlay.classList.remove('shape-circle');
            var masks = elements.spotlightOverlay.querySelectorAll('.demo-spotlight-mask');
            masks.forEach(function(mask) {
                mask.style.top = '';
                mask.style.left = '';
                mask.style.width = '';
                mask.style.height = '';
            });
        }
        if (elements.spotlightCircle) {
            elements.spotlightCircle.style.top = '';
            elements.spotlightCircle.style.left = '';
            elements.spotlightCircle.style.width = '';
            elements.spotlightCircle.style.height = '';
        }
        if (elements.spotlightTooltip) {
            elements.spotlightTooltip.classList.remove('show');
            elements.spotlightTooltip.classList.remove('top', 'bottom', 'left', 'right');
            elements.spotlightTooltip.style.top = '';
            elements.spotlightTooltip.style.left = '';
            elements.spotlightTooltip.style.removeProperty('--arrow-offset-x');
            elements.spotlightTooltip.style.removeProperty('--arrow-offset-y');
        }
    }

    function showCenterTooltip(text, chapterId) {
        if (!elements.centerTooltip || !text) return;

        var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
        var chapterEl = elements.centerTooltip.querySelector('.demo-center-chapter');
        var textEl = elements.centerTooltip.querySelector('.demo-center-text');

        if (chapterEl && chapter) {
            chapterEl.textContent = '第' + chapter.id + '章 · ' + chapter.name;
            chapterEl.style.display = 'block';
        } else if (chapterEl) {
            chapterEl.style.display = 'none';
        }
        if (textEl) {
            textEl.textContent = text;
        }

        elements.centerTooltip.classList.add('show');
    }

    function hideCenterTooltip() {
        if (elements.centerTooltip) {
            elements.centerTooltip.classList.remove('show');
        }
    }

    function simulateOnboardingQuiz(callback, maxQuestions) {
        var callbackCalled = false;
        var total = maxQuestions || 3;
        var currentQ = 0;
        var retryCount = 0;
        var maxRetries = 15;
        var modeSelected = false;

        function safeCallback() {
            if (callbackCalled) return;
            callbackCalled = true;
            try {
                callback();
            } catch (e) {
                console.warn('[DemoGuide] simulateOnboardingQuiz callback error:', e);
            }
        }

        var overallTimeout = setTimeout(function() {
            console.warn('[DemoGuide] simulateOnboardingQuiz overall timeout, forcing continue');
            safeCallback();
        }, 8000);
        state.timers.push(overallTimeout);

        if (!window.OnboardingView) {
            clearTimeout(overallTimeout);
            safeCallback();
            return;
        }

        function answerNext() {
            if (!state.isPlaying || state.onboardingCancelled) {
                clearTimeout(overallTimeout);
                safeCallback();
                return;
            }

            if (currentQ >= total) {
                clearTimeout(overallTimeout);
                addTimer(setTimeout(safeCallback, 1000));
                return;
            }

            retryCount++;
            if (retryCount > maxRetries) {
                console.warn('[DemoGuide] simulateOnboardingQuiz max retries reached');
                clearTimeout(overallTimeout);
                safeCallback();
                return;
            }

            try {
                if (!modeSelected) {
                    var modeCards = document.querySelectorAll('.mode-card, [class*=mode-card], [data-mode], .onboarding-mode-card');
                    if (modeCards.length > 0) {
                        modeCards[0].click();
                        modeSelected = true;
                        retryCount = 0;
                        if (!state.isPlaying || state.onboardingCancelled) {
                            clearTimeout(overallTimeout);
                            safeCallback();
                            return;
                        }
                        var timer = setTimeout(answerNext, 1200);
                        state.timers.push(timer);
                        return;
                    }
                }

                var options = document.querySelectorAll('.option-card, [class*=option-card], [data-option], .onboarding-option, .quiz-option');
                if (options.length > 0) {
                    var randomIdx = Math.floor(Math.random() * Math.min(3, options.length));
                    options[randomIdx].click();
                    currentQ++;
                    retryCount = 0;
                    if (!state.isPlaying || state.onboardingCancelled) {
                        clearTimeout(overallTimeout);
                        safeCallback();
                        return;
                    }
                    var timer = setTimeout(answerNext, 900);
                    state.timers.push(timer);
                } else {
                    if (!state.isPlaying || state.onboardingCancelled) {
                        clearTimeout(overallTimeout);
                        safeCallback();
                        return;
                    }
                    var timer = setTimeout(answerNext, 400);
                    state.timers.push(timer);
                }
            } catch (e) {
                console.warn('[DemoGuide] simulateOnboardingQuiz answerNext error:', e);
                clearTimeout(overallTimeout);
                safeCallback();
            }
        }

        addTimer(setTimeout(answerNext, 1000));
    }

    function gotoSopStep(stepId) {
        try {
            if (window.SopView && typeof SopView.gotoStep === 'function') {
                SopView.gotoStep(stepId);
                return;
            }
            var stepItems = document.querySelectorAll('.sop-step-nav-item, [data-step-id="' + stepId + '"]');
            for (var i = 0; i < stepItems.length; i++) {
                if (stepItems[i].getAttribute('data-step-id') === stepId ||
                    stepItems[i].id === 'step-' + stepId) {
                    stepItems[i].click();
                    return;
                }
            }
        } catch (e) {
            console.warn('gotoSopStep error:', e);
        }
    }

    function triggerQuoteAuditAI(callback) {
        var callbackCalled = false;

        function safeCallback() {
            if (callbackCalled) return;
            callbackCalled = true;
            try {
                callback();
            } catch (e) {
                console.warn('[DemoGuide] triggerQuoteAuditAI callback error:', e);
            }
        }

        try {
            var aiToolBtns = document.querySelectorAll('.sop-ai-tool-btn, [data-tool-id="quote-audit"], [class*=quote]');
            for (var i = 0; i < aiToolBtns.length; i++) {
                var btn = aiToolBtns[i];
                var text = btn.textContent || '';
                if (text.indexOf('报价') !== -1 || text.indexOf('审核') !== -1 || text.indexOf('审') !== -1) {
                    btn.click();
                    break;
                }
            }
        } catch (e) {
            console.warn('[DemoGuide] triggerQuoteAuditAI error:', e);
        }

        addTimer(setTimeout(safeCallback, 1500));
    }

    function disableAllOnboardingTours() {
        try {
            var tourIds = getOnboardingTourIds();
            tourIds.forEach(function(id) {
                Storage.save('onboarding_tour_completed_' + id, true);
            });

            var overlay = document.getElementById('onboarding-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
            }

            var skipBtns = document.querySelectorAll('#onboarding-overlay button, .onboarding-skip, [onboarding*=skip]');
            skipBtns.forEach(function(btn) {
                if (btn.textContent && btn.textContent.indexOf('跳过') >= 0) {
                    try { btn.click(); } catch(e) {
                        console.error('[DemoGuide] 点击跳过按钮失败:', e);
                    }
                }
            });
        } catch (e) {
            console.warn('disableAllOnboardingTours error:', e);
        }
    }

    function closeAllModals() {
        try {
            var modals = document.querySelectorAll('.modal.active, [id$="-modal"].active, [class*=modal].active, [id$="-overlay"].active, [class*=overlay].active');
            modals.forEach(function(m) {
                m.classList.remove('active');
            });
            var modalBackdrops = document.querySelectorAll('.modal-backdrop, .modal-mask, .tool-modal-backdrop');
            modalBackdrops.forEach(function(b) {
                b.classList.remove('active');
            });
            if (window.SettingsModal && typeof SettingsModal.hide === 'function') {
                SettingsModal.hide();
            }
        } catch (e) {
            console.warn('closeAllModals error:', e);
        }
    }

    function ensureCompleteUserData() {
        if (!App.state.userData) {
            App.state.userData = {};
        }
        if (!App.state.userData.budget) {
            App.state.userData.budget = '10-15万';
        }
        if (!App.state.userData.cityTier) {
            App.state.userData.cityTier = '新一线城市';
        }
        if (!App.state.userData.area) {
            App.state.userData.area = 89;
        }
        if (!App.state.userData.styleResult) {
            App.state.userData.styleResult = { name: '新中式', score: 85 };
        }
        if (!App.state.userData.houseType) {
            App.state.userData.houseType = {
                id: 'type-b',
                name: '两室一厅',
                area: '89㎡',
                layout: '两室一厅一卫'
            };
        }
        App.saveState();
    }

    function getDemoMode() {
        return (App.state.userData && App.state.userData.decorationMode) || 'full';
    }

    function getSopProgress(mode) {
        mode = mode || getDemoMode();
        if (!App.state.sopProgress) {
            App.state.sopProgress = {
                full: { completedSteps: [], currentStep: 'F-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
                half: { completedSteps: [], currentStep: 'H-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
                self: { completedSteps: [], currentStep: 'S-1', currentStage: 0, stepPhotos: {}, stepDelays: {} },
                settings: { paymentReminder: true, delayWarning: true, warrantyExpiry: true }
            };
        }
        if (!App.state.sopProgress[mode]) {
            App.state.sopProgress[mode] = {
                completedSteps: [],
                currentStep: (mode === 'full' ? 'F' : mode === 'half' ? 'H' : 'S') + '-1',
                currentStage: 0,
                stepPhotos: {},
                stepDelays: {}
            };
        }
        return App.state.sopProgress[mode];
    }

    function getAllSteps() {
        if (window.SopView && SopView._STEPS) {
            return SopView._STEPS;
        }
        if (window.SopView && SopView.MODE_STEPS) {
            var mode = getDemoMode();
            return SopView.MODE_STEPS[mode] || [];
        }
        return null;
    }

    function ensureSopStepsCompleted(targetStepId) {
        var mode = getDemoMode();
        var progress = getSopProgress(mode);
        var allSteps = getAllSteps();

        if (!allSteps) {
            App.saveState();
            return;
        }

        for (var i = 0; i < allSteps.length; i++) {
            var step = allSteps[i];
            if (step.id === targetStepId) {
                break;
            }
            if (progress.completedSteps.indexOf(step.id) === -1) {
                progress.completedSteps.push(step.id);
            }
        }

        progress.currentStep = targetStepId;
        var targetStep = allSteps.find(function(s) { return s.id === targetStepId; });
        if (targetStep) {
            progress.currentStage = targetStep.stageIndex;
        }

        App.saveState();
    }

    function ensureBudgetPlan() {
        if (!App.state.userData.budgetPlan) {
            var totalBudget = 100000;
            var cityTier = 'newFirst';
            var area = 80;

            if (window.BudgetView && typeof BudgetView._calculateBudget === 'function') {
                App.state.userData.budgetPlan = BudgetView._calculateBudget(totalBudget, cityTier, area);
            } else {
                App.state.userData.budgetPlan = createMockBudgetPlan(totalBudget, cityTier, area);
            }
            App.saveState();
        }
    }

    function createMockBudgetPlan(totalBudget, cityTier, area) {
        var cityCoef = 1.0;
        var hardDecoration = totalBudget * 0.5;
        var mainMaterials = totalBudget * 0.3;
        var reserve = totalBudget * 0.2;

        var stages = [
            { id: 1, title: '设计准备', icon: 'ruler', ratio: 0.10, budget: Math.round(totalBudget * 0.10), spent: Math.round(totalBudget * 0.10 * 0.8), status: 'completed', expenses: [] },
            { id: 2, title: '结构改造', icon: 'hammer', ratio: 0.15, budget: Math.round(totalBudget * 0.15), spent: Math.round(totalBudget * 0.15 * 0.6), status: 'active', expenses: [] },
            { id: 3, title: '基础装修', icon: 'hammer', ratio: 0.25, budget: Math.round(totalBudget * 0.25), spent: 0, status: 'locked', expenses: [] },
            { id: 4, title: '主材安装', icon: 'window', ratio: 0.25, budget: Math.round(totalBudget * 0.25), spent: 0, status: 'locked', expenses: [] },
            { id: 5, title: '软装进场', icon: 'sofa', ratio: 0.15, budget: Math.round(totalBudget * 0.15), spent: 0, status: 'locked', expenses: [] },
            { id: 6, title: '入住准备', icon: 'party', ratio: 0.10, budget: Math.round(totalBudget * 0.10), spent: 0, status: 'locked', expenses: [] }
        ];

        var totalSpent = stages.reduce(function(sum, s) { return sum + s.spent; }, 0);

        return {
            totalBudget: totalBudget,
            cityTier: cityTier,
            cityCoefficient: cityCoef,
            area: area,
            breakdown: {
                hardDecoration: { total: Math.round(hardDecoration), laborCost: Math.round(hardDecoration * 0.5), auxiliaryMaterials: Math.round(hardDecoration * 0.5) },
                mainMaterials: Math.round(mainMaterials),
                reserve: Math.round(reserve)
            },
            stages: stages,
            materials: {},
            totalSpent: totalSpent,
            reserveUsed: 0,
            createdAt: new Date().toISOString()
        };
    }

    function simulateBudgetChanges(callback) {
        var callbackCalled = false;

        function safeCallback() {
            if (callbackCalled) return;
            callbackCalled = true;
            try {
                callback();
            } catch (e) {
                console.warn('[DemoGuide] simulateBudgetChanges callback error:', e);
            }
        }

        try {
            var plan = App.state && App.state.userData ? App.state.userData.budgetPlan : null;
            if (!plan) {
                safeCallback();
                return;
            }

            var targetSpent = Math.round(plan.totalBudget * 0.65);
            var currentSpent = plan.totalSpent;
            var increment = Math.max(500, Math.round((targetSpent - currentSpent) / 8));
            var steps = 0;

            function addNext() {
                try {
                    if (steps >= 8 || !state.isPlaying || state.isPaused) {
                        safeCallback();
                        return;
                    }

                    plan.totalSpent = Math.min(plan.totalSpent + increment, targetSpent);
                    if (plan.stages && plan.stages[1]) {
                        plan.stages[1].spent = Math.min(plan.stages[1].spent + increment, plan.stages[1].budget);
                    }

                    App.saveState();
                    if (window.BudgetView && typeof BudgetView.refresh === 'function') {
                        BudgetView.refresh();
                    }

                    steps++;
                    var timer = setTimeout(addNext, 400);
                    state.timers.push(timer);
                } catch (e) {
                    console.warn('[DemoGuide] simulateBudgetChanges addNext error:', e);
                    safeCallback();
                }
            }

            addNext();
        } catch (e) {
            console.warn('[DemoGuide] simulateBudgetChanges error:', e);
            safeCallback();
        }
    }

    function ensureHomeProgress() {
        var mode = getDemoMode();
        var progress = getSopProgress(mode);
        var allSteps = getAllSteps();

        if (allSteps && progress.completedSteps.length < 5) {
            for (var i = 0; i < Math.min(5, allSteps.length); i++) {
                if (progress.completedSteps.indexOf(allSteps[i].id) === -1) {
                    progress.completedSteps.push(allSteps[i].id);
                }
            }
            if (allSteps[4]) {
                progress.currentStep = allSteps[4].id;
                progress.currentStage = allSteps[4].stageIndex;
            }
            App.saveState();
        }

        if (window.HomeView && typeof HomeView.refresh === 'function') {
            setTimeout(function() {
                HomeView.refresh();
            }, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        start: start,
        stop: stop,
        pause: pause,
        resume: resume,
        prevStep: prevStep,
        nextStep: nextStep,
        jumpToChapter: jumpToChapter,
        setPlaybackSpeed: setPlaybackSpeed,
        getChapters: function() { return CHAPTERS.slice(); },
        getCurrentChapter: function() { return getCurrentChapterByStep(state.currentStepIndex); },
        getCurrentStepIndex: function() { return state.currentStepIndex; },
        getTotalSteps: function() { return state.scriptSteps.length; },
        getPlaybackSpeed: function() { return state.playbackSpeed; },
        get isPlaying() { return state.isPlaying; },
        get isPaused() { return state.isPaused; }
    };
})();

/* ==========================================================================
   修改说明
   ==========================================================================
   2026-07-10 - 演示模式精简优化
   
   - 章节精简：从7章精简为6个逻辑段落（开场→我的家→装修流程→预算→更多→开始）
   - 步骤精简：从26步精简为9步，目标时长从3分钟压缩至约50-55秒
   - 转场加速：所有视图切换的 setTimeout 从 800ms 改为 500ms
   - delay压缩：步骤 delay 从 500-800ms 压缩到 300-500ms
   - 删除冗余：移除 onboarding 问答模拟、预算变化模拟、设置弹窗、工具详情弹窗等
   - 核心亮点保留：2.5D我的家、小管家年年、装修流程、预算管理、工具箱、知识库
   - 保持不变：所有辅助函数、状态保存/恢复、ESC暂停、进度条、居中Tooltip等功能
   
   2026-07-10 - 演示时长优化（第二轮）
   
   - holdTime 大幅缩短：
     * 第1步（开场）: 4000ms → 2500ms
     * 第2步（2.5D场景）: 7000ms → 4500ms
     * 第3步（小管家）: 6000ms → 3500ms
     * 第4步（装修流程）: 6000ms → 3500ms
     * 第5步（预算管理）: 6000ms → 3500ms
     * 第6步（工具箱）: 4000ms → 2500ms
     * 第7步（知识库）: 3000ms → 2000ms
     * 第9步（CTA）: 6000ms → 4000ms
   - 所有步骤 delay 统一为 200ms（原 300-400ms）
   - 视图切换 setTimeout 从 500ms 改为 300ms
   - 聚光灯重试次数从 10 次减为 5 次（最多约1秒重试时间）
   - ensureHomeProgress 中的刷新延迟从 200ms 改为 100ms
   - 目标：1倍速下总时长控制在 50-55 秒之间
   
   2026-07-10 - 演示模式时长微调和视觉效果增强
   
   - 时长微调（延长核心步骤）：
     * 第1步（开场欢迎）: 2500ms → 3500ms
     * 第2步（2.5D我的家）: 4500ms → 7000ms
     * 第3步（小管家年年）: 3500ms → 5000ms
     * 第4步（装修流程）: 3500ms → 5000ms
     * 第5步（预算管理）: 3500ms → 5000ms
     * 第6步（工具箱）: 2500ms → 3000ms
     * 第7步（知识库）: 2000ms → 2500ms
     * 第8步（过渡）: 保持默认1500ms不变
     * 第9步（CTA行动号召）: 4000ms → 6000ms
   - 视觉效果增强（聚光灯 padding）：
     * 第2步（2.5D场景）: padding 16 → 24
     * 第3步（小管家）: padding 16 → 20
     * 第9步（CTA）: padding 16 → 20
   - 进度条微调：
     * 第8步（过渡）: progress 92% → 94%
   - 目标总时长：45-50秒（留出余量，确保不超过60秒）
   
   2026-07-10 - 脚本结构优化（第四轮）
   
   - 合并过渡步骤和CTA步骤：将原第8步（过渡）和第9步（CTA）合并为一步
   - 步骤数：从9步精简为8步
   - 合并后CTA的holdTime: 7000ms
   - 知识库holdTime: 2500ms → 3000ms
   - 工具箱progress: 78% → 75%
   - 解决了最后两步触发watchdog超时的问题
   - 目标总时长：约45-50秒
   ========================================================================== */
