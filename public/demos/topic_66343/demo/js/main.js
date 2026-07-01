// ========== 动作数据模块 ==========
const ActionCategory = {
    BREATHING: 'breathing',
    BODY: 'body',
    GROUNDING: 'grounding',
    SELF_SOOTHING: 'self_soothing',
    MINDFULNESS: 'mindfulness'
};

const CategoryNames = {
    breathing: '呼吸类',
    body: '身体放松类',
    grounding: '注意力转移类',
    self_soothing: '自我安抚类',
    mindfulness: '正念冥想类'
};

const MicroActions = {
    rhythm_breathing: {
        id: 'rhythm_breathing',
        name: '节律呼吸',
        icon: '🌀',
        category: ActionCategory.BREATHING,
        duration: 60,
        description: '吸气4秒，屏气2秒，呼气6秒',
        instructions: [
            '找一个舒适的姿势坐好',
            '用鼻子吸气，数4秒',
            '屏住呼吸，数2秒',
            '用嘴巴慢慢呼气，数6秒',
            '重复这个节奏'
        ],
        suitable: ['anxiety', 'irritable', 'nervous', 'stressed'],
        tips: '这是最经典的放松呼吸法，能快速激活副交感神经',
        animation: 'breathing_circle',
        phases: [
            { name: '吸气', duration: 4000, scale: 1.25 },
            { name: '屏气', duration: 2000, scale: 1.25 },
            { name: '呼气', duration: 6000, scale: 0.8 }
        ]
    },
    breathing_478: {
        id: 'breathing_478',
        name: '4-7-8 呼吸法',
        icon: '🌊',
        category: ActionCategory.BREATHING,
        duration: 90,
        description: '吸气4秒，屏气7秒，呼气8秒',
        instructions: [
            '舌尖抵住上颚，准备开始',
            '用鼻子吸气，数4秒',
            '屏住呼吸，数7秒',
            '用嘴巴呼气，发"呼"声，数8秒',
            '继续重复，保持节奏'
        ],
        stepDurations: [3, 19, 22, 26, 20],
        suitable: ['anxiety', 'nervous', 'stressed', 'overwhelmed'],
        tips: '源自瑜伽的放松呼吸，能深度镇静神经系统',
        animation: 'breathing_circle',
        phases: [
            { name: '吸气', duration: 4000, scale: 1.25 },
            { name: '屏气', duration: 7000, scale: 1.25 },
            { name: '呼气', duration: 8000, scale: 0.8 }
        ]
    },
    deep_breathing: {
        id: 'deep_breathing',
        name: '深呼吸放松',
        icon: '🍃',
        category: ActionCategory.BREATHING,
        duration: 30,
        description: '缓慢深长的呼吸，让身体放松',
        instructions: [
            '舒适地坐着或躺下',
            '慢慢用鼻子深吸一口气',
            '感受空气充满腹部',
            '缓缓用嘴巴呼出',
            '做5-10次'
        ],
        suitable: ['anxious', 'sad', 'tired', 'stressed'],
        tips: '最简单基础的放松方法，随时可用',
        animation: 'breathing_circle',
        phases: [
            { name: '吸气', duration: 4000, scale: 1.25 },
            { name: '呼气', duration: 6000, scale: 0.8 }
        ]
    },
    box_breathing: {
        id: 'box_breathing',
        name: '箱式呼吸',
        icon: '⬜',
        category: ActionCategory.BREATHING,
        duration: 60,
        description: '吸气-屏气-呼气-屏气各4秒',
        instructions: [
            '准备好，开始箱式呼吸',
            '用鼻子吸气，数4秒',
            '屏住呼吸，数4秒',
            '用鼻子呼气，数4秒',
            '屏住呼吸，数4秒',
            '重复方形的节奏'
        ],
        stepDurations: [3, 12, 12, 12, 12, 9],
        suitable: ['anxious', 'nervous', 'stressed', 'overwhelmed'],
        tips: '美国海军飞行员也在用的冷静方法',
        animation: 'breathing_square',
        phases: [
            { name: '吸气', duration: 4000, scale: 1.25 },
            { name: '屏气', duration: 4000, scale: 1.25 },
            { name: '呼气', duration: 4000, scale: 0.8 },
            { name: '屏气', duration: 4000, scale: 0.8 }
        ]
    },
    progressive_muscle: {
        id: 'progressive_muscle',
        name: '渐进性肌肉放松',
        icon: '💪',
        category: ActionCategory.BODY,
        duration: 180,
        description: '依次收紧和放松身体各部位肌肉',
        instructions: [
            '舒适地坐下或躺下，准备开始',
            '先紧张脚部肌肉，保持5秒，然后放松',
            '小腿肌肉：紧张5秒，放松',
            '大腿肌肉：紧张5秒，放松',
            '腹部和臀部：紧张5秒，放松',
            '胸部和背部：紧张5秒，放松',
            '手臂和肩膀：紧张5秒，放松',
            '面部肌肉：皱紧5秒，放松',
            '全身放松，感受宁静'
        ],
        stepDurations: [10, 20, 20, 20, 20, 20, 20, 20, 30],
        suitable: ['anxious', 'stressed', 'tired', 'stressed'],
        tips: '科学验证的放松方法，能有效缓解身体紧张',
        animation: 'default'
    },
    body_scan: {
        id: 'body_scan',
        name: '身体扫描',
        icon: '🔍',
        category: ActionCategory.BODY,
        duration: 120,
        description: '从脚到头，温和地关注身体各部位',
        instructions: [
            '闭上眼睛，准备开始身体扫描',
            '从脚趾开始，感受脚趾的感觉',
            '慢慢向上：脚掌、脚踝、小腿',
            '继续向上：膝盖、大腿、臀部',
            '感受腹部的起伏和胸部',
            '注意背部、肩膀、手臂的感受',
            '最后关注面部、头部和头顶',
            '感受全身，平静放松'
        ],
        stepDurations: [8, 15, 15, 15, 15, 15, 15, 22],
        suitable: ['anxious', 'stressed', 'tired', 'overwhelmed'],
        tips: '帮助连接身心，提高身体觉察',
        animation: 'default'
    },
    finger_release: {
        id: 'finger_release',
        name: '手指放松',
        icon: '🤲',
        category: ActionCategory.BODY,
        duration: 30,
        description: '简单的指尖放松练习',
        instructions: [
            '双手放在膝盖上，掌心朝上',
            '用力握拳，保持5秒',
            '突然松开，感受血液涌入手指',
            '重复3-5次',
            '感受手指的温暖和放松'
        ],
        suitable: ['anxious', 'nervous', 'stressed', 'stressed'],
        tips: '适合在公共场合悄悄做的放松动作',
        animation: 'default'
    },
    shoulder_release: {
        id: 'shoulder_release',
        name: '肩膀放松',
        icon: '🧘',
        category: ActionCategory.BODY,
        duration: 30,
        description: '释放肩膀的紧张和压力',
        instructions: [
            '耸起肩膀，尽量靠近耳朵',
            '保持5秒，感受紧张',
            '突然放下，感受放松',
            '深呼吸几次',
            '重复2-3次'
        ],
        suitable: ['stressed', 'anxious', 'tired'],
        tips: '现代人长时间伏案工作，肩膀最容易积累压力',
        animation: 'default'
    },
    neck_release: {
        id: 'neck_release',
        name: '颈部放松',
        icon: '🔄',
        category: ActionCategory.BODY,
        duration: 45,
        description: '缓解颈部紧张的办公室拉伸',
        instructions: [
            '缓慢地将头向右侧倾斜，右耳靠近右肩',
            '保持15秒，感受左侧颈部的拉伸',
            '回到正中，重复向左侧倾斜',
            '最后，将头轻轻向前低，下巴靠近胸口',
            '感受后颈的拉伸',
            '每个动作重复2-3次'
        ],
        suitable: ['tired', 'stressed', 'tired'],
        tips: '每工作1-2小时做一次，可有效预防颈椎问题',
        animation: 'default'
    },
    temple_pressure: {
        id: 'temple_pressure',
        name: '太阳穴按压',
        icon: '💆',
        category: ActionCategory.BODY,
        duration: 45,
        description: '缓解头部紧张的穴位按压',
        instructions: [
            '双手搓热掌心',
            '将食指和中指放在两侧太阳穴上',
            '轻轻按压，画小圈按摩',
            '顺时针方向按10圈',
            '再逆时针按10圈',
            '力度要舒适，不要太用力'
        ],
        suitable: ['tired', 'stressed', 'tired'],
        tips: '源自中医的穴位按摩，科学证明可缓解紧张性头痛',
        animation: 'default'
    },
    eye_rest: {
        id: 'eye_rest',
        name: '眼部休息',
        icon: '👁️',
        category: ActionCategory.BODY,
        duration: 20,
        description: '遵循20-20-20法则保护眼睛',
        instructions: [
            '停下手中的工作',
            '看向20英尺（约6米）远的物体',
            '持续看20秒',
            '期间多眨眼，保持眼睛湿润',
            '之后轻轻闭上眼睛休息几秒',
            '每天多次，保护视力'
        ],
        suitable: ['tired', 'stressed', 'tired'],
        tips: '美国眼科学会推荐的护眼法则',
        animation: 'default'
    },
    forehead_release: {
        id: 'forehead_release',
        name: '前额放松',
        icon: '👐',
        category: ActionCategory.BODY,
        duration: 30,
        description: '缓解额部和眉心的紧张',
        instructions: [
            '将双手掌根放在额头上',
            '手指交叉放在发际线处',
            '轻轻向头后方向提拉',
            '同时用指腹轻轻按摩额头',
            '从中间向两侧缓慢移动',
            '感受额部肌肉逐渐放松'
        ],
        suitable: ['tired', 'stressed', 'tired'],
        tips: '配合深呼吸效果更好',
        animation: 'default'
    },
    grounding_54321: {
        id: 'grounding_54321',
        name: '5-4-3-2-1 感官练习',
        icon: '🎯',
        category: ActionCategory.GROUNDING,
        duration: 60,
        description: '通过5个感官把你带回当下',
        instructions: [
            '看：找出5样你能看到的东西',
            '听：听到4样声音',
            '触：感受3样能摸到的东西',
            '闻：闻到2种气味',
            '尝：品尝1种味道',
            '完成！感受自己回到了当下'
        ],
        stepDurations: [12, 12, 12, 10, 8, 6],
        suitable: ['anxious', 'stressed', 'overwhelmed', 'nervous'],
        tips: '经典的创伤后稳定化技术，能快速把人从情绪风暴中拉回来',
        animation: 'count_down'
    },
    color_observation: {
        id: 'color_observation',
        name: '颜色观察',
        icon: '🌈',
        category: ActionCategory.GROUNDING,
        duration: 45,
        description: '找出环境中的7种颜色',
        instructions: [
            '环顾四周，放慢呼吸',
            '找1种红色的事物',
            '找1种橙色的事物',
            '找1种黄色的事物',
            '找1种绿色的事物',
            '找1种蓝色的事物',
            '找1种紫色的事物',
            '找1种棕色或其他颜色'
        ],
        suitable: ['anxious', 'stressed', 'overwhelmed'],
        tips: '类似5-4-3-2-1，但更容易在公共场合执行',
        animation: 'default'
    },
    counting: {
        id: 'counting',
        name: '反向数数',
        icon: '🔢',
        category: ActionCategory.GROUNDING,
        duration: 30,
        description: '从100开始倒数，或做简单数学题',
        instructions: [
            '从100开始倒数',
            '每数一个数，深吸一口气',
            '继续倒数：99、98、97...',
            '如果数错了，没关系，从头开始',
            '专注于数字，暂时搁置其他想法'
        ],
        suitable: ['anxious', 'irritable', 'overwhelmed', 'stressed'],
        tips: '当思维混乱时，给大脑一个简单的任务',
        animation: 'count_down'
    },
    mental_reset: {
        id: 'mental_reset',
        name: '思维重置',
        icon: '🔋',
        category: ActionCategory.GROUNDING,
        duration: 45,
        description: '快速清空大脑，恢复专注力',
        instructions: [
            '闭上眼睛，深呼吸3次',
            '想象大脑是一个硬盘',
            '现在按下"清空回收站"键',
            '所有的想法都被暂时移除了',
            '感受大脑变得空白和安静',
            '当你准备好了，慢慢睁开眼睛'
        ],
        suitable: ['tired', 'overwhelmed', 'stressed'],
        tips: '适合长时间工作后的大脑重启',
        animation: 'default'
    },
    butterfly_hug: {
        id: 'butterfly_hug',
        name: '蝴蝶拥抱',
        icon: '🦋',
        category: ActionCategory.SELF_SOOTHING,
        duration: 45,
        description: '双手交叉放在胸前，交替轻拍',
        instructions: [
            '坐好，准备开始蝴蝶拥抱',
            '双手交叉放在胸前',
            '左手在上手臂，右手在下',
            '像蝴蝶扇动翅膀一样，轻轻交替拍打',
            '同时保持深呼吸',
            '继续拍打，感受安抚'
        ],
        stepDurations: [5, 8, 8, 8, 8, 8],
        suitable: ['sad', 'guilt', 'anxious', 'lonely'],
        tips: '创伤治疗中常用的自我安抚技术',
        animation: 'butterfly_flap'
    },
    hand_on_heart: {
        id: 'hand_on_heart',
        name: '双手抚心',
        icon: '💖',
        category: ActionCategory.SELF_SOOTHING,
        duration: 30,
        description: '把手放在心口，感受心跳',
        instructions: [
            '把一只手或双手放在心口',
            '感受自己的心跳',
            '温柔地对自己说：',
            '"我现在很安全"',
            '"我此刻在这里"',
            '"一切都会好起来的"'
        ],
        suitable: ['sad', 'anxious', 'guilt', 'nervous'],
        tips: '通过触觉和自我对话安抚自己',
        animation: 'default'
    },
    positive_memory: {
        id: 'positive_memory',
        name: '积极回忆',
        icon: '✨',
        category: ActionCategory.SELF_SOOTHING,
        duration: 60,
        description: '回忆一个让你感到温暖或成功的时刻',
        instructions: [
            '闭上眼睛',
            '回想一个让你感到温暖、安全、幸福的时刻',
            '可能是：被爱的时刻、成功的时刻、被夸奖的时刻',
            '感受那个时刻的情绪',
            '让那个温暖的感受在心中停留',
            '当你准备好了，睁开眼睛'
        ],
        suitable: ['sad', 'guilt', 'tired', 'lonely'],
        tips: '激活内心的积极资源和力量感',
        animation: 'default'
    },
    self_compassion: {
        id: 'self_compassion',
        name: '自我慈悲话语',
        icon: '🤗',
        category: ActionCategory.SELF_SOOTHING,
        duration: 45,
        description: '对自己说一些温暖、理解的话',
        instructions: [
            '把手放在心口或脸颊',
            '温柔地对自己说：',
            '"这很困难，但我正在尽力"',
            '"困难是生活的一部分"',
            '"我允许自己此刻感到..."',
            '"我给予自己所需的慈悲"'
        ],
        suitable: ['guilt', 'sad', 'stressed', 'overwhelmed'],
        tips: '用对待好朋友的方式对待自己',
        animation: 'default'
    },
    breath_awareness: {
        id: 'breath_awareness',
        name: '呼吸觉察',
        icon: '🧘',
        category: ActionCategory.MINDFULNESS,
        duration: 120,
        description: '不带评判地观察呼吸',
        instructions: [
            '安静坐好，闭上眼睛，准备开始',
            '把注意力放在呼吸上',
            '感受空气从鼻孔进入',
            '感受胸腔和腹部的起伏',
            '如果走神了，温柔地把注意力带回来',
            '不需要控制呼吸，只是观察',
            '继续觉察，感受平静'
        ],
        stepDurations: [5, 15, 20, 20, 20, 20, 20],
        suitable: ['anxious', 'stressed', 'overwhelmed', 'calm'],
        tips: '正念冥想的基础练习，培养当下觉察',
        animation: 'gentle_breathe',
        phases: [
            { name: '吸气', duration: 4000, scale: 1.15 },
            { name: '呼气', duration: 5000, scale: 0.9 }
        ]
    },
    body_anchor: {
        id: 'body_anchor',
        name: '身体感受锚定',
        icon: '⚓',
        category: ActionCategory.MINDFULNESS,
        duration: 45,
        description: '通过感受身体与地面/椅子的接触，回到当下',
        instructions: [
            '坐好，感受椅子对身体的支持',
            '感受双脚踩在地上的感觉',
            '感受背部靠在椅背上的触感',
            '感受双手放在膝盖上的重量',
            '这些触感提醒你：你是安全的',
            '你现在就在这里'
        ],
        suitable: ['anxious', 'stressed', 'overwhelmed', 'nervous'],
        tips: '当感觉不真实时，用身体把自己锚定回现实',
        animation: 'default'
    },
    loving_kindness: {
        id: 'loving_kindness',
        name: '慈心冥想',
        icon: '💝',
        category: ActionCategory.MINDFULNESS,
        duration: 120,
        description: '培养对自己和他人的善意',
        instructions: [
            '安静坐好，闭上眼睛',
            '把手放在心口',
            '对自己说："愿我平安"',
            '"愿我健康"',
            '"愿我被爱"',
            '如果愿意，可以扩展到：',
            '爱的人、朋友、甚至陌生人'
        ],
        suitable: ['sad', 'guilt', 'lonely', 'calm'],
        tips: '古老的冥想方式，培养内心的善意和温暖',
        animation: 'default'
    },
    stop: {
        id: 'stop',
        name: 'STOP 技术',
        icon: '🛑',
        category: ActionCategory.MINDFULNESS,
        duration: 30,
        description: '快速停顿，打破情绪反应链',
        instructions: [
            'S - Stop（停止）：暂时停下正在做的事',
            'T - Take a breath（呼吸）：做一个深呼吸',
            'O - Observe（观察）：留意此刻的想法和感受',
            'P - Proceed（继续）：带着觉察继续前进'
        ],
        stepDurations: [5, 8, 10, 7],
        suitable: ['anxious', 'irritable', 'overwhelmed', 'stressed'],
        tips: '简单的4步，随时可用的情绪调节工具',
        animation: 'default'
    }
};

