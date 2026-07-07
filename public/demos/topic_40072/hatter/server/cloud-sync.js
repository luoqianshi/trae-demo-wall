// Hatter 云同步模块（备用独立版本）
// 注意：index.html 已内嵌 cloudApi 实现，此文件为独立备用模块
// 如需使用，请在 index.html 中引入此脚本（会覆盖内嵌版本）

// ===== 配置 =====
const CLOUD_SERVER = 'http://8.137.196.81:3000';
const CLOUD_API_KEY_STORAGE = 'hatter_cloud_token';
const CLOUD_SYNC_ENABLED = 'hatter_cloud_sync_enabled';

// ===== 工具函数 =====
const getCloudApiKey = () => localStorage.getItem(CLOUD_API_KEY_STORAGE) || '';
const setCloudApiKey = (key) => localStorage.setItem(CLOUD_API_KEY_STORAGE, key);
const isCloudSyncEnabled = () => localStorage.getItem(CLOUD_SYNC_ENABLED) === 'true';
const setCloudSyncEnabled = (v) => localStorage.setItem(CLOUD_SYNC_ENABLED, v ? 'true' : 'false');

// ===== 云同步 API =====
const cloudApi = {
    headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCloudApiKey()}`
        };
    },

    // 保存对话到云端
    async saveConversation(id, title, messages) {
        if (!isCloudSyncEnabled() || !getCloudApiKey()) return;
        try {
            const res = await fetch(`${CLOUD_SERVER}/api/conversations/save`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({ id, title, messages })
            });
            if (!res.ok) console.warn('Cloud save failed:', res.status);
        } catch (err) {
            console.warn('Cloud save error:', err.message);
        }
    },

    // 获取云端对话列表
    async listConversations() {
        if (!isCloudSyncEnabled() || !getCloudApiKey()) return [];
        try {
            const res = await fetch(`${CLOUD_SERVER}/api/conversations/list`, {
                headers: this.headers()
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.conversations || [];
        } catch (err) {
            console.warn('Cloud list error:', err.message);
            return [];
        }
    },

    // 获取单个对话
    async getConversation(id) {
        if (!isCloudSyncEnabled() || !getCloudApiKey()) return null;
        try {
            const res = await fetch(`${CLOUD_SERVER}/api/conversations/${id}`, {
                headers: this.headers()
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.warn('Cloud get error:', err.message);
            return null;
        }
    },

    // 删除云端对话
    async deleteConversation(id) {
        if (!isCloudSyncEnabled() || !getCloudApiKey()) return;
        try {
            const res = await fetch(`${CLOUD_SERVER}/api/conversations/${id}`, {
                method: 'DELETE',
                headers: this.headers()
            });
            if (!res.ok) console.warn('Cloud delete failed:', res.status);
        } catch (err) {
            console.warn('Cloud delete error:', err.message);
        }
    },

    // 测试连接
    async testConnection() {
        try {
            const res = await fetch(`${CLOUD_SERVER}/health`, {
                headers: this.headers()
            });
            return res.ok;
        } catch {
            return false;
        }
    }
};

// ===== 同步逻辑 =====

// 保存时同步到云端（在 saveSessions 后调用）
const syncToCloud = async () => {
    if (!isCloudSyncEnabled()) return;
    // 只同步当前对话
    if (!currentSessionId || isPrivateMode) return;
    const cleanHistory = cleanHistoryForStorage(conversationHistory);
    await cloudApi.saveConversation(
        currentSessionId,
        currentTitle || '未命名对话',
        cleanHistory
    );
};

// 从云端拉取所有对话（用于恢复）
const syncFromCloud = async () => {
    if (!isCloudSyncEnabled()) return false;
    const cloudList = await cloudApi.listConversations();
    if (cloudList.length === 0) return false;

    let synced = 0;
    for (const item of cloudList) {
        const detail = await cloudApi.getConversation(item.id);
        if (!detail) continue;

        const existing = userSessions.find(s => s.id === item.id);
        if (existing) {
            // 云端更新则覆盖本地
            if (item.updated_at > (existing.lastTime || 0)) {
                existing.title = detail.title;
                existing.history = detail.messages;
                existing.lastTime = detail.updatedAt;
                synced++;
            }
        } else {
            // 本地没有则新增
            userSessions.unshift({
                id: detail.id,
                title: detail.title,
                history: detail.messages,
                lastTime: detail.updatedAt
            });
            synced++;
        }
    }

    if (synced > 0) {
        saveSessions();
        renderSessionList();
    }
    return synced > 0;
};

// 删除时同步到云端
const syncDeleteToCloud = async (id) => {
    if (!isCloudSyncEnabled()) return;
    await cloudApi.deleteConversation(id);
};
