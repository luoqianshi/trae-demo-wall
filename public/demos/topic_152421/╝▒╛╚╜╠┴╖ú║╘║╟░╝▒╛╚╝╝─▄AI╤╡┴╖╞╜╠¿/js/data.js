// ===== 急救教练 - 数据模块 =====

// 训练记录存储
var trainingRecords = [];
try {
    var savedRecords = localStorage.getItem('jjjl_trainingRecords');
    if (savedRecords) trainingRecords = JSON.parse(savedRecords);
} catch(e) {}

function saveRecords() {
    try { localStorage.setItem('jjjl_trainingRecords', JSON.stringify(trainingRecords)); } catch(e) {}
}

// 用户设置
var userSettings = {
    theme: 'dark',
    soundEnabled: true,
    metronomeBPM: 110,
    language: 'zh-CN',
    reminders: true
};
try {
    var savedSettings = localStorage.getItem('jc_settings');
    if (savedSettings) userSettings = JSON.parse(savedSettings);
} catch(e) {}

function saveSettings() {
    try { localStorage.setItem('jc_settings', JSON.stringify(userSettings)); } catch(e) {}
}

// 学习进度
var learningProgress = {
    cpr: { completed: false, score: 0, attempts: 0, lastPractice: null, certificates: [] },
    heimlich: { completed: false, score: 0, attempts: 0, lastPractice: null },
    aed: { completed: false, score: 0, attempts: 0, lastPractice: null },
    quiz: { completed: false, score: 0, attempts: 0, lastPractice: null, currentLevel: 1, stars: {} },
    totalPracticeTime: 0
};
try {
    var savedProgress = localStorage.getItem('jc_progress');
    if (savedProgress) learningProgress = JSON.parse(savedProgress);
} catch(e) {}

function saveProgress() {
    try { localStorage.setItem('jc_progress', JSON.stringify(learningProgress)); } catch(e) {}
}

// CPR训练数据
var cprTrainingData = {
    targetBPM: 110,
    targetDepth: '5-6cm',
    targetRatio: '30:2',
    cycleCount: 0,
    startTime: null,
    pressTimestamps: [],
    isRunning: false
};

