var MapLocator = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 地图定位系统 - 网页版
    // 管理地点连接、距离计算、LOD判定
    // ═══════════════════════════════════════════════════════════

    var DEFAULT_DISTANCE = 50;
    var NEAR_RADIUS = 1.0;
    var MID_RADIUS = 3.0;
    var MAX_CACHE_SIZE = 500;

    var locations = {};
    var adjacencyMap = {};
    var _locationCache = {};

    // ── 默认连接关系 ──────────────────────────────────────

    var DEFAULT_CONNECTIONS = {
        teahouse_indoor: ['east_street', 'teahouse_dorm', 'market'],
        teahouse_dorm: ['teahouse_indoor', 'east_street'],
        forge_indoor: ['east_street', 'forge_home', 'north_mountain'],
        forge_home: ['forge_indoor', 'east_street'],
        market: ['teahouse_indoor', 'east_street', 'west_alley', 'south_street'],
        east_street: ['teahouse_indoor', 'teahouse_dorm', 'forge_indoor', 'forge_home', 'market', 'west_alley', 'south_street'],
        west_alley: ['market', 'east_street', 'south_street'],
        south_street: ['market', 'east_street', 'west_alley'],
        north_cabin_indoor: ['north_mountain', 'east_street'],
        north_mountain: ['forge_indoor', 'north_cabin_indoor'],
        teahouse: ['east_street', 'market'],
        forge: ['east_street'],
        dock: ['south_street', 'market'],
        tavern: ['east_street', 'market'],
        shrine: ['north_mountain', 'east_street'],
        back_mountain: ['north_mountain', 'shrine'],
        riverside: ['south_street', 'dock'],
        old_well: ['west_alley', 'back_mountain'],
        sect_gate: ['north_mountain', 'east_street'],
        sect_outer: ['sect_gate', 'north_mountain'],
        training_ground: ['sect_outer'],
        library: ['sect_outer', 'academy'],
        academy: ['east_street', 'library'],
        herb_garden: ['north_mountain', 'back_mountain'],
        herb_hut: ['herb_garden'],
        workshop: ['east_street', 'market'],
        kitchen: ['teahouse', 'market'],
        bridge: ['riverside', 'south_street'],
        shop: ['market', 'east_street'],
        inn: ['east_street', 'market'],
        rooftop: ['teahouse', 'inn'],
        official_road: ['east_street', 'sect_gate']
    };

    // ── 初始化 ────────────────────────────────────────────

    function loadLocations(locationsData) {
        locations = locationsData || {};
        _buildDefaultAdjacency();
        _locationCache = {};
    }

    function _buildDefaultAdjacency() {
        adjacencyMap = {};

        for (var locId in DEFAULT_CONNECTIONS) {
            if (DEFAULT_CONNECTIONS.hasOwnProperty(locId)) {
                adjacencyMap[locId] = {};
                var connected = DEFAULT_CONNECTIONS[locId];
                for (var i = 0; i < connected.length; i++) {
                    adjacencyMap[locId][connected[i]] = DEFAULT_DISTANCE;
                }
            }
        }

        // 确保双向连接
        for (var locA in adjacencyMap) {
            if (adjacencyMap.hasOwnProperty(locA)) {
                for (var locB in adjacencyMap[locA]) {
                    if (adjacencyMap[locA].hasOwnProperty(locB)) {
                        if (!adjacencyMap[locB]) {
                            adjacencyMap[locB] = {};
                        }
                        if (!adjacencyMap[locB][locA]) {
                            adjacencyMap[locB][locA] = adjacencyMap[locA][locB];
                        }
                    }
                }
            }
        }
    }

    // ── 距离计算 ──────────────────────────────────────────

    function calculateDistance(locA, locB) {
        if (locA === locB) { return 0; }

        var cacheKey = _getCacheKey(locA, locB);
        if (_locationCache[cacheKey] !== undefined) {
            return _locationCache[cacheKey];
        }

        var distance = _bfsDistance(locA, locB);

        // 缓存结果（带上限检查）
        if (Object.keys(_locationCache).length >= MAX_CACHE_SIZE) {
            var firstKey = Object.keys(_locationCache)[0];
            delete _locationCache[firstKey];
        }
        _locationCache[cacheKey] = distance;

        return distance;
    }

    function _bfsDistance(start, end) {
        if (!adjacencyMap[start] || !adjacencyMap[end]) {
            return DEFAULT_DISTANCE;
        }
        if (start === end) { return 0; }

        var queue = [{loc: start, dist: 0}];
        var visited = {};
        visited[start] = true;

        while (queue.length > 0) {
            var current = queue.shift();
            if (current.loc === end) {
                return current.dist;
            }

            var neighbors = adjacencyMap[current.loc] || {};
            for (var neighbor in neighbors) {
                if (neighbors.hasOwnProperty(neighbor) && !visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push({loc: neighbor, dist: current.dist + 1});
                }
            }
        }

        return DEFAULT_DISTANCE;
    }

    // ── LOD 计算 ──────────────────────────────────────────

    function calculateLodLevel(npcLocation, playerLocation) {
        if (!playerLocation) { return 'near'; }
        if (npcLocation === playerLocation) { return 'near'; }

        var distance = calculateDistance(npcLocation, playerLocation);

        if (distance <= NEAR_RADIUS) { return 'near'; }
        if (distance <= MID_RADIUS) { return 'mid'; }
        return 'far';
    }

    // ── 路径查找 ──────────────────────────────────────────

    function getPathToLocation(start, end) {
        if (start === end) { return [start]; }
        if (!adjacencyMap[start]) { return []; }

        var queue = [{path: [start]}];
        var visited = {};
        visited[start] = true;

        while (queue.length > 0) {
            var current = queue.shift();
            var lastLoc = current.path[current.path.length - 1];

            if (lastLoc === end) {
                return current.path;
            }

            var neighbors = adjacencyMap[lastLoc] || {};
            for (var neighbor in neighbors) {
                if (neighbors.hasOwnProperty(neighbor) && !visited[neighbor]) {
                    visited[neighbor] = true;
                    var newPath = current.path.slice();
                    newPath.push(neighbor);
                    queue.push({path: newPath});
                }
            }
        }

        return [];
    }

    // ── 辅助方法 ──────────────────────────────────────────

    function getAdjacentLocations(locId) {
        if (!adjacencyMap[locId]) { return []; }

        var adjacent = [];
        for (var neighbor in adjacencyMap[locId]) {
            if (adjacencyMap[locId].hasOwnProperty(neighbor)) {
                adjacent.push({
                    id: neighbor,
                    distance: adjacencyMap[locId][neighbor]
                });
            }
        }
        return adjacent;
    }

    function isLocationReachable(fromLoc, toLoc) {
        if (fromLoc === toLoc) { return true; }
        return adjacencyMap[fromLoc] && adjacencyMap[fromLoc][toLoc] !== undefined;
    }

    function clearCache() {
        _locationCache = {};
    }

    function getCacheStats() {
        return {
            cachedRoutes: Object.keys(_locationCache).length,
            totalLocations: Object.keys(locations).length,
            totalConnections: Object.keys(adjacencyMap).length
        };
    }

    function _getCacheKey(locA, locB) {
        var ids = [locA, locB].sort();
        return ids[0] + '_' + ids[1];
    }

    // ── 导出 ──────────────────────────────────────────────

    return {
        loadLocations: loadLocations,
        calculateDistance: calculateDistance,
        calculateLodLevel: calculateLodLevel,
        getPathToLocation: getPathToLocation,
        getAdjacentLocations: getAdjacentLocations,
        isLocationReachable: isLocationReachable,
        clearCache: clearCache,
        getCacheStats: getCacheStats,

        // 常量
        NEAR_RADIUS: NEAR_RADIUS,
        MID_RADIUS: MID_RADIUS,
        DEFAULT_DISTANCE: DEFAULT_DISTANCE
    };
})();

window.MapLocator = MapLocator;
