const state = {
  step: 0,
  currentRecipePath: "recommend",
  foodSource: "cook",
  recordCount: 0,
  cravingGenerated: false,
  customCraving: "",
  planPage: 0,
  activeNutrient: "protein",
  activeNutrientIndex: 5,
  activeMetric: "",
  activeMetricIndex: 5,
  pendingRecordMode: "",
  currentPhotoRecordMode: "camera",
  answers: {
    identity: "本人",
    surgery: "颌面手术",
    day: "6",
    stage: "流质",
    support: [],
    age: "29",
    sex: "女",
    height: "168",
    weight: "58",
    mealSource: "自己做",
    goals: [],
    risks: [],
    taste: "口味清淡",
    avoid: "辛辣、硬颗粒、渣渣食物",
    chronic: "",
  },
  messages: [],
};

const STORAGE_KEY = "healthy-eating-profile-v1";
const DAILY_KEY = "healthy-eating-daily-question-date-v2";

const steps = [
  {
    key: "surgery",
    question: "您目前是哪类病或手术场景？",
    type: "single",
    options: [
      { label: "颌面手术", desc: "口腔黏膜、消肿、咀嚼限制" },
      { label: "胃肠手术", desc: "排气、低渣、易消化" },
      { label: "骨科手术", desc: "补钙、蛋白、活动限制" },
      { label: "甲状腺手术", desc: "吞咽、钙管理" },
      { label: "妇科手术", desc: "补铁、通便、低刺激" },
      { label: "肿瘤术后", desc: "营养密度、食欲支持" },
    ],
  },
  {
    key: "day",
    question: "现在处在什么时间阶段？",
    type: "single",
    options: [
      { label: "术前 3 天内" },
      { label: "术后第 1-3 天" },
      { label: "术后第 4-7 天" },
      { label: "术后第 8-30 天" },
      { label: "术后 30 天以上" },
    ],
  },
  {
    key: "sex",
    question: "患者的性别是？",
    type: "single",
    options: [
      { label: "女" },
      { label: "男" },
      { label: "暂不透露" },
    ],
  },
  {
    key: "age",
    question: "患者的年龄是？",
    type: "input",
    placeholder: "例如：29",
    defaultValue: "29",
    inputMode: "numeric",
  },
  {
    key: "height",
    question: "患者的身高是多少？",
    type: "input",
    placeholder: "例如：168",
    defaultValue: "168",
    inputMode: "numeric",
  },
  {
    key: "weight",
    question: "患者的体重是多少？",
    type: "input",
    placeholder: "例如：58",
    defaultValue: "58",
    inputMode: "decimal",
  },
];

const plans = {
  recommend: [
    {
      time: "早",
      title: "温牛奶燕麦糊 + 蒸蛋羹",
      desc: "燕麦打细煮软，蛋羹过筛，入口温度控制在不烫口。",
      tags: ["早餐", "流质", "高蛋白"],
    },
    {
      time: "午",
      title: "鱼泥豆腐羹 + 南瓜米汤",
      desc: "鱼肉去刺打泥，豆腐压碎同煮，少盐不放葱姜辣椒。",
      tags: ["午餐", "补蛋白", "低刺激"],
    },
    {
      time: "晚",
      title: "鸡肉山药浓汤",
      desc: "鸡胸肉和山药煮熟破壁，少量多次，帮助稳定能量摄入。",
      tags: ["晚餐", "温和", "补能量"],
    },
  ],
  optimize: [
    {
      old: "牛肉面",
      title: "清汤牛肉泥面糊",
      desc: "保留牛肉面满足感，去辣去油，把牛肉和面处理得更细软。",
      tags: ["习惯优化", "更容易接受", "蛋白提升"],
    },
    {
      old: "麻辣烫",
      title: "番茄豆腐鱼泥汤",
      desc: "保留热乎、有味道的汤感，用番茄和香菇提味，避开辣油和渣渣食物。",
      tags: ["低刺激", "少渣", "外卖可备注"],
    },
    {
      old: "炸鸡",
      title: "鸡肉山药浓汤",
      desc: "保留鸡肉香味，改成蒸煮后破壁，减少油脂和咀嚼压力。",
      tags: ["家常改造", "流质", "好入口"],
    },
  ],
  takeout: [
    {
      time: "早",
      title: "便利店：常温牛奶 + 原味酸奶",
      desc: "避开冰饮和酸味过强产品，优先小口慢喝。",
      tags: ["外卖", "快速", "蛋白"],
    },
    {
      time: "午",
      title: "粥店：南瓜粥 + 蒸蛋",
      desc: "备注无辣、少盐、不要葱姜蒜和颗粒配菜。",
      tags: ["可点单", "少渣", "易吞咽"],
    },
    {
      time: "晚",
      title: "汤品店：清炖鸡汤去料",
      desc: "只喝汤或把软烂食材打细，避免啃骨头和粗纤维。",
      tags: ["AI agent 预留", "需判断", "清淡"],
    },
  ],
};

const smartQuestions = [
  {
    q: "今天吞咽有没有比昨天更轻松？",
    r: "你处在第 6 天，吞咽感比“吃了什么”更能判断是否该继续流质。",
    answers: ["更轻松", "差不多", "更难了"],
  },
  {
    q: "今天有没有因为食物颗粒卡住或摩擦创口？",
    r: "如果有，下一餐要把质地再打细，而不是单纯换菜。",
    answers: ["没有", "有一点", "明显不舒服"],
  },
  {
    q: "你今天最难完成的是蛋白、喝水，还是没胃口？",
    r: "这三个会直接决定下一餐是加蛋白、提醒喝水，还是改成少量多餐。",
    answers: ["蛋白", "喝水", "没胃口"],
  },
];

const nutrientData = {
  protein: {
    title: "蛋白质趋势",
    summary: "今日 52g / 目标 70g",
    unit: "g",
    points: [
      { day: "D1", value: 28, reason: "术后刚开始进食，主要是米汤和少量牛奶，蛋白明显不足。", action: "加半份蒸蛋羹或无乳糖奶，先少量多次。" },
      { day: "D2", value: 34, reason: "早餐加了酸奶，但午晚餐仍以粥为主。", action: "午餐加入豆腐脑，保持顺滑质地。" },
      { day: "D3", value: 42, reason: "加入蛋羹后上升，但鱼肉摄入还少。", action: "晚餐尝试鱼泥豆腐羹。" },
      { day: "D4", value: 39, reason: "当天胃口差，晚餐只喝了米汤。", action: "改成高蛋白小份加餐，不追求一餐吃完。" },
      { day: "D5", value: 48, reason: "牛奶、蛋羹和豆腐都有摄入，趋势变稳。", action: "继续保留蛋羹，午餐补鱼泥。" },
      { day: "D6", value: 52, reason: "早餐和午餐有牛奶、蛋羹、鱼泥豆腐羹，但晚餐蛋白偏少。", action: "晚餐加半碗鸡肉山药浓汤，保持流质少渣。" },
      { day: "D7", value: 58, reason: "三餐都有蛋白来源，接近目标。", action: "明天优先稳定到 60g 以上，不急着升级质地。" },
    ],
  },
  carb: {
    title: "碳水趋势",
    summary: "今日 118g / 目标 160g",
    unit: "g",
    points: [
      { day: "D1", value: 76, reason: "只喝米汤，能量不足。", action: "增加南瓜米糊，少量多次补能量。" },
      { day: "D2", value: 92, reason: "白粥摄入增加，但加餐少。", action: "下午加一份燕麦糊。" },
      { day: "D3", value: 110, reason: "三餐都有主食糊，能量更稳。", action: "继续用南瓜、山药提升能量密度。" },
      { day: "D4", value: 98, reason: "午餐吃得少，整体回落。", action: "把午餐拆成两次吃。" },
      { day: "D5", value: 116, reason: "燕麦糊和米汤搭配较稳定。", action: "保持温热顺滑，避免过甜。" },
      { day: "D6", value: 118, reason: "主食稳定，但离目标还有差距。", action: "晚餐浓汤里增加山药或南瓜。" },
      { day: "D7", value: 132, reason: "加餐补上后趋势改善。", action: "明天继续保留一顿加餐。" },
    ],
  },
  fat: {
    title: "脂肪趋势",
    summary: "今日 24g / 上限 40g",
    unit: "g",
    points: [
      { day: "D1", value: 12, reason: "饮食很清淡，脂肪较低。", action: "无需刻意加油，先保证蛋白。" },
      { day: "D2", value: 18, reason: "加入牛奶后略升。", action: "继续避开煎炸和油汤。" },
      { day: "D3", value: 22, reason: "鱼泥和蛋羹带来适量脂肪。", action: "保持在上限内。" },
      { day: "D4", value: 20, reason: "摄入减少，脂肪也下降。", action: "不用额外补油。" },
      { day: "D5", value: 25, reason: "鸡汤摄入后略升。", action: "撇去浮油再喝。" },
      { day: "D6", value: 24, reason: "整体控制良好。", action: "继续少油少盐。" },
      { day: "D7", value: 27, reason: "加了酸奶和鱼泥，仍在安全范围。", action: "外卖时备注不要辣油。" },
    ],
  },
  fiber: {
    title: "膳食纤维趋势",
    summary: "今日 8g / 目标 15g",
    unit: "g",
    points: [
      { day: "D1", value: 3, reason: "术后早期低渣，纤维偏低是正常的。", action: "不急着补粗纤维，避免渣渣食物。" },
      { day: "D2", value: 4, reason: "主食为精细米糊。", action: "可加少量南瓜泥。" },
      { day: "D3", value: 6, reason: "加入南瓜后改善。", action: "观察是否腹胀。" },
      { day: "D4", value: 5, reason: "胃口差导致摄入下降。", action: "继续用蔬菜泥，不吃粗颗粒。" },
      { day: "D5", value: 7, reason: "山药、南瓜摄入增加。", action: "保持细腻质地。" },
      { day: "D6", value: 8, reason: "纤维仍偏低，但符合少渣要求。", action: "若便秘，可用熟梨泥或南瓜泥温和补充。" },
      { day: "D7", value: 9, reason: "软烂蔬果泥增加。", action: "不要直接吃粗纤维菜叶。" },
    ],
  },
  micro: {
    title: "钙 / 锌 / 维 C 趋势",
    summary: "今日综合达成 63%",
    unit: "%",
    points: [
      { day: "D1", value: 35, reason: "初期摄入单一，微量营养素不足。", action: "先从牛奶、蛋羹等温和来源补起。" },
      { day: "D2", value: 42, reason: "加入奶制品后钙有所改善。", action: "继续少量多次。" },
      { day: "D3", value: 50, reason: "鱼肉和豆腐增加，锌和钙提升。", action: "维 C 先选不刺激的来源。" },
      { day: "D4", value: 46, reason: "当天摄入少，综合值回落。", action: "用南瓜、熟梨泥补一点维 C。" },
      { day: "D5", value: 58, reason: "奶、豆腐、鱼泥都有摄入。", action: "保持，不要空腹猛补补剂。" },
      { day: "D6", value: 63, reason: "钙和锌较稳定，维 C 仍偏低。", action: "可尝试少量温和果泥，酸痛就停。" },
      { day: "D7", value: 68, reason: "食物种类更丰富，趋势变好。", action: "继续优先食物来源，补剂按医嘱。" },
    ],
  },
};

const nutrientRanges = {
  protein: { normalRange: { min: 45, max: 75 }, idealRange: { min: 55, max: 70 } },
  carb: { normalRange: { min: 100, max: 180 }, idealRange: { min: 130, max: 165 } },
  fat: { normalRange: { min: 15, max: 42 }, idealRange: { min: 20, max: 34 } },
  fiber: { normalRange: { min: 5, max: 18 }, idealRange: { min: 8, max: 14 } },
  micro: { normalRange: { min: 45, max: 82 }, idealRange: { min: 60, max: 76 } },
};

