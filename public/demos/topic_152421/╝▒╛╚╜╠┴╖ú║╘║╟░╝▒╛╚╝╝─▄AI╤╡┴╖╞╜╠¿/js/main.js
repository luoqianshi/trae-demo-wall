/**
 * 急救教练 - 院前急救技能AI训练平台 核心逻辑模块
 * 版本: 1.0.0
 * 语法: ES5 (var)
 */

// ============================================================
// 第一部分：全局状态
// ============================================================

var currentPage = 'home';
var cprTimer = null;
var cprTimeUpdateTimer = null;
var cprIsRunning = false;
var cprCount = 0;
var cprStartTime = null;
var cprWaveformData = [];
var chatHistory = [];
var currentQuizLevel = 1;
var currentQuizIdx = 0;
var quizScore = 0;
var totalQuizScore = 0;
var audioCtx = null;
var cprBPM = 100;
var cprTargetBPM = 100;
var cprPressTimestamps = [];
var cprTotalTime = 0;
var heimlichCurrentStep = 0;
var heimlichCurrentScenario = 0;
var aedCurrentStep = 0;
var aedIsRunning = false;
var aedHeartRate = 0;
var aedShockable = false;
var chatStreaming = false;
var chatAbortController = null;
var apiConfig = {
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    model: ''
};
var appSettings = {
    cprBPM: 100,
    theme: 'light',
    soundEnabled: true,
    language: 'zh-CN',
    userName: '急救学员'
};

// 页面缓存
var pageCache = {};

// ============================================================
// ============================================================

/**
 * 海姆立克急救场景数据
 */
var heimlichScenariosData = [
    {
        id: 'adult-conscious',
        title: '成人意识清醒异物梗阻',
        icon: '&#x1F468;',
        difficulty: 1,
        description: '成年人突发异物卡喉，意识清醒，能用手势表示窒息',
        steps: [
            { title: '确认梗阻', content: '询问患者："你是不是噎住了？"如果患者能点头或用手势表示窒息，说明发生了严重气道梗阻。', tip: '不要让患者离开你的视线', key: true },
            { title: '拨打急救电话', content: '如果现场有其他人，请其拨打120急救电话。如果独自一人，先尝试急救5个周期后再拨打。', tip: '拨打120时说清地址和情况' },
            { title: '站位准备', content: '站在患者身后，双腿分开与肩同宽，一腿插在患者两腿之间以保持稳定。', tip: '确保站稳，防止患者瘫倒时一起摔倒' },
            { title: '握拳定位', content: '一手握拳，拳眼（拇指侧）朝内，放在患者肚脐上方两横指处（胸骨下方）。', tip: '拳眼朝内，不是拳背', key: true },
            { title: '腹部冲击', content: '另一手握住拳头，用力向内、向上快速冲击腹部。重复进行直到异物排出。', tip: '冲击方向是向内上方，不是向前方', key: true },
            { title: '连续冲击', content: '每次冲击应干脆有力，独立分开。连续进行5次腹部冲击。', tip: '冲击频率约每秒1次' },
            { title: '检查效果', content: '5次冲击后检查患者口腔，如看到异物可用手指取出。如果异物未排出，重复以上步骤。', tip: '只在看到异物时才用手指抠取' },
            { title: '持续救治', content: '持续重复冲击直到异物排出或患者失去意识。如果患者失去意识，转为心肺复苏流程。', tip: '不要放弃，直到专业救援到达' }
        ]
    },
    {
        id: 'adult-unconscious',
        title: '成人意识丧失异物梗阻',
        icon: '&#x1F468;&#x200D;&#x2695;&#xFE0F;',
        difficulty: 2,
        description: '异物梗阻导致成人失去意识',
        steps: [
            { title: '安全评估', content: '确认现场环境安全。轻轻拍打患者肩膀并大声呼唤，确认意识丧失。', tip: '注意周围环境是否安全' },
            { title: '呼救', content: '大声呼救，请周围人拨打120并取AED。', tip: '指定具体的人帮忙，不要只是喊叫' },
            { title: '开放气道', content: '采用仰头抬颏法开放气道。如果看到口腔内有异物，用手指小心取出。', tip: '不要盲目掏取可能看不到的异物', key: true },
            { title: '尝试人工呼吸', content: '尝试给予2次人工呼吸。如果第一次吹气胸廓没有起伏，重新调整头部位置再试一次。', tip: '吹气时要确保密封' },
            { title: '开始胸外按压', content: '如果人工呼吸无法使胸廓起伏，立即开始胸外按压。按压位置在胸骨下半部。', tip: '按压深度5-6cm，频率100-120次/分', key: true },
            { title: '按压与人工呼吸', content: '按照30:2的比例进行胸外按压和人工呼吸。每次开放气道检查异物。', tip: '30次按压后开放气道查看' },
            { title: '检查口腔', content: '每次开放气道时检查口腔，如果看到异物，用手指取出。', tip: '看到异物才取出，不要盲目掏' },
            { title: '持续CPR', content: '持续进行CPR直到：异物排出、专业救援到达、或你体力耗尽。', tip: '如AED到达，按照AED指示操作' }
        ]
    },
    {
        id: 'infant',
        title: '婴儿异物梗阻',
        icon: '&#x1F476;',
        difficulty: 3,
        description: '1岁以下婴儿发生异物卡喉',
        steps: [
            { title: '确认梗阻', content: '观察婴儿是否出现：无法哭泣、无法咳嗽、呼吸困难、面色发紫。', tip: '婴儿可能发出高调哮鸣音', key: true },
            { title: '托起婴儿', content: '一手托住婴儿下颌和面部，使婴儿头低脚高位。前臂放在大腿上作为支撑。', tip: '注意：婴儿的气道梗阻绝不能用腹部冲击法' },
            { title: '背部拍击', content: '用手掌根部在婴儿两肩胛骨之间用力拍击5次。拍击方向是向前下方。', tip: '拍击要有力度，但不能过重', key: true },
            { title: '胸部按压', content: '翻转婴儿，用两指在胸骨下半部（两乳头连线稍下方）按压5次。', tip: '按压深度约4cm', key: true },
            { title: '交替进行', content: '交替进行5次背部拍击和5次胸部按压，持续进行直到异物排出。', tip: '每次翻转婴儿都要注意保护头部' },
            { title: '检查口腔', content: '每次操作后检查婴儿口腔，如看到异物，用小指小心钩出。', tip: '不要试图用手指深入取看不到的异物' },
            { title: '失去意识后', content: '如果婴儿失去意识，开始婴儿CPR：30次按压+2次人工呼吸，每次吹气前检查口腔。', tip: '婴儿用两指按压，深度约4cm' },
            { title: '呼叫急救', content: '如果独自一人且婴儿意识丧失，先进行2分钟CPR后再拨打120。如果有其他人，立即呼叫。', tip: '婴儿窒息是非常紧急的情况' }
        ]
    },
    {
        id: 'self',
        title: '自救海姆立克法',
        icon: '&#x1F9CF;',
        difficulty: 1,
        description: '独自一人时发生异物梗阻的自救方法',
        steps: [
            { title: '确认梗阻', content: '意识到自己噎住了，不能说话，不能咳嗽，呼吸困难。', tip: '保持冷静，快速寻找帮助方式' },
            { title: '拨打急救', content: '立即拨打120。即使不能说话，也可以拨打后放置手机让接线员听到情况。', tip: '可以用指敲击手机屏幕拨号' },
            { title: '自我腹部冲击', content: '一手握拳，拳眼放在自己肚脐上方两横指处，另一手握住拳头，用力向内上方冲击。', tip: '要用力，冲击方向是向内上方', key: true },
            { title: '借助外物', content: '如果自我冲击效果不佳，可以借助椅背、桌角、栏杆等硬物边缘进行冲击。将肚脐上方部位压在硬物上，身体快速向下压。', tip: '选择腰部高度的固定物体', key: true },
            { title: '不要停止', content: '持续进行自我冲击或借助外物冲击，不要放弃。', tip: '保持镇定，冲击要有力' },
            { title: '寻找帮助', content: '尽可能引起旁人注意，可以用手势表示自己噎住了。走到门口打开门让邻居看到。', tip: '如果还能发出声音就大声呼救' }
        ]
    }
];

/**
 * AED训练步骤数据
 */
var aedStepsData = [
    {
        id: 'confirm-collapse',
        title: '确认心脏骤停',
        content: '拍打患者肩膀，大声呼唤："你怎么了！你还好吗？"观察患者有无反应。如无反应，检查呼吸。',
        instruction: '观察患者胸部是否有起伏，观察时间不超过10秒',
        key: true
    },
    {
        id: 'call-help',
        title: '呼救取AED',
        content: '大声呼救："救命！这里有人晕倒了！请帮忙拨打120，去取AED！"',
        instruction: '指定具体的人："穿红衣服的先生，请帮忙打120！"',
        key: true
    },
    {
        id: 'start-cpr',
        title: '立即开始CPR',
        content: '开始胸外按压，在AED到达前持续进行。按压位置胸骨下半部，深度5-6cm，频率100-120次/分。',
        instruction: '按照30:2的比例进行按压和人工呼吸',
        key: true
    },
    {
        id: 'turn-on-aed',
        title: '开启AED',
        content: 'AED到达后，打开AED箱，按下电源开关。AED会发出语音指导。',
        instruction: '听到AED开机声后按语音提示操作',
        key: true
    },
    {
        id: 'attach-pads',
        title: '贴电极片',
        content: '撕开电极片包装，按照电极片上的图示贴在患者裸露的胸部。一片贴在右上胸，一片贴在左下胸。',
        instruction: '擦干胸部水分，取下药物贴片。电极片不能重叠',
        key: true
    },
    {
        id: 'analyze',
        title: '分析心律',
        content: '按下"分析"按钮。AED会语音提示："正在分析心律，请不要触碰患者。"',
        instruction: '所有人离开患者，不要触碰患者直到分析完成',
        key: true
    },
    {
        id: 'shock-decision',
        title: '除颤决定',
        content: 'AED分析完成后会语音提示：如果建议除颤，AED会说"建议除颤，按下闪烁的按钮"。',
        instruction: '按下除颤按钮前确保所有人不接触患者',
        key: true
    },
    {
        id: 'deliver-shock',
        title: '实施除颤',
        content: '如果AED建议除颤，确认所有人离开患者后，按下除颤按钮。AED放电后，立即恢复CPR。',
        instruction: '放电瞬间患者身体可能抖动，这是正常的',
        key: true
    },
    {
        id: 'resume-cpr',
        title: '恢复CPR',
        content: '除颤后（或AED不建议除颤后），立即恢复胸外按压。不要暂停等待。继续按压2分钟。',
        instruction: '2分钟后AED会再次自动分析心律',
        key: true
    },
    {
        id: 'continue-care',
        title: '持续护理',
        content: '继续按照AED提示进行操作，直到：专业救援到达、患者恢复意识和正常呼吸、或你体力耗尽。',
        instruction: '持续循环：CPR 2分钟 -> AED分析 -> 除颤/继续CPR'
    }
];

/**
 * 场景闯关题库数据
 */
var quizLevelsDataConfig = [
    {
        id: 1,
        title: '基础急救常识',
        icon: '&#x1F4DA;',
        description: '掌握急救的基本原则和常见误区',
        questions: [
            {
                question: '发现有人倒地不起，你应该做的第一件事是什么？',
                options: ['立即拨打120', '确认现场环境安全', '直接开始CPR', '摇晃患者叫醒他'],
                answer: 1,
                explanation: '急救的首要原则是确保施救者自身安全，确认环境安全后才接近患者。'
            },
            {
                question: '拨打120时，以下哪项信息不需要优先告知？',
                options: ['患者所在的具体地址', '患者的症状和情况', '患者的年龄和血型', '联系电话'],
                answer: 2,
                explanation: '拨打120时最重要的是地址、病情和联系方式。血型信息不是紧急优先事项。'
            },
            {
                question: '以下哪种情况属于紧急医疗事件？',
                options: ['轻微擦伤', '大量出血无法止住', '普通感冒', '脚踝轻微扭伤'],
                answer: 1,
                explanation: '大量出血无法止住是紧急医疗事件，需要在数分钟内处理，否则可能危及生命。'
            },
            {
                question: '关于急救中的"黄金4分钟"，以下说法正确的是？',
                options: ['指心脏骤停后4分钟内开始CPR，存活率最高', '指伤口需要在4分钟内包扎', '指骨折需要在4分钟内固定', '指中毒需要在4分钟内催吐'],
                answer: 0,
                explanation: '心脏骤停后4分钟内开始心肺复苏，患者的存活率可达到50%以上。每延迟1分钟，存活率降低约10%。'
            },
            {
                question: '以下哪项不是心肺复苏的适应症？',
                options: ['心脏骤停', '呼吸停止', '正常心跳但有外伤出血', '无脉性电活动'],
                answer: 2,
                explanation: '外伤出血但有心跳和呼吸的患者，应优先止血，不需要进行心肺复苏。'
            }
        ]
    },
    {
        id: 2,
        title: '心肺复苏专项',
        icon: '&#x2764;&#xFE0F;',
        description: '深入学习CPR的技巧和要点',
        questions: [
            {
                question: '成人胸外按压的正确位置是？',
                options: ['胸骨正中上半部', '胸骨正中下半部（两乳头连线中点）', '左侧胸壁', '上腹部'],
                answer: 1,
                explanation: '按压位置应在胸骨下半部，约两乳头连线中点处。按压位置正确才能有效泵血。'
            },
            {
                question: '成人胸外按压的深度应为？',
                options: ['2-3cm', '3-4cm', '5-6cm', '8-10cm'],
                answer: 2,
                explanation: '成人胸外按压深度为5-6cm。过浅无法有效泵血，过深可能造成肋骨骨折和内脏损伤。'
            },
            {
                question: '成人CPR按压与人工呼吸的比例是？',
                options: ['15:1', '30:2', '10:2', '5:1'],
                answer: 1,
                explanation: '成人CPR按压与人工呼吸比例为30:2，即连续按压30次，然后给予2次人工呼吸。'
            },
            {
                question: '成人CPR的正确按压频率是？',
                options: ['60-80次/分', '80-100次/分', '100-120次/分', '120-150次/分'],
                answer: 2,
                explanation: '按压频率应为100-120次/分。频率过慢影响血液循环，过快则按压深度不足。'
            },
            {
                question: '进行人工呼吸时，每次吹气应持续约？',
                options: ['0.5秒', '1秒', '2秒', '3秒'],
                answer: 1,
                explanation: '每次吹气持续约1秒，能看到胸廓起伏即可。不要过度吹气，以免将气体吹入胃内。'
            }
        ]
    },
    {
        id: 3,
        title: '海姆立克与气道管理',
        icon: '&#x1F9F7;',
        description: '掌握异物梗阻的处理方法',
        questions: [
            {
                question: '海姆立克急救法的正确冲击方向是？',
                options: ['向正前方', '向内上方', '向内下方', '向外侧'],
                answer: 1,
                explanation: '海姆立克法的冲击方向应向内上方，利用膈肌下方的气流将异物推出。'
            },
            {
                question: '以下哪种人可以用海姆立克法救助？',
                options: ['1岁以下的婴儿', '意识清醒的成人', '肥胖孕妇', '以上都可以'],
                answer: 1,
                explanation: '标准海姆立克法适用于1岁以上意识清醒的患者。婴儿应使用拍背法和胸部按压法。'
            },
            {
                question: '婴儿气道梗阻应使用的方法是？',
                options: ['腹部冲击法', '背部拍击+胸部按压交替法', '倒立拍打法', '直接用手指抠取'],
                answer: 1,
                explanation: '婴儿气道梗阻使用5次背部拍击+5次胸部按压交替进行，不能用腹部冲击法。'
            },
            {
                question: '对意识丧失的气道梗阻患者，应首先？',
                options: ['直接做腹部冲击', '拨打120后开始CPR', '先尝试人工呼吸再做CPR', '用手指掏取异物'],
                answer: 2,
                explanation: '意识丧失的气道梗阻患者应先尝试人工呼吸，如果无法吹入，再开始CPR。每次开放气道时检查口腔。'
            },
            {
                question: '实施海姆立克法时拳头应放在什么位置？',
                options: ['胸骨正中', '肚脐处', '肚脐上方两横指', '肋骨下缘'],
                answer: 2,
                explanation: '拳眼（拇指侧）放在肚脐上方两横指处（剑突下方），这个位置是冲击膈肌的最佳点。'
            }
        ]
    },
    {
        id: 4,
        title: 'AED与综合急救',
        icon: '&#x26A1;',
        description: '综合运用急救技能处理真实场景',
        questions: [
            {
                question: '使用AED时，电极片应贴在哪里？',
                options: ['胸骨左缘和心尖部', '右上胸和左下胸', '左上胸和右下胸', '两肩之间和腹部'],
                answer: 1,
                explanation: '一片贴在右锁骨下方（右上胸），另一片贴在左侧腋中线下方（左下胸）。'
            },
            {
                question: 'AED分析心律时，应如何操作？',
                options: ['继续按压保持血液循环', '所有人离开患者不要触碰', '人工呼吸保持供氧', '摇晃患者看是否清醒'],
                answer: 1,
                explanation: 'AED分析心律时所有人必须离开患者，身体接触会干扰心律分析导致误判。'
            },
            {
                question: 'AED不建议除颤时应如何处理？',
                options: ['关闭AED等待', '立即继续CPR', '给患者喝水休息', '重复分析直到建议除颤'],
                answer: 1,
                explanation: 'AED不建议除颤说明心律不适合电除颤，应立即继续CPR，2分钟后AED会再次分析。'
            },
            {
                question: '烧伤后应如何进行紧急处理？',
                options: ['涂牙膏在伤口上', '立即用冷水冲洗至少10分钟', '涂酱油消毒', '用冰块直接冰敷'],
                answer: 1,
                explanation: '烧伤后应立即用流动冷水冲洗至少10-20分钟。不要涂抹牙膏、酱油等偏方。'
            },
            {
                question: '怀疑颈椎损伤时，如何开放气道？',
                options: ['正常仰头抬颏法', '双手推举下颌法（不仰头）', '不处理保持原样', '侧头开放气道'],
                answer: 1,
                explanation: '怀疑颈椎损伤时应用双手推举下颌法开放气道，不要做仰头动作以免加重脊髓损伤。'
            }
        ]
    }
];

/**
 * AI教练快捷建议
 */
var chatSuggestions = [
    { text: 'CPR怎么做？', prompt: '请详细讲解成人心肺复苏（CPR）的步骤和注意事项' },
    { text: '海姆立克步骤', prompt: '请详细讲解海姆立克急救法的步骤' },
    { text: 'AED使用', prompt: '请详细讲解AED自动体外除颤器使用方法' },
    { text: '急救包清单', prompt: '请列出家庭急救包应准备的物品清单' },
    { text: '拨打120注意什么', prompt: '拨打120急救电话时应该注意什么' }
];

/**
 * CPR训练参数
 */
var cprConfig = {
    minBPM: 100,
    maxBPM: 120,
    warningLowBPM: 80,
    warningHighBPM: 140,
    targetBPM: 110,
    waveformTimeWindow: 10,   // 波形显示最近10秒
    breathReminderCount: 30,  // 每30次提醒人工呼吸
    breatheDuration: 3000     // 呼吸提示持续3秒
};

// ============================================================
// 第三部分：工具函数
// ============================================================

/**
 * 格式化时间（秒 -> MM:SS）
 */
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (mins < 10) mins = '0' + mins;
    if (secs < 10) secs = '0' + secs;
    return mins + ':' + secs;
}

/**
 * 格式化日期字符串
 */
function formatDate(dateStr) {
    if (!dateStr) return '--';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hour = d.getHours();
    var min = d.getMinutes();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    if (hour < 10) hour = '0' + hour;
    if (min < 10) min = '0' + min;
    return year + '-' + month + '-' + day + ' ' + hour + ':' + min;
}

/**
 * 数字滚动动画
 */
function animateNumber(el, target, duration) {
    if (!el) return;
    var start = 0;
    var startTime = null;
    duration = duration || 1000;
    target = parseInt(target, 10) || 0;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        var current = Math.round(start + (target - start) * eased);
        el.textContent = current;
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target;
        }
    }
    requestAnimationFrame(step);
}

/**
 * 根据当前时间获取问候语
 */
function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
}

/**
 * 获取训练记录
 */
function getTrainingRecords() {
    try {
        var stored = localStorage.getItem('jc_records');
        if (stored) {
            trainingRecords = JSON.parse(stored);
        }
    } catch (e) {
        trainingRecords = [];
    }
    return trainingRecords;
}

/**
 * 保存训练记录
 */
function setTrainingRecords(records) {
    trainingRecords = records || [];
    try {
        localStorage.setItem('jjjl_trainingRecords', JSON.stringify(trainingRecords));
    } catch (e) {
        console.warn('保存训练记录失败:', e);
    }
}

/**
 * 添加一条训练记录
 */
function addTrainingRecord(record) {
    var records = getTrainingRecords();
    record.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    record.date = new Date().toISOString();
    records.unshift(record);
    if (records.length > 100) records = records.slice(0, 100);
    setTrainingRecords(records);
    return record;
}

/**
 * 获取闯关进度数据
 */
function getQuizProgress() {
    try {
        var stored = localStorage.getItem('jjjl_quizProgress');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        // ignore
    }
    return { levels: {} };
}

/**
 * 保存闯关进度
 */
function setQuizProgress(progress) {
    try {
        localStorage.setItem('jjjl_quizProgress', JSON.stringify(progress));
    } catch (e) {
        console.warn('保存闯关进度失败:', e);
    }
}

/**
 * 获取统计信息
 */
function getStats() {
    var records = getTrainingRecords();
    var stats = {
        totalSessions: records.length,
        totalDuration: 0,
        skills: 0,
        certificates: 0,
        cprSessions: 0,
        heimlichSessions: 0,
        aedSessions: 0,
        quizSessions: 0
    };

    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.duration) stats.totalDuration += r.duration;
        if (r.type === 'cpr') stats.cprSessions++;
        if (r.type === 'heimlich') stats.heimlichSessions++;
        if (r.type === 'aed') stats.aedSessions++;
        if (r.type === 'quiz') stats.quizSessions++;
    }

    var quizProgress = getQuizProgress();
    var skillSet = {};
    if (stats.cprSessions > 0) skillSet.cpr = true;
    if (stats.heimlichSessions > 0) skillSet.heimlich = true;
    if (stats.aedSessions > 0) skillSet.aed = true;
    if (quizProgress.levels) {
        for (var key in quizProgress.levels) {
            if (quizProgress.levels[key] && quizProgress.levels[key].stars > 0) {
                skillSet['quiz_' + key] = true;
            }
        }
    }
    stats.skills = Object.keys(skillSet).length;

    // 证书：完成所有闯关 = 1证书
    var allLevelsCompleted = true;
    for (var l = 1; l <= 4; l++) {
        if (!quizProgress.levels || !quizProgress.levels[l] || quizProgress.levels[l].stars === 0) {
            allLevelsCompleted = false;
            break;
        }
    }
    if (allLevelsCompleted) stats.certificates = 1;

    return stats;
}

