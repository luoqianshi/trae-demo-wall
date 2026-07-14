/* 民生档案权益助手 - 核心应用脚本 */

/* === 场景配置 === */
const SCENES = [
  { id: "job", name: "找工作/离职", icon: "briefcase", color: "primary" },
  { id: "housing", name: "租房/买房", icon: "home", color: "secondary" },
  { id: "salary", name: "薪资福利", icon: "banknote", color: "warning" },
  { id: "dispute", name: "劳动纠纷", icon: "scale", color: "error" }
];

/* === Mock数据：四大场景案例（五段式结构） === */
const CASE_DATA = [
  {
    id: 1,
    scene: "job",
    category: "离职",
    title: "从原单位离职，档案被扣怎么办",
    tags: ["离职", "档案纠纷", "维权"],
    readTime: "3分钟阅读",
    updateDate: "2026年6月",
    situation: "小王从公司离职后，公司以未完成工作交接为由扣押了他的人事档案，导致新单位无法办理入职手续，多次沟通无果，眼看就要错过入职时间。",
    materials: ["离职证明", "劳动合同", "档案存放凭证（如有）", "工资流水"],
    steps: [
      "先确认档案原存放地（单位/人才中心）",
      "向当地劳动监察大队投诉，要求单位转递档案",
      "如投诉无效，申请劳动仲裁要求单位办理档案转移手续",
      "对仲裁结果不服可向法院提起诉讼"
    ],
    result: "根据《劳动合同法》规定，用人单位无权扣押劳动者档案。经劳动监察介入后，单位在15日内完成了档案转递，小王顺利办理了新单位入职手续。",
    tip: "档案转递应通过机要交通或专人送取，严禁个人自带档案，更不要私自拆封档案。",
    laws: ["《劳动合同法》第84条", "《企业职工档案管理工作规定》第18条"]
  },
  {
    id: 2,
    scene: "job",
    category: "入职",
    title: "毕业两年没管档案，差点影响政审",
    tags: ["档案存放", "政审", "应届生"],
    readTime: "2分钟阅读",
    updateDate: "2026年6月",
    situation: "小李毕业两年换了三份工作，一直没在意档案去向，直到考事业单位需要政审时才发现档案还在自己手里，而且已经被拆封过，人才中心拒收。",
materials: ["毕业证学位证", "报到证", "身份证", "户口本"],
    steps: [
      "联系毕业学校就业指导中心，查询档案最初转递去向",
      "如档案在个人手中，向原毕业学校申请重新审核密封",
      "到户籍所在地人才服务中心办理存档手续",
      "咨询政审单位是否认可补办后的档案"
    ],
    result: "档案在个人手中超过两年会变成死档。经过学校重新密封和人才中心审核，小李的档案终于被接收，政审顺利通过。",
    tip: "毕业时一定要关注档案去向，及时到接收地办理存档确认，不要将档案长时间放在自己手里。",
    laws: ["《流动人员人事档案管理服务规定》", "《干部人事档案工作条例》"]
  },
  {
    id: 3,
    scene: "job",
    category: "档案转移",
    title: "换城市工作，社保公积金怎么转",
    tags: ["跨城就业", "社保转移", "公积金"],
    readTime: "4分钟阅读",
    updateDate: "2026年6月",
    situation: "老张在深圳工作了5年，现在要去北京发展，不知道社保和公积金要不要转，怎么转，会不会影响缴费年限累计。",
    materials: ["身份证", "社保卡", "离职证明", "公积金卡"],
    steps: [
      "在新城市参保缴费后，向新参保地社保机构提出转移申请",
      "新参保地审核后向原参保地发出同意接收函",
      "原参保地办理转移手续，新参保地接收并办结",
      "公积金可选择转移或销户提取（根据当地政策）"
    ],
    result: "社保转移只转个人账户部分和缴费年限，统筹部分不转但不影响累计缴费年限。老张通过国家社保公共服务平台在线提交了转移申请，全程不用跑线下。",
    tip: "现在很多城市支持线上办理社保转移，通过国家社会保险公共服务平台或掌上12333APP即可申请。",
    laws: ["《社会保险法》第19条、第32条、第52条", "《住房公积金管理条例》第15条"]
  },
  {
    id: 4,
    scene: "housing",
    category: "公积金提取",
    title: "租房怎么提取公积金，需要什么材料",
    tags: ["租房", "公积金提取", "材料"],
    readTime: "3分钟阅读",
    updateDate: "2026年6月",
    situation: "小陈刚参加工作在上海租房，房租占了工资的三分之一，听说可以提取公积金付房租，但不知道怎么操作，需要准备哪些材料。",
    materials: ["身份证", "租房合同", "租金发票（部分城市不需要）", "本人银行卡"],
    steps: [
      "确认当地公积金提取政策和限额（各地标准不同）",
      "准备好身份证、租房合同等材料",
      "通过公积金APP、官网或线下网点提交提取申请",
      "审核通过后资金直接打入本人银行卡"
    ],
    result: "现在很多城市简化了租房提取流程，无需租金发票，只需无房证明即可按月提取。小陈通过当地公积金APP提交了申请，3个工作日就到账了。",
    tip: "提取前建议先咨询当地公积金中心12329热线，了解最新政策和所需材料，避免跑冤枉路。",
    laws: ["《住房公积金管理条例》第24条"]
  },
  {
    id: 5,
    scene: "housing",
    category: "买房",
    title: "公积金贷款能贷多少，怎么算",
    tags: ["买房", "公积金贷款", "额度"],
    readTime: "3分钟阅读",
    updateDate: "2026年6月",
    situation: "小周工作3年，公积金一直正常缴存，最近准备买房想用公积金贷款，但不知道能贷多少钱，利率比商贷低多少。",
    materials: ["身份证", "购房合同", "公积金缴存证明", "收入证明"],
    steps: [
      "查询自己的公积金账户余额和缴存年限",
      "了解当地公积金贷款最高额度和计算规则",
      "确认自己是否符合贷款条件（连续缴存6-12个月以上）",
      "到公积金中心或合作银行提交贷款申请"
    ],
    result: "公积金贷款利率远低于商业贷款（5年以上首套3.1% vs 商贷4%左右）。贷款额度一般与账户余额、缴存年限、月缴存额、房价等因素挂钩，各地有最高限额。",
    tip: "公积金贷款前不要随意提取账户余额，账户余额直接影响贷款额度。具体政策以当地最新规定为准。",
    laws: ["《住房公积金管理条例》第26条、第27条"]
  },
  {
    id: 6,
    scene: "salary",
    category: "薪资",
    title: "十三薪是法定必须发放的吗",
    tags: ["十三薪", "年底双薪", "福利"],
    readTime: "2分钟阅读",
    updateDate: "2026年6月",
    situation: "年底了，小赵听同事说公司应该发十三薪，但HR说公司没有这个规定。小赵想知道十三薪是不是法律强制要求的，什么情况下可以要求发放。",
    materials: ["劳动合同", "公司员工手册", "往年工资条", "offer录用通知"],
    steps: [
      "先查看劳动合同中是否有十三薪的明确约定",
      "查阅公司规章制度或员工手册中是否有相关规定",
      "收集往年发放十三薪的证据（工资条、银行流水）",
      "如符合条件可先与公司协商，协商不成可申请劳动仲裁"
    ],
    result: "不是。十三薪属于用人单位自主决定的福利范畴，现行劳动法律法规并未强制要求发放。但如果劳动合同有明确约定、公司制度有规定或往年有固定发放惯例，劳动者可以要求按约定发放。",
    tip: "入职时注意查看劳动合同中关于薪资的约定，口头承诺难以作为维权依据，一切以书面合同为准。",
    laws: ["《劳动合同法》第30条"]
  },
  {
    id: 7,
    scene: "salary",
    category: "加班费",
    title: "加班费怎么算才对，公司不给怎么办",
    tags: ["加班费", "加班", "维权"],
    readTime: "3分钟阅读",
    updateDate: "2026年6月",
    situation: "小孙在互联网公司工作996是常态，但公司从未支付过加班费，说加班是自愿的，还说合同里写的工资已经包含加班费。",
    materials: ["考勤记录", "加班审批单", "工作群聊天记录", "工资条", "劳动合同"],
    steps: [
      "收集加班证据（打卡记录、工作群消息、邮件、加班审批等）",
      "先与公司人力资源部门沟通协商",
      "协商不成向劳动监察部门投诉举报",
      "必要时申请劳动仲裁主张加班费"
    ],
    result: "工作日加班按1.5倍工资计算，休息日加班按2倍计算（不能安排补休的），法定节假日加班按3倍计算（不能用补休代替）。合同中约定工资包含加班费的条款通常是无效的。",
    tip: "加班证据是维权关键，平时注意保留考勤截图、加班通知、工作沟通记录等，不要等到离职时才收集。",
    laws: ["《劳动法》第44条", "《工资支付暂行规定》第13条"]
  },
  {
    id: 8,
    scene: "dispute",
    category: "维权",
    title: "公司不签劳动合同，怎么证明劳动关系",
    tags: ["劳动关系", "证据", "工伤", "维权"],
    readTime: "3分钟阅读",
    updateDate: "2026年6月",
    situation: "老周在工地干活受伤，公司没给他签劳动合同也没买社保，现在申请工伤认定需要先确认劳动关系，但他手里没有任何书面证据。",
    materials: ["工资支付凭证/银行流水", "工作证/工牌/服务证", "考勤记录", "同事证人证言", "工作邮件/聊天记录"],
    steps: [
      "收集工资支付凭证或记录（银行转账记录）",
      "保留用人单位发放的工作证、工牌等能证明身份的证件",
      "找同事提供证人证言（最好是在职同事）",
      "保留考勤记录、招聘登记表、工作邮件微信等证据",
      "先申请劳动仲裁确认劳动关系，再申请工伤认定"
    ],
    result: "没有劳动合同也可以认定劳动关系。工资支付凭证、社保记录、工作证、考勤记录、其他劳动者证言等都可以作为证据。经仲裁确认劳动关系后，老周顺利申请了工伤认定并获得了赔偿。",
    tip: "入职后即使公司不签合同，也要注意保留能证明你在这家公司工作的一切证据，这是以后维权的基础。",
    laws: ["《关于确立劳动关系有关事项的通知》（劳社部发〔2005〕12号）", "《工伤保险条例》第18条"]
  },
  {
    id: 9,
    scene: "dispute",
    category: "仲裁",
    title: "被公司无故辞退，怎么申请劳动仲裁",
    tags: ["违法辞退", "劳动仲裁", "赔偿金"],
    readTime: "4分钟阅读",
    updateDate: "2026年6月",
    situation: "小吴在公司工作了2年，突然接到HR通知说公司要裁员，让她当天交接完走人，只给1个月工资作为补偿，她觉得不合理但不知道怎么办。",
    materials: ["劳动合同", "解除劳动合同通知", "工资流水", "社保缴费记录", "辞退沟通录音/聊天记录"],
    steps: [
      "不要主动签自愿离职申请，要求公司出具书面解除通知",
      "收集劳动合同、工资流水、社保记录、辞退证据等",
      "向劳动合同履行地或公司所在地的劳动仲裁委提交申请",
      "仲裁委受理后开庭审理，45日内作出裁决",
      "对裁决不服可在15日内向法院起诉"
    ],
    result: "公司无故辞退属于违法解除劳动合同，劳动者可以要求继续履行合同或要求支付赔偿金（2倍经济补偿金，工作2年应赔偿4个月工资）。小吴通过仲裁拿到了应得的赔偿金。",
    tip: "劳动仲裁不收费，自己就可以申请，不需要请律师。仲裁时效是一年，从知道或应当知道权利被侵害之日起算。",
    laws: ["《劳动合同法》第47条、第48条、第87条", "《劳动争议调解仲裁法》第27条、第43条"]
  },
  {
    id: 10,
    scene: "salary",
    category: "社保",
    title: "试用期公司不交社保合法吗",
    tags: ["试用期", "社保", "维权"],
    readTime: "2分钟阅读",
    updateDate: "2026年6月",
    situation: "小林刚入职一家公司，HR说试用期3个月不给交社保，转正后再交，还说这是公司规定，试用期员工都这样。",
    materials: ["劳动合同", "入职offer", "社保缴费记录", "工资条"],
    steps: [
      "向公司提出要求缴纳试用期社保，说明法律规定",
      "如公司拒绝，可向社保经办机构或劳动监察部门投诉",
      "也可以此为由解除劳动合同并要求经济补偿",
      "社保部门会责令公司补缴并可能加收滞纳金"
    ],
    result: "不合法。用人单位应当自用工之日起30日内为职工办理社保登记，试用期包含在劳动合同期限内，试用期也必须缴纳社保。经投诉后，公司为小林补缴了试用期的社保。",
    tip: "社保是法定强制缴纳的，员工自愿放弃社保的承诺也是无效的，公司和个人都必须依法缴纳。",
    laws: ["《社会保险法》第58条、第86条", "《劳动合同法》第19条、第38条"]
  }
];