const keyMetricSets = {
  maxillofacial: {
    swallowComfort: {
      label: "吞咽舒适度",
      title: "吞咽舒适度趋势",
      summary: "今日 7分 / 目标 8分",
      unit: "分",
      normalRange: { min: 5, max: 10 },
      idealRange: { min: 7, max: 10 },
      points: [
        { day: "D1", value: 3, reason: "术后早期疼痛和肿胀明显，吞咽完成度较低。", action: "继续流质、温凉入口，避免一次喝太快。" },
        { day: "D2", value: 4, reason: "肿胀仍在，但温牛奶和米汤能较顺利完成。", action: "保持少量多次，入口温度不要烫。" },
        { day: "D3", value: 5, reason: "蛋羹过筛后摩擦感下降，吞咽更稳定。", action: "继续选择细腻、无颗粒食物。" },
        { day: "D4", value: 5, reason: "当天胃口一般，吞咽舒适度没有明显提升。", action: "不急着升级质地，先稳定摄入。" },
        { day: "D5", value: 6, reason: "鱼泥豆腐羹质地较顺滑，口腔刺激减少。", action: "保留鱼泥、豆腐、蛋羹这类软滑蛋白。" },
        { day: "D6", value: 7, reason: "吞咽疼痛较前几天下降，流质餐完成度提高。", action: "继续保持细腻流质，避免硬颗粒和过烫食物。" },
        { day: "D7", value: 7, reason: "整体趋稳，但仍未到可以随意咀嚼的阶段。", action: "明天仍以半流质过渡为主，不急着吃块状食物。" },
      ],
    },
    oralIrritation: {
      label: "口腔刺激",
      title: "口腔刺激次数",
      summary: "今日 1次 / 理想 0-1次",
      unit: "次",
      normalRange: { min: 0, max: 3 },
      idealRange: { min: 0, max: 1 },
      points: [
        { day: "D1", value: 3, reason: "入口温度和创口敏感度影响较大。", action: "食物放到温凉再入口，避免酸辣。" },
        { day: "D2", value: 2, reason: "减少了刺激调味后，刺痛次数下降。", action: "继续避开辣油、醋和粗颗粒。" },
        { day: "D3", value: 2, reason: "仍有少量食物残渣摩擦不适。", action: "鱼肉、蔬菜类先打细或过滤。" },
        { day: "D4", value: 2, reason: "口腔清洁压力仍在，刺激次数未明显改善。", action: "餐后轻柔漱口，按医嘱使用漱口水。" },
        { day: "D5", value: 1, reason: "少渣流质执行较好，创面摩擦减少。", action: "继续保留少渣、软滑质地。" },
        { day: "D6", value: 1, reason: "今天没有明显硬颗粒，刺激控制较好。", action: "注意外卖备注不要葱姜蒜碎和辣油。" },
        { day: "D7", value: 1, reason: "刺激频率稳定在较低水平。", action: "质地升级时仍要小口试探。" },
      ],
    },
    water: {
      label: "饮水量",
      title: "饮水量趋势",
      summary: "今日 1300ml / 目标 1500ml",
      unit: "ml",
      normalRange: { min: 1000, max: 1800 },
      idealRange: { min: 1400, max: 1700 },
      points: [
        { day: "D1", value: 760, reason: "术后不适导致喝水偏少。", action: "用小杯分次喝，不使用吸管。" },
        { day: "D2", value: 900, reason: "喝水频次增加，但总量仍不足。", action: "每 1-2 小时少量补水。" },
        { day: "D3", value: 1050, reason: "温水和汤羹补充后总量改善。", action: "把汤羹也计入液体摄入，但不要过咸。" },
        { day: "D4", value: 980, reason: "胃口差时饮水量也回落。", action: "用温水、小口慢饮，不要等口渴才喝。" },
        { day: "D5", value: 1200, reason: "餐间补水执行更稳定。", action: "继续分段喝水，避免一次大量灌水。" },
        { day: "D6", value: 1300, reason: "接近目标，但仍有提升空间。", action: "下午和晚间各增加一次小量补水。" },
        { day: "D7", value: 1450, reason: "饮水节奏更稳定，接近理想区间。", action: "保持小口慢饮，不用吸管。" },
      ],
    },
  },
  diabetes: {
    fastingGlucose: {
      label: "空腹血糖",
      title: "空腹血糖趋势",
      summary: "今日 6.3mmol/L / 目标 4.4-7.0",
      unit: "mmol/L",
      normalRange: { min: 3.9, max: 8.0 },
      idealRange: { min: 4.4, max: 7.0 },
      points: [
        { day: "D1", value: 8.2, reason: "前一天晚餐主食偏多，空腹血糖偏高。", action: "晚餐主食减量，优先蔬菜和蛋白。" },
        { day: "D2", value: 7.6, reason: "减少甜饮后有所回落。", action: "继续不喝含糖饮料，早餐增加蛋白。" },
        { day: "D3", value: 7.1, reason: "晚餐控制更好，接近目标上限。", action: "保持晚餐七分饱，避免夜宵。" },
        { day: "D4", value: 7.4, reason: "前一晚主食和水果叠加，略有回升。", action: "水果放在两餐之间，小份食用。" },
        { day: "D5", value: 6.8, reason: "主食定量后血糖更稳定。", action: "继续固定主食份量和进餐顺序。" },
        { day: "D6", value: 6.3, reason: "早餐前血糖已进入较理想范围。", action: "早餐保留蛋白和低升糖主食，不空腹喝甜饮。" },
        { day: "D7", value: 6.5, reason: "整体稳定，波动幅度不大。", action: "继续记录主食量和餐后反应。" },
      ],
    },
    postMealGlucose: {
      label: "餐后血糖",
      title: "餐后2小时血糖",
      summary: "今日 8.4mmol/L / 目标 <10.0",
      unit: "mmol/L",
      normalRange: { min: 5.0, max: 11.0 },
      idealRange: { min: 6.0, max: 9.5 },
      points: [
        { day: "D1", value: 12.2, reason: "精制主食和甜饮叠加，餐后升糖明显。", action: "去掉甜饮，主食减半。" },
        { day: "D2", value: 10.8, reason: "主食减少后有所改善，但仍偏高。", action: "先吃蔬菜和蛋白，再吃主食。" },
        { day: "D3", value: 9.9, reason: "进餐顺序调整后进入可接受范围。", action: "保持主食定量，不额外加点心。" },
        { day: "D4", value: 10.4, reason: "水果与主食距离太近，餐后回升。", action: "水果放到加餐时段，小份吃。" },
        { day: "D5", value: 9.1, reason: "蔬菜、蛋白和主食搭配更均衡。", action: "继续选择杂粮或软饭小份。" },
        { day: "D6", value: 8.4, reason: "餐后血糖控制较好，说明主食量较合适。", action: "保持这一餐结构，避免甜汤和含糖饮料。" },
        { day: "D7", value: 8.8, reason: "小幅波动，仍在较稳范围。", action: "继续观察不同主食对餐后血糖的影响。" },
      ],
    },
    carbPortion: {
      label: "主食量",
      title: "控糖主食量",
      summary: "今日 135g / 理想 110-150g",
      unit: "g",
      normalRange: { min: 90, max: 180 },
      idealRange: { min: 110, max: 150 },
      points: [
        { day: "D1", value: 190, reason: "主食份量偏高，是血糖波动的重要来源。", action: "先减少白米饭、面条等精制主食。" },
        { day: "D2", value: 170, reason: "已有减少，但仍靠近上限。", action: "每餐固定半碗到一小碗主食。" },
        { day: "D3", value: 150, reason: "主食量进入理想区间上沿。", action: "保持，不要同时加甜饮和水果。" },
        { day: "D4", value: 165, reason: "加餐中有额外碳水，导致总量回升。", action: "加餐优先牛奶、鸡蛋或无糖酸奶。" },
        { day: "D5", value: 142, reason: "主食定量执行较好。", action: "继续按餐记录主食份量。" },
        { day: "D6", value: 135, reason: "主食量较适中，有利于餐后血糖平稳。", action: "保持当前份量，搭配足量蛋白和蔬菜。" },
        { day: "D7", value: 140, reason: "整体保持稳定。", action: "关注不同主食的升糖差异。" },
      ],
    },
  },
  iron_deficiency: {
    iron: {
      label: "Fe摄入",
      title: "饮食铁 Fe 摄入",
      summary: "今日 14mg / 目标 15mg",
      unit: "mg",
      normalRange: { min: 8, max: 22 },
      idealRange: { min: 12, max: 18 },
      points: [
        { day: "D1", value: 7, reason: "动物性铁来源较少，整体铁摄入不足。", action: "优先增加瘦肉、鱼、蛋等温和来源。" },
        { day: "D2", value: 9, reason: "加入鸡蛋后略有改善，但吸收效率仍有限。", action: "搭配少量富含维 C 的温和果泥。" },
        { day: "D3", value: 11, reason: "瘦肉泥摄入增加，铁摄入接近正常范围。", action: "继续少量多次补充动物性蛋白。" },
        { day: "D4", value: 10, reason: "当天胃口差，铁摄入略回落。", action: "用肉泥汤或鱼泥羹提高完成度。" },
        { day: "D5", value: 12, reason: "瘦肉、蛋类和豆腐搭配后更稳定。", action: "避免茶、咖啡紧贴正餐影响铁吸收。" },
        { day: "D6", value: 14, reason: "今天 Fe 摄入接近目标，有助于改善恢复期乏力。", action: "下一餐继续保留瘦肉/鱼肉来源，并搭配温和维 C。" },
        { day: "D7", value: 15, reason: "进入理想区间，饮食结构更稳定。", action: "继续规律补充，不需要一次大量进食。" },
      ],
    },
    vitaminC: {
      label: "维C搭配",
      title: "维 C 搭配量",
      summary: "今日 55mg / 目标 60mg",
      unit: "mg",
      normalRange: { min: 35, max: 90 },
      idealRange: { min: 50, max: 80 },
      points: [
        { day: "D1", value: 25, reason: "果蔬摄入少，铁吸收辅助不足。", action: "可选熟梨泥、南瓜泥等温和来源。" },
        { day: "D2", value: 32, reason: "果泥量增加后有所改善。", action: "避免过酸水果刺激胃或口腔。" },
        { day: "D3", value: 42, reason: "温和果蔬泥更稳定。", action: "与含铁餐搭配更合适。" },
        { day: "D4", value: 38, reason: "当天摄入少，维 C 也回落。", action: "少量多次补充，不要空腹大量吃酸水果。" },
        { day: "D5", value: 48, reason: "南瓜、熟梨泥摄入增加。", action: "继续搭配含铁食物。" },
        { day: "D6", value: 55, reason: "已经接近理想区间，有利于非血红素铁吸收。", action: "保持温和果蔬来源，酸痛或反酸时减少。" },
        { day: "D7", value: 62, reason: "维 C 搭配较充分。", action: "继续分散到两餐，不需要一次补很多。" },
      ],
    },
  },
};