/**
 * 关闭模态框
 */
function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('show');
}

// ============================================================
// 第四部分：页面切换系统
// ============================================================

/**
 * 切换页面
 */
function switchPage(pageId) {
    // 显示骨架屏
    var mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.classList.add('skeleton-loading');
    }

    var waveformCanvas = document.getElementById('homeWaveform');
    if (waveformCanvas && waveformCanvas._stopWaveform) {
        waveformCanvas._stopWaveform();
    }

    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
        var p = pages[i];
        if (p.id === 'page-' + pageId) {
            p.classList.add('active');
            p.classList.remove('hidden');
            p.classList.add('page-enter');
            setTimeout(function(el) {
                return function() { el.classList.remove('page-enter'); };
            }(p), 300);
        } else {
            p.classList.remove('active');
            p.classList.add('hidden');
        }
    }

    // 更新侧边栏激活状态
    var navItems = document.querySelectorAll('.nav-item');
    for (var j = 0; j < navItems.length; j++) {
        var item = navItems[j];
        var target = item.getAttribute('data-page');
        if (target === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    }

    currentPage = pageId;

    // 页面切换时取消正在进行的AI请求
    if (chatAbortController) {
        chatAbortController.abort();
        chatAbortController = null;
        chatStreaming = false;
    }

    // 页面切换时渲染
    if (pageId === 'home') renderHomePage();
    if (pageId === 'cpr') renderCPRPage();
    if (pageId === 'heimlich') renderHeimlichPage();
    if (pageId === 'aed') renderAEDPage();
    if (pageId === 'quiz') {
        if (pageCache['quiz']) {
            var qc = document.getElementById('quizContent');
            if (qc) qc.innerHTML = pageCache['quiz'];
        } else { renderQuizLevels(); }
    }
    if (pageId === 'coach') renderChatPage();
    if (pageId === 'progress') {
        if (pageCache['progress']) {
            var pc = document.getElementById('progressContent');
            if (pc) pc.innerHTML = pageCache['progress'];
        } else { renderProgressPage(); }
    }
    if (pageId === 'settings') renderSettingsPage();
    if (pageId === 'exam') {
        if (!examState.active) { renderExamWelcome(); }
        else { renderExamQuestion(); }
    }
    if (pageId === 'roleplay') {
        if (!roleplayState.active) { renderRoleplayWelcome(); }
        else { renderRoleplayPage(); }
    }
    if (pageId === 'leaderboard') {
        if (pageCache['leaderboard']) {
            var lc = document.getElementById('leaderboardContent');
            if (lc) lc.innerHTML = pageCache['leaderboard'];
        } else { renderLeaderboard(); }
    }
    if (pageId === 'special') { renderSpecialScenarios(); }
    if (pageId === 'knowledge') { renderKnowledgePage(); }
    if (pageId === 'firstaidkit') { renderFirstAidKitPage(); }
    if (pageId === 'personalinfo') { renderPersonalInfoPage(); }
    if (pageId === 'aedmap') { renderAEDMapPage(); }
    if (pageId === 'emergencycall') { renderEmergencyCallPage(); }
    if (pageId === 'achievements') { renderAchievementsPage(); }
    if (pageId === 'level') { renderLevelPage(); }
    if (pageId === 'dailychallenge') { renderDailyChallenge(); }

    // 移动端关闭侧边栏
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
    var overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.classList.add('hidden');

    // 滚动到顶部
    var mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.scrollTop = 0;

    // 为当前页面的卡片添加交错入场
    setTimeout(function() {
        var activePage = document.querySelector('.page.active');
        if (activePage) {
            animateStaggerIn(activePage, '.stat-card, .home-stat-card, .training-card, .home-module-card, .scenario-card, .level-card', 80);
        }
    }, 50);

    // 渲染完成后移除骨架屏
    setTimeout(function() {
        if (mainContent) mainContent.classList.remove('skeleton-loading');
    }, 200);
}

// ============================================================
// 第五部分：主题切换
// ============================================================

/**
 * 切换主题
 */
function toggleTheme() {
    var html = document.documentElement;
    var icon = document.getElementById('themeIcon');

    // 添加过渡类
    html.classList.add('theme-transition');

    var currentTheme = html.getAttribute('data-theme') || 'light';
    var newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    appSettings.theme = newTheme;

    if (icon) {
        icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    // 500ms后移除过渡类
    setTimeout(function() {
        html.classList.remove('theme-transition');
    }, 500);

    try {
        localStorage.setItem('jjjl_theme', newTheme);
    } catch (e) {
        // ignore
    }
    showToast('info', '已切换为' + (newTheme === 'dark' ? '深色' : '浅色') + '模式');
}

/**
 * 加载主题设置
 */
function loadTheme() {
    try {
        var saved = localStorage.getItem('jjjl_theme');
        if (saved) {
            var html = document.documentElement;
            html.classList.add('theme-transition');
            html.setAttribute('data-theme', saved);
            appSettings.theme = saved;
            setTimeout(function() {
                html.classList.remove('theme-transition');
            }, 500);
        }
    } catch (e) {
        // ignore
    }
}

// ============================================================
// 第六部分：Toast通知
// ============================================================

/**
 * 显示Toast通知
 */
function showToast(type, message, duration) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    type = type || 'info';
    message = message || '';
    duration = duration || 3000;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('toast-exit');
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

// ============================================================
// 第七部分：音频工具
// ============================================================

/**
 * 初始化AudioContext
 */
function initAudio() {
    if (!audioCtx) {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn('AudioContext初始化失败:', e);
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return !!audioCtx;
}

/**
 * 播放click声音（节拍器用）
 */
function playClick(freq, duration) {
    if (!appSettings.soundEnabled) return;
    if (!initAudio()) return;
    freq = freq || 800;
    duration = duration || 0.05;

    try {
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration + 0.01);
    } catch (e) {
        // ignore
    }
}

/**
 * 播放提示音
 */
function playBeep(freq, duration) {
    if (!appSettings.soundEnabled) return;
    if (!initAudio()) return;
    freq = freq || 440;
    duration = duration || 0.3;

    try {
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration + 0.01);
    } catch (e) {
        // ignore
    }
}

/**
 * 播放警告声
 */
function playAlertSound() {
    if (!appSettings.soundEnabled) return;
    if (!initAudio()) return;

    try {
        // 连续三个短促高频音
        for (var i = 0; i < 3; i++) {
            (function(idx) {
                setTimeout(function() {
                    var osc = audioCtx.createOscillator();
                    var gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    osc.type = 'square';
                    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.16);
                }, idx * 200);
            })(i);
        }
    } catch (e) {
        // ignore
    }
}

/**
 * 播放节拍器tick声
 */
function playMetronomeTick() {
    playClick(1000, 0.04);
}

// ============================================================
// 第八部分：CPR训练模块
// ============================================================

/**
 * 渲染CPR训练页面
 */
function renderCPRPage() {
    var container = document.getElementById('page-cpr');
    if (!container) return;

    // 渲染最近记录
    renderCPRRecentRecords(container);
}

/**
 * 渲染CPR最近记录
 */
function renderCPRRecentRecords(container) {
    var recordsEl = document.getElementById('cprHistoryList');
    if (!recordsEl) return;

    var recent = getRecentRecordsByType('cpr', 5);
    if (recent.length === 0) {
        recordsEl.innerHTML = '<p class="text-secondary">暂无训练记录</p>';
        return;
    }

    var html = '<div class="record-list">';
    for (var i = 0; i < recent.length; i++) {
        var r = recent[i];
        html += '<div class="record-item">' +
            '<div class="record-info">' +
                '<span class="record-type">CPR训练</span>' +
                '<span class="record-date">' + formatDate(r.date) + '</span>' +
            '</div>' +
            '<div class="record-stats">' +
                '<span>按压 ' + (r.count || 0) + '次</span>' +
                '<span>BPM ' + (r.avgBPM || 0) + '</span>' +
                '<span>准确度 ' + (r.accuracy || 0) + '%</span>' +
                '<span>时长 ' + formatTime(r.duration || 0) + '</span>' +
            '</div>' +
        '</div>';
    }
    html += '</div>';
    recordsEl.innerHTML = html;
}

/**
 * 开始CPR训练
 */
function startCPR() {
    try {
        if (cprIsRunning) return;
        cprIsRunning = true;
        initAudio();

        cprTargetBPM = appSettings.cprBPM || 100;
        if (!cprStartTime) {
            cprStartTime = Date.now();
        }

        var startBtn = document.getElementById('cprStartBtn');
        var stopBtn = document.getElementById('cprStopBtn');
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.innerHTML = '&#x23F8; 暂停';
        }

        // 节拍器间隔
        var interval = 60000 / cprTargetBPM;

        cprTimer = setInterval(function() {
            cprCount++;
            cprPressTimestamps.push(Date.now());
            cprWaveformData.push({
                time: Date.now(),
                count: cprCount,
                bpm: cprTargetBPM
            });

            // 播放节拍声
            playMetronomeTick();

            // pulse动画
            var pulse = document.getElementById('cprCircle');
            if (pulse) {
                pulse.classList.remove('pulse');
                void pulse.offsetWidth; // 触发reflow
                pulse.classList.add('pulse');
            }

            // 节拍条跳动
            updateBeatBar();

            // 每30次提醒人工呼吸
            if (cprCount % cprConfig.breathReminderCount === 0) {
                showBreathReminder();
                playBeep(660, 0.5);
            }

            updateCPRDisplay();
            drawCPRWaveform();
        }, interval);

        // 更新计时器
        if (!cprTimeUpdateTimer) {
            cprTimeUpdateTimer = setInterval(function() {
                if (cprStartTime) {
                    var elapsed = (Date.now() - cprStartTime) / 1000;
                    var el = document.getElementById('cprElapsedTime');
                    if (el) el.textContent = formatTime(elapsed);
                }
            }, 200);
        }

        showToast('success', 'CPR训练已开始，跟随节拍器按压！');

        // 添加按压交互监听
        initCPRPressInteraction();
    } catch(e) {
        console.error('CPR启动错误:', e);
        showToast('error', 'CPR训练启动失败，请刷新页面');
        cprIsRunning = false;
    }
}

/**
 * 停止CPR训练
 */
function stopCPR() {
    var startBtn = document.getElementById('cprStartBtn');
    var stopBtn = document.getElementById('cprStopBtn');

    if (cprTimer) {
        clearInterval(cprTimer);
        cprTimer = null;
    }
    if (cprTimeUpdateTimer) {
        clearInterval(cprTimeUpdateTimer);
        cprTimeUpdateTimer = null;
    }

    if (startBtn) { startBtn.disabled = false; startBtn.innerHTML = '<i class="fa-solid fa-play"></i> 继续训练'; }
    if (stopBtn) stopBtn.disabled = true;

    cprIsRunning = false;

    // 移除按压监听
    removeCPRPressInteraction();

    // 如果训练时间 > 5秒且按压次数 > 0，保存训练记录
    if (cprStartTime && cprCount > 0) {
        var elapsed = (Date.now() - cprStartTime) / 1000;
        if (elapsed > 5) {
            saveCPRRecord();
        }
    }

    showToast('info', 'CPR训练已暂停');
}

/**
 * 重置CPR训练
 */
function resetCPR() {
    stopCPR();

    cprCount = 0;
    cprStartTime = null;
    cprWaveformData = [];
    cprPressTimestamps = [];
    cprTotalTime = 0;

    // 重置显示
    var countEl = document.getElementById('cprPressCount');
    if (countEl) countEl.textContent = '0';

    var bpmEl = document.getElementById('cprBPM');
    if (bpmEl) bpmEl.innerHTML = '0 <small>BPM</small>';

    var timeEl = document.getElementById('cprElapsedTime');
    if (timeEl) timeEl.textContent = '00:00';

    var accEl = document.getElementById('cprAccuracyDisplay');
    if (accEl) accEl.textContent = '--%';

    var beatBar = document.getElementById('cprBeatBar');
    if (beatBar) beatBar.innerHTML = '';

    var breathEl = document.getElementById('cprBreathReminder');
    if (breathEl) breathEl.classList.add('hidden');

    // 清空波形
    var canvas = document.getElementById('cprWaveform');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    showToast('info', 'CPR训练已重置');
}

/**
 * 更新CPR显示
 */
function updateCPRDisplay() {
    var countEl = document.getElementById('cprPressCount');
    if (countEl) countEl.textContent = cprCount;

    var bpmEl = document.getElementById('cprBPM');
    if (bpmEl) {
        var actualBPM = calculateActualBPM();
        bpmEl.innerHTML = actualBPM + ' <small>BPM</small>';
    }

    var accEl = document.getElementById('cprAccuracyDisplay');
    if (accEl) {
        var acc = calculateCPRAccuracy();
        accEl.textContent = acc + '%';
        // 根据准确度设置颜色
        if (acc >= 90) {
            accEl.style.color = '#22c55e';
        } else if (acc >= 70) {
            accEl.style.color = '#eab308';
        } else {
            accEl.style.color = '#ef4444';
        }
    }
}

/**
 * 更新节拍条
 */
function updateBeatBar() {
    var beatBar = document.getElementById('cprBeatBar');
    if (!beatBar) return;

    var beat = document.createElement('div');
    beat.className = 'cpr-beat';
    beat.style.height = (40 + Math.random() * 60) + '%';
    beatBar.appendChild(beat);

    // 最多显示30个节拍条
    while (beatBar.children.length > 30) {
        beatBar.removeChild(beatBar.firstChild);
    }
}

/**
 * 显示人工呼吸提醒
 */
function showBreathReminder() {
    var el = document.getElementById('cprBreathReminder');
    if (!el) return;
    el.classList.remove('hidden');
    playBeep(523, 0.3);
    setTimeout(function() {
        playBeep(659, 0.3);
    }, 300);
    setTimeout(function() {
        el.classList.add('hidden');
    }, cprConfig.breatheDuration);
}

/**
 * 在canvas上绘制CPR按压波形
 */
function drawCPRWaveform() {
    var canvas = document.getElementById('cprWaveform');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var now = Date.now();
    var windowMs = cprConfig.waveformTimeWindow * 1000;

    ctx.clearRect(0, 0, w, h);

    // 绘制背景网格
    ctx.strokeStyle = 'rgba(128,128,128,0.15)';
    ctx.lineWidth = 0.5;
    // 水平线
    for (var gy = 0; gy <= h; gy += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
    }
    // 垂直线
    for (var gx = 0; gx <= w; gx += w / 10) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
    }

    // 目标频率线（每秒的脉冲数）
    var targetPulsesPerSec = cprTargetBPM / 60;
    ctx.strokeStyle = 'rgba(34,197,94,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (var ti = 1; ti <= cprConfig.waveformTimeWindow; ti++) {
        var tx = w - ((ti * 1000) / windowMs) * w;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, h);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // 绘制波形脉冲
    if (cprWaveformData.length === 0) return;

    // 只绘制时间窗口内的数据
    var startTime = now - windowMs;
    var visibleData = [];
    for (var i = 0; i < cprWaveformData.length; i++) {
        if (cprWaveformData[i].time >= startTime) {
            visibleData.push(cprWaveformData[i]);
        }
    }

    // 计算每个脉冲的BPM并确定颜色
    for (var j = 0; j < visibleData.length; j++) {
        var pd = visibleData[j];
        var x = w - ((now - pd.time) / windowMs) * w;
        var nextTime = j < visibleData.length - 1 ? visibleData[j + 1].time : pd.time + (60000 / cprTargetBPM);

        // 计算该脉冲间隔对应的BPM
        var interval;
        if (j > 0) {
            interval = pd.time - visibleData[j - 1].time;
        } else if (j < visibleData.length - 1) {
            interval = visibleData[j + 1].time - pd.time;
        } else {
            interval = 60000 / cprTargetBPM;
        }
        var pulseBPM = 60000 / interval;

        // 确定颜色
        var color;
        if (pulseBPM >= cprConfig.minBPM && pulseBPM <= cprConfig.maxBPM) {
            color = '#22c55e'; // 绿色 - 良好
        } else if (pulseBPM >= cprConfig.warningLowBPM && pulseBPM <= cprConfig.warningHighBPM) {
            color = '#eab308'; // 黄色 - 偏快/偏慢
        } else {
            color = '#ef4444'; // 红色 - 频率不对
        }

        // 绘制脉冲形状
        var pulseWidth = Math.max(8, w / (windowMs / 100));
        var pulseHeight = h * 0.7;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - pulseWidth / 2, h * 0.8);
        ctx.lineTo(x - pulseWidth / 4, h * 0.8 - pulseHeight);
        ctx.quadraticCurveTo(x, h * 0.8 - pulseHeight - 10, x + pulseWidth / 4, h * 0.8 - pulseHeight);
        ctx.lineTo(x + pulseWidth / 2, h * 0.8);
        ctx.closePath();
        ctx.fill();

        // 发光效果
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // 绘制底部基线
    ctx.strokeStyle = 'rgba(128,128,128,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.8);
    ctx.lineTo(w, h * 0.8);
    ctx.stroke();
}

/**
 * 计算实际BPM
 */
function calculateActualBPM() {
    var now = Date.now();
    // 取最近10秒的按压次数
    var windowMs = 10000;
    var recentPresses = 0;
    for (var i = cprPressTimestamps.length - 1; i >= 0; i--) {
        if (now - cprPressTimestamps[i] <= windowMs) {
            recentPresses++;
        } else {
            break;
        }
    }
    // 转换为每分钟
    return Math.round(recentPresses * (60000 / windowMs));
}

/**
 * 计算CPR按压频率准确度
 */
function calculateCPRAccuracy() {
    if (cprCount < 5) return 0;

    var now = Date.now();
    var windowMs = 10000;
    var totalDiff = 0;
    var count = 0;

    // 计算最近10秒内每次按压间隔与目标间隔的偏差
    var recent = [];
    for (var i = cprPressTimestamps.length - 1; i >= 0; i--) {
        if (now - cprPressTimestamps[i] <= windowMs) {
            recent.unshift(cprPressTimestamps[i]);
        } else {
            break;
        }
    }

    if (recent.length < 2) return 100;

    var targetInterval = 60000 / cprTargetBPM;
    for (var j = 1; j < recent.length; j++) {
        var interval = recent[j] - recent[j - 1];
        var diff = Math.abs(interval - targetInterval) / targetInterval;
        totalDiff += diff;
        count++;
    }

    if (count === 0) return 100;
    var avgDiff = totalDiff / count;
    var accuracy = Math.round(Math.max(0, Math.min(100, (1 - avgDiff) * 100)));
    return accuracy;
}

/**
 * 保存CPR训练记录
 */
function saveCPRRecord() {
    if (cprCount < 3) return;

    var duration = cprStartTime ? (Date.now() - cprStartTime) / 1000 : 0;
    var accuracy = calculateCPRAccuracy();
    var actualBPM = calculateActualBPM();

    var record = {
        type: 'cpr',
        count: cprCount,
        duration: Math.round(duration),
        targetBPM: cprTargetBPM,
        avgBPM: actualBPM,
        accuracy: accuracy,
        detail: '按压' + cprCount + '次, 平均BPM ' + actualBPM + ', 准确度' + accuracy + '%'
    };

    addTrainingRecord(record);
    showToast('success', '训练记录已保存！按压' + cprCount + '次，准确度' + accuracy + '%');
    return record;
}

// ============================================================
// 第九部分：海姆立克训练模块
// ============================================================

/**
 * 选择海姆立克场景
 */
function selectScenario(scenarioId) {
    heimlichCurrentScenario = scenarioId;
    heimlichCurrentStep = 0;
    renderScenarioSteps(scenarioId);
}

/**
 * 渲染海姆立克训练页面
 */
function renderHeimlichPage() {
    var container = document.getElementById('heimlichContent');
    if (!container) return;

    var html =
        '<div class="heimlich-container">' +
            '<div class="heimlich-header">' +
                '<h2>&#x1F9F7; 海姆立克急救法训练</h2>' +
                '<p class="heimlich-desc">学习针对不同人群的气道异物梗阻急救方法。选择一个场景开始训练。</p>' +
            '</div>' +

            '<div class="heimlich-scenario-grid" id="heimlichScenarioGrid"></div>' +

            '<div class="heimlich-step-container hidden" id="heimlichStepContainer"></div>' +
        '</div>';

    container.innerHTML = html;

    // 渲染场景选择网格
    renderScenarioGrid(container);
}

/**
 * 渲染场景选择网格
 */
function renderScenarioGrid(container) {
    var grid = container.querySelector('#heimlichScenarioGrid');
    if (!grid) return;

    var progress = getQuizProgress();
    var html = '';

    for (var i = 0; i < heimlichScenariosData.length; i++) {
        var s = heimlichScenariosData[i];
        var completed = progress.heimlich && progress.heimlich[s.id] ? true : false;
        var stars = completed ? 3 : 0;

        html += '<div class="scenario-card' + (completed ? ' completed' : '') + '" onclick="selectScenario(\'' + s.id + '\')">' +
            '<div class="scenario-icon">' + s.icon + '</div>' +
            '<h3>' + s.title + '</h3>' +
            '<p>' + s.description + '</p>' +
            '<div class="scenario-difficulty">' + getDifficultyLabel(s.difficulty) + '</div>' +
            (completed ? '<div class="scenario-badge">&#x2705; 已完成</div>' : '<div class="scenario-badge">开始训练</div>') +
        '</div>';
    }

    grid.innerHTML = html;
}

/**
 * 获取难度标签
 */
function getDifficultyLabel(level) {
    var labels = ['', '&#x2B50; 入门', '&#x2B50;&#x2B50; 进阶', '&#x2B50;&#x2B50;&#x2B50; 高级'];
    return labels[level] || '&#x2B50; 入门';
}

/**
 * 渲染场景步骤
 */
