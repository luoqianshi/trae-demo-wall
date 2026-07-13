var HomeView = (function() {
    var container = null;
    var el = {};

    var USE_25D_SCENE = true;
    var PIXEL_STYLE_ENABLED = true;
    var PIXEL_GRID_SIZE = 8;
    var scene25d = null;
    var objectManager = null;
    var progressSync = null;
    var nianSprite = null;
    var nianIs3D = false;
    var scene25dContainer = null;
    var isScenePaused = false;
    var regionManager = null;
    var stageRegionMapper = null;
    var sceneInteraction = null;
    var ambientLighting = null;
    var stageTransition = null;
    var _nian3DScriptLoaded = false;
    var _nian3DScriptLoading = false;
    var _nian3DScriptCallbacks = [];

    var autoChatTimer = null;
    var autoChatInterval = 8000;
    var isAutoChatPaused = false;
    var nianOriginalPosition = { x: 350, y: 280 };
    var isNianGuiding = false;
    var nianStateQueue = [];
    var isNianStateTransitioning = false;
    var collectionModal = null;
    var speechBubble = null;
    var lastSpeechState = null;
    var characterStateMachine = null;
    var _lastViewedRegionId = null;

    function cacheElements() {
        el.backBtn = document.getElementById('home-back-btn');
        el.nian = document.getElementById('home-nian');
        el.speechBubble = document.getElementById('nian-speech-bubble');
        el.particlesCanvas = document.getElementById('home-particles-canvas');
        el.sceneContainer = document.getElementById('home-scene-container');
        el.scene25dContainer = document.getElementById('home-scene-25d-container');
        el.sopBtn = document.getElementById('home-go-sop-btn');
        el.budgetBtn = document.getElementById('home-go-budget-btn');
        el.timelineBtn = document.getElementById('home-timeline-btn');
        el.dailyTasksBtn = document.getElementById('home-daily-tasks-btn');
        el.assetBtn = document.getElementById('home-asset-btn');
        el.resetBtn = document.querySelector('.home-reset-btn');
        el.resetModal = document.getElementById('home-reset-modal');
        el.resetCancelBtn = document.getElementById('reset-cancel-btn');
        el.resetConfirmBtn = document.getElementById('reset-confirm-btn');
        el.equipmentModal = document.getElementById('home-equipment-modal');
        el.equipIcon = document.getElementById('equip-icon');
        el.equipName = document.getElementById('equip-name');
        el.equipDesc = document.getElementById('equip-desc');
        el.equipAcceptBtn = document.getElementById('equip-accept-btn');
        el.levelUpModal = document.getElementById('home-levelup-modal');
        el.levelUpConfirmBtn = document.getElementById('levelup-confirm-btn');
        el.levelUpLevelName = document.getElementById('levelup-level-name');
        el.levelUpStars = document.getElementById('levelup-stars');
        el.levelUpSubtitle = document.getElementById('levelup-subtitle');
        el.levelUpRewardsSection = document.getElementById('levelup-rewards-section');
        el.levelUpRewardsList = document.getElementById('levelup-rewards-list');
        el.levelUpParticles = document.getElementById('levelup-particles');
        el.collectionBtn = document.getElementById('home-collection-btn');
        el.collectionModal = document.getElementById('home-collection-modal');
        el.collectionCloseBtn = document.getElementById('collection-close-btn');
        el.achievementBtn = document.getElementById('home-achievement-btn');
        el.achievementModal = document.getElementById('achievement-modal');
        el.achievementCloseBtn = document.getElementById('achievement-close-btn');
    }

    function clearElementCache() {
        el = {};
    }

    var nianClickCount = 0;
    var eventUnsubscribers = [];
    var timers = [];
    var nian3dAvatarInstance = null;
    var currentExpDisplay = 0;
    var expAnimationTimer = null;

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

    function destroyNian3DAvatar() {
        if (nian3dAvatarInstance) {
            nian3dAvatarInstance.destroy();
            nian3dAvatarInstance = null;
        }
        window.removeEventListener('resize', resizeNian3DAvatar);
    }

    function resizeNian3DAvatar() {
        if (!nian3dAvatarInstance) return;
        var container3d = document.getElementById('home-nian-3d-container');
        if (!container3d) return;
        var size = container3d.offsetWidth;
        if (size > 0) {
            nian3dAvatarInstance.setSize(size);
        }
    }

    function initNian3DAvatar() {
        var container3d = document.getElementById('home-nian-3d-container');
        if (!container3d) return;

        if (typeof Nian3DAvatar === 'undefined') {
            console.warn('[HomeView] Nian3DAvatar not available, using fallback image');
            return;
        }

        if (!Nian3DAvatar.isSupported()) {
            console.warn('[HomeView] WebGL not supported, using fallback image');
            return;
        }

        var size = container3d.offsetWidth || 80;

        nian3dAvatarInstance = Nian3DAvatar.create({
            container: container3d,
            size: size,
            expression: 'happy',
            interactive: true,
            autoRotate: false
        });

        if (nian3dAvatarInstance) {
            var fallbackImg = container3d.querySelector('.nian-3d-fallback');
            if (fallbackImg) {
                fallbackImg.style.display = 'none';
            }
            window.addEventListener('resize', resizeNian3DAvatar);
        }
    }

    var LEVELS = [
        { level: 1, name: '见习管家', minSteps: 0, maxSteps: 1, emoji: 'nian-default' },
        { level: 2, name: '初级管家', minSteps: 2, maxSteps: 4, emoji: 'nian-default' },
        { level: 3, name: '资深管家', minSteps: 5, maxSteps: 10, emoji: 'nian-default' },
        { level: 4, name: '金牌管家', minSteps: 11, maxSteps: 16, emoji: 'nian-default' },
        { level: 5, name: '首席管家', minSteps: 17, maxSteps: 20, emoji: 'nian-default' }
    ];

    var STAGE_EQUIPMENT = [
        { stage: 1, name: '设计蓝图', icon: 'scroll', desc: '开启装修之旅的第一张设计图纸' },
        { stage: 2, name: '工匠锤', icon: 'hammer', desc: '结构改造的得力工具' },
        { stage: 3, name: '油漆刷', icon: 'paintbrush', desc: '为新家添上温暖色彩' },
        { stage: 4, name: '金钥匙', icon: 'key', desc: '主材安装完成的荣耀象征' },
        { stage: 5, name: '装饰花瓶', icon: 'vase', desc: '软装让家更有温度' },
        { stage: 6, name: '乔迁喜帖', icon: 'gift', desc: '恭喜！新家入住啦！' }
    ];

    var NIAN_MESSAGES_BY_STAGE = [
        [
            '装修准备得怎么样啦？风格定好了吗？',
            '有什么装修上的问题随时问我哦~',
            '第一步很重要的，咱们慢慢来~',
            '需要我给您讲讲装修流程吗？',
            '别着急，我们一步一步来~',
            '您对装修风格有想法了吗？'
        ],
        [
            '现在在做结构改造吧？注意安全哦~',
            '水电改造可是隐蔽工程，要仔细把关~',
            '有什么问题随时找我商量~',
            '这一步很关键，有什么不懂的问我~',
            '记得多去现场看看哦~',
            '防水一定要做好，不然后期麻烦~'
        ],
        [
            '瓦工木工进行中，家慢慢有样子了吧？',
            '瓷砖贴得怎么样啦？空鼓率检查了吗？',
            '柜子做出来效果满意吗？',
            '这时候最有成就感了，看着家一点点变好~',
            '有什么选材上的问题可以问我~',
            '记得验收要仔细哦~'
        ],
        [
            '油漆和软装阶段啦，马上就要完工了！',
            '墙面颜色选好了吗？上墙效果怎么样？',
            '地板铺好了吗？脚感是不是很舒服？',
            '灯具选得怎么样了？氛围感很重要哦~',
            '现在可以开始看家具了呢~',
            '越到最后越要耐心，细节决定品质~'
        ],
        [
            '保洁都做好了吧？是不是亮堂堂的？',
            '家具都进场了吗？家的感觉出来了吧？',
            '家电都调试好了吗？',
            '马上就能住新家了，激动不激动？',
            '入住前记得测甲醛哦~',
            '搬家的时候记得保护好家具和地板~'
        ],
        [
            '恭喜恭喜！终于住新家啦！',
            '乔迁之喜！小管家也替您开心~',
            '住得还习惯吗？有什么问题随时找我~',
            '新家收拾得怎么样啦？',
            '记得有质保期的，有问题及时找装修公司~',
            '祝您在新家里每天都开开心心的~'
        ]
    ];

    function ensureHomeData() {
        if (App && typeof App.getHomeData === 'function') {
            var data = App.getHomeData();
            if (!data) {
                data = {
                    level: 1,
                    exp: 0,
                    jades: 0,
                    signDays: 7,
                    awardedStages: []
                };
                App.setHomeData(data);
            }
            return data;
        }
        
        if (!App.state.userData.homeData) {
            App.state.userData.homeData = {
                level: 1,
                exp: 0,
                jades: 0,
                signDays: 7,
                awardedStages: []
            };
            App.saveState();
        }
        return App.state.userData.homeData;
    }

    function saveHomeData(data) {
        if (App && typeof App.setHomeData === 'function') {
            App.setHomeData(data);
        } else {
            App.state.userData.homeData = data;
            App.saveState();
        }
    }

    function getCurrentLevel(completedSteps) {
        for (var i = LEVELS.length - 1; i >= 0; i--) {
            if (completedSteps >= LEVELS[i].minSteps) {
                return LEVELS[i];
            }
        }
        return LEVELS[0];
    }

    function getLevelProgressPercent(completedSteps) {
        var currentLevel = getCurrentLevel(completedSteps);
        var nextLevel = null;
        for (var i = 0; i < LEVELS.length; i++) {
            if (LEVELS[i].level === currentLevel.level + 1) {
                nextLevel = LEVELS[i];
                break;
            }
        }
        if (!nextLevel) return 100;
        var levelSteps = completedSteps - currentLevel.minSteps;
        var totalLevelSteps = nextLevel.minSteps - currentLevel.minSteps;
        return totalLevelSteps > 0 ? Math.min(100, Math.round((levelSteps / totalLevelSteps) * 100)) : 100;
    }

    function getCompletedStepsCount() {
        var mode = App.getDecorationMode();
        var sopProgress = App.state.sopProgress;
        if (!sopProgress || !sopProgress[mode] || !sopProgress[mode].completedSteps) {
            return 0;
        }
        return sopProgress[mode].completedSteps.length;
    }

    function getCurrentStage() {
        var mode = App.getDecorationMode();
        var sopProgress = App.state.sopProgress;
        var modeProgress = sopProgress && sopProgress[mode] ? sopProgress[mode] : null;
        
        if (!modeProgress || !modeProgress.completedSteps || modeProgress.completedSteps.length === 0) {
            return 0;
        }
        
        var maxCompletedStage = 0;
        var completed = modeProgress.completedSteps;
        
        for (var i = 0; i < completed.length; i++) {
            var match = completed[i].match(/^[FHS](\d+)-/);
            if (match) {
                var stageNum = parseInt(match[1]);
                if (stageNum >= 1 && stageNum <= 6 && stageNum > maxCompletedStage) {
                    maxCompletedStage = stageNum;
                }
            }
        }
        
        return maxCompletedStage;
    }

    function getHouseScore() {
        var total = 20;
        var completed = getCompletedStepsCount();
        return Math.round((completed / total) * 100);
    }

    function getCultivationLevelInfo() {
        if (typeof CultivationData === 'undefined') {
            var completedSteps = getCompletedStepsCount();
            var level = getCurrentLevel(completedSteps);
            return {
                level: level.level,
                title: level.name,
                exp: completedSteps,
                totalExp: completedSteps,
                progress: getLevelProgressPercent(completedSteps),
                expForNextLevel: level.maxSteps ? Math.max(0, level.maxSteps - completedSteps) : 0,
                isMaxLevel: !level.maxSteps
            };
        }

        var level = CultivationData.getLevel();
        var title = CultivationData.getTitle();
        var exp = CultivationData.getExp();
        var totalExp = CultivationData.getTotalExp();
        var progress = CultivationData.getLevelProgress();
        var expForNext = CultivationData.getExpForNextLevel();

        return {
            level: level,
            title: title,
            exp: exp,
            totalExp: totalExp,
            progress: progress,
            expForNextLevel: expForNext || 0,
            isMaxLevel: expForNext === null
        };
    }

    function buildLevelBadgeHTML() {
        var info = getCultivationLevelInfo();
        var nextLevelExp = info.isMaxLevel ? '已达最高等级' : '下一级还需 ' + info.expForNextLevel + ' 经验';
        var currentLevelExp = info.isMaxLevel ? '总经验 ' + info.totalExp : info.exp + ' / ' + getLevelRangeExp(info.level);
        
        return `
            <div class="home-level-info" data-tooltip="总经验：${info.totalExp}">
                <div class="home-level-title">
                    <span class="home-level-num">Lv.${info.level}</span>
                    <span class="home-level-name">${info.title}</span>
                </div>
                <div class="home-level-progress-bar">
                    <div class="home-level-progress-fill" style="width: ${info.progress}%"></div>
                    <div class="home-level-exp-text">${info.exp} / ${getLevelRangeExp(info.level)}</div>
                </div>
                <div class="home-level-meta">
                    <span>总经验 ${info.totalExp}</span>
                    <span>${nextLevelExp}</span>
                </div>
            </div>
        `;
    }

    function getLevelRangeExp(level) {
        if (typeof CultivationData !== 'undefined') {
            var levelConfig = CultivationData.getLevelConfig();
            var current = levelConfig[level - 1];
            var next = levelConfig[level];
            if (!current) return 0;
            if (!next) return current.exp;
            return next.exp - current.exp;
        }
        return 0;
    }

    function animateLevelProgress() {
        var progressFill = document.querySelector('.home-level-progress-fill');
        if (!progressFill) return;

        progressFill.classList.add('bounce');
        addTimer(setTimeout(function() {
            progressFill.classList.remove('bounce');
        }, 500));
    }

    function showExpGainNotification(amount) {
        if (!container) return;

        var badge = container.querySelector('.home-level-badge');
        if (!badge) return;

        var notification = document.createElement('div');
        notification.className = 'exp-gain-notification';
        notification.innerHTML = '+ ' + amount + ' 经验';
        badge.appendChild(notification);

        addTimer(setTimeout(function() {
            notification.classList.add('visible');
        }, 10));

        addTimer(setTimeout(function() {
            notification.classList.remove('visible');
            addTimer(setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300));
        }, 1500));
    }

    function getJades() {
        var homeData = ensureHomeData();
        return homeData.jades;
    }

    function getSignDays() {
        var homeData = ensureHomeData();
        return homeData.signDays;
    }

    function buildSceneSVG() {
        var currentStage = getCurrentStage();
        var stageVisibility = [];
        for (var i = 0; i <= 6; i++) {
            stageVisibility.push(currentStage >= i ? 'visible' : '');
        }

        return `
            <svg class="home-scene-svg" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#F5F0E8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#E8E0D0;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#D4C4A8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#C4B498;stop-opacity:1" />
                    </linearGradient>
                    <pattern id="floorPattern" patternUnits="userSpaceOnUse" width="40" height="40">
                        <rect width="40" height="40" fill="url(#floorGradient)"/>
                        <line x1="0" y1="20" x2="40" y2="20" stroke="#B8A888" stroke-width="1"/>
                        <line x1="20" y1="0" x2="20" y2="20" stroke="#B8A888" stroke-width="1"/>
                        <line x1="0" y1="20" x2="0" y2="40" stroke="#B8A888" stroke-width="1"/>
                        <line x1="40" y1="20" x2="40" y2="40" stroke="#B8A888" stroke-width="1"/>
                    </pattern>
                </defs>

                <rect x="0" y="0" width="500" height="250" fill="url(#wallGradient)"/>
                <rect x="0" y="250" width="500" height="100" fill="url(#floorPattern)"/>
                <line x1="0" y1="250" x2="500" y2="250" stroke="#B8A888" stroke-width="2"/>

                <line x1="20" y1="10" x2="20" y2="250" stroke="#8B6F47" stroke-width="2" opacity="0.3"/>
                <line x1="480" y1="10" x2="480" y2="250" stroke="#8B6F47" stroke-width="2" opacity="0.3"/>
                <line x1="20" y1="10" x2="480" y2="10" stroke="#8B6F47" stroke-width="2" opacity="0.3"/>

                <g class="home-scene-element stage-1 ${stageVisibility[1]} stagger-1">
                    <g transform="translate(80, 80)">
                        <rect x="0" y="0" width="80" height="60" fill="#FAF7F2" stroke="#8B6F47" stroke-width="2" rx="2"/>
                        <line x1="10" y1="15" x2="70" y2="15" stroke="#4A6FA5" stroke-width="1.5"/>
                        <line x1="10" y1="25" x2="60" y2="25" stroke="#5B8C5A" stroke-width="1.5"/>
                        <line x1="10" y1="35" x2="50" y2="35" stroke="#C84A3E" stroke-width="1.5"/>
                        <rect x="10" y="45" width="30" height="8" fill="#E5DFD3" rx="1"/>
                        <g transform="translate(55, 42)">
                            <polygon points="10,0 20,18 0,18" fill="none" stroke="#4A6FA5" stroke-width="1.5"/>
                            <line x1="10" y1="6" x2="10" y2="18" stroke="#4A6FA5" stroke-width="1"/>
                        </g>
                    </g>
                    <g transform="translate(380, 100)">
                        <rect x="0" y="20" width="60" height="8" fill="#D4A574" rx="2"/>
                        <circle cx="5" cy="24" r="4" fill="#8B6F47"/>
                        <circle cx="55" cy="24" r="4" fill="#8B6F47"/>
                        <line x1="15" y1="18" x2="15" y2="30" stroke="#666" stroke-width="1"/>
                        <rect x="8" y="6" width="24" height="6" fill="#D4A574" rx="1"/>
                        <line x1="14" y1="6" x2="14" y2="12" stroke="#8B6F47" stroke-width="0.8"/>
                        <line x1="18" y1="6" x2="18" y2="12" stroke="#8B6F47" stroke-width="0.8"/>
                        <line x1="22" y1="6" x2="22" y2="12" stroke="#8B6F47" stroke-width="0.8"/>
                        <line x1="26" y1="6" x2="26" y2="12" stroke="#8B6F47" stroke-width="0.8"/>
                    </g>
                    <g transform="translate(350, 160)">
                        <rect x="0" y="0" width="100" height="70" fill="#FAF7F2" stroke="#8B6F47" stroke-width="1.5" rx="3" transform="rotate(-5, 50, 35)"/>
                        <line x1="10" y1="20" x2="90" y2="20" stroke="#CCC" stroke-width="1" transform="rotate(-5, 50, 35)"/>
                        <line x1="10" y1="35" x2="80" y2="35" stroke="#CCC" stroke-width="1" transform="rotate(-5, 50, 35)"/>
                        <line x1="10" y1="50" x2="70" y2="50" stroke="#CCC" stroke-width="1" transform="rotate(-5, 50, 35)"/>
                        <text x="30" y="60" font-size="14" fill="#8B6F47" transform="rotate(-5, 50, 35)">设计图</text>
                    </g>
                </g>

                <g class="home-scene-element stage-2 ${stageVisibility[2]} stagger-2">
                    <g transform="translate(50, 180)">
                        <ellipse cx="30" cy="35" rx="28" ry="10" fill="#FFD700"/>
                        <rect x="5" y="5" width="50" height="30" fill="#FFD700" rx="3"/>
                        <rect x="12" y="0" width="36" height="8" fill="#FFF"/>
                        <g transform="translate(8, 14)">
                            <path d="M0,14 Q10,-2 20,14" fill="none" stroke="#8B6F47" stroke-width="2"/>
                            <line x1="10" y1="2" x2="10" y2="14" stroke="#8B6F47" stroke-width="1.5"/>
                        </g>
                    </g>
                    <g transform="translate(120, 190)">
                        <rect x="0" y="10" width="60" height="45" fill="#C84A3E" rx="3"/>
                        <rect x="0" y="0" width="60" height="15" fill="#A03A30" rx="3"/>
                        <rect x="15" y="20" width="30" height="20" fill="#8B6F47" rx="2"/>
                        <g transform="translate(22, 22)">
                            <line x1="8" y1="0" x2="8" y2="5" stroke="#666" stroke-width="1.5"/>
                            <line x1="3" y1="3" x2="13" y2="3" stroke="#666" stroke-width="1.5"/>
                            <rect x="5" y="5" width="6" height="10" fill="#A03A30" rx="1"/>
                        </g>
                    </g>
                    <g transform="translate(400, 200)">
                        <rect x="0" y="15" width="55" height="40" fill="#B8A888" rx="2"/>
                        <rect x="5" y="10" width="45" height="10" fill="#A89878"/>
                        <text x="10" y="42" font-size="12" fill="#666">水泥</text>
                    </g>
                    <g transform="translate(350, 210)">
                        <rect x="0" y="15" width="50" height="38" fill="#C8B898" rx="2"/>
                        <rect x="5" y="10" width="40" height="10" fill="#B8A888"/>
                        <text x="8" y="40" font-size="12" fill="#666">水泥</text>
                    </g>
                </g>

                <g class="home-scene-element stage-3 ${stageVisibility[3]} stagger-3">
                    <g transform="translate(40, 30)">
                        <rect x="0" y="0" width="70" height="90" fill="#F0EBE1" stroke="#8B6F47" stroke-width="2" rx="4"/>
                        <line x1="35" y1="0" x2="35" y2="90" stroke="#8B6F47" stroke-width="1.5"/>
                        <line x1="0" y1="45" x2="70" y2="45" stroke="#8B6F47" stroke-width="1.5"/>
                        <circle cx="55" cy="70" r="5" fill="#FFD700"/>
                    </g>
                    <g transform="translate(390, 40)">
                        <rect x="0" y="0" width="70" height="80" fill="#87CEEB" stroke="#8B6F47" stroke-width="2" rx="4"/>
                        <line x1="35" y1="0" x2="35" y2="80" stroke="#8B6F47" stroke-width="1.5"/>
                        <line x1="0" y1="40" x2="70" y2="40" stroke="#8B6F47" stroke-width="1.5"/>
                        <path d="M 5 5 Q 20 0 35 5 Q 50 0 65 5" stroke="#8B6F47" stroke-width="2" fill="none"/>
                    </g>
                    <g transform="translate(200, 40)">
                        <line x1="0" y1="0" x2="100" y2="0" stroke="#8B6F47" stroke-width="2"/>
                        <line x1="10" y1="0" x2="10" y2="60" stroke="#8B6F47" stroke-width="1"/>
                        <line x1="30" y1="0" x2="30" y2="60" stroke="#8B6F47" stroke-width="1"/>
                        <line x1="50" y1="0" x2="50" y2="60" stroke="#8B6F47" stroke-width="1"/>
                        <line x1="70" y1="0" x2="70" y2="60" stroke="#8B6F47" stroke-width="1"/>
                        <line x1="90" y1="0" x2="90" y2="60" stroke="#8B6F47" stroke-width="1"/>
                    </g>
                    <rect x="0" y="0" width="500" height="250" fill="url(#wallGradient)" opacity="0.85"/>
                    <rect x="0" y="0" width="500" height="250" fill="none" stroke="#8B6F47" stroke-width="3" opacity="0.2"/>
                </g>

                <g class="home-scene-element stage-4 ${stageVisibility[4]} stagger-4">
                    <g transform="translate(50, 180)">
                        <rect x="0" y="10" width="120" height="50" fill="#8B5A3C" rx="4"/>
                        <rect x="5" y="0" width="110" height="20" fill="#A06A4C" rx="4"/>
                        <rect x="10" y="25" width="50" height="30" fill="#6B4A2C" rx="2"/>
                        <rect x="65" y="25" width="50" height="30" fill="#6B4A2C" rx="2"/>
                    </g>
                    <g transform="translate(180, 200)">
                        <rect x="0" y="0" width="80" height="40" fill="#C4A060" rx="2"/>
                        <rect x="5" y="5" width="70" height="30" fill="#D4B070" rx="1"/>
                        <g transform="translate(22, 8)">
                            <circle cx="18" cy="6" r="8" fill="none" stroke="#8B6F47" stroke-width="1.5"/>
                            <path d="M12,6 Q18,2 24,6" fill="none" stroke="#8B6F47" stroke-width="1"/>
                        </g>
                    </g>
                    <g transform="translate(350, 190)">
                        <rect x="0" y="15" width="100" height="50" fill="#7A5C3E" rx="3"/>
                        <rect x="10" y="0" width="80" height="25" fill="#8B6F47" rx="2"/>
                        <rect x="20" y="30" width="25" height="25" fill="#5A3C2E" rx="1"/>
                        <rect x="55" y="30" width="25" height="25" fill="#5A3C2E" rx="1"/>
                        <g transform="translate(30, 4)">
                            <rect x="0" y="2" width="30" height="18" fill="#555" rx="2"/>
                            <rect x="3" y="5" width="24" height="12" fill="#87CEEB" rx="1"/>
                        </g>
                    </g>
                    <g transform="translate(220, 220)">
                        <rect x="0" y="0" width="60" height="25" fill="#8B6F47" rx="2"/>
                        <rect x="5" y="-20" width="50" height="25" fill="#9B7F57" rx="2"/>
                        <rect x="8" y="-15" width="44" height="18" fill="#B89868" rx="1"/>
                    </g>
                    <g transform="translate(100, 225)">
                        <rect x="0" y="0" width="20" height="20" fill="#7A5C3E" rx="2"/>
                        <rect x="-3" y="-8" width="26" height="10" fill="#8B6F47" rx="2"/>
                    </g>
                    <g transform="translate(150, 225)">
                        <rect x="0" y="0" width="20" height="20" fill="#7A5C3E" rx="2"/>
                        <rect x="-3" y="-8" width="26" height="10" fill="#8B6F47" rx="2"/>
                    </g>
                </g>

                <g class="home-scene-element stage-5 ${stageVisibility[5]} stagger-5">
                    <g transform="translate(240, 15)">
                        <circle cx="20" cy="25" r="18" fill="#FFF8DC" opacity="0.8"/>
                        <circle cx="20" cy="25" r="12" fill="#FFD700" opacity="0.6"/>
                        <line x1="20" y1="2" x2="20" y2="8" stroke="#FFD700" stroke-width="2"/>
                        <line x1="20" y1="42" x2="20" y2="48" stroke="#FFD700" stroke-width="2"/>
                        <line x1="-3" y1="25" x2="3" y2="25" stroke="#FFD700" stroke-width="2"/>
                        <line x1="37" y1="25" x2="43" y2="25" stroke="#FFD700" stroke-width="2"/>
                    </g>
                    <g transform="translate(60, 30)">
                        <path d="M 0 0 Q 15 10 30 0 Q 45 10 60 0 L 60 80 Q 45 70 30 80 Q 15 70 0 80 Z" fill="#C84A3E" opacity="0.7"/>
                        <path d="M 5 0 Q 15 8 25 0 Q 35 8 45 0 Q 55 8 55 75 Q 45 68 35 75 Q 25 68 15 75 Q 5 68 5 0" fill="#E85D50" opacity="0.5"/>
                    </g>
                    <g transform="translate(410, 30)">
                        <path d="M 0 0 Q 15 10 30 0 Q 45 10 60 0 L 60 80 Q 45 70 30 80 Q 15 70 0 80 Z" fill="#4A6FA5" opacity="0.6"/>
                        <path d="M 5 0 Q 15 8 25 0 Q 35 8 45 0 Q 55 8 55 75 Q 45 68 35 75 Q 25 68 15 75 Q 5 68 5 0" fill="#5A7FB5" opacity="0.4"/>
                    </g>
                    <g transform="translate(180, 70)">
                        <rect x="0" y="0" width="50" height="40" fill="#8B6F47" rx="2"/>
                        <rect x="5" y="5" width="40" height="30" fill="#FAF7F2"/>
                        <g transform="translate(10, 8)">
                            <rect x="0" y="0" width="30" height="20" fill="none" stroke="#8B6F47" stroke-width="1.5"/>
                            <polygon points="15,4 20,10 10,10" fill="#87CEEB" stroke="#4A6FA5" stroke-width="0.8"/>
                            <polygon points="8,14 12,10 4,10" fill="#5B8C5A" stroke="#3B6C3A" stroke-width="0.8"/>
                        </g>
                    </g>
                    <g transform="translate(280, 75)">
                        <rect x="0" y="0" width="45" height="35" fill="#6B4A2C" rx="2"/>
                        <rect x="4" y="4" width="37" height="27" fill="#F5F0E8"/>
                        <g transform="translate(8, 6)">
                            <polygon points="10,18 0,8 5,8 3,0 7,0 9,8 12,2 15,8 20,8" fill="#5B8C5A" stroke="#3B6C3A" stroke-width="0.5"/>
                            <rect x="0" y="18" width="22" height="5" fill="#87CEEB" rx="1"/>
                        </g>
                    </g>
                    <g transform="translate(350, 210)">
                        <rect x="0" y="15" width="35" height="30" fill="#C4A060" rx="3"/>
                        <ellipse cx="17" cy="15" rx="20" ry="12" fill="#5B8C5A"/>
                        <ellipse cx="10" cy="10" rx="12" ry="10" fill="#6B9C6A"/>
                        <ellipse cx="25" cy="8" rx="10" ry="8" fill="#7BAC7A"/>
                        <g transform="translate(2, -10)">
                            <ellipse cx="6" cy="4" rx="6" ry="3" fill="#5B8C5A" transform="rotate(-30, 6, 4)"/>
                        </g>
                    </g>
                    <g transform="translate(100, 205)">
                        <rect x="0" y="25" width="30" height="25" fill="#B89868" rx="2"/>
                        <ellipse cx="15" cy="20" rx="18" ry="15" fill="#5B8C5A"/>
                        <ellipse cx="8" cy="15" rx="10" ry="10" fill="#6B9C6A"/>
                        <g transform="translate(8, 2)">
                            <line x1="5" y1="12" x2="5" y2="4" stroke="#3B6C3A" stroke-width="1.5"/>
                            <ellipse cx="3" cy="4" rx="3" ry="4" fill="#5B8C5A" transform="rotate(20, 3, 4)"/>
                            <ellipse cx="7" cy="3" rx="3" ry="4" fill="#6B9C6A" transform="rotate(-15, 7, 3)"/>
                        </g>
                    </g>
                    <ellipse cx="250" cy="280" rx="120" ry="25" fill="#C84A3E" opacity="0.2"/>
                    <ellipse cx="250" cy="280" rx="100" ry="18" fill="#C84A3E" opacity="0.15"/>
                    <ellipse cx="250" cy="280" rx="70" ry="12" fill="#C84A3E" opacity="0.1"/>
                </g>

                <g class="home-scene-element stage-6 ${stageVisibility[6]} stagger-6">
                    <g transform="translate(420, 220)">
                        <rect x="0" y="10" width="40" height="35" fill="#A08060" rx="2"/>
                        <rect x="5" y="5" width="30" height="10" fill="#B89068"/>
                        <line x1="20" y1="15" x2="20" y2="35" stroke="#8B6F47" stroke-width="1"/>
                        <line x1="5" y1="25" x2="35" y2="25" stroke="#8B6F47" stroke-width="1"/>
                    </g>
                    <g transform="translate(60, 140)">
                        <polygon points="10,0 12,6 18,6 13,10 15,16 10,12 5,16 7,10 2,6 8,6" fill="#FFD700" stroke="#DAA520" stroke-width="0.5"/>
                    </g>
                    <g transform="translate(420, 140)">
                        <polygon points="10,0 12,6 18,6 13,10 15,16 10,12 5,16 7,10 2,6 8,6" fill="#FFD700" stroke="#DAA520" stroke-width="0.5"/>
                    </g>
                    <g transform="translate(150, 40)">
                        <polygon points="8,0 10,6 16,8 10,10 8,16 6,10 0,8 6,6" fill="#FFD700" opacity="0.8"/>
                    </g>
                    <g transform="translate(320, 50)">
                        <polygon points="8,0 10,6 16,8 10,10 8,16 6,10 0,8 6,6" fill="#FFD700" opacity="0.8"/>
                    </g>
                </g>
            </svg>
        `;
    }

    function buildNianDecorations(level) {
        var html = '';
        if (level >= 2) {
            html += '<div class="nian-decoration nian-ribbon"></div>';
        }
        if (level >= 3) {
            html += '<div class="nian-decoration nian-jade"></div>';
        }
        if (level >= 4) {
            html += '<div class="nian-decoration nian-cloud-aura"></div>';
        }
        if (level >= 5) {
            html += '<div class="nian-decoration nian-halo"></div>';
        }
        if (level >= 6) {
            html += '<div class="nian-decoration nian-crown"></div>';
        }
        if (level >= 7) {
            html += '<div class="nian-decoration nian-sparkles"></div>';
        }
        if (level >= 8) {
            html += '<div class="nian-decoration nian-cape"></div>';
        }
        if (level >= 9) {
            html += '<div class="nian-decoration nian-trophy"></div>';
        }
        if (level >= 10) {
            html += '<div class="nian-decoration nian-legendary-aura"></div>';
        }
        return html;
    }



    function renderDashboard() {
        var completedSteps = getCompletedStepsCount();
        var totalSteps = 20;
        var progressPercent = Math.round((completedSteps / totalSteps) * 100);

        var budgetTotal = 0;
        var budgetUsed = 0;
        var budgetPercent = 0;
        var budgetOverspent = false;

        if (App && App.getBudgetPlan) {
            var budgetPlan = App.getBudgetPlan();
            if (budgetPlan) {
                budgetTotal = budgetPlan.totalBudget || 0;
                budgetUsed = budgetPlan.totalSpent || 0;
                if (budgetTotal > 0) {
                    budgetPercent = Math.round((budgetUsed / budgetTotal) * 100);
                    budgetOverspent = budgetUsed > budgetTotal;
                }
            }
        }

        var currentStage = getCurrentStage();
        var totalStages = 6;
        var stagePercent = Math.round((currentStage / totalStages) * 100);

        var daysElapsed = 0;
        var totalDays = 90;
        var daysPercent = 0;
        var daysDelayed = false;

        var homeData = ensureHomeData();
        if (homeData.startDate) {
            var start = new Date(homeData.startDate);
            var now = new Date();
            daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            daysPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
            daysDelayed = daysElapsed > totalDays;
        }

        var nextTodo = '开始第一步装修';
        if (completedSteps > 0 && completedSteps < totalSteps) {
            nextTodo = '继续下一步装修';
        } else if (completedSteps >= totalSteps) {
            nextTodo = '装修已全部完成！';
        }

        return `
            <div class="home-quick-actions">
                <h3 class="section-title">
                    <span class="section-title-icon">⚡</span>
                    快捷操作
                </h3>
                <div class="quick-actions-grid">
                    <button class="quick-action-btn" data-action="quick-add-expense">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--zhu-red), var(--zhu-red-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </span>
                        <span class="quick-action-text">记支出</span>
                    </button>
                    <button class="quick-action-btn" data-action="quick-next-step">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--dai-blue), var(--dai-blue-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                        <span class="quick-action-text">下一步</span>
                    </button>
                    <button class="quick-action-btn" data-action="quick-search">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--zhu-green), var(--zhu-green-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </span>
                        <span class="quick-action-text">搜索</span>
                    </button>
                    <button class="quick-action-btn" data-action="quick-tools">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--gold), var(--gold-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                        </span>
                        <span class="quick-action-text">工具箱</span>
                    </button>
                    <button class="quick-action-btn" data-action="quick-knowledge">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--purple), var(--purple-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </span>
                        <span class="quick-action-text">知识库</span>
                    </button>
                    <button class="quick-action-btn" data-action="quick-more">
                        <span class="quick-action-icon" style="background: linear-gradient(135deg, var(--tan-brown), var(--tan-brown-light));">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </span>
                        <span class="quick-action-text">更多</span>
                    </button>
                </div>
            </div>

            <div class="home-dashboard">
                <div class="dashboard-card card dashboard-progress" data-action="sop">
                    <div class="dashboard-card-icon" style="background: linear-gradient(135deg, var(--dai-blue), var(--dai-blue-light));">
                        ${Icons.render('clipboard')}
                    </div>
                    <div class="dashboard-card-content">
                        <div class="dashboard-card-label">装修进度</div>
                        <div class="dashboard-card-value">
                            <span class="dashboard-card-num dashboard-count" data-target="${completedSteps}">${completedSteps}</span>
                            <span class="dashboard-card-total">/ ${totalSteps} 步</span>
                        </div>
                        <div class="dashboard-progress-bar">
                            <div class="dashboard-progress-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, var(--dai-blue), var(--dai-blue-light));"></div>
                        </div>
                    </div>
                    <div class="dashboard-card-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="dashboard-card card dashboard-budget ${budgetOverspent ? 'warning' : ''}" data-action="budget">
                    <div class="dashboard-card-icon" style="background: linear-gradient(135deg, var(--zhu-green), var(--zhu-green-light));">
                        ${Icons.render('coins')}
                    </div>
                    <div class="dashboard-card-content">
                        <div class="dashboard-card-label">预算使用</div>
                        <div class="dashboard-card-value">
                            <span class="dashboard-card-num">${budgetUsed > 0 ? (budgetUsed / 10000).toFixed(1) + '万' : '未设置'}</span>
                            <span class="dashboard-card-total">${budgetTotal > 0 ? ' / ' + (budgetTotal / 10000).toFixed(0) + '万' : ''}</span>
                        </div>
                        <div class="dashboard-progress-bar">
                            <div class="dashboard-progress-fill" style="width: ${budgetPercent}%; background: ${budgetOverspent ? 'var(--zhu-red)' : 'linear-gradient(90deg, var(--zhu-green), var(--zhu-green-light))'};"></div>
                        </div>
                        ${budgetOverspent ? '<div class="dashboard-warning-text">⚠️ 已超支</div>' : ''}
                    </div>
                    <div class="dashboard-card-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="dashboard-card card dashboard-timeline ${daysDelayed ? 'warning' : ''}" data-action="timeline">
                    <div class="dashboard-card-icon" style="background: linear-gradient(135deg, var(--gold), var(--gold-light));">
                        ${Icons.render('clock')}
                    </div>
                    <div class="dashboard-card-content">
                        <div class="dashboard-card-label">工期进度</div>
                        <div class="dashboard-card-value">
                            <span class="dashboard-card-num">${daysElapsed > 0 ? daysElapsed : '未开始'}</span>
                            <span class="dashboard-card-total">${daysElapsed > 0 ? ' / ' + totalDays + '天' : ''}</span>
                        </div>
                        <div class="dashboard-progress-bar">
                            <div class="dashboard-progress-fill" style="width: ${daysPercent}%; background: ${daysDelayed ? 'var(--zhu-red)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))'};"></div>
                        </div>
                        ${daysDelayed ? '<div class="dashboard-warning-text">⚠️ 已延误</div>' : ''}
                    </div>
                    <div class="dashboard-card-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="dashboard-card card dashboard-todo" data-action="sop">
                    <div class="dashboard-card-icon" style="background: linear-gradient(135deg, var(--zhu-red), var(--zhu-red-light));">
                        ${Icons.render('sparkles')}
                    </div>
                    <div class="dashboard-card-content">
                        <div class="dashboard-card-label">下一步</div>
                        <div class="dashboard-card-value dashboard-todo-text">
                            ${nextTodo}
                        </div>
                        <div class="dashboard-todo-hint">点击去完成 →</div>
                    </div>
                    <div class="dashboard-card-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }

    function renderKnowledgeSummary() {
        var completedSteps = getCompletedStepsCount();
        if (completedSteps === 0) return '';

        var knowledgePoints = [
            { stage: 1, icon: '📐', title: '设计规划要点', points: ['装修预算按532原则分配', '设计费参考50-150元/㎡', '合同付款建议分4-5次'] },
            { stage: 2, icon: '⚒️', title: '硬装施工要点', points: ['承重墙绝对不能拆', '水管走顶不走地', '防水需做48小时闭水试验'] },
            { stage: 3, icon: '🧱', title: '主材安装要点', points: ['瓷砖空鼓率不超过15%', '地板提前适应温度', '五金件选品牌更耐用'] },
            { stage: 4, icon: '🛋️', title: '软装搭配要点', points: ['灯具选可调光更实用', '马桶选虹吸式更静音', '窗帘选遮光布更舒适'] },
            { stage: 5, icon: '✨', title: '入住准备要点', points: ['开荒保洁找专业团队', '甲醛国标≤0.08mg/m³', '通风是最有效除醛方法'] },
            { stage: 6, icon: '🎉', title: '竣工验收要点', points: ['防水质保5年', '水电质保2年', '其他装修质保1年'] }
        ];

        var mode = App.getDecorationMode();
        var sopProgress = App.state.sopProgress || {};
        var modeProgress = sopProgress[mode] || { completedSteps: [] };
        var completedStepsList = modeProgress.completedSteps || [];
        var completedStages = [];
        for (var i = 1; i <= 6; i++) {
            var stageSteps = completedStepsList.filter(function(s) { return s.startsWith('S' + i + '-'); });
            if (stageSteps.length > 0) {
                completedStages.push(i);
            }
        }

        var earnedKnowledge = knowledgePoints.filter(function(k) {
            return completedStages.indexOf(k.stage) !== -1;
        });

        if (earnedKnowledge.length === 0) return '';

        return `
            <div class="home-knowledge-summary card">
                <div class="knowledge-header">
                    <div class="knowledge-icon">${Icons.render('lightbulb')}</div>
                    <div class="knowledge-title">知识总结</div>
                    <span class="knowledge-count">已获得 ${earnedKnowledge.length}/6 阶段知识</span>
                </div>
                <div class="knowledge-grid">
                    ${earnedKnowledge.map(function(k) {
                        return `
                            <div class="knowledge-card">
                                <div class="knowledge-card-icon">${k.icon}</div>
                                <div class="knowledge-card-title">${k.title}</div>
                                <ul class="knowledge-card-list">
                                    ${k.points.map(function(p) {
                                        return `<li>${p}</li>`;
                                    }).join('')}
                                </ul>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function buildEquipmentModal() {
        return `
            <div class="home-equipment-modal" id="home-equipment-modal">
                <div class="home-equipment-content">
                    <div class="home-equipment-icon" id="equip-icon">${Icons.render('party')}</div>
                    <div class="home-equipment-title">恭喜获得！</div>
                    <div class="home-equipment-name" id="equip-name">装备名称</div>
                    <div class="home-equipment-desc" id="equip-desc">装备描述</div>
                    <button class="home-equipment-btn" id="equip-accept-btn">收下</button>
                </div>
            </div>
        `;
    }

    function buildLevelUpModal() {
        return `
            <div class="home-levelup-modal" id="home-levelup-modal">
                <div class="home-levelup-particles" id="levelup-particles"></div>
                <div class="home-levelup-content">
                    <div class="home-levelup-big-nian">
                        <img src="images/nian-icons/nian-happy.png" width="128" height="128" alt="小管家"/>
                    </div>
                    <div class="home-levelup-title">等级进阶！</div>
                    <div class="home-levelup-subtitle" id="levelup-subtitle">小管家升级了~</div>
                    <div class="home-levelup-level" id="levelup-level-name">Lv.2 见习管家</div>
                    <div class="level-stars" id="levelup-stars"></div>
                    <div class="levelup-rewards-section" id="levelup-rewards-section" style="display:none;">
                        <div class="levelup-rewards-title">🎉 解锁新内容</div>
                        <div class="levelup-rewards-list" id="levelup-rewards-list"></div>
                    </div>
                    <button class="home-levelup-btn" id="levelup-confirm-btn">太棒了！</button>
                </div>
            </div>
        `;
    }

    function buildCollectionModal() {
        var totalCount = ObjectConfig ? ObjectConfig.getObjectCount() : 0;
        var completedCount = getCollectedObjectsCount();
        var roomCategories = ObjectConfig ? ObjectConfig.getRoomCategories() : {};
        var rarityConfig = ObjectConfig ? ObjectConfig.getRarityConfig() : {};

        var roomStats = {};
        for (var roomKey in roomCategories) {
            if (roomCategories.hasOwnProperty(roomKey)) {
                var roomObjects = ObjectConfig.getObjectsByRoomCategory(roomKey);
                var collected = 0;
                var completedSteps = getCompletedStepIds();
                for (var i = 0; i < roomObjects.length; i++) {
                    if (isObjectCollected(roomObjects[i].id, completedSteps)) {
                        collected++;
                    }
                }
                roomStats[roomKey] = {
                    total: roomObjects.length,
                    collected: collected
                };
            }
        }

        var rarityStats = {};
        var rarities = ['common', 'rare', 'epic', 'legendary'];
        for (var r = 0; r < rarities.length; r++) {
            var rarityObjects = ObjectConfig.getObjectsByRarity(rarities[r]);
            var rarityCollected = 0;
            var completedSteps2 = getCompletedStepIds();
            for (var j = 0; j < rarityObjects.length; j++) {
                if (isObjectCollected(rarityObjects[j].id, completedSteps2)) {
                    rarityCollected++;
                }
            }
            rarityStats[rarities[r]] = {
                total: rarityObjects.length,
                collected: rarityCollected,
                config: rarityConfig[rarities[r]]
            };
        }

        var rarityIcons = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };

        var rarityCardsHtml = rarities.map(function(rarity) {
            var stat = rarityStats[rarity];
            if (!stat || stat.total === 0) return '';
            return `
                <div class="collection-rarity-card ${rarity}">
                    <div class="collection-rarity-card-icon">${rarityIcons[rarity]}</div>
                    <div class="collection-rarity-card-count">${stat.collected}/${stat.total}</div>
                    <div class="collection-rarity-card-label">${stat.config.name}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="home-collection-modal" id="home-collection-modal">
                <div class="home-collection-content">
                    <div class="home-collection-header">
                        <div class="home-collection-title">🏠 家的图鉴</div>
                        <button class="home-collection-close" id="collection-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="home-collection-progress">
                        <div class="collection-progress-bar">
                            <div class="collection-progress-fill" style="width: ${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%"></div>
                        </div>
                        <div class="collection-progress-text">
                            已收集 <strong>${Math.min(completedCount, totalCount)}</strong> / ${totalCount} 件
                        </div>
                    </div>
                    <div class="collection-rarity-section">
                        <div class="collection-rarity-title">稀有度统计</div>
                        <div class="collection-rarity-grid">
                            ${rarityCardsHtml}
                        </div>
                    </div>
                    <div class="collection-tabs" id="collection-tabs">
                        <div class="collection-tab active" data-view="stage">📋 按阶段</div>
                        <div class="collection-tab" data-view="room">🏠 按房间</div>
                    </div>
                    <div class="home-collection-stages" id="collection-stages-container">
                        ${renderCollectionByStage()}
                    </div>
                </div>
            </div>
            <div class="collection-detail-modal" id="collection-detail-modal">
                <div class="collection-detail-content">
                    <div class="collection-detail-close" id="collection-detail-close">×</div>
                    <div class="collection-detail-icon" id="collection-detail-icon"></div>
                    <div class="collection-detail-name" id="collection-detail-name"></div>
                    <div class="collection-detail-rarity" id="collection-detail-rarity"></div>
                    <div class="collection-detail-room" id="collection-detail-room"></div>
                    <div class="collection-detail-desc" id="collection-detail-desc"></div>
                </div>
            </div>
        `;
    }

    function buildAchievementModal() {
        if (!AchievementSystem) return '';

        var progress = AchievementSystem.getOverallProgress();
        var unlockedCount = progress.unlocked;
        var totalCount = progress.total;
        var categories = AchievementSystem.getCategories();
        var rarityStats = AchievementSystem.getRarityStats();

        var categoryStats = categories.map(function(cat) {
            var catAchievements = AchievementSystem.getAchievementsByCategory(cat.id);
            var unlocked = catAchievements.filter(function(a) { return a.unlocked; }).length;
            return {
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                total: catAchievements.length,
                unlocked: unlocked,
                ratio: catAchievements.length > 0 ? Math.round((unlocked / catAchievements.length) * 100) : 0
            };
        }).filter(function(c) { return c.total > 0; });

        function renderAchievementDonutChart(stats, totalUnlocked, total) {
            var size = 140;
            var radius = 55;
            var strokeWidth = 14;
            var circumference = 2 * Math.PI * radius;

            var colors = ['#4a6f95', '#5b8c5a', '#8b6f47', '#c9a227', '#6b4e87', '#9ca3af'];
            var offset = 0;

            var visibleStats = stats.filter(function(s) { return s.total > 0; });

            var slicesHtml = visibleStats.map(function(stat, idx) {
                var overallRatio = total > 0 ? (stat.unlocked / total) : 0;
                var dashLength = circumference * overallRatio;
                var dashOffset = -offset;
                offset += dashLength;

                return `
                    <circle 
                        class="donut-slice"
                        data-category="${stat.id}"
                        cx="${size / 2}" 
                        cy="${size / 2}" 
                        r="${radius}" 
                        fill="none" 
                        stroke="${colors[idx % colors.length]}" 
                        stroke-width="${strokeWidth}"
                        stroke-dasharray="${dashLength} ${circumference}"
                        stroke-dashoffset="${dashOffset}"
                        style="transition: stroke-width 0.2s ease;"
                    ></circle>
                `;
            }).join('');

            var legendHtml = visibleStats.map(function(stat, idx) {
                return `
                    <div class="achievement-legend-item" data-category="${stat.id}">
                        <div class="achievement-legend-color" style="background: ${colors[idx % colors.length]};"></div>
                        <span class="achievement-legend-name">${stat.icon} ${stat.name}</span>
                        <span class="achievement-legend-value">${stat.unlocked}/${stat.total}</span>
                    </div>
                `;
            }).join('');

            var overallPercent = total > 0 ? Math.round((totalUnlocked / total) * 100) : 0;

            return `
                <div class="achievement-chart-section">
                    <div class="achievement-donut-chart">
                        <svg class="donut-chart-svg" viewBox="0 0 ${size} ${size}">
                            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="${strokeWidth}"></circle>
                            <g class="donut-slices">${slicesHtml}</g>
                        </svg>
                        <div class="donut-center-text">
                            <div class="donut-center-value">${overallPercent}%</div>
                            <div class="donut-center-label">完成度</div>
                        </div>
                    </div>
                    <div class="achievement-chart-legend">
                        ${legendHtml}
                    </div>
                </div>
            `;
        }

        function renderRaritySection() {
            var rarities = ['common', 'rare', 'epic', 'legendary'];
            var rarityIcons = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
            
            var cardsHtml = rarities.map(function(rarity) {
                var stat = rarityStats[rarity];
                if (!stat) return '';
                return `
                    <div class="achievement-rarity-card">
                        <div class="achievement-rarity-card-icon">${rarityIcons[rarity]}</div>
                        <div class="achievement-rarity-card-count">${stat.unlocked}/${stat.total}</div>
                        <div class="achievement-rarity-card-label">${stat.config.name}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="achievement-rarity-section">
                    <div class="achievement-rarity-title">稀有度统计</div>
                    <div class="achievement-rarity-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }

        var donutChartHtml = renderAchievementDonutChart(categoryStats, unlockedCount, totalCount);
        var raritySectionHtml = renderRaritySection();

        var visibleCategories = categories.filter(function(cat) {
            var catAch = AchievementSystem.getAchievementsByCategory(cat.id);
            return catAch.length > 0;
        });

        return `
            <div class="achievement-modal" id="achievement-modal">
                <div class="achievement-content">
                    <div class="achievement-header">
                        <div class="achievement-title">🏆 成就殿堂</div>
                        <button class="achievement-close" id="achievement-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="achievement-stats">
                        <div class="achievement-stat-item">
                            <div class="achievement-stat-value">${unlockedCount}/${totalCount}</div>
                            <div class="achievement-stat-label">成就解锁</div>
                        </div>
                        <div class="achievement-stat-item">
                            <div class="achievement-stat-value">${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%</div>
                            <div class="achievement-stat-label">总完成度</div>
                        </div>
                    </div>
                    ${donutChartHtml}
                    ${raritySectionHtml}
                    <div class="achievement-tabs" id="achievement-tabs">
                        <div class="achievement-tab active" data-category="all">全部</div>
                        ${visibleCategories.map(function(cat) {
                            return `<div class="achievement-tab" data-category="${cat.id}">${cat.icon} ${cat.name}</div>`;
                        }).join('')}
                    </div>
                    <div class="achievement-list" id="achievement-list">
                        ${renderAchievementList('all')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderAchievementList(category) {
        if (!AchievementSystem) return '';

        var achievements = AchievementSystem.getAchievementsByCategory(category);

        if (achievements.length === 0) {
            return '<div style="text-align:center;padding:40px;color:var(--secondary);font-size:var(--font-size-sm);">暂无成就</div>';
        }

        return achievements.map(function(a) {
            var rarityStars = '';
            var starCount = a.rarityConfig ? a.rarityConfig.stars || 1 : 1;
            for (var i = 0; i < starCount; i++) {
                rarityStars += '⭐';
            }
            
            return `
                <div class="achievement-item ${a.unlocked ? 'unlocked ' + a.rarity : 'locked'}">
                    <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">
                            ${a.unlocked ? a.name : '???'}
                            <span class="achievement-rarity ${a.rarity}">
                                <span class="achievement-rarity-stars">${rarityStars}</span>
                                ${a.rarityConfig ? a.rarityConfig.name : ''}
                            </span>
                        </div>
                        <div class="achievement-desc">${a.unlocked ? a.description : '继续探索解锁该成就'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderCollectionByStage() {
        if (!ObjectConfig) return '';

        var stages = ObjectConfig.getAllStages();
        var completedSteps = getCompletedStepIds();
        var html = '';
        var rarityConfig = ObjectConfig.getRarityConfig();

        for (var i = 0; i < stages.length; i++) {
            var stage = stages[i];
            var stageNum = parseInt(stage.id.replace('stage', ''));
            var stageObjects = stage.objects || [];
            var collectedCount = 0;

            for (var j = 0; j < stageObjects.length; j++) {
                if (isObjectCollected(stageObjects[j].id, completedSteps)) {
                    collectedCount++;
                }
            }

            var isUnlocked = stageNum <= getCurrentStage() + 1;

            html += `
                <div class="collection-stage ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="collection-stage-header">
                        <span class="collection-stage-name">${stage.name}</span>
                        <span class="collection-stage-count">${collectedCount}/${stageObjects.length}</span>
                    </div>
                    <div class="collection-stage-grid">
                        ${stageObjects.map(function(obj) {
                            var collected = isObjectCollected(obj.id, completedSteps);
                            var rarityStars = '';
                            var starCount = rarityConfig[obj.rarity] ? (obj.rarity === 'legendary' ? 4 : obj.rarity === 'epic' ? 3 : obj.rarity === 'rare' ? 2 : 1) : 1;
                            for (var s = 0; s < starCount; s++) {
                                rarityStars += '⭐';
                            }
                            return `
                                <div class="collection-item ${collected ? 'collected ' + obj.rarity : 'locked'}" 
                                     data-object-id="${obj.id}"
                                     title="${collected ? obj.name : '???'}">
                                    <div class="collection-item-icon">${collected ? obj.icon : '❓'}</div>
                                    <div class="collection-item-name">${collected ? obj.name : '???'}</div>
                                    ${collected ? `
                                        <div class="collection-item-rarity ${obj.rarity}">
                                            <span class="collection-item-rarity-stars">${rarityStars}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    function renderCollectionByRoom() {
        if (!ObjectConfig) return '';

        var roomCategories = ObjectConfig.getRoomCategories();
        var completedSteps = getCompletedStepIds();
        var html = '';
        var rarityConfig = ObjectConfig.getRarityConfig();

        for (var roomKey in roomCategories) {
            if (!roomCategories.hasOwnProperty(roomKey)) continue;

            var room = roomCategories[roomKey];
            var roomObjects = ObjectConfig.getObjectsByRoomCategory(roomKey);
            if (roomObjects.length === 0) continue;

            var collectedCount = 0;
            for (var i = 0; i < roomObjects.length; i++) {
                if (isObjectCollected(roomObjects[i].id, completedSteps)) {
                    collectedCount++;
                }
            }

            html += `
                <div class="collection-stage unlocked">
                    <div class="collection-stage-header">
                        <span class="collection-stage-name">${room.icon} ${room.name}</span>
                        <span class="collection-stage-count">${collectedCount}/${roomObjects.length}</span>
                    </div>
                    <div class="collection-stage-grid">
                        ${roomObjects.map(function(obj) {
                            var collected = isObjectCollected(obj.id, completedSteps);
                            var rarityStars = '';
                            var starCount = rarityConfig[obj.rarity] ? (obj.rarity === 'legendary' ? 4 : obj.rarity === 'epic' ? 3 : obj.rarity === 'rare' ? 2 : 1) : 1;
                            for (var s = 0; s < starCount; s++) {
                                rarityStars += '⭐';
                            }
                            return `
                                <div class="collection-item ${collected ? 'collected ' + obj.rarity : 'locked'}" 
                                     data-object-id="${obj.id}"
                                     title="${collected ? obj.name : '???'}">
                                    <div class="collection-item-icon">${collected ? obj.icon : '❓'}</div>
                                    <div class="collection-item-name">${collected ? obj.name : '???'}</div>
                                    ${collected ? `
                                        <div class="collection-item-rarity ${obj.rarity}">
                                            <span class="collection-item-rarity-stars">${rarityStars}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        var structureObjects = ObjectConfig.getObjectsByRoomCategory(null);
        if (structureObjects.length > 0) {
            var structureCollected = 0;
            for (var k = 0; k < structureObjects.length; k++) {
                if (isObjectCollected(structureObjects[k].id, completedSteps)) {
                    structureCollected++;
                }
            }

            html += `
                <div class="collection-stage unlocked">
                    <div class="collection-stage-header">
                        <span class="collection-stage-name">🔧 建材工具</span>
                        <span class="collection-stage-count">${structureCollected}/${structureObjects.length}</span>
                    </div>
                    <div class="collection-stage-grid">
                        ${structureObjects.map(function(obj) {
                            var collected = isObjectCollected(obj.id, completedSteps);
                            var rarityStars = '';
                            var starCount = rarityConfig[obj.rarity] ? (obj.rarity === 'legendary' ? 4 : obj.rarity === 'epic' ? 3 : obj.rarity === 'rare' ? 2 : 1) : 1;
                            for (var s = 0; s < starCount; s++) {
                                rarityStars += '⭐';
                            }
                            return `
                                <div class="collection-item ${collected ? 'collected ' + obj.rarity : 'locked'}" 
                                     data-object-id="${obj.id}"
                                     title="${collected ? obj.name : '???'}">
                                    <div class="collection-item-icon">${collected ? obj.icon : '❓'}</div>
                                    <div class="collection-item-name">${collected ? obj.name : '???'}</div>
                                    ${collected ? `
                                        <div class="collection-item-rarity ${obj.rarity}">
                                            <span class="collection-item-rarity-stars">${rarityStars}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    function showCollectionDetail(objectId) {
        var obj = ObjectConfig ? ObjectConfig.getConfig(objectId) : null;
        if (!obj) return;

        var collected = isObjectCollected(objectId, getCompletedStepIds());
        if (!collected) return;

        var detailModal = document.getElementById('collection-detail-modal');
        var detailIcon = document.getElementById('collection-detail-icon');
        var detailName = document.getElementById('collection-detail-name');
        var detailRarity = document.getElementById('collection-detail-rarity');
        var detailRoom = document.getElementById('collection-detail-room');
        var detailDesc = document.getElementById('collection-detail-desc');

        if (!detailModal) return;

        var rarityConfig = ObjectConfig.getRarityConfig();
        var roomCategories = ObjectConfig.getRoomCategories();
        var rarityInfo = rarityConfig[obj.rarity] || rarityConfig.common;
        var roomInfo = obj.roomCategory ? roomCategories[obj.roomCategory] : null;

        var rarityStars = '';
        var starCount = obj.rarity === 'legendary' ? 4 : obj.rarity === 'epic' ? 3 : obj.rarity === 'rare' ? 2 : 1;
        for (var s = 0; s < starCount; s++) {
            rarityStars += '⭐';
        }

        if (detailIcon) detailIcon.textContent = obj.icon;
        if (detailName) detailName.textContent = obj.name;
        if (detailRarity) {
            detailRarity.className = 'collection-detail-rarity ' + obj.rarity;
            detailRarity.innerHTML = '<span class="collection-detail-rarity-stars">' + rarityStars + '</span> ' + rarityInfo.name;
        }
        if (detailRoom) {
            if (roomInfo) {
                detailRoom.innerHTML = roomInfo.icon + ' ' + roomInfo.name;
                detailRoom.style.display = '';
            } else {
                detailRoom.style.display = 'none';
            }
        }
        if (detailDesc) detailDesc.textContent = obj.description || '暂无描述';

        detailModal.classList.add('active');
    }

    function hideCollectionDetail() {
        var detailModal = document.getElementById('collection-detail-modal');
        if (detailModal) {
            detailModal.classList.remove('active');
        }
    }

    function getCompletedStepIds() {
        var mode = App.getDecorationMode();
        var sopProgress = App.state.sopProgress;
        if (!sopProgress || !sopProgress[mode] || !sopProgress[mode].completedSteps) {
            return [];
        }
        return sopProgress[mode].completedSteps.slice();
    }

    function isObjectCollected(objectId, completedSteps) {
        if (!StepObjectMapping) return false;

        for (var i = 0; i < completedSteps.length; i++) {
            var objectIds = StepObjectMapping.getObjectIdsForStep(completedSteps[i]);
            if (objectIds && objectIds.indexOf(objectId) !== -1) {
                return true;
            }
        }
        return false;
    }

    function getCollectedObjectsCount() {
        if (!ObjectConfig || !StepObjectMapping) return 0;

        var completedSteps = getCompletedStepIds();
        var allObjects = ObjectConfig.getAllObjects();
        var count = 0;

        for (var i = 0; i < allObjects.length; i++) {
            if (isObjectCollected(allObjects[i].id, completedSteps)) {
                count++;
            }
        }
        return count;
    }

    function showCollectionModal() {
        if (!el.collectionModal) {
            el.collectionModal = document.getElementById('home-collection-modal');
        }
        if (!el.collectionModal) return;

        refreshCollectionContent('stage');
        el.collectionModal.classList.add('active');
        bindCollectionTabEvents();
        bindCollectionItemEvents();
        bindCollectionDetailEvents();
        pauseAutoChat();
    }

    function hideCollectionModal() {
        if (el.collectionModal) {
            el.collectionModal.classList.remove('active');
        }
        hideCollectionDetail();
        resumeAutoChat();
    }

    function bindCollectionTabEvents() {
        var tabs = document.querySelectorAll('#collection-tabs .collection-tab');
        var container = document.getElementById('collection-stages-container');
        if (!tabs || !container) return;

        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function(e) {
                var view = e.currentTarget.getAttribute('data-view');
                if (!view) return;

                for (var j = 0; j < tabs.length; j++) {
                    tabs[j].classList.remove('active');
                }
                e.currentTarget.classList.add('active');

                if (view === 'stage') {
                    container.innerHTML = renderCollectionByStage();
                } else if (view === 'room') {
                    container.innerHTML = renderCollectionByRoom();
                }
                bindCollectionItemEvents();
            });
        }
    }

    function bindCollectionItemEvents() {
        var items = document.querySelectorAll('.collection-item.collected');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function(e) {
                var objectId = e.currentTarget.getAttribute('data-object-id');
                if (objectId) {
                    showCollectionDetail(objectId);
                }
            });
        }
    }

    function bindCollectionDetailEvents() {
        var closeBtn = document.getElementById('collection-detail-close');
        var detailModal = document.getElementById('collection-detail-modal');

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hideCollectionDetail();
            });
        }

        if (detailModal) {
            detailModal.addEventListener('click', function(e) {
                if (e.target === detailModal) {
                    hideCollectionDetail();
                }
            });
        }
    }

    function showAchievementModal() {
        if (!el.achievementModal) {
            el.achievementModal = document.getElementById('achievement-modal');
        }
        if (!el.achievementModal) return;

        el.achievementModal.classList.add('active');
        bindAchievementTabEvents();
        pauseAutoChat();
    }

    function hideAchievementModal() {
        if (el.achievementModal) {
            el.achievementModal.classList.remove('active');
        }
        resumeAutoChat();
    }

    function bindAchievementTabEvents() {
        var tabs = document.querySelectorAll('#achievement-tabs .achievement-tab');
        var list = document.getElementById('achievement-list');
        if (!tabs || !list) return;

        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function(e) {
                var category = e.currentTarget.getAttribute('data-category');
                if (!category) return;

                for (var j = 0; j < tabs.length; j++) {
                    tabs[j].classList.remove('active');
                }
                e.currentTarget.classList.add('active');

                list.innerHTML = renderAchievementList(category);
            });
        }
    }

    function refreshCollectionContent(view) {
        var container = document.getElementById('collection-stages-container');
        if (!container) return;

        var currentView = view || 'stage';
        if (currentView === 'stage') {
            container.innerHTML = renderCollectionByStage();
        } else {
            container.innerHTML = renderCollectionByRoom();
        }

        var totalCount = ObjectConfig ? ObjectConfig.getObjectCount() : 0;
        var completedCount = getCollectedObjectsCount();
        var progressFill = document.querySelector('.collection-progress-fill');
        var progressText = document.querySelector('.collection-progress-text');

        if (progressFill) {
            progressFill.style.width = (totalCount > 0 ? Math.round((Math.min(completedCount, totalCount) / totalCount) * 100) : 0) + '%';
        }
        if (progressText) {
            progressText.innerHTML = '已收集 <strong>' + Math.min(completedCount, totalCount) + '</strong> / ' + totalCount + ' 件';
        }
    }
    
    var timelinePlayer = null;
    var timelineModalVisible = false;

    function buildTimelineModal() {
        return `
            <div class="home-timeline-modal" id="home-timeline-modal">
                <div class="home-timeline-overlay"></div>
                <div class="home-timeline-content">
                    <div class="home-timeline-header">
                        <div class="home-timeline-title">
                            ${Icons.render('clock')}
                            <span>装修时间线</span>
                        </div>
                        <button class="home-timeline-close" id="timeline-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="home-timeline-scene-wrapper">
                        <div class="home-timeline-scene" id="timeline-scene-container"></div>
                        <div class="home-timeline-stage-badge" id="timeline-stage-badge">毛坯阶段</div>
                    </div>
                    <div class="home-timeline-stage-info" id="timeline-stage-info">
                        <div class="timeline-stage-name">毛坯阶段</div>
                        <div class="timeline-stage-desc">空荡荡的毛坯房，一切从零开始</div>
                    </div>
                    <div class="home-timeline-progress">
                        <div class="timeline-progress-bar">
                            <div class="timeline-progress-fill" id="timeline-progress-fill"></div>
                        </div>
                        <div class="timeline-progress-text">
                            <span id="timeline-current-stage">第 0 阶段</span>
                            <span id="timeline-progress-percent">0%</span>
                        </div>
                    </div>
                    <div class="home-timeline-stages" id="timeline-stages">
                        <div class="timeline-stage-dot active" data-stage="0">
                            <div class="dot">0</div>
                            <div class="label">毛坯</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="1">
                            <div class="dot">1</div>
                            <div class="label">准备</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="2">
                            <div class="dot">2</div>
                            <div class="label">设计</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="3">
                            <div class="dot">3</div>
                            <div class="label">水电</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="4">
                            <div class="dot">4</div>
                            <div class="label">泥木</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="5">
                            <div class="dot">5</div>
                            <div class="label">安装</div>
                        </div>
                        <div class="timeline-stage-dot" data-stage="6">
                            <div class="dot">6</div>
                            <div class="label">软装</div>
                        </div>
                    </div>
                    <div class="home-timeline-controls">
                        <button class="timeline-control-btn" id="timeline-prev-btn" aria-label="上一阶段">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                                <line x1="5" y1="19" x2="5" y2="5"></line>
                            </svg>
                        </button>
                        <button class="timeline-control-btn play" id="timeline-play-btn" aria-label="播放/暂停">
                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        </button>
                        <button class="timeline-control-btn" id="timeline-next-btn" aria-label="下一阶段">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                <line x1="19" y1="5" x2="19" y2="19"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="home-timeline-speed">
                        <span>播放速度：</span>
                        <button class="speed-btn active" data-speed="1500">1x</button>
                        <button class="speed-btn" data-speed="800">2x</button>
                        <button class="speed-btn" data-speed="400">4x</button>
                    </div>
                </div>
            </div>
        `;
    }

    function showTimelineModal() {
        if (!scene25d || !progressSync) {
            showSpeechBubble('时间线功能暂不可用~', false, 'confused', true);
            return;
        }

        var modal = document.getElementById('home-timeline-modal');
        if (!modal) return;

        timelineModalVisible = true;
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';

        initTimelinePlayer();
    }

    function hideTimelineModal() {
        var modal = document.getElementById('home-timeline-modal');
        if (!modal) return;

        timelineModalVisible = false;
        modal.classList.remove('visible');
        document.body.style.overflow = '';

        if (timelinePlayer) {
            timelinePlayer.stop();
        }
    }

    function initTimelinePlayer() {
        if (typeof TimelinePlayer === 'undefined') return;
        if (!progressSync || !objectManager) return;

        var sceneContainer = document.getElementById('timeline-scene-container');
        if (!sceneContainer) return;

        var currentStage = getCurrentStage();

        var timelineObjectManager = ObjectManager.create();

        var timelineScene = Scene25D.create({
            container: sceneContainer,
            baseWidth: 800,
            baseHeight: 500,
            layers: [
                { id: 'background', name: 'background', zIndex: 1, parallaxFactor: 0 },
                { id: 'mid', name: 'mid', zIndex: 2, parallaxFactor: 0 },
                { id: 'foreground', name: 'foreground', zIndex: 3, parallaxFactor: 0 }
            ],
            parallax: { enabled: false }
        });

        if (timelineScene) {
            timelineObjectManager.attachToScene(timelineScene, {
                background: 'background',
                mid: 'mid',
                foreground: 'foreground'
            });

            var bgLayer = timelineScene.getLayer('background');
            if (bgLayer && bgLayer._element) {
                bgLayer._element.innerHTML = `
                    <div class="scene25d-bg">
                        <div class="scene25d-bg-wall"></div>
                        <div class="scene25d-bg-floor"></div>
                        <div class="scene25d-bg-skirting"></div>
                    </div>
                `;
                if (PIXEL_STYLE_ENABLED) {
                    bgLayer._element.classList.add('pixel-style');
                    var wall = bgLayer._element.querySelector('.scene25d-bg-wall');
                    var floor = bgLayer._element.querySelector('.scene25d-bg-floor');
                    if (wall && _pixelTextures.brickWall) {
                        wall.style.backgroundImage = 'url(' + _pixelTextures.brickWall + ')';
                    }
                    if (floor && _pixelTextures.woodFloor) {
                        floor.style.backgroundImage = 'url(' + _pixelTextures.woodFloor + ')';
                    }
                }
            }
        }

        timelinePlayer = TimelinePlayer.create({
            progressSync: progressSync,
            objectManager: timelineObjectManager,
            stageDuration: 1500
        });

        if (timelinePlayer && timelineScene) {
            timelinePlayer._scene = timelineScene;
            timelinePlayer._timelineObjectManager = timelineObjectManager;

            var origShowStage = timelinePlayer._showStage;
            timelinePlayer._showStage = function(stage, animate) {
                if (this.progressSync) {
                    var origObjectManager = this.progressSync.objectManager;
                    this.progressSync.objectManager = this._timelineObjectManager;
                    this.progressSync.showStage(stage, animate);
                    this.progressSync.objectManager = origObjectManager;
                }
            };

            timelinePlayer.on('onStageChange', function(stage, info) {
                updateTimelineUI(stage, info);
            });

            timelinePlayer.on('onProgress', function(progress, stage) {
                var progressFill = document.getElementById('timeline-progress-fill');
                if (progressFill) {
                    progressFill.style.width = progress + '%';
                }
                var progressPercent = document.getElementById('timeline-progress-percent');
                if (progressPercent) {
                    progressPercent.textContent = progress + '%';
                }
            });

            timelinePlayer.on('onComplete', function() {
                var playBtn = document.getElementById('timeline-play-btn');
                if (playBtn) {
                    var playIcon = playBtn.querySelector('.play-icon');
                    var pauseIcon = playBtn.querySelector('.pause-icon');
                    if (playIcon) playIcon.style.display = '';
                    if (pauseIcon) pauseIcon.style.display = 'none';
                }
            });

            timelinePlayer.goToStage(0, false);
        }

        bindTimelineControls();
    }

    function updateTimelineUI(stage, info) {
        var stageBadge = document.getElementById('timeline-stage-badge');
        var stageName = document.querySelector('.timeline-stage-name');
        var stageDesc = document.querySelector('.timeline-stage-desc');
        var currentStageText = document.getElementById('timeline-current-stage');

        if (stageBadge && info) {
            stageBadge.textContent = info.name;
        }
        if (stageName && info) {
            stageName.textContent = info.name;
        }
        if (stageDesc && info) {
            stageDesc.textContent = info.description;
        }
        if (currentStageText) {
            currentStageText.textContent = '第 ' + stage + ' 阶段';
        }

        var dots = document.querySelectorAll('.timeline-stage-dot');
        for (var i = 0; i < dots.length; i++) {
            var dotStage = parseInt(dots[i].getAttribute('data-stage'));
            if (dotStage <= stage) {
                dots[i].classList.add('active');
            } else {
                dots[i].classList.remove('active');
            }
        }
    }

    function bindTimelineControls() {
        var closeBtn = document.getElementById('timeline-close-btn');
        var playBtn = document.getElementById('timeline-play-btn');
        var prevBtn = document.getElementById('timeline-prev-btn');
        var nextBtn = document.getElementById('timeline-next-btn');
        var modal = document.getElementById('home-timeline-modal');
        var overlay = document.querySelector('.home-timeline-overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', hideTimelineModal);
        }

        if (overlay) {
            overlay.addEventListener('click', hideTimelineModal);
        }

        if (playBtn && timelinePlayer) {
            playBtn.addEventListener('click', function() {
                var playIcon = playBtn.querySelector('.play-icon');
                var pauseIcon = playBtn.querySelector('.pause-icon');

                if (timelinePlayer.isPlaying()) {
                    timelinePlayer.pause();
                    if (playIcon) playIcon.style.display = '';
                    if (pauseIcon) pauseIcon.style.display = 'none';
                } else {
                    var currentStage = timelinePlayer.getCurrentStage();
                    var targetStage = timelinePlayer.getTargetStage();
                    if (currentStage >= targetStage) {
                        timelinePlayer.play({ startStage: 0, endStage: getCurrentStage() });
                    } else {
                        timelinePlayer.resume();
                    }
                    if (playIcon) playIcon.style.display = 'none';
                    if (pauseIcon) pauseIcon.style.display = '';
                }
            });
        }

        if (prevBtn && timelinePlayer) {
            prevBtn.addEventListener('click', function() {
                if (timelinePlayer.isPlaying()) {
                    timelinePlayer.pause();
                    updatePlayButtonState();
                }
                timelinePlayer.prevStage();
            });
        }

        if (nextBtn && timelinePlayer) {
            nextBtn.addEventListener('click', function() {
                if (timelinePlayer.isPlaying()) {
                    timelinePlayer.pause();
                    updatePlayButtonState();
                }
                timelinePlayer.nextStage();
            });
        }

        var stageDots = document.querySelectorAll('.timeline-stage-dot');
        for (var i = 0; i < stageDots.length; i++) {
            (function(dot) {
                dot.addEventListener('click', function() {
                    if (!timelinePlayer) return;
                    var stage = parseInt(dot.getAttribute('data-stage'));
                    if (timelinePlayer.isPlaying()) {
                        timelinePlayer.pause();
                        updatePlayButtonState();
                    }
                    var maxStage = getCurrentStage();
                    if (stage <= maxStage) {
                        timelinePlayer.goToStage(stage, true);
                    }
                });
            })(stageDots[i]);
        }

        var speedBtns = document.querySelectorAll('.speed-btn');
        for (var j = 0; j < speedBtns.length; j++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var speed = parseInt(btn.getAttribute('data-speed'));
                    if (timelinePlayer) {
                        timelinePlayer.setStageDuration(speed);
                    }
                    for (var k = 0; k < speedBtns.length; k++) {
                        speedBtns[k].classList.remove('active');
                    }
                    btn.classList.add('active');
                });
            })(speedBtns[j]);
        }
    }

    function updatePlayButtonState() {
        var playBtn = document.getElementById('timeline-play-btn');
        if (!playBtn) return;
        var playIcon = playBtn.querySelector('.play-icon');
        var pauseIcon = playBtn.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = '';
        if (pauseIcon) pauseIcon.style.display = 'none';
    }

    function buildResetConfirmModal() {
        return `
            <div class="home-reset-modal" id="home-reset-modal">
                <div class="home-reset-content">
                    <div class="home-reset-icon">⚠️</div>
                    <div class="home-reset-title">确认重新开始？</div>
                    <div class="home-reset-desc">
                        此操作将清空所有数据，包括：<br><br>
                        • 装修进度和已完成步骤<br>
                        • 预算计划和支出记录<br>
                        • 小管家等级和装备<br>
                        • 所有本地保存的数据<br><br>
                        <strong>此操作不可恢复！</strong>
                    </div>
                    <div class="home-reset-actions">
                        <button class="home-reset-btn-cancel" id="reset-cancel-btn">取消</button>
                        <button class="home-reset-btn-confirm" id="reset-confirm-btn">确认重置</button>
                    </div>
                </div>
            </div>
        `;
    }

    function render(containerEl) {
        container = containerEl;
        ensureHomeData();

        var completedSteps = getCompletedStepsCount();
        var currentLevel = getCurrentLevel(completedSteps);
        var cultivationLevel = typeof CultivationData !== 'undefined' ? CultivationData.getLevel() : currentLevel.level;
        var currentStage = getCurrentStage();

        if (completedSteps === 0) {
            renderHomeEmptyState(currentLevel);
            return;
        }

        container.innerHTML = `
            <div class="home-view">
                <header class="home-header">
                    <div class="home-header-left">
                        <button class="home-back-btn" id="home-back-btn" aria-label="返回首页" title="返回首页">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M19 12H5"/>
                                <polyline points="12 19 5 12 12 5"/>
                            </svg>
                        </button>
                        <div>
                            <h1 class="home-title">我的家</h1>
                            <p class="home-subtitle">和小管家一起打造理想的家</p>
                        </div>
                    </div>
                    <div class="home-level-badge">
                        ${buildLevelBadgeHTML()}
                    </div>
                </header>

                <div class="home-scene-container" id="home-scene-container">
                    <canvas class="home-particles-canvas" id="home-particles-canvas"></canvas>
                    ${USE_25D_SCENE ? '' : buildSceneSVG()}
                    ${USE_25D_SCENE ? '<div class="home-scene-25d-container" id="home-scene-25d-container"></div>' : ''}
                    <div class="home-nian-wrapper" id="home-nian-wrapper">
                        <div class="home-nian sway" id="home-nian">
                            <div class="home-nian-3d-container" id="home-nian-3d-container">
                                <img class="nian-3d-fallback" src="images/nian-icons/nian-default.png" width="64" height="64" alt="小管家"/>
                            </div>
                            ${buildNianDecorations(cultivationLevel)}
                        </div>
                        <div class="nian-speech-bubble" id="nian-speech-bubble">
                            点击我和我聊聊吧~
                        </div>
                        <div class="home-todo-bubble">今日待办 →</div>
                    </div>
                </div>

                <div class="home-action-area">
                    <button class="home-action-btn primary" id="home-go-sop-btn">
                        ${Icons.render('hammer')}
                        <span>去装修</span>
                    </button>
                    <button class="home-action-btn secondary" id="home-go-budget-btn">
                        ${Icons.render('coins')}
                        <span>看预算</span>
                    </button>
                    <button class="home-action-btn tertiary" id="home-daily-tasks-btn">
                        ${Icons.render('calendar')}
                        <span>每日任务</span>
                    </button>
                    <button class="home-action-btn tertiary" id="home-collection-btn">
                        ${Icons.render('sparkles')}
                        <span>图鉴</span>
                    </button>
                    <button class="home-action-btn tertiary" id="home-asset-btn">
                        ${Icons.render('shirt')}
                        <span>装扮</span>
                    </button>
                    <button class="home-action-btn tertiary" id="home-achievement-btn">
                        ${Icons.render('trophy')}
                        <span>成就</span>
                    </button>
                </div>

                ${renderDashboard()}
                ${renderKnowledgeSummary()}

                <div class="home-reset-section">
                    <button class="home-reset-btn" id="home-reset-btn-data">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        重新开始
                    </button>
                </div>

                ${buildEquipmentModal()}
                ${buildLevelUpModal()}
                ${buildCollectionModal()}
                ${buildAchievementModal()}
                ${buildTimelineModal()}
                ${buildResetConfirmModal()}
            </div>
        `;

        addTimer(setTimeout(function() {
            refreshSceneElements();
        }, 100));

        cacheElements();
    }

    function renderHomeEmptyState(currentLevel) {
        container.innerHTML = `
            <div class="home-view">
                <header class="home-header">
                    <div class="home-header-left">
                        <button class="home-back-btn" id="home-back-btn" aria-label="返回首页" title="返回首页">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M19 12H5"/>
                                <polyline points="12 19 5 12 12 5"/>
                            </svg>
                        </button>
                        <div>
                            <h1 class="home-title">我的家</h1>
                            <p class="home-subtitle">和小管家一起打造理想的家</p>
                        </div>
                    </div>
                    <div class="home-level-badge">
                        ${buildLevelBadgeHTML()}
                    </div>
                </header>

                <div class="home-empty-wrapper" id="home-empty-wrapper"></div>

                <div class="home-reset-section">
                    <button class="home-reset-btn" id="home-reset-btn-empty">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        重新开始
                    </button>
                </div>

                ${buildResetConfirmModal()}
            </div>
        `;

        var emptyWrapper = document.getElementById('home-empty-wrapper');
        if (emptyWrapper) {
            App.showEmptyState(emptyWrapper, {
                icon: Icons.render('nian-happy'),
                iconClass: 'excited',
                title: '开始装修，解锁你的家',
                desc: '完成装修步骤，解锁更多家具装饰，让小管家陪你一起打造梦想之家~',
                variant: 'card',
                primaryAction: '开始装修流程',
                onPrimaryAction: function() {
                    App.switchView('sop');
                }
            });
        }

        initHomeEmptyStateEvents();
        cacheElements();
    }

    function initHomeEmptyStateEvents() {
        var resetBtn = document.getElementById('home-reset-btn-empty');
        var resetCancelBtn = document.getElementById('reset-cancel-btn');
        var resetConfirmBtn = document.getElementById('reset-confirm-btn');

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                showResetModal();
            });
        }
        
        if (resetCancelBtn) {
            resetCancelBtn.addEventListener('click', function() {
                hideResetModal();
            });
        }
        
        if (resetConfirmBtn) {
            resetConfirmBtn.addEventListener('click', function() {
                hideResetModal();
                if (window.App && typeof App.resetAllData === 'function') {
                    App.resetAllData(function() {
                        if (typeof App.switchView === 'function') {
                            App.switchView('hero');
                        }
                    });
                }
            });
        }
    }

    function init(containerEl) {
        container = containerEl;

        if (typeof CultivationData !== 'undefined' && typeof CultivationData.init === 'function') {
            CultivationData.init();
        }

        initNianInteraction();
        initActionButtons();
        initEquipmentModal();
        initLevelUpModal();
        initAchievementSystem();
        subscribeEvents();
        initNian3DAvatar();
        initVisibilityListener();
        initFirstTimeExperience();
        performDailyCheckIn();
    }

    function performDailyCheckIn() {
        if (typeof CultivationData === 'undefined' || typeof CultivationData.checkDailyCheckIn !== 'function') {
            return;
        }

        addTimer(setTimeout(function() {
            CultivationData.checkDailyCheckIn();
        }, 1000));
    }

    function initFirstTimeExperience() {
        if (!container) return;

        var isFirstVisit = !Storage.exists('home_visited');
        if (isFirstVisit) {
            Storage.save('home_visited', true);
        }

        var hasCompletedSteps = getCompletedStepsCount() > 0;
        if (hasCompletedSteps) return;

        initDashboardCountUp();
        initNianFirstGreeting();
        initSceneGuide();
    }

    function initDashboardCountUp() {
        if (!container) return;

        var countElements = container.querySelectorAll('.dashboard-count');
        if (countElements.length === 0) return;

        countElements.forEach(function(el, index) {
            var target = parseInt(el.getAttribute('data-target') || '0', 10);
            var duration = 800 + index * 200;
            animateCountUp(el, 0, target, duration);
        });
    }

    function animateCountUp(el, start, end, duration) {
        var startTime = null;
        var step = function(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var easeProgress = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(start + (end - start) * easeProgress);
            el.textContent = current.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }

    function initNianFirstGreeting() {
        if (!Storage) return;
        if (Storage.exists('nian_first_greeting_shown')) return;

        var speechBubble = document.getElementById('nian-speech-bubble');
        if (!speechBubble) return;

        var greetingIndex = 0;
        var greetings = [
            '你好呀！我是你的装修小管家~',
            '点击场景可以看看各个区域哦',
            '有问题随时找我聊聊吧！'
        ];

        speechBubble.textContent = greetings[0];
        speechBubble.classList.add('visible');
        Storage.save('nian_first_greeting_shown', true);

        var greetingTimer = setInterval(function() {
            greetingIndex++;
            if (greetingIndex >= greetings.length) {
                clearInterval(greetingTimer);
                setTimeout(function() {
                    speechBubble.classList.remove('visible');
                }, 2000);
                return;
            }
            speechBubble.classList.remove('visible');
            setTimeout(function() {
                speechBubble.textContent = greetings[greetingIndex];
                speechBubble.classList.add('visible');
            }, 300);
        }, 2500);

        nianStateQueue.push({ type: 'greeting', timer: greetingTimer });
    }

    function initSceneGuide() {
        if (!Storage) return;
        if (Storage.exists('scene_guide_shown')) return;

        addTimer(setTimeout(function() {
            showSceneGuide();
        }, 1500));
    }

    function showSceneGuide() {
        var sceneContainer = document.getElementById('home-scene-container');
        if (!sceneContainer) return;

        var guideEl = document.createElement('div');
        guideEl.className = 'scene-guide-overlay';
        guideEl.innerHTML =
            '<div class="scene-guide-hand">' +
                '<div class="scene-guide-finger"></div>' +
                '<div class="scene-guide-ripple"></div>' +
                '<div class="scene-guide-ripple delay"></div>' +
            '</div>' +
            '<div class="scene-guide-text">' +
                '<span class="scene-guide-title">点击场景看看</span>' +
                '<span class="scene-guide-desc">探索你家的各个区域</span>' +
            '</div>';

        sceneContainer.appendChild(guideEl);

        function dismissGuide() {
            Storage.save('scene_guide_shown', true);
            guideEl.classList.add('scene-guide-dismissing');
            setTimeout(function() {
                if (guideEl.parentNode) {
                    guideEl.remove();
                }
            }, 300);
            sceneContainer.removeEventListener('click', dismissGuide);
        }

        sceneContainer.addEventListener('click', dismissGuide);

        addTimer(setTimeout(function() {
            dismissGuide();
        }, 8000));
    }

    function initAchievementSystem() {
        if (typeof AchievementSystem === 'undefined') return;

        AchievementSystem.init();
        AchievementSystem.addUnlockListener(onAchievementUnlocked);
        syncAchievementStats();
    }

    function initDashboardEvents() {
        if (!container) return;

        var dashboardCards = container.querySelectorAll('.dashboard-card');
        dashboardCards.forEach(function(card) {
            card.addEventListener('click', function() {
                var action = card.getAttribute('data-action');
                if (action === 'sop') {
                    App.switchView('sop');
                } else if (action === 'budget') {
                    App.switchView('budget');
                } else if (action === 'timeline') {
                    showTimelineModal();
                }
            });
        });

        var quickBtns = container.querySelectorAll('.quick-action-btn');
        quickBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                handleQuickAction(action);
            });
        });
    }

    function handleQuickAction(action) {
        switch (action) {
            case 'quick-add-expense':
                App.switchView('budget');
                if (typeof Toast !== 'undefined') {
                    Toast.info('已打开预算页面');
                }
                break;
            case 'quick-next-step':
                App.switchView('sop');
                break;
            case 'quick-search':
                if (window.GlobalSearch && GlobalSearch.open) {
                    GlobalSearch.open();
                } else {
                    if (typeof Toast !== 'undefined') {
                        Toast.info('搜索功能即将上线');
                    }
                }
                break;
            case 'quick-tools':
                App.switchView('tools');
                break;
            case 'quick-knowledge':
                App.switchView('knowledge');
                break;
            case 'quick-more':
                if (typeof App !== 'undefined' && App.openQuickAddModal) {
                    App.openQuickAddModal();
                }
                break;
            default:
                break;
        }
    }

    function initNewbieTasks() {
        if (typeof NewbieTasks === 'undefined') return;

        NewbieTasks.init();

        NewbieTasks.addCompleteListener(function(task) {
            if (typeof Toast !== 'undefined') {
                Toast.success('✨ 完成任务：' + task.name + ' +' + task.reward + '经验');
            }

            if (NewbieTasks.isAllComplete() && typeof AchievementSystem !== 'undefined') {
                AchievementSystem.incrementStat('newbieCompleted', 1);
            }

            refresh();
        });

        var moreBtn = container.querySelector('.newbie-tasks-more');
        if (moreBtn) {
            moreBtn.addEventListener('click', function() {
                showNewbieTasksModal();
            });
        }

        var taskItems = container.querySelectorAll('.newbie-task-item');
        taskItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var taskId = item.getAttribute('data-task-id');
                var task = NewbieTasks.getTaskById(taskId);
                if (task && !task.completed && task.action) {
                    handleNewbieTaskAction(task.action);
                }
            });
        });
    }

    function handleNewbieTaskAction(action) {
        switch (action) {
            case 'budget':
                App.switchView('budget');
                break;
            case 'sop':
                App.switchView('sop');
                break;
            case 'knowledge':
                App.switchView('knowledge');
                break;
            case 'tools':
                App.switchView('tools');
                break;
            default:
                break;
        }
    }

    function showNewbieTasksModal() {
        if (typeof NewbieTasks === 'undefined') return;

        var tasks = NewbieTasks.getAllTasks();
        var overall = NewbieTasks.getOverallProgress();

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-medium">
                <div class="modal-header">
                    <h3 class="modal-title">新手任务</h3>
                    <button class="modal-close-btn" id="newbie-tasks-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="newbie-tasks-modal-header">
                        <div class="newbie-tasks-overview">
                            <div class="newbie-tasks-overview-num">${overall.completed}/${overall.total}</div>
                            <div class="newbie-tasks-overview-label">已完成任务</div>
                        </div>
                        <div class="newbie-tasks-overview">
                            <div class="newbie-tasks-overview-num">+${overall.earnedExp}</div>
                            <div class="newbie-tasks-overview-label">已获经验</div>
                        </div>
                        <div class="newbie-tasks-overview">
                            <div class="newbie-tasks-overview-num">+${overall.totalExp}</div>
                            <div class="newbie-tasks-overview-label">全部经验</div>
                        </div>
                    </div>
                    <div class="newbie-tasks-modal-list">
                        ${tasks.map(function(task) {
                            return `
                                <div class="newbie-task-modal-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                                    <div class="newbie-task-modal-icon">${task.icon}</div>
                                    <div class="newbie-task-modal-content">
                                        <div class="newbie-task-modal-name">
                                            ${task.name}
                                            ${task.completed ? '<span class="task-completed-tag">已完成</span>' : ''}
                                        </div>
                                        <div class="newbie-task-modal-desc">${task.description}</div>
                                        ${!task.completed && task.progress > 0 ? `
                                            <div class="newbie-task-modal-progress">
                                                <div class="newbie-task-modal-progress-bar">
                                                    <div class="newbie-task-modal-progress-fill" style="width: ${task.progress}%"></div>
                                                </div>
                                                <span class="newbie-task-modal-progress-text">${task.progress}%</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="newbie-task-modal-reward">
                                        <span class="exp-text">+${task.reward} exp</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        var closeBtn = modal.querySelector('#newbie-tasks-close');
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(function() {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });

        var taskItems = modal.querySelectorAll('.newbie-task-modal-item');
        taskItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var taskId = item.getAttribute('data-task-id');
                var task = NewbieTasks.getTaskById(taskId);
                if (task && !task.completed && task.action) {
                    modal.classList.remove('show');
                    setTimeout(function() {
                        if (modal.parentNode) {
                            modal.parentNode.removeChild(modal);
                        }
                    }, 300);
                    handleNewbieTaskAction(task.action);
                }
            });
        });
    }

    function onAchievementUnlocked(newAchievements) {
        if (!newAchievements || newAchievements.length === 0) return;

        for (var i = 0; i < newAchievements.length; i++) {
            (function(achievement, index) {
                setTimeout(function() {
                    showAchievementToast(achievement);
                }, index * 1500);
            })(newAchievements[i], i);
        }
    }

    function showAchievementToast(achievement) {
        var existing = document.getElementById('achievement-toast');
        if (existing) {
            existing.remove();
        }

        var toast = document.createElement('div');
        toast.id = 'achievement-toast';
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-toast-icon">${achievement.icon}</div>
            <div class="achievement-toast-content">
                <div class="achievement-toast-title">🎉 成就解锁</div>
                <div class="achievement-toast-name">${achievement.name}</div>
                <div class="achievement-toast-desc">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('show');
        }, 50);

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    function syncAchievementStats() {
        if (typeof AchievementSystem === 'undefined') return;

        var completedSteps = getCompletedStepsCount();
        var currentStage = getCurrentStage();
        var collectedObjects = getCollectedObjectsCount();

        AchievementSystem.updateStat('completedSteps', completedSteps);
        AchievementSystem.updateStat('completedStages', currentStage);
        AchievementSystem.updateStat('collectedObjects', collectedObjects);
    }

    var _visibilityHandler = null;

    function initVisibilityListener() {
        if (_visibilityHandler) return;

        _visibilityHandler = function() {
            if (document.hidden) {
                pauseScene25D();
            } else {
                resumeScene25D();
            }
        };

        document.addEventListener('visibilitychange', _visibilityHandler);
    }

    function removeVisibilityListener() {
        if (_visibilityHandler) {
            document.removeEventListener('visibilitychange', _visibilityHandler);
            _visibilityHandler = null;
        }
    }

    function viewEnter(containerEl) {
        container = containerEl;
        ensureHomeData();
        refresh();

        addTimer(setTimeout(function() {
            var staggerItems = container.querySelectorAll('.stagger-item');
            staggerItems.forEach(function(item, index) {
                addTimer(setTimeout(function() {
                    item.classList.add('visible');
                }, index * 60 + 100));
            });
        }, 50));

        var completedSteps = getCompletedStepsCount();
        if (completedSteps === 0) {
            addTimer(setTimeout(function() {
                showNianAutoTip('您好呀！我是您的装修小管家，有什么装修上的问题随时都可以问我哦~');
            }, 1500));
        }

        if (USE_25D_SCENE) {
            addTimer(setTimeout(function() {
                initScene25D();
            }, 100));
        }

        initDashboardEvents();
        initNewbieTasks();
    }

    function handleProgressStepCompleted(stepId) {
        if (typeof StepObjectMapping !== 'undefined') {
            var objectIds = StepObjectMapping.getObjectIdsForStep(stepId);
            if (objectIds && objectIds.length > 0) {
                var firstObjectId = objectIds[0];
                addTimer(setTimeout(function() {
                    guideToObject(firstObjectId);
                }, 800));

                if (typeof NotificationBar !== 'undefined' && ObjectConfig) {
                    var objConfig = ObjectConfig.getConfig(firstObjectId);
                    if (objConfig && objConfig.name) {
                        NotificationBar.show(
                            '🎉 新物件解锁：' + objConfig.name,
                            'success',
                            3500
                        );
                    } else {
                        NotificationBar.show(
                            '🎉 获得新物件！',
                            'success',
                            3000
                        );
                    }
                } else if (typeof Toast !== 'undefined') {
                    Toast.success('✨ 获得新物件！');
                }
            }
        }

        if (el.collectionModal && el.collectionModal.classList.contains('active')) {
            refreshCollectionContent();
        }
    }

    function handleProgressStageChange(newStage, oldStage) {
        if (stageTransition && typeof stageTransition.transitionTo === 'function') {
            var newObjectIds = getNewObjectsForStageRange(oldStage, newStage);

            stageTransition.transitionTo(newStage, {
                newObjectIds: newObjectIds,
                onNotification: function(stageId, isMilestone) {
                    if (stageId > oldStage && stageId >= 1) {
                        if (typeof NotificationBar !== 'undefined') {
                            var stageName = '';
                            if (stageRegionMapper) {
                                var mapping = stageRegionMapper.getMapping(stageId);
                                if (mapping) {
                                    stageName = mapping.stageName;
                                }
                            }
                            var notifType = isMilestone ? 'celebrate' : 'success';
                            NotificationBar.show(
                                '恭喜！进入第' + stageId + '阶段：' + stageName,
                                notifType,
                                4000
                            );
                        } else if (typeof Toast !== 'undefined') {
                            Toast.success('🎉 进入新阶段！');
                        }
                    }
                },
                onMidpoint: function(stageId, prevStage) {
                    if (stageRegionMapper) {
                        stageRegionMapper.setCurrentStage(stageId);
                    }
                },
                onNianMove: function(stageId, callback) {
                    moveNianToStageRegion(stageId, stageId > oldStage, callback);
                },
                onComplete: function(stageId, prevStage) {
                    resumeAutoChat();
                    resetAutoChatTimer();
                }
            });
        } else {
            if (stageRegionMapper) {
                stageRegionMapper.setCurrentStage(newStage);
            }

            updateSceneStyle(newStage);

            if (newStage > oldStage && newStage >= 1) {
                if (typeof NotificationBar !== 'undefined') {
                    var stageName = '';
                    if (stageRegionMapper) {
                        var mapping = stageRegionMapper.getMapping(newStage);
                        if (mapping) {
                            stageName = mapping.stageName;
                        }
                    }
                    NotificationBar.show(
                        '恭喜！进入第' + newStage + '阶段：' + stageName,
                        'celebrate',
                        4000
                    );
                } else if (typeof Toast !== 'undefined') {
                    Toast.success('🎉 进入新阶段！');
                }
            }

            moveNianToStageRegion(newStage, newStage > oldStage);
        }
    }

    function moveNianToStageRegion(stageId, withCelebrate, callback) {
        if (!nianSprite || !stageRegionMapper) {
            if (typeof callback === 'function') callback();
            return;
        }
        if (isNianGuiding) {
            if (typeof callback === 'function') callback();
            return;
        }

        var stage = parseInt(stageId);
        if (stage < 1) stage = 1;
        if (stage > 7) stage = 7;

        var mapping = stageRegionMapper.getMapping(stage);
        if (!mapping) {
            if (typeof callback === 'function') callback();
            return;
        }

        var targetX = mapping.targetX;
        var targetY = mapping.targetY;
        var targetState = mapping.nianState;
        var dialogs = mapping.dialogs || [];
        var dialog = dialogs.length > 0 ? dialogs[Math.floor(Math.random() * dialogs.length)] : '';

        var currentPos = nianOriginalPosition;
        var distance = Math.sqrt(
            Math.pow(targetX - currentPos.x, 2) +
            Math.pow(targetY - currentPos.y, 2)
        );
        var duration = Math.max(600, Math.min(distance * 2, 1500));

        if (targetX < currentPos.x) {
            nianSprite.setFacing('left');
        } else {
            nianSprite.setFacing('right');
        }

        pauseAutoChat();

        if (withCelebrate) {
            nianSprite.setState('celebrate');
            addTimer(setTimeout(function() {
                startMove();
            }, 1000));
        } else {
            startMove();
        }

        function startMove() {
            nianSprite.setState('walk');
            nianSprite.moveTo(targetX, targetY, duration, function() {
                if (nianSprite) {
                    nianSprite.setState(targetState);
                    nianSprite.setFacing('right');
                }

                nianOriginalPosition = { x: targetX, y: targetY };

                if (dialog) {
                    showSpeechBubble(dialog, false, targetState, true);
                    updateSpeechBubblePosition();
                }

                addTimer(setTimeout(function() {
                    resumeAutoChat();
                }, 2000));

                if (typeof callback === 'function') {
                    callback();
                }
            });
        }
    }

    function setNianInitialPosition(stageId) {
        if (!nianSprite || !stageRegionMapper) return;

        var stage = parseInt(stageId);
        if (stage < 1) stage = 1;
        if (stage > 7) stage = 7;

        var mapping = stageRegionMapper.getMapping(stage);
        if (!mapping) return;

        var targetX = mapping.targetX;
        var targetY = mapping.targetY;
        var targetState = mapping.nianState;

        nianSprite.setPosition(targetX, targetY);
        nianSprite.setState(targetState);

        nianOriginalPosition = { x: targetX, y: targetY };

        if (stageRegionMapper && typeof stageRegionMapper.setCurrentStage === 'function') {
            stageRegionMapper.setCurrentStage(stage);
        }
    }

    var STAGE_STYLES = {
        0: {
            wallColor: 'linear-gradient(180deg, #E8E0D0 0%, #D4C4A8 100%)',
            floorColor: 'linear-gradient(180deg, #C4B498 0%, #B8A888 100%)',
            ambiance: 'rgba(139, 111, 71, 0.1)',
            name: '毛坯阶段'
        },
        1: {
            wallColor: 'linear-gradient(180deg, #F0EBE1 0%, #E0D8C8 100%)',
            floorColor: 'linear-gradient(180deg, #D4C4A8 0%, #C4B498 100%)',
            ambiance: 'rgba(74, 111, 165, 0.08)',
            name: '设计阶段'
        },
        2: {
            wallColor: 'linear-gradient(180deg, #EDE5D5 0%, #DDD3C0 100%)',
            floorColor: 'linear-gradient(180deg, #C8B898 0%, #B8A888 100%)',
            ambiance: 'rgba(200, 74, 62, 0.06)',
            name: '水电阶段'
        },
        3: {
            wallColor: 'linear-gradient(180deg, #F5F0E8 0%, #E5DDD0 100%)',
            floorColor: 'linear-gradient(180deg, #D4C4A8 0%, #C4B498 100%)',
            ambiance: 'rgba(91, 140, 90, 0.06)',
            name: '泥木阶段'
        },
        4: {
            wallColor: 'linear-gradient(180deg, #FAF7F2 0%, #F0EBE1 100%)',
            floorColor: 'linear-gradient(180deg, #D4B070 0%, #C4A060 100%)',
            ambiance: 'rgba(255, 215, 0, 0.08)',
            name: '安装阶段'
        },
        5: {
            wallColor: 'linear-gradient(180deg, #FFF8F0 0%, #F5EDE0 100%)',
            floorColor: 'linear-gradient(180deg, #E8D4B8 0%, #D4B896 100%)',
            ambiance: 'rgba(255, 182, 193, 0.1)',
            name: '软装阶段'
        },
        6: {
            wallColor: 'linear-gradient(180deg, #FFFEF9 0%, #F9F5ED 100%)',
            floorColor: 'linear-gradient(180deg, #E8DCC8 0%, #D8CCB8 100%)',
            ambiance: 'rgba(255, 215, 0, 0.12)',
            name: '竣工阶段'
        }
    };

    var _pixelStageElements = {
        pipes: null,
        wallMarkings: null,
        decorations: null,
        rugs: null
    };

    function updateSceneStyle(stage) {
        if (!scene25d) return;

        var style = STAGE_STYLES[stage] || STAGE_STYLES[0];
        var bgLayer = scene25d.getLayer('background');
        if (!bgLayer || !bgLayer._element) return;

        var wall = bgLayer._element.querySelector('.scene25d-bg-wall');
        var floor = bgLayer._element.querySelector('.scene25d-bg-floor');

        if (PIXEL_STYLE_ENABLED && _pixelTextures.brickWall) {
            if (wall) {
                wall.style.transition = 'background 0.8s steps(6)';
                if (stage <= 1) {
                    wall.style.backgroundImage = 'url(' + _pixelTextures.concrete + ')';
                } else if (stage <= 2) {
                    wall.style.backgroundImage = 'url(' + _pixelTextures.concrete + ')';
                } else if (stage <= 4) {
                    wall.style.backgroundImage = 'url(' + _pixelTextures.brickWall + ')';
                } else {
                    wall.style.backgroundImage = 'url(' + _pixelTextures.wallpaper + ')';
                }
                wall.style.backgroundSize = '128px 96px';
                wall.style.backgroundRepeat = 'repeat';
            }
            if (floor) {
                floor.style.transition = 'background 0.8s steps(6)';
                if (stage <= 2) {
                    floor.style.backgroundImage = 'url(' + _pixelTextures.concreteFloor + ')';
                } else if (stage <= 4) {
                    floor.style.backgroundImage = 'url(' + _pixelTextures.woodFloor + ')';
                } else {
                    floor.style.backgroundImage = 'url(' + _pixelTextures.woodFloor + ')';
                }
                floor.style.backgroundSize = '128px 64px';
                floor.style.backgroundRepeat = 'repeat';
            }

            updatePixelStageElements(stage, bgLayer._element);
        } else {
            if (wall) {
                wall.style.transition = 'background 1s ease-in-out';
                wall.style.background = style.wallColor;
                wall.style.backgroundImage = 'none';
            }
            if (floor) {
                floor.style.transition = 'background 1s ease-in-out';
                floor.style.background = style.floorColor;
                floor.style.backgroundImage = 'none';
            }

            removePixelStageElements();
        }

        var container25d = document.getElementById('home-scene-25d-container');
        if (container25d) {
            container25d.style.transition = 'box-shadow 1s ease-in-out';
            container25d.style.boxShadow = 'inset 0 0 100px ' + style.ambiance;
        }

        if (ambientLighting && ambientLighting.setStage) {
            ambientLighting.setStage(stage);
        }

        if (PIXEL_STYLE_ENABLED) {
            updateAllPixelFurniture(stage);
        }
    }

    function updatePixelStageElements(stage, bgElement) {
        if (!bgElement) return;

        var midLayer = scene25d.getLayer('mid');
        var midElement = midLayer ? midLayer._element : null;

        if (stage === 2) {
            if (!_pixelStageElements.pipes && midElement) {
                _pixelStageElements.pipes = createPixelPipes();
                midElement.appendChild(_pixelStageElements.pipes);
            }
            if (!_pixelStageElements.wallMarkings && bgElement) {
                _pixelStageElements.wallMarkings = createPixelWallMarkings();
                var bg = bgElement.querySelector('.scene25d-bg');
                if (bg) bg.appendChild(_pixelStageElements.wallMarkings);
            }
        } else {
            if (_pixelStageElements.pipes && _pixelStageElements.pipes.parentNode) {
                _pixelStageElements.pipes.parentNode.removeChild(_pixelStageElements.pipes);
                _pixelStageElements.pipes = null;
            }
            if (_pixelStageElements.wallMarkings && _pixelStageElements.wallMarkings.parentNode) {
                _pixelStageElements.wallMarkings.parentNode.removeChild(_pixelStageElements.wallMarkings);
                _pixelStageElements.wallMarkings = null;
            }
        }

        if (stage >= 5) {
            if (!_pixelStageElements.decorations && bgElement) {
                _pixelStageElements.decorations = createPixelWallDecorations();
                var bg = bgElement.querySelector('.scene25d-bg');
                if (bg) bg.appendChild(_pixelStageElements.decorations);
            }
        } else {
            if (_pixelStageElements.decorations && _pixelStageElements.decorations.parentNode) {
                _pixelStageElements.decorations.parentNode.removeChild(_pixelStageElements.decorations);
                _pixelStageElements.decorations = null;
            }
        }
    }

    function removePixelStageElements() {
        for (var key in _pixelStageElements) {
            if (_pixelStageElements.hasOwnProperty(key)) {
                var el = _pixelStageElements[key];
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                _pixelStageElements[key] = null;
            }
        }
    }

    function createPixelPipes() {
        var container = document.createElement('div');
        container.className = 'pixel-pipes-container';
        container.style.cssText = 'position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 5;';

        var pipeColors = {
            water: '#4A90D9',
            electric: '#D4A853',
            gas: '#C84A3E'
        };

        var pipes = [
            { type: 'water', x1: 0, y1: 200, x2: 200, y2: 200 },
            { type: 'water', x1: 200, y1: 200, x2: 200, y2: 350 },
            { type: 'electric', x1: 100, y1: 100, x2: 600, y2: 100 },
            { type: 'electric', x1: 350, y1: 100, x2: 350, y2: 250 },
            { type: 'electric', x1: 550, y1: 100, x2: 550, y2: 300 },
            { type: 'water', x1: 580, y1: 180, x2: 780, y2: 180 },
            { type: 'gas', x1: 600, y1: 150, x2: 750, y2: 150 }
        ];

        for (var i = 0; i < pipes.length; i++) {
            var pipe = pipes[i];
            var pipeEl = document.createElement('div');
            var color = pipeColors[pipe.type] || '#888';
            var isHorizontal = pipe.y1 === pipe.y2;

            if (isHorizontal) {
                pipeEl.style.cssText = [
                    'position: absolute',
                    'left: ' + pipe.x1 + 'px',
                    'top: ' + (pipe.y1 - 2) + 'px',
                    'width: ' + (pipe.x2 - pipe.x1) + 'px',
                    'height: ' + 6 + 'px',
                    'background: ' + color,
                    'box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.2)',
                    'image-rendering: pixelated'
                ].join(';');
            } else {
                pipeEl.style.cssText = [
                    'position: absolute',
                    'left: ' + (pipe.x1 - 2) + 'px',
                    'top: ' + pipe.y1 + 'px',
                    'width: ' + 6 + 'px',
                    'height: ' + (pipe.y2 - pipe.y1) + 'px',
                    'background: ' + color,
                    'box-shadow: inset -2px 0 0 rgba(0,0,0,0.2), inset 2px 0 0 rgba(255,255,255,0.2)',
                    'image-rendering: pixelated'
                ].join(';');
            }

            var dotCount = Math.floor((isHorizontal ? (pipe.x2 - pipe.x1) : (pipe.y2 - pipe.y1)) / 20);
            for (var j = 1; j < dotCount; j++) {
                var dot = document.createElement('div');
                var dotPos = j * 20;
                if (isHorizontal) {
                    dot.style.cssText = [
                        'position: absolute',
                        'left: ' + dotPos + 'px',
                        'top: 1px',
                        'width: 4px',
                        'height: 4px',
                        'background: rgba(255,255,255,0.5)',
                        'image-rendering: pixelated'
                    ].join(';');
                } else {
                    dot.style.cssText = [
                        'position: absolute',
                        'left: 1px',
                        'top: ' + dotPos + 'px',
                        'width: 4px',
                        'height: 4px',
                        'background: rgba(255,255,255,0.5)',
                        'image-rendering: pixelated'
                    ].join(';');
                }
                pipeEl.appendChild(dot);
            }

            container.appendChild(pipeEl);
        }

        var junctionBoxes = [
            { x: 196, y: 196 },
            { x: 346, y: 96 },
            { x: 546, y: 96 }
        ];

        for (var k = 0; k < junctionBoxes.length; k++) {
            var jbox = junctionBoxes[k];
            var boxEl = document.createElement('div');
            boxEl.style.cssText = [
                'position: absolute',
                'left: ' + jbox.x + 'px',
                'top: ' + jbox.y + 'px',
                'width: 16px',
                'height: 16px',
                'background: #666',
                'box-shadow: inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.2)',
                'image-rendering: pixelated'
            ].join(';');
            container.appendChild(boxEl);
        }

        return container;
    }

    function createPixelWallMarkings() {
        var container = document.createElement('div');
        container.className = 'pixel-wall-markings';
        container.style.cssText = 'position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 4;';

        var markings = [
            { x: 150, y: 150, w: 80, h: 60, text: '插座' },
            { x: 400, y: 180, w: 60, h: 40, text: '开关' },
            { x: 620, y: 200, w: 100, h: 70, text: '电视墙' }
        ];

        for (var i = 0; i < markings.length; i++) {
            var m = markings[i];
            var markEl = document.createElement('div');
            markEl.style.cssText = [
                'position: absolute',
                'left: ' + m.x + 'px',
                'top: ' + m.y + 'px',
                'width: ' + m.w + 'px',
                'height: ' + m.h + 'px',
                'border: 2px dashed #C84A3E',
                'background: rgba(200, 74, 62, 0.08)',
                'image-rendering: pixelated'
            ].join(';');

            var label = document.createElement('div');
            label.style.cssText = [
                'position: absolute',
                'top: -18px',
                'left: 0',
                'font-family: "Courier New", monospace',
                'font-size: 10px',
                'color: #C84A3E',
                'font-weight: bold',
                'white-space: nowrap'
            ].join(';');
            label.textContent = m.text;
            markEl.appendChild(label);

            container.appendChild(markEl);
        }

        return container;
    }

    function createPixelWallDecorations() {
        var container = document.createElement('div');
        container.className = 'pixel-wall-decorations';
        container.style.cssText = 'position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 3;';

        var frames = [
            { x: 250, y: 70, w: 50, h: 40, color1: '#D4A853', color2: '#8B6F47' },
            { x: 450, y: 60, w: 40, h: 50, color1: '#5B8C5A', color2: '#8B6F47' },
            { x: 700, y: 250, w: 35, h: 45, color1: '#C84A3E', color2: '#8B6F47' }
        ];

        for (var i = 0; i < frames.length; i++) {
            var f = frames[i];
            var frameEl = document.createElement('div');
            frameEl.style.cssText = [
                'position: absolute',
                'left: ' + f.x + 'px',
                'top: ' + f.y + 'px',
                'width: ' + f.w + 'px',
                'height: ' + f.h + 'px',
                'background: ' + f.color1,
                'box-shadow: inset -3px -3px 0 ' + f.color2 + ', inset 3px 3px 0 rgba(255,255,255,0.3), 0 0 0 4px ' + f.color2,
                'image-rendering: pixelated'
            ].join(';');

            var inner = document.createElement('div');
            inner.style.cssText = [
                'position: absolute',
                'left: 6px',
                'top: 6px',
                'right: 6px',
                'bottom: 6px',
                'background: linear-gradient(135deg, ' + f.color1 + ' 25%, ' + lightenColor(f.color1, 20) + ' 50%, ' + f.color1 + ' 75%)',
                'image-rendering: pixelated'
            ].join(';');
            frameEl.appendChild(inner);

            container.appendChild(frameEl);
        }

        var shelf = document.createElement('div');
        shelf.style.cssText = [
            'position: absolute',
            'left: 50px',
            'top: 300px',
            'width: 80px',
            'height: 8px',
            'background: #8B6F47',
            'box-shadow: inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.2)',
            'image-rendering: pixelated'
        ].join(';');

        var shelfItems = [
            { x: 5, w: 12, h: 20, color: '#C84A3E' },
            { x: 22, w: 10, h: 25, color: '#5B8C5A' },
            { x: 37, w: 15, h: 18, color: '#4A90D9' },
            { x: 57, w: 8, h: 22, color: '#D4A853' }
        ];

        for (var j = 0; j < shelfItems.length; j++) {
            var item = shelfItems[j];
            var itemEl = document.createElement('div');
            itemEl.style.cssText = [
                'position: absolute',
                'left: ' + item.x + 'px',
                'bottom: 8px',
                'width: ' + item.w + 'px',
                'height: ' + item.h + 'px',
                'background: ' + item.color,
                'box-shadow: inset -1px -1px 0 rgba(0,0,0,0.25), inset 1px 1px 0 rgba(255,255,255,0.2)',
                'image-rendering: pixelated'
            ].join(';');
            shelf.appendChild(itemEl);
        }

        container.appendChild(shelf);

        return container;
    }

    var _pixelTextures = {};

    function initPixelTextures() {
        if (typeof PixelTextureGenerator === 'undefined') return;
        _pixelTextures.woodFloor = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelWoodFloor({
                baseColor: '#D4B896',
                darkColor: '#B89870',
                lightColor: '#E0CCA8',
                grainColor: '#8B7355',
                width: 256,
                height: 128
            })
        );
        _pixelTextures.tileFloor = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelTileFloor({
                baseColor: '#E8E4D8',
                darkColor: '#D0CCC0',
                groutColor: '#B0ACA0',
                width: 256,
                height: 128
            })
        );
        _pixelTextures.kitchenTile = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelTileFloor({
                baseColor: '#F0F0E8',
                darkColor: '#D8D8D0',
                groutColor: '#B8B8B0',
                tileSize: 12,
                width: 256,
                height: 128
            })
        );
        _pixelTextures.carpet = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelCarpet({
                baseColor: '#B89068',
                patternColor1: '#D4A878',
                patternColor2: '#987048',
                width: 256,
                height: 128
            })
        );
        _pixelTextures.brickWall = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelBrickWall({
                baseColor: '#E8DCC8',
                darkColor: '#D4C4A8',
                mortarColor: '#C8B898',
                width: 256,
                height: 192
            })
        );
        _pixelTextures.wallpaper = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelWallpaper('dot', {
                baseColor: '#F5EEE8',
                patternColor: '#E8DCC8',
                accentColor: '#D4B896',
                width: 256,
                height: 192
            })
        );
        _pixelTextures.concrete = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelConcrete({
                baseColor: '#B8B0A0',
                darkColor: '#A09888',
                lightColor: '#C8C0B0',
                width: 256,
                height: 192
            })
        );
        _pixelTextures.concreteFloor = PixelTextureGenerator.canvasToDataURL(
            PixelTextureGenerator.generatePixelConcrete({
                baseColor: '#A8A090',
                darkColor: '#908878',
                lightColor: '#B8B0A0',
                width: 256,
                height: 128
            })
        );
    }

    var FURNITURE_CONFIG = {
        livingroom: [
            { id: 'sofa', name: '沙发', x: 200, y: 220, width: 80, height: 40, stage: 3, color: '#c8a474', type: 'sofa' },
            { id: 'tea-table', name: '茶几', x: 230, y: 260, width: 40, height: 30, stage: 3, color: '#8B6F47', type: 'table' },
            { id: 'tv-stand', name: '电视柜', x: 200, y: 130, width: 100, height: 20, stage: 3, color: '#6B5344', type: 'cabinet' },
            { id: 'tv', name: '电视', x: 220, y: 100, width: 60, height: 40, stage: 4, color: '#333333', type: 'tv' },
            { id: 'bookshelf', name: '书架', x: 320, y: 130, width: 40, height: 80, stage: 4, color: '#8B6F47', type: 'bookshelf' },
            { id: 'plant', name: '绿植', x: 350, y: 250, width: 25, height: 35, stage: 4, color: '#5B8C5A', type: 'plant' }
        ],
        bedroom: [
            { id: 'bed', name: '床', x: 600, y: 380, width: 120, height: 60, stage: 3, color: '#C8A474', type: 'bed' },
            { id: 'wardrobe', name: '衣柜', x: 580, y: 300, width: 60, height: 80, stage: 3, color: '#8B6F47', type: 'wardrobe' },
            { id: 'nightstand', name: '床头柜', x: 720, y: 370, width: 30, height: 25, stage: 3, color: '#A08468', type: 'nightstand' },
            { id: 'lamp', name: '台灯', x: 725, y: 345, width: 15, height: 25, stage: 4, color: '#FFD700', type: 'lamp' },
            { id: 'rug', name: '地毯', x: 610, y: 420, width: 100, height: 50, stage: 4, color: '#B89068', type: 'rug' }
        ],
        kitchen: [
            { id: 'cabinet', name: '橱柜', x: 580, y: 120, width: 180, height: 30, stage: 3, color: '#8B6F47', type: 'kitchen-cabinet' },
            { id: 'stove', name: '灶台', x: 600, y: 140, width: 50, height: 25, stage: 3, color: '#666666', type: 'stove' },
            { id: 'sink', name: '水槽', x: 680, y: 140, width: 50, height: 25, stage: 3, color: '#A0A0A0', type: 'sink' },
            { id: 'fridge', name: '冰箱', x: 750, y: 130, width: 40, height: 70, stage: 3, color: '#E0E0E0', type: 'fridge' },
            { id: 'range-hood', name: '抽油烟机', x: 600, y: 100, width: 50, height: 20, stage: 4, color: '#888888', type: 'range-hood' }
        ],
        study: [
            { id: 'desk', name: '书桌', x: 50, y: 400, width: 100, height: 30, stage: 3, color: '#8B6F47', type: 'desk' },
            { id: 'chair', name: '椅子', x: 80, y: 430, width: 35, height: 35, stage: 3, color: '#A08468', type: 'chair' },
            { id: 'bookcase', name: '书柜', x: 10, y: 370, width: 50, height: 70, stage: 3, color: '#6B5344', type: 'bookshelf' },
            { id: 'computer', name: '电脑', x: 70, y: 370, width: 35, height: 30, stage: 4, color: '#444444', type: 'computer' },
            { id: 'desk-plant', name: '桌面绿植', x: 120, y: 375, width: 20, height: 25, stage: 4, color: '#5B8C5A', type: 'plant' }
        ],
        entryway: [
            { id: 'shoe-cabinet', name: '鞋柜', x: 20, y: 180, width: 50, height: 80, stage: 3, color: '#8B6F47', type: 'shoe-cabinet' },
            { id: 'hanger', name: '衣架', x: 80, y: 140, width: 40, height: 70, stage: 3, color: '#A08468', type: 'hanger' },
            { id: 'entry-mat', name: '地垫', x: 30, y: 320, width: 60, height: 25, stage: 4, color: '#B89068', type: 'rug' },
            { id: 'mirror', name: '镜子', x: 100, y: 160, width: 25, height: 60, stage: 4, color: '#C8E8F0', type: 'mirror' }
        ],
        balcony: [
            { id: 'flower-pot-1', name: '花盆1', x: 100, y: 40, width: 30, height: 35, stage: 4, color: '#5B8C5A', type: 'plant' },
            { id: 'flower-pot-2', name: '花盆2', x: 600, y: 40, width: 30, height: 35, stage: 4, color: '#5B8C5A', type: 'plant' },
            { id: 'laundry-rack', name: '晾衣架', x: 300, y: 30, width: 120, height: 50, stage: 5, color: '#A0A0A0', type: 'rack' },
            { id: 'small-table', name: '小桌', x: 350, y: 50, width: 40, height: 30, stage: 5, color: '#8B6F47', type: 'table' }
        ]
    };

    var _pixelFurnitureContainer = null;

    function initPixelBackground() {
        if (!scene25d || !PIXEL_STYLE_ENABLED) return;
        if (typeof PixelTextureGenerator === 'undefined') {
            console.warn('[HomeView] PixelTextureGenerator not available');
            return;
        }

        initPixelTextures();

        var sceneContainer = document.getElementById('home-scene-container');
        if (sceneContainer) {
            sceneContainer.classList.add('pixel-style');
        }

        var container25d = document.getElementById('home-scene-25d-container');
        if (container25d) {
            container25d.classList.add('pixel-style');
        }

        var bgLayer = scene25d.getLayer('background');
        if (!bgLayer || !bgLayer._element) return;

        bgLayer._element.classList.add('pixel-style');

        var wall = bgLayer._element.querySelector('.scene25d-bg-wall');
        var floor = bgLayer._element.querySelector('.scene25d-bg-floor');
        var skirting = bgLayer._element.querySelector('.scene25d-bg-skirting');

        if (wall) {
            wall.style.backgroundImage = 'url(' + _pixelTextures.brickWall + ')';
            wall.style.backgroundSize = '128px 96px';
            wall.style.backgroundRepeat = 'repeat';
        }
        if (floor) {
            floor.style.backgroundImage = 'url(' + _pixelTextures.woodFloor + ')';
            floor.style.backgroundSize = '128px 64px';
            floor.style.backgroundRepeat = 'repeat';
        }
        if (skirting) {
            skirting.style.background = 'linear-gradient(180deg, #8B6F47 0%, #6B5344 100%)';
            skirting.style.height = '12px';
        }

        addPixelWindowsAndDoors(bgLayer._element);
    }

    function addPixelWindowsAndDoors(container) {
        if (!container) return;

        var windowsHTML = `
            <div class="pixel-window" style="left: 300px; top: 20px; width: 160px; height: 80px;"></div>
            <div class="pixel-window" style="left: 620px; top: 180px; width: 60px; height: 70px;"></div>
            <div class="pixel-window" style="left: 580px; top: 120px; width: 50px; height: 40px;"></div>
        `;

        var doorsHTML = `
            <div class="pixel-door" style="left: 20px; top: 200px; width: 50px; height: 100px;">
                <div class="pixel-door-handle"></div>
            </div>
        `;

        var bg = container.querySelector('.scene25d-bg');
        if (bg) {
            bg.insertAdjacentHTML('beforeend', windowsHTML + doorsHTML);
        }
    }

    function renderPixelFurniture(roomId, currentStage) {
        if (!scene25d || !PIXEL_STYLE_ENABLED) return;
        if (!FURNITURE_CONFIG[roomId]) return;

        var midLayer = scene25d.getLayer('mid');
        if (!midLayer || !midLayer._element) return;

        if (!_pixelFurnitureContainer) {
            _pixelFurnitureContainer = document.createElement('div');
            _pixelFurnitureContainer.className = 'pixel-furniture-container';
            _pixelFurnitureContainer.style.cssText = 'position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none;';
            var regions = midLayer._element.querySelector('.scene25d-regions');
            if (regions) {
                midLayer._element.insertBefore(_pixelFurnitureContainer, regions.nextSibling);
            } else {
                midLayer._element.appendChild(_pixelFurnitureContainer);
            }
        }

        var furnitureList = FURNITURE_CONFIG[roomId];
        for (var i = 0; i < furnitureList.length; i++) {
            var item = furnitureList[i];
            var furnitureId = 'pixel-furniture-' + roomId + '-' + item.id;
            var existing = document.getElementById(furnitureId);

            if (currentStage >= item.stage) {
                if (!existing) {
                    var furnitureEl = createPixelFurnitureElement(item, roomId);
                    furnitureEl.id = furnitureId;
                    _pixelFurnitureContainer.appendChild(furnitureEl);
                }
            } else {
                if (existing && existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }
            }
        }
    }

    function createPixelFurnitureElement(item, roomId) {
        var el = document.createElement('div');
        el.className = 'pixel-furniture';
        el.style.left = item.x + 'px';
        el.style.top = item.y + 'px';
        el.style.width = item.width + 'px';
        el.style.height = item.height + 'px';
        el.setAttribute('data-furniture-id', item.id);
        el.setAttribute('data-room-id', roomId);
        el.setAttribute('data-name', item.name);

        var shadow = document.createElement('div');
        shadow.className = 'pixel-furniture-shadow';
        shadow.style.cssText = 'position: absolute; width: ' + item.width + 'px; height: 10px; bottom: -5px; left: 5px; background: rgba(0, 0, 0, 0.15); filter: blur(2px);';
        el.appendChild(shadow);

        var body = document.createElement('div');
        body.style.cssText = 'position: absolute; width: 100%; height: 100%;';
        drawPixelFurnitureBody(body, item);
        el.appendChild(body);

        return el;
    }

    function drawPixelFurnitureBody(container, item) {
        var type = item.type || 'default';
        var color = item.color || '#8B6F47';
        var w = item.width;
        var h = item.height;

        var lighter = lightenColor(color, 20);
        var darker = darkenColor(color, 20);
        var darkest = darkenColor(color, 35);

        switch (type) {
            case 'sofa':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 70%; bottom: 0; background: ${color};"></div>
                    <div style="position: absolute; width: 15%; height: 100%; left: 0; bottom: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 15%; height: 100%; right: 0; bottom: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 70%; height: 30%; left: 15%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 2px; height: 2px; background: ${darkest}; left: 25%; top: 35%;"></div>
                    <div style="position: absolute; width: 2px; height: 2px; background: ${darkest}; left: 55%; top: 35%;"></div>
                `;
                break;
            case 'table':
            case 'nightstand':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 20%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 10%; height: 80%; left: 5%; top: 20%; background: ${color};"></div>
                    <div style="position: absolute; width: 10%; height: 80%; right: 5%; top: 20%; background: ${color};"></div>
                    <div style="position: absolute; width: 4px; height: 4px; background: ${darkest}; right: 8px; top: 35%;"></div>
                `;
                break;
            case 'cabinet':
            case 'wardrobe':
            case 'shoe-cabinet':
            case 'kitchen-cabinet':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${color};"></div>
                    <div style="position: absolute; width: 50%; height: 100%; left: 0; background: ${darker}; border-right: 2px solid ${darkest};"></div>
                    <div style="position: absolute; width: 50%; height: 100%; right: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 3px; height: 3px; background: ${darkest}; left: 45%; top: 50%;"></div>
                    <div style="position: absolute; width: 3px; height: 3px; background: ${darkest}; right: 45%; top: 50%;"></div>
                    <div style="position: absolute; width: 100%; height: 10%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 100%; height: 10%; bottom: 0; background: ${darkest};"></div>
                `;
                break;
            case 'tv':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 80%; top: 0; background: ${color}; border: 3px solid ${darkenColor('#333333', 20)};"></div>
                    <div style="position: absolute; width: 80%; height: 60%; left: 10%; top: 10%; background: #1a1a2e;"></div>
                    <div style="position: absolute; width: 20%; height: 15%; left: 40%; bottom: 0; background: ${darkenColor('#333333', 10)};"></div>
                    <div style="position: absolute; width: 40%; height: 5%; left: 30%; bottom: 2%; background: ${darkenColor('#333333', 30)};"></div>
                `;
                break;
            case 'bookshelf':
            case 'bookcase':
                var shelves = '';
                var numShelves = Math.floor(h / 15);
                for (var s = 1; s < numShelves; s++) {
                    shelves += `<div style="position: absolute; width: 100%; height: 2px; background: ${darkest}; top: ${(s * 100 / numShelves)}%;"></div>`;
                }
                var books = '';
                for (var b = 0; b < 5; b++) {
                    var bookColor = ['#C84A3E', '#4A6FA5', '#5B8C5A', '#D4A574', '#9B7BAA'][b % 5];
                    books += `<div style="position: absolute; width: 6px; height: 12px; background: ${bookColor}; left: ${10 + b * 15}%; top: 55%;"></div>`;
                }
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${darker};"></div>
                    <div style="position: absolute; width: 90%; height: 95%; left: 5%; top: 2.5%; background: ${color};"></div>
                    ${shelves}
                    ${books}
                    <div style="position: absolute; width: 100%; height: 5%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 100%; height: 5%; bottom: 0; background: ${darkest};"></div>
                `;
                break;
            case 'plant':
                container.innerHTML = `
                    <div style="position: absolute; width: 60%; height: 30%; left: 20%; bottom: 0; background: #8B6F47; border-radius: 2px;"></div>
                    <div style="position: absolute; width: 50%; height: 50%; left: 25%; bottom: 25%; background: ${color}; border-radius: 50% 50% 40% 40%;"></div>
                    <div style="position: absolute; width: 30%; height: 25%; left: 35%; top: 10%; background: ${lightenColor(color, 20)}; border-radius: 50%;"></div>
                    <div style="position: absolute; width: 25%; height: 20%; left: 15%; top: 25%; background: ${lightenColor(color, 10)}; border-radius: 50%;"></div>
                    <div style="position: absolute; width: 25%; height: 20%; right: 15%; top: 20%; background: ${lightenColor(color, 10)}; border-radius: 50%;"></div>
                `;
                break;
            case 'bed':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 40%; bottom: 0; background: ${color};"></div>
                    <div style="position: absolute; width: 100%; height: 20%; top: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 85%; height: 40%; left: 7.5%; bottom: 35%; background: ${lighter};"></div>
                    <div style="position: absolute; width: 25%; height: 20%; left: 10%; top: 20%; background: #FFF8F0; border-radius: 2px;"></div>
                    <div style="position: absolute; width: 10%; height: 30%; left: 0; bottom: 30%; background: ${darkest};"></div>
                    <div style="position: absolute; width: 10%; height: 30%; right: 0; bottom: 30%; background: ${darkest};"></div>
                `;
                break;
            case 'stove':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${color};"></div>
                    <div style="position: absolute; width: 20%; height: 40%; left: 15%; top: 25%; background: #222; border-radius: 50%;"></div>
                    <div style="position: absolute; width: 20%; height: 40%; right: 15%; top: 25%; background: #222; border-radius: 50%;"></div>
                    <div style="position: absolute; width: 100%; height: 20%; top: 0; background: ${lighter};"></div>
                `;
                break;
            case 'sink':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${darker};"></div>
                    <div style="position: absolute; width: 70%; height: 50%; left: 15%; top: 25%; background: #C8D8E0; border: 2px solid ${darkenColor('#A0A0A0', 10)};"></div>
                    <div style="position: absolute; width: 100%; height: 15%; top: 0; background: ${lighter};"></div>
                `;
                break;
            case 'fridge':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${color};"></div>
                    <div style="position: absolute; width: 100%; height: 35%; top: 0; background: ${lighter}; border-bottom: 2px solid ${darkenColor('#E0E0E0', 20)};"></div>
                    <div style="position: absolute; width: 4px; height: 8px; background: ${darkenColor('#E0E0E0', 30)}; right: 6px; top: 15%;"></div>
                    <div style="position: absolute; width: 4px; height: 12px; background: ${darkenColor('#E0E0E0', 30)}; right: 6px; top: 55%;"></div>
                `;
                break;
            case 'desk':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 15%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 8%; height: 85%; left: 2%; top: 15%; background: ${darker};"></div>
                    <div style="position: absolute; width: 8%; height: 85%; right: 2%; top: 15%; background: ${darker};"></div>
                    <div style="position: absolute; width: 30%; height: 40%; left: 60%; top: 20%; background: ${color};"></div>
                `;
                break;
            case 'chair':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 25%; bottom: 25%; background: ${color};"></div>
                    <div style="position: absolute; width: 100%; height: 50%; top: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 15%; height: 25%; left: 5%; bottom: 0; background: ${darkest};"></div>
                    <div style="position: absolute; width: 15%; height: 25%; right: 5%; bottom: 0; background: ${darkest};"></div>
                `;
                break;
            case 'lamp':
                container.innerHTML = `
                    <div style="position: absolute; width: 60%; height: 40%; left: 20%; top: 0; background: ${color}; border-radius: 50% 50% 10% 10%;"></div>
                    <div style="position: absolute; width: 20%; height: 40%; left: 40%; top: 40%; background: ${darkenColor('#8B6F47', 10)};"></div>
                    <div style="position: absolute; width: 60%; height: 10%; left: 20%; bottom: 0; background: ${darkenColor('#8B6F47', 20)};"></div>
                `;
                break;
            case 'rug':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${color}; opacity: 0.8;"></div>
                    <div style="position: absolute; width: 90%; height: 80%; left: 5%; top: 10%; background: ${lighter}; opacity: 0.6;"></div>
                    <div style="position: absolute; width: 4px; height: 4px; background: ${darkest}; left: 20%; top: 30%;"></div>
                    <div style="position: absolute; width: 4px; height: 4px; background: ${darkest}; right: 20%; top: 30%;"></div>
                    <div style="position: absolute; width: 4px; height: 4px; background: ${darkest}; left: 20%; bottom: 30%;"></div>
                    <div style="position: absolute; width: 4px; height: 4px; background: ${darkest}; right: 20%; bottom: 30%;"></div>
                `;
                break;
            case 'computer':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 75%; top: 0; background: ${color}; border: 2px solid ${darkenColor('#444444', 20)};"></div>
                    <div style="position: absolute; width: 85%; height: 65%; left: 7.5%; top: 10%; background: #1a1a2e;"></div>
                    <div style="position: absolute; width: 30%; height: 20%; left: 35%; bottom: 0; background: ${darkenColor('#444444', 10)};"></div>
                    <div style="position: absolute; width: 50%; height: 5%; left: 25%; bottom: 0; background: ${darkenColor('#444444', 30)};"></div>
                `;
                break;
            case 'hanger':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 8%; top: 0; background: ${color};"></div>
                    <div style="position: absolute; width: 10%; height: 92%; left: 0; top: 8%; background: ${darker};"></div>
                    <div style="position: absolute; width: 10%; height: 92%; right: 0; top: 8%; background: ${darker};"></div>
                    <div style="position: absolute; width: 8px; height: 15px; background: #C84A3E; left: 25%; top: 15%;"></div>
                    <div style="position: absolute; width: 8px; height: 18px; background: #4A6FA5; left: 50%; top: 12%;"></div>
                    <div style="position: absolute; width: 8px; height: 12px; background: #5B8C5A; right: 25%; top: 18%;"></div>
                `;
                break;
            case 'mirror':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${darkenColor('#8B6F47', 10)}; padding: 4px; box-sizing: border-box;"></div>
                    <div style="position: absolute; width: calc(100% - 8px); height: calc(100% - 8px); left: 4px; top: 4px; background: linear-gradient(135deg, #E8F4F8 0%, ${color} 100%);"></div>
                `;
                break;
            case 'range-hood':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 60%; top: 0; background: ${color};"></div>
                    <div style="position: absolute; width: 80%; height: 40%; left: 10%; bottom: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 30%; height: 10%; left: 35%; top: 25%; background: ${darkenColor('#888888', 20)};"></div>
                `;
                break;
            case 'rack':
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 10%; top: 0; background: ${color};"></div>
                    <div style="position: absolute; width: 5%; height: 100%; left: 10%; top: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 5%; height: 100%; right: 10%; top: 0; background: ${darker};"></div>
                    <div style="position: absolute; width: 80%; height: 5%; left: 10%; top: 40%; background: ${darker};"></div>
                    <div style="position: absolute; width: 80%; height: 5%; left: 10%; top: 70%; background: ${darker};"></div>
                `;
                break;
            default:
                container.innerHTML = `
                    <div style="position: absolute; width: 100%; height: 100%; background: ${color};"></div>
                    <div style="position: absolute; width: 100%; height: 20%; top: 0; background: ${lighter};"></div>
                    <div style="position: absolute; width: 100%; height: 10%; bottom: 0; background: ${darkest};"></div>
                `;
        }
    }

    function lightenColor(color, percent) {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) + amt;
        var G = (num >> 8 & 0x00FF) + amt;
        var B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    function darkenColor(color, percent) {
        return lightenColor(color, -percent);
    }

    function updateAllPixelFurniture(currentStage) {
        if (!PIXEL_STYLE_ENABLED) return;
        for (var roomId in FURNITURE_CONFIG) {
            if (FURNITURE_CONFIG.hasOwnProperty(roomId)) {
                renderPixelFurniture(roomId, currentStage);
            }
        }
    }

    function initSceneBackground() {
        if (!scene25d) return;

        var bgLayer = scene25d.getLayer('background');
        if (!bgLayer || !bgLayer._element) return;

        var bgHTML = `
            <div class="scene25d-bg">
                <div class="scene25d-bg-wall"></div>
                <div class="scene25d-bg-skirting"></div>
                <div class="scene25d-bg-floor"></div>
            </div>
        `;
        bgLayer._element.insertAdjacentHTML('afterbegin', bgHTML);

        if (PIXEL_STYLE_ENABLED) {
            initPixelBackground();
        }
    }

    var _timeBadgeEl = null;
    var _timeBadgeTimer = null;

    function initTimeBadge(container) {
        if (!container) return;

        var badge = document.createElement('div');
        badge.className = 'scene25d-time-badge';
        container.appendChild(badge);
        _timeBadgeEl = badge;

        function updateTime() {
            var now = new Date();
            var y = now.getFullYear();
            var m = String(now.getMonth() + 1).padStart(2, '0');
            var d = String(now.getDate()).padStart(2, '0');
            var h = String(now.getHours()).padStart(2, '0');
            var min = String(now.getMinutes()).padStart(2, '0');
            var s = String(now.getSeconds()).padStart(2, '0');
            var timeStr = y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
            badge.textContent = timeStr;

            var hour = now.getHours();
            var isNight = hour >= 19 || hour < 6;
            if (isNight) {
                badge.classList.add('night-mode');
            } else {
                badge.classList.remove('night-mode');
            }
        }

        updateTime();
        _timeBadgeTimer = setInterval(updateTime, 1000);
    }

    function destroyTimeBadge() {
        if (_timeBadgeTimer) {
            clearInterval(_timeBadgeTimer);
            _timeBadgeTimer = null;
        }
        if (_timeBadgeEl && _timeBadgeEl.parentNode) {
            _timeBadgeEl.parentNode.removeChild(_timeBadgeEl);
        }
        _timeBadgeEl = null;
    }

    function initRegionManager() {
        if (!scene25d) return;
        if (typeof RegionManager === 'undefined') {
            console.warn('[HomeView] RegionManager not available');
            return;
        }

        regionManager = RegionManager.create({
            baseWidth: 800,
            baseHeight: 500
        });

        if (!regionManager) {
            console.warn('[HomeView] Failed to create RegionManager');
            return;
        }

        var midLayer = scene25d.getLayer('mid');
        if (midLayer && midLayer._element) {
            var regionVisuals = regionManager.createRegionVisuals();
            midLayer._element.insertBefore(regionVisuals, midLayer._element.firstChild);
        }
    }

    function initStageRegionMapper() {
        if (typeof StageRegionMapper === 'undefined') {
            console.warn('[HomeView] StageRegionMapper not available');
            return;
        }

        stageRegionMapper = StageRegionMapper.create({
            regionManager: regionManager
        });

        if (!stageRegionMapper) {
            console.warn('[HomeView] Failed to create StageRegionMapper');
            return;
        }
    }

    function initAmbientLighting() {
        if (!scene25d) return;
        if (typeof AmbientLighting === 'undefined') {
            console.warn('[HomeView] AmbientLighting not available');
            return;
        }

        var container25d = document.getElementById('home-scene-25d-container');
        if (!container25d) return;

        var useLowPerfMode = isLowEndDevice();
        var currentStage = getCurrentStage();
        var currentHour = new Date().getHours();

        ambientLighting = AmbientLighting.create(container25d, {
            lowPerformanceMode: useLowPerfMode,
            stage: currentStage,
            hour: currentHour
        });

        if (!ambientLighting) {
            console.warn('[HomeView] Failed to create AmbientLighting');
            return;
        }
    }

    function checkWebGLSupport() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function loadNian3DSprite(callback) {
        if (_nian3DScriptLoaded) {
            callback(null);
            return;
        }
        if (_nian3DScriptLoading) {
            _nian3DScriptCallbacks.push(callback);
            return;
        }
        _nian3DScriptLoading = true;
        _nian3DScriptCallbacks.push(callback);

        var script = document.createElement('script');
        script.src = 'js/utils/scene25d/Nian3DSprite.js';
        script.onload = function() {
            _nian3DScriptLoaded = true;
            _nian3DScriptLoading = false;
            var cbs = _nian3DScriptCallbacks.slice();
            _nian3DScriptCallbacks = [];
            cbs.forEach(function(cb) { cb(null); });
        };
        script.onerror = function() {
            _nian3DScriptLoading = false;
            var cbs = _nian3DScriptCallbacks.slice();
            _nian3DScriptCallbacks = [];
            var err = new Error('Failed to load Nian3DSprite.js');
            cbs.forEach(function(cb) { cb(err); });
        };
        document.head.appendChild(script);
    }

    function isLowEndDevice() {
        var cores = navigator.hardwareConcurrency || 4;
        var memory = navigator.deviceMemory || 4;
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var lowCores = cores <= 4;
        var lowMemory = memory <= 2;
        return isMobile && (lowCores || lowMemory);
    }

    function initScene25D() {
        if (!USE_25D_SCENE) return;
        if (scene25d) return;

        var container25d = document.getElementById('home-scene-25d-container');
        if (!container25d) return;

        if (typeof Scene25D === 'undefined') {
            console.warn('[HomeView] Scene25D not available, falling back to SVG');
            USE_25D_SCENE = false;
            return;
        }

        var useLowPerfMode = isLowEndDevice();
        if (useLowPerfMode) {
            console.info('[HomeView] 检测到低端设备，启用低性能模式');
        }

        scene25d = Scene25D.create({
            container: container25d,
            baseWidth: 800,
            baseHeight: 500,
            layers: [
                { id: 'background', name: 'background', zIndex: 1, parallaxFactor: 0.2 },
                { id: 'mid', name: 'mid', zIndex: 2, parallaxFactor: 0.5 },
                { id: 'foreground', name: 'foreground', zIndex: 3, parallaxFactor: 0.8 }
            ],
            parallax: {
                enabled: !useLowPerfMode,
                sensitivity: 0.3
            }
        });

        if (!scene25d) {
            console.warn('[HomeView] Failed to create Scene25D');
            return;
        }

        if (useLowPerfMode && scene25d.setLowPerformanceMode) {
            scene25d.setLowPerformanceMode(true);
        }

        initSceneBackground();
        initTimeBadge(container25d);
        initRegionManager();
        initStageRegionMapper();
        initAmbientLighting();

        if (typeof ObjectManager !== 'undefined') {
            objectManager = ObjectManager.create();
            objectManager.attachToScene(scene25d, {
                background: 'background',
                mid: 'mid',
                foreground: 'foreground'
            });
        }

        if (typeof ProgressSync !== 'undefined' && objectManager) {
            progressSync = ProgressSync.create({
                objectManager: objectManager,
                scene: scene25d,
                regionManager: regionManager,
                autoPoll: true,
                pollDelay: 500,
                persist: true
            });

            if (progressSync && progressSync.onStepCompleted) {
                progressSync.onStepCompleted(function(stepId) {
                    handleProgressStepCompleted(stepId);
                });
            }

            if (progressSync && progressSync.onStageChange) {
                progressSync.onStageChange(function(newStage, oldStage) {
                    handleProgressStageChange(newStage, oldStage);
                });
            }
        }

        initNianSprite();
        initSceneInteraction();
        initStageTransition();

        isScenePaused = false;

        var currentStage = getCurrentStage();
        updateSceneStyle(currentStage);

        scene25d.start();

        _bindSceneResizeHandler();

        addTimer(setTimeout(function() {
            startAutoChat();
        }, 3000));
    }

    var _sceneResizeTimeout = null;

    function _bindSceneResizeHandler() {
        window.addEventListener('resize', _onSceneResize);
    }

    function _unbindSceneResizeHandler() {
        window.removeEventListener('resize', _onSceneResize);
        if (_sceneResizeTimeout) {
            clearTimeout(_sceneResizeTimeout);
            _sceneResizeTimeout = null;
        }
    }

    function _onSceneResize() {
        if (_sceneResizeTimeout) {
            clearTimeout(_sceneResizeTimeout);
        }
        _sceneResizeTimeout = setTimeout(function() {
            updateNian3DSize();
            updateSpeechBubblePosition();
            _sceneResizeTimeout = null;
        }, 150);
    }

    function initSceneInteraction() {
        if (!scene25d) return;
        if (typeof SceneInteraction === 'undefined') {
            console.warn('[HomeView] SceneInteraction not available');
            return;
        }

        var container25d = document.getElementById('home-scene-25d-container');
        if (!container25d) return;

        sceneInteraction = SceneInteraction.create(container25d);

        if (!sceneInteraction) {
            console.warn('[HomeView] Failed to create SceneInteraction');
            return;
        }

        if (regionManager) {
            sceneInteraction.setRegionManager(regionManager);
        }
        if (objectManager) {
            sceneInteraction.setObjectManager(objectManager);
        }
        if (nianSprite) {
            sceneInteraction.setNianSprite(nianSprite);
        }
        if (progressSync) {
            sceneInteraction.setProgressSync(progressSync);
        }

        setTimeout(function() {
            if (sceneInteraction && typeof sceneInteraction.refreshRegionVisuals === 'function') {
                sceneInteraction.refreshRegionVisuals();
            }
        }, 300);

        sceneInteraction.on('objectClick', function(data) {
            resetAutoChatTimer();
            var objName = data && data.config && data.config.name ? data.config.name : '物件';
            showSpeechBubble('你点了' + objName + '，真细心！', false, 'happy', true);
        });

        sceneInteraction.on('regionClick', function(data) {
            resetAutoChatTimer();
            var regionName = data && data.region && data.region.name ? data.region.name : '区域';
            var regionId = data && data.region && data.region.id ? data.region.id : null;
            showSpeechBubble('走，我们去' + regionName + '看看！', false, 'wave', true);
            if (regionId && typeof AchievementSystem !== 'undefined' && typeof AchievementSystem.trackRegionClick === 'function') {
                AchievementSystem.trackRegionClick(regionId);
            }
        });

        sceneInteraction.on('regionHover', function(data) {
            var regionId = data && data.region ? (typeof data.region === 'string' ? data.region : data.region.id) : null;
            var hovering = data && data.hovering;
            if (hovering && regionId && typeof AchievementSystem !== 'undefined' && typeof AchievementSystem.trackRegionHover === 'function') {
                AchievementSystem.trackRegionHover(regionId);
            }
        });

        sceneInteraction.on('regionGoToStep', function(data) {
            resetAutoChatTimer();
            var stepId = data && data.step ? data.step : null;
            var regionId = data && data.regionId ? data.regionId : null;
            if (regionId) {
                _lastViewedRegionId = regionId;
            }
            if (stepId && typeof App !== 'undefined' && typeof App.switchView === 'function') {
                App.switchView('sop');
                setTimeout(function() {
                    if (typeof SopView !== 'undefined' && typeof SopView.gotoStep === 'function') {
                        SopView.gotoStep(stepId);
                    }
                }, 500);
            }
        });
    }

    function initStageTransition() {
        if (typeof StageTransition === 'undefined') {
            console.warn('[HomeView] StageTransition not available');
            return;
        }

        var container25d = document.getElementById('home-scene-25d-container');
        if (!container25d) return;

        var useLowPerfMode = isLowEndDevice();

        stageTransition = StageTransition.create({
            container: container25d,
            scene: scene25d,
            objectManager: objectManager,
            ambientLighting: ambientLighting,
            nianSprite: nianSprite,
            stageStyles: STAGE_STYLES,
            lowPerformanceMode: useLowPerfMode,
            initialStage: getCurrentStage()
        });

        if (!stageTransition) {
            console.warn('[HomeView] Failed to create StageTransition');
            return;
        }

        stageTransition.on('complete', function(data) {
            if (stageRegionMapper) {
                stageRegionMapper.setCurrentStage(data.newStage);
            }
            resetAutoChatTimer();
        });
    }

    function getNewObjectsForStageRange(oldStage, newStage) {
        if (!StepObjectMapping) return [];
        if (newStage <= oldStage) return [];

        var allObjectIds = [];
        for (var stage = oldStage + 1; stage <= newStage; stage++) {
            var stageSteps = StepObjectMapping.getStageSteps(stage);
            for (var i = 0; i < stageSteps.length; i++) {
                var stepId = stageSteps[i];
                var objectIds = StepObjectMapping.getObjectIdsForStep(stepId);
                for (var j = 0; j < objectIds.length; j++) {
                    if (allObjectIds.indexOf(objectIds[j]) === -1) {
                        allObjectIds.push(objectIds[j]);
                    }
                }
            }
        }

        var result = [];
        for (var k = 0; k < allObjectIds.length; k++) {
            var obj = objectManager ? objectManager.getObject(allObjectIds[k]) : null;
            if (!obj || !obj.visible) {
                result.push(allObjectIds[k]);
            }
        }

        return result;
    }

    function initNianSprite() {
        var webglSupported = checkWebGLSupport();

        if (webglSupported) {
            loadNian3DSprite(function(err) {
                if (err || typeof Nian3DSprite === 'undefined' || !Nian3DSprite.isSupported()) {
                    console.info('[HomeView] 3D NianSprite not available, falling back to 2D version');
                    if (typeof NianSprite !== 'undefined') {
                        createNianSprite2D();
                    }
                    return;
                }
                console.info('[HomeView] Using 3D NianSprite');
                createNianSprite3D();
            });
        } else if (typeof NianSprite !== 'undefined') {
            console.info('[HomeView] WebGL not supported, using 2D NianSprite');
            createNianSprite2D();
        }
    }

    function createNianSprite3D() {
        nianSprite = Nian3DSprite.create({
            x: 350,
            y: 280,
            width: 100,
            height: 140,
            initialState: 'idle',
            facing: 'right'
        });
        nianSprite.init();
        nianSprite.addToScene(scene25d, 'foreground');
        nianSprite.start();

        var spriteEl = nianSprite.getElement();
        if (spriteEl) {
            spriteEl.style.pointerEvents = 'auto';
            spriteEl.style.cursor = 'pointer';
            spriteEl.addEventListener('click', handleNianSpriteClick);
        }

        nianIs3D = true;

        if (el.nian) {
            el.nian.style.display = 'none';
        }

        updateNian3DSize();

        var currentStage = getCurrentStage();
        if (stageRegionMapper && currentStage > 0) {
            setNianInitialPosition(currentStage);
        }

        if (sceneInteraction) {
            sceneInteraction.setNianSprite(nianSprite);
        }

        if (stageTransition && stageTransition.setNianSprite) {
            stageTransition.setNianSprite(nianSprite);
        }

        initSpeechBubble();
        initCharacterStateMachine();
        initDialogueSystem();
    }

    function createNianSprite2D() {
        nianSprite = NianSprite.create({
            x: 350,
            y: 280,
            width: 100,
            height: 140,
            initialState: 'idle',
            facing: 'right'
        });
        nianSprite.init();
        nianSprite.addToScene(scene25d, 'foreground');

        var spriteEl = nianSprite.getElement();
        if (spriteEl) {
            spriteEl.style.pointerEvents = 'auto';
            spriteEl.style.cursor = 'pointer';
            spriteEl.addEventListener('click', handleNianSpriteClick);
        }

        nianIs3D = false;

        if (el.nian) {
            el.nian.style.display = 'none';
        }

        var currentStage = getCurrentStage();
        if (stageRegionMapper && currentStage > 0) {
            setNianInitialPosition(currentStage);
        }

        if (sceneInteraction) {
            sceneInteraction.setNianSprite(nianSprite);
        }

        if (stageTransition && stageTransition.setNianSprite) {
            stageTransition.setNianSprite(nianSprite);
        }

        initSpeechBubble();
        initCharacterStateMachine();
        initDialogueSystem();
    }

    function initDialogueSystem() {
        if (typeof DialogueSystem === 'undefined') return;
        if (DialogueSystem.isInitialized()) return;

        if (speechBubble) {
            DialogueSystem.setSpeechBubble(speechBubble);
        }
        if (nianSprite) {
            DialogueSystem.setNianSprite(nianSprite);
        }

        DialogueSystem.init();
    }

    function updateNian3DSize() {
        if (!nianIs3D || !nianSprite || !scene25d) return;

        var scale = scene25d.getScale ? scene25d.getScale() : 1;
        var baseWidth = 100;
        var baseHeight = 140;
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        if (nianSprite.setSize) {
            nianSprite.setSize(baseWidth, baseHeight);
        }
        if (nianSprite.setPixelRatio) {
            nianSprite.setPixelRatio(pixelRatio);
        }
    }

    function handleNianSpriteClick() {
        resetAutoChatTimer();

        nianClickCount++;
        if (nianClickCount === 1) {
            addTimer(setTimeout(function() {
                handleNianSingleClick();
                nianClickCount = 0;
            }, 300));
        } else if (nianClickCount >= 2) {
            handleNianDoubleClick();
            nianClickCount = 0;
        }

        if (typeof AchievementSystem !== 'undefined' && typeof AchievementSystem.trackCharacterClick === 'function') {
            AchievementSystem.trackCharacterClick();
        }

        if (nianSprite) {
            nianSprite.setState('happy');
            addTimer(setTimeout(function() {
                if (nianSprite) {
                    nianSprite.setState('idle');
                }
            }, 1000));
        }
    }

    function startAutoChat() {
        if (autoChatTimer || isAutoChatPaused) return;
        if (isNianGuiding) return;

        autoChatTimer = addTimer(setTimeout(function() {
            triggerAutoChat();
        }, autoChatInterval));
    }

    function stopAutoChat() {
        if (autoChatTimer) {
            clearTimeout(autoChatTimer);
            autoChatTimer = null;
        }
    }

    function resetAutoChatTimer() {
        stopAutoChat();
        startAutoChat();
    }

    function pauseAutoChat() {
        isAutoChatPaused = true;
        stopAutoChat();
    }

    function resumeAutoChat() {
        isAutoChatPaused = false;
        startAutoChat();
    }

    function triggerAutoChat() {
        if (isNianGuiding) {
            startAutoChat();
            return;
        }

        var currentStage = getCurrentStage();
        var message;
        var state = 'thinking';

        if (stageRegionMapper) {
            var mapping = stageRegionMapper.getMapping(Math.max(1, currentStage));
            var regionId = mapping ? mapping.regionId : null;
            message = stageRegionMapper.getSmartDialog(currentStage, regionId);
            if (mapping && mapping.nianState) {
                state = mapping.nianState;
            }
        } else if (ObjectConfig && typeof ObjectConfig.getRandomStageDialogue === 'function') {
            message = ObjectConfig.getRandomStageDialogue(currentStage);
        } else {
            var stageIndex = Math.max(0, Math.min(currentStage, 5));
            var messages = NIAN_MESSAGES_BY_STAGE[stageIndex];
            message = messages[Math.floor(Math.random() * messages.length)];
        }

        if (nianSprite) {
            nianSprite.setState(state);
            lastSpeechState = state;
            addTimer(setTimeout(function() {
                if (nianSprite && lastSpeechState === state) {
                    nianSprite.setState('idle');
                    lastSpeechState = null;
                }
            }, 2000));
        }

        showSpeechBubble(message, false, state, true);
        updateSpeechBubblePosition();

        startAutoChat();
    }

    function getObjectGuidanceMessage(objectId, objectConfig) {
        if (ObjectConfig && typeof ObjectConfig.getObjectGuidanceMessage === 'function') {
            return ObjectConfig.getObjectGuidanceMessage(objectId);
        }

        var guidanceMessages = {
            'cement_wall': '这是水泥墙，是家的基础哦~',
            'cement_floor': '水泥地已经铺好了，接下来就要开始装修啦！',
            'building_materials': '建筑材料都准备好了，开工！',
            'toolbox': '工具箱里什么都有，有问题随时找我~',
            'blueprint': '设计图纸出来了，看看是不是很期待？',
            'tape_measure': '量一量，尺寸要精准才行~',
            'design_tools': '设计工具都齐全，打造理想的家~',
            'sample_board': '样板选好了吗？颜色很重要哦~',
            'wire_pipe': '电线管要布好了，用电安全第一！',
            'water_pipe': '水管安装中，记得做防水哦~',
            'distribution_box': '配电箱，家里的电力中枢~',
            'slotting_tool': '开槽工具，水电改造必备~',
            'tiles': '瓷砖贴好了，家越来越像样了！',
            'paint_bucket': '油漆桶，给家添点颜色~',
            'wood_board': '木板材料，木工要开始啦！',
            'cement_bag': '水泥袋，瓦工的好帮手~',
            'lamp': '灯具装好啦，家一下子就亮堂了！',
            'floor': '地板铺好了，脚感真舒服~',
            'door': '门安装好了，家的感觉出来了！',
            'cabinet': '橱柜做好了，收纳空间满满~',
            'window': '窗户安装好了，采光真好！',
            'sofa': '沙发放好了，以后可以葛优躺了~',
            'table': '桌子摆好了，吃饭更香了！',
            'chair': '椅子也有了，坐下来休息一下~',
            'curtain': '窗帘挂好了，氛围感拉满！',
            'plant': '绿植来了，家更有生机了~',
            'painting': '装饰画挂上了，艺术感up！'
        };

        if (guidanceMessages[objectId]) {
            return guidanceMessages[objectId];
        }

        if (objectConfig && objectConfig.name) {
            return '看！' + objectConfig.name + ' 已经就位了~';
        }

        return '又有新东西啦，快来看看~';
    }

    function guideToObject(objectId) {
        if (!nianSprite || !objectManager) return;
        if (isNianGuiding) return;

        var obj = objectManager.getObject(objectId);
        if (!obj) return;

        var objConfig = ObjectConfig ? ObjectConfig.getConfig(objectId) : null;
        if (!objConfig) return;

        isNianGuiding = true;
        pauseAutoChat();

        var objX = objConfig.defaultX || 300;
        var objY = objConfig.defaultY || 300;
        var objWidth = objConfig.width || 60;

        var targetX = objX - 80;
        var targetY = objY - 20;

        if (targetX < 50) {
            targetX = objX + objWidth + 20;
            nianSprite.setFacing('left');
        } else {
            nianSprite.setFacing('right');
        }

        targetX = Math.max(20, Math.min(targetX, 700));
        targetY = Math.max(150, Math.min(targetY, 380));

        nianSprite.setState('walk');
        nianSprite.moveTo(targetX, targetY, 800, function() {
            if (nianSprite) {
                nianSprite.setState('point');
            }

            var message = getObjectGuidanceMessage(objectId, objConfig);
            showSpeechBubble(message, false, 'point', true);
            updateSpeechBubblePosition();

            addTimer(setTimeout(function() {
                if (nianSprite) {
                    nianSprite.setState('happy');
                }
                updateSpeechBubblePosition();
            }, 1500));

            addTimer(setTimeout(function() {
                returnNianToOriginal();
            }, 3500));
        });
    }

    function returnNianToOriginal() {
        if (!nianSprite) {
            isNianGuiding = false;
            resumeAutoChat();
            return;
        }

        var origX = nianOriginalPosition.x;
        var origY = nianOriginalPosition.y;

        if (origX < 350) {
            nianSprite.setFacing('right');
        } else {
            nianSprite.setFacing('left');
        }

        nianSprite.setState('walk');
        nianSprite.moveTo(origX, origY, 800, function() {
            if (nianSprite) {
                nianSprite.setState('idle');
                nianSprite.setFacing('right');
            }
            isNianGuiding = false;
            resumeAutoChat();
        });
    }

    function queueNianState(stateName, duration) {
        nianStateQueue.push({
            state: stateName,
            duration: duration || 1000
        });

        if (!isNianStateTransitioning) {
            processNianStateQueue();
        }
    }

    function processNianStateQueue() {
        if (nianStateQueue.length === 0) {
            isNianStateTransitioning = false;
            return;
        }

        isNianStateTransitioning = true;
        var nextState = nianStateQueue.shift();

        if (nianSprite) {
            nianSprite.setState(nextState.state);
        }

        addTimer(setTimeout(function() {
            processNianStateQueue();
        }, nextState.duration));
    }

    function clearNianStateQueue() {
        for (var i = 0; i < nianStateQueue.length; i++) {
            var item = nianStateQueue[i];
            if (item && item.timer) {
                clearInterval(item.timer);
                clearTimeout(item.timer);
            }
        }
        nianStateQueue = [];
        isNianStateTransitioning = false;
    }

    function pauseScene25D() {
        if (scene25d && !isScenePaused) {
            scene25d.pause();
            isScenePaused = true;
        }
        if (nianSprite && nianSprite.pause) {
            nianSprite.pause();
        }
        if (progressSync) {
            progressSync.stopPolling();
        }
        if (ambientLighting && ambientLighting.pause) {
            ambientLighting.pause();
        }
        if (speechBubble && speechBubble.pause) {
            speechBubble.pause();
        }
        if (stageTransition && stageTransition.pause) {
            stageTransition.pause();
        }
        if (typeof NotificationBar !== 'undefined' && typeof NotificationBar.pause === 'function') {
            NotificationBar.pause();
        }
        pauseAutoChat();
    }

    function resumeScene25D() {
        if (scene25d && isScenePaused) {
            scene25d.resume();
            isScenePaused = false;
        }
        if (nianSprite && nianSprite.resume) {
            nianSprite.resume();
        }
        if (progressSync) {
            progressSync.startPolling();
        }
        if (ambientLighting && ambientLighting.resume) {
            ambientLighting.resume();
        }
        if (speechBubble && speechBubble.resume) {
            speechBubble.resume();
        }
        if (stageTransition && stageTransition.resume) {
            stageTransition.resume();
        }
        if (typeof NotificationBar !== 'undefined' && typeof NotificationBar.resume === 'function') {
            NotificationBar.resume();
        }
        resumeAutoChat();
    }

    function destroyScene25D() {
        stopAutoChat();
        clearNianStateQueue();
        isNianGuiding = false;

        _unbindSceneResizeHandler();

        if (sceneInteraction) {
            sceneInteraction.destroy();
            sceneInteraction = null;
        }

        if (progressSync) {
            progressSync.destroy();
            progressSync = null;
        }
        if (objectManager) {
            objectManager.clear();
            objectManager = null;
        }
        if (nianSprite) {
            nianSprite.destroy();
            nianSprite = null;
        }
        nianIs3D = false;
        if (regionManager) {
            regionManager = null;
        }
        if (ambientLighting) {
            ambientLighting.destroy();
            ambientLighting = null;
        }
        if (stageTransition) {
            stageTransition.destroy();
            stageTransition = null;
        }
        if (speechBubble) {
            speechBubble.destroy();
            speechBubble = null;
        }
        if (characterStateMachine) {
            characterStateMachine.destroy();
            characterStateMachine = null;
        }
        if (typeof NotificationBar !== 'undefined' && typeof NotificationBar.hideAll === 'function') {
            NotificationBar.hideAll();
        }
        destroyTimeBadge();
        if (scene25d) {
            scene25d.destroy();
            scene25d = null;
        }
        if (el.nian) {
            el.nian.style.display = '';
        }
        isScenePaused = false;
        scene25dContainer = null;
    }

    function showNianAutoTip(message) {
        var tipId = 'nian-auto-tip-' + Date.now();
        var tipHtml = `
            <div class="nian-auto-tip" id="${tipId}">
                <div class="nian-auto-tip-content">
                    <span class="nian-auto-tip-emoji">${Icons.render('nian-happy')}</span>
                    <span class="nian-auto-tip-text">${message}</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', tipHtml);

        var tip = document.getElementById(tipId);
        addTimer(setTimeout(function() {
            tip.classList.add('show');
        }, 50));

        addTimer(setTimeout(function() {
            tip.classList.remove('show');
            addTimer(setTimeout(function() {
                tip.remove();
            }, 500));
        }, 3000));
    }

    function subscribeEvents() {
        unsubscribeEvents();
        
        var unsub1 = EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function(data) {
            handleStepCompleted(data);
        });
        eventUnsubscribers.push(unsub1);
        
        var unsub2 = EventBus.on(EventBus.EVENTS.MODE_CHANGED, function(data) {
            handleModeChanged(data);
        });
        eventUnsubscribers.push(unsub2);

        var unsub3 = EventBus.on(EventBus.EVENTS.VIEW_CHANGED, function(data) {
            handleViewChanged(data);
        });
        eventUnsubscribers.push(unsub3);

        var unsub4 = EventBus.on(EventBus.EVENTS.LEVEL_UP, function(data) {
            handleLevelUp(data);
        });
        eventUnsubscribers.push(unsub4);

        var unsub5 = EventBus.on('cultivation:expGained', function(data) {
            handleExpGained(data);
        });
        eventUnsubscribers.push(unsub5);

        var unsub6 = EventBus.on('cultivation:dailyCheckIn', function(data) {
            handleDailyCheckIn(data);
        });
        eventUnsubscribers.push(unsub6);
    }

    function handleLevelUp(data) {
        if (!data) return;
        addTimer(setTimeout(function() {
            triggerLevelUp({
                level: data.newLevel,
                name: data.title,
                title: data.title,
                rewards: data.rewards || [],
                unlocks: data.unlocks || []
            });
        }, 500));
    }

    function handleExpGained(data) {
        if (!data) return;
        
        if (container) {
            var levelBadge = container.querySelector('.home-level-badge');
            if (levelBadge) {
                levelBadge.innerHTML = buildLevelBadgeHTML();
                animateLevelProgress();
            }
        }
        
        showExpGainNotification(data.amount);
    }

    function handleDailyCheckIn(data) {
        if (!data) return;
        if (typeof Toast !== 'undefined') {
            var bonusText = data.consecutive >= 7 ? '（7日连续签到1.5倍！）' : (data.consecutive >= 3 ? '（3日连续签到1.2倍！）' : '');
            Toast.success('📅 每日签到 +' + data.expGained + ' 经验' + bonusText);
        }
    }

    function handleViewChanged(data) {
        if (!data) return;
        if (data.to === 'home' && data.from === 'sop') {
            focusLastViewedRegion();
        }
    }

    function setLastViewedRegion(regionId) {
        _lastViewedRegionId = regionId;
    }

    function focusLastViewedRegion() {
        if (!sceneInteraction || !_lastViewedRegionId) return;
        if (typeof sceneInteraction.focusRegion !== 'function') return;

        setTimeout(function() {
            sceneInteraction.focusRegion(_lastViewedRegionId);
            _lastViewedRegionId = null;
        }, 600);
    }

    function unsubscribeEvents() {
        for (var i = 0; i < eventUnsubscribers.length; i++) {
            var unsub = eventUnsubscribers[i];
            if (typeof unsub === 'function') {
                unsub();
            }
        }
        eventUnsubscribers = [];
    }

    function handleModeChanged(data) {
        ensureHomeData();
        refresh();
    }

    function handleStepCompleted(data) {
        var homeData = ensureHomeData();
        var currentStage = getCurrentStage();
        var shouldShowEquipment = false;
        var equipmentToShow = null;
        
        if (currentStage > 0 && homeData.awardedStages.indexOf(currentStage) === -1) {
            var equipment = null;
            for (var e = 0; e < STAGE_EQUIPMENT.length; e++) {
                if (STAGE_EQUIPMENT[e].stage === currentStage) {
                    equipment = STAGE_EQUIPMENT[e];
                    break;
                }
            }
            if (equipment) {
                homeData.awardedStages.push(currentStage);
                shouldShowEquipment = true;
                equipmentToShow = equipment;
            }
        }

        saveHomeData(homeData);
        refresh();

        if (shouldShowEquipment && equipmentToShow) {
            addTimer(setTimeout(function() {
                showEquipmentModal(equipmentToShow);
            }, 300));
        }
    }

    function initNianInteraction() {
        if (!el.nian) return;

        el.nian.addEventListener('mouseenter', function() {
            el.nian.classList.add('sway');
        });

        el.nian.addEventListener('mouseleave', function() {
            if (!el.nian.classList.contains('bow') && !el.nian.classList.contains('spin-bounce')) {
            }
        });

        el.nian.addEventListener('click', function() {
            nianClickCount++;
            if (nianClickCount === 1) {
                addTimer(setTimeout(function() {
                    handleNianSingleClick();
                    nianClickCount = 0;
                }, 300));
            } else if (nianClickCount >= 2) {
                handleNianDoubleClick();
                nianClickCount = 0;
            }
        });
    }

    function getStageMessage() {
        var currentStage = getCurrentStage();
        var stageIndex = Math.max(0, Math.min(currentStage, 5));
        var messages = NIAN_MESSAGES_BY_STAGE[stageIndex];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    function getNianElement() {
        if (USE_25D_SCENE && nianSprite) {
            return nianSprite.getElement();
        }
        return el.nian;
    }

    function getSpeechBubble() {
        return el.speechBubble;
    }

    function showSpeechBubble(message, isHTML, stateIcon, withTypewriter) {
        if (typeof AchievementSystem !== 'undefined' && typeof AchievementSystem.trackDialogue === 'function') {
            AchievementSystem.trackDialogue();
        }

        if (USE_25D_SCENE && speechBubble) {
            var nianPos = getNianPosition();
            speechBubble.setPosition(nianPos.x, nianPos.y);

            if (stateIcon) {
                speechBubble.setStateIcon(stateIcon);
            }
            speechBubble.setText(message, withTypewriter !== false);
            speechBubble.show();

            if (nianSprite && stateIcon) {
                nianSprite.setState(stateIcon);
                lastSpeechState = stateIcon;
                addTimer(setTimeout(function() {
                    if (nianSprite && lastSpeechState === stateIcon) {
                        nianSprite.setState('idle');
                        lastSpeechState = null;
                    }
                }, 2500));
            }

            return;
        }

        var bubble = getSpeechBubble();
        if (!bubble) return;

        if (isHTML) {
            bubble.innerHTML = message;
        } else {
            bubble.textContent = message;
        }
        bubble.classList.add('show');

        addTimer(setTimeout(function() {
            bubble.classList.remove('show');
        }, 3000));
    }

    function getNianPosition() {
        if (!nianSprite) {
            return nianOriginalPosition;
        }
        var spriteEl = nianSprite.getElement();
        if (!spriteEl) {
            return nianOriginalPosition;
        }
        var sceneContainer = document.getElementById('home-scene-25d-container');
        if (!sceneContainer) {
            return nianOriginalPosition;
        }
        var spriteRect = spriteEl.getBoundingClientRect();
        var containerRect = sceneContainer.getBoundingClientRect();
        return {
            x: spriteRect.left - containerRect.left + spriteRect.width / 2,
            y: spriteRect.top - containerRect.top + spriteRect.height / 2
        };
    }

    function initSpeechBubble() {
        if (!USE_25D_SCENE) return;
        if (speechBubble) return;
        if (typeof SpeechBubble === 'undefined') return;

        var sceneContainer = document.getElementById('home-scene-25d-container');
        if (!sceneContainer) return;

        var useLowPerfMode = isLowEndDevice();

        speechBubble = SpeechBubble.create({
            container: sceneContainer,
            x: nianOriginalPosition.x,
            y: nianOriginalPosition.y,
            width: 240,
            typewriterSpeed: 60,
            autoHideDuration: 4000,
            lowPerformanceMode: useLowPerfMode
        });

        if (typeof NotificationBar !== 'undefined' && typeof NotificationBar.setLowPerformanceMode === 'function') {
            NotificationBar.setLowPerformanceMode(useLowPerfMode);
        }

        if (speechBubble && nianSprite) {
            nianSprite.addUpdateCallback(function() {
                if (speechBubble && speechBubble.isVisible() && !speechBubble.isTyping()) {
                    var pos = getNianPosition();
                    speechBubble.setPosition(pos.x, pos.y);
                }
            });
        }
    }

    function initCharacterStateMachine() {
        if (!USE_25D_SCENE) return;
        if (characterStateMachine) return;
        if (typeof CharacterStateMachine === 'undefined') return;
        if (!nianSprite || !speechBubble || !regionManager) return;

        var sceneContainer = document.getElementById('home-scene-25d-container');
        if (!sceneContainer) return;

        characterStateMachine = CharacterStateMachine.create({
            nianSprite: nianSprite,
            speechBubble: speechBubble,
            regionManager: regionManager,
            container: sceneContainer
        });

        if (!characterStateMachine) {
            console.warn('[HomeView] Failed to create CharacterStateMachine');
            return;
        }

        characterStateMachine.init();

        if (scene25d && scene25d.animationLoop) {
            scene25d.animationLoop.addUpdateCallback(function(deltaTime) {
                if (characterStateMachine && characterStateMachine.update) {
                    characterStateMachine.update(deltaTime);
                }
            });
        }

        console.info('[HomeView] CharacterStateMachine initialized');
    }

    function handleNianSingleClick() {
        resetAutoChatTimer();
        var nianEl = getNianElement();
        if (!nianEl) return;

        if (nianEl && !USE_25D_SCENE) {
            nianEl.classList.remove('sway', 'spin-bounce');
            nianEl.classList.add('bow');
        }

        var clickDialog = null;
        if (stageRegionMapper && typeof stageRegionMapper.getRandomClickDialog === 'function') {
            clickDialog = stageRegionMapper.getRandomClickDialog();
        }

        var state = clickDialog && clickDialog.state ? clickDialog.state : 'wave';
        var message = clickDialog && clickDialog.text ? clickDialog.text : getStageMessage();

        if (nianSprite) {
            nianSprite.setState(state);
            lastSpeechState = state;
            addTimer(setTimeout(function() {
                if (nianSprite && lastSpeechState === state) {
                    nianSprite.setState('idle');
                    lastSpeechState = null;
                }
            }, 1500));
        }

        showSpeechBubble(message, false, state, true);
        updateSpeechBubblePosition();

        burstBambooParticles();

        if (nianEl && !USE_25D_SCENE) {
            addTimer(setTimeout(function() {
                nianEl.classList.remove('bow');
                nianEl.classList.add('sway');
            }, 1000));
        }
    }

    function handleNianDoubleClick() {
        resetAutoChatTimer();
        var nianEl = getNianElement();
        if (!nianEl) return;

        if (nianEl && !USE_25D_SCENE) {
            nianEl.classList.remove('sway', 'bow');
            nianEl.classList.add('spin-bounce');
        }

        if (nianSprite) {
            nianSprite.setState('celebrate');
            addTimer(setTimeout(function() {
                if (nianSprite) {
                    nianSprite.setState('idle');
                }
            }, 2000));
        }

        showSpeechBubble('哇！好开心！🎉', false, 'celebrate', true);
        updateSpeechBubblePosition();

        burstBambooParticles(20);
        addTimer(setTimeout(function() {
            burstBambooParticles(15);
        }, 300));

        if (nianEl && !USE_25D_SCENE) {
            addTimer(setTimeout(function() {
                nianEl.classList.remove('spin-bounce');
                nianEl.classList.add('sway');
            }, 1200));
        }
    }

    function updateSpeechBubblePosition() {
        if (!USE_25D_SCENE || !nianSprite) return;

        var bubble = getSpeechBubble();
        if (!bubble) return;

        var spriteEl = nianSprite.getElement();
        if (!spriteEl) return;

        var sceneContainer = document.getElementById('home-scene-25d-container');
        if (!sceneContainer) return;

        var spriteRect = spriteEl.getBoundingClientRect();
        var containerRect = sceneContainer.getBoundingClientRect();

        var relativeLeft = spriteRect.left - containerRect.left + spriteRect.width / 2;
        var relativeTop = spriteRect.top - containerRect.top;

        bubble.style.position = 'absolute';
        bubble.style.left = relativeLeft + 'px';
        bubble.style.top = Math.max(10, relativeTop - 20) + 'px';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.zIndex = '10';
    }

    function burstBambooParticles(count) {
        if (!el.particlesCanvas || !window.ParticleSystem) return;

        var nianEl = getNianElement();
        if (!nianEl) return;

        var rect = el.particlesCanvas.getBoundingClientRect();
        var nianRect = nianEl.getBoundingClientRect();
        
        if (el.particlesCanvas.width !== rect.width * window.devicePixelRatio) {
            el.particlesCanvas.width = rect.width * window.devicePixelRatio;
            el.particlesCanvas.height = rect.height * window.devicePixelRatio;
            el.particlesCanvas.style.width = rect.width + 'px';
            el.particlesCanvas.style.height = rect.height + 'px';
        }

        ParticleSystem.init(el.particlesCanvas);

        var x = nianRect.left + nianRect.width / 2 - rect.left;
        var y = nianRect.top - rect.top;

        ParticleSystem.burst(x, y, count || 12, 'bamboo');
    }

    function initActionButtons() {
        if (el.backBtn) {
            el.backBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('hero');
                }
            });
        }

        if (el.sopBtn) {
            el.sopBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('sop');
                }
            });
        }

        if (el.budgetBtn) {
            el.budgetBtn.addEventListener('click', function() {
                if (window.App && typeof App.switchView === 'function') {
                    App.switchView('budget');
                }
            });
        }

        if (el.timelineBtn) {
            el.timelineBtn.addEventListener('click', function() {
                showTimelineModal();
            });
        }

        if (el.collectionBtn) {
            el.collectionBtn.addEventListener('click', function() {
                showCollectionModal();
            });
        }

        if (el.collectionCloseBtn) {
            el.collectionCloseBtn.addEventListener('click', function() {
                hideCollectionModal();
            });
        }

        if (el.collectionModal) {
            el.collectionModal.addEventListener('click', function(e) {
                if (e.target === el.collectionModal) {
                    hideCollectionModal();
                }
            });
        }

        if (el.achievementBtn) {
            el.achievementBtn.addEventListener('click', function() {
                if (typeof AchievementModal !== 'undefined' && AchievementModal.show) {
                    AchievementModal.show();
                } else {
                    showAchievementModal();
                }
                pauseAutoChat();
            });
        }

        if (el.achievementCloseBtn) {
            el.achievementCloseBtn.addEventListener('click', function() {
                hideAchievementModal();
            });
        }

        if (el.achievementModal) {
            el.achievementModal.addEventListener('click', function(e) {
                if (e.target === el.achievementModal) {
                    hideAchievementModal();
                }
            });
        }

        if (el.dailyTasksBtn) {
            el.dailyTasksBtn.addEventListener('click', function() {
                if (typeof DailyTasks !== 'undefined' && DailyTasks.show) {
                    DailyTasks.show();
                }
                pauseAutoChat();
            });
        }

        if (el.assetBtn) {
            el.assetBtn.addEventListener('click', function() {
                if (typeof AssetSystem !== 'undefined' && AssetSystem.show) {
                    AssetSystem.show();
                }
                pauseAutoChat();
            });
        }
        
        if (el.resetBtn) {
            el.resetBtn.addEventListener('click', function() {
                showResetModal();
            });
        }
        
        if (el.resetCancelBtn) {
            el.resetCancelBtn.addEventListener('click', function() {
                hideResetModal();
            });
        }
        
        if (el.resetConfirmBtn) {
            el.resetConfirmBtn.addEventListener('click', function() {
                hideResetModal();
                resetScene25D();
                if (window.App && typeof App.resetAllData === 'function') {
                    App.resetAllData(function() {
                        if (typeof App.switchView === 'function') {
                            App.switchView('hero');
                        }
                    });
                }
            });
        }
    }

    function viewLeave() {
        pauseScene25D();
        stopAutoChat();
        clearNianStateQueue();
        isNianGuiding = false;
    }
    
    function showResetModal() {
        if (el.resetModal) {
            el.resetModal.classList.add('active');
        }
    }
    
    function hideResetModal() {
        if (el.resetModal) {
            el.resetModal.classList.remove('active');
        }
    }

    function initEquipmentModal() {
        if (el.equipmentModal && el.equipAcceptBtn) {
            el.equipAcceptBtn.addEventListener('click', function() {
                hideEquipmentModal();
            });

            el.equipmentModal.addEventListener('click', function(e) {
                if (e.target === el.equipmentModal) {
                    hideEquipmentModal();
                }
            });
        }
    }

    function showEquipmentModal(equipment) {
        if (!el.equipmentModal || !el.equipIcon || !el.equipName || !el.equipDesc) return;

        el.equipIcon.innerHTML = Icons.render(equipment.icon);
        el.equipName.textContent = equipment.name;
        el.equipDesc.textContent = equipment.desc;

        el.equipmentModal.classList.add('active');
    }

    function hideEquipmentModal() {
        if (el.equipmentModal) {
            el.equipmentModal.classList.remove('active');
        }
    }

    function initLevelUpModal() {
        if (el.levelUpModal && el.levelUpConfirmBtn) {
            el.levelUpConfirmBtn.addEventListener('click', function() {
                hideLevelUpModal();
            });
        }
    }

    function triggerLevelUp(levelInfo) {
        if (!el.levelUpModal || !el.levelUpLevelName || !el.levelUpStars) return;

        var level = levelInfo.level || levelInfo.newLevel || 1;
        var title = levelInfo.title || levelInfo.name || '';
        var rewards = levelInfo.rewards || [];
        var unlocks = levelInfo.unlocks || [];

        el.levelUpLevelName.textContent = 'Lv.' + level + ' ' + title;
        el.levelUpSubtitle.textContent = title + '登场！';

        el.levelUpStars.innerHTML = '';
        var starCount = Math.min(level, 10);
        for (var i = 0; i < starCount; i++) {
            var star = document.createElement('span');
            star.className = 'level-star';
            star.innerHTML = Icons.render('star');
            star.style.animationDelay = (0.8 + i * 0.15) + 's';
            el.levelUpStars.appendChild(star);
        }

        if (el.levelUpRewardsSection && el.levelUpRewardsList) {
            var hasRewards = rewards.length > 0 || unlocks.length > 0;
            el.levelUpRewardsSection.style.display = hasRewards ? 'block' : 'none';
            
            if (hasRewards) {
                var rewardsHtml = '';
                
                for (var r = 0; r < rewards.length; r++) {
                    var reward = rewards[r];
                    rewardsHtml += `
                        <div class="levelup-reward-item">
                            <span class="levelup-reward-icon">${reward.icon || '🎁'}</span>
                            <span class="levelup-reward-name">${reward.name}</span>
                        </div>
                    `;
                }
                
                for (var u = 0; u < unlocks.length; u++) {
                    rewardsHtml += `
                        <div class="levelup-reward-item unlock">
                            <span class="levelup-reward-icon">🔓</span>
                            <span class="levelup-reward-name">${unlocks[u]}</span>
                        </div>
                    `;
                }
                
                el.levelUpRewardsList.innerHTML = rewardsHtml;
            }
        }

        createLevelUpParticles();

        el.levelUpModal.classList.add('active');

        if (el.nian) {
            el.nian.classList.add('home-nian-level-up');
            addTimer(setTimeout(function() {
                el.nian.classList.remove('home-nian-level-up');
            }, 1500));
        }

        if (typeof AnimUtils !== 'undefined' && typeof AnimUtils.createCelebration === 'function') {
            AnimUtils.createCelebration({
                title: '🎉 等级提升！',
                subtitle: '恭喜达到 ' + title,
                duration: 3000
            });
        }
        
        burstBambooParticles(30);
        addTimer(setTimeout(function() {
            burstBambooParticles(20);
        }, 300));
    }

    function createLevelUpParticles() {
        if (!el.levelUpParticles) return;
        
        el.levelUpParticles.innerHTML = '';
        
        var colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB', '#00CED1'];
        var particleCount = 40;
        
        for (var i = 0; i < particleCount; i++) {
            var particle = document.createElement('div');
            particle.className = 'levelup-particle';
            var size = Math.random() * 10 + 5;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            el.levelUpParticles.appendChild(particle);
        }
    }

    function hideLevelUpModal() {
        if (el.levelUpModal) {
            el.levelUpModal.classList.remove('active');
        }
    }

    function refreshSceneElements() {
        var currentStage = getCurrentStage();
        var elements = document.querySelectorAll('.home-scene-element');
        elements.forEach(function(el) {
            el.classList.remove('visible');
        });

        for (var i = 1; i <= currentStage; i++) {
            var stageElements = document.querySelectorAll('.stage-' + i);
            stageElements.forEach(function(el) {
                el.classList.add('visible');
            });
        }
    }

    function refresh() {
        if (!container) return;

        var completedSteps = getCompletedStepsCount();
        var currentLevel = getCurrentLevel(completedSteps);
        var cultivationLevel = typeof CultivationData !== 'undefined' ? CultivationData.getLevel() : currentLevel.level;
        var homeData = ensureHomeData();

        syncAchievementStats();

        var levelBadge = container.querySelector('.home-level-badge');
        if (levelBadge) {
            levelBadge.innerHTML = buildLevelBadgeHTML();
            animateLevelProgress();
        }

        if (el.sceneContainer) {
            if (USE_25D_SCENE) {
                if (progressSync) {
                    progressSync.sync();
                }
            } else {
                var svgEl = el.sceneContainer.querySelector('.home-scene-svg');
                if (svgEl) {
                    svgEl.outerHTML = buildSceneSVG().trim();
                }
                addTimer(setTimeout(function() {
                    refreshSceneElements();
                }, 50));
            }
        }

        if (el.nian) {
            var oldDecorations = el.nian.querySelectorAll('.nian-decoration');
            oldDecorations.forEach(function(d) { d.remove(); });
            el.nian.insertAdjacentHTML('beforeend', buildNianDecorations(cultivationLevel));
        }
    }

    function resetScene25D() {
        if (progressSync) {
            progressSync.reset();
        }
        if (objectManager) {
            objectManager.clear();
        }
        if (stageTransition && stageTransition.getCurrentStage) {
            if (stageTransition.setStageStyles) {
                stageTransition.setStageStyles(STAGE_STYLES);
            }
        }
    }

    function destroy() {
        clearAllTimers();
        unsubscribeEvents();
        destroyNian3DAvatar();
        destroyScene25D();
        removeVisibilityListener();
        clearElementCache();
        nianClickCount = 0;
        container = null;
    }

    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[HomeView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: '页面加载失败',
                    desc: '小管家在加载首页时遇到了一点小问题~',
                    primaryAction: '重试',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
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
            console.error('[HomeView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            viewEnter(containerEl);
        } catch (e) {
            console.error('[HomeView] viewEnter error:', e);
        }
    }

    function safeRefresh() {
        try {
            refresh();
        } catch (e) {
            console.error('[HomeView] refresh error:', e);
        }
    }

    function safeTriggerLevelUp(level, stars) {
        try {
            triggerLevelUp(level, stars);
        } catch (e) {
            console.error('[HomeView] triggerLevelUp error:', e);
        }
    }

    function safeViewLeave() {
        try {
            viewLeave();
        } catch (e) {
            console.error('[HomeView] viewLeave error:', e);
        }
    }

    return {
        render: safeRender,
        init: safeInit,
        destroy: destroy,
        viewEnter: safeViewEnter,
        viewLeave: safeViewLeave,
        refresh: safeRefresh,
        triggerLevelUp: safeTriggerLevelUp
    };
})();
