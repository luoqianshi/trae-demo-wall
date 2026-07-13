/* ============================================ */
/* storage.js - 本地存储封装                    */
/* 作用：统一管理 localStorage 的读写操作        */
/* 小白理解：把数据存在浏览器里，关闭再打开还在   */
/* ============================================ */

/**
 * AppStorage 对象：所有本地存储操作都通过它
 * 用法：AppStorage.set('key', value) / AppStorage.get('key')
 * 注意：不用 Storage 是因为浏览器有原生 Storage API，避免重名会冲突
 */
window.AppStorage = {

    /**
     * 保存数据到 localStorage
     * @param {string} key - 存储键名
     * @param {*} value - 要存储的值（会自动转成JSON）
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('存储失败:', e);
        }
    },

    /**
     * 从 localStorage 读取数据
     * @param {string} key - 存储键名
     * @returns {*} 读取到的值（自动从JSON转回），不存在则返回 null
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取失败:', e);
            return null;
        }
    },

    /**
     * 删除指定键的数据
     * @param {string} key - 要删除的键名
     */
    remove(key) {
        localStorage.removeItem(key);
    },

    /**
     * 清除所有数据（慎用！会清空所有存储）
     */
    clear() {
        localStorage.clear();
    },

    /* ======================================== */
    /* 以下是业务相关的存储方法                  */
    /* 封装好具体的 key，方便各模块调用          */
    /* ======================================== */

    /**
     * 获取已保存的行程景点
     * @returns {Array} 景点数组
     */
    getTrip() {
        return this.get('tripList') || [];
    },

    /**
     * 保存行程景点
     * @param {Array} list - 景点数组
     */
    setTrip(list) {
        this.set('tripList', list);
    },

    /**
     * 添加景点到行程
     * @param {object} scenic - 景点对象
     * @returns {boolean} 是否添加成功（重复添加返回false）
     */
    addToTrip(scenic) {
        const list = this.getTrip();
        // 检查是否已存在（根据景点名+城市判断重复）
        const exists = list.some(item => item.name === scenic.name && item.city === scenic.city);
        if (exists) {
            return false;  // 已存在，添加失败
        }
        // 添加时间戳和唯一ID
        scenic.id = Utils.generateId();
        scenic.addTime = Date.now();
        list.push(scenic);
        this.setTrip(list);
        return true;
    },

    /**
     * 从行程中移除景点
     * @param {string} id - 景点ID
     */
    removeFromTrip(id) {
        const list = this.getTrip();
        const newList = list.filter(item => item.id !== id);
        this.setTrip(newList);
    },

    /**
     * 更新行程中的某个景点信息
     * 小白理解：编辑行程项的名称、备注、自定义时间等
     * @param {string} id - 景点ID
     * @param {object} updates - 要更新的字段
     */
    updateTripItem(id, updates) {
        const list = this.getTrip();
        const idx = list.findIndex(item => item.id === id);
        if (idx === -1) return false;
        list[idx] = Object.assign({}, list[idx], updates);
        this.setTrip(list);
        return true;
    },

    /**
     * 移动行程项顺序（上移/下移）
     * 小白理解：调整行程中景点的先后顺序
     * @param {string} id - 要移动的景点ID
     * @param {number} direction - -1上移，1下移
     */
    moveTripItem(id, direction) {
        const list = this.getTrip();
        const idx = list.findIndex(item => item.id === id);
        if (idx === -1) return false;
        const target = idx + direction;
        // 边界检查
        if (target < 0 || target >= list.length) return false;
        // 交换位置
        const temp = list[idx];
        list[idx] = list[target];
        list[target] = temp;
        this.setTrip(list);
        return true;
    },

    /**
     * 在指定位置插入行程项
     * 小白理解：手动添加自定义行程项，可以指定插入位置
     * @param {object} item - 行程项
     * @param {number} [position] - 插入位置，不传则加到末尾
     */
    insertTripItem(item, position) {
        const list = this.getTrip();
        item.id = Utils.generateId();
        item.addTime = Date.now();
        item.custom = true;  // 标记为自定义项
        if (typeof position === 'number') {
            list.splice(position, 0, item);
        } else {
            list.push(item);
        }
        this.setTrip(list);
        return item.id;
    },

    /**
     * 获取收藏列表
     * @returns {Array} 收藏数组
     */
    getFavorites() {
        return this.get('favorites') || [];
    },

    /**
     * 添加/取消收藏（切换收藏状态）
     * @param {object} item - 收藏项
     * @param {string} type - 类型：scenic/food
     * @returns {boolean} 操作后的收藏状态（true=已收藏）
     */
    toggleFavorite(item, type) {
        const list = this.getFavorites();
        const index = list.findIndex(fav => fav.name === item.name && fav.type === type);
        if (index > -1) {
            // 已收藏，取消收藏
            list.splice(index, 1);
            this.set('favorites', list);
            return false;
        } else {
            // 未收藏，添加收藏
            item.type = type;
            item.favTime = Date.now();
            list.push(item);
            this.set('favorites', list);
            return true;
        }
    },

    /**
     * 检查是否已收藏
     * @param {string} name - 名称
     * @param {string} type - 类型
     * @returns {boolean} 是否已收藏
     */
    isFavorited(name, type) {
        const list = this.getFavorites();
        return list.some(fav => fav.name === name && fav.type === type);
    },

    /**
     * 获取搜索历史
     * @returns {Array} 搜索历史数组
     */
    getSearchHistory() {
        return this.get('searchHistory') || [];
    },

    /**
     * 添加搜索历史
     * @param {string} keyword - 搜索关键词
     */
    addSearchHistory(keyword) {
        let list = this.getSearchHistory();
        // 去重（已存在则移除旧的）
        list = list.filter(item => item !== keyword);
        // 添加到最前面
        list.unshift(keyword);
        // 只保留最近10条
        list = list.slice(0, 10);
        this.set('searchHistory', list);
    },

    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        this.remove('searchHistory');
    },

    /**
     * 获取浏览历史
     * @returns {Array} 浏览历史数组
     */
    getBrowseHistory() {
        return this.get('browseHistory') || [];
    },

    /**
     * 添加浏览历史
     * @param {object} item - 浏览项
     * @param {string} type - 类型：scenic/food
     */
    addBrowseHistory(item, type) {
        let list = this.getBrowseHistory();
        // 去重
        list = list.filter(h => !(h.name === item.name && h.type === type));
        // 添加到最前面
        item.type = type;
        item.browseTime = Date.now();
        list.unshift(item);
        // 只保留最近20条
        list = list.slice(0, 20);
        this.set('browseHistory', list);
    },

    /**
     * 获取智小程对话历史
     * @returns {Array} 对话历史数组
     */
    getChatHistory() {
        return this.get('chatHistory') || [];
    },

    /**
     * 保存智小程对话历史
     * @param {Array} history - 对话历史
     */
    setChatHistory(history) {
        this.set('chatHistory', history);
    },

    /**
     * 清除对话历史
     */
    clearChatHistory() {
        this.remove('chatHistory');
    },

    /* ======================================== */
    /* 出行方案相关存储                          */
    /* ======================================== */

    /**
     * 获取已保存的出行方案
     * @returns {object|null} 出行方案对象，没有则返回null
     */
    getTravelPlan() {
        return this.get('travelPlan') || null;
    },

    /**
     * 保存出行方案
     * @param {object} plan - 方案数据（包含stations、startDate、dailyPlans等）
     */
    saveTravelPlan(plan) {
        plan.saveTime = Date.now();
        this.set('travelPlan', plan);
    },

    /**
     * 清除已保存的出行方案
     */
    clearTravelPlan() {
        this.remove('travelPlan');
    },

    /* ======================================== */
    /* 旅程（Journey）相关存储                   */
    /* 小白理解："旅程"是用户的一次完整旅行计划，  */
    /*           包含出发地和想去的多个城市        */
    /* ======================================== */

    /**
     * 获取当前进行中的旅程
     * @returns {object|null} 当前旅程对象，没有则返回null
     */
    getActiveJourney() {
        return this.get('activeJourney') || null;
    },

    /**
     * 保存当前旅程（设为进行中）
     * @param {object} journey - 旅程对象
     */
    setActiveJourney(journey) {
        this.set('activeJourney', journey);
    },

    /**
     * 清除当前进行中的旅程（结束旅程时调用）
     */
    clearActiveJourney() {
        this.remove('activeJourney');
    },

    /**
     * 获取历史旅程列表（已结束的旅程记录）
     * @returns {Array} 历史旅程数组
     */
    getJourneyHistory() {
        return this.get('journeyHistory') || [];
    },

    /**
     * 添加一条历史旅程
     * @param {object} journey - 已结束的旅程对象
     */
    addJourneyHistory(journey) {
        let list = this.getJourneyHistory();
        list.push(journey);
        this.set('journeyHistory', list);
    },

    /**
     * 获取旅程总数（用于显示"第N次旅行"）
     * @returns {number} 旅程次数
     */
    getJourneyCount() {
        return this.get('journeyCount') || 0;
    },

    /**
     * 增加旅程计数
     */
    incrementJourneyCount() {
        const count = this.getJourneyCount() + 1;
        this.set('journeyCount', count);
        return count;
    },

    /**
     * 检查是否跳过了旅程引导
     * @returns {boolean} 是否跳过
     */
    getJourneySkipped() {
        return this.get('journeySkipped') === true;
    },

    /**
     * 设置跳过状态
     * @param {boolean} skipped - 是否跳过
     */
    setJourneySkipped(skipped) {
        this.set('journeySkipped', skipped);
    }
};