const recordDemos = {
  camera: {
    source: "拍摄识别 Demo",
    items: [
      { name: "鱼泥豆腐羹", amount: "180g", status: "推荐", review: "鱼肉和豆腐都是温和蛋白来源，质地打细后适合当前流质阶段，可以保留。" },
      { name: "南瓜米糊", amount: "120g", status: "推荐", review: "能补充主食能量，南瓜泥少渣、顺滑，对恢复期体力维持比较友好。" },
      { name: "蒸蛋羹", amount: "90g", status: "推荐", review: "蛋羹软滑、蛋白质量稳定，建议继续过筛，避免出现小颗粒。" },
      { name: "葱花碎", amount: "少量", status: "建议去掉", review: "碎葱可能摩擦创面，也会增加餐后清洁负担；这餐建议去掉。", unsafe: true, note: "建议去掉" },
    ],
    deltas: { protein: 12, carb: 26, fat: 4, fiber: 2, micro: 8 },
    evaluation: {
      summary: "这餐整体完成度比较好，鱼泥豆腐羹、蒸蛋羹和南瓜米糊同时覆盖了优质蛋白、温和碳水和一部分微量营养素，质地也比较符合当前术后早期少渣、顺滑、易吞咽的要求。",
      adjustment: "需要注意的是葱花碎不太适合当前阶段，虽然用量少，但仍可能摩擦创面或增加口腔清洁负担；建议这餐直接去掉，后续调味尽量选择清淡汤底或食材本身的鲜味。",
      encouragement: "你这餐已经在主动选择更利于恢复的食物了，方向是对的。继续保持“细软、清淡、有蛋白”的组合，每次小幅优化，就能让记录越来越稳定。",
    },
    insights: {
      protein: { reason: "新增鱼泥豆腐羹和蒸蛋羹后，优质蛋白来源增加，今天蛋白摄入更接近目标。", action: "晚餐继续保留半碗鸡肉山药浓汤，质地打细，避免硬颗粒。" },
      carb: { reason: "南瓜米糊补上了主食能量，比单喝汤更稳定。", action: "如果晚餐胃口一般，可以把山药或南瓜加进浓汤里，少量多次喝完。" },
      fat: { reason: "鱼泥、蛋羹带来少量脂肪，但整体仍处在清淡范围。", action: "晚餐继续撇去浮油，不额外加香油或辣油。" },
      fiber: { reason: "南瓜米糊带来温和纤维，但仍符合术后少渣原则。", action: "如果有便秘，可以继续选南瓜泥或熟梨泥，不要直接吃粗纤维菜叶。" },
      micro: { reason: "豆腐、鱼泥和蛋羹让钙、锌等微量营养素有所补充。", action: "维 C 仍优先选温和果泥，口腔酸痛时先暂停酸味水果。" },
    },
  },
  cameraTakeout: {
    source: "外卖单识别 Demo",
    items: [
      { name: "番茄鱼片粥", amount: "1 份约 260g", status: "推荐", review: "鱼片和粥底能提供蛋白与能量，适合外卖中相对温和的选择；建议备注少盐、鱼片去刺。" },
      { name: "蒸蛋", amount: "1 份约 90g", status: "推荐", review: "蒸蛋质地柔软，蛋白质量稳定，对当前恢复阶段比较友好。" },
      { name: "咸菜小碟", amount: "1 份", status: "建议去掉", review: "咸菜通常盐分高、质地偏硬或有渣，可能增加口腔清洁负担；建议不要搭配。", unsafe: true, note: "建议去掉" },
    ],
    deltas: { protein: 10, carb: 30, fat: 3, fiber: 1, micro: 5 },
    evaluation: {
      summary: "这份外卖单整体可以作为恢复期的一餐基础，番茄鱼片粥和蒸蛋能兼顾蛋白、主食能量和软滑质地，比重油重辣的外卖更适合当前阶段。",
      adjustment: "咸菜小碟建议去掉，主要是盐分、残渣和刺激性都不太可控；下单时可以备注少盐、不要辣油、不要咸菜，把鱼片和粥打得更细软会更稳妥。",
      encouragement: "你已经开始用“能不能帮助恢复”的角度筛选外卖了，这一点很好。外卖只要把调味和配菜把控住，也可以做得更温和、更适合恢复。",
    },
    insights: {
      protein: { reason: "外卖单中的鱼片粥和蒸蛋补充了优质蛋白，今天蛋白摄入有所提高。", action: "下一餐继续优先选择鱼、蛋、豆腐等软滑蛋白，避免炸物和硬块肉。" },
      carb: { reason: "粥底补充了主食能量，有助于维持体力。", action: "如果粥量较大，可以分两次吃完，避免一次进食太撑。" },
      fat: { reason: "本单脂肪整体不高，但外卖油盐不可控。", action: "备注少油少盐，不额外加辣油或香油。" },
      fiber: { reason: "本单纤维来源偏少，但当前阶段仍以少渣为主。", action: "如排便偏慢，可用南瓜泥或熟梨泥少量补充。" },
      micro: { reason: "鱼片和蒸蛋提供了部分锌、钙和 B 族营养素。", action: "继续搭配温和果蔬泥，不要用咸菜补味。" },
    },
  },
  cameraLabel: {
    source: "配料表识别 Demo",
    items: [
      { name: "无糖高蛋白酸奶", amount: "150g", status: "可保留，少量", review: "能补充蛋白和钙，但如果口腔酸痛、胃胀或乳糖不耐受，应减少或暂停。" },
      { name: "乳清蛋白", amount: "约 12g 蛋白", status: "推荐", review: "作为补充蛋白可以保留，建议分次加入温水或米糊中，不要一次喝太浓。" },
      { name: "赤藓糖醇/香精", amount: "配料表含有", status: "可保留，少量", review: "少量通常问题不大，但可能引起胀气或口感刺激；恢复期不建议依赖加工食品补充。" },
    ],
    deltas: { protein: 11, carb: 8, fat: 2, fiber: 0, micro: 6 },
    evaluation: {
      summary: "这份配料表显示它可以提供一定蛋白和钙，适合作为摄入不足时的补充，但它仍属于加工食品，不能完全替代鱼泥、蛋羹、豆腐羹这类天然软食。",
      adjustment: "如果有口腔酸痛、腹胀或胃肠不适，建议减少酸奶量，优先把蛋白粉或奶制品分次加入温热、顺滑的食物里；含香精和甜味剂的产品不要连续大量使用。",
      encouragement: "你能主动看配料表是很好的习惯。后续只要把“补充品少量辅助、正餐优先天然软食”作为原则，就能更稳地补足营养。",
    },
    insights: {
      protein: { reason: "高蛋白酸奶和乳清蛋白让今天蛋白摄入更接近目标。", action: "如果正餐吃不下，可以少量分次补充，但仍优先保留蛋羹、鱼泥、豆腐羹。" },
      carb: { reason: "这类产品碳水不高，对主食补充有限。", action: "需要体力时仍要搭配南瓜米糊、山药浓汤或细粥。" },
      fat: { reason: "脂肪摄入增加不多，整体仍较清淡。", action: "继续选择低脂、少添加的产品。" },
      fiber: { reason: "加工蛋白产品几乎不提供膳食纤维。", action: "如需通便，优先用熟梨泥、南瓜泥等少渣来源。" },
      micro: { reason: "奶制品补充了钙，但微量营养素结构仍不完整。", action: "后续用鱼、蛋、豆腐和温和果蔬补齐来源。" },
    },
  },
  cameraCorrected: {
    source: "语音纠正后的拍摄识别 Demo",
    items: [
      { name: "鱼泥豆腐羹", amount: "150g", status: "推荐", review: "语音纠正后份量略少，但仍是温和蛋白来源，适合继续保留。" },
      { name: "南瓜米糊", amount: "180g", status: "推荐", review: "实际摄入量比识别结果更多，能量补充更充分；质地顺滑，适合当前阶段。" },
      { name: "蒸蛋羹", amount: "半份约 50g", status: "推荐", review: "实际摄入量较少，但蛋白质量好，可以作为本餐补充。" },
    ],
    deltas: { protein: 9, carb: 32, fat: 3, fiber: 2, micro: 6 },
    evaluation: {
      summary: "语音纠正后，这餐以南瓜米糊为主要能量来源，鱼泥豆腐羹和少量蒸蛋补充蛋白，整体仍然清淡、细软，比较符合当前恢复阶段。",
      adjustment: "这次修正后没有明显需要去掉的食材。下一餐可以适当把蛋白量补足一点，例如增加半份蛋羹或少量鱼泥豆腐羹。",
      encouragement: "及时纠正识别结果很有价值，真实份量越接近，后面的趋势图和建议就越可靠。你已经在把记录做得更准确了。",
    },
    insights: {
      protein: { reason: "语音纠正后蛋白量低于原识别结果，但仍有鱼泥豆腐羹和少量蛋羹支撑。", action: "晚餐可以再补半份温和蛋白，例如蛋羹、豆腐羹或鸡肉山药浓汤。" },
      carb: { reason: "南瓜米糊实际摄入量增加，主食能量更充足。", action: "继续保持细腻顺滑，避免同时加入甜饮。" },
      fat: { reason: "整体脂肪仍较低，符合清淡原则。", action: "不额外加香油、辣油，汤羹继续撇油。" },
      fiber: { reason: "南瓜米糊提供温和纤维，对排便有一定帮助。", action: "如没有腹胀，可以继续少量保留。" },
      micro: { reason: "豆腐、鱼泥和南瓜让微量营养素有所补充。", action: "下一餐继续搭配温和果蔬泥，不急着吃粗纤维菜叶。" },
    },
  },
  cameraTakeoutCorrected: {
    source: "语音纠正后的外卖单识别 Demo",
    items: [
      { name: "鱼片粥", amount: "半份约 180g", status: "推荐", review: "实际只吃了半份，量更温和；鱼片和粥底仍能提供蛋白与能量。" },
      { name: "蒸蛋", amount: "1 份约 90g", status: "推荐", review: "蒸蛋完整吃完，对补充蛋白有帮助，质地也比较适合。" },
      { name: "咸菜小碟", amount: "未食用", status: "已去掉", review: "语音纠正后确认没有吃咸菜，这是更适合当前恢复阶段的选择。" },
    ],
    deltas: { protein: 8, carb: 22, fat: 3, fiber: 0, micro: 4 },
    evaluation: {
      summary: "纠正后这份外卖实际吃得比较克制，保留了鱼片粥和蒸蛋，去掉了咸菜，整体更清淡，也更贴近当前恢复期需要。",
      adjustment: "这餐已经把主要风险项去掉了。后续点外卖时继续备注少盐、不要咸菜、不要辣油，并优先选择粥、蒸蛋、豆腐羹这类软滑菜品。",
      encouragement: "能在外卖里主动去掉不合适的配菜，非常值得肯定。这样的调整虽然小，但对恢复期舒适度很有帮助。",
    },
    insights: {
      protein: { reason: "蒸蛋和半份鱼片粥提供了蛋白，但总量比原识别略低。", action: "下一餐可补一点豆腐羹、牛奶或肉泥汤。" },
      carb: { reason: "半份粥提供适量能量，避免了外卖一次吃太多。", action: "如果晚些时候饿，可以少量加餐温牛奶或米糊。" },
      fat: { reason: "去掉重口配菜后，脂肪和调味负担都更低。", action: "继续不加辣油、不额外拌酱。" },
      fiber: { reason: "这餐纤维较少，但适合少渣阶段。", action: "如排便偏慢，用熟梨泥或南瓜泥补充。" },
      micro: { reason: "鱼片和蛋类提供部分微量营养素。", action: "下一餐继续搭配温和果蔬泥。" },
    },
  },
  cameraLabelCorrected: {
    source: "语音纠正后的配料表识别 Demo",
    items: [
      { name: "无糖高蛋白酸奶", amount: "80g", status: "可保留，少量", review: "实际只吃了少量，作为蛋白和钙的补充可以接受；若酸痛明显就暂停。" },
      { name: "乳清蛋白", amount: "未添加", status: "已去掉", review: "语音纠正后确认没有额外加蛋白粉，避免了一次蛋白过浓或胀气风险。" },
      { name: "温米糊", amount: "150g", status: "推荐", review: "真实饮食中有温米糊，能补充温和能量，也比单吃加工食品更适合作为正餐基础。" },
    ],
    deltas: { protein: 5, carb: 24, fat: 1, fiber: 1, micro: 3 },
    evaluation: {
      summary: "纠正后这餐不再以加工食品为主，而是少量酸奶搭配温米糊，整体更温和，能量补充也更稳定。",
      adjustment: "少量酸奶可以保留，但如果口腔酸痛或胃胀，建议改成温牛奶、蛋羹或豆腐羹；加工食品和补充粉先作为辅助，不作为主要一餐。",
      encouragement: "把配料表识别结果修正成真实入口内容很关键。你这样记录，后续营养趋势会更贴近实际，也更容易找到适合自己的恢复节奏。",
    },
    insights: {
      protein: { reason: "实际没有额外加入蛋白粉，因此蛋白增加较少。", action: "下一餐可用蛋羹、豆腐羹或鱼泥温和补足。" },
      carb: { reason: "温米糊补上了主食能量，比原配料表判断更接近真实摄入。", action: "继续保持顺滑温热，少量多次。" },
      fat: { reason: "实际脂肪摄入很低，整体清淡。", action: "不需要额外加油，优先提高蛋白完成度。" },
      fiber: { reason: "米糊纤维较少，但符合当前少渣原则。", action: "如需要通便，可少量加入南瓜泥。" },
      micro: { reason: "少量酸奶提供钙，但总量有限。", action: "继续用奶、蛋、豆腐等温和食物补充。" },
    },
  },
  note: {
    source: "文字 / 语音识别 Demo",
    items: [
      { name: "鸡肉山药浓汤", amount: "半碗", status: "推荐", review: "鸡肉补蛋白，山药增加顺滑度和能量；建议继续打细，少油少盐。" },
      { name: "温牛奶", amount: "200ml", status: "推荐", review: "温牛奶能补充蛋白和钙，温度合适即可；如果胀气，可分两次慢慢喝。" },
      { name: "熟梨泥", amount: "80g", status: "可保留，少量", review: "熟梨泥能温和补充一点纤维和水分；量不大可以保留，若口腔酸痛或腹胀就减少。" },
      { name: "辣油", amount: "少量", status: "建议去掉", review: "辣油属于刺激性调味，可能加重口腔或胃肠不适；建议去掉，用番茄汤底或香菇水提味。", unsafe: true, note: "建议去掉" },
    ],
    deltas: { protein: 8, carb: 18, fat: 3, fiber: 1, micro: 6 },
    evaluation: {
      summary: "这餐整体结构比较温和，鸡肉山药浓汤和温牛奶补充了恢复期需要的蛋白与能量，熟梨泥提供少量水分和温和纤维，比较适合作为流质到半流质过渡阶段的一餐。",
      adjustment: "主要需要调整的是辣油。它属于刺激性调味，可能让口腔或胃肠更不舒服；建议去掉，若想增加风味，可以改用少量香菇水、番茄汤底或把山药汤打得更细腻来提升口感。",
      encouragement: "这餐已经有意识地兼顾了蛋白、能量和柔软质地，很值得继续保持。把刺激性调味替换掉后，这套餐食会更贴近当前恢复需求。",
    },
    insights: {
      protein: { reason: "鸡肉山药浓汤和温牛奶补充了蛋白，适合当前流质阶段。", action: "下一餐继续用奶、蛋羹、豆腐或肉泥汤补蛋白，不要急着吃块状肉。" },
      carb: { reason: "山药和熟梨泥补了一部分碳水，能量摄入比只喝汤更完整。", action: "晚餐若仍偏少，可以在浓汤里加山药或南瓜，保持顺滑质地。" },
      fat: { reason: "温牛奶和鸡肉汤带来少量脂肪，整体仍然清淡。", action: "继续少油少盐，汤类先去浮油再喝。" },
      fiber: { reason: "熟梨泥提供了少量温和纤维，对排便更友好。", action: "如果没有腹胀，可以保留熟梨泥或南瓜泥；不要吃渣感明显的水果。" },
      micro: { reason: "温牛奶补钙，鸡肉和梨泥让微量营养素来源更丰富。", action: "继续优先从食物补充，补剂按医嘱，不要空腹猛补。" },
    },
  },
};

