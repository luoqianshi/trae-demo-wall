window.shiguangStorage = {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => { localStorage.setItem(key, value); },
    removeItem: (key) => localStorage.removeItem(key),
    estimateBytes: () => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("shiguang:")) {
                total += (k.length + (localStorage.getItem(k) || "").length) * 2;
            }
        }
        return total;
    },
    getAllShiguang: () => {
        const result = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("shiguang:")) result[k] = localStorage.getItem(k);
        }
        return result;
    }
};

window.shiguangMirror = {
    _db: null,
    _open: function () {
        return new Promise((resolve, reject) => {
            if (window.shiguangMirror._db) { resolve(window.shiguangMirror._db); return; }
            const req = indexedDB.open("shiguang-mirror", 1);
            req.onupgradeneeded = (e) => { e.target.result.createObjectStore("kv"); };
            req.onsuccess = (e) => { window.shiguangMirror._db = e.target.result; resolve(e.target.result); };
            req.onerror = (e) => reject(e.target.error);
        });
    },
    set: async function (key, value) {
        const db = await window.shiguangMirror._open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("kv", "readwrite");
            tx.objectStore("kv").put(value, key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    },
    get: async function (key) {
        const db = await window.shiguangMirror._open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("kv", "readonly");
            const req = tx.objectStore("kv").get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }
};
