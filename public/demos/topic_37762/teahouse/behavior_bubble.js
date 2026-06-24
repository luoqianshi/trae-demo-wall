var BehaviorBubble = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // NPC 行为气泡系统 - 网页版（多元化版）
    // 在 NPC 头顶显示当前行为/目标/需求/情绪
    // ═══════════════════════════════════════════════════════════

    // ── 目标图标（扩展版：覆盖更多行为）──
    var GOAL_ICONS = {
        'idle': '💤',
        'go_work': '🔨',
        'go_home_rest': '🏠',
        'seek_social': '💬',
        'seek_food': '🍜',
        'avoid_rain': '☔',
        'wander_favorite': '🚶',
        'investigate_rumor': '🔍',
        // 扩展：更多人类行为
        'go_market': '🏪',
        'go_tavern': '🍶',
        'go_shrine': '🏮',
        'go_academy': '📚',
        'go_dock': '⚓',
        'go_herb': '🌿',
        'go_forge': '⚒️',
        'seek_rest': '😴',
        'seek_entertainment': '🎭',
        'seek_information': '📖',
        'seek_comfort': '🛋️',
        'seek_adventure': '🗺️',
        'seek_meditation': '🧘',
        'seek_training': '⚔️',
        'seek_crafting': '🛠️',
        'seek_healing': '💊',
        'patrol_town': '👁️',
        'morning_routine': '🌅',
        'evening_routine': '🌙',
        'meal_time': '🍚',
        'tea_time': '🍵',
        // 动物目标前缀
        'animal_patrol': '🐾', 'animal_hunt': '🔍', 'animal_sunbathe': '☀️',
        'animal_groom': '✨', 'animal_nap': '💤', 'animal_rest': '💤',
        'animal_shelter': '🏠', 'animal_hide': '😨', 'animal_wander': '🐾',
        'animal_rub': '💕', 'animal_purr': '😺', 'animal_follow': '🐾',
        'animal_beg': '🐾', 'animal_approach': '👀', 'animal_avoid': '🏃',
        'animal_watch': '👀', 'animal_hiss': '😾', 'animal_gift': '🎁',
        'animal_graze': '🌿', 'animal_fly': '🕊️', 'animal_peck': '🌾',
        'animal_gallop': '🐎', 'animal_swim': '🌊', 'animal_play': '🎾'
    };

    // ── 需求图标 ──
    var NEED_ICONS = {
        'hunger': '🍽️',
        'thirst': '💧',
        'sleep': '😴',
        'hygiene': '🛁',
        'health': '💊',
        'loneliness': '🫂',
        'belonging': '❤️',
        'achievement': '⭐',
        'reputation': '🏅',
        'creativity': '🎨',
        'safety': '🛡️',
        'respect': '👑'
    };

    // ── 中断图标 ──
    var INTERRUPTION_ICONS = {
        'urgent_need': '⚠️',
        'weather': '🌧️',
        'safety_concern': '🛡️',
        'social_call': '👋',
        'rumor_heard': '👂',
        'danger_nearby': '⚡'
    };

    // ── 目标文本（扩展版）──
    var GOAL_TEXTS = {
        'idle': '空闲',
        'go_work': '去工作',
        'go_home_rest': '回家休息',
        'seek_social': '找人聊天',
        'seek_food': '觅食',
        'avoid_rain': '避雨',
        'wander_favorite': '闲逛',
        'investigate_rumor': '调查流言',
        'go_market': '去集市',
        'go_tavern': '去酒馆',
        'go_shrine': '去祠堂',
        'go_academy': '去书院',
        'go_dock': '去码头',
        'go_herb': '去药铺',
        'go_forge': '去铁铺',
        'seek_rest': '想休息',
        'seek_entertainment': '找乐子',
        'seek_information': '打听消息',
        'seek_comfort': '找安慰',
        'seek_adventure': '去探险',
        'seek_meditation': '静心',
        'seek_training': '练功',
        'seek_crafting': '做手工',
        'seek_healing': '求医',
        'patrol_town': '巡街',
        'morning_routine': '晨起',
        'evening_routine': '收工',
        'meal_time': '吃饭',
        'tea_time': '喝茶',
        // 动物
        'animal_patrol': '巡逻', 'animal_hunt': '狩猎', 'animal_sunbathe': '晒太阳',
        'animal_groom': '理毛', 'animal_nap': '打盹', 'animal_rest': '休息',
        'animal_shelter': '躲雨', 'animal_hide': '躲藏', 'animal_wander': '闲逛',
        'animal_rub': '蹭人', 'animal_purr': '呼噜', 'animal_follow': '跟随',
        'animal_beg': '讨食', 'animal_approach': '靠近', 'animal_avoid': '躲避',
        'animal_watch': '观察', 'animal_hiss': '哈气', 'animal_gift': '送礼物',
        'animal_graze': '吃草', 'animal_fly': '飞翔', 'animal_peck': '啄食',
        'animal_gallop': '奔跑', 'animal_swim': '游泳', 'animal_play': '玩耍'
    };

    // ── 计划步骤图标（扩展版）──
    var PLAN_STEP_ICONS = {
        '前往工作地点': '🔨', '开始工作': '⚒️', '工作完成': '✅',
        '返回家中': '🏠', '休息恢复': '😴', '恢复完毕': '☀️',
        '前往社交地点': '💬', '与人交流': '🤝', '社交结束': '👋',
        '前往集市': '🍜', '购买食物': '🛒', '进食完毕': '😋',
        '寻找避雨处': '☔', '等待雨停': '🌧️', '雨停了': '🌤️',
        '前往喜爱地点': '🚶', '闲逛放松': '🌿', '闲逛结束': '😌',
        '前往集市打听': '🔍', '收集信息': '📝', '调查完毕': '📖',
        '原地停留': '💤', '执行目标': '▶️'
    };

    // ── NPC个性气泡修饰（12维度全覆盖）──
    var TRAIT_BUBBLE_MODIFIERS = {
        'high_social':    { suffix: '～', icon: '😊', text: '热情' },
        'low_social':     { suffix: '……', icon: '😶', text: '沉默' },
        'high_diligence': { suffix: '！', icon: '💪', text: '勤快' },
        'low_diligence':  { suffix: '啊', icon: '😪', text: '慵懒' },
        'high_curiosity': { suffix: '？', icon: '🤔', text: '好奇' },
        'high_warmth':    { suffix: '！', icon: '🥰', text: '温暖' },
        'low_warmth':     { suffix: '。', icon: '🧊', text: '冷淡' },
        'high_humor':     { suffix: '哈', icon: '😄', text: '幽默' },
        'high_stubborn':  { suffix: '。', icon: '😤', text: '固执' },
        'low_stubborn':   { suffix: '吧', icon: '🤷', text: '随和' },
        'high_caution':   { suffix: '……', icon: '😰', text: '谨慎' },
        'low_caution':    { suffix: '！', icon: '😎', text: '大胆' },
        'high_patience':  { suffix: '。', icon: '🧘', text: '耐心' },
        'low_patience':   { suffix: '！', icon: '😤', text: '急躁' },
        'high_pride':     { suffix: '。', icon: '👑', text: '自尊' },
        'low_pride':      { suffix: '哈', icon: '😅', text: '谦虚' },
        'high_loyalty':   { suffix: '！', icon: '💝', text: '忠诚' },
        'low_loyalty':    { suffix: '……', icon: '🚶', text: '疏离' },
        'high_emotion':   { suffix: '！', icon: '😢', text: '感性' },
        'high_adventure': { suffix: '！', icon: '⚔️', text: '冒险' }
    };

    // ── 心情气泡（根据mood值显示不同emoji）──
    var MOOD_BUBBLES = {
        'ecstatic':  { icon: '🤩', text: '开心极了' },
        'happy':     { icon: '😊', text: '心情好' },
        'content':   { icon: '😌', text: '还不错' },
        'neutral':   { icon: '😐', text: '一般' },
        'gloomy':    { icon: '😔', text: '闷闷的' },
        'sad':       { icon: '😢', text: '难过' },
        'angry':     { icon: '😡', text: '生气' },
        'anxious':   { icon: '😰', text: '不安' }
    };

    var INTERRUPTION_TEXTS = {
        'urgent_need': '紧急需求！',
        'weather': '天气突变！',
        'safety_concern': '安全担忧',
        'social_call': '有人叫你',
        'rumor_heard': '听到传闻',
        'danger_nearby': '危险靠近'
    };

    /**
     * 根据 NPC 状态生成气泡内容
     * 优先级：中断 > 紧急需求 > 心情低落 > 当前目标 > 计划步骤 > 空闲
     */
    function getBubbleForNpc(state) {
        if (!state) { return {icon: '💤', text: '空闲', type: 'goal'}; }

        // 1. 检查中断
        if (state.intent && state.intent.reasonTags) {
            var tags = state.intent.reasonTags;
            for (var i = 0; i < tags.length; i++) {
                if (INTERRUPTION_ICONS[tags[i]]) {
                    return {
                        icon: INTERRUPTION_ICONS[tags[i]],
                        text: INTERRUPTION_TEXTS[tags[i]] || '中断',
                        type: 'interruption'
                    };
                }
            }
        }

        // 2. 检查紧急需求
        if (state.needs) {
            var needKeys = Object.keys(state.needs);
            for (var j = 0; j < needKeys.length; j++) {
                var needType = needKeys[j];
                if (typeof state.needs[needType] === 'number' && state.needs[needType] >= 80 && NEED_ICONS[needType]) {
                    return {
                        icon: NEED_ICONS[needType],
                        text: _needText(needType),
                        type: 'need'
                    };
                }
            }
        }

        // 3. 心情低落时显示心情气泡
        if (state.needs) {
            var mood = _calcMood(state.needs);
            if (mood < 30) {
                var moodBubble = _getMoodBubble(mood);
                if (moodBubble) return moodBubble;
            }
        }

        // 4. 显示计划步骤（如果有计划且正在执行）
        if (state.plan && state.plan.steps && state.plan.steps.length > 0) {
            var stepIdx = state.plan.currentStep || 0;
            if (stepIdx < state.plan.steps.length) {
                var stepText = state.plan.steps[stepIdx];
                var stepIcon = PLAN_STEP_ICONS[stepText] || GOAL_ICONS[state.intent ? state.intent.goalType : ''] || '▶️';
                var modifier = _getTraitModifier(state.traits);
                return {
                    icon: stepIcon,
                    text: stepText + (modifier.suffix || ''),
                    type: 'plan_step'
                };
            }
        }

        // 5. 显示当前目标
        if (state.intent && state.intent.goalType) {
            var goalType = state.intent.goalType;
            var modifier2 = _getTraitModifier(state.traits);
            var goalIcon = GOAL_ICONS[goalType] || '❓';
            // 动物目标用动物专属emoji
            if (goalType.indexOf('animal_') === 0) {
                goalIcon = _getAnimalGoalIcon(goalType, state._npcId);
            }
            return {
                icon: goalIcon,
                text: (GOAL_TEXTS[goalType] || goalType) + (modifier2.suffix || ''),
                type: 'goal'
            };
        }

        // 6. 显示当前活动
        if (state.currentActivity) {
            return {icon: '📍', text: state.currentActivity, type: 'activity'};
        }

        // 7. 默认空闲
        return {icon: '💤', text: '空闲', type: 'goal'};
    }

    /**
     * 需求中文名
     */
    function _needText(needType) {
        var names = {
            'hunger': '饿了', 'thirst': '渴了', 'sleep': '困了',
            'hygiene': '想洗澡', 'health': '不舒服', 'loneliness': '孤单',
            'belonging': '想家', 'achievement': '想出人头地',
            'reputation': '在乎名声', 'creativity': '想创作',
            'safety': '不安', 'respect': '想被尊重'
        };
        return names[needType] || needType;
    }

    /**
     * 根据需求计算心情值
     */
    function _calcMood(needs) {
        if (!needs) return 50;
        var mood = 70;
        if (needs.hunger > 60) mood -= 15;
        if (needs.sleep > 60) mood -= 10;
        if (needs.loneliness > 60) mood -= 15;
        if (needs.safety > 60) mood -= 10;
        if (needs.belonging > 60) mood -= 5;
        return Math.max(0, Math.min(100, mood));
    }

    /**
     * 根据心情值获取气泡
     */
    function _getMoodBubble(mood) {
        var key;
        if (mood < 10) key = 'angry';
        else if (mood < 20) key = 'sad';
        else if (mood < 25) key = 'anxious';
        else key = 'gloomy';
        var b = MOOD_BUBBLES[key];
        if (b) return { icon: b.icon, text: b.text, type: 'mood' };
        return null;
    }

    /**
     * 动物目标获取专属emoji
     */
    function _getAnimalGoalIcon(goalType, npcId) {
        var behavior = goalType.replace('animal_', '');
        var profile = (window.DailyEngine) ? DailyEngine.getNpcProfile(npcId || '') : null;
        var animalType = profile ? profile.type : '';
        // 动物类型专属映射
        var typeIcons = {
            'animal_cat': { 'patrol': '🐱', 'hunt': '🐭', 'purr': '😺', 'hiss': '😾', 'rub': '💕', 'nap': '💤', 'wander': '🐾' },
            'animal_dog': { 'patrol': '🐕', 'hunt': '🦴', 'rub': '🤗', 'nap': '💤', 'wander': '🐾', 'follow': '🐕' },
            'animal_bird': { 'patrol': '🐦', 'hunt': '🐛', 'fly': '🕊️', 'nap': '💤', 'wander': '🐦' },
            'animal_chicken': { 'patrol': '🐔', 'peck': '🌾', 'nap': '💤', 'wander': '🐔' },
            'animal_cow': { 'patrol': '🐄', 'graze': '🌿', 'nap': '💤', 'wander': '🐄' },
            'animal_horse': { 'patrol': '🐎', 'gallop': '🐎', 'graze': '🌿', 'nap': '💤', 'wander': '🐎' }
        };
        var typeMap = typeIcons[animalType] || {};
        return typeMap[behavior] || GOAL_ICONS[goalType] || '🐾';
    }

    /**
     * 12维度性格气泡修饰
     */
    function _getTraitModifier(traits) {
        if (!traits) { return {suffix: '', icon: '', text: ''}; }

        var dims = [
            { key: 'social',    high: 'high_social',    low: 'low_social' },
            { key: 'warmth',    high: 'high_warmth',    low: 'low_warmth' },
            { key: 'humor',     high: 'high_humor',     low: null },
            { key: 'diligence', high: 'high_diligence', low: 'low_diligence' },
            { key: 'curiosity', high: 'high_curiosity', low: null },
            { key: 'stubbornness', high: 'high_stubborn', low: 'low_stubborn' },
            { key: 'caution',   high: 'high_caution',   low: 'low_caution' },
            { key: 'patience',  high: 'high_patience',  low: 'low_patience' },
            { key: 'pride',     high: 'high_pride',     low: 'low_pride' },
            { key: 'loyalty',   high: 'high_loyalty',   low: 'low_loyalty' },
            { key: 'emotion',   high: 'high_emotion',   low: null },
            { key: 'adventure', high: 'high_adventure', low: null }
        ];

        // 找最突出的性格特征
        var best = null;
        var bestDelta = 0;
        for (var i = 0; i < dims.length; i++) {
            var val = typeof traits[dims[i].key] === 'number' ? traits[dims[i].key] : 50;
            var delta;
            if (val >= 70) {
                delta = val - 70;
                if (delta > bestDelta && TRAIT_BUBBLE_MODIFIERS[dims[i].high]) {
                    bestDelta = delta;
                    best = dims[i].high;
                }
            } else if (val <= 30 && dims[i].low) {
                delta = 30 - val;
                if (delta > bestDelta && TRAIT_BUBBLE_MODIFIERS[dims[i].low]) {
                    bestDelta = delta;
                    best = dims[i].low;
                }
            }
        }

        if (best && TRAIT_BUBBLE_MODIFIERS[best]) {
            return TRAIT_BUBBLE_MODIFIERS[best];
        }
        return {suffix: '', icon: '', text: ''};
    }

    /**
     * 获取需求条的颜色
     */
    function getNeedColor(value) {
        if (value >= 80) { return '#ff4444'; }
        if (value >= 60) { return '#ffaa00'; }
        if (value >= 40) { return '#44aa44'; }
        return '#44aa44';
    }

    /**
     * 获取 LOD 标签
     */
    function getLodLabel(lod) {
        switch (lod) {
            case 'near': return '近景';
            case 'mid': return '中景';
            case 'far': return '远景';
            default: return '未知';
        }
    }

    return {
        getBubbleForNpc: getBubbleForNpc,
        getNeedColor: getNeedColor,
        getLodLabel: getLodLabel,

        GOAL_ICONS: GOAL_ICONS,
        NEED_ICONS: NEED_ICONS,
        INTERRUPTION_ICONS: INTERRUPTION_ICONS,
        MOOD_BUBBLES: MOOD_BUBBLES,
        TRAIT_BUBBLE_MODIFIERS: TRAIT_BUBBLE_MODIFIERS
    };
})();

window.BehaviorBubble = BehaviorBubble;
