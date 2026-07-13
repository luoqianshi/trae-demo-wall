var AssetSystem = (function() {
    'use strict';

    var modalElement = null;
    var currentCategory = 'character';
    var currentSlot = 'bulb_color';

    var ASSET_CATEGORIES = {
        character: {
            name: '角色外观',
            icon: '🧑'
        },
        decoration: {
            name: '场景装饰',
            icon: '🎨'
        }
    };

    var CHARACTER_ASSETS = {
        bulb_color: {
            name: '灯泡颜色',
            slot: 'bulb_color',
            items: [
                { id: 'bulb_default', name: '经典暖黄', color: '#FFD700', rarity: 'common', unlocked: true, description: '温暖的黄色灯光，经典又温馨~' },
                { id: 'bulb_blue', name: '天空蓝', color: '#87CEEB', rarity: 'rare', unlockLevel: 3, description: '清新的蓝色，带来宁静的感觉~' },
                { id: 'bulb_pink', name: '樱花粉', color: '#FFB6C1', rarity: 'rare', unlockLevel: 5, description: '粉嫩的颜色，少女心满满~' },
                { id: 'bulb_green', name: '薄荷绿', color: '#98FB98', rarity: 'epic', unlockLevel: 7, description: '清新自然的绿色，充满生机~' },
                { id: 'bulb_purple', name: '梦幻紫', color: '#DDA0DD', rarity: 'epic', unlockLevel: 8, description: '神秘的紫色，梦幻又浪漫~' },
                { id: 'bulb_rainbow', name: '彩虹渐变', color: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4, #A78BFA)', rarity: 'legendary', unlockLevel: 10, description: '传说中的彩虹灯泡，绚丽夺目！' }
            ]
        },
        hat: {
            name: '帽子配饰',
            slot: 'hat',
            items: [
                { id: 'hat_none', name: '不戴帽子', icon: '❌', rarity: 'common', unlocked: true, description: '清爽的光头造型~' },
                { id: 'hat_bow', name: '蝴蝶结', icon: '🎀', rarity: 'rare', unlockLevel: 2, description: '可爱的红色蝴蝶结，俏皮又可爱~' },
                { id: 'hat_crown', name: '小皇冠', icon: '👑', rarity: 'epic', unlockLevel: 6, description: '金色的小皇冠，尊贵非凡~' },
                { id: 'hat_flower', name: '花朵发饰', icon: '🌸', rarity: 'rare', unlockLevel: 4, description: '粉嫩的樱花装饰，春意盎然~' },
                { id: 'hat_star', name: '星星发箍', icon: '⭐', rarity: 'epic', unlockLevel: 7, description: '闪亮的星星发箍，元气满满~' },
                { id: 'hat_wizard', name: '巫师帽', icon: '🎩', rarity: 'legendary', unlockLevel: 9, description: '神秘的巫师帽，充满魔力~' }
            ]
        },
        accessory: {
            name: '小配饰',
            slot: 'accessory',
            items: [
                { id: 'acc_none', name: '无配饰', icon: '❌', rarity: 'common', unlocked: true, description: '清爽的造型~' },
                { id: 'acc_glasses', name: '圆框眼镜', icon: '👓', rarity: 'rare', unlockLevel: 3, description: '文质彬彬的圆框眼镜，知识感满满~' },
                { id: 'acc_scarf', name: '围巾', icon: '🧣', rarity: 'rare', unlockLevel: 4, description: '温暖的红围巾，冬日必备~' },
                { id: 'acc_ribbon', name: '领结', icon: '🎗️', rarity: 'epic', unlockLevel: 5, description: '精致的领结，正式又可爱~' },
                { id: 'acc_badge', name: '管家徽章', icon: '🎖️', rarity: 'epic', unlockLevel: 6, description: '荣誉的象征，优秀管家的证明~' },
                { id: 'acc_cape', name: '披风', icon: '🦸', rarity: 'legendary', unlockLevel: 8, description: '帅气的披风，超级管家登场！' }
            ]
        }
    };

    var SCENE_DECORATIONS = {
        wall_hanging: {
            name: '墙面挂件',
            slot: 'wall_hanging',
            items: [
                { id: 'wall_none', name: '无挂件', icon: '❌', rarity: 'common', unlocked: true, description: '简洁的墙面~' },
                { id: 'wall_painting', name: '风景画', icon: '🖼️', rarity: 'rare', unlockLevel: 3, description: '美丽的风景装饰画，提升格调~' },
                { id: 'wall_clock', name: '挂钟', icon: '🕐', rarity: 'rare', unlockLevel: 4, description: '复古挂钟，时刻提醒时间~' },
                { id: 'wall_shelf', name: '置物架', icon: '📚', rarity: 'epic', unlockLevel: 5, description: '文艺的置物架，可以摆放小物件~' },
                { id: 'wall_mirror', name: '装饰镜', icon: '🪞', rarity: 'epic', unlockLevel: 6, description: '精致的装饰镜，让空间更明亮~' },
                { id: 'wall_wreath', name: '花环', icon: '💐', rarity: 'legendary', unlockLevel: 8, description: '美丽的干花花环，自然又温馨~' }
            ]
        },
        plant: {
            name: '绿植摆件',
            slot: 'plant',
            items: [
                { id: 'plant_none', name: '无植物', icon: '❌', rarity: 'common', unlocked: true, description: '清爽的空间~' },
                { id: 'plant_succulent', name: '多肉盆栽', icon: '🪴', rarity: 'common', unlockLevel: 2, description: '可爱的多肉植物，好养又萌~' },
                { id: 'plant_monstera', name: '龟背竹', icon: '🌿', rarity: 'rare', unlockLevel: 4, description: '网红绿植，北欧风必备~' },
                { id: 'plant_bonsai', name: '小盆景', icon: '🌳', rarity: 'epic', unlockLevel: 5, description: '精致的小盆景，禅意十足~' },
                { id: 'plant_orchid', name: '兰花', icon: '🌸', rarity: 'epic', unlockLevel: 6, description: '高雅的兰花，提升品味~' },
                { id: 'plant_money', name: '发财树', icon: '💰', rarity: 'legendary', unlockLevel: 7, description: '招财进宝的发财树，好运连连~' }
            ]
        },
        floor_decor: {
            name: '地面装饰',
            slot: 'floor_decor',
            items: [
                { id: 'floor_none', name: '无装饰', icon: '❌', rarity: 'common', unlocked: true, description: '简洁的地面~' },
                { id: 'floor_rug', name: '小地毯', icon: '🧶', rarity: 'rare', unlockLevel: 3, description: '柔软的小地毯，脚感舒适~' },
                { id: 'floor_pillow', name: '抱枕', icon: '🛋️', rarity: 'common', unlockLevel: 2, description: '可爱的抱枕，靠上去真舒服~' },
                { id: 'floor_cat', name: '猫咪玩偶', icon: '🐱', rarity: 'epic', unlockLevel: 5, description: '萌萌的猫咪玩偶，治愈系~' },
                { id: 'floor_books', name: '书堆', icon: '📚', rarity: 'rare', unlockLevel: 4, description: '文艺的书堆，知识就是力量~' },
                { id: 'floor_fountain', name: '小喷泉', icon: '⛲', rarity: 'legendary', unlockLevel: 9, description: '精致的小喷泉，流水潺潺~' }
            ]
        }
    };

    var RARITY_COLORS = {
        common: { name: '普通', color: '#9CA3AF', bg: '#F3F4F6' },
        rare: { name: '稀有', color: '#4A6FA5', bg: '#EFF6FF' },
        epic: { name: '史诗', color: '#6B5CE0', bg: '#F5F3FF' },
        legendary: { name: '传说', color: '#C9A227', bg: '#FEFCE8' }
    };

    function getAllAssets() {
        return {
            character: CHARACTER_ASSETS,
            decoration: SCENE_DECORATIONS
        };
    }

    function isAssetUnlocked(assetId) {
        if (typeof CultivationData !== 'undefined' && CultivationData.isAssetUnlocked) {
            if (CultivationData.isAssetUnlocked(assetId)) {
                return true;
            }
        }
        
        var allCategories = Object.assign({}, CHARACTER_ASSETS, SCENE_DECORATIONS);
        for (var slotKey in allCategories) {
            if (allCategories.hasOwnProperty(slotKey)) {
                var slot = allCategories[slotKey];
                if (slot.items) {
                    for (var i = 0; i < slot.items.length; i++) {
                        if (slot.items[i].id === assetId) {
                            if (slot.items[i].unlocked) {
                                return true;
                            }
                            if (slot.items[i].unlockLevel && typeof CultivationData !== 'undefined' && CultivationData.getLevel) {
                                return CultivationData.getLevel() >= slot.items[i].unlockLevel;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    function getEquippedAsset(slot) {
        if (typeof CultivationData !== 'undefined' && CultivationData.getEquippedAsset) {
            return CultivationData.getEquippedAsset(slot);
        }
        return null;
    }

    function equipAsset(slot, assetId) {
        if (typeof CultivationData !== 'undefined' && CultivationData.equipAsset) {
            var result = CultivationData.equipAsset(slot, assetId);
            if (result) {
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('asset:equipped', { slot: slot, assetId: assetId });
                }
                applyAssetToSprite(slot, assetId);
            }
            return result;
        }
        return false;
    }

    function applyAssetToSprite(slot, assetId) {
        if (typeof Nian3DSprite === 'undefined') return;
        
        var asset = findAssetById(assetId);
        if (!asset) return;

        if (slot === 'bulb_color' && asset.color) {
            if (window.__nianSprite && typeof window.__nianSprite.setBulbColor === 'function') {
                window.__nianSprite.setBulbColor(asset.color);
            }
        }
    }

    function findAssetById(assetId) {
        var allCategories = Object.assign({}, CHARACTER_ASSETS, SCENE_DECORATIONS);
        for (var slotKey in allCategories) {
            if (allCategories.hasOwnProperty(slotKey)) {
                var slot = allCategories[slotKey];
                if (slot.items) {
                    for (var i = 0; i < slot.items.length; i++) {
                        if (slot.items[i].id === assetId) {
                            return slot.items[i];
                        }
                    }
                }
            }
        }
        return null;
    }

    function getCategoryItems() {
        return currentCategory === 'character' ? CHARACTER_ASSETS : SCENE_DECORATIONS;
    }

    function getSlotList() {
        var items = getCategoryItems();
        var slots = [];
        for (var key in items) {
            if (items.hasOwnProperty(key)) {
                slots.push({ key: key, name: items[key].name });
            }
        }
        return slots;
    }

    function getCurrentSlotItems() {
        var items = getCategoryItems();
        return items[currentSlot] ? items[currentSlot].items || [] : [];
    }

    function buildModalHTML() {
        var slots = getSlotList();
        var slotItems = getCurrentSlotItems();
        var equipped = getEquippedAsset(currentSlot);

        var slotsHtml = slots.map(function(slot) {
            return `<div class="asset-slot-tab ${slot.key === currentSlot ? 'active' : ''}" data-slot="${slot.key}">${slot.name}</div>`;
        }).join('');

        var itemsHtml = slotItems.map(function(item) {
            var unlocked = isAssetUnlocked(item.id);
            var isEquipped = equipped === item.id;
            var rarityConfig = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            var itemIcon = item.icon || '🎁';
            var itemDisplay = item.color ? 
                `<div class="asset-color-preview" style="background: ${item.color};"></div>` : 
                `<span class="asset-item-icon">${itemIcon}</span>`;

            return `
                <div class="asset-item ${unlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''} ${item.rarity || 'common'}" 
                     data-asset-id="${item.id}">
                    <div class="asset-item-preview" style="background: ${rarityConfig.bg};">
                        ${itemDisplay}
                        ${isEquipped ? '<div class="asset-equipped-badge">已装备</div>' : ''}
                        ${!unlocked ? '<div class="asset-lock-icon">🔒</div>' : ''}
                    </div>
                    <div class="asset-item-name">${unlocked ? item.name : '???'}</div>
                    <div class="asset-item-rarity" style="color: ${rarityConfig.color};">${rarityConfig.name}</div>
                    ${!unlocked && item.unlockLevel ? `<div class="asset-item-unlock">Lv.${item.unlockLevel}解锁</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="asset-modal" id="asset-modal">
                <div class="asset-content">
                    <div class="asset-header">
                        <div class="asset-title">
                            <span class="asset-title-icon">✨</span>
                            资产装扮
                        </div>
                        <button class="asset-close" id="asset-close-btn" aria-label="关闭">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div class="asset-category-tabs">
                        <div class="asset-category-tab ${currentCategory === 'character' ? 'active' : ''}" data-category="character">
                            <span>🧑</span> 角色外观
                        </div>
                        <div class="asset-category-tab ${currentCategory === 'decoration' ? 'active' : ''}" data-category="decoration">
                            <span>🎨</span> 场景装饰
                        </div>
                    </div>

                    <div class="asset-slot-tabs">
                        ${slotsHtml}
                    </div>

                    <div class="asset-preview-section">
                        <div class="asset-preview-title">当前装扮</div>
                        <div class="asset-current-equipped" id="asset-current-equipped">
                            ${renderCurrentEquipped()}
                        </div>
                    </div>

                    <div class="asset-items-title">可选${getCategoryItems()[currentSlot] ? getCategoryItems()[currentSlot].name : ''}</div>
                    <div class="asset-items-grid" id="asset-items-grid">
                        ${itemsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function renderCurrentEquipped() {
        var categoryItems = getCategoryItems();
        var html = '<div class="equipped-slots">';
        
        for (var slotKey in categoryItems) {
            if (categoryItems.hasOwnProperty(slotKey)) {
                var slot = categoryItems[slotKey];
                var equippedId = getEquippedAsset(slotKey);
                var equippedItem = null;
                
                if (slot.items) {
                    for (var i = 0; i < slot.items.length; i++) {
                        if (slot.items[i].id === equippedId) {
                            equippedItem = slot.items[i];
                            break;
                        }
                    }
                }
                
                var displayContent = '—';
                if (equippedItem) {
                    if (equippedItem.color) {
                        displayContent = `<div class="equipped-color-dot" style="background: ${equippedItem.color};"></div>`;
                    } else if (equippedItem.icon) {
                        displayContent = equippedItem.icon;
                    } else {
                        displayContent = equippedItem.name;
                    }
                }

                html += `
                    <div class="equipped-slot-item">
                        <div class="equipped-slot-name">${slot.name}</div>
                        <div class="equipped-slot-value">${displayContent}</div>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        return html;
    }

    function refreshContent() {
        if (!modalElement) return;

        var slotsContainer = modalElement.querySelector('.asset-slot-tabs');
        if (slotsContainer) {
            var slots = getSlotList();
            slotsContainer.innerHTML = slots.map(function(slot) {
                return `<div class="asset-slot-tab ${slot.key === currentSlot ? 'active' : ''}" data-slot="${slot.key}">${slot.name}</div>`;
            }).join('');
            bindSlotEvents(slotsContainer);
        }

        var itemsGrid = modalElement.querySelector('#asset-items-grid');
        if (itemsGrid) {
            var slotItems = getCurrentSlotItems();
            var equipped = getEquippedAsset(currentSlot);
            
            itemsGrid.innerHTML = slotItems.map(function(item) {
                var unlocked = isAssetUnlocked(item.id);
                var isEquipped = equipped === item.id;
                var rarityConfig = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                var itemIcon = item.icon || '🎁';
                var itemDisplay = item.color ? 
                    `<div class="asset-color-preview" style="background: ${item.color};"></div>` : 
                    `<span class="asset-item-icon">${itemIcon}</span>`;

                return `
                    <div class="asset-item ${unlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''} ${item.rarity || 'common'}" 
                         data-asset-id="${item.id}">
                        <div class="asset-item-preview" style="background: ${rarityConfig.bg};">
                            ${itemDisplay}
                            ${isEquipped ? '<div class="asset-equipped-badge">已装备</div>' : ''}
                            ${!unlocked ? '<div class="asset-lock-icon">🔒</div>' : ''}
                        </div>
                        <div class="asset-item-name">${unlocked ? item.name : '???'}</div>
                        <div class="asset-item-rarity" style="color: ${rarityConfig.color};">${rarityConfig.name}</div>
                        ${!unlocked && item.unlockLevel ? `<div class="asset-item-unlock">Lv.${item.unlockLevel}解锁</div>` : ''}
                    </div>
                `;
            }).join('');
            
            bindItemEvents(itemsGrid);
        }

        var titleEl = modalElement.querySelector('.asset-items-title');
        if (titleEl && getCategoryItems()[currentSlot]) {
            titleEl.textContent = '可选' + getCategoryItems()[currentSlot].name;
        }

        var equippedSection = modalElement.querySelector('#asset-current-equipped');
        if (equippedSection) {
            equippedSection.innerHTML = renderCurrentEquipped();
        }
    }

    function bindSlotEvents(container) {
        if (!container) return;
        var tabs = container.querySelectorAll('.asset-slot-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function() {
                var slot = this.getAttribute('data-slot');
                if (slot && slot !== currentSlot) {
                    currentSlot = slot;
                    
                    var allTabs = container.querySelectorAll('.asset-slot-tab');
                    for (var j = 0; j < allTabs.length; j++) {
                        allTabs[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    refreshContent();
                }
            });
        }
    }

    function bindItemEvents(container) {
        if (!container) return;
        var items = container.querySelectorAll('.asset-item.unlocked');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function() {
                var assetId = this.getAttribute('data-asset-id');
                if (assetId) {
                    handleAssetClick(assetId);
                }
            });
        }
    }

    function handleAssetClick(assetId) {
        var asset = findAssetById(assetId);
        if (!asset) return;

        var equipped = getEquippedAsset(currentSlot);
        if (equipped === assetId) {
            showToast('该物品已装备');
            return;
        }

        var result = equipAsset(currentSlot, assetId);
        if (result) {
            showToast('✨ 装备成功：' + asset.name);
            refreshContent();
        }
    }

    function showToast(message) {
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(message);
        } else {
            console.log('[AssetSystem]', message);
        }
    }

    function ensureModal() {
        if (modalElement) return;

        modalElement = document.createElement('div');
        modalElement.innerHTML = buildModalHTML();
        document.body.appendChild(modalElement.firstElementChild);
        modalElement = document.getElementById('asset-modal');

        bindEvents();
    }

    function bindEvents() {
        if (!modalElement) return;

        var closeBtn = modalElement.querySelector('#asset-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }

        var categoryTabs = modalElement.querySelectorAll('.asset-category-tab');
        for (var i = 0; i < categoryTabs.length; i++) {
            categoryTabs[i].addEventListener('click', function() {
                var category = this.getAttribute('data-category');
                if (category && category !== currentCategory) {
                    currentCategory = category;
                    
                    var allCatTabs = modalElement.querySelectorAll('.asset-category-tab');
                    for (var j = 0; j < allCatTabs.length; j++) {
                        allCatTabs[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    
                    var slots = getSlotList();
                    if (slots.length > 0) {
                        currentSlot = slots[0].key;
                    }
                    
                    refreshContent();
                }
            });
        }

        bindSlotEvents(modalElement.querySelector('.asset-slot-tabs'));
        bindItemEvents(modalElement.querySelector('#asset-items-grid'));

        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                hide();
            }
        });
    }

    function show() {
        ensureModal();
        if (!modalElement) return;

        refreshContent();

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
        var assetBtns = document.querySelectorAll('[data-action="assets"]');
        for (var i = 0; i < assetBtns.length; i++) {
            assetBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                show();
            });
        }

        if (typeof EventBus !== 'undefined' && EventBus.EVENTS) {
            if (EventBus.EVENTS.LEVEL_UP) {
                EventBus.on(EventBus.EVENTS.LEVEL_UP, function(data) {
                    checkLevelUnlocks(data && data.newLevel ? data.newLevel : null);
                });
            }
        }
    }

    function checkLevelUnlocks(newLevel) {
        if (!newLevel) return;
        
        var allCategories = Object.assign({}, CHARACTER_ASSETS, SCENE_DECORATIONS);
        var unlockedAssets = [];
        
        for (var slotKey in allCategories) {
            if (allCategories.hasOwnProperty(slotKey)) {
                var slot = allCategories[slotKey];
                if (slot.items) {
                    for (var i = 0; i < slot.items.length; i++) {
                        var item = slot.items[i];
                        if (item.unlockLevel && item.unlockLevel === newLevel) {
                            if (typeof CultivationData !== 'undefined' && CultivationData.unlockAsset) {
                                CultivationData.unlockAsset(item.id, item);
                            }
                            unlockedAssets.push(item);
                        }
                    }
                }
            }
        }

        if (unlockedAssets.length > 0) {
            console.log('[AssetSystem] Unlocked new assets at level', newLevel, ':', unlockedAssets);
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
        refresh: function() {
            if (modalElement && modalElement.classList.contains('active')) {
                refreshContent();
            }
        },
        isAssetUnlocked: isAssetUnlocked,
        getEquippedAsset: getEquippedAsset,
        equipAsset: equipAsset,
        getAllAssets: getAllAssets,
        findAssetById: findAssetById
    };
})();
