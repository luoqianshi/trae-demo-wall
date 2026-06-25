// 日用有方 — AI生活风险顾问 · 最终版数据

const MOCK_DATA = {
  /* ========== 首页 ========== */
  todayAlert: {
    level:"high", title:"高温预警 · 今日38°C",
    desc:"持续高温易引发中暑。老人、儿童及心脑血管疾病患者需特别注意，避免10:00-16:00外出。",
    time:"06:00 更新", tips:["每小时补水200ml","保持室内通风","备好防暑药品","关注弱势群体"]
  },

  hotQuestions: [
    { id:1, q:"微波炉加热鸡蛋会爆炸吗？", a:"带壳或去壳鸡蛋在微波炉中加热时，内部蒸汽压力急剧升高，可能导致爆炸。", risk:"high", views:12580 },
    { id:2, q:"充电器长期插在插座上有危险吗？", a:"长期通电的充电器持续发热，加速元件老化，可能引发短路或火灾。", risk:"medium", views:10234 },
    { id:3, q:"过期一天的牛奶还能喝吗？", a:"不建议饮用。保质期是安全界限，过期后细菌可能超标。", risk:"high", views:8765 },
    { id:4, q:"雷雨天气可以洗澡吗？", a:"不建议。雷电可能通过管道传导，浴室潮湿增加触电风险。", risk:"high", views:7654 }
  ],

  recentEvents: [
    { id:1, title:"某小区电动车室内充电引发火灾", date:"06-17", location:"杭州", level:"high", query:"电动车室内充电有什么危险？" },
    { id:2, title:"夏季食物中毒高发期到来", date:"06-16", location:"全国", level:"medium", query:"夏季食物中毒怎么预防？" },
    { id:3, title:"儿童误吞纽扣电池案例增加", date:"06-15", location:"上海", level:"high", query:"儿童误吞纽扣电池怎么办？" }
  ],

  /* ========== AI 问答 ========== */
  presetQuestions: [
    "微波炉加热鸡蛋会爆炸吗？","充电器长期插在插座上有危险吗？","过期一天的牛奶还能喝吗？",
    "WiFi辐射对人体有害吗？","雷雨天气可以洗澡吗？","发芽的土豆能吃吗？"
  ],

  aiResponses: {
    "微波炉加热鸡蛋会爆炸吗？": {
      answer:"是的，微波炉加热鸡蛋确实存在爆炸风险。内部水分迅速汽化产生蒸汽，由于蛋壳或蛋白膜包裹，蒸汽无法释放，压力急剧升高导致爆炸。",
      risk:"high", riskLabel:"高风险",
      principle:"微波炉使水分子高速振动产生热量。鸡蛋内部水分被快速加热产生大量蒸汽，蛋壳和蛋白膜限制蒸汽逸出，形成高压状态，超过承受极限即爆炸。",
      suggestions:["用叉子在蛋黄上戳孔释放蒸汽","将鸡蛋打散后再加热","使用微波炉专用煮蛋器","加热时间控制在30秒内","加热后静置1分钟再取出"],
      related:["烫伤","眼部伤害"]
    },
    "充电器长期插在插座上有危险吗？": {
      answer:"长期将充电器插在插座上存在隐患。虽有过充保护，但长期通电导致持续发热，加速元件老化，增加短路和火灾风险。",
      risk:"medium", riskLabel:"中风险",
      principle:"充电器即使不连接设备也消耗待机电能。变压器和电容长期工作持续发热，高温加速绝缘材料老化，可能导致内部短路。",
      suggestions:["不使用时拔掉充电器","选择有3C认证的正规产品","避免在潮湿环境使用","定期检查外观","发现发热异常立即更换"],
      related:["火灾","电击"]
    },
    "过期一天的牛奶还能喝吗？": {
      answer:"不建议饮用过期牛奶，即使只过期一天。保质期是安全界限，过期后细菌可能超标，存在食物中毒风险。",
      risk:"high", riskLabel:"高风险",
      principle:"牛奶是微生物良好培养基。冷藏条件下嗜冷菌仍缓慢繁殖。过期后细菌总数可能超标，可能产生毒素。",
      suggestions:["严格遵守保质期","开封后3天内饮用","储存温度保持0-4°C","过期牛奶可浇花或烘焙","购买时注意生产日期"],
      related:["食物中毒","腹泻"]
    },
    "WiFi辐射对人体有害吗？": {
      answer:"目前科学研究表明，日常WiFi辐射对人体健康没有明确危害。WiFi使用非电离射频辐射，能量很低，不足以破坏DNA或细胞结构。",
      risk:"low", riskLabel:"低风险",
      principle:"WiFi工作在2.4GHz或5GHz频段，属于非电离辐射。与X射线等电离辐射不同，能量不足以从原子移除电子，不会直接损伤DNA。",
      suggestions:["保持理性，不必过度担忧","路由器不要放床头","夜间可关闭WiFi","选择符合国家标准产品"],
      related:["心理焦虑"]
    },
    "雷雨天气可以洗澡吗？": {
      answer:"雷雨天气不建议洗澡。自来水管道和淋浴喷头是良好导体，雷电可能通过管道传导到室内，增加触电风险。",
      risk:"high", riskLabel:"高风险",
      principle:"雷电寻找最短路径入地。金属水管可能成为传导路径。水是良好导体，淋浴时人体电阻降低，更易受伤害。",
      suggestions:["雷雨天气避免洗澡","不要使用水龙头","远离浴室和厨房","拔掉电器插头","雷雨过后30分钟再洗澡"],
      related:["触电","雷击"]
    },
    "发芽的土豆能吃吗？": {
      answer:"不建议食用发芽或变绿的土豆。发芽部位会产生大量龙葵素（茄碱），这是一种天然毒素，可引起食物中毒。",
      risk:"high", riskLabel:"高风险",
      principle:"龙葵素是茄科植物的天然防御物质，集中在芽眼和绿色表皮中。耐高温，普通烹饪无法破坏。摄入0.2-0.4g即可中毒。",
      suggestions:["少量发芽可深挖芽眼及周围组织","大面积发芽或变绿直接丢弃","储存于阴凉干燥避光处","不要与洋葱一起存放","购买时挑选无芽无绿皮"],
      related:["食物中毒","恶心呕吐"]
    },
    "电动车室内充电有什么危险？": {
      answer:"电动车室内充电存在极高火灾风险。电池热失控时可在数分钟内产生高温有毒烟气，楼道和室内空间逃生困难，极易造成人员伤亡。",
      risk:"high", riskLabel:"高风险",
      principle:"锂电池过充、短路或老化时会发生热失控，释放可燃气体并剧烈燃烧。室内通风差、可燃物多，火势蔓延极快。",
      suggestions:["禁止电动车进楼入户充电","使用室外专用充电设施","不改装电池和充电器","发现电池鼓包发热立即停用","小区应设置集中充电点"],
      related:["火灾","触电"]
    },
    "夏季食物中毒怎么预防？": {
      answer:"夏季气温高、湿度大，细菌繁殖快，是食物中毒高发期。需注意食材储存、加工和用餐各环节卫生。",
      risk:"medium", riskLabel:"中风险",
      principle:"高温环境下微生物在富含蛋白质的食物中快速繁殖，冷藏不当的熟食和生鲜是主要风险来源。",
      suggestions:["食物现做现吃，剩菜及时冷藏","生熟砧板刀具分开","不吃变质或异味食物","外出就餐选择卫生达标餐厅","出现呕吐腹泻及时就医"],
      related:["食物中毒","腹泻"]
    },
    "儿童误吞纽扣电池怎么办？": {
      answer:"儿童误吞纽扣电池属于紧急医疗事件，必须立即就医。电池在食道内可在2小时内造成化学灼伤和组织坏死。",
      risk:"high", riskLabel:"高风险",
      principle:"纽扣电池接触体液会产生碱性电解液，腐蚀食道和胃部黏膜，2cm以上电池卡在食道风险最高。",
      suggestions:["立即拨打120或前往急诊","不要催吐或让孩子喝水","保留电池包装供医生参考","家中小电池应收纳在儿童接触不到处","购买玩具注意电池仓螺丝固定"],
      related:["误食","窒息"]
    }
  },

  /* ========== AI 识图 — 三大模式 ========== */
  imageModes: [
    { id:"food", name:"食品安全", icon:"🍎", desc:"识别变质、过期、有毒食品", color:"#FF6B6B" },
    { id:"home", name:"家居安全", icon:"🏠", desc:"识别用电、燃气、药品隐患", color:"#0A84FF" },
    { id:"aid", name:"家庭急救", icon:"🩹", desc:"烫伤割伤触电误食急救", color:"#30D158" }
  ],

  foodCases: [
    { id:1, name:"发芽土豆", img:"https://upload.wikimedia.org/wikipedia/commons/4/4e/Keimende_Kartoffeln.jpg",
      result:{ risk:"high", items:["发芽部位","绿色表皮","龙葵素"],
        analysis:"检测到土豆表面有明显发芽和变绿现象。发芽部位龙葵素含量极高，是正常土豆的50倍以上，食用可导致中毒。",
        advice:["立即丢弃，不建议食用","少量发芽可深挖芽眼周围","储存于阴凉避光处","避免大量囤积"] }},
    { id:2, name:"霉变面包", img:"https://upload.wikimedia.org/wikipedia/commons/9/9b/Moldy_bread.jpg",
      result:{ risk:"high", items:["霉菌菌落","黄曲霉素","霉斑扩散"],
        analysis:"面包表面检测到大面积霉菌生长。霉菌产生的毒素（如黄曲霉素）耐高温，即使切掉可见霉斑，看不见的菌丝可能已扩散至整个面包。",
        advice:["整块丢弃，不要切除后食用","检查储存环境是否潮湿","购买后尽快食用","密封保存防止交叉污染"] }},
    { id:3, name:"隔夜菜", img:"https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
      result:{ risk:"medium", items:["亚硝酸盐","细菌繁殖","营养流失"],
        analysis:"隔夜菜（尤其绿叶蔬菜）在储存过程中亚硝酸盐含量上升，细菌大量繁殖。室温放置超过4小时风险显著增加。",
        advice:["冷藏保存不超过24小时","充分加热后再食用","绿叶菜尽量当餐吃完","使用保鲜盒密封冷藏","反复加热不超过一次"] }},
    { id:4, name:"过期牛奶", img:"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
      result:{ risk:"high", items:["细菌超标","蛋白质变质","酸败"],
        analysis:"牛奶已过保质期。即使外观气味无明显异常，细菌总数可能已超标，存在食物中毒风险。变质牛奶可能出现结块、酸臭等迹象。",
        advice:["过期即丢弃，不冒险饮用","开封后3天内喝完","储存温度0-4°C","可浇花或做烘焙","注意胀包胀瓶"] }}
  ],

  homeCases: [
    { id:1, name:"插排超载", img:"https://images.unsplash.com/photo-1591696331117-068c72d89497?w=600&q=80",
      result:{ risk:"high", items:["多个大功率电器","插排过热","线路老化"],
        analysis:"检测到插排上连接多个大功率电器（空调+热水器+微波炉），总功率超过插排额定负载。插排可能过热，存在火灾隐患。",
        advice:["大功率电器使用独立插座","检查插排额定功率","发现发热变形立即更换","使用带过载保护的插排","人走断电"] }},
    { id:2, name:"燃气灶无人看管", img:"https://images.unsplash.com/photo-1739598752069-6806ce5d762a?w=600&q=80",
      result:{ risk:"high", items:["无人看管","汤汁溢出","燃气泄漏"],
        analysis:"检测到燃气灶处于开启状态但无人看管。烹饪时离开可能导致汤汁溢出熄灭火焰，造成燃气泄漏；或锅内油温过高引发火灾。",
        advice:["烹饪时不要离开厨房","使用带熄火保护的灶具","安装燃气报警器","定期检查软管","备好灭火毯"] }},
    { id:3, name:"药品过期", img:"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80",
      result:{ risk:"medium", items:["过期药品","药效降低","毒性增加"],
        analysis:"检测到药品已超过保质期。过期药品不仅药效降低，某些药品过期后可能产生有毒物质，误服存在健康风险。",
        advice:["定期清理家庭药箱","过期药品送回收点","不要随意丢弃污染环境","建立药品有效期清单","注意储存条件"] }},
    { id:4, name:"清洁剂混用", img:"https://images.unsplash.com/photo-1740325952758-eff797651e2d?w=600&q=80",
      result:{ risk:"high", items:["含氯消毒剂","酸性清洁剂","有毒气体"],
        analysis:"检测到含氯消毒剂（如84消毒液）与酸性清洁剂（如洁厕灵）混用。两者反应会产生剧毒的氯气，短时间吸入即可导致中毒甚至死亡。",
        advice:["绝对禁止混用清洁剂","使用时保持通风","佩戴手套口罩","如误混立即撤离通风","了解清洁剂成分"] }}
  ],

  aidCases: [
    { id:1, name:"烫伤", icon:"🔥", color:"#FF453A",
      steps:["立即用流动冷水冲洗15-20分钟","脱去烫伤部位衣物（如粘连不要强行撕扯）","用干净纱布轻轻覆盖伤口","不要涂抹牙膏酱油等偏方","严重烫伤立即拨打120"],
      warning:"不要用冰块直接接触伤口，不要挑破水泡" },
    { id:2, name:"割伤", icon:"🔪", color:"#FF9F0A",
      steps:["用干净纱布或毛巾压迫止血5-10分钟","用流动水冲洗伤口","用碘伏消毒伤口周围皮肤","根据伤口深度决定是否缝合","伤口深或污染重需打破伤风"],
      warning:"不要用卫生纸包裹伤口，不要用酒精直接冲洗" },
    { id:3, name:"触电", icon:"⚡", color:"#FFD93D",
      steps:["首先切断电源或用绝缘物挑开电线","确认伤者脱离电源后检查呼吸心跳","如无呼吸心跳立即进行CPR","拨打120急救电话","观察是否有电击伤入口和出口"],
      warning:"未确认断电前绝对不要直接接触触电者" },
    { id:4, name:"误食", icon:"💊", color:"#0A84FF",
      steps:["立即拨打120或毒物咨询热线","保留误食物品包装供医生参考","不要盲目催吐（腐蚀性物质例外）","如误服腐蚀性物质可喝少量牛奶","等待专业救援"],
      warning:"不要给昏迷者喂任何东西" }
  ],

  /* ========== 风险档案 ========== */
  riskProfile: {
    totalQueries: 28,
    highRisk: 8,
    mediumRisk: 13,
    lowRisk: 7,
    categories: [
      { name:"食品安全", count:9, color:"#FF6B6B" },
      { name:"用电安全", count:6, color:"#FFD93D" },
      { name:"健康风险", count:5, color:"#30D158" },
      { name:"居家安全", count:4, color:"#0A84FF" },
      { name:"儿童安全", count:2, color:"#9B59B6" },
      { name:"出行安全", count:2, color:"#E67E22" }
    ],
    history: [
      { q:"微波炉加热鸡蛋会爆炸吗？", risk:"high", date:"06-18 10:30", cat:"食品安全" },
      { q:"充电器长期插在插座上有危险吗？", risk:"medium", date:"06-17 15:20", cat:"用电安全" },
      { q:"过期一天的牛奶还能喝吗？", risk:"high", date:"06-16 21:45", cat:"食品安全" },
      { q:"WiFi辐射对人体有害吗？", risk:"low", date:"06-15 09:12", cat:"健康风险" },
      { q:"雷雨天气可以洗澡吗？", risk:"high", date:"06-14 18:30", cat:"居家安全" },
      { q:"发芽的土豆能吃吗？", risk:"high", date:"06-13 12:00", cat:"食品安全" }
    ],
    knowledgeGraph: {
      nodes: [
        { id:1, name:"食品安全", val:30, color:"#FF6B6B", category:"核心" },
        { id:2, name:"用电安全", val:25, color:"#FFD93D", category:"核心" },
        { id:3, name:"居家安全", val:22, color:"#0A84FF", category:"核心" },
        { id:4, name:"健康风险", val:20, color:"#30D158", category:"核心" },
        { id:5, name:"儿童安全", val:15, color:"#9B59B6", category:"核心" },
        { id:6, name:"食物中毒", val:12, color:"#FF6B6B", category:"关联" },
        { id:7, name:"火灾", val:14, color:"#FF453A", category:"关联" },
        { id:8, name:"触电", val:10, color:"#FFD93D", category:"关联" },
        { id:9, name:"燃气泄漏", val:11, color:"#0A84FF", category:"关联" },
        { id:10, name:"中暑", val:9, color:"#30D158", category:"关联" },
        { id:11, name:"误食", val:8, color:"#9B59B6", category:"关联" },
        { id:12, name:"急救", val:13, color:"#E5C07B", category:"关联" }
      ],
      links: [
        { source:"食品安全", target:"食物中毒" },{ source:"食品安全", target:"急救" },
        { source:"用电安全", target:"火灾" },{ source:"用电安全", target:"触电" },{ source:"用电安全", target:"急救" },
        { source:"居家安全", target:"火灾" },{ source:"居家安全", target:"燃气泄漏" },{ source:"居家安全", target:"急救" },
        { source:"健康风险", target:"中暑" },{ source:"健康风险", target:"急救" },
        { source:"儿童安全", target:"误食" },{ source:"儿童安全", target:"食物中毒" },{ source:"儿童安全", target:"急救" },
        { source:"食物中毒", target:"急救" },{ source:"火灾", target:"急救" }
      ]
    }
  },

  /* ========== 用户 ========== */
  user: {
    name:"日用有方",
    level:"安全达人", points:2580, joinDate:"2026-05-20",
    stats:{ queries:28, identified:15, learned:12 }
  },

  /* ========== AI 运营中心 ========== */
  admin: {
    stats: { users:12856, questions:45678, knowledge:2345, images:8923, todayUsers:234, todayQuestions:567 },
    insights: [
      { title:"用户活跃度", value:"+18.2%", trend:"up", desc:"本周问答量较上周增长", icon:"📈" },
      { title:"高风险占比", value:"23.4%", trend:"down", desc:"较上周下降3.2个百分点", icon:"⚠️" },
      { title:"AI准确率", value:"96.8%", trend:"up", desc:"模型持续优化中", icon:"🎯" },
      { title:"平均响应", value:"1.2s", trend:"up", desc:"响应速度持续提升", icon:"⚡" }
    ],
    hotWords: [
      { word:"微波炉", count:3421 },{ word:"充电器", count:2876 },{ word:"过期食品", count:2453 },
      { word:"燃气", count:2134 },{ word:"触电", count:1876 },{ word:"中暑", count:1654 },
      { word:"儿童误食", count:1432 },{ word:"电动车", count:1287 },{ word:"雷雨", count:1098 },
      { word:"药品过期", count:987 },{ word:"清洁剂", count:876 },{ word:"烫伤", count:765 }
    ],
    userBehavior: {
      hourly: [12,8,5,3,2,4,8,15,28,45,67,89,102,115,98,87,76,95,134,167,145,98,56,34],
      pages: [
        { name:"AI问答", value:45, color:"#F5F5F7" },
        { name:"AI识图", value:28, color:"#86868B" },
        { name:"风险档案", value:15, color:"#48484A" },
        { name:"首页", value:12, color:"#2A2A31" }
      ]
    },
    trends: {
      knowledge: [180,210,245,280,320,365,410,460,510,560,615,670,730,795,860,930,1000,1075,1150,1230,1315,1400,1490,1585,1680,1780,1885,1995,2110,2225,2345],
      riskEvents: [45,52,48,61,55,67,72,68,79,85,82,91,88,95,102,98,105,112,108,115],
      quality: [
        { week:"W1", accuracy:89, satisfaction:85 },
        { week:"W2", accuracy:91, satisfaction:87 },
        { week:"W3", accuracy:93, satisfaction:90 },
        { week:"W4", accuracy:95, satisfaction:92 },
        { week:"W5", accuracy:96, satisfaction:94 },
        { week:"W6", accuracy:97, satisfaction:96 }
      ]
    }
  }
};