// 场景闯关数据 - 20道题目，分4个关卡
var quizScenarios = [
    // 关卡1：基础判断（5题）
    {
        level: 1,
        levelTitle: '紧急判断',
        levelDesc: '学习识别需要急救的情况',
        scene: '你在公园散步，突然看到前方一位老人倒在地上',
        questions: [
            {
                q: '首先应该做什么？',
                options: ['立即拨打120', '摇晃老人确认意识', '开始胸外按压', '寻找AED'],
                correct: 1,
                explain: '发现有人倒地，首先确认意识和呼吸。拍打双肩并大声呼叫"你怎么了？"，观察有无反应和正常呼吸。'
            },
            {
                q: '确认老人无意识且无正常呼吸后，应该？',
                options: ['继续观察等待', '立即开始胸外按压', '先喂水急救', '将其扶起坐下'],
                correct: 1,
                explain: '无意识且无正常呼吸（或仅有喘息）应立即开始CPR。心脏骤停黄金抢救时间仅4分钟。'
            },
            {
                q: '胸外按压的正确位置是？',
                options: ['左侧肋骨', '两乳头连线中点', '胃部中央', '喉咙下方'],
                correct: 1,
                explain: '按压部位在胸骨中下1/3，即两乳头连线中点。按压深度5-6厘米，频率100-120次/分钟。'
            },
            {
                q: 'CPR的按压与人工呼吸比例是？',
                options: ['15:1', '30:2', '50:5', '10:1'],
                correct: 1,
                explain: '成人CPR比例为30次胸外按压配合2次人工呼吸。持续循环直到AED到位或专业人员接手。'
            },
            {
                q: '如果不愿意做人工呼吸怎么办？',
                options: ['不能做CPR', '只做胸外按压也可以', '必须找别人帮忙呼吸', '等医生来'],
                correct: 1,
                explain: '单纯胸外按压（Hands-Only CPR）同样有效，特别是目击的心脏骤停。持续按压比中断按压更好。'
            }
        ]
    },
    // 关卡2：气道急救（5题）
    {
        level: 2,
        levelTitle: '气道急救',
        levelDesc: '掌握气道异物梗阻的处理',
        scene: '在餐厅用餐时，邻桌一位中年人突然双手抓住喉咙，面色青紫',
        questions: [
            {
                q: '患者双手抓住喉咙是什么信号？',
                options: ['胸痛', '气道严重梗阻的国际通用手势', '觉得冷', '想呕吐'],
                correct: 1,
                explain: '双手抓住喉咙是国际通用的气道梗阻求救手势，表示"我无法呼吸"。此时应立即采取行动。'
            },
            {
                q: '意识清醒的成人气道梗阻，首选急救方法是？',
                options: ['拍背', '喂水', '腹部冲击（海姆立克法）', '倒立'],
                correct: 2,
                explain: '意识清醒的成人和1岁以上儿童，应立即实施海姆立克腹部冲击法。'
            },
            {
                q: '海姆立克法冲击的部位是？',
                options: ['胸部中央', '肚脐正上方两横指', '肋骨两侧', '腰部两侧'],
                correct: 1,
                explain: '拳眼放在肚脐上方两横指（胸骨下方），向内向上快速冲击，利用气流将异物排出。'
            },
            {
                q: '1岁以下婴儿气道梗阻应该？',
                options: ['使用海姆立克法', '拍背5次+胸部按压5次交替', '腹部冲击', '倒立抖动'],
                correct: 1,
                explain: '婴儿不能用腹部冲击（可能损伤肝脏），应采用拍背5次和胸部按压5次交替的方法。'
            },
            {
                q: '多次冲击后异物仍未排出且患者失去意识，应该？',
                options: ['继续冲击', '立即平放开始CPR', '放弃急救', '将其扶起'],
                correct: 1,
                explain: '患者失去意识后应立即平放，开始心肺复苏并拨打120。CPR过程中每次打开口腔检查是否有异物。'
            }
        ]
    },
    // 关卡3：AED使用（5题）
    {
        level: 3,
        levelTitle: 'AED操作',
        levelDesc: '学会使用自动体外除颤器',
        scene: '办公室同事突然倒地无意识无呼吸，你已开始CPR，旁边有一台AED',
        questions: [
            {
                q: '使用AED时，电极片分别贴在？',
                options: ['胸部两侧', '右锁骨下+左腋下肋间', '腹部和背部', '任意位置即可'],
                correct: 1,
                explain: '一片贴在右锁骨下方（右胸上部），另一片贴在左腋前线第五肋间（左胸侧面），避开胸骨。'
            },
            {
                q: 'AED分析心律时你应该？',
                options: ['继续按压', '确保所有人离开患者', '给患者做人工呼吸', '检查电极片'],
                correct: 1,
                explain: 'AED分析心律时任何人接触患者都会干扰分析。必须大喊"所有人离开！不要碰患者！"'
            },
            {
                q: 'AED显示"不建议除颤"时应该？',
                options: ['强制按下除颤按钮', '立即继续CPR', '关掉AED', '等待再次分析'],
                correct: 1,
                explain: '"不建议除颤"说明心律不适合电击，应立即恢复CPR。2分钟后AED会自动再次分析。'
            },
            {
                q: '关于AED，以下哪项是正确的？',
                options: ['AED可以电击正常心律的人', '湿水环境中也可以使用AED', 'AED对心脏停搏无效时可强行除颤', '儿童需要使用儿童电极片或模式'],
                correct: 3,
                explain: 'AED不会电击不需要除颤的心律。使用前需擦干胸部。部分AED有儿童模式或专用儿童电极片。'
            },
            {
                q: '除颤后应该？',
                options: ['等待患者醒来', '立即继续CPR', '再次按下除颤按钮', '取下电极片'],
                correct: 1,
                explain: '除颤后立即恢复胸外按压，按照30:2继续CPR。2分钟后AED会再次分析心律。'
            }
        ]
    },
    // 关卡4：综合急救（5题）
    {
        level: 4,
        levelTitle: '综合急救',
        levelDesc: '复杂场景下的急救决策',
        scene: '你在商场购物，听到有人尖叫，跑过去看到一位孕妇倒在地上无意识',
        questions: [
            {
                q: '对孕妇进行胸外按压时，按压位置应该如何调整？',
                options: ['不能做CPR', '按压位置稍上移，或左侧倾斜30度后按压', '只能按腹部', '不需要调整'],
                correct: 1,
                explain: '孕晚期（>20周）可将孕妇身体向左倾斜约30度，或将双手从背后环绕按压，避免压迫下腔静脉。'
            },
            {
                q: '溺水者被救上岸后，首先应该？',
                options: ['立即排水倒挂', '先检查意识和呼吸', '使劲拍打背部', '喂姜汤'],
                correct: 1,
                explain: '溺水者上岸后应先检查意识和呼吸。不要浪费时间排水（实际上水在肺部不会阻塞气道），无呼吸立即开始CPR。'
            },
            {
                q: '大规模出血时，首先应该？',
                options: ['使用止血带', '直接压迫伤口', '涂抹止血药', '抬高患肢'],
                correct: 1,
                explain: '严重出血先用干净布料或衣物直接用力压迫伤口。压迫无效时再考虑止血带，并记录使用时间。'
            },
            {
                q: '关于急救中的"先救命后治伤"原则，以下做法正确的是？',
                options: ['发现大出血患者先包扎小伤口', '同时处理所有伤情', '先处理危及生命的伤情，再处理其他', '按受伤顺序处理'],
                correct: 2,
                explain: '按优先级处理：1.心跳呼吸骤停→CPR 2.大出血→止血 3.气道梗阻→解除 4.骨折→固定 5.其他伤情'
            },
            {
                q: '给伤员做人工呼吸前，需要做什么准备？',
                options: ['不需要任何准备', '打开气道（仰头抬颏法），检查口腔异物', '先喂水润喉', '先按压腹部'],
                correct: 1,
                explain: '人工呼吸前必须先打开气道：一手压住额头使头后仰，另一手抬起下巴（仰头抬颏法）。检查口腔如有异物取出。'
            }
        ]
    }
];