function renderScenarioSteps(scenarioId) {
    var scenario = null;
    for (var i = 0; i < heimlichScenariosData.length; i++) {
        if (heimlichScenariosData[i].id === scenarioId) {
            scenario = heimlichScenariosData[i];
            break;
        }
    }
    if (!scenario) return;

    var grid = document.getElementById('heimlichScenarioGrid');
    var stepContainer = document.getElementById('heimlichStepContainer');
    if (!grid || !stepContainer) return;

    grid.classList.add('hidden');
    stepContainer.classList.remove('hidden');

    var step = scenario.steps[heimlichCurrentStep];
    var totalSteps = scenario.steps.length;
    var progress = (heimlichCurrentStep + 1) / totalSteps * 100;

    var html =
        '<div class="step-header">' +
            '<button class="btn btn-outline btn-sm" onclick="backToHeimlichGrid()">&#x2190; 返回场景选择</button>' +
            '<h3>' + scenario.icon + ' ' + scenario.title + '</h3>' +
            '<div class="step-progress-bar"><div class="step-progress-fill" style="width:' + progress + '%"></div></div>' +
            '<span class="step-counter">步骤 ' + (heimlichCurrentStep + 1) + ' / ' + totalSteps + '</span>' +
        '</div>' +

        '<div class="step-card">' +
            '<h4 class="step-title' + (step.key ? ' key-step' : '') + '">' +
                (step.key ? '&#x1F511; ' : '') + step.title +
            '</h4>' +
            '<p class="step-content">' + step.content + '</p>' +
            (step.tip ? '<div class="step-tip">&#x1F4A1; 提示：' + step.tip + '</div>' : '') +
        '</div>';

    // 在人体操作步骤中添加SVG交互
    if (step.title && (step.title.indexOf('冲击') !== -1 || step.title.indexOf('拍击') !== -1)) {
        html +=
            '<div class="heimlich-body-container">' +
                '<svg class="heimlich-body-svg" viewBox="0 0 240 320">' +
                    '<ellipse cx="120" cy="100" rx="35" ry="25" class="body-fill"/>' +
                    '<ellipse cx="120" cy="180" rx="50" ry="70" class="body-fill"/>' +
                    '<ellipse cx="120" cy="100" rx="35" ry="25" class="body-outline"/>' +
                    '<ellipse cx="120" cy="180" rx="50" ry="70" class="body-outline"/>' +
                    '<rect x="85" y="30" width="70" height="50" rx="20" class="body-outline"/>' +
                    '<circle cx="120" cy="150" r="25" class="target-zone" data-zone="abdomen" onclick="onHeimlichBodyClick(this, \'abdomen\')"/>' +
                    '<text x="120" y="155" class="heimlich-body-label">点击腹部</text>' +
                '</svg>' +
                '<div class="heimlich-instruction-overlay" id="heimlichBodyHint">点击正确位置继续</div>' +
            '</div>';
    }

    html +=
        '<div class="step-navigation">' +
            '<button class="btn btn-outline" onclick="prevStep()"' + (heimlichCurrentStep === 0 ? ' disabled' : '') + '>&#x25C0; 上一步</button>' +
            '<button class="btn btn-primary" onclick="nextHeimlichStep()">' +
                (heimlichCurrentStep === totalSteps - 1 ? '&#x2705; 完成训练' : '下一步 &#x25B6;') +
            '</button>' +
        '</div>' +

        '<div class="step-dots">';
    for (var j = 0; j < totalSteps; j++) {
        html += '<span class="step-dot' + (j === heimlichCurrentStep ? ' active' : '') + (j < heimlichCurrentStep ? ' passed' : '') + '" onclick="goToHeimlichStep(' + j + ')"></span>';
    }
    html += '</div>';

    stepContainer.innerHTML = html;
}

/**
 * 下一步（海姆立克）
 */
function nextHeimlichStep() {
    try {
        var scenario = null;
        for (var i = 0; i < heimlichScenariosData.length; i++) {
            if (heimlichScenariosData[i].id === heimlichCurrentScenario) { scenario = heimlichScenariosData[i]; break; }
        }
        if (!scenario) return;

        if (heimlichCurrentStep < scenario.steps.length - 1) {
            heimlichCurrentStep++;
            renderScenarioSteps(heimlichCurrentScenario);
            playBeep(440, 0.1);
        } else {
            completeHeimlichScenario(heimlichCurrentScenario);
        }
    } catch(e) {
        console.error('海姆立克步骤错误:', e);
        showToast('error', '海姆立克操作出现问题，请刷新页面重试');
    }
}

/**
 * 海姆立克人体SVG点击验证
 */
function onHeimlichBodyClick(el, zone) {
    if (zone === 'abdomen') {
        el.classList.add('correct');
        var hint = document.getElementById('heimlichBodyHint');
        if (hint) hint.textContent = '正确！继续下一步';
        if (typeof playSuccessSound === 'function') playSuccessSound();
        setTimeout(function() {
            nextHeimlichStep();
        }, 800);
    } else {
        el.classList.add('wrong');
        if (typeof playErrorSound === 'function') playErrorSound();
        setTimeout(function() {
            el.classList.remove('wrong');
        }, 600);
    }
}

/**
 * 上一步（海姆立克）
 */
function prevStep() {
    if (heimlichCurrentStep > 0) {
        heimlichCurrentStep--;
        renderScenarioSteps(heimlichCurrentScenario);
        playBeep(330, 0.1);
    }
}

/**
 * 跳转到指定步骤
 */
function goToHeimlichStep(stepIdx) {
    var scenario = null;
    for (var i = 0; i < heimlichScenariosData.length; i++) {
        if (heimlichScenariosData[i].id === heimlichCurrentScenario) {
            scenario = heimlichScenariosData[i];
            break;
        }
    }
    if (!scenario) return;
    if (stepIdx >= 0 && stepIdx < scenario.steps.length) {
        heimlichCurrentStep = stepIdx;
        renderScenarioSteps(heimlichCurrentScenario);
    }
}

/**
 * 完成海姆立克场景
 */
function completeHeimlichScenario(scenarioId) {
    // 查找场景
    var scenario = null;
    for (var si = 0; si < heimlichScenariosData.length; si++) {
        if (heimlichScenariosData[si].id === scenarioId) { scenario = heimlichScenariosData[si]; break; }
    }
    // 保存完成记录
    var progress = getQuizProgress();
    if (!progress.heimlich) progress.heimlich = {};
    progress.heimlich[scenarioId] = {
        completed: true,
        date: new Date().toISOString(),
        steps: scenario ? scenario.steps.length : 0
    };
    setQuizProgress(progress);

    addTrainingRecord({
        type: 'heimlich',
        scenario: scenarioId,
        detail: '完成海姆立克场景: ' + scenarioId
    });

    showToast('success', '恭喜！已完成"' + getScenarioTitle(scenarioId) + '"训练！');

    // 显示完成界面
    var stepContainer = document.getElementById('heimlichStepContainer');
    if (stepContainer) {
        stepContainer.innerHTML =
            '<div class="completion-screen">' +
                '<div class="completion-icon">&#x1F389;</div>' +
                '<h2>训练完成！</h2>' +
                '<p>你已完成"' + getScenarioTitle(scenarioId) + '"的全部步骤。</p>' +
                '<div class="completion-actions">' +
                    '<button class="btn btn-primary" onclick="selectScenario(\'' + scenarioId + '\')">&#x21BA; 重新训练</button>' +
                    '<button class="btn btn-outline" onclick="backToHeimlichGrid()">&#x1F3E0; 返回场景列表</button>' +
                '</div>' +
            '</div>';
    }
    playBeep(523, 0.2);
    setTimeout(function() { playBeep(659, 0.2); }, 200);
    setTimeout(function() { playBeep(784, 0.3); }, 400);
}

/**
 * 获取场景标题
 */
function getScenarioTitle(scenarioId) {
    for (var i = 0; i < heimlichScenariosData.length; i++) {
        if (heimlichScenariosData[i].id === scenarioId) {
            return heimlichScenariosData[i].title;
        }
    }
    return scenarioId;
}

/**
 * 返回海姆立克场景选择
 */
function backToHeimlichGrid() {
    var grid = document.getElementById('heimlichScenarioGrid');
    var stepContainer = document.getElementById('heimlichStepContainer');
    if (grid) grid.classList.remove('hidden');
    if (stepContainer) {
        stepContainer.classList.add('hidden');
        stepContainer.innerHTML = '';
    }
}

// ============================================================
// 第十部分：AED训练模块
// ============================================================

/**
 * 渲染AED训练页面
 */
function renderAEDPage() {
    var container = document.getElementById('aedContent');
    if (!container) return;

    container.innerHTML =
        '<div class="aed-container">' +
            '<div class="aed-header">' +
                '<h2>&#x26A1; AED（自动体外除颤器）训练</h2>' +
                '<p class="aed-desc">学习AED的正确使用流程。模拟真实AED操作步骤，掌握除颤急救技能。</p>' +
            '</div>' +

            '<div class="aed-main-area">' +
                '<div class="aed-device" id="aedDevice">' +
                    '<div class="aed-body">' +
                        '<div class="aed-screen" id="aedScreen">' +
                            '<div class="aed-screen-text" id="aedScreenText">AED 就绪</div>' +
                            '<div class="aed-screen-sub" id="aedScreenSub">按下开始按钮</div>' +
                            '<div class="aed-heart-icon" id="aedHeartIcon">&#x2764;&#xFE0F;</div>' +
                        '</div>' +
                        '<div class="aed-controls-area">' +
                            '<button class="aed-btn aed-btn-power" id="aedPowerBtn" onclick="startAEDSimulation()">' +
                                '<span class="aed-btn-icon">&#x23FB;</span>' +
                                '<span class="aed-btn-label">电源</span>' +
                            '</button>' +
                            '<button class="aed-btn aed-btn-analyze hidden" id="aedAnalyzeBtn" onclick="aedAnalyze()">' +
                                '<span class="aed-btn-icon">&#x1F50D;</span>' +
                                '<span class="aed-btn-label">分析</span>' +
                            '</button>' +
                            '<button class="aed-btn aed-btn-shock hidden" id="aedShockBtn" onclick="aedShock()">' +
                                '<span class="aed-btn-icon">&#x26A1;</span>' +
                                '<span class="aed-btn-label">除颤</span>' +
                            '</button>' +
                        '</div>' +
                        '<div class="aed-led-strip" id="aedLedStrip">' +
                            '<div class="aed-led aed-led-green"></div>' +
                            '<div class="aed-led aed-led-yellow"></div>' +
                            '<div class="aed-led aed-led-red"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="aed-step-panel" id="aedStepPanel">' +
                    '<h3>操作步骤</h3>' +
                    '<div class="aed-step-list" id="aedStepList"></div>' +
                '</div>' +
            '</div>' +

            '<div class="aed-controls">' +
                '<button class="btn btn-primary btn-lg" id="aedStartBtn" onclick="startAEDSimulation()">&#x25B6; 开始模拟</button>' +
                '<button class="btn btn-outline btn-lg" onclick="prevAEDStep()" id="aedPrevBtn" disabled>&#x25C0; 上一步</button>' +
                '<button class="btn btn-primary btn-lg" onclick="nextAEDStep()" id="aedNextBtn" disabled>下一步 &#x25B6;</button>' +
                '<button class="btn btn-danger btn-lg" onclick="resetAED()" id="aedResetBtn" disabled>&#x21BA; 重置</button>' +
            '</div>' +

            '<div class="aed-tips">' +
                '<h4>&#x1F4A1; AED使用提示</h4>' +
                '<ul>' +
                    '<li>AED会通过语音提示引导你操作，按照提示进行即可</li>' +
                    '<li>分析心律时所有人不得触碰患者</li>' +
                    '<li>除颤前确保所有人离开患者</li>' +
                    '<li>除颤后立即恢复CPR，不要等待</li>' +
                    '<li>AED不适用于正在呼吸和有心跳的患者</li>' +
                    '<li>即使除颤成功，也要等120到来后再评估</li>' +
                '</ul>' +
            '</div>' +
        '</div>';

    renderAEDStepList();
}

/**
 * 渲染AED步骤列表
 */
function renderAEDStepList() {
    var list = document.getElementById('aedStepList');
    if (!list) return;

    var html = '';
    for (var i = 0; i < aedStepsData.length; i++) {
        var step = aedStepsData[i];
        var status = '';
        if (i < aedCurrentStep) status = ' completed';
        else if (i === aedCurrentStep) status = ' current';

        html += '<div class="aed-step-item' + status + '" onclick="jumpToAEDStep(' + i + ')">' +
            '<div class="aed-step-number">' + (i + 1) + '</div>' +
            '<div class="aed-step-title">' + step.title + '</div>' +
            (i === aedCurrentStep ? '<div class="aed-step-arrow">&#x25B6;</div>' : '') +
        '</div>';
    }
    list.innerHTML = html;
}

/**
 * 开始AED模拟
 */
function startAEDSimulation() {
    aedCurrentStep = 0;
    aedIsRunning = true;

    // 随机决定是否建议除颤（70%概率建议）
    aedShockable = Math.random() < 0.7;
    aedHeartRate = aedShockable ? Math.round(Math.random() * 50 + 150) : Math.round(Math.random() * 20 + 20);

    // 更新按钮状态
    var startBtn = document.getElementById('aedStartBtn');
    var nextBtn = document.getElementById('aedNextBtn');
    var prevBtn = document.getElementById('aedPrevBtn');
    var resetBtn = document.getElementById('aedResetBtn');
    if (startBtn) startBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = false;
    if (prevBtn) prevBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = false;

    // 更新AED设备屏幕
    updateAEDScreen('AED 已开机', '请按照步骤操作', false);
    updateAEDLEDs('green');

    initAudio();
    playBeep(440, 0.3);

    showToast('success', 'AED模拟已开始！按照步骤操作。');
    renderAEDStepDetail();
}

/**
 * 下一步（AED）
 */
function nextAEDStep() {
    try {
        if (!aedIsRunning) return;

        // 执行当前步骤的特殊逻辑
        executeAEDStepLogic(aedCurrentStep);

        if (aedCurrentStep < aedStepsData.length - 1) {
            aedCurrentStep++;
            var prevBtn = document.getElementById('aedPrevBtn');
            if (prevBtn) prevBtn.disabled = false;
        } else {
            completeAED();
            return;
        }

        renderAEDStepDetail();
        playBeep(440, 0.1);
    } catch(e) {
        console.error('AED步骤错误:', e);
        showToast('error', 'AED操作出现问题，请刷新页面重试');
    }
}

/**
 * 上一步（AED）
 */
function prevAEDStep() {
    if (aedCurrentStep > 0) {
        aedCurrentStep--;
        if (aedCurrentStep === 0) {
            var prevBtn = document.getElementById('aedPrevBtn');
            if (prevBtn) prevBtn.disabled = true;
        }
        renderAEDStepDetail();
    }
}

/**
 * 跳转到指定步骤
 */
function jumpToAEDStep(stepIdx) {
    if (stepIdx >= 0 && stepIdx <= aedCurrentStep && aedIsRunning) {
        aedCurrentStep = stepIdx;
        renderAEDStepDetail();
    }
}

/**
 * 执行AED步骤特殊逻辑
 */
function executeAEDStepLogic(stepIdx) {
    var step = aedStepsData[stepIdx];
    if (!step) return;

    // 分析心律步骤
    if (step.id === 'analyze') {
        aedAnalyze();
    }

    // 除颤决定步骤
    if (step.id === 'shock-decision') {
        if (aedShockable) {
            updateAEDScreen('建议除颤', '按下闪烁的除颤按钮', true);
            updateAEDLEDs('red');
            playAlertSound();
        } else {
            updateAEDScreen('不建议除颤', '继续CPR', false);
            updateAEDLEDs('yellow');
            playBeep(330, 0.5);
        }
    }

    // 实施除颤步骤
    if (step.id === 'deliver-shock') {
        if (aedShockable) {
            aedShock();
        }
    }
}

/**
 * 模拟心律分析
 */
function aedAnalyze() {
    var screen = document.getElementById('aedScreen');
    var screenText = document.getElementById('aedScreenText');
    var screenSub = document.getElementById('aedScreenSub');

    // 分析中状态
    if (screenText) screenText.textContent = '正在分析...';
    if (screenSub) screenSub.textContent = '请不要触碰患者';
    if (screen) screen.classList.add('aed-analyzing');

    updateAEDLEDs('yellow');

    // 模拟分析过程（3秒）
    setTimeout(function() {
        if (screen) screen.classList.remove('aed-analyzing');

        if (aedShockable) {
            if (screenText) screenText.textContent = '室颤 / 室速';
            if (screenSub) screenSub.textContent = '可除颤心律';
            updateAEDLEDs('red');
            playAlertSound();
        } else {
            if (screenText) screenText.textContent = '心电静止';
            if (screenSub) screenSub.textContent = '不可除颤';
            updateAEDLEDs('green');
            playBeep(330, 0.3);
        }
    }, 3000);

    // 显示语音提示
    showToast('warning', '正在分析心律，请不要触碰患者！', 4000);
    playBeep(523, 0.2);
    setTimeout(function() { playBeep(523, 0.2); }, 500);
    setTimeout(function() { playBeep(523, 0.2); }, 1000);
}

/**
 * 模拟除颤
 */
function aedShock() {
    // 除颤闪烁效果
    var device = document.getElementById('aedDevice');
    if (device) {
        device.classList.add('aed-shocking');
        setTimeout(function() {
            device.classList.remove('aed-shocking');
        }, 500);
    }

    updateAEDScreen('除颤完成', '立即恢复CPR', false);
    updateAEDLEDs('green');

    // 播放除颤音效
    playClick(200, 0.3);

    showToast('warning', '除颤完成！立即恢复心肺复苏！', 3000);
}

/**
 * 更新AED屏幕显示
 */
function updateAEDScreen(mainText, subText, flash) {
    var screenText = document.getElementById('aedScreenText');
    var screenSub = document.getElementById('aedScreenSub');
    if (screenText) screenText.textContent = mainText || '';
    if (screenSub) screenSub.textContent = subText || '';

    var screen = document.getElementById('aedScreen');
    if (screen) {
        if (flash) {
            screen.classList.add('aed-screen-flash');
            setTimeout(function() {
                screen.classList.remove('aed-screen-flash');
            }, 2000);
        } else {
            screen.classList.remove('aed-screen-flash');
        }
    }
}

/**
 * 更新AED LED指示灯
 */
function updateAEDLEDs(activeColor) {
    var leds = document.querySelectorAll('.aed-led');
    for (var i = 0; i < leds.length; i++) {
        leds[i].classList.remove('led-on');
    }
    var ledEl = document.querySelector('.aed-led-' + activeColor);
    if (ledEl) ledEl.classList.add('led-on');
}

/**
 * 渲染AED当前步骤详情
 */
function renderAEDStepDetail() {
    renderAEDStepList();

    var step = aedStepsData[aedCurrentStep];
    if (!step) return;

    // 贴电极片步骤使用拖拽交互
    if (step.title === '贴电极片') {
        renderAEDDragStep(aedCurrentStep);
        return;
    }

    var stepPanel = document.getElementById('aedStepPanel');
    if (stepPanel) {
        var detailHtml =
            '<h3>当前步骤</h3>' +
            '<div class="aed-current-step">' +
                '<h4 class="aed-step-title-detail' + (step.key ? ' key-step' : '') + '">' +
                    (step.key ? '&#x1F511; ' : '') + '步骤' + (aedCurrentStep + 1) + '：' + step.title +
                '</h4>' +
                '<p>' + step.content + '</p>' +
                '<div class="aed-step-instruction">&#x1F4A1; ' + step.instruction + '</div>' +
            '</div>';
        stepPanel.innerHTML = detailHtml;
    }

    // 更新按钮状态
    var nextBtn = document.getElementById('aedNextBtn');
    if (nextBtn) {
        nextBtn.innerHTML = aedCurrentStep === aedStepsData.length - 1 ? '&#x2705; 完成训练' : '下一步 &#x25B6;';
    }
}

/**
 * 完成AED训练
 */
function completeAED() {
    aedIsRunning = false;

    // 保存记录
    addTrainingRecord({
        type: 'aed',
        shockable: aedShockable,
        heartRate: aedHeartRate,
        detail: '完成AED模拟训练（' + (aedShockable ? '建议除颤' : '不建议除颤') + '）'
    });

    updateAEDScreen('训练完成', '操作结束', false);

    var aedNextBtn = document.getElementById('aedNextBtn');
    if (aedNextBtn) aedNextBtn.disabled = true;

    showToast('success', 'AED训练完成！');
    playBeep(523, 0.2);
    setTimeout(function() { playBeep(659, 0.2); }, 200);
    setTimeout(function() { playBeep(784, 0.3); }, 400);
}

/**
 * 重置AED
 */
function resetAED() {
    aedCurrentStep = 0;
    aedIsRunning = false;
    aedShockable = false;
    aedHeartRate = 0;

    updateAEDScreen('AED 就绪', '按下开始按钮', false);
    updateAEDLEDs('green');

    var startBtn = document.getElementById('aedStartBtn');
    var nextBtn = document.getElementById('aedNextBtn');
    var prevBtn = document.getElementById('aedPrevBtn');
    var resetBtn = document.getElementById('aedResetBtn');
    if (startBtn) startBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = true;
    if (prevBtn) prevBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = true;

    renderAEDStepList();
    showToast('info', 'AED模拟已重置');
}

// ============================================================
// 第十一部分：场景闯关模块
// ============================================================

/**
 * 渲染关卡选择
 */