/* === 知识库分类和知识点数据 === */
const KNOWLEDGE_CATEGORIES = [
  { id: "archive", name: "民生档案常识", icon: "folder-open", color: "primary", desc: "有哪些常见档案？归谁管？", count: 3 },
  { id: "housing", name: "住房公积金", icon: "building", color: "secondary", desc: "缴存、提取、贷款规则", count: 3 },
  { id: "salary", name: "薪资权益", icon: "wallet", color: "warning", desc: "十三薪、加班费、最低工资", count: 3 },
  { id: "social", name: "社保常识", icon: "shield-check", color: "info", desc: "五险是什么？断缴有啥影响？", count: 3 },
  { id: "contract", name: "劳动合同", icon: "file-text", color: "success", desc: "必备条款、试用期、违约金", count: 3 }
];

const KNOWLEDGE_POINTS = [
  { id: "archive-1", categoryId: "archive", title: "人事档案里都有什么材料", answer: "人事档案主要记录个人学习和工作经历，包括：履历材料、自传材料、考核鉴定材料、学历学位材料、政审材料、党团材料、奖惩材料、录用任免聘用工资待遇材料、出国出境材料等。", conditions: [], basis: "《干部人事档案工作条例》", tip: "档案材料必须真实，造假会记入诚信档案，严重影响考公、政审等。" },
  { id: "archive-2", categoryId: "archive", title: "档案应该存放在哪里", answer: "流动人员人事档案应由县级以上公共就业和人才服务机构管理，严禁个人保管本人或他人档案。有档案管理权限的单位（国企、事业单位、公务员单位）可自行管理员工档案。", conditions: ["国企/事业单位/公务员：单位有人事权的由单位管理", "私企/外企/灵活就业：由工作地或户籍所在地人才中心管理", "应届毕业生：可暂存学校2年或转至生源地人才中心"], basis: "《流动人员人事档案管理服务规定》", tip: "档案不要自己拿着，更不要拆封，否则会变成死档，任何正规机构都不会接收。" },
  { id: "archive-3", categoryId: "archive", title: "档案丢了怎么补办", answer: "档案丢失后需要到原档案管理机构开具丢失证明，然后逐一联系学校、原工作单位等补办相关材料，最后到人才中心办理重新建档手续。补办过程比较繁琐，需要耐心。", conditions: [], basis: "《企业职工档案管理工作规定》", tip: "平时注意关注档案去向，调动工作时及时办理档案转递，避免档案丢失。" },
  { id: "housing-1", categoryId: "housing", title: "公积金缴存比例是多少", answer: "职工和单位住房公积金的缴存比例均不得低于5%，不得高于12%。具体比例由各地根据实际情况确定，同一城市内单位和个人缴存比例相同。", conditions: ["缴存基数一般是上年度月平均工资", "新入职员工以当月工资为缴存基数", "各地有缴存基数上下限"], basis: "《住房公积金管理条例》第16条、第18条", tip: "公积金是个人和单位缴纳的都归个人所有，相当于强制储蓄，买房租房都能用。" },
  { id: "housing-2", categoryId: "housing", title: "哪些情况可以提取公积金", answer: "购买、建造、翻建、大修自住住房；离休、退休；完全丧失劳动能力并与单位终止劳动关系；出境定居；偿还购房贷款本息；房租超出家庭工资收入规定比例；与单位终止劳动关系且户口迁出本市等。", conditions: ["租房提取：一般要求连续缴存满3个月，本人及配偶无自有住房", "购房提取：需提供购房合同、发票等材料", "离职提取：部分城市要求户口迁出或封存满一定期限"], basis: "《住房公积金管理条例》第24条", tip: "具体提取条件和材料各地政策不同，建议提前拨打12329公积金热线咨询。" },
  { id: "housing-3", categoryId: "housing", title: "公积金贷款和商贷有什么区别", answer: "最大区别是利率：公积金贷款利率远低于商业贷款，5年以上首套房公积金贷款利率3.1%，而商业贷款一般在4%左右。但公积金贷款有最高额度限制，且需要连续缴存一定期限才能申请。", conditions: ["公积金贷款：利率低，但有最高额度限制，审批时间较长", "商业贷款：利率高，额度高，审批快，适用范围广", "组合贷：公积金贷款额度不够时，不足部分用商贷"], basis: "《住房公积金管理条例》第26条", tip: "如果计划用公积金贷款买房，贷款前不要随意提取公积金余额，余额影响贷款额度。" },
  { id: "salary-1", categoryId: "salary", title: "最低工资标准包含五险一金吗", answer: "各地规定不同。北京、上海等地的最低工资标准不包含劳动者个人应缴纳的五险一金；而多数省份的最低工资标准包含个人应缴纳的社保和公积金。具体要看当地规定。", conditions: ["最低工资不包含：加班费、中班夜班高温低温等特殊津贴、福利待遇", "试用期工资不得低于同岗位最低档工资的80%或劳动合同约定工资的80%，且不得低于当地最低工资"], basis: "《最低工资规定》第12条", tip: "如果正常出勤后到手工资低于当地最低工资标准，可以向劳动监察部门投诉。" },
  { id: "salary-2", categoryId: "salary", title: "公司拖欠工资怎么办", answer: "第一步先收集证据（劳动合同、工资条、考勤记录、欠条等），然后可以：1.向当地劳动监察大队投诉；2.向法院申请支付令；3.申请劳动仲裁；4.对仲裁不服向法院起诉。恶意欠薪还可能构成犯罪。", conditions: ["劳动监察投诉：带好身份证和证据，到单位所在地劳动监察大队", "支付令：凭工资欠条可直接向法院申请，程序简单快捷", "劳动仲裁：时效1年，需要提交仲裁申请书和证据材料"], basis: "《劳动法》第50条、《劳动合同法》第85条、《刑法》第276条之一", tip: "拖欠工资维权要及时，不要等公司跑路了才行动。同时可以以欠薪为由解除合同并要求经济补偿金。" },
  { id: "salary-3", categoryId: "salary", title: "年假天数怎么算，未休怎么补偿", answer: "累计工作已满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。法定休假日、休息日不计入年休假假期。", conditions: ["单位确因工作需要不能安排休年假的，经本人同意，可以不安排，但应按日工资300%支付年假工资", "离职时未休年假的，按已工作时间折算应休未休天数并支付工资", "寒暑假天数多于年假的、请事假累计20天以上且不扣工资的，不享受当年年假"], basis: "《职工带薪年休假条例》第3条、第5条", tip: "年假是法定权利，单位不能通过制度规定剥夺员工的年休假权利。" },
  { id: "social-1", categoryId: "social", title: "五险具体指什么，有什么用", answer: "五险包括养老保险、医疗保险、失业保险、工伤保险和生育保险。养老、医疗、失业三险由单位和个人共同缴纳，工伤和生育保险全部由单位缴纳，个人不缴费。", conditions: ["养老保险：累计缴满15年，退休后按月领取养老金", "医疗保险：生病就医可以报销医疗费用", "失业保险：非本人意愿失业可领取失业金", "工伤保险：工作中受伤可享受工伤待遇", "生育保险：生育时可报销医疗费用并领取生育津贴"], basis: "《社会保险法》", tip: "社保是基础保障，一定要缴纳，特别是工伤保险，出了工伤全靠它。" },
  { id: "social-2", categoryId: "social", title: "社保断缴有什么影响", answer: "社保断缴影响较大：养老保险影响累计缴费年限（但累计计算，断了可以续）；医疗保险断缴期间不能享受医保待遇，断缴超过3个月可能影响连续缴费年限；部分城市购房、购车、落户、孩子上学要求社保连续缴纳。", conditions: ["养老保险：累计缴满15年即可，断缴可以续缴，年限累计计算", "医疗保险：断缴次月起停止报销，断缴3个月以上连续缴费年限可能清零（各地规定不同）", "生育保险：需要连续缴满6-12个月才能享受待遇"], basis: "《社会保险法》", tip: "换工作时尽量不要让社保断缴，可以找正规机构代缴一两个月，或者以灵活就业人员身份自己缴纳。" },
  { id: "social-3", categoryId: "social", title: "怎么查询自己的社保缴费记录", answer: "查询方式有很多种：1.通过掌上12333APP或国家社会保险公共服务平台查询；2.参保地社保局官网、官方微信公众号查询；3.携带身份证到社保局窗口或自助机查询打印；4.支付宝/微信的城市服务中也可以查询。", conditions: ["查询需要实名认证，先注册账号", "可以查询缴费明细、缴费年限、个人账户余额等信息", "需要打印参保证明的，建议下载带电子印章的PDF版本"], basis: "《社会保险法》第74条", tip: "建议定期（每半年或一年）查询一次社保缴费记录，确认单位是否正常缴纳，发现漏缴及时维权。" },
  { id: "contract-1", categoryId: "contract", title: "劳动合同应该包含哪些内容", answer: "劳动合同必备条款包括：用人单位名称住所法定代表人、劳动者姓名住址身份证号、合同期限、工作内容工作地点、工作时间休息休假、劳动报酬、社会保险、劳动保护劳动条件等。", conditions: ["除必备条款外，还可以约定试用期、培训、保密、补充保险、福利等事项", "劳动合同一式两份，单位和劳动者各执一份", "单位不给员工劳动合同是违法的，可以向劳动监察投诉"], basis: "《劳动合同法》第16条、第17条、第81条", tip: "签合同前一定要仔细阅读每一条，特别是合同期限、岗位、工资、工作地点这些关键信息，空白合同绝对不要签。" },
  { id: "contract-2", categoryId: "contract", title: "试用期最长可以约定多久", answer: "试用期期限有法律明确规定：合同期3个月以上不满1年的，试用期不超过1个月；1年以上不满3年的，不超过2个月；3年以上固定期限和无固定期限合同，不超过6个月。", conditions: ["同一用人单位与同一劳动者只能约定一次试用期", "以完成一定工作任务为期限的合同或合同期不满3个月的，不得约定试用期", "试用期包含在劳动合同期限内，不能单独约定试用期合同", "试用期工资不得低于同岗位最低档工资80%或约定工资80%，且不得低于当地最低工资"], basis: "《劳动合同法》第19条、第20条", tip: "公司如果违法约定超长试用期，超出部分已经履行的，劳动者可以要求公司按转正工资标准支付赔偿金。" },
  { id: "contract-3", categoryId: "contract", title: "什么情况下可以要经济补偿金", answer: "劳动者可以要求经济补偿金的常见情形：单位提出协商解除合同、单位过错导致劳动者辞职（如欠薪、不缴社保）、单位无过失性辞退、经济性裁员、合同到期单位不续签或降低条件续签等。", conditions: ["经济补偿标准：每工作满1年支付1个月工资，6个月以上不满1年按1年算，不满6个月支付半个月工资", "月工资指离职前12个月平均工资（包括奖金津贴）", "工资超过当地社平工资3倍的，按3倍计算，最高不超过12年"], basis: "《劳动合同法》第36条、第38条、第40条、第41条、第44条、第46条、第47条", tip: "如果是自己主动辞职（因个人原因），是没有经济补偿金的，除非单位有过错（欠薪、不缴社保等）。" }
];