const EmotionActionMapping = {
    anxiety: {
        priority: ['rhythm_breathing', 'breathing_478', 'box_breathing', 'grounding_54321', 'stop'],
        secondary: ['deep_breathing', 'shoulder_release', 'body_scan', 'finger_release']
    },
    irritable: {
        priority: ['rhythm_breathing', 'shoulder_release', 'counting', 'stop', 'body_scan'],
        secondary: ['finger_release', 'deep_breathing', 'grounding_54321']
    },
    sad: {
        priority: ['hand_on_heart', 'butterfly_hug', 'positive_memory', 'self_compassion', 'loving_kindness'],
        secondary: ['deep_breathing', 'breath_awareness', 'body_scan']
    },
    tired: {
        priority: ['deep_breathing', 'body_scan', 'finger_release', 'body_anchor'],
        secondary: ['hand_on_heart', 'positive_memory', 'breath_awareness']
    },
    guilt: {
        priority: ['self_compassion', 'hand_on_heart', 'butterfly_hug', 'positive_memory', 'loving_kindness'],
        secondary: ['deep_breathing', 'body_scan', 'breath_awareness']
    },
    nervous: {
        priority: ['breathing_478', 'box_breathing', 'rhythm_breathing', 'finger_release'],
        secondary: ['deep_breathing', 'shoulder_release', 'stop']
    },
    stressed: {
        priority: ['progressive_muscle', 'body_scan', 'rhythm_breathing', 'shoulder_release'],
        secondary: ['deep_breathing', 'breath_awareness', 'stop']
    },
    overwhelmed: {
        priority: ['grounding_54321', 'color_observation', 'stop', 'body_anchor'],
        secondary: ['breath_awareness', 'rhythm_breathing', 'body_scan']
    },
    calm: {
        priority: ['breath_awareness', 'body_scan', 'positive_memory', 'loving_kindness'],
        secondary: ['deep_breathing', 'hand_on_heart', 'stop']
    },
    happy: {
        priority: ['positive_memory', 'loving_kindness', 'breath_awareness', 'body_scan'],
        secondary: ['hand_on_heart', 'self_compassion', 'deep_breathing']
    }
};

const SceneActionMapping = {
    exam: ['breathing_478', 'rhythm_breathing', 'box_breathing', 'finger_release', 'stop'],
    work_break: ['neck_release', 'shoulder_release', 'eye_rest', 'mental_reset', 'deep_breathing'],
    eye_strain: ['eye_rest', 'temple_pressure', 'forehead_release', 'deep_breathing', 'body_scan'],
    sleep: ['breath_awareness', 'deep_breathing', 'body_scan', 'loving_kindness']
};

const SceneEmotionMapping = {
    exam: 'anxiety',
    work_break: 'tired',
    eye_strain: 'tired',
    sleep: 'calm'
};

