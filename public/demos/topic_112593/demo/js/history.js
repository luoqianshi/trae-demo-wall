/* ==================== 历史记录管理 ==================== */
const History = {
    STORAGE_KEY: 'mingchen_shooting_history',

    // 获取当前用户的历史记录key
    _getStorageKey() {
        const userId = Auth ? Auth.getUserId() : 'default';
        return this.STORAGE_KEY + '_' + userId;
    },

    // 获取所有历史记录（按日期倒序，当前用户）
    getAll() {
        try {
            const data = localStorage.getItem(this._getStorageKey());
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取历史记录失败:', e);
            return [];
        }
    },

    // 保存一条训练记录（关联当前用户）
    save(session) {
        const records = this.getAll();
        session.userId = Auth ? Auth.getUserId() : 'default';
        records.unshift(session); // 新记录放在前面
        try {
            localStorage.setItem(this._getStorageKey(), JSON.stringify(records));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    },

    // 根据ID获取单条记录
    getById(id) {
        return this.getAll().find(r => r.id === id);
    },

    // 删除单条记录
    deleteById(id) {
        const records = this.getAll().filter(r => r.id !== id);
        localStorage.setItem(this._getStorageKey(), JSON.stringify(records));
    },

    // 清空所有记录
    clearAll() {
        localStorage.removeItem(this._getStorageKey());
    },

    // 筛选记录
    filter(records, options) {
        return records.filter(r => {
            // 靶纸类型筛选
            if (options.targetType !== undefined && options.targetType !== '') {
                if (String(r.targetTypeId) !== String(options.targetType)) return false;
            }
            // 时间范围筛选
            if (options.dateFrom) {
                const rDate = new Date(r.date).getTime();
                if (rDate < new Date(options.dateFrom).getTime()) return false;
            }
            if (options.dateTo) {
                const rDate = new Date(r.date).getTime();
                if (rDate > new Date(options.dateTo + 'T23:59:59').getTime()) return false;
            }
            // 得分区间筛选
            if (options.scoreMin !== undefined && options.scoreMin !== '') {
                if (r.totalScore < parseFloat(options.scoreMin)) return false;
            }
            if (options.scoreMax !== undefined && options.scoreMax !== '') {
                if (r.totalScore > parseFloat(options.scoreMax)) return false;
            }
            // 日期搜索
            if (options.searchText) {
                const text = options.searchText.trim();
                if (text && !r.date.includes(text)) return false;
            }
            return true;
        });
    }
};
