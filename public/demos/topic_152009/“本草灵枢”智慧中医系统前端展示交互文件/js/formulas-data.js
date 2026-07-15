/**
 * 本草灵枢 · 方剂与症状数据库
 * 包含 68 种常用方剂、84 症状、14 大症状分类、细分证型匹配规则
 */
const SYMPTOMS_DATA = [
  // ===== 脾胃类 =====
  { id: 1, name: '食欲不振', category: '脾胃', syndrome: '脾胃气虚', keywords: ['不想吃饭', '纳差', '没胃口', '食少'] },
  { id: 2, name: '腹胀', category: '脾胃', syndrome: '食积停滞', keywords: ['肚子胀', '腹部胀满', '脘腹胀'] },
  { id: 3, name: '腹泻', category: '脾胃', syndrome: '脾胃虚寒', keywords: ['拉肚子', '便溏', '泄泻', '大便稀'] },
  { id: 4, name: '便秘', category: '脾胃', syndrome: '肠燥津亏', keywords: ['大便干', '排便困难', '肠燥'] },
  { id: 5, name: '恶心呕吐', category: '脾胃', syndrome: '胃气上逆', keywords: ['反胃', '吐', '恶心', '呕吐'] },
  { id: 6, name: '胃痛', category: '脾胃', syndrome: '脾胃虚寒', keywords: ['胃疼', '胃脘痛', '肚子疼'] },
  { id: 7, name: '嗳气吞酸', category: '脾胃', syndrome: '食积停滞', keywords: ['打嗝', '反酸', '烧心'] },
  { id: 35, name: '胃脘灼痛', category: '脾胃', syndrome: '胃火炽盛', keywords: ['胃部灼热', '烧心胃痛', '胃热痛'] },
  { id: 36, name: '口臭', category: '脾胃', syndrome: '胃火炽盛', keywords: ['口气重', '口臭', '口气臭秽'] },
  { id: 37, name: '大便黏滞', category: '脾胃', syndrome: '脾胃湿热', keywords: ['大便黏', '排便不爽', '黏液便'] },

  // ===== 肺系类 =====
  { id: 8, name: '咳嗽', category: '肺系', syndrome: '风寒袭肺', keywords: ['咳', '咳嗽', '呛咳'] },
  { id: 9, name: '痰多', category: '肺系', syndrome: '痰湿阻肺', keywords: ['痰', '痰多', '咯痰'] },
  { id: 10, name: '气喘', category: '肺系', syndrome: '肺气虚', keywords: ['喘', '气喘', '喘息', '呼吸困难'] },
  { id: 11, name: '咽痛', category: '肺系', syndrome: '风热犯肺', keywords: ['嗓子疼', '咽喉痛', '喉咙痛', '咽干'] },
  { id: 12, name: '鼻塞流涕', category: '肺系', syndrome: '风寒袭肺', keywords: ['鼻塞', '流鼻涕', '感冒'] },
  { id: 38, name: '干咳少痰', category: '肺系', syndrome: '肺阴虚', keywords: ['干咳', '咳无痰', '嗓子干咳'] },
  { id: 39, name: '咯血', category: '肺系', syndrome: '肺阴虚', keywords: ['咳血', '痰中带血', '咯血'] },
  { id: 40, name: '声音嘶哑', category: '肺系', syndrome: '风热犯肺', keywords: ['嗓子哑', '失音', '声哑'] },

  // ===== 心系类 =====
  { id: 13, name: '心悸', category: '心系', syndrome: '心气虚', keywords: ['心慌', '心悸', '心跳快'] },
  { id: 14, name: '失眠', category: '心系', syndrome: '心阴虚', keywords: ['睡不着', '入睡困难', '睡眠差', '多梦'] },
  { id: 15, name: '胸闷', category: '心系', syndrome: '心血瘀阻', keywords: ['胸痛', '胸闷', '胸部憋闷'] },
  { id: 41, name: '健忘', category: '心系', syndrome: '心血虚', keywords: ['记忆力差', '忘事', '健忘'] },
  { id: 42, name: '心烦', category: '心系', syndrome: '心阴虚', keywords: ['烦躁', '心烦意乱', '烦热'] },
  { id: 43, name: '多梦', category: '心系', syndrome: '心血虚', keywords: ['睡眠多梦', '梦多', '夜梦频'] },

  // ===== 肝系类 =====
  { id: 16, name: '胁痛', category: '肝系', syndrome: '肝气郁结', keywords: ['两肋疼', '胁肋痛', '肋下痛'] },
  { id: 17, name: '头晕', category: '肝系', syndrome: '肝阳上亢', keywords: ['眩晕', '头晕目眩', '头昏'] },
  { id: 18, name: '目赤肿痛', category: '肝系', syndrome: '肝火上炎', keywords: ['眼睛红', '眼睛疼', '眼干', '目赤'] },
  { id: 19, name: '烦躁易怒', category: '肝系', syndrome: '肝火上炎', keywords: ['脾气大', '易怒', '烦躁', '肝火'] },
  { id: 44, name: '视物模糊', category: '肝系', syndrome: '肝血虚', keywords: ['眼睛模糊', '视力下降', '眼花'] },
  { id: 45, name: '肢体抽搐', category: '肝系', syndrome: '肝风内动', keywords: ['抽搐', '手足抽动', '痉挛'] },

  // ===== 肾系类 =====
  { id: 20, name: '腰膝酸软', category: '肾系', syndrome: '肾阴虚', keywords: ['腰疼', '腰酸', '腰膝软', '肾虚'] },
  { id: 21, name: '尿频', category: '肾系', syndrome: '肾气不固', keywords: ['小便多', '尿频', '夜尿多'] },
  { id: 22, name: '水肿', category: '肾系', syndrome: '肾阳虚', keywords: ['浮肿', '水肿', '肿胀'] },
  { id: 46, name: '遗精早泄', category: '肾系', syndrome: '肾气不固', keywords: ['遗精', '早泄', '滑精'] },
  { id: 47, name: '耳鸣', category: '肾系', syndrome: '肾阴虚', keywords: ['耳鸣', '耳响', '耳鸣如蝉'] },

  // ===== 气血类 =====
  { id: 23, name: '面色萎黄', category: '气血', syndrome: '气血两虚', keywords: ['面色差', '脸色黄', '面色苍白', '气血虚'] },
  { id: 24, name: '乏力', category: '气血', syndrome: '气虚', keywords: ['没力气', '疲乏', '疲倦', '无力'] },
  { id: 25, name: '气短', category: '气血', syndrome: '气虚', keywords: ['气不够', '气短', '少气懒言'] },
  { id: 26, name: '自汗', category: '气血', syndrome: '气虚', keywords: ['出汗多', '动则汗出', '自汗'] },
  { id: 27, name: '月经不调', category: '气血', syndrome: '血虚', keywords: ['经期不准', '月经不调', '经少', '经多'] },
  { id: 48, name: '面色苍白', category: '气血', syndrome: '气血两虚', keywords: ['脸色白', '面色㿠白', '面白无华'] },

  // ===== 外感类 =====
  { id: 28, name: '风寒感冒', category: '外感', syndrome: '风寒表证', keywords: ['怕冷', '风寒', '恶寒', '发热轻'] },
  { id: 29, name: '风热感冒', category: '外感', syndrome: '风热表证', keywords: ['风热', '发热重', '咽喉红', '口渴'] },
  { id: 30, name: '湿气重', category: '外感', syndrome: '湿邪困表', keywords: ['湿气', '身体沉', '困倦', '湿热'] },
  { id: 49, name: '暑湿感冒', category: '外感', syndrome: '暑湿表证', keywords: ['暑湿', '中暑', '夏季感冒'] },
  { id: 50, name: '高热', category: '外感', syndrome: '气分热盛', keywords: ['发烧', '高烧', '大热'] },

  // ===== 虚损类 =====
  { id: 31, name: '阴虚内热', category: '虚损', syndrome: '阴虚', keywords: ['阴虚', '盗汗', '五心烦热', '潮热', '口干'] },
  { id: 32, name: '阳虚怕冷', category: '虚损', syndrome: '阳虚', keywords: ['阳虚', '怕冷', '手脚凉', '畏寒'] },
  { id: 33, name: '气虚乏力', category: '虚损', syndrome: '气虚', keywords: ['气虚', '乏力', '说话没劲', '精神差'] },
  { id: 34, name: '血虚', category: '虚损', syndrome: '血虚', keywords: ['血虚', '头晕眼花', '面色白', '心悸'] },
  { id: 51, name: '五心烦热', category: '虚损', syndrome: '阴虚', keywords: ['手脚心热', '心烦热', '五心热'] },

  // ===== 湿热类 =====
  { id: 52, name: '口苦口黏', category: '湿热', syndrome: '肝胆湿热', keywords: ['口苦', '口黏', '嘴里苦'] },
  { id: 53, name: '黄疸', category: '湿热', syndrome: '肝胆湿热', keywords: ['皮肤黄', '巩膜黄', '黄染'] },
  { id: 54, name: '带下黄稠', category: '湿热', syndrome: '湿热下注', keywords: ['白带黄', '带下色黄', '黄带'] },
  { id: 55, name: '小便短赤', category: '湿热', syndrome: '膀胱湿热', keywords: ['尿黄', '尿短', '小便黄赤'] },
  { id: 56, name: '皮肤湿疮', category: '湿热', syndrome: '湿热浸淫', keywords: ['湿疮', '皮肤渗液', '黄水疮'] },
  { id: 57, name: '苔黄腻', category: '湿热', syndrome: '湿热证', keywords: ['舌苔黄腻', '舌黄厚', '腻苔'] },

  // ===== 痰饮类 =====
  { id: 58, name: '眩晕', category: '痰饮', syndrome: '痰浊上扰', keywords: ['头晕眩', '天旋地转', '痰眩'] },
  { id: 59, name: '咯痰色白', category: '痰饮', syndrome: '痰湿阻肺', keywords: ['白痰', '痰白', '咯白痰'] },
  { id: 60, name: '胸胁支满', category: '痰饮', syndrome: '饮停胸胁', keywords: ['胸满', '胸胁胀满', '悬饮'] },
  { id: 61, name: '呕吐清水痰涎', category: '痰饮', syndrome: '痰饮停胃', keywords: ['吐清水', '呕吐痰涎', '吐痰水'] },
  { id: 62, name: '瘰疬痰核', category: '痰饮', syndrome: '痰凝经络', keywords: ['淋巴结肿', '瘰疬', '痰核'] },

  // ===== 风湿类 =====
  { id: 63, name: '关节疼痛', category: '风湿', syndrome: '风寒湿痹', keywords: ['关节疼', '骨节痛', '痹证'] },
  { id: 64, name: '关节红肿', category: '风湿', syndrome: '风湿热痹', keywords: ['关节肿', '红肿热痛', '关节热痛'] },
  { id: 65, name: '肢体麻木', category: '风湿', syndrome: '风湿阻络', keywords: ['身体麻', '手脚麻', '麻木'] },
  { id: 66, name: '屈伸不利', category: '风湿', syndrome: '风寒湿痹', keywords: ['关节僵硬', '活动不利', '屈伸难'] },
  { id: 67, name: '腰背冷痛', category: '风湿', syndrome: '寒湿阻络', keywords: ['腰背凉', '腰冷', '背冷痛'] },

  // ===== 皮肤类 =====
  { id: 68, name: '皮肤瘙痒', category: '皮肤', syndrome: '血虚风燥', keywords: ['皮肤痒', '瘙痒', '身痒'] },
  { id: 69, name: '湿疹', category: '皮肤', syndrome: '湿热浸淫', keywords: ['湿疹', '渗出', '皮肤红疹'] },
  { id: 70, name: '荨麻疹', category: '皮肤', syndrome: '风邪客表', keywords: ['风团', '瘾疹', '风疹块'] },
  { id: 71, name: '痤疮', category: '皮肤', syndrome: '肺胃蕴热', keywords: ['青春痘', '粉刺', '痤疮'] },
  { id: 72, name: '皮肤干燥', category: '皮肤', syndrome: '血虚风燥', keywords: ['皮肤干', '起皮', '干燥脱屑'] },
  { id: 73, name: '脱发', category: '皮肤', syndrome: '肝肾不足', keywords: ['掉头发', '斑秃', '头发稀疏'] },

  // ===== 妇科类 =====
  { id: 74, name: '痛经', category: '妇科', syndrome: '气滞血瘀', keywords: ['经行腹痛', '月经痛', '经痛'] },
  { id: 75, name: '经闭', category: '妇科', syndrome: '血虚', keywords: ['闭经', '月经不来', '经闭'] },
  { id: 76, name: '带下过多', category: '妇科', syndrome: '脾虚湿盛', keywords: ['白带多', '带下量多', '分泌物多'] },
  { id: 77, name: '产后腹痛', category: '妇科', syndrome: '瘀血阻滞', keywords: ['产后痛', '恶露不行', '产后腹痛'] },
  { id: 78, name: '胎动不安', category: '妇科', syndrome: '肾虚', keywords: ['先兆流产', '胎漏', '胎动'] },
  { id: 79, name: '崩漏', category: '妇科', syndrome: '脾不统血', keywords: ['崩漏', '经血过多', '子宫出血'] },

  // ===== 儿科类 =====
  { id: 80, name: '小儿夜啼', category: '儿科', syndrome: '心热', keywords: ['夜啼', '小儿夜哭', '夜间哭闹'] },
  { id: 81, name: '小儿疳积', category: '儿科', syndrome: '脾胃虚弱', keywords: ['疳积', '小儿消瘦', '食积'] },
  { id: 82, name: '小儿遗尿', category: '儿科', syndrome: '肾气不足', keywords: ['尿床', '遗尿', '小儿尿床'] },
  { id: 83, name: '麻疹', category: '儿科', syndrome: '风热', keywords: ['麻疹', '疹子', '出疹'] },
  { id: 84, name: '百日咳', category: '儿科', syndrome: '痰热', keywords: ['顿咳', '痉咳', '百日咳'] }
];