function getRecommendedActions(emotion, count = 3) {
    const mapping = EmotionActionMapping[emotion];
    if (!mapping) return [];

    const actions = [];

    for (const actionId of mapping.priority) {
        if (actions.length >= count) break;
        const action = MicroActions[actionId];
        if (action) actions.push({ ...action, recommended: true });
    }

    if (actions.length < count) {
        for (const actionId of mapping.secondary) {
            if (actions.length >= count) break;
            const action = MicroActions[actionId];
            if (action && !actions.find(a => a.id === action.id)) {
                actions.push({ ...action, recommended: false });
            }
        }
    }

    return actions;
}

function getSceneActions(scene, count = 3) {
    const actionIds = SceneActionMapping[scene] || [];
    const actions = [];

    for (const actionId of actionIds) {
        if (actions.length >= count) break;
        const action = MicroActions[actionId];
        if (action) actions.push({ ...action });
    }

    return actions;
}

function getSceneEmotion(scene) {
    return SceneEmotionMapping[scene] || 'calm';
}

function getActionDetail(actionId) {
    return MicroActions[actionId] || null;
}

function getAllActions() {
    return Object.values(MicroActions);
}

function getActionsByCategory(category) {
    if (category === 'all') return getAllActions();
    return Object.values(MicroActions).filter(action => action.category === category);
}

function getSceneActionsForHome(scene, count) {
    const actionIds = SceneActionMapping[scene] || [];
    if (actionIds.length > 0) {
        return actionIds.slice(0, count).map(id => MicroActions[id]).filter(Boolean);
    }
    return getAllActions().slice(0, count);
}

// ========== 情绪配置 ==========
const Emotions = {
    anxiety: { name: '焦虑', icon: '😰', color: '#FFB74D', response: '先不用解决所有问题，先把呼吸慢下来。' },
    irritable: { name: '烦躁', icon: '😤', color: '#EF9A9A', response: '先暂停 10 秒，不急着反应。' },
    sad: { name: '难过', icon: '😔', color: '#90CAF9', response: '你已经很不容易了，先不用把一切都处理好。' },
    tired: { name: '疲惫', icon: '😮‍💨', color: '#CE93D8', response: '你现在可能需要的不是更努力，而是先缓一缓。' },
    guilt: { name: '内疚', icon: '😔', color: '#90CAF9', response: '没有人是完美的，试着对自己温柔一点。' },
    nervous: { name: '紧张', icon: '😬', color: '#FFB74D', response: '紧张是正常的，让我们先调整一下呼吸。' },
    stressed: { name: '压力大', icon: '😫', color: '#EF9A9A', response: '肩膀是不是绷得很紧？先松一松。' },
    overwhelmed: { name: '乱糟糟', icon: '🤯', color: '#CE93D8', response: '事情太多了，我们先从一件小事开始。' },
    calm: { name: '平静', icon: '☺️', color: '#A5D6A7', response: '平静不是普通，它也是值得记录的状态。' },
    happy: { name: '开心', icon: '😊', color: '#FFD54F', response: '这一刻值得被记住。' }
};

function getWeatherMood(emotionKey) {
    const weatherMap = {
        happy: { icon: '☀️', name: '晴', desc: '阳光明媚的一天' },
        calm: { icon: '🌤️', name: '晴转多云', desc: '平和温暖的心情' },
        anxiety: { icon: '⛅', name: '多云', desc: '有些云朵也没关系' },
        nervous: { icon: '⛅', name: '多云', desc: '有些云朵也没关系' },
        irritable: { icon: '🌥️', name: '阴天', desc: '有点闷闷的' },
        stressed: { icon: '🌥️', name: '阴天', desc: '有点闷闷的' },
        sad: { icon: '🌧️', name: '小雨', desc: '下点雨也没关系' },
        guilt: { icon: '🌧️', name: '小雨', desc: '下点雨也没关系' },
        tired: { icon: '🌫️', name: '雾', desc: '有点迷糊的感觉' },
        overwhelmed: { icon: '⛈️', name: '雷阵雨', desc: '情绪有点起伏' }
    };
    return weatherMap[emotionKey] || { icon: '⛅', name: '多云', desc: '平静的一天' };
}

function getEmotion(emotionKey) {
    return Emotions[emotionKey] || null;
}

// ========== 鼓励语模块 ==========
const Encourage = {
    dailyQuotes: [
        '每一个当下都是新的开始。',
        '你的存在本身就很有意义。',
        '慢一点也没关系，你有自己的节奏。',
        '今天的你已经很棒了。',
        '允许自己不完美，也是一种温柔。',
        '情绪没有好坏，它们只是提醒。',
        '先接住自己，再谈改变。',
        '你值得被温柔对待，包括来自你自己的。',
        '休息也是一种前进的方式。',
        '每一次呼吸都是新的开始。'
    ],

    encourageCards: [
        { emoji: '💪', text: '你已经做得很好了' },
        { emoji: '🌱', text: '慢慢来，会开花的' },
        { emoji: '💗', text: '你值得被爱' },
        { emoji: '☀️', text: '今天也是新的一天' },
        { emoji: '🎯', text: '专注当下就好' },
        { emoji: '🤗', text: '给自己一个拥抱' },
        { emoji: '💫', text: '你比想象中更强大' },
        { emoji: '🌙', text: '好好休息也是胜利' }
    ],

    getDaily() {
        const index = Math.floor(Math.random() * this.dailyQuotes.length);
        return { quote: this.dailyQuotes[index] };
    },

    getEncourageCards() {
        return this.encourageCards;
    },

    getRandomQuote() {
        const index = Math.floor(Math.random() * this.dailyQuotes.length);
        return this.dailyQuotes[index];
    }
};

// ========== 成就徽章配置 ==========
const Achievements = [
    { id: 'first_record', name: '初次记录', icon: '🌱', desc: '完成第一次情绪记录', story: '你已经迈出了第一步，开始关注自己的情绪了！', condition: (data) => data.totalCount >= 1 },
    { id: 'three_days', name: '三天小绿芽', icon: '🌿', desc: '连续记录3天', story: '你开始养成习惯了，继续浇灌这棵小芽！', condition: (data) => data.streakDays >= 3 },
    { id: 'seven_days', name: '一周火焰', icon: '🔥', desc: '连续记录7天', story: '一周的坚持！你的火焰越烧越旺！', condition: (data) => data.streakDays >= 7 },
    { id: 'ten_records', name: '十次绽放', icon: '🌸', desc: '累计记录10次', story: '十次记录，你正在慢慢绽放！', condition: (data) => data.totalCount >= 10 },
    { id: 'thirty_records', name: '月度钻石', icon: '💎', desc: '累计记录30天', story: '一个月的坚持，你已经成为了情绪管理达人！', condition: (data) => data.totalCount >= 30 },
    { id: 'calm_mood', name: '平静使者', icon: '☺️', desc: '记录5次平静情绪', story: '你越来越能感受到内心的平静了！', condition: (data) => {
        if (!data.records) return false;
        const calmCount = data.records.filter(r => r.emotion === 'calm').length;
        return calmCount >= 5;
    }},
    { id: 'action_master', name: '动作达人', icon: '🧘', desc: '完成5次不同的动作练习', story: '你已经尝试了很多动作方法！', condition: (data) => {
        if (!data.records) return false;
        const actionSet = new Set(data.records.filter(r => r.action).map(r => r.action));
        return actionSet.size >= 5;
    }},
    { id: 'early_bird', name: '早起鸟', icon: '🌅', desc: '在早上8点前记录', story: '早起的你，一定很珍惜和自己相处的时间！', condition: (data) => {
        if (!data.records) return false;
        return data.records.some(r => {
            const hour = new Date(r.time).getHours();
            return hour >= 5 && hour < 8;
        });
    }}
];