// 特殊急救场景
var specialScenarios = [
    {
        id: 'drowning',
        title: '溺水急救',
        icon: 'fa-water',
        difficulty: '进阶',
        description: '发现溺水者被救上岸后的急救处理',
        steps: [
            { action: '安全施救', desc: '确保自身安全，使用救生器材或呼叫专业救援，不要贸然下水' },
            { action: '转移患者', desc: '将溺水者安全转移到岸上平坦处' },
            { action: '检查呼吸', desc: '检查意识和呼吸（溺水者可能因喉痉挛有短暂闭气，需观察10秒以上）' },
            { action: '开放气道优先', desc: '溺水者与常规CPR不同：先给予5次初始人工呼吸，每次吹气1秒观察胸廓隆起' },
            { action: '开始CPR', desc: '如5次人工呼吸后仍无反应，立即开始30:2心肺复苏' },
            { action: '持续循环', desc: '持续CPR直到AED到达或患者恢复意识。拨打120时说明是溺水' }
        ]
    },
    {
        id: 'electric',
        title: '触电急救',
        icon: 'fa-bolt',
        difficulty: '进阶',
        description: '发现有人触电后的紧急处理',
        steps: [
            { action: '断开电源', desc: '立即切断电源开关。无法断电时，用干燥木棍、塑料管等绝缘物挑开电线' },
            { action: '确认脱离', desc: '确认患者已完全脱离电源后方可接触患者，否则用绝缘物检查' },
            { action: '检查伤情', desc: '检查意识和呼吸。触电者可能出现心脏骤停、烧伤、骨折等' },
            { action: 'CPR/AED', desc: '如无意识无呼吸，立即开始CPR并尽快取AED（触电导致心律失常AED非常有效）' },
            { action: '处理烧伤', desc: '如患者有意识，用清水冲洗烧伤部位15-20分钟，用干净布料覆盖' },
            { action: '拨打120', desc: '告知是触电事故，高压触电需等专业人员确认断电后方可接近' }
        ]
    },
    {
        id: 'burn',
        title: '烧烫伤急救',
        icon: 'fa-fire',
        difficulty: '基础',
        description: '火焰、热水、热油等烧烫伤的急救处理',
        steps: [
            { action: '冲冷水', desc: '立即用流动冷水冲洗伤口15-20分钟，降低局部温度' },
            { action: '脱除衣物', desc: '冲洗后小心脱去伤处衣物和饰品，有粘连不要硬拽' },
            { action: '浸泡冷敷', desc: '继续在冷水中浸泡15-20分钟，可减轻疼痛和肿胀' },
            { action: '覆盖伤口', desc: '用干净纱布或保鲜膜轻轻覆盖伤口，不要使用棉花等易粘连材料' },
            { action: '送医处理', desc: '面积大于手掌、面部/手部/会阴部烧烫伤、深度烧伤需立即送医' },
            { action: '禁忌提醒', desc: '不要涂牙膏/酱油/面粉等偏方！不要挑破水泡！不要冰敷！' }
        ]
    },
    {
        id: 'heatstroke',
        title: '中暑急救',
        icon: 'fa-sun',
        difficulty: '基础',
        description: '高温环境下出现中暑症状的急救处理',
        steps: [
            { action: '转移患者', desc: '将患者转移到阴凉通风处，解开衣扣、腰带' },
            { action: '物理降温', desc: '用湿毛巾擦拭全身，用电扇或手动扇风加速散热' },
            { action: '补充水分', desc: '意识清醒者少量多次饮用含盐凉水或运动饮料，不要一次大量饮水' },
            { action: '监测意识', desc: '持续观察患者意识状态、呼吸和体温' },
            { action: '重症送医', desc: '意识丧失、体温超40°C、抽搐、无汗→热射病！立即拨打120并持续降温' }
        ]
    },
    {
        id: 'seizure',
        title: '癫痫发作急救',
        icon: 'fa-brain',
        difficulty: '基础',
        description: '目击他人癫痫发作时的正确处理',
        steps: [
            { action: '保持冷静', desc: '癫痫发作通常1-3分钟自行停止，不要惊慌' },
            { action: '保护安全', desc: '清除周围危险物品，可在头部下方垫软物防止碰伤' },
            { action: '切勿强按', desc: '不要强行按压患者四肢或试图往嘴里塞东西！' },
            { action: '侧卧姿势', desc: '将患者翻向一侧（恢复体位），防止呕吐物窒息' },
            { action: '记录时间', desc: '记录发作持续时间。如超过5分钟或连续发作，立即拨打120' },
            { action: '发作后护理', desc: '发作结束后陪伴患者至完全清醒。不要急于给水或食物' }
        ]
    },
    {
        id: 'allergy',
        title: '严重过敏反应急救',
        icon: 'fa-allergies',
        difficulty: '进阶',
        description: '过敏性休克（喉头水肿、呼吸困难、血压骤降）的急救',
        steps: [
            { action: '识别症状', desc: '突发呼吸困难、面部/喉部肿胀、全身荨麻疹、呕吐、头晕、意识模糊' },
            { action: '使用肾上腺素笔', desc: '如患者有肾上腺素自动注射器(EpiPen)，协助其在大腿外侧注射' },
            { action: '拨打120', desc: '过敏性休克是医疗急症，必须立即就医！告知是严重过敏' },
            { action: '平卧抬腿', desc: '让患者平卧，抬高双腿约30度（休克体位），改善脑部供血' },
            { action: '呼吸支持', desc: '如呼吸停止，开始CPR。如有哮喘喷雾，协助使用' },
            { action: '留观等待', desc: '即使症状缓解也可能复发（双相反应），必须在医院观察至少6-12小时' }
        ]
    }
];

// 儿童CPR差异配置
var cprProfiles = {
    adult: { name: '成人', pressDepth: '5-6cm', pressFreq: '100-120次/分', technique: '双手掌根重叠', breathVolume: '每次500-600ml', ratio: '30:2', handPosition: '两乳头连线中点' },
    child: { name: '儿童(1岁-青春期)', pressDepth: '约5cm', pressFreq: '100-120次/分', technique: '单手或双手掌根', breathVolume: '每次吹气至胸廓隆起', ratio: '30:2', handPosition: '两乳头连线中点' },
    baby: { name: '婴儿(<1岁)', pressDepth: '约4cm', pressFreq: '100-120次/分', technique: '两指按压(中指+环指)', breathVolume: '每次 puff 吹气(口对口鼻)', ratio: '30:2(先给5次初始呼吸)', handPosition: '两乳头连线正下方' }
};

