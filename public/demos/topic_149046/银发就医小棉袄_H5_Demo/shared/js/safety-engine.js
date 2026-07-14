<!-- @trae-gen Safety-Engine V1.1 -->
/**
 * 银发就医小棉袄 - 前端安全规则引擎
 * 实现 3 条 P0 安全规则 + 1 个药物查询能力：
 *   1. 药物禁忌检测（38 条规则，覆盖 22 种常用老年慢病药物）
 *   2. 紧急症状检测（6 大类 50+ 关键词，支持方言词汇）
 *   3. 置信度分级
 *   4. 药物信息查询（queryDrug：按通用名/商品名查询，返回适应症、用法、注意事项及相互作用警告）
 *
 * 安全等级：
 *   green  - 正常
 *   yellow - 提示
 *   red    - 硬中断（shouldBlock=true，前端必须弹窗阻断用户操作）
 *
 * 纯前端 JS 实现，零依赖。
 */
(function () {
  'use strict';

  // ============ 安全等级常量 ============
  var LEVEL_GREEN = 'green';
  var LEVEL_YELLOW = 'yellow';
  var LEVEL_RED = 'red';

  // ============ 等级颜色与文案 ============
  var LEVEL_COLOR_MAP = {
    green: '#16a34a',
    yellow: '#eab308',
    red: '#dc2626'
  };

  var LEVEL_TEXT_MAP = {
    green: '正常',
    yellow: '提示',
    red: '硬中断'
  };

  // ============ 规则1：药物禁忌规则表 ============
  // 每条规则：{ drugs: [药A, 药B], level: 'red'|'yellow', risk: 风险说明 }
  var DRUG_INTERACTION_RULES = [
    { drugs: ['阿司匹林', '华法林'], level: 'red', risk: '出血风险显著升高' },
    { drugs: ['阿托伐他汀', '西柚汁'], level: 'yellow', risk: '药物浓度升高，增加肌肉副作用风险' },
    { drugs: ['二甲双胍', '酒精'], level: 'red', risk: '乳酸酸中毒风险' },
    { drugs: ['美托洛尔', '维拉帕米'], level: 'red', risk: '严重心动过缓、房室传导阻滞' },
    { drugs: ['硝苯地平', '西柚汁'], level: 'yellow', risk: '降压过度，低血压风险' },
    { drugs: ['氯吡格雷', '奥美拉唑'], level: 'yellow', risk: '氯吡格雷药效降低，血栓风险' },
    { drugs: ['ACE抑制剂', '补钾剂'], level: 'yellow', risk: '高钾血症风险' },
    { drugs: ['地高辛', '胺碘酮'], level: 'red', risk: '地高辛中毒、心律失常风险' },
    { drugs: ['华法林', '抗生素'], level: 'yellow', risk: '凝血功能异常，INR 波动' },
    { drugs: ['格列美脲', '磺胺类'], level: 'red', risk: '严重低血糖风险' },
    // 扩展规则（补充至 20+ 药物覆盖）
    { drugs: ['头孢类', '酒精'], level: 'red', risk: '双硫仑样反应，可危及生命' },
    { drugs: ['甲氨蝶呤', '布洛芬'], level: 'red', risk: '肾毒性增强、骨髓抑制' },
    { drugs: ['华法林', '布洛芬'], level: 'yellow', risk: '出血风险升高' },
    { drugs: ['阿普唑仑', '酒精'], level: 'red', risk: '中枢抑制、呼吸抑制' },
    { drugs: ['阿司匹林', '布洛芬'], level: 'yellow', risk: '阿司匹林抗血小板药效降低，胃肠出血风险' },
    { drugs: ['阿莫西林', '别嘌醇'], level: 'yellow', risk: '皮疹发生率升高' },
    { drugs: ['地高辛', '氢氯噻嗪'], level: 'yellow', risk: '低钾血症诱发地高辛中毒' },
    { drugs: ['左氧氟沙星', '含钙制剂'], level: 'yellow', risk: '影响左氧氟沙星吸收' },
    { drugs: ['雷尼替丁', '酮康唑'], level: 'yellow', risk: '酮康唑吸收减少，药效降低' },
    { drugs: ['缬沙坦', '补钾剂'], level: 'yellow', risk: '高钾血症风险' },
    { drugs: ['胰岛素', '酒精'], level: 'red', risk: '严重低血糖风险' },
    { drugs: ['氯氮平', '卡马西平'], level: 'red', risk: '粒细胞缺乏风险叠加' },
    // 扩展规则（覆盖降压、降糖、降脂、抗凝、心血管等老年慢病常用药）
    { drugs: ['华法林', '氯吡格雷'], level: 'red', risk: '出血风险显著升高，一般不建议联用' },
    { drugs: ['阿司匹林', '氯吡格雷'], level: 'yellow', risk: '出血风险叠加，需评估获益与风险' },
    { drugs: ['比索洛尔', '维拉帕米'], level: 'red', risk: '严重心动过缓、房室传导阻滞' },
    { drugs: ['瑞舒伐他汀', '环孢素'], level: 'red', risk: '横纹肌溶解风险显著升高，禁忌联用' },
    { drugs: ['辛伐他汀', '伊曲康唑'], level: 'red', risk: '横纹肌溶解风险，禁忌联用' },
    { drugs: ['地高辛', '维拉帕米'], level: 'red', risk: '地高辛血药浓度升高，中毒风险' },
    { drugs: ['胰岛素', '美托洛尔'], level: 'yellow', risk: 'β受体阻滞剂可掩盖低血糖心悸症状' },
    { drugs: ['格列美脲', '氟康唑'], level: 'red', risk: '严重低血糖风险' },
    { drugs: ['达格列净', '胰岛素'], level: 'yellow', risk: '低血糖风险升高，需调整胰岛素剂量' },
    { drugs: ['瑞格列奈', '吉非罗齐'], level: 'red', risk: '严重低血糖风险，禁忌联用' },
    { drugs: ['单硝酸异山梨酯', '西地那非'], level: 'red', risk: '致命性低血压，禁忌联用' },
    { drugs: ['硝酸甘油', '西地那非'], level: 'red', risk: '致命性低血压，禁忌联用' },
    { drugs: ['氨氯地平', '辛伐他汀'], level: 'yellow', risk: '辛伐他汀血药浓度升高，肌病风险（辛伐他汀限20mg/日）' },
    { drugs: ['阿司匹林', '酒精'], level: 'yellow', risk: '胃肠出血风险升高' },
    { drugs: ['厄贝沙坦', '补钾剂'], level: 'yellow', risk: '高钾血症风险' },
    { drugs: ['氯沙坦', '补钾剂'], level: 'yellow', risk: '高钾血症风险' }
  ];

  // ============ 药物信息数据库（22 种常用老年慢病药物） ============
  // 字段：generic 通用名 / brand 商品名 / indication 适应症
  //       usage 用法用量 / note 注意事项 / category 药物类别
  // 格式与原 HTML 内 mockData 保持一致，新增 indication 字段。
  var DRUG_DATABASE = [
    // —— 降压药 ——
    { generic: '氨氯地平', brand: '络活喜', indication: '高血压、稳定性心绞痛', usage: '5mg，每日1次，1片（晨服）', note: '常见下肢水肿、面部潮红。不可与西柚汁同服。', category: '钙通道阻滞剂' },
    { generic: '厄贝沙坦', brand: '安博维', indication: '高血压、糖尿病肾病', usage: '150mg，每日1次，1片', note: '孕妇禁用。需监测肾功能和血钾。', category: '血管紧张素II受体拮抗剂' },
    { generic: '缬沙坦', brand: '代文', indication: '高血压、心力衰竭', usage: '80mg，每日1次，1片', note: '孕妇禁用。需监测血钾。', category: '血管紧张素II受体拮抗剂' },
    { generic: '氯沙坦', brand: '科素亚', indication: '高血压、糖尿病肾病保护', usage: '50mg，每日1次，1片', note: '孕妇禁用。需监测血钾和肾功能。', category: '血管紧张素II受体拮抗剂' },
    { generic: '比索洛尔', brand: '康忻', indication: '高血压、冠心病、心力衰竭', usage: '5mg，每日1次，1片（晨服）', note: '不可突然停药。需监测心率、血压。哮喘慎用。', category: 'β受体阻滞剂' },
    { generic: '美托洛尔', brand: '倍他乐克', indication: '高血压、冠心病、心绞痛、心衰', usage: '25mg，每日2次，半片', note: '不可突然停药。需监测心率，心率<55次/分时减量。哮喘慎用。', category: 'β受体阻滞剂' },
    { generic: '硝苯地平', brand: '拜新同', indication: '高血压、心绞痛', usage: '30mg，每日1次，1粒', note: '整粒吞服，不可嚼碎。避免与西柚汁同服。', category: '钙通道阻滞剂' },
    // —— 降糖药 ——
    { generic: '格列美脲', brand: '亚莫利', indication: '2型糖尿病', usage: '2mg，每日1次，1片（早餐前）', note: '注意低血糖反应。肾功能不全慎用。', category: '磺脲类降糖药' },
    { generic: '瑞格列奈', brand: '诺和龙', indication: '2型糖尿病', usage: '0.5mg，每日3次，餐前15分钟', note: '餐前服用，不进餐不服药。注意低血糖。', category: '格列奈类降糖药' },
    { generic: '达格列净', brand: '安达唐', indication: '2型糖尿病、心力衰竭', usage: '10mg，每日1次，1片（晨服）', note: '多饮水，注意泌尿生殖道感染。老年人需关注脱水。', category: 'SGLT2抑制剂' },
    { generic: '胰岛素', brand: '诺和灵', indication: '糖尿病（1型、2型）', usage: '遵医嘱，皮下注射，剂量个体化', note: '注意低血糖。注射部位轮换。冷藏保存，不可冷冻。', category: '胰岛素类' },
    { generic: '二甲双胍', brand: '格华止', indication: '2型糖尿病（一线用药）', usage: '500mg，每日2次，1片（随餐服用）', note: '需随餐服用以减少胃肠道反应。造影检查前后需停药。', category: '双胍类降糖药' },
    // —— 降脂药 ——
    { generic: '瑞舒伐他汀', brand: '可定', indication: '高胆固醇血症、心血管疾病预防', usage: '10mg，每日1次，1片（睡前服用）', note: '注意肌肉酸痛、肝功能异常。避免与环孢素合用。', category: '他汀类降脂药' },
    { generic: '辛伐他汀', brand: '舒降之', indication: '高胆固醇血症、心血管疾病预防', usage: '20mg，每日1次，1片（睡前服用）', note: '避免与伊曲康唑、克拉霉素合用。注意肌肉酸痛。', category: '他汀类降脂药' },
    { generic: '阿托伐他汀', brand: '立普妥', indication: '高胆固醇血症、心血管疾病预防', usage: '20mg，每日1次，1片（睡前服用）', note: '避免与西柚汁同服。注意肌肉酸痛、肝功能。', category: '他汀类降脂药' },
    // —— 抗凝/抗血小板药 ——
    { generic: '华法林', brand: '可密定', indication: '血栓性疾病（房颤、心脏瓣膜置换术后等）', usage: '遵医嘱，按INR调整剂量，通常2.5-5mg/日', note: '需定期监测INR（目标2-3）。注意出血征象。饮食维生素K摄入需稳定。', category: '香豆素类抗凝药' },
    { generic: '阿司匹林', brand: '拜阿司匹灵', indication: '心脑血管疾病预防（抗血小板）', usage: '100mg，每日1次，1片（空腹，饭前30分钟）', note: '肠溶片需空腹服用以保护胃黏膜。注意胃肠出血、溃疡。有出血倾向者慎用。', category: '抗血小板药' },
    { generic: '氯吡格雷', brand: '波立维', indication: '心脑血管疾病预防（近期心梗、支架术后）', usage: '75mg，每日1次，1片', note: '注意出血风险。避免与奥美拉唑合用。', category: '抗血小板药' },
    // —— 心血管 ——
    { generic: '地高辛', brand: '可力', indication: '心力衰竭、心房颤动', usage: '0.125-0.25mg，每日1次，1片', note: '需监测血药浓度、血钾。出现恶心、黄视需警惕中毒。', category: '强心苷类' },
    { generic: '硝酸甘油', brand: '保欣宁', indication: '心绞痛急性发作', usage: '0.5mg舌下含服，发作时使用', note: '舌下含服，坐位使用。避光、防热保存。开封后6个月更换。', category: '硝酸酯类' },
    { generic: '单硝酸异山梨酯', brand: '欣康', indication: '冠心病、心绞痛预防', usage: '20mg，每日2次，1片', note: '可能引起头痛、低血压。避免与西地那非合用。', category: '硝酸酯类' },
    // —— 其他 ——
    { generic: '奥美拉唑', brand: '洛赛克', indication: '胃溃疡、反流性食管炎', usage: '20mg，每日1次，1片（晨空腹）', note: '长期使用注意骨质疏松、低镁血症。影响氯吡格雷活化。', category: '质子泵抑制剂' }
  ];

  // ============ 规则2：紧急症状关键词表 ============
  // 6 大类，共 60+ 关键词；包含常见方言表达。
  // 分两级：
  //   - level=red：立即拨打 120（胸痛/呼吸困难/严重出血/意识障碍等）
  //   - level=yellow：建议尽快就诊（黑便/急性腹痛/偏瘫/吞咽困难/晕厥等，需数小时内就医）
  var EMERGENCY_KEYWORDS = {
    // 心血管类（含方言：心口痛=胸痛，心口闷=胸闷）—— 立即120
    cardiovascular: [
      '胸痛', '胸闷', '心悸', '心慌', '心口痛', '心口闷', '心绞痛',
      '胸口发紧', '心脏骤停', '心跳骤停'
    ],
    // 呼吸类（含方言：喘不上气=呼吸困难，气不够用=气短）—— 立即120
    respiratory: [
      '呼吸困难', '气喘', '喘不上气', '呼吸急促', '窒息感',
      '喘息', '气短', '憋气', '喉咙紧缩', '气不够用'
    ],
    // 神经类（含方言：口眼歪斜/嘴角歪斜=中风症状）—— 立即120
    neurological: [
      '意识模糊', '头晕目眩', '说话不清', '肢体麻木', '半身不遂', '突然昏迷',
      '口眼歪斜', '面瘫', '嘴角歪斜', '四肢无力', '站立不稳', '视物模糊',
      '偏瘫', '单侧无力', '吞咽困难', '言语含糊'
    ],
    // 头痛类（含方言：头要炸开=剧烈头痛）—— 立即120
    headache: [
      '剧烈头痛', '头痛欲裂', '爆裂样头痛',
      '雷击样头痛', '头要炸开'
    ],
    // 出血类 —— 立即120
    bleeding: [
      '大量出血', '呕血', '咯血', '便血', '尿血',
      '阴道大出血', '鼻血不止', '伤口喷血'
    ],
    // 消化道/其他急症 —— 建议尽快就诊（含致命症状补充）
    // 黑便/急性腹痛可能预示消化道出血、急腹症，需数小时内就医
    other: [
      '持续高烧', '抽搐', '癫痫发作', '高热惊厥',
      '过敏休克', '喉咙肿胀', '全身皮疹',
      // —— 致命症状补充（医学专家审核）——
      '黑便', '柏油样便', '大便发黑',         // 消化道出血
      '急性腹痛', '剧烈腹痛', '腹部剧痛',       // 急腹症
      '晕厥', '突然晕倒', '短暂意识丧失',       // 脑供血不足/心律失常
      '持续呕吐', '喷射性呕吐'                  // 颅内压增高
    ]
  };

  // 症状级别映射（哪些关键词触发立即120，哪些是建议尽快就诊）
  // 默认所有匹配的关键词都触发 LEVEL_RED（硬中断）
  // yellow 级别的关键词单独列出，便于 UI 区分提示文案
  var YELLOW_LEVEL_KEYWORDS = {
    // 这些症状严重但非立即致命，建议数小时内就诊
    '黑便': '消化道出血可能，建议尽快就诊',
    '柏油样便': '消化道出血可能，建议尽快就诊',
    '大便发黑': '消化道出血可能，建议尽快就诊',
    '急性腹痛': '急腹症可能，建议尽快就诊',
    '剧烈腹痛': '急腹症可能，建议尽快就诊',
    '腹部剧痛': '急腹症可能，建议尽快就诊',
    '晕厥': '建议尽快就诊排查心脑原因',
    '突然晕倒': '建议尽快就诊排查心脑原因',
    '短暂意识丧失': '建议尽快就诊排查心脑原因',
    '吞咽困难': '建议尽快就诊排查食管/神经原因',
    '偏瘫': '中风可能，建议立即拨打120',
    '单侧无力': '中风可能，建议立即拨打120',
    '持续呕吐': '建议尽快就诊',
    '喷射性呕吐': '颅内压增高可能，建议尽快就诊'
  };

  // 方言-标准症状对照表（用于在提示信息中给出规范名称）
  // 注意：这是引擎内置的基础方言映射（9条），用于紧急症状检测。
  // D8增强：通过 loadExternalDialectMap() 从全局 DIALECT_MAP 数组（dialect-map.js 171条）加载完整映射。
  var DIALECT_MAP = {
    '心口痛': '胸痛',
    '心口闷': '胸闷',
    '喘不上气': '呼吸困难',
    '气不够用': '气短',
    '头要炸开': '剧烈头痛',
    '雷击样头痛': '剧烈头痛',
    '口眼歪斜': '中风症状',
    '嘴角歪斜': '中风症状',
    '爆裂样头痛': '剧烈头痛'
  };

  // D8: 从全局 DIALECT_MAP 数组（dialect-map.js）加载完整方言映射
  // 合并到内置 DIALECT_MAP 对象中，增强紧急症状检测的方言覆盖
  var externalDialectLoaded = false;
  function loadExternalDialectMap() {
    if (externalDialectLoaded) return;
    // 兼容浏览器全局和 Node.js global
    var globalMap = (typeof window !== 'undefined' && window.DIALECT_MAP) ||
                    (typeof global !== 'undefined' && global.DIALECT_MAP);
    if (!globalMap || !Array.isArray(globalMap)) return;

    globalMap.forEach(function (entry) {
      if (entry && entry.original && entry.standard) {
        // 仅在不存在时添加，避免覆盖内置映射
        if (!DIALECT_MAP[entry.original]) {
          DIALECT_MAP[entry.original] = entry.standard;
        }
      }
    });
    externalDialectLoaded = true;
  }

  // D8: 检测文本中的方言词汇，返回匹配到的方言映射列表
  // 数据来源：全局 DIALECT_MAP 数组（dialect-map.js 171条）
  function checkDialectTerms(text) {
    if (!text || typeof text !== 'string') return { matched: [], count: 0 };

    // 确保已加载外部方言映射
    loadExternalDialectMap();

    var globalMap = (typeof window !== 'undefined' && window.DIALECT_MAP) ||
                    (typeof global !== 'undefined' && global.DIALECT_MAP);
    if (!globalMap || !Array.isArray(globalMap)) return { matched: [], count: 0 };

    var matched = [];
    var seen = {}; // 按 original 去重

    globalMap.forEach(function (entry) {
      if (entry && entry.original && entry.standard && text.indexOf(entry.original) !== -1) {
        var key = entry.dialect + ':' + entry.original;
        if (!seen[key]) {
          seen[key] = true;
          matched.push({
            dialect: entry.dialect,
            original: entry.original,
            standard: entry.standard,
            category: entry.category || '其他'
          });
        }
      }
    });

    return { matched: matched, count: matched.length };
  }

  // ============ 规则3：置信度阈值 ============
  var CONF_THRESHOLD_RED = 65;     // < 65 红色
  var CONF_THRESHOLD_YELLOW = 85;  // 65-84 黄色，>=85 绿色
  // 关键字段（任一低于阈值即红色硬中断）
  var CRITICAL_FIELDS = ['diagnosis', 'medication', 'medicationRule'];

  // ============ 工具函数 ============

  /**
   * 规范化药物名称输入，统一返回字符串数组。
   * 支持：['阿司匹林'] / [{name:'阿司匹林'}] / '阿司匹林，华法林' 等多种格式。
   */
  function normalizeMedications(medications) {
    if (!medications) return [];
    var arr = [];
    if (Array.isArray(medications)) {
      medications.forEach(function (item) {
        if (item == null) return;
        if (typeof item === 'string') {
          arr.push(item);
        } else if (typeof item === 'object') {
          // 支持 { name: '阿司匹林' } 或 { drugName: '阿司匹林' } 等常见字段
          var name = item.name || item.drugName || item.drug || item.medicine;
          if (name) arr.push(String(name));
        }
      });
    } else if (typeof medications === 'string') {
      // 字符串：按中文/英文逗号、顿号、分号、空格切分
      medications.split(/[,，、;；\s]+/).forEach(function (s) {
        s = s.trim();
        if (s) arr.push(s);
      });
    }
    return arr;
  }

  /**
   * 取两条规则命中时更高的级别。
   */
  function higherLevel(a, b) {
    if (a === LEVEL_RED || b === LEVEL_RED) return LEVEL_RED;
    if (a === LEVEL_YELLOW || b === LEVEL_YELLOW) return LEVEL_YELLOW;
    return LEVEL_GREEN;
  }

  // ============ 规则1：药物禁忌检测 ============

  /**
   * 检查药物禁忌。
   * @param {Array|string} medications 药物列表
   * @returns {{ level: 'green'|'yellow'|'red', message: string, details: Array }}
   */
  function checkDrugInteraction(medications) {
    var meds = normalizeMedications(medications);
    var details = [];
    var level = LEVEL_GREEN;

    if (meds.length < 2) {
      return {
        level: LEVEL_GREEN,
        message: '药物数量不足，未发现禁忌组合',
        details: details
      };
    }

    // 将药物名转为小写比较集合，便于大小写不敏感匹配
    var medSet = meds.map(function (m) { return m.toLowerCase(); });
    var medOriginalMap = {};
    meds.forEach(function (m) { medOriginalMap[m.toLowerCase()] = m; });

    DRUG_INTERACTION_RULES.forEach(function (rule) {
      var ruleDrugs = rule.drugs.map(function (d) { return d.toLowerCase(); });
      // 检查规则中的所有药物是否都出现在用户药物列表中
      var allPresent = ruleDrugs.every(function (d) {
        return medSet.indexOf(d) !== -1;
      });
      if (allPresent) {
        var displayDrugs = rule.drugs.join(' + ');
        details.push({
          drugs: displayDrugs,
          level: rule.level,
          risk: rule.risk
        });
        level = higherLevel(level, rule.level);
      }
    });

    var message;
    if (level === LEVEL_RED) {
      message = '检测到严重药物禁忌，已触发硬中断';
    } else if (level === LEVEL_YELLOW) {
      message = '检测到药物相互作用提示，请谨慎用药';
    } else {
      message = '未检测到药物禁忌';
    }

    return {
      level: level,
      message: message,
      details: details
    };
  }

  // ============ 药物信息查询 ============

  /**
   * 查询药物信息。
   * 支持按通用名（generic）或商品名（brand）查询，大小写不敏感。
   * 返回结果包含药物信息及该药物相关的相互作用警告列表。
   * @param {string} name 药物名称（通用名或商品名）
   * @returns {{ drug: Object, interactions: Array }|null}
   *   interactions: [{ with, level, risk }] 与该药物有相互作用的药品及风险说明
   */
  function queryDrug(name) {
    if (!name || typeof name !== 'string') return null;
    var lower = name.trim().toLowerCase();
    if (!lower) return null;

    // 按通用名或商品名查找（大小写不敏感）
    var drug = null;
    for (var i = 0; i < DRUG_DATABASE.length; i++) {
      var d = DRUG_DATABASE[i];
      if (d.generic.toLowerCase() === lower || d.brand.toLowerCase() === lower) {
        drug = d;
        break;
      }
    }
    if (!drug) return null;

    // 查找所有涉及该药物的相互作用规则
    var interactions = [];
    DRUG_INTERACTION_RULES.forEach(function (rule) {
      var hit = false;
      var otherDrug = null;
      // 规则中的药物名可能与本药的通用名或商品名匹配
      if (rule.drugs[0] === drug.generic || rule.drugs[0] === drug.brand) {
        hit = true;
        otherDrug = rule.drugs[1];
      } else if (rule.drugs[1] === drug.generic || rule.drugs[1] === drug.brand) {
        hit = true;
        otherDrug = rule.drugs[0];
      }
      if (hit) {
        interactions.push({
          with: otherDrug,
          level: rule.level,
          risk: rule.risk
        });
      }
    });

    return {
      drug: drug,
      interactions: interactions
    };
  }

  // ============ 规则2：紧急症状检测 ============

  /**
   * 检查文本中是否包含紧急症状关键词。
   * @param {string} text 待检测文本
   * @returns {{ level: 'green'|'yellow'|'red', message: string, matchedKeywords: Array, suggestion: string }}
   *   level=red：立即拨打120；level=yellow：建议尽快就诊
   */
  function checkEmergencySymptoms(text) {
    var matchedKeywords = [];
    var level = LEVEL_GREEN;
    var message;
    var suggestion = '';

    if (!text || typeof text !== 'string') {
      return {
        level: LEVEL_GREEN,
        message: '无文本输入',
        matchedKeywords: matchedKeywords,
        suggestion: suggestion
      };
    }

    // D8: 加载完整方言映射表（171条），增强方言症状检测
    loadExternalDialectMap();

    // 遍历所有分类下的关键词
    Object.keys(EMERGENCY_KEYWORDS).forEach(function (category) {
      EMERGENCY_KEYWORDS[category].forEach(function (keyword) {
        if (text.indexOf(keyword) !== -1) {
          var standard = DIALECT_MAP[keyword] || keyword;
          // 判断该关键词是否属于 yellow 级别（建议尽快就诊）
          var isYellow = YELLOW_LEVEL_KEYWORDS.hasOwnProperty(keyword);
          matchedKeywords.push({
            keyword: keyword,
            category: category,
            standard: standard,
            isDialect: !!DIALECT_MAP[keyword],
            severity: isYellow ? 'yellow' : 'red'
          });
        }
      });
    });

    if (matchedKeywords.length > 0) {
      // 确定整体级别：任一 red 关键词即整体 red，否则 yellow
      var hasRed = matchedKeywords.some(function(k) { return k.severity === 'red'; });
      level = hasRed ? LEVEL_RED : LEVEL_YELLOW;

      // 去重展示
      var uniqueKeywords = [];
      var seen = {};
      matchedKeywords.forEach(function (item) {
        if (!seen[item.keyword]) {
          seen[item.keyword] = true;
          uniqueKeywords.push(item.keyword);
        }
      });

      if (level === LEVEL_RED) {
        message = '检测到紧急症状关键词：' + uniqueKeywords.join('、') + '，请立即就医';
        suggestion = '🚨 建议立即拨打 120';
      } else {
        message = '检测到需关注症状：' + uniqueKeywords.join('、');
        // 收集 yellow 级别的建议
        var suggestions = [];
        matchedKeywords.forEach(function(item) {
          if (item.severity === 'yellow' && YELLOW_LEVEL_KEYWORDS[item.keyword]) {
            suggestions.push(YELLOW_LEVEL_KEYWORDS[item.keyword]);
          }
        });
        suggestion = suggestions.length > 0 ? '⏰ ' + suggestions[0] : '⏰ 建议尽快就诊';
      }
    } else {
      message = '未检测到紧急症状';
    }

    return {
      level: level,
      message: message,
      matchedKeywords: matchedKeywords,
      suggestion: suggestion
    };
  }

  // ============ 规则3：置信度分级 ============

  /**
   * 计算置信度分级。
   * @param {number} overallConfidence 整体置信度（0-100）
   * @param {Object} fieldConfidences 字段置信度对象 { diagnosis, medication, medicationRule, ... }
   * @returns {{ level: 'green'|'yellow'|'red', message: string }}
   */
  function checkConfidence(overallConfidence, fieldConfidences) {
    var level = LEVEL_GREEN;
    var reasons = [];

    // 整体置信度判断
    var overall = Number(overallConfidence);
    if (isNaN(overall)) overall = 0;

    if (overall < CONF_THRESHOLD_RED) {
      level = LEVEL_RED;
      reasons.push('整体置信度 ' + overall + '% 低于 ' + CONF_THRESHOLD_RED + '%');
    } else if (overall < CONF_THRESHOLD_YELLOW) {
      level = LEVEL_YELLOW;
      reasons.push('整体置信度 ' + overall + '% 处于 ' + CONF_THRESHOLD_RED + '%-' + (CONF_THRESHOLD_YELLOW - 1) + '% 区间');
    }

    // 关键字段置信度判断
    if (fieldConfidences && typeof fieldConfidences === 'object') {
      CRITICAL_FIELDS.forEach(function (field) {
        var val = fieldConfidences[field];
        if (val == null) return;
        val = Number(val);
        if (isNaN(val)) return;
        if (val < CONF_THRESHOLD_RED) {
          level = LEVEL_RED;
          var fieldName = getFieldDisplayName(field);
          reasons.push('关键字段【' + fieldName + '】置信度 ' + val + '% 低于 ' + CONF_THRESHOLD_RED + '%');
        }
      });
    }

    var message;
    if (level === LEVEL_RED) {
      message = '置信度过低，已触发硬中断：' + reasons.join('；');
    } else if (level === LEVEL_YELLOW) {
      message = '置信度提示：' + reasons.join('；');
    } else {
      message = '置信度正常（' + overall + '%）';
    }

    return {
      level: level,
      message: message
    };
  }

  /**
   * 字段名中文显示映射。
   */
  function getFieldDisplayName(field) {
    var map = {
      diagnosis: '诊断',
      medication: '药物',
      medicationRule: '用药规则'
    };
    return map[field] || field;
  }

  // ============ 综合安全检查 ============

  /**
   * 综合安全检查，汇总三条 P0 规则的结果。
   * @param {Object} data
   *   { medications, text, overallConfidence, fieldConfidences }
   * @returns {{ level: 'green'|'yellow'|'red', messages: Array, shouldBlock: boolean }}
   */
  function runSafetyCheck(data) {
    data = data || {};
    var messages = [];
    var level = LEVEL_GREEN;

    // 规则1：药物禁忌
    if (data.medications) {
      var drugResult = checkDrugInteraction(data.medications);
      if (drugResult.level !== LEVEL_GREEN) {
        messages.push({
          rule: 'drugInteraction',
          level: drugResult.level,
          message: drugResult.message,
          details: drugResult.details
        });
        level = higherLevel(level, drugResult.level);
      }
    }

    // 规则2：紧急症状
    if (data.text) {
      var emerResult = checkEmergencySymptoms(data.text);
      if (emerResult.level !== LEVEL_GREEN) {
        messages.push({
          rule: 'emergencySymptoms',
          level: emerResult.level,
          message: emerResult.message,
          matchedKeywords: emerResult.matchedKeywords
        });
        level = higherLevel(level, emerResult.level);
      }
    }

    // 规则3：置信度分级
    if (data.overallConfidence != null || data.fieldConfidences) {
      var confResult = checkConfidence(data.overallConfidence, data.fieldConfidences);
      if (confResult.level !== LEVEL_GREEN) {
        messages.push({
          rule: 'confidence',
          level: confResult.level,
          message: confResult.message
        });
        level = higherLevel(level, confResult.level);
      }
    }

    // shouldBlock=true 时前端必须弹窗阻断用户操作
    var shouldBlock = (level === LEVEL_RED);

    return {
      level: level,
      messages: messages,
      shouldBlock: shouldBlock
    };
  }

  // ============ 等级展示工具 ============

  /**
   * 获取安全等级对应的颜色（用于 UI 渲染）。
   */
  function getLevelColor(level) {
    return LEVEL_COLOR_MAP[level] || LEVEL_COLOR_MAP.green;
  }

  /**
   * 获取安全等级对应的中文文案。
   */
  function getLevelText(level) {
    return LEVEL_TEXT_MAP[level] || LEVEL_TEXT_MAP.green;
  }

  // ============ 暴露 API ============
  window.SafetyEngine = {
    checkDrugInteraction: checkDrugInteraction,
    checkEmergencySymptoms: checkEmergencySymptoms,
    checkConfidence: checkConfidence,
    runSafetyCheck: runSafetyCheck,
    queryDrug: queryDrug,
    getLevelColor: getLevelColor,
    getLevelText: getLevelText,
    // D8: 新增方言词汇检测API
    checkDialectTerms: checkDialectTerms,
    // 暴露规则数据，便于调试与单元测试
    _rules: {
      drugInteractionRules: DRUG_INTERACTION_RULES,
      drugDatabase: DRUG_DATABASE,
      emergencyKeywords: EMERGENCY_KEYWORDS,
      dialectMap: DIALECT_MAP,
      criticalFields: CRITICAL_FIELDS,
      thresholds: {
        red: CONF_THRESHOLD_RED,
        yellow: CONF_THRESHOLD_YELLOW
      }
    }
  };
})();
