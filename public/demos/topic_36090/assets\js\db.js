/* ============================================
   IndexedDB 数据库层 - AI手写采购单识别工具
   数据库: purchaseLedgerDB (v1)
   表: records (采购记录), suppliers (供应商), settings (设置)
   ============================================ */

(function () {
    'use strict';

    // 数据库配置
    const DB_NAME = 'purchaseLedgerDB';
    const DB_VERSION = 1;
    const STORES = {
        RECORDS: 'records',
        SUPPLIERS: 'suppliers',
        SETTINGS: 'settings'
    };

    let dbInstance = null;
    let initPromise = null;

    /**
     * 初始化数据库（单例模式）
     * @returns {Promise<IDBDatabase>}
     */
    function initDB() {
        if (initPromise) return initPromise;
        if (dbInstance) return Promise.resolve(dbInstance);

        initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                console.log('[DB] 升级数据库，版本:', DB_VERSION);

                // 采购记录表
                if (!db.objectStoreNames.contains(STORES.RECORDS)) {
                    const recordStore = db.createObjectStore(STORES.RECORDS, { keyPath: 'id', autoIncrement: true });
                    recordStore.createIndex('date', 'date', { unique: false });
                    recordStore.createIndex('supplier', 'supplier', { unique: false });
                    recordStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('[DB] 创建表:', STORES.RECORDS);
                }

                // 供应商表
                if (!db.objectStoreNames.contains(STORES.SUPPLIERS)) {
                    const supplierStore = db.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id', autoIncrement: true });
                    supplierStore.createIndex('name', 'name', { unique: true });
                    supplierStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('[DB] 创建表:', STORES.SUPPLIERS);
                }

                // 设置表
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                    console.log('[DB] 创建表:', STORES.SETTINGS);
                }
            };

            request.onsuccess = function (event) {
                dbInstance = event.target.result;
                console.log('[DB] 数据库打开成功');
                initDefaultData().then(function () { resolve(dbInstance); });
            };

            request.onerror = function (event) {
                console.error('[DB] 数据库打开失败:', event.target.error);
                reject(event.target.error);
            };
        });

        return initPromise;
    }

    /**
     * 初始化默认数据（首次使用时）
     */
    async function initDefaultData() {
        const suppliers = await listSuppliers();
        if (suppliers.length === 0) {
            console.log('[DB] 首次使用，初始化默认供应商');
            const defaults = ['鑫源果蔬批发', '惠民肉食店', '海鲜水产市场'];
            for (let i = 0; i < defaults.length; i++) {
                await addSupplier({ name: defaults[i] });
            }
        }

        const apiUrl = await getSetting('apiUrl');
        if (apiUrl === null || apiUrl === undefined) {
            console.log('[DB] 初始化默认设置');
            await setSetting('apiUrl', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-image:generateContent');
            await setSetting('apiKey', '');
            await setSetting('aiModel', 'gemini');
        }
    }

    function getDB() { return dbInstance; }

    /* ========== 通用 CRUD 辅助函数 ========== */
    function addItem(storeName, data) {
        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const now = Date.now();
            const record = Object.assign({}, data, { createdAt: now, updatedAt: now });
            const request = store.add(record);
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function getItem(storeName, id) {
        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function updateItem(storeName, id, data) {
        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const getReq = store.get(id);
            getReq.onsuccess = function () {
                const record = getReq.result;
                if (!record) { reject(new Error('记录不存在')); return; }
                Object.assign(record, data, { updatedAt: Date.now() });
                const putReq = store.put(record);
                putReq.onsuccess = function () { resolve(putReq.result); };
                putReq.onerror = function () { reject(putReq.error); };
            };
            getReq.onerror = function () { reject(getReq.error); };
        });
    }

    function deleteItem(storeName, id) {
        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = function () { resolve(true); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function listItems(storeName, options) {
        options = options || {};
        const sortBy = options.sortBy || 'createdAt';
        const desc = options.desc !== false;
        const limit = options.limit || null;
        const offset = options.offset || 0;
        const filter = options.filter || null;

        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            let request;
            if (store.indexNames.contains(sortBy)) {
                request = store.index(sortBy).openCursor(null, desc ? 'prev' : 'next');
            } else {
                request = store.openCursor(null, desc ? 'prev' : 'next');
            }
            const results = [];
            let count = 0, skipped = 0;
            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (!cursor) { resolve(results); return; }
                if (filter && !filter(cursor.value)) { cursor.continue(); return; }
                if (offset > 0 && skipped < offset) { skipped++; cursor.continue(); return; }
                results.push(cursor.value); count++;
                if (limit && count >= limit) resolve(results);
                else cursor.continue();
            };
            request.onerror = function () { reject(request.error); };
        });
    }

    function countItems(storeName, filter) {
        filter = filter || null;
        return new Promise(function (resolve, reject) {
            const tx = dbInstance.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.openCursor();
            let count = 0;
            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (!cursor) { resolve(count); return; }
                if (!filter || filter(cursor.value)) count++;
                cursor.continue();
            };
            request.onerror = function () { reject(request.error); };
        });
    }

    /* ========== 采购记录 API ========== */
    function addRecord(data) {
        return addItem(STORES.RECORDS, {
            date: data.date || new Date().toISOString().split('T')[0],
            supplier: data.supplier || '',
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            note: data.note || ''
        });
    }
    function getRecord(id) { return getItem(STORES.RECORDS, id); }
    function updateRecord(id, data) { return updateItem(STORES.RECORDS, id, data); }
    function deleteRecord(id) { return deleteItem(STORES.RECORDS, id); }

    function listRecords(options) {
        options = options || {};
        const page = options.page || 1;
        const pageSize = options.pageSize || 20;
        const dateFrom = options.dateFrom, dateTo = options.dateTo, supplier = options.supplier, keyword = options.keyword;
        const offset = (page - 1) * pageSize;
        const filter = function (record) {
            if (dateFrom && record.date < dateFrom) return false;
            if (dateTo && record.date > dateTo) return false;
            if (supplier && record.supplier !== supplier) return false;
            if (keyword) {
                const kw = keyword.toLowerCase();
                const itemNames = (record.items || []).map(function (i) { return i.name; });
                const text = [record.supplier, record.note].concat(itemNames).filter(Boolean).join(' ').toLowerCase();
                if (!text.includes(kw)) return false;
            }
            return true;
        };
        return listItems(STORES.RECORDS, { sortBy: 'date', desc: true, limit: pageSize, offset: offset, filter: filter });
    }

    function countRecords(filters) {
        filters = filters || {};
        const dateFrom = filters.dateFrom, dateTo = filters.dateTo, supplier = filters.supplier, keyword = filters.keyword;
        const filter = function (record) {
            if (dateFrom && record.date < dateFrom) return false;
            if (dateTo && record.date > dateTo) return false;
            if (supplier && record.supplier !== supplier) return false;
            if (keyword) {
                const kw = keyword.toLowerCase();
                const itemNames = (record.items || []).map(function (i) { return i.name; });
                const text = [record.supplier, record.note].concat(itemNames).filter(Boolean).join(' ').toLowerCase();
                if (!text.includes(kw)) return false;
            }
            return true;
        };
        return countItems(STORES.RECORDS, filter);
    }

    /* ========== 供应商 API ========== */
    function addSupplier(data) {
        return addItem(STORES.SUPPLIERS, {
            name: data.name || '', contact: data.contact || '', phone: data.phone || ''
        });
    }
    function getSupplier(id) { return getItem(STORES.SUPPLIERS, id); }
    function updateSupplier(id, data) { return updateItem(STORES.SUPPLIERS, id, data); }
    function deleteSupplier(id) { return deleteItem(STORES.SUPPLIERS, id); }
    function listSuppliers() { return listItems(STORES.SUPPLIERS, { sortBy: 'createdAt', desc: false }); }

    /* ========== 设置 API ========== */
    function getSetting(key) {
        return new Promise(function (resolve, reject) {
            if (!dbInstance) { resolve(null); return; }
            const tx = dbInstance.transaction([STORES.SETTINGS], 'readonly');
            const store = tx.objectStore(STORES.SETTINGS);
            const request = store.get(key);
            request.onsuccess = function () { resolve(request.result ? request.result.value : null); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function setSetting(key, value) {
        return new Promise(function (resolve, reject) {
            if (!dbInstance) { reject(new Error('DB not initialized')); return; }
            const tx = dbInstance.transaction([STORES.SETTINGS], 'readwrite');
            const store = tx.objectStore(STORES.SETTINGS);
            const request = store.put({ key: key, value: value, updatedAt: Date.now() });
            request.onsuccess = function () { resolve(true); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function getAllSettings() {
        return new Promise(function (resolve, reject) {
            if (!dbInstance) { resolve({}); return; }
            const tx = dbInstance.transaction([STORES.SETTINGS], 'readonly');
            const store = tx.objectStore(STORES.SETTINGS);
            const request = store.openCursor();
            const settings = {};
            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (!cursor) { resolve(settings); return; }
                settings[cursor.value.key] = cursor.value.value;
                cursor.continue();
            };
            request.onerror = function () { reject(request.error); };
        });
    }

    /* ========== 统计 API ========== */
    async function getStats() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const allRecords = await listItems(STORES.RECORDS, { sortBy: 'date', desc: true, limit: 1000 });

        let todayCount = 0, todayAmount = 0, monthCount = 0, monthAmount = 0;
        for (let i = 0; i < allRecords.length; i++) {
            const r = allRecords[i];
            if (r.date === today) { todayCount++; todayAmount += (r.totalAmount || 0); }
            if (r.date >= monthStart) { monthCount++; monthAmount += (r.totalAmount || 0); }
        }

        const suppliers = await listSuppliers();
        const categoryMap = {};
        for (let i = 0; i < allRecords.length; i++) {
            const items = allRecords[i].items || [];
            for (let j = 0; j < items.length; j++) {
                const cat = items[j].category || '其他';
                if (!categoryMap[cat]) categoryMap[cat] = { count: 0, amount: 0 };
                categoryMap[cat].count++;
                categoryMap[cat].amount += items[j].amount || 0;
            }
        }

        const categories = [];
        for (const name in categoryMap) categories.push({ name: name, count: categoryMap[name].count, amount: categoryMap[name].amount });
        categories.sort(function (a, b) { return b.amount - a.amount; });

        return {
            todayCount: todayCount, todayAmount: todayAmount,
            monthCount: monthCount, monthAmount: monthAmount,
            totalRecords: allRecords.length,
            suppliersCount: suppliers.length,
            recentRecords: allRecords.slice(0, 5),
            categories: categories
        };
    }

    async function getReportData(dateFrom, dateTo) {
        const filterFn = function (r) { return r.date >= dateFrom && r.date <= dateTo; };
        const allRecords = await listItems(STORES.RECORDS, { sortBy: 'date', desc: false, filter: filterFn });

        const dailyMap = {};
        for (let i = 0; i < allRecords.length; i++) {
            const r = allRecords[i];
            if (!dailyMap[r.date]) dailyMap[r.date] = 0;
            dailyMap[r.date] += r.totalAmount || 0;
        }

        const supplierMap = {};
        for (let i = 0; i < allRecords.length; i++) {
            const r = allRecords[i];
            const s = r.supplier || '未知';
            if (!supplierMap[s]) supplierMap[s] = { count: 0, amount: 0 };
            supplierMap[s].count++;
            supplierMap[s].amount += r.totalAmount || 0;
        }

        const categoryMap = {};
        for (let i = 0; i < allRecords.length; i++) {
            const items = allRecords[i].items || [];
            for (let j = 0; j < items.length; j++) {
                const cat = items[j].category || '其他';
                if (!categoryMap[cat]) categoryMap[cat] = { count: 0, amount: 0 };
                categoryMap[cat].count++;
                categoryMap[cat].amount += items[j].amount || 0;
            }
        }

        let totalAmount = 0;
        for (let i = 0; i < allRecords.length; i++) totalAmount += allRecords[i].totalAmount || 0;

        const dailyData = [];
        for (const d in dailyMap) dailyData.push({ date: d, amount: dailyMap[d] });

        const supplierData = [];
        for (const n in supplierMap) supplierData.push({ name: n, count: supplierMap[n].count, amount: supplierMap[n].amount });

        const categoryData = [];
        for (const n in categoryMap) categoryData.push({ name: n, count: categoryMap[n].count, amount: categoryMap[n].amount });
        supplierData.sort(function (a, b) { return b.amount - a.amount; });
        categoryData.sort(function (a, b) { return b.amount - a.amount; });

        return {
            dateFrom: dateFrom, dateTo: dateTo,
            totalAmount: totalAmount, totalCount: allRecords.length,
            dailyData: dailyData, supplierData: supplierData,
            categoryData: categoryData, allRecords: allRecords
        };
    }

    /* ========== 数据导入/导出 ========== */
    async function exportData() {
        const records = await listItems(STORES.RECORDS, { sortBy: 'createdAt', desc: false });
        const suppliers = await listItems(STORES.SUPPLIERS, { sortBy: 'createdAt', desc: false });
        const settings = await getAllSettings();
        return { version: '1.0', exportedAt: new Date().toISOString(), data: { records: records, suppliers: suppliers, settings: settings } };
    }

    async function importData(jsonData) {
        try {
            const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // 支持直接导入记录数组（如 sample-records.json）
            if (Array.isArray(parsed)) {
                const supplierSet = {};
                for (let i = 0; i < parsed.length; i++) {
                    const name = parsed[i].supplier;
                    if (name) supplierSet[name] = true;
                }
                await clearAll(false);
                for (const name in supplierSet) {
                    await addSupplier({ name: name });
                }
                for (let i = 0; i < parsed.length; i++) {
                    const r = parsed[i];
                    await addRecord({ date: r.date, supplier: r.supplier, items: r.items, totalAmount: r.totalAmount, note: r.note });
                }
                console.log('[DB] 记录数组导入完成');
                return true;
            }

            if (!parsed.data) throw new Error('数据格式不正确');
            await clearAll(false);
            const records = parsed.data.records || [];
            const suppliers = parsed.data.suppliers || [];
            const settings = parsed.data.settings || {};
            for (let i = 0; i < suppliers.length; i++) {
                const s = suppliers[i];
                await addSupplier({ name: s.name, contact: s.contact, phone: s.phone });
            }
            for (let i = 0; i < records.length; i++) {
                const r = records[i];
                await addRecord({ date: r.date, supplier: r.supplier, items: r.items, totalAmount: r.totalAmount, note: r.note });
            }
            for (const key in settings) await setSetting(key, settings[key]);
            console.log('[DB] 数据导入完成');
            return true;
        } catch (err) {
            console.error('[DB] 数据导入失败:', err);
            throw err;
        }
    }

    function clearAll(clearSettings) {
        return new Promise(function (resolve, reject) {
            const stores = clearSettings !== false ? [STORES.RECORDS, STORES.SUPPLIERS, STORES.SETTINGS] : [STORES.RECORDS, STORES.SUPPLIERS];
            const tx = dbInstance.transaction(stores, 'readwrite');
            let completed = 0;
            for (let i = 0; i < stores.length; i++) {
                const name = stores[i];
                const req = tx.objectStore(name).clear();
                req.onsuccess = function () {
                    completed++;
                    if (completed === stores.length) {
                        console.log('[DB] 数据已清空');
                        resolve(true);
                    }
                };
                req.onerror = function () { reject(req.error); };
            }
        });
    }

    // 暴露到全局
    window.DB = {
        init: initDB, getDB: getDB,
        addRecord: addRecord, getRecord: getRecord, updateRecord: updateRecord, deleteRecord: deleteRecord,
        listRecords: listRecords, countRecords: countRecords,
        addSupplier: addSupplier, getSupplier: getSupplier, updateSupplier: updateSupplier, deleteSupplier: deleteSupplier, listSuppliers: listSuppliers,
        getSetting: getSetting, setSetting: setSetting, getAllSettings: getAllSettings,
        exportData: exportData, importData: importData, clearAll: clearAll,
        getStats: getStats, getReportData: getReportData
    };

    console.log('[DB] 模块已加载，请调用 DB.init() 初始化');
})();