// 模拟考试场景
var examScenarios = [
    {
        id: 'exam_full',
        title: '综合急救模拟考试',
        duration: 300, // 5分钟
        sections: [
            {
                type: 'scene',
                title: '场景判断',
                description: '你在商场看到一位中年人突然倒地，你跑过去查看...',
                questions: [
                    { q: '首先应该做什么？', options: ['拨打120', '拍打双肩大声呼叫确认意识', '开始胸外按压', '寻找AED'], correct: 1, explain: '首先确认意识和呼吸状态。' },
                    { q: '确认无意识无正常呼吸后，你的下一步是？', options: ['继续观察', '拨打120并开始CPR', '给患者喂水', '扶起患者'], correct: 1, explain: '心脏骤停需立即CPR并呼叫救援。' }
                ]
            },
            {
                type: 'cpr',
                title: 'CPR操作',
                description: '你开始实施心肺复苏...',
                questions: [
                    { q: '胸外按压的正确频率是？', options: ['60-80次/分', '100-120次/分', '140-160次/分', '80-100次/分'], correct: 1, explain: 'AHA推荐按压频率100-120次/分。' },
                    { q: '成人按压深度应为？', options: ['2-3cm', '3-4cm', '5-6cm', '8-10cm'], correct: 2, explain: '成人按压深度5-6cm，过浅无效过深可能造成损伤。' }
                ]
            },
            {
                type: 'aed',
                title: 'AED操作',
                description: '旁人取来了AED...',
                questions: [
                    { q: 'AED分析心律时你应该？', options: ['继续按压', '离开患者并让所有人不要触碰', '给患者人工呼吸', '检查电极片'], correct: 1, explain: '分析心律时不能触碰患者，否则影响分析。' },
                    { q: '除颤后应立即？', options: ['等待患者醒来', '恢复CPR', '再次除颤', '移除电极片'], correct: 1, explain: '除颤后立即恢复胸外按压。' }
                ]
            }
        ]
    }
];

// AI场景对话角色
var aiRoleplayRoles = [
    {
        id: 'dispatcher',
        title: '120调度员',
        description: '模拟拨打120急救电话的场景',
        avatar: 'fa-headset',
        opening: '您好，120急救中心。请告诉我发生了什么事？',
        hints: ['说清楚地点（具体到门牌号）', '描述患者状况（意识/呼吸/年龄/性别）', '告知正在做的急救措施', '回答调度员的引导问题', '保持电话畅通直到调度员挂断'],
        evaluationCriteria: ['是否提供了准确地址', '是否描述了患者情况', '是否告知了急救措施', '沟通是否清晰有序']
    },
    {
        id: 'bystander_family',
        title: '患者家属',
        description: '模拟向患者家属解释急救措施的沟通场景',
        avatar: 'fa-user-group',
        opening: '天哪！他怎么了？你们在做什么？他会没事吗？',
        hints: ['保持冷静和同理心', '简洁说明情况（心脏骤停）', '解释正在做的急救措施', '安抚家属情绪', '引导家属协助（拨打120/取AED）'],
        evaluationCriteria: ['是否保持了冷静', '是否清晰解释了情况', '是否有效安抚了家属', '是否合理分配了任务']
    },
    {
        id: 'team_leader',
        title: '团队急救指挥',
        description: '模拟多人急救时的团队分工场景',
        avatar: 'fa-people-group',
        opening: '有人倒地了！我们赶紧分工行动。',
        hints: ['指定一人拨打120', '指定一人取AED', '自己开始CPR', '交代清楚各人任务', '2分钟后安排轮换按压者'],
        evaluationCriteria: ['是否迅速分配了任务', '分工是否合理', '是否安排了按压轮换', '沟通是否高效清晰']
    }
];

// 薄弱点诊断规则
var weaknessRules = [
    { id: 'cpr_too_fast', module: 'cpr', condition: 'avg_bpm > 130', message: '你的按压频率偏快，超过130次/分。建议练习时放慢节奏，想象一首中等节拍的歌。', suggestion: '练习CPR训练模块，将BPM设为100开始逐步适应。' },
    { id: 'cpr_too_slow', module: 'cpr', condition: 'avg_bpm < 90', message: '你的按压频率偏慢，低于90次/分。保持稳定的按压节奏非常重要。', suggestion: '跟着节拍器练习，从100BPM开始逐渐提速。' },
    { id: 'cpr_short_duration', module: 'cpr', condition: 'duration < 60', message: '你的训练时长偏短（不到1分钟）。实际急救需要持续按压直到AED到达或患者恢复。', suggestion: '尝试完成至少2分钟（约200次按压）的连续训练。' },
    { id: 'heimlich_wrong_order', module: 'heimlich', condition: 'wrong_step_order > 2', message: '你在海姆立克操作步骤顺序上出现较多错误。', suggestion: '重新复习海姆立克各场景的步骤顺序，注意"确认梗阻→告知→握拳→冲击→检查"的基本流程。' },
    { id: 'aed_shock_wrong', module: 'aed', condition: 'aed_shock_without_prompt > 0', message: '你在AED未提示除颤时按下了按钮。', suggestion: '记住：只有AED明确提示"建议除颤"时才按下按钮。AED不会误伤患者。' },
    { id: 'quiz_basic_weak', module: 'quiz', condition: 'level_1_score < 60', message: '你的基础急救判断能力需要加强。', suggestion: '重新学习"紧急判断"关卡，重点关注确认意识和呼吸的方法。' },
    { id: 'quiz_aed_weak', module: 'quiz', condition: 'level_3_score < 70', message: '你的AED操作知识有待提高。', suggestion: '复习AED训练模块，重点理解"分析心律时离开患者"的原则。' }
];

// 排行榜（模拟数据）
var leaderboardData = [
    { name: '急救达人张三', score: 2850, cpr: 98, quiz: 100, streak: 15, avatar: 'fa-user-nurse' },
    { name: '红十字李四', score: 2720, cpr: 95, quiz: 96, streak: 12, avatar: 'fa-user-doctor' },
    { name: '急救员王五', score: 2680, cpr: 92, quiz: 94, streak: 10, avatar: 'fa-user-shield' },
    { name: '学习者赵六', score: 2450, cpr: 88, quiz: 90, streak: 8, avatar: 'fa-user-graduate' },
    { name: '新手周七', score: 2100, cpr: 80, quiz: 85, streak: 5, avatar: 'fa-user' }
];

