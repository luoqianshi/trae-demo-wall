
/* ============================================================
   话题库 · 4 场景 × 4 身份 × 4 模块（均已均衡至 open8/safe15/deep8/warn12）
   ============================================================ */

const SCENES = {
  date: {
    label:'相亲约会', en:'Date',
    roles:[
      {val:'first',label:'第一次见面',ic:'🫖'},
      {val:'online',label:'线上相亲',ic:'📱'},
      {val:'blind',label:'长辈介绍',ic:'💌'},
      {val:'second',label:'二次约会',ic:'☕'}
    ],
    capLabel:'相亲场景'
  },
  work:{
    label:'职场商务', en:'Business',
    roles:[
      {val:'client',label:'见客户',ic:'💼'},
      {val:'boss',label:'见领导',ic:'👔'},
      {val:'partner',label:'谈合作',ic:'🤝'},
      {val:'interview',label:'面试',ic:'📋'}
    ],
    capLabel:'职场场景'
  },
  family:{
    label:'家庭长辈', en:'Family',
    roles:[
      {val:'parents',label:'见对方父母',ic:'🏠'},
      {val:'relative',label:'走亲戚',ic:'🏮'},
      {val:'elder',label:'拜访长辈',ic:'🍵'},
      {val:'inlaw',label:'见亲家',ic:'🎎'}
    ],
    capLabel:'家庭场景'
  },
  party:{
    label:'聚会社交', en:'Party',
    roles:[
      {val:'wedding',label:'婚礼同桌',ic:'💍'},
      {val:'dinner',label:'饭局聚会',ic:'🍽️'},
      {val:'team',label:'团建活动',ic:'🎯'},
      {val:'stranger',label:'陌生人局',ic:'🎪'}
    ],
    capLabel:'聚会场景'
  }
};

const JOB_SUGGEST = ['程序员','老师','医生','公务员','设计师','金融','销售','律师','媒体','学生','餐饮','健身教练','摄影师','自媒体','工程师','护士','会计','艺术家'];

const INTEREST_SUGGEST = ['旅行','电影','美食','音乐','运动','阅读','游戏','宠物','摄影','手作','园艺','钓鱼','咖啡','茶艺','动漫','徒步','瑜伽','收藏'];

const JOB_TOPICS = {
  '程序员':['最近在忙什么项目','用的什么技术栈','加班多不多','AI 对你们行业影响大吗','开源社区参与吗'],
  '老师':['带的哪个年级','学生们现在难带吗','假期怎么安排','现在教育变化大吗','怎么看待双减'],
  '医生':['哪个科室','最近忙不忙','值夜班多吗','怎么看待医患关系','养生有什么建议'],
  '公务员':['在哪个部门','工作节奏怎么样','考试准备难吗','基层工作辛苦吧','政策变化感受深吗'],
  '设计师':['做哪个方向的设计','审美怎么培养的','接私活吗','AI 对设计冲击大吗','平时去哪找灵感'],
  '金融':['具体做哪块','最近市场怎么样','工作压力大吗','考了哪些证','怎么看今年行情'],
  '销售':['卖什么产品','业绩压力大吗','怎么开发客户','出差多不多','最难搞的客户什么样'],
  '律师':['主攻哪个领域','接过最难的案子','这个行业累不累','怎么看法律剧','法考准备多久'],
  '媒体':['在哪个平台','做什么内容','选题怎么找','流量焦虑吗','采访过有趣的人吗'],
  '学生':['学什么专业','几年级了','考研还是工作','校园生活怎么样','最近在忙什么'],
  '餐饮':['做什么品类','生意怎么样','房租压力大吗','怎么研发新品','外卖占比高吗'],
  '健身教练':['带多少学员','现在流行什么训练','饮食怎么控制','这个职业能做多久','最常见的健身误区'],
  '摄影师':['拍什么题材','用什么设备','接商单多吗','后期自己修吗','去过哪些地方拍'],
  '自媒体':['做什么赛道','粉丝多少了','变现怎么样','内容怎么规划','平台算法变化感受'],
  '工程师':['哪个领域的工程','项目周期长吗','经常出差吗','行业前景怎么样','技术更新快吗'],
  '护士':['哪个科室','排班怎么安排','工作辛苦吧','怎么调节压力','最感动的瞬间'],
  '会计':['在什么公司','忙季是不是很累','考了CPA吗','税务变化多吗','怎么做职业规划'],
  '艺术家':['做哪种艺术','最近在创作什么','灵感来自哪里','怎么维持生活','展览多吗']
};

const INTEREST_TOPICS = {
  '旅行':['最近去了哪里','最推荐的地方','旅行方式偏好','下一个目的地','旅行中最难忘的事'],
  '电影':['最近看了什么','最喜欢的类型','去影院还是在家','最喜欢的导演','电影对你意味着什么'],
  '美食':['会做饭吗','最拿手的菜','喜欢什么菜系','探店经验','家乡的味道'],
  '音乐':['听什么风格','最近单曲循环','会乐器吗','去过演唱会吗','音乐怎么影响心情'],
  '运动':['做什么运动','运动频率','运动带来的改变','最喜欢的运动员','怎么坚持下来'],
  '阅读':['最近在读什么','喜欢什么类型','纸质还是电子','最推荐的一本书','阅读习惯怎么养成的'],
  '游戏':['玩什么平台','最近在玩什么','单机还是网游','游戏社交','最期待的新作'],
  '宠物':['养什么宠物','养了多久','宠物趣事','怎么照顾的','宠物改变了什么'],
  '摄影':['拍什么题材','用什么相机','后期习惯','最满意的作品','摄影的意义'],
  '手作':['做什么手作','怎么入门的','材料哪里买','卖作品吗','手作带来的治愈感'],
  '园艺':['养什么植物','阳台还是花园','怎么打理','最得意的植物','植物死了会难过吗'],
  '钓鱼':['钓淡水还是海钓','去过哪些钓点','最大钓过多大的','装备投入多吗','钓鱼的乐趣在哪'],
  '咖啡':['手冲还是意式','常去哪家店','自己烘焙吗','最喜欢的豆子','咖啡文化怎么看'],
  '茶艺':['喝什么茶','茶具收藏吗','怎么入门的','茶道精神','泡茶的心得'],
  '动漫':['看什么类型','追番还是补番','去漫展吗','最喜欢的作品','国漫日漫怎么看'],
  '徒步':['走过哪条线路','装备怎么选','徒步的意义','最难忘的一次','新手怎么入门'],
  '瑜伽':['练多久了','什么流派','饮食配合吗','瑜伽带来的改变','推荐的好老师'],
  '收藏':['收藏什么','怎么入坑的','最得意的藏品','收藏圈子的趣事','未来打算怎么处理']
};

