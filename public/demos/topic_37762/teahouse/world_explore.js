var WorldExplore = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  地点定义 — 每个地点有名称、描述、可采集物、可发现物、NPC出现概率
    // ═══════════════════════════════════════════════════════════

    var LOCATIONS = {
        teahouse: {
            id: 'teahouse', name: '云落茶馆', emoji: '🏠', desc: '老板娘留下的茶馆，阿福在打理',
            materials: [], discoveries: [],
            npcChance: 0.8, availablePeriods: ['morning', 'noon', 'afternoon', 'evening']
        },
        market: {
            id: 'market', name: '云落集市', emoji: '🏪', desc: '买卖东西的集市，热闹非凡',
            materials: [], discoveries: ['village_rumor'],
            npcChance: 0.5, availablePeriods: ['morning', 'noon', 'afternoon'],
            canBuy: true
        },
        back_mountain: {
            id: 'back_mountain', name: '后山', emoji: '⛰', desc: '茶树和草药生长的地方',
            materials: ['tea_leaves', 'fine_tea_leaves', 'spring_water'],
            discoveries: ['mountain_cave', 'old_letter', 'herb_patch'],
            npcChance: 0.2, availablePeriods: ['dawn', 'morning', 'afternoon']
        },
        riverside: {
            id: 'riverside', name: '溪边', emoji: '🌊', desc: '河水清澈，适合发呆钓鱼',
            materials: ['spring_water'],
            discoveries: ['riverside_bottle', 'old_coin'],
            npcChance: 0.3, availablePeriods: ['dawn', 'morning', 'afternoon', 'evening']
        },
        herb_garden: {
            id: 'herb_garden', name: '百草堂', emoji: '🌿', desc: '各种草药的香味',
            materials: ['tea_leaves', 'osmanthus'],
            discoveries: ['rare_herb'],
            npcChance: 0.3, availablePeriods: ['morning', 'afternoon']
        },
        forge: {
            id: 'forge', name: '铁匠铺', emoji: '🔨', desc: '叮叮当当的打铁声',
            materials: [], discoveries: [],
            npcChance: 0.4, availablePeriods: ['morning', 'afternoon']
        },
        official_road: {
            id: 'official_road', name: '官道', emoji: '🛤', desc: '通往外面世界的路',
            materials: [], discoveries: ['traveler_note', 'dropped_package'],
            npcChance: 0.3, availablePeriods: ['morning', 'afternoon']
        },
        old_well: {
            id: 'old_well', name: '古井', emoji: '🪣', desc: '镇边的古井，据说通往地下',
            materials: ['spring_water'],
            discoveries: ['spirit_fragment'],
            npcChance: 0.1, availablePeriods: ['dawn', 'night'],
            minLevel: 2
        },
        sect_gate: {
            id: 'sect_gate', name: '宗门山门', emoji: '⛩️', desc: '苍梧宗的外门，灵气浓郁',
            materials: ['spirit_leaves', 'spirit_water'],
            discoveries: ['realm_artifact', 'strange_map'],
            npcChance: 0.15, availablePeriods: ['morning', 'afternoon'],
            minLevel: 3
        },
        spirit_field: {
            id: 'spirit_field', name: '灵田', emoji: '🌱', desc: '种着灵茶树的田地',
            materials: ['tea_leaves', 'fine_tea_leaves'],
            discoveries: ['herb_patch'],
            npcChance: 0.2, availablePeriods: ['morning', 'afternoon']
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  发现物定义 — 探索时随机触发
    // ═══════════════════════════════════════════════════════════

    var DISCOVERIES = {
        village_rumor:     { id: 'village_rumor',     name: '小道消息',     desc: '你听到了一个有趣的传闻。', tier: 'daily',     reward: { reputation: 2 } },
        mountain_cave:     { id: 'mountain_cave',     name: '山洞',       desc: '你发现了一个隐蔽的山洞，里面似乎有什么东西。', tier: 'uncommon',  reward: { gold: 20 } },
        old_letter:        { id: 'old_letter',        name: '旧信',       desc: '一封被遗忘的信，字迹已经模糊了。', tier: 'uncommon',  reward: { reputation: 5 } },
        herb_patch:        { id: 'herb_patch',        name: '药草丛',     desc: '一片长势很好的草药。', tier: 'daily',     reward: { material: 'tea_leaves', count: 3 } },
        riverside_bottle:  { id: 'riverside_bottle',  name: '漂流瓶',     desc: '河里漂来一个瓶子，里面有一张纸条。', tier: 'uncommon',  reward: { reputation: 3 } },
        old_coin:          { id: 'old_coin',          name: '古钱币',     desc: '河边捡到一枚古钱币，不知道值不值钱。', tier: 'daily',     reward: { gold: 10 } },
        rare_herb:         { id: 'rare_herb',         name: '稀有草药',   desc: '王婆婆说这种草药很难找。', tier: 'rare',      reward: { material: 'osmanthus', count: 2 } },
        traveler_note:     { id: 'traveler_note',     name: '旅人笔记',   desc: '路上捡到一本笔记，记录着远方的见闻。', tier: 'uncommon',  reward: { reputation: 5 } },
        dropped_package:   { id: 'dropped_package',   name: '遗落的包裹', desc: '有人落下的包裹，里面有些日用品。', tier: 'daily',     reward: { gold: 15 } },
        spirit_fragment:   { id: 'spirit_fragment',   name: '灵气碎片',   desc: '灵泉附近漂浮着微弱的光点，你伸手抓住了。', tier: 'rare',      reward: { material: 'spirit_water', count: 1 } },
        realm_artifact:    { id: 'realm_artifact',    name: '跨界遗物',   desc: '不属于这个世界的物品，散发着奇异的光。', tier: 'legendary', reward: { gold: 100, reputation: 20 } },
        strange_map:       { id: 'strange_map',       name: '异界地图',   desc: '一张画着你看不懂的地图。也许以后会有用。', tier: 'legendary', reward: { reputation: 30 } }
    };

    // ═══════════════════════════════════════════════════════════
    //  内部状态
    // ═══════════════════════════════════════════════════════════

    var _currentLocation = 'teahouse';
    var _exploredToday = {};
    var _discoveredItems = [];
    var _exploreCount = 0;

    // ═══════════════════════════════════════════════════════════
    //  探索逻辑
    // ═══════════════════════════════════════════════════════════

    function moveTo(locationId) {
        if (!locationId || !LOCATIONS[locationId]) return { success: false, reason: 'invalid_location' };

        var loc = LOCATIONS[locationId];

        // 检查等级限制
        if (loc.minLevel && window.Teahouse) {
            var status = Teahouse.getStatus();
            if (status.level < loc.minLevel) {
                return { success: false, reason: 'level_required', needLevel: loc.minLevel };
            }
        }

        // 检查时段限制
        if (window.GameTime) {
            var period = GameTime.getPeriod();
            if (loc.availablePeriods && loc.availablePeriods.indexOf(period.id) === -1) {
                return { success: false, reason: 'wrong_time', currentPeriod: period.name, availablePeriods: loc.availablePeriods };
            }
        }

        _currentLocation = locationId;
        return { success: true, location: loc };
    }

    function explore() {
        var loc = LOCATIONS[_currentLocation];
        if (!loc) return { success: false, reason: 'no_location' };

        // 收益递减：同地点同一天探索次数越多，采集概率越低
        // 第1次60% → 第2次40% → 第3次25% → 之后15%
        if (!_exploredToday[_currentLocation]) _exploredToday[_currentLocation] = 0;
        _exploredToday[_currentLocation]++;
        _exploreCount++;

        var exploreTimes = _exploredToday[_currentLocation];
        var materialChance = exploreTimes <= 1 ? 0.6 : (exploreTimes === 2 ? 0.4 : (exploreTimes === 3 ? 0.25 : 0.15));
        var discoveryChance = exploreTimes <= 1 ? 0.2 : (exploreTimes === 2 ? 0.12 : 0.06);

        var results = [];

        // 1. 采集材料（概率递减）
        if (loc.materials.length > 0 && Math.random() < materialChance) {
            var matId = loc.materials[Math.floor(Math.random() * loc.materials.length)];
            var count = Math.floor(Math.random() * 3) + 1;
            if (window.Teahouse) {
                Teahouse.addMaterialToInventory(matId, count);
            }
            var matDefs = window.Teahouse ? Teahouse.getMaterialDefs() : {};
            var matInfo = matDefs[matId];
            results.push({ type: 'material', id: matId, name: matInfo ? matInfo.name : matId, count: count });
        }

        // 2. 发现物（概率递减）
        if (loc.discoveries.length > 0 && Math.random() < discoveryChance) {
            var discId = loc.discoveries[Math.floor(Math.random() * loc.discoveries.length)];
            var disc = DISCOVERIES[discId];
            if (disc) {
                _discoveredItems.push(discId);
                results.push({ type: 'discovery', id: discId, name: disc.name, desc: disc.desc, tier: disc.tier, reward: disc.reward });

                // 应用奖励
                if (disc.reward) {
                    if (disc.reward.gold && window.Teahouse) {
                        // 通过BusinessLogic间接加钱
                    }
                    if (disc.reward.reputation && window.Teahouse) {
                        // 声望通过Teahouse内部状态加
                    }
                    if (disc.reward.material && window.Teahouse) {
                        Teahouse.addMaterialToInventory(disc.reward.material, disc.reward.count || 1);
                    }
                }
            }
        }

        // 3. 遇到NPC（按概率）
        var metNpc = null;
        if (window.DailyEngine && Math.random() < loc.npcChance) {
            var npcsHere = [];
            if (window.NpcMovement) {
                var allIds = DailyEngine.getAllNpcIds();
                for (var ni = 0; ni < allIds.length; ni++) {
                    var ent = NpcMovement.getNpcEntity(allIds[ni]);
                    if (ent && ent.locationId === _currentLocation) {
                        var st = DailyEngine.getDailyState(allIds[ni]);
                        npcsHere.push({ npcId: allIds[ni], name: st ? st.name : allIds[ni], moodEmoji: st ? st.moodEmoji : '🙂' });
                    }
                }
            }
            if (npcsHere.length > 0) {
                metNpc = npcsHere[Math.floor(Math.random() * npcsHere.length)];
                results.push({ type: 'npc', npcId: metNpc.npcId, name: metNpc.name, mood: metNpc.moodEmoji });
            }
        }

        // 4. 什么都没找到（兜底）
        if (results.length === 0) {
            var nothingMsgs = [
                '你四处看了看，没什么特别的。',
                '今天运气一般，什么都没发现。',
                '这里很安静，只有风声。',
                '你走了一圈，只收获了一些泥土。'
            ];
            results.push({ type: 'nothing', message: nothingMsgs[Math.floor(Math.random() * nothingMsgs.length)] });
        }

        return { success: true, location: loc, results: results };
    }

    function getCurrentLocation() {
        return LOCATIONS[_currentLocation] || LOCATIONS.teahouse;
    }

    function getCurrentLocationId() {
        return _currentLocation;
    }

    function getAvailableLocations() {
        var result = [];
        var level = (window.Teahouse) ? Teahouse.getStatus().level : 1;
        var periodId = (window.GameTime) ? GameTime.getPeriod().id : 'morning';

        for (var key in LOCATIONS) {
            if (!LOCATIONS.hasOwnProperty(key)) continue;
            var loc = LOCATIONS[key];
            var available = true;
            if (loc.minLevel && level < loc.minLevel) available = false;
            if (loc.availablePeriods && loc.availablePeriods.indexOf(periodId) === -1) available = false;
            result.push({ id: key, name: loc.name, emoji: loc.emoji, available: available, desc: loc.desc });
        }
        return result;
    }

    function resetDailyExploration() {
        _exploredToday = {};
    }

    function getDiscoveredItems() { return _discoveredItems.slice(); }
    function getExploreCount() { return _exploreCount; }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        _currentLocation = 'teahouse';
        _exploredToday = {};
        _discoveredItems = [];
        _exploreCount = 0;
        if (window.Logger) Logger.info('WorldExplore', '地图探索系统初始化');
    }

    return {
        init: init,
        moveTo: moveTo,
        explore: explore,
        getCurrentLocation: getCurrentLocation,
        getCurrentLocationId: getCurrentLocationId,
        getAvailableLocations: getAvailableLocations,
        resetDailyExploration: resetDailyExploration,
        getDiscoveredItems: getDiscoveredItems,
        getExploreCount: getExploreCount,
        LOCATIONS: LOCATIONS,
        DISCOVERIES: DISCOVERIES
    };
})();

window.WorldExplore = WorldExplore;