// ===== 成就徽章系统 =====
var achievements = [
    { id: 'first_cpr', icon: 'fa-heart-pulse', title: '初次按压', desc: '完成第一次CPR训练', condition: 'cpr_count >= 1', unlocked: false },
    { id: 'cpr_5min', icon: 'fa-clock', title: '持久战', desc: 'CPR训练累计达到5分钟', condition: 'cpr_total_time >= 300', unlocked: false },
    { id: 'cpr_perfect', icon: 'fa-bullseye', title: '完美节奏', desc: 'CPR训练BPM准确率>=95%', condition: 'cpr_accuracy >= 95', unlocked: false },
    { id: 'heimlich_all', icon: 'fa-hand-fist', title: '海姆立克达人', desc: '完成全部海姆立克场景', condition: 'heimlich_all_done', unlocked: false },
    { id: 'aed_master', icon: 'fa-bolt', title: 'AED操作员', desc: '完成AED训练全部步骤', condition: 'aed_completed', unlocked: false },
    { id: 'quiz_perfect', icon: 'fa-trophy', title: '满分学霸', desc: '闯关获得满分', condition: 'quiz_perfect', unlocked: false },
    { id: 'quiz_all_stars', icon: 'fa-star', title: '全星通关', desc: '所有关卡获得3星', condition: 'quiz_all_3stars', unlocked: false },
    { id: 'exam_pass', icon: 'fa-file-pen', title: '考试合格', desc: '模拟考试达到60分以上', condition: 'exam_score >= 60', unlocked: false },
    { id: 'exam_perfect', icon: 'fa-award', title: '考试满分', desc: '模拟考试获得满分', condition: 'exam_score >= 100', unlocked: false },
    { id: 'streak_7', icon: 'fa-fire', title: '七日之约', desc: '连续7天练习', condition: 'streak >= 7', unlocked: false },
    { id: 'streak_30', icon: 'fa-fire-flame-curved', title: '月度坚持', desc: '连续30天练习', condition: 'streak >= 30', unlocked: false },
    { id: 'all_modules', icon: 'fa-medal', title: '全能急救员', desc: '完成所有训练模块', condition: 'all_modules_done', unlocked: false },
    { id: 'special_all', icon: 'fa-kit-medical', title: '特殊场景专家', desc: '学习全部特殊急救场景', condition: 'special_all_done', unlocked: false },
    { id: 'roleplay_done', icon: 'fa-comments', title: '沟通达人', desc: '完成AI场景对话练习', condition: 'roleplay_done', unlocked: false },
    { id: 'daily_10', icon: 'fa-calendar-check', title: '挑战达人', desc: '完成10次每日挑战', condition: 'daily_count >= 10', unlocked: false },
    { id: 'knowledge_10', icon: 'fa-book-open', title: '知识探索者', desc: '阅读10篇急救知识文章', condition: 'articles_read >= 10', unlocked: false },
    { id: 'level_5', icon: 'fa-shield-heart', title: '高级急救员', desc: '达到5级', condition: 'level >= 5', unlocked: false },
    { id: 'level_10', icon: 'fa-user-nurse', title: '急救专家', desc: '达到10级', condition: 'level >= 10', unlocked: false }
];

// 经验值和等级配置
var levelConfig = [
    { level: 1, title: '急救新手', exp: 0, icon: 'fa-seedling' },
    { level: 2, title: '急救学员', exp: 100, icon: 'fa-leaf' },
    { level: 3, title: '初级急救员', exp: 300, icon: 'fa-hand-holding-medical' },
    { level: 4, title: '中级急救员', exp: 600, icon: 'fa-user-shield' },
    { level: 5, title: '高级急救员', exp: 1000, icon: 'fa-shield-heart' },
    { level: 6, title: '急救教官', exp: 1500, icon: 'fa-chalkboard-user' },
    { level: 7, title: '急救专家', exp: 2500, icon: 'fa-user-nurse' },
    { level: 8, title: '高级急救专家', exp: 4000, icon: 'fa-user-doctor' },
    { level: 9, title: '急救大师', exp: 6000, icon: 'fa-staff-snake' },
    { level: 10, title: '急救传奇', exp: 10000, icon: 'fa-crown' }
];

// 每日挑战数据
var dailyChallengePool = [
    { type: 'quiz', content: '完成"紧急判断"关卡', exp: 20, moduleId: 'quiz', taskId: 'level_1' },
    { type: 'quiz', content: '完成"气道急救"关卡', exp: 20, moduleId: 'quiz', taskId: 'level_2' },
    { type: 'quiz', content: '完成"AED操作"关卡', exp: 25, moduleId: 'quiz', taskId: 'level_3' },
    { type: 'cpr', content: '完成2分钟CPR训练', exp: 30, moduleId: 'cpr', taskId: 'cpr_2min' },
    { type: 'cpr', content: '完成CPR训练且BPM准确率>=90%', exp: 35, moduleId: 'cpr', taskId: 'cpr_acc_90' },
    { type: 'heimlich', content: '学习"成人意识清醒梗阻"场景', exp: 20, moduleId: 'heimlich', taskId: 'adult_conscious' },
    { type: 'heimlich', content: '学习"婴儿气道异物梗阻"场景', exp: 25, moduleId: 'heimlich', taskId: 'baby_choking' },
    { type: 'aed', content: '完成AED训练全部步骤', exp: 30, moduleId: 'aed', taskId: 'aed_complete' },
    { type: 'special', content: '学习"溺水急救"场景', exp: 20, moduleId: 'special', taskId: 'drowning' },
    { type: 'special', content: '学习"烧烫伤急救"场景', exp: 20, moduleId: 'special', taskId: 'burn' },
    { type: 'special', content: '学习"严重过敏急救"场景', exp: 25, moduleId: 'special', taskId: 'allergy' },
    { type: 'roleplay', content: '完成一次120调度员对话练习', exp: 30, moduleId: 'roleplay', taskId: 'dispatcher' },
    { type: 'roleplay', content: '完成一次团队急救指挥练习', exp: 30, moduleId: 'roleplay', taskId: 'team_leader' },
    { type: 'exam', content: '完成模拟考试并获得60分以上', exp: 50, moduleId: 'exam', taskId: 'exam_pass' }
];