/* ============================================================
   话题库主体（每组: open=8, safe=15, deep=8, warn=12）
   ============================================================ */
const LIB = {
  date:{
    first:{
      open:[
        '这家店我朋友强推过，你平时喜欢什么类型的餐厅呀？',
        '今天路上还顺利吗？我刚才差点走错路。',
        '你平时周末一般怎么安排？我喜欢{interest}，最近正想找个搭子。',
        '听说你做{job}？这个我一直觉得挺有意思的，平时忙吗？',
        '我之前看你朋友圈喜欢{interest}，最近有去玩吗？',
        '今天天气不错，适合出来走走，你喜欢户外还是宅家？',
        '咱俩都是XX介绍的，他跟你提过我吗？',
        '你平时下班一般几点？我之前做{job}的朋友都说挺忙的。',
        '你平时喜欢看什么类型的书或剧？最近有没有推荐的。',
        '今天这家店环境不错，你之前来过这种风格的店吗？'
      ],
      safe:[
        '最近的旅行经历','看过的剧/电影','美食探索','宠物话题','周末习惯',
        '家乡在哪里','学生时代趣事','最近学到的新技能','喜欢的季节',
        '通勤方式','最近开心的小事','喜欢的音乐类型','运动习惯',
        '咖啡还是奶茶','早起还是夜猫子'
      ],
      deep:[
        '对未来生活的期待','相处中最不能将就的品质','最近最有成就感的小事',
        '理想中的周末是什么样的','觉得两个人相处最重要的是什么',
        '最近想明白的一件事','最想去的地方','一个改变你的经历'
      ],
      warn:[
        '前任话题','收入直接追问','催婚/催生压力','过度炫耀财力',
        '政治宗教立场','评价对方外貌','过度打听家庭情况',
        '聊其他相亲对象','负面情绪太重','手机不离手',
        '过早身体接触','贬低对方爱好'
      ]
    },
    online:{
      open:[
        '第一次这样认识朋友，你习惯吗？',
        '你平时线上聊天多还是见面多？',
        '视频见面比想象中自在吧？你那边背景挺好看的。',
        '听说你做{job}？我有个朋友也做这个，说挺有意思的。',
        '你朋友圈那张{interest}的照片是在哪拍的？',
        '咱俩隔多远？我这边天气不错，你那边呢？',
        '线上聊了这么久，终于"见"到了，比想象中自在。',
        '你平时在家也喜欢{interest}吗？感觉咱俩兴趣挺像的。',
        '你平时用什么App比较多？我最近发现一个挺有意思的。',
        '视频聊天比我想象中自然，你之前有试过这种方式吗？'
      ],
      safe:[
        '最近追的剧','居家办公体验','外卖推荐','养绿植经验',
        '最近买的好物','居家运动方式','线上学习课程','最近听的播客',
        '居家美食尝试','云看展体验','居家穿搭','最近读的书',
        '居家咖啡/茶饮','阳台改造心得','最近学会的新技能'
      ],
      deep:[
        '线上和线下社交的区别感受','独处时最享受的事',
        '最近想培养的习惯','对"慢节奏生活"的看法',
        '疫情后生活方式的改变','最想念的线下体验',
        '理想的生活状态','最近对人际关系的新感悟'
      ],
      warn:[
        '追问具体住址','要求随时视频','过度打探工作单位',
        '聊其他聊天对象','一上来就要照片','言语过于亲密',
        '负面情绪轰炸','只聊不问对方','频繁查岗',
        '过早暧昧','聊前任','催见面'
      ]
    },
    blind:{
      open:[
        '听阿姨说您特别优秀，今天终于见到了。',
        '阿姨把您夸了一路，见面发现比说的还好。',
        '我是XX介绍的，他跟您说我什么了吗？',
        '听说您做{job}？我阿姨一直说这行特别好。',
        '您平时也这么忙吗？今天能约上挺不容易的。',
        '阿姨说咱俩兴趣挺像的，您也喜欢{interest}？',
        '今天路上还顺利吗？这边停车不太好找。',
        '阿姨之前给您看我照片了吗？比照片好看吧，哈哈。',
        '您平时周末一般怎么安排？有没有什么特别喜欢的消遣。',
        '今天天气不错，您平时喜欢出门走走还是在家休息？'
      ],
      safe:[
        '和介绍人的关系','家乡风物','学生时代','工作日常',
        '最近的热门剧','美食探店','旅行计划','养宠经验',
        '周末安排','最近读的书','运动习惯','家乡美食',
        '最近开心的小事','喜欢的季节','通勤方式'
      ],
      deep:[
        '对未来生活的规划','家庭在心中的位置',
        '理想的生活状态','最看重的品质',
        '工作与生活的平衡','对这段关系的期待',
        '最近想明白的一件事','最想去的地方'
      ],
      warn:[
        '直接问收入','催婚催生','聊前任',
        '评价介绍人','过度打听家庭资产','一上来就谈条件',
        '手机不离手','空手赴约','过度表现',
        '贬低对方工作','聊太私人的话题','急于确定关系'
      ]
    },
    second:{
      open:[
        '上次聊得挺开心的，回去还在想你说的那件事。',
        '这次换我选地方了，你上次推荐的那家我记下了。',
        '上次你说喜欢{interest}，我最近也试了试，确实有意思。',
        '今天比上次放松多了吧？我也是。',
        '上次聊到你的{job}，后来我特意了解了一下，挺有意思的。',
        '咱俩上次聊的那个话题，我后来又想到一些。',
        '上次那家店不错吧？今天带你去个更好的。',
        '上次你说想去{interest}，我查了一下最近正好有活动。',
        '上次聊得挺开心的，你回去有没有跟朋友提起我？',
        '今天我特意提前到了，怕又像上次那样迟到。'
      ],
      safe:[
        '上次聊到的话题延伸','最近新发现的好店','新追的剧',
        '上周的趣事','新尝试的事','最近的心情',
        '新的旅行计划','新养成的习惯','最近读的书',
        '新认识的朋友','最近的天气感受','新学会的菜',
        '最近听的歌','新买的好物','上周开心的小事'
      ],
      deep:[
        '上次没聊完的深度话题','对彼此更深的了解',
        '最近对生活的新感悟','想和对方一起做的事',
        '对这段关系现在的感受','各自的成长经历',
        '理想中的相处模式','最想分享的一次经历'
      ],
      warn:[
        '翻上次的小尴尬','提及其他约会对象',
        '过度推进关系','聊前任','手机不停',
        '迟到不解释','否定对方上次的表现',
        '急于定义关系','聊收入','过度亲密',
        '负面话题','查岗式提问'
      ]
    }
  },

  work:{
    client:{
      open:[
        '张总您好，一直听说您在这个领域特别专业，今天终于有机会当面请教。',
        '贵公司最近那个项目我关注了很久，做得真漂亮。',
        '今天过来路上还在想，咱们这次合作能碰撞出什么火花。',
        '听同事说您在{job}这行做了很多年，经验特别丰富。',
        '之前电话里聊得比较浅，今天想当面好好请教。',
        '您平时出差多吗？今天能约到时间挺不容易的。',
        '贵公司在行业里口碑很好，今天来就是想好好学习。',
        '之前看过您在{job}领域发的文章，特别受启发。',
        '今天交通还不错，您公司这边停车方便吗？',
        '贵公司的办公环境真好，在这边工作应该挺舒心的。'
      ],
      safe:[
        '行业最近动态','对方公司近期新闻','出差城市的感受',
        '最近参加的行业活动','行业里的新变化','对新技术应用的看法',
        '团队建设经验','行业人才培养','市场趋势观察',
        '行业标杆企业','最近读的行业文章','行业会议见闻',
        '行业政策变化','供应链话题','行业人才流动'
      ],
      deep:[
        '对行业趋势的判断','业务上遇到的最大挑战',
        '选合作伙伴最看重的因素','未来3年的规划',
        '行业最大的机遇在哪','怎么看待竞争格局',
        '数字化转型的心得','对新兴市场的看法'
      ],
      warn:[
        '一上来就报价','贬低竞品对手','过度承诺做不到的事',
        '打听对方内部人事','抱怨自己公司或老板','聊太私人的话题',
        '当场施压逼单','手机响个不停','迟到不道歉',
        '穿着过于随意','打断对方说话','只说不听'
      ]
    },
    boss:{
      open:[
        '领导，您上次提的那个方向，我回去仔细想了想，有几个想法想汇报。',
        '正好您在，关于那个项目我有个进展想跟您同步一下。',
        '您最近忙吗？有个事想占用您几分钟。',
        '上次您说的{job}那个思路，我按那个方向推进了一版。',
        '领导，今天开会您讲的那个点我特别受启发。',
        '您看这个时间方便吗？我想跟您聊聊最近的工作。',
        '领导，上次您交代的{job}的事，我整理了几个方案。',
        '您之前推荐的那本书我看了，有几个想法想跟您交流。',
        '领导，最近部门氛围不错，大家干劲都挺足的。',
        '您最近身体怎么样？上次看您咳嗽，好些了吗？'
      ],
      safe:[
        '部门近期进展','团队协作情况','项目进度同步',
        '行业信息分享','近期工作亮点','资源需求',
        '流程优化建议','团队反馈','市场一线信息','跨部门协作',
        '近期行业会议','团队培训计划','客户反馈汇总',
        '竞品动态','内部流程改进'
      ],
      deep:[
        '对部门方向的建议','个人发展规划',
        '对团队建设的想法','业务瓶颈的思考',
        '对战略方向的理解','需要支持的资源',
        '对行业趋势的判断','对创新方向的探索'
      ],
      warn:[
        '越级汇报','当众反驳','只提问题不给方案',
        '抱怨同事','推卸责任','过度邀功',
        '打听领导私事','传播负面情绪','背后议论他人',
        '迟到早退','手机不静音','打断领导说话'
      ]
    },
    partner:{
      open:[
        '很高兴能坐下来聊，咱们这次合作我期待挺久了。',
        '贵团队最近的工作我看了，专业度确实不一样。',
        '今天想重点聊聊咱们怎么把优势结合起来。',
        '听说贵公司在{job}这块做得很好，正好想请教。',
        '之前邮件聊得比较细，今天想当面把几个关键点定一下。',
        '咱们虽然第一次见面，但之前电话聊得很投机。',
        '贵公司的案例我研究过，特别想学习你们的{job}经验。',
        '今天时间宝贵，咱们直奔主题，把合作框架聊清楚。',
        '贵公司办公位置不错，周边配套挺齐全的。',
        '今天天气好，路上过来心情都不一样，您那边呢？'
      ],
      safe:[
        '各自业务概况','合作切入点','行业共同挑战',
        '市场拓展经验','团队规模和分工','技术/产品亮点',
        '成功案例分享','客户反馈','行业活动','未来计划',
        '行业政策影响','供应链话题','行业人才','市场趋势','技术趋势'
      ],
      deep:[
        '合作模式的设想','利益分配的期望',
        '长期战略协同','风险共担机制','资源互补点',
        '对行业未来的共同判断','合作中的信任建立','应对竞争的策略'
      ],
      warn:[
        '只谈自己利益','贬低其他合作方','条件开得太硬',
        '过度打探对方底牌','催促当场签约','聊对方竞品',
        '态度居高临下','只说不做','泄露自己商业机密',
        '手机频繁响','迟到不解释','穿着不得体'
      ]
    },
    interview:{
      open:[
        '您好，很高兴有这次面试机会，之前一直关注贵公司。',
        '感谢您的时间，我对这个岗位期待很久了。',
        '今天想好好向您请教，也展示一下我能带来的价值。',
        '我做了{job}相关的工作X年，对这个领域有深厚兴趣。',
        '贵公司的产品我一直在用，能来面试特别开心。',
        '之前电话沟通后，我对这个岗位更感兴趣了。',
        '您好，我准备了{job}方向的一些作品，想请您指导。',
        '贵公司的企业文化我很认同，今天特别想来深入学习。',
        '今天过来路上还顺利，贵公司位置挺好找的。',
        '我对贵公司的发展历程很感兴趣，能简单介绍下吗？'
      ],
      safe:[
        '岗位具体职责','团队结构','日常工作内容',
        '公司文化','发展通道','考核方式',
        '培训体系','工作节奏','团队氛围','近期业务重点',
        '公司福利','办公环境','团队规模','技术栈','客户群体'
      ],
      deep:[
        '岗位最大的挑战','公司未来发展方向',
        '团队最需要什么样的人','这个岗位的成长空间',
        '公司怎么看行业趋势','对候选人的核心期待',
        '团队的协作方式','公司对创新的鼓励程度'
      ],
      warn:[
        '一上来问薪资','贬低前公司','过度打听福利',
        '手机不静音','迟到不道歉','穿着过于随意',
        '打断面试官','只问不答','回答跑题',
        '负面情绪','过度谦虚或自大','聊太私人的事'
      ]
    }
  },

  family:{
    parents:{
      open:[
        '叔叔阿姨好，听XX经常提起您，今天终于见到了。这是一点家乡特产，您尝尝。',
        '阿姨您家布置得真温馨，这花养得真好，您费心了。',
        '叔叔，XX总说您做菜特别好吃，今天有幸尝到了。',
        '阿姨，您气色真好，平时有什么养生秘诀吗？',
        '叔叔，听说您以前做{job}？那可是好职业，受人尊敬。',
        '今天来路上还担心堵车，还好提前出门了。阿姨您今天没出门吧？',
        '阿姨，XX总说您{interest}特别好，今天正好见识见识。',
        '叔叔，这茶是朋友带的，您品品怎么样？我对这个不太懂。',
        '阿姨，您家小区绿化真好，住着一定很舒心。',
        '叔叔，XX总说您年轻时候特别厉害，今天正好听听您的故事。'
      ],
      safe:[
        '夸家里布置/养的花','问长辈健康养生','聊对方孩子的趣事',
        '家乡风物','节气饮食习俗','家常菜做法',
        '小区周边环境','最近的天气','养生节目心得',
        '家里老照片的故事','亲戚近况','节日安排',
        '退休生活','邻居趣事','最近的新闻'
      ],
      deep:[
        '长辈年轻时的故事','家族传统/老手艺',
        '对晚辈的期望（谨慎切入）','那个年代的爱情故事',
        '最难忘的家庭记忆','人生经验分享',
        '最骄傲的事','对年轻人的建议'
      ],
      warn:[
        '当面反驳长辈观点','全程低头玩手机','空手上门',
        '主动谈财产/婚期','过度表现、抢话','评论对方家庭关系',
        '聊敏感社会话题','抱怨自己父母','穿着过于随意',
        '迟到不解释','打断长辈说话','聊太久不走'
      ]
    },
    relative:{
      open:[
        '好久不见了，您气色真好！',
        '听说表哥最近{job}升职了？真替他高兴。',
        '阿姨，您做的这个菜太好吃了，怎么做的呀？',
        '叔叔，您还记得我小时候的事吗？那时候特别调皮。',
        '这次回来发现家乡变化真大，您感受最深的是什么？',
        '阿姨，您说的那个{interest}，我后来也试了，确实有意思。',
        '叔叔，您最近身体怎么样？上次听说腰不太好，好些了吗？',
        '阿姨，您家装修得真好，这个风格我特别喜欢。',
        '叔叔，您最近精神头真好，有什么养生秘诀吗？',
        '阿姨，这道菜太香了，您是怎么做的？回去我也试试。'
      ],
      safe:[
        '亲戚近况','家乡变化','小时候趣事',
        '家常菜','节日习俗','养生话题',
        '子女成长','老邻居近况','家乡新景点',
        '节气养生','家庭聚会回忆','老物件的故事',
        '最近的旅行','退休生活','家乡美食'
      ],
      deep:[
        '家族这些年的变迁','长辈的人生经验',
        '亲戚间的互助故事','那个年代的回忆',
        '家族传承的东西','最珍贵的亲情记忆',
        '最难忘的家族大事','对晚辈的期望'
      ],
      warn:[
        '聊收入比较','催婚催生','评论其他亲戚',
        '聊家庭矛盾','过度炫耀','空手上门',
        '玩手机不理人','迟到早退','打断长辈',
        '聊敏感话题','抱怨生活','过度打听隐私'
      ]
    },
    elder:{
      open:[
        '爷爷/奶奶，我来看您了，最近身体怎么样？',
        '给您带了您爱吃的，还有那个{interest}用的东西。',
        '您今天精神真好，我们聊会儿天吧。',
        '上次您说的那个故事，我回去还想了好久，今天再给我讲讲？',
        '您看今天天气好，要不要出去走走？',
        '爷爷，您以前做{job}的时候，有什么有趣的事吗？',
        '奶奶，您今天穿的这件衣服真好看，颜色特别衬您。',
        '爷爷，我学会做您上次教我的那道菜了，改天做给您尝尝。',
        '奶奶，您今天气色真好，是不是有什么开心的事？',
        '爷爷，最近天气变化大，您要注意保暖，别感冒了。'
      ],
      safe:[
        '身体状况','饮食起居','最近的天气',
        '养生心得','老友近况','回忆往事',
        '家里小辈的近况','节气养生','日常消遣',
        '老照片','家乡变化','节日期待',
        '邻居近况','最近的新闻','饮食偏好'
      ],
      deep:[
        '年轻时最难忘的经历','人生最重要的感悟',
        '对后辈的嘱托','最珍贵的回忆',
        '那个年代的故事','家族传承的期望',
        '最骄傲的一件事','对生活的态度'
      ],
      warn:[
        '表现出不耐烦','玩手机不理人','声音太小听不清',
        '反驳长辈观点','聊令长辈担心的事','迟到',
        '空手上门','待的时间太短','打断长辈回忆',
        '聊死亡话题','过度追问健康细节','表现出敷衍'
      ]
    },
    inlaw:{
      open:[
        '叔叔阿姨好，今天特意来拜访，一点心意您收下。',
        '家里布置得真讲究，一看就是讲究人家。',
        '阿姨，XX总说您做饭好吃，今天终于尝到了，真名不虚传。',
        '叔叔，听说您退休前做{job}？那可是好职业。',
        '今天来就是想好好认识认识，以后多走动。',
        '阿姨，您养的花真好看，我也想学学。',
        '叔叔，这茶是我特意带的，您品品合不合口味。',
        '阿姨，XX总说您{interest}手艺特别好，今天正好学习学习。',
        '叔叔，您退休后生活安排得挺丰富吧？',
        '阿姨，您家阳台采光真好，养花一定长得不错。'
      ],
      safe:[
        '夸家里布置','问长辈健康','聊两个孩子的事',
        '家乡风物','家常菜','节气养生',
        '退休生活','兴趣爱好','家庭近况',
        '节日安排','旅行经历','养生心得',
        '邻居趣事','最近的新闻','家乡美食'
      ],
      deep:[
        '两个家庭的共同期待','对孩子们未来的祝福',
        '家庭相处的智慧','亲家之间的走动',
        '人生经验的分享','家族传统的延续',
        '最骄傲的家庭记忆','对年轻一代的建议'
      ],
      warn:[
        '谈彩礼嫁妆','聊财产分配','催婚催生',
        '评论对方家庭','空手上门','过度表现',
        '玩手机','迟到','打断长辈',
        '聊敏感话题','比较两个家庭','过度打听'
      ]
    }
  },

  party:{
    wedding:{
      open:[
        '您好，我是XX，今天新郎/新娘的朋友。您是哪边的呀？',
        '这婚礼布置得真用心，您觉得呢？',
        '您和新郎/新娘怎么认识的呀？',
        '今天菜不错，您尝过那个特色菜了吗？',
        '您是从外地来的吗？路上辛苦了。',
        '这桌就咱俩眼生，正好认识认识。',
        '婚礼仪式真感人，您看哭了吗？我差点没忍住。',
        '您今天怎么来的？这边停车还方便吗？',
        '婚礼上的音乐选得真好，您觉得呢？',
        '今天新郎/新娘状态真好，您认识TA多久了？'
      ],
      safe:[
        '和主角的关系','对婚礼的感受','菜品评价',
        '共同认识的人','最近的有趣小事','家乡话题',
        '旅行经历','最近的剧','美食推荐',
        '运动爱好','宠物话题','最近的好消息',
        '婚礼习俗差异','现场氛围','新人的故事'
      ],
      deep:[
        '对婚姻的看法','最感动的婚礼瞬间',
        '和新郎/新娘最难忘的回忆','对幸福的理解',
        '最近的人生感悟','想对新人说的话',
        '理想的爱情样子','最珍贵的友情记忆'
      ],
      warn:[
        '打听对方收入','聊政治/社会争议','过度敬酒劝酒',
        '冷场就刷手机','评价其他客人','追问私人感情状况',
        '聊前任','抱怨生活','过度炫耀',
        '迟到','穿白色衣服','打断司仪'
      ]
    },
    dinner:{
      open:[
        '您好，我是XX，很高兴认识您。',
        '这桌就咱俩不认识？正好交个朋友。',
        '您是怎么认识组局的这位的？',
        '今天这店选得真好，您来过吗？',
        '您平时也喜欢{interest}吗？我看您朋友圈发过。',
        '今天人挺齐，您和大家认识很久了吧？',
        '这道菜真不错，您尝了吗？',
        '您是做什么行业的？听起来挺有意思的。',
        '今天这氛围真好，您平时常参加这种聚会吗？',
        '这道菜是这家的招牌，您尝了吗？'
      ],
      safe:[
        '和组局者的关系','最近的趣事','美食话题',
        '旅行计划','最近的剧/电影','运动爱好',
        '宠物话题','工作趣事','家乡话题',
        '最近的好消息','阅读推荐','音乐分享',
        '新发现的店','周末安排','最近开心的事'
      ],
      deep:[
        '最近的人生感悟','对某个话题的深入看法',
        '最难忘的经历','对未来的期待',
        '最想做的事','一个改变你的决定',
        '理想的生活状态','最珍贵的友谊'
      ],
      warn:[
        '打听收入','聊政治争议','过度劝酒',
        '玩手机冷场','评价其他客人','追问感情',
        '聊负面话题','过度炫耀','迟到',
        '只和认识的人聊','打断别人','聊太私人的事'
      ]
    },
    team:{
      open:[
        '今天终于不聊工作了，大家最近怎么样？',
        '上次那个项目辛苦大家了，今天好好放松。',
        '这活动选得不错，谁组织的呀？',
        '咱部门好久没这么齐了，难得。',
        '今天别聊KPI了，聊点开心的。',
        '您最近{interest}玩得怎么样？上次看您发朋友圈了。',
        '今天这地方真不错，下次团建还来这儿。',
        '最近忙完那阵子，终于能喘口气了。',
        '今天这天气适合出来玩，比待在办公室强多了。',
        '咱部门吃货挺多的，下次聚餐选哪家好？'
      ],
      safe:[
        '最近的趣事','美食推荐','旅行计划',
        '最近的剧/电影','运动爱好','宠物话题',
        '家乡美食','周末安排','最近的好消息',
        '新发现的店','阅读推荐','音乐分享',
        '最近学会的新技能','新养的植物','最近的爱好'
      ],
      deep:[
        '最难忘的团队记忆','工作之外的兴趣',
        '对未来的期待','最想感谢的同事',
        '理想的工作状态','最近的人生感悟',
        '最想尝试的新事物','对团队氛围的看法'
      ],
      warn:[
        '聊KPI/绩效','抱怨公司/领导','聊同事八卦',
        '过度劝酒','玩手机不理人','谈薪资',
        '聊加班','负面情绪','拉帮结派',
        '迟到早退','打断别人','聊太私人的事'
      ]
    },
    stranger:{
      open:[
        '您好，我是XX，第一次来这个局，您呢？',
        '这活动挺有意思的，您怎么知道这个局的？',
        '您平时也参加这种活动吗？',
        '今天人挺多的，您和谁是朋友？',
        '这环境不错，您来过这里吗？',
        '看您挺面善，我们是不是在哪见过？',
        '您平时周末一般怎么安排？',
        '这活动组织得真不错，您觉得呢？',
        '今天来的人挺有趣的，您已经认识几个新朋友了？',
        '这地方环境不错，您之前来过这一带吗？'
      ],
      safe:[
        '怎么知道这个活动的','平时的兴趣爱好','最近的趣事',
        '美食推荐','旅行经历','最近的剧/电影',
        '运动爱好','宠物话题','家乡话题',
        '工作领域（轻松带过）','周末习惯','音乐分享',
        '最近的好消息','新发现的好店','最近读的书'
      ],
      deep:[
        '参加活动的感受','最近的人生感悟',
        '最难忘的经历','对某个话题的看法',
        '最想做的事','理想的生活状态',
        '最近想明白的事','对社交的看法'
      ],
      warn:[
        '打听收入','聊政治争议','过度追问隐私',
        '玩手机冷场','评价其他人','聊负面话题',
        '过度炫耀','只说不问','迟到',
        '过度亲密','聊前任','推销东西'
      ]
    }
  }
};

