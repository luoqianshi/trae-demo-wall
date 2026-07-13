/**
 * 医知通 - 临床知识智能速查助手
 * 内置医学知识库
 * 数据来源标注于每条记录的 source 字段
 */

const MEDICAL_DB = {

  // ========== 药品数据库 ==========
  drugs: [
    {
      id: 'd001',
      name: '阿司匹林',
      aliases: ['ASA', '乙酰水杨酸', '阿斯匹林', '拜阿司匹灵'],
      category: '解热镇痛抗炎药',
      indication: '用于发热、头痛、牙痛、肌肉痛、关节痛等疼痛症状的缓解；小剂量用于心脑血管疾病的二级预防（抗血小板聚集）。',
      dosage: '解热镇痛：一次0.3-0.6g，一日3次，必要时服用。抗血小板：一日75-150mg，顿服。',
      contraindications: [
        '对阿司匹林或其他非甾体抗炎药过敏者禁用',
        '活动性消化道溃疡患者禁用',
        '血友病或血小板减少症患者禁用',
        '妊娠期最后三个月禁用',
        '严重肝、肾功能衰竭者禁用'
      ],
      adverseReactions: [
        '胃肠道反应：恶心、呕吐、上腹不适，长期使用可致胃溃疡、胃出血',
        '出血倾向增加：牙龈出血、皮肤瘀斑',
        '过敏反应：皮疹、哮喘发作（阿司匹林哮喘）',
        '长期大剂量可致耳鸣、听力下降（水杨酸反应）'
      ],
      interactions: [
        { drug: '氯吡格雷', effect: '协同抗血小板作用，但出血风险显著增加', severity: 'high' },
        { drug: '华法林', effect: '增强抗凝效果，出血风险大幅升高', severity: 'high' },
        { drug: '布洛芬', effect: '竞争结合位点，降低阿司匹林的心血管保护作用', severity: 'medium' },
        { drug: '甲氨蝶呤', effect: '减少甲氨蝶呤排泄，增加毒性', severity: 'high' },
        { drug: '糖皮质激素', effect: '增加胃肠道溃疡和出血风险', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠早期）/ D（妊娠晚期）',
      source: '《中国国家处方集》（第2版）',
      sourceDetail: '中华医学会编著，人民军医出版社，2019年',
      tags: ['心血管', '抗血小板', '解热镇痛']
    },
    {
      id: 'd002',
      name: '头孢曲松钠',
      aliases: ['头孢曲松', '头孢', '罗氏芬', '菌必治', 'ceftriaxone'],
      category: '头孢菌素类抗生素（第三代）',
      indication: '用于敏感菌所致的呼吸道感染、泌尿道感染、腹腔感染、皮肤软组织感染、骨关节感染、败血症、脑膜炎等。',
      dosage: '成人：一日1-2g，分1-2次静脉滴注或肌肉注射。儿童：一日20-80mg/kg，分1-2次给药。',
      contraindications: [
        '对头孢菌素类过敏者禁用',
        '新生儿高胆红素血症禁用',
        '不能与含钙输液（如林格液）混合使用，可形成头孢曲松钙沉淀'
      ],
      adverseReactions: [
        '过敏反应：皮疹、瘙痒、药物热，严重者可致过敏性休克',
        '胃肠道：腹泻、恶心、呕吐',
        '血液系统：嗜酸性粒细胞增多、血小板减少',
        '肝功能异常：转氨酶一过性升高',
        '长期使用可致二重感染（如念珠菌感染）'
      ],
      interactions: [
        { drug: '酒精/含酒精饮料', effect: '双硫仑样反应：面部潮红、头痛、心悸、呼吸困难，严重可致死', severity: 'high' },
        { drug: '含钙输液', effect: '形成不溶性钙盐沉淀，可致致命性肺栓塞和肾结石', severity: 'high' },
        { drug: '丙磺舒', effect: '降低头孢曲松肾排泄，使血药浓度升高', severity: 'low' },
        { drug: '氨基糖苷类', effect: '协同抗菌但增加肾毒性', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗生素', '头孢', '感染']
    },
    {
      id: 'd003',
      name: '二甲双胍',
      aliases: ['格华止', 'metformin', '盐酸二甲双胍', '甲福明'],
      category: '口服降糖药（双胍类）',
      indication: '2型糖尿病一线治疗药物，尤其适用于肥胖型患者。可单独使用或与其他降糖药联合使用。',
      dosage: '起始剂量：一次0.5g，一日2次，随餐服用。可逐渐增加至一日2g，分2-3次服用。',
      contraindications: [
        '肾功能不全（eGFR<30 mL/min/1.73m²）禁用',
        '糖尿病酮症酸中毒禁用',
        '严重感染、外伤、大手术等应激状态禁用',
        '严重心肺功能不全禁用',
        '造影检查前后48小时应停药',
        '维生素B12缺乏者慎用'
      ],
      adverseReactions: [
        '胃肠道反应：恶心、呕吐、腹泻、腹部不适（常见，多可耐受）',
        '长期服用可影响维生素B12吸收',
        '罕见但严重：乳酸酸中毒（尤其在肾功能不全、缺氧状态下）',
        '口中金属味'
      ],
      interactions: [
        { drug: '造影剂（含碘）', effect: '增加乳酸酸中毒风险，造影前后48小时需停药', severity: 'high' },
        { drug: '酒精', effect: '增加乳酸酸中毒风险', severity: 'high' },
        { drug: '西咪替丁', effect: '减少二甲双胍肾排泄，血药浓度升高', severity: 'medium' },
        { drug: '胰岛素/磺脲类', effect: '协同降糖，需注意低血糖风险', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', '糖尿病', '内分泌']
    },
    {
      id: 'd004',
      name: '华法林钠',
      aliases: ['华法林', '苄丙酮香豆素钠', 'warfarin', '华法林钠片'],
      category: '口服抗凝药（香豆素类）',
      indication: '用于预防和治疗血栓栓塞性疾病：心房颤动、心脏瓣膜置换术后、深静脉血栓、肺栓塞等。',
      dosage: '个体化给药。起始剂量通常2.5-5mg/日，根据INR值调整。维持INR在2.0-3.0（机械瓣2.5-3.5）。',
      contraindications: [
        '活动性出血者禁用',
        '近期手术或创伤者禁用',
        '严重高血压未控制者禁用',
        '消化性溃疡患者禁用',
        '妊娠期禁用（可致胎儿畸形）',
        '严重肝肾功能不全者禁用'
      ],
      adverseReactions: [
        '出血：最常见且最严重，可表现为牙龈出血、血尿、皮下出血，严重者可致脑出血',
        '华法林坏死：罕见，皮肤和皮下组织坏死',
        '紫趾综合征：罕见',
        '脱发、皮疹'
      ],
      interactions: [
        { drug: '阿司匹林', effect: '出血风险大幅增加', severity: 'high' },
        { drug: '布洛芬', effect: '增加出血风险', severity: 'high' },
        { drug: '红霉素/克拉霉素', effect: '抑制华法林代谢，增强抗凝效果', severity: 'high' },
        { drug: '甲硝唑/磺胺类', effect: '增强抗凝效果，需密切监测INR', severity: 'high' },
        { drug: '维生素K', effect: '拮抗华法林作用，降低抗凝效果', severity: 'high' },
        { drug: '多种中草药（丹参、银杏等）', effect: '可增强或减弱抗凝效果，风险不可控', severity: 'high' }
      ],
      pregnancyCategory: 'X',
      source: '《心房颤动：目前的认识和治疗建议》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['抗凝', '心血管', '血栓']
    },
    {
      id: 'd005',
      name: '奥美拉唑',
      aliases: ['洛赛克', 'omeprazole', '奥克', '质子泵抑制剂'],
      category: '消化系统用药（质子泵抑制剂）',
      indication: '用于胃溃疡、十二指肠溃疡、反流性食管炎、卓-艾综合征、与抗生素联合根除幽门螺杆菌。',
      dosage: '消化性溃疡：一次20mg，一日1次，晨起顿服，疗程2-4周。根除H.pylori：一次20mg，一日2次，疗程7-14天。',
      contraindications: [
        '对本品过敏者禁用',
        '妊娠期慎用，哺乳期慎用'
      ],
      adverseReactions: [
        '头痛、腹痛、恶心、腹泻（较轻微）',
        '长期使用：骨折风险增加（骨质疏松）',
        '长期使用：低镁血症',
        '长期使用：维生素B12吸收障碍',
        '可能增加艰难梭菌感染风险'
      ],
      interactions: [
        { drug: '氯吡格雷', effect: '降低氯吡格雷活性代谢产物，减弱抗血小板效果', severity: 'high' },
        { drug: '地高辛', effect: '提高地高辛血药浓度', severity: 'medium' },
        { drug: '甲氨蝶呤', effect: '可能提高甲氨蝶呤血药浓度', severity: 'medium' },
        { drug: '酮康唑/伊曲康唑', effect: '降低这些药物吸收（胃pH升高）', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《消化性溃疡诊断与治疗规范》',
      sourceDetail: '中华消化杂志编委会',
      tags: ['消化', '抑酸', '溃疡']
    },
    {
      id: 'd006',
      name: '阿莫西林',
      aliases: ['amoxicillin', '羟氨苄青霉素', '阿莫仙', '弗莱莫星'],
      category: '青霉素类抗生素',
      indication: '用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染、消化道感染等。常用于根除幽门螺杆菌（联合其他药物）。',
      dosage: '成人：一次0.5g，每6-8小时一次，一日不超过4g。儿童：一日20-40mg/kg，分3次服用。',
      contraindications: [
        '青霉素过敏者禁用',
        '传染性单核细胞增多症患者禁用（易发皮疹）'
      ],
      adverseReactions: [
        '过敏反应：皮疹（最常见）、药物热，严重者过敏性休克',
        '胃肠道：恶心、呕吐、腹泻',
        '少数患者可出现白色念珠菌二重感染',
        '偶见肝功能异常'
      ],
      interactions: [
        { drug: '丙磺舒', effect: '减少阿莫西林肾排泄，提高血药浓度', severity: 'low' },
        { drug: '口服避孕药', effect: '可能降低避孕效果', severity: 'medium' },
        { drug: '别嘌醇', effect: '增加皮疹发生率', severity: 'low' },
        { drug: '甲氨蝶呤', effect: '减少甲氨蝶呤排泄，增加毒性', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗生素', '青霉素', '感染']
    },
    {
      id: 'd007',
      name: '美托洛尔',
      aliases: ['倍他乐克', 'metoprolol', '酒石酸美托洛尔', '琥珀酸美托洛尔'],
      category: '心血管用药（β受体阻滞剂）',
      indication: '用于高血压、心绞痛、慢性心力衰竭、心肌梗死后的二级预防、心律失常（如窦性心动过速、室上性心律失常）。',
      dosage: '高血压：酒石酸美托洛尔25-100mg，一日2次。心衰：琥珀酸美托洛尔起始12.5mg，一日1次，逐渐递增。',
      contraindications: [
        '严重心动过缓（心率<55次/分）禁用',
        '二度及以上房室传导阻滞（未植入起搏器）禁用',
        '心源性休克禁用',
        '严重支气管哮喘禁用',
        '严重外周血管疾病禁用'
      ],
      adverseReactions: [
        '心动过缓、传导阻滞',
        '乏力、头晕（体位性低血压）',
        '支气管痉挛（尤其有哮喘病史者）',
        '疲劳、睡眠障碍、抑郁',
        '性功能减退',
        '突然停药可致反跳性高血压和心律失常（撤药综合征）'
      ],
      interactions: [
        { drug: '维拉帕米/地尔硫䓬', effect: '严重心动过缓、房室传导阻滞风险', severity: 'high' },
        { drug: '胰岛素/口服降糖药', effect: '掩盖低血糖症状（心悸等），延迟低血糖恢复', severity: 'medium' },
        { drug: '胺碘酮', effect: '增加心动过缓和传导阻滞风险', severity: 'high' },
        { drug: '非二氢吡啶类CCB', effect: '严重抑制心肌收缩力和传导', severity: 'high' }
      ],
      pregnancyCategory: 'C',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['心血管', '降压', '心衰']
    },
    {
      id: 'd008',
      name: '氯吡格雷',
      aliases: ['波立维', 'clopidogrel', '泰嘉', '硫酸氢氯吡格雷'],
      category: '心血管用药（抗血小板药）',
      indication: '用于近期心肌梗死、缺血性脑卒中、确诊的外周动脉疾病。也用于急性冠脉综合征（与阿司匹林联合）。',
      dosage: '一次75mg，一日1次。急性冠脉综合征：起始负荷剂量300mg，维持量75mg/日（与阿司匹林联用）。',
      contraindications: [
        '活动性出血（如消化性溃疡、颅内出血）禁用',
        '对本品过敏者禁用',
        '严重肝功能损害者禁用'
      ],
      adverseReactions: [
        '出血：最常见，表现为瘀斑、鼻出血、消化道出血',
        '胃肠道：腹痛、消化不良',
        '血液系统：血小板减少性紫癜（罕见但严重）',
        '皮疹、瘙痒'
      ],
      interactions: [
        { drug: '阿司匹林', effect: '协同抗血小板，出血风险增加', severity: 'high' },
        { drug: '奥美拉唑', effect: '降低氯吡格雷活性代谢产物，减弱抗血小板效果', severity: 'high' },
        { drug: '华法林', effect: '出血风险大幅增加', severity: 'high' },
        { drug: '氟西汀/氟伏沙明', effect: '抑制氯吡格雷活化，降低疗效', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《急性ST段抬高型心肌梗死诊断和治疗指南》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心血管', '抗血小板', '冠心病']
    },
    {
      id: 'd009',
      name: '布洛芬',
      aliases: ['ibuprofen', '芬必得', '美林', '雅维'],
      category: '解热镇痛抗炎药（NSAIDs）',
      indication: '用于发热、轻中度疼痛（头痛、牙痛、肌肉痛、痛经、关节痛）、类风湿关节炎、骨关节炎的消炎止痛。',
      dosage: '解热镇痛：一次0.2-0.4g，每4-6小时一次，一日不超过1.2g。抗炎：一次0.4-0.8g，一日3-4次。',
      contraindications: [
        '对阿司匹林或其他NSAIDs过敏者禁用',
        '活动性消化道溃疡或出血禁用',
        '严重心功能不全禁用',
        '严重肾功能不全禁用',
        '冠状动脉搭桥手术（CABG）围手术期禁用',
        '妊娠晚期禁用'
      ],
      adverseReactions: [
        '胃肠道：恶心、腹痛，长期使用可致溃疡、出血',
        '心血管：长期大剂量使用增加心肌梗死和脑卒中风险',
        '肾功能损害（尤其脱水或已有肾功能不全者）',
        '过敏反应：皮疹、哮喘发作',
        '血压升高'
      ],
      interactions: [
        { drug: '阿司匹林', effect: '降低阿司匹林心血管保护作用，增加消化道出血风险', severity: 'high' },
        { drug: '华法林', effect: '出血风险显著增加', severity: 'high' },
        { drug: 'ACE抑制剂/ARB', effect: '降低降压效果，增加肾损害风险', severity: 'medium' },
        { drug: '锂剂', effect: '升高锂血药浓度，增加锂中毒风险', severity: 'medium' },
        { drug: '甲氨蝶呤', effect: '增加甲氨蝶呤毒性', severity: 'high' }
      ],
      pregnancyCategory: 'C（妊娠早期）/ D（妊娠晚期）',
      source: '《中国国家处方集》（第2版）',
      sourceDetail: '中华医学会编著，人民军医出版社，2019年',
      tags: ['解热镇痛', 'NSAIDs', '抗炎']
    },
    {
      id: 'd010',
      name: '对乙酰氨基酚',
      aliases: ['paracetamol', '扑热息痛', '泰诺', 'acetaminophen', '必理通'],
      category: '解热镇痛药',
      indication: '用于发热、轻中度疼痛（头痛、关节痛、肌肉痛、牙痛、痛经）。不适合抗炎，因无外周抗炎作用。',
      dosage: '成人：一次0.5-1g，每4-6小时一次，一日不超过4g。儿童：一次10-15mg/kg，每4-6小时一次。',
      contraindications: [
        '严重肝功能不全者禁用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '常规剂量下不良反应少',
        '过量（一日>4g）可致严重肝损伤甚至肝衰竭',
        '长期使用可致肾损害',
        '偶见皮疹、粒细胞减少'
      ],
      interactions: [
        { drug: '酒精', effect: '显著增加肝损伤风险', severity: 'high' },
        { drug: '华法林', effect: '长期大量使用可增强抗凝效果', severity: 'medium' },
        { drug: '异烟肼', effect: '增加肝毒性风险', severity: 'high' },
        { drug: '卡马西平', effect: '增加肝毒性风险', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《中国国家处方集》（第2版）',
      sourceDetail: '中华医学会编著，人民军医出版社，2019年',
      tags: ['解热镇痛', '退热', '止痛']
    },
    {
      id: 'd011',
      name: '氨氯地平',
     aliases: ['amlodipine', '络活喜', '苯磺酸氨氯地平', '施慧达'],
      category: '心血管用药（钙通道阻滞剂）',
      indication: '用于高血压、稳定型心绞痛、变异型心绞痛。可单独使用或与其他降压药联合使用。',
      dosage: '起始5mg，一日1次。最大剂量10mg/日。老年或肝功能不全者起始2.5mg/日。',
      contraindications: [
        '对二氢吡啶类药物过敏者禁用',
        '严重低血压（收缩压<90mmHg）禁用',
        '心源性休克禁用'
      ],
      adverseReactions: [
        '外周水肿（踝部水肿，常见）',
        '面部潮红',
        '头痛、头晕',
        '心悸、心动过速',
        '牙龈增生（长期使用）'
      ],
      interactions: [
        { drug: '辛伐他汀', effect: '增加肌病风险，辛伐他汀剂量不超过20mg/日', severity: 'high' },
        { drug: '葡萄柚汁', effect: '升高氨氯地平血药浓度，增强降压效果', severity: 'medium' },
        { drug: 'CYP3A4强抑制剂（克拉霉素等）', effect: '升高氨氯地平血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['心血管', '降压', 'CCB']
    },
    {
      id: 'd012',
      name: '胰岛素',
      aliases: ['insulin', '普通胰岛素', '胰岛素注射液', '诺和灵', '优泌林', '短效胰岛素'],
      category: '降糖药（胰岛素类）',
      indication: '用于1型糖尿病（必需）、2型糖尿病口服药控制不佳者、糖尿病酮症酸中毒、高渗性昏迷、围手术期血糖控制、妊娠期糖尿病。',
      dosage: '个体化给药。短效胰岛素餐前30分钟皮下注射。基础+餐时方案：基础胰岛素一日1次，餐时胰岛素三餐前注射。',
      contraindications: [
        '低血糖发作时禁用',
        '对胰岛素过敏者禁用',
        '胰岛素耐药者需特殊处理'
      ],
      adverseReactions: [
        '低血糖：最常见且最危险，表现为心悸、出汗、饥饿感，严重可致昏迷',
        '注射部位：皮下脂肪萎缩或增生（脂肪营养不良）',
        '体重增加',
        '过敏反应：局部红肿、瘙痒',
        '胰岛素抵抗（长期使用）',
        '水肿（治疗初期）'
      ],
      interactions: [
        { drug: '酒精', effect: '增强降糖效果，增加严重低血糖风险', severity: 'high' },
        { drug: 'β受体阻滞剂', effect: '掩盖低血糖症状，延迟低血糖恢复', severity: 'high' },
        { drug: '口服避孕药/噻嗪类利尿剂/糖皮质激素', effect: '降低降糖效果', severity: 'medium' },
        { drug: '二甲双胍', effect: '协同降糖，需注意低血糖', severity: 'medium' },
        { drug: 'ACE抑制剂', effect: '增强降糖效果，需监测血糖', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', '糖尿病', '胰岛素']
    },
    {
      id: 'd013',
      name: '阿奇霉素',
      aliases: ['azithromycin', '希舒美', '维宏', '阿齐霉素'],
      category: '大环内酯类抗生素',
      indication: '用于敏感菌引起的呼吸道感染（咽炎、扁桃体炎、肺炎）、皮肤软组织感染、支原体/衣原体感染、性传播疾病。',
      dosage: '成人：第1日0.5g顿服，第2-5日0.25g/日顿服（序贯疗法）。或0.5g/日顿服3天。儿童：10mg/kg，一日1次，连用3天。',
      contraindications: [
        '对大环内酯类过敏者禁用',
        '严重肝功能不全禁用',
        'QT间期延长者慎用'
      ],
      adverseReactions: [
        '胃肠道：恶心、呕吐、腹泻（最常见）',
        '肝功能异常：转氨酶升高',
        '心血管：QT间期延长，可致心律失常（罕见但严重）',
        '过敏：皮疹',
        '听力下降（大剂量长期使用）'
      ],
      interactions: [
        { drug: '华法林', effect: '增强抗凝效果，需密切监测INR', severity: 'high' },
        { drug: '地高辛', effect: '升高地高辛血药浓度，增加中毒风险', severity: 'high' },
        { drug: '抗酸药（含铝/镁）', effect: '降低阿奇霉素吸收，需间隔2小时服用', severity: 'low' },
        { drug: '其他QT延长药物', effect: '叠加QT延长效应，增加心律失常风险', severity: 'high' }
      ],
      pregnancyCategory: 'B',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗生素', '大环内酯', '感染']
    },
    {
      id: 'd014',
      name: '左氧氟沙星',
      aliases: ['levofloxacin', '可乐必妥', '左克', '来立信'],
      category: '氟喹诺酮类抗生素',
      indication: '用于敏感菌引起的呼吸道感染、泌尿道感染、皮肤软组织感染、复杂性腹腔感染等。',
      dosage: '成人：一次0.5g，一日1次，静脉或口服。疗程通常5-14天，根据感染类型而定。',
      contraindications: [
        '18岁以下未成年人禁用（影响软骨发育）',
        '妊娠期和哺乳期禁用',
        '对氟喹诺酮类过敏者禁用',
        '癫痫患者禁用'
      ],
      adverseReactions: [
        '肌腱炎和肌腱断裂（尤其跟腱，老年人风险更高）',
        '中枢神经系统：头痛、头晕、失眠，严重可致精神症状和癫痫',
        '周围神经病变（可为不可逆）',
        'QT间期延长',
        '胃肠道：恶心、腹泻',
        '光敏反应'
      ],
      interactions: [
        { drug: '含钙/镁/铝/铁的制剂', effect: '显著降低左氧氟沙星吸收，需间隔2小时', severity: 'medium' },
        { drug: '华法林', effect: '增强抗凝效果，需监测INR', severity: 'high' },
        { drug: '降糖药', effect: '可致严重低血糖或高血糖', severity: 'high' },
        { drug: '皮质类固醇', effect: '增加肌腱断裂风险', severity: 'high' },
        { drug: '其他QT延长药物', effect: '叠加QT延长效应', severity: 'high' }
      ],
      pregnancyCategory: 'C（禁用）',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗生素', '喹诺酮', '感染']
    },
    {
      id: 'd015',
      name: '甲氨蝶呤',
      aliases: ['methotrexate', 'MTX', '氨甲蝶呤', '美索纳'],
      category: '抗代谢药（免疫抑制剂/抗肿瘤药）',
      indication: '用于类风湿关节炎、银屑病等自身免疫疾病（小剂量）；急性白血病、绒毛膜上皮癌等（大剂量）。',
      dosage: '类风湿关节炎：每周7.5-15mg，顿服或分3次（每12小时1次）。须配合叶酸（除外用药日）。',
      contraindications: [
        '妊娠期绝对禁用（强致畸性）',
        '哺乳期禁用',
        '严重肝肾功能不全禁用',
        '活动性感染禁用',
        '血液系统疾病（白细胞/血小板减少）禁用'
      ],
      adverseReactions: [
        '骨髓抑制：白细胞、血小板减少',
        '肝毒性：转氨酶升高，长期可致肝纤维化',
        '肺毒性：间质性肺炎（急性或迟发）',
        '口腔黏膜溃疡（早期毒性信号）',
        '肾脏损害（大剂量）',
        '脱发、皮疹',
        '生殖功能影响'
      ],
      interactions: [
        { drug: '阿司匹林', effect: '减少甲氨蝶呤肾排泄，显著增加毒性', severity: 'high' },
        { drug: '布洛芬', effect: '增加甲氨蝶呤毒性', severity: 'high' },
        { drug: '复方磺胺甲噁唑', effect: '叠加抗叶酸作用，严重骨髓抑制', severity: 'high' },
        { drug: '左氧氟沙星', effect: '降低甲氨蝶呤清除，增加毒性', severity: 'medium' },
        { drug: '叶酸', effect: '可减轻部分不良反应（需除外用药日）', severity: 'low' }
      ],
      pregnancyCategory: 'X',
      source: '《类风湿关节炎诊断及治疗指南》',
      sourceDetail: '中华医学会风湿病学分会',
      tags: ['免疫抑制', '抗肿瘤', '风湿']
    },
    {
      id: 'd016',
      name: '地高辛',
      aliases: ['digoxin', '可力', '狄戈辛'],
      category: '心血管用药（强心苷）',
      indication: '用于心力衰竭（尤其伴房颤者）、心房颤动和心房扑动的心室率控制。',
      dosage: '维持量：一日0.125-0.25mg，口服。老年人和肾功能不全者减量。',
      contraindications: [
        '预激综合征伴房颤/房扑禁用',
        '室性心动过速禁用',
        '肥厚性梗阻型心肌病禁用',
        '严重低钾血症禁用',
        '二度及以上房室传导阻滞禁用'
      ],
      adverseReactions: [
        '洋地黄中毒：恶心、呕吐、厌食',
        '心律失常：室性早搏、房室传导阻滞',
        '视觉障碍：黄视、绿视（特征性中毒表现）',
        '中枢：头痛、乏力、精神错乱',
        '中毒与低钾血症、低镁血症密切相关'
      ],
      interactions: [
        { drug: '胺碘酮', effect: '升高地高辛血药浓度50%-100%，需减量', severity: 'high' },
        { drug: '维拉帕米', effect: '显著升高地高辛血药浓度', severity: 'high' },
        { drug: '排钾利尿剂（呋塞米等）', effect: '低钾血症增加洋地黄中毒风险', severity: 'high' },
        { drug: '左氧氟沙星', effect: '升高地高辛血药浓度', severity: 'medium' },
        { drug: '阿奇霉素/克拉霉素', effect: '升高地高辛血药浓度', severity: 'high' }
      ],
      pregnancyCategory: 'C',
      source: '《中国心力衰竭诊断和治疗指南》（2018）',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心血管', '心衰', '强心苷']
    },
    {
      id: 'd017',
      name: '阿托伐他汀',
      aliases: ['atorvastatin', '立普妥', '阿乐', '钙片'],
      category: '心血管用药（他汀类调脂药）',
      indication: '用于高胆固醇血症、混合性高脂血症、冠心病及高危人群的心血管事件预防。',
      dosage: '起始10-20mg，一日1次，晚餐后服用。最大剂量80mg/日。',
      contraindications: [
        '活动性肝病或不明原因转氨酶升高禁用',
        '妊娠期和哺乳期禁用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '肌肉毒性：肌痛、肌炎，严重者横纹肌溶解（罕见但严重）',
        '肝功能异常：转氨酶升高',
        '胃肠道：便秘、腹胀、消化不良',
        '头痛、失眠',
        '新发糖尿病（长期使用风险轻微增加）'
      ],
      interactions: [
        { drug: '克拉霉素/红霉素', effect: '显著升高他汀血药浓度，增加肌病风险', severity: 'high' },
        { drug: '环孢素', effect: '严重增加肌病和横纹肌溶解风险', severity: 'high' },
        { drug: '吉非贝齐', effect: '显著增加横纹肌溶解风险', severity: 'high' },
        { drug: '氨氯地平', effect: '轻度升高他汀血药浓度', severity: 'low' },
        { drug: '葡萄柚汁', effect: '升高他汀血药浓度，增加不良反应', severity: 'medium' }
      ],
      pregnancyCategory: 'X',
      source: '《中国成人血脂异常防治指南》（2016年修订版）',
      sourceDetail: '中国成人血脂异常防治指南修订联合委员会',
      tags: ['心血管', '调脂', '他汀']
    },
    {
      id: 'd018',
      name: '地塞米松',
      aliases: ['dexamethasone', 'DXMS', '氟美松', '地塞米松磷酸钠'],
      category: '糖皮质激素',
      indication: '用于过敏性疾病、自身免疫性疾病、严重感染（辅助治疗）、休克、脑水肿、预防新生儿呼吸窘迫综合征等。',
      dosage: '口服：0.75-3mg/日，分次服用。静脉：2-20mg/次，根据病情调整。疗程根据病情决定，不宜骤停。',
      contraindications: [
        '严重精神病禁用',
        '活动性消化性溃疡禁用',
        '严重高血压禁用',
        '未控制的感染禁用',
        '妊娠早期慎用'
      ],
      adverseReactions: [
        '长期使用：类库欣综合征（满月脸、水牛背、向心性肥胖）',
        '骨质疏松、病理性骨折',
        '血糖升高（类固醇性糖尿病）',
        '消化道溃疡、出血',
        '免疫力下降，易感染',
        '精神症状：兴奋、失眠、躁狂',
        '肾上腺皮质功能抑制（骤停可致危象）'
      ],
      interactions: [
        { drug: '阿司匹林', effect: '增加胃肠道溃疡和出血风险', severity: 'high' },
        { drug: '口服降糖药/胰岛素', effect: '降低降糖效果，需调整剂量', severity: 'medium' },
        { drug: '华法林', effect: '抗凝效果变化不定，需密切监测', severity: 'medium' },
        { drug: '利福平/苯妥英', effect: '加速地塞米松代谢，降低疗效', severity: 'medium' },
        { drug: '排钾利尿剂', effect: '加重低钾血症', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《糖皮质激素类药物临床应用指导原则》',
      sourceDetail: '卫生部办公厅发布，2011年',
      tags: ['激素', '免疫抑制', '抗炎']
    },
    {
      id: 'd019',
      name: '硝苯地平',
      aliases: ['nifedipine', '心痛定', '拜新同', '硝苯地平控释片'],
      category: '心血管用药（钙通道阻滞剂）',
      indication: '用于高血压、心绞痛（变异型及稳定型）。控释片用于高血压和慢性稳定型心绞痛。',
      dosage: '控释片：30-60mg，一日1次。普通片：5-10mg，一日3次。最大剂量不超过90mg/日。',
      contraindications: [
        '心源性休克禁用',
        '严重主动脉瓣狭窄禁用',
        '不稳定型心绞痛禁用（普通片）',
        '妊娠20周以内禁用'
      ],
      adverseReactions: [
        '外周水肿（踝部水肿，常见）',
        '面部潮红',
        '头痛、头晕',
        '心悸（反射性心动过速）',
        '牙龈增生',
        '普通片可致血压骤降'
      ],
      interactions: [
        { drug: '葡萄柚汁', effect: '显著升高硝苯地平血药浓度', severity: 'high' },
        { drug: 'β受体阻滞剂', effect: '协同降压，但可致严重低血压和心衰', severity: 'medium' },
        { drug: '地高辛', effect: '轻度升高地高辛血药浓度', severity: 'low' },
        { drug: 'CYP3A4抑制剂（克拉霉素等）', effect: '升高硝苯地平血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['心血管', '降压', 'CCB']
    },
    {
      id: 'd020',
      name: '呋塞米',
      aliases: ['furosemide', '速尿', '呋喃苯胺酸', 'lasix'],
      category: '利尿剂（袢利尿剂）',
      indication: '用于各种水肿（心源性、肝源性、肾源性）、急性肺水肿、高血压（尤其伴肾功能不全或心衰者）、高钙血症。',
      dosage: '口服：20-40mg，一日1-2次。静脉：20-40mg/次，必要时可重复。根据尿量调整。',
      contraindications: [
        '低钾血症未纠正禁用',
        '严重低钠血症禁用',
        '脱水患者禁用',
        '对磺胺类药物过敏者慎用',
        '无尿患者禁用'
      ],
      adverseReactions: [
        '电解质紊乱：低钾血症、低钠血症、低钙血症',
        '脱水、低血压',
        '高尿酸血症（可诱发痛风）',
        '血糖升高',
        '听力损害（大剂量静脉注射，尤其与氨基糖苷类合用）',
        '低镁血症'
      ],
      interactions: [
        { drug: '地高辛', effect: '低钾血症增加洋地黄中毒风险', severity: 'high' },
        { drug: '氨基糖苷类抗生素', effect: '叠加耳毒性，可致严重听力损害', severity: 'high' },
        { drug: 'NSAIDs（布洛芬等）', effect: '降低利尿效果，增加肾损害风险', severity: 'medium' },
        { drug: '锂剂', effect: '减少锂排泄，增加锂中毒风险', severity: 'high' },
        { drug: '糖皮质激素', effect: '加重低钾血症', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国心力衰竭诊断和治疗指南》（2018）',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['利尿', '心血管', '水肿']
    },
    {
      id: 'd021',
      name: '利伐沙班',
      aliases: ['rivaroxaban', '拜瑞妥', '利伐沙班片'],
      category: '口服抗凝药（DOAC，Xa因子抑制剂）',
      indication: '用于非瓣膜性心房颤动患者卒中和体循环栓塞预防；深静脉血栓（DVT）和肺栓塞（PE）的治疗及预防复发；髋膝关节置换术后VTE预防。',
      dosage: '房颤：20mg，一日1次（肌酐清除率15-50mL/min：15mg/日）。DVT/PE急性期：15mg，一日2次，连服3周后改为20mg，一日1次。关节置换：10mg，一日1次。',
      contraindications: [
        '活动性出血者禁用',
        '严重肝功能损害（Child-Pugh C级）禁用',
        '妊娠期和哺乳期禁用',
        '人工心脏瓣膜者禁用',
        '严重未控制的高血压禁用'
      ],
      adverseReactions: [
        '出血：最常见且最严重，可表现为牙龈出血、皮下出血，严重者可致消化道出血、颅内出血',
        '肝功能异常：转氨酶升高',
        '罕见过敏反应：皮疹、血管性水肿',
        '术后伤口渗血'
      ],
      interactions: [
        { drug: '酮康唑/伊曲康唑', effect: '强CYP3A4/P-gp抑制剂，显著升高利伐沙班血药浓度，出血风险大增', severity: 'high' },
        { drug: '利福平/苯妥英', effect: '强CYP3A4/P-gp诱导剂，降低利伐沙班血药浓度，抗凝效果减弱', severity: 'high' },
        { drug: '阿司匹林/氯吡格雷', effect: '叠加抗栓效应，出血风险显著增加', severity: 'high' },
        { drug: 'NSAIDs（布洛芬等）', effect: '增加出血风险', severity: 'medium' },
        { drug: '华法林', effect: '不建议转换期联用，出血风险高', severity: 'high' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《非瓣膜性心房颤动患者新型口服抗凝药应用中国专家建议》',
      sourceDetail: '中华心血管病杂志编辑委员会，2014年',
      tags: ['抗凝', 'DOAC', '心血管', '血栓']
    },
    {
      id: 'd022',
      name: '达比加群酯',
      aliases: ['dabigatran etexilate', '泰毕全', '达比加群'],
      category: '口服抗凝药（DOAC，直接凝血酶抑制剂）',
      indication: '用于非瓣膜性心房颤动患者卒中和体循环栓塞预防；DVT和PE的治疗及预防复发；髋膝关节置换术后VTE预防。',
      dosage: '房颤：150mg，一日2次（肌酐清除率30-50mL/min：110mg，一日2次）。DVT/PE：150mg，一日2次。关节置换：220mg或110mg，一日1次。',
      contraindications: [
        '活动性出血者禁用',
        '严重肾功能不全（CrCl<30 mL/min）禁用',
        '机械性心脏瓣膜者禁用',
        '妊娠期和哺乳期禁用',
        '严重肝功能不全禁用'
      ],
      adverseReactions: [
        '出血：消化道出血较多见（较华法林多），严重可致颅内出血（较华法林少）',
        '消化不良、腹痛、腹泻（常见）',
        '肝功能异常',
        '罕见过敏反应、血管性水肿'
      ],
      interactions: [
        { drug: '维拉帕米', effect: 'P-gp抑制剂，升高达比加群血药浓度，出血风险增加', severity: 'medium' },
        { drug: '胺碘酮', effect: 'P-gp抑制剂，轻度升高血药浓度', severity: 'medium' },
        { drug: '利福平', effect: 'P-gp强诱导剂，显著降低血药浓度', severity: 'high' },
        { drug: '阿司匹林/氯吡格雷', effect: '出血风险增加', severity: 'high' },
        { drug: 'NSAIDs', effect: '出血风险增加', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《非瓣膜性心房颤动患者新型口服抗凝药应用中国专家建议》',
      sourceDetail: '中华心血管病杂志编辑委员会，2014年',
      tags: ['抗凝', 'DOAC', '心血管', '血栓']
    },
    {
      id: 'd023',
      name: '阿哌沙班',
      aliases: ['apixaban', '艾乐妥', '阿哌沙班片'],
      category: '口服抗凝药（DOAC，Xa因子抑制剂）',
      indication: '用于非瓣膜性心房颤动患者卒中和体循环栓塞预防；DVT和PE的治疗及预防；髋膝关节置换术后VTE预防。',
      dosage: '房颤：5mg，一日2次（年龄≥80岁、体重≤60kg、血清肌酐≥133μmol/L中符合2项者：2.5mg，一日2次）。DVT/PE：10mg，一日2次×7天，后5mg，一日2次。关节置换：2.5mg，一日2次。',
      contraindications: [
        '活动性出血者禁用',
        '严重肝功能损害禁用',
        '妊娠期和哺乳期禁用',
        '人工心脏瓣膜者禁用'
      ],
      adverseReactions: [
        '出血：最常见，包括皮下、消化道、颅内出血',
        '肝功能异常',
        '恶心',
        '罕见过敏反应'
      ],
      interactions: [
        { drug: '酮康唑/伊曲康唑', effect: '强CYP3A4/P-gp抑制剂，显著升高血药浓度，出血风险大增', severity: 'high' },
        { drug: '利福平/苯妥英', effect: '强诱导剂，降低抗凝效果', severity: 'high' },
        { drug: '阿司匹林/氯吡格雷', effect: '出血风险显著增加', severity: 'high' },
        { drug: 'NSAIDs', effect: '增加出血风险', severity: 'medium' },
        { drug: '卡马西平', effect: '降低阿哌沙班血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'B（妊娠期仍禁用）',
      source: '《非瓣膜性心房颤动患者新型口服抗凝药应用中国专家建议》',
      sourceDetail: '中华心血管病杂志编辑委员会，2014年',
      tags: ['抗凝', 'DOAC', '心血管', '血栓']
    },
    {
      id: 'd024',
      name: '丙戊酸钠',
      aliases: ['sodium valproate', '德巴金', '丙戊酸', 'VPA'],
      category: '抗癫痫药（广谱）',
      indication: '用于全面性发作（强直阵挛、失神、肌阵挛）和部分性发作；双相情感障碍躁狂发作；偏头痛预防。',
      dosage: '起始5-10mg/kg/日，分2-3次；维持10-20mg/kg/日。成人常用600-1200mg/日。',
      contraindications: [
        '妊娠期禁用（强致畸性，神经管缺陷）',
        '严重肝功能不全禁用',
        '卟啉症禁用',
        '尿素循环障碍禁用',
        '活动性肝炎禁用'
      ],
      adverseReactions: [
        '胃肠反应：恶心、呕吐、食欲改变',
        '震颤、嗜睡',
        '体重增加',
        '脱发',
        '肝毒性（严重，需监测肝功）',
        '高氨血症',
        '血小板减少',
        '胰腺炎（罕见但严重）'
      ],
      interactions: [
        { drug: '美罗培南', effect: '显著降低丙戊酸血药浓度，可致癫痫发作', severity: 'high' },
        { drug: '拉莫三嗪', effect: '升高拉莫三嗪血药浓度2倍，需减量', severity: 'high' },
        { drug: '苯妥英钠', effect: '双向影响血药浓度，需监测', severity: 'medium' },
        { drug: '华法林', effect: '增加出血风险', severity: 'medium' },
        { drug: '阿司匹林', effect: '升高游离丙戊酸浓度，增加出血', severity: 'medium' }
      ],
      pregnancyCategory: 'D（妊娠期禁用，强致畸）',
      source: '《临床诊疗指南·癫痫病分册》',
      sourceDetail: '中华医学会编著，人民卫生出版社',
      tags: ['抗癫痫', '神经', '双相']
    },
    {
      id: 'd025',
      name: '苯妥英钠',
      aliases: ['phenytoin sodium', '大仑丁', '苯妥英', 'PHT'],
      category: '抗癫痫药',
      indication: '用于全面强直阵挛发作、部分性发作、癫痫持续状态；也用于某些室性心律失常。',
      dosage: '起始100mg，一日3次；维持300-400mg/日。癫痫持续状态：10-15mg/kg缓慢静脉注射（<50mg/min）。',
      contraindications: [
        '二度及以上房室传导阻滞禁用',
        '窦性心动过缓禁用',
        '严重心力衰竭禁用',
        '妊娠期慎用（致畸）',
        '对乙内酰脲类过敏者禁用'
      ],
      adverseReactions: [
        '牙龈增生（特征性，长期使用）',
        '多毛症',
        '共济失调、眼震（剂量相关）',
        '认知障碍',
        '巨幼细胞性贫血（叶酸缺乏）',
        '骨软化症',
        '皮疹（严重者SJS/TEN）',
        '狼疮样综合征',
        '周围神经病变'
      ],
      interactions: [
        { drug: '异烟肼', effect: '抑制苯妥英代谢，显著升高血药浓度，易中毒', severity: 'high' },
        { drug: '利福平', effect: '诱导代谢，降低苯妥英血药浓度', severity: 'high' },
        { drug: '华法林', effect: '双向影响，抗凝效果不稳定', severity: 'high' },
        { drug: '卡马西平', effect: '双向影响血药浓度', severity: 'medium' },
        { drug: '钙剂', effect: '减少苯妥英吸收', severity: 'low' },
        { drug: '叶酸', effect: '长期使用降低苯妥英血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'D',
      source: '《临床诊疗指南·癫痫病分册》',
      sourceDetail: '中华医学会编著，人民卫生出版社',
      tags: ['抗癫痫', '神经', '心律失常']
    },
    {
      id: 'd026',
      name: '卡马西平',
      aliases: ['carbamazepine', '得理多', '痛痉宁', 'CBZ'],
      category: '抗癫痫药',
      indication: '用于部分性发作（首选）、全面强直阵挛发作；三叉神经痛；舌咽神经痛；双相情感障碍躁狂发作。',
      dosage: '起始100-200mg，一日2次；维持400-1200mg/日，分2-3次。三叉神经痛：起始100mg，一日2次。',
      contraindications: [
        '房室传导阻滞禁用',
        '严重肝肾功能不全禁用',
        '卟啉病禁用',
        '既往骨髓抑制史禁用',
        '与单胺氧化酶抑制剂合用禁用'
      ],
      adverseReactions: [
        '头晕、嗜睡、共济失调',
        '低钠血症（SIADH）',
        '皮疹（严重者SJS/TEN，HLA-B*1502阳性者风险高）',
        '白细胞减少、再生障碍性贫血（罕见但严重）',
        '肝毒性',
        '胃肠反应'
      ],
      interactions: [
        { drug: '红霉素/克拉霉素', effect: '抑制卡马西平代谢，显著升高血药浓度，中毒风险', severity: 'high' },
        { drug: '葡萄柚汁', effect: '升高卡马西平血药浓度', severity: 'high' },
        { drug: '口服避孕药', effect: '诱导代谢，降低避孕效果，可致意外妊娠', severity: 'high' },
        { drug: '华法林', effect: '加速华法林代谢，降低抗凝效果', severity: 'high' },
        { drug: '苯妥英钠', effect: '双向影响血药浓度', severity: 'medium' },
        { drug: '利福平', effect: '降低卡马西平血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'D',
      source: '《临床诊疗指南·癫痫病分册》',
      sourceDetail: '中华医学会编著，人民卫生出版社',
      tags: ['抗癫痫', '神经', '三叉神经痛']
    },
    {
      id: 'd027',
      name: '拉莫三嗪',
      aliases: ['lamotrigine', '利必通', 'LTG'],
      category: '抗癫痫药',
      indication: '用于部分性发作、全面性发作（包括失神、强直阵挛、Lennox-Gastaut综合征）；双相情感障碍抑郁发作预防。',
      dosage: '单药治疗：起始25mg，一日1次，每2周加量；维持100-200mg/日。与丙戊酸合用：起始12.5mg隔日1次，维持100mg/日。',
      contraindications: [
        '严重肝肾功能不全慎用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '皮疹（最常见，严重者SJS/TEN，缓慢加量可减少风险）',
        '头痛、头晕',
        '嗜睡或失眠',
        '恶心',
        '复视、视力模糊',
        '罕见血液系统异常'
      ],
      interactions: [
        { drug: '丙戊酸钠', effect: '丙戊酸抑制拉莫三嗪代谢，血药浓度升高约2倍，需减半量', severity: 'high' },
        { drug: '卡马西平/苯妥英', effect: '诱导代谢，降低拉莫三嗪血药浓度', severity: 'medium' },
        { drug: '口服避孕药', effect: '雌激素诱导代谢，降低拉莫三嗪血药浓度', severity: 'medium' },
        { drug: '利福平', effect: '降低拉莫三嗪血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《临床诊疗指南·癫痫病分册》',
      sourceDetail: '中华医学会编著，人民卫生出版社',
      tags: ['抗癫痫', '神经', '双相']
    },
    {
      id: 'd028',
      name: '奥司他韦',
      aliases: ['oseltamivir', '达菲', '奥司他韦胶囊'],
      category: '抗病毒药（神经氨酸酶抑制剂）',
      indication: '用于甲型和乙型流行性感冒的治疗（症状出现48小时内）和预防。',
      dosage: '治疗：75mg，一日2次，连用5天。预防：75mg，一日1次，至少10天。儿童<1岁按体重调整。',
      contraindications: [
        '对本品严重过敏者禁用',
        '妊娠期慎用（获益>风险可用）'
      ],
      adverseReactions: [
        '恶心、呕吐（常见，餐后服用可减轻）',
        '头痛',
        '精神神经症状（儿童青少年多见，幻觉、谵妄、异常行为）',
        '皮疹、过敏反应'
      ],
      interactions: [
        { drug: '丙磺舒', effect: '升高奥司他韦活性代谢产物血药浓度', severity: 'low' },
        { drug: '流感疫苗（减毒活）', effect: '可能干扰疫苗效果，用药前48小时至停药后2周避免接种', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《流行性感冒诊疗方案（2018年版修订版）》',
      sourceDetail: '国家卫生健康委办公厅发布',
      tags: ['抗病毒', '流感', '感染']
    },
    {
      id: 'd029',
      name: '阿昔洛韦',
      aliases: ['aciclovir', 'acyclovir', '无环鸟苷', '丽珠克毒星'],
      category: '抗病毒药（核苷类似物）',
      indication: '用于单纯疱疹病毒（HSV）感染、水痘-带状疱疹病毒（VZV）感染。',
      dosage: '口服HSV初发：200mg，一日5次，连用5-10天。静脉：5-10mg/kg，每8小时1次，连用5-10天。肾功能不全需减量。',
      contraindications: [
        '对本品过敏者禁用',
        '严重肾功能不全慎用（需调整剂量）'
      ],
      adverseReactions: [
        '肾损害（药物结晶致肾小管损伤，需充分水化）',
        '中枢神经系统症状：嗜睡、震颤、谵妄、抽搐（高剂量或肾功能不全）',
        '局部刺激（静脉注射外渗）',
        '肝酶升高',
        '皮疹'
      ],
      interactions: [
        { drug: '丙磺舒', effect: '升高阿昔洛韦血药浓度，需调整剂量', severity: 'medium' },
        { drug: '肾毒性药物（氨基糖苷类等）', effect: '叠加肾毒性', severity: 'medium' },
        { drug: '齐多夫定', effect: '增加中枢神经系统毒性', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗病毒', '疱疹', '感染']
    },
    {
      id: 'd030',
      name: '氟康唑',
      aliases: ['fluconazole', '大扶康', '氟康唑胶囊'],
      category: '抗真菌药（三唑类）',
      indication: '用于念珠菌病（口咽、食管、阴道、系统性感染）、隐球菌病（脑膜炎维持治疗）、皮肤真菌病、真菌感染预防。',
      dosage: '口咽念珠菌：50-100mg，一日1次，连用7-14天。系统性念珠菌病：首日400mg，后200-400mg/日。隐球菌脑膜炎：400mg/日。',
      contraindications: [
        '与特非那定/阿司咪唑/西沙必利合用禁用（QT延长）',
        '妊娠期慎用（大剂量禁用）',
        '严重肝功能不全慎用'
      ],
      adverseReactions: [
        '胃肠反应：恶心、腹痛',
        '肝毒性（转氨酶升高，严重可致肝衰竭）',
        'QT间期延长',
        '皮疹',
        '头痛'
      ],
      interactions: [
        { drug: '华法林', effect: '抑制代谢，增强抗凝效果，出血风险增加', severity: 'high' },
        { drug: '苯妥英钠', effect: '升高苯妥英血药浓度，中毒风险', severity: 'high' },
        { drug: '磺脲类降糖药', effect: '升高磺脲血药浓度，低血糖风险', severity: 'medium' },
        { drug: '他汀类', effect: '升高他汀血药浓度，肌病风险', severity: 'medium' },
        { drug: '利福平', effect: '降低氟康唑血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C/D（大剂量长期使用）',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗真菌', '感染', '念珠菌']
    },
    {
      id: 'd031',
      name: '伏立康唑',
      aliases: ['voriconazole', '威凡', '伏立康唑片'],
      category: '抗真菌药（三唑类，广谱）',
      indication: '用于侵袭性曲霉菌病、食道念珠菌病、严重真菌感染（镰刀菌、赛多孢菌感染）。',
      dosage: '静脉：首剂6mg/kg，每12小时1次×2次，后4mg/kg每12小时1次。口服（>40kg）：200mg每12小时1次。',
      contraindications: [
        '与特非那定/阿司咪唑/西沙必利/麦角胺合用禁用',
        '严重肝功能不全慎用',
        '妊娠期禁用',
        '与利福平/利福布汀/卡马西平/苯巴比妥合用禁用'
      ],
      adverseReactions: [
        '视觉障碍（常见，畏光、视物模糊、色觉改变）',
        '肝毒性',
        '皮疹、光敏反应',
        '幻觉、精神症状',
        'QT间期延长',
        '周围神经病变（长期）'
      ],
      interactions: [
        { drug: '利福平/卡马西平/苯巴比妥', effect: '强诱导剂，显著降低伏立康唑血药浓度，治疗失败', severity: 'high' },
        { drug: '他汀类', effect: '升高他汀血药浓度，肌病/横纹肌溶解风险', severity: 'high' },
        { drug: '环孢素', effect: '升高环孢素血药浓度，需减量监测', severity: 'high' },
        { drug: '华法林', effect: '增强抗凝效果', severity: 'high' },
        { drug: '西罗莫司', effect: '显著升高西罗莫司浓度，禁用', severity: 'high' }
      ],
      pregnancyCategory: 'D',
      source: '《抗菌药物临床应用指导原则》（2015年版）',
      sourceDetail: '国家卫生计生委办公厅发布',
      tags: ['抗真菌', '感染', '曲霉菌']
    },
    {
      id: 'd032',
      name: '吗啡',
      aliases: ['morphine', '美施康定', '硫酸吗啡', '盐酸吗啡'],
      category: '阿片类镇痛药',
      indication: '用于中重度疼痛（癌痛、急性心肌梗死、术后疼痛、严重创伤）；急性左心衰竭肺水肿。',
      dosage: '口服：5-30mg，每4小时1次。缓释片：30mg每12小时起始。静脉/皮下：5-10mg每4小时1次。急性心衰：3-5mg静脉缓慢注射。',
      contraindications: [
        '呼吸抑制者禁用',
        '支气管哮喘禁用',
        '麻痹性肠梗阻禁用',
        '颅内压增高禁用',
        '严重肝功能不全禁用'
      ],
      adverseReactions: [
        '呼吸抑制（最危险，可致死）',
        '便秘（几乎全部患者，需预防性通便）',
        '恶心呕吐',
        '嗜睡、意识模糊',
        '瞳孔缩小',
        '尿潴留',
        '低血压',
        '瘙痒',
        '躯体依赖和成瘾（长期使用）'
      ],
      interactions: [
        { drug: '苯二氮䓬类', effect: '叠加中枢抑制，致命性呼吸抑制风险', severity: 'high' },
        { drug: '酒精', effect: '中枢和呼吸抑制叠加', severity: 'high' },
        { drug: '单胺氧化酶抑制剂', effect: '5-羟色胺综合征、高血压危象', severity: 'high' },
        { drug: '其他阿片类/镇静药', effect: '呼吸抑制叠加', severity: 'high' },
        { drug: '肌松药', effect: '增强肌松和呼吸抑制', severity: 'medium' }
      ],
      pregnancyCategory: 'C（长期/大剂量：D）',
      source: '《NCCN成人癌痛临床实践指南》',
      sourceDetail: '中文版，中国抗癌协会',
      tags: ['镇痛', '阿片', '癌痛', '心血管']
    },
    {
      id: 'd033',
      name: '芬太尼',
      aliases: ['fentanyl', '芬太尼透皮贴剂', '多瑞吉', '枸橼酸芬太尼'],
      category: '阿片类镇痛药（合成）',
      indication: '用于中重度慢性疼痛（癌痛，对阿片耐受者）；术中麻醉辅助；急性疼痛短期控制。',
      dosage: '透皮贴剂：12.5-100μg/h，每72小时更换。静脉：1-2μg/kg（麻醉）。肌内/皮下：0.05-0.1mg。',
      contraindications: [
        '阿片过敏者禁用',
        '急性或术后疼痛（透皮贴不适用，起效慢）',
        '严重呼吸抑制禁用',
        '麻痹性肠梗阻禁用',
        '未使用过阿片类药物者禁用透皮贴'
      ],
      adverseReactions: [
        '呼吸抑制',
        '便秘、恶心呕吐',
        '嗜睡、头晕',
        '瘙痒、出汗',
        '发热时贴剂吸收增加（过量风险）',
        '依赖性'
      ],
      interactions: [
        { drug: '单胺氧化酶抑制剂', effect: '严重不良反应，需停药14天', severity: 'high' },
        { drug: '苯二氮䓬类', effect: '致命性呼吸抑制', severity: 'high' },
        { drug: '酒精', effect: '中枢抑制叠加', severity: 'high' },
        { drug: 'CYP3A4强抑制剂（酮康唑/利托那韦）', effect: '升高芬太尼血药浓度，过量风险', severity: 'high' }
      ],
      pregnancyCategory: 'C',
      source: '《NCCN成人癌痛临床实践指南》',
      sourceDetail: '中文版，中国抗癌协会',
      tags: ['镇痛', '阿片', '癌痛']
    },
    {
      id: 'd034',
      name: '可待因',
      aliases: ['codeine', '甲基吗啡', '磷酸可待因'],
      category: '阿片类镇痛镇咳药',
      indication: '用于轻中度疼痛；干咳（镇咳，常配伍祛痰药）。',
      dosage: '镇痛：15-60mg，每4-6小时1次（一日最大240mg）。镇咳：10-20mg，每4-6小时1次。',
      contraindications: [
        '呼吸抑制者禁用',
        '哮喘急性发作禁用',
        '12岁以下儿童禁用',
        '哺乳期禁用',
        'CYP2D6超快代谢者禁用'
      ],
      adverseReactions: [
        '便秘',
        '嗜睡、头晕',
        '恶心呕吐',
        '呼吸抑制',
        '依赖性',
        '儿童严重不良反应风险高'
      ],
      interactions: [
        { drug: '单胺氧化酶抑制剂', effect: '严重不良反应', severity: 'high' },
        { drug: '酒精', effect: '中枢抑制叠加', severity: 'high' },
        { drug: '苯二氮䓬类', effect: '呼吸抑制叠加', severity: 'high' },
        { drug: '其他阿片类', effect: '叠加效应', severity: 'high' },
        { drug: 'CYP2D6抑制剂（氟西汀/帕罗西汀）', effect: '降低可待因活化，镇痛效果减弱', severity: 'medium' }
      ],
      pregnancyCategory: 'C/D',
      source: '《中国国家处方集》（第2版）',
      sourceDetail: '中华医学会编著，人民军医出版社，2019年',
      tags: ['镇痛', '镇咳', '阿片']
    },
    {
      id: 'd035',
      name: '异烟肼',
      aliases: ['isoniazid', 'INH', '雷米封'],
      category: '抗结核药（一线）',
      indication: '用于各型结核病的治疗（联合用药）；结核病预防性治疗。',
      dosage: '5mg/kg/日（成人通常300mg/日），顿服。预防性治疗：300mg/日，连用6-9个月。',
      contraindications: [
        '严重肝功能不全禁用',
        '急性肝病禁用',
        '既往异烟肼相关肝炎史禁用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '肝毒性（最严重，需定期监测肝功）',
        '周围神经炎（需预防性补充维生素B6）',
        '中枢症状：失眠、兴奋、抽搐',
        '皮疹',
        '狼疮样综合征',
        '溶血性贫血（G6PD缺乏者）'
      ],
      interactions: [
        { drug: '苯妥英钠', effect: '抑制苯妥英代谢，显著升高血药浓度，中毒风险', severity: 'high' },
        { drug: '华法林', effect: '增强抗凝效果，出血风险', severity: 'high' },
        { drug: '利福平', effect: '叠加肝毒性', severity: 'high' },
        { drug: '对乙酰氨基酚', effect: '增加肝毒性', severity: 'high' },
        { drug: '酒精', effect: '增加肝毒性', severity: 'high' },
        { drug: '卡马西平', effect: '升高卡马西平血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国结核病防治规划实施工作指南》',
      sourceDetail: '中国疾病预防控制中心',
      tags: ['抗结核', '感染']
    },
    {
      id: 'd036',
      name: '利福平',
      aliases: ['rifampicin', 'RFP', '甲哌利福霉素'],
      category: '抗结核药（一线，利福霉素类）',
      indication: '用于各型结核病（联合用药）；麻风；耐甲氧西林葡萄球菌感染（联合）；军团菌病。',
      dosage: '10mg/kg/日（成人450-600mg/日），空腹顿服。',
      contraindications: [
        '严重肝功能不全禁用',
        '胆道梗阻禁用',
        '妊娠早期慎用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '体液分泌物（尿、汗、泪）呈橘红色（无害）',
        '肝毒性（转氨酶升高，黄疸）',
        '胃肠反应',
        '流感样综合征（间歇给药）',
        '血小板减少',
        '皮疹'
      ],
      interactions: [
        { drug: '口服避孕药', effect: '强CYP诱导剂，降低避孕效果，可致意外妊娠', severity: 'high' },
        { drug: '华法林', effect: '加速华法林代谢，显著降低抗凝效果', severity: 'high' },
        { drug: 'HIV蛋白酶抑制剂', effect: '显著降低蛋白酶抑制剂血药浓度，治疗失败', severity: 'high' },
        { drug: '环孢素/他克莫司', effect: '降低免疫抑制剂血药浓度，排斥风险', severity: 'high' },
        { drug: '他汀类', effect: '降低他汀血药浓度', severity: 'medium' },
        { drug: '苯妥英/苯巴比妥/卡马西平', effect: '双向影响代谢', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国结核病防治规划实施工作指南》',
      sourceDetail: '中国疾病预防控制中心',
      tags: ['抗结核', '感染']
    },
    {
      id: 'd037',
      name: '乙胺丁醇',
      aliases: ['ethambutol', 'EMB', '盐酸乙胺丁醇'],
      category: '抗结核药（一线）',
      indication: '用于各型结核病（联合用药），防止耐药菌产生。',
      dosage: '15-25mg/kg/日，顿服。',
      contraindications: [
        '视神经炎史禁用',
        '6岁以下儿童禁用（无法监测视力）',
        '严重肾功能不全慎用'
      ],
      adverseReactions: [
        '视神经炎（球后视神经炎，视力模糊、视野缩小、红绿色盲，需定期检查视力和视野）',
        '高尿酸血症（可诱发痛风）',
        '胃肠反应',
        '皮疹'
      ],
      interactions: [
        { drug: '氢氧化铝', effect: '减少乙胺丁醇吸收', severity: 'low' },
        { drug: '别嘌醇', effect: '可能降低别嘌醇效果', severity: 'low' }
      ],
      pregnancyCategory: 'B',
      source: '《中国结核病防治规划实施工作指南》',
      sourceDetail: '中国疾病预防控制中心',
      tags: ['抗结核', '感染']
    },
    {
      id: 'd038',
      name: '胺碘酮',
      aliases: ['amiodarone', '可达龙', '乙胺碘呋酮'],
      category: '抗心律失常药（III类）',
      indication: '用于室性心律失常（室速、室颤）、房性心律失常（房颤、房扑转复和窦律维持）。',
      dosage: '静脉：150mg负荷（10分钟），后1mg/min×6小时，再0.5mg/min维持。口服：600-1200mg/日负荷1-2周，后200-400mg/日维持。',
      contraindications: [
        '严重窦性心动过缓禁用',
        '二度及以上房室传导阻滞禁用',
        '甲状腺功能异常禁用',
        '碘过敏者禁用',
        '妊娠期禁用（含碘）',
        '间质性肺病史禁用'
      ],
      adverseReactions: [
        '肺毒性（间质性肺炎，最严重，可致命）',
        '甲状腺功能异常（甲亢或甲减）',
        '肝毒性',
        '皮肤蓝灰色沉着、光敏',
        '角膜微粒沉着',
        '心动过缓、QT延长（致心律失常少见）',
        '周围神经病变、震颤'
      ],
      interactions: [
        { drug: '地高辛', effect: '升高地高辛血药浓度50-100%，需减半量', severity: 'high' },
        { drug: '华法林', effect: '增强抗凝效果，华法林需减量1/3-1/2', severity: 'high' },
        { drug: '辛伐他汀', effect: '升高他汀血药浓度，肌病风险，辛伐他汀限20mg/日', severity: 'high' },
        { drug: 'β受体阻滞剂/钙拮抗剂', effect: '严重心动过缓和传导阻滞风险', severity: 'high' },
        { drug: '其他QT延长药物', effect: '叠加QT延长，尖端扭转型室速风险', severity: 'high' }
      ],
      pregnancyCategory: 'D（含碘）',
      source: '《心律失常紧急处理专家共识》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['抗心律失常', '心血管']
    },
    {
      id: 'd039',
      name: '利多卡因',
      aliases: ['lidocaine', '赛罗卡因', '盐酸利多卡因'],
      category: '抗心律失常药（Ib类）/局部麻醉药',
      indication: '用于室性心律失常（室速、室颤）；局部麻醉。',
      dosage: '静脉：1-2mg/kg（50-100mg），必要时5分钟重复，总量不超过300mg；维持1-4mg/min。局麻：浸润麻醉0.5-1%。',
      contraindications: [
        '严重房室传导阻滞禁用',
        '严重肝功能不全禁用',
        '预激综合征禁用',
        '严重心动过缓禁用',
        '利多卡因过敏者禁用'
      ],
      adverseReactions: [
        '中枢神经系统：头晕、嗜睡、感觉异常，大剂量可致惊厥、昏迷',
        '心血管：心动过缓、低血压',
        '过敏反应（罕见）'
      ],
      interactions: [
        { drug: 'β受体阻滞剂', effect: '减少肝血流，升高利多卡因血药浓度', severity: 'medium' },
        { drug: '西咪替丁', effect: '升高利多卡因血药浓度', severity: 'medium' },
        { drug: '其他抗心律失常药', effect: '叠加效应，心动过缓风险', severity: 'medium' },
        { drug: 'Ia类抗心律失常药', effect: '叠加作用，致心律失常风险', severity: 'high' }
      ],
      pregnancyCategory: 'B',
      source: '《心律失常紧急处理专家共识》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['抗心律失常', '局麻', '心血管']
    },
    {
      id: 'd040',
      name: '普罗帕酮',
      aliases: ['propafenone', '心律平', '盐酸普罗帕酮'],
      category: '抗心律失常药（Ic类）',
      indication: '用于室上性心动过速、房颤转复、室性心律失常。',
      dosage: '口服：150-200mg，一日3次，最大600mg/日。静脉：1-2mg/kg，10分钟内缓慢注射。',
      contraindications: [
        '严重心力衰竭禁用',
        '心源性休克禁用',
        '严重心动过缓禁用',
        '二度及以上房室传导阻滞禁用',
        '严重COPD禁用',
        '器质性心脏病患者慎用'
      ],
      adverseReactions: [
        '致心律失常（室速，结构性心脏病者风险高）',
        '心动过缓、传导阻滞',
        '胃肠反应',
        '头晕、味觉异常（金属味）',
        '支气管痉挛'
      ],
      interactions: [
        { drug: '地高辛', effect: '升高地高辛血药浓度', severity: 'medium' },
        { drug: '华法林', effect: '增加出血风险', severity: 'medium' },
        { drug: 'β受体阻滞剂', effect: '叠加负性肌力和传导抑制', severity: 'medium' },
        { drug: 'CYP2D6抑制剂（氟西汀/帕罗西汀）', effect: '升高普罗帕酮血药浓度', severity: 'medium' },
        { drug: '局部麻醉药', effect: '叠加中枢神经系统毒性', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《心律失常紧急处理专家共识》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['抗心律失常', '心血管']
    },
    {
      id: 'd041',
      name: '螺内酯',
      aliases: ['spironolactone', '安体舒通', '螺旋内酯固醇'],
      category: '利尿剂（保钾，醛固酮受体拮抗剂）',
      indication: '用于心力衰竭（NYHA II-IV级）、肝硬化腹水、原发性醛固酮增多症、难治性高血压、低钾血症纠正。',
      dosage: '心衰：12.5-50mg/日。高血压：25-100mg/日。肝硬化腹水：100-400mg/日。',
      contraindications: [
        '严重肾功能不全（血肌酐>221μmol/L）禁用',
        '高钾血症禁用',
        '无尿禁用',
        'Addison病禁用',
        '与依普利酮合用禁用'
      ],
      adverseReactions: [
        '高钾血症（最常见，需监测血钾）',
        '男性乳房发育、性功能障碍',
        '女性月经紊乱、多毛',
        '胃肠反应',
        '皮疹',
        '头晕'
      ],
      interactions: [
        { drug: 'ACE抑制剂/ARB', effect: '叠加高钾血症风险', severity: 'high' },
        { drug: '补钾剂/含钾代盐', effect: '严重高钾血症', severity: 'high' },
        { drug: 'NSAIDs', effect: '降低利尿效果，增加肾损害', severity: 'medium' },
        { drug: '地高辛', effect: '升高地高辛血药浓度', severity: 'medium' },
        { drug: '肝素/低分子肝素', effect: '增加高钾风险', severity: 'medium' }
      ],
      pregnancyCategory: 'C/D（抗雄激素用途）',
      source: '《中国心力衰竭诊断和治疗指南》（2018）',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['利尿', '保钾', '心血管', '心衰']
    },
    {
      id: 'd042',
      name: '氢氯噻嗪',
      aliases: ['hydrochlorothiazide', 'HCTZ', '双氢克尿噻'],
      category: '利尿剂（噻嗪类）',
      indication: '用于高血压（一线）；心源性水肿；肾性尿崩症；特发性高钙尿症。',
      dosage: '高血压：12.5-25mg，一日1次。水肿：25-100mg/日。',
      contraindications: [
        '严重肾功能不全（CrCl<30 mL/min）禁用',
        '无尿禁用',
        '痛风慎用',
        '磺胺过敏者慎用'
      ],
      adverseReactions: [
        '电解质紊乱：低钾、低钠、低镁',
        '高尿酸血症（可诱发痛风）',
        '高血糖',
        '高血脂',
        '高血钙',
        '光敏反应'
      ],
      interactions: [
        { drug: '地高辛', effect: '低钾血症增加洋地黄中毒风险', severity: 'high' },
        { drug: '锂剂', effect: '减少锂排泄，锂中毒风险', severity: 'high' },
        { drug: 'ACE抑制剂', effect: '协同降压，过度降压风险', severity: 'medium' },
        { drug: '糖皮质激素', effect: '加重低钾血症', severity: 'medium' },
        { drug: '别嘌醇', effect: '增加别嘌醇过敏风险', severity: 'medium' }
      ],
      pregnancyCategory: 'C/B（妊娠高血压可选用）',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['利尿', '降压', '噻嗪']
    },
    {
      id: 'd043',
      name: '托拉塞米',
      aliases: ['torasemide', '伊迈格', '特苏尼'],
      category: '利尿剂（袢利尿剂）',
      indication: '用于心力衰竭水肿、肝硬化腹水、肾源性水肿、高血压。',
      dosage: '心衰：10-20mg/日。高血压：2.5-5mg/日。口服或静脉。',
      contraindications: [
        '无尿禁用',
        '严重低血压禁用',
        '脱水禁用',
        '对磺胺类药物过敏者慎用'
      ],
      adverseReactions: [
        '电解质紊乱（低钾、低钠）',
        '脱水、低血压',
        '高尿酸血症',
        '高血糖（较呋塞米轻）',
        '头痛、头晕'
      ],
      interactions: [
        { drug: '地高辛', effect: '低钾增加洋地黄中毒风险', severity: 'high' },
        { drug: '氨基糖苷类抗生素', effect: '叠加耳毒性', severity: 'high' },
        { drug: 'NSAIDs', effect: '降低利尿效果，增加肾损害', severity: 'medium' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'high' }
      ],
      pregnancyCategory: 'B/C',
      source: '《中国心力衰竭诊断和治疗指南》（2018）',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['利尿', '心血管', '水肿']
    },
    {
      id: 'd044',
      name: '硝酸甘油',
      aliases: ['nitroglycerin', '耐绞宁', '硝甘', '三硝酸甘油酯'],
      category: '硝酸盐类（血管扩张剂）',
      indication: '用于心绞痛急性发作；急性心力衰竭；急性心肌梗死（伴血压升高者）。',
      dosage: '舌下含服：0.3-0.6mg，每5分钟可重复，最多3次。静脉：5-200μg/min泵入，根据血压调整。喷雾：0.4-0.8mg口腔喷雾。',
      contraindications: [
        '严重低血压禁用',
        '肥厚性梗阻型心肌病禁用',
        '严重贫血禁用',
        '颅内高压禁用',
        '严重主动脉瓣狭窄禁用',
        '近期使用PDE5抑制剂（西地那非/他达拉非）禁用'
      ],
      adverseReactions: [
        '头痛（最常见，血管扩张所致）',
        '体位性低血压、晕厥',
        '反射性心动过速',
        '面红',
        '耐药性（持续使用24-72小时即可产生，需每日保留8-12小时无药期）',
        '高铁血红蛋白血症（大剂量）'
      ],
      interactions: [
        { drug: '西地那非/他达拉非', effect: '致命性低血压，绝对禁用', severity: 'high' },
        { drug: '酒精', effect: '严重低血压', severity: 'high' },
        { drug: '其他降压药', effect: '协同降压，低血压风险', severity: 'medium' },
        { drug: '肝素', effect: '降低肝素抗凝效果', severity: 'low' },
        { drug: '阿司匹林', effect: '升高硝酸甘油血药浓度', severity: 'low' }
      ],
      pregnancyCategory: 'C',
      source: '《非ST段抬高型急性冠脉综合征诊断和治疗指南》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心血管', '硝酸酯', '心绞痛']
    },
    {
      id: 'd045',
      name: '单硝酸异山梨酯',
      aliases: ['isosorbide mononitrate', '异乐定', '单硝酸异山梨醇酯', 'ISMN'],
      category: '硝酸盐类（长效）',
      indication: '用于冠心病的长期治疗和预防心绞痛发作；慢性心力衰竭辅助治疗。',
      dosage: '普通片：20mg，一日2次。缓释片：40-60mg，一日1次。',
      contraindications: [
        '严重低血压禁用',
        '心包填塞、缩窄性心包炎禁用',
        '肥厚性梗阻型心肌病禁用',
        '近期PDE5抑制剂使用禁用',
        '严重贫血禁用'
      ],
      adverseReactions: [
        '头痛（最常见）',
        '低血压、体位性低血压',
        '反射性心动过速',
        '面红',
        '耐药性（需每日保留8-12小时无药期）'
      ],
      interactions: [
        { drug: '西地那非/他达拉非', effect: '致命性低血压，绝对禁用', severity: 'high' },
        { drug: '酒精', effect: '严重低血压', severity: 'high' },
        { drug: '降压药', effect: '协同降压', severity: 'medium' },
        { drug: 'β受体阻滞剂', effect: '协同抗心绞痛', severity: 'low' }
      ],
      pregnancyCategory: 'C',
      source: '《慢性稳定性心绞痛诊断与治疗指南》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心血管', '硝酸酯', '心绞痛']
    },
    {
      id: 'd046',
      name: '奥氮平',
      aliases: ['olanzapine', '再普乐', '悉敏'],
      category: '抗精神病药（非典型，第二代）',
      indication: '用于精神分裂症；双相情感障碍躁狂发作；双相抑郁维持治疗。',
      dosage: '起始5-10mg，一日1次（睡前）。维持5-20mg/日。',
      contraindications: [
        '窄角型青光眼禁用',
        '严重中枢抑制禁用',
        '妊娠晚期慎用（新生儿戒断综合征）',
        '严重肝功能不全慎用'
      ],
      adverseReactions: [
        '体重增加（显著）',
        '代谢综合征（血糖、血脂异常）',
        '镇静、嗜睡',
        '体位性低血压',
        '锥体外系反应（较轻）',
        '抗胆碱效应（便秘、口干）',
        '催乳素轻度升高'
      ],
      interactions: [
        { drug: '酒精', effect: '中枢抑制叠加', severity: 'high' },
        { drug: '苯二氮䓬类', effect: '呼吸抑制、过度镇静', severity: 'high' },
        { drug: '氟伏沙明', effect: 'CYP1A2抑制剂，升高奥氮平血药浓度', severity: 'medium' },
        { drug: '卡马西平', effect: 'CYP1A2诱导剂，降低奥氮平血药浓度', severity: 'medium' },
        { drug: '吸烟', effect: '诱导CYP1A2，降低奥氮平血药浓度', severity: 'medium' },
        { drug: '左旋多巴/多巴胺激动剂', effect: '拮抗多巴胺效应', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国精神分裂症防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗精神病', '精神', '双相']
    },
    {
      id: 'd047',
      name: '氯氮平',
      aliases: ['clozapine', '氯氮平片', '氯扎平'],
      category: '抗精神病药（非典型）',
      indication: '用于难治性精神分裂症（其他抗精神病药无效或不耐受）；降低精神分裂症患者自杀风险。',
      dosage: '起始12.5mg，一日1-2次，缓慢加量至300-600mg/日，分次服用。',
      contraindications: [
        '粒细胞缺乏症病史禁用',
        '严重心肝肾疾病禁用',
        '癫痫史慎用',
        '麻痹性肠梗阻禁用',
        '骨髓抑制禁用'
      ],
      adverseReactions: [
        '粒细胞缺乏症（最严重，需定期监测血常规，发生率1-2%）',
        '癫痫发作（剂量相关）',
        '心肌炎（罕见但严重）',
        '体位性低血压',
        '体重增加、代谢综合征',
        '心动过速',
        '便秘（严重可致肠梗阻）',
        '流涎'
      ],
      interactions: [
        { drug: 'SSRIs（氟西汀/帕罗西汀）', effect: '升高氯氮平血药浓度', severity: 'high' },
        { drug: '红霉素/克拉霉素', effect: 'CYP3A4抑制，升高氯氮平血药浓度', severity: 'high' },
        { drug: '卡马西平', effect: '降低氯氮平浓度且叠加骨髓抑制，禁用', severity: 'high' },
        { drug: '苯二氮䓬类', effect: '呼吸抑制、循环衰竭风险', severity: 'high' },
        { drug: '华法林', effect: '增加出血风险', severity: 'medium' }
      ],
      pregnancyCategory: 'B',
      source: '《中国精神分裂症防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗精神病', '精神', '难治性']
    },
    {
      id: 'd048',
      name: '利培酮',
      aliases: ['risperidone', '维思通', '单克'],
      category: '抗精神病药（非典型）',
      indication: '用于精神分裂症；双相情感障碍躁狂发作；痴呆相关行为障碍（短期）。',
      dosage: '起始1mg，一日2次；维持2-8mg/日，分1-2次。',
      contraindications: [
        '窄角型青光眼禁用',
        '严重心血管疾病慎用',
        '帕金森病/路易体痴呆慎用',
        '严重肝功能不全慎用'
      ],
      adverseReactions: [
        '锥体外系反应（剂量相关，较典型药轻）',
        '催乳素升高（女性闭经、泌乳，男性乳房发育）',
        '体重增加',
        '镇静、嗜睡',
        '体位性低血压',
        'QT间期延长'
      ],
      interactions: [
        { drug: '卡马西平', effect: '诱导代谢，降低利培酮活性产物', severity: 'medium' },
        { drug: '氟西汀/帕罗西汀', effect: 'CYP2D6抑制，升高利培酮血药浓度', severity: 'medium' },
        { drug: 'α受体阻滞剂', effect: '叠加低血压', severity: 'medium' },
        { drug: '左旋多巴', effect: '拮抗多巴胺效应', severity: 'medium' },
        { drug: '其他QT延长药物', effect: '叠加QT延长', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国精神分裂症防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗精神病', '精神', '双相']
    },
    {
      id: 'd049',
      name: '舍曲林',
      aliases: ['sertraline', '左洛复', '唯他停'],
      category: '抗抑郁药（SSRI）',
      indication: '用于抑郁症、强迫症、惊恐障碍、社交焦虑障碍、创伤后应激障碍、经前期情绪障碍。',
      dosage: '起始50mg，一日1次；维持50-200mg/日。',
      contraindications: [
        '与单胺氧化酶抑制剂合用禁用（需停药14天）',
        '严重肝功能不全慎用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '胃肠反应（恶心、腹泻，常见）',
        '性功能障碍',
        '失眠或嗜睡',
        '头痛',
        '出血风险增加（血小板功能抑制）',
        '5-羟色胺综合征（罕见但严重）',
        '低钠血症（SIADH）'
      ],
      interactions: [
        { drug: '单胺氧化酶抑制剂', effect: '5-羟色胺综合征，绝对禁用，需停药14天', severity: 'high' },
        { drug: '曲马多/曲坦类/其他5-HT药物', effect: '5-羟色胺综合征风险', severity: 'high' },
        { drug: '华法林', effect: '出血风险增加，需监测INR', severity: 'medium' },
        { drug: '锂剂', effect: '增强5-HT效应', severity: 'medium' },
        { drug: '阿司匹林/NSAIDs', effect: '出血风险增加', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期抗抑郁首选之一）',
      source: '《中国抑郁障碍防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗抑郁', 'SSRI', '精神']
    },
    {
      id: 'd050',
      name: '氟西汀',
      aliases: ['fluoxetine', '百优解', '开克', '优克'],
      category: '抗抑郁药（SSRI）',
      indication: '用于抑郁症、强迫症、神经性贪食、经前期情绪障碍。',
      dosage: '抑郁症：20mg，一日1次起始，最大80mg/日。强迫症：20-60mg/日。',
      contraindications: [
        '与单胺氧化酶抑制剂合用禁用（需停药5周）',
        '严重肝肾功能不全慎用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '胃肠反应',
        '性功能障碍',
        '失眠、焦虑（早期）',
        '头痛',
        '出血风险增加',
        '5-羟色胺综合征',
        '半衰期长（停药综合征少）'
      ],
      interactions: [
        { drug: '单胺氧化酶抑制剂', effect: '5-羟色胺综合征，需停药5周后才能用MAOI', severity: 'high' },
        { drug: '氯氮平', effect: '升高氯氮平血药浓度', severity: 'high' },
        { drug: '苯妥英钠', effect: '升高苯妥英血药浓度，中毒风险', severity: 'high' },
        { drug: '曲马多', effect: '5-羟色胺综合征风险', severity: 'high' },
        { drug: '华法林', effect: '出血风险', severity: 'medium' },
        { drug: 'CYP2D6底物（β受体阻滞剂/抗心律失常药）', effect: '氟西汀强抑制CYP2D6，升高相关药物浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国抑郁障碍防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗抑郁', 'SSRI', '精神']
    },
    {
      id: 'd051',
      name: '文拉法辛',
      aliases: ['venlafaxine', '怡诺思', '博乐欣'],
      category: '抗抑郁药（SNRI）',
      indication: '用于抑郁症、广泛性焦虑障碍、社交焦虑障碍。',
      dosage: '起始37.5-75mg/日；维持75-225mg/日。缓释剂一日1次。',
      contraindications: [
        '与单胺氧化酶抑制剂合用禁用',
        '严重高血压未控制禁用',
        '严重肝肾功能不全慎用'
      ],
      adverseReactions: [
        '恶心（常见）',
        '性功能障碍',
        '头痛、失眠',
        '血压升高（剂量相关，高剂量明显）',
        '撤药综合征（需逐渐减量，突然停药可致头晕、感觉异常、易激惹）',
        '5-羟色胺综合征'
      ],
      interactions: [
        { drug: '单胺氧化酶抑制剂', effect: '5-羟色胺综合征，绝对禁用', severity: 'high' },
        { drug: '其他5-羟色胺药物', effect: '5-羟色胺综合征风险', severity: 'high' },
        { drug: '华法林', effect: '出血风险', severity: 'medium' },
        { drug: '氟西汀', effect: '升高文拉法辛血药浓度', severity: 'medium' },
        { drug: '降压药', effect: '血压变化不定', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国抑郁障碍防治指南》（第二版）',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['抗抑郁', 'SNRI', '精神']
    },
    {
      id: 'd052',
      name: '地西泮',
      aliases: ['diazepam', '安定', '地西泮注射液', '苯甲二氮䓬'],
      category: '镇静催眠/抗焦虑药（苯二氮䓬类）',
      indication: '用于焦虑症、失眠、癫痫持续状态（静脉）、酒精戒断、肌肉痉挛、麻醉前给药。',
      dosage: '焦虑：2-10mg，一日2-4次。失眠：5-10mg睡前服。癫痫持续状态：5-10mg静脉缓慢注射（<5mg/min）。',
      contraindications: [
        '严重呼吸功能不全禁用',
        '睡眠呼吸暂停综合征禁用',
        '重症肌无力禁用',
        '严重肝功能不全禁用',
        '急性闭角型青光眼禁用'
      ],
      adverseReactions: [
        '嗜睡、头晕、乏力',
        '共济失调',
        '依赖性（长期使用）',
        '撤药综合征（骤停可致焦虑、失眠、抽搐）',
        '认知损害',
        '呼吸抑制（过量）'
      ],
      interactions: [
        { drug: '酒精', effect: '致命性中枢和呼吸抑制', severity: 'high' },
        { drug: '阿片类', effect: '致命性呼吸抑制', severity: 'high' },
        { drug: '其他镇静催眠药', effect: '中枢抑制叠加', severity: 'high' },
        { drug: '红霉素/克拉霉素', effect: '升高地西泮血药浓度', severity: 'medium' },
        { drug: '西咪替丁', effect: '升高地西泮血药浓度', severity: 'medium' },
        { drug: '左旋多巴', effect: '降低左旋多巴疗效', severity: 'low' }
      ],
      pregnancyCategory: 'D',
      source: '《中国焦虑障碍防治指南》',
      sourceDetail: '中华医学会精神病学分会',
      tags: ['镇静催眠', '抗焦虑', '苯二氮䓬']
    },
    {
      id: 'd053',
      name: '唑吡坦',
      aliases: ['zolpidem', '思诺思', '诺宾'],
      category: '镇静催眠药（非苯二氮䓬类，Z药）',
      indication: '用于失眠症（尤其入睡困难）。',
      dosage: '5-10mg睡前服，一日最大10mg（老年人5mg）。',
      contraindications: [
        '严重呼吸功能不全禁用',
        '睡眠呼吸暂停综合征禁用',
        '重症肌无力禁用',
        '严重肝功能不全禁用',
        '急性闭角型青光眼禁用'
      ],
      adverseReactions: [
        '嗜睡、头晕',
        '梦境异常',
        '复杂睡眠行为（梦游、梦驾、进食，FDA黑框警告）',
        '依赖性',
        '撤药综合征',
        '次日残余效应（剂量相关）'
      ],
      interactions: [
        { drug: '酒精', effect: '中枢抑制叠加，禁止同服', severity: 'high' },
        { drug: '阿片类', effect: '呼吸抑制叠加', severity: 'high' },
        { drug: '其他镇静催眠药', effect: '中枢抑制叠加', severity: 'high' },
        { drug: '氟康唑/酮康唑', effect: '升高唑吡坦血药浓度', severity: 'medium' },
        { drug: '利福平', effect: '降低唑吡坦血药浓度', severity: 'low' }
      ],
      pregnancyCategory: 'C',
      source: '《中国失眠障碍诊断和治疗指南》',
      sourceDetail: '中华医学会神经病学分会',
      tags: ['镇静催眠', '失眠', 'Z药']
    },
    {
      id: 'd054',
      name: '缬沙坦',
      aliases: ['valsartan', '代文', '缬克', '平欣'],
      category: '降压药（ARB）',
      indication: '用于高血压、心力衰竭、心肌梗死后、糖尿病肾病。',
      dosage: '高血压：80-320mg，一日1次。心衰：40-160mg，一日2次。',
      contraindications: [
        '妊娠中晚期禁用',
        '严重肝功能不全禁用',
        '胆道梗阻禁用',
        '双侧肾动脉狭窄禁用',
        '对ARB过敏者禁用'
      ],
      adverseReactions: [
        '头晕',
        '高钾血症',
        '肾功能损害（一过性）',
        '血管性水肿（罕见但严重）',
        '咳嗽（较ACEI明显少）'
      ],
      interactions: [
        { drug: 'ACE抑制剂', effect: '不推荐联用，不良反应叠加', severity: 'high' },
        { drug: '螺内酯/补钾剂', effect: '高钾血症风险', severity: 'high' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: 'NSAIDs', effect: '降低降压效果，增加肾损害', severity: 'medium' }
      ],
      pregnancyCategory: 'D（中晚期禁用）',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['降压', 'ARB', '心血管']
    },
    {
      id: 'd055',
      name: '厄贝沙坦',
      aliases: ['irbesartan', '安博维', '吉加', '伊泰青'],
      category: '降压药（ARB）',
      indication: '用于高血压；2型糖尿病肾病（减少蛋白尿，延缓肾功能恶化）。',
      dosage: '150-300mg，一日1次。',
      contraindications: [
        '妊娠中晚期禁用',
        '严重肝功能不全禁用',
        '双侧肾动脉狭窄禁用',
        '对ARB过敏者禁用'
      ],
      adverseReactions: [
        '头晕',
        '高钾血症',
        '肾功能损害',
        '血管性水肿（罕见）',
        '肌痛、疲劳'
      ],
      interactions: [
        { drug: 'ACE抑制剂', effect: '不推荐联用', severity: 'high' },
        { drug: '螺内酯/补钾剂', effect: '高钾血症', severity: 'high' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: 'NSAIDs', effect: '降低降压效果，肾损害', severity: 'medium' }
      ],
      pregnancyCategory: 'D（中晚期禁用）',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['降压', 'ARB', '糖尿病肾病']
    },
    {
      id: 'd056',
      name: '卡托普利',
      aliases: ['captopril', '开博通', '疏甲丙脯酸'],
      category: '降压药（ACEI）',
      indication: '用于高血压、心力衰竭、心肌梗死后、糖尿病肾病。',
      dosage: '12.5-25mg，一日2-3次。最大150mg/日。高血压急症：12.5-25mg舌下含服。',
      contraindications: [
        '妊娠期禁用',
        '双侧肾动脉狭窄禁用',
        '血管性水肿病史禁用',
        '高钾血症禁用',
        '严重肾功能不全慎用'
      ],
      adverseReactions: [
        '干咳（常见，10-20%）',
        '高钾血症',
        '肾功能损害（一过性）',
        '血管性水肿（喉头水肿，罕见但严重）',
        '首剂低血压',
        '皮疹',
        '味觉障碍（含巯基）'
      ],
      interactions: [
        { drug: 'ARB', effect: '不推荐联用', severity: 'high' },
        { drug: '螺内酯/补钾剂', effect: '高钾血症', severity: 'high' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: 'NSAIDs', effect: '降低降压效果，增加肾损害', severity: 'medium' },
        { drug: '别嘌醇', effect: '增加高敏反应，尤其肾功能不全者', severity: 'medium' }
      ],
      pregnancyCategory: 'D',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['降压', 'ACEI', '心血管']
    },
    {
      id: 'd057',
      name: '依那普利',
      aliases: ['enalapril', '悦宁定', '依苏', '苯丁酯脯酸'],
      category: '降压药（ACEI）',
      indication: '用于高血压、心力衰竭、心肌梗死后、糖尿病肾病。',
      dosage: '5-20mg，一日1-2次。最大40mg/日。',
      contraindications: [
        '妊娠期禁用',
        '双侧肾动脉狭窄禁用',
        '血管性水肿病史禁用',
        '高钾血症禁用'
      ],
      adverseReactions: [
        '干咳（常见）',
        '高钾血症',
        '肾功能损害',
        '血管性水肿（罕见但严重）',
        '低血压',
        '头晕、头痛'
      ],
      interactions: [
        { drug: 'ARB', effect: '不推荐联用', severity: 'high' },
        { drug: '螺内酯/补钾剂', effect: '高钾血症', severity: 'high' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: 'NSAIDs', effect: '降低降压效果，肾损害', severity: 'medium' },
        { drug: '利尿剂', effect: '协同降压，首剂低血压风险', severity: 'medium' }
      ],
      pregnancyCategory: 'D',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['降压', 'ACEI', '心血管']
    },
    {
      id: 'd058',
      name: '雷米普利',
      aliases: ['ramipril', '瑞泰', '昂拉贝'],
      category: '降压药（ACEI）',
      indication: '用于高血压、心力衰竭、心血管事件预防（高危人群）、心肌梗死后、糖尿病肾病。',
      dosage: '2.5-10mg，一日1次。',
      contraindications: [
        '妊娠期禁用',
        '双侧肾动脉狭窄禁用',
        '血管性水肿病史禁用',
        '高钾血症禁用'
      ],
      adverseReactions: [
        '干咳（常见）',
        '高钾血症',
        '肾功能损害',
        '血管性水肿（罕见但严重）',
        '低血压',
        '头晕'
      ],
      interactions: [
        { drug: 'ARB', effect: '不推荐联用', severity: 'high' },
        { drug: '螺内酯/补钾剂', effect: '高钾血症', severity: 'high' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: 'NSAIDs', effect: '降低降压效果，肾损害', severity: 'medium' },
        { drug: '阿司匹林（高剂量）', effect: '降低心血管保护效果', severity: 'low' }
      ],
      pregnancyCategory: 'D',
      source: '《中国高血压防治指南》（2018年修订版）',
      sourceDetail: '中国高血压防治指南修订委员会',
      tags: ['降压', 'ACEI', '心血管']
    },
    {
      id: 'd059',
      name: '瑞舒伐他汀',
      aliases: ['rosuvastatin', '可定', '瑞舒伐他汀钙'],
      category: '降脂药（他汀类）',
      indication: '用于高胆固醇血症、混合性高脂血症、纯合子家族性高胆固醇血症、心血管事件一级和二级预防。',
      dosage: '5-20mg，一日1次，晚间服用。亚洲人慎用40mg。最大20mg（一般）。',
      contraindications: [
        '活动性肝病禁用',
        '妊娠期和哺乳期禁用',
        '严重肾功能不全慎用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '肌肉毒性：肌痛、肌炎，严重者横纹肌溶解（罕见但严重）',
        '肝酶升高',
        '胃肠反应',
        '头痛',
        '蛋白尿（剂量相关，可逆）',
        '新发糖尿病（长期使用风险轻微增加）'
      ],
      interactions: [
        { drug: '环孢素', effect: '显著升高瑞舒伐他汀血药浓度，严重肌病风险，禁用', severity: 'high' },
        { drug: '吉非贝齐', effect: '显著增加横纹肌溶解风险', severity: 'high' },
        { drug: '华法林', effect: 'INR升高，出血风险', severity: 'medium' },
        { drug: '红霉素/克拉霉素', effect: '升高他汀血药浓度，肌病风险', severity: 'medium' },
        { drug: '氯吡格雷', effect: '无显著相互作用（相对安全）', severity: 'low' }
      ],
      pregnancyCategory: 'X',
      source: '《中国成人血脂异常防治指南》（2016年修订版）',
      sourceDetail: '中国成人血脂异常防治指南修订联合委员会',
      tags: ['降脂', '他汀', '心血管']
    },
    {
      id: 'd060',
      name: '非诺贝特',
      aliases: ['fenofibrate', '力平之', '非诺贝特胶囊'],
      category: '降脂药（贝特类）',
      indication: '用于高甘油三酯血症（首选）；混合性高脂血症。',
      dosage: '微粒化胶囊：200mg，一日1次，进餐时服用。',
      contraindications: [
        '严重肝肾功能不全禁用',
        '胆囊疾病禁用（可致胆石症）',
        '妊娠期和哺乳期禁用',
        '原发性胆汁性肝硬化禁用'
      ],
      adverseReactions: [
        '胃肠反应',
        '肝酶升高',
        '肌肉毒性（肌痛、CPK升高，横纹肌溶解罕见）',
        '皮疹',
        '勃起功能障碍',
        '胰腺炎（罕见）'
      ],
      interactions: [
        { drug: '他汀类', effect: '横纹肌溶解风险显著增加，需密切监测', severity: 'high' },
        { drug: '华法林', effect: '增加出血风险，需监测INR', severity: 'medium' },
        { drug: '胆汁酸螯合剂', effect: '降低非诺贝特吸收，需间隔2小时', severity: 'low' },
        { drug: '环孢素', effect: '增加肾毒性', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《中国成人血脂异常防治指南》（2016年修订版）',
      sourceDetail: '中国成人血脂异常防治指南修订联合委员会',
      tags: ['降脂', '贝特', '甘油三酯']
    },
    {
      id: 'd061',
      name: '格列美脲',
      aliases: ['glimepiride', '亚莫利', '万苏平'],
      category: '降糖药（磺脲类，第三代）',
      indication: '用于2型糖尿病（饮食运动控制不佳时）。',
      dosage: '起始1-2mg，一日1次，早餐前服用。维持1-8mg/日。最大8mg/日。',
      contraindications: [
        '1型糖尿病禁用',
        '糖尿病酮症酸中毒禁用',
        '严重肝肾功能不全禁用',
        '妊娠期和哺乳期禁用',
        '磺胺类药物过敏者慎用'
      ],
      adverseReactions: [
        '低血糖（最常见最严重，尤其老年和肾功能不全者）',
        '体重增加',
        '过敏反应（皮疹）',
        '胃肠反应',
        '肝酶升高',
        '少见：低钠血症（SIADH）'
      ],
      interactions: [
        { drug: '氟康唑', effect: '升高磺脲血药浓度，严重低血糖', severity: 'high' },
        { drug: '利福平', effect: '降低磺脲血药浓度，血糖控制不佳', severity: 'medium' },
        { drug: '酒精', effect: '双硫仑样反应+低血糖', severity: 'high' },
        { drug: 'NSAIDs/华法林', effect: '增加低血糖风险（置换蛋白结合）', severity: 'medium' },
        { drug: 'β受体阻滞剂', effect: '掩盖低血糖症状', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', '磺脲', '糖尿病']
    },
    {
      id: 'd062',
      name: '恩格列净',
      aliases: ['empagliflozin', '欧唐静', '恩格列净片'],
      category: '降糖药（SGLT2抑制剂）',
      indication: '用于2型糖尿病；射血分数降低的心力衰竭；糖尿病肾病（减少蛋白尿、延缓肾功能恶化）；心血管事件预防。',
      dosage: '10-25mg，一日1次。',
      contraindications: [
        '1型糖尿病禁用（酮症酸中毒风险）',
        '糖尿病酮症酸中毒禁用',
        'eGFR<30 mL/min/1.73m²禁用（降糖无效）',
        '妊娠期和哺乳期禁用'
      ],
      adverseReactions: [
        '泌尿生殖道真菌感染（最常见，女性外阴阴道念珠菌病、男性龟头炎）',
        '多尿、脱水',
        '低血压',
        '罕见糖尿病酮症酸中毒（血糖可不高，需警惕）',
        '罕见坏死性筋膜炎（Fournier坏疽）',
        '低密度脂蛋白胆固醇升高'
      ],
      interactions: [
        { drug: '利尿剂', effect: '脱水和低血压风险增加', severity: 'medium' },
        { drug: '胰岛素/磺脲类', effect: '低血糖风险增加', severity: 'medium' },
        { drug: '锂剂', effect: '利尿效应可能影响锂排泄', severity: 'low' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', 'SGLT2', '糖尿病', '心衰']
    },
    {
      id: 'd063',
      name: '西格列汀',
      aliases: ['sitagliptin', '捷诺维', '西他列汀'],
      category: '降糖药（DPP-4抑制剂）',
      indication: '用于2型糖尿病（单药或联合）。',
      dosage: '100mg，一日1次。肾功能不全减量（eGFR 30-45：50mg/日；eGFR<30：25mg/日）。',
      contraindications: [
        '1型糖尿病禁用',
        '糖尿病酮症酸中毒禁用',
        '对本品过敏者禁用',
        '胰腺炎史慎用'
      ],
      adverseReactions: [
        '鼻咽炎、上呼吸道感染',
        '头痛',
        '急性胰腺炎（罕见但严重）',
        '严重关节痛（罕见）',
        '大疱性类天疱疮（罕见）'
      ],
      interactions: [
        { drug: '地高辛', effect: '轻度升高地高辛血药浓度，需监测', severity: 'low' },
        { drug: '磺脲类', effect: '低血糖风险增加，磺脲需减量', severity: 'medium' }
      ],
      pregnancyCategory: 'B（妊娠期慎用）',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', 'DPP-4', '糖尿病']
    },
    {
      id: 'd064',
      name: '吡格列酮',
      aliases: ['pioglitazone', '艾可拓', '卡司平'],
      category: '降糖药（噻唑烷二酮类，胰岛素增敏剂）',
      indication: '用于2型糖尿病（单药或联合，改善胰岛素抵抗）。',
      dosage: '15-45mg，一日1次。',
      contraindications: [
        '心力衰竭（NYHA III-IV级）禁用',
        '活动性膀胱癌或膀胱癌病史禁用',
        '严重肝功能不全禁用',
        '妊娠期和哺乳期禁用',
        '1型糖尿病禁用'
      ],
      adverseReactions: [
        '水钠潴留、水肿',
        '体重增加',
        '心力衰竭加重',
        '骨折（女性多见）',
        '贫血',
        '膀胱癌风险（有争议，长期使用需监测）'
      ],
      interactions: [
        { drug: '胰岛素/磺脲类', effect: '低血糖和水肿风险增加', severity: 'medium' },
        { drug: '吉非贝齐', effect: 'CYP2C8抑制，升高吡格列酮血药浓度', severity: 'medium' },
        { drug: '酮康唑', effect: 'CYP3A4抑制，可能升高吡格列酮', severity: 'low' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['降糖', '噻唑烷二酮', '糖尿病']
    },
    {
      id: 'd065',
      name: '雷尼替丁',
      aliases: ['ranitidine', '善胃得', '盐酸雷尼替丁'],
      category: '消化系统用药（H2受体拮抗剂）',
      indication: '用于胃十二指肠溃疡、反流性食管炎、卓-艾综合征、上消化道出血。',
      dosage: '口服：150mg，一日2次，或300mg，睡前服。静脉：50mg。',
      contraindications: [
        '严重肝肾功能不全慎用',
        '急性卟啉症禁用',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '头痛、头晕',
        '便秘或腹泻',
        '罕见肝毒性',
        '血小板减少',
        '男性乳房发育（罕见，抗雄激素效应）',
        '长期使用维生素B12吸收减少'
      ],
      interactions: [
        { drug: '酮康唑/伊曲康唑', effect: '升高胃pH，降低抗真菌药吸收', severity: 'medium' },
        { drug: '华法林', effect: '抗凝效果变化，需监测INR', severity: 'medium' },
        { drug: '茶碱类', effect: '升高茶碱血药浓度', severity: 'medium' },
        { drug: '利多卡因/普萘洛尔', effect: '升高这些药物血药浓度', severity: 'medium' },
        { drug: '抗酸药', effect: '减少雷尼替丁吸收，需间隔1-2小时', severity: 'low' }
      ],
      pregnancyCategory: 'B',
      source: '《消化性溃疡诊断与治疗规范》',
      sourceDetail: '中华消化杂志编委会',
      tags: ['消化', '抑酸', 'H2阻滞剂']
    },
    {
      id: 'd066',
      name: '多潘立酮',
      aliases: ['domperidone', '吗丁啉', '马来酸多潘立酮'],
      category: '消化系统用药（促胃动力药，多巴胺拮抗剂）',
      indication: '用于消化不良、胃排空延迟、恶心呕吐（非手术性）。',
      dosage: '10mg，一日3次，餐前15-30分钟服用。',
      contraindications: [
        '胃肠道出血禁用',
        '消化道穿孔禁用',
        '机械性肠梗阻禁用',
        '催乳素瘤禁用',
        '中重度肝功能不全禁用'
      ],
      adverseReactions: [
        '偶见轻度腹部痉挛',
        '罕见锥体外系反应（儿童多见）',
        '催乳素升高（闭经、泌乳）',
        'QT延长/严重心律失常（静脉制剂风险高，口服罕见）',
        '口干、皮疹'
      ],
      interactions: [
        { drug: '酮康唑/红霉素（CYP3A4抑制剂）', effect: '升高多潘立酮血药浓度，QT延长风险', severity: 'high' },
        { drug: '单胺氧化酶抑制剂', effect: '禁用', severity: 'medium' },
        { drug: '抗胆碱药', effect: '拮抗促动力作用', severity: 'medium' },
        { drug: '其他QT延长药物', effect: '叠加QT延长风险', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国功能性消化不良专家共识意见》',
      sourceDetail: '中华医学会消化病学分会',
      tags: ['消化', '促胃动力', '止吐']
    },
    {
      id: 'd067',
      name: '蒙脱石散',
      aliases: ['smectite', '必奇', '思密达', '蒙脱石'],
      category: '消化系统用药（肠道黏膜保护剂）',
      indication: '用于急慢性腹泻、肠易激综合征、胃炎食管炎辅助治疗。',
      dosage: '1袋（3g），一日3次。倒入50ml温水中搅匀，餐间空腹服用。',
      contraindications: [
        '对本品过敏者禁用',
        '肠梗阻禁用'
      ],
      adverseReactions: [
        '偶见便秘（可减量）',
        '罕见轻度皮疹'
      ],
      interactions: [
        { drug: '其他口服药物', effect: '吸附作用可降低其他药物吸收，需间隔1-2小时服用', severity: 'medium' },
        { drug: '口服补液盐', effect: '可同时使用，无不良影响', severity: 'low' }
      ],
      pregnancyCategory: '安全可用（妊娠期和哺乳期）',
      source: '《中国儿童急性感染性腹泻病临床实践指南》',
      sourceDetail: '中华医学会儿科学分会',
      tags: ['消化', '腹泻', '黏膜保护']
    },
    {
      id: 'd068',
      name: '氨茶碱',
      aliases: ['aminophylline', '茶碱', '氨茶碱注射液'],
      category: '呼吸系统用药（支气管扩张剂，磷酸二酯酶抑制剂）',
      indication: '用于支气管哮喘、慢性阻塞性肺疾病、心源性哮喘。',
      dosage: '口服：0.1-0.2g，一日3次。静脉：0.125-0.25g缓慢注射（>10分钟），负荷量4-6mg/kg。',
      contraindications: [
        '严重心动过速禁用',
        '心律失常禁用',
        '急性心肌梗死禁用',
        '未控制的癫痫禁用',
        '严重肝功能不全慎用'
      ],
      adverseReactions: [
        '治疗窗窄，需监测血药浓度（10-20mg/L）',
        '胃肠反应：恶心、呕吐',
        '中枢神经系统：失眠、震颤、惊厥（中毒）',
        '心血管：心动过速、心律失常（中毒）',
        '严重中毒可致命'
      ],
      interactions: [
        { drug: '红霉素/克拉霉素', effect: '抑制茶碱代谢，显著升高血药浓度，中毒风险', severity: 'high' },
        { drug: '西咪替丁', effect: '升高茶碱血药浓度', severity: 'high' },
        { drug: '喹诺酮类', effect: '升高茶碱血药浓度', severity: 'high' },
        { drug: '苯妥英/苯巴比妥/利福平', effect: '诱导代谢，降低茶碱血药浓度', severity: 'medium' },
        { drug: '锂剂', effect: '升高锂血药浓度', severity: 'medium' },
        { drug: '咖啡因', effect: '叠加中枢兴奋', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《支气管哮喘防治指南》（2020年版修订版）',
      sourceDetail: '中华医学会呼吸病学分会',
      tags: ['呼吸', '支气管扩张', '哮喘']
    },
    {
      id: 'd069',
      name: '沙丁胺醇',
      aliases: ['salbutamol', '万托林', '舒喘灵', 'albuterol'],
      category: '呼吸系统用药（短效β2受体激动剂）',
      indication: '用于支气管哮喘急性发作、喘息性支气管炎、可逆性气道阻塞。',
      dosage: '吸入：100-200μg（1-2揿），必要时每4-6小时1次。雾化：2.5-5mg。',
      contraindications: [
        '对本品过敏者禁用',
        '严重甲状腺功能亢进未控制慎用',
        '严重心血管疾病慎用'
      ],
      adverseReactions: [
        '心动过速、心悸',
        '震颤（手指）',
        '头痛',
        '低钾血症（大剂量）',
        '高血糖',
        '反常性支气管痉挛（罕见）'
      ],
      interactions: [
        { drug: 'β受体阻滞剂', effect: '拮抗沙丁胺醇的支气管扩张作用', severity: 'high' },
        { drug: '单胺氧化酶抑制剂', effect: '增加心血管不良反应', severity: 'medium' },
        { drug: '利尿剂/糖皮质激素', effect: '叠加低钾血症风险', severity: 'medium' },
        { drug: '地高辛', effect: '低钾增加洋地黄中毒风险', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《支气管哮喘防治指南》（2020年版修订版）',
      sourceDetail: '中华医学会呼吸病学分会',
      tags: ['呼吸', '哮喘', 'β2激动剂']
    },
    {
      id: 'd070',
      name: '布地奈德',
      aliases: ['budesonide', '普米克令舒', '雷诺考特', 'BUD'],
      category: '呼吸系统用药（吸入糖皮质激素）',
      indication: '用于支气管哮喘长期控制治疗、慢性阻塞性肺疾病、过敏性鼻炎、炎症性肠病（回肠释放剂型）。',
      dosage: '吸入：200-800μg/日，分2次。雾化：1-2mg，一日2次。鼻喷：每侧64μg，一日1次。',
      contraindications: [
        '严重真菌感染禁用',
        '哮喘持续状态急性发作需用短效支气管扩张剂',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '口腔念珠菌感染（鹅口疮，漱口可预防）',
        '声音嘶哑',
        '咽喉刺激',
        '儿童生长抑制（轻微）',
        '长期大剂量：全身糖皮质激素效应',
        '咳嗽'
      ],
      interactions: [
        { drug: '酮康唑/伊曲康唑', effect: 'CYP3A4强抑制剂，显著升高布地奈德血药浓度', severity: 'high' },
        { drug: '利托那韦/克拉霉素', effect: '升高布地奈德血药浓度，库欣综合征风险', severity: 'high' },
        { drug: '西柚汁', effect: '升高布地奈德血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'B（吸入剂型）',
      source: '《支气管哮喘防治指南》（2020年版修订版）',
      sourceDetail: '中华医学会呼吸病学分会',
      tags: ['呼吸', '哮喘', '吸入激素']
    },
    {
      id: 'd071',
      name: '孟鲁司特',
      aliases: ['montelukast', '顺尔宁', '孟鲁司特钠'],
      category: '呼吸系统用药（白三烯受体拮抗剂）',
      indication: '用于哮喘长期控制（尤其过敏性哮喘）、运动性哮喘预防、过敏性鼻炎。',
      dosage: '成人：10mg，睡前服。儿童6-14岁：5mg；2-5岁：4mg。',
      contraindications: [
        '急性哮喘发作单用无效（不用于急性发作）',
        '对本品过敏者禁用',
        '苯丙酮尿症慎用（含阿司帕坦）'
      ],
      adverseReactions: [
        '头痛',
        '胃肠反应',
        '神经精神症状（FDA黑框警告：抑郁、自杀观念、焦虑、攻击行为、梦魇）',
        '过敏反应',
        '嗜酸性粒细胞增多（罕见，Churg-Strauss综合征）'
      ],
      interactions: [
        { drug: '苯巴比妥/利福平', effect: '诱导CYP3A4，降低孟鲁司特血药浓度', severity: 'medium' },
        { drug: '吉非贝齐', effect: '升高孟鲁司特血药浓度', severity: 'low' }
      ],
      pregnancyCategory: 'B',
      source: '《支气管哮喘防治指南》（2020年版修订版）',
      sourceDetail: '中华医学会呼吸病学分会',
      tags: ['呼吸', '哮喘', '白三烯拮抗剂']
    },
    {
      id: 'd072',
      name: '氯雷他定',
      aliases: ['loratadine', '开瑞坦', '氯雷他定片'],
      category: '抗组胺药（第二代，非镇静）',
      indication: '用于过敏性鼻炎、荨麻疹、过敏性结膜炎、皮肤过敏。',
      dosage: '成人及12岁以上：10mg，一日1次。儿童2-12岁（>30kg）：10mg/日；(<30kg)：5mg/日。',
      contraindications: [
        '严重肝功能不全慎用（需减量）',
        '对本品过敏者禁用'
      ],
      adverseReactions: [
        '嗜睡（轻微，比第一代少）',
        '头痛',
        '口干',
        '胃肠反应',
        '罕见肝毒性'
      ],
      interactions: [
        { drug: 'CYP3A4/2D6抑制剂（酮康唑/红霉素/西咪替丁）', effect: '升高氯雷他定血药浓度，但临床意义有限', severity: 'low' },
        { drug: '酒精', effect: '无明显叠加镇静作用（第二代特点）', severity: 'low' }
      ],
      pregnancyCategory: 'B',
      source: '《中国变应性鼻炎诊断和治疗指南》',
      sourceDetail: '中华耳鼻咽喉头颈外科杂志编委会',
      tags: ['抗组胺', '过敏', '鼻炎']
    },
    {
      id: 'd073',
      name: '西替利嗪',
      aliases: ['cetirizine', '仙特明', '西可韦', '西替利嗪片'],
      category: '抗组胺药（第二代）',
      indication: '用于过敏性鼻炎、荨麻疹、过敏性结膜炎、皮肤瘙痒。',
      dosage: '成人及6岁以上：10mg，一日1次。6-12岁：5-10mg/日。',
      contraindications: [
        '严重肾功能不全（CrCl<10）慎用',
        '对本品或羟嗪过敏者禁用',
        '妊娠期慎用'
      ],
      adverseReactions: [
        '嗜睡（轻微，剂量相关）',
        '头痛',
        '口干',
        '胃肠反应',
        '罕见排尿困难（抗胆碱效应）'
      ],
      interactions: [
        { drug: '酒精', effect: '轻度叠加中枢抑制', severity: 'low' },
        { drug: '茶碱', effect: '轻度升高西替利嗪血药浓度', severity: 'low' },
        { drug: '其他中枢抑制药', effect: '可增加镇静', severity: 'low' }
      ],
      pregnancyCategory: 'B',
      source: '《中国变应性鼻炎诊断和治疗指南》',
      sourceDetail: '中华耳鼻咽喉头颈外科杂志编委会',
      tags: ['抗组胺', '过敏', '荨麻疹']
    },
    {
      id: 'd074',
      name: '阿仑膦酸钠',
      aliases: ['alendronate', '福善美', '固邦'],
      category: '骨质疏松药（双膦酸盐）',
      indication: '用于绝经后骨质疏松、男性骨质疏松、糖皮质激素诱导的骨质疏松、Paget骨病。',
      dosage: '70mg，每周1次；或10mg，一日1次。晨起空腹用200ml白开水送服，服药后保持直立30分钟。',
      contraindications: [
        '食管疾病（食管狭窄、贲门失弛缓症）禁用',
        '不能站立或坐立30分钟者禁用',
        '低钙血症禁用',
        '严重肾功能不全（eGFR<35）禁用',
        '妊娠期和哺乳期禁用'
      ],
      adverseReactions: [
        '食管刺激（食管炎、食管溃疡，服药方式不当所致）',
        '胃肠反应：腹痛、恶心',
        '肌肉骨骼疼痛',
        '罕见下颌骨坏死（ONJ，多见于肿瘤大剂量使用）',
        '罕见非典型股骨骨折（长期使用）',
        '眼炎（罕见）'
      ],
      interactions: [
        { drug: '钙剂/抗酸药/铁剂', effect: '显著降低阿仑膦酸钠吸收，需间隔至少30分钟', severity: 'medium' },
        { drug: 'NSAIDs', effect: '胃肠刺激叠加，溃疡风险', severity: 'medium' },
        { drug: 'H2受体拮抗剂/质子泵抑制剂', effect: '可能降低阿仑膦酸钠吸收', severity: 'low' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《原发性骨质疏松症诊疗指南》（2017）',
      sourceDetail: '中华医学会骨质疏松和骨矿盐疾病分会',
      tags: ['骨质疏松', '双膦酸盐', '骨骼']
    },
    {
      id: 'd075',
      name: '碳酸钙',
      aliases: ['calcium carbonate', '钙尔奇', '迪巧', '碳酸钙片'],
      category: '骨质疏松药（钙补充剂）/抗酸剂',
      indication: '用于钙缺乏补充、骨质疏松辅助治疗、慢性肾病高磷血症（结合磷）、胃酸过多。',
      dosage: '补钙：600-1200mg元素钙/日，分次餐后服用。高磷血症：餐中嚼服。',
      contraindications: [
        '高钙血症禁用',
        '高钙尿症禁用',
        '严重肾功能不全禁用',
        '肾结石慎用'
      ],
      adverseReactions: [
        '便秘（常见）',
        '胃肠胀气',
        '高钙血症（过量，可致肾结石、心律失常）',
        '高钙尿症',
        '嗳气'
      ],
      interactions: [
        { drug: '喹诺酮/四环素类', effect: '钙离子螯合，降低抗生素吸收，需间隔2小时', severity: 'medium' },
        { drug: '左甲状腺素钠', effect: '降低左甲状腺素吸收，需间隔4小时', severity: 'medium' },
        { drug: '双膦酸盐', effect: '降低双膦酸盐吸收，需间隔30分钟以上', severity: 'medium' },
        { drug: '噻嗪类利尿剂', effect: '增加肾钙重吸收，高钙血症风险', severity: 'medium' },
        { drug: '铁剂', effect: '降低铁吸收', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期补钙安全）',
      source: '《原发性骨质疏松症诊疗指南》（2017）',
      sourceDetail: '中华医学会骨质疏松和骨矿盐疾病分会',
      tags: ['骨质疏松', '钙剂', '骨骼', '抗酸']
    },
    {
      id: 'd076',
      name: '左甲状腺素钠',
      aliases: ['levothyroxine', '优甲乐', '雷替斯', 'L-T4'],
      category: '甲状腺药（甲状腺激素替代）',
      indication: '用于甲状腺功能减退症的替代治疗；甲状腺癌术后TSH抑制治疗；单纯性甲状腺肿；甲亢辅助治疗（抗甲状腺药减量后）。',
      dosage: '起始25-50μg/日，每2-4周加25μg，维持75-200μg/日。老年/冠心病者起始12.5-25μg。晨起空腹服用。',
      contraindications: [
        '急性心肌梗死禁用',
        '急性甲状腺炎禁用',
        '未控制的甲状腺功能亢进禁用',
        '严重肾上腺皮质功能不全（需先补糖皮质激素）',
        '未治疗垂体功能减退'
      ],
      adverseReactions: [
        '过量致甲亢症状：心悸、消瘦、失眠、骨质疏松',
        '心绞痛加重（冠心病者）',
        '心律失常',
        '脱发（治疗初期）'
      ],
      interactions: [
        { drug: '钙剂/铁剂/抗酸药', effect: '降低左甲状腺素吸收，需间隔4小时', severity: 'medium' },
        { drug: '质子泵抑制剂', effect: '降低左甲状腺素吸收', severity: 'medium' },
        { drug: '利福平', effect: '诱导代谢，降低左甲状腺素效果', severity: 'medium' },
        { drug: '消胆胺', effect: '显著降低左甲状腺素吸收，需间隔4-6小时', severity: 'high' },
        { drug: '华法林', effect: '左甲状腺素增强抗凝效果，需监测INR', severity: 'medium' },
        { drug: '卡马西平/苯妥英/苯巴比妥', effect: '加速左甲状腺素代谢', severity: 'medium' }
      ],
      pregnancyCategory: 'A（妊娠期需增加剂量25-30%）',
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲减', '激素替代']
    },
    {
      id: 'd077',
      name: '甲巯咪唑',
      aliases: ['methimazole', 'MMI', '赛治', '他巴唑'],
      category: '甲状腺药（抗甲状腺药）',
      indication: '用于甲状腺功能亢进症（Graves病）；甲亢术前准备；放射性碘治疗辅助。',
      dosage: '起始15-40mg/日，分次服用；维持5-15mg/日。',
      contraindications: [
        '严重过敏史禁用',
        '妊娠早期慎用（首选丙硫氧嘧啶）',
        '哺乳期慎用',
        '严重肝功能不全慎用'
      ],
      adverseReactions: [
        '粒细胞缺乏症（最严重，发生率0.3-0.6%，需监测血常规，发热咽痛立即停药）',
        '皮疹（常见）',
        '肝损害（胆汁淤积性）',
        '关节痛',
        '罕见血管炎（ANCA相关）',
        '味觉异常'
      ],
      interactions: [
        { drug: '抗凝药', effect: '影响抗凝效果', severity: 'medium' },
        { drug: 'β受体阻滞剂', effect: '甲巯咪唑降低β受体阻滞剂清除', severity: 'medium' },
        { drug: '洋地黄', effect: '甲亢纠正后洋地黄敏感性变化', severity: 'medium' },
        { drug: '碘剂', effect: '降低甲巯咪唑效果', severity: 'medium' },
        { drug: '胺碘酮', effect: '胺碘酮含碘，影响甲亢治疗', severity: 'medium' }
      ],
      pregnancyCategory: 'D（妊娠早期致畸，中晚期可用）',
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲亢', '抗甲状腺']
    },
    {
      id: 'd078',
      name: '丙硫氧嘧啶',
      aliases: ['propylthiouracil', 'PTU', '丙基硫氧嘧啶'],
      category: '甲状腺药（抗甲状腺药）',
      indication: '用于甲状腺功能亢进（妊娠早期首选、甲亢危象）；甲亢术前准备。',
      dosage: '起始300-450mg/日，分3次；维持50-150mg/日。甲亢危象：600mg负荷，后200mg每4小时1次。',
      contraindications: [
        '严重过敏史禁用',
        '严重肝功能不全禁用',
        '哺乳期慎用（首选甲巯咪唑）'
      ],
      adverseReactions: [
        '粒细胞缺乏症（需监测血常规）',
        '肝毒性（比甲巯咪唑更严重，可致急性肝衰竭，FDA黑框警告）',
        'ANCA相关血管炎（比甲巯咪唑多）',
        '皮疹',
        '关节痛',
        '罕见低凝血酶原血症'
      ],
      interactions: [
        { drug: '抗凝药', effect: '影响抗凝效果', severity: 'medium' },
        { drug: 'β受体阻滞剂', effect: '降低β受体阻滞剂清除', severity: 'medium' },
        { drug: '洋地黄', effect: '甲亢纠正后敏感性变化', severity: 'medium' },
        { drug: '碘剂', effect: '降低PTU效果', severity: 'medium' }
      ],
      pregnancyCategory: 'D（妊娠早期首选，中后期可换甲巯咪唑）',
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲亢', '抗甲状腺']
    },
    {
      id: 'd079',
      name: '别嘌醇',
      aliases: ['allopurinol', '别嘌呤醇', '仙水', '别嘌醇片'],
      category: '痛风药（黄嘌呤氧化酶抑制剂）',
      indication: '用于痛风（高尿酸血症）、痛风石、化疗相关高尿酸血症预防。',
      dosage: '起始100mg，一日1次，每2-5周加100mg，维持300-600mg/日。肾功能不全减量。',
      contraindications: [
        '急性痛风发作期不开始治疗（已使用者可继续）',
        '严重过敏史禁用',
        '严重肝肾功能不全慎用',
        'HLA-B*5801阳性者（亚洲人高发，严重过敏风险）慎用'
      ],
      adverseReactions: [
        '皮疹（SJS/TEN，HLA-B*5801相关，严重可致命）',
        '胃肠反应',
        '肝毒性',
        '骨髓抑制（罕见）',
        '急性痛风发作（开始治疗时，需联合秋水仙碱或NSAIDs预防）',
        '罕见间质性肾炎'
      ],
      interactions: [
        { drug: '硫唑嘌呤/6-巯基嘌呤', effect: '抑制代谢，严重骨髓抑制，禁用或减量75%', severity: 'high' },
        { drug: '华法林', effect: '增加出血风险，需监测INR', severity: 'medium' },
        { drug: '噻嗪类利尿剂', effect: '增加别嘌醇过敏风险', severity: 'medium' },
        { drug: '阿莫西林/氨苄西林', effect: '皮疹发生率增加', severity: 'medium' },
        { drug: '茶碱', effect: '升高茶碱血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C',
      source: '《中国高尿酸血症与痛风诊疗指南》（2019）',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['痛风', '降尿酸', '代谢']
    },
    {
      id: 'd080',
      name: '秋水仙碱',
      aliases: ['colchicine', '秋水仙素', '别痛风'],
      category: '痛风药',
      indication: '用于痛风急性发作；痛风预防（开始降尿酸治疗时）；家族性地中海热。',
      dosage: '急性发作：1mg起始，1小时后0.5mg，之后0.5mg，一日2-3次（低剂量方案）。预防：0.5-0.6mg，一日1-2次。',
      contraindications: [
        '严重肾功能不全禁用',
        '严重肝功能不全禁用',
        '胃肠疾病活动期慎用',
        '血液系统疾病慎用'
      ],
      adverseReactions: [
        '胃肠反应（恶心、呕吐、腹泻，中毒先兆，需停药）',
        '骨髓抑制（过量或长期）',
        '肌病（长期使用，CPK升高）',
        '神经毒性',
        '肝毒性'
      ],
      interactions: [
        { drug: '他汀类/贝特类', effect: '肌病和横纹肌溶解风险显著增加', severity: 'high' },
        { drug: '克拉霉素/红霉素', effect: 'CYP3A4/P-gp抑制，显著升高秋水仙碱血药浓度，可致命', severity: 'high' },
        { drug: '环孢素', effect: '升高秋水仙碱血药浓度，肌病风险', severity: 'high' },
        { drug: '维拉帕米/地尔硫䓬', effect: '升高秋水仙碱血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C/D',
      source: '《中国高尿酸血症与痛风诊疗指南》（2019）',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['痛风', '抗炎', '代谢']
    },
    {
      id: 'd081',
      name: '非布司他',
      aliases: ['febuxostat', '优立通', 'ULORIC', '非布司他片'],
      category: '痛风药（黄嘌呤氧化酶抑制剂，非嘌呤类）',
      indication: '用于痛风患者高尿酸血症的长期管理。',
      dosage: '起始20mg，一日1次，2周后可加至40-80mg/日。',
      contraindications: [
        '急性痛风发作期不开始治疗',
        '严重心血管病史慎用（FDA黑框：心血管死亡风险增加）',
        '严重肝功能不全慎用',
        '妊娠期和哺乳期禁用'
      ],
      adverseReactions: [
        '肝酶升高（需监测肝功）',
        '恶心',
        '皮疹',
        '心血管事件（比别嘌醇多，包括心血管死亡）',
        '急性痛风发作（开始治疗时，需联合秋水仙碱或NSAIDs预防）',
        '关节痛'
      ],
      interactions: [
        { drug: '硫唑嘌呤/6-巯基嘌呤', effect: '抑制代谢，严重骨髓抑制，禁用', severity: 'high' },
        { drug: '茶碱', effect: '升高茶碱血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'C（妊娠期禁用）',
      source: '《中国高尿酸血症与痛风诊疗指南》（2019）',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['痛风', '降尿酸', '代谢']
    },
    {
      id: 'd082',
      name: '环孢素',
      aliases: ['cyclosporine', '新山地明', '环孢素A', 'CsA'],
      category: '免疫抑制剂（钙调神经磷酸酶抑制剂）',
      indication: '用于器官移植排斥反应预防；自身免疫疾病（类风湿关节炎、银屑病、肾病综合征、干燥综合征）。',
      dosage: '移植：4-15mg/kg/日，分2次。自身免疫：2.5-5mg/kg/日。需监测血药谷浓度（100-300ng/mL）。',
      contraindications: [
        '严重肾功能不全禁用',
        '未控制的高血压禁用',
        '严重感染禁用',
        '恶性肿瘤禁用',
        '对环孢素过敏者禁用'
      ],
      adverseReactions: [
        '肾毒性（最常见，剂量限制性，需监测肾功能）',
        '高血压',
        '牙龈增生',
        '多毛',
        '震颤',
        '肝毒性',
        '高钾血症、低镁血症',
        '高尿酸血症'
      ],
      interactions: [
        { drug: '他克莫司', effect: '同类药物，不联用', severity: 'high' },
        { drug: '酮康唑/红霉素/地尔硫䓬/葡萄柚汁', effect: 'CYP3A4抑制剂，显著升高环孢素血药浓度', severity: 'high' },
        { drug: '利福平/苯妥英/苯巴比妥', effect: 'CYP3A4诱导剂，降低环孢素血药浓度，排斥风险', severity: 'high' },
        { drug: '他汀类', effect: '肌病和横纹肌溶解风险增加', severity: 'high' },
        { drug: 'NSAIDs/氨基糖苷类/造影剂', effect: '叠加肾毒性', severity: 'high' },
        { drug: '保钾利尿剂/补钾剂', effect: '高钾血症风险', severity: 'high' },
        { drug: '活疫苗', effect: '免疫抑制状态下禁用活疫苗', severity: 'high' }
      ],
      pregnancyCategory: 'C',
      source: '《器官移植术后免疫抑制药物临床应用专家共识》',
      sourceDetail: '中华医学会器官移植学分会',
      tags: ['免疫抑制', '移植', '自身免疫']
    },
    {
      id: 'd083',
      name: '他克莫司',
      aliases: ['tacrolimus', '普乐可复', 'FK506', '他克莫司胶囊'],
      category: '免疫抑制剂（钙调神经磷酸酶抑制剂）',
      indication: '用于器官移植排斥反应预防（肝、肾、心移植）；自身免疫疾病。',
      dosage: '口服：0.05-0.2mg/kg/日，分2次。静脉：0.01-0.05mg/kg/日。需监测血药谷浓度（5-15ng/mL）。',
      contraindications: [
        '严重肾功能不全慎用',
        '严重感染禁用',
        '妊娠期慎用',
        '对他克莫司过敏者禁用'
      ],
      adverseReactions: [
        '肾毒性',
        '神经毒性：震颤、头痛、失眠、抽搐',
        '高血糖（新发糖尿病，比环孢素多）',
        '高血压',
        '高钾血症、低镁血症',
        '胃肠反应',
        '心肌肥厚（罕见）'
      ],
      interactions: [
        { drug: '环孢素', effect: '同类药物，不联用，需间隔时间', severity: 'high' },
        { drug: 'CYP3A4抑制剂（酮康唑/红霉素/克拉霉素）', effect: '显著升高他克莫司血药浓度', severity: 'high' },
        { drug: 'CYP3A4诱导剂（利福平/苯妥英/苯巴比妥）', effect: '降低他克莫司血药浓度', severity: 'high' },
        { drug: '其他肾毒性药物（NSAIDs/氨基糖苷类）', effect: '叠加肾毒性', severity: 'high' },
        { drug: '神经毒性药物', effect: '叠加神经毒性', severity: 'medium' },
        { drug: '活疫苗', effect: '免疫抑制下禁用', severity: 'high' }
      ],
      pregnancyCategory: 'C',
      source: '《器官移植术后免疫抑制药物临床应用专家共识》',
      sourceDetail: '中华医学会器官移植学分会',
      tags: ['免疫抑制', '移植', '自身免疫']
    },
    {
      id: 'd084',
      name: '环磷酰胺',
      aliases: ['cyclophosphamide', 'CTX', '安道生', '环磷酰胺注射液'],
      category: '抗肿瘤药/免疫抑制剂（烷化剂）',
      indication: '用于多种肿瘤（淋巴瘤、白血病、乳腺癌、小细胞肺癌）；自身免疫病（狼疮肾炎、血管炎、肾病综合征）；骨髓移植预处理。',
      dosage: '肿瘤：0.5-1g/m²静脉，每2-4周1次。自身免疫：0.5-1g/m²每月冲击，6个月。口服：1-2mg/kg/日。',
      contraindications: [
        '严重骨髓抑制禁用',
        '严重感染禁用',
        '妊娠期和哺乳期禁用',
        '严重肝肾功能不全慎用',
        '出血性膀胱炎史禁用'
      ],
      adverseReactions: [
        '骨髓抑制（白细胞减少最常见，1-2周最低）',
        '出血性膀胱炎（需大量补液+美司钠解救）',
        '恶心呕吐',
        '脱发',
        '不孕（卵巢早衰、无精症）',
        '继发肿瘤（长期使用）',
        '感染',
        '心脏毒性（大剂量）',
        '低钠血症（稀释性）'
      ],
      interactions: [
        { drug: '琥珀胆碱', effect: '延长肌松作用', severity: 'medium' },
        { drug: '别嘌醇', effect: '增加骨髓抑制', severity: 'medium' },
        { drug: '活疫苗', effect: '免疫抑制下禁用，可致严重感染', severity: 'medium' },
        { drug: '地高辛', effect: '降低地高辛吸收', severity: 'medium' },
        { drug: '华法林', effect: '抗凝效果变化，需监测', severity: 'medium' },
        { drug: '吲哚美辛', effect: '增加出血性膀胱炎风险', severity: 'medium' }
      ],
      pregnancyCategory: 'D',
      source: '《中国成人系统性红斑狼疮诊疗指南》',
      sourceDetail: '中华医学会风湿病学分会',
      tags: ['抗肿瘤', '免疫抑制', '烷化剂']
    },
    {
      id: 'd085',
      name: '氟尿嘧啶',
      aliases: ['fluorouracil', '5-FU', '氟尿嘧啶注射液', '5-氟尿嘧啶'],
      category: '抗肿瘤药（抗代谢药）',
      indication: '用于消化道肿瘤（结直肠癌、胃癌、胰腺癌）、乳腺癌、头颈部肿瘤、皮肤癌（局部外用）、宫颈癌。',
      dosage: '静脉：500-600mg/m²，联合化疗。持续输注：2-3g/m²/48h。局部外用：皮肤癌每日1-2次。',
      contraindications: [
        '严重骨髓抑制禁用',
        '严重感染禁用',
        '妊娠期和哺乳期禁用',
        '营养不良',
        'DPD酶缺乏（严重毒性风险，建议基因检测）',
        '严重肝肾功能不全慎用'
      ],
      adverseReactions: [
        '骨髓抑制（白细胞、血小板下降）',
        '胃肠反应：恶心呕吐、腹泻、口腔黏膜炎',
        '手足综合征（持续输注常见）',
        '心脏毒性（血管痉挛性心绞痛，罕见但严重）',
        '神经毒性',
        '脱发',
        '皮肤色素沉着',
        '结膜炎、流泪'
      ],
      interactions: [
        { drug: '甲氨蝶呤', effect: '序贯使用有协同作用（先MTX后5-FU）', severity: 'medium' },
        { drug: '别嘌醇', effect: '降低5-FU疗效', severity: 'medium' },
        { drug: '华法林', effect: '增加出血风险', severity: 'medium' },
        { drug: '索立夫定/溴夫定', effect: '严重骨髓抑制，禁用', severity: 'high' },
        { drug: '苯妥英钠', effect: '升高苯妥英血药浓度', severity: 'medium' },
        { drug: '西咪替丁', effect: '升高5-FU血药浓度', severity: 'medium' }
      ],
      pregnancyCategory: 'D/X',
      source: '《中国结直肠癌诊疗规范》（2020年版）',
      sourceDetail: '国家卫生健康委医政医管局',
      tags: ['抗肿瘤', '抗代谢', '化疗']
    }
  ],

  // ========== 检验指标数据库 ==========
  labs: [
    {
      id: 'l001',
      name: '白细胞计数',
      aliases: ['WBC', '白细胞', '白血球', 'white blood cell'],
      category: '血常规',
      unit: '×10⁹/L',
      referenceRange: {
        adult: '3.5-9.5',
        child: '5.0-12.0',
        newborn: '15.0-20.0'
      },
      clinicalSignificance: '白细胞计数是反映机体免疫状态和炎症反应的重要指标，增高多提示感染或炎症，减低提示骨髓抑制或免疫低下。',
      highCauses: [
        '细菌感染（最常见）',
        '急性出血、组织损伤',
        '白血病、骨髓增殖性疾病',
        '应激反应（创伤、手术）',
        '糖皮质激素使用'
      ],
      lowCauses: [
        '病毒感染（流感、登革热等）',
        '骨髓抑制（化疗、放疗）',
        '自身免疫性疾病（SLE）',
        '脾功能亢进',
        '再生障碍性贫血',
        '严重感染（消耗过多）'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '感染', '免疫']
    },
    {
      id: 'l002',
      name: '血红蛋白',
      aliases: ['Hb', 'HGB', '血红素', 'hemoglobin'],
      category: '血常规',
      unit: 'g/L',
      referenceRange: {
        male: '130-175',
        female: '115-150',
        pregnant: '≥110',
        child: '110-160'
      },
      clinicalSignificance: '血红蛋白是诊断贫血的主要指标。男性<130g/L、女性<115g/L可诊断贫血。也用于评估脱水程度。',
      highCauses: [
        '脱水（血液浓缩）',
        '真性红细胞增多症',
        '慢性心肺疾病（继发性红细胞增多）',
        '高原居住',
        '吸烟'
      ],
      lowCauses: [
        '缺铁性贫血（最常见）',
        '急慢性失血',
        '再生障碍性贫血',
        '溶血性贫血',
        '巨幼细胞性贫血',
        '慢性疾病性贫血',
        '骨髓增生异常综合征'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '贫血']
    },
    {
      id: 'l003',
      name: '血小板计数',
      aliases: ['PLT', '血小板', 'platelet'],
      category: '血常规',
      unit: '×10⁹/L',
      referenceRange: {
        adult: '125-350',
        child: '100-300'
      },
      clinicalSignificance: '血小板参与止血和凝血。计数减少可致出血倾向，增多可致血栓风险。是术前评估和出血性疾病诊断的重要指标。',
      highCauses: [
        '反应性增多（感染、炎症、出血后）',
        '原发性血小板增多症',
        '脾切除术后',
        '缺铁性贫血',
        '恶性肿瘤'
      ],
      lowCauses: [
        '免疫性血小板减少症（ITP）',
        '骨髓抑制（化疗、放疗）',
        '弥散性血管内凝血（DIC）',
        '脾功能亢进',
        '病毒感染（登革热、HIV）',
        '系统性红斑狼疮',
        '再障、白血病'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '凝血', '出血']
    },
    {
      id: 'l004',
      name: '丙氨酸氨基转移酶',
      aliases: ['ALT', '谷丙转氨酶', 'GPT', 'alanine aminotransferase'],
      category: '肝功能',
      unit: 'U/L',
      referenceRange: {
        adult: '9-50'
      },
      clinicalSignificance: 'ALT是反映肝细胞损伤最敏感的指标。显著升高（>10倍正常上限）多见于急性肝损伤。轻度升高可见于慢性肝病。',
      highCauses: [
        '病毒性肝炎（甲、乙、丙型等）',
        '药物性肝损伤（如对乙酰氨基酚过量）',
        '酒精性肝病',
        '非酒精性脂肪肝',
        '肝硬化',
        '心肌梗死（AST升高更显著）',
        '胆道梗阻',
        '休克、心力衰竭（肝淤血）'
      ],
      lowCauses: [
        '一般无临床意义',
        '严重肝病终末期（肝衰竭）',
        '维生素B6缺乏'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '转氨酶', '肝脏']
    },
    {
      id: 'l005',
      name: '天冬氨酸氨基转移酶',
      aliases: ['AST', '谷草转氨酶', 'GOT', 'aspartate aminotransferase'],
      category: '肝功能',
      unit: 'U/L',
      referenceRange: {
        adult: '15-40'
      },
      clinicalSignificance: 'AST存在于肝脏、心肌、骨骼肌等。AST/ALT比值>1提示酒精性肝病或肝硬化。心肌梗死时AST显著升高。',
      highCauses: [
        '病毒性肝炎',
        '酒精性肝病（AST/ALT>2）',
        '药物性肝损伤',
        '急性心肌梗死',
        '骨骼肌损伤',
        '肝硬化',
        '胆道疾病'
      ],
      lowCauses: [
        '一般无临床意义',
        '维生素B6缺乏',
        '妊娠'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '转氨酶', '心肌']
    },
    {
      id: 'l006',
      name: '血清肌酐',
      aliases: ['Cr', '肌酐', 'creatinine', '血肌酐'],
      category: '肾功能',
      unit: 'μmol/L',
      referenceRange: {
        male: '57-97',
        female: '41-73'
      },
      clinicalSignificance: '肌酐是评估肾功能的重要指标。持续升高提示肾功能损害。但需注意肌酐受肌肉量影响，老年人肌肉量少时可能低估肾功能损害。',
      highCauses: [
        '急性肾损伤（肾前性、肾性、肾后性）',
        '慢性肾功能不全',
        '肾小球肾炎',
        '糖尿病肾病',
        '高血压肾病',
        '泌尿系梗阻',
        '心力衰竭',
        '脱水'
      ],
      lowCauses: [
        '一般无临床意义',
        '肌肉量减少（营养不良、老年）',
        '妊娠'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肾功能', '肾脏', '代谢']
    },
    {
      id: 'l007',
      name: '空腹血糖',
      aliases: ['FBG', '空腹血糖', 'FPG', 'fasting blood glucose', '血糖'],
      category: '糖代谢',
      unit: 'mmol/L',
      referenceRange: {
        normal: '3.9-6.1',
        prediabetes: '6.1-7.0（空腹血糖受损）',
        diabetes: '≥7.0'
      },
      clinicalSignificance: '空腹血糖是筛查和诊断糖尿病的重要指标。≥7.0 mmol/L需择日复测以确诊糖尿病。',
      highCauses: [
        '糖尿病',
        '应激性高血糖（感染、创伤、手术）',
        '糖皮质激素使用',
        '甲状腺功能亢进',
        '库欣综合征',
        '胰腺炎',
        '嗜铬细胞瘤'
      ],
      lowCauses: [
        '胰岛素或降糖药过量',
        '胰岛素瘤',
        '肾上腺皮质功能减退',
        '严重肝病',
        '长期饥饿、营养不良',
        '剧烈运动后',
        '酒精性低血糖'
      ],
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['血糖', '糖尿病', '代谢']
    },
    {
      id: 'l008',
      name: '总胆固醇',
      aliases: ['TC', '胆固醇', 'total cholesterol', '血脂'],
      category: '血脂',
      unit: 'mmol/L',
      referenceRange: {
        desirable: '<5.2',
        borderline: '5.2-6.2',
        high: '≥6.2'
      },
      clinicalSignificance: '总胆固醇是心血管风险评估的重要指标。总胆固醇升高是动脉粥样硬化和冠心病的危险因素。',
      highCauses: [
        '高脂饮食',
        '遗传性高脂血症（家族性高胆固醇血症）',
        '甲状腺功能减退',
        '肾病综合征',
        '胆道梗阻',
        '糖尿病',
        '肥胖',
        '药物：噻嗪类利尿剂、β受体阻滞剂'
      ],
      lowCauses: [
        '营养不良、严重肝病',
        '甲状腺功能亢进',
        '贫血',
        '严重感染',
        '恶性肿瘤'
      ],
      source: '《中国成人血脂异常防治指南》（2016年修订版）',
      sourceDetail: '中国成人血脂异常防治指南修订联合委员会',
      tags: ['血脂', '心血管', '代谢']
    },
    {
      id: 'l009',
      name: '甘油三酯',
      aliases: ['TG', 'triglycerides', '甘油三脂', 'TG血脂'],
      category: '血脂',
      unit: 'mmol/L',
      referenceRange: {
        desirable: '<1.7',
        borderline: '1.7-2.3',
        high: '≥2.3'
      },
      clinicalSignificance: '甘油三酯升高与胰腺炎风险相关（>5.6 mmol/L时风险显著增加），也是心血管疾病的危险因素。',
      highCauses: [
        '高脂高糖饮食',
        '酗酒',
        '肥胖',
        '糖尿病（血糖控制不佳）',
        '甲状腺功能减退',
        '肾病综合征',
        '药物：口服雌激素、糖皮质激素',
        '遗传性高甘油三酯血症'
      ],
      lowCauses: [
        '营养不良',
        '甲状腺功能亢进',
        '严重肝病',
        '吸收不良综合征'
      ],
      source: '《中国成人血脂异常防治指南》（2016年修订版）',
      sourceDetail: '中国成人血脂异常防治指南修订联合委员会',
      tags: ['血脂', '心血管', '代谢']
    },
    {
      id: 'l010',
      name: '凝血酶原时间',
      aliases: ['PT', '凝血酶原', 'prothrombin time', 'INR'],
      category: '凝血功能',
      unit: '秒',
      referenceRange: {
        pt: '11-14',
        inr: '0.8-1.2（正常人）',
        inrTherapeutic: '2.0-3.0（华法林抗凝治疗）'
      },
      clinicalSignificance: 'PT是外源性凝血途径的筛查指标。INR用于监测华法林抗凝治疗。PT延长提示凝血因子缺乏或抗凝药物影响。',
      highCauses: [
        '华法林等抗凝药物使用',
        '严重肝病（凝血因子合成减少）',
        '维生素K缺乏',
        '弥散性血管内凝血（DIC）',
        '凝血因子缺乏症（如血友病少见，血友病APTT延长更明显）',
        '胆道梗阻（维生素K吸收障碍）'
      ],
      lowCauses: [
        '高凝状态（血栓前状态）',
        '口服避孕药使用'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['凝血', '华法林', '出血']
    },
    {
      id: 'l011',
      name: '红细胞计数',
      aliases: ['RBC', '红细胞', 'red blood cell', '红血球'],
      category: '血常规',
      unit: '×10¹²/L',
      referenceRange: {
        male: '4.3-5.8',
        female: '3.8-5.1',
        child: '4.0-5.5'
      },
      clinicalSignificance: '红细胞计数用于评估贫血和红细胞增多症。结合血红蛋白和红细胞比容综合判断。',
      highCauses: [
        '脱水（血液浓缩）',
        '真性红细胞增多症',
        '慢性缺氧（慢阻肺、先天性心脏病）',
        '高原居住',
        '肾细胞癌'
      ],
      lowCauses: [
        '各型贫血',
        '急慢性失血',
        '溶血性贫血',
        '骨髓抑制'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '贫血']
    },
    {
      id: 'l012',
      name: '血尿素氮',
      aliases: ['BUN', '尿素氮', 'urea', '尿素'],
      category: '肾功能',
      unit: 'mmol/L',
      referenceRange: {
        adult: '2.9-8.2'
      },
      clinicalSignificance: '尿素氮是蛋白质代谢产物，反映肾小球滤过功能。受饮食蛋白摄入量、消化道出血等因素影响。',
      highCauses: [
        '肾功能不全',
        '脱水',
        '消化道出血',
        '高蛋白饮食',
        '心力衰竭',
        '尿路梗阻'
      ],
      lowCauses: [
        '低蛋白饮食',
        '严重肝病（合成减少）',
        '营养不良',
        '妊娠'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肾功能', '肾脏', '代谢']
    },
    {
      id: 'l013',
      name: '血清钠',
      aliases: ['Na+', '钠', 'sodium', '血钠'],
      category: '电解质',
      unit: 'mmol/L',
      referenceRange: {
        adult: '135-145'
      },
      clinicalSignificance: '血钠是评估水盐平衡的重要指标。低钠血症（<135）和高钠血症（>145）均需及时处理。',
      highCauses: [
        '脱水（水分丢失过多）',
        '尿崩症',
        '高钠饮食输入',
        '醛固酮增多症',
        '医源性高钠'
      ],
      lowCauses: [
        '稀释性低钠（心力衰竭、肝硬化、肾病综合征）',
        '抗利尿激素分泌异常综合征（SIADH）',
        '消化道丢失（呕吐、腹泻）',
        '大量出汗后仅补水',
        '利尿剂使用',
        '肾上腺皮质功能减退'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['电解质', '水盐平衡']
    },
    {
      id: 'l014',
      name: '血清钾',
      aliases: ['K+', '钾', 'potassium', '血钾'],
      category: '电解质',
      unit: 'mmol/L',
      referenceRange: {
        adult: '3.5-5.3'
      },
      clinicalSignificance: '血钾异常可危及生命。高钾血症（>5.5）可致心律失常甚至心脏骤停。低钾血症（<3.5）可致肌无力、心律失常。',
      highCauses: [
        '肾功能衰竭',
        '溶血或组织破坏（烧伤、横纹肌溶解）',
        '保钾利尿剂使用（螺内酯等）',
        'ACE抑制剂/ARB',
        '酸中毒',
        '补钾过量'
      ],
      lowCauses: [
        '利尿剂使用（呋塞米等）',
        '呕吐、腹泻',
        '长期使用糖皮质激素',
        '甲亢性周期性麻痹',
        '碱中毒',
        '胰岛素治疗（促进钾进入细胞）',
        '饮食摄入不足'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['电解质', '心律失常', '肾脏']
    },
    {
      id: 'l015',
      name: 'C反应蛋白',
      aliases: ['CRP', 'C反应蛋白', '超敏CRP', 'hs-CRP'],
      category: '炎症标志物',
      unit: 'mg/L',
      referenceRange: {
        normal: '<10',
        highRisk: 'hs-CRP 1.0-3.0为心血管中度风险',
        veryHighRisk: 'hs-CRP >3.0为心血管高度风险'
      },
      clinicalSignificance: 'CRP是急性时相反应蛋白，在感染、炎症、组织损伤时迅速升高。超敏CRP（hs-CRP）用于心血管风险评估。',
      highCauses: [
        '细菌感染（显著升高）',
        '组织损伤（手术、创伤、心肌梗死）',
        '自身免疫性疾病活动期',
        '恶性肿瘤',
        '急性炎症'
      ],
      lowCauses: [
        '正常水平，无临床意义',
        '新生儿CRP基础值较低'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['炎症', '感染', '心血管']
    },
    {
      id: 'l016',
      name: '糖化血红蛋白',
      aliases: ['HbA1c', '糖化', 'glycated hemoglobin'],
      category: '糖代谢',
      unit: '%',
      referenceRange: {
        normal: '<5.7',
        prediabetes: '5.7-6.4',
        diabetes: '≥6.5'
      },
      clinicalSignificance: 'HbA1c反映近2-3个月平均血糖水平，是评估糖尿病长期血糖控制的金标准。治疗目标通常<7.0%。',
      highCauses: [
        '糖尿病（≥6.5%可诊断）',
        '血糖控制不佳',
        '缺铁性贫血（红细胞寿命延长）',
        '脾切除术后'
      ],
      lowCauses: [
        '溶血性贫血（红细胞寿命缩短）',
        '近期大量失血',
        '妊娠',
        '血红蛋白病'
      ],
      source: '《中国2型糖尿病防治指南》（2020年版）',
      sourceDetail: '中华医学会糖尿病学分会',
      tags: ['血糖', '糖尿病', '代谢']
    },
    {
      id: 'l017',
      name: 'D-二聚体',
      aliases: ['D-dimer', 'DD', 'D二聚体'],
      category: '凝血功能',
      unit: 'mg/L FEU',
      referenceRange: {
        adult: '<0.5'
      },
      clinicalSignificance: 'D-二聚体升高提示体内有血栓形成和纤溶活动。阴性结果可有效排除肺栓塞和深静脉血栓。但阳性不能确诊血栓（特异性低）。',
      highCauses: [
        '深静脉血栓形成（DVT）',
        '肺栓塞（PE）',
        '弥散性血管内凝血（DIC）',
        '主动脉夹层',
        '恶性肿瘤',
        '妊娠（生理性升高）',
        '近期手术或创伤',
        '感染、炎症',
        '高龄（>50岁：年龄×0.01为临界值）'
      ],
      lowCauses: [
        '正常水平，无临床意义'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['凝血', '血栓', '肺栓塞']
    },
    {
      id: 'l018',
      name: '降钙素原',
      aliases: ['PCT', 'procalcitonin', '降钙素原'],
      category: '炎症标志物',
      unit: 'ng/mL',
      referenceRange: {
        normal: '<0.1',
        localInfection: '0.1-0.5',
        systemicInfection: '0.5-2.0',
        severeSepsis: '2.0-10.0',
        septicShock: '>10.0'
      },
      clinicalSignificance: 'PCT对细菌感染的诊断特异性优于CRP。可指导抗生素的使用决策：低水平支持非细菌感染，可减少不必要的抗生素使用。',
      highCauses: [
        '严重细菌感染和脓毒症（显著升高）',
        '全身性真菌感染',
        '寄生虫感染',
        '大面积创伤、烧伤',
        '大手术后',
        '心源性休克',
        '长时间休克'
      ],
      lowCauses: [
        '正常水平，排除严重细菌感染',
        '病毒感染（PCT通常不升高或轻微升高）',
        '自身免疫性疾病活动期（通常不升高）'
      ],
      source: '《降钙素原急诊临床应用的专家共识》',
      sourceDetail: '中华医学会急诊医学分会',
      tags: ['感染', '脓毒症', '炎症']
    },
    {
      id: 'l019',
      name: '总胆红素',
      aliases: ['TBIL', 'STB', 'total bilirubin', '胆红素'],
      category: '肝功能',
      unit: 'μmol/L',
      referenceRange: {
        adult: '3.4-17.1',
        newborn: '34-205（生理性黄疸）'
      },
      clinicalSignificance: '总胆红素是评估黄疸、肝胆功能和溶血的重要指标。>17.1μmol/L为高胆红素血症，>34.2μmol/L出现皮肤巩膜黄染。',
      highCauses: [
        '肝前性（溶血性黄疸）：溶血性贫血、无效造血',
        '肝性（肝细胞性黄疸）：病毒性肝炎、肝硬化、药物性肝损伤',
        '肝后性（梗阻性黄疸）：胆结石、胆管肿瘤、胰头癌',
        'Gilbert综合征（轻度升高）',
        '新生儿生理性黄疸'
      ],
      lowCauses: [
        '一般无临床意义',
        '缺铁性贫血可能轻度降低'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '黄疸', '胆红素']
    },
    {
      id: 'l020',
      name: '直接胆红素',
      aliases: ['DBIL', 'CB', 'direct bilirubin', '结合胆红素'],
      category: '肝功能',
      unit: 'μmol/L',
      referenceRange: {
        adult: '0-6.8'
      },
      clinicalSignificance: '直接胆红素升高为主提示梗阻性或肝细胞性黄疸，用于黄疸类型鉴别。直接胆红素/总胆红素>20%提示肝细胞性，>50%提示梗阻性。',
      highCauses: [
        '胆道梗阻（结石、肿瘤、狭窄）',
        '肝细胞性疾病（肝炎、肝硬化）',
        'Dubin-Johnson综合征',
        'Rotor综合征',
        '药物性肝内胆汁淤积'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '黄疸', '胆红素']
    },
    {
      id: 'l021',
      name: '碱性磷酸酶',
      aliases: ['ALP', 'AKP', 'alkaline phosphatase'],
      category: '肝功能/骨代谢',
      unit: 'U/L',
      referenceRange: {
        adult: '40-150',
        child: '<350（生长期生理性偏高）'
      },
      clinicalSignificance: 'ALP存在于肝、骨、肠、胎盘等组织。反映肝胆（胆道梗阻敏感）和骨代谢（成骨活动）状况。儿童生长期和妊娠晚期生理性升高。',
      highCauses: [
        '胆道梗阻（显著升高，最常见）',
        '骨骼疾病：佝偻病、Paget骨病、骨转移瘤、骨折愈合期',
        '肝脏疾病（肝炎、肝硬化、肝癌）',
        '妊娠晚期（胎盘来源）',
        '儿童生长期（生理性）'
      ],
      lowCauses: [
        '甲状腺功能减退',
        '贫血',
        '锌、镁缺乏',
        '低磷血症'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '骨代谢', '胆道']
    },
    {
      id: 'l022',
      name: 'γ-谷氨酰转肽酶',
      aliases: ['GGT', 'γ-GT', 'gamma-glutamyl transferase', '谷氨酰转肽酶'],
      category: '肝功能',
      unit: 'U/L',
      referenceRange: {
        male: '<60',
        female: '<40'
      },
      clinicalSignificance: 'GGT对胆道梗阻敏感性高，是酒精性肝病的标志物。常与ALP联合判断胆道疾病来源（GGT升高支持肝胆来源）。',
      highCauses: [
        '胆道梗阻',
        '酒精性肝病（最敏感指标）',
        '药物性肝损伤',
        '非酒精性脂肪肝',
        '肝癌',
        '胰腺疾病',
        '长期饮酒者'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '胆道', '酒精性肝病']
    },
    {
      id: 'l023',
      name: '白蛋白',
      aliases: ['ALB', 'albumin', '血清白蛋白', '清蛋白'],
      category: '肝功能/营养',
      unit: 'g/L',
      referenceRange: {
        adult: '40-55'
      },
      clinicalSignificance: '白蛋白由肝脏合成，半衰期约20天。反映肝脏合成功能、营养状态，是肝硬化严重程度评估（Child-Pugh评分）的重要指标。',
      highCauses: [
        '脱水（血液浓缩）'
      ],
      lowCauses: [
        '肝硬化（合成减少，最常见）',
        '肾病综合征（尿中丢失）',
        '营养不良、吸收不良',
        '烧伤（创面渗出）',
        '慢性炎症（急性时相负反应）',
        '妊娠（生理性）',
        '恶性肿瘤',
        '蛋白丢失性肠病'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '营养', '蛋白质']
    },
    {
      id: 'l024',
      name: '总蛋白',
      aliases: ['TP', 'total protein', '血清总蛋白'],
      category: '肝功能/营养',
      unit: 'g/L',
      referenceRange: {
        adult: '65-85'
      },
      clinicalSignificance: '总蛋白为白蛋白与球蛋白之和，反映机体蛋白代谢状况。白球比（A/G）正常为1.5-2.5，倒置提示肝功能严重损害或多发性骨髓瘤。',
      highCauses: [
        '脱水（血液浓缩）',
        '多发性骨髓瘤（M蛋白增多）',
        'Waldenström巨球蛋白血症',
        '慢性炎症（球蛋白升高）',
        '结节病'
      ],
      lowCauses: [
        '营养不良',
        '肝硬化（白蛋白合成减少）',
        '肾病综合征（白蛋白丢失）',
        '烧伤',
        '吸收不良综合征',
        '恶性肿瘤'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '营养', '蛋白质']
    },
    {
      id: 'l025',
      name: '促甲状腺激素',
      aliases: ['TSH', 'thyroid stimulating hormone', '甲状腺刺激素'],
      category: '甲状腺功能',
      unit: 'mIU/L',
      referenceRange: {
        adult: '0.4-4.0',
        pregnancy: '妊娠早期0.1-2.5，中期0.2-3.0，晚期0.3-3.0'
      },
      clinicalSignificance: 'TSH是甲状腺功能最敏感的指标，受下丘脑-垂体-甲状腺轴负反馈调节。甲亢时TSH降低，甲减时TSH升高。是甲状腺疾病筛查首选指标。',
      highCauses: [
        '原发性甲状腺功能减退（最常见）',
        '亚临床甲状腺功能减退',
        '垂体TSH瘤（罕见）',
        '甲状腺激素抵抗综合征'
      ],
      lowCauses: [
        '甲状腺功能亢进（Graves病，最常见）',
        '亚临床甲状腺功能亢进',
        '垂体性甲减（继发性）',
        '甲状腺激素过量使用',
        '妊娠早期（hCG刺激）'
      ],
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲减', '甲亢']
    },
    {
      id: 'l026',
      name: '游离三碘甲状腺原氨酸',
      aliases: ['FT3', 'free T3', '游离T3'],
      category: '甲状腺功能',
      unit: 'pmol/L',
      referenceRange: {
        adult: '3.5-6.5'
      },
      clinicalSignificance: 'FT3是甲状腺激素的活性形式，不受结合蛋白影响，准确反映甲状腺功能状态。甲亢时升高，是甲亢诊断和疗效监测的重要指标。',
      highCauses: [
        '甲状腺功能亢进（Graves病）',
        'T3型甲亢',
        '甲状腺激素抵抗综合征',
        '亚急性甲状腺炎（释放期）'
      ],
      lowCauses: [
        '甲状腺功能减退',
        '低T3综合征（严重疾病、营养不良）',
        '甲亢治疗中',
        '垂体功能减退'
      ],
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲亢', '甲减']
    },
    {
      id: 'l027',
      name: '游离甲状腺素',
      aliases: ['FT4', 'free T4', '游离T4'],
      category: '甲状腺功能',
      unit: 'pmol/L',
      referenceRange: {
        adult: '11.5-22.7'
      },
      clinicalSignificance: 'FT4是甲状腺激素的主要循环形式，不受结合蛋白影响。甲亢时升高，甲减时降低。与TSH联合是甲状腺功能评估的核心组合。',
      highCauses: [
        '甲状腺功能亢进（Graves病）',
        '甲状腺炎早期（激素释放）',
        '甲状腺激素过量',
        '亚急性甲状腺炎（释放期）'
      ],
      lowCauses: [
        '原发性甲状腺功能减退',
        '中枢性甲减（垂体/下丘脑）',
        '低T3综合征（严重疾病）',
        '甲亢治疗中'
      ],
      source: '《中国甲状腺疾病诊治指南》',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['甲状腺', '甲亢', '甲减']
    },
    {
      id: 'l028',
      name: '肌钙蛋白I',
      aliases: ['cTnI', 'cardiac troponin I', '心肌肌钙蛋白I'],
      category: '心肌标志物',
      unit: 'ng/mL',
      referenceRange: {
        normal: '<0.04',
        myocardialInjury: '>0.04（提示心肌损伤）',
        mi: '>0.4（急性心肌梗死可能）'
      },
      clinicalSignificance: '肌钙蛋白I是心肌损伤特异性最高的标志物，是急性心肌梗死诊断的金标准。发病3-6小时升高，10-24小时达峰，持续7-10天。',
      highCauses: [
        '急性心肌梗死（最常见，诊断金标准）',
        '心肌炎',
        '心力衰竭（慢性升高提示预后差）',
        '肺栓塞',
        '肾功能不全（清除减少，假性升高）',
        '脓毒症',
        '剧烈运动（马拉松）',
        '心脏手术、电复律'
      ],
      lowCauses: [
        '正常水平，无临床意义'
      ],
      source: '《急性ST段抬高型心肌梗死诊断和治疗指南》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心肌标志物', '心肌梗死', '心血管']
    },
    {
      id: 'l029',
      name: 'B型利钠肽',
      aliases: ['BNP', 'NT-proBNP', '脑钠肽', 'B型脑钠肽前体'],
      category: '心肌标志物/心力衰竭',
      unit: 'pg/mL',
      referenceRange: {
        bnp: '<100（排除心衰）',
        ntProBNP: '<300（年龄<75岁排除心衰）',
        ntProBNP50: '<450（年龄<50岁）',
        ntProBNP75: '>1800（年龄>75岁提示心衰）'
      },
      clinicalSignificance: 'BNP/NT-proBNP是心力衰竭诊断、严重程度评估和预后判断的重要指标。NT-proBNP受年龄影响，需用年龄校正界值。心衰治疗后下降提示治疗有效。',
      highCauses: [
        '心力衰竭（诊断标志，与NYHA分级相关）',
        '急性心肌梗死',
        '肺栓塞',
        '心房颤动',
        '肾功能不全',
        '高龄（生理性轻度升高）',
        '脓毒症',
        '肝硬化'
      ],
      lowCauses: [
        '正常水平，可基本排除心力衰竭'
      ],
      source: '《中国心力衰竭诊断和治疗指南》（2018）',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心肌标志物', '心衰', '心血管']
    },
    {
      id: 'l030',
      name: '肌酸激酶同工酶',
      aliases: ['CK-MB', 'creatine kinase MB', 'CK同工酶'],
      category: '心肌标志物',
      unit: 'U/L 或 ng/mL',
      referenceRange: {
        activity: '<25 U/L',
        mass: '<5 ng/mL'
      },
      clinicalSignificance: 'CK-MB主要存在于心肌，心肌梗死发病4-6小时升高，24小时达峰，48-72小时恢复。是心肌梗死早期诊断的传统标志物，现已部分被肌钙蛋白取代。',
      highCauses: [
        '急性心肌梗死',
        '心肌炎',
        '骨骼肌损伤（轻度升高）',
        '心脏手术、电复律',
        '剧烈运动',
        '肌营养不良',
        '甲状腺功能减退（CK总升高为主）'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《急性ST段抬高型心肌梗死诊断和治疗指南》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心肌标志物', '心肌梗死', '心血管']
    },
    {
      id: 'l031',
      name: '血清铁',
      aliases: ['SI', 'serum iron', '铁', '血铁'],
      category: '铁代谢',
      unit: 'μmol/L',
      referenceRange: {
        male: '11-30',
        female: '9-27'
      },
      clinicalSignificance: '血清铁反映循环中与转铁蛋白结合的铁，受昼夜变化和饮食影响（上午高、晚上低），单次检测意义有限，需结合铁蛋白和总铁结合力综合判断。',
      highCauses: [
        '铁过载（血色病、遗传性）',
        '输血性铁过载',
        '再生障碍性贫血',
        '溶血性贫血',
        '急性肝炎（铁释放）'
      ],
      lowCauses: [
        '缺铁性贫血（最常见）',
        '慢性失血',
        '慢性病贫血',
        '妊娠',
        '吸收不良'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['铁代谢', '贫血', '营养']
    },
    {
      id: 'l032',
      name: '铁蛋白',
      aliases: ['ferritin', 'SF', '血清铁蛋白'],
      category: '铁代谢',
      unit: 'μg/L（ng/mL）',
      referenceRange: {
        male: '15-200',
        female: '12-150',
        child: '7-140'
      },
      clinicalSignificance: '铁蛋白反映体内铁储存量，是缺铁性贫血早期敏感指标。同时也是急性时相蛋白，感染、炎症、肿瘤时升高，需综合判断。',
      highCauses: [
        '铁过载（血色病、输血性）',
        '慢性炎症、感染',
        '肝病（肝炎、肝硬化）',
        '恶性肿瘤（肝癌、白血病）',
        '代谢综合征',
        '酒精性肝病'
      ],
      lowCauses: [
        '缺铁性贫血（早期最敏感指标，<15μg/L可诊断）',
        '慢性失血',
        '妊娠（生理性消耗）'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['铁代谢', '贫血', '营养']
    },
    {
      id: 'l033',
      name: '血液pH',
      aliases: ['pH', 'blood pH', '酸碱度'],
      category: '血气分析',
      unit: '无量纲',
      referenceRange: {
        adult: '7.35-7.45',
        venous: '7.32-7.42'
      },
      clinicalSignificance: '血液pH是酸碱平衡的核心指标。pH<7.35为酸血症，>7.45为碱血症。需结合PaCO2和HCO3-判断酸碱失衡类型（呼吸性vs代谢性）。',
      highCauses: [
        '代谢性碱中毒：呕吐、利尿剂、低钾血症',
        '呼吸性碱中毒：过度通气、焦虑、缺氧、肺栓塞、高热、败血症早期',
        '代偿性升高（慢性呼吸性酸中毒的代偿）'
      ],
      lowCauses: [
        '代谢性酸中毒：乳酸酸中毒、糖尿病酮症酸中毒、尿毒症、中毒（甲醇/乙二醇）',
        '呼吸性酸中毒：COPD、呼吸抑制（阿片/镇静药）、神经肌肉疾病',
        '严重腹泻（碳酸氢根丢失）'
      ],
      source: '《临床血气分析》',
      sourceDetail: '人民卫生出版社',
      tags: ['血气分析', '酸碱平衡']
    },
    {
      id: 'l034',
      name: '动脉氧分压',
      aliases: ['PaO2', 'partial pressure of oxygen', '氧分压'],
      category: '血气分析',
      unit: 'mmHg（kPa）',
      referenceRange: {
        adult: '80-100 mmHg（10.7-13.3 kPa）',
        elderly: '随年龄下降（70岁约70-85 mmHg）'
      },
      clinicalSignificance: 'PaO2反映动脉血氧合状态，是诊断低氧血症和呼吸衰竭的关键指标。PaO2<60mmHg为I型呼吸衰竭。',
      highCauses: [
        '吸氧状态（氧疗中）',
        '过度通气'
      ],
      lowCauses: [
        '低氧血症（PaO2<80mmHg）',
        'I型呼吸衰竭（PaO2<60mmHg）：肺炎、肺水肿、ARDS',
        '肺栓塞',
        'COPD',
        '高原环境',
        '先天性心脏病右向左分流',
        '严重贫血（氧含量低但PaO2正常）'
      ],
      source: '《临床血气分析》',
      sourceDetail: '人民卫生出版社',
      tags: ['血气分析', '氧合', '呼吸衰竭']
    },
    {
      id: 'l035',
      name: '动脉二氧化碳分压',
      aliases: ['PaCO2', 'partial pressure of CO2', '二氧化碳分压'],
      category: '血气分析',
      unit: 'mmHg',
      referenceRange: {
        adult: '35-45'
      },
      clinicalSignificance: 'PaCO2反映肺泡通气功能。PaCO2>45mmHg提示通气不足（呼吸性酸中毒或代偿），<35mmHg提示通气过度（呼吸性碱中毒或代偿）。PaCO2>50mmHg为II型呼吸衰竭。',
      highCauses: [
        '通气不足（呼吸性酸中毒）',
        'COPD（最常见）',
        '呼吸抑制：阿片类、镇静催眠药',
        '神经肌肉疾病（重症肌无力、格林-巴利）',
        '肥胖低通气综合征',
        'II型呼吸衰竭（PaCO2>50mmHg）'
      ],
      lowCauses: [
        '过度通气（呼吸性碱中毒）',
        '焦虑、癔症',
        '缺氧（代偿性通气增加）',
        '肺栓塞',
        '败血症早期',
        '高热',
        '代谢性酸中毒代偿'
      ],
      source: '《临床血气分析》',
      sourceDetail: '人民卫生出版社',
      tags: ['血气分析', '通气功能', '呼吸衰竭']
    },
    {
      id: 'l036',
      name: '碳酸氢根',
      aliases: ['HCO3-', 'bicarbonate', 'HCO3', '碳酸氢根离子'],
      category: '血气分析/电解质',
      unit: 'mmol/L',
      referenceRange: {
        adult: '22-26'
      },
      clinicalSignificance: 'HCO3-是代谢性酸碱失衡的主要评估指标，也是机体最重要的缓冲系统。需结合pH和PaCO2判断原发性失衡与代偿情况。',
      highCauses: [
        '代谢性碱中毒：呕吐、利尿剂、低钾血症、Cushing综合征',
        '呼吸性酸中毒的代偿（COPD慢性CO2潴留）'
      ],
      lowCauses: [
        '代谢性酸中毒：乳酸酸中毒、酮症酸中毒、尿毒症、严重腹泻',
        '呼吸性碱中毒的代偿',
        '肾小管酸中毒'
      ],
      source: '《临床血气分析》',
      sourceDetail: '人民卫生出版社',
      tags: ['血气分析', '酸碱平衡', '电解质']
    },
    {
      id: 'l037',
      name: '尿酸',
      aliases: ['UA', 'uric acid', '血尿酸'],
      category: '代谢/痛风',
      unit: 'μmol/L',
      referenceRange: {
        male: '149-416',
        female: '89-357',
        child: '120-320'
      },
      clinicalSignificance: '尿酸是嘌呤代谢终产物。高尿酸血症是痛风的主要生化基础，也是心血管疾病、慢性肾病和代谢综合征的危险因素。',
      highCauses: [
        '痛风（高尿酸血症）',
        '高嘌呤饮食（海鲜、动物内脏、啤酒）',
        '肾功能不全（排泄减少）',
        '白血病、淋巴瘤（细胞破坏增多，肿瘤溶解综合征）',
        '利尿剂（噻嗪类、袢利尿剂）',
        '酒精',
        '铅中毒',
        '牛皮癣',
        '骨髓增殖性疾病'
      ],
      lowCauses: [
        'Wilson病',
        'Fanconi综合征',
        '肝豆状核变性',
        '黄嘌呤尿症',
        '抗利尿激素分泌异常综合征（SIADH）'
      ],
      source: '《中国高尿酸血症与痛风诊疗指南》（2019）',
      sourceDetail: '中华医学会内分泌学分会',
      tags: ['代谢', '痛风', '尿酸']
    },
    {
      id: 'l038',
      name: '红细胞沉降率',
      aliases: ['ESR', 'erythrocyte sedimentation rate', '血沉', '沉降率'],
      category: '炎症标志物',
      unit: 'mm/h',
      referenceRange: {
        male: '<15',
        female: '<20',
        elderly: '随年龄增加，上限=(年龄/2)男、(年龄+10)/2女'
      },
      clinicalSignificance: 'ESR是非特异性炎症指标，反映血浆中急性时相蛋白（主要是纤维蛋白原）变化。对慢性炎症、肿瘤和疾病活动度监测有价值，常与CRP互补。',
      highCauses: [
        '感染（细菌、结核）',
        '自身免疫性疾病（SLE、RA、巨细胞动脉炎、风湿性多肌痛）',
        '恶性肿瘤（多发性骨髓瘤显著升高）',
        '贫血（红细胞减少使血沉加快）',
        '妊娠（生理性）',
        '高龄',
        '肾病综合征',
        '组织损伤、心肌梗死'
      ],
      lowCauses: [
        '真性红细胞增多症',
        '镰状细胞贫血',
        '球形红细胞增多症',
        '心力衰竭',
        '低纤维蛋白原血症',
        '白细胞显著增多'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['炎症', '感染', '自身免疫']
    },
    {
      id: 'l039',
      name: '网织红细胞',
      aliases: ['Ret', 'reticulocyte', '网织红细胞计数'],
      category: '血常规',
      unit: '% 或 ×10⁹/L',
      referenceRange: {
        percentage: '0.5-1.5%',
        absolute: '24-84 ×10⁹/L'
      },
      clinicalSignificance: '网织红细胞是未完全成熟的红细胞，反映骨髓红系造血功能。升高提示骨髓造血活跃（溶血或失血后代偿），降低提示造血功能低下。',
      highCauses: [
        '溶血性贫血（显著升高，骨髓代偿）',
        '急性失血',
        '营养性贫血治疗后（有效指标，如缺铁性贫血补铁后、巨幼贫治疗后）',
        '骨髓纤维化'
      ],
      lowCauses: [
        '再生障碍性贫血',
        '骨髓抑制（化疗、放疗）',
        '巨幼细胞性贫血治疗前',
        '肾性贫血（EPO不足）',
        '纯红细胞再生障碍'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '贫血', '骨髓造血']
    },
    {
      id: 'l040',
      name: '嗜酸性粒细胞',
      aliases: ['EOS', 'eosinophil', '嗜酸粒细胞', '嗜酸性粒细胞计数'],
      category: '血常规',
      unit: '×10⁹/L 或 %',
      referenceRange: {
        percentage: '0.4-8%',
        absolute: '0.02-0.52 ×10⁹/L'
      },
      clinicalSignificance: '嗜酸性粒细胞参与过敏反应和抗寄生虫免疫。升高常见于过敏性疾病和寄生虫感染，显著升高（>1.5×10⁹/L）需警惕嗜酸性粒细胞增多综合征。',
      highCauses: [
        '过敏性疾病：哮喘、过敏性鼻炎、湿疹、药物过敏',
        '寄生虫感染（蛔虫、钩虫、血吸虫等）',
        '皮肤病（天疱疮、疱疹样皮炎）',
        '嗜酸性粒细胞增多综合征',
        '某些肿瘤：霍奇金淋巴瘤、嗜酸性白血病',
        '药物反应（青霉素、磺胺类）',
        'Addison病'
      ],
      lowCauses: [
        '严重应激（手术、创伤、烧伤）',
        '库欣综合征',
        '糖皮质激素治疗',
        '急性感染早期',
        '再生障碍性贫血'
      ],
      source: '《全国临床检验操作规程》（第4版）',
      sourceDetail: '中华人民共和国卫生部医政司',
      tags: ['血常规', '过敏', '寄生虫']
    },
    {
      id: 'l041',
      name: '血氨',
      aliases: ['NH3', 'blood ammonia', '氨', '血浆氨'],
      category: '代谢/肝功能',
      unit: 'μmol/L',
      referenceRange: {
        adult: '18-72'
      },
      clinicalSignificance: '血氨是蛋白质代谢产物，主要在肝脏经鸟氨酸循环转化为尿素。血氨升高透过血脑屏障引起神经毒性，是肝性脑病诊断和监测的重要指标。',
      highCauses: [
        '肝衰竭（急性、慢性）',
        '肝硬化（肝性脑病）',
        '门体分流术',
        'Reye综合征',
        '尿素循环障碍（遗传性）',
        '严重烧伤',
        '消化道出血（蛋白质负荷增加）',
        '便秘'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['肝功能', '肝性脑病', '代谢']
    },
    {
      id: 'l042',
      name: '乳酸',
      aliases: ['LAC', 'lactic acid', 'lactate', '血乳酸'],
      category: '代谢',
      unit: 'mmol/L',
      referenceRange: {
        venous: '0.5-1.6',
        arterial: '0.5-1.6',
        critical: '>5.0（乳酸酸中毒）'
      },
      clinicalSignificance: '乳酸是组织缺氧时无氧糖酵解的产物。血乳酸升高反映组织灌注不足，是休克和脓毒症严重程度及预后评估的关键指标。乳酸清除率指导复苏。',
      highCauses: [
        '休克（脓毒症性、心源性、低血容量性）',
        '严重缺氧',
        '严重感染、脓毒症',
        '糖尿病乳酸酸中毒（二甲双胍相关，罕见但严重）',
        '肝衰竭（乳酸清除减少）',
        '剧烈运动（生理性一过性）',
        '癫痫发作、震颤谵妄',
        '恶性肿瘤（Warburg效应）',
        '肠缺血',
        '中毒（甲醇、乙二醇、氰化物）'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《脓毒症和脓毒症休克国际共识定义（Sepsis-3）》',
      sourceDetail: 'JAMA, 2016; 中文版，中华危重病急救医学',
      tags: ['代谢', '休克', '脓毒症', '缺氧']
    },
    {
      id: 'l043',
      name: '血浆渗透压',
      aliases: ['Osm', 'osmolarity', 'osmolality', '渗透压'],
      category: '代谢',
      unit: 'mOsm/L',
      referenceRange: {
        plasma: '280-310',
        calculated: '2×(Na+) + 血糖 + 血尿素氮（mmol/L）'
      },
      clinicalSignificance: '血浆渗透压反映体内水和溶质平衡状态。渗透压间隙（实测-计算>10）提示存在未测定的溶质（如酒精、甲醇、乙二醇）。是高渗状态和水失衡评估的重要指标。',
      highCauses: [
        '高钠性脱水',
        '糖尿病高渗状态（HHS，血糖显著升高）',
        '尿崩症',
        '酒精中毒',
        '严重高血糖',
        '甲醇/乙二醇中毒（渗透压间隙增大）',
        '甘露醇治疗'
      ],
      lowCauses: [
        '抗利尿激素分泌异常综合征（SIADH）',
        '水中毒',
        '肝硬化',
        '心力衰竭',
        '肾病综合征',
        '低钠血症'
      ],
      source: '《临床检验诊断学》',
      sourceDetail: '人民卫生出版社',
      tags: ['代谢', '水电解质平衡', '渗透压']
    },
    {
      id: 'l044',
      name: '25-羟维生素D',
      aliases: ['25(OH)D', 'vitamin D', '维生素D', '骨化二醇'],
      category: '代谢/骨骼',
      unit: 'ng/mL（nmol/L）',
      referenceRange: {
        sufficient: '>30',
        insufficient: '20-30',
        deficient: '<20',
        severeDeficient: '<10',
        conversion: '1 ng/mL = 2.5 nmol/L'
      },
      clinicalSignificance: '25(OH)D是维生素D在体内的主要循环形式，半衰期长，是评估维生素D状态的金标准。维生素D缺乏与骨质疏松、肌无力、心血管疾病等多种疾病相关。',
      highCauses: [
        '维生素D中毒（过量补充）',
        '结节病（异位1α羟化酶活性）',
        '某些淋巴瘤',
        '威廉姆斯综合征'
      ],
      lowCauses: [
        '维生素D缺乏（日照不足、摄入不足）',
        '吸收不良（乳糜泻、炎症性肠病）',
        '肝功能不全（25羟化障碍）',
        '肾功能不全（1α羟化障碍，影响活性形式）',
        '老年人（皮肤合成减少）',
        '肥胖（脂溶性维生素分布容积增大）',
        '抗癫痫药、糖皮质激素长期使用'
      ],
      source: '《维生素D与成年人骨骼健康应用指南》',
      sourceDetail: '中华医学会骨质疏松和骨矿盐疾病分会',
      tags: ['代谢', '骨骼', '维生素', '营养']
    },
    {
      id: 'l045',
      name: '同型半胱氨酸',
      aliases: ['Hcy', 'homocysteine', '高半胱氨酸', 'HCY'],
      category: '心血管/代谢',
      unit: 'μmol/L',
      referenceRange: {
        ideal: '<15',
        mild: '15-30',
        moderate: '30-100',
        severe: '>100'
      },
      clinicalSignificance: '同型半胱氨酸是甲硫氨酸代谢的中间产物，是心血管疾病的独立危险因素。也是维生素B12、叶酸缺乏的敏感指标。升高与脑卒中、痴呆、骨质疏松相关。',
      highCauses: [
        '维生素B12缺乏',
        '叶酸缺乏',
        '维生素B6缺乏',
        '慢性肾功能不全',
        '甲状腺功能减退',
        '药物：二甲双胍、苯妥英、烟酸、甲氨蝶呤',
        '遗传性高同型半胱氨酸血症（MTHFR基因突变）',
        '吸烟、酗酒',
        '高龄',
        '银屑病'
      ],
      lowCauses: [
        '一般无临床意义'
      ],
      source: '《同型半胱氨酸诊疗中国专家共识》',
      sourceDetail: '中华医学会心血管病学分会',
      tags: ['心血管', '代谢', '维生素', '脑卒中']
    }
  ],

  // ========== 常见问答（智能推荐）==========
  faqs: [
    { question: '头孢能喝酒吗？', keywords: ['头孢', '酒精', '喝酒'], target: 'd002' },
    { question: '阿司匹林和氯吡格雷能一起吃吗？', keywords: ['阿司匹林', '氯吡格雷', '一起'], target: 'd001' },
    { question: '二甲双胍能喝酒吗？', keywords: ['二甲双胍', '酒精', '喝酒'], target: 'd003' },
    { question: '华法林需要注意什么？', keywords: ['华法林', '注意'], target: 'd004' },
    { question: '吃华法林能吃阿司匹林吗？', keywords: ['华法林', '阿司匹林'], target: 'd004' },
    { question: '奥美拉唑和氯吡格雷有冲突吗？', keywords: ['奥美拉唑', '氯吡格雷'], target: 'd005' },
    { question: '吃头孢为什么要忌酒精？', keywords: ['头孢', '酒精'], target: 'd002' },
    { question: '白细胞高是什么原因？', keywords: ['白细胞', '高'], target: 'l001' },
    { question: '血红蛋白低是贫血吗？', keywords: ['血红蛋白', '低', '贫血'], target: 'l002' },
    { question: '空腹血糖多少算糖尿病？', keywords: ['空腹血糖', '糖尿病'], target: 'l007' },
    { question: '吃他汀类药物不能吃什么？', keywords: ['他汀', '不能吃'], target: 'd017' },
    { question: '吃左氧氟沙星有什么副作用？', keywords: ['左氧氟沙星', '副作用'], target: 'd014' },
    { question: '利伐沙班和华法林有什么区别？', keywords: ['利伐沙班', '华法林', '区别'], target: 'd021' },
    { question: '达比加群酯需要监测凝血吗？', keywords: ['达比加群', '监测', '凝血'], target: 'd022' },
    { question: '新型口服抗凝药哪个好？', keywords: ['新型口服抗凝药', 'DOAC'], target: 'd021' },
    { question: '吃利伐沙班能吃阿司匹林吗？', keywords: ['利伐沙班', '阿司匹林'], target: 'd021' },
    { question: '丙戊酸钠有什么副作用？', keywords: ['丙戊酸钠', '副作用'], target: 'd024' },
    { question: '丙戊酸钠怀孕能吃吗？', keywords: ['丙戊酸钠', '怀孕', '妊娠'], target: 'd024' },
    { question: '苯妥英钠中毒有什么表现？', keywords: ['苯妥英钠', '中毒'], target: 'd025' },
    { question: '卡马西平和什么药有冲突？', keywords: ['卡马西平', '冲突', '相互作用'], target: 'd026' },
    { question: '拉莫三嗪为什么容易起皮疹？', keywords: ['拉莫三嗪', '皮疹'], target: 'd027' },
    { question: '奥司他韦什么时候吃最好？', keywords: ['奥司他韦', '什么时候'], target: 'd028' },
    { question: '阿昔洛韦对肾有损害吗？', keywords: ['阿昔洛韦', '肾', '损害'], target: 'd029' },
    { question: '氟康唑能和他汀一起吃吗？', keywords: ['氟康唑', '他汀'], target: 'd030' },
    { question: '伏立康唑会影响视力吗？', keywords: ['伏立康唑', '视力'], target: 'd031' },
    { question: '吗啡为什么会便秘？', keywords: ['吗啡', '便秘'], target: 'd032' },
    { question: '芬太尼贴剂发热时能用吗？', keywords: ['芬太尼', '贴剂', '发热'], target: 'd033' },
    { question: '可待因儿童能用吗？', keywords: ['可待因', '儿童'], target: 'd034' },
    { question: '异烟肼为什么要吃维生素B6？', keywords: ['异烟肼', '维生素B6'], target: 'd035' },
    { question: '利福平为什么尿液变红？', keywords: ['利福平', '尿液', '红'], target: 'd036' },
    { question: '乙胺丁醇为什么要查视力？', keywords: ['乙胺丁醇', '视力'], target: 'd037' },
    { question: '胺碘酮有什么严重副作用？', keywords: ['胺碘酮', '副作用'], target: 'd038' },
    { question: '胺碘酮会影响甲状腺吗？', keywords: ['胺碘酮', '甲状腺'], target: 'd038' },
    { question: '螺内酯为什么能引起高钾？', keywords: ['螺内酯', '高钾'], target: 'd041' },
    { question: '氢氯噻嗪会诱发痛风吗？', keywords: ['氢氯噻嗪', '痛风'], target: 'd042' },
    { question: '硝酸甘油能和西地那非一起用吗？', keywords: ['硝酸甘油', '西地那非', '伟哥'], target: 'd044' },
    { question: '硝酸甘油为什么要保留无药期？', keywords: ['硝酸甘油', '无药期', '耐药'], target: 'd044' },
    { question: '奥氮平会发胖吗？', keywords: ['奥氮平', '发胖', '体重'], target: 'd046' },
    { question: '氯氮平为什么要查血常规？', keywords: ['氯氮平', '血常规'], target: 'd047' },
    { question: '舍曲林能和曲马多一起吃吗？', keywords: ['舍曲林', '曲马多'], target: 'd049' },
    { question: '氟西汀停药要注意什么？', keywords: ['氟西汀', '停药'], target: 'd050' },
    { question: '文拉法辛撤药有什么症状？', keywords: ['文拉法辛', '撤药'], target: 'd051' },
    { question: '地西泮能喝酒吗？', keywords: ['地西泮', '安定', '酒精', '喝酒'], target: 'd052' },
    { question: '唑吡坦为什么会梦游？', keywords: ['唑吡坦', '梦游'], target: 'd053' },
    { question: '缬沙坦和卡托普利能一起吃吗？', keywords: ['缬沙坦', '卡托普利'], target: 'd054' },
    { question: '卡托普利为什么干咳？', keywords: ['卡托普利', '干咳'], target: 'd056' },
    { question: 'ACE抑制剂妊娠期为什么禁用？', keywords: ['ACEI', '妊娠', '禁用'], target: 'd056' },
    { question: '瑞舒伐他汀肌肉痛怎么办？', keywords: ['瑞舒伐他汀', '肌肉痛'], target: 'd059' },
    { question: '非诺贝特能和他汀一起吃吗？', keywords: ['非诺贝特', '他汀'], target: 'd060' },
    { question: '格列美脲会低血糖吗？', keywords: ['格列美脲', '低血糖'], target: 'd061' },
    { question: '恩格列净有什么副作用？', keywords: ['恩格列净', '副作用'], target: 'd062' },
    { question: '西格列汀肾功能不全怎么用？', keywords: ['西格列汀', '肾功能不全'], target: 'd063' },
    { question: '吡格列酮心衰能用吗？', keywords: ['吡格列酮', '心衰'], target: 'd064' },
    { question: '多潘立酮有什么风险？', keywords: ['多潘立酮', '吗丁啉', '风险'], target: 'd066' },
    { question: '蒙脱石散怎么吃才正确？', keywords: ['蒙脱石散', '怎么吃'], target: 'd067' },
    { question: '氨茶碱为什么要监测血药浓度？', keywords: ['氨茶碱', '血药浓度', '监测'], target: 'd068' },
    { question: '氨茶碱和红霉素能一起用吗？', keywords: ['氨茶碱', '红霉素'], target: 'd068' },
    { question: '沙丁胺醇有什么副作用？', keywords: ['沙丁胺醇', '副作用'], target: 'd069' },
    { question: '布地奈德吸入后为什么要漱口？', keywords: ['布地奈德', '漱口'], target: 'd070' },
    { question: '孟鲁司特有什么精神副作用？', keywords: ['孟鲁司特', '精神', '抑郁'], target: 'd071' },
    { question: '氯雷他定嗜睡吗？', keywords: ['氯雷他定', '嗜睡'], target: 'd072' },
    { question: '阿仑膦酸钠怎么吃才不伤食道？', keywords: ['阿仑膦酸钠', '食道', '怎么吃'], target: 'd074' },
    { question: '碳酸钙和什么药不能一起吃？', keywords: ['碳酸钙', '不能一起'], target: 'd075' },
    { question: '左甲状腺素钠什么时候吃最好？', keywords: ['左甲状腺素', '优甲乐', '什么时候'], target: 'd076' },
    { question: '甲巯咪唑粒细胞缺乏怎么发现？', keywords: ['甲巯咪唑', '粒细胞缺乏'], target: 'd077' },
    { question: '丙硫氧嘧啶为什么伤肝？', keywords: ['丙硫氧嘧啶', '肝', '伤肝'], target: 'd078' },
    { question: '别嘌醇为什么要查HLA-B*5801？', keywords: ['别嘌醇', 'HLA', '基因'], target: 'd079' },
    { question: '秋水仙碱中毒有什么表现？', keywords: ['秋水仙碱', '中毒', '腹泻'], target: 'd080' },
    { question: '非布司他有什么心血管风险？', keywords: ['非布司他', '心血管'], target: 'd081' },
    { question: '环孢素为什么要监测血药浓度？', keywords: ['环孢素', '血药浓度', '监测'], target: 'd082' },
    { question: '他克莫司会引起糖尿病吗？', keywords: ['他克莫司', '糖尿病', '血糖'], target: 'd083' },
    { question: '环磷酰胺为什么出血性膀胱炎？', keywords: ['环磷酰胺', '出血性膀胱炎'], target: 'd084' },
    { question: '氟尿嘧啶有哪些常见副作用？', keywords: ['氟尿嘧啶', '副作用'], target: 'd085' },
    { question: '总胆红素高是黄疸吗？', keywords: ['总胆红素', '高', '黄疸'], target: 'l019' },
    { question: '直接胆红素升高提示什么？', keywords: ['直接胆红素', '升高'], target: 'l020' },
    { question: '碱性磷酸酶高是肝病还是骨病？', keywords: ['碱性磷酸酶', 'ALP', '高'], target: 'l021' },
    { question: 'GGT升高和喝酒有关吗？', keywords: ['GGT', '升高', '喝酒'], target: 'l022' },
    { question: '白蛋白低是肝不好吗？', keywords: ['白蛋白', '低', '肝'], target: 'l023' },
    { question: '总蛋白和白球比倒置是什么意思？', keywords: ['总蛋白', '白球比', '倒置'], target: 'l024' },
    { question: 'TSH高是甲亢还是甲减？', keywords: ['TSH', '高', '甲亢', '甲减'], target: 'l025' },
    { question: 'TSH低一定是甲亢吗？', keywords: ['TSH', '低', '甲亢'], target: 'l025' },
    { question: 'FT3 FT4正常但TSH异常怎么办？', keywords: ['FT3', 'FT4', 'TSH'], target: 'l026' },
    { question: '肌钙蛋白升高就是心梗吗？', keywords: ['肌钙蛋白', '升高', '心梗'], target: 'l028' },
    { question: 'BNP多少提示心衰？', keywords: ['BNP', '心衰'], target: 'l029' },
    { question: 'CK-MB升高一定是心梗吗？', keywords: ['CK-MB', '升高', '心梗'], target: 'l030' },
    { question: '血清铁和铁蛋白哪个准？', keywords: ['血清铁', '铁蛋白', '哪个准'], target: 'l032' },
    { question: '铁蛋白低多少是缺铁性贫血？', keywords: ['铁蛋白', '低', '贫血'], target: 'l032' },
    { question: '血气分析pH 7.2是什么意思？', keywords: ['pH', '7.2', '血气', '酸中毒'], target: 'l033' },
    { question: 'PaO2多少算呼吸衰竭？', keywords: ['PaO2', '氧分压', '呼吸衰竭'], target: 'l034' },
    { question: 'PaCO2高是什么原因？', keywords: ['PaCO2', '二氧化碳', '高'], target: 'l035' },
    { question: '碳酸氢根低是酸中毒吗？', keywords: ['碳酸氢根', 'HCO3', '低', '酸中毒'], target: 'l036' },
    { question: '尿酸高就是痛风吗？', keywords: ['尿酸', '高', '痛风'], target: 'l037' },
    { question: '血沉高是怎么回事？', keywords: ['血沉', 'ESR', '高'], target: 'l038' },
    { question: '血沉和CRP有什么区别？', keywords: ['血沉', 'CRP', '区别'], target: 'l038' },
    { question: '网织红细胞低说明什么？', keywords: ['网织红细胞', '低'], target: 'l039' },
    { question: '嗜酸性粒细胞高是过敏吗？', keywords: ['嗜酸性粒细胞', '高', '过敏'], target: 'l040' },
    { question: '血氨高是肝性脑病吗？', keywords: ['血氨', '高', '肝性脑病'], target: 'l041' },
    { question: '乳酸高意味着什么？', keywords: ['乳酸', '高'], target: 'l042' },
    { question: '二甲双胍会引起乳酸酸中毒吗？', keywords: ['二甲双胍', '乳酸酸中毒'], target: 'l042' },
    { question: '渗透压高是什么原因？', keywords: ['渗透压', '高'], target: 'l043' },
    { question: '维生素D缺乏要补多少？', keywords: ['维生素D', '缺乏', '补'], target: 'l044' },
    { question: '同型半胱氨酸高要吃什么？', keywords: ['同型半胱氨酸', '高', '吃'], target: 'l045' }
  ]
};

// 导出（支持 CommonJS 和浏览器全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MEDICAL_DB;
} else {
  window.MEDICAL_DB = MEDICAL_DB;
}