const photoRecordLabels = {
  camera: "食材拍照",
  cameraTakeout: "外卖单拍照",
  cameraLabel: "配料表拍照",
  cameraCorrected: "食材拍照语音纠正",
  cameraTakeoutCorrected: "外卖单语音纠正",
  cameraLabelCorrected: "配料表语音纠正",
};

const correctedPhotoRecordModes = {
  camera: "cameraCorrected",
  cameraTakeout: "cameraTakeoutCorrected",
  cameraLabel: "cameraLabelCorrected",
};

const diseaseRules = window.DISEASE_RULES || [];
const fallbackRule = {
  id: "general",
  name: "通用康复饮食",
  aliases: [],
  marker: "康",
  defaultDay: 0,
  texture: "清淡易消化饮食",
  goals: ["优质蛋白", "易消化", "少油少盐"],
  avoid: ["酒精", "辛辣刺激", "油炸", "来源不明补品"],
  question: "今天最影响进食的是胃口、疼痛，还是消化不适？",
  questionReason: "暂未匹配到专属疾病规则，先用通用康复饮食原则，并建议结合医生医嘱。",
  planSubcopy: "暂未收录该疾病，先按通用康复饮食原则生成。",
  recipes: [
    { time: "早", title: "牛奶燕麦 + 蒸蛋", desc: "温和易消化，优先补充蛋白和能量。", tags: ["通用", "蛋白", "清淡"] },
    { time: "午", title: "鸡肉南瓜粥 + 软烂青菜", desc: "少油少盐，兼顾蛋白和主食。", tags: ["易消化", "低油", "软食"] },
    { time: "晚", title: "豆腐鱼片汤 + 软饭", desc: "清淡蛋白来源，避免辛辣油炸。", tags: ["清淡", "蛋白", "恢复"] }
  ],
  takeout: [
    { time: "早", title: "便利店：牛奶 + 鸡蛋", desc: "避开甜饮料和油炸早餐。", tags: ["快手", "蛋白", "清淡"] },
    { time: "午", title: "简餐：鸡肉/鱼肉套餐", desc: "备注少油少盐，酱汁分开放。", tags: ["外卖", "通用", "低油"] },
    { time: "晚", title: "粥店：南瓜粥 + 蒸蛋", desc: "选择清淡软烂，不配辣酱和咸菜。", tags: ["软食", "清淡", "可执行"] }
  ],
  cravings: [
    { old: "重口味外卖", title: "清淡蛋白软饭", desc: "保留饱腹感，先去辣去油去重盐。", tags: ["通用", "低刺激", "蛋白"] },
    { old: "炸物", title: "蒸煮鸡肉土豆泥", desc: "用软烂蒸煮替代油炸，降低恢复负担。", tags: ["少油", "软食", "蛋白"] },
    { old: "甜饮", title: "无糖牛奶燕麦饮", desc: "保留饮品感，减少糖和冰刺激。", tags: ["少糖", "温和", "加餐"] }
  ],
  recovery: [
    { icon: "医", title: "医嘱优先", desc: "未收录疾病先按医生限制执行，App 只给通用饮食辅助。" },
    { icon: "油", title: "少油少辣", desc: "恢复期先避开油炸、辛辣和酒精。" },
    { icon: "记", title: "记录反应", desc: "记录胃口、疼痛、腹胀、排便等反馈，用于后续调整。" }
  ]
};

const extraMealLibrary = {
  recipes: [
    { time: "早", title: "豆腐鸡蛋羹 + 温牛奶", desc: "蛋白更稳，质地软滑，适合多数恢复期早上胃口一般的时候。", tags: ["高蛋白", "软滑", "快手"] },
    { time: "午", title: "番茄鱼片软饭", desc: "用番茄提鲜，不放辣油和重酱，鱼片去刺后更容易执行。", tags: ["优质蛋白", "低刺激", "饱腹"] },
    { time: "晚", title: "山药鸡肉蔬菜粥", desc: "鸡肉打碎，山药和蔬菜煮软，兼顾蛋白、主食和膳食纤维。", tags: ["易消化", "少油", "恢复期"] },
    { time: "早", title: "无糖酸奶燕麦杯", desc: "不冰着吃，燕麦提前泡软，适合想吃得轻一点但不能空腹的时候。", tags: ["加餐", "肠道友好", "能量"] },
    { time: "午", title: "虾仁蒸蛋 + 南瓜泥", desc: "虾仁切碎再蒸，南瓜泥补充碳水和维生素，整体温和好入口。", tags: ["补锌", "软食", "少盐"] },
    { time: "晚", title: "豆腐鸡丝清汤面", desc: "面条煮软剪短，汤底清淡，保留热汤满足感但减少油盐负担。", tags: ["热汤", "蛋白", "清淡"] },
  ],
  takeout: [
    { time: "早", title: "便利店：无糖豆浆 + 茶叶蛋", desc: "优先常温或温热，不选甜豆浆、油条、辣味饭团。", tags: ["外卖", "快手", "蛋白"] },
    { time: "午", title: "粥店：鱼片粥 + 蒸蛋", desc: "备注少盐、不要葱姜辣椒，鱼片能去刺更好。", tags: ["可备注", "低刺激", "软食"] },
    { time: "晚", title: "轻食店：鸡胸南瓜碗", desc: "酱汁分开放，去坚果脆片，主食和蛋白都保留。", tags: ["少油", "可点单", "均衡"] },
    { time: "早", title: "早餐店：小米粥 + 鸡蛋羹", desc: "避开咸菜、辣酱和煎炸主食，优先软烂温热。", tags: ["温热", "清淡", "好买"] },
    { time: "午", title: "简餐店：清蒸鱼/鸡肉套餐", desc: "让商家少油少盐，米饭半份，蔬菜选煮/蒸/烫。", tags: ["套餐", "少盐", "蛋白"] },
    { time: "晚", title: "汤品店：菌菇鸡汤去油版", desc: "喝汤也要吃到鸡肉，浮油撇掉，搭配软饭或粥。", tags: ["热汤", "去油", "恢复"] },
  ],
  cravings: [
    { old: "麻辣烫", title: "番茄清汤豆腐鱼片碗", desc: "保留热汤和丰富配菜，把辣油、麻酱、丸子换成豆腐、鱼片和软蔬菜。", tags: ["去辣", "低油", "可外卖"] },
    { old: "牛肉面", title: "清汤牛肉软面", desc: "保留牛肉和面条满足感，面煮软剪短，汤底不放辣椒和重油。", tags: ["习惯优化", "蛋白", "软食"] },
    { old: "炸鸡", title: "蒸鸡腿土豆泥", desc: "保留鸡肉香味，用蒸煮替代油炸，减少脂肪和咀嚼压力。", tags: ["少油", "高蛋白", "家常"] },
    { old: "奶茶", title: "温牛奶燕麦可可杯", desc: "保留饮品感，去冰、少糖，用牛奶和燕麦补蛋白与能量。", tags: ["少糖", "温和", "加餐"] },
    { old: "火锅", title: "清汤小火锅软菜版", desc: "用清汤锅底，优先豆腐、鱼片、鸡肉和煮软蔬菜，不蘸辣碟。", tags: ["聚餐替代", "可执行", "低刺激"] },
    { old: "烧烤", title: "烤味鸡肉蔬菜软饭", desc: "用少量孜然香气保留烧烤感，去辣去焦边，肉切碎拌软饭。", tags: ["风味保留", "少刺激", "饱腹"] },
  ],
};

const diseaseMealExtras = {
  maxillofacial: {
    recipes: [
      { time: "早", title: "鱼泥豆腐羹 + 温豆浆", desc: "少渣、软滑，不需要明显咀嚼，适合颌面术后早期。", tags: ["少渣", "流质", "高蛋白"] },
      { time: "午", title: "虾仁蛋花米汤", desc: "虾仁打碎，蛋花煮细，补锌同时降低口腔摩擦。", tags: ["补锌", "口腔友好", "温和"] },
      { time: "晚", title: "南瓜鸡蓉羹", desc: "鸡胸肉打蓉，南瓜增加顺滑度和能量，避免辣和粗颗粒。", tags: ["消肿期", "少刺激", "易吞咽"] },
    ],
  },
  gastrointestinal_surgery: {
    recipes: [
      { time: "早", title: "米汤 + 温豆腐脑", desc: "先少量试探，观察腹胀、恶心和排气情况。", tags: ["少量多餐", "低渣", "观察"] },
      { time: "午", title: "胡萝卜鸡蓉粥", desc: "胡萝卜煮烂打细，鸡肉打蓉，低脂且更容易消化。", tags: ["低脂", "软烂", "蛋白"] },
      { time: "晚", title: "土豆鱼肉泥", desc: "鱼肉去刺蒸熟，土豆压泥，不加油炒，减少胃肠负担。", tags: ["半流质", "低油", "温和"] },
    ],
  },
  diabetes: {
    recipes: [
      { time: "早", title: "无糖酸奶 + 鸡蛋 + 小番茄", desc: "先保证蛋白，主食减量，减少早餐后血糖波动。", tags: ["控糖", "蛋白", "低升糖"] },
      { time: "午", title: "鱼肉蔬菜半份饭", desc: "米饭半份，先菜后肉再主食，酱汁单独放。", tags: ["定量", "控糖顺序", "低油"] },
      { time: "晚", title: "鸡肉豆腐蔬菜汤", desc: "晚餐主食少一点，避免睡前血糖继续上扬。", tags: ["晚餐", "控糖", "清淡"] },
    ],
  },
  gout: {
    recipes: [
      { time: "早", title: "牛奶燕麦 + 鸡蛋", desc: "低嘌呤蛋白组合，避免肉汤和海鲜作为早餐蛋白来源。", tags: ["低嘌呤", "蛋白", "补水"] },
      { time: "午", title: "鸡蛋豆腐软饭 + 青菜", desc: "用蛋奶豆制品替代高嘌呤肉汤，少油少盐。", tags: ["低嘌呤", "清淡", "饱腹"] },
      { time: "晚", title: "番茄土豆鸡蛋汤", desc: "不喝浓肉汤，不配酒，晚餐减轻尿酸负担。", tags: ["不喝酒", "低嘌呤", "晚餐"] },
    ],
  },
  ckd: {
    recipes: [
      { time: "早", title: "白粥 + 蛋清羹", desc: "肾病阶段差异很大，先用更保守的优质蛋白和低盐方案。", tags: ["低盐", "优质蛋白", "谨慎"] },
      { time: "午", title: "鸡肉软饭 + 焯水蔬菜", desc: "蔬菜先焯水，蛋白量按医嘱，不盲目高蛋白。", tags: ["控钾", "低盐", "按医嘱"] },
      { time: "晚", title: "冬瓜鸡丝汤 + 小份主食", desc: "汤不做浓汤，避免高盐调味和加工肉。", tags: ["低盐", "清淡", "控量"] },
    ],
  },
  reflux: {
    recipes: [
      { time: "早", title: "温燕麦粥 + 鸡蛋羹", desc: "不空腹喝咖啡和酸饮，减少反酸触发。", tags: ["低酸", "规律", "温和"] },
      { time: "午", title: "鸡肉南瓜软饭", desc: "少油不辣，吃到七分饱，餐后不立刻躺下。", tags: ["少油", "少量", "反流友好"] },
      { time: "晚", title: "豆腐青菜面片汤", desc: "晚餐提前，避免过饱和高脂汤底。", tags: ["早晚餐", "低脂", "清淡"] },
    ],
  },
};