/* === "我的档案去哪儿了"身份匹配规则 === */
const IDENTITY_OPTIONS = [
  {
    id: "graduate",
    name: "应届毕业生",
    desc: "刚毕业/即将毕业，还未入职",
    icon: "graduation-cap",
    likelyLocation: {
      name: "户籍所在地的人才服务中心 / 就业单位（有人事权的单位）",
      probability: 4,
      desc: "毕业后档案一般通过机要通道转递至生源地人才服务中心，或签约有人事权的单位时转至单位"
    },
    otherLocations: ["学校（毕业两年内可申请暂缓就业）", "就业地人才服务中心"],
    tip: "毕业时一定要确认档案转递地址，并在报到后到接收地办理存档手续，不要将档案滞留在学校或自己手中。"
  },
  {
    id: "employed",
    name: "在职员工",
    desc: "目前在一家单位工作，未换过工作",
    icon: "briefcase",
    likelyLocation: {
      name: "当前工作单位（国企/事业单位/公务员）/ 工作地人才服务中心",
      probability: 4,
      desc: "国企、事业单位、公务员单位一般有人事档案管理权，档案由单位保管；私企外企员工档案一般委托工作地人才中心管理"
    },
    otherLocations: ["户籍所在地人才服务中心（入职时未调档的情况下）"],
    tip: "入职时问清楚HR公司是否有人事权，档案存放在哪里，不了解自己档案去向的建议尽快查询确认。"
  },
  {
    id: "job-hopper",
    name: "换过工作",
    desc: "有过1次以上跳槽经历",
    icon: "repeat",
    likelyLocation: {
      name: "户籍所在地的人才服务中心",
      probability: 4,
      desc: "多次换工作后档案最可能被转回户籍所在地人才中心，但也有可能遗留在某一家原单位或工作地人才中心"
    },
    otherLocations: ["第一家工作单位（国企/事业单位）", "最后一家工作单位", "工作地人才服务中心"],
    tip: "换工作时应及时办理档案转递手续，档案长期存放在个人手中会变成死档，影响退休、政审等重要事项。"
  }
];

