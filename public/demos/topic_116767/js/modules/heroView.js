var HeroView = (function() {
    var container = null;
    var particleCanvas = null;
    var el = {};
    var avatar3d = null;

    function cacheElements() {
        el.mascot = document.getElementById('hero-mascot');
        el.speechBubble = document.getElementById('hero-speech-bubble');
        el.speechText = document.getElementById('hero-speech-text');
        el.startBtn = document.getElementById('hero-start-btn');
        el.continueBtn = document.getElementById('hero-continue-btn');
        el.modeHelpLink = document.getElementById('hero-mode-help-link');
        el.modeHelpCloseBtn = document.getElementById('mode-help-close-btn');
        el.modeHelpConfirmBtn = document.getElementById('mode-help-confirm-btn');
        el.modeHelpModal = document.getElementById('mode-help-modal');
        el.directStartBtn = document.getElementById('hero-direct-start-btn');
        el.modeSelectModal = document.getElementById('mode-select-modal');
        el.modeCancelBtn = document.getElementById('mode-modal-cancel-btn');
        el.modeConfirmBtn = document.getElementById('mode-modal-confirm-btn');
        el.confirmContinueBtn = document.getElementById('confirm-continue-btn');
        el.confirmRestartBtn = document.getElementById('confirm-restart-btn');
        el.confirmModal = document.getElementById('mode-confirm-modal');
    }

    function clearElementCache() {
        el = {};
    }

    function destroy3DAvatar() {
        if (avatar3d) {
            avatar3d.destroy();
            avatar3d = null;
        }
    }
    var selectedMode = 'full';
    var timers = [];
    var idleCallbacks = [];

    function addTimer(timerId) {
        timers.push(timerId);
        return timerId;
    }

    function addIdleCallback(id) {
        idleCallbacks.push(id);
        return id;
    }

    function clearAllTimers() {
        timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
        });
        timers = [];

        if ('cancelIdleCallback' in window) {
            idleCallbacks.forEach(function(id) {
                window.cancelIdleCallback(id);
            });
        }
        idleCallbacks = [];
    }

    var MODE_OPTIONS = [
        { id: 'full', name: '全包装修', desc: '装修公司全流程负责', suitable: '省心省力，适合时间紧张的业主', color: 'blue' },
        { id: 'half', name: '半包装修', desc: '业主买主材，施工方施工', suitable: '想控制主材质量和预算的业主', color: 'green' },
        { id: 'self', name: '自装模式', desc: '业主自主管理全流程', suitable: '有装修经验、时间充裕的业主', color: 'orange' }
    ];

    var FEATURE_ITEMS = [
        {
            icon: 'shield',
            title: '避坑指南',
            desc: '100+ 装修陷阱识别，提前预警',
            color: 'blue'
        },
        {
            icon: 'wallet',
            title: '智能预算管家',
            desc: '分阶段管理，超支自动提醒',
            color: 'green'
        },
        {
            icon: 'list',
            title: 'SOP 标准流程',
            desc: '22步标准流程，逐项验收不遗漏',
            color: 'gold'
        },
        {
            icon: 'heart',
            title: '贴心小管家陪伴',
            desc: '全程小管家陪伴，有问题随时查',
            color: 'red'
        }
    ];

    var SPEECH_TEXTS = [
        '你好呀~我是你的装修小管家！',
        '装修不懂？问我就对啦！',
        '跟着我，装修不踩坑~',
        '有问题随时叫我哦！',
        '我们一起把房子变成家吧~'
    ];

    function getIconSVG(iconName) {
        var icons = {
            shield: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
            wallet: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
            list: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
            heart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0-7.78z"/></svg>'
        };
        return icons[iconName] || icons.shield;
    }

    function render(containerEl) {
        container = containerEl;
        var hasProgress = window.App && App.state && App.state.sopProgress &&
            App.state.sopProgress.completedSteps && App.state.sopProgress.completedSteps.length > 0;

        container.innerHTML = `
            <div class="hero-view">
                <div class="hero-content">
                    <div class="hero-brand">
                        <h1 class="hero-title">装修流程管家</h1>
                        <p class="hero-subtitle">小白专属</p>
                    </div>

                    <div class="hero-mascot" id="hero-mascot" tabindex="0" role="button" aria-label="小管家吉祥物">
                        <div class="hero-speech-bubble" id="hero-speech-bubble">
                            <span id="hero-speech-text">你好呀~我是小管家！</span>
                        </div>
                        <div class="hero-mascot-3d-container" id="hero-mascot-3d-container">
                            <img class="hero-mascot-img hero-mascot-fallback" src="images/nian-icons/nian-default.png" width="140" height="140" alt="小管家吉祥物"/>
                        </div>
                        <div class="hero-mascot-badge">装修顾问</div>
                    </div>

                    <div class="hero-features">
                        ${FEATURE_ITEMS.map(function(item, index) {
                            return `
                            <div class="hero-feature-item hero-feature-${item.color}">
                                <div class="hero-feature-icon">
                                    ${getIconSVG(item.icon)}
                                </div>
                                <div class="hero-feature-text">
                                    <span class="hero-feature-label">${item.title}</span>
                                    <span class="hero-feature-desc">${item.desc}</span>
                                </div>
                            </div>
                            ${index < FEATURE_ITEMS.length - 1 ? '<div class="hero-feature-divider"></div>' : ''}
                            `;
                        }).join('')}
                    </div>

                    <div class="hero-actions">
                        <button id="hero-start-btn" class="btn-primary hero-start-btn">
                            开始装修
                        </button>
                        ${hasProgress ? `
                        <button id="hero-continue-btn" class="btn-secondary hero-continue-btn">
                            继续装修
                        </button>
                        ` : ''}
                    </div>

                    <div class="hero-trust-badge">
                        <span class="hero-trust-dot"></span>
                        免费使用 · 无需注册
                    </div>

                    ${!hasProgress ? `
                    <div class="hero-direct-start" id="hero-direct-start-btn">
                        跳过问卷，直接开始 →
                    </div>
                    ` : ''}

                    <div class="hero-bottom-hint">
                        装修模式怎么选？<span class="hero-bottom-link" id="hero-mode-help-link">了解三种模式</span>
                    </div>
                </div>

                <canvas id="hero-particles" class="hero-particles"></canvas>

                <div class="modal" id="mode-select-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content mode-select-modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">选择装修模式</h3>
                        </div>
                        <div class="modal-body">
                            <div class="mode-options">
                                ${MODE_OPTIONS.map(function(mode) {
                                    return `
                                    <div class="mode-card mode-card-${mode.color}" data-mode-id="${mode.id}">
                                        <div class="mode-card-left-bar"></div>
                                        <div class="mode-card-content">
                                            <div class="mode-card-name">${mode.name}</div>
                                            <div class="mode-card-desc">${mode.desc}</div>
                                            <div class="mode-card-suitable">适合：${mode.suitable}</div>
                                        </div>
                                        <div class="mode-card-check">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary modal-cancel-btn" id="mode-modal-cancel-btn">取消</button>
                            <button class="btn-primary modal-confirm-btn" id="mode-modal-confirm-btn">确认开始</button>
                        </div>
                    </div>
                </div>

                <div class="modal" id="mode-help-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content mode-help-modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">装修模式怎么选？</h3>
                            <button class="modal-close-btn" id="mode-help-close-btn" aria-label="关闭">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="mode-help-list">
                                <div class="mode-help-item mode-help-blue">
                                    <div class="mode-help-icon">
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </div>
                                    <div class="mode-help-content">
                                        <div class="mode-help-title">全包装修</div>
                                        <div class="mode-help-desc">适合工作忙、预算充足的业主</div>
                                        <div class="mode-help-tags">
                                            <span class="mode-help-tag">省心省力</span>
                                            <span class="mode-help-tag">全程托管</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mode-help-item mode-help-green">
                                    <div class="mode-help-icon">
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                        </svg>
                                    </div>
                                    <div class="mode-help-content">
                                        <div class="mode-help-title">半包装修</div>
                                        <div class="mode-help-desc">性价比之选，自己买主材</div>
                                        <div class="mode-help-tags">
                                            <span class="mode-help-tag">性价比高</span>
                                            <span class="mode-help-tag">主材可控</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mode-help-item mode-help-orange">
                                    <div class="mode-help-icon">
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                                            <path d="M2 2l7.586 7.586"/>
                                            <circle cx="11" cy="11" r="2"/>
                                        </svg>
                                    </div>
                                    <div class="mode-help-content">
                                        <div class="mode-help-title">自装模式</div>
                                        <div class="mode-help-desc">时间充裕，想省钱的业主</div>
                                        <div class="mode-help-tags">
                                            <span class="mode-help-tag">最省钱</span>
                                            <span class="mode-help-tag">完全掌控</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mode-help-footer-hint">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 16v-4"/>
                                    <path d="M12 8h.01"/>
                                </svg>
                                不确定选哪种？先选全包，后面可以随时调整
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-primary modal-confirm-btn" id="mode-help-confirm-btn">我知道了</button>
                        </div>
                    </div>
                </div>

                <div class="modal" id="mode-confirm-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content mode-confirm-modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">提示</h3>
                        </div>
                        <div class="modal-body">
                            <p class="confirm-modal-text">您已有该模式的装修进度，继续上次还是重新开始？</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary modal-cancel-btn" id="confirm-continue-btn">继续上次</button>
                            <button class="btn-primary modal-confirm-btn" id="confirm-restart-btn">重新开始</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function init(containerEl) {
        container = containerEl;
        cacheElements();
        setupEventListeners();
        setupMascotInteraction();
        init3DAvatar();

        addTimer(setTimeout(function() {
            var content = container.querySelector('.hero-content');
            if (content) {
                content.style.position = '';
                content.classList.add('visible');
            }
        }, 100));

        addTimer(setTimeout(function() {
            showSpeechBubble();
        }, 1500));

        delayParticleInit();
    }

    function init3DAvatar() {
        var container3d = document.getElementById('hero-mascot-3d-container');
        if (!container3d) return;

        if (typeof Nian3DAvatar === 'undefined') {
            console.warn('[HeroView] Nian3DAvatar not available, using fallback image');
            return;
        }

        if (!Nian3DAvatar.isSupported()) {
            console.warn('[HeroView] WebGL not supported, using fallback image');
            return;
        }

        var size = container3d.offsetWidth || 140;

        avatar3d = Nian3DAvatar.create({
            container: container3d,
            size: size,
            expression: 'happy',
            interactive: true,
            autoRotate: false
        });

        if (avatar3d) {
            var fallbackImg = container3d.querySelector('.hero-mascot-fallback');
            if (fallbackImg) {
                fallbackImg.style.display = 'none';
            }
            window.addEventListener('resize', resize3DAvatar);
        }
    }

    function resize3DAvatar() {
        if (!avatar3d) return;
        var container3d = document.getElementById('hero-mascot-3d-container');
        if (!container3d) return;
        var size = container3d.offsetWidth;
        if (size > 0) {
            avatar3d.setSize(size);
        }
    }

    function delayParticleInit() {
        var initParticles = function() {
            setupParticleCanvas();
        };

        if ('requestIdleCallback' in window) {
            addIdleCallback(window.requestIdleCallback(initParticles, { timeout: 1000 }));
        } else {
            addTimer(setTimeout(initParticles, 300));
        }
    }

    function setupParticleCanvas() {
        particleCanvas = document.getElementById('hero-particles');
        if (particleCanvas && window.ParticleSystem) {
            resizeParticleCanvas();
            var inited = ParticleSystem.init(particleCanvas);
            
            if (!inited) {
                particleCanvas.style.display = 'none';
                return;
            }

            window.addEventListener('resize', resizeParticleCanvas);

            if (ParticleSystem.isLowEnd && ParticleSystem.isLowEnd()) {
                particleCanvas.style.display = 'none';
                return;
            }

            ParticleSystem.startEmitter('hero-dust', {
                type: 'dust',
                rate: 0.5,
                x: 0,
                y: 0,
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    function resizeParticleCanvas() {
        if (particleCanvas) {
            particleCanvas.width = window.innerWidth * window.devicePixelRatio;
            particleCanvas.height = window.innerHeight * window.devicePixelRatio;
            particleCanvas.style.width = window.innerWidth + 'px';
            particleCanvas.style.height = window.innerHeight + 'px';
        }
    }

    function setupMascotInteraction() {
        if (!el.mascot) return;

        el.mascot.addEventListener('click', onMascotClick);
        el.mascot.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMascotClick();
            }
        });

        startBlinkLoop();
    }

    function startBlinkLoop() {
        addTimer(setInterval(function() {
            if (!el.mascot) return;
            
            var eyes = el.mascot.querySelectorAll('.mascot-eye');
            if (eyes.length === 0) return;
            
            eyes.forEach(function(eye) {
                eye.classList.add('blinking');
            });
            
            addTimer(setTimeout(function() {
                eyes.forEach(function(eye) {
                    eye.classList.remove('blinking');
                });
            }, 150));
        }, 4000 + Math.random() * 2000));
    }

    function onMascotClick() {
        if (!el.mascot) return;

        el.mascot.classList.add('mascot-bounce');
        addTimer(setTimeout(function() {
            el.mascot.classList.remove('mascot-bounce');
        }, 400));

        var eyes = el.mascot.querySelectorAll('.mascot-eye');
        if (eyes.length > 0) {
            eyes.forEach(function(eye) {
                eye.classList.add('blinking');
            });
            addTimer(setTimeout(function() {
                eyes.forEach(function(eye) {
                    eye.classList.remove('blinking');
                });
            }, 200));
        }

        if (avatar3d) {
            avatar3d.setExpression('happy');
        }

        showRandomSpeech();
    }

    function showSpeechBubble() {
        if (!el.speechBubble) return;
        
        el.speechBubble.classList.add('visible');
        
        addTimer(setTimeout(function() {
            el.speechBubble.classList.remove('visible');
        }, 3000));
    }

    function showRandomSpeech() {
        if (!el.speechBubble || !el.speechText) return;

        var randomText = SPEECH_TEXTS[Math.floor(Math.random() * SPEECH_TEXTS.length)];
        el.speechText.textContent = randomText;

        el.speechBubble.classList.remove('visible');
        
        addTimer(setTimeout(function() {
            el.speechBubble.classList.add('visible');
        }, 50));

        addTimer(setTimeout(function() {
            el.speechBubble.classList.remove('visible');
        }, 3500));
    }

    function setupEventListeners() {
        if (el.startBtn) {
            el.startBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('onboarding');
                }
            });
        }

        if (el.continueBtn) {
            el.continueBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('sop');
                }
            });
        }

        if (el.modeHelpLink) {
            el.modeHelpLink.addEventListener('click', showModeHelpModal);
        }

        if (el.modeHelpCloseBtn) {
            el.modeHelpCloseBtn.addEventListener('click', hideModeHelpModal);
        }

        if (el.modeHelpConfirmBtn) {
            el.modeHelpConfirmBtn.addEventListener('click', hideModeHelpModal);
        }

        if (el.modeHelpModal) {
            var overlay = el.modeHelpModal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', hideModeHelpModal);
            }
        }

        if (el.directStartBtn) {
            el.directStartBtn.addEventListener('click', showModeSelectModal);
        }

        var modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(function(card) {
            card.addEventListener('click', function() {
                var modeId = card.getAttribute('data-mode-id');
                selectMode(modeId);
            });
        });

        if (el.modeCancelBtn) {
            el.modeCancelBtn.addEventListener('click', hideModeSelectModal);
        }

        if (el.modeConfirmBtn) {
            el.modeConfirmBtn.addEventListener('click', confirmDirectStart);
        }

        if (el.modeSelectModal) {
            var overlay = el.modeSelectModal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', hideModeSelectModal);
            }
        }

        if (el.confirmContinueBtn) {
            el.confirmContinueBtn.addEventListener('click', function() {
                hideConfirmModal();
                goToSOPDirect(selectedMode);
            });
        }

        if (el.confirmRestartBtn) {
            el.confirmRestartBtn.addEventListener('click', function() {
                hideConfirmModal();
                resetModeProgress(selectedMode);
                goToSOPDirect(selectedMode);
            });
        }

        if (el.confirmModal) {
            var confirmOverlay = el.confirmModal.querySelector('.modal-overlay');
            if (confirmOverlay) {
                confirmOverlay.addEventListener('click', hideConfirmModal);
            }
        }

        selectMode('full');
    }

    function showModeHelpModal() {
        if (el.modeHelpModal) {
            el.modeHelpModal.classList.add('active');
        }
    }

    function hideModeHelpModal() {
        if (el.modeHelpModal) {
            el.modeHelpModal.classList.remove('active');
        }
    }

    function showModeSelectModal() {
        if (el.modeSelectModal) {
            el.modeSelectModal.classList.add('active');
        }
    }

    function hideModeSelectModal() {
        if (el.modeSelectModal) {
            el.modeSelectModal.classList.remove('active');
        }
    }

    function showConfirmModal() {
        if (el.confirmModal) {
            el.confirmModal.classList.add('active');
        }
    }

    function hideConfirmModal() {
        if (el.confirmModal) {
            el.confirmModal.classList.remove('active');
        }
    }

    function selectMode(modeId) {
        selectedMode = modeId;
        var modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(function(card) {
            var cardModeId = card.getAttribute('data-mode-id');
            if (cardModeId === modeId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    function confirmDirectStart() {
        var modeId = selectedMode;
        if (checkModeProgress(modeId)) {
            hideModeSelectModal();
            showConfirmModal();
        } else {
            goToSOPDirect(modeId);
        }
    }

    function checkModeProgress(modeId) {
        if (!window.App || !App.state || !App.state.sopProgress) {
            return false;
        }
        var progress = App.state.sopProgress[modeId];
        if (!progress) {
            return false;
        }
        return progress.completedSteps && progress.completedSteps.length > 0;
    }

    function resetModeProgress(modeId) {
        if (!window.App || !App.state || !App.state.sopProgress) {
            return;
        }
        if (!App.state.sopProgress[modeId]) {
            App.state.sopProgress[modeId] = {};
        }
        var progress = App.state.sopProgress[modeId];
        progress.completedSteps = [];
        
        var firstStepMap = {
            'full': 'F-1',
            'half': 'H-1',
            'self': 'S-1'
        };
        progress.currentStep = firstStepMap[modeId] || 'F-1';
        progress.currentStage = 0;

        if (App.state.purchasedMaterials && App.state.purchasedMaterials[modeId]) {
            App.state.purchasedMaterials[modeId] = {};
        }

        if (typeof App.saveState === 'function') {
            App.saveState();
        }
    }

    function goToSOPDirect(modeId) {
        if (!window.App) {
            return;
        }
        if (!App.state.userData) {
            App.state.userData = {};
        }
        App.state.userData.decorationMode = modeId;
        if (typeof App.saveState === 'function') {
            App.saveState();
        }
        if (typeof App.switchView === 'function') {
            App.switchView('sop');
        }
    }

    function destroy() {
        clearAllTimers();
        destroy3DAvatar();
        clearElementCache();
        if (window.ParticleSystem) {
            ParticleSystem.destroy();
        }
        window.removeEventListener('resize', resizeParticleCanvas);
        window.removeEventListener('resize', resize3DAvatar);
        particleCanvas = null;
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[HeroView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '页面加载失败',
                    desc: '小管家在加载欢迎页时遇到了一点小问题~',
                    primaryAction: '重试',
                    secondaryAction: '前往首页',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
                    },
                    onSecondaryAction: function() {
                        if (App.switchView) {
                            App.switchView('home');
                        }
                    }
                });
            }
            if (window.Toast && Toast.error) {
                Toast.error('页面加载出错了');
            }
        }
    }

    function safeInit(containerEl) {
        try {
            init(containerEl);
        } catch (e) {
            console.error('[HeroView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            if (typeof viewEnter === 'function') {
                viewEnter(containerEl);
            }
        } catch (e) {
            console.error('[HeroView] viewEnter error:', e);
        }
    }

    return {
        render: safeRender,
        init: safeInit,
        destroy: destroy
    };
})();