function getExpandedMealList(rule, baseList, mode) {
  const diseaseExtras = diseaseMealExtras[rule.id]?.[mode] || [];
  const generalExtras = extraMealLibrary[mode] || [];
  const merged = [...(baseList || []), ...diseaseExtras, ...generalExtras];
  const seen = new Set();
  return merged.filter((meal) => {
    const key = `${meal.time || meal.old || ""}-${meal.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function matchDiseaseRule(input) {
  const text = normalizeText(input);
  if (!text) return fallbackRule;
  return (
    diseaseRules.find((rule) => {
      const names = [rule.name, ...(rule.aliases || [])].map(normalizeText);
      return names.some((name) => text.includes(name) || name.includes(text));
    }) || fallbackRule
  );
}

function getActiveRule() {
  return matchDiseaseRule(state.answers.surgery);
}

const chatBody = document.querySelector("#chatBody");
const optionGrid = document.querySelector("#optionGrid");
const inputAnswer = document.querySelector("#inputAnswer");
const freeInput = document.querySelector("#freeInput");
const sendAnswer = document.querySelector("#sendAnswer");
const progressText = document.querySelector("#progressText");
const onboardingScreen = document.querySelector("#onboardingScreen");
const appScreen = document.querySelector("#appScreen");
const mealList = document.querySelector("#mealList");
const patientSummary = document.querySelector("#patientSummary");
const patientMark = document.querySelector("#patientMark");
const patientNote = document.querySelector("#patientNote");
const stageEyebrow = document.querySelector("#stageEyebrow");
const flowTitle = document.querySelector("#flowTitle");
const habitCapture = document.querySelector("#habitCapture");
const recommendSource = document.querySelector("#recommendSource");
const mealPlanCard = document.querySelector("#mealPlanCard");
const cookPanel = document.querySelector("#cookPanel");
const takeoutPanel = document.querySelector("#takeoutPanel");
const planHeading = document.querySelector("#planHeading");
const planSubcopy = document.querySelector("#planSubcopy");
const smartQuestion = document.querySelector("#smartQuestion");
const smartReason = document.querySelector("#smartReason");
const healthAnswerOptions = document.querySelector("#healthAnswerOptions");
const skipOnboarding = document.querySelector("#skipOnboarding");
const nutrientTabs = document.querySelector("#nutrientTabs");
const curvePlot = document.querySelector("#curvePlot");
const curveTitle = document.querySelector("#curveTitle");
const curveSummary = document.querySelector("#curveSummary");
const pointDetail = document.querySelector("#pointDetail");
const keyMetricTabs = document.querySelector("#keyMetricTabs");
const metricCurvePlot = document.querySelector("#metricCurvePlot");
const metricCurveTitle = document.querySelector("#metricCurveTitle");
const metricCurveSummary = document.querySelector("#metricCurveSummary");
const metricPointDetail = document.querySelector("#metricPointDetail");
const dietDollWidget = document.querySelector("#dietDollWidget");
const dietDollTrigger = document.querySelector("#dietDollTrigger");
const dietDollCard = document.querySelector("#dietDollCard");
const closeDietDoll = document.querySelector("#closeDietDoll");
const dietDollSummary = document.querySelector("#dietDollSummary");
const dietDollAdvice = document.querySelector("#dietDollAdvice");
const recoveryList = document.querySelector("#recoveryList");
const saveProfile = document.querySelector("#saveProfile");
const foodChatWindow = document.querySelector("#foodChatWindow");
const foodQueryInput = document.querySelector("#foodQueryInput");
const askFoodQuery = document.querySelector("#askFoodQuery");
const openTutorialPrompt = document.querySelector("#openTutorialPrompt");
const tutorialPromptSheet = document.querySelector("#tutorialPromptSheet");
const cancelTutorial = document.querySelector("#cancelTutorial");
const cancelTutorialIcon = document.querySelector("#cancelTutorialIcon");
const cancelTutorialBackdrop = document.querySelector("#cancelTutorialBackdrop");
const confirmTutorial = document.querySelector("#confirmTutorial");
const backToPlan = document.querySelector("#backToPlan");
const tutorialPageTitle = document.querySelector("#tutorialPageTitle");
const tutorialPageContent = document.querySelector("#tutorialPageContent");
const photoFoodQuery = document.querySelector("#photoFoodQuery");
const foodQueryPhotoInput = document.querySelector("#foodQueryPhotoInput");
const titleTrackEntry = document.querySelector("#titleTrackEntry");
const dietRecordSheet = document.querySelector("#dietRecordSheet");
const recordModeEyebrow = document.querySelector("#recordModeEyebrow");
const recordSheetTitle = document.querySelector("#recordSheetTitle");
const recordCameraPanel = document.querySelector("#recordCameraPanel");
const recordNotePanel = document.querySelector("#recordNotePanel");
const foodPhotoInput = document.querySelector("#foodPhotoInput");
const photoPreview = document.querySelector("#photoPreview");
const foodTextInput = document.querySelector("#foodTextInput");
const voiceInputBtn = document.querySelector("#voiceInputBtn");
const voiceStatus = document.querySelector("#voiceStatus");
const submitTextRecord = document.querySelector("#submitTextRecord");
const closeRecordSheet = document.querySelector("#closeRecordSheet");
const closeRecordBackdrop = document.querySelector("#closeRecordBackdrop");
const recognizedCard = document.querySelector("#recognizedCard");
const recognizedList = document.querySelector("#recognizedList");
const recordSourceText = document.querySelector("#recordSourceText");
const recordImpact = document.querySelector("#recordImpact");
const recordActionRow = document.querySelector("#recordActionRow");
const confirmRecordBtn = document.querySelector("#confirmRecordBtn");
const voiceCorrectBtn = document.querySelector("#voiceCorrectBtn");
const correctionStatus = document.querySelector("#correctionStatus");
const dailyQuestionSheet = document.querySelector("#dailyQuestionSheet");
const dailyQuestionTitle = document.querySelector("#dailyQuestionTitle");
const dailyQuestionReason = document.querySelector("#dailyQuestionReason");
const dailyQuestionOptions = document.querySelector("#dailyQuestionOptions");
const dailyQuestionFeedback = document.querySelector("#dailyQuestionFeedback");
const closeDailyQuestion = document.querySelector("#closeDailyQuestion");
const closeDailyBackdrop = document.querySelector("#closeDailyBackdrop");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function saveProfileToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
}

function loadProfileFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return false;
    state.answers = { ...state.answers, ...saved };
    return true;
  } catch {
    return false;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyQuestions() {
  const rule = getActiveRule();
  return [
    {
      q: `今天「${rule.name}」最明显的变化是什么？`,
      r: "恢复感受会轻微影响今日食谱的质地和刺激性控制。",
      options: ["疼痛少了", "差不多", "更不舒服"],
      feedback: {
        疼痛少了: "今天可以继续保持当前质地，不急着升级，优先把蛋白吃够。",
        差不多: "今日食谱维持稳定，少量多餐比突然换花样更重要。",
        更不舒服: "今天会更偏向温和、细软、少刺激，先排查辣、烫、硬颗粒。",
      },
    },
    {
      q: "最近两天有没有哪一餐吃完最难受？",
      r: "这个答案会帮助判断今天更应该避开油、辣、酸、硬还是太冷。",
      options: ["早餐", "午晚餐", "没有"],
      feedback: {
        早餐: "今天早餐建议更简单温和，先用牛奶、蛋羹、米糊这类低负担组合。",
        午晚餐: "今天午晚餐会更重视少油少盐和质地处理，外卖也要备注清楚。",
        没有: "很好，今日可以维持当前节奏，并把营养目标补得更完整。",
      },
    },
    {
      q: "今天最想吃但又担心不能吃的东西是什么类型？",
      r: "它不会完全决定食谱，但会给“想吃优化”更高一点权重。",
      options: ["重口味", "肉/主食", "甜饮"],
      feedback: {
        重口味: "今天可以保留热汤和香气，但把辣油、重盐、硬颗粒去掉。",
        "肉/主食": "今天会优先推荐更有饱腹感的软烂蛋白和主食组合。",
        甜饮: "今天可以用温牛奶、燕麦、少糖饮品感替代，避免冰和高糖。",
      },
    },
  ];
}

function openDailyQuestion(force = false) {
  if (!dailyQuestionSheet) return;
  const today = todayKey();
  if (!force && localStorage.getItem(DAILY_KEY) === today) return;
  const questions = getDailyQuestions();
  const item = questions[Math.floor(Math.random() * questions.length)];
  dailyQuestionTitle.textContent = item.q;
  dailyQuestionReason.textContent = item.r;
  dailyQuestionFeedback.hidden = true;
  dailyQuestionFeedback.textContent = "";
  dailyQuestionOptions.innerHTML = item.options
    .map((option) => `<button type="button" data-daily-answer="${escapeHTML(option)}">${escapeHTML(option)}</button>`)
    .join("");
  dailyQuestionOptions.dataset.feedback = JSON.stringify(item.feedback);
  dailyQuestionSheet.classList.add("open");
  dailyQuestionSheet.setAttribute("aria-hidden", "false");
}

function markDailyQuestionDone() {
  localStorage.setItem(DAILY_KEY, todayKey());
}

function closeDailyQuestionSheet(markDone = true) {
  if (!dailyQuestionSheet) return;
  if (markDone) markDailyQuestionDone();
  dailyQuestionSheet.classList.remove("open");
  dailyQuestionSheet.setAttribute("aria-hidden", "true");
}

function addMessage(role, text, variant = "") {
  state.messages.push({ role, text, variant });
  renderMessages();
}

function renderMessages() {
  chatBody.innerHTML = state.messages
    .map(
      (message) => `
        <div class="message-row ${message.role}">
          <div class="bubble ${message.role} ${message.variant}">${message.text}</div>
        </div>
      `,
    )
    .join("");
  chatBody.scrollTop = chatBody.scrollHeight;
}

function renderStep() {
  const step = steps[state.step];
  const progress = ((state.step + 1) / steps.length) * 100;
  document.querySelector(".progress-ring").style.setProperty("--progress", `${progress}%`);
  progressText.textContent = `${state.step + 1}/${steps.length}`;

  if (!state.messages.length || state.messages[state.messages.length - 1].key !== step.key) {
    if (step.notice) addMessage("bot", step.notice, "notice");
    state.messages.push({ role: "bot", text: step.question, variant: "", key: step.key });
    renderMessages();
  }

  optionGrid.innerHTML = "";
  inputAnswer.hidden = !(step.type === "input" || step.type === "disease");

  if (step.type === "input" || step.type === "disease") {
    freeInput.placeholder = step.placeholder || "请输入";
    freeInput.value = step.defaultValue || "";
    freeInput.inputMode = step.inputMode || "text";
    setTimeout(() => freeInput.focus(), 80);
    if (step.type === "input") return;
  }

  const options = [...step.options];
  if (step.type === "multi") {
    options.push({ label: "选好了", desc: "进入下一步", done: true });
  }

  optionGrid.innerHTML = options
    .map(
      (option) => `
        <button class="answer-option ${option.done ? "full" : ""}" type="button" data-answer="${option.label}" ${option.disabled ? "disabled" : ""} ${option.done ? "data-done='true'" : ""}>
          <strong>${option.label}</strong>
          <span>${option.desc || ""}</span>
        </button>
      `,
    )
    .join("");
}

function formatAnswer(key, value) {
  if (Array.isArray(value)) return value.join("、");
  return value;
}

function getStageFromDay(value) {
  const label = String(value || "");
  if (label.includes("术前")) return "术前准备";
  const day = label.match(/\d+/)?.[0] || state.answers.day || "6";
  return Number(day) <= 7 ? "流质" : Number(day) <= 30 ? "半流质" : "普通清淡饮食";
}

function getDayLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "第 6 天";
  if (text.includes("术前") || text.includes("术后")) return text;
  const day = text.match(/\d+/)?.[0];
  return day ? `第 ${day} 天` : text;
}

function updatePatientProfileSummary() {
  const rule = getActiveRule();
  const goals = (state.answers.goals || []).filter((item) => item !== "无");
  const ruleGoals = goals.length ? goals : rule.goals || ["高蛋白", "易消化"];
  stageEyebrow.textContent = `${rule.name} · ${getDayLabel(state.answers.day || rule.defaultDay)}`;
  patientMark.textContent = rule.marker || rule.name.slice(0, 1);
  patientSummary.textContent = `${state.answers.identity} · ${state.answers.stage || rule.texture}阶段 · ${ruleGoals.slice(0, 2).join(" / ")}`;
  patientNote.textContent = `系统已避开：${(rule.avoid || []).slice(0, 5).join("、")}。`;
}

function saveAnswer(rawValue) {
  const step = steps[state.step];
  const value = rawValue;

  state.answers[step.key] = value;

  if (step.key === "day") {
    state.answers.stage = getStageFromDay(value);
  }

  addMessage("user", formatAnswer(step.key, value));
  state.step += 1;

  if (state.step >= steps.length) {
    finishOnboarding();
  } else {
    renderStep();
  }
}

optionGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".answer-option");
  if (!button || button.disabled) return;
  const step = steps[state.step];
  const answer = button.dataset.answer;

  if (step.type === "multi") {
    const selected = state.answers[step.key] || [];
    if (button.dataset.done) {
      saveAnswer(selected.length ? selected : ["无"]);
      return;
    }
    const exists = selected.includes(answer);
    state.answers[step.key] = exists ? selected.filter((item) => item !== answer) : [...selected, answer];
    button.classList.toggle("selected", !exists);
    return;
  }

  saveAnswer(answer);
});

sendAnswer.addEventListener("click", () => saveAnswer(freeInput.value.trim() || freeInput.placeholder));
freeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveAnswer(freeInput.value.trim() || freeInput.placeholder);
});

function finishOnboarding() {
  const rule = getActiveRule();
  state.answers.surgery = rule.name;
  state.answers.stage = state.answers.stage || rule.texture;
  addMessage("bot", `档案已生成。已匹配到「${rule.name}」规则，下一步先把食谱定下来。`);
  updatePatientProfileSummary();
  syncProfileForm();
  saveProfileToStorage();
  renderMeals();
  renderRecoveryTips();
  renderKeyMetricTracker();
  setTimeout(() => {
    onboardingScreen.classList.remove("active");
    appScreen.classList.add("active");
    switchView("plan");
    setTimeout(() => openDailyQuestion(true), 420);
  }, 520);
}

function skipOnboardingNow() {
  const currentStep = steps[state.step];
  if (currentStep?.type === "input" && freeInput.value.trim()) {
    state.answers[currentStep.key] = freeInput.value.trim();
    if (currentStep.key === "day") {
      state.answers.stage = getStageFromDay(freeInput.value.trim());
    }
  }
  addMessage("bot", "已保存目前回答过的信息，先进入食谱方案。后面可以随时补全档案。");
  finishOnboarding();
}

function renderMeals() {
  const rule = getActiveRule();
  const mealMode = state.currentRecipePath === "optimize" ? "cravings" : state.foodSource === "takeout" ? "takeout" : "recipes";
  const baseList =
    mealMode === "cravings" ? rule.cravings || plans.optimize : mealMode === "takeout" ? rule.takeout || plans.takeout : rule.recipes || plans.recommend;
  let list = getExpandedMealList(rule, baseList, mealMode);
  if (state.currentRecipePath === "optimize" && state.cravingGenerated && state.customCraving) {
    list = list.map((item) => ({ ...item, old: state.customCraving }));
  }
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const page = state.planPage % pageCount;
  const displayList = list.slice(page * pageSize, page * pageSize + pageSize);

  mealList.innerHTML =
    state.currentRecipePath === "optimize" && state.cravingGenerated
      ? displayList
          .map(
            (meal) => `
        <article class="upgrade-card">
          <div class="upgrade-food old">
            <span>想吃</span>
            <strong>${meal.old}</strong>
          </div>
          <div class="upgrade-arrow">→</div>
          <div class="upgrade-food new">
            <span>升级成</span>
            <strong>${meal.title}</strong>
          </div>
          <p>${meal.desc}</p>
          <div class="tag-row">${meal.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        </article>
      `,
          )
          .join("")
      : displayList
          .map(
            (meal) => `
        <article class="meal-card">
          <div class="meal-time">${meal.time}</div>
          <div>
            <h3>${meal.title}</h3>
            <p>${meal.desc}</p>
            <div class="tag-row">${meal.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
          </div>
        </article>
      `,
          )
          .join("");

  planHeading.textContent = state.currentRecipePath === "recommend" ? "今日最适合方案" : "想吃优化方案";
  planSubcopy.textContent =
    state.currentRecipePath === "recommend"
      ? `${state.foodSource === "takeout" ? `${rule.name}外卖版：` : ""}${rule.planSubcopy}${pageCount > 1 ? ` 第 ${page + 1}/${pageCount} 组` : ""}`
      : `把想吃的东西保留为口味方向，再改成适合「${rule.name}」的${state.foodSource === "takeout" ? "外卖可点" : "自己做"}版本。${
          pageCount > 1 ? ` 第 ${page + 1}/${pageCount} 组` : ""
        }`;

  mealPlanCard.hidden = state.currentRecipePath === "optimize" && !state.cravingGenerated;
  recommendSource.hidden = state.currentRecipePath !== "recommend";
  if (displayList[0]?.title) {
    state.currentTutorialRecipe = displayList[0].title.replace(/^.*：/, "");
  }
}

function switchView(viewName) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewName));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));

  const titles = {
    plan: "食谱推荐",
    track: "禁忌查询",
    dietTrack: "开始追踪",
    recover: "恢复追踪",
    profile: "个人信息",
    tutorial: "做饭教程",
  };
  flowTitle.textContent = titles[viewName] || titles.plan;
  if (titleTrackEntry) titleTrackEntry.hidden = viewName !== "dietTrack";

  if (viewName === "profile") syncProfileForm();
  if (viewName === "dietTrack") {
    updateSmartQuestion();
    renderKeyMetricTracker();
  }
}

function syncProfileForm() {
  document.querySelectorAll("[data-profile-field]").forEach((field) => {
    field.value = state.answers[field.dataset.profileField] || "";
  });
}

function applyProfileUpdates() {
  document.querySelectorAll("[data-profile-field]").forEach((field) => {
    state.answers[field.dataset.profileField] = field.value;
  });
  state.answers.stage = getStageFromDay(state.answers.day);
  const rule = getActiveRule();
  state.answers.surgery = rule.name;
  saveProfileToStorage();
  updatePatientProfileSummary();
  renderMeals();
  renderRecoveryTips();
  renderKeyMetricTracker();
}

function updateSmartQuestion() {
  if (!smartQuestion || !smartReason) return;
  const rule = getActiveRule();
  const item = smartQuestions[state.recordCount % smartQuestions.length];
  smartQuestion.textContent = rule.question || item.q;
  smartReason.textContent = rule.questionReason || item.r;
}

function renderRecoveryTips() {
  const rule = getActiveRule();
  const tips = rule.recovery || fallbackRule.recovery;
  recoveryList.innerHTML = tips
    .map(
      (tip) => `
        <article>
          <span class="life-icon">${tip.icon}</span>
          <div>
            <h3>${tip.title}</h3>
            <p>${tip.desc}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function getActiveKeyMetricSet() {
  const rule = getActiveRule();
  if (rule.id === "diabetes") return keyMetricSets.diabetes;
  if (rule.id === "maxillofacial") return keyMetricSets.maxillofacial;
  if (rule.name.includes("贫血") || (rule.goals || []).some((goal) => goal.includes("补铁"))) return keyMetricSets.iron_deficiency;
  return keyMetricSets.maxillofacial;
}

function renderKeyMetricTracker(activeKey = state.activeMetric, activeIndex = 5) {
  if (!keyMetricTabs || !metricCurvePlot) return;
  const metricSet = getActiveKeyMetricSet();
  const keys = Object.keys(metricSet);
  const key = keys.includes(activeKey) ? activeKey : keys[0];
  state.activeMetric = key;
  state.activeMetricIndex = activeIndex;

  keyMetricTabs.innerHTML = keys
    .map(
      (itemKey) => `
        <button class="${itemKey === key ? "active" : ""}" type="button" data-key-metric="${itemKey}">${metricSet[itemKey].label}</button>
      `,
    )
    .join("");

  renderMetricCurve(key, activeIndex);
}

function renderMetricCurve(key = state.activeMetric, activeIndex = 5) {
  if (!metricCurvePlot) return;
  const metricSet = getActiveKeyMetricSet();
  const resolvedKey = metricSet[key] ? key : Object.keys(metricSet)[0];
  const data = metricSet[resolvedKey];
  state.activeMetric = resolvedKey;
  state.activeMetricIndex = activeIndex;
  const values = data.points.map((point) => point.value);
  const max = Math.max(...values, data.normalRange.max, data.idealRange.max) * 1.18;
  const min = 0;
  const rangeStyle = (range) => {
    const bottom = ((range.min - min) / (max - min)) * 100;
    const height = ((range.max - range.min) / (max - min)) * 100;
    return `bottom:${bottom}%;height:${height}%`;
  };
  const displayRange = (range) => `${range.min}-${range.max}${data.unit}`;
  const points = data.points.map((point, index) => ({
    ...point,
    index,
    height: Math.max(6, (point.value / max) * 100),
  }));

  metricCurveTitle.textContent = data.title;
  metricCurveSummary.textContent = `自记录以来每日变化 · ${data.summary}`;
  metricCurvePlot.innerHTML = `
    <div class="range-band normal" style="${rangeStyle(data.normalRange)}">
      <span>正常范围 ${displayRange(data.normalRange)}</span>
    </div>
    <div class="range-band ideal" style="${rangeStyle(data.idealRange)}">
      <span>理想区间 ${displayRange(data.idealRange)}</span>
    </div>
    <div class="bar-grid">
      ${points
        .map(
          (point) => `
          <button class="intake-bar ${point.index === activeIndex ? "active" : ""}" type="button" data-key-metric-point="${resolvedKey}" data-index="${point.index}" aria-label="${point.day} 记录 ${point.value}${data.unit}">
            <span class="bar-track" style="--bar-height:${point.height}%">
              <span class="bar-value">${point.value}${data.unit}</span>
              <span class="bar-fill" style="height:${point.height}%"></span>
            </span>
            <span class="bar-day">${point.day}</span>
          </button>
        `,
        )
        .join("")}
    </div>
  `;

  renderMetricPointDetail(data, points[activeIndex]);
}

function renderMetricPointDetail(data, point) {
  if (!metricPointDetail) return;
  metricPointDetail.innerHTML = `
    <strong>${point.day} · ${point.value}${data.unit}</strong>
    <p>形成原因：${point.reason}</p>
    <p>下一步指示：${point.action}</p>
  `;
}

function renderNutrientCurve(key = "protein", activeIndex = 5) {
  if (!curvePlot) return;
  const data = nutrientData[key];
  const ranges = nutrientRanges[key];
  const values = data.points.map((point) => point.value);
  const max = Math.max(...values, ranges.normalRange.max, ranges.idealRange.max) * 1.18;
  const min = 0;
  const rangeStyle = (range) => {
    const bottom = ((range.min - min) / (max - min)) * 100;
    const height = ((range.max - range.min) / (max - min)) * 100;
    return `bottom:${bottom}%;height:${height}%`;
  };
  const displayRange = (range) => `${range.min}-${range.max}${data.unit}`;
  const points = data.points.map((point, index) => ({
    ...point,
    index,
    height: Math.max(6, (point.value / max) * 100),
  }));

  curveTitle.textContent = data.title;
  curveSummary.textContent = `自记录以来每日摄入量 · ${data.summary}`;
  curvePlot.innerHTML = `
    <div class="range-band normal" style="${rangeStyle(ranges.normalRange)}">
      <span>正常范围 ${displayRange(ranges.normalRange)}</span>
    </div>
    <div class="range-band ideal" style="${rangeStyle(ranges.idealRange)}">
      <span>理想区间 ${displayRange(ranges.idealRange)}</span>
    </div>
    <div class="bar-grid">
      ${points
        .map(
          (point) => `
          <button class="intake-bar ${point.index === activeIndex ? "active" : ""}" type="button" data-nutrient-point="${key}" data-index="${point.index}" aria-label="${point.day} 摄入 ${point.value}${data.unit}">
            <span class="bar-track" style="--bar-height:${point.height}%">
              <span class="bar-value">${point.value}${data.unit}</span>
              <span class="bar-fill" style="height:${point.height}%"></span>
            </span>
            <span class="bar-day">${point.day}</span>
          </button>
        `,
        )
        .join("")}
    </div>
  `;

  renderPointDetail(data, points[activeIndex]);
}

function renderPointDetail(data, point) {
  if (!pointDetail) return;
  pointDetail.innerHTML = `
    <strong>${point.day} · ${point.value}${data.unit}</strong>
    <p>形成原因：${point.reason}</p>
    <p>下一步指示：${point.action}</p>
  `;
}

function getLatestPoint(data) {
  return data.points[5] || data.points[data.points.length - 1];
}

function renderDietDollReport() {
  if (!dietDollSummary || !dietDollAdvice) return;
  const rule = getActiveRule();
  const protein = getLatestPoint(nutrientData.protein);
  const carb = getLatestPoint(nutrientData.carb);
  const fat = getLatestPoint(nutrientData.fat);
  const fiber = getLatestPoint(nutrientData.fiber);
  const metricSet = getActiveKeyMetricSet();
  const metric = metricSet[state.activeMetric] || metricSet[Object.keys(metricSet)[0]];
  const metricPoint = getLatestPoint(metric);
  const proteinTrend = protein.value >= nutrientData.protein.points[0].value ? "蛋白摄入较记录初期已有提升" : "蛋白摄入仍不够稳定";
  const unsafeItems = [...recordDemos.camera.items, ...recordDemos.note.items].filter((item) => item.unsafe).map((item) => item.name);

  dietDollSummary.textContent = `从目前记录看，你的饮食整体在向「${rule.texture || state.answers.stage}」要求靠近：${proteinTrend}，碳水来源逐渐稳定，脂肪仍处在较清淡范围；${metric.label}今日为 ${metricPoint.value}${metric.unit}，需要继续和饮食质地、进食完成度一起观察。`;
  dietDollAdvice.innerHTML = [
    {
      title: "优先保留",
      text: `继续保留鱼泥、豆腐、蛋羹、温牛奶这类温和蛋白来源，有助于修复和维持体力。`,
    },
    {
      title: "补足短板",
      text: fiber.value < nutrientRanges.fiber.idealRange.min ? "膳食纤维仍偏低，可用南瓜泥、熟梨泥这类少渣来源温和补充。" : "纤维和主食搭配较平稳，继续保持少量多次即可。",
    },
    {
      title: "需要避开",
      text: unsafeItems.length ? `${unsafeItems.join("、")}这类食材建议去掉或替换，避免刺激、残渣或额外恢复负担。` : "目前没有明显风险食材，继续保持清淡、细软和温热。",
    },
    {
      title: "下一步",
      text: `明天先把蛋白稳定到 ${protein.value >= 60 ? "当前水平" : "60g 以上"}，同时观察${metric.label}是否继续改善。`,
    },
  ]
    .map(
      (item) => `
        <div class="doll-advice-item">
          <strong>${item.title}</strong>
          <span>${item.text}</span>
        </div>
      `,
    )
    .join("");
}

function toggleDietDoll(forceOpen) {
  if (!dietDollWidget || !dietDollCard || !dietDollTrigger) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : dietDollCard.hidden;
  if (shouldOpen) renderDietDollReport();
  dietDollCard.hidden = !shouldOpen;
  dietDollWidget.classList.toggle("open", shouldOpen);
  dietDollTrigger.setAttribute("aria-expanded", String(shouldOpen));
}

function isPhotoRecordMode(mode) {
  return mode.startsWith("camera");
}

function isCorrectedPhotoMode(mode) {
  return mode.endsWith("Corrected");
}

function openRecordSheet(mode) {
  if (!dietRecordSheet) return;
  const isCamera = mode === "camera";
  recordModeEyebrow.textContent = isCamera ? "拍摄记录" : "文字记录";
  recordSheetTitle.textContent = isCamera ? "选择拍照识别方式" : "输入今天吃了什么";
  recordCameraPanel.hidden = !isCamera;
  recordNotePanel.hidden = isCamera;
  recognizedCard.hidden = true;
  state.pendingRecordMode = "";
  state.currentPhotoRecordMode = "camera";
  if (photoPreview) {
    photoPreview.hidden = true;
    photoPreview.innerHTML = "";
  }
  if (correctionStatus) correctionStatus.textContent = "如果识别不准，可以说出真实吃了什么和大致重量。";
  confirmRecordBtn.disabled = false;
  confirmRecordBtn.textContent = "确认记录";
  dietRecordSheet.classList.add("open");
  dietRecordSheet.setAttribute("aria-hidden", "false");

  if (!isCamera) {
    setTimeout(() => foodTextInput.focus(), 120);
  }
}

function closeDietRecordSheet() {
  if (!dietRecordSheet) return;
  dietRecordSheet.classList.remove("open");
  dietRecordSheet.setAttribute("aria-hidden", "true");
  voiceInputBtn.classList.remove("listening");
  if (voiceCorrectBtn) voiceCorrectBtn.classList.remove("listening");
}

function applyRecordDemo(mode) {
  const demo = recordDemos[mode];
  const todayIndex = 5;

  Object.entries(demo.deltas).forEach(([key, delta]) => {
    const data = nutrientData[key];
    const point = data.points[todayIndex];
    const insight = demo.insights[key];
    point.value += delta;
    point.reason = insight.reason;
    point.action = insight.action;
    data.summary = `今日 ${point.value}${data.unit} / 已记录`;
  });

  recordImpact.textContent =
    isPhotoRecordMode(mode)
      ? "已确认图片识别结果，本餐已计入今日饮食记录。"
      : "已确认文字/语音识别结果，本餐已计入今日饮食记录。";
  confirmRecordBtn.disabled = true;
  confirmRecordBtn.textContent = "已记录";
  state.pendingRecordMode = "";
  renderNutrientCurve(state.activeNutrient, todayIndex);
  if (dietDollCard && !dietDollCard.hidden) renderDietDollReport();
  closeDietRecordSheet();
}

function renderRecognizedResult(demo, mode) {
  state.pendingRecordMode = mode;
  const hasUnsafe = demo.items.some((item) => item.unsafe);
  const isPhoto = isPhotoRecordMode(mode);
  const corrected = isCorrectedPhotoMode(mode);
  confirmRecordBtn.disabled = false;
  confirmRecordBtn.textContent = "确认记录";
  recordSourceText.textContent = `${isPhoto ? photoRecordLabels[mode] || "拍摄识别结果" : "输入识别结果"}，请核对后再确认。`;
  if (recordActionRow) recordActionRow.classList.toggle("no-correction", !isPhoto);
  if (voiceCorrectBtn) {
    voiceCorrectBtn.hidden = !isPhoto;
    voiceCorrectBtn.disabled = corrected;
    voiceCorrectBtn.classList.remove("listening");
    voiceCorrectBtn.innerHTML = corrected ? "已语音纠正" : '<span class="voice-dot" aria-hidden="true"></span>语音纠正';
  }
  if (correctionStatus) {
    correctionStatus.hidden = !isPhoto;
    correctionStatus.textContent = corrected ? "已根据语音纠正更新食材种类、重量和整餐评价。" : "如果识别不准，可以说出真实吃了什么和大致重量。";
  }
  recognizedList.innerHTML = demo.items
    .map(
      (item) => `
        <div class="recognized-item ${item.unsafe ? "unsafe" : item.status.includes("可保留") ? "watch" : "recommended"}">
          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <small>${escapeHTML(item.amount)}</small>
          </div>
          <span>${escapeHTML(item.status)}</span>
          <p>${escapeHTML(item.review)}</p>
        </div>
      `,
    )
    .join("");
  recordImpact.innerHTML = `
    <strong>本餐饮食评价</strong>
    <div class="impact-row">
      <span>整体评价</span>
      <p>${escapeHTML(demo.evaluation.summary)}</p>
    </div>
    ${
      hasUnsafe
        ? `<div class="impact-row caution">
            <span>建议微调</span>
            <p>${escapeHTML(demo.evaluation.adjustment)}</p>
          </div>`
        : ""
    }
    <div class="impact-row">
      <span>鼓励</span>
      <p>${escapeHTML(demo.evaluation.encouragement)}</p>
    </div>
  `;
  recognizedCard.hidden = false;
}

function submitTextFoodRecord() {
  const text = foodTextInput.value.trim();
  if (!text) {
    foodTextInput.value = "鸡肉山药浓汤半碗，温牛奶 200ml，熟梨泥 80g";
  }
  renderRecognizedResult(recordDemos.note, "note");
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    foodTextInput.value = "鸡肉山药浓汤半碗，温牛奶 200ml，熟梨泥 80g";
    voiceStatus.textContent = "当前浏览器暂不支持语音识别，已填入一条演示语音结果。";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  voiceInputBtn.classList.add("listening");
  voiceStatus.textContent = "正在听，请说出今天吃了什么。";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    foodTextInput.value = foodTextInput.value.trim() ? `${foodTextInput.value}，${transcript}` : transcript;
    voiceStatus.textContent = "已识别语音，可以继续修改或直接记录。";
  };
  recognition.onerror = () => {
    voiceStatus.textContent = "语音识别暂时没有成功，可以改用文字输入。";
  };
  recognition.onend = () => {
    voiceInputBtn.classList.remove("listening");
  };
  recognition.start();
}

function startVoiceCorrection() {
  if (!state.pendingRecordMode || !isPhotoRecordMode(state.pendingRecordMode)) return;
  const correctedMode = correctedPhotoRecordModes[state.pendingRecordMode];
  if (!correctedMode || !recordDemos[correctedMode]) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    renderRecognizedResult(recordDemos[correctedMode], correctedMode);
    if (correctionStatus) correctionStatus.textContent = "当前浏览器暂不支持语音识别，已填入一条演示纠正结果。";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  voiceCorrectBtn.classList.add("listening");
  correctionStatus.textContent = "正在听，请说出真实吃了什么和大致重量。";

  recognition.onresult = () => {
    renderRecognizedResult(recordDemos[correctedMode], correctedMode);
    correctionStatus.textContent = "已根据语音纠正更新食材种类、重量和整餐评价。";
  };
  recognition.onerror = () => {
    correctionStatus.textContent = "语音纠正暂时没有成功，可以再试一次，或直接核对后确认。";
  };
  recognition.onend = () => {
    voiceCorrectBtn.classList.remove("listening");
  };
  recognition.start();
}

function getFoodAnswer(food) {
  const name = food.trim();
  const spicyWords = ["辣", "麻辣", "火锅", "冒菜", "酸辣", "泡椒"];
  const hardWords = ["坚果", "花生", "瓜子", "薯片", "脆骨", "锅巴", "硬"];
  const roughWords = ["芹菜", "韭菜", "玉米", "杂粮", "粗粮", "海带"];
  const gentleWords = ["鸡蛋羹", "蒸蛋", "豆腐", "米糊", "粥", "牛奶", "鱼泥", "南瓜", "山药"];
  const coldSourWords = ["酸奶", "柠檬", "醋", "冰", "冷饮"];
  const rule = getActiveRule();

  if (!name) return null;
  if (spicyWords.some((word) => name.includes(word))) {
    return {
      status: "暂不建议",
      tone: "no",
      reason: `${getDayLabel(state.answers.day)}要避开辛辣刺激，容易刺激创口、胃肠或加重恢复期不适。`,
      action: `可以换成${(rule.recipes || plans.recommend)[0]?.title || "清淡软食"}；如果是外卖，备注无辣、少盐、不要辣油。`,
    };
  }
  if (hardWords.some((word) => name.includes(word))) {
    return {
      status: "暂不建议",
      tone: "no",
      reason: "硬颗粒通常需要明显咀嚼，也可能摩擦创口或增加消化负担，不适合当前恢复阶段。",
      action: "想补能量可以换成细腻米糊、南瓜泥、山药浓汤；坚果类先不要整颗吃。",
    };
  }
  if (roughWords.some((word) => name.includes(word))) {
    return {
      status: "谨慎吃",
      tone: "warn",
      reason: "这类食物纤维或残渣较多，当前阶段可能留下渣渣，影响口腔清洁或增加胃肠负担。",
      action: "如果一定要吃，需要煮软打细并过滤；不舒服就暂停，优先选少渣食物。",
    };
  }
  if (coldSourWords.some((word) => name.includes(word))) {
    return {
      status: "谨慎吃",
      tone: "warn",
      reason: "酸、冷刺激可能让口腔或胃部不舒服。是否能吃取决于温度、酸度和你当前疼痛/反酸感。",
      action: "选择常温、原味、小口尝试；一旦刺痛或不适，改成温牛奶、蛋羹或米糊。",
    };
  }
  if (gentleWords.some((word) => name.includes(word))) {
    return {
      status: "可以吃",
      tone: "ok",
      reason: `它质地柔软、刺激性低，和当前「${rule.name}」的饮食限制比较匹配。`,
      action: "注意温度不烫口，少盐少油；如果有颗粒，先打细或过筛。",
    };
  }
  return {
    status: "需要看做法",
    tone: "warn",
    reason: "单看食物名称还不能完全判断，关键要看是否辛辣、是否有硬颗粒、是否油腻，以及能不能处理到细软少渣。",
    action: "优先选择温热、清淡、细软的做法；如果它需要大量咀嚼、带辣油或有粗渣，当前先不要吃。",
  };
}

function appendFoodMessage(role, html) {
  if (!foodChatWindow) return;
  const message = document.createElement("div");
  message.className = `food-message ${role}`;
  message.innerHTML = html;
  foodChatWindow.appendChild(message);
  foodChatWindow.scrollTop = foodChatWindow.scrollHeight;
}

function askFood(food) {
  const query = food.trim();
  const answer = getFoodAnswer(query);
  if (!answer) return;
  appendFoodMessage("user", `<p>${query}</p>`);
  appendFoodMessage(
    "bot",
    `<span class="status ${answer.tone}">${answer.status}</span>
    <h3>${query}现在能不能吃？</h3>
    <p>${answer.reason}</p>
    <p>${answer.action}</p>`,
  );
  foodQueryInput.value = "";
}

function askFoodFromPhoto() {
  const guessed = "照片中的麻辣烫";
  appendFoodMessage("user", `<p>已拍照识别：${guessed}</p>`);
  const answer = getFoodAnswer(guessed);
  appendFoodMessage(
    "bot",
    `<span class="status ${answer.tone}">${answer.status}</span>
    <h3>${guessed}现在能不能吃？</h3>
    <p>${answer.reason}</p>
    <p>${answer.action}</p>
    <p>识别说明：Demo 先模拟图片识别，正式版会接入食物识别模型。</p>`,
  );
}

function getCookingTutorialHTML() {
  const recipe = state.currentTutorialRecipe || "鱼泥豆腐羹";
  const rule = getActiveRule();
  const isSoup = /羹|汤|糊|粥|米糊|浓汤/.test(recipe);
  const texture = state.answers.stage || rule.texture || "软烂清淡";
  return {
    recipe,
    html: `
    <div>
      <strong>${recipe}</strong>
      <p>按「${rule.name} · ${texture}」生成，重点是温热、少油盐、无辣、质地细软。</p>
    </div>
    <div class="method-card">
      <h4>推荐做法</h4>
      <ol>
        <li>主食或蛋白先煮熟/蒸熟，肉类和鱼类去骨去刺，蔬菜选软烂少渣部分。</li>
        <li>${isSoup ? "加入温水或清汤，小火煮到顺滑。" : "切小块后加少量温水焖软，避免煎炸。"}</li>
        <li>用料理机打细，必要时过筛，入口温度控制在不烫口。</li>
        <li>调味只用少量盐，不放辣椒、辣油、粗颗粒香料和刺激性酱料。</li>
      </ol>
      <p><strong>今天的执行提醒：</strong>${rule.avoid?.slice(0, 3).join("、") || "辛辣、油炸、酒精"}先避开；吃完若刺痛、反酸或腹胀，下一餐再打细一点。</p>
    </div>
  `,
  };
}

function openTutorialConfirm() {
  if (!tutorialPromptSheet) return;
  tutorialPromptSheet.classList.add("open");
  tutorialPromptSheet.setAttribute("aria-hidden", "false");
}

function closeTutorialConfirm() {
  if (!tutorialPromptSheet) return;
  tutorialPromptSheet.classList.remove("open");
  tutorialPromptSheet.setAttribute("aria-hidden", "true");
}

function showCookingTutorial() {
  const tutorial = getCookingTutorialHTML();
  tutorialPageTitle.textContent = tutorial.recipe;
  tutorialPageContent.innerHTML = tutorial.html;
  closeTutorialConfirm();
  switchView("tutorial");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll("[data-next-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.nextView));
});

document.querySelectorAll("[data-recipe-path]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentRecipePath = button.dataset.recipePath;
    if (state.currentRecipePath === "optimize") state.cravingGenerated = false;
    state.planPage = 0;
    document.querySelectorAll("[data-recipe-path]").forEach((item) => item.classList.toggle("active", item === button));
    habitCapture.hidden = state.currentRecipePath !== "optimize";
    recommendSource.hidden = state.currentRecipePath !== "recommend";
    renderMeals();
  });
});

document.querySelectorAll("[data-food-source]").forEach((button) => {
  button.addEventListener("click", () => {
    state.foodSource = button.dataset.foodSource;
    state.planPage = 0;
    document.querySelectorAll("[data-food-source]").forEach((item) => item.classList.toggle("active", item.dataset.foodSource === state.foodSource));
    cookPanel.hidden = state.foodSource !== "cook";
    takeoutPanel.hidden = state.foodSource !== "takeout";
    renderMeals();
  });
});

document.querySelector("#refreshPlan").addEventListener("click", () => {
  state.planPage += 1;
  renderMeals();
});

document.querySelector("#openCraving").addEventListener("click", () => {
  state.currentRecipePath = "optimize";
  state.cravingGenerated = false;
  state.planPage = 0;
  habitCapture.hidden = false;
  recommendSource.hidden = true;
  mealPlanCard.hidden = true;
  document.querySelector("#habitText").focus();
});

document.querySelector("#optimizeHabit").addEventListener("click", () => {
  state.currentRecipePath = "optimize";
  state.cravingGenerated = true;
  state.planPage = 0;
  const craving = document.querySelector("#habitText").value.trim();
  state.customCraving = craving || "想吃的食物";
  habitCapture.hidden = true;
  renderMeals();
});

if (saveProfile) saveProfile.addEventListener("click", applyProfileUpdates);
if (openTutorialPrompt) openTutorialPrompt.addEventListener("click", openTutorialConfirm);
if (confirmTutorial) confirmTutorial.addEventListener("click", showCookingTutorial);
if (cancelTutorial) cancelTutorial.addEventListener("click", closeTutorialConfirm);
if (cancelTutorialIcon) cancelTutorialIcon.addEventListener("click", closeTutorialConfirm);
if (cancelTutorialBackdrop) cancelTutorialBackdrop.addEventListener("click", closeTutorialConfirm);
if (backToPlan) backToPlan.addEventListener("click", () => switchView("plan"));
if (askFoodQuery) askFoodQuery.addEventListener("click", () => askFood(foodQueryInput.value));
if (foodQueryInput) {
  foodQueryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") askFood(foodQueryInput.value);
  });
}
if (photoFoodQuery && foodQueryPhotoInput) photoFoodQuery.addEventListener("click", () => foodQueryPhotoInput.click());
if (foodQueryPhotoInput) {
  foodQueryPhotoInput.addEventListener("change", () => {
    if (foodQueryPhotoInput.files?.[0]) askFoodFromPhoto();
  });
}
document.querySelectorAll("[data-food-query]").forEach((button) => {
  button.addEventListener("click", () => askFood(button.dataset.foodQuery));
});

