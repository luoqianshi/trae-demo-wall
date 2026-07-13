var FavoritesHistory = (function() {
    var STORAGE_KEYS = {
        FAVORITES: 'favorites',
        HISTORY: 'history'
    };

    var MAX_HISTORY = 50;
    var RECENT_LIMIT = 5;

    function getFavoritesData() {
        var data = Storage.load(STORAGE_KEYS.FAVORITES);
        return data ? data : { article: {}, tool: {}, step: {} };
    }

    function saveFavoritesData(data) {
        Storage.save(STORAGE_KEYS.FAVORITES, data);
    }

    function getHistoryData() {
        var data = Storage.load(STORAGE_KEYS.HISTORY);
        return data ? data : { article: [], tool: [], step: [] };
    }

    function saveHistoryData(data) {
        Storage.save(STORAGE_KEYS.HISTORY, data);
    }

    function addFavorite(type, id, data) {
        if (!type || !id) return false;
        var favorites = getFavoritesData();
        if (!favorites[type]) {
            favorites[type] = {};
        }
        favorites[type][id] = {
            id: id,
            data: data || {},
            addedAt: Date.now()
        };
        saveFavoritesData(favorites);
        return true;
    }

    function removeFavorite(type, id) {
        if (!type || !id) return false;
        var favorites = getFavoritesData();
        if (favorites[type] && favorites[type][id]) {
            delete favorites[type][id];
            saveFavoritesData(favorites);
            return true;
        }
        return false;
    }

    function isFavorite(type, id) {
        if (!type || !id) return false;
        var favorites = getFavoritesData();
        return !!(favorites[type] && favorites[type][id]);
    }

    function getFavorites(type) {
        var favorites = getFavoritesData();
        if (type) {
            var items = favorites[type] || {};
            return Object.keys(items).map(function(key) {
                return items[key];
            }).sort(function(a, b) {
                return b.addedAt - a.addedAt;
            });
        }
        var all = [];
        Object.keys(favorites).forEach(function(t) {
            Object.keys(favorites[t]).forEach(function(key) {
                all.push(favorites[t][key]);
            });
        });
        return all.sort(function(a, b) {
            return b.addedAt - a.addedAt;
        });
    }

    function addHistory(type, id, data) {
        if (!type || !id) return;
        var history = getHistoryData();
        if (!history[type]) {
            history[type] = [];
        }
        history[type] = history[type].filter(function(item) {
            return item.id !== id;
        });
        history[type].unshift({
            id: id,
            data: data || {},
            visitedAt: Date.now()
        });
        if (history[type].length > MAX_HISTORY) {
            history[type] = history[type].slice(0, MAX_HISTORY);
        }
        saveHistoryData(history);
    }

    function getHistory(type, limit) {
        var history = getHistoryData();
        if (type) {
            var items = history[type] || [];
            return limit ? items.slice(0, limit) : items;
        }
        var all = [];
        Object.keys(history).forEach(function(t) {
            (history[t] || []).forEach(function(item) {
                all.push(item);
            });
        });
        all.sort(function(a, b) {
            return b.visitedAt - a.visitedAt;
        });
        return limit ? all.slice(0, limit) : all;
    }

    function clearHistory(type) {
        var history = getHistoryData();
        if (type) {
            history[type] = [];
        } else {
            history = { article: [], tool: [], step: [] };
        }
        saveHistoryData(history);
    }

    function getRecent(limit) {
        limit = limit || RECENT_LIMIT;
        return getHistory(null, limit);
    }

    function toggleFavorite(type, id, data) {
        if (isFavorite(type, id)) {
            removeFavorite(type, id);
            return false;
        } else {
            addFavorite(type, id, data);
            return true;
        }
    }

    return {
        addFavorite: addFavorite,
        removeFavorite: removeFavorite,
        isFavorite: isFavorite,
        getFavorites: getFavorites,
        toggleFavorite: toggleFavorite,
        addHistory: addHistory,
        getHistory: getHistory,
        clearHistory: clearHistory,
        getRecent: getRecent
    };
})();
