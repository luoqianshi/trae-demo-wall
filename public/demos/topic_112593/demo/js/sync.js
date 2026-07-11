/* ==================== 数据同步管理 ==================== */
const Sync = {
    // 模拟云端存储的 key（实际项目中替换为 API 调用）
    CLOUD_KEY: 'mingchen_cloud_history',
    SYNC_STATUS_KEY: 'mingchen_sync_status',
    SYNC_CONFIG_KEY: 'mingchen_sync_config',

    // 同步状态
    status: {
        lastSyncTime: null,
        isSyncing: false,
        pendingUploads: 0,
        cloudRecordCount: 0
    },

    // 自动同步开关
    autoSync: true,

    // 初始化同步状态
    init() {
        const saved = localStorage.getItem(this.SYNC_STATUS_KEY);
        if (saved) {
            try {
                this.status = JSON.parse(saved);
            } catch (e) {
                console.error('读取同步状态失败:', e);
            }
        }
        // 页面刷新后重置同步中状态，避免死锁
        this.status.isSyncing = false;
        const config = localStorage.getItem(this.SYNC_CONFIG_KEY);
        if (config) {
            try {
                const parsed = JSON.parse(config);
                if (parsed.autoSync !== undefined) this.autoSync = parsed.autoSync;
            } catch (e) {
                console.error('读取同步配置失败:', e);
            }
        }
    },

    // 保存同步配置
    saveState() {
        localStorage.setItem(this.SYNC_CONFIG_KEY, JSON.stringify({ autoSync: this.autoSync }));
    },

    // 标记有待同步的数据
    markPending() {
        this.status.pendingUploads++;
        this._saveStatus();
    },

    // 保存同步状态
    _saveStatus() {
        localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(this.status));
    },

    // 模拟：从云端拉取数据
    async fetchCloudData() {
        // 实际项目中这里应该是 API 调用：
        // const response = await fetch('/api/history', { headers: { 'Authorization': token } });
        // return await response.json();

        // 模拟延迟
        await new Promise(r => setTimeout(r, 600));

        const userId = Auth ? Auth.getUserId() : 'default';
        const cloudKey = this.CLOUD_KEY + '_' + userId;
        const data = localStorage.getItem(cloudKey);
        return data ? JSON.parse(data) : [];
    },

    // 模拟：推送数据到云端
    async pushToCloud(records) {
        // 实际项目中这里应该是 API 调用：
        // await fetch('/api/history/sync', { method: 'POST', body: JSON.stringify(records), headers: {...} });

        await new Promise(r => setTimeout(r, 400));

        const userId = Auth ? Auth.getUserId() : 'default';
        const cloudKey = this.CLOUD_KEY + '_' + userId;
        localStorage.setItem(cloudKey, JSON.stringify(records));
        return true;
    },

    // 合并本地和云端数据（冲突时保留较新版本）
    mergeRecords(localRecords, cloudRecords) {
        const mergedMap = new Map();
        let conflicts = 0;
        let localNewer = 0;
        let cloudNewer = 0;

        // 先将本地记录放入 map
        for (const r of localRecords) {
            mergedMap.set(r.id, { ...r, _source: 'local' });
        }

        // 处理云端记录
        for (const cloudR of cloudRecords) {
            const localR = mergedMap.get(cloudR.id);
            if (!localR) {
                // 云端有，本地没有 → 拉取到本地
                mergedMap.set(cloudR.id, { ...cloudR, _source: 'cloud' });
                continue;
            }

            // 两边都有 → 比较时间戳
            const localTime = new Date(localR.date).getTime();
            const cloudTime = new Date(cloudR.date).getTime();

            if (cloudTime > localTime) {
                // 云端版本较新 → 使用云端版本
                mergedMap.set(cloudR.id, { ...cloudR, _source: 'cloud' });
                conflicts++;
                cloudNewer++;
            } else if (localTime > cloudTime) {
                // 本地版本较新 → 保留本地，稍后推送
                conflicts++;
                localNewer++;
            }
            // 时间相同 → 无需处理
        }

        return {
            records: Array.from(mergedMap.values()).map(r => {
                delete r._source;
                return r;
            }),
            stats: {
                localCount: localRecords.length,
                cloudCount: cloudRecords.length,
                mergedCount: mergedMap.size,
                conflicts,
                localNewer,
                cloudNewer,
                pulledFromCloud: cloudRecords.length - cloudNewer - conflicts
            }
        };
    },

    // 执行同步（拉取 + 合并 + 推送）
    async sync() {
        if (this.status.isSyncing) return { success: false, message: '同步中...' };

        this.status.isSyncing = true;
        this._saveStatus();

        try {
            // 1. 拉取云端数据
            const cloudRecords = await this.fetchCloudData();
            const localRecords = History.getAll();

            // 2. 合并数据
            const result = this.mergeRecords(localRecords, cloudRecords);

            // 3. 保存合并后的数据到本地
            const userId = Auth ? Auth.getUserId() : 'default';
            localStorage.setItem(History.STORAGE_KEY + '_' + userId, JSON.stringify(result.records));

            // 4. 推送本地较新的数据到云端
            const newerLocalRecords = result.records.filter(r => {
                const cloudR = cloudRecords.find(c => c.id === r.id);
                if (!cloudR) return true; // 本地独有
                return new Date(r.date).getTime() > new Date(cloudR.date).getTime();
            });
            if (newerLocalRecords.length > 0) {
                await this.pushToCloud(result.records);
            }

            // 5. 更新状态
            this.status.lastSyncTime = new Date().toISOString();
            this.status.cloudRecordCount = result.stats.cloudCount;
            this.status.isSyncing = false;
            this._saveStatus();

            return {
                success: true,
                message: '同步完成',
                stats: result.stats
            };
        } catch (err) {
            this.status.isSyncing = false;
            this._saveStatus();
            console.error('[数据同步]', err);
            return { success: false, message: '同步失败: ' + (err.message || '未知错误') };
        }
    },

    // 新设备登录后自动拉取云端数据
    async autoPullOnLogin() {
        const hasLocalData = History.getAll().length > 0;
        if (hasLocalData) {
            // 本地已有数据，执行完整同步
            return await this.sync();
        }

        // 本地没有数据，只拉取云端数据
        try {
            this.status.isSyncing = true;
            const cloudRecords = await this.fetchCloudData();
            if (cloudRecords.length > 0) {
                const userId = Auth ? Auth.getUserId() : 'default';
                localStorage.setItem(History.STORAGE_KEY + '_' + userId, JSON.stringify(cloudRecords));
            }
            this.status.lastSyncTime = new Date().toISOString();
            this.status.cloudRecordCount = cloudRecords.length;
            this.status.isSyncing = false;
            this._saveStatus();
            return {
                success: true,
                message: '已恢复 ' + cloudRecords.length + ' 条云端记录',
                stats: { cloudCount: cloudRecords.length, mergedCount: cloudRecords.length }
            };
        } catch (err) {
            this.status.isSyncing = false;
            this._saveStatus();
            return { success: false, message: '拉取失败: ' + (err.message || '未知错误') };
        }
    },

    // 格式化上次同步时间
    formatLastSync() {
        if (!this.status.lastSyncTime) return '从未同步';
        const d = new Date(this.status.lastSyncTime);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },

    // 清除云端数据（调试用）
    clearCloud() {
        const userId = Auth ? Auth.getUserId() : 'default';
        localStorage.removeItem(this.CLOUD_KEY + '_' + userId);
        this.status.cloudRecordCount = 0;
        this._saveStatus();
    }
};

// 初始化
Sync.init();
