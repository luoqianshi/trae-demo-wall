var PitfallTracker = (function() {
    'use strict';

    var STORAGE_KEYS = {
        CHECKLIST: 'pitfall_checklist',
        LIKES: 'pitfall_likes',
        FAVORITES: 'pitfall_favorites'
    };

    function _getStorage(key) {
        var data = Storage.load(key);
        return data ? data : {};
    }

    function _setStorage(key, data) {
        Storage.save(key, data);
    }

    function markDone(pitfallId) {
        if (!pitfallId) return false;
        var checklist = _getStorage(STORAGE_KEYS.CHECKLIST);
        checklist[pitfallId] = true;
        _setStorage(STORAGE_KEYS.CHECKLIST, checklist);
        return true;
    }

    function markUndone(pitfallId) {
        if (!pitfallId) return false;
        var checklist = _getStorage(STORAGE_KEYS.CHECKLIST);
        delete checklist[pitfallId];
        _setStorage(STORAGE_KEYS.CHECKLIST, checklist);
        return true;
    }

    function isDone(pitfallId) {
        if (!pitfallId) return false;
        var checklist = _getStorage(STORAGE_KEYS.CHECKLIST);
        return checklist[pitfallId] === true;
    }

    function toggleDone(pitfallId) {
        if (isDone(pitfallId)) {
            markUndone(pitfallId);
            return false;
        } else {
            markDone(pitfallId);
            return true;
        }
    }

    function getRegionProgress(regionId) {
        if (!regionId || typeof PitfallsData === 'undefined') {
            return { completed: 0, total: 0, percent: 0 };
        }
        var pitfalls = PitfallsData.getPitfallsByRegion(regionId);
        var total = pitfalls.length;
        var completed = 0;
        for (var i = 0; i < pitfalls.length; i++) {
            if (isDone(pitfalls[i].id)) {
                completed++;
            }
        }
        return {
            completed: completed,
            total: total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    function getTotalProgress() {
        if (typeof PitfallsData === 'undefined') {
            return { completed: 0, total: 0, percent: 0 };
        }
        var allPitfalls = PitfallsData.getAllPitfalls();
        var total = allPitfalls.length;
        var completed = 0;
        for (var i = 0; i < allPitfalls.length; i++) {
            if (isDone(allPitfalls[i].pitfall.id)) {
                completed++;
            }
        }
        return {
            completed: completed,
            total: total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    function likeExperience(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var likes = _getStorage(STORAGE_KEYS.LIKES);
        var key = pitfallId + '_' + experienceIndex;
        likes[key] = true;
        _setStorage(STORAGE_KEYS.LIKES, likes);
        return true;
    }

    function unlikeExperience(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var likes = _getStorage(STORAGE_KEYS.LIKES);
        var key = pitfallId + '_' + experienceIndex;
        delete likes[key];
        _setStorage(STORAGE_KEYS.LIKES, likes);
        return true;
    }

    function isLiked(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var likes = _getStorage(STORAGE_KEYS.LIKES);
        var key = pitfallId + '_' + experienceIndex;
        return likes[key] === true;
    }

    function toggleLike(pitfallId, experienceIndex) {
        if (isLiked(pitfallId, experienceIndex)) {
            unlikeExperience(pitfallId, experienceIndex);
            return false;
        } else {
            likeExperience(pitfallId, experienceIndex);
            return true;
        }
    }

    function getLikeCount(pitfall, experienceIndex) {
        if (!pitfall || !pitfall.experiences || !pitfall.experiences[experienceIndex]) {
            return 0;
        }
        var baseLikes = pitfall.experiences[experienceIndex].likes || 0;
        var extra = isLiked(pitfall.id, experienceIndex) ? 1 : 0;
        return baseLikes + extra;
    }

    function favoriteExperience(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var favorites = _getStorage(STORAGE_KEYS.FAVORITES);
        var key = pitfallId + '_' + experienceIndex;
        favorites[key] = true;
        _setStorage(STORAGE_KEYS.FAVORITES, favorites);
        return true;
    }

    function unfavoriteExperience(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var favorites = _getStorage(STORAGE_KEYS.FAVORITES);
        var key = pitfallId + '_' + experienceIndex;
        delete favorites[key];
        _setStorage(STORAGE_KEYS.FAVORITES, favorites);
        return true;
    }

    function isFavorited(pitfallId, experienceIndex) {
        if (!pitfallId || typeof experienceIndex !== 'number') return false;
        var favorites = _getStorage(STORAGE_KEYS.FAVORITES);
        var key = pitfallId + '_' + experienceIndex;
        return favorites[key] === true;
    }

    function toggleFavorite(pitfallId, experienceIndex) {
        if (isFavorited(pitfallId, experienceIndex)) {
            unfavoriteExperience(pitfallId, experienceIndex);
            return false;
        } else {
            favoriteExperience(pitfallId, experienceIndex);
            return true;
        }
    }

    function resetAll() {
        Storage.remove(STORAGE_KEYS.CHECKLIST);
        Storage.remove(STORAGE_KEYS.LIKES);
        Storage.remove(STORAGE_KEYS.FAVORITES);
    }

    return {
        markDone: markDone,
        markUndone: markUndone,
        isDone: isDone,
        toggleDone: toggleDone,
        getRegionProgress: getRegionProgress,
        getTotalProgress: getTotalProgress,
        likeExperience: likeExperience,
        unlikeExperience: unlikeExperience,
        isLiked: isLiked,
        toggleLike: toggleLike,
        getLikeCount: getLikeCount,
        favoriteExperience: favoriteExperience,
        unfavoriteExperience: unfavoriteExperience,
        isFavorited: isFavorited,
        toggleFavorite: toggleFavorite,
        resetAll: resetAll
    };
})();
