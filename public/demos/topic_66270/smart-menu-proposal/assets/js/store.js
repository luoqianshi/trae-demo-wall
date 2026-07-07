/**
 * store.js — 全局状态管理与本地持久化
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.store（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用（依赖 localStorage）
 *
 * 职责：
 *  1) 维护全局 state（家庭成员 / 冰箱 / 适老化 / AI模式 / 当前菜单 / 采购清单）
 *  2) 自动读写 localStorage 做持久化
 *  3) 提供发布-订阅（subscribe/notify）供 UI 层监听变化
 *  4) 提供家庭成员、冰箱食材、菜单、采购清单的增删改查便捷方法
 *
 * 数据结构说明：
 *  state.family[]    : 家庭成员档案数组
 *  state.fridge[]    : 冰箱食材条目数组（引用 ingredientId + 数量）
 *  state.currentMenu : 当前生成的菜单方案
 *  state.currentShoppingList : 当前采购清单
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.store = (function () {
    'use strict';

    /* ============ 常量 ============ */
    var STORAGE_KEY = 'smart_menu_data';   // localStorage 存储键
    var SCHEMA_VERSION = 1;                // 数据结构版本号，便于后续升级迁移

    /* ============ 初始默认 state ============ */
    function defaultState() {
        return {
            version: SCHEMA_VERSION,
            family: [],              // 家庭成员档案
            fridge: [],              // 冰箱食材条目
            elderlyMode: false,      // 是否开启适老化大字模式
            aiMode: 'local',         // AI 模式：local(本地规则) / cloud(云端)
            currentMenu: null,       // 当前菜单方案
            currentShoppingList: null // 当前采购清单
        };
    }

    /* ============ 运行时状态 ============ */
    var state = defaultState();

    /* ============ 监听器列表（发布-订阅） ============ */
    var listeners = [];

    /* ============ ID 生成工具 ============ */
    // 生成唯一 ID，前缀区分类型，避免不同实体 ID 冲突
    function genId(prefix) {
        return prefix + '_' + Date.now().toString(36) + '_' +
            Math.floor(Math.random() * 10000).toString(36);
    }

    /* ============ 持久化：读 ============ */
    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                // 合并默认值，避免旧数据缺少新字段时出错
                state = mergeState(defaultState(), parsed);
            }
        } catch (e) {
            // 读取失败（如禁用 localStorage / 数据损坏）时回退到默认 state
            state = defaultState();
        }
        return state;
    }

    /* ============ 持久化：写 ============ */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // 容量超限或隐私模式下静默失败，不影响运行
        }
    }

    // 浅合并工具：用 source 覆盖 base 的同名字段
    function mergeState(base, source) {
        var out = {};
        var k;
        for (k in base) { if (base.hasOwnProperty(k)) out[k] = base[k]; }
        if (source) {
            for (k in source) {
                if (source.hasOwnProperty(k)) out[k] = source[k];
            }
        }
        return out;
    }

    /* ============ 通用 get / set ============ */
    // get(key?) ：传 key 取单个字段，不传取整份 state
    function get(key) {
        return key ? state[key] : state;
    }

    // set(key, val) ：设置单个字段并持久化+通知
    function set(key, val) {
        state[key] = val;
        save();
        notify();
    }

    /* ============ 发布-订阅 ============ */
    function subscribe(fn) {
        if (typeof fn === 'function' && listeners.indexOf(fn) === -1) {
            listeners.push(fn);
        }
        // 返回取消订阅函数
        return function unsubscribe() {
            var i = listeners.indexOf(fn);
            if (i > -1) listeners.splice(i, 1);
        };
    }

    function notify() {
        // 复制一份遍历，避免回调中再次增删监听器导致索引错乱
        listeners.slice().forEach(function (fn) {
            try { fn(state); } catch (e) { /* 单个监听器异常不影响其余 */ }
        });
    }

    /* ============ 重置 ============ */
    function reset() {
        state = defaultState();
        save();
        notify();
    }

    /* ============ 家庭成员管理 ============ */
    // addMember(member) ：新增成员，自动补 id/createdAt
    function addMember(member) {
        member = member || {};
        if (!member.id) member.id = genId('m');
        member.createdAt = member.createdAt || Date.now();
        state.family.push(member);
        save();
        notify();
        return member;
    }

    // updateMember(id, patch) ：按 id 局部更新成员字段
    function updateMember(id, patch) {
        var m = findMember(id);
        if (m) {
            // 禁止修改 id 本身
            patch = patch || {};
            if (patch.hasOwnProperty('id')) delete patch.id;
            Object.assign(m, patch);
            m.updatedAt = Date.now();
            save();
            notify();
        }
        return m;
    }

    // removeMember(id) ：按 id 删除成员，返回是否删除成功
    function removeMember(id) {
        var i = indexOfMember(id);
        if (i > -1) {
            state.family.splice(i, 1);
            save();
            notify();
            return true;
        }
        return false;
    }

    // findMember(id) ：按 id 查找成员
    function findMember(id) {
        for (var i = 0; i < state.family.length; i++) {
            if (state.family[i].id === id) return state.family[i];
        }
        return null;
    }

    function indexOfMember(id) {
        for (var i = 0; i < state.family.length; i++) {
            if (state.family[i].id === id) return i;
        }
        return -1;
    }

    /* ============ 冰箱食材管理 ============ */
    // 冰箱条目结构：{ id, ingredientId, amount, addedAt, note }
    // addFridgeItem(ingredientId, amount) ：新增一条冰箱食材
    function addFridgeItem(ingredientId, amount) {
        var item = {
            id: genId('f'),
            ingredientId: ingredientId,
            amount: (amount === undefined ? 1 : amount),
            addedAt: Date.now(),
            note: ''
        };
        state.fridge.push(item);
        save();
        notify();
        return item;
    }

    // updateFridgeItem(id, patch) ：按条目 id 局部更新（如改数量/备注）
    function updateFridgeItem(id, patch) {
        var it = findFridgeItem(id);
        if (it) {
            patch = patch || {};
            if (patch.hasOwnProperty('id')) delete patch.id;
            Object.assign(it, patch);
            it.updatedAt = Date.now();
            save();
            notify();
        }
        return it;
    }

    // removeFridgeItem(id) ：按条目 id 删除
    function removeFridgeItem(id) {
        var i = indexOfFridgeItem(id);
        if (i > -1) {
            state.fridge.splice(i, 1);
            save();
            notify();
            return true;
        }
        return false;
    }

    // findFridgeItem(id) ：按条目 id 查找
    function findFridgeItem(id) {
        for (var i = 0; i < state.fridge.length; i++) {
            if (state.fridge[i].id === id) return state.fridge[i];
        }
        return null;
    }

    function indexOfFridgeItem(id) {
        for (var i = 0; i < state.fridge.length; i++) {
            if (state.fridge[i].id === id) return i;
        }
        return -1;
    }

    // getFridgeByIngredient(ingredientId) ：按食材 id 聚合该食材的库存总量
    // 同一食材可能录入多条，这里返回总和
    function getFridgeByIngredient(ingredientId) {
        var total = 0;
        for (var i = 0; i < state.fridge.length; i++) {
            if (state.fridge[i].ingredientId === ingredientId) {
                total += Number(state.fridge[i].amount) || 0;
            }
        }
        return total;
    }

    /* ============ 菜单 & 采购清单 ============ */
    // setMenu(menu) ：保存当前生成的菜单方案
    function setMenu(menu) {
        state.currentMenu = menu;
        save();
        notify();
        return menu;
    }

    // setShoppingList(list) ：保存当前采购清单
    function setShoppingList(list) {
        state.currentShoppingList = list;
        save();
        notify();
        return list;
    }

    /* ============ 批量导入（用于"导入示例家庭/示例冰箱"） ============ */
    // loadSample(sample) ：将示例数据整体灌入 state（覆盖 family/fridge）
    function loadSample(sample) {
        sample = sample || {};
        if (sample.family) state.family = sample.family.slice();
        if (sample.fridge) state.fridge = sample.fridge.slice();
        save();
        notify();
    }

    /* ============ 对外暴露 ============ */
    return {
        // 持久化与基础
        load: load,
        save: save,
        get: get,
        set: set,
        reset: reset,
        getState: function () { return state; },
        // 订阅
        subscribe: subscribe,
        notify: notify,
        // 家庭成员
        addMember: addMember,
        updateMember: updateMember,
        removeMember: removeMember,
        findMember: findMember,
        // 冰箱食材
        addFridgeItem: addFridgeItem,
        updateFridgeItem: updateFridgeItem,
        removeFridgeItem: removeFridgeItem,
        findFridgeItem: findFridgeItem,
        getFridgeByIngredient: getFridgeByIngredient,
        // 菜单与采购清单
        setMenu: setMenu,
        setShoppingList: setShoppingList,
        // 批量导入
        loadSample: loadSample
    };
})();