const FORMULAS_DATA = [
  // ===== 补益类 =====
  {
    id: 1, name: '四君子汤', source: '《太平惠民和剂局方》',
    efficacy: '益气健脾',
    syndrome: '脾胃气虚',
    indication: '脾胃气虚证。面色萎白，语声低微，气短乏力，食少便溏',
    herbs: [3, 4, 26, 31],
    usage: '水煎服',
    caution: '阴虚血热者慎用',
    symptoms: [1, 3, 24, 25]
  },
  {
    id: 2, name: '四物汤', source: '《仙授理伤续断秘方》',
    efficacy: '补血调血',
    syndrome: '血虚',
    indication: '营血虚滞证。头晕心悸，面色无华，月经不调',
    herbs: [5, 6, 7, 22],
    usage: '水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [23, 27, 34, 17]
  },
  {
    id: 3, name: '八珍汤', source: '《正体类要》',
    efficacy: '益气补血',
    syndrome: '气血两虚',
    indication: '气血两虚证。面色苍白，头晕目眩，气短懒言，心悸怔忡',
    herbs: [3, 4, 26, 31, 5, 6, 7, 22],
    usage: '水煎服',
    caution: '感冒者慎用',
    symptoms: [23, 24, 25, 34, 17, 13]
  },
  {
    id: 4, name: '补中益气汤', source: '《脾胃论》',
    efficacy: '补中益气，升阳举陷',
    syndrome: '脾胃气虚',
    indication: '脾虚气陷证。饮食减少，体倦肢软，气短乏力，便溏',
    herbs: [2, 3, 4, 31, 5, 22, 12],
    usage: '水煎服',
    caution: '阴虚火旺者忌用',
    symptoms: [1, 3, 24, 25, 33]
  },
  {
    id: 5, name: '玉屏风散', source: '《医方类聚》',
    efficacy: '益气固表止汗',
    syndrome: '气虚',
    indication: '表虚自汗。自汗恶风，面色㿠白，易感风邪',
    herbs: [2, 3, 38],
    usage: '研末冲服或水煎服',
    caution: '外感表实证者不宜',
    symptoms: [26, 33, 28]
  },
  {
    id: 6, name: '六味地黄丸', source: '《小儿药证直诀》',
    efficacy: '滋阴补肾',
    syndrome: '肾阴虚',
    indication: '肾阴虚证。腰膝酸软，头晕耳鸣，盗汗遗精，骨蒸潮热',
    herbs: [6, 26, 27, 48, 33, 52],
    usage: '蜜丸或水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [20, 17, 31, 14]
  },
  {
    id: 7, name: '归脾汤', source: '《济生方》',
    efficacy: '益气补血，健脾养心',
    syndrome: '心血虚',
    indication: '心脾两虚证。心悸失眠，健忘，面色萎黄，食少体倦',
    herbs: [1, 2, 3, 4, 5, 58, 26, 31],
    usage: '水煎服',
    caution: '痰湿壅盛者慎用',
    symptoms: [14, 13, 1, 24, 23]
  },
  {
    id: 8, name: '生脉散', source: '《医学启源》',
    efficacy: '益气生津，敛阴止汗',
    syndrome: '气阴两虚',
    indication: '气阴两虚证。体倦气短，自汗口渴，脉虚细',
    herbs: [1, 34, 58],
    usage: '水煎服',
    caution: '实热证者忌用',
    symptoms: [25, 26, 31, 24]
  },
  {
    id: 9, name: '肾气丸', source: '《金匮要略》',
    efficacy: '温补肾阳',
    syndrome: '肾阳虚',
    indication: '肾阳不足证。腰膝酸冷，小便不利或反多，畏寒肢冷',
    herbs: [6, 27, 48, 33, 52, 5, 10, 4],
    usage: '蜜丸或水煎服',
    caution: '阴虚火旺者忌用',
    symptoms: [20, 32, 21, 22]
  },

  // ===== 解表类 =====
  {
    id: 10, name: '麻黄汤', source: '《伤寒论》',
    efficacy: '发汗解表，宣肺平喘',
    syndrome: '风寒表证',
    indication: '外感风寒表实证。恶寒发热，无汗而喘，头身疼痛',
    herbs: [9, 10, 30, 4],
    usage: '水煎服',
    caution: '体虚自汗者忌用',
    symptoms: [28, 10, 12]
  },
  {
    id: 11, name: '桂枝汤', source: '《伤寒论》',
    efficacy: '解肌发表，调和营卫',
    syndrome: '风寒表证',
    indication: '外感风寒表虚证。发热恶风，汗出头痛',
    herbs: [10, 5, 7, 4, 19],
    usage: '水煎服',
    caution: '表实无汗者不宜',
    symptoms: [28, 26]
  },
  {
    id: 12, name: '银翘散', source: '《温病条辨》',
    efficacy: '辛凉解表，清热解毒',
    syndrome: '风热表证',
    indication: '风热感冒。发热微恶寒，咽喉红肿疼痛，口渴',
    herbs: [16, 17, 11, 37, 4],
    usage: '水煎服',
    caution: '风寒感冒者不宜',
    symptoms: [29, 11, 12]
  },
  {
    id: 13, name: '桑菊饮', source: '《温病条辨》',
    efficacy: '疏风清热，宣肺止咳',
    syndrome: '风热犯肺',
    indication: '风温初起。咳嗽，身热不甚，口微渴',
    herbs: [11, 16, 22, 4, 54],
    usage: '水煎服',
    caution: '风寒咳嗽者不宜',
    symptoms: [8, 29]
  },

  // ===== 清热类 =====
  {
    id: 14, name: '黄连解毒汤', source: '《外台秘要》',
    efficacy: '清热泻火解毒',
    syndrome: '三焦热盛',
    indication: '三焦火毒热盛证。大热烦躁，口燥咽干，吐衄发斑',
    herbs: [15, 14, 43, 41],
    usage: '水煎服',
    caution: '脾胃虚寒者忌用',
    symptoms: [19, 11, 15]
  },
  {
    id: 15, name: '清胃散', source: '《脾胃论》',
    efficacy: '清胃凉血',
    syndrome: '胃火炽盛',
    indication: '胃火牙痛。牙痛牵引头痛，面颊发热，牙龈出血',
    herbs: [15, 35, 41, 22],
    usage: '水煎服',
    caution: '风寒牙痛者不宜',
    symptoms: [6, 7, 19]
  },
  {
    id: 16, name: '龙胆泻肝汤', source: '《医方集解》',
    efficacy: '清泻肝胆湿热',
    syndrome: '肝胆湿热',
    indication: '肝胆实火上炎。头痛目赤，胁痛口苦，耳聋耳肿',
    herbs: [12, 14, 14, 15, 35, 52, 53, 27],
    usage: '水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [19, 17, 18, 16]
  },

  // ===== 理气类 =====
  {
    id: 17, name: '逍遥散', source: '《太平惠民和剂局方》',
    efficacy: '疏肝解郁，养血健脾',
    syndrome: '肝气郁结',
    indication: '肝郁血虚脾弱证。两胁作痛，头痛目眩，口燥咽干，食少',
    herbs: [12, 5, 7, 3, 4, 19, 26],
    usage: '水煎服',
    caution: '阴虚阳亢者慎用',
    symptoms: [16, 19, 1, 17, 27]
  },
  {
    id: 18, name: '越鞠丸', source: '《丹溪心法》',
    efficacy: '行气解郁',
    syndrome: '气血痰火湿食郁',
    indication: '六郁证。胸膈痞闷，脘腹胀痛，饮食不消',
    herbs: [22, 19, 50, 21, 4],
    usage: '水丸或水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [2, 5, 15, 1]
  },
  {
    id: 19, name: '半夏厚朴汤', source: '《金匮要略》',
    efficacy: '行气散结，降逆化痰',
    syndrome: '痰凝经络',
    indication: '梅核气。咽中如有物阻，咯吐不出，吞咽不下',
    herbs: [28, 47, 19, 4, 40],
    usage: '水煎服',
    caution: '阴虚津亏者慎用',
    symptoms: [11, 5, 2]
  },

  // === 化痰止咳类 ===
  {
    id: 20, name: '二陈汤', source: '《太平惠民和剂局方》',
    efficacy: '燥湿化痰，理气和中',
    syndrome: '痰湿阻肺',
    indication: '湿痰证。咳嗽痰多色白，胸膈痞闷，恶心呕吐',
    herbs: [28, 19, 4, 4],
    usage: '水煎服',
    caution: '阴虚燥咳者不宜',
    symptoms: [8, 9, 5, 2]
  },
  {
    id: 21, name: '止嗽散', source: '《医学心悟》',
    efficacy: '宣肺止咳，疏风化痰',
    syndrome: '风寒袭肺',
    indication: '风邪犯肺证。咳嗽咽痒，咯痰不爽，微恶风发热',
    herbs: [54, 28, 29, 4, 19],
    usage: '水煎服',
    caution: '阴虚劳嗽者不宜',
    symptoms: [8, 12, 9]
  },
  {
    id: 22, name: '清气化痰丸', source: '《医方考》',
    efficacy: '清热化痰，理气止咳',
    syndrome: '痰热内结',
    indication: '痰热内结证。咳嗽痰黄，胸膈痞满，气急呕恶',
    herbs: [14, 14, 14, 30, 19, 21, 54],
    usage: '蜜丸或水煎服',
    caution: '寒痰者不宜',
    symptoms: [8, 9, 2, 5]
  },

  // ===== 理血类 =====
  {
    id: 23, name: '血府逐瘀汤', source: '《医林改错》',
    efficacy: '活血化瘀，行气止痛',
    syndrome: '心血瘀阻',
    indication: '胸中血瘀证。胸痛头痛，痛如针刺，心悸怔忡',
    herbs: [22, 5, 5, 7, 3, 12, 23, 24, 48, 30],
    usage: '水煎服',
    caution: '孕妇忌用',
    symptoms: [15, 6, 13]
  },
  {
    id: 24, name: '桃红四物汤', source: '《医宗金鉴》',
    efficacy: '养血活血，逐瘀调经',
    syndrome: '血虚',
    indication: '血虚兼血瘀证。月经不调，经行腹痛，经血有块',
    herbs: [5, 6, 7, 22, 24, 25],
    usage: '水煎服',
    caution: '孕妇忌用',
    symptoms: [27, 15]
  },
  {
    id: 25, name: '生化汤', source: '《傅青主女科》',
    efficacy: '化瘀生新，温经止痛',
    syndrome: '瘀血阻滞',
    indication: '产后瘀血腹痛。恶露不行，小腹冷痛',
    herbs: [5, 22, 25, 4, 10],
    usage: '水煎服',
    caution: '血热者不宜',
    symptoms: [27, 6]
  },

  // ===== 祛湿类 =====
  {
    id: 26, name: '平胃散', source: '《太平惠民和剂局方》',
    efficacy: '燥湿运脾，行气和胃',
    syndrome: '湿滞脾胃',
    indication: '湿滞脾胃证。脘腹胀满，不思饮食，恶心呕吐',
    herbs: [3, 47, 19, 4],
    usage: '水煎服',
    caution: '阴虚气滞者慎用',
    symptoms: [2, 1, 5, 30]
  },
  {
    id: 27, name: '五苓散', source: '《伤寒论》',
    efficacy: '利水渗湿，温阳化气',
    syndrome: '膀胱蓄水',
    indication: '膀胱蓄水证。小便不利，水肿，泄泻',
    herbs: [52, 4, 26, 3, 10],
    usage: '水煎服',
    caution: '阴虚津伤者慎用',
    symptoms: [22, 3, 21]
  },
  {
    id: 28, name: '藿香正气散', source: '《太平惠民和剂局方》',
    efficacy: '解表化湿，理气和中',
    syndrome: '暑湿表证',
    indication: '外感风寒，内伤湿滞。恶寒发热，胸膈满闷，腹痛吐泻',
    herbs: [19, 47, 40, 4, 3],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [28, 5, 3, 2, 30]
  },

  // ===== 安神类 =====
  {
    id: 29, name: '酸枣仁汤', source: '《金匮要略》',
    efficacy: '养血安神，清热除烦',
    syndrome: '心阴虚',
    indication: '虚劳虚烦不得眠。心悸盗汗，头目眩晕',
    herbs: [58, 34, 26, 4, 22],
    usage: '水煎服',
    caution: '实热证者不宜',
    symptoms: [14, 13, 31]
  },
  {
    id: 30, name: '天王补心丹', source: '《摄生秘剖》',
    efficacy: '滋阴养血，补心安神',
    syndrome: '心阴虚',
    indication: '阴虚血少，神志不安证。心悸失眠，神疲健忘',
    herbs: [58, 34, 5, 5, 6, 35, 4],
    usage: '蜜丸或水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [14, 13, 31, 25]
  },

  // ===== 治风类 =====
  {
    id: 31, name: '天麻钩藤饮', source: '《中医内科新编》',
    efficacy: '平肝息风，清热活血',
    syndrome: '肝阳上亢',
    indication: '肝阳偏亢证。头痛眩晕，耳鸣眼花，失眠',
    herbs: [56, 57, 23, 22, 12, 37],
    usage: '水煎服',
    caution: '气血两虚者慎用',
    symptoms: [17, 14, 19]
  },
  {
    id: 32, name: '川芎茶调散', source: '《太平惠民和剂局方》',
    efficacy: '疏风止痛',
    syndrome: '风邪头痛',
    indication: '外感风邪头痛。偏正头痛，巅顶作痛，恶寒发热',
    herbs: [22, 10, 11, 38, 37, 4],
    usage: '水煎服',
    caution: '肝阳上亢者慎用',
    symptoms: [17, 28]
  },

  // ===== 消食类 =====
  {
    id: 33, name: '保和丸', source: '《丹溪心法》',
    efficacy: '消食和胃',
    syndrome: '食积停滞',
    indication: '食滞胃脘证。脘腹痞满胀痛，嗳腐吞酸，恶食呕逆',
    herbs: [19, 28, 21, 4],
    usage: '水丸或水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [2, 5, 7, 1]
  },

  // ===== 温里类 =====
  {
    id: 34, name: '理中丸', source: '《伤寒论》',
    efficacy: '温中祛寒，补气健脾',
    syndrome: '脾胃虚寒',
    indication: '脾胃虚寒证。脘腹冷痛，呕吐泄泻，畏寒肢冷',
    herbs: [3, 4, 40, 10],
    usage: '蜜丸或水煎服',
    caution: '阴虚有热者忌用',
    symptoms: [6, 3, 5, 32]
  },
  {
    id: 35, name: '小建中汤', source: '《伤寒论》',
    efficacy: '温中补虚，和里缓急',
    syndrome: '脾胃虚寒',
    indication: '中焦虚寒证。腹中拘急疼痛，喜温喜按，面色无华',
    herbs: [10, 5, 7, 4, 19],
    usage: '水煎服',
    caution: '阴虚火旺者忌用',
    symptoms: [6, 23, 32]
  },

  // ===== 脾胃扩展 =====
  {
    id: 36, name: '参苓白术散', source: '《太平惠民和剂局方》',
    efficacy: '益气健脾，渗湿止泻',
    syndrome: '脾胃气虚',
    indication: '脾虚湿盛证。食少便溏，气短咳嗽，肢倦乏力',
    herbs: [31, 3, 26, 27, 32, 87, 54, 4],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [1, 3, 24, 25]
  },
  {
    id: 37, name: '痛泻要方', source: '《丹溪心法》',
    efficacy: '调和肝脾，止痛止泻',
    syndrome: '肝脾不和',
    indication: '肝脾不和证。腹痛即泻，泻后痛减，胸胁胀闷',
    herbs: [3, 7, 19, 12],
    usage: '水煎服',
    caution: '湿热泻者不宜',
    symptoms: [3, 2, 16]
  },
  {
    id: 38, name: '左金丸', source: '《丹溪心法》',
    efficacy: '清肝泻火，降逆止呕',
    syndrome: '肝火犯胃',
    indication: '肝火犯胃证。胁肋胀痛，嘈杂吞酸，呕吐口苦',
    herbs: [15, 67],
    usage: '水丸或水煎服',
    caution: '脾胃虚寒者忌用',
    symptoms: [7, 6, 19]
  },
  {
    id: 39, name: '半夏泻心汤', source: '《伤寒论》',
    efficacy: '寒热平调，消痞散结',
    syndrome: '脾胃不和',
    indication: '寒热错杂证。心下痞满，呕吐泻利，肠鸣下利',
    herbs: [28, 14, 15, 1, 4, 65],
    usage: '水煎服',
    caution: '阴虚津伤者慎用',
    symptoms: [2, 5, 3]
  },
  {
    id: 40, name: '吴茱萸汤', source: '《伤寒论》',
    efficacy: '温中补虚，降逆止呕',
    syndrome: '脾胃虚寒',
    indication: '胃寒呕吐证。食谷欲呕，胃脘疼痛，颠顶头痛',
    herbs: [67, 1, 40, 4],
    usage: '水煎服',
    caution: '胃热呕吐者忌用',
    symptoms: [6, 5, 17]
  },

  // ===== 肺系扩展 =====
  {
    id: 41, name: '泻白散', source: '《小儿药证直诀》',
    efficacy: '清泻肺热，平喘止咳',
    syndrome: '肺热',
    indication: '肺热喘咳证。气喘咳嗽，皮肤蒸热，日晡尤甚',
    herbs: [42, 4, 14],
    usage: '水煎服',
    caution: '风寒咳嗽者不宜',
    symptoms: [8, 10]
  },
  {
    id: 42, name: '百合固金汤', source: '《慎斋遗书》',
    efficacy: '滋养肺肾，止咳化痰',
    syndrome: '肺阴虚',
    indication: '肺肾阴亏证。咳嗽气喘，痰中带血，咽喉燥痛',
    herbs: [6, 35, 5, 7, 4, 34, 36, 29, 26],
    usage: '水煎服',
    caution: '脾虚便溏者慎用',
    symptoms: [38, 39, 11]
  },
  {
    id: 43, name: '苍耳子散', source: '《济生方》',
    efficacy: '散风除湿，通利鼻窍',
    syndrome: '风寒袭肺',
    indication: '鼻渊证。鼻塞不通，流浊涕不止，前额头痛',
    herbs: [38, 11, 54, 4],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [12]
  },
  {
    id: 44, name: '苏子降气汤', source: '《太平惠民和剂局方》',
    efficacy: '降气平喘，祛痰止咳',
    syndrome: '肾不纳气',
    indication: '上实下虚之喘证。痰涎壅盛，喘咳短气，腰痛脚弱',
    herbs: [30, 19, 47, 65, 1, 4],
    usage: '水煎服',
    caution: '肺肾两虚无明显寒湿者慎用',
    symptoms: [10, 9, 8]
  },

  // ===== 肾系扩展 =====
  {
    id: 45, name: '真武汤', source: '《伤寒论》',
    efficacy: '温阳利水',
    syndrome: '肾阳虚',
    indication: '阳虚水泛证。小便不利，四肢沉重疼痛，浮肿',
    herbs: [64, 3, 26, 7, 65],
    usage: '水煎服',
    caution: '阴虚火旺者忌用',
    symptoms: [22, 13, 17]
  },

  // ===== 心系扩展 =====
  {
    id: 46, name: '朱砂安神丸', source: '《医学发明》',
    efficacy: '镇心安神，清热养血',
    syndrome: '心火旺盛',
    indication: '心火亢盛证。心神烦乱，怔忡失眠，胸中烦热',
    herbs: [35, 15, 5, 4],
    usage: '蜜丸或水煎服',
    caution: '孕妇忌用，不宜久服',
    symptoms: [14, 42, 13]
  },

  // ===== 肝系扩展 =====
  {
    id: 47, name: '柴胡疏肝散', source: '《景岳全书》',
    efficacy: '疏肝行气，活血止痛',
    syndrome: '肝气郁结',
    indication: '肝气郁滞证。胁肋疼痛，寒热往来，情志抑郁',
    herbs: [12, 7, 22, 19, 20, 46, 4],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [16, 19, 2]
  },
  {
    id: 48, name: '一贯煎', source: '《续名医类案》',
    efficacy: '滋阴疏肝',
    syndrome: '肝阴虚',
    indication: '肝肾阴虚，肝气不舒证。胸脘胁痛，吞酸吐苦',
    herbs: [6, 34, 35, 5, 33, 50],
    usage: '水煎服',
    caution: '痰湿停饮者慎用',
    symptoms: [16]
  },
  {
    id: 49, name: '杞菊地黄丸', source: '《医级》',
    efficacy: '滋肾养肝明目',
    syndrome: '肝肾不足',
    indication: '肝肾阴虚证。两目昏花，视物模糊，眩晕耳鸣',
    herbs: [6, 26, 27, 48, 33, 52, 37],
    usage: '蜜丸或水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [44, 17, 20]
  },
  {
    id: 50, name: '镇肝熄风汤', source: '《医学衷中参西录》',
    efficacy: '镇肝息风，滋阴潜阳',
    syndrome: '肝阳上亢',
    indication: '肝阳上亢，内风暗动证。头目眩晕，脑中热痛，肢体不利',
    herbs: [48, 99, 7, 34, 36, 50, 56, 4],
    usage: '水煎服',
    caution: '气血亏虚者慎用',
    symptoms: [17, 45, 19]
  },

  // ===== 妇科类 =====
  {
    id: 51, name: '完带汤', source: '《傅青主女科》',
    efficacy: '健脾益气，除湿止带',
    syndrome: '脾虚湿盛',
    indication: '脾虚肝郁，湿浊带下证。带下色白量多，倦怠便溏',
    herbs: [3, 32, 31, 26, 7, 19, 12, 4],
    usage: '水煎服',
    caution: '湿热下注者不宜',
    symptoms: [76, 2]
  },
  {
    id: 52, name: '温经汤', source: '《金匮要略》',
    efficacy: '温经散寒，养血祛瘀',
    syndrome: '寒凝血瘀',
    indication: '冲任虚寒，瘀血阻滞证。月经不调，少腹冷痛，经期紊乱',
    herbs: [10, 5, 7, 6, 22, 14, 4],
    usage: '水煎服',
    caution: '热证者不宜',
    symptoms: [74, 27]
  },

  // ===== 湿热类 =====
  {
    id: 53, name: '四妙丸', source: '《成方便读》',
    efficacy: '清热利湿',
    syndrome: '湿热下注',
    indication: '湿热下注证。两足麻木，痿软无力，带下黄稠',
    herbs: [43, 47, 27, 26, 52],
    usage: '水丸或水煎服',
    caution: '寒湿者不宜',
    symptoms: [54, 64]
  },
  {
    id: 54, name: '茵陈蒿汤', source: '《伤寒论》',
    efficacy: '清热利湿退黄',
    syndrome: '肝胆湿热',
    indication: '湿热黄疸证。一身面目俱黄，黄色鲜明，小便不利',
    herbs: [41, 69, 14],
    usage: '水煎服',
    caution: '阴黄者不宜',
    symptoms: [53, 55]
  },
  {
    id: 55, name: '八正散', source: '《太平惠民和剂局方》',
    efficacy: '清热泻火，利水通淋',
    syndrome: '膀胱湿热',
    indication: '湿热淋证。尿频尿急，溺时涩痛，小便短赤',
    herbs: [52, 53, 14, 15, 41, 69, 4],
    usage: '水煎服',
    caution: '阴虚者不宜',
    symptoms: [55]
  },

  // ===== 痰饮类 =====
  {
    id: 56, name: '苓桂术甘汤', source: '《伤寒论》',
    efficacy: '温阳化饮，健脾利湿',
    syndrome: '痰饮停胃',
    indication: '痰饮病。胸胁支满，目眩心悸，短气而咳',
    herbs: [26, 10, 3, 4],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [60, 58]
  },
  {
    id: 57, name: '三子养亲汤', source: '《韩氏医通》',
    efficacy: '温肺化痰，降气消食',
    syndrome: '痰湿阻肺',
    indication: '痰壅气逆证。咳嗽喘逆，痰多胸痞，食少难消',
    herbs: [28, 30, 81],
    usage: '水煎服',
    caution: '阴虚燥咳者不宜',
    symptoms: [9, 8, 10]
  },
  {
    id: 58, name: '半夏白术天麻汤', source: '《医学心悟》',
    efficacy: '健脾燥湿，化痰息风',
    syndrome: '痰浊上扰',
    indication: '风痰上扰证。眩晕头痛，胸闷呕恶，舌苔白腻',
    herbs: [28, 3, 56, 26, 19, 4],
    usage: '水煎服',
    caution: '肝阳上亢者不宜',
    symptoms: [58, 17]
  },

  // ===== 风湿类 =====
  {
    id: 59, name: '独活寄生汤', source: '《备急千金要方》',
    efficacy: '祛风湿，止痹痛，益肝肾',
    syndrome: '风寒湿痹',
    indication: '痹证日久，肝肾两虚。腰膝疼痛，肢节屈伸不利，麻木不仁',
    herbs: [59, 60, 61, 62, 63, 31, 5, 7, 6, 98, 26, 4],
    usage: '水煎服',
    caution: '湿热痹证者不宜',
    symptoms: [63, 67, 66]
  },

  // ===== 皮肤类 =====
  {
    id: 60, name: '消风散', source: '《外科正宗》',
    efficacy: '疏风养血，清热除湿',
    syndrome: '风邪客表',
    indication: '风疹湿疹。皮肤瘙痒，疹出色红，遍身云片斑点',
    herbs: [38, 39, 11, 5, 6, 14, 43, 26, 4],
    usage: '水煎服',
    caution: '血虚风燥者慎用',
    symptoms: [68, 69, 70]
  },
  {
    id: 61, name: '当归饮子', source: '《济生方》',
    efficacy: '养血润燥，息风止痒',
    syndrome: '血虚风燥',
    indication: '血虚风燥证。皮肤瘙痒，干燥脱屑，毛发脱落',
    herbs: [5, 6, 7, 22, 38, 4, 33],
    usage: '水煎服',
    caution: '湿热浸淫者不宜',
    symptoms: [68, 72, 73]
  },
  {
    id: 62, name: '枇杷清肺饮', source: '《医宗金鉴》',
    efficacy: '清肺胃热',
    syndrome: '肺胃蕴热',
    indication: '肺风粉刺证。颜面潮红，粉刺焮红，脓疱',
    herbs: [14, 41, 15, 4],
    usage: '水煎服',
    caution: '脾胃虚寒者慎用',
    symptoms: [71]
  },

  // ===== 通便类 =====
  {
    id: 63, name: '麻子仁丸', source: '《伤寒论》',
    efficacy: '润肠泻热，行气通便',
    syndrome: '肠燥津亏',
    indication: '脾约证。大便干结，小便频数，脘腹胀痛',
    herbs: [72, 69, 30, 46, 4],
    usage: '蜜丸或水煎服',
    caution: '孕妇及血虚津亏者慎用',
    symptoms: [4]
  },
  {
    id: 64, name: '玉女煎', source: '《景岳全书》',
    efficacy: '清胃热，滋肾阴',
    syndrome: '胃火炽盛',
    indication: '胃热阴虚证。头痛牙痛，齿松牙衄，烦热口渴',
    herbs: [42, 6, 34, 48, 4],
    usage: '水煎服',
    caution: '脾胃虚寒者忌用',
    symptoms: [35, 6, 11]
  },
  {
    id: 65, name: '旋覆代赭汤', source: '《伤寒论》',
    efficacy: '降逆化痰，益气和胃',
    syndrome: '胃气上逆',
    indication: '胃虚痰阻证。心下痞硬，噫气不除，反胃呕吐',
    herbs: [28, 31, 4, 19, 65],
    usage: '水煎服',
    caution: '阴虚火旺者慎用',
    symptoms: [5, 7]
  },

  // ===== 儿科类 =====
  {
    id: 66, name: '升麻葛根汤', source: '《阎氏小儿方论》',
    efficacy: '辛凉解肌，透疹解毒',
    syndrome: '风热',
    indication: '麻疹初起证。疹出不透，发热咳嗽，目赤流泪',
    herbs: [13, 7, 4, 38],
    usage: '水煎服',
    caution: '麻疹已透者不宜',
    symptoms: [82]
  },
  {
    id: 67, name: '缩泉丸', source: '《魏氏家藏方》',
    efficacy: '温肾祛寒，缩尿止遗',
    syndrome: '肾气不足',
    indication: '下元虚寒证。小便频数，小儿遗尿，小便清长',
    herbs: [32, 86, 4],
    usage: '蜜丸或水煎服',
    caution: '湿热尿频者不宜',
    symptoms: [81, 21]
  },
  {
    id: 68, name: '健脾丸', source: '《证治准绳》',
    efficacy: '健脾消食',
    syndrome: '脾胃虚弱',
    indication: '脾虚食积证。食少难消，脘腹痞闷，大便溏薄',
    herbs: [3, 31, 19, 81, 82, 83, 4],
    usage: '蜜丸或水煎服',
    caution: '湿热泄泻者不宜',
    symptoms: [80, 1, 2]
  }
];

// 症状分类
const SYMPTOM_CATEGORIES = [
  '全部', '脾胃', '肺系', '心系', '肝系', '肾系', '气血', '外感', '虚损',
  '湿热', '痰饮', '风湿', '皮肤', '妇科', '儿科'
];
