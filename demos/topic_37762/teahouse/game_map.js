var GameMap = (function() {
    'use strict';

    // ==================== 常量 ====================
    var TILE_SIZE = 48;
    var PLAYER_SPEED = 3.5;
    var PLAYER_HALF = 8;
    var INTERACT_DIST = 4.0;
    var SCENE_OUTDOOR = 'outdoor';
    var SCENE_INDOOR = 'indoor';
    var SCENE_EXPLORE = 'explore';

    // ==================== 内部状态 ====================
    var _canvas = null;
    var _ctx = null;
    var _animId = null;
    var _running = false;
    var _scene = SCENE_OUTDOOR;
    var _currentMap = null;
    var _mapW = 0;
    var _mapH = 0;
    var _exploreAreaId = null;
    var _prevTileCol = -1;
    var _prevTileRow = -1;

    // 玩家
    var _player = {
        px: 0,
        py: 0,
        bounce: 0,
        bouncePhase: 0,
        moving: false
    };

    // 相机
    var _cam = { x: 0, y: 0 };

    // 当前室内地点ID（用于追踪在三界中的位置）
    var _currentIndoorId = '';

    // 输入
    var _keys = {};

    // NPC
    var _npcs = [];

    // 天气粒子
    var _particles = [];

    // 夜晚星星
    var _stars = [];
    var _starsInited = false;

    // 当前交互提示
    var _interactHint = '';

    // 淡入淡出效果
    var _fadeAlpha = 0;

    // 回调
    var _cb = {
        enterIndoor: null,
        exitIndoor: null,
        enterExplore: null,
        exitExplore: null,
        interact: null,
        action: null
    };

    // 地点查找表（NpcMovement兼容）
    var _locLookup = {};

    // 室内颜色映射
    var _indoorColorMap = {};

    // 室内可行走地形
    var _indoorWalkable = [0, 2, 3, 5, 6]; // FLOOR, COUNTER, SEAT, INDOOR_DOOR, DECOR

    // ==================== 初始化查找表 ====================
    function _initLookups() {
        var locs = window.YunluoMap ? YunluoMap.LOCATIONS : [];
        for (var i = 0; i < locs.length; i++) {
            var loc = locs[i];
            _locLookup[loc.id] = {
                col: loc.x, row: loc.y, id: loc.id,
                name: loc.name, emoji: loc.emoji,
                isIndoor: !!loc.isIndoor, isExplore: !!loc.isExplore,
                minLevel: loc.minLevel, cost: loc.cost,
                doorX: loc.doorX, doorY: loc.doorY,
                buildingType: loc.buildingType || 'house'
            };
        }

        // 室内颜色
        if (window.YunluoMap) {
            var tc = YunluoMap.TERRAIN_COLORS;
            _indoorColorMap = {};
            _indoorColorMap[0] = tc.floor;
            _indoorColorMap[1] = tc.wall;
            _indoorColorMap[2] = tc.counter;
            _indoorColorMap[3] = tc.seat;
            _indoorColorMap[4] = tc.kitchen;
            _indoorColorMap[5] = tc.door;
            _indoorColorMap[6] = tc.decor;
            _indoorColorMap[11] = tc.portal;
            _indoorColorMap[12] = tc.indoor_water;
        }
    }

    // ==================== 坐标转换 ====================

    // 获取玩家当前tile坐标（统一俯视）
    function _playerTile() {
        return {
            col: Math.floor(_player.px / TILE_SIZE),
            row: Math.floor(_player.py / TILE_SIZE)
        };
    }

    // ==================== 地形颜色 ====================
    function _getTerrainColor(terrain) {
        if (_scene === SCENE_INDOOR) {
            return _indoorColorMap[terrain] || '#333333';
        }
        // 室外和探索区使用季节颜色
        var season = 'spring';
        if (window.GameTime) {
            season = GameTime.getSeason().id || 'spring';
        }
        var tints = (window.YunluoMap && YunluoMap.SEASON_TINTS[season]) || {};
        return tints[terrain] || (window.YunluoMap && YunluoMap.TERRAIN_COLORS[terrain]) || '#333333';
    }

    // ==================== 碰撞检测 ====================
    function _isWalkable(col, row) {
        if (!_currentMap) return false;
        if (col < 0 || row < 0 || col >= _mapW || row >= _mapH) return false;
        var t = _currentMap[row][col];
        if (t === undefined || t === null) return false;
        if (_scene === SCENE_INDOOR) {
            return _indoorWalkable.indexOf(t) >= 0;
        }
        return window.YunluoMap ? YunluoMap.WALKABLE.indexOf(t) >= 0 : (t === 0 || t === 1 || t === 4 || t === 7 || t === 8 || t === 9);
    }

    function _canMoveTo(px, py) {
        var corners = [
            { x: px - PLAYER_HALF, y: py - PLAYER_HALF },
            { x: px + PLAYER_HALF, y: py - PLAYER_HALF },
            { x: px - PLAYER_HALF, y: py + PLAYER_HALF },
            { x: px + PLAYER_HALF, y: py + PLAYER_HALF }
        ];
        for (var i = 0; i < 4; i++) {
            var c = Math.floor(corners[i].x / TILE_SIZE);
            var r = Math.floor(corners[i].y / TILE_SIZE);
            if (!_isWalkable(c, r)) return false;
        }
        return true;
    }

    // ==================== 输入处理 ====================
    var _lastInteractTime = 0;
    function _onKeyDown(e) {
        var key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'tab', 'escape'].indexOf(key) >= 0) {
            e.preventDefault();
        }
        _keys[key] = true;

        if (key === 'e') {
            var now = Date.now();
            if (now - _lastInteractTime < 300) return;
            _lastInteractTime = now;
            try { _handleInteract(); } catch(err) { if (window.console) console.error('[GameMap] _handleInteract error:', err); }
        } else if (key === 'tab') {
            e.preventDefault();
            try { if (_cb.action) _cb.action(); } catch(err) { if (window.console) console.error('[GameMap] action error:', err); }
        } else if (key === 'escape') {
            try { _handleEscape(); } catch(err) { if (window.console) console.error('[GameMap] escape error:', err); }
        }
    }

    function _onKeyUp(e) {
        _keys[e.key.toLowerCase()] = false;
    }

    function _handleInteract() {
        var target = _getInteractTarget();
        if (target && _cb.interact) {
            _cb.interact({ type: target.type, id: target.id, name: target.name });
        }
    }

    function _handleEscape() {
        if (_scene === SCENE_INDOOR) {
            if (_cb.exitIndoor) _cb.exitIndoor();
        } else if (_scene === SCENE_EXPLORE) {
            if (_cb.exitExplore) _cb.exitExplore();
        }
    }

    // ==================== 交互目标检测 ====================
    // NPC近距离阈值：NPC在1.5格内时优先对话
    var NPC_CLOSE_DIST = 1.5;

    function _getInteractTarget() {
        var pt = _playerTile();
        var npcTarget = null;
        var npcDist = INTERACT_DIST;
        var locTarget = null;
        var locDist = INTERACT_DIST;

        // 检查NPC（使用像素距离）
        for (var i = 0; i < _npcs.length; i++) {
            var npc = _npcs[i];
            var dx = _player.px - npc.x;
            var dy = _player.py - npc.y;
            var dist = Math.sqrt(dx * dx + dy * dy) / TILE_SIZE;
            if (dist < npcDist) {
                npcDist = dist;
                npcTarget = { type: 'npc', id: npc.id, name: npc.name };
            }
        }

        // 检查地点（仅室外）
        if (_scene === SCENE_OUTDOOR && window.YunluoMap) {
            var teahouseLevel = (window.Teahouse && Teahouse.getStatus) ? Teahouse.getStatus().level : 1;
            var locs = YunluoMap.LOCATIONS;
            for (var j = 0; j < locs.length; j++) {
                var loc = locs[j];
                // 等级门控
                if (loc.minLevel && teahouseLevel < loc.minLevel) continue;
                // 通行道具门控（三界入口需要对应道具）
                if (loc.realmItem && window.Teahouse && Teahouse.hasRealmAccess && !Teahouse.hasRealmAccess(loc.id)) continue;
                var lDist = Math.sqrt(Math.pow(pt.col - loc.x, 2) + Math.pow(pt.row - loc.y, 2));
                if (lDist < locDist) {
                    locDist = lDist;
                    var lType = 'location';
                    if (loc.isIndoor) lType = 'indoor';
                    else if (loc.isExplore) lType = 'explore';
                    locTarget = { type: lType, id: loc.id, name: loc.name, minLevel: loc.minLevel };
                }
            }
        }

        // 检查室内门和三界传送门（室内场景，检查玩家附近1格内）
        var indoorTarget = null;
        if (_scene === SCENE_INDOOR && window.YunluoMap) {
            for (var dr = -1; dr <= 1; dr++) {
                for (var dc = -1; dc <= 1; dc++) {
                    var cr = pt.row + dr, cc = pt.col + dc;
                    if (cr >= 0 && cr < _mapH && cc >= 0 && cc < _mapW) {
                        var t = _currentMap[cr][cc];
                        if (t === YunluoMap.TERRAIN.INDOOR_DOOR) {
                            indoorTarget = { type: 'exit_indoor', id: 'exit', name: '出门' };
                        }
                        // 三界传送门检测（仅在茶馆室内地图中，20×15）
                        if (t === YunluoMap.TERRAIN.REALM_PORTAL) {
                            // 根据传送门位置判断通往哪个界
                            var realmId = null;
                            if (cc === 3) realmId = 'demon_realm';       // 左：魔界
                            else if (cc === 7) realmId = 'spirit_realm';  // 中：灵界
                            else if (cc === 12) realmId = 'immortal_realm'; // 右：仙界
                            if (realmId && window.Teahouse && Teahouse.hasRealmAccess && Teahouse.hasRealmAccess(realmId)) {
                                var realmNames = { demon_realm: '魔界·焰城', spirit_realm: '灵界·幽都', immortal_realm: '仙界·云阙' };
                                indoorTarget = { type: 'enter_realm', id: realmId, name: realmNames[realmId] || '未知' };
                            }
                        }
                    }
                }
            }
        }

        // 探索场景：检测采集点和出口
        var exploreTarget = null;
        if (_scene === SCENE_EXPLORE && window.YunluoMap && _exploreAreaId) {
            var area = YunluoMap.getExploreArea(_exploreAreaId);
            if (area && area.collectPoints) {
                for (var ci = 0; ci < area.collectPoints.length; ci++) {
                    var cp = area.collectPoints[ci];
                    var cpDist = Math.sqrt(Math.pow(pt.col - cp.x, 2) + Math.pow(pt.row - cp.y, 2));
                    if (cpDist < INTERACT_DIST) {
                        exploreTarget = { type: 'collect', id: cp.name, name: cp.name, areaId: _exploreAreaId };
                        break;
                    }
                }
            }
            // 探索场景出口检测（地图边缘）
            if (!exploreTarget && (pt.col <= 0 || pt.col >= _mapW - 1 || pt.row <= 0 || pt.row >= _mapH - 1)) {
                exploreTarget = { type: 'exit_explore', id: 'exit', name: '返回云落镇' };
            }
        }

        // 室内目标优先级最高
        if (indoorTarget) return indoorTarget;

        // 探索目标次之
        if (exploreTarget) return exploreTarget;

        // NPC和地点冲突解决：
        // - NPC非常近（<1.5格）时优先对话
        // - 地点是indoor/explore类型时优先进入（玩家可以走远一点再对话NPC）
        // - 其他情况选距离最近的
        if (npcTarget && locTarget) {
            if (npcDist < NPC_CLOSE_DIST) return npcTarget;
            if (locTarget.type === 'indoor' || locTarget.type === 'explore') return locTarget;
            return npcDist <= locDist ? npcTarget : locTarget;
        }

        return npcTarget || locTarget;
    }

    // ==================== 玩家移动 ====================
    function _updatePlayer() {
        var dx = 0, dy = 0;
        if (_keys['w'] || _keys['arrowup']) dy -= PLAYER_SPEED;
        if (_keys['s'] || _keys['arrowdown']) dy += PLAYER_SPEED;
        if (_keys['a'] || _keys['arrowleft']) dx -= PLAYER_SPEED;
        if (_keys['d'] || _keys['arrowright']) dx += PLAYER_SPEED;

        // 对角线移动归一化
        if (dx !== 0 && dy !== 0) {
            var factor = 0.7071; // 1/sqrt(2)
            dx *= factor;
            dy *= factor;
        }

        _player.moving = (dx !== 0 || dy !== 0);

        if (_player.moving) {
            // 分轴碰撞检测
            if (dx !== 0 && _canMoveTo(_player.px + dx, _player.py)) {
                _player.px += dx;
            }
            if (dy !== 0 && _canMoveTo(_player.px, _player.py + dy)) {
                _player.py += dy;
            }
            // 行走弹跳
            _player.bouncePhase += 0.25;
            _player.bounce = Math.sin(_player.bouncePhase) * 3;
        } else {
            _player.bounce = 0;
            _player.bouncePhase = 0;
        }

        // 检查门
        _checkDoor();

        // 更新交互提示
        _updateInteractHint();
    }

    // ==================== 门检测 ====================
    function _checkDoor() {
        // 不再自动触发门，由按E交互处理
        // 只更新交互提示
    }

    // ==================== 交互提示 ====================
    function _updateInteractHint() {
        var target = _getInteractTarget();
        if (!target) {
            _interactHint = '';
            return;
        }
        if (target.type === 'npc') {
            _interactHint = '按E与' + target.name + '对话';
        } else if (target.type === 'indoor') {
            _interactHint = '按E进入' + target.name;
        } else if (target.type === 'explore') {
            _interactHint = '按E探索' + target.name;
        } else if (target.type === 'exit_indoor') {
            _interactHint = '按E出门';
        } else if (target.type === 'enter_realm') {
            _interactHint = '按E进入' + target.name;
        } else if (target.type === 'collect') {
            _interactHint = '按E采集' + target.name;
        } else if (target.type === 'exit_explore') {
            _interactHint = '按E返回云落镇';
        } else {
            _interactHint = '按E进入' + target.name;
        }
    }

    // ==================== 相机 ====================
    function _updateCamera() {
        var targetX = _player.px - _canvas.width / 2;
        var targetY = _player.py - _canvas.height / 2;
        _cam.x += (targetX - _cam.x) * 0.1;
        _cam.y += (targetY - _cam.y) * 0.1;

        // 相机边界约束，防止漂移到地图外
        var mapPxW = _mapW * TILE_SIZE;
        var mapPxH = _mapH * TILE_SIZE;
        if (_cam.x < 0) _cam.x = 0;
        if (_cam.y < 0) _cam.y = 0;
        if (_cam.x > mapPxW - _canvas.width) _cam.x = mapPxW - _canvas.width;
        if (_cam.y > mapPxH - _canvas.height) _cam.y = mapPxH - _canvas.height;
    }

    // ==================== 天气粒子 ====================
    function _initStars() {
        if (_starsInited) return;
        _starsInited = true;
        _stars = [];
        for (var i = 0; i < 80; i++) {
            _stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    function _updateParticles() {
        var weather = window.GameTime ? GameTime.getWeather() : null;
        var weatherId = weather ? weather.id : 'sunny';

        // 根据天气生成粒子
        if (weatherId === 'rainy' || weatherId === 'stormy' || weatherId === 'drizzle') {
            var count = weatherId === 'stormy' ? 5 : (weatherId === 'rainy' ? 3 : 2);
            for (var i = 0; i < count; i++) {
                _particles.push({
                    x: Math.random() * _canvas.width,
                    y: -10,
                    vx: weatherId === 'stormy' ? (Math.random() - 0.3) * 4 : (Math.random() - 0.5) * 1,
                    vy: weatherId === 'stormy' ? 12 + Math.random() * 6 : (weatherId === 'rainy' ? 8 + Math.random() * 4 : 4 + Math.random() * 2),
                    type: 'rain',
                    life: 1
                });
            }
        } else if (weatherId === 'snowy') {
            if (Math.random() < 0.3) {
                _particles.push({
                    x: Math.random() * _canvas.width,
                    y: -10,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 1 + Math.random() * 1.5,
                    type: 'snow',
                    life: 1
                });
            }
        }

        // 更新粒子
        for (var j = _particles.length - 1; j >= 0; j--) {
            var p = _particles[j];
            p.x += p.vx;
            p.y += p.vy;
            if (p.type === 'snow') {
                p.vx += (Math.random() - 0.5) * 0.3;
                if (p.vx > 2) p.vx = 2;
                if (p.vx < -2) p.vx = -2;
            }
            if (p.y > _canvas.height + 10 || p.x < -20 || p.x > _canvas.width + 20) {
                _particles.splice(j, 1);
            }
        }

        // 限制粒子数量
        if (_particles.length > 500) {
            _particles.splice(0, _particles.length - 500);
        }
    }

    // ==================== 渲染：室外俯视地图 ====================
    function _renderOutdoor() {
        if (!_currentMap) return;
        var cw = _canvas.width;
        var ch = _canvas.height;

        // 计算可见tile范围
        var startCol = Math.max(0, Math.floor(_cam.x / TILE_SIZE));
        var startRow = Math.max(0, Math.floor(_cam.y / TILE_SIZE));
        var endCol = Math.min(_mapW - 1, Math.ceil((_cam.x + cw) / TILE_SIZE));
        var endRow = Math.min(_mapH - 1, Math.ceil((_cam.y + ch) / TILE_SIZE));

        // 渲染tile
        for (var row = startRow; row <= endRow; row++) {
            for (var col = startCol; col <= endCol; col++) {
                var terrain = _currentMap[row][col];
                var color = _getTerrainColor(terrain);
                var sx = col * TILE_SIZE - _cam.x;
                var sy = row * TILE_SIZE - _cam.y;
                _ctx.fillStyle = color;
                _ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                _ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                _ctx.lineWidth = 0.5;
                _ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
        }

        // 渲染地点标记
        _renderLocationMarkers();

        // 渲染NPC和玩家（按row深度排序）
        var entities = [];

        // 玩家
        entities.push({
            type: 'player',
            row: Math.floor(_player.py / TILE_SIZE)
        });

        // NPC
        for (var i = 0; i < _npcs.length; i++) {
            var npc = _npcs[i];
            entities.push({
                type: 'npc',
                data: npc,
                row: Math.floor(npc.y / TILE_SIZE)
            });
        }

        // 按row排序
        entities.sort(function(a, b) { return a.row - b.row; });

        // 渲染
        for (var j = 0; j < entities.length; j++) {
            var e = entities[j];
            if (e.type === 'player') {
                _renderPlayerTopDown();
            } else {
                _renderNpcTopDown(e.data);
            }
        }
    }

    // ==================== 渲染：室内俯视地图 ====================
    function _renderIndoor() {
        if (!_currentMap) return;
        var cw = _canvas.width;
        var ch = _canvas.height;

        // 获取三界特殊颜色
        var realmColors = (window.YunluoMap && _currentIndoorId) ? YunluoMap.REALM_COLORS[_currentIndoorId] : null;

        // 计算可见tile范围
        var startCol = Math.max(0, Math.floor(_cam.x / TILE_SIZE));
        var startRow = Math.max(0, Math.floor(_cam.y / TILE_SIZE));
        var endCol = Math.min(_mapW - 1, Math.ceil((_cam.x + cw) / TILE_SIZE));
        var endRow = Math.min(_mapH - 1, Math.ceil((_cam.y + ch) / TILE_SIZE));

        // 渲染tile
        for (var row = startRow; row <= endRow; row++) {
            for (var col = startCol; col <= endCol; col++) {
                var terrain = _currentMap[row][col];
                var color;
                // 三界场景使用特殊颜色
                if (realmColors) {
                    if (terrain === 0) color = realmColors.floor;       // FLOOR
                    else if (terrain === 1) color = realmColors.wall;    // WALL
                    else if (terrain === 2) color = realmColors.counter; // COUNTER
                    else if (terrain === 3) color = realmColors.seat;   // SEAT
                    else if (terrain === 4) color = _indoorColorMap[4]; // KITCHEN（三界无厨房）
                    else if (terrain === 5) color = _indoorColorMap[5]; // INDOOR_DOOR
                    else if (terrain === 6) color = realmColors.decor;  // DECOR
                    else if (terrain === 11) color = _indoorColorMap[11]; // REALM_PORTAL
                    else if (terrain === 12) color = realmColors.water; // INDOOR_WATER
                    else color = _indoorColorMap[terrain] || '#333333';
                } else {
                    color = _indoorColorMap[terrain] || '#333333';
                }
                var sx = col * TILE_SIZE - _cam.x;
                var sy = row * TILE_SIZE - _cam.y;
                _ctx.fillStyle = color;
                _ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                _ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                _ctx.lineWidth = 0.5;
                _ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
        }

        // 室内装饰标签
        _renderIndoorLabels();

        // 渲染NPC和玩家（按row深度排序）
        var entities = [];
        entities.push({ type: 'player', row: Math.floor(_player.py / TILE_SIZE) });
        for (var i = 0; i < _npcs.length; i++) {
            var npc = _npcs[i];
            entities.push({ type: 'npc', data: npc, row: Math.floor(npc.y / TILE_SIZE) });
        }
        entities.sort(function(a, b) { return a.row - b.row; });
        for (var j = 0; j < entities.length; j++) {
            var e = entities[j];
            if (e.type === 'player') {
                _renderPlayerTopDown();
            } else {
                _renderNpcTopDown(e.data);
            }
        }
    }

    // ==================== 渲染：探索区俯视地图 ====================
    function _renderExplore() {
        if (!_currentMap) return;
        var cw = _canvas.width;
        var ch = _canvas.height;

        var startCol = Math.max(0, Math.floor(_cam.x / TILE_SIZE));
        var startRow = Math.max(0, Math.floor(_cam.y / TILE_SIZE));
        var endCol = Math.min(_mapW - 1, Math.ceil((_cam.x + cw) / TILE_SIZE));
        var endRow = Math.min(_mapH - 1, Math.ceil((_cam.y + ch) / TILE_SIZE));

        for (var row = startRow; row <= endRow; row++) {
            for (var col = startCol; col <= endCol; col++) {
                var terrain = _currentMap[row][col];
                var color = _getTerrainColor(terrain);
                var sx = col * TILE_SIZE - _cam.x;
                var sy = row * TILE_SIZE - _cam.y;
                _ctx.fillStyle = color;
                _ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                _ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                _ctx.lineWidth = 0.5;
                _ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
        }

        // 探索区采集点标记
        _renderExploreCollectPoints();

        // 渲染玩家
        _renderPlayerTopDown();
    }

    // ==================== 建筑颜色配置 ====================
    var _buildingStyles = {
        teahouse:  { roof: '#8B4513', wall: '#DEB887', sign: '#cc3333', chimney: true },
        market:    { roof: '#CD5C5C', wall: '#DEB887', sign: '#daa520' },
        herb:      { roof: '#2E8B57', wall: '#DEB887', sign: '#2E8B57' },
        forge:     { roof: '#696969', wall: '#A0522D', sign: '#696969', chimney: true },
        tavern:    { roof: '#8B0000', wall: '#DEB887', sign: '#8B0000', flag: true },
        academy:   { roof: '#4682B4', wall: '#F5F5DC', sign: '#4682B4' },
        dock:      { roof: '#DAA520', wall: '#8B7355', sign: '#DAA520' },
        shrine:    { roof: '#800080', wall: '#DEB887', sign: '#800080' },
        cabin:     { roof: '#556B2F', wall: '#8B7355', sign: '#556B2F' },
        house:     { roof: '#8B4513', wall: '#DEB887', sign: '#8B4513' },
        explore:   null
    };

    // ==================== 建筑绘制函数 ====================
    function _drawBuilding(ctx, sx, sy, type, name) {
        var style = _buildingStyles[type] || _buildingStyles.house;
        if (!style) return;

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx - 34, sy - 16, 72, 40);

        // 屋顶：三角形
        ctx.beginPath();
        ctx.moveTo(sx, sy - 44);
        ctx.lineTo(sx - 46, sy - 18);
        ctx.lineTo(sx + 46, sy - 18);
        ctx.closePath();
        ctx.fillStyle = style.roof;
        ctx.fill();
        ctx.strokeStyle = _darkenColor(style.roof, 0.3);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 屋顶装饰线
        ctx.beginPath();
        ctx.moveTo(sx - 38, sy - 22);
        ctx.lineTo(sx + 38, sy - 22);
        ctx.strokeStyle = _darkenColor(style.roof, 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();

        // 墙壁：矩形
        ctx.fillStyle = style.wall;
        ctx.fillRect(sx - 36, sy - 18, 72, 40);
        ctx.strokeStyle = _darkenColor(style.wall, 0.3);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 36, sy - 18, 72, 40);

        // 门
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(sx - 6, sy + 4, 12, 18);
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 6, sy + 4, 12, 18);
        // 门把手
        ctx.fillStyle = '#d4a017';
        ctx.beginPath();
        ctx.arc(sx + 3, sy + 13, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 窗户：左右各一个
        _drawWindow(ctx, sx - 24, sy - 8, 12, 12);
        _drawWindow(ctx, sx + 12, sy - 8, 12, 12);

        // 烟囱
        if (style.chimney) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(sx + 20, sy - 50, 8, 16);
            ctx.strokeStyle = '#5a2a0a';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 20, sy - 50, 8, 16);
            // 烟
            var smokePhase = (Date.now() / 800) % 1;
            for (var si = 0; si < 3; si++) {
                var sp = (smokePhase + si * 0.33) % 1;
                var smokeX = sx + 24 + Math.sin(sp * 4) * 4;
                var smokeY = sy - 50 - sp * 18;
                var smokeR = 2 + sp * 3;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200,200,200,' + (0.5 - sp * 0.5).toFixed(2) + ')';
                ctx.fill();
            }
        }

        // 酒旗（酒馆特有）
        if (style.flag) {
            var flagWave = Math.sin(Date.now() / 300) * 3;
            ctx.beginPath();
            ctx.moveTo(sx - 36, sy - 18);
            ctx.lineTo(sx - 36, sy - 44);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.stroke();
            // 旗面
            ctx.beginPath();
            ctx.moveTo(sx - 36, sy - 44);
            ctx.lineTo(sx - 36 + 16 + flagWave, sy - 40);
            ctx.lineTo(sx - 36 + 14 + flagWave, sy - 32);
            ctx.lineTo(sx - 36, sy - 30);
            ctx.closePath();
            ctx.fillStyle = '#cc3333';
            ctx.fill();
            // 酒字
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('酒', sx - 36 + 8 + flagWave * 0.5, sy - 35);
        }

        // 招牌
        if (name) {
            var signW = Math.min(ctx.measureText(name).width + 10, 50);
            ctx.fillStyle = 'rgba(255,255,240,0.92)';
            ctx.fillRect(sx - signW / 2, sy - 58, signW, 14);
            ctx.strokeStyle = _darkenColor(style.sign || '#8B4513', 0.2);
            ctx.lineWidth = 1;
            ctx.strokeRect(sx - signW / 2, sy - 58, signW, 14);
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = style.sign || '#8B4513';
            ctx.fillText(name, sx, sy - 48);
        }
    }

    // 绘制窗户
    function _drawWindow(ctx, x, y, w, h) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        // 十字格
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    // 颜色加深工具
    function _darkenColor(hex, amount) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.floor(r * (1 - amount)));
        g = Math.max(0, Math.floor(g * (1 - amount)));
        b = Math.max(0, Math.floor(b * (1 - amount)));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // ==================== 地点标记渲染 ====================
    function _renderLocationMarkers() {
        if (!window.YunluoMap) return;
        var locs = YunluoMap.LOCATIONS;
        for (var i = 0; i < locs.length; i++) {
            var loc = locs[i];
            // 建筑中心点：tile坐标偏移到2x2区域的中心
            var sx = (loc.x + 0.5) * TILE_SIZE - _cam.x;
            var sy = (loc.y + 0.5) * TILE_SIZE - _cam.y;

            // 只渲染可见范围内的
            if (sx < -120 || sx > _canvas.width + 120 || sy < -120 || sy > _canvas.height + 120) continue;

            var bType = loc.buildingType || 'house';

            if (loc.isExplore) {
                // 采集点标记：圆形+图标
                _renderExploreMarker(sx, sy, loc);
            } else {
                // RPG Maker风格建筑
                _drawBuilding(_ctx, sx, sy, bType, loc.name);
            }

            // 门交互高亮标记（有isIndoor的地点）
            if (loc.isIndoor && loc.doorX !== undefined && loc.doorY !== undefined) {
                var doorSx = loc.doorX * TILE_SIZE - _cam.x;
                var doorSy = loc.doorY * TILE_SIZE - _cam.y;
                // 高亮闪烁
                var pulse = 0.4 + Math.sin(Date.now() / 400) * 0.2;
                _ctx.fillStyle = 'rgba(255, 215, 0, ' + pulse.toFixed(2) + ')';
                _ctx.fillRect(doorSx + 2, doorSy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                _ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                _ctx.lineWidth = 1.5;
                _ctx.strokeRect(doorSx + 2, doorSy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                // 门图标
                _ctx.font = '14px sans-serif';
                _ctx.textAlign = 'center';
                _ctx.fillStyle = '#ffd700';
                _ctx.fillText('⌂', doorSx + TILE_SIZE / 2, doorSy + TILE_SIZE / 2 + 5);
            }

            // 等级锁标记
            if (loc.minLevel) {
                _ctx.font = '13px sans-serif';
                _ctx.textAlign = 'center';
                _ctx.fillStyle = '#ff6666';
                _ctx.fillText('🔒', sx + 30, sy - 44);
            }
        }
    }

    // ==================== 采集点标记渲染 ====================
    function _renderExploreMarker(sx, sy, loc) {
        // 底座光晕
        var pulse = 0.3 + Math.sin(Date.now() / 500) * 0.15;
        _ctx.beginPath();
        _ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(255, 215, 0, ' + pulse.toFixed(2) + ')';
        _ctx.fill();

        // 圆形底座
        _ctx.beginPath();
        _ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        _ctx.fillStyle = '#5a4a2a';
        _ctx.fill();
        _ctx.strokeStyle = '#8a7a4a';
        _ctx.lineWidth = 2;
        _ctx.stroke();

        // 内圈
        _ctx.beginPath();
        _ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        _ctx.fillStyle = '#3a6a2a';
        _ctx.fill();

        // emoji图标
        _ctx.font = '14px serif';
        _ctx.textAlign = 'center';
        _ctx.fillText(loc.emoji || '✦', sx, sy + 5);

        // 名称
        _ctx.font = '11px sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillStyle = '#ffffff';
        _ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        _ctx.lineWidth = 2;
        _ctx.strokeText(loc.name, sx, sy - 22);
        _ctx.fillText(loc.name, sx, sy - 22);
    }

    // ==================== 室内标签 ====================
    function _renderIndoorLabels() {
        if (!window.YunluoMap || !_currentMap) return;
        var T = YunluoMap.TERRAIN;
        var now = Date.now();

        for (var row = 0; row < _mapH; row++) {
            for (var col = 0; col < _mapW; col++) {
                var t = _currentMap[row][col];
                var sx = col * TILE_SIZE - _cam.x + TILE_SIZE / 2;
                var sy = row * TILE_SIZE - _cam.y + TILE_SIZE / 2;
                if (sx < -50 || sx > _canvas.width + 50 || sy < -50 || sy > _canvas.height + 50) continue;

                if (t === T.COUNTER) {
                    _ctx.font = '13px sans-serif';
                    _ctx.textAlign = 'center';
                    _ctx.fillStyle = '#ffd700';
                    _ctx.fillText('柜台', sx, sy + 5);
                } else if (t === T.KITCHEN) {
                    _ctx.font = '13px sans-serif';
                    _ctx.textAlign = 'center';
                    _ctx.fillStyle = '#cccccc';
                    _ctx.fillText('后厨', sx, sy + 5);
                } else if (t === T.INDOOR_DOOR) {
                    _ctx.font = '16px sans-serif';
                    _ctx.textAlign = 'center';
                    _ctx.fillStyle = '#ffd700';
                    _ctx.fillText('🚪', sx, sy + 5);
                } else if (t === T.DECOR) {
                    _ctx.font = '13px sans-serif';
                    _ctx.textAlign = 'center';
                    // 根据位置和场景显示不同名称
                    var decorLabel = _getDecorLabel(col, row);
                    _ctx.fillStyle = '#cd853f';
                    _ctx.fillText(decorLabel, sx, sy + 5);
                } else if (t === T.REALM_PORTAL) {
                    _ctx.font = '13px sans-serif';
                    _ctx.textAlign = 'center';
                    // 闪烁效果
                    var flicker = 0.6 + Math.sin(now / 300) * 0.4;
                    // 根据位置显示对应界名
                    var portalName = '传送门';
                    var portalEmoji = '🌀';
                    if (col === 3) { portalName = '魔界'; portalEmoji = '👹'; }
                    else if (col === 7) { portalName = '灵界'; portalEmoji = '👻'; }
                    else if (col === 12) { portalName = '仙界'; portalEmoji = '☁️'; }
                    // 三界场景中的传送门位置不同，根据当前室内ID判断
                    if (_currentIndoorId === 'demon_realm' || _currentIndoorId === 'spirit_realm' || _currentIndoorId === 'immortal_realm') {
                        portalName = '裂缝';
                    }
                    _ctx.globalAlpha = flicker;
                    _ctx.fillStyle = '#9b59b6';
                    _ctx.fillText(portalEmoji, sx, sy + 5);
                    _ctx.font = '10px sans-serif';
                    _ctx.fillText(portalName, sx, sy + 18);
                    _ctx.globalAlpha = 1.0;
                } else if (t === T.INDOOR_WATER) {
                    // 室内INDOOR_WATER地形标签（三界的熔岩池/灵泉/云池）
                    var waterLabel = _getWaterLabel(col, row);
                    if (waterLabel) {
                        _ctx.font = '12px sans-serif';
                        _ctx.textAlign = 'center';
                        _ctx.fillStyle = '#ffffff';
                        _ctx.globalAlpha = 0.7;
                        _ctx.fillText(waterLabel, sx, sy + 5);
                        _ctx.globalAlpha = 1.0;
                    }
                }
            }
        }
    }

    // 根据位置获取DECOR标签
    function _getDecorLabel(col, row) {
        // 茶馆室内（20×15）
        if (_currentIndoorId === 'teahouse' || !_currentIndoorId) {
            // 右上角书架区域（x=15~18, y=1~2）
            if (row >= 1 && row <= 2 && col >= 15 && col <= 18) return '📚';
            // 柜台后面茶具展示架（x=5~14, y=7）
            if (row === 7 && col >= 5 && col <= 14) return '🍵';
            // 北墙窗户（y=0）
            if (row === 0 && (col === 5 || col === 10 || col === 15)) return '🪟';
            // 西墙窗户
            if (row === 7 && col === 0) return '🪟';
            // 东墙窗户
            if (row === 7 && col === 19) return '🪟';
            // 牌匾
            if (row === 1 && col === 10) return '匾';
        }
        // 魔界·焰城
        if (_currentIndoorId === 'demon_realm') {
            // 铁砧（x=2~3, y=12~13）
            if (row >= 12 && row <= 13 && col >= 2 && col <= 3) return '⚒️';
            // 火焰祭坛（x=9~11, y=1~2）
            if ((row === 1 && col >= 9 && col <= 11) || (row === 2 && col === 10)) return '🔥';
            // 岩浆河
            return '🌋';
        }
        // 灵界·幽都
        if (_currentIndoorId === 'spirit_realm') {
            // 莲花台（灵泉四周）
            if ((row === 7 && col >= 10 && col <= 11) || (row === 10 && col >= 10 && col <= 11)) return '🪷';
            if ((row >= 8 && row <= 9 && col === 9) || (row >= 8 && row <= 9 && col === 12)) return '🪷';
            // 月光石
            if ((row === 1 && (col === 1 || col === 20)) || (row === 16 && (col === 1 || col === 20))) return '💎';
            if (row === 5 && (col === 3 || col === 18)) return '💎';
            return '✨';
        }
        // 仙界·云阙
        if (_currentIndoorId === 'immortal_realm') {
            // 仙桃树（西侧）
            if ((row >= 3 && row <= 4 && col === 3) || (row >= 6 && row <= 7 && col === 2) || (row >= 10 && row <= 11 && col === 3)) return '🍑';
            // 玉台（中央祭坛）
            if (row >= 9 && row <= 10 && col >= 10 && col <= 13) return '🏛️';
            // 仙柱
            if ((row === 1 && (col === 1 || col === 22)) || (row === 18 && (col === 1 || col === 22))) return '📿';
            return '✨';
        }
        return '🏺';
    }

    // 根据位置获取WATER标签
    function _getWaterLabel(col, row) {
        if (_currentIndoorId === 'demon_realm') return '熔岩';
        if (_currentIndoorId === 'spirit_realm') return '灵泉';
        if (_currentIndoorId === 'immortal_realm') return '云池';
        return null;
    }

    // ==================== 探索区采集点 ====================
    function _renderExploreCollectPoints() {
        if (!window.YunluoMap || !_exploreAreaId) return;
        var area = YunluoMap.getExploreArea(_exploreAreaId);
        if (!area || !area.collectPoints) return;

        for (var i = 0; i < area.collectPoints.length; i++) {
            var cp = area.collectPoints[i];
            var sx = cp.x * TILE_SIZE - _cam.x + TILE_SIZE / 2;
            var sy = cp.y * TILE_SIZE - _cam.y + TILE_SIZE / 2;
            if (sx < -50 || sx > _canvas.width + 50 || sy < -50 || sy > _canvas.height + 50) continue;

            _ctx.font = '16px serif';
            _ctx.textAlign = 'center';
            _ctx.fillStyle = '#ffcc00';
            _ctx.fillText('✦', sx, sy + 5);

            _ctx.font = '12px sans-serif';
            _ctx.fillStyle = '#ffffff';
            _ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            _ctx.lineWidth = 2;
            _ctx.strokeText(cp.name, sx, sy - 14);
            _ctx.fillText(cp.name, sx, sy - 14);
        }
    }

    // ==================== 俯视NPC渲染 ====================
    function _renderNpcTopDown(npc) {
        var sx = npc.x - _cam.x;
        var sy = npc.y - _cam.y;

        // 阴影
        _ctx.beginPath();
        _ctx.ellipse(sx, sy + 3, 9, 4, 0, 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(0,0,0,0.2)';
        _ctx.fill();

        // 身体圆点
        _ctx.beginPath();
        _ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        _ctx.fillStyle = npc.bodyColor || '#6a4a6a';
        _ctx.fill();
        _ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        _ctx.lineWidth = 1;
        _ctx.stroke();

        // 行为气泡
        _renderBehaviorBubble(sx, sy, npc);

        // 名字
        _ctx.font = '11px sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillStyle = npc.moodColor || '#ffffff';
        _ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        _ctx.lineWidth = 2;
        _ctx.strokeText(npc.name || npc.id, sx, sy - 16);
        _ctx.fillText(npc.name || npc.id, sx, sy - 16);
    }

    // ==================== 行为气泡渲染 ====================
    function _renderBehaviorBubble(sx, sy, npc) {
        if (!window.BehaviorBubble || !window.SoulTick) return;

        var state = SoulTick.getNpcState(npc.id);
        if (!state) return;

        // 优先使用tick中直接设置的bubble（动物系统等）
        var bubble = null;
        if (npc.bubble && npc.bubbleTime && (Date.now() - npc.bubbleTime < 10000)) {
            bubble = { icon: npc.bubble, text: '', type: 'direct' };
        } else {
            bubble = BehaviorBubble.getBubbleForNpc(state);
        }
        if (!bubble) return;

        var bubbleX = sx + 14;
        var bubbleY = sy - 28;

        // 气泡背景
        var text = bubble.icon + ' ' + bubble.text;
        _ctx.font = '10px sans-serif';
        var textW = _ctx.measureText(text).width + 8;
        var bubbleH = 16;

        // 类型颜色
        var bgColor = 'rgba(22,33,62,0.9)';
        var borderColor = '#f0c27f60';
        if (bubble.type === 'interruption') {
            bgColor = 'rgba(120,20,20,0.9)';
            borderColor = '#ff4444';
        } else if (bubble.type === 'need') {
            bgColor = 'rgba(120,80,20,0.9)';
            borderColor = '#ffaa00';
        }

        _ctx.fillStyle = bgColor;
        _ctx.beginPath();
        _ctx.roundRect(bubbleX - textW / 2, bubbleY - bubbleH / 2, textW, bubbleH, 4);
        _ctx.fill();
        _ctx.strokeStyle = borderColor;
        _ctx.lineWidth = 1;
        _ctx.stroke();

        // 小三角指向NPC
        _ctx.beginPath();
        _ctx.moveTo(bubbleX - 4, bubbleY + bubbleH / 2);
        _ctx.lineTo(bubbleX, bubbleY + bubbleH / 2 + 5);
        _ctx.lineTo(bubbleX + 4, bubbleY + bubbleH / 2);
        _ctx.fillStyle = bgColor;
        _ctx.fill();

        // 气泡文字
        _ctx.font = '10px sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillStyle = '#e0d8c0';
        _ctx.fillText(text, bubbleX, bubbleY + 4);
    }

    // ==================== 俯视玩家渲染 ====================
    function _renderPlayerTopDown() {
        var sx = _player.px - _cam.x;
        var sy = _player.py - _cam.y + _player.bounce;

        // 阴影
        _ctx.beginPath();
        _ctx.ellipse(_player.px - _cam.x, _player.py - _cam.y + 3, 10, 5, 0, 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(0,0,0,0.2)';
        _ctx.fill();

        // 身体
        _ctx.beginPath();
        _ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        _ctx.fillStyle = '#4a90d9';
        _ctx.fill();
        _ctx.strokeStyle = '#2a5a8a';
        _ctx.lineWidth = 2;
        _ctx.stroke();

        // 名字
        _ctx.font = '12px sans-serif';
        _ctx.textAlign = 'center';
        _ctx.fillStyle = '#ffffff';
        _ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        _ctx.lineWidth = 2;
        _ctx.strokeText('我', sx, sy - 18);
        _ctx.fillText('我', sx, sy - 18);
    }

    // ==================== 天气效果渲染 ====================
    function _renderWeatherOverlay() {
        for (var i = 0; i < _particles.length; i++) {
            var p = _particles[i];
            if (p.type === 'rain') {
                _ctx.beginPath();
                _ctx.moveTo(p.x, p.y);
                _ctx.lineTo(p.x + p.vx * 0.5, p.y + p.vy * 0.5);
                _ctx.strokeStyle = 'rgba(150,180,220,0.5)';
                _ctx.lineWidth = 1;
                _ctx.stroke();
            } else if (p.type === 'snow') {
                _ctx.beginPath();
                _ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                _ctx.fillStyle = 'rgba(255,255,255,0.8)';
                _ctx.fill();
            }
        }

        // 雾天覆盖
        var weather = window.GameTime ? GameTime.getWeather() : null;
        if (weather && weather.id === 'foggy') {
            _ctx.fillStyle = 'rgba(200,200,210,0.3)';
            _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        }
    }

    // ==================== 昼夜效果渲染 ====================
    function _renderDayNightOverlay() {
        if (!window.GameTime) return;
        var period = GameTime.getPeriod();
        if (!period) return;

        var lightLevel = period.lightLevel;

        // 夜晚和傍晚暗化
        if (lightLevel < 0.5) {
            var alpha = (1 - lightLevel) * 0.55;
            _ctx.fillStyle = 'rgba(10,10,40,' + alpha.toFixed(3) + ')';
            _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

            // 夜晚星星
            if (lightLevel <= 0.15) {
                _initStars();
                for (var i = 0; i < _stars.length; i++) {
                    var s = _stars[i];
                    s.twinkle += 0.02;
                    var brightness = 0.4 + Math.sin(s.twinkle) * 0.3;
                    _ctx.beginPath();
                    _ctx.arc(
                        s.x * _canvas.width,
                        s.y * _canvas.height * 0.6,
                        s.size,
                        0, Math.PI * 2
                    );
                    _ctx.fillStyle = 'rgba(255,255,220,' + brightness.toFixed(2) + ')';
                    _ctx.fill();
                }
            }
        }

        // 天气色调
        var weather = GameTime.getWeather();
        if (weather && weather.mapTint) {
            _ctx.fillStyle = weather.mapTint;
            _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        }
    }

    // ==================== 交互提示渲染 ====================
    function _renderInteractHint() {
        if (!_interactHint) return;

        var cx = _canvas.width / 2;
        var cy = _canvas.height - 60;

        _ctx.font = '16px sans-serif';
        _ctx.textAlign = 'center';
        var textW = _ctx.measureText(_interactHint).width + 24;

        // 背景
        _ctx.fillStyle = 'rgba(0,0,0,0.65)';
        _ctx.beginPath();
        _ctx.roundRect(cx - textW / 2, cy - 14, textW, 28, 6);
        _ctx.fill();

        // 文字
        _ctx.fillStyle = '#ffffff';
        _ctx.fillText(_interactHint, cx, cy + 5);
    }

    // ==================== 主渲染 ====================
    function _render() {
        if (!_ctx) return;
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        // 背景色
        if (_scene === SCENE_OUTDOOR) {
            var season = window.GameTime ? GameTime.getSeason() : null;
            _ctx.fillStyle = (season && season.groundColor) || '#3a5a2a';
        } else if (_scene === SCENE_INDOOR) {
            _ctx.fillStyle = '#2a1a0a';
        } else {
            _ctx.fillStyle = '#3a5a2a';
        }
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

        // 场景渲染
        if (_scene === SCENE_OUTDOOR) {
            try { _renderOutdoor(); } catch(e) { if (window.console) console.error('[GameMap] render outdoor:', e); }
        } else if (_scene === SCENE_INDOOR) {
            try { _renderIndoor(); } catch(e) { if (window.console) console.error('[GameMap] render indoor:', e); }
        } else {
            try { _renderExplore(); } catch(e) { if (window.console) console.error('[GameMap] render explore:', e); }
        }

        // 天气/昼夜
        try { _renderWeatherOverlay(); } catch(e) { if (window.console) console.error('[GameMap] weather overlay:', e); }
        try { _renderDayNightOverlay(); } catch(e) { if (window.console) console.error('[GameMap] day/night overlay:', e); }

        // 交互提示
        try { _renderInteractHint(); } catch(e) { if (window.console) console.error('[GameMap] interact hint:', e); }

        // NPC互动气泡
        try { _renderInteractionBubbles(); } catch(e) { if (window.console) console.error('[GameMap] interaction bubbles:', e); }

        // 淡入淡出覆盖层
        if (_fadeAlpha > 0) {
            _ctx.fillStyle = 'rgba(0,0,0,' + _fadeAlpha.toFixed(3) + ')';
            _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
            _fadeAlpha -= 0.03;
            if (_fadeAlpha < 0) _fadeAlpha = 0;
        }
    }

    // ==================== 主循环 ====================
    function _loop() {
        if (!_running) return;
        _updatePlayer();
        _updateCamera();
        _updateParticles();
        // 每帧同步NPC位置（室内场景保留室内专属NPC）
        if (_scene === SCENE_OUTDOOR && window.NpcMovement) {
            _npcs = NpcMovement.getMapNpcs();
        }
        _render();
        _animId = requestAnimationFrame(_loop);
    }

    // ==================== 场景切换 ====================
    function _loadOutdoorMap() {
        if (!window.YunluoMap) return;
        _currentMap = YunluoMap.getTownMap();
        _mapW = 50;
        _mapH = 40;
        _scene = SCENE_OUTDOOR;
    }

    function _loadIndoorMap() {
        if (!window.YunluoMap) return;
        var level = (window.Teahouse && Teahouse.getStatus) ? Teahouse.getStatus().level : 1;
        _currentMap = YunluoMap.getIndoorMap(level);
        _mapW = 20;
        _mapH = 15;
        _scene = SCENE_INDOOR;
    }

    function _loadDemonRealm() {
        if (!window.YunluoMap) return;
        _currentMap = YunluoMap.getDemonRealm();
        _mapW = 20;
        _mapH = 16;
        _scene = SCENE_INDOOR;
    }

    function _loadSpiritRealm() {
        if (!window.YunluoMap) return;
        _currentMap = YunluoMap.getSpiritRealm();
        _mapW = 22;
        _mapH = 18;
        _scene = SCENE_INDOOR;
    }

    function _loadImmortalRealm() {
        if (!window.YunluoMap) return;
        _currentMap = YunluoMap.getImmortalRealm();
        _mapW = 24;
        _mapH = 20;
        _scene = SCENE_INDOOR;
    }

    function _loadExploreMap(areaId) {
        if (!window.YunluoMap) return;
        var area = YunluoMap.getExploreArea(areaId);
        if (!area) return;
        _currentMap = area.map;
        _mapW = 20;
        _mapH = 15;
        _exploreAreaId = areaId;
        _scene = SCENE_EXPLORE;
    }

    function _setPlayerPosOutdoor(col, row) {
        _player.px = col * TILE_SIZE + TILE_SIZE / 2;
        _player.py = row * TILE_SIZE + TILE_SIZE / 2;
    }

    function _setPlayerPosTopDown(col, row) {
        _player.px = col * TILE_SIZE + TILE_SIZE / 2;
        _player.py = row * TILE_SIZE + TILE_SIZE / 2;
    }

    // ==================== 公开接口 ====================

    function init(canvasId) {
        if (_canvas) return;
        _canvas = document.getElementById(canvasId);
        if (!_canvas) return;
        _ctx = _canvas.getContext('2d');

        _initLookups();

        // 加载室外地图
        _loadOutdoorMap();

        // 玩家初始位置：茶馆门口
        _setPlayerPosOutdoor(23, 20);

        // 初始化相机
        _cam.x = _player.px - (_canvas.width || 800) / 2;
        _cam.y = _player.py - (_canvas.height || 600) / 2;

        // 绑定输入
        document.addEventListener('keydown', _onKeyDown);
        document.addEventListener('keyup', _onKeyUp);

        _prevTileCol = -1;
        _prevTileRow = -1;
    }

    function start() {
        if (_running) return;
        _running = true;
        _loop();
    }

    function stop() {
        _running = false;
        if (_animId) {
            cancelAnimationFrame(_animId);
            _animId = null;
        }
    }

    function resize(w, h) {
        if (!_canvas) return;
        _canvas.width = w;
        _canvas.height = h;
    }

    function setNpcPositions(npcs) {
        _npcs = npcs || [];
    }

    function getPlayerTile() {
        return _playerTile();
    }

    function getPlayerPixel() {
        return { x: _player.px, y: _player.py };
    }

    function getInteractHint() {
        return _interactHint;
    }

    function setOnEnterIndoor(cb) { _cb.enterIndoor = cb; }
    function setOnExitIndoor(cb) { _cb.exitIndoor = cb; }
    function setOnEnterExplore(cb) { _cb.enterExplore = cb; }
    function setOnExitExplore(cb) { _cb.exitExplore = cb; }
    function setOnInteract(cb) { _cb.interact = cb; }
    function setOnAction(cb) { _cb.action = cb; }

    // 三界专属NPC数据（室内场景使用俯视坐标）
    var _realmNpcs = {
        demon_realm: [
            { id: 'yan_lord', name: '焰主', x: 5 * TILE_SIZE + TILE_SIZE/2, y: 8 * TILE_SIZE + TILE_SIZE/2, bodyColor: '#c62828', moodColor: '#ff5722' }
        ],
        spirit_realm: [
            { id: 'ling_nvx', name: '灵女', x: 9 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, bodyColor: '#1565c0', moodColor: '#42a5f5' }
        ],
        immortal_realm: [
            { id: 'xian_zun', name: '仙尊', x: 12 * TILE_SIZE + TILE_SIZE/2, y: 8 * TILE_SIZE + TILE_SIZE/2, bodyColor: '#f9a825', moodColor: '#ffee58' }
        ]
    };

    function switchToIndoor(locId) {
        _keys = {};
        _fadeAlpha = 1.0;
        _currentIndoorId = locId || 'teahouse';
        // 清理旧场景状态
        _interactionBubbles = [];
        _particles = [];
        _interactHint = '';

        var level = (window.Teahouse && Teahouse.getStatus) ? Teahouse.getStatus().level : 1;
        var hasAccess = function(realmId) { return window.Teahouse && Teahouse.hasRealmAccess && Teahouse.hasRealmAccess(realmId); };
        // 根据locId和等级决定加载哪个室内地图
        if (locId === 'demon_realm' && level >= 3 && hasAccess('demon_realm')) {
            _loadDemonRealm();
            _setPlayerPosTopDown(10, 14);
        } else if (locId === 'spirit_realm' && level >= 4 && hasAccess('spirit_realm')) {
            _loadSpiritRealm();
            _setPlayerPosTopDown(11, 16);
        } else if (locId === 'immortal_realm' && level >= 5 && hasAccess('immortal_realm')) {
            _loadImmortalRealm();
            _setPlayerPosTopDown(12, 18);
        } else {
            _loadIndoorMap();
            _setPlayerPosTopDown(10, 11);
        }
        _cam.x = _player.px - (_canvas ? _canvas.width : 800) / 2;
        _cam.y = _player.py - (_canvas ? _canvas.height : 600) / 2;
        _prevTileCol = -1;
        _prevTileRow = -1;
        _particles = [];

        // 三界场景加载专属NPC
        if (_realmNpcs[locId]) {
            _npcs = _realmNpcs[locId].slice();
        } else if (locId === 'teahouse' || !locId) {
            // 茶馆室内：阿福站在柜台后面
            _npcs = [
                { id: 'a_fu', name: '阿福', x: 10 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, bodyColor: '#ffe0b2', moodColor: '#ffd54f' }
            ];
        }
    }

    function switchToOutdoor() {
        _keys = {};
        _fadeAlpha = 1.0;
        _currentIndoorId = '';
        // 清理旧场景状态
        _interactionBubbles = [];
        _particles = [];
        _interactHint = '';

        _loadOutdoorMap();
        _setPlayerPosOutdoor(23, 20);
        _cam.x = _player.px - (_canvas ? _canvas.width : 800) / 2;
        _cam.y = _player.py - (_canvas ? _canvas.height : 600) / 2;
        _prevTileCol = -1;
        _prevTileRow = -1;

        // 通知 SoulTick 玩家回到室外
        if (window.SoulTick) {
            SoulTick.setPlayerLocation('');
        }
    }

    function switchToExplore(areaId) {
        // 清理旧场景状态
        _interactionBubbles = [];
        _interactHint = '';

        _loadExploreMap(areaId);
        _setPlayerPosTopDown(10, 12);
        _cam.x = _player.px - (_canvas ? _canvas.width : 800) / 2;
        _cam.y = _player.py - (_canvas ? _canvas.height : 600) / 2;
        _prevTileCol = -1;
        _prevTileRow = -1;
        _particles = [];

        // 通知 SoulTick 玩家进入探索区
        if (window.SoulTick) {
            SoulTick.setPlayerLocation(areaId);
        }
    }

    function clearParticles() {
        _particles = [];
    }

    // ==================== NPC互动气泡 ====================
    var _interactionBubbles = []; // [{x, y, text, alpha, born, nameA, nameB}]

    function addInteractionBubble(worldX, worldY, text) {
        _interactionBubbles.push({
            x: worldX,
            y: worldY,
            text: text,
            alpha: 0,       // 从0淡入
            born: Date.now(),
            phase: 'fadeIn'  // fadeIn -> show -> fadeOut
        });
        // 最多保留5个气泡
        if (_interactionBubbles.length > 5) _interactionBubbles.shift();
    }

    function _renderInteractionBubbles() {
        var now = Date.now();
        var i = _interactionBubbles.length;
        while (i--) {
            var b = _interactionBubbles[i];
            var age = now - b.born;

            // 动画阶段：淡入0.3s → 展示3.5s → 淡出1.2s
            if (age < 300) {
                b.alpha = age / 300;
                b.phase = 'fadeIn';
            } else if (age < 3800) {
                b.alpha = 1.0;
                b.phase = 'show';
            } else if (age < 5000) {
                b.alpha = 1.0 - (age - 3800) / 1200;
                b.phase = 'fadeOut';
            } else {
                _interactionBubbles.splice(i, 1);
                continue;
            }

            // 上浮效果（缓慢上浮）
            var floatY = b.y - (age * 0.006);

            var sx = b.x - _cam.x;
            var sy = floatY - _cam.y;

            // 只渲染可见区域内的
            if (sx < -300 || sx > _canvas.width + 300 || sy < -150 || sy > _canvas.height + 150) continue;

            // 截断过长文本
            var displayText = b.text;
            if (displayText.length > 30) displayText = displayText.substring(0, 28) + '……';

            // 背景：古风卷轴样式
            _ctx.font = 'bold 13px "Microsoft YaHei", "PingFang SC", sans-serif';
            _ctx.textAlign = 'center';
            var tw = _ctx.measureText(displayText).width + 28;
            var bh = 30;

            // 外发光
            _ctx.shadowColor = 'rgba(240,194,127,' + (b.alpha * 0.4) + ')';
            _ctx.shadowBlur = 8;

            // 卷轴背景
            _ctx.fillStyle = 'rgba(35,25,15,' + (b.alpha * 0.88) + ')';
            _ctx.beginPath();
            _ctx.roundRect(sx - tw / 2, sy - bh / 2, tw, bh, 6);
            _ctx.fill();

            // 金色边框
            _ctx.shadowBlur = 0;
            _ctx.strokeStyle = 'rgba(240,194,127,' + (b.alpha * 0.7) + ')';
            _ctx.lineWidth = 1.5;
            _ctx.stroke();

            // 顶部装饰线
            _ctx.fillStyle = 'rgba(240,194,127,' + (b.alpha * 0.5) + ')';
            _ctx.fillRect(sx - tw / 2 + 6, sy - bh / 2 + 2, tw - 12, 1.5);

            // 文字（暖白色）
            _ctx.fillStyle = 'rgba(255,245,220,' + b.alpha + ')';
            _ctx.fillText(displayText, sx, sy + 5);
        }
    }

    // ==================== 返回公开接口 ====================
    return {
        init: init,
        start: start,
        stop: stop,
        resize: resize,
        setNpcPositions: setNpcPositions,
        getPlayerTile: getPlayerTile,
        getPlayerPixel: getPlayerPixel,
        getInteractHint: getInteractHint,
        getCurrentIndoorId: function() { return _currentIndoorId; },
        setOnEnterIndoor: setOnEnterIndoor,
        setOnExitIndoor: setOnExitIndoor,
        setOnEnterExplore: setOnEnterExplore,
        setOnExitExplore: setOnExitExplore,
        setOnInteract: setOnInteract,
        setOnAction: setOnAction,
        switchToIndoor: switchToIndoor,
        switchToOutdoor: switchToOutdoor,
        switchToExplore: switchToExplore,
        clearParticles: clearParticles,
        addInteractionBubble: addInteractionBubble,
        // NpcMovement兼容
        TILE: TILE_SIZE,
        LOCATIONS: _locLookup
    };

})();

window.GameMap = GameMap;
