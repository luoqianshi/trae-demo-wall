var NewbieTasks = (function() {
    'use strict';

    var STORAGE_KEY = 'newbie_tasks';
    var PROGRESS_KEY = 'newbie_tasks_progress';

    var TASKS = [
        {
            id: 'first_launch',
            name: '初次见面',
            description: '完成首次启动引导，认识小管家',
            icon: '👋',
            reward: 10,
            category: 'intro',
            checkCondition: function(progress) {
                return progress.onboardingCompleted === true;
            }
        },
        {
            id: 'budget_setup',
            name: '预算管家',
            description: '设置你的装修预算，开启理财规划',
            icon: '💰',
            reward: 20,
            category: 'budget',
            checkCondition: function(progress) {
                return progress.budgetSet === true;
            }
        },
        {
            id: 'sop_explore',
            name: '流程探索',
            description: '浏览 SOP 装修流程，了解装修全步骤',
            icon: '📋',
            reward: 15,
            category: 'sop',
            checkCondition: function(progress) {
                return progress.sopViewed === true;
            }
        },
        {
            id: 'knowledge_reader',
            name: '避坑达人',
            description: '阅读 3 篇避坑文章，避开装修陷阱',
            icon: '📚',
            reward: 15,
            category: 'knowledge',
            targetCount: 3,
            checkCondition: function(progress) {
                return (progress.articlesRead || 0) >= 3;
            }
        },
        {
            id: 'tool_user',
            name: '工具达人',
            description: '使用 1 个装修工具，提升装修效率',
            icon: '🛠️',
            reward: 10,
            category: 'tools',
            checkCondition: function(progress) {
                return progress.toolsUsed >= 1;
            }
        },
        {
            id: 'first_step',
            name: '第一步',
            description: '完成第一个 SOP 步骤，开启装修之旅',
            icon: '🎯',
            reward: 30,
            category: 'progress',
            checkCondition: function(progress) {
                return progress.completedSteps >= 1;
            }
        },
        {
            id: 'achievement_unlock',
            name: '成就解锁',
            description: '解锁第一个成就，开启收集之旅',
            icon: '🏆',
            reward: 10,
            category: 'achievement',
            checkCondition: function(progress) {
                return progress.achievementsUnlocked >= 1;
            }
        }
    ];

    var progress = {};
    var completedTasks = {};
    var listeners = [];

    function getDefaultProgress() {
        return {
            onboardingCompleted: false,
            budgetSet: false,
            sopViewed: false,
            articlesRead: 0,
            toolsUsed: 0,
            completedSteps: 0,
            achievementsUnlocked: 0,
            totalExp: 0,
            startedAt: null,
            completedAt: null
        };
    }

    function loadProgress() {
        try {
            var saved = Storage.load(PROGRESS_KEY);
            if (saved && typeof saved === 'object') {
                progress = Object.assign({}, getDefaultProgress(), saved);
            } else {
                progress = getDefaultProgress();
                progress.startedAt = Date.now();
            }
        } catch (e) {
            progress = getDefaultProgress();
            progress.startedAt = Date.now();
        }

        try {
            var savedTasks = Storage.load(STORAGE_KEY);
            if (savedTasks && typeof savedTasks === 'object') {
                completedTasks = savedTasks;
            } else {
                completedTasks = {};
            }
        } catch (e) {
            completedTasks = {};
        }
    }

    function saveProgress() {
        Storage.save(PROGRESS_KEY, progress);
        Storage.save(STORAGE_KEY, completedTasks);
    }

    function init() {
        loadProgress();
        bindEvents();
    }

    function bindEvents() {
        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.on(EventBus.EVENTS.VIEW_CHANGED, function(data) {
                if (data && data.view === 'sop') {
                    markSopViewed();
                }
            });

            EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function() {
                updateProgress('completedSteps', 1, true);
            });

            EventBus.on(EventBus.EVENTS.BUDGET_CREATED, function() {
                setProgress('budgetSet', true);
            });

            EventBus.on(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, function() {
                updateProgress('achievementsUnlocked', 1, true);
            });
        }
    }

    function setProgress(key, value) {
        if (progress[key] === value) return;
        progress[key] = value;
        saveProgress();
        checkTasks();
    }

    function updateProgress(key, amount, isIncrement) {
        if (isIncrement) {
            progress[key] = (progress[key] || 0) + amount;
        } else {
            progress[key] = amount;
        }
        saveProgress();
        checkTasks();
    }

    function checkTasks() {
        var newlyCompleted = [];

        for (var i = 0; i < TASKS.length; i++) {
            var task = TASKS[i];
            if (!completedTasks[task.id]) {
                try {
                    if (task.checkCondition(progress)) {
                        completedTasks[task.id] = {
                            completedAt: Date.now(),
                            rewardClaimed: false
                        };
                        newlyCompleted.push(task);
                        progress.totalExp += task.reward;
                    }
                } catch (e) {
                    console.warn('[NewbieTasks] Error checking task', task.id, e);
                }
            }
        }

        if (newlyCompleted.length > 0) {
            saveProgress();
            notifyListeners(newlyCompleted);
            showTaskToasts(newlyCompleted);
            checkAllComplete();
        }

        return newlyCompleted;
    }

    function checkAllComplete() {
        var allComplete = true;
        for (var i = 0; i < TASKS.length; i++) {
            if (!completedTasks[TASKS[i].id]) {
                allComplete = false;
                break;
            }
        }

        if (allComplete && !progress.completedAt) {
            progress.completedAt = Date.now();
            saveProgress();

            if (typeof AchievementSystem !== 'undefined' && !AchievementSystem.isUnlocked('newbie_master')) {
                AchievementSystem.incrementStat('newbieCompleted', 1);
            }
        }
    }

    function showTaskToasts(tasks) {
        if (typeof Toast === 'undefined') return;

        tasks.forEach(function(task, index) {
            setTimeout(function() {
                Toast.success('🎉 完成新手任务：' + task.name + ' +' + task.reward + '经验');
            }, index * 800);
        });
    }

    function markOnboardingCompleted() {
        setProgress('onboardingCompleted', true);
    }

    function markBudgetSet() {
        setProgress('budgetSet', true);
    }

    function markSopViewed() {
        setProgress('sopViewed', true);
    }

    function incrementArticlesRead() {
        updateProgress('articlesRead', 1, true);
    }

    function incrementToolsUsed() {
        updateProgress('toolsUsed', 1, true);
    }

    function isTaskCompleted(taskId) {
        return !!completedTasks[taskId];
    }

    function getTaskProgress(taskId) {
        var task = getTaskById(taskId);
        if (!task) return 0;

        switch (taskId) {
            case 'knowledge_reader':
                return Math.min(100, Math.round(((progress.articlesRead || 0) / (task.targetCount || 3)) * 100));
            default:
                return isTaskCompleted(taskId) ? 100 : 0;
        }
    }

    function getTaskById(taskId) {
        for (var i = 0; i < TASKS.length; i++) {
            if (TASKS[i].id === taskId) {
                return TASKS[i];
            }
        }
        return null;
    }

    function getAllTasks() {
        return TASKS.map(function(task) {
            return Object.assign({}, task, {
                completed: !!completedTasks[task.id],
                completedAt: completedTasks[task.id] ? completedTasks[task.id].completedAt : null,
                progress: getTaskProgress(task.id),
                rewardClaimed: completedTasks[task.id] ? completedTasks[task.id].rewardClaimed : false
            });
        });
    }

    function getProgress() {
        return Object.assign({}, progress);
    }

    function getOverallProgress() {
        var total = TASKS.length;
        var completed = Object.keys(completedTasks).length;
        return {
            total: total,
            completed: completed,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            totalExp: progress.totalExp || 0
        };
    }

    function isAllComplete() {
        return Object.keys(completedTasks).length >= TASKS.length;
    }

    function getNextTask() {
        for (var i = 0; i < TASKS.length; i++) {
            if (!completedTasks[TASKS[i].id]) {
                return TASKS[i];
            }
        }
        return null;
    }

    function addCompleteListener(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
        }
    }

    function removeCompleteListener(callback) {
        var index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    function notifyListeners(newTasks) {
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](newTasks);
            } catch (e) {
                console.warn('[NewbieTasks] Listener error:', e);
            }
        }
    }

    function reset() {
        progress = getDefaultProgress();
        progress.startedAt = Date.now();
        completedTasks = {};
        saveProgress();
    }

    return {
        init: init,
        getAllTasks: getAllTasks,
        getTaskById: getTaskById,
        getProgress: getProgress,
        getOverallProgress: getOverallProgress,
        isTaskCompleted: isTaskCompleted,
        getTaskProgress: getTaskProgress,
        isAllComplete: isAllComplete,
        getNextTask: getNextTask,
        markOnboardingCompleted: markOnboardingCompleted,
        markBudgetSet: markBudgetSet,
        markSopViewed: markSopViewed,
        incrementArticlesRead: incrementArticlesRead,
        incrementToolsUsed: incrementToolsUsed,
        addCompleteListener: addCompleteListener,
        removeCompleteListener: removeCompleteListener,
        reset: reset
    };
})();
