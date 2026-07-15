/**
 * 游戏 HUD 类
 * 使用 HTML 中已有的 DOM 元素
 * 显示时间、生存数值进度条、背包列表、合成按钮
 */

(function() {

class HUD {
    constructor() {
        this.hudEl = null;
        this.dayText = null;
        this.timeText = null;
        this.diffText = null;
        this.hungerFill = null;
        this.thirstFill = null;
        this.energyFill = null;
        this.inventoryList = null;
        this.craftingList = null;
        this.bottomHint = null;
        this.visible = false;

        this.itemNames = {
            branch: '树枝',
            wood: '木块',
            stone: '石头',
            fruit: '野果',
            berry: '浆果',
            mushroom: '蘑菇',
            coconut: '椰子',
            plastic_bottle: '塑料瓶',
            rope: '绳子',
            tire: '轮胎',
            cloth: '布料',
            axe: '石斧',
            knife: '石刀',
            hammer: '石锤',
            campfire: '火堆',
            bed: '木床',
            shelter: '庇护所',
            storage: '储物箱'
        };

        this.itemIcons = {
            branch: '🪵',
            wood: '🪓',
            stone: '🪨',
            fruit: '🍎',
            berry: '🫐',
            mushroom: '🍄',
            coconut: '🥥',
            plastic_bottle: '🧴',
            rope: '🪢',
            tire: '🛞',
            cloth: '🧵',
            axe: '🪓',
            knife: '🔪',
            hammer: '🔨',
            campfire: '🔥',
            bed: '🛏️',
            shelter: '🏠',
            storage: '📦'
        };

        this._setupUI();
        this._setupEventDelegation();
    }

    _setupUI() {
        this.hudEl = document.getElementById('hud');
        this.dayText = document.getElementById('day-text');
        this.timeText = document.getElementById('time-text');
        this.diffText = document.getElementById('diff-text');
        this.hungerFill = document.getElementById('hunger-fill');
        this.thirstFill = document.getElementById('thirst-fill');
        this.energyFill = document.getElementById('energy-fill');
        this.inventoryList = document.getElementById('inventory-list');
        this.craftingList = document.getElementById('crafting-list');
        this.bottomHint = document.getElementById('bottom-hint');
    }

    _setupEventDelegation() {
        if (this.inventoryList) {
            this.inventoryList.addEventListener('click', (e) => {
                const li = e.target.closest('.inventory-item');
                if (li && li.classList.contains('clickable')) {
                    const useBtn = li.querySelector('.use-btn');
                    if (useBtn) {
                        const itemName = li.querySelector('.item-name').textContent.trim();
                        const itemId = this._getItemIdByName(itemName);
                        if (itemId) {
                            this._useFood(itemId);
                        }
                    }
                }
            });
        }

        if (this.craftingList) {
            this.craftingList.addEventListener('click', (e) => {
                const btn = e.target.closest('.craft-btn');
                if (btn && !btn.classList.contains('disabled')) {
                    const craftName = btn.querySelector('.craft-name').textContent.trim();
                    const recipeId = this._getRecipeIdByName(craftName);
                    if (recipeId) {
                        this._craftItem(recipeId);
                    }
                }
            });
        }
    }

    _getItemIdByName(name) {
        for (const [id, itemName] of Object.entries(this.itemNames)) {
            if (itemName === name) return id;
        }
        return null;
    }

    _getRecipeIdByName(name) {
        if (typeof craftingSystem !== 'undefined') {
            const recipes = craftingSystem.getAllRecipeIds();
            for (const id of recipes) {
                const recipe = craftingSystem.getRecipe(id);
                if (recipe && recipe.name === name) return id;
            }
        }
        return null;
    }

    show() {
        if (this.hudEl) {
            this.hudEl.classList.remove('hidden');
            this.visible = true;
        }
    }

    hide() {
        if (this.hudEl) {
            this.hudEl.classList.add('hidden');
            this.visible = false;
        }
    }

    update() {
        if (!this.visible) return;

        this._updateTime();
        this._updateStats();
        this._updateInventory();
        this._updateCrafting();
    }

    _updateTime() {
        if (typeof timeSystem !== 'undefined') {
            if (this.dayText) {
                this.dayText.textContent = `第 ${timeSystem.getDayNumber()} 天`;
            }
            if (this.timeText) {
                const hour = Math.floor(timeSystem.getHourOfDay());
                const minute = timeSystem.getMinuteOfHour();
                this.timeText.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            }
        }

        if (gameManager && gameManager.difficulty && this.diffText) {
            const diffNames = { easy: '简单', normal: '普通', hard: '困难' };
            this.diffText.textContent = diffNames[gameManager.difficulty] || '普通';
        }
    }

    _updateStats() {
        const player = this._getPlayer();
        if (!player || !player.stats) return;

        const stats = player.stats;

        this._updateStatBar(this.hungerFill, stats.hunger);
        this._updateStatBar(this.thirstFill, stats.thirst);
        this._updateStatBar(this.energyFill, stats.energy);
    }

    _updateStatBar(fillEl, value) {
        if (!fillEl) return;
        const clampedValue = Math.max(0, Math.min(100, value));
        fillEl.style.width = `${clampedValue}%`;

        if (clampedValue < 20) {
            fillEl.classList.add('critical');
            fillEl.classList.remove('warning');
        } else if (clampedValue < 40) {
            fillEl.classList.add('warning');
            fillEl.classList.remove('critical');
        } else {
            fillEl.classList.remove('critical', 'warning');
        }
    }

    _updateInventory() {
        const player = this._getPlayer();
        if (!player || !player.inventory || !this.inventoryList) return;

        const inventory = player.inventory;

        this.inventoryList.innerHTML = '';

        const items = Object.entries(inventory);

        if (items.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'empty-hint';
            emptyLi.textContent = '暂无物品';
            this.inventoryList.appendChild(emptyLi);
            return;
        }

        items.forEach(([itemId, count]) => {
            const li = document.createElement('li');
            li.className = 'inventory-item';

            const icon = this.itemIcons[itemId] || '📦';
            const name = this.itemNames[itemId] || itemId;

            let useBtn = '';
            let titleText = '';
            if (this._isFood(itemId)) {
                useBtn = '<span class="use-btn">✓</span>';
                const values = this._getFoodValues(itemId);
                let effects = [];
                if (values.hunger > 0) effects.push(`饱食+${values.hunger}`);
                if (values.thirst > 0) effects.push(`水分+${values.thirst}`);
                if (values.energy > 0) effects.push(`体力+${values.energy}`);
                titleText = `点击食用：${effects.join(', ')}`;
            }

            li.innerHTML = `
                <span class="item-icon">${icon}</span>
                <span class="item-name">${name}</span>
                <span class="item-count">x ${count}</span>
                ${useBtn}
            `;

            if (this._isFood(itemId)) {
                li.classList.add('clickable');
                li.title = titleText;
            }

            this.inventoryList.appendChild(li);
        });
    }

    _updateCrafting() {
        if (typeof craftingSystem === 'undefined' || !this.craftingList) return;

        const player = this._getPlayer();
        if (!player || !player.inventory) return;

        const recipes = craftingSystem.getAllRecipeIds();

        this.craftingList.innerHTML = '';

        recipes.forEach(recipeId => {
            const recipe = craftingSystem.getRecipe(recipeId);
            if (!recipe) return;

            const canCraft = craftingSystem.canCraft(recipeId, player.inventory);

            const btn = document.createElement('button');
            btn.className = 'craft-btn' + (canCraft ? '' : ' disabled');
            btn.title = recipe.description;

            let ingredientsHtml = '';
            for (const [item, amount] of Object.entries(recipe.ingredients)) {
                const hasEnough = player.inventory[item] && player.inventory[item] >= amount;
                const itemIcon = this.itemIcons[item] || '📦';
                ingredientsHtml += `<span class="ingredient ${hasEnough ? '' : 'lack'}">${itemIcon}${amount}</span>`;
            }

            btn.innerHTML = `
                <span class="craft-name">${recipe.name}</span>
                <span class="craft-ingredients">${ingredientsHtml}</span>
            `;

            this.craftingList.appendChild(btn);
        });
    }

    _useFood(itemId) {
        if (typeof survivalSystem !== 'undefined') {
            const success = survivalSystem.consume(itemId);
            if (success) {
                const name = this.itemNames[itemId] || itemId;
                const values = this._getFoodValues(itemId);
                let effects = [];
                if (values.hunger > 0) effects.push(`饱食+${values.hunger}`);
                if (values.thirst > 0) effects.push(`水分+${values.thirst}`);
                if (values.energy > 0) effects.push(`体力+${values.energy}`);
                this.showHint(`食用了 ${name} ${effects.join(' ')}`, 2000);
            }
        }
    }

    _getFoodValues(itemId) {
        if (typeof window.Constants !== 'undefined' && window.Constants.FOOD_VALUES) {
            return window.Constants.FOOD_VALUES[itemId] || { hunger: 0, thirst: 0, energy: 0 };
        }
        return { hunger: 0, thirst: 0, energy: 0 };
    }

    _craftItem(recipeId) {
        const player = this._getPlayer();
        if (!player || !player.inventory) return;

        if (typeof craftingSystem !== 'undefined') {
            const recipe = craftingSystem.getRecipe(recipeId);
            const success = craftingSystem.craft(recipeId, player.inventory);
            if (success && recipe) {
                const count = recipe.resultCount || 1;
                this.showHint(`合成成功：${recipe.name} x${count}`, 2000);
            }
        }
    }

    _isFood(itemId) {
        const foods = ['fruit', 'berry', 'mushroom', 'coconut'];
        return foods.includes(itemId);
    }

    _getPlayer() {
        if (typeof gameManager !== 'undefined') {
            return gameManager.getPlayer();
        }
        return null;
    }

    showHint(message, duration = 3000) {
        if (!this.bottomHint) return;

        const originalText = this.bottomHint.textContent;
        this.bottomHint.textContent = message;
        this.bottomHint.classList.add('hint-active');

        setTimeout(() => {
            this.bottomHint.textContent = originalText;
            this.bottomHint.classList.remove('hint-active');
        }, duration);
    }

    getItemName(itemId) {
        return this.itemNames[itemId] || itemId;
    }

    getItemIcon(itemId) {
        return this.itemIcons[itemId] || '📦';
    }
}

window.HUD = HUD;

})();