/* ============================================================
   生成引擎
   ============================================================ */

const state = {
  scene:'date',
  role:'first',
  jobs:[],
  interests:[]
};

// 最近 3 次生成的结果，用于"换一张"时排除重复
const recentResults = [];
const MAX_HISTORY = 3;

function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){
  const copy=[...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

// 替换模板变量（仅替换有值的占位符）
function fillTemplate(tpl){
  let result=tpl;
  if(state.jobs.length>0){
    result=result.replace(/\{job\}/g,pick(state.jobs));
  }
  if(state.interests.length>0){
    result=result.replace(/\{interest\}/g,pick(state.interests));
  }
  return result;
}

// 过滤掉无法填充占位符的模板
function filterValidTemplates(arr){
  return arr.filter(t=>{
    if(t.includes('{job}')&&state.jobs.length===0)return false;
    if(t.includes('{interest}')&&state.interests.length===0)return false;
    return true;
  });
}

// 排除最近多次结果，确保"换一张"持续有新鲜感
function pickUnique(pool,count,excludeArrs){
  const allExclude=[].concat(...excludeArrs);
  let available=pool.filter(t=>!allExclude.includes(t));
  if(available.length<count){
    available=pool.filter(t=>!excludeArrs[0].includes(t));
  }
  if(available.length<count){
    available=pool;
  }
  return shuffle(available).slice(0,count);
}

// 主生成函数
function generate(isRegen){
  const scene=state.scene;
  const role=state.role;
  const lib=LIB[scene]?.[role];
  if(!lib){return null;}

  // 收集最近 N 次的排除池
  const histOpens=recentResults.map(r=>r.opens);
  const histSafe=recentResults.map(r=>r.safe);
  const histDeep=recentResults.map(r=>r.deep);
  const histWarn=recentResults.map(r=>r.warn);

  // 1. 开场白：过滤无效模板 → 排除历史 → 选3条 → 填充变量
  const validOpens=filterValidTemplates(lib.open);
  const openRaw=pickUnique(validOpens,3,histOpens);
  const opens=openRaw.map(t=>fillTemplate(t));

  // 2. 安全话题：通用 + 职业/兴趣相关 → 去重 → 排除历史 → 选6条
  let safePool=[...lib.safe];
  state.jobs.forEach(j=>{if(JOB_TOPICS[j])safePool.push(...JOB_TOPICS[j]);});
  state.interests.forEach(i=>{if(INTEREST_TOPICS[i])safePool.push(...INTEREST_TOPICS[i]);});
  const safeUnique=[...new Set(safePool)];
  const safe=pickUnique(safeUnique,6,histSafe);

  // 3. 深度话题：选4条
  const deep=pickUnique(lib.deep,4,histDeep);

  // 4. 避雷清单：选6条
  const warn=pickUnique(lib.warn,6,histWarn);

  const result={opens,safe,deep,warn,sceneLabel:SCENES[scene].label,roleLabel:SCENES[scene].roles.find(r=>r.val===role)?.label||''};
  
  // 记入历史，保持最多 MAX_HISTORY 条
  recentResults.push(result);
  if(recentResults.length>MAX_HISTORY){recentResults.shift();}
  
  return result;
}

/* ============================================================
   UI 渲染
   ============================================================ */

function renderRoles(){
  const scene=SCENES[state.scene];
  const grid=document.getElementById('roleGrid');
  grid.innerHTML=scene.roles.map((r,i)=>`
    <div class="opt ${i===0?'active':''}" data-val="${r.val}">
      <span class="ic">${r.ic}</span>${r.label}<span class="en">${r.val}</span>
    </div>
  `).join('');
  state.role=scene.roles[0].val;
}

function renderSuggest(){
  const jobSg=document.getElementById('jobSuggest');
  const intSg=document.getElementById('interestSuggest');
  jobSg.innerHTML=JOB_SUGGEST.filter(j=>!state.jobs.includes(j)).slice(0,8)
    .map(j=>`<span class="sg" data-val="${j}">${j}</span>`).join('');
  intSg.innerHTML=INTEREST_SUGGEST.filter(i=>!state.interests.includes(i)).slice(0,8)
    .map(i=>`<span class="sg" data-val="${i}">${i}</span>`).join('');
}

function renderTags(wrapId,arr){
  const wrap=document.getElementById(wrapId);
  const input=wrap.querySelector('.tag-input');
  wrap.querySelectorAll('.tag-chip').forEach(c=>c.remove());
  arr.forEach((v,i)=>{
    const chip=document.createElement('span');
    chip.className='tag-chip';
    chip.innerHTML=`${v} <span class="x" data-idx="${i}">×</span>`;
    wrap.insertBefore(chip,input);
  });
}

function renderResult(data){
  const area=document.getElementById('outputArea');
  const capLabel=`${data.sceneLabel} / ${data.roleLabel}`;

  area.innerHTML=`
    <div class="result-head reveal">
      <div class="l">破冰卡 · <span class="it">${capLabel}</span></div>
      <div class="r">GENERATED · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>
    <div class="cards-wrap">
      <div class="cards">
        <div class="icecard c-open">
          <div class="hd"><span>开场白 · 直接念</span><span class="no">01</span></div>
          <div class="bd">${data.opens.map(o=>`<div class="quote">"${o}"</div>`).join('')}</div>
        </div>
        <div class="icecard c-safe">
          <div class="hd"><span>安全话题 · 随便聊</span><span class="no">02</span></div>
          <div class="bd"><ul>${data.safe.map(t=>`<li>${t}</li>`).join('')}</ul></div>
        </div>
        <div class="icecard c-deep">
          <div class="hd"><span>深度话题 · 聊嗨了再用</span><span class="no">03</span></div>
          <div class="bd"><ul>${data.deep.map(t=>`<li>${t}</li>`).join('')}</ul></div>
        </div>
        <div class="icecard c-warn">
          <div class="hd"><span>避雷清单 · 千万别踩</span><span class="no">04</span></div>
          <div class="bd"><ul>${data.warn.map(t=>`<li>${t}</li>`).join('')}</ul></div>
        </div>
      </div>
    </div>
    <div class="result-actions reveal">
      <button class="act-btn primary" id="regenBtn">↻ 换一张</button>
      <button class="act-btn" id="copyBtn">📋 复制全部</button>
    </div>
  `;

  setTimeout(()=>{
    area.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
    area.querySelectorAll('.icecard').forEach((el,i)=>{
      setTimeout(()=>el.classList.add('show'),i*100);
    });
  },50);

  document.getElementById('regenBtn').onclick=()=>doGenerate(true);
  document.getElementById('copyBtn').onclick=copyResult;
}

function showLoading(){
  const msgs=['正在为你组织语言…','从话题库里挑选中…','避开雷区话题…','排版你的破冰卡…'];
  document.getElementById('outputArea').innerHTML=`
    <div class="loading">
      <div class="stamp">GENERATING</div>
      <div class="msg">${pick(msgs)}</div>
    </div>
  `;
}

function doGenerate(isRegen){
  showLoading();
  setTimeout(()=>{
    const data=generate(isRegen);
    if(!data){showToast('生成失败，请检查输入');return;}
    renderResult(data);
  },800);
}

function copyResult(){
  const cards=document.querySelectorAll('.icecard');
  let text='【社恐救星 · 破冰卡】\n\n';
  cards.forEach(c=>{
    const title=c.querySelector('.hd span').textContent;
    text+=`▼ ${title}\n`;
    const bd=c.querySelector('.bd');
    if(bd.querySelector('ul')){
      bd.querySelectorAll('li').forEach(li=>text+=`  · ${li.textContent}\n`);
    }else{
      bd.querySelectorAll('.quote').forEach(q=>text+=`  ${q.textContent}\n`);
    }
    text+='\n';
  });
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>showToast('已复制到剪贴板')).catch(()=>fallbackCopy(text));
  }else{
    fallbackCopy(text);
  }
}

