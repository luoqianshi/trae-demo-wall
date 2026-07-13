// ===== 心创工坊 - 核心存储层 =====
// 使用 IndexedDB 实现持久化存储，支持自动备份、加密、版本管理

const XC_DB_NAME = 'XinChuangDB';
const XC_DB_VERSION = 1;

// ===== IndexedDB 核心类 =====
class XinChuangDB {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.encryptionKey = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(XC_DB_NAME, XC_DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建各数据表
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('clients')) {
                    db.createObjectStore('clients', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('assessments')) {
                    db.createObjectStore('assessments', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('records')) {
                    db.createObjectStore('records', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('appointments')) {
                    db.createObjectStore('appointments', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('moods')) {
                    db.createObjectStore('moods', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('alerts')) {
                    db.createObjectStore('alerts', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('aiAnalyses')) {
                    db.createObjectStore('aiAnalyses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('goalsHistory')) {
                    db.createObjectStore('goalsHistory', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('operationLogs')) {
                    db.createObjectStore('operationLogs', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('backups')) {
                    const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('supervisorReviews')) {
                    db.createObjectStore('supervisorReviews', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('clientLinks')) {
                    db.createObjectStore('clientLinks', { keyPath: 'code' });
                }
            };
        });
    }

    // ===== 基础 CRUD 操作 =====
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => resolve(data);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        const stores = ['users', 'clients', 'assessments', 'records', 'appointments', 
                        'moods', 'alerts', 'aiAnalyses', 'goalsHistory', 'operationLogs', 
                        'backups', 'settings', 'supervisorReviews', 'clientLinks'];
        for (const store of stores) {
            await this.clear(store);
        }
        return true;
    }

    // ===== 加密相关 =====
    // 使用简单的AES加密（模拟，真实场景需要crypto-js库）
    encrypt(text, key) {
        if (!key) return text;
        // 模拟加密：实际使用时应替换为真实加密
        try {
            return btoa(encodeURIComponent(text));
        } catch(e) {
            return text;
        }
    }

    decrypt(text, key) {
        if (!key) return text;
        try {
            return decodeURIComponent(atob(text));
        } catch(e) {
            return text;
        }
    }

    // 加密敏感字段
    encryptClientData(client) {
        const key = this.encryptionKey || 'xc_default_key';
        const encrypted = { ...client };
        encrypted.name = this.encrypt(client.name, key);
        encrypted.phone = this.encrypt(client.phone || '', key);
        encrypted.emergency = this.encrypt(client.emergency || '', key);
        encrypted.problem = this.encrypt(client.problem, key);
        encrypted._encrypted = true;
        return encrypted;
    }

    decryptClientData(client) {
        if (!client._encrypted) return client;
        const key = this.encryptionKey || 'xc_default_key';
        const decrypted = { ...client };
        decrypted.name = this.decrypt(client.name, key);
        decrypted.phone = this.decrypt(client.phone || '', key);
        decrypted.emergency = this.decrypt(client.emergency || '', key);
        decrypted.problem = this.decrypt(client.problem, key);
        decrypted._encrypted = false;
        return decrypted;
    }

    // ===== 自动备份 =====
    async createBackup(reason = 'auto') {
        const timestamp = Date.now();
        const backupId = `backup_${timestamp}`;
        
        const data = {
            users: await this.getAll('users'),
            clients: await this.getAll('clients'),
            assessments: await this.getAll('assessments'),
            records: await this.getAll('records'),
            appointments: await this.getAll('appointments'),
            moods: await this.getAll('moods'),
            alerts: await this.getAll('alerts'),
            aiAnalyses: await this.getAll('aiAnalyses'),
            goalsHistory: await this.getAll('goalsHistory'),
            operationLogs: await this.getAll('operationLogs'),
            supervisorReviews: await this.getAll('supervisorReviews'),
            clientLinks: await this.getAll('clientLinks')
        };

        const backup = {
            id: backupId,
            timestamp,
            date: formatDate(new Date(timestamp)),
            reason,
            version: XC_DB_VERSION,
            data
        };

        await this.put('backups', backup);
        
        // 只保留最近10个备份
        const backups = await this.getAll('backups');
        if (backups.length > 10) {
            backups.sort((a, b) => b.timestamp - a.timestamp);
            const toDelete = backups.slice(10);
            for (const old of toDelete) {
                await this.delete('backups', old.id);
            }
        }

        return backup;
    }

    async getBackups() {
        const backups = await this.getAll('backups');
        return backups.sort((a, b) => b.timestamp - a.timestamp);
    }

    async restoreBackup(backupId) {
        const backup = await this.get('backups', backupId);
        if (!backup) return false;

        await this.clearAll();
        
        for (const key in backup.data) {
            if (backup.data[key] && backup.data[key].length > 0) {
                for (const item of backup.data[key]) {
                    await this.put(key, item);
                }
            }
        }

        return true;
    }

    // ===== 操作日志 =====
    async logOperation(action, targetType, targetId, details = {}) {
        const log = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            date: formatDate(new Date()),
            time: formatTime(new Date()),
            userId: window.currentUser ? window.currentUser.id : 'unknown',
            userName: window.currentUser ? window.currentUser.name : '未知',
            action,
            targetType,
            targetId,
            details
        };
        await this.put('operationLogs', log);
        
        // 只保留最近1000条日志
        const logs = await this.getAll('operationLogs');
        if (logs.length > 1000) {
            logs.sort((a, b) => b.timestamp - a.timestamp);
            const toDelete = logs.slice(1000);
            for (const old of toDelete) {
                await this.delete('operationLogs', old.id);
            }
        }
        
        return log;
    }

    // ===== 设置管理 =====
    async getSetting(key, defaultValue = null) {
        const setting = await this.get('settings', key);
        return setting ? setting.value : defaultValue;
    }

    async setSetting(key, value) {
        await this.put('settings', { key, value, updatedAt: Date.now() });
    }

    // ===== 导出/导入 =====
    async exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: XC_DB_VERSION,
            users: await this.getAll('users'),
            clients: await this.getAll('clients'),
            assessments: await this.getAll('assessments'),
            records: await this.getAll('records'),
            appointments: await this.getAll('appointments'),
            moods: await this.getAll('moods'),
            alerts: await this.getAll('alerts'),
            aiAnalyses: await this.getAll('aiAnalyses'),
            goalsHistory: await this.getAll('goalsHistory'),
            operationLogs: await this.getAll('operationLogs'),
            backups: await this.getAll('backups'),
            supervisorReviews: await this.getAll('supervisorReviews'),
            clientLinks: await this.getAll('clientLinks')
        };
        return data;
    }

    async importData(data) {
        if (!data.version) return false;
        
        const stores = ['users', 'clients', 'assessments', 'records', 'appointments',
                        'moods', 'alerts', 'aiAnalyses', 'goalsHistory', 'operationLogs',
                        'supervisorReviews', 'clientLinks'];
        
        for (const store of stores) {
            if (data[store] && data[store].length > 0) {
                for (const item of data[store]) {
                    await this.put(store, item);
                }
            }
        }
        
        return true;
    }
}

// ===== 全局实例 =====
let db = null;
// currentUser在main.js中声明和管理

// ===== 初始化 =====
async function initDB() {
    db = new XinChuangDB();
    await db.init();
    console.log('心创工坊数据库初始化完成');
    return db;
}

// ===== 工具函数 =====
function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(d) {
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    return `${hour}:${minute}:${second}`;
}

function formatDateTime(d) {
    return `${formatDate(d)} ${formatTime(d)}`;
}

// ===== 简化的API（兼容旧代码） =====
const Storage = {
    async get(key, defaultValue = []) {
        if (!db || !db.isReady) return defaultValue;
        try {
            return await db.getAll(key) || defaultValue;
        } catch(e) {
            return defaultValue;
        }
    },
    async set(key, value) {
        if (!db || !db.isReady) return;
        // 先清空再批量写入
        await db.clear(key);
        if (Array.isArray(value)) {
            for (const item of value) {
                await db.put(key, item);
            }
        } else {
            await db.put(key, value);
        }
    },
    async getOne(key, id) {
        if (!db || !db.isReady) return null;
        return await db.get(key, id);
    },
    async putOne(key, item) {
        if (!db || !db.isReady) return;
        await db.put(key, item);
    },
    async deleteOne(key, id) {
        if (!db || !db.isReady) return;
        await db.delete(key, id);
    }
};

// 导出全局
window.XinChuangDB = XinChuangDB;
window.initDB = initDB;
window.Storage = Storage;
window.db = db;