// ========== 数据存储模块 ==========
const Storage = {
    KEY: 'mood_landing_data',
    SIGNIN_KEY: 'mood_landing_signin',
    EMERGENCY_KEY: 'mood_landing_emergency',
    WINS_KEY: 'mood_landing_wins',

    getData() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            return this.getDefaultData();
        }
    },

    setData(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.error('保存数据失败', e);
        }
    },

    getDefaultData() {
        // 生成演示数据，展示产品功能
        const today = new Date();
        const demoRecords = [];
        
        // 生成过去7天的数据
        for (let day = 6; day >= 0; day--) {
            const date = new Date(today);
            date.setDate(date.getDate() - day);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            // 每天1-3条记录
            const recordsPerDay = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < recordsPerDay; i++) {
                const hour = 8 + Math.floor(Math.random() * 14); // 8点到22点之间
                const minute = Math.floor(Math.random() * 60);
                const time = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
                
                // 随机选择情绪
                const emotions = ['anxiety', 'irritable', 'sad', 'tired', 'stressed', 'calm', 'happy'];
                const weights = [3, 2, 2, 3, 2, 4, 2]; // 平静权重更高
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let random = Math.random() * totalWeight;
                let emotion = emotions[0];
                for (let j = 0; j < weights.length; j++) {
                    random -= weights[j];
                    if (random <= 0) {
                        emotion = emotions[j];
                        break;
                    }
                }
                
                // 50%概率有动作记录
                const actions = ['breathing_478', 'grounding_54321', 'finger_release', 'box_breathing'];
                const hasAction = Math.random() > 0.5;
                
                demoRecords.push({
                    id: Date.now() + Math.random(),
                    emotion: emotion,
                    type: hasAction ? 'practice' : 'emotion',
                    action: hasAction ? actions[Math.floor(Math.random() * actions.length)] : null,
                    time: time.getTime(),
                    date: dateStr
                });
            }
        }
        
        return {
            records: demoRecords,
            totalCount: demoRecords.length,
            todayCount: demoRecords.filter(r => r.date === this.getTodayString()).length,
            lastDate: this.getTodayString(),
            streakDays: 7,
            practiceCount: demoRecords.filter(r => r.type === 'practice').length,
            encourages: []
        };
    },

    getTodayString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    addRecord(emotion, type, action = null) {
        const data = this.getData();
        const now = new Date();
        const today = this.getTodayString();

        if (data.lastDate !== today) {
            if (data.lastDate) {
                const lastDate = new Date(data.lastDate);
                const nowDate = new Date(today);
                const diffTime = Math.abs(nowDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    data.streakDays++;
                } else if (diffDays > 1) {
                    data.streakDays = 1;
                }
            } else {
                data.streakDays = 1;
            }
            data.todayCount = 0;
            data.lastDate = today;
        }

        const record = {
            id: Date.now(),
            emotion: emotion,
            type: type,
            action: action,
            time: now.toISOString()
        };

        data.records.unshift(record);
        data.totalCount++;
        data.todayCount++;
        
        if (type === 'practice') {
            data.practiceCount = (data.practiceCount || 0) + 1;
        }

        if (data.records.length > 500) {
            data.records = data.records.slice(0, 500);
        }

        this.setData(data);
        return data;
    },

    getSignInData() {
        try {
            const data = localStorage.getItem(this.SIGNIN_KEY);
            return data ? JSON.parse(data) : this.getDefaultSignInData();
        } catch (e) {
            return this.getDefaultSignInData();
        }
    },

    setSignInData(data) {
        try {
            localStorage.setItem(this.SIGNIN_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('保存签到数据失败', e);
        }
    },

    getDefaultSignInData() {
        // 生成演示签到数据
        const today = new Date();
        const signDates = [];
        
        // 过去7天都签到了
        for (let day = 6; day >= 0; day--) {
            const date = new Date(today);
            date.setDate(date.getDate() - day);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            signDates.push(dateStr);
        }
        
        return {
            todaySigned: true, // 今天已签到
            streakDays: 7,
            lastSignDate: signDates[signDates.length - 1],
            signDates: signDates
        };
    },

    doSignIn() {
        const data = this.getSignInData();
        const today = this.getTodayString();

        if (data.todaySigned && data.lastSignDate === today) {
            return { success: false, message: '今天已经签到过了' };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (data.lastSignDate === yesterdayStr) {
            data.streakDays++;
        } else if (data.lastSignDate !== today) {
            data.streakDays = 1;
        }

        data.todaySigned = true;
        data.lastSignDate = today;
        if (!data.signDates.includes(today)) {
            data.signDates.push(today);
        }

        this.setSignInData(data);
        return { success: true, streakDays: data.streakDays };
    },

    getEmergencyKit() {
        try {
            const kit = localStorage.getItem(this.EMERGENCY_KEY);
            if (kit) {
                return JSON.parse(kit);
            }
        } catch (e) {
            console.error('读取急救包失败', e);
        }
        return ['breathing_478', 'grounding_54321', 'stop', 'finger_release'];
    },

    setEmergencyKit(ids) {
        try {
            localStorage.setItem(this.EMERGENCY_KEY, JSON.stringify(ids));
        } catch (e) {
            console.error('保存急救包失败', e);
        }
    },

    getSmallWins() {
        try {
            const wins = localStorage.getItem(this.WINS_KEY);
            if (wins) {
                return JSON.parse(wins);
            }
            // 生成演示小胜利数据
            const today = new Date();
            const demoWins = [
                { id: 1, text: '今天完成了节律呼吸练习', time: new Date(today.getTime() - 3600000).toISOString() },
                { id: 2, text: '和同事聊了聊天，心情好多了', time: new Date(today.getTime() - 7200000).toISOString() },
                { id: 3, text: '午休时散了个步', time: new Date(today.getTime() - 10800000).toISOString() }
            ];
            return demoWins;
        } catch (e) {
            return [];
        }
    },

    addSmallWin(text) {
        const wins = this.getSmallWins();
        const win = {
            id: Date.now(),
            text: text,
            time: new Date().toISOString()
        };
        wins.unshift(win);
        try {
            localStorage.setItem(this.WINS_KEY, JSON.stringify(wins));
        } catch (e) {
            console.error('保存小胜利失败', e);
        }
        return wins;
    },

    getTodayWins() {
        const wins = this.getSmallWins();
        const today = this.getTodayString();
        return wins.filter(w => {
            const winDate = new Date(w.time);
            const winDateStr = `${winDate.getFullYear()}-${String(winDate.getMonth() + 1).padStart(2, '0')}-${String(winDate.getDate()).padStart(2, '0')}`;
            return winDateStr === today;
        });
    }
};

// ========== 状态管理 ==========
let currentEmotion = null;
let currentAction = null;
let currentTab = 'home';
let practiceTimer = null;
let practiceStartTime = 0;
let practiceElapsed = 0;
let practicePhaseIndex = 0;
let practicePhaseTimer = null;
let practiceCycles = 0;
let currentCategory = 'all';
let currentTrendFilter = 'week';

// 急救包管理状态
let manageState = {
    show: false,
    mode: 'selectType',
    currentKit: [],
    currentIndex: -1,
    availableActions: [],
    selectedAction: null,
    positions: []
};

// ========== 页面导航模块 ==========
const Navigation = {
    history: ['page-home'],
    currentPage: 'page-home',

    navigateTo(pageId) {
        const currentEl = document.getElementById(this.currentPage);
        const targetEl = document.getElementById(pageId);

        if (!targetEl || pageId === this.currentPage) return;

        if (currentEl) {
            currentEl.classList.remove('active');
            currentEl.classList.add('prev');
        }

        targetEl.classList.add('active');
        targetEl.classList.remove('prev');

        this.history.push(pageId);
        this.currentPage = pageId;

        const page = pageId.replace('page-', '');
        if (typeof pageInit[page] === 'function') {
            pageInit[page]();
        }

        updateTabBarVisibility(pageId);
    },

    goBack() {
        if (this.history.length <= 1) return;

        const currentPage = this.history.pop();
        const prevPage = this.history[this.history.length - 1];

        const currentEl = document.getElementById(currentPage);
        const prevEl = document.getElementById(prevPage);

        if (currentEl) {
            currentEl.classList.remove('active');
        }

        if (prevEl) {
            prevEl.classList.remove('prev');
            prevEl.classList.add('active');
        }

        this.currentPage = prevPage;

        const page = prevPage.replace('page-', '');
        if (typeof pageInit[page] === 'function') {
            pageInit[page]();
        }

        updateTabBarVisibility(prevPage);
    },

    goHome() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            p.classList.remove('active', 'prev');
        });

        const homeEl = document.getElementById('page-home');
        if (homeEl) {
            homeEl.classList.add('active');
        }

        this.history = ['page-home'];
        this.currentPage = 'page-home';

        pageInit.home();
        switchTab('home');
    }
};

function navigateTo(pageId) {
    Navigation.navigateTo(pageId);
}

function goBack() {
    Navigation.goBack();
}

function goHome() {
    Navigation.goHome();
}

function updateTabBarVisibility(pageId) {
    const tabBar = document.getElementById('bottom-tab-bar');
    const tabPages = ['page-home', 'page-practice', 'page-growth'];
    
    if (tabPages.includes(pageId)) {
        tabBar.style.display = 'flex';
    } else {
        tabBar.style.display = 'none';
    }
}

// ========== Tab 切换 ==========
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    const tabPageMap = {
        home: 'page-home',
        practice: 'page-practice',
        growth: 'page-growth'
    };

    const targetPage = tabPageMap[tab];
    if (!targetPage) return;

    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
        p.classList.remove('active', 'prev');
    });

    const targetEl = document.getElementById(targetPage);
    if (targetEl) {
        targetEl.classList.add('active');
    }

    Navigation.history = [targetPage];
    Navigation.currentPage = targetPage;

    const page = targetPage.replace('page-', '');
    if (typeof pageInit[page] === 'function') {
        pageInit[page]();
    }

    updateTabBarVisibility(targetPage);
}

// ========== 页面初始化函数 ==========
const pageInit = {
    home() {
        updateGreeting();
        loadHomeStats();
        renderEmergencyKit();
        renderHomeRecommendedActions();
        loadDailyQuote();
        loadWeatherData();
    },

    'emotion-select'() {
    },

    response() {
    },

    'action-list'() {
    },

    'action-detail'() {
    },

    practice() {
        renderPracticeActions();
        
        // 检查是否需要滚动到场景区域
        if (window.showSceneMode) {
            window.showSceneMode = false;
            setTimeout(() => {
                const sceneGrid = document.querySelector('.practice-scene-grid');
                if (sceneGrid) {
                    sceneGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    sceneGrid.style.transform = 'scale(1.02)';
                    sceneGrid.style.transition = 'transform 0.3s ease';
                    setTimeout(() => {
                        sceneGrid.style.transform = 'scale(1)';
                    }, 300);
                }
            }, 200);
        }
    },

    encourage() {
        renderEncouragePage();
    },

    growth() {
        renderGrowthData();
    },

    signin() {
        renderSignInPage();
    },

    complete() {
    }
};

// ========== 首页功能 ==========
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('greeting-main');
    
    let greeting = '你好呀';
    if (hour >= 5 && hour < 12) {
        greeting = '早上好';
    } else if (hour >= 12 && hour < 14) {
        greeting = '中午好';
    } else if (hour >= 14 && hour < 18) {
        greeting = '下午好';
    } else if (hour >= 18 && hour < 22) {
        greeting = '晚上好';
    } else {
        greeting = '夜深了';
    }
    
    if (greetingEl) {
        greetingEl.textContent = greeting;
    }
}

function loadHomeStats() {
    const data = Storage.getData();
    const signInData = Storage.getSignInData();

    const todayDataEl = document.getElementById('today-data');
    const todayCountEl = document.getElementById('today-count');
    const streakDaysEl = document.getElementById('streak-days');
    const signinTextEl = document.getElementById('signin-text');

    if (data.totalCount > 0) {
        todayDataEl.style.display = 'flex';
    } else {
        todayDataEl.style.display = 'none';
    }

    if (todayCountEl) todayCountEl.textContent = data.todayCount;
    if (streakDaysEl) streakDaysEl.textContent = data.streakDays;
    if (signinTextEl) signinTextEl.textContent = signInData.todaySigned ? '已签到' : '签到';
}

function renderHomeRecommendedActions() {
    const container = document.getElementById('home-recommended-actions');
    if (!container) return;

    const featuredActions = ['rhythm_breathing', 'box_breathing', 'breathing_478', 'grounding_54321'];
    const actions = featuredActions.map(id => MicroActions[id]).filter(Boolean);

    container.innerHTML = actions.map(action => `
        <div class="action-card-horizontal" onclick="openActionDetail('${action.id}')">
            <div class="action-card-icon">${action.icon}</div>
            <div class="action-card-name">${action.name}</div>
            <div class="action-card-desc">${action.description}</div>
            <div class="action-card-meta">
                <span>⏱️</span>
                <span>${formatDuration(action.duration)}</span>
            </div>
        </div>
    `).join('');
}

function renderEmergencyKit() {
    const container = document.getElementById('emergency-grid');
    if (!container) return;

    const emergencyIds = Storage.getEmergencyKit();
    const emergencyActions = emergencyIds.map(id => {
        const action = MicroActions[id];
        return action ? {
            id: action.id,
            name: action.name,
            icon: action.icon,
            duration: action.duration
        } : null;
    }).filter(Boolean);

    container.innerHTML = emergencyActions.map(action => `
        <div class="emergency-item card-hover" onclick="quickAction('${action.id}')">
            <span class="emergency-icon">${action.icon}</span>
            <span class="emergency-name">${action.name}</span>
            <span class="emergency-duration">${action.duration}秒</span>
        </div>
    `).join('');

    // 更新一键急救按钮
    const quickBtn = document.getElementById('emergency-quick');
    const firstActionEl = document.getElementById('first-emergency-action');
    if (quickBtn && emergencyActions.length > 0) {
        quickBtn.style.display = 'block';
        if (firstActionEl) {
            firstActionEl.textContent = emergencyActions[0].icon + ' ' + emergencyActions[0].name;
        }
    }
}