// 急救知识库文章
var knowledgeArticles = [
    {
        id: 'cardiac_arrest',
        title: '心脏骤停：你必须知道的一切',
        category: '心肺复苏',
        icon: 'fa-heart-crack',
        summary: '了解心脏骤停的原因、症状和黄金抢救时间窗口',
        content: '<h3>什么是心脏骤停？</h3><p>心脏骤停是指心脏突然停止有效泵血，导致全身器官缺血缺氧。最常见的原因是心室颤动（VF），即心脏电活动紊乱，无法有效收缩。</p><h3>黄金4分钟</h3><p>大脑在心脏骤停4-6分钟后开始发生不可逆损伤，10分钟后脑死亡基本不可逆。因此，目击者立即开始CPR至关重要。每延迟1分钟，生存率下降7-10%。</p><h3>识别心脏骤停</h3><p>突然倒地、无反应、无正常呼吸（或仅有喘息样呼吸）。注意：心跳和脉搏的检查不应超过10秒。</p><h3>生存链</h3><p>1. 早期识别和呼叫120<br>2. 早期CPR<br>3. 早期除颤（AED）<br>4. 早期高级生命支持<br>5. 术后综合护理</p>',
        readTime: 5
    },
    {
        id: 'cpr_technique',
        title: 'CPR正确手法详解',
        category: '心肺复苏',
        icon: 'fa-hand-fist',
        summary: '按压位置、深度、频率、手型的详细图解',
        content: '<h3>按压位置</h3><p>胸骨下半部，两乳头连线中点。不要按压肋骨（会骨折）或剑突（会刺伤内脏）。</p><h3>手部姿势</h3><p>一手掌根放在按压点，另一手重叠在上方，十指交叉扣紧。手指翘起离开胸壁，确保力量集中在掌根。</p><h3>身体姿势</h3><p>双膝跪在患者体侧，肩膀正对按压点上方，双臂伸直，利用上身重量垂直下压。不要用手臂力量推。</p><h3>按压节奏</h3><p>频率100-120次/分钟（大约每秒2次），深度5-6cm。每次按压后让胸廓完全回弹（回弹时间约占按压周期的50%）。</p><h3>常见错误</h3><p>- 按压过浅（<5cm）：无效<br>- 按压过快（>120次/分）：回弹不充分<br>- 按压中断：每次中断超过10秒会显著降低存活率<br>- 身体倾斜：力量分散，深度不够</p>',
        readTime: 6
    },
    {
        id: 'aed_guide',
        title: 'AED使用完全指南',
        category: 'AED操作',
        icon: 'fa-bolt',
        summary: '从开机到除颤的完整流程和注意事项',
        content: '<h3>AED是什么？</h3><p>自动体外除颤器（AED）是一种便携式医疗设备，能自动分析心律，判断是否需要电击除颤。AED设计为非专业人员使用，有语音提示全程引导操作。</p><h3>使用口诀：开-贴-插-析-离-按</h3><p><strong>开</strong>：打开电源<br><strong>贴</strong>：粘贴电极片（右胸+左侧）<br><strong>插</strong>：连接导线<br><strong>析</strong>：分析心律（所有人离开！）<br><strong>离</strong>：确认无人接触患者<br><strong>按</strong>：按下除颤按钮</p><h3>关键注意事项</h3><p>- 水中/潮湿环境：擦干胸部后再使用<br>- 胸毛过多：用力按压电极片或快速剃除<br>- 药物贴片：揭掉后擦干净再贴电极片<br>- 起搏器：电极片至少远离2.5cm<br>- 金属饰品：移除后使用</p>',
        readTime: 5
    },
    {
        id: 'stroke',
        title: '脑卒中（中风）识别与急救',
        category: '常见急症',
        icon: 'fa-brain',
        summary: 'FAST原则快速识别中风，黄金时间窗内送医',
        content: '<h3>什么是脑卒中？</h3><p>脑卒中是大脑血管突然破裂（出血性）或被血栓堵塞（缺血性），导致脑组织损伤。是中国居民第一位死因。</p><h3>FAST原则</h3><p><strong>F</strong>（Face）：面部是否歪斜？让患者微笑<br><strong>A</strong>（Arm）：手臂是否无力下垂？让患者平举双臂<br><strong>S</strong>（Speech）：说话是否含糊不清？让患者说一句话<br><strong>T</strong>（Time）：记录时间，立即拨打120</p><h3>急救要点</h3><p>- 不要等待症状自行缓解<br>- 记录症状出现的准确时间（决定是否可以溶栓）<br>- 让患者平卧，头部稍微抬高<br>- 如呕吐，侧卧防止窒息<br>- 不要喂水喂药</p>',
        readTime: 5
    },
    {
        id: 'bleeding',
        title: '外伤出血急救',
        category: '创伤急救',
        icon: 'fa-droplet',
        summary: '直接压迫、止血带、包扎等止血方法',
        content: '<h3>出血分级</h3><p><strong>轻度</strong>：小伤口，自行止血<br><strong>中度</strong>：较大伤口，需按压止血<br><strong>重度</strong>：动脉出血，喷射状，需立即止血带</p><h3>止血方法</h3><p><strong>直接压迫法</strong>：用干净布料直接用力压住伤口15分钟<br><strong>止血带法</strong>：在伤口近心端5cm处绑扎，记录时间，每30分钟松开1分钟<br><strong>加压包扎法</strong>：纱布覆盖伤口后用绷带加压缠绕</p><h3>注意事项</h3><p>- 不要取出伤口中的异物<br>- 止血带使用不超过2小时<br>- 抬高出血部位（骨折除外）<br>- 重度出血立即拨打120</p>',
        readTime: 4
    },
    {
        id: 'fracture',
        title: '骨折急救与固定',
        category: '创伤急救',
        icon: 'fa-bone',
        summary: '骨折识别、固定方法和搬运原则',
        content: '<h3>骨折识别</h3><p>- 疼痛剧烈、肿胀、畸形<br>- 无法活动受伤部位<br>- 开放性骨折（骨头外露）</p><h3>固定原则</h3><p>- 不要试图复位！<br>- 用硬物（木板、杂志、雨伞）固定骨折上下两个关节<br>- 开放性骨折先用纱布覆盖伤口再固定<br>- 检查远端血液循环（颜色、温度、感觉）<br>- 冰敷减轻肿痛</p><h3>脊柱骨折</h3><p>- 怀疑脊柱骨折时绝对不要移动患者<br>- 等待专业救援带脊柱板来搬运<br>- 不正确的搬运可能导致瘫痪</p>',
        readTime: 4
    },
    {
        id: 'poisoning',
        title: '中毒急救',
        category: '常见急症',
        icon: 'fa-skull-crossbones',
        summary: '食物中毒、药物过量、一氧化碳中毒的处理',
        content: '<h3>食物中毒</h3><p>- 停止食用可疑食物<br>- 呕吐时侧卧防止窒息<br>- 保留呕吐物和剩余食物供化验<br>- 大量呕吐或腹泻时补充口服补液盐<br>- 立即就医</p><h3>药物过量</h3><p>- 保留药瓶和包装<br>- 不要自行催吐<br>- 拨打120，告知药物名称和服用量</p><h3>一氧化碳中毒</h3><p>- 立即开窗通风<br>- 将患者转移到空气新鲜处<br>- 解开衣扣保持呼吸道通畅<br>- 拨打120<br>- 不要在现场使用明火或开关电器</p>',
        readTime: 5
    },
    {
        id: 'anatomy',
        title: '急救解剖学基础',
        category: '基础知识',
        icon: 'fa-person',
        summary: '了解心脏、气管、膈肌的位置和功能',
        content: '<h3>心脏位置</h3><p>心脏位于胸腔中纵隔内，约2/3在身体中线左侧，1/3在右侧。胸外按压的位置（两乳头连线中点）实际上对应的是胸骨下半部、心脏正前方。</p><h3>气管与食道</h3><p>气管在前，食道在后。海姆立克法的原理是通过挤压腹部，使膈肌向上推压，将滞留在气管中的异物"弹"出来。</p><h3>膈肌</h3><p>膈肌是分隔胸腔和腹腔的肌肉，是主要呼吸肌。CPR按压时，胸骨下压会带动膈肌运动，间接推动肺部空气排出。</p><h3>为什么按压胸骨？</h3><p>将心脏夹在胸骨和脊柱之间，按压胸骨时通过增加胸腔内压，同时直接挤压心脏，维持血液循环。</p>',
        readTime: 6
    },
    {
        id: 'choking_children',
        title: '儿童与婴儿急救差异',
        category: '特殊人群',
        icon: 'fa-baby',
        summary: '儿童和婴儿CPR、海姆立克法的差异对比',
        content: '<h3>CPR差异</h3><p><strong>婴儿（<1岁）</strong>：两指按压，深度约4cm，先给5次初始呼吸<br><strong>儿童（1岁-青春期）</strong>：单手或双手按压，深度约5cm<br><strong>成人</strong>：双手按压，深度5-6cm</p><h3>海姆立克差异</h3><p><strong>婴儿</strong>：拍背5次+胸部按压5次交替（不能用腹部冲击！）<br><strong>儿童/成人</strong>：腹部冲击法</p><h3>AED差异</h3><p><strong>儿童</strong>：使用儿童电极片或儿童模式<br><strong>婴儿</strong>：尽量使用手动除颤器，AED作为最后选择</p><h3>为什么婴儿不能用腹部冲击？</h3><p>婴儿肝脏较大且未受肋骨保护，腹部冲击可能导致肝脏破裂。拍背和胸部按压更安全。</p>',
        readTime: 6
    },
    {
        id: 'first_aid_kit',
        title: '家庭急救包配置指南',
        category: '实用工具',
        icon: 'fa-kit-medical',
        summary: '必备物品清单和采购建议',
        content: '<h3>必备物品</h3><p>- 无菌纱布和绷带<br>- 创可贴（多种尺寸）<br>- 三角巾<br>- 弹性绷带<br>- 无菌手套（Nitrile）<br>- 剪刀和镊子<br>- 体温计<br>- 止血粉或止血敷料<br>- 烧伤敷料<br>- 人工呼吸面膜<br>- 小手电<br>- 急救手册</p><h3>建议添加</h3><p>- 肾上腺素笔（过敏体质者）<br>- 退烧药<br>- 口服补液盐<br>- 保温毯<br>- 医用胶带<br>- 碘伏棉棒<br>- 一次性速冷袋</p><h3>存放与检查</h3><p>- 放在儿童不易触及但成人方便拿取的地方<br>- 每3个月检查一次物品有效期<br>- 用完及时补充</p>',
        readTime: 4
    },
    {
        id: 'emergency_call',
        title: '拨打120的正确方式',
        category: '实用工具',
        icon: 'fa-phone',
        summary: '120/119/110/122各号码使用场景和通话要点',
        content: '<h3>120 急救中心</h3><p><strong>何时拨打</strong>：心脏骤停、严重出血、呼吸困难、意识丧失、严重过敏、疑似中风等<br><strong>说什么</strong>：1.准确地址（路名+门牌号+标志性建筑）2.患者情况（意识/呼吸/年龄/性别）3.正在做的急救措施 4.保持电话直到调度员指示挂断</p><h3>119 火警</h3><p><strong>何时拨打</strong>：火灾、爆炸、化学品泄漏<br><strong>说什么</strong>：详细地址、火势大小、有无人员被困、起火物质</p><h3>110 报警</h3><p><strong>何时拨打</strong>：暴力事件、抢劫、人身安全威胁<br><strong>说什么</strong>：地点、事件描述、嫌疑人特征、人员伤亡情况</p><h3>122 交通事故</h3><p><strong>何时拨打</strong>：有人员伤亡的交通事故<br><strong>说什么</strong>：地点、伤亡人数、是否有危化品</p><h3>通话原则</h3><p>- 保持冷静，说普通话<br>- 先说地址再说情况<br>- 不要先挂电话，等调度员指示<br>- 如听不清，大声说"我听不清，请重复"</p>',
        readTime: 5
    },
    {
        id: 'psychological',
        title: '施救者心理调适',
        category: '心理支持',
        icon: 'fa-brain',
        summary: '急救后的心理反应和自我调适方法',
        content: '<h3>常见的心理反应</h3><p>- 反复回想急救场景（闪回）<br>- 睡眠障碍<br>- 焦虑不安<br>- 自责"我当时如果能做得更好..."<br>- 感到无力或沮丧</p><h3>调适方法</h3><p>- 接受自己的情绪反应是正常的<br>- 与家人朋友谈论经历<br>- 写日记记录感受<br>- 保持正常作息<br>- 适当运动<br>- 参加CIT（危机事件压力管理）培训</p><h3>何时寻求专业帮助</h3><p>- 症状持续超过2周<br>- 严重影响日常生活和工作<br>- 出现回避行为（不敢去急救现场附近）<br>- 有自伤或自杀念头</p><h3>记住</h3><p>"你做了你能做的一切。你的行动已经给了患者最好的生存机会。"</p>',
        readTime: 5
    }
];