function renderQuizLevels() {
    var container = document.getElementById('quizContent');
    if (!container) return;

    var progress = getQuizProgress();
    var html =
        '<div class="quiz-container">' +
            '<div class="quiz-header">' +
                '<h2>&#x1F3AF; 急救知识闯关</h2>' +
                '<p class="quiz-desc">测试你的急救知识掌握程度。完成前一关（60%以上）才能解锁下一关。</p>' +
            '</div>' +
            '<div class="quiz-levels-grid">';

    for (var i = 0; i < quizLevelsDataConfig.length; i++) {
        var level = quizLevelsDataConfig[i];
        var levelProgress = progress.levels && progress.levels[level.id] ? progress.levels[level.id] : null;
        var stars = levelProgress ? levelProgress.stars : 0;
        var bestScore = levelProgress ? levelProgress.bestScore : 0;
        var unlocked = true;

        // 第一关始终解锁，其余需要前一关>=60%
        if (i > 0) {
            var prevLevel = quizLevelsDataConfig[i - 1];
            var prevProgress = progress.levels && progress.levels[prevLevel.id] ? progress.levels[prevLevel.id] : null;
            if (!prevProgress || prevProgress.bestScore < 60) {
                unlocked = false;
            }
        }

        html += '<div class="quiz-level-card' + (unlocked ? '' : ' locked') + '" ' +
            (unlocked ? 'onclick="startQuizLevel(' + level.id + ')"' : '') + '>' +
            '<div class="quiz-level-icon">' + level.icon + '</div>' +
            '<h3>第' + level.id + '关：' + level.title + '</h3>' +
            '<p>' + level.description + '</p>' +
            '<div class="quiz-level-stars">' +
                getStarsHTML(stars) +
            '</div>' +
            (!unlocked ?
                '<div class="quiz-level-lock">&#x1F512; 完成上一关后解锁</div>' :
                (bestScore > 0 ?
                    '<div class="quiz-level-best">最高分：' + bestScore + '%</div>' :
                    '<div class="quiz-level-start">开始挑战</div>')
            ) +
        '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
    pageCache['quiz'] = html;
}

/**
 * 获取星星HTML
 */
function getStarsHTML(stars) {
    var html = '';
    for (var i = 0; i < 3; i++) {
        if (i < stars) {
            html += '&#x2B50;';
        } else {
            html += '&#x2606;';
        }
    }
    return html;
}

/**
 * 开始闯关
 */
function startQuizLevel(level) {
    currentQuizLevel = level;
    currentQuizIdx = 0;
    quizScore = 0;
    renderQuizQuestion(level, 0);
}

/**
 * 渲染题目
 */
function renderQuizQuestion(level, idx) {
    var container = document.getElementById('quizContent');
    if (!container) return;

    var levelData = null;
    for (var i = 0; i < quizLevelsDataConfig.length; i++) {
        if (quizLevelsDataConfig[i].id === level) {
            levelData = quizLevelsDataConfig[i];
            break;
        }
    }
    if (!levelData) return;

    var q = levelData.questions[idx];
    if (!q) return;

    var total = levelData.questions.length;
    var progress = ((idx) / total) * 100;

    // 场景信息（根据题目索引推断场景类型）
    var sceneTypes = [
        { icon: '&#x1F3C3;', name: '运动急救', color: 'rgba(229,57,53,0.08)' },
        { icon: '&#x1F3E0;', name: '家庭急救', color: 'rgba(30,136,229,0.08)' },
        { icon: '&#x1F697;', name: '交通事故', color: 'rgba(255,111,0,0.08)' },
        { icon: '&#x1F30A;', name: '户外急救', color: 'rgba(67,160,71,0.08)' }
    ];
    var sceneIdx = (idx || 0) % sceneTypes.length;
    var scene = sceneTypes[sceneIdx];

    var html =
        '<div class="quiz-play-container">' +
            '<div class="quiz-play-header">' +
                '<button class="btn btn-outline btn-sm" onclick="renderQuizLevels()">&#x2190; 返回关卡选择</button>' +
                '<h3>第' + level + '关：' + levelData.title + '</h3>' +
                '<div class="quiz-play-progress">' +
                    '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progress + '%"></div></div>' +
                    '<span>题目 ' + (idx + 1) + ' / ' + total + '</span>' +
                '</div>' +
            '</div>' +

            '<div class="quiz-scenario-card">' +
                '<div class="quiz-scene-header" style="background:' + scene.color + '">' +
                    '<div class="quiz-scene-icon">' + scene.icon + '</div>' +
                    '<div class="quiz-scene-info">' +
                        '<h4>' + scene.name + ' \u00B7 第 ' + (idx + 1) + ' 题</h4>' +
                        '<p>请在以下选项中选择最佳急救方案</p>' +
                    '</div>' +
                '</div>' +
                '<div class="quiz-scene-body">' +
                    '<div class="quiz-scene-question">' + q.question + '</div>' +
                    '<div class="quiz-options">';

    for (var j = 0; j < q.options.length; j++) {
        var labels = ['A', 'B', 'C', 'D'];
        html +=
            '<button class="quiz-option-card" onclick="selectAnswer(' + idx + ',' + j + ')" id="quizOpt' + j + '">' +
                '<span class="quiz-option-label">' + labels[j] + '</span>' +
                q.options[j] +
            '</button>';
    }

    html += '</div></div></div>' +
            '<div class="quiz-explanation hidden" id="quizExplanation"></div>' +
            '<div class="quiz-play-nav hidden" id="quizPlayNav">' +
                '<button class="btn btn-primary" id="quizNextBtn" onclick="nextQuestion()">' +
                    (idx === total - 1 ? '查看结果' : '下一题 &#x25B6;') +
                '</button>' +
            '</div>' +
        '</div>';

    container.innerHTML = html;
}

/**
 * 选择答案
 */
function selectAnswer(qIdx, optIdx) {
    try {
        var levelData = null;
        for (var i = 0; i < quizLevelsDataConfig.length; i++) {
            if (quizLevelsDataConfig[i].id === currentQuizLevel) {
                levelData = quizLevelsDataConfig[i];
                break;
            }
        }
        if (!levelData) return;

        var q = levelData.questions[qIdx];
        if (!q) return;

        // 禁止重复选择
        var optionEls = document.querySelectorAll('.quiz-option-card');
        for (var j = 0; j < optionEls.length; j++) {
            optionEls[j].style.pointerEvents = 'none';
        }

        // 标记选中、正确和错误答案
        var selectedEl = document.getElementById('quizOpt' + optIdx);
        if (selectedEl) selectedEl.classList.add('selected');

        for (var k = 0; k < q.options.length; k++) {
            var optEl = document.getElementById('quizOpt' + k);
            if (!optEl) continue;
            if (k === q.answer) {
                optEl.classList.add('correct');
            } else if (k === optIdx && optIdx !== q.answer) {
                optEl.classList.add('wrong');
            }
        }

        // 计算分数
        if (optIdx === q.answer) {
            quizScore++;
            playBeep(523, 0.15);
        } else {
            playBeep(220, 0.3);
        }

        // 显示解释
        var expEl = document.getElementById('quizExplanation');
        if (expEl) {
            expEl.classList.remove('hidden');
            expEl.innerHTML =
                '<div class="explanation-card ' + (optIdx === q.answer ? 'correct' : 'wrong') + '">' +
                    '<div class="explanation-result">' +
                        (optIdx === q.answer ? '&#x2705; 回答正确！' : '&#x274C; 回答错误') +
                    '</div>' +
                    '<p class="explanation-text">' + q.explanation + '</p>' +
                '</div>';
        }

        // 显示下一步按钮
        var navEl = document.getElementById('quizPlayNav');
        if (navEl) navEl.classList.remove('hidden');
    } catch(e) {
        console.error('选择答案错误:', e);
        showToast('error', '答题出现问题，请刷新页面重试');
    }
}

/**
 * 下一题
 */
function nextQuestion() {
    var levelData = null;
    for (var i = 0; i < quizLevelsDataConfig.length; i++) {
        if (quizLevelsDataConfig[i].id === currentQuizLevel) {
            levelData = quizLevelsDataConfig[i];
            break;
        }
    }
    if (!levelData) return;

    if (currentQuizIdx < levelData.questions.length - 1) {
        currentQuizIdx++;
        renderQuizQuestion(currentQuizLevel, currentQuizIdx);
    } else {
        var scorePercent = Math.round((quizScore / levelData.questions.length) * 100);
        completeQuizLevel(currentQuizLevel, scorePercent);
    }
}

/**
 * 完成闯关
 */
function completeQuizLevel(level, score) {
    var stars = 0;
    if (score >= 90) stars = 3;
    else if (score >= 70) stars = 2;
    else if (score >= 60) stars = 1;
    else stars = 0;

    var passed = score >= 60;

    // 保存进度
    var progress = getQuizProgress();
    if (!progress.levels) progress.levels = {};

    if (!progress.levels[level] || progress.levels[level].bestScore < score) {
        progress.levels[level] = {
            stars: stars,
            bestScore: score,
            date: new Date().toISOString()
        };
    }
    setQuizProgress(progress);

    // 保存训练记录
    addTrainingRecord({
        type: 'quiz',
        level: level,
        score: score,
        stars: stars,
        detail: '闯关第' + level + '关，得分' + score + '%，' + stars + '星'
    });

    renderQuizResult(level, score, stars, passed);
}

/**
 * 渲染闯关结果
 */
function renderQuizResult(level, score, stars, passed) {
    var container = document.getElementById('quizContent');
    if (!container) return;

    var levelData = null;
    for (var i = 0; i < quizLevelsDataConfig.length; i++) {
        if (quizLevelsDataConfig[i].id === level) {
            levelData = quizLevelsDataConfig[i];
            break;
        }
    }

    var starHTML = getStarsHTML(stars);
    var message = '';
    var messageIcon = '';

    if (stars === 3) {
        message = '完美通关！你已完全掌握本章内容！';
        messageIcon = '&#x1F3C6;';
    } else if (stars === 2) {
        message = '表现优秀！继续加油！';
        messageIcon = '&#x1F31F;';
    } else if (stars === 1) {
        message = '勉强通过，建议复习后再挑战一次。';
        messageIcon = '&#x1F4AA;';
    } else {
        message = '未能通过，建议复习相关知识后重新挑战。';
        messageIcon = '&#x1F4AA;';
    }

    var hasNextLevel = level < 4;
    var nextUnlocked = false;
    if (hasNextLevel && passed) {
        nextUnlocked = true;
    }

    container.innerHTML =
        '<div class="quiz-result-container">' +
            '<div class="quiz-result-card">' +
                '<div class="result-icon">' + messageIcon + '</div>' +
                '<h2>' + (passed ? '恭喜通过！' : '继续努力！') + '</h2>' +
                '<div class="result-stars">' + starHTML + '</div>' +
                '<div class="result-score">得分：<strong>' + score + '%</strong></div>' +
                '<p class="result-message">' + message + '</p>' +
                '<div class="result-details">' +
                    '<span>正确：' + quizScore + '题</span>' +
                    '<span>总分：' + (levelData ? levelData.questions.length : 0) + '题</span>' +
                '</div>' +
            '</div>' +
            '<div class="result-actions">' +
                (passed && hasNextLevel ?
                    '<button class="btn btn-primary btn-lg" onclick="startQuizLevel(' + (level + 1) + ')">进入下一关 &#x25B6;</button>' :
                    ''
                ) +
                '<button class="btn btn-outline btn-lg" onclick="startQuizLevel(' + level + ')">&#x21BA; 重新挑战</button>' +
                '<button class="btn btn-outline btn-lg" onclick="renderQuizLevels()">&#x1F3E0; 返回关卡选择</button>' +
            '</div>' +
        '</div>';

    if (passed) {
        playBeep(523, 0.2);
        setTimeout(function() { playBeep(659, 0.2); }, 200);
        setTimeout(function() { playBeep(784, 0.3); }, 400);
    }
}

/**
 * 重置闯关
 */
function resetQuiz() {
    currentQuizLevel = 1;
    currentQuizIdx = 0;
    quizScore = 0;
    renderQuizLevels();
}

// ============================================================
// 第十二部分：AI教练模块
// ============================================================

/**
 * 渲染AI教练页面
 */
function renderChatPage() {
    var container = document.getElementById('page-coach');
    if (!container) return;

    loadChatHistory();

    var messagesHTML = '';
    for (var i = 0; i < chatHistory.length; i++) {
        var msg = chatHistory[i];
        messagesHTML += createMessageHTML(msg.role, msg.content);
    }

    var suggestionsHTML = '';
    for (var j = 0; j < chatSuggestions.length; j++) {
        suggestionsHTML += '<button class="chat-suggestion-btn" onclick="useSuggestion(' + j + ')">' + chatSuggestions[j].text + '</button>';
    }

    var chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = messagesHTML +
            '<div class="chat-empty' + (chatHistory.length > 0 ? ' hidden' : '') + '" id="chatEmpty">' +
                '<div class="chat-empty-icon">&#x1F4AC;</div>' +
                '<p>你好！我是急救教练AI助手。</p>' +
                '<p>你可以向我询问任何急救相关的问题，我会尽力为你解答。</p>' +
            '</div>';
    }

    var chatSuggestionsEl = document.getElementById('chatSuggestions');
    if (chatSuggestionsEl) {
        chatSuggestionsEl.innerHTML = suggestionsHTML;
    }

    // 滚动到底部
    scrollChatToBottom();
}

/**
 * 创建消息HTML
 */
function createMessageHTML(role, content) {
    if (role === 'assistant') {
        return '<div class="chat-message chat-message-assistant">' +
            '<div class="chat-message-avatar">&#x1F9D1;&#x200D;&#x2695;&#xFE0F;</div>' +
            '<div class="chat-message-bubble">' + formatMarkdown(content) + '</div>' +
        '</div>';
    } else {
        return '<div class="chat-message chat-message-user">' +
            '<div class="chat-message-bubble">' + escapeHTML(content) + '</div>' +
        '</div>';
    }
}

/**
 * 简易Markdown格式化
 */
function formatMarkdown(text) {
    if (!text) return '';
    var html = escapeHTML(text);
    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 换行
    html = html.replace(/\n/g, '<br>');
    // 列表项
    html = html.replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    return html;
}

/**
 * HTML转义
 */
function escapeHTML(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

/**
 * 使用快捷建议
 */
function useSuggestion(idx) {
    if (idx >= 0 && idx < chatSuggestions.length) {
        var input = document.getElementById('chatInput');
        if (input) {
            input.value = chatSuggestions[idx].prompt;
            sendChatMessage();
        }
    }
}

/**
 * 处理聊天输入框键盘事件
 */
/**
 * 发送消息
 */
function sendChatMessage() {
    if (chatStreaming) return;

    // 取消之前的请求
    if (chatAbortController) {
        chatAbortController.abort();
        chatAbortController = null;
    }

    var input = document.getElementById('chatInput');
    if (!input) return;

    var message = input.value.trim();
    if (!message) return;

    input.value = '';

    // 隐藏空状态
    var emptyEl = document.getElementById('chatEmpty');
    if (emptyEl) emptyEl.classList.add('hidden');

    // 添加用户消息
    appendMessage('user', message);

    // 保存到历史
    chatHistory.push({ role: 'user', content: message });
    saveChatHistory();

    // 准备AI回复
    generateAIResponse(message);
}

/**
 * 生成AI回复
 */
function generateAIResponse(userMessage) {
    chatStreaming = true;

    // 创建AbortController用于取消请求
    if (typeof AbortController !== 'undefined') {
        chatAbortController = new AbortController();
    }

    var sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    // 构建系统消息
    var systemMessage = '你是一位专业的急救教练AI助手，名叫"急救教练"。你的职责是：' +
        '1. 回答急救相关问题，提供准确、实用的急救知识' +
        '2. 解释急救步骤和方法' +
        '3. 纠正常见的急救误区' +
        '4. 提供急救练习建议' +
        '请用简洁、专业但易懂的语言回答，必要时使用步骤列表。' +
        '始终提醒用户：在紧急情况下应拨打120并寻求专业帮助。';

    // 构建消息列表
    var messages = [{ role: 'system', content: systemMessage }];
    var maxHistory = 20;
    var startIdx = Math.max(0, chatHistory.length - maxHistory);
    for (var i = startIdx; i < chatHistory.length; i++) {
        messages.push({ role: chatHistory[i].role, content: chatHistory[i].content });
    }

    // 创建AI消息占位
    var aiMsgEl = appendMessage('assistant', '');
    var bubbleEl = aiMsgEl ? aiMsgEl.querySelector('.chat-message-bubble') : null;

    // 检查API配置
    if (!apiConfig.apiKey || !apiConfig.baseUrl) {
        chatStreaming = false;
        if (sendBtn) sendBtn.disabled = false;

        var fallbackResponse = generateFallbackResponse(userMessage);
        appendChunk(aiMsgEl, fallbackResponse);
        chatHistory.push({ role: 'assistant', content: fallbackResponse });
        saveChatHistory();
        return;
    }

    // 调用API
    var fullUrl = apiConfig.baseUrl;
    if (fullUrl.endsWith('/')) fullUrl = fullUrl.slice(0, -1);
    fullUrl += '/v1/chat/completions';

    var requestBody = {
        model: apiConfig.model || 'gpt-3.5-turbo',
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
    };

    fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiConfig.apiKey
        },
        body: JSON.stringify(requestBody),
        signal: chatAbortController ? chatAbortController.signal : undefined
    }).then(function(response) {
        if (!response.ok) {
            throw new Error('API请求失败: ' + response.status);
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var aiContent = '';

        function readStream() {
            reader.read().then(function(result) {
                if (result.done) {
                    finishStream(bubbleEl, aiContent);
                    return;
                }

                var chunk = decoder.decode(result.value, { stream: true });
                var lines = chunk.split('\n');

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (line.startsWith('data: ')) {
                        var data = line.slice(6);
                        if (data === '[DONE]') {
                            finishStream(bubbleEl, aiContent);
                            return;
                        }
                        try {
                            var parsed = JSON.parse(data);
                            var delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
                            if (delta && delta.content) {
                                aiContent += delta.content;
                                if (bubbleEl) {
                                    bubbleEl.innerHTML = formatMarkdown(aiContent);
                                }
                                scrollChatToBottom();
                            }
                        } catch (e) {
                            // 跳过无法解析的行
                        }
                    }
                }

                readStream();
            }).catch(function(err) {
                finishStream(bubbleEl, aiContent || '抱歉，处理回复时出现错误：' + err.message);
            });
        }

        readStream();
    }).catch(function(err) {
        chatStreaming = false;
        chatAbortController = null;
        if (sendBtn) sendBtn.disabled = false;

        // 如果是被abort的，不显示错误
        if (err.name === 'AbortError') return;

        var fallback = generateFallbackResponse(userMessage);
        if (bubbleEl) {
            bubbleEl.innerHTML = formatMarkdown(fallback);
        }
        chatHistory.push({ role: 'assistant', content: fallback });
        saveChatHistory();
    });
}

/**
 * 完成流式输出
 */
function finishStream(bubbleEl, content) {
    chatStreaming = false;
    var sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = false;

    chatHistory.push({ role: 'assistant', content: content });
    saveChatHistory();
    scrollChatToBottom();
}

/**
 * 添加消息气泡
 */
function appendMessage(role, content) {
    var messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return null;

    var msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message chat-message-' + role;

    if (role === 'assistant') {
        msgDiv.innerHTML =
            '<div class="chat-message-avatar">&#x1F9D1;&#x200D;&#x2695;&#xFE0F;</div>' +
            '<div class="chat-message-bubble">' + (content ? formatMarkdown(content) : '') + '</div>';
    } else {
        msgDiv.innerHTML =
            '<div class="chat-message-bubble">' + escapeHTML(content) + '</div>';
    }

    messagesEl.appendChild(msgDiv);
    scrollChatToBottom();
    return msgDiv;
}

/**
 * 添加AI消息并应用打字机效果
 */
function appendAIMessageWithTyping(content, speed) {
    var messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return null;

    var msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message chat-message-assistant';
    msgDiv.innerHTML =
        '<div class="chat-message-avatar">&#x1F9D1;&#x200D;&#x2695;&#xFE0F;</div>' +
        '<div class="chat-message-bubble"></div>';
    messagesEl.appendChild(msgDiv);
    scrollChatToBottom();

    var bubbleEl = msgDiv.querySelector('.chat-message-bubble');
    if (bubbleEl && content) {
        typewriterEffect(bubbleEl, content, speed || 15, function() {
            scrollChatToBottom();
        });
    }
    return msgDiv;
}

/**
 * 追加流式文本（非流式模式用）
 */
function appendChunk(msgEl, text) {
    if (!msgEl) return;
    var bubble = msgEl.querySelector('.chat-message-bubble');
    if (bubble) {
        bubble.innerHTML = formatMarkdown(text);
    }
}

/**
 * 获取快捷建议按钮
 */
function getChatSuggestions() {
    return chatSuggestions;
}

/**
 * 清空对话历史
 */
function clearChatHistory() {
    chatHistory = [];
    saveChatHistory();
    renderChatPage();
    showToast('info', '对话已清空');
}

/**
 * 加载对话历史
 */
function loadChatHistory() {
    try {
        var stored = localStorage.getItem('jjjl_chatHistory');
        if (stored) {
            chatHistory = JSON.parse(stored);
        }
    } catch (e) {
        chatHistory = [];
    }
}

/**
 * 保存对话历史
 */