/* === 城市官方入口数据 === */
const CITY_DATA = [
  {
    id: "beijing",
    name: "北京",
    centers: [
      { type: "talent", name: "北京市人才服务中心", address: "北京市东城区安定门外大街187号", phone: "010-12333", website: "https://rsj.beijing.gov.cn" },
      { type: "social", name: "北京市人力资源和社会保障局", address: "北京市西城区永定门西街5号", phone: "010-12333", website: "https://rsj.beijing.gov.cn" },
      { type: "fund", name: "北京住房公积金管理中心", address: "北京市西城区右安门内西街甲2号", phone: "010-12329", website: "http://gjj.beijing.gov.cn" },
      { type: "arbitration", name: "北京市劳动人事争议仲裁委员会", address: "北京市西城区槐柏树街2号", phone: "010-12333", website: "https://rsj.beijing.gov.cn" }
    ]
  },
  {
    id: "shanghai",
    name: "上海",
    centers: [
      { type: "talent", name: "上海市人才服务中心", address: "上海市长宁区天山路1800号", phone: "021-12333", website: "https://rsj.sh.gov.cn" },
      { type: "social", name: "上海市人力资源和社会保障局", address: "上海市浦东新区世博村路300号", phone: "021-12333", website: "https://rsj.sh.gov.cn" },
      { type: "fund", name: "上海住房公积金管理中心", address: "上海市黄浦区金陵东路569号", phone: "021-12329", website: "https://www.shgjj.com" },
      { type: "arbitration", name: "上海市劳动人事争议仲裁院", address: "上海市长宁区延安西路2299号", phone: "021-12333", website: "https://rsj.sh.gov.cn" }
    ]
  },
  {
    id: "guangzhou",
    name: "广州",
    centers: [
      { type: "talent", name: "广州市人才服务中心", address: "广州市天河区天河路198号南方精典大厦", phone: "020-12333", website: "http://rsj.gz.gov.cn" },
      { type: "social", name: "广州市人力资源和社会保障局", address: "广州市越秀区连新路43号", phone: "020-12333", website: "http://rsj.gz.gov.cn" },
      { type: "fund", name: "广州住房公积金管理中心", address: "广州市天河区珠江新城华就路12号", phone: "020-12329", website: "http://gjj.gz.gov.cn" },
      { type: "arbitration", name: "广州市劳动人事争议仲裁委员会", address: "广州市越秀区梅东路28号", phone: "020-12333", website: "http://rsj.gz.gov.cn" }
    ]
  },
  {
    id: "shenzhen",
    name: "深圳",
    centers: [
      { type: "talent", name: "深圳市人才服务中心", address: "深圳市福田区深南中路1025号新城大厦", phone: "0755-12333", website: "http://hrss.sz.gov.cn" },
      { type: "social", name: "深圳市人力资源和社会保障局", address: "深圳市福田区深南大道8005号深圳人才园", phone: "0755-12333", website: "http://hrss.sz.gov.cn" },
      { type: "fund", name: "深圳住房公积金管理中心", address: "深圳市福田区侨香路2008号侨香村", phone: "0755-12329", website: "http://gjj.sz.gov.cn" },
      { type: "arbitration", name: "深圳市劳动人事争议仲裁委员会", address: "深圳市福田区深南大道8005号深圳人才园", phone: "0755-12333", website: "http://hrss.sz.gov.cn" }
    ]
  }
];

