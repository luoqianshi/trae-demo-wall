var StageSummary = (function() {
    'use strict';

    var STORAGE_KEY = 'stage_summaries';

    var STAGE_CONFIG = [
        {
            stage: 1,
            name: '设计规划',
            icon: '📐',
            description: '装修前的准备工作，包括设计方案、预算规划、合同签订',
            tips: ['设计方案要反复确认', '合同条款仔细阅读', '预算要留有余地'],
            nianMessage: '太棒了！设计规划阶段已经完成，您对新家已经有了清晰的蓝图~'
        },
        {
            stage: 2,
            name: '结构改造',
            icon: '🔨',
            description: '主体拆改和水电改造，为新家打好基础',
            tips: ['承重墙绝对不能拆', '水电改造要走顶', '防水要做48小时闭水试验'],
            nianMessage: '结构改造完成啦！水电这些隐蔽工程一定要把好关哦~'
        },
        {
            stage: 3,
            name: '泥木工程',
            icon: '🧱',
            description: '瓦工和木工施工，家的轮廓逐渐清晰',
            tips: ['瓷砖空鼓率不超过5%', '木工收口要整齐', '吊顶龙骨要牢固'],
            nianMessage: '泥木工程完成了！家的样子越来越清晰了，是不是很期待？'
        },
        {
            stage: 4,
            name: '油漆工程',
            icon: '🎨',
            description: '墙面油漆和壁纸，为新家上色',
            tips: ['墙面要刮三遍腻子', '乳胶漆要选环保的', '壁纸要注意对花'],
            nianMessage: '油漆工程搞定！色彩让家变得更有温度了~'
        },
        {
            stage: 5,
            name: '主材安装',
            icon: '🪟',
            description: '门窗、地板、橱柜等主材安装',
            tips: ['地板提前进场适应温度', '橱柜安装要注意水平', '五金件选品牌更耐用'],
            nianMessage: '主材都安装好啦！新家的功能越来越完善了~'
        },
        {
            stage: 6,
            name: '竣工验收',
            icon: '✅',
            description: '开荒保洁、家具进场、竣工验收',
            tips: ['开荒保洁要专业', '甲醛检测不能少', '验收要逐项检查'],
            nianMessage: '恭喜恭喜！装修全部完成了，准备入住新家吧！'
        }
    ];

    var summaries = {};

    function loadSummaries() {
        try {
            var saved = Storage.load(STORAGE_KEY);
            if (saved && typeof saved === 'object') {
                summaries = saved;
            } else {
                summaries = {};
            }
        } catch (e) {
            summaries = {};
        }
    }

    function saveSummaries() {
        Storage.save(STORAGE_KEY, summaries);
    }

    function init() {
        loadSummaries();
        bindEvents();
    }

    function bindEvents() {
        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            EventBus.on(EventBus.EVENTS.SOP_STAGE_COMPLETE, function(data) {
                if (data && data.stage) {
                    generateSummary(data.stage);
                }
            });
        }
    }

    function getStageConfig(stageNum) {
        for (var i = 0; i < STAGE_CONFIG.length; i++) {
            if (STAGE_CONFIG[i].stage === stageNum) {
                return STAGE_CONFIG[i];
            }
        }
        return null;
    }

    function calculateStageStats(stageNum) {
        var mode = App ? App.getDecorationMode() : 'full';
        var sopProgress = App && App.state ? App.state.sopProgress : null;
        var modeProgress = sopProgress && sopProgress[mode] ? sopProgress[mode] : null;
        var completedSteps = modeProgress && modeProgress.completedSteps ? modeProgress.completedSteps : [];

        var stageSteps = completedSteps.filter(function(s) {
            var match = s.match(/^[FHS](\d+)-/);
            return match && parseInt(match[1]) === stageNum;
        });

        var stepsCount = stageSteps.length;
        var durationDays = 0;
        var expenses = 0;
        var pitfallsAvoided = 0;

        if (typeof PitfallTracker !== 'undefined') {
            pitfallsAvoided = PitfallTracker.getAvoidedCount() || 0;
        }

        if (stepsCount > 0) {
            durationDays = stepsCount * 3;
        }

        return {
            stepsCompleted: stepsCount,
            totalSteps: stepsCount > 0 ? stepsCount : 4,
            durationDays: durationDays,
            expenses: expenses,
            pitfallsAvoided: pitfallsAvoided
        };
    }

    function generateSummary(stageNum) {
        if (summaries[stageNum]) {
            return summaries[stageNum];
        }

        var stageConfig = getStageConfig(stageNum);
        if (!stageConfig) return null;

        var stats = calculateStageStats(stageNum);

        var summary = {
            stage: stageNum,
            name: stageConfig.name,
            icon: stageConfig.icon,
            description: stageConfig.description,
            completedAt: Date.now(),
            stats: stats,
            tips: stageConfig.tips,
            nianMessage: stageConfig.nianMessage
        };

        summaries[stageNum] = summary;
        saveSummaries();

        showSummaryModal(summary);

        return summary;
    }

    function showSummaryModal(summary) {
        var modal = document.createElement('div');
        modal.className = 'modal stage-summary-modal';
        modal.innerHTML = `
            <div class="modal-content stage-summary-content">
                <div class="stage-summary-header">
                    <div class="stage-summary-icon">${summary.icon}</div>
                    <div class="stage-summary-title">
                        <div class="stage-summary-badge">第 ${summary.stage} 阶段</div>
                        <div class="stage-summary-name">${summary.name} 完成！</div>
                    </div>
                </div>

                <div class="stage-summary-nian">
                    <div class="stage-summary-nian-avatar">
                        <img src="images/nian-icons/nian-happy.png" alt="小管家" width="64" height="64">
                    </div>
                    <div class="stage-summary-nian-bubble">
                        ${summary.nianMessage}
                    </div>
                </div>

                <div class="stage-summary-stats">
                    <div class="summary-stat-item">
                        <div class="summary-stat-value">${summary.stats.stepsCompleted}</div>
                        <div class="summary-stat-label">完成步骤</div>
                    </div>
                    <div class="summary-stat-item">
                        <div class="summary-stat-value">${summary.stats.durationDays}</div>
                        <div class="summary-stat-label">预计天数</div>
                    </div>
                    <div class="summary-stat-item">
                        <div class="summary-stat-value">${summary.stats.pitfallsAvoided}</div>
                        <div class="summary-stat-label">避坑数量</div>
                    </div>
                </div>

                <div class="stage-summary-tips">
                    <div class="summary-tips-title">💡 本阶段要点回顾</div>
                    <ul class="summary-tips-list">
                        ${summary.tips.map(function(tip) {
                            return `<li>${tip}</li>`;
                        }).join('')}
                    </ul>
                </div>

                <button class="btn-primary stage-summary-btn" id="stage-summary-confirm-btn">
                    继续下一阶段
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                modal.classList.add('active');
            });
        });

        var confirmBtn = modal.querySelector('#stage-summary-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                closeSummaryModal(modal);
            });
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSummaryModal(modal);
            }
        });
    }

    function closeSummaryModal(modal) {
        modal.classList.remove('active');
        setTimeout(function() {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    function getSummary(stageNum) {
        return summaries[stageNum] || null;
    }

    function getAllSummaries() {
        var result = [];
        var keys = Object.keys(summaries).sort(function(a, b) {
            return parseInt(a) - parseInt(b);
        });
        for (var i = 0; i < keys.length; i++) {
            result.push(summaries[keys[i]]);
        }
        return result;
    }

    function hasSummary(stageNum) {
        return !!summaries[stageNum];
    }

    function showHistoryModal() {
        var allSummaries = getAllSummaries();

        var modal = document.createElement('div');
        modal.className = 'modal stage-summary-history-modal';
        modal.innerHTML = `
            <div class="modal-content stage-summary-history-content">
                <div class="stage-summary-history-header">
                    <div class="stage-summary-history-title">📊 阶段总结回顾</div>
                    <button class="stage-summary-history-close" aria-label="关闭">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="stage-summary-history-list">
                    ${allSummaries.length > 0 ? allSummaries.map(function(s) {
                        return `
                            <div class="history-summary-item">
                                <div class="history-summary-icon">${s.icon}</div>
                                <div class="history-summary-info">
                                    <div class="history-summary-name">第${s.stage}阶段 · ${s.name}</div>
                                    <div class="history-summary-stats">
                                        完成${s.stats.stepsCompleted}步 · ${s.stats.durationDays}天 · 避坑${s.stats.pitfallsAvoided}个
                                    </div>
                                </div>
                                <div class="history-summary-check">✓</div>
                            </div>
                        `;
                    }).join('') : `
                        <div class="empty-state empty-state-mini">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">还没有阶段总结</div>
                            <div class="empty-state-desc">完成第一个阶段后，这里会出现总结哦~</div>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                modal.classList.add('active');
            });
        });

        var closeBtn = modal.querySelector('.stage-summary-history-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('active');
                setTimeout(function() {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            });
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(function() {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });
    }

    function reset() {
        summaries = {};
        saveSummaries();
    }

    return {
        init: init,
        generateSummary: generateSummary,
        getSummary: getSummary,
        getAllSummaries: getAllSummaries,
        hasSummary: hasSummary,
        showHistoryModal: showHistoryModal,
        reset: reset
    };
})();
