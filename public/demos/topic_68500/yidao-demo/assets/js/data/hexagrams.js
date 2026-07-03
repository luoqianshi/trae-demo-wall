/**
 * 易道 App - 六十四卦数据
 * 包含完整的64卦基本信息，前8卦包含完整详细数据
 */

const HEXAGRAMS = [
  // ===== 前8卦完整数据 =====
  
  // 1. 乾卦（乾为天）
  {
    id: 1,
    name: '乾',
    symbol: '☰',
    fullName: '乾为天',
    upperTrigram: '乾',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yang', 'yang'],
    nature: '纯阳之卦',
    element: '金',
    description: '乾卦象征天，代表刚健、进取、领导力。万物创始之源，天道运行不息。',
    text: {
      gua: '元亨利贞。',
      guaTranslation: '乾卦象征创始、通达、和谐、贞正。元是万物的开始，亨是顺利通达，利是和谐有益，贞是坚守正道。',
      xiang: '天行健，君子以自强不息。',
      xiangTranslation: '天道运行刚健不息，君子应当效法天道，自我奋发，永不停息。',
      tun: '大哉乾元，万物资始，乃统天。云行雨施，品物流形。',
      tunTranslation: '乾元伟大啊！万物赖以开始，统领天道。云行雨施，万物由此流布成形。'
    },
    relations: {
      错卦: '坤',
      综卦: '乾',
      互卦: '乾'
    },
    application: '适宜于创业、开拓、领导、决策。强调积极进取，但需注意刚柔并济，不可过于刚硬。',
    story: '周文王演周易时，乾卦为六十四卦之首，象征天道的创始与运行。孔子赞乾卦为"群龙无首，吉"，强调谦逊之道。'
  },
  
  // 2. 坤卦（坤为地）
  {
    id: 2,
    name: '坤',
    symbol: '☷',
    fullName: '坤为地',
    upperTrigram: '坤',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yin', 'yin'],
    nature: '纯阴之卦',
    element: '土',
    description: '坤卦象征大地，代表柔顺、包容、承载。厚德载物，万物滋养之母。',
    text: {
      gua: '元亨，利牝马之贞。君子有攸往，先迷后得主，利西南得朋，东北丧朋。安贞吉。',
      guaTranslation: '坤卦创始通达，利于牝马坚守正道。君子有所前往，先迷失后得主。西南方可得友朋，东北方丧友朋。安守贞正则吉。',
      xiang: '地势坤，君子以厚德载物。',
      xiangTranslation: '地势柔顺厚实，君子应当效法大地，以深厚德行承载万物。',
      tun: '至哉坤元，万物资生，乃顺承天。',
      tunTranslation: '坤元至善啊！万物赖以生长，顺承天道。'
    },
    relations: {
      错卦: '乾',
      综卦: '坤',
      互卦: '坤'
    },
    application: '适宜于守成、配合、服务、辅助。强调柔顺包容，顺势而为，不争不竞。',
    story: '坤卦为六十四卦第二卦，与乾卦相辅相成。《易经》以乾坤两卦为门户，乾代表天，坤代表地，天地配合万物生。'
  },
  
  // 3. 屯卦（水雷屯）
  {
    id: 3,
    name: '屯',
    symbol: '☳☵',
    fullName: '水雷屯',
    upperTrigram: '坎',
    lowerTrigram: '震',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '万物始生之卦',
    element: '水',
    description: '屯卦象征万物初生，艰难困顿。新生之物充满生机但也困难重重。',
    text: {
      gua: '元亨利贞，勿用有攸往，利建侯。',
      guaTranslation: '屯卦创始通达利于贞正，不宜有所前往，利于建立诸侯。',
      xiang: '云雷屯，君子以经纶。',
      xiangTranslation: '云雷交动象征屯难，君子应当治理经纬，筹划经营。',
      tun: '屯，刚柔始交而难生。',
      tunTranslation: '屯卦，阴阳刚柔开始交合而艰难产生。'
    },
    relations: {
      错卦: '鼎',
      综卦: '蒙',
      互卦: '复'
    },
    application: '初创阶段的艰难。适宜稳守根基，不宜急于扩张。需要耐心等待时机成熟。',
    story: '周文王被囚禁时演此卦，象征创业初期的艰难困顿，告诫后人创业需要耐心和坚持。'
  },
  
  // 4. 蒙卦（山水蒙）
  {
    id: 4,
    name: '蒙',
    symbol: '☶☵',
    fullName: '山水蒙',
    upperTrigram: '艮',
    lowerTrigram: '坎',
    lines: ['yin', 'yin', 'yang', 'yin', 'yin', 'yang'],
    nature: '启蒙教化之卦',
    element: '土',
    description: '蒙卦象征蒙昧幼稚，需要启蒙教育。求学问道，开启智慧。',
    text: {
      gua: '亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。',
      guaTranslation: '蒙卦通达。不是我求童蒙，而是童蒙求我。初次占筮告知，再三占筮是亵渎，亵渎则不告知。利于贞正。',
      xiang: '山下出泉，蒙。君子以果行育德。',
      xiangTranslation: '山下涌出泉水，象征蒙卦。君子应当果断行动培育德行。',
      tun: '蒙，山下有险，险而止，蒙。',
      tunTranslation: '蒙卦，山下有险阻，遇险而止，象征蒙昧。'
    },
    relations: {
      错卦: '革',
      综卦: '屯',
      互卦: '复'
    },
    application: '教育学习的时机。强调尊师重道，诚意求学。教育者应当适时引导，不可强求。',
    story: '孔子常以此卦阐释教育之道，强调"学而不厌，诲人不倦"，师生互动的重要性。'
  },
  
  // 5. 需卦（水天需）
  {
    id: 5,
    name: '需',
    symbol: '☵☰',
    fullName: '水天需',
    upperTrigram: '坎',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yin', 'yang', 'yang'],
    nature: '等待时机之卦',
    element: '水',
    description: '需卦象征等待，条件不成熟时需耐心等待，积蓄力量。',
    text: {
      gua: '有孚，光亨贞吉。利涉大川。',
      guaTranslation: '需卦有诚信，光明通达贞正吉祥。利于涉越大川。',
      xiang: '云上于天，需。君子以饮食宴乐。',
      xiangTranslation: '云气上于天空，象征需卦。君子应当饮食宴乐，从容等待。',
      tun: '需，须也。险在前也。',
      tunTranslation: '需卦，等待之意。险阻在前方。'
    },
    relations: {
      错卦: '晋',
      综卦: '讼',
      互卦: '睽'
    },
    application: '等待时机成熟。不宜贸然行动，应当从容准备，积蓄力量。',
    story: '古人农耕时常观此卦，等待雨水适时降临，强调天时地利的重要性。'
  },
  
  // 6. 讼卦（天水讼）
  {
    id: 6,
    name: '讼',
    symbol: '☰☵',
    fullName: '天水讼',
    upperTrigram: '乾',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yang', 'yang', 'yang', 'yang'],
    nature: '争讼矛盾之卦',
    element: '金',
    description: '讼卦象征争讼矛盾，警示争讼终非善道，宜和解退让。',
    text: {
      gua: '有孚窒惕，中吉终凶。利见大人，不利涉大川。',
      guaTranslation: '讼卦诚信受阻需警惕，中途吉祥终局凶险。利于见到大人，不利于涉越大川。',
      xiang: '天与水违行，讼。君子以作事谋始。',
      xiangTranslation: '天与水相背而行，象征讼卦。君子应当做事时谋划开端，避免争讼。',
      tun: '讼，上刚下险，险而健，讼。',
      tunTranslation: '讼卦，上方刚健下方险陷，险陷而刚健，产生争讼。'
    },
    relations: {
      错卦: '明夷',
      综卦: '需',
      互卦: '家人'
    },
    application: '争讼警示。宜和解退让，不可执着胜负。以和为贵，防患于未然。',
    story: '古代法官判案时常观此卦，告诫世人争讼损人损己，和解为上策。'
  },
  
  // 7. 师卦（地水师）
  {
    id: 7,
    name: '师',
    symbol: '☷☵',
    fullName: '地水师',
    upperTrigram: '坤',
    lowerTrigram: '坎',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yin'],
    nature: '行军打仗之卦',
    element: '土',
    description: '师卦象征军队与纪律，强调统帅重要性和纪律严明。',
    text: {
      gua: '贞丈人吉，无咎。',
      guaTranslation: '师卦贞正，丈人吉祥，无灾祸。',
      xiang: '地中有水，师。君子以容民畜众。',
      xiangTranslation: '地中有水，象征师卦。君子应当容纳民众畜养众人。',
      tun: '师，众也。贞，正也。',
      tunTranslation: '师卦，众多之意。贞正，正道之意。'
    },
    relations: {
      错卦: '同人',
      综卦: '比',
      互卦: '复'
    },
    application: '组织管理、团队领导。强调纪律严明，统帅德才兼备，以正道统领众人。',
    story: '古代将军出兵前常观此卦，强调"兵者国之大事"，需要慎重决策、纪律严明。'
  },
  
  // 8. 比卦（水地比）
  {
    id: 8,
    name: '比',
    symbol: '☵☷',
    fullName: '水地比',
    upperTrigram: '坎',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yin', 'yang'],
    nature: '亲比辅佐之卦',
    element: '水',
    description: '比卦象征亲比辅佐，团结协作的力量。独行者凶，众行者吉。',
    text: {
      gua: '吉。原筮元永贞，无咎。不宁方来，后夫凶。',
      guaTranslation: '比卦吉祥。初次占筮创始永贞，无灾祸。不安宁者前来，迟到者凶险。',
      xiang: '地上有水，比。先王以建万国，亲诸侯。',
      xiangTranslation: '地上有水，象征比卦。先王建立万国，亲近诸侯。',
      tun: '比，吉也。比，辅也。',
      tunTranslation: '比卦，吉祥。比，辅佐之意。'
    },
    relations: {
      错卦: '大有',
      综卦: '师',
      互卦: '剥'
    },
    application: '团结协作的时机。强调亲近辅佐，众行者吉。适宜合作、联盟、团队建设。',
    story: '周朝建立时常观此卦，强调诸侯联盟、团结协作的重要性，"众志成城"。'
  },
  
  // ===== 其余56卦完整数据 =====

  // 9. 小畜卦（风天小畜）
  {
    id: 9,
    name: '小畜',
    symbol: '☴☰',
    fullName: '风天小畜',
    upperTrigram: '巽',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yang'],
    nature: '小有积蓄',
    element: '木',
    description: '小畜卦象征小有积蓄，渐进发展。',
    text: {
      gua: '亨，密云不雨，自我西郊。',
      guaTranslation: '小畜卦象征小有积蓄，亨通。密云聚集而未降雨，力量尚在积蓄之中。',
      xiang: '风行天上，小畜。君子以懿文德。',
      xiangTranslation: '风在天上吹行，象征小有蓄积。君子应修美文辞德行。'
    },
    application: '适宜稳步积累，不宜急于求成。注重修养自身，等待时机成熟。'
  },

  // 10. 履卦（天泽履）
  {
    id: 10,
    name: '履',
    symbol: '☰☱',
    fullName: '天泽履',
    upperTrigram: '乾',
    lowerTrigram: '兑',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yang'],
    nature: '谨慎行事',
    element: '金',
    description: '履卦象征谨慎行事，如履薄冰。',
    text: {
      gua: '履虎尾，不咥人，亨。',
      guaTranslation: '踩到老虎尾巴，老虎却不咬人，亨通。象征小心行事虽有险而无忧。',
      xiang: '上天下泽，履。君子以辨上下，定民志。',
      xiangTranslation: '上为天下为泽，象征循礼而行。君子应分辨上下尊卑，安定民心。'
    },
    application: '谨慎行事务必小心，以柔顺态度应对危险局面，循礼而动可保安稳。'
  },

  // 11. 泰卦（地天泰）
  {
    id: 11,
    name: '泰',
    symbol: '☷☰',
    fullName: '地天泰',
    upperTrigram: '坤',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yin', 'yin', 'yin'],
    nature: '通泰吉祥',
    element: '土',
    description: '泰卦象征通泰吉祥，天地交合。',
    text: {
      gua: '小往大来，吉亨。',
      guaTranslation: '小的去了大的来了，吉祥亨通。天地阴阳交汇，万物通泰繁荣。',
      xiang: '天地交，泰。后以财成天地之道，辅相天地之宜。',
      xiangTranslation: '天地之气交汇，万物通达。君王据此裁成天地之道，辅助万物之宜。'
    },
    application: '大吉之卦，万事通达。适宜开拓合作、沟通交流，把握和谐发展的大好时机。'
  },

  // 12. 否卦（天地否）
  {
    id: 12,
    name: '否',
    symbol: '☰☷',
    fullName: '天地否',
    upperTrigram: '乾',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yang', 'yang', 'yang'],
    nature: '闭塞不通',
    element: '金',
    description: '否卦象征闭塞不通，天地不交。',
    text: {
      gua: '否之匪人，不利君子贞，大往小来。',
      guaTranslation: '否闭之世，非人道所宜。不利于君子坚守正道，大的去了小的来了。',
      xiang: '天地不交，否。君子以俭德辟难，不可荣以禄。',
      xiangTranslation: '天地之气不交，闭塞不通。君子应以俭约之德避开灾难，不可贪图禄位荣华。'
    },
    application: '运势闭塞，不宜冒进。应收敛锋芒，韬光养晦，坚守正道等待否极泰来。'
  },

  // 13. 同人卦（天火同人）
  {
    id: 13,
    name: '同人',
    symbol: '☰☲',
    fullName: '天火同人',
    upperTrigram: '乾',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yang', 'yang', 'yang'],
    nature: '和同于人',
    element: '金',
    description: '同人卦象征和同于人，团结协作。',
    text: {
      gua: '同人于野，亨。利涉大川，利君子贞。',
      guaTranslation: '与人和同于旷野之中，亨通。利于涉越大河，利于君子坚守正道。',
      xiang: '天与火，同人。君子以类族辨物。',
      xiangTranslation: '天与火相合，象征与人和同。君子应辨别事物族类，以求大同。'
    },
    application: '适宜团队合作、社交联络。以公正无私之心团结众人，可成就大业。'
  },

  // 14. 大有卦（火天大有）
  {
    id: 14,
    name: '大有',
    symbol: '☲☰',
    fullName: '火天大有',
    upperTrigram: '离',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yang'],
    nature: '大有收获',
    element: '火',
    description: '大有卦象征大有收获，丰盛富足。',
    text: {
      gua: '元亨。',
      guaTranslation: '大有卦，大亨通。阳光普照万物，象征大丰收与大成就。',
      xiang: '火在天上，大有。君子以遏恶扬善，顺天休命。',
      xiangTranslation: '太阳高悬天上，象征大丰收。君子应抑恶扬善，顺应天命。'
    },
    application: '运势亨通，事业丰盛。应谦虚谨慎，不可骄奢，善用资源造福大众。'
  },

  // 15. 谦卦（地山谦）
  {
    id: 15,
    name: '谦',
    symbol: '☷☶',
    fullName: '地山谦',
    upperTrigram: '坤',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yin'],
    nature: '谦逊退让',
    element: '土',
    description: '谦卦象征谦逊退让，君子有终。',
    text: {
      gua: '亨，君子有终。',
      guaTranslation: '谦卦亨通，唯有君子能保持谦逊至终。高山藏于地下，谦卑而受益。',
      xiang: '地中有山，谦。君子以裒多益寡，称物平施。',
      xiangTranslation: '高山隐于地中，象征谦逊。君子应取多补少，衡量事物公平施予。'
    },
    application: '保持谦逊是成功之道。谦虚低调可获得尊重，利于人际关系与长远发展。'
  },

  // 16. 豫卦（雷地豫）
  {
    id: 16,
    name: '豫',
    symbol: '☳☷',
    fullName: '雷地豫',
    upperTrigram: '震',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yin'],
    nature: '愉悦欢乐',
    element: '木',
    description: '豫卦象征愉悦欢乐，适时而动。',
    text: {
      gua: '利建侯行师。',
      guaTranslation: '豫卦利于建立侯业、出动师旅。雷鸣大地，万物振奋欢乐。',
      xiang: '雷出地奋，豫。先王以作乐崇德，殷荐之上帝。',
      xiangTranslation: '雷声从大地中奋出，象征欢乐振奋。先王据此制作音乐推崇德行。'
    },
    application: '心情愉悦时宜积极行动。借助有利时机推进计划，但不可沉溺安乐忘却进取。'
  },

  // 17. 随卦（泽雷随）
  {
    id: 17,
    name: '随',
    symbol: '☱☳',
    fullName: '泽雷随',
    upperTrigram: '兑',
    lowerTrigram: '震',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yang'],
    nature: '随顺应变',
    element: '金',
    description: '随卦象征随顺应变，顺势而为。',
    text: {
      gua: '元亨利贞，无咎。',
      guaTranslation: '随卦大为亨通，利于坚守正道，没有灾咎。随时而动，顺势而行。',
      xiang: '泽中有雷，随。君子以向晦入宴息。',
      xiangTranslation: '泽中有雷，象征随时而动。君子应随着时序在夜晚安息。'
    },
    application: '宜顺应趋势灵活应变，不可固执己见。放下身段随和待人，可收获助力。'
  },

  // 18. 蛊卦（山风蛊）
  {
    id: 18,
    name: '蛊',
    symbol: '☶☴',
    fullName: '山风蛊',
    upperTrigram: '艮',
    lowerTrigram: '巽',
    lines: ['yang', 'yang', 'yin', 'yang', 'yin', 'yin'],
    nature: '整治腐败',
    element: '土',
    description: '蛊卦象征整治腐败，振作革新。',
    text: {
      gua: '元亨，利涉大川。先甲三日，后甲三日。',
      guaTranslation: '蛊卦大亨通，利于涉越大河。事前谋划三日，事后总结三日。',
      xiang: '山下有风，蛊。君子以振民育德。',
      xiangTranslation: '山下有风吹拂，象征整治腐败。君子应振奋民风培育德行。'
    },
    application: '适宜整顿改革、修复积弊。事先周密谋划，事后及时总结，方可成功革故。'
  },

  // 19. 临卦（地泽临）
  {
    id: 19,
    name: '临',
    symbol: '☷☱',
    fullName: '地泽临',
    upperTrigram: '坤',
    lowerTrigram: '兑',
    lines: ['yang', 'yang', 'yin', 'yin', 'yin', 'yin'],
    nature: '降临监察',
    element: '土',
    description: '临卦象征降临监察，君临天下。',
    text: {
      gua: '元亨利贞。至于八月有凶。',
      guaTranslation: '临卦大亨通，利于守正。但到了八月将有凶险，盛极必衰之理。',
      xiang: '泽上有地，临。君子以教思无穷，容保民无疆。',
      xiangTranslation: '泽上有地居高临下，象征亲临教导。君子应无限关怀教化，包容保护民众。'
    },
    application: '运势上升，适宜领导管理。但需居安思危，盛时要为衰退做好准备。'
  },

  // 20. 观卦（风地观）
  {
    id: 20,
    name: '观',
    symbol: '☴☷',
    fullName: '风地观',
    upperTrigram: '巽',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yang'],
    nature: '观察瞻仰',
    element: '木',
    description: '观卦象征观察瞻仰，示范教化。',
    text: {
      gua: '盥而不荐，有孚颙若。',
      guaTranslation: '观卦祭祀时洗手而未献祭，心怀诚敬肃穆。以诚意感化人心。',
      xiang: '风行地上，观。先王以省方观民设教。',
      xiangTranslation: '风吹行于大地上，象征观察体察。先王据此巡视四方、观察民情、设立教化。'
    },
    application: '宜观察思考，审视自身处境。以榜样力量影响他人，以真诚赢得信任。'
  },

  // 21. 噬嗑卦（火雷噬嗑）
  {
    id: 21,
    name: '噬嗑',
    symbol: '☲☳',
    fullName: '火雷噬嗑',
    upperTrigram: '离',
    lowerTrigram: '震',
    lines: ['yin', 'yang', 'yin', 'yang', 'yin', 'yang'],
    nature: '咬合决断',
    element: '火',
    description: '噬嗑卦象征咬合决断，明断是非。',
    text: {
      gua: '亨，利用狱。',
      guaTranslation: '噬嗑卦亨通，利于使用刑罚。如同咬碎障碍物，决断是非，惩治邪恶。',
      xiang: '雷电噬嗑。先王以明罚敕法。',
      xiangTranslation: '雷电交加象征咬合决断。先王据此明示刑罚、严正法令。'
    },
    application: '适宜果断处理阻碍与纠纷。明辨是非，执法公正，但须刚柔并济。'
  },

  // 22. 贲卦（山火贲）
  {
    id: 22,
    name: '贲',
    symbol: '☶☲',
    fullName: '山火贲',
    upperTrigram: '艮',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yin', 'yin', 'yang'],
    nature: '文饰修饰',
    element: '土',
    description: '贲卦象征文饰修饰，文明礼仪。',
    text: {
      gua: '亨，小利有攸往。',
      guaTranslation: '贲卦亨通，有小利可以前往。注重文饰外表，但不可本末倒置。',
      xiang: '山下有火，贲。君子以明庶政，无敢折狱。',
      xiangTranslation: '山下火光照耀，象征文饰。君子应修明政务，但不以文饰代替司法公正。'
    },
    application: '注重形象与礼仪有助于交往。但应内外兼修，不可重形式而轻实质。'
  },

  // 23. 剥卦（山地剥）
  {
    id: 23,
    name: '剥',
    symbol: '☶☷',
    fullName: '山地剥',
    upperTrigram: '艮',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yin', 'yang'],
    nature: '剥落衰减',
    element: '土',
    description: '剥卦象征剥落衰减，衰败之象。',
    text: {
      gua: '不利有攸往。',
      guaTranslation: '剥卦不利于有所前往。阴气侵蚀阳气，如山石剥落，势不可挡。',
      xiang: '山附于地，剥。上以厚下安宅。',
      xiangTranslation: '山附着于地上，象征剥落。居上者应厚待下层，使民众安居。'
    },
    application: '运势衰退，不宜冒进。应顺应时势隐忍自守，厚待他人以待时机。'
  },

  // 24. 复卦（地雷复）
  {
    id: 24,
    name: '复',
    symbol: '☷☳',
    fullName: '地雷复',
    upperTrigram: '坤',
    lowerTrigram: '震',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yin'],
    nature: '复归返还',
    element: '土',
    description: '复卦象征复归返还，一阳来复。',
    text: {
      gua: '亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。',
      guaTranslation: '复卦亨通。出入无病，朋友来了无咎。阳气反复运行，七日后回归。',
      xiang: '雷在地中，复。先王以至日闭关，商旅不行，后不省方。',
      xiangTranslation: '雷声潜伏地中，象征一阳来复。先王在冬至日关闭关口，休养生息。'
    },
    application: '否极泰来之象，新希望萌生。宜重新开始，回归正道，把握转折机遇。'
  },

  // 25. 无妄卦（天雷无妄）
  {
    id: 25,
    name: '无妄',
    symbol: '☰☳',
    fullName: '天雷无妄',
    upperTrigram: '乾',
    lowerTrigram: '震',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yang'],
    nature: '无妄真诚',
    element: '金',
    description: '无妄卦象征无妄真诚，意外之灾。',
    text: {
      gua: '元亨利贞。其匪正有眚，不利有攸往。',
      guaTranslation: '无妄卦大为亨通利于守正。若行不正则有灾祸，不利于前往。',
      xiang: '天下雷行物与，无妄。先王以茂对时育万物。',
      xiangTranslation: '天下雷声震动万物感应，象征不妄为。先王据此顺应时令培育万物。'
    },
    application: '保持真诚不虚伪，顺其自然不可强求。行事端正则亨通，妄动反招灾祸。'
  },

  // 26. 大畜卦（山天大畜）
  {
    id: 26,
    name: '大畜',
    symbol: '☶☰',
    fullName: '山天大畜',
    upperTrigram: '艮',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yang'],
    nature: '大有积蓄',
    element: '土',
    description: '大畜卦象征大有积蓄，积蓄力量。',
    text: {
      gua: '利贞，不家食吉，利涉大川。',
      guaTranslation: '大畜卦利于守正。不在家吃闲饭而服务于社会则吉，利于成就大业。',
      xiang: '天在山中，大畜。君子以多识前言往行，以畜其德。',
      xiangTranslation: '天藏于山中，象征大有蓄积。君子应广泛学习前贤言行，蓄养自身德行。'
    },
    application: '力量积蓄已丰，宜大胆进取。充实学识修养，蓄势待发以成大事。'
  },

  // 27. 颐卦（山雷颐）
  {
    id: 27,
    name: '颐',
    symbol: '☳☳',
    fullName: '山雷颐',
    upperTrigram: '艮',
    lowerTrigram: '震',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yang'],
    nature: '颐养滋养',
    element: '土',
    description: '颐卦象征颐养滋养，饮食养生。',
    text: {
      gua: '贞吉。观颐，自求口实。',
      guaTranslation: '颐卦守正则吉。观察颐养之道，自己谋求口中食物。注重身心滋养。',
      xiang: '山下有雷，颐。君子以慎言语，节饮食。',
      xiangTranslation: '山下有雷声回响，象征颐养。君子应谨慎言语，节制饮食。'
    },
    application: '注重身心健康与修养。言语审慎，饮食有节，身心平衡才能持久发展。'
  },

  // 28. 大过卦（泽风大过）
  {
    id: 28,
    name: '大过',
    symbol: '☱☴',
    fullName: '泽风大过',
    upperTrigram: '兑',
    lowerTrigram: '巽',
    lines: ['yin', 'yang', 'yang', 'yang', 'yang', 'yin'],
    nature: '大为过度',
    element: '金',
    description: '大过卦象征大为过度，非常行动。',
    text: {
      gua: '栋桡，利有攸往，亨。',
      guaTranslation: '房屋栋梁弯曲，利于有所前往，亨通。非常时期须采取非常之行动。',
      xiang: '泽灭木，大过。君子以独立不惧，遁世无闷。',
      xiangTranslation: '水泽淹没树木，象征大为过度。君子应独立无畏，隐退不忧。'
    },
    application: '非常时期需非常手段。敢于担当独立行事，但须审慎评估风险，量力而行。'
  },

  // 29. 坎卦（坎为水）
  {
    id: 29,
    name: '坎',
    symbol: '☵☵',
    fullName: '坎为水',
    upperTrigram: '坎',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '重重险陷',
    element: '水',
    description: '坎卦象征重重险陷，险难困境。',
    text: {
      gua: '有孚，维心亨，行有尚。',
      guaTranslation: '坎卦有诚信维系于心则亨通。面对重重险阻，心怀诚信方可脱困。',
      xiang: '水洊至，习坎。君子以常德行，习教事。',
      xiangTranslation: '水流相继而至，象征重险。君子应持之以恒修炼德行，熟习政教事务。'
    },
    application: '面临重重困难需坚守信念。保持诚信与毅力，以恒心渡过难关。'
  },

  // 30. 离卦（离为火）
  {
    id: 30,
    name: '离',
    symbol: '☲☲',
    fullName: '离为火',
    upperTrigram: '离',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yang', 'yin', 'yang'],
    nature: '重重光明',
    element: '火',
    description: '离卦象征重重光明，依附燃烧。',
    text: {
      gua: '利贞，亨。畜牝牛，吉。',
      guaTranslation: '离卦利于守正，亨通。如畜养柔顺的母牛般吉祥，以柔顺之道依附正道。',
      xiang: '明两作，离。大人以继明照于四方。',
      xiangTranslation: '光明接连出现，象征附丽光明。伟大之人以延续光明照耀天下四方。'
    },
    application: '光明灿烂之象，宜展现才华。依附正道行事，柔顺谦和可获吉祥。'
  },

  // 31. 咸卦（泽山咸）
  {
    id: 31,
    name: '咸',
    symbol: '☱☶',
    fullName: '泽山咸',
    upperTrigram: '兑',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yin', 'yang', 'yang'],
    nature: '感应相通',
    element: '金',
    description: '咸卦象征感应相通，男女相悦。',
    text: {
      gua: '亨，利贞，取女吉。',
      guaTranslation: '咸卦亨通，利于守正，娶女吉祥。山泽相通，万物感应交流。',
      xiang: '山上有泽，咸。君子以虚受人。',
      xiangTranslation: '山上有泽水，象征感应。君子应虚心接纳他人，以诚相感。'
    },
    application: '人际关系和谐之象。宜以真诚感化他人，促进沟通交流，建立互信关系。'
  },

  // 32. 恒卦（雷风恒）
  {
    id: 32,
    name: '恒',
    symbol: '☳☴',
    fullName: '雷风恒',
    upperTrigram: '震',
    lowerTrigram: '巽',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '恒久持久',
    element: '木',
    description: '恒卦象征恒久持久，持之以恒。',
    text: {
      gua: '亨，无咎，利贞，利有攸往。',
      guaTranslation: '恒卦亨通，无咎，利于守正，利于前往。雷风相配合恒久不变。',
      xiang: '雷风，恒。君子以立不易方。',
      xiangTranslation: '雷与风相互配合，象征恒久。君子应确立不易的正道准则。'
    },
    application: '坚持正道持之以恒方可成功。在变化中保持恒心，坚守原则但不僵化。'
  },

  // 33. 遁卦（天山遁）
  {
    id: 33,
    name: '遁',
    symbol: '☰☶',
    fullName: '天山遁',
    upperTrigram: '乾',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yang'],
    nature: '退避隐遁',
    element: '金',
    description: '遁卦象征退避隐遁，适时退让。',
    text: {
      gua: '亨，小利贞。',
      guaTranslation: '遁卦亨通，小利于守正。阳气退避，小人势长，君子应适时隐退。',
      xiang: '天下有山，遁。君子以远小人不恶而严。',
      xiangTranslation: '天之下有山，象征退避。君子应远离小人，不露憎恶而保持威严。'
    },
    application: '运势不利宜退不宜进。适时退让保全实力，远离纷争，积蓄力量再图发展。'
  },

  // 34. 大壮卦（雷天大壮）
  {
    id: 34,
    name: '大壮',
    symbol: '☳☰',
    fullName: '雷天大壮',
    upperTrigram: '震',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yin'],
    nature: '大为壮盛',
    element: '木',
    description: '大壮卦象征大为壮盛，刚健有力。',
    text: {
      gua: '利贞。',
      guaTranslation: '大壮卦利于守正。阳刚之气强盛壮大，但需以礼义约束刚强。',
      xiang: '雷在天上，大壮。君子以非礼弗履。',
      xiangTranslation: '雷声震动天上，象征大壮盛。君子应不做违背礼义之事。'
    },
    application: '实力强盛但仍须克制。壮大之时更要注重礼仪与规范，不可恃强凌弱。'
  },

  // 35. 晋卦（火地晋）
  {
    id: 35,
    name: '晋',
    symbol: '☲☷',
    fullName: '火地晋',
    upperTrigram: '离',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yang', 'yin', 'yang'],
    nature: '晋升进升',
    element: '火',
    description: '晋卦象征晋升进升，光明上进。',
    text: {
      gua: '康侯用锡马蕃庶，昼日三接。',
      guaTranslation: '康侯被赏赐良马众多，一日之内三次受接见。象征光明上进、晋升顺利。',
      xiang: '明出地上，晋。君子以自昭明德。',
      xiangTranslation: '太阳升起于大地之上，象征晋升。君子应自我彰显光明之德。'
    },
    application: '晋升发展之象，事业上升期。宜积极进取展现才华，光明正大地前进。'
  },

  // 36. 明夷卦（地火明夷）
  {
    id: 36,
    name: '明夷',
    symbol: '☷☲',
    fullName: '地火明夷',
    upperTrigram: '坤',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yin', 'yin', 'yin'],
    nature: '光明受损',
    element: '土',
    description: '明夷卦象征光明受损，韬光养晦。',
    text: {
      gua: '利艰贞。',
      guaTranslation: '明夷卦利于在艰难中守正。光明受损，如日落地下，宜韬光养晦。',
      xiang: '明入地中，明夷。君子以莅众用晦而明。',
      xiangTranslation: '光明没入地中，象征光明受损。君子治理百姓用晦暗之道以显明智。'
    },
    application: '时运不济宜隐忍。收敛锋芒保护自身，内修德行外示柔顺，以待光明重现。'
  },

  // 37. 家人卦（风火家人）
  {
    id: 37,
    name: '家人',
    symbol: '☴☲',
    fullName: '风火家人',
    upperTrigram: '巽',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yang', 'yang', 'yin'],
    nature: '家庭伦理',
    element: '木',
    description: '家人卦象征家庭伦理，齐家之道。',
    text: {
      gua: '利女贞。',
      guaTranslation: '家人卦利于女子守正。风自火出，象征家道兴隆，内治而外安。',
      xiang: '风自火出，家人。君子以言有物而行有恒。',
      xiangTranslation: '风从火中生出，象征齐家。君子应言之有物，行之有恒。'
    },
    application: '注重家庭与团队内部建设。严明规矩又不失温暖，内外兼顾方能兴旺。'
  },

  // 38. 睽卦（火风睽）
  {
    id: 38,
    name: '睽',
    symbol: '☲☴',
    fullName: '火风睽',
    upperTrigram: '离',
    lowerTrigram: '巽',
    lines: ['yin', 'yang', 'yang', 'yang', 'yin', 'yang'],
    nature: '乖违背离',
    element: '火',
    description: '睽卦象征乖违背离，对立差异。',
    text: {
      gua: '小事吉。',
      guaTranslation: '睽卦做小事吉祥。火与火背离，万物虽有差异但终归和谐。',
      xiang: '上火下泽，睽。君子以同而异。',
      xiangTranslation: '上为火下为泽，背离之象。君子应求同存异，和而不同。'
    },
    application: '面对分歧宜求同存异。不必强求一致，尊重差异反而能达成合作。'
  },

  // 39. 蹇卦（水山蹇）
  {
    id: 39,
    name: '蹇',
    symbol: '☵☶',
    fullName: '水山蹇',
    upperTrigram: '坎',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yin', 'yang', 'yin'],
    nature: '艰难险阻',
    element: '水',
    description: '蹇卦象征艰难险阻，行路困难。',
    text: {
      gua: '利西南，不利东北。利见大人，贞吉。',
      guaTranslation: '蹇卦利于向西南，不利于向东北。利于见到大德之人，守正则吉。',
      xiang: '山上有水，蹇。君子以反身修德。',
      xiangTranslation: '山上有水流动困难，象征险阻。君子应反省自身，修养德行。'
    },
    application: '前路艰难宜暂缓前行。修身养德，寻求贤人相助，不可冒进冒险。'
  },

  // 40. 解卦（雷水解）
  {
    id: 40,
    name: '解',
    symbol: '☳☵',
    fullName: '雷水解',
    upperTrigram: '震',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '解除缓解',
    element: '木',
    description: '解卦象征解除缓解，困境解除。',
    text: {
      gua: '利西南，无所往，其来复吉。有攸往，夙吉。',
      guaTranslation: '解卦利于西南方。若无事则返回亦吉，若要前往则早行早吉。',
      xiang: '雷雨作，解。君子以赦过宥罪。',
      xiangTranslation: '雷雨交作，困境解除。君子应宽恕过失，赦免罪过。'
    },
    application: '困境解除之象，宜趁势化解矛盾。宽宏大量处理问题，及时行动莫拖延。'
  },

  // 41. 损卦（山泽损）
  {
    id: 41,
    name: '损',
    symbol: '☶☱',
    fullName: '山泽损',
    upperTrigram: '艮',
    lowerTrigram: '兑',
    lines: ['yang', 'yang', 'yin', 'yin', 'yin', 'yang'],
    nature: '减损舍弃',
    element: '土',
    description: '损卦象征减损舍弃，舍得之道。',
    text: {
      gua: '有孚，元吉，无咎，可贞，利有攸往。',
      guaTranslation: '损卦心怀诚信则大吉无咎。减损下方以增益上方，先损后益之道。',
      xiang: '山下有泽，损。君子以惩忿窒欲。',
      xiangTranslation: '山下有泽，减损之象。君子应克制愤怒，遏制欲望。'
    },
    application: '有时舍去才能获得。适当减损不必要的欲望与开支，以诚信待人可获大利。'
  },

  // 42. 益卦（风雷益）
  {
    id: 42,
    name: '益',
    symbol: '☱☴',
    fullName: '风雷益',
    upperTrigram: '巽',
    lowerTrigram: '震',
    lines: ['yang', 'yin', 'yin', 'yin', 'yang', 'yang'],
    nature: '增益受益',
    element: '木',
    description: '益卦象征增益受益，有所获益。',
    text: {
      gua: '利有攸往，利涉大川。',
      guaTranslation: '益卦利于前往做事，利于涉越大河。风雷相助，上损下益，大吉之象。',
      xiang: '风雷，益。君子以见善则迁，有过则改。',
      xiangTranslation: '风雷相激，增益之象。君子应见善则从，有过则改。'
    },
    application: '收益增长之象，宜积极把握机会。见贤思齐勇于改过，持续改进自我。'
  },

  // 43. 夬卦（泽天夬）
  {
    id: 43,
    name: '夬',
    symbol: '☱☰',
    fullName: '泽天夬',
    upperTrigram: '兑',
    lowerTrigram: '乾',
    lines: ['yang', 'yang', 'yang', 'yang', 'yang', 'yin'],
    nature: '决断果断',
    element: '金',
    description: '夬卦象征决断果断，刚决柔。',
    text: {
      gua: '扬于王庭，孚号有厉。告自邑，不利即戎，利有攸往。',
      guaTranslation: '夬卦在朝堂上宣布决断，诚心号召有危险。不利动武，利于前往。',
      xiang: '泽上于天，夬。君子以施禄及下，居德则忌。',
      xiangTranslation: '泽水上涨到天上，象征决断。君子应施恩于下，忌居功自傲。'
    },
    application: '果断决策的时机。以公正态度处理问题，刚柔并济，不靠武力而靠威信。'
  },

  // 44. 姤卦（天风姤）
  {
    id: 44,
    name: '姤',
    symbol: '☰☴',
    fullName: '天风姤',
    upperTrigram: '乾',
    lowerTrigram: '巽',
    lines: ['yin', 'yang', 'yang', 'yang', 'yang', 'yang'],
    nature: '邂逅相遇',
    element: '金',
    description: '姤卦象征邂逅相遇，阴遇阳。',
    text: {
      gua: '女壮，勿用取女。',
      guaTranslation: '女子强壮，不宜娶此女。一阴初生遇五阳，偶然相遇之象。',
      xiang: '天下有风，姤。后以施命诰四方。',
      xiangTranslation: '天下有风吹遍，象征相遇。君王据此发布政令告示四方。'
    },
    application: '意外相遇之象，需警惕不速之客。对新出现的人事物审慎观察，不宜轻信。'
  },

  // 45. 萃卦（泽地萃）
  {
    id: 45,
    name: '萃',
    symbol: '☱☷',
    fullName: '泽地萃',
    upperTrigram: '兑',
    lowerTrigram: '坤',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yang'],
    nature: '聚集汇聚',
    element: '金',
    description: '萃卦象征聚集汇聚，众人相聚。',
    text: {
      gua: '亨。王假有庙，利见大人，亨利贞。用大牲吉，利有攸往。',
      guaTranslation: '萃卦亨通。君王到宗庙祭祀，利于见大人，大亨通利于守正。',
      xiang: '泽上于地，萃。君子以除戎器，戒不虞。',
      xiangTranslation: '泽水汇聚于地上，象征聚集。君子应修治武备以防不测。'
    },
    application: '聚集力量之象，适宜团结合作。但人多则杂，需预防意外，未雨绸缪。'
  },

  // 46. 升卦（地风升）
  {
    id: 46,
    name: '升',
    symbol: '☴☳',
    fullName: '地风升',
    upperTrigram: '坤',
    lowerTrigram: '巽',
    lines: ['yang', 'yang', 'yin', 'yin', 'yin', 'yin'],
    nature: '上升晋升',
    element: '木',
    description: '升卦象征上升晋升，步步上升。',
    text: {
      gua: '元亨，用见大人，勿恤，南征吉。',
      guaTranslation: '升卦大亨通。利于见大人，不必忧虑，向南征伐吉祥。',
      xiang: '地中生木，升。君子以顺德，积小以高大。',
      xiangTranslation: '树木从地中生长，象征上升。君子应顺应德行，积小成大。'
    },
    application: '稳步上升之象，事业学业皆可进步。踏实积累从小到大，持之以恒。'
  },

  // 47. 困卦（泽水困）
  {
    id: 47,
    name: '困',
    symbol: '☵☱',
    fullName: '泽水困',
    upperTrigram: '兑',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yang'],
    nature: '困顿困厄',
    element: '水',
    description: '困卦象征困顿困厄，困境考验。',
    text: {
      gua: '亨，贞，大人吉，无咎。有言不信。',
      guaTranslation: '困卦亨通，守正则大人吉祥无咎。困顿之中说话难以取信于人。',
      xiang: '泽无水，困。君子以致命遂志。',
      xiangTranslation: '泽中无水干涸，象征困顿。君子应不惜生命以实现志向。'
    },
    application: '身处困境不必气馁。坚守信念与操守，以行动证明自己，终将突围而出。'
  },

  // 48. 井卦（水风井）
  {
    id: 48,
    name: '井',
    symbol: '☴☵',
    fullName: '水风井',
    upperTrigram: '坎',
    lowerTrigram: '巽',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '井水源泉',
    element: '水',
    description: '井卦象征井水源泉，滋养众人。',
    text: {
      gua: '改邑不改井，无丧无得，往来井井。',
      guaTranslation: '村庄可迁移但井不变，无失无得，来往者均可从井中取水。井养不穷。',
      xiang: '木上有水，井。君子以劳民劝相。',
      xiangTranslation: '木上有水，井水之源。君子应慰劳民众并劝勉互助。'
    },
    application: '建立长久受益的基础设施或制度。持之以恒服务他人，利他终将利己。'
  },

  // 49. 革卦（泽火革）
  {
    id: 49,
    name: '革',
    symbol: '☱☲',
    fullName: '泽火革',
    upperTrigram: '兑',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yang', 'yang', 'yin'],
    nature: '变革革新',
    element: '金',
    description: '革卦象征变革革新，改旧换新。',
    text: {
      gua: '已日乃孚，元亨利贞，悔亡。',
      guaTranslation: '革卦在时机成熟时推行变革，心怀诚信则大亨通。变革成功则悔恨消失。',
      xiang: '泽中有火，革。君子以治历明时。',
      xiangTranslation: '泽中有火燃烧，象征变革。君子应修订历法明确时令。'
    },
    application: '变革创新的大好时机。把握天时地利人和推行改革，但须诚信取信于人。'
  },

  // 50. 鼎卦（火风鼎）
  {
    id: 50,
    name: '鼎',
    symbol: '☲☴',
    fullName: '火风鼎',
    upperTrigram: '离',
    lowerTrigram: '巽',
    lines: ['yin', 'yang', 'yang', 'yang', 'yin', 'yang'],
    nature: '鼎器烹饪',
    element: '火',
    description: '鼎卦象征鼎器烹饪，革故鼎新。',
    text: {
      gua: '元吉，亨。',
      guaTranslation: '鼎卦大吉亨通。鼎为重器，象征稳固革新，烹物养人，文明进化。',
      xiang: '木上有火，鼎。君子以正位凝命。',
      xiangTranslation: '木上有火燃烧，鼎器烹煮。君子应端正位置凝聚使命。'
    },
    application: '革故鼎新、建立新秩序的时机。宜树立威信稳固根基，以德服人。'
  },

  // 51. 震卦（震为雷）
  {
    id: 51,
    name: '震',
    symbol: '☳☳',
    fullName: '震为雷',
    upperTrigram: '震',
    lowerTrigram: '震',
    lines: ['yin', 'yin', 'yin', 'yang', 'yin', 'yin'],
    nature: '震动雷动',
    element: '木',
    description: '震卦象征震动雷动，惊醒振奋。',
    text: {
      gua: '亨。震来虩虩，笑言哑哑，震惊百里，不丧匕鬯。',
      guaTranslation: '震卦亨通。雷声传来令人恐惧，继而笑语从容。震惊百里而不失从容。',
      xiang: '洊雷，震。君子以恐惧修省。',
      xiangTranslation: '雷声接连震动，象征震惊。君子应心存敬畏，反省修身。'
    },
    application: '变故震动之象，保持冷静方可从容应对。居安思危，敬畏自然规律。'
  },

  // 52. 艮卦（艮为山）
  {
    id: 52,
    name: '艮',
    symbol: '☶☶',
    fullName: '艮为山',
    upperTrigram: '艮',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yang', 'yin', 'yin'],
    nature: '静止山止',
    element: '土',
    description: '艮卦象征静止山止，适可而止。',
    text: {
      gua: '艮其背，不获其身，行其庭，不见其人，无咎。',
      guaTranslation: '止于背部，看不到身体。行走在庭院中却不见人。止其所当止，无咎。',
      xiang: '兼山，艮。君子以思不出其位。',
      xiangTranslation: '两山并立，静止不动。君子应思考不超出自身职分范围。'
    },
    application: '宜静不宜动，适可而止。审时度势，安守本分，不可贸然行动。'
  },

  // 53. 渐卦（风山渐）
  {
    id: 53,
    name: '渐',
    symbol: '☴☶',
    fullName: '风山渐',
    upperTrigram: '巽',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yin'],
    nature: '渐进渐进',
    element: '木',
    description: '渐卦象征渐进渐进，循序渐进。',
    text: {
      gua: '女归吉，利贞。',
      guaTranslation: '渐卦女子出嫁吉祥，利于守正。如鸿雁飞行有序，循序渐进不急于求成。',
      xiang: '山上有木，渐。君子以居贤德善俗。',
      xiangTranslation: '山上生长树木，象征渐进。君子应以贤德居于高位，改善风俗。'
    },
    application: '循序渐进方可成事。按部就班稳扎稳打，不可急功近利，水到自然渠成。'
  },

  // 54. 归妹卦（雷泽归妹）
  {
    id: 54,
    name: '归妹',
    symbol: '☳☱',
    fullName: '雷泽归妹',
    upperTrigram: '震',
    lowerTrigram: '兑',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '归嫁少女',
    element: '木',
    description: '归妹卦象征归嫁少女，女子出嫁。',
    text: {
      gua: '征凶，无攸利。',
      guaTranslation: '归妹卦前往则凶，无所利。少女急于出嫁不合礼制，躁进有凶。',
      xiang: '泽上有雷，归妹。君子以永终知敝。',
      xiangTranslation: '泽上有雷震动，象征归嫁。君子应谋划长久之道，预知弊端。'
    },
    application: '不宜急于求成或仓促行事。遵循正道与秩序，以长远眼光规划安排。'
  },

  // 55. 丰卦（雷火丰）
  {
    id: 55,
    name: '丰',
    symbol: '☳☲',
    fullName: '雷火丰',
    upperTrigram: '震',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yin', 'yang', 'yin'],
    nature: '丰盛丰盛',
    element: '木',
    description: '丰卦象征丰盛丰盛，盛大丰足。',
    text: {
      gua: '亨，王假之，勿忧，宜日中。',
      guaTranslation: '丰卦亨通，君王可借此丰盛。不必忧虑，宜如日中天般行事。',
      xiang: '雷电皆至，丰。君子以折狱致刑。',
      xiangTranslation: '雷电齐至，盛大丰盛。君子应明断刑狱，公正执法。'
    },
    application: '丰盛圆满之象，事业达到顶峰。但盛极必衰，应居安思危，保持清醒。'
  },

  // 56. 旅卦（火山旅）
  {
    id: 56,
    name: '旅',
    symbol: '☲☶',
    fullName: '火山旅',
    upperTrigram: '离',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yang', 'yin', 'yang'],
    nature: '旅行羁旅',
    element: '火',
    description: '旅卦象征旅行羁旅，在外漂泊。',
    text: {
      gua: '小亨，旅贞吉。',
      guaTranslation: '旅卦小有亨通，在旅途中守正则吉。山上有火如旅人过境，暂居而已。',
      xiang: '山上有火，旅。君子以明慎用刑而不留狱。',
      xiangTranslation: '山上火光闪烁，象征旅居在外。君子应审慎用刑不拖延诉讼。'
    },
    application: '漂泊或过渡时期，宜谦逊低调。谨慎行事不恋栈，灵活适应环境。'
  },

  // 57. 巽卦（巽为风）
  {
    id: 57,
    name: '巽',
    symbol: '☴☴',
    fullName: '巽为风',
    upperTrigram: '巽',
    lowerTrigram: '巽',
    lines: ['yang', 'yang', 'yin', 'yang', 'yang', 'yin'],
    nature: '柔顺风顺',
    element: '木',
    description: '巽卦象征柔顺风顺，随风而动。',
    text: {
      gua: '小亨，利有攸往，利见大人。',
      guaTranslation: '巽卦小有亨通，利于前往做事，利于见大人。风行无孔不入，柔顺之德。',
      xiang: '随风，巽。君子以申命行事。',
      xiangTranslation: '风相随而行，象征柔顺。君子应反复申明政令推行事务。'
    },
    application: '以柔顺方式沟通推进事务。灵活变通如风般渗透，谦逊低调反而有效。'
  },

  // 58. 兑卦（兑为泽）
  {
    id: 58,
    name: '兑',
    symbol: '☱☱',
    fullName: '兑为泽',
    upperTrigram: '兑',
    lowerTrigram: '兑',
    lines: ['yin', 'yang', 'yang', 'yin', 'yang', 'yang'],
    nature: '喜悦泽悦',
    element: '金',
    description: '兑卦象征喜悦泽悦，和悦喜悦。',
    text: {
      gua: '亨，利贞。',
      guaTranslation: '兑卦亨通，利于守正。两泽相连互相滋润，和悦交流之象。',
      xiang: '丽泽，兑。君子以朋友讲习。',
      xiangTranslation: '两泽相连，和悦之象。君子应与朋友讲论学业，互相切磋。'
    },
    application: '和谐愉悦有利于人际交往。以真诚喜悦感染他人，但不可贪图享乐。'
  },

  // 59. 涣卦（风水涣）
  {
    id: 59,
    name: '涣',
    symbol: '☴☵',
    fullName: '风水涣',
    upperTrigram: '巽',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yin', 'yang', 'yang', 'yin'],
    nature: '涣散涣散',
    element: '木',
    description: '涣卦象征涣散涣散，散开涣散。',
    text: {
      gua: '亨。王假有庙，利涉大川，利贞。',
      guaTranslation: '涣卦亨通。君王到宗庙聚合人心，利于涉越大河，利于守正。',
      xiang: '风行水上，涣。先王以享于帝立庙。',
      xiangTranslation: '风吹行于水面之上，象征涣散。先王据此祭祀上帝建立宗庙以聚人心。'
    },
    application: '涣散之象需以统一信念凝聚人心。化解矛盾，消除隔阂，重建团结。'
  },

  // 60. 节卦（水泽节）
  {
    id: 60,
    name: '节',
    symbol: '☵☱',
    fullName: '水泽节',
    upperTrigram: '坎',
    lowerTrigram: '兑',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yin'],
    nature: '节制节制',
    element: '水',
    description: '节卦象征节制节制，适度节制。',
    text: {
      gua: '亨。苦节不可贞。',
      guaTranslation: '节卦亨通。但过度苦涩的节制不可长久。适度的节制才是长久之道。',
      xiang: '泽上有水，节。君子以制数度，议德行。',
      xiangTranslation: '泽上有水，须加以节制。君子应制定制度法度，议定德行规范。'
    },
    application: '适度节制是长久之道。凡事把握分寸，不可纵欲也不可苦行，中庸为佳。'
  },

  // 61. 中孚卦（风泽中孚）
  {
    id: 61,
    name: '中孚',
    symbol: '☴☱',
    fullName: '风泽中孚',
    upperTrigram: '巽',
    lowerTrigram: '兑',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yang'],
    nature: '诚信中正',
    element: '木',
    description: '中孚卦象征诚信中正，诚信感化。',
    text: {
      gua: '豚鱼吉，利涉大川，利贞。',
      guaTranslation: '中孚卦诚信及于豚鱼则吉，利于涉越大河。内心诚实力可感化万物。',
      xiang: '泽上有风，中孚。君子以议狱缓死。',
      xiangTranslation: '泽上有风吹拂，象征诚信。君子应审慎议狱，宽缓死刑。'
    },
    application: '诚信是最好的策略。以真诚之心待人处事，以德信感化他人，大事可成。'
  },

  // 62. 小过卦（雷山小过）
  {
    id: 62,
    name: '小过',
    symbol: '☳☶',
    fullName: '雷山小过',
    upperTrigram: '震',
    lowerTrigram: '艮',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yang'],
    nature: '小有过越',
    element: '木',
    description: '小过卦象征小有过越，稍有过度。',
    text: {
      gua: '亨，利贞，可小事不可大事。飞鸟遗之音，不宜上宜下，大吉。',
      guaTranslation: '小过卦亨通利于守正，可做小事不可做大事。飞鸟遗音提醒宜下不宜上。',
      xiang: '山上有雷，小过。君子以行过乎恭，丧过乎哀，用过乎俭。',
      xiangTranslation: '山上有雷声，小有过越。君子行事应过于恭敬，居丧过于哀伤，用度过于节俭。'
    },
    application: '宜做小事不宜图大。谦虚低调行事，宁可多做不可冒进，以柔克刚。'
  },

  // 63. 既济卦（水火既济）
  {
    id: 63,
    name: '既济',
    symbol: '☵☲',
    fullName: '水火既济',
    upperTrigram: '坎',
    lowerTrigram: '离',
    lines: ['yang', 'yin', 'yang', 'yin', 'yang', 'yin'],
    nature: '已完成',
    element: '水',
    description: '既济卦象征已完成，事情成功。',
    text: {
      gua: '亨小，利贞，初吉终乱。',
      guaTranslation: '既济卦小事亨通，利于守正。初时吉祥但终将混乱，成功后须谨慎守成。',
      xiang: '水在火上，既济。君子以思患而预防之。',
      xiangTranslation: '水在火上烹煮，象征成功。君子应居安思危，防患于未然。'
    },
    application: '成功之后更需谨慎。居安思危防患未然，不可因胜利而放松警惕。'
  },

  // 64. 未济卦（火水未济）
  {
    id: 64,
    name: '未济',
    symbol: '☲☵',
    fullName: '火水未济',
    upperTrigram: '离',
    lowerTrigram: '坎',
    lines: ['yin', 'yang', 'yin', 'yang', 'yin', 'yang'],
    nature: '未完成',
    element: '火',
    description: '未济卦象征未完成，尚需努力。',
    text: {
      gua: '亨，小狐汔济，濡其尾，无攸利。',
      guaTranslation: '未济卦亨通。小狐狸即将渡过河却打湿了尾巴，无所利。事未竟需善终。',
      xiang: '火在水上，未济。君子以慎辨物居方。',
      xiangTranslation: '火在水上不能烹煮，象征未完成。君子应审慎辨别事物，安处其位。'
    },
    application: '事物尚未完成，仍需努力。不可半途而废，谨慎辨别方向坚持到底。'
  }
];

// 导出数据
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HEXAGRAMS;
}