/* === 热门搜索词数据 === */
const HOT_SEARCHES = [
  "离职档案转移",
  "公积金租房提取",
  "十三薪必须发吗",
  "没有劳动合同怎么证明劳动关系",
  "试用期不交社保",
  "加班费计算标准",
  "社保断缴影响",
  "劳动仲裁流程",
  "年假工资",
  "经济补偿金怎么算"
];

/* === 底部Tab导航配置 === */
const TAB_CONFIG = [
  { id: "home", name: "首页", icon: "home", url: "index.html" },
  { id: "archive", name: "档案查询", icon: "search", url: "pages/archive-guide.html" },
  { id: "rights", name: "权益指南", icon: "book-open", url: "pages/knowledge.html" },
  { id: "profile", name: "我的", icon: "user", url: "pages/profile.html" }
];

/* === 公共函数 === */

function getUrlParam(name) {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  const r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return decodeURIComponent(r[2]);
  }
  return null;
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.indexOf("/pages/") !== -1 || path.indexOf("\\pages\\") !== -1) {
    return "../";
  }
  return "";
}

function renderTabBar(activeId) {
  const tabBarContainer = document.getElementById("tab-bar");
  if (!tabBarContainer) return;

  const basePath = getBasePath();
  let html = "";
  TAB_CONFIG.forEach(tab => {
    const isActive = tab.id === activeId ? "active" : "";
    html += `
      <a href="${basePath}${tab.url}" class="tab-item ${isActive}" style="text-decoration: none;">
        <i data-lucide="${tab.icon}" class="w-5 h-5 mb-0.5"></i>
        <span class="text-xs">${tab.name}</span>
      </a>
    `;
  });
  tabBarContainer.innerHTML = html;
  if (window.lucide) {
    lucide.createIcons();
  }
}

function handleBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = getBasePath() + "index.html";
  }
}

function showToast(message, duration) {
  duration = duration || 2000;
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(function() {
    toast.style.opacity = "0";
  }, duration);
}

function getCaseById(id) {
  return CASE_DATA.find(function(item) { return item.id === parseInt(id); });
}

function getCasesByScene(scene) {
  if (!scene || scene === "all") {
    return CASE_DATA;
  }
  return CASE_DATA.filter(function(item) { return item.scene === scene; });
}

function getSceneById(id) {
  return SCENES.find(function(item) { return item.id === id; });
}

function getRelatedCases(caseId, count) {
  count = count || 3;
  const current = getCaseById(caseId);
  if (!current) return [];
  return CASE_DATA
    .filter(function(item) { return item.id !== parseInt(caseId); })
    .filter(function(item) { return item.scene === current.scene || item.tags.some(function(t) { return current.tags.indexOf(t) !== -1; }); })
    .slice(0, count);
}

function getKnowledgeCategoryById(id) {
  return KNOWLEDGE_CATEGORIES.find(function(item) { return item.id === id; });
}

function getKnowledgePointsByCategory(categoryId) {
  if (!categoryId || categoryId === "all") {
    return KNOWLEDGE_POINTS;
  }
  return KNOWLEDGE_POINTS.filter(function(item) { return item.categoryId === categoryId; });
}