function loadDailyQuote() {
    const quoteEl = document.getElementById('daily-quote');
    if (!quoteEl) return;

    const quote = Encourage.getRandomQuote();
    quoteEl.textContent = quote;
}

function loadWeatherData() {
    const data = Storage.getData();
    const records = data.records || [];
    const weatherEl = document.getElementById('mood-weather');
    
    if (data.totalCount === 0) {
        weatherEl.style.display = 'none';
        return;
    }

    weatherEl.style.display = 'block';

    const today = Storage.getTodayString();
    const todayDate = new Date();
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

    const todayRecords = records.filter(r => {
        if (!r.time) return false;
        const recordTime = new Date(r.time).getTime();
        return recordTime >= todayStart && recordTime < tomorrowStart;
    });

    const emotionCount = {};
    todayRecords.forEach(r => {
        if (r.emotion) {
            emotionCount[r.emotion] = (emotionCount[r.emotion] || 0) + 1;
        }
    });

    let dominantEmotion = 'cloudy';
    let maxCount = 0;
    
    Object.entries(emotionCount).forEach(([emotion, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominantEmotion = emotion;
        }
    });

    const weather = getWeatherMood(dominantEmotion);
    
    const recentEmotions = [];
    const seenEmotions = new Set();
    for (let i = todayRecords.length - 1; i >= 0; i--) {
        const r = todayRecords[i];
        if (!seenEmotions.has(r.emotion)) {
            seenEmotions.add(r.emotion);
            const emotionData = Emotions[r.emotion];
            recentEmotions.push(emotionData ? emotionData.icon : '☺️');
        }
        if (recentEmotions.length >= 5) break;
    }

    document.getElementById('weather-icon').textContent = weather.icon;
    document.getElementById('weather-desc').textContent = weather.desc;
    document.getElementById('weather-emotions').innerHTML = recentEmotions.map(e => 
        `<span class="emotion-tag">${e}</span>`
    ).join('');
}

function showWeatherDetail() {
    showToast('根据今日情绪记录生成的心情天气', '�️', 2500);
}

function showShareTip() {
    showToast('分享给好友，一起照顾好心情', '📤', 2000);
}

function showSettingsTip() {
    Navigation.navigateTo('page-settings');
}

// ========== 设置页功能 ==========
function toggleTheme() {
    const toggle = document.getElementById('theme-toggle');
    const isDark = document.body.classList.toggle('dark-mode');
    toggle.classList.toggle('active', isDark);
    
    const data = Storage.getData();
    data.darkMode = isDark;
    Storage.setData(data);
}

function toggleReminder() {
    const toggle = document.getElementById('reminder-toggle');
    const timeItem = document.getElementById('reminder-time-item');
    
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    
    if (timeItem) {
        timeItem.style.opacity = isActive ? '1' : '0.5';
        timeItem.style.pointerEvents = isActive ? 'auto' : 'none';
    }
    
    const data = Storage.getData();
    data.reminderEnabled = isActive;
    Storage.setData(data);
    
    showToast(isActive ? '提醒已开启' : '提醒已关闭', isActive ? '🔔' : '🔕', 1500);
}

function showTimePicker() {
    showToast('提醒时间设置功能开发中', '⏰', 1500);
}

function showEditNameDialog() {
    const name = prompt('请输入你的昵称：', document.getElementById('settings-user-name').textContent);
    if (name && name.trim()) {
        document.getElementById('settings-user-name').textContent = name.trim();
        const data = Storage.getData();
        data.userName = name.trim();
        Storage.setData(data);
        showToast('昵称已更新', '✨', 1500);
    }
}

function exportData() {
    const data = Storage.getData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据导出成功', '📤', 2000);
}

function showClearDataConfirm() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
    }
}

function showAbout() {
    showToast('心情日记 - 记录每一刻的心情', '💗', 2500);
}

function initSettingsPage() {
    const data = Storage.getData();
    
    // 初始化昵称
    if (data.userName) {
        document.getElementById('settings-user-name').textContent = data.userName;
    }
    
    // 初始化深色模式
    if (data.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').classList.add('active');
    }
    
    // 初始化提醒设置
    const reminderToggle = document.getElementById('reminder-toggle');
    const timeItem = document.getElementById('reminder-time-item');
    if (data.reminderEnabled === false) {
        reminderToggle.classList.remove('active');
        if (timeItem) {
            timeItem.style.opacity = '0.5';
            timeItem.style.pointerEvents = 'none';
        }
    }
    
    // 初始化提醒时间
    if (data.reminderTime) {
        document.getElementById('reminder-time').textContent = data.reminderTime;
    }
}

// ========== 急救包管理功能 ==========
function manageEmergencyKit() {
    let emergencyIds = Storage.getEmergencyKit();
    
    if (!emergencyIds || emergencyIds.length === 0) {
        emergencyIds = ['breathing_478', 'grounding_54321', 'stop', 'finger_release'];
        Storage.setEmergencyKit(emergencyIds);
    }

    const currentKitActions = emergencyIds.map(id => {
        const action = MicroActions[id];
        return action || { id: id, name: id, icon: '❓' };
    });

    manageState = {
        show: true,
        mode: 'selectType',
        currentKit: currentKitActions,
        currentIndex: -1,
        availableActions: [],
        selectedAction: null,
        positions: []
    };

    renderManageModal();
    document.getElementById('manage-modal').style.display = 'flex';
}