// 急救包清单
var firstAidKits = {
    home: {
        name: '家庭急救包', icon: 'fa-house',
        items: ['无菌纱布(10x10cm)x10', '弹性绷带x5', '创可贴(多种尺寸)x30', '三角巾x3', '无菌手套(Nitrile)x10', '医用胶带x1', '碘伏棉棒x20', '烧伤敷料x3', '止血粉x1', '人工呼吸面膜x2', '体温计x1', '小剪刀x1', '镊子x1', '小手电x1', '速冷袋x3', '保温毯x1', '退烧药', '口服补液盐', '急救手册']
    },
    car: {
        name: '车载急救包', icon: 'fa-car',
        items: ['无菌纱布x5', '弹性绷带x3', '创可贴x20', '三角巾x2', '无菌手套x5', '医用胶带x1', '剪刀x1', '镊子x1', '止血带x1', '速冷袋x2', '保温毯x1', '手电筒x1', '反光背心x2', '急救手册']
    },
    outdoor: {
        name: '户外急救包', icon: 'fa-mountain',
        items: ['无菌纱布x5', '弹性绷带x3', '三角巾x3', '无菌手套x5', '医用胶带x1', '止血粉x1', '烧伤敷料x2', '碘伏棉棒x10', '镊子+ tick取除器', '别针x5', '速冷袋x2', '保温毯x1', '哨子x1', '手电+备用电池', '急救手册']
    }
};