function getKnowledgePointById(pointId) {
  return KNOWLEDGE_POINTS.find(function(item) { return item.id === pointId; });
}

function getRelatedKnowledgePoints(pointId, count) {
  count = count || 3;
  const current = getKnowledgePointById(pointId);
  if (!current) return [];
  return KNOWLEDGE_POINTS
    .filter(function(item) { return item.id !== pointId; })
    .filter(function(item) { return item.categoryId === current.categoryId; })
    .slice(0, count);
}

function getCityById(id) {
  return CITY_DATA.find(function(item) { return item.id === id; });
}

function getIdentityById(id) {
  return IDENTITY_OPTIONS.find(function(item) { return item.id === id; });
}

function searchContent(keyword) {
  if (!keyword || keyword.trim() === "") {
    return { cases: [], points: [] };
  }
  keyword = keyword.toLowerCase().trim();
  const cases = CASE_DATA.filter(function(item) {
    return item.title.toLowerCase().indexOf(keyword) !== -1 ||
           item.summary && item.summary.toLowerCase().indexOf(keyword) !== -1 ||
           item.situation.toLowerCase().indexOf(keyword) !== -1 ||
           item.tags.some(function(t) { return t.toLowerCase().indexOf(keyword) !== -1; });
  });
  const points = KNOWLEDGE_POINTS.filter(function(item) {
    return item.title.toLowerCase().indexOf(keyword) !== -1 ||
           item.answer.toLowerCase().indexOf(keyword) !== -1 ||
           item.tip && item.tip.toLowerCase().indexOf(keyword) !== -1;
  });
  return { cases: cases, points: points };
}

function renderStars(count) {
  let html = "";
  for (let i = 0; i < 5; i++) {
    if (i < count) {
      html += '<i data-lucide="star" class="w-4 h-4" style="color: #F59E0B; fill: #F59E0B;"></i>';
    } else {
      html += '<i data-lucide="star" class="w-4 h-4" style="color: #E2E8F0;"></i>';
    }
  }
  return html;
}

function renderBackButton() {
  return '<button onclick="handleBack()" class="w-8 h-8 flex items-center justify-center rounded-lg border" style="border-color: var(--border-default); background: var(--bg-card);"><i data-lucide="chevron-left" class="w-4 h-4" style="color: var(--text-primary);"></i></button>';
}

function initPage(activeTab, title, showBack) {
  if (showBack === undefined) showBack = true;
  renderTabBar(activeTab);
  const backBtn = document.getElementById("back-btn");
  if (backBtn && showBack) {
    backBtn.innerHTML = renderBackButton();
  }
  const titleEl = document.getElementById("page-title");
  if (titleEl && title) {
    titleEl.textContent = title;
  }
  if (window.lucide) {
    setTimeout(function() { lucide.createIcons(); }, 50);
  }
}
