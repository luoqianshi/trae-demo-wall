// ============================================================
// 导游证考试题库 - 全国导游资格考试题库数据
// 包含四科：政策与法律法规、导游业务、全国导游基础知识、地方导游基础知识
// 题型：单选(single)约60%，多选(multiple)约20%，判断(judge)约20%
// ============================================================
window.QUESTION_BANK = [

// ======================================================================
// 一、政策与法律法规（policy）- 53题
// ======================================================================

// --- 宪法基本知识 ---
{
  id: 1,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '我国的根本制度是？',
  options: { A: '人民民主专政制度', B: '社会主义制度', C: '人民代表大会制度', D: '中国共产党领导的多党合作和政治协商制度' },
  answer: 'B',
  explanation: '《宪法》第1条规定：社会主义制度是中华人民共和国的根本制度。',
  difficulty: 'easy'
},
{
  id: 2,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '我国最高国家权力机关是？',
  options: { A: '国务院', B: '最高人民法院', C: '全国人民代表大会', D: '中央军事委员会' },
  answer: 'C',
  explanation: '《宪法》第57条规定：全国人民代表大会是最高国家权力机关。',
  difficulty: 'easy'
},
{
  id: 3,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '中华人民共和国的一切权力属于？',
  options: { A: '中国共产党', B: '人民', C: '国家', D: '政府' },
  answer: 'B',
  explanation: '《宪法》第2条规定：中华人民共和国的一切权力属于人民。',
  difficulty: 'easy'
},
{
  id: 4,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '我国的国体（国家性质）是？',
  options: { A: '人民代表大会制度', B: '人民民主专政', C: '社会主义制度', D: '民主集中制' },
  answer: 'B',
  explanation: '《宪法》第1条规定：中华人民共和国是工人阶级领导的、以工农联盟为基础的人民民主专政的社会主义国家。',
  difficulty: 'medium'
},
{
  id: 5,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '我国的政体（政权组织形式）是？',
  options: { A: '人民代表大会制度', B: '人民民主专政', C: '社会主义制度', D: '民族区域自治制度' },
  answer: 'A',
  explanation: '人民代表大会制度是我国的根本政治制度，即政体。',
  difficulty: 'medium'
},
{
  id: 6,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '我国宪法规定，国家行政机关、监察机关、审判机关、检察机关都由什么产生？',
  options: { A: '人民代表大会', B: '中国共产党', C: '人民', D: '全国人民代表大会' },
  answer: 'A',
  explanation: '《宪法》第3条规定：国家行政机关、监察机关、审判机关、检察机关都由人民代表大会产生，对它负责，受它监督。',
  difficulty: 'medium'
},
{
  id: 7,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '宪法的修改，须由全国人民代表大会以全体代表多少以上的多数通过？',
  options: { A: '二分之一', B: '三分之二', C: '四分之三', D: '五分之四' },
  answer: 'B',
  explanation: '《宪法》第64条规定：宪法的修改，由全国人民代表大会常务委员会或者五分之一以上的全国人民代表大会代表提议，并由全国人民代表大会以全体代表的三分之二以上的多数通过。',
  difficulty: 'hard'
},
{
  id: 8,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '凡具有中华人民共和国国籍的人都是中华人民共和国的？',
  options: { A: '公民', B: '人民', C: '居民', D: '国民' },
  answer: 'A',
  explanation: '《宪法》第33条规定：凡具有中华人民共和国国籍的人都是中华人民共和国公民。',
  difficulty: 'easy'
},
{
  id: 9,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '中华人民共和国国歌是？',
  options: { A: '《黄河大合唱》', B: '《义勇军进行曲》', C: '《歌唱祖国》', D: '《我的祖国》' },
  answer: 'B',
  explanation: '《宪法》第141条规定：中华人民共和国国歌是《义勇军进行曲》。',
  difficulty: 'easy'
},
{
  id: 10,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'multiple',
  question: '下列哪些属于我国宪法规定的公民基本权利？',
  options: { A: '平等权', B: '选举权和被选举权', C: '言论自由', D: '宗教信仰自由' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '上述四项均为我国宪法规定的公民基本权利。',
  difficulty: 'easy'
},
{
  id: 11,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'multiple',
  question: '下列属于公民基本义务的有？',
  options: { A: '维护国家统一和全国各民族团结', B: '遵守宪法和法律', C: '维护祖国的安全、荣誉和利益', D: '依照法律服兵役和参加民兵组织' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均为我国宪法规定的公民基本义务。',
  difficulty: 'medium'
},

// --- 导游管理法规 ---
{
  id: 12,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游证的有效期为？',
  options: { A: '3年', B: '5年', C: '终身有效', D: '1年' },
  answer: 'A',
  explanation: '《导游管理办法》第9条规定：导游证有效期为3年。',
  difficulty: 'medium'
},
{
  id: 13,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游进行导游活动时，应当佩戴什么证件？',
  options: { A: '身份证', B: '导游资格证', C: '导游证', D: '旅行社工作证' },
  answer: 'C',
  explanation: '《旅游法》第102条规定：导游进行导游活动时，应当佩戴导游证。',
  difficulty: 'easy'
},
{
  id: 14,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '取得导游资格证后，应当向哪个部门申请领取导游证？',
  options: { A: '国家旅游局', B: '省级旅游主管部门', C: '所在地旅游主管部门', D: '旅行社' },
  answer: 'C',
  explanation: '《导游管理办法》第7条规定：取得导游资格证后，向所在地旅游主管部门申请领取导游证。',
  difficulty: 'medium'
},
{
  id: 15,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游人员每年累计培训时间不得少于多少小时？',
  options: { A: '24小时', B: '36小时', C: '48小时', D: '12小时' },
  answer: 'A',
  explanation: '根据规定，导游人员每年累计培训时间不得少于24小时。',
  difficulty: 'medium'
},
{
  id: 16,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '申请换发导游证应当在有效期届满前多长时间提出？',
  options: { A: '1个月', B: '2个月', C: '3个月', D: '6个月' },
  answer: 'C',
  explanation: '《导游管理办法》第15条规定：导游证有效期届满后需要继续执业的，应当在有效期届满前3个月申请换发。',
  difficulty: 'hard'
},
{
  id: 17,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '临时导游证的有效期限最长不得超过？',
  options: { A: '1个月', B: '3个月', C: '6个月', D: '12个月' },
  answer: 'B',
  explanation: '《旅游法》第103条规定：临时导游证的有效期限最长不超过3个月。',
  difficulty: 'medium'
},
{
  id: 18,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游证实行统一的什么制度？',
  options: { A: '年审制度', B: '计分制度', C: '注册制度', D: '备案制度' },
  answer: 'B',
  explanation: '导游证实行统一的计分制度管理。',
  difficulty: 'medium'
},
{
  id: 19,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游人员计分管理中，一次扣除10分的情形不包括？',
  options: { A: '有损害国家利益和民族尊严言行的', B: '诱导旅游者参加黄赌毒活动项目的', C: '私自转借导游证供他人使用的', D: '殴打或谩骂旅游者的' },
  answer: 'C',
  explanation: '私自转借导游证供他人使用的一次扣除6分，A、B、D均为一次扣除10分的情形。',
  difficulty: 'hard'
},
{
  id: 20,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'multiple',
  question: '不得颁发导游证的情形包括？',
  options: { A: '无民事行为能力或者限制民事行为能力的', B: '患有传染性疾病的', C: '受过刑事处罚的（过失犯罪除外）', D: '被吊销导游证的' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '《旅游法》第104条规定，以上四种情形均不得颁发导游证。',
  difficulty: 'medium'
},
{
  id: 21,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'multiple',
  question: '导游的执业权利包括？',
  options: { A: '人格尊严不受侵犯', B: '获得劳动报酬', C: '拒绝违法指令', D: '参加职业培训' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均属于导游的执业权利。',
  difficulty: 'medium'
},

// --- 旅游法基础知识 ---
{
  id: 22,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '《中华人民共和国旅游法》正式施行日期是？',
  options: { A: '2013年1月1日', B: '2013年10月1日', C: '2014年1月1日', D: '2016年10月1日' },
  answer: 'B',
  explanation: '《旅游法》于2013年4月25日通过，自2013年10月1日起施行。',
  difficulty: 'hard'
},
{
  id: 23,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅行社业务经营许可证的有效期为？',
  options: { A: '3年', B: '5年', C: '1年', D: '终身有效' },
  answer: 'A',
  explanation: '旅行社业务经营许可证有效期为3年。',
  difficulty: 'medium'
},
{
  id: 24,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '设立旅行社，注册资本最低限额为？',
  options: { A: '30万元', B: '50万元', C: '100万元', D: '200万元' },
  answer: 'A',
  explanation: '《旅游法》规定，设立旅行社应当具备不少于30万元的注册资本。',
  difficulty: 'medium'
},
{
  id: 25,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '导游私自承揽导游业务的，处多少罚款？',
  options: { A: '一千元以上一万元以下', B: '一千元以上三千元以下', C: '三千元以上一万元以下', D: '一万元以上三万元以下' },
  answer: 'A',
  explanation: '《旅游法》第102条规定：导游私自承揽导游业务的，处一千元以上一万元以下罚款。',
  difficulty: 'hard'
},
{
  id: 26,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅行社招徕旅游者组团旅游，因未达到约定人数不能出团的，境内旅游应当至少提前多少日通知旅游者？',
  options: { A: '3日', B: '7日', C: '15日', D: '30日' },
  answer: 'B',
  explanation: '《旅游法》第63条规定：境内旅游应当至少提前7日通知旅游者，出境旅游应当至少提前30日通知。',
  difficulty: 'medium'
},
{
  id: 27,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '因不可抗力影响旅游行程，旅游者解除合同的，旅行社扣除什么费用后，将余款退还？',
  options: { A: '全部费用', B: '已实际发生的费用', C: '一半费用', D: '违约金' },
  answer: 'B',
  explanation: '《旅游法》第67条规定：因不可抗力影响旅游行程，旅游者解除合同的，旅行社扣除已实际发生的费用后，将余款退还。',
  difficulty: 'medium'
},
{
  id: 28,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅行社应当按照规定缴纳什么，用于旅游者权益损害赔偿和紧急救助？',
  options: { A: '风险抵押金', B: '旅游服务质量保证金', C: '信誉保证金', D: '安全保障金' },
  answer: 'B',
  explanation: '《旅游法》第31条规定：旅行社应当按照规定缴纳旅游服务质量保证金。',
  difficulty: 'medium'
},
{
  id: 29,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅游经营者应当对其提供的产品和服务进行哪种安全检验？',
  options: { A: '定期检验', B: '抽查检验', C: '一次性检验', D: '无需检验' },
  answer: 'A',
  explanation: '旅游经营者应当对其提供的产品和服务进行定期安全检验，确保安全。',
  difficulty: 'medium'
},
{
  id: 30,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅游主管部门在接到旅游者的投诉后，应当在多长时间内作出处理？',
  options: { A: '5个工作日', B: '7个工作日', C: '15个工作日', D: '30个工作日' },
  answer: 'B',
  explanation: '旅游主管部门在接到旅游者的投诉后，应当在7个工作日内作出处理。',
  difficulty: 'hard'
},
{
  id: 31,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'multiple',
  question: '旅行社可以经营的业务包括？',
  options: { A: '境内旅游', B: '出境旅游', C: '入境旅游', D: '边境旅游' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '旅行社可以经营境内旅游、出境旅游、边境旅游、入境旅游和其他旅游业务。',
  difficulty: 'medium'
},
{
  id: 32,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'multiple',
  question: '旅游者在旅游活动中应当履行的义务包括？',
  options: { A: '遵守社会公共秩序和社会公德', B: '尊重当地风俗习惯和文化传统', C: '爱护旅游资源，保护生态环境', D: '遵守旅游文明行为规范' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为《旅游法》规定的旅游者在旅游活动中应当履行的义务。',
  difficulty: 'easy'
},
{
  id: 33,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'multiple',
  question: '旅游经营者应当就哪些事项以明示方式事先向旅游者作出说明或警示？',
  options: { A: '正确使用相关设施设备的方法', B: '必要的安全防范和应急措施', C: '未向旅游者开放的场所和设施', D: '可能危及人身财产安全的情形' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均为旅游经营者应当事先说明或警示的事项。',
  difficulty: 'medium'
},

// --- 合同法律制度 ---
{
  id: 34,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '依法成立的合同，对谁具有法律约束力？',
  options: { A: '当事人', B: '第三人', C: '所有人', D: '仅对债权人' },
  answer: 'A',
  explanation: '依法成立的合同，对当事人具有法律约束力。',
  difficulty: 'easy'
},
{
  id: 35,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '当事人订立合同，应当具有相应的？',
  options: { A: '民事权利能力', B: '民事行为能力', C: '民事权利能力和民事行为能力', D: '法人资格' },
  answer: 'C',
  explanation: '当事人订立合同，应当具有相应的民事权利能力和民事行为能力。',
  difficulty: 'medium'
},
{
  id: 36,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '下列哪项不属于违约责任的承担方式？',
  options: { A: '继续履行', B: '采取补救措施', C: '赔偿损失', D: '赔礼道歉' },
  answer: 'D',
  explanation: '赔礼道歉属于侵权责任的承担方式，不属于违约责任。',
  difficulty: 'medium'
},
{
  id: 37,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '因不可抗力不能履行合同的，部分或者全部免除责任，但什么另有规定的除外？',
  options: { A: '法律', B: '当事人约定', C: '合同', D: '法院判决' },
  answer: 'A',
  explanation: '因不可抗力不能履行合同的，部分或者全部免除责任，但法律另有规定的除外。',
  difficulty: 'medium'
},
{
  id: 38,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '格式条款和非格式条款不一致的，应当采用？',
  options: { A: '格式条款', B: '非格式条款', C: '由法院决定', D: '由当事人协商' },
  answer: 'B',
  explanation: '格式条款和非格式条款不一致的，应当采用非格式条款。',
  difficulty: 'medium'
},
{
  id: 39,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'multiple',
  question: '合同的内容一般包括哪些条款？',
  options: { A: '当事人名称或姓名和住所', B: '标的', C: '数量和质量', D: '价款或者报酬' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为合同一般应当包括的主要条款。',
  difficulty: 'easy'
},

// --- 侵权责任与旅游安全 ---
{
  id: 40,
  subject: 'policy',
  chapter: 'policy-5',
  type: 'single',
  question: '行为人因过错侵害他人民事权益，应当承担？',
  options: { A: '侵权责任', B: '违约责任', C: '行政责任', D: '刑事责任' },
  answer: 'A',
  explanation: '行为人因过错侵害他人民事权益，应当承担侵权责任。',
  difficulty: 'easy'
},
{
  id: 41,
  subject: 'policy',
  chapter: 'policy-5',
  type: 'single',
  question: '因第三人的行为造成他人损害，管理人未尽到安全保障义务的，承担什么责任？',
  options: { A: '全部责任', B: '连带责任', C: '相应的补充责任', D: '不承担责任' },
  answer: 'C',
  explanation: '因第三人的行为造成他人损害的，由第三人承担侵权责任；管理人未尽到安全保障义务的，承担相应的补充责任。',
  difficulty: 'hard'
},
{
  id: 42,
  subject: 'policy',
  chapter: 'policy-5',
  type: 'multiple',
  question: '承担侵权责任的方式主要有？',
  options: { A: '停止侵害', B: '排除妨碍', C: '消除危险', D: '返还财产' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为侵权责任的承担方式。',
  difficulty: 'easy'
},
{
  id: 43,
  subject: 'policy',
  chapter: 'policy-5',
  type: 'single',
  question: '侵害他人造成人身损害的，应当赔偿的项目不包括？',
  options: { A: '医疗费', B: '护理费', C: '误工费', D: '第三者精神损失费' },
  answer: 'D',
  explanation: '侵害他人造成人身损害的，应当赔偿医疗费、护理费、误工费等，不包括第三者精神损失费。',
  difficulty: 'medium'
},

// --- 政策-判断题 ---
{
  id: 44,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '中华人民共和国国旗是五星红旗。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '《宪法》第141条规定：中华人民共和国国旗是五星红旗。',
  difficulty: 'easy'
},
{
  id: 45,
  subject: 'policy',
  chapter: 'policy-1',
  type: 'single',
  question: '全国人民代表大会常务委员会是我国最高国家行政机关。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '我国最高国家行政机关是国务院，全国人大常委会是最高国家权力机关的常设机关。',
  difficulty: 'easy'
},
{
  id: 46,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游人员进行导游活动，必须经旅行社委派。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '《旅游法》第102条规定：导游进行导游活动，必须经旅行社委派。',
  difficulty: 'easy'
},
{
  id: 47,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游人员可以在旅游活动中擅自变更接待计划。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '导游不得擅自变更接待计划，遇紧急情形应当征得多数旅游者同意并及时报告旅行社。',
  difficulty: 'medium'
},
{
  id: 48,
  subject: 'policy',
  chapter: 'policy-2',
  type: 'single',
  question: '导游人员可以以明示或暗示方式向旅游者索要小费。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '导游人员不得以明示或暗示的方式向旅游者索要小费。',
  difficulty: 'medium'
},
{
  id: 49,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅行社可以低于成本的价格招徕旅游者。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '《旅游法》禁止旅行社以低于成本的价格招徕、组织、接待旅游者。',
  difficulty: 'medium'
},
{
  id: 50,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅游者购买旅游服务时，应当向旅游经营者如实告知与旅游活动相关的个人健康信息。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '这是《旅游法》规定的旅游者义务之一。',
  difficulty: 'medium'
},
{
  id: 51,
  subject: 'policy',
  chapter: 'policy-4',
  type: 'single',
  question: '当事人订立合同，有书面形式、口头形式和其他形式。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '《合同法》规定，当事人订立合同有书面形式、口头形式和其他形式。',
  difficulty: 'easy'
},
{
  id: 52,
  subject: 'policy',
  chapter: 'policy-5',
  type: 'single',
  question: '因不可抗力造成他人损害的，不承担责任，但法律另有规定的除外。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '不可抗力是侵权责任的免责事由之一。',
  difficulty: 'medium'
},
{
  id: 53,
  subject: 'policy',
  chapter: 'policy-3',
  type: 'single',
  question: '旅游者在人身、财产安全遇有危险时，有权请求旅游经营者进行及时救助。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '这是《旅游法》规定的旅游者的基本权利之一。',
  difficulty: 'easy'
},

// ======================================================================
// 二、导游业务（business）- 55题
// ======================================================================

// --- 导游服务概述 ---
{
  id: 54,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '现代导游服务产生于哪个时期？',
  options: { A: '18世纪中期', B: '19世纪中期', C: '20世纪初期', D: '20世纪中期' },
  answer: 'B',
  explanation: '现代导游服务产生于19世纪中期，以托马斯·库克1841年组织的第一次商业旅游活动为标志。',
  difficulty: 'hard'
},
{
  id: 55,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '导游服务的核心是？',
  options: { A: '讲解服务', B: '语言服务', C: '向导服务', D: '文化传播' },
  answer: 'A',
  explanation: '讲解服务是导游服务的核心，也是导游人员最重要的职责之一。',
  difficulty: 'easy'
},
{
  id: 56,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '导游服务的性质不包括？',
  options: { A: '社会性', B: '文化性', C: '经济性', D: '政治性' },
  answer: 'D',
  explanation: '导游服务的性质包括社会性、文化性、服务性、经济性和涉外性，不包括政治性。',
  difficulty: 'medium'
},
{
  id: 57,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '导游服务的三个基本要素是？',
  options: { A: '语言、知识、技能', B: '语言、知识、服务', C: '语言、技能、态度', D: '知识、技能、态度' },
  answer: 'A',
  explanation: '语言、知识、技能是导游服务的三个基本要素。',
  difficulty: 'medium'
},
{
  id: 58,
  subject: 'business',
  chapter: 'business-1',
  type: 'multiple',
  question: '导游服务的特点包括？',
  options: { A: '独立性强', B: '脑体高度结合', C: '关联度高', D: '复杂多变' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均为导游服务的特点。',
  difficulty: 'medium'
},

// --- 导游人员 ---
{
  id: 59,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '导游人员按业务范围划分，不包括？',
  options: { A: '全程陪同导游人员', B: '地方陪同导游人员', C: '景区景点导游人员', D: '国际导游人员' },
  answer: 'D',
  explanation: '导游人员按业务范围分为全程陪同导游人员、地方陪同导游人员和景区景点导游人员。',
  difficulty: 'medium'
},
{
  id: 60,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '全陪导游员的主要职责是？',
  options: { A: '负责某地旅游活动的安排', B: '实施旅游接待计划，协调领队、地陪等各方关系', C: '负责景区景点讲解', D: '负责游客出入境手续' },
  answer: 'B',
  explanation: '全陪导游员（全程陪同导游）的主要职责是实施旅游接待计划，协调领队、地陪等各方关系。',
  difficulty: 'medium'
},
{
  id: 61,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '地陪导游员的主要职责是？',
  options: { A: '负责整个旅游团的行程协调', B: '安排旅游活动，做好接待工作', C: '负责出入境手续', D: '负责旅游购物推荐' },
  answer: 'B',
  explanation: '地陪导游员（地方陪同导游）的主要职责是安排旅游活动，做好当地接待工作。',
  difficulty: 'medium'
},
{
  id: 62,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '导游人员的基本素质要求不包括？',
  options: { A: '良好的思想品德', B: '渊博的知识', C: '较强的独立工作能力', D: '精通所有外语' },
  answer: 'D',
  explanation: '导游人员的基本素质包括思想品德、知识储备、独立工作能力、身体健康等，但不要求精通所有外语。',
  difficulty: 'easy'
},
{
  id: 63,
  subject: 'business',
  chapter: 'business-2',
  type: 'multiple',
  question: '导游人员应具备的知识素养包括？',
  options: { A: '语言知识', B: '史地文化知识', C: '政策法规知识', D: '心理学知识' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四类知识均为导游人员应具备的知识素养。',
  difficulty: 'medium'
},

// --- 导游服务程序 ---
{
  id: 64,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '地陪导游员接团前，应提前多长时间到达接站地点？',
  options: { A: '15分钟', B: '30分钟', C: '1小时', D: '2小时' },
  answer: 'B',
  explanation: '地陪导游员应提前30分钟到达接站地点，迎接旅游团。',
  difficulty: 'medium'
},
{
  id: 65,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '导游员在接团时，应持什么标志物接站？',
  options: { A: '导游旗', B: '旅行社标牌', C: '导游旗或接站牌', D: '鲜花' },
  answer: 'C',
  explanation: '导游员接站时应高举导游旗或接站牌，以便旅游者辨认。',
  difficulty: 'easy'
},
{
  id: 66,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '地陪导游员在首次沿途导游时，应最先介绍的是什么？',
  options: { A: '当地的历史文化', B: '当地的风俗习惯', C: '沿途风光', D: '下榻饭店概况' },
  answer: 'C',
  explanation: '首次沿途导游，导游员应最先介绍沿途风光，让旅游者对当地建立初步印象。',
  difficulty: 'medium'
},
{
  id: 67,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '旅游团入住饭店时，地陪导游员应协助办理什么手续？',
  options: { A: '购物手续', B: '入住登记手续', C: '参观手续', D: '离店手续' },
  answer: 'B',
  explanation: '旅游团抵达饭店后，地陪导游员应协助领队和全陪办理入住登记手续。',
  difficulty: 'easy'
},
{
  id: 68,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '在旅游团离站前，地陪导游员应提前确认什么？',
  options: { A: '旅游团人数', B: '交通票据和离站时间', C: '旅游团意见', D: '购物清单' },
  answer: 'B',
  explanation: '在旅游团离站前，地陪导游员应提前确认交通票据和离站时间，确保顺利离站。',
  difficulty: 'medium'
},
{
  id: 69,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '全陪导游员在旅游团行程中，应做好什么工作？',
  options: { A: '仅负责讲解', B: '监督接待计划的实施，协调联络', C: '仅负责住宿安排', D: '仅负责购物安排' },
  answer: 'B',
  explanation: '全陪导游员应监督接待计划的实施，做好各站之间的协调联络工作。',
  difficulty: 'medium'
},
{
  id: 70,
  subject: 'business',
  chapter: 'business-3',
  type: 'multiple',
  question: '地陪导游员上团前的准备工作包括？',
  options: { A: '熟悉接待计划', B: '落实接待事宜', C: '准备导游旗和接站牌', D: '准备少量现金' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均为地陪导游员上团前应该做的准备工作。',
  difficulty: 'medium'
},
{
  id: 71,
  subject: 'business',
  chapter: 'business-3',
  type: 'multiple',
  question: '旅游团结束当地行程离站时，地陪导游员应做好的工作包括？',
  options: { A: '核实交通票据', B: '办理离站手续', C: '结清账目', D: '征求意见和建议' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为地陪导游员在送团时应做好的工作。',
  difficulty: 'medium'
},

// --- 导游带团技能 ---
{
  id: 72,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '导游员在带团过程中，应如何处理与领队的关系？',
  options: { A: '完全听从领队', B: '尊重领队，支持其工作', C: '忽视领队的存在', D: '与领队对立' },
  answer: 'B',
  explanation: '导游员应尊重领队，支持其工作，维护团结，共同做好服务。',
  difficulty: 'easy'
},
{
  id: 73,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '面对旅游团中个别游客提出的不合理要求，导游员应？',
  options: { A: '一律拒绝', B: '耐心解释，说明情况', C: '隐瞒真相', D: '立即满足' },
  answer: 'B',
  explanation: '对不合理要求，导游员应耐心解释，说明情况，争取游客的理解。',
  difficulty: 'medium'
},
{
  id: 74,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '旅游团中发生矛盾时，导游员应采取什么态度？',
  options: { A: '偏袒一方', B: '不闻不问', C: '保持中立，调解矛盾', D: '严厉批评' },
  answer: 'C',
  explanation: '发生矛盾时，导游员应保持中立态度，积极调解，化解矛盾。',
  difficulty: 'easy'
},
{
  id: 75,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '导游员在带团时，应如何把握旅游节奏？',
  options: { A: '越快越好', B: '越慢越好', C: '张弛有度，劳逸结合', D: '完全由游客决定' },
  answer: 'C',
  explanation: '导游员应合理安排行程，张弛有度，劳逸结合，保证旅游质量。',
  difficulty: 'easy'
},
{
  id: 76,
  subject: 'business',
  chapter: 'business-4',
  type: 'multiple',
  question: '导游员调节游客情绪的方法包括？',
  options: { A: '补偿法', B: '转移注意法', C: '分析法', D: '暗示法' },
  answer: ['A', 'B', 'C'],
  explanation: '补偿法、转移注意法、分析法是导游员常用的调节游客情绪的方法。',
  difficulty: 'hard'
},

// --- 导游语言技能 ---
{
  id: 77,
  subject: 'business',
  chapter: 'business-5',
  type: 'single',
  question: '导游语言的表达原则不包括？',
  options: { A: '准确性', B: '鲜明性', C: '生动性', D: '模糊性' },
  answer: 'D',
  explanation: '导游语言应遵循准确性、鲜明性、生动性等原则，不包括模糊性。',
  difficulty: 'medium'
},
{
  id: 78,
  subject: 'business',
  chapter: 'business-5',
  type: 'single',
  question: '导游员在讲解时，语速一般应控制在每分钟多少字为宜？',
  options: { A: '100字左右', B: '150-200字', C: '250-300字', D: '350字以上' },
  answer: 'B',
  explanation: '导游员讲解时语速一般控制在每分钟150-200字为宜，既要清晰又要让游客听得舒服。',
  difficulty: 'hard'
},
{
  id: 79,
  subject: 'business',
  chapter: 'business-5',
  type: 'single',
  question: '导游讲解中"虚实结合"的"实"指的是？',
  options: { A: '虚构的故事', B: '客观存在的实体', C: '导游的想象', D: '游客的猜测' },
  answer: 'B',
  explanation: '"虚实结合"中"实"指客观存在的实体、实物、史实等，"虚"指与实体相关的传说、故事等。',
  difficulty: 'medium'
},
{
  id: 80,
  subject: 'business',
  chapter: 'business-5',
  type: 'single',
  question: '导游员在讲解过程中，目光应如何分配？',
  options: { A: '始终注视前方', B: '始终注视一个游客', C: '环视全体游客，兼顾各方', D: '不看游客' },
  answer: 'C',
  explanation: '导游员讲解时目光应环视全体游客，兼顾各方，使每位游客都感受到关注。',
  difficulty: 'easy'
},
{
  id: 81,
  subject: 'business',
  chapter: 'business-5',
  type: 'multiple',
  question: '导游讲解常用的方法包括？',
  options: { A: '概述法', B: '分段讲解法', C: '突出重点法', D: '问答法' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为导游讲解的常用方法。',
  difficulty: 'medium'
},

// --- 导游讲解技能 ---
{
  id: 82,
  subject: 'business',
  chapter: 'business-6',
  type: 'single',
  question: '分段讲解法适用于什么类型的景点？',
  options: { A: '小型景点', B: '面积极大的景点', C: '室内景点', D: '现代建筑' },
  answer: 'B',
  explanation: '分段讲解法适用于面积极大、内容丰富的景点，将景点分为若干部分分别讲解。',
  difficulty: 'medium'
},
{
  id: 83,
  subject: 'business',
  chapter: 'business-6',
  type: 'single',
  question: '导游员讲解时，将两种相似或相近的事物进行比较，以突出特征的讲解方法称为？',
  options: { A: '类比法', B: '对比法', C: '引用法', D: '分析法' },
  answer: 'A',
  explanation: '类比法是将相似或相近的事物进行比较，帮助游客理解和记忆的讲解方法。',
  difficulty: 'medium'
},
{
  id: 84,
  subject: 'business',
  chapter: 'business-6',
  type: 'single',
  question: '在讲解中设置悬念，引导游客思考的讲解方法称为？',
  options: { A: '问答法', B: '悬念法', C: '类比法', D: '突出重点法' },
  answer: 'B',
  explanation: '悬念法是导游员在讲解中设置悬念，引起游客好奇心，再解答的讲解方法。',
  difficulty: 'medium'
},
{
  id: 85,
  subject: 'business',
  chapter: 'business-6',
  type: 'single',
  question: '导游员在讲解中使用数字、数据进行说明，以增强说服力的方法称为？',
  options: { A: '引用法', B: '数字法', C: '数据法', D: '概述法' },
  answer: 'B',
  explanation: '数字法（或称数据法）是运用数字和数据进行说明，使讲解更加具体、有说服力。',
  difficulty: 'medium'
},

// --- 游客个别要求处理 ---
{
  id: 86,
  subject: 'business',
  chapter: 'business-7',
  type: 'single',
  question: '游客要求自由活动，在什么情况下导游员可以同意？',
  options: { A: '旅游团即将离开当地', B: '存在安全隐患', C: '不影响整体行程安排', D: '游客要求购买违禁品' },
  answer: 'C',
  explanation: '游客要求自由活动，在不影响整体行程安排、不涉及安全问题时，导游员可以同意。',
  difficulty: 'medium'
},
{
  id: 87,
  subject: 'business',
  chapter: 'business-7',
  type: 'single',
  question: '游客要求更换房间，导游员应如何处理？',
  options: { A: '不予理睬', B: '立即更换', C: '了解原因，视情况协助解决', D: '要求游客自行解决' },
  answer: 'C',
  explanation: '游客要求更换房间时，导游员应了解原因，视情况协助与饭店沟通解决。',
  difficulty: 'easy'
},
{
  id: 88,
  subject: 'business',
  chapter: 'business-7',
  type: 'single',
  question: '游客要求转递物品，导游员应如何处理？',
  options: { A: '立即答应', B: '婉言拒绝', C: '要求支付费用后答应', D: '转交他人代送' },
  answer: 'B',
  explanation: '游客要求转递物品，导游员原则上应婉言拒绝，建议游客通过正规渠道办理。',
  difficulty: 'medium'
},
{
  id: 89,
  subject: 'business',
  chapter: 'business-7',
  type: 'single',
  question: '游客要求增加游览项目，导游员应？',
  options: { A: '立即同意', B: '拒绝并批评', C: '在不影响计划的前提下，报旅行社同意后可安排', D: '要求游客自行前往' },
  answer: 'C',
  explanation: '游客要求增加游览项目，在不影响原计划前提下，经旅行社同意，可安排加游项目。',
  difficulty: 'medium'
},
{
  id: 90,
  subject: 'business',
  chapter: 'business-7',
  type: 'multiple',
  question: '导游员处理游客个别要求的原则包括？',
  options: { A: '合理而可能的原则', B: '认真倾听、耐心解释', C: '尊重游客、不卑不亢', D: '不计较、不报复' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为导游员处理游客个别要求时应遵循的原则。',
  difficulty: 'medium'
},

// --- 旅游事故处理 ---
{
  id: 91,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '旅游团中游客走失，导游员首先应？',
  options: { A: '立即报警', B: '立即寻找', C: '了解情况，迅速寻找', D: '通知旅行社' },
  answer: 'C',
  explanation: '发现游客走失，导游员应首先了解情况，迅速寻找，同时通知景点工作人员协助。',
  difficulty: 'medium'
},
{
  id: 92,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '游客在旅游过程中突发疾病，导游员应首先？',
  options: { A: '自行用药', B: '立即拨打120急救电话，同时报告旅行社', C: '继续行程', D: '等待游客自行恢复' },
  answer: 'B',
  explanation: '游客突发疾病，导游员应立即拨打120急救电话，同时报告旅行社，并保留好诊断证明。',
  difficulty: 'medium'
},
{
  id: 93,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '旅游交通事故处理中，导游员首先应？',
  options: { A: '与旅行社联系', B: '组织抢救伤员', C: '保护现场', D: '寻找目击证人' },
  answer: 'B',
  explanation: '发生交通事故时，导游员应立即组织抢救伤员，同时报警并保护现场。',
  difficulty: 'medium'
},
{
  id: 94,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '旅游火灾事故中，导游员应如何引导游客疏散？',
  options: { A: '乘坐电梯', B: '走安全通道', C: '跳楼逃生', D: '原地等待救援' },
  answer: 'B',
  explanation: '火灾发生时，导游员应引导游客走安全通道疏散，切勿乘坐电梯。',
  difficulty: 'easy'
},
{
  id: 95,
  subject: 'business',
  chapter: 'business-8',
  type: 'multiple',
  question: '导游员处理旅游安全事故的原则包括？',
  options: { A: '以人为本，生命第一', B: '及时报告，妥善处置', C: '保护现场，保全证据', D: '做好善后，安抚游客' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上四项均为旅游安全事故处理的基本原则。',
  difficulty: 'medium'
},

// --- 导游业务-判断题 ---
{
  id: 96,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '导游服务是旅游服务中最具代表性的服务。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '导游服务是旅游服务中最具代表性的服务，贯穿旅游活动的全过程。',
  difficulty: 'easy'
},
{
  id: 97,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '全陪导游员的主要职责是负责某地旅游活动的安排。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '全陪导游员负责全程协调，地方旅游活动的安排是地陪导游员的职责。',
  difficulty: 'medium'
},
{
  id: 98,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '地陪导游员在接团前应提前30分钟到达接站地点。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '地陪导游员应提前30分钟到达接站地点迎接旅游团。',
  difficulty: 'easy'
},
{
  id: 99,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '导游员带团时，应尽量满足游客的所有要求。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '导游员应满足合理而可能的要求，不合理的要求应耐心解释拒绝。',
  difficulty: 'easy'
},
{
  id: 100,
  subject: 'business',
  chapter: 'business-5',
  type: 'single',
  question: '导游讲解时，语速越快越好，可以节省时间。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '导游讲解语速应适中，以每分钟150-200字为宜，过快会影响游客理解。',
  difficulty: 'easy'
},
{
  id: 101,
  subject: 'business',
  chapter: 'business-6',
  type: 'single',
  question: '"虚实结合"的讲解方法中，"虚"指的是与实体相关的传说、故事等。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '"虚实结合"中"虚"指与景点实体相关的神话传说、民间故事、历史典故等。',
  difficulty: 'medium'
},
{
  id: 102,
  subject: 'business',
  chapter: 'business-7',
  type: 'single',
  question: '游客要求自由活动时，任何情况下导游员都可以同意。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '在存在安全隐患或影响整体行程时，导游员不应同意游客自由活动。',
  difficulty: 'medium'
},
{
  id: 103,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '游客在旅游过程中丢失证件，导游员应协助游客到有关部门挂失补办。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '游客丢失证件，导游员应协助到公安部门或相关部门挂失并补办手续。',
  difficulty: 'medium'
},
{
  id: 104,
  subject: 'business',
  chapter: 'business-8',
  type: 'single',
  question: '发生旅游安全事故时，导游员应先处理完事故再报告旅行社。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '发生安全事故时，导游员应在组织抢救的同时立即报告旅行社。',
  difficulty: 'medium'
},
{
  id: 105,
  subject: 'business',
  chapter: 'business-1',
  type: 'single',
  question: '导游服务具有经济属性，可以为旅游业创收。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '导游服务的经济性体现在通过导游服务可以促进旅游消费，为旅游业创收。',
  difficulty: 'easy'
},
{
  id: 106,
  subject: 'business',
  chapter: 'business-4',
  type: 'single',
  question: '导游员在处理旅游团内部矛盾时，应保持中立态度。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '导游员应保持中立，不偏袒任何一方，积极调解矛盾。',
  difficulty: 'easy'
},
{
  id: 107,
  subject: 'business',
  chapter: 'business-3',
  type: 'single',
  question: '地陪导游员在送团时，应提前确认交通票据和离站时间。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '送团前确认交通票据和离站时间是地陪导游员的重要职责。',
  difficulty: 'easy'
},
{
  id: 108,
  subject: 'business',
  chapter: 'business-2',
  type: 'single',
  question: '导游人员的基本素质要求包括良好的思想品德、渊博的知识和较强的独立工作能力。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '导游人员应具备良好的思想品德、渊博的知识、较强的独立工作能力和健康的体魄。',
  difficulty: 'easy'
},

// ======================================================================
// 三、全国导游基础知识（national）- 55题
// ======================================================================

// --- 中国历史文化 ---
{
  id: 109,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '中国历史上第一个统一的中央集权封建国家是？',
  options: { A: '夏朝', B: '商朝', C: '秦朝', D: '汉朝' },
  answer: 'C',
  explanation: '公元前221年，秦始皇统一六国，建立了中国历史上第一个统一的中央集权封建国家——秦朝。',
  difficulty: 'easy'
},
{
  id: 110,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '"文景之治"指的是哪个朝代的盛世？',
  options: { A: '秦朝', B: '西汉', C: '东汉', D: '唐朝' },
  answer: 'B',
  explanation: '"文景之治"是西汉文帝刘恒和景帝刘启统治时期出现的太平盛世。',
  difficulty: 'medium'
},
{
  id: 111,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '中国封建社会最后一个盛世"康乾盛世"发生在哪个朝代？',
  options: { A: '明朝', B: '清朝', C: '元朝', D: '宋朝' },
  answer: 'B',
  explanation: '"康乾盛世"是清朝康熙、雍正、乾隆三朝时期出现的繁荣盛世。',
  difficulty: 'medium'
},
{
  id: 112,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '被后世尊为"书圣"的书法家是？',
  options: { A: '颜真卿', B: '柳公权', C: '王羲之', D: '欧阳询' },
  answer: 'C',
  explanation: '王羲之是东晋著名书法家，被誉为"书圣"，代表作《兰亭集序》被誉为"天下第一行书"。',
  difficulty: 'easy'
},
{
  id: 113,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '被称为"史家之绝唱，无韵之离骚"的著作是？',
  options: { A: '《汉书》', B: '《资治通鉴》', C: '《史记》', D: '《春秋》' },
  answer: 'C',
  explanation: '《史记》是司马迁所著，被鲁迅誉为"史家之绝唱，无韵之离骚"。',
  difficulty: 'easy'
},
{
  id: 114,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '中国古代四大发明不包括？',
  options: { A: '造纸术', B: '印刷术', C: '地动仪', D: '火药' },
  answer: 'C',
  explanation: '四大发明是造纸术、印刷术、火药和指南针，地动仪不属于四大发明。',
  difficulty: 'easy'
},
{
  id: 115,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '科举制度创立于哪个朝代？',
  options: { A: '汉朝', B: '隋朝', C: '唐朝', D: '宋朝' },
  answer: 'B',
  explanation: '科举制度创立于隋朝，完善于唐朝，是古代中国选拔官员的重要制度。',
  difficulty: 'hard'
},
{
  id: 116,
  subject: 'national',
  chapter: 'national-1',
  type: 'multiple',
  question: '下列属于儒家思想代表人物的有？',
  options: { A: '孔子', B: '孟子', C: '荀子', D: '韩非子' },
  answer: ['A', 'B', 'C'],
  explanation: '孔子、孟子、荀子是儒家代表人物，韩非子是法家代表人物。',
  difficulty: 'medium'
},

// --- 中国民族与宗教 ---
{
  id: 117,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '中国共有多少个民族？',
  options: { A: '55个', B: '56个', C: '57个', D: '54个' },
  answer: 'B',
  explanation: '中国共有56个民族，包括汉族和55个少数民族。',
  difficulty: 'easy'
},
{
  id: 118,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '中国人口最多的少数民族是？',
  options: { A: '壮族', B: '回族', C: '满族', D: '维吾尔族' },
  answer: 'A',
  explanation: '壮族是中国人口最多的少数民族，主要分布在广西壮族自治区。',
  difficulty: 'easy'
},
{
  id: 119,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '佛教传入中国的时间大约是？',
  options: { A: '西汉末年', B: '东汉末年', C: '魏晋南北朝', D: '唐朝' },
  answer: 'A',
  explanation: '佛教于西汉末年传入中国，东汉时期开始广泛传播。',
  difficulty: 'hard'
},
{
  id: 120,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '中国四大佛教名山不包括？',
  options: { A: '五台山', B: '峨眉山', C: '武当山', D: '普陀山' },
  answer: 'C',
  explanation: '四大佛教名山是山西五台山、四川峨眉山、浙江普陀山、安徽九华山。武当山是道教名山。',
  difficulty: 'medium'
},
{
  id: 121,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '道教是中国土生土长的宗教，其创始人是？',
  options: { A: '老子', B: '庄子', C: '张道陵', D: '葛洪' },
  answer: 'C',
  explanation: '道教创始人是东汉时期的张道陵（张天师），老子被尊为道教的道祖。',
  difficulty: 'hard'
},
{
  id: 122,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '伊斯兰教在中国的主要传播途径是？',
  options: { A: '陆上丝绸之路', B: '海上丝绸之路', C: '海上丝绸之路和陆上丝绸之路', D: '传教士来华' },
  answer: 'C',
  explanation: '伊斯兰教通过海上丝绸之路和陆上丝绸之路两条途径传入中国。',
  difficulty: 'hard'
},
{
  id: 123,
  subject: 'national',
  chapter: 'national-2',
  type: 'multiple',
  question: '下列属于中国少数民族传统节日的有？',
  options: { A: '泼水节（傣族）', B: '那达慕大会（蒙古族）', C: '火把节（彝族）', D: '古尔邦节（回族、维吾尔族等）' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为少数民族的传统节日。',
  difficulty: 'medium'
},

// --- 中国古代建筑 ---
{
  id: 124,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '中国现存规模最大、保存最完整的古代宫殿建筑群是？',
  options: { A: '沈阳故宫', B: '北京故宫', C: '布达拉宫', D: '颐和园' },
  answer: 'B',
  explanation: '北京故宫是世界上现存规模最大、保存最完整的木质结构古建筑群。',
  difficulty: 'easy'
},
{
  id: 125,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '中国古建筑中，屋顶形式等级最高的是？',
  options: { A: '歇山顶', B: '悬山顶', C: '庑殿顶', D: '硬山顶' },
  answer: 'C',
  explanation: '庑殿顶是中国古建筑中等级最高的屋顶形式，多用于皇宫和庙宇主殿。',
  difficulty: 'hard'
},
{
  id: 126,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '中国现存最古老、最高大的木结构塔式建筑是？',
  options: { A: '西安大雁塔', B: '应县木塔', C: '杭州六和塔', D: '大理崇圣寺三塔' },
  answer: 'B',
  explanation: '应县木塔（佛宫寺释迦塔）位于山西应县，是世界上现存最古老、最高大的木结构塔式建筑。',
  difficulty: 'medium'
},
{
  id: 127,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '中国古建筑中，"斗拱"的主要作用是？',
  options: { A: '装饰', B: '承重和传递荷载', C: '通风', D: '采光' },
  answer: 'B',
  explanation: '斗拱是中国古建筑中特有的结构构件，主要作用是承重和传递荷载。',
  difficulty: 'medium'
},
{
  id: 128,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '被誉为"世界第八大奇迹"的是？',
  options: { A: '万里长城', B: '秦始皇陵兵马俑', C: '敦煌莫高窟', D: '乐山大佛' },
  answer: 'B',
  explanation: '秦始皇陵兵马俑位于陕西西安，被誉为"世界第八大奇迹"。',
  difficulty: 'easy'
},
{
  id: 129,
  subject: 'national',
  chapter: 'national-3',
  type: 'multiple',
  question: '中国古代建筑的基本特点包括？',
  options: { A: '以木结构为主', B: '讲究对称布局', C: '注重与自然环境的协调', D: '使用大屋顶' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为中国古代建筑的基本特点。',
  difficulty: 'medium'
},

// --- 中国古典园林 ---
{
  id: 130,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '中国古典园林中，被称为"皇家园林博物馆"的是？',
  options: { A: '颐和园', B: '圆明园', C: '承德避暑山庄', D: '北海公园' },
  answer: 'A',
  explanation: '颐和园是中国现存规模最大、保存最完整的皇家园林，被誉为"皇家园林博物馆"。',
  difficulty: 'medium'
},
{
  id: 131,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '苏州四大名园不包括？',
  options: { A: '拙政园', B: '留园', C: '网师园', D: '颐和园' },
  answer: 'D',
  explanation: '苏州四大名园包括拙政园、留园、网师园、狮子林。颐和园是北京皇家园林。',
  difficulty: 'medium'
},
{
  id: 132,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '中国古典园林构景手法中，"借景"指的是？',
  options: { A: '将园内景物相互借用', B: '将园外景物引入园内视野', C: '在景观中设置框景', D: '通过障景增加层次感' },
  answer: 'B',
  explanation: '借景是将园外的景物有意识地纳入园内视野范围，扩大空间感。',
  difficulty: 'medium'
},
{
  id: 133,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '中国古典园林的四大要素是？',
  options: { A: '山、水、花、木', B: '山、水、建筑、植物', C: '山、水、亭、台', D: '建筑、植物、假山、水池' },
  answer: 'B',
  explanation: '中国古典园林的四大要素是山（叠山）、水（理水）、建筑、植物。',
  difficulty: 'medium'
},
{
  id: 134,
  subject: 'national',
  chapter: 'national-4',
  type: 'multiple',
  question: '中国古典园林按占有者身份可分为？',
  options: { A: '皇家园林', B: '私家园林', C: '寺观园林', D: '公共园林' },
  answer: ['A', 'B', 'C'],
  explanation: '中国古典园林按占有者身份分为皇家园林、私家园林、寺观园林三类。',
  difficulty: 'medium'
},

// --- 中国饮食文化 ---
{
  id: 135,
  subject: 'national',
  chapter: 'national-5',
  type: 'single',
  question: '中国八大菜系中，被称为"百菜百味"的是？',
  options: { A: '川菜', B: '鲁菜', C: '粤菜', D: '苏菜' },
  answer: 'A',
  explanation: '川菜以"百菜百味、一菜一格"著称，讲究调味多变。',
  difficulty: 'medium'
},
{
  id: 136,
  subject: 'national',
  chapter: 'national-5',
  type: 'single',
  question: '中国八大菜系中，历史最悠久的是？',
  options: { A: '川菜', B: '鲁菜', C: '粤菜', D: '苏菜' },
  answer: 'B',
  explanation: '鲁菜是中国八大菜系中历史最悠久的菜系，起源于山东，是北方菜系的代表。',
  difficulty: 'hard'
},
{
  id: 137,
  subject: 'national',
  chapter: 'national-5',
  type: 'single',
  question: '中国名茶中，龙井茶属于什么茶类？',
  options: { A: '红茶', B: '绿茶', C: '乌龙茶', D: '白茶' },
  answer: 'B',
  explanation: '龙井茶产于浙江杭州西湖，是中国十大名茶之一，属于绿茶。',
  difficulty: 'easy'
},
{
  id: 138,
  subject: 'national',
  chapter: 'national-5',
  type: 'single',
  question: '中国名酒中，茅台酒属于什么香型？',
  options: { A: '浓香型', B: '酱香型', C: '清香型', D: '米香型' },
  answer: 'B',
  explanation: '茅台酒产于贵州仁怀茅台镇，属于酱香型白酒，是中国的国酒。',
  difficulty: 'medium'
},
{
  id: 139,
  subject: 'national',
  chapter: 'national-5',
  type: 'multiple',
  question: '中国八大菜系包括？',
  options: { A: '鲁菜', B: '川菜', C: '粤菜', D: '闽菜' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '八大菜系包括鲁、川、粤、苏、闽、浙、湘、徽八大菜系。',
  difficulty: 'medium'
},

// --- 中国风物特产 ---
{
  id: 140,
  subject: 'national',
  chapter: 'national-6',
  type: 'single',
  question: '中国四大名绣不包括？',
  options: { A: '苏绣', B: '湘绣', C: '蜀绣', D: '京绣' },
  answer: 'D',
  explanation: '四大名绣是苏绣、湘绣、蜀绣、粤绣。',
  difficulty: 'medium'
},
{
  id: 141,
  subject: 'national',
  chapter: 'national-6',
  type: 'single',
  question: '中国景德镇以什么闻名于世？',
  options: { A: '玉器', B: '瓷器', C: '丝绸', D: '漆器' },
  answer: 'B',
  explanation: '江西景德镇以瓷器闻名世界，被誉为"瓷都"。',
  difficulty: 'easy'
},
{
  id: 142,
  subject: 'national',
  chapter: 'national-6',
  type: 'single',
  question: '中国四大名石中，用于印章石料最多的是？',
  options: { A: '寿山石', B: '青田石', C: '昌化石', D: '巴林石' },
  answer: 'A',
  explanation: '寿山石产于福建福州，色泽温润，是印章石料中使用最多的名石。',
  difficulty: 'hard'
},
{
  id: 143,
  subject: 'national',
  chapter: 'national-6',
  type: 'single',
  question: '中国传统工艺"景泰蓝"又称为什么？',
  options: { A: '铜胎掐丝珐琅', B: '点翠', C: '金银错', D: '漆雕' },
  answer: 'A',
  explanation: '景泰蓝学名为"铜胎掐丝珐琅"，是北京著名的传统工艺美术品。',
  difficulty: 'hard'
},
{
  id: 144,
  subject: 'national',
  chapter: 'national-6',
  type: 'multiple',
  question: '中国四大名绣包括？',
  options: { A: '苏绣', B: '湘绣', C: '蜀绣', D: '粤绣' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '四大名绣是苏绣、湘绣、蜀绣、粤绣。',
  difficulty: 'medium'
},

// --- 中国自然景观 ---
{
  id: 145,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '中国五岳中，海拔最高的是？',
  options: { A: '泰山', B: '华山', C: '衡山', D: '恒山' },
  answer: 'B',
  explanation: '五岳中，西岳华山海拔最高，以险峻著称。',
  difficulty: 'medium'
},
{
  id: 146,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '有"奇松、怪石、云海、温泉"四绝之称的名山是？',
  options: { A: '泰山', B: '黄山', C: '庐山', D: '峨眉山' },
  answer: 'B',
  explanation: '黄山以奇松、怪石、云海、温泉四绝闻名于世，被誉为"天下第一奇山"。',
  difficulty: 'easy'
},
{
  id: 147,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '中国最长的河流是？',
  options: { A: '黄河', B: '长江', C: '珠江', D: '黑龙江' },
  answer: 'B',
  explanation: '长江全长约6300公里，是中国最长的河流，世界第三长河。',
  difficulty: 'easy'
},
{
  id: 148,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '中国最大的咸水湖是？',
  options: { A: '鄱阳湖', B: '洞庭湖', C: '青海湖', D: '太湖' },
  answer: 'C',
  explanation: '青海湖位于青海省，是中国最大的咸水湖。',
  difficulty: 'easy'
},
{
  id: 149,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '被誉为"天下第一奇山"的是？',
  options: { A: '黄山', B: '泰山', C: '华山', D: '峨眉山' },
  answer: 'A',
  explanation: '黄山以奇松、怪石、云海、温泉四绝著称，被誉为"天下第一奇山"。',
  difficulty: 'easy'
},
{
  id: 150,
  subject: 'national',
  chapter: 'national-7',
  type: 'multiple',
  question: '中国五岳包括？',
  options: { A: '东岳泰山', B: '西岳华山', C: '南岳衡山', D: '北岳恒山' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '五岳包括东岳泰山、西岳华山、南岳衡山、北岳恒山、中岳嵩山。',
  difficulty: 'medium'
},

// --- 全国导游基础知识-判断题 ---
{
  id: 151,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '中国历史上第一个统一的中央集权封建国家是秦朝。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '公元前221年秦始皇统一六国，建立了中国历史上第一个统一的中央集权封建国家。',
  difficulty: 'easy'
},
{
  id: 152,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '《史记》是司马光所著的历史著作。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '《史记》是司马迁所著，司马光所著的是《资治通鉴》。',
  difficulty: 'easy'
},
{
  id: 153,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '中国人口最多的少数民族是壮族。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '壮族是中国人口最多的少数民族，主要分布在广西。',
  difficulty: 'easy'
},
{
  id: 154,
  subject: 'national',
  chapter: 'national-2',
  type: 'single',
  question: '武当山是中国四大佛教名山之一。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '武当山是道教名山，四大佛教名山是五台山、峨眉山、普陀山、九华山。',
  difficulty: 'medium'
},
{
  id: 155,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '北京故宫是世界上现存规模最大、保存最完整的木质结构古建筑群。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '北京故宫是明清两代的皇宫，是世界上现存规模最大、保存最完整的木质结构古建筑群。',
  difficulty: 'easy'
},
{
  id: 156,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '苏州园林是中国私家园林的典型代表。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '苏州园林以私家园林为主，是江南园林的典型代表。',
  difficulty: 'easy'
},
{
  id: 157,
  subject: 'national',
  chapter: 'national-5',
  type: 'single',
  question: '中国八大菜系中，川菜以麻辣味型著称。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '川菜以麻辣味型著称，讲究"百菜百味，一菜一格"。',
  difficulty: 'easy'
},
{
  id: 158,
  subject: 'national',
  chapter: 'national-6',
  type: 'single',
  question: '景德镇被誉为中国的"瓷都"。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '江西景德镇以瓷器闻名世界，被誉为"瓷都"。',
  difficulty: 'easy'
},
{
  id: 159,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '中国最长的河流是黄河。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '中国最长的河流是长江，黄河是中国第二长河。',
  difficulty: 'easy'
},
{
  id: 160,
  subject: 'national',
  chapter: 'national-7',
  type: 'single',
  question: '青海湖是中国最大的淡水湖。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '青海湖是中国最大的咸水湖，最大的淡水湖是鄱阳湖。',
  difficulty: 'medium'
},
{
  id: 161,
  subject: 'national',
  chapter: 'national-1',
  type: 'single',
  question: '科举制度创立于唐朝。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '科举制度创立于隋朝，完善于唐朝。',
  difficulty: 'hard'
},
{
  id: 162,
  subject: 'national',
  chapter: 'national-3',
  type: 'single',
  question: '庑殿顶是中国古建筑中等级最高的屋顶形式。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '庑殿顶是最高等级的屋顶形式，多用于皇宫和庙宇主殿。',
  difficulty: 'medium'
},
{
  id: 163,
  subject: 'national',
  chapter: 'national-4',
  type: 'single',
  question: '中国古典园林的四大要素是山、水、建筑和植物。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '山（叠山）、水（理水）、建筑、植物是中国古典园林的四大要素。',
  difficulty: 'medium'
},

// ======================================================================
// 四、地方导游基础知识（local）- 56题
// ======================================================================

// --- 华北地区 ---
{
  id: 164,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '北京故宫建于哪个朝代？',
  options: { A: '元朝', B: '明朝', C: '清朝', D: '宋朝' },
  answer: 'B',
  explanation: '北京故宫始建于明永乐四年（1406年），历时14年建成。',
  difficulty: 'medium'
},
{
  id: 165,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '天坛的主要功能是？',
  options: { A: '祭祀祖先', B: '祭祀天地', C: '皇帝登基', D: '举办庆典' },
  answer: 'B',
  explanation: '天坛是明清两代皇帝祭天、祈谷的场所，主要功能是祭祀天地。',
  difficulty: 'medium'
},
{
  id: 166,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '山西省被列入世界文化遗产的是？',
  options: { A: '平遥古城', B: '乔家大院', C: '晋祠', D: '悬空寺' },
  answer: 'A',
  explanation: '平遥古城于1997年被列入世界文化遗产名录，是山西最著名的世界文化遗产。',
  difficulty: 'medium'
},
{
  id: 167,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '内蒙古那达慕大会的传统项目不包括？',
  options: { A: '赛马', B: '摔跤', C: '射箭', D: '赛龙舟' },
  answer: 'D',
  explanation: '那达慕大会是蒙古族的传统盛会，主要项目有赛马、摔跤、射箭等，赛龙舟不是蒙古族传统项目。',
  difficulty: 'medium'
},
{
  id: 168,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '河北省承德避暑山庄属于什么类型的园林？',
  options: { A: '私家园林', B: '皇家园林', C: '寺观园林', D: '公共园林' },
  answer: 'B',
  explanation: '承德避暑山庄是清代皇家园林，是中国现存最大的皇家园林。',
  difficulty: 'medium'
},
{
  id: 169,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '天津著名的民间艺术是？',
  options: { A: '泥人张', B: '剪纸', C: '刺绣', D: '木雕' },
  answer: 'A',
  explanation: '泥人张是天津著名的民间彩塑艺术，已有近200年历史。',
  difficulty: 'medium'
},
{
  id: 170,
  subject: 'local',
  chapter: 'local-1',
  type: 'multiple',
  question: '华北地区的世界文化遗产包括？',
  options: { A: '北京故宫', B: '天坛', C: '颐和园', D: '平遥古城' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为华北地区的世界文化遗产。',
  difficulty: 'medium'
},

// --- 东北地区 ---
{
  id: 171,
  subject: 'local',
  chapter: 'local-2',
  type: 'single',
  question: '辽宁省沈阳市的著名宫殿建筑是？',
  options: { A: '北京故宫', B: '沈阳故宫', C: '布达拉宫', D: '雍和宫' },
  answer: 'B',
  explanation: '沈阳故宫是清朝入关前建立的皇宫，是东北地区最著名的宫殿建筑。',
  difficulty: 'easy'
},
{
  id: 172,
  subject: 'local',
  chapter: 'local-2',
  type: 'single',
  question: '吉林省最著名的自然景观是？',
  options: { A: '长白山天池', B: '镜泊湖', C: '五大连池', D: '松花湖' },
  answer: 'A',
  explanation: '长白山天池位于吉林，是中国最深的湖泊，也是东北最著名的自然景观。',
  difficulty: 'medium'
},
{
  id: 173,
  subject: 'local',
  chapter: 'local-2',
  type: 'single',
  question: '黑龙江省哈尔滨市的冰雪节通常在什么季节举办？',
  options: { A: '春季', B: '夏季', C: '秋季', D: '冬季' },
  answer: 'D',
  explanation: '哈尔滨国际冰雪节每年冬季举办，以冰雕、雪雕闻名世界。',
  difficulty: 'easy'
},
{
  id: 174,
  subject: 'local',
  chapter: 'local-2',
  type: 'single',
  question: '东北地区人口最多的少数民族是？',
  options: { A: '朝鲜族', B: '满族', C: '蒙古族', D: '达斡尔族' },
  answer: 'B',
  explanation: '满族是东北地区人口最多的少数民族，也是中国人口较多的少数民族之一。',
  difficulty: 'medium'
},
{
  id: 175,
  subject: 'local',
  chapter: 'local-2',
  type: 'multiple',
  question: '东北地区的著名旅游景点包括？',
  options: { A: '沈阳故宫', B: '长白山天池', C: '哈尔滨中央大街', D: '大连老虎滩' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为东北地区的著名旅游景点。',
  difficulty: 'medium'
},

// --- 华东地区 ---
{
  id: 176,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '上海市的著名地标建筑是？',
  options: { A: '东方明珠塔', B: '广州塔', C: '中央电视塔', D: '深圳平安金融中心' },
  answer: 'A',
  explanation: '东方明珠广播电视塔是上海最著名的地标建筑之一。',
  difficulty: 'easy'
},
{
  id: 177,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '江苏省苏州市以什么园林闻名世界？',
  options: { A: '皇家园林', B: '私家园林', C: '寺观园林', D: '公共园林' },
  answer: 'B',
  explanation: '苏州以私家园林闻名世界，拙政园、留园等被列入世界文化遗产。',
  difficulty: 'easy'
},
{
  id: 178,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '浙江省杭州市最著名的湖泊是？',
  options: { A: '太湖', B: '西湖', C: '千岛湖', D: '东湖' },
  answer: 'B',
  explanation: '西湖是杭州最著名的湖泊，被列入世界文化遗产。',
  difficulty: 'easy'
},
{
  id: 179,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '安徽省著名的世界文化与自然双重遗产是？',
  options: { A: '黄山', B: '九华山', C: '天柱山', D: '齐云山' },
  answer: 'A',
  explanation: '黄山是安徽最著名的山岳景观，被列为世界文化与自然双重遗产。',
  difficulty: 'medium'
},
{
  id: 180,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '福建省厦门市最著名的旅游景点是？',
  options: { A: '鼓浪屿', B: '武夷山', C: '土楼', D: '湄洲岛' },
  answer: 'A',
  explanation: '鼓浪屿是厦门最著名的旅游景点，被列入世界文化遗产。',
  difficulty: 'easy'
},
{
  id: 181,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '江西省的著名瓷器产地是？',
  options: { A: '宜兴', B: '景德镇', C: '龙泉', D: '德化' },
  answer: 'B',
  explanation: '景德镇位于江西省，是中国著名的"瓷都"。',
  difficulty: 'easy'
},
{
  id: 182,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '山东省的"五岳之首"指的是？',
  options: { A: '华山', B: '泰山', C: '衡山', D: '恒山' },
  answer: 'B',
  explanation: '泰山位于山东泰安，被誉为"五岳之首"，是历代帝王封禅之地。',
  difficulty: 'easy'
},
{
  id: 183,
  subject: 'local',
  chapter: 'local-3',
  type: 'multiple',
  question: '华东地区的著名旅游城市包括？',
  options: { A: '杭州', B: '苏州', C: '南京', D: '厦门' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为华东地区著名的旅游城市。',
  difficulty: 'easy'
},

// --- 华中地区 ---
{
  id: 184,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '河南省洛阳市著名的佛教石窟是？',
  options: { A: '莫高窟', B: '龙门石窟', C: '云冈石窟', D: '麦积山石窟' },
  answer: 'B',
  explanation: '龙门石窟位于河南洛阳，是中国四大石窟之一。',
  difficulty: 'medium'
},
{
  id: 185,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '湖北省武汉市的地标性建筑是？',
  options: { A: '岳阳楼', B: '黄鹤楼', C: '滕王阁', D: '鹳雀楼' },
  answer: 'B',
  explanation: '黄鹤楼位于湖北武汉，是江南三大名楼之一。',
  difficulty: 'easy'
},
{
  id: 186,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '湖南省张家界以什么地貌著称？',
  options: { A: '丹霞地貌', B: '喀斯特地貌', C: '石英砂岩峰林地貌', D: '雅丹地貌' },
  answer: 'C',
  explanation: '张家界以石英砂岩峰林地貌著称，是世界自然遗产。',
  difficulty: 'hard'
},
{
  id: 187,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '河南省少林寺位于哪座山？',
  options: { A: '泰山', B: '嵩山', C: '华山', D: '恒山' },
  answer: 'B',
  explanation: '少林寺位于河南登封嵩山，是禅宗祖庭和少林武术的发源地。',
  difficulty: 'medium'
},
{
  id: 188,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '湖南省湘西的著名古城是？',
  options: { A: '平遥古城', B: '凤凰古城', C: '丽江古城', D: '大理古城' },
  answer: 'B',
  explanation: '凤凰古城位于湖南湘西土家族苗族自治州，是著名的历史文化名城。',
  difficulty: 'medium'
},
{
  id: 189,
  subject: 'local',
  chapter: 'local-4',
  type: 'multiple',
  question: '华中地区的世界遗产包括？',
  options: { A: '龙门石窟', B: '武当山古建筑群', C: '张家界', D: '少林寺' },
  answer: ['A', 'B', 'C'],
  explanation: '龙门石窟、武当山古建筑群、张家界均为世界遗产，少林寺（建筑群）不是独立的世界遗产项目。',
  difficulty: 'hard'
},

// --- 华南地区 ---
{
  id: 190,
  subject: 'local',
  chapter: 'local-5',
  type: 'single',
  question: '广东省广州市的别称是？',
  options: { A: '榕城', B: '羊城', C: '花城', D: '泉城' },
  answer: 'B',
  explanation: '广州别称"羊城"，源于"五羊衔谷"的神话传说。',
  difficulty: 'easy'
},
{
  id: 191,
  subject: 'local',
  chapter: 'local-5',
  type: 'single',
  question: '广西桂林以什么山水风光闻名？',
  options: { A: '喀斯特山水', B: '丹霞地貌', C: '海滨风光', D: '雪山冰川' },
  answer: 'A',
  explanation: '桂林以喀斯特地貌形成的山水风光闻名，有"桂林山水甲天下"之美誉。',
  difficulty: 'medium'
},
{
  id: 192,
  subject: 'local',
  chapter: 'local-5',
  type: 'single',
  question: '海南省三亚市位于海南岛的什么位置？',
  options: { A: '北部', B: '中部', C: '南部', D: '东部' },
  answer: 'C',
  explanation: '三亚位于海南岛最南端，是著名的热带滨海旅游城市。',
  difficulty: 'easy'
},
{
  id: 193,
  subject: 'local',
  chapter: 'local-5',
  type: 'single',
  question: '广东省的"世界之窗"主题公园位于哪个城市？',
  options: { A: '广州', B: '深圳', C: '珠海', D: '东莞' },
  answer: 'B',
  explanation: '深圳世界之窗是中国著名的微缩景观主题公园。',
  difficulty: 'easy'
},
{
  id: 194,
  subject: 'local',
  chapter: 'local-5',
  type: 'multiple',
  question: '华南地区的特色旅游资源包括？',
  options: { A: '桂林山水', B: '海南热带海滨', C: '丹霞山', D: '珠海长隆海洋王国' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为华南地区的特色旅游资源和景点。',
  difficulty: 'medium'
},

// --- 西南地区 ---
{
  id: 195,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '重庆市最著名的世界文化遗产是？',
  options: { A: '大足石刻', B: '乐山大佛', C: '都江堰', D: '青城山' },
  answer: 'A',
  explanation: '大足石刻位于重庆大足区，是世界文化遗产。',
  difficulty: 'medium'
},
{
  id: 196,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '四川省的"人间仙境"九寨沟以什么著称？',
  options: { A: '雪山冰川', B: '湖泊瀑布和彩林', C: '丹霞地貌', D: '喀斯特溶洞' },
  answer: 'B',
  explanation: '九寨沟以翠海、叠瀑、彩林、雪峰、藏情、蓝冰"六绝"著称。',
  difficulty: 'medium'
},
{
  id: 197,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '云南省大理的标志性建筑是？',
  options: { A: '大雁塔', B: '崇圣寺三塔', C: '小雁塔', D: '应县木塔' },
  answer: 'B',
  explanation: '崇圣寺三塔位于云南大理，是大理的标志性建筑。',
  difficulty: 'medium'
},
{
  id: 198,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '贵州省著名的黄果树瀑布属于什么类型？',
  options: { A: '冰川瀑布', B: '喀斯特瀑布', C: '火山瀑布', D: '人工瀑布' },
  answer: 'B',
  explanation: '黄果树瀑布是喀斯特地貌中的典型瀑布景观，是中国最大的瀑布之一。',
  difficulty: 'medium'
},
{
  id: 199,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '西藏自治区的首府是？',
  options: { A: '日喀则', B: '拉萨', C: '林芝', D: '昌都' },
  answer: 'B',
  explanation: '拉萨是西藏自治区的首府，是西藏的政治、经济、文化中心。',
  difficulty: 'easy'
},
{
  id: 200,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '布达拉宫位于哪个城市？',
  options: { A: '日喀则', B: '拉萨', C: '林芝', D: '山南' },
  answer: 'B',
  explanation: '布达拉宫位于西藏拉萨，是世界文化遗产，是藏传佛教圣地和西藏的标志性建筑。',
  difficulty: 'easy'
},
{
  id: 201,
  subject: 'local',
  chapter: 'local-6',
  type: 'multiple',
  question: '西南地区的世界自然遗产包括？',
  options: { A: '九寨沟', B: '黄龙', C: '武隆喀斯特', D: '三江并流' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为西南地区的世界自然遗产。',
  difficulty: 'hard'
},

// --- 西北地区 ---
{
  id: 202,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '陕西省西安市最著名的世界文化遗产是？',
  options: { A: '兵马俑', B: '大雁塔', C: '小雁塔', D: '西安城墙' },
  answer: 'A',
  explanation: '秦始皇陵兵马俑位于陕西西安，是世界文化遗产，被誉为"世界第八大奇迹"。',
  difficulty: 'easy'
},
{
  id: 203,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '甘肃省敦煌市的著名石窟是？',
  options: { A: '龙门石窟', B: '云冈石窟', C: '莫高窟', D: '麦积山石窟' },
  answer: 'C',
  explanation: '莫高窟位于甘肃敦煌，是中国四大石窟之一，以精美的壁画和彩塑闻名世界。',
  difficulty: 'easy'
},
{
  id: 204,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '青海省最著名的湖泊是？',
  options: { A: '鄱阳湖', B: '洞庭湖', C: '青海湖', D: '太湖' },
  answer: 'C',
  explanation: '青海湖位于青海省，是中国最大的咸水湖。',
  difficulty: 'easy'
},
{
  id: 205,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '宁夏回族自治区的著名旅游景点是？',
  options: { A: '沙坡头', B: '莫高窟', C: '兵马俑', D: '华山' },
  answer: 'A',
  explanation: '沙坡头位于宁夏中卫，以沙漠与黄河交汇的壮丽景观闻名。',
  difficulty: 'medium'
},
{
  id: 206,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '新疆维吾尔自治区天山天池属于什么类型的湖泊？',
  options: { A: '冰川湖', B: '火山湖', C: '堰塞湖', D: '人工湖' },
  answer: 'A',
  explanation: '天山天池是冰川作用下形成的冰川湖，位于新疆天山博格达峰下。',
  difficulty: 'hard'
},
{
  id: 207,
  subject: 'local',
  chapter: 'local-7',
  type: 'multiple',
  question: '西北地区的世界文化遗产包括？',
  options: { A: '莫高窟', B: '秦始皇陵兵马俑', C: '长城（嘉峪关段）', D: '丝绸之路' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为西北地区的世界文化遗产。',
  difficulty: 'medium'
},

// --- 港澳台地区 ---
{
  id: 208,
  subject: 'local',
  chapter: 'local-8',
  type: 'single',
  question: '香港特别行政区的标志性建筑是？',
  options: { A: '澳门塔', B: '香港会议展览中心', C: '中银大厦', D: '台北101' },
  answer: 'C',
  explanation: '中银大厦是香港的标志性建筑之一，由贝聿铭设计。',
  difficulty: 'medium'
},
{
  id: 209,
  subject: 'local',
  chapter: 'local-8',
  type: 'single',
  question: '澳门特别行政区的著名历史建筑区是？',
  options: { A: '中环', B: '大三巴牌坊', C: '铜锣湾', D: '尖沙咀' },
  answer: 'B',
  explanation: '大三巴牌坊是澳门最著名的历史建筑，是澳门标志性景点。',
  difficulty: 'easy'
},
{
  id: 210,
  subject: 'local',
  chapter: 'local-8',
  type: 'single',
  question: '台湾地区最著名的旅游景点是？',
  options: { A: '日月潭', B: '西湖', C: '滇池', D: '洱海' },
  answer: 'A',
  explanation: '日月潭是台湾最大的天然湖泊，是台湾最著名的旅游景点。',
  difficulty: 'easy'
},
{
  id: 211,
  subject: 'local',
  chapter: 'local-8',
  type: 'single',
  question: '澳门被称为什么？',
  options: { A: '东方之珠', B: '东方赌城', C: '东方明珠', D: '东方威尼斯' },
  answer: 'B',
  explanation: '澳门以其博彩业闻名，被称为"东方赌城"或"东方蒙地卡罗"。',
  difficulty: 'medium'
},
{
  id: 212,
  subject: 'local',
  chapter: 'local-8',
  type: 'multiple',
  question: '港澳台地区的特色旅游资源包括？',
  options: { A: '香港迪士尼乐园', B: '澳门历史城区', C: '台北故宫博物院', D: '香港维多利亚港' },
  answer: ['A', 'B', 'C', 'D'],
  explanation: '以上均为港澳台地区著名的旅游资源和景点。',
  difficulty: 'medium'
},

// --- 地方导游基础知识-判断题 ---
{
  id: 213,
  subject: 'local',
  chapter: 'local-1',
  type: 'single',
  question: '北京故宫始建于明朝。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '北京故宫始建于明永乐四年（1406年），是明清两代的皇宫。',
  difficulty: 'easy'
},
{
  id: 214,
  subject: 'local',
  chapter: 'local-3',
  type: 'single',
  question: '西湖位于江苏省苏州市。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '西湖位于浙江省杭州市，不是苏州。',
  difficulty: 'easy'
},
{
  id: 215,
  subject: 'local',
  chapter: 'local-5',
  type: 'single',
  question: '桂林山水以丹霞地貌著称。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '桂林山水以喀斯特地貌著称，不是丹霞地貌。',
  difficulty: 'medium'
},
{
  id: 216,
  subject: 'local',
  chapter: 'local-6',
  type: 'single',
  question: '布达拉宫位于西藏拉萨，是世界文化遗产。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '布达拉宫位于西藏拉萨，是世界文化遗产。',
  difficulty: 'easy'
},
{
  id: 217,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '莫高窟位于甘肃省敦煌市。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '莫高窟位于甘肃敦煌，是世界文化遗产和中国四大石窟之一。',
  difficulty: 'easy'
},
{
  id: 218,
  subject: 'local',
  chapter: 'local-8',
  type: 'single',
  question: '香港特别行政区的官方语言只有英语。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '香港的官方语言是中文和英文，中文和英文均为正式语文。',
  difficulty: 'easy'
},
{
  id: 219,
  subject: 'local',
  chapter: 'local-2',
  type: 'single',
  question: '沈阳故宫是清朝入关前建立的皇宫。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '沈阳故宫是清朝入关前（后金和清初）的皇宫。',
  difficulty: 'easy'
},
{
  id: 220,
  subject: 'local',
  chapter: 'local-4',
  type: 'single',
  question: '黄鹤楼位于湖南省长沙市。',
  options: { A: '正确', B: '错误' },
  answer: 'B',
  explanation: '黄鹤楼位于湖北省武汉市，不是湖南长沙。',
  difficulty: 'easy'
},
{
  id: 221,
  subject: 'local',
  chapter: 'local-7',
  type: 'single',
  question: '秦始皇陵兵马俑位于陕西省西安市。',
  options: { A: '正确', B: '错误' },
  answer: 'A',
  explanation: '秦始皇陵兵马俑位于陕西西安临潼区，是世界文化遗产。',
  difficulty: 'easy'
}
];