function renderManageModal() {
    const modal = document.getElementById('manage-modal');
    const body = document.getElementById('manage-body');
    const title = document.getElementById('manage-title');
    const back = document.getElementById('manage-back');

    if (manageState.mode === 'selectType') {
        title.textContent = '管理急救包';
        back.style.display = 'none';
        body.innerHTML = `
            <div class="manage-section-title">选择要替换的动作</div>
            <div class="manage-list">
                ${manageState.currentKit.map((item, index) => `
                    <div class="manage-list-item" onclick="onSelectPosition(${index})">
                        <span class="manage-list-index">${index + 1}</span>
                        <span class="manage-list-text">${item.icon} ${item.name}</span>
                        <span class="manage-list-arrow">›</span>
                    </div>
                `).join('')}
            </div>
            <div class="manage-section-title" style="margin-top: 32px;">其他操作</div>
            <div class="manage-list">
                <div class="manage-list-item" onclick="onAddNewAction()">
                    <span class="manage-list-icon">➕</span>
                    <span class="manage-list-text">添加/替换新动作</span>
                    <span class="manage-list-arrow">›</span>
                </div>
            </div>
        `;
    } else if (manageState.mode === 'replace' || manageState.mode === 'add') {
        title.textContent = manageState.mode === 'replace' ? '选择新动作' : '选择要添加的动作';
        back.style.display = 'block';
        
        const allActions = getAllActions();
        const currentKitIds = manageState.currentKit.map(item => item.id);
        const availableActions = allActions.filter(action => !currentKitIds.includes(action.id));
        manageState.availableActions = availableActions;

        body.innerHTML = `
            <scroll-view scroll-y class="manage-scroll">
                <div class="action-grid">
                    ${availableActions.map(action => `
                        <div class="action-grid-item" onclick="onPickAction('${action.id}')">
                            <span class="action-grid-icon">${action.icon}</span>
                            <span class="action-grid-name">${action.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="manage-empty" style="${availableActions.length === 0 ? 'display:block' : 'display:none'}">
                    <span>暂无可选动作</span>
                </div>
            </scroll-view>
        `;
    } else if (manageState.mode === 'selectPosition') {
        title.textContent = '替换哪个位置？';
        back.style.display = 'block';
        const action = manageState.selectedAction;
        body.innerHTML = `
            <div class="manage-section-title">将 "${action.icon} ${action.name}" 替换为：</div>
            <div class="manage-list">
                ${manageState.currentKit.map((item, index) => `
                    <div class="manage-list-item" onclick="onPickPosition(${index})">
                        <span class="manage-list-index">${index + 1}</span>
                        <span class="manage-list-text">${item.icon} ${item.name}</span>
                        <span class="manage-list-arrow">›</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function onSelectPosition(index) {
    manageState.mode = 'replace';
    manageState.currentIndex = index;
    renderManageModal();
}

function onAddNewAction() {
    manageState.mode = 'add';
    renderManageModal();
}

function onPickAction(actionId) {
    const action = MicroActions[actionId];
    if (!action) return;

    if (manageState.mode === 'replace') {
        confirmReplace(manageState.currentIndex, action);
    } else {
        manageState.selectedAction = action;
        manageState.mode = 'selectPosition';
        manageState.positions = manageState.currentKit;
        renderManageModal();
    }
}

function onPickPosition(index) {
    confirmReplace(index, manageState.selectedAction);
}

function confirmReplace(index, action) {
    const newKitIds = manageState.currentKit.map(item => item.id);
    newKitIds[index] = action.id;

    Storage.setEmergencyKit(newKitIds);
    renderEmergencyKit();

    closeManageModal();

    showToast('已替换为 ' + action.name, '✨');
}

function closeManageModal() {
    document.getElementById('manage-modal').style.display = 'none';
    manageState.show = false;
    manageState.mode = '';
    manageState.currentIndex = -1;
    manageState.selectedAction = null;
}

function onManageBack() {
    const mode = manageState.mode;
    if (mode === 'replace' || mode === 'add') {
        manageState.mode = 'selectType';
    } else if (mode === 'selectPosition') {
        manageState.mode = 'add';
        manageState.selectedAction = null;
    }
    renderManageModal();
}

// ========== 场景功能 ==========
function startScene(scene) {
    const emotion = getSceneEmotion(scene);
    const actions = getSceneActions(scene, 3);
    
    currentEmotion = emotion;
    
    showActionList('场景推荐', '为你精选了几个小动作', actions);
}

// 从情绪选择页的场景入口选择场景
function selectScene(scene) {
    const emotion = getSceneEmotion(scene);
    const actions = getSceneActions(scene, 3);
    
    currentEmotion = emotion;
    
    // 设置回应页面的内容
    const emotionData = Emotions[emotion];
    if (emotionData) {
        document.getElementById('response-icon').textContent = emotionData.icon;
        document.getElementById('response-text').textContent = emotionData.response;
    }
    
    // 渲染推荐动作
    renderRecommendedActions(actions);
    
    Navigation.navigateTo('page-response');
}

// ========== 情绪选择功能 ==========
function selectEmotion(emotionKey) {
    currentEmotion = emotionKey;
    const emotion = Emotions[emotionKey];
    
    document.getElementById('response-icon').textContent = emotion.icon;
    document.getElementById('response-text').textContent = emotion.response;
    
    const recommendedActions = getRecommendedActions(emotionKey, 3);
    renderRecommendedActions(recommendedActions);
    
    Navigation.navigateTo('page-response');
}

function renderRecommendedActions(actions) {
    const container = document.getElementById('recommended-actions');
    if (!container) return;

    container.innerHTML = actions.map((action, index) => `
        <div class="recommended-action-item" onclick="openActionDetail('${action.id}')">
            ${index === 0 ? '<span class="recommended-badge">推荐</span>' : ''}
            <div class="action-item-icon">${action.icon}</div>
            <div class="action-item-info">
                <div class="action-item-name">${action.name}</div>
                <div class="action-item-desc">${action.description}</div>
                <div class="action-item-meta">
                    <span>⏱️</span>
                    <span>${formatDuration(action.duration)}</span>
                </div>
            </div>
            <span class="action-arrow">→</span>
        </div>
    `).join('');
}

// ========== 动作列表 ==========
function showActionList(title, desc, actions) {
    document.getElementById('action-list-title').textContent = title;
    document.getElementById('action-list-desc').textContent = desc;

    const container = document.getElementById('action-list-container');
    container.innerHTML = actions.map(action => `
        <div class="action-list-item" onclick="openActionDetail('${action.id}')">
            <div class="action-item-icon">${action.icon}</div>
            <div class="action-item-info">
                <div class="action-item-name">${action.name}</div>
                <div class="action-item-desc">${action.description}</div>
                <div class="action-item-meta">
                    <span>⏱️</span>
                    <span>${formatDuration(action.duration)}</span>
                    <span style="margin: 0 4px;">·</span>
                    <span>${CategoryNames[action.category] || ''}</span>
                </div>
            </div>
            <span class="action-arrow">→</span>
        </div>
    `).join('');

    Navigation.navigateTo('page-action-list');
}

// ========== 动作详情 ==========
function openActionDetail(actionId) {
    const action = getActionDetail(actionId);
    if (!action) return;

    currentAction = action;

    document.getElementById('detail-title').textContent = action.name;
    document.getElementById('detail-icon').textContent = action.icon;
    document.getElementById('detail-name').textContent = action.name;
    document.getElementById('detail-desc').textContent = action.description;
    document.getElementById('detail-duration').textContent = formatDuration(action.duration);
    document.getElementById('detail-category').textContent = CategoryNames[action.category] || '';
    document.getElementById('detail-tips').textContent = action.tips;

    const stepsContainer = document.getElementById('detail-steps');
    stepsContainer.innerHTML = action.instructions.map((step, index) => `
        <div class="step-item">
            <span class="step-number">${index + 1}</span>
            <span class="step-text">${step}</span>
        </div>
    `).join('');

    Navigation.navigateTo('page-action-detail');
}

function quickAction(actionId) {
    const action = getActionDetail(actionId);
    if (!action) return;
    currentAction = action;
    currentEmotion = 'calm';
    openActionDetail(actionId);
}

// ========== 快速场景入口 ==========
function goToSceneQuick() {
    window.showSceneMode = true;
    switchTab('practice');
}

// ========== 一键急救 ==========
function onQuickEmergency() {
    const emergencyKit = Storage.getEmergencyKit();
    if (emergencyKit && emergencyKit.length > 0) {
        const firstActionId = emergencyKit[0];
        const action = getActionDetail(firstActionId);
        if (action) {
            currentAction = action;
            currentEmotion = {
                id: 'anxiety',
                name: '需要急救',
                icon: '🚨',
                color: '#E57373'
            };
            openActionDetail(firstActionId);
        }
    }
}

// ========== 练习页功能 ==========
function switchCategory(category) {
    currentCategory = category;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });

    renderPracticeActions();
}

function renderPracticeActions() {
    const container = document.getElementById('practice-actions-grid');
    if (!container) return;

    const actions = getActionsByCategory(currentCategory);

    container.innerHTML = actions.map(action => `
        <div class="practice-action-card" onclick="openActionDetail('${action.id}')">
            <div class="action-card-icon">${action.icon}</div>
            <div class="action-card-name">${action.name}</div>
            <div class="action-card-desc">${action.description}</div>
            <div class="action-card-meta">
                <span>⏱️</span>
                <span>${formatDuration(action.duration)}</span>
            </div>
        </div>
    `).join('');
}

// ========== 练习弹窗 ==========
let isPaused = false;
let pauseStartTime = 0;
let totalPausedTime = 0;
let currentStepIndex = 0;

function getStepDurations(action) {
    if (!action || !action.instructions) return [];
    
    const steps = action.instructions;
    const totalDuration = action.duration;
    
    if (action.stepDurations) {
        return action.stepDurations;
    }
    
    const isBreathing = action.animation === 'breathing_circle' || 
                        action.animation === 'breathing_square' ||
                        action.animation === 'gentle_breathe';
    
    if (action.phases && isBreathing) {
        const cycleDuration = action.phases.reduce((sum, p) => sum + p.duration, 0) / 1000;
        const totalCycles = Math.floor(totalDuration / cycleDuration);
        const stepsPerCycle = Math.max(1, Math.floor(steps.length / Math.max(totalCycles, 1)));
        
        const durations = [];
        for (let i = 0; i < steps.length; i++) {
            if (i === steps.length - 1) {
                const usedTime = durations.reduce((a, b) => a + b, 0);
                durations.push(Math.max(totalDuration - usedTime, 2));
            } else {
                durations.push(Math.max(Math.floor(cycleDuration * stepsPerCycle), 3));
            }
        }
        return durations;
    }
    
    const baseDuration = Math.floor(totalDuration / steps.length);
    const remainder = totalDuration - baseDuration * steps.length;
    
    return steps.map((_, i) => baseDuration + (i < remainder ? 1 : 0));
}

function getCurrentStepIndex(elapsed, action) {
    const stepDurations = getStepDurations(action);
    let cumulative = 0;
    
    for (let i = 0; i < stepDurations.length; i++) {
        cumulative += stepDurations[i];
        if (elapsed < cumulative) {
            return i;
        }
    }
    
    return stepDurations.length - 1;
}

function startPractice() {
    if (!currentAction) return;

    const modal = document.getElementById('practice-modal');
    modal.classList.add('active');

    document.getElementById('practice-modal-title').textContent = currentAction.name;
    document.getElementById('practice-modal-subtitle').textContent = currentAction.description;

    const isBreathing = currentAction.animation === 'breathing_circle' || 
                        currentAction.animation === 'breathing_square' ||
                        currentAction.animation === 'gentle_breathe';

    document.getElementById('breathing-animation-container').style.display = isBreathing ? 'flex' : 'none';
    document.getElementById('default-animation-container').style.display = isBreathing ? 'none' : 'flex';

    if (!isBreathing) {
        document.getElementById('default-animation-icon').textContent = currentAction.icon;
    }

    practiceElapsed = 0;
    practicePhaseIndex = 0;
    practiceCycles = 0;
    practiceStartTime = Date.now();
    isPaused = false;
    totalPausedTime = 0;
    currentStepIndex = 0;

    const pauseIcon = document.getElementById('pause-icon');
    if (pauseIcon) pauseIcon.textContent = '⏸️';

    const ring = document.getElementById('progress-ring-fill');
    if (ring) {
        ring.style.strokeDashoffset = 2 * Math.PI * 90;
    }

    const breathingTimer = document.getElementById('breathing-timer');
    if (breathingTimer) {
        const mins = Math.floor(currentAction.duration / 60);
        const secs = currentAction.duration % 60;
        breathingTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updatePracticeProgress();
    updatePracticeSteps(0);
    startPracticeTimer();

    if (isBreathing && currentAction.phases) {
        startBreathingPhases();
    }
}

function togglePause() {
    isPaused = !isPaused;
    const pauseIcon = document.getElementById('pause-icon');
    
    if (isPaused) {
        if (pauseIcon) pauseIcon.textContent = '▶️';
        pauseStartTime = Date.now();
        if (practicePhaseTimer) {
            clearTimeout(practicePhaseTimer);
            practicePhaseTimer = null;
        }
    } else {
        if (pauseIcon) pauseIcon.textContent = '⏸️';
        totalPausedTime += Date.now() - pauseStartTime;
        const isBreathing = currentAction && currentAction.phases &&
                           (currentAction.animation === 'breathing_circle' || 
                            currentAction.animation === 'breathing_square' ||
                            currentAction.animation === 'gentle_breathe');
        if (isBreathing && practicePhaseTimer === null) {
            resumeBreathingPhases();
        }
    }
}

function startPracticeTimer() {
    if (practiceTimer) clearInterval(practiceTimer);

    practiceTimer = setInterval(() => {
        if (isPaused) return;
        
        practiceElapsed = Math.floor((Date.now() - practiceStartTime - totalPausedTime) / 1000);
        updatePracticeProgress();
        updatePracticeTimerDisplay();
        updateProgressRing();
        
        const newStepIndex = getCurrentStepIndex(practiceElapsed, currentAction);
        if (newStepIndex !== currentStepIndex) {
            currentStepIndex = newStepIndex;
            updatePracticeSteps(currentStepIndex);
        }

        if (currentAction && practiceElapsed >= currentAction.duration) {
            finishPractice();
        }
    }, 1000);
}

function updateProgressRing() {
    const ring = document.getElementById('progress-ring-fill');
    if (!ring || !currentAction) return;
    
    const circumference = 2 * Math.PI * 90;
    const progress = Math.min(practiceElapsed / currentAction.duration, 1);
    const offset = circumference - (progress * circumference);
    ring.style.strokeDashoffset = offset;
}

function updatePracticeProgress() {
    if (!currentAction) return;

    const progress = Math.min((practiceElapsed / currentAction.duration) * 100, 100);
    document.getElementById('practice-progress-bar').style.width = progress + '%';
    document.getElementById('practice-progress-text').textContent = Math.floor(progress) + '%';
}

function updatePracticeTimerDisplay() {
    const remaining = Math.max(currentAction.duration - practiceElapsed, 0);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const text = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const breathingTimer = document.getElementById('breathing-timer');
    if (breathingTimer) {
        breathingTimer.textContent = text;
    }
}

function updatePracticeSteps(stepIndex) {
    if (!currentAction || !currentAction.instructions) return;

    const steps = currentAction.instructions;
    const currentStepText = document.getElementById('current-step-text');
    const nextStepText = document.getElementById('next-step-text');

    if (stepIndex < steps.length) {
        currentStepText.textContent = steps[stepIndex];
    } else {
        currentStepText.textContent = '练习中...';
    }

    if (stepIndex + 1 < steps.length) {
        nextStepText.textContent = steps[stepIndex + 1];
    } else {
        nextStepText.textContent = '马上就好';
    }
}

// ========== 呼吸动画 ==========
let phaseRemainingTime = 0;

function startBreathingPhases() {
    if (!currentAction || !currentAction.phases) return;

    const circle = document.getElementById('practice-breathing-circle');
    const phaseText = document.getElementById('breathing-phase-text');

    function runPhase() {
        if (!document.getElementById('practice-modal').classList.contains('active')) {
            return;
        }
        
        if (isPaused) {
            return;
        }

        const phases = currentAction.phases;
        const phase = phases[practicePhaseIndex % phases.length];

        phaseText.textContent = phase.name;
        circle.className = 'breathing-circle-inner';
        
        requestAnimationFrame(() => {
            if (phase.name === '吸气') {
                circle.classList.add('inhale');
            } else if (phase.name === '呼气') {
                circle.classList.add('exhale');
            } else if (phase.name === '屏气') {
                const prevPhase = phases[(practicePhaseIndex - 1 + phases.length) % phases.length];
                if (prevPhase.name === '吸气') {
                    circle.classList.add('inhale');
                    circle.classList.add('hold');
                } else {
                    circle.classList.add('exhale');
                    circle.classList.add('hold');
                }
            }
        });

        phaseRemainingTime = phase.duration;
        practicePhaseTimer = setTimeout(() => {
            practicePhaseIndex++;
            if (practicePhaseIndex % phases.length === 0) {
                practiceCycles++;
            }
            runPhase();
        }, phase.duration);
    }

    phaseText.textContent = '准备';
    circle.className = 'breathing-circle-inner';

    let countdown = 3;
    const prepareInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            phaseText.textContent = countdown;
        } else {
            clearInterval(prepareInterval);
            runPhase();
        }
    }, 1000);
}

function resumeBreathingPhases() {
    if (!currentAction || !currentAction.phases) return;
    if (phaseRemainingTime <= 0) return;

    const circle = document.getElementById('practice-breathing-circle');
    const phaseText = document.getElementById('breathing-phase-text');
    const phases = currentAction.phases;
    const phase = phases[practicePhaseIndex % phases.length];

    phaseText.textContent = phase.name;
    circle.className = 'breathing-circle-inner';
    
    requestAnimationFrame(() => {
        if (phase.name === '吸气') {
            circle.classList.add('inhale');
        } else if (phase.name === '呼气') {
            circle.classList.add('exhale');
        } else if (phase.name === '屏气') {
            const prevPhase = phases[(practicePhaseIndex - 1 + phases.length) % phases.length];
            if (prevPhase.name === '吸气') {
                circle.classList.add('inhale');
                circle.classList.add('hold');
            } else {
                circle.classList.add('exhale');
                circle.classList.add('hold');
            }
        }
    });

    practicePhaseTimer = setTimeout(() => {
        practicePhaseIndex++;
        if (practicePhaseIndex % phases.length === 0) {
            practiceCycles++;
        }
        
        function runNextPhase() {
            if (!document.getElementById('practice-modal').classList.contains('active')) {
                return;
            }
            if (isPaused) return;
            
            const nextPhase = phases[practicePhaseIndex % phases.length];
            phaseText.textContent = nextPhase.name;
            circle.className = 'breathing-circle-inner';
            
            requestAnimationFrame(() => {
                if (nextPhase.name === '吸气') {
                    circle.classList.add('inhale');
                } else if (nextPhase.name === '呼气') {
                    circle.classList.add('exhale');
                } else if (nextPhase.name === '屏气') {
                    const prevPhase = phases[(practicePhaseIndex - 1 + phases.length) % phases.length];
                    if (prevPhase.name === '吸气') {
                        circle.classList.add('inhale');
                        circle.classList.add('hold');
                    } else {
                        circle.classList.add('exhale');
                        circle.classList.add('hold');
                    }
                }
            });

            phaseRemainingTime = nextPhase.duration;
            practicePhaseTimer = setTimeout(() => {
                practicePhaseIndex++;
                if (practicePhaseIndex % phases.length === 0) {
                    practiceCycles++;
                }
                runNextPhase();
            }, nextPhase.duration);
        }
        runNextPhase();
    }, phaseRemainingTime);
}

function closePractice() {
    const modal = document.getElementById('practice-modal');
    modal.classList.remove('active');

    if (practiceTimer) {
        clearInterval(practiceTimer);
        practiceTimer = null;
    }
    if (practicePhaseTimer) {
        clearTimeout(practicePhaseTimer);
        practicePhaseTimer = null;
    }
}

function finishPractice() {
    closePractice();

    if (currentAction && currentEmotion) {
        Storage.addRecord(currentEmotion, 'practice', currentAction.name);
    } else if (currentAction) {
        Storage.addRecord('calm', 'practice', currentAction.name);
    }

    const desc = `你刚刚完成了 ${currentAction ? currentAction.name : ''} 练习`;
    showComplete(desc);
}

// ========== 完成页面 ==========
function finishRecord() {
    if (currentEmotion) {
        Storage.addRecord(currentEmotion, 'emotion', null);
    }
    showComplete('你刚刚记录了此刻的心情');
}

function showComplete(desc) {
    const data = Storage.getData();
    document.getElementById('complete-desc').textContent = desc;
    document.getElementById('stat-count').textContent = data.todayCount;
    document.getElementById('stat-total').textContent = data.totalCount;
    
    Navigation.navigateTo('page-complete');
}

// ========== 鼓励页功能 ==========
function renderEncouragePage() {
    const data = Storage.getData();
    const todayWins = Storage.getTodayWins();

    document.getElementById('win-count').textContent = todayWins.length;
    document.getElementById('encourage-count').textContent = data.totalCount;

    const cards = Encourage.getEncourageCards();
    const grid = document.getElementById('encourage-grid');
    grid.innerHTML = cards.map(card => `
        <div class="encourage-card" onclick="showEncourage('${card.text}')">
            <span class="encourage-emoji">${card.emoji}</span>
            <span class="encourage-text">${card.text}</span>
        </div>
    `).join('');

    renderWinList();
}

function showEncourage(text) {
    showToast(text, '💗', 2500);
}

function addWin() {
    const input = document.getElementById('win-input');
    const text = input.value.trim();
    if (!text) return;

    Storage.addSmallWin(text);
    input.value = '';
    renderEncouragePage();
}

function renderWinList() {
    const list = document.getElementById('win-list');
    const wins = Storage.getTodayWins();

    if (wins.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">✨</span>
                <p>今天还没有记录小胜利</p>
                <p class="empty-sub">哪怕是喝了一杯温水，也值得被看见</p>
            </div>
        `;
        return;
    }

    list.innerHTML = wins.map(win => `
        <div class="win-item">
            <span class="win-item-icon">✨</span>
            <span class="win-item-text">${win.text}</span>
            <span class="win-item-time">${formatTime(win.time)}</span>
        </div>
    `).join('');
}

// ========== 成长页功能 ==========
function renderGrowthData() {
    const data = Storage.getData();
    
    document.getElementById('growth-total-count').textContent = data.totalCount;
    
    // 更新hero区域的连续天数
    const heroStreak = document.getElementById('hero-streak');
    if (heroStreak) heroStreak.textContent = data.streakDays;
    
    // 更新四个统计卡片
    const winTotalEl = document.getElementById('growth-win-total');
    if (winTotalEl) {
        let totalWins = 0;
        if (data.wins) {
            Object.values(data.wins).forEach(dayWins => {
                totalWins += dayWins.length;
            });
        }
        winTotalEl.textContent = totalWins;
    }
    
    const practiceCountEl = document.getElementById('growth-practice-count');
    if (practiceCountEl) {
        practiceCountEl.textContent = data.practiceCount || 0;
    }
    
    const encourageCountEl = document.getElementById('growth-encourage-count');
    if (encourageCountEl) {
        encourageCountEl.textContent = (data.encourages && data.encourages.length) || 0;
    }

    renderTrendData(currentTrendFilter);
    renderWeeklyReport();
    renderAchievements(data);
    renderEmotionStats(data);
    renderHistoryList(data);

    const messageSection = document.getElementById('growth-message-section');
    if (data.records.length > 0) {
        messageSection.style.display = 'block';
        const messages = [
            '你正在慢慢了解自己',
            '每一次记录都是对自己的关注',
            '看见情绪，是改变的开始',
            '你比昨天更了解自己了'
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('growth-message-text').textContent = randomMsg;
    } else {
        messageSection.style.display = 'none';
    }
}

function onTrendFilterChange(filter) {
    currentTrendFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderTrendData(filter);
}

function renderTrendData(filter) {
    const data = Storage.getData();
    const records = data.records;
    const now = new Date();
    
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();
    const today = new Date(todayYear, todayMonth, todayDate);
    
    let days = 7;
    if (filter === 'month') days = 30;
    if (filter === 'all') days = Math.min(365, Math.max(7, data.totalCount));

    const dateArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
        dateArray.push({
            date: dateStr,
            day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
            count: 0,
            dominantEmotion: null
        });
    }

    records.forEach(record => {
        const recordDate = new Date(record.time);
        const recordDateStr = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()).toDateString();
        
        const dayData = dateArray.find(d => d.date === recordDateStr);
        if (dayData) {
            dayData.count++;
            if (!dayData.dominantEmotion) {
                dayData.dominantEmotion = record.emotion;
            }
        }
    });

    const maxCount = Math.max(...dateArray.map(d => d.count), 1);
    const trendData = dateArray.map(d => {
        const emotion = d.dominantEmotion ? Emotions[d.dominantEmotion] : null;
        return {
            date: d.date,
            day: d.day,
            count: d.count,
            height: (d.count / maxCount) * 80 + 20,
            emoji: emotion ? emotion.icon : '📝',
            color: emotion ? emotion.color : '#E0E0E0'
        };
    });

    const container = document.getElementById('trend-chart-container');
    container.innerHTML = trendData.map(item => `
        <div class="bar-item">
            <div class="bar-wrapper">
                <span class="bar-count" style="${item.count > 0 ? 'display:block' : 'display:none'}">${item.count}</span>
                <div class="bar" style="height: ${item.height}%; background: linear-gradient(180deg, ${item.color} 0%, ${item.color}CC 100%);"></div>
                <span class="bar-emoji-bottom">${item.emoji}</span>
            </div>
            <span class="bar-label">${item.day}</span>
        </div>
    `).join('');
}

function renderWeeklyReport() {
    const data = Storage.getData();
    const records = data.records;
    const reportEl = document.getElementById('weekly-report');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const weekRecords = records.filter(r => {
        const recordDate = new Date(r.time);
        return recordDate >= weekStart && recordDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    if (weekRecords.length === 0) {
        reportEl.style.display = 'none';
        return;
    }

    reportEl.style.display = 'block';

    const monthStart = weekStart.getMonth() + 1;
    const monthEnd = today.getMonth() + 1;
    const dateRange = `${monthStart}月${weekStart.getDate()}日 - ${monthEnd}月${today.getDate()}日`;
    document.getElementById('report-date').textContent = dateRange;
    document.getElementById('report-total').textContent = weekRecords.length;

    const todayWins = Storage.getTodayWins();
    document.getElementById('report-wins').textContent = todayWins.length;

    const streakChange = data.streakDays >= 7 ? 7 : data.streakDays;
    const streakEl = document.getElementById('report-streak');
    streakEl.textContent = '+' + streakChange;
    streakEl.classList.add('positive');

    const emotionCount = {};
    weekRecords.forEach(r => {
        if (r.emotion) {
            emotionCount[r.emotion] = (emotionCount[r.emotion] || 0) + 1;
        }
    });

    let topEmotion = null;
    let topCount = 0;
    Object.entries(emotionCount).forEach(([emotion, count]) => {
        if (count > topCount) {
            topCount = count;
            topEmotion = emotion;
        }
    });

    const insights = {
        anxiety: '本周焦虑情绪较多，试试多做一些呼吸练习',
        irritable: '本周有些烦躁，记得给自己留出放松的时间',
        sad: '本周有些难过，多给自己一些温柔和耐心',
        tired: '本周感觉疲惫，充足的休息很重要哦',
        calm: '本周状态不错，继续保持这份平静',
        happy: '本周心情很好，继续保持这份开心',
        stressed: '本周压力较大，记得劳逸结合',
        overwhelmed: '本周事情较多，一件一件慢慢来'
    };

    const insightText = topEmotion ? (insights[topEmotion] || '本周记录很棒，继续保持') : '本周记录很棒，继续保持';
    document.querySelector('#report-insight .insight-text').textContent = insightText;
}

function renderAchievements(data) {
    const storyContainer = document.getElementById('achievement-story');
    const listContainer = document.getElementById('achievement-list');
    const lockedContainer = document.getElementById('locked-achievements');
    if (!storyContainer || !listContainer) return;

    const achievements = Achievements.map(ach => ({
        ...ach,
        unlocked: ach.condition(data)
    }));

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    // 渲染已解锁的成就故事
    if (unlockedAchievements.length > 0) {
        storyContainer.innerHTML = unlockedAchievements.map(ach => `
            <div class="story-card">
                <div class="story-icon-wrapper">
                    <span class="story-icon">${ach.icon}</span>
                </div>
                <div class="story-content">
                    <span class="story-name">${ach.name}</span>
                    <span class="story-desc">${ach.desc}</span>
                    <span class="story-text">${ach.story || ach.desc}</span>
                </div>
            </div>
        `).join('');
    }

    // 渲染未解锁的成就
    if (lockedAchievements.length > 0) {
        lockedContainer.style.display = 'block';
        listContainer.innerHTML = lockedAchievements.slice(0, 4).map(ach => `
            <div class="achievement-item locked">
                <div class="achievement-icon-wrapper">
                    <span class="achievement-icon">${ach.icon}</span>
                </div>
                <span class="achievement-name">${ach.name}</span>
                <span class="achievement-status">${ach.desc}</span>
            </div>
        `).join('');
    } else {
        lockedContainer.style.display = 'none';
    }
}

function renderEmotionStats(data) {
    const container = document.getElementById('emotion-chart');
    if (!container) return;

    const emotionCounts = {};
    const mainEmotions = ['anxiety', 'irritable', 'sad', 'tired', 'calm', 'happy'];
    
    mainEmotions.forEach(key => {
        emotionCounts[key] = 0;
    });

    data.records.forEach(record => {
        if (emotionCounts.hasOwnProperty(record.emotion)) {
            emotionCounts[record.emotion]++;
        }
    });

    const maxCount = Math.max(...Object.values(emotionCounts), 1);

    container.innerHTML = mainEmotions.map(key => {
        const emotion = Emotions[key];
        const count = emotionCounts[key];
        const percentage = (count / maxCount) * 100;
        const colorClass = key + '-fill';
        
        return `
            <div class="chart-item">
                <span class="chart-label">${emotion.icon} ${emotion.name}</span>
                <div class="chart-bar">
                    <div class="chart-fill ${colorClass}" style="width: ${percentage}%;"></div>
                </div>
                <span class="chart-count">${count}</span>
            </div>
        `;
    }).join('');
}

function renderHistoryList(data) {
    const list = document.getElementById('history-list');
    const emptyEl = document.getElementById('growth-empty');

    if (data.records.length === 0) {
        list.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';

    const groups = {};
    data.records.forEach(record => {
        const date = new Date(record.time);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(record);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    list.innerHTML = sortedDates.slice(0, 10).map(dateKey => {
        const records = groups[dateKey];
        const date = new Date(dateKey);
        const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        return `
            <div class="history-group">
                <div class="group-header">
                    <span class="group-date">${dateLabel}</span>
                    <span class="group-count">${records.length}条</span>
                </div>
                <div class="group-records">
                    ${records.map(record => {
                        const emotion = Emotions[record.emotion];
                        const timeStr = formatTime(record.time);
                        const typeName = record.type === 'practice' ? '练习' : '记录';
                        const actionText = record.action || '';
                        
                        return `
                            <div class="record-item">
                                <span class="record-emoji">${emotion ? emotion.icon : '📝'}</span>
                                <div class="record-info">
                                    <text class="record-type">${typeName}${emotion ? ' · ' + emotion.name : ''}</text>
                                    <text class="record-time">${timeStr}</text>
                                </div>
                                <span class="record-badge" style="${actionText ? 'display:block' : 'display:none'}">${actionText}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ========== 签到页功能 ==========
function goToSignIn() {
    navigateTo('page-signin');
}

function renderSignInPage() {
    const data = Storage.getSignInData();
    const streakNumEl = document.getElementById('signin-streak-num');
    const titleEl = document.getElementById('signin-title');
    const descEl = document.getElementById('signin-desc');
    const buttonEl = document.getElementById('signin-button');

    streakNumEl.textContent = data.streakDays;

    if (data.todaySigned) {
        titleEl.textContent = '今日已签到';
        descEl.textContent = '明天继续加油哦～';
        buttonEl.textContent = '已签到';
        buttonEl.disabled = true;
        buttonEl.style.opacity = '0.6';
    } else {
        titleEl.textContent = '今日签到';
        descEl.textContent = '连续签到，看见坚持的力量';
        buttonEl.textContent = '立即签到';
        buttonEl.disabled = false;
        buttonEl.style.opacity = '1';
    }

    renderWeekCalendar();
}

function doSignIn() {
    const result = Storage.doSignIn();
    if (result.success) {
        alert('✅ 签到成功！\n\n连续签到 ' + result.streakDays + ' 天');
        renderSignInPage();
    } else {
        alert('今天已经签到过啦～');
    }
}

function renderWeekCalendar() {
    const container = document.getElementById('week-calendar');
    if (!container) return;

    const signInData = Storage.getSignInData();
    const now = new Date();
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isToday = i === 0;
        const isChecked = signInData.signDates.includes(dateStr);
        
        weekDays.push({
            dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
            date: date.getDate(),
            isToday,
            isChecked
        });
    }

    container.innerHTML = weekDays.map(day => `
        <div class="week-day ${day.isChecked ? 'checked' : ''} ${day.isToday ? 'today' : ''}">
            <span class="week-day-name">${day.dayName}</span>
            <span class="week-day-icon">${day.isChecked ? '✓' : '·'}</span>
            <span class="week-day-date">${day.date}</span>
        </div>
    `).join('');
}

// ========== 工具函数 ==========
function formatDuration(seconds) {
    if (seconds < 60) return seconds + '秒';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return minutes + '分钟';
    return minutes + '分' + secs + '秒';
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + ' 分钟前';
    if (hours < 24) return hours + ' 小时前';
    if (days < 7) return days + ' 天前';
    
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
}

// ========== 引导页功能 ==========
let currentSlide = 0;
const totalSlides = 3;

function showToast(text, icon = '✅', duration = 2000) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastText = document.getElementById('toast-text');
    
    if (!toast || !toastIcon || !toastText) return;
    
    toastIcon.textContent = icon;
    toastText.textContent = text;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
    } else {
        finishOnboarding();
    }
}

function updateSlide() {
    const slides = document.querySelectorAll('.slide-item');
    const dots = document.querySelectorAll('.dot');
    const btnText = document.getElementById('onboarding-btn-text');

    slides.forEach((slide, index) => {
        slide.classList.remove('active', 'prev');
        if (index < currentSlide) {
            slide.classList.add('prev');
        } else if (index === currentSlide) {
            slide.classList.add('active');
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });

    if (btnText) {
        btnText.textContent = currentSlide === totalSlides - 1 ? '开始体验' : '下一个';
    }
}

function finishOnboarding() {
    const onboardingPage = document.getElementById('onboarding-page');
    const homePage = document.getElementById('page-home');
    
    if (onboardingPage) {
        onboardingPage.style.opacity = '0';
        onboardingPage.style.transform = 'scale(1.05)';
        onboardingPage.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            onboardingPage.classList.remove('active');
            onboardingPage.style.display = 'none';
        }, 500);
    }

    if (homePage) {
        homePage.classList.add('active');
        currentTab = 'home';
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === 'home');
        });
    }

    try {
        localStorage.setItem('mood_landing_onboarded', 'true');
    } catch (e) {}

    Navigation.history = ['page-home'];
    Navigation.currentPage = 'page-home';
    updateTabBarVisibility('page-home');
    
    pageInit.home();
}

function checkOnboarding() {
    try {
        const onboarded = localStorage.getItem('mood_landing_onboarded');
        if (onboarded === 'true') {
            const onboardingPage = document.getElementById('onboarding-page');
            if (onboardingPage) {
                onboardingPage.classList.remove('active');
                onboardingPage.style.display = 'none';
            }
            const homePage = document.getElementById('page-home');
            if (homePage) {
                homePage.classList.add('active');
            }
            return true;
        }
    } catch (e) {}
    return false;
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    const onboarded = checkOnboarding();
    
    if (onboarded) {
        const data = Storage.getData();
        updateGreeting();
        loadHomeStats();
        renderEmergencyKit();
        renderHomeRecommendedActions();
        loadDailyQuote();
        loadWeatherData();
        initSettingsPage();
    }
    
    console.log('%c🌸 心情着陆点 Demo', 'font-size: 24px; font-weight: bold; color: #E57373;');
    console.log('%c先接住情绪，再补一点能量，慢慢看见自己正在变好', 'font-size: 14px; color: #9E8E84;');
});
