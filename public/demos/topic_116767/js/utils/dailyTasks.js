var DailyTasks = (function() {
    'use strict';

    var modalElement = null;
    var ACTIVITY_REWARDS = [
        { activity: 30, reward: 20, name: '铜宝箱', icon: '📦' },
        { activity: 60, reward: 40, name: '银宝箱', icon: '🎁' },
        { activity: 90, reward: 60, name: '金宝箱', icon: '🎀' },
        { activity: 100, reward: 100, name: '传说宝箱', icon: '👑' }
    ];

    var DIFFICULTY_CONFIG = {
        easy: { label: '简单', color: '#5B8C5A', bgColor: '#E8F5E9' },
        medium: { label: '中等', color: '#C9A227', bgColor: '#FFF8E1' },
        hard: { label: '困难', color: '#C84A3E', bgColor: '#FFEBEE' }
    };

    function getTasksData() {
        if (typeof CultivationData === 'undefined') return {};
        return CultivationData.getDailyTasks();
    }

    function getActivityData() {
        if (typeof CultivationData === 'undefined') return 0;
        return CultivationData.getDailyActivity();
    }

    function getClaimedRewards() {
        if (typeof CultivationData === 'undefined' || !CultivationData.getData) return [];
        var data = CultivationData.getData();
        return data && data.dailyTasks && data.dailyTasks.claimedRewards ? 
            data.dailyTasks.claimedRewards.filter(function(r) { return typeof r === 'string' && r.startsWith('chest_'); }) : [];
    }

    function buildModalHTML() {
        var tasks = getTasksData();
        var activity = getActivityData();
        var taskList = Object.values(tasks);
        var completedCount = taskList.filter(function(t) { return t.completed; }).length;
        var claimedChests = getClaimedRewards();

        var maxActivity = ACTIVITY_REWARDS[ACTIVITY_REWARDS.length - 1].activity;
        var activityPercent = Math.min(100, Math.round((activity / maxActivity) * 100));

        var chestsHtml = ACTIVITY_REWARDS.map(function(chest, index) {
            var position = (chest.activity / maxActivity) * 100;
            var claimed = claimedChests.indexOf('chest_' + index) !== -1;
            var canClaim = activity >= chest.activity && !claimed;
            return `
                <div class="daily-chest ${claimed ? 'claimed' : ''} ${canClaim ? 'can-claim' : ''}" 
                     data-chest-index="${index}"
                     style="left: ${position}%;">
                    <div class="daily-chest-icon">${chest.icon}</div>
                    <div class="daily-chest-label">${chest.activity}活跃</div>
                    ${claimed ? '<div class="daily-chest-claimed-badge">已领取</div>' : ''}
                    ${canClaim ? '<div class="daily-chest-glow"></div>' : ''}
                </div>
            `;
        }).join('');

        var tasksHtml = taskList.map(function(task) {
            var diffConfig = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.easy;
            var progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));
            var statusClass = task.claimed ? 'claimed' : (task.completed ? 'completed' : 'in-progress');
            
            return `
                <div class="daily-task-item ${statusClass}" data-task-id="${task.id}">
                    <div class="daily-task-icon" style="background: ${diffConfig.bgColor};">
                        ${getTaskIcon(task.type)}
                    </div>
                    <div class="daily-task-info">
                        <div class="daily-task-header">
                            <span class="daily-task-name">${task.name}</span>
                            <span class="daily-task-difficulty" style="color: ${diffConfig.color}; background: ${diffConfig.bgColor};">
                                ${diffConfig.label}
                            </span>
                        </div>
                        <div class="daily-task-progress">
                            <div class="daily-task-progress-bar">
                                <div class="daily-task-progress-fill" style="width: ${progressPercent}%;"></div>
                            </div>
                            <span class="daily-task-progress-text">${task.progress}/${task.target}</span>
                        </div>
                    </div>
                    <div class="daily-task-reward">
                        <span class="daily-task-reward-icon">✨</span>
                        <span class="daily-task-reward-value">${task.reward}</span>
                    </div>
                    <div class="daily-task-action">
                        ${task.claimed ? 
                            '<button class="daily-task-btn claimed" disabled>已领取</button>' :
                            (task.completed ? 
                                '<button class="daily-task-btn claim-btn">领取</button>' :
                                '<button class="daily-task-btn go-btn" disabled>去完成</button>')
                        }
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="daily-tasks-modal" id="daily-tasks-modal">
                <div class="daily-tasks-content">
                    <div class="daily-tasks-header">
                        <div class="daily-tasks-title">
                            <span class="daily-tasks-title-icon">📋</span>
                            每日任务
                        </div>
                        <button class="daily-tasks-close" id="daily-tasks-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div class="daily-activity-section">
                        <div class="daily-activity-header">
                            <span class="daily-activity-label">今日活跃度</span>
                            <span class="daily-activity-value">${activity} / ${maxActivity}</span>
                        </div>
                        <div class="daily-activity-bar-container">
                            <div class="daily-activity-bar">
                                <div class="daily-activity-fill" style="width: ${activityPercent}%;"></div>
                            </div>
                            <div class="daily-activity-chests">
                                ${chestsHtml}
                            </div>
                        </div>
                        <div class="daily-activity-tip">完成任务提升活跃度，领取丰厚奖励！</div>
                    </div>

                    <div class="daily-tasks-stats">
                        <div class="daily-task-stat">
                            <span class="daily-task-stat-icon">✅</span>
                            <span class="daily-task-stat-value">${completedCount}/${taskList.length}</span>
                            <span class="daily-task-stat-label">已完成任务</span>
                        </div>
                        <div class="daily-task-stat">
                            <span class="daily-task-stat-icon">🎯</span>
                            <span class="daily-task-stat-value">${activity}</span>
                            <span class="daily-task-stat-label">今日活跃</span>
                        </div>
                        <div class="daily-task-stat">
                            <span class="daily-task-stat-icon">📅</span>
                            <span class="daily-task-stat-value">${getConsecutiveDays()}</span>
                            <span class="daily-task-stat-label">连续打卡</span>
                        </div>
                    </div>

                    <div class="daily-tasks-list-title">任务列表</div>
                    <div class="daily-tasks-list" id="daily-tasks-list">
                        ${tasksHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function getTaskIcon(type) {
        var icons = {
            step: '🔨',
            browse: '📚',
            tool: '🛠️',
            achievement: '🏆',
            collect: '🎁',
            login: '📅'
        };
        return icons[type] || '📋';
    }

    function getConsecutiveDays() {
        if (typeof CultivationData === 'undefined' || !CultivationData.getStat) return 0;
        return CultivationData.getStat('consecutiveDays') || 0;
    }

    function refreshModal() {
        if (!modalElement) return;
        
        var listContainer = modalElement.querySelector('#daily-tasks-list');
        if (listContainer) {
            var tasks = getTasksData();
            var taskList = Object.values(tasks);
            listContainer.innerHTML = taskList.map(function(task) {
                var diffConfig = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.easy;
                var progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));
                var statusClass = task.claimed ? 'claimed' : (task.completed ? 'completed' : 'in-progress');
                
                return `
                    <div class="daily-task-item ${statusClass}" data-task-id="${task.id}">
                        <div class="daily-task-icon" style="background: ${diffConfig.bgColor};">
                            ${getTaskIcon(task.type)}
                        </div>
                        <div class="daily-task-info">
                            <div class="daily-task-header">
                                <span class="daily-task-name">${task.name}</span>
                                <span class="daily-task-difficulty" style="color: ${diffConfig.color}; background: ${diffConfig.bgColor};">
                                    ${diffConfig.label}
                                </span>
                            </div>
                            <div class="daily-task-progress">
                                <div class="daily-task-progress-bar">
                                    <div class="daily-task-progress-fill" style="width: ${progressPercent}%;"></div>
                                </div>
                                <span class="daily-task-progress-text">${task.progress}/${task.target}</span>
                            </div>
                        </div>
                        <div class="daily-task-reward">
                            <span class="daily-task-reward-icon">✨</span>
                            <span class="daily-task-reward-value">${task.reward}</span>
                        </div>
                        <div class="daily-task-action">
                            ${task.claimed ? 
                                '<button class="daily-task-btn claimed" disabled>已领取</button>' :
                                (task.completed ? 
                                    '<button class="daily-task-btn claim-btn">领取</button>' :
                                    '<button class="daily-task-btn go-btn" disabled>去完成</button>')
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
            bindTaskItemEvents(listContainer);
        }

        var activityValue = modalElement.querySelector('.daily-activity-value');
        var activityFill = modalElement.querySelector('.daily-activity-fill');
        if (activityValue && activityFill) {
            var activity = getActivityData();
            var maxActivity = ACTIVITY_REWARDS[ACTIVITY_REWARDS.length - 1].activity;
            activityValue.textContent = activity + ' / ' + maxActivity;
            activityFill.style.width = Math.min(100, Math.round((activity / maxActivity) * 100)) + '%';
        }
    }

    function bindTaskItemEvents(container) {
        if (!container) return;

        var claimBtns = container.querySelectorAll('.claim-btn');
        for (var i = 0; i < claimBtns.length; i++) {
            claimBtns[i].addEventListener('click', function(e) {
                var taskItem = this.closest('.daily-task-item');
                if (!taskItem) return;
                var taskId = taskItem.getAttribute('data-task-id');
                if (taskId) {
                    claimTaskReward(taskId);
                }
            });
        }

        var chests = container.parentElement.querySelectorAll('.daily-chest.can-claim');
        for (var j = 0; j < chests.length; j++) {
            chests[j].style.cursor = 'pointer';
            chests[j].addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-chest-index'));
                if (!isNaN(index)) {
                    claimChestReward(index);
                }
            });
        }
    }

    function claimTaskReward(taskId) {
        if (typeof CultivationData === 'undefined' || !CultivationData.claimTaskReward) return;
        
        var reward = CultivationData.claimTaskReward(taskId);
        if (reward) {
            showToast('🎉 领取成功！获得 ' + reward + ' 经验');
            refreshModal();
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('dailyTasks:rewardClaimed', { taskId: taskId, reward: reward });
            }
        }
    }

    function claimChestReward(index) {
        if (typeof CultivationData === 'undefined' || !CultivationData.getData) return;
        
        var chest = ACTIVITY_REWARDS[index];
        if (!chest) return;

        var data = CultivationData.getData();
        if (!data.dailyTasks) return;
        
        var chestKey = 'chest_' + index;
        if (!data.dailyTasks.claimedRewards) {
            data.dailyTasks.claimedRewards = [];
        }
        
        if (data.dailyTasks.claimedRewards.indexOf(chestKey) !== -1) return;
        
        var activity = getActivityData();
        if (activity < chest.activity) return;

        data.dailyTasks.claimedRewards.push(chestKey);
        CultivationData.setData(data);
        
        if (typeof CultivationData.addExp === 'function') {
            CultivationData.addExp(chest.reward, 'daily_chest_' + index);
        }

        showToast('🎁 开启' + chest.name + '！获得 ' + chest.reward + ' 经验');
        refreshModal();
    }

    function showToast(message) {
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(message);
        } else {
            console.log('[DailyTasks]', message);
        }
    }

    function ensureModal() {
        if (modalElement) return;

        modalElement = document.createElement('div');
        modalElement.innerHTML = buildModalHTML();
        document.body.appendChild(modalElement.firstElementChild);
        modalElement = document.getElementById('daily-tasks-modal');

        bindEvents();
    }

    function bindEvents() {
        if (!modalElement) return;

        var closeBtn = modalElement.querySelector('#daily-tasks-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }

        bindTaskItemEvents(modalElement.querySelector('#daily-tasks-list'));

        var chests = modalElement.querySelectorAll('.daily-chest.can-claim');
        for (var i = 0; i < chests.length; i++) {
            chests[i].style.cursor = 'pointer';
            chests[i].addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-chest-index'));
                if (!isNaN(index)) {
                    claimChestReward(index);
                }
            });
        }

        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                hide();
            }
        });
    }

    function show() {
        ensureModal();
        if (!modalElement) return;

        refreshModal();

        modalElement.style.display = 'flex';
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                modalElement.classList.add('active');
            });
        });
    }

    function hide() {
        if (!modalElement) return;

        modalElement.classList.remove('active');
        setTimeout(function() {
            if (modalElement) {
                modalElement.style.display = 'none';
            }
        }, 300);
    }

    function init() {
        var dailyTaskBtns = document.querySelectorAll('[data-action="daily-tasks"]');
        for (var i = 0; i < dailyTaskBtns.length; i++) {
            dailyTaskBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                show();
            });
        }

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.on('cultivation:expGained', function() {
                if (modalElement && modalElement.classList.contains('active')) {
                    refreshModal();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        show: show,
        hide: hide,
        refresh: refreshModal,
        getActivityRewards: function() { return ACTIVITY_REWARDS.slice(); }
    };
})();
