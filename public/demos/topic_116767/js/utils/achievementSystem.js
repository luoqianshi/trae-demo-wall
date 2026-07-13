var AchievementSystem = (function() {
    'use strict';

    var ACHIEVEMENTS = [
        {
            id: 'first_step',
            name: '启程',
            description: '完成第一个装修步骤',
            icon: '🎯',
            rarity: 'common',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.completedSteps >= 1;
            }
        },
        {
            id: 'stage_one',
            name: '入门',
            description: '完成第一阶段所有步骤',
            icon: '🌱',
            rarity: 'common',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.completedStages >= 1;
            }
        },
        {
            id: 'half_way',
            name: '半程达人',
            description: '完成 50% 装修步骤',
            icon: '🏃',
            rarity: 'rare',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.completedSteps >= Math.ceil(stats.totalSteps / 2);
            }
        },
        {
            id: 'complete',
            name: '竣工',
            description: '完成全部装修步骤',
            icon: '🏆',
            rarity: 'legendary',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.completedSteps >= stats.totalSteps;
            }
        },
        {
            id: 'on_time',
            name: '准时完工',
            description: '零延期完成装修',
            icon: '⏰',
            rarity: 'epic',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.totalDelays === 0 && stats.completedSteps >= stats.totalSteps;
            }
        },
        {
            id: 'speed_runner',
            name: '效率大师',
            description: '一天内完成 3 个以上步骤',
            icon: '⚡',
            rarity: 'rare',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.maxStepsPerDay >= 3;
            }
        },
        {
            id: 'perfectionist',
            name: '完美主义者',
            description: '所有步骤都获得高质量评价',
            icon: '💎',
            rarity: 'legendary',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.perfectSteps >= stats.totalSteps && stats.totalSteps > 0;
            }
        },
        {
            id: 'budget_saver',
            name: '省钱达人',
            description: '总支出低于预算 80%',
            icon: '💰',
            rarity: 'rare',
            category: 'budget',
            checkCondition: function(stats) {
                return stats.budgetDeviation !== null && stats.budgetDeviation <= -20;
            }
        },
        {
            id: 'budget_master',
            name: '预算大师',
            description: '最终支出与预算偏差小于 5%',
            icon: '🎯',
            rarity: 'epic',
            category: 'budget',
            checkCondition: function(stats) {
                return stats.budgetDeviation !== null && Math.abs(stats.budgetDeviation) <= 5;
            }
        },
        {
            id: 'careful_check',
            name: '细心验收',
            description: '所有验收项 100% 勾选',
            icon: '✅',
            rarity: 'rare',
            category: 'quality',
            checkCondition: function(stats) {
                return stats.checklistCompletion >= 100;
            }
        },
        {
            id: 'zero_rework',
            name: '零返工',
            description: '没有任何返工记录',
            icon: '🛡️',
            rarity: 'epic',
            category: 'quality',
            checkCondition: function(stats) {
                return stats.reworkCount === 0 && stats.completedSteps >= 5;
            }
        },
        {
            id: 'acceptance_expert',
            name: '验收专家',
            description: '所有验收项一次通过',
            icon: '🏅',
            rarity: 'legendary',
            category: 'quality',
            checkCondition: function(stats) {
                return stats.firstTimePassRate >= 100 && stats.checklistCompletion >= 100;
            }
        },
        {
            id: 'collector_5',
            name: '收藏新手',
            description: '收集 5 件以上收藏品',
            icon: '🎨',
            rarity: 'common',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.collectedObjects >= 5;
            }
        },
        {
            id: 'collector_10',
            name: '收藏家',
            description: '收集 10 件以上收藏品',
            icon: '🏺',
            rarity: 'rare',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.collectedObjects >= 10;
            }
        },
        {
            id: 'collector_20',
            name: '收藏大师',
            description: '收集 20 件以上收藏品',
            icon: '👑',
            rarity: 'epic',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.collectedObjects >= 20;
            }
        },
        {
            id: 'tool_master',
            name: '工具达人',
            description: '使用过所有核心工具',
            icon: '🛠️',
            rarity: 'rare',
            category: 'exploration',
            checkCondition: function(stats) {
                return stats.toolsUsed >= 5;
            }
        },
        {
            id: 'all_modes',
            name: '全模式体验',
            description: '体验过三种装修模式',
            icon: '🎭',
            rarity: 'epic',
            category: 'exploration',
            checkCondition: function(stats) {
                return stats.experiencedModes >= 3;
            }
        },
        {
            id: 'knowledge_seeker',
            name: '博学多才',
            description: '阅读 20 篇以上知识库文章',
            icon: '📚',
            rarity: 'rare',
            category: 'exploration',
            checkCondition: function(stats) {
                return stats.articlesRead >= 20;
            }
        },
        {
            id: 'night_owl',
            name: '夜猫子',
            description: '凌晨 2 点后使用 App',
            icon: '🦉',
            rarity: 'rare',
            category: 'hidden',
            isHidden: true,
            checkCondition: function(stats) {
                return stats.lateNightUsage >= 1;
            }
        },
        {
            id: 'lightning_renovation',
            name: '闪电装修',
            description: '演示模式下 3 分钟内看完所有步骤',
            icon: '⚡',
            rarity: 'epic',
            category: 'hidden',
            isHidden: true,
            checkCondition: function(stats) {
                return stats.fastDemoComplete >= 1;
            }
        },
        {
            id: 'mysterious_visitor',
            name: '神秘访客',
            description: '连续 7 天使用 App',
            icon: '🔮',
            rarity: 'legendary',
            category: 'hidden',
            isHidden: true,
            checkCondition: function(stats) {
                return stats.consecutiveDays >= 7;
            }
        },
        {
            id: 'click_mania',
            name: '点击狂魔',
            description: '点击小管家 100 次',
            icon: '👆',
            rarity: 'rare',
            category: 'hidden',
            isHidden: true,
            checkCondition: function(stats) {
                return stats.nianClickCount >= 100;
            }
        },
        {
            id: 'settings_explorer',
            name: '设置探索者',
            description: '浏览过所有设置选项',
            icon: '⚙️',
            rarity: 'common',
            category: 'hidden',
            isHidden: true,
            checkCondition: function(stats) {
                return stats.settingsExplored >= 1;
            }
        },
        {
            id: 'newbie_master',
            name: '入门达人',
            description: '完成所有新手任务',
            icon: '🌟',
            rarity: 'rare',
            category: 'progress',
            checkCondition: function(stats) {
                return stats.newbieCompleted >= 1;
            }
        },
        {
            id: 'first_meeting',
            name: '初次见面',
            description: '首次点击小管家',
            icon: '👋',
            rarity: 'common',
            category: 'interaction',
            checkCondition: function(stats) {
                return stats.nianClickCount >= 1;
            }
        },
        {
            id: 'chatty',
            name: '话痨',
            description: '与小管家对话20次',
            icon: '💬',
            rarity: 'rare',
            category: 'interaction',
            checkCondition: function(stats) {
                return stats.nianChatCount >= 20;
            }
        },
        {
            id: 'explorer',
            name: '探索者',
            description: '点击所有区域',
            icon: '🗺️',
            rarity: 'rare',
            category: 'interaction',
            checkCondition: function(stats) {
                return stats.exploredRegions >= 6;
            }
        },
        {
            id: 'careful_observer',
            name: '细心观察',
            description: '悬停所有区域',
            icon: '🔍',
            rarity: 'common',
            category: 'interaction',
            checkCondition: function(stats) {
                return stats.hoveredRegions >= 6;
            }
        },
        {
            id: 'furniture_collector',
            name: '家具收藏家',
            description: '收集15件家具',
            icon: '🪑',
            rarity: 'rare',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.collectedFurniture >= 15;
            }
        },
        {
            id: 'full_collection',
            name: '全收集',
            description: '收集所有家具',
            icon: '🏠',
            rarity: 'legendary',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.collectedFurniture >= stats.totalFurniture && stats.totalFurniture > 0;
            }
        },
        {
            id: 'codex_master',
            name: '图鉴达人',
            description: '解锁50%图鉴',
            icon: '📖',
            rarity: 'epic',
            category: 'collection',
            checkCondition: function(stats) {
                return stats.totalFurniture > 0 && stats.collectedFurniture >= Math.ceil(stats.totalFurniture * 0.5);
            }
        },
        {
            id: 'daily_checkin',
            name: '每日打卡',
            description: '完成第一天每日任务',
            icon: '✅',
            rarity: 'common',
            category: 'daily',
            checkCondition: function(stats) {
                return stats.dailyTasksCompleted >= 1;
            }
        },
        {
            id: 'persistent',
            name: '坚持不懈',
            description: '连续7天完成每日任务',
            icon: '🔥',
            rarity: 'epic',
            category: 'daily',
            checkCondition: function(stats) {
                return stats.consecutiveDailyTaskDays >= 7;
            }
        },
        {
            id: 'task_master',
            name: '任务达人',
            description: '单日完成所有每日任务',
            icon: '📋',
            rarity: 'rare',
            category: 'daily',
            checkCondition: function(stats) {
                return stats.allDailyTasksCompletedDays >= 1;
            }
        },
        {
            id: 'rookie',
            name: '初出茅庐',
            description: '达到5级',
            icon: '🌱',
            rarity: 'rare',
            category: 'level',
            checkCondition: function(stats) {
                return stats.level >= 5;
            }
        },
        {
            id: 'renovation_expert',
            name: '装修专家',
            description: '达到8级',
            icon: '🔨',
            rarity: 'epic',
            category: 'level',
            checkCondition: function(stats) {
                return stats.level >= 8;
            }
        },
        {
            id: 'legendary_builder',
            name: '传奇建造师',
            description: '达到10级',
            icon: '👑',
            rarity: 'legendary',
            category: 'level',
            checkCondition: function(stats) {
                return stats.level >= 10;
            }
        }
    ];

    var RARITY_CONFIG = {
        common: { 
            name: '普通', 
            color: 'var(--gray-500)', 
            bgColor: 'rgba(160, 160, 154, 0.1)',
            glowColor: 'rgba(160, 160, 154, 0.3)',
            stars: 1
        },
        rare: { 
            name: '稀有', 
            color: 'var(--dai-blue)', 
            bgColor: 'rgba(74, 111, 149, 0.1)',
            glowColor: 'rgba(74, 111, 149, 0.4)',
            stars: 2
        },
        epic: { 
            name: '史诗', 
            color: 'var(--purple)', 
            bgColor: 'rgba(107, 92, 224, 0.1)',
            glowColor: 'rgba(107, 92, 224, 0.5)',
            stars: 3
        },
        legendary: { 
            name: '传说', 
            color: 'var(--gold)', 
            bgColor: 'rgba(201, 162, 39, 0.1)',
            glowColor: 'rgba(201, 162, 39, 0.6)',
            stars: 4
        }
    };

    var CATEGORY_CONFIG = {
        progress: { name: '进度', icon: '📊' },
        budget: { name: '预算', icon: '💰' },
        quality: { name: '质量', icon: '✨' },
        collection: { name: '收集', icon: '🎨' },
        exploration: { name: '探索', icon: '🧭' },
        interaction: { name: '互动', icon: '👆' },
        daily: { name: '每日', icon: '📅' },
        level: { name: '等级', icon: '⭐' },
        hidden: { name: '隐藏', icon: '🔮' }
    };

    var EXP_REWARDS = {
        ACHIEVEMENT_COMMON: 50,
        ACHIEVEMENT_RARE: 100,
        ACHIEVEMENT_EPIC: 150,
        ACHIEVEMENT_LEGENDARY: 200
    };

    var STORAGE_KEY = 'achievements';

    var unlockedAchievements = {};
    var stats = {};
    var listeners = [];
    var toastQueue = [];
    var isShowingToast = false;

    function init() {
        loadAchievements();
        stats = loadStats();
        trackLateNightUsage();
    }

    function trackLateNightUsage() {
        var hour = new Date().getHours();
        if (hour >= 2 && hour < 6) {
            incrementStat('lateNightUsage', 1);
        }
    }

    function loadAchievements() {
        var saved = Storage.load(STORAGE_KEY);
        if (saved) {
            unlockedAchievements = saved;
        } else {
            unlockedAchievements = {};
        }
    }

    function saveAchievements() {
        Storage.save(STORAGE_KEY, unlockedAchievements);
    }

    function loadStats() {
        var defaultStats = {
            completedSteps: 0,
            totalSteps: 23,
            completedStages: 0,
            totalStages: 6,
            budgetDeviation: null,
            totalDelays: 0,
            checklistCompletion: 0,
            collectedObjects: 0,
            experiencedModes: 1,
            articlesRead: 0,
            toolsUsed: 0,
            maxStepsPerDay: 0,
            stepsToday: 0,
            lastActiveDate: null,
            perfectSteps: 0,
            reworkCount: 0,
            firstTimePassRate: 0,
            lateNightUsage: 0,
            fastDemoComplete: 0,
            consecutiveDays: 0,
            nianClickCount: 0,
            settingsExplored: 0,
            newbieCompleted: 0,
            nianChatCount: 0,
            exploredRegions: 0,
            hoveredRegions: 0,
            collectedFurniture: 0,
            totalFurniture: 0,
            dailyTasksCompleted: 0,
            consecutiveDailyTaskDays: 0,
            allDailyTasksCompletedDays: 0,
            level: 1,
            exploredRegionsSet: {},
            hoveredRegionsSet: {}
        };

        var saved = Storage.load(STORAGE_KEY + '_stats');
        if (saved) {
            return Object.assign({}, defaultStats, saved);
        }
        return defaultStats;
    }

    function saveStats() {
        Storage.save(STORAGE_KEY + '_stats', stats);
    }

    function updateStat(key, value) {
        stats[key] = value;
        saveStats();
        checkAchievements();
    }

    function incrementStat(key, amount) {
        amount = amount || 1;
        stats[key] = (stats[key] || 0) + amount;
        saveStats();
        checkAchievements();
    }

    function getStat(key) {
        return stats[key] || 0;
    }

    function getAllStats() {
        return Object.assign({}, stats);
    }

    function checkAchievements() {
        var newlyUnlocked = [];

        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
            var achievement = ACHIEVEMENTS[i];
            if (!unlockedAchievements[achievement.id]) {
                try {
                    if (achievement.checkCondition(stats)) {
                        unlockedAchievements[achievement.id] = {
                            unlockedAt: Date.now()
                        };
                        newlyUnlocked.push(achievement);
                    }
                } catch (e) {
                    console.warn('[AchievementSystem] Error checking achievement', achievement.id, e);
                }
            }
        }

        if (newlyUnlocked.length > 0) {
            saveAchievements();
            notifyListeners(newlyUnlocked);
            showAchievementToasts(newlyUnlocked);
            emitToEventBus(newlyUnlocked);
        }

        return newlyUnlocked;
    }

    function showAchievementToasts(achievements) {
        for (var i = 0; i < achievements.length; i++) {
            toastQueue.push(achievements[i]);
        }
        processToastQueue();
    }

    function processToastQueue() {
        if (isShowingToast || toastQueue.length === 0) return;
        
        isShowingToast = true;
        var achievement = toastQueue.shift();
        
        showAchievementToast(achievement, function() {
            isShowingToast = false;
            setTimeout(processToastQueue, 300);
        });
    }

    function showAchievementToast(achievement, callback) {
        var rarityConfig = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
        var expReward = EXP_REWARDS['ACHIEVEMENT_' + achievement.rarity.toUpperCase()] || EXP_REWARDS.ACHIEVEMENT_COMMON;
        
        var toast = document.createElement('div');
        toast.className = 'achievement-toast ' + achievement.rarity;
        toast.innerHTML = `
            <div class="achievement-toast-glow-bg"></div>
            <div class="achievement-toast-icon">
                <span class="achievement-toast-icon-text">${achievement.icon}</span>
                <div class="achievement-toast-icon-glow"></div>
                <div class="achievement-toast-sparkles"></div>
            </div>
            <div class="achievement-toast-info">
                <div class="achievement-toast-title">
                    <span class="achievement-toast-title-icon">🏆</span>
                    成就解锁！
                </div>
                <div class="achievement-toast-name">${achievement.name}</div>
                <div class="achievement-toast-rarity">
                    <span class="achievement-toast-stars">${generateStars(rarityConfig.stars)}</span>
                    <span class="achievement-toast-rarity-name">${rarityConfig.name}</span>
                </div>
                <div class="achievement-toast-exp">
                    <span class="exp-icon">✨</span>
                    <span>+${expReward} 经验</span>
                </div>
            </div>
            <div class="achievement-toast-close" title="点击查看详情">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        toast.addEventListener('click', function() {
            if (typeof AchievementModal !== 'undefined' && AchievementModal.show) {
                AchievementModal.show();
            }
        });
        
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                toast.classList.add('show');
            });
        });
        
        setTimeout(function() {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', function onEnd(e) {
                if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                    toast.removeEventListener('transitionend', onEnd);
                    if (toast.parentNode) {
                        toast.remove();
                    }
                    if (callback) callback();
                }
            });
        }, 3000);
    }

    function generateStars(count) {
        var stars = '';
        for (var i = 0; i < count; i++) {
            stars += '⭐';
        }
        return stars;
    }

    function isUnlocked(achievementId) {
        return !!unlockedAchievements[achievementId];
    }

    function getUnlockedCount() {
        return Object.keys(unlockedAchievements).length;
    }

    function getTotalCount() {
        return ACHIEVEMENTS.length;
    }

    function getVisibleAchievements() {
        return ACHIEVEMENTS.filter(function(a) {
            return !a.isHidden || unlockedAchievements[a.id];
        });
    }

    function getAllAchievements() {
        return ACHIEVEMENTS.map(function(a) {
            var isUnlockedFlag = !!unlockedAchievements[a.id];
            return Object.assign({}, a, {
                unlocked: isUnlockedFlag,
                unlockedAt: unlockedAchievements[a.id] ? unlockedAchievements[a.id].unlockedAt : null,
                rarityConfig: RARITY_CONFIG[a.rarity],
                categoryConfig: CATEGORY_CONFIG[a.category],
                visible: !a.isHidden || isUnlockedFlag
            });
        });
    }

    function getAchievementsByCategory(category) {
        var achievements = getAllAchievements();
        if (category === 'all') {
            return achievements.filter(function(a) { return a.visible; });
        }
        return achievements.filter(function(a) {
            return a.category === category && a.visible;
        });
    }

    function getCategoryStats() {
        var categories = getCategories();
        var result = {};
        
        for (var i = 0; i < categories.length; i++) {
            var catId = categories[i].id;
            var catAchievements = ACHIEVEMENTS.filter(function(a) {
                return a.category === catId && (!a.isHidden || unlockedAchievements[a.id]);
            });
            var unlocked = catAchievements.filter(function(a) {
                return !!unlockedAchievements[a.id];
            }).length;
            
            result[catId] = {
                total: catAchievements.length,
                unlocked: unlocked,
                ratio: catAchievements.length > 0 ? Math.round((unlocked / catAchievements.length) * 100) : 0
            };
        }
        
        return result;
    }

    function getRarityStats() {
        var rarities = Object.keys(RARITY_CONFIG);
        var result = {};
        
        for (var i = 0; i < rarities.length; i++) {
            var rarity = rarities[i];
            var rarityAchievements = ACHIEVEMENTS.filter(function(a) {
                return a.rarity === rarity && (!a.isHidden || unlockedAchievements[a.id]);
            });
            var unlocked = rarityAchievements.filter(function(a) {
                return !!unlockedAchievements[a.id];
            }).length;
            
            result[rarity] = {
                total: rarityAchievements.length,
                unlocked: unlocked,
                config: RARITY_CONFIG[rarity]
            };
        }
        
        return result;
    }

    function getRarityConfig(rarity) {
        return RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
    }

    function getCategoryConfig(category) {
        return CATEGORY_CONFIG[category] || { name: category, icon: '📋' };
    }

    function getCategories() {
        return Object.keys(CATEGORY_CONFIG).map(function(key) {
            return { id: key, name: CATEGORY_CONFIG[key].name, icon: CATEGORY_CONFIG[key].icon };
        });
    }

    function getRarities() {
        return Object.keys(RARITY_CONFIG).map(function(key) {
            return { id: key, name: RARITY_CONFIG[key].name, config: RARITY_CONFIG[key] };
        });
    }

    function getOverallProgress() {
        var visibleAchievements = ACHIEVEMENTS.filter(function(a) {
            return !a.isHidden || unlockedAchievements[a.id];
        });
        var unlocked = visibleAchievements.filter(function(a) {
            return !!unlockedAchievements[a.id];
        }).length;
        
        return {
            total: visibleAchievements.length,
            unlocked: unlocked,
            ratio: visibleAchievements.length > 0 ? Math.round((unlocked / visibleAchievements.length) * 100) : 0
        };
    }

    function addUnlockListener(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
        }
    }

    function removeUnlockListener(callback) {
        var index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    function notifyListeners(newAchievements) {
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](newAchievements);
            } catch (e) {
                console.warn('[AchievementSystem] Listener error:', e);
            }
        }
    }

    function emitToEventBus(newAchievements) {
        if (typeof EventBus === 'undefined' || !EventBus.EVENTS || !EventBus.EVENTS.ACHIEVEMENT_UNLOCKED) {
            return;
        }
        for (var i = 0; i < newAchievements.length; i++) {
            try {
                EventBus.emit(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, {
                    id: newAchievements[i].id,
                    name: newAchievements[i].name,
                    rarity: newAchievements[i].rarity,
                    category: newAchievements[i].category,
                    icon: newAchievements[i].icon,
                    description: newAchievements[i].description
                });
            } catch (e) {
                console.warn('[AchievementSystem] EventBus emit error:', e);
            }
        }
    }

    function trackRegionClick(regionId) {
        if (!regionId) return;
        if (!stats.exploredRegionsSet) {
            stats.exploredRegionsSet = {};
        }
        if (!stats.exploredRegionsSet[regionId]) {
            stats.exploredRegionsSet[regionId] = true;
            stats.exploredRegions = Object.keys(stats.exploredRegionsSet).length;
            saveStats();
            checkAchievements();
        }
    }

    function trackRegionHover(regionId) {
        if (!regionId) return;
        if (!stats.hoveredRegionsSet) {
            stats.hoveredRegionsSet = {};
        }
        if (!stats.hoveredRegionsSet[regionId]) {
            stats.hoveredRegionsSet[regionId] = true;
            stats.hoveredRegions = Object.keys(stats.hoveredRegionsSet).length;
            saveStats();
            checkAchievements();
        }
    }

    function trackNianChat() {
        incrementStat('nianChatCount', 1);
    }

    function trackCharacterClick() {
        incrementStat('nianClickCount', 1);
    }

    function trackDialogue() {
        trackNianChat();
    }

    function updateLevel(level) {
        updateStat('level', level);
    }

    function updateFurnitureCount(collected, total) {
        if (collected !== undefined && collected !== null) {
            stats.collectedFurniture = collected;
        }
        if (total !== undefined && total !== null) {
            stats.totalFurniture = total;
        }
        saveStats();
        checkAchievements();
    }

    function trackDailyTaskCompleted() {
        incrementStat('dailyTasksCompleted', 1);
    }

    function getExpReward(rarity) {
        return EXP_REWARDS['ACHIEVEMENT_' + (rarity || 'common').toUpperCase()] || EXP_REWARDS.ACHIEVEMENT_COMMON;
    }

    function reset() {
        unlockedAchievements = {};
        stats = {
            completedSteps: 0,
            totalSteps: 23,
            completedStages: 0,
            totalStages: 6,
            budgetDeviation: null,
            totalDelays: 0,
            checklistCompletion: 0,
            collectedObjects: 0,
            experiencedModes: 1,
            articlesRead: 0,
            toolsUsed: 0,
            maxStepsPerDay: 0,
            stepsToday: 0,
            lastActiveDate: null,
            perfectSteps: 0,
            reworkCount: 0,
            firstTimePassRate: 0,
            lateNightUsage: 0,
            fastDemoComplete: 0,
            consecutiveDays: 0,
            nianClickCount: 0,
            settingsExplored: 0,
            newbieCompleted: 0,
            nianChatCount: 0,
            exploredRegions: 0,
            hoveredRegions: 0,
            collectedFurniture: 0,
            totalFurniture: 0,
            dailyTasksCompleted: 0,
            consecutiveDailyTaskDays: 0,
            allDailyTasksCompletedDays: 0,
            level: 1,
            exploredRegionsSet: {},
            hoveredRegionsSet: {}
        };
        saveAchievements();
        saveStats();
    }

    return {
        init: init,
        updateStat: updateStat,
        incrementStat: incrementStat,
        getStat: getStat,
        getAllStats: getAllStats,
        checkAchievements: checkAchievements,
        isUnlocked: isUnlocked,
        getUnlockedCount: getUnlockedCount,
        getTotalCount: getTotalCount,
        getAllAchievements: getAllAchievements,
        getAchievementsByCategory: getAchievementsByCategory,
        getRarityConfig: getRarityConfig,
        getCategoryConfig: getCategoryConfig,
        getCategories: getCategories,
        getRarities: getRarities,
        getCategoryStats: getCategoryStats,
        getRarityStats: getRarityStats,
        getOverallProgress: getOverallProgress,
        addUnlockListener: addUnlockListener,
        removeUnlockListener: removeUnlockListener,
        trackRegionClick: trackRegionClick,
        trackRegionHover: trackRegionHover,
        trackNianChat: trackNianChat,
        trackCharacterClick: trackCharacterClick,
        trackDialogue: trackDialogue,
        updateLevel: updateLevel,
        updateFurnitureCount: updateFurnitureCount,
        trackDailyTaskCompleted: trackDailyTaskCompleted,
        getExpReward: getExpReward,
        EXP_REWARDS: EXP_REWARDS,
        reset: reset
    };
})();