// 剪贴板 API 不可用时的兜底方案
function fallbackCopy(text){
  const ta=document.createElement('textarea');
  ta.value=text;
  ta.style.position='fixed';
  ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.select();
  try{
    document.execCommand('copy');
    showToast('已复制到剪贴板');
  }catch(e){
    showToast('复制失败，请手动选中文字复制');
  }
  document.body.removeChild(ta);
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

/* ============================================================
   事件绑定
   ============================================================ */

document.getElementById('sceneGrid').addEventListener('click',e=>{
  const opt=e.target.closest('.opt');
  if(!opt)return;
  document.querySelectorAll('#sceneGrid .opt').forEach(o=>o.classList.remove('active'));
  opt.classList.add('active');
  state.scene=opt.dataset.val;
  renderRoles();
  recentResults.length=0; // 切换场景时清空历史
});

document.getElementById('roleGrid').addEventListener('click',e=>{
  const opt=e.target.closest('.opt');
  if(!opt)return;
  document.querySelectorAll('#roleGrid .opt').forEach(o=>o.classList.remove('active'));
  opt.classList.add('active');
  state.role=opt.dataset.val;
  recentResults.length=0;
});

function setupTagInput(inputId,wrapId,arr,suggestId){
  const input=document.getElementById(inputId);
  const wrap=document.getElementById(wrapId);

  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===','){
      e.preventDefault();
      const val=input.value.trim();
      if(val&&!arr.includes(val)){
        arr.push(val);
        renderTags(wrapId,arr);
        renderSuggest();
        input.value='';
      }
    }
  });

  wrap.addEventListener('click',e=>{
    if(e.target.classList.contains('x')){
      const idx=parseInt(e.target.dataset.idx);
      arr.splice(idx,1);
      renderTags(wrapId,arr);
      renderSuggest();
    }
  });

  document.getElementById(suggestId).addEventListener('click',e=>{
    if(e.target.classList.contains('sg')){
      const val=e.target.dataset.val;
      if(!arr.includes(val)){
        arr.push(val);
        renderTags(wrapId,arr);
        renderSuggest();
      }
    }
  });
}