function saveChatHistory() {
    try {
        localStorage.setItem('jjjl_chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.warn('保存对话历史失败:', e);
    }
}

/**
 * 滚动聊天到底部
 */
function scrollChatToBottom() {
    var messagesEl = document.getElementById('chatMessages');
    if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

/**
 * 生成后备回复（无API时）
 */
function generateFallbackResponse(userMessage) {
    var msg = userMessage.toLowerCase();
    var response = '';

    if (msg.indexOf('cpr') >= 0 || msg.indexOf('心肺复苏') >= 0 || msg.indexOf('胸外按压') >= 0) {
        response = '**心肺复苏（CPR）步骤：**\n\n' +
            '1. 确认安全：确认现场环境安全\n' +
            '2. 判断意识：拍打肩膀，大声呼唤\n' +
            '3. 呼救：请人拨打120，取AED\n' +
            '4. 检查呼吸：观察胸廓起伏（不超过10秒）\n' +
            '5. 胸外按压：位置在胸骨下半部，深度5-6cm，频率100-120次/分\n' +
            '6. 人工呼吸：30次按压后给2次人工呼吸\n' +
            '7. 持续进行：直到专业救援到达或患者恢复\n\n' +
            '*重要提醒：按压后要让胸廓完全回弹，尽量减少中断。*\n\n' +
            '你可以进入"CPR训练"模块进行实际练习！';
    } else if (msg.indexOf('海姆立克') >= 0 || msg.indexOf('异物') >= 0 || msg.indexOf('卡喉') >= 0 || msg.indexOf('噎') >= 0) {
        response = '**海姆立克急救法步骤（成人意识清醒）：**\n\n' +
            '1. 站在患者身后，一腿插在患者两腿间\n' +
            '2. 一手握拳，拳眼放在肚脐上方两横指处\n' +
            '3. 另一手握住拳头\n' +
            '4. 用力向内上方快速冲击\n' +
            '5. 重复直到异物排出\n\n' +
            '*注意：婴儿不能用腹部冲击法，应使用拍背+胸部按压法。*\n\n' +
            '你可以进入"海姆立克训练"模块学习不同场景的处理方法！';
    } else if (msg.indexOf('aed') >= 0 || msg.indexOf('除颤') >= 0 || msg.indexOf('除颤器') >= 0) {
        response = '**AED使用步骤：**\n\n' +
            '1. 开启AED电源\n' +
            '2. 按照语音提示操作\n' +
            '3. 贴电极片：一片右上胸，一片左下胸\n' +
            '4. 分析心律：所有人离开患者\n' +
            '5. 如建议除颤：确认无人接触后按下按钮\n' +
            '6. 除颤后立即恢复CPR\n\n' +
            '*AED是傻瓜式设备，会语音引导操作，不要害怕使用。*\n\n' +
            '你可以进入"AED训练"模块进行模拟练习！';
    } else if (msg.indexOf('急救包') >= 0 || msg.indexOf('急救箱') >= 0 || msg.indexOf('物品') >= 0) {
        response = '**家庭急救包物品清单：**\n\n' +
            '- 绷带（纱布、弹性绷带）\n' +
            '- 创可贴（多种尺寸）\n' +
            '- 碘伏消毒液\n' +
            '- 医用棉签和棉球\n' +
            '- 剪刀和镊子\n' +
            '- 一次性手套\n' +
            '- 体温计\n' +
            '- 止血带\n' +
            '- 冰袋/热敷袋\n' +
            '- 口罩\n' +
            '- 急救手册\n' +
            '- 常用药品（感冒药、止痛药、肠胃药等）\n\n' +
            '*建议每半年检查一次，及时更换过期物品。*';
    } else if (msg.indexOf('120') >= 0 || msg.indexOf('急救电话') >= 0 || msg.indexOf('拨打') >= 0) {
        response = '**拨打120急救电话要点：**\n\n' +
            '1. 保持冷静，说话清晰\n' +
            '2. 告知准确地址（省市、区县、街道、门牌号）\n' +
            '3. 说明患者情况（症状、年龄、性别）\n' +
            '4. 告知已做的急救措施\n' +
            '5. 留下联系电话\n' +
            '6. 不要先挂电话，等接线员让你挂再挂\n\n' +
            '*如果现场只有你一个人，先用免提拨打120，同时开始急救。*';
    } else if (msg.indexOf('烧伤') >= 0 || msg.indexOf('烫伤') >= 0 || msg.indexOf('烫') >= 0) {
        response = '**烧伤/烫伤急救：**\n\n' +
            '1. 冲：立即用流动冷水冲洗10-20分钟\n' +
            '2. 脱：在水中小心脱去衣物\n' +
            '3. 泡：继续冷水浸泡10-30分钟\n' +
            '4. 盖：用干净纱布或毛巾覆盖伤口\n' +
            '5. 送：送医院治疗\n\n' +
            '*禁忌：不要涂牙膏、酱油等偏方！不要挑破水泡！不要直接用冰敷！*';
    } else if (msg.indexOf('出血') >= 0 || msg.indexOf('流血') >= 0 || msg.indexOf('止血') >= 0) {
        response = '**出血急救方法：**\n\n' +
            '**小量出血：**\n' +
            '1. 清洗伤口\n' +
            '2. 用纱布按压止血\n' +
            '3. 包扎固定\n\n' +
            '**大量出血：**\n' +
            '1. 立即拨打120\n' +
            '2. 用干净布料直接按压伤口\n' +
            '3. 如果是四肢出血，抬高伤肢\n' +
            '4. 压迫止血15分钟不要松手\n' +
            '5. 如仍出血，加压包扎\n\n' +
            '*注意：不要频繁掀开纱布查看！*';
    } else {
        response = '感谢你的提问！作为急救教练AI助手，我可以帮助你：\n\n' +
            '- **CPR心肺复苏**的操作步骤和技巧\n' +
            '- **海姆立克急救法**的各种场景应用\n' +
            '- **AED自动体外除颤器**的使用方法\n' +
            '- **家庭急救包**的物品准备\n' +
            '- **急救电话拨打**的注意事项\n' +
            '- **常见意外伤害**（烧伤、出血、骨折等）的处理\n\n' +
            '请告诉我你具体想了解哪方面的内容，我会为你详细解答。\n\n' +
            '*在紧急情况下，请立即拨打120！*';
    }

    return response;
}

/**
 * 获取最近指定类型的训练记录
 */
function getRecentRecordsByType(type, limit) {
    var records = getTrainingRecords();
    var filtered = [];
    limit = limit || 5;

    for (var i = 0; i < records.length && filtered.length < limit; i++) {
        if (records[i].type === type) {
            filtered.push(records[i]);
        }
    }
    return filtered;
}

// ============================================================
// 第十三部分：学习进度页
// ============================================================

/**
 * 渲染学习进度页
 */
function renderProgressPage() {
    var container = document.getElementById('progressContent');
    if (!container) return;

    var stats = getStats();
    var quizProgress = getQuizProgress();

    var html =
        '<div class="progress-container">' +
            '<div class="progress-header">' +
                '<h2>&#x1F4CA; 学习进度</h2>' +
                '<p>查看你的急救技能学习进度和成就。</p>' +
            '</div>' +

            '<div class="progress-overview">' +
                '<div class="progress-ring-card">' +
                    '<canvas id="progressRingCanvas" width="200" height="200"></canvas>' +
                    '<div class="progress-ring-text">' +
                        '<span class="progress-ring-percent" id="progressOverallPercent">0</span>' +
                        '<span class="progress-ring-label">总体进度</span>' +
                    '</div>' +
                '</div>' +

                '<div class="progress-stats-grid">' +
                    '<div class="progress-stat-item">' +
                        '<div class="progress-stat-icon">&#x1F4C5;</div>' +
                        '<div class="progress-stat-value">' + stats.totalSessions + '</div>' +
                        '<div class="progress-stat-label">训练总次数</div>' +
                    '</div>' +
                    '<div class="progress-stat-item">' +
                        '<div class="progress-stat-icon">&#x23F1;</div>' +
                        '<div class="progress-stat-value">' + formatTime(stats.totalDuration) + '</div>' +
                        '<div class="progress-stat-label">总练习时长</div>' +
                    '</div>' +
                    '<div class="progress-stat-item">' +
                        '<div class="progress-stat-icon">&#x1F6E0;</div>' +
                        '<div class="progress-stat-value">' + stats.skills + '/7</div>' +
                        '<div class="progress-stat-label">已掌握技能</div>' +
                    '</div>' +
                    '<div class="progress-stat-item">' +
                        '<div class="progress-stat-icon">&#x1F4DC;</div>' +
                        '<div class="progress-stat-value">' + stats.certificates + '</div>' +
                        '<div class="progress-stat-label">获得证书</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="progress-skills">' +
                '<h3>&#x1F3AF; 技能掌握情况</h3>' +
                '<div class="skills-list" id="skillsList"></div>' +
            '</div>' +

            '<div class="progress-quiz-levels">' +
                '<h3>&#x1F4DA; 闯关进度</h3>' +
                '<div class="quiz-progress-list" id="quizProgressList"></div>' +
            '</div>' +

            '<div class="progress-certificate-section">' +
                '<h3>&#x1F4DC; 证书</h3>' +
                '<div class="certificate-area" id="certificateArea"></div>' +
            '</div>' +

            '<div class="progress-chart-section">' +
                '<h3><i class="fa-solid fa-chart-line"></i> 近7天训练趋势</h3>' +
                '<canvas id="trendChart" class="progress-chart-canvas" width="600" height="200"></canvas>' +
            '</div>' +
            '<div class="progress-chart-section">' +
                '<h3><i class="fa-solid fa-bullseye"></i> 技能掌握度</h3>' +
                '<canvas id="radarChart" class="progress-radar-canvas" width="300" height="240"></canvas>' +
            '</div>' +
        '</div>';

    container.innerHTML = html;
    pageCache['progress'] = html;

    // 渲染技能列表
    renderSkillTree();

    // 渲染闯关进度
    renderQuizProgressList();

    // 渲染证书
    renderCertificateArea();

    // 绘制总体进度环
    var overallPercent = calculateOverallProgress();
    setTimeout(function() {
        renderProgressRing('progressRingCanvas', overallPercent, '#22c55e');
        var el = document.getElementById('progressOverallPercent');
        if (el) animateNumber(el, overallPercent, 1200);
    }, 300);

    // 绘制趋势图和雷达图
    setTimeout(function() {
        drawTrendChart();
        drawRadarChart();
    }, 100);
}

/**
 * 计算总体进度
 */
function calculateOverallProgress() {
    var stats = getStats();
    var quizProgress = getQuizProgress();
    var total = 0;
    var achieved = 0;

    // 训练总次数（目标：10次）
    total++;
    achieved += Math.min(1, stats.totalSessions / 10);

    // 总时长（目标：30分钟）
    total++;
    achieved += Math.min(1, stats.totalDuration / 1800);

    // CPR技能
    total++;
    if (stats.cprSessions > 0) achieved += 1;

    // 海姆立克技能
    total++;
    if (stats.heimlichSessions > 0) achieved += 1;

    // AED技能
    total++;
    if (stats.aedSessions > 0) achieved += 1;

    // 闯关（4关，每关最多3星）
    total++;
    var quizStars = 0;
    for (var l = 1; l <= 4; l++) {
        if (quizProgress.levels && quizProgress.levels[l]) {
            quizStars += quizProgress.levels[l].stars;
        }
    }
    achieved += Math.min(1, quizStars / 12);

    // 证书
    total++;
    if (stats.certificates > 0) achieved += 1;

    return Math.round((achieved / total) * 100);
}

/**
 * 渲染进度环（Canvas绘制）
 */
function renderProgressRing(canvasId, percent, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.max(1, Math.min(w, h) / 2 - 20);
    var lineWidth = 12;
    var startAngle = -Math.PI / 2;
    var endAngle = startAngle + (2 * Math.PI * percent / 100);

    ctx.clearRect(0, 0, w, h);

    // 背景环
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(128,128,128,0.15)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 进度环
    if (percent > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = color || '#22c55e';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

/**
 * 绘制训练趋势图
 */
function drawTrendChart() {
    var canvas = document.getElementById('trendChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth || 600;
    var h = canvas.height = 200;

    // 模拟7天数据（从训练记录中提取或生成）
    var data = [];
    var records = getTrainingRecords ? getTrainingRecords() : [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var count = 0;
        for (var j = 0; j < records.length; j++) {
            var rd = new Date(records[j].date);
            if (rd.toDateString() === d.toDateString()) count++;
        }
        data.push(count || Math.floor(Math.random() * 3));
    }

    var max = Math.max.apply(null, data);
    if (max < 1) max = 1;
    var pad = 30;
    var cw = w - pad * 2;
    var ch = h - pad * 2;

    ctx.clearRect(0, 0, w, h);

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
        var y = pad + (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
    }

    // 折线
    ctx.beginPath();
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 3;
    for (var i = 0; i < data.length; i++) {
        var x = pad + (cw / (data.length - 1)) * i;
        var y = pad + ch - (data[i] / max) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 渐变填充
    ctx.lineTo(pad + cw, pad + ch);
    ctx.lineTo(pad, pad + ch);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad, 0, pad + ch);
    grad.addColorStop(0, 'rgba(229,57,53,0.2)');
    grad.addColorStop(1, 'rgba(229,57,53,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 数据点
    for (var i = 0; i < data.length; i++) {
        var x = pad + (cw / (data.length - 1)) * i;
        var y = pad + ch - (data[i] / max) * ch;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(229,57,53,0.15)';
        ctx.fill();
    }
}

/**
 * 绘制技能雷达图
 */
function drawRadarChart() {
    var canvas = document.getElementById('radarChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth || 300;
    var h = canvas.height = 240;
    var cx = w / 2;
    var cy = h / 2;
    var r = Math.min(w, h) / 2 - 40;
    var skills = ['CPR', '海姆立克', 'AED', '理论知识'];
    var values = [
        calculateCPRProgress ? calculateCPRProgress() : 60,
        calculateHeimlichProgress ? calculateHeimlichProgress() : 50,
        calculateAEDProgress ? calculateAEDProgress() : 40,
        calculateQuizProgress ? calculateQuizProgress() : 70
    ];

    ctx.clearRect(0, 0, w, h);

    // 绘制网格
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (var level = 1; level <= 4; level++) {
        ctx.beginPath();
        for (var i = 0; i < skills.length; i++) {
            var angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
            var x = cx + Math.cos(angle) * r * (level / 4);
            var y = cy + Math.sin(angle) * r * (level / 4);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // 轴线
    for (var i = 0; i < skills.length; i++) {
        var angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();

        // 标签
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        var lx = cx + Math.cos(angle) * (r + 20);
        var ly = cy + Math.sin(angle) * (r + 20);
        ctx.fillText(skills[i], lx, ly + 4);
    }

    // 数据区域
    ctx.beginPath();
    for (var i = 0; i < values.length; i++) {
        var angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
        var x = cx + Math.cos(angle) * r * (values[i] / 100);
        var y = cy + Math.sin(angle) * r * (values[i] / 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(229,57,53,0.15)';
    ctx.fill();
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    for (var i = 0; i < values.length; i++) {
        var angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
        var x = cx + Math.cos(angle) * r * (values[i] / 100);
        var y = cy + Math.sin(angle) * r * (values[i] / 100);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();
    }
}

/**
 * 渲染技能树
 */
function renderSkillTree() {
    var list = document.getElementById('skillsList');
    if (!list) return;

    var stats = getStats();
    var quizProgress = getQuizProgress();

    var skills = [
        { name: 'CPR心肺复苏', icon: '&#x2764;&#xFE0F;', achieved: stats.cprSessions > 0, detail: stats.cprSessions > 0 ? '已练习' + stats.cprSessions + '次' : '未开始' },
        { name: '海姆立克急救法', icon: '&#x1F9F7;', achieved: stats.heimlichSessions > 0, detail: stats.heimlichSessions > 0 ? '已完成' : '未开始' },
        { name: 'AED使用', icon: '&#x26A1;', achieved: stats.aedSessions > 0, detail: stats.aedSessions > 0 ? '已练习' + stats.aedSessions + '次' : '未开始' },
        { name: '基础急救常识', icon: '&#x1F4DA;', achieved: quizProgress.levels && quizProgress.levels[1] && quizProgress.levels[1].stars > 0, detail: quizProgress.levels && quizProgress.levels[1] ? quizProgress.levels[1].stars + '星' : '未开始' },
        { name: 'CPR专项知识', icon: '&#x1FA91;', achieved: quizProgress.levels && quizProgress.levels[2] && quizProgress.levels[2].stars > 0, detail: quizProgress.levels && quizProgress.levels[2] ? quizProgress.levels[2].stars + '星' : '未开始' },
        { name: '气道管理知识', icon: '&#x1F6E0;', achieved: quizProgress.levels && quizProgress.levels[3] && quizProgress.levels[3].stars > 0, detail: quizProgress.levels && quizProgress.levels[3] ? quizProgress.levels[3].stars + '星' : '未开始' },
        { name: '综合急救知识', icon: '&#x1F6D1;', achieved: quizProgress.levels && quizProgress.levels[4] && quizProgress.levels[4].stars > 0, detail: quizProgress.levels && quizProgress.levels[4] ? quizProgress.levels[4].stars + '星' : '未开始' }
    ];

    var html = '';
    for (var i = 0; i < skills.length; i++) {
        var s = skills[i];
        html += '<div class="skill-item' + (s.achieved ? ' achieved' : '') + '">' +
            '<div class="skill-icon">' + (s.achieved ? '&#x2705;' : '&#x2B1C;') + ' ' + s.icon + '</div>' +
            '<div class="skill-name">' + s.name + '</div>' +
            '<div class="skill-detail">' + s.detail + '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

/**
 * 渲染闯关进度列表
 */
function renderQuizProgressList() {
    var list = document.getElementById('quizProgressList');
    if (!list) return;

    var progress = getQuizProgress();
    var html = '';

    for (var i = 0; i < quizLevelsDataConfig.length; i++) {
        var level = quizLevelsDataConfig[i];
        var lp = progress.levels && progress.levels[level.id] ? progress.levels[level.id] : null;

        html += '<div class="quiz-progress-item">' +
            '<div class="quiz-progress-icon">' + level.icon + '</div>' +
            '<div class="quiz-progress-info">' +
                '<div class="quiz-progress-name">第' + level.id + '关：' + level.title + '</div>' +
                '<div class="quiz-progress-stars">' + (lp ? getStarsHTML(lp.stars) : getStarsHTML(0)) + '</div>' +
            '</div>' +
            '<div class="quiz-progress-score">' +
                (lp ? '最高分 ' + lp.bestScore + '%' : '未挑战') +
            '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

/**
 * 渲染证书区域
 */
function renderCertificateArea() {
    var area = document.getElementById('certificateArea');
    if (!area) return;

    var stats = getStats();
    var quizProgress = getQuizProgress();

    // 检查是否获得证书
    var allLevelsCompleted = true;
    for (var l = 1; l <= 4; l++) {
        if (!quizProgress.levels || !quizProgress.levels[l] || quizProgress.levels[l].stars === 0) {
            allLevelsCompleted = false;
            break;
        }
    }

    if (allLevelsCompleted) {
        area.innerHTML =
            '<div class="certificate-card" id="certificateCard">' +
                '<div class="certificate-preview">' +
                    '<div class="certificate-border">' +
                        '<div class="certificate-content">' +
                            '<div class="cert-logo">&#x2695;</div>' +
                            '<h3>急救知识认证证书</h3>' +
                            '<p>恭喜 ' + (appSettings.userName || '急救学员') + '</p>' +
                            '<p>成功通过全部急救知识闯关</p>' +
                            '<div class="cert-stars">' + getStarsHTML(3) + '</div>' +
                            '<p class="cert-date">' + formatDate(new Date().toISOString()) + '</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="btn btn-primary" onclick="generateCertificate()">下载证书</button>' +
            '</div>';
    } else {
        var completedCount = 0;
        for (var k = 1; k <= 4; k++) {
            if (quizProgress.levels && quizProgress.levels[k] && quizProgress.levels[k].stars > 0) {
                completedCount++;
            }
        }
        area.innerHTML =
            '<div class="certificate-locked">' +
                '<div class="certificate-locked-icon">&#x1F512;</div>' +
                '<p>完成全部4关闯关后可获得急救知识认证证书</p>' +
                '<p>当前进度：' + completedCount + '/4 关</p>' +
                '<div class="cert-progress-bar"><div class="cert-progress-fill" style="width:' + (completedCount / 4 * 100) + '%"></div></div>' +
            '</div>';
    }
}

/**
 * 生成证书（Canvas绘制）
 */
function generateCertificate(templateId) {
    templateId = templateId || 'basic';

    var canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 566;
    var ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 566);

    // 边框
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 770, 536);
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, 750, 516);

    // 装饰角
    drawCertCorner(ctx, 30, 30, 40, 1, 1);
    drawCertCorner(ctx, 770, 30, 40, -1, 1);
    drawCertCorner(ctx, 30, 536, 40, 1, -1);
    drawCertCorner(ctx, 770, 536, 40, -1, -1);

    // 标题
    ctx.fillStyle = '#c41e3a';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.fillText('急救知识认证证书', 400, 100);

    // 横线
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 120);
    ctx.lineTo(650, 120);
    ctx.stroke();

    // 内容
    ctx.fillStyle = '#333333';
    ctx.font = '20px serif';
    ctx.fillText('兹证明', 400, 180);

    ctx.fillStyle = '#1a5276';
    ctx.font = 'bold 28px serif';
    ctx.fillText(appSettings.userName || '急救学员', 400, 230);

    ctx.fillStyle = '#333333';
    ctx.font = '20px serif';
    ctx.fillText('已成功完成"急救教练"平台全部急救知识闯关', 400, 280);
    ctx.fillText('掌握了心肺复苏、海姆立克急救法、AED使用等', 400, 310);
    ctx.fillText('院前急救核心技能，成绩优异。', 400, 340);

    // 日期
    ctx.fillStyle = '#666666';
    ctx.font = '16px serif';
    ctx.fillText('颁发日期：' + formatDate(new Date().toISOString()), 400, 400);

    // 盖章效果（简化为圆形）
    ctx.beginPath();
    ctx.arc(400, 460, 40, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(196, 30, 58, 0.8)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px serif';
    ctx.fillText('急救教练', 400, 458);
    ctx.font = '12px serif';
    ctx.fillText('认证专用', 400, 474);

    // 导出为图片
    try {
        var link = document.createElement('a');
        link.download = '急救知识认证证书.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('success', '证书已生成并下载！');
    } catch (e) {
        showToast('error', '证书生成失败：' + e.message);
    }
}

/**
 * 绘制证书装饰角
 */
function drawCertCorner(ctx, x, y, size, dirX, dirY) {
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + dirY * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dirX * size, y);
    ctx.stroke();
}

// ============================================================
// 第十四部分：设置页
// ============================================================

/**
 * 渲染设置页
 */
function renderSettingsPage() {
    var container = document.getElementById('settingsContent');
    if (!container) return;

    // 加载设置
    loadSettings();

    container.innerHTML =
        '<div class="settings-container">' +
            '<div class="settings-header">' +
                '<h2>&#x2699; 设置</h2>' +
                '<p>个性化你的急救训练体验。</p>' +
            '</div>' +

            '<div class="settings-section">' +
                '<h3>&#x1F464; 个人信息</h3>' +
                '<div class="setting-item">' +
                    '<label>姓名/昵称</label>' +
                    '<input type="text" id="settingUserName" value="' + escapeHTML(appSettings.userName || '') + '" placeholder="输入你的姓名">' +
                '</div>' +
            '</div>' +

            '<div class="settings-section">' +
                '<h3>&#x1F3B5; CPR训练设置</h3>' +
                '<div class="setting-item">' +
                    '<label>默认BPM</label>' +
                    '<div class="setting-control">' +
                        '<input type="range" id="settingBPM" min="60" max="140" value="' + (appSettings.cprBPM || 100) + '" step="5">' +
                        '<span id="settingBPMValue">' + (appSettings.cprBPM || 100) + ' BPM</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-item">' +
                    '<label>声音效果</label>' +
                    '<label class="switch">' +
                        '<input type="checkbox" id="settingSound"' + (appSettings.soundEnabled !== false ? ' checked' : '') + '>' +
                        '<span class="slider"></span>' +
                    '</label>' +
                '</div>' +
            '</div>' +

            '<div class="settings-section">' +
                '<h3>&#x1F3A8; 外观</h3>' +
                '<div class="setting-item">' +
                    '<label>主题</label>' +
                    '<div class="setting-control">' +
                        '<button class="btn btn-sm ' + (appSettings.theme === 'light' ? 'btn-primary' : 'btn-outline') + '" onclick="setThemeSetting(\'light\')">&#x2600; 浅色</button>' +
                        '<button class="btn btn-sm ' + (appSettings.theme === 'dark' ? 'btn-primary' : 'btn-outline') + '" onclick="setThemeSetting(\'dark\')">&#x1F319; 深色</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="settings-section">' +
                '<h3>&#x1F517; API配置</h3>' +
                '<div class="setting-item">' +
                    '<label>API服务商</label>' +
                    '<select id="settingApiProvider" onchange="switchApiProvider()">' +
                        '<option value="openai"' + (apiConfig.provider === 'openai' ? ' selected' : '') + '>OpenAI兼容</option>' +
                        '<option value="custom"' + (apiConfig.provider === 'custom' ? ' selected' : '') + '>自定义</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-item">' +
                    '<label>API Base URL</label>' +
                    '<input type="text" id="settingApiBaseUrl" value="' + escapeHTML(apiConfig.baseUrl || '') + '" placeholder="https://api.openai.com">' +
                '</div>' +
                '<div class="setting-item">' +
                    '<label>API Key</label>' +
                    '<input type="password" id="settingApiKey" value="' + escapeHTML(apiConfig.apiKey || '') + '" placeholder="sk-...">' +
                '</div>' +
                '<div class="setting-item">' +
                    '<label>模型名称</label>' +
                    '<input type="text" id="settingApiModel" value="' + escapeHTML(apiConfig.model || '') + '" placeholder="gpt-3.5-turbo">' +
                '</div>' +
                '<button class="btn btn-outline btn-sm" onclick="testApiConnection()">&#x1F50C; 测试连接</button>' +
                '<span id="apiTestResult"></span>' +
            '</div>' +

            '<div class="settings-section">' +
                '<h3>&#x1F4BE; 数据管理</h3>' +
                '<div class="setting-buttons">' +
                    '<button class="btn btn-primary" onclick="saveAllSettings()">&#x1F4BE; 保存所有设置</button>' +
                    '<button class="btn btn-outline" onclick="exportTrainingData()">&#x1F4E5; 导出训练数据</button>' +
                    '<button class="btn btn-danger" onclick="confirmResetAllData()">&#x1F5D1; 重置所有数据</button>' +
                '</div>' +
            '</div>' +

            '<div class="settings-section settings-about">' +
                '<h3>&#x2139; 关于</h3>' +
                '<p>急救教练 v1.0.0</p>' +
                '<p>院前急救技能AI训练平台</p>' +
                '<p class="settings-disclaimer">本应用仅供学习训练用途，不能替代专业急救培训。在真实紧急情况下请拨打120。</p>' +
            '</div>' +
        '</div>';

    // BPM滑块事件
    var bpmSlider = document.getElementById('settingBPM');
    if (bpmSlider) {
        bpmSlider.addEventListener('input', function() {
            document.getElementById('settingBPMValue').textContent = this.value + ' BPM';
        });
    }
}

/**
 * 设置主题
 */
function setThemeSetting(theme) {
    appSettings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('jjjl_theme', theme);
    } catch (e) {
        // ignore
    }
    // 更新主题按钮高亮状态，不重新渲染整个设置页
    var btns = document.querySelectorAll('[onclick^="setThemeSetting"]');
    for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var btnTheme = btn.getAttribute('onclick').match(/'(\w+)'/);
        if (btnTheme) {
            if (btnTheme[1] === theme) {
                btn.className = 'btn btn-sm btn-primary';
            } else {
                btn.className = 'btn btn-sm btn-outline';
            }
        }
    }
}

/**
 * 切换API服务商
 */
function switchApiProvider() {
    var select = document.getElementById('settingApiProvider');
    if (!select) return;

    var urlInput = document.getElementById('settingApiBaseUrl');
    var modelInput = document.getElementById('settingApiModel');

    if (select.value === 'openai') {
        if (urlInput) urlInput.value = 'https://api.openai.com';
        if (modelInput) modelInput.value = 'gpt-3.5-turbo';
    } else {
        if (urlInput) urlInput.value = '';
        if (modelInput) modelInput.value = '';
    }
}

/**
 * 加载设置
 */
function loadSettings() {
    try {
        var settingsStr = localStorage.getItem('jjjl_settings');
        if (settingsStr) {
            var saved = JSON.parse(settingsStr);
            for (var key in saved) {
                if (saved.hasOwnProperty(key)) {
                    appSettings[key] = saved[key];
                }
            }
        }
    } catch (e) {
        // ignore
    }

    try {
        var apiStr = localStorage.getItem('jc_api_config');
        if (apiStr) {
            var savedApi = JSON.parse(apiStr);
            for (var k in savedApi) {
                if (savedApi.hasOwnProperty(k)) {
                    apiConfig[k] = savedApi[k];
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

/**
 * 保存所有设置
 */
function saveAllSettings() {
    var userName = document.getElementById('settingUserName');
    var bpm = document.getElementById('settingBPM');
    var sound = document.getElementById('settingSound');
    var provider = document.getElementById('settingApiProvider');
    var baseUrl = document.getElementById('settingApiBaseUrl');
    var apiKey = document.getElementById('settingApiKey');
    var model = document.getElementById('settingApiModel');

    if (userName) appSettings.userName = userName.value.trim() || '急救学员';
    if (bpm) appSettings.cprBPM = parseInt(bpm.value, 10) || 100;
    if (sound) appSettings.soundEnabled = sound.checked;
    cprTargetBPM = appSettings.cprBPM;

    if (provider) apiConfig.provider = provider.value;
    if (baseUrl) apiConfig.baseUrl = baseUrl.value.trim();
    if (apiKey) apiConfig.apiKey = apiKey.value.trim();
    if (model) apiConfig.model = model.value.trim();

    try {
        localStorage.setItem('jjjl_settings', JSON.stringify(appSettings));
        localStorage.setItem('jc_api_config', JSON.stringify(apiConfig));
    } catch (e) {
        console.warn('保存设置失败:', e);
    }

    showToast('success', '设置已保存！');
    updateApiStatus();
}

/**
 * 重置所有数据确认
 */
function confirmResetAllData() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML =
        '<div class="modal-card">' +
            '<h3>&#x26A0; 确认重置</h3>' +
            '<p>确定要重置所有数据吗？此操作将清除：</p>' +
            '<ul>' +
                '<li>所有训练记录</li>' +
                '<li>闯关进度</li>' +
                '<li>对话历史</li>' +
                '<li>个人设置</li>' +
            '</ul>' +
            '<p class="modal-warning">此操作不可撤销！</p>' +
            '<div class="modal-actions">' +
                '<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">取消</button>' +
                '<button class="btn btn-danger" onclick="resetAllData(); this.closest(\'.modal-overlay\').remove()">确认重置</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);
}

/**
 * 重置所有数据
 */
function resetAllData() {
    try {
        localStorage.removeItem('jc_records');
        localStorage.removeItem('jjjl_quizProgress');
        localStorage.removeItem('jjjl_chatHistory');
        localStorage.removeItem('jjjl_settings');
        localStorage.removeItem('jc_api_config');
        localStorage.removeItem('jjjl_theme');
    } catch (e) {
        // ignore
    }

    trainingRecords = [];
    chatHistory = [];
    appSettings = {
        cprBPM: 100,
        theme: 'light',
        soundEnabled: true,
        language: 'zh-CN',
        userName: '急救学员'
    };
    apiConfig = { provider: 'openai', baseUrl: '', apiKey: '', model: '' };
    cprTargetBPM = 100;

    document.documentElement.setAttribute('data-theme', 'light');
    showToast('success', '所有数据已重置');
    renderSettingsPage();
}

/**
 * 导出训练数据
 */
function exportTrainingData() {
    var data = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        settings: appSettings,
        apiConfig: apiConfig,
        trainingRecords: getTrainingRecords(),
        quizProgress: getQuizProgress(),
        chatHistory: chatHistory.slice(-50) // 最近50条
    };

    try {
        var jsonStr = JSON.stringify(data, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = '急救教练_训练数据_' + new Date().toISOString().slice(0, 10) + '.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast('success', '训练数据已导出！');
    } catch (e) {
        showToast('error', '导出失败：' + e.message);
    }
}

/**
 * 测试API连接
 */
function testApiConnection() {
    var baseUrl = document.getElementById('settingApiBaseUrl');
    var apiKey = document.getElementById('settingApiKey');
    var result = document.getElementById('apiTestResult');
    if (!baseUrl || !apiKey || !result) return;

    var url = baseUrl.value.trim();
    var key = apiKey.value.trim();

    if (!url || !key) {
        result.innerHTML = '<span style="color:#ef4444;">请填写URL和API Key</span>';
        return;
    }

    result.innerHTML = '<span style="color:#eab308;">正在测试...</span>';

    var testUrl = url.replace(/\/$/, '') + '/v1/models';
    fetch(testUrl, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + key
        }
    }).then(function(response) {
        if (response.ok) {
            result.innerHTML = '<span style="color:#22c55e;">连接成功！</span>';
        } else {
            result.innerHTML = '<span style="color:#ef4444;">连接失败 (' + response.status + ')</span>';
        }
    }).catch(function(err) {
        result.innerHTML = '<span style="color:#ef4444;">连接失败：' + err.message + '</span>';
    });
}

/**
 * 更新API状态
 */
function updateApiStatus() {
    loadApiConfig();

    var statusEl = document.getElementById('apiStatus');
    if (statusEl) {
        if (apiConfig.apiKey && apiConfig.baseUrl) {
            statusEl.className = 'api-status connected';
            statusEl.textContent = 'API已配置';
        } else {
            statusEl.className = 'api-status disconnected';
            statusEl.textContent = 'API未配置（使用内置AI）';
        }
    }
}

/**
 * 加载API配置
 */
function loadApiConfig() {
    try {
        var apiStr = localStorage.getItem('jc_api_config');
        if (apiStr) {
            var saved = JSON.parse(apiStr);
            for (var key in saved) {
                if (saved.hasOwnProperty(key)) {
                    apiConfig[key] = saved[key];
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

// ============================================================
// 第十五部分：首页渲染
// ============================================================

/**
 * 渲染首页
 */
function renderHomePage() {
    var container = document.getElementById('page-home');
    if (!container) return;

    var stats = getStats();
    var quizProgress = getQuizProgress();
    var greeting = getGreeting();

    var cprProg = calculateCPRProgress();
    var heimProg = calculateHeimlichProgress();
    var aedProg = calculateAEDProgress();
    var quizProg = calculateQuizProgress();
    var overallProgress = Math.round((cprProg + heimProg + aedProg + quizProg) / 4);

    var today = new Date().toISOString().split('T')[0];
    var records = getTrainingRecords();
    var todayCount = 0;
    for (var i = 0; i < records.length; i++) {
        if (records[i].date && records[i].date.indexOf(today) === 0) todayCount++;
    }
    var todayProgress = Math.min(100, todayCount * 25);

    var radius = 42;
    var circumference = Math.round(2 * Math.PI * radius);
    var overallOffset = Math.round(circumference * (1 - overallProgress / 100));
    var todayOffset = Math.round(circumference * (1 - todayProgress / 100));

    var html =
        '<svg width="0" height="0" style="position:absolute">' +
            '<defs>' +
                '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" style="stop-color:#e53935;stop-opacity:1" />' +
                    '<stop offset="100%" style="stop-color:#ff6f00;stop-opacity:1" />' +
                '</linearGradient>' +
            '</defs>' +
        '</svg>' +
        '<div class="home-container">' +
            '<div class="home-hero">' +
                '<div class="home-hero-content">' +
                    '<div class="home-hero-icon">&#x1F6E1;</div>' +
                    '<div class="home-hero-text">' +
                        '<h2>' + greeting + '，' + (appSettings.userName || '急救学员') + '！</h2>' +
                        '<p>欢迎回到急救教练，继续你的急救技能学习之旅。掌握急救技能，关键时刻拯救生命。</p>' +
                    '</div>' +
                '</div>' +
                '<svg class="home-hero-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">' +
                    '<path fill="rgba(229,57,53,0.3)" d="M0,30 C360,60 720,0 1080,30 C1260,45 1350,15 1440,30 L1440,60 L0,60Z"></path>' +
                '</svg>' +
            '</div>' +

            '<div class="home-stats-grid">' +
                '<div class="home-stat-card tilt-card">' +
                    '<div class="home-stat-icon">&#x1F4C5;</div>' +
                    '<div class="home-stat-value" data-target="' + stats.totalSessions + '">0</div>' +
                    '<div class="home-stat-label">训练总次数</div>' +
                '</div>' +
                '<div class="home-stat-card tilt-card">' +
                    '<div class="home-stat-icon">&#x23F1;</div>' +
                    '<div class="home-stat-value">' + formatTime(stats.totalDuration) + '</div>' +
                    '<div class="home-stat-label">总练习时长</div>' +
                '</div>' +
                '<div class="home-stat-card tilt-card">' +
                    '<div class="home-stat-icon">&#x1F6E0;</div>' +
                    '<div class="home-stat-value" data-target="' + stats.skills + '">0</div>' +
                    '<div class="home-stat-label">已掌握技能</div>' +
                '</div>' +
                '<div class="home-stat-card tilt-card">' +
                    '<div class="home-stat-icon">&#x1F4DC;</div>' +
                    '<div class="home-stat-value" data-target="' + stats.certificates + '">0</div>' +
                    '<div class="home-stat-label">获得证书</div>' +
                '</div>' +
            '</div>' +

            '<div class="home-progress-section">' +
                '<div class="home-progress-card">' +
                    '<div class="home-progress-ring">' +
                        '<svg width="100" height="100" viewBox="0 0 100 100">' +
                            '<circle class="hpr-bg" cx="50" cy="50" r="' + radius + '"></circle>' +
                            '<circle class="hpr-fill" cx="50" cy="50" r="' + radius + '" ' +
                                'stroke-dasharray="' + circumference + '" ' +
                                'stroke-dashoffset="' + circumference + '"></circle>' +
                        '</svg>' +
                        '<div class="hpr-text">' +
                            '<div class="hpr-value">' + overallProgress + '%</div>' +
                            '<div class="hpr-label">总体进度</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="home-progress-info">' +
                        '<h4>总体学习进度</h4>' +
                        '<p>综合所有训练模块的完成度</p>' +
                        '<div class="home-progress-bar-mini"><div class="hpm-fill" style="width:' + overallProgress + '%"></div></div>' +
                    '</div>' +
                '</div>' +
                '<div class="home-progress-card">' +
                    '<div class="home-progress-ring">' +
                        '<svg width="100" height="100" viewBox="0 0 100 100">' +
                            '<circle class="hpr-bg" cx="50" cy="50" r="' + radius + '"></circle>' +
                            '<circle class="hpr-fill" cx="50" cy="50" r="' + radius + '" ' +
                                'stroke-dasharray="' + circumference + '" ' +
                                'stroke-dashoffset="' + circumference + '"></circle>' +
                        '</svg>' +
                        '<div class="hpr-text">' +
                            '<div class="hpr-value">' + todayProgress + '%</div>' +
                            '<div class="hpr-label">今日目标</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="home-progress-info">' +
                        '<h4>今日训练目标</h4>' +
                        '<p>每日完成4次训练即可达成100%</p>' +
                        '<div class="home-progress-bar-mini"><div class="hpm-fill" style="width:' + todayProgress + '%"></div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="home-modules">' +
                '<h3>训练模块</h3>' +
                '<div class="home-modules-grid">' +
                    renderModuleCard('cpr', '&#x2764;&#xFE0F;', '心肺复苏训练', '跟随节拍器练习CPR', stats.cprSessions > 0, cprProg) +
                    renderModuleCard('heimlich', '&#x1F9F7;', '海姆立克急救', '学习异物梗阻急救', stats.heimlichSessions > 0, heimProg) +
                    renderModuleCard('aed', '&#x26A1;', 'AED训练', '模拟AED操作流程', stats.aedSessions > 0, aedProg) +
                    renderModuleCard('quiz', '&#x1F3AF;', '场景闯关', '测试急救知识', stats.quizSessions > 0, quizProg) +
                '</div>' +
            '</div>' +

            '<div class="home-waveform-container">' +
                '<canvas id="homeWaveform"></canvas>' +
            '</div>' +

            '<div class="home-modules">' +
                '<h3>&#x1F4AC; 呼吸放松训练</h3>' +
                '<div class="breath-trainer" id="breathTrainer">' +
                    '<div class="breath-circle">' +
                        '<div class="breath-text">点击开始</div>' +
                        '<div class="breath-sub">跟随节奏调整呼吸</div>' +
                    '</div>' +
                    '<div class="breath-timer">0s</div>' +
                    '<p style="color:var(--text-secondary);font-size:13px;text-align:center;">吸气4秒 · 屏息2秒 · 呼气6秒</p>' +
                '</div>' +
            '</div>' +

            '<div class="home-recent">' +
                '<h3>最近训练记录</h3>' +
                '<div class="home-recent-list" id="homeRecentList"></div>' +
                (stats.totalSessions === 0 ?
                    '<div class="home-empty-state">' +
                        '<i>&#x1F4C5;</i>' +
                        '<p>还没有训练记录。</p>' +
                        '<p>选择一个训练模块开始你的第一次训练吧！</p>' +
                    '</div>' : '') +
            '</div>' +
        '</div>';

    container.innerHTML = html;

    var statValues = container.querySelectorAll('.home-stat-value[data-target]');
    for (var i = 0; i < statValues.length; i++) {
        (function(el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            animateNumber(el, target, 1200);
        })(statValues[i]);
    }

    setTimeout(function() {
        var fills = container.querySelectorAll('.hpr-fill');
        if (fills.length >= 2) {
            fills[0].style.strokeDashoffset = overallOffset;
            fills[1].style.strokeDashoffset = todayOffset;
        }
    }, 100);

    renderHomeRecentRecords();

    setTimeout(function() { initHomeWaveform(); }, 150);
    setTimeout(function() { initBreathTrainer(); }, 200);
}

/**
 * 初始化首页心跳波形Canvas动画
 */
function initHomeWaveform() {
    var canvas = document.getElementById('homeWaveform');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth;
    var h = canvas.height = canvas.offsetHeight;
    var offset = 0;
    var animId = null;

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(229, 57, 53, 0.3)';
        ctx.lineWidth = 2;
        for (var x = 0; x < w; x++) {
            var y = h / 2;
            var localX = (x + offset) % 200;
            if (localX > 80 && localX < 120) {
                var pulse = Math.sin((localX - 80) / 40 * Math.PI);
                y -= pulse * 25 * Math.exp(-Math.pow((localX - 100) / 15, 2));
            }
            y += Math.sin((x + offset) * 0.02) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += 1.5;
        animId = requestAnimationFrame(draw);
    }
    draw();

    canvas._stopWaveform = function() {
        if (animId) cancelAnimationFrame(animId);
    };
}

/**
 * 渲染模块卡片
 */
function renderModuleCard(moduleId, icon, title, desc, started, progress) {
    return '<div class="home-module-card tilt-card" onclick="switchPage(\'' + moduleId + '\')">' +
        '<div class="home-module-icon">' + icon + '</div>' +
        '<h4>' + title + '</h4>' +
        '<p>' + desc + '</p>' +
        '<div class="home-module-progress">' +
            '<div class="home-module-progress-bar"><div class="home-module-progress-fill" style="width:' + progress + '%"></div></div>' +
            '<span class="home-module-progress-text">' + progress + '%</span>' +
        '</div>' +
        (started ? '<div class="home-module-badge">&#x2705; 已开始</div>' : '<div class="home-module-badge">开始训练</div>') +
    '</div>';
}

/**
 * 计算CPR进度
 */
function calculateCPRProgress() {
    var records = getTrainingRecords();
    var sessions = 0;
    for (var i = 0; i < records.length; i++) {
        if (records[i].type === 'cpr') sessions++;
    }
    return Math.min(100, sessions * 20);
}

/**
 * 计算海姆立克进度
 */
function calculateHeimlichProgress() {
    var progress = getQuizProgress();
    if (!progress.heimlich) return 0;
    var completed = 0;
    for (var key in progress.heimlich) {
        if (progress.heimlich[key] && progress.heimlich[key].completed) {
            completed++;
        }
    }
    return Math.round((completed / heimlichScenariosData.length) * 100);
}

/**
 * 计算AED进度
 */
function calculateAEDProgress() {
    var records = getTrainingRecords();
    var sessions = 0;
    for (var i = 0; i < records.length; i++) {
        if (records[i].type === 'aed') sessions++;
    }
    return Math.min(100, sessions * 25);
}

/**
 * 计算闯关进度
 */
function calculateQuizProgress() {
    var progress = getQuizProgress();
    if (!progress.levels) return 0;
    var totalStars = 0;
    for (var l = 1; l <= 4; l++) {
        if (progress.levels[l] && progress.levels[l].stars) {
            totalStars += progress.levels[l].stars;
        }
    }
    return Math.round((totalStars / 12) * 100);
}

/**
 * 渲染首页最近训练记录
 */
function renderHomeRecentRecords() {
    var list = document.getElementById('homeRecentList');
    if (!list) return;

    var records = getTrainingRecords();
    if (records.length === 0) return;

    var html = '';
    var count = Math.min(5, records.length);
    for (var i = 0; i < count; i++) {
        var r = records[i];
        var typeLabel = '';
        var typeIcon = '';
        var dotClass = '';
        if (r.type === 'cpr') { typeLabel = 'CPR训练'; typeIcon = '&#x2764;&#xFE0F;'; dotClass = 'cpr'; }
        else if (r.type === 'heimlich') { typeLabel = '海姆立克训练'; typeIcon = '&#x1F9F7;'; dotClass = 'heimlich'; }
        else if (r.type === 'aed') { typeLabel = 'AED训练'; typeIcon = '&#x26A1;'; dotClass = 'aed'; }
        else if (r.type === 'quiz') { typeLabel = '场景闯关'; typeIcon = '&#x1F3AF;'; dotClass = 'quiz'; }
        else { typeLabel = '其他训练'; typeIcon = '&#x1F4CB;'; dotClass = ''; }

        var scoreHtml = '';
        if (r.score !== undefined && r.score !== null) {
            scoreHtml = '<div class="home-timeline-score">' + r.score + (r.type === 'quiz' ? '星' : '分') + '</div>';
        }

        html += '<div class="home-timeline-item">' +
            '<div class="home-timeline-dot ' + dotClass + '">' + typeIcon + '</div>' +
            '<div class="home-timeline-content">' +
                '<div class="home-timeline-title">' + typeLabel + '</div>' +
                '<div class="home-timeline-meta">' + (r.detail || '') + ' · ' + formatDate(r.date) + '</div>' +
            '</div>' +
            scoreHtml +
        '</div>';
    }
    list.innerHTML = html;
}

// ============================================================
// 第十六部分：侧边栏控制
// ============================================================

/**
 * 切换侧边栏（移动端）
 */
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
    } else {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
    }
}

/**
 * 关闭侧边栏
 */
function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
}

// ============================================================
// 第十七部分：Loading控制
// ============================================================

/**
 * 隐藏加载界面
 */
function hideLoader() {
    var loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(function() {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 500);
    }
}

// ============================================================
// 第十八部分：计时考试模式
// ============================================================
var examState = { active: false, startTime: null, timeLimit: 300, currentSection: 0, currentQ: 0, answers: [], score: 0 };

/**
 * 渲染考试欢迎页
 */
function renderExamWelcome() {
    var container = document.getElementById('examContent');
    if (!container) return;
    container.innerHTML =
        '<div class="exam-result">' +
            '<div class="result-icon"><i class="fa-solid fa-clipboard-check" style="color:var(--primary);font-size:64px"></i></div>' +
            '<h2>模拟考试</h2>' +
            '<p style="color:var(--text-secondary);margin:16px 0">通过综合考试检验你的急救知识掌握程度。</p>' +
            '<div class="card" style="margin:20px auto;max-width:500px;padding:24px;text-align:left">' +
                '<h4><i class="fa-solid fa-book-open" style="color:var(--primary)"></i> 考试说明</h4>' +
                '<ul style="margin-top:12px;line-height:2">' +
                    '<li>考试包含多个急救知识板块</li>' +
                    '<li>每题 25 分，总分根据题目数量计算</li>' +
                    '<li>考试有时间限制，请注意倒计时</li>' +
                    '<li>考试结束后可查看成绩和错误分析</li>' +
                '</ul>' +
            '</div>' +
            '<button class="btn btn-primary" onclick="startExam(\'exam_full\')" style="margin-top:16px"><i class="fa-solid fa-play"></i> 开始考试</button>' +
        '</div>';
}

function startExam(examId) {
    var exam = typeof examScenarios !== 'undefined' ? examScenarios[0] : null;
    if (!exam) { showToast('error', '考试数据未加载'); return; }
    
    examState = { active: true, startTime: Date.now(), timeLimit: exam.duration, currentSection: 0, currentQ: 0, answers: [], score: 0, exam: exam };
    
    // 倒计时
    examState.countdown = setInterval(function() {
        var remaining = examState.timeLimit - Math.floor((Date.now() - examState.startTime) / 1000);
        var timerEl = document.getElementById('examTimer');
        if (timerEl) timerEl.textContent = formatTime(remaining);
        if (remaining <= 60 && remaining > 0 && remaining % 10 === 0) {
            showToast('warning', '还剩' + remaining + '秒！');
        }
        if (remaining <= 0) {
            clearInterval(examState.countdown);
            completeExam();
        }
    }, 1000);
    
    renderExamQuestion();
    switchPage('exam');
}

function renderExamQuestion() {
    if (!examState.active || !examState.exam) return;
    var sections = examState.exam.sections;
    var section = sections[examState.currentSection];
    if (!section) { completeExam(); return; }
    var questions = section.questions;
    var q = questions[examState.currentQ];
    if (!q) {
        examState.currentQ = 0;
        examState.currentSection++;
        section = sections[examState.currentSection];
        if (!section) { completeExam(); return; }
        q = section.questions[0];
    }
    
    var container = document.getElementById('examContent');
    if (!container) return;
    
    var totalQ = 0;
    for (var s = 0; s < sections.length; s++) totalQ += sections[s].questions.length;
    var answeredQ = examState.currentSection * (sections[0].questions.length) + examState.currentQ;
    var progress = Math.round((answeredQ / totalQ) * 100);
    
    container.innerHTML =
        '<div class="exam-header">' +
            '<div class="exam-info"><span class="badge" style="background:var(--primary);color:#fff">' + section.title + '</span><span class="badge">' + (examState.currentSection+1) + '/' + sections.length + '</span></div>' +
            '<div class="exam-timer"><i class="fa-solid fa-clock"></i> <span id="examTimer">' + formatTime(examState.timeLimit - Math.floor((Date.now() - examState.startTime)/1000)) + '</span></div>' +
        '</div>' +
        '<div class="progress-bar" style="margin:16px 0"><div class="progress-fill" style="width:' + progress + '%;background:var(--primary)"></div></div>' +
        '<div class="card" style="padding:24px">' +
            '<p style="color:var(--text-secondary);margin-bottom:16px">' + section.description + '</p>' +
            '<h3 style="margin-bottom:16px">' + (examState.currentQ+1) + '. ' + q.q + '</h3>' +
            '<div class="option-grid">' +
                q.options.map(function(opt, idx) {
                    return '<button class="exam-option" onclick="submitExamAnswer(' + idx + ',this)">' + String.fromCharCode(65+idx) + '. ' + opt + '</button>';
                }).join('') +
            '</div>' +
            '<div id="examFeedback" style="margin-top:16px"></div>' +
        '</div>';
}

function submitExamAnswer(optIdx, btn) {
    try {
        if (!examState.active) return;
        var sections = examState.exam.sections;
        var section = sections[examState.currentSection];
        var q = section.questions[examState.currentQ];

        // 禁用所有选项
        var options = document.querySelectorAll('.exam-option');
        for (var i = 0; i < options.length; i++) options[i].disabled = true;

        var isCorrect = optIdx === q.correct;
        if (isCorrect) examState.score += 25;
        examState.answers.push({ section: examState.currentSection, q: examState.currentQ, selected: optIdx, correct: q.correct, isCorrect: isCorrect });

        // 显示反馈
        var feedback = document.getElementById('examFeedback');
        if (feedback) {
            feedback.innerHTML = '<div class="feedback-box ' + (isCorrect ? 'correct' : 'wrong') + '">' +
                (isCorrect ? '<i class="fa-solid fa-check-circle"></i> 正确！' : '<i class="fa-solid fa-times-circle"></i> 错误') +
                '<p style="margin-top:8px">' + q.explain + '</p></div>';
        }

        // 高亮正确答案
        var correctBtn = options[q.correct];
        if (correctBtn) correctBtn.style.borderColor = 'var(--success)';
        if (!isCorrect) btn.style.borderColor = 'var(--danger)';

        // 自动下一题（2秒后）
        setTimeout(function() {
            examState.currentQ++;
            renderExamQuestion();
        }, 2500);
    } catch(e) {
        console.error('提交考试答案错误:', e);
        showToast('error', '考试答题出现问题，请刷新页面重试');
    }
}

function completeExam() {
    examState.active = false;
    if (examState.countdown) clearInterval(examState.countdown);
    
    var totalQ = 0;
    for (var s = 0; s < examState.exam.sections.length; s++) totalQ += examState.exam.sections[s].questions.length;
    var percent = Math.round((examState.score / (totalQ * 25)) * 100);
    var stars = percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 60 ? 1 : 0;
    
    // 保存成绩
    try {
        var records = typeof trainingRecords !== 'undefined' ? trainingRecords : [];
        records.push({
            type: 'exam', date: new Date().toLocaleString('zh-CN'),
            score: examState.score, total: totalQ * 25, percent: percent, stars: stars,
            duration: formatTime(Math.floor((Date.now() - examState.startTime)/1000))
        });
        if (typeof saveRecords === 'function') saveRecords();
    } catch(e) {}
    
    var container = document.getElementById('examContent');
    if (container) {
        container.innerHTML = '<div class="exam-result">' +
            '<div class="result-icon">' + (stars >= 2 ? '<i class="fa-solid fa-trophy" style="color:#FFD700;font-size:64px"></i>' : '<i class="fa-solid fa-clipboard-check" style="color:var(--primary);font-size:64px"></i>') + '</div>' +
            '<h2>考试完成！</h2>' +
            '<div class="result-score">' + examState.score + ' / ' + (totalQ*25) + '</div>' +
            '<div class="result-stars">' + '<i class="fa-solid fa-star" style="color:' + (stars > 0 ? '#FFD700' : 'var(--border)') + '"></i> '.repeat(3) + '</div>' +
            '<p style="margin:16px 0">' + (percent >= 90 ? '优秀！你已具备良好的急救知识基础。' : percent >= 60 ? '合格！建议加强薄弱环节的练习。' : '未通过。建议重新学习各模块后再考试。') + '</p>' +
            generateErrorAnalysis() +
            '<div style="margin-top:24px;display:flex;gap:12px">' +
                '<button class="btn btn-primary" onclick="startExam(\'exam_full\')"><i class="fa-solid fa-rotate-right"></i> 重新考试</button>' +
                '<button class="btn btn-outline" onclick="switchPage(\'home\')"><i class="fa-solid fa-house"></i> 返回首页</button>' +
            '</div></div>';
    }
}

function generateErrorAnalysis() {
    var wrong = examState.answers.filter(function(a) { return !a.isCorrect; });
    if (wrong.length === 0) return '<div class="card" style="margin:16px 0;padding:16px;background:rgba(67,160,71,.1);border-color:var(--success)"><i class="fa-solid fa-check-circle" style="color:var(--success)"></i> 全部正确，没有错误！</div>';
    
    var html = '<div class="card" style="margin:16px 0;padding:16px"><h4><i class="fa-solid fa-chart-bar" style="color:var(--primary)"></i> 错误分析</h4>';
    for (var i = 0; i < wrong.length; i++) {
        html += '<div style="padding:12px 0;border-bottom:1px solid var(--border)"><small style="color:var(--text-secondary)">第' + (i+1) + '题</small><p>你的答案：' + wrong[i].selected + ' → 正确答案：' + wrong[i].correct + '</p></div>';
    }
    html += '</div>';
    return html;
}

// ============================================================
// 第十九部分：AI场景对话
// ============================================================
var roleplayState = { active: false, role: null, messages: [], score: 0, evaluated: false };

/**
 * 渲染角色扮演欢迎页
 */
function renderRoleplayWelcome() {
    var container = document.getElementById('roleplayContent');
    if (!container) return;
    var roles = typeof aiRoleplayRoles !== 'undefined' ? aiRoleplayRoles : [];

    var html =
        '<div class="exam-result">' +
            '<div class="result-icon"><i class="fa-solid fa-masks-theater" style="color:var(--primary);font-size:64px"></i></div>' +
            '<h2>AI场景对话</h2>' +
            '<p style="color:var(--text-secondary);margin:16px 0">选择一个急救场景角色，进行沉浸式对话练习。</p>' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:20px">';

    for (var i = 0; i < roles.length; i++) {
        var r = roles[i];
        html += '<div class="card" style="max-width:220px;cursor:pointer;padding:20px;text-align:center;transition:all .3s" ' +
            'onclick="startRoleplay(\'' + r.id + '\')" ' +
            'onmouseover="this.style.borderColor=\'var(--primary)\';this.style.transform=\'translateY(-3px)\'" ' +
            'onmouseout="this.style.borderColor=\'\';this.style.transform=\'\'">' +
            '<div style="font-size:32px;color:var(--primary);margin-bottom:8px"><i class="fa-solid ' + r.avatar + '"></i></div>' +
            '<h4>' + r.title + '</h4>' +
            '<p style="font-size:13px;color:var(--text-secondary)">' + r.description + '</p>' +
        '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
}

function startRoleplay(roleId) {
    var roles = typeof aiRoleplayRoles !== 'undefined' ? aiRoleplayRoles : [];
    var role = null;
    for (var i = 0; i < roles.length; i++) {
        if (roles[i].id === roleId) { role = roles[i]; break; }
    }
    if (!role) { showToast('error', '角色数据未加载'); return; }
    
    roleplayState = { active: true, role: role, messages: [], score: 0, evaluated: false };
    renderRoleplayPage();
    switchPage('roleplay');
}

function renderRoleplayPage() {
    var container = document.getElementById('roleplayContent');
    if (!container || !roleplayState.active) return;
    var role = roleplayState.role;
    
    container.innerHTML =
        '<div class="roleplay-container">' +
            '<div class="roleplay-header">' +
                '<div class="roleplay-avatar"><i class="fa-solid ' + role.avatar + '"></i></div>' +
                '<div><h3>' + role.title + '</h3><p>' + role.description + '</p></div>' +
                '<button class="btn btn-outline" onclick="endRoleplay()" style="margin-left:auto">结束对话</button>' +
            '</div>' +
            '<div class="roleplay-hints"><strong>提示：</strong>' + role.hints.join(' → ') + '</div>' +
            '<div class="chat-messages" id="roleplayMessages">' +
                '<div class="message ai"><div class="message-content">' + role.opening + '</div></div>' +
            '</div>' +
            '<div class="chat-input-area"><div class="chat-input-wrap">' +
                '<input type="text" id="roleplayInput" placeholder="你的回复..." onkeydown="if(event.key===\'Enter\')sendRoleplayMessage()">' +
                '<button class="btn btn-primary" onclick="sendRoleplayMessage()"><i class="fa-solid fa-paper-plane"></i></button>' +
            '</div></div>' +
        '</div>';
}

function sendRoleplayMessage() {
    if (!roleplayState.active) return;
    var input = document.getElementById('roleplayInput');
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    
    var messagesEl = document.getElementById('roleplayMessages');
    if (!messagesEl) return;
    
    // 用户消息
    messagesEl.innerHTML += '<div class="message user"><div class="message-content">' + escapeHTML(msg) + '</div></div>';
    roleplayState.messages.push({ role: 'user', content: msg });
    
    // AI回复（模拟）
    var replies = generateRoleplayReply(msg);
    setTimeout(function() {
        messagesEl.innerHTML += '<div class="message ai"><div class="message-content">' + replies + '</div></div>';
        messagesEl.scrollTop = messagesEl.scrollHeight;
        roleplayState.messages.push({ role: 'ai', content: replies });
    }, 800);
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function generateRoleplayReply(userMsg) {
    var role = roleplayState.role;
    var msg = userMsg.toLowerCase();
    
    if (role.id === 'dispatcher') {
        if (msg.indexOf('地点') > -1 || msg.indexOf('在哪') > -1) return '好的，我已记录地点。现在请告诉我患者的情况——他有没有意识？还有呼吸吗？';
        if (msg.indexOf('没有意识') > -1 || msg.indexOf('不呼吸') > -1) return '了解。他是否有脉搏？你身边有没有其他人可以帮忙取AED？请保持电话不要挂断。';
        if (msg.indexOf('按压') > -1 || msg.indexOf('cpr') > -1 || msg.indexOf('心肺') > -1) return '很好，你做得对。请按照30:2的比例持续按压，我会持续指导你。AED到达后告诉我。';
        return '我理解你的紧张。请先告诉我具体在什么地方？患者大约什么年龄？是什么情况导致的？';
    }
    if (role.id === 'bystander_family') {
        if (msg.indexOf('放心') > -1 || msg.indexOf('没事') > -1 || msg.indexOf('我们') > -1) return '谢谢你...可是他脸色好差，你们确定这样做有用吗？我能帮什么忙吗？';
        if (msg.indexOf('120') > -1 || msg.indexOf('电话') > -1) return '我已经打了120了！他们说要10分钟才到...我该怎么办？';
        if (msg.indexOf('帮忙') > -1 || msg.indexOf('协助') > -1) return '好的，告诉我需要做什么！我愿意帮忙，只要他能好起来...';
        return '请告诉我他到底怎么了？你们是医生吗？他会不会有事？求求你们救救他！';
    }
    if (role.id === 'team_leader') {
        if (msg.indexOf('你') > -1 && (msg.indexOf('拨打') > -1 || msg.indexOf('120') > -1)) return '收到，我马上拨打120！我已经在定位了。';
        if (msg.indexOf('aed') > -1 || msg.indexOf('除颤') > -1) return '好的，我去找AED！我记得大厅有一个，马上回来！';
        if (msg.indexOf('轮换') > -1 || msg.indexOf('换') > -1) return '没问题，我准备好了。你先休息一下，我来接替按压。';
        return '明白！我来做什么？需要我帮忙吗？大家一起配合！';
    }
    return '好的，请继续。';
}

function endRoleplay() {
    if (!roleplayState.active) return;
    roleplayState.evaluated = true;
    
    // 简单评分（基于消息数量和关键词）
    var score = Math.min(100, roleplayState.messages.length * 15);
    var criteria = roleplayState.role.evaluationCriteria;
    
    var container = document.getElementById('roleplayContent');
    if (container) {
        container.innerHTML = '<div class="exam-result">' +
            '<h2>对话练习完成</h2>' +
            '<div class="result-score">' + score + '/100</div>' +
            '<div class="card" style="margin:16px 0;padding:16px"><h4>评价标准</h4><ul>' +
            criteria.map(function(c) { return '<li>' + c + '</li>'; }).join('') +
            '</ul></div>' +
            '<p style="color:var(--text-secondary)">提示：完整版将结合AI语义分析进行更精确的评估。</p>' +
            '<button class="btn btn-primary" onclick="startRoleplay(\'' + roleplayState.role.id + '\')" style="margin-top:16px"><i class="fa-solid fa-rotate-right"></i> 再次练习</button>' +
            '<button class="btn btn-outline" onclick="switchPage(\'home\')" style="margin-top:16px"><i class="fa-solid fa-house"></i> 返回首页</button>' +
        '</div>';
    }
    roleplayState.active = false;
}

// ============================================================
// 第二十部分：排行榜
// ============================================================
function renderLeaderboard() {
    var container = document.getElementById('leaderboardContent');
    if (!container) return;
    var data = typeof leaderboardData !== 'undefined' ? leaderboardData : [];
    
    var html = '<div class="leaderboard-container">' +
        '<div class="leaderboard-header"><h3><i class="fa-solid fa-ranking-star" style="color:#FFD700"></i> 急救训练排行榜</h3></div>' +
        '<div class="leaderboard-table">';
    
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
        var rankClass = i < 3 ? 'rank-top' : '';
        html += '<div class="leaderboard-item ' + rankClass + '">' +
            '<div class="rank-num">' + rankIcon + '</div>' +
            '<div class="rank-avatar"><i class="fa-solid ' + d.avatar + '"></i></div>' +
            '<div class="rank-info"><div class="rank-name">' + d.name + '</div><div class="rank-detail">CPR ' + d.cpr + '分 | 闯关 ' + d.quiz + '分</div></div>' +
            '<div class="rank-score"><strong>' + d.score + '</strong>分</div>' +
            '<div class="rank-streak"><i class="fa-solid fa-fire" style="color:var(--orange)"></i> ' + d.streak + '天</div>' +
        '</div>';
    }
    
    html += '</div></div>';
    container.innerHTML = html;
    pageCache['leaderboard'] = html;
}

// ============================================================
// 第二十一部分：特殊场景渲染
// ============================================================
function renderSpecialScenarios() {
    var container = document.getElementById('specialContent');
    if (!container) return;
    var data = typeof specialScenarios !== 'undefined' ? specialScenarios : [];
    
    var html = '<div class="special-container"><h3><i class="fa-solid fa-kit-medical" style="color:var(--primary)"></i> 特殊急救场景</h3><p style="color:var(--text-secondary)">掌握常见急症和意外伤害的急救处理方法。</p><div class="scenario-cards">';
    
    for (var i = 0; i < data.length; i++) {
        var s = data[i];
        html += '<div class="scenario-card" onclick="selectSpecialScenario(\'' + s.id + '\')">' +
            '<div class="sc-icon"><i class="fa-solid ' + s.icon + '"></i></div>' +
            '<h4>' + s.title + '</h4><span class="badge">' + s.difficulty + '</span><p>' + s.description + '</p></div>';
    }
    html += '</div><div id="specialStepContainer" class="hidden"></div></div>';
    container.innerHTML = html;
}

function selectSpecialScenario(id) {
    var data = typeof specialScenarios !== 'undefined' ? specialScenarios : [];
    var scenario = null;
    for (var i = 0; i < data.length; i++) { if (data[i].id === id) { scenario = data[i]; break; } }
    if (!scenario) return;
    
    var container = document.getElementById('specialStepContainer');
    if (!container) return;
    container.classList.remove('hidden');
    
    var html = '<div class="step-list"><h3>' + scenario.title + ' - 操作步骤</h3>';
    for (var j = 0; j < scenario.steps.length; j++) {
        var step = scenario.steps[j];
        html += '<div class="step-item"><div class="step-num">' + (j+1) + '</div><div class="step-content"><strong>' + step.action + '</strong><p>' + step.desc + '</p></div></div>';
    }
    html += '<button class="btn btn-primary" onclick="document.getElementById(\'specialStepContainer\').classList.add(\'hidden\')" style="margin-top:16px"><i class="fa-solid fa-arrow-left"></i> 返回场景列表</button>' +
        '<button class="btn btn-success" onclick="markSpecialCompleted(\'' + scenario.id + '\', \'' + scenario.title.replace(/'/g, "\\'") + '\')" style="margin-top:16px;margin-left:8px"><i class="fa-solid fa-check"></i> 标记完成</button></div>';
    container.innerHTML = html;
}

/**
 * 标记特殊场景为已完成
 */
function markSpecialCompleted(scenarioId, scenarioTitle) {
    var progress = getQuizProgress();
    if (!progress.specialCompleted) progress.specialCompleted = {};
    progress.specialCompleted[scenarioId] = {
        completed: true,
        date: new Date().toISOString()
    };
    setQuizProgress(progress);

    addTrainingRecord({
        type: 'special',
        scenario: scenarioId,
        detail: '完成特殊场景学习: ' + scenarioTitle
    });

    showToast('success', '已标记"' + scenarioTitle + '"为已完成！');

    var btn = document.querySelector('[onclick*="markSpecialCompleted(\'' + scenarioId + '\']"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-check-double"></i> 已完成';
        btn.className = 'btn btn-outline';
    }
}

// ============================================================
// 第二十二部分：新增模块CSS样式（动态注入）
// ============================================================
(function() {
    var extraCSS = document.createElement('style');
    extraCSS.textContent = 
    '.exam-option{display:block;width:100%;padding:14px 18px;margin:8px 0;border:2px solid var(--glass-border);border-radius:14px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:var(--text);font-size:15px;cursor:pointer;text-align:left;transition:all .3s}' +
    '.exam-option:hover{border-color:var(--primary);background:rgba(229,57,53,.06);box-shadow:0 4px 20px rgba(229,57,53,.1);transform:translateY(-1px)}' +
    '.exam-option:disabled{cursor:not-allowed;opacity:.7}' +
    '.feedback-box{padding:16px;border-radius:14px;margin-top:12px;backdrop-filter:blur(10px)}' +
    '.feedback-box.correct{background:rgba(67,160,71,.1);border-left:4px solid var(--success);box-shadow:0 0 16px rgba(67,160,71,.08)}' +
    '.feedback-box.wrong{background:rgba(244,67,54,.1);border-left:4px solid var(--danger);box-shadow:0 0 16px rgba(244,67,54,.08)}' +
    '.exam-result{text-align:center;padding:40px 20px}' +
    '.result-icon{margin-bottom:16px;animation:float 3s ease-in-out infinite}' +
    '.result-score{font-size:48px;font-weight:900;background:linear-gradient(135deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}' +
    '.result-stars{font-size:32px;margin:16px 0;filter:drop-shadow(0 0 8px rgba(255,215,0,.3))}' +
    '.roleplay-container{display:flex;flex-direction:column;height:100%}' +
    '.roleplay-header{display:flex;align-items:center;gap:16px;padding:16px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:14px;border:1px solid var(--glass-border);margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.15)}' +
    '.roleplay-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,rgba(229,57,53,.2),rgba(255,111,0,.1));display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--primary);box-shadow:0 0 16px rgba(229,57,53,.15)}' +
    '.roleplay-hints{padding:12px 16px;background:rgba(255,152,0,.08);border:1px solid rgba(255,152,0,.15);border-radius:12px;margin-bottom:16px;font-size:13px;color:var(--text-secondary)}' +
    '.leaderboard-item{display:flex;align-items:center;gap:16px;padding:14px 16px;border-radius:14px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);margin-bottom:8px;transition:all .3s}' +
    '.leaderboard-item:hover{transform:translateX(4px);box-shadow:0 4px 20px rgba(0,0,0,.12)}' +
    '.leaderboard-item.rank-top{border-color:rgba(255,215,0,.3);background:rgba(255,215,0,.04);box-shadow:0 0 20px rgba(255,215,0,.06)}' +
    '.rank-num{font-size:24px;width:40px;text-align:center}' +
    '.rank-avatar{width:40px;height:40px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center}' +
    '.rank-info{flex:1}' +
    '.rank-name{font-weight:600}' +
    '.rank-detail{font-size:12px;color:var(--text-secondary)}' +
    '.rank-score{font-size:20px;font-weight:700;color:var(--primary)}' +
    '.rank-streak{font-size:13px;color:var(--orange)}' +
    '.special-container{max-width:900px}' +
    '.scenario-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;margin:20px 0}' +
    '.scenario-card{padding:20px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;cursor:pointer;transition:all .3s}' +
    '.scenario-card:hover{border-color:var(--primary);transform:translateY(-3px);box-shadow:0 8px 32px rgba(229,57,53,.12)}' +
    '.sc-icon{font-size:32px;color:var(--primary);margin-bottom:12px;filter:drop-shadow(0 0 8px rgba(229,57,53,.3))}';
    document.head.appendChild(extraCSS);
})();

// ============================================================
// 第二十三部分：DOMContentLoaded 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // 注入骨架屏样式
    var skeletonStyle = document.createElement('style');
    skeletonStyle.textContent = '.skeleton-loading{position:relative}.skeleton-loading::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.03) 50%,transparent 100%);background-size:200% 100%;animation:skeletonLoad 1s ease-in-out infinite;pointer-events:none;z-index:100}@keyframes skeletonLoad{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(skeletonStyle);

    try {
    // 加载API配置
    loadApiConfig();
    updateApiStatus();

    // 加载设置
    loadSettings();

    // 加载主题
    loadTheme();

    // 加载训练记录到内存
    getTrainingRecords();

    // 渲染首页
    renderHomePage();

    // 设置默认页面
    currentPage = 'home';

    } catch(initErr) {
        console.error('[急救教练] 初始化错误:', initErr);
    }

    // 后备隐藏loader
    setTimeout(hideLoader, 1500);
    window.addEventListener('load', function() { setTimeout(hideLoader, 500); });
    setTimeout(hideLoader, 5000);

    // 监听侧边栏overlay点击
    var overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    console.log('[急救教练] 应用初始化完成');

    // 初始化漂浮粒子
    setTimeout(function() { initParticles(); }, 500);

    // 初始化交互效果
    setTimeout(function() {
        initSpotlight();
        initTiltCards();
        initMagneticButtons();
        initBreathTrainer();
    }, 300);

    // 初始化键盘快捷键
    initKeyboardShortcuts();

    // 为所有按钮添加点击音效
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn, .nav-item, .training-card, .home-module-card')) {
            playClickSound();
        }
    });
});

// ============================================================
// 第二十四部分：全局动画增强函数
// ============================================================

/**
 * 卡片交错入场动画
 */
function animateStaggerIn(container, selector, delay) {
    if (!container) return;
    delay = delay || 80;
    var items = container.querySelectorAll(selector);
    for (var i = 0; i < items.length; i++) {
        items[i].style.opacity = '0';
        items[i].style.transform = 'translateY(20px)';
        (function(el, idx) {
            setTimeout(function() {
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, idx * delay);
        })(items[i], i);
    }
}

/**
 * 全局漂浮粒子系统
 */
var particleSystem = null;
function initParticles() {
    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.3 + 0.1
        });
    }

    var animId;
    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(229, 57, 53, ' + p.alpha + ')';
            ctx.fill();
        }
        // 连接线
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(229, 57, 53, ' + (0.08 * (1 - dist / 120)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    }
    draw();
    particleSystem = { stop: function() { if (animId) cancelAnimationFrame(animId); } };
}

/**
 * AI打字机效果
 */
function typewriterEffect(element, text, speed, callback) {
    if (!element) return;
    speed = speed || 30;
    var i = 0;
    element.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor"></span>';
    var textSpan = element.querySelector('.typewriter-text');
    var cursor = element.querySelector('.typewriter-cursor');

    function type() {
        if (i < text.length) {
            textSpan.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            if (cursor) cursor.style.display = 'none';
            if (callback) callback();
        }
    }
    type();
}

/**
 * 成就解锁庆祝动画（彩纸效果）
 */
function showAchievementCelebration(title) {
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;pointer-events:none;display:flex;align-items:center;justify-content:center;flex-direction:column;';

    // 中心弹窗
    var popup = document.createElement('div');
    popup.className = 'achievement-unlock';
    popup.style.cssText = 'background:var(--card);border:2px solid #FFD700;border-radius:20px;padding:32px 48px;text-align:center;box-shadow:0 0 60px rgba(255,215,0,0.2);max-width:320px;';
    popup.innerHTML = '<div style="font-size:48px;margin-bottom:12px;">&#x1F3C6;</div><h3 style="color:#FFD700;font-size:20px;margin-bottom:8px;">成就解锁！</h3><p style="color:var(--text);font-size:16px;font-weight:600;">' + (title || '新成就') + '</p>';
    container.appendChild(popup);

    // 彩纸粒子
    for (var i = 0; i < 40; i++) {
        var confetti = document.createElement('div');
        var colors = ['#e53935', '#ff6f00', '#FFD700', '#1e88e5', '#43a047', '#ec407a'];
        confetti.style.cssText = 'position:absolute;width:8px;height:8px;border-radius:2px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';left:' + (Math.random() * 100) + '%;top:-10px;transform:rotate(' + (Math.random() * 360) + 'deg);';
        container.appendChild(confetti);

        (function(el) {
            var x = (Math.random() - 0.5) * 400;
            var rotate = Math.random() * 720;
            var duration = 1.5 + Math.random() * 1.5;
            el.animate([
                { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                { transform: 'translate(' + x + 'px, ' + (window.innerHeight + 100) + 'px) rotate(' + rotate + 'deg)', opacity: 0 }
            ], { duration: duration * 1000, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' });
        })(confetti);
    }

    document.body.appendChild(container);
    setTimeout(function() { container.remove(); }, 3500);
}

// ============================================================
// 第二十五部分：交互效果增强函数
// ============================================================

/**
 * 3D倾斜卡片系统
 */
function initTiltCards() {
    var cards = document.querySelectorAll('.tilt-card');
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.querySelector('.tilt-glare')) continue;

        var glare = document.createElement('div');
        glare.className = 'tilt-glare';
        card.appendChild(glare);

        card.addEventListener('mousemove', function(e) {
            var rect = this.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = (y - centerY) / centerY * -8;
            var rotateY = (x - centerX) / centerX * 8;
            this.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';

            var glareEl = this.querySelector('.tilt-glare');
            if (glareEl) {
                glareEl.style.background = 'linear-gradient(' + (135 + rotateY * 3) + 'deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    }
}

/**
 * 鼠标聚光灯效果
 */
function initSpotlight() {
    var overlay = document.querySelector('.spotlight-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'spotlight-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
    }

    document.addEventListener('mousemove', function(e) {
        var x = (e.clientX / window.innerWidth) * 100;
        var y = (e.clientY / window.innerHeight) * 100;
        overlay.style.setProperty('--mouse-x', x + '%');
        overlay.style.setProperty('--mouse-y', y + '%');
    });
}

/**
 * 磁性按钮效果
 */
function initMagneticButtons() {
    var buttons = document.querySelectorAll('.magnetic-btn, .btn-primary, .btn-secondary');
    for (var i = 0; i < buttons.length; i++) {
        (function(btn) {
            btn.addEventListener('mousemove', function(e) {
                var rect = this.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                this.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translate(0, 0)';
            });
        })(buttons[i]);
    }
}

/**
 * 音效系统（Web Audio API）
 */
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playClickSound() {
    try {
        var ctx = getAudioContext();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

function playSuccessSound() {
    try {
        var ctx = getAudioContext();
        var notes = [523, 659, 784];
        for (var i = 0; i < notes.length; i++) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = notes[i];
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.3);
        }
    } catch(e) {}
}

function playErrorSound() {
    try {
        var ctx = getAudioContext();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 200;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

/**
 * AED拖拽式贴片交互 - 渲染步骤
 */
function renderAEDDragStep(stepNum) {
    var container = document.getElementById('aedContent');
    if (!container) return;

    var html = '<div class="card" style="padding:24px;text-align:center;">' +
        '<h3 style="margin-bottom:8px;"><i class="fa-solid fa-hand-pointer" style="color:var(--primary)"></i> 贴电极片</h3>' +
        '<p style="color:var(--text-secondary);margin-bottom:20px;">将电极片拖拽到人体对应位置</p>' +
        '<div class="aed-body-diagram" id="aedBody">' +
            '<div class="aed-pad-slot" id="padSlot1" data-position="right"><i class="fa-solid fa-hand"></i><br>右上胸</div>' +
            '<div class="aed-pad-slot" id="padSlot2" data-position="left"><i class="fa-solid fa-hand"></i><br>左下胸</div>' +
        '</div>' +
        '<div class="aed-pad-source" id="padSource">' +
            '<div class="aed-pad-draggable" data-target="padSlot1" draggable="false"><i class="fa-solid fa-heart-pulse"></i><br>电极片1</div>' +
            '<div class="aed-pad-draggable" data-target="padSlot2" draggable="false"><i class="fa-solid fa-heart-pulse"></i><br>电极片2</div>' +
        '</div>' +
        '<p style="margin-top:16px;color:var(--text-muted);font-size:13px;">拖拽电极片到虚线框内</p>' +
    '</div>';

    container.innerHTML = html;
    initAEDDragAndDrop();
}

/**
 * AED拖拽式贴片交互 - 初始化拖拽
 */
function initAEDDragAndDrop() {
    var draggables = document.querySelectorAll('.aed-pad-draggable');
    var slots = document.querySelectorAll('.aed-pad-slot');
    var placedCount = 0;

    function getClientPos(ev) {
        if (ev.touches && ev.touches.length > 0) {
            return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
        }
        if (ev.changedTouches && ev.changedTouches.length > 0) {
            return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
        }
        return { x: ev.clientX, y: ev.clientY };
    }

    function handleDragStart(e, draggable) {
        e.preventDefault();
        var clone = draggable.cloneNode(true);
        clone.classList.add('dragging');
        document.body.appendChild(clone);

        function move(ev) {
            var pos = getClientPos(ev);
            clone.style.left = (pos.x - 30) + 'px';
            clone.style.top = (pos.y - 40) + 'px';

            // 高亮目标区域
            for (var j = 0; j < slots.length; j++) {
                var rect = slots[j].getBoundingClientRect();
                if (pos.x > rect.left && pos.x < rect.right && pos.y > rect.top && pos.y < rect.bottom) {
                    slots[j].classList.add('highlight');
                } else {
                    slots[j].classList.remove('highlight');
                }
            }
        }

        function up(ev) {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
            clone.remove();

            var pos = getClientPos(ev);
            var targetSlot = null;
            for (var j = 0; j < slots.length; j++) {
                var rect = slots[j].getBoundingClientRect();
                if (pos.x > rect.left && pos.x < rect.right && pos.y > rect.top && pos.y < rect.bottom) {
                    targetSlot = slots[j];
                }
                slots[j].classList.remove('highlight');
            }

            var targetNum = draggable.getAttribute('data-target').replace('padSlot', '');
            var expectedPos = targetNum === '1' ? 'right' : 'left';
            if (targetSlot && targetSlot.getAttribute('data-position') === expectedPos) {
                // 放置成功
                targetSlot.classList.add('placed');
                targetSlot.innerHTML = '<i class="fa-solid fa-check" style="color:var(--success);font-size:20px;"></i>';
                draggable.style.opacity = '0.3';
                draggable.style.pointerEvents = 'none';
                playSuccessSound();
                placedCount++;

                if (placedCount >= 2) {
                    setTimeout(function() {
                        showToast('success', '电极片贴放成功！');
                        nextAEDStep();
                    }, 500);
                }
            } else {
                playErrorSound();
                if (targetSlot) {
                    targetSlot.classList.add('interaction-shake');
                    setTimeout(function() { targetSlot.classList.remove('interaction-shake'); }, 400);
                }
            }
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('touchend', up);
    }

    for (var i = 0; i < draggables.length; i++) {
        (function(draggable) {
            draggable.addEventListener('mousedown', function(e) {
                handleDragStart(e, this);
            });
            draggable.addEventListener('touchstart', function(e) {
                e.preventDefault();
                handleDragStart(e, this);
            }, { passive: false });
        })(draggables[i]);
    }
}

/**
 * 呼吸训练交互组件
 */
var breathState = { active: false, phase: 'idle', timer: null, count: 0 };

function initBreathTrainer() {
    var container = document.getElementById('breathTrainer');
    if (!container) return;

    var circle = container.querySelector('.breath-circle');
    var text = container.querySelector('.breath-text');
    var sub = container.querySelector('.breath-sub');
    var timerEl = container.querySelector('.breath-timer');

    if (!circle) return;

    circle.addEventListener('click', function() {
        if (breathState.active) {
            stopBreathTraining();
        } else {
            startBreathTraining(circle, text, sub, timerEl);
        }
    });
}

function startBreathTraining(circle, text, sub, timerEl) {
    breathState.active = true;
    breathState.count = 0;
    circle.classList.add('active');
    text.textContent = '吸气';
    sub.textContent = '跟随圆圈扩张吸气';

    var phases = [
        { name: 'inhale', duration: 4000, text: '吸气', sub: '慢慢吸气...' },
        { name: 'hold', duration: 2000, text: '屏息', sub: '保持呼吸...' },
        { name: 'exhale', duration: 6000, text: '呼气', sub: '缓缓呼气...' }
    ];
    var currentPhase = 0;
    var startTime = Date.now();

    function update() {
        if (!breathState.active) return;
        var elapsed = Date.now() - startTime;
        var phase = phases[currentPhase];
        var remaining = Math.ceil((phase.duration - elapsed) / 1000);

        if (elapsed >= phase.duration) {
            currentPhase = (currentPhase + 1) % phases.length;
            startTime = Date.now();
            phase = phases[currentPhase];

            circle.classList.remove('inhale', 'hold', 'exhale');
            circle.classList.add(phase.name);
            text.textContent = phase.text;
            sub.textContent = phase.sub;

            if (currentPhase === 0) breathState.count++;
        }

        timerEl.textContent = Math.max(0, remaining) + 's';
        breathState.timer = setTimeout(update, 100);
    }

    circle.classList.add('inhale');
    update();
}

function stopBreathTraining() {
    breathState.active = false;
    if (breathState.timer) clearTimeout(breathState.timer);
    var circle = document.querySelector('.breath-circle');
    if (circle) {
        circle.classList.remove('active', 'inhale', 'hold', 'exhale');
    }
}

/* ===========================
 * CPR按压交互系统
 * =========================== */
var cprPressTimestamps = [];
var cprPressListenerActive = false;

function initCPRPressInteraction() {
    if (cprPressListenerActive) return;
    cprPressListenerActive = true;
    cprPressTimestamps = [];

    var circle = document.getElementById('cprCircle');
    if (circle) {
        circle.addEventListener('mousedown', onCPRPress);
        circle.addEventListener('touchstart', onCPRPress, { passive: true });
        circle.addEventListener('mouseup', onCPRRelease);
        circle.addEventListener('touchend', onCPRRelease);
    }

    // 键盘空格按压
    document.addEventListener('keydown', onCPRKeyDown);
    document.addEventListener('keyup', onCPRKeyUp);
}

function removeCPRPressInteraction() {
    if (!cprPressListenerActive) return;
    cprPressListenerActive = false;

    var circle = document.getElementById('cprCircle');
    if (circle) {
        circle.removeEventListener('mousedown', onCPRPress);
        circle.removeEventListener('touchstart', onCPRPress);
        circle.removeEventListener('mouseup', onCPRRelease);
        circle.removeEventListener('touchend', onCPRRelease);
    }

    document.removeEventListener('keydown', onCPRKeyDown);
    document.removeEventListener('keyup', onCPRKeyUp);
}

function onCPRPress(e) {
    if (e.type === 'touchstart') e.preventDefault();
    var circle = document.getElementById('cprCircle');
    if (circle) circle.classList.add('pressing');

    var now = Date.now();
    cprPressTimestamps.push(now);
    // 只保留最近10次按压
    if (cprPressTimestamps.length > 10) cprPressTimestamps.shift();

    // 计算实际BPM
    if (cprPressTimestamps.length >= 2) {
        var intervals = [];
        for (var i = 1; i < cprPressTimestamps.length; i++) {
            intervals.push(cprPressTimestamps[i] - cprPressTimestamps[i - 1]);
        }
        var avgInterval = intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length;
        var actualBPM = Math.round(60000 / avgInterval);
        updateCPRPressFeedback(actualBPM);
    }

    // 增加按压计数
    cprCount++;
    var countEl = document.getElementById('cprPressCount');
    if (countEl) countEl.textContent = cprCount;

    // 触发按压音效
    try {
        if (typeof playClickSound === 'function') playClickSound();
    } catch(e) {}
}

function onCPRRelease() {
    var circle = document.getElementById('cprCircle');
    if (circle) circle.classList.remove('pressing');
}

function onCPRKeyDown(e) {
    if (e.code === 'Space' && cprIsRunning && !e.repeat) {
        e.preventDefault();
        onCPRPress(e);
    }
}

function onCPRKeyUp(e) {
    if (e.code === 'Space' && cprIsRunning) {
        onCPRRelease();
    }
}

function updateCPRPressFeedback(actualBPM) {
    var feedbackEl = document.getElementById('cprPressFeedback');
    if (!feedbackEl) return;

    var status, text, icon;
    if (actualBPM >= 100 && actualBPM <= 120) {
        status = 'perfect';
        text = '节奏完美！' + actualBPM + ' 次/分';
        icon = '\u2705';
    } else if (actualBPM > 120) {
        status = 'too-fast';
        text = '太快了！' + actualBPM + ' 次/分，请放慢';
        icon = '\u26A0\uFE0F';
    } else {
        status = 'too-slow';
        text = '太慢了！' + actualBPM + ' 次/分，请加快';
        icon = '\u26A0\uFE0F';
    }

    feedbackEl.className = 'cpr-feedback-bar ' + status;
    feedbackEl.innerHTML = icon + ' ' + text;

    // 3秒后清除
    if (feedbackEl._clearTimer) clearTimeout(feedbackEl._clearTimer);
    feedbackEl._clearTimer = setTimeout(function() {
        feedbackEl.className = 'cpr-feedback-bar';
        feedbackEl.innerHTML = '按 <kbd>空格</kbd> 或点击圆圈模拟按压';
    }, 3000);
}

/* ===========================
 * 全局键盘快捷键系统
 * =========================== */
function initKeyboardShortcuts() {
    var keyMap = {
        'Digit1': 'home',
        'Digit2': 'cpr',
        'Digit3': 'heimlich',
        'Digit4': 'aed',
        'Digit5': 'quiz',
        'Digit6': 'coach',
        'Digit7': 'exam',
        'Digit8': 'progress',
        'Digit9': 'settings'
    };

    document.addEventListener('keydown', function(e) {
        // 忽略输入框中的快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        // 数字键切换页面
        if (keyMap[e.code] && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            switchPage(keyMap[e.code]);
            showToast('info', '切换到' + getPageName(keyMap[e.code]));
            return;
        }

        // ESC关闭侧边栏/弹窗
        if (e.code === 'Escape') {
            var sidebar = document.getElementById('sidebar');
            var modal = document.querySelector('.modal-overlay.show');
            if (modal) {
                closeModal();
            } else if (sidebar && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
            return;
        }

        // M键切换侧边栏
        if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            var sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('show');
            return;
        }

        // T键切换主题
        if (e.code === 'KeyT' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            toggleTheme();
            return;
        }

        // H键显示快捷键帮助
        if (e.code === 'KeyH' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            toggleKeyboardHint();
            return;
        }
    });
}

function getPageName(page) {
    var names = {
        'home': '首页', 'cpr': 'CPR训练', 'heimlich': '海姆立克',
        'aed': 'AED训练', 'quiz': '场景闯关', 'coach': 'AI教练',
        'exam': '模拟考试', 'progress': '学习进度', 'settings': '设置'
    };
    return names[page] || page;
}

function toggleKeyboardHint() {
    var hint = document.getElementById('keyboardHint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'keyboardHint';
        hint.className = 'keyboard-hint';
        hint.innerHTML =
            '<div style="font-weight:700;color:var(--text);margin-bottom:8px;">\u2328; 快捷键</div>' +
            '<div><kbd>1</kbd>-<kbd>9</kbd> 切换页面</div>' +
            '<div><kbd>Space</kbd> CPR按压</div>' +
            '<div><kbd>ESC</kbd> 关闭弹窗</div>' +
            '<div><kbd>M</kbd> 侧边栏</div>' +
            '<div><kbd>T</kbd> 切换主题</div>' +
            '<div><kbd>H</kbd> 显示帮助</div>' +
            '<div><kbd>&larr;</kbd><kbd>&rarr;</kbd> 步骤切换</div>' +
            '<div style="margin-top:8px;color:var(--text-muted);font-size:11px;">按 H 关闭</div>';
        document.body.appendChild(hint);
    }
    hint.classList.toggle('show');
}