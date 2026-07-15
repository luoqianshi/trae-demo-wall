/**
 * Tom孤岛生存 - 合成系统
 * 负责管理合成配方定义、合成逻辑、以及合成相关的功能
 */

(function() {

const gameManager = window.gameManager;
const { RECIPES, RESOURCE_TYPES } = window.Constants;

class CraftingSystem {
    constructor() {
        // 配方表（从常量导入，可动态扩展）
        this._recipes = { ...RECIPES };

        // 事件回调
        this._eventListeners = {
            craft: [],       // 合成成功
            craftFail: []    // 合成失败
        };

        // 已解锁的配方（默认全部解锁，可扩展为逐步解锁）
        this._unlockedRecipes = new Set(Object.keys(RECIPES));
    }

    /**
     * 重置合成系统
     */
    reset() {
        this._unlockedRecipes = new Set(Object.keys(this._recipes));
    }

    /**
     * 检查是否可以合成指定配方
     * @param {string} recipeId - 配方ID
     * @param {Object} inventory - 背包物品字典
     * @returns {boolean}
     */
    canCraft(recipeId, inventory) {
        const recipe = this._recipes[recipeId];
        if (!recipe) return false;

        // 检查是否已解锁
        if (!this._unlockedRecipes.has(recipeId)) return false;

        // 检查材料是否足够
        for (const [item, required] of Object.entries(recipe.ingredients)) {
            const have = inventory[item] || 0;
            if (have < required) {
                return false;
            }
        }

        return true;
    }

    /**
     * 执行合成
     * @param {string} recipeId - 配方ID
     * @param {Object} inventory - 背包物品字典
     * @returns {boolean} 是否合成成功
     */
    craft(recipeId, inventory) {
        // 检查是否可以合成
        if (!this.canCraft(recipeId, inventory)) {
            this._emit('craftFail', { recipeId, reason: 'insufficient_materials' });
            return false;
        }

        const recipe = this._recipes[recipeId];

        // 消耗材料
        for (const [item, required] of Object.entries(recipe.ingredients)) {
            inventory[item] -= required;
            if (inventory[item] <= 0) {
                delete inventory[item];
            }
        }

        // 添加产物
        const resultItem = recipe.result;
        const resultCount = recipe.resultCount || 1;
        inventory[resultItem] = (inventory[resultItem] || 0) + resultCount;

        // 更新统计数据
        gameManager.addItemCrafted(resultCount);

        // 如果是建筑类，增加建筑统计
        if (recipe.category === 'building') {
            gameManager.addBuildingBuilt(resultCount);
        }

        // 触发合成成功事件
        this._emit('craft', {
            recipeId,
            recipe,
            resultItem,
            resultCount
        });

        return true;
    }

    /**
     * 获取所有配方ID
     * @returns {string[]}
     */
    getAllRecipeIds() {
        return Object.keys(this._recipes);
    }

    /**
     * 获取已解锁的配方ID列表
     * @returns {string[]}
     */
    getUnlockedRecipeIds() {
        return Array.from(this._unlockedRecipes);
    }

    /**
     * 获取指定配方详情
     * @param {string} recipeId
     * @returns {Object|null}
     */
    getRecipe(recipeId) {
        return this._recipes[recipeId] || null;
    }

    /**
     * 按分类获取配方
     * @param {string} category - 分类名（tool / building 等）
     * @returns {string[]}
     */
    getRecipesByCategory(category) {
        return Object.entries(this._recipes)
            .filter(([id, recipe]) => recipe.category === category)
            .map(([id]) => id);
    }

    /**
     * 获取所有分类
     * @returns {string[]}
     */
    getAllCategories() {
        const categories = new Set();
        Object.values(this._recipes).forEach(recipe => {
            if (recipe.category) {
                categories.add(recipe.category);
            }
        });
        return Array.from(categories);
    }

    /**
     * 解锁配方
     * @param {string} recipeId
     * @returns {boolean} 是否成功解锁
     */
    unlockRecipe(recipeId) {
        if (!this._recipes[recipeId]) return false;
        if (this._unlockedRecipes.has(recipeId)) return false;

        this._unlockedRecipes.add(recipeId);
        this._emit('recipeUnlocked', { recipeId, recipe: this._recipes[recipeId] });
        return true;
    }

    /**
     * 检查配方是否已解锁
     * @param {string} recipeId
     * @returns {boolean}
     */
    isRecipeUnlocked(recipeId) {
        return this._unlockedRecipes.has(recipeId);
    }

    /**
     * 添加自定义配方
     * @param {string} recipeId
     * @param {Object} recipeData - 配方数据
     * @param {boolean} unlocked - 是否默认解锁
     */
    addRecipe(recipeId, recipeData, unlocked = true) {
        this._recipes[recipeId] = { id: recipeId, ...recipeData };
        if (unlocked) {
            this._unlockedRecipes.add(recipeId);
        }
    }

    /**
     * 获取可合成的配方列表
     * @param {Object} inventory - 背包物品
     * @returns {string[]} 可合成的配方ID数组
     */
    getCraftableRecipes(inventory) {
        return this.getUnlockedRecipeIds().filter(recipeId =>
            this.canCraft(recipeId, inventory)
        );
    }

    /**
     * 检查某物品缺少哪些材料
     * @param {string} recipeId
     * @param {Object} inventory
     * @returns {Object} 缺少的材料 { item: missingCount }
     */
    getMissingMaterials(recipeId, inventory) {
        const recipe = this._recipes[recipeId];
        if (!recipe) return {};

        const missing = {};
        for (const [item, required] of Object.entries(recipe.ingredients)) {
            const have = inventory[item] || 0;
            if (have < required) {
                missing[item] = required - have;
            }
        }
        return missing;
    }

    // ==================== 事件系统 ====================

    /**
     * 注册事件监听
     * @param {string} eventName - 事件名：craft, craftFail, recipeUnlocked
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        if (this._eventListeners[eventName]) {
            this._eventListeners[eventName].push(callback);
        }
    }

    /**
     * 移除事件监听
     * @param {string} eventName
     * @param {Function} callback
     */
    off(eventName, callback) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventName
     * @param {*} data
     * @private
     */
    _emit(eventName, data) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`CraftingSystem 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

// 全局单例
window.craftingSystem = new CraftingSystem();

})();
