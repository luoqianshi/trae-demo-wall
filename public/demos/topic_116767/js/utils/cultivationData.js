var CultivationData = (function() {
    'use strict';

    var STORAGE_KEY = 'cultivation_data';
    var DATA_VERSION = '2.1.0';

    var LEVEL_CONFIG = [
        { level: 1, exp: 0, title: '见习管家', rewards: [], unlocks: ['基础装修流程'] },
        { level: 2, exp: 100, title: '初级管家', rewards: [{ type: 'decoration', name: '红绸带', icon: '🎀' }], unlocks: ['每日任务系统'] },
        { level: 3, exp: 250, title: '中级管家', rewards: [{ type: 'decoration', name: '小管家徽章', icon: '🎖️' }], unlocks: ['成就系统'] },
        { level: 4, exp: 450, title: '高级管家', rewards: [{ type: 'decoration', name: '玉如意', icon: '💎' }], unlocks: ['收藏图鉴'] },
        { level: 5, exp: 700, title: '资深管家', rewards: [{ type: 'decoration', name: '金色光环', icon: '✨' }], unlocks: ['预算管理高级功能'] },
        { level: 6, exp: 1000, title: '装修顾问', rewards: [{ type: 'title', name: '装修顾问称号', icon: '👑' }], unlocks: ['知识库深度内容'] },
        { level: 7, exp: 1400, title: '装修设计师', rewards: [{ type: 'decoration', name: '设计师工具箱', icon: '🧰' }], unlocks: ['装修方案对比'] },
        { level: 8, exp: 1900, title: '装修达人', rewards: [{ type: 'decoration', name: '达人披风', icon: '🦸' }], unlocks: ['高级装修工具'] },
        { level: 9, exp: 2500, title: '装修大师', rewards: [{ type: 'title', name: '装修大师称号', icon: '🏆' }], unlocks: ['大师级装修建议'] },
        { level: 10, exp: 3200, title: '传奇建造师', rewards: [{ type: 'title', name: '传奇建造师称号', icon: '🌟' }], unlocks: ['全部功能解锁', '传奇专属装饰'] }
    ];

    var EXP_REWARDS = {
        STEP_COMPLETED: 20,
        STAGE_COMPLETED: 100,
        ACHIEVEMENT_COMMON: 50,
        ACHIEVEMENT_RARE: 100,
        ACHIEVEMENT_EPIC: 150,
        ACHIEVEMENT_LEGENDARY: 200,
        DAILY_TASK_EASY: 10,
        DAILY_TASK_MEDIUM: 30,
        DAILY_TASK_HARD: 50,
        DAILY_CHECKIN: 30
    };

    var DAILY_TASKS_TEMPLATE = [
        { id: 'daily_step', name: '完成一个装修步骤', type: 'step', target: 1, reward: 20, difficulty: 'easy' },
        { id: 'daily_browse', name: '浏览3篇知识库文章', type: 'browse', target: 3, reward: 15, difficulty: 'easy' },
        { id: 'daily_tool', name: '使用1个装修工具', type: 'tool', target: 1, reward: 10, difficulty: 'easy' },
        { id: 'daily_achievement', name: '解锁1个成就', type: 'achievement', target: 1, reward: 30, difficulty: 'medium' },
        { id: 'daily_collect', name: '收集2件物品', type: 'collect', target: 2, reward: 25, difficulty: 'medium' }
    ];

    var data = null;

    function getDefaultData() {
        var today = getTodayStr();
        return {
            version: DATA_VERSION,
            user: {
                level: 1,
                exp: 0,
                totalExp: 0,
                title: '见习管家'
            },
            achievements: {
                unlocked: {},
                progress: {}
            },
            dailyTasks: {
                date: today,
                tasks: generateDailyTasks(),
                activity: 0,
                claimedRewards: []
            },
            dailyCheckIn: {
                lastCheckInDate: null,
                totalCheckIns: 0,
                consecutiveCheckIns: 0
            },
            collection: {
                furniture: {},
                scenes: {}
            },
            assets: {
                unlocked: {},
                equipped: {}
            },
            characterState: {
                currentState: 'idle',
                stateHistory: []
            },
            stats: {
                totalStepsCompleted: 0,
                totalStagesCompleted: 0,
                consecutiveDays: 0,
                lastActiveDate: null,
                articlesRead: 0,
                toolsUsed: 0,
                collectedItems: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    function getTodayStr() {
        var now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }

    function generateDailyTasks() {
        var tasks = {};
        for (var i = 0; i < DAILY_TASKS_TEMPLATE.length; i++) {
            var t = DAILY_TASKS_TEMPLATE[i];
            tasks[t.id] = {
                id: t.id,
                name: t.name,
                type: t.type,
                target: t.target,
                progress: 0,
                reward: t.reward,
                difficulty: t.difficulty,
                completed: false,
                claimed: false
            };
        }
        return tasks;
    }

    function init() {
        loadData();
        bindEvents();
    }

    function bindEvents() {
        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function() {
                addExp(EXP_REWARDS.STEP_COMPLETED, 'step_completed');
                updateDailyTaskProgress('step', 1);
                incrementStat('totalStepsCompleted', 1);
            });

            EventBus.on(EventBus.EVENTS.SOP_STAGE_COMPLETE, function() {
                addExp(EXP_REWARDS.STAGE_COMPLETED, 'stage_completed');
                incrementStat('totalStagesCompleted', 1);
            });

            EventBus.on(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, function(achievementData) {
                var achievementId = achievementData && achievementData.id ? achievementData.id : null;
                if (achievementId && !data.achievements.unlocked[achievementId]) {
                    data.achievements.unlocked[achievementId] = {
                        unlockedAt: Date.now(),
                        data: achievementData || {}
                    };
                    saveData();
                }
                var rarity = achievementData && achievementData.rarity ? achievementData.rarity : 'common';
                var expAmount = EXP_REWARDS['ACHIEVEMENT_' + rarity.toUpperCase()] || EXP_REWARDS.ACHIEVEMENT_COMMON;
                addExp(expAmount, 'achievement_unlocked');
                updateDailyTaskProgress('achievement', 1);
            });
        }
    }

    function getData() {
        if (!data) {
            loadData();
        }
        return deepClone(data);
    }

    function setData(newData) {
        data = deepClone(newData);
        data.updatedAt = Date.now();
        saveData();
    }

    function saveData() {
        if (data) {
            data.updatedAt = Date.now();
            Storage.safeSaveWithBackup(STORAGE_KEY, data);
        }
    }

    function loadData() {
        try {
            var saved = Storage.load(STORAGE_KEY);
            if (saved && typeof saved === 'object') {
                if (saved.version !== DATA_VERSION) {
                    saved = migrateData(saved);
                }
                data = saved;
                checkDailyReset();
            } else {
                data = getDefaultData();
                saveData();
            }
        } catch (e) {
            console.error('[CultivationData] Load error:', e);
            var backup = Storage.loadBackup(STORAGE_KEY);
            if (backup && typeof backup === 'object') {
                console.warn('[CultivationData] Recovered from backup');
                data = backup;
                checkDailyReset();
            } else {
                data = getDefaultData();
                saveData();
            }
        }
        return data;
    }

    function migrateData(oldData) {
        console.info('[CultivationData] Migrating data from version', oldData.version, 'to', DATA_VERSION);
        
        var backupKey = STORAGE_KEY + '_migrate_' + (oldData.version || '1.0.0');
        Storage.save(backupKey, oldData);

        var migrated = deepClone(getDefaultData());

        if (oldData.user) {
            migrated.user = Object.assign({}, migrated.user, oldData.user);
        }

        if (oldData.achievements) {
            migrated.achievements = Object.assign({}, migrated.achievements, oldData.achievements);
        }

        if (oldData.dailyTasks) {
            migrated.dailyTasks = Object.assign({}, migrated.dailyTasks, oldData.dailyTasks);
        }

        if (oldData.dailyCheckIn) {
            migrated.dailyCheckIn = Object.assign({}, migrated.dailyCheckIn, oldData.dailyCheckIn);
        }

        if (oldData.collection) {
            migrated.collection = Object.assign({}, migrated.collection, oldData.collection);
        }

        if (oldData.assets) {
            migrated.assets = Object.assign({}, migrated.assets, oldData.assets);
        }

        if (oldData.characterState) {
            migrated.characterState = Object.assign({}, migrated.characterState, oldData.characterState);
        }

        if (oldData.stats) {
            migrated.stats = Object.assign({}, migrated.stats, oldData.stats);
        }

        migrateFromLegacyStorage(migrated);
        migrateStepsToExp(migrated);

        if (migrated.user.totalExp > 0) {
            var levelInfo = calculateLevel(migrated.user.totalExp);
            migrated.user.level = levelInfo.level;
            migrated.user.exp = levelInfo.currentExp;
            migrated.user.title = levelInfo.title;
        }

        migrated.version = DATA_VERSION;
        migrated.updatedAt = Date.now();

        console.info('[CultivationData] Data migration complete');
        return migrated;
    }

    function migrateStepsToExp(migrated) {
        try {
            var stepsCount = migrated.stats.totalStepsCompleted || 0;
            if (stepsCount > 0 && migrated.user.totalExp === 0) {
                var baseExp = stepsCount * EXP_REWARDS.STEP_COMPLETED;
                migrated.user.totalExp = baseExp;
                console.info('[CultivationData] Converted', stepsCount, 'steps to', baseExp, 'exp');
            }
        } catch (e) {
            console.warn('[CultivationData] Steps to exp migration error:', e);
        }
    }

    function migrateFromLegacyStorage(migrated) {
        try {
            var legacyAchievements = Storage.load('achievements');
            if (legacyAchievements && typeof legacyAchievements === 'object') {
                for (var id in legacyAchievements) {
                    if (legacyAchievements.hasOwnProperty(id)) {
                        if (!migrated.achievements.unlocked[id]) {
                            migrated.achievements.unlocked[id] = legacyAchievements[id];
                        }
                    }
                }
            }

            var legacyAchStats = Storage.load('achievements_stats');
            if (legacyAchStats && typeof legacyAchStats === 'object') {
                if (!migrated.stats.totalStepsCompleted && legacyAchStats.completedSteps) {
                    migrated.stats.totalStepsCompleted = legacyAchStats.completedSteps;
                }
                if (!migrated.stats.totalStagesCompleted && legacyAchStats.completedStages) {
                    migrated.stats.totalStagesCompleted = legacyAchStats.completedStages;
                }
                if (!migrated.stats.articlesRead && legacyAchStats.articlesRead) {
                    migrated.stats.articlesRead = legacyAchStats.articlesRead;
                }
                if (!migrated.stats.toolsUsed && legacyAchStats.toolsUsed) {
                    migrated.stats.toolsUsed = legacyAchStats.toolsUsed;
                }
                if (!migrated.stats.collectedItems && legacyAchStats.collectedObjects) {
                    migrated.stats.collectedItems = legacyAchStats.collectedObjects;
                }
                if (!migrated.stats.consecutiveDays && legacyAchStats.consecutiveDays) {
                    migrated.stats.consecutiveDays = legacyAchStats.consecutiveDays;
                }
            }

            var legacyNewbieProgress = Storage.load('newbie_tasks_progress');
            if (legacyNewbieProgress && typeof legacyNewbieProgress === 'object') {
                if (legacyNewbieProgress.totalExp && !migrated.user.totalExp) {
                    migrated.user.totalExp = legacyNewbieProgress.totalExp;
                }
            }
        } catch (e) {
            console.warn('[CultivationData] Legacy migration error:', e);
        }
    }

    function checkDailyReset() {
        if (!data || !data.dailyTasks) return;

        var today = getTodayStr();
        if (data.dailyTasks.date !== today) {
            data.dailyTasks = {
                date: today,
                tasks: generateDailyTasks(),
                activity: 0,
                claimedRewards: []
            };
            updateConsecutiveDays();
            saveData();
        }
    }

    function checkDailyCheckIn() {
        if (!data || !data.dailyCheckIn) return false;

        var today = getTodayStr();
        var lastCheckIn = data.dailyCheckIn.lastCheckInDate;

        if (lastCheckIn === today) {
            return false;
        }

        return performDailyCheckIn(today, lastCheckIn);
    }

    function performDailyCheckIn(today, lastCheckIn) {
        if (!data.dailyCheckIn) {
            data.dailyCheckIn = {
                lastCheckInDate: null,
                totalCheckIns: 0,
                consecutiveCheckIns: 0
            };
        }

        var consecutive = 1;
        if (lastCheckIn) {
            var lastDate = new Date(lastCheckIn);
            var todayDate = new Date(today);
            var diffTime = todayDate.getTime() - lastDate.getTime();
            var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                consecutive = (data.dailyCheckIn.consecutiveCheckIns || 0) + 1;
            } else if (diffDays > 1) {
                consecutive = 1;
            }
        }

        data.dailyCheckIn.lastCheckInDate = today;
        data.dailyCheckIn.totalCheckIns = (data.dailyCheckIn.totalCheckIns || 0) + 1;
        data.dailyCheckIn.consecutiveCheckIns = consecutive;

        var bonusExp = EXP_REWARDS.DAILY_CHECKIN;
        if (consecutive >= 7) {
            bonusExp = Math.floor(bonusExp * 1.5);
        } else if (consecutive >= 3) {
            bonusExp = Math.floor(bonusExp * 1.2);
        }

        addExp(bonusExp, 'daily_checkin');
        saveData();

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.emit('cultivation:dailyCheckIn', {
                expGained: bonusExp,
                consecutive: consecutive,
                total: data.dailyCheckIn.totalCheckIns
            });
        }

        return { expGained: bonusExp, consecutive: consecutive };
    }

    function getDailyCheckInInfo() {
        if (!data) loadData();
        if (!data.dailyCheckIn) {
            return { lastCheckInDate: null, totalCheckIns: 0, consecutiveCheckIns: 0, checkedInToday: false };
        }
        var today = getTodayStr();
        return {
            lastCheckInDate: data.dailyCheckIn.lastCheckInDate,
            totalCheckIns: data.dailyCheckIn.totalCheckIns || 0,
            consecutiveCheckIns: data.dailyCheckIn.consecutiveCheckIns || 0,
            checkedInToday: data.dailyCheckIn.lastCheckInDate === today
        };
    }

    function getLevelRewards(level) {
        var config = LEVEL_CONFIG[level - 1];
        if (!config) return { rewards: [], unlocks: [] };
        return {
            rewards: deepClone(config.rewards || []),
            unlocks: deepClone(config.unlocks || [])
        };
    }

    function getUnlocksForLevelRange(fromLevel, toLevel) {
        var allUnlocks = [];
        var allRewards = [];
        for (var i = fromLevel + 1; i <= toLevel; i++) {
            var levelInfo = getLevelRewards(i);
            allUnlocks = allUnlocks.concat(levelInfo.unlocks);
            allRewards = allRewards.concat(levelInfo.rewards);
        }
        return { unlocks: allUnlocks, rewards: allRewards };
    }

    function updateConsecutiveDays() {
        if (!data || !data.stats) return;

        var today = getTodayStr();
        var lastActive = data.stats.lastActiveDate;

        if (lastActive) {
            var lastDate = new Date(lastActive);
            var todayDate = new Date(today);
            var diffTime = todayDate.getTime() - lastDate.getTime();
            var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                data.stats.consecutiveDays = (data.stats.consecutiveDays || 0) + 1;
            } else if (diffDays > 1) {
                data.stats.consecutiveDays = 1;
            }
        } else {
            data.stats.consecutiveDays = 1;
        }

        data.stats.lastActiveDate = today;
    }

    function getLevel() {
        if (!data) loadData();
        return data.user.level;
    }

    function getExp() {
        if (!data) loadData();
        return data.user.exp;
    }

    function getTotalExp() {
        if (!data) loadData();
        return data.user.totalExp;
    }

    function getTitle() {
        if (!data) loadData();
        return data.user.title;
    }

    function getLevelConfig() {
        return LEVEL_CONFIG.map(function(l) { return Object.assign({}, l); });
    }

    function getExpForLevel(level) {
        var config = LEVEL_CONFIG[level - 1];
        return config ? config.exp : 0;
    }

    function getExpForNextLevel() {
        if (!data) loadData();
        var currentLevel = data.user.level;
        if (currentLevel >= LEVEL_CONFIG.length) {
            return null;
        }
        var nextConfig = LEVEL_CONFIG[currentLevel];
        return nextConfig ? nextConfig.exp - data.user.exp : null;
    }

    function getLevelProgress() {
        if (!data) loadData();
        var currentLevel = data.user.level;
        if (currentLevel >= LEVEL_CONFIG.length) {
            return 100;
        }
        var currentExp = data.user.exp;
        var prevLevelExp = LEVEL_CONFIG[currentLevel - 1] ? LEVEL_CONFIG[currentLevel - 1].exp : 0;
        var nextLevelExp = LEVEL_CONFIG[currentLevel] ? LEVEL_CONFIG[currentLevel].exp : prevLevelExp + 100;
        var levelRange = nextLevelExp - prevLevelExp;
        var progressExp = currentExp - prevLevelExp;
        return Math.min(100, Math.round((progressExp / levelRange) * 100));
    }

    function calculateLevel(totalExp) {
        var level = 1;
        var title = LEVEL_CONFIG[0].title;
        var currentExp = totalExp;

        for (var i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
            if (totalExp >= LEVEL_CONFIG[i].exp) {
                level = LEVEL_CONFIG[i].level;
                title = LEVEL_CONFIG[i].title;
                break;
            }
        }

        var prevLevelExp = level > 1 ? LEVEL_CONFIG[level - 2].exp : 0;
        currentExp = totalExp - prevLevelExp;

        return {
            level: level,
            currentExp: currentExp,
            totalExp: totalExp,
            title: title
        };
    }

    function addExp(amount, source) {
        if (!data) loadData();
        if (!amount || amount <= 0) return false;

        var oldLevel = data.user.level;
        var oldExp = data.user.exp;
        var prevLevelExp = oldLevel > 1 ? LEVEL_CONFIG[oldLevel - 2].exp : 0;
        data.user.totalExp += amount;

        var levelInfo = calculateLevel(data.user.totalExp);
        data.user.level = levelInfo.level;
        data.user.exp = levelInfo.currentExp;
        data.user.title = levelInfo.title;

        saveData();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('cultivation:expGained', {
                amount: amount,
                source: source,
                oldLevel: oldLevel,
                newLevel: levelInfo.level,
                oldExp: oldExp,
                newExp: levelInfo.currentExp,
                totalExp: data.user.totalExp
            });

            if (levelInfo.level > oldLevel && EventBus.EVENTS) {
                var unlockInfo = getUnlocksForLevelRange(oldLevel, levelInfo.level);
                EventBus.emit(EventBus.EVENTS.LEVEL_UP, {
                    oldLevel: oldLevel,
                    newLevel: levelInfo.level,
                    title: levelInfo.title,
                    totalExp: data.user.totalExp,
                    rewards: unlockInfo.rewards,
                    unlocks: unlockInfo.unlocks
                });
            }
        }

        return true;
    }

    function getDailyTasks() {
        if (!data) loadData();
        checkDailyReset();
        return deepClone(data.dailyTasks.tasks);
    }

    function getDailyActivity() {
        if (!data) loadData();
        checkDailyReset();
        return data.dailyTasks.activity;
    }

    function updateDailyTaskProgress(type, amount) {
        if (!data) loadData();
        checkDailyReset();
        if (!amount || amount <= 0) return;

        var tasks = data.dailyTasks.tasks;
        var updated = false;

        for (var taskId in tasks) {
            if (tasks.hasOwnProperty(taskId)) {
                var task = tasks[taskId];
                if (task.type === type && !task.completed) {
                    task.progress = Math.min(task.target, task.progress + amount);
                    if (task.progress >= task.target) {
                        task.completed = true;
                    }
                    updated = true;
                }
            }
        }

        if (updated) {
            calculateActivity();
            saveData();
        }
    }

    function completeTask(taskId) {
        if (!data) loadData();
        checkDailyReset();

        var task = data.dailyTasks.tasks[taskId];
        if (!task || task.completed) return false;

        task.completed = true;
        task.progress = task.target;
        calculateActivity();
        saveData();

        return true;
    }

    function claimTaskReward(taskId) {
        if (!data) loadData();
        checkDailyReset();

        var task = data.dailyTasks.tasks[taskId];
        if (!task || !task.completed || task.claimed) return false;

        task.claimed = true;
        addExp(task.reward, 'daily_task_' + taskId);

        if (data.dailyTasks.claimedRewards.indexOf(taskId) === -1) {
            data.dailyTasks.claimedRewards.push(taskId);
        }

        saveData();
        return task.reward;
    }

    function calculateActivity() {
        if (!data || !data.dailyTasks) return;

        var totalActivity = 0;
        var tasks = data.dailyTasks.tasks;

        for (var taskId in tasks) {
            if (tasks.hasOwnProperty(taskId) && tasks[taskId].completed) {
                totalActivity += tasks[taskId].reward;
            }
        }

        data.dailyTasks.activity = totalActivity;
    }

    function unlockAchievement(achievementId, achievementData) {
        if (!data) loadData();

        if (data.achievements.unlocked[achievementId]) {
            return false;
        }

        data.achievements.unlocked[achievementId] = {
            unlockedAt: Date.now(),
            data: achievementData || {}
        };

        saveData();

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.emit(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, {
                id: achievementId,
                rarity: achievementData && achievementData.rarity ? achievementData.rarity : 'common'
            });
        }

        return true;
    }

    function getAchievements() {
        if (!data) loadData();
        return deepClone(data.achievements);
    }

    function isAchievementUnlocked(achievementId) {
        if (!data) loadData();
        return !!data.achievements.unlocked[achievementId];
    }

    function getUnlockedAchievementCount() {
        if (!data) loadData();
        return Object.keys(data.achievements.unlocked).length;
    }

    function unlockItem(category, itemId, itemData) {
        if (!data) loadData();
        if (!category || !itemId) return false;

        var collection = data.collection[category];
        if (!collection) {
            collection = {};
            data.collection[category] = collection;
        }

        if (collection[itemId]) {
            return false;
        }

        collection[itemId] = {
            unlockedAt: Date.now(),
            data: itemData || {}
        };

        incrementStat('collectedItems', 1);
        updateDailyTaskProgress('collect', 1);
        saveData();

        return true;
    }

    function getCollection(category) {
        if (!data) loadData();
        if (category) {
            return deepClone(data.collection[category] || {});
        }
        return deepClone(data.collection);
    }

    function isItemUnlocked(category, itemId) {
        if (!data) loadData();
        return !!(data.collection[category] && data.collection[category][itemId]);
    }

    function getCollectionCount(category) {
        if (!data) loadData();
        var collection = category ? data.collection[category] : null;
        if (!collection) return 0;
        return Object.keys(collection).length;
    }

    function unlockAsset(assetId, assetData) {
        if (!data) loadData();
        if (!assetId) return false;

        if (data.assets.unlocked[assetId]) {
            return false;
        }

        data.assets.unlocked[assetId] = {
            unlockedAt: Date.now(),
            data: assetData || {}
        };

        saveData();
        return true;
    }

    function equipAsset(slot, assetId) {
        if (!data) loadData();
        if (!slot || !assetId) return false;

        if (!data.assets.unlocked[assetId]) {
            return false;
        }

        data.assets.equipped[slot] = assetId;
        saveData();
        return true;
    }

    function getAssets() {
        if (!data) loadData();
        return deepClone(data.assets);
    }

    function getEquippedAsset(slot) {
        if (!data) loadData();
        return data.assets.equipped[slot] || null;
    }

    function isAssetUnlocked(assetId) {
        if (!data) loadData();
        return !!data.assets.unlocked[assetId];
    }

    function getCharacterState() {
        if (!data) loadData();
        return data.characterState.currentState;
    }

    function setCharacterState(state, reason) {
        if (!data) loadData();
        if (!state) return false;

        var oldState = data.characterState.currentState;
        if (oldState === state) return false;

        data.characterState.stateHistory.push({
            from: oldState,
            to: state,
            reason: reason || '',
            timestamp: Date.now()
        });

        if (data.characterState.stateHistory.length > 100) {
            data.characterState.stateHistory = data.characterState.stateHistory.slice(-100);
        }

        data.characterState.currentState = state;
        saveData();

        return true;
    }

    function getStateHistory(limit) {
        if (!data) loadData();
        var history = data.characterState.stateHistory;
        if (limit && limit > 0) {
            return deepClone(history.slice(-limit));
        }
        return deepClone(history);
    }

    function getStat(key) {
        if (!data) loadData();
        return data.stats[key] || 0;
    }

    function getAllStats() {
        if (!data) loadData();
        return deepClone(data.stats);
    }

    function setStat(key, value) {
        if (!data) loadData();
        data.stats[key] = value;
        saveData();
    }

    function incrementStat(key, amount) {
        if (!data) loadData();
        amount = amount || 1;
        data.stats[key] = (data.stats[key] || 0) + amount;
        saveData();
        return data.stats[key];
    }

    function getDataVersion() {
        return DATA_VERSION;
    }

    function getCurrentDataVersion() {
        if (!data) loadData();
        return data.version;
    }

    function reset() {
        data = getDefaultData();
        saveData();
    }

    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(deepClone);
        }
        var result = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = deepClone(obj[key]);
            }
        }
        return result;
    }

    return {
        init: init,
        getData: getData,
        setData: setData,
        saveData: saveData,
        loadData: loadData,
        getLevel: getLevel,
        getExp: getExp,
        getTotalExp: getTotalExp,
        getTitle: getTitle,
        getLevelConfig: getLevelConfig,
        getExpForLevel: getExpForLevel,
        getExpForNextLevel: getExpForNextLevel,
        getLevelProgress: getLevelProgress,
        addExp: addExp,
        getDailyTasks: getDailyTasks,
        getDailyActivity: getDailyActivity,
        updateDailyTaskProgress: updateDailyTaskProgress,
        completeTask: completeTask,
        claimTaskReward: claimTaskReward,
        unlockAchievement: unlockAchievement,
        getAchievements: getAchievements,
        isAchievementUnlocked: isAchievementUnlocked,
        getUnlockedAchievementCount: getUnlockedAchievementCount,
        unlockItem: unlockItem,
        getCollection: getCollection,
        isItemUnlocked: isItemUnlocked,
        getCollectionCount: getCollectionCount,
        unlockAsset: unlockAsset,
        equipAsset: equipAsset,
        getAssets: getAssets,
        getEquippedAsset: getEquippedAsset,
        isAssetUnlocked: isAssetUnlocked,
        getCharacterState: getCharacterState,
        setCharacterState: setCharacterState,
        getStateHistory: getStateHistory,
        getStat: getStat,
        getAllStats: getAllStats,
        setStat: setStat,
        incrementStat: incrementStat,
        getDataVersion: getDataVersion,
        getCurrentDataVersion: getCurrentDataVersion,
        reset: reset,
        checkDailyCheckIn: checkDailyCheckIn,
        getDailyCheckInInfo: getDailyCheckInInfo,
        getLevelRewards: getLevelRewards,
        getUnlocksForLevelRange: getUnlocksForLevelRange,
        EXP_REWARDS: EXP_REWARDS
    };
})();
