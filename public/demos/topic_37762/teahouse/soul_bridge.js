var SoulBridge = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // NPC灵魂调度脑 - 网页项目桥接层 v2
    // 新增：中断机制、权重钳制、需求修正、MapLocator集成
    // ═══════════════════════════════════════════════════════════

    // ── 常量 ──────────────────────────────────────────────

    var WEIGHT_MIN = 0.0;
    var WEIGHT_MAX = 150.0;

    var INTERRUPTION_PRIORITY = {
        CRITICAL_NEED: 100,
        PLAYER_INTERACTION: 90,
        WEATHER_EMERGENCY: 80,
        SAFETY_CONCERN: 70,
        DEFAULT: 0
    };

    var CRITICAL_NEED_THRESHOLD = 80;

    // ── 工具函数 ──────────────────────────────────────────

    function clampWeight(weight) {
        return Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, weight));
    }

    // ── 核心功能 ──────────────────────────────────────────

    function ensureSchedulerState(state, profile) {
        if (!state) { state = {}; }
        if (!profile) { return state; }

        state.intent = state.intent || {
            goalType: 'idle',
            priority: 0,
            reasonTags: ['default'],
            expiresAt: Date.now() + 1800000
        };

        state.plan = state.plan || {
            steps: [],
            currentStep: 0,
            fallbackGoal: 'idle',
            deadline: Date.now() + 1800000
        };

        state.anchors = state.anchors || {
            home: profile.homeLocation || 'east_street',
            favorite: profile.favoriteLocation || 'teahouse',
            work: profile.workLocation || ''
        };

        state.traits = state.traits || {
            social: profile.personality ? profile.personality.social : 50,
            curiosity: profile.personality ? profile.personality.curiosity : 50,
            diligence: profile.personality ? profile.personality.diligence : 50,
            emotion: profile.personality ? profile.personality.emotion : 50,
            adventure: profile.personality ? profile.personality.adventure : 50
        };

        // 确保需求字段
        state.needs = state.needs || {
            hunger: state.hunger || 30,
            thirst: 25,
            sleep: 20,
            hygiene: 15,
            health: 10,
            loneliness: 100 - (state.traits.social || 50),
            belonging: 30,
            achievement: 20,
            reputation: 15,
            creativity: 25
        };

        // 确保 cooldowns 字段
        state.cooldowns = state.cooldowns || {
            social: 0,
            location: {},
            event: {}
        };

        // 确保 memory 字段
        state.memory = state.memory || {
            shortTerm: [],
            longTerm: [],
            important: []
        };

        return state;
    }

    // ── 中断检查 ──────────────────────────────────────────

    /**
     * 检查所有中断条件，按优先级返回
     * 中断优先级：高优先级需求 > 天气突变 > 安全担忧
     */
    function checkInterruptions(state, snapshot) {
        if (!state || !snapshot) { return null; }

        // 1. 高优先级需求检查
        var urgentNeed = _checkCriticalNeeds(state);
        if (urgentNeed) { return urgentNeed; }

        // 2. 天气突变检查
        var weatherInterrupt = _checkWeatherEmergency(state, snapshot);
        if (weatherInterrupt) { return weatherInterrupt; }

        // 3. 安全担忧检查
        var safetyInterrupt = _checkSafetyConcerns(state);
        if (safetyInterrupt) { return safetyInterrupt; }

        return null;
    }

    function _checkCriticalNeeds(state) {
        if (!state || !state.needs) { return null; }
        var needs = state.needs;
        // 饥饿或睡眠需求值 >= 80 表示迫切
        if (typeof needs.hunger === 'number' && needs.hunger >= CRITICAL_NEED_THRESHOLD) {
            return {
                goalType: 'go_home_rest',
                priority: INTERRUPTION_PRIORITY.CRITICAL_NEED,
                reasonTags: ['urgent_need', 'hunger'],
                expiresAt: Date.now() + 3600000
            };
        }
        if (typeof needs.sleep === 'number' && needs.sleep >= CRITICAL_NEED_THRESHOLD) {
            return {
                goalType: 'go_home_rest',
                priority: INTERRUPTION_PRIORITY.CRITICAL_NEED,
                reasonTags: ['urgent_need', 'sleep'],
                expiresAt: Date.now() + 3600000
            };
        }
        return null;
    }

    function _checkWeatherEmergency(state, snapshot) {
        if (!state || !snapshot) { return null; }
        var weather = snapshot.weather || 'clear';
        // 只在NPC在室外时才触发天气中断
        var currentGoal = state.intent ? state.intent.goalType : '';
        if (currentGoal === 'avoid_rain' || currentGoal === 'go_home_rest') { return null; } // 已在避雨/回家
        if (weather === 'rainy' || weather === 'stormy' || weather === 'snowy' || weather === 'drizzle') {
            return {
                goalType: 'avoid_rain',
                priority: INTERRUPTION_PRIORITY.WEATHER_EMERGENCY,
                reasonTags: ['weather', weather],
                expiresAt: Date.now() + 1800000
            };
        }
        return null;
    }

    function _checkSafetyConcerns(state) {
        if (!state || !state.memory) { return null; }
        var shortTerm = state.memory.shortTerm || [];
        for (var i = 0; i < shortTerm.length; i++) {
            var mem = shortTerm[i];
            if (mem.tags && (mem.tags.indexOf('danger') >= 0 || mem.tags.indexOf('rain') >= 0)) {
                if (mem.importance > 50) {
                    return {
                        goalType: 'go_home_rest',
                        priority: INTERRUPTION_PRIORITY.SAFETY_CONCERN,
                        reasonTags: ['safety_concern'],
                        expiresAt: Date.now() + 2400000
                    };
                }
            }
        }
        return null;
    }

    // ── 候选目标生成 ──────────────────────────────────────

    function generateCandidateGoals(state, snapshot) {
        if (!state || !snapshot) { return []; }

        var traits = state.traits || {};
        var needs = state.needs || {};
        var memory = state.memory || {};
        var timePeriod = snapshot.timePeriod || 'morning';
        var weather = snapshot.weather || 'clear';

        var candidates = [];
        var baseGoals = _getBaseGoalsForPeriod(timePeriod);

        for (var i = 0; i < baseGoals.length; i++) {
            var base = baseGoals[i];
            var weight = base.weight;

            // 人格修正
            weight = _applyTraitModification(base.goalType, weight, traits);

            // 需求修正 - 检查所有需求
            weight = _applyNeedModification(base.goalType, weight, needs);

            // 天气修正
            weight = _applyWeatherModification(base.goalType, weight, weather);

            // 记忆修正 — 记忆参与目标选择的权重计算
            weight = _applyMemoryModification(base.goalType, weight, memory);

            // 权重钳制
            weight = clampWeight(weight);

            candidates.push({
                goalType: base.goalType,
                weight: weight,
                reason: base.reason
            });
        }

        candidates.sort(function(a, b) { return b.weight - a.weight; });
        return candidates;
    }

    function _getBaseGoalsForPeriod(timePeriod) {
        switch (timePeriod) {
            case 'morning':
                return [
                    {goalType: 'go_work', weight: 80, reason: 'work_hours'},
                    {goalType: 'seek_food', weight: 45, reason: 'breakfast'},  // 辰时早食，古代一日两餐之首
                    {goalType: 'wander_favorite', weight: 25, reason: 'early_bird'}
                ];
            case 'afternoon':
                return [
                    {goalType: 'go_work', weight: 85, reason: 'work_hours'},
                    {goalType: 'seek_social', weight: 40, reason: 'lunch_break'},
                    {goalType: 'seek_food', weight: 30, reason: 'afternoon_snack'},  // 非正餐时间，低优先
                    {goalType: 'wander_favorite', weight: 30, reason: 'free_time'}
                ];
            case 'evening':
                return [
                    {goalType: 'seek_food', weight: 55, reason: 'dinner'},  // 申时晚食，古代一日两餐之二
                    {goalType: 'go_home_rest', weight: 50, reason: 'evening_rest'},
                    {goalType: 'seek_social', weight: 45, reason: 'evening_social'}
                ];
            case 'night':
                return [
                    {goalType: 'go_home_rest', weight: 95, reason: 'sleep_time'},
                    {goalType: 'seek_social', weight: 10, reason: 'late_night'}  // 夜间极少社交
                ];
            default:
                return [
                    {goalType: 'wander_favorite', weight: 40, reason: 'default'}
                ];
        }
    }

    function _applyTraitModification(goalType, weight, traits) {
        if (!traits) { return clampWeight(weight); }
        var diligence = typeof traits.diligence === 'number' ? traits.diligence : 50;
        var social = typeof traits.social === 'number' ? traits.social : 50;
        var curiosity = typeof traits.curiosity === 'number' ? traits.curiosity : 50;

        switch (goalType) {
            case 'go_work':
                return clampWeight(weight + (diligence - 50) * 0.4);
            case 'seek_social':
                return clampWeight(weight + (social - 50) * 0.4);
            case 'wander_favorite':
                return clampWeight(weight + (curiosity - 50) * 0.3);
            default:
                return clampWeight(weight);
        }
    }

    /**
     * 需求修正 - 检查所有需求（v2 新增）
     * 替代旧版只检查最高优先级需求的做法
     */
    function _applyNeedModification(goalType, weight, needs) {
        if (!needs) { return clampWeight(weight); }

        // 饥饿 >= 85 才显著影响（古代一日两餐，不会轻易饿）
        if (needs.hunger >= 85) {
            if (goalType === 'seek_food' || goalType === 'go_home_rest') {
                weight += 25;
            }
        } else if (needs.hunger >= 70) {
            // 饥饿>=70只在饭点才加成
            if (goalType === 'seek_food') {
                weight += 10;
            }
        }
        // 口渴 >= 80
        if (needs.thirst >= 80) {
            if (goalType === 'seek_food' || goalType === 'go_home_rest') {
                weight += 15;
            }
        }
        // 睡眠 >= 75
        if (needs.sleep >= 75) {
            if (goalType === 'go_home_rest') {
                weight += 35;
            }
        }
        // 孤独 >= 75
        if (needs.loneliness >= 75) {
            if (goalType === 'seek_social') {
                weight += 30;
            }
        }
        // 健康 >= 80
        if (needs.health >= 80) {
            if (goalType === 'go_home_rest') {
                weight += 30;
            }
        }

        return clampWeight(weight);
    }

    function _applyWeatherModification(goalType, weight, weather) {
        if (weather === 'rainy' || weather === 'stormy' || weather === 'snowy' || weather === 'drizzle') {
            if (goalType === 'avoid_rain') {
                return clampWeight(weight + 50);
            } else if (goalType === 'go_work') {
                return clampWeight(weight - 20);
            } else if (goalType === 'wander_favorite') {
                return clampWeight(weight - 30);
            }
        }
        return clampWeight(weight);
    }

    /**
     * 记忆修正 — 记忆参与目标选择的权重计算
     * 核心规则：
     *   - 负面记忆（被骂、被偷、受伤）降低相关目标权重
     *   - 正面记忆（开心、赚钱、交友）提升相关目标权重
     *   - 重要记忆影响更大
     *   - 核心记忆（不衰减）影响最大
     */
    function _applyMemoryModification(goalType, weight, memory) {
        if (!memory) { return weight; }

        var modifier = 0;
        var allMemories = [].concat(
            memory.shortTerm || [],
            memory.longTerm || [],
            memory.important || []
        );

        // 目标类型与记忆标签的关联映射
        var goalTagMap = {
            'go_work':       ['work', 'job', 'business', 'craft'],
            'seek_food':     ['food', 'eat', 'restaurant', 'hungry'],
            'seek_social':   ['social', 'friend', 'talk', 'chat', 'companion'],
            'go_home_rest':  ['home', 'rest', 'sleep', 'tired'],
            'avoid_rain':    ['rain', 'weather', 'shelter', 'cold'],
            'wander_favorite': ['wander', 'explore', 'stroll', 'shop']
        };

        var relatedTags = goalTagMap[goalType];
        if (!relatedTags) { return weight; }

        for (var i = 0; i < allMemories.length; i++) {
            var mem = allMemories[i];
            if (!mem || typeof mem !== 'object') { continue; }

            var tags = mem.tags || [];
            var emotion = typeof mem.emotion === 'number' ? mem.emotion : 50;
            var importance = typeof mem.importance === 'number' ? mem.importance : 50;

            // 检查记忆是否与当前目标相关
            var isRelated = false;
            for (var t = 0; t < tags.length; t++) {
                if (relatedTags.indexOf(tags[t]) >= 0) {
                    isRelated = true;
                    break;
                }
            }
            if (!isRelated) { continue; }

            // 基于情绪值计算修正：emotion < 40 为负面，> 60 为正面
            var emotionModifier = (emotion - 50) / 50; // -0.2 到 +0.2
            // 基于重要度缩放修正
            var importanceScale = importance / 100; // 0 到 1
            // 核心记忆影响翻倍
            var isCore = tags.indexOf('core') >= 0;
            var coreMultiplier = isCore ? 2.0 : 1.0;

            modifier += emotionModifier * importanceScale * coreMultiplier * 15;
        }

        return weight + modifier;
    }

    // ── 目标选择 ──────────────────────────────────────────

    /**
     * 从候选目标中选择最佳目标
     * 当多个候选权重接近（差距<15）时加入随机扰动，避免所有NPC同质化
     */
    function selectBestGoal(candidateGoals) {
        if (!candidateGoals || candidateGoals.length === 0) {
            return {goalType: 'idle', weight: 0, reason: 'no_candidates'};
        }

        if (candidateGoals.length === 1) {
            return candidateGoals[0];
        }

        // 检查前两名权重差距
        var top = candidateGoals[0];
        var second = candidateGoals[1];
        var weightGap = top.weight - second.weight;

        // 权重差距足够大（>=15），直接选最高
        if (weightGap >= 15) {
            return top;
        }

        // 权重接近时，加入随机扰动（10%概率选第二名，5%概率选第三名）
        var roll = Math.random();
        if (roll < 0.10 && second) {
            return second;
        }
        if (roll < 0.15 && candidateGoals.length >= 3 && candidateGoals[2]) {
            return candidateGoals[2];
        }

        return top;
    }

    function getGoalName(goalType) {
        var goalNames = {
            'idle': '空闲',
            'go_work': '去工作',
            'go_home_rest': '回家休息',
            'seek_social': '社交',
            'seek_food': '觅食',
            'avoid_rain': '避雨',
            'wander_favorite': '闲逛',
            'investigate_rumor': '调查流言'
        };
        return goalNames[goalType] || goalType;
    }

    function updateNpcFromGoal(state, goal) {
        if (!state || !goal) { return; }
        state.intent = {
            goalType: goal.goalType || 'idle',
            priority: goal.weight || 0,
            reasonTags: goal.reason ? [goal.reason] : ['default'],
            expiresAt: Date.now() + 1800000
        };
    }

    // ── 记忆系统 ──────────────────────────────────────────

    /**
     * 添加标签记忆
     */
    function addTaggedMemory(state, memoryType, category, content, meta) {
        if (!state || !state.memory) { return; }

        var memory = {
            id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: memoryType,
            category: category,
            content: content,
            timestamp: Date.now(),
            importance: meta.importance || 50,
            emotionValue: meta.emotionValue || 0,
            confidence: meta.confidence || 1.0,
            tags: meta.tags || []
        };

        if (memoryType === 'short_term') {
            state.memory.shortTerm.push(memory);
            if (state.memory.shortTerm.length > 20) {
                state.memory.shortTerm.shift();
            }
        } else if (memoryType === 'long_term') {
            state.memory.longTerm.push(memory);
            if (state.memory.longTerm.length > 100) {
                state.memory.longTerm.shift();
            }
        } else if (memoryType === 'important') {
            state.memory.important.push(memory);
            if (state.memory.important.length > 50) {
                state.memory.important.shift();
            }
        }
    }

    /**
     * 获取最高优先级记忆
     */
    function getTopMemories(state, tags, limit) {
        if (!state || !state.memory) { return []; }
        limit = limit || 3;

        var all = (state.memory.shortTerm || [])
            .concat(state.memory.longTerm || [])
            .concat(state.memory.important || []);

        all.sort(function(a, b) { return b.importance - a.importance; });

        if (!tags || tags.length === 0) {
            return all.slice(0, limit);
        }

        var result = [];
        for (var i = 0; i < all.length; i++) {
            var mem = all[i];
            if (mem.tags && mem.tags.length > 0) {
                for (var j = 0; j < tags.length; j++) {
                    if (mem.tags.indexOf(tags[j]) >= 0) {
                        result.push(mem);
                        break;
                    }
                }
            }
            if (result.length >= limit) { break; }
        }
        return result;
    }

    // ── 导出 ──────────────────────────────────────────────

    return {
        ensureSchedulerState: ensureSchedulerState,
        checkInterruptions: checkInterruptions,
        generateCandidateGoals: generateCandidateGoals,
        selectBestGoal: selectBestGoal,
        getGoalName: getGoalName,
        updateNpcFromGoal: updateNpcFromGoal,
        addTaggedMemory: addTaggedMemory,
        getTopMemories: getTopMemories,

        // 常量
        INTERRUPTION_PRIORITY: INTERRUPTION_PRIORITY,
        CRITICAL_NEED_THRESHOLD: CRITICAL_NEED_THRESHOLD,
        WEIGHT_MIN: WEIGHT_MIN,
        WEIGHT_MAX: WEIGHT_MAX
    };
})();

window.SoulBridge = SoulBridge;
