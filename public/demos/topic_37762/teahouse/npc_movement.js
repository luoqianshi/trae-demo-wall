var NpcMovement = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  NPC自主移动引擎 — 后台运行，决定NPC去哪里、做什么
    // ═══════════════════════════════════════════════════════════

    var _npcEntities = {}; // npcId -> {id, name, emoji, x, y, targetX, targetY, speed, state, locationId, bodyColor, moodColor}
    var _updateInterval = null;
    var _onNpcEnterTeahouse = null;
    var _onNpcLeaveTeahouse = null;

    var NPC_SPEED = 1.2;
    var ARRIVAL_THRESHOLD = 8; // 像素

    // 地点对应的像素坐标（俯视地图）
    function _locPixel(locId) {
        var loc = GameMap.LOCATIONS[locId];
        if (!loc) return null;
        var tile = GameMap.TILE;
        return { x: loc.col * tile + tile / 2, y: loc.row * tile + tile / 2 };
    }

    // ═══════════════════════════════════════════════════════════
    //  NPC决策 — 基于DailyEngine的状态决定去哪里
    // ═══════════════════════════════════════════════════════════

    function _decideNpcLocation(npcId) {
        // 优先使用调度脑决策
        if (window.SoulTick) {
            var soulState = SoulTick.getNpcState(npcId);
            if (soulState && soulState.intent && soulState.intent.goalType) {
                var goalType = soulState.intent.goalType;
                // 调度脑已经通过 SoulTick._syncToNpcMovement 处理移动
                // 这里只返回当前位置
                var entity = _npcEntities[npcId];
                return entity ? entity.locationId : 'market';
            }
        }

        // 降级到旧逻辑
        if (!window.DailyEngine) return 'market';
        var state = DailyEngine.getDailyState(npcId);
        if (!state) return 'market';

        if (state.socialNeed > 60 && Math.random() < 0.5) return 'teahouse';
        if (state.mood > 60 && Math.random() < 0.3) return 'market';
        if (state.exploreDesire > 50) {
            var explorePlaces = ['back_mountain', 'riverside', 'herb_garden', 'sect_gate'];
            return explorePlaces[Math.floor(Math.random() * explorePlaces.length)];
        }
        return state.decidedLocation || 'market';
    }

    // ═══════════════════════════════════════════════════════════
    //  NPC移动更新
    // ═══════════════════════════════════════════════════════════

    function _updateNpcMovement() {
        for (var npcId in _npcEntities) {
            if (!_npcEntities.hasOwnProperty(npcId)) continue;
            var npc = _npcEntities[npcId];
            if (!npc) continue;

            // 对话中的NPC不移动
            if (window.dialogueActive && window.currentDialogueNpc === npcId) continue;

            if (npc.state === 'walking' && npc.targetX !== null && typeof npc.targetX === 'number') {
                var dx = npc.targetX - npc.x;
                var dy = npc.targetY - npc.y;
                var dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < ARRIVAL_THRESHOLD) {
                    npc.x = npc.targetX;
                    npc.y = npc.targetY;
                    npc.state = 'idle';
                    npc.locationId = npc.targetLocationId;

                    // 如果到达茶馆，触发进入茶馆
                    if (npc.targetLocationId === 'teahouse' && _onNpcEnterTeahouse) {
                        _onNpcEnterTeahouse(npcId);
                    }
                } else {
                    npc.x += (dx / dist) * npc.speed;
                    npc.y += (dy / dist) * npc.speed;
                }
            } else if (npc.state === 'idle') {
                // 随机闲逛（小范围移动）
                if (Math.random() < 0.02) {
                    var loc = _locPixel(npc.locationId || 'market');
                    if (loc) {
                        npc.targetX = loc.x + (Math.random() - 0.5) * GameMap.TILE * 3;
                        npc.targetY = loc.y + (Math.random() - 0.5) * GameMap.TILE * 3;
                        npc.targetLocationId = npc.locationId;
                        npc.state = 'walking';
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        _npcEntities = {};
        if (window.DailyEngine) {
            var ids = DailyEngine.getAllNpcIds();
            // 先为所有NPC生成每日状态
            for (var i = 0; i < ids.length; i++) {
                if (!DailyEngine.getDailyState(ids[i])) {
                    DailyEngine.generateDailyState(ids[i]);
                }
            }
            // 所有NPC生成后，应用情绪传染（NPC心情向群体平均靠拢）
            if (DailyEngine.applyEmotionContagion) {
                DailyEngine.applyEmotionContagion();
            }
            // 裂痕事件检测：基于NPC自主意识触发事件（冲突/崩溃/触景生情/安慰）
            if (DailyEngine.detectRiftEvents && DailyEngine.applyRiftEvent) {
                var riftEvents = DailyEngine.detectRiftEvents();
                for (var r = 0; r < riftEvents.length; r++) {
                    DailyEngine.applyRiftEvent(riftEvents[r]);
                }
            }
            // 再创建NPC实体
            for (var j = 0; j < ids.length; j++) {
                var id = ids[j];
                var state = DailyEngine.getDailyState(id);
                var profile = DailyEngine.getNpcProfile(id);
                var loc = _decideNpcLocation(id);
                var pos = _locPixel(loc);
                _npcEntities[id] = {
                    id: id,
                    name: state ? state.name : id,
                    emoji: state ? state.moodEmoji : '🙂',
                    x: pos ? pos.x + (Math.random()-0.5)*30 : 300,
                    y: pos ? pos.y + (Math.random()-0.5)*30 : 300,
                    targetX: pos ? pos.x : 300,
                    targetY: pos ? pos.y : 300,
                    targetLocationId: loc,
                    speed: NPC_SPEED + Math.random() * 0.5,
                    state: 'walking',
                    locationId: loc,
                    lod: 'far',
                    bodyColor: (profile && profile.bodyColor) ? profile.bodyColor : _randomBodyColor(),
                    moodColor: state && state.mood > 60 ? '#5dade2' : (state && state.mood > 30 ? '#f0c27f' : '#e74c3c'),
                    // 灵魂调度脑状态
                    intent: state && state.intent ? state.intent : {goalType: 'idle', priority: 0, reasonTags: ['default']},
                    plan: state && state.plan ? state.plan : {steps: [], currentStep: 0, fallbackGoal: 'idle'},
                    anchors: state && state.anchors ? state.anchors : {home: profile ? profile.homeLocation : '', favorite: profile ? profile.favoriteLocation : '', work: ''}
                };
            }
        }
    }

    function _randomBodyColor() {
        var colors = ['#4a6a8a','#6a4a6a','#4a6a4a','#6a6a4a','#5a5a7a','#7a5a4a'];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    function start() {
        if (_updateInterval) clearInterval(_updateInterval);
        _updateInterval = setInterval(_updateNpcMovement, 50);
    }

    function stop() {
        if (_updateInterval) { clearInterval(_updateInterval); _updateInterval = null; }
    }

    // 每天重新决策NPC位置
    function newDayDecision() {
        for (var npcId in _npcEntities) {
            if (!_npcEntities.hasOwnProperty(npcId)) continue;
            var npc = _npcEntities[npcId];
            var loc = _decideNpcLocation(npcId);
            var pos = _locPixel(loc);
            if (pos) {
                npc.targetX = pos.x + (Math.random()-0.5)*30;
                npc.targetY = pos.y + (Math.random()-0.5)*30;
                npc.targetLocationId = loc;
                npc.state = 'walking';
            }
            // 更新心情颜色
            if (window.DailyEngine) {
                var state = DailyEngine.getDailyState(npcId);
                if (state) {
                    npc.emoji = state.moodEmoji;
                    npc.moodColor = state.mood > 60 ? '#5dade2' : (state.mood > 30 ? '#f0c27f' : '#e74c3c');
                }
            }
        }
    }

    // 让NPC去茶馆
    function sendNpcToTeahouse(npcId) {
        var npc = _npcEntities[npcId];
        if (!npc) return;
        var pos = _locPixel('teahouse');
        if (pos) {
            npc.targetX = pos.x;
            npc.targetY = pos.y;
            npc.targetLocationId = 'teahouse';
            npc.state = 'walking';
        }
    }

    // 让NPC离开茶馆（从地图上重新出现）
    function removeNpcFromTeahouse(npcId) {
        var npc = _npcEntities[npcId];
        if (!npc) return;
        var loc = _decideNpcLocation(npcId);
        var pos = _locPixel(loc);
        if (pos) {
            npc.x = pos.x;
            npc.y = pos.y;
            npc.targetX = pos.x;
            npc.targetY = pos.y;
            npc.targetLocationId = loc;
            npc.locationId = loc;
            npc.state = 'idle';
        }
    }

    // 获取所有在地图上的NPC（排除在茶馆内的）
    function getMapNpcs() {
        var result = [];
        for (var npcId in _npcEntities) {
            if (!_npcEntities.hasOwnProperty(npcId)) continue;
            var npc = _npcEntities[npcId];
            // 不显示在茶馆内的NPC
            if (npc.locationId === 'teahouse' && npc.state === 'idle') continue;
            result.push(npc);
        }
        return result;
    }

    // 获取在茶馆内的NPC ID列表
    function getTeahouseNpcIds() {
        var result = [];
        for (var npcId in _npcEntities) {
            if (!_npcEntities.hasOwnProperty(npcId)) continue;
            var npc = _npcEntities[npcId];
            if (npc.locationId === 'teahouse' && npc.state === 'idle') {
                result.push(npcId);
            }
        }
        return result;
    }

    function getNpcEntity(npcId) { return _npcEntities[npcId] || null; }

    function setOnNpcEnterTeahouse(cb) { _onNpcEnterTeahouse = cb; }
    function setOnNpcLeaveTeahouse(cb) { _onNpcLeaveTeahouse = cb; }

    // LOD更新 - 基于玩家位置计算NPC可见级别
    function updateLodByPlayer(playerTile) {
        if (!playerTile) return;
        for (var npcId in _npcEntities) {
            if (!_npcEntities.hasOwnProperty(npcId)) continue;
            var npc = _npcEntities[npcId];
            var loc = typeof GameMap !== 'undefined' && GameMap.LOCATIONS ? GameMap.LOCATIONS[npc.locationId] : null;
            if (!loc) {
                npc.lod = 'far';
                continue;
            }
            var dist = Math.abs(loc.col - playerTile.col) + Math.abs(loc.row - playerTile.row);
            npc.lod = dist <= 4 ? 'near' : (dist <= 10 ? 'mid' : 'far');
        }
    }

    var TILE = 32; // for reference

    return {
        init: init, start: start, stop: stop,
        newDayDecision: newDayDecision,
        sendNpcToTeahouse: sendNpcToTeahouse,
        removeNpcFromTeahouse: removeNpcFromTeahouse,
        getMapNpcs: getMapNpcs,
        getTeahouseNpcIds: getTeahouseNpcIds,
        getNpcEntity: getNpcEntity,
        getAllEntities: function() {
            var arr = [];
            for (var id in _npcEntities) {
                if (_npcEntities.hasOwnProperty(id)) arr.push(_npcEntities[id]);
            }
            return arr;
        },
        setOnNpcEnterTeahouse: setOnNpcEnterTeahouse,
        setOnNpcLeaveTeahouse: setOnNpcLeaveTeahouse,
        updateLodByPlayer: updateLodByPlayer
    };
})();

window.NpcMovement = NpcMovement;
