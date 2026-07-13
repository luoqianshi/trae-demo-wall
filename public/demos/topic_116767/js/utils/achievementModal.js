var AchievementModal = (function() {
    'use strict';

    var modalElement = null;
    var detailOverlay = null;
    var currentCategory = 'all';
    var currentRarity = 'all';
    var currentView = 'grid';

    function buildModalHTML() {
        var progress = AchievementSystem.getOverallProgress();
        var rarityStats = AchievementSystem.getRarityStats();
        var categoryStats = AchievementSystem.getCategoryStats();
        var categories = AchievementSystem.getCategories();
        var rarities = AchievementSystem.getRarities();

        var visibleCategories = categories.filter(function(cat) {
            var catAch = AchievementSystem.getAchievementsByCategory(cat.id);
            return catAch.length > 0;
        });

        var rarityIcons = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };

        var rarityCardsHtml = rarities.map(function(rarity) {
            var stat = rarityStats[rarity.id];
            if (!stat) return '';
            return `
                <div class="achievement-rarity-card">
                    <div class="achievement-rarity-card-icon">${rarityIcons[rarity.id] || '⚪'}</div>
                    <div class="achievement-rarity-card-count">${stat.unlocked}/${stat.total}</div>
                    <div class="achievement-rarity-card-label">${stat.config.name}</div>
                </div>
            `;
        }).join('');

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

                    <div class="achievement-progress-overview">
                        <div class="achievement-progress-bar-wrap">
                            <div class="achievement-progress-label">
                                <span>总体完成度</span>
                                <span>${progress.unlocked}/${progress.total} (${progress.ratio}%)</span>
                            </div>
                            <div class="achievement-progress-bar">
                                <div class="achievement-progress-fill" style="width: ${progress.ratio}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="achievement-rarity-section">
                        <div class="achievement-rarity-title">稀有度统计</div>
                        <div class="achievement-rarity-grid">
                            ${rarityCardsHtml}
                        </div>
                    </div>

                    <div class="achievement-view-toggle">
                        <button class="achievement-view-toggle-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            网格
                        </button>
                        <button class="achievement-view-toggle-btn ${currentView === 'list' ? 'active' : ''}" data-view="list">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                            列表
                        </button>
                    </div>

                    <div class="achievement-tabs" id="achievement-tabs">
                        <div class="achievement-tab ${currentCategory === 'all' ? 'active' : ''}" data-category="all">全部</div>
                        ${visibleCategories.map(function(cat) {
                            var catStat = categoryStats[cat.id];
                            var count = catStat ? ` (${catStat.unlocked}/${catStat.total})` : '';
                            return `<div class="achievement-tab" data-category="${cat.id}">${cat.icon} ${cat.name}${count}</div>`;
                        }).join('')}
                    </div>

                    <div class="achievement-rarity-filter">
                        <button class="achievement-rarity-filter-btn ${currentRarity === 'all' ? 'active' : ''}" data-rarity="all">全部稀有度</button>
                        ${rarities.map(function(r) {
                            return `<button class="achievement-rarity-filter-btn ${r.id}" data-rarity="${r.id}">${rarityIcons[r.id] || '⚪'} ${r.config.name}</button>`;
                        }).join('')}
                    </div>

                    <div class="achievement-list" id="achievement-list">
                        ${renderAchievements()}
                    </div>
                </div>
            </div>
        `;
    }

    function renderAchievements() {
        var achievements = AchievementSystem.getAllAchievements();

        var filtered = achievements.filter(function(a) {
            if (!a.visible) return false;
            if (currentCategory !== 'all' && a.category !== currentCategory) return false;
            if (currentRarity !== 'all' && a.rarity !== currentRarity) return false;
            return true;
        });

        if (filtered.length === 0) {
            return '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:var(--font-size-sm);">暂无成就</div>';
        }

        if (currentView === 'grid') {
            return renderGridView(filtered);
        } else {
            return renderListView(filtered);
        }
    }

    function renderGridView(achievements) {
        return '<div class="achievement-grid">' + achievements.map(function(a) {
            var rarityStars = '';
            var starCount = a.rarityConfig ? a.rarityConfig.stars || 1 : 1;
            for (var i = 0; i < starCount; i++) {
                rarityStars += '⭐';
            }

            return `
                <div class="achievement-grid-item ${a.unlocked ? 'unlocked ' + a.rarity : 'locked'}" 
                     data-achievement-id="${a.id}"
                     title="${a.unlocked ? a.name : '???'}">
                    <div class="achievement-grid-icon">${a.unlocked ? a.icon : '🔒'}</div>
                    <div class="achievement-grid-name">${a.unlocked ? a.name : '???'}</div>
                    <div class="achievement-grid-rarity">${a.unlocked ? rarityStars : ''}</div>
                </div>
            `;
        }).join('') + '</div>';
    }

    function renderListView(achievements) {
        return achievements.map(function(a) {
            var rarityStars = '';
            var starCount = a.rarityConfig ? a.rarityConfig.stars || 1 : 1;
            for (var i = 0; i < starCount; i++) {
                rarityStars += '⭐';
            }
            
            return `
                <div class="achievement-item ${a.unlocked ? 'unlocked ' + a.rarity : 'locked'}" data-achievement-id="${a.id}">
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

    function showAchievementDetail(achievementId) {
        var achievements = AchievementSystem.getAllAchievements();
        var achievement = null;
        
        for (var i = 0; i < achievements.length; i++) {
            if (achievements[i].id === achievementId) {
                achievement = achievements[i];
                break;
            }
        }

        if (!achievement) return;

        var rarityConfig = achievement.rarityConfig || AchievementSystem.getRarityConfig(achievement.rarity);
        var categoryConfig = achievement.categoryConfig || AchievementSystem.getCategoryConfig(achievement.category);
        var expReward = AchievementSystem.getExpReward(achievement.rarity);

        var rarityStars = '';
        var starCount = rarityConfig ? rarityConfig.stars || 1 : 1;
        for (var j = 0; j < starCount; j++) {
            rarityStars += '⭐';
        }

        var unlockedDate = '';
        if (achievement.unlocked && achievement.unlockedAt) {
            var date = new Date(achievement.unlockedAt);
            unlockedDate = date.getFullYear() + '/' + 
                          String(date.getMonth() + 1).padStart(2, '0') + '/' + 
                          String(date.getDate()).padStart(2, '0');
        }

        var rarityColors = {
            common: '#9CA3AF',
            rare: '#4A6FA5',
            epic: '#6B5CE0',
            legendary: '#C9A227'
        };
        var rarityColor = rarityColors[achievement.rarity] || rarityColors.common;

        var detailHTML = `
            <div class="achievement-modal-overlay" id="achievement-detail-overlay">
                <div class="achievement-detail-modal">
                    <div class="achievement-detail-header">
                        <div class="achievement-detail-header-bg" style="background: ${rarityColor};"></div>
                        <div class="achievement-detail-icon-wrap" style="background: linear-gradient(135deg, ${rarityColor}33 0%, ${rarityColor}11 100%); border: 3px solid ${rarityColor};">
                            <div class="detail-icon-glow" style="background: radial-gradient(circle, ${rarityColor}80 0%, transparent 70%);"></div>
                            <span class="achievement-detail-icon">${achievement.unlocked ? achievement.icon : '🔒'}</span>
                        </div>
                        <div class="achievement-detail-name">${achievement.unlocked ? achievement.name : '???'}</div>
                        <div class="achievement-detail-rarity" style="background: ${rarityColor}22; color: ${rarityColor};">
                            <span class="stars">${rarityStars}</span>
                            <span>${rarityConfig ? rarityConfig.name : ''}</span>
                        </div>
                    </div>
                    <div class="achievement-detail-body">
                        <div class="achievement-detail-desc">
                            ${achievement.unlocked ? achievement.description : '继续探索解锁该成就'}
                        </div>
                        
                        <div class="achievement-detail-rewards">
                            <div class="achievement-detail-rewards-title">奖励</div>
                            <div class="achievement-detail-reward-item">
                                <span class="achievement-detail-reward-icon">✨</span>
                                <span class="achievement-detail-reward-text">经验值</span>
                                <span class="achievement-detail-reward-value">+${expReward}</span>
                            </div>
                        </div>

                        <div class="achievement-detail-meta">
                            <span>分类：${categoryConfig ? categoryConfig.icon + ' ' + categoryConfig.name : achievement.category}</span>
                            ${achievement.unlocked ? '<span>解锁于：' + unlockedDate + '</span>' : '<span>状态：未解锁</span>'}
                        </div>

                        <button class="achievement-detail-close-btn" id="achievement-detail-close-btn">
                            知道了
                        </button>
                    </div>
                </div>
            </div>
        `;

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = detailHTML;
        detailOverlay = tempDiv.firstElementChild;
        document.body.appendChild(detailOverlay);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                detailOverlay.classList.add('active');
            });
        });

        var closeBtn = detailOverlay.querySelector('#achievement-detail-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideAchievementDetail);
        }

        detailOverlay.addEventListener('click', function(e) {
            if (e.target === detailOverlay) {
                hideAchievementDetail();
            }
        });
    }

    function hideAchievementDetail() {
        if (!detailOverlay) return;
        
        detailOverlay.classList.remove('active');
        setTimeout(function() {
            if (detailOverlay && detailOverlay.parentNode) {
                detailOverlay.parentNode.removeChild(detailOverlay);
            }
            detailOverlay = null;
        }, 300);
    }

    function refreshAchievements() {
        var listEl = document.getElementById('achievement-list');
        if (listEl) {
            listEl.innerHTML = renderAchievements();
            bindAchievementItemEvents(listEl);
        }
    }

    function bindAchievementItemEvents(container) {
        if (!container) return;

        var items = container.querySelectorAll('[data-achievement-id]');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function(e) {
                var id = this.getAttribute('data-achievement-id');
                if (id) {
                    showAchievementDetail(id);
                }
            });
        }
    }

    function ensureModal() {
        if (modalElement) return;

        modalElement = document.createElement('div');
        modalElement.innerHTML = buildModalHTML();
        document.body.appendChild(modalElement.firstElementChild);
        modalElement = document.getElementById('achievement-modal');

        bindEvents();
    }

    function bindEvents() {
        if (!modalElement) return;

        var closeBtn = modalElement.querySelector('#achievement-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }

        var tabs = modalElement.querySelectorAll('.achievement-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function() {
                var category = this.getAttribute('data-category');
                if (category && category !== currentCategory) {
                    currentCategory = category;
                    
                    var allTabs = modalElement.querySelectorAll('.achievement-tab');
                    for (var j = 0; j < allTabs.length; j++) {
                        allTabs[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    refreshAchievements();
                }
            });
        }

        var rarityBtns = modalElement.querySelectorAll('.achievement-rarity-filter-btn');
        for (var k = 0; k < rarityBtns.length; k++) {
            rarityBtns[k].addEventListener('click', function() {
                var rarity = this.getAttribute('data-rarity');
                if (rarity && rarity !== currentRarity) {
                    currentRarity = rarity;
                    
                    var allBtns = modalElement.querySelectorAll('.achievement-rarity-filter-btn');
                    for (var l = 0; l < allBtns.length; l++) {
                        allBtns[l].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    refreshAchievements();
                }
            });
        }

        var viewBtns = modalElement.querySelectorAll('.achievement-view-toggle-btn');
        for (var m = 0; m < viewBtns.length; m++) {
            viewBtns[m].addEventListener('click', function() {
                var view = this.getAttribute('data-view');
                if (view && view !== currentView) {
                    currentView = view;
                    
                    var allViewBtns = modalElement.querySelectorAll('.achievement-view-toggle-btn');
                    for (var n = 0; n < allViewBtns.length; n++) {
                        allViewBtns[n].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    refreshAchievements();
                }
            });
        }

        bindAchievementItemEvents(modalElement.querySelector('#achievement-list'));
    }

    function show() {
        ensureModal();
        if (!modalElement) return;

        currentCategory = 'all';
        currentRarity = 'all';
        currentView = 'grid';

        refreshAchievements();

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
        var achievementBtns = document.querySelectorAll('[data-action="achievements"]');
        for (var i = 0; i < achievementBtns.length; i++) {
            achievementBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                show();
            });
        }

        if (typeof AchievementSystem !== 'undefined' && typeof AchievementSystem.addUnlockListener === 'function') {
            AchievementSystem.addUnlockListener(function() {
                if (modalElement && modalElement.classList.contains('active')) {
                    refreshAchievements();
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
        refresh: refreshAchievements,
        showDetail: showAchievementDetail,
        hideDetail: hideAchievementDetail
    };
})();