if (dailyQuestionOptions) {
  dailyQuestionOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-daily-answer]");
    if (!button) return;
    const answer = button.dataset.dailyAnswer;
    const feedback = JSON.parse(dailyQuestionOptions.dataset.feedback || "{}");
    dailyQuestionOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    dailyQuestionFeedback.textContent = feedback[answer] || "已记录，今天会轻微影响饮食建议权重。";
    dailyQuestionFeedback.hidden = false;
    markDailyQuestionDone();
  });
}
if (closeDailyQuestion) closeDailyQuestion.addEventListener("click", closeDailyQuestionSheet);
if (closeDailyBackdrop) closeDailyBackdrop.addEventListener("click", closeDailyQuestionSheet);

document.querySelector("#restartChat").addEventListener("click", () => {
  state.step = 0;
  state.messages = [];
  appScreen.classList.remove("active");
  onboardingScreen.classList.add("active");
  renderStep();
});

skipOnboarding.addEventListener("click", skipOnboardingNow);

if (healthAnswerOptions) {
  healthAnswerOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-health-answer]");
    if (!button) return;
    healthAnswerOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    state.recordCount += 1;
    const answer = button.dataset.healthAnswer;
    smartReason.textContent =
      answer === "更好"
        ? "很好，明天可以继续保持当前质地，同时把蛋白补足。"
        : answer === "持平"
          ? "保持观察，今天先不急着升级质地，优先稳定摄入。"
          : "先把下一餐调得更细软，并重点排查是否有颗粒、过烫或刺激。";
  });
}

