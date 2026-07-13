var Storage = (function() {
    var PREFIX = 'xm2_';
    var CLEANUP_PRIORITY_KEYS = [
        'demo_guide_shown',
        'onboarding_shown',
        'tour_shown'
    ];

    function getFullKey(key) {
        return PREFIX + key;
    }

    function isQuotaError(e) {
        return e.name === 'QuotaExceededError' ||
               e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
               e.code === 22 ||
               e.code === 1014;
    }

    function estimateSize() {
        try {
            var total = 0;
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf(PREFIX) === 0) {
                    var value = localStorage.getItem(key);
                    total += key.length + (value ? value.length : 0);
                }
            }
            return {
                bytes: total,
                kb: Math.round(total / 1024),
                mb: +(total / 1024 / 1024).toFixed(2)
            };
        } catch (e) {
            return { bytes: 0, kb: 0, mb: 0 };
        }
    }

    function getAppKeys() {
        try {
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf(PREFIX) === 0) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (e) {
            return [];
        }
    }

    function cleanupOldData() {
        try {
            var cleaned = false;

            for (var i = 0; i < CLEANUP_PRIORITY_KEYS.length; i++) {
                var fullKey = getFullKey(CLEANUP_PRIORITY_KEYS[i]);
                if (localStorage.getItem(fullKey) !== null) {
                    localStorage.removeItem(fullKey);
                    cleaned = true;
                }
            }

            return cleaned;
        } catch (e) {
            console.warn('Storage cleanup error:', e);
            return false;
        }
    }

    function safeSave(key, data) {
        try {
            var jsonData = JSON.stringify(data);
            localStorage.setItem(getFullKey(key), jsonData);
            return true;
        } catch (e) {
            if (isQuotaError(e)) {
                console.warn('Storage quota exceeded, attempting cleanup...');
                if (cleanupOldData()) {
                    try {
                        var jsonData = JSON.stringify(data);
                        localStorage.setItem(getFullKey(key), jsonData);
                        console.info('Storage cleanup successful, data saved');
                        return true;
                    } catch (e2) {
                        console.warn('Storage still full after cleanup:', key);
                    }
                }
                console.warn('Storage quota exceeded: not enough space to save data for key:', key);
            } else {
                console.error('Storage save error:', e);
            }
            return false;
        }
    }

    function save(key, data) {
        return safeSave(key, data);
    }

    function load(key) {
        try {
            var jsonData = localStorage.getItem(getFullKey(key));
            if (jsonData === null) {
                return null;
            }
            var parsed = JSON.parse(jsonData);
            return parsed;
        } catch (e) {
            console.error('Storage load error for key', key, ':', e);
            var backupData = loadBackup(key);
            if (backupData !== null) {
                console.warn('Recovered data from backup for key:', key);
                return backupData;
            }
            return null;
        }
    }

    function saveBackup(key, data) {
        try {
            var backupKey = key + '_backup';
            var jsonData = JSON.stringify(data);
            localStorage.setItem(getFullKey(backupKey), jsonData);
            return true;
        } catch (e) {
            console.warn('Storage backup save error for key', key, ':', e);
            return false;
        }
    }

    function loadBackup(key) {
        try {
            var backupKey = key + '_backup';
            var jsonData = localStorage.getItem(getFullKey(backupKey));
            if (jsonData === null) {
                return null;
            }
            var parsed = JSON.parse(jsonData);
            return parsed;
        } catch (e) {
            console.warn('Storage backup load error for key', key, ':', e);
            return null;
        }
    }

    function safeSaveWithBackup(key, data) {
        var backupKey = key + '_backup';
        var oldData = load(key);
        if (oldData !== null) {
            saveBackup(key, oldData);
        }
        return safeSave(key, data);
    }

    function loadWithDefault(key, defaultValue) {
        var result = load(key);
        if (result === null || result === undefined) {
            return defaultValue;
        }
        return result;
    }

    function remove(key) {
        try {
            localStorage.removeItem(getFullKey(key));
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    function clear() {
        try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf(PREFIX) === 0) {
                    keysToRemove.push(key);
                }
            }
            for (var j = 0; j < keysToRemove.length; j++) {
                localStorage.removeItem(keysToRemove[j]);
            }
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    function exists(key) {
        try {
            return localStorage.getItem(getFullKey(key)) !== null;
        } catch (e) {
            return false;
        }
    }

    function getKeys() {
        try {
            var appKeys = getAppKeys();
            return appKeys.map(function(fullKey) {
                return fullKey.substring(PREFIX.length);
            });
        } catch (e) {
            return [];
        }
    }

    return {
        save: save,
        load: load,
        loadWithDefault: loadWithDefault,
        remove: remove,
        clear: clear,
        exists: exists,
        estimateSize: estimateSize,
        getKeys: getKeys,
        cleanupOldData: cleanupOldData,
        saveBackup: saveBackup,
        loadBackup: loadBackup,
        safeSaveWithBackup: safeSaveWithBackup
    };
})();
