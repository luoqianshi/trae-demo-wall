var SoulTick = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 灵魂调度脑驱动循环 - 网页版
    // 定时驱动 NPC 决策：需求衰减 → 中断检查 → 目标选择 → 计划执行
    // ═══════════════════════════════════════════════════════════

    var _tickInterval = null;
    var _tickRate = 2000; // 2秒一次决策循环
    var _npcStates = {};  // npcId -> 调度脑状态
    var _worldSnapshot = {
        weather: 'clear',
        timePeriod: 'morning',
        playerLocation: ''
    };

    // NPC互动冷却和显示队列
    var _npcInteractionCooldown = {}; // "idA+idB" -> lastTime
    var _interactionDisplayQueue = []; // 待显示的互动事件
    var INTERACTION_COOLDOWN_MS = 30000; // 同一对NPC 30秒内不重复互动

    // 需求衰减率（每次 tick 的衰减量）
    // 古代一日两餐，饥饿/口渴衰减较慢；夜间睡眠恢复
    var NEED_DECAY = {
        hunger: 1.2,      // 降低：古代一日两餐，不常饿
        thirst: 1.5,      // 降低：不常渴
        sleep: 1.5,
        hygiene: 0.8,
        health: 0.3,
        loneliness: 1.0,
        belonging: 0.5,
        achievement: 0.3,
        reputation: 0.2,
        creativity: 0.5
    };

    // 目标到地点的映射
    var GOAL_LOCATION_MAP = {
        'go_work': 'work',
        'go_home_rest': 'home',
        'seek_social': 'social',
        'seek_food': 'food',
        'avoid_rain': 'shelter',
        'wander_favorite': 'favorite',
        'investigate_rumor': 'market',
        'idle': 'current'
    };

    // 地点类型到具体地点的映射（从 NPC profile 动态生成）
    var LOCATION_TYPE_MAP = {};

    function _buildLocationTypeMap() {
        LOCATION_TYPE_MAP = {
            home: {}, work: {}, favorite: {}, social: {}, food: {}, shelter: {}
        };
        if (!window.DailyEngine) return;

        var ids = DailyEngine.getAllNpcIds();
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            var profile = DailyEngine.getNpcProfile(id);
            if (!profile) continue;

            var home = profile.homeLocation || 'east_street';
            var work = profile.workLocation || home;
            var fav = profile.favoriteLocation || home;

            LOCATION_TYPE_MAP.home[id] = home;
            LOCATION_TYPE_MAP.work[id] = work;
            LOCATION_TYPE_MAP.favorite[id] = fav;

            // 社交地点：根据性格选
            var social = profile.personality ? profile.personality.social : 50;
            LOCATION_TYPE_MAP.social[id] = social >= 60 ? 'teahouse' : 'market';

            // 觅食地点
            LOCATION_TYPE_MAP.food[id] = 'market';

            // 避雨地点：优先工作地点或家
            LOCATION_TYPE_MAP.shelter[id] = work || home;
        }
    }

    // ── 初始化 ────────────────────────────────────────────

    function init() {
        _npcStates = {};
        if (!window.DailyEngine) return;

        // 构建地点映射
        _buildLocationTypeMap();

        var ids = DailyEngine.getAllNpcIds();
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            var profile = DailyEngine.getNpcProfile(id);
            var state = DailyEngine.getDailyState(id);

            // 使用 SoulBridge 确保调度脑字段
            var schedulerState = SoulBridge.ensureSchedulerState({}, profile);

            // 从 DailyEngine 状态初始化需求
            if (state) {
                schedulerState.needs.hunger = state.hunger || 30;
                schedulerState.needs.sleep = state.fatigue ? Math.min(100, state.fatigue * 1.2) : 20;
                schedulerState.needs.loneliness = state.socialNeed ? (100 - state.socialNeed) : 30;
            }

            _npcStates[id] = schedulerState;
        }

        // 初始化 MapLocator
        if (window.MapLocator) {
            MapLocator.loadLocations({});
        }

        Logger.info('SoulTick', '灵魂调度脑初始化完成', {npcCount: ids.length});
    }

    function start() {
        if (_tickInterval) clearInterval(_tickInterval);
        _tickInterval = setInterval(tick, _tickRate);
        Logger.info('SoulTick', '调度脑循环启动', {tickRate: _tickRate});
    }

    function stop() {
        if (_tickInterval) {
            clearInterval(_tickInterval);
            _tickInterval = null;
        }
    }

    // ── 计划生成与步骤追踪 ──────────────────────────────

    // 目标到计划步骤的映射
    var GOAL_PLAN_STEPS = {
        'go_work':           ['前往工作地点', '开始工作', '工作完成'],
        'go_home_rest':      ['返回家中', '休息恢复', '恢复完毕'],
        'seek_social':       ['前往社交地点', '与人交流', '社交结束'],
        'seek_food':         ['前往集市', '购买食物', '进食完毕'],
        'avoid_rain':        ['寻找避雨处', '等待雨停', '雨停了'],
        'wander_favorite':   ['前往喜爱地点', '闲逛放松', '闲逛结束'],
        'investigate_rumor': ['前往集市打听', '收集信息', '调查完毕'],
        'idle':              ['原地停留']
    };

    function _buildPlanForGoal(state, goal) {
        if (!state || !goal) return;

        var goalType = goal.goalType || 'idle';
        var steps = GOAL_PLAN_STEPS[goalType] || ['执行目标'];

        state.plan = {
            steps: steps,
            currentStep: 0,
            fallbackGoal: 'idle',
            deadline: Date.now() + 1800000 // 30分钟超时
        };

        // 记录计划生成到记忆
        SoulBridge.addTaggedMemory(state, 'short_term', 'plan',
            '新计划: ' + steps[0],
            {importance: 30, emotionValue: 0, tags: ['plan', goalType]}
        );
    }

    function _advancePlanStep(state) {
        if (!state || !state.plan) return;

        var plan = state.plan;
        if (!plan.steps || plan.steps.length === 0) return;

        // 检查计划是否超时
        if (plan.deadline && Date.now() > plan.deadline) {
            // 超时切换到备用计划
            var fallbackGoal = plan.fallbackGoal || 'idle';
            SoulBridge.addTaggedMemory(state, 'short_term', 'event',
                '计划超时，切换备用: ' + fallbackGoal,
                {importance: 40, emotionValue: -5, tags: ['plan_timeout', fallbackGoal]}
            );
            var fallback = { goalType: fallbackGoal, weight: 50, reason: 'plan_timeout' };
            SoulBridge.updateNpcFromGoal(state, fallback);
            _buildPlanForGoal(state, fallback);
            return;
        }

        // 检查NPC是否到达了目标地点（步骤推进条件）
        var currentStepIdx = plan.currentStep || 0;
        if (currentStepIdx >= plan.steps.length - 1) return; // 已在最后一步

        var entity = window.NpcMovement ? NpcMovement.getNpcEntity(
            _getNpcIdByState(state)
        ) : null;

        if (entity && entity.state === 'idle') {
            // NPC到达目的地且空闲，推进到下一步
            plan.currentStep = currentStepIdx + 1;

            // 最后一步完成时记录
            if (plan.currentStep >= plan.steps.length - 1) {
                SoulBridge.addTaggedMemory(state, 'short_term', 'event',
                    '计划完成: ' + plan.steps[plan.steps.length - 1],
                    {importance: 35, emotionValue: 5, tags: ['plan_complete']}
                );
            }
        }
    }

    function _getNpcIdByState(state) {
        // 从_npcStates反查npcId
        for (var id in _npcStates) {
            if (_npcStates.hasOwnProperty(id) && _npcStates[id] === state) {
                return id;
            }
        }
        return '';
    }

    // ── LOD 摘要状态存储 ──────────────────────────────────
    var _lodSummaries = {};  // {npcId: {savedIntent, savedPlan, savedAt, lastLocation}}

    /**
     * 保存NPC摘要状态（切到远景时调用）
     * 保留目标和计划的快照，以便切回近景时恢复
     */
    function _saveLodSummary(npcId, state) {
        if (!state) return;
        _lodSummaries[npcId] = {
            savedIntent: state.intent ? {
                goalType: state.intent.goalType,
                priority: state.intent.priority,
                reasonTags: state.intent.reasonTags ? state.intent.reasonTags.slice() : [],
                expiresAt: state.intent.expiresAt
            } : null,
            savedPlan: state.plan ? {
                steps: state.plan.steps ? state.plan.steps.slice() : [],
                currentStep: state.plan.currentStep || 0,
                fallbackGoal: state.plan.fallbackGoal || null,
                deadline: state.plan.deadline || null
            } : null,
            savedAt: Date.now(),
            lastLocation: state.context ? state.context.currentLocation : ''
        };
    }

    /**
     * 恢复NPC摘要状态（从远景切回近景时调用）
     * 平滑恢复之前保存的目标和计划，避免NPC突然失去上下文
     */
    function _restoreLodSummary(npcId, state) {
        var summary = _lodSummaries[npcId];
        if (!summary || !state) return;

        // 检查摘要是否过期（超过5分钟视为过期，不恢复）
        if (Date.now() - summary.savedAt > 300000) {
            delete _lodSummaries[npcId];
            return;
        }

        // 恢复目标（如果还没过期）
        if (summary.savedIntent && summary.savedIntent.expiresAt > Date.now()) {
            if (!state.intent || state.intent.goalType !== summary.savedIntent.goalType) {
                state.intent = {
                    goalType: summary.savedIntent.goalType,
                    priority: summary.savedIntent.priority,
                    reasonTags: summary.savedIntent.reasonTags ? summary.savedIntent.reasonTags.slice() : [],
                    expiresAt: summary.savedIntent.expiresAt
                };
            }
        }

        // 恢复计划（如果还没完成和过期）
        if (summary.savedPlan && summary.savedPlan.deadline > Date.now()) {
            if (!state.plan || !state.plan.steps || state.plan.steps.length === 0) {
                state.plan = {
                    steps: summary.savedPlan.steps.slice(),
                    currentStep: summary.savedPlan.currentStep,
                    fallbackGoal: summary.savedPlan.fallbackGoal,
                    deadline: summary.savedPlan.deadline
                };
            }
        }

        delete _lodSummaries[npcId];
    }

    /**
     * 远景摘要结算 — 只更新关键需求，不做完整决策
     * 保留位置和状态连续性
     */
    function _tickFarSummary(npcId, state) {
        if (!state || !state.needs) return;

        // 需求衰减（半速，因为远景不频繁更新）
        var needs = state.needs;
        var needKeys = Object.keys(needs);
        for (var i = 0; i < needKeys.length; i++) {
            var key = needKeys[i];
            if (typeof needs[key] === 'number') {
                needs[key] = Math.max(0, needs[key] - 0.5);  // 半速衰减
            }
        }

        // 检查是否有临界需求需要记录
        if (needs.hunger < 20 || needs.sleep < 15) {
            if (state.memory && state.memory.shortTerm) {
                // 记录远景期间的关键状态
                var hasRecentCritical = false;
                for (var j = state.memory.shortTerm.length - 1; j >= 0 && j >= state.memory.shortTerm.length - 3; j--) {
                    if (state.memory.shortTerm[j] && state.memory.shortTerm[j].tags &&
                        state.memory.shortTerm[j].tags.indexOf('critical') >= 0) {
                        hasRecentCritical = true;
                        break;
                    }
                }
                if (!hasRecentCritical) {
                    state.memory.shortTerm.push({
                        content: '远景期间需求告急: ' + (needs.hunger < 20 ? '饥饿' : '疲劳'),
                        tags: ['critical', 'far_lod'],
                        importance: 60,
                        emotion: 20,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }

    // ── 主循环 ────────────────────────────────────────────

    var _tickFrameCount = 0;

    function tick() {
        _updateWorldSnapshot();
        _tickFrameCount++;

        for (var npcId in _npcStates) {
            if (!_npcStates.hasOwnProperty(npcId)) continue;
            var state = _npcStates[npcId];

            // 对话中的NPC不更新决策
            if (window.dialogueActive && window.currentDialogueNpc === npcId) continue;

            // ── 动物NPC特殊决策：基于行为模式而非人类目标 ──
            var profile = (window.DailyEngine) ? DailyEngine.getNpcProfile(npcId) : null;
            if (profile && profile.isAnimal && profile.animalBehaviors) {
                _tickAnimalNpc(npcId, state, profile);
                continue;  // 跳过正常决策循环
            }

            // ── LOD分级控制 ──
            var entity = (window.NpcMovement) ? NpcMovement.getNpcEntity(npcId) : null;
            var lod = entity ? (entity.lod || 'far') : 'far';
            var prevLod = state._prevLod || 'near';

            // LOD切换处理
            if (lod !== prevLod) {
                if (lod === 'far' && prevLod !== 'far') {
                    // near/mid → far：保存摘要
                    _saveLodSummary(npcId, state);
                } else if (prevLod === 'far' && lod !== 'far') {
                    // far → near/mid：恢复摘要
                    _restoreLodSummary(npcId, state);
                }
                state._prevLod = lod;
            }

            // 基于LOD的tick频率控制
            if (lod === 'far') {
                // 远景：每10帧做一次摘要结算
                if (_tickFrameCount % 10 === 0) {
                    _tickFarSummary(npcId, state);
                }
                continue;  // 跳过完整决策循环
            } else if (lod === 'mid') {
                // 中景：每3帧执行一次完整决策
                if (_tickFrameCount % 3 !== 0) continue;
            }
            // near：每帧都执行完整决策

            // 1. 需求衰减
            _decayNeeds(state);

            // 1.5 环境影响情绪和需求
            _applyEnvironmentEffects(state, _worldSnapshot);

            // 2. 中断检查
            var interruption = SoulBridge.checkInterruptions(state, _worldSnapshot);

            // 3. 目标选择
            if (interruption) {
                SoulBridge.updateNpcFromGoal(state, interruption);
                SoulBridge.addTaggedMemory(state, 'short_term', 'event',
                    '中断: ' + interruption.reasonTags.join(', '),
                    {importance: 50, emotionValue: -10, tags: ['interruption'].concat(interruption.reasonTags)}
                );
                // 中断时重新生成计划
                _buildPlanForGoal(state, interruption);
            } else {
                // 只在目标变化时重新选择和规划
                var currentGoalType = state.intent ? state.intent.goalType : '';
                var candidates = SoulBridge.generateCandidateGoals(state, _worldSnapshot);
                var bestGoal = SoulBridge.selectBestGoal(candidates);
                if (bestGoal.goalType !== currentGoalType) {
                    SoulBridge.updateNpcFromGoal(state, bestGoal);
                    _buildPlanForGoal(state, bestGoal);
                }
            }

            // 4. 计划步骤推进
            _advancePlanStep(state);

            // 5. 同步到 NpcMovement
            _syncToNpcMovement(npcId, state);

            // 5.5 更新行为气泡emoji
            _updateNpcBubble(npcId, state);

            // 6. NPC主动对话检测
            _checkNpcInitiative(npcId, state);
        }

        // 6. NPC之间互动检测（每4个tick检测一次，约8秒）
        if (!SoulTick._tickCount) SoulTick._tickCount = 0;
        SoulTick._tickCount++;
        if (SoulTick._tickCount % 4 === 0) {
            _checkNpcInteractions();
        }

        // 7. 裂痕事件检测（每30个tick约60秒，让NPC状态变化后能及时触发冲突/崩溃/安慰）
        if (SoulTick._tickCount % 30 === 0 && window.DailyEngine && DailyEngine.detectRiftEvents && DailyEngine.applyRiftEvent) {
            try {
                var riftEvents = DailyEngine.detectRiftEvents();
                for (var ri = 0; ri < riftEvents.length; ri++) {
                    DailyEngine.applyRiftEvent(riftEvents[ri]);
                }
            } catch (e) { /* 静默吞掉，避免tick中断 */ }
        }

        // 8. 情绪传染（每60个tick约2分钟，群体心情向平均靠拢）
        if (SoulTick._tickCount % 60 === 0 && window.DailyEngine && DailyEngine.applyEmotionContagion) {
            try { DailyEngine.applyEmotionContagion(); } catch (e) { /* 静默吞掉 */ }
        }

        // 9. 处理互动显示队列
        _processInteractionDisplay();
    }

    // NPC主动对话概率
    function _checkNpcInitiative(npcId, state) {
        if (!window.DailyEngine || !window.NpcMovement) return;
        // 对话中不触发
        if (window.dialogueActive) return;
        // 冷却：每个NPC每60秒最多主动1次
        var now = Date.now();
        if (!state._lastInitiativeTime) state._lastInitiativeTime = 0;
        if (now - state._lastInitiativeTime < 60000) return;

        // 检查NPC是否在玩家附近
        var entity = NpcMovement.getNpcEntity(npcId);
        if (!entity) return;
        var pp = GameMap.getPlayerPixel();
        if (!pp) return;
        var dx = entity.x - pp.x;
        var dy = entity.y - pp.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 120) return; // 太远不触发

        // 好感度决定主动概率
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var initiativeProb = 0.4; // 默认
        if (rel >= 60) initiativeProb = 0.6;
        else if (rel >= 40) initiativeProb = 0.5;

        // 社交性格修正
        var profile = DailyEngine.getNpcProfile(npcId);
        if (profile && profile.personality) {
            var social = profile.personality.social || 50;
            initiativeProb *= (social / 50);
        }

        // 钳制到0.1~0.6
        initiativeProb = Math.max(0.1, Math.min(0.6, initiativeProb));

        // 每次tick只有5%基础概率（2秒tick），避免太频繁
        if (Math.random() < initiativeProb * 0.05) {
            state._lastInitiativeTime = now;
            _triggerNpcInitiative(npcId);
        }
    }

    function _triggerNpcInitiative(npcId) {
        var profile = DailyEngine.getNpcProfile(npcId);
        var state = DailyEngine.getDailyState(npcId);
        if (!profile || !state) return;

        var name = profile.name;
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var mood = state.mood || 50;
        var p = profile.personality || {};
        var warmth = p.warmth || 50;
        var humor = p.humor || 50;
        var stubbornness = p.stubbornness || 50;
        var caution = p.caution || 50;

        // 根据好感度+性格生成主动搭话
        var greetings;
        if (rel >= 60) {
            greetings = [
                name + '朝你招了招手，"嘿！过来坐坐！"',
                name + '笑着走过来，"正好想找你呢！"',
                name + '说："等你好久了，快过来！"'
            ];
            // 高热情的NPC更主动
            if (warmth >= 70) {
                greetings.push(name + '小跑过来，"你可算来了！我正想找人说说话！"');
                greetings.push(name + '一把拉住你，"来来来！我有事跟你说！"');
            }
            // 高幽默的NPC更调侃
            if (humor >= 70) {
                greetings.push(name + '嘿嘿一笑，"猜猜我今天碰到啥好事了？"');
                greetings.push(name + '冲你眨眨眼，"你绝对猜不到我刚听说了什么！"');
            }
        } else if (rel >= 40) {
            greetings = [
                name + '点了点头，"嗯，你好。"',
                name + '说："正好碰到你了。"',
                name + '打了个招呼，"来了啊。"'
            ];
            // 高谨慎的NPC更矜持
            if (caution >= 70) {
                greetings = [
                    name + '看了你一眼，犹豫了一下，还是点了点头。',
                    name + '轻声说："……你好。"'
                ];
            }
        } else {
            greetings = [
                name + '看了你一眼，犹豫了一下。',
                name + '说："……你好。"',
                name + '微微点了下头。'
            ];
            // 高固执的NPC更冷淡
            if (stubbornness >= 70) {
                greetings = [
                    name + '扫了你一眼，没说话。',
                    name + '哼了一声。'
                ];
            }
        }

        if (mood < 30) {
            greetings = [
                name + '叹了口气，看到你似乎想说点什么……',
                name + '欲言又止。'
            ];
            // 高感性的NPC更情绪化
            if ((p.emotion || 50) >= 70) {
                greetings.push(name + '眼眶微红，看到你勉强笑了笑。');
                greetings.push(name + '低着头，看到你时愣了一下，"……你来了。"');
            }
        }

        var text = greetings[Math.floor(Math.random() * greetings.length)];

        // 显示NPC主动搭话提示
        if (window.showToast) {
            showToast(text);
        }

        // 打开对话UI，让玩家可以回应
        if (window.talkToNpc && !window.dialogueActive) {
            // 延迟500ms打开，避免toast和对话UI同时弹出
            setTimeout(function() {
                if (!window.dialogueActive) {
                    talkToNpc(npcId);
                }
            }, 500);
        }
    }

    // ── NPC之间互动检测 ──────────────────────────────────

    function _checkNpcInteractions() {
        if (!window.NpcMovement || !window.EncounterSystem || !window.DailyEngine) return;

        var entities = NpcMovement.getAllEntities();
        if (!entities || entities.length < 2) return;

        var now = Date.now();

        // 按地点分组
        var locationGroups = {};
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e) continue;
            var loc = e.locationId || e.targetLocationId || '';
            if (!loc) continue;
            if (!locationGroups[loc]) locationGroups[loc] = [];
            locationGroups[loc].push(e);
        }

        // 对每个地点的同地点NPC，检测互动
        for (var loc in locationGroups) {
            if (!locationGroups.hasOwnProperty(loc)) continue;
            var npcsHere = locationGroups[loc];
            if (npcsHere.length < 2) continue;

            // 随机选一对
            var idxA = Math.floor(Math.random() * npcsHere.length);
            var idxB;
            do { idxB = Math.floor(Math.random() * npcsHere.length); } while (idxB === idxA);
            var npcA = npcsHere[idxA];
            var npcB = npcsHere[idxB];
            if (!npcA || !npcB || !npcA.id || !npcB.id) continue;

            // 检查像素距离（太远不互动）
            if (typeof npcA.x !== 'number' || typeof npcB.x !== 'number') continue;
            var dx = npcA.x - npcB.x;
            var dy = npcA.y - npcB.y;
            var pixelDist = Math.sqrt(dx * dx + dy * dy);
            if (pixelDist > 150) continue; // 超过150像素不互动

            // 冷却检查
            var pairKey = npcA.id < npcB.id ? npcA.id + '+' + npcB.id : npcB.id + '+' + npcA.id;
            if (_npcInteractionCooldown[pairKey] && now - _npcInteractionCooldown[pairKey] < INTERACTION_COOLDOWN_MS) {
                continue;
            }

            // 30%概率不互动
            if (Math.random() < 0.3) continue;

            // 生成互动
            var interaction = _generateNpcInteraction(npcA, npcB, loc);
            if (interaction) {
                _npcInteractionCooldown[pairKey] = now;
                _interactionDisplayQueue.push(interaction);
                // 回写交互效果到NPC状态
                if (window.EncounterSystem && EncounterSystem.applyInteractionEffects) {
                    EncounterSystem.applyInteractionEffects(interaction);
                }
            }
        }
    }

    function _generateNpcInteraction(npcA, npcB, loc) {
        var stateA = DailyEngine ? DailyEngine.getDailyState(npcA.id) : null;
        var stateB = DailyEngine ? DailyEngine.getDailyState(npcB.id) : null;
        var nameA = stateA ? stateA.name : npcA.id;
        var nameB = stateB ? stateB.name : npcB.id;
        var moodA = stateA ? stateA.mood : 50;
        var moodB = stateB ? stateB.mood : 50;
        var avgMood = (moodA + moodB) / 2;

        // 优先使用 EncounterSystem 的预设偶遇
        if (window.EncounterSystem) {
            var pairEncounters = EncounterSystem.checkPairEncounters(
                DailyEngine.getAllDailyStates(),
                function(id1, id2) { return 50; } // 默认关系值
            );
            for (var i = 0; i < pairEncounters.length; i++) {
                var pe = pairEncounters[i];
                if ((pe.npcA === npcA.id && pe.npcB === npcB.id) ||
                    (pe.npcA === npcB.id && pe.npcB === npcA.id)) {
                    return {
                        type: 'pair_encounter',
                        desc: pe.desc,
                        npcA: npcA,
                        npcB: npcB,
                        nameA: nameA,
                        nameB: nameB,
                        tier: pe.tier
                    };
                }
            }
        }

        // 通用互动：根据心情选择类型
        var interactionTypes;
        if (avgMood >= 60) {
            interactionTypes = [
                { weight: 40, descs: [
                    nameA + '和' + nameB + '聊了几句，都笑了。',
                    nameA + '跟' + nameB + '说了个什么，两人都乐了。',
                    nameA + '拍了拍' + nameB + '的肩膀，' + nameB + '没躲开。'
                ]},
                { weight: 30, descs: [
                    nameA + '递给' + nameB + '一样东西，' + nameB + '接了。',
                    nameA + '和' + nameB + '凑在一起说了会儿悄悄话。',
                    nameA + '帮' + nameB + '整理了一下东西，' + nameB + '说了声谢谢。'
                ]},
                { weight: 20, descs: [
                    nameA + '说了个笑话，' + nameB + '笑得直拍大腿。',
                    nameA + '和' + nameB + '你一句我一句，越聊越起劲。'
                ]}
            ];
        } else if (avgMood >= 30) {
            interactionTypes = [
                { weight: 50, descs: [
                    nameA + '和' + nameB + '随便聊了几句。',
                    nameA + '跟' + nameB + '打了个招呼，两人各忙各的。',
                    nameA + '点了点头，' + nameB + '也点了点头。'
                ]},
                { weight: 30, descs: [
                    nameA + '叹了口气，' + nameB + '也跟着叹了口气。',
                    nameA + '问' + nameB + '最近怎么样，' + nameB + '说"还行吧"。'
                ]},
                { weight: 20, descs: [
                    nameA + '看' + nameB + '不太高兴，走过去说了几句话。',
                    nameA + '递给' + nameB + '一碗热茶，什么都没说。' + nameB + '接了。'
                ]}
            ];
        } else {
            interactionTypes = [
                { weight: 40, descs: [
                    nameA + '和' + nameB + '各站一边，谁都没说话。',
                    nameA + '看了' + nameB + '一眼，又转开了。'
                ]},
                { weight: 30, descs: [
                    nameA + '和' + nameB + '因为一点小事拌了几句嘴。',
                    nameA + '说了句什么，' + nameB + '脸色变了。'
                ]},
                { weight: 30, descs: [
                    nameA + '看' + nameB + '不太开心，在旁边站了一会儿。',
                    nameA + '犹豫了一下，还是走过去拍了拍' + nameB + '的背。'
                ]}
            ];
        }

        // 加权随机选择
        var totalWeight = 0;
        for (var j = 0; j < interactionTypes.length; j++) { totalWeight += interactionTypes[j].weight; }
        var r = Math.random() * totalWeight;
        var acc = 0;
        var chosenDescs = interactionTypes[0].descs;
        for (var k = 0; k < interactionTypes.length; k++) {
            acc += interactionTypes[k].weight;
            if (r <= acc) { chosenDescs = interactionTypes[k].descs; break; }
        }

        var desc = chosenDescs[Math.floor(Math.random() * chosenDescs.length)];

        return {
            type: 'npc_interaction',
            desc: desc,
            npcA: npcA,
            npcB: npcB,
            nameA: nameA,
            nameB: nameB
        };
    }

    function _processInteractionDisplay() {
        if (!_interactionDisplayQueue || _interactionDisplayQueue.length === 0) return;

        // 每次最多显示1条，避免刷屏
        var interaction = _interactionDisplayQueue.shift();
        if (!interaction || !interaction.npcA) return;

        // 检查玩家是否在附近（只在玩家能看到的时候显示）
        var pp = (window.GameMap && GameMap.getPlayerPixel) ? GameMap.getPlayerPixel() : null;
        if (pp) {
            var dx = interaction.npcA.x - pp.x;
            var dy = interaction.npcA.y - pp.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 300) return; // 太远不显示
        }

        // 在地图上显示互动气泡
        _showInteractionBubble(interaction);

        // 同时在日志中显示
        if (window.showToast) {
            var tierEmoji = { daily: '💬', uncommon: '✨', rare: '🌟', legend: '💫' };
            var emoji = tierEmoji[interaction.tier] || '💬';
            showToast(emoji + ' ' + interaction.desc);
        }
    }

    function _showInteractionBubble(interaction) {
        if (!window.GameMap || !interaction.npcA || !interaction.npcB) return;

        // 在两个NPC中间位置显示一个浮动文字
        var midX = (interaction.npcA.x + interaction.npcB.x) / 2;
        var midY = Math.min(interaction.npcA.y, interaction.npcB.y) - 30;

        // 使用 GameMap 的粒子系统显示
        if (GameMap.addInteractionBubble) {
            GameMap.addInteractionBubble(midX, midY, interaction.desc);
        }
    }

    // ── 需求衰减 ──────────────────────────────────────────

    /**
     * 根据NPC的personality调整需求衰减率
     * 不同性格的NPC需求衰减速度不同，产生行为差异
     * - 高social：孤独感衰减更快（更怕寂寞）
     * - 高diligence：疲劳衰减更慢（更耐操）
     * - 高adventure：无聊感衰减更快（更怕无聊）
     * - 高caution：疲劳衰减更快（谨慎者更注意休息）
     * - 高warmth：孤独感衰减更快（需要人际温暖）
     * - 高stubbornness：疲劳衰减更慢（倔强撑着）
     */
    function _getPersonalityDecayModifier(profile) {
        if (!profile || !profile.personality) return {};
        var p = profile.personality;
        var mod = {};

        // 孤独感：高社交/高热情 → 衰减更快
        var lonelinessMod = 1.0;
        if (p.social >= 70) lonelinessMod += 0.4;
        if ((p.warmth || 50) >= 70) lonelinessMod += 0.3;
        if (p.social <= 25) lonelinessMod -= 0.3;
        mod.loneliness = lonelinessMod;

        // 疲劳：高勤劳/高固执 → 衰减更慢（更耐操）
        var sleepMod = 1.0;
        if (p.diligence >= 80) sleepMod -= 0.3;
        if ((p.stubbornness || 50) >= 70) sleepMod -= 0.2;
        if ((p.caution || 50) >= 70) sleepMod += 0.2;
        mod.sleep = sleepMod;

        // 饥饿：高勤劳 → 衰减更慢（忙起来忘吃饭）
        var hungerMod = 1.0;
        if (p.diligence >= 80) hungerMod -= 0.2;
        mod.hunger = hungerMod;

        // 归属感：高社交 → 衰减更快
        var belongingMod = 1.0;
        if (p.social >= 70) belongingMod += 0.3;
        mod.belonging = belongingMod;

        // 成就感：高勤劳 → 衰减更快（需要成就感）
        var achievementMod = 1.0;
        if (p.diligence >= 80) achievementMod += 0.3;
        // 高自尊 → 衰减更快（更需要被认可）
        if ((p.pride || 50) >= 80) achievementMod += 0.2;
        mod.achievement = achievementMod;

        // 安全感：高谨慎 → 衰减更快（更在意安全）
        var safetyMod = 1.0;
        if ((p.caution || 50) >= 70) safetyMod += 0.3;
        // 高忠诚 → 衰减更慢（归属感强）
        if ((p.loyalty || 50) >= 80) safetyMod -= 0.2;
        mod.safety = safetyMod;

        // 尊严感：高自尊 → 衰减更快（更在意面子）
        var respectMod = 1.0;
        if ((p.pride || 50) >= 80) respectMod += 0.4;
        mod.respect = respectMod;

        return mod;
    }

    function _decayNeeds(state) {
        if (!state || !state.needs) return;
        var needs = state.needs;

        // 获取NPC的personality衰减修正
        var profile = (window.DailyEngine) ? DailyEngine.getNpcProfile(state._npcId || '') : null;
        var pMod = _getPersonalityDecayModifier(profile);

        for (var key in NEED_DECAY) {
            if (NEED_DECAY.hasOwnProperty(key) && needs.hasOwnProperty(key) && typeof needs[key] === 'number') {
                var modifier = pMod[key] || 1.0;
                needs[key] = Math.min(100, needs[key] + NEED_DECAY[key] * modifier);
            }
        }

        // 工作时额外消耗
        if (state.intent && state.intent.goalType === 'go_work') {
            needs.hunger = Math.min(100, needs.hunger + 1.0);
            needs.thirst = Math.min(100, needs.thirst + 1.5);
        }

        // 休息时恢复
        if (state.intent && state.intent.goalType === 'go_home_rest') {
            needs.sleep = Math.max(0, needs.sleep - 5.0);
            needs.hygiene = Math.max(0, needs.hygiene - 2.0);
        }

        // 社交时减少孤独
        if (state.intent && state.intent.goalType === 'seek_social') {
            needs.loneliness = Math.max(0, needs.loneliness - 3.0);
        }
    }

    // ── 动物NPC行为调度 ──────────────────────────────────────

    /**
     * 动物NPC专用tick：基于行为模式（schedule/weatherBehavior/affinityBehavior）
     * 不走人类的目标选择和计划生成，而是根据时段/天气/好感度选择行为
     * @param {string} npcId - NPC的ID
     * @param {object} state - 调度脑状态
     * @param {object} profile - NPC配置（含animalBehaviors）
     */
    function _tickAnimalNpc(npcId, state, profile) {
        var behaviors = profile.animalBehaviors;
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var weather = _worldSnapshot.weather || 'clear';
        var timePeriod = _worldSnapshot.timePeriod || 'morning';

        // 1. 需求衰减（动物也有饥饿/疲劳）
        _decayNeeds(state);

        // 2. 环境影响（动物对天气更敏感）
        _applyEnvironmentEffects(state, _worldSnapshot);
        // 动物额外天气影响：雨天/雪天疲劳更快
        if (weather === 'rainy' || weather === 'drizzle') {
            state.needs.sleep = Math.min(100, (state.needs.sleep || 0) + 0.5);
        } else if (weather === 'stormy' || weather === 'snowy') {
            state.needs.sleep = Math.min(100, (state.needs.sleep || 0) + 1.0);
            state.needs.loneliness = Math.min(100, (state.needs.loneliness || 0) + 1.0);
        }

        // 3. 决定当前行为
        var chosenBehavior = null;

        // 3a. 恶劣天气 → 天气行为优先
        if ((weather === 'rainy' || weather === 'stormy' || weather === 'snowy') && behaviors.weatherBehavior) {
            var weatherKey = (weather === 'stormy') ? 'stormy' : (weather === 'snowy' ? 'snowy' : 'rainy');
            if (behaviors.weatherBehavior[weatherKey]) {
                chosenBehavior = _pickAnimalBehavior(behaviors.weatherBehavior[weatherKey]);
            }
        }

        // 3b. 玩家在附近且好感度高 → 好感度行为
        if (!chosenBehavior) {
            var entity = (window.NpcMovement) ? NpcMovement.getNpcEntity(npcId) : null;
            var playerNearby = entity && entity.nearPlayer;
            if (playerNearby && behaviors.affinityBehavior) {
                var affKey = rel >= 60 ? 'high' : (rel >= 30 ? 'mid' : 'low');
                if (behaviors.affinityBehavior[affKey]) {
                    // 50%概率执行好感度行为（不是每次都反应）
                    if (Math.random() < 0.5) {
                        chosenBehavior = _pickAnimalBehavior(behaviors.affinityBehavior[affKey]);
                    }
                }
            }
        }

        // 3c. 按时段行为
        if (!chosenBehavior && behaviors.schedule) {
            var schedKey = _mapTimePeriodToSchedule(timePeriod);
            if (behaviors.schedule[schedKey]) {
                chosenBehavior = _pickAnimalBehavior(behaviors.schedule[schedKey]);
            }
        }

        // 3d. 默认行为
        if (!chosenBehavior) {
            chosenBehavior = 'wander';
        }

        // 4. 行为→移动目标
        var targetLoc = _resolveAnimalLocation(npcId, chosenBehavior, behaviors, profile);

        // 5. 更新状态和移动
        if (!state.intent) state.intent = {};
        state.intent.goalType = 'animal_' + chosenBehavior;
        state.intent.reason = 'animal_behavior';

        // 更新行为气泡
        var bubbleEmoji = _animalBehaviorEmoji(chosenBehavior, profile.type);
        if (bubbleEmoji && window.NpcMovement) {
            var ent = NpcMovement.getNpcEntity(npcId);
            if (ent) {
                ent.bubble = bubbleEmoji;
                ent.bubbleTime = Date.now();
            }
        }

        // 移动到目标地点
        if (targetLoc && window.NpcMovement) {
            var ent2 = NpcMovement.getNpcEntity(npcId);
            if (ent2 && targetLoc !== ent2.targetLocationId && targetLoc !== ent2.locationId) {
                var pos = _locPixel(targetLoc);
                if (pos) {
                    ent2.targetX = pos.x + (Math.random() - 0.5) * 30;
                    ent2.targetY = pos.y + (Math.random() - 0.5) * 30;
                    ent2.targetLocationId = targetLoc;
                    ent2.state = (chosenBehavior === 'shelter' || chosenBehavior === 'hide' || chosenBehavior === 'nap') ? 'idle' : 'walking';
                }
            }
        }
    }

    /**
     * 从行为数组中随机选择一个行为
     */
    function _pickAnimalBehavior(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * 将timePeriod映射到animalBehaviors.schedule的key
     */
    function _mapTimePeriodToSchedule(timePeriod) {
        var map = {
            'morning': 'morning',
            'afternoon': 'afternoon',
            'evening': 'evening',
            'night': 'night'
        };
        return map[timePeriod] || 'morning';
    }

    /**
     * 根据动物行为决定目标地点
     */
    function _resolveAnimalLocation(npcId, behavior, behaviors, profile) {
        var prefs = behaviors.locationPreference || {};
        var entity = (window.NpcMovement) ? NpcMovement.getNpcEntity(npcId) : null;
        var currentLoc = entity ? entity.locationId : '';
        var avoid = prefs.avoid || [];

        switch (behavior) {
            case 'shelter':
            case 'hide':
                return _pickFromPrefs(prefs.shelter, avoid, currentLoc) || 'market';
            case 'sunbathe':
            case 'groom':
            case 'nap':
            case 'rest':
                return _pickFromPrefs(prefs.favorite, avoid, currentLoc) || 'market';
            case 'patrol':
            case 'hunt':
            case 'wander':
                return _pickFromPrefs(prefs.favorite, avoid, currentLoc) || 'market';
            case 'rub':
            case 'purr':
            case 'follow':
            case 'beg':
            case 'approach':
                return currentLoc || 'market';
            case 'avoid':
            case 'watch':
            case 'hiss':
                return _pickFromPrefs(prefs.favorite, avoid, currentLoc) || 'market';
            default:
                return _pickFromPrefs(prefs.favorite, avoid, currentLoc) || 'market';
        }
    }

    /**
     * 从偏好列表中随机选一个不在回避列表中的地点
     */
    function _pickFromPrefs(prefs, avoid, currentLoc) {
        if (!prefs || prefs.length === 0) return currentLoc || null;
        var filtered = prefs.filter(function(p) {
            return !avoid || avoid.indexOf(p) < 0;
        });
        if (filtered.length === 0) return currentLoc || null;
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    /**
     * 动物行为对应的气泡emoji（通用版，支持多动物类型）
     */
    function _animalBehaviorEmoji(behavior, animalType) {
        // 通用行为emoji
        var commonMap = {
            'patrol': '🐾', 'hunt': '🔍', 'sunbathe': '☀️', 'groom': '✨',
            'nap': '💤', 'rest': '💤', 'shelter': '🏠', 'hide': '😨',
            'wander': '🐾', 'rub': '💕', 'follow': '🐾',
            'beg': '🐾', 'approach': '👀', 'avoid': '🏃', 'watch': '👀',
            'gift': '🎁', 'graze': '🌿', 'fly': '🕊️', 'peck': '🌾',
            'gallop': '🐎', 'swim': '🌊', 'play': '🎾', 'stretch': '🧘'
        };
        // 动物类型专属行为emoji
        var typeMap = {
            'animal_cat': { 'patrol': '🐱', 'hunt': '🐭', 'purr': '😺', 'hiss': '😾', 'rub': '💕' },
            'animal_dog': { 'patrol': '🐕', 'hunt': '🦴', 'purr': '🐶', 'hiss': '😤', 'rub': '🤗', 'wag': '🐕' },
            'animal_bird': { 'patrol': '🐦', 'hunt': '🐛', 'purr': '🕊️', 'hiss': '🦅', 'fly': '🕊️' },
            'animal_chicken': { 'patrol': '🐔', 'hunt': '🐛', 'peck': '🌾', 'roost': '🥚' },
            'animal_cow': { 'patrol': '🐄', 'graze': '🌿', 'moo': '🐄' },
            'animal_horse': { 'patrol': '🐎', 'gallop': '🐎', 'graze': '🌿', 'neigh': '🐎' }
        };
        var typeSpecific = typeMap[animalType] || {};
        return typeSpecific[behavior] || commonMap[behavior] || '🐾';
    }

    // ── 环境影响情绪和需求 ──────────────────────────────────

    /**
     * 天气和时间直接影响NPC情绪和需求
     * - 下雨/暴风：心情-3，疲劳+1，孤独+2（不愿出门）
     * - 深夜：疲劳+2，心情-2
     * - 晴天：心情+1
     * - 高温：口渴+1
     */
    function _applyEnvironmentEffects(state, snapshot) {
        if (!state || !snapshot) return;
        var needs = state.needs;
        if (!needs) return;

        var weather = snapshot.weather || 'clear';
        var timePeriod = snapshot.timePeriod || 'morning';

        // 天气影响（增强版）
        if (weather === 'rainy' || weather === 'drizzle') {
            // 小雨：明显影响
            needs.loneliness = Math.min(100, (needs.loneliness || 0) + 1.5);
            needs.sleep = Math.min(100, (needs.sleep || 0) + 0.8);
        } else if (weather === 'stormy' || weather === 'snowy') {
            // 暴风/雪：强烈影响
            needs.loneliness = Math.min(100, (needs.loneliness || 0) + 3.0);
            needs.sleep = Math.min(100, (needs.sleep || 0) + 2.0);
        } else if (weather === 'clear' || weather === 'sunny') {
            // 晴天：心情略好，社交需求微增（愿意出门）
            needs.loneliness = Math.max(0, (needs.loneliness || 0) - 0.5);
        }

        // 时段影响
        if (timePeriod === 'night') {
            // 深夜：疲劳增加，心情略降
            needs.sleep = Math.min(100, (needs.sleep || 0) + 1.0);
        } else if (timePeriod === 'evening') {
            // 傍晚：疲劳微增
            needs.sleep = Math.min(100, (needs.sleep || 0) + 0.3);
        }

        // 同步心情到 DailyEngine（用于对话系统）
        if (window.DailyEngine && state._npcId) {
            var moodDelta = 0;
            if (weather === 'stormy' || weather === 'snowy') { moodDelta = -5; }
            else if (weather === 'rainy' || weather === 'drizzle') { moodDelta = -3; }
            else if (weather === 'clear' || weather === 'sunny') { moodDelta = 2; }
            if (timePeriod === 'night') { moodDelta -= 1; }

            if (moodDelta !== 0) {
                DailyEngine.adjustMood(state._npcId, moodDelta, 'environment');
            }
        }
    }

    // ── 世界快照更新 ──────────────────────────────────────

    function _updateWorldSnapshot() {
        if (window.GameTime) {
            var period = GameTime.getPeriod();
            if (period) {
                var pid = period.id;
                if (pid === 'dawn' || pid === 'morning') { _worldSnapshot.timePeriod = 'morning'; }
                else if (pid === 'noon' || pid === 'afternoon') { _worldSnapshot.timePeriod = 'afternoon'; }
                else if (pid === 'evening') { _worldSnapshot.timePeriod = 'evening'; }
                else { _worldSnapshot.timePeriod = 'night'; }
            }

            // 从 GameTime 获取天气
            var weather = GameTime.getWeather();
            if (weather && weather.id) {
                _worldSnapshot.weather = weather.id;
            }
        }
    }

    // ── 同步到 NpcMovement ────────────────────────────────

    function _syncToNpcMovement(npcId, state) {
        if (!window.NpcMovement) return;

        var entity = NpcMovement.getNpcEntity(npcId);
        if (!entity) return;

        // 更新意图
        entity.intent = state.intent;
        entity.plan = state.plan;
        entity.anchors = state.anchors;

        // 根据目标决定移动目标
        var goalType = state.intent ? state.intent.goalType : 'idle';
        var targetLoc = _resolveGoalLocation(npcId, goalType, state);

        // 只在目标地点变化时才触发移动
        if (targetLoc && targetLoc !== entity.targetLocationId && targetLoc !== entity.locationId) {
            var pos = _locPixel(targetLoc);
            if (pos) {
                entity.targetX = pos.x + (Math.random() - 0.5) * 20;
                entity.targetY = pos.y + (Math.random() - 0.5) * 20;
                entity.targetLocationId = targetLoc;
                entity.state = 'walking';
            }
        }

        // 更新 LOD
        if (window.MapLocator) {
            entity.lod = MapLocator.calculateLodLevel(entity.locationId, _worldSnapshot.playerLocation);
        }
    }

    // ── NPC行为气泡更新 ──────────────────────────────────────

    /**
     * 更新NPC的行为气泡emoji（人类NPC也像动物一样显示行为emoji）
     * 根据当前目标、需求状态、性格特征选择最合适的emoji
     * @param {string} npcId - NPC的ID
     * @param {object} state - 调度脑状态
     */
    function _updateNpcBubble(npcId, state) {
        if (!window.NpcMovement) return;
        var entity = NpcMovement.getNpcEntity(npcId);
        if (!entity) return;

        var profile = (window.DailyEngine) ? DailyEngine.getNpcProfile(npcId) : null;
        var goalType = state.intent ? state.intent.goalType : 'idle';
        var emoji = null;

        // 1. 紧急需求优先
        if (state.needs) {
            var needKeys = Object.keys(state.needs);
            for (var i = 0; i < needKeys.length; i++) {
                if (typeof state.needs[needKeys[i]] === 'number' && state.needs[needKeys[i]] >= 80) {
                    var needEmojis = {
                        'hunger': '🍽️', 'thirst': '💧', 'sleep': '😴',
                        'loneliness': '🫂', 'safety': '🛡️', 'health': '💊'
                    };
                    if (needEmojis[needKeys[i]]) {
                        emoji = needEmojis[needKeys[i]];
                        break;
                    }
                }
            }
        }

        // 2. 目标行为emoji
        if (!emoji) {
            var goalEmojis = {
                'idle': '💤', 'go_work': '🔨', 'go_home_rest': '🏠',
                'seek_social': '💬', 'seek_food': '🍜', 'avoid_rain': '☔',
                'wander_favorite': '🚶', 'investigate_rumor': '🔍',
                'go_market': '🏪', 'go_tavern': '🍶', 'go_shrine': '🏮',
                'go_academy': '📚', 'go_dock': '⚓', 'go_herb': '🌿',
                'go_forge': '⚒️', 'seek_rest': '😴', 'seek_entertainment': '🎭',
                'seek_information': '📖', 'seek_adventure': '🗺️',
                'seek_meditation': '🧘', 'seek_training': '⚔️',
                'seek_crafting': '🛠️', 'seek_healing': '💊',
                'patrol_town': '👁️', 'morning_routine': '🌅',
                'evening_routine': '🌙', 'meal_time': '🍚', 'tea_time': '🍵'
            };
            emoji = goalEmojis[goalType];

            // 3. 根据性格微调emoji
            if (!emoji && profile && profile.personality) {
                var p = profile.personality;
                if (goalType === 'idle') {
                    if (p.social >= 70) emoji = '😊';
                    else if (p.curiosity >= 70) emoji = '🤔';
                    else if (p.diligence >= 70) emoji = '💪';
                    else if (p.adventure >= 70) emoji = '⚔️';
                    else if (p.warmth >= 70) emoji = '🥰';
                    else emoji = '💤';
                }
            }

            // 4. 工作中的NPC根据职业显示不同emoji
            if (goalType === 'go_work' && profile) {
                var workEmojis = {
                    'teahouse_owner': '🍵', 'blacksmith': '⚒️', 'carpenter': '🪵',
                    'hunter': '🏹', 'cook': '🍳', 'merchant': '💰', 'fisherman': '🐟',
                    'cloth_merchant': '🧵', 'night_watchman': '🏮', 'scholar': '📖',
                    'herbalist': '🌿', 'inn_keeper': '🏨', 'guard': '⚔️'
                };
                if (workEmojis[profile.type]) {
                    emoji = workEmojis[profile.type];
                }
            }
        }

        if (emoji) {
            entity.bubble = emoji;
            entity.bubbleTime = Date.now();
        }
    }

    // ── 目标到地点解析 ──────────────────────────────────────

    function _resolveGoalLocation(npcId, goalType, state) {
        var locType = GOAL_LOCATION_MAP[goalType] || 'current';

        if (locType === 'current') {
            var entity = NpcMovement.getNpcEntity(npcId);
            return entity ? entity.locationId : 'market';
        }

        var mapping = LOCATION_TYPE_MAP[locType];
        if (mapping && mapping[npcId]) {
            return mapping[npcId];
        }

        return 'market';
    }

    function _locPixel(locId) {
        if (!window.GameMap || !GameMap.LOCATIONS) return null;
        var loc = GameMap.LOCATIONS[locId];
        if (!loc) return null;
        var tile = GameMap.TILE;
        return { x: loc.col * tile + tile / 2, y: loc.row * tile + tile / 2 };
    }

    // ── 公开接口 ──────────────────────────────────────────

    function getNpcState(npcId) {
        return _npcStates[npcId] || null;
    }

    function getAllStates() {
        return _npcStates;
    }

    function setWeather(weather) {
        _worldSnapshot.weather = weather;
    }

    function setPlayerLocation(location) {
        _worldSnapshot.playerLocation = location;
    }

    function getWorldSnapshot() {
        return _worldSnapshot;
    }

    function setTickRate(ms) {
        _tickRate = Math.max(500, ms);
        if (_tickInterval) {
            stop();
            start();
        }
    }

    return {
        init: init,
        start: start,
        stop: stop,
        tick: tick,
        getNpcState: getNpcState,
        getAllStates: getAllStates,
        setWeather: setWeather,
        setPlayerLocation: setPlayerLocation,
        getWorldSnapshot: getWorldSnapshot,
        setTickRate: setTickRate
    };
})();

window.SoulTick = SoulTick;