if (nutrientTabs) {
  nutrientTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nutrient]");
    if (!button) return;
    nutrientTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    renderNutrientCurve(button.dataset.nutrient, 5);
  });
}

if (keyMetricTabs) {
  keyMetricTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-key-metric]");
    if (!button) return;
    keyMetricTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    renderMetricCurve(button.dataset.keyMetric, 5);
  });
}

if (curvePlot) {
  curvePlot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nutrient-point]");
    if (!button) return;
    const key = button.dataset.nutrientPoint;
    const index = Number(button.dataset.index);
    state.activeNutrient = key;
    state.activeNutrientIndex = index;
    curvePlot.querySelectorAll(".intake-bar").forEach((item) => item.classList.toggle("active", item === button));
    renderPointDetail(nutrientData[key], nutrientData[key].points[index]);
  });
}

if (metricCurvePlot) {
  metricCurvePlot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-key-metric-point]");
    if (!button) return;
    const key = button.dataset.keyMetricPoint;
    const index = Number(button.dataset.index);
    state.activeMetric = key;
    state.activeMetricIndex = index;
    metricCurvePlot.querySelectorAll(".intake-bar").forEach((item) => item.classList.toggle("active", item === button));
    const data = getActiveKeyMetricSet()[key];
    renderMetricPointDetail(data, data.points[index]);
  });
}