// 附近AED地图模拟数据
var aedLocations = [
    { name: '市中心医院急诊大厅', address: '人民路1号', lat: 30.274, lng: 120.155, distance: '0.3km', type: 'hospital' },
    { name: '火车站候车大厅', address: '站前路88号', lat: 30.268, lng: 120.162, distance: '0.8km', type: 'station' },
    { name: '万达广场一楼服务台', address: '中山路168号', lat: 30.278, lng: 120.148, distance: '1.2km', type: 'mall' },
    { name: '市政府大厅', address: '市民中心A座', lat: 30.272, lng: 120.152, distance: '1.5km', type: 'government' },
    { name: '全民健身中心', address: '体育路50号', lat: 30.281, lng: 120.170, distance: '2.0km', type: 'gym' },
    { name: '大学城图书馆', address: '学府路1号', lat: 30.265, lng: 120.175, distance: '2.5km', type: 'school' },
    { name: '机场T2航站楼', address: '机场大道1号', lat: 30.295, lng: 120.180, distance: '8.0km', type: 'airport' }
];

// 用户个人急救信息
var personalInfo = {
    bloodType: '', allergies: '', chronicDiseases: '', emergencyContact: '', emergencyPhone: '', medications: '', weight: '', height: '', birthday: ''
};

// 多语言支持
var i18n = {
    'zh-CN': {
        appName: '急救教练',
        tagline: '院前急救技能AI训练平台',
        home: '首页', cpr: 'CPR训练', heimlich: '海姆立克急救', aed: 'AED训练',
        quiz: '场景闯关', coach: 'AI急救教练', progress: '学习进度', settings: '设置',
        special: '特殊急救', exam: '模拟考试', roleplay: 'AI场景对话', leaderboard: '排行榜',
        start: '开始', pause: '暂停', reset: '重置', stop: '停止', save: '保存',
        pressCount: '按压次数', bpm: '频率(次/分)', elapsedTime: '已用时间',
        correct: '正确', wrong: '错误', score: '分数', time: '时间',
        dailyChallenge: '今日挑战', achievements: '成就', level: '等级', exp: '经验值'
    },
    'en': {
        appName: 'First Aid Coach',
        tagline: 'Pre-Hospital First Aid AI Training Platform',
        home: 'Home', cpr: 'CPR Training', heimlich: 'Heimlich', aed: 'AED Training',
        quiz: 'Quiz', coach: 'AI Coach', progress: 'Progress', settings: 'Settings',
        special: 'Special Scenarios', exam: 'Exam', roleplay: 'Roleplay', leaderboard: 'Leaderboard',
        start: 'Start', pause: 'Pause', reset: 'Reset', stop: 'Stop', save: 'Save',
        pressCount: 'Press Count', bpm: 'BPM', elapsedTime: 'Elapsed Time',
        correct: 'Correct', wrong: 'Wrong', score: 'Score', time: 'Time',
        dailyChallenge: 'Daily Challenge', achievements: 'Achievements', level: 'Level', exp: 'EXP'
    }
};