setupTagInput('jobInput','jobWrap',state.jobs,'jobSuggest');
setupTagInput('interestInput','interestWrap',state.interests,'interestSuggest');

document.getElementById('genBtn').addEventListener('click',()=>doGenerate(false));

document.getElementById('resetBtn').addEventListener('click',()=>{
  state.scene='date';
  state.role='first';
  state.jobs=[];
  state.interests=[];
  recentResults.length=0;
  document.querySelectorAll('#sceneGrid .opt').forEach((o,i)=>o.classList.toggle('active',i===0));
  renderRoles();
  renderTags('jobWrap',state.jobs);
  renderTags('interestWrap',state.interests);
  renderSuggest();
  document.getElementById('outputArea').innerHTML=`
    <div class="output-empty reveal">
      <div class="ic">✦</div>
      <p>填好左边，点"生成破冰卡"，结果会出现在这里</p>
    </div>
  `;
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  showToast('已重置');
});

/* ============================================================
   初始化
   ============================================================ */
renderRoles();
renderSuggest();

const io=new IntersectionObserver((es)=>{
  es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ============================================================
   封面 slogan 打字机
   ============================================================ */
function initTypewriter(){
  const el=document.getElementById('coverSlogan');
  if(!el)return;
  
  // 原始内容：告别社交[冷场]，5 秒生成你的专属破冰卡
  // "冷场"是 .em 红字部分
  const before='告别社交';
  const emText='冷场';
  const after='，5 秒生成你的专属破冰卡';
  const fullText=before+emText+after;
  
  // 无障碍 / 移动端：直接显示完整文字
  const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isMobile=window.matchMedia('(max-width:560px)').matches;
  if(reduceMotion||isMobile){
    el.innerHTML=before+'<span class="em">'+emText+'</span>'+after;
    document.getElementById('coverDeck')?.classList.add('in');
    document.getElementById('coverCta')?.classList.add('in');
    return;
  }
  
  // 真打字机
  let i=0;
  const caret=document.createElement('span');
  caret.className='caret';
  el.appendChild(caret);
  
  // 延迟启动，等 name-en 淡入后开始（约1.1s）
  setTimeout(()=>{
    const timer=setInterval(()=>{
      if(i>=fullText.length){
        clearInterval(timer);
        // 打完，光标闪几下后消失
        setTimeout(()=>caret.classList.add('done'),800);
        // 延迟触发 deck 和 cta 的 reveal
        setTimeout(()=>{
          document.querySelector('.cover-deck')?.classList.add('in');
        },200);
        setTimeout(()=>{
          document.querySelector('.cover-cta')?.classList.add('in');
        },400);
        return;
      }
      
      const char=fullText[i];
      let node;
      // 判断当前字符是否在 .em 范围内
      if(i>=before.length&&i<before.length+emText.length){
        node=document.createElement('span');
        node.className='em';
        node.textContent=char;
      }else{
        node=document.createTextNode(char);
      }
      el.insertBefore(node,caret);
      i++;
    },75); // 75ms/字，18字≈1.35秒
  },1100);
}

// 页面加载后启动打字机
window.addEventListener('load',initTypewriter);