if (dietDollTrigger) dietDollTrigger.addEventListener("click", () => toggleDietDoll());
if (closeDietDoll) closeDietDoll.addEventListener("click", () => toggleDietDoll(false));

document.querySelectorAll("[data-record-mode]").forEach((button) => {
  button.addEventListener("click", () => openRecordSheet(button.dataset.recordMode));
});

document.querySelectorAll("[data-photo-record]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentPhotoRecordMode = button.dataset.photoRecord || "camera";
    foodPhotoInput.value = "";
    foodPhotoInput.click();
  });
});

if (foodPhotoInput) {
  foodPhotoInput.addEventListener("change", () => {
    const file = foodPhotoInput.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    photoPreview.innerHTML = `<img src="${url}" alt="本次拍摄的餐食照片预览" />`;
    photoPreview.hidden = false;
    const mode = state.currentPhotoRecordMode || "camera";
    renderRecognizedResult(recordDemos[mode] || recordDemos.camera, mode);
  });
}

if (submitTextRecord) submitTextRecord.addEventListener("click", submitTextFoodRecord);
if (voiceInputBtn) voiceInputBtn.addEventListener("click", startVoiceInput);
if (voiceCorrectBtn) voiceCorrectBtn.addEventListener("click", startVoiceCorrection);
if (confirmRecordBtn) {
  confirmRecordBtn.addEventListener("click", () => {
    if (!state.pendingRecordMode) return;
    applyRecordDemo(state.pendingRecordMode);
  });
}
if (closeRecordSheet) closeRecordSheet.addEventListener("click", closeDietRecordSheet);
if (closeRecordBackdrop) closeRecordBackdrop.addEventListener("click", closeDietRecordSheet);

const hasSavedProfile = loadProfileFromStorage();
if (hasSavedProfile) {
  updatePatientProfileSummary();
  syncProfileForm();
  renderMeals();
  if (smartQuestion) updateSmartQuestion();
  if (keyMetricTabs) renderKeyMetricTracker();
  if (curvePlot) renderNutrientCurve();
  renderRecoveryTips();
  onboardingScreen.classList.remove("active");
  appScreen.classList.add("active");
  switchView("plan");
  setTimeout(() => openDailyQuestion(), 500);
} else {
  renderStep();
  syncProfileForm();
  renderMeals();
  if (smartQuestion) updateSmartQuestion();
  if (keyMetricTabs) renderKeyMetricTracker();
  if (curvePlot) renderNutrientCurve();
  renderRecoveryTips();
}
