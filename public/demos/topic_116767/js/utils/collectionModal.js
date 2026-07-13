var CollectionModal = (function() {
    'use strict';

    var modalElement = null;
    var detailOverlay = null;
    var currentTab = 'furniture';
    var currentCategory = 'all';

    var RARITY_COLORS = {
        common: { name: '普通', color: '#9CA3AF', bg: '#F3F4F6' },
        rare: { name: '稀有', color: '#4A6FA5', bg: '#EFF6FF' },
        epic: { name: '史诗', color: '#6B5CE0', bg: '#F5F3FF' },
        legendary: { name: '传说', color: '#C9A227', bg: '#FEFCE8' }
    };

    var STAGE_CONFIGS = [
        { stage: 0, name: '毛坯阶段', icon: '🧱', description: '空荡荡的毛坯房，一切从零开始' },
        { stage: 1, name: '设计阶段', icon: '📐', description: '精心设计规划，描绘家的蓝图' },
        { stage: 2, name: '水电阶段', icon: '🔌', description: '水电改造，隐蔽工程打好基础' },
        { stage: 3, name: '泥木阶段', icon: '🪵', description: '泥木施工，家的轮廓逐渐清晰' },
        { stage: 4, name: '安装阶段', icon: '💡', description: '安装进场，功能空间逐步完善' },
        { stage: 5, name: '软装阶段', icon: '🛋️', description: '软装饰家，温馨氛围完美呈现' }
    ];

    function getAllFurniture() {
        if (typeof ObjectConfig === 'undefined' || !ObjectConfig.getAllObjects) {
            return getFurnitureFallback();
        }
        return ObjectConfig.getAllObjects();
    }

    function getFurnitureFallback() {
        var allObjects = [];
        
        if (typeof ObjectConfig !== 'undefined' && ObjectConfig.STAGE_CONFIGS) {
            for (var stageKey in ObjectConfig.STAGE_CONFIGS) {
                if (ObjectConfig.STAGE_CONFIGS.hasOwnProperty(stageKey)) {
                    var stage = ObjectConfig.STAGE_CONFIGS[stageKey];
                    var stageNum = parseInt(stageKey.replace('stage', ''));
                    if (stage.objects && stage.objects.length) {
                        for (var i = 0; i < stage.objects.length; i++) {
                            var obj = Object.assign({}, stage.objects[i]);
                            obj.stage = stageNum;
                            obj.stageName = stage.name;
                            allObjects.push(obj);
                        }
                    }
                }
            }
        }
        
        return allObjects;
    }

    function getRoomCategories() {
        if (typeof ObjectConfig !== 'undefined' && ObjectConfig.ROOM_CATEGORIES) {
            return Object.assign({}, ObjectConfig.ROOM_CATEGORIES);
        }
        return {
            living_room: { name: '客厅', icon: '🛋️' },
            bedroom: { name: '卧室', icon: '🛏️' },
            kitchen: { name: '厨房', icon: '🍳' },
            bathroom: { name: '卫生间', icon: '🚿' },
            decoration: { name: '装饰', icon: '🎨' }
        };
    }

    function getCollectionData(category) {
        if (typeof CultivationData === 'undefined') return {};
        return CultivationData.getCollection(category || 'furniture') || {};
    }

    function isItemUnlocked(itemId) {
        if (typeof CultivationData === 'undefined') return false;
        return CultivationData.isItemUnlocked('furniture', itemId);
    }

    function getCollectionStats() {
        var allItems = getAllFurniture();
        var unlockedCount = 0;
        var totalCount = allItems.length;

        for (var i = 0; i < allItems.length; i++) {
            if (isItemUnlocked(allItems[i].id)) {
                unlockedCount++;
            }
        }

        return {
            total: totalCount,
            unlocked: unlockedCount,
            ratio: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
        };
    }

    function getSceneProgress() {
        var unlockedStages = 0;
        if (typeof StepObjectMapping !== 'undefined' && StepObjectMapping.getTotalStepCount) {
            if (typeof CultivationData !== 'undefined' && CultivationData.getStat) {
                var completedSteps = CultivationData.getStat('totalStepsCompleted') || 0;
                var maxStage = 0;
                for (var s = 0; s <= 5; s++) {
                    if (typeof StepObjectMapping.getStageStepCount === 'function') {
                        var stageSteps = StepObjectMapping.getStageSteps(s + 1);
                        var completedInStage = 0;
                        for (var j = 0; j < stageSteps.length; j++) {
                            if (completedSteps > s * 4) {
                                completedInStage++;
                            }
                        }
                        if (completedInStage > 0) {
                            maxStage = s + 1;
                        }
                    }
                }
                unlockedStages = Math.min(6, maxStage + 1);
            }
        }
        return {
            total: 6,
            unlocked: unlockedStages,
            ratio: Math.round((unlockedStages / 6) * 100)
        };
    }

    function buildModalHTML() {
        var furnitureStats = getCollectionStats();
        var sceneStats = getSceneProgress();
        var roomCategories = getRoomCategories();

        return `
            <div class="collection-modal" id="collection-modal">
                <div class="collection-content">
                    <div class="collection-header">
                        <div class="collection-title">
                            <span class="collection-title-icon">📚</span>
                            收集图鉴
                        </div>
                        <button class="collection-close" id="collection-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div class="collection-tabs">
                        <div class="collection-tab ${currentTab === 'furniture' ? 'active' : ''}" data-tab="furniture">
                            <span class="collection-tab-icon">🪑</span>
                            家具图鉴
                            <span class="collection-tab-badge">${furnitureStats.unlocked}/${furnitureStats.total}</span>
                        </div>
                        <div class="collection-tab ${currentTab === 'scenes' ? 'active' : ''}" data-tab="scenes">
                            <span class="collection-tab-icon">🏠</span>
                            场景图鉴
                            <span class="collection-tab-badge">${sceneStats.unlocked}/${sceneStats.total}</span>
                        </div>
                    </div>

                    <div class="collection-progress-section">
                        <div class="collection-progress-header">
                            <span>收集进度</span>
                            <span class="collection-progress-value">
                                ${currentTab === 'furniture' ? furnitureStats.unlocked + '/' + furnitureStats.total : sceneStats.unlocked + '/' + sceneStats.total}
                                (${currentTab === 'furniture' ? furnitureStats.ratio : sceneStats.ratio}%)
                            </span>
                        </div>
                        <div class="collection-progress-bar">
                            <div class="collection-progress-fill" style="width: ${currentTab === 'furniture' ? furnitureStats.ratio : sceneStats.ratio}%;"></div>
                        </div>
                    </div>

                    <div class="collection-category-tabs" id="collection-category-tabs">
                        ${currentTab === 'furniture' ? buildCategoryTabs(roomCategories) : ''}
                    </div>

                    <div class="collection-content-area" id="collection-content-area">
                        ${currentTab === 'furniture' ? renderFurnitureGrid() : renderSceneGrid()}
                    </div>
                </div>
            </div>
        `;
    }

    function buildCategoryTabs(categories) {
        var tabsHtml = '<div class="collection-category-tab active" data-category="all">全部</div>';
        for (var key in categories) {
            if (categories.hasOwnProperty(key)) {
                var cat = categories[key];
                tabsHtml += `<div class="collection-category-tab" data-category="${key}">${cat.icon} ${cat.name}</div>`;
            }
        }
        return tabsHtml;
    }

    function renderFurnitureGrid() {
        var allItems = getAllFurniture();
        var filtered = allItems;
        
        if (currentCategory !== 'all') {
            filtered = allItems.filter(function(item) {
                return item.roomCategory === currentCategory;
            });
        }

        if (filtered.length === 0) {
            return '<div style="text-align:center;padding:60px;color:var(--text-muted);">暂无该分类物品</div>';
        }

        return '<div class="collection-grid">' + filtered.map(function(item) {
            var unlocked = isItemUnlocked(item.id);
            var rarityConfig = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            
            return `
                <div class="collection-item ${unlocked ? 'unlocked' : 'locked'} ${item.rarity || 'common'}" 
                     data-item-id="${item.id}"
                     title="${unlocked ? item.name : '???'}">
                    <div class="collection-item-icon-wrap" style="background: ${unlocked ? rarityConfig.bg : '#F3F4F6'};">
                        <span class="collection-item-icon">${unlocked ? item.icon : '🔒'}</span>
                    </div>
                    <div class="collection-item-name">${unlocked ? item.name : '???'}</div>
                    ${unlocked ? `<div class="collection-item-rarity" style="color: ${rarityConfig.color};">${rarityConfig.name}</div>` : ''}
                </div>
            `;
        }).join('') + '</div>';
    }

    function renderSceneGrid() {
        var sceneStats = getSceneProgress();
        
        return '<div class="collection-scene-grid">' + STAGE_CONFIGS.map(function(stage, index) {
            var unlocked = index < sceneStats.unlocked;
            return `
                <div class="collection-scene-item ${unlocked ? 'unlocked' : 'locked'}" data-stage="${index}">
                    <div class="collection-scene-preview">
                        <div class="collection-scene-icon">${stage.icon}</div>
                        ${!unlocked ? '<div class="collection-scene-lock">🔒</div>' : ''}
                    </div>
                    <div class="collection-scene-name">${unlocked ? stage.name : '???'}</div>
                    <div class="collection-scene-desc">${unlocked ? stage.description : '完成对应阶段后解锁'}</div>
                </div>
            `;
        }).join('') + '</div>';
    }

    function showItemDetail(itemId) {
        var allItems = getAllFurniture();
        var item = null;
        
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i].id === itemId) {
                item = allItems[i];
                break;
            }
        }

        if (!item) return;

        var unlocked = isItemUnlocked(itemId);
        var rarityConfig = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
        var roomCategories = getRoomCategories();
        var roomInfo = item.roomCategory ? roomCategories[item.roomCategory] : null;

        var detailHTML = `
            <div class="collection-modal-overlay" id="collection-detail-overlay">
                <div class="collection-detail-modal">
                    <div class="collection-detail-header" style="background: linear-gradient(135deg, ${rarityConfig.color}22 0%, ${rarityConfig.color}11 100%);">
                        <div class="collection-detail-icon-wrap" style="border-color: ${rarityConfig.color};">
                            <span class="collection-detail-icon">${unlocked ? item.icon : '🔒'}</span>
                        </div>
                        <div class="collection-detail-name">${unlocked ? item.name : '???'}</div>
                        <div class="collection-detail-rarity" style="color: ${rarityConfig.color}; background: ${rarityConfig.bg};">
                            ${rarityConfig.name}品质
                        </div>
                    </div>
                    <div class="collection-detail-body">
                        <div class="collection-detail-desc">
                            ${unlocked ? (item.description || '暂无描述') : '继续探索解锁该物品'}
                        </div>
                        
                        <div class="collection-detail-info">
                            <div class="collection-detail-info-item">
                                <span class="collection-detail-info-label">类型</span>
                                <span class="collection-detail-info-value">${item.type || '未知'}</span>
                            </div>
                            ${roomInfo ? `
                            <div class="collection-detail-info-item">
                                <span class="collection-detail-info-label">分类</span>
                                <span class="collection-detail-info-value">${roomInfo.icon} ${roomInfo.name}</span>
                            </div>
                            ` : ''}
                            ${item.stageName ? `
                            <div class="collection-detail-info-item">
                                <span class="collection-detail-info-label">获取阶段</span>
                                <span class="collection-detail-info-value">${item.stageName}</span>
                            </div>
                            ` : ''}
                            ${item.guidanceMessage ? `
                            <div class="collection-detail-info-item">
                                <span class="collection-detail-info-label">小提示</span>
                                <span class="collection-detail-info-value">${item.guidanceMessage}</span>
                            </div>
                            ` : ''}
                        </div>

                        <button class="collection-detail-close-btn" id="collection-detail-close-btn">
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

        var closeBtn = detailOverlay.querySelector('#collection-detail-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideItemDetail);
        }

        detailOverlay.addEventListener('click', function(e) {
            if (e.target === detailOverlay) {
                hideItemDetail();
            }
        });
    }

    function hideItemDetail() {
        if (!detailOverlay) return;
        
        detailOverlay.classList.remove('active');
        setTimeout(function() {
            if (detailOverlay && detailOverlay.parentNode) {
                detailOverlay.parentNode.removeChild(detailOverlay);
            }
            detailOverlay = null;
        }, 300);
    }

    function refreshContent() {
        var contentArea = modalElement ? modalElement.querySelector('#collection-content-area') : null;
        if (!contentArea) return;

        contentArea.innerHTML = currentTab === 'furniture' ? renderFurnitureGrid() : renderSceneGrid();
        bindContentEvents(contentArea);
    }

    function bindContentEvents(container) {
        if (!container) return;

        var items = container.querySelectorAll('.collection-item[data-item-id]');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function() {
                var itemId = this.getAttribute('data-item-id');
                if (itemId) {
                    showItemDetail(itemId);
                }
            });
        }
    }

    function ensureModal() {
        if (modalElement) return;

        modalElement = document.createElement('div');
        modalElement.innerHTML = buildModalHTML();
        document.body.appendChild(modalElement.firstElementChild);
        modalElement = document.getElementById('collection-modal');

        bindEvents();
    }

    function bindEvents() {
        if (!modalElement) return;

        var closeBtn = modalElement.querySelector('#collection-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }

        var tabs = modalElement.querySelectorAll('.collection-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function() {
                var tab = this.getAttribute('data-tab');
                if (tab && tab !== currentTab) {
                    currentTab = tab;
                    currentCategory = 'all';
                    
                    var allTabs = modalElement.querySelectorAll('.collection-tab');
                    for (var j = 0; j < allTabs.length; j++) {
                        allTabs[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    updateCategoryTabs();
                    refreshContent();
                    updateProgressHeader();
                }
            });
        }

        var categoryTabsContainer = modalElement.querySelector('#collection-category-tabs');
        if (categoryTabsContainer) {
            categoryTabsContainer.addEventListener('click', function(e) {
                var tab = e.target.closest('.collection-category-tab');
                if (!tab) return;
                
                var category = tab.getAttribute('data-category');
                if (category && category !== currentCategory) {
                    currentCategory = category;
                    
                    var allCatTabs = categoryTabsContainer.querySelectorAll('.collection-category-tab');
                    for (var k = 0; k < allCatTabs.length; k++) {
                        allCatTabs[k].classList.remove('active');
                    }
                    tab.classList.add('active');
                    
                    refreshContent();
                }
            });
        }

        bindContentEvents(modalElement.querySelector('#collection-content-area'));

        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                hide();
            }
        });
    }

    function updateCategoryTabs() {
        var container = modalElement.querySelector('#collection-category-tabs');
        if (!container) return;

        if (currentTab === 'furniture') {
            var roomCategories = getRoomCategories();
            container.innerHTML = buildCategoryTabs(roomCategories);
            container.style.display = 'flex';
        } else {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    function updateProgressHeader() {
        var progressSection = modalElement.querySelector('.collection-progress-section');
        if (!progressSection) return;

        var stats = currentTab === 'furniture' ? getCollectionStats() : getSceneProgress();
        var valueEl = progressSection.querySelector('.collection-progress-value');
        var fillEl = progressSection.querySelector('.collection-progress-fill');
        
        if (valueEl) {
            valueEl.textContent = stats.unlocked + '/' + stats.total + ' (' + stats.ratio + '%)';
        }
        if (fillEl) {
            fillEl.style.width = stats.ratio + '%';
        }
    }

    function show() {
        ensureModal();
        if (!modalElement) return;

        currentTab = 'furniture';
        currentCategory = 'all';
        
        updateCategoryTabs();
        refreshContent();
        updateProgressHeader();

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

    function unlockFurnitureItem(itemId, itemData) {
        if (typeof CultivationData === 'undefined' || !CultivationData.unlockItem) return false;
        return CultivationData.unlockItem('furniture', itemId, itemData);
    }

    function init() {
        var collectionBtns = document.querySelectorAll('[data-action="collection"]');
        for (var i = 0; i < collectionBtns.length; i++) {
            collectionBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                show();
            });
        }

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            if (EventBus.EVENTS.STEP_COMPLETED) {
                EventBus.on(EventBus.EVENTS.STEP_COMPLETED, function(data) {
                    var stepId = data && data.stepId ? data.stepId : null;
                    if (!stepId && typeof data === 'string') {
                        stepId = data;
                    }
                    if (stepId && typeof StepObjectMapping !== 'undefined' && StepObjectMapping.getObjectIdsForStep) {
                        var objectIds = StepObjectMapping.getObjectIdsForStep(stepId);
                        for (var j = 0; j < objectIds.length; j++) {
                            if (unlockFurnitureItem(objectIds[j])) {
                                console.log('[CollectionModal] Unlocked furniture:', objectIds[j]);
                            }
                        }
                    }
                });
            }
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
        showItemDetail: showItemDetail,
        hideItemDetail: hideItemDetail,
        refresh: function() {
            if (modalElement && modalElement.classList.contains('active')) {
                refreshContent();
                updateProgressHeader();
            }
        },
        unlockFurnitureItem: unlockFurnitureItem
    };
})();
