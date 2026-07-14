/**
 * 暖归 RAG 回答生成器
 * 基于检索结果 + 模板化生成 + 引用溯源
 * 比赛 Demo 用：可视化 RAG 流程、展示置信度、防止幻觉
 *
 * 生产环境：替换为真实 LLM API（OpenAI / Qwen / DeepSeek / 文心）
 *           + Function Calling + 引用标注
 *
 * 回答结构：共情开头 → 法律依据/案例参考 → 通俗解释 → 实操建议 → 风险提示 → 温暖结尾
 */

(function() {
  'use strict';

  // 类别到友好名的映射
  const CATEGORY_LABEL = {
    '离婚程序': '离婚程序',
    '诉讼离婚': '诉讼离婚',
    '协议离婚': '协议离婚',
    '财产分割': '财产分割',
    '子女抚养': '子女抚养',
    '家暴维权': '家暴维权',
    '彩礼纠纷': '彩礼纠纷',
    '离婚协议': '离婚协议',
    '起诉状': '起诉状',
    '保护令申请': '人身安全保护令',
    '离婚赔偿': '离婚损害赔偿',
    '债务纠纷': '夫妻债务',
    '婚内财产': '婚内财产约定',
    '忠诚义务': '忠诚义务',
    '婚姻撤销': '婚姻撤销',
    '婚姻无效': '婚姻无效',
    '债务问题': '债务问题',
    '求助资源': '求助资源',
    '夫妻关系': '夫妻关系'
  };

  /**
   * 计算置信度（基于检索分数归一化）
   */
  function calcConfidence(topResults) {
    if (!topResults || topResults.length === 0) return 0;
    const top = topResults[0];
    // 简单归一化：分数越高置信度越高
    const raw = Math.min(top.relevanceScore / 2, 1);
    return Math.max(0.3, Math.min(0.99, raw));
  }

  // ========================================================================
  // 问题类型检测（用于匹配共情开头）
  // ========================================================================
  const QUESTION_TYPE_KEYWORDS = [
    { type: '家暴', words: ['家暴', '家庭暴力', '殴打', '打我', '被打', '暴力', '保护令', '恐吓', '威胁', '人身安全'] },
    { type: '离婚', words: ['离婚', '婚姻', '感情破裂', '分手', '不想过', '想离', '婚姻关系'] },
    { type: '财产', words: ['财产', '房子', '房产', '存款', '车辆', '股权', '分割', '分财产', '共同财产', '婚前财产', '彩礼', '嫁妆'] },
    { type: '抚养', words: ['抚养', '孩子', '子女', '抚养权', '探望', '探视', '抚养费', '变更抚养'] },
    { type: '债务', words: ['债务', '欠款', '借款', '贷款', '共同债务', '还钱', '信用卡'] },
    { type: '赔偿', words: ['赔偿', '补偿', '损害', '过错', '出轨', '同居', '重婚'] }
  ];

  function detectQuestionType(query) {
    if (!query) return '通用';
    const q = String(query);
    // 按优先级匹配：家暴优先级最高（涉及人身安全）
    const order = ['家暴', '抚养', '财产', '债务', '赔偿', '离婚'];
    for (const type of order) {
      const entry = QUESTION_TYPE_KEYWORDS.find(e => e.type === type);
      if (entry && entry.words.some(w => q.indexOf(w) >= 0)) {
        return type;
      }
    }
    return '通用';
  }

  // ========================================================================
  // 共情开头：根据问题类型匹配
  // ========================================================================
  const EMPATHY_OPENINGS = {
    '家暴': [
      '您能主动寻求帮助，这本身就是很勇敢的一步。面对家庭暴力，您不是一个人在战斗，法律会站在您这一边。',
      '看到您的问题，我首先想说的是：无论发生什么，您的人身安全是最重要的。家暴不是您的错，法律有明确的保护措施。'
    ],
    '离婚': [
      '面对婚姻的重大决定，感到犹豫和不安是很正常的。我理解您此刻可能有很多顾虑，让我们一起来看看法律是怎么规定的。',
      '婚姻走到这一步，一定经历了不少纠结。您愿意主动了解自己的权益，已经是迈向清晰的重要一步了。'
    ],
    '财产': [
      '财产分割是离婚中最容易产生分歧的问题，您的担忧完全可以理解。我帮您梳理一下法律是怎么规定的，以及您该怎么保护自己的权益。',
      '涉及到钱的事，谨慎一些是对的。很多人在这个环节都会感到焦虑，让我们一项一项来看，把该属于您的部分都理清楚。'
    ],
    '抚养': [
      '孩子的利益是法律最优先考虑的，您的这份关切我完全理解。让我们看看法律是怎么规定的，以及您怎样才能给孩子最好的安排。',
      '作为父母，最放不下的就是孩子。您能主动了解法律规定，是为了给孩子一个更稳妥的安排，这很不容易。'
    ],
    '债务': [
      '债务问题往往牵扯着感情和金钱两方面的纠葛，您的担心我理解。我帮您看看法律对夫妻债务是怎么认定的，哪些该担、哪些不该担。',
      '一涉及到债务，人就特别容易焦虑。别急，法律对夫妻共同债务有明确的边界，我们一步步来厘清。'
    ],
    '赔偿': [
      '在婚姻中受到伤害，想要一个公道是人之常情。我理解您此刻的心情，让我们看看法律对离婚损害赔偿是怎么规定的。',
      '被最亲近的人伤害，这种痛只有自己最清楚。您愿意了解法律途径维权，是很有力量的选择。'
    ],
    '通用': [
      '我理解您此刻可能有很多疑问，主动了解法律是保护自己的第一步。让我根据检索到的信息为您梳理一下。',
      '感谢您的信任。婚姻家庭的问题往往错综复杂，我帮您把相关法律规定梳理清楚，让您心里有个底。'
    ]
  };

  function getEmpathyOpening(query, category) {
    const qType = detectQuestionType(query);
    const pool = EMPATHY_OPENINGS[qType] || EMPATHY_OPENINGS['通用'];
    // 基于 query 长度稳定选择一条，避免每次刷新都变
    const idx = (query || '').length % pool.length;
    return pool[idx];
  }

  // ========================================================================
  // 实操建议库：根据 category 预设 + query 关键词映射
  // ========================================================================
  const PRACTICAL_ADVICE = {
    '离婚程序': [
      '**协议离婚路径**：双方携带身份证、户口本、结婚证、离婚协议书，共同到一方户籍所在地的婚姻登记机关办理。',
      '**时间预估**：申请 → 30天冷静期 → 30天内双方共同领证，整个流程约 31~60 天。任一环节缺席都会导致程序终止。',
      '**诉讼离婚路径**：若协议不成，可向被告住所地基层法院起诉，准备起诉状、结婚证、感情破裂证据等材料，简易程序 3 个月、普通程序 6 个月内审结。'
    ],
    '协议离婚': [
      '**所需材料**：双方身份证、户口本、结婚证原件、2 寸近期免冠照片各 2 张、离婚协议书（一式三份）。',
      '**办理地点**：一方户籍所在地的民政局婚姻登记处，需双方亲自到场，不能委托他人代办。',
      '**关键时间节点**：先申请登记 → 进入 30 天冷静期 → 冷静期满后 30 天内双方共同到场领证，逾期视为撤回。'
    ],
    '诉讼离婚': [
      '**管辖法院**：一般向被告住所地（户籍地或经常居住地满 1 年）基层人民法院起诉。',
      '**必备材料**：民事起诉状（一式两份）、结婚证、双方身份信息、感情破裂证据（如分居证明、家暴报警记录、出轨证据等）。',
      '**程序提示**：第一次起诉若被告不同意离婚且无硬性证据，法院可能判不准离婚；判决生效后 6 个月可再次起诉，或分居满 1 年再次起诉应当准予。'
    ],
    '财产分割': [
      '**证据收集清单**：房产证、车辆登记证、银行流水（近 2 年）、工资条、公积金账户、股权/基金账户、保单、支付宝/微信账单等。',
      '**注意时间节点**：若怀疑对方转移财产，重点核查起诉前 1~2 年的大额异常转出；离婚诉讼中可申请法院调查令调取对方银行流水。',
      '**隐藏转移财产的后果**：若发现一方隐藏、转移、变卖、毁损夫妻共同财产，分割时可少分或不分；离婚后发现的，可另行起诉再次分割。'
    ],
    '子女抚养': [
      '**协商优先**：建议父母先就抚养权、抚养费、探望方案达成书面约定，最大程度减少对孩子的影响。',
      '**法院考量因素**：孩子年龄（2 周岁内原则上随母方）、双方经济条件、抚养能力、生活环境、孩子意愿（8 周岁以上会听取）、一方是否有不宜抚养的情形（如家暴、恶习）。',
      '**抚养费标准**：一般按不直接抚养一方月收入的 20%~30% 给付，负担两个以上子女的可提高但不超过 50%，可一次性或按月支付。'
    ],
    '父母子女关系': [
      '**抚养费支付**：抚养费应定期给付，有条件的可一次性给付。给付期限一般至子女十八周岁为止。',
      '**抚养费变更**：原定抚养费数额不足以维持当地实际生活水平，或因子女患病、上学实际需要已超过原定数额的，可请求增加抚养费。',
      '**探望权保障**：不直接抚养子女的一方有探望子女的权利，另一方有协助义务。探望方式、时间由双方协议；协议不成的，由法院判决。',
      '**亲子关系确认**：对亲子关系有异议且有正当理由的，父或母可向法院提起诉讼请求确认或否认亲子关系。'
    ],
    '家暴维权': [
      '**紧急情况**：第一时间拨打 110 报警，要求警方出具《出警记录》或《告诫书》，这是最有力的家暴证据。',
      '**证据收集**：报警记录、伤情照片（建议附时间戳）、医院诊断证明、伤情鉴定、家暴视频/录音、证人证言、加害人写的保证书或悔过书、社区/妇联的调解记录。',
      '**求助渠道**：可拨打 12338 妇女维权热线、向居住地妇联求助、申请人身安全保护令（无需立案，72 小时内裁定，紧急情况 24 小时内）。',
      '**自我保护**：提前准备应急包（身份证、银行卡、手机、孩子证件），告知可信的亲友或邻居，必要时携子女临时住到安全地点。'
    ],
    '彩礼纠纷': [
      '**退还条件**：未办理结婚登记、已登记但未共同生活、或给付彩礼导致给付方生活困难的，可请求返还；已共同生活但时间较短的，法院会根据情况酌情返还。',
      '**证据收集**：转账记录、彩礼清单、媒人证言、婚礼收支记录、双方共同生活时长的证据（如租房合同、物业记录）。',
      '**注意**：恋爱中的小额赠与（如 520、1314 红包、节日礼物）一般认定为一般性赠与，不属彩礼，无需返还。'
    ],
    '离婚协议': [
      '**必备条款**：双方自愿离婚的意思表示、子女抚养安排（抚养权、抚养费、探望）、财产分割清单、债务承担约定、违约责任。',
      '**填写要点**：财产要列明具体信息（如房产地址+产权证号、车辆车牌号、银行账号），抚养费要写明金额、支付方式、支付期限，探望权要写明频次和方式。',
      '**特别注意**：协议一经登记备案即生效，事后反悔很难推翻（除非能证明存在欺诈、胁迫），签字前建议请律师审阅。'
    ],
    '起诉状': [
      '**写作要点**：原告/被告基本信息要准确（姓名、身份证号、住址、联系方式），诉讼请求要具体明确（如"判决离婚""抚养权归原告""分割某房产"），事实与理由要按时间脉络写清楚。',
      '**提交方式**：向管辖法院立案庭提交起诉状（按被告人数+1 份）、证据清单及复印件、原告身份证明，可现场立案也可通过"人民法院在线服务"网上立案。',
      '**提示**：诉讼请求的金额要合理，过高可能承担更高的诉讼费；事实陈述要客观，避免情绪化用语影响法官观感。'
    ],
    '保护令申请': [
      '**申请条件**：遭受家庭暴力或面临家庭暴力现实危险时，当事人可向法院申请人身安全保护令，无需先起诉离婚。',
      '**所需材料**：申请书（写明请求、事实、证据）、身份证明、家暴证据（报警记录、伤情照片、医院诊断、证人证言等）。',
      '**管辖与流程**：向申请人或被申请人居住地、家庭暴力发生地的基层法院申请；法院 72 小时内作出裁定，紧急情况 24 小时内；保护令有效期不超过 6 个月，可申请撤销、变更或延长。'
    ],
    '离婚赔偿': [
      '**适用情形**：对方有重婚、与他人同居、实施家庭暴力、虐待遗弃家庭成员、其他重大过错（如严重出轨）的，无过错方可请求损害赔偿。',
      '**举证要点**：重婚/同居需有共同居住、以夫妻名义生活的证据；家暴需报警记录、伤情鉴定；出轨需聊天记录、共同出行记录、酒店入住记录等。',
      '**金额参考**：法律未规定具体标准，法院综合考虑过错程度、损害后果、当地经济水平等因素，一般几万到几十万不等。'
    ],
    '债务纠纷': [
      '**共同债务认定**：双方共同签字、一方事后追认、或一方为家庭日常生活需要所负的债务，属于共同债务。',
      '**个人债务边界**：一方以个人名义超出家庭日常生活需要所负的债务，原则上属于个人债务，除非债权人能证明用于夫妻共同生活/经营。',
      '**举证建议**：收集借款用途证据（银行流水、消费凭证）、是否用于家庭生活的证据、是否双方知情同意的证据。'
    ],
    '债务问题': [
      '**共同债务认定**：双方共同签字、一方事后追认、或一方为家庭日常生活需要所负的债务，属于共同债务。',
      '**个人债务边界**：一方以个人名义超出家庭日常生活需要所负的债务，原则上属于个人债务，除非债权人能证明用于夫妻共同生活/经营。',
      '**举证建议**：收集借款用途证据（银行流水、消费凭证）、是否用于家庭生活的证据、是否双方知情同意的证据。'
    ],
    '婚内财产': [
      '**约定形式**：必须采用书面形式，建议对协议进行公证以增强效力。',
      '**约定内容**：可约定婚前财产、婚内所得归各自所有、共同所有或部分各自部分共同，可约定债务承担方式。',
      '**对外效力**：财产约定归各自所有的，夫或妻一方对外所负债务，相对人知道该约定的，以个人财产清偿——因此建议保留相对人"知情"的证据。'
    ],
    '忠诚义务': [
      '**忠诚协议效力**：法院对忠诚协议的效力态度不一，纯粹的"净身出户"条款多不被支持，但可作为过错证据在财产分割时主张照顾。',
      '**举证建议**：出轨证据（聊天记录、开房记录、共同出行记录、亲密照片/视频）、与他人同居的证据、重婚的证据。',
      '**可主张权利**：可依据《民法典》第 1091 条请求离婚损害赔偿，并在财产分割时主张无过错方权益照顾。'
    ],
    '婚姻撤销': [
      '**可撤销情形**：因胁迫结婚的、一方婚前隐瞒重大疾病的，受损害方可请求撤销婚姻。',
      '**时间限制**：胁迫婚姻自胁迫行为终止之日起 1 年内提出；隐瞒疾病自知道或应当知道撤销事由之日起 1 年内提出。',
      '**法律后果**：被撤销的婚姻自始没有法律约束力，当事人不具有夫妻的权利义务，财产按同居关系处理。'
    ],
    '婚姻无效': [
      '**无效情形**：重婚、有禁止结婚的亲属关系、未到法定婚龄。',
      '**申请主体**：当事人、利害关系人（如重婚的合法配偶）可向法院申请宣告婚姻无效。',
      '**法律后果**：婚姻自始无效，不具有夫妻权利义务，财产不适用夫妻财产制，按共同共有或一般共有处理。'
    ],
    '夫妻关系': [
      '**基本权利**：夫妻在婚姻家庭中地位平等，双方都有使用自己姓名的权利，都有参加生产、工作、学习和社会活动的自由。',
      '**相互义务**：夫妻有相互抚养的义务，一方丧失民事行为能力时另一方有抚养义务；有抚养、教育、保护未成年子女的共同义务。',
      '**维权建议**：若一方过度限制另一方的人身自由或经济支配权，可向妇联、社区求助，必要时可起诉或作为感情破裂的依据。'
    ],
    '诉讼程序': [
      '**管辖确定**：一般由被告住所地法院管辖；涉及不动产的由不动产所在地法院管辖。',
      '**诉讼时效**：离婚后财产纠纷诉讼时效为三年，从当事人发现之日起计算；抚养费请求权不适用诉讼时效。',
      '**程序选择**：事实清楚、争议不大的案件适用简易程序（3个月内审结）；复杂案件适用普通程序（6个月内审结）。'
    ],
    '离婚纠纷': [
      '**感情破裂证据**：收集分居证明、家暴证据、出轨证据、恶习证据等，证明感情确已破裂。',
      '**子女抚养安排**：提前考虑抚养权归属、抚养费数额、探望方式，尽量协商一致以减少对孩子的伤害。',
      '**财产清单整理**：列明所有夫妻共同财产和个人财产，收集相关权属证明，防止对方转移隐匿财产。'
    ],
    '求助资源': [
      '**紧急救助**：人身危险拨打 110，妇女维权拨打 12338，心理援助拨打 12320 或当地心理热线。',
      '**法律援助**：经济困难可向当地法律援助中心申请免费律师，符合条件的家暴、抚养纠纷案件优先受理。',
      '**庇护与转介**：各地民政部门设有反家暴庇护所，妇联可提供临时安置、法律咨询、心理疏导等转介服务。'
    ]
  };

  /**
   * 根据 query 内容智能匹配最佳 category
   */
  function resolveCategory(query, topResults) {
    const q = String(query);
    // 先按query关键词匹配
    if (q.indexOf('抚养费') >= 0 || q.indexOf('抚养') >= 0 && q.indexOf('费') >= 0) return '父母子女关系';
    if (q.indexOf('抚养权') >= 0 || q.indexOf('孩子跟谁') >= 0) return '子女抚养';
    if (q.indexOf('探望') >= 0 || q.indexOf('探视') >= 0) return '子女抚养';
    if (q.indexOf('家暴') >= 0 || q.indexOf('暴力') >= 0) return '家暴维权';
    if (q.indexOf('财产') >= 0 || q.indexOf('房子') >= 0 || q.indexOf('房产') >= 0 || q.indexOf('存款') >= 0) return '财产分割';
    if (q.indexOf('债务') >= 0 || q.indexOf('欠款') >= 0 || q.indexOf('借款') >= 0) return '债务纠纷';
    if (q.indexOf('彩礼') >= 0) return '彩礼纠纷';
    if (q.indexOf('赔偿') >= 0 || q.indexOf('补偿') >= 0) return '离婚赔偿';
    if (q.indexOf('冷静期') >= 0 || q.indexOf('协议离婚') >= 0) return '协议离婚';
    if (q.indexOf('起诉离婚') >= 0 || q.indexOf('诉讼离婚') >= 0) return '诉讼离婚';
    if (q.indexOf('保护令') >= 0) return '保护令申请';
    if (q.indexOf('离婚协议') >= 0) return '离婚协议';
    if (q.indexOf('无效婚姻') >= 0 || q.indexOf('婚姻无效') >= 0) return '婚姻无效';
    if (q.indexOf('撤销婚姻') >= 0 || q.indexOf('胁迫') >= 0) return '婚姻撤销';
    // 兜底：取top1的category
    return topResults[0]?.category || '通用';
  }

  function getPracticalAdvice(category, query) {
    // 优先用query关键词解析category
    const resolved = resolveCategory(query, [{category}]);
    const list = PRACTICAL_ADVICE[resolved] || PRACTICAL_ADVICE[category];
    if (list && list.length > 0) {
      return list;
    }
    // 通用兜底建议
    return [
      '**证据意识**：婚姻家庭纠纷中，证据是关键。注意保留相关书面材料、转账记录、聊天记录、音视频资料。',
      '**协商优先**：能协商解决的尽量协商，既节省时间和费用，也利于后续关系（尤其是共同抚养孩子）的维护。',
      '**专业咨询**：复杂或争议较大的案件，建议携带现有材料咨询专业婚姻家事律师，听取针对性意见。'
    ];
  }

  // ========================================================================
  // 风险提示：根据问题类型
  // ========================================================================
  function getRiskWarning(category, query) {
    const qType = detectQuestionType(query);
    if (qType === '家暴' || category === '家暴维权' || category === '保护令申请') {
      return '⚠️ **安全提示**：如果您正在面临人身危险，请第一时间拨打 110 报警。人身安全保护令可独立申请，无需先起诉离婚。家暴不会因为隐忍而停止，您的安全高于一切。';
    }
    if (qType === '财产' || category === '财产分割') {
      return '⚠️ **风险提示**：诉讼前避免打草惊蛇导致对方转移财产，但也不要自行隐藏、转移共同财产——这可能让您在分割时少分或不分。建议在起诉同时申请财产保全。';
    }
    if (qType === '抚养' || category === '子女抚养') {
      return '⚠️ **风险提示**：抚养权纠纷中，争夺孩子不要演变成对孩子的二次伤害。法院会优先考虑孩子利益，任何不利于孩子身心健康的行为都可能影响判决。';
    }
    if (category === '婚姻撤销' || category === '婚姻无效') {
      return '⚠️ **时效提示**：撤销婚姻有严格的 1 年时效，超过时效将丧失撤销权。建议尽早咨询律师，确认撤销事由和起算时间。';
    }
    return '⚠️ **风险提示**：法律适用因个案细节而异，以上信息仅供参考。涉及重大权益的，建议携带材料咨询专业律师后再做决定，避免因理解偏差影响自身权益。';
  }

  // ========================================================================
  // 温暖结尾：根据置信度和场景
  // ========================================================================
  function getWarmEnding(confidence, category, query) {
    const qType = detectQuestionType(query);
    // 涉及家暴：始终加紧急求助
    if (qType === '家暴' || category === '家暴维权' || category === '保护令申请') {
      return '🙏 如果您正面临危险，请第一时间拨打 110，或拨打 12338 妇女维权热线。您不是一个人，法律和帮助一直都在。希望这些信息对您有帮助，随时欢迎您再来咨询。';
    }
    // 高置信度：稳妥收尾
    if (confidence >= 0.7) {
      return '💡 以上信息供您参考。如果您的具体情况有特殊之处，或者还有其他疑问，欢迎继续告诉我，我们一起把它弄清楚。您愿意为自己的权益多了解一步，本身就很值得肯定。';
    }
    // 低置信度：引导线下咨询
    return '🤝 每个人的情况都是独特的，单凭这里的交流可能无法覆盖所有细节。建议您带着这些信息去找专业律师面谈一次，让专业的人帮您把事情看清楚。您来问，已经在为自己负责了。';
  }

  // ========================================================================
  // 多文档融合：从 topResults 中按类型抽取相关文档
  // ========================================================================
  function pickByType(topResults, type) {
    return topResults.filter(r => r.type === type);
  }

  /**
   * 文档去重：按 id 去重，保留第一个
   */
  function deduplicateDocs(docs) {
    const seen = new Set();
    return docs.filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
  }

  /**
   * 融合多文档：抽取 Top2-3 内容作为补充
   * 返回 { laws: [], cases: [], qas: [], docs: [] }
   */
  function fuseDocuments(topResults) {
    const laws = topResults.filter(r => r.type === '法条' || r.type === '司法解释');
    const cases = pickByType(topResults, '案例');
    const qas = pickByType(topResults, '问答');
    const docs = pickByType(topResults, '文书');
    return { laws, cases, qas, docs };
  }

  // ========================================================================
  // 各类型回答构建（三段式 + 通用模板）
  // ========================================================================

  /**
   * 法条类回答：法律依据 → 通俗解释 → 适用情形 → 实操建议
   */
  function buildLawAnswer(query, topResults, confidence, opening) {
    const { laws, cases, qas } = fuseDocuments(topResults);
    const primary = laws[0] || topResults[0];
    const category = primary.category;
    const label = CATEGORY_LABEL[category] || category;

    let answer = '';

    // 开头：共情 + 定位
    answer += `${opening}\n\n`;
    answer += `您的问题涉及**${label}**，我来为您梳理相关法律规定。\n\n`;

    // 正文：法律依据（融合 Top2-3 法条）
    answer += `📖 **法律依据**\n\n`;
    answer += `> ${primary.content}\n`;
    answer += `—— ${primary.source}${primary.effectiveDate ? `（生效日期：${primary.effectiveDate}）` : ''}\n\n`;

    if (laws.length > 1) {
      answer += `**相关法条补充**\n\n`;
      for (let i = 1; i < Math.min(laws.length, 3); i++) {
        const law = laws[i];
        answer += `> ${law.content}\n`;
        answer += `—— ${law.source}\n\n`;
      }
    }

    // 通俗解释
    answer += `💡 **通俗解释**\n\n`;
    answer += `${plainExplainLaw(primary)}\n\n`;

    // 适用情形
    answer += `🎯 **适用情形**\n\n`;
    answer += `${applicableScenarios(primary)}\n\n`;

    // 案例参考（融合 Top1 案例）
    if (cases.length > 0) {
      const c = cases[0];
      answer += `📚 **典型案例参考**\n\n`;
      answer += `**${c.title}**\n\n${c.content}\n\n`;
      answer += `来源：${c.source}\n\n`;
    }

    // 实操建议
    answer += `🛠 **实操建议**\n\n`;
    const advices = getPracticalAdvice(category, query);
    advices.forEach(a => { answer += `${a}\n\n`; });

    // 问答补充（融合 Top1 问答）
    if (qas.length > 0) {
      answer += `❓ **常见疑问延伸**\n\n`;
      answer += `${qas[0].content}\n\n`;
    }

    return answer;
  }

  /**
   * 案例类回答：案情简介 → 法院认为 → 启示
   */
  function buildCaseAnswer(query, topResults, confidence, opening) {
    const { cases, laws, qas } = fuseDocuments(topResults);
    const primary = cases[0] || topResults[0];
    const category = primary.category;
    const label = CATEGORY_LABEL[category] || category;

    let answer = '';

    // 开头
    answer += `${opening}\n\n`;
    answer += `您的问题涉及**${label}**，我找到了一个与您情况相关的案例，希望对您有参考价值。\n\n`;

    // 案情简介
    answer += `📋 **案情简介**\n\n`;
    answer += `**${primary.title}**\n\n`;
    answer += `${caseBrief(primary)}\n\n`;
    answer += `来源：${primary.source}\n\n`;

    // 法院认为
    answer += `⚖️ **法院认为**\n\n`;
    answer += `${courtHolding(primary)}\n\n`;

    // 融合相关法条
    if (laws.length > 0) {
      answer += `📖 **判决法律依据**\n\n`;
      laws.slice(0, 2).forEach(law => {
        answer += `> ${law.content}\n`;
        answer += `—— ${law.source}\n\n`;
      });
    }

    // 对你有什么启示
    answer += `🌟 **对您有什么启示**\n\n`;
    answer += `${caseImplications(primary, category)}\n\n`;

    // 实操建议
    answer += `🛠 **实操建议**\n\n`;
    const advices = getPracticalAdvice(category, query);
    advices.forEach(a => { answer += `${a}\n\n`; });

    // 多案例补充
    if (cases.length > 1) {
      answer += `📚 **类似案例延伸**\n\n`;
      for (let i = 1; i < Math.min(cases.length, 3); i++) {
        const c = cases[i];
        answer += `- **${c.title}**：${c.content}\n`;
      }
      answer += `\n`;
    }

    return answer;
  }

  /**
   * 问答类回答：直接回答 → 延伸建议 → 注意事项
   */
  function buildQaAnswer(query, topResults, confidence, opening) {
    const { qas, laws, cases } = fuseDocuments(topResults);
    const primary = qas[0] || topResults[0];
    const category = primary.category;
    const label = CATEGORY_LABEL[category] || category;

    let answer = '';

    // 开头
    answer += `${opening}\n\n`;
    answer += `您的问题涉及**${label}**，我来直接为您解答。\n\n`;

    // 直接回答
    answer += `💬 **直接回答**\n\n`;
    answer += `${primary.content}\n\n`;
    answer += `—— ${primary.source}\n\n`;

    // 融合其他相关问答
    if (qas.length > 1) {
      answer += `❓ **相关疑问延伸**\n\n`;
      for (let i = 1; i < Math.min(qas.length, 3); i++) {
        const qa = qas[i];
        answer += `**${qa.title}**\n\n${qa.content}\n\n`;
      }
    }

    // 法律依据补充
    if (laws.length > 0) {
      answer += `📖 **法律依据补充**\n\n`;
      laws.slice(0, 2).forEach(law => {
        answer += `> ${law.content}\n`;
        answer += `—— ${law.source}\n\n`;
      });
    }

    // 延伸建议
    answer += `🛠 **延伸建议**\n\n`;
    const advices = getPracticalAdvice(category, query);
    advices.forEach(a => { answer += `${a}\n\n`; });

    // 案例参考
    if (cases.length > 0) {
      answer += `📚 **参考案例**\n\n`;
      answer += `**${cases[0].title}**：${cases[0].content}\n\n`;
    }

    return answer;
  }

  /**
   * 文书类回答：使用说明 → 填写要点 → 注意事项
   */
  function buildDocAnswer(query, topResults, confidence, opening) {
    const { docs, qas, laws } = fuseDocuments(topResults);
    const primary = docs[0] || topResults[0];
    const category = primary.category;
    const label = CATEGORY_LABEL[category] || category;

    let answer = '';

    // 开头
    answer += `${opening}\n\n`;
    answer += `您的问题涉及**${label}**文书，我来为您说明这份文书该怎么用、怎么写。\n\n`;

    // 使用说明
    answer += `📄 **文书内容说明**\n\n`;
    answer += `**${primary.title}**\n\n`;
    answer += `${primary.content}\n\n`;
    answer += `—— ${primary.source}\n\n`;

    // 填写要点
    answer += `✍️ **填写要点**\n\n`;
    answer += `${docFillingTips(primary, category)}\n\n`;

    // 注意事项
    answer += `⚠️ **使用注意事项**\n\n`;
    answer += `${docCautions(primary, category)}\n\n`;

    // 融合其他文书
    if (docs.length > 1) {
      answer += `📑 **相关文书参考**\n\n`;
      for (let i = 1; i < Math.min(docs.length, 3); i++) {
        const d = docs[i];
        answer += `- **${d.title}**：${truncate(d.content, 80)}\n`;
      }
      answer += `\n`;
    }

    // 法律依据
    if (laws.length > 0) {
      answer += `📖 **相关法律依据**\n\n`;
      answer += `> ${laws[0].content}\n`;
      answer += `—— ${laws[0].source}\n\n`;
    }

    // 实操建议
    answer += `🛠 **实操建议**\n\n`;
    const advices = getPracticalAdvice(category, query);
    advices.forEach(a => { answer += `${a}\n\n`; });

    return answer;
  }

  // ========================================================================
  // 内容生成辅助函数
  // ========================================================================

  /** 法条通俗解释 */
  function plainExplainLaw(law) {
    const title = law.title || '';
    const content = law.content || '';
    // 基于法条标题/内容关键词生成通俗解释
    if (content.indexOf('冷静期') >= 0) {
      return '简单来说：协议离婚不是当场就能办完的，法律给了双方 30 天的"冷静期"用来再想一想。这 30 天内任何一方反悔都能撤回申请；过了冷静期还有 30 天的"领证期"，双方必须一起去领证，不去就当作放弃离婚了。';
    }
    if (content.indexOf('共同财产') >= 0 && content.indexOf('工资') >= 0) {
      return '简单来说：结婚后夫妻双方挣的钱（工资、奖金、投资收益等），原则上都是两个人共同的，不分你的我的；但婚前自己的钱、人身损害赔偿、明确只给一方的赠与或遗产，属于个人。';
    }
    if (content.indexOf('个人财产') >= 0 && content.indexOf('婚前') >= 0) {
      return '简单来说：婚前你自己就有的财产、因身体受伤害赔给你的钱、明确只给你的赠与或遗产、你专用的生活用品——这些结了婚也还是你自己的，离婚时不参与分割。';
    }
    if (content.indexOf('感情确已破裂') >= 0 || content.indexOf('准予离婚') >= 0) {
      return '简单来说：法院判离婚的核心标准是"感情确已破裂"。如果有家暴、重婚/同居、虐待遗弃、恶习屡教不改、分居满 2 年等硬性情形，调解无效就应当判离；第一次没判离的，分居满 1 年再起诉也应当判离。';
    }
    if (content.indexOf('胁迫') >= 0 && content.indexOf('撤销') >= 0) {
      return '简单来说：如果是被逼迫结婚的，受胁迫的一方可以向法院请求撤销这段婚姻，但要在胁迫结束后 1 年内提出。撤销后的婚姻相当于"从没结过"。';
    }
    if (content.indexOf('重大疾病') >= 0) {
      return '简单来说：结婚前如果有重大疾病必须如实告诉对方，瞒着结的婚，对方可以向法院申请撤销。撤销权从知道被瞒那天起 1 年内有效。';
    }
    if (content.indexOf('共同债务') >= 0) {
      return '简单来说：两个人一起签字借的、一方借但另一方事后认可的、或一方为家庭日常（吃穿用度、孩子教育、看病等）借的钱，是共同债务；超出家庭日常的大额借款，原则上算个人债务，除非债权人能证明钱用在了夫妻共同生活或经营上。';
    }
    if (content.indexOf('隐藏') >= 0 && content.indexOf('转移') >= 0) {
      return '简单来说：谁敢在离婚时偷偷藏钱、转钱、伪造债务来占对方便宜，被发现后可以少分甚至不分财产；离婚后才发现的，还能再起诉要求重新分割。';
    }
    if (content.indexOf('抚养') >= 0 && content.indexOf('补偿') >= 0) {
      return '简单来说：如果一方在婚姻里承担了更多带娃、照顾老人、协助另一方工作的责任，离婚时可以要求另一方给予经济补偿——这是对家务劳动价值的法律认可。';
    }
    if (content.indexOf('照顾子女') >= 0 || content.indexOf('分割') >= 0) {
      return '简单来说：离婚分财产时先协商，协商不成法院判；法院会优先照顾带孩子的一方、女方和无过错方。不是绝对的五五分，而是有倾向性地保护弱者和无过错方。';
    }
    // 通用兜底
    return `这条规定出自${law.source || '相关法律'}，是处理${law.category || '此类问题'}时的直接法律依据。理解时把握两个要点：一是看法律保护的是什么权利、二是看法律设置了什么义务或后果。如果您对某个具体条款的含义仍有疑问，可以告诉我，我再为您进一步解释。`;
  }

  /** 法条适用情形 */
  function applicableScenarios(law) {
    const content = law.content || '';
    if (content.indexOf('冷静期') >= 0) {
      return '适用于**协议离婚**场景：双方都同意离婚，且能就孩子、财产、债务达成一致，准备去民政局办理登记时，会经过这一程序。';
    }
    if (content.indexOf('准予离婚') >= 0) {
      return '适用于**诉讼离婚**场景：一方想离另一方不同意，或对抚养财产谈不拢时起诉离婚，法院依据本条判断是否判离。尤其适用于家暴、出轨、分居等情形。';
    }
    if (content.indexOf('共同财产') >= 0 && content.indexOf('工资') >= 0) {
      return '适用于**离婚财产分割**场景：需要界定哪些财产是夫妻共同的、哪些是个人的，本条是认定共同财产范围的基础依据。';
    }
    if (content.indexOf('共同债务') >= 0) {
      return '适用于**离婚债务处理**场景：判断某笔借款是否属于夫妻共同债务、离婚后由谁偿还时，依据本条认定。';
    }
    if (content.indexOf('隐藏') >= 0 && content.indexOf('转移') >= 0) {
      return '适用于**财产被转移**场景：怀疑或发现对方在离婚前后隐藏、转移、变卖共同财产时，可依据本条主张少分或不分，或离婚后另行起诉再次分割。';
    }
    return `适用于**${CATEGORY_LABEL[law.category] || law.category}**相关场景。当您遇到与此相关的具体情况时，可对照本条判断自己的权利和义务。`;
  }

  /** 案例案情简介 */
  function caseBrief(caseDoc) {
    const content = caseDoc.content || '';
    // 尝试提取"法院判决"之前的部分作为案情
    const idx = content.indexOf('法院判决');
    if (idx > 0) {
      return content.substring(0, idx).trim();
    }
    // 截取前部分作为简介
    return truncate(content, 200);
  }

  /** 案例法院认为 */
  function courtHolding(caseDoc) {
    const content = caseDoc.content || '';
    const idx = content.indexOf('法院判决');
    if (idx >= 0) {
      return content.substring(idx).trim();
    }
    // 通用化处理
    return `法院在审理中综合考虑了双方提交的证据和具体事实，依据相关法律规定作出裁判。本案确立的裁判规则对类似纠纷具有重要参考价值。`;
  }

  /** 案例启示 */
  function caseImplications(caseDoc, category) {
    const title = caseDoc.title || '';
    const content = caseDoc.content || '';
    if (title.indexOf('婚前买房') >= 0 || content.indexOf('婚前买房') >= 0) {
      return '这个案例告诉您：婚前一方出资买的房，原则上归出资方；但婚后共同还贷的部分及其增值，另一方有权分得一半。建议婚前买房的，保留好首付出资凭证；婚后共同还贷的，保留还款流水，以便日后分割时有据可查。';
    }
    if (title.indexOf('抚养') >= 0 || content.indexOf('抚养') >= 0) {
      return '这个案例告诉您：孩子满 8 周岁后，法院会尊重孩子的真实意愿。如果想争取抚养权或变更抚养，让孩子愿意跟您生活、并能证明您能提供更稳定的成长环境，会大大增加胜算。切忌在孩子面前诋毁对方。';
    }
    if (title.indexOf('家暴') >= 0 || content.indexOf('保护令') >= 0) {
      return '这个案例告诉您：家暴发生后要第一时间报警、就医、留证；人身安全保护令可以独立于离婚诉讼申请，是保护自己的快速法律武器。孕期、哺乳期遭遇家暴尤其需要紧急保护。';
    }
    if (title.indexOf('彩礼') >= 0 || content.indexOf('彩礼') >= 0) {
      return '这个案例告诉您：彩礼是否返还，关键看是否办理结婚登记、是否共同生活、是否导致给付方生活困难。恋爱中的小额赠与不算彩礼。保留转账记录、媒人证言对认定彩礼金额很关键。';
    }
    return `这个案例告诉您：在类似情形下，法院会重点审查哪些事实、依据哪些法律条款作出裁判。建议您对照自己的情况，梳理对应的关键事实和证据，必要时请律师评估您的胜算。`;
  }

  /** 文书填写要点 */
  function docFillingTips(doc, category) {
    if (category === '离婚协议') {
      return '1. **双方信息**：姓名、身份证号、住址、联系方式要准确无误，与身份证一致。\n2. **离婚意愿**：明确写"双方自愿离婚"，不能有附加条件。\n3. **子女抚养**：写明抚养权归属、抚养费金额及支付方式（按月/按年/一次性）、支付期限（一般至18周岁）、探望的具体时间与方式（如每月几个周末、寒暑假安排）。\n4. **财产分割**：逐项列明，房产要写地址+产权证号、车辆要写车牌+登记人、存款要写账号+金额。\n5. **债务承担**：列明共同债务清单及承担方式，避免日后被债权人追索。\n6. **生效条款**：写明"自婚姻登记机关颁发离婚证之日起生效"。';
    }
    if (category === '起诉状') {
      return '1. **当事人信息**：原告、被告的姓名、性别、出生年月、身份证号、住址、联系方式。\n2. **诉讼请求**：分项列明，如"1. 判决原被告离婚；2. 婚生子由原告抚养，被告每月支付抚养费X元；3. 依法分割夫妻共同财产..."。\n3. **事实与理由**：按时间顺序陈述婚姻经过、矛盾产生过程、感情破裂的具体事实，引用相关法律条款。\n4. **证据清单**：附在起诉状后，列明每份证据的名称、来源、证明目的。';
    }
    if (category === '保护令申请') {
      return '1. **申请人/被申请人信息**：姓名、性别、出生日期、身份证号、住址、联系方式、与申请人关系。\n2. **请求事项**：明确具体，如"1. 禁止被申请人实施家庭暴力；2. 禁止被申请人骚扰、跟踪、接触申请人；3. 责令被申请人迁出申请人住所"。\n3. **事实与理由**：写明遭受家暴或面临家暴危险的具体经过、时间、地点、后果。\n4. **证据附后**：报警记录、伤情照片、医院诊断、证人证言等。';
    }
    return '1. **核对信息准确性**：所有姓名、身份证号、地址、金额等关键信息必须准确，避免错别字。\n2. **条款具体化**：避免使用"等"、"其他"等模糊表述，能写清楚的尽量写清楚。\n3. **保留书面原件**：文书一式多份，双方各执一份，相关机构备案一份，签字捺印并注明日期。';
  }

  /** 文书注意事项 */
  function docCautions(doc, category) {
    if (category === '离婚协议') {
      return '1. 协议一旦在民政局登记备案即生效，事后反悔很难推翻，签字前务必请律师审阅。\n2. 不要隐瞒财产或债务，否则对方日后可起诉重新分割或主张你少分。\n3. 抚养费、探望权的约定要考虑可执行性，过于苛刻的条款反而容易引发后续纠纷。\n4. 如有房产过户、车辆过户等事项，建议同时约定配合义务和违约责任。';
    }
    if (category === '起诉状') {
      return '1. 诉讼请求要合理，过高可能承担更高诉讼费，过低则可能损害自身权益。\n2. 事实陈述要客观真实，避免情绪化、攻击性语言，影响法官观感。\n3. 证据要确实充分，复印件与原件要对应，证据清单与起诉状一同提交。\n4. 管辖法院要选对，否则可能被驳回或移送，耽误时间。';
    }
    if (category === '保护令申请') {
      return '1. 保护令申请无需缴纳诉讼费，可独立于离婚诉讼提出。\n2. 紧急情况可申请"临时保护令"，法院 24 小时内裁定。\n3. 保护令有效期不超过 6 个月，到期前可申请延长。\n4. 被申请人违反保护令的，可能面临罚款、拘留，甚至刑事追责。';
    }
    return '1. 文书内容应根据您的具体情况进行调整，不可直接照搬模板。\n2. 涉及重大权益的文书，建议由专业律师起草或审阅后再使用。\n3. 签字前务必逐字阅读，确认无误后再签字捺印。\n4. 保留好文书原件，电子备份留存。';
  }

  /** 截断文本 */
  function truncate(text, max) {
    if (!text) return '';
    if (text.length <= max) return text;
    return text.substring(0, max) + '...';
  }

  // ========================================================================
  // 统一回答构建：无论检索到什么类型，都按固定结构输出
  // 结构：共情开头 → 法律依据（法条+司法解释） → 判例参考 → 通俗解释 → 实操建议 → 风险提示 → 温暖结尾
  // ========================================================================
  function buildStructuredAnswer(query, topResults, confidence) {
    const { laws, cases, qas } = fuseDocuments(topResults);
    const uniqueLaws = deduplicateDocs(laws);
    const uniqueCases = deduplicateDocs(cases);
    const category = resolveCategory(query, topResults);
    const opening = getEmpathyOpening(query, category);
    const label = CATEGORY_LABEL[category] || category;

    let answer = '';

    // 1. 共情开头 + 定位
    answer += `${opening}\n\n`;
    answer += `您的问题涉及**${label}**，我为您梳理了相关法律规定和司法实践，供您参考。\n\n`;

    // 2. 法律依据（法条 + 司法解释，Top3）
    const legalDocs = uniqueLaws.slice(0, 3);
    if (legalDocs.length > 0) {
      answer += `📖 **法律依据**\n\n`;
      legalDocs.forEach((law, idx) => {
        answer += `**${idx + 1}. ${law.title}**\n\n`;
        answer += `> ${law.content}\n\n`;
        answer += `—— ${law.source}${law.effectiveDate ? `（${law.effectiveDate}）` : ''}\n\n`;
      });
    }

    // 3. 判例参考（案例，Top2）
    const caseDocs = uniqueCases.slice(0, 2);
    if (caseDocs.length > 0) {
      answer += `⚖️ **判例参考**\n\n`;
      caseDocs.forEach((c, idx) => {
        answer += `**案例${idx + 1}：${c.title}**\n\n`;
        // 解析案例内容结构
        const brief = extractSection(c.content, '基本案情');
        const holding = extractSection(c.content, '法院认为');
        const gist = extractSection(c.content, '裁判要旨');
        const result = extractSection(c.content, '判决结果');

        if (brief) {
          answer += `📋 **案情简介**：${brief}\n\n`;
        }
        if (holding) {
          answer += `🔍 **法院观点**：${holding}\n\n`;
        }
        if (gist) {
          answer += `💡 **裁判要旨**：${gist}\n\n`;
        }
        if (result) {
          answer += `📌 **判决结果**：${result}\n\n`;
        }
        // 如果没有结构化内容，显示完整内容
        if (!brief && !holding && !gist && !result) {
          answer += `${c.content}\n\n`;
        }
        answer += `—— ${c.source}${c.effectiveDate ? `（${c.effectiveDate}）` : ''}\n\n`;
      });
    }

    // 4. 问答补充（Top1）
    if (qas.length > 0) {
      answer += `❓ **相关问答**\n\n`;
      answer += `**${qas[0].title}**\n\n`;
      answer += `${qas[0].content}\n\n`;
    }

    // 5. 通俗解释（基于检索到的法条）
    if (laws.length > 0) {
      answer += `💡 **通俗解释**\n\n`;
      laws.slice(0, 2).forEach(law => {
        answer += `${plainExplainLaw(law)}\n\n`;
      });
    }

    // 6. 实操建议（基于query智能匹配）
    answer += `🛠 **实操建议**\n\n`;
    const advices = getPracticalAdvice(category, query);
    advices.forEach(a => { answer += `${a}\n\n`; });

    // 7. 风险提示
    answer += `---\n\n`;
    answer += `${getRiskWarning(category, query)}\n\n`;

    // 8. 温暖结尾
    answer += `${getWarmEnding(confidence, category, query)}`;

    return {
      answer,
      confidence,
      sources: topResults.slice(0, 3),
      needsLawyer: confidence < 0.6
    };
  }

  /**
   * 从案例content中提取指定标记段落
   */
  function extractSection(content, marker) {
    if (!content) return '';
    const startIdx = content.indexOf('【' + marker + '】');
    if (startIdx < 0) return '';
    const endMarkers = ['【基本案情】', '【法院认为】', '【裁判要旨】', '【判决结果】'];
    let endIdx = content.length;
    for (const em of endMarkers) {
      if (em === '【' + marker + '】') continue;
      const idx = content.indexOf(em, startIdx + em.length);
      if (idx > 0 && idx < endIdx) {
        endIdx = idx;
      }
    }
    return content.substring(startIdx + marker.length + 2, endIdx).trim();
  }

  // ========================================================================
  // 基于检索结果生成回答
  // ========================================================================
  function generate(query, topResults) {
    if (!topResults || topResults.length === 0) {
      return {
        answer: '我理解您此刻可能有很多疑问，但很抱歉，我未能在知识库中找到与您问题高度相关的内容。建议您：\n\n1. **换个说法重新描述**：例如把"我想离婚"细化为"婚后买房离婚怎么分"；\n2. **缩小问题范围**：指定具体场景（离婚程序、财产分割、子女抚养、家暴维权等）；\n3. **直接咨询专业律师**：复杂案件建议携带材料面谈，获得针对性意见。\n\n您的每一次主动求助都值得被认真对待，欢迎您补充更多细节后再次提问。',
        confidence: 0,
        sources: [],
        needsLawyer: true
      };
    }

    const top1 = topResults[0];
    const confidence = calcConfidence(topResults);
    const category = top1.category;

    // 高置信度：基于检索结果构建结构化回答
    if (confidence > 0.5) {
      return buildStructuredAnswer(query, topResults, confidence);
    }

    // 低置信度：保守回答 + 共情 + 引导
    const opening = getEmpathyOpening(query, category);
    const label = CATEGORY_LABEL[category] || category;
    let answer = '';
    answer += `${opening}\n\n`;
    answer += `根据您的问题，我检索到一些与**${label}**相关的信息，供您参考：\n\n`;
    answer += `> ${top1.content}\n\n`;
    answer += `—— ${top1.source}\n\n`;

    // 多文档融合：补充 Top2-3
    if (topResults.length > 1) {
      answer += `**相关补充**\n\n`;
      for (let i = 1; i < Math.min(topResults.length, 3); i++) {
        const r = topResults[i];
        answer += `- ${truncate(r.content, 100)}（来源：${r.source}）\n`;
      }
      answer += `\n`;
    }

    answer += `⚠️ 由于您的问题与知识库的匹配度一般，以上信息可能不能完全对应您的具体情况。建议您补充更多细节，或者直接咨询专业律师，让专业的人帮您维护权益。您愿意来问，已经是为自己负责了。`;

    return {
      answer,
      confidence,
      sources: topResults.slice(0, 3),
      needsLawyer: confidence < 0.6
    };
  }

  /**
   * 模拟 LLM 流式输出（比赛演示时增加科技感）
   */
  function streamAnswer(answerObj, onChunk, onComplete) {
    const text = answerObj.answer;
    let i = 0;
    const chunkSize = 3;
    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete(answerObj);
        return;
      }
      const chunk = text.substr(i, chunkSize);
      i += chunkSize;
      if (onChunk) onChunk(chunk);
    }, 15);
  }

  // 暴露到全局
  window.NuanguiGenerator = {
    generate,
    streamAnswer,
    calcConfidence,
    CATEGORY_LABEL
  };
})();
