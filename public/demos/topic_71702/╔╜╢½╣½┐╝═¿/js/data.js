// 山东省17地市及县区官方网站数据（网址经网络搜索验证）
const cityData = [
  {
    name: "济南市",
    districts: ["历下区", "市中区", "槐荫区", "天桥区", "历城区", "长清区", "章丘区", "济阳区", "莱芜区", "钢城区", "平阴县", "商河县"],
    websites: {
      gov: "https://www.jinan.gov.cn",
      rsj: "http://jnhrss.jinan.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "青岛市",
    districts: ["市南区", "市北区", "黄岛区", "崂山区", "李沧区", "城阳区", "即墨区", "胶州市", "平度市", "莱西市"],
    websites: {
      gov: "http://www.qingdao.gov.cn",
      rsj: "https://hrss.qingdao.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "淄博市",
    districts: ["张店区", "淄川区", "博山区", "临淄区", "周村区", "桓台县", "高青县", "沂源县"],
    websites: {
      gov: "https://www.zibo.gov.cn",
      rsj: "http://hrss.zibo.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "枣庄市",
    districts: ["市中区", "薛城区", "峄城区", "台儿庄区", "山亭区", "滕州市"],
    websites: {
      gov: "http://www.zaozhuang.gov.cn",
      rsj: "http://zzhrss.zaozhuang.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "东营市",
    districts: ["东营区", "河口区", "垦利区", "利津县", "广饶县"],
    websites: {
      gov: "http://www.dongying.gov.cn",
      rsj: "http://dylss.dongying.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "烟台市",
    districts: ["芝罘区", "福山区", "牟平区", "莱山区", "蓬莱区", "龙口市", "莱阳市", "莱州市", "招远市", "栖霞市", "海阳市"],
    websites: {
      gov: "http://www.yantai.gov.cn",
      rsj: "https://rshj.yantai.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "潍坊市",
    districts: ["潍城区", "寒亭区", "坊子区", "奎文区", "青州市", "诸城市", "寿光市", "安丘市", "高密市", "昌邑市", "临朐县", "昌乐县"],
    websites: {
      gov: "http://www.weifang.gov.cn",
      rsj: "http://rsj.weifang.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "济宁市",
    districts: ["任城区", "兖州区", "曲阜市", "邹城市", "微山县", "鱼台县", "金乡县", "嘉祥县", "汶上县", "泗水县", "梁山县"],
    websites: {
      gov: "http://www.jining.gov.cn",
      rsj: "http://hrss.jining.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "泰安市",
    districts: ["泰山区", "岱岳区", "新泰市", "肥城市", "宁阳县", "东平县"],
    websites: {
      gov: "https://www.taian.gov.cn",
      rsj: "http://rsj.taian.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "威海市",
    districts: ["环翠区", "文登区", "荣成市", "乳山市"],
    websites: {
      gov: "https://www.weihai.gov.cn",
      rsj: "http://rsj.weihai.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "日照市",
    districts: ["东港区", "岚山区", "五莲县", "莒县"],
    websites: {
      gov: "http://www.rizhao.gov.cn",
      rsj: "http://hrss.rizhao.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "临沂市",
    districts: ["兰山区", "罗庄区", "河东区", "沂南县", "郯城县", "沂水县", "兰陵县", "费县", "平邑县", "莒南县", "蒙阴县", "临沭县"],
    websites: {
      gov: "http://www.linyi.gov.cn",
      rsj: "http://rsj.linyi.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "德州市",
    districts: ["德城区", "陵城区", "乐陵市", "禹城市", "宁津县", "庆云县", "临邑县", "齐河县", "平原县", "夏津县", "武城县"],
    websites: {
      gov: "http://www.dezhou.gov.cn",
      rsj: "http://hrss.dezhou.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "聊城市",
    districts: ["东昌府区", "茌平区", "临清市", "阳谷县", "莘县", "东阿县", "冠县", "高唐县"],
    websites: {
      gov: "http://www.liaocheng.gov.cn",
      rsj: "http://rsj.liaocheng.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "滨州市",
    districts: ["滨城区", "沾化区", "邹平市", "惠民县", "阳信县", "无棣县", "博兴县"],
    websites: {
      gov: "http://www.binzhou.gov.cn",
      rsj: "http://rs.binzhou.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  },
  {
    name: "菏泽市",
    districts: ["牡丹区", "定陶区", "曹县", "单县", "成武县", "巨野县", "郓城县", "鄄城县", "东明县"],
    websites: {
      gov: "http://www.heze.gov.cn",
      rsj: "http://hzrsj.heze.gov.cn",
      exam: "http://hrss.shandong.gov.cn/channels/ch00330/"
    }
  }
];

// 考试类型
const examTypes = ["省考", "事业单位", "选调生", "教师招聘", "医疗招聘"];

// 山东省各市公考信息数据
const examData = [
  {
    id: 1,
    title: "2026年山东省省级机关及其直属机构考试录用公务员公告",
    city: "济南市",
    type: "省考",
    status: "报名中",
    publishDate: "2026-01-08",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 8194,
    applyCount: 325600,
    competitionRatio: "39.7:1",
    salaryRange: "6000-9000元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "山东省户籍或山东省内高校应届毕业生",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据公务员法和公务员录用有关规定，现将2026年度山东省省级机关及其直属机构招录公务员有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）18周岁以上、35周岁以下（1990年1月至2008年1月期间出生），2026年应届硕士研究生和博士研究生（非在职人员）报考的，放宽到40周岁以下（1985年1月以后出生）；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学专科以上文化程度；\n（八）具备拟任职位所要求的其他资格条件。\n\n二、报名程序\n（一）职位查询：各招录机关的招考人数、具体职位、考试类别、资格条件等详见招考职位表。\n（二）网上报名：本次招考采取网上报名方式，报名网站为山东省人事考试信息网。\n1. 提交报考申请：2026年1月17日9:00至1月23日16:00\n2. 查询资格审查结果：2026年1月17日11:00至1月24日16:00\n3. 网上缴费确认：2026年1月17日11:00至1月25日16:00`,
    officialUrl: "http://hrss.shandong.gov.cn",
    positions: [
      { name: "省政府办公厅综合文秘", count: 5, major: "汉语言文学、新闻学", education: "研究生" },
      { name: "省发改委经济管理", count: 8, major: "经济学、金融学", education: "研究生" },
      { name: "省教育厅教育管理", count: 12, major: "教育学、管理学", education: "本科及以上" },
      { name: "省公安厅刑事侦查", count: 30, major: "法学、公安学类", education: "本科及以上" }
    ]
  },
  {
    id: 2,
    title: "2026年青岛市各级机关考试录用公务员公告",
    city: "青岛市",
    type: "省考",
    status: "报名中",
    publishDate: "2026-01-10",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 1268,
    applyCount: 58600,
    competitionRatio: "46.2:1",
    salaryRange: "6500-9500元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "青岛户籍或山东生源",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据《中华人民共和国公务员法》和公务员录用有关规定，按照公开、平等、竞争、择优的原则，青岛市各级机关2026年度考试录用一级主任科员及以下和其他相当职级层次公务员1268名。现将有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）年龄一般为18周岁以上、35周岁以下（1990年1月至2008年1月期间出生）；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学本科以上文化程度；\n（八）具备青岛市公务员主管部门规定的拟任职位所要求的其他资格条件。\n\n二、报名方式\n本次考试报名采取网上报名方式，按以下程序进行：\n1. 提交报考申请：2026年1月17日9:00至1月23日16:00\n2. 查询资格审查结果：2026年1月17日11:00至1月24日16:00\n3. 网上缴费确认：2026年1月17日11:00至1月25日16:00\n4. 打印准考证：2026年3月10日9:00至3月15日9:30`,
    officialUrl: "https://hrss.qingdao.gov.cn",
    positions: [
      { name: "市北区综合管理", count: 15, major: "不限专业", education: "本科及以上" },
      { name: "崂山区经济发展", count: 10, major: "经济学类", education: "本科及以上" },
      { name: "黄岛区规划建设", count: 20, major: "建筑学、城乡规划", education: "本科及以上" },
      { name: "即墨区农业农村", count: 8, major: "农学类、管理学", education: "本科及以上" }
    ]
  },
  {
    id: 3,
    title: "2026年烟台市考试录用公务员公告",
    city: "烟台市",
    type: "省考",
    status: "即将开始",
    publishDate: "2026-01-12",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 856,
    applyCount: 38200,
    competitionRatio: "44.6:1",
    salaryRange: "6000-8500元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "烟台户籍或山东生源",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据公务员法和公务员录用规定等法律法规，烟台市公务员局将组织实施烟台市各级机关2026年度考试录用公务员工作。全市各级机关计划招录公务员856名。现将有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）18周岁以上、35周岁以下（1990年1月至2008年1月期间出生），2026年应届硕士、博士研究生（非在职）放宽到40周岁以下；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学本科以上文化程度。\n\n二、招录计划\n2026年全市各级机关计划招录公务员856名，其中市直机关156名，县（市、区）机关520名，乡镇机关180名。具体招录职位和资格条件详见《烟台市2026年度考试录用公务员职位表》。`,
    officialUrl: "https://rshj.yantai.gov.cn",
    positions: [
      { name: "芝罘区综合管理", count: 12, major: "不限专业", education: "本科及以上" },
      { name: "福山区经济管理", count: 8, major: "经济学类", education: "本科及以上" },
      { name: "牟平区文秘", count: 6, major: "汉语言文学", education: "本科及以上" },
      { name: "莱山区法律事务", count: 10, major: "法学类", education: "本科及以上" }
    ]
  },
  {
    id: 4,
    title: "2026年济南市事业单位公开招聘工作人员公告",
    city: "济南市",
    type: "事业单位",
    status: "报名中",
    publishDate: "2026-02-05",
    registrationStart: "2026-02-15",
    registrationEnd: "2026-02-21",
    examDate: "2026-03-29",
    positionCount: 2156,
    applyCount: 89500,
    competitionRatio: "41.5:1",
    salaryRange: "5500-8000元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历（部分岗位要求本科）",
      age: "18-35周岁（部分岗位40周岁以下）",
      household: "济南户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》（国务院令第652号）和《山东省事业单位公开招聘人员实施办法》等有关规定，经济南市事业单位公开招聘主管机关核准，济南市各级事业单位面向社会公开招聘工作人员2156名。现将有关事项公告如下：\n\n一、招聘范围和条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下（1985年2月15日以后出生）；\n（五）具备招聘岗位要求的专业或技能条件；\n（六）法律、法规规定的其他条件。\n\n二、招聘岗位\n招聘岗位、招聘人数、岗位条件等详见《济南市2026年事业单位公开招聘岗位汇总表》。本次招聘涉及教育、卫生、农业、文化、科技等多个领域。\n\n三、报名方式\n报名采取统一时间、网上报名、网上初审、网上缴费的方式进行。\n报名时间：2026年2月15日9:00—2月21日16:00\n查询时间：2026年2月15日11:00—2月22日16:00\n缴费时间：2026年2月15日11:00—2月23日16:00`,
    officialUrl: "http://jnhrss.jinan.gov.cn",
    positions: [
      { name: "市属学校教师", count: 320, major: "教育学类、各学科", education: "本科及以上" },
      { name: "市属医院医师", count: 186, major: "临床医学、护理学", education: "本科及以上" },
      { name: "市属科研院所", count: 45, major: "理工科各专业", education: "研究生" },
      { name: "基层公共服务", count: 580, major: "不限专业", education: "专科及以上" }
    ]
  },
  {
    id: 5,
    title: "2026年淄博市事业单位公开招聘公告",
    city: "淄博市",
    type: "事业单位",
    status: "即将开始",
    publishDate: "2026-02-10",
    registrationStart: "2026-02-20",
    registrationEnd: "2026-02-26",
    examDate: "2026-04-05",
    positionCount: 986,
    applyCount: 42300,
    competitionRatio: "42.9:1",
    salaryRange: "5000-7500元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历",
      age: "18-35周岁",
      household: "淄博户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》规定，淄博市各级事业单位面向社会公开招聘工作人员986名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下（1985年2月以后出生）；\n（五）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位及计划\n本次招聘共涉及事业单位286个，招聘工作人员986名。其中教育系统356名，卫生系统218名，其他事业单位412名。`,
    officialUrl: "http://hrss.zibo.gov.cn",
    positions: [
      { name: "张店区教育系统", count: 120, major: "教育学类", education: "本科及以上" },
      { name: "淄川区卫生系统", count: 85, major: "医学类", education: "本科及以上" },
      { name: "博山区综合管理", count: 60, major: "不限专业", education: "专科及以上" },
      { name: "临淄区专业技术", count: 75, major: "理工科各专业", education: "本科及以上" }
    ]
  },
  {
    id: 6,
    title: "2026年山东省选调生招录公告（面向山东大学等高校）",
    city: "济南市",
    type: "选调生",
    status: "已结束",
    publishDate: "2025-11-20",
    registrationStart: "2025-11-25",
    registrationEnd: "2025-12-01",
    examDate: "2026-01-11",
    positionCount: 500,
    applyCount: 12800,
    competitionRatio: "25.6:1",
    salaryRange: "6000-9000元/月",
    subjects: ["行政职业能力测验", "申论", "综合知识"],
    requirements: {
      education: "本科及以上学历（定向选调要求研究生）",
      age: "本科25周岁以下，硕士30周岁以下，博士35周岁以下",
      household: "不限户籍",
      political: "中共党员（含预备党员）"
    },
    content: `为进一步加强山东省干部队伍源头建设，优化干部队伍结构，根据公务员法和公务员录用有关规定，以及山东省选调生工作有关要求，经研究，决定面向部分高校选调一批2026年应届优秀大学毕业生到山东省基层工作。现将有关事项公告如下：\n\n一、选调对象\n（一）定向选调：面向山东大学、中国海洋大学、中国石油大学（华东）等42所重点高校2026年应届毕业生。\n（二）常规选调：面向省内普通高校及部分省外高校2026年应届毕业生。\n\n二、选调条件\n（一）具有中华人民共和国国籍，且无国（境）外永久居住权。\n（二）政治素质好，有为国家为人民服务的理想抱负，自觉践行社会主义核心价值观。\n（三）中共党员（含中共预备党员），或担任过学生干部，或获得过院系级以上奖励。\n（四）学习成绩优良，能在2026年7月底前取得相应学历学位证书。\n（五）本科生年龄不超过25周岁，硕士研究生年龄不超过30周岁，博士研究生年龄不超过35周岁。\n\n三、选调计划\n2026年全省计划选调500名，其中定向选调200名，常规选调300名。`,
    officialUrl: "http://hrss.shandong.gov.cn",
    positions: [
      { name: "定向选调（省直机关）", count: 50, major: "不限专业", education: "研究生" },
      { name: "定向选调（市直机关）", count: 150, major: "不限专业", education: "研究生" },
      { name: "常规选调（县乡机关）", count: 200, major: "不限专业", education: "本科及以上" },
      { name: "常规选调（街道社区）", count: 100, major: "不限专业", education: "本科及以上" }
    ]
  },
  {
    id: 7,
    title: "潍坊市2026年教育系统公开招聘教师公告",
    city: "潍坊市",
    type: "教师招聘",
    status: "报名中",
    publishDate: "2026-02-15",
    registrationStart: "2026-02-22",
    registrationEnd: "2026-02-28",
    examDate: "2026-03-22",
    positionCount: 1865,
    applyCount: 67800,
    competitionRatio: "36.3:1",
    salaryRange: "5000-7500元/月",
    subjects: ["教育理论", "学科专业知识"],
    requirements: {
      education: "本科及以上学历（部分幼儿教师专科）",
      age: "18-35周岁",
      household: "潍坊户籍或山东生源",
      political: "具有教师资格证"
    },
    content: `为充实潍坊市教师队伍，优化教师结构，根据《山东省事业单位公开招聘人员实施办法》和《潍坊市教师招聘实施办法》有关规定，潍坊市教育系统2026年面向社会公开招聘教师1865名。现将有关事项公告如下：\n\n一、招聘范围和条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下（1985年2月以后出生）；\n（五）具备相应的教师资格证书；\n（六）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及幼儿园、小学、初中、高中各学段，涵盖语文、数学、英语、物理、化学、生物、历史、地理、政治、音乐、美术、体育、信息技术等学科。\n\n三、报名方式\n报名时间：2026年2月22日9:00—2月28日16:00\n查询时间：2026年2月22日11:00—3月1日16:00\n缴费时间：2026年2月22日11:00—3月2日16:00`,
    officialUrl: "http://jyj.weifang.gov.cn",
    positions: [
      { name: "高中语文教师", count: 45, major: "汉语言文学", education: "本科及以上" },
      { name: "高中数学教师", count: 52, major: "数学与应用数学", education: "本科及以上" },
      { name: "初中英语教师", count: 68, major: "英语", education: "本科及以上" },
      { name: "小学全科教师", count: 320, major: "教育学类", education: "本科及以上" }
    ]
  },
  {
    id: 8,
    title: "临沂市2026年卫生健康系统公开招聘公告",
    city: "临沂市",
    type: "医疗招聘",
    status: "即将开始",
    publishDate: "2026-02-18",
    registrationStart: "2026-02-25",
    registrationEnd: "2026-03-03",
    examDate: "2026-04-12",
    positionCount: 1256,
    applyCount: 32500,
    competitionRatio: "25.9:1",
    salaryRange: "6000-10000元/月",
    subjects: ["医学基础知识", "专业知识"],
    requirements: {
      education: "本科及以上学历（部分岗位专科）",
      age: "18-35周岁（高级职称40周岁以下）",
      household: "临沂户籍或山东生源",
      political: "具有执业资格证"
    },
    content: `为加强临沂市卫生健康系统人才队伍建设，根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，临沂市卫生健康系统2026年面向社会公开招聘工作人员1256名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在35周岁以下（1990年2月以后出生），具有中级职称的可放宽到40周岁，具有高级职称的可放宽到45周岁；\n（五）具备相应的执业资格证书；\n（六）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及临床医学、护理学、药学、医学检验、医学影像、公共卫生等多个专业领域。\n\n三、报名方式\n报名采取网上报名方式。\n报名时间：2026年2月25日9:00—3月3日16:00`,
    officialUrl: "http://wsjsw.linyi.gov.cn",
    positions: [
      { name: "临床医师", count: 186, major: "临床医学", education: "本科及以上" },
      { name: "护理人员", count: 456, major: "护理学", education: "专科及以上" },
      { name: "药学人员", count: 68, major: "药学", education: "本科及以上" },
      { name: "公共卫生", count: 85, major: "预防医学", education: "本科及以上" }
    ]
  },
  {
    id: 9,
    title: "2026年威海市各级机关考试录用公务员公告",
    city: "威海市",
    type: "省考",
    status: "即将开始",
    publishDate: "2026-01-15",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 426,
    applyCount: 18900,
    competitionRatio: "44.4:1",
    salaryRange: "6000-8500元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "威海户籍或山东生源",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据公务员法和公务员录用有关规定，威海市公务员局将组织实施威海市各级机关2026年度考试录用公务员工作。全市各级机关计划招录公务员426名。现将有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）18周岁以上、35周岁以下；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学本科以上文化程度。\n\n二、招录计划\n2026年全市各级机关计划招录公务员426名，其中市直机关86名，区市机关280名，乡镇机关60名。`,
    officialUrl: "http://rsj.weihai.gov.cn",
    positions: [
      { name: "环翠区综合管理", count: 15, major: "不限专业", education: "本科及以上" },
      { name: "文登区经济管理", count: 12, major: "经济学类", education: "本科及以上" },
      { name: "荣成市规划建设", count: 18, major: "建筑学、城乡规划", education: "本科及以上" },
      { name: "乳山市农业管理", count: 8, major: "农学类", education: "本科及以上" }
    ]
  },
  {
    id: 10,
    title: "济宁市2026年事业单位公开招聘工作人员公告",
    city: "济宁市",
    type: "事业单位",
    status: "报名中",
    publishDate: "2026-02-08",
    registrationStart: "2026-02-18",
    registrationEnd: "2026-02-24",
    examDate: "2026-03-30",
    positionCount: 1685,
    applyCount: 56200,
    competitionRatio: "33.4:1",
    salaryRange: "5000-7500元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历（部分岗位本科）",
      age: "18-35周岁（部分岗位40周岁以下）",
      household: "济宁户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，济宁市各级事业单位面向社会公开招聘工作人员1685名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下（1985年2月以后出生）；\n（五）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及教育、卫生、农业、文化、科技、公共服务等多个领域，共招聘工作人员1685名。`,
    officialUrl: "http://hrss.jining.gov.cn",
    positions: [
      { name: "任城区教育系统", count: 156, major: "教育学类", education: "本科及以上" },
      { name: "兖州区卫生系统", count: 98, major: "医学类", education: "本科及以上" },
      { name: "曲阜市文化旅游", count: 45, major: "历史学、旅游管理", education: "本科及以上" },
      { name: "邹城市综合管理", count: 180, major: "不限专业", education: "专科及以上" }
    ]
  },
  {
    id: 11,
    title: "2026年德州市考试录用公务员公告",
    city: "德州市",
    type: "省考",
    status: "即将开始",
    publishDate: "2026-01-14",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 586,
    applyCount: 23500,
    competitionRatio: "40.1:1",
    salaryRange: "5500-8000元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "德州户籍或山东生源",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据公务员法和公务员录用有关规定，德州市公务员局将组织实施德州市各级机关2026年度考试录用公务员工作。全市各级机关计划招录公务员586名。现将有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）18周岁以上、35周岁以下；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学本科以上文化程度。\n\n二、招录计划\n2026年全市各级机关计划招录公务员586名，其中市直机关120名，县区机关380名，乡镇机关86名。`,
    officialUrl: "http://hrss.dezhou.gov.cn",
    positions: [
      { name: "德城区综合管理", count: 18, major: "不限专业", education: "本科及以上" },
      { name: "陵城区经济管理", count: 12, major: "经济学类", education: "本科及以上" },
      { name: "乐陵市农业管理", count: 15, major: "农学类", education: "本科及以上" },
      { name: "禹城市法律事务", count: 10, major: "法学类", education: "本科及以上" }
    ]
  },
  {
    id: 12,
    title: "泰安市2026年教育系统教师招聘公告",
    city: "泰安市",
    type: "教师招聘",
    status: "即将开始",
    publishDate: "2026-02-20",
    registrationStart: "2026-03-01",
    registrationEnd: "2026-03-07",
    examDate: "2026-04-19",
    positionCount: 985,
    applyCount: 38600,
    competitionRatio: "39.2:1",
    salaryRange: "5000-7500元/月",
    subjects: ["教育理论", "学科专业知识"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "泰安户籍或山东生源",
      political: "具有教师资格证"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，泰安市教育系统2026年面向社会公开招聘教师985名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在35周岁以下（1990年2月以后出生）；\n（五）具备相应的教师资格证书；\n（六）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及幼儿园、小学、初中、高中各学段，涵盖语文、数学、英语、物理、化学、生物、历史、地理、政治等学科。`,
    officialUrl: "http://jyj.taian.gov.cn",
    positions: [
      { name: "高中各科教师", count: 85, major: "对应学科专业", education: "本科及以上" },
      { name: "初中各科教师", count: 186, major: "对应学科专业", education: "本科及以上" },
      { name: "小学各科教师", count: 568, major: "教育学类", education: "本科及以上" },
      { name: "幼儿教师", count: 146, major: "学前教育", education: "专科及以上" }
    ]
  },
  {
    id: 13,
    title: "聊城市2026年事业单位公开招聘公告",
    city: "聊城市",
    type: "事业单位",
    status: "已结束",
    publishDate: "2025-12-20",
    registrationStart: "2025-12-28",
    registrationEnd: "2026-01-03",
    examDate: "2026-02-08",
    positionCount: 1156,
    applyCount: 45800,
    competitionRatio: "39.6:1",
    salaryRange: "5000-7000元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历",
      age: "18-35周岁",
      household: "聊城户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，聊城市各级事业单位面向社会公开招聘工作人员1156名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下；\n（五）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及教育、卫生、农业、文化、科技等多个领域。`,
    officialUrl: "http://rsj.liaocheng.gov.cn",
    positions: [
      { name: "东昌府区综合管理", count: 120, major: "不限专业", education: "专科及以上" },
      { name: "临清市教育系统", count: 156, major: "教育学类", education: "本科及以上" },
      { name: "高唐县卫生系统", count: 85, major: "医学类", education: "本科及以上" },
      { name: "阳谷县农业系统", count: 60, major: "农学类", education: "本科及以上" }
    ]
  },
  {
    id: 14,
    title: "2026年东营市各级机关考试录用公务员公告",
    city: "东营市",
    type: "省考",
    status: "即将开始",
    publishDate: "2026-01-13",
    registrationStart: "2026-01-17",
    registrationEnd: "2026-01-23",
    examDate: "2026-03-15",
    positionCount: 356,
    applyCount: 15800,
    competitionRatio: "44.4:1",
    salaryRange: "6000-8500元/月",
    subjects: ["行政职业能力测验", "申论"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁",
      household: "东营户籍或山东生源",
      political: "拥护中华人民共和国宪法"
    },
    content: `根据公务员法和公务员录用有关规定，东营市公务员局将组织实施东营市各级机关2026年度考试录用公务员工作。全市各级机关计划招录公务员356名。现将有关事项公告如下：\n\n一、报考条件\n（一）具有中华人民共和国国籍；\n（二）18周岁以上、35周岁以下；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有正常履行职责的身体条件和心理素质；\n（六）具有符合职位要求的工作能力；\n（七）具有大学本科以上文化程度。\n\n二、招录计划\n2026年全市各级机关计划招录公务员356名，其中市直机关76名，县区机关230名，乡镇机关50名。`,
    officialUrl: "http://dylss.dongying.gov.cn",
    positions: [
      { name: "东营区综合管理", count: 12, major: "不限专业", education: "本科及以上" },
      { name: "河口区经济管理", count: 8, major: "经济学类", education: "本科及以上" },
      { name: "垦利区农业管理", count: 10, major: "农学类", education: "本科及以上" },
      { name: "广饶县规划建设", count: 15, major: "建筑学", education: "本科及以上" }
    ]
  },
  {
    id: 15,
    title: "滨州市2026年卫生健康系统公开招聘公告",
    city: "滨州市",
    type: "医疗招聘",
    status: "即将开始",
    publishDate: "2026-02-22",
    registrationStart: "2026-03-02",
    registrationEnd: "2026-03-08",
    examDate: "2026-04-18",
    positionCount: 685,
    applyCount: 18600,
    competitionRatio: "27.2:1",
    salaryRange: "5500-9000元/月",
    subjects: ["医学基础知识", "专业知识"],
    requirements: {
      education: "本科及以上学历（部分岗位专科）",
      age: "18-35周岁",
      household: "滨州户籍或山东生源",
      political: "具有执业资格证"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，滨州市卫生健康系统2026年面向社会公开招聘工作人员685名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在35周岁以下，具有中级职称的可放宽到40周岁；\n（五）具备相应的执业资格证书；\n（六）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及临床医学、护理学、药学、医学检验、医学影像等专业。`,
    officialUrl: "http://wjw.binzhou.gov.cn",
    positions: [
      { name: "滨城区临床医师", count: 86, major: "临床医学", education: "本科及以上" },
      { name: "邹平市护理人员", count: 156, major: "护理学", education: "专科及以上" },
      { name: "博兴县药学人员", count: 32, major: "药学", education: "本科及以上" },
      { name: "无棣县公共卫生", count: 45, major: "预防医学", education: "本科及以上" }
    ]
  },
  {
    id: 16,
    title: "菏泽市2026年教育系统教师招聘公告",
    city: "菏泽市",
    type: "教师招聘",
    status: "即将开始",
    publishDate: "2026-02-25",
    registrationStart: "2026-03-05",
    registrationEnd: "2026-03-11",
    examDate: "2026-04-26",
    positionCount: 2156,
    applyCount: 78500,
    competitionRatio: "36.4:1",
    salaryRange: "4500-7000元/月",
    subjects: ["教育理论", "学科专业知识"],
    requirements: {
      education: "本科及以上学历（部分幼儿教师专科）",
      age: "18-35周岁",
      household: "菏泽户籍或山东生源",
      political: "具有教师资格证"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，菏泽市教育系统2026年面向社会公开招聘教师2156名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在35周岁以下；\n（五）具备相应的教师资格证书；\n（六）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及幼儿园、小学、初中、高中各学段，涵盖语文、数学、英语、物理、化学、生物、历史、地理、政治、音乐、美术、体育等学科。`,
    officialUrl: "http://hzjy.heze.gov.cn",
    positions: [
      { name: "牡丹区高中教师", count: 86, major: "对应学科专业", education: "本科及以上" },
      { name: "定陶区初中教师", count: 156, major: "对应学科专业", education: "本科及以上" },
      { name: "曹县小学教师", count: 568, major: "教育学类", education: "本科及以上" },
      { name: "单县幼儿教师", count: 186, major: "学前教育", education: "专科及以上" }
    ]
  },
  {
    id: 17,
    title: "日照市2026年事业单位公开招聘公告",
    city: "日照市",
    type: "事业单位",
    status: "即将开始",
    publishDate: "2026-02-12",
    registrationStart: "2026-02-22",
    registrationEnd: "2026-02-28",
    examDate: "2026-04-05",
    positionCount: 756,
    applyCount: 28500,
    competitionRatio: "37.7:1",
    salaryRange: "5000-7500元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历",
      age: "18-35周岁",
      household: "日照户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，日照市各级事业单位面向社会公开招聘工作人员756名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下；\n（五）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及教育、卫生、农业、文化、科技等多个领域。`,
    officialUrl: "http://hrss.rizhao.gov.cn",
    positions: [
      { name: "东港区综合管理", count: 86, major: "不限专业", education: "专科及以上" },
      { name: "岚山区教育系统", count: 156, major: "教育学类", education: "本科及以上" },
      { name: "五莲县卫生系统", count: 68, major: "医学类", education: "本科及以上" },
      { name: "莒县专业技术", count: 120, major: "理工科各专业", education: "本科及以上" }
    ]
  },
  {
    id: 18,
    title: "枣庄市2026年事业单位公开招聘公告",
    city: "枣庄市",
    type: "事业单位",
    status: "即将开始",
    publishDate: "2026-02-14",
    registrationStart: "2026-02-24",
    registrationEnd: "2026-03-02",
    examDate: "2026-04-11",
    positionCount: 856,
    applyCount: 32600,
    competitionRatio: "38.1:1",
    salaryRange: "5000-7000元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "专科及以上学历",
      age: "18-35周岁",
      household: "枣庄户籍或山东生源",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》和《山东省事业单位公开招聘人员实施办法》等有关规定，枣庄市各级事业单位面向社会公开招聘工作人员856名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下；\n（五）具备招聘岗位要求的专业或技能条件。\n\n二、招聘岗位\n本次招聘涉及教育、卫生、农业、文化、科技等多个领域。`,
    officialUrl: "http://zzhrss.zaozhuang.gov.cn",
    positions: [
      { name: "市中区综合管理", count: 85, major: "不限专业", education: "专科及以上" },
      { name: "薛城区教育系统", count: 126, major: "教育学类", education: "本科及以上" },
      { name: "峄城区卫生系统", count: 56, major: "医学类", education: "本科及以上" },
      { name: "台儿庄区农业系统", count: 45, major: "农学类", education: "本科及以上" }
    ]
  },
  {
    id: 19,
    title: "2026年山东省属事业单位公开招聘工作人员公告",
    city: "济南市",
    type: "事业单位",
    status: "报名中",
    publishDate: "2026-01-25",
    registrationStart: "2026-02-05",
    registrationEnd: "2026-02-11",
    examDate: "2026-03-22",
    positionCount: 3256,
    applyCount: 156800,
    competitionRatio: "48.2:1",
    salaryRange: "6000-9000元/月",
    subjects: ["公共基础知识", "职业能力测试"],
    requirements: {
      education: "本科及以上学历",
      age: "18-35周岁（部分岗位40周岁以下）",
      household: "不限户籍",
      political: "遵守宪法和法律"
    },
    content: `根据《事业单位人事管理条例》（国务院令第652号）和《山东省事业单位公开招聘人员实施办法》等有关规定，按照公开、平等、竞争、择优的原则，山东省属事业单位2026年面向社会公开招聘工作人员3256名。现将有关事项公告如下：\n\n一、招聘条件\n（一）具有中华人民共和国国籍；\n（二）遵守宪法和法律；\n（三）具有良好的道德品行和适应岗位的身体条件；\n（四）年龄在40周岁以下（1985年2月以后出生）；\n（五）具备招聘岗位要求的专业或技能条件；\n（六）法律、法规规定的其他条件。\n\n二、招聘岗位\n本次招聘共涉及省属事业单位186个，招聘工作人员3256名。其中省属高校862名，省属医院685名，省属科研院所326名，其他省属事业单位1383名。`,
    officialUrl: "http://hrss.shandong.gov.cn",
    positions: [
      { name: "省属高校教师", count: 862, major: "各学科专业", education: "研究生" },
      { name: "省属医院医师", count: 685, major: "医学类", education: "研究生" },
      { name: "省属科研院所", count: 326, major: "理工科各专业", education: "研究生" },
      { name: "省属其他单位", count: 1383, major: "不限专业", education: "本科及以上" }
    ]
  },
  {
    id: 20,
    title: "2026年山东省面向本土优秀人才招录基层公务员公告",
    city: "济南市",
    type: "省考",
    status: "即将开始",
    publishDate: "2026-02-01",
    registrationStart: "2026-02-10",
    registrationEnd: "2026-02-16",
    examDate: "2026-03-29",
    positionCount: 856,
    applyCount: 18600,
    competitionRatio: "21.7:1",
    salaryRange: "5000-7500元/月",
    subjects: ["行政职业能力测验", "申论", "农业农村知识"],
    requirements: {
      education: "高中及以上学历",
      age: "18-40周岁",
      household: "山东省户籍",
      political: "在山东基层工作满3年"
    },
    content: `为进一步拓宽基层公务员来源渠道，优化基层公务员队伍结构，根据公务员法和公务员录用有关规定，2026年山东省面向本土优秀人才招录基层公务员856名。现将有关事项公告如下：\n\n一、招录对象\n在山东省基层工作满3年（计算至2026年2月10日）的优秀人才，包括：\n（一）现任村（社区）党组织书记、村（居）委会主任；\n（二）现任村（社区）"两委"班子成员；\n（三）在乡镇（街道）机关、村（社区）工作的各类人员；\n（四）退役军人。\n\n二、报考条件\n（一）具有中华人民共和国国籍；\n（二）年龄在18至40周岁之间（1985年2月至2008年2月期间出生）；\n（三）拥护中华人民共和国宪法，拥护中国共产党领导和社会主义制度；\n（四）具有良好的政治素质和道德品行；\n（五）具有高中以上文化程度；\n（六）在山东省基层工作满3年。`,
    officialUrl: "http://hrss.shandong.gov.cn",
    positions: [
      { name: "乡镇机关综合管理", count: 456, major: "不限专业", education: "高中及以上" },
      { name: "街道社区管理", count: 200, major: "不限专业", education: "高中及以上" },
      { name: "乡镇农业管理", count: 120, major: "不限专业", education: "高中及以上" },
      { name: "乡镇法律事务", count: 80, major: "不限专业", education: "高中及以上" }
    ]
  }
];
